/* HAÜS shared primitives. Deep-glass chrome, board accent, people-first bits. */
const { Avatar, Button: DSButton } = window.ZaylistDesignSystem_f2a62f;
const HausCtx = React.createContext(null);
const useHaus = () => React.useContext(HausCtx);

const AV = { subtle:{sm:34,md:42,lg:57,xl:73}, standard:{sm:42,md:57,lg:83,xl:109}, hero:{sm:52,md:73,lg:109,xl:146} };
function useAv(){ const { t } = useHaus(); return (k) => (AV[t.avatars] || AV.standard)[k]; }

const TYPE_C = { offering:'var(--panel-orange)', looking:'var(--panel-cyan)', forming:'var(--green-acid)', managed:'var(--panel-purple)' };

function Mono({ children, accent, micro, style }){
  return <span className={`hz-mono${accent?' hz-mono--accent':''}${micro?' hz-mono--micro':''}`} style={style}>{children}</span>;
}
function LiveDot(){ return <i className="hz-dot" aria-hidden="true"></i>; }

/* DS line icons (assets/icons), inlined so they inherit currentColor. */
const ICONS = {
  message:'<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>',
  share:'<circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><path d="m8.6 13.5 6.8 4M15.4 6.5 8.6 10.5"></path>',
  favorite:'<path d="M12 21s-7-4.5-9.5-9C.8 8.3 3 4 7 4c2.2 0 3.8 1.3 5 3 1.2-1.7 2.8-3 5-3 4 0 6.2 4.3 4.5 8 -2.5 4.5-9.5 9-9.5 9Z"></path>',
  home:'<path d="m3 10.5 9-7 9 7"></path><path d="M5 9v11h14V9"></path><path d="M10 20v-6h4v6"></path>',
  events:'<rect x="3" y="5" width="18" height="16" rx="2"></rect><path d="M3 10h18M8 3v4M16 3v4"></path>',
  venue:'<path d="M21 10c0 6-9 12-9 12S3 16 3 10a9 9 0 0 1 18 0Z"></path><circle cx="12" cy="10" r="3"></circle>',
  verified:'<path d="M4 5h16v6c0 6-8 9-8 9s-8-3-8-9Z"></path><path d="m9 12 2 2 4-4"></path>',
  community:'<path d="M10 8.6c-1.1-2.4-4.6-2.1-4.6.9 0 2 2.4 3.7 4.6 5.5 2.2-1.8 4.6-3.5 4.6-5.5 0-3-3.5-3.3-4.6-.9Z"></path><path d="M17.2 12.2c-.9-1.9-3.7-1.7-3.7.7 0 1.6 1.9 3 3.7 4.4 1.8-1.4 3.7-2.8 3.7-4.4 0-2.4-2.8-2.6-3.7-.7Z"></path>',
  connection:'<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.5 1.4"></path><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.5-1.4"></path>',
  add:'<circle cx="12" cy="12" r="9"></circle><path d="M12 8v8M8 12h8"></path>',
  search:'<circle cx="11" cy="11" r="7"></circle><path d="m20 20-4-4"></path>',
  boards:'<rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="14" width="7" height="7" rx="1"></rect><rect x="3" y="14" width="7" height="7" rx="1"></rect>',
  safety:'<rect x="5" y="11" width="14" height="9" rx="2"></rect><path d="M8 11V7a4 4 0 0 1 8 0v4"></path>',
  navigate:'<path d="M22 2 15 22l-4-9-9-4Z"></path>',
  close:'<circle cx="12" cy="12" r="9"></circle><path d="m9 9 6 6M15 9l-6 6"></path>',
  profile:'<circle cx="12" cy="8" r="4"></circle><path d="M4 20c0-4 4-6 8-6s8 2 8 6"></path>',
  alerts:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.7 21a2 2 0 0 1-3.4 0"></path>',
  paw:'<path d="M12 13.5c-2.3 0-4.2 1.7-4.2 3.6 0 1.6 1.5 2.2 4.2 2.2s4.2-.6 4.2-2.2c0-1.9-1.9-3.6-4.2-3.6Z"></path><ellipse cx="6.4" cy="11" rx="1.5" ry="1.9"></ellipse><ellipse cx="9.8" cy="8.2" rx="1.5" ry="1.9"></ellipse><ellipse cx="14.2" cy="8.2" rx="1.5" ry="1.9"></ellipse><ellipse cx="17.6" cy="11" rx="1.5" ry="1.9"></ellipse>'
};
function Icon({ name, size = 14 }){
  return <svg className="hz-ico" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" dangerouslySetInnerHTML={{__html:ICONS[name]}}></svg>;
}

