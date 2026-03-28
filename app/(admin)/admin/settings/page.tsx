'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Save, Building, Hash, Send } from 'lucide-react';
import { useAdminGuard } from '@/components/useAdminGuard';

interface Settings {
  bankName: string;
  bankAccount: string;
  bankNumber: string;
  telegramChannel: string;
}

export default function AdminSettingsPage() {
  useAdminGuard();
  const [settings, setSettings] = useState<Settings>({
    bankName: '',
    bankAccount: '',
    bankNumber: '',
    telegramChannel: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data) {
        setSettings({
          bankName: data.bankName || '',
          bankAccount: data.bankAccount || '',
          bankNumber: data.bankNumber || '',
          telegramChannel: data.telegramChannel || '',
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setMessage('บันทึกสำเร็จ');
      } else {
        setMessage('เกิดข้อผิดพลาด');
      }
    } catch (error) {
      setMessage('เกิดข้อผิดพลาด');
    } finally {
      setSaving(false);
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
      <header className="bg-gray-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/admin" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">F</span>
              </div>
              <span className="text-2xl font-bold">FF2 Admin</span>
            </Link>
            <Link href="/admin" className="text-gray-300 hover:text-white">
              กลับสู่แดชบอร์ด
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">ตั้งค่าระบบ</h1>

        {message && (
          <div className={`mb-6 px-4 py-3 rounded-lg ${message.includes('สำเร็จ') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-md p-6 space-y-6">
          {/* Bank Settings */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Building className="w-5 h-5" />
              ข้อมูลธนาคาร
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อธนาคาร</label>
                <input
                  type="text"
                  value={settings.bankName}
                  onChange={(e) => setSettings({ ...settings, bankName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="กรุงเทพ"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อบัญชี</label>
                <input
                  type="text"
                  value={settings.bankAccount}
                  onChange={(e) => setSettings({ ...settings, bankAccount: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="บริษัท FF2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">เลขที่บัญชี</label>
                <input
                  type="text"
                  value={settings.bankNumber}
                  onChange={(e) => setSettings({ ...settings, bankNumber: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="123-456-7890"
                />
              </div>
            </div>
          </div>

          {/* Telegram Settings */}
          <div className="pt-6 border-t">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Send className="w-5 h-5" />
              Telegram
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ลิงก์ช่องทาง Telegram</label>
              <input
                type="text"
                value={settings.telegramChannel}
                onChange={(e) => setSettings({ ...settings, telegramChannel: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="https://t.me/channelname"
              />
              <p className="text-sm text-gray-500 mt-1">ลิงก์นี้จะแสดงเป็นปุ่ม Telegram มุมขวาล่างของเว็บ</p>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-6">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
