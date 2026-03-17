import { Outlet } from 'react-router-dom';
import TopBar from './TopBar';
import BottomNav from './BottomNav';

export default function AppShell() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <TopBar />
      <main className="max-w-lg mx-auto px-4 pb-28 pt-1">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
