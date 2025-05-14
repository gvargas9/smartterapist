import React from 'react';
import SupabaseDemo from '../components/SupabaseDemo';

const SupabaseTestPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Supabase Integration Test</h1>
      <div className="bg-white shadow-md rounded-lg p-6">
        <SupabaseDemo />
      </div>
    </div>
  );
};

export default SupabaseTestPage;
