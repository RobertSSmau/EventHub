import nodemailer from 'nodemailer';

let transporter = null;

// Inizializza email transporter
export async function initEmail() {
  try {
    // Crea account Ethereal test (email fake per sviluppo)
    const testAccount = await nodemailer.createTestAccount();
    
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    
    console.log('📧 Email configurata (Ethereal test account)');
    console.log(`   User: ${testAccount.user}`);
    console.log('   Preview URL: https://ethereal.email');
    
    return transporter;
  } catch (error) {
    console.error('❌ Errore configurazione email:', error.message);
    return null;
  }
}

// Invia email di verifica account
export async function sendVerificationEmail(email, token) {
  if (!transporter) {
    console.warn('⚠️ Email transporter non inizializzato');
    return null;
  }
  
  const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/verify-email/${token}`;
  
  const info = await transporter.sendMail({
    from: '"EventHub" <noreply@eventhub.com>',
    to: email,
    subject: 'Conferma il tuo account EventHub',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Benvenuto su EventHub! 🎉</h2>
        <p>Grazie per esserti registrato. Clicca sul link per confermare il tuo account:</p>
        <a href="${verifyUrl}" 
           style="display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
          Conferma Account
        </a>
        <p>Oppure copia questo link nel browser:</p>
        <p style="color: #666; font-size: 14px;">${verifyUrl}</p>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          Il link scade tra 24 ore. Se non hai richiesto questa registrazione, ignora questa email.
        </p>
      </div>
    `
  });
  
  console.log('📧 Email verifica inviata a:', email);
  console.log('   Preview URL:', nodemailer.getTestMessageUrl(info));
  
  return info;
}

// Invia email reset password
export async function sendPasswordResetEmail(email, token) {
  if (!transporter) {
    console.warn('⚠️ Email transporter non inizializzato');
    return null;
  }
  
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password/${token}`;
  
  const info = await transporter.sendMail({
    from: '"EventHub" <noreply@eventhub.com>',
    to: email,
    subject: 'Reset Password - EventHub',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Reset Password 🔒</h2>
        <p>Hai richiesto il reset della password. Clicca sul link per impostare una nuova password:</p>
        <a href="${resetUrl}" 
           style="display: inline-block; padding: 12px 24px; background: #dc3545; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
          Reset Password
        </a>
        <p>Oppure copia questo link nel browser:</p>
        <p style="color: #666; font-size: 14px;">${resetUrl}</p>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          Il link scade tra 1 ora. Se non hai richiesto il reset, ignora questa email e la tua password rimarrà invariata.
        </p>
      </div>
    `
  });
  
  console.log('📧 Email reset password inviata a:', email);
  console.log('   Preview URL:', nodemailer.getTestMessageUrl(info));
  
  return info;
}

export default transporter;
