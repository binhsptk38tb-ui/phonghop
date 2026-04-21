import { useState, useEffect } from 'react';
import React from 'react';
import { 
  UserPlus, 
  Mail, 
  User, 
  ShieldCheck, 
  Trash2, 
  Search,
  Filter,
  Edit2
} from 'lucide-react';
import { userService } from '../services/userService';
import { UserProfile, UserRole, UserPosition } from '../types';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [userToEdit, setUserToEdit] = useState<UserProfile | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    name: '',
    phoneNumber: '',
    position: 'teacher' as UserPosition,
    role: 'member' as UserRole
  });

  const [editFormData, setEditFormData] = useState({
    name: '',
    phoneNumber: '',
    position: 'teacher' as UserPosition,
    role: 'member' as UserRole
  });

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (userToEdit) {
      setEditFormData({
        name: userToEdit.name,
        phoneNumber: userToEdit.phoneNumber || '',
        position: userToEdit.position,
        role: userToEdit.role
      });
    }
  }, [userToEdit]);

  const loadUsers = async () => {
    const list = await userService.getAllUsers();
    setUsers(list);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    await userService.registerUser(newUser.email, newUser.name, newUser.position, newUser.role, newUser.phoneNumber);
    setShowAddModal(false);
    setNewUser({ email: '', name: '', phoneNumber: '', position: 'teacher', role: 'member' });
    loadUsers();
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userToEdit?.uid) {
      try {
        setIsUpdating(true);
        await userService.updateUser(userToEdit.uid, editFormData);
        alert('Cập nhật thông tin thành viên thành công!');
        setUserToEdit(null);
        await loadUsers();
      } catch (error) {
        console.error('Error updating user:', error);
        alert('Không thể cập nhật thông tin thành viên. Vui lòng thử lại.');
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const confirmDelete = async () => {
    if (userToDelete?.uid) {
      try {
        await userService.deleteUser(userToDelete.uid);
        setUserToDelete(null);
        loadUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPositionLabel = (pos: string) => {
    switch (pos) {
      case 'admin': return 'Quản trị viên';
      case 'principal': return 'Hiệu trưởng';
      case 'vice_principal': return 'Phó hiệu trưởng';
      case 'teacher': return 'Giáo viên';
      case 'staff': return 'Nhân viên';
      default: return 'Khách';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'chairperson': return 'Chủ tọa';
      case 'secretary': return 'Thư ký';
      case 'member': return 'Thành viên';
      default: return 'Khác';
    }
  };

  return (
    <div className="space-y-8 pb-10 h-full flex flex-col">
      <header className="flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Quản lý thành viên</h2>
          <p className="text-slate-500 font-medium mt-1">Quản lý tài khoản, phân quyền cho CBQL, giáo viên và nhân viên.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-slate-200 transition-all hover:bg-slate-800"
        >
          <UserPlus size={20} />
          Cấp tài khoản mới
        </button>
      </header>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden flex-1 flex flex-col">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-200 w-80">
            <Search className="text-slate-400 h-4 w-4" />
            <input 
              type="text" 
              placeholder="Tìm tên, email..." 
              className="bg-transparent border-none outline-none text-sm font-medium w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 text-slate-500 font-bold text-sm hover:bg-slate-100 rounded-xl transition-all">
            <Filter size={16} /> Bộ lọc
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="border-b border-slate-100 italic">
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">#</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Họ và Tên</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Chức vụ</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Vai trò họp</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Ngày tạo</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredUsers.map((u, index) => (
                <tr key={u.uid || u.email} className="group hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-slate-400">{index + 1}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold shadow-inner">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-bold text-slate-800">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-slate-700">{getPositionLabel(u.position)}</span>
                    {u.phoneNumber && <p className="text-[10px] font-bold text-blue-500 mt-0.5">{u.phoneNumber}</p>}
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                      u.role === 'chairperson' ? "bg-emerald-50 text-emerald-600" :
                      u.role === 'secretary' ? "bg-amber-50 text-amber-600" :
                      "bg-slate-100 text-slate-600"
                    )}>
                      {getRoleLabel(u.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-slate-400">
                      {u.createdAt ? format(u.createdAt.toDate ? u.createdAt.toDate() : new Date(), 'dd/MM/yyyy') : 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 text-slate-300">
                      <button 
                        onClick={() => setUserToEdit(u)}
                        className="p-2 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                        title="Chỉnh sửa"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => setUserToDelete(u)}
                        className="p-2 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        title="Xóa"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl p-8"
            >
              <h3 className="text-2xl font-bold text-slate-900 mb-6">Cấp tài khoản thành viên</h3>
              <form onSubmit={handleAddUser} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Tên thành viên</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <input
                      required
                      type="text"
                      placeholder="VD: Nguyễn Văn A"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 py-3 font-medium outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                      value={newUser.name}
                      onChange={e => setNewUser({...newUser, name: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Email trường cấp</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <input
                      required
                      type="email"
                      placeholder="VD: a.nv@school.edu.vn"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 py-3 font-medium outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                      value={newUser.email}
                      onChange={e => setNewUser({...newUser, email: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Số điện thoại (tùy chọn)</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs uppercase">SĐT</div>
                    <input
                      type="tel"
                      placeholder="VD: 0912345678"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-14 pr-4 py-3 font-medium outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                      value={newUser.phoneNumber}
                      onChange={e => setNewUser({...newUser, phoneNumber: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Chức vụ</label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <select
                      className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 py-3 font-medium outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                      value={newUser.position}
                      onChange={e => setNewUser({...newUser, position: e.target.value as UserPosition})}
                    >
                      <option value="principal">Hiệu trưởng</option>
                      <option value="vice_principal">Phó hiệu trưởng</option>
                      <option value="teacher">Giáo viên</option>
                      <option value="staff">Nhân viên</option>
                      <option value="admin">Quản trị viên</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Vai trò trong cuộc họp</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                      <select
                        className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 py-3 font-medium outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                        value={newUser.role}
                        onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})}
                      >
                        <option value="member">Thành viên</option>
                        <option value="chairperson">Chủ tọa</option>
                        <option value="secretary">Thư ký</option>
                      </select>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 rounded-2xl border border-slate-200 py-3.5 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50"
                  >
                    Đóng
                  </button>
                  <button
                    type="submit"
                    className="flex-[2] rounded-2xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700"
                  >
                    Xác nhận cấp
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit User Modal */}
      <AnimatePresence>
        {userToEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setUserToEdit(null)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl p-8"
            >
              <h3 className="text-2xl font-bold text-slate-900 mb-6">Chỉnh sửa thành viên</h3>
              <form onSubmit={handleEditUser} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Tên thành viên</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <input
                      required
                      type="text"
                      placeholder="VD: Nguyễn Văn A"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 py-3 font-medium outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                      value={editFormData.name}
                      onChange={e => setEditFormData({...editFormData, name: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Số điện thoại (tùy chọn)</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs uppercase">SĐT</div>
                    <input
                      type="tel"
                      placeholder="VD: 0912345678"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-14 pr-4 py-3 font-medium outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                      value={editFormData.phoneNumber}
                      onChange={e => setEditFormData({...editFormData, phoneNumber: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Chức vụ</label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <select
                      className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 py-3 font-medium outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                      value={editFormData.position}
                      onChange={e => setEditFormData({...editFormData, position: e.target.value as UserPosition})}
                    >
                      <option value="principal">Hiệu trưởng</option>
                      <option value="vice_principal">Phó hiệu trưởng</option>
                      <option value="teacher">Giáo viên</option>
                      <option value="staff">Nhân viên</option>
                      <option value="admin">Quản trị viên</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Vai trò trong cuộc họp</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                      <select
                        className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 py-3 font-medium outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                        value={editFormData.role}
                        onChange={e => setEditFormData({...editFormData, role: e.target.value as UserRole})}
                      >
                        <option value="member">Thành viên</option>
                        <option value="chairperson">Chủ tọa</option>
                        <option value="secretary">Thư ký</option>
                      </select>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setUserToEdit(null)}
                    className="flex-1 rounded-2xl border border-slate-200 py-3.5 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50"
                  >
                    Đóng
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className={cn(
                      "flex-[2] rounded-2xl py-3.5 text-sm font-bold text-white shadow-lg transition-all",
                      isUpdating 
                        ? "bg-slate-400 cursor-not-allowed" 
                        : "bg-slate-900 shadow-slate-200 hover:bg-slate-800 active:scale-[0.98]"
                    )}
                  >
                    {isUpdating ? 'Đang cập nhật...' : 'Cập nhật'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete User Modal */}
      <AnimatePresence>
        {userToDelete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setUserToDelete(null)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm rounded-[2rem] bg-white shadow-2xl p-8 text-center"
            >
              <div className="mx-auto h-16 w-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-6">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Xác nhận xóa?</h3>
              <p className="text-slate-500 text-sm mb-8">
                Bạn có chắc chắn muốn xóa thành viên <br/>
                <span className="font-bold text-slate-800">"{userToDelete.name}"</span> không?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setUserToDelete(null)}
                  className="flex-1 rounded-2xl border border-slate-200 py-3.5 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 rounded-2xl bg-red-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-200 transition-all hover:bg-red-700"
                >
                  Xóa ngay
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
