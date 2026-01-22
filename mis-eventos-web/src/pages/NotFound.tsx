import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export const NotFound = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center space-y-8">
        <div>
          <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-indigo-100 mb-6">
            <svg 
              className="h-12 w-12 text-indigo-600" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
          </div>
          <h2 className="mt-2 text-6xl font-extrabold text-gray-900 tracking-tight sm:text-7xl">
            404
          </h2>
          <p className="mt-4 text-xl font-medium text-gray-900">
            Página no encontrada
          </p>
          <p className="mt-2 text-base text-gray-500">
            Lo sentimos, no pudimos encontrar la página que estás buscando.
          </p>
        </div>
        
        <div className="mt-8 flex justify-center">
          <Link to="/">
            <Button size="lg">
              Volver al Inicio
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
