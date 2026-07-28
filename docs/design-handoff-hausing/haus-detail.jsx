/* HAÜS post detail views. Conversation first: no application stands between interest and hello. */
const { Avatar: DetailAvatar } = window.ZaylistDesignSystem_f2a62f;

function Back({ to = 'board' }){
  const { go } = useHaus();
  return <button className="hz-back" onClick={() => go(to)}><Mono>← Back to HAÜS</Mono></button>;
}

function ActionBar({ post, extra }){
  const { go, saved, toggleSave } = useHaus();
  const managed = post.type === 'managed';
  return (
    <div className="hz-actionbar">
      <div className="hz-wrap" style={{display:'flex',gap:10,width:'100%',alignItems:'center'}}>
        <Btn onClick={() => toggleSave(post.id)}><Icon name="favorite" />{saved[post.id] ? 'Saved' : 'Save'}</Btn>
        {extra}
        <span style={{marginLeft:'auto'}}></span>
        {managed ? (
          <React.Fragment>
            <Mono micro>{post.site}</Mono>
            <Btn kind="solid" onClick={() => {}}><Icon name="share" />View listing</Btn>
          </React.Fragment>
        ) : (
          <Btn kind="solid" onClick={() => go('chat', post.id)}><Icon name="message" />Chat with {post.type === 'offering' ? 'the household' : post.person.name.split(' ')[0]}</Btn>
        )}
      </div>
    </div>
  );
}

function Context({ post }){
  const { t } = useHaus();
  if (!t.trustChips) return null;
  const d = post.trust;
  return (
    <div className="hz-sect">
      <SectionTitle kicker="Community context">Where you overlap</SectionTitle>
      <div className="hz-tiles">
        <Tile label="Mutual connections" value={d.mutuals} />
        <Tile label="Events you both went to" value={d.events} />
        <Tile label="On Zaylist since" value={d.since} />
        {d.verified ? <Tile label="Verified" value={d.verified.replace(' verified','')} /> : null}
      </div>
      <p style={{marginTop:10,color:'var(--text-lo)',fontSize:'var(--meta)'}}>Context, not a score. Zaylist does not rank people or decide who should live together.</p>
    </div>
  );
}

function Safety(){
  return (
    <div className="hz-sect">
      <div className="hz-note"><Icon name="safety" size={15} />
        Zaylist never handles rent, deposits, or fees. Anyone asking you to send money through this site is not from this site.
        <div style={{marginTop:8}}><Chip onClick={() => {}}>Report this post</Chip> <Chip onClick={() => {}}>Block</Chip></div>
      </div>
    </div>
  );
}

function LookingDetail({ post }){
  const { convertToHaus } = useHaus();
  return (
    <div className="pdx-glass-rebind" style={{'--_c':TYPE_C.looking,'--c':TYPE_C.looking,'--hz-accent':TYPE_C.looking}}>
      <div className="hz-pad"><div className="hz-wrap">
        <Back />
        <div className="hz-dhead">
          <Well photos={post.photos} title={post.person.name} nameCap={0.35}>
            <Cluster people={[post.person]} pets={post.pets || []} size="md" scale={1.5} />
            <Mono micro>Meet {post.person.name.split(' ')[0]}</Mono>
          </Well>
          <div className="hz-chiprow" style={{margin:'16px 0 12px'}}>
            <TypeTitle type="looking" />
            {post.open ? <Chip tone="haus">Open to forming or joining a HAÜS</Chip> : null}
          </div>
          <h2 className="hz-title hz-dttl">{post.person.name}</h2>
          <div style={{marginTop:8}}><Mono micro>{post.person.pro} · posted {post.posted}</Mono></div>
          <p className="hz-prose" style={{marginTop:14}}>{post.line}</p>
        </div>

        <div className="hz-sect">
          <div className="hz-tiles">
            <Tile label="Budget" value={post.budget} />
            <Tile label="Move timeline" value={post.timeline} />
            <Tile label="Neighborhoods" value={post.areas.join(', ')} />
          </div>
        </div>

        <div className="hz-sect">
          <SectionTitle kicker="Who they are">Meet {post.person.name.split(' ')[0]}</SectionTitle>
          <div className="hz-members">
            <Person p={post.person} line={post.line} scale={1.5} />
            {(post.pets || []).map(p => <Pet key={p.name} pet={p} />)}
          </div>
          <p className="hz-prose" style={{marginTop:14}}>{post.about}</p>
          <div className="hz-chiprow" style={{marginTop:14}}>{post.living.map(l => <Chip key={l}>{l}</Chip>)}</div>
        </div>

        {post.photos && post.photos.length ? (
          <div className="hz-sect">
            <SectionTitle kicker="A few photos" right={<Mono micro>{post.photos.length} of 4</Mono>}>Their own pictures</SectionTitle>
            <Well photos={post.photos}>
              <Mono micro>Posted by {post.person.name.split(' ')[0]}</Mono>
            </Well>
          </div>
        ) : null}

        <div className="hz-sect">
          <SectionTitle kicker="Looking for">What would work</SectionTitle>
          <p className="hz-prose">{post.lookingFor}</p>
        </div>

        <Context post={post} />

        {post.open ? (
          <div className="hz-sect">
            <SectionTitle kicker="Poster view">This post can change</SectionTitle>
            <p className="hz-prose">{post.person.name.split(' ')[0]} can turn this into a HAÜS without losing the post or the replies. Same post, same conversation, plus a shared workspace.</p>
            <div style={{marginTop:12}}><Btn kind="outline" onClick={() => convertToHaus(post.id)}><Icon name="home" />Turn this into a HAÜS</Btn></div>
          </div>
        ) : null}

        <Safety />
      </div></div>
      <ActionBar post={post} />
    </div>
  );
}

