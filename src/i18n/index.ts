import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enCommon from "@/locales/en/common.json";
import viCommon from "@/locales/vi/common.json";

// Default language is "en" to match the app's current UI text exactly —
// switching the default to "vi" would be a visible, user-facing language
// change and isn't something this refactor should do silently.
void i18n.use(initReactI18next).init({
  defaultNS: "common",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  lng: "en",
  resources: {
    en: { common: enCommon },
    vi: { common: viCommon },
  },
});

export default i18n;
