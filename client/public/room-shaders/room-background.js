// A self-contained background element for a positioned card or page section.
// Set the room before mounting. Changing the attribute swaps the shader.
import {loadRoomAssets,RoomRenderer,rooms,roomArtURL,roomCanvasMetrics} from './room-renderer.js?v=20261120-room-uhd-1';

class ZayRoomBackground extends HTMLElement {
  static observedAttributes=['room','paused','survey'];
  #canvas; #renderer; #observer; #visibility; #generation=0; #raf=0; #last=null; #seconds=0;
  #inView=true; #ready=false; #media=matchMedia('(prefers-reduced-motion: reduce)');
  #levels=[0,0,0]; #frameOptions={}; #limits; #detail=1; #timingFrames=0; #slowFrames=0;
  constructor(){
    super();
    const root=this.attachShadow({mode:'open'});
    root.innerHTML='<style>:host{display:block;position:absolute;inset:0;overflow:hidden;pointer-events:none;background:#000}img,canvas{position:absolute;inset:0;height:100%;width:100%;object-fit:cover}img[hidden],canvas[hidden]{display:none}</style><img alt=""><canvas aria-hidden="true" hidden></canvas>';
    this.#canvas=root.querySelector('canvas');

  }
  get room(){const key=this.getAttribute('room');return rooms.includes(key)?key:'placez'}
  set room(value){this.setAttribute('room',value)}
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
    window.addEventListener('resize',this.#refresh);
    document.addEventListener('visibilitychange',this.#refresh);
    this.#load();
  }
  disconnectedCallback(){
    this.#generation++;this.#ready=false;this.#stop();this.#observer?.disconnect();this.#visibility?.disconnect();
    this.#media.removeEventListener('change',this.#refresh);document.removeEventListener('visibilitychange',this.#refresh);
    window.removeEventListener('resize',this.#refresh);
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
    this.#detail=1;this.#timingFrames=0;this.#slowFrames=0;
    this.dataset.renderer='loading';delete this.dataset.shaderError;
    this.#release(this.#renderer);this.#renderer=null;
    const image=this.shadowRoot.querySelector('img');
    image.hidden=false;
    image.src=roomArtURL(room);
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
        this.#generation++;this.#ready=false;next.hidden=true;image.hidden=false;this.dataset.renderer='fallback';this.#stop();
      });
      next.addEventListener('webglcontextrestored',()=>{if(next===this.#canvas&&renderer===this.#renderer)this.#load()});
      renderer=new RoomRenderer(next,assets);await renderer.prepare();
      if(generation!==this.#generation){this.#release(renderer);return}
      this.#canvas.replaceWith(next);this.#canvas=next;this.#renderer=renderer;
      const gl=renderer.gl, dims=gl.getParameter(gl.MAX_VIEWPORT_DIMS), edge=gl.getParameter(gl.MAX_RENDERBUFFER_SIZE);
      this.#limits=[Math.min(dims[0],edge),Math.min(dims[1],edge)];
      this.#ready=true;this.#refresh();next.hidden=false;image.hidden=true;this.dataset.renderer='webgl';
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
    if(this.#configureCanvas())this.#frame(performance.now());
  };
  #configureCanvas(){
    const w=this.clientWidth,h=this.clientHeight;if(!w||!h)return false;
    // The app background is viewport-fixed and starts at the top. Other
    // uses of this element (e.g. a room card) still draw the entire surface.
    const fixed=this.matches('.room-shader-page > .room-shader-background');
    const visibleH=fixed?Math.min(h,window.innerHeight):h;
    if(visibleH<1)return false;
    this.#frameOptions={aspect:w/h,visibleFraction:visibleH/h};
    const [width,height]=roomCanvasMetrics(w,visibleH,devicePixelRatio,this.#limits,window.innerWidth<=720,this.#detail,h);
    this.#canvas.style.height=visibleH+'px';
    if(this.#canvas.width!==width)this.#canvas.width=width;
    if(this.#canvas.height!==height)this.#canvas.height=height;
    return true;
  }
  #frame=now=>{
    const animate=!this.hasAttribute('paused')&&!this.#media.matches;
    // Draw every animation frame while animating (the 32ms gate stepped the
    // motion at ~30fps); a paused/reduced-motion element still draws once.
    if(this.#last===null||animate){
      if(this.#last!==null&&animate){
        const elapsed=now-this.#last;
        this.#seconds+=Math.min(.15,elapsed/1000);
        // Drop backing resolution, never the animation cadence, if this device
        // repeatedly misses frames. Ignore gaps caused by a tab switch.
        if(this.#detail>.66&&elapsed<100){
          this.#timingFrames++;
          if(elapsed>27)this.#slowFrames++;
          if(this.#timingFrames===16){
            if(this.#slowFrames>=8){this.#detail=Math.max(.65,this.#detail*.85);this.#configureCanvas();}
            this.#timingFrames=0;this.#slowFrames=0;
          }
        }
      }
      this.#last=now;
      this.#renderer.draw(this.room,this.#seconds,undefined,{...this.#frameOptions,bands:this.#levels,nightSurvey:this.getAttribute('survey')==='off'?0:1});
    }
    if(animate)this.#raf=requestAnimationFrame(this.#frame);
  };
}
if(!customElements.get('zay-room-background')) customElements.define('zay-room-background',ZayRoomBackground);
