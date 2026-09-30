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
    note: "Thu/Fri lottery: arrive 2–2:30pm; last shopping arrival 5:45pm. Income and Downtown/NW ZIP eligibility apply.",
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
  desc: "Free groceries across Portland, together in one place. Select a pantry for its address, visit details, and official site.",
};
