// Referral Validation System with Email Verification Gating
// Add this to your backend

const admin = require('firebase-admin');
const db = admin.firestore();

// ===== REFERRAL VALIDATION RULES =====

/**
 * Check if a referral is valid for counting toward rewards
 * 
 * A referral counts if:
 * 1. User has verified their email (emailVerified = true)
 * 2. User has completed at least one real, prize-eligible game attempt
 * 
 * @param {string} uid - User ID to check
 * @returns {Promise<Object>} - { valid: boolean, reason: string }
 */
async function isReferralValid(uid) {
    try {
        // 1. Get user document
        const userRef = db.collection('users').doc(uid);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
            return { valid: false, reason: 'User not found' };
        }
        
        const userData = userDoc.data();
        
        // 2. Check email verification
        if (!userData.emailVerified) {
            return { 
                valid: false, 
                reason: 'Email not verified',
                status: 'pending_verification'
            };
        }
        
        // 3. Check if user has made at least one game attempt
        const attemptsRef = db.collection('attempts');
        const attemptsQuery = attemptsRef
            .where('uid', '==', uid)
            .limit(1);
        
        const attemptsSnapshot = await attemptsQuery.get();
        
        if (attemptsSnapshot.empty) {
            return { 
                valid: false, 
                reason: 'No game attempts made',
                status: 'pending_gameplay'
            };
        }
        
        // 4. All checks passed
        return { 
            valid: true, 
            reason: 'Referral valid',
            status: 'active'
        };
        
    } catch (error) {
        console.error('Error validating referral:', error);
        return { 
            valid: false, 
            reason: 'Validation error',
            error: error.message
        };
    }
}

/**
 * Get valid referral count for a user
 * Only counts referrals that are email verified AND have played
 * 
 * @param {string} uid - User ID (referrer)
 * @returns {Promise<Object>} - { valid: number, pending: number, total: number, details: Array }
 */
async function getValidReferralCount(uid) {
    try {
        // 1. Get user's share code
        const userRef = db.collection('users').doc(uid);
        const userDoc = await userRef.get();
        
        if (!userDoc.exists()) {
            return { valid: 0, pending: 0, total: 0, details: [] };
        }
        
        const shareCode = userDoc.data().shareCode;
        if (!shareCode) {
            return { valid: 0, pending: 0, total: 0, details: [] };
        }
        
        // 2. Get all users who used this referral code
        const referredUsersRef = db.collection('users');
        const referredQuery = referredUsersRef.where('referredByCode', '==', shareCode);
        const referredSnapshot = await referredQuery.get();
        
        if (referredSnapshot.empty) {
            return { valid: 0, pending: 0, total: 0, details: [] };
        }
        
        // 3. Validate each referral
        const validationPromises = referredSnapshot.docs.map(async (doc) => {
            const referredUser = doc.data();
            const validation = await isReferralValid(doc.id);
            
            return {
                uid: doc.id,
                email: referredUser.email,
                emailVerified: referredUser.emailVerified || false,
                createdAt: referredUser.createdAt,
                ...validation
            };
        });
        
        const validations = await Promise.all(validationPromises);
        
        // 4. Count results
        const validCount = validations.filter(v => v.valid).length;
        const pendingCount = validations.filter(v => !v.valid).length;
        
        return {
            valid: validCount,
            pending: pendingCount,
            total: validations.length,
            details: validations
        };
        
    } catch (error) {
        console.error('Error getting valid referral count:', error);
        return { 
            valid: 0, 
            pending: 0, 
            total: 0, 
            details: [],
            error: error.message
        };
    }
}

/**
 * Check if user has reached referral reward milestones
 * Only counts VALID referrals (verified + played)
 * 
 * @param {string} uid - User ID
 * @returns {Promise<Object>} - Milestone status
 */
async function checkReferralMilestones(uid) {
    const { valid, pending, total } = await getValidReferralCount(uid);
    
    return {
        validReferrals: valid,
        pendingReferrals: pending,
        totalReferrals: total,
        milestones: {
            tier1: {
                threshold: 10,
                reward: 25,
                reached: valid >= 10,
                progress: Math.min(valid, 10),
                remaining: Math.max(0, 10 - valid)
            },
            tier2: {
                threshold: 25,
                reward: 50,
                reached: valid >= 25,
                progress: Math.min(valid, 25),
                remaining: Math.max(0, 25 - valid)
            }
        },
        bonusAttempts: valid * 5, // Each valid referral = 5 attempts
        eligibleForRewards: true
    };
}

