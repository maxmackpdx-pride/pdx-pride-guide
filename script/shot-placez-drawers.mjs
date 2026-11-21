import {createServer} from 'vite';
import react from '@vitejs/plugin-react';
import {chromium} from 'playwright';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {mkdir} from 'node:fs/promises';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const shots = '/workspace/drawers/shots';
const fixture = 'script/fixtures/placez-drawers-browser.tsx';
await mkdir(shots, {recursive: true});

function pad(n) { return String(n).padStart(2, '0'); }
function localDateAt(offsetDays, hour, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(hour, minute, 0, 0);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
}
function dayOfWeek(iso) {
  const [y, m, d] = iso.split('T')[0].split('-').map(Number);
  return ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][new Date(y, m - 1, d).getDay()];
}

const yesStart = localDateAt(1, 21, 0);
const lateStart = localDateAt(1, 23, 0);
const brunchStart = localDateAt(2, 11, 0);

function eventRow(partial) {
  const dateStart = partial.dateStart;
  const end = new Date(dateStart);
  end.setHours(end.getHours() + 5);
  return {
    description: 'Example listing used for drawer and card screenshots.',
    address: 'Portland',
    neighborhood: 'Downtown',
    lat: 45.5241,
    lng: -122.6757,
    dateEnd: `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}T${pad(end.getHours())}:${pad(end.getMinutes())}:00`,
    dayOfWeek: dayOfWeek(dateStart),
    ageRequirement: 'ALL_AGES',
    eventTypes: '["party"]',
    admission: 'FREE',
    ticketUrl: null,
    isPublic: true,
    isPrivate: false,
    isHouseParty: false,
    isSexPositive: false,
    nudityOk: false,
    accentColor: null,
    status: 'LIVE',
    source: 'admin_seeded',
    isClaimable: false,
    claimedBy: null,
    submittedBy: null,
    adminNotes: null,
    createdAt: '',
    updatedAt: '',
    lockedFields: '[]',
    lastChangeLabel: null,
    lastChangeAt: null,
    ...partial,
  };
}

const yesCoach = eventRow({
  id: 10,
  title: 'Yes Coach',
  venueName: 'Sanctuary',
  dateStart: yesStart,
  posterImageUrl: '/posters/tucker-archive/yes-coach-apr-2026.jpg',
});
const lateShow = eventRow({
  id: 12,
  title: 'Late show',
  venueName: 'Holocene',
  dateStart: lateStart,
  posterImageUrl: '/posters/tucker-archive/yes-coach-apr-2026.jpg',
  lat: 45.5243,
  lng: -122.6758,
});
const brunch = eventRow({
  id: 13,
  title: 'Tomorrow brunch',
  venueName: 'Dining Room',
  dateStart: brunchStart,
  posterImageUrl: '/posters/tucker-archive/cozy-2025.jpg',
  lat: 45.5240,
  lng: -122.6755,
});
const events = [yesCoach, lateShow, brunch];

const upcoming = {
  event: yesCoach,
  occurrenceDate: yesStart.slice(0, 10),
  plans: {
    gigz: [{id: 20, title: 'Door host'}],
    carpools: [{id: 30, direction: 'Arriving', area: 'Alberta', role: 'driver'}, {id: 31, direction: 'Departing', area: 'Division', role: 'rider'}],
    afterz: [{id: 'g1', title: 'After hours', role: 'host'}],
  },
  mizzedClosesAt: null,
};
const past = {
  event: eventRow({
    id: 11,
    title: 'Past dance',
    venueName: 'Cleveland',
    dateStart: '2026-11-13T21:00:00',
    dateEnd: '2026-11-14T02:00:00',
    posterImageUrl: '/posters/tucker-archive/cozy-2025.jpg',
    dayOfWeek: 'FRI',
    status: 'LIVE',
  }),
  occurrenceDate: '2026-11-13',
  plans: {gigz: [], carpools: [], afterz: []},
  mizzedClosesAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
};
const places = [
  {id: 9001, name: 'Sanctuary', type: 'venue', description: 'Venue', address: 'Portland', neighborhood: 'Downtown', website: null, instagram: null, donateUrl: null, hours: null, phone: null, queerOwned: true, queerFriendly: true, imageUrl: null, lat: 45.5241, lng: -122.6757, isNew: false},
  {id: 9002, name: 'Coffee Beer', type: 'cafe', description: 'Cafe', address: 'Portland', neighborhood: 'Alberta', website: null, instagram: null, donateUrl: null, hours: null, phone: null, queerOwned: true, queerFriendly: true, imageUrl: null, lat: 45.5245, lng: -122.6760, isNew: false},
  {id: 9003, name: 'Dining Room', type: 'restaurant', description: 'Restaurant', address: 'Portland', neighborhood: 'Downtown', website: null, instagram: null, donateUrl: null, hours: null, phone: null, queerOwned: true, queerFriendly: true, imageUrl: null, lat: 45.5240, lng: -122.6755, isNew: false},
];

