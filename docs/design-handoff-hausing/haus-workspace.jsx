/* Forming a HAÜS: the post, and the shared workspace behind it.
   Warm and social on purpose. A house being built, not a project plan. */
const { Avatar: WsAvatar } = window.ZaylistDesignSystem_f2a62f;

const STATUS_TONE = { Interested:'', Touring:'accent', Applied:'accent', Passed:'', Chosen:'full' };

function Places({ post }){
  const { workspace, setPlaceStatus, addPlace } = useHaus();
  const places = (workspace[post.id] || {}).places || [];
  const [url, setUrl] = React.useState('');
  const cycle = (pl) => {
    const order = ['Interested','Touring','Applied','Chosen','Passed'];
    setPlaceStatus(post.id, pl.id, order[(order.indexOf(pl.status) + 1) % order.length]);
  };
  return (
    <div>
      <form className="hz-composer" style={{paddingTop:0}} onSubmit={e => { e.preventDefault(); if (url.trim()) { addPlace(post.id, url.trim()); setUrl(''); } }}>
        <input className="hz-input" value={url} onChange={e => setUrl(e.target.value)} placeholder="Paste a link to a place you found" />
        <Btn size="sm" kind="outline" type="submit"><Icon name="add" />Add</Btn>
      </form>
      <p style={{color:'var(--text-lo)',fontSize:'var(--meta)',margin:'0 0 14px'}}>Links live here for your household only. Zaylist is not listing these places.</p>
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        {places.map(pl => (
          <div className="hz-place" key={pl.id}>
            <div className="hz-place__thumb">{pl.img ? <img src={pl.img} alt="" /> : <Mono micro>{pl.src.split('.')[0]}</Mono>}</div>
            <div style={{flex:1,minWidth:0}}>
              <b>{pl.title}</b>
              <div style={{marginTop:4}}><Mono micro>{pl.rent} · {pl.hood} · added by {pl.by}</Mono></div>
              <div className="hz-chiprow" style={{marginTop:8}}>
                <Chip tone={STATUS_TONE[pl.status]} onClick={() => cycle(pl)}>{pl.status}</Chip>
                <Chip><Icon name="favorite" />{pl.reactions}</Chip>
                <Chip><Icon name="message" />{pl.comments} comments</Chip>
              </div>
            </div>
          </div>
        ))}
        {places.length === 0 ? <div className="hz-empty">No places yet. Paste the first link and the house can weigh in.</div> : null}
      </div>
    </div>
  );
}

function Dates({ post }){
  const { workspace } = useHaus();
  const dates = (workspace[post.id] || {}).dates || [];
  return (
    <div>
      {dates.map(d => (
        <div className="hz-date" key={d.id}>
          <b>{d.label}</b>
          <div style={{textAlign:'right'}}>
            <div><Mono accent micro>{d.when}</Mono></div>
            <div style={{marginTop:3}}><Mono micro>{d.who}</Mono></div>
          </div>
        </div>
      ))}
      {dates.length === 0 ? <div className="hz-empty">No dates yet. Add the first tour and everyone gets the reminder.</div> : null}
      <div style={{marginTop:14}}><Btn size="sm" kind="outline"><Icon name="add" />Add a date</Btn></div>
      <p className="hz-remind"><Icon name="alerts" size={13} />Reminders go out the same way every other Zaylist reminder does.</p>
    </div>
  );
}

function HouseChat({ post }){
  const { workspace } = useHaus();
  const chat = (workspace[post.id] || {}).chat || [];
  return (
    <div>
      <div className="hz-chat" style={{paddingTop:0}}>
        {chat.map((m,i) => <div className="hz-msg" key={i}>{m.text}<small>{m.who} · {m.when}</small></div>)}
        {chat.length === 0 ? <div className="hz-empty">Quiet in here. Say hi to your household.</div> : null}
      </div>
      <div className="hz-composer"><input className="hz-input" placeholder="Message the house" /><Btn size="sm" kind="solid">Send</Btn></div>
    </div>
  );
}

