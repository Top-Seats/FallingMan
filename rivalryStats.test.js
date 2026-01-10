/**
 * Rivalry Stats Test Suite
 * 
 * Mock data and test cases for rivalry aggregation functions
 */

// =============================================================================
// MOCK DATA
// =============================================================================

const MOCK_USERS = [
    // University of Michigan - Alpha
    { uid: 'user1', name: 'John Doe', school: 'University of Michigan', frat: 'Alpha', score: 5000 },
    { uid: 'user2', name: 'Jane Smith', school: 'University of Michigan', frat: 'Alpha', score: 4500 },
    { uid: 'user3', name: 'Bob Johnson', school: 'University of Michigan', frat: 'Alpha', score: 3200 },
    
    // University of Michigan - Beta
    { uid: 'user4', name: 'Alice Brown', school: 'University of Michigan', frat: 'Beta', score: 4800 },
    { uid: 'user5', name: 'Charlie Wilson', school: 'University of Michigan', frat: 'Beta', score: 4200 },
    { uid: 'user6', name: 'David Lee', school: 'University of Michigan', frat: 'Beta', score: 2500 },
    
    // University of Michigan - Gamma
    { uid: 'user7', name: 'Eve Davis', school: 'University of Michigan', frat: 'Gamma', score: 6000 },
    { uid: 'user8', name: 'Frank Miller', school: 'University of Michigan', frat: 'Gamma', score: 3800 },
    
    // Ohio State University - Alpha
    { uid: 'user9', name: 'Grace Taylor', school: 'Ohio State University', frat: 'Alpha', score: 5500 },
    { uid: 'user10', name: 'Henry Anderson', school: 'Ohio State University', frat: 'Alpha', score: 4000 },
    
    // Ohio State University - Beta
    { uid: 'user11', name: 'Ivy Thomas', school: 'Ohio State University', frat: 'Beta', score: 7000 },
    { uid: 'user12', name: 'Jack White', school: 'Ohio State University', frat: 'Beta', score: 3500 },
    
    // Michigan State University - Gamma
    { uid: 'user13', name: 'Kelly Harris', school: 'Michigan State University', frat: 'Gamma', score: 4600 },
    { uid: 'user14', name: 'Leo Martin', school: 'Michigan State University', frat: 'Gamma', score: 3900 },
    { uid: 'user15', name: 'Mia Garcia', school: 'Michigan State University', frat: 'Gamma', score: 3200 }
];

// =============================================================================
// TEST FUNCTIONS
// =============================================================================

/**
 * Test getIndividualRankForUser
 */
function testIndividualRank() {
    console.log('\n=== TEST: Individual Rank ===\n');
    
    // Import the function (in real usage, this would be an ES6 import)
    const { getIndividualRankForUser } = window.rivalryStats;
    
    // Test case 1: Top scorer at University of Michigan
    const result1 = getIndividualRankForUser('user7', 'University of Michigan', MOCK_USERS);
    console.log('User7 (Eve, 6000 pts) at U Michigan:', result1);
    // Expected: { rank: 1, totalUsers: 8 }
    
    // Test case 2: Mid-tier scorer
    const result2 = getIndividualRankForUser('user5', 'University of Michigan', MOCK_USERS);
    console.log('User5 (Charlie, 4200 pts) at U Michigan:', result2);
    // Expected: { rank: 5, totalUsers: 8 }
    
    // Test case 3: User at different school
    const result3 = getIndividualRankForUser('user11', 'Ohio State University', MOCK_USERS);
    console.log('User11 (Ivy, 7000 pts) at Ohio State:', result3);
    // Expected: { rank: 1, totalUsers: 4 }
    
    // Test case 4: User not in school (shouldn't happen but test edge case)
    const result4 = getIndividualRankForUser('user999', 'University of Michigan', MOCK_USERS);
    console.log('Non-existent user:', result4);
    // Expected: { rank: null, totalUsers: 8 }
}

/**
 * Test getFratRankForUser
 */
function testFratRank() {
    console.log('\n=== TEST: Frat Rank ===\n');
    
    const { getFratRankForUser } = window.rivalryStats;
    
    // Test case 1: Member of top frat
    const result1 = getFratRankForUser('user7', MOCK_USERS);
    console.log('User7 (Gamma at U Michigan):', result1);
    // Expected: Gamma with totalScore = 9800 (6000+3800), rank: 1
    
    // Test case 2: Member of middle frat
    const result2 = getFratRankForUser('user4', MOCK_USERS);
    console.log('User4 (Beta at U Michigan):', result2);
    // Expected: Beta with totalScore = 11500 (4800+4200+2500), might be rank 2
    
    // Test case 3: Member of bottom frat
    const result3 = getFratRankForUser('user1', MOCK_USERS);
    console.log('User1 (Alpha at U Michigan):', result3);
    // Expected: Alpha with totalScore = 12700 (5000+4500+3200)
    
    // Test case 4: Different school
    const result4 = getFratRankForUser('user11', MOCK_USERS);
    console.log('User11 (Beta at Ohio State):', result4);
    // Expected: Beta with totalScore = 10500 (7000+3500), rank: 1
}

