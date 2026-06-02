import { BaseAgent } from '../core/base.agent';
import * as cheerio from 'cheerio';

export interface WebsiteOutput {
  website_status: 'Active' | 'Broken' | 'Unknown';
  seo_score: number;
  mobile_score: number;
  has_ssl: boolean;
  has_contact_form: boolean;
  social_links: string[];
  signals: string[];
  html_text_snippet: string; // Used for further AI analysis
}

export class WebsiteIntelligenceAgent extends BaseAgent<string | null, WebsiteOutput> {
  constructor() {
    super('WebsiteIntelligenceAgent');
  }

  async execute(website: string | null): Promise<WebsiteOutput> {
    const fallback: WebsiteOutput = { 
      website_status: 'Unknown', 
      seo_score: 0, 
      mobile_score: 0, 
      has_ssl: false,
      has_contact_form: false,
      social_links: [],
      signals: ["Web sitesi yok"],
      html_text_snippet: ""
    };

    if (!website || website === 'Yok') {
      return fallback;
    }

    // Ensure URL has protocol
    let url = website;
    if (!url.startsWith('http')) {
      url = 'https://' + url;
    }

    let status: 'Active' | 'Broken' = 'Active';
    let seo = 50;
    let mobile = 50;
    let has_ssl = url.startsWith('https');
    let has_contact_form = false;
    let social_links: string[] = [];
    let signals: string[] = [];
    let html_text_snippet = "";

    try {
      // Abort controller to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 sec timeout

      const response = await fetch(url, { 
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // 1. SSL Check (Strict)
      if (response.url.startsWith('https')) {
        has_ssl = true;
      } else {
        has_ssl = false;
        signals.push("SSL sertifikası yok");
      }

      // 2. SEO & Mobile checks
      const hasViewport = $('meta[name="viewport"]').length > 0;
      if (!hasViewport) {
        mobile = 20;
        signals.push("Mobil uyumsuz web sitesi");
      } else {
        mobile = 85;
      }

      const hasTitle = $('title').text().length > 0;
      const hasMetaDesc = $('meta[name="description"]').length > 0;
      if (!hasTitle || !hasMetaDesc) {
        seo = 30;
        signals.push("SEO sorunları mevcut");
      } else {
        seo = 80;
      }

      // 3. Contact Form
      if ($('form').length > 0 || html.toLowerCase().includes('iletisim') || html.toLowerCase().includes('contact')) {
        has_contact_form = true;
      } else {
        signals.push("İletişim formu yok");
      }

      // 4. Social Links
      $('a').each((_, el) => {
        const href = $(el).attr('href')?.toLowerCase() || '';
        if (href.includes('instagram.com')) social_links.push('instagram');
        if (href.includes('facebook.com')) social_links.push('facebook');
        if (href.includes('twitter.com') || href.includes('x.com')) social_links.push('twitter');
        if (href.includes('linkedin.com')) social_links.push('linkedin');
      });

      // Extract raw text for AI to analyze design/context
      html_text_snippet = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 1500);

    } catch (e) {
      status = 'Broken';
      seo = 0;
      mobile = 0;
      signals.push("Web sitesi çalışmıyor");
    }

    return {
      website_status: status,
      seo_score: seo,
      mobile_score: mobile,
      has_ssl,
      has_contact_form,
      social_links: [...new Set(social_links)],
      signals,
      html_text_snippet
    };
  }
}
