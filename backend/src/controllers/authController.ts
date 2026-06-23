import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'YOUR_SUPER_SECRET_KEY_FOR_WEB_SIGNATURES';

// Helper to generate 6-digit verification code
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const register = async (req: Request, res: Response) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Name, email, and password are required fields.' });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'A user with this email address already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const verificationToken = generateOTP();

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        verificationToken,
        isVerified: false,
      },
    });

    console.log(`✉️ Email Simulation to ${email}: Verification code is ${verificationToken}`);

    return res.status(201).json({
      message: 'Registration successful. An OTP verification code has been dispatched.',
      userId: user.id,
      email: user.email,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Server error encountered during registration.' });
  }
};

export const verify = async (req: Request, res: Response) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: 'Email and OTP verification code are required.' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.verificationToken !== code) {
      return res.status(400).json({ error: 'Invalid verification code or email.' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationToken: null,
      },
    });

    return res.status(200).json({ message: 'Account successfully verified.' });
  } catch (error) {
    return res.status(500).json({ error: 'Server error during verification.' });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { onboarding: true }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials.' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ error: 'Account has not been verified. Please check your email for the OTP.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials.' });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    return res.status(200).json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isLoggedIn: true,
      },
      onboarding: user.onboarding,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Server error encountered during authentication.' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(200).json({ message: 'If this email exists in our records, a recovery code has been sent.' });
    }

    const resetToken = Math.random().toString(36).substring(2, 8).toUpperCase(); // Short code for demo convenience
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour expiry

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    console.log(`✉️ Email Simulation to ${email}: Password recovery code is ${resetToken}`);

    return res.status(200).json({ message: 'If this email exists in our records, a recovery code has been sent.' });
  } catch (error) {
    return res.status(500).json({ error: 'Server error during password recovery.' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const { token, newPassword, email } = req.body;

  if (!token || !newPassword || !email) {
    return res.status(400).json({ error: 'Token, new password, and email are required.' });
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        email,
        resetToken: token,
        resetTokenExpiry: { gte: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired password recovery token.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return res.status(200).json({ message: 'Password has been successfully updated.' });
  } catch (error) {
    return res.status(500).json({ error: 'Server error encountered during password reset.' });
  }
};
