import express from 'express';
import authenticateJWT from '../middleware/auth.js';
import checkUserStatus from '../middleware/checkUserStatus.js';
import { permit, staffOnly } from '../middleware/authorize.js';
import * as transferController from '../controllers/transferController.js';
import * as beneficiaryController from '../controllers/beneficiaryController.js';
import * as kycController from '../controllers/kycController.js';
import * as officeController from '../controllers/officeController.js';

const transfers = express.Router();
transfers.use(authenticateJWT, checkUserStatus);
transfers.get('/quote', transferController.quote);
transfers.post('/', transferController.create);
transfers.post('/:id/pay', transferController.pay);
transfers.post('/:id/simulate-payment', transferController.simulatePayment);
transfers.get('/:id/timeline', transferController.getTimeline);
transfers.get('/:id/receipt', transferController.receipt);

const beneficiaries = express.Router();
beneficiaries.use(authenticateJWT, checkUserStatus);
beneficiaries.get('/', beneficiaryController.listBeneficiaries);
beneficiaries.post('/', beneficiaryController.saveBeneficiary);
beneficiaries.put('/:id', beneficiaryController.saveBeneficiary);
beneficiaries.delete('/:id', beneficiaryController.deleteBeneficiary);

const kyc = express.Router();
kyc.use(authenticateJWT, checkUserStatus);
kyc.get('/', kycController.myKyc);
kyc.post('/', kycController.uploadKyc);
kyc.get('/:id/file', kycController.downloadKyc);

const office = express.Router();
office.use(authenticateJWT, staffOnly);
office.get('/transactions', officeController.searchTransactions);
office.get('/clients', officeController.searchClients);
office.get('/beneficiaries', officeController.searchBeneficiaries);
office.get('/transactions/:id', officeController.transactionDetail);
office.post('/transactions/:id/review', permit('compliance', 'finance', 'admin', 'superAdmin'), officeController.reviewTransfer);
office.post('/transactions/:id/paid', permit('finance', 'admin', 'superAdmin'), officeController.markPaid);
office.post('/transactions/:id/info', permit('support', 'compliance', 'admin', 'superAdmin'), officeController.requestInfo);
office.get('/kyc', permit('compliance', 'admin', 'superAdmin'), officeController.kycQueue);
office.post('/kyc/:id/review', permit('compliance', 'admin', 'superAdmin'), kycController.reviewKyc);
office.get('/reconciliation', permit('finance', 'admin', 'superAdmin'), officeController.reconciliation);
office.get('/reconciliation/export', permit('finance', 'admin', 'superAdmin'), officeController.exportReconciliation);
office.get('/audit', permit('compliance', 'admin', 'superAdmin'), officeController.listAudit);
office.get('/partners', permit('admin', 'superAdmin'), officeController.listPartners);
office.post('/partners', permit('superAdmin'), officeController.savePartner);
office.get('/corridors', permit('finance', 'admin', 'superAdmin'), officeController.listCorridors);
office.post('/corridors', permit('finance', 'superAdmin'), officeController.saveCorridor);

export { transfers, beneficiaries, kyc, office };
