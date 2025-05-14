import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Layout = ({ type }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  
  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/" className="text-primary-600 font-bold text-xl">
                  AI Coach & Therapist
                </Link>
              </div>
              
              {/* Navigation Links */}
              <nav className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {type === 'client' && (
                  <>
                    <Link to="/client/dashboard" className="border-primary-500 text-secondary-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                      Dashboard
                    </Link>
                    <Link to="/client/chat" className="border-transparent text-secondary-500 hover:border-secondary-300 hover:text-secondary-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                      Chat
                    </Link>
                  </>
                )}
                
                {type === 'therapist' && (
                  <>
                    <Link to="/therapist/dashboard" className="border-primary-500 text-secondary-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                      Dashboard
                    </Link>
                    <Link to="/therapist/clients" className="border-transparent text-secondary-500 hover:border-secondary-300 hover:text-secondary-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                      Clients
                    </Link>
                  </>
                )}
                
                {type === 'admin' && (
                  <>
                    <Link to="/admin/dashboard" className="border-primary-500 text-secondary-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                      Dashboard
                    </Link>
                    <Link to="/admin/behaviors" className="border-transparent text-secondary-500 hover:border-secondary-300 hover:text-secondary-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                      Behaviors
                    </Link>
                    <Link to="/admin/users" className="border-transparent text-secondary-500 hover:border-secondary-300 hover:text-secondary-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                      Users
                    </Link>
                    <Link to="/admin/subscriptions" className="border-transparent text-secondary-500 hover:border-secondary-300 hover:text-secondary-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                      Subscriptions
                    </Link>
                  </>
                )}
              </nav>
            </div>
            
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              {/* Profile dropdown */}
              <div className="ml-3 relative flex items-center space-x-4">
                <span className="text-sm font-medium text-secondary-700">
                  {user?.email}
                </span>
                <button
                  onClick={handleSignOut}
                  type="button"
                  className="text-secondary-500 hover:text-secondary-700 focus:outline-none"
                >
                  Sign out
                </button>
              </div>
            </div>
            
            {/* Mobile menu button */}
            <div className="flex items-center sm:hidden">
              <button
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-md text-secondary-400 hover:text-secondary-500 hover:bg-secondary-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
                aria-controls="mobile-menu"
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                {/* Menu icon */}
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile menu, show/hide based on menu state */}
        <div className="sm:hidden hidden" id="mobile-menu">
          <div className="pt-2 pb-3 space-y-1">
            {type === 'client' && (
              <>
                <Link to="/client/dashboard" className="bg-primary-50 border-primary-500 text-primary-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium">
                  Dashboard
                </Link>
                <Link to="/client/chat" className="border-transparent text-secondary-500 hover:bg-secondary-50 hover:border-secondary-300 hover:text-secondary-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium">
                  Chat
                </Link>
              </>
            )}
            
            {type === 'therapist' && (
              <>
                <Link to="/therapist/dashboard" className="bg-primary-50 border-primary-500 text-primary-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium">
                  Dashboard
                </Link>
                <Link to="/therapist/clients" className="border-transparent text-secondary-500 hover:bg-secondary-50 hover:border-secondary-300 hover:text-secondary-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium">
                  Clients
                </Link>
              </>
            )}
            
            {type === 'admin' && (
              <>
                <Link to="/admin/dashboard" className="bg-primary-50 border-primary-500 text-primary-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium">
                  Dashboard
                </Link>
                <Link to="/admin/behaviors" className="border-transparent text-secondary-500 hover:bg-secondary-50 hover:border-secondary-300 hover:text-secondary-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium">
                  Behaviors
                </Link>
                <Link to="/admin/users" className="border-transparent text-secondary-500 hover:bg-secondary-50 hover:border-secondary-300 hover:text-secondary-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium">
                  Users
                </Link>
                <Link to="/admin/subscriptions" className="border-transparent text-secondary-500 hover:bg-secondary-50 hover:border-secondary-300 hover:text-secondary-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium">
                  Subscriptions
                </Link>
              </>
            )}
          </div>
          
          <div className="pt-4 pb-3 border-t border-secondary-200">
            <div className="flex items-center px-4">
              <div className="ml-3">
                <div className="text-base font-medium text-secondary-800">{user?.email}</div>
                <div className="text-sm font-medium text-secondary-500">{type}</div>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <button
                onClick={handleSignOut}
                className="block px-4 py-2 text-base font-medium text-secondary-500 hover:text-secondary-800 hover:bg-secondary-100 w-full text-left"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-secondary-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm text-secondary-500 text-center">
            &copy; {new Date().getFullYear()} AI Coach & Therapist Platform - Inspiration AI / Gvargas Inc.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
