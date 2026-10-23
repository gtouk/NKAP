import api from '../../api';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Button, Container, Form } from 'react-bootstrap';

const CreateAdmin = () => {
    const { t } = useTranslation();
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
            const response = await api.post('/api/admins/createAdmin', {
                name, email, phone, password, passwordConfirm, role,
            });

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
                error.response?.data?.message || t('genericError')
            );
            setShowAlert(true);
        }
    };

    return (
        <Container className="mt-4">
            <h2>{t('createAdmin')}</h2>
            <Form onSubmit={handleSubmit}>

                <Form.Group controlId="formName">
                    <Form.Label>{t('nameRequired')}</Form.Label>
                    <Form.Control
                        type="text"
                        placeholder={t('enterName')}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </Form.Group>

                <Form.Group controlId="formEmail" className="mt-3">
                    <Form.Label>{t('email')}</Form.Label>
                    <Form.Control
                        type="email"
                        placeholder={t('enterEmail')}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </Form.Group>

                <Form.Group controlId="formPhone" className="mt-3">
                    <Form.Label>{t('phone')}</Form.Label>
                    <Form.Control
                        type="text"
                        placeholder={t('enterPhone')}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                    />
                </Form.Group>

                <Form.Group controlId="formPassword" className="mt-3">
                    <Form.Label>{t('password')}</Form.Label>
                    <Form.Control
                        type="password"
                        placeholder={t('yourPassword')}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </Form.Group>

                <Form.Group controlId="formPasswordConfirm" className="mt-3">
                    <Form.Label>{t('confirmPassword')}</Form.Label>
                    <Form.Control
                        type="password"
                        placeholder={t('confirmPassword')}
                        value={passwordConfirm}
                        onChange={(e) => setPasswordConfirm(e.target.value)}
                        required
                    />
                </Form.Group>

                <Form.Group controlId="formRole" className="mt-3">
                    <Form.Label>{t('role')}</Form.Label>
                    <Form.Control
                        as="select"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        required
                    >
                        <option value="support">{t('roleSupport')}</option>
                        <option value="compliance">{t('roleCompliance')}</option>
                        <option value="finance">{t('roleFinance')}</option>
                        <option value="admin">{t('roleAdmin')}</option>
                        <option value="superAdmin">{t('roleSuperAdmin')}</option>
                    </Form.Control>
                </Form.Group>

                <Button variant="primary" type="submit" className="mt-4">
                    {t('createAdminButton')}
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
