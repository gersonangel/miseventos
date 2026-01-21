import React, { useState, useEffect } from 'react';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '../hooks/useUsers';
import { User, UserRole, UserCreateAdmin, UserUpdate } from '../types';
import { Table, Column } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Pagination } from '../components/ui/Pagination';
import { Modal } from '../components/ui/Modal';
import { ConfirmationModal } from '../components/ui/ConfirmationModal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { useAuth } from '../context/AuthContext';
import { eventService } from '../services/eventService';

import { BackButton } from '../components/ui/BackButton';

export const UsersList = () => {
  const { user: currentUser } = useAuth();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(() => {
    const saved = localStorage.getItem('usersPageSize');
    return saved ? Number(saved) : 5;
  });

  useEffect(() => {
    localStorage.setItem('usersPageSize', pageSize.toString());
  }, [pageSize]);

  const [selectedRole, setSelectedRole] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<Partial<UserCreateAdmin>>({
    email: '',
    password: '',
    full_name: '',
    role: UserRole.ATTENDEE,
    is_active: true,
    biography: '',
    organization: '',
    position: '',
    profile_picture: ''
  });
  const [uploadingProfile, setUploadingProfile] = useState(false);

  const { data: usersResponse, isLoading } = useUsers(page, pageSize, selectedRole || undefined);
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();

  const ROLE_LABELS: Record<UserRole, string> = {
    [UserRole.ADMIN]: 'ADMINISTRADOR',
    [UserRole.ORGANIZER]: 'ORGANIZADOR',
    [UserRole.SPEAKER]: 'PONENTE',
    [UserRole.ATTENDEE]: 'ASISTENTE',
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingProfile(true);
      const url = await eventService.uploadImage(file);
      setFormData(prev => ({ ...prev, profile_picture: url }));
    } catch (error) {
      console.error('Error uploading image:', error);
      setError('Error al subir la imagen');
    } finally {
      setUploadingProfile(false);
    }
  };

  const handleCreate = () => {
    setError('');
    setEditingUser(null);
    setFormData({
      email: '',
      password: '',
      full_name: '',
      role: UserRole.ATTENDEE,
      is_active: true,
      biography: '',
      organization: '',
      position: '',
      profile_picture: ''
    });
    setIsModalOpen(true);
  };

  const handleEdit = (user: User) => {
    setError('');
    setEditingUser(user);
    setFormData({
      email: user.email,
      full_name: user.full_name || '',
      role: user.role || UserRole.ATTENDEE,
      is_active: user.is_active,
      password: '',
      biography: user.biography || '',
      organization: user.organization || '',
      position: user.position || '',
      profile_picture: user.profile_picture || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = (user: User) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (userToDelete) {
      await deleteUserMutation.mutateAsync(userToDelete.id);
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (editingUser) {
        // Update
        const updateData: UserUpdate = {
          email: formData.email,
          full_name: formData.full_name,
          role: formData.role,
          is_active: formData.is_active,
          biography: formData.biography,
          organization: formData.organization,
          position: formData.position,
          profile_picture: formData.profile_picture,
        };
        if (formData.password) {
          updateData.password = formData.password;
        }
        await updateUserMutation.mutateAsync({ id: editingUser.id, data: updateData });
      } else {
        // Create
        if (!formData.email || !formData.password || !formData.full_name || !formData.role) {
          setError('Por favor completa los campos requeridos');
          return;
        }
        await createUserMutation.mutateAsync(formData as UserCreateAdmin);
      }
      setIsModalOpen(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Error saving user:', err);
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (Array.isArray(detail)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setError(detail.map((e: any) => e.msg).join(', '));
        } else {
          setError(detail);
        }
      } else {
        setError('Error al guardar usuario');
      }
    }
  };

  const columns: Column<User>[] = [
    {
      header: 'Nombre',
      accessor: (user) => (
        <div className="flex items-center">
          <div className="h-10 w-10 flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
              {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
            </div>
          </div>
          <div className="ml-4">
            <div className="font-medium text-gray-900">{user.full_name || 'Sin nombre'}</div>
            <div className="text-gray-500">{user.email}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Rol',
      accessor: (user) => {
        const variants: Record<string, "success" | "warning" | "danger" | "info" | "gray"> = {
          [UserRole.ADMIN]: 'danger',
          [UserRole.ORGANIZER]: 'warning',
          [UserRole.SPEAKER]: 'info',
          [UserRole.ATTENDEE]: 'success',
        };
        const role = user.role || UserRole.ATTENDEE;
        return (
          <Badge variant={variants[role] || 'gray'}>
            {ROLE_LABELS[role] || role}
          </Badge>
        );
      },
    },
    {
      header: 'Estado',
      accessor: (user) => (
        <Badge variant={user.is_active ? 'success' : 'gray'}>
          {user.is_active ? 'ACTIVO' : 'INACTIVO'}
        </Badge>
      ),
    },
    {
      header: 'Acciones',
      accessor: (user) => (
        <div className="flex space-x-2 justify-end">
          <Button variant="secondary" size="sm" onClick={() => handleEdit(user)}>
            Editar
          </Button>
          {currentUser?.id !== user.id && (
             <Button variant="danger" size="sm" onClick={() => handleDelete(user)}>
              Eliminar
            </Button>
          )}
        </div>
      ),
      className: 'text-right'
    },
  ];

  const items = usersResponse?.items || [];
  const total = usersResponse?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  const filterRoleOptions = [
    { value: '', label: 'Todos los roles' },
    ...Object.values(UserRole).map(role => ({ value: role, label: ROLE_LABELS[role] || role }))
  ];

  const formRoleOptions = Object.values(UserRole).map(role => ({ value: role, label: ROLE_LABELS[role] || role }));

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <BackButton to="/" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
            <p className="text-sm text-gray-500 mt-1">Administra los usuarios del sistema</p>
          </div>
        </div>
        <div className="flex items-center space-x-4 w-full sm:w-auto">
          <div className="w-full sm:w-48">
            <Select 
              options={filterRoleOptions}
              value={selectedRole}
              onChange={(value) => {
                setSelectedRole(value);
                setPage(1);
              }}
            />
          </div>
          <Button onClick={handleCreate} className="whitespace-nowrap">
            Crear Usuario
          </Button>
        </div>
      </div>

      <Table 
        columns={columns} 
        data={items} 
        keyExtractor={(user) => user.id} 
        isLoading={isLoading}
      />

      {items.length > 0 && (
        <Pagination 
          currentPage={page} 
          totalPages={totalPages} 
          onPageChange={setPage}
          hasNextPage={page < totalPages}
          hasPreviousPage={page > 1}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          totalItems={total}
        />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? 'Editar Usuario' : 'Crear Usuario'}
        footer={
          <div className="flex justify-end space-x-3">
             <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit} 
              isLoading={createUserMutation.isPending || updateUserMutation.isPending}
            >
              Guardar
            </Button>
          </div>
        }
      >
        <form className="space-y-4">
          <Input
            label="Nombre Completo"
            type="text"
            value={formData.full_name}
            onChange={(e) => setFormData({...formData, full_name: e.target.value})}
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
          />
          <Input
            label={`Contraseña ${editingUser ? '(Opcional)' : ''}`}
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            placeholder={editingUser ? 'Dejar en blanco para no cambiar' : ''}
          />
          <Select
            label="Rol"
            options={formRoleOptions}
            value={formData.role || UserRole.ATTENDEE}
            onChange={(value) => setFormData({...formData, role: value as UserRole})}
          />

          {formData.role === UserRole.SPEAKER && (
            <>
              <Input
                label="Biografía"
                type="text"
                value={formData.biography || ''}
                onChange={(e) => setFormData({...formData, biography: e.target.value})}
              />
              <Input
                label="Organización"
                type="text"
                value={formData.organization || ''}
                onChange={(e) => setFormData({...formData, organization: e.target.value})}
              />
              <Input
                label="Cargo / Posición"
                type="text"
                value={formData.position || ''}
                onChange={(e) => setFormData({...formData, position: e.target.value})}
              />
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Foto de Perfil
                </label>
                <div className="mt-1 flex items-center space-x-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    disabled={uploadingProfile}
                  />
                  {uploadingProfile && <span className="text-sm text-gray-500">Subiendo...</span>}
                </div>
                {formData.profile_picture && (
                  <div className="mt-2">
                    <img src={formData.profile_picture} alt="Profile Preview" className="h-20 w-20 object-cover rounded-full" />
                  </div>
                )}
              </div>
            </>
          )}
          <div className="flex items-center pt-2">
            <input
              id="is_active"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              checked={formData.is_active}
              onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
            />
            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
              Usuario Activo
            </label>
          </div>
          <div className="min-h-[20px] text-red-500 text-sm font-semibold">
            {error}
          </div>
        </form>
      </Modal>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Eliminar Usuario"
        message={
          <span>
            ¿Estás seguro de que deseas eliminar al usuario <strong>{userToDelete?.full_name || userToDelete?.email}</strong>? Esta acción no se puede deshacer.
          </span>
        }
        confirmText="Eliminar"
        variant="danger"
        isLoading={deleteUserMutation.isPending}
      />
    </div>
  );
};
