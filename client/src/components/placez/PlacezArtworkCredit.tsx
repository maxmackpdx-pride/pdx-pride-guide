/** Historical source imagery; keep this visible in native Info. */
export default function PlacezArtworkCredit({id}:{id:number}) {
 if(id!==8&&id!==9)return null;
 const sources=id===9?[
  ['2025 reference 1','https://commons.wikimedia.org/?curid=173093730'],
  ['2025 reference 2','https://commons.wikimedia.org/?curid=173093734'],
  ['2025 reference 3','https://commons.wikimedia.org/?curid=173324183'],
  ['2025 reference 4','https://commons.wikimedia.org/?curid=173324184'],
 ]:[
  ['2022 reference 1','https://commons.wikimedia.org/wiki/File:Portland,_Oregon_(August_27,_2022)_-_090.jpg'],
  ['2022 reference 2','https://commons.wikimedia.org/wiki/File:Portland,_Oregon_(August_27,_2022)_-_091.jpg'],
 ];
 return <p className="pz-native-credit">Artwork adapted from {sources.map(([label,url],i)=><span key={url}>{i>0?', ':''}<a href={url} target="_blank" rel="noopener noreferrer">{label}</a></span>)} by <a href="https://commons.wikimedia.org/wiki/User:Another_Believer" target="_blank" rel="noopener noreferrer">Another Believer</a>, <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a>. {id===9?'Photographed August 17, 2025.':'Photographed August 27, 2022.'} Generated interpretation with graphic overlays; architecture and fixtures may be redrawn. Historical imagery, not verification of the current exterior. Adapted photo artwork is shared under CC BY-SA 4.0.</p>;
}
