import axios from 'axios';
import React, { useState } from 'react';
import { Button, Col, Container, Form, Row } from 'react-bootstrap';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { useNavigate } from 'react-router-dom'; // Pour la navigation
import styled from 'styled-components';

const SignupContainer = styled.div`
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
    background-color: #13856f;
    border-color: #13856f;
  }
`;

function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!name || !email || !password || !confirmPassword || !phone) {
      setError('Tous les champs sont requis.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`http://${process.env.REACT_NKAP_DEMO_API_URL}/api/users/register`, {
        name,
        email,
        phone,
        password,
        passwordConfirm: confirmPassword, // Correspond à ton backend
      });

      const { token } = response.data;
      // localStorage.setItem('authToken', token);

      alert('Inscription réussie !');
      navigate('/home'); // Redirige vers la page d'accueil
    } catch (err) {
      console.error('Erreur lors de l\'inscription:', err);

      if (err.response) {
        // Gestion des erreurs backend
        const errorMessage = err.response.data?.message || 'Erreur lors de l\'inscription.';
        setError(errorMessage);
      } else {
        setError('Impossible de se connecter au serveur. Veuillez réessayer plus tard.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SignupContainer>
      <Container className="mt-5">
        <Row className="justify-content-center">
          <Col md={6}>
            <h2 className="display-4 heading">Inscription</h2>
            <Form onSubmit={handleSubmit}>
              <Form.Group controlId="formName" className="form-group">
                <Form.Label className="form-label">Nom</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Votre nom"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </Form.Group>

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

              <Form.Group controlId="formPhone" className="form-group">
                <Form.Label className="form-label">Téléphone</Form.Label>
                <PhoneInput
                  country={'ca'} // Définit un pays par défaut
                  value={phone}
                  onChange={(value) => setPhone(value)}
                  inputClass="form-control" // Ajoute une classe Bootstrap si nécessaire
                  placeholder="Votre numéro de téléphone"
                  enableSearch={true} // Permet de rechercher un pays
                  onlyCountries={['ca']} // Affiche uniquement les pays spécifiés
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

              <Form.Group controlId="formConfirmPassword" className="form-group">
                <Form.Label className="form-label">Confirmer le mot de passe</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Confirmez votre mot de passe"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </Form.Group>

              {error && <p className="text-danger">{error}</p>}

              <Button type="submit" variant="primary" className="mt-3" disabled={loading}>
                {loading ? 'Chargement...' : "S'inscrire"}
              </Button>
            </Form>

            <div className="mt-3">
              <Button variant="link" onClick={() => navigate('/login')}>
                Déjà un compte ? Connectez-vous
              </Button>
            </div>
          </Col>
        </Row>
      </Container>
    </SignupContainer>
  );
}

export default Signup;
