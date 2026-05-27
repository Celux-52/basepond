const fs = require('fs');

const locales = ['en', 'tr', 'es', 'pt', 'de', 'fr', 'it', 'ru', 'ar', 'hi', 'zh', 'ja', 'ko', 'id', 'vi', 'nl', 'pl', 'uk'];

const en = {
  Index: {
    title: "SnapLead - AI Lead Intelligence Platform",
    headline: "Find, Analyze, and Win More Clients Automatically",
    subheadline: "Global AI lead generation for web designers, agencies, and freelancers. Get scored leads, automated sales messages, proposals, and redesign previews in seconds.",
    getStarted: "Get Started",
    watchDemo: "Watch Demo",
  },
  Navbar: {
    features: "Features",
    workflow: "How it works",
    pricing: "Pricing",
    faq: "FAQ",
    login: "Log In",
    getStarted: "Get Started"
  },
  Features: {
    title: "Powerful AI Features",
    subtitle: "Everything you need to turn cold leads into paying clients.",
    feature1Title: "Automatic Sales Message",
    feature1Desc: "AI-generated, highly personalized outreach emails tailored to each lead's specific niche and location.",
    feature2Title: "Website Redesign Preview",
    feature2Desc: "Generate stunning before/after previews for businesses with poor websites to instantly grab their attention.",
    feature3Title: "AI Proposal Generator",
    feature3Desc: "Create comprehensive, professional proposals in seconds, complete with pricing and project scope.",
    feature4Title: "AI Sales Script",
    feature4Desc: "Custom cold-calling scripts optimized for high conversion rates, designed specifically for your target."
  },
  Workflow: {
    title: "How SnapLead Works",
    step1: "1. Find Businesses",
    step1Desc: "Select location and niche.",
    step2: "2. Analyze & Score",
    step2Desc: "System evaluates their digital presence.",
    step3: "3. Generate Assets",
    step3Desc: "AI writes the perfect outreach.",
    step4: "4. Win Clients",
    step4Desc: "Send, track, and close deals."
  },
  Pricing: {
    title: "Simple, Transparent Pricing",
    monthly: "Monthly",
    annual: "Annually",
    starter: "Starter",
    pro: "Pro",
    enterprise: "Enterprise",
    popular: "Most Popular",
    getStarted: "Get Started Now"
  },
  FAQ: {
    title: "Frequently Asked Questions",
    q1: "What makes SnapLead different?",
    a1: "SnapLead combines global data with advanced AI to not just find leads, but score them and generate the exact assets you need to close them.",
    q2: "Can I use it in any country?",
    a2: "Yes, our data covers businesses worldwide across over 18 languages.",
    q3: "Do you offer a free trial?",
    a3: "We offer a 7-day risk-free trial on all our plans."
  },
  Footer: {
    product: "Product",
    company: "Company",
    legal: "Legal",
    copyright: "© 2026 SnapLead. All rights reserved."
  },
  Dashboard: {
    hotLead: "Hot Lead",
    generateMessage: "Generate Message",
    generateProposal: "Proposal",
    redesignPreview: "Redesign Preview",
    exportCsv: "Export CSV",
    filters: "Filters",
    country: "Country",
    city: "City",
    niche: "Niche"
  },
  Auth: {
    loginTitle: "Welcome back",
    loginSubtitle: "Enter your email to sign in to your account",
    signupTitle: "Create an account",
    signupSubtitle: "Enter your email below to create your account",
    forgotPasswordTitle: "Forgot password?",
    forgotPasswordSubtitle: "Enter your email address and we will send you a password reset link.",
    resetPasswordTitle: "Reset password",
    resetPasswordSubtitle: "Enter your new password below.",
    email: "Email",
    emailPlaceholder: "m@example.com",
    password: "Password",
    passwordPlaceholder: "••••••••",
    confirmPassword: "Confirm Password",
    loginButton: "Sign In",
    signupButton: "Sign Up",
    sendResetLink: "Send reset link",
    updatePassword: "Update password",
    orContinueWith: "Or continue with",
    dontHaveAccount: "Don't have an account?",
    alreadyHaveAccount: "Already have an account?",
    forgotPasswordLink: "Forgot your password?",
    backToLogin: "Back to login",
    invalidCredentials: "Invalid login credentials",
    passwordsDontMatch: "Passwords do not match",
    emailSent: "Check your email for the confirmation link"
  }
};

