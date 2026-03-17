import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserProvider, useUser } from './context/UserContext';
import { useEffect } from 'react';
import AppShell from './components/layout/AppShell';
import Welcome from './pages/Welcome';
import Register from './pages/Register';
import Dashboard from './pages/trainer/Dashboard';
import ProgramBuilder from './pages/trainer/ProgramBuilder';
import ProgramEditor from './pages/trainer/ProgramEditor';
import ExerciseEditor from './pages/trainer/ExerciseEditor';
import ClientLogs from './pages/trainer/ClientLogs';
import TrainerHistory from './pages/trainer/TrainerHistory';
import ClientHome from './pages/client/ClientHome';
import WorkoutList from './pages/client/WorkoutList';
import WorkoutDetail from './pages/client/WorkoutDetail';
import SetLogger from './pages/client/SetLogger';
import ClientHistory from './pages/client/ClientHistory';
import Profile from './pages/Profile';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60, retry: 1 },
  },
});

function ProtectedRoute({ children }) {
  const { user } = useUser();
  if (!user) return <Navigate to="/" replace />;
  return children;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function AppRoutes() {
  return (
    <>
    <ScrollToTop />
    <Routes>
      {/* Auth pages - standalone (no AppShell) */}
      <Route path="/" element={<Welcome />} />
      <Route path="/register" element={<Register />} />

      {/* Protected app routes */}
      <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
        <Route path="/profile" element={<Profile />} />
        <Route path="/trainer" element={<Dashboard />} />
        <Route path="/trainer/program/new" element={<ProgramBuilder />} />
        <Route path="/trainer/program/:id" element={<ProgramEditor />} />
        <Route path="/trainer/program/:id/workout/:wid" element={<ExerciseEditor />} />
        <Route path="/trainer/client/:cid/logs" element={<ClientLogs />} />
        <Route path="/trainer/history" element={<TrainerHistory />} />
        <Route path="/client/:cid" element={<ClientHome />} />
        <Route path="/client/:cid/workouts" element={<WorkoutList />} />
        <Route path="/client/:cid/workout/:wid" element={<WorkoutDetail />} />
        <Route path="/client/:cid/workout/:wid/exercise/:eid" element={<SetLogger />} />
        <Route path="/client/:cid/history" element={<ClientHistory />} />
      </Route>
    </Routes>
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </UserProvider>
    </QueryClientProvider>
  );
}
