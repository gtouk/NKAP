import React, { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

const LogoutButton = () => {
  const { logout } = useContext(AuthContext);

  return (
    <button type="button" onClick={logout} className="btn btn-danger">
      Déconnexion
    </button>
  );
};

export default LogoutButton;
