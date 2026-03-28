'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Transfer, ArrowRight, Clock } from 'lucide-react';
import { getDaysRemaining } from '@/lib/utils';

interface Profile {
  id: string;
  name: string;
  superExpiry: string | null;
  modelExpiry: string | null;
  freeExpiry: string | null;
}

export default function TransferPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fromProfile, setFromProfile] = useState('');
  const [toProfile, setToProfile] = useState('');
  const [days, setDays] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const res = await fetch('/api/profiles/my');
      const data = await res.json();
      if (data.profiles) {
        setProfiles(data.profiles);
      }
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProfileDays = (profile: Profile) => {
    const superDays = getDaysRemaining(profile.superExpiry);
    const modelDays = getDaysRemaining(profile.modelExpiry);
    const freeDays = getDaysRemaining(profile.freeExpiry);
    return { superDays, modelDays, freeDays, total: superDays + modelDays + freeDays };
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!fromProfile || !toProfile) {
      setError('กรุณาเลือกโปรไฟล์');
      return;
    }

    if (fromProfile === toProfile) {
      setError('ไม่สามารถโอนให้ตัวเอง');
      return;
    }

    const sourceProfile = profiles.find(p => p.id === fromProfile);
    if (!sourceProfile) {
      setError('ไม่พบโปรไฟล์ต้นทาง');
      return;
    }

    const availableDays = getProfileDays(sourceProfile).total;
    if (availableDays < days) {
      setError(`วันใช้งานไม่เพียงพอ (มี ${availableDays} วัน)`);
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/profiles/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromProfileId: fromProfile,
          toProfileId: toProfile,
          days: parseInt(days.toString()),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'เกิดข้อผิดพลาด');
        return;
      }

      setSuccess('โอนวันใช้งานสำเร็จ');
      setDays(1);
      fetchProfiles();
    } catch (error) {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setSubmitting(false);
    }
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
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">F</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
                FF2
              </span>
            </Link>
            <Link href="/dashboard" className="text-gray-600 hover:text-primary-500">
              กลับสู่แดชบอร์ด
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Transfer className="w-6 h-6" />
            โอนย้ายวันใช้งาน
          </h1>

          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-6">
            <p className="text-sm text-yellow-800">
              คุณสามารถโอนวันใช้งานระหว่างโปรไฟล์ที่อยู่ในบัญชีเดียวกันเท่านั้น
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg mb-4">
              {success}
            </div>
          )}

          <form onSubmit={handleTransfer} className="space-y-6">
            {/* From Profile */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                โปรไฟล์ต้นทาง
              </label>
              <select
                value={fromProfile}
                onChange={(e) => setFromProfile(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              >
                <option value="">เลือกโปรไฟล์</option>
                {profiles.map((profile) => {
                  const days = getProfileDays(profile);
                  return (
                    <option key={profile.id} value={profile.id}>
                      {profile.name} (มี {days.total} วัน)
                    </option>
                  );
                })}
              </select>

              {fromProfile && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  {(() => {
                    const profile = profiles.find(p => p.id === fromProfile);
                    if (!profile) return null;
                    const days = getProfileDays(profile);
                    return (
                      <div className="text-sm space-y-1">
                        <p>👤 ทั่วไป: {days.freeDays} วัน</p>
                        <p>⭐ Super: {days.superDays} วัน</p>
                        <p>💎 Model: {days.modelDays} วัน</p>
                        <p className="font-semibold">รวม: {days.total} วัน</p>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <ArrowRight className="w-8 h-8 text-gray-400" />
            </div>

            {/* To Profile */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                โปรไฟล์ปลายทาง
              </label>
              <select
                value={toProfile}
                onChange={(e) => setToProfile(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              >
                <option value="">เลือกโปรไฟล์</option>
                {profiles.filter(p => p.id !== fromProfile).map((profile) => {
                  const days = getProfileDays(profile);
                  return (
                    <option key={profile.id} value={profile.id}>
                      {profile.name} (มี {days.total} วัน)
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Days */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                จำนวนวันที่ต้องการโอน
              </label>
              <input
                type="number"
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                min="1"
                max={fromProfile ? getProfileDays(profiles.find(p => p.id === fromProfile)!)?.total || 1 : 1}
                required
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting || !fromProfile || !toProfile}
              className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? 'กำลังโอน...' : 'โอนวันใช้งาน'}
            </button>
          </form>
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">ข้อควรทราบ</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>โอนวันใช้งานไปยังโปรไฟล์อื่นภายในบัญชีเดียวกัน</li>
            <li>วันจะถูกหักจากโปรไฟล์ต้นทางก่อน (เรียง: Super, Model, ทั่วไป)</li>
            <li>วันที่โอนจะเข้าไปที่วันใช้งานทั่วไปของโปรไฟล์ปลายทาง</li>
            <li>ประวัติการโอนจะถูกบันทึกในระบบ</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
