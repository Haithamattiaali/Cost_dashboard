import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Upload as UploadIcon,
  TrendingUp,
  BarChart3,
  Settings,
  FileText,
  Sparkles
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    // { name: 'Visual Builder', href: '/playground', icon: Sparkles },
    { name: 'Upload Data', href: '/upload', icon: UploadIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-[1920px] mx-auto px-6 sm:px-8 lg:px-10 xl:px-12">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {/* Proceed Logo on the left */}
                <img
                  src="/assets/proceed-logo.png"
                  alt="Proceed"
                  className="h-14 object-contain"
                />
              </div>
              <div className="ml-6">
                <h1 className="text-lg font-semibold text-gray-900">Cost Dashboard</h1>
                <p className="text-sm text-gray-500">Total Cost of Ownership Analytics</p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              {/* DMSCO Logo (Parent Company) */}
              <div className="flex flex-col items-center">
                <img
                  src="/assets/dmsco-logo.png"
                  alt="DMSCO"
                  className="h-12 object-contain"
                />
                <span className="text-[10px] text-gray-400 mt-1">Parent Company</span>
              </div>
              <button className="p-2 text-gray-500 hover:text-gray-700">
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-[1920px] mx-auto px-6 sm:px-8 lg:px-10 xl:px-12">
          <div className="flex space-x-8">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium py-4
                    ${isActive
                      ? 'border-[#9e1f63] text-[#9e1f63]'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }
                  `}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        <div className="py-6">
          <div className="max-w-[1920px] mx-auto px-6 sm:px-8 lg:px-10 xl:px-12">
            {children}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-[1800px] mx-auto px-6 sm:px-8 lg:px-10 xl:px-12 py-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              © 2025 PROCEED. All rights reserved.
            </p>
            <div className="flex space-x-4 text-sm text-gray-500">
              <button className="hover:text-gray-700 flex items-center">
                <FileText className="h-4 w-4 mr-1" />
                Export Report
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}