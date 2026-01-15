import Button from '@/components/Button';
import PageHeader from '@/components/PageHeader';
import PlusIcon from '@/assets/icons/plus.svg?react';
import TemplateList from './components/TemplateList';

function ManageTemplate() {
  return (
    <div className='flex flex-col gap-8'>
      <PageHeader
        title="템플릿 관리"
        description="이벤트 생성 시 입력받을 정보(필드)의 구성을 템플릿으로 관리합니다."
        action={
          <Button type="secondary">
            <PlusIcon className="h-4 w-4" />
            템플릿 생성
          </Button>
        }
      />
      <TemplateList />
    </div>
  );
}

export default ManageTemplate;
