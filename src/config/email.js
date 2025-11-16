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
    console.error('SendGrid configuration error:', error.message);
    console.warn('Email service failed. Emails will not be sent.');
    return null;
  }
}

// Verify Account Email
export async function sendVerificationEmail(email, token) {
  if (!emailService) {
    console.warn('Email service non inizializzato');
    return false;
  }
  
  const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/verify-email/${token}`;
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Welcome to EventHub!</h2>
      <p>Thank you for registering. Click the link to confirm your account:</p>
      <a href="${verifyUrl}" 
         style="display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
        Confirm Account
      </a>
      <p>Or copy this link into your browser:</p>
      <p style="color: #666; font-size: 14px;">${verifyUrl}</p>
      <p style="color: #999; font-size: 12px; margin-top: 30px;">
        The link expires in 24 hours. If you did not request this registration, please ignore this email.
      </p>
    </div>
  `;
  
  try {
    await sgMail.send({
      to: email,
      from: process.env.EMAIL_USER || 'noreply@eventhub.com',
      subject: 'Confirm your EventHub account',
      html: htmlContent
    });
    
    console.log('Email verifica inviata a:', email);
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error.message);
    return false;
  }
}

// reset password
export async function sendPasswordResetEmail(email, token) {
  if (!emailService) {
    console.warn('Email service not initialized');
    return null;
  }
  
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password/${token}`;
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Reset Password</h2>
      <p>You have requested a password reset. Click the link to set a new password:</p>
      <a href="${resetUrl}" 
         style="display: inline-block; padding: 12px 24px; background: #dc3545; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
        Reset Password
      </a>
      <p>Or copy this link into your browser:</p>
      <p style="color: #666; font-size: 14px;">${resetUrl}</p>
      <p style="color: #999; font-size: 12px; margin-top: 30px;">
        The link expires in 1 hour. If you did not request the reset, ignore this email and your password will remain unchanged.
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
    
    console.log('Email reset sent to:', email);
    return { success: true };
  } catch (error) {
    console.error('Error sending reset email:', error.message);
    return null;
  }
}

export default emailService;
