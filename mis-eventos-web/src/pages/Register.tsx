import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import miseventosLogo from '../assets/miseventos.png';
import { api } from '../lib/axios';

export const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName && !email && !password) {
      setError('Todos los campos son requeridos');
      return;
    }
    if (!fullName) {
      setError('El nombre completo es requerido');
      return;
    }
    if (!email) {
      setError('El email es requerido');
      return;
    }
    if (!password) {
      setError('La contraseña es requerida');
      return;
    }
    
    try {
      await api.post('/auth/register', {
        email,
        password,
        full_name: fullName,
      });

      navigate('/login');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error(err);
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (Array.isArray(detail)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setError(detail.map((e: any) => e.msg).join(', '));
        } else {
          setError(detail);
        }
      } else {
        setError('Error al registrarse');
      }
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="sm:mx-auto sm:w-full sm:max-w-sm mb-6 flex flex-col items-center">
             <img src={miseventosLogo} alt="MisEventos" className="h-12 w-auto mb-4" />
            <h2 className="text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
              Crear cuenta nueva
            </h2>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium leading-6 text-gray-900">
                Nombre Completo <span className="text-red-500">*</span>
              </label>
              <div className="mt-2">
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="Nombre completo"
                  className="block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Correo electrónico"
                  className="block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">
                Contraseña <span className="text-red-500">*</span>
              </label>
              <div className="mt-2">
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Contraseña"
                  className="block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="min-h-[20px] text-red-500 text-sm font-semibold">
              {error}
            </div>

            <div>
              <button
                type="submit"
                className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Registrarse
              </button>
            </div>
          </form>

          <p className="mt-10 text-center text-sm text-gray-500">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="font-semibold leading-6 text-indigo-600 hover:text-indigo-500">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
