import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../services/supabaseClient';

const BehaviorManagement = () => {
  const { user } = useAuth();
  const [behaviors, setBehaviors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingBehavior, setEditingBehavior] = useState(null);
  const [newBehavior, setNewBehavior] = useState({
    name: '',
    description: '',
    prompt_template: '',
    category: '',
    active: true
  });

  useEffect(() => {
    fetchBehaviors();
  }, []);

  const fetchBehaviors = async () => {
    try {
      const { data, error } = await supabase
        .from('behaviors')
        .select('*, client_behaviors (*)')
        .order('name', { ascending: true });

      if (error) throw error;

      setBehaviors(data || []);
    } catch (error) {
      console.error('Error fetching behaviors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBehavior = async (e) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('behaviors')
        .insert([newBehavior])
        .select()
        .single();

      if (error) throw error;

      setBehaviors([...behaviors, { ...data, client_behaviors: [] }]);
      setNewBehavior({
        name: '',
        description: '',
        prompt_template: '',
        category: '',
        active: true
      });
    } catch (error) {
      console.error('Error creating behavior:', error);
    }
  };

  const handleUpdateBehavior = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('behaviors')
        .update(editingBehavior)
        .eq('id', editingBehavior.id);

      if (error) throw error;

      setBehaviors(behaviors.map(behavior =>
        behavior.id === editingBehavior.id ? editingBehavior : behavior
      ));
      setEditingBehavior(null);
    } catch (error) {
      console.error('Error updating behavior:', error);
    }
  };

  const handleToggleActive = async (behaviorId, currentActive) => {
    try {
      const { error } = await supabase
        .from('behaviors')
        .update({ active: !currentActive })
        .eq('id', behaviorId);

      if (error) throw error;

      setBehaviors(behaviors.map(behavior =>
        behavior.id === behaviorId
          ? { ...behavior, active: !currentActive }
          : behavior
      ));
    } catch (error) {
      console.error('Error toggling behavior status:', error);
    }
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
        <h1 className="text-2xl font-semibold text-secondary-900">Behavior Management</h1>
        <p className="mt-2 text-secondary-600">
          Configure and manage AI agent behaviors
        </p>
      </div>

      {/* Create New Behavior */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-secondary-900 mb-4">Create New Behavior</h2>
        <form onSubmit={handleCreateBehavior} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-secondary-700">
                Name
              </label>
              <input
                type="text"
                id="name"
                value={newBehavior.name}
                onChange={(e) => setNewBehavior({ ...newBehavior, name: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-secondary-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-secondary-700">
                Category
              </label>
              <input
                type="text"
                id="category"
                value={newBehavior.category}
                onChange={(e) => setNewBehavior({ ...newBehavior, category: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-secondary-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-secondary-700">
              Description
            </label>
            <textarea
              id="description"
              value={newBehavior.description}
              onChange={(e) => setNewBehavior({ ...newBehavior, description: e.target.value })}
              rows={3}
              className="mt-1 block w-full rounded-lg border border-secondary-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          <div>
            <label htmlFor="prompt_template" className="block text-sm font-medium text-secondary-700">
              Prompt Template
            </label>
            <textarea
              id="prompt_template"
              value={newBehavior.prompt_template}
              onChange={(e) => setNewBehavior({ ...newBehavior, prompt_template: e.target.value })}
              rows={5}
              className="mt-1 block w-full rounded-lg border border-secondary-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
              required
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              Create Behavior
            </button>
          </div>
        </form>
      </div>

      {/* Behavior List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-200">
            <thead className="bg-secondary-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Behavior
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Category
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Usage
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-secondary-200">
              {behaviors.map((behavior) => (
                <tr key={behavior.id}>
                  <td className="px-6 py-4">
                    {editingBehavior?.id === behavior.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editingBehavior.name}
                          onChange={(e) => setEditingBehavior({
                            ...editingBehavior,
                            name: e.target.value
                          })}
                          className="block w-full rounded-lg border border-secondary-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <textarea
                          value={editingBehavior.description}
                          onChange={(e) => setEditingBehavior({
                            ...editingBehavior,
                            description: e.target.value
                          })}
                          rows={2}
                          className="block w-full rounded-lg border border-secondary-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    ) : (
                      <div>
                        <div className="text-sm font-medium text-secondary-900">
                          {behavior.name}
                        </div>
                        <div className="text-sm text-secondary-500">
                          {behavior.description}
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingBehavior?.id === behavior.id ? (
                      <input
                        type="text"
                        value={editingBehavior.category}
                        onChange={(e) => setEditingBehavior({
                          ...editingBehavior,
                          category: e.target.value
                        })}
                        className="block w-full rounded-lg border border-secondary-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    ) : (
                      <span className="text-sm text-secondary-900">
                        {behavior.category}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-secondary-900">
                      {behavior.client_behaviors?.length || 0} clients
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleActive(behavior.id, behavior.active)}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        behavior.active
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-secondary-100 text-secondary-800 hover:bg-secondary-200'
                      }`}
                    >
                      {behavior.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {editingBehavior?.id === behavior.id ? (
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={handleUpdateBehavior}
                          className="text-green-600 hover:text-green-900"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingBehavior(null)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingBehavior(behavior)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BehaviorManagement;
