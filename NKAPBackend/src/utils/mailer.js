import nodemailer from 'nodemailer';

let transporter;

function getTransporter() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  return transporter;
}

export async function sendMailMessage({ to, subject, text, from }) {
  const mailer = getTransporter();
  if (!mailer) {
    console.warn('Email non configuré. Message non envoyé à', to);
    return false;
  }
  await mailer.sendMail({
    from: from || process.env.EMAIL_USER,
    to,
    subject,
    text,
  });
  return true;
}
