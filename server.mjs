import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import connectDB from './src/config/db.mjs';
import studentRoutes from './src/routes/studentRoutes.mjs'; 

const app = express();
const port = process.env.PORT || 3000;

// Global Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health and Root Route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to the ATI System API',
    endpoints: {
      health: '/api/health',
      students: '/api/students',
      stats: '/api/students/stats/overview',
    },
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/students', studentRoutes);

// 404 Not Found Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API Route Not Found - ${req.originalUrl}`,
  });
});

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(`[Error] ${err.message}`);

  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Internal Server Error';

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((item) => item.message)
      .join(', ');
  }

  // Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    statusCode = 409;
    const duplicatedField = Object.keys(err.keyValue || {})[0] || 'field';
    message = `Duplicate value for '${duplicatedField}'. A record with this value already exists.`;
  }

  // Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Resource not found with invalid ID format: ${err.value}`;
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

await connectDB();

app.listen(port, () => {
  console.log(`ATI System Server running on http://localhost:${port}`);
});