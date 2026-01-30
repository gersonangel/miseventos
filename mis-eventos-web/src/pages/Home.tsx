import { useAuth } from '../context/AuthContext';
import { DashboardCard } from '../components/DashboardCard';
import { UserRole } from '../types';

export const Home = () => {
  const { user } = useAuth();

  const isAdmin = user?.role === UserRole.ADMIN || user?.is_superuser; // Fallback to superuser if role not set
  const isOrganizer = user?.role === UserRole.ORGANIZER || isAdmin;
  const isSpeaker = user?.role === UserRole.SPEAKER || isAdmin;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Bienvenido, {user?.full_name || user?.email}</h1>
        <p className="mt-2 text-gray-600">Selecciona una opción para comenzar a gestionar tus eventos.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Gestión de Usuarios - Solo Admin */}
        {isAdmin && (
          <DashboardCard
            title="Gestión de Usuarios"
            description="Administra los usuarios del sistema, asigna roles y gestiona permisos."
            to="/users"
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
              </svg>
            }
          />
        )}

        {/* Gestión de Eventos - Admin y Organizador */}
        {isOrganizer && (
          <DashboardCard
            title="Gestión de Eventos"
            description="Crea, edita y publica eventos. Gestiona la información general y ubicaciones."
            to="/events"
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
            }
          />
        )}

        {/* Gestión de Sesiones - Admin, Organizador y Speaker (para ver sus sesiones) */}
        {(isOrganizer || isSpeaker) && (
          <DashboardCard
            title="Gestión de Sesiones"
            description="Configura la agenda, asigna ponentes y administra las sesiones de los eventos."
            to="/sessions" // Placeholder route
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            }
          />
        )}

        {/* Mis Inscripciones - Todos */}
        <DashboardCard
          title="Mis Inscripciones"
          description="Consulta los eventos a los que te has registrado y gestiona tu asistencia."
          to="/my-events"
          icon={
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"></path>
            </svg>
          }
        />
      </div>
    </div>
  );
};
