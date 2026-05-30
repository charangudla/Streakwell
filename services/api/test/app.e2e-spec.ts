import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './test-app';

type HealthResponse = {
  status: string;
  service: string;
  timestamp: string;
};

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    app = (await createTestApp()) as INestApplication<App>;
  });

  it('/ (GET)', () => {
    return request(app.getHttpAdapter().getInstance() as App)
      .get('/')
      .expect(200)
      .expect({
        message: 'Vital30 API is running',
      });
  });

  it('/health (GET)', async () => {
    const response = await request(app.getHttpAdapter().getInstance() as App)
      .get('/health')
      .expect(200);

    expect(response.body).toMatchObject({
      status: 'ok',
      service: 'vital30-api',
    });
    expect(typeof (response.body as HealthResponse).timestamp).toBe('string');
  });

  it('adds security headers with Helmet', async () => {
    const response = await request(
      app.getHttpAdapter().getInstance() as App,
    ).get('/health');

    expect(response.headers['x-dns-prefetch-control']).toBe('off');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
  });

  it('returns CORS headers for the configured admin origin', async () => {
    const response = await request(app.getHttpAdapter().getInstance() as App)
      .get('/health')
      .set('Origin', 'http://localhost:5173');

    expect(response.headers['access-control-allow-origin']).toBe(
      'http://localhost:5173',
    );
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });
});
