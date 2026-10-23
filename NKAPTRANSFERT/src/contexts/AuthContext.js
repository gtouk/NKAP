import React, { createContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export const AuthContext = createContext();

const AUTH_KEYS = [
  'token',
  'refreshToken',
  'userName',
  'userFirstName',
  'userLastName',
  'role',
  'id',
  'status',
  'email',
  'isAuthenticated',
  'jwtToken',
];

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => Boolean(localStorage.getItem('token'))
  );
  const navigate = useNavigate();

  const login = () => {
    setIsAuthenticated(true);
    localStorage.setItem('isAuthenticated', 'true');
  };

  const logout = async () => {
    const token = localStorage.getItem('token');
    try {
      if (token) {
        await api.post('/api/users/logout', { token });
      }
    } catch (error) {
      console.error('Déconnexion distante ignorée', error);
    }
    AUTH_KEYS.forEach((key) => localStorage.removeItem(key));
    setIsAuthenticated(false);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
