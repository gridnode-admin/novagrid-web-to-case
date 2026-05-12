// =========================
// CONFIGURATION
// =========================

// Translation texts used by the form UI
const translations = {

  de: {
    name: "Vollständiger Name *",
    email: "E-Mail-Adresse *",
    phone: "Telefonnummer *",
    serial: "Solar-Log Seriennummer *",
    serialHint: "Nur Zahlen erlaubt.",
    subject: "Betreff *",
    message: "Ihre Nachricht *",
    submit: "SENDEN",
    hint: "Bitte beschreiben Sie Ihr Anliegen so genau wie möglich.",
    gdpr:
      "ACHTUNG: Mit dem Absenden des Formulars bestätigen Sie ausdrücklich, dass Sie eine Kontaktaufnahme über die angegebenen Kontaktdaten wünschen."
  },

  fr: {
    name: "Nom complet *",
    email: "Adresse e-mail *",
    phone: "Numéro de téléphone *",
    serial: "Numéro de série Solar-Log *",
    serialHint: "Uniquement des chiffres autorisés.",
    subject: "Sujet *",
    message: "Votre message *",
    submit: "ENVOYER",
    hint: "Veuillez décrire votre demande aussi précisément que possible.",
    gdpr:
      "ATTENTION : En envoyant ce formulaire, vous confirmez expressément que vous souhaitez être contacté via les coordonnées indiquées."
  },

  it: {
    name: "Nome completo *",
    email: "Indirizzo e-mail *",
    phone: "Numero di telefono *",
    serial: "Numero di serie Solar-Log *",
    serialHint: "Sono consentiti solo numeri.",
    subject: "Oggetto *",
    message: "Il vostro messaggio *",
    submit: "INVIA",
    hint: "Si prega di descrivere la richiesta nel modo più preciso possibile.",
    gdpr:
      "ATTENZIONE: Inviando il modulo confermate espressamente di desiderare un contatto tramite i dati indicati."
  }
};

// Redirect URLs after successful form submission
const redirectUrls = {
  de: "https://www.novagrid.ch/wir-tauschen-wir-haben-ihre-anfrage-erhalten",
  en: "https://www.novagrid.ch/wir-tauschen-wir-haben-ihre-anfrage-erhalten",
  fr: "https://www.novagrid.ch/nous-procedons-a-lechange-nous-avons-bien-recu-votre-demande",
  it: "https://www.novagrid.ch/effettuiamo-la-sostituzione-abbiamo-ricevuto-la-vostra-richiesta"
};

// Salesforce language mapping
const salesforceLanguageMap = {
  de: "D",
  fr: "F",
  it: "I",
  en: "E"
};

// Minimum waiting time before submit
const MIN_FORM_TIME_MS = 3000;

// Enable/disable console logs
const DEBUG = true;

// =========================
// GLOBAL STATE
// =========================

let formStartTime;

let currentLanguage = "de";

// =========================
// HELPER FUNCTIONS
// =========================

/**
 * Detects current language from URL parameters
 */
function getLanguage() {

  const params =
    new URLSearchParams(window.location.search);

  return (
    params.get("forceLang")
    || params.get("lang")
    || "de"
  );
}

/**
 * Debug logging helper
 */
function debugLog(...args) {

  if (DEBUG) {
    console.log(...args);
  }
}

// =========================
// SALESFORCE FUNCTIONS
// =========================

/**
 * Sets Salesforce language field
 */
function setSalesforceLanguage() {

  const sfLang =
    salesforceLanguageMap[currentLanguage]
    || "D";

  const field =
    document.getElementById("language-field");

  if (field) {

    field.value = sfLang;

    debugLog(
      "Detected language:",
      currentLanguage
    );

    debugLog(
      "Mapped Salesforce language:",
      sfLang
    );

  } else {

    debugLog(
      "❌ language-field NOT FOUND"
    );
  }
}

/**
 * Sets redirect URL before submit
 */
