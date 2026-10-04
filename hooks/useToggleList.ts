import { useState } from 'react';

export default function useToggleList<T>(initial: T[] = []) {
  const [items, setItems] = useState<T[]>(initial);

  const toggle = (item: T) =>
    setItems((current) =>
      current.includes(item)
        ? current.filter((value) => value !== item)
        : [...current, item]
    );

  return {
    items,
    toggle,
    set: setItems,
    clear: () => setItems([]),
    has: (item: T) => items.includes(item),
  };
}
