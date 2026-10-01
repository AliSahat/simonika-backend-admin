"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import { Waves, User, ArrowUpRight, House, Droplet } from "lucide-react";

import WaterWaves from "@/components/WaterWaves";

export default function Sidebar({ expanded = false }: { expanded?: boolean }) {
  const { pathname } = useRouter();
  const menuItems = [
    { icon: Waves, label: "Wadah", href: "/pool/read", active: pathname.startsWith('/pool') },
    { icon: User, label: "Profil", href: "/profile", active: pathname.startsWith('/profile') },
  ];
  return (
    <aside className={`app-sidebar ${expanded ? "app-sidebar-expanded" : ""}`} aria-label="Navigasi utama">
      <Link href="/pool/read" className="app-sidebar-brand" aria-label="SIMONIKA — beranda"><span className="app-sidebar-logo"><Droplet size={30} /><Waves size={19} /></span><span>SIMONIKA</span></Link>
      <nav><span className="app-sidebar-caption">WORKSPACE</span>{expanded && <Link href="/pool/read" className="app-sidebar-link"><House size={20} aria-hidden="true" /><span>Workspace</span></Link>}{menuItems.map(item => <Link key={item.href} href={item.href} aria-current={item.active ? 'page' : undefined} className={`app-sidebar-link ${item.active ? 'active' : ''}`}><item.icon size={22} aria-hidden="true" /><span>{item.label}</span></Link>)}</nav>
      {expanded && <div className="app-sidebar-bottom"><WaterWaves className="app-sidebar-waves" /><div className="app-sidebar-tip"><p>Monitoring air<br />yang lebih sederhana.</p><span><Waves size={18} aria-hidden="true" /> SIMONIKA</span></div></div>}
      {!expanded && <Link href="/profile" className="app-sidebar-user"><span className="app-sidebar-avatar"><User size={20} aria-hidden="true" /></span><span>Akun saya</span><ArrowUpRight size={14} aria-hidden="true" /></Link>}
    </aside>
  );
}
