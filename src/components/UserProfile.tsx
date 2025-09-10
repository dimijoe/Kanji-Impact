import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { X } from 'lucide-react';

interface UserProfileProps {
  onClose: () => void;
}

export function UserProfile({ onClose }: UserProfileProps) {
  const { currentUser, userProfile, logout } = useAuth();

  if (!currentUser || !userProfile) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
        <div className="bg-gray-800/95 p-8 rounded-2xl w-full max-w-md mx-4 relative border border-gray-700">
          <h2 className="text-2xl font-bold text-center mb-4">Non connecté</h2>
          <p className="text-gray-400 text-center">
            Vous devez être connecté pour voir votre profil.
          </p>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-gray-800/95 p-8 rounded-2xl w-full max-w-md mx-4 relative border border-gray-700">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        <h2 className="text-3xl font-bold text-center mb-6 bg-gradient-to-r from-sky-400 to-blue-500 text-transparent bg-clip-text">
          Profil de {userProfile.displayName}
        </h2>

        <div className="flex items-center justify-center mb-4">
          <img
            src={currentUser.photoURL || 'https://via.placeholder.com/150'}
            alt="Avatar"
            className="rounded-full w-24 h-24 object-cover border-2 border-sky-500"
          />
        </div>

        <div className="space-y-2">
          <p className="text-gray-300">
            Nom d'utilisateur: <span className="text-white">{userProfile.displayName}</span>
          </p>
          <p className="text-gray-300">
            Email: <span className="text-white">{currentUser.email}</span>
          </p>
          <p className="text-gray-300">
            Total de parties jouées: <span className="text-white">{userProfile.totalGamesPlayed}</span>
          </p>
          <p className="text-gray-300">
            Meilleur score: <span className="text-white">{userProfile.bestScore}</span>
          </p>
        </div>

        <button
          onClick={logout}
          className="w-full bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 transition-all duration-200 font-semibold mt-6"
        >
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
