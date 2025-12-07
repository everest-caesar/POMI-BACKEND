import dotenv from 'dotenv';
import sgMail from '@sendgrid/mail';

dotenv.config();

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.ADMIN_EMAIL || 'marakihay@gmail.com';

if (!SENDGRID_API_KEY) {
  console.error('❌ SENDGRID_API_KEY not found in .env file');
  process.exit(1);
}

sgMail.setApiKey(SENDGRID_API_KEY);

const msg = {
  to: 'odeeverest7@gmail.com',
  from: {
    email: FROM_EMAIL,
    name: 'Pomi Community Test',
  },
  subject: 'SendGrid Test Email from Pomi Community',
  html: `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(to right, #ef4444, #f43f5e, #f97316); padding: 20px; border-radius: 8px; color: white; text-align: center;">
        <h1 style="margin: 0; font-size: 28px;">SendGrid Test Email 📧</h1>
      </div>

      <div style="padding: 20px; background: #f9fafb; border-radius: 8px; margin-top: 10px;">
        <p>Hello from Pomi Community!</p>

        <p>This is a test email to verify that SendGrid email delivery is working correctly.</p>

        <div style="background: white; padding: 15px; border-left: 4px solid #f97316; border-radius: 4px; margin: 20px 0;">
          <p><strong>Test Details:</strong></p>
          <ul>
            <li>Date: ${new Date().toLocaleString()}</li>
            <li>From: ${FROM_EMAIL}</li>
            <li>To: odeeverest7@gmail.com</li>
          </ul>
        </div>

        <p style="margin-top: 20px; font-size: 14px; color: #666;">
          If you're seeing this email, it means SendGrid is configured correctly and emails are being delivered successfully! ✅
        </p>
      </div>

      <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
        <p>© 2025 Pomi Community Hub</p>
      </div>
    </div>
  `,
};

console.log('📧 Sending test email to odeeverest7@gmail.com...');

sgMail
  .send(msg)
  .then(() => {
    console.log('✅ Test email sent successfully!');
    console.log(`✉️  Check odeeverest7@gmail.com for the test email`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error sending email:', error);
    if (error.response) {
      console.error('SendGrid Error Details:', error.response.body);
    }
    process.exit(1);
  });
