import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { therapistService } from '../../services/therapistService';
import { DATA } from '../../utils/supabaseData';
import { useTranslation } from 'react-i18next';
import useLanguage from '../../hooks/useLanguage';
import { 
  UserGroupIcon, 
  CalendarIcon, 
  DocumentTextIcon, 
  ClockIcon,
  ArrowPathIcon,
  ArrowRightIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import { Line } from 'react-chartjs-2';

const Dashboard = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState([]);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [recentSummaries, setRecentSummaries] = useState([]);
  const [sentimentTrend, setSentimentTrend] = useState(null);
  const [stats, setStats] = useState({
    totalClients: 0,
    upcomingSessionsCount: 0,
    recentSummariesCount: 0,
    averageSentiment: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const refreshDashboard = async () => {
    setRefreshing(true);
    try {
      await fetchDashboardData();
    } finally {
      setRefreshing(false);
    }
  };

  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get user ID
      const userId = user?.id;
      
      // Fetch data from Supabase
      const [clientsData, sessionsData, summariesData] = await Promise.all([
        // Fetch assigned clients
        userId ? therapistService.getAssignedClients(userId) : DATA.getClients(),
        
        // Fetch upcoming sessions
        userId ? therapistService.getUpcomingSessions(userId) : DATA.getUpcomingSessions(),
        
        // Fetch recent summaries
        userId ? therapistService.getRecentSummaries(userId) : DATA.getRecentSummaries()
      ]);
      
      // Update state with fetched data
      setClients(clientsData || []);
      setUpcomingSessions(sessionsData || []);
      setRecentSummaries(summariesData || []);
      
      // Calculate stats
      const avgSentiment = calculateAverageSentiment(summariesData);
      
      setStats({
        totalClients: clientsData.length,
        upcomingSessionsCount: sessionsData.length,
        recentSummariesCount: summariesData.length,
        averageSentiment: avgSentiment
      });
      
      // Generate sentiment trend data for chart
      generateSentimentTrendData(summariesData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const calculateAverageSentiment = (summaries) => {
    if (!summaries || summaries.length === 0) return 0;
    
    const validSentiments = summaries
      .filter(summary => summary.sentiment_metrics && summary.sentiment_metrics.average)
      .map(summary => summary.sentiment_metrics.average);
      
    if (validSentiments.length === 0) return 0;
    
    return (validSentiments.reduce((sum, score) => sum + score, 0) / validSentiments.length).toFixed(2);
  };
  
  const generateSentimentTrendData = (summaries) => {
    if (!summaries || summaries.length === 0) {
      setSentimentTrend(null);
      return;
    }
    
    // Group summaries by date
    const dateGroups = {};
    summaries.forEach(summary => {
      if (!summary.sentiment_metrics || !summary.sentiment_metrics.average) return;
      
      const date = new Date(summary.created_at).toLocaleDateString();
      if (!dateGroups[date]) {
        dateGroups[date] = [];
      }
      dateGroups[date].push(summary.sentiment_metrics.average);
    });
    
    // Calculate average for each date
    const dates = Object.keys(dateGroups).sort((a, b) => new Date(a) - new Date(b));
    const data = dates.map(date => {
      const scores = dateGroups[date];
      return scores.reduce((sum, score) => sum + score, 0) / scores.length;
    });
    
    if (dates.length === 0 || data.length === 0) {
      setSentimentTrend(null);
      return;
    }
    
    const chartData = {
      labels: dates,
      datasets: [{
        label: t('dashboard.clientSentimentTrend'),
        data: data,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4
      }]
    };
    
    setSentimentTrend(chartData);
  };

  useEffect(() => {
    // In development mode, we can proceed even without a user
    fetchDashboardData();
  }, []);

  if (loading && !refreshing) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg p-6 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              {t('dashboard.welcome')}, Dr. {user?.profile_data?.name || user?.name || t('nav.therapist')}
            </h1>
            <p className="mt-2 text-blue-100 max-w-2xl">
              {t('dashboard.description')}
            </p>
          </div>
          <button
            onClick={refreshDashboard}
            disabled={refreshing}
            className="flex items-center bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors text-white px-4 py-2 rounded-lg disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-5 w-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {t('common.refresh')}
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow p-6 flex items-center">
          <div className="p-3 bg-blue-100 rounded-full mr-4">
            <UserGroupIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{t('dashboard.activeClients')}</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalClients}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow p-6 flex items-center">
          <div className="p-3 bg-indigo-100 rounded-full mr-4">
            <CalendarIcon className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{t('dashboard.upcomingSessions')}</p>
            <p className="text-2xl font-bold text-gray-900">{stats.upcomingSessionsCount}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow p-6 flex items-center">
          <div className="p-3 bg-purple-100 rounded-full mr-4">
            <DocumentTextIcon className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{t('dashboard.recentSummaries')}</p>
            <p className="text-2xl font-bold text-gray-900">{stats.recentSummariesCount}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow p-6 flex items-center">
          <div className="p-3 bg-green-100 rounded-full mr-4">
            <ChatBubbleLeftRightIcon className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{t('dashboard.avgSentiment')}</p>
            <p className="text-2xl font-bold text-gray-900">{stats.averageSentiment}</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Sentiment Trend and Upcoming Sessions */}
        <div className="lg:col-span-2 space-y-8">
          {/* Sentiment Trend Chart */}
          {sentimentTrend ? (
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">{t('dashboard.sentimentTrends')}</h2>
              </div>
              <div className="h-64">
                <Line
                  data={sentimentTrend}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top',
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            return `${t('dashboard.score')}: ${context.parsed.y.toFixed(2)}`;
                          }
                        }
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 1,
                        title: {
                          display: true,
                          text: t('dashboard.averageSentimentScore')
                        }
                      },
                      x: {
                        title: {
                          display: true,
                          text: t('common.date')
                        }
                      }
                    }
                  }}
                />
              </div>
              <p className="mt-4 text-sm text-gray-500 italic">
                {t('dashboard.sentimentChartDescription')}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">{t('dashboard.sentimentTrends')}</h2>
              <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
                <p className="text-gray-500">{t('dashboard.noSentimentData')}</p>
              </div>
            </div>
          )}
          
          {/* Upcoming Sessions */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">{t('dashboard.upcomingSessions')}</h2>
              <Link
                to="/therapist/clients"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
              >
                {t('common.viewAll')} <ArrowRightIcon className="h-4 w-4 ml-1" />
              </Link>
            </div>
            
            {upcomingSessions.length > 0 ? (
              <div className="space-y-4">
                {upcomingSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center">
                      <div className="p-3 bg-blue-100 rounded-full mr-4">
                        <ClockIcon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {session.clients?.name || t('common.client')}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(session.start_time).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {/* Join session logic */}}
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      {t('dashboard.join')}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500 mb-4">{t('dashboard.noSessionsScheduled')}</p>
                <button
                  onClick={() => {/* Schedule session logic */}}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  {t('dashboard.scheduleNewSession')}
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Right Column - Recent Summaries */}
        <div className="space-y-8">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">{t('dashboard.recentAISummaries')}</h2>
              <Link
                to="/therapist/clients"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
              >
                {t('common.viewAll')} <ArrowRightIcon className="h-4 w-4 ml-1" />
              </Link>
            </div>
            
            {recentSummaries.length > 0 ? (
              <div className="space-y-4">
                {recentSummaries.map((summary) => (
                  <div
                    key={summary.id}
                    className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-gray-900">
                          {summary.conversations?.clients?.name || t('common.client')}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(summary.created_at).toLocaleString()}
                        </p>
                      </div>
                      <Link
                        to={`/therapist/clients/${summary.conversations?.client_id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        {t('common.details')}
                      </Link>
                    </div>
                    <p className="text-gray-800 line-clamp-3">{summary.summary_text}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {t('dashboard.sentiment')}: {summary.sentiment_metrics?.average?.toFixed(2) || t('common.notAvailable')}
                      </span>
                      {summary.sentiment_metrics?.trend && (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${summary.sentiment_metrics.trend === 'improving' ? 'bg-green-100 text-green-800' : summary.sentiment_metrics.trend === 'declining' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {t('dashboard.trend')}: {t(`dashboard.trend.${summary.sentiment_metrics.trend}`)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">{t('dashboard.noRecentSummaries')}</p>
              </div>
            )}
          </div>
          
          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">{t('dashboard.quickActions')}</h2>
            <div className="space-y-3">
              <Link
                to="/therapist/clients"
                className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <UserGroupIcon className="h-5 w-5 text-blue-600 mr-3" />
                <span className="text-gray-900">Manage Clients</span>
              </Link>
              
              <button
                onClick={() => {/* Schedule session logic */}}
                className="w-full flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
              >
                <CalendarIcon className="h-5 w-5 text-indigo-600 mr-3" />
                <span className="text-gray-900">Schedule New Session</span>
              </button>
              
              <button
                onClick={() => {/* Create behavior preset logic */}}
                className="w-full flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
              >
                <DocumentTextIcon className="h-5 w-5 text-purple-600 mr-3" />
                <span className="text-gray-900">Create Behavior Preset</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Client List Preview */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-secondary-900">{t('dashboard.yourClients')}</h2>
          <Link
            to="/therapist/clients"
            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            View All
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.slice(0, 6).map((client) => (
            <Link
              key={client.id}
              to={`/therapist/clients/${client.id}`}
              className="p-4 bg-secondary-50 rounded-lg hover:bg-secondary-100 transition-colors"
            >
              <p className="font-medium text-secondary-900">
                {client.users?.profile_data?.name || client.name || t('common.client')}
              </p>
              <p className="text-sm text-secondary-600">
                {client.client_behaviors?.length || 0} {t('dashboard.activeBehaviors')}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
