import type { ReactNode } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
export function Modal({title,children,onClose}:{title:string;children:ReactNode;onClose:()=>void}) {
 return <Dialog open onOpenChange={open=>{if(!open)onClose();}}><DialogContent className="pushup-dialog"><DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>Your song is paused. Continue when you’re ready.</DialogDescription></DialogHeader>{children}</DialogContent></Dialog>;
}
