import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  let port = 8000;

  app.listen(port, () => {
    console.log('-----------------------------------------------');
    console.log(`App is running on port ${port}`);
    console.log('-----------------------------------------------');
  });
}

bootstrap();
