import { Button as AntButton, ButtonProps as AntButtonProps } from 'antd';
import clsx from 'clsx';
import { createContext, ReactNode, useContext } from 'react';
import styles from './Button.module.scss';

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
        className={clsx(styles.root, styles[variant], className)}
      />
    </ButtonContext.Provider>
  );
}

function ButtonLabel({ children }: { children: ReactNode }) {
  const { loading } = useContext(ButtonContext);
  if (loading) {
    return <span className={styles.label}>{children}</span>;
  }
  return <span className={styles.label}>{children}</span>;
}

export const Button = Object.assign(ButtonRoot, {
  Label: ButtonLabel,
});
