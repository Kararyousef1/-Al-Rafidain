// ============================================================================
// وادي الرافدين للإنتاج الدوائي - HR System
// منطق الورديات والحضور
// ============================================================================

/**
 * أنواع الورديات الثلاث
 */
export type ShiftType = 'صباحي' | 'مسائي' | 'ليلي';

/**
 * حالات الحضور الثمانية
 */
export type AttendanceStatus =
  | 'حضور_بوقت'
  | 'متأخر'
  | 'زمنية_معتمدة'
  | 'زمنية_انتظار'
  | 'مجاز'
  | 'إجازة_انتظار'
  | 'غائب'
  | 'عطلة';

/**
 * أنواع الزمنيات الأربعة
 */
export type PermissionType = 'عادية' | 'مغادرة' | 'تعويضية' | 'بدون_راتب';

/**
 * حالة الزمنية
 */
export type PermissionStatus = 'انتظار' | 'موافق' | 'مرفوض';

/**
 * أنواع البصمة
 */
export type VerificationType = 'finger' | 'face' | 'card' | 'password';

// ============================================================================
// أنواع بيانات الوردية
// ============================================================================

/** إعدادات الوردية الواحدة */
export interface ShiftConfig {
  start: string;   // HH:mm
  end: string;     // HH:mm
  hours: number;   // عدد ساعات الوردية
}

/** إعدادات كل الورديات */
export interface ShiftsConfig {
  صباحي: ShiftConfig;
  مسائي: ShiftConfig;
  ليلي: ShiftConfig;
}

/** نافذة تحديد الوردية من بصمة الدخول */
export interface ShiftWindow {
  from: string;  // HH:mm
  to: string;    // HH:mm
}

/** نوافذ كل الورديات */
export interface ShiftWindows {
  صباحي: ShiftWindow;
  مسائي: ShiftWindow;
  ليلي: ShiftWindow;
}

/** سجل بصمة واحد */
export interface AttendanceLog {
  id: number;
  employee_id: string;
  punch_time: string;      // ISO timestamp
  punch_type?: string;
  shift_type?: ShiftType;
  shift_date: string;      // YYYY-MM-DD
  device_id?: string;
  verification_type?: VerificationType;
  source?: 'ADMS' | 'Python';
  created_at: string;
}

/** ملخص الحضور اليومي */
export interface AttendanceSummary {
  id: number;
  employee_id: string;
  shift_date: string;
  shift_type?: ShiftType;
  check_in?: string;
  check_out?: string;
  total_hours: number;
  late_minutes: number;
  early_leave_minutes: number;
  overtime_minutes: number;
  status: AttendanceStatus;
}

/** تقرير تحليلي للمدير عن موظف في نطاق تاريخي */
export interface EmployeeAttendanceReport {
  employee_id: string;
  full_name: string;
  department: string;
  total_days: number;
  present_days: number;
  absent_days: number;
  late_days: number;
  leave_days: number;
  holiday_days: number;
  overtime_total_hours: number;
  late_total_minutes: number;
  attendance_rate: number; // نسبة الحضور %
}

// ============================================================================
// إعدادات سياسة الدوام
// ============================================================================

/** سياسة الأوفرتايم */
export interface OvertimePolicy {
  /** حد الأوفرتايم المسموح به يومياً (بالدقائق) قبل احتساب ضعف الأجر */
  dailyThresholdMinutes: number;
  /** مضاعف الأجر للأوفرتايم العادي */
  normalMultiplier: number;
  /** مضاعف الأجر لأوفرتايم العطل والجمعة */
  holidayMultiplier: number;
  /** حد الأوفرتايم المسموح به شهرياً (بالدقائق) */
  monthlyLimitMinutes: number;
  /** هل يحتاج الأوفرتايم موافقة مسبقة؟ */
  requiresApproval: boolean;
}

/** سياسة التأخير */
export interface LatePolicy {
  /** السماح (بالدقائق) بدون احتساب تأخير */
  gracePeriodMinutes: number;
  /** بعد كم دقيقة تأخير يُحتسب نصف يوم غياب */
  halfDayThreshold: number;
  /** بعد كم دقيقة تأخير يُحتسب غياب كامل */
  fullDayThreshold: number;
  /** خصم على كل دقيقة تأخير (بالدينار) */
  deductionPerMinute: number;
}

