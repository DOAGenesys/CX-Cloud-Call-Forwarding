# Genesys Call Forwarding Settings LWC

A Lightning Web Component (LWC) that provides a user interface for Salesforce users to manage their Genesys Cloud call forwarding settings directly from Salesforce.

## Features

- Enable/disable call forwarding
- Set forwarding phone number in E.164 format
- Real-time validation of phone number format
- Visual feedback for success and error states
- Loading state indicators
- Responsive design following SLDS guidelines

## Prerequisites

Before deploying this component, ensure the following requirements are met:

1. **User Custom Field**
   - The custom field `GC_User_Id__c` must exist on the User object
   - This field must be populated with valid Genesys Cloud user IDs for all users who will use this component

2. **Named Credential**
   - A named credential with the name "GC_Base_API" must be configured in Salesforce
   - This credential should be set up to use OAuth authentication with client credentials flow
   - You can leverage your existing Genesys Cloud OAuth client used for CX Cloud integration
   - The credential must have appropriate permissions to access Genesys Cloud users' call forwarding settings

## Component Structure

```
├── force-app/main/default/lwc/genesysCallForwardingSettings/
│   ├── genesysCallForwardingSettings.html
│   ├── genesysCallForwardingSettings.js
│   ├── genesysCallForwardingSettings.js-meta.xml
│   └── genesysCallForwardingSettings.css
├── force-app/main/default/classes/
│   ├── GCCallForwarding.cls
│   └── GCCallForwardingTest.cls
```

## Installation

1. Deploy all components to your Salesforce org
2. Add the component to the desired Lightning page using the Lightning App Builder
3. Configure user permissions as needed

## Usage

The component provides a simple interface where users can:

1. Toggle call forwarding on/off using a switch
2. Enter a phone number in E.164 format (e.g., +1234567890)
3. Save their settings using the "Save Settings" button

## Troubleshooting

To troubleshoot the component:

1. Open your browser's developer console (F12 in most browsers)
2. Navigate to the Console tab
3. Filter the logs using "genesysCallForwardingSettings"
4. All component operations are logged with detailed information

## Error Handling

The component includes comprehensive error handling for:
- Invalid phone number formats
- API communication errors
- Missing or invalid Genesys Cloud user IDs
- Network connectivity issues

## Testing

A comprehensive test class (GCCallForwardingTest) is included with:
- Mock HTTP callout responses
- Error condition testing
- Edge case handling
- Code coverage exceeding 85%

## Apex Classes

### GCCallForwarding
Handles all communication with the Genesys Cloud API, including:
- Retrieving current call forwarding settings
- Updating call forwarding configuration
- Error handling and response parsing

### GCCallForwardingTest
Provides comprehensive 100% test coverage for all Apex functionality.

## Limitations

- Phone numbers must be in E.164 format
- Call forwarding cannot be configured while the user is on-queue
- Only one forwarding number can be configured at a time

## Security

- The component uses named credentials for secure API authentication
- All API calls are made server-side through Apex
- Input validation is performed both client and server-side

## Troubleshooting

For issues or questions:
1. Check browser console logs using the filter "genesysCallForwardingSettings"
2. Verify all prerequisites are correctly configured
3. Ensure the Genesys Cloud user ID is correctly mapped to the Salesforce user
