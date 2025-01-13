@IsTest
private class GCCallForwardingTest {
    // Test data setup
    private static final String TEST_USER_ID = '12345';
    private static final String TEST_PHONE = '+1234567890';
    private static User testUser;
    
    @TestSetup
    static void setupTestData() {
        // Create test user with GC User Id
        // Using a unique username to avoid conflicts
        String uniqueUsername = 'testuser' + System.currentTimeMillis() + '@testorg.com';
        
        Profile p = [SELECT Id FROM Profile WHERE Name = 'Standard User' LIMIT 1];
        testUser = new User(
            Username = uniqueUsername,
            Alias = 'tuser',
            Email = uniqueUsername,
            FirstName = 'Test',
            LastName = 'User',
            ProfileId = p.Id,
            EmailEncodingKey = 'UTF-8',
            LanguageLocaleKey = 'en_US',
            LocaleSidKey = 'en_US',
            TimeZoneSidKey = 'America/Los_Angeles',
            GC_User_Id__c = TEST_USER_ID
        );
        insert testUser;
    }

    private static User getTestUser() {
        return [SELECT Id, GC_User_Id__c FROM User 
                WHERE Email LIKE 'testuser%@testorg.com' 
                LIMIT 1];
    }

    @IsTest
    static void testGetCurrentUserGCId() {
        User testUser = getTestUser();
        
        Test.startTest();
        System.runAs(testUser) {
            String gcUserId = GCCallForwarding.getCurrentUserGCId();
            System.assertEquals(TEST_USER_ID, gcUserId, 'Should return correct GC User ID');
        }
        Test.stopTest();
    }

    @IsTest
    static void testGetCallForwarding_Success() {
        // Mock successful response
        Test.setMock(HttpCalloutMock.class, new MockCallForwardingResponse(
            200,
            'OK',
            '{"id":"12345",' +
            '"user":{"id":"12345","selfUri":"/api/v2/users/12345"},' +
            '"enabled":true,' +
            '"calls":[{"targets":[{"type":"PHONENUMBER","value":"+1234567890"}]}],' +
            '"selfUri":"/api/v2/users/12345/callforwarding"}'
        ));

        Test.startTest();
        GCCallForwarding.CallForwardingResponse result = GCCallForwarding.getCallForwarding(TEST_USER_ID);
        Test.stopTest();

        // Verify response
        System.assertNotEquals(null, result, 'Result should not be null');
        System.assertEquals(TEST_USER_ID, result.id, 'Expected matching ID');
        System.assertEquals(true, result.enabled, 'Enabled should be true');
        System.assertEquals(TEST_USER_ID, result.user.id, 'User ID should match');
        System.assertEquals(1, result.calls.size(), 'Should have one call configuration');
        System.assertEquals('PHONENUMBER', result.calls[0].targets[0].type, 'Target type should be PHONENUMBER');
        System.assertEquals(TEST_PHONE, result.calls[0].targets[0].value, 'Phone number should match');
    }

    @IsTest
    static void testGetCallForwarding_BlankUserId() {
        Test.startTest();
        try {
            GCCallForwarding.getCallForwarding('');
            System.assert(false, 'Should throw exception for blank user ID');
        } catch (GCCallForwarding.CallForwardingException e) {
            System.assertEquals('User ID cannot be blank', e.getMessage(), 'Expected blank user ID error message');
        }
        Test.stopTest();
    }

    @IsTest
    static void testGetCallForwarding_HTTPError() {
        Test.setMock(HttpCalloutMock.class, new MockCallForwardingResponse(
            500,
            'Internal Server Error',
            '{"message":"Internal server error"}'
        ));

        Test.startTest();
        try {
            GCCallForwarding.getCallForwarding(TEST_USER_ID);
            System.assert(false, 'Should throw exception for HTTP error');
        } catch (GCCallForwarding.CallForwardingException e) {
            System.assert(e.getMessage().contains('Failed to retrieve call forwarding settings'), 
                'Should contain error message');
        }
        Test.stopTest();
    }

    @IsTest
    static void testGetCallForwarding_InvalidJSON() {
        Test.setMock(HttpCalloutMock.class, new MockCallForwardingResponse(
            200,
            'OK',
            'Invalid JSON Response'
        ));

        Test.startTest();
        try {
            GCCallForwarding.getCallForwarding(TEST_USER_ID);
            System.assert(false, 'Should throw exception for invalid JSON');
        } catch (GCCallForwarding.CallForwardingException e) {
            System.assert(e.getMessage().contains('Failed to parse API response'), 
                'Should contain parsing error message');
        }
        Test.stopTest();
    }

