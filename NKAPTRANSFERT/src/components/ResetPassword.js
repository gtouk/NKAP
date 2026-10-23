import React, { useState } from 'react';
import { Alert, Button, Form } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import api from '../api';

const ResetPassword = () => {
  const { t } = useTranslation();
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/api/users/reset-password', { token, password });
      setMessage(response.data.message || t('passwordUpdated'));
    } catch (error) {
      setMessage(error.response?.data?.message || t('forgotError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel auth-card" style={{ maxWidth: 520, margin: '0 auto' }}>
      <h2>{t('resetTitle')}</h2>
      <Form onSubmit={handleSubmit}>
        <Form.Group controlId="formPassword">
          <Form.Label>{t('newPassword')}</Form.Label>
          <Form.Control
            type="password"
            placeholder={t('enterNewPassword')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Form.Group>
        {message && <Alert variant="info">{message}</Alert>}
        <Button variant="primary" type="submit" disabled={loading}>
          {loading ? t('resetting') : t('resetAction')}
        </Button>
      </Form>
    </div>
  );
};

export default ResetPassword;
