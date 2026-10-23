import api from '../api';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Col, Container, Row } from 'react-bootstrap';

function Account() {
  const { t } = useTranslation();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/api/users/profile')
      .then((response) => setProfile(response.data))
      .catch(() => setError(t('accountError')));
  }, [t]);

  if (error) return <p className="text-danger">{error}</p>;
  if (!profile) return <p>{t('accountLoading')}</p>;

  return (
    <Container className="mt-4">
      <h2>{t('myAccount')}</h2>
      <Card className="mt-3">
        <Card.Body>
          <Row>
            <Col md={6}>
              <p><strong>{t('nameRequired')} :</strong> {profile.firstName} {profile.lastName}</p>
              <p><strong>{t('email')} :</strong> {profile.email}</p>
              <p><strong>{t('phone')} :</strong> {profile.phone || '—'}</p>
              <p><strong>{t('role')} :</strong> {profile.role}</p>
            </Col>
            <Col md={6}>
              <p><strong>{t('state')} :</strong> {profile.status === 'blocked' ? t('statusBlocked') : t('statusActive')}</p>
              <p><strong>{t('country')} :</strong> {profile.country}</p>
              <p><strong>{t('city')} :</strong> {profile.city}</p>
              <p><strong>{t('wallet')} :</strong> {Number(profile.wallet || 0).toFixed(2)} CAD</p>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default Account;
