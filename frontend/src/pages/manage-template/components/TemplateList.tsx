import type { Template } from '@/types/template';
import TemplateCard from './TemplateCard';

const mockTemplates: Template[] = [
  {
    id: 1,
    title: '시니어 리뷰어 피드백',
    slotSchema: [
      {
        label: '시작 시간',
        type: 'DATETIME',
      },
      {
        label: '리뷰어',
        type: 'TEXT',
      },
    ],
  },
  {
    id: 2,
    title: '오프라인 행사 신청',
    slotSchema: [
      {
        label: '시작 시간',
        type: 'DATETIME',
      },
      {
        label: '리뷰어',
        type: 'TEXT',
      },
    ],
  },
];

function TemplateList() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {mockTemplates.map((item) => (
        <TemplateCard key={item.id} template={item} />
      ))}
    </div>
  );
}

export default TemplateList;
