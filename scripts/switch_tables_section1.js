const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// 1. Load environment variables
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
let mongoUri = '';
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (trimmed.startsWith('MONGO_URI=')) {
    const idx = trimmed.indexOf('=');
    mongoUri = trimmed.slice(idx + 1).trim();
    break;
  }
}

if (!mongoUri) {
  console.error('MONGO_URI not found in .env.local');
  process.exit(1);
}

// 2. Exact 30-Table Mapping
const TABLE_SWITCH_MAPPING = {
  '1': '13',
  '2': '19',
  '3': '14',
  '4': '20',
  '5': '15',
  '6': '21',
  '7': '24',
  '8': '7',
  '9': '29',
  '10': '8',
  '11': '17',
  '12': '4',
  '13': '18',
  '14': '6',
  '15': '16',
  '16': '12',
  '17': '1',
  '18': '11',
  '19': '2',
  '20': '3',
  '21': '25',
  '22': '30',
  '23': '27',
  '24': '28',
  '25': '9',
  '26': '10',
  '27': '26',
  '28': '23',
  '29': '22',
  '30': '5',
};

const TABLE_CYCLES = [
  { id: 'cycle1', name: 'Cycle 1 (5 Tables)', tables: ['1', '13', '18', '11', '17'] },
  { id: 'cycle2', name: 'Cycle 2 (2 Tables)', tables: ['2', '19'] },
  { id: 'cycle3', name: 'Cycle 3 (15 Tables)', tables: ['3', '14', '6', '21', '25', '9', '29', '22', '30', '5', '15', '16', '12', '4', '20'] },
  { id: 'cycle4', name: 'Cycle 4 (8 Tables)', tables: ['7', '24', '28', '23', '27', '26', '10', '8'] },
];

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

// Schemas
const inviteSchema = new mongoose.Schema({
  name: String,
  phone: String,
  section: String,
  tableNumber: String,
  previousTableNumber: String,
  tableSwitchedAt: Date,
  tableSwitchedCycle: String,
}, { timestamps: true });

const tableSwitchLogSchema = new mongoose.Schema({
  section: String,
  cycleId: String,
  action: String,
  executedBy: String,
  affectedGuestCount: Number,
  tableSummary: mongoose.Schema.Types.Mixed,
  executedAt: { type: Date, default: Date.now },
});

const Invite = mongoose.models.Invite || mongoose.model('Invite', inviteSchema);
const TableSwitchLog = mongoose.models.TableSwitchLog || mongoose.model('TableSwitchLog', tableSwitchLogSchema);

