import { Request, Response } from 'express';
import { getUserProfile } from '../services/googleCalendarService';
import { saveUser, getUserByEmail, User } from '../store/userStore';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Google authentication endpoint.
 * 
 * Architecture: The client (Expo) handles the full PKCE code exchange and
 * sends us either:
 * - `idToken`: Verified with Google to extract identity
 * - `accessToken`: Used to fetch user profile from Google's userinfo API
 * 
 * We no longer receive raw authorization codes. This eliminates the
 * `invalid_grant: Missing code verifier` error entirely.
 */
export const googleAuth = async (req: Request, res: Response): Promise<void> => {
  try {
    const { accessToken, idToken } = req.body;
    let userProfile: any;

    if (idToken) {
      // Primary path: verify the Google ID token
      try {
        const ticket = await client.verifyIdToken({
          idToken,
          audience: process.env.GOOGLE_CLIENT_ID,
        });
        userProfile = ticket.getPayload();
      } catch (idTokenErr) {
        console.warn('ID token verification failed, falling back to accessToken:', idTokenErr);
        // Fall through to accessToken path
      }
    }

    if (!userProfile && accessToken) {
      // Fallback path: use the access token to fetch user profile
      try {
        userProfile = await getUserProfile(accessToken);
      } catch (profileErr) {
        console.error('Failed to fetch user profile with access token:', profileErr);
        res.status(401).json({ error: 'Invalid or expired Google access token' });
        return;
      }
    }

    if (!userProfile || !userProfile.email) {
      res.status(400).json({ error: 'Must provide a valid accessToken or idToken' });
      return;
    }

    let user: User | undefined = getUserByEmail(userProfile.email);
    
    if (!user) {
      user = {
        id: userProfile.id || userProfile.sub,
        email: userProfile.email,
        name: userProfile.name,
        picture: userProfile.picture,
      };
      saveUser(user);
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '30d' }
    );

    res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture
      }
    });
  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(500).json({ error: 'Internal server error during authentication' });
  }
};

/**
 * Exchange Google Authorization Code for Access & Refresh Tokens.
 * This happens server-side with GOOGLE_CLIENT_SECRET to enable offline access.
 */
export const exchangeGoogleCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, redirectUri } = req.body;
    if (!code) {
      res.status(400).json({ error: 'Authorization code is required' });
      return;
    }

    const effectiveRedirectUri = redirectUri || process.env.REDIRECT_URI || 'https://auth.expo.io/@aryan2vb/granola';
    const oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      effectiveRedirectUri
    );

    const { tokens } = await oauth2Client.getToken(code);
    const { access_token, refresh_token, id_token, expiry_date } = tokens;

    if (!access_token) {
      res.status(400).json({ error: 'Google did not return an access token' });
      return;
    }

    let userProfile: any;
    if (id_token) {
      try {
        const ticket = await oauth2Client.verifyIdToken({
          idToken: id_token,
          audience: process.env.GOOGLE_CLIENT_ID,
        });
        userProfile = ticket.getPayload();
      } catch (e) {
        console.warn('ID token verification failed during code exchange, falling back to userinfo:', e);
      }
    }

    if (!userProfile) {
      userProfile = await getUserProfile(access_token);
    }

    if (!userProfile || !userProfile.email) {
      res.status(400).json({ error: 'Failed to retrieve Google user profile' });
      return;
    }

    let user: User | undefined = getUserByEmail(userProfile.email);
    if (!user) {
      user = {
        id: userProfile.id || userProfile.sub,
        email: userProfile.email,
        name: userProfile.name,
        picture: userProfile.picture,
      };
      saveUser(user);
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '30d' }
    );

    res.status(200).json({
      token,
      accessToken: access_token,
      refreshToken: refresh_token || null,
      expiresIn: expiry_date,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
      },
    });
  } catch (error: any) {
    console.error('Google Code Exchange Error:', error?.response?.data || error?.message || error);
    res.status(500).json({
      error: error?.response?.data?.error_description || error?.message || 'Failed to exchange authorization code with Google',
    });
  }
};

/**
 * Refresh expired Google access token using the stored refresh token.
 * Completely silent background operation without user re-authentication.
 */
export const refreshGoogleToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token is required' });
      return;
    }

    const oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await oauth2Client.refreshAccessToken();

    if (!credentials.access_token) {
      res.status(401).json({ error: 'Failed to refresh Google access token' });
      return;
    }

    res.status(200).json({
      accessToken: credentials.access_token,
      expiresIn: credentials.expiry_date,
    });
  } catch (error: any) {
    console.error('Google Token Refresh Error:', error?.response?.data || error?.message || error);
    res.status(401).json({
      error: error?.response?.data?.error_description || error?.message || 'Failed to refresh Google access token',
    });
  }
};

