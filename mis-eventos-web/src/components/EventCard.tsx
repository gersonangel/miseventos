import { Link } from 'react-router-dom';
import { Event } from '../types/event';

interface EventCardProps {
  event: Event;
}

export const EventCard = ({ event }: EventCardProps) => {
  return (
    <div className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow bg-white flex flex-col h-full">
      <div className="flex-1">
        <h3 className="text-xl font-semibold text-gray-800">{event.title}</h3>
        <p className="text-gray-600 mt-2 line-clamp-2">{event.description}</p>
        <div className="mt-4 flex justify-between text-sm text-gray-500">
          <span>{new Date(event.start_time).toLocaleDateString()}</span>
          <span>{event.location}</span>
        </div>
        <div className="mt-2 text-sm">
          <span className={`px-2 py-1 rounded-full ${
            event.status === 'published' ? 'bg-green-100 text-green-800' :
            event.status === 'draft' ? 'bg-gray-100 text-gray-800' :
            'bg-red-100 text-red-800'
          }`}>
            {event.status}
          </span>
        </div>
      </div>
      <Link 
        to={`/events/${event.id}`}
        className="mt-4 block w-full text-center bg-indigo-50 text-indigo-600 py-2 rounded-md hover:bg-indigo-100"
      >
        Ver Detalles
      </Link>
    </div>
  );
};
