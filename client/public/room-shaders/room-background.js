// A self-contained background element for a positioned card or page section.
// Set the room before mounting. Changing the attribute swaps the shader.
import {loadRoomAssets,RoomRenderer,rooms} from './room-renderer.js?v=20261118-framing3';

class ZayRoomBackground extends HTMLElement {
  static observedAttributes=['room','paused','survey'];
  #canvas; #renderer; #observer; #visibility; #generation=0; #raf=0; #last=null; #seconds=0;
  #inView=true; #ready=false; #media=matchMedia('(prefers-reduced-motion: reduce)');
  #levels=[0,0,0];
  constructor(){
    super();
    const root=this.attachShadow({mode:'open'});
    root.innerHTML='<style>:host{display:block;position:absolute;inset:0;overflow:hidden;pointer-events:none;background:#000}img,canvas{position:absolute;inset:0;height:100%;width:100%;object-fit:cover}canvas[hidden]{display:none}</style><img alt=""><canvas aria-hidden="true" hidden></canvas>';
    this.#canvas=root.querySelector('canvas');

  }
  get room(){const key=this.getAttribute('room');return rooms.includes(key)?key:'placez'}
  // Optionally pass three normalized FFT levels from the host's audio graph.
  set bands(values){
    this.#levels=[0,1,2].map(i=>Math.max(0,Math.min(1,Number(values?.[i])||0)));
  }
  connectedCallback(){
    this.#observer=new ResizeObserver(this.#refresh);this.#observer.observe(this);
    this.#visibility=new IntersectionObserver(entries=>{
      this.#inView=entries[0].isIntersecting;this.#refresh();
    });this.#visibility.observe(this);
    this.#media.addEventListener('change',this.#refresh);
    document.addEventListener('visibilitychange',this.#refresh);
    this.#load();
  }
  disconnectedCallback(){
    this.#generation++;this.#ready=false;this.#stop();this.#observer?.disconnect();this.#visibility?.disconnect();
    this.#media.removeEventListener('change',this.#refresh);document.removeEventListener('visibilitychange',this.#refresh);
    this.#release(this.#renderer);this.#renderer=null;
  }
  attributeChangedCallback(name,oldValue,newValue){
    if(!this.isConnected||oldValue===newValue||!this.#observer)return;
    if(name==='room')this.#load();else this.#refresh();
  }
  async #load(){
    if(!this.isConnected)return;
    const generation=++this.#generation,room=this.room;
    this.#stop();this.#ready=false;this.#canvas.hidden=true;
    this.dataset.renderer='loading';delete this.dataset.shaderError;
    this.#release(this.#renderer);this.#renderer=null;
    const image=this.shadowRoot.querySelector('img');
    image.src=new URL('textures/'+room+'.jpg',import.meta.url);
    image.style.objectPosition=({placez:'50%',eventz:'52%',scenez:'41.5%',outzide:'50.6%'})[room]+' center';
    let renderer;
    try{
      const assets=await loadRoomAssets(new URL('./',import.meta.url),[room]);
      if(generation!==this.#generation)return;
      // Prepare on a fresh canvas so pending texture loads for a previous
      // room cannot change the currently visible context's bindings.
      const next=this.#canvas.cloneNode(false);
      next.addEventListener('webglcontextlost',ev=>{
        ev.preventDefault();if(next!==this.#canvas||renderer!==this.#renderer)return;
        this.#generation++;this.#ready=false;next.hidden=true;this.#stop();
      });
      next.addEventListener('webglcontextrestored',()=>{if(next===this.#canvas&&renderer===this.#renderer)this.#load()});
      renderer=new RoomRenderer(next,assets);await renderer.prepare();
      if(generation!==this.#generation){this.#release(renderer);return}
      this.#canvas.replaceWith(next);this.#canvas=next;this.#renderer=renderer;
      this.#ready=true;this.#refresh();next.hidden=false;this.dataset.renderer='webgl';
    }catch(error){
      this.#release(renderer);if(generation===this.#generation){
        this.dataset.renderer='fallback';this.dataset.shaderError=String(error?.message||error);
        console.warn('Room shader could not start:',room,error);
        this.dispatchEvent(new CustomEvent('shadererror',{detail:error}));
      }
    }
  }
  #release(renderer){
    if(!renderer)return;
    renderer.dispose();
    if(!renderer.gl.isContextLost())renderer.gl.getExtension('WEBGL_lose_context')?.loseContext();
  }
  #stop(){cancelAnimationFrame(this.#raf);this.#last=null}
  #refresh=()=>{
    this.#stop();
    if(!this.#ready||document.hidden||!this.#inView)return;
    const w=this.clientWidth,h=this.clientHeight;if(!w||!h)return;
    const ratio=Math.min(devicePixelRatio||1,1.6,1680/Math.max(w,h));
    this.#canvas.width=Math.max(1,Math.round(w*ratio));this.#canvas.height=Math.max(1,Math.round(h*ratio));
    this.#frame(performance.now());
  };
  #frame=now=>{
    const animate=!this.hasAttribute('paused')&&!this.#media.matches;
    if(this.#last===null||now-this.#last>=32){
      if(this.#last!==null&&animate)this.#seconds+=Math.min(.15,(now-this.#last)/1000);
      this.#last=now;
      this.#renderer.draw(this.room,this.#seconds,undefined,{bands:this.#levels,nightSurvey:this.getAttribute('survey')==='off'?0:1});
    }
    if(animate)this.#raf=requestAnimationFrame(this.#frame);
  };
}
if(!customElements.get('zay-room-background')) customElements.define('zay-room-background',ZayRoomBackground);
