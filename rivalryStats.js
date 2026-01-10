/**
 * Rivalry Statistics Aggregation Module
 * 
 * Pure aggregation logic for computing rivalry rankings.
 * Does NOT interact with UI - only data processing.
 * 
 * Expected Data Structure:
 * - User object: { uid, school, frat, score }
 * - Users array: Array of user objects with rivalry data
 */

// =============================================================================
// DATA AGGREGATION FUNCTIONS
// =============================================================================

/**
 * Get individual rank for a user within their school
 * 
 * @param {string} userId - The user's unique ID
 * @param {string} schoolId - The school to filter by
 * @param {Array} allUsers - Array of all users with { uid, school, frat, score }
 * @returns {Object} { rank: number | null, totalUsers: number }
 * 
 * Example:
 *   getIndividualRankForUser('user123', 'University of Michigan', allUsers)
 *   => { rank: 5, totalUsers: 50 }
 */
export function getIndividualRankForUser(userId, schoolId, allUsers) {
    // Filter users by school
    const schoolUsers = allUsers.filter(user => 
        user.school === schoolId && 
        user.score !== undefined && 
        user.score !== null
    );

    if (schoolUsers.length === 0) {
        return { rank: null, totalUsers: 0 };
    }

    // Sort descending by score
    const sortedUsers = schoolUsers.sort((a, b) => b.score - a.score);

    // Find the user's rank (1-based)
    const userIndex = sortedUsers.findIndex(user => user.uid === userId);

    if (userIndex === -1) {
        // User not found in this school (shouldn't happen if data is valid)
        return { rank: null, totalUsers: schoolUsers.length };
    }

    return {
        rank: userIndex + 1, // 1-based ranking
        totalUsers: schoolUsers.length
    };
}

/**
 * Get fraternity rank for a user's frat within their school
 * 
 * @param {string} userId - The user's unique ID
 * @param {Array} allUsers - Array of all users with { uid, school, frat, score }
 * @returns {Object} { fratName: string, rank: number | null, totalFrats: number, totalScore: number }
 * 
 * Example:
 *   getFratRankForUser('user123', allUsers)
 *   => { fratName: 'Sigma Chi', rank: 2, totalFrats: 8, totalScore: 15750 }
 */
export function getFratRankForUser(userId, allUsers) {
    // Find the user to get their school and frat
    const user = allUsers.find(u => u.uid === userId);

    if (!user || !user.school || !user.frat) {
        return { fratName: null, rank: null, totalFrats: 0, totalScore: 0 };
    }

    // Filter users by the same school
    const schoolUsers = allUsers.filter(u => 
        u.school === user.school && 
        u.frat && 
        u.score !== undefined && 
        u.score !== null
    );

    if (schoolUsers.length === 0) {
        return { fratName: user.frat, rank: null, totalFrats: 0, totalScore: 0 };
    }

    // Group by frat and sum scores
    const fratScores = {};
    
    schoolUsers.forEach(u => {
        if (!fratScores[u.frat]) {
            fratScores[u.frat] = {
                fratName: u.frat,
                totalScore: 0,
                memberCount: 0
            };
        }
        fratScores[u.frat].totalScore += u.score;
        fratScores[u.frat].memberCount += 1;
    });

    // Convert to array and sort descending by total score
    const fratRankings = Object.values(fratScores).sort((a, b) => 
        b.totalScore - a.totalScore
    );

    // Find the user's frat rank
    const fratRank = fratRankings.findIndex(f => f.fratName === user.frat);

    if (fratRank === -1) {
        // Shouldn't happen if data is valid
        return { 
            fratName: user.frat, 
            rank: null, 
            totalFrats: fratRankings.length, 
            totalScore: 0 
        };
    }

    return {
        fratName: user.frat,
        rank: fratRank + 1, // 1-based ranking
        totalFrats: fratRankings.length,
        totalScore: fratRankings[fratRank].totalScore,
        memberCount: fratRankings[fratRank].memberCount
    };
}

/**
 * Get the top-ranked fraternity at a specific school (TopSeat)
 * 
 * @param {string} schoolId - The school to check
 * @param {Array} allUsers - Array of all users with { uid, school, frat, score }
 * @returns {Object|null} { fratName: string, totalScore: number, memberCount: number } | null
 * 
 * Example:
 *   getTopSeatFratForSchool('University of Michigan', allUsers)
 *   => { fratName: 'Alpha', totalScore: 28500, memberCount: 12 }
 */
