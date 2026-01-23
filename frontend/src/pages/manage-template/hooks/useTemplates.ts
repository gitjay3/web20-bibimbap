import { useCallback, useEffect, useOptimistic, useState, startTransition } from 'react';
import { toast } from 'sonner';
import type { CreateTemplateDto, Template } from '@/types/template';
import { getTemplates, createTemplate, updateTemplate, deleteTemplate } from '@/api/template';

type OptimisticAction =
  | { type: 'add'; template: Template }
  | { type: 'update'; template: Template }
  | { type: 'delete'; id: number };

function useTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [optimisticTemplates, addOptimistic] = useOptimistic(
    templates,
    (state, action: OptimisticAction) => {
      switch (action.type) {
        case 'add':
          return [...state, action.template];
        case 'update':
          return state.map((t) => (t.id === action.template.id ? action.template : t));
        case 'delete':
          return state.filter((t) => t.id !== action.id);
        default:
          return state;
      }
    },
  );

  const fetchTemplates = useCallback(async () => {
    try {
      const data = await getTemplates();
      setTemplates(data);
    } catch {
      toast.error('템플릿 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const addTemplate = useCallback(
    async (dto: CreateTemplateDto) => {
      const optimisticTemplate: Template = {
        id: Date.now(),
        title: dto.title,
        description: dto.description ?? null,
        slotSchema: dto.slotSchema,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      startTransition(() => {
        addOptimistic({ type: 'add', template: optimisticTemplate });
      });

      try {
        const created = await createTemplate(dto);
        setTemplates((prev) => [...prev, created]);
        toast.success('템플릿이 생성되었습니다.');
        return created;
      } catch {
        toast.error('템플릿 생성에 실패했습니다.');
        throw new Error('Create failed');
      }
    },
    [addOptimistic],
  );

  const editTemplate = useCallback(
    async (id: number, dto: CreateTemplateDto) => {
      const current = templates.find((t) => t.id === id);
      if (!current) throw new Error('Template not found');

      const optimisticTemplate: Template = {
        ...current,
        ...dto,
        description: dto.description ?? null,
        updatedAt: new Date().toISOString(),
      };

      startTransition(() => {
        addOptimistic({ type: 'update', template: optimisticTemplate });
      });

      try {
        const updated = await updateTemplate(id, dto);
        setTemplates((prev) => prev.map((t) => (t.id === id ? updated : t)));
        toast.success('템플릿이 수정되었습니다.');
        return updated;
      } catch {
        toast.error('템플릿 수정에 실패했습니다.');
        throw new Error('Update failed');
      }
    },
    [addOptimistic, templates],
  );

  const removeTemplate = useCallback(
    async (id: number) => {
      // eslint-disable-next-line no-alert
      if (!window.confirm('정말 삭제하시겠습니까?')) return false;

      startTransition(() => {
        addOptimistic({ type: 'delete', id });
      });

      try {
        await deleteTemplate(id);
        setTemplates((prev) => prev.filter((t) => t.id !== id));
        toast.success('템플릿이 삭제되었습니다.');
        return true;
      } catch {
        toast.error('템플릿 삭제에 실패했습니다.');
        return false;
      }
    },
    [addOptimistic],
  );

  return {
    templates: optimisticTemplates,
    isLoading,
    addTemplate,
    editTemplate,
    removeTemplate,
  };
}

export default useTemplates;
