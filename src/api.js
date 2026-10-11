// This file manages the connection to your backend
// If you have a VITE_API_URL environment variable (set in Vercel/Netlify), it uses that.
// Otherwise, it defaults to your local computer.
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

import axios from 'axios';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export default api;
