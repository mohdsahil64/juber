import { LayoutDashboard, FileText, Eye, ArrowRightLeft, X } from 'lucide-react';
import { NavLink, Link, useLocation } from 'react-router';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  return (
    <aside
      className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-gray-900 text-white overflow-y-auto z-40 transition-all duration-300 ${isOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full lg:translate-x-0'
        }`}
    >
      <div className={`p-6 ${isOpen ? 'block' : 'hidden'}`}>
        {/* Close button for mobile */}
        <button
          onClick={onClose}
          className="lg:hidden absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="mb-6">
          <h3 className="text-xs uppercase tracking-wider text-gray-400 mb-4">META DT</h3>
        </div>

        <nav className="space-y-2">
          <NavLink
            to="/dashboard"
            end
            onClick={() => window.innerWidth < 1024 && onClose()}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                ? 'bg-green-600 text-white'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Dashboard</span>
          </NavLink>

          <div className="pt-2">
            <p className="text-xs uppercase tracking-wider text-gray-400 px-4 mb-2">Manage Report</p>
            <Link
              to="/dashboard/view-report?network=bsc"
              onClick={() => window.innerWidth < 1024 && onClose()}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${location.pathname === '/dashboard/view-report' && location.search.includes('network=bsc')
                ? 'bg-green-600 text-white'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
            >
              <Eye className="w-5 h-5" />
              <span>BSC View Report</span>
            </Link>
          </div>

          {/* <NavLink
            to="/dashboard/master-view-transfer"
            onClick={() => window.innerWidth < 1024 && onClose()}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-green-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <ArrowRightLeft className="w-5 h-5" />
            <span>Master View Transfer</span>
          </NavLink> */}
        </nav>
      </div>
    </aside>
  );
}