/**
 * Test getTopSeatFratForSchool
 */
function testTopSeatFrat() {
    console.log('\n=== TEST: TopSeat Frat ===\n');
    
    const { getTopSeatFratForSchool } = window.rivalryStats;
    
    // Test case 1: University of Michigan
    const result1 = getTopSeatFratForSchool('University of Michigan', MOCK_USERS);
    console.log('TopSeat at U Michigan:', result1);
    // Expected: Alpha (12700) or Beta (11500) or Gamma (9800) - whichever is highest
    
    // Test case 2: Ohio State University
    const result2 = getTopSeatFratForSchool('Ohio State University', MOCK_USERS);
    console.log('TopSeat at Ohio State:', result2);
    // Expected: Beta (10500) vs Alpha (9500)
    
    // Test case 3: Michigan State University
    const result3 = getTopSeatFratForSchool('Michigan State University', MOCK_USERS);
    console.log('TopSeat at Michigan State:', result3);
    // Expected: Gamma (11700)
    
    // Test case 4: School with no users
    const result4 = getTopSeatFratForSchool('Penn State University', MOCK_USERS);
    console.log('TopSeat at non-existent school:', result4);
    // Expected: null
}

/**
 * Test getAllFratRankingsForSchool
 */
function testAllFratRankings() {
    console.log('\n=== TEST: All Frat Rankings ===\n');
    
    const { getAllFratRankingsForSchool } = window.rivalryStats;
    
    // Test case: Get all frat rankings for University of Michigan
    const result = getAllFratRankingsForSchool('University of Michigan', MOCK_USERS);
    console.log('All frats at U Michigan:', result);
    // Expected: Array of 3 frats sorted by totalScore
}

/**
 * Test getTopIndividualsForSchool
 */
function testTopIndividuals() {
    console.log('\n=== TEST: Top Individuals ===\n');
    
    const { getTopIndividualsForSchool } = window.rivalryStats;
    
    // Test case 1: Top 5 at University of Michigan
    const result1 = getTopIndividualsForSchool('University of Michigan', MOCK_USERS, 5);
    console.log('Top 5 at U Michigan:', result1);
    // Expected: Eve (6000), John (5000), Alice (4800), Jane (4500), Charlie (4200)
    
    // Test case 2: Top 3 at Ohio State
    const result2 = getTopIndividualsForSchool('Ohio State University', MOCK_USERS, 3);
    console.log('Top 3 at Ohio State:', result2);
    // Expected: Ivy (7000), Grace (5500), Henry (4000)
}

/**
 * Run all tests
 */
function runAllTests() {
    console.log('\n╔═══════════════════════════════════════════════════╗');
    console.log('║   RIVALRY STATS AGGREGATION - TEST SUITE          ║');
    console.log('╚═══════════════════════════════════════════════════╝');
    
    testIndividualRank();
    testFratRank();
    testTopSeatFrat();
    testAllFratRankings();
    testTopIndividuals();
    
    console.log('\n✅ All tests complete! Check results above.\n');
}

// =============================================================================
// EXPECTED RESULTS SUMMARY
// =============================================================================

/*
UNIVERSITY OF MICHIGAN BREAKDOWN:
- Alpha: 12,700 total (John 5000, Jane 4500, Bob 3200)
- Beta: 11,500 total (Alice 4800, Charlie 4200, David 2500)
- Gamma: 9,800 total (Eve 6000, Frank 3800)

TopSeat: Alpha (12,700)

Individual Rankings:
1. Eve (Gamma) - 6000
2. John (Alpha) - 5000
3. Alice (Beta) - 4800
4. Jane (Alpha) - 4500
5. Charlie (Beta) - 4200
6. Frank (Gamma) - 3800
7. Bob (Alpha) - 3200
8. David (Beta) - 2500

OHIO STATE UNIVERSITY BREAKDOWN:
- Beta: 10,500 total (Ivy 7000, Jack 3500)
- Alpha: 9,500 total (Grace 5500, Henry 4000)

TopSeat: Beta (10,500)

MICHIGAN STATE UNIVERSITY BREAKDOWN:
- Gamma: 11,700 total (Kelly 4600, Leo 3900, Mia 3200)

TopSeat: Gamma (11,700)
*/

// Export for browser console testing
if (typeof window !== 'undefined') {
    window.rivalryTests = {
        MOCK_USERS,
        runAllTests,
        testIndividualRank,
        testFratRank,
        testTopSeatFrat,
        testAllFratRankings,
        testTopIndividuals
    };
}
