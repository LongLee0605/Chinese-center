import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import CoursesPage from './pages/CoursesPage';
import TeachersPage from './pages/TeachersPage';
import ContactPage from './pages/ContactPage';
import AboutPage from './pages/AboutPage';
import LevelTestPage from './pages/LevelTestPage';
import QuizListPage from './pages/QuizListPage';
import QuizTestPage from './pages/QuizTestPage';
import BookTrialPage from './pages/BookTrialPage';
import SchedulePage from './pages/SchedulePage';
import FaqPage from './pages/FaqPage';
import BlogPage from './pages/BlogPage';
import BlogPostPage from './pages/BlogPostPage';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/khoa-hoc" element={<CoursesPage />} />
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
    </Layout>
  );
}

export default App;
