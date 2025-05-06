import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NavBar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">
          Sistem de Vot
        </Link>
        
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <Link to="/polls" className="hover:text-gray-300">
                Sondaje Normale
              </Link>
              <Link to="/secure-polls" className="hover:text-gray-300">
                Sondaje Anonime Securizate
              </Link>
              <span className="text-gray-400">
                {user.username}
              </span>
              <button 
                onClick={handleLogout}
                className="bg-red-600 px-3 py-1 rounded hover:bg-red-700"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-gray-300">
                Login
              </Link>
              <Link to="/register" className="hover:text-gray-300">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavBar;