import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { eventService } from '../services/eventService';
import { sessionService } from '../services/sessionService';
import { formatDate } from '../utils/format';
import { ConfirmationModal } from '../components/ui/ConfirmationModal';
import { BackButton } from '../components/ui/BackButton';
import { Select } from '../components/ui/Select';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { EventStatus } from '../types/event';
import { STATUS_LABELS } from '../constants/event';

import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';

export const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [registering, setRegistering] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  
  // States for cancellation
  const [canceling, setCanceling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<EventStatus | null>(null);
  
  // New state for response messages
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

  const { data: event, isLoading: eventLoading, error: eventError } = useQuery({
    queryKey: ['event', id],
    queryFn: () => eventService.getEvent(id!),
    enabled: !!id,
  });

  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['sessions', id],
    queryFn: () => sessionService.getEventSessions(id!),
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: (newStatus: EventStatus) => eventService.updateEvent(id!, { status: newStatus }),
    onSuccess: (updatedEvent) => {
      queryClient.setQueryData(['event', id], updatedEvent);
      queryClient.invalidateQueries({ queryKey: ['events'] }); // Also invalidate lists
    },
    onError: (error) => {
      console.error('Error updating status:', error);
      let errorMessage = 'Error al actualizar el estado';
      if (error instanceof AxiosError && error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }
      setResponseModal({
        isOpen: true,
        title: 'Error',
        message: errorMessage,
        isError: true
      });
    },
    onSettled: () => {
      setUpdatingStatus(false);
      setShowStatusModal(false);
      setPendingStatus(null);
    }
  });

  const handleStatusChange = (value: string) => {
    if (!event) return;
    const newStatus = value as EventStatus;
    setPendingStatus(newStatus);
    setShowStatusModal(true);
  };

  const confirmStatusChange = () => {
    if (pendingStatus) {
      setUpdatingStatus(true);
      updateStatusMutation.mutate(pendingStatus);
    }
  };

  const cancelStatusChange = () => {
    setShowStatusModal(false);
    setPendingStatus(null);
  };

  const handleRegisterClick = () => {
    setShowRegisterModal(true);
  };

  const handleCancelClick = () => {
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async () => {
    if (!event) return;
    setCanceling(true);
    try {
      await eventService.cancelRegistration(event.id);
      
      // Invalidate queries to update available spots immediately
      await queryClient.invalidateQueries({ queryKey: ['events'] });
      await queryClient.invalidateQueries({ queryKey: ['event', event.id] });

      setShowCancelModal(false);
      setResponseModal({
        isOpen: true,
        title: 'Inscripción Cancelada',
        message: 'Te has retirado del evento correctamente.',
        isError: false
      });
    } catch (err: unknown) {
      setShowCancelModal(false);
      let errorMessage = 'Ocurrió un error inesperado';
      
      if (err instanceof AxiosError && err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setResponseModal({
        isOpen: true,
        title: 'Error de Cancelación',
        message: errorMessage,
        isError: true
      });
    } finally {
      setCanceling(false);
    }
  };

  const handleConfirmRegister = async () => {
    if (!event) return;
    setRegistering(true);
    try {
      await eventService.registerForEvent(event.id);
      
      // Invalidate queries to update available spots immediately
      await queryClient.invalidateQueries({ queryKey: ['events'] });
      await queryClient.invalidateQueries({ queryKey: ['event', event.id] });

      setShowRegisterModal(false);
      setResponseModal({
        isOpen: true,
        title: 'Inscripción Exitosa',
        message: 'Te has inscrito al evento correctamente.',
        isError: false,
        onClose: () => navigate('/my-events')
      });
    } catch (err: unknown) {
      setShowRegisterModal(false);
      let errorMessage = 'Ocurrió un error inesperado';
      
      if (err instanceof AxiosError && err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setResponseModal({
        isOpen: true,
        title: 'Error de Inscripción',
        message: errorMessage,
        isError: true
      });
    } finally {
      setRegistering(false);
    }
  };

  if (eventLoading) return (
    <div className="flex justify-center items-center py-12">
      <Spinner size="lg" />
    </div>
  );
  if (eventError || !event) return <div className="text-red-500">Evento no encontrado</div>;

  return (
    <div className="container mx-auto px-4 py-8">


      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="h-64 w-full bg-gray-200 relative">
          {event.image_mobile || event.image_desktop ? (
            <picture className="w-full h-full block">
              {event.image_mobile && (
                <source media="(max-width: 768px)" srcSet={event.image_mobile} />
              )}
              <img
                src={event.image_desktop || event.image_mobile}
                alt={event.title}
                className="w-full h-full object-cover"
              />
            </picture>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
            </div>
          )}
        </div>

        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <BackButton to={location.pathname.startsWith('/my-events') ? "/my-events" : "/events"}/>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{event.title}</h1>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">{event.location}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {user?.role === UserRole.ADMIN && (
              <div className="w-48">
                <Select
                  value={event.status}
                  onChange={handleStatusChange}
                  disabled={updatingStatus}
                  options={Object.values(EventStatus).map((status) => ({
                    value: status,
                    label: STATUS_LABELS[status]
                  }))}
                />
              </div>
            )}
            {location.pathname.startsWith('/my-events') && event.is_registered ? (
              <button
                onClick={handleCancelClick}
                disabled={canceling}
                className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {canceling ? 'Retirándose...' : 'Retirarse'}
              </button>
            ) : (
              <button
                onClick={handleRegisterClick}
                disabled={registering || event.status !== EventStatus.PUBLISHED || event.available_spots <= 0}
                className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {event.available_spots <= 0 ? 'Agotado' : (registering ? 'Inscribiendo...' : 'Inscribirse')}
              </button>
            )}
          </div>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Descripción</dt>
              <dd className="mt-1 text-sm text-gray-900">{event.description}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Inicio
              </dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDate(event.start_date)}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Fin
              </dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDate(event.end_date)}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Capacidad
              </dt>
              <dd className="mt-1 text-sm text-gray-900">{event.max_capacity} personas</dd>
            </div>
            {location.pathname.startsWith('/my-events') && (
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Estado de Inscripción
                </dt>
                <dd className="mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    event.is_registered 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {event.is_registered ? 'Registrado' : 'Sin registrar'}
                  </span>
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-4">Sesiones</h2>
      {sessionsLoading ? (
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="grid gap-4">
          {sessions?.map(session => (
            <div key={session.id} className="border rounded-lg p-4 bg-white shadow-sm">
              <h3 className="text-lg font-semibold">{session.title}</h3>
              <p className="text-gray-600">{session.description}</p>
              <p className="text-sm text-gray-500 mt-2">
                {new Date(session.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: true})} - {new Date(session.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: true})}
              </p>
              {session.speakers && session.speakers.length > 0 && (
                <div className="mt-4 border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Ponentes</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {session.speakers.map(speaker => (
                      <div key={speaker.id} className="flex items-start space-x-3">
                        <img
                          className="h-10 w-10 rounded-full object-cover border border-gray-200"
                          src={speaker.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(speaker.full_name)}&background=random`}
                          alt={speaker.full_name}
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{speaker.full_name}</p>
                          {(speaker.position || speaker.organization) && (
                            <p className="text-xs text-gray-500">
                              {[speaker.position, speaker.organization].filter(Boolean).join(' en ')}
                            </p>
                          )}
                          {speaker.biography && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2" title={speaker.biography}>
                              {speaker.biography}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          {(!sessions || sessions.length === 0) && <p className="text-gray-500">No hay sesiones programadas.</p>}
        </div>
      )}
      
      <ConfirmationModal
        isOpen={showStatusModal}
        onClose={cancelStatusChange}
        onConfirm={confirmStatusChange}
        title="Cambiar Estado del Evento"
        message={
          <span>
            ¿Estás seguro de que deseas cambiar el estado del evento a <strong>{pendingStatus ? STATUS_LABELS[pendingStatus] : ''}</strong>?
          </span>
        }
        confirmText="Confirmar"
        cancelText="Cancelar"
        variant={pendingStatus === EventStatus.CANCELLED ? 'danger' : 'primary'}
        isLoading={updatingStatus}
      />

      <ConfirmationModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onConfirm={handleConfirmRegister}
        title="Confirmar inscripción"
        message={`¿Estás seguro que deseas inscribirte al evento "${event.title}"?`}
        confirmText="Confirmar Inscripción"
        cancelText="Cancelar"
        variant="primary"
        isLoading={registering}
      />

      <ConfirmationModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleConfirmCancel}
        title="Confirmar Retiro"
        message={`¿Estás seguro que deseas retirarte del evento "${event.title}"?`}
        confirmText="Confirmar Retiro"
        cancelText="Cancelar"
        variant="danger"
        isLoading={canceling}
      />

      {/* Generic Response Modal */}
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
