// src/app/(main)/layout.tsx
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow p-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}