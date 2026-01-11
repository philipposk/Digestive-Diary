import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'accent' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        className={cn(
          'font-medium rounded-lg transition-colors',
          {
            'bg-primary-500 hover:bg-primary-600 text-white': variant === 'primary',
            'bg-accent-500 hover:bg-accent-600 text-white': variant === 'accent',
            'bg-gray-200 hover:bg-gray-300 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white': variant === 'secondary',
            'py-2 px-4 text-sm': size === 'sm',
            'py-3 px-6 text-base': size === 'md',
            'py-4 px-6 text-lg': size === 'lg',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export default Button;

