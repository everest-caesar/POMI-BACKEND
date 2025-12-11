import sgMail from '@sendgrid/mail';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'marakihay@gmail.com';
const FROM_EMAIL = process.env.FROM_EMAIL || 'marakihay@gmail.com';
const APP_BASE_URL =
  process.env.APP_BASE_URL ||
  process.env.FRONTEND_APP_URL ||
  'https://pomi-community.netlify.app';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
} else {
  console.warn('⚠️  SENDGRID_API_KEY not configured. Emails will not be sent.');
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

interface MessageNotificationOptions {
  recipientEmail: string;
  recipientName: string;
  senderName: string;
  messageSnippet: string;
  conversationUrl?: string;
  listingTitle?: string | null;
  listingPrice?: number | null;
  listingLocation?: string | null;
}

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatMessagePreview = (value: string): string => {
  if (!value) return '';
  const trimmed = value.trim().slice(0, 500);
  return escapeHtml(trimmed);
};

const formatCad = (value?: number | null): string | null => {
  if (typeof value !== 'number') {
    return null;
  }
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Send email using SendGrid API
 */
const sendEmail = async (options: SendEmailOptions): Promise<boolean> => {
  if (!SENDGRID_API_KEY) {
    console.warn('⚠️  SENDGRID_API_KEY not configured. Email not sent.');
    return false;
  }

  try {
    await sgMail.send({
      to: options.to,
      from: {
        email: options.from || FROM_EMAIL,
        name: 'Pomi Community',
      },
      subject: options.subject,
      html: options.html,
    });

    console.log(`✅ Email sent to ${options.to}`);
    return true;
  } catch (error: any) {
    const sendGridErrors = error?.response?.body || error?.response?.data;
    console.error('❌ Failed to send email:', sendGridErrors || error.message || error);
    return false;
  }
};

/**
 * Notify recipients about a new direct message so they don't miss updates
 */
const sendMessageNotification = async (
  options: MessageNotificationOptions
): Promise<boolean> => {
  if (!options.recipientEmail) {
    return false;
  }

  const preview = formatMessagePreview(options.messageSnippet);
  const cadPrice = formatCad(options.listingPrice);
  const conversationUrl =
    options.conversationUrl ||
    `${APP_BASE_URL.replace(/\/$/, '')}/messages`;

  const listingDetails =
    options.listingTitle || cadPrice || options.listingLocation
      ? `
        <div style="margin-top: 18px; padding: 16px; background: #fff7ed; border-radius: 12px; border-left: 4px solid #fb923c;">
          <p style="margin: 0 0 6px; font-size: 13px; color: #9a3412; text-transform: uppercase; letter-spacing: 0.08em;">Marketplace context</p>
          ${
            options.listingTitle
              ? `<p style="margin: 4px 0;"><strong>Listing:</strong> ${escapeHtml(
                  options.listingTitle
                )}</p>`
              : ''
          }
          ${
            cadPrice
              ? `<p style="margin: 4px 0;"><strong>Price:</strong> ${cadPrice}</p>`
              : ''
          }
          ${
            options.listingLocation
              ? `<p style="margin: 4px 0;"><strong>Location:</strong> ${escapeHtml(
                  options.listingLocation
                )}</p>`
              : ''
          }
        </div>
      `
      : '';

  const html = `
    <div style="font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #0f172a; background: #f8fafc; padding: 24px;">
      <div style="max-width: 640px; margin: 0 auto; background: white; border-radius: 18px; border: 1px solid #e2e8f0; box-shadow: 0 24px 60px rgba(15, 23, 42, 0.15); overflow: hidden;">
        <div style="padding: 24px; background: linear-gradient(120deg, #f97316, #ef4444, #db2777); color: white;">
          <p style="margin: 0; font-size: 12px; letter-spacing: 0.45em; text-transform: uppercase; opacity: 0.85;">Pomi Direct Messages</p>
          <h1 style="margin: 8px 0 0; font-size: 26px; font-weight: 800;">New message from ${escapeHtml(
            options.senderName
          )}</h1>
        </div>

        <div style="padding: 28px;">
          <p style="margin: 0 0 12px;">Selam ${escapeHtml(
            options.recipientName
          )},</p>
          <p style="margin: 0 0 18px; color: #475569;">
            You have a new direct message waiting inside Pomi. We email you so sellers, buyers, and neighbours never miss an update.
          </p>

          <div style="margin: 16px 0; padding: 18px 20px; background: #0f172a; color: white; border-radius: 16px;">
            <p style="margin: 0; font-size: 13px; letter-spacing: 0.3em; text-transform: uppercase; color: rgba(255,255,255,0.65);">Message preview</p>
            <p style="margin: 8px 0 0; font-size: 15px; line-height: 1.6; white-space: pre-line;">${
              preview || 'New message received.'
            }</p>
          </div>

          ${listingDetails}

          <p style="margin: 24px 0;">
            <a href="${conversationUrl}" style="display: inline-flex; align-items: center; gap: 8px; background: #f97316; color: white; text-decoration: none; padding: 14px 28px; border-radius: 999px; font-weight: 700;">
              Reply in Pomi
              <span style="font-size: 18px;">→</span>
            </a>
          </p>

          <p style="margin: 0; font-size: 13px; color: #64748b;">
            Tip: Reply promptly to keep community exchanges safe and respectful. This email is a notification only—please respond inside Pomi to keep your messages secure.
          </p>
        </div>
      </div>

      <p style="text-align: center; font-size: 12px; color: #94a3b8; margin-top: 18px;">
        © ${new Date().getFullYear()} Pomi Community Hub • Built for Ethiopian & Eritrean neighbours in Ottawa
      </p>
    </div>
  `;

  return sendEmail({
    to: options.recipientEmail,
    subject: `You have a new message from ${options.senderName}`,
    html,
  });
};

/**
 * Welcome email template for new users
 */
const sendWelcomeEmail = async (
  email: string,
  username: string
): Promise<boolean> => {
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(to right, #ef4444, #f43f5e, #f97316); padding: 20px; border-radius: 8px; color: white; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">Welcome to Pomi! 🎉</h1>
        </div>

        <div style="padding: 20px; background: #f9fafb; border-radius: 8px;">
          <p>Selam ${username},</p>

          <p>Welcome to the digital home for the Ethiopian & Eritrean community in Ottawa. Pomi was built so that our culture, creators, entrepreneurs, and newcomers all have a trusted space to connect.</p>

          <div style="margin: 24px 0; padding: 15px 18px; background: white; border-radius: 10px; border-left: 4px solid #ef4444;">
            <h3 style="margin-top: 0; color: #ef4444;">Here’s what you can do right away:</h3>
            <ul style="padding-left: 18px; margin: 12px 0;">
              <li><strong>RSVP & Host Events:</strong> Highlight cultural holidays, networking nights, or faith gatherings on the Events board.</li>
              <li><strong>Marketplace & Listings:</strong> Buy, sell, or swap essentials with verified neighbours—housing, services, textbooks, and more.</li>
              <li><strong>Business Directory:</strong> Showcase Habesha-owned businesses so the community can find and support you.</li>
              <li><strong>Direct Messaging:</strong> Chat safely with sellers, buyers, mentors, and admins right inside Pomi.</li>
              <li><strong>Forums & Knowledge Threads:</strong> Share recommendations, ask questions, and keep our collective wisdom searchable.</li>
            </ul>
          </div>

          <div style="margin: 24px 0; padding: 15px 18px; background: #fff7ed; border-radius: 10px; border-left: 4px solid #f97316;">
            <h3 style="margin-top: 0; color: #f97316;">Your first week on Pomi</h3>
            <ol style="padding-left: 18px; margin: 12px 0;">
              <li>Complete your profile so neighbours recognize you.</li>
              <li>Save an event or follow a business that inspires you.</li>
              <li>Introduce yourself in the forums or message the admin team if you need help.</li>
            </ol>
            <p style="margin: 0; font-size: 13px; color: #7c2d12;">Every interaction helps us keep the community safe, welcoming, and accountable.</p>
          </div>

          <p style="margin: 28px 0;">
            <a href="https://pomi-community.netlify.app" style="display: inline-block; background: #ef4444; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
              Explore the Pomi Hub
            </a>
          </p>

          <p style="margin: 0; font-size: 14px; color: #666;">
            Need anything? Reply to this email or message the admin team directly inside the app—we’re here to cheer you on.
          </p>
        </div>

        <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
          <p>© 2025 Pomi Community Hub. Built by us, for us.</p>
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'Welcome to Pomi Community! 🎉',
    html,
  });
};

/**
 * Admin notification email for new event creation
 */
const sendEventCreationNotification = async (
  eventTitle: string,
  eventDate: string,
  organizerName: string,
  organizerEmail: string
): Promise<boolean> => {
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(to right, #f97316, #fb923c, #fbbf24); padding: 20px; border-radius: 8px; color: white; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">New Event Submitted 📅</h1>
        </div>

        <div style="padding: 20px; background: #f9fafb; border-radius: 8px;">
          <p>Hi Admin,</p>

          <p>A new event has been submitted for review:</p>

          <div style="background: white; padding: 15px; border-left: 4px solid #f97316; border-radius: 4px;">
            <p><strong>Event Title:</strong> ${eventTitle}</p>
            <p><strong>Date:</strong> ${eventDate}</p>
            <p><strong>Organizer:</strong> ${organizerName} (${organizerEmail})</p>
          </div>

          <p style="margin-top: 20px;">
            <a href="https://pomi-community.netlify.app/admin" style="display: inline-block; background: #f97316; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
              Review in Admin Portal
            </a>
          </p>

          <p style="margin-top: 20px; font-size: 14px; color: #666;">
            Please review and approve or reject this event submission.
          </p>
        </div>

        <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
          <p>© 2025 Pomi Community Hub</p>
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to: ADMIN_EMAIL,
    subject: `[Admin] New Event Submitted: ${eventTitle}`,
    html,
  });
};