function Chip({ children, tone, onClick, title }){
  const cls = `hz-chip${tone?` hz-chip--${tone}`:''}${onClick?' hz-chip--btn':''}`;
  return onClick
    ? <button type="button" className={cls} onClick={onClick} title={title}>{children}</button>
    : <span className={cls} title={title}>{children}</span>;
}

function TypeChip({ type }){ return <Chip tone="solid">{window.HAUS.TYPE[type].label}</Chip>; }

function TypeTitle({ type }){
  return <div className="hz-type">{window.HAUS.TYPE[type].label}</div>;
}

/* Canonical DS Button, pointed at the surface accent instead of root acid. */
function Btn({ children, kind = 'neon', size = 'md', onClick, block, type = 'button' }){
  const variant = kind === 'solid' ? 'solid' : kind === 'outline' ? 'outline' : 'neon';
  return (
    <DSButton variant={variant} size={size} block={block} onClick={onClick} type={type} style={{'--_c':'var(--hz-accent)'}}>{children}</DSButton>
  );
}

/* Community context. Participation, never a score, never a filter. */
function Trust({ data }){
  const { t } = useHaus();
  if (!t.trustChips || !data) return null;
  const bits = [];
  if (data.mutuals) bits.push(`${data.mutuals} mutual connections`);
  if (data.events) bits.push(`${data.events} events together`);
  if (data.since) bits.push(`Member since ${data.since}`);
  if (data.verified) bits.push(data.verified);
  return (
    <div className="hz-trust hz-mono hz-mono--micro">
      {bits.map((b,i) => <span key={i}><i></i>{b}</span>)}
    </div>
  );
}

function Cluster({ people, pets = [], size = 'md', slots = 0, scale = 1, max = 6, wrap3 = false }){
  const av = useAv();
  const px0 = Math.round(av(size) * scale);
  const px = (wrap3 && people.length > 3) ? Math.round(px0 * 0.74) : px0;
  const petPx = Math.round(px * 0.72);
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;
  const rowSize = (i) => {
    const row = Math.floor(i / 3);
    return wrap3 ? Math.round(px * Math.pow(0.82, Math.max(0, row - 2))) : (i < 3 ? px : Math.round(px * Math.pow(0.82, i - 2)));
  };
  return (
    <div className={`hz-cluster${wrap3 ? ' hz-cluster--wrap' : ''}`}>
      {shown.map((p,i) => <Avatar key={p.id} src={p.img} name={p.name} ring={p.ring} size={rowSize(i)} tint="#222" />)}
      {extra > 0 ? (
        <span className="hz-more" title={people.slice(max).map(p => p.name).join(', ')} style={{width:px,height:px,fontSize:Math.round(px*0.34)}}>+{extra}</span>
      ) : null}
      {pets.map(p => (
        <span key={p.name} className="hz-pet" title={`${p.name}, ${p.kind}`} style={{width:petPx,height:petPx,fontSize:Math.round(petPx*0.4)}}>
          {p.img ? <img src={p.img} alt={p.name} /> : <span>{p.name[0]}</span>}
        </span>
      ))}
      {Array.from({length:slots}).map((_,i) => (
        <span key={`s${i}`} className="hz-slot" title="Open spot" style={{width:px,height:px,marginLeft:-8,fontSize:px >= 56 ? 11 : 12}}>{px >= 56 ? 'Open' : '+'}</span>
      ))}
    </div>
  );
}

