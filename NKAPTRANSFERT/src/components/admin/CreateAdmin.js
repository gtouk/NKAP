import axios from 'axios';
import React, { useState } from 'react';
import { Alert, Button, Container, Form } from 'react-bootstrap';

const CreateAdmin = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [role, setRole] = useState('admin');  // Par défaut 'admin'
    const [message, setMessage] = useState('');
    const [showAlert, setShowAlert] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.post('http://localhost:3000/api/admins/createAdmin',
                { name, email, phone, password, passwordConfirm, role },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                }
            );

            setMessage(response.data.message);
            setShowAlert(true);

            // Réinitialiser le formulaire en cas de succès
            if (response.status === 201) {
                setName('');
                setEmail('');
                setPhone('');
                setPassword('');
                setPasswordConfirm('');
                setRole('admin');  // Réinitialise à 'admin' par défaut
            }
        } catch (error) {
            console.error('Erreur lors de la création de l\'admin:', error);
            setMessage(
                error.response?.data?.message || 'Une erreur est survenue.'
            );
            setShowAlert(true);
        }
    };

    return (
        <Container className="mt-4">
            <h2>Créer un Admin</h2>
            <Form onSubmit={handleSubmit}>

                <Form.Group controlId="formName">
                    <Form.Label>Nom</Form.Label>
                    <Form.Control
                        type="text"
                        placeholder="Entrez le nom"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </Form.Group>

                <Form.Group controlId="formEmail" className="mt-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                        type="email"
                        placeholder="Entrez l'email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </Form.Group>

                <Form.Group controlId="formPhone" className="mt-3">
                    <Form.Label>Téléphone</Form.Label>
                    <Form.Control
                        type="text"
                        placeholder="Entrez le numéro de téléphone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                    />
                </Form.Group>

                <Form.Group controlId="formPassword" className="mt-3">
                    <Form.Label>Mot de passe</Form.Label>
                    <Form.Control
                        type="password"
                        placeholder="Entrez le mot de passe"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </Form.Group>

                <Form.Group controlId="formPasswordConfirm" className="mt-3">
                    <Form.Label>Confirmez le mot de passe</Form.Label>
                    <Form.Control
                        type="password"
                        placeholder="Confirmez le mot de passe"
                        value={passwordConfirm}
                        onChange={(e) => setPasswordConfirm(e.target.value)}
                        required
                    />
                </Form.Group>

                <Form.Group controlId="formRole" className="mt-3">
                    <Form.Label>Rôle</Form.Label>
                    <Form.Control
                        as="select"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        required
                    >
                        <option value="admin">Admin</option>
                        <option value="superAdmin">Super Admin</option>
                    </Form.Control>
                </Form.Group>

                <Button variant="primary" type="submit" className="mt-4">
                    Créer Admin
                </Button>
            </Form>

            {showAlert && (
                <Alert variant={message.includes('erreur') ? 'danger' : 'success'} className="mt-3">
                    {message}
                </Alert>
            )}
        </Container>
    );
};

export default CreateAdmin;
