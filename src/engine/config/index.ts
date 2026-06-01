import path from 'path';
import os from 'os';

export const CONFIG = {
  // Desktop Export Path
  EXPORT_BASE_DIR: path.join(os.homedir(), 'OneDrive', 'Desktop', 'Kuafor Toptancilarina Musteriler'),
  
  // Rate Limits
  GOOGLE_MAPS_MAX_RESULTS: 60,
  REQUEST_DELAY_MS: 1200, // 1.2s to prevent rate limits
  
  // Scoring Thresholds
  PREMIUM_TRUST_SCORE_MIN: 70,
  PREMIUM_AI_SCORE_MIN: 75,
  
  // Required Fields
  PHONE_REQUIRED: true,
  
  // Target Locations (Sample)
  TARGETS: [
    { city: "Istanbul", districts: ["Kadıköy", "Beşiktaş", "Şişli", "Bakırköy"] }
    // More added dynamically
  ],
  
  CATEGORIES: [
    "Kuaför", "Bayan Kuaförü", "Erkek Kuaförü", "Güzellik Merkezi"
  ],
  // Cost Manager
  COST_TRACKING_ENABLED: true,

  // Sektörel AI Config (Örnek)
  SECTOR_RULES: {
    "Dijital Pazarlama": {
      primaryScore: "DIGITAL MARKETING SCORE",
      focus: ["sosyal medya aktifliği", "reklam potansiyeli", "içerik kalitesi"]
    },
    "Toptancı & Tedarik": {
      primaryScore: "SUPPLIER SCORE",
      focus: ["büyüklük", "şube sayısı", "satın alma potansiyeli"]
    },
    "default": {
      primaryScore: "GENERAL OPPORTUNITY SCORE",
      focus: ["dijital varlık", "büyüme potansiyeli"]
    }
  }
};
