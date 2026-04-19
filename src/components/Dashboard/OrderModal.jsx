import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import { ArrowLeftRight } from "lucide-react";

const OrderModal = ({
  show,
  handleClose,
  stock,
  type,
  onSubmit,
  liveData,
  funds,
}) => {
  const [side, setSide] = useState(type);
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState(0);
  const [orderType, setOrderType] = useState("MARKET");
  const [product, setProduct] = useState("MIS");
  const [showCharges, setShowCharges] = useState(false);

  const isBuy = side === "BUY";
  const isMarket = orderType === "MARKET";

  // Initial setup
  useEffect(() => {
    if (show && stock) {
      setSide(type);
      setQty(1);
      setOrderType("MARKET");
      setProduct("MIS");
      setShowCharges(false);

      const initialPrice =
        liveData?.[stock.symbol]?.lp ||
        parseFloat(String(stock.p).replace(/,/g, "")) ||
        0;

      setPrice(initialPrice);
    }
  }, [show, stock, type]);

  // Live price update
  useEffect(() => {
    if (show && isMarket && stock?.symbol && liveData) {
      const liveLTP = liveData[stock.symbol]?.lp;
      if (liveLTP) setPrice(liveLTP);
    }
  }, [liveData, isMarket, stock?.symbol, show]);

  // Margin
  const marginRequired =
    product === "MIS" ? (qty * price) / 5 : qty * price;

  const isInvalid =
    qty <= 0 || isNaN(qty) || marginRequired > funds;

  // Charges calculation
  const turnover = qty * price;

  const brokerage = Math.min(turnover * 0.0003, 20);
  const stt = side === "SELL" ? turnover * 0.001 : 0;
  const exchangeTx = turnover * 0.0000325;
  const gst = (brokerage + exchangeTx) * 0.18;
  const sebi = turnover * 0.000001;
  const stampDuty = side === "BUY" ? turnover * 0.00015 : 0;

  const totalCharges =
    brokerage + stt + exchangeTx + gst + sebi + stampDuty;

  return (
    <Modal
      show={show}
      onHide={handleClose}
      centered
      contentClassName="order-modal-content border-0"
    >
      {/* Header */}
      <div className={`order-header ${isBuy ? "bg-primary" : "bg-danger"} p-3`}>
        <div className="d-flex justify-content-between align-items-center text-white">
          <div>
            <h6 className="mb-0 fw-bold">
              {side} {stock?.s}
            </h6>
            <small>LTP: ₹{price.toFixed(2)}</small>
          </div>

          <button
            className="switch-btn"
            onClick={() => setSide(isBuy ? "SELL" : "BUY")}
          >
            <ArrowLeftRight size={16} />
          </button>
        </div>
      </div>

      {/* BODY */}
      <Modal.Body className="bg-black text-white p-4">

        {/* Product Tabs */}
        <div className="custom-tabs mb-3">
          <div
            className={`tab-item ${product === "MIS" ? "active" : ""}`}
            onClick={() => setProduct("MIS")}
          >
            Intraday 5x
          </div>
          <div
            className={`tab-item ${product === "CNC" ? "active" : ""}`}
            onClick={() => setProduct("CNC")}
          >
            Longterm 1x
          </div>
        </div>

        {/* Inputs */}
        <Row className="g-3">
          <Col xs={6}>
            <Form.Control
              type="number"
              value={qty}
              onChange={(e) =>
                setQty(parseInt(e.target.value) || 0)
              }
              className="custom-input"
              placeholder="Qty"
            />
          </Col>

          <Col xs={6}>
            <Form.Control
              type="number"
              value={price}
              disabled={isMarket}
              onChange={(e) =>
                setPrice(parseFloat(e.target.value) || 0)
              }
              className="custom-input"
            />
          </Col>
        </Row>

        {/* Order Type */}
        <div className="d-flex gap-3 mt-3">
          <Form.Check
            type="radio"
            label="Market"
            checked={isMarket}
            onChange={() => setOrderType("MARKET")}
          />
          <Form.Check
            type="radio"
            label="Limit"
            checked={!isMarket}
            onChange={() => setOrderType("LIMIT")}
          />
        </div>

        {/* Margin */}
        <div className="margin-box mt-4">
          <div className="d-flex justify-content-between">
            <span>Margin Required</span>
            <span>₹{marginRequired.toFixed(2)}</span>
          </div>
          <div
            className="d-flex justify-content-between align-items-center"
            onClick={() => setShowCharges(!showCharges)}
            style={{ cursor: "pointer" }}
          >
            <span className="fw-bold">Charges</span>

            <span className="d-flex align-items-center gap-2">
              <span className="text-info fw-bold">
                ₹{totalCharges.toFixed(2)}
              </span>
              <span>{showCharges ? "▲" : "▼"}</span>
            </span>
          </div>

          {showCharges && (
            <div className="charges-box mt-2">
              <div className="d-flex justify-content-between">
                <span>Brokerage</span>
                <span>₹{brokerage.toFixed(2)}</span>
              </div>

              <div className="d-flex justify-content-between">
                <span>STT</span>
                <span>₹{stt.toFixed(2)}</span>
              </div>

              <div className="d-flex justify-content-between">
                <span>Exchange Txn</span>
                <span>₹{exchangeTx.toFixed(2)}</span>
              </div>

              <div className="d-flex justify-content-between">
                <span>GST</span>
                <span>₹{gst.toFixed(2)}</span>
              </div>

              <div className="d-flex justify-content-between">
                <span>SEBI</span>
                <span>₹{sebi.toFixed(2)}</span>
              </div>

              <div className="d-flex justify-content-between">
                <span>Stamp Duty</span>
                <span>₹{stampDuty.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

      </Modal.Body>

      {/* Footer */}
      <div className="bg-dark p-3 d-flex gap-2">
        <Button
          variant={isBuy ? "primary" : "danger"}
          className="flex-grow-1"
          disabled={isInvalid}
          onClick={() =>
            onSubmit(qty, price, side, product)
          }
        >
          {marginRequired > funds
            ? "INSUFFICIENT FUNDS"
            : `${side} ${stock?.s}`}
        </Button>

        <Button variant="outline-secondary" onClick={handleClose}>
          Cancel
        </Button>
      </div>

      {/* Styles */}
      <style>{`
        .order-modal-content {
          border-radius: 12px;
        }

        .switch-btn {
          background: #333;
          border: none;
          color: white;
          padding: 6px;
          border-radius: 6px;
        }

        .custom-tabs {
          display: flex;
          gap: 5px;
        }

        .tab-item {
          flex: 1;
          text-align: center;
          padding: 6px;
          background: #111;
          cursor: pointer;
          border-radius: 6px;
        }

        .tab-item.active {
          background: #0dcaf0;
          color: black;
        }

        .custom-input {
          background: #111 !important;
          border: 1px solid #333 !important;
          color: white !important;
        }

        .custom-input:disabled {
          background: #0d1b2a !important;
          color: #0dcaf0 !important;
          opacity: 0.7;
        }

        .margin-box {
          border: 1px dashed #444;
          padding: 10px;
          border-radius: 8px;
        }

        .charges-row {
          background: rgba(255,255,255,0.02);
          border: 1px solid #333;
          border-radius: 8px;
          padding: 10px;
        }

        .charges-box {
          background: #111;
          padding: 10px;
          border-radius: 8px;
          font-size: 12px;
        }
      `}</style>
    </Modal>
  );
};

export default OrderModal;