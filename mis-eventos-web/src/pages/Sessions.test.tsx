import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Sessions } from './Sessions';
import { useEvents } from '../hooks/useEvents';
import { useEventSessions, useCreateSession, useUpdateSession, useDeleteSession, useAssignSpeakers } from '../hooks/useSessions';
import { useUsers } from '../hooks/useUsers';
import { MemoryRouter } from 'react-router-dom';
import { EventStatus } from '../types/event';
import { UserRole } from '../types';

// Mocks
vi.mock('../hooks/useEvents');
vi.mock('../hooks/useSessions');
vi.mock('../hooks/useUsers');

// Mock UI components
vi.mock('../components/ui/Modal', () => ({
  Modal: ({ isOpen, title, children, footer }: any) => (
    isOpen ? (
      <div role="dialog">
        <h2>{title}</h2>
        {children}
        {footer}
      </div>
    ) : null
  ),
}));

vi.mock('../components/ui/ConfirmationModal', () => ({
  ConfirmationModal: ({ isOpen, title, onConfirm, onClose, confirmText }: any) => (
    isOpen ? (
      <div role="alertdialog">
        <h2>{title}</h2>
        <button onClick={onConfirm}>{confirmText}</button>
        <button onClick={onClose}>Cancelar</button>
      </div>
    ) : null
  ),
}));

// Mock Select to make it easier to test
vi.mock('../components/ui/Select', () => ({
  Select: ({ value, onChange, options, label, placeholder }: any) => (
    <div>
      <label>{label}</label>
      <select 
        data-testid="select-event" 
        value={value} 
        onChange={e => onChange(e.target.value)}
      >
        <option value="">{placeholder}</option>
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  ),
}));

