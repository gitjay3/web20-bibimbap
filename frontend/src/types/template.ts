export interface Field {
  label: string;
  type: 'TEXT' | 'NUMBER' | 'DATETIME';
}

export interface Template {
  id: number;
  title: string;
  slotSchema: Field[];
}
