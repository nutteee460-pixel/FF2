'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  ExternalLink,
  MessageCircle,
  Share2,
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  Clock,
  Eye,
  ImageIcon,
  ChevronDown,
} from 'lucide-react';
import PublicHeader from '@/components/PublicHeader';
import { getProfileDisplayTier, formatDate, cn } from '@/lib/utils';
import TierBadge from '@/components/TierBadge';

interface Profile {
  id: string;
  name: string;
  age: number;
  province: string;
  district: string | null;
  description: string | null;
  images: string;
  tier: string;
  status: string;
  superExpiry: string | null;
  modelExpiry: string | null;
  freeExpiry: string | null;
  serviceTypes: string;
  appearance: string;
  ageRange: string;
  region: string;
  createdAt: string;
  user: {
    id: string;
    lineId: string | null;
    name: string | null;
  } | null;
}

interface Post {
  id: string;
  title: string;
  images: string;
  province: string | null;
  age: number | null;
  createdAt: string;
}

function ImageGallery({ images, name }: { images: string[]; name: string }) {
  const [lightbox, setLightbox] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);

  const open = (i: number) => { setActiveIdx(i); setLightbox(true); };
  const prev = () => setActiveIdx((i) => (i - 1 + images.length) % images.length);
  const next = () => setActiveIdx((i) => (i + 1) % images.length);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'Escape') setLightbox(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox]);

  if (images.length === 0) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-50 sm:aspect-[16/9]">
        <div className="text-center">
          <ImageIcon className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-2 text-sm text-gray-400">ไม่มีรูปภาพ</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="relative w-full">
        {/* Main image */}
        <div
          className="relative aspect-[4/3] w-full cursor-zoom-in overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50 sm:aspect-[16/9]"
          onClick={() => open(0)}
        >
          <Image
            src={images[0]}
            alt={name}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          {images.length > 1 && (
            <div className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
              1 / {images.length}
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="no-scrollbar flex gap-2 overflow-x-auto p-3">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => open(i)}
                className={cn(
                  'relative h-16 w-16 shrink-0 overflow-hidden rounded-xl transition-all',
                  i === 0 ? 'ring-2 ring-nong-purple ring-offset-2' : 'opacity-80 hover:opacity-100'
                )}
              >
                <Image src={img} alt="" fill className="object-cover" sizes="64px" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm">
          <button
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            onClick={() => setLightbox(false)}
          >
            <X className="h-6 w-6" />
          </button>

          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
            onClick={prev}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <div className="relative h-[85vh] w-full max-w-3xl px-16">
            <Image
              src={images[activeIdx]}
              alt={`${name} ${activeIdx + 1}`}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 768px"
            />
          </div>

          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
            onClick={next}
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-5 py-2 text-sm font-medium text-white backdrop-blur-sm">
            {activeIdx + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  );
}

