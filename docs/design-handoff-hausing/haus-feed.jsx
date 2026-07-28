/* HAÜS board landing: running head, hero, stats, composer entry, feed cards. */
const { Avatar: DSAvatar } = window.ZaylistDesignSystem_f2a62f;

function RunHead({ vp }){
  return (
    <React.Fragment>
      <div className="hz-run">
        <LiveDot />
        <Mono accent>{vp === 'mobile' ? 'HAÜSING' : 'HAÜSING · Housing board'}</Mono>
      </div>
      <div className="pdx-seam hz-seam--head" aria-hidden="true"></div>
    </React.Fragment>
  );
}

function Hero(){
  return (
    <div>
      <div className="hz-hero">
        <span className="hz-hero__fx" aria-hidden="true"></span>
        <div className="hz-signs" aria-hidden="true">
          {[['FOR RENT','s1'],['NEED ROOMMATES','s2'],['FORMING HOUSE','s3'],['LOOKING FOR ROOM','s4']].map(([label,cls]) => (
            <svg key={cls} className={`hz-sign hz-sign--${cls}`} viewBox="0 0 240 92" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinejoin="round">
              <rect x="6" y="6" width="228" height="80" rx="7" />
              <path d="M6 26h228" />
              <text x="120" y="66" textAnchor="middle" fill="currentColor" stroke="none" fontFamily="var(--font-display)" fontWeight="900" fontSize={label.length > 12 ? 26 : 34} letterSpacing="1.5">{label}</text>
            </svg>
          ))}
        </div>
        <span className="hz-hero__dots" aria-hidden="true"></span>
        <span className="hz-hero__scrim" aria-hidden="true"></span>
        <div className="hz-pad">
          <div className="hz-wrap">
            <h1 className="hz-title hz-hero__title">HAÜSING<span className="hz-beta">Beta</span></h1>
            <p className="hz-hero__lede">Rooms, roommates, and people building a household together. It is a community board, not a listings site. No fees, no applications, no money through Zaylist. You post, you scroll, you chat.</p>
            <div className="hz-hero__mantra"><Mono>Find a room · find people · find a home</Mono></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stats(){
  return (
    <React.Fragment>
      <div className="pdx-seam"></div>
      <div className="hz-stats">
      {window.HAUS.STATS.map(s => (
        <div key={s.l}><b>{s.n}</b><span><Mono micro>{s.l}</Mono></span></div>
      ))}
      </div>
    </React.Fragment>
  );
}

function HowItWorks(){
  /* One neon per step, borrowed from the three post types. */
  const steps = [
    ['Say what you need','One question, four answers. Offering a room, looking for housing, forming a HAÜS, or a managed unit.','add',TYPE_C.offering],
    ['It lands in the feed','Housing shows up next to events and the other boards. People find you by scrolling.','boards',TYPE_C.looking],
    ['Tap chat','No application, no gate. Interest turns straight into a conversation.','message',TYPE_C.forming]
  ];
  return (
    <div className="hz-band">
      <div className="hz-pad"><div className="hz-wrap">
        <SectionTitle kicker="How it works">Under a minute</SectionTitle>
        <div className="hz-steps">
          {steps.map(([ttl,d,ic,col],i) => (
            <div className="hz-step hz-panel pdx-glass-rebind" key={ttl} style={{'--c':col,'--_c':col,'--hz-accent':col}}>
              <div className="hz-step__top"><Mono accent>{`0${i+1}`}</Mono><Icon name={ic} size={16} /></div>
              <b>{ttl}</b><p>{d}</p>
            </div>
          ))}
        </div>
      </div></div>
    </div>
  );
}

function Ask(){
  const { openCompose, filter, setFilter, t } = useHaus();
  const tabs = [['all','All'],['offering','Offering a room'],['looking','Looking for housing'],['forming','Forming a HAÜS'],['managed','Managed property'],['saved','Saved']];
  const opts = [
    ['offering','Offering a room','Your household has a room open.'],
    ['looking','Looking for housing','You need a place. You may not know where yet.'],
    ['forming','Forming a HAÜS','Find your people first, then find the house.']
  ];
  return (
    <div className="hz-pad" style={{paddingTop:26}}>
      <div className="hz-wrap">
        <div className="hz-panel">
          <SectionTitle kicker="Post to the board">What are you looking for?</SectionTitle>
          <div className="hz-ask">
            {opts.map(([k,lbl,d]) => (
              <button key={k} onClick={() => openCompose(k)} style={{'--c':TYPE_C[k],'--hz-accent':TYPE_C[k]}}><b>{lbl}</b><small>{d}</small></button>
            ))}
            <button onClick={() => openCompose('pm')} style={{'--c':TYPE_C.managed,'--hz-accent':TYPE_C.managed}}>
              <b>Managed property</b><small>{t.pmAccount ? 'Your listings and your trusted scan.' : 'Whole unit for rent. Apply to become a verified property manager.'}</small></button>
          </div>
          <p style={{marginTop:12,color:'var(--text-lo)',fontSize:'var(--meta)'}}>Zaylist never handles rent, deposits, or fees. Money is always arranged directly between people.</p>
        </div>
        <div className="hz-filter">
          <Mono micro>Show me</Mono>
          <div className="hz-tabs" role="tablist">
            {tabs.map(([k,l]) => (
              <button key={k} role="tab" className="hz-tab" aria-selected={filter === k} onClick={() => setFilter(k)}>{l}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CardShell({ post, children, wide }){
  const { go } = useHaus();
  const target = () => post.type === 'forming' ? go('haus', post.id) : go('post', post.id);
  return (
    <div className={`pdx-glass-card pdx-glass-rebind hz-card${wide?' hz-card--wide':''}`} role="button" tabIndex={0}
      style={{'--_c':TYPE_C[post.type],'--c':TYPE_C[post.type],'--hz-accent':TYPE_C[post.type]}}
      onClick={target} onKeyDown={e => { if (e.key === 'Enter') target(); }}>
      <span className="pdx-refract-seam" aria-hidden="true"></span>
      {children}
    </div>
  );
}

function CardActions({ post }){
  const { go, saved, toggleSave, joined, requestJoin, waitlist, joinWaitlist, full } = useHaus();
  const stop = (fn) => (e) => { e.stopPropagation(); fn(); };
  const isFull = post.type === 'forming' && (full[post.id] ?? post.full);
  return (
    <div className="hz-cardact">
      <Chip onClick={stop(() => toggleSave(post.id))}><Icon name="favorite" />{saved[post.id] ? 'Saved' : 'Save'}</Chip>
      <Chip onClick={stop(() => {})}><Icon name="share" />Share</Chip>
      <span className="hz-spacer"></span>
      {post.type === 'forming' ? (
        isFull
          ? <Btn size="sm" kind="outline" onClick={stop(() => joinWaitlist(post.id))}>{waitlist[post.id] ? 'On the waiting list' : 'Join the waiting list'}</Btn>
          : <Btn size="sm" kind="solid" onClick={stop(() => requestJoin(post.id))}>{joined[post.id] ? 'Request sent' : 'Ask to join'}</Btn>
      ) : (
        <Btn size="sm" kind="solid" onClick={stop(() => go('chat', post.id))}><Icon name="message" />Chat</Btn>
      )}
    </div>
  );
}

function LookingCard({ post }){
  return (
    <CardShell post={post}>
      <TypeTitle type="looking" />
      <Well photos={post.photos} title={post.person.name} nameCap={0.62}>
        <Cluster people={[post.person]} pets={post.pets || []} size="sm" scale={1.5} wrap3 />
        <Mono micro>Meet {post.person.name.split(' ')[0]}</Mono>
      </Well>
      {post.open ? null : null}
      <div>
        <Mono micro>{post.person.pro} · posted {post.posted}</Mono>
      </div>
      <p className="hz-line">{post.line}</p>
      <div className="hz-facts">
        <Fact label="Budget" value={post.budget} />
        <Fact label="Move" value={post.timeline} />
        <Fact label="Areas" value={post.areas.slice(0,2).join(', ')} />
      </div>
      <div className="hz-chiprow">
        {post.open ? <Chip tone="haus">Open to a HAÜS</Chip> : null}
        {post.living.slice(0,3).map(l => <Chip key={l}>{l}</Chip>)}
      </div>
      <Trust data={post.trust} />
      <CardActions post={post} />
    </CardShell>
  );
}

function OfferingCard({ post }){
  const people = post.household.map(h => h.p);
  return (
    <CardShell post={post}>
      <TypeTitle type="offering" />
      <Well photos={post.photos} title={post.house} nameCap={0.62}>
        <Cluster people={people} pets={post.pets || []} size="sm" scale={1.5} wrap3 />
        <Mono micro>Meet the household</Mono>
      </Well>
      <div>
        <Mono micro>{post.title} · posted {post.posted}</Mono>
      </div>
      <p className="hz-line">{post.line}</p>
      <div className="hz-facts">
        <Fact label="Rent" value={post.rent} />
        <Fact label="Move in" value={post.moveIn} />
        <Fact label="Where" value={post.area} />
      </div>
      <div className="hz-chiprow">{post.culture.slice(0,3).map(c => <Chip key={c}>{c}</Chip>)}</div>
      <Trust data={post.trust} />
      <CardActions post={post} />
    </CardShell>
  );
}

/* Managed property: same shell, purple, verified manager instead of a household.
   No avatar stack, no open slots, no openness chip, no compatibility. Unit facts only. */
function ManagedSave({ post }){
  const { saved, toggleSave } = useHaus();
  return <Chip onClick={e => { e.stopPropagation(); toggleSave(post.id); }}><Icon name="favorite" />{saved[post.id] ? 'Saved' : 'Save'}</Chip>;
}

function ManagedCard({ post }){
  const { posts, buildHaus, go } = useHaus();
  const groups = posts.filter(p => p.type === 'forming' && p.aroundId === post.id);
  const mine = groups.find(g => (g.members || []).some(m => m.p.id === 'frankie'));
  return (
    <CardShell post={post}>
      <TypeTitle type="managed" />
      <Well photos={post.photos} title={post.house} nameCap={0.62}>
        <span className="hz-pmbadge"><Icon name="verified" size={13} />Property manager</span>
        <Mono micro>{post.manager.name}</Mono>
      </Well>
      <div>
        <Mono micro>{post.title} · {post.seen}</Mono>
      </div>
      <p className="hz-line">{post.line}</p>
      <div className="hz-facts">
        <Fact label="Rent" value={post.rent} />
        <Fact label="Available" value={post.moveIn} />
        <Fact label="Where" value={post.area} />
      </div>
      <div className="hz-chiprow">
        <Chip>{post.beds}</Chip><Chip>{post.baths}</Chip><Chip>{post.parking}</Chip>
        {(post.badges || []).map(b => <Chip key={b} tone="accent">{b}</Chip>)}
      </div>
      {groups.length ? (
        <button className="hz-interest" onClick={e => { e.stopPropagation(); go(groups.length === 1 ? 'haus' : 'post', groups.length === 1 ? groups[0].id : post.id); }}>
          <Cluster people={groups.map(g => g.members[0].p)} size="sm" />
          <span>{groups.length === 1
            ? `${groups[0].members[0].p.name.split(' ')[0]} is putting together roommates to secure this place`
            : `${groups.length} groups are putting together roommates for this place`}</span>
        </button>
      ) : null}
      <div className="hz-cardact">
        <ManagedSave post={post} />
        <span className="hz-spacer"></span>
        <Btn size="sm" kind="outline" onClick={e => { e.stopPropagation(); mine ? go('haus', mine.id, 'places') : buildHaus(post.id); }}><Icon name="home" />{mine ? 'Open your HAÜS' : 'Build a HAÜS'}</Btn>
        <Btn size="sm" kind="solid" onClick={e => { e.stopPropagation(); go('post', post.id); }}><Icon name="search" />Details</Btn>
      </div>
    </CardShell>
  );
}

function FormingCard({ post }){
  const { full } = useHaus();
  const isFull = full[post.id] ?? post.full;
  const people = post.members.map(m => m.p);
  return (
    <CardShell post={post} wide>
      <TypeTitle type="forming" />
      <Well photos={post.photos} title={(post.photos && post.photos.length) ? post.house : 'Build a HAÜS'}>
        <Cluster people={people} pets={post.pets || []} size="sm" scale={1.5} slots={isFull ? 0 : post.seeking} />
        <Mono micro>{isFull ? 'The household' : `${people.length} in, ${post.seeking} to go`}</Mono>
      </Well>
      <div>
        <Mono micro>{post.title} · posted {post.posted}</Mono>
      </div>
      {post.around ? <div className="hz-around"><Icon name="venue" size={13} /><span>Forming around {post.around.name} · managed by {post.around.manager}</span></div> : null}
      <p className="hz-line">{post.line}</p>
      <div className="hz-facts">
        <Fact label="Combined budget" value={post.budget} />
        <Fact label="Move in" value={post.moveIn} />
        <Fact label="Looking in" value={post.areas.join(', ')} />
      </div>
      <div className="hz-chiprow">
        {isFull ? <Chip tone="full">We are full</Chip> : <Chip tone="haus">Looking for {post.seeking} more</Chip>}
        {post.flavor ? <Chip>{window.HAUS.FLAVOR[post.flavor].label}</Chip> : null}
      </div>
      <Trust data={post.trust} />
      <CardActions post={post} />
    </CardShell>
  );
}

function Feed(){
  const { posts, filter, saved } = useHaus();
  const list = posts.filter(p => p.gone ? false : filter === 'all' ? true : filter === 'saved' ? saved[p.id] : p.type === filter);
  return (
    <div className="hz-pad">
      <div className="hz-wrap">
        <div style={{paddingTop:26}}>
          <SectionTitle kicker={`${list.length} posts`} right={<Mono micro>Newest first</Mono>}>{filter === 'saved' ? 'Saved for later' : 'Active on the board'}</SectionTitle>
        </div>
        {list.length === 0 ? (
          <div className="hz-panel hz-empty">{filter === 'saved' ? 'Nothing saved yet. Tap save on a post and it waits here.' : 'Nothing here yet. Yas, be the first.'}</div>
        ) : (
          <div className="hz-feed">
            {list.map(p => p.type === 'looking' ? <LookingCard key={p.id} post={p} />
              : p.type === 'offering' ? <OfferingCard key={p.id} post={p} />
              : p.type === 'managed' ? <ManagedCard key={p.id} post={p} />
              : <FormingCard key={p.id} post={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function Board(){
  return (
    <div>
      <Hero />
      <HowItWorks />
      <Stats />
      <Ask />
      <Feed />
      <CloseSeam />
    </div>
  );
}

Object.assign(window, { RunHead, Board, Feed, LookingCard, OfferingCard, FormingCard, ManagedCard, CardActions });
