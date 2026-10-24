import type { BodyOverlayMode } from '@/lib/shared/pushup-types';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
export function OverlayControl({value,onChange}:{value:BodyOverlayMode;onChange:(value:BodyOverlayMode)=>void}) {
 return <fieldset className="overlay-control"><legend>Body overlay</legend><ToggleGroup type="single" value={value} onValueChange={v=>{if(v)onChange(v as BodyOverlayMode);}} aria-label="Body overlay">{(['on','minimal','off'] as const).map(mode=><ToggleGroupItem key={mode} value={mode}>{mode==='on'?'On':mode==='minimal'?'Minimal':'Off'}</ToggleGroupItem>)}</ToggleGroup><small>Visual tracking only. Rhythm determines your score.</small></fieldset>;
}
