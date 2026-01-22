export type FieldType = 'text' | 'number' | 'time' | 'datetime';

export interface Field {
  id: string;
  name: string;
  type: FieldType;
}

export interface SlotSchema {
  fields: Field[];
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
