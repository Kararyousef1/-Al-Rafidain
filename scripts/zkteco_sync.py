#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# ============================================================================
# زد تيكو ZKTeco iFace950 Plus - Windows Service
# مزامنة البصمات مع Supabase عبر Edge Function
# تدعم ADMS + TCP/IP معاً
# ============================================================================

"""
نظام مزامنة بصمات ZKTeco iFace950 Plus
=======================================
يدعم 3 طرق:
1. ADMS: الجهاز يرسل البصمات لـ Edge Function (Supabase)
2. TCP/IP: Python يتصل بالجهاز ويسحب البصمات
3. الدمج: ADMS أساسي + Python احتياطي

يعمل كـ Windows Service تلقائياً
يسجل كل خطأ في sync_log وملفات السجل المحلية
"""

import asyncio
import base64
import json
import os
import sys
import time
import hashlib
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional, Dict, Any, List

# ============================================================================
# إعدادات البيئة والتسجيل
# ============================================================================

LOG_DIR = Path(__file__).parent.parent / "logs"
LOG_DIR.mkdir(exist_ok=True)

LOG_FILE = LOG_DIR / "zkteco_sync.log"
ERROR_LOG_FILE = LOG_DIR / "zkteco_error.log"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger("ZKTeco_Sync")

# ============================================================================
# محاولة استيراد المكتبات المطلوبة
# ============================================================================

try:
    import requests
    from requests.exceptions import RequestException, ConnectionError, Timeout
except ImportError:
    logger.error("مكتبة requests غير مثبتة. قم بتشغيل: pip install requests")
    sys.exit(1)

try:
    import pyzk
    from pyzk.zk import ZK
    from pyzk.exception import ZKError, ZKNetworkError
except ImportError:
    logger.warning("مكتبة pyzk غير مثبتة. سيتم تعطيل اتصال TCP/IP.")
    logger.warning("قم بتشغيل: pip install pyzk")
    pyzk = None

try:
    import schedule
except ImportError:
    logger.warning("مكتبة schedule غير مثبتة. سيتم استخدام while loop بدلاً من ذلك.")
    logger.warning("قم بتشغيل: pip install schedule")
    schedule = None

try:
    from cryptography.fernet import Fernet
except ImportError:
    logger.warning("مكتبة cryptography غير مثبتة. سيتم حفظ الإعدادات بدون تشفير.")
    logger.warning("قم بتشغيل: pip install cryptography")
    Fernet = None

# ============================================================================
# ملف الإعدادات
# ============================================================================

CONFIG_FILE = Path(__file__).parent / "zkteco_config.json"
ENCRYPTED_CONFIG_FILE = Path(__file__).parent / "zkteco_config.enc"
BACKUP_FILE_DIR = Path(__file__).parent / "backup"

