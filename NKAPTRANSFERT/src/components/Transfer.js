import { faArrowLeft, faCheckCircle, faCreditCard, faMoneyCheckAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useEffect, useState } from 'react';
import { Button, Col, Container, Form, InputGroup, Row } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import './Style/Transfer.css';


const countries = {
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

const defaultExchangeRate = 1;

function Transfer() {
  const [activeStep, setActiveStep] = useState('envoyer');
  const [sendingCountry, setSendingCountry] = useState('Canada'); // Fixed sending country to Canada
  const [receivingCountry, setReceivingCountry] = useState('Cameroun'); // Fixed receiving country to Cameroon
  const [amountToSend, setAmountToSend] = useState('');
  const [amountToReceive, setAmountToReceive] = useState('');
  const [withdrawalMode, setWithdrawalMode] = useState('');
  const [recipient, setRecipient] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [recipientList, setRecipientList] = useState(['Alice', 'Bob', 'Charlie']); // List of previous recipients
  const [reasonList, setReasonList] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [confirmPhoneNumber, setConfirmPhoneNumber] = useState();
  const [isOther, setIsOther] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [sendCountry, setSendCountry] = useState('');
  const [receiveCountry, setReceiveCountry] = useState('');
  const [sendAmount, setSendAmount] = useState(0);
  const [receiveCurrency, setReceiveCurrency] = useState('XAF');
  const [sendCurrency, setSendCurrency] = useState('CAD');
  const [receiveAmount, setReceiveAmount] = useState(0);
  const [validated, setValidated] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [status, setStatus] = useState('');
  const [value, setValue] = useState("");
  useEffect(() => {
  //get email from local storage
  const storedUserEmail = localStorage.getItem('email');
  if (storedUserEmail) {
    setUserEmail(storedUserEmail);
    console.log('Nom d\'utilisateur récupéré:', storedUserEmail);
  }

  const storedUserName = localStorage.getItem('userName');
  if (storedUserName) {
    setUserName(storedUserName);
    console.log('Nom d\'utilisateur récupéré:', storedUserName);
  }
}, []);

const handleChange = (event) => {
  console.log("Valeur actuelle: ", event.target.value);  // Vérifier la valeur avant la mise à jour
  setValue(event.target.value);
};


  const handleSubmit = (event) => {
    event.preventDefault();
    navigate('/transfer');
    event.stopPropagation();

    // Validation de la valeur de sendAmount
    if (sendAmount < 15) {
      setErrorMessage("Le montant à envoyer doit être au moins de 15.");
      return;
    }

    if (phoneNumber !== confirmPhoneNumber) {
      setErrorMessage("Les numéros de téléphone ne correspondent pas.");
      return;
    }

    // Si toutes les validations sont correctes
    setErrorMessage(""); // Réinitialise le message d'erreur
    setValidated(true);
    // Logique pour passer à l'étape suivante ou soumettre les données
    console.log("Formulaire validé !");
  };



  // Handlers for form fields
  const handleSendCountryChange = (event) => setSendingCountry(event.target.value);
  const handleReceiveCountryChange = (event) => setReceivingCountry(event.target.value);
  const handleAmountToSendChange = (event) => setAmountToSend(event.target.value);
  const handleAmountToReceiveChange = (event) => setAmountToReceive(event.target.value);
  const handleWithdrawalModeChange = (event) => setWithdrawalMode(event.target.value);
  const handleRecipientChange = (event) => setRecipient(event.target.value);
  const handleFirstNameChange = (event) => setFirstName(event.target.value);
  const handleLastNameChange = (event) => setLastName(event.target.value);
  const handleCityChange = (event) => setCity(event.target.value);
  const handleAddressChange = (event) => setAddress(event.target.value);
  const handlePhoneNumberChange = (event) => setPhoneNumber(event.target.value);
  const handleConfirmPhoneNumberChange = (event) => setConfirmPhoneNumber(event.target.value);
  // const handleSendAmountChange = (event) => setSendAmount(event.target.value);
  const handleIsOtherChange = () => setIsOther(!isOther);

  // Calculate amount to receive based on exchange rate
  useEffect(() => {
    if (receiveCountry) {
      const receiveCountryData = countries.ReceivingCountry.countries.find(
        (country) => country.name === receiveCountry
      );

      if (receiveCountryData) {
        setReceiveCurrency(
          receiveCountry === 'Cameroun' ? 'XAF' : 'XOF'
        );
        setReceiveAmount(sendAmount * (countries.ReceivingCountry.rates.SendingCountry || defaultExchangeRate));
      } else {
        setSendCurrency('');
        setReceiveCurrency('');
        setReceiveCountry('');
      }
    }
  }, [sendCountry, receiveCountry, sendAmount]);


  // Form validation checks
  const isEnvoyerValid = () => sendAmount && countries.ReceivingCountry.countries.find((country) => country.name === receiveCountry) && sendAmount >= 15;
  const isDetailsValid = () => {
    return (
      reasonList &&
      firstName &&
      lastName &&
      city &&
      address &&
      phoneNumber &&
      confirmPhoneNumber &&
      phoneNumber === confirmPhoneNumber
    );
  };

  const goBack = () => {
    switch (activeStep) {
      case 'details':
        setActiveStep('envoyer');
        break;
      case 'reussi':
        setActiveStep('details');
        break;
      default:
        navigate(-1);
    }
  };

  



  const Envoyer = () => {

    return (
      <div>
        <h2>
          <FontAwesomeIcon icon={faMoneyCheckAlt} className="me-2" /> Envoyer de l'argent
        </h2>
        <Form noValidate validated={validated} onSubmit={handleSubmit}>
          <Form.Group controlId="formSendCountry" >
            <Form.Label
              className="form-label"
              // onMouseEnter={() => speakText(t('sendCountryLabel'))}
              aria-label={t('sendCountryLabel')}
            >
              {t('sendCountryLabel')}
            </Form.Label>
            <Form.Control
              as="select"
              name='sendCountry'
              value={sendCountry}
              onChange={(e) => setSendCountry(e.target.value)}
              aria-label={t('sendCountryLabel')}
              required
            >
              {/* <option value="">{t('selectCountry')}</option> */}
              {<option value="Canada">Canada</option>}
              {/* {continents[continentFrom]?.countries.map((country, index) => (
                    <option key={index} value={country.name}>{country.name}</option>
                  ))} */}
            </Form.Control>
          </Form.Group>

          <Form.Group controlId="formReceiveCountry" className="form-group">
            <Form.Label
              className="form-label"
              
              // onMouseEnter={() => speakText(t('sendToLabel'))}
              aria-label={t('sendToLabel')}
            >
              {t('sendToLabel')}
            </Form.Label>
            <Form.Control
            required
              as="select"
              name='receiveCountry'
              value={receiveCountry}
              onChange={(e) => setReceiveCountry(e.target.value)}
              aria-label={t('sendToLabel')}
            >
              <option value="">{t('selectCountry')}</option>
              {countries.ReceivingCountry.countries.map((country, index) => (
                <option key={index} value={country.name}>{country.name}</option>
              ))}
              {/* {continents[continentTo]?.countries.map((country, index) => (
                    <option key={index} value={country.name}>{country.name}</option>
                  ))} */}
            </Form.Control>
          </Form.Group>

          <Form.Group controlId="formSendAmount" className="form-group">
            <Form.Label
              className="form-label"
              // onMouseEnter={() => speakText(t('sendLabel'))}
              aria-label={t('sendLabel')}
            >
              {t('sendLabel')}
            </Form.Label>
            <InputGroup className="input-group">
              <Form.Control
                type="number"
                name='sendAmount'
                onChange={(e) => setSendAmount(parseFloat(e.target.value) || 0)}
                value={sendAmount}
                aria-label={t('sendAmountLabel')}
                placeholder="Entrez le montant à envoyer"
                required />
              <Form.Control value='CAD' 
              readOnly
              aria-label={t('sendCurrencyLabel')}>
                {/* <option>{sendCurrency}</option> */}
              </Form.Control>
              {sendAmount < 15 && (
            <div className="text-danger mt-1">
              {errorMessage || "Le montant doit être au moins de 15."}
            </div>)}
            </InputGroup>
          </Form.Group>
          

          <Form.Group controlId="formReceiveAmount" className="form-group">
            <Form.Label
              className="form-label"
              // onMouseEnter={() => speakText(t('equivalentLabel'))}
              aria-label={t('equivalentLabel')}
            >
              {t('equivalentLabel')}
            </Form.Label>
            <InputGroup className="input-group">
              <Form.Control
                type="number"
                value={receiveAmount}
                readOnly
                aria-label={t('receiveAmountLabel')} />
              <Form.Control as="select" value={receiveCurrency} readOnly aria-label={t('receiveCurrencyLabel')}>
                <option value={receiveCurrency}>{receiveCurrency}</option>
              </Form.Control>
            </InputGroup>
          </Form.Group>
          <Button
            type="submit"
            className="btn btn-success"
            onClick={() => setActiveStep('details')}
            disabled={!isEnvoyerValid() || sendAmount < 15}
          >
            Suivant <FontAwesomeIcon icon={faCheckCircle} className="ms-2" />
          </Button>
          <Button type="button" className="btn btn-secondary ms-2" onClick={goBack}>
            <FontAwesomeIcon icon={faArrowLeft} className="me-2" /> Annuler
          </Button>
        </Form>
      </div>
    );
  };

  const Details = () => {
    return (
      <div>
        <h2>
          <FontAwesomeIcon icon={faCreditCard} className="me-2" /> Détails du transfert
        </h2>
        <Form noValidate validated={validated} onSubmit={handleSubmit}>
          {/* <Row className="mb-3"> */}
          <Form.Group controlId="formReasonList" className="form-group">  
              <Form.Label>Raisons d'envois</Form.Label>
              <Form.Control 
              as="select"
              value={reasonList}
              onChange={(e) => setReasonList(e.target.value)}
              required>
              {<option>--Choisir--</option>}
              {<option value="1">Soutien de la famille ou des amis</option>}
              {<option value="2">Achat de services</option>}
              {<option value="3">Envoie de fond a soi-meme</option>}
              </Form.Control>
          </Form.Group>
          <Form.Group as={Col}  controlId="validationCustom01">
            <Form.Label>Nom</Form.Label>
            <Form.Control
              required
              value={firstName}
              onChange={handleFirstNameChange}
              type="text"
              placeholder="First name"
               />
            <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
          </Form.Group>
          <Form.Group as={Col}  controlId="validationCustom02">
            <Form.Label>Prenom</Form.Label>
            <Form.Control
              required
              type="text"
              value={lastName}
              onChange={handleLastNameChange}
              placeholder="Last name"
               />
            <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
          </Form.Group>
          <Form.Group as={Col}  controlId="validationCustom03">
            <Form.Label>Ville</Form.Label>
            <Form.Control
              required
              type="text"
              value={city}
              onChange={handleCityChange}
              placeholder="Ville"
               />
            <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
          </Form.Group>
          <Form.Group as={Col}  controlId="validationCustom04">
            <Form.Label>Adresse du destinataire</Form.Label>
            <Form.Control
              required
              type="text"
              value={address}
              onChange={handleAddressChange}
              placeholder="Adresse du destinataire"
               />
            <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
          </Form.Group>
          <Form.Group as={Col}  controlId="validationCustomPhoneNum1">
            <Form.Label>Numero de compte</Form.Label>
            <InputGroup hasValidation>
              <InputGroup.Text id="inputGroupPrepend1">+237</InputGroup.Text>
              <Form.Control
                type="tel"
                placeholder="Numero de compte"
                value={phoneNumber}
                onChange={handlePhoneNumberChange}
                // aria-describedby="inputGroupPrepend"
                required
                isInvalid={phoneNumber !==confirmPhoneNumber && validated}
                 />
              <Form.Control.Feedback type="invalid">
                SVP entrez le numero du destinataire.
              </Form.Control.Feedback>
            </InputGroup>
          </Form.Group>
          <Form.Group as={Col}  controlId="validationCustomPhoneNum2">
            <Form.Label>Confirmer le Numero de compte</Form.Label>
            <InputGroup hasValidation>
              <InputGroup.Text id="inputGroupPrepend2">+237</InputGroup.Text>
              <Form.Control
                type="tel"
                placeholder="Confirmer le Numero de compte"
                value={confirmPhoneNumber}
                onChange={handleConfirmPhoneNumberChange}
                // aria-describedby="inputGroupPrepend"
                required 
                isInvalid={phoneNumber !==confirmPhoneNumber && validated}
                />
              <Form.Control.Feedback type="invalid">
                SVP entrez le numero du destinataire.
              </Form.Control.Feedback>
            </InputGroup>
          </Form.Group>
          {/* </Row> */}
          {/* <Row className="mb-3"> */}
          {/* </Row> */}
          <Form.Group className="mb-3">
            <Form.Check
              required
              label="Cochez si vous faites cette transaction pour le compte de quelqu’un d’autre"
              // feedback="You must  before submitting."
              // feedbackType="invalid"
               />
          </Form.Group>

          <Button
          type='button'
          className='btn btn-secondary'
          onClick={() => setActiveStep('envoyer')}
          >Retour</Button>

          <Button 
          type="submit"
          className='btn btn-success'
          onClick={() => setActiveStep('reussi')}
          disabled={!isDetailsValid()}>
            Suivant</Button>
        </Form>
      </div>


    );
  };

    const Reussi = () => {
      useEffect(() => {

      }, []);
  
      //send email for confirmation
      const envoyerCourriel = async () => {
        const storedUserEmail = localStorage.getItem('email'); // Email utilisateur connecté
        const storedUserId = localStorage.getItem('userId'); // ID utilisateur connecté
        const storedUserName = localStorage.getItem('userName'); // Nom utilisateur connecté
        let token = localStorage.getItem('token'); // Token JWT
        console.log('le token est:', token);

    
        if (!storedUserEmail) {
          console.error("Impossible d'envoyer l'email : email ou token manquant");
          setStatus("Erreur : email ou token manquant.");
          return;
        }
        const emailData = {
            subject: "Confirmation de transaction",
            message: `
          Bonjour ${storedUserName || ''},
          
          Votre transaction a été enregistrée avec succès.
          
          Détails de la transaction :
          - Montant transféré : ${sendAmount} ${sendCurrency}
          - Destinataire : ${firstName} ${lastName}
          - Ville : ${city}
          - Adresse : ${address}
          - Téléphone : ${phoneNumber}
          - Montant reçu : ${receiveAmount} ${receiveCurrency}
          
          Merci d'utiliser nos services !
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
            console.log('Email envoyé:', data);
        } else {
            const errorData = await response.json();
            console.error('Erreur:', errorData.message);
        }
    } catch (error) {
        console.error('Erreur réseau:', error);
    }
};

    
      // Fonction pour valider la transaction
      const validerTransaction = async () => {
        // localStorage.setItem('userId', id);

        const storedUserId = localStorage.getItem('id'); // ID utilisateur connecté

        try {
          // Appeler une API pour enregistrer la transaction (optionnel si nécessaire)
          // console.log('userId', localStorage.getItem('userId'));
          await axios.post(
            'http://localhost:3000/api/transactions/transactions', {
              headers: {
                'contentType': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('token')}`, // Passer le token JWT dans l'entête de la requête
              },
                userId: storedUserId, // Ajouter les données utilisateur
                amount: sendAmount,
                recipientName: `${firstName} ${lastName}`,
            }
          );

          alert('Transaction validée avec succès !');
    
          // Envoyer l'email et rediriger
          await envoyerCourriel();
          navigate('/history'); // Rediriger vers la page "Historique"
        } catch (error) {
          console.error("Erreur lors de la validation :", error);
          setStatus("Erreur lors de la validation de la transaction.");
        }
      };
    


      //function to validate the transaction
      // const validerTransaction = async() => {
      //   axios.post("/api/historique-transactions", {
      //     utilisateurId: $,
      //     montant,
      //     destinataire,
      //   })
      //     .then(() => {
      //       envoyerCourriel(); // Envoyer un courriel après validation
      //       navigate("/history"); // Rediriger vers l'historique des transactions
      //     })
      //     .catch((err) => console.error("Erreur lors de la validation :", err));
      // };
  
      return (
        <div>
          <h2>
            <FontAwesomeIcon icon={faCheckCircle} className="me-2" /> Transfert en cours
          </h2>
          <p>
            Vous etes sur le point d'effectuer une transaction
          </p>
          <p>
            Destinaire: {firstName} {lastName}
          </p>
          <p>
            Ville: {city}
          </p>
          <p>
            Adresse: {address}
          </p>
          <p>
            Numero de compte: {phoneNumber}
          </p>
          <p>
            Montant envoyé: {sendAmount} {sendCurrency}
          </p>
          <p>
            Montant reçu: {receiveAmount} {receiveCurrency}
          </p>
  
          <Button
          type='button'
          className='btn btn-secondary'
          onClick={() => setActiveStep('details')}
          >
            <FontAwesomeIcon icon={faArrowLeft} className="me-2" /> Modifier
          </Button>
  
          <Button
            type="button"
            className="btn btn-success"
            onClick={validerTransaction}
          >
            Valider la transaction
          </Button>
        </div>
      );
    };
  
  
  
  



  return (
    <div className="transfer">
      <Container>
        <Row>
          <Col>
            {activeStep === 'envoyer' && <Envoyer />}
            {activeStep === 'details' && <Details />}
            {activeStep === 'reussi' && <Reussi />}
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default Transfer;