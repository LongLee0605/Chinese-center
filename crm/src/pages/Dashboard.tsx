import { Link } from 'react-router-dom';
import { FileText, BookOpen, ClipboardList } from 'lucide-react';

const cards = [
  { to: '/posts', label: 'Bài viết', icon: FileText },
  { to: '/courses', label: 'Khóa học', icon: BookOpen },
  { to: '/quizzes', label: 'Bài test', icon: ClipboardList },
];

export default function Dashboard() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Tổng quan</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="p-6 bg-white rounded-lg shadow hover:shadow-md flex items-center gap-4"
          >
            <Icon size={32} className="text-gray-600" />
            <span className="font-medium">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