const yesDetail = {
  event: yesCoach,
  venue: {id: 9001, name: 'Sanctuary', type: 'venue', neighborhood: 'Downtown', address: 'Portland', imageUrl: null, lat: 45.5241, lng: -122.6757},
  hosts: [{userId: 1, username: 'qa', displayName: 'Party Collective', photoUrl: null, role: 'host'}],
  talent: [],
  gigs: [{id: 20, title: 'Door host', postType: 'gig', createdAt: yesStart, location: 'Sanctuary', description: 'Example gig for this screenshot.'}],
  missedConnections: [],
  nearby: {restaurants: [{id: 9003, name: 'Dining Room', type: 'restaurant', neighborhood: 'Downtown'}], events: [lateShow]},
};

const server = await createServer({
  configFile: false,
  root,
  publicDir: path.join(root, 'client/public'),
  plugins: [react(), {
    name: 'placez-drawer-qa',
    configureServer(s) {
      s.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/__drawer-qa')) return next();
        const html = await s.transformIndexHtml(req.url, '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;background:#000}</style></head><body><div id="root"></div><script type="module" src="/script/fixtures/placez-drawers-browser.tsx"></script></body></html>');
        res.setHeader('Content-Type', 'text/html');
        res.end(html);
      });
    },
  }],
  resolve: {alias: {'@': path.join(root, 'client/src'), '@shared': path.join(root, 'shared'), '@assets': path.join(root, 'attached_assets')}},
  server: {host: '127.0.0.1', port: 0, hmr: false, watch: null},
});

