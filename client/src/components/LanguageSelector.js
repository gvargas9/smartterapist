/**
 * Language Selector Component
 * 
 * This component provides a UI for users to select their preferred language
 * for the application interface.
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import useLanguage from '../hooks/useLanguage';
import { GlobeAltIcon } from '@heroicons/react/24/outline';

const LanguageSelector = ({ className = '' }) => {
  const { t } = useTranslation();
  const { currentLanguage, availableLanguages, changeLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleLanguageChange = async (languageCode) => {
    try {
      // Log the language change attempt
      console.log(`Changing language to: ${languageCode}`);
      
      // First, set the language in localStorage directly to ensure it persists
      localStorage.setItem('i18nextLng', languageCode);
      localStorage.setItem('language', languageCode);
      
      // Change language using the context function
      await changeLanguage(languageCode);
      
      // Force reload the page to ensure all translations are applied
      window.location.href = window.location.pathname + '?lang=' + languageCode;
      window.location.reload();
    } catch (error) {
      console.error('Error changing language:', error);
    } finally {
      setIsOpen(false);
    }
  };

  // Get the current language name for display
  const currentLanguageName = availableLanguages.find(
    lang => lang.code === currentLanguage
  )?.name || 'English';

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={toggleDropdown}
        className="flex items-center text-secondary-500 hover:text-secondary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 rounded-md"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <GlobeAltIcon className="h-5 w-5 mr-1" aria-hidden="true" />
        <span className="text-sm font-medium">{currentLanguageName}</span>
      </button>

      {isOpen && (
        <div 
          className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="language-menu"
        >
          <div className="py-1" role="none">
            {availableLanguages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                className={`block px-4 py-2 text-sm w-full text-left ${
                  currentLanguage === language.code
                    ? 'bg-primary-100 text-primary-900 font-medium'
                    : 'text-secondary-700 hover:bg-secondary-100'
                }`}
                role="menuitem"
              >
                {language.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
