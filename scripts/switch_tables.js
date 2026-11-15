const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Read .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
let mongoUri = '';
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (trimmed.startsWith('MONGO_URI=')) {
    mongoUri = trimmed.slice(trimmed.indexOf('=') + 1).trim();
    break;
  }
}

if (!mongoUri) {
  console.error('MONGO_URI not found in .env.local');
  process.exit(1);
}

const TABLE_SWITCH_MAPPING = {
  '1': '13', '2': '19', '3': '14', '4': '20', '5': '15', '6': '21', '7': '24', '8': '7', '9': '29', '10': '8',
  '11': '17', '12': '4', '13': '18', '14': '6', '15': '16', '16': '12', '17': '1', '18': '11', '19': '2', '20': '3',
  '21': '25', '22': '30', '23': '27', '24': '28', '25': '9', '26': '10', '27': '26', '28': '23', '29': '22', '30': '5'
};

function extractTableKey(raw) {
  if (raw == null) return null;
  const str = String(raw).trim();
  if (!str) return null;
  const clean = str.replace(/^table\s*[:#.-]?\s*/i, '').replace(/^#\s*/i, '').trim();
  if (clean && TABLE_SWITCH_MAPPING[clean]) {
    return clean;
  }
  return null;
}

const inviteSchema = new mongoose.Schema({
  name: String,
  section: String,
  tableNumber: String,
  previousTableNumber: String,
  tableSwitchedAt: Date,
  tableSwitchedCycle: String,
});

const Invite = mongoose.models.Invite || mongoose.model('Invite', inviteSchema);

async function run() {
  const isExecute = process.argv.includes('--execute');
  const targetSection = process.argv.find(a => a.startsWith('--section='))?.split('=')[1] || 'all';

  console.log('Connecting to MongoDB...');
  await mongoose.connect(mongoUri);
  console.log('Connected successfully.');

  const sectionQuery = targetSection === 'all'
    ? {}
    : targetSection === 'section1'
    ? { $or: [{ section: 'section1' }, { section: { $exists: false } }, { section: null }, { section: '' }] }
    : { section: targetSection };

  const invites = await Invite.find({
    ...sectionQuery,
    tableNumber: { $nin: ['', null, undefined] }
  }).lean();

  console.log(`Found ${invites.length} guests with tables in section "${targetSection}".`);

  const bulkOps = [];
  const summary = {};

  for (const inv of invites) {
    const key = extractTableKey(inv.tableNumber);
    if (key && TABLE_SWITCH_MAPPING[key]) {
      const targetNumber = TABLE_SWITCH_MAPPING[key];
      const rawOld = String(inv.tableNumber).trim();
      const hasPrefix = /^table\s+/i.test(rawOld);
      const formattedNew = hasPrefix ? `Table ${targetNumber}` : targetNumber;

      const sKey = `${key} -> ${targetNumber}`;
      summary[sKey] = (summary[sKey] || 0) + 1;

      bulkOps.push({
        updateOne: {
          filter: { _id: inv._id },
          update: {
            $set: {
              tableNumber: formattedNew,
              previousTableNumber: rawOld,
              tableSwitchedAt: new Date(),
              tableSwitchedCycle: 'all'
            }
          }
        }
      });
    }
  }

  console.log('\n--- TRANSITION SUMMARY ---');
  for (const [k, count] of Object.entries(summary)) {
    console.log(`  Table ${k}: ${count} guest(s)`);
  }
  console.log(`\nTotal affected guests: ${bulkOps.length}`);

  if (!isExecute) {
    console.log('\n[DRY RUN COMPLETE] No records were modified.');
    console.log('To apply these changes permanently, run: node scripts/switch_tables.js --execute');
  } else {
    if (bulkOps.length > 0) {
      console.log('\nExecuting atomic bulkWrite...');
      const res = await Invite.bulkWrite(bulkOps);
      console.log(`[SUCCESS] Updated ${res.modifiedCount} guest records.`);
    } else {
      console.log('No matching guests found to update.');
    }
  }

  await mongoose.disconnect();
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

