import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  Counter,
  Histogram,
  Gauge,
  register,
  CounterConfiguration,
  HistogramConfiguration,
  GaugeConfiguration,
} from 'prom-client';

/** 앱 prefix - Prometheus 베스트 프랙티스 */
const APP_PREFIX = 'bookstcamp';

@Injectable()
export class MetricsService implements OnModuleInit {
  // ========================================
  // 1. 예약 처리 메트릭 (핵심)
  // ========================================

  /** 예약 요청 총 수 (상태별) */
  readonly reservationsTotal: Counter<'status' | 'slot_id'>;

  /** 예약 API 응답 시간 */
  readonly reservationLatency: Histogram<'operation'>;

  /** 큐에서 예약 처리 시간 */
  readonly reservationQueueProcessing: Histogram<'status'>;

  // ========================================
  // 2. 동시성/충돌 메트릭 (중요!)
  // ========================================

  /** 낙관적 락 충돌 수 */
  readonly optimisticLockConflicts: Counter<'operation'>;

  /** 중복 예약 시도 수 */
  readonly duplicateReservations: Counter<string>;

  /** 동시 예약 요청 수 (슬롯별 현재 처리 중) */
  readonly concurrentReservations: Gauge<'slot_id'>;

  // ========================================
  // 3. Redis 재고 연산 메트릭
  // ========================================

  /** Redis 재고 차감 성공 */
  readonly redisStockDecrementSuccess: Counter<'slot_id'>;

  /** Redis 재고 차감 실패 (slot full) */
  readonly redisStockDecrementFailed: Counter<'slot_id'>;

  /** Redis 재고 복구 (취소/실패 시) */
  readonly redisStockIncrement: Counter<'slot_id' | 'reason'>;

  /** Redis Lua 스크립트 실행 시간 */
  readonly redisOperationDuration: Histogram<'operation'>;

  // ========================================
  // 4. 대기열 메트릭
  // ========================================

  /** BullMQ 큐 깊이 */
  readonly queueDepth: Gauge<'queue'>;

  /** 이벤트별 대기 인원 */
  readonly queueWaitingUsers: Gauge<'event_id'>;

  /** 토큰 발급 수 */
  readonly tokensIssued: Counter<'event_id'>;

  /** 대기열 진입 수 */
  readonly queueEntries: Counter<'event_id' | 'is_new'>;

  /** BullMQ 작업 완료/실패 */
  readonly bullmqJobs: Counter<'queue' | 'status'>;

  // ========================================
  // 5. 슬롯 상태 메트릭 (비즈니스)
  // ========================================

  /** 슬롯별 현재 재고 */
  readonly slotCurrentStock: Gauge<'slot_id' | 'event_id'>;

  /** 슬롯별 점유율 (0-1) */
  readonly slotCapacityRatio: Gauge<'slot_id' | 'event_id'>;

  /** 매진된 슬롯 수 */
  readonly slotsFullyBooked: Gauge<string>;

  // ========================================
  // 6. SRE Golden Signals
  // ========================================

  /** HTTP 요청 총 수 */
  readonly httpRequestsTotal: Counter<'method' | 'route' | 'status'>;

  /** HTTP 요청 응답 시간 */
  readonly httpRequestDuration: Histogram<'method' | 'route'>;