function Pet({ pet }){
  return (
    <div className="hz-member">
      <span className="hz-pet hz-pet--lg">{pet.img ? <img src={pet.img} alt={pet.name} /> : <span>{pet.name[0]}</span>}</span>
      <div>
        <b>{pet.name}</b> <span className="hz-vip"><Icon name="paw" size={11} />Zay-VIP-List</span>
        <div><Mono micro>{pet.kind}</Mono></div>
        {pet.line ? <p>{pet.line}</p> : null}
      </div>
    </div>
  );
}

function Person({ p, line, badge, size = 'md', scale = 1 }){
  const av = useAv();
  return (
    <div className="hz-member">
      <Avatar src={p.img} name={p.name} ring={p.ring} size={Math.round(av(size) * scale)} tint="#222" />
      <div>
        <b>{p.name}</b> <Mono micro>{p.pro}</Mono>
        {badge ? <div style={{marginTop:6}}><Chip tone="accent">{badge}</Chip></div> : null}
        {line ? <p>{line}</p> : null}
      </div>
    </div>
  );
}

function Fact({ label, value }){
  return <div className="hz-fact"><Mono micro>{label}</Mono><b>{value}</b></div>;
}
function Tile({ label, value }){
  return <div className="hz-tile"><Mono micro>{label}</Mono><b>{value}</b></div>;
}
function Row({ label, value }){
  return <div className="hz-row"><span>{label}</span><b>{value}</b></div>;
}

/* One photo treatment everywhere: a slideshow in the deep-glass well. */
/* At most two lines, split as evenly as possible, so the type stays large. */
function nameLines(title){
  const words = String(title).toUpperCase().split(/\s+/).filter(Boolean);
  if (words.length < 2) return words;
  let best = 1, bestScore = Infinity;
  for (let i = 1; i < words.length; i++){
    const a = words.slice(0,i).join(' ').length;
    const b = words.slice(i).join(' ').length;
    const score = Math.abs(a - b);
    if (score < bestScore) { bestScore = score; best = i; }
  }
  return [words.slice(0,best).join(' '), words.slice(best).join(' ')];
}
function measureLine(text){
  const ctx = measureLine.ctx || (measureLine.ctx = document.createElement('canvas').getContext('2d'));
  ctx.font = "900 100px 'Barlow Condensed', 'Arial Narrow', sans-serif";
  return Math.max(1, ctx.measureText(text).width);
}
function useFontsReady(){
  const [, bump] = React.useState(0);
  React.useEffect(() => {
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => bump(n => n + 1));
  }, []);
}

const DEFAULT_PHOTO = 'uploads/sample-media/defaults/forming-no-place.jpg';

