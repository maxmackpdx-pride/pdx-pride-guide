import type { ComponentProps } from 'react';
import { ResourceCard } from '@/pages/Resources';

/** NEEDZ preserves its resource metadata, contacts and service actions at every size. */
export type NeedzCardProps = ComponentProps<typeof ResourceCard>;
export function NeedzCard(props: NeedzCardProps) {
  return <ResourceCard {...props} />;
}