  constructor() {
    // 1. 예약 처리 메트릭
    this.reservationsTotal = this.getOrCreateCounter({
      name: `${APP_PREFIX}_reservations_total`,
      help: 'Total number of reservation requests by status',
      labelNames: ['status', 'slot_id'],
    });

    this.reservationLatency = this.getOrCreateHistogram({
      name: `${APP_PREFIX}_reservation_latency_seconds`,
      help: 'Reservation API response latency in seconds',
      labelNames: ['operation'],
      buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
    });

    this.reservationQueueProcessing = this.getOrCreateHistogram({
      name: `${APP_PREFIX}_reservation_queue_processing_seconds`,
      help: 'Time spent processing reservation in BullMQ queue',
      labelNames: ['status'],
      buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    });

    // 2. 동시성/충돌 메트릭
    this.optimisticLockConflicts = this.getOrCreateCounter({
      name: `${APP_PREFIX}_optimistic_lock_conflicts_total`,
      help: 'Total number of optimistic lock conflicts',
      labelNames: ['operation'],
    });

    this.duplicateReservations = this.getOrCreateCounter({
      name: `${APP_PREFIX}_duplicate_reservation_attempts_total`,
      help: 'Total number of duplicate reservation attempts',
      labelNames: [],
    });

    this.concurrentReservations = this.getOrCreateGauge({
      name: `${APP_PREFIX}_concurrent_reservations`,
      help: 'Number of reservations currently being processed',
      labelNames: ['slot_id'],
    });

    // 3. Redis 재고 연산 메트릭
    this.redisStockDecrementSuccess = this.getOrCreateCounter({
      name: `${APP_PREFIX}_redis_stock_decrement_success_total`,
      help: 'Total successful Redis stock decrements',
      labelNames: ['slot_id'],
    });

    this.redisStockDecrementFailed = this.getOrCreateCounter({
      name: `${APP_PREFIX}_redis_stock_decrement_failed_total`,
      help: 'Total failed Redis stock decrements (slot full)',
      labelNames: ['slot_id'],
    });

    this.redisStockIncrement = this.getOrCreateCounter({
      name: `${APP_PREFIX}_redis_stock_increment_total`,
      help: 'Total Redis stock increments (cancellation/failure recovery)',
      labelNames: ['slot_id', 'reason'],
    });

    this.redisOperationDuration = this.getOrCreateHistogram({
      name: `${APP_PREFIX}_redis_operation_duration_seconds`,
      help: 'Redis Lua script execution duration',
      labelNames: ['operation'],
      buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25],
    });

    // 4. 대기열 메트릭
    this.queueDepth = this.getOrCreateGauge({
      name: `${APP_PREFIX}_bullmq_queue_depth`,
      help: 'Current depth of BullMQ queues',
      labelNames: ['queue'],
    });

    this.queueWaitingUsers = this.getOrCreateGauge({
      name: `${APP_PREFIX}_queue_waiting_users`,
      help: 'Number of users waiting in queue per event',
      labelNames: ['event_id'],
    });

    this.tokensIssued = this.getOrCreateCounter({
      name: `${APP_PREFIX}_queue_tokens_issued_total`,
      help: 'Total number of access tokens issued',
      labelNames: ['event_id'],
    });

    this.queueEntries = this.getOrCreateCounter({
      name: `${APP_PREFIX}_queue_entries_total`,
      help: 'Total queue entries',
      labelNames: ['event_id', 'is_new'],
    });

    this.bullmqJobs = this.getOrCreateCounter({
      name: `${APP_PREFIX}_bullmq_jobs_total`,
      help: 'Total BullMQ jobs by status',
      labelNames: ['queue', 'status'],
    });

    // 5. 슬롯 상태 메트릭
    this.slotCurrentStock = this.getOrCreateGauge({
      name: `${APP_PREFIX}_slot_current_stock`,
      help: 'Current available stock for each slot',
      labelNames: ['slot_id', 'event_id'],
    });

    this.slotCapacityRatio = this.getOrCreateGauge({
      name: `${APP_PREFIX}_slot_capacity_ratio`,
      help: 'Slot occupancy ratio (0-1)',
      labelNames: ['slot_id', 'event_id'],
    });

    // Gauge에는 _total 접미사 사용 안 함 (Prometheus 컨벤션)
    this.slotsFullyBooked = this.getOrCreateGauge({
      name: `${APP_PREFIX}_slots_fully_booked`,
      help: 'Number of fully booked slots',
      labelNames: [],
    });

    // 6. SRE Golden Signals
    this.httpRequestsTotal = this.getOrCreateCounter({
      name: `${APP_PREFIX}_http_requests_total`,
      help: 'Total HTTP requests',
      labelNames: ['method', 'route', 'status'],
    });

