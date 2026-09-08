/**
 * Public Legal & Branding Pages for Slate
 * Compliant with Google API Services User Data Policy and Verification Requirements.
 */

const baseStyles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    background-color: #0E0F11;
    color: #E4E4E7;
    line-height: 1.6;
    padding: 40px 20px;
  }
  .container {
    max-width: 800px;
    margin: 0 auto;
    background: #18191D;
    border: 1px solid #27272A;
    border-radius: 16px;
    padding: 48px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  }
  .brand-badge {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    background: #27272A;
    padding: 8px 16px;
    border-radius: 9999px;
    font-size: 14px;
    color: #A1A1AA;
    margin-bottom: 24px;
  }
  .brand-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #10B981;
  }
  h1 {
    font-size: 36px;
    font-weight: 700;
    color: #FFFFFF;
    letter-spacing: -0.5px;
    margin-bottom: 12px;
  }
  h2 {
    font-size: 22px;
    font-weight: 600;
    color: #FFFFFF;
    margin-top: 36px;
    margin-bottom: 14px;
    border-bottom: 1px solid #27272A;
    padding-bottom: 8px;
  }
  p {
    font-size: 15px;
    color: #A1A1AA;
    margin-bottom: 16px;
  }
  ul {
    margin-left: 20px;
    margin-bottom: 18px;
    color: #A1A1AA;
    font-size: 15px;
  }
  li {
    margin-bottom: 8px;
  }
  strong {
    color: #FFFFFF;
  }
  .callout {
    background: #22242A;
    border-left: 4px solid #3B82F6;
    padding: 16px 20px;
    border-radius: 0 8px 8px 0;
    margin: 24px 0;
  }
  .callout p {
    color: #D4D4D8;
    margin-bottom: 0;
  }
  .nav-links {
    margin-top: 40px;
    padding-top: 24px;
    border-top: 1px solid #27272A;
    display: flex;
    gap: 20px;
    font-size: 14px;
  }
  a {
    color: #38BDF8;
    text-decoration: none;
  }
  a:hover {
    text-decoration: underline;
  }
  .footer {
    margin-top: 30px;
    text-align: center;
    font-size: 13px;
    color: #71717A;
  }
`;

/**
 * Public Home Page for Slate
 */
export const renderHomePage = (): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Slate - Ambient AI Meeting Copilot</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="brand-badge">
      <span class="brand-dot"></span>
      Official Application Home
    </div>

    <h1>Slate</h1>
    <p style="font-size: 18px; color: #E4E4E7; margin-bottom: 24px;">
      <strong>Clean, blank, and ready for thoughts.</strong>
    </p>

    <div class="callout">
      <p>
        <strong>What is Slate?</strong> Slate is an ambient AI executive copilot that syncs with your Google Calendar to organize your daily agenda, prepare contextual pre-meeting dossiers, and turn live discussions into structured, actionable intelligence.
      </p>
    </div>

    <h2>Purpose & Core Features</h2>
    <p>Slate provides professionals with a unified executive desk:</p>
    <ul>
      <li><strong>Live Calendar Sync:</strong> Securely connects to your Google Calendar to display upcoming events and meetings in chronological order on your desk.</li>
      <li><strong>Pre-Meeting Dossiers:</strong> Automatically aggregates attendees, topics, and objectives ahead of scheduled calls.</li>
      <li><strong>Ambient Live Copilot:</strong> Real-time note-taking and action-item extraction during meetings.</li>
      <li><strong>Editorial Desk:</strong> Clean Markdown note generation ready to export and share with your team.</li>
    </ul>

    <h2>Google Calendar Integration & Data Usage</h2>
    <p>
      To deliver an intelligent meeting experience, Slate requests user authorization to view calendar events via Google OAuth 2.0.
    </p>
    <ul>
      <li><strong>calendar.events.readonly:</strong> Used exclusively to retrieve your upcoming events (titles, timestamps, participant names) so you can review your schedule and take notes.</li>
      <li><strong>userinfo.email & userinfo.profile:</strong> Used to identify your account and personalize your workspace.</li>
    </ul>

    <p>
      <strong>Data Protection Guarantee:</strong> Slate strictly complies with the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener">Google API Services User Data Policy</a>. We never sell, transfer, or use your calendar data for advertising or unauthorized tracking.
    </p>

    <h2>Developer & Support Information</h2>
    <p>
      Developer: <strong>Aryan Soni</strong><br>
      Support Email: <a href="mailto:aryansoni2105@gmail.com">aryansoni2105@gmail.com</a><br>
      Application: <strong>Slate</strong> (Android & Web)
    </p>

    <div class="nav-links">
      <a href="/privacy">Privacy Policy</a>
      <a href="/terms">Terms of Service</a>
      <a href="mailto:aryansoni2105@gmail.com">Contact Support</a>
    </div>
  </div>

  <div class="footer">
    &copy; ${new Date().getFullYear()} Slate. All rights reserved.
  </div>
</body>
</html>
`;

/**
 * Public Privacy Policy for Slate (Google API Compliant)
 */
