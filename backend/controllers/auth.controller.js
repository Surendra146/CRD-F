const { validationResult } = require('express-validator');
const User = require('../models/User');
const Tenant = require('../models/Tenant');
const LoginAttempt = require('../models/LoginAttempt');
const PasswordResetToken = require('../models/PasswordResetToken');
const { hashPassword, verifyPassword, generateToken } = require('../utils/helpers');
const { createAccessToken, createRefreshToken, verifyToken } = require('../config/jwt');
const fs = require('fs');
const path = require('path');

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000;

class AuthController {
  async register(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      const { email, password, name, tenantName, role } = req.body;
      
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({ error: 'Email already registered' });
      }
      
      let tenant;
      if (tenantName) {
        const subdomain = tenantName.toLowerCase().replace(/[^a-z0-9]/g, '-');
        tenant = new Tenant({
          name: tenantName,
          subdomain
        });
        await tenant.save();
      } else {
        tenant = await Tenant.findOne();
        if (!tenant) {
          tenant = new Tenant({
            name: 'Default Tenant',
            subdomain: 'default'
          });
          await tenant.save();
        }
      }
      
      const password_hash = await hashPassword(password);
      
      const user = new User({
        email,
        password_hash,
        name,
        role: role || 'viewer',
        tenantId: tenant._id
      });
      
      await user.save();
      
      const accessToken = createAccessToken(user._id, user.email, user.role, tenant._id);
      const refreshToken = createRefreshToken(user._id);
      
      res.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000,
        path: '/'
      });
      
      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/'
      });
      
      res.status(201).json({
        user: user.toJSON(),
        tenant: {
          _id: tenant._id,
          name: tenant.name,
          subdomain: tenant.subdomain
        }
      });
    } catch (error) {
      next(error);
    }
  }
  
  async login(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      const { email, password } = req.body;
      const ip = req.ip || req.connection.remoteAddress;
      const identifier = `${ip}:${email}`;
      
      const loginAttempt = await LoginAttempt.findOne({ identifier });
      
      if (loginAttempt && loginAttempt.lockedUntil && loginAttempt.lockedUntil > new Date()) {
        const remainingTime = Math.ceil((loginAttempt.lockedUntil - new Date()) / 1000 / 60);
        return res.status(429).json({ 
          error: `Too many failed attempts. Please try again in ${remainingTime} minutes.` 
        });
      }
      
      const user = await User.findOne({ email }).populate('tenantId');
      
      if (!user) {
        await this.recordFailedAttempt(identifier);
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      
      const isValidPassword = await verifyPassword(password, user.password_hash);
      
      if (!isValidPassword) {
        await this.recordFailedAttempt(identifier);
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      
      if (!user.isActive) {
        return res.status(403).json({ error: 'Account is deactivated' });
      }
      
      await LoginAttempt.deleteOne({ identifier });
      
      const accessToken = createAccessToken(user._id, user.email, user.role, user.tenantId._id);
      const refreshToken = createRefreshToken(user._id);
      
      res.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000,
        path: '/'
      });
      
      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/'
      });
      
      res.json({
        user: user.toJSON(),
        tenant: {
          _id: user.tenantId._id,
          name: user.tenantId.name,
          subdomain: user.tenantId.subdomain
        }
      });
    } catch (error) {
      next(error);
    }
  }
  
  async recordFailedAttempt(identifier) {
    let attempt = await LoginAttempt.findOne({ identifier });
    
    if (!attempt) {
      attempt = new LoginAttempt({ identifier, attempts: 1 });
    } else {
      attempt.attempts += 1;
      
      if (attempt.attempts >= MAX_LOGIN_ATTEMPTS) {
        attempt.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION);
      }
    }
    
    await attempt.save();
  }
  
  async logout(req, res, next) {
    try {
      res.clearCookie('access_token', { path: '/' });
      res.clearCookie('refresh_token', { path: '/' });
      
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  }
  
  async me(req, res, next) {
    try {
      res.json({ user: req.user.toJSON() });
    } catch (error) {
      next(error);
    }
  }
  
  async refresh(req, res, next) {
    try {
      const refreshToken = req.cookies.refresh_token;
      
      if (!refreshToken) {
        return res.status(401).json({ error: 'No refresh token provided' });
      }
      
      const decoded = verifyToken(refreshToken);
      
      if (!decoded || decoded.type !== 'refresh') {
        return res.status(401).json({ error: 'Invalid refresh token' });
      }
      
      const user = await User.findById(decoded.userId).populate('tenantId');
      
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }
      
      const newAccessToken = createAccessToken(user._id, user.email, user.role, user.tenantId._id);
      
      res.cookie('access_token', newAccessToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000,
        path: '/'
      });
      
      res.json({ message: 'Token refreshed successfully' });
    } catch (error) {
      next(error);
    }
  }
  
  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      
      const user = await User.findOne({ email });
      
      if (!user) {
        return res.json({ message: 'If the email exists, a reset link has been sent' });
      }
      
      const token = generateToken();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      
      const resetToken = new PasswordResetToken({
        userId: user._id,
        token,
        expiresAt
      });
      
      await resetToken.save();
      
      console.log(`\n========== PASSWORD RESET LINK ==========`);
      console.log(`Email: ${email}`);
      console.log(`Reset Link: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`);
      console.log(`Token expires at: ${expiresAt.toISOString()}`);
      console.log(`=========================================\n`);
      
      res.json({ message: 'If the email exists, a reset link has been sent' });
    } catch (error) {
      next(error);
    }
  }
  
  async resetPassword(req, res, next) {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ error: 'Token and new password are required' });
      }
      
      const resetToken = await PasswordResetToken.findOne({ token, used: false });
      
      if (!resetToken) {
        return res.status(400).json({ error: 'Invalid or expired reset token' });
      }
      
      if (resetToken.expiresAt < new Date()) {
        return res.status(400).json({ error: 'Reset token has expired' });
      }
      
      const password_hash = await hashPassword(newPassword);
      
      await User.findByIdAndUpdate(resetToken.userId, { password_hash });
      
      resetToken.used = true;
      await resetToken.save();
      
      res.json({ message: 'Password reset successfully' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();