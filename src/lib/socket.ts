import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

// Create a singleton socket connection
export const connectToSocket = (): Socket => {
  if (!socket) {
    // Connect to the socket server
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000', {
      path: '/api/socket',
      transports: ['websocket'],
      autoConnect: true,
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket?.id);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });
  }

  return socket;
};

// Subscribe to poll updates
export const subscribeToPoll = (pollId: string, callback: (data: any) => void) => {
  const socket = connectToSocket();
  
  // Join the poll room
  socket.emit('join_poll', { pollId });
  
  // Listen for vote updates
  socket.on('vote_cast', callback);
  
  return () => {
    socket.off('vote_cast', callback);
    socket.emit('leave_poll', { pollId });
  };
};

// Subscribe to real-time results
export const subscribeToResults = (pollId: string, callback: (data: any) => void) => {
  const socket = connectToSocket();
  
  // Join the results room
  socket.emit('join_results', { pollId });
  
  // Listen for result updates
  socket.on('results_update', callback);
  
  return () => {
    socket.off('results_update', callback);
    socket.emit('leave_results', { pollId });
  };
};

// Disconnect socket
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}; 