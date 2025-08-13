// authService.js
class AuthService {
    constructor() {
        this.isRefreshing = false;
        this.queue = [];
    }

    async refreshToken() {
        if (this.isRefreshing) {
            return new Promise((resolve) => {
                this.queue.push(resolve);
            });
        }

        this.isRefreshing = true;
        try {
            const response = await fetch('/api/auth/token/refresh/', {
                method: 'POST',
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Token refresh failed');
            }

            const data = await response.json();
            localStorage.setItem('accessToken', data.access);
            
            // Resolve all queued requests
            this.queue.forEach(resolve => resolve(data.access));
            this.queue = [];
            
            return data.access;
        } catch (error) {
            console.error('Token refresh error:', error);
            this.queue = [];
            throw error;
        } finally {
            this.isRefreshing = false;
        }
    }

    async makeAuthenticatedRequest(url, options = {}) {
        // Initial request
        let response = await fetch(url, {
            ...options,
            headers: {
                ...options.headers,
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            },
            credentials: 'include'
        });

        // If token expired, try refreshing
        if (response.status === 401) {
            try {
                const newToken = await this.refreshToken();
                if (newToken) {
                    // Retry with new token
                    response = await fetch(url, {
                        ...options,
                        headers: {
                            ...options.headers,
                            'Authorization': `Bearer ${newToken}`
                        },
                        credentials: 'include'
                    });
                }
            } catch (error) {
                // Refresh failed - don't logout, just reject
                console.error('Authentication failed:', error);
                throw error;
            }
        }

        return response;
    }
}

export const authService = new AuthService();