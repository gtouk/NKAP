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
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [country, setCountry] = useState('CANADA');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!firstName || !lastName || !email ||!gender ||!birthDate || !country || !street ||!city || !postalCode || !password || !confirmPassword || !phone) {
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
       await axios.post('http://localhost:3000/api/users/register', {
        firstName,
        lastName,
        email,
        gender,
        birthDate,
        country,
        street,
        city,
        postalCode,
        phone,
        password,
        confirmPassword, // Correspond à ton backend
      });
      console.log({
        firstName,
        lastName,
        email,
        gender,
        birthDate,
        country,
        street,
        city,
        postalCode,
        phone,
        password,
        confirmPassword
      });
      

      // const { token } = response.data;
      // localStorage.setItem('authToken', token);

      alert('Inscription réussie !');
      navigate('/'); // Redirige vers la page d'accueil
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
              <Form.Group controlId="formFirstName" className="form-group">
                <Form.Label className="form-label">Nom</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Votre Prenom"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </Form.Group>

              <Form.Group controlId="formLastName" className="form-group">
                <Form.Label className="form-label">Nom</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Votre nom"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
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

              {/* Country */}
              <Form.Group controlId="formCountry" className="form-group">
                <Form.Label className="form-label">Pays de Residence</Form.Label>
                <Form.Control
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  required
                  readOnly
                />
              </Form.Group>

              {/* Sexe */}
              <Form.Group controlId="formGender" className="form-group">
                <Form.Label className="form-label">Sexe</Form.Label>
                <Form.Control
                  as="select"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  required
                >
                  <option value="">Sélectionnez votre sexe</option>
                  <option value="male">Homme</option>
                  <option value="female">Femme</option>
                  <option value="other">Autre</option>
                </Form.Control>
              </Form.Group>

              {/* Date de naissance */}
              <Form.Group controlId="formBirthDate" className="form-group">
                <Form.Label className="form-label">Date de naissance</Form.Label>
                <Form.Control
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  required
                />
              </Form.Group>

              {/* Adresse */}
              <Form.Group controlId="formStreet" className="form-group">
                <Form.Label className="form-label">Rue</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Votre rue"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  required
                />
              </Form.Group>

              <Form.Group controlId="formCity" className="form-group">
                <Form.Label className="form-label">Ville</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Votre ville"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                />
              </Form.Group>

              <Form.Group controlId="formPostalCode" className="form-group">
                <Form.Label className="form-label">Code postal</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Votre code postal"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
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
