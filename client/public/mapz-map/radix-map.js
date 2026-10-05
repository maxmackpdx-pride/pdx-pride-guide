// Official Radix dark scales. Each night-map hex maps to the nearest step.
//   #050c13/#050c18 ground/sky     → cyan 1 / sky 1
//   #0b1822/#122433/#1c3548/#27485c buildings → sky 1/2/4/5
//   #073a46/#0c5564/#147888 water  → cyan 3/6/7
//   #7af4ff/#19e3ff banks/streams  → sky 9 / cyan 11
//   #0b392b/#0b382c parks/woods    → teal 4 / teal 2
//   #5aaeb6/#1b4b49 hillshade      → cyan 11 / teal 5
//   #bceff5 moonlight              → cyan 12
//   #282e35/#171b20 roads          → slate 5 / slate 2
//   #50748c building edge          → cyan 8
// Accents on the map are the 7-day tokens, never off-palette neon.
export const radix={
 cyan1:'#0b161a',cyan2:'#101b20',cyan3:'#082c36',cyan4:'#003848',
 cyan5:'#004558',cyan6:'#045468',cyan7:'#12677e',cyan8:'#11809c',
 cyan9:'#00a2c7',cyan10:'#23afd0',cyan11:'#4ccce6',cyan12:'#b6ecf7',
 sky1:'#0d141f',sky2:'#111a27',sky3:'#112840',sky4:'#113555',
 sky5:'#154467',sky6:'#1b537b',sky7:'#1f6692',sky8:'#197cae',
 sky9:'#7ce2fe',sky10:'#a8eeff',sky11:'#75c7f0',sky12:'#c2f3ff',
 teal1:'#0d1514',teal2:'#111c1b',teal3:'#0d2d2a',teal4:'#023b37',
 teal5:'#084843',teal6:'#145750',teal7:'#1c6961',teal8:'#207e73',
 slate1:'#111113',slate2:'#18191b',slate3:'#212225',slate4:'#272a2d',
 slate5:'#2e3135',slate6:'#363a3f',slate8:'#5a6169',slate10:'#777b84',slate11:'#b0b4ba',
 orange3:'#331e0b',orange8:'#a35829',orange9:'#f76b15',orange10:'#ff801f'
};
export const OLED='#000000';
export const DAYS={
 mon:'#8800FF',tue:'#0044FF',wed:'#FFEE00',thu:'#00FFFF',
 fri:'#FF00CC',sat:'#39FF14',sun:'#FF6600'
};
export const DAY_LIST=[DAYS.mon,DAYS.tue,DAYS.wed,DAYS.thu,DAYS.fri,DAYS.sat,DAYS.sun];
export const windowNeon={
 violet:DAYS.mon,blue:DAYS.tue,yellow:DAYS.wed,cyan:DAYS.thu,
 magenta:DAYS.fri,green:DAYS.sat,orange:DAYS.sun
};
export const DOWNTOWN=[-122.676,45.523];
export function downtownDistance(center){
 const dx=((center?.[0]??0)-DOWNTOWN[0])*.7,dy=((center?.[1]??0)-DOWNTOWN[1]);
 return Math.hypot(dx,dy);
}