const baseDir = './messages';
if (!fs.existsSync(baseDir)){
    fs.mkdirSync(baseDir);
}

locales.forEach(loc => {
  let content = en;
  if(loc === 'tr') {
    content = {
      ...content,
      Index: { title: "SnapLead - Yapay Zeka Müşteri Bulma", headline: "Daha Fazla Müşteri Kazanın", subheadline: "Web tasarımcıları ve ajanslar için saniyeler içinde otomatik mesajlar ve analizler.", getStarted: "Başla", watchDemo: "Demo İzle" },
      Navbar: { features: "Özellikler", workflow: "Nasıl Çalışır", pricing: "Fiyatlar", faq: "SSS", login: "Giriş", getStarted: "Kayıt Ol" },
      Features: { title: "Güçlü Yapay Zeka", subtitle: "Soğuk müşterileri satışa dönüştürün.", feature1Title: "Otomatik Satış Mesajı", feature1Desc: "Yapay zeka ile kişiselleştirilmiş mesajlar.", feature2Title: "Web Sitesi Önizleme", feature2Desc: "Müşterilerin dikkatini çekecek tasarım önizlemeleri.", feature3Title: "Teklif Oluşturucu", feature3Desc: "Saniyeler içinde teklif hazırlayın.", feature4Title: "Satış Senaryosu", feature4Desc: "İkna edici telefon görüşmesi metinleri." },
      Workflow: { title: "Nasıl Çalışır?", step1: "1. Müşteri Bul", step1Desc: "Konum ve sektör seçin.", step2: "2. Analiz Et", step2Desc: "Dijital varlıklarını incele.", step3: "3. İçerik Üret", step3Desc: "Satış mesajlarını hazırla.", step4: "4. Müşteri Kazan", step4Desc: "Anlaşmaları kapat." },
      Pricing: { title: "Fiyatlandırma", monthly: "Aylık", annual: "Yıllık", starter: "Başlangıç", pro: "Profesyonel", enterprise: "Kurumsal", popular: "Popüler", getStarted: "Başla" },
      FAQ: { title: "Sıkça Sorulan Sorular", q1: "Farkı nedir?", a1: "Yapay zeka ile müşteri bulur ve analiz eder.", q2: "Her ülkede geçerli mi?", a2: "Evet, tüm dünyada.", q3: "Ücretsiz deneme var mı?", a3: "Evet, 7 gün ücretsiz." },
      Footer: { product: "Ürün", company: "Şirket", legal: "Yasal", copyright: "© 2026 SnapLead." },
      Dashboard: { hotLead: "Sıcak Fırsat", generateMessage: "Mesaj Üret", generateProposal: "Teklif Üret", redesignPreview: "Önizleme", exportCsv: "CSV İndir", filters: "Filtreler", country: "Ülke", city: "Şehir", niche: "Sektör" },
      Auth: {
        loginTitle: "Tekrar hoş geldiniz",
        loginSubtitle: "Hesabınıza giriş yapmak için e-postanızı girin",
        signupTitle: "Hesap oluşturun",
        signupSubtitle: "Hesabınızı oluşturmak için bilgilerinizi girin",
        forgotPasswordTitle: "Şifrenizi mi unuttunuz?",
        forgotPasswordSubtitle: "E-posta adresinizi girin, size bir sıfırlama bağlantısı gönderelim.",
        resetPasswordTitle: "Şifre sıfırlama",
        resetPasswordSubtitle: "Aşağıya yeni şifrenizi girin.",
        email: "E-posta",
        emailPlaceholder: "isim@ornek.com",
        password: "Şifre",
        passwordPlaceholder: "••••••••",
        confirmPassword: "Şifreyi Onayla",
        loginButton: "Giriş Yap",
        signupButton: "Kayıt Ol",
        sendResetLink: "Sıfırlama linki gönder",
        updatePassword: "Şifreyi güncelle",
        orContinueWith: "Veya şununla devam edin",
        dontHaveAccount: "Hesabınız yok mu?",
        alreadyHaveAccount: "Zaten bir hesabınız var mı?",
        forgotPasswordLink: "Şifrenizi mi unuttunuz?",
        backToLogin: "Girişe dön",
        invalidCredentials: "Hatalı e-posta veya şifre",
        passwordsDontMatch: "Şifreler eşleşmiyor",
        emailSent: "Onay bağlantısı için e-postanızı kontrol edin"
      }
    };
  } else if (loc === 'es') {
    content = {
      ...content,
      Index: { title: "SnapLead - Inteligencia de Clientes", headline: "Encuentra y Cierra Más Clientes", subheadline: "Generación global de leads con IA.", getStarted: "Empezar", watchDemo: "Ver Demo" },
      Navbar: { features: "Características", workflow: "Cómo funciona", pricing: "Precios", faq: "FAQ", login: "Iniciar Sesión", getStarted: "Empezar" },
      Features: { title: "Características de IA", subtitle: "Todo lo que necesitas para convertir leads.", feature1Title: "Mensaje Automático", feature1Desc: "Emails personalizados con IA.", feature2Title: "Vista Previa", feature2Desc: "Diseños previos de web.", feature3Title: "Generador de Propuestas", feature3Desc: "Propuestas en segundos.", feature4Title: "Guión de Ventas", feature4Desc: "Guiones de llamadas personalizados." },
      Workflow: { title: "Cómo Funciona", step1: "1. Buscar", step1Desc: "Elige ubicación y nicho.", step2: "2. Analizar", step2Desc: "Evalúa presencia digital.", step3: "3. Generar", step3Desc: "IA crea mensajes.", step4: "4. Cerrar", step4Desc: "Gana el cliente." },
      Pricing: { title: "Precios", monthly: "Mensual", annual: "Anual", starter: "Básico", pro: "Pro", enterprise: "Empresa", popular: "Más Popular", getStarted: "Empezar Ahora" },
      FAQ: { title: "Preguntas Frecuentes", q1: "¿Qué lo hace diferente?", a1: "Combina datos con IA avanzada.", q2: "¿Funciona en mi país?", a2: "Sí, cobertura global.", q3: "¿Tienen prueba gratuita?", a3: "Prueba de 7 días." },
      Footer: { product: "Producto", company: "Empresa", legal: "Legal", copyright: "© 2026 SnapLead." },
      Dashboard: { hotLead: "Lead Caliente", generateMessage: "Generar Mensaje", generateProposal: "Generar Propuesta", redesignPreview: "Vista Previa", exportCsv: "Exportar CSV", filters: "Filtros", country: "País", city: "Ciudad", niche: "Nicho" },
      Auth: {
        loginTitle: "Bienvenido de nuevo",
        loginSubtitle: "Ingresa tu correo para iniciar sesión",
        signupTitle: "Crear una cuenta",
        signupSubtitle: "Ingresa tu correo para crear una cuenta",
        forgotPasswordTitle: "¿Olvidaste tu contraseña?",
        forgotPasswordSubtitle: "Ingresa tu correo y te enviaremos un enlace de recuperación.",
        resetPasswordTitle: "Restablecer contraseña",
        resetPasswordSubtitle: "Ingresa tu nueva contraseña abajo.",
        email: "Correo Electrónico",
        emailPlaceholder: "m@ejemplo.com",
        password: "Contraseña",
        passwordPlaceholder: "••••••••",
        confirmPassword: "Confirmar Contraseña",
        loginButton: "Iniciar Sesión",
        signupButton: "Registrarse",
        sendResetLink: "Enviar enlace",
        updatePassword: "Actualizar contraseña",
        orContinueWith: "O continuar con",
        dontHaveAccount: "¿No tienes una cuenta?",
        alreadyHaveAccount: "¿Ya tienes una cuenta?",
        forgotPasswordLink: "¿Olvidaste tu contraseña?",
        backToLogin: "Volver a iniciar sesión",
        invalidCredentials: "Credenciales inválidas",
        passwordsDontMatch: "Las contraseñas no coinciden",
        emailSent: "Revisa tu correo para el enlace de confirmación"
      }
    };
  } else if (loc === 'de') {
    content = {
      ...content,
      Index: { title: "SnapLead - KI Lead Plattform", headline: "Finde und Gewinne Mehr Kunden", subheadline: "Globale KI-Leadgenerierung.", getStarted: "Loslegen", watchDemo: "Demo Ansehen" },
      Navbar: { features: "Funktionen", workflow: "Wie es funktioniert", pricing: "Preise", faq: "FAQ", login: "Anmelden", getStarted: "Loslegen" },
      Features: { title: "KI Funktionen", subtitle: "Verwandle kalte Leads in zahlende Kunden.", feature1Title: "Automatische Nachricht", feature1Desc: "Personalisierte E-Mails.", feature2Title: "Redesign Vorschau", feature2Desc: "Website Vorschauen erstellen.", feature3Title: "Angebotsgenerator", feature3Desc: "Erstelle Angebote in Sekunden.", feature4Title: "Verkaufsskript", feature4Desc: "Skripte für Kaltakquise." },
      Workflow: { title: "Wie SnapLead Funktioniert", step1: "1. Finden", step1Desc: "Ort und Nische wählen.", step2: "2. Analysieren", step2Desc: "Bewertung der Website.", step3: "3. Generieren", step3Desc: "KI erstellt Inhalte.", step4: "4. Gewinnen", step4Desc: "Kunden abschließen." },
      Pricing: { title: "Preise", monthly: "Monatlich", annual: "Jährlich", starter: "Starter", pro: "Pro", enterprise: "Enterprise", popular: "Beliebt", getStarted: "Jetzt Loslegen" },
      FAQ: { title: "FAQ", q1: "Was ist besonders?", a1: "Wir kombinieren Daten mit KI.", q2: "Geht das überall?", a2: "Ja, weltweit.", q3: "Gibt es eine Testversion?", a3: "Ja, 7 Tage kostenlos." },
      Footer: { product: "Produkt", company: "Unternehmen", legal: "Rechtliches", copyright: "© 2026 SnapLead." },
      Dashboard: { hotLead: "Heißer Lead", generateMessage: "Nachricht Erstellen", generateProposal: "Angebot Erstellen", redesignPreview: "Redesign Vorschau", exportCsv: "CSV Export", filters: "Filter", country: "Land", city: "Stadt", niche: "Nische" },
      Auth: {
        loginTitle: "Willkommen zurück",
        loginSubtitle: "Geben Sie Ihre E-Mail-Adresse ein, um sich anzumelden",
        signupTitle: "Konto erstellen",
        signupSubtitle: "Geben Sie Ihre E-Mail-Adresse ein, um ein Konto zu erstellen",
        forgotPasswordTitle: "Passwort vergessen?",
        forgotPasswordSubtitle: "Geben Sie Ihre E-Mail-Adresse ein.",
        resetPasswordTitle: "Passwort zurücksetzen",
        resetPasswordSubtitle: "Geben Sie Ihr neues Passwort ein.",
        email: "E-Mail",
        emailPlaceholder: "m@beispiel.de",
        password: "Passwort",
        passwordPlaceholder: "••••••••",
        confirmPassword: "Passwort bestätigen",
        loginButton: "Anmelden",
        signupButton: "Registrieren",
        sendResetLink: "Link senden",
        updatePassword: "Passwort aktualisieren",
        orContinueWith: "Oder weiter mit",
        dontHaveAccount: "Haben Sie kein Konto?",
        alreadyHaveAccount: "Haben Sie bereits ein Konto?",
        forgotPasswordLink: "Passwort vergessen?",
        backToLogin: "Zurück zur Anmeldung",
        invalidCredentials: "Ungültige Anmeldedaten",
        passwordsDontMatch: "Passwörter stimmen nicht überein",
        emailSent: "Überprüfen Sie Ihre E-Mails"
      }
    };
  }
  fs.writeFileSync(`${baseDir}/${loc}.json`, JSON.stringify(content, null, 2));
});