function OfferingDetail({ post }){
  return (
    <div className="pdx-glass-rebind" style={{'--_c':TYPE_C.offering,'--c':TYPE_C.offering,'--hz-accent':TYPE_C.offering}}>
      <div className="hz-pad"><div className="hz-wrap">
        <Back />
        <div className="hz-dhead">
          <Well photos={post.photos} title={post.house} nameCap={0.35}>
            <Cluster people={post.household.map(h => h.p)} pets={post.pets || []} size="md" scale={1.5} />
            <Mono micro>Meet the household</Mono>
          </Well>
          <div className="hz-chiprow" style={{margin:'16px 0 12px'}}>
            <TypeTitle type="offering" />
            {post.trust.verified ? <Chip>{post.trust.verified}</Chip> : null}
          </div>
          <h2 className="hz-title hz-dttl">{post.house}</h2>
          <div style={{marginTop:8}}><Mono micro>{post.title} · posted {post.posted}</Mono></div>
          <p className="hz-prose" style={{marginTop:14}}>{post.line}</p>
        </div>

        <div className="hz-sect">
          <SectionTitle kicker="Who lives here">Meet the household</SectionTitle>
          <div className="hz-members">
            {post.household.map(h => <Person key={h.p.id} p={h.p} line={h.line} scale={1.5} badge={h.p.offsite ? 'Not on Zaylist' : null} />)}
            {(post.pets || []).map(p => <Pet key={p.name} pet={p} />)}
          </div>
          <p className="hz-prose" style={{marginTop:14}}>{post.about}</p>
        </div>

        <div className="hz-sect">
          <SectionTitle kicker="House culture">How the house runs</SectionTitle>
          <div className="hz-chiprow">{post.culture.map(c => <Chip key={c}>{c}</Chip>)}</div>
        </div>

        <div className="hz-sect">
          <SectionTitle kicker="Honest numbers">Monthly and move in, kept separate</SectionTitle>
          <div className="hz-money">
            <div className="hz-panel">
              <Mono accent>Every month</Mono>
              <div className="hz-rows" style={{marginTop:10}}>
                <Row label="Rent" value={post.rent} />
                <Row label="Utilities" value={post.rentNote} />
              </div>
            </div>
            <div className="hz-panel">
              <Mono accent>To move in</Mono>
              <div className="hz-rows" style={{marginTop:10}}>
                <Row label="Deposit" value={post.deposit} />
                <Row label="Paid to" value="The household, off Zaylist" />
              </div>
            </div>
          </div>
        </div>

        <div className="hz-sect">
          <SectionTitle kicker="Access">Standard information, never a filter</SectionTitle>
          <div className="hz-rows">
            {post.access.map(a => <Row key={a} label={a} value="" />)}
          </div>
        </div>

        <div className="hz-sect">
          <SectionTitle kicker="Roughly here" right={<Mono micro><Icon name="navigate" size={12} />{post.area}</Mono>}>{post.area}</SectionTitle>
          <div className="hz-map"><span className="hz-map__blob"></span></div>
          <p style={{marginTop:10,color:'var(--text-lo)',fontSize:'var(--meta)'}}>Approximate. The exact address stays private until the household shares it.</p>
        </div>

        <div className="hz-sect">
          <SectionTitle kicker="The room">{post.room}</SectionTitle>
          <div className="hz-tiles">
            <Tile label="Available" value={post.moveIn} />
            <Tile label="Rent" value={post.rent} />
            <Tile label="Household size" value={`${post.household.length} people`} />
          </div>
        </div>

        <Context post={post} />
        <Safety />
      </div></div>
      <ActionBar post={post} />
    </div>
  );
}

