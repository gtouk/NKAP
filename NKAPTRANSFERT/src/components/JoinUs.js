import { faChevronDown, faEnvelope, faMapMarkerAlt, faPhone } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import api from '../api';
import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Accordion, Alert, Button, Container } from 'react-bootstrap';
import './Styles/Joindre.css';

function JoinUs() {
  const { t } = useTranslation();
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
    if (!formData.name) newErrors.name = t('nameRequiredError');
    if (!formData.email) newErrors.email = t('emailRequiredError');
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = t('emailInvalid');
    if (!formData.subject) newErrors.subject = t('subjectRequired');
    if (!formData.message) newErrors.message = t('messageRequired');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    try {
      const response = await api.post('/api/transactions/send-mail', formData);

      if (response.data.success) {
        setSuccessMessage(t('messageSent'));
        setErrorMessage('');
        setFormData({ name: '', email: '', subject: '', message: '' }); // Réinitialiser le formulaire
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      setErrorMessage(t('messageError'));
      setSuccessMessage('');
    }
  };

  return (
    <div>
      <Container className="mt-5">
        <div className="container mt-5">
          <div className="row">
            <div className="col-md-6">
              <h2>{t('contactTitle')}</h2>
              {successMessage && <Alert variant="success">{successMessage}</Alert>}
              {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>{t('nameRequired')}</label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder={t('nameRequired')}
                  />
                  {errors.name && <small className="text-danger">{errors.name}</small>}
                </div>
                <div className="form-group">
                  <label>{t('email')}</label>
                  <input
                    type="email"
                    className="form-control"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder={t('email')}
                  />
                  {errors.email && <small className="text-danger">{errors.email}</small>}
                </div>
                <div className="form-group">
                  <label>{t('subject')}</label>
                  <input
                    type="text"
                    className="form-control"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    placeholder={t('subject')}
                  />
                  {errors.subject && <small className="text-danger">{errors.subject}</small>}
                </div>
                <div className="form-group">
                  <label>{t('message')}</label>
                  <textarea
                    className="form-control"
                    rows="5"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder={t('message')}
                  />
                  {errors.message && <small className="text-danger">{errors.message}</small>}
                </div>
                <Button type="submit" className="btn btn-success">
                  <FontAwesomeIcon icon={faEnvelope} className="me-2" />
                  {t('send')}
                </Button>
              </form>
            </div>
            <div className="col-md-6">
              <div className="contact-info">
                <h4><FontAwesomeIcon icon={faEnvelope} className="me-2" /> {t('emailAddress')}</h4>
                <p>toukamdyvan@gmail.com</p>
                <h4><FontAwesomeIcon icon={faPhone} className="me-2" /> {t('phoneNumber')}</h4>
                <p>+1 488 546 8936</p>
                <h4><FontAwesomeIcon icon={faMapMarkerAlt} className="me-2" /> Saint-Constant</h4>
                <p>QUEBEC - CANADA</p>
              </div>
            </div>
          </div>
        </div>
        <div className="row mt-5">
          <div className="col-12">
            <h2>{t('faq')}</h2>
            <Accordion activeKey={activeKey} flush>
              <Accordion.Item eventKey="0" onClick={() => toggleFAQ("0")}>
                <Accordion.Header>
                  {t('faq1q')}
                  <FontAwesomeIcon icon={faChevronDown} className="ms-2" />
                </Accordion.Header>
                <Accordion.Body>
                  {t('faq1a')}
                </Accordion.Body>
              </Accordion.Item>
              <Accordion.Item eventKey="1" onClick={() => toggleFAQ("1")}>
                <Accordion.Header>
                  {t('faq2q')}
                  <FontAwesomeIcon icon={faChevronDown} className="ms-2" />
                </Accordion.Header>
                <Accordion.Body>
                  {t('faq2a')}
                </Accordion.Body>
              </Accordion.Item>
              <Accordion.Item eventKey="2" onClick={() => toggleFAQ("2")}>
                <Accordion.Header>
                  {t('faq3q')}
                  <FontAwesomeIcon icon={faChevronDown} className="ms-2" />
                </Accordion.Header>
                <Accordion.Body>
                  {t('faq3a')}
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