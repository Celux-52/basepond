import { BaseAgent } from '../core/base.agent';

export class EmailValidationAgent extends BaseAgent<string | null, string | null> {
  constructor() {
    super('EmailValidationAgent');
  }

  async execute(email: string | null): Promise<string | null> {
    if (!email) return null;

    const lowerEmail = email.toLowerCase().trim();

    // Basic format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(lowerEmail)) {
      this.log(`Invalid email format: ${email}`);
      return null;
    }

    // Common fake or bad emails
    const blacklistedDomains = ['example.com', 'test.com', 'wixsite.com', 'domain.com'];
    const domain = lowerEmail.split('@')[1];

    if (blacklistedDomains.includes(domain)) {
      this.log(`Blacklisted email domain: ${email}`);
      return null;
    }

    if (lowerEmail.startsWith('admin@') || lowerEmail.startsWith('test@')) {
      // Some admin emails are valid, but if it's admin@domain.com it might be fake. We'll allow it but log it.
      this.log(`Generic email detected: ${email}`);
    }

    return lowerEmail;
  }
}