/* Managed property detail. Plain informational listing: full Fair Housing applies,
   so no household, no openness flag, no community context, no conversion. */
function ManagedDetail({ post }){
  const { posts, buildHaus, takeDown, go, requestJoin, joined } = useHaus();
  const groups = posts.filter(p => p.type === 'forming' && p.aroundId === post.id);
  const mine = groups.find(g => (g.members || []).some(m => m.p.id === 'frankie'));
  return (
    <div className="pdx-glass-rebind" style={{'--_c':TYPE_C.managed,'--c':TYPE_C.managed,'--hz-accent':TYPE_C.managed}}>
      <div className="hz-pad"><div className="hz-wrap">
        <Back />
        <div className="hz-dhead">
          <Well photos={post.photos} title={post.house} nameCap={0.35}>
            <span className="hz-pmbadge"><Icon name="verified" size={14} />Property manager</span>
            <Mono micro>{post.manager.name}</Mono>
          </Well>
          <div className="hz-chiprow" style={{margin:'16px 0 12px'}}>
            <TypeTitle type="managed" />
            <Chip>{post.trust.verified}</Chip>
          </div>
          <h2 className="hz-title hz-dttl">{post.house}</h2>
          <div style={{marginTop:8}}><Mono micro>{post.title} · {post.seen}</Mono></div>
          {post.gone ? <div className="hz-around" style={{marginTop:12}}><Icon name="verified" size={13} /><span>Off the market. The manager took this listing down.</span></div> : null}
          <div className="hz-around" style={{marginTop:12}}><Icon name="search" size={13} /><span>{post.source}. Managed listings come in from the manager site scan, so availability stays current.</span></div>
          <p className="hz-prose" style={{marginTop:14}}>{post.line}</p>
        </div>

        <div className="hz-sect">
          <SectionTitle kicker="The unit">What you get</SectionTitle>
          <div className="hz-tiles">
            <Tile label="Bedrooms" value={post.beds} />
            <Tile label="Bathrooms" value={post.baths} />
            <Tile label="Parking" value={post.parking} />
            <Tile label="Outdoor" value={post.outdoor} />
          </div>
          {(post.badges || []).length ? (
            <div className="hz-chiprow" style={{marginTop:12}}>
              {post.badges.map(b => <Chip key={b} tone="accent">{b}</Chip>)}
            </div>
          ) : null}
        </div>

        <div className="hz-sect">
          <SectionTitle kicker="Honest numbers">Monthly and move in, kept separate</SectionTitle>
          <div className="hz-money">
            <div className="hz-panel">
              <Mono accent>Every month</Mono>
              <div className="hz-rows" style={{marginTop:10}}>
                <Row label="Rent" value={post.rent} />
                <Row label="Utilities" value={post.rentNote} />
              </div>
            </div>
            <div className="hz-panel">
              <Mono accent>To move in</Mono>
              <div className="hz-rows" style={{marginTop:10}}>
                <Row label="Deposit" value={post.deposit} />
                <Row label="Paid to" value="The manager, off Zaylist" />
              </div>
            </div>
          </div>
        </div>

        <div className="hz-sect">
          <SectionTitle kicker="Access">Standard information, never a filter</SectionTitle>
          <div className="hz-rows">{post.access.map(a => <Row key={a} label={a} value="" />)}</div>
        </div>

        <div className="hz-sect">
          <SectionTitle kicker="Roughly here" right={<Mono micro><Icon name="navigate" size={12} />{post.area}</Mono>}>{post.area}</SectionTitle>
          <div className="hz-map"><span className="hz-map__blob"></span></div>
          <p style={{marginTop:10,color:'var(--text-lo)',fontSize:'var(--meta)'}}>Approximate. The manager shares the address when you apply.</p>
        </div>

        <div className="hz-sect">
          <SectionTitle kicker="Renters organizing" right={<Mono micro>{groups.length ? `${groups.length} forming` : 'None yet'}</Mono>}>Build a HAÜS around this place</SectionTitle>
          <p className="hz-prose">Nobody has to rent it alone. Start a HAÜS and the unit lands on your shortlist as the target, with the availability date already in your important dates. This does not claim or reserve anything. The listing stays live and more than one group can form on it.</p>
          {groups.length ? (
            <div className="hz-groups">
              {groups.map(g => (
                <div className="hz-group" key={g.id}>
                  <Cluster people={g.members.map(m => m.p)} size="md" slots={g.seeking} />
                  <div className="hz-group__txt">
                    <b>{g.house}</b>
                    <Mono micro>{g.members[0].p.name.split(' ')[0]} leads · {g.members.length} in, {g.seeking} to go</Mono>
                  </div>
                  {g === mine
                    ? <Btn size="sm" kind="outline" onClick={() => go('haus', g.id, 'places')}><Icon name="home" />Open</Btn>
                    : <Btn size="sm" kind="solid" onClick={() => requestJoin(g.id)}><Icon name="message" />{joined[g.id] ? 'Request sent' : 'Ask to join'}</Btn>}
                </div>
              ))}
            </div>
          ) : null}
          <div style={{marginTop:14,display:'flex',gap:10,flexWrap:'wrap'}}>
            <Btn kind="solid" onClick={() => mine ? go('haus', mine.id, 'places') : buildHaus(post.id)}><Icon name="home" />{mine ? 'Open your HAÜS' : 'Build a HAÜS around this place'}</Btn>
          </div>
        </div>

        <div className="hz-sect">
          <SectionTitle kicker="Who is renting it">{post.manager.name}</SectionTitle>
          <p className="hz-prose">{post.manager.line}. On Zaylist since {post.manager.since}.</p>
          <p className="hz-prose" style={{marginTop:10}}>{post.about}</p>
          <p className="hz-prose" style={{marginTop:10,color:'var(--text-lo)'}}>The manager sees groups forming and can say hello, but is never asked to. No obligation, no hold on the unit.</p>
          <div style={{marginTop:12}}><Btn kind="outline" onClick={() => {}}><Icon name="share" />View the listing on {post.site.split('/')[0]}</Btn>
            <p style={{marginTop:8,color:'var(--text-lo)',fontSize:'var(--meta-sm)'}}>Applications and payments happen on the manager site. Zaylist never handles money.</p></div>
          {groups.length ? (
            <div style={{marginTop:14}}><Btn kind="outline" onClick={() => takeDown(post.id)}>Manager takes this listing down</Btn>
              <p style={{marginTop:8,color:'var(--text-lo)',fontSize:'var(--meta-sm)'}}>Prototype control. Every HAÜS formed around it is told and switches to finding a place together, so the group survives the listing.</p></div>
          ) : null}
        </div>

        <Safety />
      </div></div>
      <ActionBar post={post} />
    </div>
  );
}

