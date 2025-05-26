// src/components/common/Footer.tsx
export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 p-8 text-sm mt-10">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
        <p>© {new Date().getFullYear()} My Flashcards App. All rights reserved.</p>
        <div className="flex space-x-4 mt-4 md:mt-0">
          <a href="#" className="hover:underline">About</a>
          <a href="#" className="hover:underline">Contact</a>
          <a href="#" className="hover:underline">Privacy Policy</a>
        </div>
      </div>
    </footer>
  );
}