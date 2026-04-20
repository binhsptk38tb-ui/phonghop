import { useEffect, useState } from 'react';
import { userService } from './services/userService';
import { UserProfile } from './types';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import MeetingRoom from './components/MeetingRoom';
import UserManagement from './components/UserManagement';
import Layout from './components/Layout';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'users' | 'meeting'>('dashboard');
  const [activeMeetingId, setActiveMeetingId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = userService.subscribeAuth((profile) => {
      setUser(profile);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-slate-600 font-medium">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={userService.login} />;
  }

  const navigateToMeeting = (id: string) => {
    setActiveMeetingId(id);
    setCurrentPage('meeting');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard user={user} onJoinMeeting={navigateToMeeting} />;
      case 'users':
        return user.role === 'admin' ? (
          <UserManagement />
        ) : (
          <div className="p-8 text-center">Bạn không có quyền truy cập trang này.</div>
        );
      case 'meeting':
        return activeMeetingId ? (
          <MeetingRoom 
            meetingId={activeMeetingId} 
            user={user} 
            onBack={() => {
              setActiveMeetingId(null);
              setCurrentPage('dashboard');
            }} 
          />
        ) : null;
      default:
        return <Dashboard user={user} onJoinMeeting={navigateToMeeting} />;
    }
  };

  return (
    <Layout 
      user={user} 
      currentPage={currentPage} 
      onNavigate={setCurrentPage}
      onLogout={userService.logout}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage + (activeMeetingId || '')}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="h-full"
        >
          {renderPage()}
        </motion.div>
      </AnimatePresence>
    </Layout>
  );
}
