import React from 'react';
import { Link } from 'react-router-dom';

interface DashboardCardProps {
  title: string;
  description: string;
  to: string;
  color?: string;
  icon?: React.ReactNode;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({ title, description, to, color = 'bg-white', icon }) => {
  return (
    <Link 
      to={to} 
      className={`block p-6 ${color} border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 h-full flex flex-col`}
    >
      <div className="flex items-center mb-4">
        {icon && <div className="mr-3 text-indigo-600">{icon}</div>}
        <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900">{title}</h5>
      </div>
      <p className="font-normal text-gray-700 flex-grow">{description}</p>
      <div className="mt-4 flex items-center text-indigo-600 font-medium">
        Acceder
        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
      </div>
    </Link>
  );
};
