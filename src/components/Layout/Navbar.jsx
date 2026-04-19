import React from "react";
import { Navbar, Nav, Container, Badge } from "react-bootstrap";
// Lucide icons: Sun aur Moon ko add kiya hai theme ke liye
import { 
  LayoutDashboard, BookOpen, PieChart, Activity, 
  Wallet, User, LogOut, BarChart3, ListTree, Sun, Moon 
} from "lucide-react";

const Navigation = ({ activeTab, setActiveTab, onLogout, funds, toggleTheme, theme }) => {
  // 1. Navigation links mein "Option Chain" add kiya
  const navLinks = [
    { id: "DASHBOARD", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { id: "ORDERS", label: "Orders", icon: <BookOpen size={18} /> },
    { id: "HOLDINGS", label: "Holdings", icon: <PieChart size={18} /> },
    { id: "POSITIONS", label: "Positions", icon: <Activity size={18} /> },
    { id: "OPTION_CHAIN", label: "Option Chain", icon: <ListTree size={18} /> }, // Naya Tab
    { id: "MARKET_DEPTH", label: "Market Depth", icon: <BarChart3 size={18} /> },
    { id: "FUNDS", label: "Funds", icon: <Wallet size={18} /> },
  ];

  return (
    <Navbar fixed="top" bg={theme === "dark" ? "black" : "light"} variant={theme === "dark" ? "dark" : "light"} className="border-bottom border-secondary py-1 shadow-sm main-nav">
      <Container fluid className="px-3">
        
        {/* Brand/Logo */}
        <Navbar.Brand href="#" onClick={(e) => { e.preventDefault(); setActiveTab("DASHBOARD"); }} className="fw-bold fs-5 text-info d-flex align-items-center gap-2">
          <div className="bg-info rounded-circle p-1 d-flex align-items-center justify-content-center" style={{width: '28px', height: '28px'}}>
            <Activity size={18} className="text-black" />
          </div>
          <span className="d-none d-sm-block">TRADE PRO</span>
        </Navbar.Brand>

        {/* Center Nav Links */}
        <Nav className="mx-auto gap-1 d-none d-md-flex">
          {navLinks.map((link) => (
            <Nav.Link
              key={link.id}
              active={activeTab === link.id}
              onClick={() => setActiveTab(link.id)}
              className={`d-flex align-items-center gap-2 px-3 py-2 rounded-2 transition-all nav-item-custom ${
                activeTab === link.id ? "text-info active-tab" : "text-secondary hover-text-main"
              }`}
              style={{ fontSize: '13px' }}
            >
              {link.icon}
              {link.label}
            </Nav.Link>
          ))}
        </Nav>

        {/* Right Side Items */}
        <Nav className="ms-auto align-items-center gap-2">
          
          {/* --- THEME CHANGER BUTTON --- */}
          <div 
            className={`p-2 rounded-circle cursor-pointer theme-toggle-btn transition-all ${theme === 'dark' ? 'text-warning' : 'text-primary'}`}
            onClick={toggleTheme}
            title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
            style={{ cursor: 'pointer' }}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </div>

          <div className="d-flex flex-column align-items-end me-2 d-none d-sm-flex ms-2">
            <small className="text-secondary fw-medium" style={{ fontSize: '9px', letterSpacing: '0.5px' }}>AVAILABLE MARGIN</small>
            <span className="text-success fw-bold" style={{ fontSize: '14px' }}>
              ₹{funds?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <Badge 
            bg={theme === 'dark' ? "dark" : "secondary"} 
            className="border border-secondary py-2 px-3 text-white d-flex align-items-center gap-2 cursor-pointer profile-badge ms-2"
            onClick={() => setActiveTab("PROFILE")}
          >
            <User size={14} />
            <span className="d-none d-lg-block">USER123</span>
          </Badge>

          <div 
            className="text-secondary hover-text-danger cursor-pointer p-1 transition-all ms-2" 
            onClick={onLogout}
            title="Logout"
            style={{ cursor: 'pointer' }}
          >
            <LogOut size={20} />
          </div>
        </Nav>
      </Container>

      <style>{`
        .transition-all { transition: all 0.2s ease; }
        .main-nav { background-color: var(--bg-black) !important; }
        
        /* Light/Dark mode specific hover */
        .hover-text-main:hover { 
          color: var(--text-info) !important; 
          background: rgba(13, 202, 240, 0.1); 
        }
        
        .theme-toggle-btn:hover {
          background: rgba(128, 128, 128, 0.15);
          transform: rotate(15deg);
        }

        .hover-text-danger:hover { color: #ff4d4d !important; transform: scale(1.1); }
        .profile-badge:hover { border-color: #0dcaf0 !important; color: #0dcaf0 !important; }
        
        .nav-item-custom.active-tab {
           background: rgba(13, 202, 240, 0.1) !important;
           position: relative;
        }

        .active-tab::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 15%;
          right: 15%;
          height: 2px;
          background: #0dcaf0;
          box-shadow: 0 0 8px #0dcaf0;
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .nav-item-custom { padding: 8px !important; }
        }
      `}</style>
    </Navbar>
  );
};

export default Navigation;