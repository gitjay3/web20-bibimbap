local maxCapacity = tonumber(ARGV[1])
local currentCount = tonumber(ARGV[2])
local remaining = maxCapacity - currentCount

redis.call('SET', KEYS[1], remaining)

return remaining

-- 재고 초기화 스크립트
-- KEYS[1]: 슬롯 재고 키
-- ARGV[1]: 최대 정원
-- ARGV[2]: 현재 예약 수
-- 반환: 설정된 남은 재고