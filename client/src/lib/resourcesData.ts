/**
 * Resources directory: nonprofits, hotlines, and LGBTQ+ groups.
 * Moved off Placez (2026-09-30). Placez is for spending time and money;
 * Resources is for getting help and giving back.
 *
 * Logos are clean white marks on transparent in /public/resources-logos.
 * Orgs without a logo file show a white monogram (mark, or computed initials).
 */
export type ResourceOrg = {
  name: string;
  categoryIds?: string[];
  aliases?: string[];
  serviceTags?: string[];
  /** Dedicated trans-focused care, programs, or peer support. */
  transSpecialist?: boolean;
  categorySourceUrl?: string;
  howToStart?: string;
  programs?: ResourceOrg[];
  locations?: { name: string; address: string; hours?: string; phone?: string; sourceUrl?: string; lat?: number; lng?: number }[];
  sub?: string;
  scope: string;
  desc: string;
  addr?: string;
  lat?: number;
  lng?: number;
  hours?: string;
  email?: string;
  mailingAddress?: string;
  contactSourceUrl?: string;
  contactChecked?: string;
  phone?: string;
  phoneLabel?: string;
  url?: string;
  cta?: string;
  alt?: string;
  altLabel?: string;
  logo?: string;
  logoSurface?: "light";
  mark?: string;
  sourceChecked?: string;
  sourceUrl?: string;
};

export type ResourceCategory = {
  id: string;
  name: string;
  color: string;
  what: string;
  help: string;
  forr: string;
  use: string;
  orgs: ResourceOrg[];
};