/**
 * Initiate browser-based Google OAuth redirect.
 * Supported universally on Standalone APKs, Expo Go, and Web.
 */
export const startGoogleBrowserAuth = (req: Request, res: Response): void => {
  const redirectScheme = (req.query.redirect_scheme as string) || 'granola';
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.get('host');
  const baseUrl = `${protocol}://${host}`;
  const callbackUrl = `${baseUrl}/api/auth/google/callback`;

  const state = Buffer.from(JSON.stringify({ redirectScheme, baseUrl })).toString('base64');

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || '',
    redirect_uri: callbackUrl,
    response_type: 'code',
    scope: 'openid email profile https://www.googleapis.com/auth/calendar.events.readonly https://www.googleapis.com/auth/calendar.events',
    access_type: 'offline',
    prompt: 'consent',
    state,
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
};

/**
 * Handle Google OAuth callback, exchange code, and deep-link back to the mobile app.
 */
export const handleGoogleBrowserCallback = async (req: Request, res: Response): Promise<void> => {
  const code = req.query.code as string;
  const stateStr = req.query.state as string;
  let redirectScheme = 'granola';

  if (stateStr) {
    try {
      const parsed = JSON.parse(Buffer.from(stateStr, 'base64').toString('utf8'));
      if (parsed.redirectScheme) redirectScheme = parsed.redirectScheme;
    } catch {
      // Ignore fallback
    }
  }

  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.get('host');
  const callbackUrl = `${protocol}://${host}/api/auth/google/callback`;

  if (!code) {
    const error = (req.query.error as string) || 'Authentication cancelled or failed';
    res.redirect(`${redirectScheme}://auth?error=${encodeURIComponent(error)}`);
    return;
  }

  try {
    const oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      callbackUrl
    );

    const { tokens } = await oauth2Client.getToken(code);
    const { access_token, refresh_token, id_token, expiry_date } = tokens;

    if (!access_token) {
      res.redirect(`${redirectScheme}://auth?error=${encodeURIComponent('No access token received from Google')}`);
      return;
    }

    let userProfile: any;
    if (id_token) {
      try {
        const ticket = await oauth2Client.verifyIdToken({
          idToken: id_token,
          audience: process.env.GOOGLE_CLIENT_ID,
        });
        userProfile = ticket.getPayload();
      } catch (e) {
        console.warn('ID token verify fallback:', e);
      }
    }

    if (!userProfile) {
      userProfile = await getUserProfile(access_token);
    }

    if (!userProfile || !userProfile.email) {
      res.redirect(`${redirectScheme}://auth?error=${encodeURIComponent('Failed to fetch user profile')}`);
      return;
    }

    let user: User | undefined = getUserByEmail(userProfile.email);
    if (!user) {
      user = {
        id: userProfile.id || userProfile.sub,
        email: userProfile.email,
        name: userProfile.name,
        picture: userProfile.picture,
      };
      saveUser(user);
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '30d' }
    );

    const deepLink = `${redirectScheme}://auth?token=${encodeURIComponent(token)}&accessToken=${encodeURIComponent(access_token)}&refreshToken=${encodeURIComponent(refresh_token || '')}&expiresIn=${encodeURIComponent(String(expiry_date || ''))}&user=${encodeURIComponent(JSON.stringify(user))}`;

    // Render an HTML page that triggers deep link and provides a fallback button
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authenticating Slate...</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #0E0F11; color: #FFFFFF; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; text-align: center; }
            h2 { font-weight: 500; margin-bottom: 8px; font-size: 20px; }
            p { color: #8E8F96; font-size: 14px; margin-bottom: 24px; }
            .btn { background: #FFFFFF; color: #0E0F11; padding: 12px 24px; border-radius: 9999px; text-decoration: none; font-weight: 600; font-size: 15px; }
          </style>
          <script>
            window.location.href = "${deepLink}";
          </script>
        </head>
        <body>
          <h2>Returning to Slate...</h2>
          <p>If you are not redirected automatically, tap the button below.</p>
          <a class="btn" href="${deepLink}">Open Slate</a>
        </body>
      </html>
    `);
  } catch (error: any) {
    console.error('Browser Auth Callback Error:', error);
    const msg = error?.message || 'Authentication error';
    res.redirect(`${redirectScheme}://auth?error=${encodeURIComponent(msg)}`);
  }
};

