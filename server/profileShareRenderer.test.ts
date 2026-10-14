import test, {after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import sharp from 'sharp';
// Set before loading storage: these tests never read or update the production/seed database.
process.env.DATABASE_PATH = ':memory:';
const {storage, sqlite} = await import('./storage');
const {renderProfileOgCard, renderPublicProfileArtwork} = await import('./ogCards');
after(()=>sqlite.close());
const photoUrl = '/tucker-yes-coach-2.jpg';
const basic = {username:'synthetic-share-profile',displayName:'Synthetic Profile',photoUrl,accentColor:'#00FFFF'};
test('local photo and monogram fallback render real 1200×630 PNGs with distinct photo content',async()=>{
 const photo=await renderPublicProfileArtwork(basic,basic.username);
 const fallback=await renderPublicProfileArtwork({...basic,photoUrl:null},basic.username);
 for(const image of [photo,fallback]){const m=await sharp(image).metadata();assert.equal(m.format,'png');assert.equal(m.width,1200);assert.equal(m.height,630);}
 const pixel=async(image:Buffer)=>sharp(image).extract({left:300,top:250,width:8,height:8}).raw().toBuffer();
 assert.notDeepEqual(await pixel(photo),await pixel(fallback));
 fs.writeFileSync('/private/tmp/profile-social-photo.png',photo);fs.writeFileSync('/private/tmp/profile-social-fallback.png',fallback);
});
test('long names and XML characters remain safe valid image output',async()=>{
 const image=await renderPublicProfileArtwork({...basic,displayName:'A very long public display name <script>& "double" \'single\' '.repeat(4)},basic.username);
 const m=await sharp(image).metadata();assert.equal(m.width,1200);assert.equal(m.height,630);
 fs.writeFileSync('/private/tmp/profile-social-long-name.png',image);
});
test('inactive account returns no image even after a cached public render',async()=>{
 const user=storage.createUser({username:basic.username,email:'synthetic-share@example.invalid',passwordHash:'test-only-password',displayName:basic.displayName});
 storage.updateUser(user.id,{photoUrl,accentColor:'#00FFFF'});
 const first=await renderProfileOgCard(user.username);assert.ok(first);
 const cached=await renderProfileOgCard(user.username);assert.equal(cached,first);
 sqlite.prepare('UPDATE users SET status=? WHERE id=?').run('suspended',user.id);
 assert.equal(await renderProfileOgCard(user.username),null);
 assert.equal(await renderProfileOgCard('missing-synthetic-profile'),null);
});

test('brand name glyphs render the full measured title rather than a clipped first letter',async()=>{
 const {profileShareDisplayPath}=await import('./profileShareType');
 const glyphs=profileShareDisplayPath('SYNTHETIC PROFILE',{x:48,y:569,width:1104,height:45,maxSize:44},'#ffffff');
 assert.ok(glyphs);assert.doesNotMatch(glyphs,/NaN|Infinity/);
 const svg=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="black"/>${glyphs}</svg>`);
 const pixels=await sharp(svg).extract({left:200,top:570,width:170,height:45}).removeAlpha().raw().toBuffer();
 assert.ok(pixels.some(value=>value>240),'the title continues beyond its first glyph');
 assert.equal(profileShareDisplayPath('😀',{x:0,y:0,width:100,height:100,maxSize:50},'#fff'),null,'unsupported glyph retains caller fallback');
});
