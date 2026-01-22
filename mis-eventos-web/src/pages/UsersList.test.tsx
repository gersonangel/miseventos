import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UsersList } from './UsersList';
import { useAuth } from '../context/AuthContext';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '../hooks/useUsers';
import { UserRole } from '../types';
import { MemoryRouter } from 'react-router-dom';
import { eventService } from '../services/eventService';

// Mocks
vi.mock('../context/AuthContext');
vi.mock('../hooks/useUsers');
vi.mock('../services/eventService');

// Mock UI components that might cause issues
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
  ConfirmationModal: ({ isOpen, title, onConfirm, confirmText }: any) => (
    isOpen ? (
      <div role="alertdialog">
        <h2>{title}</h2>
        <button onClick={onConfirm}>{confirmText}</button>
      </div>
    ) : null
  ),
}));

// Mock Select component
vi.mock('../components/ui/Select', () => ({
  Select: ({ value, onChange, options, label }: any) => (
    <div>
      <label>{label}</label>
      <select 
        data-testid="select-role" 
        value={value} 
        onChange={e => onChange(e.target.value)}
      >
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  ),
}));

describe('UsersList Page', () => {
  const mockUser = { id: '1', email: 'admin@test.com', full_name: 'Admin', role: UserRole.ADMIN };
  
  const mockUsersData = {
    items: [
      { id: '1', email: 'user1@test.com', full_name: 'User 1', role: UserRole.ATTENDEE, is_active: true },
      { id: '2', email: 'user2@test.com', full_name: 'User 2', role: UserRole.ORGANIZER, is_active: false },
    ],
    total: 2,
    page: 1,
    size: 10,
    pages: 1
  };

  const mockCreateUser = vi.fn();
  const mockUpdateUser = vi.fn();
  const mockDeleteUser = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({ user: mockUser });
    (useUsers as any).mockReturnValue({ data: mockUsersData, isLoading: false });
    (useCreateUser as any).mockReturnValue({ mutateAsync: mockCreateUser, isPending: false });
    (useUpdateUser as any).mockReturnValue({ mutateAsync: mockUpdateUser, isPending: false });
    (useDeleteUser as any).mockReturnValue({ mutateAsync: mockDeleteUser, isPending: false });
  });

  const renderUsersList = () => {
    return render(
      <MemoryRouter>
        <UsersList />
      </MemoryRouter>
    );
  };

  const openCreateModal = () => {
    fireEvent.click(screen.getByText('Crear Usuario'));
  };

  const selectSpeakerRole = async () => {
    const dialog = await screen.findByRole('dialog');
    const roleSelect = within(dialog).getByTestId('select-role');
    fireEvent.change(roleSelect, { target: { value: UserRole.SPEAKER } });
  };

  const getInputByLabel = (labelText: string | RegExp) => {
    const label = screen.getByText(labelText);
    // In Input.tsx, label and input are siblings.
    // label is <label>...</label>
    // input is <input ... />
    // They are inside a div.
    return label.nextElementSibling as HTMLInputElement;
  };

  it('renders users list', () => {
    renderUsersList();
    expect(screen.getByText('User 1')).toBeInTheDocument();
    expect(screen.getByText('user1@test.com')).toBeInTheDocument();
    expect(screen.getByText('User 2')).toBeInTheDocument();
  });

  it('handles image upload failure', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (eventService.uploadImage as any).mockRejectedValue(new Error('Upload failed'));
    renderUsersList();
    
    openCreateModal();
    await selectSpeakerRole();
    
    await waitFor(() => {
        expect(screen.getByText('Foto de Perfil')).toBeInTheDocument();
    });
    
    const dialog = screen.getByRole('dialog');
    const fileInput = dialog.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
    
    if (fileInput) {
        const file = new File(['(⌐□_□)'], 'chucknorris.png', { type: 'image/png' });
        // Use fireEvent inside act if needed, but fireEvent is wrapped.
        // However, since upload is async, we need to wait for error.
        fireEvent.change(fileInput, { target: { files: [file] } });
    }

    await waitFor(() => {
        expect(screen.getByText('Error al subir la imagen')).toBeInTheDocument();
    });
    
    consoleSpy.mockRestore();
  });

  it('handles user creation validation error from API', async () => {
     const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
     const errorResponse = {
         response: {
             data: {
                 detail: [
                     { msg: 'Email already exists' },
                     { msg: 'Invalid password' }
                 ]
             }
         }
     };
     mockCreateUser.mockRejectedValue(errorResponse);
     
     renderUsersList();
     openCreateModal();
     
     fireEvent.change(getInputByLabel('Nombre Completo'), { target: { value: 'New User' } });
     fireEvent.change(getInputByLabel('Email'), { target: { value: 'new@test.com' } });
     fireEvent.change(getInputByLabel(/Contraseña/i), { target: { value: 'password' } });
     
     fireEvent.click(screen.getByText('Guardar'));
     
     await waitFor(() => {
         expect(screen.getByText('Email already exists, Invalid password')).toBeInTheDocument();
     });
     
     consoleSpy.mockRestore();
  });

  it('handles user creation generic error from API', async () => {
     const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
     const errorResponse = {
         response: {
             data: {
                 detail: 'Generic Error'
             }
         }
     };
     mockCreateUser.mockRejectedValue(errorResponse);
     
     renderUsersList();
     openCreateModal();
     
     fireEvent.change(getInputByLabel('Nombre Completo'), { target: { value: 'New User' } });
     fireEvent.change(getInputByLabel('Email'), { target: { value: 'new@test.com' } });
     fireEvent.change(getInputByLabel(/Contraseña/i), { target: { value: 'password' } });
     
     fireEvent.click(screen.getByText('Guardar'));
     
     await waitFor(() => {
         expect(screen.getByText('Generic Error')).toBeInTheDocument();
     });
     
     consoleSpy.mockRestore();
  });

  it('handles user creation unknown error', async () => {
     const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
     mockCreateUser.mockRejectedValue(new Error('Unknown'));
     
     renderUsersList();
     openCreateModal();
     
     fireEvent.change(getInputByLabel('Nombre Completo'), { target: { value: 'New User' } });
     fireEvent.change(getInputByLabel('Email'), { target: { value: 'new@test.com' } });
     fireEvent.change(getInputByLabel(/Contraseña/i), { target: { value: 'password' } });
     
     fireEvent.click(screen.getByText('Guardar'));
     
     await waitFor(() => {
         expect(screen.getByText('Error al guardar usuario')).toBeInTheDocument();
     });
     
     consoleSpy.mockRestore();
  });

  it('opens create user modal', () => {
    renderUsersList();
    fireEvent.click(screen.getByText('Crear Usuario'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Crear Usuario', { selector: 'h2' })).toBeInTheDocument();
  });

  it('creates a new user', async () => {
    renderUsersList();
    fireEvent.click(screen.getByText('Crear Usuario'));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    const dialog = screen.getByRole('dialog');
    const modalWithin = within(dialog);

    // Helper to find input by label text (since Input component doesn't use IDs)
    const getInputByLabel = (text: string | RegExp) => {
      return modalWithin.getByText(text, { selector: 'label' }).nextElementSibling as HTMLInputElement;
    };

    // Fill form
    fireEvent.change(getInputByLabel('Nombre Completo'), { target: { value: 'New User' } });
    fireEvent.change(getInputByLabel('Email'), { target: { value: 'new@test.com' } });
    fireEvent.change(getInputByLabel(/Contraseña/), { target: { value: 'password123' } });
    
    // Select role using testid from mock
    const roleSelect = modalWithin.getByTestId('select-role');
    fireEvent.change(roleSelect, { target: { value: UserRole.ATTENDEE } });
    
    fireEvent.click(modalWithin.getByText('Guardar'));

    await waitFor(() => {
      expect(mockCreateUser).toHaveBeenCalledWith(expect.objectContaining({
        full_name: 'New User',
        email: 'new@test.com',
        password: 'password123',
        role: UserRole.ATTENDEE
      }));
    });
  });

  it('opens edit user modal', () => {
    renderUsersList();
    const editButtons = screen.getAllByText('Editar');
    fireEvent.click(editButtons[0]); // Edit first user
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Editar Usuario', { selector: 'h2' })).toBeInTheDocument();
    expect(screen.getByDisplayValue('User 1')).toBeInTheDocument();
  });

  it('updates user', async () => {
    renderUsersList();
    const editButtons = screen.getAllByText('Editar');
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const dialog = screen.getByRole('dialog');
    const modalWithin = within(dialog);

    // Helper to find input by label text (since Input component doesn't use IDs)
    const getInputByLabel = (text: string | RegExp) => {
      return modalWithin.getByText(text, { selector: 'label' }).nextElementSibling as HTMLInputElement;
    };

    fireEvent.change(getInputByLabel('Nombre Completo'), { target: { value: 'Updated User 1' } });
    fireEvent.click(modalWithin.getByText('Guardar'));

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith(expect.objectContaining({
        id: '1',
        data: expect.objectContaining({
          full_name: 'Updated User 1'
        })
      }));
    });
  });

  it('opens delete confirmation modal', () => {
    renderUsersList();
    
    const deleteButtons = screen.getAllByText('Eliminar');
    fireEvent.click(deleteButtons[0]);
    
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    // Use within to find text inside the dialog
    expect(screen.getByText('Eliminar Usuario', { selector: 'h2' })).toBeInTheDocument();
  });

  it('deletes user', async () => {
    renderUsersList();
    const deleteButtons = screen.getAllByText('Eliminar');
    fireEvent.click(deleteButtons[0]); // User 2

    const dialog = screen.getByRole('alertdialog');
    // Find the confirm button inside the dialog
    // The confirm button text is "Eliminar" (confirmText prop)
    // We can look for button with text "Eliminar" inside the dialog
    const confirmButton = screen.getAllByText('Eliminar', { selector: 'button' }).find(
      btn => dialog.contains(btn)
    );
    
    if (confirmButton) {
        fireEvent.click(confirmButton);
    } else {
        throw new Error("Confirm button not found");
    }

    await waitFor(() => {
      expect(mockDeleteUser).toHaveBeenCalledWith('2');
    });
  });

  it('shows speaker fields when speaker role is selected', async () => {
    renderUsersList();
    fireEvent.click(screen.getByText('Crear Usuario'));
    
    await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const dialog = screen.getByRole('dialog');
    const modalWithin = within(dialog);
    const roleSelect = modalWithin.getByTestId('select-role');
    
    fireEvent.change(roleSelect, { target: { value: UserRole.SPEAKER } });

    await waitFor(() => {
        expect(modalWithin.getByText('Biografía')).toBeInTheDocument();
        expect(modalWithin.getByText('Organización')).toBeInTheDocument();
        expect(modalWithin.getByText('Cargo / Posición')).toBeInTheDocument();
        expect(modalWithin.getByText('Foto de Perfil')).toBeInTheDocument();
    });
  });

  it('handles image upload', async () => {
    const mockUploadUrl = 'http://example.com/image.jpg';
    (eventService.uploadImage as any).mockResolvedValue(mockUploadUrl);

    renderUsersList();
    fireEvent.click(screen.getByText('Crear Usuario'));
    
    await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const dialog = screen.getByRole('dialog');
    const modalWithin = within(dialog);
    const roleSelect = modalWithin.getByTestId('select-role');
    
    fireEvent.change(roleSelect, { target: { value: UserRole.SPEAKER } });

    await waitFor(() => {
        expect(modalWithin.getByText('Foto de Perfil')).toBeInTheDocument();
    });

    const fileInput = dialog.querySelector('input[type="file"]');
    if (!fileInput) throw new Error('File input not found');

    const file = new File(['(⌐□_□)'], 'chucknorris.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
        expect(eventService.uploadImage).toHaveBeenCalledWith(file);
    });
  });

  it('validates required fields on create', async () => {
    renderUsersList();
    fireEvent.click(screen.getByText('Crear Usuario'));
    
    await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const dialog = screen.getByRole('dialog');
    const modalWithin = within(dialog);
    
    fireEvent.click(modalWithin.getByText('Guardar'));
    
    await waitFor(() => {
        expect(screen.getByText('Por favor completa los campos requeridos')).toBeInTheDocument();
    });
    
    expect(mockCreateUser).not.toHaveBeenCalled();
  });

  it('handles API errors', async () => {
    mockCreateUser.mockRejectedValue({
        response: {
            data: {
                detail: 'Email already exists'
            }
        }
    });

    renderUsersList();
    fireEvent.click(screen.getByText('Crear Usuario'));
    
    await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const dialog = screen.getByRole('dialog');
    const modalWithin = within(dialog);
    const getInputByLabel = (text: string | RegExp) => {
      return modalWithin.getByText(text, { selector: 'label' }).nextElementSibling as HTMLInputElement;
    };

    fireEvent.change(getInputByLabel('Nombre Completo'), { target: { value: 'New User' } });
    fireEvent.change(getInputByLabel('Email'), { target: { value: 'new@test.com' } });
    fireEvent.change(getInputByLabel(/Contraseña/), { target: { value: 'password123' } });
    
    fireEvent.click(modalWithin.getByText('Guardar'));
    
    await waitFor(() => {
        expect(screen.getByText('Email already exists')).toBeInTheDocument();
    });
  });

  it('creates speaker user with all fields', async () => {
    mockCreateUser.mockResolvedValue({ ...mockUsersData.items[0], role: UserRole.SPEAKER });
    
    renderUsersList();
    fireEvent.click(screen.getByText('Crear Usuario'));
    
    await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const dialog = screen.getByRole('dialog');
    const modalWithin = within(dialog);

    const getInputByLabel = (text: string | RegExp) => {
      return modalWithin.getByText(text, { selector: 'label' }).nextElementSibling as HTMLInputElement;
    };
    
    // Fill standard fields
    fireEvent.change(getInputByLabel('Nombre Completo'), { target: { value: 'New Speaker' } });
    fireEvent.change(getInputByLabel('Email'), { target: { value: 'speaker@test.com' } });
    fireEvent.change(getInputByLabel(/Contraseña/), { target: { value: 'password123' } });
    
    // Select Speaker role
    const roleSelect = modalWithin.getByTestId('select-role');
    fireEvent.change(roleSelect, { target: { value: UserRole.SPEAKER } });
    
    await waitFor(() => {
        expect(modalWithin.getByText('Biografía')).toBeInTheDocument();
    });

    // Fill speaker fields
    fireEvent.change(getInputByLabel('Biografía'), { target: { value: 'My Bio' } });
    fireEvent.change(getInputByLabel('Organización'), { target: { value: 'My Org' } });
    fireEvent.change(getInputByLabel('Cargo / Posición'), { target: { value: 'My Position' } });

    // Toggle Active checkbox
    const activeCheckbox = dialog.querySelector('#is_active');
    if (activeCheckbox) {
        fireEvent.click(activeCheckbox); // Toggle off (assuming default true)
        fireEvent.click(activeCheckbox); // Toggle on
    }

    fireEvent.click(modalWithin.getByText('Guardar'));

    await waitFor(() => {
        expect(mockCreateUser).toHaveBeenCalledWith(expect.objectContaining({
            full_name: 'New Speaker',
            email: 'speaker@test.com',
            password: 'password123',
            role: UserRole.SPEAKER,
            biography: 'My Bio',
            organization: 'My Org',
            position: 'My Position',
            is_active: true
        }));
    });
  });
});
