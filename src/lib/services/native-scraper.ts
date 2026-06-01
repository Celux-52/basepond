import * as cheerio from 'cheerio';

export interface NativeEnrichmentResult {
  is_alive: boolean;
  emails: string[];
  phones: string[];
  socials: {
    instagram: string | null;
    linkedin: string | null;
    facebook: string | null;
    twitter: string | null;
  };
  title: string | null;
  meta_description: string | null;
  trust_signals: {
    has_contact_page: boolean;
    has_booking_system: boolean;
    has_pixels: boolean;
  };
}

// Helper to clean and format phone numbers to standard format (e.g., +90 532 123 45 67)
function cleanPhoneNumber(phone: string): string | null {
  // Remove all non-numeric characters except leading +
  const digits = phone.replace(/[^\d+]/g, '');
  
  if (digits.length < 7) return null;
  
  // Format Turkish numbers
  if (digits.startsWith('+90') && digits.length === 13) {
    return digits;
  }
  if (digits.startsWith('90') && digits.length === 12) {
    return `+${digits}`;
  }
  if (digits.startsWith('0') && digits.length === 11) {
    return `+90${digits.slice(1)}`;
  }
  if (digits.length === 10 && (digits.startsWith('5') || digits.startsWith('2') || digits.startsWith('3') || digits.startsWith('8'))) {
    return `+90${digits}`;
  }
  
  return phone.trim();
}

async function fetchPageHtml(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'tr,en-US;q=0.7,en;q=0.3'
      },
      signal: AbortSignal.timeout(8000)
    });

    if (!response.ok) return null;
    return await response.text();
  } catch (err) {
    return null;
  }
}

export async function scrapeBusinessWebsite(url: string): Promise<NativeEnrichmentResult> {
  const result: NativeEnrichmentResult = {
    is_alive: false,
    emails: [],
    phones: [],
    socials: { instagram: null, linkedin: null, facebook: null, twitter: null },
    title: null,
    meta_description: null,
    trust_signals: { has_contact_page: false, has_booking_system: false, has_pixels: false }
  };

  try {
    if (!url.startsWith('http')) {
      url = `https://${url}`;
    }

    const baseUri = new URL(url);
    const homepageHtml = await fetchPageHtml(url);
    if (!homepageHtml) return result;

    result.is_alive = true;
    
    // Extract info from a page HTML
    const extractFromHtml = (html: string, pageUrl: string) => {
      const $ = cheerio.load(html);

      if (pageUrl === url) {
        result.title = $('title').text().trim() || null;
        result.meta_description = $('meta[name="description"]').attr('content')?.trim() || null;
      }

      // 1. Email extraction from mailto links
      $('a[href^="mailto:"]').each((_, el) => {
        const mailto = $(el).attr('href')?.replace(/mailto:/i, '').split('?')[0].trim();
        if (mailto && mailto.includes('@')) {
          result.emails.push(mailto);
        }
      });

      // 2. Phone extraction from tel links
      $('a[href^="tel:"]').each((_, el) => {
        const tel = $(el).attr('href')?.replace(/tel:/i, '').split('?')[0].trim();
        const cleaned = cleanPhoneNumber(tel || '');
        if (cleaned) {
          result.phones.push(cleaned);
        }
      });

      // 3. Social media links
      $('a').each((_, el) => {
        const href = $(el).attr('href');
        if (!href) return;
        const lowerHref = href.toLowerCase();

        if (lowerHref.includes('instagram.com/')) {
          result.socials.instagram = href;
        }
        if (lowerHref.includes('linkedin.com/')) {
          result.socials.linkedin = href;
        }
        if (lowerHref.includes('facebook.com/')) {
          result.socials.facebook = href;
        }
        if (lowerHref.includes('twitter.com/') || lowerHref.includes('x.com/')) {
          result.socials.twitter = href;
        }

        // Trust signal markers
        if (lowerHref.includes('iletisim') || lowerHref.includes('contact') || lowerHref.includes('ulasin') || lowerHref.includes('hakkimizda') || lowerHref.includes('about')) {
          result.trust_signals.has_contact_page = true;
        }
        if (lowerHref.includes('rezervasyon') || lowerHref.includes('booking') || lowerHref.includes('calendly')) {
          result.trust_signals.has_booking_system = true;
        }
      });

      // 4. Regex email extraction from raw text
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const foundEmails = html.match(emailRegex) || [];
      for (const email of foundEmails) {
        const lowerEmail = email.toLowerCase();
        // Skip common asset file extensions false matches
        if (!lowerEmail.endsWith('.png') && !lowerEmail.endsWith('.jpg') && !lowerEmail.endsWith('.jpeg') && !lowerEmail.endsWith('.gif') && !lowerEmail.endsWith('.webp') && !lowerEmail.endsWith('.svg')) {
          result.emails.push(email);
        }
      }

      // 5. Regex phone extraction from raw text (Turkish formats)
      // Matches mobile (5xx xxx xx xx) and landlines (2xx xxx xx xx, 3xx, 850 etc)
      const phoneRegex = /(?:\+90|0)?\s*\(?([2-9]\d{2})\)?\s*[-.\s]?\s*(\d{3})\s*[-.\s]?\s*(\d{2})\s*[-.\s]?\s*(\d{2})/g;
      let match;
      while ((match = phoneRegex.exec(html)) !== null) {
        const fullPhone = match[0];
        const cleaned = cleanPhoneNumber(fullPhone);
        if (cleaned) {
          result.phones.push(cleaned);
        }
      }

      // Pixel detection (ad trackers)
      if (html.includes('fbevents.js') || html.includes('gtag/js') || html.includes('googletagmanager')) {
        result.trust_signals.has_pixels = true;
      }
    };

    // Extract from homepage first
    extractFromHtml(homepageHtml, url);

    // Find contact page link and scrape it for deeper enrichment
    const $home = cheerio.load(homepageHtml);
    let contactPageUrl: string | null = null;

    $home('a').each((_, el) => {
      if (contactPageUrl) return; // Stop at first contact link
      const href = $home(el).attr('href');
      const text = $home(el).text().toLowerCase().trim();
      
      if (!href) return;
      const lowerHref = href.toLowerCase();

      // Detect Turkish/English contact markers in href or anchor text
      const isContactLink = 
        lowerHref.includes('iletisim') || 
        lowerHref.includes('contact') || 
        lowerHref.includes('ulasin') ||
        text.includes('iletişim') ||
        text.includes('iletisim') ||
        text.includes('bize ulaşın') ||
        text.includes('contact');

      if (isContactLink) {
        try {
          if (href.startsWith('http')) {
            contactPageUrl = href;
          } else {
            // Handle relative link
            const separator = href.startsWith('/') ? '' : '/';
            contactPageUrl = `${baseUri.protocol}//${baseUri.host}${separator}${href}`;
          }
        } catch (e) {
          // invalid url
        }
      }
    });

    // Crawl contact page if found
    if (contactPageUrl && contactPageUrl !== url) {
      const contactPageHtml = await fetchPageHtml(contactPageUrl);
      if (contactPageHtml) {
        extractFromHtml(contactPageHtml, contactPageUrl);
      }
    }

    // Deduplicate lists
    result.emails = Array.from(new Set(result.emails));
    result.phones = Array.from(new Set(result.phones));

    return result;
  } catch (error) {
    console.warn(`Scraping failed for ${url}:`, error);
    return result;
  }
}