async function run() {
  const isExecute = process.argv.includes('--execute');
  const isRevert = process.argv.includes('--revert');
  const targetCycleArg = process.argv.find(a => a.startsWith('--cycle='));
  const targetCycle = targetCycleArg ? targetCycleArg.split('=')[1] : 'all';

  console.log('==================================================');
  console.log(' TABLE RE-ALLOCATION SCRIPT — SECTION 1 (MAIN EVENT)');
  console.log(' Mode:', isRevert ? '🔵 REVERSE / ROLLBACK' : isExecute ? '🔴 LIVE EXECUTION' : '🟡 DRY RUN (Preview only)');
  console.log(' Target:', targetCycle === 'all' ? 'All 30 Tables (All 4 Cycles)' : `Cycle ${targetCycle}`);
  console.log('==================================================\n');

  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri);
    console.log('Connected successfully.\n');

    // Section 1 filter
    const section1Filter = {
      section: { $in: ['section1', null, undefined, ''] }
    };

    // --- REVERSE ACTION ---
    if (isRevert) {
      console.log('Searching for switched guests with previous table snapshots in Section 1...');
      const switchedGuests = await Invite.find({
        ...section1Filter,
        previousTableNumber: { $ne: null },
      });

      console.log(`Found ${switchedGuests.length} switched guest(s) eligible for reversal.`);

      if (switchedGuests.length === 0) {
        console.log('No switched guests found in Section 1 to revert.');
        process.exit(0);
      }

      const revertOps = switchedGuests.map((inv) => ({
        updateOne: {
          filter: { _id: inv._id },
          update: {
            $set: { tableNumber: inv.previousTableNumber },
            $unset: {
              previousTableNumber: 1,
              tableSwitchedAt: 1,
              tableSwitchedCycle: 1,
            },
          },
        },
      }));

      await Invite.bulkWrite(revertOps);
      await TableSwitchLog.deleteMany({ section: 'section1', action: 'execute' });

      await TableSwitchLog.create({
        section: 'section1',
        cycleId: 'all',
        action: 'revert',
        executedBy: 'cli-revert',
        affectedGuestCount: switchedGuests.length,
      });

      console.log(`✓ Successfully reversed ${switchedGuests.length} guests in Section 1 back to their original tables!`);
      console.log('✓ Execution lock reset. Tables are safely back to their original state.');
      process.exit(0);
    }

    // Check if already executed
    const existingLog = await TableSwitchLog.findOne({
      section: 'section1',
      cycleId: targetCycle,
      action: 'execute'
    });

    if (existingLog && isExecute) {
      console.warn(`⚠️ WARNING: Table switch for Section 1 (${targetCycle}) was already executed on ${existingLog.executedAt.toLocaleString()} by ${existingLog.executedBy}!`);
      console.warn('Execution aborted to protect against double-switching.');
      process.exit(0);
    }

    // Determine tables to switch
    let allowedFromTables = Object.keys(TABLE_SWITCH_MAPPING);
    if (targetCycle !== 'all') {
      const found = TABLE_CYCLES.find(c => c.id === targetCycle);
      if (!found) {
        console.error(`Invalid cycle: ${targetCycle}`);
        process.exit(1);
      }
      allowedFromTables = found.tables;
    }

    // Query Section 1 guests
    const invites = await Invite.find(section1Filter);
    console.log(`Total guests found in Section 1: ${invites.length}`);

    const tableCounts = {};
    const bulkOps = [];
    const guestMoves = [];

    for (const inv of invites) {
      const currentKey = extractTableKey(inv.tableNumber);
      if (currentKey && allowedFromTables.includes(currentKey)) {
        const targetTable = TABLE_SWITCH_MAPPING[currentKey];
        tableCounts[currentKey] = (tableCounts[currentKey] || 0) + 1;

        guestMoves.push({
          guestName: inv.name,
          currentTable: inv.tableNumber || currentKey,
          newTable: targetTable,
        });

        bulkOps.push({
          updateOne: {
            filter: { _id: inv._id },
            update: {
              $set: {
                tableNumber: targetTable,
                previousTableNumber: inv.tableNumber || currentKey,
                tableSwitchedAt: new Date(),
                tableSwitchedCycle: targetCycle,
              }
            }
          }
        });
      }
    }

    console.log('\n--- TABLE BREAKDOWN (Guests per Table to be Switched) ---');
    allowedFromTables.forEach(t => {
      const count = tableCounts[t] || 0;
      const target = TABLE_SWITCH_MAPPING[t];
      console.log(`  Table ${t.padEnd(2)} -> Table ${target.padEnd(2)} : ${count} guest(s)`);
    });

    console.log(`\nTotal guests to be switched in Section 1: ${bulkOps.length}`);

    if (bulkOps.length === 0) {
      console.log('No guests found matching the selected tables in Section 1.');
      process.exit(0);
    }

    if (!isExecute) {
      console.log('\n[DRY RUN COMPLETE] Zero database changes were made.');
      console.log('To execute this switch live, run:');
      console.log('  node scripts/switch_tables_section1.js --execute\n');
    } else {
      console.log('\nApplying atomic bulkWrite by unique document ID...');
      const result = await Invite.bulkWrite(bulkOps);
      console.log(`✓ BulkWrite succeeded! Modified count: ${result.modifiedCount}`);

      // Record log
      await TableSwitchLog.create({
        section: 'section1',
        cycleId: targetCycle,
        action: 'execute',
        executedBy: 'cli-script',
        affectedGuestCount: bulkOps.length,
        tableSummary: tableCounts,
      });

      console.log('✓ Permanent log written to database.');
      console.log('✓ One-time execution lock active. Section 1 tables successfully updated!');
    }

  } catch (err) {
    console.error('Error during execution:', err);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB.');
  }
}

run();

