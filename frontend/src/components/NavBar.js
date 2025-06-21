import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
// ✅ FIX: Importă logo-ul
import logo from '../assets/images/logo.png';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  const navLinkClass = (path) => `
    relative px-3 py-2 text-sm font-medium transition-all duration-200 
    ${isActiveRoute(path) 
      ? 'text-blue-600 border-b-2 border-blue-600' 
      : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
    } 
    rounded-t-md
  `;

  const mobileNavLinkClass = (path) => `
    block px-3 py-2 text-base font-medium transition-colors duration-200
    ${isActiveRoute(path)
      ? 'text-blue-600 bg-blue-50 border-l-4 border-blue-600'
      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
    }
  `;

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200 fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo cu PNG */}
          <div className="flex-shrink-0 flex items-center">
            <Link 
              to="/" 
              className="flex items-center space-x-3 text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors duration-200"
            >
              <img 
                src={logo} 
                alt="PollMaster Logo" 
                className="h-8 w-8 object-contain"
              />
              <span className="hidden sm:block">PollMaster</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <Link to="/" className={navLinkClass('/')}>
              Acasă
            </Link>
            
            {user && (
              <Link to="/polls" className={navLinkClass('/polls')}>
                Sondaje
              </Link>
            )}
            
            {/* ✅ FIX: Toți utilizatorii autentificați pot vedea sondajele securizate */}
            {user && (
              <Link to="/secure-polls" className={navLinkClass('/secure-polls')}>
                Sondaje Securizate
              </Link>
            )}

            {/* Nou: Link către pagina Proces de votare */}
            <Link to="/voting-process" className={navLinkClass('/voting-process')}>
              Proces de votare
            </Link>
          </div>

          {/* Desktop User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {user.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900">
                        {user.username}
                      </span>
                      {user.is_admin && (
                        <span className="text-xs text-purple-600 font-medium">
                          Administrator
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <Link
                  to="/profile"
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                >
                  Profil
                </Link>
                
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                >
                  Deconectare
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                >
                  Autentificare
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                >
                  Înregistrare
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors duration-200"
              aria-expanded="false"
            >
              <span className="sr-only">Deschide meniul principal</span>
              {!isMobileMenuOpen ? (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link 
              to="/" 
              className={mobileNavLinkClass('/')}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Acasă
            </Link>
            
            {user && (
              <Link 
                to="/polls" 
                className={mobileNavLinkClass('/polls')}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Sondaje
              </Link>
            )}
            
            {/* ✅ FIX: Sondaje securizate vizibile pentru toți utilizatorii autentificați în mobile */}
            {user && (
              <Link 
                to="/secure-polls" 
                className={mobileNavLinkClass('/secure-polls')}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Sondaje Securizate
              </Link>
            )}

            {/* Nou: Link către pagina Proces de votare în meniul mobil */}
            <Link 
              to="/voting-process" 
              className={mobileNavLinkClass('/voting-process')}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Proces de votare
            </Link>
          </div>
          
          <div className="pt-4 pb-3 border-t border-gray-200">
            {user ? (
              <div className="px-2 space-y-1">
                <div className="flex items-center px-3 py-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium">
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-gray-800">
                      {user.username}
                    </div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                    {user.is_admin && (
                      <div className="text-xs text-purple-600 font-medium">
                        Administrator
                      </div>
                    )}
                  </div>
                </div>
                
                <Link
                  to="/profile"
                  className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Profil
                </Link>
                
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-3 py-2 text-base font-medium text-red-600 hover:text-red-800 hover:bg-red-50 transition-colors duration-200"
                >
                  Deconectare
                </button>
              </div>
            ) : (
              <div className="px-2 space-y-1">
                <Link
                  to="/login"
                  className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Autentificare
                </Link>
                <Link
                  to="/register"
                  className="block px-3 py-2 text-base font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md mx-3 text-center transition-colors duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Înregistrare
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;