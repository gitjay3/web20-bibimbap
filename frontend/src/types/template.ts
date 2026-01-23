import type { SlotFieldType, SlotSchemaField } from './event';

// template.ts에서는 event.ts의 타입을 재사용
export type FieldType = SlotFieldType;
export type Field = SlotSchemaField;

export interface SlotSchema {
  fields: SlotSchemaField[];
}

export interface Template {
  id: number;
  title: string;
  description: string | null;
  slotSchema: SlotSchema;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplateDto {
  title: string;
  description?: string;
  slotSchema: SlotSchema;
}

export type UpdateTemplateDto = Partial<CreateTemplateDto>;
