/**
 * useLanguage Hook
 * 
 * Custom hook for accessing the language context and i18n functionality
 * throughout the application.
 */

import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageContext from '../context/LanguageContext';

export const useLanguage = () => {
  const { t } = useTranslation();
  const languageContext = useContext(LanguageContext);
  
  if (!languageContext) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  
  const { 
    currentLanguage, 
    availableLanguages, 
    changeLanguage, 
    addLanguage 
  } = languageContext;
  
  return {
    t,                  // Translation function
    currentLanguage,    // Current language code (e.g., 'en', 'es')
    availableLanguages, // Array of available languages
    changeLanguage,     // Function to change the current language
    addLanguage         // Function to add a new language
  };
};

export default useLanguage;
