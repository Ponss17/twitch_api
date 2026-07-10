/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

export const kv = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    incr: jest.fn().mockResolvedValue(1),
    expire: jest.fn().mockResolvedValue(1),
    hset: jest.fn(),
    hget: jest.fn(),
    hgetall: jest.fn(),
    hdel: jest.fn(),
    sadd: jest.fn(),
    srem: jest.fn(),
    smembers: jest.fn(),
    sismember: jest.fn(),
    lpush: jest.fn(),
    ltrim: jest.fn(),
    lrange: jest.fn(),
    hincrby: jest.fn(),
    exists: jest.fn().mockResolvedValue(0),
    keys: jest.fn().mockResolvedValue([]),
    pipeline: jest.fn().mockReturnValue({
        incr: jest.fn().mockReturnThis(),
        expire: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([1, 1])
    })
};
