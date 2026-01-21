import { useEffect, useState } from 'react';
import { Event } from '../types/event';
import { registrationService } from '../services/registrationService';
import { EventCard } from '../components/EventCard';

export const MyRegistrations = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const data = await registrationService.getMyRegistrations(token);
          setEvents(data);
        }
      } catch (err) {
        setError('Error al cargar inscripciones');
      } finally {
        setLoading(false);
      }
    };

    fetchRegistrations();
  }, []);

  if (loading) return <div>Cargando...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Mis Inscripciones</h1>
      
      {events.length === 0 ? (
        <p className="text-gray-500">No te has inscrito a ningún evento aún.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map(event => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
};
