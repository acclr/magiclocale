import { cn } from 'cn';
import type { ReactNode } from 'react';

import {
  tokenizeJsx,
  type JsxToken,
  type JsxTokenKind,
} from '@/lib/landing/highlight-jsx';

type AnimatedCodeEditorProps = {
  fileName: string;
  before: string[];
  after: string[];
  prefix: string;
  typed: string;
  suffix: string;
  isDirty: boolean;
  isTyping: boolean;
  status?: ReactNode;
};

const tokenStyles: Record<JsxTokenKind, string> = {
  keyword: 'text-persian-blue-300',
  string: 'text-emerald-300',
  tag: 'text-sky-300',
  attribute: 'text-violet-300',
  call: 'text-international-orange-300',
  punctuation: 'text-muted-foreground',
  plain: 'text-foreground/90',
};

function renderTokens(tokens: JsxToken[], caretAt?: number, caret?: ReactNode) {
  const nodes: ReactNode[] = [];
  let offset = 0;
  tokens.forEach((token, index) => {
    const end = offset + token.text.length;
    const splitsHere =
      caretAt !== undefined && caretAt >= offset && caretAt < end;
    if (splitsHere) {
      const head = token.text.slice(0, caretAt - offset);
      const tail = token.text.slice(caretAt - offset);
      if (head) {
        nodes.push(
          <span className={tokenStyles[token.kind]} key={`${index}-h`}>
            {head}
          </span>
        );
      }
      nodes.push(<span key="caret">{caret}</span>);
      nodes.push(
        <span className={tokenStyles[token.kind]} key={`${index}-t`}>
          {tail}
        </span>
      );
    } else {
      nodes.push(
        <span className={tokenStyles[token.kind]} key={index}>
          {token.text}
        </span>
      );
    }
    offset = end;
  });
  if (caretAt !== undefined && caretAt >= offset) {
    nodes.push(<span key="caret">{caret}</span>);
  }
  return nodes;
}

const CodeLine = ({
  number,
  active = false,
  children,
}: {
  number: number;
  active?: boolean;
  children: ReactNode;
}) => (
  <div
    className={cn(
      'flex min-w-max pr-6 transition-colors duration-300',
      active && 'bg-foreground/[0.04]'
    )}
  >
    <span
      className={cn(
        'w-12 shrink-0 select-none pr-4 text-right tabular-nums',
        active ? 'text-foreground/70' : 'text-muted-foreground/40'
      )}
    >
      {number}
    </span>
    <span className="whitespace-pre">{children}</span>
  </div>
);

const AnimatedCodeEditor = ({
  fileName,
  before,
  after,
  prefix,
  typed,
  suffix,
  isDirty,
  isTyping,
  status,
}: AnimatedCodeEditorProps) => {
  const activeLine = `${prefix}${typed}${suffix}`;
  const caret = (
    <span
      aria-hidden
      className={cn(
        'mx-px inline-block h-[1.15em] w-[2px] translate-y-[0.2em] rounded-full bg-primary',
        !isTyping && 'hero-caret-blink'
      )}
    />
  );

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-[#101012]">
      <div className="flex items-center gap-4 border-b border-border bg-surface px-4">
        <div className="flex gap-1.5 py-3" aria-hidden>
          <span className="size-2.5 rounded-full bg-foreground/15" />
          <span className="size-2.5 rounded-full bg-foreground/15" />
          <span className="size-2.5 rounded-full bg-foreground/15" />
        </div>
        <div className="-mb-px flex items-center gap-2 self-stretch border-x border-b border-x-border border-b-[#101012] bg-[#101012] px-3.5 font-mono text-xs text-foreground">
          <span className="text-sky-300">⚛</span>
          {fileName}
          <span
            aria-label={isDirty ? 'Unsaved changes' : undefined}
            className={cn(
              'size-1.5 rounded-full bg-foreground/60 transition-opacity duration-300',
              isDirty ? 'opacity-100' : 'opacity-0'
            )}
          />
        </div>
      </div>

      <pre
        aria-label={`${fileName} source`}
        className="overflow-x-auto py-4 font-mono text-[12.5px] leading-6 sm:text-[13px]"
      >
        <code>
          {before.map((line, index) => (
            <CodeLine key={index} number={index + 1}>
              {renderTokens(tokenizeJsx(line))}
            </CodeLine>
          ))}
          <CodeLine active number={before.length + 1}>
            {renderTokens(
              tokenizeJsx(activeLine),
              prefix.length + typed.length,
              caret
            )}
          </CodeLine>
          {after.map((line, index) => (
            <CodeLine key={index} number={before.length + index + 2}>
              {renderTokens(tokenizeJsx(line))}
            </CodeLine>
          ))}
        </code>
      </pre>

      <div className="flex h-7 items-center justify-between gap-4 border-t border-border bg-surface px-4 font-mono text-[11px] text-muted-foreground">
        <span>TSX</span>
        <span className="truncate">{status}</span>
      </div>
    </div>
  );
};

export default AnimatedCodeEditor;
