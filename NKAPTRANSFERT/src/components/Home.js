import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useState } from 'react';
import { Button, Form, InputGroup } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import './Styles/Accueil.css';

const HomeContainer = styled.div`
  .heading {
    color: #16A085;
  }
  .form-group {
    margin-bottom: 1rem;
  }
  .form-label {
    margin-bottom: 0.5rem;
    font-weight: bold;
  }
  .input-group {
    display: flex;
    align-items: center;
  }
  .btn-success {
    background-color: #16A085;
    border-color: #16A085;
  }
  .btn-success:hover {
    background-color: darken(#16A085, 10%);
    border-color: darken(#16A085, 10%);
  }
`;

const countries = {
  'SendingCountry': {
    countries: [
      {name: 'Canada', currency: 'CAD'}
    ],
    rates: {
      'ReceivingCountry': 445
    }
  },
  'ReceivingCountry': {
    countries: [
      {name: 'cameroun', currency: 'XAF'},
      {name: 'Côte d\'Ivoire', currency: 'XOF'},
    ],
    rates: {
      'SendingCountry': 440
    }
  },
};

function Home() {
  const { t, i18n } = useTranslation();
  const [sendingCountry, setSendingCountry] = useState('Canada');
  const [receivingCountry, setReceivingCountry] = useState('');
  const [receiveCurrency, setReceiveCurrency] = useState('');
  const [amountToSend, setAmountToSend] = useState(0);
  const [amountToReceive, setAmountToReceive] = useState(0);
  const [userName, setUserName] = useState('');
  // eslint-disable-next-line
  const [userId, setUserId] = useState('');

  const navigate = useNavigate();
  const defaultExchangeRate = 450;

  useEffect(() => {
    //recuperer le nom de l'utilisateur depuis le local storage
    const storedUserName = localStorage.getItem('userFirstName');
    if (storedUserName) {
      setUserName(storedUserName);
      console.log('Nom d\'utilisateur récupéré:', storedUserName);
    }

    //recuperer l'id de l'utilisateur depuis le local storage
    const userId = localStorage.getItem('userId');
    if (userId) {
      setUserId(userId);
      console.log('ID de l\'utilisateur récupéré:', userId);
    }
  }, []);



  useEffect(() => {
    if (receivingCountry) {
      const receivingCountryData = countries.ReceivingCountry.countries.find(
        (country) => country.name === receivingCountry
      );
  
      if (receivingCountryData) {
        setReceiveCurrency(
          receivingCountry === 'cameroun' ? 'XAF' : 'XOF'
        );
        setAmountToReceive(amountToSend * (countries.ReceivingCountry.rates.SendingCountry || defaultExchangeRate));
      } else {
        setReceiveCurrency('');
        setReceivingCountry('');
      }
    }
  }, [sendingCountry, receivingCountry, amountToSend]);

  // useEffect(() => {
  //   const calculatedFees = amountToSend * 0.01;
  //   setFees(calculatedFees);
  //   setTotalToPay(amountToSend + calculatedFees);
  // }, [amountToSend]);

  const formatCurrency = (amount, currency) => {
    if (!currency) return amount;
    try {
      return new Intl.NumberFormat(i18n.language === 'fr' ? 'fr-CA' : 'en-CA', {
        style: 'currency',
        currency,
      }).format(amount);
    } catch (error) {
      console.error('Invalid currency code:', currency);
      return amount;
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    navigate('/transfer');
  };

  const rate = receivingCountry
    ? (countries.ReceivingCountry.rates.SendingCountry || defaultExchangeRate)
    : defaultExchangeRate;
  const sentAmount = Number(amountToSend) || 0;
  const feeAmount = sentAmount > 0 ? sentAmount * 0.01 : 0;
  const totalAmount = sentAmount + feeAmount;

  return (
    <HomeContainer>
      <div className="home-grid">
        <div>
          <span className="eyebrow">{t('route')}</span>
          <h1>{userName ? t('hello', { name: userName }) : t('heading')}</h1>
          <p className="lead">{t('heroLead')}</p>
          <div className="hero-actions">
            <Button onClick={() => navigate(userName ? '/transfer' : '/signup')}>
              {userName ? t('transfer') : t('signup')} <FontAwesomeIcon icon={faArrowRight} className="ms-2" />
            </Button>
            <Button variant="light" onClick={() => navigate('/contact')}>{t('contact')}</Button>
          </div>
          <ul className="trust">
            <li>{t('trustMin')}</li>
            <li>{t('trustMethods')}</li>
            <li>{t('trustReceipt')}</li>
          </ul>
        </div>
        <div className="panel estimate-card">
            <Form onSubmit={handleSubmit}>
              <h2>{t('estimateTransfer')}</h2>

              <Form.Group controlId="formSendingCountry" className="form-group">
                <Form.Label>{t('sendingCountryLabel')}</Form.Label>
                <Form.Control as="select" value={sendingCountry} onChange={(e) => setSendingCountry(e.target.value)}>
                  <option value="Canada">{t('countryCanada')}</option>
                </Form.Control>
              </Form.Group>

              <Form.Group controlId="formreceivingCountry" className="form-group">
                <Form.Label>{t('sendToLabel')}</Form.Label>
                <Form.Control as="select" value={receivingCountry} onChange={(e) => setReceivingCountry(e.target.value)}>
                  <option value="">{t('selectCountry')}</option>
                  {countries.ReceivingCountry.countries.map((country) => (
                    <option key={country.name} value={country.name}>
                      {country.name === 'cameroun' ? t('countryCameroon') : t('countryIvoryCoast')}
                    </option>
                  ))}
                </Form.Control>
              </Form.Group>

              <Form.Group controlId="formAmountToSend" className="form-group">
                <Form.Label>{t('sendLabel')}</Form.Label>
                <InputGroup>
                  <Form.Control
                    type="number"
                    min="0"
                    value={amountToSend}
                    onChange={(e) => setAmountToSend(parseFloat(e.target.value))}
                  />
                  <InputGroup.Text>CAD</InputGroup.Text>
                </InputGroup>
              </Form.Group>

              <Form.Group controlId="formamountToReceive" className="form-group">
                <Form.Label>{t('equivalentLabel')}</Form.Label>
                <InputGroup>
                  <Form.Control type="number" value={amountToReceive} readOnly />
                  <InputGroup.Text>{receiveCurrency || 'XAF'}</InputGroup.Text>
                </InputGroup>
              </Form.Group>

              <div className="quote-row"><span>{t('fees')}</span><strong>{formatCurrency(feeAmount, 'CAD')}</strong></div>
              <div className="quote-row"><span>{t('totalToPay')}</span><strong>{formatCurrency(totalAmount, 'CAD')}</strong></div>
              <div className="quote-row"><span>{t('exchangeRate')}</span><strong>1 CAD = {rate} {receiveCurrency || ''}</strong></div>

              <Button type="submit" className="mt-3 w-100">
                {t('transferButton')} <FontAwesomeIcon icon={faArrowRight} className="ms-2" />
              </Button>
            </Form>
        </div>
      </div>
    </HomeContainer>
  );
}

export default Home;
