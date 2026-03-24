/**
 * Analytics Utility v2.0
 * Handles event-based tracking for the multi-step form.
 * Pushes to window.dataLayer (GTM) and console for debugging.
 */

const analytics = {
    /**
     * Internal Tracker
     */
    _trackEvent: (eventName, params = {}) => {
        const payload = {
            event: eventName,
            timestamp: new Date().toISOString(),
            ...params
        };

        // Push to DataLayer (GTM/GA4)
        if (window.dataLayer) {
            window.dataLayer.push(payload);
        }

        // Development Logging
        console.log(`[Analytics] ${eventName}`, payload);
    },

    /**
     * Initialized when the form loads
     */
    trackFormStarted: (formTitle, trackingRef) => {
        analytics._trackEvent('form_started', { formTitle, trackingRef });
    },

    /**
     * Whenever a step index changes
     */
    trackStepView: (stepIndex, questionText) => {
        analytics._trackEvent('form_step_viewed', { 
            step_number: stepIndex + 1, 
            question_text: questionText || 'Contact Info / Intro'
        });
    },

    /**
     * Whenever an answer is updated (Debounced or on click)
     */
    trackAnswerSelection: (stepIndex, fieldId, value) => {
        // Sanitize sensitive info or long text
        let sanitizedValue = value;
        if (typeof value === 'string' && value.length > 100) {
            sanitizedValue = value.substring(0, 97) + '...';
        }

        analytics._trackEvent('form_answer_selected', {
            step_number: stepIndex + 1,
            field_id: fieldId,
            selected_values: sanitizedValue
        });
    },

    /**
     * Navigation tracking
     */
    trackNavigation: (direction, fromStep) => {
        analytics._trackEvent(direction === 'next' ? 'form_step_completed' : 'form_step_back', {
            from_step: fromStep + 1
        });
    },

    /**
     * Abandonment tracking (via beforeunload)
     */
    trackAbandonment: (currentStep) => {
        analytics._trackEvent('form_abandoned', {
            last_step_reached: currentStep + 1
        });
    },

    /**
     * Final submission
     */
    trackCompletion: (formTitle, successMessage) => {
        analytics._trackEvent('form_completed', {
            formTitle,
            status: 'success',
            message: successMessage
        });
    }
};

export default analytics;
