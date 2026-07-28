/* HAÜS prototype content. Plausible PDX scene copy, Zaylist voice. */
const A = n => `uploads/sample-media/avatars/avatar-${n}.jpg`;
const P = {
  rowan:{id:'rowan',name:'Rowan Vasquez',pro:'they/them',ring:'nonbinary',img:A('01')},
  junie:{id:'junie',name:'Junie Park',pro:'she/her',ring:'lesbian',img:A('02')},
  ezra:{id:'ezra',name:'Ezra Milne',pro:'he/him',ring:'transgender',img:A('03')},
  mika:{id:'mika',name:'Mika Osei',pro:'she/her',ring:'transgender',img:A('04')},
  devon:{id:'devon',name:'Devon Reyes',pro:'he/they',ring:'progress',img:A('05')},
  tal:{id:'tal',name:'Tal Brenner',pro:'they/them',ring:'agender',img:A('06')},
  sam:{id:'sam',name:'Sam Ochoa',pro:'she/her',ring:'lesbian',img:A('07')},
  nell:{id:'nell',name:'Nell Hartigan',pro:'they/them',ring:'genderqueer',img:A('08')},
  kit:{id:'kit',name:'Kit Alvarez',pro:'he/him',ring:'bear',img:A('09')},
  bo:{id:'bo',name:'Bo Nguyen',pro:'they/them',ring:'pansexual',img:A('10')},
  frankie:{id:'frankie',name:'Frankie Doyle',pro:'she/her',ring:'rainbow',img:A('11')},
  wes:{id:'wes',name:'Wes Tamblyn',pro:'he/him',ring:'leather',img:A('12')},
  ines:{id:'ines',name:'Ines Cardoso',pro:'she/her',ring:'bisexual',img:A('13')},
  /* Housemates without a Zaylist account. Photo only, no profile, no ring. */
  priya:{id:'priya',name:'Priya Raman',pro:'she/her',ring:'none',img:A('14'),offsite:true},
  marcus:{id:'marcus',name:'Marcus Hale',pro:'he/him',ring:'none',img:A('15'),offsite:true}
};

