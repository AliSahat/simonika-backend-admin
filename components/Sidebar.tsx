"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Waves, User } from "lucide-react";
import { useState } from "react";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname() || "";

  const menuItems = [
    { icon: Waves, label: "Manajemen Kolam", href: "/pool/read" },
    { icon: User, label: "Profile", href: "/profile" },
  ];

  return (
    <div className="flex bg-gray-100">
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          w-32 bg-white border-r border-gray-200
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          flex flex-col shadow-lg
        `}
      >
        {/* Brand */}
        <div className="h-16 flex items-center justify-center border-b border-gray-200">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-white">
            S
          </div>
        </div>

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`
                      flex flex-col items-center justify-center py-3 px-2 mx-2 rounded-lg
                      transition-colors cursor-pointer
                      ${
                        isActive
                          ? "bg-blue-50 text-blue-600"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }
                    `}
                    onClick={() => setIsOpen(false)}
                  >
                    <Icon
                      className={`w-6 h-6 mb-1 ${
                        isActive ? "text-blue-600" : ""
                      }`}
                    />
                    <span className="text-xs text-center leading-tight">
                      {item.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mb-1">
              <User className="w-5 h-5 text-gray-600" />
            </div>
            <span className="text-xs text-gray-600">Admin</span>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default Sidebar;
