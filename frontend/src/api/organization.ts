import api from './api';

export interface Organization {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export async function getOrganization(id: string): Promise<Organization> {
  const { data } = await api.get<Organization>(`/organizations/${id}`);
  return data;
}

export async function getMyOrganizations(): Promise<Organization[]> {
  const { data } = await api.get<Organization[]>('/organizations/me');
  return data;
}
