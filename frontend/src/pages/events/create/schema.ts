import * as z from 'zod';

export const eventSchema = z
  .object({
    // 기본 정보
    track: z.enum(['ALL', 'COMMON', 'WEB', 'ANDROID', 'IOS']),
    applicationUnit: z.enum(['INDIVIDUAL', 'TEAM']),
    title: z.string().min(1, '제목을 입력해주세요.'),
    description: z.string().optional(),

    // 일정 설정
    openDate: z.string().min(1, '시작 날짜를 선택하세요.'),
    openTime: z.string().min(1, '시작 시간을 선택하세요.'),
    closeDate: z.string().min(1, '마감 날짜를 선택하세요.'),
    closeTime: z.string().min(1, '마감 시간을 선택하세요.'),

    // 선택지 목록
    slotSchema: z.object({
      fields: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          type: z.enum(['text', 'number', 'time']),
        }),
      ),
    }),

    slots: z.array(z.record(z.string(), z.any())),
  })
  .refine(
    (data) => {
      if (!data.openDate || !data.openTime || !data.closeDate || !data.closeTime) {
        return true;
      }
      const start = new Date(`${data.openDate}T${data.openTime}`);
      const end = new Date(`${data.closeDate}T${data.closeTime}`);
      return end > start;
    },
    {
      message: '마감 시간은 시작 시간보다 이후여야 합니다.',
      path: ['closeTime'],
    },
  )
  .superRefine((data, ctx) => {
    const fields = data.slotSchema?.fields ?? [];
    const slots = data.slots ?? [];
    if (fields.length === 0) return;

    slots.forEach((row, rowIndex) => {
      fields.forEach((field) => {
        const v = (row as Record<string, unknown>)[field.id];

        const empty =
          field.type === 'number'
            ? v === null || v === undefined || v === '' || Number.isNaN(Number(v))
            : v === null || v === undefined || (typeof v === 'string' && v.trim() === '');

        if (empty) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: '선택지의 모든 값을 입력해주세요.',
            path: ['slots', rowIndex, field.id],
          });
        }
      });
    });
  });

export type EventFormValues = z.infer<typeof eventSchema>;
