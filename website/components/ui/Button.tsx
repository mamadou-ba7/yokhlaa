import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'md' | 'lg';

interface CommonProps {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
}

type ButtonAsButton = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps> & {
    as?: 'button';
  };

type ButtonAsAnchor = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof CommonProps> & {
    as: 'a';
    href: string;
  };

export type ButtonProps = ButtonAsButton | ButtonAsAnchor;

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-accent text-black hover:bg-accent/90 hover:shadow-[0_10px_40px_-10px_rgba(34,197,94,0.5)] active:scale-[0.98]',
  secondary:
    'bg-card text-ink border border-line hover:bg-surface hover:border-accent/30 active:scale-[0.98]',
  ghost:
    'bg-transparent text-ink hover:text-accent',
};

const sizeClasses: Record<Size, string> = {
  md: 'h-11 px-5 text-[14px] rounded-lg',
  lg: 'h-[56px] px-7 text-[15px] rounded-xl',
};

export function Button(props: ButtonProps) {
  const {
    children,
    variant = 'primary',
    size = 'md',
    className = '',
  } = props;

  const classes = `btn-base ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  if (props.as === 'a') {
    const { as: _as, variant: _v, size: _s, className: _c, children: _ch, ...anchorProps } = props;
    return (
      <a className={classes} {...anchorProps}>
        {children}
      </a>
    );
  }

  const { as: _as, variant: _v, size: _s, className: _c, children: _ch, ...buttonProps } = props;
  return (
    <button className={classes} {...buttonProps}>
      {children}
    </button>
  );
}
