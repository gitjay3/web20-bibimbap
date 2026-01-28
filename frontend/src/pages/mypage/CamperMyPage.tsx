import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { useAuth } from '@/store/AuthContext';
import UserIcon from '@/assets/icons/user.svg?react';
import PencilIcon from '@/assets/icons/pencil.svg?react';
import CheckIcon from '@/assets/icons/check.svg?react';
import XMarkIcon from '@/assets/icons/x-mark.svg?react';
import { getMyCamperProfile, updateMyCamperProfile } from '@/api/organization';
import type { CamperProfile } from '@/api/organization';
import { toast } from 'sonner';

interface InfoRowProps {
  label: string;
  value: string;
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="flex justify-between items-center text-16">
      <span className="text-neutral-text-tertiary font-medium">{label}</span>
      <span className="text-neutral-text-primary font-medium">{value}</span>
    </div>
  );
}

function CamperMyPage() {
  const { user } = useAuth();
  const { orgId } = useParams<{ orgId: string }>();
  
  const [profile, setProfile] = useState<CamperProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [slackId, setSlackId] = useState<string | null>(null);
  const [isEditingSlackId, setIsEditingSlackId] = useState(false);
  const [tempSlackId, setTempSlackId] = useState('');

  useEffect(() => {
    async function fetchProfile() {
      if (!orgId) return;
      try {
        setIsLoading(true);
        const data = await getMyCamperProfile(orgId);
        setProfile(data);
        setSlackId(data.slackMemberId);
      } catch {
        toast.error('프로필 정보를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    }
    fetchProfile();
  }, [orgId]);

  const handleEditStart = () => {
    setTempSlackId(slackId || '');
    setIsEditingSlackId(true);
  };

  const handleEditSave = async () => {
    if (!orgId) return;
    try {
      const updated = await updateMyCamperProfile(orgId, { slackMemberId: tempSlackId });
      setSlackId(updated.slackMemberId);
      setProfile((prev) => prev ? { ...prev, slackMemberId: updated.slackMemberId } : null);
      setIsEditingSlackId(false);
      toast.success('Slack ID가 저장되었습니다.');
    } catch {
      toast.error('Slack ID 저장에 실패했습니다.');
    }
  };

  const handleEditCancel = () => {
    setIsEditingSlackId(false);
    setTempSlackId('');
  };

  if (isLoading) {
    return <div className="py-20 text-center text-neutral-text-secondary">로딩 중...</div>;
  }

  if (!profile && !isLoading) {
      // Fallback for when profile fetch fails fundamentally or no org context
      return <div className="py-20 text-center text-neutral-text-secondary">정보를 불러올 수 없습니다.</div>;
  }

  const { camperId, name, username, track, groupNumber } = profile || {};

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center py-20">
      <div className="mb-6 flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border border-neutral-border-default bg-neutral-surface-default">
        {profile?.profileUrl ? (
          <img
            src={profile.profileUrl}
            alt="Profile"
            className="h-full w-full object-cover"
          />
        ) : (
          <UserIcon className="h-20 w-20 text-neutral-text-tertiary" />
        )}
      </div>

      <h1 className="mb-12 text-24 font-bold text-neutral-text-primary">
        {camperId} {name || user?.name || ''}
      </h1>

      <div className="w-full space-y-6 border-t border-neutral-border-default pt-10">
        <InfoRow label="GitHub" value={username ? `@${username}` : '-'} />
        <InfoRow label="분야" value={track || '-'} />
        <InfoRow label="그룹" value={groupNumber ? `WEB${groupNumber}` : '-'} />
        <InfoRow label="소속" value="부스트캠프 웹・모바일 10기" />
        
        {/* Slack ID Row */}
        <div className="flex justify-between items-center text-16 h-8">
          <span className="text-neutral-text-tertiary font-medium">Slack</span>
          {isEditingSlackId ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={tempSlackId}
                onChange={(e) => setTempSlackId(e.target.value)}
                placeholder="Member ID"
                className="w-40 rounded border border-brand-500 px-2 py-1 text-16 text-neutral-text-primary focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              <button type="button" onClick={handleEditSave} className="text-success-500 cursor-pointer hover:text-success-600">
                <CheckIcon className="h-5 w-5" />
              </button>
              <button type="button" onClick={handleEditCancel} className="text-neutral-text-tertiary cursor-pointer hover:text-neutral-text-secondary">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 group">
              {slackId ? (
                <span className="text-neutral-text-primary font-medium">{slackId}</span>
              ) : (
                <span className="text-neutral-text-tertiary">ID 등록하기</span>
              )}
              <PencilIcon className="h-4 w-4 text-neutral-text-tertiary cursor-pointer hover:text-neutral-text-secondary" onClick={handleEditStart} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface InfoRowProps {
  label: string;
  value: string;
}



export default CamperMyPage;
