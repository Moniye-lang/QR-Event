import mongoose, { Schema, model, models } from 'mongoose';

const inviteSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: '',
  },
  token: {
    type: String,
    required: true,
    unique: true,
  },
  used: {
    type: Boolean,
    default: false,
  },
  usedAt: {
    type: Date,
    default: null,
  },
  maxUses: {
    type: Number,
    default: 1,
  },
  phone: {
    type: String,
    default: '',
  },
  attending: {
    type: String,
    enum: ['yes', 'no'],
    default: 'yes',
  },
  guestNames: {
    type: [String],
    default: [],
  },
  isAdditionalGuest: {
    type: Boolean,
    default: false,
  },
  mainGuestId: {
    type: Schema.Types.ObjectId,
    ref: 'Invite',
    default: null,
  },
  mainGuestName: {
    type: String,
    default: '',
  },
  rsvpSubmitted: {
    type: Boolean,
    default: false,
  },
  whatsappStatus: {
    type: String,
    enum: ['not_sent', 'queued', 'sending', 'sent', 'delivered', 'read', 'failed'],
    default: 'not_sent',
  },
  whatsappMessageId: {
    type: String,
    default: null,
  },
  whatsappSentAt: {
    type: Date,
    default: null,
  },
  whatsappError: {
    type: String,
    default: null,
  },
  whatsappLastAttempt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Invite = models.Invite || model('Invite', inviteSchema);

export default Invite;
