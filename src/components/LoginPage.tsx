import React from 'react';
import useAuth from '../hooks/useAuth';

const LoginPage: React.FC = () => {
  const { signIn, loading, error } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl flex flex-col md:flex-row bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Left side - Illustration and branding */}
        <div className="w-full md:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-700 p-6 md:p-8 flex flex-col justify-between text-white">
          <div>
            <div className="flex items-center mb-6">
              <svg className="w-8 h-8 mr-3" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M32 16C25.373 16 20 21.373 20 28C20 31.197 21.125 34.115 23 36.34V44L28.223 41.379C29.428 41.78 30.686 42 32 42C38.627 42 44 36.627 44 30C44 23.373 38.627 18 32 18V16Z" fill="white"/>
                <path d="M32 48C41.941 48 50 39.941 50 30C50 20.059 41.941 12 32 12C22.059 12 14 20.059 14 30C14 34.764 15.805 39.122 18.837 42.362L16 52L25.638 49.163C27.661 49.708 29.795 50 32 50V48Z" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M26 28H38" stroke="#3B82F6" stroke-width="2.5" stroke-linecap="round"/>
                <path d="M26 34H34" stroke="#3B82F6" stroke-width="2.5" stroke-linecap="round"/>
              </svg>
              <h2 className="text-xl md:text-2xl font-bold">AI Interview Assistant</h2>
            </div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4">Ace Your Next Interview</h1>
            <p className="text-sm md:text-base text-blue-100 mb-6">
              Practice with our AI-powered assistant that simulates real interview scenarios and provides instant feedback.
            </p>
          </div>
          
          <div className="hidden md:block">
            {/* Interview illustration */}
            <div className="relative h-48 mt-6">
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-blue-500 rounded-full opacity-70"></div>
              <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500 rounded-full opacity-50"></div>
              <div className="absolute bottom-10 right-10 w-12 h-12 bg-purple-500 rounded-full opacity-60"></div>
              <div className="absolute top-6 left-10 w-10 h-10 bg-blue-300 rounded-full opacity-80"></div>
              <div className="absolute inset-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 flex items-center justify-center">
                <svg className="w-24 h-24 text-white/80" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"></path>
                </svg>
              </div>
            </div>
          </div>
          
          <div className="mt-6 md:mt-0">
            <p className="text-xs md:text-sm text-blue-100">
              © 2025 AI Interview Assistant. All rights reserved.
            </p>
          </div>
        </div>
        
        {/* Right side - Login form */}
        <div className="w-full md:w-1/2 p-6 md:p-8">
          <div className="max-w-sm mx-auto">
            <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">Welcome</h3>
            <p className="text-sm md:text-base text-gray-600 mb-8">
              Sign in to start practicing your interview skills
            </p>
            
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded mb-6 text-sm">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{error}</span>
                </div>
              </div>
            )}
            
            <button
              onClick={signIn}
              disabled={loading}
              className={`flex items-center justify-center w-full bg-white border border-gray-300 rounded-lg shadow-md px-4 py-3 md:px-6 md:py-3 text-sm font-medium text-gray-800 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all ${
                loading ? 'opacity-70 cursor-not-allowed' : ''
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
            
            <div className="mt-8 space-y-4">
              <div className="flex items-center">
                <div className="bg-blue-500 p-1 rounded-full text-white mr-3">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm text-gray-600">Practice with realistic interview questions</p>
              </div>
              <div className="flex items-center">
                <div className="bg-blue-500 p-1 rounded-full text-white mr-3">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm text-gray-600">Get instant feedback on your responses</p>
              </div>
              <div className="flex items-center">
                <div className="bg-blue-500 p-1 rounded-full text-white mr-3">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm text-gray-600">Improve your interview skills with AI guidance</p>
              </div>
            </div>
            
            <div className="mt-8 text-xs text-gray-500 text-center">
              By signing in, you agree to our <a href="#" className="text-blue-600 hover:underline">Terms of Service</a> and <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 