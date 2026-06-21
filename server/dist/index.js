"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const auth_1 = require("./middleware/auth");
const authController_1 = require("./controllers/authController");
const calculatorController_1 = require("./controllers/calculatorController");
const suggestionsController_1 = require("./controllers/suggestionsController");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Security Middleware (OWASP alignment)
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: '*', // In production, replace with specific domains
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express_1.default.json());
// Rate Limiter to mitigate brute force & DDoS
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: { error: 'Too many requests from this IP, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);
// Auth Routes
app.post('/api/auth/register', authController_1.register);
app.post('/api/auth/login', authController_1.login);
app.post('/api/auth/oauth', authController_1.oauthLogin);
app.get('/api/auth/me', auth_1.authenticateJWT, authController_1.getMe);
app.post('/api/auth/forgot-password', authController_1.forgotPassword);
app.post('/api/auth/reset-password', authController_1.resetPassword);
// Calculator Routes
app.post('/api/calculator/log', auth_1.authenticateJWT, calculatorController_1.submitLog);
app.get('/api/calculator/logs', auth_1.authenticateJWT, calculatorController_1.getLogs);
app.get('/api/calculator/analytics', auth_1.authenticateJWT, calculatorController_1.getAnalytics);
app.get('/api/calculator/export', auth_1.authenticateJWT, calculatorController_1.exportCSV);
// Suggestions Routes
app.get('/api/suggestions', auth_1.authenticateJWT, suggestionsController_1.getSuggestions);
app.post('/api/suggestions/adopt', auth_1.authenticateJWT, suggestionsController_1.adoptSuggestion);
app.get('/api/suggestions/adopted', auth_1.authenticateJWT, suggestionsController_1.getAdoptedSuggestions);
app.put('/api/suggestions/adopted/:id/complete', auth_1.authenticateJWT, suggestionsController_1.completeSuggestion);
app.delete('/api/suggestions/adopted/:id', auth_1.authenticateJWT, suggestionsController_1.deleteAdoptedSuggestion);
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date() });
});
// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
