import React from 'react';
import useAuth from '../hooks/useAuth';

const LoginPage: React.FC = () => {
  const { signIn, loading, error } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-4 md:p-8 text-center">
        <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">AI Interview Assistant</h1>
        <p className="text-sm md:text-base text-gray-600 mb-6 md:mb-8">
          Practice your interview skills with our AI-powered assistant. Sign in to get started.
        </p>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 md:px-4 md:py-3 rounded mb-4 text-sm md:text-base">
            {error}
          </div>
        )}
        
        <button
          onClick={signIn}
          disabled={loading}
          className={`flex items-center justify-center w-full bg-white border border-gray-300 rounded-lg shadow-md px-4 py-2 md:px-6 md:py-3 text-sm font-medium text-gray-800 hover:bg-gray-200 focus:outline-none ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <svg className="h-5 w-5 md:h-6 md:w-6 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span className="text-sm md:text-base">{loading ? 'Signing in...' : 'Sign in with Google'}</span>
        </button>
        
        <div className="mt-6 md:mt-8 text-xs md:text-sm text-gray-500">
          This application requires authentication to protect your privacy and data.
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 