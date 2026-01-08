// Backend Email Verification System (Node.js/Express)
// Add these endpoints to your existing index.js

const express = require('express');
const crypto = require('crypto');
const admin = require('firebase-admin');
const { validateEmail, isDisposableEmailAPI } = require('./email-validation');

// Initialize if not already done
// const app = express();
// const db = admin.firestore();

// ===== EMAIL VERIFICATION ENDPOINTS =====

// Generate secure verification token
function generateVerificationToken() {
    return crypto.randomBytes(32).toString('hex');
}

// Generate verification link
function generateVerificationLink(token) {
    const baseUrl = process.env.BASE_URL || 'https://topseat.us';
    return `${baseUrl}/verify-email?token=${token}`;
}

// Send verification email (using Brevo)
async function sendVerificationEmail(email, verificationLink) {
    // Using Brevo (formerly Sendinblue)
    const BREVO_API_KEY = process.env.BREVO_SECRET_KEY;
    
    if (!BREVO_API_KEY) {
        console.error('❌ BREVO_SECRET_KEY environment variable not set');
        return false;
    }
    
    try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': BREVO_API_KEY,
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                sender: {
                    name: 'Sky Fall',
                    email: 'noreply@topseat.us'
                },
                to: [
                    {
                        email: email,
                        name: email.split('@')[0]
                    }
                ],
                subject: 'Verify Your Sky Fall Account',
                htmlContent: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <style>
                            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                            .header { background: linear-gradient(135deg, #60a5fa 0%, #2563eb 100%); 
                                     color: white; padding: 30px; text-align: center; border-radius: 8px; }
                            .content { background: #f9fafb; padding: 30px; margin: 20px 0; border-radius: 8px; }
                            .button { display: inline-block; padding: 14px 32px; background: #2563eb; 
                                     color: white !important; text-decoration: none; border-radius: 8px; 
                                     font-weight: bold; margin: 20px 0; }
                            .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
                            .link-text { word-break: break-all; color: #2563eb; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1 style="margin: 0; color: white;">🎮 Welcome to Sky Fall!</h1>
                            </div>
                            <div class="content">
                                <h2 style="color: #1f2937;">Verify Your Email Address</h2>
                                <p>Thanks for signing up! Please verify your email address to start playing and earning rewards.</p>
                                <p>Click the button below to verify your account:</p>
                                <div style="text-align: center;">
                                    <a href="${verificationLink}" class="button">Verify Email Address</a>
                                </div>
                                <p style="margin-top: 20px; font-size: 14px; color: #6b7280;">
                                    Or copy and paste this link: <br>
                                    <span class="link-text">${verificationLink}</span>
                                </p>
                                <p style="margin-top: 20px; color: #dc2626; font-weight: bold;">
                                    ⚠️ This link expires in 24 hours.
                                </p>
                            </div>
                            <div class="footer">
                                <p>If you didn't create this account, you can safely ignore this email.</p>
                                <p>© 2026 Sky Fall - Dodge obstacles, collect coins, win prizes!</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `
            })
        });
        
        if (response.ok) {
            console.log('✅ Verification email sent to:', email);
            return true;
        } else {
            const error = await response.json();
            console.error('❌ Error sending email:', error);
            return false;
        }
    } catch (error) {
        console.error('❌ Error sending verification email:', error);
        return false;
    }
}

// ===== SIGNUP ENDPOINT WITH VALIDATION =====

app.post('/api/signup', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ 
                error: 'Email is required',
                code: 'MISSING_EMAIL'
            });
        }
        
        // 1. Validate email format
        const validation = validateEmail(email.toLowerCase().trim());
        
        if (!validation.valid) {
            return res.status(400).json({
                error: validation.errors.join(', '),
                suggestions: validation.suggestions,
                code: 'INVALID_EMAIL'
            });
        }
        
        // 2. Check disposable email (API-based for best results)
        const isDisposable = await isDisposableEmailAPI(email);
        if (isDisposable) {
            return res.status(400).json({
                error: 'Disposable email addresses are not allowed. Please use a permanent email address.',
                code: 'DISPOSABLE_EMAIL'
            });
        }
        
        // 3. Create Firebase Auth user (or check if exists)
        let user;
        try {
            user = await admin.auth().getUserByEmail(email);
            
            // User exists - check if verified
            if (user.emailVerified) {
                return res.status(400).json({
                    error: 'Email already registered and verified',
                    code: 'EMAIL_EXISTS'
                });
            }
            
            // User exists but not verified - resend verification
            console.log('User exists but not verified, resending email...');
            
        } catch (error) {
            // User doesn't exist - create new
            if (error.code === 'auth/user-not-found') {
                const password = 'skyfall_' + email; // Your existing password scheme
                user = await admin.auth().createUser({
                    email: email,
                    password: password,
                    emailVerified: false
                });
                console.log('✅ Created new user:', user.uid);
            } else {
                throw error;
            }
        }
        
        // 4. Generate verification token
        const token = generateVerificationToken();
        const expiresAt = admin.firestore.Timestamp.fromDate(
            new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        );
        
        // 5. Store verification token in Firestore
        await db.collection('emailVerifications').doc(user.uid).set({
            email: email,
            token: token,
            createdAt: admin.firestore.Timestamp.now(),
            expiresAt: expiresAt,
            verified: false,
            uid: user.uid
        });
        
        // 6. Create/update user document
        const shareCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        await db.collection('users').doc(user.uid).set({
            uid: user.uid,
            email: email,
            shareCode: shareCode,
            bonusAttempts: 0,
            emailVerified: false,
            createdAt: admin.firestore.Timestamp.now()
        }, { merge: true });
        
        // 7. Send verification email
        const verificationLink = generateVerificationLink(token);
        const emailSent = await sendVerificationEmail(email, verificationLink);
        
        if (!emailSent) {
            console.error('Failed to send verification email');
            // Don't fail signup, but log the error
        }
        
        res.json({
            success: true,
            message: 'Account created! Please check your email to verify your account.',
            uid: user.uid,
            emailSent: emailSent
        });
        
    } catch (error) {
        console.error('❌ Signup error:', error);
        res.status(500).json({
            error: 'Failed to create account',
            code: 'SIGNUP_FAILED',
            details: error.message
        });
    }
});

// ===== EMAIL VERIFICATION ENDPOINT =====

app.get('/api/verify-email', async (req, res) => {
    try {
        const { token } = req.query;
        
        if (!token) {
            return res.status(400).json({
                error: 'Verification token is required',
                code: 'MISSING_TOKEN'
            });
        }
        
        // 1. Find verification record by token
        const verificationsRef = db.collection('emailVerifications');
        const snapshot = await verificationsRef.where('token', '==', token).limit(1).get();
        
        if (snapshot.empty) {
            return res.status(400).json({
                error: 'Invalid or expired verification link',
                code: 'INVALID_TOKEN'
            });
        }
        
        const verificationDoc = snapshot.docs[0];
        const verification = verificationDoc.data();
        
        // 2. Check if already verified
        if (verification.verified) {
            return res.status(400).json({
                error: 'Email already verified',
                code: 'ALREADY_VERIFIED'
            });
        }
        
        // 3. Check if expired
        const now = Date.now();
        const expiresAt = verification.expiresAt.toMillis();
        
        if (now > expiresAt) {
            return res.status(400).json({
                error: 'Verification link has expired. Please request a new one.',
                code: 'EXPIRED_TOKEN'
            });
        }
        
        // 4. Mark as verified in Firebase Auth
        await admin.auth().updateUser(verification.uid, {
            emailVerified: true
        });
        
        // 5. Update verification record
        await verificationDoc.ref.update({
            verified: true,
            verifiedAt: admin.firestore.Timestamp.now()
        });
        
        // 6. Update user document
        await db.collection('users').doc(verification.uid).update({
            emailVerified: true,
            emailVerifiedAt: admin.firestore.Timestamp.now()
        });
        
        console.log('✅ Email verified for user:', verification.uid);
        
        // Redirect to success page
        res.redirect('/verification-success.html');
        
    } catch (error) {
        console.error('❌ Verification error:', error);
        res.status(500).json({
            error: 'Failed to verify email',
            code: 'VERIFICATION_FAILED',
            details: error.message
        });
    }
});

// ===== RESEND VERIFICATION EMAIL =====

app.post('/api/resend-verification', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        
        // Get user
        const user = await admin.auth().getUserByEmail(email);
        
        if (user.emailVerified) {
            return res.status(400).json({ error: 'Email already verified' });
        }
        
        // Generate new token
        const token = generateVerificationToken();
        const expiresAt = admin.firestore.Timestamp.fromDate(
            new Date(Date.now() + 24 * 60 * 60 * 1000)
        );
        
        // Update verification record
        await db.collection('emailVerifications').doc(user.uid).set({
            email: email,
            token: token,
            createdAt: admin.firestore.Timestamp.now(),
            expiresAt: expiresAt,
            verified: false,
            uid: user.uid
        });
        
        // Send email
        const verificationLink = generateVerificationLink(token);
        await sendVerificationEmail(email, verificationLink);
        
        res.json({ 
            success: true, 
            message: 'Verification email sent! Check your inbox.' 
        });
        
    } catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({ error: 'Failed to resend verification email' });
    }
});

// Export endpoints
module.exports = {
    generateVerificationToken,
    generateVerificationLink,
    sendVerificationEmail
};
