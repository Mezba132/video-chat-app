// src/chat.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway(7000, {
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private users: Record<string, string> = {};

  afterInit(server: Server) {
    console.log('Chat Gateway Initialized');
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    delete this.users[client.id];
  }

  @SubscribeMessage('join')
  handleJoin(
    @MessageBody() username: string,
    @ConnectedSocket() client: Socket,
  ) {
    this.users[client.id] = username;
    client.emit('joined', `Welcome ${username}!`);
  }

  @SubscribeMessage('message')
  handleMessage(
    @MessageBody() data: { recipient: string; message: string },
    @ConnectedSocket() client: Socket,
  ) {
    const recipientSocketId = Object.keys(this.users).find(
      (key) => this.users[key] === data.recipient,
    );

    if (recipientSocketId) {
      this.server.to(recipientSocketId).emit('message', {
        sender: this.users[client.id],
        message: data.message,
      });
    } else {
      client.emit('error', 'User not connected');
    }
  }
}
