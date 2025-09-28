// LocalStorage demo backend matching your contract exactly.
// Switch to Firebase later by replacing page imports with /services/meetups.js.

const KEY = 'sunhacks_store_v1';
const CUR = 'sunhacks_current_uid';
export const MEETUP_SPOTS = [
  'Hayden Library Lobby','MU Starbucks','Student Services Lawn','Polytechnic Student Union Desk'
];

function load() {
  const j = localStorage.getItem(KEY);
  if (j) return JSON.parse(j);
  const s = { users:{}, listings:{}, meetups:{} };
  localStorage.setItem(KEY, JSON.stringify(s));
  return s;
}
function save(s){ localStorage.setItem(KEY, JSON.stringify(s)); }

// Seed required fixtures if missing (EXACT field names)
(function seed(){
  const s = load();
  if (!s.users.u1) s.users.u1 = {
    uid:'u1', displayName:'Alex Doe', asuEmail:'adoe@asu.edu',
    reputation:{completedTrades:1, rating:5.0}, createdAt:1727400000000
  };
  if (!s.users.u2) s.users.u2 = {
    uid:'u2', displayName:'Sam Buyer', asuEmail:'sbuyer@asu.edu',
    reputation:{completedTrades:0, rating:5.0}, createdAt:1727400000000
  };
  if (!s.listings.seed1) s.listings.seed1 = {
    id:'seed1', ownerUid:'u1', title:'Calculus: ET', author:'Stewart',
    isbn:'9781285741550', edition:'8th', courseCodes:['MAT265'], price:35,
    imageUrl:'https://via.placeholder.com/300x400?text=Book', status:'active',
    searchKeys:['CALCULUS','STEWART','MAT265','9781285741550'],
    createdAt:1727400000000
  };
  save(s);
})();

export function signInAs(uid){
  const s = load(); if(!s.users[uid]) throw new Error('No such user'); localStorage.setItem(CUR, uid);
}
export function currentUser(){
  let uid = localStorage.getItem(CUR) || 'u2';
  const s = load(); if(!s.users[uid]) { uid='u2'; signInAs(uid); }
  return s.users[uid];
}
export function getListing(id){
  const s=load(); const l=s.listings[id]; if(!l) throw new Error('Listing not found'); return l;
}
export function listMeetupsBy(uid, role){
  const s=load(); const out=[];
  for (const [id,m] of Object.entries(s.meetups)) {
    if (role==='buyer' && m.buyerUid===uid) out.push({...m,id});
    if (role==='seller' && m.sellerUid===uid) out.push({...m,id});
  }
  return out.sort((a,b)=>a.createdAt-b.createdAt);
}
function ensureNoDupProposal(listingId,buyerUid){
  const s=load();
  for (const m of Object.values(s.meetups)) {
    if (m.listingId===listingId && m.buyerUid===buyerUid &&
        (m.status==='proposed'||m.status==='accepted'))
      throw new Error('You already have a pending meetup for this listing');
  }
}

// Contract functions (names/behavior EXACT)
export async function proposeMeetup({ listingId, buyerUid, sellerUid, spot, timeISO }){
  if (!MEETUP_SPOTS.includes(spot)) throw new Error('Invalid spot');
  const s=load(); const listing=s.listings[listingId];
  if (!listing) throw new Error('Listing not found');
  if (!(listing.status==='active'||listing.status==='pending_meetup')) throw new Error('Listing not available');
  ensureNoDupProposal(listingId,buyerUid);
  const id='m'+Date.now();
  s.meetups[id]={ listingId, buyerUid, sellerUid, spot, timeISO, status:'proposed', createdAt:Date.now() };
  listing.status='pending_meetup';
  save(s);
  return id;
}
export async function acceptMeetup(id){
  const s=load(); const m=s.meetups[id]; if(!m) throw new Error('Meetup not found');
  if(m.status!=='proposed') throw new Error('Only proposed meetups can be accepted');
  m.status='accepted'; s.listings[m.listingId].status='meetup_set'; save(s);
}
export async function completeMeetup(id){
  const s=load(); const m=s.meetups[id]; if(!m) throw new Error('Meetup not found');
  if(m.status!=='accepted' && m.status!=='proposed') throw new Error('Only proposed/accepted meetups can be completed');
  m.status='completed'; s.listings[m.listingId].status='sold';
  const seller=s.users[m.sellerUid];
  seller.reputation.completedTrades=(seller.reputation.completedTrades||0)+1;
  save(s);
}
