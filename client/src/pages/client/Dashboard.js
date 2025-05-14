import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { userService } from '../../services/userService';
import { chatService } from '../../services/chatService';
import { useTranslation } from 'react-i18next';
import { CalendarIcon, ChatBubbleLeftRightIcon, DocumentTextIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [conversations, setConversations] = useState([]);
  const [upcomingSession, setUpcomingSession] = useState(null);
  const [sentimentData, setSentimentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSessions: 0,
    averageSentiment: 0,
    improvementTrend: 'stable',
    lastSessionDate: null
  });
  const [resources, setResources] = useState([]);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch data from Supabase
        // Get user's conversations
        const userConversations = await chatService.getUserConversations(user.id);
        
        // Sort conversations by date (newest first)
        const sortedConversations = userConversations.sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        );
        
        // Get only the 5 most recent conversations
        const recentConvs = sortedConversations.slice(0, 5);
        setConversations(recentConvs);
        
        // Get upcoming session
        const sessions = await userService.getUserSessions(user.id);
        const upcomingSess = sessions.filter(session => 
          new Date(session.start_time) > new Date()
        ).sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
        
        // Set the next upcoming session if available
        if (upcomingSess.length > 0) {
          setUpcomingSession(upcomingSess[0]);
        }
        
        // Get sentiment data for chart
        const sentimentHistory = await userService.getUserSentimentHistory(user.id);
        
        if (sentimentHistory && sentimentHistory.length > 0) {
          // Process sentiment data for chart display
          const labels = sentimentHistory.map(item => {
            const date = new Date(item.date);
            return `${date.getMonth() + 1}/${date.getDate()}`;
          });
          
          const data = sentimentHistory.map(item => item.score);
          
          const chartData = {
            labels,
            datasets: [{
              label: t('dashboard.sentimentScore'),
              data,
              borderColor: 'rgb(75, 192, 192)',
              backgroundColor: 'rgba(75, 192, 192, 0.5)',
              tension: 0.3
            }]
          };
          
          setSentimentData(chartData);
          
          // Calculate stats
          const totalSessions = await userService.getUserSessionsCount(user.id);
          const avgSentiment = data.reduce((sum, score) => sum + score, 0) / data.length;
          
          // Determine improvement trend
          let trend = 'stable';
          if (data.length >= 3) {
            const recent = data.slice(-3);
            if (recent[2] > recent[0]) {
              trend = 'improving';
            } else if (recent[2] < recent[0]) {
              trend = 'declining';
            }
          }
          
          setStats({
            totalSessions,
            averageSentiment: avgSentiment.toFixed(2),
            improvementTrend: trend,
            lastSessionDate: sentimentHistory[sentimentHistory.length - 1].date
          });
        }
        
        // Get resources
        const userResources = await userService.getUserResources(user.id);
        setResources(userResources || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (user && user.id) {
      fetchDashboardData();
    }
  }, [user, t]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl shadow-lg p-6 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              {t('dashboard.welcomeBack', {name: user.profile_data?.name || t('common.client')})}
            </h1>
            <p className="mt-2 text-primary-100 max-w-2xl">
              {t('dashboard.trackProgress')}
            </p>
          </div>
          <div className="hidden md:block">
            <img 
              src="https://cdn-icons-png.flaticon.com/512/3209/3209993.png" 
              alt={t('dashboard.wellness')} 
              className="w-24 h-24 opacity-80"
            />
          </div>
        </div>
      </div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-bold text-primary-500">{stats.totalSessions}</span>
          <span className="text-sm text-gray-500 mt-2">{t('dashboard.totalSessions')}</span>
        </div>
        
        <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-bold text-primary-500">{stats.averageSentiment}</span>
          <span className="text-sm text-gray-500 mt-2">{t('dashboard.averageScore')}</span>
        </div>
        
        <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center justify-center text-center">
          <span className={`text-3xl font-bold ${stats.improvementTrend === 'improving' ? 'text-green-500' : stats.improvementTrend === 'declining' ? 'text-red-500' : 'text-yellow-500'}`}>
            {stats.improvementTrend === 'improving' ? '↑' : stats.improvementTrend === 'declining' ? '↓' : '→'}
          </span>
          <span className="text-sm text-gray-500 mt-2">{t('dashboard.progressTrend')}</span>
        </div>
        
        <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-bold text-primary-500">{stats.lastSessionDate || 'None'}</span>
          <span className="text-sm text-gray-500 mt-2">{t('dashboard.lastSession')}</span>
        </div>
      </div>
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">{t('dashboard.quickActions')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                to="/client/chat"
                className="flex items-center p-4 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors group"
              >
                <div className="p-3 bg-primary-100 rounded-full group-hover:bg-primary-200 transition-colors">
                  <ChatBubbleLeftRightIcon className="h-6 w-6 text-primary-600" />
                </div>
                <div className="ml-4">
                  <h3 className="font-medium text-gray-900">{t('dashboard.chatSession')}</h3>
                  <p className="text-sm text-gray-500">{t('dashboard.talkWithAI')}</p>
                </div>
              </Link>
              
              <button
                onClick={() => {/* Schedule session logic */}}
                className="flex items-center p-4 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors group text-left"
              >
                <div className="p-3 bg-primary-100 rounded-full group-hover:bg-primary-200 transition-colors">
                  <CalendarIcon className="h-6 w-6 text-primary-600" />
                </div>
                <div className="ml-4">
                  <h3 className="font-medium text-gray-900">{t('dashboard.schedule')}</h3>
                  <p className="text-sm text-gray-500">{t('dashboard.bookSession')}</p>
                </div>
              </button>
              
              <button
                onClick={() => {/* View resources logic */}}
                className="flex items-center p-4 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors group text-left"
              >
                <div className="p-3 bg-primary-100 rounded-full group-hover:bg-primary-200 transition-colors">
                  <DocumentTextIcon className="h-6 w-6 text-primary-600" />
                </div>
                <div className="ml-4">
                  <h3 className="font-medium text-gray-900">{t('dashboard.resources')}</h3>
                  <p className="text-sm text-gray-500">{t('dashboard.accessMaterials')}</p>
                </div>
              </button>
            </div>
          </div>
          
          {/* Progress Chart */}
          {sentimentData && (
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">{t('dashboard.wellbeingProgress')}</h2>
                <button 
                  className="text-primary-500 hover:text-primary-700 flex items-center text-sm font-medium"
                  onClick={() => {/* Refresh chart data */}}
                >
                  <ArrowPathIcon className="h-4 w-4 mr-1" />
                  {t('common.refresh')}
                </button>
              </div>
              <div className="h-64">
                <Line
                  data={sentimentData}
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
                          text: 'Well-being Score'
                        }
                      },
                      x: {
                        title: {
                          display: true,
                          text: 'Date'
                        }
                      }
                    }
                  }}
                />
              </div>
              <p className="mt-4 text-sm text-gray-500 italic">
                {t('dashboard.chartDescription')}
              </p>
            </div>
          )}
          
          {/* Recent Conversations */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">{t('dashboard.recentSessions')}</h2>
            <div className="space-y-4">
              {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className="border-b border-secondary-200 last:border-0 pb-4 last:pb-0"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-secondary-900 font-medium">
                    {new Date(conversation.start_ts).toLocaleDateString()}
                  </p>
                  <p className="text-secondary-600 text-sm mt-1">
                    {conversation.summaries?.[0]?.summary_text || t('dashboard.noSummary')}
                  </p>
                </div>
                <button
                  onClick={() => {/* View details logic */}}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  {t('common.viewDetails')}
                </button>
              </div>
            </div>
          ))}
            </div>
          </div>
        </div>
        
        {/* Right Column */}
        <div className="space-y-8">
          {/* Upcoming Session */}
          {upcomingSession ? (
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">{t('dashboard.upcomingSession')}</h2>
              <div className="bg-primary-50 p-4 rounded-lg">
                <div className="flex items-center mb-4">
                  <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center mr-4">
                    <CalendarIcon className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {t('dashboard.withTherapist', {name: upcomingSession.therapists?.name || t('common.therapist')})}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {new Date(upcomingSession.start_time).toLocaleString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {/* Join session logic */}}
                  className="w-full bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors flex items-center justify-center"
                >
                  {t('dashboard.joinSession')}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">{t('dashboard.noUpcomingSessions')}</h2>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <p className="text-gray-600 mb-4">{t('dashboard.noSessionsScheduled')}</p>
                <button
                  onClick={() => {/* Schedule session logic */}}
                  className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
                >
                  {t('dashboard.scheduleNow')}
                </button>
              </div>
            </div>
          )}
          
          {/* Resources */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">{t('dashboard.helpfulResources')}</h2>
            <div className="space-y-3">
              {resources.map(resource => (
                <a
                  key={resource.id}
                  href={resource.url}
                  className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-gray-900">{resource.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{resource.description}</p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                      {resource.type}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
