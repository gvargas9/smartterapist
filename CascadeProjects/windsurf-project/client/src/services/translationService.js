/**
 * Translation Service
 * 
 * This service provides methods to fetch translations from Supabase
 * to support multi-lingual functionality throughout the application.
 */

import { supabase } from './supabaseClient';

/**
 * Fetch translations for a specific language
 * @param {string} languageCode - Language code (e.g., 'en', 'es')
 * @param {string} namespace - Translation namespace (default: 'translation')
 * @returns {Promise<Object>} - Object containing key-value pairs of translations
 */
export const fetchTranslations = async (languageCode, namespace = 'translation') => {
  try {
    const { data, error } = await supabase
      .from('translations')
      .select('key, value')
      .eq('language_code', languageCode)
      .eq('namespace', namespace);
    
    if (error) {
      console.error('Error fetching translations:', error);
      return {};
    }
    
    // Convert array of key-value pairs to a nested object structure
    const translations = {};
    data.forEach(({ key, value }) => {
      // Handle nested keys (e.g., 'app.name' becomes { app: { name: value } })
      const keys = key.split('.');
      let current = translations;
      
      keys.forEach((k, i) => {
        if (i === keys.length - 1) {
          // Last key, set the value
          current[k] = value;
        } else {
          // Create nested object if it doesn't exist
          current[k] = current[k] || {};
          current = current[k];
        }
      });
    });
    
    return translations;
  } catch (error) {
    console.error('Error in fetchTranslations:', error);
    return {};
  }
};

/**
 * Add a new translation to Supabase
 * @param {string} languageCode - Language code (e.g., 'en', 'es')
 * @param {string} key - Translation key (e.g., 'app.name')
 * @param {string} value - Translation value
 * @param {string} namespace - Translation namespace (default: 'translation')
 * @returns {Promise<boolean>} - Success status
 */
export const addTranslation = async (languageCode, key, value, namespace = 'translation') => {
  try {
    const { error } = await supabase
      .from('translations')
      .insert([
        { language_code: languageCode, namespace, key, value }
      ]);
    
    if (error) {
      console.error('Error adding translation:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in addTranslation:', error);
    return false;
  }
};

/**
 * Update an existing translation in Supabase
 * @param {string} languageCode - Language code (e.g., 'en', 'es')
 * @param {string} key - Translation key (e.g., 'app.name')
 * @param {string} value - Translation value
 * @param {string} namespace - Translation namespace (default: 'translation')
 * @returns {Promise<boolean>} - Success status
 */
export const updateTranslation = async (languageCode, key, value, namespace = 'translation') => {
  try {
    const { error } = await supabase
      .from('translations')
      .update({ value })
      .eq('language_code', languageCode)
      .eq('namespace', namespace)
      .eq('key', key);
    
    if (error) {
      console.error('Error updating translation:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in updateTranslation:', error);
    return false;
  }
};

export default {
  fetchTranslations,
  addTranslation,
  updateTranslation
};
