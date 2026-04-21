import { useState, useEffect } from 'react';
import React from 'react';
import { 
  Plus, 
  Calendar, 
  Clock, 
  MapPin, 
  ChevronRight, 
  Trash2,
  MoreVertical,
  Activity,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { meetingService } from '../services/meetingService';
import { Meeting, UserProfile } from '../types';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';

interface DashboardProps {
  user: UserProfile;
  onJoinMeeting: (id: string) => void;
}

export default function Dashboard({ user, onJoinMeeting }: DashboardProps) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [meetingToDelete, setMeetingToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newMeeting, setNewMeeting] = useState({
    title: '',
    description: '',
    scheduledAt: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    location: ''
  });

  useEffect(() => {
    const unsub = meetingService.subscribeMeetings(setMeetings);
    return () => unsub();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await meetingService.createMeeting({
      ...newMeeting,
      scheduledAt: new Date(newMeeting.scheduledAt),
      createdBy: user.uid
    });
    setShowCreateModal(false);
    setNewMeeting({
      title: '',
      description: '',
      scheduledAt: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      location: ''
    });
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setMeetingToDelete(id);
  };

  const confirmDelete = async () => {
    if (!meetingToDelete) return;
    
    try {
      setIsDeleting(true);
      await meetingService.deleteMeeting(meetingToDelete);
      setMeetingToDelete(null);
    } catch (error) {
      console.error('Error deleting meeting:', error);
      alert('Không thể xóa cuộc họp. Có thể bạn không có quyền hoặc có lỗi hệ thống.');
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ongoing':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
            <Activity size={12} className="animate-pulse" /> Đang diễn ra
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
            <CheckCircle2 size={12} /> Đã kết thúc
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
            <Clock size={12} /> Sắp diễn ra
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <header className="flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Danh sách cuộc họp</h2>
          <p className="text-slate-500 font-medium mt-1">Chào {user.name}, quản lý và theo dõi các buổi họp của nhà trường.</p>
        </div>
        {(user.role === 'chairperson' || user.role === 'secretary' || user.email === 'binhsptk38tb@gmail.com') && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700"
          >
            <Plus size={20} />
            Tạo cuộc họp mới
          </motion.button>
        )}
      </header>

      <div className="grid gap-6">
        {meetings.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20 bg-white rounded-3xl border-2 border-dashed border-slate-200 text-center">
            <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
              <Calendar size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Không có cuộc họp nào</h3>
            <p className="text-slate-500 mt-1 max-w-sm">Hiện tại không có cuộc họp nào được lập. Hãy tạo mới để bắt đầu.</p>
          </div>
        ) : (
          meetings.map((meeting) => (
            <motion.div
              layout
              key={meeting.id}
              onClick={() => onJoinMeeting(meeting.id)}
              className="group relative flex cursor-pointer items-center gap-6 overflow-hidden rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/60 transition-all hover:shadow-xl hover:shadow-slate-200/50 hover:ring-blue-200"
            >
              <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-50 p-4 text-center min-w-[100px] border border-slate-100 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-blue-400">
                  Tháng {format(meeting.scheduledAt.toDate ? meeting.scheduledAt.toDate() : new Date(meeting.scheduledAt), 'MM')}
                </span>
                <span className="text-3xl font-black text-slate-800 group-hover:text-blue-700">
                  {format(meeting.scheduledAt.toDate ? meeting.scheduledAt.toDate() : new Date(meeting.scheduledAt), 'dd')}
                </span>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  {getStatusBadge(meeting.status)}
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-tighter">
                    <Clock size={12} />
                    {format(meeting.scheduledAt.toDate ? meeting.scheduledAt.toDate() : new Date(meeting.scheduledAt), 'HH:mm')}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                  {meeting.title}
                </h3>
                <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium text-slate-500">
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-slate-400" />
                    {meeting.location || 'Phòng họp trực tuyến'}
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle size={14} className="text-slate-400" />
                    Mã số: {meeting.id.slice(0, 8).toUpperCase()}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {(user.role === 'chairperson' || user.role === 'secretary' || user.email === 'binhsptk38tb@gmail.com') && (
                  <button
                    onClick={(e) => handleDeleteClick(e, meeting.id)}
                    className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                    title="Xóa cuộc họp"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
                <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                  <ChevronRight size={24} />
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 overflow-y-auto pt-20 pb-20">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl rounded-3xl bg-white shadow-2xl p-8"
            >
              <h3 className="text-2xl font-bold text-slate-900 mb-6">Lập cuộc họp mới</h3>
              <form onSubmit={handleCreate} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Chủ đề cuộc họp</label>
                  <input
                    required
                    type="text"
                    placeholder="VD: Họp giao ban đầu tuần chuyên môn khối 12"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    value={newMeeting.title}
                    onChange={e => setNewMeeting({...newMeeting, title: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Thời gian</label>
                    <input
                      required
                      type="datetime-local"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                      value={newMeeting.scheduledAt}
                      onChange={e => setNewMeeting({...newMeeting, scheduledAt: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Địa điểm</label>
                    <input
                      required
                      type="text"
                      placeholder="VD: Phòng hội đồng A1"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                      value={newMeeting.location}
                      onChange={e => setNewMeeting({...newMeeting, location: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Mô tả nội dung</label>
                  <textarea
                    rows={3}
                    placeholder="Mô tả tóm tắt mục đích cuộc họp..."
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 resize-none"
                    value={newMeeting.description}
                    onChange={e => setNewMeeting({...newMeeting, description: e.target.value})}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 rounded-2xl border border-slate-200 py-3.5 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="flex-[2] rounded-2xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700"
                  >
                    Xác nhận tạo
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {meetingToDelete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setMeetingToDelete(null)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl p-8 text-center"
            >
              <div className="h-16 w-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Xác nhận xóa cuộc họp</h3>
              <p className="text-slate-500 mb-6">Bạn có chắc chắn muốn xóa cuộc họp này? Hành động này không thể hoàn tác.</p>
              
              <div className="flex gap-3">
                <button
                  disabled={isDeleting}
                  onClick={() => setMeetingToDelete(null)}
                  className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-50"
                >
                  Quay lại
                </button>
                <button
                  disabled={isDeleting}
                  onClick={confirmDelete}
                  className="flex-1 rounded-2xl bg-red-600 py-3 text-sm font-bold text-white shadow-lg shadow-red-200 transition-all hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting && <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                  {isDeleting ? 'Đang xóa...' : 'Xóa ngay'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
