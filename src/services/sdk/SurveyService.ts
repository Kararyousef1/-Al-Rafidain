/**
 * ════════════════════════════════════════════════════════════════
 *  SurveyService - خدمة الاستبيانات (نسخة SDK جديدة)
 *  Domain: Survey
 *  تشمل: survey_responses
 * ════════════════════════════════════════════════════════════════
 */

import { BaseService } from './BaseService';

class SurveyResponseService extends BaseService {
  constructor() { super('survey_responses'); }

  async createResponse(data: Record<string, unknown>): Promise<any> {
    return this.create(data);
  }
}

export const surveyResponseService = new SurveyResponseService();