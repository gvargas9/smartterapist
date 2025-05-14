import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { therapistService } from '../../services/therapistService';
import { useTranslation } from 'react-i18next';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  LinkIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

const ResourceManagement = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  
  const [resources, setResources] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentResource, setCurrentResource] = useState({
    id: null,
    title: '',
    description: '',
    url: '',
    type: 'article',
    is_public: true,
    assigned_clients: []
  });
  
  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState(null);
  
  // Client assignment modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [resourceToAssign, setResourceToAssign] = useState(null);
  const [selectedClients, setSelectedClients] = useState([]);
  
  // Fetch resources
  const fetchResources = async () => {
    try {
      setLoading(true);
      const data = await therapistService.getTherapistResources(user.id);
      setResources(data);
    } catch (error) {
      console.error('Error fetching resources:', error);
      setError(t('resources.errorFetching'));
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch clients
  const fetchClients = async () => {
    try {
      const data = await therapistService.getAssignedClients(user.id);
      setClients(data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };
  
  // Refresh data
  const refreshData = async () => {
    setRefreshing(true);
    await Promise.all([fetchResources(), fetchClients()]);
    setRefreshing(false);
  };
  
  // Load data on mount
  useEffect(() => {
    if (user?.id) {
      fetchResources();
      fetchClients();
    }
  }, [user]);
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCurrentResource({
      ...currentResource,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!currentResource.title.trim() || !currentResource.url.trim()) {
      setError(t('resources.requiredFields'));
      return;
    }
    
    try {
      setLoading(true);
      
      if (isEditing) {
        // Update existing resource
        await therapistService.updateResource(currentResource.id, {
          ...currentResource,
          updated_by: user.id
        });
        setSuccess(t('resources.updateSuccess'));
      } else {
        // Create new resource
        await therapistService.createResource({
          ...currentResource,
          created_by: user.id
        });
        setSuccess(t('resources.createSuccess'));
      }
      
      // Reset form and refresh resources
      resetForm();
      await fetchResources();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (error) {
      console.error('Error saving resource:', error);
      setError(isEditing ? t('resources.updateError') : t('resources.createError'));
    } finally {
      setLoading(false);
    }
  };
  
  // Edit resource
  const editResource = (resource) => {
    setCurrentResource({
      ...resource,
      assigned_clients: resource.assigned_clients || []
    });
    setIsEditing(true);
    setShowForm(true);
    window.scrollTo(0, 0);
  };
  
  // Delete resource
  const confirmDelete = (resource) => {
    setResourceToDelete(resource);
    setShowDeleteConfirm(true);
  };
  
  const deleteResource = async () => {
    if (!resourceToDelete) return;
    
    try {
      setLoading(true);
      await therapistService.deleteResource(resourceToDelete.id);
      setSuccess(t('resources.deleteSuccess'));
      
      // Reset state and refresh resources
      setShowDeleteConfirm(false);
      setResourceToDelete(null);
      await fetchResources();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (error) {
      console.error('Error deleting resource:', error);
      setError(t('resources.deleteError'));
    } finally {
      setLoading(false);
    }
  };
  
  // Reset form
  const resetForm = () => {
    setCurrentResource({
      id: null,
      title: '',
      description: '',
      url: '',
      type: 'article',
      is_public: true,
      assigned_clients: []
    });
    setIsEditing(false);
    setShowForm(false);
    setError('');
  };
  
  // Assign resource to clients
  const openAssignModal = (resource) => {
    setResourceToAssign(resource);
    setSelectedClients(resource.assigned_clients?.map(ac => ac.client_id) || []);
    setShowAssignModal(true);
  };
  
  const handleClientSelection = (clientId) => {
    setSelectedClients(prev => {
      if (prev.includes(clientId)) {
        return prev.filter(id => id !== clientId);
      } else {
        return [...prev, clientId];
      }
    });
  };
  
  const assignResourceToClients = async () => {
    if (!resourceToAssign) return;
    
    try {
      setLoading(true);
      
      // Update resource assignments
      await therapistService.assignResourceToClients(resourceToAssign.id, selectedClients, user.id);
      
      setSuccess(t('resources.assignSuccess'));
      
      // Reset state and refresh resources
      setShowAssignModal(false);
      setResourceToAssign(null);
      setSelectedClients([]);
      await fetchResources();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (error) {
      console.error('Error assigning resource:', error);
      setError(t('resources.assignError'));
    } finally {
      setLoading(false);
    }
  };
  
  // Resource type options
  const resourceTypes = [
    { value: 'article', label: t('resources.types.article') },
    { value: 'video', label: t('resources.types.video') },
    { value: 'exercise', label: t('resources.types.exercise') },
    { value: 'worksheet', label: t('resources.types.worksheet') },
    { value: 'audio', label: t('resources.types.audio') }
  ];
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('resources.title')}</h1>
        <div className="flex space-x-3">
          <button
            onClick={refreshData}
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
            {t('resources.createNew')}
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
              {isEditing ? t('resources.editResource') : t('resources.createResource')}
            </h2>
          </div>
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 gap-6">
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  {t('resources.title')} *
                </label>
                <input
                  type="text"
                  name="title"
                  id="title"
                  value={currentResource.title}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  required
                />
              </div>
              
              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  {t('resources.description')}
                </label>
                <textarea
                  name="description"
                  id="description"
                  rows={3}
                  value={currentResource.description}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
              
              {/* URL */}
              <div>
                <label htmlFor="url" className="block text-sm font-medium text-gray-700">
                  {t('resources.url')} *
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <span className="inline-flex items-center px-3 py-2 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                    <LinkIcon className="h-4 w-4" />
                  </span>
                  <input
                    type="url"
                    name="url"
                    id="url"
                    value={currentResource.url}
                    onChange={handleInputChange}
                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border-gray-300 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="https://example.com/resource"
                    required
                  />
                </div>
              </div>
              
              {/* Type */}
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                  {t('resources.type')}
                </label>
                <select
                  id="type"
                  name="type"
                  value={currentResource.type}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  {resourceTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Public/Private */}
              <div className="flex items-center">
                <input
                  id="is_public"
                  name="is_public"
                  type="checkbox"
                  checked={currentResource.is_public}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="is_public" className="ml-2 block text-sm text-gray-900">
                  {t('resources.makePublic')}
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
      
      {/* Resources List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            {t('resources.yourResources')}
          </h2>
        </div>
        
        {loading && !refreshing && resources.length === 0 ? (
          <div className="p-6 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        ) : resources.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">{t('resources.noResources')}</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              {t('resources.createFirst')}
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {resources.map((resource) => (
              <li key={resource.id} className="px-6 py-5">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center">
                      <div className="p-2 bg-primary-100 rounded-md mr-3">
                        <DocumentTextIcon className="h-5 w-5 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 truncate">{resource.title}</h3>
                        <div className="flex items-center mt-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            resource.is_public ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {resource.is_public ? t('resources.public') : t('resources.private')}
                          </span>
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                            {resourceTypes.find(t => t.value === resource.type)?.label || resource.type}
                          </span>
                          <span className="ml-2 text-xs text-gray-500">
                            {resource.assigned_clients?.length || 0} {t('resources.clientsAssigned')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-gray-500 line-clamp-2">{resource.description}</p>
                  </div>
                  <div className="ml-4 flex-shrink-0 flex items-center space-x-2">
                    <button
                      onClick={() => openAssignModal(resource)}
                      className="p-1 text-gray-400 hover:text-primary-600 rounded-full"
                      title={t('resources.assignToClients')}
                    >
                      <UserGroupIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => editResource(resource)}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded-full"
                      title={t('common.edit')}
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => confirmDelete(resource)}
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
                {t('resources.confirmDelete')}
              </h3>
              
              <p className="text-gray-600 mb-6">
                {t('resources.deleteWarning', { name: resourceToDelete?.title })}
              </p>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={deleteResource}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  {t('common.delete')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Assign to Clients Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-5 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {t('resources.assignResource', { name: resourceToAssign?.title })}
              </h3>
            </div>
            <div className="p-6">
              {clients.length === 0 ? (
                <p className="text-gray-500 text-center py-4">{t('resources.noClientsAvailable')}</p>
              ) : (
                <div className="max-h-60 overflow-y-auto">
                  <div className="space-y-2">
                    {clients.map((client) => (
                      <div key={client.id} className="flex items-center">
                        <input
                          id={`client-${client.id}`}
                          type="checkbox"
                          checked={selectedClients.includes(client.id)}
                          onChange={() => handleClientSelection(client.id)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`client-${client.id}`} className="ml-3 block text-sm text-gray-700">
                          {client.profile_data?.name || client.email || t('common.client')}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setResourceToAssign(null);
                    setSelectedClients([]);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={assignResourceToClients}
                  disabled={loading || clients.length === 0}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {t('common.processing')}
                    </div>
                  ) : (
                    t('resources.assign')
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

export default ResourceManagement;