/** إعدادات سياسة الشركة الكاملة */
export interface CompanyPolicy {
  overtime: OvertimePolicy;
  late: LatePolicy;
  workDaysPerWeek: number;
  workHoursPerDay: number;
}

// ============================================================================
// إعدادات الورديات الافتراضية
// ============================================================================

export const DEFAULT_SHIFT_TIMINGS: ShiftsConfig = {
  صباحي: { start: '08:00', end: '16:00', hours: 8 },
  مسائي: { start: '16:00', end: '00:00', hours: 8 },
  ليلي: { start: '00:00', end: '08:00', hours: 8 },
};

export const DEFAULT_SHIFT_WINDOWS: ShiftWindows = {
  صباحي: { from: '06:00', to: '10:00' },
  مسائي: { from: '14:00', to: '18:00' },
  ليلي: { from: '22:00', to: '02:00' },
};

/** سياسة الشركة الافتراضية */
export const DEFAULT_POLICY: CompanyPolicy = {
  overtime: {
    dailyThresholdMinutes: 60,
    normalMultiplier: 1.5,
    holidayMultiplier: 2.0,
    monthlyLimitMinutes: 3600,
    requiresApproval: true,
  },
  late: {
    gracePeriodMinutes: 15,
    halfDayThreshold: 60,
    fullDayThreshold: 120,
    deductionPerMinute: 500,
  },
  workDaysPerWeek: 6,
  workHoursPerDay: 8,
};

// ============================================================================
// أدوات مساعدة للوقت
// ============================================================================

/**
 * تحويل نص وقت (HH:mm) إلى دقائق من منتصف الليل
 */
