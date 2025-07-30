import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_BASE_URL = "https://bhav-backend.onrender.com"; // your backend

const API = axios.create({
    baseURL: "https://bhav-backend.onrender.com/api",
    headers: {
        "Content-Type": "application/json",
    },
});

// Add request interceptor to include auth token
API.interceptors.request.use(
    async (config) => {
        try {
            const token = await AsyncStorage.getItem('auth-storage');
            if (token) {
                const parsedToken = JSON.parse(token);
                if (parsedToken.state?.token) {
                    config.headers.Authorization = `Bearer ${parsedToken.state.token}`;
                }
            }
        } catch (error) {
            console.error('Error getting auth token:', error);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor for better error handling
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Handle unauthorized access
            console.log('Unauthorized access, redirecting to login');
            // You can dispatch a logout action here if needed
        }
        return Promise.reject(error);
    }
);

export default API;
