interface PageMetaProps {
  title?: string;
  description?: string;
}

export default function PageMeta({ title, description }: PageMetaProps) {
  const fullTitle = title ? `${title} | Bookstcamp` : 'Bookstcamp';
  const defaultDescription = description || '부스트캠프 내의 예약이 필요한 이벤트들을 한 곳에서 관리하는 서비스';

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={defaultDescription} />
    </>
  );
}
