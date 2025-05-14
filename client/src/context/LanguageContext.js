/**
 * Language Context
 * 
 * This context provides language selection and switching functionality
 * for the multi-lingual support throughout the application.
 */

import React, { createContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../services/supabaseClient';

export const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [availableLanguages, setAvailableLanguages] = useState([
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' }
  ]);

  // Initialize language from user preferences or localStorage
  useEffect(() => {
    const initializeLanguage = async () => {
      try {
        // Try to get language from Supabase if user is logged in
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user?.id) {
          const { data: userData } = await supabase
            .from('users')
            .select('profile_data')
            .eq('id', session.user.id)
            .single();
          
          const preferredLanguage = userData?.profile_data?.language;
          
          if (preferredLanguage && availableLanguages.some(lang => lang.code === preferredLanguage)) {
            setCurrentLanguage(preferredLanguage);
            i18n.changeLanguage(preferredLanguage);
            return;
          }
        }
      } catch (error) {
        console.error('Error fetching user language preference:', error);
      }
      
      // Fall back to localStorage or browser language
      const savedLanguage = localStorage.getItem('language');
      
      if (savedLanguage && availableLanguages.some(lang => lang.code === savedLanguage)) {
        setCurrentLanguage(savedLanguage);
        i18n.changeLanguage(savedLanguage);
      } else {
        // Detect browser language
        const browserLang = navigator.language.split('-')[0];
        const supportedLang = availableLanguages.some(lang => lang.code === browserLang) 
          ? browserLang 
          : 'en';
        
        setCurrentLanguage(supportedLang);
        i18n.changeLanguage(supportedLang);
        localStorage.setItem('language', supportedLang);
      }
    };
    
    initializeLanguage();
  }, [i18n]);

  // Change language function
  const changeLanguage = async (languageCode) => {
    if (!availableLanguages.some(lang => lang.code === languageCode)) {
      console.error(`Language ${languageCode} is not supported`);
      return;
    }
    
    try {
      console.log(`LanguageContext: Changing language to ${languageCode}`);
      
      // Update state first
      setCurrentLanguage(languageCode);
      
      // Save to localStorage
      localStorage.setItem('language', languageCode);
      
      // Update i18n - this triggers the translation reload
      await i18n.changeLanguage(languageCode);
      console.log(`Language changed to ${languageCode}, i18n.language is now: ${i18n.language}`);
      
      // Force reload resources to ensure translations are applied
      if (i18n.services.resourceStore) {
        console.log('Reloading translation resources...');
        // This will trigger a reload of translations from Supabase
        await i18n.reloadResources(languageCode, 'translation');
      }
      
      // If user is logged in, save preference to Supabase
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user?.id) {
        const { data: userData } = await supabase
          .from('users')
          .select('profile_data')
          .eq('id', session.user.id)
          .single();
        
        const updatedProfileData = {
          ...userData?.profile_data,
          language: languageCode
        };
        
        await supabase
          .from('users')
          .update({ profile_data: updatedProfileData })
          .eq('id', session.user.id);
      }
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  // Add new language
  const addLanguage = (languageCode, languageName) => {
    if (availableLanguages.some(lang => lang.code === languageCode)) {
      console.error(`Language ${languageCode} already exists`);
      return;
    }
    
    setAvailableLanguages(prev => [
      ...prev,
      { code: languageCode, name: languageName }
    ]);
  };

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        availableLanguages,
        changeLanguage,
        addLanguage
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageContext;
