import { ReactNode } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import StickyContact from './StickyContact';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden pb-safe">
      <Navbar />
      <main className="flex-1 min-w-0">{children}</main>
      <Footer />
      <StickyContact />
    </div>
  );
}
