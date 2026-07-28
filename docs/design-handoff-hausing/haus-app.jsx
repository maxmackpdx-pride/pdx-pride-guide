/* HAÜS prototype: shared store, composer, and the two viewports. */
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "avatars": "standard",
  "trustChips": true,
  "pmAccount": true,
  "workspace": true,
  "calm": false
}/*EDITMODE-END*/;

const HD = window.HAUS;
const now = () => new Date().toLocaleTimeString([], { hour:'numeric', minute:'2-digit' });

const DRAFTS = {
  looking: { title:'Looking for a room in November, inner southeast', line:'Two years in Portland, ready to stop living alone. I bake and I do the dishes without being asked.', budget:'$900/mo', timeline:'Nov 1', areas:['Buckman','Sunnyside','Montavilla'], lookingFor:'A room in a house that eats together sometimes. I work hybrid so I am around Tuesdays and Fridays.', about:'I moved here for the scene and stayed for the people in it. I run sound for a monthly show and I am home the rest of the time.', living:['Hybrid work','Bakes','Sober friendly','No pets'] },
  offering: { house:'The Overlook HAÜS', title:'Room in a three bedroom on N Failing', line:'Three of us, one porch, one very slow cat. The room faces the back yard.', rent:'$875', rentNote:'plus utilities, about $60', deposit:'$875 deposit, no application fee', moveIn:'Oct 1', room:'Private room, main floor', area:'Overlook', photos:4, culture:['Trans affirming','Quiet after 11','Cat in the house','Shared staples'], access:['Step free entry','Bathroom on the same floor'], about:'We are looking for a fourth who wants a home, not a stopover.' },
  managed: { house:'Sandy Vista, Unit 2', title:'Two bedroom in a small managed building, Montavilla', line:'Top floor unit with a new kitchen and a shared back yard. Laundry on site.', rent:'$1,650', rentNote:'water and trash included', deposit:'$1,650 deposit, $45 screening fee', beds:'2 bed', baths:'1 bath', parking:'Off street, one space', outdoor:'Shared yard', moveIn:'Oct 1', area:'Montavilla', areas:['Montavilla'], access:['Third floor, stairs only','Bathroom on the same floor'], about:'Applications and payments happen off Zaylist.' },
  forming: { house:'Failing Street HAÜS', title:'Two of us, looking for two more', line:'We want a house we sign together, with a kitchen big enough to be in the way of each other.', budget:'$2,800 to $3,300', budgetNote:'combined, four people', moveIn:'Dec 1', areas:['Overlook','Kenton','Piedmont'], seeking:2, flavor:'together', about:'Building this before the search starts, so we know who we are looking with.', goals:['Everyone on the lease','Trans affirming household','One shared dinner a week'] }
};

/* A property name into a household name: drop unit numbers and building words,
   then add the locked suffix. "Sumner Court ADU" becomes "Sumner Court HAÜS". */
