import { adminDb } from '../_firebaseAdmin.js';
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email } = req.body;
    if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'Valid email address is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes expiration

    const hasServiceAccount = !!process.env.FIREBASE_SERVICE_ACCOUNT;
    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_PASS;

    const canSendRealEmail = !!(gmailUser && gmailPass);

    try {
        if (hasServiceAccount && adminDb) {
            // Save OTP to Firestore for secure backend verification
            const otpRef = adminDb.collection('email_otps').doc(normalizedEmail);
            await otpRef.set({
                otp,
                expiresAt,
                createdAt: Date.now()
            });
        }

        if (canSendRealEmail) {
            // Production Gmail SMTP Transport - Dispatch REAL email
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: gmailUser,
                    pass: gmailPass
                }
            });

            const mailOptions = {
                from: `"Unify Auth Services" <${gmailUser}>`,
                to: normalizedEmail,
                subject: `🔒 Your Unify Verification Code: ${otp}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0F172A; border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.08); color: white;">
                        <h2 style="color: #38bdf8; font-weight: 700; margin-bottom: 8px;">Welcome to Unify!</h2>
                        <p style="font-size: 14px; opacity: 0.8; margin-bottom: 24px;">Use the following one-time passcode to complete your authentication session. This code is valid for 5 minutes.</p>
                        
                        <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 18px; text-align: center; margin-bottom: 24px;">
                            <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #38bdf8; font-family: monospace;">${otp}</span>
                        </div>
                        
                        <p style="font-size: 12px; opacity: 0.5; margin-top: 24px; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 16px;">
                            If you did not request this code, you can safely ignore this email.
                        </p>
                    </div>
                `
            };

            await transporter.sendMail(mailOptions);
            console.log(`[Gmail OTP] Successfully sent real OTP email to ${normalizedEmail}`);

            return res.status(200).json({ 
                success: true, 
                message: 'OTP sent to your email successfully.',
                emailSent: true,
                mock: !hasServiceAccount, // If no service account, client verifies locally
                otp: !hasServiceAccount ? otp : undefined
            });
        } else {
            // Local / Demo Fallback Mode (Console only)
            console.log(`\n==============================================`);
            console.log(`[MOCK GMAIL OTP] Sending to: ${normalizedEmail}`);
            console.log(`[MOCK GMAIL OTP] Your OTP Code is: ${otp}`);
            console.log(`==============================================\n`);

            return res.status(200).json({ 
                success: true, 
                message: 'OTP generated in Local Fallback mode.',
                emailSent: false,
                mock: true,
                otp: otp
            });
        }

    } catch (error) {
        console.error('[Send OTP Error]:', error);
        return res.status(500).json({ error: 'Failed to generate or send OTP: ' + error.message });
    }
}
