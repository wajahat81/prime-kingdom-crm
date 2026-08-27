import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const IDLE_TIMEOUT_MINUTES = 15; // Set your desired inactivity threshold (e.g., 30 minutes)

export default function useIdleTimeout() {
  const navigate = useNavigate();
  const timerRef = useRef(null);

  const logoutUser = () => {
    // Clear Supabase session / local storage
    localStorage.removeItem('sb-access-token'); // Update key if your app uses a different auth token storage key
    localStorage.removeItem('sb-refresh-token');
    sessionStorage.clear();
    
    // Redirect to login page and reload to clear application state
    navigate('/login', { replace: true });
    window.location.reload(); 
  };

  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    
    // Convert minutes into milliseconds
    timerRef.current = setTimeout(logoutUser, IDLE_TIMEOUT_MINUTES * 60 * 1000);
  };

  useEffect(() => {
    // Events that register user activity
    const activityEvents = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];

    // Listen to user actions across the window
    activityEvents.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    // Initialize timer on mount
    resetTimer();

    // Cleanup listeners on unmount
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      activityEvents.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [navigate]);
}