const bcrypt         = require('bcryptjs');
const jwt            = require('jsonwebtoken');
const UserModel      = require('../models/userModel');
const VolunteerModel = require('../models/volunteerModel');

const JWT_SECRET = process.env.JWT_SECRET || 'w2w_super_secret_key_change_in_production';

/* ── Safe Request Format Helper ────────────────────────── */
function isJsonRequest(req) {
  try {
    if (req.xhr) return true;
    const accept = (req.headers && req.headers.accept) || (typeof req.get === 'function' && req.get('accept')) || '';
    const contentType = (req.headers && req.headers['content-type']) || (typeof req.get === 'function' && req.get('content-type')) || '';
    return accept.includes('application/json') || contentType.includes('application/json');
  } catch (e) {
    return false;
  }
}

/* ── Role → dashboard redirect helper ───────────────────── */
async function getRedirectUrl(role, userId) {
  try {
    if (!role) return '/storefront';
    const r = role.toString().trim().toLowerCase();
    if (r === 'citizen') return '/dashboard/citizen';
    if (r === 'volunteer') {
      if (userId) {
        try {
          const profile = await VolunteerModel.findByUserId(userId);
          return profile ? '/volunteer/profile' : '/volunteer/register';
        } catch (e) {
          return '/volunteer/register';
        }
      }
      return '/volunteer/register';
    }
    if (r === 'bhangarishop' || r === 'bhangari') return '/dashboard/bhangari';
    if (r === 'creator') return '/dashboard/creator';
    if (r === 'admin') return '/dashboard/admin/waste-portal';
    return '/storefront';
  } catch (err) {
    console.error('getRedirectUrl error:', err);
    return '/dashboard/citizen';
  }
}

const AuthController = {
  /* ── Register ──────────────────────────────────────────── */
  async register(req, res) {
    try {
      let { name, email, password, role } = req.body || {};

      name = (name || '').trim();
      email = (email || '').trim().toLowerCase();

      const isJson = isJsonRequest(req);

      if (!name || !email || !password) {
        if (isJson) return res.status(400).json({ error: 'Name, email, and password are required' });
        return res.status(400).send('<h2>400 Bad Request</h2><p>Name, email, and password are required.</p><a href="/register">Back to Register</a>');
      }
      if (password.length < 6) {
        if (isJson) return res.status(400).json({ error: 'Password must be at least 6 characters' });
        return res.status(400).send('<h2>400 Bad Request</h2><p>Password must be at least 6 characters.</p><a href="/register">Back to Register</a>');
      }

      const validRoles = ['Citizen', 'Volunteer', 'BhangariShop', 'Creator', 'Admin'];
      if (role && !validRoles.includes(role)) {
        if (isJson) return res.status(400).json({ error: 'Invalid role selected' });
        return res.status(400).send('<h2>400 Bad Request</h2><p>Invalid role selected.</p><a href="/register">Back to Register</a>');
      }

      const existing = await UserModel.findByEmail(email);
      if (existing && existing.email && existing.email.toLowerCase() === email) {
        if (isJson) return res.status(409).json({ error: 'Email already registered' });
        return res.status(409).send('<h2>409 Conflict</h2><p>Email already registered.</p><a href="/login">Sign In Here</a>');
      }

      const hashed = await bcrypt.hash(password, 10);
      const user   = await UserModel.create({ name, email, password: hashed, role: role || 'Citizen' });

      const token = jwt.sign(
        { id: user.id, name: user.name, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.cookie('token', token, {
        httpOnly: true,
        secure:   process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path:     '/',
        maxAge:   24 * 60 * 60 * 1000
      });

      const redirectUrl = await getRedirectUrl(user.role, user.id);

      if (isJson) {
        return res.status(201).json({
          message:  'Registration successful',
          redirect: redirectUrl
        });
      }

      return res.redirect(redirectUrl);
    } catch (err) {
      console.error('Register error:', err);
      if (isJsonRequest(req)) {
        return res.status(500).json({ error: 'Registration failed. Please try again.' });
      }
      res.status(500).send('<h2>500 Internal Error</h2><p>Registration failed. Please try again.</p><a href="/register">Try Again</a>');
    }
  },

  /* ── Login ─────────────────────────────────────────────── */
  async login(req, res) {
    try {
      let { email, password } = req.body || {};
      email = (email || '').trim().toLowerCase();

      const isJson = isJsonRequest(req);

      if (!email || !password) {
        if (isJson) return res.status(400).json({ error: 'Email and password are required' });
        return res.status(400).send('<h2>400 Bad Request</h2><p>Email and password are required.</p><a href="/login">Back to Login</a>');
      }

      const user = await UserModel.findByEmail(email);
      if (!user) {
        if (isJson) return res.status(401).json({ error: 'Invalid email or password' });
        return res.status(401).send('<h2>401 Unauthorized</h2><p>Invalid email or password.</p><a href="/login">Try Again</a>');
      }

      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        if (isJson) return res.status(401).json({ error: 'Invalid email or password' });
        return res.status(401).send('<h2>401 Unauthorized</h2><p>Invalid email or password.</p><a href="/login">Try Again</a>');
      }

      const token = jwt.sign(
        { id: user.id, name: user.name, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.cookie('token', token, {
        httpOnly: true,
        secure:   process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path:     '/',
        maxAge:   24 * 60 * 60 * 1000
      });

      const redirectUrl = await getRedirectUrl(user.role, user.id);

      if (isJson) {
        return res.json({
          message:  'Login successful',
          redirect: redirectUrl
        });
      }

      return res.redirect(redirectUrl);
    } catch (err) {
      console.error('Login error:', err);
      if (isJsonRequest(req)) {
        return res.status(500).json({ error: 'Login failed. Please try again.' });
      }
      res.status(500).send('<h2>500 Internal Error</h2><p>Login failed.</p><a href="/login">Try Again</a>');
    }
  },

  /* ── Logout ────────────────────────────────────────────── */
  logout(req, res) {
    res.clearCookie('token', { path: '/' });
    if (req.headers && req.headers.accept && req.headers.accept.includes('text/html')) {
      return res.redirect('/login');
    }
    res.json({ message: 'Logged out successfully', redirect: '/login' });
  },

  /* ── Current user profile ──────────────────────────────── */
  async me(req, res) {
    try {
      const user = await UserModel.findById(req.user.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.json(user);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch user data' });
    }
  },

  /* ── Update Role ───────────────────────────────────────── */
  async updateRole(req, res) {
    try {
      const { role } = req.body || {};
      const validRoles = ['Citizen', 'Volunteer', 'BhangariShop', 'Creator'];
      
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: 'Invalid role selected' });
      }

      // Update role in DB
      await UserModel.updateRole(req.user.id, role);

      // Fetch updated user to reissue token
      const user = await UserModel.findById(req.user.id);
      
      const token = jwt.sign(
        { id: user.id, name: user.name, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.cookie('token', token, {
        httpOnly: true,
        secure:   process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path:     '/',
        maxAge:   24 * 60 * 60 * 1000
      });

      const redirectUrl = await getRedirectUrl(user.role, user.id);
      res.json({ message: `Successfully upgraded to ${role}!`, redirect: redirectUrl });
    } catch (err) {
      console.error('Update role error:', err);
      res.status(500).json({ error: 'Failed to update role' });
    }
  }
};

module.exports = AuthController;
