/**
 * Voice Service
 * 
 * This service provides methods for text-to-speech and speech-to-text functionality
 * using the ultravox.ai API.
 */

import { supabase } from './supabaseClient';

/**
 * Get the user's voice settings from Supabase
 * @param {string} userId - The user's ID
 * @returns {Promise<Object>} - Voice settings object
 */
export const getUserVoiceSettings = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('voice_settings')
      .eq('id', userId)
      .single();
      
    if (error) throw error;
    
    return data?.voice_settings || {
      enabled: true,
      preferredVoice: 'en-US-Neural2-F',
      speed: 1.0,
      pitch: 1.0
    };
  } catch (error) {
    console.error('Error fetching voice settings:', error);
    return {
      enabled: true,
      preferredVoice: 'en-US-Neural2-F',
      speed: 1.0,
      pitch: 1.0
    };
  }
};

/**
 * Update the user's voice settings in Supabase
 * @param {string} userId - The user's ID
 * @param {Object} settings - Voice settings object
 * @returns {Promise<boolean>} - Success status
 */
export const updateUserVoiceSettings = async (userId, settings) => {
  try {
    const { error } = await supabase
      .from('users')
      .update({ voice_settings: settings })
      .eq('id', userId);
      
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error updating voice settings:', error);
    return false;
  }
};

/**
 * Convert speech to text using ultravox.ai
 * @param {Blob} audioBlob - Audio blob from recording
 * @param {string} language - Language code (e.g., 'en-US')
 * @returns {Promise<string>} - Transcribed text
 */
export const speechToText = async (audioBlob, language = 'en-US') => {
  try {
    // Get ultravox.ai API key from environment variables or user settings
    const apiKey = process.env.REACT_APP_ULTRAVOX_API_KEY;
    
    if (!apiKey) {
      throw new Error('Ultravox API key not found');
    }
    
    // Create form data for the API request
    const formData = new FormData();
    formData.append('audio', audioBlob);
    formData.append('language', language);
    
    // Call the ultravox.ai API
    const response = await fetch('https://api.ultravox.ai/v1/speech-to-text', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Speech-to-text failed');
    }
    
    const data = await response.json();
    return data.text || '';
  } catch (error) {
    console.error('Speech-to-text error:', error);
    throw error;
  }
};

/**
 * Convert text to speech using ultravox.ai
 * @param {string} text - Text to convert to speech
 * @param {Object} options - TTS options
 * @returns {Promise<Blob>} - Audio blob
 */
export const textToSpeech = async (text, options = {}) => {
  try {
    // Get ultravox.ai API key from environment variables or user settings
    const apiKey = process.env.REACT_APP_ULTRAVOX_API_KEY;
    
    if (!apiKey) {
      throw new Error('Ultravox API key not found');
    }
    
    // Default options
    const defaultOptions = {
      voice: 'en-US-Neural2-F',
      speed: 1.0,
      pitch: 1.0
    };
    
    // Merge default options with provided options
    const ttsOptions = { ...defaultOptions, ...options };
    
    // Call the ultravox.ai API
    const response = await fetch('https://api.ultravox.ai/v1/text-to-speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        voice: ttsOptions.voice,
        speed: ttsOptions.speed,
        pitch: ttsOptions.pitch
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Text-to-speech failed');
    }
    
    // Get audio blob from response
    const audioBlob = await response.blob();
    return audioBlob;
  } catch (error) {
    console.error('Text-to-speech error:', error);
    throw error;
  }
};

/**
 * Play audio from a blob
 * @param {Blob} audioBlob - Audio blob to play
 * @returns {Promise<void>}
 */
export const playAudio = async (audioBlob) => {
  try {
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    
    return new Promise((resolve, reject) => {
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        resolve();
      };
      
      audio.onerror = (error) => {
        URL.revokeObjectURL(audioUrl);
        reject(error);
      };
      
      audio.play();
    });
  } catch (error) {
    console.error('Error playing audio:', error);
    throw error;
  }
};

export const voiceService = {
  getUserVoiceSettings,
  updateUserVoiceSettings,
  speechToText,
  textToSpeech,
  playAudio
};

export default voiceService;
