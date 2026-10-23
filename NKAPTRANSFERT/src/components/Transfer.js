import { faArrowLeft, faCheckCircle, faCreditCard, faMoneyCheckAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import api from '../api';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useEffect, useState } from 'react';
import { Button, Card, CardBody, CardHeader, CardTitle, Col, Container, Form, InputGroup, Row } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import './Styles/Transfer.css';



const COUNTRY_KEYS = {
  Cameroun: 'countryCameroon',
  "Côte d'Ivoire": 'countryIvoryCoast',
  Sénégal: 'countrySenegal',
  Gabon: 'countryGabon',
  Congo: 'countryCongo',
};

const COUNTRIES = {
  SendingCountry: {
    countries: [
      { name: 'Canada', currency: 'CAD' },
    ],
    rates: {
      ReceivingCountry: 445,
    },
  },
  ReceivingCountry: {
    countries: [
      { name: 'Cameroun', currency: 'XAF' },
      { name: 'Côte d\'Ivoire', currency: 'XOF' },
      { name: 'Sénégal', currency: 'XOF' },
      { name: 'Gabon', currency: 'XAF' },
      { name: 'Congo', currency: 'XAF' },
    ],
    rates: {
      SendingCountry: 440,
    },
  },
};

const DEFAULT_EXCHANGE_RATE = 1;
const MIN_AMOUNT = 15;

//useState custom hook


// Hook personalized for localStorage
// eslint-disable-next-line
const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Erreur lors de la lecture du localStorage:', error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Erreur lors de l\'écriture dans le localStorage:', error);
    }
  };

  return [storedValue, setValue];
};

// Hook personalized for exchange rate
const useExchangeRate = (sendingCountry, receivingCountry, amountToSend) => {
  const [amountToReceive, setAmountToReceive] = useState(0);
  // eslint-disable-next-line
  const [receiveCurrency, setReceiveCurrency] = useState('XAF');

  useEffect(() => {
    if (receivingCountry) {
      const receivingCountryData = COUNTRIES.ReceivingCountry.countries.find(
        (country) => country.name === receivingCountry
        
      );
    
      if (receivingCountryData) {
                setReceiveCurrency(
                  receivingCountry === 'Cameroun' ? 'XAF' : 'XOF'
                );
                setAmountToReceive(amountToSend * (COUNTRIES.ReceivingCountry.rates.SendingCountry || DEFAULT_EXCHANGE_RATE));
              } }
  }, [sendingCountry, receivingCountry, amountToSend]);

  return amountToReceive;
};

// send component
const Send = ({ formData, amountToReceive, onChange, onSubmit, validated, error, loading, onNext, onBack }) => {
  const { t } = useTranslation();

  return (
    <div>
      <h2>
        <FontAwesomeIcon icon={faMoneyCheckAlt} className="me-2" /> {t('sendMoney')}
      </h2>
      <Form noValidate validated={validated} onSubmit={onSubmit}>
        <Form.Group controlId="formSendingCountryEnvoyer">
          <Form.Label className="form-label" aria-label={t('sendingCountryLabel')}>
            {t('sendingCountryLabel')}
          </Form.Label>
          <Form.Control
            as="select"
            name='sendingCountry'
            value={formData.sendingCountry}
            onChange={onChange}
            aria-label={t('sendingCountryLabel')}
            required
          >
            <option value="Canada">{t('countryCanada')}</option>
          </Form.Control>
        </Form.Group>

        <Form.Group controlId="formReceivingCountryEnvoyer" className="form-group">
          <Form.Label className="form-label" aria-label={t('sendToLabel')}>
            {t('sendToLabel')}
          </Form.Label>
          <Form.Control
            required
            as="select"
            name='receivingCountry'
            value={formData.receivingCountry}
            onChange={onChange}
            aria-label={t('sendToLabel')}
            
          >
            <option value=""> {t('chooseCountry')}</option>
            {COUNTRIES.ReceivingCountry.countries.map((country, index) => (
              <option key={country.name} value={country.name}>
                {t(COUNTRY_KEYS[country.name] || 'country')}
              </option>
            ))}
          </Form.Control>
        </Form.Group>
        <Form.Group controlId="formAmountToSend" className="form-group">
          <Form.Label className="form-label" aria-label={t('sendLabel')}>
            {t('sendLabel')}
          </Form.Label>
          <InputGroup className="input-group">
            <Form.Control
              type="number"
              name='amountToSend'
              onChange={onChange}
              value={formData.amountToSend}
              aria-label={t('amountToSendLabel')}
              placeholder={t('amountPlaceholder')}
              defaultValue=''
              required
            />
            <Form.Control value='CAD' readOnly aria-label={t('sendCurrencyLabel')} />
            {formData.amountToSend < MIN_AMOUNT && (
              <div className="text-danger mt-1">
                {t('minAmount')}
              </div>
            )}
          </InputGroup>
        </Form.Group>
        <Form.Group controlId="formAmountToReceive" className="form-group">
          <Form.Label className="form-label" aria-label={t('equivalentLabel')}>
            {t('equivalentLabel')}
          </Form.Label>
          <InputGroup className="input-group">
            <Form.Control
              type="number"
              value={amountToReceive}
              readOnly
              aria-label={t('amountToReceiveLabel')}
            />
            <Form.Control as="select" value={formData.receivingCountry} readOnly aria-label={t('receiveCurrencyLabel')}>
              <option value={formData.receivingCountry}>{formData.receivingCountry}</option>
            </Form.Control>
          </InputGroup>
        </Form.Group>
        <Button
          type="button"
          className="btn btn-success"
          onClick={onNext}
          disabled={!formData.receivingCountry || !formData.amountToSend || formData.amountToSend < MIN_AMOUNT}
        >
          {t('next')} <FontAwesomeIcon icon={faCheckCircle} className="ms-2" />
        </Button>
        <Button type="button" className="btn btn-secondary ms-2" onClick={onBack}>
          <FontAwesomeIcon icon={faArrowLeft} className="me-2" /> {t('cancel')}
        </Button>
      </Form>
    </div>
  );
};

