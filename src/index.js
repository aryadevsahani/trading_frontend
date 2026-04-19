import React from 'react';
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css'; // पहले यह
import './index.css';                         // फिर यह (आपकी फाइल)
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(<App />);