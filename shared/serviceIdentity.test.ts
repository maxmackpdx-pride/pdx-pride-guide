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
