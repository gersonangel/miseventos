import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreateEvent } from './CreateEvent';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { eventService } from '../services/eventService';
import { useCreateEvent } from '../hooks/useEvents';

// Mock dependencies
vi.mock('../services/eventService', () => ({
  eventService: {
    uploadImage: vi.fn(),
  },
}));

vi.mock('../hooks/useEvents', () => ({
  useCreateEvent: vi.fn(),
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('CreateEvent Page', () => {
  const mockMutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useCreateEvent as any).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    });
  });

  const renderCreateEvent = () => {
    return render(
      <BrowserRouter>
        <CreateEvent />
      </BrowserRouter>
    );
  };

  const getInputByLabel = (container: HTMLElement, labelText: string) => {
    // Find label by text
    // The container parameter is unused by screen queries but kept for interface consistency or future scoping
    // To suppress unused warning if strict:
    void container; 
    const label = screen.getByText(labelText, { selector: 'label' });
    // Try next sibling (input/textarea)
    let input = label.nextElementSibling;
    
    // If input is null, or it's a div (wrapper), look inside
    if (input?.tagName === 'DIV') {
       // For image upload, input is inside the div
       const innerInput = input.querySelector('input');
       if (innerInput) return innerInput;
       
       // For custom Select (button)
       const innerButton = input.querySelector('button');
       if (innerButton) return innerButton;
    }
    
    return input as HTMLElement;
  };

  it('renders create event form', () => {
    renderCreateEvent();
    expect(screen.getByText('Crear Nuevo Evento')).toBeInTheDocument();
    expect(screen.getByText('Título', { selector: 'label' })).toBeInTheDocument();
    expect(screen.getByText('Descripción', { selector: 'label' })).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    renderCreateEvent();
    
    const submitBtn = screen.getByText('Crear Evento');
    fireEvent.click(submitBtn);

    await waitFor(() => {
        expect(screen.getByText('El título debe tener al menos 3 caracteres')).toBeInTheDocument();
        expect(screen.getByText('La descripción debe tener al menos 10 caracteres')).toBeInTheDocument();
        expect(screen.getByText('Fecha de inicio requerida')).toBeInTheDocument();
    });
  });

  it('validates date range', async () => {
    const { container } = renderCreateEvent();
    
    // Fill form with invalid dates
    fireEvent.change(getInputByLabel(container, 'Título'), { target: { value: 'Test Event' } });
    fireEvent.change(getInputByLabel(container, 'Descripción'), { target: { value: 'Test Description Long Enough' } });
    fireEvent.change(getInputByLabel(container, 'Inicio'), { target: { value: '2023-01-02T10:00' } });
    fireEvent.change(getInputByLabel(container, 'Fin'), { target: { value: '2023-01-01T10:00' } });
    
    const submitBtn = screen.getByText('Crear Evento');
    fireEvent.click(submitBtn);

    await waitFor(() => {
        expect(screen.getByText('La fecha de fin debe ser posterior a la de inicio')).toBeInTheDocument();
    });
  });

  it('handles image upload success', async () => {
    (eventService.uploadImage as any).mockResolvedValue('http://example.com/image.jpg');
    const { container } = renderCreateEvent();
    
    const file = new File(['(⌐□_□)'], 'chucknorris.png', { type: 'image/png' });
    const desktopInput = getInputByLabel(container, 'Imagen Desktop');
    
    await waitFor(() => fireEvent.change(desktopInput, { target: { files: [file] } }));
    
    expect(eventService.uploadImage).toHaveBeenCalledWith(file);
    await waitFor(() => {
        expect(screen.getByAltText('Preview Desktop')).toHaveAttribute('src', 'http://example.com/image.jpg');
    });
  });

  it('handles image upload error', async () => {
    (eventService.uploadImage as any).mockRejectedValue(new Error('Upload failed'));
    const { container } = renderCreateEvent();
    
    const desktopInput = getInputByLabel(container, 'Imagen Desktop');
    const file = new File(['(⌐□_□)'], 'chucknorris.png', { type: 'image/png' });
    
    await waitFor(() => fireEvent.change(desktopInput, { target: { files: [file] } }));
    
    await waitFor(() => {
        expect(screen.getByText('Error de carga')).toBeInTheDocument();
        expect(screen.getByText('Error al subir la imagen. Por favor intenta nuevamente.')).toBeInTheDocument();
    });
  });

  it('handles form submission success', async () => {
    // Fill all valid data
    (useCreateEvent as any).mockReturnValue({
        mutate: mockMutate,
        isPending: false,
      });
      
    // Mock successful mutation (call onSuccess)
    mockMutate.mockImplementation((_data, { onSuccess }) => {
        onSuccess();
    });

    const { container } = renderCreateEvent();

    fireEvent.change(getInputByLabel(container, 'Título'), { target: { value: 'Valid Title' } });
    fireEvent.change(getInputByLabel(container, 'Descripción'), { target: { value: 'Valid Description Text' } });
    fireEvent.change(getInputByLabel(container, 'Inicio'), { target: { value: '2023-01-01T10:00' } });
    fireEvent.change(getInputByLabel(container, 'Fin'), { target: { value: '2023-01-02T10:00' } });
    fireEvent.change(getInputByLabel(container, 'Ubicación'), { target: { value: 'Online' } });
    fireEvent.change(getInputByLabel(container, 'Capacidad Máxima'), { target: { value: '50' } });
    
    (eventService.uploadImage as any).mockResolvedValue('http://example.com/img.jpg');
    
    // Upload desktop
    await waitFor(() => fireEvent.change(getInputByLabel(container, 'Imagen Desktop'), { target: { files: [new File(['x'], 'd.png', { type: 'image/png' })] } }));
    // Upload mobile
    await waitFor(() => fireEvent.change(getInputByLabel(container, 'Imagen Mobile'), { target: { files: [new File(['x'], 'm.png', { type: 'image/png' })] } }));
    
    // Wait for validation updates (images set)
    await waitFor(() => expect(screen.getAllByAltText(/Preview/)).toHaveLength(2));
    
    const submitBtn = screen.getByText('Crear Evento');
    fireEvent.click(submitBtn);
    
    await waitFor(() => {
        expect(mockMutate).toHaveBeenCalled();
        expect(screen.getByText('Evento Creado')).toBeInTheDocument();
    });
    
    // Test close modal
    const closeBtn = screen.getByText('Cerrar');
    fireEvent.click(closeBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/events');
  });

  it('handles form submission error', async () => {
    // Mock mutation error
    mockMutate.mockImplementation((_data, { onError }) => {
        onError(new Error('Creation failed'));
    });

    (eventService.uploadImage as any).mockResolvedValue('http://example.com/img.jpg');
    const { container } = renderCreateEvent();
    
    fireEvent.change(getInputByLabel(container, 'Título'), { target: { value: 'Valid Title' } });
    fireEvent.change(getInputByLabel(container, 'Descripción'), { target: { value: 'Valid Description Text' } });
    fireEvent.change(getInputByLabel(container, 'Inicio'), { target: { value: '2023-01-01T10:00' } });
    fireEvent.change(getInputByLabel(container, 'Fin'), { target: { value: '2023-01-02T10:00' } });
    fireEvent.change(getInputByLabel(container, 'Ubicación'), { target: { value: 'Online' } });
    fireEvent.change(getInputByLabel(container, 'Capacidad Máxima'), { target: { value: '50' } });
    
    await waitFor(() => fireEvent.change(getInputByLabel(container, 'Imagen Desktop'), { target: { files: [new File(['x'], 'd.png', { type: 'image/png' })] } }));
    await waitFor(() => fireEvent.change(getInputByLabel(container, 'Imagen Mobile'), { target: { files: [new File(['x'], 'm.png', { type: 'image/png' })] } }));
    await waitFor(() => expect(screen.getAllByAltText(/Preview/)).toHaveLength(2));

    const submitBtn = screen.getByText('Crear Evento');
    fireEvent.click(submitBtn);

    await waitFor(() => {
        expect(screen.getByText('Error de Creación')).toBeInTheDocument();
        expect(screen.getByText('Creation failed')).toBeInTheDocument();
    });
  });
});
