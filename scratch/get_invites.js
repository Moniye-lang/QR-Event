const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const lines = envContent.split('\n');
let mongoUri = '';

for (const line of lines) {
  const trimmed = line.trim();
  if (trimmed.startsWith('MONGO_URI=')) {
    const idx = trimmed.indexOf('=');
    mongoUri = trimmed.slice(idx + 1).trim();
    break;
  }
}

console.log('Parsed MONGO_URI length:', mongoUri.length);
console.log('Parsed MONGO_URI string:', JSON.stringify(mongoUri));

const inviteSchema = new mongoose.Schema({
  name: String,
  email: String,
  token: String,
  used: Boolean,
  attending: String,
  rsvpSubmitted: Boolean,
});

const Invite = mongoose.models.Invite || mongoose.model('Invite', inviteSchema);

async function run() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(mongoUri);
    console.log('Connected successfully. Fetching invites...');
    
    const invites = await Invite.find({}).lean();
    console.log('\n--- INVITE LIST ---');
    if (invites.length === 0) {
      console.log('No invites found in database.');
    } else {
      console.log(JSON.stringify(invites.map(i => ({
        Name: i.name,
        Email: i.email || '',
        Token: i.token,
        Attending: i.attending || 'yes',
        RSVP_Submitted: i.rsvpSubmitted || false,
        Used: i.used || false
      })), null, 2));
    }
  } catch (error) {
    console.error('Error querying database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

run();
