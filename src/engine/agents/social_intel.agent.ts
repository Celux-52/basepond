import { BaseAgent } from '../core/base.agent';

export interface SocialInput {
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
}

export interface SocialOutput {
  social_score: number;
  is_active: boolean;
  primary_network: string | null;
}

export class SocialIntelligenceAgent extends BaseAgent<SocialInput, SocialOutput> {
  constructor() {
    super('SocialIntelligenceAgent');
  }

  async execute(input: SocialInput): Promise<SocialOutput> {
    let score = 0;
    let primary = null;
    let active = false;

    if (input.instagram && input.instagram !== 'Yok') {
      score += 40;
      primary = 'Instagram';
      active = true;
    }

    if (input.tiktok && input.tiktok !== 'Yok') {
      score += 30;
      if (!primary) primary = 'TikTok';
      active = true;
    }

    if (input.facebook && input.facebook !== 'Yok') {
      score += 20;
      if (!primary) primary = 'Facebook';
      active = true;
    }

    return {
      social_score: Math.min(100, score),
      is_active: active,
      primary_network: primary
    };
  }
}
