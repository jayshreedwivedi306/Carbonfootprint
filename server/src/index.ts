import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

dotenv.config();

import { authenticateJWT } from './middleware/auth';
import {
  register,
  login,
  oauthLogin,
  getMe,
  forgotPassword,
  resetPassword,
} from './controllers/authController';
import {
  submitLog,
  getLogs,
  getAnalytics,
  exportCSV,
} from './controllers/calculatorController';
import {
  getSuggestions,
  adoptSuggestion,
  getAdoptedSuggestions,
  completeSuggestion,
  deleteAdoptedSuggestion,
} from './controllers/suggestionsController';

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middleware (OWASP alignment)
app.use(helmet());
app.use(cors({
  origin: '*', // In production, replace with specific domains
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Rate Limiter to mitigate brute force & DDoS
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Auth Routes
app.post('/api/auth/register', register);
app.post('/api/auth/login', login);
app.post('/api/auth/oauth', oauthLogin);
app.get('/api/auth/me', authenticateJWT as any, getMe);
app.post('/api/auth/forgot-password', forgotPassword);
app.post('/api/auth/reset-password', resetPassword);

// Calculator Routes
app.post('/api/calculator/log', authenticateJWT as any, submitLog);
app.get('/api/calculator/logs', authenticateJWT as any, getLogs);
app.get('/api/calculator/analytics', authenticateJWT as any, getAnalytics);
app.get('/api/calculator/export', authenticateJWT as any, exportCSV);

// Suggestions Routes
app.get('/api/suggestions', authenticateJWT as any, getSuggestions);
app.post('/api/suggestions/adopt', authenticateJWT as any, adoptSuggestion);
app.get('/api/suggestions/adopted', authenticateJWT as any, getAdoptedSuggestions);
app.put('/api/suggestions/adopted/:id/complete', authenticateJWT as any, completeSuggestion);
app.delete('/api/suggestions/adopted/:id', authenticateJWT as any, deleteAdoptedSuggestion);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
