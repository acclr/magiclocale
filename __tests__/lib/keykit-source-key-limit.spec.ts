import {
  publishSourceKeyLimit,
  sourceKeyLimitNotice,
  subscribeSourceKeyLimit,
} from '../../lib/keykit-source-key-limit';

describe('source key limit notices', () => {
  it('keeps the plan-limit message and drops the ingest prefix', () => {
    const error = Object.assign(
      new Error(
        'Keykit ingest failed (402): This project has reached the 500 source key limit on your plan.'
      ),
      { status: 402 }
    );

    expect(sourceKeyLimitNotice(error)).toBe(
      'This project has reached the 500 source key limit on your plan.'
    );
    expect(sourceKeyLimitNotice(new Error('offline'))).toBeNull();
  });

  it('replays the latest limit message to a new subscriber', () => {
    const heard: string[] = [];
    publishSourceKeyLimit('limit reached');
    const unsubscribe = subscribeSourceKeyLimit((message) => {
      heard.push(message);
    });

    expect(heard).toEqual(['limit reached']);
    unsubscribe();
  });
});