import mongoose, { Schema, model, models } from 'mongoose';

const tableSwitchLogSchema = new Schema({
  section: {
    type: String,
    required: true,
    enum: ['section1', 'section2', 'all'],
  },
  cycleId: {
    type: String,
    required: true,
    enum: ['all', 'cycle1', 'cycle2', 'cycle3', 'cycle4'],
  },
  action: {
    type: String,
    required: true,
    enum: ['execute', 'revert'],
  },
  executedBy: {
    type: String,
    default: 'admin',
  },
  affectedGuestCount: {
    type: Number,
    required: true,
  },
  tableSummary: {
    type: Map,
    of: Number,
    default: {},
  },
  executedAt: {
    type: Date,
    default: Date.now,
  },
});

const TableSwitchLog = models.TableSwitchLog || model('TableSwitchLog', tableSwitchLogSchema);

export default TableSwitchLog;
