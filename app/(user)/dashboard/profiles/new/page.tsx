'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Upload, X, Image as ImageIcon, Loader, Camera, User, Sparkles } from 'lucide-react';
import { THAI_PROVINCES } from '@/lib/utils';
import { SERVICE_TYPES, APPEARANCES, AGE_RANGES } from '@/lib/categories';

interface Profile {
  id: string;
  name: string;
}

export default function NewProfilePage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [buyerBlocked, setBuyerBlocked] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    age: 20,
    province: '',
    district: '',
    description: '',
  });
  const [images, setImages] = useState<string[]>([]);
  
  // หมวดหมู่ใหม่
  const [selectedServiceTypes, setSelectedServiceTypes] = useState<string[]>([]);
  const [selectedAppearances, setSelectedAppearances] = useState<string[]>([]);
  const [selectedAgeRanges, setSelectedAgeRanges] = useState<string[]>([]);

  useEffect(() => {
    const checkAccount = async () => {
      try {
        const s = await fetch('/api/auth/session');
        const d = await s.json();
        if (!d.user) {
          setLoading(false);
          return;
        }
        if (d.user.accountType === 'BUYER' && d.user.role !== 'ADMIN') {
          setBuyerBlocked(true);
          setLoading(false);
          return;
        }
      } catch {
        /* continue */
      }
      fetchProfiles();
    };
    checkAccount();
  }, []);

  const fetchProfiles = async () => {
    try {
      const res = await fetch('/api/profiles/my');
      const data = await res.json();
      if (data.profiles) {
        setProfiles(data.profiles);
        if (data.profiles.length >= 50) {
          setError('คุณสร้างโปรไฟล์ได้สูงสุด 50 โปรไฟล์');
        }
      }
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: string[] = [];
    
    Array.from(files).forEach((file) => {
      if (images.length + newImages.length >= 5) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          newImages.push(event.target.result as string);
          if (newImages.length === files.length || images.length + newImages.length === 5) {
            setImages([...images, ...newImages]);
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const toggleServiceType = (value: string) => {
    setSelectedServiceTypes(prev => 
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  const toggleAppearance = (value: string) => {
    setSelectedAppearances(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  const toggleAgeRange = (value: string) => {
    setSelectedAgeRanges(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    if (!formData.name || !formData.province) {
      setError('กรุณากรอกข้อมูลให้ครบ');
      setSubmitting(false);
      return;
    }

    if (formData.age < 20 || formData.age > 99) {
      setError('อายุต้องอยู่ระหว่าง 20–99 ปี (ตามข้อกำหนดเว็บไซต์)');
      setSubmitting(false);
      return;
    }

    if (images.length < 1) {
      setError('กรุณาเพิ่มรูปอย่างน้อย 1 รูป');
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          images,
          serviceTypes: selectedServiceTypes,
          appearance: selectedAppearances,
          ageRange: selectedAgeRanges,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'เกิดข้อผิดพลาด');
        return;
      }

      router.push('/dashboard/profiles');
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

  if (buyerBlocked) {
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
                กลับ
              </Link>
            </div>
          </div>
        </header>
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="bg-white rounded-xl shadow-md p-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">บัญชีผู้ใช้งาน</h2>
            <p className="text-gray-500 mb-6">
              ประเภทนี้สำหรับผู้ที่มาซื้อ/ดูงาน ไม่ต้องสร้างโปรไฟล์ หากต้องการลงขายโปรดสมัครใหม่ด้วยประเภท &quot;Post งาน&quot;
            </p>
            <Link
              href="/dashboard"
              className="inline-block bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600"
            >
              กลับแดชบอร์ด
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (profiles.length >= 50) {
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
              <Link href="/dashboard/profiles" className="text-gray-600 hover:text-primary-500">
                กลับ
              </Link>
            </div>
          </div>
        </header>
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="bg-white rounded-xl shadow-md p-12">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">ถึงขีดจำกัดแล้ว</h2>
            <p className="text-gray-500">คุณสร้างโปรไฟล์ได้สูงสุด 50 โปรไฟล์ต่อ 1 บัญชี</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
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
            <Link href="/dashboard/profiles" className="text-gray-600 hover:text-primary-500">
              กลับ
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">สร้างโปรไฟล์ใหม่</h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                รูปโปรไฟล์ (แนะนำ 3-5 รูป)
              </label>
              <div className="grid grid-cols-3 gap-4">
                {images.map((img, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <img src={img} alt={`รูปที่ ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {images.length < 5 && (
                  <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors">
                    <Upload className="w-8 h-8 text-gray-400 mb-1" />
                    <span className="text-sm text-gray-500">เพิ่มรูป</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">รองรับไฟล์ .jpg, .png เท่านั้น</p>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ชื่อ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="ชื่อนางแบบ"
                required
              />
            </div>

            {/* Age */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                อายุ <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                min="20"
                max="99"
                required
              />
            </div>

            {/* Province */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                จังหวัด <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.province}
                onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              >
                <option value="">เลือกจังหวัด</option>
                {THAI_PROVINCES.map((province) => (
                  <option key={province} value={province}>
                    {province}
                  </option>
                ))}
              </select>
            </div>

            {/* District */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                เขต/แขวง
              </label>
              <input
                type="text"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="เขต/แขวง (ไม่บังคับ)"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                รายละเอียด
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                rows={4}
                placeholder="รายละเอียดเพิ่มเติม..."
              />
            </div>

            {/* หมวดหมู่: ประเภทบริการ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Camera className="w-4 h-4 inline mr-1" />
                ประเภทบริการ (เลือกได้หลายอย่าง)
              </label>
              <div className="flex flex-wrap gap-2">
                {SERVICE_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => toggleServiceType(type.value)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                      selectedServiceTypes.includes(type.value)
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {type.icon} {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* หมวดหมู่: ลักษณะทั่วไป */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                ลักษณะทั่วไป (เลือกได้หลายอย่าง)
              </label>
              <div className="flex flex-wrap gap-2">
                {APPEARANCES.map((app) => (
                  <button
                    key={app.value}
                    type="button"
                    onClick={() => toggleAppearance(app.value)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                      selectedAppearances.includes(app.value)
                        ? 'bg-secondary-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {app.icon} {app.label}
                  </button>
                ))}
              </div>
            </div>

            {/* หมวดหมู่: ช่วงอายุ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Sparkles className="w-4 h-4 inline mr-1" />
                ช่วงอายุที่ต้องการ (เลือกได้หลายอย่าง)
              </label>
              <div className="flex flex-wrap gap-2">
                {AGE_RANGES.map((age) => (
                  <button
                    key={age.value}
                    type="button"
                    onClick={() => toggleAgeRange(age.value)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                      selectedAgeRanges.includes(age.value)
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {age.icon} {age.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <div className="flex space-x-4">
              <Link
                href="/dashboard/profiles"
                className="flex-1 text-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ยกเลิก
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {submitting ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>กำลังสร้าง...</span>
                  </>
                ) : (
                  <span>สร้างโปรไฟล์</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
