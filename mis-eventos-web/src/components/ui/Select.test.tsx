import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Select } from './Select';

describe('Select', () => {
  const options = [
    { value: '1', label: 'Option 1' },
    { value: '2', label: 'Option 2' },
  ];

  it('renders with placeholder', () => {
    render(
      <Select 
        value="" 
        onChange={() => {}} 
        options={options} 
        placeholder="Select an option" 
      />
    );
    expect(screen.getByText('Select an option')).toBeInTheDocument();
  });

  it('renders selected option label', () => {
    render(
      <Select 
        value="1" 
        onChange={() => {}} 
        options={options} 
      />
    );
    expect(screen.getByText('Option 1')).toBeInTheDocument();
  });

  it('opens options list when clicked', () => {
    render(
      <Select 
        value="" 
        onChange={() => {}} 
        options={options} 
      />
    );
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
  });

  it('calls onChange when option is selected', () => {
    const handleChange = vi.fn();
    render(
      <Select 
        value="" 
        onChange={handleChange} 
        options={options} 
      />
    );
    
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByText('Option 2'));
    
    expect(handleChange).toHaveBeenCalledWith('2');
  });

  it('does not open when disabled', () => {
    render(
      <Select 
        value="" 
        onChange={() => {}} 
        options={options} 
        disabled
      />
    );
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    
    fireEvent.click(button);
    expect(screen.queryByText('Option 1')).not.toBeInTheDocument();
  });

  it('closes when clicking outside', async () => {
    render(
      <Select 
        value="" 
        onChange={() => {}} 
        options={options} 
      />
    );
    
    // Open it
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Option 1')).toBeVisible(); // Using visible check if possible, or just InTheDocument
    
    // Click outside
    fireEvent.mouseDown(document.body);
    
    // Should be closed (options not in document)
    expect(screen.queryByText('Option 1')).not.toBeInTheDocument();
  });
});
