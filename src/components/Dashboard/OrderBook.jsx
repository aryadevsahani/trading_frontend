import React from "react";
import { Table, Badge } from "react-bootstrap";
import { ClipboardList } from "lucide-react";

const OrderBook = ({ orders }) => {
  return (
    <div className="fade-in order-book-wrapper">
      <h5 className="text-info fw-bold mb-4 d-flex align-items-center gap-2">
        <ClipboardList size={20}/> Order Book ({orders.length})
      </h5>

      {/* variant="dark" hata diya kyunki ab hum custom CSS variables use karenge */}
      <Table responsive className="oc-table-reset small shadow-sm">
        <thead>
          <tr className="oc-th-main">
            <th className="py-3 ps-3">TIME</th>
            <th className="py-3">TYPE</th>
            <th className="py-3">INSTRUMENT</th>
            <th className="py-3">PRODUCT</th>
            <th className="py-3 text-end">QTY</th>
            <th className="py-3 text-end pe-3">PRICE</th>
            <th className="py-3 text-center">STATUS</th>
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 ? (
            <tr className="oc-tr">
              <td colSpan="7" className="text-center py-5 text-secondary">
                No orders today.
              </td>
            </tr>
          ) : (
            orders.map((ord, i) => (
              <tr key={i} className="oc-tr align-middle border-bottom border-thin">
                <td className="ps-3 text-secondary" style={{fontSize: '11px'}}>{ord.time}</td>
                <td>
                  <span className={`fw-bold px-2 py-1 rounded-1 ${
                    ord.type === "BUY" 
                    ? "text-success bg-success bg-opacity-10" 
                    : "text-danger bg-danger bg-opacity-10"
                  }`}>
                    {ord.type}
                  </span>
                </td>
                {/* text-white hataya, ab ye auto-adjust hoga */}
                <td className="fw-bold">{ord.displayName || ord.symbol}</td>
                <td>
                  <Badge className="badge-custom">
                    {ord.product}
                  </Badge>
                </td>
                <td className="text-end fw-bold">{ord.qty}</td>
                <td className="text-end pe-3">₹{parseFloat(ord.price).toFixed(2)}</td>
                <td className="text-center">
                  <Badge bg="success" className="opacity-75">COMPLETE</Badge>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </Table>

      <style>{`
        .order-book-wrapper {
          background-color: var(--bg-dark);
          padding: 15px;
          border-radius: 12px;
          border: 1px solid var(--border);
        }

        /* Badge color control */
        .badge-custom {
          background-color: var(--bg-black) !important;
          color: var(--text-secondary) !important;
          border: 1px solid var(--border) !important;
        }

        /* Table custom styling for theme sync */
        .oc-table-reset {
          width: 100%;
          color: var(--text-main) !important;
        }

        .oc-th-main th {
          background-color: var(--bg-black) !important;
          color: var(--text-secondary) !important;
          border-bottom: 2px solid var(--border) !important;
          padding: 12px 8px;
        }

        .oc-tr td {
          background-color: var(--bg-dark) !important;
          color: var(--text-main);
          padding: 12px 8px;
          border-bottom: 1px solid var(--border) !important;
        }

        .oc-tr:hover td {
          background-color: rgba(128, 128, 128, 0.05) !important;
        }
      `}</style>
    </div>
  );
};

export default OrderBook;