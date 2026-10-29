import { Button as AntButton, ButtonProps as AntButtonProps } from 'antd';
import clsx from 'clsx';
import { createContext, ReactNode, useContext } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonContextValue {
  variant: ButtonVariant;
  loading?: boolean;
}

const ButtonContext = createContext<ButtonContextValue>({ variant: 'primary' });

export interface ButtonProps extends Omit<AntButtonProps, 'type'> {
  variant?: ButtonVariant;
}

function ButtonRoot({ variant = 'primary', className, loading, ...props }: ButtonProps) {
  return (
    <ButtonContext.Provider value={{ variant, loading }}>
      <AntButton
        {...props}
        loading={loading}
        type={variant === 'primary' ? 'primary' : 'default'}
        className={clsx(
          'min-h-10',
          variant === 'primary' && 'font-semibold',
          variant === 'secondary' && 'bg-white',
          variant === 'ghost' && 'border-dashed',
          className,
        )}
      />
    </ButtonContext.Provider>
  );
}

function ButtonLabel({ children }: { children: ReactNode }) {
  return <span className="tracking-wide">{children}</span>;
}

export const Button = Object.assign(ButtonRoot, {
  Label: ButtonLabel,
});
