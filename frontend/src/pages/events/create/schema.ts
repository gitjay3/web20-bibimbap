import * as z from 'zod';

export const eventSchema = z
  .object({
    // 기본 정보
    track: z.enum(['ALL', 'COMMON', 'WEB', 'ANDROID', 'IOS']),
    applyType: z.enum(['INDIVIDUAL', 'TEAM']),
    title: z.string().min(1, '제목을 입력해주세요.'),
    description: z.string().optional(),

    // 일정 설정
    openDate: z.string().min(1, '날짜를 선택하세요.'),
    openTime: z.string().min(1, '시간을 선택하세요.'),
    closeDate: z.string().min(1, '날짜를 선택하세요.'),
    closeTime: z.string().min(1, '시간을 선택하세요.'),

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

    slots: z.array(z.record(z.string(), z.any())).min(1, '값을 입력해주세요.'),
  })
  .refine(
    (data) => {
      // 예약 시작과 마감 시간 비교
      const start = new Date(`${data.openDate}T${data.openTime}`);
      const end = new Date(`${data.closeDate}T${data.closeTime}`);
      return end > start;
    },
    {
      message: '마감 시간은 시작 시간보다 이후여야 합니다.',
      path: ['closeTime'],
    },
  );

export type EventFormValues = z.infer<typeof eventSchema>;