/**
 * Admin notification email for new business submission
 */
const sendBusinessSubmissionNotification = async (
  businessName: string,
  category: string,
  ownerName: string,
  ownerEmail: string
): Promise<boolean> => {
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(to right, #fbbf24, #fcd34d, #fef08a); padding: 20px; border-radius: 8px; color: #333; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">New Business Listing 🏢</h1>
        </div>

        <div style="padding: 20px; background: #f9fafb; border-radius: 8px;">
          <p>Hi Admin,</p>

          <p>A new business has been submitted for the directory:</p>

          <div style="background: white; padding: 15px; border-left: 4px solid #fbbf24; border-radius: 4px;">
            <p><strong>Business Name:</strong> ${businessName}</p>
            <p><strong>Category:</strong> ${category}</p>
            <p><strong>Owner:</strong> ${ownerName} (${ownerEmail})</p>
          </div>

          <p style="margin-top: 20px;">
            <a href="https://pomi-community.netlify.app/admin" style="display: inline-block; background: #fbbf24; color: #333; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
              Review in Admin Portal
            </a>
          </p>

          <p style="margin-top: 20px; font-size: 14px; color: #666;">
            Please verify the business details and activate it in the directory.
          </p>
        </div>

        <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
          <p>© 2025 Pomi Community Hub</p>
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to: ADMIN_EMAIL,
    subject: `[Admin] New Business Listed: ${businessName}`,
    html,
  });
};

