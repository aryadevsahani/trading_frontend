import React from "react";
import { Table, Badge, Button } from "react-bootstrap";
import { TrendingUp } from "lucide-react";

const Positions = ({ positions = [], liveData = {}, onExit }) => {
  return (
    <div className="fade-in positions-container">
      <h5 className="text-info-custom fw-bold mb-4 d-flex align-items-center gap-2">
        <TrendingUp size={20}/> Positions ({positions.length})
      </h5>

      <Table responsive className="oc-table-reset small text-center shadow-sm align-middle mb-0">
        <thead>
          <tr className="oc-th-main">
            <th className="text-start ps-3">PRODUCT</th>
            <th className="text-start">INSTRUMENT</th>
            <th>QTY</th>
            <th>AVG.</th>
            <th>LTP</th>
            <th>P&L</th>
            <th className="text-end pe-3">ACTION</th>
          </tr>
        </thead>
        <tbody>
          {positions.length === 0 ? (
            <tr className="oc-tr">
              <td colSpan="7" className="py-5 text-secondary">No open positions.</td>
            </tr>
          ) : (
            positions.map((pos, i) => {
              // LTP fetching from liveData or fallback to average price
              const ltp = liveData[pos.symbol]?.lp || liveData[pos.symbol]?.ltp || pos.price;
              const pnl = (ltp - pos.price) * pos.qty;
              const isProfit = pnl >= 0;

              return (
                <tr key={i} className="oc-tr border-bottom border-thin">
                  <td className="text-start ps-3">
                    <Badge className={`badge-product ${pos.product === 'MIS' ? 'border-warning text-warning' : 'border-info text-info'}`}>
                      {pos.product}
                    </Badge>
                  </td>
                  <td className="text-start fw-bold">{pos.displayName || pos.symbol}</td>
                  <td className={`fw-bold ${pos.qty > 0 ? "text-success-custom" : "text-danger-custom"}`}>
                    {pos.qty > 0 ? `+${pos.qty}` : pos.qty}
                  </td>
                  <td>{pos.price.toFixed(2)}</td>
                  <td className="fw-bold">{ltp.toFixed(2)}</td>
                  <td className={`fw-bold ${isProfit ? "text-success-custom" : "text-danger-custom"}`}>
                    {isProfit ? "+" : ""}{pnl.toFixed(2)}
                  </td>
                  <td className="text-end pe-3">
                    <Button 
                      variant="outline-danger" 
                      size="sm" 
                      className="py-0 px-2 btn-exit fw-bold"
                      onClick={() => onExit(pos)} // Passing the full position object to dashboard
                    >
                      EXIT
                    </Button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </Table>

      <style>{`
        .positions-container {
          background-color: var(--bg-dark);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 15px;
        }
        .oc-table-reset { width: 100%; color: var(--text-main) !important; }
        .oc-th-main th {
          background-color: var(--bg-black) !important;
          color: var(--text-secondary) !important;
          border-bottom: 2px solid var(--border) !important;
          padding: 12px 8px;
        }
        .oc-tr td {
          background-color: var(--bg-dark) !important;
          color: var(--text-main);
          border-bottom: 1px solid var(--border) !important;
          padding: 12px 8px;
        }
        .badge-product {
          background-color: transparent !important;
          border: 1px solid currentColor !important;
          font-size: 10px;
        }
        .btn-exit { font-size: 11px; border-radius: 4px; transition: 0.2s; }
        .btn-exit:hover { background-color: var(--danger) !important; color: #fff !important; }
        .text-info-custom { color: var(--accent) !important; }
        .text-success-custom { color: #26a69a !important; }
        .text-danger-custom { color: #ef5350 !important; }
        .oc-tr:hover td { background-color: rgba(128, 128, 128, 0.05) !important; }
      `}</style>
    </div>
  );
};

export default Positions;