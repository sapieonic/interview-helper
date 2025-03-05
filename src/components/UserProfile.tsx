import React from 'react';
import { User } from 'firebase/auth';
import { LogOut } from 'lucide-react';

interface UserProfileProps {
  user: User;
  onLogout: () => Promise<void>;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onLogout }) => {
  return (
    <div className="flex items-center">
      <div className="flex items-center bg-white border border-gray-200 rounded-full pl-1 pr-3 py-1 shadow-sm">
        {user.photoURL ? (
          <img 
            src={user.photoURL} 
            alt={user.displayName || 'User'} 
            className="w-7 h-7 rounded-full border-2 border-white"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-medium text-sm">
            {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
          </div>
        )}
        <div className="ml-2 mr-2">
          <div className="font-medium text-sm text-gray-700 truncate max-w-[100px] md:max-w-[140px]">
            {user.displayName || 'User'}
          </div>
        </div>
        <button 
          onClick={onLogout}
          className="text-gray-500 hover:text-red-600 transition-colors"
          title="Sign out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );
};

export default UserProfile; 