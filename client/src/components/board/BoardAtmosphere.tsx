import { WebGLShader } from '@/components/ui/web-gl-shader';
import './BoardAtmosphere.css';

type Room = 'eventz' | 'hauz' | 'giftz' | 'gigz' | 'sellz' | 'mizzed';

/** Quiet drafting sketches replace generic backdrop objects in each board. */
const sketches: Record<Exclude<Room, 'hauz'>, string[]> = {
  eventz: [
    'M90 305 L200 58 L310 305 Z M135 305 L200 118 L265 305 M60 320 H340 M75 108 Q200 30 325 108 M86 144 Q200 75 314 144',
    'M140 180 L95 160 M260 180 L305 160 M154 218 L97 228 M246 218 L303 228 M180 120 L200 94 L220 120',
  ],
  giftz: [
    'M84 175 H316 V335 H84 Z M70 145 H330 V180 H70 Z M188 145 V335 M212 145 V335 M200 145 C125 128 108 90 145 75 C180 63 198 117 200 145 C202 117 220 63 255 75 C292 90 275 128 200 145',
    'M92 191 H308 M101 324 H299 M178 80 Q159 80 153 99 M247 99 Q241 80 222 80',
  ],
  gigz: [
    'M140 78 H260 V151 Q260 202 200 202 Q140 202 140 151 Z M166 202 V245 M234 202 V245 M112 240 Q200 335 288 240 M200 280 V330 M145 330 H255',
    'M95 105 L55 80 M305 105 L345 80 M200 45 V20 M100 315 L70 345 M300 315 L330 345',
  ],
  sellz: [
    'M82 100 H258 L330 172 L330 330 H82 Z M258 100 V172 H330 M115 225 H290 M117 260 H265 M118 295 H235 M129 138 H201',
    'M85 107 L76 96 M268 101 L339 176 M339 180 V321 M71 340 H327 M140 150 H204',
  ],
  mizzed: [
    'M55 90 C98 90 127 165 178 184 C230 205 272 165 345 115 M60 310 C112 310 146 245 200 225 C252 205 286 240 342 296 M200 225 C175 202 163 178 181 168 C194 160 201 171 205 177 C213 164 228 164 235 176 C244 196 224 212 200 225',
    'M80 80 L65 100 M331 102 L351 120 M81 322 L64 302 M325 306 L345 288 M177 187 L198 218',
  ],
};

export default function BoardAtmosphere({ room, side }: { room: Room; side: 'left' | 'right' }) {
  return <div className={`board-atmosphere board-atmosphere--${side}`} style={{ '--board-atmosphere-color': `var(--room-${room})` } as React.CSSProperties} aria-hidden="true">
    <WebGLShader accent={`var(--room-${room})`} blueprintUrl={room === 'hauz' ? '/resources-art/hauz-moving-day.svg' : null} direction={side === 'right' ? -1 : 1} waveSpeed={0.7} />
    <svg className="board-atmosphere__contours" viewBox="0 0 1000 600" preserveAspectRatio="none" fill="none" role="presentation">
      <path d="M-80 370 C180 180 310 235 525 360 S845 570 1080 320" />
      <path d="M-80 395 C180 205 310 260 525 385 S845 595 1080 345" />
      <path d="M-80 425 C180 235 310 290 525 415 S845 625 1080 375" />
    </svg>
    {room !== 'giftz' && room !== 'hauz' && <svg className="board-atmosphere__sketch" viewBox="0 0 400 400" fill="none" role="presentation">
      <g stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d={sketches[room][0]} />
        <path d={sketches[room][1]} strokeWidth="1.2" opacity=".65" />
        <path d={sketches[room][0]} transform="translate(4 -3)" strokeWidth=".7" opacity=".32" />
      </g>
      <g stroke="currentColor" strokeWidth=".65" opacity=".25">
        <path d="M30 40 H370 M30 360 H370 M40 30 V370 M360 30 V370" />
        <path d="M30 40 l13 -10 M30 40 l13 10 M370 360 l-13 -10 M370 360 l-13 10" />
      </g>
    </svg>}
  </div>;
}
