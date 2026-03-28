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
  Package,
  Save,
  Star,
  Gem,
  Shield,
  Check,
  X,
} from 'lucide-react';

interface Package {
  id: string;
  name: string;
  price7Days: number;
  price14Days: number;
  price15Days: number;
  price30Days: number;
  description: string | null;
  isActive: boolean;
}

export default function AdminPackagesPage() {
  const router = useRouter();
  useAdminGuard();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [editForm, setEditForm] = useState<Partial<Package>>({});

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const res = await fetch('/api/admin/packages');
      const data = await res.json();
      if (Array.isArray(data)) {
        setPackages(data);
        if (data.length > 0) {
          setEditForm(data[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (pkg: Package) => {
    setSaving(true);
    setMessage('');

    try {
      const res = await fetch('/api/admin/packages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: pkg.id,
          price7Days: editForm.price7Days,
          price14Days: editForm.price14Days,
          price15Days: editForm.price15Days ?? 90,
          price30Days: editForm.price30Days ?? 150,
          description: editForm.description,
          isActive: editForm.isActive,
        }),
      });

      if (res.ok) {
        setMessage('บันทึกสำเร็จ');
        fetchPackages();
        // Also reload dashboard prices if it's open
      } else {
        setMessage('เกิดข้อผิดพลาด');
      }
    } catch (error) {
      setMessage('เกิดข้อผิดพลาด');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/admin-logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  };

  const selectPackage = (pkg: Package) => {
    setEditForm(pkg);
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">เมนูหลังบ้าน</h2>
              <nav className="space-y-2">
                <Link
                  href="/admin"
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50"
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
                  href="/admin/credits"
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  <CreditCard className="w-5 h-5" />
                  <span>ประวัติเติมเงิน</span>
                </Link>
                <Link
                  href="/admin/packages"
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg bg-gradient-to-r from-primary-500 to-secondary-500 text-white"
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
            <h1 className="text-2xl font-bold text-gray-900">จัดการราคาแพ็คเกจ</h1>

            {message && (
              <div className={`px-4 py-3 rounded-lg ${message.includes('สำเร็จ') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {message}
              </div>
            )}

            {/* Package List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`bg-white rounded-xl shadow-md p-6 border-2 cursor-pointer transition-all ${
                    editForm?.id === pkg.id ? 'border-primary-500' : 'border-gray-200'
                  }`}
                  onClick={() => selectPackage(pkg)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {pkg.name === 'SUPER' ? (
                        <Star className="w-6 h-6 text-yellow-500" />
                      ) : pkg.name === 'MODEL' ? (
                        <Gem className="w-6 h-6 text-purple-500" />
                      ) : (
                        <Shield className="w-6 h-6 text-amber-600" />
                      )}
                      <span className="font-bold text-lg">
                        {pkg.name === 'SUPER' ? 'Super' : pkg.name === 'MODEL' ? 'Model' : 'ยืนยันตัวตน'}
                      </span>
                    </div>
                    <span className={`px-2 py-1 rounded text-sm ${pkg.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {pkg.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-2">{pkg.description}</p>
                  {pkg.name === 'VERIFY' ? (
                    <div className="flex flex-wrap gap-2 text-sm">
                      <span className="text-gray-500">7 วัน: <strong className="text-primary-500">{pkg.price7Days} ฿</strong></span>
                      <span className="text-gray-500">15 วัน: <strong className="text-primary-500">{pkg.price15Days ?? 90} ฿</strong></span>
                      <span className="text-gray-500">30 วัน: <strong className="text-primary-500">{pkg.price30Days ?? 150} ฿</strong></span>
                    </div>
                  ) : (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">ราคา 7 วัน: <strong className="text-primary-500">{pkg.price7Days} บาท</strong></span>
                      <span className="text-gray-500">ราคา 14 วัน: <strong className="text-primary-500">{pkg.price14Days} บาท</strong></span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Edit Form */}
            {editForm?.id && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  แก้ไข{' '}
                  {editForm.name === 'SUPER'
                    ? 'Super'
                    : editForm.name === 'MODEL'
                      ? 'Model'
                      : 'ยืนยันตัวตน'}
                </h2>

                <div className="space-y-4">
                  <div
                    className={`grid grid-cols-1 gap-4 ${editForm.name === 'VERIFY' ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ราคา 7 วัน (บาท)</label>
                      <input
                        type="number"
                        min="0"
                        value={editForm.price7Days ?? ''}
                        onChange={(e) => setEditForm({ ...editForm, price7Days: Number(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    {editForm.name === 'VERIFY' ? (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">ราคา 15 วัน (บาท)</label>
                          <input
                            type="number"
                            min="0"
                            value={editForm.price15Days ?? ''}
                            onChange={(e) => setEditForm({ ...editForm, price15Days: Number(e.target.value) })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">ราคา 30 วัน (บาท)</label>
                          <input
                            type="number"
                            min="0"
                            value={editForm.price30Days ?? ''}
                            onChange={(e) => setEditForm({ ...editForm, price30Days: Number(e.target.value) })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                      </>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ราคา 14 วัน (บาท)</label>
                        <input
                          type="number"
                          min="0"
                          value={editForm.price14Days ?? ''}
                          onChange={(e) => setEditForm({ ...editForm, price14Days: Number(e.target.value) })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">คำอธิบาย</label>
                    <textarea
                      value={editForm.description || ''}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setEditForm({ ...editForm, isActive: !editForm.isActive })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        editForm.isActive ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      {editForm.isActive ? (
                        <Check className="w-4 h-4 text-white ml-1" />
                      ) : (
                        <X className="w-4 h-4 text-white ml-6" />
                      )}
                    </button>
                    <span className="text-sm text-gray-600">
                      {editForm.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                    </span>
                  </div>

                  <button
                    onClick={() => handleSave(editForm as Package)}
                    disabled={saving}
                    className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    {saving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
                  </button>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="font-bold text-blue-800 mb-2">💡 คำแนะนำ</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• คลิกเลือกแพ็คเกจที่ต้องการแก้ไขจากด้านบน</li>
                <li>• ราคาที่แก้ไขจะมีผลทันทีต่อผู้ใช้งานใหม่</li>
                <li>• ปิดใช้งานแพ็คเกจเพื่อไม่ให้ผู้ใช้ซื้อได้ชั่วคราว</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
