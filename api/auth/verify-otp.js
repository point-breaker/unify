import { adminDb, adminAuth } from '../_firebaseAdmin.js';

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

    const { email, otp } = req.body;
    if (!email || !otp) {
        return res.status(400).json({ error: 'Email and OTP code are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    try {
        if (!adminDb || !adminAuth) {
            throw new Error("Firebase Admin is not fully initialized.");
        }

        const otpRef = adminDb.collection('email_otps').doc(normalizedEmail);
        const docSnap = await otpRef.get();

        if (!docSnap.exists) {
            return res.status(400).json({ error: 'No OTP requested for this email address.' });
        }

        const data = docSnap.data();

        // 1. Check expiration
        if (Date.now() > data.expiresAt) {
            await otpRef.delete().catch(() => {});
            return res.status(400).json({ error: 'Verification code has expired. Please request a new one.' });
        }

        // 2. Validate OTP
        if (data.otp !== otp.trim()) {
            return res.status(400).json({ error: 'Incorrect verification code. Please check and try again.' });
        }

        // OTP is correct! Delete it to prevent reuse
        await otpRef.delete().catch(() => {});

        // 3. Find or Create Firebase Auth User
        let uid = '';
        let userRecord;
        try {
            userRecord = await adminAuth.getUserByEmail(normalizedEmail);
            uid = userRecord.uid;
            console.log(`[Verify OTP] Found existing Firebase user: ${normalizedEmail} (UID: ${uid})`);
        } catch (authError) {
            if (authError.code === 'auth/user-not-found') {
                // User does not exist, create them!
                userRecord = await adminAuth.createUser({
                    email: normalizedEmail,
                    emailVerified: true,
                    displayName: normalizedEmail.split('@')[0]
                });
                uid = userRecord.uid;
                console.log(`[Verify OTP] Created new Firebase user: ${normalizedEmail} (UID: ${uid})`);
            } else {
                throw authError;
            }
        }

        // 4. Generate Custom Auth Token
        const customToken = await adminAuth.createCustomToken(uid);
        console.log(`[Verify OTP] Generated Firebase Custom Token successfully for UID: ${uid}`);

        return res.status(200).json({
            success: true,
            customToken,
            email: normalizedEmail,
            uid
        });

    } catch (error) {
        console.error('[Verify OTP Error]:', error);
        return res.status(500).json({ error: 'Failed to verify OTP: ' + error.message });
    }
}
