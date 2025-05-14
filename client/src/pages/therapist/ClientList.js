import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../services/supabaseClient';

const ClientList = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const { data, error } = await supabase
          .from('clients')
          .select(`
            *,
            users:user_id (email, profile_data),
            client_behaviors (
              behaviors (name, prompt_template)
            ),
            conversations (
              id,
              start_ts,
              summaries (
                summary_text,
                sentiment_score,
                created_at
              )
            )
          `)
          .eq('therapist_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        setClients(data || []);
      } catch (error) {
        console.error('Error fetching clients:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, [user.id]);

  // Filter and search clients
  const filteredClients = clients.filter(client => {
    const matchesSearch = client.users.profile_data.name.toLowerCase()
      .includes(searchTerm.toLowerCase()) ||
      client.users.email.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'active') {
      return matchesSearch && client.status === 'active';
    }
    if (filterStatus === 'inactive') {
      return matchesSearch && client.status === 'inactive';
    }
    return matchesSearch;
  });

  // Get the latest summary for a client
  const getLatestSummary = (client) => {
    if (!client.conversations || client.conversations.length === 0) return null;

    const summaries = client.conversations
      .flatMap(conv => conv.summaries)
      .filter(Boolean)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return summaries[0];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-semibold text-secondary-900">Your Clients</h1>
        <p className="mt-2 text-secondary-600">
          Manage and monitor your client list
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <label htmlFor="search" className="sr-only">Search clients</label>
            <input
              type="text"
              id="search"
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-secondary-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-lg border border-secondary-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Clients</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            
            <button
              onClick={() => {/* Add client logic */}}
              className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              Add Client
            </button>
          </div>
        </div>
      </div>

      {/* Client List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-200">
            <thead className="bg-secondary-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Client
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Active Behaviors
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Latest Summary
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Last Session
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-secondary-200">
              {filteredClients.map((client) => {
                const latestSummary = getLatestSummary(client);
                const latestSession = client.conversations?.[0];

                return (
                  <tr key={client.id} className="hover:bg-secondary-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-secondary-900">
                            {client.users.profile_data.name}
                          </div>
                          <div className="text-sm text-secondary-500">
                            {client.users.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        client.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-secondary-100 text-secondary-800'
                      }`}>
                        {client.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {client.client_behaviors.map((behavior, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                          >
                            {behavior.behaviors.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {latestSummary ? (
                        <div className="text-sm text-secondary-900">
                          <div className="truncate max-w-xs">
                            {latestSummary.summary_text}
                          </div>
                          <div className="text-secondary-500 mt-1">
                            {new Date(latestSummary.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-secondary-500">No summaries yet</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                      {latestSession ? (
                        new Date(latestSession.start_ts).toLocaleDateString()
                      ) : (
                        'No sessions yet'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        to={`/therapist/clients/${client.id}`}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ClientList;
