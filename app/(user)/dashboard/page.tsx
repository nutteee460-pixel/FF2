'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  User, 
  Image, 
  CreditCard, 
  Settings, 
  LogOut,
  Plus,
  ChevronRight
} from 'lucide-react';

interface UserData {
  id: string;
  email: string;
  name: string;
  role: string;
  accountType?: string;
  profileCount: number;
}

export default function UserDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState<any>(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const sessionRes = await fetch('/api/auth/session');
      const sessionData = await sessionRes.json();
      
      if (!sessionData.user) {
        router.push('/login');
        return;
      }

      setUser(sessionData.user);

      const creditsRes = await fetch('/api/credits');
      const creditsData = await creditsRes.json();
      setCredits(creditsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isPoster = user.role === 'ADMIN' || user.accountType !== 'BUYER';

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
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
              <span className="text-gray-600">{user.email}</span>
              <button
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
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6">
              <nav className="space-y-2">
                <Link
                  href="/dashboard"
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg bg-gradient-to-r from-primary-500 to-secondary-500 text-white"
                >
                  <LayoutDashboard className="w-5 h-5" />
                  <span>แดชบอร์ด</span>
                </Link>
                {isPoster ? (
                  <>
                    <Link
                      href="/dashboard/profiles"
                      className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50"
                    >
                      <User className="w-5 h-5" />
                      <span>โปรไฟล์ ({user.profileCount}/50)</span>
                    </Link>
                    <Link
                      href="/dashboard/posts"
                      className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50"
                    >
                      <Image className="w-5 h-5" />
                      <span>โพสต์</span>
                    </Link>
                  </>
                ) : (
                  <div className="px-4 py-3 rounded-lg bg-gray-50 text-gray-500 text-sm">
                    บัญชีผู้ใช้งาน: ดูและซื้องานได้จากหน้าแรก ไม่ต้องสร้างโปรไฟล์หรือโพสต์
                  </div>
                )}
                <Link
                  href="/dashboard/credits"
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  <CreditCard className="w-5 h-5" />
                  <span>เครดิต/เติมเงิน</span>
                </Link>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Welcome Card */}
            <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl p-6 text-white">
              <h1 className="text-2xl font-bold mb-2">ยินดีต้อนรับ, {user.name || user.email}</h1>
              <p className="opacity-90">
                {isPoster
                  ? 'จัดการโปรไฟล์และโพสต์ของคุณได้ที่นี่'
                  : 'คุณสามารถเติมเงินและใช้งานในฐานะผู้ซื้อได้จากเมนูด้านข้าง'}
              </p>
            </div>

            {/* Credits Summary */}
            {credits && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">วันใช้งานทั่วไป</p>
                      <p className="text-3xl font-bold text-gray-900">{credits.summary?.totalFreeDays || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-2xl">👤</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">วัน Super</p>
                      <p className="text-3xl font-bold text-yellow-600">{credits.summary?.totalSuperDays || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                      <span className="text-2xl">⭐</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">วัน Model</p>
                      <p className="text-3xl font-bold text-gray-600">{credits.summary?.totalModelDays || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-2xl">💎</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">เมนูด่วน</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isPoster && (
                  <Link
                    href="/dashboard/profiles/new"
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <Plus className="w-5 h-5 text-primary-500" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">สร้างโปรไฟล์ใหม่</p>
                        <p className="text-sm text-gray-500">เพิ่มโปรไฟล์นางแบบ</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </Link>
                )}
                <Link
                  href="/dashboard/credits"
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">เติมเงิน</p>
                      <p className="text-sm text-gray-500">เติมเงินซื้อวันใช้งาน</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </Link>
                {user.role === 'ADMIN' && (
                  <Link
                    href="/admin"
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-red-500 hover:bg-red-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <Settings className="w-5 h-5 text-red-500" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">หลังบ้าน</p>
                        <p className="text-sm text-gray-500">จัดการระบบ</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
