import axios from 'axios';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'marakihay@gmail.com';
const FROM_EMAIL = process.env.FROM_EMAIL || 'marakihay@gmail.com';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

/**
 * Send email using SendGrid API
 */
const sendEmail = async (options: SendEmailOptions): Promise<boolean> => {
  if (!SENDGRID_API_KEY) {
    console.warn('⚠️  SENDGRID_API_KEY not configured. Email not sent.');
    return false;
  }

  try {
    const response = await axios.post(
      'https://api.sendgrid.com/v3/mail/send',
      {
        personalizations: [
          {
            to: [
              {
                email: options.to,
              },
            ],
            subject: options.subject,
          },
        ],
        from: {
          email: options.from || FROM_EMAIL,
          name: 'Pomi Community',
        },
        content: [
          {
            type: 'text/html',
            value: options.html,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(`✅ Email sent to ${options.to}`);
    return true;
  } catch (error: any) {
    console.error('❌ Failed to send email:', error.response?.data || error.message);
    return false;
  }
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

export default {
  sendEmail,
  sendWelcomeEmail,
  sendEventCreationNotification,
  sendBusinessSubmissionNotification,
  sendListingSubmissionNotification,
};
