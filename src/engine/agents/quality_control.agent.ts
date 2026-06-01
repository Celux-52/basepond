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

    this.log('QA Passed.');
    return true;
  }
}
