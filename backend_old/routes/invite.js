const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const Invite = require('../models/Invite');
const authMiddleware = require('../middleware/auth');

// POST /api/invite — Create a new invite (admin only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Guest name is required.' });
    }

    const token = uuidv4();
    const invite = new Invite({ name: name.trim(), email: email || '', token });
    await invite.save();

    // Generate the QR code data URL for preview
    const qrUrl = `${process.env.FRONTEND_URL}/guest/${token}`;
    const qrDataUrl = await QRCode.toDataURL(qrUrl, { width: 300, margin: 2 });

    res.status(201).json({ success: true, invite, qrUrl, qrDataUrl });
  } catch (err) {
    console.error('Create invite error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/invite/:token — Fetch invite by token (public, for guest page)
router.get('/:token', async (req, res) => {
  try {
    const invite = await Invite.findOne({ token: req.params.token });
    if (!invite) {
      return res.status(404).json({ success: false, message: 'Invite not found.' });
    }
    // Return safe public data only
    res.json({
      success: true,
      invite: {
        name: invite.name,
        token: invite.token,
        used: invite.used,
        createdAt: invite.createdAt,
      },
    });
  } catch (err) {
    console.error('Get invite error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/invites — List all invites (admin only)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const invites = await Invite.find().sort({ createdAt: -1 });
    res.json({ success: true, invites });
  } catch (err) {
    console.error('List invites error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// DELETE /api/invite/:id — Delete an invite (admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const invite = await Invite.findByIdAndDelete(req.params.id);
    if (!invite) {
      return res.status(404).json({ success: false, message: 'Invite not found.' });
    }
    res.json({ success: true, message: 'Invite deleted.' });
  } catch (err) {
    console.error('Delete invite error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// PATCH /api/invite/:id/reset — Reset used status (admin only)
router.patch('/:id/reset', authMiddleware, async (req, res) => {
  try {
    const invite = await Invite.findByIdAndUpdate(
      req.params.id,
      { used: false, usedAt: null },
      { new: true }
    );
    if (!invite) {
      return res.status(404).json({ success: false, message: 'Invite not found.' });
    }
    res.json({ success: true, invite });
  } catch (err) {
    console.error('Reset invite error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
