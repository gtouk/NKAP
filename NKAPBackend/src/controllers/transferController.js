import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import {
  buildQuote,
  completePayout,
  openTransfer,
  receivePayment,
  startPayment,
  timeline,
} from '../services/transferService.js';
import { sendError } from '../utils/httpError.js';

export const quote = async (req, res, next) => {
  try {
    const result = await buildQuote({
      origin: req.query.origin || req.body.origin || 'Canada',
      destination: req.query.destination || req.body.destination,
      amount: req.query.amount || req.body.amount,
      promoCode: req.query.promoCode || req.body.promoCode,
    });
    res.json(result);
  } catch (error) {
    sendError(res, error, next);
  }
};

export const create = async (req, res, next) => {
  try {
    const transfer = await openTransfer({
      user: req.user,
      body: req.body,
      idempotencyKey: req.get('Idempotency-Key') || req.body.idempotencyKey,
    });
    res.status(201).json({ message: 'Transaction enregistrée', ...transfer });
  } catch (error) {
    sendError(res, error, next);
  }
};

export const pay = async (req, res, next) => {
  try {
    const instruction = await startPayment({
      user: req.user,
      transferId: req.params.id,
      method: req.body.method,
    });
    res.json(instruction);
  } catch (error) {
    sendError(res, error, next);
  }
};

export const simulatePayment = async (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ message: 'Route introuvable' });
  }
  try {
    const transfer = await receivePayment({
      actor: req.user,
      transferId: req.params.id,
      amount: req.body.amount,
      simulate: true,
    });
    res.json(transfer);
  } catch (error) {
    sendError(res, error, next);
  }
};

export const getTimeline = async (req, res, next) => {
  try {
    res.json(await timeline(req.params.id, req.user));
  } catch (error) {
    sendError(res, error, next);
  }
};

export const receipt = async (req, res, next) => {
  try {
    const { transfer } = await timeline(req.params.id, req.user);
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595, 842]);
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const lines = [
      'NKAP Transfert — Reçu',
      `Référence : ${transfer.reference || transfer.id}`,
      `Montant envoyé : ${transfer.amount} ${transfer.currencySent || 'CAD'}`,
      `Frais : ${transfer.fee ?? '—'} CAD`,
      `Taux : ${transfer.fxRate ?? '—'}`,
      `Montant à recevoir : ${transfer.amountToReceive ?? '—'} ${transfer.currencyReceived || ''}`,
      `Bénéficiaire : ${transfer.recipient_name}`,
      `État : ${transfer.transactionState}`,
      `Paiement : ${transfer.paymentStatus}`,
    ];
    lines.forEach((line, index) => {
      page.drawText(line, { x: 50, y: 780 - index * 28, size: 14, font, color: rgb(0.1, 0.2, 0.2) });
    });
    const bytes = await pdf.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${transfer.reference || 'recu'}.pdf"`);
    res.send(Buffer.from(bytes));
  } catch (error) {
    sendError(res, error, next);
  }
};

export { completePayout };
