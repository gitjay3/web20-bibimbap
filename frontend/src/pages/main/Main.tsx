import PageHeader from '@/components/PageHeader';
import EventList from './components/EventList';

function Main() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="이벤트 예약"
        description="부스트캠프 멤버들을 위한 다양한 멘토링과 특강을 확인하고 신청하세요."
      />
      <EventList />
    </div>
  );
}

export default Main;
