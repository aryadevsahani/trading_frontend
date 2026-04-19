import socket from './socket';

class MarketDepthService {
    constructor() {
        this.marketDepth = new Map();
        this.listeners = new Set();
        this.isSubscribed = new Map();

        // Listen for socket events
        this.setupSocketListeners();
    }

    setupSocketListeners() {
        // Listen for custom events dispatched from socket.js
        window.addEventListener('marketDepthUpdate', (event) => {
            const { symbol, depth, snapshot } = event.detail;
            this.updateMarketDepth(symbol, depth, snapshot);
        });

        window.addEventListener('marketDepthError', (event) => {
            console.error('Market depth error:', event.detail);
            this.notifyListeners('error', event.detail);
        });

        window.addEventListener('marketDepthData', (event) => {
            const { symbol, depth } = event.detail;
            this.updateMarketDepth(symbol, depth, true);
        });
    }

    updateMarketDepth(symbol, depth, isSnapshot) {
        this.marketDepth.set(symbol, {
            ...depth,
            lastUpdate: Date.now(),
            isSnapshot
        });

        this.notifyListeners('update', { symbol, depth, isSnapshot });
    }

    subscribe(symbols, channel = '1') {
        if (!Array.isArray(symbols)) {
            symbols = [symbols];
        }

        // Track subscription
        symbols.forEach(symbol => {
            this.isSubscribed.set(symbol, { channel, timestamp: Date.now() });
        });

        socket.emit('subscribe-market-depth', { symbols, channel });
        console.log(`📡 Subscribed to market depth for: ${symbols.join(', ')}`);
    }

    unsubscribe(symbols, channel = '1') {
        if (!Array.isArray(symbols)) {
            symbols = [symbols];
        }

        // Remove subscription tracking
        symbols.forEach(symbol => {
            this.isSubscribed.delete(symbol);
        });

        socket.emit('unsubscribe-market-depth', { symbols, channel });
        console.log(`📡 Unsubscribed from market depth for: ${symbols.join(', ')}`);
    }

    switchChannel(resumeChannels = [], pauseChannels = []) {
        socket.emit('switch-market-depth-channel', { resumeChannels, pauseChannels });
        console.log(`📡 Switched channels - Resume: ${resumeChannels}, Pause: ${pauseChannels}`);
    }

    getMarketDepth(symbol) {
        return this.marketDepth.get(symbol) || null;
    }

    getAllMarketDepth() {
        return Object.fromEntries(this.marketDepth);
    }

    isSymbolSubscribed(symbol) {
        return this.isSubscribed.has(symbol);
    }

    getSubscribedSymbols() {
        return Array.from(this.isSubscribed.keys());
    }

    // Request market depth data for a symbol (HTTP fallback)
    async fetchMarketDepth(symbol) {
        try {
            socket.emit('get-market-depth', symbol);
        } catch (error) {
            console.error('Failed to request market depth:', error);
        }
    }

    // Event listener management
    addListener(callback) {
        this.listeners.add(callback);
    }

    removeListener(callback) {
        this.listeners.delete(callback);
    }

    notifyListeners(event, data) {
        this.listeners.forEach(callback => {
            try {
                callback(event, data);
            } catch (error) {
                console.error('Error in market depth listener:', error);
            }
        });
    }

    // Cleanup
    destroy() {
        window.removeEventListener('marketDepthUpdate', this.handleDepthUpdate);
        window.removeEventListener('marketDepthError', this.handleDepthError);
        window.removeEventListener('marketDepthData', this.handleDepthData);
        this.listeners.clear();
        this.marketDepth.clear();
        this.isSubscribed.clear();
    }
}

// Create singleton instance
const marketDepthService = new MarketDepthService();

export default marketDepthService;