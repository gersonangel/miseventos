import { Link } from 'react-router-dom';
import { Event, EventStatus } from '../types/event';
import { Badge } from './ui/Badge';
import { formatDate } from '../utils/format';
import { STATUS_LABELS, TYPE_LABELS } from '../constants/event';

interface EventCardProps {
  event: Event;
}

export const EventCard = ({ event }: EventCardProps) => {
  const getStatusVariant = (status: EventStatus) => {
    switch (status) {
      case EventStatus.PUBLISHED: return 'success';
      case EventStatus.DRAFT: return 'gray';
      case EventStatus.CANCELLED: return 'danger';
      case EventStatus.FINISHED: return 'info';
      default: return 'gray';
    }
  };

  return (
    <div className="border rounded-lg shadow-sm hover:shadow-md transition-shadow bg-white flex flex-col h-full overflow-hidden">
      <div className="h-48 w-full bg-gray-200 relative">
        {event.image_mobile || event.image_desktop ? (
          <picture className="w-full h-full block">
            {event.image_mobile && (
              <source media="(max-width: 768px)" srcSet={event.image_mobile} />
            )}
            <img 
              src={event.image_desktop || event.image_mobile} 
              alt={event.title}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (!target.src.includes('via.placeholder.com')) {
                  target.src = 'https://via.placeholder.com/400x200?text=No+Image';
                }
              }}
            />
          </picture>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
          </div>
        )}
        <div className="absolute top-2 right-2">
          <Badge variant={getStatusVariant(event.status)}>
            {STATUS_LABELS[event.status]}
          </Badge>
        </div>
        <div className="absolute top-2 left-2">
           <Badge variant="info" className="bg-white/90 backdrop-blur-sm text-indigo-700">
            {TYPE_LABELS[event.event_type]}
          </Badge>
        </div>
      </div>
      
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-1">{event.title}</h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-1">{event.description}</p>
        
        <div className="space-y-2 text-sm text-gray-500 mb-4">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            <span>{formatDate(event.start_date)}</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
            <span className="truncate">{event.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
            <span>Cupos: {event.available_spots} / {event.max_capacity}</span>
          </div>
        </div>

        <Link 
          to={`/events/${event.id}`}
          className="block w-full text-center bg-indigo-50 text-indigo-600 py-2 rounded-md hover:bg-indigo-100 transition-colors font-medium"
        >
          Ver Detalles
        </Link>
      </div>
    </div>
  );
};
