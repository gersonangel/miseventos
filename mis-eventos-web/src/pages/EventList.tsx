import { useEvents } from '../hooks/useEvents';
import { EventCard } from '../components/EventCard';
import { Link } from 'react-router-dom';

export const EventList = () => {
  const { data: events, isLoading, error } = useEvents();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 text-red-600 bg-red-50 rounded-lg mx-4 mt-8">
        <p>Error al cargar los eventos. Por favor intenta nuevamente.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Eventos Disponibles</h1>
        <Link 
          to="/events/new"
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors shadow-sm"
        >
          Crear Evento
        </Link>
      </div>
      
      {events && events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map(event => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <p className="text-lg">No hay eventos disponibles en este momento.</p>
          <p className="text-sm mt-2">¡Sé el primero en crear uno!</p>
        </div>
      )}
    </div>
  );
};
