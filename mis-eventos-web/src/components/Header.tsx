import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import miseventosLogoH from '../assets/miseventosH.png';

export const Header = () => {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isAdmin = user?.role === UserRole.ADMIN || user?.is_superuser;
  const isOrganizer = user?.role === UserRole.ORGANIZER || isAdmin;

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <nav className="bg-gray-800 p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center">
          <img 
            src={miseventosLogoH} 
            alt="Mis Eventos" 
            className="h-10 w-auto" 
          />
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex space-x-6 items-center">
          {isOrganizer && (
            <>
              <Link to="/events" className="text-gray-300 hover:text-white transition-colors">
                Eventos
              </Link>
              <Link to="/users" className="text-gray-300 hover:text-white transition-colors">
                Usuarios
              </Link>
              <Link to="/sessions" className="text-gray-300 hover:text-white transition-colors">
                Sesiones
              </Link>
            </>
          )}
          <Link to="/my-events" className="text-gray-300 hover:text-white transition-colors">
            Mis Inscripciones
          </Link>
          <button 
            onClick={logout} 
            className="text-gray-300 hover:text-white transition-colors bg-transparent border border-gray-600 hover:border-white px-3 py-1 rounded"
          >
            Cerrar Sesión
          </button>
        </div>

        {/* Hamburger Button */}
        <div className="md:hidden flex items-center">
          <button 
            onClick={toggleMenu}
            className="text-gray-300 hover:text-white focus:outline-none"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden mt-4 pb-4 space-y-2">
          {isOrganizer && (
            <>
              <Link 
                to="/events" 
                className="block text-gray-300 hover:text-white hover:bg-gray-700 px-3 py-2 rounded-md transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Eventos
              </Link>
              <Link 
                to="/users" 
                className="block text-gray-300 hover:text-white hover:bg-gray-700 px-3 py-2 rounded-md transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Usuarios
              </Link>
              <Link 
                to="/sessions" 
                className="block text-gray-300 hover:text-white hover:bg-gray-700 px-3 py-2 rounded-md transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Sesiones
              </Link>
            </>
          )}
          <Link 
            to="/my-events" 
            className="block text-gray-300 hover:text-white hover:bg-gray-700 px-3 py-2 rounded-md transition-colors"
            onClick={() => setIsMenuOpen(false)}
          >
            Mis Inscripciones
          </Link>
          <button 
            onClick={() => {
              logout();
              setIsMenuOpen(false);
            }} 
            className="w-full text-left block text-gray-300 hover:text-white hover:bg-gray-700 px-3 py-2 rounded-md transition-colors"
          >
            Cerrar Sesión
          </button>
        </div>
      )}
    </nav>
  );
};
