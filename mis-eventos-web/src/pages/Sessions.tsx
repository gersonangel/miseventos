import React, { useState } from 'react';
import { useEvents } from '../hooks/useEvents';
import { useEventSessions, useCreateSession, useUpdateSession, useDeleteSession, useAssignSpeakers } from '../hooks/useSessions';
import { useUsers } from '../hooks/useUsers';
import { Session, SessionCreate, SessionUpdate } from '../types/session';
import { UserRole } from '../types';
import { EventStatus } from '../types/event';
import { Table, Column } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { ConfirmationModal } from '../components/ui/ConfirmationModal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { BackButton } from '../components/ui/BackButton';
//import { useAuth } from '../context/AuthContext';

export const Sessions = () => {
  //const { toast } = useToast();
  // const { user: currentUser } = useAuth(); // No se usa actualmente
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSpeakersModalOpen, setIsSpeakersModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);
  const [sessionToAssign, setSessionToAssign] = useState<Session | null>(null);
  const [selectedSpeakers, setSelectedSpeakers] = useState<string[]>([]);
  const [error, setError] = useState('');

  // Forms state
  const [formData, setFormData] = useState<Partial<SessionCreate>>({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    location: '',
    capacity: 0
  });

  // Queries
  const { data: eventsData } = useEvents({ size: 100 }); // Get events for selector
  const { data: sessions, isLoading: sessionsLoading } = useEventSessions(selectedEventId);
  const { data: speakersData } = useUsers(1, 100, UserRole.SPEAKER); // Get speakers for assignment

  // Mutations
  const createSessionMutation = useCreateSession();
  const updateSessionMutation = useUpdateSession();
  const deleteSessionMutation = useDeleteSession();
  const assignSpeakersMutation = useAssignSpeakers();

  const handleCreate = () => {
    setError('');
    setEditingSession(null);
    setFormData({
      title: '',
      description: '',
      start_time: '',
      end_time: '',
      location: '',
      capacity: 50
    });
    setIsModalOpen(true);
  };

  const handleEdit = (session: Session) => {
    setError('');
    setEditingSession(session);
    setFormData({
      title: session.title,
      description: session.description || '',
      start_time: session.start_time.slice(0, 16), // Format for datetime-local
      end_time: session.end_time.slice(0, 16),
      location: session.location,
      capacity: session.capacity
    });
    setIsModalOpen(true);
  };

  const handleDelete = (session: Session) => {
    setSessionToDelete(session);
    setIsDeleteModalOpen(true);
  };

  const handleAssignSpeakers = (session: Session) => {
    setSessionToAssign(session);
    setSelectedSpeakers(session.speakers?.map(s => s.id) || []);
    setIsSpeakersModalOpen(true);
  };

  const confirmDelete = async () => {
    if (sessionToDelete) {
      await deleteSessionMutation.mutateAsync(sessionToDelete.id);
      setIsDeleteModalOpen(false);
      setSessionToDelete(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedEventId) {
      setError('Debes seleccionar un evento');
      return;
    }

    try {
      const dataToSubmit = {
        title: formData.title!,
        description: formData.description,
        start_time: new Date(formData.start_time!).toISOString(),
        end_time: new Date(formData.end_time!).toISOString(),
        location: formData.location!,
        capacity: Number(formData.capacity)
      };

      if (editingSession) {
        await updateSessionMutation.mutateAsync({
          id: editingSession.id,
          session: dataToSubmit as SessionUpdate
        });
      } else {
        await createSessionMutation.mutateAsync({
          eventId: selectedEventId,
          session: dataToSubmit as SessionCreate
        });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Error al guardar la sesión. Verifica los datos.');
    }
  };

  const handleSpeakersSubmit = async () => {
    if (sessionToAssign) {
      try {
        await assignSpeakersMutation.mutateAsync({
          id: sessionToAssign.id,
          speakerIds: selectedSpeakers
        });
        setIsSpeakersModalOpen(false);
        setSessionToAssign(null);
      } catch (err: any) {
        console.error(err);
        setError(err.response?.data?.detail || 'Error al asignar ponentes');
      }
    }
  };

  const columns: Column<Session>[] = [
    {
      header: 'Título',
      accessor: 'title',
    },
    {
      header: 'Horario',
      accessor: (session) => (
        <div className="text-sm">
          <div>{new Date(session.start_time).toLocaleString()}</div>
          <div className="text-gray-500">a {new Date(session.end_time).toLocaleTimeString()}</div>
        </div>
      ),
    },
    {
      header: 'Ubicación',
      accessor: 'location',
    },
    {
      header: 'Capacidad',
      accessor: 'capacity',
    },
    {
      header: 'Ponentes',
      accessor: (session) => (
        <div className="flex -space-x-2 overflow-hidden">
          {session.speakers?.length ? (
            session.speakers.map((speaker) => (
              <img
                key={speaker.id}
                className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover"
                src={speaker.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(speaker.full_name)}&background=random`}
                alt={speaker.full_name}
                title={speaker.full_name}
              />
            ))
          ) : (
            <span className="text-gray-400 text-xs italic">Sin ponentes</span>
          )}
        </div>
      ),
    },
    {
      header: 'Acciones',
      accessor: (session) => (
        <div className="flex space-x-2 justify-end">
          <Button variant="secondary" size="sm" onClick={() => handleAssignSpeakers(session)}>
            Ponentes
          </Button>
          <Button variant="secondary" size="sm" onClick={() => handleEdit(session)}>
            Editar
          </Button>
          <Button variant="danger" size="sm" onClick={() => handleDelete(session)}>
            Eliminar
          </Button>
        </div>
      ),
      className: 'text-right'
    },
  ];

  const eventOptions = eventsData?.items
    .filter(event => event.status === EventStatus.DRAFT || event.status === EventStatus.PUBLISHED)
    .map(event => ({
      value: event.id,
      label: event.title
    })) || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <BackButton to="/" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Sesiones</h1>
            <p className="text-sm text-gray-500 mt-1">Administra las sesiones de tus eventos</p>
          </div>
        </div>
        
        <div className="w-full sm:w-96">
          <Select
            label="Seleccionar Evento"
            options={eventOptions}
            value={selectedEventId}
            onChange={setSelectedEventId}
            placeholder="Selecciona un evento..."
          />
        </div>
      </div>

      {selectedEventId ? (
        <>
          <div className="flex justify-end mb-4">
            <Button onClick={handleCreate}>
              Nueva Sesión
            </Button>
          </div>

          <Table
            columns={columns}
            data={sessions || []}
            keyExtractor={(s) => s.id}
            isLoading={sessionsLoading}
            emptyMessage="No hay sesiones creadas para este evento."
          />
        </>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
          <h3 className="mt-2 text-sm font-medium text-gray-900">No has seleccionado un evento</h3>
          <p className="mt-1 text-sm text-gray-500">Selecciona un evento del listado superior para ver y gestionar sus sesiones.</p>
        </div>
      )}

      {/* Modal Crear/Editar */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSession ? 'Editar Sesión' : 'Nueva Sesión'}
        footer={
          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit} 
              isLoading={createSessionMutation.isPending || updateSessionMutation.isPending}
            >
              Guardar
            </Button>
          </div>
        }
      >
        <form className="space-y-4">
          <Input
            label="Título"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            required
          />
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-1 gap-4">
            <Input
              label="Inicio"
              type="datetime-local"
              value={formData.start_time}
              onChange={(e) => setFormData({...formData, start_time: e.target.value})}
              required
            />
            <Input
              label="Fin"
              type="datetime-local"
              value={formData.end_time}
              onChange={(e) => setFormData({...formData, end_time: e.target.value})}
              required
            />
          </div>
          <Input
            label="Ubicación"
            value={formData.location}
            onChange={(e) => setFormData({...formData, location: e.target.value})}
            required
          />
          <Input
            label="Capacidad"
            type="number"
            value={formData.capacity}
            onChange={(e) => setFormData({...formData, capacity: Number(e.target.value)})}
            required
          />
          <div className="min-h-[20px] text-red-500 text-sm font-semibold">
            {error}
          </div>
        </form>
      </Modal>

      {/* Modal Ponentes */}
      <Modal
        isOpen={isSpeakersModalOpen}
        onClose={() => setIsSpeakersModalOpen(false)}
        title="Asignar Ponentes"
        footer={
          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={() => setIsSpeakersModalOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSpeakersSubmit} 
              isLoading={assignSpeakersMutation.isPending}
            >
              Guardar Cambios
            </Button>
          </div>
        }
      >
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {speakersData?.items.map(speaker => (
            <div key={speaker.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
              <input
                type="checkbox"
                id={`speaker-${speaker.id}`}
                checked={selectedSpeakers.includes(speaker.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedSpeakers([...selectedSpeakers, speaker.id]);
                  } else {
                    setSelectedSpeakers(selectedSpeakers.filter(id => id !== speaker.id));
                  }
                }}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor={`speaker-${speaker.id}`} className="flex items-center space-x-3 cursor-pointer flex-1">
                <img
                  className="h-8 w-8 rounded-full object-cover"
                  src={speaker.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(speaker.full_name || '')}&background=random`}
                  alt=""
                />
                <div>
                  <div className="text-sm font-medium text-gray-900">{speaker.full_name}</div>
                  <div className="text-sm text-gray-500">{speaker.email}</div>
                </div>
              </label>
            </div>
          ))}
          {speakersData?.items.length === 0 && (
            <p className="text-center text-gray-500 py-4">No hay ponentes registrados en el sistema.</p>
          )}
        </div>
      </Modal>

      {/* Modal Confirmación Borrar */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Eliminar Sesión"
        message={
          <span>
            ¿Estás seguro de que deseas eliminar la sesión <strong>{sessionToDelete?.title}</strong>? Esta acción no se puede deshacer.
          </span>
        }
        confirmText="Eliminar"
        variant="danger"
        isLoading={deleteSessionMutation.isPending}
      />
    </div>
  );
};
