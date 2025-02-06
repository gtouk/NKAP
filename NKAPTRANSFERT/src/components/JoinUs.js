import { faChevronDown, faEnvelope, faMapMarkerAlt, faPhone } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState } from 'react';
import { Accordion, Alert, Button, Container } from 'react-bootstrap';
import './Style/Joindre.css';

function JoinUs() {
  const [activeKey, setActiveKey] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const toggleFAQ = (key) => {
    setActiveKey(activeKey === key ? null : key);
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = "Le nom est requis.";
    if (!formData.email) newErrors.email = "L'email est requis.";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Email invalide.";
    if (!formData.subject) newErrors.subject = "L'objet est requis.";
    if (!formData.message) newErrors.message = "Le message est requis.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    try {
      const response = await axios.post('http://localhost:3000/api/transactions/send-mail', formData, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}` // Si vous utilisez l'authentification
        }
      });

      if (response.data.success) {
        setSuccessMessage('Votre message a été envoyé avec succès !');
        setErrorMessage('');
        setFormData({ name: '', email: '', subject: '', message: '' }); // Réinitialiser le formulaire
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      setErrorMessage('Erreur lors de l\'envoi du message. Veuillez réessayer.');
      setSuccessMessage('');
    }
  };

  return (
    <div>
      <Container className="mt-5">
        <div className="container mt-5">
          <div className="row">
            <div className="col-md-6">
              <h2>Contactez Nous</h2>
              {successMessage && <Alert variant="success">{successMessage}</Alert>}
              {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Nom</label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Nom"
                  />
                  {errors.name && <small className="text-danger">{errors.name}</small>}
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    className="form-control"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Email"
                  />
                  {errors.email && <small className="text-danger">{errors.email}</small>}
                </div>
                <div className="form-group">
                  <label>Objet</label>
                  <input
                    type="text"
                    className="form-control"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    placeholder="Objet"
                  />
                  {errors.subject && <small className="text-danger">{errors.subject}</small>}
                </div>
                <div className="form-group">
                  <label>Message</label>
                  <textarea
                    className="form-control"
                    rows="5"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Message"
                  />
                  {errors.message && <small className="text-danger">{errors.message}</small>}
                </div>
                <Button type="submit" className="btn btn-success">
                  <FontAwesomeIcon icon={faEnvelope} className="me-2" />
                  Envoyer
                </Button>
              </form>
            </div>
            <div className="col-md-6">
              <div className="contact-info">
                <h4><FontAwesomeIcon icon={faEnvelope} className="me-2" /> Adresse Email</h4>
                <p>toukamdyvan@gmail.com</p>
                <h4><FontAwesomeIcon icon={faPhone} className="me-2" /> Numéro de téléphone</h4>
                <p>+1 488 546 8936</p>
                <h4><FontAwesomeIcon icon={faMapMarkerAlt} className="me-2" /> Saint-Constant</h4>
                <p>QUEBEC - CANADA</p>
              </div>
            </div>
          </div>
        </div>
        <div className="row mt-5">
          <div className="col-12">
            <h2>FAQ</h2>
            <Accordion activeKey={activeKey} flush>
              <Accordion.Item eventKey="0" onClick={() => toggleFAQ("0")}>
                <Accordion.Header>
                  Est-ce qu'il y a des frais pour faire des transferts d'argent?
                  <FontAwesomeIcon icon={faChevronDown} className="ms-2" />
                </Accordion.Header>
                <Accordion.Body>
                  Non, il n'y a pas de frais pour faire des transferts d'argent. Les frais varient en fonction du montant envoyé et du pays de destination.
                </Accordion.Body>
              </Accordion.Item>
              <Accordion.Item eventKey="1" onClick={() => toggleFAQ("1")}>
                <Accordion.Header>
                  Quelles sont les méthodes valides pour faire des transferts d'argent? (E-transfer, chèque, etc)
                  <FontAwesomeIcon icon={faChevronDown} className="ms-2" />
                </Accordion.Header>
                <Accordion.Body>
                  Vous pouvez utiliser plusieurs méthodes pour faire des transferts d'argent, y compris les virements électroniques (E-transfer), les chèques et d'autres méthodes disponibles selon votre pays.
                </Accordion.Body>
              </Accordion.Item>
              <Accordion.Item eventKey="2" onClick={() => toggleFAQ("2")}>
                <Accordion.Header>
                  Comment est-ce que je peux transférer de l'argent?
                  <FontAwesomeIcon icon={faChevronDown} className="ms-2" />
                </Accordion.Header>
                <Accordion.Body>
                  Pour transférer de l'argent, connectez-vous à votre compte, sélectionnez l'option "Envoyer de l'argent", choisissez le montant et le destinataire, et suivez les instructions pour compléter la transaction.
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>
          </div>
        </div>
      </Container>
    </div>
  );
}

export default JoinUs;