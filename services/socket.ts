import { io } from 'socket.io-client';

export const socket = io('http://localhost:5001/'); // Change to your backend URL if needed 
// export const socket = io('https://bhav-backend.onrender.com/'); // Change to your backend URL if needed 