import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Polls from './components/Polls';
import SecurePolls from './components/SecurePolls';
import SecurePollDetail from './components/SecurePollDetail';
import Profile from './components/Profile'; // Importăm componenta Profile
import NavBar from './components/NavBar';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <NavBar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/polls" element={<Polls />} />
          <Route path="/secure-polls" element={<SecurePolls />} />
          <Route path="/secure-polls/:pollId" element={<SecurePollDetail />} />
          <Route path="/profile" element={<Profile />} /> {/* Adăugăm ruta nouă */}
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;