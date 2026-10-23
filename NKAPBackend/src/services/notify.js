import db from '../config/db.js';
import { sendMailMessage } from '../utils/mailer.js';

const COPY = {
  account_created: ['Compte créé', 'Votre compte NKAP est créé. Complétez votre identification avant les transferts importants.'],
  kyc_approved: ['Identité approuvée', 'Votre dossier KYC est approuvé.'],
  kyc_more_info: ['Information KYC requise', 'Nous avons besoin de documents supplémentaires pour valider votre identité.'],
  kyc_rejected: ['Identité refusée', 'Votre dossier KYC a été refusé.'],
  transfer_created: ['Transfert créé', 'Votre transfert a été créé. Le paiement est attendu.'],
  payment_received: ['Paiement reçu', 'Nous avons reçu votre paiement. Il est en cours de vérification.'],
  transfer_processing: ['Transfert en traitement', 'Votre transfert est en cours de traitement.'],
  transfer_sent: ['Instruction envoyée', 'L\'instruction de paiement a été envoyée au partenaire.'],
  beneficiary_paid: ['Bénéficiaire payé', 'Le bénéficiaire a été payé.'],
  transfer_failed: ['Transfert échoué', 'Le transfert n\'a pas abouti.'],
  refund: ['Remboursement', 'Un remboursement a été enregistré.'],
  info_request: ['Demande d\'information', 'L\'équipe a besoin d\'une information complémentaire.'],
  mfa_code: ['Code de vérification', ''],
};

export async function notifyUser(user, eventKey, extra = '') {
  const [subject, body] = COPY[eventKey] || [eventKey, ''];
  const text = `${body}${extra ? `\n${extra}` : ''}`.trim();
  const channels = [
    ['email', user?.email ? 'pending' : 'skipped'],
    ['sms', 'queued'],
    ['whatsapp', 'queued'],
  ];

  for (const [channel, status] of channels) {
    let finalStatus = status;
    if (channel === 'email' && user?.email) {
      const sent = await sendMailMessage({ to: user.email, subject, text }).catch(() => false);
      finalStatus = sent ? 'sent' : 'skipped_unconfigured';
    }
    if (channel === 'sms') {
      finalStatus = process.env.TWILIO_SID ? 'queued' : 'skipped_unconfigured';
    }
    if (channel === 'whatsapp') {
      finalStatus = process.env.WHATSAPP_TOKEN ? 'queued' : 'skipped_unconfigured';
    }
    await db.query('INSERT INTO notifications SET ?', {
      user_id: user?.id || null,
      channel,
      event_key: eventKey,
      subject,
      body: text,
      status: finalStatus,
    });
  }
}
