import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '../hooks/useUsers';
import { User, UserRole, UserCreateAdmin, UserUpdate } from '../types';
import { Table, Column } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Pagination } from '../components/ui/Pagination';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { useAuth } from '../context/AuthContext';

export const UsersList = () => {
  const { user: currentUser } = useAuth();
  const [page, setPage] = useState(1);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<Partial<UserCreateAdmin>>({
    email: '',
    password: '',
    full_name: '',
    role: UserRole.ATTENDEE,
    is_active: true
  });

  const { data: usersResponse, isLoading } = useUsers(page, 10, selectedRole || undefined);
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();

  const ROLE_LABELS: Record<UserRole, string> = {
    [UserRole.ADMIN]: 'ADMINISTRADOR',
    [UserRole.ORGANIZER]: 'ORGANIZADOR',
    [UserRole.SPEAKER]: 'PONENTE',
    [UserRole.ATTENDEE]: 'ASISTENTE',
  };

  const handleCreate = () => {
    setEditingUser(null);
    setFormData({
      email: '',
      password: '',
      full_name: '',
      role: UserRole.ATTENDEE,
      is_active: true
    });
    setIsModalOpen(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      full_name: user.full_name || '',
      role: user.role || UserRole.ATTENDEE,
      is_active: user.is_active,
      password: ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      await deleteUserMutation.mutateAsync(id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        // Update
        const updateData: UserUpdate = {
          email: formData.email,
          full_name: formData.full_name,
          role: formData.role,
          is_active: formData.is_active,
        };
        if (formData.password) {
          updateData.password = formData.password;
        }
        await updateUserMutation.mutateAsync({ id: editingUser.id, data: updateData });
      } else {
        // Create
        if (!formData.email || !formData.password || !formData.full_name || !formData.role) {
          alert('Por favor completa los campos requeridos');
          return;
        }
        await createUserMutation.mutateAsync(formData as UserCreateAdmin);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Error al guardar usuario');
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
             <Button variant="danger" size="sm" onClick={() => handleDelete(user.id)}>
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
  const totalPages = Math.ceil(total / 10);

  const filterRoleOptions = [
    { value: '', label: 'Todos los roles' },
    ...Object.values(UserRole).map(role => ({ value: role, label: ROLE_LABELS[role] || role }))
  ];

  const formRoleOptions = Object.values(UserRole).map(role => ({ value: role, label: ROLE_LABELS[role] || role }));

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <Link to="/" className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
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
        </form>
      </Modal>
    </div>
  );
};
