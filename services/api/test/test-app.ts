import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { configureAppSecurity } from '../src/common/bootstrap/app-security';
import { PrismaService } from '../src/prisma/prisma.service';

const prismaStub: Pick<
  PrismaService,
  '$connect' | '$disconnect' | 'onModuleInit' | 'onModuleDestroy'
> = {
  $connect: () => Promise.resolve(),
  $disconnect: () => Promise.resolve(),
  onModuleInit: () => Promise.resolve(),
  onModuleDestroy: () => Promise.resolve(),
};

export async function createTestApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(PrismaService)
    .useValue(prismaStub)
    .compile();

  const app = moduleFixture.createNestApplication();
  configureAppSecurity(app);
  await app.init();

  return app;
}
