import { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Users, 
  FileText, 
  MessageSquare, 
  CheckSquare, 
  Download, 
  Send,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  FileUp,
  PlayCircle,
  StopCircle,
  Clock,
  Printer,
  GraduationCap,
  X,
  Eye,
  Paperclip,
  Loader2
} from 'lucide-react';
import React from 'react';
import { meetingService } from '../services/meetingService';
import { 
  Meeting, 
  UserProfile, 
  Attendance, 
  Opinion, 
  Task, 
  MeetingDocument,
  AttendanceStatus
} from '../types';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { motion, AnimatePresence } from 'motion/react';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

interface MeetingRoomProps {
  meetingId: string;
  user: UserProfile;
  onBack: () => void;
}

type TabType = 'info' | 'attendance' | 'opinions' | 'tasks' | 'documents';

export default function MeetingRoom({ meetingId, user, onBack }: MeetingRoomProps) {
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [opinions, setOpinions] = useState<Opinion[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [documents, setDocuments] = useState<MeetingDocument[]>([]);
  
  const [opinionInput, setOpinionInput] = useState('');
  const [showAddDocModal, setShowAddDocModal] = useState(false);
  const [newDoc, setNewDoc] = useState({ name: '', url: '', type: 'link' as 'link' | 'file' });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewDoc, setPreviewDoc] = useState<MeetingDocument | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Basic Meeting Info
    const unsubMeeting = meetingService.subscribeMeetings((meetings) => {
      const current = meetings.find(m => m.id === meetingId);
      if (current) setMeeting(current);
    });

    const unsubAttendance = meetingService.subscribeAttendance(meetingId, setAttendance);
    const unsubOpinions = meetingService.subscribeOpinions(meetingId, (ops) => {
      setOpinions(ops);
      setTimeout(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }, 100);
    });
    const unsubTasks = meetingService.subscribeTasks(meetingId, setTasks);
    const unsubDocs = meetingService.subscribeDocuments(meetingId, setDocuments);

    return () => {
      unsubMeeting();
      unsubAttendance();
      unsubOpinions();
      unsubTasks();
      unsubDocs();
    };
  }, [meetingId]);

  const handleStatusChange = async (status: Meeting['status']) => {
    await meetingService.updateMeeting(meetingId, { status });
  };

  const handleAttendance = async (status: AttendanceStatus) => {
    await meetingService.updateAttendance(meetingId, user.uid, user.name, status);
  };

  const postOpinion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!opinionInput.trim()) return;
    await meetingService.addOpinion(meetingId, user.uid, user.name, opinionInput);
    setOpinionInput('');
  };

  const addTask = async () => {
    const desc = prompt('Nhập mô tả nhiệm vụ:');
    const assignee = prompt('Nhập tên người thực hiện:');
    if (desc && assignee) {
      await meetingService.addTask(meetingId, {
        description: desc,
        assigneeName: assignee,
        assigneeId: 'unknown',
        status: 'pending'
      });
    }
  };

  const handleExportPDF = () => {
    if (!meeting) return;
    const doc = new jsPDF();
    
    // Check if we need to load a font for Vietnamese support. 
    // Standard PDF fonts don't support Vietnamese well.
    // In a real app we'd embed a Unicode font. For this demo, we'll use basic text.
    
    doc.setFontSize(20);
    doc.text('BIEN BAN CUOC HOP', 105, 20, { align: 'center' });
    
    doc.setFontSize(14);
    doc.text(`Chu de: ${meeting.title}`, 20, 40);
    doc.text(`Thoi gian: ${format(meeting.scheduledAt.toDate ? meeting.scheduledAt.toDate() : new Date(meeting.scheduledAt), 'dd/MM/yyyy HH:mm')}`, 20, 50);
    doc.text(`Dia diem: ${meeting.location || 'N/A'}`, 20, 60);
    
    doc.text('Noi dung cuoc hop:', 20, 80);
    doc.setFontSize(12);
    const contentLines = doc.splitTextToSize(meeting.content || 'Chua co noi dung.', 170);
    doc.text(contentLines, 20, 90);
    
    doc.setFontSize(14);
    doc.text('Nghi quyet:', 20, 130);
    doc.setFontSize(12);
    const resLines = doc.splitTextToSize(meeting.resolution || 'Chua co nghi quyet.', 170);
    doc.text(resLines, 20, 140);

    // Tasks table
    if (tasks.length > 0) {
      doc.addPage();
      doc.text('Danh sach nhiem vu:', 20, 20);
      (doc as any).autoTable({
        startY: 30,
        head: [['Mo ta', 'Nguoi thuc hien', 'Trang thai']],
        body: tasks.map(t => [t.description, t.assigneeName, t.status === 'completed' ? 'Hoan thanh' : 'Dang thuc hien']),
      });
    }

    doc.save(`biên_bản_họp_${meetingId.slice(0, 8)}.pdf`);
  };

  if (!meeting) return <div className="p-8 text-center text-slate-500 font-bold">Không tìm thấy dữ liệu cuộc họp...</div>;

  const tabs = [
    { id: 'info', label: 'Nội dung', icon: FileText },
    { id: 'attendance', label: 'Điểm danh', icon: Users },
    { id: 'opinions', label: 'Ý kiến', icon: MessageSquare },
    { id: 'tasks', label: 'Nhiệm vụ', icon: CheckSquare },
    { id: 'documents', label: 'Tài liệu', icon: Download },
  ];

  return (
    <div className="h-full flex flex-col gap-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={cn(
                "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest",
                meeting.status === 'ongoing' ? "bg-emerald-100 text-emerald-700" :
                meeting.status === 'completed' ? "bg-slate-100 text-slate-600" :
                "bg-blue-100 text-blue-700"
              )}>
                {meeting.status}
              </span>
              <span className="text-xs font-bold text-slate-400">#{meetingId.slice(0, 8)}</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">{meeting.title}</h2>
          </div>
        </div>

        <div className="flex gap-2">
          {(user.role === 'admin' || user.role === 'management') && (
            <>
              {meeting.status === 'upcoming' && (
                <button 
                  onClick={() => handleStatusChange('ongoing')}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all"
                >
                  <PlayCircle size={18} /> Bắt đầu họp
                </button>
              )}
              {meeting.status === 'ongoing' && (
                <button 
                  onClick={() => handleStatusChange('completed')}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl text-sm font-bold shadow-lg shadow-slate-100 hover:bg-slate-900 transition-all"
                >
                  <StopCircle size={18} /> Kết thúc họp
                </button>
              )}
            </>
          )}
          <button 
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all shadow-sm"
          >
            <Printer size={18} /> Xuất biên bản
          </button>
        </div>
      </div>

      {/* Tabs Nav */}
      <div className="flex gap-1 bg-slate-200/50 p-1.5 rounded-2xl w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all",
              activeTab === tab.id 
                ? "bg-white text-blue-700 shadow-sm" 
                : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
            )}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-0">
        {activeTab === 'info' && (
          <div className="grid md:grid-cols-3 gap-6 h-full">
            <div className="md:col-span-2 space-y-6 flex flex-col">
              <div className="bg-white rounded-3xl p-8 border border-slate-200 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="text-blue-600" /> Nội dung cuộc họp
                  </h3>
                  {(user.role === 'admin' || user.role === 'management') && (
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded">Có thể chỉnh sửa</span>
                  )}
                </div>
                <textarea
                  className="flex-1 w-full bg-slate-50 rounded-2xl p-6 text-slate-700 font-medium leading-relaxed border border-slate-100 outline-none focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all resize-none"
                  placeholder="Ghi nhận nội dung thảo luận và các sự kiện trong cuộc họp..."
                  value={meeting.content || ''}
                  readOnly={!(user.role === 'admin' || user.role === 'management')}
                  onChange={e => meetingService.updateMeeting(meetingId, { content: e.target.value })}
                />
              </div>

              <div className="bg-white rounded-3xl p-8 border border-slate-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <CheckSquare className="text-emerald-600" /> Nghị quyết / Kết luận
                  </h3>
                </div>
                <textarea
                  className="w-full bg-emerald-50/30 rounded-2xl p-6 text-slate-700 font-bold leading-relaxed border border-emerald-100 outline-none focus:bg-white focus:ring-4 focus:ring-emerald-100 transition-all resize-none"
                  placeholder="Ghi các nghị quyết đã được thông qua..."
                  value={meeting.resolution || ''}
                  readOnly={!(user.role === 'admin' || user.role === 'management')}
                  onChange={e => meetingService.updateMeeting(meetingId, { resolution: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-6 border border-slate-200">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Thông tin chung</h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                      <Clock size={16} />
                    </div>
                    <div className="text-sm">
                      <p className="font-bold text-slate-900">Thời gian bắt đầu</p>
                      <p className="text-slate-500 font-medium">
                        {format(meeting.scheduledAt.toDate ? meeting.scheduledAt.toDate() : new Date(meeting.scheduledAt), 'HH:mm - dd/MM/yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                      <Users size={16} />
                    </div>
                    <div className="text-sm">
                      <p className="font-bold text-slate-900">Thành phần họp</p>
                      <p className="text-slate-500 font-medium">{attendance.length} thành viên đã điểm danh</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-600 rounded-3xl p-6 text-white shadow-xl shadow-blue-200 overflow-hidden relative">
                <div className="absolute -right-6 -bottom-6 text-white/10 rotate-12">
                  <GraduationCap size={120} />
                </div>
                <h4 className="font-bold text-lg mb-2 z-10 relative text-blue-50">Lưu ý chuyên môn</h4>
                <p className="text-sm text-blue-100 leading-relaxed font-medium z-10 relative">
                  Hệ thống tự động lưu trữ biên bản lên đám mây. Mọi thay đổi đều được ghi lại lịch sử.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">Sổ điểm danh cuộc họp</h3>
                <p className="text-slate-500 font-medium mt-1">Xác nhận sự hiện diện của các thành viên.</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleAttendance('present')}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all"
                >
                  Có mặt ngay
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2">
              <table className="w-full">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-4 text-xs font-bold text-slate-400 uppercase tracking-widest px-4">Thành viên</th>
                    <th className="text-left py-4 text-xs font-bold text-slate-400 uppercase tracking-widest px-4">Trạng thái</th>
                    <th className="text-left py-4 text-xs font-bold text-slate-400 uppercase tracking-widest px-4">Thời điểm</th>
                    {(user.role === 'admin' || user.role === 'management') && (
                      <th className="text-right py-4 text-xs font-bold text-slate-400 uppercase tracking-widest px-4">Thao tác</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {attendance.map((record) => (
                    <tr key={record.userId} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                            {record.userName.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-bold text-slate-800">{record.userName}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-xs font-black uppercase tracking-tighter",
                          record.status === 'present' ? "bg-emerald-100 text-emerald-700" :
                          record.status === 'absent' ? "bg-rose-100 text-rose-700" :
                          record.status === 'late' ? "bg-amber-100 text-amber-700" :
                          "bg-slate-100 text-slate-600"
                        )}>
                          {record.status === 'present' ? 'Có mặt' : record.status === 'absent' ? 'Vắng mặt' : record.status === 'late' ? 'Đến muộn' : 'Vắng (Có phép)'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm font-medium text-slate-500">
                        {record.updatedAt ? format(record.updatedAt.toDate(), 'HH:mm:ss') : 'N/A'}
                      </td>
                      {(user.role === 'admin' || user.role === 'management') && (
                        <td className="py-4 px-4 text-right">
                           <div className="flex items-center justify-end gap-1">
                             <button className="h-8 w-8 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all">
                               <Trash2 size={14} />
                             </button>
                           </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'opinions' && (
          <div className="bg-white rounded-3xl border border-slate-200 h-full flex flex-col overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="text-indigo-600" /> Trao đổi & Ý kiến hòm thư
              </h3>
              <span className="text-xs font-bold text-slate-400">{opinions.length} lượt ý kiến</span>
            </div>
            
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-slate-50/30">
              {opinions.map((opinion) => (
                <div key={opinion.id} className={cn(
                  "flex flex-col max-w-[80%]",
                  opinion.userId === user.uid ? "ml-auto items-end" : "mr-auto items-start"
                )}>
                  <div className="flex items-center gap-2 mb-1.5 px-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{opinion.userName}</span>
                    <span className="text-[10px] text-slate-300">
                      {opinion.createdAt ? format(opinion.createdAt.toDate(), 'HH:mm') : ''}
                    </span>
                  </div>
                  <div className={cn(
                    "rounded-2xl px-5 py-3 shadow-sm border",
                    opinion.userId === user.uid 
                      ? "bg-blue-600 text-white border-blue-500" 
                      : "bg-white text-slate-800 border-slate-100"
                  )}>
                    <p className="text-sm font-medium leading-relaxed">{opinion.content}</p>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={postOpinion} className="p-6 bg-white border-t border-slate-100">
              <div className="bg-slate-50 flex items-center gap-3 p-2 rounded-2xl border border-slate-200/60 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100 transition-all">
                <input
                  type="text"
                  placeholder="Nhập ý kiến hoặc đóng góp tại đây..."
                  className="flex-1 bg-transparent border-none outline-none px-4 text-sm font-medium text-slate-700"
                  value={opinionInput}
                  onChange={e => setOpinionInput(e.target.value)}
                />
                <button
                  type="submit"
                  className="h-10 w-10 flex items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95"
                >
                  <Send size={18} />
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 h-full flex flex-col shadow-sm">
             <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">Danh sách nhiệm vụ</h3>
                <p className="text-slate-500 font-medium mt-1">Các chỉ đạo và phân công công việc sau cuộc họp.</p>
              </div>
              {(user.role === 'admin' || user.role === 'management') && (
                <button 
                  onClick={addTask}
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                >
                  <Plus size={18} /> Thêm nhiệm vụ
                </button>
              )}
            </div>

            <div className="space-y-3">
              {tasks.map(task => (
                <div key={task.id} className="group flex items-center gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-100/50 hover:bg-white hover:shadow-md transition-all">
                  <button 
                    onClick={() => meetingService.updateTaskStatus(meetingId, task.id, task.status === 'completed' ? 'pending' : 'completed')}
                    className={cn(
                      "flex-shrink-0 h-7 w-7 rounded-lg flex items-center justify-center transition-all",
                      task.status === 'completed' ? "bg-emerald-100 text-emerald-600" : "bg-white border border-slate-200 text-slate-300"
                    )}
                  >
                    {task.status === 'completed' ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                  </button>
                  <div className="flex-1">
                    <p className={cn(
                      "font-bold text-slate-800",
                      task.status === 'completed' && "line-through text-slate-400 opacity-60"
                    )}>
                      {task.description}
                    </p>
                    <div className="flex items-center gap-4 mt-1.5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Phân công: {task.assigneeName}</span>
                      <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <Clock size={10} /> Hạn chót: {task.dueDate ? format(task.dueDate.toDate(), 'dd/MM') : 'ASAP'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {tasks.length === 0 && (
                <div className="text-center py-20 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
                  <p className="text-slate-400 font-bold">Chưa có nhiệm vụ nào được chỉ đạo.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
           <div className="bg-white rounded-3xl p-8 border border-slate-200 h-full flex flex-col shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">Hồ sơ & Tài liệu</h3>
                <p className="text-slate-500 font-medium mt-1">Lưu trữ các tài liệu, giáo án, báo cáo liên quan (Google Drive, OneDrive...)</p>
              </div>
              {(user.role === 'admin' || user.role === 'management') && (
                <button 
                  onClick={() => setShowAddDocModal(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                >
                  <FileUp size={18} /> Đưa hồ sơ lên
                </button>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4 overflow-y-auto">
              {documents.map(docData => (
                <div key={docData.id} className="flex items-center gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md transition-all group/doc">
                  <div className="h-12 w-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 shadow-inner">
                    <FileText size={24} />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="font-bold text-slate-800 truncate">{docData.name}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Gửi bởi: {docData.uploadedBy}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setPreviewDoc(docData)}
                      className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-green-600 hover:border-green-100 transition-all"
                      title="Xem trước"
                    >
                      <Eye size={20} />
                    </button>
                    <a 
                      href={docData.url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-100 transition-all"
                      title="Tải về"
                    >
                      <Download size={20} />
                    </a>
                    {(user.role === 'admin' || user.role === 'management' || docData.uploadedBy === user.name) && (
                      <button 
                        onClick={() => meetingService.deleteDocument(meetingId, docData.id, docData.storagePath)}
                        className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-300 hover:text-red-500 hover:border-red-100 transition-all"
                        title="Xóa"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {documents.length === 0 && (
                <div className="md:col-span-2 text-center py-20 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
                  <p className="text-slate-400 font-bold">Chưa có tài liệu nào được đính kèm.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Document Modal */}
      <AnimatePresence>
        {showAddDocModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 overflow-y-auto py-10">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => !uploading && setShowAddDocModal(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-slate-900">Thêm hồ sơ họp</h3>
                <button onClick={() => !uploading && setShowAddDocModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl mb-6">
                <button 
                  onClick={() => setNewDoc({...newDoc, type: 'link'})}
                  className={cn(
                    "flex-1 py-2 text-xs font-bold rounded-xl transition-all",
                    newDoc.type === 'link' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  Dán đường dẫn (Khuyên dùng)
                </button>
                <button 
                  onClick={() => setNewDoc({...newDoc, type: 'file'})}
                  className={cn(
                    "flex-1 py-2 text-xs font-bold rounded-xl transition-all",
                    newDoc.type === 'file' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  Tải từ máy tính
                </button>
              </div>

              {newDoc.type === 'file' && (
                <div className="mb-4 p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                  <p className="text-[11px] text-amber-700 leading-relaxed font-medium">
                    ⚠️ <strong>Chú ý:</strong> Nếu vạch tải lên bị đứng ở 0%, nghĩa là máy chủ Google Cloud của bạn yêu cầu xác minh thanh toán mới cho phép dùng ổ đĩa. 
                    <br/><br/>
                    <strong>Giải pháp:</strong> Hãy dùng tab <strong>"Dán đường dẫn"</strong> ở trên để chia sẻ tài liệu từ Google Drive của bạn.
                  </p>
                </div>
              )}

              <form onSubmit={async (e) => {
                e.preventDefault();
                if (uploading) return;

                if (newDoc.type === 'file') {
                  const file = fileInputRef.current?.files?.[0];
                  if (!file) return alert('Vui lòng chọn file');
                  
                  try {
                    setUploading(true);
                    setUploadProgress(0);
                    console.log('Starting file upload for:', file.name);
                    
                    // Thêm cơ chế timeout sau 15 giây nếu vẫn ở 0%
                    const uploadTimeout = setTimeout(() => {
                      if (uploading && uploadProgress === 0) {
                        setUploading(false);
                        alert('Quá thời gian kết nối với máy chủ lưu trữ. Vui lòng kiểm tra lại mạng hoặc sử dụng tính năng "Dán đường dẫn".');
                      }
                    }, 15000);

                    const { url, storagePath } = await meetingService.uploadFile(
                      meetingId, 
                      file, 
                      (pct) => setUploadProgress(Math.round(pct))
                    );
                    
                    clearTimeout(uploadTimeout);
                    console.log('Upload successful, URL:', url);
                    await meetingService.addDocument(meetingId, {
                      name: newDoc.name || file.name,
                      url,
                      storagePath,
                      uploadedBy: user.name
                    });
                    setShowAddDocModal(false);
                    setNewDoc({ name: '', url: '', type: 'file' });
                  } catch (error: any) {
                    console.error('Upload Error:', error);
                    let msg = 'Lỗi không xác định';
                    if (error.code === 'storage/unauthorized') {
                      msg = 'Bạn không có quyền tải tệp lên. Vui lòng kiểm tra cấu hình Storage Rules.';
                    } else if (error.code === 'storage/canceled') {
                      msg = 'Tải tệp đã bị hủy.';
                    } else {
                      msg = error.message || 'Lỗi kết nối máy chủ.';
                    }
                    alert('Lỗi tải file: ' + msg);
                  } finally {
                    setUploading(false);
                  }
                } else {
                  await meetingService.addDocument(meetingId, {
                    name: newDoc.name,
                    url: newDoc.url,
                    uploadedBy: user.name
                  });
                  setShowAddDocModal(false);
                  setNewDoc({ name: '', url: '', type: 'link' });
                }
              }} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Tên tài liệu / Hồ sơ</label>
                  <input
                    required
                    type="text"
                    placeholder="VD: Kế hoạch chuyên môn tháng 5"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    value={newDoc.name}
                    onChange={e => setNewDoc({...newDoc, name: e.target.value})}
                  />
                </div>

                {newDoc.type === 'file' ? (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Chọn tệp từ máy</label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-32 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-100 hover:border-blue-300 transition-all group"
                    >
                      <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-slate-400 group-hover:text-blue-500 shadow-sm">
                        <Paperclip size={20} />
                      </div>
                      <p className="text-xs font-bold text-slate-500 group-hover:text-blue-600">
                        {fileInputRef.current?.files?.[0]?.name || "Chọn file để tải lên"}
                      </p>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setNewDoc(d => ({...d, name: d.name || file.name}));
                          }
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Đường dẫn tài liệu (URL)</label>
                    <input
                      required
                      type="url"
                      placeholder="VD: https://drive.google.com/file/..."
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                      value={newDoc.url}
                      onChange={e => setNewDoc({...newDoc, url: e.target.value})}
                    />
                  </div>
                )}
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={uploading}
                    className="w-full flex flex-col items-center justify-center gap-1 rounded-2xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 disabled:opacity-70"
                  >
                    {uploading ? (
                      <>
                        <div className="flex items-center gap-2">
                          <Loader2 size={18} className="animate-spin" />
                          <span>Đang tải lên... {uploadProgress}%</span>
                        </div>
                        <div className="w-full max-w-[200px] h-1 bg-blue-400 rounded-full mt-1 overflow-hidden">
                          <motion.div 
                            className="h-full bg-white" 
                            initial={{ width: 0 }}
                            animate={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </>
                    ) : 'Xác nhận tải lên'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewDoc && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-10">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setPreviewDoc(null)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full h-full max-w-6xl rounded-3xl bg-white shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white/50 backdrop-blur-sm z-10 sticky top-0">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{previewDoc.name}</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">Người đăng: {previewDoc.uploadedBy}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <a 
                    href={previewDoc.url}
                    download
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-blue-50 hover:text-blue-600 transition-all"
                  >
                    <Download size={18} /> Tải về
                  </a>
                  <button onClick={() => setPreviewDoc(null)} className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-all">
                    <X size={20} />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 bg-slate-100 flex items-center justify-center overflow-hidden">
                <iframe 
                  src={previewDoc.url} 
                  className="w-full h-full border-none bg-white"
                  title="Document Preview"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
