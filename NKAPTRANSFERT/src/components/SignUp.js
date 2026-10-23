import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api';
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
  const { t } = useTranslation();
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
      setError(t('requiredFields'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('passwordMismatch'));
      return;
    }

    setLoading(true);
    setError('');

    try {
       await api.post('/api/users/register', {
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

      navigate('/login');
    } catch (err) {
      console.error('Erreur lors de l\'inscription:', err);

      if (err.response) {
        // Gestion des erreurs backend
        const errorMessage = err.response.data?.message || t('signupFailed');
        setError(errorMessage);
      } else {
        setError(t('cannotReachServer'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SignupContainer>
      <Container className="mt-5">
        <Row className="justify-content-center">
          <Col md={6} className="auth-card">
            <h2 className="heading">{t('signup')}</h2>
            <Form onSubmit={handleSubmit}>
              <Form.Group controlId="formFirstName" className="form-group">
                <Form.Label className="form-label">{t('firstName')}</Form.Label>
                <Form.Control
                  type="text"
                  placeholder={t('yourFirstName')}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </Form.Group>

              <Form.Group controlId="formLastName" className="form-group">
                <Form.Label className="form-label">{t('lastName')}</Form.Label>
                <Form.Control
                  type="text"
                  placeholder={t('yourLastName')}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </Form.Group>

              <Form.Group controlId="formEmail" className="form-group">
                <Form.Label className="form-label">{t('email')}</Form.Label>
                <Form.Control
                  type="email"
                  placeholder={t('yourEmail')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Form.Group>

              {/* Country */}
              <Form.Group controlId="formCountry" className="form-group">
                <Form.Label className="form-label">{t('residenceCountry')}</Form.Label>
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
                <Form.Label className="form-label">{t('gender')}</Form.Label>
                <Form.Control
                  as="select"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  required
                >
                  <option value="">{t('selectGender')}</option>
                  <option value="male">{t('genderMale')}</option>
                  <option value="female">{t('genderFemale')}</option>
                  <option value="other">{t('genderOther')}</option>
                </Form.Control>
              </Form.Group>

              {/* Date de naissance */}
              <Form.Group controlId="formBirthDate" className="form-group">
                <Form.Label className="form-label">{t('birthDate')}</Form.Label>
                <Form.Control
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  required
                />
              </Form.Group>

              {/* Adresse */}
              <Form.Group controlId="formStreet" className="form-group">
                <Form.Label className="form-label">{t('street')}</Form.Label>
                <Form.Control
                  type="text"
                  placeholder={t('yourStreet')}
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  required
                />
              </Form.Group>

              <Form.Group controlId="formCity" className="form-group">
                <Form.Label className="form-label">{t('city')}</Form.Label>
                <Form.Control
                  type="text"
                  placeholder={t('yourCity')}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                />
              </Form.Group>

              <Form.Group controlId="formPostalCode" className="form-group">
                <Form.Label className="form-label">{t('postalCode')}</Form.Label>
                <Form.Control
                  type="text"
                  placeholder={t('yourPostalCode')}
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  required
                />
              </Form.Group>

              <Form.Group controlId="formPhone" className="form-group">
                <Form.Label className="form-label">{t('phone')}</Form.Label>
                <PhoneInput
                  country={'ca'} // Définit un pays par défaut
                  value={phone}
                  onChange={(value) => setPhone(value)}
                  inputClass="form-control" // Ajoute une classe Bootstrap si nécessaire
                  placeholder={t('yourPhone')}
                  enableSearch={true} // Permet de rechercher un pays
                  onlyCountries={['ca']} // Affiche uniquement les pays spécifiés
                />
              </Form.Group>


              <Form.Group controlId="formPassword" className="form-group">
                <Form.Label className="form-label">{t('password')}</Form.Label>
                <Form.Control
                  type="password"
                  placeholder={t('yourPassword')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Form.Group>

              <Form.Group controlId="formConfirmPassword" className="form-group">
                <Form.Label className="form-label">{t('confirmPassword')}</Form.Label>
                <Form.Control
                  type="password"
                  placeholder={t('confirmYourPassword')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </Form.Group>

              {error && <p className="text-danger">{error}</p>}

              <Button type="submit" variant="primary" className="mt-3" disabled={loading}>
                {loading ? t('loading') : t('signUpAction')}
              </Button>
            </Form>

            <div className="mt-3">
              <Button variant="link" onClick={() => navigate('/login')}>
                {t('hasAccount')}
              </Button>
            </div>
          </Col>
        </Row>
      </Container>
    </SignupContainer>
  );
}

export default Signup;
