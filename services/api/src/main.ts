import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { configureAppSecurity } from './common/bootstrap/app-security';

async function bootstrap() {
  // bodyParser must be disabled at the Nest level so Better Auth (via the
  // @thallesp/nestjs-better-auth adapter) can read raw bodies for the
  // /api/auth/* routes. The adapter re-enables body parsing for the rest
  // of the app via its own `bodyParser` option in AuthModule.forRootAsync.
  const app = await NestFactory.create(AppModule, { bodyParser: false });

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
