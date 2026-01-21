import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import miseventosLogoH from '../assets/miseventosH.png';

export const Header = () => {
  const { logout } = useAuth();

  return (
    <nav className="bg-gray-800 p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center">
          <img 
            src={miseventosLogoH} 
            alt="Mis Eventos" 
            className="h-10 w-auto" // Ajustado a h-10 para mejor visibilidad
          />
        </Link>
        <div className="space-x-6 flex items-center">
          <Link to="/" className="text-gray-300 hover:text-white transition-colors">
            Eventos
          </Link>
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
      </div>
    </nav>
  );
};
