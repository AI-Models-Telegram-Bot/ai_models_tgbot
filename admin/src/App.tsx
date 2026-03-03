import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import UserDetail from './pages/UserDetail';
import Generations from './pages/Generations';
import Trends from './pages/Trends';
import Revenue from './pages/Revenue';
import AuditLogs from './pages/AuditLogs';
import Broadcasts from './pages/Broadcasts';
import BroadcastCompose from './pages/BroadcastCompose';
import Logs from './pages/Logs';
import Providers from './pages/Providers';
import Withdrawals from './pages/Withdrawals';
import Settings from './pages/Settings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/users" element={<Users />} />
            <Route path="/users/:id" element={<UserDetail />} />
            <Route path="/generations" element={<Generations />} />
            <Route path="/trends" element={<Trends />} />
            <Route path="/revenue" element={<Revenue />} />
            <Route path="/providers" element={<Providers />} />
            <Route path="/audit-logs" element={<AuditLogs />} />
            <Route path="/broadcasts" element={<Broadcasts />} />
            <Route path="/broadcasts/new" element={<BroadcastCompose />} />
            <Route path="/broadcasts/:id" element={<BroadcastCompose />} />
            <Route path="/withdrawals" element={<Withdrawals />} />
            <Route path="/logs" element={<Logs />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