const POSTS = [
  {
    id:'p1',type:'looking',person:P.rowan,posted:'2 hours ago',
    title:'Looking for a room by August, Alberta or Cully',
    line:'Remote work, quiet mornings, loud kitchen. I cook a lot and I clean as I go.',
    budget:'$850/mo',timeline:'Aug 1, some flex',areas:['Alberta Arts','Cully','Woodstock'],
    lookingFor:'A room in a house where people actually hang out. Happy to live with cats. Not looking for a studio, I have done the alone thing.',
    about:'I do support work for a small nonprofit, so I am home most days but I am not in your way. I host a monthly board game night that I would love to keep going. I have lived in Portland six years, three of them on the same block.',
    living:['Remote work','Early riser','Cooks most nights','No pets of my own','Cat friendly'],
    photos:['uploads/sample-media/portland-lifestyle/portland-05.jpg','uploads/sample-media/portland-lifestyle/portland-11.jpg','uploads/sample-media/portland-lifestyle/portland-09.jpg','uploads/sample-media/portland-lifestyle/portland-03.jpg'],
    open:true,
    trust:{mutuals:6,events:11,since:'2021'}
  },
  {
    id:'p2',type:'offering',person:P.mika,posted:'Yesterday',
    house:'The Green HAÜS',
    title:'Room in a Foster-Powell house of four',
    line:'Four of us, one senior dog, a garden that got out of hand. The room is upstairs with the good light.',
    rent:'$900',rentNote:'plus utilities, about $70',deposit:'$900 deposit, no application fee',
    moveIn:'Sep 1',room:'Private room, second floor, unfurnished',area:'Foster-Powell',
    photos:['uploads/sample-media/houses/house-03.jpg','uploads/sample-media/bedrooms/bedroom-01.jpg','uploads/sample-media/bedrooms/bedroom-07.jpg','uploads/sample-media/bedrooms/bedroom-02.jpg','uploads/sample-media/houses/house-09.jpg'],
    household:[
      {p:P.mika,line:'Nurse, gardens badly, owns the dog.'},
      {p:P.devon,line:'Bike mechanic. Fixes yours too.'},
      {p:P.tal,line:'Grad student. Gone most weekends.'},
      {p:P.priya,line:'Works nights at the co op. Not on Zaylist.'}
    ],
    about:'We have lived here three years and we are not trying to run a hotel. Dinner happens most Sundays, nobody is required to be there. Beans the dog is fourteen and will lean on you.',
    culture:['Trans affirming','Sober friendly','Quiet after 11','Dog in the house','Shared staples','Guests fine, ask first'],
    pets:[{name:'Beans',kind:'Dog, 14',line:'Senior sweetheart. Will lean on you.',img:'uploads/sample-media/pets/maple-golden-retriever.jpg'}],
    access:['Two steps at the entry','Bathroom on the same floor','Street parking, usually easy','No off street parking'],
    open:true,
    trust:{mutuals:4,events:7,since:'2019',verified:'Leaseholder verified'}
  },
  {
    id:'p3',type:'forming',person:P.sam,posted:'3 days ago',
    house:'Hearth HAÜS',
    title:'Two of us, looking for two more',
    line:'Four adults, one long table, a house that hosts Sunday dinner. We want a lease we all sign together.',
    budget:'$2,700 to $3,200',budgetNote:'combined, four people',
    moveIn:'Oct 1',areas:['St. Johns','Kenton','Overlook'],seeking:2,flavor:'together',
    pets:[{name:'Pepper',kind:'Dog, 3',line:'Nell brings the frenchie.',img:'uploads/sample-media/pets/pepper-french-bulldog.jpg'}],
    photos:['uploads/sample-media/houses/house-15.jpg','uploads/sample-media/houses/house-01.jpg','uploads/sample-media/bedrooms/bedroom-12.jpg','uploads/sample-media/portland-lifestyle/portland-07.jpg'],
    members:[{p:P.sam,role:'Lead',line:'Started this. Cooks for eight by accident.'},{p:P.nell,role:'Member',line:'Ceramics, night owl, does the dishes.'}],
    about:'We met at a Sunday market shift and figured out we want the same house. Three bedrooms minimum, four preferred, a kitchen that fits more than one person, a yard for the ceramics kiln. We are not looking for a party house and we are not looking for total silence.',
    goals:['Everyone on the lease','Groceries split, cooking shared','Trans affirming household','Quiet weeknights','Yard or garage for a kiln'],
    trust:{mutuals:9,events:14,since:'2020'}
  },
  {
    id:'p4',type:'looking',person:P.junie,posted:'4 days ago',
    title:'$700, flexible from September, Montavilla or Lents',
    line:'Night shift nurse. I keep to myself and I cook for people. One cat named Radish.',
    budget:'$700/mo',timeline:'Flexible from Sep',areas:['Montavilla','Lents','Foster-Powell'],
    lookingFor:'A quiet room in a house that does not mind me sleeping at odd hours. Radish is eleven and stays in my room mostly.',
    about:'Three nights a week at the hospital, so I am asleep when you are at work. I make a lot of banchan and it always ends up in the shared fridge.',
    living:['Night shift','Has a cat','Quiet','Sober friendly'],
    pets:[{name:'Radish',kind:'Cat, 11',line:'Coming with me. Stays in my room mostly.',img:'uploads/sample-media/pets/biscuit-orange-tabby.jpg'}],
    photos:['uploads/sample-media/portland-lifestyle/portland-04.jpg','uploads/sample-media/portland-lifestyle/portland-13.jpg','uploads/sample-media/portland-lifestyle/portland-06.jpg','uploads/sample-media/portland-lifestyle/portland-16.jpg'],
    open:false,
    trust:{mutuals:2,events:4,since:'2023'}
  },
  {
    id:'p5',type:'offering',person:P.wes,posted:'5 days ago',
    house:'The Hawthorne HAÜS',
    title:'Room open now in an artists house on Hawthorne',
    line:'Loud on weekends, quiet on Sundays. There is a kiln in the garage and it is not decorative.',
    rent:'$1,050',rentNote:'utilities included',deposit:'$500 deposit, no application fee',
    moveIn:'Available now',room:'Large room, main floor, half bath',area:'Hawthorne',
    photos:['uploads/sample-media/houses/house-05.jpg','uploads/sample-media/bedrooms/bedroom-03.jpg','uploads/sample-media/bedrooms/bedroom-08.jpg','uploads/sample-media/bedrooms/bedroom-04.jpg','uploads/sample-media/houses/house-10.jpg'],
    household:[{p:P.wes,line:'Printmaker. Runs the kiln.'},{p:P.ines,line:'Sound engineer, tours in spring.'}],
    about:'Two of us plus whoever is helping with a print run. The room is the biggest in the house and it comes with the noise that implies.',
    culture:['Studio in the garage','Loud weekends','Guests welcome','Shared tools','420 friendly'],
    pets:[{name:'Nugget',kind:'Dog, 5',line:'Beagle. Announces the mail.',img:'uploads/sample-media/pets/nugget-beagle.jpg'}],
    access:['Step free entry','Wide doorways','Driveway parking'],
    open:false,
    trust:{mutuals:3,events:22,since:'2018',verified:'Leaseholder verified'}
  },
  {
    id:'p6',type:'forming',person:P.bo,posted:'1 week ago',
    house:'Sunday Roast HAÜS',
    title:'Three of us, we found our fourth',
    line:'Started as a group chat about rent. Ended as a household. Signing in Sellwood.',
    budget:'$3,400',budgetNote:'combined, four people',
    moveIn:'Nov 1',areas:['Sellwood','Woodstock'],seeking:0,full:true,flavor:'place',waitlist:3,
    photos:['uploads/sample-media/houses/house-16.jpg','uploads/sample-media/bedrooms/bedroom-03.jpg','uploads/sample-media/portland-lifestyle/portland-09.jpg','uploads/sample-media/portland-lifestyle/portland-12.jpg'],
    members:[{p:P.bo,role:'Lead',line:'Started the group chat.'},{p:P.frankie,role:'Member',line:'Handles the paperwork.'},{p:P.kit,role:'Member',line:'Has the truck.'},{p:P.ezra,role:'Member',line:'Joined last week.'}],
    about:'We are full and we are keeping this post up so people can see what forming a HAÜS actually looks like. Ask us anything.',
    goals:['Everyone on the lease','One shared dinner a week','Pets welcome'],
    trust:{mutuals:5,events:9,since:'2019'}
  },
  {
    id:'p8',type:'offering',person:P.frankie,posted:'2 days ago',
    house:'The Kenton HAÜS',
    title:'Small room in a Kenton bungalow',
    line:'Two of us, one porch we actually sit on. The room is small and the rent matches.',
    rent:'$725',rentNote:'plus utilities, about $55',deposit:'$725 deposit, no application fee',
    moveIn:'Aug 15',room:'Small room, main floor',area:'Kenton',
    photos:['uploads/sample-media/houses/house-11.jpg','uploads/sample-media/bedrooms/bedroom-09.jpg','uploads/sample-media/bedrooms/bedroom-05.jpg','uploads/sample-media/houses/house-12.jpg'],
    household:[{p:P.frankie,line:'Bookkeeper. Runs the calendar.'},{p:P.bo,line:'Bakes bread on Sundays.'}],
    pets:[{name:'Cloud',kind:'Dog, 7',line:'Samoyed. Sheds on everything.',img:'uploads/sample-media/pets/cloud-samoyed.jpg'}],
    about:'We are quiet on weeknights and not precious about the kitchen. Looking for someone who says hi when they get home.',
    culture:['Trans affirming','Sober friendly','Quiet weeknights','Dog in the house'],
    access:['Step free entry','Bathroom on the same floor','Street parking'],
    open:false,
    trust:{mutuals:5,events:6,since:'2022',verified:'Leaseholder verified'}
  },
  {
    id:'p9',type:'offering',person:P.nell,posted:'3 days ago',
    house:'The St. Johns HAÜS',
    title:'Attic room in a five bedroom, St. Johns',
    line:'Big old house, five of us, one bathroom situation we have solved with a chart.',
    rent:'$800',rentNote:'utilities included',deposit:'$400 deposit, no application fee',
    moveIn:'Sep 15',room:'Attic room, sloped ceiling, own sink',area:'St. Johns',
    photos:['uploads/sample-media/houses/house-13.jpg','uploads/sample-media/bedrooms/bedroom-10.jpg','uploads/sample-media/bedrooms/bedroom-06.jpg','uploads/sample-media/bedrooms/bedroom-11.jpg','uploads/sample-media/houses/house-14.jpg'],
    household:[{p:P.nell,line:'Ceramics. Kiln lives in the shed.'},{p:P.kit,line:'Carpenter. Fixed the porch.'},{p:P.ines,line:'Sound engineer, gone in spring.'},{p:P.marcus,line:'Works at the bike shop. Not on Zaylist.'}],
    about:'The HAÜS has been queer since 2016 and we intend to keep it that way. Rent is low because the attic gets warm in August.',
    culture:['Trans affirming','Chore chart','Guests welcome','Two cats','420 friendly'],
    pets:[{name:'Miso',kind:'Cat, 6',line:'Sleeps on the stairs.',img:'uploads/sample-media/pets/mabel-calico.jpg'},{name:'Pilot',kind:'Cat, 3',line:'Will steal your socks.',img:'uploads/sample-media/pets/ink-black-cat.jpg'}],
    access:['Stairs to the attic room','Shared bathroom on the second floor','Driveway parking'],
    open:true,
    trust:{mutuals:7,events:12,since:'2016'}
  },
  {
    id:'p11',type:'forming',person:P.ines,posted:'Yesterday',
    house:'Cully Kitchen HAÜS',
    title:'Just me so far, looking for three',
    line:'Starting from zero. No place picked, no group yet, just someone who wants a house that cooks together.',
    budget:'$2,400 to $3,000',budgetNote:'combined, four people',
    moveIn:'Jan 1',areas:['Cully','Woodstock','Montavilla'],seeking:3,flavor:'together',
    members:[{p:P.ines,role:'Lead',line:'Started this HAÜS. Does the paperwork.'}],
    about:'I have wanted to do this since my last lease ended and I moved into a studio I do not like. Looking for three people who want a real kitchen and a standing dinner. I will do the paperwork and the spreadsheet nobody else wants to keep.',
    goals:['Everyone on the lease','One shared dinner a week','Trans affirming household','Pets welcome'],
    trust:{mutuals:4,events:9,since:'2021'}
  },
  {
    id:'p10',type:'looking',person:P.tal,posted:'6 days ago',
    title:'Grad student, $800, needs a room by October',
    line:'Gone most weekends, home most weeknights with a laptop and a lamp.',
    budget:'$800/mo',timeline:'Oct 1',areas:['Woodstock','Sellwood','Foster-Powell'],
    lookingFor:'A room in a house that does not need me at every dinner. I am friendly, I am just busy until spring.',
    about:'Second year of a public health program. I do dishes immediately and I forget to take out the recycling. That is the whole profile.',
    living:['Grad school','Quiet','No pets','Gone weekends'],
    photos:['uploads/sample-media/portland-lifestyle/portland-08.jpg','uploads/sample-media/portland-lifestyle/portland-17.jpg','uploads/sample-media/portland-lifestyle/portland-20.jpg','uploads/sample-media/portland-lifestyle/portland-01.jpg'],
    open:false,
    trust:{mutuals:3,events:5,since:'2022'}
  },
  {
    id:'p7',type:'looking',person:P.ezra,posted:'1 week ago',
    title:'$950, Nov 1, Buckman or Kerns',
    line:'Moving back from Olympia. Want a house that does dinners and does not do surprise guests.',
    budget:'$950/mo',timeline:'Nov 1',areas:['Buckman','Kerns','Sunnyside'],
    lookingFor:'A room in an established house. I would rather join something that works than build one from scratch.',
    about:'I lived in Portland until 2023 and I am coming back for the people. I bake, I am loud in the kitchen, I am quiet everywhere else.',
    living:['Works in an office','Bakes','No pets','Trans','Sober'],
    photos:['uploads/sample-media/portland-lifestyle/portland-02.jpg','uploads/sample-media/portland-lifestyle/portland-14.jpg','uploads/sample-media/portland-lifestyle/portland-07.jpg','uploads/sample-media/portland-lifestyle/portland-10.jpg'],
    open:true,
    trust:{mutuals:8,events:16,since:'2017'}
  }
];

