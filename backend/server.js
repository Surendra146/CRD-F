require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const errorHandler = require('./middlewares/errorHandler');
const fs = require('fs');
const path = require('path');

const authRoutes = require('./routes/auth.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const excelRoutes = require('./routes/excel.routes');
const analyticsRoutes = require('./routes/analytics.routes');

const app = express();
const PORT = process.env.PORT || 8001;

// Trust proxy for rate limiting in production
app.set('trust proxy', true);

connectDB();

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

const corsOrigins = process.env.CORS_ORIGINS === '*' 
  ? '*' 
  : process.env.CORS_ORIGINS.split(',');

app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/', limiter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/dashboards', dashboardRoutes);
app.use('/api/excel', excelRoutes);
app.use('/api/analytics', analyticsRoutes);

app.use(errorHandler);

const seedAdmin = async () => {
  try {
    const User = require('./models/User');
    const Tenant = require('./models/Tenant');
    const { hashPassword, verifyPassword } = require('./utils/helpers');
    
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@crm.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
    
    let defaultTenant = await Tenant.findOne({ subdomain: 'default' });
    
    if (!defaultTenant) {
      defaultTenant = new Tenant({
        name: 'Default Tenant',
        subdomain: 'default'
      });
      await defaultTenant.save();
      console.log('Created default tenant');
    }
    
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (!existingAdmin) {
      const password_hash = await hashPassword(adminPassword);
      const admin = new User({
        email: adminEmail,
        password_hash,
        name: 'Admin User',
        role: 'admin',
        tenantId: defaultTenant._id
      });
      await admin.save();
      console.log('Admin user created successfully');
    } else {
      const isPasswordValid = await verifyPassword(adminPassword, existingAdmin.password_hash);
      if (!isPasswordValid) {
        const password_hash = await hashPassword(adminPassword);
        existingAdmin.password_hash = password_hash;
        await existingAdmin.save();
        console.log('Admin password updated');
      }
    }
    
    const credentialsPath = '/app/memory/test_credentials.md';
    const credentialsDir = path.dirname(credentialsPath);
    
    if (!fs.existsSync(credentialsDir)) {
      fs.mkdirSync(credentialsDir, { recursive: true });
    }
    
    const credentialsContent = `# Test Credentials

## Admin Account
- Email: ${adminEmail}
- Password: ${adminPassword}
- Role: admin

## Auth Endpoints
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me
- POST /api/auth/refresh
- POST /api/auth/forgot-password
- POST /api/auth/reset-password

## Dashboard Endpoints
- POST /api/dashboards (create)
- GET /api/dashboards (list)
- GET /api/dashboards/:id (get by id)
- PUT /api/dashboards/:id (update)
- DELETE /api/dashboards/:id (soft delete)

## Excel Endpoints
- POST /api/excel/upload
- POST /api/excel/map-columns
- GET /api/excel/:dashboardId

## Analytics Endpoints
- GET /api/analytics/:dashboardId
- GET /api/analytics/:dashboardId/filters
- GET /api/analytics/:dashboardId/raw
`;
    
    fs.writeFileSync(credentialsPath, credentialsContent);
    console.log('Test credentials written to /app/memory/test_credentials.md');
    
  } catch (error) {
    console.error('Error seeding admin:', error);
  }
};

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`Server running on port ${PORT}`);
  await seedAdmin();
});