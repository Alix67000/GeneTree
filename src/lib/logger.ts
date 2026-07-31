import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/services/firebase';

export async function logActivity(action: string, details: string, user: string) {
  try {
    await addDoc(collection(db, 'activity_logs'), {
      action,
      details,
      user,
      timestamp: serverTimestamp()
    });
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
}
