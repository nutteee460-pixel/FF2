'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, ChevronRight, Wallet, Store } from 'lucide-react';

interface UserData {
  id: string;
  email: string;
  name: string;
  role: string;
  accountType?: string;
  profileCount: number;
}

export default function UserDashboard() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState<{
    summary?: { totalFreeDays: number; totalSuperDays: number; totalModelDays: number };
  } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [sessionRes, creditsRes] = await Promise.all([
          fetch('/api/auth/session'),
          fetch('/api/credits'),
        ]);
        const sessionData = await sessionRes.json();
        if (!sessionData.user) {
          setLoading(false);
          return;
        }
        setUser(sessionData.user);
        if (creditsRes.ok) {
          const creditsData = await creditsRes.json();
          setCredits(creditsData);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isPoster = user.role === 'ADMIN' || user.accountType !== 'BUYER';

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">ยินดีต้อนรับ, {user.name || user.email}</h1>
        <p className="opacity-90">
          {isPoster
            ? 'จัดการโปรไฟล์ โพสต์ เติมเงิน และร้านค้าได้จากเมนูด้านซ้าย'
            : 'เติมเงินและใช้งานได้จากเมนูด้านซ้าย'}
        </p>
      </div>

      {credits && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-md p-6">
            <p className="text-gray-500 text-sm">วันใช้งานทั่วไป</p>
            <p className="text-3xl font-bold text-gray-900">{credits.summary?.totalFreeDays || 0}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <p className="text-gray-500 text-sm">วัน Super</p>
            <p className="text-3xl font-bold text-yellow-600">{credits.summary?.totalSuperDays || 0}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <p className="text-gray-500 text-sm">วัน Model</p>
            <p className="text-3xl font-bold text-gray-600">{credits.summary?.totalModelDays || 0}</p>
          </div>
        </div>
      )}

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
            href="/dashboard/topup"
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center">
                <Wallet className="w-5 h-5 text-sky-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">เติมเงิน</p>
                <p className="text-sm text-gray-500">เลขบัญชี + ส่งสลิปรออนุมัติ</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </Link>
          <Link
            href="/dashboard/shop"
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center">
                <Store className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">ร้านค้า</p>
                <p className="text-sm text-gray-500">วันทั่วไป / Super / Model</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </Link>
        </div>
      </div>
    </div>
  );
}
