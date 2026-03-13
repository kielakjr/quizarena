import Landing from './pages/Landing';
import { AuthProvider } from './context/AuthContext';
import { BrowserRouter, Route, Routes } from 'react-router';

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App;