/**
 * Admin notification email for new marketplace listing
 */
const sendListingSubmissionNotification = async (
  listingTitle: string,
  listingPrice: number,
  sellerName: string,
  sellerEmail: string
): Promise<boolean> => {
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(to right, #ec4899, #f43f5e, #f97316); padding: 20px; border-radius: 8px; color: white; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">New Marketplace Listing 🛒</h1>
        </div>

        <div style="padding: 20px; background: #f9fafb; border-radius: 8px;">
          <p>Hi Admin,</p>

          <p>A new marketplace listing has been submitted for review:</p>

          <div style="background: white; padding: 15px; border-left: 4px solid #ec4899; border-radius: 4px;">
            <p><strong>Item:</strong> ${listingTitle}</p>
            <p><strong>Price:</strong> $${listingPrice.toFixed(2)}</p>
            <p><strong>Seller:</strong> ${sellerName} (${sellerEmail})</p>
          </div>

          <p style="margin-top: 20px;">
            <a href="https://pomi-community.netlify.app/admin" style="display: inline-block; background: #ec4899; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
              Review in Admin Portal
            </a>
          </p>

          <p style="margin-top: 20px; font-size: 14px; color: #666;">
            Please approve or reject this marketplace submission to help keep the community safe.
          </p>
        </div>

        <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
          <p>© 2025 Pomi Community Hub</p>
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to: ADMIN_EMAIL,
    subject: `[Admin] New Marketplace Listing: ${listingTitle}`,
    html,
  });
};

