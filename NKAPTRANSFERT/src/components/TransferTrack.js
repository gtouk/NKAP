import api from '../api';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from 'react-bootstrap';
import { useParams } from 'react-router-dom';

function TransferTrack() {
  const { t } = useTranslation();
  const { reference } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const load = () => {
    api.get(`/api/transfers/${reference}/timeline`)
      .then((response) => setData(response.data))
      .catch((err) => setError(err.response?.data?.message || t('transferFailed')));
  };

  useEffect(() => {
    load();
  }, [reference]);

  const simulate = async () => {
    await api.post(`/api/transfers/${data.transfer.id}/simulate-payment`, { amount: data.transfer.amount });
    load();
  };

  const receipt = async () => {
    const response = await api.get(`/api/transfers/${reference}/receipt`, { responseType: 'blob' });
    const url = URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${reference}.pdf`;
    link.click();
  };

  if (error) return <p className="text-danger">{error}</p>;
  if (!data) return <p>{t('loading')}</p>;
  const transfer = data.transfer;

  return (
    <div className="panel">
      <h2>{t('track')}</h2>
      <p><strong>{t('reference')}:</strong> {transfer.reference}</p>
      <p><strong>{t('state')}:</strong> {transfer.transactionState}</p>
      <p><strong>{t('amountSent')}:</strong> {transfer.amount} {transfer.currencySent}</p>
      <p><strong>{t('fee')}:</strong> {transfer.fee} CAD</p>
      <p><strong>{t('fxRate')}:</strong> {transfer.fxRate}</p>
      <p><strong>{t('amountReceived')}:</strong> {transfer.amountToReceive} {transfer.currencyReceived}</p>
      <p><strong>{t('paymentMethod')}:</strong> {transfer.paymentStatus}</p>
      {transfer.holdReason && <p>{transfer.holdReason}</p>}
      <h3 className="mt-4">{t('timeline')}</h3>
      <ol>
        {data.events.map((event) => (
          <li key={`${event.state}-${event.created_at}`}>{event.state}{event.note ? ` — ${event.note}` : ''}</li>
        ))}
      </ol>
      <Button className="me-2" onClick={receipt}>{t('downloadReceipt')}</Button>
      {transfer.paymentStatus === 'expected' && (
        <Button variant="outline-primary" onClick={simulate}>{t('simulatePayment')}</Button>
      )}
    </div>
  );
}

export default TransferTrack;
