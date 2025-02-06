import '@fortawesome/fontawesome-free/css/all.min.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState } from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Account from './components/Account';
import AddAdmin from './components/admin/AddAdmin';
import Facture from './components/Facture';
import ForgotPassword from './components/ForgotPassword';
import Home from './components/Home';
import JoinUs from './components/JoinUs';
import Layout from './components/Layout';
import Login from './components/Login';
import LogoutButton from './components/Logout';
import PrivateRoute from './components/PrivateRoute';
import Profile from './components/Profile';
import Recipients from './components/Recipients';
import ReferAFriend from './components/ReferAFriend';
import ResetPassword from './components/ResetPassword';
import Signup from './components/SignUp';
import TransactionHistory from './components/TransactionHistory';
import Transfer from './components/Transfer';
import { AuthProvider } from './contexts/AuthContext';


function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Simuler l'authentification après un login réussi
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    const storedUserName = localStorage.getItem('userName');
    if (storedUserName) {
      console.log('Nom d\'utilisateur après connexion:', storedUserName); // Vérifiez si le nom est récupéré
    }
  };
  



  return (

    <Router>      
    <AuthProvider>
      <Layout>
        <Routes>
          <Route path="/home" element={<Home />} />
          <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess}/>} />
          <Route path="/mot-de-passe-oublie" component={ForgotPassword} />
          <Route path="/reset-password/:token" component={ResetPassword} />
          <Route path="/add-admin" element={<AddAdmin />} />
          
          
          {/* Regrouper toutes les routes protégées sous PrivateRoute */}
          <Route element={<PrivateRoute/>}>
            <Route path="/transfer" element={<Transfer />} />
            <Route path="/pay" element={<Facture />} />
            <Route path="/contact" element={<JoinUs />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/history" element={<TransactionHistory />} />
            <Route path="/recipients" element={<Recipients />} />
            <Route path="/account" element={<Account />} />
            <Route path="/refer-a-friend" element={<ReferAFriend />} />
          </Route>

          {/* Route pour l'inscription */}
          {/* <Route path="/logout" element={<LogoutButton/>}/> */}
          <Route path="/logout" element={<LogoutButton />} />
          <Route path="/signup" element={<Signup />} />
        </Routes>
      </Layout>
    </AuthProvider>
    </Router>

  );
}

export default App;
