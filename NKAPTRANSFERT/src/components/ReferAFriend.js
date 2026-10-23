import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Button, Form } from 'react-bootstrap';

function ReferAFriend() {
  const { t } = useTranslation();
  const code = localStorage.getItem('id') || '';
  const link = `${window.location.origin}/signup?ref=${code}`;
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch (error) {
      setCopied(false);
    }
  };

  return (
    <div>
      <h2>{t('referTitle')}</h2>
      <p>{t('referHelp')}</p>
      <Form.Control className="mt-3" value={link} readOnly />
      <Button className="mt-3" onClick={copyLink}>{t('copyLink')}</Button>
      {copied && <Alert className="mt-3" variant="success">{t('linkCopied')}</Alert>}
    </div>
  );
}

export default ReferAFriend;