class Config:
    """إدارة إعدادات النظام - مشفرة أو نصية"""

    def __init__(self):
        self.config: Dict[str, Any] = {}
        self._key = None
        self.load()

    def _get_fernet_key(self) -> bytes:
        """توليد مفتاح تشفير من متغير بيئة"""
        if self._key:
            return self._key
        base_key = os.getenv("ZKTECO_ENCRYPTION_KEY", "").encode() or b"fallback_dev_only_key_32bytes!!"
        self._key = base64.urlsafe_b64encode(hashlib.sha256(base_key).digest())
        return self._key

    def load(self):
        """تحميل الإعدادات"""
        if ENCRYPTED_CONFIG_FILE.exists() and Fernet:
            try:
                cipher = Fernet(self._get_fernet_key())
                encrypted_data = ENCRYPTED_CONFIG_FILE.read_bytes()
                decrypted_data = cipher.decrypt(encrypted_data)
                self.config = json.loads(decrypted_data.decode("utf-8"))
                logger.info("تم تحميل الإعدادات من الملف المشفر")
                return
            except Exception as e:
                logger.error(f"فشل تحميل الملف المشفر: {e}")

        if CONFIG_FILE.exists():
            try:
                with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                    self.config = json.load(f)
                logger.info("تم تحميل الإعدادات من الملف النصي")
            except Exception as e:
                logger.error(f"فشل تحميل الإعدادات: {e}")
                self.config = self._get_defaults()
        else:
            logger.warning("لم يتم العثور على ملف الإعدادات. استخدام الإعدادات الافتراضية.")
            self.config = self._get_defaults()
            self.save()

    def save(self):
        """حفظ الإعدادات"""
        if Fernet:
            try:
                cipher = Fernet(self._get_fernet_key())
                encrypted_data = cipher.encrypt(
                    json.dumps(self.config, ensure_ascii=False).encode("utf-8")
                )
                ENCRYPTED_CONFIG_FILE.write_bytes(encrypted_data)
                logger.info("تم حفظ الإعدادات مشفرة")
            except Exception as e:
                logger.error(f"فشل حفظ الإعدادات المشفرة: {e}")
        else:
            with open(CONFIG_FILE, "w", encoding="utf-8") as f:
                json.dump(self.config, f, ensure_ascii=False, indent=2)
            logger.info("تم حفظ الإعدادات نصية")

    def _get_defaults(self) -> Dict[str, Any]:
        """الإعدادات الافتراضية"""
        supabase_url = os.getenv("SUPABASE_URL", "").rstrip("/")
        # Built Edge Function URL (default: {SUPABASE_URL}/functions/v1/zkteco-sync)
        edge_function_url = os.getenv("EDGE_FUNCTION_URL", f"{supabase_url}/functions/v1/zkteco-sync" if supabase_url else "")

        return {
            "supabase": {
                "url": supabase_url,
                "anon_key": os.getenv("SUPABASE_ANON_KEY", ""),
                "service_role_key": os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
            },
            "device": {
                "ip": os.getenv("ZK_IP", "192.168.1.201"),
                "port": int(os.getenv("ZK_PORT", "4370")),
                "timeout": int(os.getenv("ZK_TIMEOUT", "30")),
                "model": "iFace950 Plus"
            },
            "sync": {
                "mode": os.getenv("SYNC_MODE", "both"),
                "interval_seconds": int(os.getenv("SYNC_INTERVAL", "60")),
                "backup_enabled": True,
                "max_records_per_sync": 100,
                "use_edge_function": True,  # استخدام Edge Function بدلاً من REST API المباشر
                "edge_function_url": edge_function_url,
                "edge_function_secret": os.getenv("ADMS_SECRET", ""),
            },
            "adms": {
                "enabled": True,
                "endpoint": os.getenv("ADMS_ENDPOINT", ""),
                "secret": os.getenv("ADMS_SECRET", "")
            },
            "retry": {
                "max_attempts": 3,
                "delay_seconds": 10
            }
        }

    def get(self, key: str, default=None):
        """الحصول على قيمة إعداد"""
        keys = key.split(".")
        value = self.config
        for k in keys:
            if isinstance(value, dict):
                value = value.get(k)
            else:
                return default
        return value if value is not None else default

    def set(self, key: str, value):
        """تعيين قيمة إعداد"""
        keys = key.split(".")
        target = self.config
        for k in keys[:-1]:
            if k not in target:
                target[k] = {}
            target = target[k]
        target[keys[-1]] = value
        self.save()


# ============================================================================
# مزامن البصمات الرئيسي
# ============================================================================

