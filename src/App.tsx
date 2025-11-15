import { useState, useEffect } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { supabase } from './lib/supabase';
import { ServiceContainer } from './services-new';
import { Dashboard } from './pages/Dashboard';
import { ArchitectureDocumentation } from './pages/ArchitectureDocumentation';
import { MedicalRecords } from './pages/MedicalRecords';
import { LoginForm } from './components/LoginForm';

const services = new ServiceContainer(supabase);

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'documentation' | 'medical-records'>('dashboard');

  useEffect(() => {
    services.auth.getCurrentSession().then(session => {
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch(err => {
      console.error('Error loading session:', err);
      setLoading(false);
    });

    const { data } = services.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      data?.subscription?.unsubscribe();
    };
  }, []);

  const handleSignIn = async (email: string, password: string) => {
    await services.auth.signIn(email, password);
  };

  const handleSignUp = async (email: string, password: string) => {
    await services.auth.signUp(email, password);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-white text-xl">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      {user ? (
        <div className="min-h-screen bg-slate-950">
          {/* Navigation */}
          <nav className="bg-slate-900 border-b border-slate-800">
            <div className="max-w-7xl mx-auto px-6">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center gap-6">
                  <h1 className="text-xl font-bold text-white">Personal Medical Record</h1>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage('dashboard')}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        currentPage === 'dashboard'
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      Dashboard
                    </button>
                    <button
                      onClick={() => setCurrentPage('medical-records')}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        currentPage === 'medical-records'
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      Medical Records
                    </button>
                    <button
                      onClick={() => setCurrentPage('documentation')}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        currentPage === 'documentation'
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      Documentation
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => services.auth.signOut()}
                  className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </nav>

          {/* Content */}
          {currentPage === 'dashboard' && <Dashboard />}
          {currentPage === 'medical-records' && <MedicalRecords />}
          {currentPage === 'documentation' && <ArchitectureDocumentation />}
        </div>
      ) : (
        <LoginForm onSignIn={handleSignIn} onSignUp={handleSignUp} />
      )}
    </ErrorBoundary>
  );
}

export default App;
