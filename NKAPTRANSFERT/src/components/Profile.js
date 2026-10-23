import { faCheckCircle, faEdit, faLock, faUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import api from '../api';
import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card, Col, Container, Form, Nav, Row } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import CompliancePanels from './CompliancePanels';

function Profile() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('personal');
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // // Fetch user profile data on component mount
    api.get('/api/users/profile')
      .then(response => {
        setUserInfo(response.data);
        setLoading(false);
      })
      .catch(error => {
        setError(t('profileLoadError'));
        setLoading(false);
      })
  }, [navigate, t]);

  const handlePasswordUpdate = () => {


    if (newPassword !== confirmNewPassword) {
      alert(t('passwordMismatch'));
      return;
    }else if(oldPassword === newPassword) {
      alert(t('passwordMustDiffer'));
      return; 

    }

    api.post('/api/users/update-password', {
      oldPassword,
      newPassword,
      confirmNewPassword,
    })
      .then(response => {
        alert(t('passwordUpdated'));
        setShowPasswordForm(false);
      })
      .catch(error => {
        alert(t('passwordUpdateError'));
      });
  };

  const renderContent = () => {
    if (loading) return <p>{t('loading')}</p>;
    if (error) return <p>{error}</p>;
    
    if (activeTab === 'personal' && userInfo) {
      return (
        <Card className="card-custom">
          <Card.Body>
            <Row>
              <Col md={6}>
                <h5><FontAwesomeIcon icon={faUser} className="me-2" /> {t('personalInfo')}</h5>
                <p><strong>{t('lastName')}:</strong> {userInfo.firstName} {userInfo.lastName}</p>
                <p><strong>{t('email')}:</strong> {userInfo.email}</p>
                <p><strong>{t('country')}:</strong> {userInfo.country}</p>
                <p><strong>{t('gender')}:</strong> {userInfo.gender === 'male' ? t('genderMale') : userInfo.gender === 'female' ? t('genderFemale') : userInfo.gender === 'other' ? t('genderOther') : userInfo.gender}</p>
                <p><strong>{t('birthDate')}:</strong> {userInfo.birthDate}</p>
                <p><strong>{t('addressLabel')}:</strong> {userInfo.street}</p>
                <p><strong>{t('city')}:</strong> {userInfo.city}</p>
                <p><strong>{t('postalCode')}:</strong> {userInfo.postalCode}</p>
                <p><strong>{t('phone')}:</strong> {userInfo.phone}</p>
                <p><strong>{t('accountStatus')}:</strong> {userInfo.status === 'blocked' ? t('statusBlocked') : t('statusActive')} <FontAwesomeIcon icon={faCheckCircle} style={{ color: 'green' }} /></p>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      );
    } else if (activeTab === 'security' && userInfo) {
      return (
        <Card className="card-custom">
          <Card.Body>
            <Row>
              <Col md={6}>
                <h5><FontAwesomeIcon icon={faLock} className="me-2" /> {t('security')}</h5>
                <p>
                  <strong>{t('password')}:</strong> ******
                  <Button variant="link" onClick={() => setShowPasswordForm(!showPasswordForm)}>
                    <FontAwesomeIcon icon={faEdit} /> {t('modify')}
                  </Button>
                </p>
                {showPasswordForm && (
                  <Form>
                    <Form.Group className="mb-3">
                      <Form.Label>{t('oldPassword')}</Form.Label>
                      <Form.Control type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>{t('newPassword')}</Form.Label>
                      <Form.Control type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>{t('confirmNewPassword')}</Form.Label>
                      <Form.Control type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} />
                    </Form.Group>
                    <Button variant="success" onClick={handlePasswordUpdate}>{t('confirm')}</Button>
                  </Form>
                )}
                <CompliancePanels />
              </Col>
            </Row>
          </Card.Body>
        </Card>
      );
    }
  };

  return (
    <Container fluid className="mt-5 container-custom">
      <Row>
        <Col md={4}>
          <Nav defaultActiveKey="/" className="flex-column">
            <Nav.Link href="/profile"><FontAwesomeIcon icon={faUser} className="me-2" /> {t('account')}</Nav.Link>
            <Nav.Link href="/recipients"><FontAwesomeIcon icon={faUser} className="me-2" /> {t('navRecipients')}</Nav.Link>
            <Nav.Link href="/transfer"><FontAwesomeIcon icon={faUser} className="me-2" /> {t('sendMoney')}</Nav.Link>
            <Nav.Link href="/history"><FontAwesomeIcon icon={faUser} className="me-2" /> {t('transactions')}</Nav.Link>
          </Nav>
        </Col>

        <Col md={8}>
          <h2><FontAwesomeIcon icon={faUser} className="me-2" /> {t('profile')}</h2>
          <Nav variant="tabs" defaultActiveKey="personal">
            <Nav.Item>
              <Nav.Link eventKey="personal" onClick={() => setActiveTab('personal')}>
                <FontAwesomeIcon icon={faUser} className="me-2" /> {t('personalInfo')}
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="security" onClick={() => setActiveTab('security')}>
                <FontAwesomeIcon icon={faLock} className="me-2" /> {t('security')}
              </Nav.Link>
            </Nav.Item>
          </Nav>
          {renderContent()}
        </Col>
      </Row>
    </Container>
  );
}

export default Profile;
