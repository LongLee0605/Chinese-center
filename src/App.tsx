import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ScrollToTop from './components/layout/ScrollToTop';

const HomePage = lazy(() => import('./pages/HomePage'));
const CoursesPage = lazy(() => import('./pages/CoursesPage'));
const TeachersPage = lazy(() => import('./pages/TeachersPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const LevelTestPage = lazy(() => import('./pages/LevelTestPage'));
const QuizListPage = lazy(() => import('./pages/QuizListPage'));
const QuizTestPage = lazy(() => import('./pages/QuizTestPage'));
const BookTrialPage = lazy(() => import('./pages/BookTrialPage'));
const SchedulePage = lazy(() => import('./pages/SchedulePage'));
const FaqPage = lazy(() => import('./pages/FaqPage'));
const BlogPage = lazy(() => import('./pages/BlogPage'));
const BlogPostPage = lazy(() => import('./pages/BlogPostPage'));
const CourseDetailPage = lazy(() => import('./pages/CourseDetailPage'));
const LessonDetailPage = lazy(() => import('./pages/LessonDetailPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));

function PageFallback() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center text-slate-500">
      Đang tải...
    </div>
  );
}

function App() {
  return (
    <>
      <ScrollToTop />
      <Layout>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/dang-nhap" element={<LoginPage />} />
            <Route path="/tai-khoan" element={<AccountPage />} />
            <Route path="/khoa-hoc" element={<CoursesPage />} />
            <Route path="/khoa-hoc/:courseSlug/bai-hoc/:lessonSlug" element={<LessonDetailPage />} />
            <Route path="/khoa-hoc/:courseSlug" element={<CourseDetailPage />} />
            <Route path="/doi-ngu-giao-vien" element={<TeachersPage />} />
            <Route path="/ve-chung-toi" element={<AboutPage />} />
            <Route path="/lien-he" element={<ContactPage />} />
            <Route path="/kiem-tra-trinh-do" element={<LevelTestPage />} />
            <Route path="/dang-ky-hoc-thu" element={<BookTrialPage />} />
            <Route path="/lich-hoc" element={<SchedulePage />} />
            <Route path="/cau-hoi-thuong-gap" element={<FaqPage />} />
            <Route path="/tin-tuc" element={<BlogPage />} />
            <Route path="/tin-tuc/:slug" element={<BlogPostPage />} />
            <Route path="/bai-test" element={<QuizListPage />} />
            <Route path="/bai-test/:slug" element={<QuizTestPage />} />
          </Routes>
        </Suspense>
      </Layout>
    </>
  );
}

export default App;
