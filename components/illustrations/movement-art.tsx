import type { ExerciseId } from "@/lib/shared/types";
import { cn } from "@/lib/utils";

/** Original geometric character artwork; illustrative, never pose measurements. */
export function MovementArt({ exercise = "squat", className, decorative = false }: { exercise?: ExerciseId; className?: string; decorative?: boolean }) {
  const push = exercise === "pushup";
  const march = exercise === "march";
  return <svg viewBox="0 0 240 200" className={cn("movement-art", className)} role={decorative ? undefined : "img"} aria-hidden={decorative || undefined} aria-label={decorative ? undefined : `${exercise === "squat" ? "Squat" : march ? "Knee raise" : "Push-up"} movement illustration`} shapeRendering="crispEdges">
    <ellipse cx="120" cy="177" rx="72" ry="7" fill="currentColor" opacity=".10" />
    <g stroke="var(--foreground)" strokeWidth="5" strokeLinejoin="miter">
      {push ? <>
        <path d="M72 106 178 133 201 162 181 165 164 146 91 128Z" fill="var(--primary)" />
        <path d="M89 128 80 157 107 157 107 171 65 171 65 152 74 122" fill="var(--art-skin)" />
        <path d="M177 132 206 155 213 171 188 171 173 147" fill="var(--art-pants)" />
        <path d="M57 87H87V119H57Z" fill="var(--art-skin)" />
        <path d="M52 84H89V98H66V107H52Z" fill="var(--foreground)" />
      </> : <>
        <path d={march ? "M110 115 139 115 139 165 154 165 154 177 123 177 123 140 100 140 87 119Z" : "M97 111 133 111 153 137 128 159 143 165 143 177 108 177 108 157 124 137 90 137Z"} fill="var(--art-pants)" />
        {march ? <path d="M103 116 81 138 110 138 110 153 63 153 63 133 89 107" fill="var(--art-pants)" /> : <path d="M119 113 145 113 165 137 143 157 157 166 157 177 131 177 126 158 145 136" fill="var(--art-pants)" />}
        <path d={march ? "M93 66H126L139 115H89Z" : "M84 71H115L136 115H98Z"} fill="var(--primary)" />
        <path d={march ? "M95 74 75 96 59 86 51 97 77 114 108 86" : "M94 79 116 103 143 89 150 101 114 120 81 90"} fill="var(--art-skin)" />
        <path d={march ? "M97 30H128V66H97Z" : "M76 35H108V71H76Z"} fill="var(--art-skin)" />
        <path d={march ? "M94 27H131V43H108V51H94Z" : "M73 32H111V48H88V56H73Z"} fill="var(--foreground)" />
      </>}
    </g>
    <rect x={push ? 78 : march ? 119 : 99} y={push ? 100 : march ? 47 : 52} width="4" height="5" fill="var(--foreground)" />
    <path d="M29 151V161H19M205 47V57H215" fill="none" stroke="var(--foreground)" strokeWidth="4" opacity=".35" />
  </svg>;
}

export function PixelSpark({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}><path d="M10 0h4v7h3v3h7v4h-7v3h-3v7h-4v-7H7v-3H0v-4h7V7h3Z" /></svg>;
}
