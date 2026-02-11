# Bookstcamp

<div align="center">

**부스트캠프 내 멘토링·특강·시니어 리뷰 등 선착순 예약을 통합 관리하는 서비스**

2025.12 - 2026.02 · 4인 팀 · 프론트엔드, 백엔드, 인프라/배포

[원본 레포지토리](https://github.com/boostcampwm2025/web20-bibimbap)

</div>

> 현재 서비스는 운영 종료 상태입니다.

<br>

## 담당 역할

### 인프라/배포

- GitHub Actions CI/CD + Docker 롤링 업데이트 무중단 배포 ([#80](https://github.com/boostcampwm2025/web20-bibimbap/pull/80), [#196](https://github.com/boostcampwm2025/web20-bibimbap/pull/196))
- Terraform으로 NCP 인프라 + 모니터링 서버 구성 (Prometheus, Grafana) ([#178](https://github.com/boostcampwm2025/web20-bibimbap/pull/178))
- k6 부하 테스트 환경 구축 및 병목 발견 ([#190](https://github.com/boostcampwm2025/web20-bibimbap/pull/190))
- 도메인(SSL) 적용, 스테이징 서버 구성 ([#117](https://github.com/boostcampwm2025/web20-bibimbap/pull/117), [#219](https://github.com/boostcampwm2025/web20-bibimbap/pull/219))
- Vitest + Jest 테스트 환경 구축, CI 통합 ([#109](https://github.com/boostcampwm2025/web20-bibimbap/pull/109))

### 백엔드

- 이벤트 목록 조회 API + FE/BE 연결, 필터링 ([#26](https://github.com/boostcampwm2025/web20-bibimbap/pull/26))
- 이벤트 템플릿 CRUD API ([#160](https://github.com/boostcampwm2025/web20-bibimbap/pull/160))
- Rate Limiting: IP 기반에서 유저 ID 기반으로 전환, 엔드포인트별 적용 ([#214](https://github.com/boostcampwm2025/web20-bibimbap/pull/214), [#224](https://github.com/boostcampwm2025/web20-bibimbap/pull/224), [#238](https://github.com/boostcampwm2025/web20-bibimbap/pull/238))
- SSH Brute Force 보안 대응 (서버 운영)

### 프론트엔드

- 이벤트 목록 UI ([#25](https://github.com/boostcampwm2025/web20-bibimbap/pull/25))
- 예약 상세, 마이페이지, 운영진 템플릿 관리 UI ([#98](https://github.com/boostcampwm2025/web20-bibimbap/pull/98), [#127](https://github.com/boostcampwm2025/web20-bibimbap/pull/127), [#164](https://github.com/boostcampwm2025/web20-bibimbap/pull/164))
- 브라우저 호환성 + 모바일 반응형 ([#230](https://github.com/boostcampwm2025/web20-bibimbap/pull/230))

<br>

## 기술 스택

### Frontend

![Frontend Skills](https://skillicons.dev/icons?i=react,typescript,vite,tailwind)

### Backend & Database

![Backend Skills](https://skillicons.dev/icons?i=nestjs,prisma,postgresql,redis)

### Infrastructure

![Infrastructure Skills](https://skillicons.dev/icons?i=docker,nginx,githubactions,terraform,prometheus,grafana)
![Naver Cloud](https://img.shields.io/badge/Naver%20Cloud-03C75A?style=for-the-badge&logo=naver&logoColor=white)

<br>

## 아키텍처

### 시스템 구조

<p align="center">
  <img width="1000" alt="Bookstcamp 아키텍처4" src="https://github.com/user-attachments/assets/7c1cf1f9-c92b-4ac3-972c-ac698d47ebfe" />
</p>

### ERD


<p align="center">
  <img src="https://raw.githubusercontent.com/wiki/boostcampwm2025/web20-bibimbap/diagrams/erd-v4.svg" width="1000">
</p>

<br><br>

## 데모
### 캠퍼 기능
#### 개인 이벤트 예약
https://github.com/user-attachments/assets/7cb8cab8-2549-4aeb-8344-6a8c5143350f

<br>

#### 단체 이벤트 예약
https://github.com/user-attachments/assets/745b7a3c-27a3-484b-a385-aefcf131b9bc

<br>

#### 예약 취소
https://github.com/user-attachments/assets/86f1309b-a76a-4229-8af6-4ee8391b5108

<br>

### 운영진 기능
#### 개인 이벤트 확인
https://github.com/user-attachments/assets/aa52d154-ed56-4897-a903-8331625c2761

<br>

#### 단체 이벤트 확인
https://github.com/user-attachments/assets/eb924f97-e24f-481b-ac0f-b9882bc1f0aa

<br>

#### 이벤트 생성
https://github.com/user-attachments/assets/a993114d-2c3b-4101-be31-cf37138773a1

<br>

#### 나머지 모달 기능
https://github.com/user-attachments/assets/ea233148-8f6b-4db8-baeb-48f639a44641

<br>

## 기술적 도전

### 1. 무중단 배포 파이프라인 구축

기존에는 `docker compose down/up`으로 배포할 때마다 20~30초 정도 서비스가 중단되었습니다. 블루-그린 방식도 고려했지만 NCP 20만 크레딧이라는 제한 내에서 서버 2대를 유지하는 비용이 부담되어, 교체 순간에만 컨테이너 2개가 실행되는 **롤링 업데이트** 방식을 선택했습니다.

새 컨테이너가 준비되기 전에 기존 컨테이너가 종료되면 요청이 유실되는 문제가 있었는데, 새 컨테이너가 정상 동작하는 것을 확인한 뒤 기존 컨테이너에 drain 파일을 생성해 의도적으로 healthcheck를 실패시켰습니다. Docker 내부 DNS는 healthy 컨테이너에만 트래픽을 전달하기 때문에 기존 컨테이너로는 새 요청이 들어가지 않게 되고, 처리 중인 요청까지 완료된 후 안전하게 종료하는 방식으로 무중단 배포를 구축했습니다.

#### 핵심 코드

```bash
# 기존 컨테이너 드레이닝 - drain 파일 생성으로 healthcheck 실패 유도
for old in $old_containers; do
    docker exec "$old" touch /tmp/drain 2>/dev/null || true
done

# nginx가 unhealthy 컨테이너에 트래픽 안 보내도록 대기
sleep 10

# 기존 컨테이너 안전하게 종료
for old in $old_containers; do
    docker stop "$old" 2>/dev/null || true
    docker rm "$old" 2>/dev/null || true
done
```

<br>

### 2. 모니터링 구성 및 부하 테스트

선착순 예약 특성상 오픈 시점에 트래픽이 한꺼번에 몰리기 때문에 배포 전에 병목을 파악할 필요가 있었습니다. Terraform으로 별도 모니터링 서버를 구성하고, Prometheus로 메트릭을 수집하고 Grafana 대시보드로 시각화하여 서버 상태를 모니터링 할 수 있도록 설계했습니다.

<p align="center">
  <img width="1000" alt="image" src="https://github.com/user-attachments/assets/b6503195-c532-45bc-8b20-85224e4b4460" />
</p>

k6로 성공/정원초과/중복/서버에러를 구분하는 커스텀 메트릭을 만들고, 200VU부터 10,000VU까지 단계별 시나리오를 실행했습니다. 그 결과 DB Full Table Scan과 Nginx 커넥션 포화 같은 병목을 사전에 발견할 수 있었습니다. 다만 로컬 Docker 환경에서만 진행하여 실제 서버 스펙과 네트워크 조건을 반영하지 못한 점이 아쉬움으로 남습니다. 프로덕션과 동일한 환경에서 테스트하기 위해 스테이징 서버 구축까지는 했으나, 일정 내에 실제 테스트까지는 진행하지 못했습니다.

#### 발견한 병목과 최적화

| 병목                | 원인                                     | 시도                                         | PR                                                                 |
| ------------------- | ---------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------ |
| DB Full Table Scan  | 인덱스 없이 O(n) 조회                    | 복합 인덱스 추가 + N+1 쿼리 통합             | [#217](https://github.com/boostcampwm2025/web20-bibimbap/pull/217) |
| Nginx 커넥션 포화   | 기본 설정으로 stress 시 HTTP 실패율 ~80% | `worker_connections` 상향, `keepalive` 설정  | [#216](https://github.com/boostcampwm2025/web20-bibimbap/pull/216) |
| 동시 접속 제어 없음 | 활성 토큰 무제한 발급으로 서버 과부하    | 활성 토큰 100개 제한 + 대기열 순번 대기 구조 | [#216](https://github.com/boostcampwm2025/web20-bibimbap/pull/216) |
| Redis RTT 누적      | 대기열 진입 시 Redis 5회 왕복            | `pipeline()`으로 배치 실행 (5회 → 1회)       | [#228](https://github.com/boostcampwm2025/web20-bibimbap/pull/228) |
| JWT 인증 DB 조회    | 모든 API 요청마다 DB 쿼리 발생           | JWT payload만 사용, DB 조회 제거             | [#231](https://github.com/boostcampwm2025/web20-bibimbap/pull/231) |
| 폴링 API 과다 호출  | 1초마다 2개 API 호출 (140회/분)          | 통합 API로 병합 (80회/분, -43%)              | [#231](https://github.com/boostcampwm2025/web20-bibimbap/pull/231) |
| 폴링 DB 부하        | 폴링마다 DB 쿼리 2~3회                   | Redis 캐시 적용 (캐시 HIT 시 0회)            | [#237](https://github.com/boostcampwm2025/web20-bibimbap/pull/237) |

#### 최적화 시도 전후 비교 (Competition 200 VU)

| 지표          | 베이스라인 (02-02) | 최적화 후 (02-05) | 변화   |
| ------------- | ------------------ | ----------------- | ------ |
| 응답시간 p95  | 127ms              | **7ms**           | -120ms |
| 응답시간 평균 | 65ms               | **3ms**           | -62ms  |
| RPS           | 471                | **591**           | +120   |
| Apdex         | 0.999              | **1.000**         | -      |
| 예약 성공     | 5명 (정원 5)       | 5명 (정원 5)      | -      |
| 서버 에러     | 0                  | 0                 | -      |

#### 최적화 시도 전후 비교 (Stress 5,000 VU)

| 지표         | 베이스라인 (02-02) | 최적화 후 (02-05) | 변화                    |
| ------------ | ------------------ | ----------------- | ----------------------- |
| RPS          | 3,037              | **828**           | -2,209 (동시 요청 제어) |
| 총 반복      | 261,569            | **65,312**        | -196,257 (대기열 제한)  |
| 응답시간 p50 | 44ms               | **470ms**         | +426ms (대기열 대기)    |
| 연결 대기    | 54ms               | **0ms**           | -54ms (Nginx 병목 해소) |
| 서버 에러    | 0                  | **769**           | +769                    |
| Apdex        | 0.790              | **0.571**         | -0.219                  |
| 예약 성공    | 5명                | 5명               | -                       |

> **얻은 것**
>
> - Nginx 커넥션 포화 해소 (연결 대기 54ms → 0ms)
> - 예약 정합성 유지 (5/5)
>
> **잃은 것**
>
> - 처리량 73% 감소 (RPS 3,037 → 828)
> - 총 반복 75% 감소 (261,569 → 65,312)
> - 서버 에러 769건 새로 발생

<br>

### 3. SSH Brute Force 공격 탐지 및 대응

운영 중 NCP Basic Security 알림으로 두 서버에 각각 1,700~1,800회의 SSH 로그인 시도가 감지되었습니다. 로그를 분석한 결과 여러 해외 IP에서 root, admin, ethereum 같은 계정명으로 무차별 대입 공격이 들어오고 있었습니다.

원인은 Terraform ACG 설정에서 SSH 22번 포트를 `0.0.0.0/0`으로 열어둔 것과 비밀번호 인증이 활성화되어 있던 점이었습니다. 즉시 SSH Key 인증만 허용하도록 변경하고, fail2ban으로 반복 실패 IP를 자동 차단하도록 설정했습니다. 침해 여부를 조사한 결과 비밀번호 로그인 성공 기록은 없었고, 모든 접속이 SSH Key를 통한 것으로 확인되었습니다.

<br>

### 4. 유저 ID 기반 Rate Limiting 도입

처음에는 IP 기반으로 Rate Limiting을 적용했는데, VPN을 사용하면 IP를 바꿔서 우회할 수 있는 문제가 있었습니다. 그래서 CustomThrottlerGuard에서 유저 ID를 추적 키로 사용하도록 재설계했습니다.

또한 전역으로 Throttler를 적용하니 일반 페이지 탐색이나 폴링에도 429 에러가 발생해서, 로그인과 예약 엔드포인트에만 각각 다른 제한값을 설정하는 방식으로 바꿨습니다.

#### 핵심 코드

```typescript
// CustomThrottlerGuard - 유저 ID 기반 추적
private getTrackerWithContext(req: RequestWithUser, context: ExecutionContext): string {
  const userId = req.user?.id;
  const ip = req.ip ?? 'unknown';

  // 미인증 사용자는 IP 기반
  if (!userId) {
    return `ip:${ip}`;
  }

  // 인증된 사용자는 유저 ID + 리소스 단위로 추적
  switch (keyType) {
    case 'user:event':
      return `user:${userId}:event:${eventId}`;
    case 'user:slot':
      return `user:${userId}:slot:${slotId}`;
    default:
      return `user:${userId}`;
  }
}
```

<br>

## 설치 및 실행

> Node.js 18+, pnpm 8+, Docker 필요

```bash
git clone https://github.com/boostcampwm2025/web20-bibimbap
cd web20-bibimbap
pnpm install
pnpm docker:local:up
pnpm db:generate:local
pnpm db:seed:local
```

- 로컬 확인: http://localhost
- API 문서(Swagger): http://localhost/api-docs
