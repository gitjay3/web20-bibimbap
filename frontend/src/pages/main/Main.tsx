import PageHeader from '@/components/PageHeader';
import PageMeta from '@/components/PageMeta';
import { useAuth } from '@/store/AuthContext';
import Button from '@/components/Button';
import PlusIcon from '@/assets/icons/plus.svg?react';
import { useNavigate } from 'react-router';
import EventList from './components/EventList';

function Main() {
  const { isLoading, user } = useAuth();
  const navigate = useNavigate();

  const role = user?.role ?? 'USER';
  const isAdmin = !isLoading && role === 'ADMIN';

  const title = isAdmin ? '이벤트 관리' : '이벤트 예약';
  const description = isAdmin
    ? '부스트캠프 멤버들을 위한 멘토링과 특강을 등록하고 현황을 확인하세요.'
    : '부스트캠프 멤버들을 위한 다양한 멘토링과 특강을 확인하고 신청하세요.';

  return (
    <div className="flex flex-col gap-8">
      <PageMeta title={title} description={description} />
      <PageHeader
        title={title}
        description={description}
        action={
          isAdmin ? (
            <Button type="secondary" onClickHandler={() => navigate('events/new')}>
              <PlusIcon className="h-4 w-4" />
              이벤트 생성
            </Button>
          ) : null
        }
      />
      <EventList />
    </div>
  );
}

export default Main;
