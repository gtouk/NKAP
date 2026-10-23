import React, { useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api';
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
  const { t } = useTranslation();
  const { login } = useContext(AuthContext);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [mfaToken, setMfaToken] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();

    if ((!identifier && !mfaToken) || (!password && !mfaToken) || (mfaToken && !code)) {
      setError(t('requiredFields'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = mfaToken
        ? await api.post('/api/users/mfa/verify', { mfaToken, code })
        : await api.post('/api/users/login', { email: identifier, phone: identifier, password });

      if (response.data.mfaRequired) {
        setMfaToken(response.data.mfaToken);
        setError('');
        return;
      }

      const { token, refreshToken, firstName, lastName, role, id, status } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('userFirstName', firstName);
      localStorage.setItem('userLastName', lastName);
      localStorage.setItem('userName', firstName);
      localStorage.setItem('role', role);
      localStorage.setItem('email', identifier);
      localStorage.setItem('id', id);
      localStorage.setItem('status', status);
      login();
      onLoginSuccess();
      const staff = ['support', 'compliance', 'finance', 'admin', 'superAdmin'];
      if (role === 'admin' || role === 'superAdmin') {
        navigate('/adminInterface');
      } else if (staff.includes(role)) {
        navigate('/office');
      } else {
        navigate('/');
      }
    } catch (err) {
      let errorMessage = t('loginError');

      if (err.response) {
        errorMessage = err.response.data?.message || errorMessage;
        if (err.response.status === 401) {
          errorMessage = t('wrongCredentials');
        } else if (err.response.status === 403) {
          errorMessage = err.response.data?.message || t('accountBlocked');
        } else if (err.response.status === 404) {
          errorMessage = t('userNotFound');
        } else if (err.response.status === 500) {
          errorMessage = t('serverError');
        }
      } else if (err.request) {
        errorMessage = t('noServer');
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
          <Col md={6} className="auth-card">
            <h2 className="heading">{t('login')}</h2>
            <Form onSubmit={handleSubmit}>
              <Form.Group controlId="formEmail" className="form-group">
                <Form.Label className="form-label">{t('emailOrPhone')}</Form.Label>
                <Form.Control
                  type="text"
                  placeholder={t('emailOrPhone')}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  disabled={Boolean(mfaToken)}
                />
              </Form.Group>
              <Form.Group controlId="formPassword" className="form-group">
                <Form.Label className="form-label">{t('password')}</Form.Label>
                <Form.Control
                  type="password"
                  placeholder={t('yourPassword')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={!mfaToken}
                  disabled={Boolean(mfaToken)}
                />
              </Form.Group>
              {mfaToken && (
                <Form.Group className="form-group">
                  <Form.Label>{t('mfaCode')}</Form.Label>
                  <p>{t('mfaHelp')}</p>
                  <Form.Control value={code} onChange={(e) => setCode(e.target.value)} required />
                </Form.Group>
              )}

              <div className="d-flex justify-content-end">
                <Button variant="link" className="p-0" type="button" onClick={() => navigate('/mot-de-passe-oublie')}>
                  {t('forgotPassword')}
                </Button>
              </div>
              {error && <p className="text-danger mb-0">{error}</p>}
              <Button type="submit" variant="primary" className="mt-3 w-100" disabled={loading}>
                {loading ? t('loading') : t('signIn')}
              </Button>
            </Form>
            <div className="mt-3">
              <Button variant="link" onClick={() => navigate('/signup')}>
                {t('noAccount')}
              </Button>
            </div>
          </Col>
        </Row>
      </Container>
    </LoginContainer>
  );
}

export default Login;
