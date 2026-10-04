export type SyncFrame = {
  projectId: string;
  scope: string;
  sent: number;
  total: number;
  chunkIndex: number;
  chunkCount: number;
  chunkSize: number;
  status: 'syncing' | 'paused' | 'done' | 'stopped' | 'error';
  preview: string[];
  message?: string;
};

const BAR_WIDTH = 24;

export function formatSyncFrame(frame: SyncFrame): string {
  const ratio = frame.total === 0 ? 1 : Math.min(1, frame.sent / frame.total);
  const filled = Math.round(ratio * BAR_WIDTH);
  const bar = '#'.repeat(filled) + '-'.repeat(BAR_WIDTH - filled);
  const lines = [
    'Keykit sync',
    `Project  ${frame.projectId}`,
    `Scope    ${frame.scope}`,
    '',
    `${frame.total} keys · ${frame.chunkSize} per request · ${frame.chunkCount} ${frame.chunkCount === 1 ? 'request' : 'requests'}`,
    `[${bar}]  ${frame.sent}/${frame.total}  chunk ${Math.max(frame.chunkIndex, 1)}/${frame.chunkCount}  ${frame.status}`,
  ];
  for (const key of frame.preview.slice(0, 5)) {
    lines.push(`  ${key}`);
  }
  if (frame.preview.length > 5) {
    lines.push(`  … ${frame.preview.length - 5} more in this chunk`);
  }
  if (frame.message) {
    lines.push('', frame.message);
  }
  lines.push('', 'p pause · c continue · q quit and save');
  return lines.join('\n');
}

export type SyncDisplay = {
  show(frame: SyncFrame): void;
  replaceStatus(status: SyncFrame['status'], message?: string): void;
  finish(text: string): void;
};

export function createSyncDisplay(stream: NodeJS.WriteStream = process.stdout): SyncDisplay {
  let previousLines = 0;
  let current: SyncFrame | null = null;
  const interactive = Boolean(stream.isTTY);

  return {
    show(frame) {
      current = frame;
      const text = formatSyncFrame(frame);
      if (!interactive) {
        stream.write(
          `chunk ${frame.chunkIndex}/${frame.chunkCount}  ${frame.sent}/${frame.total}  ${frame.status}\n`
        );
        return;
      }
      if (previousLines > 0) {
        stream.write(`\u001b[${previousLines}A\u001b[0J`);
      }
      stream.write(`${text}\n`);
      previousLines = text.split('\n').length;
    },
    replaceStatus(status, message) {
      if (!current) {
        return;
      }
      this.show({ ...current, status, message });
    },
    finish(text) {
      if (interactive && previousLines > 0) {
        stream.write(`\u001b[${previousLines}A\u001b[0J`);
        previousLines = 0;
      }
      stream.write(`${text}\n`);
    },
  };
}
