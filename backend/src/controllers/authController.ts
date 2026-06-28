import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'YOUR_SUPER_SECRET_KEY_FOR_WEB_SIGNATURES';

export const register = async (req: Request, res: Response) => {
  const { firstName, lastName, password } = req.body;

  if (!firstName || !lastName || !password) {
    return res.status(400).json({ error: 'First name, last name, and password are required fields.' });
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: {
        firstName_lastName: { firstName, lastName },
      },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'A user with this name already exists. Please sign in.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        passwordHash,
      },
      include: {
        onboarding: true
      }
    });

    // Auto-login: generate JWT token directly
    const token = jwt.sign({ userId: user.id, email: '' }, JWT_SECRET, { expiresIn: '7d' });

    return res.status(201).json({
      message: 'Registration successful.',
      token,
      user: {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: '',
        profileImage: user.profileImage || '',
        isLoggedIn: true,
      },
      onboarding: user.onboarding,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Server error encountered during registration.' });
  }
};

export const login = async (req: Request, res: Response) => {
  const { firstName, lastName, password } = req.body;

  if (!firstName || !lastName || !password) {
    return res.status(400).json({ error: 'First name, last name, and password are required.' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: {
        firstName_lastName: { firstName, lastName },
      },
      include: { onboarding: true },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid name or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid name or password.' });
    }

    const token = jwt.sign({ userId: user.id, email: '' }, JWT_SECRET, { expiresIn: '7d' });

    return res.status(200).json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: '',
        profileImage: user.profileImage || '',
        isLoggedIn: true,
      },
      onboarding: user.onboarding,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Server error encountered during authentication.' });
  }
};

import { AuthenticatedRequest } from '../middleware/authMiddleware';

export const updateProfileImage = async (req: AuthenticatedRequest, res: Response) => {
  const { image } = req.body;
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized: User ID not found in request context.' });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { profileImage: image || null },
    });

    return res.status(200).json({
      message: 'Profile image updated successfully.',
      profileImage: updatedUser.profileImage || '',
    });
  } catch (error) {
    console.error('Update profile image error:', error);
    return res.status(500).json({ error: 'Server error encountered while updating profile image.' });
  }
};
