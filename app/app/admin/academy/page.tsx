'use client';

/**
 * 학원 정보 관리 페이지 (관리자용)
 * PRD F6: 학원 정보 관리
 *
 * Vercel Best Practices 적용:
 * - client-swr-dedup: SWR로 데이터 캐싱
 * - rerender-memo: React.memo 사용
 * - bundle-dynamic-imports: 이미지 업로더 lazy loading
 */

import React, { useState, useCallback, memo, Suspense, lazy } from 'react';
import Image from 'next/image';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Clock,
  Save,
  Upload,
  Crown,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  AlertCircle,
  Check,
  Edit2,
  X,
} from 'lucide-react';
import { useAcademy } from '@/hooks/useAcademy';
import {
  Academy,
  OperatingHours,
  OperatingTime,
  PLAN_FEATURES,
  PLAN_COLORS,
  SubscriptionPlan,
} from '@/types/academy';

// bundle-dynamic-imports: 이미지 업로더 lazy loading
const ImageUploader = lazy(() => import('@/components/ImageUploader'));

// UI 텍스트 상수
const UI_TEXT = {
  pageTitle: '학원 정보 관리',
  pageDescription: '학원의 기본 정보와 운영 설정을 관리합니다',
  basicInfo: '기본 정보',
  academyName: '학원명',
  address: '주소',
  phone: '연락처',
  email: '이메일',
  logo: '학원 로고',
  logoDescription: '권장 크기: 200x200px, PNG 또는 JPG',
  operatingHours: '운영 시간',
  weekdays: '평일 (월-금)',
  saturday: '토요일',
  sunday: '일요일',
  closed: '휴무',
  subscription: '구독 정보',
  currentPlan: '현재 요금제',
  expiresAt: '만료일',
  features: '포함 기능',
  statistics: '학원 통계',
  studentCount: '등록 학생',
  teacherCount: '선생님',
  classCount: '개설 반',
  save: '저장하기',
  saving: '저장 중...',
  edit: '수정',
  cancel: '취소',
  saveSuccess: '저장되었습니다.',
  saveError: '저장에 실패했습니다.',
  uploadLogo: '로고 업로드',
  changeLogo: '로고 변경',
  removeLogo: '로고 제거',
};

// 통계 카드 컴포넌트 (memo 적용)
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}

const StatCard = memo(function StatCard({ icon, label, value, color }: StatCardProps) {
  return (
    <div className={`p-6 rounded-2xl ${color}`}>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-white/50 rounded-xl flex items-center justify-center">
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold">{value.toLocaleString()}</p>
          <p className="text-sm opacity-80">{label}</p>
        </div>
      </div>
    </div>
  );
});

// 운영 시간 입력 컴포넌트 (memo 적용)
interface TimeInputProps {
  label: string;
  time?: OperatingTime;
  onChange: (time: OperatingTime | undefined) => void;
  disabled?: boolean;
}

