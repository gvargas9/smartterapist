import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { adminService } from '../../services/adminService';
import { useTranslation } from 'react-i18next';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  CurrencyDollarIcon,
  ArrowPathIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const SubscriptionManagement = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPlan, setCurrentPlan] = useState({
    id: null,
    name: '',
    description: '',
    price: 0,
    billing_interval: 'month',
    features: [],
    is_active: true,
    trial_days: 0
  });
  
  // Feature input
  const [featureInput, setFeatureInput] = useState('');
  
  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [planToDelete, setPlanToDelete] = useState(null);
  
  // Fetch subscription plans
  const fetchPlans = async () => {
    try {
      setLoading(true);
      const data = await adminService.getSubscriptionPlans();
      setPlans(data);
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      setError(t('subscriptions.errorFetching'));
    } finally {
      setLoading(false);
    }
  };
  
  // Refresh plans
  const refreshPlans = async () => {
    setRefreshing(true);
    await fetchPlans();
    setRefreshing(false);
  };
  
  // Load plans on mount
  useEffect(() => {
    if (user?.id) {
      fetchPlans();
    }
  }, [user]);
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle numeric inputs
    if (name === 'price' || name === 'trial_days') {
      setCurrentPlan({
        ...currentPlan,
        [name]: type === 'number' ? parseFloat(value) : value
      });
    } else {
      setCurrentPlan({
        ...currentPlan,
        [name]: type === 'checkbox' ? checked : value
      });
    }
  };
  
  // Handle feature input
  const handleFeatureInputChange = (e) => {
    setFeatureInput(e.target.value);
  };
  
  // Add feature
  const addFeature = () => {
    if (!featureInput.trim()) return;
    
    // Don't add duplicate features
    if (currentPlan.features.includes(featureInput.trim())) {
      setFeatureInput('');
      return;
    }
    
    setCurrentPlan({
      ...currentPlan,
      features: [...currentPlan.features, featureInput.trim()]
    });
    setFeatureInput('');
  };
  
  // Remove feature
  const removeFeature = (featureToRemove) => {
    setCurrentPlan({
      ...currentPlan,
      features: currentPlan.features.filter(feature => feature !== featureToRemove)
    });
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!currentPlan.name.trim() || currentPlan.price < 0) {
      setError(t('subscriptions.requiredFields'));
      return;
    }
    
    try {
      setLoading(true);
      
      if (isEditing) {
        // Update existing plan
        await adminService.updateSubscriptionPlan(currentPlan.id, {
          ...currentPlan,
          updated_by: user.id
        });
        setSuccess(t('subscriptions.updateSuccess'));
      } else {
        // Create new plan
        await adminService.createSubscriptionPlan({
          ...currentPlan,
          created_by: user.id
        });
        setSuccess(t('subscriptions.createSuccess'));
      }
      
      // Reset form and refresh plans
      resetForm();
      await fetchPlans();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (error) {
      console.error('Error saving subscription plan:', error);
      setError(isEditing ? t('subscriptions.updateError') : t('subscriptions.createError'));
    } finally {
      setLoading(false);
    }
  };
  
  // Edit plan
  const editPlan = (plan) => {
    setCurrentPlan({
      ...plan,
      features: plan.features || []
    });
    setIsEditing(true);
    setShowForm(true);
    window.scrollTo(0, 0);
  };
  
  // Delete plan
  const confirmDelete = (plan) => {
    setPlanToDelete(plan);
    setShowDeleteConfirm(true);
  };
  
  const deletePlan = async () => {
    if (!planToDelete) return;
    
    try {
      setLoading(true);
      await adminService.deleteSubscriptionPlan(planToDelete.id);
      setSuccess(t('subscriptions.deleteSuccess'));
      
      // Reset state and refresh plans
      setShowDeleteConfirm(false);
      setPlanToDelete(null);
      await fetchPlans();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (error) {
      console.error('Error deleting subscription plan:', error);
      setError(t('subscriptions.deleteError'));
    } finally {
      setLoading(false);
    }
  };
  
  // Reset form
  const resetForm = () => {
    setCurrentPlan({
      id: null,
      name: '',
      description: '',
      price: 0,
      billing_interval: 'month',
      features: [],
      is_active: true,
      trial_days: 0
    });
    setFeatureInput('');
    setIsEditing(false);
    setShowForm(false);
    setError('');
  };
  
  // Toggle plan active status
  const togglePlanStatus = async (plan) => {
    try {
      setLoading(true);
      
      const updatedPlan = {
        ...plan,
        is_active: !plan.is_active,
        updated_by: user.id
      };
      
      await adminService.updateSubscriptionPlan(plan.id, updatedPlan);
      
      // Update local state
      setPlans(plans.map(p => 
        p.id === plan.id ? updatedPlan : p
      ));
      
      setSuccess(t('subscriptions.statusUpdateSuccess'));
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (error) {
      console.error('Error updating plan status:', error);
      setError(t('subscriptions.statusUpdateError'));
    } finally {
      setLoading(false);
    }
  };
  
  // Format price for display
  const formatPrice = (price, interval) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price) + (interval === 'month' ? '/mo' : '/yr');
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('subscriptions.title')}</h1>
        <div className="flex space-x-3">
          <button
            onClick={refreshPlans}
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
            {t('subscriptions.createNew')}
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
              {isEditing ? t('subscriptions.editPlan') : t('subscriptions.createPlan')}
            </h2>
          </div>
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  {t('subscriptions.name')} *
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={currentPlan.name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  required
                />
              </div>
              
              {/* Price */}
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                  {t('subscriptions.price')} *
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    name="price"
                    id="price"
                    min="0"
                    step="0.01"
                    value={currentPlan.price}
                    onChange={handleInputChange}
                    className="block w-full pl-7 pr-12 border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    required
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">USD</span>
                  </div>
                </div>
              </div>
              
              {/* Description */}
              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  {t('subscriptions.description')}
                </label>
                <textarea
                  name="description"
                  id="description"
                  rows={3}
                  value={currentPlan.description}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
              
              {/* Billing Interval */}
              <div>
                <label htmlFor="billing_interval" className="block text-sm font-medium text-gray-700">
                  {t('subscriptions.billingInterval')}
                </label>
                <select
                  id="billing_interval"
                  name="billing_interval"
                  value={currentPlan.billing_interval}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="month">{t('subscriptions.monthly')}</option>
                  <option value="year">{t('subscriptions.yearly')}</option>
                </select>
              </div>
              
              {/* Trial Days */}
              <div>
                <label htmlFor="trial_days" className="block text-sm font-medium text-gray-700">
                  {t('subscriptions.trialDays')}
                </label>
                <input
                  type="number"
                  name="trial_days"
                  id="trial_days"
                  min="0"
                  value={currentPlan.trial_days}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
              
              {/* Features */}
              <div className="md:col-span-2">
                <label htmlFor="features" className="block text-sm font-medium text-gray-700">
                  {t('subscriptions.features')}
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <input
                    type="text"
                    id="features"
                    value={featureInput}
                    onChange={handleFeatureInputChange}
                    className="flex-1 min-w-0 block w-full border-gray-300 rounded-l-md focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder={t('subscriptions.featurePlaceholder')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addFeature();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={addFeature}
                    className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 sm:text-sm"
                  >
                    {t('common.add')}
                  </button>
                </div>
                {currentPlan.features.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {currentPlan.features.map((feature, index) => (
                      <div key={index} className="flex items-center">
                        <CheckIcon className="h-5 w-5 text-green-500 mr-2" />
                        <span className="text-gray-700">{feature}</span>
                        <button
                          type="button"
                          onClick={() => removeFeature(feature)}
                          className="ml-2 text-gray-400 hover:text-red-500"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
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
                  checked={currentPlan.is_active}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                  {t('subscriptions.active')}
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
      
      {/* Plans List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading && !refreshing && plans.length === 0 ? (
          <div className="md:col-span-3 p-6 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        ) : plans.length === 0 ? (
          <div className="md:col-span-3 p-6 text-center">
            <p className="text-gray-500">{t('subscriptions.noPlans')}</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              {t('subscriptions.createFirst')}
            </button>
          </div>
        ) : (
          plans.map((plan) => (
            <div key={plan.id} className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">{plan.name}</h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  plan.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {plan.is_active ? t('common.active') : t('common.inactive')}
                </span>
              </div>
              <div className="px-6 py-5">
                <div className="flex items-baseline">
                  <span className="text-2xl font-bold text-gray-900">{formatPrice(plan.price, plan.billing_interval)}</span>
                  <span className="ml-1 text-sm text-gray-500">
                    {plan.billing_interval === 'month' ? t('subscriptions.perMonth') : t('subscriptions.perYear')}
                  </span>
                </div>
                
                {plan.trial_days > 0 && (
                  <p className="mt-2 text-sm text-gray-500">
                    {t('subscriptions.trialPeriod', { days: plan.trial_days })}
                  </p>
                )}
                
                <p className="mt-3 text-sm text-gray-500">{plan.description}</p>
                
                {plan.features && plan.features.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-900">{t('subscriptions.includedFeatures')}</h4>
                    <ul className="mt-2 space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <CheckIcon className="h-5 w-5 text-green-500 flex-shrink-0 mr-2" />
                          <span className="text-sm text-gray-500">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="mt-6 flex space-x-3">
                  <button
                    onClick={() => togglePlanStatus(plan)}
                    className={`flex-1 inline-flex justify-center items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium ${
                      plan.is_active 
                        ? 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50' 
                        : 'border-green-500 text-green-700 bg-green-50 hover:bg-green-100'
                    }`}
                  >
                    {plan.is_active ? t('common.deactivate') : t('common.activate')}
                  </button>
                  <button
                    onClick={() => editPlan(plan)}
                    className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <PencilIcon className="h-4 w-4 mr-2" />
                    {t('common.edit')}
                  </button>
                  <button
                    onClick={() => confirmDelete(plan)}
                    className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {t('subscriptions.confirmDelete')}
              </h3>
              
              <p className="text-gray-600 mb-6">
                {t('subscriptions.deleteWarning', { name: planToDelete?.name })}
              </p>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={deletePlan}
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

export default SubscriptionManagement;
