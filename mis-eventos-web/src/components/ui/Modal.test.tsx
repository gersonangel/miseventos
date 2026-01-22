import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Modal } from './Modal';

describe('Modal', () => {
  it('does not render when isOpen is false', () => {
    render(
      <Modal isOpen={false} onClose={() => {}} title="Test Modal">
        <p>Modal Content</p>
      </Modal>
    );
    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
  });

  it('renders correctly when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal">
        <p>Modal Content</p>
      </Modal>
    );
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal Content')).toBeInTheDocument();
  });

  it('calls onClose when clicking backdrop', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Test Modal">
        <p>Modal Content</p>
      </Modal>
    );
    // The backdrop is the first div with fixed inset-0
    // We can find it by looking for the one that has the onClick handler
    // But testing-library encourages user-centric queries.
    // The backdrop doesn't have a role, but we can assume it's the container that covers screen.
    // Alternatively, we can check the implementation: it has onClick={onClose}
    // Let's try to click the element that might be the backdrop.
    // Given the structure, it might be hard to query by role.
    // Let's assign a data-testid to the backdrop in the component if possible, 
    // but I am not supposed to modify code unless necessary.
    // The backdrop has class 'bg-gray-500 bg-opacity-75'.
    // Or we can rely on the fact it's the parent of the modal content? No, it's a sibling wrapper.
    // Actually, looking at the code:
    // <div className="fixed inset-0 bg-gray-500..." onClick={onClose}></div>
    
    // We can query by class name using container.querySelector, though discouraged.
    const { container } = render(
      <Modal isOpen={true} onClose={onClose} title="Test Modal">
        <p>Content</p>
      </Modal>
    );
    
    const backdrop = container.querySelector('.bg-gray-500.bg-opacity-75');
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(onClose).toHaveBeenCalledTimes(1);
    } else {
      throw new Error('Backdrop not found');
    }
  });

  it('calls onClose when clicking default footer Close button', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Test Modal">
        <p>Content</p>
      </Modal>
    );
    
    fireEvent.click(screen.getByText('Cerrar'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders custom footer', () => {
    render(
      <Modal 
        isOpen={true} 
        onClose={() => {}} 
        title="Test Modal"
        footer={<button>Custom Action</button>}
      >
        <p>Content</p>
      </Modal>
    );
    
    expect(screen.getByText('Custom Action')).toBeInTheDocument();
    expect(screen.queryByText('Cerrar')).not.toBeInTheDocument();
  });
});