export function timeToMinutes(time: string): number {
  if (!time) return 0;
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * تحويل الوقت إلى نص HH:mm
 */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(((minutes % 1440) + 1440) % 1440 / 60);
  const m = Math.floor(((minutes % 1440) + 1440) % 1440 % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * تحويل ISO timestamp إلى دقائق
 */
export function timestampToMinutes(isoString: string): number {
  const date = new Date(isoString);
  return date.getHours() * 60 + date.getMinutes();
}

/**
 * تحويل ISO timestamp إلى نص HH:mm
 */
export function timestampToTime(isoString: string): string {
  return minutesToTime(timestampToMinutes(isoString));
}

/**
 * تحقق هل الوقت ضمن النطاق (مع مراعاة الوردية الليلية)
 */
function isTimeInRange(
  timeMinutes: number,
  rangeFrom: number,
  rangeTo: number
): boolean {
  // الوردية الليلية: rangeFrom > rangeTo (تمتد لليوم التالي)
  if (rangeFrom <= rangeTo) {
    return timeMinutes >= rangeFrom && timeMinutes < rangeTo;
  } else {
    return timeMinutes >= rangeFrom || timeMinutes < rangeTo;
  }
}

/**
 * فرق الدقائق بين وقتين HH:mm
 */
export function diffMinutes(from: string, to: string): number {
  const fromMin = timeToMinutes(from);
  const toMin = timeToMinutes(to);
  if (toMin >= fromMin) return toMin - fromMin;
  return (1440 - fromMin) + toMin; // عبر منتصف الليل
}

// ============================================================================
// تحديد الوردية من وقت البصمة
// ============================================================================

/**
 * تحديد الوردية بناءً على وقت البصمة
 */
export function determineShift(
  punchTime: string | Date,
  windows: ShiftWindows = DEFAULT_SHIFT_WINDOWS
): ShiftType {
  const minutes = typeof punchTime === 'string'
    ? timestampToMinutes(punchTime)
    : punchTime.getHours() * 60 + punchTime.getMinutes();

  const صباحيFrom = timeToMinutes(windows.صباحي.from);
  const صباحيTo = timeToMinutes(windows.صباحي.to);
  const مسائيFrom = timeToMinutes(windows.مسائي.from);
  const مسائيTo = timeToMinutes(windows.مسائي.to);
  const ليليFrom = timeToMinutes(windows.ليلي.from);
  const ليليTo = timeToMinutes(windows.ليلي.to);

  if (isTimeInRange(minutes, صباحيFrom, صباحيTo)) return 'صباحي';
  if (isTimeInRange(minutes, مسائيFrom, مسائيTo)) return 'مسائي';
  if (isTimeInRange(minutes, ليليFrom, ليليTo)) return 'ليلي';

  // خارج النوافذ - تخمين بأقرب وردية
  if (minutes >= 360 && minutes < 840) return 'صباحي';    // 06:00 - 14:00
  if (minutes >= 840 && minutes < 1320) return 'مسائي';   // 14:00 - 22:00
  return 'ليلي';                                            // 22:00 - 06:00
}

/**
 * الحصول على تاريخ الوردية
 */
export function getShiftDate(punchTime: string | Date): string {
  const date = typeof punchTime === 'string' ? new Date(punchTime) : punchTime;
  return date.toISOString().split('T')[0];
}

// ============================================================================
// حساب التأخير والخروج المبكر والأوفرتايم
// ============================================================================

/**
 * حساب دقائق التأخير مع مراعاة مهلة السماح (Grace Period)
 */
export function calculateLateMinutes(
  checkInTime: string | Date,
  shiftType: ShiftType,
  shiftTimings: ShiftsConfig = DEFAULT_SHIFT_TIMINGS,
  gracePeriodMinutes: number = DEFAULT_POLICY.late.gracePeriodMinutes
): number {
  const checkInMinutes = typeof checkInTime === 'string'
    ? timestampToMinutes(checkInTime)
    : checkInTime.getHours() * 60 + checkInTime.getMinutes();

  const shiftStartMinutes = timeToMinutes(shiftTimings[shiftType].start);

  if (checkInMinutes <= shiftStartMinutes) return 0;

  // للوردية الليلية
  if (shiftType === 'ليلي') {
    if (checkInMinutes >= 0 && checkInMinutes < 120) {
      const rawLate = Math.max(0, checkInMinutes - shiftStartMinutes);
      return Math.max(0, rawLate - gracePeriodMinutes);
    }
  }

  const rawLate = checkInMinutes - shiftStartMinutes;
  return Math.max(0, rawLate - gracePeriodMinutes);
}

/**
 * حساب دقائق الخروج المبكر
 */
export function calculateEarlyLeaveMinutes(
  checkOutTime: string | Date,
  shiftType: ShiftType,
  shiftTimings: ShiftsConfig = DEFAULT_SHIFT_TIMINGS
): number {
  const checkOutMinutes = typeof checkOutTime === 'string'
    ? timestampToMinutes(checkOutTime)
    : checkOutTime.getHours() * 60 + checkOutTime.getMinutes();

  const shiftEndMinutes = timeToMinutes(shiftTimings[shiftType].end);

  if (checkOutMinutes >= shiftEndMinutes) return 0;

  // للوردية الليلية
  if (shiftType === 'ليلي') {
    if (checkOutMinutes < shiftEndMinutes && checkOutMinutes >= 0) {
      return shiftEndMinutes - checkOutMinutes;
    }
  }

  return shiftEndMinutes - checkOutMinutes;
}

/**
 * حساب دقائق الأوفرتايم (الوقت الإضافي) حسب سياسة الشركة
 * تحتسب الوقت الإضافي بثلاثة أنواع:
 * 1. أوفرتايم قبل الوردية (early arrival)
 * 2. أوفرتايم بعد الوردية (late departure)
 * 3. أوفرتايم أيام العطل
 */
export function calculateOvertimeMinutes(
  totalWorkMinutes: number,
  shiftType: ShiftType,
  shiftTimings: ShiftsConfig = DEFAULT_SHIFT_TIMINGS,
  isHoliday: boolean = false
): number {
  const shiftMinutes = shiftTimings[shiftType].hours * 60;

  if (totalWorkMinutes <= shiftMinutes) return 0;
  const overtimeMinutes = totalWorkMinutes - shiftMinutes;

  // في العطل: كل الوقت يعتبر أوفرتايم
  if (isHoliday) return totalWorkMinutes;

  return overtimeMinutes;
}

/**
 * حساب دقائق الأوفرتايم التفصيلية (قبل وبعد الوردية)
 */
export function calculateDetailedOvertime(
  checkIn: string | Date,
  checkOut: string | Date,
  shiftType: ShiftType,
  shiftTimings: ShiftsConfig = DEFAULT_SHIFT_TIMINGS
): { beforeShift: number; afterShift: number; totalOvertime: number } {
  const checkInMin = typeof checkIn === 'string'
    ? timestampToMinutes(checkIn)
    : checkIn.getHours() * 60 + checkIn.getMinutes();
  const checkOutMin = typeof checkOut === 'string'
    ? timestampToMinutes(checkOut)
    : checkOut.getHours() * 60 + checkOut.getMinutes();

  const shiftStart = timeToMinutes(shiftTimings[shiftType].start);
  const shiftEnd = timeToMinutes(shiftTimings[shiftType].end);

  let beforeShift = 0;
  let afterShift = 0;

  // أوفرتايم قبل الوردية (حضور مبكر)
  if (checkInMin < shiftStart) {
    beforeShift = shiftStart - checkInMin;
  }

  // أوفرتايم بعد الوردية (انصراف متأخر)
  if (checkOutMin > shiftEnd) {
    afterShift = checkOutMin - shiftEnd;
  }

  // للوردية الليلية
  if (shiftType === 'ليلي') {
    if (checkInMin < shiftStart && shiftStart >= 1200) {
      // بدأ قبل الوردية (اليوم السابق)
      beforeShift = shiftStart - checkInMin;
    }
  }

  return {
    beforeShift,
    afterShift,
    totalOvertime: beforeShift + afterShift,
  };
}

/**
 * حساب إجمالي ساعات العمل
 */
export function calculateTotalHours(
  checkIn: string | Date,
  checkOut: string | Date
): number {
  const inDate = typeof checkIn === 'string' ? new Date(checkIn) : checkIn;
  const outDate = typeof checkOut === 'string' ? new Date(checkOut) : checkOut;
  const diffMs = outDate.getTime() - inDate.getTime();
  return Math.round((diffMs / 3600000) * 100) / 100; // تقريب لخانتين عشريتين
}

/**
 * حساب صافي ساعات العمل بعد خصم الزمنيات (بالساعات)
 */
export function calculateNetWorkHours(
  totalHours: number,
  permissionMinutes: number = 0
): number {
  const permissionHours = permissionMinutes / 60;
  const net = totalHours - permissionHours;
  return Math.max(0, Math.round(net * 100) / 100);
}

/**
 * حساب الخصم المالي للتأخير
 */
export function calculateLateDeduction(
  lateMinutes: number,
  policy: LatePolicy = DEFAULT_POLICY.late
): number {
  if (lateMinutes <= policy.gracePeriodMinutes) return 0;
  const chargeableMinutes = lateMinutes - policy.gracePeriodMinutes;
  return chargeableMinutes * policy.deductionPerMinute;
}

/**
 * تصنيف التأخير (بسيط - متوسط - نصف يوم - غياب كامل)
 */
export function classifyLateness(
  lateMinutes: number,
  policy: LatePolicy = DEFAULT_POLICY.late
): { type: 'none' | 'simple' | 'moderate' | 'half_day' | 'full_day'; label: string } {
  const effectiveLate = lateMinutes - policy.gracePeriodMinutes;
  if (effectiveLate <= 0) return { type: 'none', label: 'في الوقت' };
  if (effectiveLate < 30) return { type: 'simple', label: 'تأخير بسيط' };
  if (effectiveLate < policy.halfDayThreshold) return { type: 'moderate', label: 'تأخير متوسط' };
  if (effectiveLate < policy.fullDayThreshold) return { type: 'half_day', label: 'نصف يوم غياب' };
  return { type: 'full_day', label: 'غياب كامل' };
}

// ============================================================================
// تحديد حالة الحضور وفق المنطق الصارم
// ============================================================================

interface AttendanceContext {
  hasPunch: boolean;
  checkIn?: string | Date;
  checkOut?: string | Date;
  shiftType: ShiftType;
  hasApprovedLeave: boolean;
  hasPendingLeave: boolean;
  hasApprovedPermission: boolean;
  hasPendingPermission: boolean;
  isFriday: boolean;
  isHoliday: boolean;
  shiftTimings?: ShiftsConfig;
}

/**
 * تحديد حالة الحضور حسب المنطق الصارم
 */
export function determineAttendanceStatus(context: AttendanceContext): AttendanceStatus {
  const {
    hasPunch, hasApprovedLeave, hasPendingLeave,
    hasApprovedPermission, hasPendingPermission,
    isFriday, isHoliday, shiftType, checkOut
  } = context;

  // ============================================================
  // الموظف لم يبصم
  // ============================================================
  if (!hasPunch) {
    if (isFriday) return 'عطلة';
    if (isHoliday) return 'عطلة';
    if (hasApprovedLeave) return 'مجاز';
    if (hasPendingLeave) return 'إجازة_انتظار';
    return 'غائب';
  }

  // ============================================================
  // الموظف بصم - نحدد الحالة الأساسية
  // ============================================================

  const lateMinutes = context.checkIn
    ? calculateLateMinutes(context.checkIn, shiftType, context.shiftTimings)
    : 0;

  if (lateMinutes > 0) {
    if (checkOut && hasApprovedPermission) return 'زمنية_معتمدة';
    if (checkOut && hasPendingPermission) return 'زمنية_انتظار';
    return 'متأخر';
  }

  // حضور بوقت
  if (checkOut) {
    const earlyMinutes = calculateEarlyLeaveMinutes(checkOut, shiftType, context.shiftTimings);
    if (earlyMinutes > 0) {
      if (hasApprovedPermission) return 'زمنية_معتمدة';
      if (hasPendingPermission) return 'زمنية_انتظار';
      return 'متأخر'; // خروج مبكر بدون زمنية
    }
  }

  return 'حضور_بوقت';
}

// ============================================================================
// الحصول على لون الحالة وأيقوناتها
// ============================================================================

export const STATUS_COLORS: Record<AttendanceStatus, string> = {
  حضور_بوقت: '#22C55E',        // أخضر
  متأخر: '#EAB308',             // أصفر
  زمنية_معتمدة: '#3B82F6',     // أزرق
  زمنية_انتظار: '#EAB308',     // أصفر
  مجاز: '#A855F7',              // بنفسجي
  إجازة_انتظار: '#EAB308',     // أصفر
  غائب: '#EF4444',              // أحمر
  عطلة: '#9CA3AF',              // رمادي
};

export const STATUS_ICONS: Record<AttendanceStatus, string> = {
  حضور_بوقت: 'check-circle',
  متأخر: 'clock',
  زمنية_معتمدة: 'file-check',
  زمنية_انتظار: 'clock',
  مجاز: 'umbrella',
  إجازة_انتظار: 'clock',
  غائب: 'x-circle',
  عطلة: 'calendar-off',
};

export const STATUS_LABELS: Record<AttendanceStatus, string> = {
  حضور_بوقت: 'حضور بوقت',
  متأخر: 'متأخر',
  زمنية_معتمدة: 'زمنية معتمدة',
  زمنية_انتظار: 'زمنية انتظار',
  مجاز: 'مجاز',
  إجازة_انتظار: 'إجازة انتظار',
  غائب: 'غائب',
  عطلة: 'عطلة',
};

/** ألوان أنواع الزمنيات */
export const PERMISSION_TYPE_COLORS: Record<PermissionType, string> = {
  عادية: '#22C55E',
  مغادرة: '#EF4444',
  تعويضية: '#3B82F6',
  بدون_راتب: '#9CA3AF',
};

// ============================================================================
// تحليل سجلات البصمات - الوظائف الأساسية
// ============================================================================

/**
 * استخراج أول وآخر بصمة من قائمة البصمات
 */
export function extractPunchTimes(
  logs: AttendanceLog[]
): { checkIn?: AttendanceLog; checkOut?: AttendanceLog } {
  if (!logs || logs.length === 0) return {};

  const sorted = [...logs].sort(
    (a, b) => new Date(a.punch_time).getTime() - new Date(b.punch_time).getTime()
  );

  return {
    checkIn: sorted[0],
    checkOut: sorted[sorted.length - 1],
  };
}

/**
 * الحصول على حالة الحضور من البيانات الفعلية
 */
export function getAttendanceStatusFromData(
  log: AttendanceLog[],
  options: {
    isFriday?: boolean;
    isHoliday?: boolean;
    hasApprovedLeave?: boolean;
    hasPendingLeave?: boolean;
    hasApprovedPermission?: boolean;
    hasPendingPermission?: boolean;
  } = {}
): AttendanceStatus {
  const { checkIn, checkOut } = extractPunchTimes(log);

  const context: AttendanceContext = {
    hasPunch: !!checkIn,
    checkIn: checkIn?.punch_time,
    checkOut: checkOut?.punch_time,
    shiftType: checkIn?.shift_type || 'صباحي',
    isFriday: options.isFriday ?? false,
    isHoliday: options.isHoliday ?? false,
    hasApprovedLeave: options.hasApprovedLeave ?? false,
    hasPendingLeave: options.hasPendingLeave ?? false,
    hasApprovedPermission: options.hasApprovedPermission ?? false,
    hasPendingPermission: options.hasPendingPermission ?? false,
  };

  return determineAttendanceStatus(context);
}

/**
 * تجميع البصمات حسب الموظف والتاريخ
 */
export function groupAttendanceByEmployeeAndDate(
  logs: AttendanceLog[]
): Map<string, Map<string, AttendanceLog[]>> {
  const grouped = new Map<string, Map<string, AttendanceLog[]>>();

  for (const log of logs) {
    const empKey = log.employee_id;
    const dateKey = log.shift_date || log.punch_time.split('T')[0];

    if (!grouped.has(empKey)) {
      grouped.set(empKey, new Map());
    }

    const empDates = grouped.get(empKey)!;
    if (!empDates.has(dateKey)) {
      empDates.set(dateKey, []);
    }

    empDates.get(dateKey)!.push(log);
  }

  return grouped;
}

// ============================================================================
// إنشاء ملخص الحضور الكامل (AttendanceSummary)
// ============================================================================

/**
 * إنشاء ملخص حضور كامل ليوم واحد من سجلات البصمة
 */
export function createAttendanceSummary(
  employeeId: string,
  logs: AttendanceLog[],
  date: string,
  options: {
    isFriday?: boolean;
    isHoliday?: boolean;
    hasApprovedLeave?: boolean;
    hasPendingLeave?: boolean;
    hasApprovedPermission?: boolean;
    hasPendingPermission?: boolean;
    shiftTimings?: ShiftsConfig;
  } = {}
): AttendanceSummary {
  const { checkIn, checkOut } = extractPunchTimes(logs);

  if (!checkIn) {
    // الموظف لم يبصم
    const status = determineAttendanceStatus({
      hasPunch: false,
      shiftType: 'صباحي',
      isFriday: options.isFriday ?? false,
      isHoliday: options.isHoliday ?? false,
      hasApprovedLeave: options.hasApprovedLeave ?? false,
      hasPendingLeave: options.hasPendingLeave ?? false,
      hasApprovedPermission: options.hasApprovedPermission ?? false,
      hasPendingPermission: options.hasPendingPermission ?? false,
    });

    return {
      id: 0,
      employee_id: employeeId,
      shift_date: date,
      shift_type: undefined,
      check_in: undefined,
      check_out: undefined,
      total_hours: 0,
      late_minutes: 0,
      early_leave_minutes: 0,
      overtime_minutes: 0,
      status,
    };
  }

  // الموظف بصم - حساب كل القيم
  const shiftType = checkIn.shift_type || 'صباحي';
  const shiftTimings = options.shiftTimings || DEFAULT_SHIFT_TIMINGS;

  const totalHours = checkOut
    ? calculateTotalHours(checkIn.punch_time, checkOut.punch_time)
    : 0;

  const totalMinutes = Math.round(totalHours * 60);

  const lateMinutes = calculateLateMinutes(checkIn.punch_time, shiftType, shiftTimings);
  const earlyLeaveMinutes = checkOut
    ? calculateEarlyLeaveMinutes(checkOut.punch_time, shiftType, shiftTimings)
    : 0;
  const overtimeMinutes = checkOut
    ? calculateOvertimeMinutes(totalMinutes, shiftType, shiftTimings, options.isHoliday)
    : 0;

  const status = determineAttendanceStatus({
    hasPunch: true,
    checkIn: checkIn.punch_time,
    checkOut: checkOut?.punch_time,
    shiftType,
    isFriday: options.isFriday ?? false,
    isHoliday: options.isHoliday ?? false,
    hasApprovedLeave: options.hasApprovedLeave ?? false,
    hasPendingLeave: options.hasPendingLeave ?? false,
    hasApprovedPermission: options.hasApprovedPermission ?? false,
    hasPendingPermission: options.hasPendingPermission ?? false,
    shiftTimings,
  });

  return {
    id: 0,
    employee_id: employeeId,
    shift_date: date,
    shift_type: shiftType,
    check_in: checkIn.punch_time,
    check_out: checkOut?.punch_time,
    total_hours: Math.round(totalHours * 100) / 100,
    late_minutes: lateMinutes,
    early_leave_minutes: earlyLeaveMinutes,
    overtime_minutes: overtimeMinutes,
    status,
  };
}

/**
 * إنشاء ملخصات حضور لمجموعة موظفين وتواريخ
 */
export function createBulkAttendanceSummaries(
  logs: AttendanceLog[],
  employees: { id: string; department?: string }[],
  dateRange: { from: string; to: string },
  options: {
    isFriday?: (date: string) => boolean;
    isHoliday?: (date: string) => boolean;
    hasApprovedLeave?: (empId: string, date: string) => boolean;
    hasPendingLeave?: (empId: string, date: string) => boolean;
    hasApprovedPermission?: (empId: string, date: string) => boolean;
    hasPendingPermission?: (empId: string, date: string) => boolean;
    shiftTimings?: ShiftsConfig;
  } = {}
): AttendanceSummary[] {
  const grouped = groupAttendanceByEmployeeAndDate(logs);
  const summaries: AttendanceSummary[] = [];

  const startDate = new Date(dateRange.from);
  const endDate = new Date(dateRange.to);

  for (const emp of employees) {
    const empLogs = grouped.get(emp.id);

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const dayLogs = empLogs?.get(dateStr) || [];

      const summary = createAttendanceSummary(emp.id, dayLogs, dateStr, {
        isFriday: options.isFriday?.(dateStr) ?? d.getDay() === 5,
        isHoliday: options.isHoliday?.(dateStr) ?? false,
        hasApprovedLeave: options.hasApprovedLeave?.(emp.id, dateStr) ?? false,
        hasPendingLeave: options.hasPendingLeave?.(emp.id, dateStr) ?? false,
        hasApprovedPermission: options.hasApprovedPermission?.(emp.id, dateStr) ?? false,
        hasPendingPermission: options.hasPendingPermission?.(emp.id, dateStr) ?? false,
        shiftTimings: options.shiftTimings,
      });

      summaries.push(summary);
    }
  }

  return summaries;
}

// ============================================================================
// تقارير المدير التحليلية
// ============================================================================

/**
 * تحليل حضور موظف في نطاق تاريخي وإنشاء تقرير كامل
 */
export function generateEmployeeReport(
  employeeId: string,
  fullName: string,
  department: string,
  summaries: AttendanceSummary[]
): EmployeeAttendanceReport {
  const totalDays = summaries.length;
  const presentDays = summaries.filter(s => s.status === 'حضور_بوقت' || s.status === 'زمنية_معتمدة').length;
  const absentDays = summaries.filter(s => s.status === 'غائب').length;
  const lateDays = summaries.filter(s => s.status === 'متأخر').length;
  const leaveDays = summaries.filter(s => s.status === 'مجاز' || s.status === 'إجازة_انتظار').length;
  const holidayDays = summaries.filter(s => s.status === 'عطلة').length;

  const overtimeTotalHours = summaries.reduce((sum, s) => sum + s.overtime_minutes, 0) / 60;
  const lateTotalMinutes = summaries.reduce((sum, s) => sum + s.late_minutes, 0);

  const attendanceRate = totalDays > 0
    ? Math.round(((presentDays + lateDays) / totalDays) * 100)
    : 0;

  return {
    employee_id: employeeId,
    full_name: fullName,
    department,
    total_days: totalDays,
    present_days: presentDays,
    absent_days: absentDays,
    late_days: lateDays,
    leave_days: leaveDays,
    holiday_days: holidayDays,
    overtime_total_hours: Math.round(overtimeTotalHours * 100) / 100,
    late_total_minutes: lateTotalMinutes,
    attendance_rate: attendanceRate,
  };
}

/**
 * إنشاء تقارير لجميع أعضاء الفريق
 */
export function generateTeamReports(
  summaries: AttendanceSummary[],
  employees: { id: string; full_name: string; department: string }[]
): EmployeeAttendanceReport[] {
  return employees.map(emp => {
    const empSummaries = summaries.filter(s => s.employee_id === emp.id);
    return generateEmployeeReport(emp.id, emp.full_name, emp.department, empSummaries);
  });
}

/**
 * الحصول على إحصائيات سريعة للفريق
 */
export function getTeamQuickStats(
  reports: EmployeeAttendanceReport[]
): {
  totalEmployees: number;
  averageAttendanceRate: number;
  totalAbsentDays: number;
  totalLateDays: number;
  totalOvertimeHours: number;
  topPerformers: EmployeeAttendanceReport[];
  underPerformers: EmployeeAttendanceReport[];
} {
  const totalEmployees = reports.length;
  const totalAbsentDays = reports.reduce((sum, r) => sum + r.absent_days, 0);
  const totalLateDays = reports.reduce((sum, r) => sum + r.late_days, 0);
  const totalOvertimeHours = reports.reduce((sum, r) => sum + r.overtime_total_hours, 0);
  const averageAttendanceRate = totalEmployees > 0
    ? Math.round(reports.reduce((sum, r) => sum + r.attendance_rate, 0) / totalEmployees)
    : 0;

  // أفضل 5 موظفين (أعلى نسبة حضور)
  const sortedByRate = [...reports].sort((a, b) => b.attendance_rate - a.attendance_rate);
  const topPerformers = sortedByRate.slice(0, 5);
  const underPerformers = sortedByRate.reverse().slice(0, 5);

  return {
    totalEmployees,
    averageAttendanceRate,
    totalAbsentDays,
    totalLateDays,
    totalOvertimeHours: Math.round(totalOvertimeHours * 100) / 100,
    topPerformers,
    underPerformers,
  };
}

// ============================================================================
// تصدير البيانات
// ============================================================================

/**
 * تحويل الملخصات إلى صفوف CSV قابلة للتصدير
 */
export function attendanceToCSVRows(
  summaries: AttendanceSummary[],
  employeeNames: Record<string, string> = {}
): string[][] {
  const header = ['التاريخ', 'الموظف', 'الوردية', 'الدخول', 'الخروج', 'الساعات', 'تأخير (دق)', 'أوفرتايم (دق)', 'الحالة'];

  const rows = summaries.map(s => [
    s.shift_date,
    employeeNames[s.employee_id] || s.employee_id,
    s.shift_type || '--',
    s.check_in ? new Date(s.check_in).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' }) : '--',
    s.check_out ? new Date(s.check_out).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' }) : '--',
    s.total_hours.toFixed(2),
    s.late_minutes.toString(),
    s.overtime_minutes.toString(),
    STATUS_LABELS[s.status] || s.status,
  ]);

  return [header, ...rows];
}

/**
 * إنشاء نص CSV جاهز للتحميل
 */
export function generateCSV(
  summaries: AttendanceSummary[],
  employeeNames: Record<string, string> = {}
): string {
  const rows = attendanceToCSVRows(summaries, employeeNames);
  return rows
    .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    .join('\n');
}

/**
 * إنشاء ملف CSV وتحميله في المتصفح
 */
export function downloadCSV(
  summaries: AttendanceSummary[],
  filename: string,
  employeeNames: Record<string, string> = {}
): void {
  const csv = generateCSV(summaries, employeeNames);
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }); // BOM for Arabic
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * إحصائيات حضور يومية (لـ Dashboard)
 */
