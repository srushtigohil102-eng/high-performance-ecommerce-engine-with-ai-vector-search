const { io } = require('socket.io-client');
const socket = io('http://localhost:5000');
const userId = '6a6cc5e41d861da580673182';

socket.on('connect', () => {
  console.log('✅ Connected! Socket ID:', socket.id);
  socket.emit('join-user', userId);
  console.log('✅ Joined user room:', userId);
  socket.emit('join-admin');
  console.log('✅ Joined admin room');
});

socket.on('order-update', (data) => console.log('📦 Order:', data));
socket.on('admin-order-update', (data) => console.log('📋 Admin:', data));
socket.on('stock-alert', (data) => console.log('⚠️ Stock:', data));
socket.on('disconnect', () => console.log('❌ Disconnected'));

console.log('🔌 Listening... Press Ctrl+C to stop.');
setInterval(() => {}, 1000);
