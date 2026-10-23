import React, { useState } from 'react';
import { Alert, Button, Form } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import api from '../api';

const ForgotPassword = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/api/users/forgot-password', { email });
      setMessage(response.data.resetLink
        ? `${t('forgotSent')} ${response.data.resetLink}`
        : (response.data.message || t('forgotSent')));
    } catch (error) {
      setMessage(t('forgotError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel auth-card" style={{ maxWidth: 520, margin: '0 auto' }}>
      <h2>{t('forgotTitle')}</h2>
      <p>{t('forgotHelp')}</p>
      <Form onSubmit={handleSubmit}>
        <Form.Group controlId="formEmail">
          <Form.Label>{t('email')}</Form.Label>
          <Form.Control
            type="email"
            placeholder={t('yourEmail')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Form.Group>
        {message && <Alert variant="info">{message}</Alert>}
        <Button variant="primary" type="submit" disabled={loading}>
          {loading ? t('loading') : t('send')}
        </Button>
      </Form>
    </div>
  );
};

export default ForgotPassword;
