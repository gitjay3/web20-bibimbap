import type { CreateTemplateDto, Template, UpdateTemplateDto } from '@/types/template';
import api from './api';

export async function getTemplates(): Promise<Template[]> {
  const { data } = await api.get<Template[]>('/templates');
  return data;
}

export async function getTemplate(id: number): Promise<Template> {
  const { data } = await api.get<Template>(`/templates/${id}`);
  return data;
}

export async function createTemplate(dto: CreateTemplateDto): Promise<Template> {
  const { data } = await api.post<Template>('/templates', dto);
  return data;
}

export async function updateTemplate(id: number, dto: UpdateTemplateDto): Promise<Template> {
  const { data } = await api.patch<Template>(`/templates/${id}`, dto);
  return data;
}

export async function deleteTemplate(id: number): Promise<Template> {
  const { data } = await api.delete<Template>(`/templates/${id}`);
  return data;
}
