import { Module } from '@nestjs/common';
import { VideoGateway } from './video/video.gateway';

@Module({
  providers: [VideoGateway],
})
export class AppModule {}
