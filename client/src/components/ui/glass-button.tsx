import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import './glass-button.css';

export const glassButtonVariants = cva('glass-button', {
  variants: { size: { default: 'glass-button--default', sm: 'glass-button--sm', lg: 'glass-button--lg', icon: 'glass-button--icon' } },
  defaultVariants: { size: 'default' },
});
export interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof glassButtonVariants> {
  contentClassName?: string;
}

/** Supplied circular glass construction, also shared with the collapsed dock.
 * It adds surface highlights only: the dock owns its background refraction. */
export function GlassButtonSurface() {
  return <span className="glass-button-surface" aria-hidden="true" />;
}
export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(function GlassButton({ className, children, size, contentClassName, type = 'button', ...props }, ref) {
  return <div className={cn('glass-button-wrap', className)}>
    <button {...props} type={type} className={glassButtonVariants({ size })} ref={ref}>
      <GlassButtonSurface />
      <span className={cn('glass-button-text', contentClassName)}>{children}</span>
    </button>
    <div className="glass-button-shadow" aria-hidden="true" />
  </div>;
});

