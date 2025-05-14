import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { therapistService } from '../../services/therapistService';
import { chatService } from '../../services/chatService';
import { useTranslation } from 'react-i18next';
import { 
  CalendarIcon, 
  ClockIcon, 
  UserIcon, 
  VideoCameraIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

const SessionManagement = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [client, setClient] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [aiSummaries, setAiSummaries] = useState([]);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [error, setError] = useState('');

  // Fetch session data
  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        setLoading(true);
        
        // Get session details
        const sessionData = await therapistService.getSessionById(sessionId);
        setSession(sessionData);
        
        // Get client details
        if (sessionData?.client_id) {
          const clientData = await therapistService.getClientById(sessionData.client_id);
          setClient(clientData);
          
          // Get client's AI conversations
          const conversationsData = await chatService.getClientConversations(sessionData.client_id);
          setConversations(conversationsData);
          
          // Get AI summaries
          const summariesData = await therapistService.getClientSummaries(sessionData.client_id);
          setAiSummaries(summariesData);
          
          // Get session notes
          if (sessionData.notes) {
            setNotes(sessionData.notes);
          }
        }
      } catch (error) {
        console.error('Error fetching session data:', error);
        setError(t('session.errorFetchingData'));
      } finally {
        setLoading(false);
      }
    };
    
    if (sessionId) {
      fetchSessionData();
    }
  }, [sessionId, t]);

  // Save session notes
  const saveNotes = async () => {
    if (!session) return;
    
    try {
      setSavingNotes(true);
      await therapistService.updateSessionNotes(session.id, notes);
      // Update local session object
      setSession({
        ...session,
        notes
      });
    } catch (error) {
      console.error('Error saving notes:', error);
      setError(t('session.errorSavingNotes'));
    } finally {
      setSavingNotes(false);
    }
  };

  // Join video session
  const joinVideoSession = () => {
    if (!session) return;
    
    // Generate video URL (in a real app, this would be a secure URL from your video provider)
    const url = `https://meet.jit.si/${session.id}`;
    setVideoUrl(url);
    setShowJoinModal(true);
  };

  // Format date for display
  const formatSessionDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Handle back button
  const handleBack = () => {
    navigate('/therapist/clients');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!session || !client) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error || t('session.sessionNotFound')}
        </div>
        <button
          onClick={handleBack}
          className="mt-4 flex items-center text-primary-600 hover:text-primary-800"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          {t('common.back')}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Session Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={handleBack}
            className="mr-4 text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {t('session.sessionWith')} {client.profile_data?.name || t('common.client')}
          </h1>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-3">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            <CalendarIcon className="h-4 w-4 mr-1" />
            {formatSessionDate(session.start_time)}
          </span>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            session.status === 'completed' 
              ? 'bg-green-100 text-green-800' 
              : session.status === 'scheduled' 
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {session.status}
          </span>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Client info and actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            {t('session.clientInformation')}
          </h2>
          
          <div className="mb-6">
            <div className="flex items-center mb-4">
              <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 mr-4">
                <UserIcon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">
                  {client.profile_data?.name || t('common.client')}
                </h3>
                <p className="text-sm text-gray-500">
                  {client.email}
                </p>
              </div>
            </div>
            
            {client.profile_data?.preferences && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  {t('session.clientPreferences')}
                </h4>
                <p className="text-sm text-gray-600">
                  {client.profile_data.preferences}
                </p>
              </div>
            )}
          </div>
          
          <div className="space-y-3">
            <button
              onClick={joinVideoSession}
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <VideoCameraIcon className="h-5 w-5 mr-2" />
              {t('session.joinVideoSession')}
            </button>
            
            <button
              onClick={() => navigate(`/therapist/clients/${client.id}`)}
              className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <UserIcon className="h-5 w-5 mr-2" />
              {t('session.viewClientProfile')}
            </button>
          </div>
        </div>
        
        {/* Middle column - Session notes */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            {t('session.sessionNotes')}
          </h2>
          
          <div className="mb-4">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={10}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
              placeholder={t('session.enterNotesHere')}
            ></textarea>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={saveNotes}
              disabled={savingNotes}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {savingNotes ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {t('common.saving')}
                </>
              ) : (
                t('common.saveNotes')
              )}
            </button>
          </div>
        </div>
        
        {/* Right column - AI summaries */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            {t('session.aiInsights')}
          </h2>
          
          {aiSummaries.length > 0 ? (
            <div className="space-y-4">
              {aiSummaries.slice(0, 3).map((summary) => (
                <div key={summary.id} className="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm text-gray-500">
                      {new Date(summary.created_at).toLocaleDateString()}
                    </p>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {t('dashboard.sentiment')}: {summary.sentiment_metrics?.average?.toFixed(2) || t('common.notAvailable')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800">{summary.summary_text}</p>
                </div>
              ))}
              
              {aiSummaries.length > 3 && (
                <button
                  onClick={() => navigate(`/therapist/clients/${client.id}`)}
                  className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                >
                  {t('common.viewAll')} ({aiSummaries.length})
                </button>
              )}
            </div>
          ) : (
            <p className="text-gray-500">{t('session.noAiSummariesAvailable')}</p>
          )}
          
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              {t('session.recentConversations')}
            </h3>
            
            {conversations.length > 0 ? (
              <div className="space-y-3">
                {conversations.slice(0, 3).map((conversation) => (
                  <div
                    key={conversation.id}
                    className="flex items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <ChatBubbleLeftRightIcon className="h-5 w-5 text-primary-500 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(conversation.start_ts).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {conversation.message_count || 0} {t('session.messages')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">{t('session.noConversationsAvailable')}</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Video session modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {t('session.joinVideoSession')}
              </h3>
              
              <p className="text-gray-600 mb-6">
                {t('session.videoSessionDescription')}
              </p>
              
              <div className="flex flex-col sm:flex-row sm:justify-end space-y-3 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={() => setShowJoinModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  {t('common.cancel')}
                </button>
                <a
                  href={videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  onClick={() => setShowJoinModal(false)}
                >
                  {t('session.openVideoSession')}
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionManagement;