function People({ post }){
  const { workspace, approve, decline, full, setFull, waitlist } = useHaus();
  const ws = workspace[post.id] || {};
  const isFull = full[post.id] ?? post.full;
  const waiting = (post.waitlist || 0) + (waitlist[post.id] ? 1 : 0);
  return (
    <div>
      <div className="hz-members">
        {post.members.map(m => <Person key={m.p.id} p={m.p} line={m.line} badge={m.role === 'Lead' ? 'Lead' : null} />)}
      </div>
      {(ws.requests || []).length ? (
        <div style={{marginTop:16}}>
          <Mono accent>Asked to join</Mono>
          {(ws.requests || []).map(r => (
            <div className="hz-member" key={r.id} style={{marginTop:10}}>
              <WsAvatar src={r.p.img} name={r.p.name} ring={r.p.ring} size={44} tint="#222" />
              <div style={{flex:1}}>
                <b>{r.p.name}</b> <Mono micro>{r.p.pro}</Mono>
                <p>{r.note}</p>
                <div className="hz-chiprow" style={{marginTop:10}}>
                  <Chip tone="accent" onClick={() => approve(post.id, r.id)}>Accept and open the chat</Chip>
                  <Chip onClick={() => decline(post.id, r.id)}>Not right now</Chip>
                </div>
              </div>
            </div>
          ))}
          <p style={{marginTop:10,color:'var(--text-lo)',fontSize:'var(--meta)'}}>Asking to join is asking to chat. Nothing opens until the Lead accepts.</p>
        </div>
      ) : null}
      <div className="hz-sect" style={{marginTop:16}}>
        {isFull && waiting ? <div style={{marginBottom:12}}><Mono accent>{waiting} people on the waiting list</Mono></div> : null}
        <div className="hz-chiprow">
          <Chip onClick={() => {}}>Invite someone</Chip>
          <Chip onClick={() => {}}>Name a co lead</Chip>
          <Chip tone={isFull ? 'full' : ''} onClick={() => setFull(post.id, !isFull)}>{isFull ? 'We are full' : 'Mark the HAÜS full'}</Chip>
        </div>
      </div>
    </div>
  );
}

function Workspace({ post }){
  const { route, go } = useHaus();
  const tab = route.tab || 'chat';
  const tabs = [['chat','House chat','message'],['places','Places','home'],['dates','Dates','events'],['people','People','community']];
  return (
    <div className="hz-ws pdx-glass-rebind">
      <div className="hz-wstabs" role="tablist">
        {tabs.map(([k,l,ic]) => (
          <button key={k} role="tab" className="hz-wstab" aria-selected={tab === k} onClick={() => go('haus', post.id, k)}><Icon name={ic} />{l}</button>
        ))}
      </div>
      <div className="hz-wsbody">
        {tab === 'chat' ? <HouseChat post={post} /> : tab === 'places' ? <Places post={post} /> : tab === 'dates' ? <Dates post={post} /> : <People post={post} />}
      </div>
    </div>
  );
}

