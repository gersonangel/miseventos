import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Login } from './pages/Login';
import { ProtectedRoute } from './components/ProtectedRoute';
import { EventList } from './pages/EventList';
import { CreateEvent } from './pages/CreateEvent';
import { EventDetail } from './pages/EventDetail';
import { Register } from './pages/Register';
import { Home } from './pages/Home';
import { UsersList } from './pages/UsersList';
import { Sessions } from './pages/Sessions';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { UserRole } from './types';
import { EventStatus } from './types/event';
import { NotFound } from './pages/NotFound';

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>
      <Footer />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Rutas accesibles para todos los usuarios autenticados */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Layout><Home /></Layout>} />
            <Route path="/my-events" element={<Layout><EventList hideCreateButton={true} fixedStatus={EventStatus.PUBLISHED} /></Layout>} />
            <Route path="/my-events/:id" element={<Layout><EventDetail /></Layout>} />
          </Route>

          {/* Rutas restringidas a Admin y Organizer */}
          <Route element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.ORGANIZER]} />}>
            <Route path="/events" element={<Layout><EventList /></Layout>} />
            <Route path="/events/new" element={<Layout><CreateEvent /></Layout>} />
            <Route path="/events/:id" element={<Layout><EventDetail /></Layout>} />
            <Route path="/users" element={<Layout><UsersList /></Layout>} />
            <Route path="/sessions" element={<Layout><Sessions /></Layout>} />
          </Route>

          {/* Ruta 404 - Debe ir al final */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
