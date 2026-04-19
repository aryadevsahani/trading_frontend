import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useParams } from "react-router-dom";
import socket from "../services/socket";
import { Button, Spinner } from "react-bootstrap";
import { Layers } from "lucide-react";

const normalizeOptionItem = (item) => {
  if (!item) return null;
  const strike = item.strike || item.strikePrice || item.strike_price;
  const type = item.option_type || (item.symbol?.includes("CE") ? "CE" : "PE");
  return {
    strike: Number(strike),
    type: type.toUpperCase(),
    ltp: item.ltp || item.lp || 0,
    volume: item.volume || item.v || 0,
    oi: item.oi || 0,
    symbol: item.symbol
  };
};

export default function OptionChain({ symbol: propSymbol, onTrade }) {
  const { symbol: urlSymbol } = useParams();
  const activeSymbol = useMemo(() => urlSymbol || propSymbol || "NSE:NIFTY50-INDEX", [urlSymbol, propSymbol]);

  const [data, setData] = useState({});
  const [expiries, setExpiries] = useState([]);
  const [selectedExpiry, setSelectedExpiry] = useState("");
  const [selectedStrikeCount, setSelectedStrikeCount] = useState(20);
  const [spotPrice, setSpotPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("accessToken");

  // --- API: Load Chain Data (Memoized to prevent loops) ---
  const loadChainData = useCallback(async (expiry) => {
    console.log("Fetching new data for:", expiry);
    if (!expiry || !activeSymbol) return;
    setLoading(true);
    setData({});
    try {
      const res = await fetch("http://localhost:5000/api/option-chain", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          symbol: activeSymbol,
          expiry,
          strikeCount: selectedStrikeCount
        }),
      });
      const result = await res.json();
      const items = result.data?.optionsChain || result.optionsChain || [];

      const mapped = {};
      items.forEach(item => {
        const n = normalizeOptionItem(item);
        if (n?.strike) mapped[`${n.strike}_${n.type}`] = n;
      });

      setData(mapped);
      // Naye expiry ke symbols subscribe karein
      socket.emit("subscribe-option-chain", items.map(i => i.symbol));
    } catch (err) {
      console.error("OC Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }, [activeSymbol, selectedStrikeCount, token]);

  // --- EFFECT: Initial Symbol Load & Spot Update ---
  useEffect(() => {
    const initChain = async () => {
      setLoading(true);
      socket.emit("subscribe-watchlist", [activeSymbol]);
      try {
        const res = await fetch("http://localhost:5000/api/option-chain", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify({ symbol: activeSymbol })
        });
        const result = await res.json();
        const expiryData = result.data?.expiryData || result.expiryData;
        if (expiryData?.length > 0) {
          const expiryList = expiryData.map(e => e.expiry);
          setExpiries(expiryList);
          setSelectedExpiry(expiryList[0]); // Ye trigger karega loadChainData ko niche wale useEffect mein
        }
      } catch (err) { console.error(err); }
      setLoading(false);
    };

    initChain();

    const handleUpdate = (update) => {
      if (update[activeSymbol]) setSpotPrice(update[activeSymbol].lp || update[activeSymbol].ltp || 0);

      setData(prev => {
        const newState = { ...prev };
        let hasUpdate = false;
        Object.keys(update).forEach(sym => {
          const found = Object.values(newState).find(item => item.symbol === sym);
          if (found) {
            const key = `${found.strike}_${found.type}`;
            newState[key] = { ...found, ltp: update[sym].lp || update[sym].ltp || found.ltp };
            hasUpdate = true;
          }
        });
        return hasUpdate ? newState : prev;
      });
    };

    socket.on("market-update", handleUpdate);
    return () => socket.off("market-update", handleUpdate);
  }, [activeSymbol, token]);

  // --- EFFECT: Triggered when Expiry Changes (FIXED) ---
  useEffect(() => {
    if (selectedExpiry) {
      loadChainData(selectedExpiry);
    }
  }, [selectedExpiry, loadChainData]);

  const sortedStrikes = useMemo(() => {
    const all = [...new Set(Object.values(data).map(d => d.strike))].sort((a, b) => a - b);
    if (!all.length) return [];
    if (spotPrice > 0) {
      const closest = all.map(s => ({ s, diff: Math.abs(s - spotPrice) })).sort((a, b) => a.diff - b.diff).slice(0, selectedStrikeCount).map(x => x.s);
      return closest.sort((a, b) => a - b);
    }
    return all.slice(0, selectedStrikeCount);
  }, [data, spotPrice, selectedStrikeCount]);

  return (
    <div className="oc-container h-100 d-flex flex-column theme-adaptive">
      <div className="oc-header p-2 d-flex justify-content-between align-items-center border-bottom">
        <div className="d-flex align-items-center gap-2">
          <span className="fw-bold text-primary">{activeSymbol.split(":")[1]}</span>
          <span className="spot-price-tag">₹{spotPrice.toFixed(2)}</span>
        </div>
        <div className="d-flex gap-2">
          <select className="form-select-sm theme-select" value={selectedStrikeCount} onChange={e => setSelectedStrikeCount(Number(e.target.value))}>
            {[10, 20, 40].map(c => <option key={c} value={c}>{c} Strikes</option>)}
          </select>
          <select className="form-select-sm theme-select" value={selectedExpiry} onChange={e => setSelectedExpiry(e.target.value)}>
            {expiries.map(ex => (
              <option key={ex} value={ex}>
                {new Date(ex * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-grow-1 overflow-auto custom-scrollbar">
        <table className="oc-table w-100">
          <thead>
            <tr className="main-head">
              <th colSpan="3" className="text-success border-end border-oc">CALLS</th>
              <th className="border-oc">STRIKE</th>
              <th colSpan="3" className="text-danger border-start border-oc">PUTS</th>
            </tr>
            <tr className="sub-head">
               <th>OI</th><th>VOL</th><th className="border-end border-oc">LTP</th>
               <th></th>
               <th className="border-start border-oc">LTP</th><th>VOL</th><th>OI</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
                <tr><td colSpan="7" className="text-center py-5"><Spinner animation="border" variant="primary" /></td></tr>
            ) : sortedStrikes.length > 0 ? (
                sortedStrikes.map(strike => {
                    const ce = data[`${strike}_CE`] || { ltp: 0 };
                    const pe = data[`${strike}_PE`] || { ltp: 0 };
                    return (
                        <tr key={strike}>
                            <td className={strike < spotPrice ? "itm-cell" : ""}>{ce.oi || 0}</td>
                            <td className={strike < spotPrice ? "itm-cell" : ""}>{ce.volume || 0}</td>
                            <td className={`action-td border-end border-oc ${strike < spotPrice ? "itm-cell" : ""}`}>
                                <span className="ltp-val">{ce.ltp.toFixed(2)}</span>
                                <div className="trade-btns">
                                    <Button variant="success" size="sm" onClick={() => onTrade(ce, "BUY")}>B</Button>
                                    <Button variant="danger" size="sm" onClick={() => onTrade(ce, "SELL")}>S</Button>
                                </div>
                            </td>
                            <td className="strike-val">{strike}</td>
                            <td className={`action-td border-start border-oc ${strike > spotPrice ? "itm-cell" : ""}`}>
                                <span className="ltp-val">{pe.ltp.toFixed(2)}</span>
                                <div className="trade-btns">
                                    <Button variant="success" size="sm" onClick={() => onTrade(pe, "BUY")}>B</Button>
                                    <Button variant="danger" size="sm" onClick={() => onTrade(pe, "SELL")}>S</Button>
                                </div>
                            </td>
                            <td className={strike > spotPrice ? "itm-cell" : ""}>{pe.volume || 0}</td>
                            <td className={strike > spotPrice ? "itm-cell" : ""}>{pe.oi || 0}</td>
                        </tr>
                    );
                })
            ) : (
                <tr>
                    <td colSpan="7" className="text-center py-5">
                        <div className="empty-state">
                            <Layers size={40} className="text-muted mb-2" />
                            <h6 className="adaptive-text">ऑप्शन चेन उपलब्ध नहीं है</h6>
                            <p className="text-muted small">सिंबल {activeSymbol.split(":")[1]} के लिए डेटा नहीं मिला।</p>
                        </div>
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      <style>{`
  .theme-adaptive {
    --oc-bg: #ffffff;
    --oc-text: #212529;
    --oc-border: #eeeeee;
    --oc-header-bg: #fcfcfc;
    --oc-itm-bg: #fff9e6; /* Light Yellow for ITM */
    --oc-strike-bg: #f8f9fa;
    --oc-strike-text: #212529;
    background: var(--oc-bg);
    color: var(--oc-text);
  }

  [data-theme='dark'] .theme-adaptive {
    --oc-bg: #161b22;
    --oc-text: #c9d1d9;
    --oc-border: #30363d;
    --oc-header-bg: #0d1117;
    --oc-itm-bg: #1c2128; /* Darker Blue-grey for ITM */
    --oc-strike-bg: #0d1117;
    --oc-strike-text: #58a6ff;
  }

  .oc-header { background: var(--oc-header-bg); border-bottom: 1px solid var(--oc-border); }
  .theme-select { background: var(--oc-bg); color: var(--oc-text); border: 1px solid var(--oc-border); cursor: pointer; }
  
  .oc-table th { text-align: center; background: var(--oc-header-bg); border-bottom: 1px solid var(--oc-border); padding: 8px; font-size: 11px; }
  .oc-table td { text-align: center; border-bottom: 1px solid var(--oc-border); padding: 10px 4px; font-size: 12px; }
  .border-oc { border-color: var(--oc-border) !important; }

  .strike-val { text-align: center; background: var(--oc-strike-bg); font-weight: bold; color: var(--oc-strike-text); }
  .itm-cell { background: var(--oc-itm-bg) !important; }

  .adaptive-text { color: var(--oc-text); }
  .spot-price-tag { color: #f0b90b; font-weight: bold; background: rgba(240, 185, 11, 0.1); padding: 2px 6px; border-radius: 4px; }

  .action-td { position: relative; min-width: 85px; }
  .trade-btns { display: none; position: absolute; inset: 0; background: inherit; align-items: center; justify-content: center; gap: 4px; z-index: 2; }
  .action-td:hover .trade-btns { display: flex; }
  .action-td:hover .ltp-val { visibility: hidden; }
  
  .custom-scrollbar::-webkit-scrollbar { width: 4px; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: #30363d; border-radius: 10px; }
`}</style>
    </div>
  );
}