import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TestProvider } from './context/TestContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import TestCases from './pages/TestCases';
import TestRunner from './pages/TestRunner';
import Reports from './pages/Reports';
import Login from './pages/Login';
import Register from './pages/Register';

const MainApp: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [showRegister, setShowRegister] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (showRegister) {
      return <Register onSwitchToLogin={() => setShowRegister(false)} />;
    }
    return <Login onSwitchToRegister={() => setShowRegister(true)} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} />;
      case 'testcases':
        return <TestCases />;
      case 'runner':
        return <TestRunner />;
      case 'reports':
        return <Reports />;
      default:
        return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  return (
    <TestProvider>
      <div className="min-h-screen bg-slate-50 flex">
        <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
        <div className="ml-64 flex-1">
          {renderPage()}
        </div>
      </div>
    </TestProvider>
  );
};

function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
