import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import systemIP from '../services/ip.js';

//export const API_BASE_URL = `http://${systemIP}:5001/api`; // your backend
export const API_BASE_URL = "https://bhav-backend-0b70.onrender.com"; // your backend

const API = axios.create({
    baseURL: "https://bhav-backend-0b70.onrender.com/api",
    //baseURL: `http://${systemIP}:5001/api`,
    headers: {
        "Content-Type": "application/json",
    },
});

// Add request interceptor to include auth token
API.interceptors.request.use(
    async (config) => {
        try {
            // Read token from secure storage (expo-secure-store)
            const token = await SecureStore.getItemAsync('auth_token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.error('Error getting auth token from SecureStore:', error);
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
