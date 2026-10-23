import { faInfoCircle, faMoneyBillWave } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import api from '../api';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Button, Col, Form, InputGroup, Row } from 'react-bootstrap';
import './Styles/Facture.css';

const countryCurrencyMap = {
  Canada: { currency: 'CAD', receivingCountry: 'cameroun' },
  cameroun: { currency: 'XAF', receivingCountry: 'Canada' },
  'Cote d\'ivoire': { currency: 'XOF', receivingCountry: 'France' },
};

function Facture() {
  const { t } = useTranslation();
  const [country, setCountry] = useState('');
  const [currency, setCurrency] = useState('');
  const [receivingCountry, setReceivingCountry] = useState('');
  const [amountToSend, setAmountToSend] = useState(0);
  const [amountToReceive, setAmountToReceive] = useState(0);
  const [fees, setFees] = useState(0);
  const [totalToPay, setTotalToPay] = useState(0);
  const [notice, setNotice] = useState('');
  const [noticeVariant, setNoticeVariant] = useState('success');
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
    api.post('/api/transactions/facture', formData)
      .then((response) => {
        setNoticeVariant('success');
        setNotice(response.data.message || t('billSaved'));
        event.target.reset();
        setAmountToSend(0);
        setCountry('');
      })
      .catch((error) => {
        setNoticeVariant('danger');
        setNotice(error.response?.data?.message || t('billError'));
      });
  };

  return (
    <div>
      <div className="container mt-5">
        <h2>{t('billTitle')}</h2>
        {notice && <Alert variant={noticeVariant}>{notice}</Alert>}
        <Form onSubmit={handleSubmit}>
          <Form.Group controlId="formName">
            <Form.Label className="form-label">{t('nameRequired')} *</Form.Label>
            <Form.Control type="text" placeholder={t('enterName')} required />
          </Form.Group>

          <Row>
            <Col md={6}>
              <Form.Group controlId="formPhone">
                <Form.Label className="form-label">{t('phone')} *</Form.Label>
                <Form.Control type="tel" placeholder={t('enterPhone')} required />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="formEmail">
                <Form.Label className="form-label">{t('email')} *</Form.Label>
                <Form.Control type="email" placeholder={t('enterEmail')} required />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group controlId="formCountry">
            <Form.Label className="form-label">{t('providerCountry')} *</Form.Label>
            <Form.Control as="select" value={country} onChange={handleCountryChange} required>
              <option value="">{t('chooseOption')}</option>
              <option value="Canada">{t('countryCanada')}</option>
              <option value="cameroun">{t('countryCameroon')}</option>
              <option value="Cote d'ivoire">{t('countryIvoryCoast')}</option>
            </Form.Control>
          </Form.Group>

          <Row>
            <Col md={6}>
              <Form.Group controlId="formAmount">
                <Form.Label className="form-label">{t('amount')} *</Form.Label>
                <InputGroup>
                  <InputGroup.Text><FontAwesomeIcon icon={faMoneyBillWave} /></InputGroup.Text>
                  <Form.Control
                    type="number"
                    placeholder={t('enterAmount')}
                    value={amountToSend}
                    onChange={(e) => setAmountToSend(parseFloat(e.target.value) || 0)}
                    required
                  />
                </InputGroup>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="formCurrency">
                <Form.Label className="form-label">{t('currency')} *</Form.Label>
                <Form.Control as="select" value={currency} readOnly required>
                  <option>{currency}</option>
                </Form.Control>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group controlId="formDetails">
            <Form.Label className="form-label">{t('moreDetails')} *</Form.Label>
            <InputGroup>
              <InputGroup.Text><FontAwesomeIcon icon={faInfoCircle} /></InputGroup.Text>
              <Form.Control as="textarea" rows={3} required />
            </InputGroup>
          </Form.Group>

          {country && (
            <div className="mt-3 mb-3">
              <p>{t('destinationCountry')} : {receivingCountry || '—'}</p>
              <p>{t('estimatedAmount')} : {formatCurrency(amountToReceive, country === 'Canada' ? 'XAF' : currency || 'CAD')}</p>
              <p>{t('feePercent')} : {formatCurrency(fees, currency || 'CAD')}</p>
              <p><strong>{t('totalToPay')} : {formatCurrency(totalToPay, currency || 'CAD')}</strong></p>
            </div>
          )}

          <Button className="button" type="submit">
            {t('send')}
          </Button>
        </Form>
      </div>
    </div>
  );
}

export default Facture;
