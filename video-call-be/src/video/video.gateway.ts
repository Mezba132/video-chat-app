import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway(5000, {
  cors: {
    origin: '*',
  },
})
export class VideoGateway {
  @WebSocketServer()
  server: Server;
  private activeUsers: Map<string, { userId: string; socketId: string }> =
    new Map();

  afterInit(server: Server) {
    console.log('Video Gateway Initialized');
  }

  handleConnection(client: Socket) {
    client.on('register', (userId: string) => {
      if (userId) {
        console.log('User registered:', userId);
        this.activeUsers.set(client.id, { userId, socketId: client.id });
      }
    });
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected:', client.id);
    this.activeUsers.delete(client.id);
  }
}
