import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { BrowserRouter, Route, Routes } from 'react-router';

import Landing from './pages/Landing';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import LobbyPage from './pages/LobbyPage';
import DashboardPage from './pages/DashboardPage';
import CreateQuizPage from './pages/CreateQuizPage';
import HostPage from './pages/HostPage';
import EditQuizPage from './pages/EditQuizPage';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

const App = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
      <AuthProvider>
        <SocketProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/lobby/:pin" element={<LobbyPage />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/create" element={<CreateQuizPage />} />
                <Route path="/edit/:id" element={<EditQuizPage />} />
                <Route path="/host/:id" element={<HostPage />} />
              </Route>
            </Route>
          </Routes>
        </SocketProvider>
      </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default App;
