import { Menu, LogOut } from 'lucide-react';

interface HeaderProps {
  onLogout: () => void;
  onToggleSidebar: () => void;
}

export default function Header({ onLogout, onToggleSidebar }: HeaderProps) {
  return (
    <header className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 shadow-lg fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            className="text-white hover:text-green-400 transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-2xl text-white">DT MASTER</h1>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 text-white hover:text-green-400 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
