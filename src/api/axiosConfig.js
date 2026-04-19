// src/api/axiosConfig.js
import axios from 'axios';

const API = axios.create({
    baseURL: 'http://localhost:5000',
});

API.interceptors.request.use((config) => {
    // 💡 हर बार रिक्वेस्ट भेजने से पहले टोकन को ताज़ा करें
    const token = localStorage.getItem('token'); 
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default API;