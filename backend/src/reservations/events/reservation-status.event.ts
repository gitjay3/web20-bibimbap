export class ReservationStatusEvent {
  constructor(
    public readonly userId: string,
    public readonly reservationId: number,
    public readonly status: 'CONFIRMED' | 'CANCELLED' | 'FAILED',
    public readonly message?: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}
