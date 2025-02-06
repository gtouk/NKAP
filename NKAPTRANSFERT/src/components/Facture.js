import { faInfoCircle, faMoneyBillWave } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import axios from 'axios';
import React, { useState } from 'react';
import { Button, Col, Form, InputGroup, Row } from 'react-bootstrap';
import './Style/Facture.css';

const countryCurrencyMap = {
  Canada: { currency: 'CAD', receiveCountry: 'cameroun' },
  cameroun: { currency: 'XAF', receiveCountry: 'Canada' },
  'Cote d\'ivoire': { currency: 'XOF', receiveCountry: 'France' },
};

function Facture() {
  const [country, setCountry] = useState('');
  const [currency, setCurrency] = useState('');
  // const [receiveCountry, setReceiveCountry] = useState('');
  const [sendAmount, setSendAmount] = useState(0);
  // const [receiveAmount, setReceiveAmount] = useState(0);
  // const [fees, setFees] = useState(0);
  // const [totalToPay, setTotalToPay] = useState(0);
  // const exchangeRate = 450;

  // useEffect(() => {
  //   if (country && countryCurrencyMap[country]) {
  //     const { currency, receiveCountry } = countryCurrencyMap[country];
  //     setCurrency(currency);
  //     setReceiveCountry(receiveCountry);
  //   } else {
  //     setCurrency('');
  //     setReceiveCountry('');
  //   }
  // }, [country]);

  // useEffect(() => {
  //   if (country === 'Canada') {
  //     setReceiveAmount(sendAmount * exchangeRate);
  //   } else if (country === 'cameroun') {
  //     setReceiveAmount(sendAmount / exchangeRate);
  //   } else {
  //     setReceiveAmount(0);
  //   }
  //   const calculatedFees = sendAmount * 0.01;
  //   setFees(calculatedFees);
  //   setTotalToPay(sendAmount + calculatedFees);
  // }, [sendAmount, country]);

  const handleCountryChange = (event) => {
    const selectedCountry = event.target.value;
    setCountry(selectedCountry);
  };

  // const formatCurrency = (amount, currency) => {
  //   if (!currency) return amount;
  //   return new Intl.NumberFormat('fr-CA', {
  //     style: 'currency',
  //     currency: currency,
  //   }).format(amount);
  // };

  const handleSubmit = (event) => {
    event.preventDefault();

    // Rassembler les données du formulaire
    const formData = {
      name: event.target.formName.value,
      phone: event.target.formPhone.value,
      email: event.target.formEmail.value,
      country: country,
      sendAmount: sendAmount,
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
        console.error('Erreur lors de l\'envoi des données:', error);
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
                    value={sendAmount}
                    onChange={(e) => setSendAmount(parseFloat(e.target.value) || 0)}
                    required
                  />
                </InputGroup>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="formCurrency">
                <Form.Label className="form-label">Devise *</Form.Label>
                <Form.Control as="select" value={currency} readOnly required
                onChange={(e) => setCurrency(e.target.value)}>
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
