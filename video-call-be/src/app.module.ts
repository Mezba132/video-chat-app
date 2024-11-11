import { Module } from '@nestjs/common';
import { VideoGateway } from './video/video.gateway';
import { ChatGateway } from './chat/chat.gateway';

@Module({
  providers: [VideoGateway, ChatGateway],
})
export class AppModule {}
