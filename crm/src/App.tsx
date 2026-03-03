import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ScrollToTop from './components/ScrollToTop';
import { ToastProvider } from './context/ToastContext';
import Layout from './layout/Layout';
import Login from './pages/Login';
import PostsList from './pages/posts/PostsList';
import PostForm from './pages/posts/PostForm';
import CoursesList from './pages/courses/CoursesList';
import CourseForm from './pages/courses/CourseForm';
import CourseDetail from './pages/courses/CourseDetail';
import QuizzesList from './pages/quizzes/QuizzesList';
import QuizDetail from './pages/quizzes/QuizDetail';
import QuizAttemptDetail from './pages/quizzes/QuizAttemptDetail';
import Dashboard from './pages/Dashboard';
import Mail from './pages/Mail';
import LeadsList from './pages/leads/LeadsList';
import LeadDetail from './pages/leads/LeadDetail';
import AccountsList from './pages/accounts/AccountsList';
import AccountForm from './pages/accounts/AccountForm';
import AccountDetail from './pages/accounts/AccountDetail';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  if (loading) return <div className="p-8 text-center">Đang tải...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'STUDENT' || user.role === 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="text-center max-w-md">
          <p className="text-lg font-medium text-slate-800">Bạn không có quyền truy cập CRM</p>
          <p className="text-slate-600 mt-2 text-sm">
            {user.role === 'STUDENT' ? 'Học viên chỉ có thể xem bài giảng và làm bài test trên website.' : 'Vai trò Admin đã bỏ quyền CRM.'}
          </p>
          <button
            type="button"
            onClick={logout}
            className="mt-6 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
      <ScrollToTop />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="posts" element={<PostsList />} />
          <Route path="posts/new" element={<PostForm />} />
          <Route path="posts/:id" element={<PostForm />} />
          <Route path="courses" element={<CoursesList />} />
          <Route path="courses/new" element={<CourseForm />} />
          <Route path="courses/:id/edit" element={<CourseForm />} />
          <Route path="courses/:id" element={<CourseDetail />} />
          <Route path="quizzes" element={<QuizzesList />} />
          <Route path="quizzes/attempt/:attemptId" element={<QuizAttemptDetail />} />
          <Route path="quizzes/:id" element={<QuizDetail />} />
          <Route path="leads" element={<LeadsList />} />
          <Route path="leads/:id" element={<LeadDetail />} />
          <Route path="accounts" element={<AccountsList />} />
          <Route path="accounts/new" element={<AccountForm />} />
          <Route path="accounts/:id/edit" element={<AccountForm />} />
          <Route path="accounts/:id" element={<AccountDetail />} />
          <Route path="mail" element={<Mail />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}
