import React from 'react';
import { useTranslation } from 'react-i18next';

function SendMoney() {
  const { t } = useTranslation();
  return (
    <div>
      <h2>{t('sendMoney')}</h2>
      <p>{t('faq3a')}</p>
    </div>
  );
}

export default SendMoney