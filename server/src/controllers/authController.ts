import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import prisma from '../db';
import { AuthenticatedRequest } from '../middleware/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-carbon-footprint-mvp';

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  role: z.enum(['USER', 'ADMIN']).optional().default('USER'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const oauthSchema = z.object({
  email: z.string().email(),
  oauthProvider: z.string(),
  oauthId: z.string(),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8, 'Password must be at least 8 characters long'),
});

function generateToken(user: { id: string; email: string; role: string }) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '1h' } // Short-lived token as per OWASP guidelines
  );
}

export async function register(req: AuthenticatedRequest, res: Response) {
  try {
    const body = registerSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password (OWASP strong password hashing)
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(body.password, salt);

    const user = await prisma.user.create({
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
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function login(req: AuthenticatedRequest, res: Response) {
  try {
    const body = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
    });

    if (!user || !user.passwordHash) {
      // Avoid revealing whether the email exists for security
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(body.password, user.passwordHash);
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
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function oauthLogin(req: AuthenticatedRequest, res: Response) {
  try {
    const body = oauthSchema.parse(req.body);

    let user = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
    });

    if (!user) {
      // Create user automatically for OAuth registration
      user = await prisma.user.create({
        data: {
          email: body.email.toLowerCase(),
          oauthProvider: body.oauthProvider,
          oauthId: body.oauthId,
          role: 'USER',
        },
      });
    } else {
      // Link OAuth provider if not already linked
      if (!user.oauthProvider) {
        user = await prisma.user.update({
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
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('OAuth error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getMe(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
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
  } catch (error) {
    console.error('Fetch me error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function forgotPassword(req: Request, res: Response) {
  try {
    const body = forgotPasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
    });

    // Always respond with success to avoid email enumeration attacks
    if (!user || !user.passwordHash) {
      return res.json({
        message: 'If that email exists, a reset token has been generated.',
      });
    }

    // Generate a secure random token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await prisma.user.update({
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
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Forgot password error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function resetPassword(req: Request, res: Response) {
  try {
    const body = resetPasswordSchema.parse(req.body);

    // Hash the incoming token to compare with stored hash
    const tokenHash = crypto.createHash('sha256').update(body.token).digest('hex');

    const user = await prisma.user.findFirst({
      where: {
        resetToken: tokenHash,
        resetTokenExpiry: { gt: new Date() }, // Token must not be expired
      },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token.' });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(body.newPassword, salt);

    // Update password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return res.json({ message: 'Password has been reset successfully. You can now sign in.' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Reset password error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
