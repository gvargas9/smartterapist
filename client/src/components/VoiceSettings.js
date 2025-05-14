/**
 * Voice Settings Component
 * 
 * This component provides a UI for users to customize their voice settings
 * for the text-to-speech functionality.
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { voiceService } from '../services/voiceService';
import { useAuth } from '../hooks/useAuth';
import { SpeakerWaveIcon } from '@heroicons/react/24/solid';

const VoiceSettings = ({ onClose, initialSettings, onSave }) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [settings, setSettings] = useState(initialSettings || {
    enabled: true,
    preferredVoice: 'en-US-Neural2-F',
    speed: 1.0,
    pitch: 1.0
  });
  const [isTesting, setIsTesting] = useState(false);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [loading, setLoading] = useState(false);

  // Get available voices based on current language
  useEffect(() => {
    const language = i18n.language || 'en';
    
    // Map of available voices per language
    const voiceOptions = {
      'en': [
        { id: 'en-US-Neural2-F', name: 'Emma (Female)' },
        { id: 'en-US-Neural2-M', name: 'James (Male)' },
        { id: 'en-GB-Neural2-F', name: 'Sophie (Female, British)' },
        { id: 'en-GB-Neural2-M', name: 'Oliver (Male, British)' }
      ],
      'es': [
        { id: 'es-ES-Neural2-F', name: 'Lucia (Femenina)' },
        { id: 'es-ES-Neural2-M', name: 'Miguel (Masculino)' },
        { id: 'es-MX-Neural2-F', name: 'Maria (Femenina, Mexicana)' },
        { id: 'es-MX-Neural2-M', name: 'Carlos (Masculino, Mexicano)' }
      ]
    };
    
    // Set available voices based on current language
    setAvailableVoices(voiceOptions[language.substring(0, 2)] || voiceOptions['en']);
    
    // Update preferred voice based on language if not already set
    if (!settings.preferredVoice.startsWith(language.substring(0, 2))) {
      const defaultVoice = language === 'en' ? 'en-US-Neural2-F' : 'es-ES-Neural2-F';
      setSettings(prev => ({ ...prev, preferredVoice: defaultVoice }));
    }
  }, [i18n.language]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (user?.id) {
        await voiceService.updateUserVoiceSettings(user.id, settings);
      }
      
      if (onSave) {
        onSave(settings);
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving voice settings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Test the current voice settings
  const testVoice = async () => {
    if (isTesting) return;
    
    setIsTesting(true);
    try {
      const testText = i18n.language === 'es' 
        ? "Hola, esta es una prueba de la configuración de voz."
        : "Hello, this is a test of the voice settings.";
      
      const audioBlob = await voiceService.textToSpeech(testText, {
        voice: settings.preferredVoice,
        speed: settings.speed,
        pitch: settings.pitch
      });
      
      await voiceService.playAudio(audioBlob);
    } catch (error) {
      console.error('Error testing voice:', error);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <SpeakerWaveIcon className="h-6 w-6 mr-2 text-blue-500" />
            {t('chat.voiceSettings')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="enabled"
                checked={settings.enabled}
                onChange={handleChange}
                className="form-checkbox h-5 w-5 text-blue-600"
              />
              <span className="ml-2 text-gray-700">
                {settings.enabled ? t('chat.disableVoice') : t('chat.enableVoice')}
              </span>
            </label>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">
              {t('chat.preferredVoice')}
            </label>
            <select
              name="preferredVoice"
              value={settings.preferredVoice}
              onChange={handleChange}
              className="form-select w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              disabled={!settings.enabled}
            >
              {availableVoices.map(voice => (
                <option key={voice.id} value={voice.id}>
                  {voice.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">
              {t('chat.speed')} ({settings.speed})
            </label>
            <input
              type="range"
              name="speed"
              min="0.5"
              max="2"
              step="0.1"
              value={settings.speed}
              onChange={handleChange}
              className="w-full"
              disabled={!settings.enabled}
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 mb-2">
              {t('chat.pitch')} ({settings.pitch})
            </label>
            <input
              type="range"
              name="pitch"
              min="0.5"
              max="2"
              step="0.1"
              value={settings.pitch}
              onChange={handleChange}
              className="w-full"
              disabled={!settings.enabled}
            />
          </div>
          
          <div className="flex justify-between">
            <button
              type="button"
              onClick={testVoice}
              disabled={!settings.enabled || isTesting}
              className="px-4 py-2 bg-secondary-100 text-secondary-600 rounded-md hover:bg-secondary-200 focus:outline-none focus:ring-2 focus:ring-secondary-300 disabled:opacity-50"
            >
              {isTesting ? t('common.loading') : t('chat.testVoice')}
            </button>
            
            <div className="space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50"
              >
                {loading ? t('common.loading') : t('common.save')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VoiceSettings;