function hausName(property){
  const head = property.split(',')[0]
    .replace(/\b(adu|apartments?|apts?|building|lofts?|residences?|unit\s*\w+|#\s*\w+)\b/gi,'')
    .replace(/\s+/g,' ').trim();
  return (head || 'New') + ' HAÜS';
}

function makePost(type, draft){
  const base = { id:'new-' + Date.now(), type, person:HD.P.frankie, posted:'Just now', trust:{ mutuals:5, events:8, since:'2022' }, open:true };
  if (type === 'forming') return { ...base, ...draft, members:[{ p:HD.P.frankie, role:'Lead', line:'Started this HAÜS.' }], full:false };
  if (type === 'offering') return { ...base, ...draft, household:[{ p:HD.P.frankie, line:'Posted the room.' }] };
  if (type === 'managed') return { ...base, ...draft, open:false, manager:{ name:'Rose City Residential', line:'Property manager · 14 buildings in inner Portland', since:'2020' }, site:'rosecityresidential.com/sandy-vista-2', seen:'Just now', source:'Posted by hand', trust:{ verified:'Property manager verified', since:'2020' } };
  return { ...base, ...draft };
}

function Composer(){
  const { compose, setCompose, publish, t, posts } = useHaus();
  const [draft, setDraft] = React.useState(null);
  const [mates, setMates] = React.useState([]);
  const [shots, setShots] = React.useState([]);
  const type = compose.type;
  React.useEffect(() => { if (type) { setDraft({ ...DRAFTS[type] }); setMates([]); setShots([]); } }, [type]);
  if (!compose.open) return null;
  const close = () => setCompose({ open:false });
  const set = (k, v) => setDraft(d => ({ ...d, [k]: v }));

  if (compose.done) {
    return (
      <Sheet title="Posted" onClose={close}>
        <div className="hz-done">
          <Mono accent>It is on the board</Mono>
          <h3>You are on Zaylist</h3>
          <p className="hz-prose" style={{margin:'12px auto 0'}}>Your post is in the feed now. People will tap chat when something clicks. You can add photos, change the details, or switch what you are looking for at any time.</p>
          <div style={{display:'flex',gap:10,justifyContent:'center',marginTop:18,flexWrap:'wrap'}}>
            <Btn kind="outline" onClick={close}><Icon name="share" />Share it</Btn>
            <Btn kind="solid" onClick={() => { close(); }}>See it in the feed</Btn>
          </div>
        </div>
      </Sheet>
    );
  }

  if (type === 'pm') {
    const approved = t.pmAccount;
    /* Signed in as one manager. Rows derive from that manager's own units so a PM
       can never appear to see or edit another company's inventory. */
    const me = 'Rose City Residential';
    const mySite = 'rosecityresidential.com';
    const mine = posts.filter(p => p.type === 'managed' && p.manager && p.manager.name === me);
    return (
      <Sheet title={approved ? 'Property manager' : 'Become a property manager'} onClose={close} accent={TYPE_C.managed}>
        {approved ? (
          <React.Fragment>
            <div className="hz-secttl" style={{marginBottom:6}}>{me}</div>
            <p style={{color:'var(--text-lo)',fontSize:'var(--meta)',marginBottom:16}}>Verified property manager. You can edit the details on your own listings. Adding and removing listings is owner side.</p>
            <div className="hz-fields">
              <div className="hz-field"><label><Mono micro>Your listings</Mono></label>
                <div className="hz-rows">
                  {mine.map(p => <Row key={p.id} label={`${p.house} · ${p.area}`} value={p.gone ? 'Off market' : 'Live'} />)}
                  <Row label="Sandy Vista, Unit 2 · Montavilla" value="Draft" />
                </div>
                <small className="hz-hint">Only your units. Adding and removing listings is owner side.</small></div>
              <div className="hz-field"><label><Mono micro>QSearch, your trusted scan</Mono></label>
                <div className="hz-panel">
                  <div className="hz-rows">
                    <Row label="Source" value={mySite} />
                    <Row label="Last successful scan" value="2 hours ago" />
                    <Row label="Units pulled in" value={`${mine.length + 1} of ${mine.length + 1}`} />
                    <Row label="Adapter health" value="Healthy" />
                  </div>
                  <div style={{marginTop:12,display:'flex',gap:10,flexWrap:'wrap'}}>
                    <Btn size="sm" kind="outline"><Icon name="search" />Run a scan</Btn>
                    <Btn size="sm" kind="outline">Preview what it found</Btn>
                  </div>
                </div>
                <small className="hz-hint">Scoped to your properties. Verification is what switches this on, and it is free.</small></div>
              <div className="hz-flag hz-flag--note"><span><b style={{color:'var(--text-hi)'}}>Affirming Housing Partner · $30 a month</b>
                <p>Flat, no tiers, first month free. Membership keeps your listings publishing. Verification and every safety step are never behind payment.</p></span></div>
              <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
                <Btn kind="solid" onClick={() => setCompose({ open:true, type:'managed' })}><Icon name="add" />Post a unit by hand</Btn>
                <Btn kind="outline" onClick={close}>Done</Btn>
              </div>
            </div>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <div className="hz-secttl" style={{marginBottom:6}}>Apply to list managed units</div>
            <p style={{color:'var(--text-lo)',fontSize:'var(--meta)',marginBottom:16}}>Every property manager on this board is verified. There is no unverified way to list. Applications go to the owner, same as the promoter application.</p>
            <div className="hz-fields">
              <div className="hz-field"><label><Mono micro>Company</Mono></label><input className="hz-input" style={{width:'100%'}} defaultValue="" placeholder="Your company name" /></div>
              <div className="hz-field"><label><Mono micro>Rental website</Mono></label><input className="hz-input" style={{width:'100%'}} defaultValue="" placeholder="yourrentals.com" />
                <small className="hz-hint">We check that you own this domain. Once you are approved it becomes your trusted scan source.</small></div>
              <div className="hz-field" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div><label><Mono micro>Business license</Mono></label><input className="hz-input" style={{width:'100%'}} placeholder="License number" /></div>
                <div><label><Mono micro>Directory listing</Mono></label><input className="hz-input" style={{width:'100%'}} placeholder="Your place on Zaylist" /></div>
              </div>
              <div className="hz-flag hz-flag--note"><span><b style={{color:'var(--text-hi)'}}>Verification is free and required</b>
                <p>You cannot buy your way onto the board. The Affirming Housing Partner membership is $30 a month for the service on top, flat, first month free. The first three managers get six months.</p></span></div>
              <Btn kind="solid" block onClick={close}><Icon name="verified" />Send it to the owner</Btn>
            </div>
          </React.Fragment>
        )}
      </Sheet>
    );
  }

  if (!type) {
    const opts = [['offering','Offering a room','Your household has a room open.'],['looking','Looking for housing','You need a place. You may not know where yet.'],['forming','Forming a HAÜS','Find your people first, then find the house.']];
    return (
      <Sheet title="New housing post" onClose={close}>
        <div className="hz-secttl" style={{marginBottom:14}}>What are you looking for?</div>
        <div className="hz-ask" style={{gridTemplateColumns:'1fr',marginTop:0}}>
          {opts.map(([k,t,d]) => <button key={k} onClick={() => setCompose({ open:true, type:k })} style={{'--c':TYPE_C[k],'--hz-accent':TYPE_C[k]}}><b>{t}</b><small>{d}</small></button>)}
          <button onClick={() => setCompose({ open:true, type:'pm' })} style={{'--c':TYPE_C.managed,'--hz-accent':TYPE_C.managed}}>
            <b>Managed property</b><small>{t.pmAccount ? 'Your listings and your trusted scan.' : 'Whole unit for rent. Apply to become a verified property manager.'}</small></button>
        </div>
      </Sheet>
    );
  }

  if (!draft) return null;
  const isForming = type === 'forming';
  const isManaged = type === 'managed';
  const isOffering = type === 'offering' || isManaged;
  return (
    <Sheet title={window.HAUS.TYPE[type].label} onClose={close} accent={TYPE_C[type]}>
      <div className="hz-secttl" style={{marginBottom:6}}>{isManaged ? 'Tell people about the unit' : isForming ? 'Name it and say who you want' : isOffering ? 'Tell people about the house' : 'Tell people what you need'}</div>
      <p style={{color:'var(--text-lo)',fontSize:'var(--meta)',marginBottom:16}}>Everything except the first line is optional. You can fill in the rest later.</p>
      <div className="hz-fields">
        {isManaged ? (
          <div className="hz-field"><label><Mono micro>Property name</Mono></label>
            <input className="hz-input" style={{width:'100%'}} value={draft.house} onChange={e => set('house', e.target.value)} />
            <small className="hz-hint">A managed building is not a household, so it keeps its real name.</small></div>
        ) : isForming || type === 'offering' ? (
          <div className="hz-field"><label><Mono micro>House name</Mono></label>
            <div className="hz-suffix">
              <input className="hz-input" value={draft.house.replace(/\s*HAÜS$/,'')} onChange={e => set('house', e.target.value.replace(/\s*HAÜS$/,'') + ' HAÜS')} />
              <span>HAÜS</span>
            </div>
            <small className="hz-hint">Every household name ends in HAÜS. You write the front part.</small></div>
        ) : null}
        <div className="hz-field"><label><Mono micro>Headline</Mono></label>
          <input className="hz-input" style={{width:'100%'}} value={draft.title} onChange={e => set('title', e.target.value)} /></div>
        <div className="hz-field"><label><Mono micro>In your own words</Mono></label>
          <textarea className="hz-input" style={{width:'100%'}} value={draft.line} onChange={e => set('line', e.target.value)}></textarea></div>
        <div className="hz-field" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <div><label><Mono micro>{isOffering ? 'Rent' : 'Budget'}</Mono></label>
            <input className="hz-input" style={{width:'100%'}} value={isOffering ? draft.rent : draft.budget} onChange={e => set(isOffering ? 'rent' : 'budget', e.target.value)} /></div>
          <div><label><Mono micro>{isOffering ? 'Available' : 'Move timeline'}</Mono></label>
            <input className="hz-input" style={{width:'100%'}} value={isOffering ? draft.moveIn : draft.timeline || draft.moveIn} onChange={e => set(isOffering || isForming ? 'moveIn' : 'timeline', e.target.value)} /></div>
        </div>
        <div className="hz-field"><label><Mono micro>Neighborhoods</Mono></label>
          <div className="hz-chiprow">{(draft.areas || [draft.area]).map(a => <Chip key={a} tone="accent">{a}</Chip>)}<Chip onClick={() => {}}>Add</Chip></div></div>
        {isManaged ? (
          <div className="hz-field" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div><label><Mono micro>Bedrooms</Mono></label><input className="hz-input" style={{width:'100%'}} value={draft.beds} onChange={e => set('beds', e.target.value)} /></div>
            <div><label><Mono micro>Bathrooms</Mono></label><input className="hz-input" style={{width:'100%'}} value={draft.baths} onChange={e => set('baths', e.target.value)} /></div>
            <div><label><Mono micro>Parking</Mono></label><input className="hz-input" style={{width:'100%'}} value={draft.parking} onChange={e => set('parking', e.target.value)} /></div>
            <div><label><Mono micro>Outdoor space</Mono></label><input className="hz-input" style={{width:'100%'}} value={draft.outdoor} onChange={e => set('outdoor', e.target.value)} /></div>
          </div>
        ) : null}
        {isManaged ? (
          <div className="hz-flag hz-flag--note"><span><b style={{color:'var(--text-hi)'}}>Posting as Sandy Vista Property Group</b>
            <p>Verified property manager. Managed listings show a verified badge and no household, and they never carry openness or compatibility.</p></span></div>
        ) : null}
        {isOffering && !isManaged ? (
          <div className="hz-field"><label><Mono micro>Who lives here</Mono></label>
            <div className="hz-mates">
              <span className="hz-mate"><img src={HD.P.frankie.img} alt="" /></span>
              {mates.map((m,i) => <span className="hz-mate" key={i}><img src={m} alt="" /></span>)}
              <label className="hz-mate hz-mate--add" title="Add a housemate photo"><Icon name="add" size={15} />
                <input type="file" accept="image/*" style={{display:'none'}} onChange={e => {
                  const f = e.target.files && e.target.files[0];
                  if (f) setMates(m => [...m, URL.createObjectURL(f)]);
                }} />
              </label>
              <label className="hz-mate hz-mate--pet" title="Add a pet photo"><Icon name="add" size={13} />
                <input type="file" accept="image/*" style={{display:'none'}} onChange={e => {
                  const f = e.target.files && e.target.files[0];
                  if (f) setMates(m => [...m, URL.createObjectURL(f)]);
                }} />
              </label>
            </div>
            <p style={{color:'var(--text-lo)',fontSize:'var(--meta)',marginTop:8}}>Housemates who are not on Zaylist can still be in the stack. Upload a photo with their okay. Pets get a spot too, one size down.</p>
          </div>
        ) : null}
        {isForming ? (
          <div className="hz-field"><label><Mono micro>How this HAÜS works</Mono></label>
            <div className="hz-ask" style={{gridTemplateColumns:'1fr 1fr',marginTop:0}}>
              {[['together','Find a place together','No place yet. Form the household, then hunt as a group.'],['place','Start on a place in mind','You have a lease or a prospect. Fill the rooms.']].map(([k,ttl,d]) => (
                <button key={k} type="button" onClick={() => set('flavor', k)}
                  style={draft.flavor === k ? {borderColor:'var(--c)'} : null}><b>{ttl}</b><small>{d}</small></button>
              ))}
            </div>
          </div>
        ) : null}
        {type === 'looking' ? (
          <div className="hz-field"><label><Mono micro>Coming with you</Mono></label>
            <div className="hz-mates">
              <span className="hz-mate"><img src={HD.P.frankie.img} alt="" /></span>
              {mates.map((m,i) => <span className="hz-mate" key={i}><img src={m} alt="" /></span>)}
              {mates.length < 3 ? (
                <label className="hz-mate hz-mate--add" title="Add a photo"><Icon name="add" size={15} />
                  <input type="file" accept="image/*" style={{display:'none'}} onChange={e => {
                    const f = e.target.files && e.target.files[0];
                    if (f) setMates(m => [...m, URL.createObjectURL(f)]);
                  }} />
                </label>
              ) : null}
            </div>
            <p style={{color:'var(--text-lo)',fontSize:'var(--meta)',marginTop:8}}>A partner, a friend, a pet. Add anyone moving with you so households know the whole picture.</p>
          </div>
        ) : null}
        {type === 'looking' ? (
          <label className="hz-flag">
            <input type="checkbox" defaultChecked={true} />
            <span><b style={{color:'var(--text-hi)'}}>Open to forming or joining a HAÜS</b>
              <p>A chip on your post, not a commitment. You can change it whenever.</p></span>
          </label>
        ) : null}
        <div className="hz-field">
          <label><Mono micro>{isManaged ? 'Photos of the unit' : isOffering ? 'Photos of the place' : isForming ? 'Photos of what you are picturing' : 'Your photos'}</Mono></label>
          <div className="hz-upload__shots">
            {shots.map((s,i) => <span className="hz-upload__shot" key={i}><img src={s} alt="" /></span>)}
            {shots.length < 4 ? (
              <label className="hz-upload__drop">
                <b>{shots.length ? 'Add another photo' : isManaged ? 'Add photos of the unit' : isOffering ? 'Add photos of the house and the room' : 'Add up to four photos'}</b>
                <small>{isManaged ? 'The first photo is the cover. The property name sits over it. Drop files here or choose them.' : isOffering ? 'Lead with the outside of the house. Drop files here or choose them.' : isForming ? 'The kind of place you are after. Drop files here or choose them.' : 'Your life, not your face. Your profile picture already shows.'}</small>
                <input type="file" accept="image/*" multiple style={{display:'none'}} onChange={e => {
                  const f = [...(e.target.files || [])].map(x => URL.createObjectURL(x));
                  if (f.length) setShots(s => [...s, ...f].slice(0,4));
                }} />
              </label>
            ) : null}
          </div>
        </div>
      </div>
      <div style={{display:'flex',gap:10,marginTop:18}}>
        <Btn onClick={() => setCompose({ open:true })}>Back</Btn>
        <span style={{marginLeft:'auto'}}></span>
        <Btn kind="solid" onClick={() => publish(makePost(type, draft))}>Post to the board</Btn>
      </div>
    </Sheet>
  );
}

function Screen(){
  const { route, posts } = useHaus();
  if (route.name === 'board') return <Board />;
  const post = posts.find(p => p.id === route.id);
  if (!post) return <Board />;
  if (route.name === 'chat') return <Chat post={post} />;
  if (route.name === 'haus') return <HausDetail post={post} />;
  return post.type === 'offering' ? <OfferingDetail post={post} /> : post.type === 'forming' ? <HausDetail post={post} /> : post.type === 'managed' ? <ManagedDetail post={post} /> : <LookingDetail post={post} />;
}

function Frame({ vp }){
  const { route, openCompose, toast } = useHaus();
  const scroller = React.useRef(null);
  React.useEffect(() => { if (scroller.current) scroller.current.scrollTop = 0; }, [route.name, route.id]);
  return (
    <div className="hz" data-vp={vp}>
      <span className="hz-wash" aria-hidden="true"></span>
      <span className="hz-grain" aria-hidden="true"></span>
      <RunHead vp={vp} />
      <div className="hz-scroll" ref={scroller}><Screen /></div>
      {vp === 'mobile' && route.name === 'board' ? (
        <div className="hz-fab"><Btn kind="solid" onClick={() => openCompose()}>Post</Btn></div>
      ) : null}
      {toast ? (
        <div style={{position:'absolute',left:16,right:16,bottom:16,zIndex:70,background:'var(--panel-card)',border:'1px solid var(--panel-border-2)',borderRadius:'var(--chrome-radius-md)',padding:'12px 14px',boxShadow:'var(--chrome-keyline), var(--chrome-bloom)'}}>
          <Mono accent>{toast}</Mono>
        </div>
      ) : null}
      <Composer />
    </div>
  );
}

function Stage(){
  const [vp, setVp] = React.useState('desktop');
  return (
    <div className="shell">
      <div className="shell__bar">
        <span className="shell__mark">HAÜSING · prototype</span>
        <div className="shell__seg">
          {['desktop','mobile'].map(k => (
            <button key={k} aria-pressed={vp === k} onClick={() => setVp(k)}>{k}</button>
          ))}
        </div>
      </div>
      <div className={`shell__view shell__view--${vp}`}>
        {vp === 'desktop'
          ? <Frame vp="desktop" />
          : <IOSDevice width={402} height={844} dark><Frame vp="mobile" /></IOSDevice>}
      </div>
    </div>
  );
}

const parseHash = () => {
  const h = (location.hash || '').replace(/^#/, '');
  if (!h) return { name:'board' };
  const [name, id, tab] = h.split('/');
  return { name, id, tab };
};

function App(){
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [route, setRouteState] = React.useState(parseHash);
  const setRoute = (r) => { setRouteState(r); location.hash = [r.name, r.id, r.tab].filter(Boolean).join('/'); };
  const [filter, setFilter] = React.useState('all');
  const [posts, setPosts] = React.useState(HD.POSTS);
  const [saved, setSaved] = React.useState({});
  const [full, setFullMap] = React.useState({});
  const [joined, setJoined] = React.useState({});
  const [waitlist, setWaitlist] = React.useState({});
  const [threads, setThreads] = React.useState(HD.THREADS);
  const [workspace, setWorkspace] = React.useState(HD.WORKSPACE);
  const [compose, setCompose] = React.useState({ open:false });
  const [toast, setToast] = React.useState(null);

  React.useEffect(() => {
    const onHash = () => setRouteState(parseHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  React.useEffect(() => { document.documentElement.dataset.calm = t.calm ? 'true' : 'false'; }, [t.calm]);
  const flash = (m) => { setToast(m); window.setTimeout(() => setToast(null), 2600); };

  const value = {
    t, setTweak, route, filter, setFilter, posts, saved, full, joined, waitlist, threads, workspace, compose, setCompose, toast,
    go: (name, id, tab) => setRoute({ name, id, tab }),
    toggleSave: (id) => setSaved(s => ({ ...s, [id]: !s[id] })),
    setFull: (id, v) => { setFullMap(f => ({ ...f, [id]: v })); flash(v ? 'Marked full. The card updated.' : 'Open again.'); },
    requestJoin: (id) => { setJoined(j => ({ ...j, [id]: true })); flash('Asked to join. The Lead accepts before the chat opens.'); },
    joinWaitlist: (id) => { setWaitlist(wl => ({ ...wl, [id]: true })); flash('You are on the waiting list. The Lead hears about it if a spot opens.'); },
    openCompose: (type) => setCompose({ open:true, type }),
    send: (id, text) => setThreads(th => ({ ...th, [id]: [ ...(th[id] || []), { me:true, who:'You', text, when:`Today ${now()}` } ] })),
    publish: (post) => { setPosts(p => [post, ...p]); setFilter('all'); setCompose({ open:true, done:true }); if (post.type === 'forming') setWorkspace(w => ({ ...w, [post.id]: { places:[], dates:[{ id:'nd', label:'Target move in', when:post.moveIn, who:'Set when the HAÜS started' }], requests:[], chat:[] } })); },
    convertToHaus: (id) => {
      setPosts(ps => ps.map(p => p.id !== id ? p : ({
        ...p, type:'forming', house:`${p.person.name.split(' ')[0]} and friends`,
        title:'Just started, looking for people', budget:p.budget.replace('/mo','') + ' each', budgetNote:'per person',
        moveIn:p.timeline, seeking:2, members:[{ p:p.person, role:'Lead', line:'Converted their post into this HAÜS.' }],
        goals:p.living, about:p.about, full:false
      })));
      setWorkspace(w => ({ ...w, [id]: { places:[], dates:[{ id:'c1', label:'Target move in', when:'Aug 1', who:'Carried over from the post' }], requests:[], chat:[] } }));
      setRoute({ name:'haus', id, tab:'places' });
      flash('Converted. Same post, same replies. You are the Lead.');
    },
    setPlaceStatus: (pid, wid, status) => setWorkspace(w => ({ ...w, [pid]: { ...w[pid], places: w[pid].places.map(pl => pl.id === wid ? { ...pl, status } : pl) } })),
    /* Renters self organizing around a managed listing. Creates a place in mind
       HAÜS seeded from the unit. Never claims or reserves it: the listing stays live
       and several groups can form on the same property. */
    buildHaus: (mid) => {
      const src = posts.find(p => p.id === mid);
      if (!src) return;
      const mine = posts.find(p => p.type === 'forming' && p.aroundId === mid && (p.members || []).some(m => m.p.id === 'frankie'));
      if (mine) { setRoute({ name:'haus', id:mine.id, tab:'places' }); flash('You already lead a HAÜS for this place.'); return; }
      const id = 'haus-' + Date.now();
      setPosts(ps => [{
        id, type:'forming', person:HD.P.frankie, posted:'Just now', flavor:'place',
        aroundId:mid, around:{ name:src.house, manager:src.manager.name, rent:src.rent, area:src.area, moveIn:src.moveIn },
        house:hausName(src.house),
        title:'Putting together roommates to secure this place',
        line:`${src.beds} in ${src.area} at ${src.rent}. I am looking for people to sign it with me.`,
        budget:src.rent, budgetNote:'split between us', moveIn:src.moveIn, seeking:2,
        area:src.area, areas:[src.area], goals:['Sign together','Move by ' + src.moveIn],
        about:'This HAÜS formed around a managed listing. Nothing is reserved. We are getting a group together before we approach the manager.',
        photos:src.photos, members:[{ p:HD.P.frankie, role:'Lead', line:'Started this HAÜS around the listing.' }],
        full:false, trust:{ mutuals:5, events:8, since:'2022' }
      }, ...ps]);
      setWorkspace(w => ({ ...w, [id]: {
        places:[{ id:'target', title:src.house + ' · the target', rent:src.rent, hood:src.area, src:'zaylist.com, managed listing', by:'Seeded from the listing', status:'Interested', reactions:0, comments:0 }],
        dates:[
          { id:'d1', label:'Listing available', when:src.moveIn, who:'From the manager listing' },
          { id:'d2', label:'Talk to the manager', when:'This week', who:'Lead' }
        ],
        requests:[], chat:[]
      } }));
      setRoute({ name:'haus', id, tab:'places' });
      flash('HAÜS started around the listing. Nothing is reserved.');
    },
    /* PM removes the listing. Attached groups survive and keep hunting. */
    takeDown: (mid) => {
      const attached = posts.filter(p => p.type === 'forming' && p.aroundId === mid);
      setPosts(ps => ps.map(p => p.id === mid ? { ...p, gone:true }
        : (p.type === 'forming' && p.aroundId === mid) ? {
            ...p, flavor:'together', aroundId:null, around:null,
            title:'Still looking, together',
            line:`The place we formed around came off the market. Still ${p.seeking} short of a household, still hunting in ${p.area}.`,
            about:'This HAÜS formed around a managed listing that is gone now. The group is still here and still looking for a place we can sign together.'
          } : p));
      /* The plan survives the listing: the target is marked passed and the
         manager dates come off, so nothing points at a dead unit. */
      setWorkspace(w => {
        const next = { ...w };
        attached.forEach(g => {
          const ws = next[g.id];
          if (!ws) return;
          next[g.id] = {
            ...ws,
            places:(ws.places || []).map(pl => pl.id === 'target'
              ? { ...pl, title:pl.title.replace(' · the target',''), status:'Passed' } : pl),
            dates:(ws.dates || []).filter(dt => dt.id !== 'd1' && dt.id !== 'd2')
              .concat([{ id:'d3', label:'Keep hunting together', when:'This week', who:'The listing came off the market' }])
          };
        });
        return next;
      });
      flash('Listing down. Every HAÜS around it switched to finding a place together.');
    },
    addPlace: (pid, url) => setWorkspace(w => ({ ...w, [pid]: { ...w[pid], places: [ ...(w[pid].places || []), { id:'a'+Date.now(), title:'Saved link, add a note', rent:'Rent TBD', hood:'Add a neighborhood', src:url.replace(/^https?:\/\//,'').split('/')[0] || 'link', by:'You', status:'Interested', reactions:0, comments:0 } ] } })),
    approve: (pid, rid) => { setWorkspace(w => ({ ...w, [pid]: { ...w[pid], requests: w[pid].requests.filter(r => r.id !== rid) } })); flash('Conversation started with Kit.'); },
    decline: (pid, rid) => setWorkspace(w => ({ ...w, [pid]: { ...w[pid], requests: w[pid].requests.filter(r => r.id !== rid) } }))
  };

  return (
    <HausCtx.Provider value={value}>
      <Stage />
      <TweaksPanel title="HAÜS">
        <TweakSection label="Cards" />
        <TweakRadio label="People on cards" value={t.avatars} options={['subtle','standard','hero']} onChange={v => setTweak('avatars', v)} />
        <TweakToggle label="Community context" value={t.trustChips} onChange={v => setTweak('trustChips', v)} />
        <TweakSection label="Managed property" />
        <TweakToggle label="Verified manager account" value={t.pmAccount} onChange={v => setTweak('pmAccount', v)} />
        <TweakSection label="Forming a HAÜS" />
        <TweakToggle label="Show Lead workspace" value={t.workspace} onChange={v => setTweak('workspace', v)} />
        <TweakSection label="Accessibility" />
        <TweakToggle label="Calm mode" value={t.calm} onChange={v => setTweak('calm', v)} />
      </TweaksPanel>
    </HausCtx.Provider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
