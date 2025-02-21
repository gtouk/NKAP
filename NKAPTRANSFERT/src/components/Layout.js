import React, { useContext, useState } from 'react';
import { Button, Col, Container, Nav, Navbar, Row } from 'react-bootstrap';
import Modal from 'react-bootstrap/Modal';
import { useTranslation } from 'react-i18next';
import { NavLink, useLocation } from 'react-router-dom';
import '../App.css';
import { AuthContext } from '../contexts/AuthContext';


const Layout = ({ children }) => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  // eslint-disable-next-line
  const [userInfo, setUserInfo] = useState(null);
  // eslint-disable-next-line
  const [contactInfo, setContactInfo] = useState(null);
  // eslint-disable-next-line
  const [openingHours, setOpeningHours] = useState([]);
  const { isAuthenticated, logout } = useContext(AuthContext);
  console.log("🟢 Layout - isAuthenticated:", isAuthenticated);
  const [showModal, setShowModal] = useState(false); // État pour afficher le modal de confirmation



  // useEffect(() => {
  //   Promise.all([
  //     fetch('/api/user').then(res => res.json()).then(setUserInfo),
  //     fetch('/api/contact-info').then(res => res.json()).then(setContactInfo),
  //     fetch('/api/opening-hours').then(res => res.json()).then(setOpeningHours),
  //   ]).catch(error => console.error('Erreur lors de la récupération des données:', error));
  // }, []);

  const swapLanguage = () => i18n.changeLanguage(i18n.language === 'en' ? 'fr' : 'en');

  const handleMouseEvent = (event, action) => {
    const synth = window.speechSynthesis;
    if (action === 'enter') {
      const utterance = new SpeechSynthesisUtterance(event.target.innerText);
      utterance.lang = i18n.language === 'fr' ? 'fr-FR' : 'en-US';
      const voice = synth.getVoices().find(v => v.lang === utterance.lang);
      if (voice) utterance.voice = voice;
      synth.speak(utterance);
    } else {
      synth.cancel();
    }
  };

  // Fonction pour afficher et cacher le modal de déconnexion
  const handleShowModal = () => setShowModal(true);
  const handleLogoutClick = async () => {
    logout();
    handleCloseModal();
  };
  const handleCloseModal = () => setShowModal(false);

  const navLinks = [
    // { path: '/', label: t('home') } || {path: '/home', label: t('home')},
    { path: '/transfer', label: t('transfer') },
    { path: '/pay', label: t('pay') },
    { path: '/contact', label: t('contact') },
    { path: '/history', label: t('history') },
    { path: '/profile', label: userInfo ? userInfo.username : <i className="fas fa-user-circle"> Profile </i>},
  ];

  return (
    <div>
      <Navbar bg="light" expand="lg">
        <Container fluid>
          <Navbar.Brand href="/" className="navbar-brand-custom">
            <h1><span className="brand-highlight">NKAP</span>Transfert</h1>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto">
              <Nav.Link as={NavLink} to="/home"
                onMouseEnter={e => handleMouseEvent(e, 'enter')}
                onMouseLeave={e => handleMouseEvent(e, 'leave')}
              >
                {t('home')}
              </Nav.Link>
              {isAuthenticated && navLinks.map(({ path, label }) => (
                <Nav.Link key={path} as={NavLink} to={path}
                  onMouseEnter={e => handleMouseEvent(e, 'enter')}
                  onMouseLeave={e => handleMouseEvent(e, 'leave')}
                >
                  {label}
                </Nav.Link>
              ))}
              {isAuthenticated ? (
                <Button variant="danger" onClick={handleShowModal}>{t('Deconnexion')}</Button>
              ) : (
                <Nav.Link as={NavLink} to="/signup"
                  onMouseEnter={e => handleMouseEvent(e, 'enter')}
                  onMouseLeave={e => handleMouseEvent(e, 'leave')}
                >
                  {t('signup')}
                </Nav.Link>
              )}
              <Nav.Link onClick={swapLanguage}
                onMouseEnter={e => handleMouseEvent(e, 'enter')}
                onMouseLeave={e => handleMouseEvent(e, 'leave')}
              >
                {t('english')}
              </Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container className="mt-4">{children}</Container>

      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Êtes-vous sûr ?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Voulez-vous vraiment vous déconnecter ?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Annuler
          </Button>
          <Button variant="danger" onClick={handleLogoutClick}>
            Confirmer
          </Button>
        </Modal.Footer>
      </Modal>


      {location.pathname === '/contact' && contactInfo && openingHours.length > 0 && (
        <footer className="text-white mt-5 p-4 text-center">
          <Container>
            <Row>
              <Col md={4} className="contact-information">
                <h5 onMouseEnter={e => handleMouseEvent(e, 'enter')}
                  onMouseLeave={e => handleMouseEvent(e, 'leave')}>
                  {t('contactUs')}
                </h5>
                {['phone', 'email', 'location'].map(key => (
                  <p key={key} onMouseEnter={e => handleMouseEvent(e, 'enter')}
                    onMouseLeave={e => handleMouseEvent(e, 'leave')}>
                    <i className={`fas fa-${key === 'location' ? 'map-marker-alt' : key}`}></i> {contactInfo[key]}
                  </p>
                ))}
              </Col>
              <Col md={8} className="opening-hours">
                <h5 onMouseEnter={e => handleMouseEvent(e, 'enter')}
                  onMouseLeave={e => handleMouseEvent(e, 'leave')}>
                  {t('openingHours')}
                </h5>
                {openingHours.map((hour, index) => (
                  <p key={index} onMouseEnter={e => handleMouseEvent(e, 'enter')}
                    onMouseLeave={e => handleMouseEvent(e, 'leave')}>
                    <i className="fas fa-clock"></i> {hour}
                  </p>
                ))}
              </Col>
            </Row>
          </Container>
        </footer>
      )}
    </div>
  );
};

export default Layout;