/**
 * Internationalization (i18n) configuration
 * 
 * This file sets up the i18next library for multi-lingual support across the application.
 * Translations are fetched from Supabase instead of static JSON files.
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';
import { fetchTranslations } from '../services/translationService';

// Custom backend that loads translations from Supabase
const SupabaseBackend = {
  type: 'backend',
  init: () => {},
  read: async (language, namespace, callback) => {
    try {
      // Fetch translations from Supabase
      const translations = await fetchTranslations(language, namespace);
      
      // Return the translations to i18next
      callback(null, translations);
    } catch (error) {
      console.error(`Error loading ${language} translations:`, error);
      callback(error, null);
    }
  },
};

// Initialize i18next
i18n
  // Use our custom Supabase backend
  .use(SupabaseBackend)
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    
    // Detection options
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    
    // React options
    react: {
      useSuspense: true,
    },
    
    // Load translations immediately
    partialBundledLanguages: true,
  });

export default i18n;
