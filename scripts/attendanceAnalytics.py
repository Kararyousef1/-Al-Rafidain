#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# ============================================================================
# وادي الرافدين للإنتاج الدوائي - HR System
# التحليل الذكي للحضور
# pandas + scikit-learn + prophet
# يُحدّث ai_insights تلقائياً كل 24 ساعة
# ============================================================================

"""
نظام التحليل الذكي للحضور
=========================
- تحليل أنماط الحضور
- كشف الشذوذ (Anomaly Detection)
- التنبؤ بالغياب (Prediction)
- تحليل الأقسام
- تقرير صحة القوى العاملة
"""

import json
import os
import sys
import logging
from datetime import datetime, timedelta, date
from typing import Optional, Dict, Any, List, Tuple
from pathlib import Path
import traceback

# ============================================================================
# إعدادات التسجيل
# ============================================================================

LOG_DIR = Path(__file__).parent.parent / "logs"
LOG_DIR.mkdir(exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | AI | %(levelname)-8s | %(message)s",
    handlers=[
        logging.FileHandler(LOG_DIR / "ai_analytics.log", encoding="utf-8"),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger("AI_Analytics")

# ============================================================================
# محاولة استيراد المكتبات
# ============================================================================

try:
    import requests
    from requests.exceptions import RequestException
except ImportError:
    logger.error("❌ مكتبة requests غير مثبتة: pip install requests")
    sys.exit(1)

try:
    import pandas as pd
    import numpy as np
    from sklearn.ensemble import IsolationForest
    from sklearn.preprocessing import StandardScaler
except ImportError:
    logger.error("❌ مكتبات التحليل غير مثبتة: pip install pandas numpy scikit-learn")
    sys.exit(1)

try:
    from prophet import Prophet
except ImportError:
    logger.warning("⚠️  مكتبة prophet غير مثبتة. سيتم تعطيل التنبؤات.")
    logger.warning("قم بتشغيل: pip install prophet")
    Prophet = None

# ============================================================================
# إعدادات Supabase
# ============================================================================

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    logger.error("❌ إعدادات Supabase مفقودة!")
    logger.error("تأكد من SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY")
    sys.exit(1)

HEADERS = {
    "apikey": SUPABASE_SERVICE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "count=exact"
}


# ============================================================================
# دوال مساعدة لـ Supabase API
# ============================================================================

def fetch_from_supabase(table: str, query: str = "", limit: int = 10000) -> List[Dict]:
    """جلب بيانات من Supabase"""
    url = f"{SUPABASE_URL}/rest/v1/{table}{query}"
    headers = {**HEADERS, "Range": f"0-{limit}"}

    try:
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        return response.json()
    except RequestException as e:
        logger.error(f"❌ فشل جلب {table}: {e}")
        return []


def upsert_to_supabase(table: str, records: List[Dict]) -> bool:
    """إدراج أو تحديث بيانات في Supabase"""
    if not records:
        return True

    url = f"{SUPABASE_URL}/rest/v1/{table}"
    headers = {
        **HEADERS,
        "Prefer": "resolution=merge-duplicates,return=minimal"
    }

    try:
        # تقسيم السجلات لتجنب الطلبات الكبيرة
        batch_size = 50
        for i in range(0, len(records), batch_size):
            batch = records[i:i + batch_size]
            response = requests.post(url, headers=headers, json=batch, timeout=30)
            if response.status_code not in (200, 201):
                logger.warning(f"⚠️  فشل إرسال مجموعة: {response.status_code}")
        return True
    except RequestException as e:
        logger.error(f"❌ فشل إرسال إلى {table}: {e}")
        return False


# ============================================================================
# المحلل الذكي الرئيسي
# ============================================================================

class AttendanceAnalyzer:
    """المحلل الذكي للحضور"""

    def __init__(self):
        self.df_summary: Optional[pd.DataFrame] = None
        self.df_employees: Optional[pd.DataFrame] = None
        self.df_departments: Optional[pd.DataFrame] = None
        self.insights: List[Dict] = []

    # ============================================================================
    # تحميل البيانات
    # ============================================================================

    def load_data(self, days_back: int = 90) -> bool:
        """تحميل البيانات من Supabase"""
        logger.info(f"📥 تحميل بيانات آخر {days_back} يوم...")

        try:
            # جلب ملخص الحضور
            query = f"?select=*&shift_date=gte.{date.today() - timedelta(days=days_back)}"
            summary_data = fetch_from_supabase("attendance_summary", query, 50000)
            if not summary_data:
                logger.warning("⚠️  لا توجد بيانات حضور")
                return False
            self.df_summary = pd.DataFrame(summary_data)
            logger.info(f"✅ تم تحميل {len(self.df_summary)} سجل حضور")

            # جلب الموظفين
            employees_data = fetch_from_supabase(
                "employees",
                "?select=id,employee_code,first_name,last_name,department_id,role,hire_date"
            )
            if employees_data:
                self.df_employees = pd.DataFrame(employees_data)
                logger.info(f"✅ تم تحميل {len(self.df_employees)} موظف")
            else:
                logger.warning("⚠️  لا توجد بيانات موظفين")
                return False

            # جلب الأقسام
            departments_data = fetch_from_supabase(
                "departments",
                "?select=id,name_ar,manager_id"
            )
            if departments_data:
                self.df_departments = pd.DataFrame(departments_data)

            return True

        except Exception as e:
            logger.error(f"❌ فشل تحميل البيانات: {e}")
            logger.debug(traceback.format_exc())
            return False

    # ============================================================================
    # أ. تحليل أنماط الحضور
    # ============================================================================

    def analyze_attendance_patterns(self) -> List[Dict]:
        """تحليل أنماط الحضور"""
        logger.info("📊 تحليل أنماط الحضور...")
        insights = []

        if self.df_summary is None or self.df_summary.empty:
            return insights

        df = self.df_summary.copy()

        # تحويل التاريخ
        df['shift_date'] = pd.to_datetime(df['shift_date'])
        df['month'] = df['shift_date'].dt.month
        df['day_of_week'] = df['shift_date'].dt.dayofweek
        df['employee_id'] = df['employee_id'].astype(str)

        # 1. الموظفون المتأخرون باستمرار (أكثر من 3 مرات في الشهر)
        monthly_late = df[df['status'] == 'متأخر'].groupby(
            ['employee_id', 'month']
        ).size().reset_index(name='late_count')

        chronic_late = monthly_late[monthly_late['late_count'] > 3]

        if not chronic_late.empty:
            # دمج مع أسماء الموظفين
            if self.df_employees is not None:
                chronic_late = chronic_late.merge(
                    self.df_employees[['id', 'first_name', 'last_name', 'department_id']],
                    left_on='employee_id',
                    right_on='id',
                    how='left'
                )

                for _, row in chronic_late.iterrows():
                    name = f"{row.get('first_name', '')} {row.get('last_name', '')}"
                    insights.append({
                        "insight_type": "حضور",
                        "scope": "employee",
                        "employee_id": row['employee_id'],
                        "title": f"موظف متأخر باستمرار: {name}",
                        "summary": f"تأخر {int(row['late_count'])} مرات في الشهر {int(row['month'])}",
                        "data": {
                            "late_count": int(row['late_count']),
                            "month": int(row['month'])
                        },
                        "severity": "warning",
                        "valid_until": (datetime.utcnow() + timedelta(days=1)).isoformat()
                    })

        # 2. أكثر أيام الغياب في الأسبوع
        absent_by_day = df[df['status'] == 'غائب'].groupby('day_of_week').size().reset_index(name='count')
        day_names = {0: 'الأحد', 1: 'الإثنين', 2: 'الثلاثاء', 3: 'الأربعاء', 4: 'الخميس', 5: 'الجمعة', 6: 'السبت'}
        absent_by_day['day_name'] = absent_by_day['day_of_week'].map(day_names)

        if not absent_by_day.empty:
            worst_day = absent_by_day.loc[absent_by_day['count'].idxmax()]
            insights.append({
                "insight_type": "حضور",
                "scope": "global",
                "title": "أكثر أيام الغياب",
                "summary": f"أكثر يوم يغيب فيه الموظفون هو {worst_day['day_name']} ({int(worst_day['count'])} غياب)",
                "data": absent_by_day[['day_name', 'count']].to_dict('records'),
                "severity": "info",
                "valid_until": (datetime.utcnow() + timedelta(days=1)).isoformat()
            })

        # 3. مقارنة الورديات
        if 'shift_type' in df.columns:
            shift_stats = df.groupby('shift_type').agg({
                'id': 'count',
                'late_minutes': 'mean',
                'overtime_minutes': 'mean'
            }).reset_index()

            # تحديد أكثر الورديات انضباطاً
            shift_stats['discipline_score'] = 100 - (shift_stats['late_minutes'] / 60 * 10)
            best_shift = shift_stats.loc[shift_stats['discipline_score'].idxmax()]

            insights.append({
                "insight_type": "حضور",
                "scope": "global",
                "title": "مقارنة الورديات",
                "summary": f"الوردية الأكثر انضباطاً: {best_shift['shift_type']} بمعدل {best_shift['discipline_score']:.1f}%",
                "data": shift_stats[['shift_type', 'late_minutes', 'overtime_minutes']].to_dict('records'),
                "severity": "info",
                "valid_until": (datetime.utcnow() + timedelta(days=1)).isoformat()
            })

        logger.info(f"✅ تم إنشاء {len(insights)} تحليل لأنماط الحضور")
        return insights

    # ============================================================================
    # ب. كشف الشذوذ (Anomaly Detection)
    # ============================================================================

    def detect_anomalies(self) -> List[Dict]:
        """كشف الشذوذ في أنماط الحضور باستخدام Isolation Forest"""
        logger.info("🔍 كشف الشذوذ في الحضور...")
        insights = []

        if self.df_summary is None or self.df_summary.empty:
            return insights

        df = self.df_summary.copy()

        # اختيار الميزات المناسبة للكشف
        features = ['total_hours', 'late_minutes', 'early_leave_minutes', 'overtime_minutes']
        available_features = [f for f in features if f in df.columns]

        if len(available_features) < 2:
            logger.warning("⚠️  لا توجد ميزات كافية لكشف الشذوذ")
            return insights

        # تجهيز البيانات
        df_anomaly = df[available_features].copy()
        df_anomaly = df_anomaly.fillna(0)

        # تطبيع البيانات
        scaler = StandardScaler()
        df_scaled = scaler.fit_transform(df_anomaly)

        # Isolation Forest
        model = IsolationForest(
            contamination=0.05,  # 5% من البيانات تعتبر شذوذاً
            random_state=42
        )

        df['anomaly'] = model.fit_predict(df_scaled)
        df['anomaly_score'] = model.decision_function(df_scaled)

        # سحب الحالات الشاذة
        anomalies = df[df['anomaly'] == -1].copy()

        if not anomalies.empty:
            # تجميع حسب الموظف
            anomaly_counts = anomalies.groupby('employee_id').size().reset_index(name='count')
            top_anomalies = anomaly_counts.sort_values('count', ascending=False).head(5)

            if self.df_employees is not None:
                top_anomalies = top_anomalies.merge(
                    self.df_employees[['id', 'first_name', 'last_name']],
                    left_on='employee_id',
                    right_on='id',
                    how='left'
                )

                for _, row in top_anomalies.iterrows():
                    name = f"{row.get('first_name', '')} {row.get('last_name', '')}"
                    insights.append({
                        "insight_type": "شذوذ",
                        "scope": "employee",
                        "employee_id": row['employee_id'],
                        "title": f"سلوك غير اعتيادي: {name}",
                        "summary": f"تم رصد {int(row['count'])} حالة شذوذ في نمط الحضور",
                        "data": {"anomaly_count": int(row['count'])},
                        "severity": "warning",
                        "valid_until": (datetime.utcnow() + timedelta(days=3)).isoformat()
                    })

            # إحصائية عامة
            insights.append({
                "insight_type": "شذوذ",
                "scope": "global",
                "title": "إحصائية الشذوذ العام",
                "summary": f"تم كشف {len(anomalies)} حالة شذوذ من أصل {len(df)} سجل ({len(anomalies)/len(df)*100:.1f}%)",
                "data": {
                    "total_anomalies": len(anomalies),
                    "total_records": len(df),
                    "anomaly_rate": round(len(anomalies)/len(df)*100, 2)
                },
                "severity": "info",
                "valid_until": (datetime.utcnow() + timedelta(days=1)).isoformat()
            })

        logger.info(f"✅ تم كشف {len(insights)} شذوذ")
        return insights

    # ============================================================================
    # ج. التنبؤ بالغياب (Prophet)
    # ============================================================================

    def predict_absenteeism(self) -> List[Dict]:
        """التنبؤ بالغياب باستخدام Prophet"""
        logger.info("🔮 التنبؤ بالغياب...")
        insights = []

        if Prophet is None:
            logger.warning("⚠️  مكتبة prophet غير متاحة. تخطي التنبؤات.")
            return insights

        if self.df_summary is None or self.df_summary.empty:
            return insights

        df = self.df_summary.copy()

        try:
            # تجميع الغياب اليومي
            df['shift_date'] = pd.to_datetime(df['shift_date'])
            daily_absent = df[df['status'] == 'غائب'].groupby(
                'shift_date'
            ).size().reset_index(name='absent_count')

            if len(daily_absent) < 10:
                logger.warning("⚠️  بيانات قليلة جداً للتنبؤ")
                return insights

            # تجهيز البيانات لـ Prophet
            prophet_df = daily_absent.rename(columns={
                'shift_date': 'ds',
                'absent_count': 'y'
            })

            # تدريب النموذج
            model = Prophet(
                yearly_seasonality=True,
                weekly_seasonality=True,
                daily_seasonality=False,
                changepoint_prior_scale=0.05
            )

            model.fit(prophet_df)

            # التنبؤ بـ 7 أيام قادمة
            future = model.make_future_dataframe(periods=7)
            forecast = model.predict(future)

            # استخراج آخر 7 أيام متوقعة
            prediction = forecast.tail(7)

            # تحذير إذا كان هناك يوم متوقع غياب عالٍ
            for _, row in prediction.iterrows():
                if row['yhat'] > prophet_df['y'].mean() * 1.5:  # زيادة 50% عن المعدل
                    pred_date = row['ds'].strftime('%Y-%m-%d')
                    insights.append({
                        "insight_type": "تنبؤ",
                        "scope": "global",
                        "title": "تحذير: توقع غياب مرتفع",
                        "summary": f"متوقع غياب {int(row['yhat'])} موظف في {pred_date}",
                        "data": {
                            "date": pred_date,
                            "predicted_absent": int(row['yhat']),
                            "average_absent": round(prophet_df['y'].mean(), 1)
                        },
                        "severity": "warning",
                        "valid_until": (datetime.utcnow() + timedelta(days=2)).isoformat()
                    })

            logger.info(f"✅ تم إنشاء {len(insights)} تنبؤ")
            return insights

        except Exception as e:
            logger.error(f"❌ فشل التنبؤ: {e}")
            logger.debug(traceback.format_exc())
            return []

    # ============================================================================
    # د. تحليل الأقسام
    # ============================================================================

    def analyze_departments(self) -> List[Dict]:
        """تحليل أداء الأقسام"""
        logger.info("🏢 تحليل الأقسام...")
        insights = []

        if (self.df_summary is None or self.df_employees is None or
            self.df_departments is None):
            return insights

        try:
            df = self.df_summary.copy()
            df['employee_id'] = df['employee_id'].astype(str)

            # دمج مع الموظفين للحصول على القسم
            emp = self.df_employees[['id', 'department_id']].copy()
            emp['id'] = emp['id'].astype(str)
            emp['department_id'] = emp['department_id'].astype(str)

            df = df.merge(emp, left_on='employee_id', right_on='id', how='left')

            # دمج مع الأقسام للحصول على الاسم
            dept = self.df_departments[['id', 'name_ar']].copy()
            dept['id'] = dept['id'].astype(str)

            df = df.merge(dept, left_on='department_id', right_on='id', how='left')

            if df.empty:
                return insights

            # إحصائيات لكل قسم
            dept_stats = df.groupby('name_ar').agg({
                'employee_id': pd.Series.nunique,
                'late_minutes': 'mean',
                'total_hours': 'mean',
                'overtime_minutes': 'sum'
            }).reset_index()

            # حساب معدل الحضور لكل قسم
            dept_attendance = df.groupby(['name_ar', 'status']).size().reset_index(name='count')
            dept_total = dept_stats[['name_ar', 'employee_id']].copy()

            for status in ['حضور_بوقت', 'متأخر', 'غائب']:
                status_data = dept_attendance[dept_attendance['status'] == status][
                    ['name_ar', 'count']
                ].rename(columns={'count': f'{status}_count'})
                dept_total = dept_total.merge(status_data, on='name_ar', how='left')

            # حساب النسبة المئوية
            for status in ['حضور_بوقت', 'متأخر', 'غائب']:
                col = f'{status}_count'
                if col in dept_total.columns:
                    dept_total[f'{status}_pct'] = (
                        dept_total[col].fillna(0) /
                        dept_total[[f'{s}_count' for s in ['حضور_بوقت', 'متأخر', 'غائب']
                                   if f'{s}_count' in dept_total.columns]].sum(axis=1)
                    ) * 100

            # القسم الأكثر التزاماً
            if 'حضور_بوقت_pct' in dept_total.columns:
                best_dept = dept_total.loc[dept_total['حضور_بوقت_pct'].idxmax()]
                insights.append({
                    "insight_type": "قسم",
                    "scope": "department",
                    "department_id": None,  # نضيفه لاحقاً
                    "title": f"القسم الأكثر التزاماً: {best_dept['name_ar']}",
                    "summary": f"نسبة حضور: {best_dept['حضور_بوقت_pct']:.1f}%",
                    "data": dept_stats.to_dict('records'),
                    "severity": "info",
                    "valid_until": (datetime.utcnow() + timedelta(days=1)).isoformat()
                })

            # القسم الأقل التزاماً
            if 'غائب_pct' in dept_total.columns and dept_total['غائب_pct'].max() > 0:
                worst_dept = dept_total.loc[dept_total['غائب_pct'].idxmax()]
                insights.append({
                    "insight_type": "قسم",
                    "scope": "department",
                    "department_id": None,
                    "title": f"تنبيه: القسم {worst_dept['name_ar']}",
                    "summary": f"نسبة غياب: {worst_dept['غائب_pct']:.1f}%",
                    "data": {
                        "department": worst_dept['name_ar'],
                        "absent_rate": round(worst_dept['غائب_pct'], 1)
                    },
                    "severity": "warning",
                    "valid_until": (datetime.utcnow() + timedelta(days=3)).isoformat()
                })

            logger.info(f"✅ تم تحليل الأقسام: {len(insights)} نتيجة")
            return insights

        except Exception as e:
            logger.error(f"❌ فشل تحليل الأقسام: {e}")
            logger.debug(traceback.format_exc())
            return []

    # ============================================================================
    # هـ. تقرير صحة القوى العاملة
    # ============================================================================

    def analyze_workforce_health(self) -> List[Dict]:
        """تحليل صحة القوى العاملة"""
        logger.info("💪 تحليل صحة القوى العاملة...")
        insights = []

        if self.df_summary is None or self.df_employees is None:
            return insights

        try:
            df = self.df_summary.copy()
            df['employee_id'] = df['employee_id'].astype(str)

            # 1. نسبة الحضور الكلية
            total_records = len(df)
            present_count = len(df[df['status'].isin(['حضور_بوقت', 'متأخر', 'زمنية_معتمدة'])])
            attendance_rate = (present_count / total_records * 100) if total_records > 0 else 0

            # 2. متوسط ساعات العمل الفعلية
            avg_hours = df[df['total_hours'] > 0]['total_hours'].mean() or 0

            # 3. الموظفون الذين لم يأخذوا إجازة منذ 6 أشهر
            six_months_ago = date.today() - timedelta(days=180)
            # (هذا يحتاج بيانات الإجازات الفعلية)

            insights.append({
                "insight_type": "صحة_قوى_عاملة",
                "scope": "global",
                "title": "تقرير صحة القوى العاملة",
                "summary": (
                    f"نسبة الحضور: {attendance_rate:.1f}% | "
                    f"متوسط ساعات العمل: {avg_hours:.1f} ساعة"
                ),
                "data": {
                    "total_employees": len(self.df_employees),
                    "attendance_rate": round(attendance_rate, 2),
                    "average_hours": round(avg_hours, 2),
                    "total_records_analyzed": total_records,
                    "period_days": 90
                },
                "severity": "info",
                "valid_until": (datetime.utcnow() + timedelta(days=1)).isoformat()
            })

            # 4. تحذير إذا كانت نسبة الحضور منخفضة
            if attendance_rate < 70:
                insights.append({
                    "insight_type": "صحة_قوى_عاملة",
                    "scope": "global",
                    "title": "⚠️ تنبيه: نسبة حضور منخفضة",
                    "summary": f"نسبة الحضور الكلية {attendance_rate:.1f}% وهي أقل من 70%",
                    "data": {"attendance_rate": round(attendance_rate, 2)},
                    "severity": "critical",
                    "valid_until": (datetime.utcnow() + timedelta(days=2)).isoformat()
                })

            # 5. الموظفون المتكرر غيابهم
            absent_counts = df[df['status'] == 'غائب'].groupby('employee_id').size().reset_index(name='count')
            frequent_absent = absent_counts[absent_counts['count'] >= 5]

            if not frequent_absent.empty and self.df_employees is not None:
                frequent_absent = frequent_absent.merge(
                    self.df_employees[['id', 'first_name', 'last_name']],
                    left_on='employee_id',
                    right_on='id',
                    how='left'
                )

                for _, row in frequent_absent.head(3).iterrows():
                    name = f"{row.get('first_name', '')} {row.get('last_name', '')}"
                    insights.append({
                        "insight_type": "صحة_قوى_عاملة",
                        "scope": "employee",
                        "employee_id": row['employee_id'],
                        "title": f"موظف غائب بكثرة: {name}",
                        "summary": f"غاب {int(row['count'])} مرات في آخر 90 يوم",
                        "data": {"absent_days": int(row['count'])},
                        "severity": "warning",
                        "valid_until": (datetime.utcnow() + timedelta(days=3)).isoformat()
                    })

            logger.info(f"✅ تم إنشاء {len(insights)} تحليل صحة")
            return insights

        except Exception as e:
            logger.error(f"❌ فشل تحليل صحة القوى العاملة: {e}")
            logger.debug(traceback.format_exc())
            return []

    # ============================================================================
    # تشغيل كل التحليلات
    # ============================================================================

    def run_all_analyses(self) -> List[Dict]:
        """تشغيل كل أنواع التحليل"""
        logger.info("=" * 60)
        logger.info("🚀 بدء التحليل الذكي الشامل")
        logger.info(f"⏱️  الوقت: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        logger.info("=" * 60)

        all_insights = []

        # أ. أنماط الحضور
        try:
            all_insights.extend(self.analyze_attendance_patterns())
        except Exception as e:
            logger.error(f"❌ فشل تحليل أنماط الحضور: {e}")

        # ب. كشف الشذوذ
        try:
            all_insights.extend(self.detect_anomalies())
        except Exception as e:
            logger.error(f"❌ فشل كشف الشذوذ: {e}")

        # ج. التنبؤ بالغياب
        try:
            all_insights.extend(self.predict_absenteeism())
        except Exception as e:
            logger.error(f"❌ فشل التنبؤ بالغياب: {e}")

        # د. تحليل الأقسام
        try:
            all_insights.extend(self.analyze_departments())
        except Exception as e:
            logger.error(f"❌ فشل تحليل الأقسام: {e}")

        # هـ. صحة القوى العاملة
        try:
            all_insights.extend(self.analyze_workforce_health())
        except Exception as e:
            logger.error(f"❌ فشل تحليل صحة القوى العاملة: {e}")

        # إضافة وقت الإنشاء
        for insight in all_insights:
            insight['generated_at'] = datetime.utcnow().isoformat()

        logger.info("=" * 60)
        logger.info(f"✅ اكتمل التحليل: {len(all_insights)} نتيجة")
        logger.info("=" * 60)

        return all_insights

    # ============================================================================
    # حفظ النتائج في قاعدة البيانات
    # ============================================================================

    def save_insights(self, insights: List[Dict]) -> bool:
        """حفظ التحليلات في جدول ai_insights"""
        if not insights:
            logger.info("📭 لا توجد نتائج لحفظها")
            return True

        logger.info(f"💾 حفظ {len(insights)} نتيجة في قاعدة البيانات...")

        # تحويل الحقول للتوافق مع قاعدة البيانات
        db_records = []
        for insight in insights[:200]:  # حد أقصى 200 سجل
            db_records.append({
                "insight_type": insight.get("insight_type", "حضور"),
                "scope": insight.get("scope", "global"),
                "department_id": insight.get("department_id"),
                "employee_id": insight.get("employee_id"),
                "title": insight.get("title", ""),
                "summary": insight.get("summary", ""),
                "data": json.dumps(insight.get("data", {})),
                "severity": insight.get("severity", "info"),
                "generated_at": insight.get("generated_at", datetime.utcnow().isoformat()),
                "valid_until": insight.get("valid_until")
            })

        return upsert_to_supabase("ai_insights", db_records)

    # ============================================================================
    # حذف النتائج القديمة
    # ============================================================================

    def cleanup_old_insights(self, days: int = 7) -> bool:
        """حذف التحليلات القديمة"""
        logger.info(f"🧹 تنظيف النتائج الأقدم من {days} يوم...")

        cutoff = (datetime.utcnow() - timedelta(days=days)).isoformat()
        url = f"{SUPABASE_URL}/rest/v1/ai_insights?generated_at=lt.{cutoff}"
        headers = {**HEADERS, "Prefer": "count=exact"}

        try:
            response = requests.delete(url, headers=headers, timeout=10)
            if response.status_code == 200:
                count = response.headers.get('content-range', '0').split('/')[-1]
                logger.info(f"✅ تم حذف {count} نتيجة قديمة")
                return True
            else:
                logger.warning(f"⚠️  فشل التنظيف: {response.status_code}")
                return False
        except RequestException as e:
            logger.error(f"❌ فشل الاتصال أثناء التنظيف: {e}")
            return False


# ============================================================================
# الدالة الرئيسية - تُستدعى من Supabase Scheduled Function
# ============================================================================

def main():
    """النقطة الرئيسية للتشغيل"""
    logger.info("🏁 بدء تشغيل المحلل الذكي")

    analyzer = AttendanceAnalyzer()

    # 1. تحميل البيانات
    if not analyzer.load_data(days_back=90):
        logger.error("❌ فشل تحميل البيانات. إيقاف التحليل.")
        return False

    # 2. تشغيل كل التحليلات
    insights = analyzer.run_all_analyses()

    # 3. حفظ النتائج
    if analyzer.save_insights(insights):
        logger.info("✅ تم حفظ التحليلات بنجاح")
    else:
        logger.error("❌ فشل حفظ التحليلات")
        return False

    # 4. تنظيف القديم (مرة واحدة في الأسبوع)
    # نستخدم modulo على اليوم لتشغيل التنظيف أسبوعياً
    if datetime.now().day % 7 == 0:
        analyzer.cleanup_old_insights(days=7)

    logger.info("✅ اكتمل كل شيء بنجاح")
    return True


# ============================================================================
# نقطة الدخول
# ============================================================================

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)