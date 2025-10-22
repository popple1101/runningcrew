// src/context/useProfileStatus.js
import { useAuth } from './AuthContext';
import { isProfileComplete } from '../lib/api';

export function useProfileStatus() {
  const { user, loading, refresh } = useAuth();
  const complete = isProfileComplete(user);
  const needsOnboarding = !loading && !!user && !complete;
  
  return { 
    loading, 
    user, 
    complete, 
    needsOnboarding, 
    refresh 
  };
}
