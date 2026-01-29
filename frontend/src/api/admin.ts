import api from './api';

export interface AdminInvitation {
  id: string;
  githubUsername: string;
  status: 'PENDING' | 'ACCEPTED' | 'REVOKED';
  invitedAt: string;
  acceptedAt?: string;
  inviter: {
    id: string;
    username: string;
    name?: string;
  };
}

export interface AdminMember {
  id: string;
  username: string;
  name?: string;
  avatarUrl?: string;
}

// 초대 생성
export const createAdminInvitation = async (githubUsername: string): Promise<AdminInvitation> => {
  const response = await api.post<AdminInvitation>('/admin/invitations', {
    githubUsername,
  });
  return response.data;
};

// 초대 목록 조회
export const getAdminInvitations = async (): Promise<AdminInvitation[]> => {
  const response = await api.get<AdminInvitation[]>('/admin/invitations');
  return response.data;
};

// 초대 취소
export const revokeAdminInvitation = async (id: string): Promise<void> => {
  await api.delete(`/admin/invitations/${id}`);
};

// 운영진 목록 조회
export const getAdminMembers = async (): Promise<AdminMember[]> => {
  const response = await api.get<AdminMember[]>('/admin/members');
  return response.data;
};

// 운영진 권한 해제
export const removeAdminMember = async (id: string): Promise<void> => {
  await api.delete(`/admin/members/${id}`);
};
