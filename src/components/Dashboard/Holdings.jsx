import React from "react";
import { Table, Badge } from "react-bootstrap";

const Holdings = ({ liveData = {} }) => {
  const myHoldings = [
    { symbol: "RELIANCE", s: "RELIANCE", qty: 50, avg: 2450.00 },
    { symbol: "TCS", s: "TCS", qty: 20, avg: 3200.00 },
    { symbol: "INFY", s: "INFY", qty: 100, avg: 1550.00 },
  ];

  return (
    <div className="holdings-container">
      <Table responsive className="oc-table-reset mb-0 text-center align-middle small">
        <thead>
          <tr className="oc-th-main" style={{ fontSize: '11px' }}>
            <th className="text-start ps-4 py-3">INSTRUMENT</th>
            <th>QTY.</th>
            <th>AVG. COST</th>
            <th>LTP</th>
            <th>CUR. VAL</th>
            <th className="text-end pe-4">P&L</th>
          </tr>
        </thead>
        <tbody>
          {myHoldings.map((stock, i) => {
            const ltp = liveData[stock.symbol]?.lp || stock.avg + 15;
            const curVal = stock.qty * ltp;
            const investVal = stock.qty * stock.avg;
            const pnl = curVal - investVal;
            const pnlPercent = (pnl / investVal) * 100;

            return (
              <tr key={i} className="oc-tr border-bottom border-thin">
                <td className="text-start ps-4 py-3 fw-bold">
                  {stock.s} 
                  <Badge className="badge-cnc ms-2">CNC</Badge>
                </td>
                <td>{stock.qty}</td>
                <td>{stock.avg.toFixed(2)}</td>
                <td className="text-info-custom">{ltp.toFixed(2)}</td>
                <td>{curVal.toLocaleString('en-IN')}</td>
                <td className={`text-end pe-4 fw-bold ${pnl >= 0 ? 'text-success-custom' : 'text-danger-custom'}`}>
                  {pnl >= 0 ? "+" : ""}{pnl.toFixed(2)}
                  <small className="d-block" style={{ fontSize: '10px', opacity: 0.8 }}>
                    ({pnlPercent.toFixed(2)}%)
                  </small>
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
      
      <style>{`
        .holdings-container {
          background-color: var(--bg-dark);
          border: 1px solid var(--border);
          border-radius: 8px;
          overflow: hidden;
        }

        .oc-table-reset {
          width: 100%;
          color: var(--text-main) !important;
        }

        /* Header Style */
        .oc-th-main th {
          background-color: var(--bg-black) !important;
          color: var(--text-secondary) !important;
          border-bottom: 1px solid var(--border) !important;
          font-weight: 600;
        }

        /* Row Style */
        .oc-tr td {
          background-color: var(--bg-dark) !important;
          color: var(--text-main);
          border-bottom: 1px solid var(--border) !important;
        }

        /* CNC Badge */
        .badge-cnc {
          background-color: var(--bg-black) !important;
          color: var(--text-secondary) !important;
          border: 1px solid var(--border) !important;
          font-size: 9px;
          opacity: 0.7;
        }

        /* Custom Colors from Variables */
        .text-info-custom { color: var(--accent) !important; }
        .text-success-custom { color: var(--success) !important; }
        .text-danger-custom { color: var(--danger) !important; }

        /* Hover Effect */
        .oc-tr:hover td {
          background-color: rgba(128, 128, 128, 0.05) !important;
          transition: 0.2s;
        }
      `}</style>
    </div>
  );
};

export default Holdings;