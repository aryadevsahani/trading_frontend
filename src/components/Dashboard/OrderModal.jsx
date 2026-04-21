import React, { useState, useEffect } from "react";
import { Form, Row, Col } from "react-bootstrap";
import { ArrowLeftRight, GripHorizontal, ChevronDown, ChevronUp } from "lucide-react";
import Draggable from "react-draggable";

/**
 * Calculation Logic for Indian Market Charges
 */
const calculateTradingCharges = (qty, price, product, isBuy) => {
  const q = Number(qty) || 0;
  const p = Number(price) || 0;
  const turnover = q * p;
  if (turnover === 0) return { total: 0, breakdown: [] };

  const brokerage = product === "MIS" ? Math.min(turnover * 0.0003, 20) : 0;
  let stt = product === "MIS" ? (!isBuy ? turnover * 0.00025 : 0) : turnover * 0.001;
  const exchangeCharges = turnover * 0.0000322;
  const gst = (brokerage + exchangeCharges) * 0.18;
  const sebiCharges = turnover * 0.0000001;
  const stampDuty = isBuy ? turnover * 0.00015 : 0;
  const total = brokerage + stt + exchangeCharges + gst + sebiCharges + stampDuty;

  return {
    total,
    breakdown: [
      { name: "Brokerage", value: brokerage },
      { name: "STT/CTT", value: stt },
      { name: "Exchange Trxn Chg", value: exchangeCharges },
      { name: "GST (18%)", value: gst },
      { name: "SEBI Fees", value: sebiCharges },
      { name: "Stamp Duty", value: stampDuty }
    ]
  };
};

