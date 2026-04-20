import { LogIn, GraduationCap, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    try {
      setError(null);
      setIsLoggingIn(true);
      await onLogin();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/popup-blocked') {
        setError('Trình duyệt đã chặn cửa sổ đăng nhập. Vui lòng bật cho phép pop-up.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('Tên miền này chưa được xác thực trong Firebase Console.');
      } else {
        setError('Đã có lỗi xảy ra hoặc bạn chưa được cấp quyền truy cập.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100 via-slate-50 to-indigo-100 px-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl shadow-2xl border border-white/20"
      >
        <div className="bg-blue-600 p-8 text-center text-white">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm shadow-inner mb-4">
            <GraduationCap size={40} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Phòng Họp Không Giấy</h1>
          <p className="mt-2 text-blue-100 font-medium">Hệ thống quản lý hội họp số cho trường học</p>
        </div>
        
        <div className="p-8">
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-slate-800">Chào mừng bạn quay lại</h2>
              <p className="text-slate-500 text-sm">Vui lòng đăng nhập bằng tài khoản Google trường cấp</p>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-start gap-3 text-red-600"
              >
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </motion.div>
            )}
            
            <button
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-xl bg-slate-900 px-6 py-4 text-white transition-all hover:bg-slate-800 active:scale-95 shadow-lg shadow-slate-900/10 disabled:opacity-70"
            >
              <div className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-500 group-hover:translate-x-[100%]"></div>
              {isLoggingIn ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <LogIn className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              )}
              <span className="font-semibold tracking-wide">
                {isLoggingIn ? 'Đang kết nối...' : 'Đăng nhập với Google'}
              </span>
            </button>
            
            <div className="mt-8 grid grid-cols-3 gap-2 text-center text-[10px] uppercase tracking-widest text-slate-400 font-bold">
              <div className="border-t border-slate-100 pt-4">Bảo mật</div>
              <div className="border-t border-slate-100 pt-4">Nhanh chóng</div>
              <div className="border-t border-slate-100 pt-4">Tiết kiệm</div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
