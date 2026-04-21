import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Chat from './pages/Chat';

function AppContent() {
  const { auth } = useAuth();
  const [showRegister, setShowRegister] = useState(false);

  if (auth) return <Chat />;
  if (showRegister) return <Register onSwitch={() => setShowRegister(false)} />;
  return <Login onSwitch={() => setShowRegister(true)} />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
