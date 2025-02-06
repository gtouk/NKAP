import { faCheckCircle, faEdit, faLock, faUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import axios from 'axios'; // for making API requests
import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useEffect, useState } from 'react';
import { Button, Card, Col, Container, Form, Nav, Row } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

function Profile() {
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
    const token = localStorage.getItem('token');
    axios.get(`http://${process.env.REACT_NKAP_DEMO_API_URL}/api/users/profile`, {  // Assuming JWT is sent with cookies
    headers: {
      Authorization: `Bearer ${token}`  // Add token to headers
    }
  })
      .then(response => {
        setUserInfo(response.data);
        setLoading(false);
      })
      .catch(error => {
        setError('Failed to load profile data.');
        setLoading(false);
      })
  }, [navigate]);

  const handlePasswordUpdate = () => {


    if (newPassword !== confirmNewPassword) {
      alert("Les nouveaux mots de passe ne correspondent pas");
      return;
    }else if(oldPassword === newPassword) {
      alert("Le nouveau mot de passe doit être différent de l'ancien mot de passe");
      return; 

    }

    const token = localStorage.getItem('token');

    // Envoyer la requête au backend pour changer le mot de passe
  axios.post(`http://${process.env.REACT_NKAP_DEMO_API_URL}/api/users/update-password`, {
      oldPassword,
      newPassword, confirmNewPassword
    },     
    {
      headers: {
        Authorization: `Bearer ${token}`  // Add token to headers
      }
    }
  )
      .then(response => {
        alert("Mot de passe mis à jour avec succès");
        setShowPasswordForm(false);
      })
      .catch(error => {
        alert("Erreur lors de la mise à jour du mot de passe");
      });
  };

  const renderContent = () => {
    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;
    
    if (activeTab === 'personal' && userInfo) {
      return (
        <Card className="card-custom">
          <Card.Body>
            <Row>
              <Col md={6}>
                <h5><FontAwesomeIcon icon={faUser} className="me-2" /> Informations personnelles</h5>
                <p><strong>Nom:</strong> {userInfo.name}</p>
                <p><strong>Email:</strong> {userInfo.email}</p>
                <p><strong>Téléphone:</strong> {userInfo.phone}</p>
                <p><strong>Statut du compte:</strong> <FontAwesomeIcon icon={faCheckCircle} style={{ color: 'green' }} /></p>
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
                <h5><FontAwesomeIcon icon={faLock} className="me-2" /> Connexion et sécurité</h5>
                <p>
                  <strong>Mot de passe:</strong> ******
                  <Button variant="link" onClick={() => setShowPasswordForm(!showPasswordForm)}>
                    <FontAwesomeIcon icon={faEdit} /> Modifier
                  </Button>
                </p>
                {showPasswordForm && (
                  <Form>
                    <Form.Group className="mb-3">
                      <Form.Label>Ancien mot de passe</Form.Label>
                      <Form.Control type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Nouveau mot de passe</Form.Label>
                      <Form.Control type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Confirmer le nouveau mot de passe</Form.Label>
                      <Form.Control type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} />
                    </Form.Group>
                    <Button variant="success" onClick={handlePasswordUpdate}>Confirmer</Button>
                  </Form>
                )}
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
          <Nav defaultActiveKey="/home" className="flex-column">
            <Nav.Link href="#account"><FontAwesomeIcon icon={faUser} className="me-2" /> Compte</Nav.Link>
            <Nav.Link href="#recipients"><FontAwesomeIcon icon={faUser} className="me-2" /> Destinataires</Nav.Link>
            <Nav.Link href="#send-money"><FontAwesomeIcon icon={faUser} className="me-2" /> Envoyer de l'argent</Nav.Link>
            <Nav.Link href="#transactions"><FontAwesomeIcon icon={faUser} className="me-2" /> Transactions</Nav.Link>
          </Nav>
        </Col>

        <Col md={8}>
          <h2><FontAwesomeIcon icon={faUser} className="me-2" /> Profil</h2>
          <Nav variant="tabs" defaultActiveKey="personal">
            <Nav.Item>
              <Nav.Link eventKey="personal" onClick={() => setActiveTab('personal')}>
                <FontAwesomeIcon icon={faUser} className="me-2" /> Informations personnelles
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="security" onClick={() => setActiveTab('security')}>
                <FontAwesomeIcon icon={faLock} className="me-2" /> Connexion et sécurité
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
