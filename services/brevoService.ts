
// ==================================================================================
// 🟢 BREVO (SENDINBLUE) CONFIGURATION
// ==================================================================================
// 1. Get API Key from https://www.brevo.com/ (My Profile -> SMTP & API -> API KEYS tab)
// 2. IMPORTANT: Generate a new key from the "API Keys" section, NOT "SMTP Keys".
// 3. Paste below.

const BREVO_API_KEY = import.meta.env.VITE_BREVO_API_KEY || ''; 

// 3. IMPORTANT: This email MUST be verified in your Brevo account (Senders & IP)
// or the API will reject it. For testing, verify your own email address in Brevo.
const SENDER_EMAIL = import.meta.env.VITE_SENDER_EMAIL || 'claridadjulyfranz@gmail.com'; 
const SENDER_NAME = import.meta.env.VITE_SENDER_NAME || 'Forever App';

// ==================================================================================

// Generate a 6-digit OTP
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP via Brevo
export const sendOtpEmail = async (userEmail: string, otp: string): Promise<boolean> => {
  if (!BREVO_API_KEY) {
    console.error("[Brevo Service] API Key is missing.");
    return false;
  }

  const cleanKey = BREVO_API_KEY.trim();

  // 🔴 VALIDATION CHECK: Ensure user isn't using an SMTP key
  if (cleanKey.startsWith('xsmtpsib-')) {
      console.error(
          "%c🔴 CONFIGURATION ERROR: You are using an SMTP Key (starts with 'xsmtpsib-').\n" + 
          "The Web API requires a V3 API Key (starts with 'xkeysib-').\n" +
          "👉 Go to Brevo Dashboard -> My Profile -> SMTP & API -> Click 'API Keys' tab -> Generate a new key.",
          "font-weight: bold; font-size: 14px; color: red;"
      );
      return false;
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': cleanKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: {
          name: SENDER_NAME,
          email: SENDER_EMAIL
        },
        to: [
          {
            email: userEmail
          }
        ],
        subject: `Your Login Code: ${otp}`,
        htmlContent: `
          <html>
            <body style="font-family: sans-serif; text-align: center; color: #333;">
              <div style="padding: 20px;">
                <h2 style="color: #6b21a8;">Welcome to Forever</h2>
                <p>Use the code below to sign in and eternalize your memories.</p>
                <div style="background: #f3f4f6; padding: 15px; border-radius: 10px; display: inline-block; margin: 20px 0;">
                  <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px;">${otp}</span>
                </div>
                <p style="font-size: 12px; color: #666;">If you didn't request this, please ignore this email.</p>
              </div>
            </body>
          </html>
        `
      })
    });

    if (!response.ok) {
      // Log the specific error from Brevo for debugging
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      
      console.error(`[Brevo API Error] Status: ${response.status}`);
      console.error("Error Details:", JSON.stringify(errorData, null, 2));
      
      // Common hints based on codes
      if (response.status === 401) console.warn("Hint: Your API Key is invalid or you are using an SMTP Key.");
      if (response.status === 400 && JSON.stringify(errorData).includes("sender")) console.warn(`Hint: Ensure '${SENDER_EMAIL}' is a verified sender in Brevo.`);
      
      return false; 
    }

    return true;

  } catch (error) {
    // Network error (CORS or Offline)
    console.error("[Brevo Connection Error]", error);
    return false;
  }
};
