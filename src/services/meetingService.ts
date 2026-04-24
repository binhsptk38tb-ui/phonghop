import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  onSnapshot,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { Meeting, Attendance, Opinion, Task, MeetingDocument, PersonalNote } from '../types';

export const meetingService = {
  sendInvitations: async (meeting: Partial<Meeting>, participants: string[]) => {
    try {
      const response = await fetch('/api/send-invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: meeting.title,
          scheduledAt: meeting.scheduledAt,
          location: meeting.location,
          participants
        })
      });
      return await response.json();
    } catch (error) {
      console.error('Error calling send-invitations API:', error);
      return { status: 'error', error };
    }
  },

  // Personal Notes
  subscribePersonalNote: (meetingId: string, userId: string, callback: (note: PersonalNote | null) => void) => {
    return onSnapshot(doc(db, 'meetings', meetingId, 'personalNotes', userId), (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data() as PersonalNote);
      } else {
        callback(null);
      }
    });
  },

  savePersonalNote: async (meetingId: string, userId: string, content: string) => {
    const ref = doc(db, 'meetings', meetingId, 'personalNotes', userId);
    return setDoc(ref, {
      userId,
      content,
      updatedAt: serverTimestamp()
    });
  },

  // Meeting master
  subscribeMeetings: (callback: (meetings: Meeting[]) => void) => {
    const q = query(collection(db, 'meetings'), orderBy('scheduledAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const meetings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Meeting));
      callback(meetings);
    });
  },

  subscribeMeeting: (meetingId: string, callback: (meeting: Meeting | null) => void) => {
    return onSnapshot(doc(db, 'meetings', meetingId), (docSnap) => {
      if (docSnap.exists()) {
        callback({ id: docSnap.id, ...docSnap.data() } as Meeting);
      } else {
        callback(null);
      }
    }, (error) => {
      console.error("Error subscribing to meeting:", error);
      callback(null);
    });
  },

  createMeeting: async (meeting: Partial<Meeting>) => {
    return addDoc(collection(db, 'meetings'), {
      ...meeting,
      status: 'upcoming',
      createdAt: serverTimestamp(),
    });
  },

  updateMeeting: async (meetingId: string, data: Partial<Meeting>) => {
    const meetingRef = doc(db, 'meetings', meetingId);
    return updateDoc(meetingRef, data);
  },

  deleteMeeting: async (meetingId: string) => {
    return deleteDoc(doc(db, 'meetings', meetingId));
  },

  // Attendance
  subscribeAttendance: (meetingId: string, callback: (attendance: Attendance[]) => void) => {
    return onSnapshot(collection(db, 'meetings', meetingId, 'attendance'), (snapshot) => {
      const attendance = snapshot.docs.map(doc => doc.data() as Attendance);
      callback(attendance);
    });
  },

  updateAttendance: async (meetingId: string, userId: string, userName: string, status: string) => {
    const ref = doc(db, 'meetings', meetingId, 'attendance', userId);
    return setDoc(ref, {
      userId,
      userName,
      status,
      updatedAt: serverTimestamp()
    });
  },

  deleteAttendance: async (meetingId: string, userId: string) => {
    return deleteDoc(doc(db, 'meetings', meetingId, 'attendance', userId));
  },

  // Opinions
  subscribeOpinions: (meetingId: string, callback: (opinions: Opinion[]) => void) => {
    const q = query(collection(db, 'meetings', meetingId, 'opinions'), orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const opinions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Opinion));
      callback(opinions);
    });
  },

  addOpinion: async (meetingId: string, userId: string, userName: string, content: string) => {
    return addDoc(collection(db, 'meetings', meetingId, 'opinions'), {
      userId,
      userName,
      content,
      createdAt: serverTimestamp()
    });
  },

  // Tasks
  subscribeTasks: (meetingId: string, callback: (tasks: Task[]) => void) => {
    return onSnapshot(collection(db, 'meetings', meetingId, 'tasks'), (snapshot) => {
      const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
      callback(tasks);
    });
  },

  addTask: async (meetingId: string, task: Partial<Task>) => {
    return addDoc(collection(db, 'meetings', meetingId, 'tasks'), {
      ...task,
      status: 'pending',
      createdAt: serverTimestamp()
    });
  },

  updateTaskStatus: async (meetingId: string, taskId: string, status: string) => {
    const ref = doc(db, 'meetings', meetingId, 'tasks', taskId);
    return updateDoc(ref, { status });
  },

  // Documents
  subscribeDocuments: (meetingId: string, callback: (docs: MeetingDocument[]) => void) => {
    return onSnapshot(collection(db, 'meetings', meetingId, 'documents'), (snapshot) => {
      const documents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MeetingDocument));
      callback(documents);
    });
  },

  addDocument: async (meetingId: string, docData: Partial<MeetingDocument> & { storagePath?: string }) => {
    return addDoc(collection(db, 'meetings', meetingId, 'documents'), {
      ...docData,
      createdAt: serverTimestamp()
    });
  },

  uploadFile: (meetingId: string, file: File, onProgress?: (pct: number) => void) => {
    return new Promise<{ url: string, storagePath: string }>((resolve, reject) => {
      const storagePath = `meetings/${meetingId}/documents/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) onProgress(progress);
        }, 
        (error) => {
          reject(error);
        }, 
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({ url, storagePath });
        }
      );
    });
  },

  deleteDocument: async (meetingId: string, docId: string, storagePath?: string) => {
    if (storagePath) {
      try {
        const storageRef = ref(storage, storagePath);
        await deleteObject(storageRef);
      } catch (error) {
        console.error("Error deleting file from storage:", error);
      }
    }
    return deleteDoc(doc(db, 'meetings', meetingId, 'documents', docId));
  }
};
