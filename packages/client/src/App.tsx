import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';
import Landing from './pages/Landing.tsx';
import Login from './pages/Login.tsx';
import Signup from './pages/Signup.tsx';
import Dashboard from './pages/Dashboard.tsx';
import CreateGroup from './pages/CreateGroup.tsx';
import JoinGroup from './pages/JoinGroup.tsx';
import GroupDashboard from './pages/GroupDashboard.tsx';
import ConsensusResult from './pages/ConsensusResult.tsx';
import SequentialMemberEntry from './components/SequentialMemberEntry.tsx';

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased flex flex-col justify-between">
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/create"
              element={
                <ProtectedRoute>
                  <CreateGroup />
                </ProtectedRoute>
              }
            />
            <Route path="/join" element={<JoinGroup />} />
            <Route path="/join/:code" element={<JoinGroup />} />
            <Route
              path="/group/:id"
              element={
                <ProtectedRoute>
                  <GroupDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/group/:id/result" element={<ConsensusResult />} />
            <Route
              path="/sequential"
              element={
                <ProtectedRoute>
                  <SequentialMemberEntry />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>

        <footer className="py-6 border-t border-slate-200 bg-white text-center text-xs text-slate-500 font-medium tracking-wide mt-auto shadow-xs">
          <span>ConsensusAI Platform &copy; {new Date().getFullYear()} — Built with ❤️ by <strong className="font-extrabold text-slate-700">Avenger Team</strong></span>
        </footer>
      </div>
    </AuthProvider>
  );
}
