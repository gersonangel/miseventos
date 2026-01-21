import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { ProtectedRoute } from './components/ProtectedRoute';
import { EventList } from './pages/EventList';
import { CreateEvent } from './pages/CreateEvent';
import { EventDetail } from './pages/EventDetail';
import { MyRegistrations } from './pages/MyRegistrations';
import { Register } from './pages/Register';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { logout } = useAuth();
  return (
    <div>
      <nav className="bg-gray-800 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/" className="text-white text-xl font-bold">Mis Eventos</Link>
          <div className="space-x-4">
            <Link to="/" className="text-gray-300 hover:text-white">Eventos</Link>
            <Link to="/my-events" className="text-gray-300 hover:text-white">Mis Inscripciones</Link>
            <button onClick={logout} className="text-gray-300 hover:text-white">Cerrar Sesión</button>
          </div>
        </div>
      </nav>
      <main>
        {children}
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Layout><EventList /></Layout>} />
            <Route path="/events/new" element={<Layout><CreateEvent /></Layout>} />
            <Route path="/events/:id" element={<Layout><EventDetail /></Layout>} />
            <Route path="/my-events" element={<Layout><MyRegistrations /></Layout>} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
