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
      console.log(`Loading translations for language: ${language}, namespace: ${namespace}`);
      
      // Fetch translations from Supabase
      const translations = await fetchTranslations(language, namespace);
      
      console.log(`Loaded translations for ${language}:`, translations);
      
      // Return the translations to i18next
      callback(null, translations);
    } catch (error) {
      console.error(`Error loading ${language} translations:`, error);
      callback(error, null);
    }
  },
};

// Add fallback translations for critical UI elements
const fallbackResources = {
  en: {
    translation: {
      'app.name': 'Zaira Montoya AI Wellness Coach',
      'nav.dashboard': 'Dashboard',
      'nav.chat': 'Chat',
      'auth.login': 'Login',
      'auth.logout': 'Logout'
    }
  },
  es: {
    translation: {
      'app.name': 'Zaira Montoya Entrenadora de Bienestar con IA',
      'nav.dashboard': 'Panel Principal',
      'nav.chat': 'Chat',
      'auth.login': 'Iniciar Sesión',
      'auth.logout': 'Cerrar Sesión'
    }
  }
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
    
    // Add fallback resources for critical UI elements
    resources: fallbackResources,
    
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    
    // Detection options
    detection: {
      order: ['querystring', 'localStorage', 'navigator'],
      lookupQuerystring: 'lang',
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
