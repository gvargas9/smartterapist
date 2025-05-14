/**
 * Behavior Preset Manager Component
 * 
 * This component allows therapists to manage behavior presets for a client.
 * It displays available behavior presets and allows the therapist to activate/deactivate them.
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { therapistService } from '../services/therapistService';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  PlusCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/solid';

const BehaviorPresetManager = ({ clientId, onUpdate }) => {
  const { t } = useTranslation();
  const [availablePresets, setAvailablePresets] = useState([]);
  const [clientPresets, setClientPresets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showInfo, setShowInfo] = useState({});

  // Fetch behavior presets
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all available behavior presets
        const presets = await therapistService.getBehaviorPresets();
        setAvailablePresets(presets || []);
        
        // Fetch client details with their active behavior presets
        const clientDetails = await therapistService.getClientDetails(clientId);
        
        // Extract client's behavior presets
        const clientBehaviors = clientDetails?.client_behaviors || [];
        setClientPresets(clientBehaviors);
      } catch (error) {
        console.error('Error fetching behavior presets:', error);
        setError(t('behaviors.fetchError'));
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [clientId, t]);

  // Check if a behavior is active for the client
  const isBehaviorActive = (behaviorId) => {
    return clientPresets.some(preset => 
      preset.behavior_id === behaviorId && preset.active
    );
  };

  // Toggle behavior preset for client
  const toggleBehavior = async (behaviorId) => {
    try {
      setLoading(true);
      
      const isActive = isBehaviorActive(behaviorId);
      
      if (isActive) {
        // Deactivate the behavior
        const clientBehavior = clientPresets.find(preset => 
          preset.behavior_id === behaviorId
        );
        
        if (clientBehavior) {
          await therapistService.updateClientBehavior(clientId, behaviorId, false);
        }
      } else {
        // Check if the behavior exists for the client but is inactive
        const existingBehavior = clientPresets.find(preset => 
          preset.behavior_id === behaviorId
        );
        
        if (existingBehavior) {
          // Activate the existing behavior
          await therapistService.updateClientBehavior(clientId, behaviorId, true);
        } else {
          // Add the behavior to the client
          await therapistService.addClientBehavior(clientId, behaviorId, true);
        }
      }
      
      // Refresh client behaviors
      const clientDetails = await therapistService.getClientDetails(clientId);
      const updatedBehaviors = clientDetails?.client_behaviors || [];
      setClientPresets(updatedBehaviors);
      
      // Notify parent component of update
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error toggling behavior:', error);
      setError(isBehaviorActive(behaviorId) ? t('behaviors.deactivateError') : t('behaviors.activateError'));
    } finally {
      setLoading(false);
    }
  };

  // Toggle behavior info display
  const toggleInfo = (behaviorId) => {
    setShowInfo(prev => ({
      ...prev,
      [behaviorId]: !prev[behaviorId]
    }));
  };

  if (loading && availablePresets.length === 0) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg">
        <p className="text-red-600">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 text-red-600 hover:text-red-800 underline"
        >
          {t('common.retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          {t('behaviors.manageBehaviors')}
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          {t('behaviors.description')}
        </p>
      </div>
      
      <div className="p-4">
        {availablePresets.length === 0 ? (
          <p className="text-gray-500">{t('behaviors.noPresetsAvailable')}</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {availablePresets.map(preset => (
              <li key={preset.id} className="py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center">
                      <h4 className="text-base font-medium text-gray-900 truncate">
                        {preset.name}
                      </h4>
                      <button 
                        onClick={() => toggleInfo(preset.id)}
                        className="ml-2 text-gray-400 hover:text-gray-600"
                        title={t('common.info')}
                      >
                        <InformationCircleIcon className="h-5 w-5" />
                      </button>
                    </div>
                    
                    {showInfo[preset.id] && (
                      <div className="mt-2 p-3 bg-gray-50 rounded-md">
                        <p className="text-sm text-gray-600">{preset.description}</p>
                        {preset.prompt_template && (
                          <div className="mt-2">
                            <h5 className="text-xs font-medium text-gray-700">{t('behaviors.promptTemplate')}</h5>
                            <pre className="mt-1 text-xs text-gray-600 bg-gray-100 p-2 rounded overflow-x-auto">
                              {preset.prompt_template}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-4 flex-shrink-0">
                    <button
                      onClick={() => toggleBehavior(preset.id)}
                      disabled={loading}
                      className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium ${
                        isBehaviorActive(preset.id)
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      {isBehaviorActive(preset.id) ? (
                        <>
                          <CheckCircleIcon className="h-4 w-4 mr-1" />
                          {t('behaviors.active')}
                        </>
                      ) : (
                        <>
                          <PlusCircleIcon className="h-4 w-4 mr-1" />
                          {t('behaviors.activate')}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default BehaviorPresetManager;
