import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { therapistService } from '../services/therapistService';
import { useTranslation } from 'react-i18next';
import { 
  PlusIcon, 
  XMarkIcon,
  ArrowPathIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

const ClientBehaviorConfig = ({ clientId, onUpdate }) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [availablePresets, setAvailablePresets] = useState([]);
  const [assignedPresets, setAssignedPresets] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState('');
  
  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Get all available behavior presets
      const presets = await therapistService.getBehaviorPresets(user.id);
      setAvailablePresets(presets.filter(preset => preset.is_active));
      
      // Get client's assigned behavior presets
      const clientBehaviors = await therapistService.getClientBehaviors(clientId);
      setAssignedPresets(clientBehaviors);
    } catch (error) {
      console.error('Error fetching behavior data:', error);
      setError(t('clientBehavior.errorFetching'));
    } finally {
      setLoading(false);
    }
  };
  
  // Refresh data
  const refreshData = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };
  
  // Load data on mount
  useEffect(() => {
    if (user?.id && clientId) {
      fetchData();
    }
  }, [user, clientId]);
  
  // Assign behavior preset to client
  const assignPreset = async () => {
    if (!selectedPresetId) return;
    
    try {
      setLoading(true);
      
      // Check if already assigned
      if (assignedPresets.some(preset => preset.behavior_id === selectedPresetId)) {
        setError(t('clientBehavior.alreadyAssigned'));
        return;
      }
      
      // Assign preset to client
      await therapistService.assignBehaviorToClient({
        client_id: clientId,
        behavior_id: selectedPresetId,
        assigned_by: user.id,
        is_active: true
      });
      
      // Show success message
      setSuccess(t('clientBehavior.assignSuccess'));
      
      // Refresh data
      await fetchData();
      
      // Close modal
      setShowAddModal(false);
      setSelectedPresetId('');
      
      // Notify parent component
      if (onUpdate) {
        onUpdate();
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (error) {
      console.error('Error assigning behavior preset:', error);
      setError(t('clientBehavior.assignError'));
    } finally {
      setLoading(false);
    }
  };
  
  // Remove behavior preset from client
  const removePreset = async (clientBehaviorId) => {
    try {
      setLoading(true);
      
      // Remove preset from client
      await therapistService.removeBehaviorFromClient(clientBehaviorId);
      
      // Show success message
      setSuccess(t('clientBehavior.removeSuccess'));
      
      // Refresh data
      await fetchData();
      
      // Notify parent component
      if (onUpdate) {
        onUpdate();
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (error) {
      console.error('Error removing behavior preset:', error);
      setError(t('clientBehavior.removeError'));
    } finally {
      setLoading(false);
    }
  };
  
  // Toggle behavior preset active status
  const togglePresetStatus = async (clientBehavior) => {
    try {
      setLoading(true);
      
      // Update status
      await therapistService.updateClientBehaviorStatus(
        clientBehavior.id,
        !clientBehavior.is_active
      );
      
      // Show success message
      setSuccess(t('clientBehavior.updateSuccess'));
      
      // Refresh data
      await fetchData();
      
      // Notify parent component
      if (onUpdate) {
        onUpdate();
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (error) {
      console.error('Error updating behavior status:', error);
      setError(t('clientBehavior.updateError'));
    } finally {
      setLoading(false);
    }
  };
  
  // Get preset details by ID
  const getPresetById = (presetId) => {
    return availablePresets.find(preset => preset.id === presetId) || {};
  };
  
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">
          {t('clientBehavior.title')}
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full"
            title={t('common.refresh')}
          >
            <ArrowPathIcon className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="p-2 text-primary-600 hover:text-primary-800 rounded-full"
            title={t('clientBehavior.addPreset')}
          >
            <PlusIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      {/* Success message */}
      {success && (
        <div className="m-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4">
          <p>{success}</p>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="m-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
          <p>{error}</p>
        </div>
      )}
      
      {/* Info message */}
      <div className="m-4 bg-blue-50 border-l-4 border-blue-400 text-blue-700 p-4 flex items-start">
        <InformationCircleIcon className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
        <p className="text-sm">{t('clientBehavior.infoMessage')}</p>
      </div>
      
      {/* Assigned Presets List */}
      <div className="p-6">
        {loading && !refreshing && assignedPresets.length === 0 ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        ) : assignedPresets.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-500 mb-4">{t('clientBehavior.noPresets')}</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              {t('clientBehavior.assignFirst')}
            </button>
          </div>
        ) : (
          <ul className="space-y-4">
            {assignedPresets.map((clientBehavior) => {
              const preset = getPresetById(clientBehavior.behavior_id);
              return (
                <li key={clientBehavior.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center">
                        <h3 className="text-sm font-medium text-gray-900">{preset.name}</h3>
                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          clientBehavior.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {clientBehavior.is_active ? t('common.active') : t('common.inactive')}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">{preset.description}</p>
                      
                      {preset.tags && preset.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {preset.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => togglePresetStatus(clientBehavior)}
                        className={`p-1 rounded-full ${
                          clientBehavior.is_active
                            ? 'text-green-600 hover:text-green-800'
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                        title={clientBehavior.is_active ? t('common.deactivate') : t('common.activate')}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <button
                        onClick={() => removePreset(clientBehavior.id)}
                        className="p-1 text-gray-400 hover:text-red-600 rounded-full"
                        title={t('common.remove')}
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      
      {/* Add Preset Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-5 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {t('clientBehavior.assignPreset')}
              </h3>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <label htmlFor="preset-select" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('clientBehavior.selectPreset')}
                </label>
                <select
                  id="preset-select"
                  value={selectedPresetId}
                  onChange={(e) => setSelectedPresetId(e.target.value)}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="">{t('common.selectOption')}</option>
                  {availablePresets.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {selectedPresetId && (
                <div className="mb-6 bg-gray-50 p-4 rounded-md">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    {getPresetById(selectedPresetId).name}
                  </h4>
                  <p className="text-sm text-gray-500 mb-2">
                    {getPresetById(selectedPresetId).description}
                  </p>
                  {getPresetById(selectedPresetId).tags && (
                    <div className="flex flex-wrap gap-1">
                      {getPresetById(selectedPresetId).tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setSelectedPresetId('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={assignPreset}
                  disabled={!selectedPresetId || loading}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {t('common.processing')}
                    </div>
                  ) : (
                    t('clientBehavior.assign')
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientBehaviorConfig;
