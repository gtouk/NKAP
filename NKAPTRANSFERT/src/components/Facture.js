import { faInfoCircle, faMoneyBillWave } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { Button, Col, Form, InputGroup, Row } from 'react-bootstrap';
import './Styles/Facture.css';

const countryCurrencyMap = {
  Canada: { currency: 'CAD', receivingCountry: 'cameroun' },
  cameroun: { currency: 'XAF', receivingCountry: 'Canada' },
  'Cote d\'ivoire': { currency: 'XOF', receivingCountry: 'France' },
};

function Facture() {
  const [country, setCountry] = useState('');
  const [currency, setCurrency] = useState('');
  const [receivingCountry, setReceivingCountry] = useState('');
  const [amountToSend, setAmountToSend] = useState(0);
  const [amountToReceive, setAmountToReceive] = useState(0);
  const [fees, setFees] = useState(0);
  const [totalToPay, setTotalToPay] = useState(0);
  const exchangeRate = 450;

  useEffect(() => {
    if (country && countryCurrencyMap[country]) {
      const { currency, receivingCountry } = countryCurrencyMap[country];
      setCurrency(currency);
      setReceivingCountry(receivingCountry);
    } else {
      setCurrency('');
      setReceivingCountry('');
    }
  }, [country]);

  useEffect(() => {
    if (country === 'Canada') {
      setAmountToReceive(amountToSend * exchangeRate);
    } else if (country === 'cameroun') {
      setAmountToReceive(amountToSend / exchangeRate);
    } else {
      setAmountToReceive(0);
    }
    const calculatedFees = amountToSend * 0.01;
    setFees(calculatedFees);
    setTotalToPay(amountToSend + calculatedFees);
  }, [amountToSend, country]);

  const handleCountryChange = (event) => {
    const selectedCountry = event.target.value;
    setCountry(selectedCountry);
  };

  const formatCurrency = (amount, currency) => {
    if (!currency) return amount;
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    // Rassembler les données du formulaire
    const formData = {
      name: event.target.formName.value,
      phone: event.target.formPhone.value,
      email: event.target.formEmail.value,
      country: country,
      amountToSend: amountToSend,
      currency: currency,
      details: event.target.formDetails.value,
    };

    // Envoi des données au backend via POST
    axios.post('/api/facture', formData)
      .then((response) => {
        console.log('Réponse du serveur :', response.data);
        // Afficher un message de succès ou rediriger l'utilisateur, etc.
      })
      .catch((error) => {
        console.error('Erreur lors de l\'envoi des données :', error);
        // Afficher un message d'erreur à l'utilisateur
      });
  };

  return (
    <div>
      <div className="container mt-5">
        <h2>Payer Une Facture Ou Frais De Scolarité</h2>
        <Form onSubmit={handleSubmit}>
          <Form.Group controlId="formName">
            <Form.Label className="form-label">Nom *</Form.Label>
            <Form.Control type="text" placeholder="Entrez votre nom" required />
          </Form.Group>

          <Row>
            <Col md={6}>
              <Form.Group controlId="formPhone">
                <Form.Label className="form-label">Téléphone *</Form.Label>
                <Form.Control type="tel" placeholder="Entrez votre téléphone" required />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="formEmail">
                <Form.Label className="form-label">Email *</Form.Label>
                <Form.Control type="email" placeholder="Entrez votre email" required />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group controlId="formCountry">
            <Form.Label className="form-label">Pays du fournisseur ou de l'institution *</Form.Label>
            <Form.Control as="select" value={country} onChange={handleCountryChange} required>
              <option value="">Choisissez...</option>
              {Object.keys(countryCurrencyMap).map((country) => (
                <option key={country} value={country}>{country}</option>
              ))}
            </Form.Control>
          </Form.Group>

          <Row>
            <Col md={6}>
              <Form.Group controlId="formAmount">
                <Form.Label className="form-label">Montant *</Form.Label>
                <InputGroup>
                  <InputGroup.Text><FontAwesomeIcon icon={faMoneyBillWave} /></InputGroup.Text>
                  <Form.Control
                    type="number"
                    placeholder="Entrez le montant"
                    value={amountToSend}
                    onChange={(e) => setAmountToSend(parseFloat(e.target.value) || 0)}
                    required
                  />
                </InputGroup>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="formCurrency">
                <Form.Label className="form-label">Devise *</Form.Label>
                <Form.Control as="select" value={currency} readOnly required>
                  <option>{currency}</option>
                </Form.Control>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group controlId="formDetails">
            <Form.Label className="form-label">Veuillez fournir plus de précisions *</Form.Label>
            <InputGroup>
              <InputGroup.Text><FontAwesomeIcon icon={faInfoCircle} /></InputGroup.Text>
              <Form.Control as="textarea" rows={3} required />
            </InputGroup>
          </Form.Group>

          <Button className="button" type="submit">
            Envoyer
          </Button>
        </Form>
      </div>
    </div>
  );
}

export default Facture;
