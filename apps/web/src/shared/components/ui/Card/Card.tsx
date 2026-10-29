import { Card as AntCard } from 'antd';
import clsx from 'clsx';
import { createContext, HTMLAttributes, ReactNode, useContext } from 'react';
import styles from './Card.module.scss';

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
      <AntCard title={title} className={clsx(styles.root, className)} {...rest}>
        <div className={clsx(styles.body, padded && styles.padded)}>{children}</div>
      </AntCard>
    </CardContext.Provider>
  );
}

function CardSection({ children, className }: HTMLAttributes<HTMLDivElement>) {
  const { padded } = useContext(CardContext);
  return (
    <section className={clsx(styles.section, padded && styles.sectionPadded, className)}>
      {children}
    </section>
  );
}

function CardFooter({ children, className }: HTMLAttributes<HTMLDivElement>) {
  return <footer className={clsx(styles.footer, className)}>{children}</footer>;
}

export const Card = Object.assign(CardRoot, {
  Section: CardSection,
  Footer: CardFooter,
});
