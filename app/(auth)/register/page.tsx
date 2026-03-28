'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, CheckCircle, Briefcase, ShoppingBag } from 'lucide-react';

type AccountType = 'POSTER' | 'BUYER';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [accountType, setAccountType] = useState<AccountType>('BUYER');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน');
      return;
    }

    if (formData.password.length < 8) {
      setError('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');
      return;
    }

    if (!acceptTerms) {
      setError('กรุณาอ่านและยอมรับข้อกำหนดของเว็บไซต์');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          accountType,
          acceptTerms: true,
        }),
      });

      let data: { message?: string } = {};
      try {
        data = await res.json();
      } catch {
        setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง');
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setError(data.message || 'สมัครสมาชิกไม่สำเร็จ');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/login?registered=true');
      }, 1500);
    } catch (err) {
      console.error('Register error:', err);
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาตรวจสอบอินเทอร์เน็ตและลองใหม่อีกครั้ง');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center animate-slide-up">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">สมัครสมาชิกสำเร็จ!</h2>
          <p className="text-gray-500 mb-6">กำลังนำคุณไปยังหน้าเข้าสู่ระบบ...</p>
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 animate-slide-up">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center space-x-2">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-2xl">F</span>
            </div>
            <span className="text-3xl font-bold bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
              FF2
            </span>
          </Link>
        </div>

        <h1 className="text-xl font-bold text-center text-gray-900 mb-1">สมัครสมาชิก</h1>
        <p className="text-gray-500 text-center text-sm mb-4">
          ใช้เฉพาะอีเมลและรหัสผ่าน — จังหวัด อายุ และ LINE ID กรอกตอนสร้างโพสต์ (สำหรับผู้ลงขาย)
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล *</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                placeholder="example@email.com"
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่าน *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  placeholder="8+ ตัว"
                  minLength={6}
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ยืนยันรหัสผ่าน *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  placeholder="••••••"
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-xs text-gray-500 hover:text-primary-500"
          >
            {showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
          </button>

          <div>
            <p className="block text-sm font-medium text-gray-700 mb-2">ประเภทบัญชี *</p>
            <div className="grid grid-cols-1 gap-2">
              <label
                className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                  accountType === 'POSTER'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="accountType"
                  checked={accountType === 'POSTER'}
                  onChange={() => setAccountType('POSTER')}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <span className="flex items-center gap-2 font-medium text-gray-900 text-sm">
                    <Briefcase className="w-4 h-4 text-primary-500 shrink-0" />
                    Post งาน
                  </span>
                  <p className="text-xs text-gray-600 mt-1">
                    สมัครเพื่อลงขายรูปนางแบบ — สร้างโปรไฟล์และโพสต์ได้หลังเข้าสู่ระบบ
                  </p>
                </div>
              </label>
              <label
                className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                  accountType === 'BUYER'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="accountType"
                  checked={accountType === 'BUYER'}
                  onChange={() => setAccountType('BUYER')}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <span className="flex items-center gap-2 font-medium text-gray-900 text-sm">
                    <ShoppingBag className="w-4 h-4 text-secondary-500 shrink-0" />
                    ผู้ใช้งาน
                  </span>
                  <p className="text-xs text-gray-600 mt-1">
                    สำหรับผู้ที่มาซื้อ/ดูงาน ไม่จำเป็นต้องมีโพสต์ — ซื้อแล้วรีวิวว่าตรงปกได้
                  </p>
                </div>
              </label>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">
                <span className="font-medium text-gray-900">ข้อกำหนดของเว็บไซต์</span> — ยืนยันว่าอ่านและยอมรับแล้ว
                <ul className="list-decimal pl-4 mt-2 space-y-1.5 text-xs text-gray-600">
                  <li>เว็บไซต์ไม่มีนโยบายคืนเงินทุกกรณี (หลังชำระเงินแล้ว)</li>
                  <li>ไม่นำรูปผู้อื่นมาแอบอ้างเพื่อโพสต์งาน เนื่องจากเรามีระบบการตรวจสอบที่เข้มงวด</li>
                  <li>ห้ามลงประกาศหากอายุต่ำกว่า 20 ปี หากพบเห็นจะแบนถาวร</li>
                </ul>
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 text-sm"
          >
            {loading ? 'กำลังสมัครสมาชิก...' : 'สมัครสมาชิก'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm">
            มีบัญชีอยู่แล้ว?{' '}
            <Link href="/login" className="text-primary-500 hover:text-primary-600 font-medium">
              เข้าสู่ระบบ
            </Link>
          </p>
        </div>

        {accountType === 'POSTER' && (
          <p className="mt-4 text-xs text-gray-400 text-center">
            บัญชี Post งาน: สร้างโปรไฟล์ได้สูงสุด 50 โปรไฟล์ต่อ 1 อีเมล
          </p>
        )}
      </div>
    </div>
  );
}
