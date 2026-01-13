function ReservationDisabled() {
  return (
    <div className="border-neutral-border-default fixed bottom-0 left-0 right-0 border-t bg-white py-4">
      <div className="mx-auto w-full max-w-3xl px-4">
        <div className="bg-neutral-surface-default text-gray-300 text-16 w-full rounded-lg py-4 text-center font-bold">
          예약 기간이 아닙니다
        </div>
      </div>
    </div>
  );
}

export default ReservationDisabled;
