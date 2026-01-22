import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Table } from './Table';

interface User {
  id: number;
  name: string;
  role: string;
}

const columns = [
  { header: 'Name', accessor: 'name' as keyof User },
  { header: 'Role', accessor: 'role' as keyof User },
  { 
    header: 'Actions', 
    accessor: (user: User) => <button>Edit {user.name}</button> 
  }
];

const data: User[] = [
  { id: 1, name: 'Alice', role: 'Admin' },
  { id: 2, name: 'Bob', role: 'User' },
];

describe('Table', () => {
  it('renders loading state', () => {
    render(
      <Table 
        columns={columns} 
        data={[]} 
        keyExtractor={(item) => item.id} 
        isLoading={true} 
      />
    );
    // Check for spinner class or structure
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('renders empty message when no data', () => {
    render(
      <Table 
        columns={columns} 
        data={[]} 
        keyExtractor={(item) => item.id} 
      />
    );
    expect(screen.getByText('No hay datos disponibles')).toBeInTheDocument();
  });

  it('renders data correctly', () => {
    render(
      <Table 
        columns={columns} 
        data={data} 
        keyExtractor={(item) => item.id} 
      />
    );
    
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('User')).toBeInTheDocument();
  });

  it('renders custom cell content', () => {
    render(
      <Table 
        columns={columns} 
        data={data} 
        keyExtractor={(item) => item.id} 
      />
    );
    
    expect(screen.getByText('Edit Alice')).toBeInTheDocument();
  });

  it('renders headers correctly', () => {
    render(
      <Table 
        columns={columns} 
        data={data} 
        keyExtractor={(item) => item.id} 
      />
    );
    
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Role')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });
});
