'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  User,
  Wallet,
  Store,
  Settings,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SessionUser {
  email: string;
  role: string;
  accountType?: string;
  profileCount: number;
}

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/session');
        const data = await res.json();
        if (!data.user) {
          router.push('/login');
          return;
        }
        setUser(data.user);
      } catch {
        router.push('/login');
      }
    })();
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  const isPoster = user.role === 'ADMIN' || user.accountType !== 'BUYER';

  const navActive = (path: string, exact?: boolean) =>
    exact ? pathname === path : pathname === path || pathname.startsWith(`${path}/`);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">F</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
                FF2
              </span>
            </Link>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600 text-sm truncate max-w-[200px]">{user.email}</span>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center space-x-1 text-gray-600 hover:text-red-500"
              >
                <LogOut className="w-4 h-4" />
                <span>ออก</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <aside className="lg:col-span-1">
            <nav className="bg-white rounded-xl shadow-md p-4 space-y-1">
              <Link
                href="/dashboard"
                className={cn(
                  'flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors',
                  navActive('/dashboard', true)
                    ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                )}
              >
                <LayoutDashboard className="w-5 h-5 shrink-0" />
                <span>แดชบอร์ด</span>
              </Link>

              {isPoster ? (
                <>
                  <Link
                    href="/dashboard/profiles"
                    className={cn(
                      'flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors',
                      navActive('/dashboard/profiles')
                        ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white'
                        : 'text-gray-600 hover:bg-gray-50'
                    )}
                  >
                    <User className="w-5 h-5 shrink-0" />
                    <span>โปรไฟล์ ({user.profileCount}/50)</span>
                  </Link>
                </>
              ) : (
                <div className="px-4 py-3 rounded-lg bg-gray-50 text-gray-500 text-sm">
                  บัญชีผู้ใช้งาน: ดูงานได้จากหน้าแรก
                </div>
              )}

              <Link
                href="/dashboard/topup"
                className={cn(
                  'flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors',
                  navActive('/dashboard/topup')
                    ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                )}
              >
                <Wallet className="w-5 h-5 shrink-0" />
                <span>เติมเงิน</span>
              </Link>

              <Link
                href="/dashboard/shop"
                className={cn(
                  'flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors',
                  navActive('/dashboard/shop')
                    ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                )}
              >
                <Store className="w-5 h-5 shrink-0" />
                <span>ร้านค้า</span>
              </Link>

              {user.role === 'ADMIN' && (
                <Link
                  href="/admin"
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Settings className="w-5 h-5 shrink-0" />
                  <span>หลังบ้าน</span>
                </Link>
              )}
            </nav>
          </aside>

          <main className="lg:col-span-3">{children}</main>
        </div>
      </div>
    </div>
  );
}
