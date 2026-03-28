'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Menu, X, LogOut, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

type HeaderVariant = 'default' | 'hero';

export default function PublicHeader({
  variant = 'default',
  /** hero แบบพื้นหลังสว่าง (ขาว/ฟ้าอ่อน) — ใช้ตัวอักษรสีเข้มแทนสีขาวบน gradient เดิม */
  heroLight = false,
}: {
  variant?: HeaderVariant;
  heroLight?: boolean;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [solidNav, setSolidNav] = useState(false);

  useEffect(() => {
    if (variant !== 'hero') return;
    const onScroll = () => setSolidNav(window.scrollY > 72);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [variant]);

  const onHero = variant === 'hero';
  const lightOnGradient = onHero && !solidNav && !heroLight;

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-colors duration-300',
        lightOnGradient
          ? 'border-b border-white/15 bg-transparent'
          : heroLight && onHero && !solidNav
            ? 'border-b border-sky-100/80 bg-white/80 shadow-sm backdrop-blur-md'
            : 'border-b border-gray-100/80 bg-white/95 shadow-sm backdrop-blur-md'
      )}
    >
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            {lightOnGradient ? (
              <span className="text-xl font-bold tracking-tight text-white lowercase sm:text-2xl">
                ff2
              </span>
            ) : (
              <>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-nong-purple to-nong-magenta">
                  <span className="text-lg font-bold text-white">F</span>
                </div>
                <span className="bg-gradient-to-r from-nong-purple to-nong-magenta bg-clip-text text-2xl font-bold text-transparent">
                  FF2
                </span>
              </>
            )}
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <Link
              href="/"
              className={cn(
                'text-sm font-medium transition-colors',
                lightOnGradient ? 'text-white/95 hover:text-white' : 'text-gray-700 hover:text-nong-purple'
              )}
            >
              หน้าแรก
            </Link>
            <Link
              href="/models"
              className={cn(
                'text-sm font-medium transition-colors',
                lightOnGradient ? 'text-white/95 hover:text-white' : 'text-gray-700 hover:text-nong-purple'
              )}
            >
              นางแบบ
            </Link>
            <Link
              href="/how-to-use"
              className={cn(
                'text-sm font-medium transition-colors',
                lightOnGradient ? 'text-white/95 hover:text-white' : 'text-gray-700 hover:text-nong-purple'
              )}
            >
              วิธีใช้งาน
            </Link>
            {isLoggedIn ? (
              <>
                <Link
                  href="/dashboard"
                  className={cn(
                    'text-sm font-medium transition-colors',
                    lightOnGradient ? 'text-white/95 hover:text-white' : 'text-gray-700 hover:text-nong-purple'
                  )}
                >
                  จัดการบัญชี
                </Link>
                <Link
                  href="/dashboard/profiles"
                  className={cn(
                    'text-sm font-medium transition-colors',
                    lightOnGradient ? 'text-white/95 hover:text-white' : 'text-gray-700 hover:text-nong-purple'
                  )}
                >
                  โปรไฟล์
                </Link>
                <Link
                  href="/dashboard/credits"
                  className={cn(
                    'text-sm font-medium transition-colors',
                    lightOnGradient ? 'text-white/95 hover:text-white' : 'text-gray-700 hover:text-nong-purple'
                  )}
                >
                  เครดิต
                </Link>
                <button
                  type="button"
                  className={cn(
                    'flex items-center gap-1 text-sm font-medium',
                    lightOnGradient ? 'text-white/95 hover:text-white' : 'text-gray-700 hover:text-nong-purple'
                  )}
                >
                  <LogOut className="h-4 w-4" />
                  ออกจากระบบ
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className={cn(
                    'text-sm font-medium transition-colors',
                    lightOnGradient ? 'text-white/95 hover:text-white' : 'text-gray-700 hover:text-nong-purple'
                  )}
                >
                  เข้าสู่ระบบ
                </Link>
                <Link
                  href="/register"
                  className={cn(
                    'rounded-full border px-5 py-2 text-sm font-semibold transition-all',
                    lightOnGradient
                      ? 'border-white/80 bg-white/15 text-white hover:bg-white/25'
                      : 'border-nong-purple/30 bg-gradient-to-r from-nong-purple to-nong-magenta text-white shadow-md hover:opacity-95'
                  )}
                >
                  สมัครสมาชิก
                </Link>
                <button
                  type="button"
                  className={cn(
                    'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium',
                    lightOnGradient
                      ? 'border-white/50 bg-white/10 text-white'
                      : 'border-gray-200 bg-gray-50 text-gray-800'
                  )}
                >
                  <span className="text-base leading-none">🇹🇭</span>
                  TH
                  <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                </button>
              </>
            )}
          </div>

          <button
            type="button"
            className={cn(
              'rounded-xl p-2 md:hidden',
              lightOnGradient ? 'text-white hover:bg-white/10' : 'text-gray-800 hover:bg-gray-100'
            )}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="เมนู"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="animate-fade-in border-t border-gray-100 py-4 md:hidden">
            <div className="flex flex-col gap-3">
              <Link href="/" className="px-2 font-medium text-gray-800" onClick={() => setIsMenuOpen(false)}>
                หน้าแรก
              </Link>
              <Link href="/models" className="px-2 font-medium text-gray-800" onClick={() => setIsMenuOpen(false)}>
                นางแบบ
              </Link>
              <Link href="/how-to-use" className="px-2 font-medium text-gray-800" onClick={() => setIsMenuOpen(false)}>
                วิธีใช้งาน
              </Link>
              {isLoggedIn ? (
                <>
                  <Link href="/dashboard" className="px-2 font-medium text-gray-800" onClick={() => setIsMenuOpen(false)}>
                    จัดการบัญชี
                  </Link>
                  <Link href="/dashboard/profiles" className="px-2 font-medium text-gray-800" onClick={() => setIsMenuOpen(false)}>
                    โปรไฟล์
                  </Link>
                  <Link href="/dashboard/credits" className="px-2 font-medium text-gray-800" onClick={() => setIsMenuOpen(false)}>
                    เครดิต
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login" className="px-2 font-medium text-gray-800" onClick={() => setIsMenuOpen(false)}>
                    เข้าสู่ระบบ
                  </Link>
                  <Link
                    href="/register"
                    className="mx-2 rounded-full bg-gradient-to-r from-nong-purple to-nong-magenta py-3 text-center font-semibold text-white"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    สมัครสมาชิก
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
