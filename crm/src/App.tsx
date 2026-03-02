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
import TeachersList from './pages/teachers/TeachersList';
import TeacherForm from './pages/teachers/TeacherForm';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8 text-center">Đang tải...</div>;
  if (!user) return <Navigate to="/login" replace />;
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
          <Route path="courses/:id" element={<CourseDetail />} />
          <Route path="quizzes" element={<QuizzesList />} />
          <Route path="quizzes/attempt/:attemptId" element={<QuizAttemptDetail />} />
          <Route path="quizzes/:id" element={<QuizDetail />} />
          <Route path="leads" element={<LeadsList />} />
          <Route path="leads/:id" element={<LeadDetail />} />
          <Route path="teachers" element={<TeachersList />} />
          <Route path="teachers/new" element={<TeacherForm />} />
          <Route path="teachers/:id" element={<TeacherForm />} />
          <Route path="mail" element={<Mail />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}
