import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { userService } from '../../services/userService';
import { useTranslation } from 'react-i18next';
import { CalendarIcon, ClockIcon, UserIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

const ScheduleSession = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [therapists, setTherapists] = useState([]);
  const [selectedTherapist, setSelectedTherapist] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Get available therapists
  useEffect(() => {
    const fetchTherapists = async () => {
      try {
        setLoading(true);
        const availableTherapists = await userService.getAvailableTherapists();
        setTherapists(availableTherapists);
      } catch (error) {
        console.error('Error fetching therapists:', error);
        setErrorMessage(t('schedule.errorFetchingTherapists'));
      } finally {
        setLoading(false);
      }
    };

    fetchTherapists();
  }, [t]);

  // Get available time slots when therapist or date changes
  useEffect(() => {
    const fetchAvailableSlots = async () => {
      if (!selectedTherapist || !selectedDate) return;

      try {
        setLoading(true);
        const slots = await userService.getTherapistAvailability(selectedTherapist.id, selectedDate);
        setAvailableSlots(slots);
      } catch (error) {
        console.error('Error fetching availability:', error);
        setErrorMessage(t('schedule.errorFetchingAvailability'));
      } finally {
        setLoading(false);
      }
    };

    fetchAvailableSlots();
  }, [selectedTherapist, selectedDate, t]);

  const handleTherapistSelect = (therapist) => {
    setSelectedTherapist(therapist);
    setSelectedTime(''); // Reset time when therapist changes
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    setSelectedTime(''); // Reset time when date changes
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedTherapist || !selectedDate || !selectedTime) {
      setErrorMessage(t('schedule.pleaseCompleteAllFields'));
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage('');
      
      // Format the datetime for the API
      const sessionDateTime = `${selectedDate}T${selectedTime}:00`;
      
      // Schedule the session
      await userService.scheduleSession({
        client_id: user.id,
        therapist_id: selectedTherapist.id,
        start_time: sessionDateTime,
        duration_minutes: 50, // Default session length
        session_type: 'video',
        status: 'scheduled'
      });
      
      // Show success message
      setSuccessMessage(t('schedule.sessionScheduledSuccess'));
      
      // Reset form
      setSelectedTherapist(null);
      setSelectedDate('');
      setSelectedTime('');
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    } catch (error) {
      console.error('Error scheduling session:', error);
      setErrorMessage(t('schedule.errorSchedulingSession'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get min date (today) for date picker
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('schedule.scheduleSession')}</h1>
      
      {/* Success message */}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      )}
      
      {/* Error message */}
      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {errorMessage}
        </div>
      )}
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6">
          <form onSubmit={handleSubmit}>
            {/* Step 1: Select Therapist */}
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                <span className="bg-primary-100 text-primary-800 text-sm font-semibold mr-2 px-2.5 py-0.5 rounded">1</span>
                {t('schedule.selectTherapist')}
              </h2>
              
              {loading && !therapists.length ? (
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {therapists.map((therapist) => (
                    <div
                      key={therapist.id}
                      onClick={() => handleTherapistSelect(therapist)}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedTherapist?.id === therapist.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 mr-4">
                          <UserIcon className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {therapist.profile_data?.name || t('common.therapist')}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {therapist.profile_data?.specialization || t('schedule.generalTherapist')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Step 2: Select Date */}
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                <span className="bg-primary-100 text-primary-800 text-sm font-semibold mr-2 px-2.5 py-0.5 rounded">2</span>
                {t('schedule.selectDate')}
              </h2>
              
              <div className="flex items-center">
                <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                <input
                  type="date"
                  min={today}
                  value={selectedDate}
                  onChange={handleDateChange}
                  disabled={!selectedTherapist}
                  className="border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:bg-gray-100"
                />
              </div>
            </div>
            
            {/* Step 3: Select Time */}
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                <span className="bg-primary-100 text-primary-800 text-sm font-semibold mr-2 px-2.5 py-0.5 rounded">3</span>
                {t('schedule.selectTime')}
              </h2>
              
              {selectedDate && selectedTherapist ? (
                loading ? (
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                  </div>
                ) : availableSlots.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {availableSlots.map((slot) => (
                      <div
                        key={slot}
                        onClick={() => handleTimeSelect(slot)}
                        className={`flex items-center justify-center p-3 border rounded-md cursor-pointer ${
                          selectedTime === slot
                            ? 'bg-primary-500 text-white border-primary-500'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <ClockIcon className="h-4 w-4 mr-2" />
                        {slot}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">{t('schedule.noAvailableSlots')}</p>
                )
              ) : (
                <p className="text-gray-500">{t('schedule.selectTherapistAndDate')}</p>
              )}
            </div>
            
            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!selectedTherapist || !selectedDate || !selectedTime || isSubmitting}
                className="bg-primary-500 text-white px-6 py-2 rounded-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {t('common.processing')}
                  </div>
                ) : (
                  t('schedule.confirmBooking')
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ScheduleSession;
