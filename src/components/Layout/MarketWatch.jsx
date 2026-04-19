import React, { useState, useEffect } from "react";
import { Form, Button, Spinner } from "react-bootstrap";
import { Search, Trash2, Plus, BarChart2, Layers } from "lucide-react";
import socket from "../../services/socket";
import { useNavigate } from "react-router-dom";

const MarketWatch = ({ onTrade, activeSymbol, onOpenOC }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("accessToken");

  // --- 1. GET WATCHLIST ---
  useEffect(() => {
    const fetchWatchlist = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/watchlist", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const json = await response.json();
        if (json.success) {
          setItems(json.data.map(item => ({
            s: item.short_symbol || item.symbol.split(":")[1] || item.symbol,
            symbol: item.symbol,
            p: "0.00", chg: "0.00", pct: "0.00%", up: true
          })));
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    if (token) fetchWatchlist();
  }, [token]);

  // --- 2. SEARCH API ---
  useEffect(() => {
    const controller = new AbortController();
    const fetchSearch = async () => {
      if (searchTerm.trim().length > 0) {
        try {
          const response = await fetch(
            `http://localhost:5000/api/symbols/search?q=${encodeURIComponent(searchTerm)}`,
            { signal: controller.signal }
          );
          const json = await response.json();
          if (json.success) setSearchResults(json.data);
        } catch (err) { if (err.name !== "AbortError") setSearchResults([]); }
      } else { setSearchResults([]); }
    };
    const timer = setTimeout(fetchSearch, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [searchTerm]);

  // --- 3. SOCKET UPDATES (Fixed & Optimized) ---
  useEffect(() => {
    if (items.length > 0) {
      const symbols = items.map((i) => i.symbol);

      // Backend ko batayein ki hume in symbols ka data chahiye
      const timer = setTimeout(() => {
        socket.emit("subscribe-watchlist", symbols);
      }, 500);

      const handleUpdate = (liveData) => {
        // liveData format: { "NSE:SBIN-EQ": { lp: 600, ch: 5, cp: 0.8 }, ... }
        setItems((prevItems) =>
          prevItems.map((item) => {
            const update = liveData[item.symbol];

            if (update) {
              return {
                ...item,
                p: update.lp.toFixed(2), // Price
                chg: update.ch.toFixed(2), // Change
                pct: update.cp.toFixed(2) + "%", // Change Percentage
                up: update.ch >= 0, // Green/Red Logic
              };
            }
            return item;
          })
        );
      };

      socket.on("market-update", handleUpdate);

      return () => {
        clearTimeout(timer);
        socket.off("market-update", handleUpdate);
      };
    }
  }, [items.length]); // Items load hone par socket activate hoga

  const addItem = async (res) => {
    try {
      const response = await fetch("http://localhost:5000/api/watchlist/add", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ symbol: res.symbol })
      });
      const json = await response.json();
      if (json.success) {
        setItems(prev => [...prev, {
          s: res.short_symbol || res.symbol.split(":")[1],
          symbol: res.symbol,
          p: "0.00", chg: "0.00", pct: "0.00%", up: true
        }]);
        setSearchTerm("");
        setSearchResults([]);
      }
    } catch (err) { console.error(err); }
  };

  const deleteItem = (e, symbol) => {
    e.stopPropagation();
    fetch(`http://localhost:5000/api/watchlist`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` , "Content-Type": "application/json"},
      body: JSON.stringify({ symbol })
    }).then(() => setItems(prev => prev.filter(i => i.symbol !== symbol)));
  };

  const isIndex = (symbol) => symbol.toLowerCase().includes('index');

  return (
    <div className="watchlist-container h-100 d-flex flex-column theme-sync">
      {/* Search Header */}
      <div className="p-3 border-bottom bg-main">
        <div className="search-bar d-flex align-items-center px-3 py-1">
          <Search size={16} className="text-muted me-2" />
          <Form.Control
            className="border-0 shadow-none p-1 bg-transparent adaptive-input"
            placeholder="Search & Add..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Watchlist Body */}
      <div className="flex-grow-1 overflow-auto custom-scrollbar">
        {searchTerm.length > 0 ? (
          searchResults.map((res) => (
            <div key={res.symbol} className="item-row d-flex align-items-center justify-content-between px-3 py-3 border-bottom">
              <div>
                <span className="fw-bold adaptive-text">{res.short_symbol || res.symbol.split(":")[1]}</span>
                <small className="text-muted ms-2" style={{ fontSize: '10px' }}>{res.symbol.split(":")[0]}</small>
              </div>
              <Button variant="success" size="sm" onClick={() => addItem(res)}>+ ADD</Button>
            </div>
          ))
        ) : (
          items.map((item) => (
            <div key={item.symbol} className="item-row-wrapper border-bottom">
              <div className="item-row d-flex align-items-center justify-content-between px-3 py-3">

                {/* Symbol Name */}
                <div className="symbol-part">
                  <span className={`fw-bold ${item.up ? "text-success" : "text-danger"}`}>{item.s}</span>
                </div>

                {/* LTP Section (Visible by Default) */}
                <div className="price-part text-end">
                  <div className={`fw-bold ${item.up ? "text-success" : "text-danger"}`}>{item.p}</div>
                  <small className="text-muted" style={{ fontSize: '11px' }}>
                    {item.chg} <span className="ms-1">({item.pct})</span>
                  </small>
                </div>

                {/* Buttons Overlay (Only on Hover) */}
                <div className="hover-buttons-overlay align-items-center justify-content-end">
                  {!isIndex(item.symbol) && (
                    <>
                      <Button variant="primary" size="sm" className="mx-1 px-3 fw-bold btn-kite" onClick={() => onTrade(item, "BUY")}>B</Button>
                      <Button variant="danger" size="sm" className="mx-1 px-3 fw-bold btn-kite" onClick={() => onTrade(item, "SELL")}>S</Button>
                    </>
                  )}
                  <button className="icon-btn-kite" onClick={() => navigate(`/chart/${item.symbol}`)} title="Chart"><BarChart2 size={16} /></button>
                  <button className="icon-btn-kite" onClick={() => onOpenOC(item.symbol)} title="Option Chain"><Layers size={16} /><span className="oc-label">OC</span></button>
                  <button className="icon-btn-kite text-danger" onClick={(e) => deleteItem(e, item.symbol)}><Trash2 size={16} /></button>
                </div>

              </div>
            </div>
          ))
        )}
      </div>

      <style>{`
        .theme-sync {
          --bg-main: #ffffff;
          --text-main: #212529;
          --border: #eeeeee;
          --hover-bg: #fcfcfc;
          --search: #f8f9fa;
          background: var(--bg-main);
          color: var(--text-main);
        }

        .dark .theme-sync, [data-theme='dark'] .theme-sync {
          --bg-main: #161b22;
          --text-main: #c9d1d9;
          --border: #30363d;
          --hover-bg: #21262d;
          --search: #0d1117;
        }

        .search-bar { background: var(--search); border-radius: 4px; border: 1px solid var(--border); }
        .adaptive-input { color: var(--text-main) !important; }
        
        .item-row-wrapper { position: relative; }
        .item-row { min-height: 60px; transition: background 0.1s; cursor: pointer; }
        
        .item-row-wrapper:hover .item-row { background: var(--hover-bg); }
        
        /* HOVER LOGIC */
        .hover-buttons-overlay {
          display: none; 
          position: absolute; 
          right: 0; top: 0; bottom: 0; 
          width: 75%; 
          background: var(--hover-bg);
          padding-right: 10px;
          z-index: 10;
        }

        .item-row-wrapper:hover .hover-buttons-overlay { display: flex; }
        .item-row-wrapper:hover .price-part { visibility: hidden; }

        /* BUTTON STYLES */
        .btn-kite { font-size: 11px; border-radius: 2px; height: 28px; display: flex; align-items: center; }
        .icon-btn-kite { background: none; border: none; padding: 8px; color: var(--text-main); display: flex; align-items: center; opacity: 0.7; }
        .icon-btn-kite:hover { opacity: 1; transform: scale(1.1); }
        .oc-label { font-size: 9px; font-weight: bold; margin-left: 2px; }

        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #888; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default MarketWatch;