// ===== API ENDPOINTS =====

/**
 * GET /api/referrals/status
 * Get user's referral status with valid/pending breakdown
 */
app.get('/api/referrals/status', async (req, res) => {
    try {
        const { uid } = req.query;
        
        if (!uid) {
            return res.status(400).json({ error: 'User ID required' });
        }
        
        const status = await checkReferralMilestones(uid);
        res.json(status);
        
    } catch (error) {
        console.error('Error getting referral status:', error);
        res.status(500).json({ error: 'Failed to get referral status' });
    }
});

/**
 * POST /api/referrals/validate
 * Manually trigger referral validation for a user
 * (Useful after email verification or first game play)
 */
app.post('/api/referrals/validate', async (req, res) => {
    try {
        const { uid } = req.body;
        
        if (!uid) {
            return res.status(400).json({ error: 'User ID required' });
        }
        
        const validation = await isReferralValid(uid);
        
        if (validation.valid) {
            // Update referral status in database if needed
            await db.collection('users').doc(uid).update({
                referralValidated: true,
                referralValidatedAt: admin.firestore.Timestamp.now()
            });
        }
        
        res.json(validation);
        
    } catch (error) {
        console.error('Error validating referral:', error);
        res.status(500).json({ error: 'Failed to validate referral' });
    }
});

// ===== FIRESTORE TRIGGERS =====

/**
 * Cloud Function: Validate referral when email is verified
 * Trigger: onUpdate on users/{uid} when emailVerified changes to true
 */
exports.onEmailVerified = functions.firestore
    .document('users/{uid}')
    .onUpdate(async (change, context) => {
        const before = change.before.data();
        const after = change.after.data();
        const uid = context.params.uid;
        
        // Check if email was just verified
        if (!before.emailVerified && after.emailVerified) {
            console.log(`✅ Email verified for user: ${uid}`);
            
            // Check if user has referrer
            if (after.referredByCode) {
                // Validate this referral
                const validation = await isReferralValid(uid);
                
                console.log(`Referral validation for ${uid}:`, validation);
                
                // If valid, update referrer's bonus attempts
                if (validation.valid) {
                    // Find referrer
                    const referrerQuery = await db.collection('users')
                        .where('shareCode', '==', after.referredByCode)
                        .limit(1)
                        .get();
                    
                    if (!referrerQuery.empty) {
                        const referrerDoc = referrerQuery.docs[0];
                        const referrerData = referrerDoc.data();
                        
                        // Award bonus attempts
                        await referrerDoc.ref.update({
                            bonusAttempts: (referrerData.bonusAttempts || 0) + 5
                        });
                        
                        console.log(`✅ Awarded 5 bonus attempts to referrer: ${referrerDoc.id}`);
                    }
                }
            }
        }
    });

/**
 * Cloud Function: Validate referral when first game attempt is made
 * Trigger: onCreate on attempts/{attemptId}
 */
exports.onFirstGameAttempt = functions.firestore
    .document('attempts/{attemptId}')
    .onCreate(async (snap, context) => {
        const attempt = snap.data();
        const uid = attempt.uid;
        
        // Check if this is user's first attempt
        const previousAttempts = await db.collection('attempts')
            .where('uid', '==', uid)
            .limit(2)
            .get();
        
        if (previousAttempts.size === 1) {
            // This is the first attempt
            console.log(`🎮 First game attempt for user: ${uid}`);
            
            // Get user data
            const userDoc = await db.collection('users').doc(uid).get();
            const userData = userDoc.data();
            
            // Check if they were referred
            if (userData && userData.referredByCode) {
                // Validate referral
                const validation = await isReferralValid(uid);
                
                console.log(`Referral validation after first play:`, validation);
                
                // If valid and email is verified, award bonus
                if (validation.valid) {
                    const referrerQuery = await db.collection('users')
                        .where('shareCode', '==', userData.referredByCode)
                        .limit(1)
                        .get();
                    
                    if (!referrerQuery.empty) {
                        const referrerDoc = referrerQuery.docs[0];
                        const referrerData = referrerDoc.data();
                        
                        await referrerDoc.ref.update({
                            bonusAttempts: (referrerData.bonusAttempts || 0) + 5
                        });
                        
                        console.log(`✅ Awarded 5 bonus attempts to referrer after gameplay: ${referrerDoc.id}`);
                    }
                }
            }
        }
    });

// Export functions
module.exports = {
    isReferralValid,
    getValidReferralCount,
    checkReferralMilestones
};
