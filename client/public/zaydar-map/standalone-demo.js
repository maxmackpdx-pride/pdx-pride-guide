// Existing directory coordinates and artwork, used only by the standalone
// visual demo. No sample event dates or titles enter the hosted event feed.
export const STANDALONE_DEMO_VIEW={center:[-122.651,45.535],zoom:13.4,pitch:48,bearing:0};
export function standaloneDemoRows(){
  return [
    {key:'demo-sanctuary',kind:'event',name:'Sanctuary',coordinates:[-122.680179337043,45.523244045755],color:'#FF0000',logo:'./venue-logos/33-0.png',demoOpen:true},
    {key:'demo-badlands',kind:'event',name:'Badlands',coordinates:[-122.677388010838,45.523878444325],color:'#FF00CC',logo:'./venue-logos/badlands-official.png',logoMode:'alpha',demoOpen:true},
    {key:'demo-houz-looking',kind:'housing',name:'NEED A ROOM',coordinates:[-122.6764,45.5772],color:'#00FFFF',logo:'',housingModel:'LOOKING',neighborhoodLabel:'NORTH · NORTHEAST',demoOpen:true},
    {key:'demo-houz-forming',kind:'housing',name:'FORMING A HAÜZ',coordinates:[-122.6371,45.5264],color:'#39FF14',logo:'',housingModel:'FORMING',neighborhoodLabel:'SOUTHEAST · NORTHEAST',demoOpen:true},
    {key:'demo-houz-offering',kind:'housing',name:'ROOM FOR RENT',coordinates:[-122.6215,45.5148],color:'#FF6600',logo:'',housingModel:'OFFERING',neighborhoodLabel:'SUNNYSIDE · SOUTHEAST',demoOpen:true},
    {key:'demo-houz-managed',kind:'housing',name:'PROPERTY FOR RENT',coordinates:[-122.6478,45.5589],color:'#8800FF',logo:'',housingModel:'MANAGED',neighborhoodLabel:'NORTHEAST PORTLAND',demoOpen:true},
  ];
}
