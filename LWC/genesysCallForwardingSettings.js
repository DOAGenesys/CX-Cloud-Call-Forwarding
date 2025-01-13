import { LightningElement, track } from 'lwc';
import getCurrentUserGCId from '@salesforce/apex/GCCallForwarding.getCurrentUserGCId';
import getCallForwarding from '@salesforce/apex/GCCallForwarding.getCallForwarding';
import setCallForwarding from '@salesforce/apex/GCCallForwarding.setCallForwarding';

export default class GenesysCallForwardingSettings extends LightningElement {
    @track settings = {
        enabled: false,
        phoneNumber: ''
    };
    @track error = null;
    @track isLoading = false;
    @track showSuccessToast = false;
    gcUserId;

    // Fetch GC User ID and load current call forwarding config
    async connectedCallback() {
        console.log('genesysCallForwardingSettings.js - Component connected, fetching GC User ID');
        try {
            this.gcUserId = await getCurrentUserGCId();
            console.log('genesysCallForwardingSettings.js - Successfully retrieved GC User ID:', this.gcUserId);
            this.error = null;

            console.log('genesysCallForwardingSettings.js - Fetching current call forwarding config');
            const currentConfig = await getCallForwarding({ userId: this.gcUserId });
            console.log('genesysCallForwardingSettings.js - Successfully fetched current config:', currentConfig);

            this.settings.enabled = currentConfig.enabled;

            // If calls array has at least one target, set phoneNumber
            if (
                currentConfig.calls &&
                currentConfig.calls.length > 0 &&
                currentConfig.calls[0].targets &&
                currentConfig.calls[0].targets.length > 0
            ) {
                this.settings.phoneNumber = currentConfig.calls[0].targets[0].value || '';
            } else {
                this.settings.phoneNumber = '';
            }
        } catch (error) {
            let errorMessage = 'Unknown error';
            if (error.body && error.body.message) {
                errorMessage = error.body.message;
            } else if (error.message) {
                errorMessage = error.message;
            }
            console.error('genesysCallForwardingSettings.js - Error retrieving GC User ID or current CF config:', errorMessage);
            this.error = 'Error loading user data: ' + errorMessage;
            this.gcUserId = null;
        }
    }

    // Disables phone number field if call forwarding is not enabled
    get isForwardingDisabled() {
        return !this.settings.enabled;
    }

    // Determines whether the Save button is disabled
    get isButtonDisabled() {
        let finalState = false;
        if (this.isLoading) {
            finalState = true;
        } else if (this.settings.enabled) {
            if (!this.settings.phoneNumber || !this.validatePhoneNumber(this.settings.phoneNumber)) {
                finalState = true;
            }
        }
        console.log('genesysCallForwardingSettings.js - Save button disabled state:', JSON.stringify({
            enabled: this.settings.enabled,
            hasPhoneNumber: Boolean(this.settings.phoneNumber),
            isLoading: this.isLoading,
            isPhoneNumberValid: this.validatePhoneNumber(this.settings.phoneNumber),
            finalState: finalState
        }));
        return finalState;
    }

    // Toggle changed
    handleToggleChange(event) {
        console.log('genesysCallForwardingSettings.js - Call forwarding toggle changed:', event.target.checked);
        this.settings = { ...this.settings, enabled: event.target.checked };
    }

    // Forward-to phone number changed
    handleInputChange(event) {
        const { name, value } = event.target;
        console.log('genesysCallForwardingSettings.js - Input changed:', { field: name, value: value });
        this.settings = { ...this.settings, [name]: value };
    }

    // Validate phone number in E.164 format
    validatePhoneNumber(phone) {
        const isValid = /^\+[1-9]\d{1,14}$/.test(phone);
        console.log('genesysCallForwardingSettings.js - Phone number validation:', {
            number: phone,
            isValid: isValid
        });
        return isValid;
    }

    clearError() {
        console.log('genesysCallForwardingSettings.js - Clearing error state');
        this.error = null;
    }

    clearSuccessToast() {
        console.log('genesysCallForwardingSettings.js - Clearing success toast');
        this.showSuccessToast = false;
    }

    // Save changes
    async handleSave() {
        console.log('genesysCallForwardingSettings.js - Save operation started', JSON.stringify({
            gcUserId: this.gcUserId,
            settings: this.settings
        }));

        if (!this.gcUserId) {
            console.error('genesysCallForwardingSettings.js - Save failed: GC User ID not found');
            this.error = 'Genesys Cloud User ID not found';
            return;
        }

        if (this.settings.enabled && !this.validatePhoneNumber(this.settings.phoneNumber)) {
            console.error('genesysCallForwardingSettings.js - Save failed: Invalid phone number format', {
                phoneNumber: this.settings.phoneNumber
            });
            this.error = 'Please enter a valid phone number in E.164 format';
            return;
        }

        this.isLoading = true;
        this.error = null;

        try {
            console.log('genesysCallForwardingSettings.js - Making API call to update call forwarding settings');
            const response = await setCallForwarding({
                userId: this.gcUserId,
                config: {
                    enabled: this.settings.enabled,
                    phoneNumber: this.settings.phoneNumber
                }
            });
            console.log('genesysCallForwardingSettings.js - Successfully updated call forwarding settings', response);

            this.showSuccessToast = true;
            setTimeout(() => {
                console.log('genesysCallForwardingSettings.js - Auto-closing success toast');
                this.showSuccessToast = false;
            }, 3000);
        } catch (error) {
            let errorMessage = '';
            if (error.body && error.body.message) {
                errorMessage = error.body.message;
            } else if (error.message) {
                errorMessage = error.message;
            } else {
                errorMessage = 'Unknown error';
            }
            console.error('genesysCallForwardingSettings.js - Error updating call forwarding settings:', JSON.stringify({
                error: errorMessage,
                fullError: error
            }));
            this.error = errorMessage;
        } finally {
            console.log('genesysCallForwardingSettings.js - Save operation completed');
            this.isLoading = false;
        }
    }
}
