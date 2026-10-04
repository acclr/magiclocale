import { splitTranslationText } from '@/domain/keys';
import { cn } from 'cn';

const tokenClassName =
  'mx-0.5 rounded bg-primary/15 px-1 py-px font-mono text-[0.85em] text-primary';

export function VariableText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const parts = splitTranslationText(text);

  return (
    <span className={className}>
      {parts.map((part, index) =>
        part.kind === 'text' ? (
          <span key={index}>{part.value}</span>
        ) : (
          <code className={tokenClassName} key={`${part.token}-${index}`}>
            {part.token}
          </code>
        )
      )}
    </span>
  );
}

export function VariableToken({
  token,
  className,
}: {
  token: string;
  className?: string;
}) {
  return <code className={cn(tokenClassName, className)}>{token}</code>;
}
