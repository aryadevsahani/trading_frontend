import React from "react";
import { Card, Button } from "react-bootstrap";
import { Wallet } from "lucide-react";

const Funds = ({ funds }) => (
  <div className="fade-in">
    {/* text-info standard blue rahega, jo dono theme mein achha dikhta hai */}
    <h5 className="text-info fw-bold mb-4 d-flex align-items-center gap-2">
      <Wallet size={20}/> Funds
    </h5>

    {/* 'bg-custom-card' aur 'text-main' classes ka use karein jo theme ke hisaab se badle */}
    <Card className="card-custom border-thin p-4 d-flex flex-row justify-content-between align-items-center shadow-sm">
      <div>
        <small className="text-secondary small d-block mb-1">CASH MARGIN</small>
        <h2 className="fw-bold mb-0 text-main">
          ₹{funds.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </h2>
      </div>
      <div className="d-flex gap-2">
        <Button variant="info" className="fw-bold px-4 shadow-sm text-white">
          ADD FUNDS
        </Button>
        <Button variant="outline-secondary" className="btn-outline-custom">
          WITHDRAW
        </Button>
      </div>
    </Card>

    <style>{`
      /* Light/Dark dynamic classes */
      .card-custom {
        background: var(--bg-card) !important;
        border: 1px solid var(--border-color) !important;
      }

      .text-main {
        color: var(--text-color) !important;
      }

      .btn-outline-custom {
        border-color: var(--border-color) !important;
        color: var(--text-color) !important;
      }

      .btn-outline-custom:hover {
        background: var(--border-color);
        color: var(--text-color);
      }
    `}</style>
  </div>
);

export default Funds;