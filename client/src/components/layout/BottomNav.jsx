import { NavLink, useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';

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
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </NavLink>

        {/* Workouts/Clients list */}
        <NavLink
          to={isTrainer ? '/trainer' : `${base}/workouts`}
          end={isTrainer}
          className={({ isActive }) => `nav-item ${isActive && !isTrainer ? 'text-gray-900' : 'text-gray-400'}`}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6.5 6.5h11M6.5 17.5h11M3 10.5v3M21 10.5v3M5 8v8M19 8v8M7 6v12M17 6v12" />
          </svg>
        </NavLink>

        {/* Center FAB - orange squircle */}
        <div className="relative -mt-5">
          <button
            onClick={() => navigate(isTrainer ? '/trainer' : `${base}/workouts`)}
            className="w-14 h-14 rounded-2xl bg-accent shadow-lg shadow-accent/30 flex items-center justify-center text-white active:scale-95 transition-transform"
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>

        {/* Stats/Activity */}
        <button className="nav-item text-gray-400">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        </button>

        {/* Profile */}
        <button onClick={() => navigate('/')} className="nav-item text-gray-400">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
          </svg>
        </button>
      </div>
    </nav>
  );
}
