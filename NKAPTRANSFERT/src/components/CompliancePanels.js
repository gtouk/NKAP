import api from '../api';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Button, Form } from 'react-bootstrap';

const STATUS_KEY = {
  pending: 'kycPending',
  approved: 'kycApproved',
  rejected: 'kycRejected',
  more_info: 'kycMore',
};

function CompliancePanels() {
  const { t } = useTranslation();
  const [kyc, setKyc] = useState(null);
  const [profile, setProfile] = useState(null);
  const [docType, setDocType] = useState('identity');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [notice, setNotice] = useState('');

  const load = () => {
    api.get('/api/kyc').then((response) => setKyc(response.data)).catch(() => setKyc(null));
    api.get('/api/users/profile').then((response) => setProfile(response.data)).catch(() => setProfile(null));
  };

  useEffect(() => {
    load();
  }, []);

  const upload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const contentBase64 = await file.arrayBuffer().then((buffer) => btoa(String.fromCharCode(...new Uint8Array(buffer))));
    await api.post('/api/kyc', {
      docType,
      fileName: file.name,
      mimeType: file.type,
      contentBase64,
    });
    setNotice(t('upload'));
    load();
  };

  const enable = async () => {
    const response = await api.post('/api/users/mfa/setup');
    setNotice(response.data.devCode ? `${t('mfaCode')}: ${response.data.devCode}` : t('mfaHelp'));
  };

  const confirm = async () => {
    await api.post('/api/users/mfa/confirm', { code });
    setNotice(t('enableMfa'));
    load();
  };

  const disable = async () => {
    await api.post('/api/users/mfa/disable', { password });
    setNotice(t('disableMfa'));
    load();
  };

  return (
    <div className="mt-4">
      {notice && <Alert variant="info">{notice}</Alert>}
      <h5>{t('kycTitle')}</h5>
      <p>{t('kycStatus')}: {t(STATUS_KEY[kyc?.status] || 'kycPending')}</p>
      <Form.Select className="mb-2" value={docType} onChange={(event) => setDocType(event.target.value)}>
        <option value="identity">{t('docIdentity')}</option>
        <option value="proof_of_address">{t('docAddress')}</option>
        <option value="other">{t('docOther')}</option>
      </Form.Select>
      <Form.Control type="file" onChange={upload} />
      <ul className="mt-2">
        {(kyc?.documents || []).map((doc) => (
          <li key={doc.id}>{doc.original_name} — {t(STATUS_KEY[doc.status] || 'kycPending')}</li>
        ))}
      </ul>

      <h5 className="mt-4">{t('mfaTitle')}</h5>
      {profile?.mfa_enabled ? (
        <>
          <Form.Control type="password" className="mb-2" placeholder={t('password')} value={password} onChange={(event) => setPassword(event.target.value)} />
          <Button variant="outline-danger" onClick={disable}>{t('disableMfa')}</Button>
        </>
      ) : (
        <>
          <Button className="me-2" onClick={enable}>{t('enableMfa')}</Button>
          <Form.Control className="mt-2" placeholder={t('mfaCode')} value={code} onChange={(event) => setCode(event.target.value)} />
          <Button className="mt-2" variant="success" onClick={confirm}>{t('confirm')}</Button>
        </>
      )}
    </div>
  );
}

export default CompliancePanels;