export const RESOURCE_CATEGORIES: ResourceCategory[] = [
  {
    "id": "health",
    "name": "Health & Care",
    "color": "var(--neon-cyan)",
    "what": "Clinics and service centers built for queer, trans, and gender-diverse people, plus HIV prevention and care.",
    "help": "Care from providers who already get it, so the visit is about your health, not about explaining yourself.",
    "forr": "Primary and walk-in urgent care, testing and HIV services, gender-affirming care and surgery, counseling, harm reduction, and peer support.",
    "use": "Check the org's site for current hours and services, then call or walk in. Ask what to bring to your first visit.",
    "orgs": [
      {
        "name": "Virginia Garcia · Beaverton Wellness Center",
        "logo": "/resources-logos/virginia-garcia.png",
        "categoryIds": [
          "health",
          "mental-health"
        ],
        "scope": "Beaverton, OR · Washington County",
        "desc": "LGBTQ+ care is a stated focus of a Beaverton clinician on this team. The center also offers primary, dental, and behavioral health care, with language and payment assistance.",
        "addr": "2725 SW Cedar Hills Blvd, Suite 200, Beaverton, OR 97005",
        "phone": "tel:+15033526000",
        "phoneLabel": "Clinic information: 503-352-6000",
        "url": "https://virginiagarcia.org/location/beaverton-wellness-center/",
        "cta": "Clinic services & appointments",
        "howToStart": "Check the clinic page for current appointment instructions, insurance, and payment options. Call the clinic information line for help getting connected; dental and pharmacy have separate numbers.",
        "programs": [
          {
            "name": "Dental care",
            "scope": "Beaverton Wellness Center",
            "desc": "Contact the dental team directly for appointments and availability.",
            "phone": "tel:+15033527990",
            "phoneLabel": "Dental: 503-352-7990"
          },
          {
            "name": "Pharmacy",
            "scope": "Beaverton Wellness Center",
            "desc": "Call the pharmacy for medication services and current hours.",
            "phone": "tel:+15033526006",
            "phoneLabel": "Pharmacy: 503-352-6006"
          },
          {
            "name": "LGBTQ+ care connection",
            "scope": "Beaverton, OR · Washington County",
            "desc": "Beaverton provider Megan Manley lists care for gender and sexual minority communities among her clinical interests. Ask the clinic about provider availability and the services you need.",
            "url": "https://virginiagarcia.org/provider/megan-manley-pa/",
            "cta": "Read the organization’s statement",
            "sourceUrl": "https://virginiagarcia.org/provider/megan-manley-pa/",
            "sourceChecked": "September 30, 2026"
          }
        ],
        "serviceTags": [
          "Primary care",
          "Dental",
          "Behavioral health"
        ],
        "sourceUrl": "https://virginiagarcia.org/location/beaverton-wellness-center/",
        "sourceChecked": "September 30, 2026",
        "contactSourceUrl": "https://virginiagarcia.org/location/beaverton-wellness-center/",
        "contactChecked": "September 30, 2026",
        "categorySourceUrl": "https://virginiagarcia.org/location/beaverton-wellness-center/"
      },
      {
        "name": "Oregon Health Plan (OHP)",
        "categoryIds": [
          "health",
          "safety"
        ],
        "serviceTags": [
          "Enrollment",
          "Housing",
          "Nutrition"
        ],
        "scope": "Oregon · Online, phone & local enrollment help",
        "mark": "OHP",
        "logo": "/resources-logos/oregon-free-hiv-syphilis-lab-testing.svg",
        "sub": "Oregon Health Authority",
        "desc": "Get help applying for Oregon’s Medicaid coverage for medical, dental, prescription and behavioral health care. Enrollment is open year-round. Some members also qualify for housing and nutrition benefits, with separate eligibility requirements.",
        "howToStart": "Apply online through ONE or call enrollment support. Already enrolled? Ask your coordinated care organization (CCO) about housing or nutrition benefits. These benefits are not automatic with OHP enrollment.",
        "phone": "tel:+18006999075",
        "phoneLabel": "Enrollment: 800-699-9075 · Mon–Fri 7am–6pm PT",
        "url": "https://one.oregon.gov/",
        "cta": "Apply for OHP",
        "sourceUrl": "https://www.oregon.gov/oha/HSD/OHP/Pages/apply.aspx",
        "sourceChecked": "September 30, 2026",
        "programs": [
          {
            "name": "Free enrollment help",
            "scope": "Online or with a local OHP-certified helper",
            "desc": "An OHP-certified community partner can help you understand the application and apply. Find a local helper through Oregon’s official directory.",
            "url": "https://healthcare.oregon.gov/Pages/find-help.aspx",
            "cta": "Find enrollment help"
          },
          {
            "name": "Housing benefits",
            "scope": "For OHP members who meet HRSN eligibility requirements",
            "desc": "Health-related social needs (HRSN) benefits may help with rent, utilities, tenancy support or home changes. Eligibility depends on health, living and other criteria. This is not emergency eviction assistance. Ask your CCO to request benefits; members without a CCO can use the Open Card instructions on the official page.",
            "url": "https://www.oregon.gov/oha/hsd/ohp/pages/housing.aspx",
            "cta": "Housing eligibility & request steps"
          },
          {
            "name": "Nutrition benefits",
            "scope": "For OHP members who meet HRSN eligibility requirements",
            "desc": "Benefits may include pantry stocking, produce, nutrition education or medically tailored meals. Separate eligibility and approval apply. Medically tailored meals require a healthcare referral and nutrition care plan. Ask your CCO; members without a CCO should follow the Open Card instructions.",
            "url": "https://www.oregon.gov/oha/hsd/ohp/pages/nutrition.aspx",
            "cta": "Nutrition eligibility & request steps"
          },
          {
            "name": "Already enrolled? Member support",
            "scope": "OHP Client Services",
            "desc": "Get help understanding your coverage or finding out which CCO handles your benefits.",
            "phone": "tel:+18002730557",
            "phoneLabel": "OHP member support: 800-273-0557",
            "url": "https://www.oregon.gov/oha/OHP/Pages/Contact-Us.aspx",
            "cta": "OHP contact options"
          }
        ],
        "hours": "Enrollment phone line: Mon–Fri 7am–6pm PT",
        "contactSourceUrl": "https://www.oregon.gov/oha/HSD/OHP/Pages/apply.aspx",
        "contactChecked": "September 30, 2026"
      },
      {
        "name": "Multnomah County · Free Outreach Testing",
        "logoSurface": "light",
        "logo": "/resources-logos/multnomah-county-free-outreach-testing.svg",
        "scope": "Multnomah County · Mobile sites",
        "mark": "MCHD",
        "desc": "Free HIV, hepatitis C, and syphilis testing at community outreach locations. No appointment or ID needed. Call for the current van schedule. The county’s regular STI Clinic is a separate service with a listed $50 fee; no one is refused there for inability to pay.",
        "phone": "tel:+15039883700",
        "phoneLabel": "Current outreach schedule: 503-988-3700",
        "url": "https://multco.us/services/hiv-testing",
        "cta": "County testing details",
        "sourceChecked": "September 30, 2026",
        "serviceTags": [
          "Free testing"
        ],
        "hours": "Mobile testing schedule varies · Call for the current location and time",
        "howToStart": "Call 503-988-3700 for the testing van’s current schedule. Outreach testing is free and does not require an appointment or ID; the fixed STI Clinic is a separate service.",
        "contactSourceUrl": "https://multco.us/services/hiv-testing",
        "contactChecked": "September 30, 2026",
        "categoryIds": []
      },
      {
        "name": "Oregon Free HIV & Syphilis Lab Testing",
        "logo": "/resources-logos/oregon-free-hiv-syphilis-lab-testing.svg",
        "scope": "Oregon residents · Age 18+",
        "mark": "OHA",
        "desc": "Oregon Health Authority’s STDcheck program offers free HIV and syphilis tests for Oregon residents age 18 and older. Choose a participating lab, then call 800-456-2323 and press 1 to request the free Oregon tests. Other STI tests cost extra; do not buy a paid panel to use this program.",
        "phone": "tel:+18004562323",
        "phoneLabel": "Request free tests: 800-456-2323, press 1",
        "url": "https://www.oregon.gov/oha/PH/DiseasesConditions/HIVSTDViralHepatitis/HIVPrevention/Pages/index.aspx",
        "cta": "Free testing instructions",
        "sourceChecked": "September 30, 2026",
        "serviceTags": [
          "Free testing"
        ],
        "hours": "By appointment at your chosen participating lab; hours vary by location.",
        "howToStart": "Choose a location using STDcheck’s Find a Lab, then call 800-456-2323 and press 1 to request the free Oregon HIV and syphilis tests. A representative will arrange your appointment.",
        "contactChecked": "September 30, 2026",
        "contactSourceUrl": "https://www.oregon.gov/oha/PH/DiseasesConditions/HIVSTDViralHepatitis/HIVPrevention/Pages/index.aspx",
        "categoryIds": []
      },
      {
        "name": "Prism Health",
        "transSpecialist": true,
        "logo": "/resources-logos/prism-health.png",
        "sub": "A Cascade AIDS Project clinic",
        "scope": "SE Portland · N Portland",
        "desc": "LGBTQ+ affirming primary care, transgender health, behavioral health, HIV and STI testing, and pharmacy services. Two Portland clinics: Belmont and Morris. See the Pivot program below for free testing; other clinical services have separate coverage and billing.",
        "addr": "2236 SE Belmont St, Portland, OR 97214",
        "url": "https://www.prismhealth.org/",
        "programs": [
          {
            "name": "Pivot at Prism Health · Free HIV & STI Testing",
            "logoSurface": "light",
            "logo": "/resources-logos/pivot-at-prism-health-free-hiv-sti-testing.png",
            "scope": "SE Portland · N Portland",
            "mark": "PIVOT",
            "desc": "Free, confidential HIV, syphilis, chlamydia, and gonorrhea testing through CAP Northwest. Appointment required. Choose the Belmont or Morris location when booking; CAP asks you to select “no insurance” in its scheduler. This is the Pivot testing program, not all Prism clinical care.",
            "phone": "tel:+19712797033",
            "phoneLabel": "Testing appointments: 971-279-7033",
            "url": "https://www.capnw.org/get-tested/",
            "cta": "Testing & appointments",
            "sourceChecked": "September 30, 2026"
          }
        ],
        "aliases": [
          "Pivot at Prism Health · Free HIV & STI Testing"
        ],
        "categoryIds": [
          "health"
        ],
        "phone": "tel:+15034457699",
        "phoneLabel": "Call Prism: 503-445-7699",
        "sourceUrl": "https://www.prismhealth.org/contact",
        "sourceChecked": "September 30, 2026",
        "locations": [
          {
            "name": "Prism Health | Belmont",
            "address": "2236 SE Belmont St, Portland, OR 97214",
            "hours": "Primary care: Mon, Tue, Wed, Fri 8:30am–5pm; Thu 9am–5pm. Check for holiday closures.",
            "sourceUrl": "https://www.prismhealth.org/contact",
            "lat": 45.5162243,
            "lng": -122.6427677
          },
          {
            "name": "Prism Health | Morris",
            "address": "15 N Morris St, Portland, OR 97227",
            "hours": "Primary care: Mon, Tue, Wed, Fri 8:30am–5pm; Thu 9am–5pm. Check for holiday closures.",
            "sourceUrl": "https://www.prismhealth.org/contact",
            "lat": 45.5448441,
            "lng": -122.6669439
          }
        ],
        "serviceTags": [
          "Testing",
          "Primary care"
        ],
        "lat": 45.5162243,
        "lng": -122.6427677,
        "email": "info@prismhealth.org",
        "hours": "Primary care: Mon–Wed & Fri 8:30am–5pm · Thu 9am–5pm · Holiday closures vary",
        "contactSourceUrl": "https://www.prismhealth.org/",
        "howToStart": "Call Prism to arrange care. For free HIV and STI testing, use the separate Pivot booking link below. Existing patients can call the main number after hours and follow the prompts for nurse triage.",
        "contactChecked": "September 30, 2026"
      },
      {
        "name": "Evergreen Urgent Care",
        "logoSurface": "light",
        "logo": "/resources-logos/evergreen-urgent-care.png",
        "scope": "NW Portland · Walk-in",
        "desc": "LGBTQIA+ friendly urgent care. Walk in for illness and injury, full STI panels and confidential sexual health testing, UTI care, labs, and X-ray. Takes insurance, Medicaid, and Medicare.",
        "addr": "2250 NW Flanders St, Ste 109, Portland, OR",
        "url": "https://evergreenurgent.com/",
        "alt": "tel:5034797713",
        "altLabel": "Call",
        "serviceTags": [
          "Testing",
          "Walk-in care"
        ],
        "lat": 45.5253192,
        "lng": -122.6975818,
        "hours": "Mon–Fri 8am–8pm · Sat 9am–6pm",
        "phone": "tel:+15034797713",
        "phoneLabel": "503-479-7713",
        "contactSourceUrl": "https://evergreenurgent.com/",
        "contactChecked": "September 30, 2026",
        "categoryIds": []
      },
      {
        "name": "CAP Northwest & Our House",
        "logoSurface": "light",
        "logo": "/resources-logos/cascade-aids-project-cap-our-house.png",
        "scope": "Old Town",
        "desc": "The Northwest's leading HIV services org since 1983. Prevention, testing, supportive housing, and LGBTQ+ health care, plus Our House residential care for people living with HIV.",
        "url": "https://www.capnw.org/",
        "alt": "https://www.capnw.org/donate",
        "altLabel": "Donate",
        "programs": [
          {
            "name": "CAP Testing 4 All · Free HIV Testing",
            "logoSurface": "light",
            "logo": "/resources-logos/cap-testing-4-all-free-hiv-testing.png",
            "scope": "Old Town · Walk-in",
            "mark": "CAP",
            "desc": "Free HIV testing at CAP Northwest’s Portland office. Walk in Monday or Wednesday, 10am–4pm; no appointment needed. This location lists HIV testing only. Check CAP’s service page for schedule changes.",
            "addr": "520 NW Davis St, Suite 215",
            "phone": "tel:+15032235907",
            "phoneLabel": "Call CAP: 503-223-5907",
            "url": "https://www.capnw.org/get-tested/",
            "cta": "Current testing schedule",
            "sourceChecked": "September 30, 2026"
          }
        ],
        "aliases": [
          "CAP Testing 4 All · Free HIV Testing",
          "Cascade AIDS Project (CAP) & Our House",
          "Cascade AIDS Project"
        ],
        "categoryIds": [
          "health",
          "safety"
        ],
        "serviceTags": [
          "Testing",
          "Housing"
        ],
        "categorySourceUrl": "https://www.capnw.org/",
        "addr": "520 NW Davis St, Suite 215, Portland, OR 97209",
        "phone": "tel:+15032235907",
        "phoneLabel": "CAP Portland: 503-223-5907",
        "email": "info@capnw.org",
        "contactSourceUrl": "https://www.capnw.org/portland",
        "howToStart": "Call CAP Portland for housing, support, insurance enrollment, testing or PrEP navigation. Confirm the right service location and hours before visiting.",
        "contactChecked": "September 30, 2026",
        "lat": 45.5243838,
        "lng": -122.6759142,
        "locations": [
          {
            "name": "CAP Portland",
            "address": "520 NW Davis St, Suite 215, Portland, OR 97209",
            "phone": "tel:+15032235907",
            "sourceUrl": "https://www.capnw.org/portland",
            "hours": "Call to confirm service availability and visiting hours.",
            "lat": 45.5243838,
            "lng": -122.6759142
          },
          {
            "name": "CAP Vancouver",
            "address": "100 E 33rd St, Suite 201A, Vancouver, WA 98663",
            "phone": "tel:+13609863500",
            "sourceUrl": "https://www.capnw.org/vancouver",
            "hours": "Call to confirm service availability and visiting hours.",
            "lat": 45.6461475,
            "lng": -122.6704137
          },
          {
            "name": "CAP Longview",
            "address": "1338 Commerce Ave, Suite 204, Longview, WA 98632",
            "phone": "tel:+13609863590",
            "sourceUrl": "https://www.capnw.org/longview",
            "hours": "Call to confirm service availability and visiting hours.",
            "lat": 46.1378553,
            "lng": -122.9336983
          },
          {
            "name": "Our House residential care",
            "address": "2727 SE Alder St, Portland, OR 97214",
            "phone": "tel:+15032340175",
            "sourceUrl": "https://www.capnw.org/locations/our-house",
            "hours": "Call to confirm service availability and visiting hours.",
            "lat": 45.5182228,
            "lng": -122.6373999
          },
          {
            "name": "Esther’s Pantry & Tod’s Corner",
            "address": "10202 SE 32nd Ave, Suites 601 & 502, Milwaukie, OR 97222",
            "phone": "tel:+15033494699",
            "sourceUrl": "https://www.capnw.org/esthers-pantry-tods-corner",
            "hours": "Call to confirm service availability and visiting hours.",
            "lat": 45.4496293,
            "lng": -122.6290981
          }
        ]
      },
      {
        "name": "The Marie Equi Center",
        "categoryIds": [
          "health",
          "harm-reduction",
          "safety",
          "community",
          "mental-health"
        ],
        "logo": "/resources-logos/marie-equi.png",
        "scope": "SE Portland",
        "desc": "Trauma-informed, culturally affirming health and social services for trans, queer, intersex, and gender-diverse communities. Peer support, harm reduction, and housing advocacy.",
        "url": "https://www.marieequi.center/",
        "alt": "https://www.marieequi.center/donate",
        "altLabel": "Donate",
        "programs": [
          {
            "name": "Marie Equi · Harm Reduction & Peer Support",
            "categoryIds": [
              "health",
              "harm-reduction"
            ],
            "scope": "SE Portland · LGBTQAI2S+",
            "logo": "/resources-logos/marie-equi.png",
            "desc": "Narcan, harm-reduction supplies and education, and culturally affirming peer support for trans, queer, intersex, and gender-diverse people. The service center focuses on unhoused and low-income LGBTQAI2S+ communities. Monday–Thursday, 10am–4pm; not a crisis-response service.",
            "addr": "4434 SE 25th Ave, Portland",
            "phone": "tel:+15034592584",
            "phoneLabel": "Call the center: 503-459-2584",
            "url": "https://www.marieequi.center/service-center",
            "cta": "Service center details",
            "sourceChecked": "September 30, 2026"
          }
        ],
        "aliases": [
          "Marie Equi · Harm Reduction & Peer Support"
        ],
        "serviceTags": [
          "Peer support",
          "Housing navigation"
        ],
        "categorySourceUrl": "https://www.marieequi.center/",
        "addr": "4434 SE 25th Ave, Portland, OR 97202",
        "hours": "Mon–Thu 10am–4pm · Fri closed",
        "phone": "tel:+15034592584",
        "phoneLabel": "503-459-2584",
        "email": "info@marieequi.center",
        "contactSourceUrl": "https://www.marieequi.center/contact",
        "contactChecked": "September 30, 2026",
        "lat": 45.4905921,
        "lng": -122.640262
      },
      {
        "name": "OHSU Transgender Health Program",
        "transSpecialist": true,
        "logo": "/resources-logos/ohsu-transgender-health-program.svg",
        "logoSurface": "light",
        "scope": "Portland",
        "desc": "Specialized gender-affirming medical care and surgery.",
        "url": "https://www.ohsu.edu/transgender-health",
        "categoryIds": [
          "youth",
          "family"
        ],
        "serviceTags": [
          "Gender-affirming care"
        ],
        "categorySourceUrl": "https://www.ohsu.edu/transgender-health",
        "phone": "tel:+15034947970",
        "phoneLabel": "Program questions: 503-494-7970",
        "email": "transhealth@ohsu.edu",
        "contactSourceUrl": "https://www.ohsu.edu/transgender-health",
        "howToStart": "Submit a service request on the program website for help connecting with care. This program provides navigation and support, but does not directly provide care or book appointments. Contact your clinic for its address, hours and appointment questions.",
        "contactChecked": "September 30, 2026"
      },
      {
        "name": "Quest Center for Integrative Health",
        "logoSurface": "light",
        "logo": "/resources-logos/quest-center-for-integrative-health.png",
        "mark": "QC",
        "scope": "Portland",
        "desc": "Community health center with LGBTQ+ services, counseling, and wellness classes.",
        "url": "https://quest-center.org/",
        "serviceTags": [
          "Counseling",
          "Recovery"
        ],
        "addr": "3231 SE 50th Ave, Portland, OR 97206",
        "hours": "Portland: Mon–Thu 8am–6pm · Fri 8am–5pm",
        "phone": "tel:+15032385203",
        "phoneLabel": "503-238-5203",
        "contactSourceUrl": "https://quest-center.org/about/locations",
        "locations": [
          {
            "name": "Multnomah clinic",
            "address": "3231 SE 50th Ave, Portland, OR 97206",
            "hours": "Mon–Thu 8am–6pm · Fri 8am–5pm",
            "sourceUrl": "https://quest-center.org/about/locations",
            "lat": 45.4990592,
            "lng": -122.6116297
          },
          {
            "name": "Clackamas clinic",
            "address": "112 Beavercreek Rd, Oregon City, OR 97045",
            "hours": "Mon–Fri 9am–5pm · Call 503-238-5203 ext. 155",
            "sourceUrl": "https://quest-center.org/about/locations",
            "lat": 45.3334341,
            "lng": -122.5975276
          }
        ],
        "contactChecked": "September 30, 2026",
        "lat": 45.4990592,
        "lng": -122.6116297,
        "categoryIds": [
          "mental-health"
        ]
      },
      {
        "name": "Outside In",
        "transSpecialist": true,
        "categoryIds": [
          "health",
          "harm-reduction",
          "safety",
          "youth",
          "money"
        ],
        "logo": "/resources-logos/outside-in.png",
        "scope": "Downtown",
        "desc": "Health care and social services for young people experiencing homelessness since 1968, including the QueerZone drop-in: an LGBTQ-affirming clinic with gender-affirming care, meals, showers, and housing help.",
        "addr": "1132 SW 13th Ave",
        "url": "https://outsidein.org/",
        "alt": "https://outsidein.org/about-us/donate-now/",
        "altLabel": "Donate",
        "programs": [
          {
            "name": "Outside In · Substance User Engagement",
            "categoryIds": [
              "health",
              "harm-reduction"
            ],
            "scope": "Portland · Clackamas County",
            "logo": "/resources-logos/outside-in.png",
            "desc": "Syringe services, naloxone, on-demand HIV, hepatitis C and syphilis testing, and drug checking using mass spectrometry. Downtown hours are Monday–Friday, noon–5pm. Call for testing availability and other service locations.",
            "addr": "1219 SW Main St, Portland",
            "phone": "tel:+15035353826",
            "phoneLabel": "Call the team: 503-535-3826",
            "url": "https://outsidein.org/health-services/substance-user-engagement-services/",
            "cta": "Services & schedule",
            "sourceChecked": "September 30, 2026"
          }
        ],
        "aliases": [
          "Outside In · Substance User Engagement"
        ],
        "serviceTags": [
          "Testing",
          "Housing",
          "Job training"
        ],
        "categorySourceUrl": "https://outsidein.org/about-us/",
        "lat": 45.51761,
        "lng": -122.6864992,
        "phone": "tel:+15035353860",
        "phoneLabel": "Clinic appointments: 503-535-3860",
        "email": "info@outsidein.org",
        "contactSourceUrl": "https://outsidein.org/health-services/",
        "hours": "Clinic hours vary by location · See locations for details",
        "locations": [
          {
            "name": "Downtown clinic",
            "address": "1132 SW 13th Ave, Portland, OR 97205",
            "hours": "Mon/Thu/Fri 8:30am–5pm · Tue/Wed 8:30am–7pm. Second Tuesday opens at 10am.",
            "sourceUrl": "https://outsidein.org/health-services/",
            "lat": 45.51761,
            "lng": -122.6864992
          },
          {
            "name": "East Portland clinic",
            "address": "16144 E Burnside St, Portland, OR 97233",
            "hours": "Mon–Wed 8:30am–5pm · Thu/Fri 8:30am–4:30pm. Closed noon–12:45pm daily. Second Tuesday opens at 10am.",
            "sourceUrl": "https://outsidein.org/health-services/",
            "lat": 45.5222827,
            "lng": -122.4972606
          }
        ],
        "contactChecked": "September 30, 2026"
      },
      {
        "name": "Trans Advocacy & Care Team (TACT)",
        "transSpecialist": true,
        "logo": "/resources-logos/trans-advocacy-care-team-tact.png",
        "scope": "U.S. · Online · Adults 18+",
        "desc": "Free, virtual peer counseling for trans people.",
        "url": "https://yourtact.org",
        "categoryIds": [
          "community",
          "mental-health"
        ],
        "serviceTags": [
          "Peer support",
          "Online"
        ],
        "categorySourceUrl": "https://yourtact.org",
        "hours": "Peer sessions by arrangement · Waitlist may apply",
        "howToStart": "Use the individual-counseling page to request a Gender Advocate. The team will contact you to arrange a first call. Peer support is for adults 18+; it is not therapy or a crisis service.",
        "alt": "https://yourtact.org/individual-counseling/",
        "altLabel": "Request peer support",
        "contactSourceUrl": "https://yourtact.org/individual-counseling/",
        "contactChecked": "September 30, 2026"
      },
      {
        "name": "Emergence",
        "logo": "/resources-logos/emergence.svg",
        "mark": "EM",
        "scope": "Eugene · Albany · Corvallis · Florence · Cottage Grove",
        "desc": "LGBTQIA+ affirming outpatient substance-use and behavioral-health treatment, with multiple Oregon locations and telehealth options for qualifying clients.",
        "url": "https://4emergence.com",
        "categoryIds": [
          "health",
          "mental-health"
        ],
        "serviceTags": [
          "Recovery"
        ],
        "categorySourceUrl": "https://www.4emergence.com/about-us/",
        "phone": "tel:+15416878820",
        "phoneLabel": "Main office & screening",
        "addr": "78 Centennial Loop, Unit A, Eugene, OR 97401",
        "hours": "Main office: Mon–Fri 9am–5pm · Treatment appointments vary",
        "howToStart": "Call the main office for a phone screening and assessment. Ask which location or telehealth program fits your needs and confirm insurance coverage.",
        "contactSourceUrl": "https://www.4emergence.com/",
        "locations": [
          {
            "name": "Centennial Loop",
            "address": "78 Centennial Loop, Unit A, Eugene, OR 97401",
            "phone": "tel:+15416878820",
            "sourceUrl": "https://www.4emergence.com/",
            "lat": 44.0611117,
            "lng": -123.0775411
          },
          {
            "name": "Centennial Plaza",
            "address": "2149 Centennial Plaza #4, Eugene, OR 97401",
            "phone": "tel:+15417417107",
            "sourceUrl": "https://www.4emergence.com/",
            "lat": 44.0612057,
            "lng": -123.0779778
          },
          {
            "name": "Downtown Eugene",
            "address": "1040 Oak St, Eugene, OR 97401",
            "phone": "tel:+15413426987",
            "sourceUrl": "https://www.4emergence.com/",
            "lat": 44.0485617,
            "lng": -123.0913215
          },
          {
            "name": "Albany",
            "address": "1856 Grand Prairie Rd SE, Albany, OR 97322",
            "phone": "tel:+15419676597",
            "sourceUrl": "https://www.4emergence.com/",
            "lat": 44.6166432,
            "lng": -123.0815687
          },
          {
            "name": "Corvallis",
            "address": "551 NW Monroe Ave, Corvallis, OR 97330",
            "phone": "tel:+15413603918",
            "sourceUrl": "https://www.4emergence.com/",
            "lat": 44.565192,
            "lng": -123.2635306
          },
          {
            "name": "Florence",
            "address": "4969 Hwy 101, Suite 3, Florence, OR 97439",
            "phone": "tel:+15419978509",
            "sourceUrl": "https://www.4emergence.com/",
            "lat": 44.0096941,
            "lng": -124.1022414
          },
          {
            "name": "Cottage Grove",
            "address": "710 Adams Ave, Cottage Grove, OR 97424",
            "phone": "tel:+15417673057",
            "sourceUrl": "https://www.4emergence.com/",
            "lat": 43.7956696,
            "lng": -123.060781
          }
        ],
        "contactChecked": "September 30, 2026",
        "lat": 44.0611117,
        "lng": -123.0775411
      }
    ]
  },
  {
    "id": "safety",
    "name": "Safety & Basic Needs",
    "color": "var(--neon-red)",
    "what": "Domestic violence support for LGBTQIA+ survivors, trans-led emergency help, food, housing support, and advocacy for incarcerated LGBTQ+ people.",
    "help": "Safety planning, emergency shelter, relocation, meals, and advocates who understand queer and trans lives and relationships.",
    "forr": "Getting out of an unsafe situation, rebuilding after one, and getting fed and housed.",
    "use": "In crisis, call a line in Start Here. Otherwise reach out by email or through each site, and ask what support they have open right now.",
    "orgs": [
      {
        "name": "Family Peace Center of Washington County",
        "logo": "/resources-logos/family-peace.png",
        "aliases": [
          "Family Justice Center of Washington County",
          "FJCWC",
          "FPCWC"
        ],
        "categoryIds": [
          "safety",
          "legal",
          "family"
        ],
        "scope": "Beaverton area & Washington County, OR · Center in Hillsboro",
        "desc": "A Washington County connection for survivor advocacy, legal aid, and housing support. Partner agencies also help survivors and families access food, clothing, and other essentials.",
        "addr": "1100 NE Compton Dr, Hillsboro, OR 97006",
        "phone": "tel:+15034308300",
        "phoneLabel": "24/7 support: 503-430-8300",
        "hours": "Walk-in: Monday–Friday, 8:30am–4pm.",
        "url": "https://www.fpcwc.org/services",
        "cta": "Explore survivor services",
        "howToStart": "Call or visit during walk-in hours to connect with an advocate. Formerly the Family Justice Center of Washington County; use the current Hillsboro address, not the former Beaverton location.",
        "programs": [
          {
            "name": "Survivor Community Center",
            "scope": "At the Family Peace Center",
            "desc": "Ask about food, clothing, hygiene supplies, showers, and support while meeting with partner agencies.",
            "url": "https://www.fpcwc.org/services",
            "cta": "Community center details"
          }
        ],
        "serviceTags": [
          "Survivor support",
          "Legal advocacy",
          "Family support"
        ],
        "sourceUrl": "https://www.fpcwc.org/services",
        "sourceChecked": "September 30, 2026",
        "contactSourceUrl": "https://www.fpcwc.org/services",
        "contactChecked": "September 30, 2026",
        "categorySourceUrl": "https://www.fpcwc.org/services"
      },
      {
        "name": "YWCA Clark County · SafeChoice",
        "logo": "/resources-logos/ywca-clark.png",
        "categoryIds": [
          "safety",
          "legal",
          "family"
        ],
        "scope": "Vancouver, WA · Clark County",
        "desc": "A dedicated LGBTQ+ advocate supports domestic violence survivors in Clark County. Free, confidential help includes a 24-hour hotline, safety planning, advocacy, and shelter services.",
        "addr": "3609 Main St, Vancouver, WA 98663",
        "phone": "tel:+13606950501",
        "phoneLabel": "24-hour SafeChoice hotline: 360-695-0501",
        "hours": "Walk-in: Monday–Thursday, 9am–3pm; closed noon–1pm. Hotline available 24/7.",
        "url": "https://www.ywcaclarkcounty.org/safechoice-domestic-violence-program",
        "cta": "SafeChoice support options",
        "howToStart": "Call the hotline to talk with an advocate about safety, shelter, or next steps. The Main Street address is the community office; shelter placement is arranged through the program.",
        "programs": [
          {
            "name": "SafeChoice housing support",
            "scope": "Survivors in Clark County",
            "desc": "Ask an advocate about housing searches, rental assistance, and transitional housing. Availability and eligibility vary by program.",
            "url": "https://www.ywcaclarkcounty.org/safechoice-housing",
            "cta": "Housing programs"
          }
        ],
        "serviceTags": [
          "Domestic violence support",
          "LGBTQ+ advocacy",
          "Safety planning"
        ],
        "sourceUrl": "https://www.ywcaclarkcounty.org/safechoice-domestic-violence-program",
        "sourceChecked": "September 30, 2026",
        "contactSourceUrl": "https://www.ywcaclarkcounty.org/safechoice-domestic-violence-program",
        "contactChecked": "September 30, 2026",
        "categorySourceUrl": "https://www.ywcaclarkcounty.org/safechoice-domestic-violence-program"
      },
      {
        "name": "Share Vancouver",
        "logo": "/resources-logos/share-vancouver.png",
        "categoryIds": [
          "safety",
          "family"
        ],
        "scope": "Vancouver, WA · Clark County",
        "desc": "Food and housing support in Clark County, with an explicit policy against sexual-orientation discrimination. Connect with meals, shelter access, outreach, and housing programs.",
        "addr": "2306 NE Andresen Rd, Vancouver, WA 98661",
        "phone": "tel:+13604482121",
        "phoneLabel": "Main office: 360-448-2121",
        "url": "https://sharevancouver.org/about-us/",
        "cta": "Share services & contact",
        "howToStart": "Call the main office for program information. For shelter access, use the housing hotline below; the listed address is the Share Fromhold Service Center, not a guaranteed shelter placement.",
        "programs": [
          {
            "name": "Housing & shelter access",
            "scope": "Clark County, Washington",
            "desc": "Share directs people seeking shelter to this housing hotline. Ask about current access steps and availability.",
            "phone": "tel:+13606959677",
            "phoneLabel": "Housing hotline: 360-695-9677",
            "url": "https://sharevancouver.org/about-us/",
            "cta": "Housing access information"
          },
          {
            "name": "Published service-access policy",
            "scope": "Vancouver, WA · Clark County",
            "desc": "Share explicitly includes sexual orientation in its nondiscrimination policy for programs and activities. It is a general housing and food provider, not an LGBTQ+-specialist service.",
            "url": "https://sharevancouver.org/about-us/",
            "cta": "Read the organization’s statement",
            "sourceUrl": "https://sharevancouver.org/about-us/",
            "sourceChecked": "September 30, 2026"
          }
        ],
        "serviceTags": [
          "Housing",
          "Food",
          "Outreach"
        ],
        "sourceUrl": "https://sharevancouver.org/about-us/",
        "sourceChecked": "September 30, 2026",
        "contactSourceUrl": "https://sharevancouver.org/about-us/",
        "contactChecked": "September 30, 2026",
        "categorySourceUrl": "https://sharevancouver.org/about-us/"
      },
      {
        "name": "Beaverton Resource Center",
        "logo": "/resources-logos/brc.png",
        "categoryIds": [
          "safety",
          "health",
          "family"
        ],
        "scope": "Beaverton, OR · Surrounding communities",
        "desc": "Explicitly welcomes all sexual orientations, genders, and gender expressions. This Beaverton hub connects people with food, basic supplies, health coverage enrollment, and local help.",
        "addr": "13565 SW Walker Rd, Beaverton, OR 97005",
        "phone": "tel:+15032075670",
        "phoneLabel": "Resource navigation: 503-207-5670",
        "hours": "Walk-in: Tuesday, Wednesday & Friday, 9am–1pm. Call for other availability.",
        "url": "https://beavertonresourcecenter.org/what-we-do-1",
        "cta": "Services & eligibility",
        "contactSourceUrl": "https://beavertonresourcecenter.org/contact-us",
        "howToStart": "Call or drop in during walk-in hours. The service overview currently lists financial assistance as paused; confirm availability with staff before planning a visit for rent or utility funding.",
        "programs": [
          {
            "name": "Care to Share food pantry connections",
            "scope": "Beaverton-area pantry network",
            "desc": "Call to arrange a pantry appointment. The Care to Share line operates Monday–Friday, 9am–1pm.",
            "phone": "tel:+15035919025",
            "phoneLabel": "Pantry appointments: 503-591-9025",
            "url": "https://beavertonresourcecenter.org/what-we-do-1",
            "cta": "Food assistance details"
          },
          {
            "name": "Published inclusion policy",
            "scope": "Beaverton, OR · Surrounding communities",
            "desc": "BRC’s nondiscrimination policy explicitly names sexual orientation, gender, and gender expression. It is a general community resource, not an LGBTQ+-specialist service.",
            "url": "https://beavertonresourcecenter.org/about-us",
            "cta": "Read the organization’s statement",
            "sourceUrl": "https://beavertonresourcecenter.org/about-us",
            "sourceChecked": "September 30, 2026"
          }
        ],
        "serviceTags": [
          "Food assistance",
          "Resource navigation",
          "Basic needs"
        ],
        "sourceUrl": "https://beavertonresourcecenter.org/what-we-do-1",
        "sourceChecked": "September 30, 2026",
        "contactChecked": "September 30, 2026",
        "categorySourceUrl": "https://beavertonresourcecenter.org/what-we-do-1"
      },

      {
        "name": "Marsha's Folx | Bradley Angle",
        "logoSurface": "light",
        "logo": "/resources-logos/marsha-s-folx-bradley-angle.png",
        "mark": "MF",
        "scope": "Portland",
        "desc": "One of the only culturally specific domestic violence programs for LGBTQIA+ survivors in Oregon. Advocacy and referrals, safety planning, food, clothing, and toiletries, and free support groups. Check the program website for the current schedule.",
        "addr": "5432 N Albina Ave, Portland",
        "phone": "tel:+15032321528;ext=302",
        "phoneLabel": "Bradley Angle intake: 503-232-1528 ext. 302",
        "url": "https://www.bradleyangle.org/marshas-folx",
        "alt": "mailto:lgbtq@bradleyangle.org",
        "altLabel": "Email",
        "categoryIds": [
          "legal",
          "community"
        ],
        "serviceTags": [
          "Domestic violence",
          "Housing navigation"
        ],
        "categorySourceUrl": "https://www.bradleyangle.org/marshas-folx",
        "lat": 45.562453,
        "lng": -122.6747866,
        "contactSourceUrl": "https://www.bradleyangle.org/marshas-folx",
        "howToStart": "Email the Marsha’s Folx team about advocacy, safety planning or support groups, or use the program intake form. Confirm visit arrangements and group times with the team.",
        "contactChecked": "September 30, 2026"
      },
      {
        "name": "Eviction & housing crisis support",
        "categoryIds": [
          "safety",
          "legal"
        ],
        "serviceTags": [
          "Eviction help",
          "Rent assistance",
          "Shelter"
        ],
        "scope": "Portland · Multnomah County · statewide legal help",
        "logo": "/resources-logos/housing-support-title.svg",
        "sub": "Local support directory",
        "desc": "Facing eviction, behind on rent, or need somewhere safe to stay? Start here for legal help, emergency rent referrals, shelter access, tenant rights and other housing support. Funding and shelter openings vary; each program sets its own eligibility.",
        "howToStart": "If you have eviction court papers, contact legal help immediately and keep track of your court date. For rent or shelter referrals, call 211. Applying for assistance does not by itself stop an eviction.",
        "url": "https://www.portland.gov/phb/rental-services/eviction-help-renters",
        "cta": "Portland eviction help",
        "sourceChecked": "September 30, 2026",
        "programs": [
          {
            "name": "Eviction Defense Project",
            "desc": "Free legal help for low-income tenants facing eviction court statewide. Multnomah County tenants may qualify after a termination notice, before a court case. Contact the project before your first appearance; have your case number and hearing date ready.",
            "url": "https://oregonlawcenter.org/eviction-defense-project/",
            "scope": "Portland / Multnomah County",
            "cta": "Get help & eligibility",
            "sourceChecked": "September 30, 2026",
            "phone": "tel:+18885859638",
            "phoneLabel": "Eviction legal help"
          },
          {
            "name": "Emergency rent assistance",
            "desc": "Multnomah County’s current program requires county residency, an eviction notice and income at or below 65% of area median income. Funding and weekly referrals are limited. Call 211; if referrals are full, the county says to try again the following business week.",
            "url": "https://multco.us/info/how-access-emergency-rent-assistance",
            "scope": "Portland / Multnomah County",
            "cta": "Get help & eligibility",
            "sourceChecked": "September 30, 2026",
            "phone": "tel:211",
            "phoneLabel": "Rent assistance referrals"
          },
          {
            "name": "Culturally specific rent-support partners",
            "desc": "The county’s current referral network includes Bienestar de la Familia, El Programa Hispano, IRCO, Latino Network, NAYA and SEI. Use 211 for the referral process and current availability.",
            "url": "https://multco.us/info/how-access-emergency-rent-assistance",
            "scope": "Portland / Multnomah County",
            "cta": "Get help & eligibility",
            "sourceChecked": "September 30, 2026"
          },
          {
            "name": "Portland eviction legal defense & mediation",
            "desc": "The city links to eviction legal defense, financial assistance available through participating legal providers, and free landlord-tenant mediation. These programs have different intake and eligibility rules.",
            "url": "https://www.portland.gov/phb/rental-services/rso-supported-community-programs-services",
            "scope": "Portland / Multnomah County",
            "cta": "Get help & eligibility",
            "sourceChecked": "September 30, 2026"
          },
          {
            "name": "Renters’ Rights Hotline",
            "desc": "Community Alliance of Tenants provides tenant-rights information. Its current notice says hotline hours are extremely limited because of funding cuts; check the website for availability.",
            "url": "https://www.oregoncat.org/",
            "scope": "Portland / Multnomah County",
            "cta": "Get help & eligibility",
            "sourceChecked": "September 30, 2026",
            "phone": "tel:+15032880130",
            "phoneLabel": "Renters’ rights"
          },
          {
            "name": "Portland Rental Services Helpdesk",
            "desc": "Information about Portland rental rules and referrals, including relocation-assistance resources. Staff do not give legal advice.",
            "url": "https://www.portland.gov/phb/rental-services/helpdesk",
            "scope": "Portland / Multnomah County",
            "cta": "Get help & eligibility",
            "sourceChecked": "September 30, 2026",
            "phone": "tel:+15038231303",
            "phoneLabel": "Rental Services Helpdesk"
          },
          {
            "name": "Shelter tonight & housing access",
            "desc": "The county’s live shelter directory includes adult, family, youth and domestic-violence shelter options with individual intake instructions. Call 211 to find a starting point. Shelter space is not guaranteed.",
            "url": "https://hsd.multco.us/emergency-shelters/",
            "scope": "Portland / Multnomah County",
            "cta": "Get help & eligibility",
            "sourceChecked": "September 30, 2026",
            "phone": "tel:+18666986155",
            "phoneLabel": "211 shelter referrals"
          },
          {
            "name": "Coordinated Access",
            "desc": "For people experiencing homelessness: housing problem-solving, local referrals and assessment for supportive-housing programs. Access routes differ for adults, families and youth; use the county’s current instructions.",
            "url": "https://hsd.multco.us/coordinated-access/",
            "scope": "Portland / Multnomah County",
            "cta": "Get help & eligibility",
            "sourceChecked": "September 30, 2026"
          },
          {
            "name": "Older adults & disability: Safety Net",
            "desc": "Last-resort emergency help may cover rent, deposits, utilities or moving for eligible Multnomah County older adults and people with disabilities. Income, assets and other criteria apply; funds are limited. Contact ADRC for screening and referral.",
            "url": "https://multco.us/info/safety-net-program",
            "scope": "Portland / Multnomah County",
            "cta": "Get help & eligibility",
            "sourceChecked": "September 30, 2026",
            "phone": "tel:+15039883646",
            "phoneLabel": "Aging & disability support"
          },
          {
            "name": "Other rent-support programs",
            "desc": "The county maintains additional routes, including OHP housing benefits and programs for survivors, veterans and other households. OHP housing support is not emergency eviction assistance; urgent needs should go to 211 and legal help.",
            "url": "https://multco.us/info/rent-assistance-other-community-programs",
            "scope": "Portland / Multnomah County",
            "cta": "Get help & eligibility",
            "sourceChecked": "September 30, 2026"
          }
        ],
        "hours": "Hours and intake vary by program. Use the contact details below; contact legal help promptly if you have court papers.",
        "contactChecked": "September 30, 2026",
        "contactSourceUrl": "https://www.portland.gov/phb/rental-services/eviction-help-renters"
      },
      {
        "name": "Energy & utility assistance",
        "categoryIds": [
          "safety"
        ],
        "serviceTags": [
          "Energy assistance",
          "Bill discounts",
          "Shutoff support"
        ],
        "scope": "Portland area · Match assistance to your utility",
        "logo": "/resources-logos/energy-support-title.svg",
        "sub": "Local support directory",
        "desc": "Help with electricity and heating bills, utility discounts, payment arrangements and disconnection concerns. Start with your utility if a shutoff is pending, and contact 211 for local energy-assistance referrals.",
        "howToStart": "Have your utility account and any shutoff notice ready. Call the utility promptly about a payment plan or disconnection options; separately ask 211 about income-based assistance. Assistance depends on eligibility and available funds.",
        "url": "https://multco.us/info/energy-bill-assistance",
        "cta": "Local energy assistance",
        "sourceChecked": "September 30, 2026",
        "programs": [
          {
            "name": "Multnomah County energy assistance",
            "desc": "Income-eligible households can seek heating and electric-bill assistance through the county’s nonprofit partners. Services are first come, first served. Call 211 or text your ZIP code to 898211 for a referral.",
            "url": "https://multco.us/info/energy-bill-assistance",
            "scope": "Portland / Multnomah County",
            "cta": "Get help & eligibility",
            "sourceChecked": "September 30, 2026",
            "phone": "tel:211",
            "phoneLabel": "Energy assistance referrals"
          },
          {
            "name": "Portland General Electric (PGE)",
            "desc": "Ask about payment extensions, arrangements and the income-qualified monthly bill discount. If a disconnection is pending, contact PGE directly to discuss your account.",
            "url": "https://portlandgeneral.com/help/help-topics/avoid-disconnection",
            "scope": "Portland / Multnomah County",
            "cta": "Get help & eligibility",
            "sourceChecked": "September 30, 2026",
            "phone": "tel:+15032286322",
            "phoneLabel": "Call PGE"
          },
          {
            "name": "Pacific Power",
            "desc": "Ask about payment assistance, Oregon’s Low-Income Discount and disconnection options. Eligibility and account circumstances determine which support is available.",
            "url": "https://www.pacificpower.net/my-account/payments/bill-payment-assistance.html",
            "scope": "Portland / Multnomah County",
            "cta": "Get help & eligibility",
            "sourceChecked": "September 30, 2026",
            "phone": "tel:+18882217070",
            "phoneLabel": "Call Pacific Power"
          },
          {
            "name": "NW Natural",
            "desc": "Apply for an income-qualified bill discount or ask about payment-assistance options for your natural-gas account. The customer-service team can help with the application.",
            "url": "https://www.nwnatural.com/account/bill-discount-program",
            "scope": "Portland / Multnomah County",
            "cta": "Get help & eligibility",
            "sourceChecked": "September 30, 2026",
            "phone": "tel:+18004224012",
            "phoneLabel": "Call NW Natural"
          },
          {
            "name": "Older adults & disability: utility support",
            "desc": "Multnomah County’s Safety Net may help with utilities when other programs cannot. Eligibility, financial limits and available funding apply. ADRC can screen and refer.",
            "url": "https://multco.us/info/safety-net-program",
            "scope": "Portland / Multnomah County",
            "cta": "Get help & eligibility",
            "sourceChecked": "September 30, 2026",
            "phone": "tel:+15039883646",
            "phoneLabel": "Aging & disability support"
          },
          {
            "name": "Weatherization & longer-term savings",
            "desc": "Explore the county’s free weatherization resources and eligibility to improve home efficiency and reduce future energy costs.",
            "url": "https://multco.us/group/616002",
            "scope": "Portland / Multnomah County",
            "cta": "Get help & eligibility",
            "sourceChecked": "September 30, 2026"
          }
        ],
        "email": "help@211info.org",
        "hours": "211info email support: Monday–Friday, 8 am–6 pm. Utility and assistance-provider hours vary.",
        "contactChecked": "September 30, 2026",
        "contactSourceUrl": "https://multco.us/info/energy-bill-assistance"
      },
      {
        "name": "WERQ Together",
        "logo": "/resources-logos/werq.png",
        "scope": "Oregon",
        "desc": "Trans-led org providing relocation assistance, emergency shelter, peer support, and economic justice for two-spirit, trans, non-binary, and gender non-conforming people in Oregon. Also keeps the Trans Oregon resource directory.",
        "url": "https://werqt.org/",
        "alt": "https://werqt.org/donate",
        "altLabel": "Donate",
        "categoryIds": [
          "community",
          "mental-health"
        ],
        "serviceTags": [
          "Relocation",
          "Peer support"
        ],
        "categorySourceUrl": "https://werqt.org/",
        "email": "peers@werqt.org",
        "contactSourceUrl": "https://werqt.org/contact",
        "howToStart": "Start an intake through WERQ Together’s website, or email the peer team to ask about support and next steps.",
        "contactChecked": "September 30, 2026"
      },
      {
        "name": "Rahab's Sisters",
        "logoSurface": "light",
        "logo": "/resources-logos/rahab-s-sisters.png",
        "scope": "Portland",
        "desc": "Housing support, health care, and community services for marginalized people.",
        "url": "https://rahabs-sisters.org",
        "categoryIds": [
          "community"
        ],
        "serviceTags": [
          "Meals"
        ],
        "categorySourceUrl": "https://rahabs-sisters.org",
        "phone": "tel:+19712083176",
        "phoneLabel": "Contact Rahab’s Sisters",
        "email": "info@rahabs-sisters.org",
        "mailingAddress": "PO Box 90234, Portland, OR 97290",
        "hours": "Office: by phone, email or appointment only",
        "contactSourceUrl": "https://rahabs-sisters.org/contact-1",
        "contactChecked": "September 30, 2026"
      },
      {
        "name": "Hand Up Project",
        "scope": "Oregon",
        "desc": "Emergency food assistance focused on BIPOC and LGBTQ+ communities.",
        "url": "https://handupproject.org",
        "phone": "tel:+15034510715",
        "phoneLabel": "Office: 503-451-0715",
        "mailingAddress": "PO Box 12426, Portland, OR 97212",
        "contactSourceUrl": "https://handupproject.org/resources",
        "howToStart": "Check the People’s Pantry schedule on the official website, or call the office to confirm the current distribution location and hours. The P.O. box is for mail only.",
        "contactChecked": "September 30, 2026",
        "logo": "/resources-logos/hand-up-project-transparent.png",
        "categoryIds": []
      },
      {
        "name": "Beyond These Walls",
        "logo": "/resources-logos/beyond-these-walls.png",
        "scope": "National",
        "desc": "Serving and advocating for incarcerated LGBTQ+ people.",
        "url": "https://beyondthesewallslgbt.org",
        "categoryIds": [
          "legal",
          "community"
        ],
        "categorySourceUrl": "https://beyondthesewallslgbt.org",
        "email": "havana@beyondthesewallslgbt.org",
        "mailingAddress": "PO Box 13006, Portland, OR 97213",
        "howToStart": "Contact the case manager about Care Closet, advocacy or reentry support. Use the website contact form for general inquiries.",
        "contactSourceUrl": "https://beyondthesewallslgbt.org/contact",
        "contactChecked": "September 30, 2026"
      }
    ]
  },
  {
    "id": "legal",
    "name": "Legal & Advocacy",
    "color": "var(--neon-blue)",
    "what": "Ways to find an affordable lawyer, Oregon's LGBTQ+ bar association, and the groups working on policy and gender justice.",
    "help": "A lawyer you can afford, and organized pressure that protects LGBTQ+ rights in Oregon.",
    "forr": "Family law, housing, and health and safety matters, plus campaigns, volunteering, and staying informed.",
    "use": "Call the bar's referral line weekdays 8 to 5, or apply online for Modest Means with proof of income. Follow the advocacy groups for campaigns.",
    "orgs": [
      {
        "name": "Oregon State Bar",
        "logoSurface": "light",
        "logo": "/resources-logos/oregon-state-bar-transparent.png",
        "sub": "Lawyer Referral Service & Modest Means",
        "scope": "Statewide",
        "desc": "Get matched with a lawyer. Modest Means connects moderate-income Oregonians with reduced-fee attorneys, with a first consult of up to 30 minutes for no more than $35.",
        "url": "https://www.osbar.org/public/ris",
        "cta": "Get a referral",
        "alt": "tel:+18004527636",
        "altLabel": "Toll-free: 800-452-7636",
        "categoryIds": [
          "safety",
          "family",
          "youth"
        ],
        "serviceTags": [
          "Legal referrals"
        ],
        "categorySourceUrl": "https://www.osbar.org/public/ris",
        "phone": "tel:+15036843763",
        "phoneLabel": "503-684-3763",
        "hours": "Referral service: Mon–Fri 8:30am–5pm",
        "howToStart": "Call the referral service or submit an online referral request. Ask about the Modest Means program if cost is a concern. The referral staff cannot give legal advice; lawyer consultation fees and eligibility vary by program.",
        "contactSourceUrl": "https://www.osbar.org/public/ris/",
        "contactChecked": "September 30, 2026"
      },
      {
        "name": "OGALLA",
        "logo": "/resources-logos/ogalla-transparent.png",
        "url": "https://www.ogalla.org/",
        "sub": "The LGBT Bar Association of Oregon",
        "scope": "Statewide",
        "desc": "LGBTQ+ lawyers, judges, legal workers, and law students since 1991. Runs the Bill & Ann Shepherd Legal Scholarship Fund and helped win marriage equality in Oregon.",
        "categoryIds": [
          "money",
          "community"
        ],
        "categorySourceUrl": "https://www.ogalla.org/",
        "email": "info@ogalla.org",
        "mailingAddress": "PO Box 8211, Portland, OR 97207",
        "howToStart": "Email OGALLA or use its contact form. The association does not provide legal advice; use the Oregon State Bar referral service if you need a lawyer.",
        "contactSourceUrl": "https://www.ogalla.org/contact-us",
        "contactChecked": "September 30, 2026"
      },
      {
        "name": "Basic Rights Oregon",
        "logo": "/resources-logos/basic-rights.png",
        "scope": "Statewide",
        "desc": "Oregon's statewide LGBTQ2SIA+ advocacy organization. Political, legal, and grassroots work to make sure all Oregonians experience equality.",
        "url": "https://www.basicrights.org/",
        "alt": "https://www.basicrights.org/donate",
        "altLabel": "Donate",
        "phone": "tel:+15032226151",
        "phoneLabel": "503-222-6151",
        "email": "info@basicrights.org",
        "mailingAddress": "P.O. Box 40625, Portland, OR 97240",
        "contactSourceUrl": "https://www.basicrights.org/contact-us",
        "contactChecked": "September 30, 2026",
        "categoryIds": []
      },
      {
        "name": "Intersect NW",
        "logo": "/resources-logos/intersect-nw.png",
        "scope": "Oregon",
        "desc": "Intersect NW has announced it is winding down. Its current notice describes a closing process through the end of the year. Check that notice before seeking programs or support.",
        "url": "https://intersectnorthwest.org",
        "cta": "Read organization update",
        "sourceUrl": "https://intersectnorthwest.org",
        "sourceChecked": "September 30, 2026",
        "email": "info@intersectnorthwest.org",
        "howToStart": "The organization is winding down. Use its Contact Us form for questions about the transition; check its current notice before requesting services.",
        "contactChecked": "September 30, 2026",
        "contactSourceUrl": "https://intersectnorthwest.org",
        "categoryIds": []
      }
    ]
  },
  {
    "id": "youth",
    "name": "Youth & Mentorship",
    "color": "var(--text-hi)",
    "what": "Drop-in centers, support groups, mentoring, and arts programs for young people, including youth without stable housing.",
    "help": "A meal, clothes that fit who you are, a trusted adult, and a space where you don't have to hide.",
    "forr": "Food, clothing, counseling, support groups, creative programs, and someone in your corner. SMYRC serves ages 13 to 24.",
    "use": "Look up drop-in hours and group times on each site before you go. Adults can back these programs by volunteering or donating.",
    "orgs": [
      {
        "name": "Queer Youth Resource Center",
        "transSpecialist": true,
        "logo": "/resources-logos/qyrc.png",
        "aliases": [
          "QYRC"
        ],
        "categoryIds": [
          "youth",
          "community"
        ],
        "scope": "Vancouver, WA · Southwest Washington · Ages 12–24",
        "desc": "Built for LGBTQ+ youth ages 12–24 in Vancouver and Southwest Washington. Find community, local support, and help accessing gender-affirming garments.",
        "phone": "tel:+13608310745",
        "phoneLabel": "QYRC: 360-831-0745",
        "email": "info@qyrcvancouverwa.org",
        "mailingAddress": "4421 NE St. Johns Rd, Vancouver, WA 98661",
        "url": "https://www.qyrcvancouverwa.org/",
        "cta": "Explore QYRC resources",
        "howToStart": "Contact QYRC or use the program request form. The listed address is a mailing address; arrange contact before visiting.",
        "programs": [
          {
            "name": "Gender-affirming garments",
            "scope": "LGBTQ+ youth in Southwest Washington",
            "desc": "Request help purchasing a gender-affirming garment through the online form. Include the item, sizing details, a delivery address, and a way to contact you.",
            "url": "https://www.qyrcvancouverwa.org/gender-affirming-products",
            "cta": "Garment information & request form",
            "sourceUrl": "https://www.qyrcvancouverwa.org/gender-affirming-products",
            "sourceChecked": "September 30, 2026"
          }
        ],
        "serviceTags": [
          "LGBTQ+ youth",
          "Community",
          "Gender-affirming garments"
        ],
        "sourceUrl": "https://www.qyrcvancouverwa.org/",
        "sourceChecked": "September 30, 2026",
        "contactSourceUrl": "https://www.qyrcvancouverwa.org/",
        "contactChecked": "September 30, 2026",
        "categorySourceUrl": "https://www.qyrcvancouverwa.org/"
      },
      {
        "name": "HomePlate Youth Services",
        "logo": "/resources-logos/homeplate.png",
        "categoryIds": [
          "youth",
          "safety",
          "money"
        ],
        "scope": "Beaverton & Hillsboro, OR · Washington County",
        "desc": "Explicitly supports LGBTQ+ youth and rejects homophobia and transphobia. Beaverton and Hillsboro drop-ins offer meals, showers, supplies, and housing, school, and job connections.",
        "addr": "12685 SW 4th St, Beaverton, OR 97005",
        "phone": "tel:+15035676591",
        "phoneLabel": "Youth line: 503-567-6591",
        "email": "dropin@homeplateyouth.org",
        "hours": "Beaverton: Monday & Wednesday, 3–5pm and 6–8pm. Check the drop-in page for changes.",
        "url": "https://www.homeplateyouth.org/drop-in",
        "cta": "Drop-in hours & services",
        "howToStart": "Visit during drop-in hours or call the youth line. HomePlate says no ID is required to work with its programs.",
        "programs": [
          {
            "name": "Housing, education & employment connections",
            "scope": "Washington County youth",
            "desc": "Ask the drop-in or outreach team which program fits your needs and how to get started.",
            "url": "https://www.homeplateyouth.org/programs",
            "cta": "Explore HomePlate programs"
          },
          {
            "name": "LGBTQ+ inclusion commitment",
            "scope": "Beaverton & Hillsboro, OR · Washington County",
            "desc": "HomePlate’s equity statement explicitly includes gender identity and sexual orientation and says transphobia and homophobia are not tolerated.",
            "url": "https://www.homeplateyouth.org/our-team",
            "cta": "Read the organization’s statement",
            "sourceUrl": "https://www.homeplateyouth.org/our-team",
            "sourceChecked": "September 30, 2026"
          }
        ],
        "serviceTags": [
          "Youth drop-in",
          "Housing support",
          "Basic needs"
        ],
        "sourceUrl": "https://www.homeplateyouth.org/drop-in",
        "sourceChecked": "September 30, 2026",
        "contactSourceUrl": "https://www.homeplateyouth.org/drop-in",
        "contactChecked": "September 30, 2026",
        "categorySourceUrl": "https://www.homeplateyouth.org/drop-in"
      },
      {
        "name": "New Avenues for Youth / SMYRC",
        "logo": "/resources-logos/new-avenues.png",
        "scope": "Downtown",
        "desc": "SMYRC has served LGBTQIA2S+ youth ages 13 to 24 since 1998. A drop-in space with food, clothing, gender-affirming garments, counseling, and community events.",
        "addr": "1220 SW Columbia St",
        "url": "https://newavenues.org/smyrc/",
        "alt": "https://newavenues.org/donate/give-lgbtqia2s/",
        "altLabel": "Donate",
        "categoryIds": [
          "safety",
          "health",
          "community",
          "mental-health"
        ],
        "serviceTags": [
          "Meals",
          "Counseling"
        ],
        "categorySourceUrl": "https://newavenues.org/smyrc/",
        "lat": 45.5157796,
        "lng": -122.6871145,
        "phone": "tel:+15038729664",
        "phoneLabel": "SMYRC: 503-872-9664",
        "hours": "Drop-in hours vary · Check the SMYRC calendar before visiting",
        "contactSourceUrl": "https://newavenues.org/smyrc/",
        "contactChecked": "September 30, 2026"
      },
      {
        "name": "The Living Room",
        "logo": "/resources-logos/new-avenues.png",
        "sub": "A New Avenues for Youth program",
        "scope": "Clackamas County",
        "desc": "New Avenues has discontinued The Living Room as its program. Its official update directs LGBTQIA2S+ youth in Clackamas County to Youth Era for continuing support. Contact Youth Era for current services and locations.",
        "url": "https://newavenues.org/thelivingroomyouth",
        "cta": "Read program update",
        "alt": "https://www.youthera.org/",
        "altLabel": "Visit Youth Era",
        "sourceUrl": "https://newavenues.org/thelivingroomyouth",
        "sourceChecked": "September 30, 2026",
        "howToStart": "For current LGBTQIA2S+ youth support in Clackamas County, follow the Youth Era link below and confirm the current location and schedule. The former New Avenues program is discontinued.",
        "contactChecked": "September 30, 2026",
        "contactSourceUrl": "https://newavenues.org/thelivingroomyouth",
        "categoryIds": []
      },
      {
        "name": "Trans Youth Care Collective",
        "transSpecialist": true,
        "logo": "/resources-logos/trans-youth-care-collective.png",
        "mark": "TYCC",
        "scope": "Oregon",
        "desc": "Trans-led organization offering support groups.",
        "url": "https://transyouthcarecollective.com",
        "categoryIds": [
          "family",
          "community"
        ],
        "categorySourceUrl": "https://transyouthcarecollective.com",
        "addr": "4531 SE Belmont St, Portland, OR 97215",
        "alt": "https://transyouthcarecollective.com/contact-us",
        "altLabel": "Contact the collective",
        "howToStart": "Use the contact form or browse the groups page for youth and caregiver support. Confirm group times and attendance arrangements before visiting.",
        "contactSourceUrl": "https://transyouthcarecollective.com/contact-us",
        "contactChecked": "September 30, 2026",
        "lat": 45.5168808,
        "lng": -122.6154969
      },
      {
        "name": "TransActive Gender Project",
        "transSpecialist": true,
        "logo": "/resources-logos/transactive-gender-project.png",
        "sub": "At Lewis & Clark",
        "scope": "Portland",
        "desc": "Gender-focused peer support groups.",
        "url": "https://graduate.lclark.edu/programs/continuing_education/transactive/support-groups",
        "categoryIds": [
          "family",
          "community",
          "mental-health"
        ],
        "categorySourceUrl": "https://graduate.lclark.edu/programs/continuing_education/transactive/support-groups",
        "phone": "tel:+15037686024",
        "phoneLabel": "TransActive: 503-768-6024",
        "email": "transactive@lclark.edu",
        "contactSourceUrl": "https://graduate.lclark.edu/programs/continuing_education/transactive/support-groups/",
        "howToStart": "Apply for a youth or family peer group through the official page. Contact TransActive for the next group time and location; peer support groups are not therapy.",
        "contactChecked": "September 30, 2026"
      },
      {
        "name": "Bridge City Mentors",
        "logo": "/resources-logos/bridge-city-mentors-transparent.png",
        "scope": "NE Portland",
        "desc": "Black and LGBTQ-affiliated mentoring and advocacy organization supporting individuals and communities across the Portland metro since 2016.",
        "addr": "2636 NE Sandy Blvd, Suite E, Portland, OR 97232",
        "url": "https://bridgecitymentors.com/",
        "categoryIds": [
          "community"
        ],
        "categorySourceUrl": "https://bridgecitymentors.com/",
        "lat": 45.5283295,
        "lng": -122.6390186,
        "phone": "tel:+15034733306",
        "phoneLabel": "Bridge City Mentors",
        "email": "info@bridgecitymentors.com",
        "howToStart": "Call or email to discuss disability-support or job-development services and eligibility. Confirm an appointment before visiting the office.",
        "contactSourceUrl": "https://bridgecitymentors.com/contact-us/",
        "contactChecked": "September 30, 2026"
      },
      {
        "name": "Pairs With Pride",
        "logo": "/resources-logos/pairs-with-pride-transparent.png",
        "scope": "Oregon",
        "desc": "Intergenerational mentoring for LGBTQ+ youth.",
        "url": "https://perfectpair.org/pairs-with-pride",
        "categoryIds": [
          "family",
          "community"
        ],
        "categorySourceUrl": "https://perfectpair.org/pairs-with-pride",
        "email": "pairswithpride@perfectpair.org",
        "contactSourceUrl": "https://perfectpair.org/pairs-with-pride",
        "contactChecked": "September 30, 2026",
        "howToStart": "Email the Pairs With Pride team to learn about participating in its LGBTQ+ intergenerational matching program."
      },
      {
        "name": "P:EAR",
        "logo": "/resources-logos/p-ear.png",
        "scope": "Portland",
        "desc": "Arts programming and mentorship for unhoused and at-risk youth.",
        "url": "https://www.pearmentor.org",
        "categoryIds": [
          "safety",
          "arts"
        ],
        "serviceTags": [
          "Nutrition",
          "Mentorship"
        ],
        "categorySourceUrl": "https://www.pearmentor.org",
        "addr": "338 NW 6th Ave, Portland, OR 97209",
        "hours": "Onsite: Tue–Fri 9am–2pm",
        "phone": "tel:+15032286677",
        "phoneLabel": "503-228-6677",
        "email": "info@pearmentor.org",
        "contactSourceUrl": "https://www.pearmentor.org/get-involved/",
        "contactChecked": "September 30, 2026",
        "lat": 45.5257641,
        "lng": -122.676224
      },
      {
        "name": "Rainbow Youth",
        "logo": "/resources-logos/rainbow-youth-transparent.png",
        "scope": "Salem",
        "desc": "LGBTQIA+ youth support in Marion and Polk counties.",
        "url": "https://rainbowyouth.org",
        "categoryIds": [
          "youth",
          "community"
        ],
        "categorySourceUrl": "https://rainbowyouth.org",
        "email": "info@rainbowyouth.org",
        "contactSourceUrl": "https://rainbowyouth.org/",
        "howToStart": "Email Rainbow Youth or check the youth meetings page for the current meeting schedule and participation details.",
        "contactChecked": "September 30, 2026"
      }
    ]
  },
  {
    "id": "community",
    "name": "Community & Belonging",
    "color": "var(--yellow)",
    "what": "Community centers, the people behind Portland Pride, choruses, social clubs, and the archive that keeps our history.",
    "help": "Support groups, a library, a resource hub, emergency assistance, and year-round programs where you can find your people.",
    "forr": "Getting connected, getting involved, learning queer Oregon history, or just getting out of the house.",
    "use": "Not sure where to start? Start at Q Center, or Westside Q Center in Washington County. Check each calendar and go to one thing.",
    "orgs": [
      {
        "name": "Q Center",
        "logo": "/resources-logos/q-center.png",
        "scope": "Portland",
        "desc": "2SLGBTQIA+ community center with an art gallery, library, support groups, resource hub, emergency assistance, and space rentals.",
        "url": "https://www.pdxqcenter.org",
        "categoryIds": [
          "safety",
          "arts"
        ],
        "categorySourceUrl": "https://www.pdxqcenter.org",
        "addr": "4115 N Mississippi Ave, Portland, OR 97217",
        "phone": "tel:+15032347837",
        "phoneLabel": "503-234-7837",
        "contactSourceUrl": "https://www.pdxqcenter.org/",
        "contactChecked": "September 30, 2026",
        "lat": 45.553656,
        "lng": -122.6758553,
        "email": "info@pdxqcenter.org",
        "hours": "Call or email to confirm current opening hours. Group and event schedules vary.",
        "howToStart": "Browse the current support groups and events, or contact Q Center to find a program and confirm when to visit."
      },
      {
        "name": "Westside Q Center",
        "logoSurface": "light",
        "logo": "/resources-logos/westside-q-center-transparent.png",
        "scope": "Washington County",
        "desc": "LGBTQIA+ services and regular programs in Portland's western suburbs.",
        "url": "https://westsideqrc.org",
        "addr": "233 SE Washington St, Hillsboro, OR 97123",
        "email": "info@westsideqrc.org",
        "hours": "Office: Mon 2–6pm · Tue–Wed 3–7pm · Check calendar for additional drop-in sessions",
        "contactSourceUrl": "https://westsideqrc.org/contact/",
        "contactChecked": "September 30, 2026",
        "lat": 45.521572,
        "lng": -122.9873008,
        "howToStart": "Visit during published office hours, check the calendar for drop-in sessions and groups, or email the center before coming.",
        "categoryIds": []
      },
      {
        "name": "Pride Northwest",
        "logo": "/resources-logos/pride-northwest.png",
        "scope": "Portland",
        "desc": "The organizers of Portland Pride. Year-round programs celebrating and supporting the LGBTQ2SIA+ community, including Trans Unity and Pride Days of Service.",
        "url": "https://www.pridenw.org/",
        "alt": "https://www.pridenw.org/donate",
        "altLabel": "Donate",
        "phone": "tel:+15032959788",
        "phoneLabel": "Pride Northwest",
        "email": "info@pridenw.org",
        "mailingAddress": "PO Box 6611, Portland, OR 97228",
        "contactSourceUrl": "https://www.pridenw.org/contact",
        "contactChecked": "September 30, 2026",
        "howToStart": "Call or email Pride Northwest about its community programs, participation or volunteer opportunities.",
        "categoryIds": []
      },
      {
        "name": "Lesbian Culture Club",
        "logoSurface": "light",
        "logo": "/resources-logos/lesbian-culture-club.svg",
        "scope": "Portland",
        "desc": "Queer community for lesbians, trans people, nonbinary people, and anyone who feels at home there.",
        "url": "https://lesbiancultureclub.com",
        "email": "hi@lesbiancultureclub.com",
        "contactSourceUrl": "https://lesbiancultureclub.com/pages/contact",
        "contactChecked": "September 30, 2026",
        "categoryIds": []
      },
      {
        "name": "Queer Social Club",
        "logo": "/resources-logos/queer-social-club-transparent.png",
        "scope": "Portland",
        "desc": "Community-driven event calendars for queer happenings in Portland and the greater Pacific Northwest.",
        "url": "https://queersocialclub.com",
        "email": "hi@queersocialclub.com",
        "hours": "Online calendar · Event times and venues vary",
        "howToStart": "Browse the Portland calendar for event details. Email QSC for questions or listing corrections; check each event’s organizer link before attending.",
        "contactSourceUrl": "https://queersocialclub.com/about",
        "contactChecked": "September 30, 2026",
        "categoryIds": []
      },
      {
        "name": "Oregon Queer History Project",
        "logo": "/resources-logos/oregon-queer-history-transparent.png",
        "mark": "GLAPN",
        "sub": "GLAPN",
        "scope": "Oregon",
        "desc": "LGBTQIA2S+ archives of the Pacific Northwest.",
        "url": "https://glapn.org",
        "categoryIds": [
          "arts"
        ],
        "categorySourceUrl": "https://glapn.org",
        "email": "info@glapn.org",
        "mailingAddress": "PO Box 3646, Portland, OR 97208-3646",
        "contactSourceUrl": "https://glapn.org/",
        "contactChecked": "September 30, 2026"
      },
      {
        "name": "Oregon Department of Veterans' Affairs",
        "logo": "/resources-logos/oregon-department-of-veterans-affairs.svg",
        "mark": "ODVA",
        "sub": "LGBTQ+ veterans resources",
        "scope": "Statewide",
        "desc": "A safe and confidential space and resources for LGBTQ+, trans, and intersex veterans.",
        "url": "https://www.oregon.gov/odva/resources",
        "categoryIds": [
          "family"
        ],
        "categorySourceUrl": "https://www.oregon.gov/odva/resources",
        "addr": "700 Summer St NE, Salem, OR 97301",
        "hours": "Headquarters: Mon–Fri 8am–5pm",
        "phone": "tel:+18006929666",
        "phoneLabel": "General inquiries",
        "email": "orvets.benefits@odva.oregon.gov",
        "howToStart": "Call or email ODVA about benefits and local veteran services. Use the service-office locator to find help near you; confirm arrangements before visiting.",
        "contactSourceUrl": "https://www.oregon.gov/ODVA/Connect/Pages/Connect.aspx",
        "contactChecked": "September 30, 2026",
        "lat": 44.9445133,
        "lng": -123.0268903
      },
      {
        "name": "TransPonder",
        "transSpecialist": true,
        "logo": "/resources-logos/transponder.svg",
        "mark": "TP",
        "scope": "Eugene · Virtual",
        "desc": "Trans-led peer support and mental-health services, plus food access and free harm-reduction supplies through the Lavender Network.",
        "url": "https://www.transponderoregon.org/",
        "categoryIds": [
          "community",
          "safety",
          "family",
          "health",
          "harm-reduction",
          "mental-health"
        ],
        "serviceTags": [
          "Food access",
          "Peer support"
        ],
        "categorySourceUrl": "https://www.transponderoregon.org/bh-program",
        "addr": "1590 Willamette St, Eugene, OR 97401",
        "hours": "Mon–Thu 9am–noon and 1pm–5pm · Fri by appointment",
        "phone": "tel:+15413210872",
        "phoneLabel": "541-321-0872",
        "email": "info@transponderoregon.org",
        "contactSourceUrl": "https://www.transponderoregon.org/contact-us",
        "contactChecked": "September 30, 2026",
        "lat": 44.0426173,
        "lng": -123.0931262
      },
      {
        "name": "Mid-Willamette Trans Support Network",
        "transSpecialist": true,
        "logo": "/resources-logos/mid-willamette-trans-support-network.png",
        "mark": "MWTSN",
        "scope": "Linn · Benton · Lincoln",
        "desc": "Grassroots peer support for trans and nonbinary people in the valley.",
        "url": "https://midwillamettetsn.wixsite.com/oursite",
        "categoryIds": [
          "community",
          "family",
          "mental-health"
        ],
        "categorySourceUrl": "https://midwillamettetsn.wixsite.com/oursite",
        "email": "midwillamettetsn@gmail.com",
        "contactSourceUrl": "https://midwillamettetsn.wixsite.com/oursite",
        "howToStart": "Email the network for current peer-support meeting times and locations.",
        "contactChecked": "September 30, 2026"
      },
      {
        "name": "Rogue Action Center",
        "logoSurface": "light",
        "logo": "/resources-logos/rogue-action-center.png",
        "scope": "Josephine · Jackson",
        "desc": "Rogue Action Center has closed. Its website now provides a list of other Southern Oregon organizations and resources. Use that list to find current support; RAC is no longer an active service provider.",
        "url": "https://rogueactioncenter.org",
        "cta": "Find replacement resources",
        "sourceUrl": "https://rogueactioncenter.org",
        "sourceChecked": "September 30, 2026",
        "howToStart": "RAC is closed and no longer provides services. Open its community resource list to contact another Southern Oregon organization directly.",
        "contactChecked": "September 30, 2026",
        "contactSourceUrl": "https://rogueactioncenter.org",
        "categoryIds": []
      },
      {
        "name": "People Like Us",
        "scope": "Wallowa County",
        "desc": "Rural 2SLGBTQIA+ organizing and support.",
        "url": "https://wallowalgbtq.org/",
        "cta": "Visit page",
        "logo": "/resources-logos/people-like-us-transparent.png",
        "email": "info@wallowalgbtq.org",
        "mailingAddress": "PO Box 118, Enterprise, OR 97828",
        "contactSourceUrl": "https://wallowalgbtq.org/contact",
        "contactChecked": "September 30, 2026",
        "howToStart": "Contact People Like Us for current support-group times and participation details. The PO box is for mail; meeting locations vary.",
        "categoryIds": []
      }
    ]
  },
  {
    "id": "family",
    "name": "Family, Elders & Culture",
    "color": "var(--neon-magenta)",
    "what": "Groups for the people around you and the communities you come from: families, parents of trans kids, elders, Two-Spirit and Indigenous folks, Pacific Islanders, and trans social groups.",
    "help": "Belonging that fits your whole life, not just one part of it, from people who share your story.",
    "forr": "Parents and families learning how to show up, LGBTQ+ people 60 and up, and finding folks who share your culture.",
    "use": "Most run regular meetings, groups, or events. Check each site for the schedule and come to one.",
    "orgs": [
      {
        "name": "PFLAG Vancouver",
        "logo": "/resources-logos/pflag-vancouver.svg",
        "aliases": [
          "PFLAG Vancouver WA",
          "PFLAG Southwest Washington"
        ],
        "categoryIds": [
          "family",
          "community"
        ],
        "scope": "Vancouver, WA · Greater Vancouver area",
        "desc": "Support for LGBTQ+ people and the families and allies who love them in Vancouver, WA. Monthly peer meetings, education, and advocacy help build an affirming local community.",
        "email": "pflagvancouverwa@gmail.com",
        "hours": "Second Tuesday each month, 6:30–8:30pm. Contact the chapter for the location.",
        "url": "https://vancouver.pflag.org/meeting-info/",
        "cta": "Meeting information",
        "contactSourceUrl": "https://vancouver.pflag.org/meeting-info/",
        "howToStart": "Email the chapter for the meeting location and current details. This is the Vancouver, Washington chapter.",
        "programs": [
          {
            "name": "Chapter support & questions",
            "scope": "Vancouver, Washington",
            "desc": "Use the chapter contact form for questions about support and getting involved.",
            "url": "https://vancouver.pflag.org/contact/",
            "cta": "Contact the chapter"
          }
        ],
        "serviceTags": [
          "Family support",
          "LGBTQ+ community",
          "Peer connection"
        ],
        "sourceUrl": "https://vancouver.pflag.org/meeting-info/",
        "sourceChecked": "September 30, 2026",
        "contactChecked": "September 30, 2026",
        "categorySourceUrl": "https://vancouver.pflag.org/meeting-info/"
      },
      {
        "name": "PFLAG Portland",
        "logoSurface": "light",
        "logo": "/resources-logos/pflag-portland.png",
        "scope": "Portland",
        "desc": "Family support and education for the parents and loved ones of LGBTQ+ people.",
        "url": "https://pflagpdx.org/",
        "categoryIds": [
          "community",
          "legal"
        ],
        "categorySourceUrl": "https://pflagpdx.org/",
        "phone": "tel:+15032327676",
        "phoneLabel": "PFLAG voicemail · reply in 24–48 hours",
        "mailingAddress": "PO Box 12361, Portland, OR 97212",
        "howToStart": "Leave a voicemail or use the contact form. PFLAG Portland has no physical office; check the meetings page for support-group locations and schedules.",
        "contactSourceUrl": "https://pflagpdx.org/contact/",
        "contactChecked": "September 30, 2026"
      },
      {
        "name": "PDX Transparent",
        "transSpecialist": true,
        "logo": "/resources-logos/pdx-transparent.svg",
        "mark": "PT",
        "scope": "Portland",
        "desc": "Support for parents of trans youth, with virtual chapters too.",
        "url": "https://transparentusa.org/chapters-oregon",
        "categoryIds": [
          "community"
        ],
        "categorySourceUrl": "https://transparentusa.org/chapters-oregon",
        "hours": "Meetings: second Tuesday monthly, 6:30–8:30pm · Confirm with the chapter leader",
        "howToStart": "Use the Oregon chapter form to contact the Portland chapter leader and confirm the meeting location and participation details.",
        "contactSourceUrl": "https://transparentusa.org/chapters-oregon/",
        "contactChecked": "September 30, 2026"
      },
      {
        "name": "Friendly House",
        "logoSurface": "light",
        "logo": "/resources-logos/friendly-house.svg",
        "sub": "Elder Pride Services · SAGE Metro Portland",
        "scope": "Portland",
        "desc": "Services for LGBTQ+ older adults, including housing help and case management, as Portland's affiliate of SAGE, the national LGBT elder organization.",
        "url": "https://fhpdx.org/for-adults-seniors/elder-pride-services/",
        "categoryIds": [
          "community",
          "safety",
          "legal"
        ],
        "serviceTags": [
          "Older adults",
          "Housing navigation"
        ],
        "categorySourceUrl": "https://fhpdx.org/for-adults-seniors/elder-pride-services/",
        "addr": "1737 NW 26th Ave, Portland, OR 97210",
        "hours": "Community center: Mon–Thu 7am–7pm · Fri 7am–8pm · Sat 8:30am–4pm · Sun closed",
        "phone": "tel:+15032284391",
        "phoneLabel": "503-228-4391",
        "contactSourceUrl": "https://fhpdx.org/",
        "contactChecked": "September 30, 2026",
        "lat": 45.5351956,
        "lng": -122.7052541
      },
      {
        "name": "NAYA",
        "logoSurface": "light",
        "logo": "/resources-logos/naya-transparent.png",
        "sub": "Two-Spirit Safe Space Alliance",
        "scope": "Portland",
        "desc": "Indigenous LGBTQIA2S+ support groups and cultural events at the Native American Youth and Family Center.",
        "url": "https://nayapdx.org/services/two-spirit-safe-space-alliance",
        "categoryIds": [
          "youth",
          "community",
          "safety",
          "money"
        ],
        "serviceTags": [
          "Nutrition",
          "Housing"
        ],
        "categorySourceUrl": "https://nayapdx.org/services",
        "addr": "5135 NE Columbia Blvd, Portland, OR 97218",
        "hours": "Main campus: Mon–Fri 9am–6pm · Check for holiday and weather closures",
        "phone": "tel:+15032888177",
        "phoneLabel": "503-288-8177",
        "contactSourceUrl": "https://nayapdx.org/frequently-asked-questions",
        "contactChecked": "September 30, 2026",
        "lat": 45.5707498,
        "lng": -122.6099254
      },
      {
        "name": "UTOPIA PDX",
        "logo": "/resources-logos/utopia-pdx.png",
        "scope": "Portland",
        "desc": "Community organization for queer and trans Pacific Islanders.",
        "url": "https://www.utopiaportland.org/",
        "categoryIds": [
          "community",
          "legal"
        ],
        "categorySourceUrl": "https://www.utopiaportland.org/",
        "email": "info@utopiaportland.org",
        "contactSourceUrl": "https://www.utopiaportland.org/",
        "contactChecked": "September 30, 2026"
      },
      {
        "name": "Northwest Gender Alliance",
        "transSpecialist": true,
        "logo": "/resources-logos/northwest-gender-alliance.png",
        "scope": "Portland metro",
        "desc": "Social support and education for transgender and gender-expansive people.",
        "url": "https://www.nwgenderalliance.org/",
        "categoryIds": [
          "community",
          "legal"
        ],
        "categorySourceUrl": "https://www.nwgenderalliance.org/",
        "email": "info@nwgenderalliance.org",
        "mailingAddress": "PO Box 6534, Beaverton, OR 97007",
        "contactSourceUrl": "https://www.nwgenderalliance.org/contact-us",
        "howToStart": "Email the group for meeting details, coming-out support or educational requests. The PO box is for mail, not visits.",
        "contactChecked": "September 30, 2026"
      }
    ]
  },
  {
    "id": "money",
    "name": "Money, Work & Business",
    "color": "var(--green-acid)",
    "what": "Scholarships, free tax prep, small-business advising, and Oregon's LGBTQ+ business network.",
    "help": "Keep more of your money, pay for school, and get real help starting or growing a business.",
    "forr": "Students, entrepreneurs, creatives with a side business, and anyone filing taxes on a lower income.",
    "use": "Check eligibility first. CASH Oregon offers an online eligibility checker. SCORE and the SBDC offer advising you can request online.",
    "orgs": [
      {
        "name": "Oregon Pride in Business",
        "logoSurface": "light",
        "logo": "/resources-logos/oregon-pride-in-business.png",
        "mark": "ORPIB",
        "sub": "ORPIB",
        "scope": "Oregon",
        "desc": "Business education and networking for LGBTQ+ entrepreneurs.",
        "url": "https://www.orpib.com",
        "categoryIds": [
          "community",
          "legal"
        ],
        "categorySourceUrl": "https://www.orpib.com",
        "phone": "tel:+19714423224",
        "phoneLabel": "971-442-3224",
        "email": "info@orpib.com",
        "mailingAddress": "PO Box 86241, Portland, OR 97286",
        "alt": "sms:+19714423224",
        "altLabel": "Text ORPIB · preferred",
        "contactSourceUrl": "https://www.orpib.com/",
        "howToStart": "Text 971-442-3224 (preferred), email the team, or use the website to explore membership, business education and mentorship.",
        "contactChecked": "September 30, 2026"
      },
      {
        "name": "Pride Foundation",
        "logo": "/resources-logos/pride-foundation.svg",
        "scope": "Pacific Northwest",
        "desc": "Philanthropic foundation offering scholarships for LGBTQ+ students across the Northwest.",
        "url": "https://pridefoundation.org",
        "categoryIds": [
          "youth",
          "arts"
        ],
        "serviceTags": [
          "Scholarships"
        ],
        "categorySourceUrl": "https://pridefoundation.org/find-funding/scholarships/scholarship-opportunities/",
        "phone": "tel:+18007357287",
        "phoneLabel": "800-735-7287",
        "mailingAddress": "2014 E Madison St, Suite 400B, Seattle, WA 98122",
        "contactSourceUrl": "https://pridefoundation.org/about-us/contact-us/",
        "alt": "https://pridefoundation.org/about-us/contact-us/",
        "altLabel": "Contact the foundation",
        "howToStart": "Start with the scholarship or grant guidelines, then contact the program team through the official contact page. The organization recommends email; confirm any office visit in advance.",
        "contactChecked": "September 30, 2026"
      },
      {
        "name": "CASH Oregon",
        "logo": "/resources-logos/cash-oregon.svg",
        "logoSurface": "light",
        "scope": "Portland",
        "desc": "Free federal and Oregon tax preparation for eligible households, plus ITIN application and renewal help. Check the current eligibility requirements and appointment availability.",
        "url": "https://cashoregon.org",
        "serviceTags": [
          "Tax help"
        ],
        "addr": "919 NE 19th Ave, Suite 200, Portland, OR 97232",
        "hours": "Office: Mon–Fri 9am–5pm · Tax appointments have separate schedules",
        "phone": "tel:+15032437765",
        "phoneLabel": "503-243-7765",
        "contactSourceUrl": "https://cashoregon.org/contact-us",
        "howToStart": "Use the official eligibility checker and select in-person or virtual tax preparation. Confirm the current income limit and available appointments before visiting.",
        "contactChecked": "September 30, 2026",
        "lat": 45.5292501,
        "lng": -122.6470275,
        "categoryIds": []
      },
      {
        "name": "Portland Small Business Development Center",
        "logo": "/resources-logos/portland-small-business-development-center-transparent.png",
        "mark": "SBDC",
        "scope": "Portland",
        "desc": "Small-business advising and training for Portland-area entrepreneurs.",
        "url": "https://oregonsbdc.org",
        "email": "sbdc@pcc.edu",
        "contactSourceUrl": "https://www.pcc.edu/small-business/",
        "howToStart": "Register for the free Intro to SBDC orientation or request business advising. Email sbdc@pcc.edu to ask which service fits your business.",
        "contactChecked": "September 30, 2026",
        "categoryIds": []
      },
      {
        "name": "SCORE Portland",
        "scope": "Portland",
        "desc": "Free small-business mentoring and workshops.",
        "url": "https://www.score.org/or/portland/",
        "logo": "/directory-logos/place-scoreportland.svg",
        "phone": "tel:+15033052005",
        "phoneLabel": "503-305-2005",
        "contactSourceUrl": "https://www.score.org/or/portland/",
        "contactChecked": "September 30, 2026",
        "howToStart": "Request a free mentor match online using your ZIP code. Call the Portland chapter with questions about getting started.",
        "categoryIds": []
      },
      {
        "name": "Prosper Portland",
        "logo": "/resources-logos/prosper-portland.svg",
        "scope": "Portland",
        "desc": "City-backed programs supporting Portland small businesses and creatives.",
        "url": "https://prosperportland.us",
        "addr": "220 NW Second Ave, Suite 200, Portland, OR 97209",
        "phone": "tel:+15038233200",
        "phoneLabel": "503-823-3200",
        "contactSourceUrl": "https://prosperportland.us/contact/",
        "alt": "https://prosperportland.us/contact/",
        "altLabel": "Contact Prosper Portland",
        "contactChecked": "September 30, 2026",
        "lat": 45.5247044,
        "lng": -122.6721971,
        "hours": "Call to confirm office hours and visit arrangements.",
        "howToStart": "Call the general number or use the contact form for business-support questions and referrals.",
        "categoryIds": []
      },
      {
        "name": "Business Oregon",
        "logo": "/resources-logos/business-oregon-official.png",
        "scope": "Oregon",
        "desc": "Oregon's economic development agency, with grant and fellowship programs for artists and creative businesses.",
        "url": "https://www.oregon.gov/biz",
        "addr": "121 SW Salmon St, Suite 205, Portland, OR 97204",
        "phone": "tel:+15032295625",
        "phoneLabel": "Portland office",
        "email": "business.oregon@oregon.gov",
        "contactSourceUrl": "https://www.oregon.gov/biz/aboutus/contactus/Pages/default.aspx",
        "locations": [
          {
            "name": "Portland office",
            "address": "121 SW Salmon St, Suite 205, Portland, OR 97204",
            "lat": 45.5162968,
            "lng": -122.6749311
          },
          {
            "name": "Salem headquarters",
            "address": "775 Summer St NE, Suite 310, Salem, OR 97301-1280",
            "hours": "Mon–Fri 8am–5pm",
            "lat": 44.9453845,
            "lng": -123.0275772
          },
          {
            "name": "Eastern Oregon office",
            "address": "243 SE 4th St, Pendleton, OR 97801",
            "lat": 45.6733313,
            "lng": -118.7835606
          }
        ],
        "contactChecked": "September 30, 2026",
        "lat": 45.5162968,
        "lng": -122.6749311,
        "howToStart": "Call the Portland office or email Business Oregon to ask which assistance program fits your business. Confirm an appointment before visiting.",
        "categoryIds": []
      }
    ]
  },
  {
    "id": "arts",
    "name": "Arts, Funding & Spaces",
    "color": "var(--neon-violet)",
    "what": "Funders, galleries, studios, classes, and the places where auditions and new work get posted.",
    "help": "Grants and emergency funds to make the work, tools and teachers you might not have at home, and a way into Portland's stages.",
    "forr": "Funding a project, taking a class, finding an audition, or showing your work, with free and low-cost options.",
    "use": "Check the scope tag first: Portland, Multnomah County, Oregon, or National. Read eligibility and deadlines on each site, and sign up for classes early.",
    "orgs": [
      {
        "name": "Portland Queer Arts Foundation",
        "logo": "/resources-logos/portland-queer-arts-foundation.png",
        "mark": "PQAF",
        "scope": "Portland",
        "desc": "Funds queer artists and projects, and keeps a resource guide for grants, services, spaces, and community organizations.",
        "url": "https://portlandqueerarts.foundation",
        "categoryIds": [
          "money",
          "community"
        ],
        "serviceTags": [
          "Artist funding"
        ],
        "categorySourceUrl": "https://portlandqueerarts.foundation",
        "phone": "tel:+15034798655",
        "phoneLabel": "Portland Queer Arts Foundation",
        "mailingAddress": "PO Box 33935, Portland, OR 97292",
        "alt": "https://portlandqueerarts.foundation/contact/",
        "altLabel": "Contact the foundation",
        "howToStart": "Call or use the contact form for artist programs and collaboration. Artist-project grant applications are currently closed; check the website for future cycles.",
        "contactSourceUrl": "https://portlandqueerarts.foundation/contact/",
        "contactChecked": "September 30, 2026"
      },
      {
        "name": "Regional Arts & Culture Council",
        "logoSurface": "light",
        "logo": "/resources-logos/regional-arts-culture-council.png",
        "mark": "RACC",
        "scope": "Portland",
        "desc": "Portland arts funder, including the Portland Arts Project Grant for individual artists and arts organizations.",
        "url": "https://racc.org",
        "categoryIds": [
          "money"
        ],
        "serviceTags": [
          "Grants"
        ],
        "categorySourceUrl": "https://racc.org",
        "addr": "411 NW Park Ave, Suite 101, Portland, OR 97209",
        "hours": "Office: Mon–Fri 8:30am–5pm · Schedule in-person meetings ahead",
        "phone": "tel:+15038235111",
        "phoneLabel": "503-823-5111",
        "email": "info@racc.org",
        "contactSourceUrl": "https://racc.org/about/contact-us/",
        "contactChecked": "September 30, 2026",
        "lat": 45.5261182,
        "lng": -122.679504
      },
      {
        "name": "Multnomah County Cultural Coalition",
        "logoSurface": "light",
        "logo": "/resources-logos/multnomah-county-cultural-coalition.png",
        "mark": "MCCC",
        "scope": "Multnomah County",
        "desc": "Cultural-enrichment organization supporting Multnomah County residents and local arts work.",
        "url": "https://www.multcoculturalcoalition.org",
        "categoryIds": [
          "money"
        ],
        "serviceTags": [
          "Grants"
        ],
        "categorySourceUrl": "https://www.multcoculturalcoalition.org",
        "alt": "https://www.multcoculturalcoalition.org/contact",
        "altLabel": "Contact the coalition",
        "howToStart": "Use the website contact form for grant or eligibility questions. The inbox is monitored by volunteers.",
        "contactSourceUrl": "https://www.multcoculturalcoalition.org/contact",
        "contactChecked": "September 30, 2026"
      },
      {
        "name": "Oregon Arts Commission",
        "logoSurface": "light",
        "logo": "/resources-logos/oregon-arts-commission.png",
        "scope": "Oregon",
        "desc": "State grants for Oregon artists and organizations, including individual artist fellowships.",
        "url": "https://www.oregonartscommission.org",
        "categoryIds": [
          "money"
        ],
        "serviceTags": [
          "Grants"
        ],
        "categorySourceUrl": "https://www.oregonartscommission.org",
        "addr": "775 Summer St NE, Suite 310, Salem, OR 97301-1280",
        "phone": "tel:+19713045044",
        "phoneLabel": "Oregon Arts Commission",
        "email": "oregon.artscomm@oregon.gov",
        "contactSourceUrl": "https://www.oregonartscommission.org/",
        "contactChecked": "September 30, 2026",
        "lat": 44.9453845,
        "lng": -123.0275772,
        "howToStart": "Call or email the commission about grant eligibility, application assistance or accessibility. Confirm arrangements before visiting its Salem office."
      },
      {
        "name": "Future Prairie",
        "logo": "/resources-logos/future-prairie.svg",
        "scope": "Oregon",
        "desc": "Nonprofit queer artist collective supporting LGBTQIA+ Oregon-based working-class artists.",
        "url": "https://futureprairie.com",
        "alt": "https://futureprairie.com/contact.html",
        "altLabel": "Contact Future Prairie",
        "howToStart": "Use the contact form to reach the executive director about programs, participation or collaboration. Check individual event listings for times and venues.",
        "contactSourceUrl": "https://futureprairie.com/contact.html",
        "contactChecked": "September 30, 2026",
        "categoryIds": []
      },
      {
        "name": "Foundation for Contemporary Arts",
        "scope": "National",
        "desc": "Emergency grants and opportunity grants for experimental and contemporary artists.",
        "url": "https://foundationforcontemporaryarts.org",
        "categoryIds": [
          "money"
        ],
        "serviceTags": [
          "Artist grants"
        ],
        "categorySourceUrl": "https://www.foundationforcontemporaryarts.org/grants/by-application/",
        "alt": "https://www.foundationforcontemporaryarts.org/connect/",
        "altLabel": "Contact the foundation",
        "phone": "tel:+12128077077",
        "phoneLabel": "212-807-7077",
        "howToStart": "Read the grant guidelines and FAQs before applying. Use the contact form for questions; call or email grants@contemporary-arts.org if you need help accessing the application.",
        "contactSourceUrl": "https://www.foundationforcontemporaryarts.com/grants/faq/",
        "contactChecked": "September 30, 2026",
        "logo": "/resources-logos/foundation-for-contemporary-arts.svg"
      },
      {
        "name": "Ori Gallery",
        "logo": "/resources-logos/ori-gallery.png",
        "scope": "Portland",
        "desc": "Trans and queer artists of color gallery and organizing space offering free and low-cost classes and workshops.",
        "url": "https://oriartgallery.org",
        "categoryIds": [
          "community",
          "money"
        ],
        "categorySourceUrl": "https://oriartgallery.org",
        "addr": "4038 N Mississippi Ave, Portland, OR 97217",
        "hours": "Thu–Sun 1pm–6pm",
        "alt": "https://oriartgallery.org/contact",
        "altLabel": "Contact the gallery",
        "contactSourceUrl": "https://oriartgallery.org/contact",
        "contactChecked": "September 30, 2026",
        "lat": 45.5527108,
        "lng": -122.6753325
      },
      {
        "name": "Independent Publishing Resource Center",
        "logoSurface": "light",
        "logo": "/resources-logos/independent-publishing-resource-center.png",
        "mark": "IPRC",
        "scope": "Portland",
        "desc": "Printmaking, publishing, and literary arts center.",
        "url": "https://www.iprc.org",
        "categoryIds": [
          "community"
        ],
        "categorySourceUrl": "https://www.iprc.org",
        "addr": "318 SE Main St, Suites 155 & 145, Portland, OR 97214",
        "hours": "Tue–Thu noon–9pm · Fri–Sat noon–6pm",
        "phone": "tel:+15038270249",
        "phoneLabel": "503-827-0249",
        "contactSourceUrl": "https://www.iprc.org/",
        "contactChecked": "September 30, 2026",
        "lat": 45.5135402,
        "lng": -122.6623385
      },
      {
        "name": "Sincere Studio",
        "logo": "/resources-logos/sincere-studio.svg",
        "scope": "Portland",
        "desc": "Sewing-focused nonprofit with tools and classes.",
        "url": "https://sincerestudiopdx.org",
        "categoryIds": [
          "community"
        ],
        "serviceTags": [
          "Sewing",
          "Classes"
        ],
        "categorySourceUrl": "https://sincerestudiopdx.org",
        "addr": "2134 N Flint Ave, Portland, OR 97227",
        "contactSourceUrl": "https://www.sincerestudiopdx.org/about-3",
        "howToStart": "Choose a class or community program on the studio calendar and confirm its location and schedule before attending. The current website lists the studio at 2134 N Flint Avenue.",
        "contactChecked": "September 30, 2026",
        "lat": 45.5384109,
        "lng": -122.668605
      },
      {
        "name": "Portland Playhouse",
        "logo": "/resources-logos/portland-playhouse.png",
        "scope": "Portland",
        "desc": "Theatre apprenticeship and education, including its Apprentice Program.",
        "url": "https://www.portlandplayhouse.org",
        "addr": "602 NE Prescott St, Portland, OR 97211",
        "phone": "tel:+15034885822",
        "phoneLabel": "503-488-5822",
        "hours": "Call before visiting: the official contact page lists conflicting box-office hours.",
        "contactSourceUrl": "https://portlandplayhouse.org/about-us/contact-us/",
        "contactChecked": "September 30, 2026",
        "lat": 45.5553246,
        "lng": -122.6593727,
        "categoryIds": []
      },
      {
        "name": "Radical Faerie Arts Fest",
        "logo": "/resources-logos/radical-faerie-arts-fest-transparent.png",
        "mark": "RFAF",
        "scope": "Portland",
        "desc": "Artist-centered market and audience-building model for queer artists.",
        "url": "https://www.radfaf.org",
        "email": "terrypcavanagh@gmail.com",
        "phone": "tel:+18313452053",
        "phoneLabel": "Festival contact · Hammer",
        "howToStart": "Contact the organizer to ask whether a new festival is planned. The website displays a past May 17–21 program; those dates, hours and venue are not a confirmed upcoming schedule.",
        "contactSourceUrl": "https://www.radfaf.org/",
        "contactChecked": "September 30, 2026",
        "categoryIds": []
      },
      {
        "name": "Fertile Ground Festival",
        "logoSurface": "light",
        "logo": "/resources-logos/fertile-ground-festival.png",
        "scope": "Portland",
        "desc": "Portland platform for new and developing performance work.",
        "url": "https://fertilegroundpdx.org",
        "email": "fertileground@portlandtheatre.com",
        "howToStart": "Email the festival for participation, ticketing or accessibility questions. Performance times and locations vary by production.",
        "contactSourceUrl": "https://fertilegroundpdx.org/",
        "contactChecked": "September 30, 2026",
        "categoryIds": []
      },
      {
        "name": "Portland Area Theatre Alliance",
        "logo": "/resources-logos/portland-area-theatre-alliance-transparent.png",
        "mark": "PATA",
        "scope": "Portland",
        "desc": "Auditions, listings, and theatre events for the Portland area.",
        "url": "https://portlandtheatre.com",
        "categoryIds": [
          "money",
          "community"
        ],
        "categorySourceUrl": "https://portlandtheatre.com",
        "phone": "tel:+15034496270",
        "phoneLabel": "Portland Area Theatre Alliance",
        "mailingAddress": "Portland Area Theatre Alliance Mailbox, 128 NW 11th Ave, Portland, OR 97209",
        "contactSourceUrl": "https://portlandtheatre.com/",
        "contactChecked": "September 30, 2026"
      },
      {
        "name": "PDXBackstage",
        "mark": "PDXB",
        "scope": "Portland",
        "desc": "Portland theatre community listserv for opportunities and discussion.",
        "url": "https://groups.io/g/pdxbackstage",
        "categoryIds": [
          "community"
        ],
        "categorySourceUrl": "https://groups.io/g/pdxbackstage",
        "logo": "/resources-logos/pdxbackstage-wordmark.svg",
        "email": "pdxbackstage+owner@groups.io",
        "howToStart": "Apply to join the online group and read its posting guidelines. Membership requires moderator approval. Email the group owner for membership questions; the public posting address reaches the group.",
        "contactSourceUrl": "https://groups.io/g/pdxbackstage",
        "contactChecked": "September 30, 2026"
      },
      {
        "name": "Backstage",
        "mark": "BS",
        "scope": "Online",
        "desc": "Casting calls and performance opportunities for working artists.",
        "url": "https://www.backstage.com",
        "categoryIds": [
          "money"
        ],
        "serviceTags": [
          "Casting"
        ],
        "categorySourceUrl": "https://www.backstage.com/casting/",
        "alt": "https://help.backstage.com/en/articles/12633151-contact-us",
        "altLabel": "Contact support",
        "contactSourceUrl": "https://help.backstage.com/en/articles/12633151-contact-us",
        "howToStart": "Use the help center’s chat widget for account or service questions. You can request a human support agent, who replies by email; most requests are answered within one business day. Some weekend support is available.",
        "contactChecked": "September 30, 2026",
        "logo": "/resources-logos/backstage.svg"
      }
    ]
  },
  {
    "id": "mental-health",
    "name": "Mental Health & Peer Support",
    "color": "var(--res-neutral)",
    "what": "Counseling, behavioral health, and people who understand.",
    "help": "Find affirming support for your emotional wellbeing.",
    "forr": "Therapy, peer counseling, support groups, and recovery services. Each provider lists its own eligibility.",
    "use": "Check whether the service is clinical therapy or peer support, then contact the provider to get started.",
    "orgs": []
  },
  {
    "id": "harm-reduction",
    "name": "Harm Reduction",
    "color": "var(--neon-orange)",
    "what": "Practical supplies, overdose prevention, testing, and nonjudgmental support.",
    "help": "Support for your health and choices, without requiring abstinence.",
    "forr": "Naloxone, safer-use supplies, syringe services, drug checking, and peer support. Meet yourself where you are.",
    "use": "Use the linked provider page or call for current hours, supply availability, and service eligibility.",
    "orgs": [
      {
        "name": "Multnomah County Harm Reduction",
        "logoSurface": "light",
        "logo": "/resources-logos/multnomah-county-harm-reduction.svg",
        "scope": "East Portland · County services",
        "mark": "MCHD",
        "desc": "Sterile supplies, syringe disposal, naloxone, fentanyl test strips, sexual-health services, and connections to care. Free overdose rescue kits and test strips are available through syringe services for people who use drugs. Call for the current clinic and supply schedule.",
        "addr": "12425 NE Glisan St, Portland, OR 97230",
        "phone": "tel:+15039880577",
        "phoneLabel": "Harm Reduction Clinic: 503-988-0577",
        "url": "https://multco.us/services/syringe-exchange",
        "sourceUrl": "https://multco.us/info/overdose-prevention",
        "cta": "Services & locations",
        "sourceChecked": "September 30, 2026",
        "categoryIds": [
          "health",
          "safety"
        ],
        "serviceTags": [
          "Naloxone",
          "Testing"
        ],
        "categorySourceUrl": "https://multco.us/info/overdose-prevention",
        "lat": 45.5270537,
        "lng": -122.5353368,
        "hours": "Mon & Thu 11am–2pm and 3–7pm · Call to confirm the current schedule",
        "alt": "tel:+15032801611",
        "altLabel": "Syringe exchange schedule: 503-280-1611",
        "contactSourceUrl": "https://multco.us/services/syringe-exchange",
        "howToStart": "The clinic is in Menlo Park Plaza behind Walgreens. Call the clinic or schedule line before visiting for supplies and services.",
        "contactChecked": "September 30, 2026"
      },
      {
        "name": "HIV Alliance · Syringe Services",
        "logo": "/resources-logos/hiv-alliance-syringe-services.png",
        "scope": "Washington County · Other Oregon counties",
        "mark": "HIVA",
        "desc": "Syringe exchange, safer-use supplies, naloxone distribution and training, and harm-reduction support. The provider maintains location-by-location schedules, including Washington County. Check the current schedule for the site you plan to visit.",
        "url": "https://hivalliance.org/services/syringe-services/",
        "cta": "Locations & schedules",
        "sourceChecked": "September 30, 2026",
        "categoryIds": [
          "health"
        ],
        "serviceTags": [
          "Naloxone",
          "Testing"
        ],
        "categorySourceUrl": "https://hivalliance.org/services/",
        "phone": "tel:+15413425088",
        "phoneLabel": "HIV Alliance office",
        "alt": "tel:+18664703419",
        "altLabel": "Toll-free: 866-470-3419",
        "contactSourceUrl": "https://hivalliance.org/about/contact-us/",
        "howToStart": "Call HIV Alliance or check its syringe-services calendar for your county’s current exchange location and time. Gender-affirming injection supplies are also available through the Lavender Network in Eugene; ask about current availability.",
        "hours": "Exchange times vary by county and site · Check the live service calendar",
        "contactChecked": "September 30, 2026"
      },
      {
        "name": "Just in Case Oregon · Free Naloxone",
        "logoSurface": "light",
        "logo": "/resources-logos/just-in-case-oregon-free-naloxone.png",
        "scope": "Oregon · Mail delivery",
        "mark": "JIC",
        "desc": "Free naloxone mailed in plain packaging to an Oregon mailing address. No prescription, ID check, or insurance required. The current program supplies four doses and instructions. Order ahead so it is available when needed; this is not an emergency-delivery service.",
        "url": "https://justincaseoregon.org/",
        "cta": "Request free naloxone",
        "sourceChecked": "September 30, 2026",
        "categoryIds": [
          "health"
        ],
        "serviceTags": [
          "Free naloxone",
          "Mail delivery"
        ],
        "categorySourceUrl": "https://justincaseoregon.org/",
        "email": "info@justincaseoregon.org",
        "contactSourceUrl": "https://justincaseoregon.org/",
        "howToStart": "Request naloxone online using an Oregon address that can receive mail. Email the program if you need help with an order. This service ships supplies; it is not a walk-in clinic.",
        "contactChecked": "September 30, 2026"
      },
      {
        "name": "Eastern Oregon Center for Independent Living",
        "logo": "/resources-logos/eastern-oregon-center-for-independent-living-transparent.png",
        "mark": "EOCIL",
        "sub": "EOCIL",
        "scope": "Eastern Oregon",
        "desc": "Peer-led disability services, housing support, harm reduction and wellness, HIV services, and Two-Spirit and LGBTQIA+ community support.",
        "url": "https://eocil.org",
        "phone": "tel:+18444892001",
        "phoneLabel": "EOCIL toll-free",
        "email": "eocil@eocil.org",
        "mailingAddress": "PO Box 940, Ontario, OR 97914",
        "howToStart": "Call or email to confirm which office and program can help before visiting. The online service-request form lists a one-to-three-business-day response window. Hood River is listed as coming soon.",
        "locations": [
          {
            "name": "Ontario · SW 5th Avenue",
            "address": "1021 SW 5th Ave, Ontario, OR 97914",
            "phone": "tel:+15418893119",
            "sourceUrl": "https://eocil.org/",
            "lat": 44.0241389,
            "lng": -116.9763615
          },
          {
            "name": "Ontario · SW 5th Avenue",
            "address": "1037 SW 5th Ave, Ontario, OR 97914",
            "phone": "tel:+15418893119",
            "sourceUrl": "https://eocil.org/",
            "lat": 44.0241417,
            "lng": -116.9767154
          },
          {
            "name": "Ontario · South Park",
            "address": "463 S Park Blvd, Ontario, OR 97914",
            "phone": "tel:+15418893119",
            "sourceUrl": "https://eocil.org/",
            "lat": 44.024345154842,
            "lng": -116.975819910386
          },
          {
            "name": "Pendleton · SW 3rd",
            "address": "322 SW 3rd St, Pendleton, OR 97801",
            "phone": "tel:+15412761037",
            "sourceUrl": "https://eocil.org/",
            "lat": 45.670519,
            "lng": -118.7894005
          },
          {
            "name": "Pendleton · SE Court",
            "address": "21 SE Court Ave, Pendleton, OR 97801",
            "phone": "tel:+15412761037",
            "sourceUrl": "https://eocil.org/",
            "lat": 45.673071,
            "lng": -118.787092
          },
          {
            "name": "Pendleton · SE Court",
            "address": "27 SE Court Ave, Pendleton, OR 97801",
            "phone": "tel:+15412761037",
            "sourceUrl": "https://eocil.org/",
            "lat": 45.6728422,
            "lng": -118.7872202
          },
          {
            "name": "Pendleton · SE Court",
            "address": "29 SE Court Ave, Pendleton, OR 97801",
            "phone": "tel:+15412761037",
            "sourceUrl": "https://eocil.org/",
            "lat": 45.673071,
            "lng": -118.787092
          },
          {
            "name": "The Dalles",
            "address": "415 E 2nd St, The Dalles, OR 97058",
            "phone": "tel:+15413702810",
            "sourceUrl": "https://eocil.org/",
            "lat": 45.6006645,
            "lng": -121.180363
          },
          {
            "name": "La Grande",
            "address": "2102 Cove Ave, La Grande, OR 97850",
            "phone": "tel:+15416124028",
            "sourceUrl": "https://eocil.org/",
            "lat": 45.3257945,
            "lng": -118.0790365
          },
          {
            "name": "Redmond",
            "address": "236 NW Kingwood Ave, Redmond, OR 97756",
            "phone": "tel:+15415273226",
            "sourceUrl": "https://eocil.org/",
            "lat": 44.287444,
            "lng": -121.1718507
          }
        ],
        "contactSourceUrl": "https://eocil.org/",
        "contactChecked": "September 30, 2026",
        "categoryIds": [
          "health",
          "community",
          "safety"
        ],
        "categorySourceUrl": "https://eocil.org/"
      }
    ]
  }
];
