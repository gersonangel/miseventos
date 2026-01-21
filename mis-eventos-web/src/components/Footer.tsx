
export const Footer = () => {
  return (
    <footer className="bg-gray-800 text-gray-300 py-6 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm">
              &copy; {new Date().getFullYear()} Mis Eventos. Todos los derechos reservados.
            </p>
          </div>
          <div className="flex space-x-4">
            <a href="#" className="hover:text-white transition-colors text-sm">Términos</a>
            <a href="#" className="hover:text-white transition-colors text-sm">Privacidad</a>
            <a href="https://www.linkedin.com/in/gerson-yesid-angel-avila-522382150/" target="_blank" className="hover:text-white transition-colors text-sm">@gersonangel</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