class ZKTecoSyncer:
    """الفئة الرئيسية لمزامنة البصمات"""

    def __init__(self):
        self.config = Config()
        self.supabase_url = self.config.get("supabase.url", "")
        self.supabase_key = self.config.get("supabase.service_role_key", "")
        self.device_ip = self.config.get("device.ip", "192.168.1.201")
        self.device_port = self.config.get("device.port", 4370)
        self.device_timeout = self.config.get("device.timeout", 30)
        self.sync_interval = self.config.get("sync.interval_seconds", 60)
        self.sync_mode = self.config.get("sync.mode", "both")
        self.adms_enabled = self.config.get("adms.enabled", True)
        self.adms_endpoint = self.config.get("adms.endpoint", "")
        self.max_retries = self.config.get("retry.max_attempts", 3)
        self.backup_enabled = self.config.get("sync.backup_enabled", True)

        # Edge Function settings
        self.use_edge_function = self.config.get("sync.use_edge_function", True)
        self.edge_function_url = self.config.get("sync.edge_function_url", "")
        self.edge_function_secret = self.config.get("sync.edge_function_secret", "")

        self.running = False
        self.last_sync_time: Optional[datetime] = None
        self.device_connection: Optional[Any] = None
        self.session = requests.Session()
        self._sync_stats = {
            "total_synced": 0,
            "total_errors": 0,
            "total_backups": 0,
            "start_time": datetime.now(),
        }

        # تجهيز مجلد النسخ الاحتياطي
        if self.backup_enabled:
            BACKUP_FILE_DIR.mkdir(parents=True, exist_ok=True)

        # التحقق من صحة الإعدادات
        self._validate_config()

    def _validate_config(self):
        """التحقق من صحة الإعدادات الأساسية"""
        if not self.supabase_url or not self.supabase_key:
            logger.error("⚠️  إعدادات Supabase غير مكتملة!")
            logger.error("تأكد من وجود SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY")

        if self.use_edge_function and not self.edge_function_url:
            logger.warning("⚠️  Edge Function مفعّلة ولكن الرابط غير موجود!")
            logger.warning("سيتم استخدام REST API المباشر.")
            self.use_edge_function = False

        if self.sync_mode in ("tcp", "both") and pyzk is None:
            logger.warning("⚠️  وضع TCP/IP مفعّل ولكن مكتبة pyzk غير مثبتة!")
            logger.warning("سيتم استخدام وضع ADMS فقط.")

        logger.info(f"📋 وضع المزامنة: {self.sync_mode}")
        logger.info(f"☁️  Edge Function: {'مفعلة' if self.use_edge_function else 'غير مفعلة'}")
        if self.use_edge_function:
            logger.info(f"   الرابط: {self.edge_function_url}")

    # ==========================================================================
    # الاتصال بجهاز البصمة عبر TCP/IP
    # ==========================================================================

    async def connect_device(self) -> bool:
        """الاتصال بجهاز ZKTeco عبر TCP/IP"""
        if pyzk is None:
            logger.error("لا يمكن الاتصال: مكتبة pyzk غير مثبتة")
            return False

        try:
            logger.info(f"🔌 محاولة الاتصال بالجهاز {self.device_ip}:{self.device_port}...")

            self.device_connection = ZK(
                self.device_ip,
                port=self.device_port,
                timeout=self.device_timeout,
                password=0,
                verbose=True
            )

            conn = await self.device_connection.connect()
            if conn:
                logger.info(f"✅ تم الاتصال بالجهاز بنجاح")
                try:
                    firmware = await conn.get_firmware_version()
                    serial = await conn.get_serial_number()
                    device_name = await conn.get_device_name()
                    logger.info(f"📟 الجهاز: {device_name}")
                    logger.info(f"🔢 الرقم التسلسلي: {serial}")
                    logger.info(f"📋 إصدار البرنامج: {firmware}")
                except Exception as e:
                    logger.warning(f"لم نتمكن من الحصول على معلومات الجهاز: {e}")
                return True
            else:
                logger.error("❌ فشل الاتصال بالجهاز")
                return False

        except ZKNetworkError as e:
            logger.error(f"❌ خطأ في الشبكة: {e}")
            return False
        except ZKError as e:
            logger.error(f"❌ خطأ من الجهاز: {e}")
            return False
        except Exception as e:
            logger.error(f"❌ خطأ غير متوقع: {e}")
            return False

    async def disconnect_device(self):
        """قطع الاتصال بجهاز البصمة"""
        if self.device_connection:
            try:
                await self.device_connection.disconnect()
                logger.info("🔌 تم قطع الاتصال بالجهاز")
            except Exception as e:
                logger.warning(f"خطأ أثناء قطع الاتصال: {e}")
            finally:
                self.device_connection = None

    # ==========================================================================
    # سحب البصمات من الجهاز
    # ==========================================================================

    async def fetch_attendance_from_device(self) -> List[Dict[str, Any]]:
        """سحب سجلات الحضور من جهاز البصمة"""
        if not self.device_connection:
            if not await self.connect_device():
                return []

        records = []
        try:
            logger.info("📥 جاري سحب البصمات من الجهاز...")

            attendance = await self.device_connection.get_attendance()

            if not attendance:
                logger.info("📭 لا توجد بصمات جديدة")
                return []

            logger.info(f"📊 تم استلام {len(attendance)} بصمة")

            for record in attendance:
                punch_record = {
                    "employee_code": str(record.user_id),
                    "punch_time": record.timestamp.isoformat(),
                    "punch_type": "check-in" if record.status == 0 else "check-out",
                    "device_id": f"ZKTeco_{self.device_ip}",
                    "verification_type": self._map_verification_type(record.mask),
                    "source": "Python",
                    "raw_data": json.dumps({
                        "user_id": record.user_id,
                        "status": record.status,
                        "punch": record.punch,
                        "mask": record.mask
                    })
                }
                records.append(punch_record)

            # مسح البصمات المقروءة من الجهاز
            await self.device_connection.clear_attendance()
            logger.info("🧹 تم مسح البصمات المقروءة من الجهاز")

            return records

        except ZKError as e:
            logger.error(f"❌ خطأ من الجهاز أثناء سحب البصمات: {e}")
            return []
        except Exception as e:
            logger.error(f"❌ خطأ غير متوقع أثناء سحب البصمات: {e}")
            return []

    def _map_verification_type(self, mask: int) -> str:
        """تحويل كود التحقق من الجهاز إلى النص المقابل"""
        verification_map = {
            0: "finger",
            1: "face",
            2: "card",
            3: "password",
        }
        return verification_map.get(mask, "finger")

    # ==========================================================================
    # إرسال البصمات إلى Supabase (عبر Edge Function أو REST API)
    # ==========================================================================

    def sync_attendance_to_supabase(self, records: List[Dict[str, Any]]) -> int:
        """إرسال سجلات الحضور إلى Supabase عبر Edge Function أو REST API"""
        if not records:
            return 0

        synced_count = 0
        errors = []

        # استخدام Edge Function للـ bulk
        if self.use_edge_function and len(records) > 1:
            success, error = self._send_bulk_via_edge_function(records)
            if success:
                synced_count = len(records)
            else:
                errors.append(error)
                # fallback إلى الإرسال الفردي
                logger.warning("⚠️  Edge Function فشلت، جرب الإرسال الفردي...")
                for record in records:
                    s, e = self._send_single_record(record)
                    if s:
                        synced_count += 1
                    else:
                        errors.append(e)
        else:
            for record in records:
                success, error = self._send_single_record(record)
                if success:
                    synced_count += 1
                else:
                    errors.append(error)

        self._sync_stats["total_synced"] += synced_count
        self._sync_stats["total_errors"] += len(errors)

        self._log_sync_result(synced_count, len(records), errors)
        return synced_count

    def _send_bulk_via_edge_function(self, records: List[Dict[str, Any]]) -> tuple:
        """إرسال بصمات متعددة عبر Edge Function"""
        url = f"{self.edge_function_url}/api/punch/bulk"

        headers = {
            "Content-Type": "application/json",
            "apikey": self.supabase_key,
            "Authorization": f"Bearer {self.supabase_key}",
        }

        # إضافة التوقيع السري إذا كان موجوداً
        if self.edge_function_secret:
            headers["x-app-secret"] = self.edge_function_secret

        payload = {"records": records}

        for attempt in range(self.max_retries):
            try:
                response = self.session.post(
                    url,
                    headers=headers,
                    json=payload,
                    timeout=30
                )

                if response.status_code in (200, 207):
                    result = response.json()
                    synced = result.get("synced", 0)
                    if synced == len(records):
                        return True, None
                    else:
                        return False, f"تمت مزامنة {synced} من {len(records)}"
                else:
                    error_msg = f"Edge Function HTTP {response.status_code}: {response.text[:200]}"
                    if attempt < self.max_retries - 1:
                        wait = self.config.get("retry.delay_seconds", 10)
                        logger.warning(f"⚠️  محاولة {attempt + 1} فشلت: {error_msg}")
                        time.sleep(wait)
                    else:
                        return False, error_msg

            except (ConnectionError, Timeout) as e:
                if attempt < self.max_retries - 1:
                    wait = self.config.get("retry.delay_seconds", 10)
                    logger.warning(f"⚠️  خطأ شبكة (محاولة {attempt + 1}): {e}")
                    time.sleep(wait)
                else:
                    return False, str(e)
            except Exception as e:
                return False, str(e)

        return False, "فشلت كل المحاولات"

    def _send_single_record(self, record: Dict[str, Any]) -> tuple:
        """إرسال سجل بصمة واحد إلى Supabase"""
        if self.use_edge_function:
            url = f"{self.edge_function_url}/api/punch"
        else:
            url = f"{self.supabase_url}/rest/v1/attendance_logs"

        headers = {
            "apikey": self.supabase_key,
            "Authorization": f"Bearer {self.supabase_key}",
            "Content-Type": "application/json",
        }

        if self.use_edge_function:
            if self.edge_function_secret:
                headers["x-app-secret"] = self.edge_function_secret
            # Edge Function تستقبل employee_code بدلاً من employee_id
            payload = {
                "employee_code": record.get("employee_code"),
                "punch_time": record.get("punch_time"),
                "punch_type": record.get("punch_type", "check-in"),
                "verification_type": record.get("verification_type", "finger"),
                "device_id": record.get("device_id"),
            }
        else:
            headers["Prefer"] = "resolution=merge-duplicates"
            payload = record

        for attempt in range(self.max_retries):
            try:
                response = self.session.post(
                    url,
                    headers=headers,
                    json=payload,
                    timeout=10
                )

                if response.status_code in (200, 201):
                    return True, None
                elif response.status_code in (409, 207):
                    # سجل مكرر أو معالج جزئياً - هذا طبيعي
                    return True, None
                else:
                    error_msg = f"HTTP {response.status_code}: {response.text[:200]}"
                    if attempt < self.max_retries - 1:
                        wait = self.config.get("retry.delay_seconds", 10)
                        logger.warning(f"⚠️  محاولة {attempt + 1} فشلت: {error_msg}")
                        time.sleep(wait)
                    else:
                        return False, error_msg

            except (ConnectionError, Timeout) as e:
                if attempt < self.max_retries - 1:
                    wait = self.config.get("retry.delay_seconds", 10)
                    logger.warning(f"⚠️  خطأ شبكة (محاولة {attempt + 1}): {e}")
                    time.sleep(wait)
                else:
                    return False, str(e)
            except RequestException as e:
                if attempt < self.max_retries - 1:
                    wait = self.config.get("retry.delay_seconds", 10)
                    logger.warning(f"⚠️  خطأ طلب (محاولة {attempt + 1}): {e}")
                    time.sleep(wait)
                else:
                    return False, str(e)

        return False, "فشلت كل المحاولات"

    def _log_sync_result(self, synced: int, total: int, errors: List[str]):
        """تسجيل نتيجة المزامنة في sync_log"""
        status = "success" if not errors else "error"

        log_entry = {
            "sync_time": datetime.utcnow().isoformat(),
            "source": "Python",
            "device_id": f"ZKTeco_{self.device_ip}",
            "records_synced": synced,
            "status": status,
            "error_message": "; ".join(errors[:5]) if errors else None,
            "details": {
                "total_attempted": total,
                "errors_count": len(errors),
                "mode": self.sync_mode,
                "use_edge_function": self.use_edge_function,
            }
        }

        # تسجيل في Supabase
        url = f"{self.supabase_url}/rest/v1/sync_log"
        headers = {
            "apikey": self.supabase_key,
            "Authorization": f"Bearer {self.supabase_key}",
            "Content-Type": "application/json"
        }

        try:
            self.session.post(url, headers=headers, json=log_entry, timeout=5)
        except Exception:
            pass

        if errors:
            logger.error(f"❌ تمت المزامنة مع {len(errors)} خطأ")
            for err in errors[:3]:
                logger.error(f"   - {err}")
        else:
            logger.info(f"✅ تمت المزامنة بنجاح: {synced} من {total} سجل")

    # ==========================================================================
    # النسخ الاحتياطي المحلي
    # ==========================================================================

    def save_backup(self, records: List[Dict[str, Any]]):
        """حفظ نسخة احتياطية محلية عند انقطاع الإنترنت"""
        if not self.backup_enabled or not records:
            return

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_file = BACKUP_FILE_DIR / f"attendance_backup_{timestamp}.json"

        try:
            backup_data = {
                "timestamp": timestamp,
                "device_ip": self.device_ip,
                "records_count": len(records),
                "records": records
            }

            with open(backup_file, "w", encoding="utf-8") as f:
                json.dump(backup_data, f, ensure_ascii=False, indent=2)

            self._sync_stats["total_backups"] += 1
            logger.info(f"💾 تم حفظ نسخة احتياطية: {backup_file.name}")
        except Exception as e:
            logger.error(f"❌ فشل حفظ النسخة الاحتياطية: {e}")

    def sync_pending_backups(self):
        """مزامنة النسخ الاحتياطية المعلقة عند عودة الإنترنت"""
        if not self.backup_enabled:
            return

        backup_files = sorted(BACKUP_FILE_DIR.glob("attendance_backup_*.json"))

        if not backup_files:
            return

        logger.info(f"📂 يوجد {len(backup_files)} ملف نسخ احتياطي معلق...")

        for backup_file in backup_files:
            try:
                with open(backup_file, "r", encoding="utf-8") as f:
                    backup_data = json.load(f)

                records = backup_data.get("records", [])
                if records:
                    synced = self.sync_attendance_to_supabase(records)
                    logger.info(f"🔄 تمت مزامنة {synced} من {len(records)} من {backup_file.name}")

                backup_file.unlink()
                logger.info(f"🗑️ تم حذف {backup_file.name} بعد المزامنة")

            except Exception as e:
                logger.error(f"❌ فشل مزامنة {backup_file.name}: {e}")

    # ==========================================================================
    # وضع ADMS (استقبال البصمات)
    # ==========================================================================

    def handle_adms_punch(self, punch_data: Dict[str, Any]) -> Dict[str, Any]:
        """معالجة بصمة واردة من ADMS"""
        try:
            # التحقق من التوقيع
            secret = self.config.get("adms.secret", "")
            if secret and punch_data.get("secret") != secret:
                return {"success": False, "error": "توقيع غير صالح"}

            # إرسال إلى Edge Function (أو مباشرة)
            record = {
                "employee_code": punch_data.get("employee_code"),
                "punch_time": punch_data.get("punch_time"),
                "punch_type": punch_data.get("punch_type", "check-in"),
                "device_id": punch_data.get("device_id", f"ADMS_{self.device_ip}"),
                "verification_type": punch_data.get("verification_type", "finger"),
                "source": "ADMS",
            }

            success, error = self._send_single_record(record)

            if success:
                return {"success": True, "message": "تم استلام البصمة"}
            else:
                return {"success": False, "error": error}

        except Exception as e:
            logger.error(f"❌ خطأ في معالجة بصمة ADMS: {e}")
            return {"success": False, "error": str(e)}

    # ==========================================================================
    # دورة المزامنة الرئيسية
    # ==========================================================================

    async def sync_cycle(self):
        """دورة المزامنة الكاملة"""
        logger.info("=" * 60)
        logger.info("🔄 بدء دورة المزامنة...")
        logger.info(f"⏱️  الوقت: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        logger.info(f"📋 وضع المزامنة: {self.sync_mode}")

        all_records = []

        # 1. مزامنة النسخ الاحتياطية المعلقة
        try:
            self.sync_pending_backups()
        except Exception as e:
            logger.error(f"❌ خطأ في مزامنة النسخ الاحتياطية: {e}")

        # 2. سحب البصمات من الجهاز (إذا كان TCP/IP مفعّلاً)
        if self.sync_mode in ("tcp", "both") and pyzk is not None:
            try:
                records = await self.fetch_attendance_from_device()
                all_records.extend(records)
            except Exception as e:
                logger.error(f"❌ خطأ في سحب البصمات من الجهاز: {e}")
                if self.backup_enabled:
                    logger.warning("💾 سيتم حفظ في النسخة الاحتياطية...")
        else:
            logger.info("⏭️  وضع TCP/IP غير مفعّل أو غير متاح")

        # 3. إرسال البصمات إلى Supabase
        if all_records:
            logger.info(f"📤 جاري إرسال {len(all_records)} بصمة إلى Supabase...")
            synced = self.sync_attendance_to_supabase(all_records)

            if synced < len(all_records) and self.backup_enabled:
                unsynced = all_records[synced:]
                self.save_backup(unsynced)
        else:
            logger.info("📭 لا توجد بصمات جديدة للمزامنة")

        self.last_sync_time = datetime.now()
        elapsed = (datetime.now() - self._sync_stats["start_time"]).total_seconds()
        logger.info(f"✅ اكتملت دورة المزامنة في {datetime.now().strftime('%H:%M:%S')}")
        logger.info(f"📊 إحصائيات: {self._sync_stats['total_synced']} بصمة | "
                    f"{self._sync_stats['total_errors']} خطأ | "
                    f"{self._sync_stats['total_backups']} نسخة احتياطية | "
                    f"{elapsed:.0f} ثانية منذ البداية")

    # ==========================================================================
    # تشغيل الخدمة
    # ==========================================================================

    def get_stats(self) -> Dict[str, Any]:
        """الحصول على إحصائيات المزامنة"""
        return {
            "device_ip": self.device_ip,
            "sync_mode": self.sync_mode,
            "use_edge_function": self.use_edge_function,
            "last_sync_time": self.last_sync_time.isoformat() if self.last_sync_time else None,
            "total_synced": self._sync_stats["total_synced"],
            "total_errors": self._sync_stats["total_errors"],
            "total_backups": self._sync_stats["total_backups"],
            "uptime_seconds": (datetime.now() - self._sync_stats["start_time"]).total_seconds(),
            "is_running": self.running,
            "is_connected": self.device_connection is not None,
        }

    async def run_continuous(self):
        """تشغيل المزامنة المستمرة"""
        self.running = True
        logger.info("=" * 60)
        logger.info("🚀 بدء خدمة مزامنة بصمات ZKTeco")
        logger.info(f"📟 الجهاز: {self.device_ip}:{self.device_port}")
        logger.info(f"⏱️  الفاصل الزمني: {self.sync_interval} ثانية")
        logger.info(f"📋 وضع المزامنة: {self.sync_mode}")
        logger.info(f"☁️  Edge Function: {'مفعلة' if self.use_edge_function else 'غير مفعلة'}")
        logger.info("=" * 60)

        # تنفيذ دورة فورية عند البدء
        await self.sync_cycle()

        # الحلقات المتتالية
        if schedule:
            schedule.every(self.sync_interval).seconds.do(
                lambda: asyncio.create_task(self.sync_cycle())
            )

            while self.running:
                schedule.run_pending()
                await asyncio.sleep(1)
        else:
            while self.running:
                await asyncio.sleep(self.sync_interval)
                await self.sync_cycle()

    def stop(self):
        """إيقاف الخدمة"""
        self.running = False
        logger.info("🛑 تم إيقاف الخدمة")


# ============================================================================
# خادم HTTP صغير لاستقبال بصمات ADMS
# ============================================================================

class ADMSServer:
    """خادم HTTP لاستقبال بصمات ADMS"""

    def __init__(self, syncer: ZKTecoSyncer, host: str = "0.0.0.0", port: int = 8080):
        self.syncer = syncer
        self.host = host
        self.port = port
        self.running = False

    async def start(self):
        """بدء الخادم"""
        try:
            from aiohttp import web
        except ImportError:
            logger.warning("⚠️  مكتبة aiohttp غير مثبتة. تعطيل خادم ADMS المحلي.")
            logger.warning("قم بتشغيل: pip install aiohttp")
            return

        app = web.Application()
        app.router.add_post("/api/punch", self.handle_punch)
        app.router.add_get("/api/health", self.handle_health)
        app.router.add_get("/api/stats", self.handle_stats)

        runner = web.AppRunner(app)
        await runner.setup()
        site = web.TCPSite(runner, self.host, self.port)

        self.running = True
        await site.start()
        logger.info(f"🌐 خادم ADMS يعمل على http://{self.host}:{self.port}")
        logger.info(f"   POST /api/punch - استقبال بصمة")
        logger.info(f"   GET  /api/health - فحص الصحة")
        logger.info(f"   GET  /api/stats - إحصائيات")

    async def handle_punch(self, request):
        """معالجة بصمة واردة من ADMS"""
        try:
            data = await request.json()
            logger.debug(f"📩 استقبال بصمة ADMS: {data.get('employee_code')}")

            result = self.syncer.handle_adms_punch(data)

            if result["success"]:
                return web.json_response(result, status=200)
            else:
                return web.json_response(result, status=400)

        except Exception as e:
            logger.error(f"❌ خطأ في معالجة طلب ADMS: {e}")
            return web.json_response(
                {"success": False, "error": str(e)},
                status=500
            )

    async def handle_health(self, request):
        """فحص صحة الخدمة"""
        return web.json_response({
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "device_ip": self.syncer.device_ip,
            "sync_mode": self.syncer.sync_mode,
            "use_edge_function": self.syncer.use_edge_function,
            "last_sync": self.syncer.last_sync_time.isoformat() if self.syncer.last_sync_time else None,
            "uptime": str(datetime.now() - self.syncer._sync_stats["start_time"]),
        })

    async def handle_stats(self, request):
        """إحصائيات المزامنة"""
        return web.json_response(self.syncer.get_stats())


# ============================================================================
# نقطة الدخول الرئيسية
# ============================================================================

async def main():
    """النقطة الرئيسية لتشغيل الخدمة"""
    syncer = ZKTecoSyncer()
    adms_server = ADMSServer(syncer)

    try:
        # تشغيل خادم ADMS المحلي إذا كان مفعّلاً
        if syncer.adms_enabled:
            try:
                await adms_server.start()
            except ImportError:
                logger.warning("⚠️  مكتبة aiohttp غير مثبتة. تعطيل خادم ADMS المحلي.")
            except Exception as e:
                logger.error(f"❌ فشل تشغيل خادم ADMS المحلي: {e}")

        # تشغيل دورة المزامنة الرئيسية
        await syncer.run_continuous()

    except KeyboardInterrupt:
        logger.info("👋 تم إيقاف الخدمة بواسطة المستخدم")
    except Exception as e:
        logger.error(f"❌ خطأ غير متوقع: {e}")
    finally:
        syncer.stop()
        await syncer.disconnect_device()
        logger.info("👋 إنهاء الخدمة")


if __name__ == "__main__":
    # التحقق من Python 3.7+
    if sys.version_info < (3, 7):
        logger.error("❌ يتطلب Python 3.7 أو أحدث")
        sys.exit(1)

    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("👋 تم إيقاف الخدمة")
    except Exception as e:
        logger.error(f"❌ خطأ فادح: {e}")
        sys.exit(1)