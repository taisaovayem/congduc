import { Card as AntCard } from 'antd';
import clsx from 'clsx';
import { createContext, HTMLAttributes, ReactNode, useContext } from 'react';

interface CardContextValue {
  padded: boolean;
}

const CardContext = createContext<CardContextValue>({ padded: true });

interface CardRootProps extends HTMLAttributes<HTMLDivElement> {
  title?: ReactNode;
  padded?: boolean;
}

function CardRoot({ title, padded = true, className, children, ...rest }: CardRootProps) {
  return (
    <CardContext.Provider value={{ padded }}>
      <AntCard title={title} className={clsx('rounded-xl', className)} {...rest}>
        <div className={clsx('flex flex-col gap-3', padded && 'pt-1')}>{children}</div>
      </AntCard>
    </CardContext.Provider>
  );
}

function CardSection({ children, className }: HTMLAttributes<HTMLDivElement>) {
  const { padded } = useContext(CardContext);
  return (
    <section className={clsx('flex flex-col gap-2', padded && 'py-2', className)}>{children}</section>
  );
}

function CardFooter({ children, className }: HTMLAttributes<HTMLDivElement>) {
  return (
    <footer className={clsx('mt-2 flex flex-wrap gap-2', className)}>{children}</footer>
  );
}

export const Card = Object.assign(CardRoot, {
  Section: CardSection,
  Footer: CardFooter,
});
