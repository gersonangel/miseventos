import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ConfirmationModal } from './ConfirmationModal';

describe('ConfirmationModal', () => {
  it('renders correctly when open', () => {
    render(
      <ConfirmationModal 
        isOpen={true} 
        onClose={() => {}} 
        onConfirm={() => {}} 
        title="Confirm Delete" 
        message="Are you sure?" 
      />
    );
    
    expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
  });

  it('renders with warning variant', () => {
    render(
      <ConfirmationModal 
        isOpen={true} 
        onClose={() => {}} 
        onConfirm={() => {}} 
        title="Confirm" 
        message="Message" 
        variant="warning"
      />
    );
    expect(screen.getByText('Confirmar')).toBeInTheDocument();
  });

  it('renders with info variant', () => {
    render(
      <ConfirmationModal 
        isOpen={true} 
        onClose={() => {}} 
        onConfirm={() => {}} 
        title="Confirm" 
        message="Message" 
        variant="info"
      />
    );
    expect(screen.getByText('Confirmar')).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button clicked', () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmationModal 
        isOpen={true} 
        onClose={() => {}} 
        onConfirm={onConfirm} 
        title="Confirm" 
        message="Message" 
      />
    );
    
    fireEvent.click(screen.getByText('Confirmar'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when cancel button clicked', () => {
    const onClose = vi.fn();
    render(
      <ConfirmationModal 
        isOpen={true} 
        onClose={onClose} 
        onConfirm={() => {}} 
        title="Confirm" 
        message="Message" 
      />
    );
    
    fireEvent.click(screen.getByText('Cancelar'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows loading state on confirm button', () => {
    render(
      <ConfirmationModal 
        isOpen={true} 
        onClose={() => {}} 
        onConfirm={() => {}} 
        title="Confirm" 
        message="Message" 
        isLoading={true}
      />
    );
    
    const confirmBtn = screen.getByText('Confirmar').closest('button');
    expect(confirmBtn).toBeDisabled();
  });

  it('uses custom button text', () => {
    render(
      <ConfirmationModal 
        isOpen={true} 
        onClose={() => {}} 
        onConfirm={() => {}} 
        title="Confirm" 
        message="Message" 
        confirmText="Yes, delete it"
        cancelText="No, keep it"
      />
    );
    
    expect(screen.getByText('Yes, delete it')).toBeInTheDocument();
    expect(screen.getByText('No, keep it')).toBeInTheDocument();
  });
});
