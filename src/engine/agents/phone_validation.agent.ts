import { BaseAgent } from '../core/base.agent';

export class PhoneValidationAgent extends BaseAgent<string | null, string | null> {
  constructor() {
    super('PhoneValidationAgent');
  }

  async execute(phone: string | null): Promise<string | null> {
    if (!phone) {
      this.log('Phone is empty. Rejecting.');
      return null;
    }

    const digits = phone.replace(/[^\d+]/g, '');
    
    // Turkish specific rules (Global-ready approach could inject rules by country)
    if (/^(0|1|2|3|4|5|6|7|8|9)\1+$/.test(digits)) {
      this.log(`Fake phone detected (all same digits): ${phone}`);
      return null;
    }
    
    if (digits.length < 10) {
      this.log(`Phone too short: ${phone}`);
      return null;
    }

    if (digits.includes('123456')) {
      this.log(`Sequential fake digits: ${phone}`);
      return null;
    }

    // Must match Turkish format: +90, 0, or raw 10 digits starting with 2-9
    const isValid = /^(?:\+90|90|0)?(?:[2-9]\d{2})\d{7}$/.test(digits);
    
    if (!isValid) {
      this.log(`Invalid Turkish phone format: ${phone}`);
      return null;
    }

    // Format clean
    return this.formatPhoneNumber(digits);
  }

  private formatPhoneNumber(digits: string): string {
    const clean = digits.replace(/[^\d]/g, '');
    if (clean.length === 10) return `+90 ${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6, 8)} ${clean.slice(8, 10)}`;
    if (clean.length === 11 && clean.startsWith('0')) return `+90 ${clean.slice(1, 4)} ${clean.slice(4, 7)} ${clean.slice(7, 9)} ${clean.slice(9, 11)}`;
    if (clean.length === 12 && clean.startsWith('90')) return `+90 ${clean.slice(2, 5)} ${clean.slice(5, 8)} ${clean.slice(8, 10)} ${clean.slice(10, 12)}`;
    return `+${digits}`; // Fallback for international
  }
}