function Chat({ post }){
  const { threads, send, go } = useHaus();
  const [text, setText] = React.useState('');
  const msgs = threads[post.id] || [];
  const managed = post.type === 'managed';
  const who = managed ? post.manager.name : post.type === 'looking' ? post.person.name : post.house;
  const people = post.type === 'offering' ? post.household.map(h => h.p) : post.type === 'forming' ? post.members.map(m => m.p) : managed ? [] : [post.person];
  const submit = (e) => { e.preventDefault(); if (!text.trim()) return; send(post.id, text.trim()); setText(''); };
  return (
    <div className="hz-pad"><div className="hz-wrap">
      <button className="hz-back" onClick={() => go(post.type === 'forming' ? 'haus' : 'post', post.id)}><Mono>← Back to the post</Mono></button>
      <div style={{display:'flex',gap:12,alignItems:'center',paddingBottom:14}}>
        {people.length ? <Cluster people={people} size="md" /> : <span className="hz-pmbadge"><Icon name="verified" size={13} />Property manager</span>}
        <div>
          <div className="hz-cardttl">{who}</div>
          <Mono micro>{managed ? 'Conversation · you and the manager' : `Group conversation · ${people.length + 1} people`}</Mono>
        </div>
      </div>
      <div className="hz-attach">
        <Mono accent>Attached</Mono>
        <span style={{flex:1,color:'var(--board-muted)'}}>{post.type === 'looking' ? post.title : post.house}</span>
        <Chip onClick={() => go(post.type === 'forming' ? 'haus' : 'post', post.id)}>Open</Chip>
      </div>
      <div className="hz-chat">
        {msgs.map((m,i) => (
          <div key={i} className={`hz-msg${m.me?' hz-msg--me':''}`}>{m.text}<small>{m.me ? 'You' : m.who} · {m.when}</small></div>
        ))}
        {msgs.length === 0 ? <div className="hz-empty">No messages yet. Say hello.</div> : null}
      </div>
      <form className="hz-composer" onSubmit={submit}>
        <input className="hz-input" value={text} onChange={e => setText(e.target.value)} placeholder="Say hello" />
        <Btn size="sm" kind="solid" type="submit">Send</Btn>
      </form>
      <p style={{color:'var(--text-lo)',fontSize:'var(--meta)',paddingBottom:20}}>This is the same inbox as the rest of Zaylist. Nothing housing specific about it.</p>
    </div></div>
  );
}

Object.assign(window, { LookingDetail, OfferingDetail, ManagedDetail, Chat, Back, ActionBar, Context, Safety });
