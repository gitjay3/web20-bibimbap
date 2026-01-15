local current = tonumber(redis.call('GET', KEYS[1]))

if current and current > 0 then
    redis.call('DECR', KEYS[1])
    return 1
end

return 0

-- 재고 차감 스크립트
-- KEYS[1]: 슬롯 재고 키 (예: "slot:123:stock")
-- 반환: 1(성공), 0(재고 부족)