    @IsTest
    static void testSetCallForwarding_Success() {
        Test.setMock(HttpCalloutMock.class, new MockCallForwardingResponse(
            200,
            'OK',
            '{"id":"12345",' +
            '"user":{"id":"12345","selfUri":"/api/v2/users/12345"},' +
            '"enabled":true,' +
            '"calls":[{"targets":[{"type":"PHONENUMBER","value":"+1234567890"}]}],' +
            '"selfUri":"/api/v2/users/12345/callforwarding"}'
        ));

        GCCallForwarding.CallForwardingConfig config = new GCCallForwarding.CallForwardingConfig();
        config.enabled = true;
        config.phoneNumber = TEST_PHONE;

        Test.startTest();
        GCCallForwarding.CallForwardingResponse result = 
            GCCallForwarding.setCallForwarding(TEST_USER_ID, config);
        Test.stopTest();

        System.assertNotEquals(null, result, 'Result should not be null');
        System.assertEquals(TEST_USER_ID, result.id, 'Expected matching ID');
        System.assertEquals(true, result.enabled, 'Enabled should be true');
        System.assertEquals(1, result.calls.size(), 'Should have one call configuration');
        System.assertEquals('PHONENUMBER', result.calls[0].targets[0].type, 'Target type should be PHONENUMBER');
        System.assertEquals(TEST_PHONE, result.calls[0].targets[0].value, 'Phone number should match');
    }

    @IsTest
    static void testSetCallForwarding_BlankUserId() {
        GCCallForwarding.CallForwardingConfig config = new GCCallForwarding.CallForwardingConfig();
        config.enabled = true;
        config.phoneNumber = TEST_PHONE;

        Test.startTest();
        try {
            GCCallForwarding.setCallForwarding('', config);
            System.assert(false, 'Should throw exception for blank user ID');
        } catch (GCCallForwarding.CallForwardingException e) {
            System.assertEquals('User ID cannot be blank', e.getMessage(), 'Expected blank user ID error message');
        }
        Test.stopTest();
    }

    @IsTest
    static void testSetCallForwarding_NullConfig() {
        Test.startTest();
        try {
            GCCallForwarding.setCallForwarding(TEST_USER_ID, null);
            System.assert(false, 'Should throw exception for null config');
        } catch (GCCallForwarding.CallForwardingException e) {
            System.assertEquals('Configuration cannot be null', e.getMessage(), 'Expected null config error message');
        }
        Test.stopTest();
    }
    
    @IsTest
    static void testGetCallForwarding_HTTPRequestException() {
        // Create a mock that throws an exception
        Test.setMock(HttpCalloutMock.class, new MockHttpCalloutException());
        
        Test.startTest();
        try {
            GCCallForwarding.getCallForwarding(TEST_USER_ID);
            System.assert(false, 'Should throw exception for HTTP request failure');
        } catch (GCCallForwarding.CallForwardingException e) {
            System.assert(e.getMessage().startsWith('HTTP request failed:'), 
                'Should contain HTTP request failed message');
        }
        Test.stopTest();
    }
    
    @IsTest
    static void testSetCallForwarding_HTTPRequestException() {
        Test.setMock(HttpCalloutMock.class, new MockHttpCalloutException());
        
        GCCallForwarding.CallForwardingConfig config = new GCCallForwarding.CallForwardingConfig();
        config.enabled = true;
        config.phoneNumber = TEST_PHONE;
        
        Test.startTest();
        try {
            GCCallForwarding.setCallForwarding(TEST_USER_ID, config);
            System.assert(false, 'Should throw exception for HTTP request failure');
        } catch (GCCallForwarding.CallForwardingException e) {
            System.assert(e.getMessage().startsWith('HTTP request failed:'), 
                'Should contain HTTP request failed message');
        }
        Test.stopTest();
    }    

