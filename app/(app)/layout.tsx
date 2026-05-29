'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import PhoneFrame from '@/components/PhoneFrame';
import { MessageCircle, BarChart2, User } from 'lucide-react';

const TABS = [
  { href: '/practice', label: 'Pratique', Icon: MessageCircle },
  { href: '/progress', label: 'Progresso', Icon: BarChart2 },
  { href: '/profile',  label: 'Perfil',    Icon: User },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <PhoneFrame>
      <div className="h-full flex flex-col bg-[#f7f7f7]">
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>

        {/* Bottom tab bar */}
        <nav className="flex bg-white border-t border-gray-100 safe-area-bottom shrink-0">
          {TABS.map(({ href, label, Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
                  active ? 'text-[#58CC02]' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                <span className={`text-[10px] font-semibold ${active ? 'text-[#58CC02]' : 'text-gray-400'}`}>
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </PhoneFrame>
  );
}