function LineButton({ lineId }: { lineId: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(lineId).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openLine = () => {
    window.open(`https://line.me/ti/p/${lineId}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">ติดต่อผ่าน LINE</p>
      <button
        onClick={lineId.startsWith('@') ? openLine : handleCopy}
        className="w-full rounded-2xl bg-[#00B900] py-4 text-center text-sm font-bold text-white shadow-lg transition hover:opacity-95 hover:shadow-xl active:scale-[0.98]"
      >
        {copied ? '✓ คัดลอกแล้ว!' : '💬 ติดต่อทาง LINE'}
      </button>
      {!copied && lineId && (
        <button
          onClick={handleCopy}
          className="w-full rounded-xl border border-dashed border-gray-300 py-2.5 text-center text-xs text-gray-500 hover:border-nong-purple hover:text-nong-purple transition"
        >
          คัดลอก LINE ID: <span className="font-semibold">{lineId}</span>
        </button>
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: any }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white/80 p-4 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50">
        <Icon className="h-5 w-5 text-nong-purple" />
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <p className="text-base font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function PostCard({ post }: { post: Post }) {
  const images = JSON.parse(post.images || '[]');
  const first = images[0] || '/placeholder.jpg';

  return (
    <div className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <Image src={first} alt={post.title} fill className="object-cover" sizes="(max-width: 640px) 100vw, 33vw" />
        {images.length > 1 && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
            <ImageIcon className="h-3 w-3" />
            {images.length}
          </div>
        )}
      </div>
      <div className="p-4">
        <h4 className="line-clamp-2 text-sm font-semibold text-gray-900 group-hover:text-nong-purple">{post.title}</h4>
        <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
          {post.province && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {post.province}
            </span>
          )}
          {post.age && <span>{post.age} ปี</span>}
        </div>
      </div>
    </div>
  );
}

export default function ProfileDetailPage() {
  const params = useParams<{ id: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCategories, setShowCategories] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [profileRes, postsRes] = await Promise.all([
        fetch(`/api/profiles/${params.id}`),
        fetch(`/api/posts?profileId=${params.id}&status=APPROVED`),
      ]);
      const profileData = await profileRes.json();
      const postsData = await postsRes.json();
      if (profileData.profile) setProfile(profileData.profile);
      if (postsData.posts) setPosts(postsData.posts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: profile?.name,
          text: `ดูโปรไฟล์ ${profile?.name} บน FF2`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('ลิงก์ถูกคัดลอกแล้ว');
      }
    } catch {}
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <PublicHeader />
        <div className="mx-auto max-w-3xl px-4 py-16">
          <div className="space-y-4">
            <div className="aspect-[16/9] animate-pulse rounded-3xl bg-gray-200" />
            <div className="flex gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 w-16 animate-pulse rounded-xl bg-gray-200" />
              ))}
            </div>
            <div className="h-12 w-48 animate-pulse rounded-2xl bg-gray-200" />
            <div className="h-4 w-32 animate-pulse rounded-full bg-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <PublicHeader />
        <div className="mt-16 text-center">
          <p className="text-lg font-semibold text-gray-900">ไม่พบโปรไฟล์</p>
          <Link href="/" className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-nong-purple to-nong-magenta px-6 py-2.5 text-sm font-semibold text-white">
            <ArrowLeft className="h-4 w-4" />
            กลับหน้าแรก
          </Link>
        </div>
      </div>
    );
  }

  const displayTier = getProfileDisplayTier(profile);
  const images = JSON.parse(profile.images || '[]');
  const serviceTypes = JSON.parse(profile.serviceTypes || '[]');
  const appearances = JSON.parse(profile.appearance || '[]');
  const ageRanges = JSON.parse(profile.ageRange || '[]');
  const hasCategories = serviceTypes.length || appearances.length || ageRanges.length;
  const lineId = profile.user?.lineId || '';
  const userName = profile.user?.name || profile.name;

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      {/* Sticky Top Bar */}
      <div className="sticky top-16 z-40 flex items-center justify-between border-b border-gray-100/80 bg-white/95 px-4 py-3 backdrop-blur-md sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-nong-purple">
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">กลับหน้าแรก</span>
        </Link>
        <button
          onClick={handleShare}
          className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:border-nong-purple/30 hover:text-nong-purple"
        >
          <Share2 className="h-4 w-4" />
          <span className="hidden sm:inline">แชร์</span>
        </button>
      </div>

      <main className="mx-auto max-w-3xl pb-24">
        {/* Image Gallery */}
        <div className="overflow-hidden rounded-b-3xl bg-white shadow-sm">
          <ImageGallery images={images} name={profile.name} />
        </div>

        {/* Profile Info Card */}
        <div className="-mt-6 relative z-10 mx-4 rounded-3xl border border-gray-100 bg-white p-6 shadow-lg shadow-gray-200/50 sm:mx-6">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
                {displayTier.tier !== 'PENDING' && (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                  </span>
                )}
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-nong-purple">
                  <MapPin className="h-3.5 w-3.5 text-rose-500" />
                  {profile.province}
                  {profile.district && ` · ${profile.district}`}
                </span>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                  {profile.age} ปี
                </span>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                  {new Date().getFullYear() - profile.age} ปี ({profile.age} ปี)
                </span>
              </div>
            </div>

            <div className="shrink-0">
              <TierBadge
                tier={displayTier.tier as any}
                size="md"
                compact
                showDays
                daysRemaining={displayTier.daysRemaining}
              />
            </div>
          </div>

          {/* LINE Button */}
          {lineId && <div className="mt-5"><LineButton lineId={lineId} /></div>}

          {/* Stats Row */}
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="อายุ" value={`${profile.age} ปี`} icon={Clock} />
            <StatCard label="จังหวัด" value={profile.province} icon={MapPin} />
            <StatCard label="โพสต์" value={posts.length} icon={ExternalLink} />
            <StatCard
              label="เข้าร่วม"
              value={new Date(profile.createdAt).toLocaleDateString('th-TH', { month: 'short', year: '2-digit' })}
              icon={Calendar}
            />
          </div>

          {/* Categories */}
          {hasCategories && (
            <div className="mt-5">
              <button
                type="button"
                onClick={() => setShowCategories(!showCategories)}
                className="flex w-full items-center justify-between rounded-2xl border border-gray-100 bg-gray-50/80 px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
              >
                <span>หมวดหมู่</span>
                <ChevronDown className={cn('h-4 w-4 transition-transform', showCategories && 'rotate-180')} />
              </button>
              {showCategories && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {serviceTypes.map((s: string) => (
                    <span key={s} className="rounded-full bg-violet-50 px-3 py-1.5 text-xs font-medium text-nong-purple">
                      {s}
                    </span>
                  ))}
                  {appearances.map((a: string) => (
                    <span key={a} className="rounded-full bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-600">
                      {a}
                    </span>
                  ))}
                  {ageRanges.map((r: string) => (
                    <span key={r} className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
                      {r}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Description */}
          {profile.description && (
            <div className="mt-5">
              <h3 className="mb-2 text-sm font-semibold text-gray-900">รายละเอียด</h3>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-600">{profile.description}</p>
            </div>
          )}
        </div>

        {/* Posts Section */}
        {posts.length > 0 && (
          <div className="mx-4 mt-6 sm:mx-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">โพสต์ล่าสุด</h2>
              <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-nong-purple">
                {posts.length} โพสต์
              </span>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {posts.slice(0, 6).map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
            {posts.length > 6 && (
              <div className="mt-6 text-center">
                <Link
                  href={`/dashboard/posts/new?profile=${profile.id}`}
                  className="inline-flex items-center gap-2 rounded-full border border-nong-purple/25 bg-white px-8 py-3 text-sm font-semibold text-nong-purple shadow-sm transition hover:border-nong-purple/40 hover:bg-violet-50"
                >
                  ดูโพสต์ทั้งหมด ({posts.length})
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Meta */}
        <div className="mx-4 mt-8 flex items-center justify-center gap-2 text-xs text-gray-400 sm:mx-6">
          <Calendar className="h-3.5 w-3.5" />
          โปรไฟล์สร้างเมื่อ {formatDate(profile.createdAt)}
        </div>

        {/* CTA */}
        {!lineId && (
          <div className="mx-4 mt-6 rounded-3xl bg-gradient-to-br from-nong-purple to-nong-magenta p-6 text-center text-white sm:mx-6">
            <h3 className="text-lg font-bold">สนใจติดต่อนางแบบนี้?</h3>
            <p className="mt-1 text-sm text-white/80">สมัครสมาชิกเพื่อดู LINE และสร้างโพสต์</p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Link href="/login" className="rounded-full border border-white/40 bg-white/15 px-6 py-2.5 text-sm font-semibold backdrop-blur-sm transition hover:bg-white/25">
                เข้าสู่ระบบ
              </Link>
              <Link href="/register" className="rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-nong-purple transition hover:bg-violet-50">
                สมัครสมาชิกฟรี
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