function HausDetail({ post }){
  const { go, full, joined, requestJoin, waitlist, joinWaitlist, t } = useHaus();
  const isFull = full[post.id] ?? post.full;
  const people = post.members.map(m => m.p);
  const lead = post.members.find(m => m.role === 'Lead');
  return (
    <div className="pdx-glass-rebind" style={{'--_c':TYPE_C.forming,'--c':TYPE_C.forming,'--hz-accent':TYPE_C.forming}}>
      <div className="hz-pad"><div className="hz-wrap">
        <Back />
        <div className="hz-dhead">
          <Well photos={post.photos} title={post.house}>
            <Cluster people={people} pets={post.pets || []} size="md" slots={isFull ? 0 : post.seeking} />
            <Mono micro>{isFull ? 'The place we signed' : 'What we are picturing'}</Mono>
          </Well>
          <div className="hz-chiprow" style={{margin:'16px 0 12px'}}>
            <TypeTitle type="forming" />
            {post.flavor ? <Chip>{window.HAUS.FLAVOR[post.flavor].label}</Chip> : null}
            {isFull ? <Chip tone="full">We are full</Chip> : <Chip tone="accent">Looking for {post.seeking} more</Chip>}
          </div>
          <h2 className="hz-title hz-dttl">{post.house}</h2>
          <div style={{marginTop:8}}><Mono micro>{post.title} · led by {lead ? lead.p.name : 'the household'} · posted {post.posted}</Mono></div>
          {post.around ? (
            <button className="hz-around hz-around--btn" onClick={() => go('post', post.aroundId)}>
              <Icon name="venue" size={13} />
              <span>Forming around {post.around.name} · managed by {post.around.manager}</span>
              <Mono micro>Open the listing</Mono>
            </button>
          ) : null}
          <p className="hz-prose" style={{marginTop:14}}>{post.line}</p>
          <div className="hz-people" style={{marginTop:16}}>
            <Cluster people={people} size="lg" slots={isFull ? 0 : post.seeking} />
            <Mono micro>{isFull ? 'The household' : `${people.length} in, ${post.seeking} to go`}</Mono>
          </div>
        </div>

        {isFull ? (
          <div className="hz-sect">
            <div className="hz-note">This HAÜS is full. You can still join the waiting list, and the Lead will reach out if a spot opens. {(post.waitlist || 0) + (waitlist[post.id] ? 1 : 0)} people are waiting.</div>
          </div>
        ) : null}

        {post.flavor ? (
          <div className="hz-sect">
            <SectionTitle kicker="How this HAÜS works">{window.HAUS.FLAVOR[post.flavor].label}</SectionTitle>
            <p className="hz-prose">{window.HAUS.FLAVOR[post.flavor].note}</p>
          </div>
        ) : null}

        <div className="hz-sect">
          <div className="hz-tiles">
            <Tile label="Combined budget" value={post.budget} />
            <Tile label="Target move in" value={post.moveIn} />
            <Tile label="Looking in" value={post.areas.join(', ')} />
          </div>
        </div>

        <div className="hz-sect">
          <SectionTitle kicker="The plan">What this household wants</SectionTitle>
          <p className="hz-prose">{post.about}</p>
          <div className="hz-chiprow" style={{marginTop:14}}>{post.goals.map(g => <Chip key={g}>{g}</Chip>)}</div>
        </div>

        <div className="hz-sect">
          <SectionTitle kicker="Who is in">The household so far</SectionTitle>
          <div className="hz-members">
            {post.members.map(m => <Person key={m.p.id} p={m.p} line={m.line} badge={m.role === 'Lead' ? 'Lead' : null} />)}
            {(post.pets || []).map(p => <Pet key={p.name} pet={p} />)}
          </div>
        </div>

        <Context post={post} />

        {t.workspace ? (
          <div className="hz-sect">
            <SectionTitle kicker="Members only" right={<Mono micro>You are the Lead</Mono>}>The house hunt</SectionTitle>
            <Workspace post={post} />
          </div>
        ) : null}

        <Safety />
      </div></div>
      <div className="hz-actionbar">
        <div className="hz-wrap" style={{display:'flex',gap:10,width:'100%',alignItems:'center'}}>
          <Mono micro>{isFull ? 'Full for now' : 'One ask, the Lead accepts'}</Mono>
          <span style={{marginLeft:'auto'}}></span>
          {isFull ? (
            <Btn kind="solid" onClick={() => joinWaitlist(post.id)}><Icon name="connection" />{waitlist[post.id] ? 'On the waiting list' : 'Join the waiting list'}</Btn>
          ) : t.workspace ? (
            <Btn kind="solid" onClick={() => go('chat', post.id)}><Icon name="message" />Chat with {post.house}</Btn>
          ) : (
            <Btn kind="solid" onClick={() => requestJoin(post.id)}><Icon name="connection" />{joined[post.id] ? 'Request sent' : 'Ask to join and chat'}</Btn>
          )}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { HausDetail, Workspace, Places, Dates, People, HouseChat });
