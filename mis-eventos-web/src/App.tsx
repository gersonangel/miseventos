import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Login } from './pages/Login';
import { ProtectedRoute } from './components/ProtectedRoute';
import { EventList } from './pages/EventList';
import { CreateEvent } from './pages/CreateEvent';
import { EventDetail } from './pages/EventDetail';
import { MyRegistrations } from './pages/MyRegistrations';
import { Register } from './pages/Register';
import { Header } from './components/Header';
import { Footer } from './components/Footer';

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
