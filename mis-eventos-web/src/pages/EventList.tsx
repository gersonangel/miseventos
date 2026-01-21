import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useEvents } from '../hooks/useEvents';
import { EventCard } from '../components/EventCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Pagination } from '../components/ui/Pagination';
import { EventStatus, EventType } from '../types/event';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { BackButton } from '../components/ui/BackButton';
import { STATUS_LABELS, TYPE_LABELS } from '../constants/event';

export const EventList = () => {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(() => {
    const saved = localStorage.getItem('eventsPageSize');
    return saved ? Number(saved) : 6;
  });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<EventStatus | ''>('');
  const [eventType, setEventType] = useState<EventType | ''>('');

  // Debounce search could be added here for optimization
  const { data, isLoading, error } = useEvents({
    page,
    size: pageSize,
    search: search || undefined,
    status: status || undefined,
    event_type: eventType || undefined,
  });

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    localStorage.setItem('eventsPageSize', size.toString());
  };

  const statusOptions = [
    { value: '', label: 'Todos los estados' },
    ...Object.values(EventStatus).map(status => ({
      value: status,
      label: STATUS_LABELS[status]
    }))
  ];

  const typeOptions = [
    { value: '', label: 'Todos los tipos' },
    ...Object.values(EventType).map(type => ({
      value: type,
      label: TYPE_LABELS[type]
    }))
  ];

  const canCreateEvent = user?.role === UserRole.ADMIN || user?.role === UserRole.ORGANIZER;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div className="flex items-center gap-3">
          <BackButton to="/" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Eventos</h1>
            <p className="text-gray-500 mt-1">Explora y gestiona los próximos eventos</p>
          </div>
        </div>
        {canCreateEvent && (
          <Link to="/events/new">
            <Button>Crear Evento</Button>
          </Link>
        )}
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm mb-6 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Buscar eventos..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <Select
            options={statusOptions}
            value={status}
            onChange={(val) => {
              setStatus(val as EventStatus);
              setPage(1);
            }}
          />
          <Select
            options={typeOptions}
            value={eventType}
            onChange={(val) => {
              setEventType(val as EventType);
              setPage(1);
            }}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : error ? (
        <div className="text-center p-8 text-red-600 bg-red-50 rounded-lg border border-red-100">
          <p>Error al cargar los eventos. Por favor intenta nuevamente.</p>
        </div>
      ) : (
        <>
          {data?.items && data.items.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {data.items.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No se encontraron eventos</h3>
              <p className="mt-1 text-sm text-gray-500">Prueba ajustando los filtros de búsqueda.</p>
            </div>
          )}

          {data && data.total > 0 && (
            <Pagination
              currentPage={page}
              totalPages={Math.ceil(data.total / pageSize)}
              onPageChange={setPage}
              pageSize={pageSize}
              onPageSizeChange={handlePageSizeChange}
              totalItems={data.total}
              pageSizeOptions={[6, 12, 24, 48]}
            />
          )}
        </>
      )}
    </div>
  );
};
