import express from 'express';
import cors from 'cors';
import { productsRouter } from './routes/products.js';
import { cartRouter } from './routes/cart.js';
import { authRouter } from './routes/auth.js';
import { reviewsRouter, adminReviewsRouter } from './routes/reviews.js';
import { errorHandler } from './middleware/error.js';

export const app = express();

const corsOrigin = process.env.CORS_ORIGIN;
app.use(
  cors(
    corsOrigin
      ? { origin: corsOrigin.split(',').map((o) => o.trim()), credentials: true }
      : undefined,
  ),
);
app.use(express.json());

app.get('/', (_req, res) => {
  res.type('html').send(`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Zava API</title>
        <style>
          body {
            margin: 0;
            font-family: "Segoe UI", sans-serif;
            background: linear-gradient(135deg, #1a130f 0%, #2f221b 55%, #f2e8dc 55%, #f6f1ea 100%);
            color: #1f1814;
          }
          .shell {
            max-width: 980px;
            margin: 48px auto;
            background: rgba(255,255,255,0.86);
            border: 1px solid rgba(94, 64, 44, 0.14);
            border-radius: 28px;
            overflow: hidden;
            box-shadow: 0 30px 60px rgba(20, 14, 10, 0.22);
          }
          .hero {
            padding: 40px;
            background: radial-gradient(circle at top left, rgba(211, 144, 80, 0.36), transparent 40%), #1f1814;
            color: #f8f2ea;
          }
          .hero h1 {
            margin: 0 0 10px;
            font-size: 44px;
            letter-spacing: 0.08em;
          }
          .hero p {
            margin: 0;
            max-width: 640px;
            color: rgba(248, 242, 234, 0.8);
            line-height: 1.7;
          }
          .content {
            display: grid;
            grid-template-columns: 1.2fr 0.8fr;
            gap: 28px;
            padding: 32px 40px 40px;
          }
          .card {
            background: #fffdf9;
            border: 1px solid rgba(94, 64, 44, 0.12);
            border-radius: 22px;
            padding: 24px;
          }
          h2 {
            margin: 0 0 16px;
            font-size: 18px;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            color: #745845;
          }
          ul {
            margin: 0;
            padding-left: 18px;
            line-height: 1.8;
          }
          code, a {
            color: #8f4f2a;
          }
          .pill {
            display: inline-block;
            margin-right: 10px;
            margin-bottom: 10px;
            padding: 7px 12px;
            border-radius: 999px;
            background: #f2e8dc;
            color: #5b4334;
            font-size: 13px;
            font-weight: 600;
          }
          @media (max-width: 860px) {
            .content {
              grid-template-columns: 1fr;
            }
          }
        </style>
      </head>
      <body>
        <div class="shell">
          <div class="hero">
            <div class="pill">Zava Demo API</div>
            <h1>ZAVA</h1>
            <p>The API is running. Use this service for the premium coffee and lifestyle storefront demo, including products, cart flows, and JWT-backed demo accounts.</p>
          </div>
          <div class="content">
            <section class="card">
              <h2>Available Endpoints</h2>
              <ul>
                <li><a href="/api/health">/api/health</a> for service status</li>
                <li><a href="/api/products">/api/products</a> for catalog data</li>
                <li><code>/api/products/:id</code> for product details</li>
                <li><code>/api/cart</code> for the authenticated shopper cart</li>
                <li><code>/api/auth/login</code> and <code>/api/auth/register</code> for auth flows</li>
              </ul>
            </section>
            <section class="card">
              <h2>Demo Accounts</h2>
              <ul>
                <li>Customer: <code>customer@example.com</code> / <code>Customer123!</code></li>
                <li>Admin: <code>admin@zava.com</code> / <code>Admin123!</code></li>
              </ul>
            </section>
          </div>
        </div>
      </body>
    </html>
  `);
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'zava-api' });
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/cart', cartRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/admin/reviews', adminReviewsRouter);

// Error handling
app.use(errorHandler);
