// App.js - FIXED cu Home page introductivă
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './components/Home'; // ✅ FIX: Importă componenta Home
import Login from './components/Login';
import Register from './components/Register';
import Polls from './components/Polls';
import SecurePolls from './components/SecurePolls';
import RealSecurePollDetail from './components/RealSecurePollDetail'; // ✅ CORECTARE: Folosește exact numele fișierului cu case-ul corect
import Profile from './components/Profile';
import NavBar from './components/NavBar';
import { AuthProvider, useAuth } from './context/AuthContext';
import PollStatistics from './components/PollStatistics';
import PollDetail from './components/PollDetail';
import UserProfile from './components/UserProfile';
import VotingProcess from './components/VotingProcess'; // ✅ FIX: Importă componenta VotingProcess

// Componentă pentru protejarea rutelor
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  console.log('🛡️ ProtectedRoute - User:', user, 'Loading:', loading);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (!user) {
    console.log('🔒 No user, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Componentă pentru rutele publice
const PublicOnlyRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  console.log('🌐 PublicOnlyRoute - User:', user, 'Loading:', loading);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // ✅ FIX: Nu mai redirecționăm utilizatorii autentificați de pe Home
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <NavBar />
          <main className="pt-16">
            <Routes>
              {/* ✅ FIX: Ruta principală pentru Home page */}
              <Route path="/" element={<Home />} />
              
              {/* Rute publice */}
              <Route 
                path="/login" 
                element={
                  <PublicOnlyRoute>
                    <Login />
                  </PublicOnlyRoute>
                } 
              />
              <Route 
                path="/register" 
                element={
                  <PublicOnlyRoute>
                    <Register />
                  </PublicOnlyRoute>
                } 
              />
              
              {/* Rute protejate */}
              <Route 
                path="/polls" 
                element={
                  <ProtectedRoute>
                    <Polls />
                  </ProtectedRoute>
                } 
              />
              
              {/* Ruta pentru detaliile sondajului - TREBUIE să fie ÎNAINTE de /polls/:pollId/statistics */}
              <Route 
                path="/polls/:pollId" 
                element={
                  <ProtectedRoute>
                    <PollDetail />
                  </ProtectedRoute>
                } 
              />
              
              {/* Ruta pentru statistici sondaje normale - TREBUIE să fie DUPĂ /polls/:pollId */}
              <Route 
                path="/polls/:pollId/statistics" 
                element={
                  <ProtectedRoute>
                    <PollStatistics />
                  </ProtectedRoute>
                } 
              />
              
              {/* ✅ SONDAJE SECURIZATE CU REAL CRYPTO */}
              <Route 
                path="/secure-polls" 
                element={
                  <ProtectedRoute>
                    <SecurePolls />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/secure-polls/:pollId" 
                element={
                  <ProtectedRoute>
                    <RealSecurePollDetail /> {/* ✅ CORECTARE: Numele corect al componentei */}
                  </ProtectedRoute>
                } 
              />
              
              {/* Profil */}
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } 
              />
              
              {/* Profil utilizator */}
              <Route 
                path="/users/:username" 
                element={
                  <ProtectedRoute>
                    <UserProfile />
                  </ProtectedRoute>
                } 
              />
              
              {/* Ruta pentru procesul de votare - COMPONENTĂ NOUĂ */}
              <Route 
                path="/voting-process" 
                element={<VotingProcess />} 
              />
              
              {/* 404 */}
              <Route 
                path="*" 
                element={
                  <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                      <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
                      <p className="text-gray-600">Pagina nu a fost găsită</p>
                      <button 
                        onClick={() => window.location.href = '/'}
                        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                      >
                        🏠 Înapoi acasă
                      </button>
                    </div>
                  </div>
                } 
              />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;