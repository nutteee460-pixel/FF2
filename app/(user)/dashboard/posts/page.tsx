'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, CheckCircle, XCircle, Image as ImageIcon } from 'lucide-react';

interface Post {
  id: string;
  title: string;
  images: string;
  status: string;
  createdAt: string;
  profile: {
    name: string;
  };
}

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyerBlocked, setBuyerBlocked] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const s = await fetch('/api/auth/session');
        const d = await s.json();
        if (d.user?.accountType === 'BUYER' && d.user.role !== 'ADMIN') {
          setBuyerBlocked(true);
          setLoading(false);
          return;
        }
      } catch {
        /* continue */
      }
      fetchPosts();
    };
    init();
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

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  if (buyerBlocked) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">บัญชีผู้ใช้งาน</h2>
          <p className="text-gray-500">ไม่มีหน้ารายการโพสต์สำหรับประเภทนี้</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">จัดการโพสต์</h1>
          <Link
            href="/dashboard/posts/new"
            className="flex items-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
          >
            <span>สร้างโพสต์ใหม่</span>
          </Link>
        </div>

        {posts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ImageIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">ยังไม่มีโพสต์</h2>
            <p className="text-gray-500 mb-6">สร้างโพสต์เพื่อเริ่มต้นการขายรูป</p>
            <Link
              href="/dashboard/posts/new"
              className="inline-flex items-center space-x-2 bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors"
            >
              <span>สร้างโพสต์แรก</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => {
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
                          <Clock className="w-4 h-4" /> รอตรวจสอบ
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{post.title}</h3>
                    <p className="text-sm text-gray-500 mb-2">โปรไฟล์: {post.profile?.name}</p>
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>{new Date(post.createdAt).toLocaleDateString('th-TH')}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
    </div>
  );
}
