import { io } from 'socket.io-client';
const systemIP = require('./ip.js');
//export const socket = io(`http://${systemIP}:5001/`); // Change to your backend URL if needed 
export const socket = io('https://bhav-backend-0b70.onrender.com/'); // Change to your backend URL if needed 