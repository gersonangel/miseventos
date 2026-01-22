import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { useCreateEvent } from '../hooks/useEvents';
import { eventService } from '../services/eventService';
import { EventStatus, EventType } from '../types/event';
import { TYPE_LABELS } from '../constants/event';
import { Select } from '../components/ui/Select';
import { BackButton } from '../components/ui/BackButton';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';

const eventSchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
  start_date: z.string().min(1, 'Fecha de inicio requerida'),
  end_date: z.string().min(1, 'Fecha de fin requerida'),
  location: z.string().min(3, 'La ubicación es requerida'),
  max_capacity: z.coerce.number().min(1, 'La capacidad debe ser al menos 1'),
  event_type: z.nativeEnum(EventType, { errorMap: () => ({ message: 'Selecciona un tipo de evento válido' }) }),
  status: z.nativeEnum(EventStatus).optional().default(EventStatus.DRAFT),
  image_desktop: z.string().url('URL de imagen de escritorio requerida'),
  image_mobile: z.string().url('URL de imagen móvil requerida'),
}).refine(data => new Date(data.end_date) > new Date(data.start_date), {
  message: "La fecha de fin debe ser posterior a la de inicio",
  path: ["end_date"],
});

type EventFormValues = z.infer<typeof eventSchema>;

export const CreateEvent = () => {
  const navigate = useNavigate();
  const createEventMutation = useCreateEvent();
  const [uploadingDesktop, setUploadingDesktop] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);
  const [responseModal, setResponseModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    isError?: boolean;
    onClose?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    isError: false,
  });

  const closeResponseModal = () => {
    setResponseModal(prev => ({ ...prev, isOpen: false }));
    if (responseModal.onClose) {
      responseModal.onClose();
    }
  };
  
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      status: EventStatus.DRAFT,
      max_capacity: 100,
      event_type: EventType.CONFERENCE,
      image_desktop: '',
      image_mobile: ''
    }
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'image_desktop' | 'image_mobile') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (field === 'image_desktop') setUploadingDesktop(true);
      else setUploadingMobile(true);

      const url = await eventService.uploadImage(file);
      setValue(field, url, { shouldValidate: true });
    } catch (error) {
      console.error('Error uploading image:', error);
      setResponseModal({
        isOpen: true,
        title: 'Error de carga',
        message: 'Error al subir la imagen. Por favor intenta nuevamente.',
        isError: true
      });
    } finally {
      if (field === 'image_desktop') setUploadingDesktop(false);
      else setUploadingMobile(false);
    }
  };

  const onSubmit = (data: EventFormValues) => {
    const formattedData = {
      ...data,
      start_date: new Date(data.start_date).toISOString(),
      end_date: new Date(data.end_date).toISOString(),
    };

    createEventMutation.mutate(formattedData, {
      onSuccess: () => {
        setResponseModal({
          isOpen: true,
          title: 'Evento Creado',
          message: 'El evento se ha creado exitosamente.',
          isError: false,
          onClose: () => navigate('/events')
        });
      },
      onError: (error) => {
        console.error('Error creating event:', error);
        let errorMessage = 'Ocurrió un error al crear el evento.';
        if (error instanceof AxiosError && error.response?.data?.detail) {
          errorMessage = error.response.data.detail;
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }
        
        setResponseModal({
          isOpen: true,
          title: 'Error de Creación',
          message: errorMessage,
          isError: true
        });
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <BackButton to="/events" />
        <h1 className="text-3xl font-bold text-gray-900">Crear Nuevo Evento</h1>
      </div>
      
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
            <label className="block text-sm font-medium text-gray-700">Imagen Desktop</label>
            <div className="mt-1 flex items-center space-x-4">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'image_desktop')}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                disabled={uploadingDesktop}
              />
              {uploadingDesktop && <span className="text-sm text-gray-500">Subiendo...</span>}
            </div>
            {watch('image_desktop') && (
              <div className="mt-2">
                <img src={watch('image_desktop')} alt="Preview Desktop" className="h-20 w-auto object-cover rounded" />
              </div>
            )}
            <input type="hidden" {...register('image_desktop')} />
            {errors.image_desktop && <p className="mt-1 text-sm text-red-600">{errors.image_desktop.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Imagen Mobile</label>
            <div className="mt-1 flex items-center space-x-4">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'image_mobile')}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                disabled={uploadingMobile}
              />
              {uploadingMobile && <span className="text-sm text-gray-500">Subiendo...</span>}
            </div>
            {watch('image_mobile') && (
              <div className="mt-2">
                <img src={watch('image_mobile')} alt="Preview Mobile" className="h-20 w-auto object-cover rounded" />
              </div>
            )}
            <input type="hidden" {...register('image_mobile')} />
            {errors.image_mobile && <p className="mt-1 text-sm text-red-600">{errors.image_mobile.message}</p>}
          </div>
        </div>

        <div>
          <Select
            label="Tipo de Evento"
            value={watch('event_type')}
            onChange={(val) => setValue('event_type', val as EventType, { shouldValidate: true })}
            options={Object.values(EventType).map((type) => ({
              value: type,
              label: TYPE_LABELS[type]
            }))}
            error={errors.event_type?.message}
          />
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

      <Modal
        isOpen={responseModal.isOpen}
        onClose={closeResponseModal}
        title={responseModal.title}
        footer={
          <div className="flex justify-end">
            <Button onClick={closeResponseModal} variant={responseModal.isError ? 'danger' : 'primary'}>
              Cerrar
            </Button>
          </div>
        }
      >
        <p className={`text-sm ${responseModal.isError ? 'text-red-600' : 'text-gray-600'}`}>
          {responseModal.message}
        </p>
      </Modal>
    </div>
  );
};
