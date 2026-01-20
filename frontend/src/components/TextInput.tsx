import cn from '@/utils/cn';
import type { InputHTMLAttributes } from 'react';

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

function TextInput({ className, ...props }: TextInputProps) {
  return (
    <input
      type="text"
      className={cn(
        'border-neutral-border-default text-14 placeholder:text-neutral-text-tertiary focus-visible:ring-brand-500 flex h-10 w-full rounded-md border bg-white px-3 py-2 ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      /* eslint-disable-next-line react/jsx-props-no-spreading */
      {...props}
    />
  );
}

export default TextInput;
