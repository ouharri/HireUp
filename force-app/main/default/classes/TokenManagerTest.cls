@isTest
private class TokenManagerTest {

    static testMethod void testGenerateToken() {
        // Test generateToken method with valid input
        Id leadId = '00Q1t0000012345EAA';
        Id quizId = 'a0R1t0000012345EAB';
        String expectedToken = '6f006d00610072002d0061003000520031007400300030003000310032003300340035004500410041002d00610030005200310074003000300030003100320033003400350045004200';
        String actualToken = TokenManager.generateToken(leadId, quizId);
        System.assertEquals(expectedToken, actualToken);
        
        // Test generateToken method with null input
        String nullToken = TokenManager.generateToken(null, null);
        System.assertEquals(null, nullToken);
    }

    static testMethod void testGetIdsFromToken() {
        // Test getIdsFromToken method with valid input
        String encryptedToken = '6f006d00610072002d0061003000520031007400300030003000310032003300340035004500410041002d00610030005200310074003000300030003100320033003400350045004200';
        Map<String, Id> expectedIdsMap = new Map<String, Id>();
        expectedIdsMap.put('LeadId', '00Q1t0000012345EAA');
        expectedIdsMap.put('QuizId', 'a0R1t0000012345EAB');
        Map<String, Id> actualIdsMap = TokenManager.getIdsFromToken(encryptedToken);
        System.assertEquals(expectedIdsMap, actualIdsMap);
        
        // Test getIdsFromToken method with invalid input
        String invalidToken = 'invalid_token';
        Map<String, Id> nullIdsMap = TokenManager.getIdsFromToken(invalidToken);
        System.assertEquals(new Map<String, Id>(), nullIdsMap);
    }

    static testMethod void testValidateToken() {
        // Test validateToken method with valid token
        String encryptedToken = '6f006d00610072002d0061003000520031007400300030003000310032003300340035004500410041002d00610030005200310074003000300030003100320033003400350045004200';
        Boolean isValid = TokenManager.validateToken(encryptedToken);
        System.assertEquals(true, isValid);

        // Test validateToken method with invalid token
        String invalidToken = 'invalid_token';
        Boolean isInvalid = TokenManager.validateToken(invalidToken);
        System.assertEquals(false, isInvalid);
    }
}