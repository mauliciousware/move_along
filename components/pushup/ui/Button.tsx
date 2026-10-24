import type { ButtonHTMLAttributes } from 'react';
import { Button as PixelButton } from '@/components/ui/8bit/button';
export function Button({variant='primary',className='',...props}:ButtonHTMLAttributes<HTMLButtonElement> & {variant?:'primary'|'secondary'|'danger'}) {
  return <PixelButton font="normal" variant={variant==='danger'?'destructive':variant==='secondary'?'outline':'default'} className={`pushup-button ${className}`} {...props}/>;
}
