import { faArrowLeft, faCheckCircle, faCreditCard, faMoneyCheckAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useEffect, useState } from 'react';
import { Button, Card, CardBody, CardHeader, CardTitle, Col, Container, Form, InputGroup, Row } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import './Styles/Transfer.css';



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
    ],
    rates: {
      SendingCountry: 440,
    },
  },
};

const DEFAULT_EXCHANGE_RATE = 1;
const MIN_AMOUNT = 15;

// Préfixes valides pour MTN et Orange Cameroun
const MTN_PREFIXES = [
  /^645\d{5}$/, /^646\d{5}$/, /^647\d{5}$/, /^648\d{5}$/, /^649\d{5}$/,
  /^6745\d{6}$/, /^6746\d{6}$/, /^6747\d{6}$/, /^6748\d{6}$/, /^6749\d{6}$/,
  /^65\d{6}$/, /^67\d{6}$/, /^675\d{6}$/, /^677\d{6}$/,
];

const ORANGE_PREFIXES = [
  /^640\d{5}$/, /^641\d{5}$/, /^642\d{5}$/, /^643\d{5}$/, /^644\d{5}$/,
  /^6940\d{6}$/, /^6941\d{6}$/, /^6942\d{6}$/, /^6943\d{6}$/, /^6944\d{6}$/,
  /^66\d{6}$/, /^69\d{6}$/, /^696\d{6}$/, /^697\d{6}$/, /^699\d{6}$/,
];

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
        <FontAwesomeIcon icon={faMoneyCheckAlt} className="me-2" /> Envoyer de l'argent
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
            <option value="Canada">Canada</option>
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
            <option value="">Sélectionnez un pays</option>
            {COUNTRIES.ReceivingCountry.countries.map((country, index) => (
              <option key={index} value={country.name}>{country.name}</option>
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
              placeholder="Entrez le montant à envoyer"
              defaultValue=''
              required
            />
            <Form.Control value='CAD' readOnly aria-label={t('sendCurrencyLabel')} />
            {formData.amountToSend < MIN_AMOUNT && (
              <div className="text-danger mt-1">
                {error || "Le montant doit être au moins de 15."}
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
          type="submit"
          className="btn btn-success"
          onClick={onNext}
          disabled={!formData.receivingCountry || !formData.amountToSend || formData.amountToSend < MIN_AMOUNT}
        >
          Suivant <FontAwesomeIcon icon={faCheckCircle} className="ms-2" />
        </Button>
        <Button type="button" className="btn btn-secondary ms-2" onClick={onBack}>
          <FontAwesomeIcon icon={faArrowLeft} className="me-2" /> Annuler
        </Button>
      </Form>
    </div>
  );
};

const WhithdrawalModes = ({ formData, onChange, onNext, onBack }) => {
  return (
    <Form controlId="formWithdrawalMode" className="form-group">
      <h2>
        <FontAwesomeIcon icon={faCreditCard} className="me-2" /> Mode de retrait
      </h2>
      <Form.Group controlId="formWithdrawalMode" className="form-group">
        <Form.Label>Mode de retrait</Form.Label>
        <Form.Control
          as="select"
          value={formData.withdrawalMode}
          onChange={onChange}
          name="withdrawalMode"
          required
        >
          <option value="">--Choisir--</option>
          <option value="Dépôt bancaire">Dépôt bancaire</option>
          <option value="Orange Money">Orange Money</option>
          <option value="Mobile Money">Mobile Money</option>
        </Form.Control>
      </Form.Group>
      <Button type="submit" className="btn btn-success"
      onClick={onNext}
      disabled={!formData.withdrawalMode}
      > Suivant <FontAwesomeIcon icon={faCheckCircle} className="ms-2" />
      </Button>
      <Button type="button" className="btn btn-secondary ms-2" onClick={onBack}>
        <FontAwesomeIcon icon={faArrowLeft} className="me-2" /> Retour
      </Button>
    </Form>
  );
  
}



const Details = ({ formData = {}, onChange, onSubmit, validated, error, loading, onNext, onBack }) => {
  const [isOther, setIsOther] = useState(false);
  const [showErrors, setShowErrors] = useState(false); // Nouvel état pour contrôler l'affichage des erreurs

  // Déterminer les préfixes valides selon le mode de retrait
  const validPrefixes = formData.withdrawalMode === 'Orange Money' ? ORANGE_PREFIXES : MTN_PREFIXES;

  const isPhoneNumberValid = (phone) => {
    if (!phone || formData.withdrawalMode === 'Dépôt bancaire') return true;
    const number = phone.replace('+237', '');
    return validPrefixes.some((regex) => regex.test(number));
  };

  const validateDetails = () => {
    const errors = {};

    if (!formData.reasonList) errors.reasonList = 'Veuillez sélectionner une raison.';
    if (!formData.firstName) errors.firstName = 'Le nom est requis.';
    if (!formData.lastName) errors.lastName = 'Le prénom est requis.';
    if (!formData.city) errors.city = 'La ville est requise.';
    if (!formData.address) errors.address = 'L’adresse est requise.';
    if (!formData.phoneNumber) errors.phoneNumber = 'Le numéro est requis.';
    else if (!isPhoneNumberValid(formData.phoneNumber)) {
      errors.phoneNumber = formData.withdrawalMode === 'Orange Money'
        ? 'Numéro Orange Money invalide.'
        : formData.withdrawalMode === 'Mobile Money'
        ? 'Numéro MTN Money invalide.'
        : 'Numéro invalide.';
    }
    if (!formData.confirmPhoneNumber) errors.confirmPhoneNumber = 'La confirmation du numéro est requise.';
    else if (formData.phoneNumber !== formData.confirmPhoneNumber) {
      errors.confirmPhoneNumber = 'Les numéros ne correspondent pas.';
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
    ? 'Numéro de compte Orange Money'
    : formData.withdrawalMode === 'Mobile Money'
    ? 'Numéro de compte MTN Money'
    : 'Numéro de compte';

  const phonePlaceholder = formData.withdrawalMode === 'Orange Money'
    ? 'Ex: 69123456'
    : formData.withdrawalMode === 'Mobile Money'
    ? 'Ex: 77123456'
    : 'Numéro de compte';

  return (
    <div className="transfer-step">
      <h2>
        <FontAwesomeIcon icon={faCreditCard} className="me-2" /> Détails du transfert
      </h2>
      <Form noValidate validated={validated} onSubmit={onSubmit}>
        <Form.Group controlId="formReasonListDetails" className="form-group">
          <Form.Label>Raisons d'envois</Form.Label>
          <Form.Control
            as="select"
            value={formData.reasonList || ''}
            onChange={onChange}
            name="reasonList"
            required
            isInvalid={showErrors && !!errors.reasonList}
          >
            <option value="">--Choisir--</option>
            <option value="Soutien de la famille ou des amis">Soutien de la famille ou des amis</option>
            <option value="Achat de services">Achat de services</option>
            <option value="Envoie de fond a soi-meme">Envoie de fond a soi-meme</option>
          </Form.Control>
          <Form.Control.Feedback type="invalid">{errors.reasonList}</Form.Control.Feedback>
        </Form.Group>

        <Form.Group controlId="validationCustomFirstNameDetails" className="form-group">
          <Form.Label>Nom</Form.Label>
          <Form.Control
            required
            type="text"
            value={formData.firstName || ''}
            onChange={onChange}
            name="firstName"
            placeholder="Nom"
            isInvalid={showErrors && !!errors.firstName}
          />
          <Form.Control.Feedback type="invalid">{errors.firstName}</Form.Control.Feedback>
        </Form.Group>

        <Form.Group controlId="validationCustomLastNameDetails" className="form-group">
          <Form.Label>Prénom</Form.Label>
          <Form.Control
            required
            type="text"
            value={formData.lastName || ''}
            onChange={onChange}
            name="lastName"
            placeholder="Prénom"
            isInvalid={showErrors && !!errors.lastName}
          />
          <Form.Control.Feedback type="invalid">{errors.lastName}</Form.Control.Feedback>
        </Form.Group>

        <Form.Group controlId="validationCustomCityDetails" className="form-group">
          <Form.Label>Ville</Form.Label>
          <Form.Control
            required
            type="text"
            value={formData.city || ''}
            onChange={onChange}
            name="city"
            placeholder="Ville"
            isInvalid={showErrors && !!errors.city}
          />
          <Form.Control.Feedback type="invalid">{errors.city}</Form.Control.Feedback>
        </Form.Group>

        <Form.Group controlId="validationCustomAddressDetails" className="form-group">
          <Form.Label>Adresse du destinataire</Form.Label>
          <Form.Control
            required
            type="text"
            value={formData.address || ''}
            onChange={onChange}
            name="address"
            placeholder="Adresse du destinataire"
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
          <Form.Label>Confirmer {phoneLabel.toLowerCase()}</Form.Label>
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
            label="Cochez si vous faites cette transaction pour le compte de quelqu’un d’autre"
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
          <FontAwesomeIcon icon={faArrowLeft} className="me-2" /> Retour
        </Button>

        <Button
          type="button" // Changé en "button" car on gère manuellement via handleNextClick
          className="btn btn-success ms-2"
          onClick={handleNextClick} // Nouvelle fonction pour gérer le clic
        >
          Suivant <FontAwesomeIcon icon={faCheckCircle} className="ms-2" />
        </Button>
      </Form>
    </div>
  );
};

const Success = ({ formData, amountToReceive, onBack, onValidate }) => {
  const navigate = useNavigate();
  const handleValidate = async () => {
    try {
      await onValidate();
      navigate('/history');
    } catch (error) {
      console.error('Erreur lors de la validation:', error);
    }
  };

  const accountLabel = formData.withdrawalMode === 'Orange Money'
    ? 'Numéro Orange Money'
    : formData.withdrawalMode === 'Mobile Money'
    ? 'Numéro MTN Money'
    : 'Numéro de compte';

  return (
    <div>
 <Card className="mt-4">
      <CardHeader>
        <CardTitle className="d-flex align-items-center">
          <FontAwesomeIcon icon={faCheckCircle} className="me-2 text-success" />
          Transfert en cours
        </CardTitle>
      </CardHeader>
      <CardBody className="fs-5">
        <p className="mb-3">
          Vous etes sur le point d'effectuer une transaction
        </p>
        
        <div className="details-grid">
          <div className="detail-item">
            <span className="detail-label">Destinaire:</span>
            <span className="detail-value">{formData.firstName} {formData.lastName}</span>
          </div>
          
          <div className="detail-item">
            <span className="detail-label">Ville:</span>
            <span className="detail-value">{formData.city}</span>
          </div>
          
          <div className="detail-item">
            <span className="detail-label">Adresse:</span>
            <span className="detail-value">{formData.address}</span>
          </div>
          
          <div className="detail-item">
            <span className="detail-label">{accountLabel}:</span>
            <span className="detail-value">{formData.phoneNumber}</span>
          </div>
          
          <div className="detail-item">
            <span className="detail-label">Montant envoyé:</span>
            <span className="detail-value">{formData.amountToSend} {formData.sendingCurrency}</span>
          </div>
          
          <div className="detail-item">
            <span className="detail-label">Montant reçu:</span>
            <span className="detail-value">{amountToReceive} {formData.receiveCurrency}</span>
          </div>
        </div>
      </CardBody>
    </Card>
      <Button
        type='button'
        className='btn btn-secondary'
        onClick={onBack}
      >
        <FontAwesomeIcon icon={faArrowLeft} className="me-2" /> Modifier
      </Button>
      <Button
        type="button"
        className="btn btn-success"
        onClick={handleValidate}
      >
        Valider la transaction
      </Button>
    </div>
  );
};

function Transfer() {
  const navigate = useNavigate();
  // const { t } = useTranslation();
  // eslint-disable-next-line
  const [status, setStatus] = useState('');


  // form state
  const [formData, setFormData] = useState({
    sendingCountry: '',
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
    recipientList: ['Alice', 'Bob', 'Charlie'],
    userEmail: '',
    userName: '',
    status: ''
  });

  const [activeStep, setActiveStep] = useState('send');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validated, setValidated] = useState(false);

  // get user email and name from local storage
  // const [userEmail, setUserEmail] = useLocalStorage('email', '');
  // const [userName, setUserName] = useLocalStorage('userName', '');

  // calculate exchange rate
  const amountToReceive = useExchangeRate(
    formData.sendingCountry,
    formData.receivingCountry,
    formData.amountToSend
  );

  // step validation checks
  const isSendValid = () => 
    formData.amountToSend >= MIN_AMOUNT &&
    formData.receivingCountry &&
    formData.sendingCountry;


  // event handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidated(true);

    if (!isSendValid()) {
      setError('Veuillez remplir correctement tous les champs requis');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // sending confirmation email
      await sendConfirmationEmail();
      
      // validating transaction
      await validateTransaction();
      
      navigate('/history');
    } catch (err) {
      setError('Erreur lors du traitement de la transaction');
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  const sendConfirmationEmail = async () => {
    const storedUserEmail = localStorage.getItem('email');
    const storedUserName = localStorage.getItem('userName');
    const token = localStorage.getItem('token');
    if (!storedUserEmail) throw new Error('Token ou email manquant');


    const accountLabel = formData.withdrawalMode === 'Orange Money'
      ? 'Numéro Orange Money'
      : formData.withdrawalMode === 'Mobile Money'
      ? 'Numéro MTN Money'
      : 'Numéro de compte';


    const emailData = {
      subject: "🔄 Votre transaction est en cours - Nkap Transfer",
      message: `
        Bonjour ${storedUserName || 'cher(e) utilisateur(trice)'},
    
        Nous vous informons que votre transaction est actuellement en cours de traitement. Voici un récapitulatif des détails de la transaction :
    
        🔄 **Détails de la transaction en cours :** 🔄
    
        💰 **Montant transféré :** ${formData.amountToSend} ${formData.sendingCurrency}
        🧑‍🤝‍🧑 **Destinataire :** ${formData.firstName} ${formData.lastName}
        🌍 **Ville :** ${formData.city}
        🏠 **Adresse :** ${formData.address}
        📞 ${accountLabel} ${formData.phoneNumber}
        💸 **Montant estimé à recevoir :** ${formData.amountToReceive} ${formData.receiveCurrency}
    
        ---------------------------------------------
    
        🚀 **Statut actuel :** Votre transaction est en cours de validation. Nous faisons tout notre possible pour la traiter dans les plus brefs délais.
    
        🕒 **Temps estimé :** Vous recevrez une notification une fois la transaction finalisée. Nous prévoyons une mise à jour dans les prochaines 24 heures.
    
        📢 **Suivi de votre transaction :**
        Vous pouvez suivre l'évolution de votre transaction directement depuis votre tableau de bord sur notre site, ou en contactant notre service client.
    
        Merci de faire confiance à **Nkap Transfer**. Nous nous engageons à assurer la sécurité et la rapidité de vos transferts.
    
        📧 Pour toute question ou demande d'assistance, contactez-nous à support@nkaptransfer.com.
    
        ✨ **Nous vous tiendrons informé(e) dès que votre transaction sera terminée !** ✨
    
        Bien cordialement,
        L’équipe **Nkap Transfer**
    
        🔐 *Votre sécurité est notre priorité !* 🔐
      `
    };
    
    

        try {
          const response = await fetch(
            'http://localhost:3000/api/transactions/send-email',{
            method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`, // Inclure le token pour l'authentification
              },
              body: JSON.stringify(emailData),
            }
          );

          if (response.ok) {
            const data = await response.text();
            console.log('Email sent:', data);
        } else {
            const errorData = await response.json();
            console.error('Error:', errorData.message);
        }
    } catch (error) {
        console.error('Network:', error);
    }
};

  const validateTransaction = async () => {
    const userId = localStorage.getItem('id');
    if (!userId) throw new Error('ID utilisateur manquant');

        try {
          // Appeler une API pour enregistrer la transaction (optionnel si nécessaire)
          // console.log('userId', localStorage.getItem('userId'));
          await axios.post(
            'http://localhost:3000/api/transactions/transactions', {
              headers: {
                'contentType': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('token')}`, // Passer le token JWT dans l'entête de la requête
              },
                userId: userId, // Ajouter les données utilisateur
                amount: formData.amountToSend,
                recipientName: `${formData.firstName} ${formData.lastName}`,
                method: `${formData.withdrawalMode}`,
                recipientTown: `${formData.city}`,
                recipientAddress: `${formData.address}`,
                accountNumber: `${formData.phoneNumber}`,
                reasonOfSending: `${formData.reasonList}`,
            }
          );

          alert('Transaction validée avec succès !');
    
          // Envoyer l'email et rediriger
          await sendConfirmationEmail();
          navigate('/history'); // Rediriger vers la page "Historique"
        } catch (error) {
          console.error("Erreur lors de la validation :", error);
          setStatus("Erreur lors de la validation de la transaction.");
        }
      };
  

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
                amountToReceive={amountToReceive}
                onBack={() => setActiveStep('details')}
                onValidate={validateTransaction}
              />
            )}
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default Transfer;