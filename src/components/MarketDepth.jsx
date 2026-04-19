import React, { useState, useEffect } from 'react';
import marketDepthService from '../services/marketDepth';

const MarketDepth = ({ symbol, maxLevels = 10 }) => {
    const [depth, setDepth] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isSubscribed, setIsSubscribed] = useState(false);

    useEffect(() => {
        if (!symbol) return;
        setIsSubscribed(marketDepthService.isSymbolSubscribed(symbol));
        const existingDepth = marketDepthService.getMarketDepth(symbol);
        if (existingDepth) setDepth(existingDepth);

        const handleUpdate = (event, data) => {
            if (data.symbol === symbol) {
                setDepth(data.depth);
                setLoading(false);
                setError(null);
            }
        };

        const handleError = (event, errorData) => {
            setError(errorData.error);
            setLoading(false);
        };

        marketDepthService.addListener(handleUpdate);
        marketDepthService.addListener(handleError);

        return () => {
            marketDepthService.removeListener(handleUpdate);
            marketDepthService.removeListener(handleError);
        };
    }, [symbol]);

    const handleSubscribe = () => {
        if (!symbol) return;
        setLoading(true);
        setError(null);
        marketDepthService.subscribe(symbol);
        setIsSubscribed(true);
    };

    const handleUnsubscribe = () => {
        if (!symbol) return;
        marketDepthService.unsubscribe(symbol);
        setIsSubscribed(false);
        setDepth(null);
    };

    const formatPrice = (price) => (price / 100).toFixed(2);
    const formatQuantity = (qty) => qty.toLocaleString();

    const getMaxBidQty = () => {
        if (!depth?.bids?.length) return 1;
        return Math.max(...depth.bids.map(bid => bid.qty || 0));
    };

    const getMaxAskQty = () => {
        if (!depth?.asks?.length) return 1;
        return Math.max(...depth.asks.map(ask => ask.qty || 0));
    };

    const getBidBarWidth = (qty) => (qty / getMaxBidQty()) * 100;
    const getAskBarWidth = (qty) => (qty / getMaxAskQty()) * 100;

    if (!symbol) {
        return (
            <div className="md-container p-4 text-center">
                <h5 className="text-secondary">Market Depth</h5>
                <p className="text-muted small">Select a symbol to view market depth</p>
            </div>
        );
    }

    return (
        <div className="md-container fade-in">
            <div className="md-header d-flex justify-content-between align-items-center p-3 border-bottom border-thin">
                <h6 className="m-0 fw-bold text-info-custom">Market Depth - {symbol}</h6>
                <button 
                    className={`btn btn-sm ${!isSubscribed ? 'btn-outline-info' : 'btn-outline-secondary'}`}
                    onClick={isSubscribed ? handleUnsubscribe : handleSubscribe}
                    disabled={loading}
                >
                    {loading ? '...' : (isSubscribed ? 'Unsubscribe' : 'Subscribe')}
                </button>
            </div>

            {error && <div className="alert alert-danger m-2 py-1 small">Error: {error}</div>}

            {depth ? (
                <div className="md-content">
                    {/* Depth Table Header */}
                    <div className="d-flex text-center border-bottom border-thin bg-black-subtle py-2 small fw-bold text-secondary">
                        <div className="flex-fill border-end border-thin">BIDS (BUY)</div>
                        <div className="flex-fill">ASKS (SELL)</div>
                    </div>

                    <div className="d-flex md-body">
                        {/* Bids List */}
                        <div className="flex-fill border-end border-thin position-relative">
                            {depth.bids?.slice(0, maxLevels).map((bid, index) => (
                                <div key={`bid-${index}`} className="md-row d-flex justify-content-between px-2 py-1 small position-relative">
                                    <div className="bid-bar" style={{ width: `${getBidBarWidth(bid.qty)}%` }}></div>
                                    <span className="z-1">{formatQuantity(bid.qty || 0)}</span>
                                    <span className="text-success-custom fw-bold z-1">{formatPrice(bid.price || 0)}</span>
                                </div>
                            ))}
                        </div>

                        {/* Asks List */}
                        <div className="flex-fill position-relative">
                            {depth.asks?.slice(0, maxLevels).map((ask, index) => (
                                <div key={`ask-${index}`} className="md-row d-flex justify-content-between px-2 py-1 small position-relative">
                                    <div className="ask-bar" style={{ width: `${getAskBarWidth(ask.qty)}%` }}></div>
                                    <span className="text-danger-custom fw-bold z-1">{formatPrice(ask.price || 0)}</span>
                                    <span className="z-1">{formatQuantity(ask.qty || 0)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Summary Footer */}
                    <div className="md-footer p-2 border-top border-thin bg-black-subtle d-flex justify-content-between small text-secondary">
                        <div>Total Bid: <span className="text-main">{formatQuantity(depth.tbq || 0)}</span></div>
                        <div>Total Ask: <span className="text-main">{formatQuantity(depth.tsq || 0)}</span></div>
                    </div>
                </div>
            ) : (
                <div className="p-5 text-center text-muted small">
                    {loading ? 'Fetching real-time data...' : 'No data available. Click Subscribe.'}
                </div>
            )}

            <style>{`
                .md-container {
                    background-color: var(--bg-dark);
                    border: 1px solid var(--border);
                    border-radius: 8px;
                    overflow: hidden;
                    color: var(--text-main);
                }

                .bg-black-subtle { background-color: var(--bg-black); }
                .text-info-custom { color: var(--accent) !important; }
                .text-success-custom { color: var(--success) !important; }
                .text-danger-custom { color: var(--danger) !important; }
                .text-main { color: var(--text-main); }
                .border-thin { border-color: var(--border) !important; }

                .md-row { border-bottom: 1px solid rgba(128, 128, 128, 0.05); }
                .z-1 { z-index: 1; }

                /* Visualization Bars */
                .bid-bar {
                    position: absolute; right: 0; top: 0; bottom: 0;
                    background-color: rgba(46, 189, 133, 0.15); /* Greenish opacity */
                    transition: width 0.3s ease;
                }

                .ask-bar {
                    position: absolute; left: 0; top: 0; bottom: 0;
                    background-color: rgba(246, 70, 93, 0.15); /* Reddish opacity */
                    transition: width 0.3s ease;
                }

                [data-theme='light'] .bid-bar { background-color: rgba(46, 189, 133, 0.1); }
                [data-theme='light'] .ask-bar { background-color: rgba(246, 70, 93, 0.1); }
            `}</style>
        </div>
    );
};

export default MarketDepth;