import React, { useState, useEffect, useMemo } from "react";
import { Container, Row, Col, Card } from "react-bootstrap";
import socket from "../services/socket";
import Navigation from "../components/Layout/Navbar";
import MarketWatch from "../components/Layout/MarketWatch";
import Orders from "../components/Dashboard/OrderBook";
import Positions from "../components/Dashboard/Positions";
import OrderModal from "../components/Dashboard/OrderModal";
import Holdings from "../components/Dashboard/Holdings";
import Profile from "../components/Dashboard/Profile";
import SimpleChart from "../components/Dashboard/SimpleChart";
import MarketDepth from "../components/MarketDepth";
import OptionChain from "./OptionChain";
import Funds from "./Dashboard/Funds";

const Dashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState("DASHBOARD");
  const [marketLiveData, setMarketLiveData] = useState({});
  const [orders, setOrders] = useState([]);
  const [positions, setPositions] = useState([]);
  const [funds, setFunds] = useState(150000.00); // Initial Capital
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");
  const [brokerageRate, setBrokerageRate] = useState(20); // Flat Rate ₹20

  const [selectedWatchlistSymbol, setSelectedWatchlistSymbol] = useState("NSE:NIFTY50-INDEX");
  const [showOrder, setShowOrder] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [orderType, setOrderType] = useState("BUY");

  // --- THEME & SOCKET SETUP ---
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => (prev === "dark" ? "light" : "dark"));

  useEffect(() => {
    socket.on("market-update", (data) => {
      if (data) setMarketLiveData(prev => ({ ...prev, ...data }));
    });
    return () => socket.off("market-update");
  }, []);

  // --- LIVE CALCULATIONS ---
  const totalPnL = useMemo(() => {
    if (!positions.length) return 0;
    return positions.reduce((acc, pos) => {
      const ltp = marketLiveData?.[pos.symbol]?.lp || pos.price || 0;
      return acc + ((ltp - pos.price) * pos.qty);
    }, 0);
  }, [positions, marketLiveData]);

  const liveAvailableMargin = funds + totalPnL;

  // --- TRADE HANDLERS ---
  const triggerTrade = (stock, type) => {
    setSelectedStock(stock);
    setOrderType(type);
    setShowOrder(true);
  };

  const handleOrderSubmit = (qty, price, side, product) => {
    const q = parseInt(qty);
    const p = parseFloat(price);
    const totalValue = q * p;
    const marginReq = product === "MIS" ? (totalValue / 5) : totalValue;
    const flatBrokerage = parseFloat(brokerageRate);

    // 1. Validation Logic
    if (side === "BUY" && liveAvailableMargin < (marginReq + flatBrokerage)) {
      alert("Insufficient Margin including brokerage!");
      return;
    }

    // 2. Create Order Entry
    const newOrder = {
      id: `ORD-${Math.floor(Math.random() * 90000)}`,
      time: new Date().toLocaleTimeString(),
      symbol: selectedStock.symbol,
      displayName: selectedStock.s || selectedStock.symbol,
      qty: q,
      price: p,
      side: side,
      product: product,
      status: "COMPLETE"
    };

    setOrders(prev => [newOrder, ...prev]);

    // 3. Update Positions (Net Quantity Logic)
    setPositions(prev => {
      const idx = prev.findIndex(i => i.symbol === selectedStock.symbol && i.product === product);

      if (idx > -1) {
        let updated = [...prev];
        const currentPos = updated[idx];
        const newQty = side === "BUY" ? currentPos.qty + q : currentPos.qty - q;

        if (newQty === 0) return updated.filter((_, i) => i !== idx); // Square off complete

        updated[idx] = {
          ...currentPos,
          qty: newQty,
          price: (side === "BUY" && currentPos.qty > 0) ?
            ((currentPos.price * currentPos.qty) + (p * q)) / (currentPos.qty + q) :
            currentPos.price
        };
        return updated;
      }
      return [...prev, { ...newOrder, qty: side === "BUY" ? q : -q }];
    });

    // 4. Update Funds (Flat Deduction)
    setFunds(prev => {
      // Jab trade enter hota hai tab capital block hota hai aur brokerage katti hai
      if (side === "BUY") return prev - marginReq - flatBrokerage;
      // Sell side par capital release hota hai aur brokerage katti hai
      return prev + marginReq - flatBrokerage;
    });

    setShowOrder(false);
  };

  const handleExit = (pos) => {
    if (!pos) return;
    const currentLTP = marketLiveData[pos.symbol]?.lp || marketLiveData[pos.symbol]?.ltp || pos.price;
    const side = pos.qty > 0 ? "SELL" : "BUY";
    const exitQty = Math.abs(pos.qty);

    setSelectedStock({
      symbol: pos.symbol,
      s: pos.displayName || pos.symbol,
      p: currentLTP
    });

    handleOrderSubmit(exitQty, currentLTP, side, pos.product);
  };
  // Dashboard.js के अंदर
  const handleOpenOptionChain = (symbol) => {
    setSelectedWatchlistSymbol(symbol); // सिंबल अपडेट करें 🎯
    setActiveTab("OPTION_CHAIN");       // टैब बदलें 📑
  };
  return (
    <div className="vh-100 d-flex flex-column main-wrapper" data-theme={theme}>
      <Navigation
        activeTab={activeTab} setActiveTab={setActiveTab}
        onLogout={onLogout} funds={liveAvailableMargin}
        toggleTheme={toggleTheme} theme={theme}
      />

      <Container fluid className="p-0 flex-grow-1 mt-5 overflow-hidden">
        <Row className="g-0 h-100">
          {/* Watchlist Sidebar */}
          <Col lg={3} md={4} className="border-end border-thin h-100 bg-sidebar">
            <MarketWatch
              activeSymbol={selectedWatchlistSymbol}
              onSymbolClick={(item) => setSelectedWatchlistSymbol(item.symbol)}
              onTrade={triggerTrade}
              onOpenOC={(symbol) => {
                setSelectedWatchlistSymbol(symbol);
                setActiveTab("OPTION_CHAIN");
              }}
            />
          </Col>

          {/* Dynamic Content Area */}
          <Col lg={9} md={8} className="p-4 overflow-auto h-100 custom-scrollbar">
            {activeTab === "DASHBOARD" && (
              <Row className="g-3">
                <Col md={12}>
                  <Card className="card-custom p-3 border-0 shadow-sm">
                    <h6 className="text-secondary mb-2">Live Chart: {selectedWatchlistSymbol}</h6>
                    <SimpleChart data={marketLiveData} symbol={selectedWatchlistSymbol} />
                  </Card>
                </Col>
              </Row>
            )}

            {activeTab === "OPTION_CHAIN" && <OptionChain symbol={selectedWatchlistSymbol} onTrade={triggerTrade} />}
            {activeTab === "MARKET_DEPTH" && <MarketDepth symbol={selectedWatchlistSymbol} />}
            {activeTab === "PROFILE" && <Profile onLogout={onLogout} brokerageRate={brokerageRate} setBrokerageRate={setBrokerageRate} funds={liveAvailableMargin} />}
            {activeTab === "HOLDINGS" && <Holdings liveData={marketLiveData} />}
            {activeTab === "ORDERS" && <Orders orders={orders} brokerageRate={brokerageRate} />}
            {activeTab === "POSITIONS" && <Positions positions={positions} liveData={marketLiveData} onExit={handleExit} />}
            {activeTab === "FUNDS" && <Funds funds={liveAvailableMargin} />}
          </Col>
        </Row>
      </Container>

      {/* Shared Order Modal */}
      {selectedStock && (
        <OrderModal
          show={showOrder} handleClose={() => setShowOrder(false)}
          stock={selectedStock} type={orderType}
          onSubmit={handleOrderSubmit} liveData={marketLiveData}
          funds={liveAvailableMargin}
          flatBrokerageRate={brokerageRate}
        />
      )}
    </div>
  );
};

export default Dashboard;