import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import * as templateApi from '@/api/template';
import type { Template, CreateTemplateDto, SlotSchema } from '@/types/template';
import { customRenderHook } from '@/test/utils';
import useTemplates from './useTemplates';

// API 모킹
vi.mock('@/api/template');

// toast 모킹
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// window.confirm 모킹
const mockConfirm = vi.fn();
Object.defineProperty(window, 'confirm', {
  value: mockConfirm,
  writable: true,
});

const createMockSlotSchema = (): SlotSchema => ({
  fields: [
    { id: 'startTime', name: '시작 시간', type: 'time' },
    { id: 'mentorName', name: '멘토명', type: 'text' },
  ],
});

const createMockTemplate = (overrides?: Partial<Template>): Template => ({
  id: 1,
  title: '테스트 템플릿',
  description: '테스트 설명',
  slotSchema: createMockSlotSchema(),
  createdAt: '2026-01-25T10:00:00Z',
  updatedAt: '2026-01-25T10:00:00Z',
  ...overrides,
});

describe('useTemplates', () => {
  const mockGetTemplates = vi.mocked(templateApi.getTemplates);
  const mockCreateTemplate = vi.mocked(templateApi.createTemplate);
  const mockUpdateTemplate = vi.mocked(templateApi.updateTemplate);
  const mockDeleteTemplate = vi.mocked(templateApi.deleteTemplate);

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetTemplates.mockResolvedValue([]);
    mockConfirm.mockReturnValue(true);
  });

  describe('초기 로드', () => {
    it('마운트 시 템플릿 목록을 불러온다', async () => {
      const templates = [createMockTemplate({ id: 1 }), createMockTemplate({ id: 2 })];
      mockGetTemplates.mockResolvedValue(templates);

      const { result } = customRenderHook(() => useTemplates());

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockGetTemplates).toHaveBeenCalledTimes(1);
      expect(result.current.templates).toHaveLength(2);
    });

    it('템플릿 목록 로드 실패 시 에러 토스트를 표시한다', async () => {
      mockGetTemplates.mockRejectedValue(new Error('Network Error'));

      const { result } = customRenderHook(() => useTemplates());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(toast.error).toHaveBeenCalledWith('템플릿 목록을 불러오는데 실패했습니다.');
    });
  });

  describe('템플릿 생성', () => {
    it('템플릿 생성에 성공하면 목록에 추가되고 성공 토스트를 표시한다', async () => {
      const existingTemplate = createMockTemplate({ id: 1 });
      const newTemplate = createMockTemplate({ id: 2, title: '새 템플릿' });
      mockGetTemplates.mockResolvedValue([existingTemplate]);
      mockCreateTemplate.mockResolvedValue(newTemplate);

      const { result } = customRenderHook(() => useTemplates());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const createDto: CreateTemplateDto = {
        title: '새 템플릿',
        slotSchema: createMockSlotSchema(),
      };

      await act(async () => {
        await result.current.addTemplate(createDto);
      });

      expect(mockCreateTemplate).toHaveBeenCalledWith(createDto);
      expect(toast.success).toHaveBeenCalledWith('템플릿이 생성되었습니다.');
      expect(result.current.templates.some((t) => t.title === '새 템플릿')).toBe(true);
    });

    it('템플릿 생성 실패 시 에러 토스트를 표시하고 예외를 던진다', async () => {
      mockGetTemplates.mockResolvedValue([]);
      mockCreateTemplate.mockRejectedValue(new Error('Create failed'));

      const { result } = customRenderHook(() => useTemplates());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const createDto: CreateTemplateDto = {
        title: '새 템플릿',
        slotSchema: createMockSlotSchema(),
      };

      await expect(
        act(async () => {
          await result.current.addTemplate(createDto);
        }),
      ).rejects.toThrow('Create failed');

      expect(toast.error).toHaveBeenCalledWith('템플릿 생성에 실패했습니다.');
    });
  });

  describe('템플릿 수정', () => {
    it('템플릿 수정에 성공하면 목록이 업데이트되고 성공 토스트를 표시한다', async () => {
      const existingTemplate = createMockTemplate({ id: 1, title: '기존 템플릿' });
      const updatedTemplate = createMockTemplate({ id: 1, title: '수정된 템플릿' });
      mockGetTemplates.mockResolvedValue([existingTemplate]);
      mockUpdateTemplate.mockResolvedValue(updatedTemplate);

      const { result } = customRenderHook(() => useTemplates());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const updateDto: CreateTemplateDto = {
        title: '수정된 템플릿',
        slotSchema: createMockSlotSchema(),
      };

      await act(async () => {
        await result.current.editTemplate(1, updateDto);
      });

      expect(mockUpdateTemplate).toHaveBeenCalledWith(1, updateDto);
      expect(toast.success).toHaveBeenCalledWith('템플릿이 수정되었습니다.');
      expect(result.current.templates[0].title).toBe('수정된 템플릿');
    });

    it('존재하지 않는 템플릿 수정 시 예외를 던진다', async () => {
      mockGetTemplates.mockResolvedValue([]);

      const { result } = customRenderHook(() => useTemplates());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.editTemplate(999, {
            title: '수정',
            slotSchema: createMockSlotSchema(),
          });
        }),
      ).rejects.toThrow('Template not found');
    });

    it('템플릿 수정 실패 시 에러 토스트를 표시하고 예외를 던진다', async () => {
      const existingTemplate = createMockTemplate({ id: 1 });
      mockGetTemplates.mockResolvedValue([existingTemplate]);
      mockUpdateTemplate.mockRejectedValue(new Error('Update failed'));

      const { result } = customRenderHook(() => useTemplates());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.editTemplate(1, {
            title: '수정',
            slotSchema: createMockSlotSchema(),
          });
        }),
      ).rejects.toThrow('Update failed');

      expect(toast.error).toHaveBeenCalledWith('템플릿 수정에 실패했습니다.');
    });
  });

  describe('템플릿 삭제', () => {
    it('확인 후 템플릿 삭제에 성공하면 목록에서 제거되고 성공 토스트를 표시한다', async () => {
      const template = createMockTemplate({ id: 1 });
      mockGetTemplates.mockResolvedValue([template]);
      mockDeleteTemplate.mockResolvedValue(template);
      mockConfirm.mockReturnValue(true);

      const { result } = customRenderHook(() => useTemplates());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let deleteResult: boolean = false;
      await act(async () => {
        deleteResult = await result.current.removeTemplate(1);
      });

      expect(mockConfirm).toHaveBeenCalledWith('정말 삭제하시겠습니까?');
      expect(mockDeleteTemplate).toHaveBeenCalledWith(1);
      expect(toast.success).toHaveBeenCalledWith('템플릿이 삭제되었습니다.');
      expect(deleteResult).toBe(true);
      expect(result.current.templates).toHaveLength(0);
    });

    it('확인 취소 시 삭제하지 않고 false를 반환한다', async () => {
      const template = createMockTemplate({ id: 1 });
      mockGetTemplates.mockResolvedValue([template]);
      mockConfirm.mockReturnValue(false);

      const { result } = customRenderHook(() => useTemplates());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let deleteResult: boolean = true;
      await act(async () => {
        deleteResult = (await result.current.removeTemplate(1)) as boolean;
      });

      expect(mockConfirm).toHaveBeenCalled();
      expect(mockDeleteTemplate).not.toHaveBeenCalled();
      expect(deleteResult).toBe(false);
      expect(result.current.templates).toHaveLength(1);
    });

    it('템플릿 삭제 실패 시 에러 토스트를 표시하고 false를 반환한다', async () => {
      const template = createMockTemplate({ id: 1 });
      mockGetTemplates.mockResolvedValue([template]);
      mockDeleteTemplate.mockRejectedValue(new Error('Delete failed'));
      mockConfirm.mockReturnValue(true);

      const { result } = customRenderHook(() => useTemplates());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let deleteResult: boolean = true;
      await act(async () => {
        deleteResult = await result.current.removeTemplate(1);
      });

      expect(toast.error).toHaveBeenCalledWith('템플릿 삭제에 실패했습니다.');
      expect(deleteResult).toBe(false);
    });
  });

  describe('낙관적 업데이트', () => {
    it('삭제 작업이 완료되면 목록이 즉시 업데이트된다', async () => {
      const template1 = createMockTemplate({ id: 1, title: '템플릿 1' });
      const template2 = createMockTemplate({ id: 2, title: '템플릿 2' });
      mockGetTemplates.mockResolvedValue([template1, template2]);
      mockDeleteTemplate.mockResolvedValue(template1);
      mockConfirm.mockReturnValue(true);

      const { result } = customRenderHook(() => useTemplates());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.templates).toHaveLength(2);

      await act(async () => {
        await result.current.removeTemplate(1);
      });

      // 삭제 후 목록이 업데이트됨
      expect(result.current.templates).toHaveLength(1);
      expect(result.current.templates[0].id).toBe(2);
    });

    it('수정 작업이 완료되면 목록이 즉시 업데이트된다', async () => {
      const template = createMockTemplate({ id: 1, title: '원본 템플릿' });
      const updatedTemplate = createMockTemplate({ id: 1, title: '수정된 템플릿' });
      mockGetTemplates.mockResolvedValue([template]);
      mockUpdateTemplate.mockResolvedValue(updatedTemplate);

      const { result } = customRenderHook(() => useTemplates());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.templates[0].title).toBe('원본 템플릿');

      await act(async () => {
        await result.current.editTemplate(1, {
          title: '수정된 템플릿',
          slotSchema: createMockSlotSchema(),
        });
      });

      // 수정 후 목록이 업데이트됨
      expect(result.current.templates[0].title).toBe('수정된 템플릿');
    });
  });
});