/* Workspace for the Hearth HAÜS */
const WORKSPACE = {
  p11:{
    places:[],
    dates:[{id:'e1',label:'Target move in',when:'Wed Jan 1',who:'Set when the HAÜS started'}],
    requests:[],
    chat:[]
  },
  p3:{
    places:[
      {id:'w1',title:'2 bed plus finished basement, N Lombard',rent:'$2,850/mo',hood:'St. Johns',src:'zillow.com',img:'uploads/sample-media/houses/house-06.jpg',by:'Nell',status:'Touring',reactions:3,comments:2},
      {id:'w2',title:'Old four square, needs love',rent:'$3,100/mo',hood:'Overlook',src:'craigslist.org',img:'uploads/sample-media/houses/house-08.jpg',by:'Sam',status:'Interested',reactions:2,comments:5},
      {id:'w3',title:'Duplex, upper unit, no yard',rent:'$2,600/mo',hood:'Kenton',src:'apartments.com',img:'uploads/sample-media/houses/house-04.jpg',by:'Sam',status:'Passed',reactions:0,comments:4}
    ],
    dates:[
      {id:'d1',label:'Tour the N Lombard house',when:'Sat Aug 9, 11:00 AM',who:'Nell added this'},
      {id:'d2',label:'Applications due',when:'Tue Aug 12',who:'Sam added this'},
      {id:'d3',label:'Budget check in',when:'Thu Aug 14, 7:00 PM',who:'Sam added this'},
      {id:'d4',label:'Target move in',when:'Wed Oct 1',who:'Set when the HAÜS started'}
    ],
    requests:[{id:'r1',p:P.kit,note:'Kit asked to join. Three mutuals, member since 2020.'}],
    chat:[
      {who:'Nell',text:'The Lombard place has a garage. I measured, the kiln fits.',when:'Tue 9:14 AM'},
      {who:'Sam',text:'Booked us a tour Saturday at 11. Bring questions about the basement.',when:'Tue 9:31 AM'},
      {who:'Nell',text:'Kit asked to join. I know him from the Kenton market shifts, he is good people.',when:'Wed 6:02 PM'}
    ]
  }
};

