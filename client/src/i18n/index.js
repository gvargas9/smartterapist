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
      // Common elements
      'app.name': 'Zaira Montoya AI Wellness Coach',
      'common.client': 'Client',
      'common.therapist': 'Therapist',
      'common.refresh': 'Refresh',
      'common.viewDetails': 'View Details',
      
      // Navigation
      'nav.dashboard': 'Dashboard',
      'nav.chat': 'Chat',
      
      // Authentication
      'auth.login': 'Login',
      'auth.logout': 'Logout',
      
      // Dashboard
      'dashboard.welcomeBack': 'Welcome back, {{name}}',
      'dashboard.trackProgress': 'Track your progress, manage your therapy sessions, and access resources to support your mental health journey.',
      'dashboard.wellness': 'Wellness',
      'dashboard.totalSessions': 'Total Sessions',
      'dashboard.averageScore': 'Average Well-being Score',
      'dashboard.progressTrend': 'Progress Trend',
      'dashboard.lastSession': 'Last Session',
      'dashboard.quickActions': 'Quick Actions',
      'dashboard.chatSession': 'Chat Session',
      'dashboard.talkWithAI': 'Talk with your AI therapist',
      'dashboard.schedule': 'Schedule',
      'dashboard.bookSession': 'Book a live session',
      'dashboard.resources': 'Resources',
      'dashboard.accessMaterials': 'Access helpful materials',
      'dashboard.wellbeingProgress': 'Your Well-being Progress',
      'dashboard.score': 'Score',
      'dashboard.chartDescription': 'This chart shows your emotional well-being trends based on your conversations with the AI therapist.',
      'dashboard.recentSessions': 'Recent Sessions',
      'dashboard.noSummary': 'No summary available',
      'dashboard.upcomingSession': 'Upcoming Session',
      'dashboard.withTherapist': 'With Dr. {{name}}',
      'dashboard.joinSession': 'Join Session',
      'dashboard.noUpcomingSessions': 'No Upcoming Sessions',
      'dashboard.noSessionsScheduled': 'You don\'t have any upcoming sessions scheduled.',
      'dashboard.scheduleNow': 'Schedule Now',
      'dashboard.helpfulResources': 'Helpful Resources',
      'dashboard.sentimentScore': 'Sentiment Score'
    }
  },
  es: {
    translation: {
      // Common elements
      'app.name': 'Zaira Montoya Entrenadora de Bienestar con IA',
      'common.client': 'Cliente',
      'common.therapist': 'Terapeuta',
      'common.refresh': 'Actualizar',
      'common.viewDetails': 'Ver Detalles',
      
      // Navigation
      'nav.dashboard': 'Panel Principal',
      'nav.chat': 'Chat',
      
      // Authentication
      'auth.login': 'Iniciar Sesión',
      'auth.logout': 'Cerrar Sesión',
      
      // Dashboard
      'dashboard.welcomeBack': 'Bienvenido/a de nuevo, {{name}}',
      'dashboard.trackProgress': 'Sigue tu progreso, gestiona tus sesiones de terapia y accede a recursos para apoyar tu viaje de salud mental.',
      'dashboard.wellness': 'Bienestar',
      'dashboard.totalSessions': 'Sesiones Totales',
      'dashboard.averageScore': 'Puntuación Media de Bienestar',
      'dashboard.progressTrend': 'Tendencia de Progreso',
      'dashboard.lastSession': 'Última Sesión',
      'dashboard.quickActions': 'Acciones Rápidas',
      'dashboard.chatSession': 'Sesión de Chat',
      'dashboard.talkWithAI': 'Habla con tu terapeuta IA',
      'dashboard.schedule': 'Programar',
      'dashboard.bookSession': 'Reservar una sesión en vivo',
      'dashboard.resources': 'Recursos',
      'dashboard.accessMaterials': 'Acceder a materiales útiles',
      'dashboard.wellbeingProgress': 'Tu Progreso de Bienestar',
      'dashboard.score': 'Puntuación',
      'dashboard.chartDescription': 'Este gráfico muestra las tendencias de tu bienestar emocional basadas en tus conversaciones con el terapeuta IA.',
      'dashboard.recentSessions': 'Sesiones Recientes',
      'dashboard.noSummary': 'No hay resumen disponible',
      'dashboard.upcomingSession': 'Próxima Sesión',
      'dashboard.withTherapist': 'Con Dr. {{name}}',
      'dashboard.joinSession': 'Unirse a la Sesión',
      'dashboard.noUpcomingSessions': 'Sin Sesiones Programadas',
      'dashboard.noSessionsScheduled': 'No tienes ninguna sesión programada próximamente.',
      'dashboard.scheduleNow': 'Programar Ahora',
      'dashboard.helpfulResources': 'Recursos Útiles',
      'dashboard.sentimentScore': 'Puntuación de Sentimiento'
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
