import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import translationEN from './locales/en.json';
import translationFR from './locales/fr.json';

const resources = {
  en: {
    translation: translationEN
  },
  fr: {
    translation: translationFR
  }
};

i18n
  // Détecte la langue de l'utilisateur
  .use(LanguageDetector)
  // Passe l'instance i18n à react-i18next
  .use(initReactI18next)
  // Initialise i18next
  .init({
    resources,
    fallbackLng: 'en', // Langue par défaut si la détection échoue
    debug: true, // Active les logs pour le débogage (à désactiver en production)
    interpolation: {
      escapeValue: false, // React échappe déjà les valeurs
    }
  });

export default i18n;
