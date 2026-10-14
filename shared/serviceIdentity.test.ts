import test from 'node:test';
import assert from 'node:assert/strict';
import { serviceIdentity, serviceArtwork, serviceWaypointLogo } from './serviceIdentity';
import { resolveDirectoryLogo } from './directoryLogos';

test('hair providers share the card and waypoint icon when their mark is a name placeholder', () => {
  const source = {name:'Greenhouse Hair Collective',type:'service'};
  assert.equal(serviceIdentity(source)?.kind,'hair');
  const logo=resolveDirectoryLogo(source.name);
  assert.ok(logo);
  assert.equal(serviceArtwork(source,logo),null);
  assert.equal(serviceWaypointLogo(source,logo),serviceIdentity({name:'Limelight Salon'})?.icon);
});
test('real company artwork is retained',()=>{
  const source={name:'Thrive Therapeutic Massage',type:'service'};
  assert.equal(serviceArtwork(source,'/official.svg'),'/official.svg');
  assert.equal(serviceWaypointLogo(source,'/official.svg'),'/official.svg');
});
test('referral copy and the sewing studio do not become hair or massage providers',()=>{
  assert.equal(serviceIdentity({name:'Sincere Studio',desc:'Community sewing studio'}),null);
  assert.equal(serviceIdentity({name:'Community Support',desc:'Referrals for massage and tattoo services'}),null);
  assert.equal(serviceIdentity({name:'Example',type:'service',description:'Therapeutic bodywork'} )?.kind,'massage');
});

test('saved real marks are recovered even when a caller omits its logo field',()=>{
  for (const name of ['Reconstructed Wellness','Bywater Health','Eagle Portland','Yes Coach','Pink Ponies','211info']) {
    const resolved=resolveDirectoryLogo(name);
    assert.ok(resolved, name);
    assert.equal(serviceArtwork({name}, undefined),resolved,name);
    assert.equal(serviceWaypointLogo({name},undefined),resolved,name);
  }
});
test('a newly supplied real image overrides a reviewed text placeholder',()=>{
  const source={name:'Greenhouse Hair Collective',type:'service'};
  assert.equal(serviceArtwork(source,'/uploaded-real-logo.svg'),'/uploaded-real-logo.svg');
  assert.equal(serviceArtwork(source,resolveDirectoryLogo(source.name)+'?v=1'),null);
});

test('reviewed resource artwork receives the current cache version',()=>{
 const source={name:'Northwest Gender Alliance'};
 const expected=resolveDirectoryLogo(source.name);
 assert.ok(expected);
 assert.equal(serviceArtwork(source,expected!.split('?')[0]+'?v=old'),expected);
});

 test('old color artwork cannot replace reviewed white company marks on cards or waypoints',()=>{
 for(const name of ['Brown Girl Rise','Pink Ponies','Oregon State Leather Contest','Yes Coach Productions','Portland Leather Alliance']){
 assert.equal(serviceArtwork({name},'/old-color.png',true),resolveDirectoryLogo(name));
 assert.equal(serviceWaypointLogo({name},'/old-color.png'),resolveDirectoryLogo(name));
 }
 });
 test('small cards use icons for authored text while open cards retain the fitted name',()=>{
 const source={name:'Sankofa Collective'};
 assert.equal(serviceArtwork(source,undefined,true),null);
 assert.ok(serviceArtwork(source,undefined));
 assert.equal(serviceArtwork({name:'An unreviewed provider'},'/real.svg',true),'/real.svg');
 });