    @IsTest
    static void testSetCallForwarding_MissingPhoneNumber() {
        GCCallForwarding.CallForwardingConfig config = new GCCallForwarding.CallForwardingConfig();
        config.enabled = true;
        config.phoneNumber = '';

        Test.startTest();
        try {
            GCCallForwarding.setCallForwarding(TEST_USER_ID, config);
            System.assert(false, 'Should throw exception for missing phone number');
        } catch (GCCallForwarding.CallForwardingException e) {
            System.assertEquals('Phone number is required when call forwarding is enabled', 
                e.getMessage(), 'Expected missing phone number error message');
        }
        Test.stopTest();
    }

    @IsTest
    static void testSetCallForwarding_HTTPError() {
        Test.setMock(HttpCalloutMock.class, new MockCallForwardingResponse(
            500,
            'Internal Server Error',
            '{"message":"Internal server error"}'
        ));

        GCCallForwarding.CallForwardingConfig config = new GCCallForwarding.CallForwardingConfig();
        config.enabled = true;
        config.phoneNumber = TEST_PHONE;

        Test.startTest();
        try {
            GCCallForwarding.setCallForwarding(TEST_USER_ID, config);
            System.assert(false, 'Should throw exception for HTTP error');
        } catch (GCCallForwarding.CallForwardingException e) {
            System.assert(e.getMessage().contains('Failed to update call forwarding settings'), 
                'Should contain error message');
        }
        Test.stopTest();
    }

    @IsTest
    static void testSetCallForwarding_InvalidJSON() {
        Test.setMock(HttpCalloutMock.class, new MockCallForwardingResponse(
            200,
            'OK',
            'Invalid JSON Response'
        ));

        GCCallForwarding.CallForwardingConfig config = new GCCallForwarding.CallForwardingConfig();
        config.enabled = true;
        config.phoneNumber = TEST_PHONE;

        Test.startTest();
        try {
            GCCallForwarding.setCallForwarding(TEST_USER_ID, config);
            System.assert(false, 'Should throw exception for invalid JSON');
        } catch (GCCallForwarding.CallForwardingException e) {
            System.assert(e.getMessage().contains('Failed to parse API response'), 
                'Should contain parsing error message');
        }
        Test.stopTest();
    }
    
    @IsTest
    static void testResponseSelfUri() {
        Test.setMock(HttpCalloutMock.class, new MockCallForwardingResponse(
            200,
            'OK',
            '{"id":"12345",' +
            '"user":{"id":"12345","selfUri":"/api/v2/users/12345"},' +
            '"enabled":true,' +
            '"calls":[{"targets":[{"type":"PHONENUMBER","value":"+1234567890"}]}],' +
            '"selfUri":"/api/v2/users/12345/callforwarding"}'
        ));

        Test.startTest();
        GCCallForwarding.CallForwardingResponse getResult = 
            GCCallForwarding.getCallForwarding(TEST_USER_ID);
        
        System.assertEquals('/api/v2/users/12345/callforwarding', getResult.selfUri, 
            'Response selfUri should match');
        System.assertEquals('/api/v2/users/12345', getResult.user.selfUri, 
            'User selfUri should match');

        GCCallForwarding.CallForwardingConfig config = new GCCallForwarding.CallForwardingConfig();
        config.enabled = true;
        config.phoneNumber = TEST_PHONE;
        
        GCCallForwarding.CallForwardingResponse setResult = 
            GCCallForwarding.setCallForwarding(TEST_USER_ID, config);
        
        System.assertEquals('/api/v2/users/12345/callforwarding', setResult.selfUri, 
            'Response selfUri should match');
        System.assertEquals('/api/v2/users/12345', setResult.user.selfUri, 
            'User selfUri should match');
        Test.stopTest();
    }    

    // Mock class for HTTP callouts
    private class MockCallForwardingResponse implements HttpCalloutMock {
        private Integer mockStatusCode;
        private String mockStatus;
        private String mockBody;

        public MockCallForwardingResponse(Integer statusCode, String status, String body) {
            this.mockStatusCode = statusCode;
            this.mockStatus = status;
            this.mockBody = body;
        }

        public HTTPResponse respond(HTTPRequest request) {
            HttpResponse res = new HttpResponse();
            res.setStatusCode(mockStatusCode);
            res.setStatus(mockStatus);
            res.setBody(mockBody);
            return res;
        }
    }
    
    private class MockHttpCalloutException extends Exception implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest request) {
            throw new CalloutException('Simulated HTTP request failure');
        }    
    }         
}
