import { NavLink, useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { Home, Music, Dumbbell, BarChart3, User } from 'lucide-react';
// Home | Music (workouts list) | Dumbbell FAB (start workout) | BarChart3 (stats) | User (profile)

export default function BottomNav() {
  const { user } = useUser();
  const navigate = useNavigate();

  if (!user) return null;

  const isTrainer = user.role === 'trainer';
  const base = isTrainer ? '/trainer' : `/client/${user._id}`;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-100">
      <div className="max-w-lg mx-auto flex items-end justify-around px-6 h-[72px] pb-2 relative">
        {/* Home */}
        <NavLink to={base} end className={({ isActive }) => `nav-item ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>
          <Home size={24} strokeWidth={1.8} />
        </NavLink>

        {/* Music */}
        <NavLink
          to="/music"
          className={({ isActive }) => `nav-item ${isActive ? 'text-gray-900' : 'text-gray-400'}`}
        >
          <Music size={24} strokeWidth={1.8} />
        </NavLink>

        {/* Center FAB - Start Workout */}
        <div className="relative -mt-5">
          <button
            onClick={() => navigate(isTrainer ? '/trainer' : `${base}/workouts`)}
            className="w-14 h-14 rounded-2xl bg-accent shadow-lg shadow-accent/30 flex items-center justify-center text-white active:scale-95 transition-transform"
          >
            <Dumbbell size={26} strokeWidth={2.5} />
          </button>
        </div>

        {/* Stats/History */}
        <NavLink
          to={isTrainer ? '/trainer/history' : `${base}/history`}
          className={({ isActive }) => `nav-item ${isActive ? 'text-gray-900' : 'text-gray-400'}`}
        >
          <BarChart3 size={24} strokeWidth={1.8} />
        </NavLink>

        {/* Profile */}
        <NavLink
          to="/profile"
          className={({ isActive }) => `nav-item ${isActive ? 'text-gray-900' : 'text-gray-400'}`}
        >
          <User size={24} strokeWidth={1.8} />
        </NavLink>
      </div>
    </nav>
  );
}
