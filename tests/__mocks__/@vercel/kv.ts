export const kv = {
    hset: jest.fn(),
    hget: jest.fn(),
    hgetall: jest.fn(),
    hdel: jest.fn(),
    del: jest.fn(),
    sadd: jest.fn(),
    srem: jest.fn(),
    smembers: jest.fn(),
    sismember: jest.fn(),
    lpush: jest.fn(),
    ltrim: jest.fn(),
    lrange: jest.fn(),
    hincrby: jest.fn(),
    keys: jest.fn().mockResolvedValue([])
};
