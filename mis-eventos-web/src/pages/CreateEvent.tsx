import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useCreateEvent } from '../hooks/useEvents';
import { EventStatus, EventType } from '../types/event';

const eventSchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
  start_date: z.string().min(1, 'Fecha de inicio requerida'),
  end_date: z.string().min(1, 'Fecha de fin requerida'),
  location: z.string().min(3, 'La ubicación es requerida'),
  max_capacity: z.coerce.number().min(1, 'La capacidad debe ser al menos 1'),
  event_type: z.nativeEnum(EventType, { errorMap: () => ({ message: 'Selecciona un tipo de evento válido' }) }),
  status: z.nativeEnum(EventStatus).optional().default(EventStatus.DRAFT),
}).refine(data => new Date(data.end_date) > new Date(data.start_date), {
  message: "La fecha de fin debe ser posterior a la de inicio",
  path: ["end_date"],
});

type EventFormValues = z.infer<typeof eventSchema>;

export const CreateEvent = () => {
  const navigate = useNavigate();
  const createEventMutation = useCreateEvent();
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      status: EventStatus.DRAFT,
      max_capacity: 100,
      event_type: EventType.CONFERENCE
    }
  });

  const onSubmit = (data: EventFormValues) => {
    createEventMutation.mutate(data, {
      onSuccess: () => {
        navigate('/events');
      },
      onError: (error) => {
        console.error('Error creating event:', error);
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Crear Nuevo Evento</h1>
      
      {createEventMutation.isError && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
          Ocurrió un error al crear el evento. Por favor intenta nuevamente.
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div>
          <label className="block text-sm font-medium text-gray-700">Título</label>
          <input
            type="text"
            {...register('title')}
            className={`mt-1 block w-full rounded-md border shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 ${errors.title ? 'border-red-300' : 'border-gray-300'}`}
          />
          {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Descripción</label>
          <textarea
            {...register('description')}
            rows={4}
            className={`mt-1 block w-full rounded-md border shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 ${errors.description ? 'border-red-300' : 'border-gray-300'}`}
          />
          {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Inicio</label>
            <input
              type="datetime-local"
              {...register('start_date')}
              className={`mt-1 block w-full rounded-md border shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 ${errors.start_date ? 'border-red-300' : 'border-gray-300'}`}
            />
            {errors.start_date && <p className="mt-1 text-sm text-red-600">{errors.start_date.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Fin</label>
            <input
              type="datetime-local"
              {...register('end_date')}
              className={`mt-1 block w-full rounded-md border shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 ${errors.end_date ? 'border-red-300' : 'border-gray-300'}`}
            />
            {errors.end_date && <p className="mt-1 text-sm text-red-600">{errors.end_date.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Ubicación</label>
            <input
              type="text"
              {...register('location')}
              className={`mt-1 block w-full rounded-md border shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 ${errors.location ? 'border-red-300' : 'border-gray-300'}`}
            />
            {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Capacidad Máxima</label>
            <input
              type="number"
              {...register('max_capacity')}
              className={`mt-1 block w-full rounded-md border shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 ${errors.max_capacity ? 'border-red-300' : 'border-gray-300'}`}
            />
            {errors.max_capacity && <p className="mt-1 text-sm text-red-600">{errors.max_capacity.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Tipo de Evento</label>
            <select
              {...register('event_type')}
              className={`mt-1 block w-full rounded-md border shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 ${errors.event_type ? 'border-red-300' : 'border-gray-300'}`}
            >
              <option value={EventType.CONFERENCE}>Conferencia</option>
              <option value={EventType.WORKSHOP}>Taller</option>
              <option value={EventType.SEMINAR}>Seminario</option>
              <option value={EventType.NETWORKING}>Networking</option>
              <option value={EventType.OTHER}>Otro</option>
            </select>
            {errors.event_type && <p className="mt-1 text-sm text-red-600">{errors.event_type.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Estado</label>
            <select
              {...register('status')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
            >
              <option value={EventStatus.DRAFT}>Borrador</option>
              <option value={EventStatus.PUBLISHED}>Publicado</option>
              <option value={EventStatus.CANCELLED}>Cancelado</option>
            </select>
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting || createEventMutation.isPending}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
          >
            {createEventMutation.isPending ? 'Creando...' : 'Crear Evento'}
          </button>
        </div>
      </form>
    </div>
  );
};
