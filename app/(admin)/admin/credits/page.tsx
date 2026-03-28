'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle, XCircle, Clock, CreditCard, User } from 'lucide-react';
import { useAdminGuard } from '@/components/useAdminGuard';

interface CreditRequest {
  id: string;
  amount: number;
  type: string;
  status: string;
  proof: string | null;
  createdAt: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export default function AdminCreditsPage() {
  useAdminGuard();
  const [requests, setRequests] = useState<CreditRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/admin/pending');
      const data = await res.json();
      if (data.pendingCredits) {
        setRequests(data.pendingCredits);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (requestId: string, status: 'APPROVED' | 'REJECTED') => {
    if (!confirm(status === 'APPROVED' ? 'อนุมัติคำขอนี้?' : 'ปฏิเสธคำขอนี้?')) return;
    
    try {
      const res = await fetch(`/api/credits/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        setRequests(requests.filter(r => r.id !== requestId));
      }
    } catch (error) {
      console.error('Error updating request:', error);
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">ประวัติการเติมเงิน</h1>
        </div>

        {/* Pending Requests */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
          <div className="p-4 border-b">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-500" />
              รอตรวจสอบ ({requests.length})
            </h2>
          </div>
          
          {requests.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              ไม่มีคำขอรอตรวจสอบ
            </div>
          ) : (
            <div className="divide-y">
              {requests.map((request) => (
                <div key={request.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-blue-500" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {request.amount} วัน - {request.type}
                        </p>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {request.user?.email}
                          {request.user?.name && ` (${request.user.name})`}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(request.createdAt).toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        {request.proof && (
                          <a 
                            href={request.proof} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-blue-500 hover:underline mt-1 inline-block"
                          >
                            ดูสลิป
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleUpdateStatus(request.id, 'APPROVED')}
                        className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center gap-1"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>อนุมัติ</span>
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(request.id, 'REJECTED')}
                        className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 flex items-center gap-1"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>ปฏิเสธ</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