    this.httpRequestDuration = this.getOrCreateHistogram({
      name: `${APP_PREFIX}_http_request_duration_seconds`,
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route'],
      buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    });
  }

  onModuleInit() {
    // 메트릭 초기화 완료 로그 (선택사항)
  }

  // ========================================
  // Private: 중복 등록 방지 헬퍼
  // ========================================

  private getOrCreateCounter<T extends string>(
    config: CounterConfiguration<T>,
  ): Counter<T> {
    const existing = register.getSingleMetric(config.name);
    if (existing !== undefined && existing !== null) {
      const typed = existing as unknown as Counter<T>;
      return typed;
    }
    const created = new Counter(config);
    return created;
  }

  private getOrCreateHistogram<T extends string>(
    config: HistogramConfiguration<T>,
  ): Histogram<T> {
    const existing = register.getSingleMetric(config.name);
    if (existing !== undefined && existing !== null) {
      const typed = existing as unknown as Histogram<T>;
      return typed;
    }
    const created = new Histogram(config);
    return created;
  }

  private getOrCreateGauge<T extends string>(
    config: GaugeConfiguration<T>,
  ): Gauge<T> {
    const existing = register.getSingleMetric(config.name);
    if (existing !== undefined && existing !== null) {
      const typed = existing as unknown as Gauge<T>;
      return typed;
    }
    const created = new Gauge(config);
    return created;
  }

  // ========================================
  // Private: 라벨 정규화
  // ========================================

  /**
   * HTTP path에서 동적 파라미터를 정규화
   * /events/123 -> /events/:id
   * /reservations/456/cancel -> /reservations/:id/cancel
   */
  private normalizePath(path: string): string {
    return path
      .replace(/\/\d+/g, '/:id') // 숫자 ID를 :id로
      .replace(/\/[a-f0-9-]{36}/gi, '/:uuid'); // UUID를 :uuid로
  }

  // ========================================
  // Helper Methods
  // ========================================

  /** 예약 요청 기록 */
  recordReservation(
    slotId: number,
    status: 'pending' | 'confirmed' | 'cancelled' | 'failed' | 'slot_full',
  ) {
    this.reservationsTotal.inc({ status, slot_id: String(slotId) });
  }

  /** Redis 재고 차감 결과 기록 */
  recordStockDecrement(slotId: number, success: boolean, durationMs: number) {
    if (success) {
      this.redisStockDecrementSuccess.inc({ slot_id: String(slotId) });
    } else {
      this.redisStockDecrementFailed.inc({ slot_id: String(slotId) });
    }
    this.redisOperationDuration.observe(
      { operation: 'decrement' },
      durationMs / 1000,
    );
  }

  /** Redis 재고 복구 기록 */
  recordStockIncrement(
    slotId: number,
    reason: 'cancellation' | 'failure_recovery',
    durationMs: number,
  ) {
    this.redisStockIncrement.inc({ slot_id: String(slotId), reason });
    this.redisOperationDuration.observe(
      { operation: 'increment' },
      durationMs / 1000,
    );
  }

  /** 낙관적 락 충돌 기록 */
  recordOptimisticLockConflict(operation: 'reservation' | 'cancellation') {
    this.optimisticLockConflicts.inc({ operation });
  }

  /** 큐 처리 완료 기록 */
  recordQueueJobComplete(
    queue: string,
    status: 'completed' | 'failed',
    durationMs: number,
  ) {
    this.bullmqJobs.inc({ queue, status });
    this.reservationQueueProcessing.observe({ status }, durationMs / 1000);
  }

  /** 슬롯 상태 업데이트 */
  updateSlotStatus(
    slotId: number,
    eventId: number,
    currentStock: number,
    maxCapacity: number,
  ) {
    this.slotCurrentStock.set(
      { slot_id: String(slotId), event_id: String(eventId) },
      currentStock,
    );
    this.slotCapacityRatio.set(
      { slot_id: String(slotId), event_id: String(eventId) },
      maxCapacity > 0 ? (maxCapacity - currentStock) / maxCapacity : 0,
    );
  }

  /** 대기열 상태 업데이트 */
  updateQueueStatus(eventId: number, waitingCount: number) {
    this.queueWaitingUsers.set({ event_id: String(eventId) }, waitingCount);
  }

  /** 토큰 발급 기록 */
  recordTokenIssued(eventId: number) {
    this.tokensIssued.inc({ event_id: String(eventId) });
  }

  /** 대기열 진입 기록 */
  recordQueueEntry(eventId: number, isNew: boolean) {
    this.queueEntries.inc({
      event_id: String(eventId),
      is_new: String(isNew),
    });
  }

  /** HTTP 요청 기록 (인터셉터에서 사용) */
  recordHttpRequest(
    method: string,
    path: string,
    status: number,
    durationMs: number,
  ) {
    const normalizedRoute = this.normalizePath(path);
    this.httpRequestsTotal.inc({
      method,
      route: normalizedRoute,
      status: String(status),
    });
    this.httpRequestDuration.observe(
      { method, route: normalizedRoute },
      durationMs / 1000,
    );
  }
}
