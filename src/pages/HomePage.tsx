import Hero from '@/components/home/Hero';
import StatsBar from '@/components/home/StatsBar';
import PromoSection from '@/components/home/PromoSection';
import WhyUs from '@/components/home/WhyUs';
import CoursePreview from '@/components/home/CoursePreview';
import PostsPreview from '@/components/home/PostsPreview';
import TeachersPreview from '@/components/home/TeachersPreview';
import Testimonials from '@/components/home/Testimonials';
import CtaSection from '@/components/home/CtaSection';

export default function HomePage() {
  return (
    <>
      <Hero />
      <StatsBar />
      <PromoSection />
      <WhyUs />
      <CoursePreview />
      <PostsPreview />
      <TeachersPreview />
      <Testimonials />
      <CtaSection />
    </>
  );
}