function Well({ photos = [], title, children, nameCap = 0.8 }){
  useFontsReady();
  const wellRef = React.useRef(null);
  const labelRef = React.useRef(null);
  const [box, setBox] = React.useState(null);
  React.useLayoutEffect(() => {
    const el = wellRef.current;
    if (!el) return;
    const read = () => {
      const r = el.getBoundingClientRect();
      const lh = labelRef.current ? labelRef.current.getBoundingClientRect().height : 0;
      setBox({ w:r.width, h:r.height, lh });
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    if (labelRef.current) ro.observe(labelRef.current);
    return () => ro.disconnect();
  }, []);
  const lines = title ? nameLines(title) : [];
  /* Dynamic type: every line fills the same width. Height budget excludes the
     caption row and the nav row so the title can never sit under them. */
  const ratios = lines.map(l => 108 / measureLine(l));
  const sumR = ratios.reduce((a,b) => a + b, 0.0001);
  /* Same title scale on every card: the block always fills the same share of the
     photo height, width capped so long names get narrower rather than wider. */
  const kH = box ? 0.62 * Math.min(1.26, Math.max(1, box.w / 390)) : 0.62;
  const nameW = box ? Math.max(60, Math.min(box.w * nameCap, Math.max(40, Math.min(box.h * kH, box.h - box.lh - 22)) / sumR)) : 0;
  const stretch = 1;
  const [n, setN] = React.useState(0);
  const shots = photos.length ? photos : [DEFAULT_PHOTO];
  const count = photos.length;
  const step = (d) => (e) => { e.stopPropagation(); setN((n + d + count) % count); };
  return (
    <div className="hz-well" ref={wellRef}>
      {shots.map((src,i) => <img key={i} className={`hz-well__img${i === n ? ' is-on' : ''}`} src={src} alt="" />)}
      <span className="hz-well__scrim" aria-hidden="true"></span>
      <span className="hz-well__scan" aria-hidden="true"></span>
      {count > 1 ? (
        <React.Fragment>
          <button className="hz-nav hz-nav--prev" onClick={step(-1)} aria-label="Previous photo">‹</button>
          <button className="hz-nav hz-nav--next" onClick={step(1)} aria-label="Next photo">›</button>
        </React.Fragment>
      ) : null}
      {title ? (
        <div className="hz-well__name" style={{width:nameW || undefined,visibility:nameW ? 'visible' : 'hidden'}}>
          {lines.map((line,i) => (
            <svg key={i} viewBox={`0 0 ${Math.round(measureLine(line))} 108`} preserveAspectRatio="none" aria-hidden="true"
              style={{height:nameW ? nameW * ratios[i] * stretch : undefined}}>
              <text x="0" y="86" fontSize="100">{line}</text>
            </svg>
          ))}
        </div>
      ) : null}
      <div className="hz-well__label" ref={labelRef}>
        <span className="hz-well__cap">{children}</span>
        {count > 1 ? (
          <span className="hz-dots">
            {photos.map((_,i) => (
              <button key={i} className={i === n ? 'is-on' : ''} aria-label={`Photo ${i+1}`}
                onClick={e => { e.stopPropagation(); setN(i); }}></button>
            ))}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function Gallery(){ return null; }

function Strip(){ return null; }

function Strip2(){ return null; }

function SectionTitle({ kicker, children, right }){
  return (
    <div style={{display:'flex',alignItems:'flex-end',gap:12,marginBottom:12,flexWrap:'wrap'}}>
      <div style={{flex:'1 1 auto',minWidth:0}}>
        {kicker ? <div style={{marginBottom:6}}><Mono accent>{kicker}</Mono></div> : null}
        <div className="hz-secttl">{children}</div>
      </div>
      {right ? <div style={{marginLeft:'auto',whiteSpace:'nowrap'}}>{right}</div> : null}
    </div>
  );
}

function Sheet({ title, onClose, children, accent }){
  return (
    <div className="hz-sheetwrap" onClick={onClose}>
      <div className="hz-sheet pdx-glass-rebind" onClick={e => e.stopPropagation()} style={accent ? {'--c':accent,'--_c':accent,'--hz-accent':accent} : undefined}>
        <div className="hz-sheet__head">
          <Mono accent>{title}</Mono>
          <button className="hz-x" onClick={onClose} aria-label="Close"><Icon name="close" size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function CloseSeam(){
  return (
    <React.Fragment>
      <div className="pdx-seam" aria-hidden="true"></div>
      <div className="hz-close">
        <Mono>Post it. Scroll it. Chat.</Mono>
        <Mono micro>zaylist.com/hausing</Mono>
      </div>
    </React.Fragment>
  );
}

Object.assign(window, { HausCtx, useHaus, useAv, TYPE_C, Mono, LiveDot, Icon, Chip, TypeChip, TypeTitle, Btn, Trust, Cluster, Person, Pet, Fact, Tile, Row, Well, Gallery, Strip, SectionTitle, Sheet, CloseSeam });
