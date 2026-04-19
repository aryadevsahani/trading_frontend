import React from "react";
import { Card, Button, Row, Col, Form, InputGroup } from "react-bootstrap";
import { User, ShieldCheck, Settings, LogOut, CreditCard, Percent } from "lucide-react";

const Profile = ({ onLogout, funds, brokerageRate, setBrokerageRate }) => {
  return (
    <div className="fade-in px-3 py-4 custom-scrollbar profile-wrapper">

      {/* 1. Header Section: User Identity */}
      <div className="text-center mb-5">
        <div className="position-relative d-inline-block">
          <div className="profile-avatar-container shadow-lg">
            <User size={50} className="text-info-custom" />
          </div>
          <span className="online-indicator" title="Online"></span>
        </div>
        <h3 className="fw-bold mt-3 mb-1">ARYADEV TRADER</h3>
        <p className="text-secondary small mb-0">Client ID: <span className="text-info-custom fw-bold">ARYA007</span> | Member since 2024</p>
      </div>

      <Row className="g-4">
        {/* 2. Account Status & Details */}
        <Col lg={6}>
          <Card className="card-custom h-100 shadow-sm">
            <Card.Body className="p-4">
              <h6 className="text-info-custom mb-4 d-flex align-items-center gap-2 text-uppercase" style={{ letterSpacing: '1px' }}>
                <ShieldCheck size={18} /> Account Verification
              </h6>

              <div className="d-flex justify-content-between mb-3 border-bottom border-thin pb-2">
                <span className="text-secondary">PAN Number</span>
                <span className="fw-bold">AB***123F</span>
              </div>
              <div className="d-flex justify-content-between mb-3 border-bottom border-thin pb-2">
                <span className="text-secondary">Account Status</span>
                <span className="text-success-custom fw-bold">ACTIVE</span>
              </div>
              <div className="d-flex justify-content-between mb-3 border-bottom border-thin pb-2">
                <span className="text-secondary">Segments</span>
                <span className="fw-bold">Equity, F&O, Currency</span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-secondary">Bank Linked</span>
                <span className="fw-bold">HDFC Bank ****9012</span>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* 3. Dynamic Brokerage Settings */}
        <Col lg={6}>
          <Card className="card-custom h-100 shadow-sm">
            <Card.Body className="p-4">
              <h6 className="text-warning mb-4 d-flex align-items-center gap-2 text-uppercase" style={{ letterSpacing: '1px' }}>
                <Settings size={18} /> Trading Settings
              </h6>

              <Form.Group className="mb-3">
                <Form.Label className="text-secondary small mb-2">Set Flat Brokerage (₹ Per Order)</Form.Label>
                <InputGroup className="input-group-custom rounded overflow-hidden">
                  <InputGroup.Text className="bg-transparent border-0 text-secondary">
                    {/* Percentage icon ko CreditCard ya Indian Rupee se badal diya */}
                    <span className="fw-bold" style={{ fontSize: '14px' }}>₹</span>
                  </InputGroup.Text>
                  <Form.Control
                    type="number"
                    className="bg-transparent border-0 text-main shadow-none py-2"
                    value={brokerageRate}
                    placeholder="e.g. 20"
                    onChange={(e) => setBrokerageRate(parseFloat(e.target.value) || 0)}
                  />
                </InputGroup>
                <Form.Text className="text-muted mt-2 d-block" style={{ fontSize: '10px' }}>
                  *यह ₹{brokerageRate} आपके हर एक Buy और Sell ट्रेड पर अलग-अलग कटेगा (Flat Charge).
                </Form.Text>
              </Form.Group>

              <div className="p-3 rounded info-box-custom border border-thin mt-3">
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-secondary small">Brokerage Model</span>
                  <span className="badge bg-warning-subtle text-warning">FLAT CHARGE</span>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* 4. Funds Quick Summary */}
        <Col xs={12}>
          <Card className="card-custom shadow-sm">
            <Card.Body className="p-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
              <div className="d-flex align-items-center gap-3">
                <div className="fund-icon-box text-success-custom">
                  <CreditCard size={24} />
                </div>
                <div>
                  <small className="text-secondary d-block">Live Available Margin</small>
                  <h4 className="fw-bold mb-0">₹{funds?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h4>
                </div>
              </div>
              <div className="d-flex gap-2">
                <Button variant="primary" className="px-4 fw-bold shadow-sm">Deposit</Button>
                <Button variant="outline-danger" className="px-4 d-flex align-items-center gap-2" onClick={onLogout}>
                  <LogOut size={16} /> Logout
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <style>{`
        .profile-wrapper {
          max-height: 90vh;
          overflow-y: auto;
          color: var(--text-main);
        }

        .profile-avatar-container {
          background-color: var(--bg-dark);
          padding: 24px;
          border-radius: 50%;
          border: 2px solid var(--border);
          width: 100px;
          height: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .online-indicator {
          position: absolute;
          bottom: 5px;
          right: 5px;
          background-color: var(--success);
          border: 3px solid var(--bg-black);
          border-radius: 50%;
          width: 22px;
          height: 22px;
        }

        .input-group-custom {
          background-color: var(--bg-black);
          border: 1px solid var(--border);
        }

        .info-box-custom {
          background-color: var(--bg-black);
        }

        .fund-icon-box {
          padding: 15px;
          background-color: var(--bg-black);
          border-radius: 12px;
          border: 1px solid var(--border);
        }

        .text-info-custom { color: var(--accent) !important; }
        .text-success-custom { color: var(--success) !important; }
        .text-main { color: var(--text-main) !important; }
        .border-thin { border-color: var(--border) !important; }

        /* Scrollbar Fix for Theme */
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: var(--bg-black); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }
        
        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button { 
          -webkit-appearance: none; 
          margin: 0; 
        }
      `}</style>
    </div>
  );
};

export default Profile;