import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { NotFound } from './NotFound';

describe('NotFound Page', () => {
    it('renders 404 message', () => {
        render(
            <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <NotFound />
            </MemoryRouter>
        );
        expect(screen.getByText('404')).toBeInTheDocument();
        expect(screen.getByText('Página no encontrada')).toBeInTheDocument();
        expect(screen.getByText('Lo sentimos, no pudimos encontrar la página que estás buscando.')).toBeInTheDocument();
    });

    it('renders back to home link', () => {
        render(
            <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <NotFound />
            </MemoryRouter>
        );
        const link = screen.getByRole('link', { name: /Volver al Inicio/i });
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute('href', '/');
    });
});
