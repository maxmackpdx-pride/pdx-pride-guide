// Zaylist Radix Slate dark (AboutRoadmap) plus Radix sage/cyan/orange for map objects.
// Windows, holograms, and the clock keep product neon.
export const radix={
 slate1:'#050506',slate2:'#111113',slate3:'#212225',slate4:'#272a2d',
 slate5:'#2e3135',slate6:'#363a3f',slate7:'#43484e',slate8:'#5c6066',
 slate9:'#696e77',slate10:'#777b84',slate11:'#b0b4ba',slate12:'#edeef0',
 sage2:'#171918',sage3:'#202221',sage4:'#272a27',sage5:'#2e3130',sage8:'#717769',
 cyan2:'#101b20',cyan3:'#082c36',cyan4:'#003848',cyan5:'#004558',cyan6:'#045468',
 cyan7:'#12677e',cyan8:'#1490b0',cyan9:'#00a2c7',cyan11:'#4cc3df',
 orange8:'#c36522',orange9:'#f76808',orange10:'#ff801f'
};
export const windowNeon={violet:'#8800FF',magenta:'#FF00CC',cyan:'#00FFFF'};
export const DOWNTOWN=[-122.676,45.523];
export function downtownDistance(center){
 const dx=((center?.[0]??0)-DOWNTOWN[0])*.7,dy=((center?.[1]??0)-DOWNTOWN[1]);
 return Math.hypot(dx,dy);
}
