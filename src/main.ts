import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as session from 'express-session';
import { TypeormStore } from 'connect-typeorm';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { Session } from './auth/entities/session.entity';
import * as bodyParser from 'body-parser';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';

async function bootstrap(configService: ConfigService) {
  const app = await NestFactory.create(AppModule);
  const sessionRepository = await app.get(DataSource).getRepository(Session);

  await app.use(
    session({
      secret: configService.get('SESSION_SECRET'),
      resave: false,
      saveUninitialized: false,
      name: 'session_nest',
      store: new TypeormStore().connect(sessionRepository),
      cookie: {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        secure: configService.get('NODE_ENV') === 'production',
      },
    }),
  );
  await app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );
  await app.enableCors();
  await app.use(bodyParser.json({ limit: '100mb' }));
  await app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));
  await app.use(cookieParser());
  await app.listen(configService.get('PORT') ?? 3000);
}
bootstrap(new ConfigService());
