import test from 'node:test';
import assert from 'node:assert/strict';
import {sceneModel,sceneCategory,sceneTypes} from './sceneModel';
import type {CommunitySummary} from '@shared/community';
import {resolveDirectoryLogo} from '@shared/directoryLogos';
const source={id:'1',slug:'example',name:'Example',description:'A scene',imageUrl:null,neighborhood:null,visibility:'public',membershipPolicy:'open',memberCount:0,viewerRole:null,viewerMembershipStatus:null,viewerFollowing:false,canManage:false,sourcePlaceId:null,isClaimable:true,hasPendingClaim:false,sceneCategory:null,nextEvent:null} satisfies CommunitySummary;
test('unclassified API records never acquire invented club type or event',()=>{assert.equal(sceneCategory(source),null);assert.equal(sceneModel(source).kind,'Scene');assert.deepEqual(sceneModel(source).events,[]);});
test('display taxonomy contains clubs, party collectives and organizations only',()=>{assert.deepEqual(sceneTypes.map(t=>t[0]),['club','party-collective','organization']);});
test('party collective uses actual brand artwork/color without replacing native identity',()=>{const c={...source,id:'db-22',slug:'bearracuda',name:'Bearracuda',sceneCategory:'party-collective' as const};const model=sceneModel(c);assert.equal(model.name,c.name);assert.equal(model.color,'#ff7800');assert.equal(model.customArt,'/scenez-native/party-collage.png');});
test('schedule comes from API not saved demo fixture',()=>{const nextEvent={id:42,title:'Actual event',dateStart:'2027-01-01T20:00:00Z',dateEnd:'2027-01-02T01:00:00Z',venueName:'Venue',posterImageUrl:null,url:'/event/42'};assert.deepEqual(sceneModel({...source,nextEvent}).events,[nextEvent]);});
test('Q Center uses the reviewed separate logo without changing source image or background',()=>{
 const c=Object.freeze({...source,slug:'q-center',name:'Q Center',sceneCategory:'organization' as const,imageUrl:'https://static.wixstatic.com/legacy-q-center.jpg'});
 const model=sceneModel(c);
 assert.equal(model.logo,resolveDirectoryLogo('Q Center'));
 assert.match(model.logo!,/^\/directory-logos\/qcenter-white\.svg(?:\?|$)/);
 assert.equal(c.imageUrl,'https://static.wixstatic.com/legacy-q-center.jpg');
 const {id:overrideId,logo:overrideLogo,...rest}=model;
 const {id,logo,...unscoped}=sceneModel({...c,slug:'unscoped-q-center'});
 assert.deepEqual(rest,unscoped);
 assert.equal(model.image,undefined);
 assert.equal(model.customArt,undefined);
 assert.equal(sceneModel({...c,imageUrl:null}).logo,model.logo);
});
test('Q Center override does not change other image precedence or bespoke SceneZ artwork',()=>{
 for(const [slug,name] of [['basic-rights-oregon','Basic Rights Oregon'],['gaylabration','Gaylabration'],['westside-q-center','Westside Q Center'],['example','Q Center']]){
  const c={...source,slug,name,imageUrl:'https://example.com/existing-brand.jpg'};
  assert.equal(sceneModel(c).logo,c.imageUrl);
  assert.equal(sceneModel({...c,imageUrl:null}).logo,resolveDirectoryLogo(name)||undefined);
 }
 assert.equal(sceneModel({...source,slug:'pink-ponies',imageUrl:'https://example.com/legacy.png'}).logo,'/scenez-native/pink-ponies.png');
 assert.equal(sceneModel({...source,slug:'pride-northwest'}).customArt,'/scenez-native/pride-collage.png');
});
