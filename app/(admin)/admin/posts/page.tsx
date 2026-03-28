'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle, XCircle, Clock, Eye, Image as ImageIcon } from 'lucide-react';
import { useAdminGuard } from '@/components/useAdminGuard';

interface Post {
  id: string;
  title: string;
  images: string;
  lineId?: string;
  contactName?: string | null;
  province?: string | null;
  district?: string | null;
  status: string;
  createdAt: string;
  profile: {
    id: string;
    name: string;
    age: number;
    province: string;
    user: {
      id: string;
      email: string;
      lineId: string;
    };
  };
}

export default function AdminPostsPage() {
  useAdminGuard();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/posts');
      const data = await res.json();
      if (data.posts) {
        setPosts(data.posts);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (postId: string, status: 'APPROVED' | 'REJECTED') => {
    if (!confirm(status === 'APPROVED' ? 'อนุมัติโพสต์นี้?' : 'ปฏิเสธโพสต์นี้?')) return;
    
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        setPosts(posts.map(p => p.id === postId ? { ...p, status } : p));
      }
    } catch (error) {
      console.error('Error updating post:', error);
    }
  };

  const filteredPosts = filter === 'ALL' 
    ? posts 
    : posts.filter(p => p.status === filter);

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
          <h1 className="text-2xl font-bold text-gray-900">จัดการโพสต์</h1>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex space-x-2">
            {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === status
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status === 'ALL' ? 'ทั้งหมด' :
                 status === 'PENDING' ? 'รอตรวจ' :
                 status === 'APPROVED' ? 'อนุมัติ' : 'ปฏิเสธ'}
              </button>
            ))}
          </div>
        </div>

        {/* Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => {
            const images = JSON.parse(post.images || '[]');
            return (
              <div key={post.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="relative h-48 bg-gray-100">
                  {images.length > 0 ? (
                    <img src={images[0]} alt={post.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-gray-300" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    {post.status === 'APPROVED' ? (
                      <span className="px-3 py-1 bg-green-500 text-white rounded-full text-sm flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" /> อนุมัติ
                      </span>
                    ) : post.status === 'REJECTED' ? (
                      <span className="px-3 py-1 bg-red-500 text-white rounded-full text-sm flex items-center gap-1">
                        <XCircle className="w-4 h-4" /> ปฏิเสธ
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-yellow-500 text-white rounded-full text-sm flex items-center gap-1">
                        <Clock className="w-4 h-4" /> รอตรวจ
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{post.title}</h3>
                  <p className="text-sm text-gray-500 mb-2">
                    โปรไฟล์: {post.profile?.name} ({post.profile?.age} ปี)
                  </p>
                  {(post.contactName || post.province || post.district) && (
                    <p className="text-sm text-gray-600 mb-1">
                      {post.contactName && <span>ชื่อโพสต์: {post.contactName} · </span>}
                      {post.province && <span>{post.province}</span>}
                      {post.district && <span> · {post.district}</span>}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 mb-2">
                    จังหวัด (โปรไฟล์): {post.profile?.province}
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    LINE (ตามโพสต์): {post.lineId || post.profile?.user?.lineId || '-'}
                  </p>
                  
                  {post.status === 'PENDING' && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleUpdateStatus(post.id, 'APPROVED')}
                        className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 flex items-center justify-center gap-1"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>อนุมัติ</span>
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(post.id, 'REJECTED')}
                        className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 flex items-center justify-center gap-1"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>ปฏิเสธ</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredPosts.length === 0 && (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <p className="text-gray-500">ไม่มีโพสต์ที่ตรงกับเงื่อนไข</p>
          </div>
        )}
      </div>
    </div>
  );
}
