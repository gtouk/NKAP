// ForgotPassword.js

import axios from 'axios';
import React, { useState } from 'react';
import { Alert, Button, Form } from 'react-bootstrap';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Envoi de l'email au backend pour traitement
      await axios.post('/api/forgot-password', { email });
      setMessage('Un email de réinitialisation vous a été envoyé.');
    } catch (error) {
      setMessage('Une erreur s\'est produite. Essayez à nouveau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Mot de passe oublié</h2>
      <Form onSubmit={handleSubmit}>
        <Form.Group controlId="formEmail">
          <Form.Label>Email</Form.Label>
          <Form.Control
            type="email"
            placeholder="Entrez votre email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Form.Group>
        {message && <Alert variant="info">{message}</Alert>}
        <Button variant="primary" type="submit" disabled={loading}>
          {loading ? 'Envoi...' : 'Envoyer'}
        </Button>
      </Form>
    </div>
  );
};

export default ForgotPassword;
