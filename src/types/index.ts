export type UserPosition = 'admin' | 'principal' | 'vice_principal' | 'teacher' | 'staff';
export type UserRole = 'chairperson' | 'secretary' | 'member';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  position: UserPosition;
  role: UserRole;
  phoneNumber?: string;
  createdAt: any;
}

export type MeetingStatus = 'upcoming' | 'ongoing' | 'completed';

export interface Meeting {
  id: string;
  title: string;
  description?: string;
  scheduledAt: any;
  location?: string;
  status: MeetingStatus;
  content?: string;
  resolution?: string;
  createdBy: string;
  createdAt: any;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface Attendance {
  userId: string;
  userName: string;
  status: AttendanceStatus;
  updatedAt: any;
}

export interface Opinion {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: any;
}

export interface Task {
  id: string;
  description: string;
  assigneeId: string;
  assigneeName: string;
  status: 'pending' | 'in_progress' | 'completed';
  dueDate?: any;
}

export interface MeetingDocument {
  id: string;
  name: string;
  url: string;
  storagePath?: string;
  uploadedBy: string;
  createdAt: any;
}
