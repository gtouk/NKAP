// ResetPassword.js

import axios from 'axios';
import React, { useState } from 'react';
import { Alert, Button, Form } from 'react-bootstrap';
import { useParams } from 'react-router-dom';

const ResetPassword = () => {
  const { token } = useParams(); // Récupération du token depuis l'URL
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/api/reset-password', { token, password });
      setMessage('Votre mot de passe a été réinitialisé avec succès.');
    } catch (error) {
      setMessage('Une erreur s\'est produite. Essayez à nouveau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Réinitialiser le mot de passe</h2>
      <Form onSubmit={handleSubmit}>
        <Form.Group controlId="formPassword">
          <Form.Label>Nouveau mot de passe</Form.Label>
          <Form.Control
            type="password"
            placeholder="Entrez votre nouveau mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Form.Group>
        {message && <Alert variant="info">{message}</Alert>}
        <Button variant="primary" type="submit" disabled={loading}>
          {loading ? 'Réinitialisation...' : 'Réinitialiser'}
        </Button>
      </Form>
    </div>
  );
};

export default ResetPassword;