export function getDailyAttendanceStats(
  summaries: AttendanceSummary[]
): {
  total: number;
  present: number;
  absent: number;
  late: number;
  onLeave: number;
  onHoliday: number;
  permissionPending: number;
  permissionApproved: number;
  attendanceRate: number;
} {
  const total = summaries.length;
  if (total === 0) {
    return { total: 0, present: 0, absent: 0, late: 0, onLeave: 0, onHoliday: 0, permissionPending: 0, permissionApproved: 0, attendanceRate: 0 };
  }

  const present = summaries.filter(s => s.status === 'حضور_بوقت').length;
  const absent = summaries.filter(s => s.status === 'غائب').length;
  const late = summaries.filter(s => s.status === 'متأخر').length;
  const onLeave = summaries.filter(s => s.status === 'مجاز' || s.status === 'إجازة_انتظار').length;
  const onHoliday = summaries.filter(s => s.status === 'عطلة').length;
  const permissionApproved = summaries.filter(s => s.status === 'زمنية_معتمدة').length;
  const permissionPending = summaries.filter(s => s.status === 'زمنية_انتظار').length;

  const effectivePresent = present + late + permissionApproved + permissionPending;
  const attendanceRate = Math.round((effectivePresent / total) * 100);

  return {
    total,
    present,
    absent,
    late,
    onLeave,
    onHoliday,
    permissionPending,
    permissionApproved,
    attendanceRate,
  };
}