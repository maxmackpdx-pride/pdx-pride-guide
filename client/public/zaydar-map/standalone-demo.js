// Existing directory coordinates and artwork, used only by the standalone
// visual demo. No sample event dates or titles enter the hosted event feed.
export const STANDALONE_DEMO_VIEW={center:[-122.6787,45.524],zoom:15.35,pitch:48,bearing:0};
export function standaloneDemoRows(){
  return [
    {key:'demo-sanctuary',kind:'event',name:'Sanctuary',coordinates:[-122.680179337043,45.523244045755],color:'#FF0000',logo:'./venue-logos/33-0.png',demoOpen:true},
    {key:'demo-badlands',kind:'event',name:'Badlands',coordinates:[-122.677388010838,45.523878444325],color:'#FF00CC',logo:'./venue-logos/badlands-official.png',logoMode:'alpha',demoOpen:true},
  ];
}
