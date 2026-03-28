import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function safeJsonParse(jsonString: string | null | undefined, defaultValue: unknown[] = []): unknown[] {
  if (!jsonString) return defaultValue;
  try {
    const parsed = JSON.parse(jsonString);
    if (!Array.isArray(parsed)) return defaultValue;
    // Validate array contains only strings
    return parsed.every((item) => typeof item === 'string') ? parsed : defaultValue;
  } catch {
    return defaultValue;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const province = searchParams.get('province');
    const district = searchParams.get('district');
    const search = searchParams.get('search') || searchParams.get('q');
    const sort = searchParams.get('sort') || 'tier';
    const tier = searchParams.get('tier');
    const serviceType = searchParams.get('serviceType');
    const appearance = searchParams.get('appearance');
    const ageRange = searchParams.get('ageRange');
    const region = searchParams.get('region');

    // Only show APPROVED profiles to public
    const whereClause: Record<string, unknown> = { status: 'APPROVED' };

    if (province) {
      // Validate province is a known Thai province
      const validProvinces = [
        'กรุงเทพมหานคร', 'สมุทรปราการ', 'นนทบุรี', 'ปทุมธานี', 'พระนครศรีอยุธยา',
        'อ่างทอง', 'ลพบุรี', 'สิงห์บุรี', 'ชัยนาท', 'สระบุรี', 'ชลบุรี', 'ระยอง',
        'จันทบุรี', 'ตราด', 'นครปฐม', 'สมุทรสาคร', 'สมุทรสงคราม', 'เพชรบุรี',
        'ประจวบคีรีขันธ์', 'หนองคาย', 'มหาสารคาม', 'ร้อยเอ็ด', 'อุดรธานี', 'ขอนแก่น',
        'นครราชสีมา', 'บุรีรัมย์', 'สุรินทร์', 'ศรีสะเกษ', 'ยโสธร', 'อำนาจเจริญ',
        'หนองบัวลำภู', 'ลำพูน', 'เชียงใหม่', 'ลำปาง', 'อุตรดิตถ์', 'แพร่', 'น่าน',
        'พะเยา', 'เชียงราย', 'แม่ฮ่องสอน', 'ตาก', 'สุโขทัย', 'พิษณุโลก', 'พิจิตร',
        'อุทัยธานี', 'เพชรบูรณ์', 'ราชบุรี', 'กาฬสินธุ์', 'สกลนคร', 'นครพนม', 'มุกดาหาร',
        'บึงกาฬ', 'นครสวรรค์', 'อุบลราชธานี',
      ];
      if (validProvinces.includes(province)) {
        whereClause.province = province;
      }
    }

    if (district) {
      // Limit district search length to prevent abuse
      const safeDistrict = String(district).slice(0, 100);
      whereClause.district = { contains: safeDistrict };
    }

    if (region) {
      const validRegions = ['central', 'north', 'south', 'northeast', 'east', 'west'];
      if (validRegions.includes(region)) {
        whereClause.region = region;
      }
    }

    if (search) {
      // Limit search length and sanitize
      const safeSearch = String(search).slice(0, 100).trim();
      if (safeSearch) {
        whereClause.OR = [
          { name: { contains: safeSearch } },
          { province: { contains: safeSearch } },
          { district: { contains: safeSearch } },
          { description: { contains: safeSearch } },
        ];
      }
    }

    const profiles = await prisma.profile.findMany({
      where: whereClause,
      include: { user: { select: { lineId: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit results to prevent DoS
    });

    // Filter by category fields using safe parsing
    let filteredProfiles = profiles;

    if (serviceType) {
      filteredProfiles = filteredProfiles.filter(p => {
        const types = safeJsonParse(p.serviceTypes);
        return types.includes(serviceType);
      });
    }
    if (appearance) {
      filteredProfiles = filteredProfiles.filter(p => {
        const appearances = safeJsonParse(p.appearance);
        return appearances.includes(appearance);
      });
    }
    if (ageRange) {
      filteredProfiles = filteredProfiles.filter(p => {
        const ranges = safeJsonParse(p.ageRange);
        return ranges.includes(ageRange);
      });
    }
    if (tier) {
      filteredProfiles = filteredProfiles.filter(p => {
        const now = new Date();
        if (tier === 'SUPER') return p.superExpiry && new Date(p.superExpiry) > now;
        if (tier === 'MODEL') return p.modelExpiry && new Date(p.modelExpiry) > now;
        if (tier === 'FREE') {
          const hasSuper = p.superExpiry && new Date(p.superExpiry) > now;
          const hasModel = p.modelExpiry && new Date(p.modelExpiry) > now;
          return !hasSuper && !hasModel;
        }
        return false;
      });
    }

    let sortedProfiles = [...filteredProfiles];
    if (sort === 'latest') {
      sortedProfiles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      sortedProfiles.sort((a, b) => {
        const getTierOrder = (p: typeof profiles[0]) => {
          const now = new Date();
          if (p.superExpiry && new Date(p.superExpiry) > now) return 0;
          if (p.modelExpiry && new Date(p.modelExpiry) > now) return 1;
          return 2;
        };
        return getTierOrder(a) - getTierOrder(b);
      });
    }

    return NextResponse.json({ profiles: sortedProfiles });
  } catch (error) {
    console.error('Get profiles error:', error);
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { cookies: cookieStore } = await import('next/headers');
    const sessionCookie = cookieStore().get('ff2_session');
    if (!sessionCookie) {
      return NextResponse.json({ message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    const { extractSessionFromCookie } = await import('@/lib/session');
    const sessionData = extractSessionFromCookie(sessionCookie.value);
    if (!sessionData) {
      return NextResponse.json({ message: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่' }, { status: 401 });
    }

    const userId = sessionData.userId;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || (user.accountType !== 'POSTER' && user.role !== 'ADMIN')) {
      return NextResponse.json(
        { message: 'เฉพาะบัญชี Post งานเท่านั้นที่สร้างโปรไฟล์ได้' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, age, province, district, description, images, serviceTypes, appearance, ageRange, region } = body;

    // Validate required fields
    if (!name || !age || !province) {
      return NextResponse.json({ message: 'กรุณากรอกข้อมูลให้ครบ' }, { status: 400 });
    }

    const ageNum = typeof age === 'number' ? age : parseInt(String(age), 10);
    if (!Number.isFinite(ageNum) || ageNum < 20 || ageNum > 99) {
      return NextResponse.json(
        { message: 'อายุต้องอยู่ระหว่าง 20–99 ปี' },
        { status: 400 }
      );
    }

    // Count existing profiles
    const profileCount = await prisma.profile.count({
      where: { userId },
    });

    if (profileCount >= 50) {
      return NextResponse.json({ message: 'คุณสร้างโปรไฟล์ได้สูงสุด 50 โปรไฟล์' }, { status: 400 });
    }

    // Map province to region
    const REGION_MAP: Record<string, string> = {
      'กรุงเทพมหานคร': 'central', 'สมุทรปราการ': 'central', 'นนทบุรี': 'central',
      'ปทุมธานี': 'central', 'พระนครศรีอยุธยา': 'central', 'อ่างทอง': 'central',
      'ลพบุรี': 'central', 'สิงห์บุรี': 'central', 'ชัยนาท': 'central',
      'สระบุรี': 'central', 'นครปฐม': 'central', 'สมุทรสาคร': 'central',
      'สมุทรสงคราม': 'central', 'เพชรบุรี': 'central', 'ประจวบคีรีขันธ์': 'central',
      'ราชบุรี': 'central', 'ชลบุรี': 'east', 'ระยอง': 'east', 'จันทบุรี': 'east',
      'ตราด': 'east', 'อุดรธานี': 'northeast', 'ขอนแก่น': 'northeast',
      'นครราชสีมา': 'northeast', 'บุรีรัมย์': 'northeast', 'สุรินทร์': 'northeast',
      'ศรีสะเกษ': 'northeast', 'มหาสารคาม': 'northeast', 'ร้อยเอ็ด': 'northeast',
      'หนองคาย': 'northeast', 'เชียงใหม่': 'north', 'ลำพูน': 'north',
      'ลำปาง': 'north', 'แพร่': 'north', 'น่าน': 'north', 'พะเยา': 'north',
      'เชียงราย': 'north', 'แม่ฮ่องสอน': 'north', 'ตาก': 'north',
      'สุโขทัย': 'north', 'พิษณุโลก': 'north', 'พิจิตร': 'north',
      'อุทัยธานี': 'north', 'เพชรบูรณ์': 'north', 'นครสวรรค์': 'north',
      'กาฬสินธุ์': 'northeast', 'สกลนคร': 'northeast', 'นครพนม': 'northeast',
      'มุกดาหาร': 'northeast', 'บึงกาฬ': 'northeast', 'หนองบัวลำภู': 'northeast',
      'ยโสธร': 'northeast', 'อำนาจเจริญ': 'northeast', 'อุบลราชธานี': 'northeast',
      'สงขลา': 'south', 'สุราษฎร์ธานี': 'south', 'พังงา': 'south',
      'กระบี่': 'south', 'ภูเก็ต': 'south', 'ตรัง': 'south',
      'นครศรีธรรมราช': 'south', 'ชุมพร': 'south', 'ระนอง': 'south',
    };

    const profileRegion = region || REGION_MAP[province] || 'central';

    // Sanitize inputs
    const sanitizedServiceTypes = Array.isArray(serviceTypes)
      ? serviceTypes.filter((s): s is string => typeof s === 'string').slice(0, 10)
      : [];
    const sanitizedAppearance = Array.isArray(appearance)
      ? appearance.filter((s): s is string => typeof s === 'string').slice(0, 10)
      : [];
    const sanitizedAgeRange = Array.isArray(ageRange)
      ? ageRange.filter((s): s is string => typeof s === 'string').slice(0, 5)
      : [];

    const profile = await prisma.profile.create({
      data: {
        userId,
        name: String(name).slice(0, 100),
        age: ageNum,
        province: String(province).slice(0, 100),
        district: district ? String(district).slice(0, 100) : null,
        description: description ? String(description).slice(0, 1000) : null,
        images: JSON.stringify(images || []),
        status: 'PENDING',
        serviceTypes: JSON.stringify(sanitizedServiceTypes),
        appearance: JSON.stringify(sanitizedAppearance),
        ageRange: JSON.stringify(sanitizedAgeRange),
        region: profileRegion,
      },
    });

    return NextResponse.json({ message: 'สร้างโปรไฟล์สำเร็จ', profile }, { status: 201 });
  } catch (error) {
    console.error('Create profile error:', error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
