"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import { Waves, User, ArrowUpRight, House, Droplet, Search, Moon, ChevronsUpDown, PanelLeftClose } from "lucide-react";

import WaterWaves from "@/components/WaterWaves";

export default function Sidebar({ expanded = false }: { expanded?: boolean }) {
  const { pathname } = useRouter();
  const menuItems = [
    { icon: Waves, label: "Wadah", href: "/pool/read", active: pathname.startsWith('/pool') },
    { icon: User, label: "Profil", href: "/profile", active: pathname.startsWith('/profile') },
  ];
  return (
    <>
      <div className="bento-ambient-layer" aria-hidden="true">
        <span className="bento-orb bento-orb-amber" />
        <span className="bento-orb bento-orb-blue" />
        <span className="bento-orb bento-orb-emerald" />
        <span className="bento-orb bento-orb-cyan" />
      </div>
      <aside className={`app-sidebar ${expanded ? "app-sidebar-expanded" : ""}`} aria-label="Navigasi utama">
        <div className="app-sidebar-header">
          <Link href="/pool/read" className="app-sidebar-brand" aria-label="SIMONIKA — beranda">
            <span className="app-sidebar-logo"><Droplet size={20} /><Waves size={14} /></span>
            <span className="app-sidebar-brand-copy">
              <strong>SIMONIKA</strong>
              <small>Smart Water IoT</small>
            </span>
          </Link>
          <span className="app-sidebar-collapse-icon" aria-hidden="true">
            <PanelLeftClose size={15} />
          </span>
        </div>

        <Link href="/pool/read" className="app-sidebar-search" aria-label="Cari di workspace">
          <Search size={14} aria-hidden="true" />
          <span>Cari wadah...</span>
          <kbd>⌘K</kbd>
        </Link>

        <nav aria-label="Menu workspace">
          <span className="app-sidebar-caption">WORKSPACE</span>
          {expanded && (
            <Link href="/pool/read" className={`app-sidebar-link ${pathname === '/pool/read' ? 'active' : ''}`}>
              <House size={18} aria-hidden="true" />
              <span>Dashboard</span>
              <em className="app-sidebar-badge">Live</em>
            </Link>
          )}
          {menuItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={item.active ? 'page' : undefined}
              className={`app-sidebar-link ${item.active ? 'active' : ''}`}
            >
              <item.icon size={18} aria-hidden="true" />
              <span>{item.label}</span>
              {item.label === "Wadah" && <em className="app-sidebar-count">IoT</em>}
            </Link>
          ))}
        </nav>

        {expanded && (
          <div className="app-sidebar-bottom">
            <WaterWaves className="app-sidebar-waves" />
            <div className="app-sidebar-tip">
              <p>Monitoring air<br />yang lebih sederhana.</p>
              <span><Waves size={15} aria-hidden="true" /> SIMONIKA</span>
            </div>
          </div>
        )}

        <div className="app-sidebar-footer">
          <div className="app-sidebar-theme-row" aria-hidden="true">
            <span className="app-sidebar-theme-label">
              <Moon size={15} />
              <span>Dark mode</span>
            </span>
            <span className="app-sidebar-theme-switch">
              <span className="app-sidebar-theme-thumb" />
            </span>
          </div>

          <Link href="/profile" className="app-sidebar-user">
            <span className="app-sidebar-avatar"><User size={17} aria-hidden="true" /></span>
            <span className="app-sidebar-user-meta">
              <strong>Akun saya</strong>
              <small> Kelola profil & sesi</small>
            </span>
            {expanded ? <ChevronsUpDown size={15} aria-hidden="true" /> : <ArrowUpRight size={14} aria-hidden="true" />}
          </Link>
        </div>
      </aside>
    </>
  );
}