const WhithdrawalModes = ({ formData, onChange, onNext, onBack }) => {
  const { t } = useTranslation();
  return (
    <Form controlId="formWithdrawalMode" className="form-group">
      <h2>
        <FontAwesomeIcon icon={faCreditCard} className="me-2" /> {t('withdrawalMode')}
      </h2>
      <Form.Group controlId="formWithdrawalMode" className="form-group">
        <Form.Label>{t('withdrawalMode')}</Form.Label>
        <Form.Control
          as="select"
          value={formData.withdrawalMode}
          onChange={onChange}
          name="withdrawalMode"
          required
        >
          <option value="">{t('choose')}</option>
          <option value="Dépôt bancaire">{t('bankDeposit')}</option>
          <option value="Orange Money">Orange Money</option>
          <option value="Mobile Money">Mobile Money</option>
        </Form.Control>
      </Form.Group>
      <Button type="button" className="btn btn-success"
      onClick={onNext}
      disabled={!formData.withdrawalMode}
      > {t('next')} <FontAwesomeIcon icon={faCheckCircle} className="ms-2" />
      </Button>
      <Button type="button" className="btn btn-secondary ms-2" onClick={onBack}>
        <FontAwesomeIcon icon={faArrowLeft} className="me-2" /> {t('back')}
      </Button>
    </Form>
  );
  
}



