import sgMail from '@sendgrid/mail';

let emailService = null;

// Inizializza SendGrid
export async function initEmail() {
  try {
    const sendgridKey = process.env.SENDGRID_API_KEY;
    
    if (!sendgridKey) {
      console.warn('SENDGRID_API_KEY non configurato');
      console.warn('Le email non verranno inviate');
      return null;
    }
    
    sgMail.setApiKey(sendgridKey);
    emailService = { type: 'sendgrid', sgMail };
    console.log('SendGrid configurato correttamente');
    return emailService;
  } catch (error) {
    console.error('Errore configurazione SendGrid:', error.message);
    console.warn('Email service fallito. Email non verranno inviate.');
    return null;
  }
}

// Invia email di verifica account
export async function sendVerificationEmail(email, token) {
  if (!emailService) {
    console.warn('Email service non inizializzato');
    return null;
  }
  
  const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/verify-email/${token}`;
  
  const htmlContent = `
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
  `;
  
  try {
    await sgMail.send({
      to: email,
      from: process.env.EMAIL_USER || 'noreply@eventhub.com',
      subject: 'Conferma il tuo account EventHub',
      html: htmlContent
    });
    
    console.log('Email verifica inviata a:', email);
    return { success: true };
  } catch (error) {
    console.error('Errore invio email verifica:', error.message);
    return null;
  }
}

// Invia email reset password
export async function sendPasswordResetEmail(email, token) {
  if (!emailService) {
    console.warn('Email service non inizializzato');
    return null;
  }
  
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password/${token}`;
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Reset Password</h2>
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
  `;
  
  try {
    await sgMail.send({
      to: email,
      from: process.env.EMAIL_USER || 'noreply@eventhub.com',
      subject: 'Reset Password - EventHub',
      html: htmlContent
    });
    
    console.log('Email reset inviata a:', email);
    return { success: true };
  } catch (error) {
    console.error('Errore invio email reset:', error.message);
    return null;
  }
}

export default emailService;
