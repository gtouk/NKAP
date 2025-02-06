import React, { createContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext();


export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem("isAuthenticated") === "true"
  );
  const navigate = useNavigate();
  


  // Vérifier l'authentification au chargement de l'application
  useEffect(() => {
    console.log("🔵 Auth State Updated: isAuthenticated =", isAuthenticated);
  }, [isAuthenticated]);

  // Fonction pour gérer la connexion
  const login = () => {
    console.log("🟢 login() appelé !");
    setIsAuthenticated(true);
    localStorage.setItem("isAuthenticated", "true");
  };

  // Fonction pour gérer la déconnexion
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userName');
    localStorage.removeItem('role');
    localStorage.removeItem('id');
    console.log("🟢 logout() appelé !");
    setIsAuthenticated(false);
    navigate('/login');
    localStorage.removeItem("isAuthenticated");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};