await server.listen();
await server.warmupRequest('/' + fixture);
const base = server.resolvedUrls.local[0];
const browser = await chromium.launch({headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
const context = await browser.newContext({isMobile: true, hasTouch: true, viewport: {width: 390, height: 844}, deviceScaleFactor: 2, reducedMotion: 'reduce'});
await context.addInitScript(event => {
  window.__QA_YES_COACH = event;
  const assign = window.location.assign.bind(window.location);
  window.location.assign = href => {
    const url = String(href);
    if (url.includes('event=')) {
      const next = new URL(url, window.location.origin);
      window.history.pushState({}, '', next.pathname + next.search);
      window.dispatchEvent(new Event('placez-mizzed-open'));
      return;
    }
    assign(url);
  };
}, yesCoach);
await context.route('**/api/**', route => {
  const req = route.request();
  const p = new URL(req.url()).pathname;
  if (req.method() !== 'GET') return route.fulfill({status: 204, body: ''});
  if (p === '/api/auth/session') return route.fulfill({json: {id: 1, username: 'qa', status: 'active'}});
  if (p === '/api/events/mine/drawer-plans') return route.fulfill({json: {upcoming: [upcoming], past: [past]}});
  if (p === '/api/events/mine/check-ins') return route.fulfill({json: [{eventId: 10}, {eventId: 11}]});
  if (p === '/api/events') return route.fulfill({json: events});
  if (p === '/api/events/10' || p.startsWith('/api/events/10/detail')) return route.fulfill({json: p.includes('/detail') ? yesDetail : yesCoach});
  if (/\/api\/events\/\d+\/occurrences\/[^/]+\/planning$/.test(p)) {
    return route.fulfill({json: {
      checked: false,
      onSiteWindow: false,
      poster: yesCoach.posterImageUrl,
      venue: 'Sanctuary',
      title: 'Yes Coach',
      open: true,
      canPostGig: false,
      gigs: [{id: 20, title: 'Door host'}],
      rides: [],
    }});
  }
  if (p === '/api/directory') return route.fulfill({json: places});
  if (p.startsWith('/api/placez/')) {
    return route.fulfill({json: {
      upcomingEvents: [lateShow, brunch],
      promoters: [{displayName: 'Party Collective', username: 'qa'}],
    }});
  }
  return route.fulfill({json: []});
});

const page = await context.newPage();
page.setDefaultTimeout(20000);
const errors = [];
page.on('pageerror', e => errors.push(e.message));

async function shot(name) {
  await page.waitForTimeout(400);
  await page.screenshot({path: path.join(shots, name)});
  console.log('WROTE', name);
}

await page.goto(`${base}__drawer-qa`, {waitUntil: 'networkidle'});
if (errors.length) console.log('EARLY_ERRORS', errors);
await page.getByRole('button', {name: /Open Placez/i}).click();
await page.getByTestId('drawer-top').waitFor();
await shot('placez-v10-map-drawer-top.png');

const inView = page.getByTestId('placez-in-view-rail');
await inView.waitFor();
await inView.scrollIntoViewIfNeeded();
const inViewList = page.getByRole('list', {name: 'In view on the map'});
if (await inViewList.count()) {
  await inViewList.evaluate(el => {
    const item = [...el.querySelectorAll('[role="listitem"]')].find(node => /Late show|Yes Coach/i.test(node.textContent || ''));
    item?.scrollIntoView({inline: 'center', block: 'nearest'});
  });
}
await shot('placez-v10-in-view-rail.png');

const upcomingRail = page.getByTestId('placez-upcoming-events-rail');
await upcomingRail.scrollIntoViewIfNeeded();
await shot('placez-v10-events-right-drawer.png');

const pastRail = page.getByTestId('placez-past-events-rail');
await pastRail.scrollIntoViewIfNeeded();
await shot('placez-v10-past-left-mizzed.png');

const mizzedBtn = page.getByRole('button', {name: /Open Mizzed Connections for Past dance/i});
if (await mizzedBtn.count()) await mizzedBtn.click();
else await page.goto(`${base}__drawer-qa?event=11`, {waitUntil: 'networkidle'});
if (!await page.getByTestId('placez-mizzed-page').count()) {
  await page.goto(`${base}__drawer-qa?event=11`, {waitUntil: 'networkidle'});
}
await page.getByTestId('placez-mizzed-page').waitFor();
await shot('placez-v10-mizzed-page.png');

await page.goto(`${base}__drawer-qa?card=yes-coach`, {waitUntil: 'networkidle'});
await page.getByTestId('yes-coach-card-stage').waitFor();
await shot('placez-v10-yes-coach-card.png');
const details = page.getByRole('button', {name: /View details/i});
if (await details.count()) {
  await details.click();
  await page.getByRole('navigation', {name: 'Event pages'}).waitFor();
}
const pages = ['Info', 'Feed', 'Maps', 'More', 'People'];
for (const label of pages) {
  const tab = page.getByRole('button', {name: label, exact: true});
  if (await tab.count()) await tab.click();
  else {
    const next = page.getByRole('button', {name: 'Next page'});
    if (await next.count()) await next.click();
  }
  await shot(`placez-v10-yes-coach-${label.toLowerCase()}.png`);
}

await browser.close();
await server.close();
if (errors.length) {
  console.error('PAGE_ERRORS', errors);
  process.exit(1);
}
console.log('SHOTS', shots);
