const nodemailer = require('nodemailer');

let transporter;


async function getTransporter() {
  if (transporter) return transporter;

  const account = await nodemailer.createTestAccount();
  transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: { user: account.user, pass: account.pass }
  });
  return transporter;
}


async function sendStatusMail(to, name, title, status) {
  try {
    const mail = await getTransporter();
    const info = await mail.sendMail({
      from: '"Nettech Helpdesk" <helpdesk@nettech.com>',
      to: to,
      subject: 'Ticket update: ' + title,
      html: `<h3>Hello ${name},</h3>
             <p>Your ticket <b>${title}</b> is now marked as <b>${status}</b>.</p>
             <p>Thank you,<br>Nettech Helpdesk</p>`
    });

    
    console.log('Email sent. Preview here:', nodemailer.getTestMessageUrl(info));
  } catch (err) {
    console.log('Mail error:', err.message);
  }
}
async function sendResetMail(to, name, link) {
  try {
    const mail = await getTransporter();
    const info = await mail.sendMail({
      from: '"Nettech Helpdesk" <helpdesk@nettech.com>',
      to: to,
      subject: 'Reset your password',
      html: `<h3>Hello ${name},</h3>
             <p>Click the button below to reset your password. This link works for 15 minutes.</p>
             <p><a href="${link}" style="background:#2563eb;color:white;padding:10px 18px;border-radius:6px;text-decoration:none">Reset Password</a></p>`
    });
    console.log('Reset email sent. Preview here:', nodemailer.getTestMessageUrl(info));
  } catch (err) {
    console.log('Mail error:', err.message);
  }
}

module.exports = { sendStatusMail, sendResetMail };