const TimeInput = memo(function TimeInput({ label, time, onChange, disabled }: TimeInputProps) {
  const [isClosed, setIsClosed] = useState(!time);

  const handleClosedToggle = () => {
    if (isClosed) {
      onChange({ start: '09:00', end: '18:00' });
    } else {
      onChange(undefined);
    }
    setIsClosed(!isClosed);
  };

  return (
    <div className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0">
      <span className="w-32 text-sm font-medium text-gray-700">{label}</span>
      <div className="flex items-center gap-3 flex-1">
        {isClosed ? (
          <span className="text-sm text-gray-400">{UI_TEXT.closed}</span>
        ) : (
          <>
            <input
              type="time"
              value={time?.start || '09:00'}
              onChange={(e) => onChange({ ...time!, start: e.target.value })}
              className="input w-32 text-center"
              disabled={disabled}
            />
            <span className="text-gray-400">~</span>
            <input
              type="time"
              value={time?.end || '18:00'}
              onChange={(e) => onChange({ ...time!, end: e.target.value })}
              className="input w-32 text-center"
              disabled={disabled}
            />
          </>
        )}
        {label !== UI_TEXT.weekdays && !disabled && (
          <button
            type="button"
            onClick={handleClosedToggle}
            className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
              isClosed
                ? 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                : 'bg-red-50 text-red-500 hover:bg-red-100'
            }`}
          >
            {isClosed ? '운영' : UI_TEXT.closed}
          </button>
        )}
      </div>
    </div>
  );
});

// 플랜 카드 컴포넌트 (memo 적용)
interface PlanCardProps {
  plan: SubscriptionPlan;
  expiresAt: string;
}

const PlanCard = memo(function PlanCard({ plan, expiresAt }: PlanCardProps) {
  const planInfo = PLAN_FEATURES[plan];
  const planColor = PLAN_COLORS[plan];
  const daysRemaining = Math.ceil(
    (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="p-6 bg-gradient-to-br from-primary-50 to-white rounded-2xl border border-primary-100">
      <div className="flex items-start justify-between mb-4">
        <div>
          <span className={`text-sm px-3 py-1 rounded-full ${planColor}`}>
            {planInfo.name}
          </span>
          <p className="text-2xl font-bold text-gray-900 mt-2">{planInfo.price}</p>
        </div>
        <Crown className="w-8 h-8 text-amber-500" />
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>
            {UI_TEXT.expiresAt}: {expiresAt}
          </span>
        </div>
        {daysRemaining > 0 && daysRemaining <= 30 && (
          <div className="flex items-center gap-2 text-sm text-amber-600">
            <AlertCircle className="w-4 h-4" />
            <span>{daysRemaining}일 후 만료됩니다</span>
          </div>
        )}
      </div>

      <div className="border-t border-primary-100 pt-4">
        <p className="text-sm font-medium text-gray-700 mb-2">{UI_TEXT.features}</p>
        <ul className="space-y-2">
          {planInfo.features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
              <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
              {feature}
            </li>
          ))}
        </ul>
      </div>

      <button className="w-full mt-4 btn-secondary text-sm">요금제 변경</button>
    </div>
  );
});

// 로고 업로드 섹션 컴포넌트
interface LogoSectionProps {
  logoUrl?: string;
  onLogoChange: (file: File) => void;
  onLogoRemove: () => void;
  isEditing: boolean;
}

const LogoSection = memo(function LogoSection({
  logoUrl,
  onLogoChange,
  onLogoRemove,
  isEditing,
}: LogoSectionProps) {
  const [showUploader, setShowUploader] = useState(false);

  const handleImagesSelected = useCallback(
    (images: { file: File }[]) => {
      if (images.length > 0) {
        onLogoChange(images[0].file);
        setShowUploader(false);
      }
    },
    [onLogoChange]
  );

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{UI_TEXT.logo}</h2>
      <div className="flex items-start gap-6">
        {/* 로고 미리보기 */}
        <div className="w-32 h-32 bg-gray-100 rounded-2xl overflow-hidden flex items-center justify-center border-2 border-dashed border-gray-200 relative">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt="학원 로고"
              fill
              className="object-cover"
              unoptimized // blob URL 지원을 위해
            />
          ) : (
            <Building2 className="w-12 h-12 text-gray-300" />
          )}
        </div>

        {/* 업로드 컨트롤 */}
        <div className="flex-1">
          <p className="text-sm text-gray-500 mb-4">{UI_TEXT.logoDescription}</p>
          {isEditing && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowUploader(true)}
                className="btn-secondary text-sm flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                {logoUrl ? UI_TEXT.changeLogo : UI_TEXT.uploadLogo}
              </button>
              {logoUrl && (
                <button
                  type="button"
                  onClick={onLogoRemove}
                  className="btn-secondary text-sm text-red-500 border-red-200 hover:bg-red-50"
                >
                  {UI_TEXT.removeLogo}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 이미지 업로더 모달 */}
      {showUploader && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{UI_TEXT.uploadLogo}</h3>
              <button
                onClick={() => setShowUploader(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <Suspense
              fallback={
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
                </div>
              }
            >
              <ImageUploader
                onImagesSelected={handleImagesSelected}
                multiple={false}
                maxImages={1}
              />
            </Suspense>
          </div>
        </div>
      )}
    </div>
  );
});

// 메인 페이지 컴포넌트
export default function AcademyManagementPage() {
  const { academy, isLoading, updateAcademy, uploadLogo } = useAcademy();

  // 편집 모드 상태
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // 폼 상태
  const [formData, setFormData] = useState<Partial<Academy>>({});

  // 편집 시작
  const handleStartEdit = () => {
    if (academy) {
      setFormData({
        name: academy.name,
        address: academy.address,
        phone: academy.phone,
        email: academy.email,
        operatingHours: { ...academy.operatingHours },
      });
    }
    setIsEditing(true);
    setSaveMessage(null);
  };

  // 편집 취소
  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormData({});
    setSaveMessage(null);
  };

  // 저장
  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    const result = await updateAcademy(formData);

    if (result.success) {
      setSaveMessage({ type: 'success', text: UI_TEXT.saveSuccess });
      setIsEditing(false);
    } else {
      setSaveMessage({ type: 'error', text: result.error || UI_TEXT.saveError });
    }

    setIsSaving(false);
  };

  // 로고 변경
  const handleLogoChange = async (file: File) => {
    const result = await uploadLogo(file);
    if (!result.success) {
      setSaveMessage({ type: 'error', text: result.error || '로고 업로드에 실패했습니다.' });
    }
  };

  // 로고 제거
  const handleLogoRemove = async () => {
    await updateAcademy({ logoUrl: '' });
  };

  // 운영 시간 변경
  const handleOperatingHoursChange = (
    day: 'weekdays' | 'saturday' | 'sunday',
    time: OperatingTime | undefined
  ) => {
    setFormData((prev) => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours!,
        [day]: time,
      },
    }));
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-gray-200 rounded" />
          <div className="h-4 w-64 bg-gray-200 rounded" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-2xl" />
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  // 데이터 없음
  if (!academy) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">학원 정보를 불러올 수 없습니다.</p>
        </div>
      </div>
    );
  }

  const displayData = isEditing ? formData : academy;
  const operatingHours = displayData.operatingHours as OperatingHours;

  return (
    <div className="p-8 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{UI_TEXT.pageTitle}</h1>
          <p className="text-gray-500">{UI_TEXT.pageDescription}</p>
        </div>
        {!isEditing ? (
          <button onClick={handleStartEdit} className="btn-primary flex items-center gap-2">
            <Edit2 className="w-4 h-4" />
            {UI_TEXT.edit}
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleCancelEdit}
              className="btn-secondary"
              disabled={isSaving}
            >
              {UI_TEXT.cancel}
            </button>
            <button
              onClick={handleSave}
              className="btn-primary flex items-center gap-2"
              disabled={isSaving}
            >
              <Save className="w-4 h-4" />
              {isSaving ? UI_TEXT.saving : UI_TEXT.save}
            </button>
          </div>
        )}
      </div>

      {/* 저장 메시지 */}
      {saveMessage && (
        <div
          className={`flex items-center gap-2 p-4 rounded-xl ${
            saveMessage.type === 'success'
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {saveMessage.type === 'success' ? (
            <Check className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{saveMessage.text}</span>
        </div>
      )}

      {/* 통계 카드 */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          icon={<Users className="w-6 h-6 text-blue-600" />}
          label={UI_TEXT.studentCount}
          value={academy.stats.studentCount}
          color="bg-blue-50 text-blue-700"
        />
        <StatCard
          icon={<GraduationCap className="w-6 h-6 text-green-600" />}
          label={UI_TEXT.teacherCount}
          value={academy.stats.teacherCount}
          color="bg-green-50 text-green-700"
        />
        <StatCard
          icon={<BookOpen className="w-6 h-6 text-purple-600" />}
          label={UI_TEXT.classCount}
          value={academy.stats.classCount}
          color="bg-purple-50 text-purple-700"
        />
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* 왼쪽: 기본 정보 + 운영 시간 */}
        <div className="col-span-2 space-y-6">
          {/* 기본 정보 카드 */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{UI_TEXT.basicInfo}</h2>
            <div className="space-y-4">
              {/* 학원명 */}
              <div>
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
                  <Building2 className="w-4 h-4" />
                  {UI_TEXT.academyName}
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    placeholder="학원명을 입력하세요"
                  />
                ) : (
                  <p className="text-gray-900 font-medium">{academy.name}</p>
                )}
              </div>

              {/* 주소 */}
              <div>
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4" />
                  {UI_TEXT.address}
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="input"
                    placeholder="주소를 입력하세요"
                  />
                ) : (
                  <p className="text-gray-600">{academy.address}</p>
                )}
              </div>

              {/* 연락처 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
                    <Phone className="w-4 h-4" />
                    {UI_TEXT.phone}
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="input"
                      placeholder="02-0000-0000"
                    />
                  ) : (
                    <p className="text-gray-600">{academy.phone}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
                    <Mail className="w-4 h-4" />
                    {UI_TEXT.email}
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="input"
                      placeholder="email@example.com"
                    />
                  ) : (
                    <p className="text-gray-600">{academy.email}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 운영 시간 카드 */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              {UI_TEXT.operatingHours}
            </h2>
            <div className="space-y-1">
              <TimeInput
                label={UI_TEXT.weekdays}
                time={operatingHours?.weekdays}
                onChange={(time) =>
                  handleOperatingHoursChange('weekdays', time || { start: '09:00', end: '18:00' })
                }
                disabled={!isEditing}
              />
              <TimeInput
                label={UI_TEXT.saturday}
                time={operatingHours?.saturday}
                onChange={(time) => handleOperatingHoursChange('saturday', time)}
                disabled={!isEditing}
              />
              <TimeInput
                label={UI_TEXT.sunday}
                time={operatingHours?.sunday}
                onChange={(time) => handleOperatingHoursChange('sunday', time)}
                disabled={!isEditing}
              />
            </div>
          </div>

          {/* 로고 섹션 */}
          <LogoSection
            logoUrl={academy.logoUrl}
            onLogoChange={handleLogoChange}
            onLogoRemove={handleLogoRemove}
            isEditing={isEditing}
          />
        </div>

        {/* 오른쪽: 구독 정보 */}
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{UI_TEXT.subscription}</h2>
            <PlanCard
              plan={academy.subscription.plan}
              expiresAt={academy.subscription.expiresAt}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
