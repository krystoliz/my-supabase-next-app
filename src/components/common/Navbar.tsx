import Image from 'next/image';
import Link from 'next/link';

export default function Navbar() {
    return (
    <nav className="flex items-center justify-between p-4 bg-gray-800 text-white">
      {/* Logo and App Title */}
      <Link href="/" className="flex items-center space-x-2">
        <Image
          src="/logo.svg" // Make sure your logo.svg is in the public directory
          alt="My Flashcards App Logo"
          width={32}
          height={32}
          priority
        />
        <span className="text-xl font-bold">Neuroflash</span>
      </Link>

      {/* Navigation Links */}
      <div className="flex space-x-6">
        <Link href="/" className="hover:text-gray-300">Dashboard</Link>
        <Link href="/flashcards" className="hover:text-gray-300">Flashcards</Link>
        {/* Placeholder for future Quizzes and Analytics */}
        <span className="text-gray-400 cursor-not-allowed">Quizzes</span>
        <span className="text-gray-400 cursor-not-allowed">Analytics</span>
      </div>

      {/* User Profile Placeholder */}
      <div className="flex items-center space-x-2">
        <span className="text-white">Anne</span> {/* Replace with dynamic user name */}
        <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center text-sm font-bold">A</div> {/* User initial/avatar */}
      </div>
    </nav>
  );
}