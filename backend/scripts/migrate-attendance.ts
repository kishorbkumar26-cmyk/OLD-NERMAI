// @ts-nocheck
import * as admin from 'firebase-admin';
import * as path from 'path';

// Initialize Firebase if not already
if (!admin.apps.length) {
  const serviceAccount = require(path.resolve(__dirname, '../nermai-academy-backend-firebase-adminsdk-fbsvc-c43bd2d792.json'));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function migrate() {
  console.log('Starting Class Attendance Policy Migration...');
  const classesRef = db.collection('classes');
  const snapshot = await classesRef.get();

  let migratedCount = 0;
  let errorCount = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    
    if (data.attendance) {
      console.log(`Skipping ${doc.id} - already migrated`);
      continue;
    }

    if (data.minimumAttendancePercentage !== undefined) {
      try {
        const oldPercentage = data.minimumAttendancePercentage;
        
        const attendancePolicy = {
          mode: 'percentage',
          value: oldPercentage,
          version: 1,
          lockAfterStart: true,
          allowEditBeforeStart: true
        };

        // Migration step 1: Write the new object and remove legacy field
        await doc.ref.update({
          attendance: attendancePolicy,
          minimumAttendancePercentage: admin.firestore.FieldValue.delete()
        });

        console.log(`Migrated ${doc.id} successfully. Set value to ${oldPercentage}%`);
        
        // Log to AttendanceAudit
        await db.collection('attendance_audits').add({
          classId: doc.id,
          eventType: 'POLICY_CREATED',
          createdAt: new Date().toISOString(),
          performedBy: 'system_migration',
          newValue: attendancePolicy,
          metadata: { note: 'Migrated from legacy minimumAttendancePercentage' }
        });

        migratedCount++;
      } catch (err) {
        console.error(`Failed to migrate ${doc.id}:`, err);
        errorCount++;
      }
    } else {
       // Class had no legacy field, inject default
       try {
        const attendancePolicy = {
          mode: 'percentage',
          value: 75,
          version: 1,
          lockAfterStart: true,
          allowEditBeforeStart: true
        };

        await doc.ref.update({
          attendance: attendancePolicy
        });
        console.log(`Injected default attendance policy to ${doc.id}`);
        migratedCount++;
       } catch (err) {
         console.error(`Failed to inject default for ${doc.id}:`, err);
         errorCount++;
       }
    }
  }

  console.log(`Migration Complete. Migrated: ${migratedCount}, Errors: ${errorCount}`);
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Migration crashed:', err);
    process.exit(1);
  });
