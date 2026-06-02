import { BaseAgent } from '../core/base.agent';
import { BusinessRecord } from '../types/business';

export class QualityControlAgent extends BaseAgent<BusinessRecord, boolean> {
  constructor() {
    super('QualityControlAgent');
  }

  async execute(business: BusinessRecord): Promise<boolean> {
    this.log(`Running QA check on: ${business.business_name}`);

    // 1. Must have a phone
    if (!business.phone) {
      this.log('QA Failed: Missing Phone');
      return false;
    }

    // 2. Must have a valid name
    if (business.business_name.length < 3 || business.business_name.toLowerCase().includes('kapalı')) {
      this.log('QA Failed: Invalid or closed business name');
      return false;
    }

    // 3. Must have a category
    if (!business.category) {
      this.log('QA Failed: Missing category');
      return false;
    }

    // 4. Must not be fake social media (basic check)
    if (business.instagram && business.instagram.length < 5) {
      business.instagram = null; // Clean it up instead of rejecting
    }

    // 5. STRICT AI QUALITY CONTROL: Reject if AI failed to find a valid reason or service
    const isAiFailStr = (str: string | null | undefined) => {
      if (!str) return true;
      const lower = str.toLowerCase();
      if (lower.includes('veri yetersiz') || lower.includes('bulunamadı') || lower.includes('bilgi yok') || str.length < 5) {
        return true;
      }
      return false;
    };

    if (isAiFailStr(business.opportunity_analysis)) {
      this.log('QA Failed: Empty or invalid opportunity_analysis');
      return false;
    }

    if (isAiFailStr(business.why_now)) {
      this.log('QA Failed: Empty or invalid why_now');
      return false;
    }

    if (!business.recommended_services || business.recommended_services.length === 0 || business.recommended_services[0] === 'Genel Analiz') {
      this.log('QA Failed: No valid recommended_services found');
      return false;
    }

    this.log('QA Passed.');
    return true;
  }
}
