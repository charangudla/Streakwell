import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.module';
import { configureAppSecurity } from './common/bootstrap/app-security';

async function bootstrap() {
  // bodyParser must be disabled at the Nest level so Better Auth (via the
  // @thallesp/nestjs-better-auth adapter) can read raw bodies for the
  // /api/auth/* routes. The adapter re-enables body parsing for the rest
  // of the app via its own `bodyParser` option in AuthModule.forRootAsync.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });

  // Surface the real client IP to Express's `req.ip` (and therefore to
  // Better Auth's per-route rate limiter). Locally this lets Better Auth
  // see the LAN IP of the iPhone; in production behind nginx on Hostinger
  // it picks up the X-Forwarded-For chain. Without this, Better Auth logs
  // "Rate limiting skipped: could not determine client IP address" on
  // every request and the rate limit silently no-ops.
  app.set('trust proxy', true);

  const configService = app.get(ConfigService);
  const port = Number(
    configService.get<string>('PORT') ??
      configService.get<string>('API_PORT') ??
      3000,
  );

  configureAppSecurity(app);

  await app.listen(port);
}
void bootstrap();
