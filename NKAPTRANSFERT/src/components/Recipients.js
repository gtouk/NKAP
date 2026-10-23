import api from '../api';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Form, Table } from 'react-bootstrap';

const EMPTY = {
  firstName: '',
  lastName: '',
  phone: '',
  country: 'Cameroun',
  receptionMode: 'Orange Money',
  accountNumber: '',
  city: '',
  address: '',
};

function Recipients() {
  const { t } = useTranslation();
  const [recipients, setRecipients] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');

  const load = () => {
    api.get('/api/beneficiaries')
      .then((response) => setRecipients(response.data))
      .catch(() => setError(t('recipientsError')));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChange = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const save = async (event) => {
    event.preventDefault();
    const payload = { ...form };
    if (form.id) await api.put(`/api/beneficiaries/${form.id}`, payload);
    else await api.post('/api/beneficiaries', payload);
    setForm(EMPTY);
    load();
  };

  const remove = async (id) => {
    await api.delete(`/api/beneficiaries/${id}`);
    load();
  };

  return (
    <div>
      <h2>{t('recipientsTitle')}</h2>
      <p>{t('recipientsHelp')}</p>
      {error && <p className="text-danger">{error}</p>}
      <Form onSubmit={save} className="panel mb-4">
        <div className="row">
          <div className="col-md-4 mb-2"><Form.Control name="firstName" placeholder={t('firstName')} value={form.firstName} onChange={onChange} required /></div>
          <div className="col-md-4 mb-2"><Form.Control name="lastName" placeholder={t('lastName')} value={form.lastName} onChange={onChange} required /></div>
          <div className="col-md-4 mb-2"><Form.Control name="phone" placeholder={t('phone')} value={form.phone} onChange={onChange} /></div>
          <div className="col-md-4 mb-2">
            <Form.Select name="country" value={form.country} onChange={onChange}>
              <option value="Cameroun">{t('countryCameroon')}</option>
              <option value="Côte d'Ivoire">{t('countryIvoryCoast')}</option>
              <option value="Sénégal">{t('countrySenegal')}</option>
              <option value="Gabon">{t('countryGabon')}</option>
              <option value="Congo">{t('countryCongo')}</option>
            </Form.Select>
          </div>
          <div className="col-md-4 mb-2">
            <Form.Select name="receptionMode" value={form.receptionMode} onChange={onChange}>
              <option value="Orange Money">Orange Money</option>
              <option value="Mobile Money">Mobile Money</option>
              <option value="Dépôt bancaire">{t('bankTransfer')}</option>
            </Form.Select>
          </div>
          <div className="col-md-4 mb-2"><Form.Control name="accountNumber" placeholder={t('accountNumber')} value={form.accountNumber} onChange={onChange} /></div>
        </div>
        <Button type="submit">{form.id ? t('saveBeneficiary') : t('addBeneficiary')}</Button>
      </Form>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>{t('nameRequired')}</th>
            <th>{t('country')}</th>
            <th>{t('method')}</th>
            <th>{t('accountNumber')}</th>
            <th>{t('action')}</th>
          </tr>
        </thead>
        <tbody>
          {recipients.length === 0 ? (
            <tr><td colSpan="5">{t('noRecipients')}</td></tr>
          ) : recipients.map((recipient) => (
            <tr key={recipient.id}>
              <td>{recipient.first_name} {recipient.last_name}</td>
              <td>{recipient.country}</td>
              <td>{recipient.reception_mode}</td>
              <td>{recipient.account_number}</td>
              <td>
                <Button size="sm" variant="link" onClick={() => setForm({
                  id: recipient.id,
                  firstName: recipient.first_name,
                  lastName: recipient.last_name,
                  phone: recipient.phone || '',
                  country: recipient.country,
                  receptionMode: recipient.reception_mode,
                  accountNumber: recipient.account_number || '',
                  city: recipient.city || '',
                  address: recipient.address || '',
                })}>{t('modify')}</Button>
                <Button size="sm" variant="link" className="text-danger" onClick={() => remove(recipient.id)}>{t('reject')}</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

export default Recipients;
