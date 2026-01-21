import { Link } from 'react-router-dom';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface BackButtonProps {
  to?: string;
  className?: string;
}

export const BackButton = ({ to = "/", className }: BackButtonProps) => {
  return (
    <Link 
      to={to} 
      className={cn(
        "p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors inline-flex items-center justify-center",
        className
      )}
      aria-label="Volver"
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className="h-6 w-6" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M10 19l-7-7m0 0l7-7m-7 7h18" 
        />
      </svg>
    </Link>
  );
};
