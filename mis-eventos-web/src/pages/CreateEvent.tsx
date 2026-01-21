import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useCreateEvent } from '../hooks/useEvents';

const eventSchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
  description: z.string().optional(),
  start_time: z.string().min(1, 'Fecha de inicio requerida'),
  end_time: z.string().min(1, 'Fecha de fin requerida'),
  location: z.string().optional(),
  capacity: z.coerce.number().min(1, 'La capacidad debe ser al menos 1'),
  status: z.enum(['draft', 'published', 'cancelled']).optional().default('draft'),
}).refine(data => new Date(data.end_time) > new Date(data.start_time), {
  message: "La fecha de fin debe ser posterior a la de inicio",
  path: ["end_time"],
});

type EventFormValues = z.infer<typeof eventSchema>;

export const CreateEvent = () => {
  const navigate = useNavigate();
  const createEventMutation = useCreateEvent();
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      status: 'draft',
      capacity: 100
    }
  });

  const onSubmit = (data: EventFormValues) => {
    createEventMutation.mutate(data, {
      onSuccess: () => {
        navigate('/');
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
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Inicio</label>
            <input
              type="datetime-local"
              {...register('start_time')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
            />
            {errors.start_time && <p className="mt-1 text-sm text-red-600">{errors.start_time.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Fin</label>
            <input
              type="datetime-local"
              {...register('end_time')}
              className={`mt-1 block w-full rounded-md border shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2 ${errors.end_time ? 'border-red-300' : 'border-gray-300'}`}
            />
            {errors.end_time && <p className="mt-1 text-sm text-red-600">{errors.end_time.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Ubicación</label>
            <input
              type="text"
              {...register('location')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Capacidad</label>
            <input
              type="number"
              {...register('capacity')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
            />
            {errors.capacity && <p className="mt-1 text-sm text-red-600">{errors.capacity.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Estado</label>
          <select
            {...register('status')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
          >
            <option value="draft">Borrador</option>
            <option value="published">Publicado</option>
            <option value="cancelled">Cancelado</option>
          </select>
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
