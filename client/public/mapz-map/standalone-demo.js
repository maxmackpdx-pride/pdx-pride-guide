// Existing directory coordinates and artwork, used only by the standalone
// visual demo. No sample event dates or titles enter the hosted event feed.
export const STANDALONE_DEMO_VIEW={center:[-122.651,45.535],zoom:13.4,pitch:48,bearing:0};
const DOWNTOWN_PLACEZ=[
  [1,'CC Slaughters','bar',-122.67265978363,45.524612586064,'#FF00CC'],
  [2,'Darcelle XV Showplace','venue',-122.673354790034,45.524649023488,'#19E3FF'],
  [3,'Stag PDX','bar',-122.677601642236,45.525333665978,'#FF00CC'],
  [4,'Badlands','bar',-122.677388010838,45.523878444325,'#FF00CC'],
  [7,'Silverado','bar',-122.676614296438,45.523716269082,'#FF00CC'],
  [28,'Camp Bar PDX','bar',-122.682349851482,45.522423862572,'#FF00CC'],
  [33,'Sanctuary Club','adult',-122.680179337043,45.523244045755,'#FF0000'],
  [37,'Star Theater','venue',-122.676518408183,45.523204065035,'#19E3FF'],
  [45,'New Avenues for Youth / SMYRC','nonprofit',-122.6871145,45.5157796,'#FFFFFF'],
  [46,'Outside In','nonprofit',-122.6864992,45.51761,'#FFFFFF'],
  [50,'underU4men','shop',-122.6824361,45.520228,'#FFD700'],
  [53,'Bowery Bagels','cafe',-122.67743675058,45.525300196283,'#39FF14'],
  [59,'Hunny Beez','restaurant',-122.683184360943,45.514667670995,'#FF6600'],
  [60,'Q Restaurant & Bar','restaurant',-122.674958291095,45.517077103876,'#FF6600'],
  [96,'Taboo Video','shop',-122.677600255511,45.525297148686,'#FFD700'],
  [118,'Prosper Portland','service',-122.672347328739,45.524742367934,'#A855F7'],
  [127,'P:EAR','nonprofit',-122.67643072209,45.525488610208,'#FFFFFF'],
  [130,'Club Privata','adult',-122.67399137448,45.516860623236,'#FF0000'],
];
export function standaloneDowntownPlacez(){
  return DOWNTOWN_PLACEZ.map(([id,name,type,lng,lat,color])=>({
    key:`directory-${id}`,kind:'place',name,type,coordinates:[lng,lat],color,
    typeIcon:`./icons/types/${type}.svg`,logo:id===4?'./venue-logos/badlands-official.png':id===33?'./venue-logos/33-0.png':'',waypointLogo:id===4?'./venue-logos/badlands-official.png':id===33?'./venue-logos/33-0.png':'',
  }));
}
export function standaloneDemoRows(){
  return [
    {key:'demo-sanctuary',kind:'event',name:'Sanctuary',coordinates:[-122.680179337043,45.523244045755],color:'#FF0000',logo:'./venue-logos/33-0.png',demoOpen:true},
    {key:'demo-badlands',kind:'event',name:'Badlands',coordinates:[-122.677388010838,45.523878444325],color:'#FF00CC',logo:'./venue-logos/badlands-official.png',logoMode:'alpha',demoOpen:true},
    {key:'demo-houz-looking',kind:'housing',name:'NEED A ROOM',coordinates:[-122.6764,45.5772],color:'#00FFFF',logo:'',housingModel:'LOOKING',waypointFamily:'houz',typeIcon:'./icons/housing-looking.svg',neighborhoodLabel:'NORTH · NORTHEAST',avatars:[{url:'../avatars/rose.webp',initial:'R',background:'#00FFFF'}],demoOpen:true},
    {key:'demo-houz-forming',kind:'housing',name:'FORMING A HOÜS',coordinates:[-122.6371,45.5264],color:'#39FF14',logo:'',housingModel:'FORMING',waypointFamily:'houz',typeIcon:'./icons/housing-forming.svg',neighborhoodLabel:'SOUTHEAST · NORTHEAST',avatars:[{url:'../avatars/bigfoot.webp',initial:'B',background:'#39FF14'},{url:'../avatars/coffee.webp',initial:'C',background:'#FF6600'},{url:'../avatars/witch.webp',initial:'W',background:'#8800FF'}],demoOpen:true},
    {key:'demo-houz-offering',kind:'housing',name:'ROOM FOR RENT',coordinates:[-122.6215,45.5148],color:'#FF6600',logo:'',housingModel:'OFFERING',waypointFamily:'houz',typeIcon:'./icons/housing-offering.svg',neighborhoodLabel:'SUNNYSIDE · SOUTHEAST',avatars:[{url:'../avatars/beaver.webp',initial:'B',background:'#FF6600'},{url:'../avatars/cat.webp',initial:'C',background:'#00FFFF'}],demoOpen:true},
    {key:'demo-houz-managed',kind:'housing',name:'PROPERTY FOR RENT',coordinates:[-122.6478,45.5589],color:'#8800FF',logo:'',housingModel:'MANAGED',waypointFamily:'houz',typeIcon:'./icons/housing-managed.svg',neighborhoodLabel:'NORTHEAST PORTLAND',avatars:[{url:'../avatars/bridge.webp',initial:'P',background:'#8800FF'}],demoOpen:true},
    ...standaloneDowntownPlacez(),
  ];
}
