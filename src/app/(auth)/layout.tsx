// src/app/(auth)/layout.tsx
import Image from 'next/image';
import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left half with dark background and logo */}
      <div className="w-1/2 bg-gray-900 flex items-center justify-center text-white p-8">
        <Image
          src="/logo.svg" // Make sure your logo.svg is in the public directory
          alt="My Flashcards App Logo"
          width={150} // Adjust size as needed
          height={150}
          priority
        />
        {/* You could add your app name here if desired */}
      </div>

      {/* Right half with white background for forms */}
      <div className="w-1/2 bg-white flex flex-col items-center justify-center p-8">
        <div className="max-w-md w-full">
          {/* Tabs for Daftar / Masuk */}
          <div className="flex justify-start mb-8 text-2xl font-semibold">
            <Link href="/signup" className="mr-8 text-gray-500 hover:text-gray-900 transition-colors">Daftar</Link>
            <Link href="/login" className="text-gray-500 hover:text-gray-900 transition-colors">Masuk</Link>
          </div>
          {children} {/* This is where the login or signup page content will be rendered */}
        </div>
      </div>
    </div>
  );
}