function setRedirectUrl() {

  const retUrlField =
    document.getElementById("retURL");

  if (retUrlField) {

    retUrlField.value =
      redirectUrls[currentLanguage]
      || redirectUrls["de"];

    debugLog(
      "Final redirect URL:",
      retUrlField.value
    );
  }
}

// =========================
// UI FUNCTIONS
// =========================

/**
 * Applies translations to UI
 */
function applyTranslations() {

  const t =
    translations[currentLanguage]
    || translations["de"];

  document.getElementById("label-name").innerText =
    t.name;

  document.getElementById("label-email").innerText =
    t.email;

  document.getElementById("label-phone").innerText =
    t.phone;

  document.getElementById("label-serial").innerText =
    t.serial;

  document.getElementById("label-subject").innerText =
    t.subject;

  document.getElementById("label-message").innerText =
    t.message;

  document.getElementById("submit-button").innerText =
    t.submit;

  document.getElementById("form-hint").innerText =
    t.hint;

  // Serial number hint
  const serialHint =
    document.querySelector(".form-hint");

  if (serialHint) {
    serialHint.innerText = t.serialHint;
  }

  // GDPR text
  const gdprNotice =
    document.getElementById("gdpr-notice");

  if (gdprNotice) {
    gdprNotice.innerText = t.gdpr;
  }
}

// =========================
// VALIDATION
// =========================

/**
 * Validates Solar-Log serial number
 * Only numbers are allowed
 */
function validateSerialNumber() {

  const serialField =
    document.getElementById("serial-number");

  if (!serialField) {
    return true;
  }

  const serial =
    serialField.value.trim();

  const numericRegex = /^[0-9]+$/;

  if (!numericRegex.test(serial)) {

    alert(
      "Die Solar-Log Seriennummer darf nur Zahlen enthalten."
    );

    serialField.focus();

    return false;
  }

  return true;
}

// =========================
// FORM SUBMISSION
// =========================

/**
 * Runs before form submission
 */
function beforeSubmit() {

  // Set redirect URL
  setRedirectUrl();

  const honeypot =
    document.getElementById("website");

  const messageField =
    document.getElementById("description");

  // =========================
  // Honeypot anti-spam
  // =========================

  if (
    honeypot
    && honeypot.value.trim() !== ""
  ) {
    return false;
  }

  // =========================
  // Prevent instant bot submits
  // =========================

  if (
    Date.now() - formStartTime
    < MIN_FORM_TIME_MS
  ) {

    alert(
      "Bitte warten Sie einen Moment, bevor Sie das Formular absenden."
    );

    return false;
  }

  // =========================
  // Validate serial number
  // =========================

  if (!validateSerialNumber()) {
    return false;
  }

  // =========================
  // reCAPTCHA validation
  // =========================

  if (typeof grecaptcha !== "undefined") {

    const recaptchaResponse =
      grecaptcha.getResponse();

    if (!recaptchaResponse) {

      alert(
        "Bitte bestätigen Sie, dass Sie kein Roboter sind."
      );

      return false;
    }
  }

  // =========================
  // Build structured message
  // =========================

  if (messageField) {

    const structuredMessage = `
Nachricht:
${messageField.value}

------------------------
Kontaktinformationen:
Name: ${document.getElementById("name")?.value || ""}
Email: ${document.getElementById("email")?.value || ""}
Telefon: ${document.getElementById("phone")?.value || ""}
Solar-Log Seriennummer: ${document.getElementById("serial-number")?.value || ""}
`;

    messageField.value =
      structuredMessage.trim();
  }

  return true;
}

// =========================
// INITIALIZATION
// =========================

window.addEventListener("load", function () {

  // Save load timestamp
  formStartTime = Date.now();

  // Detect language once
  currentLanguage =
    getLanguage();

  debugLog(
    "Cached language:",
    currentLanguage
  );

  // Initialize form
  setSalesforceLanguage();
  applyTranslations();
});