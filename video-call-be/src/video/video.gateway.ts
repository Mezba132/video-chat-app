import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  transports: ['websocket', 'polling'],
  wssEngine: ['ws', 'wss'],
  path: '/socket',
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
    console.log('WebSocket Gateway Initialized');
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

  @SubscribeMessage('send-message')
  handleSendMessage(
    client: Socket,
    data: { toUserId: string; message: string },
  ) {
    const senderInfo = this.activeUsers.get(client.id);
    const senderUserId = senderInfo ? senderInfo.userId : null;
    const targetUserInfo = Array.from(this.activeUsers.values()).find(
      (user) => user.userId === data.toUserId,
    );
    const targetSocketId = targetUserInfo ? targetUserInfo.socketId : null;

    if (senderUserId) {
      const messagePayload = {
        sender: senderUserId,
        message: data.message,
      };

      client.emit('private-message', messagePayload);

      if (targetSocketId) {
        this.server.to(targetSocketId).emit('private-message', messagePayload);
      } else {
        console.log('User not connected');
      }
    }
  }

  @SubscribeMessage('connection-success')
  handleSuccessMessage(client: Socket, receiverId: String) {
    const senderInfo = this.activeUsers.get(client.id);
    const senderUserId = senderInfo ? senderInfo.userId : null;
    const targetUserInfo = Array.from(this.activeUsers.values()).find(
      (user) => user.userId === receiverId,
    );
    console.log('remoteId', receiverId);
    const targetSocketId = targetUserInfo ? targetUserInfo.socketId : null;
    if (targetSocketId) {
      this.server.to(targetSocketId).emit('success-message');
    } else {
      console.log('User not connected');
    }
  }

  @SubscribeMessage('make-call')
  async handleCallUser(
    client: Socket,
    data: {
      callerId: string;
      receiverId: string;
    },
  ) {
    console.log(`call-user event from ${data.callerId} to ${data.receiverId}`);

    const targetUserInfo = Array.from(this.activeUsers.values()).find(
      (user) => user.userId === data.receiverId,
    );
    const targetSocketId = targetUserInfo ? targetUserInfo.socketId : null;

    if (targetSocketId) {
      this.server.to(targetSocketId).emit('new-call', {
        callerId: data.callerId,
      });
    } else {
      client.emit('call-error', { message: 'User not connected' });
      console.log('User not connected');
    }
  }
}
