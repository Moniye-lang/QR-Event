import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Invite from '@/models/Invite';
import TableSwitchLog from '@/models/TableSwitchLog';
import { checkAdmin } from '@/lib/auth';
import {
  TABLE_SWITCH_MAPPING,
  TABLE_CYCLES,
  extractTableKey,
} from '@/lib/tableSwitchConfig';

export async function GET(request: Request) {
  try {
    const admin = await checkAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section') || 'section1';

    const sectionQuery =
      section === 'all'
        ? {}
        : section === 'section1'
        ? { section: { $in: ['section1', null, undefined, ''] } }
        : { section };

    const invites = await Invite.find(sectionQuery).select('_id tableNumber previousTableNumber section name');

    // Get logs for this section to determine execution status
    const logs = await TableSwitchLog.find({
      section: { $in: [section, 'all'] },
    }).sort({ executedAt: -1 });

    const cycleStatus: Record<string, { executed: boolean; executedAt: Date | null; affectedCount: number }> = {
      cycle1: { executed: false, executedAt: null, affectedCount: 0 },
      cycle2: { executed: false, executedAt: null, affectedCount: 0 },
      cycle3: { executed: false, executedAt: null, affectedCount: 0 },
      cycle4: { executed: false, executedAt: null, affectedCount: 0 },
      all: { executed: false, executedAt: null, affectedCount: 0 },
    };

    const executedCycles: Record<string, any> = {};

    // Calculate latest state based on logs
    for (const log of logs) {
      if (log.action === 'execute') {
        if (!cycleStatus[log.cycleId].executed) {
          cycleStatus[log.cycleId] = {
            executed: true,
            executedAt: log.executedAt,
            affectedCount: log.affectedGuestCount,
          };
        }
        if (!executedCycles[log.cycleId]) {
          executedCycles[log.cycleId] = {
            executed: true,
            executedAt: log.executedAt,
            executedBy: log.executedBy,
            count: log.affectedGuestCount,
          };
        }
      }
    }

    // Count guests at each table
    const tableCounts: Record<string, number> = {};
    for (let i = 1; i <= 30; i++) {
      tableCounts[String(i)] = 0;
    }

    invites.forEach((inv) => {
      const key = extractTableKey(inv.tableNumber);
      if (key && tableCounts[key] !== undefined) {
        tableCounts[key] = (tableCounts[key] || 0) + 1;
      }
    });

    // Cycle previews with aggregated guest counts
    const cyclePreviews = TABLE_CYCLES.map((c) => {
      const guestCount = c.tables.reduce((acc, t) => acc + (tableCounts[t] || 0), 0);
      return {
        ...c,
        guestCount,
      };
    });

    // Preview pairs with live counts
    const preview = Object.entries(TABLE_SWITCH_MAPPING).map(([from, to]) => {
      const cycle = TABLE_CYCLES.find((c) => c.tables.includes(from));
      return {
        from,
        to,
        guestCount: tableCounts[from] || 0,
        cycleId: cycle?.id || 'cycle1',
      };
    });

    const totalEligibleGuests = Object.values(tableCounts).reduce((a, b) => a + b, 0);

    const reversibleGuestCount = await Invite.countDocuments({
      ...sectionQuery,
      previousTableNumber: { $ne: null },
    });

    return NextResponse.json({
      success: true,
      section,
      cycles: TABLE_CYCLES,
      cycleStatus,
      executedCycles,
      cyclePreviews,
      tableCounts,
      preview,
      totalEligibleGuests,
      reversibleGuestCount,
      logs,
    });
  } catch (err: any) {
    console.error('Fetch table switch status error:', err);
    return NextResponse.json(
      { success: false, message: err.message || 'Server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const admin = await checkAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const body = await request.json().catch(() => ({}));
    const {
      section = 'section1',
      cycleId = 'all',
      action = 'execute',
    } = body;

    const sectionQuery =
      section === 'all'
        ? {}
        : section === 'section1'
        ? { section: { $in: ['section1', null, undefined, ''] } }
        : { section };

    // --- 1. REVERT ACTION ---
    if (action === 'revert') {
      const revertFilter: any = {
        ...sectionQuery,
        previousTableNumber: { $ne: null },
      };

      if (cycleId !== 'all') {
        revertFilter.tableSwitchedCycle = cycleId;
      }

      const guestsToRevert = await Invite.find(revertFilter);

      if (guestsToRevert.length === 0) {
        return NextResponse.json({
          success: false,
          message: 'No switched guests found to revert for this selection.',
        });
      }

      const bulkRevertOps = guestsToRevert.map((inv) => ({
        updateOne: {
          filter: { _id: inv._id },
          update: {
            $set: {
              tableNumber: inv.previousTableNumber,
            },
            $unset: {
              previousTableNumber: 1,
              tableSwitchedAt: 1,
              tableSwitchedCycle: 1,
            },
          },
        },
      }));

      await Invite.bulkWrite(bulkRevertOps);

      // Clean up log entries for this cycle / section
      if (cycleId === 'all') {
        const logDeleteQuery: any = { action: 'execute' };
        if (section !== 'all') logDeleteQuery.section = section;
        await TableSwitchLog.deleteMany(logDeleteQuery);
      } else {
        await TableSwitchLog.deleteMany({
          section,
          cycleId,
          action: 'execute',
        });
      }

      await TableSwitchLog.create({
        section,
        cycleId,
        action: 'revert',
        executedBy: admin.username || 'admin',
        affectedGuestCount: guestsToRevert.length,
      });

      return NextResponse.json({
        success: true,
        message: `Successfully reversed ${guestsToRevert.length} guests back to their previous tables in ${
          section === 'section1' ? 'Section 1' : section
        }.`,
        revertedCount: guestsToRevert.length,
      });
    }

    // --- 2. EXECUTE SWITCH ACTION ---
    // Strict Guard: Ensure this switch has NOT been executed already
    const existingLog = await TableSwitchLog.findOne({
      section,
      cycleId,
      action: 'execute',
    });

    if (existingLog) {
      return NextResponse.json({
        success: false,
        message: `This table switch (${cycleId === 'all' ? 'All Tables' : cycleId}) has already been executed for ${
          section === 'section1' ? 'Section 1' : section
        } on ${new Date(existingLog.executedAt).toLocaleString()} and cannot be run again.`,
      });
    }

    // If running 'all', also check if individual cycles were executed
    if (cycleId === 'all') {
      const anyCycleRun = await TableSwitchLog.findOne({
        section,
        action: 'execute',
      });
      if (anyCycleRun) {
        return NextResponse.json({
          success: false,
          message: `One or more cycles have already been executed individually. Please execute the remaining cycles individually or revert existing ones first.`,
        });
      }
    } else {
      // If running a single cycle, check if 'all' was already run
      const allRun = await TableSwitchLog.findOne({
        section,
        cycleId: 'all',
        action: 'execute',
      });
      if (allRun) {
        return NextResponse.json({
          success: false,
          message: `The Master All-Table Switch was already executed on ${new Date(
            allRun.executedAt
          ).toLocaleString()}.`,
        });
      }
    }

    // Determine target tables for this cycle
    let allowedFromTables: string[] = [];
    if (cycleId === 'all') {
      allowedFromTables = Object.keys(TABLE_SWITCH_MAPPING);
    } else {
      const foundCycle = TABLE_CYCLES.find((c) => c.id === cycleId);
      if (!foundCycle) {
        return NextResponse.json({ success: false, message: 'Invalid cycle ID specified' }, { status: 400 });
      }
      allowedFromTables = foundCycle.tables;
    }

    // Fetch invites strictly by section
    const invites = await Invite.find(sectionQuery);

    const bulkOps: any[] = [];
    const tableSummary: Record<string, number> = {};

    invites.forEach((inv) => {
      const currentKey = extractTableKey(inv.tableNumber);
      if (currentKey && allowedFromTables.includes(currentKey)) {
        const targetTable = TABLE_SWITCH_MAPPING[currentKey];
        if (targetTable) {
          tableSummary[`${currentKey}->${targetTable}`] = (tableSummary[`${currentKey}->${targetTable}`] || 0) + 1;
          bulkOps.push({
            updateOne: {
              filter: { _id: inv._id },
              update: {
                $set: {
                  tableNumber: targetTable,
                  previousTableNumber: inv.tableNumber || currentKey,
                  tableSwitchedAt: new Date(),
                  tableSwitchedCycle: cycleId,
                },
              },
            },
          });
        }
      }
    });

    if (bulkOps.length === 0) {
      return NextResponse.json({
        success: false,
        message: `No guests found in ${section === 'section1' ? 'Section 1' : section} assigned to any of the tables in this selection (${allowedFromTables.join(', ')}). No tables were changed.`,
      });
    }

    // Execute atomic bulkWrite
    const bulkResult = await Invite.bulkWrite(bulkOps);

    // Record permanent log
    const log = await TableSwitchLog.create({
      section,
      cycleId,
      action: 'execute',
      executedBy: admin.username || 'admin',
      affectedGuestCount: bulkOps.length,
      tableSummary,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully switched ${bulkOps.length} guests across ${Object.keys(tableSummary).length} tables in ${
        section === 'section1' ? 'Section 1' : section
      }!`,
      affectedCount: bulkOps.length,
      tableSummary,
      executedAt: log.executedAt,
    });
  } catch (err: any) {
    console.error('Table switch execution error:', err);
    return NextResponse.json(
      { success: false, message: err.message || 'Server error' },
      { status: 500 }
    );
  }
}
