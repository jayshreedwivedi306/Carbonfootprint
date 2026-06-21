"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.oauthLogin = oauthLogin;
exports.getMe = getMe;
exports.forgotPassword = forgotPassword;
exports.resetPassword = resetPassword;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const zod_1 = require("zod");
const db_1 = __importDefault(require("../db"));
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-carbon-footprint-mvp';
// Validation schemas
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters long'),
    role: zod_1.z.enum(['USER', 'ADMIN']).optional().default('USER'),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string(),
});
const oauthSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    oauthProvider: zod_1.z.string(),
    oauthId: zod_1.z.string(),
});
const forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
});
const resetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string().min(1),
    newPassword: zod_1.z.string().min(8, 'Password must be at least 8 characters long'),
});
function generateToken(user) {
    return jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1h' } // Short-lived token as per OWASP guidelines
    );
}
async function register(req, res) {
    try {
        const body = registerSchema.parse(req.body);
        // Check if user already exists
        const existingUser = await db_1.default.user.findUnique({
            where: { email: body.email.toLowerCase() },
        });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }
        // Hash password (OWASP strong password hashing)
        const salt = await bcryptjs_1.default.genSalt(12);
        const passwordHash = await bcryptjs_1.default.hash(body.password, salt);
        const user = await db_1.default.user.create({
            data: {
                email: body.email.toLowerCase(),
                passwordHash,
                role: body.role,
            },
        });
        const token = generateToken(user);
        return res.status(201).json({
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
            },
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: error.errors[0].message });
        }
        console.error('Registration error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
async function login(req, res) {
    try {
        const body = loginSchema.parse(req.body);
        const user = await db_1.default.user.findUnique({
            where: { email: body.email.toLowerCase() },
        });
        if (!user || !user.passwordHash) {
            // Avoid revealing whether the email exists for security
            return res.status(400).json({ error: 'Invalid email or password' });
        }
        const isMatch = await bcryptjs_1.default.compare(body.password, user.passwordHash);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }
        const token = generateToken(user);
        return res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
            },
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: error.errors[0].message });
        }
        console.error('Login error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
async function oauthLogin(req, res) {
    try {
        const body = oauthSchema.parse(req.body);
        let user = await db_1.default.user.findUnique({
            where: { email: body.email.toLowerCase() },
        });
        if (!user) {
            // Create user automatically for OAuth registration
            user = await db_1.default.user.create({
                data: {
                    email: body.email.toLowerCase(),
                    oauthProvider: body.oauthProvider,
                    oauthId: body.oauthId,
                    role: 'USER',
                },
            });
        }
        else {
            // Link OAuth provider if not already linked
            if (!user.oauthProvider) {
                user = await db_1.default.user.update({
                    where: { id: user.id },
                    data: {
                        oauthProvider: body.oauthProvider,
                        oauthId: body.oauthId,
                    },
                });
            }
        }
        const token = generateToken(user);
        return res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
            },
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: error.errors[0].message });
        }
        console.error('OAuth error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
async function getMe(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const user = await db_1.default.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                email: true,
                role: true,
                oauthProvider: true,
                createdAt: true,
            },
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        return res.json(user);
    }
    catch (error) {
        console.error('Fetch me error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
async function forgotPassword(req, res) {
    try {
        const body = forgotPasswordSchema.parse(req.body);
        const user = await db_1.default.user.findUnique({
            where: { email: body.email.toLowerCase() },
        });
        // Always respond with success to avoid email enumeration attacks
        if (!user || !user.passwordHash) {
            return res.json({
                message: 'If that email exists, a reset token has been generated.',
            });
        }
        // Generate a secure random token
        const rawToken = crypto_1.default.randomBytes(32).toString('hex');
        const tokenHash = crypto_1.default.createHash('sha256').update(rawToken).digest('hex');
        const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        await db_1.default.user.update({
            where: { id: user.id },
            data: {
                resetToken: tokenHash,
                resetTokenExpiry: expiry,
            },
        });
        // In production this token would be emailed. For this demo, return it directly.
        console.log(`[DEV] Password reset token for ${user.email}: ${rawToken}`);
        return res.json({
            message: 'Reset token generated successfully.',
            resetToken: rawToken, // Shown in UI for demo purposes (would be emailed in production)
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: error.errors[0].message });
        }
        console.error('Forgot password error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
async function resetPassword(req, res) {
    try {
        const body = resetPasswordSchema.parse(req.body);
        // Hash the incoming token to compare with stored hash
        const tokenHash = crypto_1.default.createHash('sha256').update(body.token).digest('hex');
        const user = await db_1.default.user.findFirst({
            where: {
                resetToken: tokenHash,
                resetTokenExpiry: { gt: new Date() }, // Token must not be expired
            },
        });
        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired reset token.' });
        }
        // Hash the new password
        const salt = await bcryptjs_1.default.genSalt(12);
        const passwordHash = await bcryptjs_1.default.hash(body.newPassword, salt);
        // Update password and clear reset token
        await db_1.default.user.update({
            where: { id: user.id },
            data: {
                passwordHash,
                resetToken: null,
                resetTokenExpiry: null,
            },
        });
        return res.json({ message: 'Password has been reset successfully. You can now sign in.' });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: error.errors[0].message });
        }
        console.error('Reset password error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
