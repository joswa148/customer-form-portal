import axios from 'axios';

// Use environment variable for API URL in production, fallback to localhost for development if missing
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a response interceptor for global error handling if needed in the future
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // You can handle global errors here (e.g., logging out on 401)
        return Promise.reject(error);
    }
);

export default api;
