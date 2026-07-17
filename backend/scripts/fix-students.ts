import { db } from '../infrastructure/firebase';

async function fixStudents() {
  const snapshot = await db.collection('student_profiles').get();
  let count = 0;
  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (data.isDeleted === undefined) {
      await doc.ref.update({
        isDeleted: false,
        displayName: data.displayName || data.name || 'Unknown',
      });
      count++;
    }
  }
  console.log(`Fixed ${count} students`);
}

fixStudents().catch(console.error);
