import { Outlet, useLocation } from 'react-router-dom';
import TopBar from './TopBar';
import BottomNav from './BottomNav';
import { WorkoutTimerBar } from '../WorkoutTimer';
import { useUser } from '../../context/UserContext';

export default function AppShell() {
  const { user } = useUser();
  const location = useLocation();
  const inSession = location.pathname.includes('/session');

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {user?.role === 'client' && !inSession && <WorkoutTimerBar userId={user._id} />}
      <TopBar />
      <main className="max-w-lg mx-auto px-4 pb-28 pt-1">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
