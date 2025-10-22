// src/routes/ProfileGate.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useProfileStatus } from '../context/useProfileStatus';

export default function ProfileGate({ children }) {
  const { loading, needsOnboarding } = useProfileStatus();
  const loc = useLocation();

  if (loading) return null;
  if (needsOnboarding && loc.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }
  return children;
}
