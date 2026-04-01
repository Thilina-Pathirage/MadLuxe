/*
  MADLAXUE API ROUTES
  ===================
  GET    /api/health
  GET    /api/dashboard/stats

  GET    /api/categories
  POST   /api/categories
  GET    /api/categories/:id
  PUT    /api/categories/:id
  DELETE /api/categories/:id

  GET    /api/product-types?category=id
  POST   /api/product-types
  GET    /api/product-types/:id
  PUT    /api/product-types/:id
  DELETE /api/product-types/:id

  GET    /api/colors
  POST   /api/colors
  GET    /api/colors/:id
  PUT    /api/colors/:id
  DELETE /api/colors/:id

  GET    /api/variants?category=&productType=&size=&color=&search=&lowStock=&page=&limit=
  GET    /api/public/batches?category=&productType=&search=&inStock=&page=&limit=
  GET    /api/variants/low-stock/count
  GET    /api/variants/:id
  POST   /api/variants
  PUT    /api/variants/:id
  DELETE /api/variants/:id

  GET    /api/stock-movements?type=&variant=&category=&dateFrom=&dateTo=&page=&limit=
  POST   /api/stock-movements/stock-in
  POST   /api/stock-movements/adjust

  GET    /api/orders?status=&couponApplied=&dateFrom=&dateTo=&search=&page=&limit=
  GET    /api/orders/:id
  POST   /api/orders
  PATCH  /api/orders/:id/cancel

  GET    /api/coupons
  POST   /api/coupons
  GET    /api/coupons/:id
  PUT    /api/coupons/:id
  PATCH  /api/coupons/:id/toggle
  DELETE /api/coupons/:id
  POST   /api/coupons/validate

  GET    /api/finance/summary?period=monthly&year=2025
  GET    /api/finance/breakdown?period=monthly&year=2025&category=id&page=1&limit=25
  GET    /api/finance/top-selling?limit=5&period=monthly&month=2025-01
  GET    /api/finance/manual-entries?type=income&dateFrom=2026-01-01&dateTo=2026-01-31&page=1&limit=25
  POST   /api/finance/manual-entries
  PUT    /api/finance/manual-entries/:id
  DELETE /api/finance/manual-entries/:id

  POST   /api/images/upload/:variantId  (multipart/form-data, field: images)
  PUT    /api/images/:variantId/primary/:imageId
  DELETE /api/images/:variantId/:imageId
*/

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Security headers
app.use(helmet());

// CORS
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
app.use(
  cors({
    origin: (origin, cb) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin || allowedOrigins.includes(origin.trim())) return cb(null, true);
      return cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

// Rate limiting
app.use(
  '/api/',
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// Auth routes (unprotected — must come before the protect middleware)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/images/file', require('./routes/publicImages'));

// Public data routes (no auth required)
app.get('/api/public/categories', require('./controllers/categoryController').getAll);
app.get('/api/public/banners', require('./controllers/websiteSettingsController').getPublicBanners);
app.get('/api/public/batches', require('./controllers/publicShopController').getPublicBatches);
app.get('/api/public/variants', require('./controllers/publicShopController').getPublicVariants);
app.get('/api/public/variants/:id', require('./controllers/publicShopController').getPublicVariantById);
app.get('/api/public/product-types', require('./controllers/publicShopController').getPublicProductTypes);
app.get('/api/public/settings', require('./controllers/publicShopController').getPublicSettings);
app.post('/api/public/delivery/quote', require('./controllers/publicShopController').quotePublicDelivery);
app.get('/api/public/top-selling', require('./controllers/publicShopController').getPublicTopSelling);
app.get('/api/public/gallery', require('./controllers/websiteSettingsController').getPublicGallery);

// Public order creation — optionally links to customer account
const { optionalCustomerAuth } = require('./middleware/customerProtect');
app.post('/api/public/orders', optionalCustomerAuth, require('./controllers/publicOrderController').createPublicOrder);

// Customer auth & profile routes (uses customerProtect internally per-route)
app.use('/api/public/customer', require('./routes/customerAuth'));

// Apply JWT protection to all subsequent /api/* routes
app.use('/api', require('./middleware/protect'));

// Protected routes
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/product-types', require('./routes/productTypes'));
app.use('/api/colors', require('./routes/colors'));
app.use('/api/variants', require('./routes/variants'));
app.use('/api/images', require('./routes/images'));
app.use('/api/stock-movements', require('./routes/stockMovements'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/coupons', require('./routes/coupons'));
app.use('/api/finance', require('./routes/finance'));
app.use('/api/settings', require('./routes/settings'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;
