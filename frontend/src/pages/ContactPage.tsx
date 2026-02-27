import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import SectionTitle from '@/components/ui/SectionTitle';
import Button from '@/components/ui/Button';

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="min-h-screen">
      <section className="section-padding bg-primary-50">
        <div className="container-wide">
          <SectionTitle
            overline="Liên hệ"
            title="Đăng ký học thử hoặc tư vấn"
            subtitle="Điền form bên dưới, chúng tôi sẽ liên hệ trong vòng 24 giờ. Hoặc gọi trực tiếp hotline."
          />
          <div className="mt-12 grid lg:grid-cols-2 gap-12 lg:gap-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-8"
            >
              <div>
                <h3 className="text-lg font-semibold text-primary-900">Thông tin liên hệ</h3>
                <ul className="mt-4 space-y-4">
                  <li className="flex items-start gap-4">
                    <MapPin className="h-6 w-6 shrink-0 text-accent-600" />
                    <div>
                      <p className="font-medium text-primary-900">Địa chỉ</p>
                      <p className="text-primary-600">123 Nguyễn Văn Linh, Phường Tân Phong, Q.7, TP.HCM</p>
                    </div>
                  </li>
                  <li className="flex items-center gap-4">
                    <Phone className="h-6 w-6 shrink-0 text-accent-600" />
                    <div>
                      <p className="font-medium text-primary-900">Hotline</p>
                      <a href="tel:02812345678" className="text-primary-600 hover:text-accent-600">028 1234 5678</a>
                    </div>
                  </li>
                  <li className="flex items-center gap-4">
                    <Mail className="h-6 w-6 shrink-0 text-accent-600" />
                    <div>
                      <p className="font-medium text-primary-900">Email</p>
                      <a href="mailto:contact@chinese-center.com" className="text-primary-600 hover:text-accent-600">contact@chinese-center.com</a>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="rounded-2xl bg-white border border-primary-200 p-6">
                <p className="font-semibold text-primary-900">Giờ làm việc</p>
                <p className="mt-2 text-primary-600">Thứ 2 – Thứ 6: 8:00 – 21:00</p>
                <p className="text-primary-600">Thứ 7: 8:00 – 17:00</p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <div className="rounded-2xl border border-primary-200 bg-white p-6 sm:p-8 shadow-card">
                {sent ? (
                  <div className="text-center py-8">
                    <p className="text-lg font-semibold text-accent-600">Cảm ơn bạn đã gửi tin nhắn!</p>
                    <p className="mt-2 text-primary-600">Chúng tôi sẽ liên hệ sớm nhất.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-primary-900">Họ tên *</label>
                      <input id="name" name="name" type="text" required className="mt-1 block w-full rounded-lg border border-primary-300 px-4 py-3 min-h-[44px] text-base focus:border-accent-500 focus:ring-1 focus:ring-accent-500" placeholder="Nguyễn Văn A" />
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-primary-900">Số điện thoại *</label>
                      <input id="phone" name="phone" type="tel" required className="mt-1 block w-full rounded-lg border border-primary-300 px-4 py-3 min-h-[44px] text-base focus:border-accent-500 focus:ring-1 focus:ring-accent-500" placeholder="0901234567" />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-primary-900">Email *</label>
                      <input id="email" name="email" type="email" required className="mt-1 block w-full rounded-lg border border-primary-300 px-4 py-3 min-h-[44px] text-base focus:border-accent-500 focus:ring-1 focus:ring-accent-500" placeholder="email@example.com" />
                    </div>
                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-primary-900">Nội dung</label>
                      <textarea id="message" name="message" rows={4} className="mt-1 block w-full rounded-lg border border-primary-300 px-4 py-3 min-h-[44px] text-base focus:border-accent-500 focus:ring-1 focus:ring-accent-500" placeholder="Bạn muốn đăng ký khóa nào? Cần tư vấn gì?" />
                    </div>
                    <Button type="submit" size="lg" className="w-full sm:w-auto group">
                      Gửi tin nhắn
                      <Send className="ml-2 h-5 w-5 inline-block group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
