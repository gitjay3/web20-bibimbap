local current = tonumber(redis.call('GET', KEYS[1])) or 0
local maxStock = tonumber(ARGV[1])

if current < maxStock then
    return redis.call('INCR', KEYS[1])
end

return current

-- 재고 복구 스크립트 (보상 트랜잭션용)
-- KEYS[1]: 슬롯 재고 키
-- ARGV[1]: 최대 재고 (초과 방지용)
-- 반환: 복구 후 재고 수량