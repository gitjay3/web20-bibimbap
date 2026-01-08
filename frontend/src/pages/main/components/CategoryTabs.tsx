import cn from '@/utils/cn';

type CategoryKey = string;

export interface CategoryTabItem<T extends CategoryKey = CategoryKey> {
  key: T;
  label: string;
}

interface CategoryTabsProps<T extends CategoryKey = CategoryKey> {
  items: readonly CategoryTabItem<T>[];
  value: T;
  onChange: (next: T) => void;
}

export default function CategoryTabs<T extends CategoryKey = CategoryKey>({
  items,
  value,
  onChange,
}: CategoryTabsProps<T>) {
  return (
    <div className="flex gap-1">
      {items.map((item) => {
        const selected = item.key === value;

        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            className={cn(
              'h-9 cursor-pointer rounded-full px-4 transition',
              selected
                ? 'bg-brand-surface-weak text-brand-text-primary font-bold'
                : 'text-neutral-text-secondary hover:text-neutral-text-primary',
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
