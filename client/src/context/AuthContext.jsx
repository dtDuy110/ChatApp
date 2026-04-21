import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    return token && username ? { token, username } : null;
  });

  function login(token, username) {
    localStorage.setItem('token', token);
    localStorage.setItem('username', username);
    setAuth({ token, username });
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setAuth(null);
  }

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
