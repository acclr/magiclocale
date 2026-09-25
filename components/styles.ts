import styles from 'styles/sdk-override.module.css';

export const BOXYHQ_UI_CSS = {
  button: {
    ctoa: 'inline-flex h-8 items-center justify-center rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground',
    destructive:
      'inline-flex h-8 items-center justify-center rounded-lg bg-destructive/10 px-2.5 text-sm font-medium text-destructive',
    cancel:
      'inline-flex h-8 items-center justify-center rounded-lg px-2.5 text-sm',
  },
  input: `${styles['sdk-input']} h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm`,
  select: styles['sdk-select'],
  textarea: styles['sdk-input'],
  confirmationPrompt: {
    button: {
      ctoa: 'inline-flex h-8 items-center justify-center rounded-lg px-2.5 text-sm',
      cancel:
        'inline-flex h-8 items-center justify-center rounded-lg px-2.5 text-sm',
    },
  },
  secretInput:
    'h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm',
  section: 'mb-8',
};
