import type { Camper } from '@/types/camper';
import api from './api';

export interface Organization {
  id: string;
  name: string;
  camperCount?: number;
  eventCount?: number;
  isSlackEnabled: boolean;
  slackWorkspaceId?: string | null;
}

export interface CreateOrganizationDto {
  name: string;
  slackWorkspaceId?: string;
  slackBotToken?: string;
}

export async function getOrganization(id: string): Promise<Organization> {
  const { data } = await api.get<Organization>(`/organizations/${id}`);
  return data;
}

export async function getMyOrganizations(): Promise<Organization[]> {
  const { data } = await api.get<Organization[]>('/organizations/me');
  return data;
}

export async function createOrganization(dto: CreateOrganizationDto): Promise<Organization> {
  const { data } = await api.post<Organization>('/organizations', dto);
  return data;
}

export async function updateOrganization(
  id: string,
  dto: Partial<CreateOrganizationDto>,
): Promise<Organization> {
  const { data } = await api.patch<Organization>(`/organizations/${id}`, dto);
  return data;
}

export async function getCampers(orgId: string): Promise<Camper[]> {
  const { data } = await api.get<Camper[]>(`/organizations/${orgId}/campers`);
  return data;
}

export async function createCamper(
  orgId: string,
  camper: Omit<Camper, 'id' | 'status'>,
): Promise<Camper> {
  const { data } = await api.post<Camper>(`/organizations/${orgId}/campers`, camper);
  return data;
}

export async function getCamperTemplate(orgId: string): Promise<Blob> {
  const { data } = await api.get(`/organizations/${orgId}/campers/template`, {
    responseType: 'blob',
  });
  return data;
}

export async function updateCamper(
  orgId: string,
  id: string,
  camper: Partial<Omit<Camper, 'id' | 'status'>>,
): Promise<Camper> {
  const { data } = await api.patch<Camper>(`/organizations/${orgId}/campers/${id}`, camper);
  return data;
}

export async function deleteCamper(orgId: string, id: string): Promise<void> {
  await api.delete(`/organizations/${orgId}/campers/${id}`);
}

export async function uploadCampers(orgId: string, formData: FormData): Promise<void> {
  await api.post(`/organizations/${orgId}/campers/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

export interface CamperProfile {
  camperId: string | null;
  name?: string;
  username?: string;
  track?: Camper['track'];
  groupNumber?: number | null;
  slackMemberId: string | null;
  profileUrl: string | null;
  isSlackEnabled: boolean;
}

export async function getMyCamperProfile(orgId: string): Promise<CamperProfile> {
  const { data } = await api.get<CamperProfile>(`/organizations/${orgId}/campers/me`);
  return data;
}

export async function updateMyCamperProfile(
  orgId: string,
  dto: { slackMemberId: string },
): Promise<CamperProfile> {
  const { data } = await api.patch<CamperProfile>(
    `/organizations/${orgId}/campers/me`,
    dto,
  );
  return data;
}
