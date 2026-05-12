// =========================
// CONFIGURATION
// =========================

// Translation texts used by the form UI
const translations = {
  de: {
    firstName: "Vorname",
    lastName: "Nachname *",
    email: "E-Mail *",
    company: "Firma",
    phone: "Telefon",
    mobile: "Mobil",
    street: "Strasse",
    zip: "PLZ",
    city: "Stadt",
    country: "Land",
    message: "Nachricht",
    submit: "SENDEN",
    hint: "Bitte beschreiben Sie Ihr Anliegen so genau wie möglich."
  },

  fr: {
    firstName: "Prénom",
    lastName: "Nom *",
    email: "E-mail *",
    company: "Entreprise",
    phone: "Téléphone",
    mobile: "Mobile",
    street: "Rue",
    zip: "Code postal",
    city: "Ville",
    country: "Pays",
    message: "Message",
    submit: "ENVOYER",
    hint: "Veuillez décrire votre demande aussi précisément que possible."
  },

  it: {
    firstName: "Nome",
    lastName: "Cognome *",
    email: "Email *",
    company: "Azienda",
    phone: "Telefono",
    mobile: "Cellulare",
    street: "Via",
    zip: "CAP",
    city: "Città",
    country: "Paese",
    message: "Messaggio",
    submit: "INVIA",
    hint: "Si prega di descrivere la richiesta nel modo più preciso possibile."
  }
};

// Redirect URLs after successful form submission
const redirectUrls = {
  de: "https://www.novagrid.ch/markttor-wir-haben-ihre-anfrage-erhalten",
  en: "https://www.novagrid.ch/markttor-wir-haben-ihre-anfrage-erhalten",
  fr: "https://www.novagrid.ch/portail-du-marche-nous-avons-bien-recu-votre-demande",
  it: "https://www.novagrid.ch/portale-del-mercato-abbiamo-ricevuto-la-vostra-richiesta"
};

// Salesforce language mapping
const salesforceLanguageMap = {
  de: "D",
  fr: "F",
  it: "I",
  en: "E"
};

// Minimum waiting time before form submission
const MIN_FORM_TIME_MS = 3000;

// Enable/disable console logs
const DEBUG = true;

// =========================
// GLOBAL STATE
// =========================

// Timestamp when the form was loaded
let formStartTime;

// Current language of the form
// Determined once during initialization
let currentLanguage = "de";

// =========================
// HELPER FUNCTIONS
// =========================

/**
 * Detects the current language from URL parameters
 * Example:
 * ?lang=fr
 * ?forceLang=it
 */
function getLanguage() {
  const params = new URLSearchParams(window.location.search);

  return (
    params.get("forceLang")
    || params.get("lang")
    || "de"
  );
}

/**
 * Writes debug logs only if DEBUG is enabled
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
 * Sets the Salesforce language field
 */
function setSalesforceLanguage() {
  const sfLang =
    salesforceLanguageMap[currentLanguage] || "D";

  const field =
    document.getElementById("language-field");

  if (field) {
    field.value = sfLang;

    debugLog("Detected language:", currentLanguage);
    debugLog("Mapped Salesforce language:", sfLang);
  } else {
    debugLog("❌ language-field NOT FOUND");
  }
}

/**
 * Sets the redirect URL before form submission
 * This is done during submit because iframes
 * can behave inconsistently otherwise
 */
function setRedirectUrl() {
  const retUrlField =
    document.getElementById("retURL");

  if (retUrlField) {
    retUrlField.value =
      redirectUrls[currentLanguage]
      || redirectUrls["de"];

    debugLog("Final redirect URL:", retUrlField.value);
  }
}

// =========================
// UI FUNCTIONS
// =========================

/**
 * Applies translations to the form UI
 */
function applyTranslations() {
  const t =
    translations[currentLanguage]
    || translations["de"];

  document.getElementById("label-firstName").innerText = t.firstName;
  document.getElementById("label-lastName").innerText = t.lastName;
  document.getElementById("label-email").innerText = t.email;
  document.getElementById("label-company").innerText = t.company;
  document.getElementById("label-phone").innerText = t.phone;
  document.getElementById("label-mobile").innerText = t.mobile;
  document.getElementById("label-street").innerText = t.street;
  document.getElementById("label-zip").innerText = t.zip;
  document.getElementById("label-city").innerText = t.city;
  document.getElementById("label-country").innerText = t.country;
  document.getElementById("label-message").innerText = t.message;
  document.getElementById("submit-button").innerText = t.submit;
  document.getElementById("form-hint").innerText = t.hint;
}

// =========================
// FORM SUBMISSION
// =========================

/**
 * Runs before the form is submitted
 */
function beforeSubmit() {

  // Ensure redirect URL is set correctly
  setRedirectUrl();

  const company =
    document.getElementById("company");

  const lastName =
    document.getElementById("last_name");

  const honeypot =
    document.getElementById("website");

  const messageField =
    document.getElementById("description");

  // =========================
  // Anti-spam honeypot check
  // =========================

  if (honeypot && honeypot.value.trim() !== "") {
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
  // Fallback company logic
  // =========================

  // If company is empty,
  // use last name instead
  if (
    company
    && lastName
    && company.value.trim() === ""
  ) {
    company.value =
      lastName.value.trim();
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
Name: ${lastName?.value || ""}
Firma: ${company?.value || ""}
Email: ${document.getElementById("email")?.value || ""}
Telefon: ${document.getElementById("phone")?.value || ""}
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

  // Save form load timestamp
  formStartTime = Date.now();

  // Detect language once
  currentLanguage = getLanguage();

  debugLog("Cached language:", currentLanguage);

  // Initialize form
  setSalesforceLanguage();
  applyTranslations();
});