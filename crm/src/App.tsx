import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ScrollToTop from './components/ScrollToTop';
import { ToastProvider } from './context/ToastContext';
import Layout from './layout/Layout';

const Login = lazy(() => import('./pages/Login'));
const PostsList = lazy(() => import('./pages/posts/PostsList'));
const PostForm = lazy(() => import('./pages/posts/PostForm'));
const CoursesList = lazy(() => import('./pages/courses/CoursesList'));
const CourseForm = lazy(() => import('./pages/courses/CourseForm'));
const CourseDetail = lazy(() => import('./pages/courses/CourseDetail'));
const QuizzesList = lazy(() => import('./pages/quizzes/QuizzesList'));
const QuizDetail = lazy(() => import('./pages/quizzes/QuizDetail'));
const QuizAttemptDetail = lazy(() => import('./pages/quizzes/QuizAttemptDetail'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Mail = lazy(() => import('./pages/Mail'));
const LeadsList = lazy(() => import('./pages/leads/LeadsList'));
const LeadDetail = lazy(() => import('./pages/leads/LeadDetail'));
const TrialRegistrationsList = lazy(() => import('./pages/trial-registrations/TrialRegistrationsList'));
const ClassesList = lazy(() => import('./pages/classes/ClassesList'));
const ClassForm = lazy(() => import('./pages/classes/ClassForm'));
const ClassDetail = lazy(() => import('./pages/classes/ClassDetail'));
const AccountsList = lazy(() => import('./pages/accounts/AccountsList'));
const AccountForm = lazy(() => import('./pages/accounts/AccountForm'));
const AccountDetail = lazy(() => import('./pages/accounts/AccountDetail'));

function PageFallback() {
  return (
    <div className="p-8 text-center text-slate-500">
      Đang tải...
    </div>
  );
}

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
        <Suspense fallback={<PageFallback />}>
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
              <Route path="trial-registrations" element={<TrialRegistrationsList />} />
              <Route path="classes" element={<ClassesList />} />
              <Route path="classes/new" element={<ClassForm />} />
              <Route path="classes/:id/edit" element={<ClassForm />} />
              <Route path="classes/:id" element={<ClassDetail />} />
              <Route path="accounts" element={<AccountsList />} />
              <Route path="accounts/new" element={<AccountForm />} />
              <Route path="accounts/:id/edit" element={<AccountForm />} />
              <Route path="accounts/:id" element={<AccountDetail />} />
              <Route path="mail" element={<Mail />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </ToastProvider>
    </AuthProvider>
  );
}
