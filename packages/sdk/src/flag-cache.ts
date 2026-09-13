import { evaluateFlag, isEnabledValue } from './evaluate';
import type {
  FlagEvaluationContext,
  FlagPayload,
  FlagSnapshot,
  FlagValue,
} from './types';

export type FlagChangeListener = () => void;

export class FlagCache {
  private flags = new Map<string, FlagSnapshot>();
  private listeners = new Set<FlagChangeListener>();
  private context: FlagEvaluationContext;

  constructor(
    context: FlagEvaluationContext = {},
    initial?: FlagPayload
  ) {
    this.context = context;
    if (initial) {
      this.update(initial);
    }
  }

  update(payload: FlagPayload): void {
    this.flags = new Map(payload.flags.map((flag) => [flag.key, flag]));
    this.emit();
  }

  identify(context: FlagEvaluationContext): void {
    this.context = context;
    this.emit();
  }

  getContext(): FlagEvaluationContext {
    return this.context;
  }

  getValue(key: string, fallback: FlagValue = null): FlagValue {
    return evaluateFlag(this.flags.get(key) ?? null, this.context, fallback)
      .value;
  }

  isEnabled(key: string, fallback = false): boolean {
    return isEnabledValue(this.getValue(key, fallback));
  }

  subscribe(listener: FlagChangeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}
