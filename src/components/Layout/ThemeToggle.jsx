import React, { useState, useEffect } from 'react';

const ThemeToggle = () => {
  // Local storage se purani pasand check karein, nahi toh 'dark' rakhein
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    // HTML tag par theme attribute set karein
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <button 
      onClick={toggleTheme}
      className="btn btn-sm border-thin text-main"
      style={{
        backgroundColor: 'var(--bg-dark)',
        color: 'var(--text-main)',
        padding: '5px 10px',
        borderRadius: '5px'
      }}
    >
      {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
    </button>
  );
};

export default ThemeToggle;