export function getTopSeatFratForSchool(schoolId, allUsers) {
    // Filter users by school
    const schoolUsers = allUsers.filter(u => 
        u.school === schoolId && 
        u.frat && 
        u.score !== undefined && 
        u.score !== null
    );

    if (schoolUsers.length === 0) {
        return null;
    }

    // Group by frat and sum scores
    const fratScores = {};
    
    schoolUsers.forEach(u => {
        if (!fratScores[u.frat]) {
            fratScores[u.frat] = {
                fratName: u.frat,
                totalScore: 0,
                memberCount: 0
            };
        }
        fratScores[u.frat].totalScore += u.score;
        fratScores[u.frat].memberCount += 1;
    });

    // Convert to array and sort descending by total score
    const fratRankings = Object.values(fratScores).sort((a, b) => 
        b.totalScore - a.totalScore
    );

    // Return the top frat (or null if none exist)
    return fratRankings.length > 0 ? fratRankings[0] : null;
}

/**
 * Get all frat rankings for a specific school
 * 
 * @param {string} schoolId - The school to check
 * @param {Array} allUsers - Array of all users with { uid, school, frat, score }
 * @returns {Array} Array of { fratName, totalScore, memberCount, rank }
 * 
 * Example:
 *   getAllFratRankingsForSchool('University of Michigan', allUsers)
 *   => [
 *        { fratName: 'Alpha', totalScore: 28500, memberCount: 12, rank: 1 },
 *        { fratName: 'Beta', totalScore: 22000, memberCount: 8, rank: 2 },
 *        ...
 *      ]
 */
export function getAllFratRankingsForSchool(schoolId, allUsers) {
    // Filter users by school
    const schoolUsers = allUsers.filter(u => 
        u.school === schoolId && 
        u.frat && 
        u.score !== undefined && 
        u.score !== null
    );

    if (schoolUsers.length === 0) {
        return [];
    }

    // Group by frat and sum scores
    const fratScores = {};
    
    schoolUsers.forEach(u => {
        if (!fratScores[u.frat]) {
            fratScores[u.frat] = {
                fratName: u.frat,
                totalScore: 0,
                memberCount: 0
            };
        }
        fratScores[u.frat].totalScore += u.score;
        fratScores[u.frat].memberCount += 1;
    });

    // Convert to array and sort descending by total score
    const fratRankings = Object.values(fratScores).sort((a, b) => 
        b.totalScore - a.totalScore
    );

    // Add rank to each frat
    return fratRankings.map((frat, index) => ({
        ...frat,
        rank: index + 1
    }));
}

/**
 * Get top individuals at a specific school
 * 
 * @param {string} schoolId - The school to check
 * @param {Array} allUsers - Array of all users with { uid, school, frat, score, name }
 * @param {number} limit - Number of top users to return (default: 10)
 * @returns {Array} Array of { uid, name, frat, score, rank }
 * 
 * Example:
 *   getTopIndividualsForSchool('University of Michigan', allUsers, 5)
 *   => [
 *        { uid: 'user1', name: 'John', frat: 'Alpha', score: 5000, rank: 1 },
 *        { uid: 'user2', name: 'Jane', frat: 'Beta', score: 4500, rank: 2 },
 *        ...
 *      ]
 */
export function getTopIndividualsForSchool(schoolId, allUsers, limit = 10) {
    // Filter users by school
    const schoolUsers = allUsers.filter(u => 
        u.school === schoolId && 
        u.score !== undefined && 
        u.score !== null
    );

    if (schoolUsers.length === 0) {
        return [];
    }

    // Sort descending by score
    const sortedUsers = schoolUsers.sort((a, b) => b.score - a.score);

    // Take top N and add rank
    return sortedUsers.slice(0, limit).map((user, index) => ({
        uid: user.uid,
        name: user.name || 'Anonymous',
        frat: user.frat,
        score: user.score,
        rank: index + 1
    }));
}

// =============================================================================
// BROWSER-COMPATIBLE VERSION (NO ES6 MODULES)
// For use directly in HTML <script> tags
// =============================================================================

if (typeof window !== 'undefined') {
    window.rivalryStats = {
        getIndividualRankForUser,
        getFratRankForUser,
        getTopSeatFratForSchool,
        getAllFratRankingsForSchool,
        getTopIndividualsForSchool
    };
}
