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
  rsvpSubmitted: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Invite = models.Invite || model('Invite', inviteSchema);

export default Invite;
