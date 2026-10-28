import { cn } from '../../lib/cn';

/** Container base (superfície) usado por todos os painéis. */
export default function Card({ as: Tag = 'div', className, children, ...rest }) {
  return (
    <Tag
      className={cn('rounded-2xl border border-line bg-surface p-5 shadow-card', className)}
      {...rest}
    >
      {children}
    </Tag>
  );
}
