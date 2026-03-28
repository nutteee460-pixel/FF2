'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Ban, Unlock, Shield, Eye, Lock, Plus, Minus, RefreshCw, Star, Gem, User } from 'lucide-react';
import { useAdminGuard } from '@/components/useAdminGuard';

interface User {
  id: string;
  email: string;
  name: string;
  lineId: string;
  role: string;
  isBanned: boolean;
  totalFreeDays: number;
  totalSuperDays: number;
  totalModelDays: number;
  profileCount: number;
  createdAt: string;
}

export default function AdminUsersPage() {
  useAdminGuard();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Promote modal
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [promoteUser, setPromoteUser] = useState<User | null>(null);
  const [adminPassword, setAdminPassword] = useState('');
  const [promoteError, setPromoteError] = useState('');
  const [promoteLoading, setPromoteLoading] = useState(false);

  // Credit editing
  const [creditDays, setCreditDays] = useState(7);
  const [creditKind, setCreditKind] = useState<'FREE' | 'SUPER' | 'MODEL'>('FREE');
  const [creditAction, setCreditAction] = useState<'ADD' | 'REMOVE' | 'SET'>('ADD');
  const [creditSubmitting, setCreditSubmitting] = useState(false);
  const [creditMsg, setCreditMsg] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.users) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBan = async (user: User) => {
    if (!confirm(user.isBanned ? `ยกเลิกแบน ${user.email}?` : `แบน ${user.email}?`)) return;

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isBanned: !user.isBanned }),
      });

      if (res.ok) {
        setUsers(users.map(u => u.id === user.id ? { ...u, isBanned: !user.isBanned } : u));
        if (selectedUser?.id === user.id) {
          setSelectedUser({ ...selectedUser, isBanned: !selectedUser.isBanned });
        }
      }
    } catch (error) {
      console.error('Error toggling ban:', error);
    }
  };

  const openPromoteModal = (user: User) => {
    setPromoteUser(user);
    setAdminPassword('');
    setPromoteError('');
    setShowPromoteModal(true);
  };

  const handlePromote = async () => {
    if (!promoteUser) return;
    if (!adminPassword) {
      setPromoteError('กรุณากรอกรหัสผ่านแอดมิน');
      return;
    }

    setPromoteLoading(true);
    setPromoteError('');

    try {
      // Verify admin password first
      const verifyRes = await fetch('/api/auth/verify-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPassword }),
      });
      const verifyData = await verifyRes.json();

      if (!verifyRes.ok) {
        setPromoteError(verifyData.message || 'รหัสผ่านไม่ถูกต้อง');
        return;
      }

      // Then promote
      const newRole = promoteUser.role === 'ADMIN' ? 'USER' : 'ADMIN';
      const res = await fetch(`/api/admin/users/${promoteUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (res.ok) {
        const updated = users.map(u => u.id === promoteUser.id ? { ...u, role: newRole } : u);
        setUsers(updated);
        if (selectedUser?.id === promoteUser.id) {
          setSelectedUser({ ...selectedUser, role: newRole });
        }
        setShowPromoteModal(false);
        setAdminPassword('');
      } else {
        const data = await res.json();
        setPromoteError(data.message || 'เกิดข้อผิดพลาด');
      }
    } catch {
      setPromoteError('เกิดข้อผิดพลาด');
    } finally {
      setPromoteLoading(false);
    }
  };

  const handleCreditAction = async () => {
    if (!selectedUser) return;
    const day = Math.min(3650, Math.max(1, Math.floor(Number(creditDays)) || 1));
    setCreditSubmitting(true);
    setCreditMsg('');
    try {
      const res = await fetch('/api/admin/users/credits', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          action: creditAction,
          kind: creditKind,
          days: day,
        }),
      });
      const data = await res.json();
      if (res.ok && typeof data.totalFreeDays === 'number') {
        setCreditMsg(data.message);
        const updatedUser: User = {
          ...selectedUser,
          totalFreeDays: data.totalFreeDays,
          totalSuperDays: data.totalSuperDays,
          totalModelDays: data.totalModelDays,
        };
        setSelectedUser(updatedUser);
        setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
      } else {
        setCreditMsg(data.message || 'เกิดข้อผิดพลาด');
      }
    } catch {
      setCreditMsg('เกิดข้อผิดพลาด');
    } finally {
      setCreditSubmitting(false);
    }
  };

  const creditEffectiveDays = Math.min(3650, Math.max(1, Math.floor(Number(creditDays)) || 1));

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lineId.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">จัดการสมาชิก</h1>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="ค้นหาอีเมล, ชื่อ, LINE ID..."
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Users List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">อีเมล</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">วันใช้งาน</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">สถานะ</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr
                        key={user.id}
                        className={`hover:bg-gray-50 cursor-pointer ${selectedUser?.id === user.id ? 'bg-blue-50' : ''}`}
                        onClick={() => setSelectedUser(user)}
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{user.email}</p>
                          <p className="text-sm text-gray-500">{user.name || '-'}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm">👤 {user.totalFreeDays}</p>
                          <p className="text-sm text-yellow-600">⭐ {user.totalSuperDays}</p>
                          <p className="text-sm text-gray-500">💎 {user.totalModelDays}</p>
                        </td>
                        <td className="px-4 py-3">
                          {user.isBanned ? (
                            <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-sm">แบน</span>
                          ) : (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm">ปกติ</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex space-x-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleToggleBan(user); }}
                              className={`p-2 rounded-lg ${user.isBanned ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}
                              title={user.isBanned ? 'ยกเลิกแบน' : 'แบน'}
                            >
                              {user.isBanned ? <Unlock className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); openPromoteModal(user); }}
                              className={`p-2 rounded-lg ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}
                              title={user.role === 'ADMIN' ? 'ลดยศเป็นสมาชิก' : 'เพิ่มยศแอดมิน'}
                            >
                              <Lock className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* User Detail + Credit Management */}
          <div className="lg:col-span-1">
            {selectedUser ? (
              <div className="bg-white rounded-xl shadow-md p-6 sticky top-4 space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-3">รายละเอียด</h2>
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-gray-500">อีเมล</p>
                      <p className="font-medium">{selectedUser.email}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">ชื่อ</p>
                      <p className="font-medium">{selectedUser.name || '-'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">LINE ID</p>
                      <p className="font-medium">{selectedUser.lineId}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">จำนวนโปรไฟล์</p>
                      <p className="font-medium">{selectedUser.profileCount}/50</p>
                    </div>
                    <div>
                      <p className="text-gray-500">ยศ</p>
                      <p className="font-medium">{selectedUser.role === 'ADMIN' ? 'ผู้ดูแล' : 'สมาชิก'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">สถานะ</p>
                      <p className="font-medium">{selectedUser.isBanned ? 'แบน' : 'ปกติ'}</p>
                    </div>
                  </div>
                </div>

                <hr className="my-2" />

                {/* Credit Management */}
                <div>
                  <h3 className="text-md font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary-500" />
                    แก้ไขวันใช้งาน
                  </h3>

                  {/* Current days */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">ทั่วไป:</span>
                      <span className="font-bold text-gray-900">{selectedUser.totalFreeDays} วัน</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm text-gray-600">Super:</span>
                      <span className="font-bold text-yellow-700">{selectedUser.totalSuperDays} วัน</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Gem className="w-4 h-4 text-purple-500" />
                      <span className="text-sm text-gray-600">Model:</span>
                      <span className="font-bold text-purple-700">{selectedUser.totalModelDays} วัน</span>
                    </div>
                  </div>

                  {/* Kind */}
                  <div className="mb-2">
                    <p className="text-xs font-medium text-gray-600 mb-1">ประเภท</p>
                    <div className="grid grid-cols-3 gap-2">
                      {(['FREE', 'SUPER', 'MODEL'] as const).map((k) => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setCreditKind(k)}
                          className={`py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                            creditKind === k
                              ? k === 'SUPER'
                                ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                                : k === 'MODEL'
                                ? 'border-purple-500 bg-purple-50 text-purple-700'
                                : 'border-primary-500 bg-primary-50 text-primary-700'
                              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {k === 'FREE' ? 'ทั่วไป' : k}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Action */}
                  <div className="mb-2">
                    <p className="text-xs font-medium text-gray-600 mb-1">การดำเนินการ</p>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setCreditAction('ADD')}
                        className={`py-1.5 rounded-lg text-xs font-medium border flex items-center justify-center gap-1 transition-colors ${
                          creditAction === 'ADD'
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <Plus className="w-3 h-3" />
                        เพิ่ม
                      </button>
                      <button
                        type="button"
                        onClick={() => setCreditAction('REMOVE')}
                        className={`py-1.5 rounded-lg text-xs font-medium border flex items-center justify-center gap-1 transition-colors ${
                          creditAction === 'REMOVE'
                            ? 'border-red-500 bg-red-50 text-red-700'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <Minus className="w-3 h-3" />
                        ลด
                      </button>
                      <button
                        type="button"
                        onClick={() => setCreditAction('SET')}
                        className={`py-1.5 rounded-lg text-xs font-medium border flex items-center justify-center gap-1 transition-colors ${
                          creditAction === 'SET'
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <RefreshCw className="w-3 h-3" />
                        ตั้งค่า
                      </button>
                    </div>
                  </div>

                  {/* Days */}
                  <div className="mb-3">
                    <p className="text-xs font-medium text-gray-600 mb-1">จำนวนวัน</p>
                    <div className="grid grid-cols-4 gap-2">
                      {[1, 3, 7, 14].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setCreditDays(d)}
                          className={`py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                            creditDays === d
                              ? 'border-primary-500 bg-primary-50 text-primary-700'
                              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1.5 mb-1">หรือระบุเอง (1–3650)</p>
                    <input
                      type="number"
                      min={1}
                      max={3650}
                      value={creditDays}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === '') {
                          setCreditDays(1);
                          return;
                        }
                        const n = parseInt(v, 10);
                        if (Number.isFinite(n)) setCreditDays(Math.min(3650, Math.max(1, n)));
                      }}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs"
                    />
                  </div>

                  {creditMsg && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg text-xs mb-2">
                      {creditMsg}
                    </div>
                  )}

                  <button
                    onClick={handleCreditAction}
                    disabled={creditSubmitting}
                    className="w-full bg-primary-500 text-white py-2 rounded-lg hover:bg-primary-600 disabled:opacity-50 flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    {creditSubmitting ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        {creditAction === 'ADD' && <Plus className="w-4 h-4" />}
                        {creditAction === 'REMOVE' && <Minus className="w-4 h-4" />}
                        {creditAction === 'SET' && <RefreshCw className="w-4 h-4" />}
                        {creditAction === 'ADD'
                          ? `เพิ่ม ${creditEffectiveDays} วัน`
                          : creditAction === 'REMOVE'
                          ? `ลด ${creditEffectiveDays} วัน`
                          : `ตั้งค่า ${creditEffectiveDays} วัน`}
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-md p-6 text-center text-gray-500">
                เลือกสมาชิกเพื่อดูรายละเอียด
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Promote Modal — ยืนยันรหัสผ่านก่อนเพิ่มแอดมิน */}
      {showPromoteModal && promoteUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 animate-slide-up">
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              {promoteUser.role === 'ADMIN' ? 'ลดยศผู้ดูแล' : 'เพิ่มยศผู้ดูแลระบบ'}
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              กรุณายืนยันตัวตนด้วยรหัสผ่านแอดมิน
            </p>

            {promoteError && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg mb-4 text-sm">
                {promoteError}
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">{promoteUser.email}</span>
                <br />
                จะถูก{promoteUser.role === 'ADMIN' ? 'ลด' : 'เพิ่ม'}เป็น:
                <span className="font-bold">
                  {promoteUser.role === 'ADMIN' ? 'สมาชิก' : 'ผู้ดูแลระบบ'}
                </span>
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                รหัสผ่านแอดมิน <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePromote()}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="กรอกรหัสผ่านแอดมิน"
                autoFocus
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => { setShowPromoteModal(false); setAdminPassword(''); setPromoteError(''); }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handlePromote}
                disabled={promoteLoading}
                className="flex-1 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 disabled:opacity-50 flex items-center justify-center"
              >
                {promoteLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                ) : (
                  'ยืนยัน'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
