import { AuthProvider } from './context/AuthContext';
import { BrowserRouter, Route, Routes } from 'react-router';

import Landing from './pages/Landing';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import LobbyPage from './pages/LobbyPage';
import QuizPlayPage from './pages/QuizPlayPage';
import DashboardPage from './pages/DashboardPage';
import CreateQuizPage from './pages/CreateQuizPage';
import HostPage from './pages/HostPage';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/lobby/:pin" element={<LobbyPage />} />
          <Route path="/play/:id" element={<QuizPlayPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/create" element={<CreateQuizPage />} />
              <Route path="/host/:id" element={<HostPage />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
