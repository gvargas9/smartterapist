import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../services/supabaseClient';
import { therapistService } from '../../services/therapistService';
import BehaviorPresetManager from '../../components/BehaviorPresetManager';
import { Line } from 'react-chartjs-2';

const ClientDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [client, setClient] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [behaviors, setBehaviors] = useState([]);
  const [selectedBehavior, setSelectedBehavior] = useState(null);
  const [sentimentData, setSentimentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    const fetchClientData = async () => {
      try {
        // Fetch client details
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select(`
            *,
            users:user_id (email, profile_data),
            client_behaviors (
              behaviors (id, name, prompt_template)
            )
          `)
          .eq('id', id)
          .single();

        if (clientError) throw clientError;

        // Fetch conversations and summaries
        const { data: conversationsData, error: conversationsError } = await supabase
          .from('conversations')
          .select(`
            *,
            summaries (
              id,
              summary_text,
              sentiment_score,
              key_topics,
              created_at
            ),
            messages (
              id,
              sender,
              text,
              timestamp,
              sentiment_score
            )
          `)
          .eq('client_id', id)
          .order('start_ts', { ascending: false });

        if (conversationsError) throw conversationsError;

        // Fetch available behaviors
        const { data: behaviorsData, error: behaviorsError } = await supabase
          .from('behaviors')
          .select('*')
          .order('name', { ascending: true });

        if (behaviorsError) throw behaviorsError;

        setClient(clientData);
        setConversations(conversationsData || []);
        setBehaviors(behaviorsData || []);

        // Process sentiment data for chart
        if (conversationsData) {
          const sentimentScores = conversationsData
            .flatMap(conv => conv.messages)
            .filter(msg => msg.sentiment_score !== null)
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

          const chartData = {
            labels: sentimentScores.map(msg => new Date(msg.timestamp).toLocaleDateString()),
            datasets: [{
              label: 'Sentiment Score',
              data: sentimentScores.map(msg => msg.sentiment_score),
              borderColor: 'rgb(75, 192, 192)',
              tension: 0.1
            }]
          };

          setSentimentData(chartData);
        }
      } catch (error) {
        console.error('Error fetching client data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClientData();
  }, [id]);

  // Handle client data refresh after behavior updates
  const handleBehaviorUpdate = async () => {
    try {
      // Refresh client data
      const clientData = await therapistService.getClientDetails(id);
      setClient(clientData);
    } catch (error) {
      console.error('Error refreshing client data:', error);
    }
  };
  
  // Handle adding a behavior to the client
  const handleAddBehavior = async () => {
    if (!selectedBehavior) return;

    try {
      // Add the behavior to the client using the therapist service
      await therapistService.addClientBehavior(id, selectedBehavior, true);
      
      // Refresh client data
      await handleBehaviorUpdate();
      
      // Reset the selected behavior
      setSelectedBehavior(null);
    } catch (error) {
      console.error('Error adding behavior:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-secondary-900">Client not found</h2>
        <Link
          to="/therapist/clients"
          className="mt-4 inline-block text-primary-600 hover:text-primary-700"
        >
          Return to client list
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Client Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-semibold text-secondary-900">
              {client.users.profile_data.name}
            </h1>
            <p className="mt-1 text-secondary-600">{client.users.email}</p>
          </div>
          <button
            onClick={() => {/* Schedule session logic */}}
            className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600"
          >
            Schedule Session
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 text-sm font-medium ${activeTab === 'profile' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          {t('client.profile')}
        </button>
        <button
          onClick={() => setActiveTab('behaviors')}
          className={`px-4 py-2 text-sm font-medium ${activeTab === 'behaviors' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          {t('client.behaviors')}
        </button>
        <button
          onClick={() => setActiveTab('sessions')}
          className={`px-4 py-2 text-sm font-medium ${activeTab === 'sessions' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          {t('client.sessions')}
        </button>
        <button
          onClick={() => setActiveTab('sentiment')}
          className={`px-4 py-2 text-sm font-medium ${activeTab === 'sentiment' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          {t('client.sentiment')}
        </button>
      </div>

      {/* Client Profile Tab */}
      {activeTab === 'profile' && (
        <div className="md:col-span-3">
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">{t('client.profile')}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">{t('common.name')}</h3>
                  <p className="text-base text-gray-900">{client.users?.profile_data?.name || t('common.unknown')}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">{t('common.email')}</h3>
                  <p className="text-base text-gray-900">{client.users?.email || t('common.unknown')}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">{t('client.clientSince')}</h3>
                  <p className="text-base text-gray-900">
                    {new Date(client.created_at).toLocaleDateString()}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">{t('client.lastSession')}</h3>
                  <p className="text-base text-gray-900">
                    {client.last_session 
                      ? new Date(client.last_session).toLocaleDateString() 
                      : t('client.noSessions')}
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                {client.users?.profile_data && (
                  <>
                    {Object.entries(client.users.profile_data)
                      .filter(([key]) => !['name', 'avatar_url'].includes(key))
                      .map(([key, value]) => (
                        <div key={key}>
                          <h3 className="text-sm font-medium text-gray-500">
                            {key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' ')}
                          </h3>
                          <p className="text-base text-gray-900">
                            {typeof value === 'object' ? JSON.stringify(value) : value.toString()}
                          </p>
                        </div>
                      ))
                    }
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Behaviors Tab */}
      {activeTab === 'behaviors' && (
        <div className="md:col-span-3">
          <BehaviorPresetManager 
            clientId={id} 
            onUpdate={handleBehaviorUpdate} 
          />
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-secondary-900">Total Sessions</h3>
          <p className="mt-2 text-3xl font-bold text-primary-600">
            {conversations.length}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-secondary-900">Active Behaviors</h3>
          <p className="mt-2 text-3xl font-bold text-primary-600">
            {client.client_behaviors.length}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-secondary-900">Average Sentiment</h3>
          <p className="mt-2 text-3xl font-bold text-primary-600">
            {conversations.length > 0
              ? (conversations.reduce((acc, conv) => {
                  const scores = conv.messages
                    .filter(msg => msg.sentiment_score !== null)
                    .map(msg => msg.sentiment_score);
                  return acc + (scores.reduce((a, b) => a + b, 0) / scores.length);
                }, 0) / conversations.length).toFixed(2)
              : 'N/A'}
          </p>
        </div>
      </div>

      {/* Sentiment Chart */}
      {sentimentData && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-secondary-900 mb-4">Sentiment Trends</h2>
          <div className="h-64">
            <Line
              data={sentimentData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 1
                  }
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Behavior Management */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-secondary-900">Active Behaviors</h2>
          <div className="flex items-center space-x-4">
            <select
              value={selectedBehavior || ''}
              onChange={(e) => setSelectedBehavior(e.target.value)}
              className="rounded-lg border border-secondary-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select behavior...</option>
              {behaviors.map((behavior) => (
                <option key={behavior.id} value={behavior.id}>
                  {behavior.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleAddBehavior}
              disabled={!selectedBehavior}
              className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 disabled:opacity-50"
            >
              Add Behavior
            </button>
          </div>
        </div>
        
        <div className="space-y-4">
          {client.client_behaviors.map(({ behaviors }) => (
            <div
              key={behaviors.id}
              className="p-4 bg-secondary-50 rounded-lg"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-secondary-900">{behaviors.name}</h3>
                  <p className="mt-1 text-sm text-secondary-600">
                    {behaviors.prompt_template}
                  </p>
                </div>
                <button
                  onClick={() => {/* Remove behavior logic */}}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Conversation History */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-secondary-900 mb-4">Conversation History</h2>
        <div className="space-y-4">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className="border-b border-secondary-200 last:border-0 pb-4 last:pb-0"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-medium text-secondary-900">
                    {new Date(conversation.start_ts).toLocaleString()}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Messages: {conversation.messages.length}
                    </span>
                    {conversation.summaries?.[0] && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                        Sentiment: {conversation.summaries[0].sentiment_score.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {/* View conversation logic */}}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  View Details
                </button>
              </div>
              {conversation.summaries?.[0] && (
                <div className="mt-2">
                  <p className="text-sm text-secondary-600">
                    {conversation.summaries[0].summary_text}
                  </p>
                  {conversation.summaries[0].key_topics && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {conversation.summaries[0].key_topics.map((topic, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary-100 text-secondary-800"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClientDetail;
