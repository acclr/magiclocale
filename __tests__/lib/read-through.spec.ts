import {
  invalidateReads,
  readThrough,
} from '../../lib/cache/read-through';

describe('readThrough', () => {
  it('calls the loader once until the key is invalidated', async () => {
    const load = jest.fn().mockResolvedValue({ n: 1 });
    const key = `test:${Date.now()}`;

    await expect(readThrough(key, load)).resolves.toEqual({ n: 1 });
    await expect(readThrough(key, load)).resolves.toEqual({ n: 1 });
    expect(load).toHaveBeenCalledTimes(1);

    invalidateReads(key);
    await expect(readThrough(key, load)).resolves.toEqual({ n: 1 });
    expect(load).toHaveBeenCalledTimes(2);
  });
});