const sendVerificationCodeEmail = async (
  email: string,
  code: string,
  type: 'signup' | 'login' | 'password_reset' = 'signup'
): Promise<boolean> => {
  const subjectMap: Record<string, { subject: string; intro: string }> = {
    signup: { subject: 'Verify your Pomi account', intro: 'Thanks for creating a Pomi account!' },
    login: { subject: 'Your Pomi sign-in code', intro: 'Use this code to finish signing in.' },
    password_reset: { subject: 'Reset your Pomi password', intro: 'Use this code to reset your password.' },
  }
  const copy = subjectMap[type] || subjectMap.signup

  const html = `
    <div style="font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #0f172a; background: #f8fafc; padding: 24px;">
      <div style="max-width: 520px; margin: 0 auto; background: white; border-radius: 18px; border: 1px solid #e2e8f0; box-shadow: 0 24px 60px rgba(15, 23, 42, 0.15); overflow: hidden;">
        <div style="padding: 24px; background: linear-gradient(120deg, #f97316, #ef4444, #db2777); color: white;">
          <p style="margin: 0; font-size: 12px; letter-spacing: 0.45em; text-transform: uppercase; opacity: 0.85;">Pomi Security</p>
          <h1 style="margin: 8px 0 0; font-size: 26px; font-weight: 800;">${copy.subject}</h1>
        </div>
        <div style="padding: 28px;">
          <p style="margin: 0 0 18px; color: #475569;">${copy.intro}</p>
          <div style="margin: 18px 0; padding: 20px; background: #0f172a; color: white; border-radius: 16px; text-align: center;">
            <p style="margin: 0; font-size: 14px; letter-spacing: 0.4em; text-transform: uppercase; color: rgba(255,255,255,0.65);">Verification code</p>
            <p style="margin: 12px 0 0; font-size: 36px; font-weight: 800; letter-spacing: 0.35em;">${code}</p>
          </div>
          <p style="margin: 0 0 12px; font-size: 13px; color: #94a3b8;">
            This code expires in 10 minutes. If you did not request it, you can safely ignore this email.
          </p>
        </div>
      </div>
      <p style="text-align: center; font-size: 12px; color: #94a3b8; margin-top: 18px;">
        © ${new Date().getFullYear()} Pomi Community Hub • Built for our community
      </p>
    </div>
  `

  return sendEmail({
    to: email,
    subject: copy.subject,
    html,
  })
}

export default {
  sendEmail,
  sendMessageNotification,
  sendWelcomeEmail,
  sendEventCreationNotification,
  sendBusinessSubmissionNotification,
  sendListingSubmissionNotification,
  sendVerificationCodeEmail,
};
