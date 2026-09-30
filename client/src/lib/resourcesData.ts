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
  sub?: string;
  scope: string;
  desc: string;
  addr?: string;
  phone?: string;
  phoneLabel?: string;
  url?: string;
  cta?: string;
  alt?: string;
  altLabel?: string;
  logo?: string;
  mark?: string;
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
    "color": "#00FFFF",
    "what": "Clinics and service centers built for queer, trans, and gender-diverse people, plus HIV prevention and care.",
    "help": "Care from providers who already get it, so the visit is about your health, not about explaining yourself.",
    "forr": "Primary and walk-in urgent care, testing and HIV services, gender-affirming care and surgery, counseling, harm reduction, and peer support.",
    "use": "Check the org's site for current hours and services, then call or walk in. Ask what to bring to your first visit.",
    "orgs": [
      {
        "name": "Prism Health",
        "logo": "/resources-logos/prism-health.png",
        "sub": "A Cascade AIDS Project clinic",
        "scope": "SE Portland · N Portland",
        "desc": "LGBTQ+ affirming primary care, transgender health, behavioral health, HIV and STI testing, and an on-site pharmacy. About half of patients are on the Oregon Health Plan or uninsured.",
        "addr": "2236 SE Belmont St · 15 N Morris St",
        "url": "https://www.prismhealth.org/"
      },
      {
        "name": "Evergreen Urgent Care",
        "scope": "NW Portland · Walk-in",
        "desc": "LGBTQIA+ friendly urgent care. Walk in for illness and injury, full STI panels and confidential sexual health testing, UTI care, labs, and X-ray. Takes insurance, Medicaid, and Medicare.",
        "addr": "2250 NW Flanders St, Ste 109 · Mon–Fri 8–8, Sat 9–6",
        "url": "https://evergreenurgent.com/",
        "alt": "tel:5034797713",
        "altLabel": "Call"
      },
      {
        "name": "Cascade AIDS Project (CAP) & Our House",
        "scope": "Old Town",
        "desc": "The Northwest's leading HIV services org since 1983. Prevention, testing, supportive housing, and LGBTQ+ health care, plus Our House residential care for people living with HIV.",
        "url": "https://www.capnw.org/",
        "alt": "https://www.capnw.org/donate",
        "altLabel": "Donate"
      },
      {
        "name": "The Marie Equi Center",
        "logo": "/resources-logos/marie-equi.png",
        "scope": "SE Portland",
        "desc": "Trauma-informed, culturally affirming health and social services for trans, queer, intersex, and gender-diverse communities. Peer support, harm reduction, and housing advocacy.",
        "url": "https://www.marieequi.center/",
        "alt": "https://www.marieequi.center/donate",
        "altLabel": "Donate"
      },
      {
        "name": "OHSU Transgender Health Program",
        "scope": "Portland",
        "desc": "Specialized gender-affirming medical care and surgery.",
        "url": "https://www.ohsu.edu/transgender-health"
      },
      {
        "name": "Quest Center for Integrative Health",
        "mark": "QC",
        "scope": "Portland",
        "desc": "Community health center with LGBTQ+ services, counseling, and wellness classes.",
        "url": "https://quest-center.org/"
      },
      {
        "name": "Outside In",
        "logo": "/resources-logos/outside-in.png",
        "scope": "Downtown",
        "desc": "Health care and social services for young people experiencing homelessness since 1968, including the QueerZone drop-in: an LGBTQ-affirming clinic with gender-affirming care, meals, showers, and housing help.",
        "addr": "1132 SW 13th Ave",
        "url": "https://outsidein.org/",
        "alt": "https://outsidein.org/about-us/donate-now/",
        "altLabel": "Donate"
      },
      {
        "name": "Trans Advocacy & Care Team (TACT)",
        "scope": "National · Virtual",
        "desc": "Free, virtual peer counseling for trans people.",
        "url": "https://yourtact.org"
      }
    ]
  },
  {
    "id": "safety",
    "name": "Safety & Basic Needs",
    "color": "#FF2400",
    "what": "Domestic violence support for LGBTQIA+ survivors, trans-led emergency help, food, housing support, and advocacy for incarcerated LGBTQ+ people.",
    "help": "Safety planning, emergency shelter, relocation, meals, and advocates who understand queer and trans lives and relationships.",
    "forr": "Getting out of an unsafe situation, rebuilding after one, and getting fed and housed.",
    "use": "In crisis, call a line in Start Here. Otherwise reach out by email or through each site, and ask what support they have open right now.",
    "orgs": [
      {
        "name": "Marsha's Folx | Bradley Angle",
        "mark": "MF",
        "scope": "Portland",
        "desc": "One of the only culturally specific domestic violence programs for LGBTQIA+ survivors in Oregon. Advocacy and referrals, safety planning, food, clothing, and toiletries, and free support groups. Check the program website for the current schedule.",
        "addr": "5432 N Albina Ave, Portland",
        "phone": "tel:+15032321528;ext=302",
        "phoneLabel": "Bradley Angle intake: 503-232-1528 ext. 302",
        "url": "https://www.bradleyangle.org/marshas-folx",
        "alt": "mailto:lgbtq@bradleyangle.org",
        "altLabel": "Email"
      },
      {
        "name": "WERQ Together",
        "logo": "/resources-logos/werq.png",
        "scope": "Oregon",
        "desc": "Trans-led org providing relocation assistance, emergency shelter, peer support, and economic justice for two-spirit, trans, non-binary, and gender non-conforming people in Oregon. Also keeps the Trans Oregon resource directory.",
        "url": "https://werqt.org/",
        "alt": "https://werqt.org/donate",
        "altLabel": "Donate"
      },
      {
        "name": "Rahab's Sisters",
        "scope": "Portland",
        "desc": "Housing support, health care, and community services for marginalized people.",
        "url": "https://rahabs-sisters.org"
      },
      {
        "name": "Hand Up Project",
        "scope": "Oregon",
        "desc": "Emergency food assistance focused on BIPOC and LGBTQ+ communities.",
        "url": "https://handupproject.org"
      },
      {
        "name": "Beyond These Walls",
        "scope": "National",
        "desc": "Serving and advocating for incarcerated LGBTQ+ people.",
        "url": "https://beyondthesewallslgbt.org"
      }
    ]
  },
  {
    "id": "legal",
    "name": "Legal & Advocacy",
    "color": "#0044FF",
    "what": "Ways to find an affordable lawyer, Oregon's LGBTQ+ bar association, and the groups working on policy and gender justice.",
    "help": "A lawyer you can afford, and organized pressure that protects LGBTQ+ rights in Oregon.",
    "forr": "Family law, housing, and health and safety matters, plus campaigns, volunteering, and staying informed.",
    "use": "Call the bar's referral line weekdays 8 to 5, or apply online for Modest Means with proof of income. Follow the advocacy groups for campaigns.",
    "orgs": [
      {
        "name": "Oregon State Bar",
        "sub": "Lawyer Referral Service & Modest Means",
        "scope": "Statewide",
        "desc": "Get matched with a lawyer. Modest Means connects moderate-income Oregonians with reduced-fee attorneys, with a first consult of up to 30 minutes for no more than $35.",
        "addr": "503-684-3763 · 800-452-7636",
        "url": "https://www.osbar.org/public/ris",
        "cta": "Get a referral",
        "alt": "tel:5036843763",
        "altLabel": "Call"
      },
      {
        "name": "OGALLA",
        "sub": "The LGBT Bar Association of Oregon",
        "scope": "Statewide",
        "desc": "LGBTQ+ lawyers, judges, legal workers, and law students since 1991. Runs the Bill & Ann Shepherd Legal Scholarship Fund and helped win marriage equality in Oregon."
      },
      {
        "name": "Basic Rights Oregon",
        "logo": "/resources-logos/basic-rights.png",
        "scope": "Statewide",
        "desc": "Oregon's statewide LGBTQ2SIA+ advocacy organization. Political, legal, and grassroots work to make sure all Oregonians experience equality.",
        "url": "https://www.basicrights.org/",
        "alt": "https://www.basicrights.org/donate",
        "altLabel": "Donate"
      },
      {
        "name": "Intersect NW",
        "scope": "Oregon",
        "desc": "Gender justice collaborative that strengthens the organizations doing this work.",
        "url": "https://intersectnorthwest.org"
      }
    ]
  },
  {
    "id": "youth",
    "name": "Youth & Mentorship",
    "color": "#FF6600",
    "what": "Drop-in centers, support groups, mentoring, and arts programs for young people, including youth without stable housing.",
    "help": "A meal, clothes that fit who you are, a trusted adult, and a space where you don't have to hide.",
    "forr": "Food, clothing, counseling, support groups, creative programs, and someone in your corner. SMYRC serves ages 13 to 24.",
    "use": "Look up drop-in hours and group times on each site before you go. Adults can back these programs by volunteering or donating.",
    "orgs": [
      {
        "name": "New Avenues for Youth / SMYRC",
        "logo": "/resources-logos/new-avenues.png",
        "scope": "Downtown",
        "desc": "SMYRC has served LGBTQIA2S+ youth ages 13 to 24 since 1998. A drop-in space with food, clothing, gender-affirming garments, counseling, and community events.",
        "addr": "1220 SW Columbia St",
        "url": "https://newavenues.org/smyrc/",
        "alt": "https://newavenues.org/donate/give-lgbtqia2s/",
        "altLabel": "Donate"
      },
      {
        "name": "The Living Room",
        "logo": "/resources-logos/new-avenues.png",
        "sub": "A New Avenues for Youth program",
        "scope": "Clackamas County",
        "desc": "Youth-centered community space for LGBTQ+ young people.",
        "url": "https://newavenues.org/thelivingroomyouth"
      },
      {
        "name": "Trans Youth Care Collective",
        "mark": "TYCC",
        "scope": "Oregon",
        "desc": "Trans-led organization offering support groups.",
        "url": "https://transyouthcarecollective.com"
      },
      {
        "name": "TransActive Gender Project",
        "sub": "At Lewis & Clark",
        "scope": "Portland",
        "desc": "Gender-focused peer support groups.",
        "url": "https://graduate.lclark.edu/programs/continuing_education/transactive/support-groups"
      },
      {
        "name": "Bridge City Mentors",
        "scope": "NE Portland",
        "desc": "Black and LGBTQ-affiliated mentoring and advocacy organization supporting individuals and communities across the Portland metro since 2016.",
        "addr": "2636 NE Sandy Blvd, Suite E",
        "url": "https://bridgecitymentors.com/"
      },
      {
        "name": "Pairs With Pride",
        "scope": "Oregon",
        "desc": "Intergenerational mentoring for LGBTQ+ youth.",
        "url": "https://perfectpair.org/pairs-with-pride"
      },
      {
        "name": "P:EAR",
        "scope": "Portland",
        "desc": "Arts programming and mentorship for unhoused and at-risk youth.",
        "url": "https://www.pearmentor.org"
      }
    ]
  },
  {
    "id": "community",
    "name": "Community & Belonging",
    "color": "#FFEE00",
    "what": "Community centers, the people behind Portland Pride, choruses, social clubs, and the archive that keeps our history.",
    "help": "Support groups, a library, a resource hub, emergency assistance, and year-round programs where you can find your people.",
    "forr": "Getting connected, getting involved, learning queer Oregon history, or just getting out of the house.",
    "use": "Not sure where to start? Start at Q Center, or Westside Q Center in Washington County. Check each calendar and go to one thing.",
    "orgs": [
      {
        "name": "Q Center",
        "scope": "Portland",
        "desc": "2SLGBTQIA+ community center with an art gallery, library, support groups, resource hub, emergency assistance, and space rentals.",
        "url": "https://www.pdxqcenter.org"
      },
      {
        "name": "Westside Q Center",
        "scope": "Washington County",
        "desc": "LGBTQIA+ services and regular programs in Portland's western suburbs.",
        "url": "https://westsideqrc.org"
      },
      {
        "name": "Pride Northwest",
        "logo": "/resources-logos/pride-northwest.png",
        "scope": "Portland",
        "desc": "The organizers of Portland Pride. Year-round programs celebrating and supporting the LGBTQ2SIA+ community, including Trans Unity and Pride Days of Service.",
        "url": "https://www.pridenw.org/",
        "alt": "https://www.pridenw.org/donate",
        "altLabel": "Donate"
      },
      {
        "name": "Portland Gay Men's Chorus",
        "logo": "/resources-logos/pgmc.png",
        "scope": "Portland",
        "desc": "Singing for Portland since 1980. Concerts, community performances, and queer joy in four-part harmony.",
        "url": "https://www.pdxgmc.org/",
        "alt": "https://www.pdxgmc.org/support/donate/",
        "altLabel": "Donate"
      },
      {
        "name": "Lesbian Culture Club",
        "scope": "Portland",
        "desc": "Queer community for lesbians, trans people, nonbinary people, and anyone who feels at home there.",
        "url": "https://lesbiancultureclub.com"
      },
      {
        "name": "Queer Social Club",
        "scope": "Portland",
        "desc": "Community-driven event calendars for queer happenings in Portland and the greater Pacific Northwest.",
        "url": "https://queersocialclub.com"
      },
      {
        "name": "Oregon Queer History Project",
        "mark": "GLAPN",
        "sub": "GLAPN",
        "scope": "Oregon",
        "desc": "LGBTQIA2S+ archives of the Pacific Northwest.",
        "url": "https://glapn.org"
      },
      {
        "name": "Oregon Department of Veterans' Affairs",
        "mark": "ODVA",
        "sub": "LGBTQ+ veterans resources",
        "scope": "Statewide",
        "desc": "A safe and confidential space and resources for LGBTQ+, trans, and intersex veterans.",
        "url": "https://www.oregon.gov/odva/resources"
      }
    ]
  },
  {
    "id": "family",
    "name": "Family, Elders & Culture",
    "color": "#FF00CC",
    "what": "Groups for the people around you and the communities you come from: families, parents of trans kids, elders, Two-Spirit and Indigenous folks, Pacific Islanders, and trans social groups.",
    "help": "Belonging that fits your whole life, not just one part of it, from people who share your story.",
    "forr": "Parents and families learning how to show up, LGBTQ+ people 60 and up, and finding folks who share your culture.",
    "use": "Most run regular meetings, groups, or events. Check each site for the schedule and come to one.",
    "orgs": [
      {
        "name": "PFLAG Portland",
        "scope": "Portland",
        "desc": "Family support and education for the parents and loved ones of LGBTQ+ people.",
        "url": "https://pflagpdx.org/"
      },
      {
        "name": "PDX Transparent",
        "mark": "PT",
        "scope": "Portland",
        "desc": "Support for parents of trans youth, with virtual chapters too.",
        "url": "https://transparentusa.org/chapters-oregon"
      },
      {
        "name": "Friendly House",
        "sub": "Elder Pride Services · SAGE Metro Portland",
        "scope": "Portland",
        "desc": "Services for LGBTQ+ older adults, including housing help and case management, as Portland's affiliate of SAGE, the national LGBT elder organization.",
        "url": "https://fhpdx.org/for-adults-seniors/elder-pride-services/"
      },
      {
        "name": "NAYA",
        "sub": "Two-Spirit Safe Space Alliance",
        "scope": "Portland",
        "desc": "Indigenous LGBTQIA2S+ support groups and cultural events at the Native American Youth and Family Center.",
        "url": "https://nayapdx.org/services/two-spirit-safe-space-alliance"
      },
      {
        "name": "UTOPIA PDX",
        "scope": "Portland",
        "desc": "Community organization for queer and trans Pacific Islanders.",
        "url": "https://www.utopiaportland.org/"
      },
      {
        "name": "Northwest Gender Alliance",
        "scope": "Portland metro",
        "desc": "Social support and education for transgender and gender-expansive people.",
        "url": "https://www.nwgenderalliance.org/"
      }
    ]
  },
  {
    "id": "money",
    "name": "Money, Work & Business",
    "color": "#39FF14",
    "what": "Scholarships, free tax prep, small-business advising, and Oregon's LGBTQ+ business network.",
    "help": "Keep more of your money, pay for school, and get real help starting or growing a business.",
    "forr": "Students, entrepreneurs, creatives with a side business, and anyone filing taxes on a lower income.",
    "use": "Check eligibility first. CASH Oregon is for people earning $70,000 or less. SCORE and the SBDC offer advising you can book online.",
    "orgs": [
      {
        "name": "Oregon Pride in Business",
        "mark": "ORPIB",
        "sub": "ORPIB",
        "scope": "Oregon",
        "desc": "Business education and networking for LGBTQ+ entrepreneurs.",
        "url": "https://www.orpib.com"
      },
      {
        "name": "Pride Foundation",
        "scope": "Pacific Northwest",
        "desc": "Philanthropic foundation offering scholarships for LGBTQ+ students across the Northwest.",
        "url": "https://pridefoundation.org"
      },
      {
        "name": "CASH Oregon",
        "scope": "Portland",
        "desc": "Free tax preparation for people earning $70,000 or less.",
        "url": "https://cashoregon.org"
      },
      {
        "name": "Portland Small Business Development Center",
        "mark": "SBDC",
        "scope": "Portland",
        "desc": "Small-business advising and training for Portland-area entrepreneurs.",
        "url": "https://oregonsbdc.org"
      },
      {
        "name": "SCORE Portland",
        "scope": "Portland",
        "desc": "Free small-business mentoring and workshops.",
        "url": "https://www.score.org"
      },
      {
        "name": "Prosper Portland",
        "scope": "Portland",
        "desc": "City-backed programs supporting Portland small businesses and creatives.",
        "url": "https://prosperportland.us"
      },
      {
        "name": "Business Oregon",
        "scope": "Oregon",
        "desc": "Oregon's economic development agency, with grant and fellowship programs for artists and creative businesses.",
        "url": "https://www.oregon.gov/biz"
      }
    ]
  },
  {
    "id": "arts",
    "name": "Arts, Funding & Spaces",
    "color": "#8800FF",
    "what": "Funders, galleries, studios, classes, and the places where auditions and new work get posted.",
    "help": "Grants and emergency funds to make the work, tools and teachers you might not have at home, and a way into Portland's stages.",
    "forr": "Funding a project, taking a class, finding an audition, or showing your work, with free and low-cost options.",
    "use": "Check the scope tag first: Portland, Multnomah County, Oregon, or National. Read eligibility and deadlines on each site, and sign up for classes early.",
    "orgs": [
      {
        "name": "Portland Queer Arts Foundation",
        "mark": "PQAF",
        "scope": "Portland",
        "desc": "Funds queer artists and projects, and keeps a resource guide for grants, services, spaces, and community organizations.",
        "url": "https://portlandqueerarts.foundation"
      },
      {
        "name": "Regional Arts & Culture Council",
        "mark": "RACC",
        "scope": "Portland",
        "desc": "Portland arts funder, including the Portland Arts Project Grant for individual artists and arts organizations.",
        "url": "https://racc.org"
      },
      {
        "name": "Multnomah County Cultural Coalition",
        "mark": "MCCC",
        "scope": "Multnomah County",
        "desc": "Cultural-enrichment organization supporting Multnomah County residents and local arts work.",
        "url": "https://www.multculturalcoalition.org"
      },
      {
        "name": "Oregon Arts Commission",
        "scope": "Oregon",
        "desc": "State grants for Oregon artists and organizations, including individual artist fellowships.",
        "url": "https://www.oregonartscommission.org"
      },
      {
        "name": "Future Prairie",
        "scope": "Oregon",
        "desc": "Nonprofit queer artist collective supporting LGBTQIA+ Oregon-based working-class artists.",
        "url": "https://futureprairie.com"
      },
      {
        "name": "Foundation for Contemporary Arts",
        "scope": "National",
        "desc": "Emergency grants and opportunity grants for experimental and contemporary artists.",
        "url": "https://foundationforcontemporaryarts.org"
      },
      {
        "name": "Ori Gallery",
        "scope": "Portland",
        "desc": "Trans and queer artists of color gallery and organizing space offering free and low-cost classes and workshops.",
        "url": "https://oriartgallery.org"
      },
      {
        "name": "Independent Publishing Resource Center",
        "mark": "IPRC",
        "scope": "Portland",
        "desc": "Printmaking, publishing, and literary arts center.",
        "url": "https://www.iprc.org"
      },
      {
        "name": "Sincere Studio",
        "scope": "Portland",
        "desc": "Sewing-focused nonprofit with tools and classes.",
        "url": "https://sincerestudiopdx.org"
      },
      {
        "name": "Portland Playhouse",
        "scope": "Portland",
        "desc": "Theatre apprenticeship and education, including its Apprentice Program.",
        "url": "https://www.portlandplayhouse.org"
      },
      {
        "name": "Radical Faerie Arts Fest",
        "mark": "RFAF",
        "scope": "Portland",
        "desc": "Artist-centered market and audience-building model for queer artists.",
        "url": "https://www.radfaf.org"
      },
      {
        "name": "Fertile Ground Festival",
        "scope": "Portland",
        "desc": "Portland platform for new and developing performance work.",
        "url": "https://fertilegroundpdx.org"
      },
      {
        "name": "Portland Area Theatre Alliance",
        "mark": "PATA",
        "scope": "Portland",
        "desc": "Auditions, listings, and theatre events for the Portland area.",
        "url": "https://portlandtheatre.com"
      },
      {
        "name": "PDXBackstage",
        "mark": "PDXB",
        "scope": "Portland",
        "desc": "Portland theatre community listserv for opportunities and discussion.",
        "url": "https://groups.io"
      },
      {
        "name": "Backstage",
        "mark": "BS",
        "scope": "Online",
        "desc": "Casting calls and performance opportunities for working artists.",
        "url": "https://www.backstage.com"
      }
    ]
  },
  {
    "id": "oregon",
    "name": "Around Oregon",
    "color": "#b8b8c2",
    "what": "LGBTQ+ groups outside the Portland metro: Salem, Eugene, the Mid-Willamette Valley, Southern and Eastern Oregon, and Wallowa County.",
    "help": "Local support and local people when you're not in Portland, including rural queer and trans organizing.",
    "forr": "Queer and trans Oregonians in small cities and rural counties, plus anyone moving, traveling, or supporting someone there.",
    "use": "Most run peer groups or gatherings, and many meet virtually. Check each site for the next one.",
    "orgs": [
      {
        "name": "Rainbow Youth",
        "scope": "Salem",
        "desc": "LGBTQIA+ youth support in Marion and Polk counties.",
        "url": "https://rainbowyouth.org"
      },
      {
        "name": "TransPonder",
        "mark": "TP",
        "scope": "Eugene · Virtual",
        "desc": "Support, resources, and education for the transgender community, with peer groups and social gatherings.",
        "url": "https://www.transponderoregon.org"
      },
      {
        "name": "Emergence",
        "mark": "EM",
        "scope": "Eugene",
        "desc": "Recovery services for LGBTQ+ people.",
        "url": "https://4emergence.com"
      },
      {
        "name": "Mid-Willamette Trans Support Network",
        "mark": "MWTSN",
        "scope": "Linn · Benton · Lincoln",
        "desc": "Grassroots peer support for trans and nonbinary people in the valley.",
        "url": "https://midwillamettetsn.wixsite.com/oursite"
      },
      {
        "name": "Rogue Action Center",
        "scope": "Josephine · Jackson",
        "desc": "Advocacy and direct services for LGBTQ+ communities in Southern Oregon.",
        "url": "https://rogueactioncenter.org"
      },
      {
        "name": "Eastern Oregon Center for Independent Living",
        "mark": "EOCIL",
        "sub": "EOCIL",
        "scope": "Eastern Oregon",
        "desc": "Community building for Two-Spirit and LGBTQIA+ people across 13 counties.",
        "url": "https://eocil.org"
      },
      {
        "name": "People Like Us",
        "scope": "Wallowa County",
        "desc": "Rural 2SLGBTQIA+ organizing and support.",
        "url": "https://www.facebook.com/wallowalgbtq",
        "cta": "Visit page"
      }
    ]
  }
];
