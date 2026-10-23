import React, { useContext, useState } from 'react';
import { Button, Container, Nav, Navbar } from 'react-bootstrap';
import Modal from 'react-bootstrap/Modal';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import '../App.css';
import { AuthContext } from '../contexts/AuthContext';

const Layout = ({ children }) => {
  const { t, i18n } = useTranslation();
  const { isAuthenticated, logout } = useContext(AuthContext);
  const [showModal, setShowModal] = useState(false);
  const role = localStorage.getItem('role');
  const isAdmin = role === 'admin' || role === 'superAdmin';
  const isStaff = ['support', 'compliance', 'finance', 'admin', 'superAdmin'].includes(role);

  const swapLanguage = () => {
    const next = i18n.language.startsWith('en') ? 'fr' : 'en';
    i18n.changeLanguage(next);
  };

  const navLinks = [
    { path: '/transfer', label: t('navTransfer') },
    { path: '/pay', label: t('navBills') },
    { path: '/history', label: t('history') },
    { path: '/recipients', label: t('navRecipients') },
    { path: '/contact', label: t('navContact') },
    { path: '/profile', label: t('navProfile') },
  ];
  if (isStaff) navLinks.push({ path: '/office', label: t('navOffice') });
  if (isAdmin) navLinks.push({ path: '/adminInterface', label: t('navAdmin') });

  return (
    <div className="nkap-app">
      <Navbar expand="lg" className="nkap-nav" sticky="top">
        <Container fluid>
          <Navbar.Brand as={NavLink} to="/" className="nkap-brand">
            <span className="nkap-mark">N</span>
            NKAP Transfert
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="nkap-nav" />
          <Navbar.Collapse id="nkap-nav">
            <Nav className="ms-auto">
              <Nav.Link as={NavLink} to="/home">{t('home')}</Nav.Link>
              {isAuthenticated && navLinks.map(({ path, label }) => (
                <Nav.Link key={path} as={NavLink} to={path}>{label}</Nav.Link>
              ))}
              {isAuthenticated ? (
                <Button variant="outline-danger" className="nkap-logout" onClick={() => setShowModal(true)}>
                  {t('logout')}
                </Button>
              ) : (
                <>
                  <Nav.Link as={NavLink} to="/login">{t('login')}</Nav.Link>
                  <Nav.Link as={NavLink} to="/signup">{t('signup')}</Nav.Link>
                </>
              )}
              <Nav.Link className="nkap-lang" onClick={swapLanguage}>{t('english')}</Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <main className="nkap-main">{children}</main>

      <footer className="nkap-footer">
        <Container className="d-flex flex-wrap justify-content-between gap-3">
          <div>
            <strong>NKAP Transfert</strong>
            <p>{t('footerTagline')}</p>
          </div>
          <div>
            <p>support@nkaptransfer.com</p>
            <p>{t('hours')}</p>
          </div>
        </Container>
      </footer>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{t('logoutTitle')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{t('logoutBody')}</Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => setShowModal(false)}>{t('cancel')}</Button>
          <Button variant="danger" onClick={() => { setShowModal(false); logout(); }}>{t('confirm')}</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Layout;