const MANAGED = [
  {
    id:'m1',type:'managed',posted:'Yesterday',
    manager:{name:'Rose City Residential',line:'Property manager · 14 buildings in inner Portland',since:'2020'},
    house:'The Kerns, Unit 4',
    title:'One bedroom in a restored fourplex, Buckman',
    line:'Second floor corner unit in a 1920s fourplex. Original fir floors, a claw foot tub, and a window in the kitchen. Laundry in the basement.',
    rent:'$1,395',rentNote:'water and trash included, tenant pays power',deposit:'$1,395 deposit, $45 screening fee, paid to the manager',
    beds:'1 bed',baths:'1 bath',parking:'Street only',outdoor:'Shared yard',
    moveIn:'Aug 15',area:'Buckman',
    photos:['uploads/sample-media/houses/house-12.jpg','uploads/sample-media/bedrooms/bedroom-05.jpg','uploads/sample-media/bedrooms/bedroom-11.jpg'],
    about:'Managed by Rose City Residential. Applications and payments happen on their site, never on Zaylist.',
    access:['Second floor, stairs only','No elevator','Bathroom on the same floor','Street parking, permit zone'],
    site:'rosecityresidential.com/kerns-4',
    badges:['Accepts Section 8','Income restricted'],
    seen:'Updated 2 hours ago',source:'Pulled from rosecityresidential.com',
    trust:{verified:'Property manager verified',since:'2020'}
  },
  {
    id:'m2',type:'managed',posted:'4 days ago',
    manager:{name:'Alberta Park Management',line:'Property manager · small portfolio, northeast Portland',since:'2018'},
    house:'Sumner Court ADU',
    title:'Studio ADU behind a house on NE 18th',
    line:'Detached studio with its own entrance, a full kitchen, and a small patio. Quiet block, ten minutes to Alberta.',
    rent:'$1,150',rentNote:'all utilities included',deposit:'$1,150 deposit, no screening fee',
    beds:'Studio',baths:'1 bath',parking:'Driveway, one car',outdoor:'Private patio',
    moveIn:'Sep 1',area:'Cully',
    photos:['uploads/sample-media/houses/house-15.jpg','uploads/sample-media/bedrooms/bedroom-09.jpg'],
    about:'Managed by Alberta Park Management. Applications and payments happen off Zaylist.',
    access:['Ground floor, no steps','Doorway 32 inches','Bathroom on the same floor','Off street parking'],
    site:'albertaparkmgmt.com/sumner-adu',
    badges:['Accessible unit'],
    seen:'Updated yesterday',source:'Pulled from albertaparkmgmt.com',
    trust:{verified:'Property manager verified',since:'2018'}
  }
];

