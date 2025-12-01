/**
 * Rate Limiter for Gemini API
 * Free Tier Limits: 15 requests per minute (RPM)
 */
class RateLimiter {
    constructor(maxRequestsPerMinute = 15) {
        this.maxRequests = maxRequestsPerMinute;
        this.requests = []; // Array of timestamps
        this.queue = []; // Queue for pending requests
    }

    /**
     * Clean up old requests outside the current minute window
     */
    cleanOldRequests() {
        const oneMinuteAgo = Date.now() - 60000;
        this.requests = this.requests.filter(timestamp => timestamp > oneMinuteAgo);
    }

    /**
     * Check if we can make a request now
     */
    canMakeRequest() {
        this.cleanOldRequests();
        return this.requests.length < this.maxRequests;
    }

    /**
     * Get seconds to wait before next request is available
     */
    getWaitTime() {
        if (this.canMakeRequest()) return 0;

        this.cleanOldRequests();
        if (this.requests.length === 0) return 0;

        // Calculate when the oldest request will expire
        const oldestRequest = Math.min(...this.requests);
        const waitMs = (oldestRequest + 60000) - Date.now();
        return Math.ceil(waitMs / 1000);
    }

    /**
     * Record a request
     */
    recordRequest() {
        this.requests.push(Date.now());
    }

    /**
     * Wait until we can make a request, then execute it
     */
    async executeWithRateLimit(fn) {
        const waitTime = this.getWaitTime();

        if (waitTime > 0) {
            console.log(`⏳ Rate limit reached. Waiting ${waitTime} seconds...`);
            await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
        }

        this.recordRequest();
        return await fn();
    }

    /**
     * Get current usage stats
     */
    getStats() {
        this.cleanOldRequests();
        return {
            requestsInLastMinute: this.requests.length,
            remainingRequests: this.maxRequests - this.requests.length,
            canMakeRequest: this.canMakeRequest(),
            waitTimeSeconds: this.getWaitTime()
        };
    }
}

// Export singleton instance
const rateLimiter = new RateLimiter(15);

export default rateLimiter;
