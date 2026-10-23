import 'dotenv/config';
import assert from 'node:assert/strict';
import test from 'node:test';
import request from 'supertest';

process.env.NODE_ENV = 'test';

const { default: app } = await import('../app.js');
const { default: pool } = await import('../config/db.js');
const { ensureSchema } = await import('../config/schema.js');

const stamp = Date.now();
const email = `smoke.${stamp}@nkap.test`;
const password = 'secret12';
const adminEmail = process.env.ADMIN_EMAIL || 'admin@nkap.local';
const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';

test('parcours inscription, transfert, admin et mot de passe', async () => {
  await ensureSchema(pool);

  const register = await request(app).post('/api/users/register').send({
    firstName: 'Awa',
    lastName: 'Nkap',
    email,
    gender: 'female',
    birthDate: '1995-04-12',
    country: 'Canada',
    street: '1 rue Test',
    city: 'Montreal',
    postalCode: 'H2X1Y4',
    phone: '15145550123',
    password,
    confirmPassword: password,
  });
  assert.equal(register.status, 201);
  assert.ok(register.body.token);
  assert.equal(register.body.role, 'user');

  const login = await request(app).post('/api/users/login').send({ email, password });
  assert.equal(login.status, 200);
  const token = login.body.token;

  const profile = await request(app)
    .get('/api/users/profile')
    .set('Authorization', `Bearer ${token}`);
  assert.equal(profile.status, 200);
  assert.equal(profile.body.firstName, 'Awa');
  assert.equal(profile.body.email, email);
  assert.equal(profile.body.password, undefined);

  const transfer = await request(app)
    .post('/api/transactions/transactions')
    .set('Authorization', `Bearer ${token}`)
    .send({
      amount: 20,
      amountReceived: 8800,
      recipientName: 'Paul Biya',
      method: 'Orange Money',
      accountNumber: '691234567',
      recipientTown: 'Douala',
      recipientAddress: 'Akwa',
      reasonOfSending: 'Famille',
      sendingCountry: 'Canada',
      receivingCountry: 'Cameroun',
    });
  assert.equal(transfer.status, 201);

  const history = await request(app)
    .get('/api/transactions/get-transactions')
    .set('Authorization', `Bearer ${token}`);
  assert.equal(history.status, 200);
  assert.equal(history.body.length, 1);
  assert.equal(history.body[0].recipient_name, 'Paul Biya');
  assert.ok(history.body[0].transaction_id);

  const bill = await request(app)
    .post('/api/transactions/facture')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'Universite',
      phone: '699000000',
      email,
      country: 'cameroun',
      amountToSend: 50,
      currency: 'CAD',
      details: 'Frais de scolarite',
    });
  assert.equal(bill.status, 201);

  const contact = await request(app)
    .post('/api/transactions/send-mail')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'Awa Nkap',
      email,
      subject: 'Question',
      message: 'Bonjour',
    });
  assert.equal(contact.status, 200);
  assert.equal(contact.body.success, true);

  const adminLogin = await request(app)
    .post('/api/users/login')
    .send({ email: adminEmail, password: adminPassword });
  assert.equal(adminLogin.status, 200, adminLogin.body.message);
  const adminToken = adminLogin.body.token;

  const users = await request(app)
    .get('/api/users')
    .set('Authorization', `Bearer ${adminToken}`);
  assert.equal(users.status, 200);
  assert.equal(users.body.some((user) => user.password), false);

  const forbidden = await request(app)
    .get('/api/users')
    .set('Authorization', `Bearer ${token}`);
  assert.equal(forbidden.status, 403);

  const block = await request(app)
    .put(`/api/users/block-user/${login.body.id}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({});
  assert.equal(block.status, 200);

  const blockedLogin = await request(app).post('/api/users/login').send({ email, password });
  assert.equal(blockedLogin.status, 403);

  const unblock = await request(app)
    .put(`/api/users/unblock-user/${login.body.id}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({});
  assert.equal(unblock.status, 200);

  const forgot = await request(app).post('/api/users/forgot-password').send({ email });
  assert.equal(forgot.status, 200);
  assert.ok(forgot.body.resetLink);
  const resetToken = forgot.body.resetLink.split('/').pop();

  const reset = await request(app).post('/api/users/reset-password').send({
    token: resetToken,
    password: 'secret99',
  });
  assert.equal(reset.status, 200);

  const relogin = await request(app).post('/api/users/login').send({ email, password: 'secret99' });
  assert.equal(relogin.status, 200);

  await pool.query('DELETE FROM transactions WHERE user_id = ?', [login.body.id]);
  await pool.query('DELETE FROM messages WHERE email = ?', [email]);
  await pool.query('DELETE FROM users WHERE id = ?', [login.body.id]);
});

