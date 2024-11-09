import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  let port = 8000;
  const config = new DocumentBuilder()
    .setTitle('Vido Call App')
    .setDescription('a simple video call application')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  app.listen(port, () => {
    console.log('-----------------------------------------------');
    console.log(`App is running on port ${port}`);
    console.log('-----------------------------------------------');
  });
}

bootstrap();