const Details = ({ formData = {}, onChange, onSubmit, validated, error, loading, onNext, onBack }) => {
  const { t } = useTranslation();
  const [isOther, setIsOther] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const isPhoneNumberValid = (phone) => {
    if (!phone || formData.withdrawalMode === 'Dépôt bancaire') return true;
    const digits = String(phone).replace(/\D/g, '').replace(/^237/, '');
    return digits.length >= 8 && digits.length <= 10;
  };

  const validateDetails = () => {
    const errors = {};

    if (!formData.reasonList) errors.reasonList = t('reasonRequired');
    if (!formData.firstName) errors.firstName = t('lastNameRequired');
    if (!formData.lastName) errors.lastName = t('firstNameRequired');
    if (!formData.city) errors.city = t('cityRequired');
    if (!formData.address) errors.address = t('addressRequired');
    if (!formData.phoneNumber) errors.phoneNumber = t('numberRequired');
    else if (!isPhoneNumberValid(formData.phoneNumber)) {
      errors.phoneNumber = formData.withdrawalMode === 'Orange Money'
        ? t('invalidOrange')
        : formData.withdrawalMode === 'Mobile Money'
        ? t('invalidMtn')
        : t('invalidNumber');
    }
    if (!formData.confirmPhoneNumber) errors.confirmPhoneNumber = t('confirmNumberRequired');
    else if (formData.phoneNumber !== formData.confirmPhoneNumber) {
      errors.confirmPhoneNumber = t('numbersMismatch');
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };

  const { isValid, errors } = validateDetails(formData);

  const handleNextClick = () => {
    setShowErrors(true); // Afficher les erreurs au clic
    if (isValid) {
      onNext(); // Passer à l'étape suivante si tout est valide
    }
  };

  const phoneLabel = formData.withdrawalMode === 'Orange Money'
    ? t('orangeAccount')
    : formData.withdrawalMode === 'Mobile Money'
    ? t('mtnAccount')
    : t('accountNumber');

  const phonePlaceholder = formData.withdrawalMode === 'Orange Money'
    ? 'Ex: 69123456'
    : formData.withdrawalMode === 'Mobile Money'
    ? 'Ex: 77123456'
    : t('accountNumber');

  return (
    <div className="transfer-step">
      <h2>
        <FontAwesomeIcon icon={faCreditCard} className="me-2" /> {t('transferDetails')}
      </h2>
      <Form noValidate validated={validated} onSubmit={onSubmit}>
        <Form.Group controlId="formReasonListDetails" className="form-group">
          <Form.Label>{t('sendReason')}</Form.Label>
          <Form.Control
            as="select"
            value={formData.reasonList || ''}
            onChange={onChange}
            name="reasonList"
            required
            isInvalid={showErrors && !!errors.reasonList}
          >
            <option value="">{t('choose')}</option>
            <option value="Soutien de la famille ou des amis">{t('reasonFamily')}</option>
            <option value="Achat de services">{t('reasonServices')}</option>
            <option value="Envoie de fond a soi-meme">{t('reasonSelf')}</option>
          </Form.Control>
          <Form.Control.Feedback type="invalid">{errors.reasonList}</Form.Control.Feedback>
        </Form.Group>

        <Form.Group controlId="validationCustomFirstNameDetails" className="form-group">
          <Form.Label>{t('recipientLastName')}</Form.Label>
          <Form.Control
            required
            type="text"
            value={formData.firstName || ''}
            onChange={onChange}
            name="firstName"
            placeholder={t('recipientLastName')}
            isInvalid={showErrors && !!errors.firstName}
          />
          <Form.Control.Feedback type="invalid">{errors.firstName}</Form.Control.Feedback>
        </Form.Group>

        <Form.Group controlId="validationCustomLastNameDetails" className="form-group">
          <Form.Label>{t('recipientFirstName')}</Form.Label>
          <Form.Control
            required
            type="text"
            value={formData.lastName || ''}
            onChange={onChange}
            name="lastName"
            placeholder={t('recipientFirstName')}
            isInvalid={showErrors && !!errors.lastName}
          />
          <Form.Control.Feedback type="invalid">{errors.lastName}</Form.Control.Feedback>
        </Form.Group>

        <Form.Group controlId="validationCustomCityDetails" className="form-group">
          <Form.Label>{t('recipientCity')}</Form.Label>
          <Form.Control
            required
            type="text"
            value={formData.city || ''}
            onChange={onChange}
            name="city"
            placeholder={t('recipientCity')}
            isInvalid={showErrors && !!errors.city}
          />
          <Form.Control.Feedback type="invalid">{errors.city}</Form.Control.Feedback>
        </Form.Group>

        <Form.Group controlId="validationCustomAddressDetails" className="form-group">
          <Form.Label>{t('recipientAddress')}</Form.Label>
          <Form.Control
            required
            type="text"
            value={formData.address || ''}
            onChange={onChange}
            name="address"
            placeholder={t('recipientAddress')}
            isInvalid={showErrors && !!errors.address}
          />
          <Form.Control.Feedback type="invalid">{errors.address}</Form.Control.Feedback>
        </Form.Group>

        <Form.Group controlId="validationCustomPhoneNum1Details" className="form-group">
          <Form.Label>{phoneLabel}</Form.Label>
          <InputGroup hasValidation>
            {formData.withdrawalMode !== 'Dépôt bancaire' && <InputGroup.Text>+237</InputGroup.Text>}
            <Form.Control
              type="tel"
              value={formData.phoneNumber || ''}
              onChange={onChange}
              name="phoneNumber"
              placeholder={phonePlaceholder}
              required
              isInvalid={showErrors && !!errors.phoneNumber}
            />
            <Form.Control.Feedback type="invalid">{errors.phoneNumber}</Form.Control.Feedback>
          </InputGroup>
        </Form.Group>

        <Form.Group controlId="validationCustomPhoneNum2Details" className="form-group">
          <Form.Label>{t('confirmAccount')}</Form.Label>
          <InputGroup hasValidation>
            {formData.withdrawalMode !== 'Dépôt bancaire' && <InputGroup.Text>+237</InputGroup.Text>}
            <Form.Control
              type="tel"
              value={formData.confirmPhoneNumber || ''}
              onChange={onChange}
              name="confirmPhoneNumber"
              placeholder={`Confirmer ${phonePlaceholder.toLowerCase()}`}
              required
              isInvalid={showErrors && !!errors.confirmPhoneNumber}
            />
            <Form.Control.Feedback type="invalid">{errors.confirmPhoneNumber}</Form.Control.Feedback>
          </InputGroup>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Check
            label={t('forSomeoneElse')}
            checked={isOther}
            onChange={() => setIsOther(!isOther)}
          />
        </Form.Group>

        {error && <p className="text-danger">{error}</p>}
        <Button
          type="button"
          className="btn btn-secondary"
          onClick={onBack}
        >
          <FontAwesomeIcon icon={faArrowLeft} className="me-2" /> {t('back')}
        </Button>

        <Button
          type="button" // Changé en "button" car on gère manuellement via handleNextClick
          className="btn btn-success ms-2"
          onClick={handleNextClick} // Nouvelle fonction pour gérer le clic
        >
          {t('next')} <FontAwesomeIcon icon={faCheckCircle} className="ms-2" />
        </Button>
      </Form>
    </div>
  );
};

const Success = ({ formData, quote, quoteError, onBack, onValidate, onPaymentMethod }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState('');
  const handleValidate = async () => {
    try {
      setSubmitError('');
      const created = await onValidate();
      navigate(`/track/${created.reference}`);
    } catch (error) {
      setSubmitError(error.response?.data?.message || t('transferFailed'));
    }
  };

  const shown = quote || {};
  const accountLabel = formData.withdrawalMode === 'Orange Money'
    ? t('orangeAccount')
    : formData.withdrawalMode === 'Mobile Money'
    ? t('mtnAccount')
    : t('accountNumber');

  return (
    <div>
 <Card className="mt-4">
      <CardHeader>
        <CardTitle className="d-flex align-items-center">
          <FontAwesomeIcon icon={faCheckCircle} className="me-2 text-success" />
          {t('transferPending')}
        </CardTitle>
      </CardHeader>
      <CardBody className="fs-5">
        <p className="mb-3">{t('aboutToSend')}</p>
        {quoteError && <p className="text-danger">{quoteError}</p>}
        {submitError && <p className="text-danger">{submitError}</p>}
        
        <div className="details-grid">
          <div className="detail-item">
            <span className="detail-label">{t('recipient')}:</span>
            <span className="detail-value">{formData.firstName} {formData.lastName}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">{t('city')}:</span>
            <span className="detail-value">{formData.city}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">{t('address')}:</span>
            <span className="detail-value">{formData.address}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">{accountLabel}:</span>
            <span className="detail-value">{formData.phoneNumber}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">{t('amountSent')}:</span>
            <span className="detail-value">{shown.amount || formData.amountToSend} CAD</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">{t('fee')}:</span>
            <span className="detail-value">{shown.fee ?? '—'} CAD</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">{t('otherFees')}:</span>
            <span className="detail-value">{shown.otherFees ?? 0} CAD</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">{t('fxRate')}:</span>
            <span className="detail-value">{shown.fxRate ?? '—'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">{t('amountReceived')}:</span>
            <span className="detail-value">{shown.amountToReceive ?? '—'} {shown.currencyReceived || ''}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">{t('eta')}:</span>
            <span className="detail-value">{shown.eta || '—'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">{t('conditions')}:</span>
            <span className="detail-value">{shown.conditions || '—'}</span>
          </div>
        </div>
        <Form.Group className="mt-3">
          <Form.Label>{t('paymentMethod')}</Form.Label>
          <Form.Check type="radio" name="paymentMethod" label={t('interac')} checked={formData.paymentMethod === 'interac'} onChange={() => onPaymentMethod('interac')} />
          <Form.Check type="radio" name="paymentMethod" label={t('bankTransfer')} checked={formData.paymentMethod === 'bank'} onChange={() => onPaymentMethod('bank')} />
        </Form.Group>
      </CardBody>
    </Card>
      <Button type="button" className="btn btn-secondary" onClick={onBack}>{t('modify')}</Button>
      <Button type="button" className="btn btn-success" onClick={handleValidate} disabled={!quote}>{t('validateTransfer')}</Button>
    </div>
  );
};

function Transfer() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  // eslint-disable-next-line
  const [status, setStatus] = useState('');


  // form state
  const [formData, setFormData] = useState({
    sendingCountry: 'Canada',
    receiveCurrency: 'XAF',
    receivingCountry: '',
    sendingCurrency: 'CAD',
    amountToSend: 0,
    amountToReceive: 0,
    recipient: '',
    firstName: '',
    lastName: '',
    city: '',
    address: '',
    phoneNumber: '',
    confirmPhoneNumber: '',
    reasonList: '',
    withdrawalMode: '',
    promoCode: '',
    paymentMethod: 'interac',
    recipientList: ['Alice', 'Bob', 'Charlie'],
    userEmail: '',
    userName: '',
    status: ''
  });

  const [activeStep, setActiveStep] = useState('send');
  const [quote, setQuote] = useState(null);
  const [quoteError, setQuoteError] = useState('');
  const [loading] = useState(false);
  const [error] = useState(null);
  const [validated] = useState(false);

  // get user email and name from local storage
  // const [userEmail, setUserEmail] = useLocalStorage('email', '');
  // const [userName, setUserName] = useLocalStorage('userName', '');

  // calculate exchange rate
  const amountToReceive = useExchangeRate(
    formData.sendingCountry,
    formData.receivingCountry,
    formData.amountToSend
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
  };

  const validateTransaction = async () => {
    const response = await api.post('/api/transfers', {
      amount: Number(formData.amountToSend),
      beneficiaryFirstName: formData.firstName,
      beneficiaryLastName: formData.lastName,
      method: formData.withdrawalMode,
      recipientTown: formData.city,
      recipientAddress: formData.address,
      accountNumber: formData.phoneNumber,
      phone: formData.phoneNumber,
      reasonOfSending: formData.reasonList,
      sendingCountry: formData.sendingCountry || 'Canada',
      receivingCountry: formData.receivingCountry,
      promoCode: formData.promoCode,
    });
    await api.post(`/api/transfers/${response.data.id}/pay`, { method: formData.paymentMethod || 'interac' });
    return response.data;
  };
  

  useEffect(() => {
    if (activeStep !== 'success') return undefined;
    let cancelled = false;
    api.get('/api/transfers/quote', {
      params: {
        origin: formData.sendingCountry || 'Canada',
        destination: formData.receivingCountry,
        amount: formData.amountToSend,
        promoCode: formData.promoCode,
      },
    }).then((response) => {
      if (!cancelled) {
        setQuote(response.data);
        setQuoteError('');
      }
    }).catch((error) => {
      if (!cancelled) {
        setQuote(null);
        setQuoteError(error.response?.data?.message || t('transferFailed'));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [activeStep, formData.sendingCountry, formData.receivingCountry, formData.amountToSend, formData.promoCode, t]);

  const goBack = () => {
    switch (activeStep) {
      case 'withdrawalMode':
        setActiveStep('send');
        break;
      case 'details':
        setActiveStep('withdrawalMode');
        break;
      case 'success':
        setActiveStep('details');
        break;
      default:
        navigate(-1);
    }
  };

  return (
    <div className="transfer">
      <Container>
        <Row>
          <Col>
            {activeStep === 'send' && (
              <Send
                formData={formData}
                amountToReceive={amountToReceive}
                onChange={handleChange}
                onSubmit={handleSubmit}
                validated={validated}
                error={error}
                loading={loading}
                onNext={() => setActiveStep('withdrawalMode')}
                onBack={goBack}
              />
            )}
            {activeStep === 'withdrawalMode' && (
              <WhithdrawalModes
                formData={formData}
                onChange={handleChange}
                onNext={() => setActiveStep('details')}
                onBack={goBack}
              />
            )}
            {activeStep === 'details' && (
              <Details
                formData={formData}
                onChange={handleChange}
                onSubmit={handleSubmit}
                validated={validated}
                error={error}
                loading={loading}
                onNext={() => setActiveStep('success')}
                onBack={() => setActiveStep('withdrawalMode')}
              />
            )}
            {activeStep === 'success' && (
              <Success
                formData={formData}
                quote={quote}
                quoteError={quoteError}
                onBack={() => setActiveStep('details')}
                onValidate={validateTransaction}
                onPaymentMethod={(method) => setFormData((prev) => ({ ...prev, paymentMethod: method }))}
              />
            )}
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default Transfer;