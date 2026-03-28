'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAdminGuard } from '@/components/useAdminGuard';
import {
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  Settings,
  LogOut,
  DollarSign,
  Package,
  TrendingUp,
  Star,
  Gem,
  UserCircle,
} from 'lucide-react';

interface Stats {
  totalUsers: number;
  totalProfiles: number;
  approvedProfiles: number;
  pendingProfiles: number;
  approvedPosts: number;
  pendingPosts: number;
  totalCredits: number;
  approvedCredits: number;
  estimatedIncome: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  useAdminGuard();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (res.ok) {
        setStats(data.stats);
      } else if (res.status === 403) {
        router.push('/');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
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

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gray-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">F</span>
              </div>
              <span className="text-2xl font-bold">FF2 Admin</span>
            </Link>
            <div className="flex items-center space-x-4">
              <span className="text-gray-300">ผู้ดูแลระบบ</span>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 text-gray-300 hover:text-white"
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
              <h2 className="text-lg font-bold text-gray-900 mb-4">เมนูหลังบ้าน</h2>
              <nav className="space-y-2">
                <Link
                  href="/admin"
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg bg-gradient-to-r from-primary-500 to-secondary-500 text-white"
                >
                  <LayoutDashboard className="w-5 h-5" />
                  <span>แดชบอร์ด</span>
                </Link>
                <Link
                  href="/admin/users"
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  <Users className="w-5 h-5" />
                  <span>จัดการสมาชิก</span>
                </Link>
                <Link
                  href="/admin/posts"
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  <FileText className="w-5 h-5" />
                  <span>จัดการโพสต์</span>
                </Link>
                <Link
                  href="/admin/profiles"
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  <UserCircle className="w-5 h-5" />
                  <span>จัดการโปรไฟล์</span>
                </Link>
                <Link
                  href="/admin/credits"
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  <CreditCard className="w-5 h-5" />
                  <span>ประวัติเติมเงิน</span>
                </Link>
                <Link
                  href="/admin/packages"
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  <Package className="w-5 h-5" />
                  <span>จัดการแพ็คเกจ</span>
                </Link>
                <Link
                  href="/admin/settings"
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  <Settings className="w-5 h-5" />
                  <span>ตั้งค่า</span>
                </Link>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">แดชบอร์ด</h1>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">สมาชิกทั้งหมด</p>
                    <p className="text-3xl font-bold text-gray-900">{stats?.totalUsers || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-500" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">โปรไฟล์ทั้งหมด</p>
                    <p className="text-3xl font-bold text-gray-900">{stats?.totalProfiles || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-purple-500" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">โพสต์รอตรวจ</p>
                    <p className="text-3xl font-bold text-yellow-600">{stats?.pendingPosts || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                    <FileText className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">รายได้โดยประมาณ</p>
                    <p className="text-3xl font-bold text-green-600">{stats?.estimatedIncome || 0} ฿</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">จัดการระบบ</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link
                  href="/admin/users"
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <Users className="w-8 h-8 text-blue-500 mb-2" />
                  <p className="font-semibold text-gray-900">จัดการสมาชิก</p>
                  <p className="text-sm text-gray-500">ดู/แก้ไข/แบน</p>
                </Link>
                <Link
                  href="/admin/posts"
                  className="p-4 border border-gray-200 rounded-lg hover:border-yellow-500 hover:bg-yellow-50 transition-colors"
                >
                  <FileText className="w-8 h-8 text-yellow-500 mb-2" />
                  <p className="font-semibold text-gray-900">จัดการโพสต์</p>
                  <p className="text-sm text-gray-500">อนุมัติ/ปฏิเสธ</p>
                </Link>
                <Link
                  href="/admin/profiles"
                  className="p-4 border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
                >
                  <UserCircle className="w-8 h-8 text-purple-500 mb-2" />
                  <p className="font-semibold text-gray-900">จัดการโปรไฟล์</p>
                  <p className="text-sm text-gray-500">ค้นหา/เพิ่มวันใช้งาน</p>
                </Link>
                <Link
                  href="/admin/credits"
                  className="p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
                >
                  <CreditCard className="w-8 h-8 text-green-500 mb-2" />
                  <p className="font-semibold text-gray-900">เติมเงิน</p>
                  <p className="text-sm text-gray-500">อนุมัติสลิป</p>
                </Link>
                <Link
                  href="/admin/packages"
                  className="p-4 border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
                >
                  <Package className="w-8 h-8 text-purple-500 mb-2" />
                  <p className="font-semibold text-gray-900">แพ็คเกจ</p>
                  <p className="text-sm text-gray-500">ตั้งราคา</p>
                </Link>
              </div>
            </div>

            {/* Package Info Preview */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">ราคาแพ็คเกจปัจจุบัน</h2>
                <Link
                  href="/admin/packages"
                  className="text-primary-500 hover:text-primary-600 font-medium"
                >
                  แก้ไข →
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-yellow-400 rounded-lg p-4 bg-yellow-50">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    <span className="font-bold">Super</span>
                  </div>
                  <p className="text-gray-600">7 วัน: ฿5 | 14 วัน: ฿5</p>
                </div>
                <div className="border border-purple-400 rounded-lg p-4 bg-purple-50">
                  <div className="flex items-center gap-2 mb-2">
                    <Gem className="w-5 h-5 text-purple-500" />
                    <span className="font-bold">Model</span>
                  </div>
                  <p className="text-gray-600">7 วัน: ฿5 | 14 วัน: ฿5</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
