import { useState } from 'react';

type AsyncActionCallbacks<Args extends unknown[], Result> = {
  onSuccess?: (result: Result, ...args: Args) => void;
  onError?: (error: unknown) => void;
};

export default function useAsyncAction<Args extends unknown[], Result>(
  action: (...args: Args) => Promise<Result>,
  { onSuccess, onError }: AsyncActionCallbacks<Args, Result> = {}
) {
  const [isRunning, setIsRunning] = useState(false);

  const run = async (...args: Args): Promise<Result | undefined> => {
    setIsRunning(true);
    try {
      const result = await action(...args);
      onSuccess?.(result, ...args);
      return result;
    } catch (error) {
      onError?.(error);
      return undefined;
    } finally {
      setIsRunning(false);
    }
  };

  return { run, isRunning };
}