describe('Sessions Page', () => {
  const mockEvents = {
    items: [
      { id: 'event-1', title: 'Event 1', status: EventStatus.PUBLISHED },
      { id: 'event-2', title: 'Event 2', status: EventStatus.DRAFT },
    ]
  };

  const mockSessions = [
    { 
      id: 'session-1', 
      title: 'Session 1', 
      description: 'Desc 1', 
      start_time: '2025-01-01T10:00:00Z', 
      end_time: '2025-01-01T11:00:00Z',
      location: 'Room A',
      capacity: 50,
      speakers: [] 
    }
  ];

  const mockSpeakers = {
    items: [
      { id: 'speaker-1', full_name: 'Speaker 1', role: UserRole.SPEAKER }
    ]
  };

  const mockCreateSession = vi.fn();
  const mockUpdateSession = vi.fn();
  const mockDeleteSession = vi.fn();
  const mockAssignSpeakers = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useEvents as any).mockReturnValue({ data: mockEvents });
    (useEventSessions as any).mockReturnValue({ data: mockSessions, isLoading: false });
    (useUsers as any).mockReturnValue({ data: mockSpeakers });
    
    (useCreateSession as any).mockReturnValue({ mutateAsync: mockCreateSession, isPending: false });
    (useUpdateSession as any).mockReturnValue({ mutateAsync: mockUpdateSession, isPending: false });
    (useDeleteSession as any).mockReturnValue({ mutateAsync: mockDeleteSession, isPending: false });
    (useAssignSpeakers as any).mockReturnValue({ mutateAsync: mockAssignSpeakers, isPending: false });
  });

  const renderSessions = () => {
    return render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Sessions />
      </MemoryRouter>
    );
  };

  it('renders initial state waiting for event selection', () => {
    renderSessions();
    expect(screen.getByText('No has seleccionado un evento')).toBeInTheDocument();
    expect(screen.queryByText('Nueva Sesión')).not.toBeInTheDocument();
  });

  it('loads sessions when event is selected', async () => {
    renderSessions();
    
    // Select event
    fireEvent.change(screen.getByTestId('select-event'), { target: { value: 'event-1' } });
    
    await waitFor(() => {
      expect(screen.getByText('Nueva Sesión')).toBeInTheDocument();
      expect(screen.getByText('Session 1')).toBeInTheDocument();
    });
  });

  it('opens create session modal', async () => {
    renderSessions();
    fireEvent.change(screen.getByTestId('select-event'), { target: { value: 'event-1' } });
    
    fireEvent.click(screen.getByText('Nueva Sesión'));
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Nueva Sesión', { selector: 'h2' })).toBeInTheDocument();
  });

  it('creates a new session', async () => {
    renderSessions();
    fireEvent.change(screen.getByTestId('select-event'), { target: { value: 'event-1' } });
    fireEvent.click(screen.getByText('Nueva Sesión'));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const dialog = screen.getByRole('dialog');
    const modalWithin = within(dialog);

    const getInputByLabel = (text: string | RegExp) => {
        return modalWithin.getByText(text, { selector: 'label' }).nextElementSibling as HTMLElement;
    };

    // Fill form
    fireEvent.change(getInputByLabel('Título'), { target: { value: 'New Session' } });
    fireEvent.change(getInputByLabel('Descripción'), { target: { value: 'New Desc' } });
    fireEvent.change(getInputByLabel('Inicio'), { target: { value: '2025-01-02T10:00' } });
    fireEvent.change(getInputByLabel('Fin'), { target: { value: '2025-01-02T11:00' } });
    fireEvent.change(getInputByLabel('Ubicación'), { target: { value: 'Room B' } });
    fireEvent.change(getInputByLabel('Capacidad'), { target: { value: '100' } });

    fireEvent.click(modalWithin.getByText('Guardar'));

    await waitFor(() => {
      expect(mockCreateSession).toHaveBeenCalledWith(expect.objectContaining({
        eventId: 'event-1',
        session: expect.objectContaining({
          title: 'New Session',
          location: 'Room B'
        })
      }));
    });
  });

  it('opens delete confirmation modal', async () => {
    renderSessions();
    fireEvent.change(screen.getByTestId('select-event'), { target: { value: 'event-1' } });
    
    const deleteButtons = screen.getAllByText('Eliminar');
    fireEvent.click(deleteButtons[0]);
    
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByText('Eliminar Sesión', { selector: 'h2' })).toBeInTheDocument();
  });

  it('assigns speakers', async () => {
    renderSessions();
    fireEvent.change(screen.getByTestId('select-event'), { target: { value: 'event-1' } });
    
    await waitFor(() => {
        expect(screen.getByText('Nueva Sesión')).toBeInTheDocument();
    });

    const speakersButtons = screen.getAllByText('Ponentes', { selector: 'button' });
    fireEvent.click(speakersButtons[0]);
    
    await waitFor(() => {
        expect(screen.getByText('Asignar Ponentes')).toBeInTheDocument();
    });
    
    // Find speaker checkbox
    const checkbox = screen.getByLabelText(/Speaker 1/i); // Label contains text
    fireEvent.click(checkbox);
    
    fireEvent.click(screen.getByText('Guardar Cambios'));
    
    await waitFor(() => {
      expect(mockAssignSpeakers).toHaveBeenCalledWith(expect.objectContaining({
        id: 'session-1',
        speakerIds: ['speaker-1']
      }));
    });
  });

  it('edits an existing session', async () => {
    renderSessions();
    fireEvent.change(screen.getByTestId('select-event'), { target: { value: 'event-1' } });
    
    await waitFor(() => {
        expect(screen.getByText('Session 1')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByText('Editar');
    fireEvent.click(editButtons[0]);
    
    const dialog = screen.getByRole('dialog');
    const modalWithin = within(dialog);
    const getInputByLabel = (text: string | RegExp) => {
        return modalWithin.getByText(text, { selector: 'label' }).nextElementSibling as HTMLElement;
    };

    // Verify fields pre-filled
    expect(getInputByLabel('Título')).toHaveValue('Session 1');
    expect(getInputByLabel('Ubicación')).toHaveValue('Room A');

    // Update fields
    fireEvent.change(getInputByLabel('Título'), { target: { value: 'Updated Session' } });
    fireEvent.click(modalWithin.getByText('Guardar'));

    await waitFor(() => {
        expect(mockUpdateSession).toHaveBeenCalledWith(expect.objectContaining({
            id: 'session-1',
            session: expect.objectContaining({ title: 'Updated Session' })
        }));
    });
  });

  it('confirms delete session', async () => {
    renderSessions();
    fireEvent.change(screen.getByTestId('select-event'), { target: { value: 'event-1' } });
    
    const deleteButtons = screen.getAllByText('Eliminar');
    fireEvent.click(deleteButtons[0]);
    
    const dialog = screen.getByRole('alertdialog');
    const confirmBtn = within(dialog).getByText('Eliminar');
    fireEvent.click(confirmBtn);

    await waitFor(() => {
        expect(mockDeleteSession).toHaveBeenCalledWith('session-1');
    });
  });

  it('handles session creation error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockCreateSession.mockRejectedValue({ response: { data: { detail: 'Creation Error' } } });
    renderSessions();
    fireEvent.change(screen.getByTestId('select-event'), { target: { value: 'event-1' } });
    fireEvent.click(screen.getByText('Nueva Sesión'));

    const dialog = screen.getByRole('dialog');
    const modalWithin = within(dialog);
    const getInputByLabel = (text: string | RegExp) => {
        return modalWithin.getByText(text, { selector: 'label' }).nextElementSibling as HTMLElement;
    };

    fireEvent.change(getInputByLabel('Título'), { target: { value: 'New Session' } });
    fireEvent.change(getInputByLabel('Inicio'), { target: { value: '2025-01-02T10:00' } });
    fireEvent.change(getInputByLabel('Fin'), { target: { value: '2025-01-02T11:00' } });
    fireEvent.change(getInputByLabel('Ubicación'), { target: { value: 'Room B' } });
    fireEvent.change(getInputByLabel('Capacidad'), { target: { value: '100' } });
    
    fireEvent.click(modalWithin.getByText('Guardar'));

    await waitFor(() => {
        expect(screen.getByText('Creation Error')).toBeInTheDocument();
    });
  });

  it('handles assign speakers error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockAssignSpeakers.mockRejectedValue({ response: { data: { detail: 'Assignment Error' } } });
    renderSessions();
    fireEvent.change(screen.getByTestId('select-event'), { target: { value: 'event-1' } });
    
    const speakersButtons = screen.getAllByText('Ponentes', { selector: 'button' });
    fireEvent.click(speakersButtons[0]);
    
    await waitFor(() => {
        expect(screen.getByText('Asignar Ponentes')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Guardar Cambios'));
    
    await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
    });
    consoleSpy.mockRestore();
  });

  it('toggles speaker selection', async () => {
    renderSessions();
    fireEvent.change(screen.getByTestId('select-event'), { target: { value: 'event-1' } });
    
    const speakersButtons = screen.getAllByText('Ponentes', { selector: 'button' });
    fireEvent.click(speakersButtons[0]);
    
    await waitFor(() => {
        expect(screen.getByText('Asignar Ponentes')).toBeInTheDocument();
    });
    
    const checkbox = screen.getByLabelText(/Speaker 1/i);
    // Initially unchecked (since session-1 has empty speakers)
    expect(checkbox).not.toBeChecked();
    
    // Check
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
    
    // Uncheck
    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  it('renders session with speakers', async () => {
    const sessionWithSpeakers = {
        ...mockSessions[0],
        speakers: [{ id: 'speaker-1', full_name: 'Speaker Name', profile_picture: 'pic.jpg' }]
    };
    (useEventSessions as any).mockReturnValue({ data: [sessionWithSpeakers], isLoading: false });

    renderSessions();
    fireEvent.change(screen.getByTestId('select-event'), { target: { value: 'event-1' } });
    
    await waitFor(() => {
        expect(screen.getByAltText('Speaker Name')).toBeInTheDocument();
    });
  });

  it('closes modals via cancel button', async () => {
    renderSessions();
    fireEvent.change(screen.getByTestId('select-event'), { target: { value: 'event-1' } });
    
    // Create Modal
    fireEvent.click(screen.getByText('Nueva Sesión'));
    await waitFor(() => expect(screen.getByText('Nueva Sesión', { selector: 'h2' })).toBeInTheDocument());
    fireEvent.click(screen.getByText('Cancelar'));
    await waitFor(() => expect(screen.queryByText('Nueva Sesión', { selector: 'h2' })).not.toBeInTheDocument());

    // Speakers Modal
    const speakersButtons = screen.getAllByText('Ponentes', { selector: 'button' });
    fireEvent.click(speakersButtons[0]);
    await waitFor(() => expect(screen.getByText('Asignar Ponentes')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Cancelar'));
    await waitFor(() => expect(screen.queryByText('Asignar Ponentes')).not.toBeInTheDocument());
  });

  it('handles delete modal closing', async () => {
    renderSessions();
    fireEvent.change(screen.getByTestId('select-event'), { target: { value: 'event-1' } });
    
    const deleteButtons = screen.getAllByText('Eliminar');
    fireEvent.click(deleteButtons[0]);
    
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Cancelar'));
    
    await waitFor(() => {
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
  });

  it('validates selected event on submit', async () => {
    renderSessions();
    fireEvent.change(screen.getByTestId('select-event'), { target: { value: 'event-1' } });
    
    fireEvent.click(screen.getByText('Nueva Sesión'));
    
    await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Deselect event while modal is open
    fireEvent.change(screen.getByTestId('select-event'), { target: { value: '' } });
    
    const dialog = screen.getByRole('dialog');
    const modalWithin = within(dialog);
    
    fireEvent.click(modalWithin.getByText('Guardar'));
    
    await waitFor(() => {
        expect(screen.getByText('Debes seleccionar un evento')).toBeInTheDocument();
    });
  });
});
