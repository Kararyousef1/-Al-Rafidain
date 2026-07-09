/**
 * ════════════════════════════════════════════════════════════════
 *  FinanceService - خدمة المجال المالي (نسخة SDK جديدة)
 *  Domain: Finance
 *  تشمل: expense_requests, employee_loans, bonuses
 *  تم دمجها في Domain واحد وفقاً لمبدأ KISS
 * ════════════════════════════════════════════════════════════════
 */

import { BaseService } from './BaseService';

// ─────────────────────────────────────────────────
//  Expense Requests
// ─────────────────────────────────────────────────

class ExpenseRequestService extends BaseService {
  constructor() {
    super('expense_requests');
  }

  /**
   * جلب طلبات المصروفات لموظف معين
   */
  async findByEmployee(employeeId: string): Promise<any[]> {
    return this.findAll({
      filters: { employee_id: employeeId },
      orderBy: 'created_at',
      ascending: false,
    });
  }

  /**
   * إنشاء طلب مصروفات جديد
   */
  async createRequest(data: {
    employee_id: string;
    amount: number;
    category: string;
    description?: string;
    receipt_url?: string;
  }): Promise<any> {
    return this.create(data as unknown as Record<string, unknown>);
  }

  /**
   * الموافقة على طلب مصروفات
   */
  async approveRequest(id: string, approvedBy: string): Promise<any> {
    return this.update(id, {
      status: 'approved',
      approved_by: approvedBy,
      approved_at: new Date().toISOString(),
    } as unknown as Record<string, unknown>);
  }

  /**
   * رفض طلب مصروفات
   */
  async rejectRequest(id: string, reason: string): Promise<any> {
    return this.update(id, {
      status: 'rejected',
      rejection_reason: reason,
    } as unknown as Record<string, unknown>);
  }
}

// ─────────────────────────────────────────────────
//  Employee Loans
// ─────────────────────────────────────────────────

class EmployeeLoanService extends BaseService {
  constructor() {
    super('employee_loans');
  }

  /**
   * جلب قروض موظف معين
   */
  async findByEmployee(employeeId: string): Promise<any[]> {
    return this.findAll({
      filters: { employee_id: employeeId },
      orderBy: 'created_at',
      ascending: false,
    });
  }

  /**
   * إنشاء قرض جديد
   */
  async createLoan(data: {
    employee_id: string;
    amount: number;
    reason?: string;
    installment_count?: number;
    monthly_installment?: number;
  }): Promise<any> {
    return this.create(data as unknown as Record<string, unknown>);
  }

  /**
   * الموافقة على قرض
   */
  async approveLoan(id: string, approvedBy: string): Promise<any> {
    return this.update(id, {
      status: 'active',
      approved_by: approvedBy,
      approved_at: new Date().toISOString(),
    } as unknown as Record<string, unknown>);
  }

  /**
   * رفض قرض
   */
  async rejectLoan(id: string, reason?: string): Promise<any> {
    return this.update(id, {
      status: 'rejected',
      rejection_reason: reason || null,
    } as unknown as Record<string, unknown>);
  }
}

// ─────────────────────────────────────────────────
//  Bonuses
// ─────────────────────────────────────────────────

class BonusService extends BaseService {
  constructor() {
    super('bonuses');
  }

  /**
   * جلب المكافآت
   */
  async findAllBonuses(options?: {
    employeeId?: string;
    status?: string;
  }): Promise<any[]> {
    const filters: Record<string, unknown> = {};
    if (options?.employeeId) filters.employee_id = options.employeeId;
    if (options?.status) filters.status = options.status;
    return this.findAll({
      filters: Object.keys(filters).length > 0 ? filters : undefined,
      orderBy: 'created_at',
      ascending: false,
    });
  }

  /**
   * إنشاء مكافأة جديدة
   */
  async createBonus(data: {
    employee_id: string;
    amount: number;
    reason?: string;
    bonus_type?: string;
  }): Promise<any> {
    return this.create(data as unknown as Record<string, unknown>);
  }

  /**
   * الموافقة على مكافأة
   */
  async approveBonus(id: string): Promise<any> {
    return this.update(id, {
      status: 'approved',
      approved_at: new Date().toISOString(),
    } as unknown as Record<string, unknown>);
  }

  /**
   * إلغاء مكافأة
   */
  async cancelBonus(id: string): Promise<any> {
    return this.update(id, {
      status: 'cancelled',
    } as unknown as Record<string, unknown>);
  }
}

// ─────────────────────────────────────────────────
//  التصدير
// ─────────────────────────────────────────────────

export const expenseRequestService = new ExpenseRequestService();
export const employeeLoanService = new EmployeeLoanService();
export const bonusService = new BonusService();