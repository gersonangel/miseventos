import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Event } from '../types/event';
import { Session } from '../types/models';
import { sessionService } from '../services/sessionService';
import { registrationService } from '../services/registrationService';

export const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token && id) {
          // Since getById is not in service yet, let's filter or fix service. 
          // Note: In real implementation, add getById to service.
          // Using fetch directly for now to save a step or fix service later.
          const res = await fetch(`http://localhost:8000/events/${id}`, {
             headers: { 'Authorization': `Bearer ${token}` }
          });
          if(res.ok) {
              const evt = await res.json();
              setEvent(evt);
              const sess = await sessionService.getEventSessions(parseInt(id), token);
              setSessions(sess);
          } else {
              setError('Evento no encontrado');
          }
        }
      } catch {
        setError('Error al cargar detalles');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleRegister = async () => {
    if (!event) return;
    setRegistering(true);
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await registrationService.registerForEvent(event.id, token);
        alert('¡Inscripción exitosa!');
        navigate('/my-events');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert('Ocurrió un error inesperado');
      }
    } finally {
      setRegistering(false);
    }
  };

  if (loading) return <div>Cargando...</div>;
  if (error || !event) return <div className="text-red-500">{error || 'Evento no encontrado'}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{event.title}</h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">{event.location}</p>
          </div>
          <button
            onClick={handleRegister}
            disabled={registering}
            className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {registering ? 'Inscribiendo...' : 'Inscribirse'}
          </button>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Descripción</dt>
              <dd className="mt-1 text-sm text-gray-900">{event.description}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Inicio</dt>
              <dd className="mt-1 text-sm text-gray-900">{new Date(event.start_time).toLocaleString()}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Fin</dt>
              <dd className="mt-1 text-sm text-gray-900">{new Date(event.end_time).toLocaleString()}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Capacidad</dt>
              <dd className="mt-1 text-sm text-gray-900">{event.capacity} personas</dd>
            </div>
          </dl>
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-4">Sesiones</h2>
      <div className="grid gap-4">
        {sessions.map(session => (
          <div key={session.id} className="border rounded-lg p-4 bg-white shadow-sm">
            <h3 className="text-lg font-semibold">{session.title}</h3>
            <p className="text-gray-600">{session.description}</p>
            <p className="text-sm text-gray-500 mt-2">
              {new Date(session.start_time).toLocaleTimeString()} - {new Date(session.end_time).toLocaleTimeString()}
            </p>
            {session.speaker_name && (
              <p className="text-sm font-medium text-indigo-600 mt-1">Ponente: {session.speaker_name}</p>
            )}
          </div>
        ))}
        {sessions.length === 0 && <p className="text-gray-500">No hay sesiones programadas.</p>}
      </div>
    </div>
  );
};
