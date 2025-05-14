import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { adminService } from '../../services/adminService';
import { useTranslation } from 'react-i18next';
import { Line, Bar } from 'react-chartjs-2';
import '../../utils/chartConfig';
import {
  UserGroupIcon,
  UserIcon,
  CurrencyDollarIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  ArrowRightIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  // Ensure user data is properly initialized even if profile_data is missing
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeClients: 0,
    activeTherapists: 0,
    totalRevenue: 0,
    activeBehaviors: 0,
    totalConversations: 0,
    totalMessages: 0,
    averageSentiment: 0
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentBehaviors, setRecentBehaviors] = useState([]);
  const [userGrowthData, setUserGrowthData] = useState(null);
  const [userDistributionData, setUserDistributionData] = useState(null);
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

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch system stats from Supabase
      const systemStats = await adminService.getSystemStats();
      
      // Fetch recent users
      const usersData = await adminService.getUsers();
      const recentUsersData = usersData.slice(0, 5);
      
      // Fetch recent behaviors
      const behaviorsData = await adminService.getBehaviors();
      const recentBehaviorsData = behaviorsData.slice(0, 5);
      
      // Process user data for charts
      const usersByRole = processUsersByRole(usersData);
      const userGrowth = processUserGrowthData(usersData);
      
      // Calculate estimated revenue
      const clientCount = usersData.filter(user => user.role === 'client').length;
      const estimatedRevenue = calculateEstimatedRevenue(clientCount);
      
      // Update state with fetched data
      setStats({
        totalUsers: systemStats.users.total,
        activeClients: systemStats.users.clients,
        activeTherapists: systemStats.users.therapists,
        activeBehaviors: systemStats.behaviors,
        totalConversations: systemStats.conversations,
        totalMessages: systemStats.messages,
        totalRevenue: estimatedRevenue,
        averageSentiment: systemStats.averageSentiment || 0
      });
      
      setRecentUsers(recentUsersData);
      setRecentBehaviors(recentBehaviorsData);
      setUserGrowthData(userGrowth);
      setUserDistributionData(usersByRole);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const processUsersByRole = (users) => {
    // Count users by role
    const roleCounts = {
      client: 0,
      therapist: 0,
      admin: 0
    };
    
    users.forEach(user => {
      if (user.role in roleCounts) {
        roleCounts[user.role]++;
      }
    });
    
    // Create chart data
    return {
      labels: ['Clients', 'Therapists', 'Admins'],
      datasets: [{
        label: 'Users by Role',
        data: [roleCounts.client, roleCounts.therapist, roleCounts.admin],
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 99, 132, 0.6)'
        ],
        borderColor: [
          'rgb(54, 162, 235)',
          'rgb(153, 102, 255)',
          'rgb(255, 99, 132)'
        ],
        borderWidth: 1
      }]
    };
  };
  
  const processUserGrowthData = (users) => {
    // Get data for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Filter users created in the last 30 days
    const recentUsers = users.filter(user => 
      new Date(user.created_at) >= thirtyDaysAgo
    );
    
    // Group by date
    const dailyCounts = {};
    recentUsers.forEach(user => {
      const date = new Date(user.created_at).toLocaleDateString();
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    });
    
    // Sort dates
    const sortedDates = Object.keys(dailyCounts).sort(
      (a, b) => new Date(a) - new Date(b)
    );
    
    // Create chart data
    return {
      labels: sortedDates,
      datasets: [{
        label: 'New Users',
        data: sortedDates.map(date => dailyCounts[date]),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4
      }]
    };
  };
  
  const calculateEstimatedRevenue = (clientCount) => {
    // Simple revenue estimation based on client count
    // This would be replaced with actual payment data in a real system
    const averageSubscriptionPrice = 49.99;
    return clientCount * averageSubscriptionPrice;
  };

  useEffect(() => {
    // Always fetch dashboard data in development mode
    fetchDashboardData();
  }, []);

  if (loading && !refreshing) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl shadow-lg p-6 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              {t('admin.dashboard.title')}
            </h1>
            <p className="mt-2 text-purple-100 max-w-2xl">
              {t('admin.dashboard.description')}
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow p-6 flex items-center">
          <div className="p-3 bg-blue-100 rounded-full mr-4">
            <UserGroupIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{t('admin.dashboard.totalUsers')}</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
            <div className="mt-1 flex justify-between text-xs text-gray-500">
              <span>{t('common.clients')}: {stats.activeClients}</span>
              <span className="mx-2">|</span>
              <span>{t('common.therapists')}: {stats.activeTherapists}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow p-6 flex items-center">
          <div className="p-3 bg-purple-100 rounded-full mr-4">
            <DocumentTextIcon className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{t('admin.dashboard.behaviorPresets')}</p>
            <p className="text-2xl font-bold text-gray-900">{stats.activeBehaviors}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow p-6 flex items-center">
          <div className="p-3 bg-green-100 rounded-full mr-4">
            <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{t('admin.dashboard.estMonthlyRevenue')}</p>
            <p className="text-2xl font-bold text-gray-900">${stats.totalRevenue.toFixed(2)}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow p-6 flex items-center">
          <div className="p-3 bg-indigo-100 rounded-full mr-4">
            <ChatBubbleLeftRightIcon className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{t('admin.dashboard.platformActivity')}</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalMessages}</p>
            <p className="text-xs text-gray-500 mt-1">{t('admin.dashboard.across')} {stats.totalConversations} {t('common.conversations')}</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Left Column - Charts */}
        <div className="lg:col-span-2 space-y-8">
          {/* User Growth Chart */}
          {userGrowthData && (
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">{t('admin.dashboard.userGrowth')}</h2>
                <div className="text-sm text-gray-500">{t('admin.dashboard.last30Days')}</div>
              </div>
              <div className="h-64">
                <Line
                  key="user-growth-chart"
                  data={userGrowthData}
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
                            return `${t('admin.dashboard.newUsers')}: ${context.parsed.y}`;
                          }
                        }
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          stepSize: 1
                        },
                        title: {
                          display: true,
                          text: t('admin.dashboard.newUsers')
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
            </div>
          )}
          
          {/* User Distribution Chart */}
          {userDistributionData && (
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">{t('admin.dashboard.userDistribution')}</h2>
              </div>
              <div className="h-64">
                <Bar
                  key="user-distribution-chart"
                  data={userDistributionData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: t('admin.dashboard.numberOfUsers')
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Recent Data */}
        <div className="space-y-8">
          {/* Recent Users */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">{t('admin.dashboard.recentUsers')}</h2>
              <Link
                to="/admin/users"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
              >
                View All <ArrowRightIcon className="h-4 w-4 ml-1" />
              </Link>
            </div>
            
            <div className="space-y-4">
              {recentUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <UserIcon className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {user.name || t('admin.dashboard.unnamedUser')}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center">
                        <span className="capitalize">{user.role}</span>
                        <span className="mx-1">•</span>
                        <span>{new Date(user.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <Link
                    to={`/admin/users/${user.id}`}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    {t('common.details')}
                  </Link>
                </div>
              ))}
              
              {recentUsers.length === 0 && (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">{t('admin.dashboard.noUsersFound')}</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Recent Behavior Presets */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">{t('admin.dashboard.recentBehaviorPresets')}</h2>
              <Link
                to="/admin/behaviors"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
              >
                View All <ArrowRightIcon className="h-4 w-4 ml-1" />
              </Link>
            </div>
            
            <div className="space-y-4">
              {recentBehaviors.map((behavior) => (
                <div key={behavior.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">{behavior.name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {t('admin.dashboard.createdBy')}: {behavior.created_by?.name || t('common.unknown')}
                      </p>
                    </div>
                    <Link
                      to={`/admin/behaviors/${behavior.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      {t('common.edit')}
                    </Link>
                  </div>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                    {behavior.prompt_template ? behavior.prompt_template.substring(0, 100) + '...' : behavior.description || t('admin.dashboard.noDescriptionAvailable')}
                  </p>
                </div>
              ))}
              
              {recentBehaviors.length === 0 && (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">{t('admin.dashboard.noBehaviorPresetsFound')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">{t('admin.dashboard.quickActions')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/admin/users/new"
            className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <UserIcon className="h-5 w-5 text-blue-600 mr-3" />
            <span className="text-gray-900">{t('admin.dashboard.createNewUser')}</span>
          </Link>
          
          <Link
            to="/admin/behaviors/new"
            className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <DocumentTextIcon className="h-5 w-5 text-purple-600 mr-3" />
            <span className="text-gray-900">{t('admin.dashboard.createBehaviorPreset')}</span>
          </Link>
          
          <Link
            to="/admin/reports"
            className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChartBarIcon className="h-5 w-5 text-green-600 mr-3" />
            <span className="text-gray-900">{t('admin.dashboard.viewReports')}</span>
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/admin/behaviors"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
        >
          <h3 className="text-lg font-medium text-secondary-900">{t('admin.dashboard.manageBehaviors')}</h3>
          <p className="mt-2 text-secondary-600">
            {t('admin.dashboard.configureAIAgentBehaviorPresets')}
          </p>
        </Link>
        
        <Link
          to="/admin/users"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
        >
          <h3 className="text-lg font-medium text-secondary-900">{t('admin.dashboard.userManagement')}</h3>
          <p className="mt-2 text-secondary-600">
            {t('admin.dashboard.manageUsersAndPermissions')}
          </p>
        </Link>
        
        <Link
          to="/admin/subscriptions"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
        >
          <h3 className="text-lg font-medium text-secondary-900">{t('admin.dashboard.subscriptions')}</h3>
          <p className="mt-2 text-secondary-600">
            {t('admin.dashboard.manageSubscriptionPlansAndBilling')}
          </p>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
