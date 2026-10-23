import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

const PrivateRoute = () => {
  const { isAuthenticated } = useContext(AuthContext);
  const token = localStorage.getItem('token');
  return isAuthenticated && token ? <Outlet /> : <Navigate to="/login" />;
};

export const StaffRoute = () => {
  const { isAuthenticated } = useContext(AuthContext);
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const staff = ['support', 'compliance', 'finance', 'admin', 'superAdmin'];
  if (!isAuthenticated || !token) return <Navigate to="/login" />;
  if (!staff.includes(role)) return <Navigate to="/" />;
  return <Outlet />;
};

export const AdminRoute = () => {
  const { isAuthenticated } = useContext(AuthContext);
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  if (!isAuthenticated || !token) return <Navigate to="/login" />;
  if (role !== 'admin' && role !== 'superAdmin') return <Navigate to="/" />;
  return <Outlet />;
};

export default PrivateRoute;