const THREADS = {
  p1:[
    {me:false,who:'Rowan',text:'Hey. Saw you have a room opening. Is the Aug 1 date firm on your end?',when:'Today 10:12 AM'}
  ],
  p2:[
    {me:false,who:'Mika',text:'Hi. Room is still open. Want to come by for tea this week and meet Beans?',when:'Today 11:40 AM'}
  ]
};

const STATS = [
  {n:'36',l:'Active posts'},
  {n:'21',l:'Rooms and seekers'},
  {n:'4',l:'Forming a HAÜS'}
];

const FLAVOR = {
  place:{label:'Place in mind',note:'This HAÜS already has a place lined up. They are filling the lease.'},
  together:{label:'Finding a place together',note:'No place yet. This HAÜS forms first, then hunts together.'}
};

const TYPE = {
  offering:{label:'Offering a room',short:'Offering'},
  looking:{label:'Looking for housing',short:'Looking'},
  forming:{label:'Forming a HAÜS',short:'Forming'},
  managed:{label:'Managed property',short:'Managed'}
};

/* Board order: managed listings sit at the end, except The Kerns which trades
   places with the Kenton HAÜS so a purple card lands mid feed. */
const ORDER = POSTS.concat(MANAGED);
(() => {
  const a = ORDER.findIndex(p => p.id === 'p8'), b = ORDER.findIndex(p => p.id === 'm1');
  if (a > -1 && b > -1) { const tmp = ORDER[a]; ORDER[a] = ORDER[b]; ORDER[b] = tmp; }
})();

window.HAUS = { P, POSTS:ORDER, WORKSPACE, THREADS, STATS, TYPE, FLAVOR };
