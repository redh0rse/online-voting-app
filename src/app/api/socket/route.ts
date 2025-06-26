import { Server, Socket } from 'socket.io';
import { NextResponse } from 'next/server';

// Define type for socket events
interface ServerToClientEvents {
  vote_cast: (data: any) => void;
  results_update: (data: any) => void;
}

interface ClientToServerEvents {
  join_poll: (data: { pollId: string }) => void;
  leave_poll: (data: { pollId: string }) => void;
  join_results: (data: { pollId: string }) => void;
  leave_results: (data: { pollId: string }) => void;
}

// Extend the NodeJS.Global interface to include our custom properties
declare global {
  var socketIO: Server<ClientToServerEvents, ServerToClientEvents> | undefined;
}

const socketHandler = async (req: Request) => {
  // Check for an existing socket.io server in the global scope
  if (!global.socketIO) {
    console.log('Initializing Socket.io server...');
    
    const io = new Server<ClientToServerEvents, ServerToClientEvents>({
      path: '/api/socket',
      cors: {
        origin: process.env.NEXT_PUBLIC_URL || '*',
        methods: ['GET', 'POST'],
      },
      addTrailingSlash: false,
    });

    // Socket.io events
    io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
      console.log('Client connected:', socket.id);

      // Join a poll room
      socket.on('join_poll', ({ pollId }) => {
        console.log(`Socket ${socket.id} joined poll ${pollId}`);
        socket.join(`poll:${pollId}`);
      });

      // Leave a poll room
      socket.on('leave_poll', ({ pollId }) => {
        console.log(`Socket ${socket.id} left poll ${pollId}`);
        socket.leave(`poll:${pollId}`);
      });

      // Join a results room
      socket.on('join_results', ({ pollId }) => {
        console.log(`Socket ${socket.id} joined results ${pollId}`);
        socket.join(`results:${pollId}`);
      });

      // Leave a results room
      socket.on('leave_results', ({ pollId }) => {
        console.log(`Socket ${socket.id} left results ${pollId}`);
        socket.leave(`results:${pollId}`);
      });

      // Disconnect
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });

    // Start the server
    await new Promise<void>((resolve) => {
      const httpServer = require('http').createServer();
      io.attach(httpServer);

      httpServer.listen(process.env.SOCKET_PORT || 3001, () => {
        console.log(`Socket.io server running on port ${process.env.SOCKET_PORT || 3001}`);
        resolve();
      });
    });

    // Store the socket.io server in the global scope
    global.socketIO = io;
  }

  return new NextResponse('Socket.io server is running', { status: 200 });
};

export { socketHandler as GET };

// Helper function to emit events to all clients in a room
export const emitToRoom = (room: string, event: string, data: any) => {
  if (global.socketIO) {
    global.socketIO.to(room).emit(event as keyof ServerToClientEvents, data);
  }
}; 