import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useParams } from "react-router-dom";
import socket from "../services/socket";
import { Button, Spinner, Dropdown, Form } from "react-bootstrap";
import { Settings2, Layers } from "lucide-react";

const normalizeOptionItem = (item) => {
  if (!item) return null;
  const strike = item.strike || item.strikePrice || item.strike_price || 0;
  const type = item.option_type || (item.symbol?.includes("CE") ? "CE" : "PE");

  return {
    strike: Number(strike),
    type: type.toUpperCase(),
    ltp: item.ltp || item.lp || 0,
    volume: item.volume || item.v || 0,
    oi: item.oi || 0,
    oiChange: (item.oich !== undefined) ? Number(item.oich) : 0,
    oiChangePercent: (item.oichp !== undefined) ? Number(item.oichp) : 0,
    iv: item.iv || 0,
    symbol: item.symbol
  };
};

const AVAILABLE_COLUMNS = [
  { id: "oi", label: "OI" },
  { id: "oiChange", label: "OI Chg" },
  { id: "oiChangePercent", label: "OI Chg%" },
  { id: "volume", label: "Volume" },
  { id: "ltp", label: "LTP" }
];

export default function OptionChain({ symbol: propSymbol, onTrade, theme }) {
  const { symbol: urlSymbol } = useParams();
  const activeSymbol = useMemo(() => urlSymbol || propSymbol || "NSE:NIFTY50-INDEX", [urlSymbol, propSymbol]);

  const [data, setData] = useState({});
  const [expiries, setExpiries] = useState([]);
  const [selectedExpiry, setSelectedExpiry] = useState("");
  const [selectedStrikeCount, setSelectedStrikeCount] = useState(20);
  const [spotPrice, setSpotPrice] = useState(0);
  const [spotData, setSpotData] = useState({ ch: 0, chp: 0 });
  const [loading, setLoading] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState(["oi", "oiChange", "ltp"]);

  const token = localStorage.getItem("accessToken");

  const loadChainData = useCallback(async (expiry) => {
    if (!expiry || !activeSymbol) return;
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/option-chain", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ symbol: activeSymbol, expiry, strikeCount: selectedStrikeCount }),
      });
      const result = await res.json();
      const items = result.data?.optionsChain || result.optionsChain || [];
      const mapped = {};
      items.forEach(item => {
        const n = normalizeOptionItem(item);
        if (n && n.strike > 0) mapped[`${n.strike}_${n.type}`] = n;
      });
      setData(mapped);
      socket.emit("subscribe-option-chain", items.map(i => i.symbol));
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [activeSymbol, selectedStrikeCount, token]);

  useEffect(() => {
    const handleUpdate = (update) => {
      if (update[activeSymbol]) {
        const s = update[activeSymbol];
        setSpotPrice(s.lp || s.ltp || 0);
        // Ensure percent is calculated if backend sends 0.00
        setSpotData({
          ch: s.ch || 0,
          chp: s.chp || (s.ch && s.lp ? (s.ch / (s.lp - s.ch)) * 100 : 0)
        });
      }
      // Data update logic for table
      setData(prev => {
        const newState = { ...prev };
        let hasUpdate = false;
        Object.keys(update).forEach(sym => {
          const found = Object.values(newState).find(item => item.symbol === sym);
          if (found) {
            const key = `${found.strike}_${found.type}`;
            const up = update[sym];
            newState[key] = {
              ...found,
              ltp: up.lp || up.ltp || found.ltp,
              oi: up.oi !== undefined ? up.oi : found.oi,
              oiChange: up.oich !== undefined ? up.oich : found.oiChange,
              oiChangePercent: up.oichp !== undefined ? up.oichp : found.oiChangePercent
            };
            hasUpdate = true;
          }
        });
        return hasUpdate ? newState : prev;
      });
    };
    socket.on("market-update", handleUpdate);
    return () => socket.off("market-update", handleUpdate);
  }, [activeSymbol]);

  useEffect(() => {
    const init = async () => {
      const res = await fetch("http://localhost:5000/api/option-chain", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ symbol: activeSymbol })
      });
      const result = await res.json();
      const list = (result.data?.expiryData || result.expiryData || []).map(e => e.expiry);
      setExpiries(list);
      if (list.length) setSelectedExpiry(list[0]);
    }
    init();
  }, [activeSymbol, token]);

  useEffect(() => { if (selectedExpiry) loadChainData(selectedExpiry); }, [selectedExpiry, loadChainData]);

  const sortedStrikes = useMemo(() => {
    return [...new Set(Object.values(data).map(d => d.strike))].sort((a, b) => a - b);
  }, [data]);

  const renderCells = (strike, side) => {
    const item = data[`${strike}_${side}`] || { ltp: 0, oi: 0, oiChange: 0, oiChangePercent: 0 };
    const isITM = side === "CE" ? strike < spotPrice : strike > spotPrice;

    const cols = side === "CE"
      ? AVAILABLE_COLUMNS.filter(c => visibleColumns.includes(c.id))
      : [...AVAILABLE_COLUMNS].filter(c => visibleColumns.includes(c.id)).reverse();

    return cols.map(col => {
      if (col.id === "ltp") {
        return (
          <td key={col.id} className={`action-td ${isITM ? "itm-cell" : ""}`}>
            <span className="fw-bold ltp-val">{item.ltp.toFixed(2)}</span>
            <div className="trade-btns">
              <Button variant="success" size="sm" onClick={() => onTrade(item, "BUY")}>B</Button>
              <Button variant="danger" size="sm" onClick={() => onTrade(item, "SELL")}>S</Button>
            </div>
          </td>
        );
      }
      const val = item[col.id] || 0;
      const isColor = col.id.includes("oiChange");
      return (
        <td key={col.id} className={isITM ? "itm-cell" : ""}>
          <span className={isColor ? (val >= 0 ? "text-success" : "text-danger") : ""}>
            {col.id === "oiChangePercent" ? `${val >= 0 ? "+" : ""}${val.toFixed(2)}%` : val.toLocaleString()}
          </span>
        </td>
      );
    });
  };

  return (
    <div className={`oc-container h-100 d-flex flex-column theme-adaptive ${theme === 'dark' ? 'dark-mode' : ''}`}>
      {/* Header with explicit styles for visibility */}
      <div className="oc-header p-2 d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-3">
          <span className="fw-bold text-primary symbol-title">{activeSymbol.split(":")[1]}</span>
          <div className="text-start spot-info">
            <div className="fw-bold spot-price">₹{spotPrice.toFixed(2)}</div>
            <div className={spotData.ch >= 0 ? "text-success" : "text-danger"} style={{ fontSize: '12px', fontWeight: '500' }}>
              {spotData.ch >= 0 ? "+" : ""}{spotData.ch.toFixed(2)} ({spotData.chp.toFixed(2)}%)
            </div>
          </div>
        </div>

        <div className="d-flex gap-2">
          <Dropdown align="end">
            <Dropdown.Toggle variant="outline-secondary" size="sm" className="no-caret shadow-none border"><Settings2 size={16} /></Dropdown.Toggle>
            <Dropdown.Menu className="p-3 shadow custom-dropdown-menu">
              {AVAILABLE_COLUMNS.map(col => (
                <Form.Check key={col.id} id={`check-${col.id}`} label={col.label} checked={visibleColumns.includes(col.id)}
                  onChange={() => setVisibleColumns(prev => prev.includes(col.id) ? prev.filter(c => c !== col.id) : [...prev, col.id])}
                />
              ))}
            </Dropdown.Menu>
          </Dropdown>
          <select className="form-select form-select-sm theme-select w-auto" value={selectedStrikeCount} onChange={e => setSelectedStrikeCount(Number(e.target.value))}>
            {[5, 10, 20, 40, 60, 100].map(c => <option key={c} value={c}>{c} Strikes</option>)}
          </select>
          <select className="form-select form-select-sm theme-select w-auto" value={selectedExpiry} onChange={e => setSelectedExpiry(e.target.value)}>
            {expiries.map(ex => <option key={ex} value={ex}>{new Date(ex * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</option>)}
          </select>
        </div>
      </div>

      <div className="flex-grow-1 overflow-auto custom-scrollbar">
        <table className="oc-table w-100">
          <thead>
            {/* Main Header */}
            <tr className="main-head">
              <th colSpan={visibleColumns.length} className="text-success border-end">CALLS</th>
              <th className="strike-header">STRIKE</th>
              <th colSpan={visibleColumns.length} className="text-danger border-start">PUTS</th>
            </tr>

            {/* Sub Header - यहाँ कॉलम के नाम दिखेंगे */}
            <tr className="sub-head">
              {/* Calls side columns */}
              {AVAILABLE_COLUMNS.filter(c => visibleColumns.includes(c.id)).map(col => (
                <th key={`ce-${col.id}`}>{col.label}</th>
              ))}

              {/* Center Strike label */}
              <th className="strike-header">PRICE</th>

              {/* Puts side columns (reversed to maintain symmetry) */}
              {[...AVAILABLE_COLUMNS].filter(c => visibleColumns.includes(c.id)).reverse().map(col => (
                <th key={`pe-${col.id}`}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedStrikes.map((strike, idx) => {
              const nextStrike = sortedStrikes[idx + 1];
              const isSpotHere = spotPrice >= strike && spotPrice < (nextStrike || Infinity);
              return (
                <React.Fragment key={strike}>
                  <tr>
                    {renderCells(strike, "CE")}
                    <td className="strike-val">{strike}</td>
                    {renderCells(strike, "PE")}
                  </tr>
                  {isSpotHere && (
                    <tr className="spot-row">
                      <td colSpan={visibleColumns.length * 2 + 1}>
                        <div className="spot-line">
                          {/* LTP | Change | Change% फॉर्मेट */}
                          <span className="spot-val">
                            ₹{spotPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                          <span className="spot-sep">  |  </span>
                          <span className={`spot-chg ${spotData.ch >= 0 ? "text-success-bright" : "text-danger-bright"}`}>
                            {spotData.ch >= 0 ? "+" : ""}{spotData.ch.toFixed(2)} ({spotData.chp.toFixed(2)}%)
                          </span>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <style>{`
      
        /* Theme Variables */
        .theme-adaptive { 
          --oc-bg: #ffffff; 
          --oc-text: #212529; 
          --oc-header: #f8f9fa;
          --oc-border: #dee2e6; 
          --oc-itm: #fff9e6; 
          --oc-strike-bg: #f1f3f5;
        }
        
        .dark-mode, [data-theme='dark'] .theme-adaptive { 
          --oc-bg: #121212; 
          --oc-text: #e0e0e0; 
          --oc-header: #1e1e1e;
          --oc-border: #333333; 
          --oc-itm: #1a1a10; 
          --oc-strike-bg: #1e1e1e;
        }
        
        .oc-container { background: var(--oc-bg); color: var(--oc-text); min-height: 100%; transition: all 0.2s ease; }
        
        .oc-header { 
          background: var(--oc-header); 
          border-bottom: 1px solid var(--oc-border); 
          color: var(--oc-text);
          min-height: 60px;
        }

        .symbol-title { font-size: 1.1rem; }
        .spot-price { font-size: 1.2rem; color: var(--oc-text); }
        
        .oc-table th { 
          text-align: center;
          background: var(--oc-header); 
          border: 1px solid var(--oc-border); 
          color: var(--oc-text);
          font-size: 11px; 
          padding: 8px; 
          position: sticky; 
          top: 0; 
          z-index: 10; 
        }
        
        .oc-table td { text-align:center;border: 1px solid var(--oc-border); padding: 10px 5px; text-align: center; font-size: 12px; color: var(--oc-text); }
        
        .strike-val { background: var(--oc-strike-bg); font-weight: bold; color: #2196f3; min-width: 80px; }
        .strike-header { background: var(--oc-strike-bg) !important; color: #2196f3 !important; }
        .itm-cell { background: var(--oc-itm) !important; }
        
        .spot-row td { padding: 0 !important; border: none !important; text-align: center; background: transparent !important; }
        .spot-line {
          background: #343a40; /* डार्क ग्रे/ब्लैक बैकग्राउंड */
          color: #ffffff;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 4px 25px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 13px;
          margin: 5px 0;
          box-shadow: 0 2px 4px rgba(222, 13, 13, 0.2);
        }

        .theme-select { background: var(--oc-header); color: var(--oc-text); border-color: var(--oc-border); }
        .custom-dropdown-menu { background: var(--oc-header) !important; color: var(--oc-text) !important; border: 1px solid var(--oc-border); }
        .custom-dropdown-menu .form-check-label { color: var(--oc-text) !important; }

        .action-td { position: relative; min-width: 90px; cursor: pointer; }
        .trade-btns { display: none; position: absolute; inset: 0; background: var(--oc-itm); align-items: center; justify-content: center; gap: 4px; z-index: 5; }
        .action-td:hover .trade-btns { display: flex; }
        .action-td:hover .ltp-val { visibility: hidden; }

        .no-caret::after { display: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #555; border-radius: 10px; }
      `}</style>
    </div>
  );
}