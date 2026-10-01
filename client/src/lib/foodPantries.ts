import type { ResourceOrg } from "./resourcesData";

// Provider-published client hours checked September 30, 2026.
// A local selection, not a measured popularity ranking. URLs are the sources.
export const FOOD_PANTRIES = [
  {
    name: "Sunshine Division",
    hours:
      "SE: Mon–Fri 9am–noon & 1–4pm. NW: Tue/Wed/Fri 9am–noon & 1–4pm; Thu 11am–3pm & 4–7pm; Sat 9am–2pm.",
    address: "12436 SE Stark St · 2121 NW Front Ave",
    note: "Appointment required for every visit; check eligibility before booking.",
    url: "https://sunshinedivision.org/appointments/",
  },
  {
    name: "Northeast Emergency Food Program",
    hours: "Tue 4–6:30pm (Spanish); Thu & Sat 9:30am–noon.",
    address: "4800 NE 72nd Ave",
    note: "Luther Memorial Building.",
    url: "https://emo-nefp.org/connect/",
  },
  {
    name: "PACS Food Pantry",
    hours: "Mon/Tue/Wed/Fri 9–11am; Thu 4:30–6:30pm.",
    address: "11020 NE Halsey St",
    note: "Once per month; drive-up or walk-up.",
    url: "https://www.pacsonline.org/food-pantry",
  },
  {
    name: "SnowCap",
    hours: "Mon–Fri 10am–2pm; also Mon & Wed 6–8pm.",
    address: "17805 SE Stark St",
    note: "Serves Multnomah County residents east of 82nd Avenue.",
    url: "https://www.snowcap.org/services.html",
  },
  {
    name: "Lift UP — Preston’s Pantry",
    hours:
      "Thu & Fri 3–6pm; Tue 3–5:30pm by accessibility appointment (waitlist).",
    address: "1838 SW Jefferson St",
    note: "Provider lists Thu/Fri closing at 6pm; Food Finder lists 5:30pm. Call 503-221-1224 to confirm before traveling. Lottery arrival 2–2:30pm. Downtown/NW ZIP and income eligibility apply.",
    url: "https://www.fumcpdx.org/serve/pantry",
  },
  {
    name: "St. Johns Food Share",
    hours: "Mon & Fri 10am–4pm; Wed 10am–noon.",
    address: "8100 N Lombard St",
    note: "Open-door pantry; no proof of need.",
    url: "https://stjohnsfoodshare.org/",
  },
  {
    name: "Mainspring",
    hours: "Thu 10am–1pm.",
    address: "3500 NE 82nd Ave · enter on NE Fremont",
    note: "Self-select pantry, once per month. No appointment or documentation; while supplies last.",
    url: "https://mainspringpdx.org/mainspringonsite-outdoor-self-select-food-pantry",
  },
  {
    name: "The Pantry of Greater Portland",
    hours: "Sat 1:30–2:30pm.",
    address: "2374 SW Vermont St · main church entrance",
    note: "Anyone welcome; numbered shopping tickets issued at 1:30pm.",
    url: "https://www.pdxchurch.org/pantry/",
  },
];

export const FOOD_RESOURCE: ResourceOrg = {
  name: "Food banks & pantries",
  scope: "Portland area · 8 providers",
  mark: "FOOD",
  locations: [
  {
    "name": "Sunshine Division — SE",
    "address": "12436 SE Stark St, Portland, OR 97233",
    "lat": 45.5188663,
    "lng": -122.5351289
  },
  {
    "name": "Sunshine Division — NW",
    "address": "2121 NW Front Ave, Portland, OR 97209",
    "lat": 45.5379072,
    "lng": -122.6894358
  },
  {
    "name": "Northeast Emergency Food Program",
    "address": "4800 NE 72nd Ave, Portland, OR 97218",
    "lat": 45.558035,
    "lng": -122.5885249
  },
  {
    "name": "PACS Food Pantry",
    "address": "11020 NE Halsey St, Portland, OR 97220",
    "lat": 45.5331677,
    "lng": -122.5495952
  },
  {
    "name": "SnowCap",
    "address": "17805 SE Stark St, Portland, OR 97233",
    "lat": 45.519888,
    "lng": -122.4798273
  },
  {
    "name": "Lift UP — Preston’s Pantry",
    "address": "1838 SW Jefferson St, Portland, OR 97201",
    "lat": 45.5175364,
    "lng": -122.6935156
  },
  {
    "name": "St. Johns Food Share",
    "address": "8100 N Lombard St, Portland, OR 97203",
    "lat": 45.5892188,
    "lng": -122.749351
  },
  {
    "name": "Mainspring",
    "address": "3500 NE 82nd Ave, Portland, OR 97220",
    "lat": 45.5482928,
    "lng": -122.578474
  },
  {
    "name": "The Pantry of Greater Portland",
    "address": "2374 SW Vermont St, Portland, OR 97219",
    "lat": 45.4733653,
    "lng": -122.7002762
  }
],
  logo: "/resources-logos/oregon-food-bank.svg",
  serviceTags: ["Nutrition", "Free groceries"],
  url: "https://foodfinder.oregonfoodbank.org/",
  cta: "Find food near you",
  sourceUrl: "https://www.oregonfoodbank.org/find-support",
  sourceChecked: "September 30, 2026",
  howToStart: "Use Oregon Food Bank’s Food Finder for current locations and schedules. Check each pantry’s visit instructions before going.",
  desc: "Find free groceries through Oregon Food Bank’s network across Oregon and Southwest Washington. No proof of income or documentation is required by the network. Eight Portland-area pantry options are listed below; appointments, service areas and schedules vary.",
};
