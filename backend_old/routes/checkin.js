const express = require('express');
const router = express.Router();
const Invite = require('../models/Invite');

// POST /api/checkin — THE CORE SECURITY ENDPOINT
// Receives a token, validates it, marks as used atomically
router.post('/', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token || token.trim() === '') {
      return res.status(400).json({
        success: false,
        status: 'INVALID',
        message: 'No token provided.',
      });
    }

    // Find the invite by token
    const invite = await Invite.findOne({ token: token.trim() });

    if (!invite) {
      return res.status(404).json({
        success: false,
        status: 'INVALID',
        message: 'This QR code is not recognized.',
      });
    }

    if (invite.used) {
      return res.status(409).json({
        success: false,
        status: 'USED',
        message: `Already checked in. Used at ${new Date(invite.usedAt).toLocaleString()}.`,
        guestName: invite.name,
        usedAt: invite.usedAt,
      });
    }

    // Atomically mark as used — findOneAndUpdate with condition prevents race conditions
    const updated = await Invite.findOneAndUpdate(
      { _id: invite._id, used: false }, // condition: only update if still not used
      { used: true, usedAt: new Date() },
      { new: true }
    );

    if (!updated) {
      // Another request beat us to it (race condition handled)
      return res.status(409).json({
        success: false,
        status: 'USED',
        message: 'This invite was just used by another scan.',
        guestName: invite.name,
      });
    }

    return res.json({
      success: true,
      status: 'VALID',
      message: `Welcome, ${updated.name}! Entry approved.`,
      guestName: updated.name,
      checkedInAt: updated.usedAt,
    });
  } catch (err) {
    console.error('Check-in error:', err);
    res.status(500).json({
      success: false,
      status: 'ERROR',
      message: 'Server error during check-in.',
    });
  }
});

module.exports = router;
