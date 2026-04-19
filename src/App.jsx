import React, { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./components/Login";
import Signup from "./components/Signup";
import Dashboard from "./components/Dashboard";
import OptionChain from "./components/OptionChain";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = () => setIsAuthenticated(true);
  const handleLogout = () => setIsAuthenticated(false);

  return (
    <BrowserRouter>
      <Routes>

        {/* 🔐 Auth Routes */}
        {!isAuthenticated ? (
          <>
            <Route path="/" element={<Login onLogin={handleLogin} goToSignup={() => window.location.href = '/signup'} />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/option-chain/:symbol" element={<OptionChain />} />
          </>
        ) : (
          <>
            {/* 🏠 Dashboard */}
            <Route path="/" element={<Dashboard onLogout={handleLogout} />} />

            {/* 🔥 Option Chain Page */}
            <Route path="/option-chain/:symbol" element={<OptionChain />} />
          </>
        )}

      </Routes>
    </BrowserRouter>
  );
}

export default App;