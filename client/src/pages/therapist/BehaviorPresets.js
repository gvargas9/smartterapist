import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { therapistService } from '../../services/therapistService';
import { useTranslation } from 'react-i18next';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  CheckIcon, 
  XMarkIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const BehaviorPresets = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPreset, setCurrentPreset] = useState({
    id: null,
    name: '',
    description: '',
    prompt_template: '',
    tags: [],
    is_active: true
  });
  
  // Tag input
  const [tagInput, setTagInput] = useState('');
  
  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [presetToDelete, setPresetToDelete] = useState(null);
  
  // Fetch presets
  const fetchPresets = async () => {
    try {
      setLoading(true);
      const data = await therapistService.getBehaviorPresets(user.id);
      setPresets(data);
    } catch (error) {
      console.error('Error fetching behavior presets:', error);
      setError(t('behaviorPresets.errorFetching'));
    } finally {
      setLoading(false);
    }
  };
  
  // Refresh presets
  const refreshPresets = async () => {
    setRefreshing(true);
    await fetchPresets();
    setRefreshing(false);
  };
  
  // Load presets on mount
  useEffect(() => {
    if (user?.id) {
      fetchPresets();
    }
  }, [user]);
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentPreset({ ...currentPreset, [name]: value });
  };
  
  // Handle tag input
  const handleTagInputChange = (e) => {
    setTagInput(e.target.value);
  };
  
  // Add tag
  const addTag = () => {
    if (!tagInput.trim()) return;
    
    // Don't add duplicate tags
    if (currentPreset.tags.includes(tagInput.trim())) {
      setTagInput('');
      return;
    }
    
    setCurrentPreset({
      ...currentPreset,
      tags: [...currentPreset.tags, tagInput.trim()]
    });
    setTagInput('');
  };
  
  // Remove tag
  const removeTag = (tagToRemove) => {
    setCurrentPreset({
      ...currentPreset,
      tags: currentPreset.tags.filter(tag => tag !== tagToRemove)
    });
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!currentPreset.name.trim() || !currentPreset.prompt_template.trim()) {
      setError(t('behaviorPresets.requiredFields'));
      return;
    }
    
    try {
      setLoading(true);
      
      if (isEditing) {
        // Update existing preset
        await therapistService.updateBehaviorPreset(currentPreset.id, {
          ...currentPreset,
          updated_by: user.id
        });
        setSuccess(t('behaviorPresets.updateSuccess'));
      } else {
        // Create new preset
        await therapistService.createBehaviorPreset({
          ...currentPreset,
          created_by: user.id
        });
        setSuccess(t('behaviorPresets.createSuccess'));
      }
      
      // Reset form and refresh presets
      resetForm();
      await fetchPresets();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (error) {
      console.error('Error saving behavior preset:', error);
      setError(isEditing ? t('behaviorPresets.updateError') : t('behaviorPresets.createError'));
    } finally {
      setLoading(false);
    }
  };
  
  // Edit preset
  const editPreset = (preset) => {
    setCurrentPreset({
      ...preset,
      tags: preset.tags || []
    });
    setIsEditing(true);
    setShowForm(true);
    window.scrollTo(0, 0);
  };
  
  // Delete preset
  const confirmDelete = (preset) => {
    setPresetToDelete(preset);
    setShowDeleteConfirm(true);
  };
  
  const deletePreset = async () => {
    if (!presetToDelete) return;
    
    try {
      setLoading(true);
      await therapistService.deleteBehaviorPreset(presetToDelete.id);
      setSuccess(t('behaviorPresets.deleteSuccess'));
      
      // Reset state and refresh presets
      setShowDeleteConfirm(false);
      setPresetToDelete(null);
      await fetchPresets();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (error) {
      console.error('Error deleting behavior preset:', error);
      setError(t('behaviorPresets.deleteError'));
    } finally {
      setLoading(false);
    }
  };
  
  // Reset form
  const resetForm = () => {
    setCurrentPreset({
      id: null,
      name: '',
      description: '',
      prompt_template: '',
      tags: [],
      is_active: true
    });
    setTagInput('');
    setIsEditing(false);
    setShowForm(false);
    setError('');
  };
  
  // Toggle preset active status
  const togglePresetStatus = async (preset) => {
    try {
      setLoading(true);
      
      const updatedPreset = {
        ...preset,
        is_active: !preset.is_active,
        updated_by: user.id
      };
      
      await therapistService.updateBehaviorPreset(preset.id, updatedPreset);
      
      // Update local state
      setPresets(presets.map(p => 
        p.id === preset.id ? updatedPreset : p
      ));
      
      setSuccess(t('behaviorPresets.statusUpdateSuccess'));
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (error) {
      console.error('Error updating preset status:', error);
      setError(t('behaviorPresets.statusUpdateError'));
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('behaviorPresets.title')}</h1>
        <div className="flex space-x-3">
          <button
            onClick={refreshPresets}
            disabled={refreshing}
            className="flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {t('common.refresh')}
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            {t('behaviorPresets.createNew')}
          </button>
        </div>
      </div>
      
      {/* Success message */}
      {success && (
        <div className="mb-6 bg-green-100 border-l-4 border-green-500 text-green-700 p-4">
          <p>{success}</p>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="mb-6 bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
          <p>{error}</p>
        </div>
      )}
      
      {/* Create/Edit Form */}
      {showForm && (
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              {isEditing ? t('behaviorPresets.editPreset') : t('behaviorPresets.createPreset')}
            </h2>
          </div>
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 gap-6">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  {t('behaviorPresets.name')} *
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={currentPreset.name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  required
                />
              </div>
              
              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  {t('behaviorPresets.description')}
                </label>
                <textarea
                  name="description"
                  id="description"
                  rows={3}
                  value={currentPreset.description}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
              
              {/* Prompt Template */}
              <div>
                <label htmlFor="prompt_template" className="block text-sm font-medium text-gray-700">
                  {t('behaviorPresets.promptTemplate')} *
                </label>
                <textarea
                  name="prompt_template"
                  id="prompt_template"
                  rows={6}
                  value={currentPreset.prompt_template}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm font-mono"
                  required
                />
                <p className="mt-2 text-sm text-gray-500">
                  {t('behaviorPresets.promptHelp')}
                </p>
              </div>
              
              {/* Tags */}
              <div>
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
                  {t('behaviorPresets.tags')}
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <input
                    type="text"
                    id="tags"
                    value={tagInput}
                    onChange={handleTagInputChange}
                    className="flex-1 min-w-0 block w-full border-gray-300 rounded-l-md focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder={t('behaviorPresets.tagPlaceholder')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 sm:text-sm"
                  >
                    {t('common.add')}
                  </button>
                </div>
                {currentPreset.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {currentPreset.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full text-primary-400 hover:text-primary-500 focus:outline-none"
                        >
                          <XMarkIcon className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Active Status */}
              <div className="flex items-center">
                <input
                  id="is_active"
                  name="is_active"
                  type="checkbox"
                  checked={currentPreset.is_active}
                  onChange={(e) => setCurrentPreset({ ...currentPreset, is_active: e.target.checked })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                  {t('behaviorPresets.active')}
                </label>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {t('common.saving')}
                  </div>
                ) : (
                  isEditing ? t('common.update') : t('common.create')
                )}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Presets List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            {t('behaviorPresets.yourPresets')}
          </h2>
        </div>
        
        {loading && !refreshing && presets.length === 0 ? (
          <div className="p-6 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        ) : presets.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">{t('behaviorPresets.noPresets')}</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              {t('behaviorPresets.createFirst')}
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {presets.map((preset) => (
              <li key={preset.id} className="px-6 py-5">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center">
                      <h3 className="text-sm font-medium text-gray-900 truncate">{preset.name}</h3>
                      <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        preset.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {preset.is_active ? t('common.active') : t('common.inactive')}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">{preset.description}</p>
                    
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
                  <div className="ml-4 flex-shrink-0 flex items-center space-x-2">
                    <button
                      onClick={() => togglePresetStatus(preset)}
                      className={`p-1 rounded-full ${
                        preset.is_active 
                          ? 'text-green-600 hover:text-green-800' 
                          : 'text-gray-400 hover:text-gray-600'
                      }`}
                      title={preset.is_active ? t('common.deactivate') : t('common.activate')}
                    >
                      <CheckIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => editPreset(preset)}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded-full"
                      title={t('common.edit')}
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => confirmDelete(preset)}
                      className="p-1 text-gray-400 hover:text-red-600 rounded-full"
                      title={t('common.delete')}
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {t('behaviorPresets.confirmDelete')}
              </h3>
              
              <p className="text-gray-600 mb-6">
                {t('behaviorPresets.deleteWarning', { name: presetToDelete?.name })}
              </p>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={deletePreset}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  {t('common.delete')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BehaviorPresets;
