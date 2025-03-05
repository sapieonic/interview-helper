import React from 'react';
import { User } from 'firebase/auth';

interface UserProfileProps {
  user: User;
  onLogout: () => Promise<void>;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onLogout }) => {
  return (
    <div className="flex items-center space-x-2 w-full md:w-auto justify-start">
      {user.photoURL && (
        <img 
          src={user.photoURL} 
          alt={user.displayName || 'User'} 
          className="w-6 h-6 md:w-8 md:h-8 rounded-full"
        />
      )}
      <div className="text-xs md:text-sm">
        <div className="font-medium text-gray-700 truncate max-w-[120px] md:max-w-none">{user.displayName}</div>
        <button 
          onClick={onLogout}
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          Sign out
        </button>
      </div>
    </div>
  );
};

export default UserProfile; 