test('devis, bénéficiaire, référence, KYC, MFA et back-office', async () => {
  const stamp = Date.now();
  const email = `corridor.${stamp}@nkap.test`;
  const phone = `1514${String(stamp).slice(-7)}`;
  const password = 'secret12';

  const register = await request(app).post('/api/users/register').send({
    firstName: 'Jean',
    lastName: 'Mbarga',
    email,
    gender: 'male',
    birthDate: '1990-01-02',
    country: 'Canada',
    street: '2 rue Test',
    city: 'Montreal',
    postalCode: 'H2X1Y4',
    phone,
    password,
    confirmPassword: password,
  });
  assert.equal(register.status, 201);
  const token = register.body.token;

  const byPhone = await request(app).post('/api/users/login').send({ phone, password });
  assert.equal(byPhone.status, 200);
  assert.ok(byPhone.body.token);

  const quote = await request(app)
    .get('/api/transfers/quote')
    .query({ destination: 'Cameroun', amount: 100 })
    .set('Authorization', `Bearer ${token}`);
  assert.equal(quote.status, 200);
  assert.equal(quote.body.currencyReceived, 'XAF');
  assert.ok(quote.body.amountToReceive > 0);
  assert.equal(quote.body.fee, 1);

  const beneficiary = await request(app)
    .post('/api/beneficiaries')
    .set('Authorization', `Bearer ${token}`)
    .send({
      firstName: 'Amina',
      lastName: 'Ngo',
      phone: '691000111',
      country: 'Cameroun',
      receptionMode: 'Orange Money',
      accountNumber: '691000111',
      city: 'Douala',
    });
  assert.equal(beneficiary.status, 201);

  const transfer = await request(app)
    .post('/api/transfers')
    .set('Authorization', `Bearer ${token}`)
    .send({
      amount: 100,
      beneficiaryFirstName: 'Amina',
      beneficiaryLastName: 'Ngo',
      method: 'Orange Money',
      accountNumber: '691000111',
      receivingCountry: 'Cameroun',
      sendingCountry: 'Canada',
      beneficiaryId: beneficiary.body.id,
      idempotencyKey: `idem-${stamp}`,
    });
  assert.equal(transfer.status, 201);
  assert.match(transfer.body.reference, /^BEX-CM-\d{4}-\d{6}$/);

  const duplicate = await request(app)
    .post('/api/transfers')
    .set('Authorization', `Bearer ${token}`)
    .set('Idempotency-Key', `idem-${stamp}`)
    .send({
      amount: 100,
      recipientName: 'Amina Ngo',
      method: 'Orange Money',
      accountNumber: '691000111',
      receivingCountry: 'Cameroun',
    });
  assert.equal(duplicate.status, 201);
  assert.equal(duplicate.body.reference, transfer.body.reference);

  const track = await request(app)
    .get(`/api/transfers/${transfer.body.reference}/timeline`)
    .set('Authorization', `Bearer ${token}`);
  assert.equal(track.status, 200);
  assert.ok(track.body.events.some((event) => event.state === 'created'));

  const paid = await request(app)
    .post(`/api/transfers/${transfer.body.id}/simulate-payment`)
    .set('Authorization', `Bearer ${token}`)
    .send({ amount: 100 });
  assert.equal(paid.status, 200);
  assert.equal(paid.body.payoutStatus, 'sent');

  const receipt = await request(app)
    .get(`/api/transfers/${transfer.body.reference}/receipt`)
    .set('Authorization', `Bearer ${token}`);
  assert.equal(receipt.status, 200);
  assert.match(receipt.headers['content-type'], /pdf/);

  const kyc = await request(app)
    .post('/api/kyc')
    .set('Authorization', `Bearer ${token}`)
    .send({
      docType: 'identity',
      fileName: 'id.txt',
      mimeType: 'text/plain',
      contentBase64: Buffer.from('piece-identite').toString('base64'),
    });
  assert.equal(kyc.status, 201);

  const setup = await request(app)
    .post('/api/users/mfa/setup')
    .set('Authorization', `Bearer ${token}`);
  assert.equal(setup.status, 200);
  const confirm = await request(app)
    .post('/api/users/mfa/confirm')
    .set('Authorization', `Bearer ${token}`)
    .send({ code: setup.body.devCode });
  assert.equal(confirm.status, 200);

  const mfaLogin = await request(app).post('/api/users/login').send({ email, password });
  assert.equal(mfaLogin.body.mfaRequired, true);
  const verified = await request(app).post('/api/users/mfa/verify').send({
    mfaToken: mfaLogin.body.mfaToken,
    code: mfaLogin.body.devCode,
  });
  assert.equal(verified.status, 200);
  assert.ok(verified.body.token);

  const adminLogin = await request(app)
    .post('/api/users/login')
    .send({ email: adminEmail, password: adminPassword });
  const office = await request(app)
    .get('/api/office/transactions')
    .query({ q: transfer.body.reference })
    .set('Authorization', `Bearer ${adminLogin.body.token}`);
  assert.equal(office.status, 200);
  assert.equal(office.body[0].reference, transfer.body.reference);

  const blocked = await request(app)
    .post('/api/transfers')
    .set('Authorization', `Bearer ${token}`)
    .send({
      amount: 50,
      recipientName: 'Sanctioned Person',
      method: 'Orange Money',
      accountNumber: '600000000',
      receivingCountry: 'Cameroun',
    });
  assert.equal(blocked.status, 201);
  assert.equal(blocked.body.complianceStatus, 'blocked');

  await pool.query('DELETE FROM kyc_events WHERE user_id = ?', [register.body.id]);
  await pool.query('DELETE FROM kyc_documents WHERE user_id = ?', [register.body.id]);
  await pool.query('DELETE FROM notifications WHERE user_id = ?', [register.body.id]);
  await pool.query('DELETE FROM beneficiaries WHERE user_id = ?', [register.body.id]);
  await pool.query('DELETE FROM compliance_checks WHERE transaction_id IN (SELECT id FROM transactions WHERE user_id = ?)', [register.body.id]);
  await pool.query('DELETE FROM transfer_events WHERE transaction_id IN (SELECT id FROM transactions WHERE user_id = ?)', [register.body.id]);
  await pool.query('DELETE FROM transactions WHERE user_id = ?', [register.body.id]);
  await pool.query('DELETE FROM users WHERE id = ?', [register.body.id]);
});

test.after(async () => {
  await pool.end();
});
