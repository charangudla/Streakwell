import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';

export function configureAppSecurity(app: INestApplication): void {
  const configService = app.get(ConfigService);
  const corsOrigin = configService.get<string>('CORS_ORIGIN');
  const isProd = configService.get<string>('NODE_ENV') === 'production';

  const configured = corsOrigin
    ? corsOrigin.split(',').map((origin) => origin.trim()).filter(Boolean)
    : [];
  // Outside production, always allow the local web (:3001) and admin (:5173)
  // dev servers so the browser-based admin can call the API cross-origin
  // without anyone having to hand-edit CORS_ORIGIN in .env. Production uses
  // exactly the configured origins (which already include the prod
  // subdomains), or reflects any origin if CORS_ORIGIN is unset.
  const devOrigins = ['http://localhost:3001', 'http://localhost:5173'];
  const origin = isProd
    ? configured.length
      ? configured
      : true
    : [...new Set([...configured, ...devOrigins])];

  app.use(helmet());
  app.enableCors({
    origin,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
}
