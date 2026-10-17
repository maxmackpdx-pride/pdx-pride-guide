export const housingTypes = {
  offering: { label: 'JOIN OUR HOÜZ', color: '#FF00CC', suffix: '/MO' },
  looking: { label: 'LOOKING TO RENT', color: '#FF6600', suffix: '/MO' },
  forming: { label: 'BUILDING A HOÜZ', color: '#39FF14', suffix: 'BUDGET' },
  managed: { label: 'MANAGED RENTAL', color: '#FF5F6D', suffix: '/MO' },
};
export function housingPrice(amount, suffix, compact = false) {
  const text = String(amount ?? '').trim().replace(/^\$\s*/, '');
  if (!text) return 'ASK FOR PRICE';
  const numeric = /^\d/.test(text);
  const price = numeric ? '$' + text : text;
  return compact && suffix === 'BUDGET' ? price : price + (suffix === '/MO' ? '/MO' : suffix ? ' ' + suffix : '');
}
export function householdCount(post) {
  if (!['forming', 'offering'].includes(post.intent)) return null;
  const total = Math.max(1, Math.min(99, Number(post.capacity) || 1));
  const count = Math.max(0, Math.min(total, Number(post.intent === 'forming' ? post.peopleIn : post.openRooms) || 0));
  return { count, total, label: post.intent === 'forming' ? 'IN' : 'OPEN' };
}
export const profilePlaceholder = '/boardz/punk/profile-placeholder.svg';
export function housingFaceMembers(post) {
  if (!['offering','forming','looking'].includes(post.intent)) return [];
  const profile = {
    name: post.author?.displayName || post.author?.username || 'Your profile',
    photo: post.author?.photoUrl || profilePlaceholder,
    userId: post.author?.userId,
    photoSource: 'profile',
  };
  const others = (post.members || []).slice(1).map(member => ({...member, photo: member.photo || member.photoUrl || profilePlaceholder}));
  if (post.intent === 'looking') {
    const count = Number(post.lookingPeople || 1) === 2 ? 2 : 1;
    return count === 2 ? [profile, others[0] || {name:'Second person',photo:profilePlaceholder}] : [profile];
  }
  return [profile, ...others];
}
export function housingFaceSlots(post) {
  const members=housingFaceMembers(post),occupancy=householdCount(post);
  if(!occupancy)return members;
  const filled=post.intent==='forming'?occupancy.count:occupancy.total-occupancy.count;
  return Array.from({length:occupancy.total},(_,i)=>i<filled
    ? {...(members[i]||{name:`Housemate ${i+1}`,photo:profilePlaceholder}),slotKey:`person-${i}`}
    : {name:'Open spot',open:true,slotKey:`open-${i-filled}`});
}
export function visibleHousingFaceSlots(post) {
  const slots=housingFaceSlots(post),visible=slots.slice(0,5);
  // Even a larger household keeps an open spot visible alongside its people.
  if(slots.some(slot=>slot.open)&&!visible.some(slot=>slot.open))visible[visible.length-1]=slots.find(slot=>slot.open);
  const hidden=slots.filter(slot=>!visible.includes(slot));
  return {visible,hiddenPeople:hidden.filter(slot=>!slot.open).length,hiddenOpen:hidden.filter(slot=>slot.open).length};
}
