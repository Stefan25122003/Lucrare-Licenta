import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Polls from './components/Polls';
import SecurePolls from './components/SecurePolls'; // Add this
import NavBar from './components/NavBar'; // Add this
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <NavBar /> {/* Add this */}
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/polls" element={<Polls />} />
          <Route path="/secure-polls" element={<SecurePolls />} /> {/* Add this */}
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;