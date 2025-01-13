public with sharing class GCCallForwarding {
    private static final String DEBUG_HEADER = 'GCCallForwarding: ';

    public class CallForwardingConfig {
        @AuraEnabled
        public Boolean enabled { get; set; }
        @AuraEnabled
        public String phoneNumber { get; set; }
    }

    public class CallForwardingResponse {
        @AuraEnabled
        public String id { get; set; }
        @AuraEnabled
        public GCUserInfo user { get; set; }
        @AuraEnabled
        public Boolean enabled { get; set; }
        @AuraEnabled
        public List<CallInfo> calls { get; set; }
        @AuraEnabled
        public String selfUri { get; set; }
    }

    public class GCUserInfo {
        @AuraEnabled
        public String id { get; set; }
        @AuraEnabled
        public String selfUri { get; set; }
    }

    public class CallInfo {
        @AuraEnabled
        public List<TargetInfo> targets { get; set; }
    }

    public class TargetInfo {
        @AuraEnabled
        public String type { get; set; }
        @AuraEnabled
        public String value { get; set; }
    }

    @AuraEnabled
    public static String getCurrentUserGCId() {
        String userId = UserInfo.getUserId();
        User currentUser = [SELECT GC_User_Id__c FROM User WHERE Id = :userId LIMIT 1];
        return currentUser.GC_User_Id__c;
    }

    public class CallForwardingException extends Exception {}

    @AuraEnabled
    public static CallForwardingResponse getCallForwarding(String userId) {
        System.debug(DEBUG_HEADER + 'Entering getCallForwarding for userId: ' + userId);

        if (String.isBlank(userId)) {
            throw new CallForwardingException('User ID cannot be blank');
        }

        HttpRequest req = new HttpRequest();
        req.setEndpoint('callout:GC_Base_API/api/v2/users/' + userId + '/callforwarding');
        req.setMethod('GET');
        req.setHeader('Content-Type', 'application/json');

        Http http = new Http();
        HttpResponse res;

        try {
            res = http.send(req);
        } catch (Exception e) {
            throw new CallForwardingException('HTTP request failed: ' + e.getMessage());
        }

        System.debug(DEBUG_HEADER + 'Response Code: ' + res.getStatusCode());
        System.debug(DEBUG_HEADER + 'Response Status: ' + res.getStatus());
        System.debug(DEBUG_HEADER + 'Response Body: ' + res.getBody());

        if (res.getStatusCode() == 200) {
            try {
                CallForwardingResponse response = (CallForwardingResponse)JSON.deserialize(
                    res.getBody(),
                    CallForwardingResponse.class
                );
                return response;
            } catch (Exception e) {
                throw new CallForwardingException('Failed to parse API response: ' + e.getMessage());
            }
        } else {
            throw new CallForwardingException(
                'Failed to retrieve call forwarding settings. Status: ' +
                res.getStatusCode() + ', Body: ' + res.getBody()
            );
        }
    }

    @AuraEnabled
    public static CallForwardingResponse setCallForwarding(String userId, CallForwardingConfig config) {
        System.debug(DEBUG_HEADER + 'Entering setCallForwarding for userId: ' + userId);

        // Validate input
        if (String.isBlank(userId)) {
            throw new CallForwardingException('User ID cannot be blank');
        }
        if (config == null) {
            throw new CallForwardingException('Configuration cannot be null');
        }
        if (config.enabled && String.isBlank(config.phoneNumber)) {
            throw new CallForwardingException('Phone number is required when call forwarding is enabled');
        }

        // Build request body
        Map<String, Object> requestBody = new Map<String, Object>();
        requestBody.put('enabled', config.enabled);

        List<Map<String, Object>> calls = new List<Map<String, Object>>();
        if (config.enabled) {
            Map<String, Object> callConfig = new Map<String, Object>();

            List<Map<String, String>> targets = new List<Map<String, String>>();
            Map<String, String> target = new Map<String, String>();
            target.put('type', 'PHONENUMBER');
            target.put('value', config.phoneNumber);
            targets.add(target);

            callConfig.put('targets', targets);
            calls.add(callConfig);
        }

        requestBody.put('calls', calls);

        HttpRequest req = new HttpRequest();
        req.setEndpoint('callout:GC_Base_API/api/v2/users/' + userId + '/callforwarding');
        req.setMethod('PUT');
        req.setHeader('Content-Type', 'application/json');
        req.setBody(JSON.serialize(requestBody));

        System.debug(DEBUG_HEADER + 'Request Body: ' + req.getBody());

        Http http = new Http();
        HttpResponse res;

        try {
            res = http.send(req);
        } catch (Exception e) {
            throw new CallForwardingException('HTTP request failed: ' + e.getMessage());
        }

        System.debug(DEBUG_HEADER + 'Response Code: ' + res.getStatusCode());
        System.debug(DEBUG_HEADER + 'Response Status: ' + res.getStatus());
        System.debug(DEBUG_HEADER + 'Response Body: ' + res.getBody());

        if (res.getStatusCode() == 200) {
            try {
                CallForwardingResponse response = (CallForwardingResponse)JSON.deserialize(
                    res.getBody(),
                    CallForwardingResponse.class
                );
                return response;
            } catch (Exception e) {
                throw new CallForwardingException('Failed to parse API response: ' + e.getMessage());
            }
        } else {
            throw new CallForwardingException(
                'Failed to update call forwarding settings. Status: ' + 
                res.getStatusCode() + ', Body: ' + res.getBody()
            );
        }
    }
}
