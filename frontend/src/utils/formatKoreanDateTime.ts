function formatKoreanDateTime(date: Date): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();

  const weekday = date.toLocaleDateString('ko-KR', {
    weekday: 'short',
  });

  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const time = `${hours}:${minutes}`;

  return `${month}. ${day}. (${weekday}) ${time}`;
}

export default formatKoreanDateTime;
