// Email Validation & Typo Detection Library
// Use this on both frontend and backend (Node.js compatible)

// ===== EMAIL FORMAT VALIDATION =====

// RFC 5322 compliant email regex (simplified but robust)
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

function isValidEmailFormat(email) {
    if (!email || typeof email !== 'string') return false;
    
    // Basic checks
    if (email.length > 254) return false; // RFC 5321
    if (!email.includes('@')) return false;
    
    const [local, domain] = email.split('@');
    
    // Local part (before @) validation
    if (!local || local.length > 64) return false;
    if (local.startsWith('.') || local.endsWith('.')) return false;
    if (local.includes('..')) return false;
    
    // Domain part validation
    if (!domain || domain.length > 253) return false;
    if (domain.startsWith('.') || domain.endsWith('.')) return false;
    if (domain.includes('..')) return false;
    
    // Final regex check
    return EMAIL_REGEX.test(email);
}

// ===== TYPO DETECTION =====

// Common email domains
const COMMON_DOMAINS = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 
    'icloud.com', 'me.com', 'aol.com', 'protonmail.com',
    'live.com', 'msn.com', 'comcast.net', 'verizon.net',
    'att.net', 'sbcglobal.net', 'cox.net', 'mail.com'
];

// Calculate Levenshtein distance for typo detection
function levenshteinDistance(a, b) {
    const matrix = [];
    
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }
    
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j] + 1      // deletion
                );
            }
        }
    }
    
    return matrix[b.length][a.length];
}

// Suggest correct domain if typo detected
function suggestDomain(email) {
    if (!email || !email.includes('@')) return null;
    
    const [local, domain] = email.split('@');
    const domainLower = domain.toLowerCase();
    
    // Find closest match
    let bestMatch = null;
    let bestDistance = Infinity;
    
    for (const commonDomain of COMMON_DOMAINS) {
        const distance = levenshteinDistance(domainLower, commonDomain);
        
        // If distance is 1-2, it's likely a typo
        if (distance > 0 && distance <= 2 && distance < bestDistance) {
            bestDistance = distance;
            bestMatch = commonDomain;
        }
    }
    
    if (bestMatch && bestMatch !== domainLower) {
        return `${local}@${bestMatch}`;
    }
    
    return null;
}

// ===== DISPOSABLE EMAIL DETECTION =====

// Top disposable email domains (can be expanded or use API)
const DISPOSABLE_DOMAINS = [
    // Temp email services
    '10minutemail.com', '10minutemail.net', 'throwaway.email',
    'guerrillamail.com', 'guerrillamail.net', 'sharklasers.com',
    'grr.la', 'guerrillamailblock.com', 'pokemail.net', 'spam4.me',
    'tempmail.com', 'tempmail.net', 'temp-mail.org', 'tempmailaddress.com',
    'mailinator.com', 'trashmail.com', 'getnada.com', 'maildrop.cc',
    'yopmail.com', 'yopmail.fr', 'cool.fr.nf', 'jetable.fr.nf',
    'nospam.ze.tc', 'nomail.xl.cx', 'mega.zik.dj', 'speed.1s.fr',
    'courriel.fr.nf', 'moncourrier.fr.nf', 'monemail.fr.nf',
    'monmail.fr.nf', 'hide.biz.st', 'mymail.infos.st',
    // Known generators
    'mailsac.com', 'mintemail.com', 'fakeinbox.com', 'throwawaymail.com',
    'spamgourmet.com', 'incognitomail.com', 'anonymbox.com',
    'deadaddress.com', 'emailondeck.com', 'fakeinbox.net',
    'getairmail.com', 'gishpuppy.com', 'mytrashmail.com',
    'mt2015.com', 'thankyou2010.com', 'trash-mail.com',
    'trbvm.com', 'wegwerfmail.de', 'wegwerfemail.de',
    // Plus many more - recommend using an API for comprehensive list
];

function isDisposableEmail(email) {
    if (!email || !email.includes('@')) return false;
    
    const domain = email.split('@')[1].toLowerCase();
    return DISPOSABLE_DOMAINS.includes(domain);
}

// API-based disposable email check (optional - requires API key)
async function isDisposableEmailAPI(email) {
    try {
        // Example using Abstract API (free tier available)
        // Sign up at https://www.abstractapi.com/email-validation-api
        const API_KEY = process.env.ABSTRACT_API_KEY;
        
        if (!API_KEY) {
            console.warn('No API key for disposable email check, using local list');
            return isDisposableEmail(email);
        }
        
        const response = await fetch(
            `https://emailvalidation.abstractapi.com/v1/?api_key=${API_KEY}&email=${encodeURIComponent(email)}`
        );
        
        const data = await response.json();
        return data.is_disposable_email?.value === true;
    } catch (error) {
        console.error('Disposable email API error:', error);
        // Fallback to local check
        return isDisposableEmail(email);
    }
}

// ===== COMPLETE VALIDATION =====

function validateEmail(email) {
    const result = {
        valid: false,
        email: email,
        errors: [],
        suggestions: null
    };
    
    // Format validation
    if (!isValidEmailFormat(email)) {
        result.errors.push('Invalid email format');
        return result;
    }
    
    // Check for typos
    const suggestion = suggestDomain(email);
    if (suggestion) {
        result.suggestions = suggestion;
    }
    
    // Disposable email check
    if (isDisposableEmail(email)) {
        result.errors.push('Disposable email addresses are not allowed');
        return result;
    }
    
    result.valid = true;
    return result;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        isValidEmailFormat,
        suggestDomain,
        isDisposableEmail,
        isDisposableEmailAPI,
        validateEmail
    };
}

// Export for browser
if (typeof window !== 'undefined') {
    window.EmailValidator = {
        isValidEmailFormat,
        suggestDomain,
        isDisposableEmail,
        validateEmail
    };
}
