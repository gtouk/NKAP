import axios from 'axios';
import React, { useContext, useState } from 'react';
import { Button, Col, Container, Form, Row } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { AuthContext } from '../contexts/AuthContext';

const LoginContainer = styled.div`
  .form-group {
    margin-bottom: 1rem;
  }
  .form-label {
    margin-bottom: 0.5rem;
    font-weight: bold;
  }
  .btn-primary {
    background-color: #16A085;
    border-color: #16A085;
  }
  .btn-primary:hover {
    background-color: #13856b;
    border-color: #13856b;
  }
`;

function Login({ onLoginSuccess }) {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email || !password) {
      setError('Tous les champs sont requis.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:3000/api/users/login', {
        email,
        password,
      });

      const { message, token, refreshToken, firstName, lastName, role, id, status } = response.data;



      // Stocker les tokens dans localStorage ou dans un state management sécurisé
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('userFirstName', firstName);
      localStorage.setItem('userLastName', lastName);
      localStorage.setItem('role', role);
      localStorage.setItem('email', email);
      localStorage.setItem('id', id);
      localStorage.setItem('status', status);
      login();
      alert(message || 'Connexion réussie !');
      onLoginSuccess(); // Mettre à jour l'état d'authentification si nécessaire
      // navigate('/'); // Redirection vers la page d'accueil
      if (role === 'admin' || role === 'superAdmin') {
        navigate('/adminInterface');
      } else if (role === 'user'){
        navigate('/');
      }else{
        navigate('/');
      }

      if (status === 'blocked') {
        alert("Votre compte est bloqué. Veuillez contacter l'administrateur.");
      }

    } catch (err) {
      let errorMessage = "Erreur lors de la connexion.";

      if (err.response) {
        errorMessage = err.response.data?.message || errorMessage;
        if (err.response.status === 401) {
          errorMessage = "Email ou mot de passe incorrect.";
        } else if (err.response.status === 404) {
          errorMessage = "Utilisateur non trouvé.";
        } else if (err.response.status === 500) {
          errorMessage = "Erreur interne du serveur.";
        }
      } else if (err.request) {
        errorMessage = "Aucune réponse du serveur.";
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginContainer>
      <Container className="mt-5">
        <Row className="justify-content-center">
          <Col md={6}>
            <h2 className="display-4 heading">Connexion</h2>
            <Form onSubmit={handleSubmit}>
              <Form.Group controlId="formEmail" className="form-group">
                <Form.Label className="form-label">Email</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Votre email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Form.Group>
              <Form.Group controlId="formPassword" className="form-group">
                <Form.Label className="form-label">Mot de passe</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Votre mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Form.Group>

              <Form.Text className="text-muted">
                <a href="/mot-de-passe-oublie" style={{ textDecoration: 'none' }}>
                  Mot de passe oublié ?
                </a>
              </Form.Text>
              {error && <p className="text-danger">{error}</p>}
              <Button type="submit" variant="primary" className="mt-3" disabled={loading}>
                {loading ? 'Chargement...' : 'Se connecter'}
              </Button>
            </Form>
            <div className="mt-3">
              <Button variant="link" onClick={() => navigate('/signup')}>
                Pas encore de compte ? Inscrivez-vous
              </Button>
            </div>
          </Col>
        </Row>
      </Container>
    </LoginContainer>
  );
}

export default Login;