export const renderPrivacyPage = (): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Privacy Policy - Slate</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="brand-badge">
      <span class="brand-dot"></span>
      Privacy Policy
    </div>

    <h1>Privacy Policy for Slate</h1>
    <p>Last Updated: September 8, 2026</p>

    <p>
      This Privacy Policy describes how <strong>Slate</strong> ("we", "us", or "our") collects, uses, stores, and protects your information when you use our mobile application and related backend services.
    </p>

    <h2>1. Information We Collect</h2>
    <p>When you connect your Google Account with Slate, we collect the following limited information with your explicit consent:</p>
    <ul>
      <li><strong>Account Identity:</strong> Your name, email address, and profile photo provided by Google OAuth.</li>
      <li><strong>Calendar Data:</strong> Event titles, start and end times, attendee names and emails, event descriptions, and conference links (such as Google Meet or Zoom) via the Google Calendar API.</li>
    </ul>

    <h2>2. How We Use Your Information</h2>
    <p>We use your information strictly for the following purposes:</p>
    <ul>
      <li>To authenticate you and maintain your active session within Slate.</li>
      <li>To display your upcoming meeting agenda on your daily notes screen.</li>
      <li>To generate contextual meeting dossiers and structure meeting notes.</li>
    </ul>

    <div class="callout">
      <p>
        <strong>Google API Limited Use Disclosure:</strong><br>
        Slate's use and transfer to any other app of information received from Google APIs adheres to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener">Google API Services User Data Policy</a>, including the Limited Use requirements.
      </p>
    </div>

    <h2>3. What We Do NOT Do With Your Data</h2>
    <ul>
      <li>We <strong>do not sell</strong> your personal information or calendar data to any third party.</li>
      <li>We <strong>do not share</strong> your data with third parties for marketing, advertising, or data brokerage.</li>
      <li>We <strong>do not use</strong> your calendar data to train generalized public AI models without your authorization.</li>
    </ul>

    <h2>4. Data Storage and Security</h2>
    <p>
      All communication between the Slate mobile app, our backend services, and Google's APIs is encrypted in transit using industry-standard TLS/HTTPS protocols. User tokens are stored securely on the mobile device using hardware-backed SecureStore (iOS Keychain / Android Keystore).
    </p>

    <h2>5. User Control, Revocation, and Data Deletion</h2>
    <p>
      You have full control over your Google data at all times:
    </p>
    <ul>
      <li><strong>Disconnecting from the App:</strong> You can sign out at any time from your Profile screen in Slate, which clears all locally stored session tokens.</li>
      <li><strong>Revoking Access:</strong> You can instantly revoke Slate's access to your Google account at any time via <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener">Google Account Permissions</a>.</li>
      <li><strong>Data Deletion Request:</strong> To request complete deletion of any stored account records, email us at <a href="mailto:aryansoni2105@gmail.com">aryansoni2105@gmail.com</a>. We will process your deletion request within 48 hours.</li>
    </ul>

    <h2>6. Contact Information</h2>
    <p>
      If you have questions about this Privacy Policy or Slate's data practices, please contact:<br>
      <strong>Developer:</strong> Aryan Soni<br>
      <strong>Email:</strong> <a href="mailto:aryansoni2105@gmail.com">aryansoni2105@gmail.com</a><br>
      <strong>Application:</strong> Slate
    </p>

    <div class="nav-links">
      <a href="/">&larr; Back to Slate Home</a>
      <a href="/terms">Terms of Service</a>
      <a href="mailto:aryansoni2105@gmail.com">Contact Support</a>
    </div>
  </div>

  <div class="footer">
    &copy; ${new Date().getFullYear()} Slate. All rights reserved.
  </div>
</body>
</html>
`;

/**
 * Public Terms of Service for Slate
 */
export const renderTermsPage = (): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Terms of Service - Slate</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="brand-badge">
      <span class="brand-dot"></span>
      Terms of Service
    </div>

    <h1>Terms of Service for Slate</h1>
    <p>Last Updated: September 8, 2026</p>

    <h2>1. Acceptance of Terms</h2>
    <p>
      By accessing or using Slate ("the Application"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Application.
    </p>

    <h2>2. Description of Service</h2>
    <p>
      Slate is a productivity application that allows users to sync their Google Calendar, organize upcoming meetings, and take AI-assisted notes.
    </p>

    <h2>3. User Responsibilities</h2>
    <p>
      You are responsible for safeguarding your account credentials and for all activities that occur under your account. You agree not to misuse the Application or attempt to access it using unauthorized methods.
    </p>

    <h2>4. Termination</h2>
    <p>
      We reserve the right to suspend or terminate access to the Application at our discretion, without prior notice, for conduct that violates these Terms or applicable laws.
    </p>

    <h2>5. Contact Us</h2>
    <p>
      For any questions regarding these Terms, contact <a href="mailto:aryansoni2105@gmail.com">aryansoni2105@gmail.com</a>.
    </p>

    <div class="nav-links">
      <a href="/">&larr; Back to Slate Home</a>
      <a href="/privacy">Privacy Policy</a>
      <a href="mailto:aryansoni2105@gmail.com">Contact Support</a>
    </div>
  </div>

  <div class="footer">
    &copy; ${new Date().getFullYear()} Slate. All rights reserved.
  </div>
</body>
</html>
`;
