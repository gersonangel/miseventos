import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Pagination } from './Pagination';

describe('Pagination', () => {
  it('renders pagination info correctly', () => {
    render(
      <Pagination 
        currentPage={1} 
        totalPages={10} 
        onPageChange={() => {}} 
        totalItems={100}
        pageSize={10}
      />
    );
    
    // 1-10 of 100
    // Use regex for partial match as text is split across spans
    expect(screen.getByText(/Mostrando/)).toBeInTheDocument();
    // Use getAllByText for numbers as they might appear in multiple places (pagination + select)
    expect(screen.getAllByText('1')[0]).toBeInTheDocument();
    expect(screen.getAllByText('10')[0]).toBeInTheDocument();
    expect(screen.getAllByText('100')[0]).toBeInTheDocument();
  });

  it('calls onPageChange when clicking next', () => {
    const handlePageChange = vi.fn();
    render(
      <Pagination 
        currentPage={1} 
        totalPages={10} 
        onPageChange={handlePageChange} 
      />
    );
    
    // Use getAllByText because there are multiple buttons (mobile + desktop) with "Siguiente"
    const nextBtns = screen.getAllByText('Siguiente');
    fireEvent.click(nextBtns[0]);
    
    expect(handlePageChange).toHaveBeenCalledWith(2);
  });

  it('calls onPageChange when clicking previous', () => {
    const handlePageChange = vi.fn();
    render(
      <Pagination 
        currentPage={2} 
        totalPages={10} 
        onPageChange={handlePageChange} 
      />
    );
    
    const prevBtns = screen.getAllByText('Anterior');
    fireEvent.click(prevBtns[0]);
    
    expect(handlePageChange).toHaveBeenCalledWith(1);
  });

  it('disables previous button on first page', () => {
    render(
      <Pagination 
        currentPage={1} 
        totalPages={10} 
        onPageChange={() => {}} 
      />
    );
    
    const prevBtns = screen.getAllByText('Anterior');
    // Check all of them or just one. All should be disabled.
    prevBtns.forEach(el => {
      const btn = el.closest('button');
      expect(btn).toBeDisabled();
    });
  });

  it('disables next button on last page', () => {
    render(
      <Pagination 
        currentPage={10} 
        totalPages={10} 
        onPageChange={() => {}} 
      />
    );
    
    const nextBtns = screen.getAllByText('Siguiente');
    nextBtns.forEach(el => {
      const btn = el.closest('button');
      expect(btn).toBeDisabled();
    });
  });

  it('calls onPageSizeChange when changing page size', () => {
    const handleSizeChange = vi.fn();
    const handlePageChange = vi.fn();
    
    render(
      <Pagination 
        currentPage={1} 
        totalPages={10} 
        onPageChange={handlePageChange}
        onPageSizeChange={handleSizeChange}
        pageSize={10}
      />
    );
    
    // The select is inside. We need to find the button that opens the select.
    // The Select component uses a button with the current value.
    // Use getAllByRole to find buttons, and filter for the one that has text '10'
    const buttons = screen.getAllByRole('button');
    const selectTrigger = buttons.find(btn => btn.textContent?.includes('10'));
    
    if (!selectTrigger) throw new Error('Select trigger not found');
    
    fireEvent.click(selectTrigger);
    
    // Select option 50
    // Option 50 should be visible now. Use getAllByText just in case.
    const option50 = screen.getAllByText('50')[0];
    fireEvent.click(option50);
    
    expect(handleSizeChange).toHaveBeenCalledWith(50);
    expect(handlePageChange).toHaveBeenCalledWith(1);
  });
});
