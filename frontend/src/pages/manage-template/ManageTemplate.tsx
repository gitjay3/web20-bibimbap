import { useReducer } from 'react';
import Button from '@/components/Button';
import PageMeta from '@/components/PageMeta';
import PageHeader from '@/components/PageHeader';
import PlusIcon from '@/assets/icons/plus.svg?react';
import type { CreateTemplateDto, Template } from '@/types/template';
import TemplateList from './components/TemplateList';
import TemplateFormModal from './components/TemplateFormModal';
import TemplateDetailModal from './components/TemplateDetailModal';
import useTemplates from './hooks/useTemplates';

type ModalState =
  | { type: 'closed' }
  | { type: 'form'; template: Template | null }
  | { type: 'detail'; template: Template };

function modalReducer(_: ModalState, action: ModalState): ModalState {
  return action;
}

function ManageTemplate() {
  const { templates, isLoading, addTemplate, editTemplate, removeTemplate } =
    useTemplates();

  const [modal, setModal] = useReducer(modalReducer, { type: 'closed' });

  const handleCreate = () => {
    setModal({ type: 'form', template: null });
  };

  const handleEdit = (template: Template) => {
    setModal({ type: 'form', template });
  };

  const handleView = (template: Template) => {
    setModal({ type: 'detail', template });
  };

  const handleCloseModal = () => {
    setModal({ type: 'closed' });
  };

  const handleSave = async (data: CreateTemplateDto) => {
    if (modal.type === 'form' && modal.template) {
      await editTemplate(modal.template.id, data);
    } else {
      await addTemplate(data);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="text-neutral-text-tertiary">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <PageMeta
        title="템플릿 관리"
        description="반복 사용되는 이벤트 템플릿을 생성하고 관리하여 운영 효율을 높이세요."
      />
      <PageHeader
        title="템플릿 관리"
        description="이벤트 생성 시 입력받을 정보(필드)의 구성을 템플릿으로 관리합니다."
        action={
          <Button type="secondary" onClickHandler={handleCreate}>
            <PlusIcon className="h-4 w-4" />
            템플릿 생성
          </Button>
        }
      />
      <TemplateList
        templates={templates}
        onEdit={handleEdit}
        onDelete={removeTemplate}
        onClick={handleView}
      />
      <TemplateFormModal
        isOpen={modal.type === 'form'}
        onClose={handleCloseModal}
        onSave={handleSave}
        template={modal.type === 'form' ? modal.template : null}
      />
      <TemplateDetailModal
        isOpen={modal.type === 'detail'}
        onClose={handleCloseModal}
        template={modal.type === 'detail' ? modal.template : null}
      />
    </div>
  );
}

export default ManageTemplate;