const OrderModal = ({ show, handleClose, stock, type, onSubmit, liveData, funds, theme }) => {
  const [side, setSide] = useState(type);
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState(0);
  const [orderType, setOrderType] = useState("MARKET");
  const [product, setProduct] = useState("CNC");
  const [showCharges, setShowCharges] = useState(false);

  const isBuy = side === "BUY";
  const isMarket = orderType === "MARKET";
  const isDark = theme === "dark";

  // Initial Price & Side Sync
  useEffect(() => {
    if (show && stock) {
      setSide(type);
      const currentLtp = liveData?.[stock.symbol]?.ltp || stock.p || 0;
      setPrice(Number(currentLtp));
    }
  }, [show, stock, type]);

  // Live Price Sync (Only for Market Orders)
  useEffect(() => {
    if (show && isMarket && stock?.symbol) {
      const ltp = liveData?.[stock.symbol]?.ltp || liveData?.[stock.symbol]?.lp || stock.p;
      if (ltp) setPrice(Number(ltp));
    }
  }, [liveData, isMarket, show, stock?.symbol]);

  const handleFocus = (e) => {
    if (Number(e.target.value) === 0) {
      e.target.name === "qty" ? setQty("") : setPrice("");
    }
  };

  const handleBlur = (e) => {
    if (e.target.value === "" || Number(e.target.value) < 0) {
      if (e.target.name === "qty") setQty(1);
      else {
        const ltp = liveData?.[stock?.symbol]?.ltp || stock?.p || 0;
        setPrice(Number(ltp));
      }
    }
  };

  const chargesData = calculateTradingCharges(qty, price, product, isBuy);
  const marginRequired = product === "MIS" ? (Number(qty) * Number(price)) / 5 : (Number(qty) * Number(price));
  const isInvalid = !qty || qty <= 0 || marginRequired > funds;

  if (!show) return null;

  return (
    <div className="order-modal-wrapper">
      <Draggable handle=".drag-handle">
        <div className={`order-modal-container ${isDark ? "dark-mode" : ""}`}>
          
          {/* HEADER */}
          <div className={`order-header drag-handle ${isBuy ? "header-buy" : "header-sell"}`}>
            <div className="header-info">
              <GripHorizontal size={16} className="drag-grip" />
              <div className="header-labels">
                <div className="symbol-name"><b>{side}</b> {stock?.s || stock?.symbol}</div>
                <div className="ltp-info">LTP: ₹{Number(price).toFixed(2)}</div>
              </div>
            </div>
            <button className="switch-btn" onClick={() => setSide(isBuy ? "SELL" : "BUY")}>
              <ArrowLeftRight size={16} />
            </button>
          </div>

          <div className="order-body">
            {/* PRODUCT SELECTOR */}
            <div className="product-toggle">
              <button 
                className={`toggle-item ${product === "MIS" ? "active" : ""}`} 
                onClick={() => setProduct("MIS")}
              >MIS</button>
              <button 
                className={`toggle-item ${product === "CNC" ? "active" : ""}`} 
                onClick={() => setProduct("CNC")}
              >CNC</button>
            </div>

            {/* INPUT FIELDS */}
            <Row className="mt-3 g-3">
              <Col xs={6}>
                <label className="input-label">Quantity</label>
                <input
                  name="qty"
                  type="number"
                  className="dark-style-input"
                  value={qty}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  onChange={(e) => setQty(e.target.value === "" ? "" : Math.abs(e.target.value))}
                />
              </Col>
              <Col xs={6}>
                <label className="input-label">Price</label>
                <input
                  name="price"
                  type="number"
                  step="0.05"
                  disabled={isMarket}
                  className="dark-style-input"
                  value={price}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  onChange={(e) => setPrice(e.target.value === "" ? "" : Math.abs(e.target.value))}
                />
              </Col>
            </Row>

            {/* ORDER TYPE SELECTION */}
            <div className="order-type-tabs mt-3">
              <label className="radio-option">
                <input type="radio" checked={isMarket} onChange={() => setOrderType("MARKET")} />
                <span>Market</span>
              </label>
              <label className="radio-option ms-4">
                <input type="radio" checked={!isMarket} onChange={() => setOrderType("LIMIT")} />
                <span>Limit</span>
              </label>
            </div>

            {/* MARGIN & CHARGES PANEL */}
            <div className="summary-panel mt-3">
              <div className="summary-row main-margin">
                <span>Margin Required</span>
                <span className="price-bold">₹{marginRequired.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
              </div>
              
              <div className="charges-dropdown">
                <div className="summary-row charge-trigger" onClick={() => setShowCharges(!showCharges)}>
                  <span>Estimated Charges</span>
                  <div className="d-flex align-items-center">
                    <span className="me-1">₹{chargesData.total.toFixed(2)}</span>
                    {showCharges ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                  </div>
                </div>
                {showCharges && (
                  <div className="charge-details">
                    {chargesData.breakdown.map((item, index) => (
                      <div key={index} className="detail-line">
                        <span>{item.name}</span>
                        <span>₹{item.value.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* FOOTER ACTION BUTTONS */}
          <div className="order-footer">
            <button 
              className={`action-button ${isBuy ? "header-buy" : "header-sell"}`}
              disabled={isInvalid}
              onClick={() => onSubmit(qty, price, side, product)}
            >
              {marginRequired > funds ? "Insufficient Funds" : side}
            </button>
            <button className="cancel-button" onClick={handleClose}>Cancel</button>
          </div>
        </div>
      </Draggable>

      {/* BACKDROP WITHOUT BLUR */}
      <div className="simple-backdrop" onClick={handleClose} />

      <style>{`
        .order-modal-wrapper { position: fixed; inset: 0; z-index: 10000; font-family: 'Inter', sans-serif; }
        .simple-backdrop { position: absolute; inset: 0; background: rgba(0,0,0,0.3); }
        
        .order-modal-container {
          position: absolute; top: 100px; left: 50%; transform: translateX(-50%);
          width: 380px; background: white; border-radius: 8px; overflow: hidden;
          box-shadow: 0 15px 40px rgba(0,0,0,0.3); z-index: 10001;
        }

        .header-buy { background: #1369ff !important; }
        .header-sell { background: #ff473d !important; }
        
        .order-header { padding: 12px 16px; color: white; display: flex; justify-content: space-between; align-items: center; cursor: move; }
        .header-info { display: flex; align-items: flex-start; gap: 10px; }
        .drag-grip { opacity: 0.6; margin-top: 4px; }
        .symbol-name { font-size: 14px; font-weight: 600; }
        .ltp-info { font-size: 12px; opacity: 0.9; margin-top: 2px; }
        .switch-btn { background: rgba(255,255,255,0.2); border: none; color: white; padding: 4px 8px; border-radius: 4px; }

        .order-body { padding: 16px; }
        
        .product-toggle { display: flex; background: #f4f5f7; border-radius: 6px; padding: 4px; }
        .toggle-item { flex: 1; border: none; background: transparent; padding: 8px; font-size: 13px; font-weight: 600; color: #666; border-radius: 4px; }
        .toggle-item.active { background: #00daff; color: #000; }

        .input-label { display: block; font-size: 13px; color: #777; margin-bottom: 6px; font-weight: 500; }
        .dark-style-input { width: 100%; background: #111; color: white; border: 1px solid #333; padding: 10px; border-radius: 6px; font-weight: bold; font-family: 'Roboto Mono', monospace; }
        .dark-style-input:disabled { background: #222; color: #666; }

        .radio-option { display: inline-flex; align-items: center; gap: 8px; cursor: pointer; font-size: 14px; }
        
        .summary-panel { background: #f9f9fb; border: 1px solid #eee; border-radius: 6px; overflow: hidden; }
        .summary-row { display: flex; justify-content: space-between; padding: 10px 12px; font-size: 13px; }
        .main-margin { border-bottom: 1px solid #eee; background: white; }
        .price-bold { font-weight: 700; color: #111; }
        
        .charge-trigger { cursor: pointer; color: #888; }
        .charge-trigger:hover { background: #f0f0f3; }
        .charge-details { padding: 0 12px 10px; background: #fcfcfd; }
        .detail-line { display: flex; justify-content: space-between; font-size: 11px; color: #999; padding: 2px 0; }

        .order-footer { padding: 12px 16px; border-top: 1px solid #eee; display: flex; gap: 12px; }
        .action-button { flex: 2; border: none; padding: 10px; border-radius: 6px; color: white; font-weight: bold; text-transform: uppercase; font-size: 14px; }
        .cancel-button { flex: 1; background: white; border: 1px solid #ddd; border-radius: 6px; color: #888; font-weight: 500; }
        
        .action-button:disabled { opacity: 0.5; }
      `}</style>
    </div>
  );
};

export default OrderModal;