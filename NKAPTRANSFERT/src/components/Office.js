import api from '../api';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Form, Table } from 'react-bootstrap';

const SECTIONS = ['transactions', 'clients', 'kyc', 'reconciliation', 'corridors', 'partners', 'audit'];

function Office() {
  const { t } = useTranslation();
  const role = localStorage.getItem('role');
  const [section, setSection] = useState('transactions');
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState([]);
  const [detail, setDetail] = useState(null);
  const [reason, setReason] = useState('');

  const labels = {
    transactions: t('transactions'),
    clients: t('clients'),
    kyc: t('kycTitle'),
    reconciliation: t('reconciliation'),
    corridors: t('corridors'),
    partners: t('partners'),
    audit: t('audit'),
  };

  const load = async (next = section, q = query) => {
    const path = {
      transactions: `/api/office/transactions?q=${encodeURIComponent(q)}`,
      clients: `/api/office/clients?q=${encodeURIComponent(q)}`,
      kyc: '/api/office/kyc',
      reconciliation: '/api/office/reconciliation',
      corridors: '/api/office/corridors',
      partners: '/api/office/partners',
      audit: '/api/office/audit',
    }[next];
    const response = await api.get(path);
    setRows(next === 'reconciliation' ? response.data.rows : response.data);
    setDetail(null);
  };

  useEffect(() => {
    load().catch(() => setRows([]));
    // Recharge seulement au changement de section ; la recherche relance load() elle-même.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section]);

  const review = async (decision) => {
    await api.post(`/api/office/transactions/${detail.transfer.reference}/review`, { decision, reason });
    const response = await api.get(`/api/office/transactions/${detail.transfer.reference}`);
    setDetail(response.data);
  };

  return (
    <div className="panel">
      <h1>{t('officeTitle')}</h1>
      <div className="admin-switch mb-3">
        {SECTIONS.map((item) => (
          <Button key={item} className={section === item ? 'active' : ''} onClick={() => setSection(item)}>{labels[item]}</Button>
        ))}
      </div>
      {(section === 'transactions' || section === 'clients') && (
        <Form className="d-flex gap-2 mb-3" onSubmit={(event) => { event.preventDefault(); load(); }}>
          <Form.Control value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('search')} />
          <Button type="submit">{t('search')}</Button>
        </Form>
      )}
      {section === 'reconciliation' && (
        <Button className="mb-3" onClick={async () => {
          const response = await api.get('/api/office/reconciliation/export', { responseType: 'blob' });
          const url = URL.createObjectURL(response.data);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'rapprochement.csv';
          link.click();
        }}>{t('exportAs', { format: 'CSV' })}</Button>
      )}
      <Table striped bordered hover size="sm">
        <tbody>
          {rows.slice(0, 30).map((row, index) => (
            <tr key={row.id || row.reference || index} onClick={async () => {
              if (section !== 'transactions' || !row.reference) return;
              const response = await api.get(`/api/office/transactions/${row.reference}`);
              setDetail(response.data);
            }}>
              <td>{row.reference || row.email || row.code || row.action || row.origin_country}</td>
              <td>{row.recipient_name || `${row.firstName || ''} ${row.lastName || row.name || ''}`.trim()}</td>
              <td>{row.transactionState || row.kyc_status || row.status || row.destination_country || ''}</td>
              <td>{row.amount || row.fx_rate || ''}</td>
            </tr>
          ))}
        </tbody>
      </Table>
      {detail && (
        <div className="mt-3">
          <h3>{detail.transfer.reference}</h3>
          <p>{detail.transfer.transactionState} — {detail.transfer.paymentStatus} — {detail.transfer.payoutStatus || '—'}</p>
          <ol>{detail.events.map((event) => <li key={`${event.state}-${event.created_at}`}>{event.state}</li>)}</ol>
          <Form.Control className="mb-2" placeholder={t('reasonOptional')} value={reason} onChange={(event) => setReason(event.target.value)} />
          {['compliance', 'finance', 'admin', 'superAdmin'].includes(role) && (
            <>
              <Button className="me-2" onClick={() => review('hold')}>{t('hold')}</Button>
              <Button className="me-2" onClick={() => review('approve')}>{t('approve')}</Button>
              <Button className="me-2" variant="danger" onClick={() => review('reject')}>{t('reject')}</Button>
            </>
          )}
          {['finance', 'admin', 'superAdmin'].includes(role) && (
            <>
              <Button className="me-2" variant="warning" onClick={() => review('refund')}>{t('refund')}</Button>
              <Button onClick={async () => {
                await api.post(`/api/office/transactions/${detail.transfer.reference}/paid`);
                const response = await api.get(`/api/office/transactions/${detail.transfer.reference}`);
                setDetail(response.data);
              }}>{t('markPaid')}</Button>
            </>
          )}
          {section === 'kyc' && role && null}
        </div>
      )}
      {section === 'kyc' && ['compliance', 'admin', 'superAdmin'].includes(role) && rows[0]?.id && (
        <div className="d-flex gap-2">
          <Button onClick={async () => { await api.post(`/api/office/kyc/${rows[0].id}/review`, { status: 'approved' }); load(); }}>{t('approve')}</Button>
          <Button variant="warning" onClick={async () => { await api.post(`/api/office/kyc/${rows[0].id}/review`, { status: 'more_info', note: reason }); load(); }}>{t('kycMore')}</Button>
          <Button variant="danger" onClick={async () => { await api.post(`/api/office/kyc/${rows[0].id}/review`, { status: 'rejected', note: reason }); load(); }}>{t('reject')}</Button>
        </div>
      )}
    </div>
  );
}

export default Office;
