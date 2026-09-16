var lS=Object.defineProperty;var _=(r,e)=>()=>(r&&(e=r(r=0)),e);var Ut=(r,e)=>{for(var t in e)lS(r,t,{get:e[t],enumerable:!0})};var qi,mS,ya,gS,ig,zu=_(()=>{qi=globalThis,mS=globalThis.document||{},ya=globalThis.process||{},gS=globalThis.console,ig=globalThis.navigator||{}});function ba(r){if(typeof window<"u"&&window.process?.type==="renderer"||typeof process<"u"&&process.versions?.electron)return!0;let e=typeof navigator<"u"&&navigator.userAgent,t=r||e;return!!(t&&t.indexOf("Electron")>=0)}var $u=_(()=>{});function ke(){return!(typeof process=="object"&&String(process)==="[object process]"&&!process?.browser)||ba()}var Vu=_(()=>{$u()});function Wu(r){return!r&&!ke()?"Node":ba(r)?"Electron":(r||ig.userAgent||"").indexOf("Edge")>-1?"Edge":globalThis.chrome?"Chrome":globalThis.safari?"Safari":globalThis.mozInnerScreenX?"Firefox":"Unknown"}var og=_(()=>{Vu();$u();zu()});var ju,Rr=_(()=>{zu();Vu();og();ju="4.1.2"});function In(r,e){if(!r)throw new Error(e||"Assertion failed")}var Hu=_(()=>{});function Yu(r){if(!r)return 0;let e;switch(typeof r){case"number":e=r;break;case"object":e=r.logLevel||r.priority||0;break;default:return 0}return In(Number.isFinite(e)&&e>=0),e}function sg(r){let{logLevel:e,message:t}=r;r.logLevel=Yu(e);let n=r.args?Array.from(r.args):[];for(;n.length&&n.shift()!==t;);switch(typeof e){case"string":case"function":t!==void 0&&n.unshift(t),r.message=e;break;case"object":Object.assign(r,e);break;default:}typeof r.message=="function"&&(r.message=r.message());let i=typeof r.message;return In(i==="string"||i==="object"),Object.assign(r,{args:n},r.opts)}var ag=_(()=>{Hu()});var Ir,xa,cg=_(()=>{ag();Ir=()=>{},xa=class{constructor({level:e=0}={}){this.userData={},this._onceCache=new Set,this._level=e}set level(e){this.setLevel(e)}get level(){return this.getLevel()}setLevel(e){return this._level=e,this}getLevel(){return this._level}warn(e,...t){return this._log("warn",0,e,t,{once:!0})}error(e,...t){return this._log("error",0,e,t)}log(e,t,...n){return this._log("log",e,t,n)}info(e,t,...n){return this._log("info",e,t,n)}once(e,t,...n){return this._log("once",e,t,n,{once:!0})}_log(e,t,n,i,o={}){let s=sg({logLevel:t,message:n,args:this._buildArgs(t,n,i),opts:o});return this._createLogFunction(e,s,o)}_buildArgs(e,t,n){return[e,t,...n]}_createLogFunction(e,t,n){if(!this._shouldLog(t.logLevel))return Ir;let i=this._getOnceTag(n.tag??t.tag??t.message);if((n.once||t.once)&&i!==void 0){if(this._onceCache.has(i))return Ir;this._onceCache.add(i)}return this._emit(e,t)}_shouldLog(e){return this.getLevel()>=Yu(e)}_getOnceTag(e){if(e!==void 0)try{return typeof e=="string"?e:String(e)}catch{return}}}});function yS(r){try{let e=window[r],t="__storage_test__";return e.setItem(t,t),e.removeItem(t),e}catch{return null}}var va,lg=_(()=>{va=class{constructor(e,t,n="sessionStorage"){this.storage=yS(n),this.id=e,this.config=t,this._loadConfiguration()}getConfiguration(){return this.config}setConfiguration(e){if(Object.assign(this.config,e),this.storage){let t=JSON.stringify(this.config);this.storage.setItem(this.id,t)}}_loadConfiguration(){let e={};if(this.storage){let t=this.storage.getItem(this.id);e=t?JSON.parse(t):{}}return Object.assign(this.config,e),this}}});function ug(r){let e;return r<10?e=`${r.toFixed(2)}ms`:r<100?e=`${r.toFixed(1)}ms`:r<1e3?e=`${r.toFixed(0)}ms`:e=`${(r/1e3).toFixed(2)}s`,e}function fg(r,e=8){let t=Math.max(e-r.length,0);return`${" ".repeat(t)}${r}`}var dg=_(()=>{});function hg(r){return typeof r!="string"?r:(r=r.toUpperCase(),wa[r]||wa.WHITE)}function pg(r,e,t){return!ke&&typeof r=="string"&&(e&&(r=`\x1B[${hg(e)}m${r}\x1B[39m`),t&&(r=`\x1B[${hg(t)+bS}m${r}\x1B[49m`)),r}var wa,bS,mg=_(()=>{Rr();(function(r){r[r.BLACK=30]="BLACK",r[r.RED=31]="RED",r[r.GREEN=32]="GREEN",r[r.YELLOW=33]="YELLOW",r[r.BLUE=34]="BLUE",r[r.MAGENTA=35]="MAGENTA",r[r.CYAN=36]="CYAN",r[r.WHITE=37]="WHITE",r[r.BRIGHT_BLACK=90]="BRIGHT_BLACK",r[r.BRIGHT_RED=91]="BRIGHT_RED",r[r.BRIGHT_GREEN=92]="BRIGHT_GREEN",r[r.BRIGHT_YELLOW=93]="BRIGHT_YELLOW",r[r.BRIGHT_BLUE=94]="BRIGHT_BLUE",r[r.BRIGHT_MAGENTA=95]="BRIGHT_MAGENTA",r[r.BRIGHT_CYAN=96]="BRIGHT_CYAN",r[r.BRIGHT_WHITE=97]="BRIGHT_WHITE"})(wa||(wa={}));bS=10});function gg(r,e=["constructor"]){let t=Object.getPrototypeOf(r),n=Object.getOwnPropertyNames(t),i=r;for(let o of n){let s=i[o];typeof s=="function"&&(e.find(a=>o===a)||(i[o]=s.bind(r)))}}var _g=_(()=>{});var Ea,mt,qu=_(()=>{Rr();Ea=class{getHighResolutionTimer(){let e;if(ke()&&qi.performance)e=qi?.performance?.now?.();else if("hrtime"in ya){let t=ya?.hrtime?.();e=t[0]*1e3+t[1]/1e6}else e=Date.now();return e}getMemoryUsageMB(){let t=qi?.performance?.memory?.usedJSHeapSize;return t==null?null:Math.trunc(t/1024/1024)}},mt=new Ea;globalThis.Probe=Ea;globalThis.probe=mt});function xS(r,e,t){if(typeof e=="string"){let n=t.time?fg(ug(t.total)):"";e=t.time?`${r}: ${n}  ${e}`:`${r}: ${e}`,e=pg(e,t.color,t.background)}return e}function vS(r){for(let e in r)for(let t in r[e])return t||"untitled";return"empty"}var On,Zu,we,Xu=_(()=>{Rr();cg();lg();dg();mg();_g();Hu();qu();On={debug:ke()&&console.debug||console.log,log:console.log,info:console.info,warn:console.warn,error:console.error},Zu={enabled:!0,level:0},we=class extends xa{constructor({id:e}={id:""}){super({level:0}),this.VERSION=ju,this._startTs=mt.getHighResolutionTimer(),this._deltaTs=mt.getHighResolutionTimer(),this.userData={},this.LOG_THROTTLE_TIMEOUT=0,this.id=e,this.userData={},this._storage=new va(`__probe-${this.id}__`,{[this.id]:Zu}),this.timeStamp(`${this.id} started`),gg(this),Object.seal(this)}isEnabled(){return this._getConfiguration().enabled}getLevel(){return this._getConfiguration().level}getTotal(){return Number((mt.getHighResolutionTimer()-this._startTs).toPrecision(10))}getDelta(){return Number((mt.getHighResolutionTimer()-this._deltaTs).toPrecision(10))}set priority(e){this.level=e}get priority(){return this.level}getPriority(){return this.level}enable(e=!0){return this._updateConfiguration({enabled:e}),this}setLevel(e){return this._updateConfiguration({level:e}),this}get(e){return this._getConfiguration()[e]}set(e,t){this._updateConfiguration({[e]:t})}settings(){console.table?console.table(this._storage.config):console.log(this._storage.config)}assert(e,t){if(!e)throw new Error(t||"Assertion failed")}warn(e,...t){return this._log("warn",0,e,t,{method:On.warn,once:!0})}error(e,...t){return this._log("error",0,e,t,{method:On.error})}deprecated(e,t){return this.warn(`\`${e}\` is deprecated and will be removed in a later version. Use \`${t}\` instead`)}removed(e,t){return this.error(`\`${e}\` has been removed. Use \`${t}\` instead`)}probe(e,t,...n){let i=mt.getMemoryUsageMB();if(i!==null){let o=`${i}MB `;typeof t=="function"?t=()=>`${o}${t()}`:typeof t=="string"&&(t=`${o}${t}`)}return this._log("log",e,t,n,{method:On.log,time:!0,once:!0})}log(e,t,...n){return this._log("log",e,t,n,{method:On.debug})}info(e,t,...n){return this._log("info",e,t,n,{method:console.info})}once(e,t,...n){return this._log("once",e,t,n,{method:On.debug||On.info,once:!0})}table(e,t,n){return t?this._log("table",e,t,n&&[n]||[],{method:console.table||Ir,tag:vS(t)}):Ir}time(e,t){return this._log("time",e,t,[],{method:console.time?console.time:console.info})}timeEnd(e,t){return this._log("time",e,t,[],{method:console.timeEnd?console.timeEnd:console.info})}timeStamp(e,t){return this._log("time",e,t,[],{method:console.timeStamp||Ir})}group(e,t,n={collapsed:!1}){let i=(n.collapsed?console.groupCollapsed:console.group)||console.info;return this._log("group",e,t,[],{method:i})}groupCollapsed(e,t,n={}){return this.group(e,t,Object.assign({},n,{collapsed:!0}))}groupEnd(e){return this._log("groupEnd",e,"",[],{method:console.groupEnd||Ir})}withGroup(e,t,n){this.group(e,t)();try{n()}finally{this.groupEnd(e)()}}trace(){console.trace&&console.trace()}_shouldLog(e){return this.isEnabled()&&super._shouldLog(e)}_emit(e,t){let n=t.method;In(n),t.total=this.getTotal(),t.delta=this.getDelta(),this._deltaTs=mt.getHighResolutionTimer();let i=xS(this.id,t.message,t);return n.bind(console,i,...t.args)}_getConfiguration(){return this._storage.config[this.id]||this._updateConfiguration(Zu),this._storage.config[this.id]}_updateConfiguration(e){let t=this._storage.config[this.id]||{...Zu};this._storage.setConfiguration({[this.id]:{...t,...e}})}};we.VERSION=ju});var yg=_(()=>{qu();globalThis.probe||(globalThis.probe=mt)});var NN,Zi=_(()=>{Xu();Xu();yg();NN=new we({id:"@probe.gl/log"})});function Ji(){let r;if(typeof window<"u"&&window.performance)r=window.performance.now();else if(typeof process<"u"&&process.hrtime){let e=process.hrtime();r=e[0]*1e3+e[1]/1e6}else r=Date.now();return r}var pf=_(()=>{});var Br,mf=_(()=>{pf();Br=class{constructor(e,t){this.sampleSize=1,this.time=0,this.count=0,this.samples=0,this.lastTiming=0,this.lastSampleTime=0,this.lastSampleCount=0,this._count=0,this._time=0,this._samples=0,this._startTime=0,this._timerPending=!1,this.name=e,this.type=t,this.reset()}reset(){return this.time=0,this.count=0,this.samples=0,this.lastTiming=0,this.lastSampleTime=0,this.lastSampleCount=0,this._count=0,this._time=0,this._samples=0,this._startTime=0,this._timerPending=!1,this}setSampleSize(e){return this.sampleSize=e,this}incrementCount(){return this.addCount(1),this}decrementCount(){return this.subtractCount(1),this}addCount(e){return this._count+=e,this._samples++,this._checkSampling(),this}subtractCount(e){return this._count-=e,this._samples++,this._checkSampling(),this}addTime(e){return this._time+=e,this.lastTiming=e,this._samples++,this._checkSampling(),this}timeStart(){return this._startTime=Ji(),this._timerPending=!0,this}timeEnd(){return this._timerPending?(this.addTime(Ji()-this._startTime),this._timerPending=!1,this._checkSampling(),this):this}getSampleAverageCount(){return this.sampleSize>0?this.lastSampleCount/this.sampleSize:0}getSampleAverageTime(){return this.sampleSize>0?this.lastSampleTime/this.sampleSize:0}getSampleHz(){return this.lastSampleTime>0?this.sampleSize/(this.lastSampleTime/1e3):0}getAverageCount(){return this.samples>0?this.count/this.samples:0}getAverageTime(){return this.samples>0?this.time/this.samples:0}getHz(){return this.time>0?this.samples/(this.time/1e3):0}_checkSampling(){this._samples===this.sampleSize&&(this.lastSampleTime=this._time,this.lastSampleCount=this._count,this.count+=this._count,this.time+=this._time,this.samples+=this._samples,this._time=0,this._count=0,this._samples=0)}}});var Ye,Rg=_(()=>{mf();Ye=class{constructor(e){this.stats={},this.id=e.id,this.stats={},this._initializeStats(e.stats),Object.seal(this)}get(e,t="count"){return this._getOrCreate({name:e,type:t})}get size(){return Object.keys(this.stats).length}reset(){for(let e of Object.values(this.stats))e.reset();return this}forEach(e){for(let t of Object.values(this.stats))e(t)}getTable(){let e={};return this.forEach(t=>{e[t.name]={time:t.time||0,count:t.count||0,average:t.getAverageTime()||0,hz:t.getHz()||0}}),e}_initializeStats(e=[]){e.forEach(t=>this._getOrCreate(t))}_getOrCreate(e){let{name:t,type:n}=e,i=this.stats[t];return i||(e instanceof Br?i=e:i=new Br(t,n),this.stats[t]=i),i}}});var eo=_(()=>{Rg();mf();pf()});function a_(r){return ArrayBuffer.isView(r)&&!(r instanceof DataView)}function c_(r){return Array.isArray(r)?r.length===0||typeof r[0]=="number":!1}function ao(r){return a_(r)||c_(r)}var l_=_(()=>{});var Cf=_(()=>{l_()});function Gn(r){let e=r.split(""),t=0,n=0,i=!1,o=!1,s=!1;for(;t<r.length;){let a=r[t],c=r[t+1];if(o){s?s=!1:a==="\\"?s=!0:a==='"'&&(o=!1),t++;continue}if(i){a===`
`||a==="\r"?i=!1:e[t]=" ",t++;continue}if(n>0){if(a==="/"&&c==="*"){e[t]=" ",e[t+1]=" ",n++,t+=2;continue}if(a==="*"&&c==="/"){e[t]=" ",e[t+1]=" ",n--,t+=2;continue}a!==`
`&&a!=="\r"&&(e[t]=" "),t++;continue}if(a==='"'){o=!0,t++;continue}if(a==="/"&&c==="/"){e[t]=" ",e[t+1]=" ",i=!0,t+=2;continue}if(a==="/"&&c==="*"){e[t]=" ",e[t+1]=" ",n=1,t+=2;continue}t++}return e.join("")}function kr(r,e){let t=Gn(r),n=[];for(let i of e){i.lastIndex=0;let o;for(o=i.exec(t);o;){let s=i===e[0],a=o.index,c=o[0].length;n.push({match:r.slice(a,a+c),index:a,length:c,bindingToken:o[s?1:2],groupToken:o[s?2:1],accessDeclaration:o[3]?.trim(),name:o[4]}),o=i.exec(t)}}return n.sort((i,o)=>i.index-o.index)}function Nf(r,e,t){let n=kr(r,e);if(!n.length)return r;let i="",o=0;for(let s of n)i+=r.slice(o,s.index),i+=t(s),o=s.index+s.length;return i+=r.slice(o),i}function Ff(r){return/@binding\(\s*auto\s*\)/.test(Gn(r))}function S_(r,e){return kr(r,e===Un||e===Na?V1:e).find(n=>n.bindingToken==="auto")}var Ue,Un,Na,P_,V1,Fa=_(()=>{Ue="(?:var<\\s*(uniform|storage(?:\\s*,\\s*[A-Za-z_][A-Za-z0-9_]*)?)\\s*>|var)\\s+([A-Za-z_][A-Za-z0-9_]*)",Un=[new RegExp(`@binding\\(\\s*(auto|\\d+)\\s*\\)\\s*@group\\(\\s*(\\d+)\\s*\\)\\s*${Ue}`,"g"),new RegExp(`@group\\(\\s*(\\d+)\\s*\\)\\s*@binding\\(\\s*(auto|\\d+)\\s*\\)\\s*${Ue}`,"g")],Na=[new RegExp(`@binding\\(\\s*(auto|\\d+)\\s*\\)\\s*@group\\(\\s*(\\d+)\\s*\\)\\s*${Ue}`,"g"),new RegExp(`@group\\(\\s*(\\d+)\\s*\\)\\s*@binding\\(\\s*(auto|\\d+)\\s*\\)\\s*${Ue}`,"g")],P_=[new RegExp(`@binding\\(\\s*(\\d+)\\s*\\)\\s*@group\\(\\s*(\\d+)\\s*\\)\\s*${Ue}`,"g"),new RegExp(`@group\\(\\s*(\\d+)\\s*\\)\\s*@binding\\(\\s*(\\d+)\\s*\\)\\s*${Ue}`,"g")],V1=[new RegExp(`@binding\\(\\s*(auto)\\s*\\)\\s*@group\\(\\s*(\\d+)\\s*\\)\\s*${Ue}`,"g"),new RegExp(`@group\\(\\s*(\\d+)\\s*\\)\\s*@binding\\(\\s*(auto)\\s*\\)\\s*${Ue}`,"g"),new RegExp(`@binding\\(\\s*(auto)\\s*\\)\\s*@group\\(\\s*(\\d+)\\s*\\)(?:[\\s\\n\\r]*@[A-Za-z_][^\\n\\r]*)*[\\s\\n\\r]*${Ue}`,"g"),new RegExp(`@group\\(\\s*(\\d+)\\s*\\)\\s*@binding\\(\\s*(auto)\\s*\\)(?:[\\s\\n\\r]*@[A-Za-z_][^\\n\\r]*)*[\\s\\n\\r]*${Ue}`,"g")]});function Ga(r,e={}){let t=T_(r),n=W1(t);if(!n)return null;let i=j1(t,n);if(!i)return null;let o=Y1(t,n,i);if(!o)return null;if(e.scanVertexAttributes===!1)return{attributes:[],bindings:o};let s=H1(t,n);if(!s)return null;let a=Q1(t,n,i,s,e.vertexEntryPoint);return a?{attributes:a,bindings:o}:null}function T_(r){let e=Gn(r),t=/[A-Za-z_][A-Za-z0-9_]*|(?:0[xX][0-9A-Fa-f]+|\d+)|[@(){}<>\[\]:,;=]/g,n=[],i=t.exec(e);for(;i;)n.push({value:i[0],index:i.index}),i=t.exec(e);return n}function W1(r){let e=[],t=0;for(let n of r){if(n.value==="}"&&t===0)return null;e.push(t),n.value==="{"?t++:n.value==="}"&&t--}return t===0?e:null}function j1(r,e){let t=new Map;for(let n=0;n<r.length;n++){if(e[n]!==0||r[n].value!=="alias")continue;let i=r[n+1]?.value;if(!fo(i)||r[n+2]?.value!=="="||t.has(i))return null;let o=C_(r,e,n+3,";");if(o<0||o===n+3)return null;t.set(i,Ua(r.slice(n+3,o))),n=o}return t}function H1(r,e){let t=new Map;for(let n=0;n<r.length;n++){if(e[n]!==0||r[n].value!=="struct")continue;let i=r[n+1]?.value,o=n+2;if(!fo(i)||t.has(i)||r[o]?.value!=="{")return null;let s=$f(r,o,"{","}");if(s<0)return null;t.set(i,r.slice(o+1,s)),n=s}return t}function Y1(r,e,t){let n=[],i=new Set,o=new Set;for(let s=0;s<r.length;s++){if(e[s]!==0||r[s].value!=="var")continue;let a=M_(r,e,s),c=r.slice(a,s),l=Uf(c,"group"),u=Uf(c,"binding");if(l===null||u===null||l===void 0!=(u===void 0))return null;if(l===void 0||u===void 0)continue;let f=s+1,d=[];if(r[f]?.value==="<"){let y=$f(r,f,"<",">");if(y<0)return null;let x=za(r.slice(f+1,y),",");if(!x)return null;d=x.map(Ua),f=y+1}let h=r[f]?.value;if(!fo(h)||r[f+1]?.value!==":")return null;let p=C_(r,e,f+2,";");if(p<0||p===f+2)return null;let m=zf(Ua(r.slice(f+2,p)),t);if(!m)return null;let g=q1({name:h,group:l,location:u,addressSpace:d,resourceType:m}),b=`${l}:${u}`;if(!g||i.has(b)||o.has(h))return null;n.push(g),i.add(b),o.add(h),s=p}return K1(n),n.sort((s,a)=>s.group-a.group||s.location-a.location||s.name.localeCompare(a.name))}function q1(r){let{name:e,group:t,location:n,addressSpace:i,resourceType:o}=r,s={name:e,group:t,location:n};if(i[0]==="uniform"&&i.length===1)return{...s,type:"uniform"};if(i[0]==="storage"&&i.length<=2){let a=i[1]||"read";return a==="read"?{...s,type:"read-only-storage"}:a==="read_write"?{...s,type:"storage"}:null}return i.length>0?null:o==="sampler"||o==="sampler_comparison"?{...s,type:"sampler",...o==="sampler_comparison"?{samplerType:"comparison"}:{}}:o==="texture_external"?{...s,type:"external-texture"}:Z1(s,o)||X1(s,o)}function Z1(r,e){let t=/^texture_storage_(1d|2d|2d_array|3d)<([A-Za-z0-9_]+),(read|write|read_write)>$/.exec(e);if(!t)return null;let n={read:"read-only",write:"write-only",read_write:"read-write"}[t[3]];return{...r,type:"storage",format:t[2],access:n,viewDimension:Gf(t[1])}}function X1(r,e){let t=/^texture_(multisampled_)?(1d|2d|2d_array|cube|cube_array|3d)<(f32|i32|u32)>$/.exec(e);if(t){if(t[1]&&t[2]!=="2d")return null;let i={f32:"float",i32:"sint",u32:"uint"}[t[3]];return{...r,type:"texture",viewDimension:Gf(t[2]),sampleType:i,multisampled:!!t[1]}}let n=/^texture_depth_(multisampled_)?(2d|2d_array|cube|cube_array)$/.exec(e);return!n||n[1]&&n[2]!=="2d"?null:{...r,type:"texture",viewDimension:Gf(n[2]),sampleType:"depth",multisampled:!!n[1]}}function K1(r){for(let e of r){if(e.type!=="sampler"||e.samplerType||!e.name.endsWith("Sampler"))continue;let t=e.name.slice(0,-7);r.find(i=>i.type==="texture"&&i.name===t&&i.group===e.group)?.sampleType==="depth"&&(e.samplerType="non-filtering")}}function Q1(r,e,t,n,i){let o=J1(r,e);if(!o)return null;let s=o.filter(h=>h.vertex),a=i?s.find(h=>h.name===i):s.length===1?s[0]:void 0;if(!a)return s.length===0&&!i?[]:null;let c=za(a.parameters,",");if(!c)return null;let l=[],u=new Set,f=new Set,d=new Set;for(let h of c)if(h.length>0&&!L_({declaration:h,aliases:t,structures:n,attributes:l,attributeLocations:u,attributeNames:f,visitedStructures:d}))return null;return l.sort((h,p)=>h.location-p.location||h.name.localeCompare(p.name))}function J1(r,e){let t=[],n=new Set;for(let i=0;i<r.length;i++){if(e[i]!==0||r[i].value!=="fn")continue;let o=r[i+1]?.value,s=i+2;if(!fo(o)||n.has(o)||r[s]?.value!=="(")return null;let a=$f(r,s,"(",")");if(a<0)return null;let c=M_(r,e,i);t.push({name:o,vertex:A_(r.slice(c,i),"vertex"),parameters:r.slice(s+1,a)}),n.add(o),i=a}return t}function L_(r){let{declaration:e,aliases:t,structures:n,attributes:i,attributeLocations:o,attributeNames:s,visitedStructures:a}=r,c=rT(e,":");if(c<1||c===e.length-1)return!1;let l=nT(e.slice(0,c)),u=Uf(e.slice(0,c),"location"),f=A_(e.slice(0,c),"builtin"),d=zf(Ua(e.slice(c+1)),t);if(!l||u===null||!d||u!==void 0&&f)return!1;if(u!==void 0){let m=tT(d);return!m||o.has(u)||s.has(l)?!1:(i.push({name:l,location:u,type:m}),o.add(u),s.add(l),!0)}if(f)return!0;let h=n.get(d);if(!h||a.has(d))return!1;let p=za(h,",");if(!p)return!1;a.add(d);for(let m of p)if(m.length>0&&!L_({...r,declaration:m}))return!1;return a.delete(d),!0}function zf(r,e,t=new Set){let n=T_(r),i="";for(let o of n){let s=e.get(o.value);if(!s){i+=eT(o.value);continue}if(t.has(o.value))return null;let a=new Set(t);a.add(o.value);let c=zf(s,e,a);if(!c)return null;i+=c}return i}function eT(r){let e=/^(vec[234]|mat[234]x[234])([fiuh])$/.exec(r);if(!e)return r;let t={f:"f32",i:"i32",u:"u32",h:"f16"}[e[2]];return`${e[1]}<${t}>`}function tT(r){return/^(?:i32|u32|f32|f16|vec[234]<(?:i32|u32|f32|f16)>)$/.test(r)?r:null}function Uf(r,e){let t;for(let n=0;n<r.length;n++)if(!(r[n].value!=="@"||r[n+1]?.value!==e)){if(t!==void 0||r[n+2]?.value!=="("||!/^\d+$/.test(r[n+3]?.value||"")||r[n+4]?.value!==")")return null;t=Number(r[n+3].value)}return t}function A_(r,e){return r.some((t,n)=>t.value==="@"&&r[n+1]?.value===e)}function Gf(r){return r.replace("_","-")}function $f(r,e,t,n){let i=0;for(let o=e;o<r.length;o++)if(r[o].value===t)i++;else if(r[o].value===n&&--i===0)return o;return-1}function za(r,e){let t=[],n=0,i={"(":0,"<":0,"[":0,"{":0},o=Object.keys(i),s={")":"(",">":"<","]":"[","}":"{"};for(let a=0;a<r.length;a++){let c=r[a].value;if(c===e&&o.every(l=>i[l]===0)){t.push(r.slice(n,a)),n=a+1;continue}if(c in i)i[c]++;else if(c in s){let l=s[c];if(i[l]--,i[l]<0)return null}}return o.every(a=>i[a]===0)?(t.push(r.slice(n)),t):null}function rT(r,e){let t=za(r,e);return t&&t.length===2?t[0].length:-1}function C_(r,e,t,n){for(let i=t;i<r.length;i++)if(e[i]===0&&r[i].value===n)return i;return-1}function M_(r,e,t){for(let n=t-1;n>=0;n--)if(r[n].value===";"&&e[n]===0||r[n].value==="}"&&e[n]===1)return n+1;return 0}function nT(r){for(let e=r.length-1;e>=0;e--)if(fo(r[e].value))return r[e].value;return null}function Ua(r){return r.map(e=>e.value).join("")}function fo(r){return!!(r&&/^[A-Za-z_][A-Za-z0-9_]*$/.test(r))}var Vf=_(()=>{Fa()});function $t(r,e){if(!r){let t=new Error(e||"shadertools: assertion failed.");throw Error.captureStackTrace?.(t,$t),t}}var $a=_(()=>{});function I_(r){let e={};for(let[t,n]of Object.entries(r))e[t]=iT(n);return e}function iT(r){let e=R_(r);if(e!=="object")return{value:r,...Wf[e],type:e};if(typeof r=="object")return r?r.type!==void 0?{...r,...Wf[r.type],type:r.type}:r.value===void 0?{type:"object",value:r}:(e=R_(r.value),{...r,...Wf[e],type:e}):{type:"object",value:null};throw new Error("props")}function R_(r){return Array.isArray(r)||ArrayBuffer.isView(r)?"array":typeof r}var Wf,O_=_(()=>{Wf={number:{type:"number",validate(r,e){return Number.isFinite(r)&&typeof e=="object"&&(e.max===void 0||r<=e.max)&&(e.min===void 0||r>=e.min)}},array:{type:"array",validate(r,e){return Array.isArray(r)||ArrayBuffer.isView(r)}}}});var B_,D_,k_=_(()=>{B_=`#ifdef MODULE_LOGDEPTH
  logdepth_adjustPosition(gl_Position);
#endif
`,D_=`#ifdef MODULE_MATERIAL
  fragColor = material_filterColor(fragColor);
#endif

#ifdef MODULE_LIGHTING
  fragColor = lighting_filterColor(fragColor);
#endif

#ifdef MODULE_FOG
  fragColor = fog_filterColor(fragColor);
#endif

#ifdef MODULE_PICKING
  fragColor = picking_filterHighlightColor(fragColor);
  fragColor = picking_filterPickingColor(fragColor);
#endif

#ifdef MODULE_LOGDEPTH
  logdepth_setFragDepth();
#endif
`});function U_(r){let e={vertex:{},fragment:{}};for(let t in r){let n=r[t],i=sT(t);typeof n=="string"&&(n={order:0,injection:n}),e[i][t]=n}return e}function sT(r){let e=r.slice(0,2);switch(e){case"vs":return"vertex";case"fs":return"fragment";default:throw new Error(e)}}function po(r,e,t,n=!1,i="glsl",o={}){let s=e==="vertex";for(let a in t){let c=t[a];c.sort((u,f)=>u.order-f.order),jf.length=c.length;for(let u=0,f=c.length;u<f;++u)jf[u]=c[u].injection;let l=`${jf.join(`
`)}
`;switch(a){case"vs:#decl":(i==="wgsl"||s)&&(r=r.replace(ho,l));break;case"vs:#main-start":(i==="wgsl"||s)&&(r=i==="wgsl"?Va(r,"vertex",l,"start",o.vertex):r.replace(N_,u=>u+l));break;case"vs:#main-end":(i==="wgsl"||s)&&(r=i==="wgsl"?Va(r,"vertex",l,"end",o.vertex):r.replace(F_,u=>l+u));break;case"fs:#decl":(i==="wgsl"||!s)&&(r=r.replace(ho,l));break;case"fs:#main-start":(i==="wgsl"||!s)&&(r=i==="wgsl"?Va(r,"fragment",l,"start",o.fragment):r.replace(N_,u=>u+l));break;case"fs:#main-end":(i==="wgsl"||!s)&&(r=i==="wgsl"?Va(r,"fragment",l,"end",o.fragment):r.replace(F_,u=>l+u));break;default:r=r.replace(a,u=>u+l)}}return r=r.replace(ho,""),n&&(r=r.replace(/\}\s*$/,a=>a+oT[e])),r}function Va(r,e,t,n,i){let o=aT(r,e,i);if(!o)return r;if(n==="start"){let s=o.openBraceIndex+1;return`${r.slice(0,s)}
${t}${r.slice(s)}`}return`${r.slice(0,o.closeBraceIndex)}${t}${r.slice(o.closeBraceIndex)}`}function aT(r,e,t){let n=e==="vertex"?"@vertex":"@fragment",i=r.indexOf(n);if(i<0)return null;let o=t?r.search(new RegExp(`\\bfn\\s+${cT(t)}\\s*\\(`)):r.indexOf("fn",i);if(o<0)return null;let s=r.indexOf("{",o);if(s<0)return null;let a=0;for(let c=s;c<r.length;c++){let l=r[c];if(l==="{")a++;else if(l==="}"&&(a--,a===0))return{openBraceIndex:s,closeBraceIndex:c}}return null}function cT(r){return r.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}var oT,N_,F_,jf,ho,Hf=_(()=>{k_();oT={vertex:B_,fragment:D_},N_=/void\s+main\s*\([^)]*\)\s*\{\n?/,F_=/}\n?[^{}]*$/,jf=[],ho="__LUMA_INJECT_DECLARATIONS__"});function zn(r){r.map(e=>lT(e))}function lT(r){if(r.instance)return;zn(r.dependencies||[]);let{propTypes:e={},deprecations:t=[],inject:n={}}=r,i={normalizedInjections:U_(n),parsedDeprecations:uT(t)};e&&(i.propValidators=I_(e)),r.instance=i;let o={};e&&(o=Object.entries(e).reduce((s,[a,c])=>{let l=c?.value;return l&&(s[a]=l),s},{})),r.defaultUniforms={...r.defaultUniforms,...o}}function Yf(r,e,t){r.deprecations?.forEach(n=>{n.regex?.test(e)&&(n.deprecated?t.deprecated(n.old,n.new)():t.removed(n.old,n.new)())})}function uT(r){return r.forEach(e=>{switch(e.type){case"function":e.regex=new RegExp(`\\b${e.old}\\(`);break;default:e.regex=new RegExp(`${e.type} ${e.old};`)}}),r}var Wa=_(()=>{O_();Hf()});function Nr(r){zn(r);let e={},t={};G_({modules:r,level:0,moduleMap:e,moduleDepth:t});let n=Object.keys(t).sort((i,o)=>t[o]-t[i]).map(i=>e[i]);return zn(n),n}function G_(r){let{modules:e,level:t,moduleMap:n,moduleDepth:i}=r;if(t>=5)throw new Error("Possible loop in shader dependency graph");for(let o of e)n[o.name]=o,(i[o.name]===void 0||i[o.name]<t)&&(i[o.name]=t);for(let o of e)o.dependencies&&G_({modules:o.dependencies,level:t+1,moduleMap:n,moduleDepth:i})}var qf=_(()=>{Wa()});var P,Pe=_(()=>{Zi();P=new we({id:"luma.gl"})});function fT(r,e){return r!=null?!!r:e!==void 0?e!=="production":!1}function dT(){return fT(P.get("debug"),hT())}function hT(){let r=globalThis.process;if(r?.env)return r.env.NODE_ENV}var ja,Zf=_(()=>{Pe();ja={id:null,powerPreference:"high-performance",failIfMajorPerformanceCaveat:!1,featureLevel:void 0,optionalFeatures:[],xrCompatible:!1,createCanvasContext:void 0,webgl:{},onError:(r,e)=>{},onResize:(r,e)=>{let[t,n]=r.getDevicePixelSize();P.log(1,`${r} resized => ${t}x${n}px`)()},onPositionChange:(r,e)=>{let[t,n]=r.getPosition();P.log(1,`${r} repositioned => ${t},${n}`)()},onVisibilityChange:r=>P.log(1,`${r} Visibility changed ${r.isVisible}`)(),onDevicePixelRatioChange:(r,e)=>P.log(1,`${r} DPR changed ${e.oldRatio} => ${r.devicePixelRatio}`)(),debug:dT(),debugGPUTime:!1,debugShaders:P.get("debug-shaders")||void 0,debugFramebuffers:!!P.get("debug-framebuffers"),debugFactories:!!P.get("debug-factories"),debugWebGL:!!P.get("debug-webgl"),debugSpectorJS:void 0,debugSpectorJSUrl:void 0,_reuseDevices:!1,_cacheShaders:!0,_destroyShaders:!1,_cachePipelines:!0,_sharePipelines:!0,_destroyPipelines:!1,_initializeFeatures:!0,_disabledFeatures:{"compilation-status-async-webgl":!0},_handle:void 0}});function gT(r,e){let t=r.stats,n=!1;for(let c of e)t[c]||(r.get(c),n=!0);let i=Object.keys(t).length,o=z_.get(r);if(!n&&o?.orderedStatNames===e&&o.statCount===i)return;let s={},a=$_.get(e);a||(a=new Set(e),$_.set(e,a));for(let c of e)t[c]&&(s[c]=t[c]);for(let[c,l]of Object.entries(t))a.has(c)||(s[c]=l);for(let c of Object.keys(t))delete t[c];Object.assign(t,s),z_.set(r,{orderedStatNames:e,statCount:i})}var pT,mT,z_,$_,Xf,Ha,Kf=_(()=>{eo();pT="GPU Time and Memory",mT=["Adapter","GPU","GPU Type","GPU Backend","Frame Rate","CPU Time","GPU Time","GPU Memory","Buffer Memory","Texture Memory","External Buffer Memory","External Texture Memory","Swap Chain Texture"],z_=new WeakMap,$_=new WeakMap,Xf=class{stats=new Map;getStats(e){return this.get(e)}get(e){this.stats.has(e)||this.stats.set(e,new Ye({id:e}));let t=this.stats.get(e);return e===pT&&gT(t,mT),t}},Ha=new Xf});var _T,V_,Qf,$n,W_=_(()=>{Zf();Kf();Pe();_T="set luma.log.level=1 (or higher) to trace rendering",V_="No matching device found. Ensure `@luma.gl/webgl` and/or `@luma.gl/webgpu` modules are imported.",Qf=class r{static defaultProps={...ja,type:"best-available",adapters:void 0,waitForPageLoad:!0};stats=Ha;log=P;VERSION="9.4.0";spector;preregisteredAdapters=new Map;constructor(){if(globalThis.luma){if(globalThis.luma.VERSION!==this.VERSION)throw P.error(`Found luma.gl ${globalThis.luma.VERSION} while initialzing ${this.VERSION}`)(),P.error("'yarn why @luma.gl/core' can help identify the source of the conflict")(),new Error("luma.gl - multiple versions detected: see console log");P.error("This version of luma.gl has already been initialized")()}P.log(1,`${this.VERSION} - ${_T}`)(),globalThis.luma=this}async createDevice(e={}){let t={...r.defaultProps,...e},n=this.selectAdapter(t.type,t.adapters);if(!n)throw new Error(V_);return t.waitForPageLoad&&await n.pageLoaded,await n.create(t)}async attachDevice(e,t){let n=this._getTypeFromHandle(e,t.adapters),i=n&&this.selectAdapter(n,t.adapters);if(!i)throw new Error(V_);return await i?.attach?.(e,t)}registerAdapters(e){for(let t of e)this.preregisteredAdapters.set(t.type,t)}getSupportedAdapters(e=[]){let t=this._getAdapterMap(e);return Array.from(t).map(([,n])=>n).filter(n=>n.isSupported?.()).map(n=>n.type)}getBestAvailableAdapterType(e=[]){let t=["webgpu","webgl","null"],n=this._getAdapterMap(e);for(let i of t)if(n.get(i)?.isSupported?.())return i;return null}selectAdapter(e,t=[]){let n=e;e==="best-available"&&(n=this.getBestAvailableAdapterType(t));let i=this._getAdapterMap(t);return n&&i.get(n)||null}enforceWebGL2(e=!0,t=[]){let i=this._getAdapterMap(t).get("webgl");i||P.warn("enforceWebGL2: webgl adapter not found")(),i?.enforceWebGL2?.(e)}setDefaultDeviceProps(e){Object.assign(r.defaultProps,e)}_getAdapterMap(e=[]){let t=new Map(this.preregisteredAdapters);for(let n of e)t.set(n.type,n);return t}_getTypeFromHandle(e,t=[]){return e instanceof WebGL2RenderingContext?"webgl":typeof GPUDevice<"u"&&e instanceof GPUDevice||e?.queue?"webgpu":e===null?"null":(e instanceof WebGLRenderingContext?P.warn("WebGL1 is not supported",e)():P.warn("Unknown handle type",e)(),null)}},$n=new Qf});function xT(){return Ya||(bT()||typeof window>"u"?Ya=Promise.resolve():Ya=new Promise(r=>window.addEventListener("load",()=>r()))),Ya}var mo,yT,bT,Ya,j_=_(()=>{Rr();mo=class{get pageLoaded(){return xT()}},yT=ke()&&typeof document<"u",bT=()=>yT&&document.readyState==="complete",Ya=null});function vt(r="id"){Jf[r]=Jf[r]||1;let e=Jf[r]++;return`${r}-${e}`}var Jf,Vn=_(()=>{Jf={}});function TT(r,e){let t={...e};for(let n in r)r[n]!==void 0&&(t[n]=r[n]);return t}function K_(r,e){let t=r.stats,n=!1;for(let c of e)t[c]||(r.get(c),n=!0);let i=Object.keys(t).length,o=Z_.get(r);if(!n&&o?.orderedStatNames===e&&o.statCount===i)return;let s={},a=X_.get(e);a||(a=new Set(e),X_.set(e,a));for(let c of e)t[c]&&(s[c]=t[c]);for(let[c,l]of Object.entries(t))a.has(c)||(s[c]=l);for(let c of Object.keys(t))delete t[c];Object.assign(t,s),Z_.set(r,{orderedStatNames:e,statCount:i})}function Q_(r){return r.type==="webgl"?ST:PT}function go(r){let e=r.userData[vT];return e?.enabled?e:null}function ar(){return globalThis.performance?.now?.()??Date.now()}function LT(r,e){let t=go(r);if(!(!t||!t.activeDefaultFramebufferAcquireDepth))switch(t.transientCanvasResourceCreates=(t.transientCanvasResourceCreates||0)+1,e){case"Texture":t.transientCanvasTextureCreates=(t.transientCanvasTextureCreates||0)+1;break;case"TextureView":t.transientCanvasTextureViewCreates=(t.transientCanvasTextureViewCreates||0)+1;break;case"Sampler":t.transientCanvasSamplerCreates=(t.transientCanvasSamplerCreates||0)+1;break;case"Framebuffer":t.transientCanvasFramebufferCreates=(t.transientCanvasFramebufferCreates||0)+1;break;default:break}}function AT(r){let e=Object.getPrototypeOf(r);for(;e;){let t=Object.getPrototypeOf(e);if(!t||t===O.prototype)return CT(e)||r[Symbol.toStringTag]||r.constructor.name;e=t}return r[Symbol.toStringTag]||r.constructor.name}function CT(r){let e=Object.getOwnPropertyDescriptor(r,Symbol.toStringTag);return typeof e?.get=="function"?e.get.call(r):typeof e?.value=="string"?e.value:null}var vT,H_,Y_,q_,wT,ET,PT,ST,Z_,X_,O,fe=_(()=>{Vn();vT="cpu-hotspot-profiler",H_="GPU Resource Counts",Y_="Resource Counts",q_="GPU Time and Memory",wT=["Resources","Buffers","Textures","Samplers","TextureViews","Framebuffers","QuerySets","Shaders","RenderPipelines","ComputePipelines","PipelineLayouts","VertexArrays","RenderPasss","RenderBundleEncoders","RenderBundles","ComputePasss","CommandEncoders","CommandBuffers"],ET=["Resources","Buffers","Textures","Samplers","TextureViews","Framebuffers","QuerySets","Shaders","RenderPipelines","SharedRenderPipelines","ComputePipelines","PipelineLayouts","VertexArrays","RenderPasss","RenderBundleEncoders","RenderBundles","ComputePasss","CommandEncoders","CommandBuffers"],PT=wT.flatMap(r=>[`${r} Created`,`${r} Active`]),ST=ET.flatMap(r=>[`${r} Created`,`${r} Active`]),Z_=new WeakMap,X_=new WeakMap,O=class{static defaultProps={id:"undefined",handle:void 0,_isHandleBorrowed:!1,userData:void 0};toString(){return`${this[Symbol.toStringTag]||this.constructor.name}:"${this.id}"`}toJSON(){return this.toString()}id;props;userData={};_device;destroyed=!1;allocatedBytes=0;allocatedBytesName=null;_attachedResources=new Set;get ownsHandle(){return(this.props.handle===void 0||this.props.handle===null)&&!this.isHandleBorrowed}get isHandleBorrowed(){return!!this.props._isHandleBorrowed}constructor(e,t,n){if(!e)throw new Error("no device");this._device=e,this.props=TT(t,n);let i=this.props.id!=="undefined"?this.props.id:vt(this[Symbol.toStringTag]);this.props.id=i,this.id=i,this.userData=this.props.userData||{},this.addStats()}destroy(){this.destroyed||this.destroyResource()}delete(){return this.destroy(),this}getProps(){return this.props}attachResource(e){this._attachedResources.add(e)}detachResource(e){this._attachedResources.delete(e)}destroyAttachedResource(e){this._attachedResources.delete(e)&&e.destroy()}destroyAttachedResources(){for(let e of this._attachedResources)e.destroy();this._attachedResources=new Set}destroyResource(){this.destroyed||(this.destroyAttachedResources(),this.removeStats(),this.destroyed=!0)}removeStats(){let e=go(this._device),t=e?ar():0,n=[this._device.statsManager.getStats(H_),this._device.statsManager.getStats(Y_)],i=Q_(this._device);for(let s of n)K_(s,i);let o=this.getStatsName();for(let s of n)s.get("Resources Active").decrementCount(),s.get(`${o}s Active`).decrementCount();e&&(e.statsBookkeepingCalls=(e.statsBookkeepingCalls||0)+1,e.statsBookkeepingTimeMs=(e.statsBookkeepingTimeMs||0)+(ar()-t))}trackAllocatedMemory(e,t=this.getStatsName()){let n=go(this._device),i=n?ar():0,o=this._device.statsManager.getStats(q_);this.allocatedBytes>0&&this.allocatedBytesName&&(o.get("GPU Memory").subtractCount(this.allocatedBytes),o.get(`${this.allocatedBytesName} Memory`).subtractCount(this.allocatedBytes)),o.get("GPU Memory").addCount(e),o.get(`${t} Memory`).addCount(e),n&&(n.statsBookkeepingCalls=(n.statsBookkeepingCalls||0)+1,n.statsBookkeepingTimeMs=(n.statsBookkeepingTimeMs||0)+(ar()-i)),this.allocatedBytes=e,this.allocatedBytesName=t}trackReferencedMemory(e,t=this.getStatsName()){this.trackAllocatedMemory(e,`External ${t}`)}trackDeallocatedMemory(e=this.getStatsName()){if(this.allocatedBytes===0){this.allocatedBytesName=null;return}let t=go(this._device),n=t?ar():0,i=this._device.statsManager.getStats(q_);i.get("GPU Memory").subtractCount(this.allocatedBytes),i.get(`${this.allocatedBytesName||e} Memory`).subtractCount(this.allocatedBytes),t&&(t.statsBookkeepingCalls=(t.statsBookkeepingCalls||0)+1,t.statsBookkeepingTimeMs=(t.statsBookkeepingTimeMs||0)+(ar()-n)),this.allocatedBytes=0,this.allocatedBytesName=null}trackDeallocatedReferencedMemory(e=this.getStatsName()){this.trackDeallocatedMemory(`Referenced ${e}`)}addStats(){let e=this.getStatsName(),t=go(this._device),n=t?ar():0,i=[this._device.statsManager.getStats(H_),this._device.statsManager.getStats(Y_)],o=Q_(this._device);for(let s of i)K_(s,o);for(let s of i)s.get("Resources Created").incrementCount(),s.get("Resources Active").incrementCount(),s.get(`${e}s Created`).incrementCount(),s.get(`${e}s Active`).incrementCount();t&&(t.statsBookkeepingCalls=(t.statsBookkeepingCalls||0)+1,t.statsBookkeepingTimeMs=(t.statsBookkeepingTimeMs||0)+(ar()-n)),LT(this._device,e)}getStatsName(){return AT(this)}}});var D,qa=_(()=>{fe();D=class r extends O{static INDEX=16;static VERTEX=32;static UNIFORM=64;static STORAGE=128;static INDIRECT=256;static QUERY_RESOLVE=512;static MAP_READ=1;static MAP_WRITE=2;static COPY_SRC=4;static COPY_DST=8;get[Symbol.toStringTag](){return"Buffer"}usage;indexType;updateTimestamp;constructor(e,t){let n={...t};(t.usage||0)&r.INDEX&&!t.indexType&&(t.data instanceof Uint32Array?n.indexType="uint32":t.data instanceof Uint16Array?n.indexType="uint16":t.data instanceof Uint8Array&&(n.indexType="uint8")),delete n.data,super(e,n,r.defaultProps),this.usage=n.usage||0,this.indexType=n.indexType,this.updateTimestamp=e.incrementTimestamp()}clone(e){return this.device.createBuffer({...this.props,...e})}static DEBUG_DATA_MAX_LENGTH=32;debugData=new ArrayBuffer(0);_setDebugData(e,t,n){if(!this.device.props.debug)return;let i=null,o;ArrayBuffer.isView(e)?(i=e,o=e.buffer):o=e;let s=Math.min(e?e.byteLength:n,r.DEBUG_DATA_MAX_LENGTH);if(o===null)this.debugData=new ArrayBuffer(s);else{let a=Math.min(i?.byteOffset||0,o.byteLength),c=Math.max(0,o.byteLength-a),l=Math.min(s,c);this.debugData=new Uint8Array(o,a,l).slice().buffer}}static defaultProps={...O.defaultProps,handle:void 0,usage:0,byteLength:0,byteOffset:0,data:null,indexType:"uint16",onMapped:void 0}}});function J_(){return ed??Uint16Array}function ey(r){return!!(ed&&r===ed)}var ed,ty=_(()=>{ed=globalThis.Float16Array});function ry(r){let e=r.includes("norm"),t=!e&&!r.startsWith("float"),n=r.startsWith("s"),i=td[r],[o,s,a]=i||["uint8 ","i32",1];return{signedType:o,primitiveType:s,byteLength:a,normalized:e,integer:t,signed:n}}function ny(r){let e=r;switch(e){case"uint8":return"unorm8";case"sint8":return"snorm8";case"uint16":return"unorm16";case"sint16":return"snorm16";default:return e}}function qe(r,e){switch(e){case 1:return r;case 2:return r+r%2;default:return r+(4-r%4)%4}}function Za(r){let e=ArrayBuffer.isView(r)?r.constructor:r;if(ey(e))return"float16";if(e===Uint8ClampedArray)return"uint8";let t=Object.values(td).find(n=>e===n[4]);if(!t)throw new Error(e.name);return t[0]}function iy(r){return Za(r)}function Fr(r){if(r==="float16")return J_();let e=td[r];if(!e)throw new Error(r);let[,,,,t]=e;return t}function Ur(r){return Fr(r)}var td,Xa=_(()=>{ty();td={uint8:["uint8","u32",1,!1,Uint8Array],sint8:["sint8","i32",1,!1,Int8Array],unorm8:["uint8","f32",1,!0,Uint8Array],snorm8:["sint8","f32",1,!0,Int8Array],uint16:["uint16","u32",2,!1,Uint16Array],sint16:["sint16","i32",2,!1,Int16Array],unorm16:["uint16","u32",2,!0,Uint16Array],snorm16:["sint16","i32",2,!0,Int16Array],float16:["float16","f16",2,!1,Uint16Array],float32:["float32","f32",4,!1,Float32Array],uint32:["uint32","u32",4,!1,Uint32Array],sint32:["sint32","i32",4,!1,Int32Array]}});var rd,de,Ka=_(()=>{Xa();rd=class{getDataTypeInfo(e){return ry(e)}getNormalizedDataType(e){return ny(e)}alignTo(e,t){return qe(e,t)}getDataType(e){return iy(e)}getTypedArrayConstructor(e){return Ur(e)}},de=new rd});function MT(r,e){try{return de.getDataTypeInfo(e)}catch{throw new Error(`Unsupported vertex format: ${r}`)}}function RT(r,e){if(!e)return 1;let t=Number(e);if(t===2||t===3||t===4)return t;throw new Error(`Unsupported vertex format: ${r}`)}function IT(r,e,t){if(t!==3)throw new Error(`Unsupported vertex format: ${r}`);switch(e){case"uint8":case"sint8":case"unorm8":case"snorm8":case"uint16":case"sint16":case"unorm16":case"snorm16":return`${e}x3-webgl`;default:throw new Error(`Unsupported vertex format: ${r}`)}}var nd,Z,_o=_(()=>{Ka();nd=class{getVertexFormatInfo(e){if(e==="unorm10-10-10-2")return{type:"unorm8",components:4,byteLength:4,integer:!1,signed:!1,normalized:!0};let t=e==="unorm8x4-bgra"?"unorm8x4":e,n;t.endsWith("-webgl")&&(t=t.slice(0,-6),n=!0);let i=t.split("x");if(i.length>2)throw new Error(`Unsupported vertex format: ${e}`);let[o,s]=i,a=o,c=RT(e,s),l=MT(e,a),u;try{u=n?IT(e,a,c):this.makeVertexFormat(l.signedType,c,l.normalized)}catch{throw new Error(`Unsupported vertex format: ${e}`)}if(u!==(n?e:t))throw new Error(`Unsupported vertex format: ${e}`);let f={type:a,components:c,byteLength:l.byteLength*c,integer:l.integer,signed:l.signed,normalized:l.normalized};return n&&(f.webglOnly=!0),f}makeVertexFormat(e,t,n){let i=n?de.getNormalizedDataType(e):e;switch(i){case"unorm8":return t===1?"unorm8":t===3?"unorm8x3-webgl":`${i}x${t}`;case"snorm8":return t===1?"snorm8":t===3?"snorm8x3-webgl":`${i}x${t}`;case"uint8":case"sint8":if(t===3)throw new Error(`size: ${t}`);return t===1?i:`${i}x${t}`;case"uint16":return t===1?"uint16":t===3?"uint16x3-webgl":`${i}x${t}`;case"sint16":return t===1?"sint16":t===3?"sint16x3-webgl":`${i}x${t}`;case"unorm16":return t===1?"unorm16":t===3?"unorm16x3-webgl":`${i}x${t}`;case"snorm16":return t===1?"snorm16":t===3?"snorm16x3-webgl":`${i}x${t}`;case"float16":if(t===3)throw new Error(`size: ${t}`);return t===1?i:`${i}x${t}`;default:return t===1?i:`${i}x${t}`}}getVertexFormatFromAttribute(e,t,n){if(!t||t>4)throw new Error(`size ${t}`);let i=t,o=de.getDataType(e);return this.makeVertexFormat(o,i,n)}getCompatibleVertexFormat(e){let t;switch(e.primitiveType){case"f32":t="float32";break;case"i32":t="sint32";break;case"u32":t="uint32";break;case"f16":return e.components<=2?"float16x2":"float16x4"}return e.components===1?t:`${t}x${e.components}`}},Z=new nd});function tc(r){let e=ay[r];if(!e)throw new Error(`Unsupported texture format ${r}`);return e}function sy(){return ay}var he,H,wt,OT,Qa,id,Ja,od,BT,sd,cr,ad,cd,ec,oy,DT,kT,ay,ld=_(()=>{he="texture-compression-bc",H="texture-compression-astc",wt="texture-compression-etc2",OT="texture-compression-etc1-webgl",Qa="texture-compression-pvrtc-webgl",id="texture-compression-atc-webgl",Ja="float32-renderable-webgl",od="float16-renderable-webgl",BT="rgb9e5ufloat-renderable-webgl",sd="snorm8-renderable-webgl",cr="norm16-webgl",ad="norm16-renderable-webgl",cd="snorm16-renderable-webgl",ec="float32-filterable",oy="float16-filterable-webgl";DT={r8unorm:{webgpu:527},rg8unorm:{webgpu:527},"rgb8unorm-webgl":{},rgba8unorm:{webgpu:31},"rgba8unorm-srgb":{webgpu:15},r8snorm:{render:sd,webgpu:837},rg8snorm:{render:sd,webgpu:837},"rgb8snorm-webgl":{},rgba8snorm:{render:sd,webgpu:341},r8uint:{webgpu:515},rg8uint:{webgpu:515},rgba8uint:{webgpu:19},r8sint:{webgpu:515},rg8sint:{webgpu:515},rgba8sint:{webgpu:19},bgra8unorm:{webgpu:15},"bgra8unorm-srgb":{webgpu:15360},r16unorm:{f:cr,render:ad,webgpu:992},rg16unorm:{f:cr,render:ad,webgpu:992},"rgb16unorm-webgl":{f:cr,render:!1},rgba16unorm:{f:cr,render:ad,webgpu:992},r16snorm:{f:cr,render:cd,webgpu:992},rg16snorm:{f:cr,render:cd,webgpu:992},"rgb16snorm-webgl":{f:cr,render:!1},rgba16snorm:{f:cr,render:cd,webgpu:992},r16uint:{webgpu:515},rg16uint:{webgpu:515},rgba16uint:{webgpu:19},r16sint:{webgpu:515},rg16sint:{webgpu:515},rgba16sint:{webgpu:19},r16float:{render:od,filter:"float16-filterable-webgl",webgpu:527},rg16float:{render:od,filter:oy,webgpu:527},rgba16float:{render:od,filter:oy,webgpu:31},r32uint:{webgpu:19},rg32uint:{webgpu:16387},rgba32uint:{webgpu:19},r32sint:{webgpu:19},rg32sint:{webgpu:16387},rgba32sint:{webgpu:19},r32float:{render:Ja,filter:ec,webgpu:19},rg32float:{render:!1,filter:ec,webgpu:16387},"rgb32float-webgl":{render:Ja,filter:ec},rgba32float:{render:Ja,filter:ec,webgpu:19},"rgba4unorm-webgl":{channels:"rgba",bitsPerChannel:[4,4,4,4],packed:!0},"rgb565unorm-webgl":{channels:"rgb",bitsPerChannel:[5,6,5,0],packed:!0},"rgb5a1unorm-webgl":{channels:"rgba",bitsPerChannel:[5,5,5,1],packed:!0},rgb9e5ufloat:{channels:"rgb",packed:!0,render:BT,webgpu:5},rg11b10ufloat:{channels:"rgb",bitsPerChannel:[11,11,10,0],packed:!0,p:1,render:Ja,webgpu:517},rgb10a2unorm:{channels:"rgba",bitsPerChannel:[10,10,10,2],packed:!0,p:1,webgpu:527},rgb10a2uint:{channels:"rgba",bitsPerChannel:[10,10,10,2],packed:!0,p:1,webgpu:515},stencil8:{attachment:"stencil",bitsPerChannel:[8,0,0,0],dataType:"uint8",webgpu:3},depth16unorm:{attachment:"depth",bitsPerChannel:[16,0,0,0],dataType:"uint16",webgpu:3},depth24plus:{attachment:"depth",bitsPerChannel:[24,0,0,0],dataType:"uint32",webgpu:3},depth32float:{attachment:"depth",bitsPerChannel:[32,0,0,0],dataType:"float32",webgpu:3},"depth24plus-stencil8":{attachment:"depth-stencil",bitsPerChannel:[24,8,0,0],packed:!0,webgpu:3},"depth32float-stencil8":{attachment:"depth-stencil",bitsPerChannel:[32,8,0,0],packed:!0,f:"depth32float-stencil8",webgpu:3}},kT={"bc1-rgb-unorm-webgl":{f:he},"bc1-rgb-unorm-srgb-webgl":{f:he},"bc1-rgba-unorm":{f:he},"bc1-rgba-unorm-srgb":{f:he},"bc2-rgba-unorm":{f:he},"bc2-rgba-unorm-srgb":{f:he},"bc3-rgba-unorm":{f:he},"bc3-rgba-unorm-srgb":{f:he},"bc4-r-unorm":{f:he},"bc4-r-snorm":{f:he},"bc5-rg-unorm":{f:he},"bc5-rg-snorm":{f:he},"bc6h-rgb-ufloat":{f:he},"bc6h-rgb-float":{f:he},"bc7-rgba-unorm":{f:he},"bc7-rgba-unorm-srgb":{f:he},"etc2-rgb8unorm":{f:wt},"etc2-rgb8unorm-srgb":{f:wt},"etc2-rgb8a1unorm":{f:wt},"etc2-rgb8a1unorm-srgb":{f:wt},"etc2-rgba8unorm":{f:wt},"etc2-rgba8unorm-srgb":{f:wt},"eac-r11unorm":{f:wt},"eac-r11snorm":{f:wt},"eac-rg11unorm":{f:wt},"eac-rg11snorm":{f:wt},"astc-4x4-unorm":{f:H},"astc-4x4-unorm-srgb":{f:H},"astc-5x4-unorm":{f:H},"astc-5x4-unorm-srgb":{f:H},"astc-5x5-unorm":{f:H},"astc-5x5-unorm-srgb":{f:H},"astc-6x5-unorm":{f:H},"astc-6x5-unorm-srgb":{f:H},"astc-6x6-unorm":{f:H},"astc-6x6-unorm-srgb":{f:H},"astc-8x5-unorm":{f:H},"astc-8x5-unorm-srgb":{f:H},"astc-8x6-unorm":{f:H},"astc-8x6-unorm-srgb":{f:H},"astc-8x8-unorm":{f:H},"astc-8x8-unorm-srgb":{f:H},"astc-10x5-unorm":{f:H},"astc-10x5-unorm-srgb":{f:H},"astc-10x6-unorm":{f:H},"astc-10x6-unorm-srgb":{f:H},"astc-10x8-unorm":{f:H},"astc-10x8-unorm-srgb":{f:H},"astc-10x10-unorm":{f:H},"astc-10x10-unorm-srgb":{f:H},"astc-12x10-unorm":{f:H},"astc-12x10-unorm-srgb":{f:H},"astc-12x12-unorm":{f:H},"astc-12x12-unorm-srgb":{f:H},"pvrtc-rgb4unorm-webgl":{f:Qa},"pvrtc-rgba4unorm-webgl":{f:Qa},"pvrtc-rgb2unorm-webgl":{f:Qa},"pvrtc-rgba2unorm-webgl":{f:Qa},"etc1-rbg-unorm-webgl":{f:OT},"atc-rgb-unorm-webgl":{f:id},"atc-rgba-unorm-webgl":{f:id},"atc-rgbai-unorm-webgl":{f:id}},ay={...DT,...kT}});function $T({format:r,width:e,height:t,depth:n,byteAlignment:i}){let o=Se.getInfo(r),{bytesPerPixel:s,bytesPerBlock:a=s,blockWidth:c=1,blockHeight:l=1,compressed:u=!1}=o,f=u?Math.ceil(e/c):e,d=u?Math.ceil(t/l):t,h=f*a,p=Math.ceil(h/i)*i,m=d,g=p*m*n;return{bytesPerPixel:s,bytesPerRow:p,rowsPerImage:m,depthOrArrayLayers:n,bytesPerImage:p*m,byteLength:g}}function VT(r){let e=tc(r),t={format:r,create:e.f??!0,render:e.render??!0,filter:e.filter??!0,blend:e.blend??!0,store:e.store??!0},n=cy(r),i=r.startsWith("depth")||r.startsWith("stencil"),o=n?.signed,s=n?.integer,a=n?.webgl,c=!!n?.compressed;return t.render&&=!i&&!c,t.filter&&=!i&&!o&&!s&&!a,t}function cy(r){let e=WT(r);if(Se.isCompressed(r)){e.channels="rgb",e.components=3,e.bytesPerPixel=1,e.srgb=!1,e.compressed=!0,e.bytesPerBlock=HT(r);let n=jT(r);n&&(e.blockWidth=n.blockWidth,e.blockHeight=n.blockHeight)}let t=e.packed?null:NT.exec(r);if(t){let[,n,i,o,s,a]=t,c=`${o}${i}`,l=de.getDataTypeInfo(c),u=l.byteLength*8,f=n?.length??1,d=[u,f>=2?u:0,f>=3?u:0,f>=4?u:0];e={format:r,attachment:e.attachment,dataType:l.signedType,components:f,channels:n,integer:l.integer,signed:l.signed,normalized:l.normalized,bitsPerChannel:d,bytesPerPixel:l.byteLength*f,packed:e.packed,srgb:e.srgb},a==="-webgl"&&(e.webgl=!0),s==="-srgb"&&(e.srgb=!0)}return r.endsWith("-webgl")&&(e.webgl=!0),r.endsWith("-srgb")&&(e.srgb=!0),e}function WT(r){let e={...tc(r)},t=e.bytesPerPixel||1,n=e.bitsPerChannel||[8,8,8,8];return delete e.bitsPerChannel,delete e.bytesPerPixel,delete e.f,delete e.render,delete e.filter,delete e.blend,delete e.store,delete e.webgpu,{...e,format:r,attachment:e.attachment||"color",channels:e.channels||"r",components:e.components||e.channels?.length||1,bytesPerPixel:t,bitsPerChannel:n,dataType:e.dataType||"uint8",srgb:e.srgb??!1,packed:e.packed??!1,webgl:e.webgl??!1,integer:e.integer??!1,signed:e.signed??!1,normalized:e.normalized??!1,compressed:e.compressed??!1}}function jT(r){let t=/.*-(\d+)x(\d+)-.*/.exec(r);if(t){let[,n,i]=t;return{blockWidth:Number(n),blockHeight:Number(i)}}return r.startsWith("bc")||r.startsWith("etc1")||r.startsWith("etc2")||r.startsWith("eac")||r.startsWith("atc")?{blockWidth:4,blockHeight:4}:r.startsWith("pvrtc-rgb4")||r.startsWith("pvrtc-rgba4")?{blockWidth:4,blockHeight:4}:r.startsWith("pvrtc-rgb2")||r.startsWith("pvrtc-rgba2")?{blockWidth:8,blockHeight:4}:null}function HT(r){return r.startsWith("bc1")||r.startsWith("bc4")||r.startsWith("etc1")||r.startsWith("etc2-rgb8")||r.startsWith("etc2-rgb8a1")||r.startsWith("eac-r11")||r==="atc-rgb-unorm-webgl"?8:r.startsWith("bc2")||r.startsWith("bc3")||r.startsWith("bc5")||r.startsWith("bc6h")||r.startsWith("bc7")||r.startsWith("etc2-rgba8")||r.startsWith("eac-rg11")||r.startsWith("astc")||r==="atc-rgba-unorm-webgl"||r==="atc-rgbai-unorm-webgl"?16:r.startsWith("pvrtc")?8:16}var NT,FT,UT,GT,zT,ud,Se,rc=_(()=>{Ka();ld();NT=/^(r|rg|rgb|rgba|bgra)([0-9]*)([a-z]*)(-srgb)?(-webgl)?$/,FT=["rgb","rgba","bgra"],UT=["depth","stencil"],GT=5,zT=["bc1","bc2","bc3","bc4","bc5","bc6","bc7","etc1","etc2","eac","atc","astc","pvrtc"],ud=class{isColor(e){return FT.some(t=>e.startsWith(t))}isDepthStencil(e){return UT.some(t=>e.startsWith(t))}isCompressed(e){return zT.some(t=>e.startsWith(t))}getInfo(e){return cy(e)}getCapabilities(e){return VT(e)}getWebGPUCapabilities(e){let t=tc(e);return t.webgpu!==void 0?t.webgpu:this.isCompressed(e)&&!e.endsWith("-webgl")?GT:0}computeMemoryLayout(e){return $T(e)}},Se=new ud});function ly(r){return typeof ImageData<"u"&&r instanceof ImageData||typeof ImageBitmap<"u"&&r instanceof ImageBitmap||typeof HTMLImageElement<"u"&&r instanceof HTMLImageElement||typeof HTMLVideoElement<"u"&&r instanceof HTMLVideoElement||typeof VideoFrame<"u"&&r instanceof VideoFrame||typeof HTMLCanvasElement<"u"&&r instanceof HTMLCanvasElement||typeof OffscreenCanvas<"u"&&r instanceof OffscreenCanvas}function uy(r){if(typeof ImageData<"u"&&r instanceof ImageData||typeof ImageBitmap<"u"&&r instanceof ImageBitmap||typeof HTMLCanvasElement<"u"&&r instanceof HTMLCanvasElement||typeof OffscreenCanvas<"u"&&r instanceof OffscreenCanvas)return{width:r.width,height:r.height};if(typeof HTMLImageElement<"u"&&r instanceof HTMLImageElement)return{width:r.naturalWidth,height:r.naturalHeight};if(typeof HTMLVideoElement<"u"&&r instanceof HTMLVideoElement)return{width:r.videoWidth,height:r.videoHeight};if(typeof VideoFrame<"u"&&r instanceof VideoFrame)return{width:r.displayWidth,height:r.displayHeight};throw new Error("Unknown image type")}var fy=_(()=>{});function YT(r,e){let t=fd(r),n=e.map(fd).filter(i=>i!==void 0);return[t,...n].filter(i=>i!==void 0)}function fd(r){if(r!==void 0){if(r===null||typeof r=="string"||typeof r=="number"||typeof r=="boolean")return r;if(r instanceof Error)return r.message;if(Array.isArray(r))return r.map(fd);if(typeof r=="object"){if(qT(r)){let e=String(r);if(e!=="[object Object]")return e}return ZT(r)?XT(r):r.constructor?.name||"Object"}return String(r)}}function qT(r){return"toString"in r&&typeof r.toString=="function"&&r.toString!==Object.prototype.toString}function ZT(r){return"message"in r&&"type"in r}function XT(r){let e=typeof r.type=="string"?r.type:"message",t=typeof r.message=="string"?r.message:"",n=typeof r.lineNum=="number"?r.lineNum:null,i=typeof r.linePos=="number"?r.linePos:null,o=n!==null&&i!==null?` @ ${n}:${i}`:n!==null?` @ ${n}`:"";return`${e}${o}: ${t}`.trim()}function dd(){if(typeof HTMLCanvasElement>"u")return!1;let r=HTMLCanvasElement.prototype;return"layoutSubtree"in r&&typeof r.requestPaint=="function"}var yo,bo,Vt,dy=_(()=>{Kf();Pe();Vn();qa();_o();rc();fy();ld();Zf();yo=class{};bo=class{features;disabledFeatures;constructor(e=[],t){this.features=new Set(e),this.disabledFeatures=t||{}}*[Symbol.iterator](){yield*this.features}has(e){return!this.disabledFeatures?.[e]&&this.features.has(e)}};Vt=class r{static defaultProps={...ja};get[Symbol.toStringTag](){return"Device"}toString(){return`Device(${this.id})`}toJSON(){return this.toString()}id;props;userData={};statsManager=Ha;_factories={};timestamp=0;_reused=!1;_moduleData={};wgslLanguageFeatures=new Set;_textureCaps={};_debugGPUTimeQuery=null;constructor(e){this.props={...r.defaultProps,...e},this.id=this.props.id||vt(this[Symbol.toStringTag].toLowerCase())}getVertexFormatInfo(e){return Z.getVertexFormatInfo(e)}isVertexFormatSupported(e){return!0}getTextureFormatInfo(e){return Se.getInfo(e)}getTextureFormatCapabilities(e){let t=this._textureCaps[e];if(!t){let n=this._getDeviceTextureFormatCapabilities(e);t=this._getDeviceSpecificTextureFormatCapabilities(n),this._textureCaps[e]=t}return t}getMipLevelCount(e,t,n=1){let i=Math.max(e,t,n);return 1+Math.floor(Math.log2(i))}isExternalImage(e){return ly(e)}getExternalImageSize(e){return uy(e)}isTextureFormatSupported(e){return this.getTextureFormatCapabilities(e).create}isTextureFormatFilterable(e){return this.getTextureFormatCapabilities(e).filter}isTextureFormatRenderable(e){return this.getTextureFormatCapabilities(e).render}isTextureFormatCompressed(e){return Se.isCompressed(e)}getSupportedCompressedTextureFormats(){let e=[];for(let t of Object.keys(sy()))this.isTextureFormatCompressed(t)&&this.isTextureFormatSupported(t)&&e.push(t);return e}pushDebugGroup(e){this.commandEncoder.pushDebugGroup(e)}popDebugGroup(){this.commandEncoder?.popDebugGroup()}insertDebugMarker(e){this.commandEncoder?.insertDebugMarker(e)}loseDevice(){return!1}incrementTimestamp(){return this.timestamp++}reportError(e,t,...n){if(!this.props.onError(e,t)){let o=YT(t,n);return P.error(this.type==="webgl"?"%cWebGL":"%cWebGPU","color: white; background: red; padding: 2px 6px; border-radius: 3px;",e.message,...o)}return()=>{}}debug(){if(this.props.debug)debugger;else P.once(0,`'Type luma.log.set({debug: true}) in console to enable debug breakpoints',
or create a device with the 'debug: true' prop.`)()}getDefaultCanvasContext(){if(!this.canvasContext)throw new Error("Device has no default CanvasContext. See props.createCanvasContext");return this.canvasContext}createFence(){throw new Error("createFence() not implemented")}beginRenderPass(e){return this.commandEncoder.beginRenderPass(e)}beginComputePass(e){return this.commandEncoder.beginComputePass(e)}writeBufferViaCommandEncoder(e,t,n,i=0){throw new Error("writeBufferViaCommandEncoder() not implemented")}generateMipmapsWebGPU(e){throw new Error("not implemented")}_createSharedRenderPipelineWebGL(e){throw new Error("_createSharedRenderPipelineWebGL() not implemented")}_createBindGroupLayoutWebGPU(e,t){throw new Error("_createBindGroupLayoutWebGPU() not implemented")}_createBindGroupWebGPU(e,t,n,i,o){throw new Error("_createBindGroupWebGPU() not implemented")}_supportsDebugGPUTime(){return this.features.has("timestamp-query")&&!!(this.props.debug||this.props.debugGPUTime)}_enableDebugGPUTime(e=256){if(!this._supportsDebugGPUTime())return null;if(this._debugGPUTimeQuery)return this._debugGPUTimeQuery;try{this._debugGPUTimeQuery=this.createQuerySet({type:"timestamp",count:e}),this.commandEncoder=this.createCommandEncoder({id:this.commandEncoder.props.id,timeProfilingQuerySet:this._debugGPUTimeQuery})}catch{this._debugGPUTimeQuery=null}return this._debugGPUTimeQuery}_disableDebugGPUTime(){this._debugGPUTimeQuery&&(this.commandEncoder.getTimeProfilingQuerySet()===this._debugGPUTimeQuery&&(this.commandEncoder=this.createCommandEncoder({id:this.commandEncoder.props.id})),this._debugGPUTimeQuery.destroy(),this._debugGPUTimeQuery=null)}_isDebugGPUTimeEnabled(){return this._debugGPUTimeQuery!==null}getCanvasContext(){return this.getDefaultCanvasContext()}readPixelsToArrayWebGL(e,t){throw new Error("not implemented")}readPixelsToBufferWebGL(e,t){throw new Error("not implemented")}setParametersWebGL(e){throw new Error("not implemented")}getParametersWebGL(e){throw new Error("not implemented")}withParametersWebGL(e,t){throw new Error("not implemented")}clearWebGL(e){throw new Error("not implemented")}resetWebGL(){throw new Error("not implemented")}getModuleData(e){return this._moduleData[e]||={},this._moduleData[e]}static _getCanvasContextProps(e){return e.createCanvasContext===!0?{}:e.createCanvasContext}_getDeviceTextureFormatCapabilities(e){let t=Se.getCapabilities(e),n=o=>(typeof o=="string"?this.features.has(o):o)??!0,i=n(t.create);return{format:e,create:i,render:i&&n(t.render),filter:i&&n(t.filter),blend:i&&n(t.blend),store:i&&n(t.store)}}_normalizeBufferProps(e){(e instanceof ArrayBuffer||ArrayBuffer.isView(e))&&(e={data:e});let t={...e};if((e.usage||0)&D.INDEX&&(e.indexType||(e.data instanceof Uint32Array?t.indexType="uint32":e.data instanceof Uint16Array?t.indexType="uint16":e.data instanceof Uint8Array&&(t.data=new Uint16Array(e.data),t.indexType="uint16")),!t.indexType))throw new Error("indices buffer content must be of type uint16 or uint32");return t}}});var nc,hy=_(()=>{nc=class{props;_resizeObserver;_intersectionObserver;_observeDevicePixelRatioTimeout=null;_observeDevicePixelRatioMediaQuery=null;_handleDevicePixelRatioChange=()=>this._refreshDevicePixelRatio();_trackPositionInterval=null;_started=!1;get started(){return this._started}constructor(e){this.props=e}start(){if(this._started||!this.props.canvas)return;this._started=!0,this._intersectionObserver||=new IntersectionObserver(t=>this.props.onIntersection(t)),this._resizeObserver||=new ResizeObserver(t=>this.props.onResize(t)),this._intersectionObserver.observe(this.props.canvas);let e=this.props.resizeObserverBox;try{this._resizeObserver.observe(this.props.canvas,{box:e})}catch{this._resizeObserver.observe(this.props.canvas,{box:"content-box"})}this._observeDevicePixelRatioTimeout=setTimeout(()=>this._refreshDevicePixelRatio(),0),this.props.trackPosition&&this._trackPosition()}stop(){this._started&&(this._started=!1,this._observeDevicePixelRatioTimeout&&(clearTimeout(this._observeDevicePixelRatioTimeout),this._observeDevicePixelRatioTimeout=null),this._observeDevicePixelRatioMediaQuery&&(this._observeDevicePixelRatioMediaQuery.removeEventListener("change",this._handleDevicePixelRatioChange),this._observeDevicePixelRatioMediaQuery=null),this._trackPositionInterval&&(clearInterval(this._trackPositionInterval),this._trackPositionInterval=null),this._resizeObserver?.disconnect(),this._intersectionObserver?.disconnect())}_refreshDevicePixelRatio(){this._started&&(this.props.onDevicePixelRatioChange(),this._observeDevicePixelRatioMediaQuery?.removeEventListener("change",this._handleDevicePixelRatioChange),this._observeDevicePixelRatioMediaQuery=matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`),this._observeDevicePixelRatioMediaQuery.addEventListener("change",this._handleDevicePixelRatioChange,{once:!0}))}_trackPosition(e=100){this._trackPositionInterval||(this._trackPositionInterval=setInterval(()=>{this._started?this.props.onPositionChange():this._trackPositionInterval&&(clearInterval(this._trackPositionInterval),this._trackPositionInterval=null)},e))}}});function py(){let r,e;return{promise:new Promise((n,i)=>{r=n,e=i}),resolve:r,reject:e}}var my=_(()=>{});function lr(r,e){if(!r){let t=new Error(e??"luma.gl assertion failed.");throw Error.captureStackTrace?.(t,lr),t}}function ur(r,e){return lr(r,e),r}var hd=_(()=>{});function KT(r){if(typeof r=="string"){let e=document.getElementById(r);if(!e)throw new Error(`${r} is not an HTML element`);return e}return r||document.body}function QT(r){let e=document.getElementById(r);if(!fr.isHTMLCanvas(e))throw new Error("Object is not a canvas element");return e}function JT(r){let{width:e,height:t}=r,n=document.createElement("canvas");n.id=vt("lumagl-auto-created-canvas"),n.width=e||1,n.height=t||1,n.style.width=Number.isFinite(e)?`${e}px`:"100%",n.style.height=Number.isFinite(t)?`${t}px`:"100%",r?.visible||(n.style.visibility="hidden");let i=KT(r?.container||null);return i.insertBefore(n,i.firstChild),n}function e3(r,e,t,n,i){let o=r,s=gy(o[0],e,t),a=_y(o[1],e,n,i),c=gy(o[0]+1,e,t),l=c===t-1?c:c-1;c=_y(o[1]+1,e,n,i);let u;return i?(c=c===0?c:c+1,u=a,a=c):u=c===n-1?c:c-1,{x:s,y:a,width:Math.max(l-s+1,1),height:Math.max(u-a+1,1)}}function gy(r,e,t){return Math.min(Math.round(r*e),t-1)}function _y(r,e,t,n){return n?Math.max(0,t-1-Math.round(r*e)):Math.min(Math.round(r*e),t-1)}var fr,pd=_(()=>{Rr();hy();Vn();my();hd();fr=class r{static isHTMLCanvas(e){return typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement}static isOffscreenCanvas(e){return typeof OffscreenCanvas<"u"&&e instanceof OffscreenCanvas}static defaultProps={id:void 0,canvas:null,width:800,height:600,useDevicePixels:!0,pixelSizeSource:"exact",autoResize:!0,container:null,visible:!0,alphaMode:"opaque",colorSpace:"srgb",colorFormat:void 0,toneMapping:"standard",trackPosition:!1};id;props;canvas;htmlCanvas;offscreenCanvas;type;initialized;isInitialized=!1;isVisible=!0;cssWidth;cssHeight;devicePixelRatio;devicePixelWidth;devicePixelHeight;drawingBufferWidth;drawingBufferHeight;_initializedResolvers=py();_canvasObserver;_position=[0,0];destroyed=!1;_needsDrawingBufferResize=!0;toString(){return`${this[Symbol.toStringTag]}(${this.id})`}constructor(e){this.props={...r.defaultProps,...e},e=this.props,this.initialized=this._initializedResolvers.promise,ke()?e.canvas?typeof e.canvas=="string"?this.canvas=QT(e.canvas):this.canvas=e.canvas:this.canvas=JT(e):this.canvas={width:e.width||1,height:e.height||1},r.isHTMLCanvas(this.canvas)?(this.id=e.id||this.canvas.id,this.type="html-canvas",this.htmlCanvas=this.canvas):r.isOffscreenCanvas(this.canvas)?(this.id=e.id||"offscreen-canvas",this.type="offscreen-canvas",this.offscreenCanvas=this.canvas):(this.id=e.id||"node-canvas-context",this.type="node"),this.cssWidth=this.htmlCanvas?.clientWidth||this.canvas.width,this.cssHeight=this.htmlCanvas?.clientHeight||this.canvas.height,this.devicePixelWidth=this.canvas.width,this.devicePixelHeight=this.canvas.height,this.drawingBufferWidth=this.canvas.width,this.drawingBufferHeight=this.canvas.height,this.devicePixelRatio=globalThis.devicePixelRatio||1,this._position=[0,0],this._canvasObserver=new nc({canvas:this.htmlCanvas,trackPosition:this.props.trackPosition,resizeObserverBox:this.props.pixelSizeSource==="css-dpr"?"content-box":"device-pixel-content-box",onResize:t=>this._handleResize(t),onIntersection:t=>this._handleIntersection(t),onDevicePixelRatioChange:()=>this._observeDevicePixelRatio(),onPositionChange:()=>this.updatePosition()})}destroy(){this.destroyed||(this.destroyed=!0,this._stopObservers(),this.device=null)}setProps(e){return"useDevicePixels"in e&&(this.props.useDevicePixels=e.useDevicePixels||!1,this._updateDrawingBufferSize()),this}getCurrentFramebuffer(e){return this._resizeDrawingBufferIfNeeded(),this._getCurrentFramebuffer(e)}getCSSSize(){return[this.cssWidth,this.cssHeight]}getPosition(){return this._position}getDevicePixelSize(){return[this.devicePixelWidth,this.devicePixelHeight]}getDrawingBufferSize(){return[this.drawingBufferWidth,this.drawingBufferHeight]}getMaxDrawingBufferSize(){let e=this.device.limits.maxTextureDimension2D;return[e,e]}setDrawingBufferSize(e,t){e=Math.floor(e),t=Math.floor(t),!(this.drawingBufferWidth===e&&this.drawingBufferHeight===t)&&(this.drawingBufferWidth=e,this.drawingBufferHeight=t,this._needsDrawingBufferResize=!0)}getDevicePixelRatio(){return typeof window<"u"&&window.devicePixelRatio||1}cssToDevicePixels(e,t=!0){let n=this.cssToDeviceRatio(),[i,o]=this.getDrawingBufferSize();return e3(e,n,i,o,t)}getPixelSize(){return this.getDevicePixelSize()}getAspect(){let[e,t]=this.getDrawingBufferSize();return e>0&&t>0?e/t:1}cssToDeviceRatio(){try{let[e]=this.getDrawingBufferSize(),[t]=this.getCSSSize();return t?e/t:1}catch{return 1}}resize(e){this.setDrawingBufferSize(e.width,e.height)}_setAutoCreatedCanvasId(e){this.htmlCanvas?.id==="lumagl-auto-created-canvas"&&(this.htmlCanvas.id=e)}_startObservers(){this.destroyed||this._canvasObserver.start()}_stopObservers(){this._canvasObserver.stop()}_handleIntersection(e){if(this.destroyed)return;let t=e.find(i=>i.target===this.canvas);if(!t)return;let n=t.isIntersecting;this.isVisible!==n&&(this.isVisible=n,this.device.props.onVisibilityChange(this))}_handleResize(e){if(this.destroyed)return;let t=e.find(o=>o.target===this.canvas);if(!t)return;let n=ur(t.contentBoxSize?.[0]);this.cssWidth=n.inlineSize,this.cssHeight=n.blockSize;let i=this.getDevicePixelSize();this._setDevicePixelSize(this._getDevicePixelSizeFromResizeEntry(t)),this._updateDrawingBufferSize(),this.device.props.onResize(this,{oldPixelSize:i})}_updateDrawingBufferSize(){if(this.props.autoResize)if(typeof this.props.useDevicePixels=="number"){let e=this.props.useDevicePixels;this.setDrawingBufferSize(this.cssWidth*e,this.cssHeight*e)}else this.props.useDevicePixels?this.setDrawingBufferSize(this.devicePixelWidth,this.devicePixelHeight):this.setDrawingBufferSize(this.cssWidth,this.cssHeight);this._initializedResolvers.resolve(),this.isInitialized=!0,this.updatePosition()}_getDevicePixelSizeFromResizeEntry(e){let t=ur(e.contentBoxSize?.[0]);return this.props.pixelSizeSource==="css-dpr"?this._getDevicePixelSizeFromCSSSize(t.inlineSize,t.blockSize):{devicePixelWidth:e.devicePixelContentBoxSize?.[0]?.inlineSize||t.inlineSize*devicePixelRatio,devicePixelHeight:e.devicePixelContentBoxSize?.[0]?.blockSize||t.blockSize*devicePixelRatio}}_getDevicePixelSizeFromCSSSize(e,t){let n=this.getDevicePixelRatio();return{devicePixelWidth:Math.floor(e*n),devicePixelHeight:Math.floor(t*n)}}_setDevicePixelSize({devicePixelWidth:e,devicePixelHeight:t}){let[n,i]=this.getMaxDrawingBufferSize();this.devicePixelWidth=Math.max(1,Math.min(e,n)),this.devicePixelHeight=Math.max(1,Math.min(t,i))}_resizeDrawingBufferIfNeeded(){this._needsDrawingBufferResize&&(this._needsDrawingBufferResize=!1,(this.drawingBufferWidth!==this.canvas.width||this.drawingBufferHeight!==this.canvas.height)&&(this.canvas.width=this.drawingBufferWidth,this.canvas.height=this.drawingBufferHeight,this._configureDevice()))}_observeDevicePixelRatio(){if(this.destroyed||!this._canvasObserver.started)return;let e=this.devicePixelRatio;if(this.devicePixelRatio=window.devicePixelRatio,this.props.pixelSizeSource==="css-dpr"){let t=this.getDevicePixelSize();this._setDevicePixelSize(this._getDevicePixelSizeFromCSSSize(this.cssWidth,this.cssHeight)),this._updateDrawingBufferSize(),this.device.props.onResize(this,{oldPixelSize:t})}this.updatePosition(),this.device.props.onDevicePixelRatioChange?.(this,{oldRatio:e})}updatePosition(){if(this.destroyed)return;let e=this.htmlCanvas?.getBoundingClientRect();if(e){let t=[e.left,e.top];if(this._position??=t,t[0]!==this._position[0]||t[1]!==this._position[1]){let i=this._position;this._position=t,this.device.props.onPositionChange?.(this,{oldPosition:i})}}}}});var xo,yy=_(()=>{pd();xo=class extends fr{static defaultProps=fr.defaultProps}});var vo,by=_(()=>{pd();vo=class extends fr{}});var Gr,md=_(()=>{fe();Gr=class r extends O{static defaultProps={...O.defaultProps,type:"color-sampler",addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge",addressModeW:"clamp-to-edge",magFilter:"nearest",minFilter:"nearest",mipmapFilter:"none",lodMinClamp:0,lodMaxClamp:32,compare:"less-equal",maxAnisotropy:1};get[Symbol.toStringTag](){return"Sampler"}constructor(e,t){t=r.normalizeProps(e,t),super(e,t,r.defaultProps)}static normalizeProps(e,t){return t}}});var t3,z,gd=_(()=>{fe();md();Pe();rc();t3={"1d":"1d","2d":"2d","2d-array":"2d",cube:"2d","cube-array":"2d","3d":"3d"},z=class r extends O{static SAMPLE=4;static STORAGE=8;static RENDER=16;static COPY_SRC=1;static COPY_DST=2;static TEXTURE=4;static RENDER_ATTACHMENT=16;dimension;baseDimension;format;width;height;depth;mipLevels;samples;byteAlignment;ready=Promise.resolve(this);isReady=!0;updateTimestamp;get[Symbol.toStringTag](){return"Texture"}toString(){return`Texture(${this.id},${this.format},${this.width}x${this.height})`}constructor(e,t,n){if(t=r.normalizeProps(e,t),super(e,t,r.defaultProps),this.dimension=this.props.dimension,this.baseDimension=t3[this.dimension],this.format=this.props.format,this.width=this.props.width,this.height=this.props.height,this.depth=this.props.depth,this.mipLevels=this.props.mipLevels,this.samples=this.props.samples||1,this.dimension==="cube"&&(this.depth=6),this.props.width===void 0||this.props.height===void 0)if(e.isExternalImage(t.data)){let i=e.getExternalImageSize(t.data);this.width=i?.width||1,this.height=i?.height||1}else this.width=1,this.height=1,(this.props.width===void 0||this.props.height===void 0)&&P.warn(`${this} created with undefined width or height. This is deprecated. Use DynamicTexture instead.`)();this.byteAlignment=n?.byteAlignment||1,this.updateTimestamp=e.incrementTimestamp()}clone(e){return this.device.createTexture({...this.props,...e})}setSampler(e){this.sampler=e instanceof Gr?e:this.device.createSampler(e)}copyImageData(e){let{data:t,depth:n,...i}=e;this.writeData(t,{...i,depthOrArrayLayers:i.depthOrArrayLayers??n})}computeMemoryLayout(e={}){let t=this._normalizeTextureReadOptions(e),{width:n=this.width,height:i=this.height,depthOrArrayLayers:o=this.depth}=t,{format:s,byteAlignment:a}=this;return Se.computeMemoryLayout({format:s,width:n,height:i,depth:o,byteAlignment:a})}readBuffer(e,t){throw new Error("readBuffer not implemented")}readDataAsync(e){throw new Error("readBuffer not implemented")}writeBuffer(e,t){throw new Error("readBuffer not implemented")}writeData(e,t){throw new Error("readBuffer not implemented")}readDataSyncWebGL(e){throw new Error("readDataSyncWebGL not available")}generateMipmapsWebGL(){throw new Error("generateMipmapsWebGL not available")}static normalizeProps(e,t){let n={...t},{width:i,height:o}=n;return typeof i=="number"&&(n.width=Math.max(1,Math.ceil(i))),typeof o=="number"&&(n.height=Math.max(1,Math.ceil(o))),n}_initializeData(e){this.device.isExternalImage(e)?this.copyExternalImage({image:e,width:this.width,height:this.height,depth:this.depth,mipLevel:0,x:0,y:0,z:0,aspect:"all",colorSpace:"srgb",premultipliedAlpha:!1,flipY:!1}):e&&this.copyImageData({data:e,mipLevel:0,x:0,y:0,z:0,aspect:"all"})}_normalizeCopyImageDataOptions(e){let{data:t,depth:n,...i}=e,o=this._normalizeTextureWriteOptions({...i,depthOrArrayLayers:i.depthOrArrayLayers??n});return{data:t,depth:o.depthOrArrayLayers,...o}}_normalizeCopyExternalImageOptions(e){let t=r._omitUndefined(e),n=t.mipLevel??0,i=this._getMipLevelSize(n),o=this.device.getExternalImageSize(e.image),s={...r.defaultCopyExternalImageOptions,...i,...o,...t};return s.width=Math.min(s.width,i.width-s.x),s.height=Math.min(s.height,i.height-s.y),s.depth=Math.min(s.depth,i.depthOrArrayLayers-s.z),s}_normalizeCopyElementImageOptions(e){let t=r._omitUndefined(e),n=t.mipLevel??0,i=this._getMipLevelSize(n),o={...r.defaultCopyElementImageOptions,...i,...t};return o.width=Math.min(o.width,i.width-o.x),o.height=Math.min(o.height,i.height-o.y),o.depth=Math.min(o.depth,i.depthOrArrayLayers-o.z),o}_normalizeTextureReadOptions(e){let t=r._omitUndefined(e),n=t.mipLevel??0,i=this._getMipLevelSize(n),o={...r.defaultTextureReadOptions,...i,...t};return o.width=Math.min(o.width,i.width-o.x),o.height=Math.min(o.height,i.height-o.y),o.depthOrArrayLayers=Math.min(o.depthOrArrayLayers,i.depthOrArrayLayers-o.z),o}_getSupportedColorReadOptions(e){let t=this._normalizeTextureReadOptions(e),n=Se.getInfo(this.format);switch(this._validateColorReadAspect(t),this._validateColorReadFormat(n),this.dimension){case"2d":case"cube":case"cube-array":case"2d-array":case"3d":return t;default:throw new Error(`${this} color readback does not support ${this.dimension} textures`)}}_validateColorReadAspect(e){if(e.aspect!=="all")throw new Error(`${this} color readback only supports aspect 'all'`)}_validateColorReadFormat(e){if(e.compressed)throw new Error(`${this} color readback does not support compressed formats (${this.format})`);switch(e.attachment){case"color":return;case"depth":throw new Error(`${this} color readback does not support depth formats (${this.format})`);case"stencil":throw new Error(`${this} color readback does not support stencil formats (${this.format})`);case"depth-stencil":throw new Error(`${this} color readback does not support depth-stencil formats (${this.format})`);default:throw new Error(`${this} color readback does not support format ${this.format}`)}}_normalizeTextureWriteOptions(e){let t=r._omitUndefined(e),n=t.mipLevel??0,i=this._getMipLevelSize(n),o={...r.defaultTextureWriteOptions,...i,...t};o.width=Math.min(o.width,i.width-o.x),o.height=Math.min(o.height,i.height-o.y),o.depthOrArrayLayers=Math.min(o.depthOrArrayLayers,i.depthOrArrayLayers-o.z);let s=Se.computeMemoryLayout({format:this.format,width:o.width,height:o.height,depth:o.depthOrArrayLayers,byteAlignment:this.byteAlignment}),a=s.bytesPerPixel*o.width;if(o.bytesPerRow=t.bytesPerRow??s.bytesPerRow,o.rowsPerImage=t.rowsPerImage??o.height,o.bytesPerRow<a)throw new Error(`bytesPerRow (${o.bytesPerRow}) must be at least ${a} for ${this.format}`);if(o.rowsPerImage<o.height)throw new Error(`rowsPerImage (${o.rowsPerImage}) must be at least ${o.height} for ${this.format}`);let c=this.device.getTextureFormatInfo(this.format).bytesPerPixel;if(c&&o.bytesPerRow%c!==0)throw new Error(`bytesPerRow (${o.bytesPerRow}) must be a multiple of bytesPerPixel (${c}) for ${this.format}`);return o}_getMipLevelSize(e){let t=Math.max(1,this.width>>e),n=this.baseDimension==="1d"?1:Math.max(1,this.height>>e),i=this.dimension==="3d"?Math.max(1,this.depth>>e):this.depth;return{width:t,height:n,depthOrArrayLayers:i}}getAllocatedByteLength(){let e=0;for(let t=0;t<this.mipLevels;t++){let{width:n,height:i,depthOrArrayLayers:o}=this._getMipLevelSize(t);e+=Se.computeMemoryLayout({format:this.format,width:n,height:i,depth:o,byteAlignment:1}).byteLength}return e*this.samples}static _omitUndefined(e){return Object.fromEntries(Object.entries(e).filter(([,t])=>t!==void 0))}static defaultProps={...O.defaultProps,data:null,dimension:"2d",format:"rgba8unorm",usage:r.SAMPLE|r.RENDER|r.COPY_DST,width:void 0,height:void 0,depth:1,mipLevels:1,samples:void 0,sampler:{},view:void 0};static defaultCopyDataOptions={data:void 0,byteOffset:0,bytesPerRow:void 0,rowsPerImage:void 0,width:void 0,height:void 0,depthOrArrayLayers:void 0,depth:1,mipLevel:0,x:0,y:0,z:0,aspect:"all"};static defaultCopyExternalImageOptions={image:void 0,sourceX:0,sourceY:0,width:void 0,height:void 0,depth:1,mipLevel:0,x:0,y:0,z:0,aspect:"all",colorSpace:"srgb",premultipliedAlpha:!1,flipY:!1};static defaultCopyElementImageOptions={element:void 0,width:void 0,height:void 0,sourceX:0,sourceY:0,sourceWidth:void 0,sourceHeight:void 0,depth:1,mipLevel:0,x:0,y:0,z:0,aspect:"all",colorSpace:"srgb",premultipliedAlpha:!1,flipY:!1};static defaultTextureReadOptions={x:0,y:0,z:0,width:void 0,height:void 0,depthOrArrayLayers:1,mipLevel:0,aspect:"all"};static defaultTextureWriteOptions={byteOffset:0,bytesPerRow:void 0,rowsPerImage:void 0,x:0,y:0,z:0,width:void 0,height:void 0,depthOrArrayLayers:1,mipLevel:0,aspect:"all"}}});var zr,xy=_(()=>{fe();zr=class r extends O{get[Symbol.toStringTag](){return"TextureView"}constructor(e,t){super(e,t,r.defaultProps)}static defaultProps={...O.defaultProps,format:void 0,dimension:void 0,aspect:"all",baseMipLevel:0,mipLevelCount:void 0,baseArrayLayer:0,arrayLayerCount:void 0}}});var wo,vy=_(()=>{fe();wo=class r extends O{width;height;updateTimestamp;get[Symbol.toStringTag](){return"ExternalTexture"}constructor(e,t){super(e,t,r.defaultProps);let n=this.props.source?e.getExternalImageSize(this.props.source):null;this.width=this.props.width||n?.width||0,this.height=this.props.height||n?.height||0,this.updateTimestamp=e.incrementTimestamp()}static defaultProps={...O.defaultProps,source:void 0,width:0,height:0,colorSpace:"srgb",sampler:{}}}});function wy(r,e,t){let n="",i=e.split(/\r?\n/),o=r.slice().sort((s,a)=>s.lineNum-a.lineNum);switch(t?.showSourceCode||"no"){case"all":let s=0;for(let a=1;a<=i.length;a++){let c=i[a-1],l=o[s];for(c&&l&&(n+=Ey(c,a,t));o.length>s&&l.lineNum===a;){let u=o[s++];u&&(n+=_d(u,i,u.lineNum,{...t,inlineSource:!1}))}}for(;o.length>s;){let a=o[s++];a&&(n+=_d(a,[],0,{...t,inlineSource:!1}))}return n;case"issues":case"no":for(let a of r)n+=_d(a,i,a.lineNum,{inlineSource:t?.showSourceCode!=="no"});return n}}function _d(r,e,t,n){if(n?.inlineSource){let o=r3(e,t),s=r.linePos>0?`${" ".repeat(r.linePos+5)}^^^
`:"";return`
${o}${s}${r.type.toUpperCase()}: ${r.message}

`}let i=r.type==="error"?"red":"orange";return n?.html?`<div class='luma-compiler-log-${r.type}' style="color:${i};"><b> ${r.type.toUpperCase()}: ${r.message}</b></div>`:`${r.type.toUpperCase()}: ${r.message}`}function r3(r,e,t){let n="";for(let i=e-2;i<=e;i++){let o=r[i-1];o!==void 0&&(n+=Ey(o,e,t))}return n}function Ey(r,e,t){let n=t?.html?i3(r):r;return`${n3(String(e),4)}: ${n}${t?.html?"<br/>":`
`}`}function n3(r,e){let t="";for(let n=r.length;n<e;++n)t+=" ";return t+r}function i3(r){return r.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}var Py=_(()=>{});function o3(r){return s3(r.source)||r.id||vt(`unnamed ${r.stage}-shader`)}function s3(r,e="unnamed"){return/#define[\s*]SHADER_NAME[\s*]([A-Za-z0-9_-]+)[\s*]/.exec(r)?.[1]??e}var $r,yd=_(()=>{fe();Pe();Vn();Py();$r=class r extends O{get[Symbol.toStringTag](){return"Shader"}stage;source;compilationStatus="pending";constructor(e,t){t={...t,debugShaders:t.debugShaders||e.props.debugShaders||"errors"},super(e,{id:o3(t),...t},r.defaultProps),this.stage=this.props.stage,this.source=this.props.source}getCompilationInfoSync(){return null}getTranslatedSource(){return null}async debugShader(){let e=this.props.debugShaders;switch(e){case"never":return;case"errors":if(this.compilationStatus==="success")return;break;case"warnings":case"always":break}try{let t=await this.getCompilationInfo();if(e==="warnings"&&t?.length===0)return;this._displayShaderLog(t,this.id)}catch(t){P.warn(`Shader ${this.id}: failed to fetch compilation info during debug logging`,t)()}}_displayShaderLog(e,t){if(typeof document>"u"||!document?.createElement)return;let n=t,i=`${this.stage} shader "${n}"`,o=wy(e,this.source,{showSourceCode:"all",html:!0}),s=this.getTranslatedSource(),a=document.createElement("div");a.innerHTML=`<h1>Compilation error in ${i}</h1>
<div style="display:flex;position:fixed;top:10px;right:20px;gap:2px;">
<button id="copy">Copy source</button><br/>
<button id="close">Close</button>
</div>
<code><pre>${o}</pre></code>`,s&&(a.innerHTML+=`<br /><h1>Translated Source</h1><br /><br /><code><pre>${s}</pre></code>`),a.style.top="0",a.style.left="0",a.style.background="white",a.style.position="fixed",a.style.zIndex="9999",a.style.maxWidth="100vw",a.style.maxHeight="100vh",a.style.overflowY="auto",document.body.appendChild(a),a.querySelector(".luma-compiler-log-error")?.scrollIntoView(),a.querySelector("button#close").onclick=()=>{a.remove()},a.querySelector("button#copy").onclick=()=>{navigator.clipboard.writeText(this.source)}}static defaultProps={...O.defaultProps,language:"auto",stage:void 0,source:"",sourceMap:null,entryPoint:"main",debugShaders:void 0}}});var Vr,Sy=_(()=>{fe();gd();Pe();Vr=class r extends O{get[Symbol.toStringTag](){return"Framebuffer"}width;height;constructor(e,t={}){super(e,t,r.defaultProps),this.width=this.props.width,this.height=this.props.height}clone(e){let t=this.colorAttachments.map(i=>i.texture.clone(e)),n=this.depthStencilAttachment&&this.depthStencilAttachment.texture.clone(e);return this.device.createFramebuffer({...this.props,...e,colorAttachments:t,depthStencilAttachment:n})}resize(e){let t=!e;if(e){let[n,i]=Array.isArray(e)?e:[e.width,e.height];t=t||i!==this.height||n!==this.width,this.width=n,this.height=i}t&&(P.log(2,`Resizing framebuffer ${this.id} to ${this.width}x${this.height}`)(),this.resizeAttachments(this.width,this.height))}autoCreateAttachmentTextures(){if(this.props.colorAttachments.length===0&&!this.props.depthStencilAttachment)throw new Error("Framebuffer has noattachments");this.colorAttachments=this.props.colorAttachments.map((t,n)=>{if(typeof t=="string"){let i=this.createColorTexture(t,n);return this.attachResource(i),i.view}return t instanceof z?t.view:t});let e=this.props.depthStencilAttachment;if(e)if(typeof e=="string"){let t=this.createDepthStencilTexture(e);this.attachResource(t),this.depthStencilAttachment=t.view}else e instanceof z?this.depthStencilAttachment=e.view:this.depthStencilAttachment=e}createColorTexture(e,t){return this.device.createTexture({id:`${this.id}-color-attachment-${t}`,usage:z.RENDER_ATTACHMENT,format:e,width:this.width,height:this.height,sampler:{magFilter:"linear",minFilter:"linear"}})}createDepthStencilTexture(e){return this.device.createTexture({id:`${this.id}-depth-stencil-attachment`,usage:z.RENDER_ATTACHMENT|z.SAMPLE,format:e,width:this.width,height:this.height})}resizeAttachments(e,t){if(this.colorAttachments.forEach((n,i)=>{let o=n.texture.clone({width:e,height:t});this.destroyAttachedResource(n),this.colorAttachments[i]=o.view,this.attachResource(o.view)}),this.depthStencilAttachment){let n=this.depthStencilAttachment.texture.clone({width:e,height:t});this.destroyAttachedResource(this.depthStencilAttachment),this.depthStencilAttachment=n.view,this.attachResource(n)}this.updateAttachments()}static defaultProps={...O.defaultProps,width:1,height:1,colorAttachments:[],depthStencilAttachment:null}}});var Ze,bd=_(()=>{fe();Ze=class r extends O{get[Symbol.toStringTag](){return"RenderPipeline"}shaderLayout;bufferLayout;linkStatus="pending";hash="";sharedRenderPipeline=null;get isPending(){return this.linkStatus==="pending"||this.vs.compilationStatus==="pending"||this.fs?.compilationStatus==="pending"}get isErrored(){return this.linkStatus==="error"||this.vs.compilationStatus==="error"||this.fs?.compilationStatus==="error"}constructor(e,t){super(e,t,r.defaultProps),this.shaderLayout=this.props.shaderLayout,this.bufferLayout=this.props.bufferLayout||[],this.sharedRenderPipeline=this.props._sharedRenderPipeline||null}static defaultProps={...O.defaultProps,vs:null,vertexEntryPoint:"vertexMain",vsConstants:{},fs:null,fragmentEntryPoint:"fragmentMain",fsConstants:{},shaderLayout:null,bufferLayout:[],topology:"triangle-list",colorAttachmentFormats:void 0,depthStencilAttachmentFormat:void 0,parameters:{},varyings:void 0,bufferMode:void 0,disableWarnings:!1,_sharedRenderPipeline:void 0,_uniformBlockLayouts:[],bindings:void 0,bindGroups:void 0}}});var Eo,Ty=_(()=>{fe();Eo=class extends O{get[Symbol.toStringTag](){return"SharedRenderPipeline"}constructor(e,t){super(e,t,{...O.defaultProps,handle:void 0,vs:void 0,fs:void 0,varyings:void 0,bufferMode:void 0})}}});var dr,xd=_(()=>{fe();dr=class r extends O{get[Symbol.toStringTag](){return"ComputePipeline"}hash="";shaderLayout;constructor(e,t){super(e,t,r.defaultProps),this.shaderLayout=t.shaderLayout}static defaultProps={...O.defaultProps,shader:void 0,entryPoint:void 0,constants:{},shaderLayout:void 0}}});var Wr,Ly=_(()=>{xd();bd();Pe();Vn();Wr=class r{static defaultProps={...Ze.defaultProps};static getDefaultPipelineFactory(e){let t=e.getModuleData("@luma.gl/core");return t.defaultPipelineFactory||=new r(e),t.defaultPipelineFactory}device;_hashCounter=0;_hashes={};_renderPipelineCache={};_computePipelineCache={};_sharedRenderPipelineCache={};get[Symbol.toStringTag](){return"PipelineFactory"}toString(){return`PipelineFactory(${this.device.id})`}constructor(e){this.device=e}createRenderPipeline(e){if(!this.device.props._cachePipelines)return this.device.createRenderPipeline(e);let t={...Ze.defaultProps,...e},n=this._renderPipelineCache,i=this._hashRenderPipeline(t),o=n[i]?.resource;if(o)n[i].useCount++,this.device.props.debugFactories&&P.log(3,`${this}: ${n[i].resource} reused, count=${n[i].useCount}, (id=${e.id})`)();else{let s=this.device.type==="webgl"&&this.device.props._sharePipelines?this.createSharedRenderPipeline(t):void 0;o=this.device.createRenderPipeline({...t,id:t.id?`${t.id}-cached`:vt("unnamed-cached"),_sharedRenderPipeline:s}),o.hash=i,n[i]={resource:o,useCount:1},this.device.props.debugFactories&&P.log(3,`${this}: ${o} created, count=${n[i].useCount}`)()}return o}createComputePipeline(e){if(!this.device.props._cachePipelines)return this.device.createComputePipeline(e);let t={...dr.defaultProps,...e},n=this._computePipelineCache,i=this._hashComputePipeline(t),o=n[i]?.resource;return o?(n[i].useCount++,this.device.props.debugFactories&&P.log(3,`${this}: ${n[i].resource} reused, count=${n[i].useCount}, (id=${e.id})`)()):(o=this.device.createComputePipeline({...t,id:t.id?`${t.id}-cached`:void 0}),o.hash=i,n[i]={resource:o,useCount:1},this.device.props.debugFactories&&P.log(3,`${this}: ${o} created, count=${n[i].useCount}`)()),o}release(e){if(!this.device.props._cachePipelines){e.destroy();return}let t=this._getCache(e),n=e.hash;t[n].useCount--,t[n].useCount===0?(this._destroyPipeline(e),this.device.props.debugFactories&&P.log(3,`${this}: ${e} released and destroyed`)()):t[n].useCount<0?(P.error(`${this}: ${e} released, useCount < 0, resetting`)(),t[n].useCount=0):this.device.props.debugFactories&&P.log(3,`${this}: ${e} released, count=${t[n].useCount}`)()}createSharedRenderPipeline(e){let t=this._hashSharedRenderPipeline(e),n=this._sharedRenderPipelineCache[t];return n||(n={resource:this.device._createSharedRenderPipelineWebGL(e),useCount:0},this._sharedRenderPipelineCache[t]=n),n.useCount++,n.resource}releaseSharedRenderPipeline(e){if(!e.sharedRenderPipeline)return;let t=this._hashSharedRenderPipeline(e.sharedRenderPipeline.props),n=this._sharedRenderPipelineCache[t];n&&(n.useCount--,n.useCount===0&&(n.resource.destroy(),delete this._sharedRenderPipelineCache[t]))}_destroyPipeline(e){let t=this._getCache(e);return this.device.props._destroyPipelines?(delete t[e.hash],e.destroy(),e instanceof Ze&&this.releaseSharedRenderPipeline(e),!0):!1}_getCache(e){let t;if(e instanceof dr&&(t=this._computePipelineCache),e instanceof Ze&&(t=this._renderPipelineCache),!t)throw new Error(`${this}`);if(!t[e.hash])throw new Error(`${this}: ${e} matched incorrect entry`);return t}_hashComputePipeline(e){let{type:t}=this.device,n=this._getHash(e.shader.source),i=this._getHash(JSON.stringify(e.shaderLayout));return`${t}/C/${n}SL${i}`}_hashRenderPipeline(e){let t=e.vs?this._getHash(e.vs.source):0,n=e.fs?this._getHash(e.fs.source):0,i=this._getWebGLVaryingHash(e),o=this._getHash(JSON.stringify(e.shaderLayout)),s=this._getHash(JSON.stringify(e._uniformBlockLayouts)),a=this._getHash(JSON.stringify(e.bufferLayout)),{type:c}=this.device;switch(c){case"webgl":let l=this._getHash(JSON.stringify(e.parameters));return`${c}/R/${t}/${n}V${i}T${e.topology}P${l}SL${o}UBL${s}BL${a}`;case"webgpu":default:let u=this._getHash(JSON.stringify({vertexEntryPoint:e.vertexEntryPoint,fragmentEntryPoint:e.fragmentEntryPoint})),f=this._getHash(JSON.stringify(e.parameters)),d=this._getWebGPUAttachmentHash(e);return`${c}/R/${t}/${n}V${i}T${e.topology}EP${u}P${f}SL${o}BL${a}A${d}`}}_hashSharedRenderPipeline(e){let t=e.vs?this._getHash(e.vs.source):0,n=e.fs?this._getHash(e.fs.source):0,i=this._getWebGLVaryingHash(e);return`webgl/S/${t}/${n}V${i}`}_getHash(e){return this._hashes[e]===void 0&&(this._hashes[e]=this._hashCounter++),this._hashes[e]}_getWebGLVaryingHash(e){let{varyings:t=[],bufferMode:n=null}=e;return this._getHash(JSON.stringify({varyings:t,bufferMode:n}))}_getWebGPUAttachmentHash(e){let t=e.colorAttachmentFormats??[this.device.preferredColorFormat],n=e.depthStencilAttachmentFormat??(e.parameters?.depthWriteEnabled?this.device.preferredDepthFormat:null);return this._getHash(JSON.stringify({colorAttachmentFormats:t,depthStencilAttachmentFormat:n}))}}});var jr,Ay=_(()=>{yd();Pe();jr=class r{static defaultProps={...$r.defaultProps};static getDefaultShaderFactory(e){let t=e.getModuleData("@luma.gl/core");return t.defaultShaderFactory||=new r(e),t.defaultShaderFactory}device;_cache={};get[Symbol.toStringTag](){return"ShaderFactory"}toString(){return`${this[Symbol.toStringTag]}(${this.device.id})`}constructor(e){this.device=e}createShader(e){if(!this.device.props._cacheShaders)return this.device.createShader(e);let t=this._hashShader(e),n=this._cache[t];if(n)n.useCount++,this.device.props.debugFactories&&P.log(3,`${this}: Reusing shader ${n.resource.id} count=${n.useCount}`)();else{let i=this.device.createShader({...e,id:e.id?`${e.id}-cached`:void 0});this._cache[t]=n={resource:i,useCount:1},this.device.props.debugFactories&&P.log(3,`${this}: Created new shader ${i.id}`)()}return n.resource}release(e){if(!this.device.props._cacheShaders){e.destroy();return}let t=this._hashShader(e),n=this._cache[t];if(n)if(n.useCount--,n.useCount===0)this.device.props._destroyShaders&&(delete this._cache[t],n.resource.destroy(),this.device.props.debugFactories&&P.log(3,`${this}: Releasing shader ${e.id}, destroyed`)());else{if(n.useCount<0)throw new Error(`ShaderFactory: Shader ${e.id} released too many times`);this.device.props.debugFactories&&P.log(3,`${this}: Releasing shader ${e.id} count=${n.useCount}`)()}}_hashShader(e){return`${e.stage}:${e.source}`}}});function ic(r,e,t){let n=r.bindings.find(i=>i.name===e||`${i.name.toLocaleLowerCase()}uniforms`===e.toLocaleLowerCase());return!n&&!t?.ignoreWarnings&&P.warn(`Binding ${e} not set: Not found in shader layout.`)(),n||null}function Hr(r,e){if(!e)return{};if(a3(e))return Object.fromEntries(Object.entries(e).map(([i,o])=>[Number(i),{...o}]));let t={};for(let[n,i]of Object.entries(e)){let s=ic(r,n)?.group??0;t[s]||={},t[s][n]=i}return t}function Wn(r){let e={};for(let t of Object.values(r))Object.assign(e,t);return e}function a3(r){let e=Object.keys(r);return e.length>0&&e.every(t=>/^\d+$/.test(t))}var Cy=_(()=>{Pe()});var Po,My=_(()=>{fe();Po=class r extends O{static defaultClearColor=[0,0,0,1];static defaultClearDepth=1;static defaultClearStencil=0;get[Symbol.toStringTag](){return"RenderPass"}constructor(e,t,n=r.defaultProps){t=r.normalizeProps(e,t),super(e,t,n)}static normalizeProps(e,t){return t}static defaultProps={...O.defaultProps,framebuffer:null,resolveTargets:void 0,parameters:void 0,clearColor:r.defaultClearColor,clearColors:void 0,clearDepth:r.defaultClearDepth,clearStencil:r.defaultClearStencil,depthReadOnly:!1,stencilReadOnly:!1,discard:!1,occlusionQuerySet:void 0,timestampQuerySet:void 0,beginTimestampIndex:void 0,endTimestampIndex:void 0}}});var So,Ry=_(()=>{fe();So=class r extends O{get[Symbol.toStringTag](){return"CommandEncoder"}_timeProfilingQuerySet=null;_timeProfilingSlotCount=0;_gpuTimeMs;constructor(e,t){super(e,t,r.defaultProps),this._timeProfilingQuerySet=t.timeProfilingQuerySet??null,this._timeProfilingSlotCount=0,this._gpuTimeMs=void 0}async resolveTimeProfilingQuerySet(){if(this._gpuTimeMs=void 0,!this._timeProfilingQuerySet)return;let e=Math.floor(this._timeProfilingSlotCount/2);if(e<=0)return;let t=e*2,n=await this._timeProfilingQuerySet.readResults({firstQuery:0,queryCount:t}),i=0n;for(let o=0;o<t;o+=2)i+=n[o+1]-n[o];this._gpuTimeMs=Number(i)/1e6}getTimeProfilingSlotCount(){return this._timeProfilingSlotCount}getTimeProfilingQuerySet(){return this._timeProfilingQuerySet}_applyTimeProfilingToPassProps(e){let t=e||{};if(!this._supportsTimestampQueries()||!this._timeProfilingQuerySet||t.timestampQuerySet!==void 0||t.beginTimestampIndex!==void 0||t.endTimestampIndex!==void 0)return t;let n=this._timeProfilingSlotCount;return n+1>=this._timeProfilingQuerySet.props.count?t:(this._timeProfilingSlotCount+=2,{...t,timestampQuerySet:this._timeProfilingQuerySet,beginTimestampIndex:n,endTimestampIndex:n+1})}_supportsTimestampQueries(){return this.device.features.has("timestamp-query")}static defaultProps={...O.defaultProps,measureExecutionTime:void 0,timeProfilingQuerySet:void 0}}});var To,Iy=_(()=>{fe();To=class r extends O{get[Symbol.toStringTag](){return"CommandBuffer"}constructor(e,t){super(e,t,r.defaultProps)}static defaultProps={...O.defaultProps}}});var Lo,Oy=_(()=>{fe();Lo=class r extends O{static defaultProps={...O.defaultProps,shaderLayout:void 0,bufferLayout:[]};get[Symbol.toStringTag](){return"VertexArray"}maxVertexAttributes;indexBuffer=null;attributes;constructor(e,t){super(e,t,r.defaultProps),this.maxVertexAttributes=e.limits.maxVertexAttributes,this.attributes=new Array(this.maxVertexAttributes).fill(null)}getBufferSlot(e){return null}getDrawValidationError(){return null}setConstantWebGL(e,t){this.device.reportError(new Error("constant attributes not supported"),this)()}}});var Ao,By=_(()=>{fe();Ao=class r extends O{static defaultProps={...O.defaultProps,layout:void 0,buffers:{}};get[Symbol.toStringTag](){return"TransformFeedback"}constructor(e,t){super(e,t,r.defaultProps)}}});var Co,Dy=_(()=>{fe();Co=class r extends O{get[Symbol.toStringTag](){return"QuerySet"}constructor(e,t){super(e,t,r.defaultProps)}static defaultProps={...O.defaultProps,type:void 0,count:void 0}}});var Mo,ky=_(()=>{fe();Mo=class r extends O{static defaultProps={...O.defaultProps};get[Symbol.toStringTag](){return"Fence"}constructor(e,t={}){super(e,t,r.defaultProps)}}});function jn(r){let e=oc(r),t=f3[e];if(!t)throw new Error(`Unsupported variable shader type: ${r}`);return t}function Ny(r){let e=Fy(r),t=u3[e];if(!t)throw new Error(`Unsupported attribute shader type: ${r}`);let[n,i]=t,o=n==="i32"||n==="u32",s=n!=="u32",a=l3[n]*i;return{primitiveType:n,components:i,byteLength:a,integer:o,signed:s}}function c3(r,e){return e===1?r:`vec${e}<${r}>`}function Fy(r){return d3[r]||r}function oc(r){return h3[r]||r}var vd,Ge,l3,u3,f3,d3,h3,Ro=_(()=>{vd=class{getVariableShaderTypeInfo(e){return jn(e)}getAttributeShaderTypeInfo(e){return Ny(e)}makeShaderAttributeType(e,t){return c3(e,t)}resolveAttributeShaderTypeAlias(e){return Fy(e)}resolveVariableShaderTypeAlias(e){return oc(e)}};Ge=new vd,l3={f32:4,f16:2,i32:4,u32:4},u3={f32:["f32",1],"vec2<f32>":["f32",2],"vec3<f32>":["f32",3],"vec4<f32>":["f32",4],f16:["f16",1],"vec2<f16>":["f16",2],"vec3<f16>":["f16",3],"vec4<f16>":["f16",4],i32:["i32",1],"vec2<i32>":["i32",2],"vec3<i32>":["i32",3],"vec4<i32>":["i32",4],u32:["u32",1],"vec2<u32>":["u32",2],"vec3<u32>":["u32",3],"vec4<u32>":["u32",4]},f3={f32:{type:"f32",components:1},f16:{type:"f16",components:1},i32:{type:"i32",components:1},u32:{type:"u32",components:1},"vec2<f32>":{type:"f32",components:2},"vec3<f32>":{type:"f32",components:3},"vec4<f32>":{type:"f32",components:4},"vec2<f16>":{type:"f16",components:2},"vec3<f16>":{type:"f16",components:3},"vec4<f16>":{type:"f16",components:4},"vec2<i32>":{type:"i32",components:2},"vec3<i32>":{type:"i32",components:3},"vec4<i32>":{type:"i32",components:4},"vec2<u32>":{type:"u32",components:2},"vec3<u32>":{type:"u32",components:3},"vec4<u32>":{type:"u32",components:4},"mat2x2<f32>":{type:"f32",components:4},"mat2x3<f32>":{type:"f32",components:6},"mat2x4<f32>":{type:"f32",components:8},"mat3x2<f32>":{type:"f32",components:6},"mat3x3<f32>":{type:"f32",components:9},"mat3x4<f32>":{type:"f32",components:12},"mat4x2<f32>":{type:"f32",components:8},"mat4x3<f32>":{type:"f32",components:12},"mat4x4<f32>":{type:"f32",components:16},"mat2x2<f16>":{type:"f16",components:4},"mat2x3<f16>":{type:"f16",components:6},"mat2x4<f16>":{type:"f16",components:8},"mat3x2<f16>":{type:"f16",components:6},"mat3x3<f16>":{type:"f16",components:9},"mat3x4<f16>":{type:"f16",components:12},"mat4x2<f16>":{type:"f16",components:8},"mat4x3<f16>":{type:"f16",components:12},"mat4x4<f16>":{type:"f16",components:16},"mat2x2<i32>":{type:"i32",components:4},"mat2x3<i32>":{type:"i32",components:6},"mat2x4<i32>":{type:"i32",components:8},"mat3x2<i32>":{type:"i32",components:6},"mat3x3<i32>":{type:"i32",components:9},"mat3x4<i32>":{type:"i32",components:12},"mat4x2<i32>":{type:"i32",components:8},"mat4x3<i32>":{type:"i32",components:12},"mat4x4<i32>":{type:"i32",components:16},"mat2x2<u32>":{type:"u32",components:4},"mat2x3<u32>":{type:"u32",components:6},"mat2x4<u32>":{type:"u32",components:8},"mat3x2<u32>":{type:"u32",components:6},"mat3x3<u32>":{type:"u32",components:9},"mat3x4<u32>":{type:"u32",components:12},"mat4x2<u32>":{type:"u32",components:8},"mat4x3<u32>":{type:"u32",components:12},"mat4x4<u32>":{type:"u32",components:16}},d3={vec2i:"vec2<i32>",vec3i:"vec3<i32>",vec4i:"vec4<i32>",vec2u:"vec2<u32>",vec3u:"vec3<u32>",vec4u:"vec4<u32>",vec2f:"vec2<f32>",vec3f:"vec3<f32>",vec4f:"vec4<f32>",vec2h:"vec2<f16>",vec3h:"vec3<f16>",vec4h:"vec4<f16>"},h3={vec2i:"vec2<i32>",vec3i:"vec3<i32>",vec4i:"vec4<i32>",vec2u:"vec2<u32>",vec3u:"vec3<u32>",vec4u:"vec4<u32>",vec2f:"vec2<f32>",vec3f:"vec3<f32>",vec4f:"vec4<f32>",vec2h:"vec2<f16>",vec3h:"vec3<f16>",vec4h:"vec4<f16>",mat2x2f:"mat2x2<f32>",mat2x3f:"mat2x3<f32>",mat2x4f:"mat2x4<f32>",mat3x2f:"mat3x2<f32>",mat3x3f:"mat3x3<f32>",mat3x4f:"mat3x4<f32>",mat4x2f:"mat4x2<f32>",mat4x3f:"mat4x3<f32>",mat4x4f:"mat4x4<f32>",mat2x2i:"mat2x2<i32>",mat2x3i:"mat2x3<i32>",mat2x4i:"mat2x4<i32>",mat3x2i:"mat3x2<i32>",mat3x3i:"mat3x3<i32>",mat3x4i:"mat3x4<i32>",mat4x2i:"mat4x2<i32>",mat4x3i:"mat4x3<i32>",mat4x4i:"mat4x4<i32>",mat2x2u:"mat2x2<u32>",mat2x3u:"mat2x3<u32>",mat2x4u:"mat2x4<u32>",mat3x2u:"mat3x2<u32>",mat3x3u:"mat3x3<u32>",mat3x4u:"mat3x4<u32>",mat4x2u:"mat4x2<u32>",mat4x3u:"mat4x3<u32>",mat4x4u:"mat4x4<u32>",mat2x2h:"mat2x2<f16>",mat2x3h:"mat2x3<f16>",mat2x4h:"mat2x4<f16>",mat3x2h:"mat3x2<f16>",mat3x3h:"mat3x3<f16>",mat3x4h:"mat3x4<f16>",mat4x2h:"mat4x2<f16>",mat4x3h:"mat4x3<f16>",mat4x4h:"mat4x4<f16>"}});function Yr(r,e={}){let t={...r},n=e.layout??"std140",i={},o=0;for(let[s,a]of Object.entries(t))o=wd(i,s,a,o,n);return o=qe(o,hr(t,n)),{layout:n,byteLength:o*4,uniformTypes:t,fields:i}}function Io(r,e){let t=oc(r),n=jn(t),i=/^mat(\d)x(\d)<.+>$/.exec(t);if(i){let s=Number(i[1]),a=Number(i[2]),c=Uy(a,t,n.type,e),l=m3(c.size,c.alignment,e);return{alignment:c.alignment,size:s*l,components:s*a,columns:s,rows:a,columnStride:l,shaderType:t,type:n.type}}let o=/^vec(\d)<.+>$/.exec(t);return o?Uy(Number(o[1]),t,n.type,e):{alignment:1,size:1,components:1,columns:1,rows:1,columnStride:1,shaderType:t,type:n.type}}function Ed(r){return!!r&&typeof r=="object"&&!Array.isArray(r)}function wd(r,e,t,n,i){if(typeof t=="string"){let o=Io(t,i),s=qe(n,o.alignment);return r[e]={offset:s,...o},s+o.size}if(Array.isArray(t)){if(Array.isArray(t[0]))throw new Error(`Nested arrays are not supported for ${e}`);let o=t[0],s=t[1],a=zy(o,i),c=qe(n,hr(t,i));for(let l=0;l<s;l++)wd(r,`${e}[${l}]`,o,c+l*a,i);return c+a*s}if(Ed(t)){let o=hr(t,i),s=qe(n,o);for(let[a,c]of Object.entries(t))s=wd(r,`${e}.${a}`,c,s,i);return qe(s,o)}throw new Error(`Unsupported CompositeShaderType for ${e}`)}function Gy(r,e){if(typeof r=="string")return Io(r,e).size;if(Array.isArray(r)){let n=r[0],i=r[1];if(Array.isArray(n))throw new Error("Nested arrays are not supported");return zy(n,e)*i}let t=0;for(let n of Object.values(r)){let i=n;t=qe(t,hr(i,e)),t+=Gy(i,e)}return qe(t,hr(r,e))}function hr(r,e){if(typeof r=="string")return Io(r,e).alignment;if(Array.isArray(r)){let n=r[0],i=hr(n,e);return $y(e)?Math.max(i,4):i}let t=1;for(let n of Object.values(r)){let i=hr(n,e);t=Math.max(t,i)}return g3(e)?Math.max(t,4):t}function Uy(r,e,t,n){return{alignment:r===2?2:4,size:r===3?3:r,components:r,columns:1,rows:r,columnStride:r===3?3:r,shaderType:e,type:t}}function zy(r,e){let t=Gy(r,e),n=hr(r,e);return p3(t,n,e)}function p3(r,e,t){return qe(r,$y(t)?4:e)}function m3(r,e,t){return t==="std140"?4:qe(r,e)}function $y(r){return r==="std140"||r==="wgsl-uniform"}function g3(r){return r==="std140"||r==="wgsl-uniform"}var sc=_(()=>{Xa();Ro()});function Pd(r){return(!ac||ac.byteLength<r)&&(ac=new ArrayBuffer(r)),ac}function Sd(r,e){let t=Pd(r.BYTES_PER_ELEMENT*e);return new r(t,0,e)}var ac,Td=_(()=>{});function _3(r){return ArrayBuffer.isView(r)&&!(r instanceof DataView)}function Hn(r){return Array.isArray(r)?r.length===0||typeof r[0]=="number":_3(r)}var Ld=_(()=>{});function y3(r){return!!r&&typeof r=="object"&&!Array.isArray(r)&&!ArrayBuffer.isView(r)}function b3(r,e,t){return Array.prototype.slice.call(r,e,t)}var cc,Vy=_(()=>{Td();Ld();Pe();sc();cc=class{layout;constructor(e){this.layout=e}has(e){return!!this.layout.fields[e]}get(e){let t=this.layout.fields[e];return t?{offset:t.offset,size:t.size}:void 0}getFlatUniformValues(e){let t={};for(let[n,i]of Object.entries(e)){let o=this.layout.uniformTypes[n];o?this._flattenCompositeValue(t,n,o,i):this.layout.fields[n]&&(t[n]=i)}return t}getData(e){let t=Pd(this.layout.byteLength);new Uint8Array(t,0,this.layout.byteLength).fill(0);let n={i32:new Int32Array(t),u32:new Uint32Array(t),f32:new Float32Array(t),f16:new Uint16Array(t)},i=this.getFlatUniformValues(e);for(let[o,s]of Object.entries(i))this._writeLeafValue(n,o,s);return new Uint8Array(t,0,this.layout.byteLength)}_flattenCompositeValue(e,t,n,i){if(i!==void 0){if(typeof n=="string"||this.layout.fields[t]){e[t]=i;return}if(Array.isArray(n)){let o=n[0],s=n[1];if(Array.isArray(o))throw new Error(`Nested arrays are not supported for ${t}`);if(typeof o=="string"&&Hn(i)){this._flattenPackedArray(e,t,o,s,i);return}if(!Array.isArray(i)){P.warn(`Unsupported uniform array value for ${t}:`,i)();return}for(let a=0;a<Math.min(i.length,s);a++){let c=i[a];c!==void 0&&this._flattenCompositeValue(e,`${t}[${a}]`,o,c)}return}if(Ed(n)&&y3(i)){for(let[o,s]of Object.entries(i)){if(s===void 0)continue;let a=`${t}.${o}`;this._flattenCompositeValue(e,a,n[o],s)}return}P.warn(`Unsupported uniform value for ${t}:`,i)()}}_flattenPackedArray(e,t,n,i,o){let s=o,c=Io(n,this.layout.layout).components;for(let l=0;l<i;l++){let u=l*c;if(u>=s.length)break;c===1?e[`${t}[${l}]`]=Number(s[u]):e[`${t}[${l}]`]=b3(o,u,u+c)}}_writeLeafValue(e,t,n){let i=this.layout.fields[t];if(!i){P.warn(`Uniform ${t} not found in layout`)();return}let{type:o,components:s,columns:a,rows:c,offset:l,columnStride:u}=i,f=e[o];if(s===1){f[l]=Number(n);return}let d=n;if(a===1){for(let p=0;p<s;p++)f[l+p]=Number(d[p]??0);return}let h=0;for(let p=0;p<a;p++){let m=l+p*u;for(let g=0;g<c;g++)f[m+g]=Number(d[h++]??0)}}}});function Wy(r,e,t=16){if(r===e)return!0;let n=r,i=e;if(!Hn(n)||!Hn(i)||n.length!==i.length)return!1;let o=Math.min(t,x3);if(n.length>o)return!1;for(let s=0;s<n.length;++s)if(i[s]!==n[s])return!1;return!0}function jy(r){return Hn(r)?r.slice():r}var x3,Hy=_(()=>{Ld();x3=128});var lc,Yy=_(()=>{Hy();lc=class{name;uniforms={};modifiedUniforms={};modified=!0;bindingLayout={};needsRedraw="initialized";constructor(e){if(this.name=e?.name||"unnamed",e?.name&&e?.shaderLayout){let t=e?.shaderLayout.bindings?.find(i=>i.type==="uniform"&&i.name===e?.name);if(!t)throw new Error(e?.name);let n=t;for(let i of n.uniforms||[])this.bindingLayout[i.name]=i}}setUniforms(e){for(let[t,n]of Object.entries(e))this._setUniform(t,n)&&!this.needsRedraw&&this.setNeedsRedraw(`${this.name}.${t}=${n}`)}setNeedsRedraw(e){this.needsRedraw=this.needsRedraw||e}getAllUniforms(){return this.modifiedUniforms={},this.needsRedraw=!1,this.uniforms||{}}_setUniform(e,t){return Wy(this.uniforms[e],t)?!1:(this.uniforms[e]=jy(t),this.modifiedUniforms[e]=!0,this.modified=!0,!0)}}});function w3(r){return r.type==="webgpu"?"wgsl-uniform":"std140"}var v3,qr,qy=_(()=>{qa();Pe();sc();Yy();Vy();v3=1024,qr=class{device;uniformBlocks=new Map;shaderBlockLayouts=new Map;shaderBlockWriters=new Map;uniformBuffers=new Map;constructor(e,t){this.device=e;for(let[n,i]of Object.entries(t)){let o=n,s=Yr(i.uniformTypes??{},{layout:i.layout??w3(e)}),a=new cc(s);this.shaderBlockLayouts.set(o,s),this.shaderBlockWriters.set(o,a);let c=new lc({name:n});c.setUniforms(a.getFlatUniformValues(i.defaultUniforms||{})),this.uniformBlocks.set(o,c)}}destroy(){for(let e of this.uniformBuffers.values())e.destroy()}setUniforms(e,t){for(let[n,i]of Object.entries(e)){let o=n,a=this.shaderBlockWriters.get(o)?.getFlatUniformValues(i||{});this.uniformBlocks.get(o)?.setUniforms(a||{})}this.updateUniformBuffers(t)}getUniformBufferByteLength(e){let t=this.shaderBlockLayouts.get(e)?.byteLength||0;return Math.max(t,v3)}getUniformBufferData(e){let t=this.uniformBlocks.get(e)?.getAllUniforms()||{};return this.shaderBlockWriters.get(e)?.getData(t)||new Uint8Array(0)}createUniformBuffer(e,t){t&&this.setUniforms(t);let n=this.getUniformBufferByteLength(e),i=this.device.createBuffer({usage:D.UNIFORM|D.COPY_DST,byteLength:n}),o=this.getUniformBufferData(e);return i.write(o),i}getManagedUniformBuffer(e){if(!this.uniformBuffers.get(e)){let t=this.getUniformBufferByteLength(e),n=this.device.createBuffer({usage:D.UNIFORM|D.COPY_DST,byteLength:t});this.uniformBuffers.set(e,n)}return this.uniformBuffers.get(e)}updateUniformBuffers(e){let t=!1;for(let n of this.uniformBlocks.keys()){let i=this.updateUniformBuffer(n,e);t||=i}return t&&P.log(3,`UniformStore.updateUniformBuffers(): ${t}`)(),t}updateUniformBuffer(e,t){let n=this.uniformBlocks.get(e),i=this.uniformBuffers.get(e),o=!1;if(i&&n?.needsRedraw){o||=n.needsRedraw;let s=this.getUniformBufferData(e);i=this.uniformBuffers.get(e),i&&(t?this.device.writeBufferViaCommandEncoder(t,i,s):i.write(s));let a=this.uniformBlocks.get(e)?.getAllUniforms();P.log(4,`Writing to uniform buffer ${String(e)}`,s,a)()}return o}}});function Yn(r){return r.attributes?r.attributes.map(e=>e.attribute):[r.name]}function Ad(r){return Object.fromEntries(r.attributes.map(e=>[e.name,e.location]))}function uc(r){let e=1/0;for(let t of r)t!==void 0&&(e=Math.min(e,t));return e}function Cd(r,e,t){E3(e);let n=new Map;for(let i of e){let o=P3(i);if(i.attributes)for(let s of i.attributes)n.has(s.attribute)||n.set(s.attribute,{bufferName:i.name,stepMode:i.stepMode,vertexFormat:s.format,byteOffset:s.byteOffset,byteStride:o});else i.format&&!n.has(i.name)&&n.set(i.name,{bufferName:i.name,stepMode:i.stepMode,vertexFormat:i.format,byteOffset:0,byteStride:o})}return r.attributes.map(i=>{let o=n.get(i.name);!o&&t?.warnOnMissingBufferLayout&&P.warn(`layout for attribute "${i.name}" not present in buffer layout`)();let s=Ge.getAttributeShaderTypeInfo(i.type),a=o?.vertexFormat||Z.getCompatibleVertexFormat(s);return{attributeName:i.name,bufferName:o?.bufferName||i.name,location:i.location,vertexFormat:a,byteOffset:o?.byteOffset??0,byteStride:o?.byteStride??Z.getVertexFormatInfo(a).byteLength,stepMode:o?.stepMode||i.stepMode||(i.name.startsWith("instance")?"instance":"vertex")}}).sort((i,o)=>i.location-o.location)}function E3(r){for(let e of r)(e.attributes&&e.format||!e.attributes&&!e.format)&&P.warn(`BufferLayout ${e.name} must have either 'attributes' or 'format' field`)()}function P3(r){if(typeof r.byteStride=="number")return r.byteStride;if(r.attributes){let e=0;for(let t of r.attributes)e+=Z.getVertexFormatInfo(t.format).byteLength;return e}return Z.getVertexFormatInfo(r.format).byteLength}var Md=_(()=>{Pe();Ro();_o()});function Oo(r,e){let t={},n=Cd(r,e,{warnOnMissingBufferLayout:!0});for(let i of n){let o=S3(r,i);t[i.attributeName]=o}return t}function S3(r,e){let t=T3(r,e.attributeName),n=Ge.getAttributeShaderTypeInfo(t.type),i=e.vertexFormat,o=Z.getVertexFormatInfo(i);return{attributeName:e.attributeName,bufferName:e.bufferName,location:t.location,shaderType:t.type,primitiveType:n.primitiveType,shaderComponents:n.components,vertexFormat:i,bufferDataType:o.type,bufferComponents:o.components,normalized:o.normalized,integer:n.integer,stepMode:e.stepMode,byteOffset:e.byteOffset,byteStride:e.byteStride}}function T3(r,e){let t=r.attributes.find(n=>n.name===e);return t||P.warn(`shader layout attribute "${e}" not present in shader`)(),t||null}var Zy=_(()=>{Pe();Ro();_o();Md()});var I=_(()=>{W_();j_();dy();yy();by();qa();gd();xy();vy();yd();md();Sy();bd();Ty();Ly();Ay();My();xd();Ry();Iy();Oy();By();Dy();ky();sc();qy();Ka();Xa();Ro();_o();rc();Pe();Cy();hd();Td();Zy();Md()});function Bo(r=[],e){let t=[],n={},i={},o={},s={};for(let a of r)Xy({modules:t,defines:n,injections:i,vertexInputs:o,varyings:s},a),Xy({modules:t,defines:n,injections:i,vertexInputs:o,varyings:s},a[e]);for(let a of Object.keys(s))if(o[a])throw new Error(`ShaderPlugin name "${a}" cannot be both a vertex input and a varying`);return{modules:t,defines:n,injections:i,vertexInputs:o,varyings:s}}function Do(r=[],e=[]){let t=[...r],n=new Set(t.map(i=>i.name));for(let i of e)n.has(i.name)||(t.push(i),n.add(i.name));return t}function Xy(r,e){if(e){e.modules?.length&&r.modules.push(...e.modules),e.defines&&Object.assign(r.defines,e.defines);for(let[t,n]of Object.entries(e.vertexInputs||{})){Ky(t,"vertex input");let i=r.vertexInputs[t];if(i&&i!==n)throw new Error(`ShaderPlugin vertex input "${t}" has conflicting types "${i}" and "${n}"`);r.vertexInputs[t]=n}for(let[t,n]of Object.entries(e.varyings||{})){Ky(t,"varying");let i=A3(t,n),o=r.varyings[t];if(o&&(o.type!==i.type||o.interpolation!==i.interpolation))throw new Error(`ShaderPlugin varying "${t}" has conflicting declarations "${o.type}/${o.interpolation}" and "${i.type}/${i.interpolation}"`);r.varyings[t]=i}for(let t of e.injections||[])C3(t.target),r.injections[t.target]||(r.injections[t.target]=[]),r.injections[t.target].push({injection:t.injection,order:t.order??0})}}function Ky(r,e){if(!/^[A-Za-z_][A-Za-z0-9_]*$/.test(r)||r.startsWith("_luma_"))throw new Error(`ShaderPlugin ${e} "${r}" must be a valid non-reserved identifier`)}function A3(r,e){let{primitiveType:t}=Ge.getAttributeShaderTypeInfo(e.type),n=t==="i32"||t==="u32",i=e.interpolation||(n?"flat":"smooth");if(n&&i==="smooth")throw new Error(`ShaderPlugin integer varying "${r}" must use flat interpolation`);return{type:e.type,interpolation:i}}function C3(r){if(!L3.test(r))throw new Error(`ShaderPlugin injection target "${r}" must be a named shader anchor or hook`)}var L3,Qy=_(()=>{I();L3=/^(vs|fs):(?:#(?:decl|main-start|main-end)|[A-Za-z_][\w-]*)$/});function ko(r){return`${r.name}Uniforms`}function eb(r,e){let t=e==="wgsl"?r.source:e==="vertex"?r.vs:r.fs;if(!t)return null;let n=ko(r);return I3(t,e==="wgsl"?"wgsl":"glsl",n)}function tb(r,e){let t=Object.keys(r.uniformTypes||{});if(!t.length)return null;let n=eb(r,e);return n?{moduleName:r.name,uniformBlockName:ko(r),stage:e,expectedUniformNames:t,actualUniformNames:n,matches:D3(t,n)}:null}function Rd(r,e,t={}){let n=tb(r,e);if(!n||n.matches)return n;let i=k3(n);return t.log?.error?.(i,n)(),t.throwOnError!==!1&&$t(!1,i),n}function No(r){let e=[],t=N3(r);for(let n of t.matchAll(R3)){let i=n[1]?.trim()||null;e.push({blockName:n[2],body:n[3],instanceName:n[4]||null,layoutQualifier:i,hasLayoutQualifier:!!i,isStd140:!!(i&&/\blayout\s*\([^)]*\bstd140\b[^)]*\)/.exec(i))})}return e}function Id(r,e,t,n){let i=No(r).filter(s=>!s.isStd140),o=new Set;for(let s of i){if(o.has(s.blockName))continue;o.add(s.blockName);let a=n?.label?`${n.label} `:"",c=s.hasLayoutQualifier?`declares ${F3(s.layoutQualifier)} instead of layout(std140)`:"does not declare layout(std140)",l=`${a}${e} shader uniform block ${s.blockName} ${c}. luma.gl host-side shader block packing assumes explicit layout(std140) for GLSL uniform blocks. Add \`layout(std140)\` to the block declaration.`;t?.warn?.(l,s)()}return i}function I3(r,e,t){let n=e==="wgsl"?O3(r,t):B3(r,t);if(!n)return null;let i=[];for(let o of n.split(`
`)){let s=o.replace(/\/\/.*$/,"").trim();if(!s||s.startsWith("#"))continue;let a=e==="wgsl"?s.match(/^([A-Za-z0-9_]+)\s*:/):s.match(M3);a&&i.push(a[1])}return i}function O3(r,e){let t=new RegExp(`\\bstruct\\s+${e}\\b`,"m").exec(r);if(!t)return null;let n=r.indexOf("{",t.index);if(n<0)return null;let i=0;for(let o=n;o<r.length;o++){let s=r[o];if(s==="{"){i++;continue}if(s==="}"&&(i--,i===0))return r.slice(n+1,o)}return null}function B3(r,e){return No(r).find(n=>n.blockName===e)?.body||null}function D3(r,e){if(r.length!==e.length)return!1;for(let t=0;t<r.length;t++)if(r[t]!==e[t])return!1;return!0}function k3(r){let{expectedUniformNames:e,actualUniformNames:t}=r,n=e.filter(a=>!t.includes(a)),i=t.filter(a=>!e.includes(a)),o=[`Expected ${e.length} fields, found ${t.length}.`],s=U3(e,t);return s&&o.push(s),n.length&&o.push(`Missing from shader block (${n.length}): ${Jy(n)}.`),i.length&&o.push(`Unexpected in shader block (${i.length}): ${Jy(i)}.`),e.length<=12&&t.length<=12&&(n.length||i.length)&&(o.push(`Expected: ${e.join(", ")}.`),o.push(`Actual: ${t.join(", ")}.`)),`${r.moduleName}: ${r.stage} shader uniform block ${r.uniformBlockName} does not match module.uniformTypes. ${o.join(" ")}`}function N3(r){return r.replace(/\/\*[\s\S]*?\*\//g,"").replace(/\/\/.*$/gm,"")}function F3(r){return r.replace(/\s+/g," ").trim()}function U3(r,e){let t=Math.min(r.length,e.length);for(let n=0;n<t;n++)if(r[n]!==e[n])return`First mismatch at field ${n+1}: expected ${r[n]}, found ${e[n]}.`;return r.length>e.length?`Shader block ends after field ${e.length}; expected next field ${r[e.length]}.`:e.length>r.length?`Shader block has extra field ${e.length}: ${e[r.length]}.`:null}function Jy(r,e=8){if(r.length<=e)return r.join(", ");let t=r.length-e;return`${r.slice(0,e).join(", ")}, ... (${t} more)`}var M3,R3,Od=_(()=>{$a();M3=/^(?:uniform\s+)?(?:(?:lowp|mediump|highp)\s+)?[A-Za-z0-9_]+(?:<[^>]+>)?\s+([A-Za-z0-9_]+)(?:\s*\[[^\]]+\])?\s*;/,R3=/((?:layout\s*\([^)]*\)\s*)*)uniform\s+([A-Za-z_][A-Za-z0-9_]*)\s*\{([\s\S]*?)\}\s*([A-Za-z_][A-Za-z0-9_]*)?\s*;/g});function rb(r){switch(r?.gpu.toLowerCase()){case"apple":return`#define APPLE_GPU
// Apple optimizes away the calculation necessary for emulated fp64
#define LUMA_FP64_CODE_ELIMINATION_WORKAROUND 1
#define LUMA_FP32_TAN_PRECISION_WORKAROUND 1
// Intel GPU doesn't have full 32 bits precision in same cases, causes overflow
#define LUMA_FP64_HIGH_BITS_OVERFLOW_WORKAROUND 1
`;case"nvidia":return`#define NVIDIA_GPU
// Nvidia optimizes away the calculation necessary for emulated fp64
#define LUMA_FP64_CODE_ELIMINATION_WORKAROUND 1
`;case"intel":return`#define INTEL_GPU
// Intel optimizes away the calculation necessary for emulated fp64
#define LUMA_FP64_CODE_ELIMINATION_WORKAROUND 1
// Intel's built-in 'tan' function doesn't have acceptable precision
#define LUMA_FP32_TAN_PRECISION_WORKAROUND 1
// Intel GPU doesn't have full 32 bits precision in same cases, causes overflow
#define LUMA_FP64_HIGH_BITS_OVERFLOW_WORKAROUND 1
`;case"amd":return`#define AMD_GPU
`;default:return`#define DEFAULT_GPU
// Prevent driver from optimizing away the calculation necessary for emulated fp64
#define LUMA_FP64_CODE_ELIMINATION_WORKAROUND 1
// Headless Chrome's software shader 'tan' function doesn't have acceptable precision
#define LUMA_FP32_TAN_PRECISION_WORKAROUND 1
// If the GPU doesn't have full 32 bits precision, will causes overflow
#define LUMA_FP64_HIGH_BITS_OVERFLOW_WORKAROUND 1
`}}var nb=_(()=>{});function ob(r,e){if(Number(r.match(/^#version[ \t]+(\d+)/m)?.[1]||100)!==300)throw new Error("luma.gl v9 only supports GLSL 3.00 shader sources");switch(e){case"vertex":return r=ib(r,G3),r;case"fragment":return r=ib(r,z3),r;default:throw new Error(e)}}function ib(r,e){for(let[t,n]of e)r=r.replace(t,n);return r}function Bd(r){return new RegExp(`\\b${r}[ \\t]+(\\w+[ \\t]+\\w+(\\[\\w+\\])?;)`,"g")}var sb,G3,z3,ab=_(()=>{sb=[[/^(#version[ \t]+(100|300[ \t]+es))?[ \t]*\n/,`#version 300 es
`],[/\btexture(2D|2DProj|Cube)Lod(EXT)?\(/g,"textureLod("],[/\btexture(2D|2DProj|Cube)(EXT)?\(/g,"texture("]],G3=[...sb,[Bd("attribute"),"in $1"],[Bd("varying"),"out $1"]],z3=[...sb,[Bd("varying"),"in $1"]]});function fc(r,e,t="glsl"){let n="";for(let i in r){let o=r[i];if(n+=`${t==="wgsl"?"fn":"void"} ${o.signature} {
`,o.header&&(n+=`  ${o.header}`),e[i]){let a=e[i];a.sort((c,l)=>c.order-l.order);for(let c of a)n+=`  ${c.injection}
`}o.footer&&(n+=`  ${o.footer}`),n+=`}
`}return n}function Dd(r){let e={vertex:{},fragment:{}};for(let t of r){let n,i;typeof t!="string"?(n=t,i=n.hook):(n={},i=t),i=i.trim();let o=i.indexOf(":"),s=i.slice(0,o),a=i.slice(o+1),c=i.replace(/\(.+/,""),l=Object.assign(n,{signature:a});switch(s){case"vs":e.vertex[c]=l;break;case"fs":e.fragment[c]=l;break;default:throw new Error(s)}}return e}var cb=_(()=>{});function lb(r,e){return{name:$3(r,e),language:"glsl",version:V3(r)}}function $3(r,e="unnamed"){let n=/#define[^\S\r\n]*SHADER_NAME[^\S\r\n]*([A-Za-z0-9_-]+)\s*/.exec(r);return n?n[1]:e}function V3(r){let e=100,t=r.match(/[^\s]+/g);if(t&&t.length>=2&&t[0]==="#version"){let n=parseInt(t[1],10);Number.isFinite(n)&&(e=n)}if(e!==100&&e!==300)throw new Error(`Invalid GLSL version ${e}`);return e}var ub=_(()=>{});function dc(r,e=[]){let t=Gn(r),n=new Map;for(let o of e)n.set(db(o.name,o.group,o.location),o.moduleName);let i=[];for(let o of fb){o.lastIndex=0;let s;for(s=o.exec(t);s;){let a=o===fb[0],c=Number(s[a?1:2]),l=Number(s[a?2:1]),u=s[3]?.trim(),f=s[4],d=s[5].trim(),h=n.get(db(f,l,c));i.push(W3({name:f,group:l,binding:c,owner:h?"module":"application",moduleName:h,accessDeclaration:u,resourceType:d})),s=o.exec(t)}}return i.sort((o,s)=>o.group!==s.group?o.group-s.group:o.binding!==s.binding?o.binding-s.binding:o.name.localeCompare(s.name))}function W3(r){let e={name:r.name,group:r.group,binding:r.binding,owner:r.owner,kind:"unknown",moduleName:r.moduleName,resourceType:r.resourceType};if(r.accessDeclaration){let t=r.accessDeclaration.split(",").map(n=>n.trim());if(t[0]==="uniform")return{...e,kind:"uniform",access:"uniform"};if(t[0]==="storage"){let n=t[1]||"read_write";return{...e,kind:n==="read"?"read-only-storage":"storage",access:n}}}return r.resourceType==="sampler"||r.resourceType==="sampler_comparison"?{...e,kind:"sampler",samplerKind:r.resourceType==="sampler_comparison"?"comparison":"filtering"}:r.resourceType.startsWith("texture_storage_")?{...e,kind:"storage-texture",access:H3(r.resourceType),viewDimension:hb(r.resourceType)}:r.resourceType.startsWith("texture_")?{...e,kind:"texture",viewDimension:hb(r.resourceType),sampleType:j3(r.resourceType),multisampled:r.resourceType.startsWith("texture_multisampled_")}:e}function db(r,e,t){return`${e}:${t}:${r}`}function hb(r){if(r.includes("cube_array"))return"cube-array";if(r.includes("2d_array"))return"2d-array";if(r.includes("cube"))return"cube";if(r.includes("3d"))return"3d";if(r.includes("2d"))return"2d";if(r.includes("1d"))return"1d"}function j3(r){if(r.startsWith("texture_depth_"))return"depth";if(r.includes("<i32>"))return"sint";if(r.includes("<u32>"))return"uint";if(r.includes("<f32>"))return"float"}function H3(r){return/,\s*([A-Za-z_][A-Za-z0-9_]*)\s*>$/.exec(r)?.[1]}var fb,kd=_(()=>{Fa();fb=[new RegExp(`@binding\\(\\s*(\\d+)\\s*\\)\\s*@group\\(\\s*(\\d+)\\s*\\)\\s*${Ue}\\s*:\\s*([^;]+);`,"g"),new RegExp(`@group\\(\\s*(\\d+)\\s*\\)\\s*@binding\\(\\s*(\\d+)\\s*\\)\\s*${Ue}\\s*:\\s*([^;]+);`,"g")]});function Xr(r,e){let t=r.split(`
`),n=[],i=[],o=!0;for(let s of t){let a=s.match(Y3),c=s.match(Q3)||s.match(q3),l=s.match(Z3),u=s.match(X3),f=s.match(J3)||s.match(K3);if(a){let d=eL(a[1],e?.defines||{}),h=o&&d;i.push({parentActive:o,branchTaken:d,active:h}),o=h}else if(c||l){let d=(c||l)?.[1],h=!!e?.defines?.[d],p=c?h:!h,m=o&&p;i.push({parentActive:o,branchTaken:p,active:m}),o=m}else if(u){let d=i[i.length-1];if(!d)throw new Error("Encountered #else without matching #if, #ifdef or #ifndef");d.active=d.parentActive&&!d.branchTaken,d.branchTaken=!0,o=d.active}else f?(i.pop(),o=i.length?i[i.length-1].active:!0):o&&n.push(s)}if(i.length>0)throw new Error("Unterminated conditional block in shader source");return n.join(`
`)}function eL(r,e){let t=r.trim();if(/^[+-]?\d+(?:\.\d+)?$/.test(t))return Number(t)!==0;if(t==="true")return!0;if(t==="false")return!1;let n=t.match(new RegExp(`^!\\s*${Zr}$`));if(n)return!e[n[1]];let i=t.match(new RegExp(`^${Zr}$`));if(i)return!!e[i[1]];let o=t.match(new RegExp(`^defined\\s*\\(\\s*${Zr}\\s*\\)$`));if(o)return e[o[1]]!==void 0;let s=t.match(new RegExp(`^!\\s*defined\\s*\\(\\s*${Zr}\\s*\\)$`));if(s)return e[s[1]]===void 0;throw new Error(`Unsupported #if expression "${r}"`)}var Zr,Y3,q3,Z3,X3,K3,Q3,J3,Nd=_(()=>{Zr="([a-zA-Z_][a-zA-Z0-9_]*)",Y3=/^\s*\#\s*if\s+(.+?)\s*(?:\/\/.*)?$/,q3=new RegExp(`^\\s*\\#\\s*ifdef\\s*${Zr}\\s*$`),Z3=new RegExp(`^\\s*\\#\\s*ifndef\\s*${Zr}\\s*(?:\\/\\/.*)?$`),X3=/^\s*\#\s*else\s*(?:\/\/.*)?$/,K3=/^\s*\#\s*endif\s*$/,Q3=new RegExp(`^\\s*\\#\\s*ifdef\\s*${Zr}\\s*(?:\\/\\/.*)?$`),J3=/^\s*\#\s*endif\s*(?:\/\/.*)?$/});function gb(r,e){let t=[];for(let[n,i]of Object.entries(e))tL(r,n),t.push(`in ${hc(i)} ${n};`);return t.join(`
`)}function _b(r,e,t){let n=Object.entries(t);if(n.length===0)return{source:r,declarations:"",initialization:""};let i=rL(r,e),o=r.slice(i.openParenthesis+1,i.closeParenthesis),s=nL(r,o),a=new Set(s.locations),c=[],l=[],u=[];for(let[m,g]of n){if(s.names.has(m)||sL(r,m))throw new Error(`ShaderPlugin vertex input "${m}" conflicts with an existing WGSL shader input or variable`);let b=aL(a);a.add(b);let y=`_luma_${m}`;c.push(`@location(${b}) ${y}: ${g}`),l.push(`var<private> ${m}: ${g};`),u.push(`${m} = ${y};`)}let f=o.trim()?`,
  `:`
  `,d=o.trim()?"":`
`,h=`${o}${f}${c.join(`,
  `)}${d}`;return{source:r.slice(0,i.openParenthesis+1)+h+r.slice(i.closeParenthesis),declarations:l.join(`
`),initialization:u.join(`
`)}}function hc(r){let{primitiveType:e,components:t}=Ge.getAttributeShaderTypeInfo(r),n=e==="i32"?"int":e==="u32"?"uint":"float";return t===1?n:`${n==="int"?"i":n==="uint"?"u":""}vec${t}`}function tL(r,e){let t=pc(e);if(new RegExp(`\\b(?:in|attribute)\\s+(?:(?:lowp|mediump|highp)\\s+)?[A-Za-z_][A-Za-z0-9_]*\\s+${t}\\s*(?:\\[|;)`).test(r))throw new Error(`ShaderPlugin vertex input "${e}" conflicts with an existing GLSL input`)}function rL(r,e){let n=new RegExp(`\\bfn\\s+${pc(e)}\\s*\\(`,"g").exec(r);if(!n)throw new Error(`ShaderPlugin vertex inputs require WGSL vertex entry point "${e}"`);let i=r.indexOf("(",n.index),o=yb(r,i,"(",")");if(o<0)throw new Error(`Unable to parse WGSL vertex entry point "${e}" parameters`);return{openParenthesis:i,closeParenthesis:o}}function nL(r,e){let t=pb(e),n=new Set(mb(e)),i=iL(e);for(let o of i){let s=oL(r,o);if(s!==null){t.push(...pb(s));for(let a of mb(s))n.add(a)}}return{locations:t,names:n}}function pb(r){let e=[],t=/@location\s*\(\s*(\d+)\s*\)/g,n=t.exec(r);for(;n;)e.push(Number(n[1])),n=t.exec(r);return e}function mb(r){let e=[],t=/(?:^|,)\s*(?:@[A-Za-z_][\w]*(?:\([^)]*\))?\s*)*([A-Za-z_][\w]*)\s*:/gm,n=t.exec(r);for(;n;)e.push(n[1]),n=t.exec(r);return e}function iL(r){let e=[],t=/:\s*([A-Za-z_][\w]*)\b/g,n=t.exec(r);for(;n;)e.push(n[1]),n=t.exec(r);return e}function oL(r,e){let n=new RegExp(`\\bstruct\\s+${pc(e)}\\s*\\{`,"g").exec(r);if(!n)return null;let i=r.indexOf("{",n.index),o=yb(r,i,"{","}");return o<0?null:r.slice(i+1,o)}function sL(r,e){let t=pc(e),n=new RegExp(`\\b(?:var(?:<[^>]+>)?|let|const)\\s+${t}\\b`,"g"),i=n.exec(r);for(;i;){if(cL(r,i.index)===0)return!0;i=n.exec(r)}return!1}function aL(r){let e=0;for(;r.has(e);)e++;return e}function yb(r,e,t,n){let i=0,o=0,s=!1;for(let a=e;a<r.length;a++){let c=r[a],l=r[a+1];if(s){c===`
`&&(s=!1);continue}if(o>0){c==="/"&&l==="*"?(o++,a++):c==="*"&&l==="/"&&(o--,a++);continue}if(c==="/"&&l==="/"){s=!0,a++;continue}if(c==="/"&&l==="*"){o=1,a++;continue}if(c===t&&i++,c===n&&--i===0)return a}return-1}function cL(r,e){let t=0,n=0,i=!1;for(let o=0;o<e;o++){let s=r[o],a=r[o+1];if(i){s===`
`&&(i=!1);continue}if(n>0){s==="/"&&a==="*"?(n++,o++):s==="*"&&a==="/"&&(n--,o++);continue}s==="/"&&a==="/"?(i=!0,o++):s==="/"&&a==="*"?(n=1,o++):s==="{"?t++:s==="}"&&t--}return t}function pc(r){return r.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}var Fd=_(()=>{I()});function xb(r,e,t){let n=[],i=[];for(let[o,s]of Object.entries(t)){vL(r,o);let a=s.interpolation==="flat"?"flat ":"",c=e==="vertex"?"out":"in";n.push(`${a}${c} ${hc(s.type)} ${o};`),e==="vertex"&&i.push(`${o} = ${bL(s.type)};`)}return{declarations:n.join(`
`),initialization:i.join(`
`)}}function vb(r,e,t,n){let i=Object.entries(n);if(i.length===0)return{source:r,declarations:"",vertexInitialization:"",fragmentInitialization:""};let o=r,s=mc(o,e,"vertex"),a=lL(o,s),c=mc(o,t,"fragment"),l=uL(o,c),u=Ud(o,a),f=Ud(o,l.type),d=new Set([...gc(s.parameters),...gc(u.body),...gc(c.parameters),...gc(f.body)]),h=new Set([...bb(u.body),...bb(f.body)]),p=[],m=[],g=[],b=[];for(let[w,E]of i){if(d.has(w)||_L(o,w))throw new Error(`ShaderPlugin varying "${w}" conflicts with existing WGSL stage I/O or a module variable`);let T=yL(h);h.add(T);let L=E.interpolation==="flat"?" @interpolate(flat)":"";p.push(`  @location(${T})${L} ${w}: ${E.type},`),m.push(`var<private> ${w}: ${E.type};`),g.push(`${w} = ${xL(E.type)};`),b.push(`${w} = ${l.name}.${w};`)}fL(o,a,s.openBrace,s.closeBrace),o=dL(o,a,s,i.map(([w])=>w)),s=mc(o,e,"vertex"),o=hL(o,s,i.map(([w])=>w));let x=(a===l.type?[a]:[a,l.type]).map(w=>Ud(o,w).closeBrace).sort((w,E)=>E-w);for(let w of x)o=o.slice(0,w)+`${p.join(`
`)}
`+o.slice(w);if(c=mc(o,t,"fragment"),!new RegExp(`\\b${Kr(l.name)}\\s*:`).test(c.parameters))throw new Error(`Unable to preserve WGSL fragment input "${l.name}"`);return{source:o,declarations:m.join(`
`),vertexInitialization:g.join(`
`),fragmentInitialization:b.join(`
`)}}function mc(r,e,t){let i=new RegExp(`\\bfn\\s+${Kr(e)}\\s*\\(`,"g").exec(r);if(!i)throw new Error(`ShaderPlugin varyings require WGSL ${t} entry point "${e}"`);let o=r.indexOf("(",i.index),s=_c(r,o,"(",")"),a=r.indexOf("{",s),c=_c(r,a,"{","}");if(s<0||a<0||c<0)throw new Error(`Unable to parse WGSL ${t} entry point "${e}"`);return{openParenthesis:o,closeParenthesis:s,openBrace:a,closeBrace:c,parameters:r.slice(o+1,s)}}function lL(r,e){let t=r.slice(e.closeParenthesis+1,e.openBrace),n=/->\s*([A-Za-z_][\w]*)\s*$/.exec(t.trim());if(!n||Gd(r,n[1])===null)throw new Error("ShaderPlugin varyings require the WGSL vertex entry point to return a named struct");return n[1]}function uL(r,e){let t=[];for(let n of gL(e.parameters,",")){let i=/(?:@[A-Za-z_][\w]*(?:\([^)]*\))?\s*)*([A-Za-z_][\w]*)\s*:\s*([A-Za-z_][\w]*)\s*$/.exec(n.trim());i&&Gd(r,i[2])&&t.push({name:i[1],type:i[2]})}if(t.length!==1)throw new Error(`ShaderPlugin varyings require exactly one named WGSL fragment input struct; found ${t.length}`);return t[0]}function Ud(r,e){let t=Gd(r,e);if(!t)throw new Error(`Unable to find WGSL stage I/O struct "${e}"`);return t}function Gd(r,e){let n=new RegExp(`\\bstruct\\s+${Kr(e)}\\s*\\{`,"g").exec(r);if(!n)return null;let i=r.indexOf("{",n.index),o=_c(r,i,"{","}");return o<0?null:{openBrace:i,closeBrace:o,body:r.slice(i+1,o)}}function fL(r,e,t,n){let i=new RegExp(`\\b${Kr(e)}\\s*\\(`,"g"),o=i.exec(r);for(;o;){if(o.index<t||o.index>n)throw new Error(`ShaderPlugin varying output struct "${e}" is constructed outside the selected vertex entry point`);o=i.exec(r)}}function dL(r,e,t,n){let i=new RegExp(`\\b${Kr(e)}\\s*\\(`,"g"),o=[],s=i.exec(r);for(;s;){if(s.index>t.openBrace&&s.index<t.closeBrace){let a=r.indexOf("(",s.index),c=_c(r,a,"(",")");if(c<0||c>t.closeBrace)throw new Error(`Unable to parse WGSL output constructor "${e}"`);o.push({openParenthesis:a,closeParenthesis:c})}s=i.exec(r)}for(let a of o.sort((c,l)=>l.closeParenthesis-c.closeParenthesis)){let l=r.slice(a.openParenthesis+1,a.closeParenthesis).trim()?", ":"";r=r.slice(0,a.closeParenthesis)+l+n.join(", ")+r.slice(a.closeParenthesis)}return r}function hL(r,e,t){let n=pL(r,e.openBrace+1,e.closeBrace);for(let i=n.length-1;i>=0;i--){let o=n[i],s=r.slice(o.expressionStart,o.semicolon).trim();if(!s)throw new Error("ShaderPlugin varying vertex entry point cannot use an empty return");let a=`_luma_vertexOutput${i}`,c=t.map(u=>`${a}.${u} = ${u};`).join(`
`),l=`{
var ${a} = ${s};
${c}
return ${a};
}`;r=r.slice(0,o.start)+l+r.slice(o.semicolon+1)}return r}function pL(r,e,t){let n=[],i=e;for(;i<t;)if(i=zd(r,i,t),r.slice(i,i+6)==="return"&&!/[A-Za-z0-9_]/.test(r[i+6]||"")){let o=i+6,s=mL(r,o,t);if(s<0)throw new Error("Unable to parse WGSL return statement in selected vertex entry point");n.push({start:i,expressionStart:o,semicolon:s}),i=s+1}else i++;return n}function mL(r,e,t){let n=0,i=0;for(let o=e;o<t;o++){let s=zd(r,o,t);if(s!==o){o=s-1;continue}let a=r[o];if(a==="("&&n++,a===")"&&n--,a==="["&&i++,a==="]"&&i--,a===";"&&n===0&&i===0)return o}return-1}function zd(r,e,t){let n=e;if(r[n]==="/"&&r[n+1]==="/"){let i=r.indexOf(`
`,n+2);return i<0||i>t?t:i+1}if(r[n]==="/"&&r[n+1]==="*"){let i=1;for(n+=2;n<t&&i>0;)r[n]==="/"&&r[n+1]==="*"?(i++,n+=2):r[n]==="*"&&r[n+1]==="/"?(i--,n+=2):n++}return n}function gL(r,e){let t=[],n=0,i=0,o=0;for(let s=0;s<r.length;s++){let a=r[s];a==="("&&i++,a===")"&&i--,a==="<"&&o++,a===">"&&o--,a===e&&i===0&&o===0&&(t.push(r.slice(n,s)),n=s+1)}return t.push(r.slice(n)),t}function bb(r){let e=[],t=/@location\s*\(\s*(\d+)\s*\)/g,n=t.exec(r);for(;n;)e.push(Number(n[1])),n=t.exec(r);return e}function gc(r){let e=[],t=/(?:^|,)\s*(?:@[A-Za-z_][\w]*(?:\([^)]*\))?\s*)*([A-Za-z_][\w]*)\s*:/gm,n=t.exec(r);for(;n;)e.push(n[1]),n=t.exec(r);return e}function _L(r,e){let t=new RegExp(`\\b(?:var(?:<[^>]+>)?|let|const)\\s+${Kr(e)}\\b`,"g"),n=t.exec(r);for(;n;){if(wL(r,n.index)===0)return!0;n=t.exec(r)}return!1}function yL(r){let e=0;for(;r.has(e);)e++;return e}function bL(r){let{primitiveType:e,components:t}=Ge.getAttributeShaderTypeInfo(r),n=e==="u32"?"0u":e==="i32"?"0":"0.0";return t===1?n:`${hc(r)}(${n})`}function xL(r){let{primitiveType:e,components:t}=Ge.getAttributeShaderTypeInfo(r),n=`${e}(0)`;return t===1?n:`${r}(${n})`}function vL(r,e){if(new RegExp(`\\b(?:flat\\s+|smooth\\s+)?(?:in|out|varying)\\s+(?:(?:lowp|mediump|highp)\\s+)?[A-Za-z_][A-Za-z0-9_]*\\s+${Kr(e)}\\s*(?:\\[|;)`).test(r))throw new Error(`ShaderPlugin varying "${e}" conflicts with existing GLSL stage I/O`)}function _c(r,e,t,n){let i=0,o=0,s=!1;for(let a=e;a<r.length;a++){let c=r[a],l=r[a+1];if(s){c===`
`&&(s=!1);continue}if(o>0){c==="/"&&l==="*"?(o++,a++):c==="*"&&l==="/"&&(o--,a++);continue}if(c==="/"&&l==="/"){s=!0,a++;continue}if(c==="/"&&l==="*"){o=1,a++;continue}if(c===t&&i++,c===n&&--i===0)return a}return-1}function wL(r,e){let t=0;for(let n=0;n<e;n++){let i=zd(r,n,e);if(i!==n){n=i-1;continue}r[n]==="{"&&t++,r[n]==="}"&&t--}return t}function Kr(r){return r.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}var wb=_(()=>{I();Fd()});function Sb(r){let e=Nr(r.modules||[]),{source:t,bindingAssignments:n}=PL(r.platformInfo,{...r,source:r.source,stage:"vertex",modules:e});return{source:t,getUniforms:Lb(e),bindingAssignments:n,bindingTable:dc(t,n),shaderLayout:Ga(t,{vertexEntryPoint:r.vertexEntryPoint,scanVertexAttributes:r.scanVertexAttributes})}}function Tb(r){let{vs:e,fs:t}=r,n=Nr(r.modules||[]);return{vs:Eb(r.platformInfo,{...r,source:e,stage:"vertex",modules:n}),fs:Eb(r.platformInfo,{...r,source:t,stage:"fragment",modules:n}),getUniforms:Lb(n)}}function PL(r,e){let{source:t,stage:n,modules:i,defines:o={},hookFunctions:s=[],inject:a={},pluginInjections:c={},pluginVertexInputs:l={},pluginVaryings:u={},vertexEntryPoint:f="vertexMain",fragmentEntryPoint:d="fragmentMain",log:h}=e;$t(typeof t=="string","shader source must be a string");let p=Xr(t,{defines:o}),m=_b(p,f,l),g=vb(m.source,f,d,u),b=g.source,y="",x=Dd(s),v={},w={},E={};Ab(c,v,w,E);for(let R in a){let M=typeof a[R]=="string"?{injection:a[R],order:0}:a[R],N=/^(v|f)s:(#)?([\w-]+)$/.exec(R);if(N){let Q=N[2],te=N[3];Q?te==="decl"?w[R]=[M]:E[R]=[M]:v[R]=[M]}else E[R]=[M]}SL(m.declarations,m.initialization,w,E),TL(g,w,E);let T=i,L=IL(b),C=RL(L.source),S=kL(T,e._bindingRegistry,C,o),k=[];for(let R of T){h&&Yf(R,b,h);let M=Xr(Cb(R,"wgsl",h),{defines:o}),N=OL(M,R,{usedBindingsByGroup:C,bindingRegistry:e._bindingRegistry,reservedBindingKeysByGroup:S});k.push(...N.bindingAssignments);let Q=N.source;y+=Q;let te=LL(R);for(let ve in te){let Hi=/^(v|f)s:#([\w-]+)$/.exec(ve);if(Hi){let Gu=Hi[2]==="decl"?w:E;Gu[ve]=Gu[ve]||[],Gu[ve].push(te[ve])}else v[ve]=v[ve]||[],v[ve].push(te[ve])}}return y+=$d,y=po(y,n,AL(w),!1,"wgsl",{vertex:f,fragment:d}),y+=CL(x,v),y+=$L(k),y+=L.source,y=po(y,n,E,!1,"wgsl",{vertex:f,fragment:d}),zL(y),{source:y,bindingAssignments:k}}function Eb(r,e){let{source:t,stage:n,language:i="glsl",modules:o,defines:s={},hookFunctions:a=[],inject:c={},pluginInjections:l={},pluginVertexInputs:u={},pluginVaryings:f={},prologue:d=!0,log:h}=e;$t(typeof t=="string","shader source must be a string");let p=i==="glsl"?lb(t).version:-1,m=r.shaderLanguageVersion,g=p===100?"#version 100":"#version 300 es",y=t.split(`
`).slice(1).join(`
`),x={};o.forEach(S=>{Object.assign(x,S.defines)}),Object.assign(x,s);let v="";switch(i){case"wgsl":break;case"glsl":v=d?`${g}

// ----- PROLOGUE -------------------------
${`#define SHADER_TYPE_${n.toUpperCase()}`}

${rb(r)}
${n==="fragment"?EL:""}

// ----- APPLICATION DEFINES -------------------------

${ML(x)}

`:`${g}
`;break}let w=Dd(a),E={},T={},L={};Ab(l,E,T,L);for(let S in c){let k=typeof c[S]=="string"?{injection:c[S],order:0}:c[S],R=/^(v|f)s:(#)?([\w-]+)$/.exec(S);if(R){let M=R[2],N=R[3];M?N==="decl"?T[S]=[k]:L[S]=[k]:E[S]=[k]}else L[S]=[k]}if(n==="vertex"){let S=gb(y,u);S&&(T["vs:#decl"]=T["vs:#decl"]||[],T["vs:#decl"].push({injection:S,order:Number.MIN_SAFE_INTEGER}))}let C=xb(y,n,f);if(C.declarations){let S=n==="vertex"?"vs:#decl":"fs:#decl";T[S]=T[S]||[],T[S].push({injection:C.declarations,order:Number.MIN_SAFE_INTEGER})}C.initialization&&(L["vs:#main-start"]=L["vs:#main-start"]||[],L["vs:#main-start"].push({injection:C.initialization,order:Number.MIN_SAFE_INTEGER}));for(let S of o){h&&Yf(S,y,h);let k=Cb(S,n,h);v+=k;let R=S.instance?.normalizedInjections[n]||{};for(let M in R){let N=/^(v|f)s:#([\w-]+)$/.exec(M);if(N){let te=N[2]==="decl"?T:L;te[M]=te[M]||[],te[M].push(R[M])}else E[M]=E[M]||[],E[M].push(R[M])}}return v+="// ----- MAIN SHADER SOURCE -------------------------",v+=$d,v=po(v,n,T),v+=fc(w[n],E),v+=y,v=po(v,n,L),i==="glsl"&&p!==m&&(v=ob(v,n)),i==="glsl"&&Id(v,n,h),v.trim()}function Lb(r){return function(t){let n={};for(let i of r){let o=i.getUniforms?.(t,n);Object.assign(n,o)}return n}}function Ab(r,e,t,n){for(let i in r){let o=/^(v|f)s:(#)?([\w-]+)$/.exec(i);if(o){let s=o[2],a=o[3],c=s?a==="decl"?t:n:e;c[i]=c[i]||[],c[i].push(...r[i])}else n[i]=n[i]||[],n[i].push(...r[i])}}function SL(r,e,t,n){r&&(t["vs:#decl"]=t["vs:#decl"]||[],t["vs:#decl"].push({injection:r,order:Number.MIN_SAFE_INTEGER})),e&&(n["vs:#main-start"]=n["vs:#main-start"]||[],n["vs:#main-start"].push({injection:e,order:Number.MIN_SAFE_INTEGER}))}function TL(r,e,t){r.declarations&&(e["vs:#decl"]=e["vs:#decl"]||[],e["vs:#decl"].push({injection:r.declarations,order:Number.MIN_SAFE_INTEGER})),r.vertexInitialization&&(t["vs:#main-start"]=t["vs:#main-start"]||[],t["vs:#main-start"].push({injection:r.vertexInitialization,order:Number.MIN_SAFE_INTEGER})),r.fragmentInitialization&&(t["fs:#main-start"]=t["fs:#main-start"]||[],t["fs:#main-start"].push({injection:r.fragmentInitialization,order:Number.MIN_SAFE_INTEGER}))}function LL(r){return{...r.instance?.normalizedInjections.vertex||{},...r.instance?.normalizedInjections.fragment||{}}}function AL(r){let e=[...r["vs:#decl"]||[],...r["fs:#decl"]||[]];return e.length?{"vs:#decl":e}:{}}function CL(r,e){return fc(r.vertex,e,"wgsl")+fc(r.fragment,e,"wgsl")}function ML(r={}){let e="";for(let t in r){let n=r[t];(n||Number.isFinite(n))&&(e+=`#define ${t.toUpperCase()} ${r[t]}
`)}return e}function Cb(r,e,t){let n;switch(e){case"vertex":n=r.vs||"";break;case"fragment":n=r.fs||"";break;case"wgsl":n=r.source||"";break;default:$t(!1)}if(!r.name)throw new Error("Shader module must have a name");Rd(r,e,{log:t});let i=r.name.toUpperCase().replace(/[^0-9a-z]/gi,"_"),o=`// ----- MODULE ${r.name} ---------------

`;return e!=="wgsl"&&(o+=`#define MODULE_${i}
`),o+=`${n}
`,o}function RL(r){let e=new Map;for(let t of kr(r,P_)){let n=Number(t.bindingToken),i=Number(t.groupToken);Vd(i,n,t.name),qn(e,i,n,`application binding "${t.name}"`)}return e}function IL(r){let e=kr(r,Na),t=new Map;for(let o of e){if(o.bindingToken==="auto")continue;let s=Number(o.bindingToken),a=Number(o.groupToken);Vd(a,s,o.name),qn(t,a,s,`application binding "${o.name}"`)}let n={sawSupportedBindingDeclaration:e.length>0},i=Nf(r,Na,o=>DL(o,t,n));if(Ff(r)&&!n.sawSupportedBindingDeclaration)throw new Error('Unsupported @binding(auto) declaration form in application WGSL. Use adjacent "@group(N)" and "@binding(auto)" decorators followed by a bindable "var" declaration.');return{source:i}}function OL(r,e,t){let n=[],o={sawSupportedBindingDeclaration:kr(r,Un).length>0,nextHintedBindingLocation:typeof e.firstBindingSlot=="number"?e.firstBindingSlot:null},s=Nf(r,Un,a=>BL(a,{module:e,context:t,bindingAssignments:n,relocationState:o}));if(Ff(r)&&!o.sawSupportedBindingDeclaration)throw new Error(`Unsupported @binding(auto) declaration form in module "${e.name}". Use adjacent "@group(N)" and "@binding(auto)" decorators followed by a bindable "var" declaration.`);return{source:s,bindingAssignments:n}}function BL(r,e){let{module:t,context:n,bindingAssignments:i,relocationState:o}=e,{match:s,bindingToken:a,groupToken:c,name:l}=r,u=Number(c);if(a==="auto"){let d=Mb(u,t.name,l),h=n.bindingRegistry?.get(d),p=h!==void 0?h:UL(u,n.usedBindingsByGroup,t.name,o.nextHintedBindingLocation??void 0,n.bindingRegistry);return Pb(t.name,u,p,l),h!==void 0&&NL(n.reservedBindingKeysByGroup,u,p,d)?(i.push({moduleName:t.name,name:l,group:u,location:p}),s.replace(/@binding\(\s*auto\s*\)/,`@binding(${p})`)):(qn(n.usedBindingsByGroup,u,p,`module "${t.name}" binding "${l}"`),n.bindingRegistry?.set(d,p),i.push({moduleName:t.name,name:l,group:u,location:p}),o.nextHintedBindingLocation!==null&&h===void 0&&(o.nextHintedBindingLocation=p+1),s.replace(/@binding\(\s*auto\s*\)/,`@binding(${p})`))}let f=Number(a);return Pb(t.name,u,f,l),qn(n.usedBindingsByGroup,u,f,`module "${t.name}" binding "${l}"`),i.push({moduleName:t.name,name:l,group:u,location:f}),s}function DL(r,e,t){let{match:n,bindingToken:i,groupToken:o,name:s}=r,a=Number(o);if(i==="auto"){let c=GL(a,e);return Vd(a,c,s),qn(e,a,c,`application binding "${s}"`),n.replace(/@binding\(\s*auto\s*\)/,`@binding(${c})`)}return t.sawSupportedBindingDeclaration=!0,n}function kL(r,e,t,n){let i=new Map;if(!e)return i;for(let o of r)for(let s of FL(o,n)){let a=Mb(s.group,o.name,s.name),c=e.get(a);if(c!==void 0){let l=i.get(s.group)||new Map,u=l.get(c);if(u&&u!==a)throw new Error(`Duplicate WGSL binding reservation for modules "${u}" and "${a}": group ${s.group}, binding ${c}.`);qn(t,s.group,c,`registered module binding "${a}"`),l.set(c,a),i.set(s.group,l)}}return i}function NL(r,e,t,n){let i=r.get(e);if(!i)return!1;let o=i.get(t);if(!o)return!1;if(o!==n)throw new Error(`Registered module binding "${n}" collided with "${o}": group ${e}, binding ${t}.`);return!0}function FL(r,e){let t=[],n=Xr(r.source||"",{defines:e});for(let i of kr(n,Un))t.push({name:i.name,group:Number(i.groupToken)});return t}function Vd(r,e,t){if(r===0&&e>=Fo)throw new Error(`Application binding "${t}" in group 0 uses reserved binding ${e}. Application-owned explicit group-0 bindings must stay below ${Fo}.`)}function Pb(r,e,t,n){if(e===0&&t<Fo)throw new Error(`Module "${r}" binding "${n}" in group 0 uses reserved application binding ${t}. Module-owned explicit group-0 bindings must be ${Fo} or higher.`)}function qn(r,e,t,n){let i=r.get(e)||new Set;if(i.has(t))throw new Error(`Duplicate WGSL binding assignment for ${n}: group ${e}, binding ${t}.`);i.add(t),r.set(e,i)}function UL(r,e,t,n,i){let o=e.get(r)||new Set,s=new Set,a=`${r}:`,c=`${a}${t}:`;for(let[u,f]of i||[])u.startsWith(c)&&s.add(f);let l=n??(r===0?Fo:o.size>0?Math.max(...o)+1:0);for(;o.has(l)||s.has(l);)l++;for(let[u,f]of i||[])f===l&&u.startsWith(a)&&i?.delete(u);return l}function GL(r,e){let t=e.get(r)||new Set,n=0;for(;t.has(n);)n++;return n}function zL(r){let e=S_(r,Un);if(!e)return;let t=VL(r,e.index);throw t?new Error(`Unresolved @binding(auto) for module "${t}" binding "${e.name}" remained in assembled WGSL source.`):WL(r,e.index)?new Error(`Unresolved @binding(auto) for application binding "${e.name}" remained in assembled WGSL source.`):new Error(`Unresolved @binding(auto) remained in assembled WGSL source near "${jL(e.match)}".`)}function $L(r){if(r.length===0)return"";let e=`// ----- MODULE WGSL BINDING ASSIGNMENTS ---------------
`;for(let t of r)e+=`// ${t.moduleName}.${t.name} -> @group(${t.group}) @binding(${t.location})
`;return e+=`
`,e}function Mb(r,e,t){return`${r}:${e}:${t}`}function VL(r,e){let t=/^\/\/ ----- MODULE ([^\n]+) ---------------$/gm,n,i;for(i=t.exec(r);i&&i.index<=e;)n=i[1],i=t.exec(r);return n}function WL(r,e){let t=r.indexOf($d);return t>=0?e>t:!0}function jL(r){return r.replace(/\s+/g," ").trim()}var $d,Fo,EL,Rb=_(()=>{qf();nb();Hf();ab();Wa();Od();cb();$a();ub();kd();Vf();Nd();Fd();wb();Fa();$d=`

${ho}
`,Fo=100,EL=`precision highp float;
`});var Xe,Zn,pr,Ib=_(()=>{Wa();Rb();kd();Nd();Vf();$a();Xe=class r{static defaultShaderAssemblers={};_hookFunctions=[];_defaultModules=[];static getDefaultShaderAssembler(e){return $t(e==="glsl"||e==="wgsl"),e==="wgsl"?(r.defaultShaderAssemblers.wgsl=r.defaultShaderAssemblers.wgsl||new pr,r.defaultShaderAssemblers.wgsl):(r.defaultShaderAssemblers.glsl=r.defaultShaderAssemblers.glsl||new Zn,r.defaultShaderAssemblers.glsl)}addDefaultModule(e){this._defaultModules.find(t=>t.name===(typeof e=="string"?e:e.name))||this._defaultModules.push(e)}removeDefaultModule(e){let t=typeof e=="string"?e:e.name;this._defaultModules=this._defaultModules.filter(n=>n.name!==t)}addShaderHook(e,t){t&&(e=Object.assign(t,{hook:e})),this._hookFunctions.push(e)}_getModuleList(e=[]){let t=new Array(this._defaultModules.length+e.length),n={},i=0;for(let o=0,s=this._defaultModules.length;o<s;++o){let a=this._defaultModules[o],c=a.name;t[i++]=a,n[c]=!0}for(let o=0,s=e.length;o<s;++o){let a=e[o],c=a.name;n[c]||(t[i++]=a,n[c]=!0)}return t.length=i,zn(t),t}},Zn=class extends Xe{shaderLanguage="glsl";assembleGLSLShaderPair(e){let t=this._getModuleList(e.modules),n=this._hookFunctions;return{...Tb({...e,vs:e.vs,fs:e.fs,modules:t,hookFunctions:n}),modules:t}}},pr=class r extends Xe{shaderLanguage="wgsl";_wgslBindingRegistry=new Map;assembleWGSLShader(e){let t=this._getModuleList(e.modules),n=this._hookFunctions,i=r.getShaderPreprocessorDefines(e,t),o=e.platformInfo.shaderLanguage==="wgsl"&&e.source?Xr(e.source,{defines:i}):e.source,{source:s,getUniforms:a,bindingAssignments:c}=Sb({...e,source:o,defines:i,_bindingRegistry:this._wgslBindingRegistry,modules:t,hookFunctions:n}),l=e.platformInfo.shaderLanguage==="wgsl"?Xr(s,{defines:i}):s;return{source:l,getUniforms:a,modules:t,bindingAssignments:c,bindingTable:dc(l,c),shaderLayout:Ga(l,{vertexEntryPoint:e.vertexEntryPoint,scanVertexAttributes:e.scanVertexAttributes})}}static getShaderPreprocessorDefines(e,t){return{...r.getPlatformPreprocessorDefines(e.platformInfo),...t.reduce((n,i)=>(Object.assign(n,i.defines),n),{}),...e.defines}}static getPlatformPreprocessorDefines(e){let t=e.limits||{};return{LUMA_SUPPORTS_VERTEX_STORAGE_BUFFERS:e.type==="webgpu"&&(t.maxStorageBuffersInVertexStage||0)>0,LUMA_FP32_TAN_PRECISION_WORKAROUND:e.type==="webgpu"&&e.gpu.toLowerCase()!=="nvidia"&&e.gpu.toLowerCase()!=="amd",LUMA_FP64_INTEGER_ARITHMETIC:e.type==="webgpu"&&e.gpu.toLowerCase()==="apple"}}}});function Wd(r){let{input:e,inputChannels:t,output:n}=r||{};if(!e)return YL;if(!t)throw new Error("inputChannels");let i=qL(t),o=Ob(e,t);return`#version 300 es
in ${i} ${e};
out vec4 ${n};
void main() {
  ${n} = ${o};
}`}function qL(r){switch(r){case 1:return"float";case 2:return"vec2";case 3:return"vec3";case 4:return"vec4";default:throw new Error(`invalid channels: ${r}`)}}function Ob(r,e){switch(e){case 1:return`vec4(${r}, 0.0, 0.0, 1.0)`;case 2:return`vec4(${r}, 0.0, 1.0)`;case 3:return`vec4(${r}, 1.0)`;case 4:return r;default:throw new Error(`invalid channels: ${e}`)}}var HL,YL,Bb=_(()=>{HL=`out vec4 transform_output;
void main() {
  transform_output = vec4(0);
}`,YL=`#version 300 es
${HL}`});function jd(r,{precision:e=re.precision}={}){return r=XL(r),`${parseFloat(r.toPrecision(e))}`}function tt(r){return Array.isArray(r)||ArrayBuffer.isView(r)&&!(r instanceof DataView)}function V(r,e,t){return QL(r,n=>Math.max(e,Math.min(t,n)))}function Qr(r,e,t){return tt(r)?r.map((n,i)=>Qr(n,e[i],t)):t*e+(1-t)*r}function Et(r,e,t){let n=re.EPSILON;t&&(re.EPSILON=t);try{if(r===e)return!0;if(tt(r)&&tt(e)){if(r.length!==e.length)return!1;for(let i=0;i<r.length;++i)if(!Et(r[i],e[i]))return!1;return!0}return r&&r.equals?r.equals(e):e&&e.equals?e.equals(r):typeof r=="number"&&typeof e=="number"?Math.abs(r-e)<=re.EPSILON*Math.max(1,Math.abs(r),Math.abs(e)):!1}finally{re.EPSILON=n}}function XL(r){return Math.round(r/re.EPSILON)*re.EPSILON}function KL(r){return r.clone?r.clone():new Array(r.length)}function QL(r,e,t){if(tt(r)){let n=r;t=t||KL(n);for(let i=0;i<t.length&&i<n.length;++i){let o=typeof r=="number"?r:r[i];t[i]=e(o,i,t)}return t}return e(r)}var nj,ij,ZL,re,Jr=_(()=>{nj=1/Math.PI*180,ij=1/180*Math.PI,ZL={EPSILON:1e-12,debug:!1,precision:4,printTypes:!1,printDegrees:!1,printRowMajor:!0,_cartographicRadians:!1};globalThis.mathgl=globalThis.mathgl||{config:{...ZL}};re=globalThis.mathgl.config});var mr,yc=_(()=>{Jr();mr=class extends Array{clone(){return new this.constructor().copy(this)}fromArray(e,t=0){for(let n=0;n<this.ELEMENTS;++n)this[n]=e[n+t];return this.check()}toArray(e=[],t=0){for(let n=0;n<this.ELEMENTS;++n)e[t+n]=this[n];return e}toObject(e){return e}from(e){return Array.isArray(e)?this.copy(e):this.fromObject(e)}to(e){return e===this?this:tt(e)?this.toArray(e):this.toObject(e)}toTarget(e){return e?this.to(e):this}toFloat32Array(){return new Float32Array(this)}toString(){return this.formatString(re)}formatString(e){let t="";for(let n=0;n<this.ELEMENTS;++n)t+=(n>0?", ":"")+jd(this[n],e);return`${e.printTypes?this.constructor.name:""}[${t}]`}equals(e){if(!e||this.length!==e.length)return!1;for(let t=0;t<this.ELEMENTS;++t)if(!Et(this[t],e[t]))return!1;return!0}exactEquals(e){if(!e||this.length!==e.length)return!1;for(let t=0;t<this.ELEMENTS;++t)if(this[t]!==e[t])return!1;return!0}negate(){for(let e=0;e<this.ELEMENTS;++e)this[e]=-this[e];return this.check()}lerp(e,t,n){if(n===void 0)return this.lerp(this,e,t);for(let i=0;i<this.ELEMENTS;++i){let o=e[i],s=typeof t=="number"?t:t[i];this[i]=o+n*(s-o)}return this.check()}min(e){for(let t=0;t<this.ELEMENTS;++t)this[t]=Math.min(e[t],this[t]);return this.check()}max(e){for(let t=0;t<this.ELEMENTS;++t)this[t]=Math.max(e[t],this[t]);return this.check()}clamp(e,t){for(let n=0;n<this.ELEMENTS;++n)this[n]=Math.min(Math.max(this[n],e[n]),t[n]);return this.check()}add(...e){for(let t of e)for(let n=0;n<this.ELEMENTS;++n)this[n]+=t[n];return this.check()}subtract(...e){for(let t of e)for(let n=0;n<this.ELEMENTS;++n)this[n]-=t[n];return this.check()}scale(e){if(typeof e=="number")for(let t=0;t<this.ELEMENTS;++t)this[t]*=e;else for(let t=0;t<this.ELEMENTS&&t<e.length;++t)this[t]*=e[t];return this.check()}multiplyByScalar(e){for(let t=0;t<this.ELEMENTS;++t)this[t]*=e;return this.check()}check(){if(re.debug&&!this.validate())throw new Error(`math.gl: ${this.constructor.name} some fields set to invalid numbers'`);return this}validate(){let e=this.length===this.ELEMENTS;for(let t=0;t<this.ELEMENTS;++t)e=e&&Number.isFinite(this[t]);return e}sub(e){return this.subtract(e)}setScalar(e){for(let t=0;t<this.ELEMENTS;++t)this[t]=e;return this.check()}addScalar(e){for(let t=0;t<this.ELEMENTS;++t)this[t]+=e;return this.check()}subScalar(e){return this.addScalar(-e)}multiplyScalar(e){for(let t=0;t<this.ELEMENTS;++t)this[t]*=e;return this.check()}divideScalar(e){return this.multiplyByScalar(1/e)}clampScalar(e,t){for(let n=0;n<this.ELEMENTS;++n)this[n]=Math.min(Math.max(this[n],e),t);return this.check()}get elements(){return this}}});function JL(r,e){if(r.length!==e)return!1;for(let t=0;t<r.length;++t)if(!Number.isFinite(r[t]))return!1;return!0}function $(r){if(!Number.isFinite(r))throw new Error(`Invalid number ${JSON.stringify(r)}`);return r}function Xn(r,e,t=""){if(re.debug&&!JL(r,e))throw new Error(`math.gl: ${t} some fields set to invalid numbers'`);return r}var en=_(()=>{Jr()});function Hd(r,e){if(!r)throw new Error(`math.gl assertion ${e}`)}var Db=_(()=>{});var Kn,Yd=_(()=>{yc();en();Db();Kn=class extends mr{get x(){return this[0]}set x(e){this[0]=$(e)}get y(){return this[1]}set y(e){this[1]=$(e)}len(){return Math.sqrt(this.lengthSquared())}magnitude(){return this.len()}lengthSquared(){let e=0;for(let t=0;t<this.ELEMENTS;++t)e+=this[t]*this[t];return e}magnitudeSquared(){return this.lengthSquared()}distance(e){return Math.sqrt(this.distanceSquared(e))}distanceSquared(e){let t=0;for(let n=0;n<this.ELEMENTS;++n){let i=this[n]-e[n];t+=i*i}return $(t)}dot(e){let t=0;for(let n=0;n<this.ELEMENTS;++n)t+=this[n]*e[n];return $(t)}normalize(){let e=this.magnitude();if(e!==0)for(let t=0;t<this.ELEMENTS;++t)this[t]/=e;return this.check()}multiply(...e){for(let t of e)for(let n=0;n<this.ELEMENTS;++n)this[n]*=t[n];return this.check()}divide(...e){for(let t of e)for(let n=0;n<this.ELEMENTS;++n)this[n]/=t[n];return this.check()}lengthSq(){return this.lengthSquared()}distanceTo(e){return this.distance(e)}distanceToSquared(e){return this.distanceSquared(e)}getComponent(e){return Hd(e>=0&&e<this.ELEMENTS,"index is out of range"),$(this[e])}setComponent(e,t){return Hd(e>=0&&e<this.ELEMENTS,"index is out of range"),this[e]=t,this.check()}addVectors(e,t){return this.copy(e).add(t)}subVectors(e,t){return this.copy(e).subtract(t)}multiplyVectors(e,t){return this.copy(e).multiply(t)}addScaledVector(e,t){return this.add(new this.constructor(e).multiplyScalar(t))}}});function Ke(r){return r>=0?Math.round(r):r%.5===0?Math.floor(r):Math.round(r)}var Y,Pt,mj,tn=_(()=>{Y=typeof Float32Array<"u"?Float32Array:Array,Pt=Math.random;mj=Math.PI/180});var rt={};Ut(rt,{add:()=>iA,angle:()=>EA,ceil:()=>oA,clone:()=>eA,copy:()=>rA,create:()=>kb,cross:()=>gA,dist:()=>IA,distance:()=>Gb,div:()=>RA,divide:()=>Ub,dot:()=>mA,equals:()=>LA,exactEquals:()=>TA,floor:()=>sA,forEach:()=>DA,fromValues:()=>tA,inverse:()=>hA,len:()=>AA,length:()=>$b,lerp:()=>_A,max:()=>cA,min:()=>aA,mul:()=>MA,multiply:()=>Fb,negate:()=>dA,normalize:()=>pA,random:()=>yA,rotate:()=>wA,round:()=>lA,scale:()=>uA,scaleAndAdd:()=>fA,set:()=>nA,sqrDist:()=>OA,sqrLen:()=>BA,squaredDistance:()=>zb,squaredLength:()=>Vb,str:()=>SA,sub:()=>CA,subtract:()=>Nb,transformMat2:()=>bA,transformMat2d:()=>xA,transformMat3:()=>vA,transformMat4:()=>qd,zero:()=>PA});function kb(){let r=new Y(2);return Y!=Float32Array&&(r[0]=0,r[1]=0),r}function eA(r){let e=new Y(2);return e[0]=r[0],e[1]=r[1],e}function tA(r,e){let t=new Y(2);return t[0]=r,t[1]=e,t}function rA(r,e){return r[0]=e[0],r[1]=e[1],r}function nA(r,e,t){return r[0]=e,r[1]=t,r}function iA(r,e,t){return r[0]=e[0]+t[0],r[1]=e[1]+t[1],r}function Nb(r,e,t){return r[0]=e[0]-t[0],r[1]=e[1]-t[1],r}function Fb(r,e,t){return r[0]=e[0]*t[0],r[1]=e[1]*t[1],r}function Ub(r,e,t){return r[0]=e[0]/t[0],r[1]=e[1]/t[1],r}function oA(r,e){return r[0]=Math.ceil(e[0]),r[1]=Math.ceil(e[1]),r}function sA(r,e){return r[0]=Math.floor(e[0]),r[1]=Math.floor(e[1]),r}function aA(r,e,t){return r[0]=Math.min(e[0],t[0]),r[1]=Math.min(e[1],t[1]),r}function cA(r,e,t){return r[0]=Math.max(e[0],t[0]),r[1]=Math.max(e[1],t[1]),r}function lA(r,e){return r[0]=Ke(e[0]),r[1]=Ke(e[1]),r}function uA(r,e,t){return r[0]=e[0]*t,r[1]=e[1]*t,r}function fA(r,e,t,n){return r[0]=e[0]+t[0]*n,r[1]=e[1]+t[1]*n,r}function Gb(r,e){let t=e[0]-r[0],n=e[1]-r[1];return Math.sqrt(t*t+n*n)}function zb(r,e){let t=e[0]-r[0],n=e[1]-r[1];return t*t+n*n}function $b(r){let e=r[0],t=r[1];return Math.sqrt(e*e+t*t)}function Vb(r){let e=r[0],t=r[1];return e*e+t*t}function dA(r,e){return r[0]=-e[0],r[1]=-e[1],r}function hA(r,e){return r[0]=1/e[0],r[1]=1/e[1],r}function pA(r,e){let t=e[0],n=e[1],i=t*t+n*n;return i>0&&(i=1/Math.sqrt(i)),r[0]=e[0]*i,r[1]=e[1]*i,r}function mA(r,e){return r[0]*e[0]+r[1]*e[1]}function gA(r,e,t){let n=e[0]*t[1]-e[1]*t[0];return r[0]=r[1]=0,r[2]=n,r}function _A(r,e,t,n){let i=e[0],o=e[1];return r[0]=i+n*(t[0]-i),r[1]=o+n*(t[1]-o),r}function yA(r,e){e=e===void 0?1:e;let t=Pt()*2*Math.PI;return r[0]=Math.cos(t)*e,r[1]=Math.sin(t)*e,r}function bA(r,e,t){let n=e[0],i=e[1];return r[0]=t[0]*n+t[2]*i,r[1]=t[1]*n+t[3]*i,r}function xA(r,e,t){let n=e[0],i=e[1];return r[0]=t[0]*n+t[2]*i+t[4],r[1]=t[1]*n+t[3]*i+t[5],r}function vA(r,e,t){let n=e[0],i=e[1];return r[0]=t[0]*n+t[3]*i+t[6],r[1]=t[1]*n+t[4]*i+t[7],r}function qd(r,e,t){let n=e[0],i=e[1];return r[0]=t[0]*n+t[4]*i+t[12],r[1]=t[1]*n+t[5]*i+t[13],r}function wA(r,e,t,n){let i=e[0]-t[0],o=e[1]-t[1],s=Math.sin(n),a=Math.cos(n);return r[0]=i*a-o*s+t[0],r[1]=i*s+o*a+t[1],r}function EA(r,e){let t=r[0],n=r[1],i=e[0],o=e[1],s=Math.sqrt((t*t+n*n)*(i*i+o*o)),a=s&&(t*i+n*o)/s;return Math.acos(Math.min(Math.max(a,-1),1))}function PA(r){return r[0]=0,r[1]=0,r}function SA(r){return`vec2(${r[0]}, ${r[1]})`}function TA(r,e){return r[0]===e[0]&&r[1]===e[1]}function LA(r,e){let t=r[0],n=r[1],i=e[0],o=e[1];return Math.abs(t-i)<=1e-6*Math.max(1,Math.abs(t),Math.abs(i))&&Math.abs(n-o)<=1e-6*Math.max(1,Math.abs(n),Math.abs(o))}var AA,CA,MA,RA,IA,OA,BA,DA,Zd=_(()=>{tn();AA=$b,CA=Nb,MA=Fb,RA=Ub,IA=Gb,OA=zb,BA=Vb,DA=(function(){let r=kb();return function(e,t,n,i,o,s){let a,c;for(t||(t=2),n||(n=0),i?c=Math.min(i*t+n,e.length):c=e.length,a=n;a<c;a+=t)r[0]=e[a],r[1]=e[a+1],o(r,r,s),e[a]=r[0],e[a+1]=r[1];return e}})()});function Wb(r,e,t){let n=e[0],i=e[1],o=t[3]*n+t[7]*i||1;return r[0]=(t[0]*n+t[4]*i)/o,r[1]=(t[1]*n+t[5]*i)/o,r}function bc(r,e,t){let n=e[0],i=e[1],o=e[2],s=t[3]*n+t[7]*i+t[11]*o||1;return r[0]=(t[0]*n+t[4]*i+t[8]*o)/s,r[1]=(t[1]*n+t[5]*i+t[9]*o)/s,r[2]=(t[2]*n+t[6]*i+t[10]*o)/s,r}function jb(r,e,t){let n=e[0],i=e[1];return r[0]=t[0]*n+t[2]*i,r[1]=t[1]*n+t[3]*i,r[2]=e[2],r}function Hb(r,e,t){let n=e[0],i=e[1];return r[0]=t[0]*n+t[2]*i,r[1]=t[1]*n+t[3]*i,r[2]=e[2],r[3]=e[3],r}function Yb(r,e,t){let n=e[0],i=e[1],o=e[2];return r[0]=t[0]*n+t[3]*i+t[6]*o,r[1]=t[1]*n+t[4]*i+t[7]*o,r[2]=t[2]*n+t[5]*i+t[8]*o,r[3]=e[3],r}var xc=_(()=>{});var W={};Ut(W,{add:()=>UA,angle:()=>th,bezier:()=>QA,ceil:()=>GA,clone:()=>kA,copy:()=>NA,create:()=>vc,cross:()=>rn,dist:()=>aC,distance:()=>Qb,div:()=>sC,divide:()=>Kb,dot:()=>Uo,equals:()=>nC,exactEquals:()=>rC,floor:()=>zA,forEach:()=>uC,fromValues:()=>wc,hermite:()=>KA,inverse:()=>qA,len:()=>rh,length:()=>qb,lerp:()=>ZA,max:()=>VA,min:()=>$A,mul:()=>oC,multiply:()=>Xb,negate:()=>YA,normalize:()=>Xd,random:()=>JA,rotateX:()=>Qd,rotateY:()=>Jd,rotateZ:()=>eh,round:()=>WA,scale:()=>jA,scaleAndAdd:()=>HA,set:()=>FA,slerp:()=>XA,sqrDist:()=>cC,sqrLen:()=>lC,squaredDistance:()=>Jb,squaredLength:()=>ex,str:()=>tC,sub:()=>iC,subtract:()=>Zb,transformMat3:()=>Kd,transformMat4:()=>nn,transformQuat:()=>Go,zero:()=>eC});function vc(){let r=new Y(3);return Y!=Float32Array&&(r[0]=0,r[1]=0,r[2]=0),r}function kA(r){let e=new Y(3);return e[0]=r[0],e[1]=r[1],e[2]=r[2],e}function qb(r){let e=r[0],t=r[1],n=r[2];return Math.sqrt(e*e+t*t+n*n)}function wc(r,e,t){let n=new Y(3);return n[0]=r,n[1]=e,n[2]=t,n}function NA(r,e){return r[0]=e[0],r[1]=e[1],r[2]=e[2],r}function FA(r,e,t,n){return r[0]=e,r[1]=t,r[2]=n,r}function UA(r,e,t){return r[0]=e[0]+t[0],r[1]=e[1]+t[1],r[2]=e[2]+t[2],r}function Zb(r,e,t){return r[0]=e[0]-t[0],r[1]=e[1]-t[1],r[2]=e[2]-t[2],r}function Xb(r,e,t){return r[0]=e[0]*t[0],r[1]=e[1]*t[1],r[2]=e[2]*t[2],r}function Kb(r,e,t){return r[0]=e[0]/t[0],r[1]=e[1]/t[1],r[2]=e[2]/t[2],r}function GA(r,e){return r[0]=Math.ceil(e[0]),r[1]=Math.ceil(e[1]),r[2]=Math.ceil(e[2]),r}function zA(r,e){return r[0]=Math.floor(e[0]),r[1]=Math.floor(e[1]),r[2]=Math.floor(e[2]),r}function $A(r,e,t){return r[0]=Math.min(e[0],t[0]),r[1]=Math.min(e[1],t[1]),r[2]=Math.min(e[2],t[2]),r}function VA(r,e,t){return r[0]=Math.max(e[0],t[0]),r[1]=Math.max(e[1],t[1]),r[2]=Math.max(e[2],t[2]),r}function WA(r,e){return r[0]=Ke(e[0]),r[1]=Ke(e[1]),r[2]=Ke(e[2]),r}function jA(r,e,t){return r[0]=e[0]*t,r[1]=e[1]*t,r[2]=e[2]*t,r}function HA(r,e,t,n){return r[0]=e[0]+t[0]*n,r[1]=e[1]+t[1]*n,r[2]=e[2]+t[2]*n,r}function Qb(r,e){let t=e[0]-r[0],n=e[1]-r[1],i=e[2]-r[2];return Math.sqrt(t*t+n*n+i*i)}function Jb(r,e){let t=e[0]-r[0],n=e[1]-r[1],i=e[2]-r[2];return t*t+n*n+i*i}function ex(r){let e=r[0],t=r[1],n=r[2];return e*e+t*t+n*n}function YA(r,e){return r[0]=-e[0],r[1]=-e[1],r[2]=-e[2],r}function qA(r,e){return r[0]=1/e[0],r[1]=1/e[1],r[2]=1/e[2],r}function Xd(r,e){let t=e[0],n=e[1],i=e[2],o=t*t+n*n+i*i;return o>0&&(o=1/Math.sqrt(o)),r[0]=e[0]*o,r[1]=e[1]*o,r[2]=e[2]*o,r}function Uo(r,e){return r[0]*e[0]+r[1]*e[1]+r[2]*e[2]}function rn(r,e,t){let n=e[0],i=e[1],o=e[2],s=t[0],a=t[1],c=t[2];return r[0]=i*c-o*a,r[1]=o*s-n*c,r[2]=n*a-i*s,r}function ZA(r,e,t,n){let i=e[0],o=e[1],s=e[2];return r[0]=i+n*(t[0]-i),r[1]=o+n*(t[1]-o),r[2]=s+n*(t[2]-s),r}function XA(r,e,t,n){let i=Math.acos(Math.min(Math.max(Uo(e,t),-1),1)),o=Math.sin(i),s=Math.sin((1-n)*i)/o,a=Math.sin(n*i)/o;return r[0]=s*e[0]+a*t[0],r[1]=s*e[1]+a*t[1],r[2]=s*e[2]+a*t[2],r}function KA(r,e,t,n,i,o){let s=o*o,a=s*(2*o-3)+1,c=s*(o-2)+o,l=s*(o-1),u=s*(3-2*o);return r[0]=e[0]*a+t[0]*c+n[0]*l+i[0]*u,r[1]=e[1]*a+t[1]*c+n[1]*l+i[1]*u,r[2]=e[2]*a+t[2]*c+n[2]*l+i[2]*u,r}function QA(r,e,t,n,i,o){let s=1-o,a=s*s,c=o*o,l=a*s,u=3*o*a,f=3*c*s,d=c*o;return r[0]=e[0]*l+t[0]*u+n[0]*f+i[0]*d,r[1]=e[1]*l+t[1]*u+n[1]*f+i[1]*d,r[2]=e[2]*l+t[2]*u+n[2]*f+i[2]*d,r}function JA(r,e){e=e===void 0?1:e;let t=Pt()*2*Math.PI,n=Pt()*2-1,i=Math.sqrt(1-n*n)*e;return r[0]=Math.cos(t)*i,r[1]=Math.sin(t)*i,r[2]=n*e,r}function nn(r,e,t){let n=e[0],i=e[1],o=e[2],s=t[3]*n+t[7]*i+t[11]*o+t[15];return s=s||1,r[0]=(t[0]*n+t[4]*i+t[8]*o+t[12])/s,r[1]=(t[1]*n+t[5]*i+t[9]*o+t[13])/s,r[2]=(t[2]*n+t[6]*i+t[10]*o+t[14])/s,r}function Kd(r,e,t){let n=e[0],i=e[1],o=e[2];return r[0]=n*t[0]+i*t[3]+o*t[6],r[1]=n*t[1]+i*t[4]+o*t[7],r[2]=n*t[2]+i*t[5]+o*t[8],r}function Go(r,e,t){let n=t[0],i=t[1],o=t[2],s=t[3],a=e[0],c=e[1],l=e[2],u=i*l-o*c,f=o*a-n*l,d=n*c-i*a,h=i*d-o*f,p=o*u-n*d,m=n*f-i*u,g=s*2;return u*=g,f*=g,d*=g,h*=2,p*=2,m*=2,r[0]=a+u+h,r[1]=c+f+p,r[2]=l+d+m,r}function Qd(r,e,t,n){let i=[],o=[];return i[0]=e[0]-t[0],i[1]=e[1]-t[1],i[2]=e[2]-t[2],o[0]=i[0],o[1]=i[1]*Math.cos(n)-i[2]*Math.sin(n),o[2]=i[1]*Math.sin(n)+i[2]*Math.cos(n),r[0]=o[0]+t[0],r[1]=o[1]+t[1],r[2]=o[2]+t[2],r}function Jd(r,e,t,n){let i=[],o=[];return i[0]=e[0]-t[0],i[1]=e[1]-t[1],i[2]=e[2]-t[2],o[0]=i[2]*Math.sin(n)+i[0]*Math.cos(n),o[1]=i[1],o[2]=i[2]*Math.cos(n)-i[0]*Math.sin(n),r[0]=o[0]+t[0],r[1]=o[1]+t[1],r[2]=o[2]+t[2],r}function eh(r,e,t,n){let i=[],o=[];return i[0]=e[0]-t[0],i[1]=e[1]-t[1],i[2]=e[2]-t[2],o[0]=i[0]*Math.cos(n)-i[1]*Math.sin(n),o[1]=i[0]*Math.sin(n)+i[1]*Math.cos(n),o[2]=i[2],r[0]=o[0]+t[0],r[1]=o[1]+t[1],r[2]=o[2]+t[2],r}function th(r,e){let t=r[0],n=r[1],i=r[2],o=e[0],s=e[1],a=e[2],c=Math.sqrt((t*t+n*n+i*i)*(o*o+s*s+a*a)),l=c&&Uo(r,e)/c;return Math.acos(Math.min(Math.max(l,-1),1))}function eC(r){return r[0]=0,r[1]=0,r[2]=0,r}function tC(r){return`vec3(${r[0]}, ${r[1]}, ${r[2]})`}function rC(r,e){return r[0]===e[0]&&r[1]===e[1]&&r[2]===e[2]}function nC(r,e){let t=r[0],n=r[1],i=r[2],o=e[0],s=e[1],a=e[2];return Math.abs(t-o)<=1e-6*Math.max(1,Math.abs(t),Math.abs(o))&&Math.abs(n-s)<=1e-6*Math.max(1,Math.abs(n),Math.abs(s))&&Math.abs(i-a)<=1e-6*Math.max(1,Math.abs(i),Math.abs(a))}var iC,oC,sC,aC,cC,rh,lC,uC,Jn=_(()=>{tn();iC=Zb,oC=Xb,sC=Kb,aC=Qb,cC=Jb,rh=qb,lC=ex,uC=(function(){let r=vc();return function(e,t,n,i,o,s){let a,c;for(t||(t=3),n||(n=0),i?c=Math.min(i*t+n,e.length):c=e.length,a=n;a<c;a+=t)r[0]=e[a],r[1]=e[a+1],r[2]=e[a+2],o(r,r,s),e[a]=r[0],e[a+1]=r[1],e[a+2]=r[2];return e}})()});var nh,Ec,pe,tx=_(()=>{Yd();Jr();en();Jn();xc();nh=[0,0,0],pe=class r extends Kn{static get ZERO(){return Ec||(Ec=new r(0,0,0),Object.freeze(Ec)),Ec}constructor(e=0,t=0,n=0){super(-0,-0,-0),arguments.length===1&&tt(e)?this.copy(e):(re.debug&&($(e),$(t),$(n)),this[0]=e,this[1]=t,this[2]=n)}set(e,t,n){return this[0]=e,this[1]=t,this[2]=n,this.check()}copy(e){return this[0]=e[0],this[1]=e[1],this[2]=e[2],this.check()}fromObject(e){return re.debug&&($(e.x),$(e.y),$(e.z)),this[0]=e.x,this[1]=e.y,this[2]=e.z,this.check()}toObject(e){return e.x=this[0],e.y=this[1],e.z=this[2],e}get ELEMENTS(){return 3}get z(){return this[2]}set z(e){this[2]=$(e)}angle(e){return th(this,e)}cross(e){return rn(this,this,e),this.check()}rotateX({radians:e,origin:t=nh}){return Qd(this,this,t,e),this.check()}rotateY({radians:e,origin:t=nh}){return Jd(this,this,t,e),this.check()}rotateZ({radians:e,origin:t=nh}){return eh(this,this,t,e),this.check()}transform(e){return this.transformAsPoint(e)}transformAsPoint(e){return nn(this,this,e),this.check()}transformAsVector(e){return bc(this,this,e),this.check()}transformByMatrix3(e){return Kd(this,this,e),this.check()}transformByMatrix2(e){return jb(this,this,e),this.check()}transformByQuaternion(e){return Go(this,this,e),this.check()}}});var Pc,Sc,rx=_(()=>{Jn();xc();Yd();Jr();en();Sc=class r extends Kn{static get ZERO(){return Pc||(Pc=new r(0,0,0,0),Object.freeze(Pc)),Pc}constructor(e=0,t=0,n=0,i=0){super(-0,-0,-0,-0),tt(e)&&arguments.length===1?this.copy(e):(re.debug&&($(e),$(t),$(n),$(i)),this[0]=e,this[1]=t,this[2]=n,this[3]=i)}set(e,t,n,i){return this[0]=e,this[1]=t,this[2]=n,this[3]=i,this.check()}copy(e){return this[0]=e[0],this[1]=e[1],this[2]=e[2],this[3]=e[3],this.check()}fromObject(e){return re.debug&&($(e.x),$(e.y),$(e.z),$(e.w)),this[0]=e.x,this[1]=e.y,this[2]=e.z,this[3]=e.w,this}toObject(e){return e.x=this[0],e.y=this[1],e.z=this[2],e.w=this[3],e}get ELEMENTS(){return 4}get z(){return this[2]}set z(e){this[2]=$(e)}get w(){return this[3]}set w(e){this[3]=$(e)}transform(e){return nn(this,this,e),this.check()}transformByMatrix3(e){return Yb(this,this,e),this.check()}transformByMatrix2(e){return Hb(this,this,e),this.check()}transformByQuaternion(e){return Go(this,this,e),this.check()}applyMatrix4(e){return e.transform(this,this),this}}});var Tc,nx=_(()=>{yc();en();Jr();Tc=class extends mr{toString(){let e="[";if(re.printRowMajor){e+="row-major:";for(let t=0;t<this.RANK;++t)for(let n=0;n<this.RANK;++n)e+=` ${this[n*this.RANK+t]}`}else{e+="column-major:";for(let t=0;t<this.ELEMENTS;++t)e+=` ${this[t]}`}return e+="]",e}getElementIndex(e,t){return t*this.RANK+e}getElement(e,t){return this[t*this.RANK+e]}setElement(e,t,n){return this[t*this.RANK+e]=$(n),this}getColumn(e,t=new Array(this.RANK).fill(-0)){let n=e*this.RANK;for(let i=0;i<this.RANK;++i)t[i]=this[n+i];return t}setColumn(e,t){let n=e*this.RANK;for(let i=0;i<this.RANK;++i)this[n+i]=t[i];return this}}});function ix(){let r=new Y(9);return Y!=Float32Array&&(r[1]=0,r[2]=0,r[3]=0,r[5]=0,r[6]=0,r[7]=0),r[0]=1,r[4]=1,r[8]=1,r}var ih=_(()=>{tn()});var ae={};Ut(ae,{add:()=>DC,adjoint:()=>gC,clone:()=>dC,copy:()=>hC,create:()=>fC,decompose:()=>TC,determinant:()=>ah,equals:()=>UC,exactEquals:()=>FC,frob:()=>BC,fromQuat:()=>ph,fromQuat2:()=>EC,fromRotation:()=>bC,fromRotationTranslation:()=>ax,fromRotationTranslationScale:()=>LC,fromRotationTranslationScaleOrigin:()=>AC,fromScaling:()=>yC,fromTranslation:()=>_C,fromValues:()=>pC,fromXRotation:()=>xC,fromYRotation:()=>vC,fromZRotation:()=>wC,frustum:()=>mh,getRotation:()=>SC,getScaling:()=>cx,getTranslation:()=>PC,identity:()=>sx,invert:()=>sh,lookAt:()=>yh,mul:()=>GC,multiply:()=>zo,multiplyScalar:()=>kC,multiplyScalarAndAdd:()=>NC,ortho:()=>_h,orthoNO:()=>ux,orthoZO:()=>RC,perspective:()=>gh,perspectiveFromFieldOfView:()=>MC,perspectiveNO:()=>lx,perspectiveZO:()=>CC,rotate:()=>uh,rotateX:()=>fh,rotateY:()=>dh,rotateZ:()=>hh,scale:()=>lh,set:()=>mC,str:()=>OC,sub:()=>zC,subtract:()=>fx,targetTo:()=>IC,translate:()=>ch,transpose:()=>oh});function fC(){let r=new Y(16);return Y!=Float32Array&&(r[1]=0,r[2]=0,r[3]=0,r[4]=0,r[6]=0,r[7]=0,r[8]=0,r[9]=0,r[11]=0,r[12]=0,r[13]=0,r[14]=0),r[0]=1,r[5]=1,r[10]=1,r[15]=1,r}function dC(r){let e=new Y(16);return e[0]=r[0],e[1]=r[1],e[2]=r[2],e[3]=r[3],e[4]=r[4],e[5]=r[5],e[6]=r[6],e[7]=r[7],e[8]=r[8],e[9]=r[9],e[10]=r[10],e[11]=r[11],e[12]=r[12],e[13]=r[13],e[14]=r[14],e[15]=r[15],e}function hC(r,e){return r[0]=e[0],r[1]=e[1],r[2]=e[2],r[3]=e[3],r[4]=e[4],r[5]=e[5],r[6]=e[6],r[7]=e[7],r[8]=e[8],r[9]=e[9],r[10]=e[10],r[11]=e[11],r[12]=e[12],r[13]=e[13],r[14]=e[14],r[15]=e[15],r}function pC(r,e,t,n,i,o,s,a,c,l,u,f,d,h,p,m){let g=new Y(16);return g[0]=r,g[1]=e,g[2]=t,g[3]=n,g[4]=i,g[5]=o,g[6]=s,g[7]=a,g[8]=c,g[9]=l,g[10]=u,g[11]=f,g[12]=d,g[13]=h,g[14]=p,g[15]=m,g}function mC(r,e,t,n,i,o,s,a,c,l,u,f,d,h,p,m,g){return r[0]=e,r[1]=t,r[2]=n,r[3]=i,r[4]=o,r[5]=s,r[6]=a,r[7]=c,r[8]=l,r[9]=u,r[10]=f,r[11]=d,r[12]=h,r[13]=p,r[14]=m,r[15]=g,r}function sx(r){return r[0]=1,r[1]=0,r[2]=0,r[3]=0,r[4]=0,r[5]=1,r[6]=0,r[7]=0,r[8]=0,r[9]=0,r[10]=1,r[11]=0,r[12]=0,r[13]=0,r[14]=0,r[15]=1,r}function oh(r,e){if(r===e){let t=e[1],n=e[2],i=e[3],o=e[6],s=e[7],a=e[11];r[1]=e[4],r[2]=e[8],r[3]=e[12],r[4]=t,r[6]=e[9],r[7]=e[13],r[8]=n,r[9]=o,r[11]=e[14],r[12]=i,r[13]=s,r[14]=a}else r[0]=e[0],r[1]=e[4],r[2]=e[8],r[3]=e[12],r[4]=e[1],r[5]=e[5],r[6]=e[9],r[7]=e[13],r[8]=e[2],r[9]=e[6],r[10]=e[10],r[11]=e[14],r[12]=e[3],r[13]=e[7],r[14]=e[11],r[15]=e[15];return r}function sh(r,e){let t=e[0],n=e[1],i=e[2],o=e[3],s=e[4],a=e[5],c=e[6],l=e[7],u=e[8],f=e[9],d=e[10],h=e[11],p=e[12],m=e[13],g=e[14],b=e[15],y=t*a-n*s,x=t*c-i*s,v=t*l-o*s,w=n*c-i*a,E=n*l-o*a,T=i*l-o*c,L=u*m-f*p,C=u*g-d*p,S=u*b-h*p,k=f*g-d*m,R=f*b-h*m,M=d*b-h*g,N=y*M-x*R+v*k+w*S-E*C+T*L;return N?(N=1/N,r[0]=(a*M-c*R+l*k)*N,r[1]=(i*R-n*M-o*k)*N,r[2]=(m*T-g*E+b*w)*N,r[3]=(d*E-f*T-h*w)*N,r[4]=(c*S-s*M-l*C)*N,r[5]=(t*M-i*S+o*C)*N,r[6]=(g*v-p*T-b*x)*N,r[7]=(u*T-d*v+h*x)*N,r[8]=(s*R-a*S+l*L)*N,r[9]=(n*S-t*R-o*L)*N,r[10]=(p*E-m*v+b*y)*N,r[11]=(f*v-u*E-h*y)*N,r[12]=(a*C-s*k-c*L)*N,r[13]=(t*k-n*C+i*L)*N,r[14]=(m*x-p*w-g*y)*N,r[15]=(u*w-f*x+d*y)*N,r):null}function gC(r,e){let t=e[0],n=e[1],i=e[2],o=e[3],s=e[4],a=e[5],c=e[6],l=e[7],u=e[8],f=e[9],d=e[10],h=e[11],p=e[12],m=e[13],g=e[14],b=e[15],y=t*a-n*s,x=t*c-i*s,v=t*l-o*s,w=n*c-i*a,E=n*l-o*a,T=i*l-o*c,L=u*m-f*p,C=u*g-d*p,S=u*b-h*p,k=f*g-d*m,R=f*b-h*m,M=d*b-h*g;return r[0]=a*M-c*R+l*k,r[1]=i*R-n*M-o*k,r[2]=m*T-g*E+b*w,r[3]=d*E-f*T-h*w,r[4]=c*S-s*M-l*C,r[5]=t*M-i*S+o*C,r[6]=g*v-p*T-b*x,r[7]=u*T-d*v+h*x,r[8]=s*R-a*S+l*L,r[9]=n*S-t*R-o*L,r[10]=p*E-m*v+b*y,r[11]=f*v-u*E-h*y,r[12]=a*C-s*k-c*L,r[13]=t*k-n*C+i*L,r[14]=m*x-p*w-g*y,r[15]=u*w-f*x+d*y,r}function ah(r){let e=r[0],t=r[1],n=r[2],i=r[3],o=r[4],s=r[5],a=r[6],c=r[7],l=r[8],u=r[9],f=r[10],d=r[11],h=r[12],p=r[13],m=r[14],g=r[15],b=e*s-t*o,y=e*a-n*o,x=t*a-n*s,v=l*p-u*h,w=l*m-f*h,E=u*m-f*p,T=e*E-t*w+n*v,L=o*E-s*w+a*v,C=l*x-u*y+f*b,S=h*x-p*y+m*b;return c*T-i*L+g*C-d*S}function zo(r,e,t){let n=e[0],i=e[1],o=e[2],s=e[3],a=e[4],c=e[5],l=e[6],u=e[7],f=e[8],d=e[9],h=e[10],p=e[11],m=e[12],g=e[13],b=e[14],y=e[15],x=t[0],v=t[1],w=t[2],E=t[3];return r[0]=x*n+v*a+w*f+E*m,r[1]=x*i+v*c+w*d+E*g,r[2]=x*o+v*l+w*h+E*b,r[3]=x*s+v*u+w*p+E*y,x=t[4],v=t[5],w=t[6],E=t[7],r[4]=x*n+v*a+w*f+E*m,r[5]=x*i+v*c+w*d+E*g,r[6]=x*o+v*l+w*h+E*b,r[7]=x*s+v*u+w*p+E*y,x=t[8],v=t[9],w=t[10],E=t[11],r[8]=x*n+v*a+w*f+E*m,r[9]=x*i+v*c+w*d+E*g,r[10]=x*o+v*l+w*h+E*b,r[11]=x*s+v*u+w*p+E*y,x=t[12],v=t[13],w=t[14],E=t[15],r[12]=x*n+v*a+w*f+E*m,r[13]=x*i+v*c+w*d+E*g,r[14]=x*o+v*l+w*h+E*b,r[15]=x*s+v*u+w*p+E*y,r}function ch(r,e,t){let n=t[0],i=t[1],o=t[2],s,a,c,l,u,f,d,h,p,m,g,b;return e===r?(r[12]=e[0]*n+e[4]*i+e[8]*o+e[12],r[13]=e[1]*n+e[5]*i+e[9]*o+e[13],r[14]=e[2]*n+e[6]*i+e[10]*o+e[14],r[15]=e[3]*n+e[7]*i+e[11]*o+e[15]):(s=e[0],a=e[1],c=e[2],l=e[3],u=e[4],f=e[5],d=e[6],h=e[7],p=e[8],m=e[9],g=e[10],b=e[11],r[0]=s,r[1]=a,r[2]=c,r[3]=l,r[4]=u,r[5]=f,r[6]=d,r[7]=h,r[8]=p,r[9]=m,r[10]=g,r[11]=b,r[12]=s*n+u*i+p*o+e[12],r[13]=a*n+f*i+m*o+e[13],r[14]=c*n+d*i+g*o+e[14],r[15]=l*n+h*i+b*o+e[15]),r}function lh(r,e,t){let n=t[0],i=t[1],o=t[2];return r[0]=e[0]*n,r[1]=e[1]*n,r[2]=e[2]*n,r[3]=e[3]*n,r[4]=e[4]*i,r[5]=e[5]*i,r[6]=e[6]*i,r[7]=e[7]*i,r[8]=e[8]*o,r[9]=e[9]*o,r[10]=e[10]*o,r[11]=e[11]*o,r[12]=e[12],r[13]=e[13],r[14]=e[14],r[15]=e[15],r}function uh(r,e,t,n){let i=n[0],o=n[1],s=n[2],a=Math.sqrt(i*i+o*o+s*s),c,l,u,f,d,h,p,m,g,b,y,x,v,w,E,T,L,C,S,k,R,M,N,Q;return a<1e-6?null:(a=1/a,i*=a,o*=a,s*=a,l=Math.sin(t),c=Math.cos(t),u=1-c,f=e[0],d=e[1],h=e[2],p=e[3],m=e[4],g=e[5],b=e[6],y=e[7],x=e[8],v=e[9],w=e[10],E=e[11],T=i*i*u+c,L=o*i*u+s*l,C=s*i*u-o*l,S=i*o*u-s*l,k=o*o*u+c,R=s*o*u+i*l,M=i*s*u+o*l,N=o*s*u-i*l,Q=s*s*u+c,r[0]=f*T+m*L+x*C,r[1]=d*T+g*L+v*C,r[2]=h*T+b*L+w*C,r[3]=p*T+y*L+E*C,r[4]=f*S+m*k+x*R,r[5]=d*S+g*k+v*R,r[6]=h*S+b*k+w*R,r[7]=p*S+y*k+E*R,r[8]=f*M+m*N+x*Q,r[9]=d*M+g*N+v*Q,r[10]=h*M+b*N+w*Q,r[11]=p*M+y*N+E*Q,e!==r&&(r[12]=e[12],r[13]=e[13],r[14]=e[14],r[15]=e[15]),r)}function fh(r,e,t){let n=Math.sin(t),i=Math.cos(t),o=e[4],s=e[5],a=e[6],c=e[7],l=e[8],u=e[9],f=e[10],d=e[11];return e!==r&&(r[0]=e[0],r[1]=e[1],r[2]=e[2],r[3]=e[3],r[12]=e[12],r[13]=e[13],r[14]=e[14],r[15]=e[15]),r[4]=o*i+l*n,r[5]=s*i+u*n,r[6]=a*i+f*n,r[7]=c*i+d*n,r[8]=l*i-o*n,r[9]=u*i-s*n,r[10]=f*i-a*n,r[11]=d*i-c*n,r}function dh(r,e,t){let n=Math.sin(t),i=Math.cos(t),o=e[0],s=e[1],a=e[2],c=e[3],l=e[8],u=e[9],f=e[10],d=e[11];return e!==r&&(r[4]=e[4],r[5]=e[5],r[6]=e[6],r[7]=e[7],r[12]=e[12],r[13]=e[13],r[14]=e[14],r[15]=e[15]),r[0]=o*i-l*n,r[1]=s*i-u*n,r[2]=a*i-f*n,r[3]=c*i-d*n,r[8]=o*n+l*i,r[9]=s*n+u*i,r[10]=a*n+f*i,r[11]=c*n+d*i,r}function hh(r,e,t){let n=Math.sin(t),i=Math.cos(t),o=e[0],s=e[1],a=e[2],c=e[3],l=e[4],u=e[5],f=e[6],d=e[7];return e!==r&&(r[8]=e[8],r[9]=e[9],r[10]=e[10],r[11]=e[11],r[12]=e[12],r[13]=e[13],r[14]=e[14],r[15]=e[15]),r[0]=o*i+l*n,r[1]=s*i+u*n,r[2]=a*i+f*n,r[3]=c*i+d*n,r[4]=l*i-o*n,r[5]=u*i-s*n,r[6]=f*i-a*n,r[7]=d*i-c*n,r}function _C(r,e){return r[0]=1,r[1]=0,r[2]=0,r[3]=0,r[4]=0,r[5]=1,r[6]=0,r[7]=0,r[8]=0,r[9]=0,r[10]=1,r[11]=0,r[12]=e[0],r[13]=e[1],r[14]=e[2],r[15]=1,r}function yC(r,e){return r[0]=e[0],r[1]=0,r[2]=0,r[3]=0,r[4]=0,r[5]=e[1],r[6]=0,r[7]=0,r[8]=0,r[9]=0,r[10]=e[2],r[11]=0,r[12]=0,r[13]=0,r[14]=0,r[15]=1,r}function bC(r,e,t){let n=t[0],i=t[1],o=t[2],s=Math.sqrt(n*n+i*i+o*o),a,c,l;return s<1e-6?null:(s=1/s,n*=s,i*=s,o*=s,c=Math.sin(e),a=Math.cos(e),l=1-a,r[0]=n*n*l+a,r[1]=i*n*l+o*c,r[2]=o*n*l-i*c,r[3]=0,r[4]=n*i*l-o*c,r[5]=i*i*l+a,r[6]=o*i*l+n*c,r[7]=0,r[8]=n*o*l+i*c,r[9]=i*o*l-n*c,r[10]=o*o*l+a,r[11]=0,r[12]=0,r[13]=0,r[14]=0,r[15]=1,r)}function xC(r,e){let t=Math.sin(e),n=Math.cos(e);return r[0]=1,r[1]=0,r[2]=0,r[3]=0,r[4]=0,r[5]=n,r[6]=t,r[7]=0,r[8]=0,r[9]=-t,r[10]=n,r[11]=0,r[12]=0,r[13]=0,r[14]=0,r[15]=1,r}function vC(r,e){let t=Math.sin(e),n=Math.cos(e);return r[0]=n,r[1]=0,r[2]=-t,r[3]=0,r[4]=0,r[5]=1,r[6]=0,r[7]=0,r[8]=t,r[9]=0,r[10]=n,r[11]=0,r[12]=0,r[13]=0,r[14]=0,r[15]=1,r}function wC(r,e){let t=Math.sin(e),n=Math.cos(e);return r[0]=n,r[1]=t,r[2]=0,r[3]=0,r[4]=-t,r[5]=n,r[6]=0,r[7]=0,r[8]=0,r[9]=0,r[10]=1,r[11]=0,r[12]=0,r[13]=0,r[14]=0,r[15]=1,r}function ax(r,e,t){let n=e[0],i=e[1],o=e[2],s=e[3],a=n+n,c=i+i,l=o+o,u=n*a,f=n*c,d=n*l,h=i*c,p=i*l,m=o*l,g=s*a,b=s*c,y=s*l;return r[0]=1-(h+m),r[1]=f+y,r[2]=d-b,r[3]=0,r[4]=f-y,r[5]=1-(u+m),r[6]=p+g,r[7]=0,r[8]=d+b,r[9]=p-g,r[10]=1-(u+h),r[11]=0,r[12]=t[0],r[13]=t[1],r[14]=t[2],r[15]=1,r}function EC(r,e){let t=new Y(3),n=-e[0],i=-e[1],o=-e[2],s=e[3],a=e[4],c=e[5],l=e[6],u=e[7],f=n*n+i*i+o*o+s*s;return f>0?(t[0]=(a*s+u*n+c*o-l*i)*2/f,t[1]=(c*s+u*i+l*n-a*o)*2/f,t[2]=(l*s+u*o+a*i-c*n)*2/f):(t[0]=(a*s+u*n+c*o-l*i)*2,t[1]=(c*s+u*i+l*n-a*o)*2,t[2]=(l*s+u*o+a*i-c*n)*2),ax(r,e,t),r}function PC(r,e){return r[0]=e[12],r[1]=e[13],r[2]=e[14],r}function cx(r,e){let t=e[0],n=e[1],i=e[2],o=e[4],s=e[5],a=e[6],c=e[8],l=e[9],u=e[10];return r[0]=Math.sqrt(t*t+n*n+i*i),r[1]=Math.sqrt(o*o+s*s+a*a),r[2]=Math.sqrt(c*c+l*l+u*u),r}function SC(r,e){let t=new Y(3);cx(t,e);let n=1/t[0],i=1/t[1],o=1/t[2],s=e[0]*n,a=e[1]*i,c=e[2]*o,l=e[4]*n,u=e[5]*i,f=e[6]*o,d=e[8]*n,h=e[9]*i,p=e[10]*o,m=s+u+p,g=0;return m>0?(g=Math.sqrt(m+1)*2,r[3]=.25*g,r[0]=(f-h)/g,r[1]=(d-c)/g,r[2]=(a-l)/g):s>u&&s>p?(g=Math.sqrt(1+s-u-p)*2,r[3]=(f-h)/g,r[0]=.25*g,r[1]=(a+l)/g,r[2]=(d+c)/g):u>p?(g=Math.sqrt(1+u-s-p)*2,r[3]=(d-c)/g,r[0]=(a+l)/g,r[1]=.25*g,r[2]=(f+h)/g):(g=Math.sqrt(1+p-s-u)*2,r[3]=(a-l)/g,r[0]=(d+c)/g,r[1]=(f+h)/g,r[2]=.25*g),r}function TC(r,e,t,n){e[0]=n[12],e[1]=n[13],e[2]=n[14];let i=n[0],o=n[1],s=n[2],a=n[4],c=n[5],l=n[6],u=n[8],f=n[9],d=n[10];t[0]=Math.sqrt(i*i+o*o+s*s),t[1]=Math.sqrt(a*a+c*c+l*l),t[2]=Math.sqrt(u*u+f*f+d*d);let h=1/t[0],p=1/t[1],m=1/t[2],g=i*h,b=o*p,y=s*m,x=a*h,v=c*p,w=l*m,E=u*h,T=f*p,L=d*m,C=g+v+L,S=0;return C>0?(S=Math.sqrt(C+1)*2,r[3]=.25*S,r[0]=(w-T)/S,r[1]=(E-y)/S,r[2]=(b-x)/S):g>v&&g>L?(S=Math.sqrt(1+g-v-L)*2,r[3]=(w-T)/S,r[0]=.25*S,r[1]=(b+x)/S,r[2]=(E+y)/S):v>L?(S=Math.sqrt(1+v-g-L)*2,r[3]=(E-y)/S,r[0]=(b+x)/S,r[1]=.25*S,r[2]=(w+T)/S):(S=Math.sqrt(1+L-g-v)*2,r[3]=(b-x)/S,r[0]=(E+y)/S,r[1]=(w+T)/S,r[2]=.25*S),r}function LC(r,e,t,n){let i=e[0],o=e[1],s=e[2],a=e[3],c=i+i,l=o+o,u=s+s,f=i*c,d=i*l,h=i*u,p=o*l,m=o*u,g=s*u,b=a*c,y=a*l,x=a*u,v=n[0],w=n[1],E=n[2];return r[0]=(1-(p+g))*v,r[1]=(d+x)*v,r[2]=(h-y)*v,r[3]=0,r[4]=(d-x)*w,r[5]=(1-(f+g))*w,r[6]=(m+b)*w,r[7]=0,r[8]=(h+y)*E,r[9]=(m-b)*E,r[10]=(1-(f+p))*E,r[11]=0,r[12]=t[0],r[13]=t[1],r[14]=t[2],r[15]=1,r}function AC(r,e,t,n,i){let o=e[0],s=e[1],a=e[2],c=e[3],l=o+o,u=s+s,f=a+a,d=o*l,h=o*u,p=o*f,m=s*u,g=s*f,b=a*f,y=c*l,x=c*u,v=c*f,w=n[0],E=n[1],T=n[2],L=i[0],C=i[1],S=i[2],k=(1-(m+b))*w,R=(h+v)*w,M=(p-x)*w,N=(h-v)*E,Q=(1-(d+b))*E,te=(g+y)*E,ve=(p+x)*T,Hi=(g-y)*T,Uu=(1-(d+m))*T;return r[0]=k,r[1]=R,r[2]=M,r[3]=0,r[4]=N,r[5]=Q,r[6]=te,r[7]=0,r[8]=ve,r[9]=Hi,r[10]=Uu,r[11]=0,r[12]=t[0]+L-(k*L+N*C+ve*S),r[13]=t[1]+C-(R*L+Q*C+Hi*S),r[14]=t[2]+S-(M*L+te*C+Uu*S),r[15]=1,r}function ph(r,e){let t=e[0],n=e[1],i=e[2],o=e[3],s=t+t,a=n+n,c=i+i,l=t*s,u=n*s,f=n*a,d=i*s,h=i*a,p=i*c,m=o*s,g=o*a,b=o*c;return r[0]=1-f-p,r[1]=u+b,r[2]=d-g,r[3]=0,r[4]=u-b,r[5]=1-l-p,r[6]=h+m,r[7]=0,r[8]=d+g,r[9]=h-m,r[10]=1-l-f,r[11]=0,r[12]=0,r[13]=0,r[14]=0,r[15]=1,r}function mh(r,e,t,n,i,o,s){let a=1/(t-e),c=1/(i-n),l=1/(o-s);return r[0]=o*2*a,r[1]=0,r[2]=0,r[3]=0,r[4]=0,r[5]=o*2*c,r[6]=0,r[7]=0,r[8]=(t+e)*a,r[9]=(i+n)*c,r[10]=(s+o)*l,r[11]=-1,r[12]=0,r[13]=0,r[14]=s*o*2*l,r[15]=0,r}function lx(r,e,t,n,i){let o=1/Math.tan(e/2);if(r[0]=o/t,r[1]=0,r[2]=0,r[3]=0,r[4]=0,r[5]=o,r[6]=0,r[7]=0,r[8]=0,r[9]=0,r[11]=-1,r[12]=0,r[13]=0,r[15]=0,i!=null&&i!==1/0){let s=1/(n-i);r[10]=(i+n)*s,r[14]=2*i*n*s}else r[10]=-1,r[14]=-2*n;return r}function CC(r,e,t,n,i){let o=1/Math.tan(e/2);if(r[0]=o/t,r[1]=0,r[2]=0,r[3]=0,r[4]=0,r[5]=o,r[6]=0,r[7]=0,r[8]=0,r[9]=0,r[11]=-1,r[12]=0,r[13]=0,r[15]=0,i!=null&&i!==1/0){let s=1/(n-i);r[10]=i*s,r[14]=i*n*s}else r[10]=-1,r[14]=-n;return r}function MC(r,e,t,n){let i=Math.tan(e.upDegrees*Math.PI/180),o=Math.tan(e.downDegrees*Math.PI/180),s=Math.tan(e.leftDegrees*Math.PI/180),a=Math.tan(e.rightDegrees*Math.PI/180),c=2/(s+a),l=2/(i+o);return r[0]=c,r[1]=0,r[2]=0,r[3]=0,r[4]=0,r[5]=l,r[6]=0,r[7]=0,r[8]=-((s-a)*c*.5),r[9]=(i-o)*l*.5,r[10]=n/(t-n),r[11]=-1,r[12]=0,r[13]=0,r[14]=n*t/(t-n),r[15]=0,r}function ux(r,e,t,n,i,o,s){let a=1/(e-t),c=1/(n-i),l=1/(o-s);return r[0]=-2*a,r[1]=0,r[2]=0,r[3]=0,r[4]=0,r[5]=-2*c,r[6]=0,r[7]=0,r[8]=0,r[9]=0,r[10]=2*l,r[11]=0,r[12]=(e+t)*a,r[13]=(i+n)*c,r[14]=(s+o)*l,r[15]=1,r}function RC(r,e,t,n,i,o,s){let a=1/(e-t),c=1/(n-i),l=1/(o-s);return r[0]=-2*a,r[1]=0,r[2]=0,r[3]=0,r[4]=0,r[5]=-2*c,r[6]=0,r[7]=0,r[8]=0,r[9]=0,r[10]=l,r[11]=0,r[12]=(e+t)*a,r[13]=(i+n)*c,r[14]=o*l,r[15]=1,r}function yh(r,e,t,n){let i,o,s,a,c,l,u,f,d,h,p=e[0],m=e[1],g=e[2],b=n[0],y=n[1],x=n[2],v=t[0],w=t[1],E=t[2];return Math.abs(p-v)<1e-6&&Math.abs(m-w)<1e-6&&Math.abs(g-E)<1e-6?sx(r):(f=p-v,d=m-w,h=g-E,i=1/Math.sqrt(f*f+d*d+h*h),f*=i,d*=i,h*=i,o=y*h-x*d,s=x*f-b*h,a=b*d-y*f,i=Math.sqrt(o*o+s*s+a*a),i?(i=1/i,o*=i,s*=i,a*=i):(o=0,s=0,a=0),c=d*a-h*s,l=h*o-f*a,u=f*s-d*o,i=Math.sqrt(c*c+l*l+u*u),i?(i=1/i,c*=i,l*=i,u*=i):(c=0,l=0,u=0),r[0]=o,r[1]=c,r[2]=f,r[3]=0,r[4]=s,r[5]=l,r[6]=d,r[7]=0,r[8]=a,r[9]=u,r[10]=h,r[11]=0,r[12]=-(o*p+s*m+a*g),r[13]=-(c*p+l*m+u*g),r[14]=-(f*p+d*m+h*g),r[15]=1,r)}function IC(r,e,t,n){let i=e[0],o=e[1],s=e[2],a=n[0],c=n[1],l=n[2],u=i-t[0],f=o-t[1],d=s-t[2],h=u*u+f*f+d*d;h>0&&(h=1/Math.sqrt(h),u*=h,f*=h,d*=h);let p=c*d-l*f,m=l*u-a*d,g=a*f-c*u;return h=p*p+m*m+g*g,h>0&&(h=1/Math.sqrt(h),p*=h,m*=h,g*=h),r[0]=p,r[1]=m,r[2]=g,r[3]=0,r[4]=f*g-d*m,r[5]=d*p-u*g,r[6]=u*m-f*p,r[7]=0,r[8]=u,r[9]=f,r[10]=d,r[11]=0,r[12]=i,r[13]=o,r[14]=s,r[15]=1,r}function OC(r){return`mat4(${r[0]}, ${r[1]}, ${r[2]}, ${r[3]}, ${r[4]}, ${r[5]}, ${r[6]}, ${r[7]}, ${r[8]}, ${r[9]}, ${r[10]}, ${r[11]}, ${r[12]}, ${r[13]}, ${r[14]}, ${r[15]})`}function BC(r){return Math.sqrt(r[0]*r[0]+r[1]*r[1]+r[2]*r[2]+r[3]*r[3]+r[4]*r[4]+r[5]*r[5]+r[6]*r[6]+r[7]*r[7]+r[8]*r[8]+r[9]*r[9]+r[10]*r[10]+r[11]*r[11]+r[12]*r[12]+r[13]*r[13]+r[14]*r[14]+r[15]*r[15])}function DC(r,e,t){return r[0]=e[0]+t[0],r[1]=e[1]+t[1],r[2]=e[2]+t[2],r[3]=e[3]+t[3],r[4]=e[4]+t[4],r[5]=e[5]+t[5],r[6]=e[6]+t[6],r[7]=e[7]+t[7],r[8]=e[8]+t[8],r[9]=e[9]+t[9],r[10]=e[10]+t[10],r[11]=e[11]+t[11],r[12]=e[12]+t[12],r[13]=e[13]+t[13],r[14]=e[14]+t[14],r[15]=e[15]+t[15],r}function fx(r,e,t){return r[0]=e[0]-t[0],r[1]=e[1]-t[1],r[2]=e[2]-t[2],r[3]=e[3]-t[3],r[4]=e[4]-t[4],r[5]=e[5]-t[5],r[6]=e[6]-t[6],r[7]=e[7]-t[7],r[8]=e[8]-t[8],r[9]=e[9]-t[9],r[10]=e[10]-t[10],r[11]=e[11]-t[11],r[12]=e[12]-t[12],r[13]=e[13]-t[13],r[14]=e[14]-t[14],r[15]=e[15]-t[15],r}function kC(r,e,t){return r[0]=e[0]*t,r[1]=e[1]*t,r[2]=e[2]*t,r[3]=e[3]*t,r[4]=e[4]*t,r[5]=e[5]*t,r[6]=e[6]*t,r[7]=e[7]*t,r[8]=e[8]*t,r[9]=e[9]*t,r[10]=e[10]*t,r[11]=e[11]*t,r[12]=e[12]*t,r[13]=e[13]*t,r[14]=e[14]*t,r[15]=e[15]*t,r}function NC(r,e,t,n){return r[0]=e[0]+t[0]*n,r[1]=e[1]+t[1]*n,r[2]=e[2]+t[2]*n,r[3]=e[3]+t[3]*n,r[4]=e[4]+t[4]*n,r[5]=e[5]+t[5]*n,r[6]=e[6]+t[6]*n,r[7]=e[7]+t[7]*n,r[8]=e[8]+t[8]*n,r[9]=e[9]+t[9]*n,r[10]=e[10]+t[10]*n,r[11]=e[11]+t[11]*n,r[12]=e[12]+t[12]*n,r[13]=e[13]+t[13]*n,r[14]=e[14]+t[14]*n,r[15]=e[15]+t[15]*n,r}function FC(r,e){return r[0]===e[0]&&r[1]===e[1]&&r[2]===e[2]&&r[3]===e[3]&&r[4]===e[4]&&r[5]===e[5]&&r[6]===e[6]&&r[7]===e[7]&&r[8]===e[8]&&r[9]===e[9]&&r[10]===e[10]&&r[11]===e[11]&&r[12]===e[12]&&r[13]===e[13]&&r[14]===e[14]&&r[15]===e[15]}function UC(r,e){let t=r[0],n=r[1],i=r[2],o=r[3],s=r[4],a=r[5],c=r[6],l=r[7],u=r[8],f=r[9],d=r[10],h=r[11],p=r[12],m=r[13],g=r[14],b=r[15],y=e[0],x=e[1],v=e[2],w=e[3],E=e[4],T=e[5],L=e[6],C=e[7],S=e[8],k=e[9],R=e[10],M=e[11],N=e[12],Q=e[13],te=e[14],ve=e[15];return Math.abs(t-y)<=1e-6*Math.max(1,Math.abs(t),Math.abs(y))&&Math.abs(n-x)<=1e-6*Math.max(1,Math.abs(n),Math.abs(x))&&Math.abs(i-v)<=1e-6*Math.max(1,Math.abs(i),Math.abs(v))&&Math.abs(o-w)<=1e-6*Math.max(1,Math.abs(o),Math.abs(w))&&Math.abs(s-E)<=1e-6*Math.max(1,Math.abs(s),Math.abs(E))&&Math.abs(a-T)<=1e-6*Math.max(1,Math.abs(a),Math.abs(T))&&Math.abs(c-L)<=1e-6*Math.max(1,Math.abs(c),Math.abs(L))&&Math.abs(l-C)<=1e-6*Math.max(1,Math.abs(l),Math.abs(C))&&Math.abs(u-S)<=1e-6*Math.max(1,Math.abs(u),Math.abs(S))&&Math.abs(f-k)<=1e-6*Math.max(1,Math.abs(f),Math.abs(k))&&Math.abs(d-R)<=1e-6*Math.max(1,Math.abs(d),Math.abs(R))&&Math.abs(h-M)<=1e-6*Math.max(1,Math.abs(h),Math.abs(M))&&Math.abs(p-N)<=1e-6*Math.max(1,Math.abs(p),Math.abs(N))&&Math.abs(m-Q)<=1e-6*Math.max(1,Math.abs(m),Math.abs(Q))&&Math.abs(g-te)<=1e-6*Math.max(1,Math.abs(g),Math.abs(te))&&Math.abs(b-ve)<=1e-6*Math.max(1,Math.abs(b),Math.abs(ve))}var gh,_h,GC,zC,bh=_(()=>{tn();gh=lx;_h=ux;GC=zo,zC=fx});var Ce={};Ut(Ce,{add:()=>xh,ceil:()=>$C,clone:()=>hx,copy:()=>mx,create:()=>dx,cross:()=>XC,dist:()=>iM,distance:()=>xx,div:()=>nM,divide:()=>bx,dot:()=>Eh,equals:()=>eM,exactEquals:()=>wx,floor:()=>VC,forEach:()=>cM,fromValues:()=>px,inverse:()=>ZC,len:()=>sM,length:()=>Lc,lerp:()=>Ph,max:()=>jC,min:()=>WC,mul:()=>rM,multiply:()=>yx,negate:()=>qC,normalize:()=>wh,random:()=>KC,round:()=>HC,scale:()=>vh,scaleAndAdd:()=>YC,set:()=>gx,sqrDist:()=>oM,sqrLen:()=>aM,squaredDistance:()=>vx,squaredLength:()=>Ac,str:()=>JC,sub:()=>tM,subtract:()=>_x,transformMat4:()=>Sh,transformQuat:()=>Th,zero:()=>QC});function dx(){let r=new Y(4);return Y!=Float32Array&&(r[0]=0,r[1]=0,r[2]=0,r[3]=0),r}function hx(r){let e=new Y(4);return e[0]=r[0],e[1]=r[1],e[2]=r[2],e[3]=r[3],e}function px(r,e,t,n){let i=new Y(4);return i[0]=r,i[1]=e,i[2]=t,i[3]=n,i}function mx(r,e){return r[0]=e[0],r[1]=e[1],r[2]=e[2],r[3]=e[3],r}function gx(r,e,t,n,i){return r[0]=e,r[1]=t,r[2]=n,r[3]=i,r}function xh(r,e,t){return r[0]=e[0]+t[0],r[1]=e[1]+t[1],r[2]=e[2]+t[2],r[3]=e[3]+t[3],r}function _x(r,e,t){return r[0]=e[0]-t[0],r[1]=e[1]-t[1],r[2]=e[2]-t[2],r[3]=e[3]-t[3],r}function yx(r,e,t){return r[0]=e[0]*t[0],r[1]=e[1]*t[1],r[2]=e[2]*t[2],r[3]=e[3]*t[3],r}function bx(r,e,t){return r[0]=e[0]/t[0],r[1]=e[1]/t[1],r[2]=e[2]/t[2],r[3]=e[3]/t[3],r}function $C(r,e){return r[0]=Math.ceil(e[0]),r[1]=Math.ceil(e[1]),r[2]=Math.ceil(e[2]),r[3]=Math.ceil(e[3]),r}function VC(r,e){return r[0]=Math.floor(e[0]),r[1]=Math.floor(e[1]),r[2]=Math.floor(e[2]),r[3]=Math.floor(e[3]),r}function WC(r,e,t){return r[0]=Math.min(e[0],t[0]),r[1]=Math.min(e[1],t[1]),r[2]=Math.min(e[2],t[2]),r[3]=Math.min(e[3],t[3]),r}function jC(r,e,t){return r[0]=Math.max(e[0],t[0]),r[1]=Math.max(e[1],t[1]),r[2]=Math.max(e[2],t[2]),r[3]=Math.max(e[3],t[3]),r}function HC(r,e){return r[0]=Ke(e[0]),r[1]=Ke(e[1]),r[2]=Ke(e[2]),r[3]=Ke(e[3]),r}function vh(r,e,t){return r[0]=e[0]*t,r[1]=e[1]*t,r[2]=e[2]*t,r[3]=e[3]*t,r}function YC(r,e,t,n){return r[0]=e[0]+t[0]*n,r[1]=e[1]+t[1]*n,r[2]=e[2]+t[2]*n,r[3]=e[3]+t[3]*n,r}function xx(r,e){let t=e[0]-r[0],n=e[1]-r[1],i=e[2]-r[2],o=e[3]-r[3];return Math.sqrt(t*t+n*n+i*i+o*o)}function vx(r,e){let t=e[0]-r[0],n=e[1]-r[1],i=e[2]-r[2],o=e[3]-r[3];return t*t+n*n+i*i+o*o}function Lc(r){let e=r[0],t=r[1],n=r[2],i=r[3];return Math.sqrt(e*e+t*t+n*n+i*i)}function Ac(r){let e=r[0],t=r[1],n=r[2],i=r[3];return e*e+t*t+n*n+i*i}function qC(r,e){return r[0]=-e[0],r[1]=-e[1],r[2]=-e[2],r[3]=-e[3],r}function ZC(r,e){return r[0]=1/e[0],r[1]=1/e[1],r[2]=1/e[2],r[3]=1/e[3],r}function wh(r,e){let t=e[0],n=e[1],i=e[2],o=e[3],s=t*t+n*n+i*i+o*o;return s>0&&(s=1/Math.sqrt(s)),r[0]=t*s,r[1]=n*s,r[2]=i*s,r[3]=o*s,r}function Eh(r,e){return r[0]*e[0]+r[1]*e[1]+r[2]*e[2]+r[3]*e[3]}function XC(r,e,t,n){let i=t[0]*n[1]-t[1]*n[0],o=t[0]*n[2]-t[2]*n[0],s=t[0]*n[3]-t[3]*n[0],a=t[1]*n[2]-t[2]*n[1],c=t[1]*n[3]-t[3]*n[1],l=t[2]*n[3]-t[3]*n[2],u=e[0],f=e[1],d=e[2],h=e[3];return r[0]=f*l-d*c+h*a,r[1]=-(u*l)+d*s-h*o,r[2]=u*c-f*s+h*i,r[3]=-(u*a)+f*o-d*i,r}function Ph(r,e,t,n){let i=e[0],o=e[1],s=e[2],a=e[3];return r[0]=i+n*(t[0]-i),r[1]=o+n*(t[1]-o),r[2]=s+n*(t[2]-s),r[3]=a+n*(t[3]-a),r}function KC(r,e){e=e===void 0?1:e;let t,n,i,o,s,a;do t=Pt()*2-1,n=Pt()*2-1,s=t*t+n*n;while(s>=1);do i=Pt()*2-1,o=Pt()*2-1,a=i*i+o*o;while(a>=1);let c=Math.sqrt((1-s)/a);return r[0]=e*t,r[1]=e*n,r[2]=e*i*c,r[3]=e*o*c,r}function Sh(r,e,t){let n=e[0],i=e[1],o=e[2],s=e[3];return r[0]=t[0]*n+t[4]*i+t[8]*o+t[12]*s,r[1]=t[1]*n+t[5]*i+t[9]*o+t[13]*s,r[2]=t[2]*n+t[6]*i+t[10]*o+t[14]*s,r[3]=t[3]*n+t[7]*i+t[11]*o+t[15]*s,r}function Th(r,e,t){let n=e[0],i=e[1],o=e[2],s=t[0],a=t[1],c=t[2],l=t[3],u=l*n+a*o-c*i,f=l*i+c*n-s*o,d=l*o+s*i-a*n,h=-s*n-a*i-c*o;return r[0]=u*l+h*-s+f*-c-d*-a,r[1]=f*l+h*-a+d*-s-u*-c,r[2]=d*l+h*-c+u*-a-f*-s,r[3]=e[3],r}function QC(r){return r[0]=0,r[1]=0,r[2]=0,r[3]=0,r}function JC(r){return`vec4(${r[0]}, ${r[1]}, ${r[2]}, ${r[3]})`}function wx(r,e){return r[0]===e[0]&&r[1]===e[1]&&r[2]===e[2]&&r[3]===e[3]}function eM(r,e){let t=r[0],n=r[1],i=r[2],o=r[3],s=e[0],a=e[1],c=e[2],l=e[3];return Math.abs(t-s)<=1e-6*Math.max(1,Math.abs(t),Math.abs(s))&&Math.abs(n-a)<=1e-6*Math.max(1,Math.abs(n),Math.abs(a))&&Math.abs(i-c)<=1e-6*Math.max(1,Math.abs(i),Math.abs(c))&&Math.abs(o-l)<=1e-6*Math.max(1,Math.abs(o),Math.abs(l))}var tM,rM,nM,iM,oM,sM,aM,cM,$o=_(()=>{tn();tM=_x,rM=yx,nM=bx,iM=xx,oM=vx,sM=Lc,aM=Ac,cM=(function(){let r=dx();return function(e,t,n,i,o,s){let a,c;for(t||(t=4),n||(n=0),i?c=Math.min(i*t+n,e.length):c=e.length,a=n;a<c;a+=t)r[0]=e[a],r[1]=e[a+1],r[2]=e[a+2],r[3]=e[a+3],o(r,r,s),e[a]=r[0],e[a+1]=r[1],e[a+2]=r[2],e[a+3]=r[3];return e}})()});function dM(){return Cc||(Cc=new ce([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]),Object.freeze(Cc)),Cc}function hM(){return Mc||(Mc=new ce,Object.freeze(Mc)),Mc}function Ex(r){if(r>Math.PI*2)throw Error("expected radians")}function pM(r,e,t,n,i,o){let s=2*o/(t-e),a=2*o/(i-n),c=(t+e)/(t-e),l=(i+n)/(i-n),u=-1,f=-1,d=-2*o;return r[0]=s,r[1]=0,r[2]=0,r[3]=0,r[4]=0,r[5]=a,r[6]=0,r[7]=0,r[8]=c,r[9]=l,r[10]=u,r[11]=f,r[12]=0,r[13]=0,r[14]=d,r[15]=0,r}var Ch,lM,uM,Lh,Ah,fM,ce,Cc,Mc,Px=_(()=>{nx();en();xc();bh();Zd();Jn();$o();(function(r){r[r.COL0ROW0=0]="COL0ROW0",r[r.COL0ROW1=1]="COL0ROW1",r[r.COL0ROW2=2]="COL0ROW2",r[r.COL0ROW3=3]="COL0ROW3",r[r.COL1ROW0=4]="COL1ROW0",r[r.COL1ROW1=5]="COL1ROW1",r[r.COL1ROW2=6]="COL1ROW2",r[r.COL1ROW3=7]="COL1ROW3",r[r.COL2ROW0=8]="COL2ROW0",r[r.COL2ROW1=9]="COL2ROW1",r[r.COL2ROW2=10]="COL2ROW2",r[r.COL2ROW3=11]="COL2ROW3",r[r.COL3ROW0=12]="COL3ROW0",r[r.COL3ROW1=13]="COL3ROW1",r[r.COL3ROW2=14]="COL3ROW2",r[r.COL3ROW3=15]="COL3ROW3"})(Ch||(Ch={}));lM=45*Math.PI/180,uM=1,Lh=.1,Ah=500,fM=Object.freeze([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]),ce=class extends Tc{static get IDENTITY(){return hM()}static get ZERO(){return dM()}get ELEMENTS(){return 16}get RANK(){return 4}get INDICES(){return Ch}constructor(e){super(-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0),arguments.length===1&&Array.isArray(e)?this.copy(e):this.identity()}copy(e){return this[0]=e[0],this[1]=e[1],this[2]=e[2],this[3]=e[3],this[4]=e[4],this[5]=e[5],this[6]=e[6],this[7]=e[7],this[8]=e[8],this[9]=e[9],this[10]=e[10],this[11]=e[11],this[12]=e[12],this[13]=e[13],this[14]=e[14],this[15]=e[15],this.check()}set(e,t,n,i,o,s,a,c,l,u,f,d,h,p,m,g){return this[0]=e,this[1]=t,this[2]=n,this[3]=i,this[4]=o,this[5]=s,this[6]=a,this[7]=c,this[8]=l,this[9]=u,this[10]=f,this[11]=d,this[12]=h,this[13]=p,this[14]=m,this[15]=g,this.check()}setRowMajor(e,t,n,i,o,s,a,c,l,u,f,d,h,p,m,g){return this[0]=e,this[1]=o,this[2]=l,this[3]=h,this[4]=t,this[5]=s,this[6]=u,this[7]=p,this[8]=n,this[9]=a,this[10]=f,this[11]=m,this[12]=i,this[13]=c,this[14]=d,this[15]=g,this.check()}toRowMajor(e){return e[0]=this[0],e[1]=this[4],e[2]=this[8],e[3]=this[12],e[4]=this[1],e[5]=this[5],e[6]=this[9],e[7]=this[13],e[8]=this[2],e[9]=this[6],e[10]=this[10],e[11]=this[14],e[12]=this[3],e[13]=this[7],e[14]=this[11],e[15]=this[15],e}identity(){return this.copy(fM)}fromObject(e){return this.check()}fromQuaternion(e){return ph(this,e),this.check()}frustum(e){let{left:t,right:n,bottom:i,top:o,near:s=Lh,far:a=Ah}=e;return a===1/0?pM(this,t,n,i,o,s):mh(this,t,n,i,o,s,a),this.check()}lookAt(e){let{eye:t,center:n=[0,0,0],up:i=[0,1,0]}=e;return yh(this,t,n,i),this.check()}ortho(e){let{left:t,right:n,bottom:i,top:o,near:s=Lh,far:a=Ah}=e;return _h(this,t,n,i,o,s,a),this.check()}orthographic(e){let{fovy:t=lM,aspect:n=uM,focalDistance:i=1,near:o=Lh,far:s=Ah}=e;Ex(t);let a=t/2,c=i*Math.tan(a),l=c*n;return this.ortho({left:-l,right:l,bottom:-c,top:c,near:o,far:s})}perspective(e){let{fovy:t=45*Math.PI/180,aspect:n=1,near:i=.1,far:o=500}=e;return Ex(t),gh(this,t,n,i,o),this.check()}determinant(){return ah(this)}getScale(e=[-0,-0,-0]){return e[0]=Math.sqrt(this[0]*this[0]+this[1]*this[1]+this[2]*this[2]),e[1]=Math.sqrt(this[4]*this[4]+this[5]*this[5]+this[6]*this[6]),e[2]=Math.sqrt(this[8]*this[8]+this[9]*this[9]+this[10]*this[10]),e}getTranslation(e=[-0,-0,-0]){return e[0]=this[12],e[1]=this[13],e[2]=this[14],e}getRotation(e,t){e=e||[-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0],t=t||[-0,-0,-0];let n=this.getScale(t),i=1/n[0],o=1/n[1],s=1/n[2];return e[0]=this[0]*i,e[1]=this[1]*o,e[2]=this[2]*s,e[3]=0,e[4]=this[4]*i,e[5]=this[5]*o,e[6]=this[6]*s,e[7]=0,e[8]=this[8]*i,e[9]=this[9]*o,e[10]=this[10]*s,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,e}getRotationMatrix3(e,t){e=e||[-0,-0,-0,-0,-0,-0,-0,-0,-0],t=t||[-0,-0,-0];let n=this.getScale(t),i=1/n[0],o=1/n[1],s=1/n[2];return e[0]=this[0]*i,e[1]=this[1]*o,e[2]=this[2]*s,e[3]=this[4]*i,e[4]=this[5]*o,e[5]=this[6]*s,e[6]=this[8]*i,e[7]=this[9]*o,e[8]=this[10]*s,e}transpose(){return oh(this,this),this.check()}invert(){return sh(this,this),this.check()}multiplyLeft(e){return zo(this,e,this),this.check()}multiplyRight(e){return zo(this,this,e),this.check()}rotateX(e){return fh(this,this,e),this.check()}rotateY(e){return dh(this,this,e),this.check()}rotateZ(e){return hh(this,this,e),this.check()}rotateXYZ(e){return this.rotateX(e[0]).rotateY(e[1]).rotateZ(e[2])}rotateAxis(e,t){return uh(this,this,e,t),this.check()}scale(e){return lh(this,this,Array.isArray(e)?e:[e,e,e]),this.check()}translate(e){return ch(this,this,e),this.check()}transform(e,t){return e.length===4?(t=Sh(t||[-0,-0,-0,-0],e,this),Xn(t,4),t):this.transformAsPoint(e,t)}transformAsPoint(e,t){let{length:n}=e,i;switch(n){case 2:i=qd(t||[-0,-0],e,this);break;case 3:i=nn(t||[-0,-0,-0],e,this);break;default:throw new Error("Illegal vector")}return Xn(i,e.length),i}transformAsVector(e,t){let n;switch(e.length){case 2:n=Wb(t||[-0,-0],e,this);break;case 3:n=bc(t||[-0,-0,-0],e,this);break;default:throw new Error("Illegal vector")}return Xn(n,e.length),n}transformPoint(e,t){return this.transformAsPoint(e,t)}transformVector(e,t){return this.transformAsPoint(e,t)}transformDirection(e,t){return this.transformAsVector(e,t)}makeRotationX(e){return this.identity().rotateX(e)}makeTranslation(e,t,n){return this.identity().translate([e,t,n])}}});function Sx(){let r=new Y(4);return Y!=Float32Array&&(r[0]=0,r[1]=0,r[2]=0),r[3]=1,r}function Tx(r){return r[0]=0,r[1]=0,r[2]=0,r[3]=1,r}function Mh(r,e,t){t=t*.5;let n=Math.sin(t);return r[0]=n*e[0],r[1]=n*e[1],r[2]=n*e[2],r[3]=Math.cos(t),r}function Rh(r,e,t){let n=e[0],i=e[1],o=e[2],s=e[3],a=t[0],c=t[1],l=t[2],u=t[3];return r[0]=n*u+s*a+i*l-o*c,r[1]=i*u+s*c+o*a-n*l,r[2]=o*u+s*l+n*c-i*a,r[3]=s*u-n*a-i*c-o*l,r}function Lx(r,e,t){t*=.5;let n=e[0],i=e[1],o=e[2],s=e[3],a=Math.sin(t),c=Math.cos(t);return r[0]=n*c+s*a,r[1]=i*c+o*a,r[2]=o*c-i*a,r[3]=s*c-n*a,r}function Ax(r,e,t){t*=.5;let n=e[0],i=e[1],o=e[2],s=e[3],a=Math.sin(t),c=Math.cos(t);return r[0]=n*c-o*a,r[1]=i*c+s*a,r[2]=o*c+n*a,r[3]=s*c-i*a,r}function Cx(r,e,t){t*=.5;let n=e[0],i=e[1],o=e[2],s=e[3],a=Math.sin(t),c=Math.cos(t);return r[0]=n*c+i*a,r[1]=i*c-n*a,r[2]=o*c+s*a,r[3]=s*c-o*a,r}function Mx(r,e){let t=e[0],n=e[1],i=e[2];return r[0]=t,r[1]=n,r[2]=i,r[3]=Math.sqrt(Math.abs(1-t*t-n*n-i*i)),r}function Vo(r,e,t,n){let i=e[0],o=e[1],s=e[2],a=e[3],c=t[0],l=t[1],u=t[2],f=t[3],d,h,p,m,g;return d=i*c+o*l+s*u+a*f,d<0&&(d=-d,c=-c,l=-l,u=-u,f=-f),1-d>1e-6?(h=Math.acos(d),g=Math.sin(h),p=Math.sin((1-n)*h)/g,m=Math.sin(n*h)/g):(p=1-n,m=n),r[0]=p*i+m*c,r[1]=p*o+m*l,r[2]=p*s+m*u,r[3]=p*a+m*f,r}function Rx(r,e){let t=e[0],n=e[1],i=e[2],o=e[3],s=t*t+n*n+i*i+o*o,a=s?1/s:0;return r[0]=-t*a,r[1]=-n*a,r[2]=-i*a,r[3]=o*a,r}function Ix(r,e){return r[0]=-e[0],r[1]=-e[1],r[2]=-e[2],r[3]=e[3],r}function Ih(r,e){let t=e[0]+e[4]+e[8],n;if(t>0)n=Math.sqrt(t+1),r[3]=.5*n,n=.5/n,r[0]=(e[5]-e[7])*n,r[1]=(e[6]-e[2])*n,r[2]=(e[1]-e[3])*n;else{let i=0;e[4]>e[0]&&(i=1),e[8]>e[i*3+i]&&(i=2);let o=(i+1)%3,s=(i+2)%3;n=Math.sqrt(e[i*3+i]-e[o*3+o]-e[s*3+s]+1),r[i]=.5*n,n=.5/n,r[3]=(e[o*3+s]-e[s*3+o])*n,r[o]=(e[o*3+i]+e[i*3+o])*n,r[s]=(e[s*3+i]+e[i*3+s])*n}return r}var Ox,Bx,Dx,kx,Nx,Fx,Ux,Gx,zj,$j,Oh=_(()=>{tn();ih();Jn();$o();Ox=xh,Bx=vh,Dx=Eh,kx=Ph,Nx=Lc,Fx=Ac,Ux=wh,Gx=(function(){let r=vc(),e=wc(1,0,0),t=wc(0,1,0);return function(n,i,o){let s=Uo(i,o);return s<-.999999?(rn(r,e,i),rh(r)<1e-6&&rn(r,t,i),Xd(r,r),Mh(n,r,Math.PI),n):s>.999999?(n[0]=0,n[1]=0,n[2]=0,n[3]=1,n):(rn(r,i,o),n[0]=r[0],n[1]=r[1],n[2]=r[2],n[3]=1+s,Ux(n,n))}})(),zj=(function(){let r=Sx(),e=Sx();return function(t,n,i,o,s,a){return Vo(r,n,s,a),Vo(e,i,o,a),Vo(t,r,e,2*a*(1-a)),t}})(),$j=(function(){let r=ix();return function(e,t,n,i){return r[0]=n[0],r[3]=n[1],r[6]=n[2],r[1]=i[0],r[4]=i[1],r[7]=i[2],r[2]=-t[0],r[5]=-t[1],r[8]=-t[2],Ux(e,Ih(e,r))}})()});var gM,Wo,zx=_(()=>{yc();en();rx();Oh();$o();gM=[0,0,0,1],Wo=class extends mr{constructor(e=0,t=0,n=0,i=1){super(-0,-0,-0,-0),Array.isArray(e)&&arguments.length===1?this.copy(e):this.set(e,t,n,i)}copy(e){return this[0]=e[0],this[1]=e[1],this[2]=e[2],this[3]=e[3],this.check()}set(e,t,n,i){return this[0]=e,this[1]=t,this[2]=n,this[3]=i,this.check()}fromObject(e){return this[0]=e.x,this[1]=e.y,this[2]=e.z,this[3]=e.w,this.check()}fromMatrix3(e){return Ih(this,e),this.check()}fromAxisRotation(e,t){return Mh(this,e,t),this.check()}identity(){return Tx(this),this.check()}setAxisAngle(e,t){return this.fromAxisRotation(e,t)}get ELEMENTS(){return 4}get x(){return this[0]}set x(e){this[0]=$(e)}get y(){return this[1]}set y(e){this[1]=$(e)}get z(){return this[2]}set z(e){this[2]=$(e)}get w(){return this[3]}set w(e){this[3]=$(e)}len(){return Nx(this)}lengthSquared(){return Fx(this)}dot(e){return Dx(this,e)}rotationTo(e,t){return Gx(this,e,t),this.check()}add(e){return Ox(this,this,e),this.check()}calculateW(){return Mx(this,this),this.check()}conjugate(){return Ix(this,this),this.check()}invert(){return Rx(this,this),this.check()}lerp(e,t,n){return n===void 0?this.lerp(this,e,t):(kx(this,e,t,n),this.check())}multiplyRight(e){return Rh(this,this,e),this.check()}multiplyLeft(e){return Rh(this,e,this),this.check()}normalize(){let e=this.len(),t=e>0?1/e:0;return this[0]=this[0]*t,this[1]=this[1]*t,this[2]=this[2]*t,this[3]=this[3]*t,e===0&&(this[3]=1),this.check()}rotateX(e){return Lx(this,this,e),this.check()}rotateY(e){return Ax(this,this,e),this.check()}rotateZ(e){return Cx(this,this,e),this.check()}scale(e){return Bx(this,this,e),this.check()}slerp(e,t,n){let i,o,s;switch(arguments.length){case 1:({start:i=gM,target:o,ratio:s}=e);break;case 2:i=this,o=e,s=t;break;default:i=e,o=t,s=n}return Vo(this,i,o,s),this.check()}transformVector4(e,t=new Sc){return Th(t,e,this),Xn(t,4)}lengthSq(){return this.lengthSquared()}setFromAxisAngle(e,t){return this.setAxisAngle(e,t)}premultiply(e){return this.multiplyLeft(e)}multiply(e){return this.multiplyRight(e)}}});var Zj,Xj,Kj,Qj,$x=_(()=>{Zj=Math.PI/2,Xj=Math.PI/4,Kj=Math.PI/6,Qj=Math.PI*2});var le=_(()=>{tx();Px();zx();$x();Jr();ih();bh();Oh();Zd();Jn();$o()});function Bh(r,e=[],t=0){let n=Math.fround(r),i=r-n;return e[t]=n,e[t+1]=i,e}function Vx(r){return r-Math.fround(r)}function Wx(r){let e=new Float32Array(32);for(let t=0;t<4;++t)for(let n=0;n<4;++n){let i=t*4+n;Bh(r[n*4+t],e,i*2)}return e}var jx=_(()=>{});function Rc(r,e=!0){return r??e}function Dh(r=[0,0,0],e=!0){return e?r.map(t=>t/255):[...r]}function Hx(r,e=!0){let t=Dh(r.slice(0,3),e),n=Number.isFinite(r[3]),i=n?r[3]:1;return[t[0],t[1],t[2],e&&n?i/255:i]}var kh=_(()=>{});var yM,bM,on,Yx=_(()=>{yM=`#ifdef LUMA_FP32_TAN_PRECISION_WORKAROUND

// All these functions are for substituting tan() function from Intel GPU only
const float TWO_PI = 6.2831854820251465;
const float PI_2 = 1.5707963705062866;
const float PI_16 = 0.1963495463132858;

const float SIN_TABLE_0 = 0.19509032368659973;
const float SIN_TABLE_1 = 0.3826834261417389;
const float SIN_TABLE_2 = 0.5555702447891235;
const float SIN_TABLE_3 = 0.7071067690849304;

const float COS_TABLE_0 = 0.9807852506637573;
const float COS_TABLE_1 = 0.9238795042037964;
const float COS_TABLE_2 = 0.8314695954322815;
const float COS_TABLE_3 = 0.7071067690849304;

const float INVERSE_FACTORIAL_3 = 1.666666716337204e-01; // 1/3!
const float INVERSE_FACTORIAL_5 = 8.333333767950535e-03; // 1/5!
const float INVERSE_FACTORIAL_7 = 1.9841270113829523e-04; // 1/7!
const float INVERSE_FACTORIAL_9 = 2.75573188446287533e-06; // 1/9!

float sin_taylor_fp32(float a) {
  float r, s, t, x;

  if (a == 0.0) {
    return 0.0;
  }

  x = -a * a;
  s = a;
  r = a;

  r = r * x;
  t = r * INVERSE_FACTORIAL_3;
  s = s + t;

  r = r * x;
  t = r * INVERSE_FACTORIAL_5;
  s = s + t;

  r = r * x;
  t = r * INVERSE_FACTORIAL_7;
  s = s + t;

  r = r * x;
  t = r * INVERSE_FACTORIAL_9;
  s = s + t;

  return s;
}

void sincos_taylor_fp32(float a, out float sin_t, out float cos_t) {
  if (a == 0.0) {
    sin_t = 0.0;
    cos_t = 1.0;
  }
  sin_t = sin_taylor_fp32(a);
  cos_t = sqrt(1.0 - sin_t * sin_t);
}

float tan_taylor_fp32(float a) {
    float sin_a;
    float cos_a;

    if (a == 0.0) {
        return 0.0;
    }

    // 2pi range reduction
    float z = floor(a / TWO_PI);
    float r = a - TWO_PI * z;

    float t;
    float q = floor(r / PI_2 + 0.5);
    int j = int(q);

    if (j < -2 || j > 2) {
        return 1.0 / 0.0;
    }

    t = r - PI_2 * q;

    q = floor(t / PI_16 + 0.5);
    int k = int(q);
    int abs_k = int(abs(float(k)));

    if (abs_k > 4) {
        return 1.0 / 0.0;
    } else {
        t = t - PI_16 * q;
    }

    float u = 0.0;
    float v = 0.0;

    float sin_t, cos_t;
    float s, c;
    sincos_taylor_fp32(t, sin_t, cos_t);

    if (k == 0) {
        s = sin_t;
        c = cos_t;
    } else {
        if (abs(float(abs_k) - 1.0) < 0.5) {
            u = COS_TABLE_0;
            v = SIN_TABLE_0;
        } else if (abs(float(abs_k) - 2.0) < 0.5) {
            u = COS_TABLE_1;
            v = SIN_TABLE_1;
        } else if (abs(float(abs_k) - 3.0) < 0.5) {
            u = COS_TABLE_2;
            v = SIN_TABLE_2;
        } else if (abs(float(abs_k) - 4.0) < 0.5) {
            u = COS_TABLE_3;
            v = SIN_TABLE_3;
        }
        if (k > 0) {
            s = u * sin_t + v * cos_t;
            c = u * cos_t - v * sin_t;
        } else {
            s = u * sin_t - v * cos_t;
            c = u * cos_t + v * sin_t;
        }
    }

    if (j == 0) {
        sin_a = s;
        cos_a = c;
    } else if (j == 1) {
        sin_a = c;
        cos_a = -s;
    } else if (j == -1) {
        sin_a = -c;
        cos_a = s;
    } else {
        sin_a = -s;
        cos_a = -c;
    }
    return sin_a / cos_a;
}
#endif

float tan_fp32(float a) {
#ifdef LUMA_FP32_TAN_PRECISION_WORKAROUND
  return tan_taylor_fp32(a);
#else
  return tan(a);
#endif
}
`,bM=`#ifdef LUMA_FP32_TAN_PRECISION_WORKAROUND
const FP32_TWO_PI: f32 = 6.2831854820251465;
const FP32_PI_2: f32 = 1.5707963705062866;
const FP32_PI_16: f32 = 0.1963495463132858;

const FP32_SIN_TABLE_0: f32 = 0.19509032368659973;
const FP32_SIN_TABLE_1: f32 = 0.3826834261417389;
const FP32_SIN_TABLE_2: f32 = 0.5555702447891235;
const FP32_SIN_TABLE_3: f32 = 0.7071067690849304;

const FP32_COS_TABLE_0: f32 = 0.9807852506637573;
const FP32_COS_TABLE_1: f32 = 0.9238795042037964;
const FP32_COS_TABLE_2: f32 = 0.8314695954322815;
const FP32_COS_TABLE_3: f32 = 0.7071067690849304;

const FP32_INVERSE_FACTORIAL_3: f32 = 1.666666716337204e-01;
const FP32_INVERSE_FACTORIAL_5: f32 = 8.333333767950535e-03;
const FP32_INVERSE_FACTORIAL_7: f32 = 1.9841270113829523e-04;
const FP32_INVERSE_FACTORIAL_9: f32 = 2.75573188446287533e-06;
const FP32_OVERFLOW: f32 = 3.402823466e+38;

fn sin_taylor_fp32(a: f32) -> f32 {
  if (a == 0.0) {
    return 0.0;
  }

  let x = -a * a;
  var sum = a;
  var term = a;

  term = term * x;
  sum = sum + term * FP32_INVERSE_FACTORIAL_3;
  term = term * x;
  sum = sum + term * FP32_INVERSE_FACTORIAL_5;
  term = term * x;
  sum = sum + term * FP32_INVERSE_FACTORIAL_7;
  term = term * x;
  sum = sum + term * FP32_INVERSE_FACTORIAL_9;

  return sum;
}

fn tan_taylor_fp32(a: f32) -> f32 {
  if (a == 0.0) {
    return 0.0;
  }

  let z = floor(a / FP32_TWO_PI);
  let reduced = a - FP32_TWO_PI * z;

  var quadrantValue = floor(reduced / FP32_PI_2 + 0.5);
  let quadrant = i32(quadrantValue);
  if (quadrant < -2 || quadrant > 2) {
    return FP32_OVERFLOW;
  }

  var angle = reduced - FP32_PI_2 * quadrantValue;
  quadrantValue = floor(angle / FP32_PI_16 + 0.5);
  let tableIndex = i32(quadrantValue);
  let absoluteTableIndex = abs(tableIndex);
  if (absoluteTableIndex > 4) {
    return FP32_OVERFLOW;
  }

  angle = angle - FP32_PI_16 * quadrantValue;
  let sinAngle = sin_taylor_fp32(angle);
  let cosAngle = sqrt(1.0 - sinAngle * sinAngle);

  var tableCos = 0.0;
  var tableSin = 0.0;
  if (absoluteTableIndex == 1) {
    tableCos = FP32_COS_TABLE_0;
    tableSin = FP32_SIN_TABLE_0;
  } else if (absoluteTableIndex == 2) {
    tableCos = FP32_COS_TABLE_1;
    tableSin = FP32_SIN_TABLE_1;
  } else if (absoluteTableIndex == 3) {
    tableCos = FP32_COS_TABLE_2;
    tableSin = FP32_SIN_TABLE_2;
  } else if (absoluteTableIndex == 4) {
    tableCos = FP32_COS_TABLE_3;
    tableSin = FP32_SIN_TABLE_3;
  }

  var sinReduced = sinAngle;
  var cosReduced = cosAngle;
  if (tableIndex > 0) {
    sinReduced = tableCos * sinAngle + tableSin * cosAngle;
    cosReduced = tableCos * cosAngle - tableSin * sinAngle;
  } else if (tableIndex < 0) {
    sinReduced = tableCos * sinAngle - tableSin * cosAngle;
    cosReduced = tableCos * cosAngle + tableSin * sinAngle;
  }

  var sinValue = 0.0;
  var cosValue = 0.0;
  if (quadrant == 0) {
    sinValue = sinReduced;
    cosValue = cosReduced;
  } else if (quadrant == 1) {
    sinValue = cosReduced;
    cosValue = -sinReduced;
  } else if (quadrant == -1) {
    sinValue = -cosReduced;
    cosValue = sinReduced;
  } else {
    sinValue = -sinReduced;
    cosValue = -cosReduced;
  }

  return sinValue / cosValue;
}

fn tan_fp32(a: f32) -> f32 {
  return tan_taylor_fp32(a);
}
#else
fn tan_fp32(a: f32) -> f32 {
  return tan(a);
}
#endif
`,on={name:"fp32",source:bM,vs:yM}});var Nh,qx=_(()=>{Nh=`
layout(std140) uniform fp64arithmeticUniforms {
  uniform float ONE;
  uniform float SPLIT;
} fp64;

/*
About LUMA_FP64_CODE_ELIMINATION_WORKAROUND

The purpose of this workaround is to prevent shader compilers from
optimizing away necessary arithmetic operations by swapping their sequences
or transform the equation to some 'equivalent' form.

These helpers implement Dekker/Veltkamp-style error tracking. If the compiler
folds constants or reassociates the arithmetic, the high/low split can stop
tracking the rounding error correctly. That failure mode tends to look fine in
simple coordinate setup, but then breaks down inside iterative arithmetic such
as fp64 Mandelbrot loops.

The method is to multiply an artifical variable, ONE, which will be known to
the compiler to be 1 only at runtime. The whole expression is then represented
as a polynomial with respective to ONE. In the coefficients of all terms, only one a
and one b should appear

err = (a + b) * ONE^6 - a * ONE^5 - (a + b) * ONE^4 + a * ONE^3 - b - (a + b) * ONE^2 + a * ONE
*/

float prevent_fp64_optimization(float value) {
#if defined(LUMA_FP64_CODE_ELIMINATION_WORKAROUND)
  return value + fp64.ONE * 0.0;
#else
  return value;
#endif
}

// Divide float number to high and low floats to extend fraction bits
vec2 split(float a) {
  // Keep SPLIT as a runtime uniform so the compiler cannot fold the Dekker
  // split into a constant expression and reassociate the recovery steps.
  float split = prevent_fp64_optimization(fp64.SPLIT);
  float t = prevent_fp64_optimization(a * split);
  float temp = t - a;
  float a_hi = t - temp;
  float a_lo = a - a_hi;
  return vec2(a_hi, a_lo);
}

// Divide float number again when high float uses too many fraction bits
vec2 split2(vec2 a) {
  vec2 b = split(a.x);
  b.y += a.y;
  return b;
}

// Special sum operation when a > b
vec2 quickTwoSum(float a, float b) {
#if defined(LUMA_FP64_CODE_ELIMINATION_WORKAROUND)
  float sum = (a + b) * fp64.ONE;
  float err = b - (sum - a) * fp64.ONE;
#else
  float sum = a + b;
  float err = b - (sum - a);
#endif
  return vec2(sum, err);
}

// General sum operation
vec2 twoSum(float a, float b) {
  float s = (a + b);
#if defined(LUMA_FP64_CODE_ELIMINATION_WORKAROUND)
  float v = (s * fp64.ONE - a) * fp64.ONE;
  float err = (a - (s - v) * fp64.ONE) * fp64.ONE * fp64.ONE * fp64.ONE + (b - v);
#else
  float v = s - a;
  float err = (a - (s - v)) + (b - v);
#endif
  return vec2(s, err);
}

vec2 twoSub(float a, float b) {
  float s = (a - b);
#if defined(LUMA_FP64_CODE_ELIMINATION_WORKAROUND)
  float v = (s * fp64.ONE - a) * fp64.ONE;
  float err = (a - (s - v) * fp64.ONE) * fp64.ONE * fp64.ONE * fp64.ONE - (b + v);
#else
  float v = s - a;
  float err = (a - (s - v)) - (b + v);
#endif
  return vec2(s, err);
}

vec2 twoSqr(float a) {
  float prod = a * a;
  vec2 a_fp64 = split(a);
#if defined(LUMA_FP64_CODE_ELIMINATION_WORKAROUND)
  float err = ((a_fp64.x * a_fp64.x - prod) * fp64.ONE + 2.0 * a_fp64.x *
    a_fp64.y * fp64.ONE * fp64.ONE) + a_fp64.y * a_fp64.y * fp64.ONE * fp64.ONE * fp64.ONE;
#else
  float err = ((a_fp64.x * a_fp64.x - prod) + 2.0 * a_fp64.x * a_fp64.y) + a_fp64.y * a_fp64.y;
#endif
  return vec2(prod, err);
}

vec2 twoProd(float a, float b) {
  float prod = a * b;
  vec2 a_fp64 = split(a);
  vec2 b_fp64 = split(b);
  // twoProd is especially sensitive because mul_fp64 and div_fp64 both depend
  // on the split terms and cross terms staying in the original evaluation
  // order. If the compiler folds or reassociates them, the low part tends to
  // collapse to zero or NaN on some drivers.
  float highProduct = prevent_fp64_optimization(a_fp64.x * b_fp64.x);
  float crossProduct1 = prevent_fp64_optimization(a_fp64.x * b_fp64.y);
  float crossProduct2 = prevent_fp64_optimization(a_fp64.y * b_fp64.x);
  float lowProduct = prevent_fp64_optimization(a_fp64.y * b_fp64.y);
#if defined(LUMA_FP64_CODE_ELIMINATION_WORKAROUND)
  float err1 = (highProduct - prod) * fp64.ONE;
  float err2 = crossProduct1 * fp64.ONE * fp64.ONE;
  float err3 = crossProduct2 * fp64.ONE * fp64.ONE * fp64.ONE;
  float err4 = lowProduct * fp64.ONE * fp64.ONE * fp64.ONE * fp64.ONE;
#else
  float err1 = highProduct - prod;
  float err2 = crossProduct1;
  float err3 = crossProduct2;
  float err4 = lowProduct;
#endif
  float err = ((err1 + err2) + err3) + err4;
  return vec2(prod, err);
}

vec2 sum_fp64(vec2 a, vec2 b) {
  vec2 s, t;
  s = twoSum(a.x, b.x);
  t = twoSum(a.y, b.y);
  s.y += t.x;
  s = quickTwoSum(s.x, s.y);
  s.y += t.y;
  s = quickTwoSum(s.x, s.y);
  return s;
}

vec2 sub_fp64(vec2 a, vec2 b) {
  vec2 s, t;
  s = twoSub(a.x, b.x);
  t = twoSub(a.y, b.y);
  s.y += t.x;
  s = quickTwoSum(s.x, s.y);
  s.y += t.y;
  s = quickTwoSum(s.x, s.y);
  return s;
}

vec2 mul_fp64(vec2 a, vec2 b) {
  vec2 prod = twoProd(a.x, b.x);
  // y component is for the error
  prod.y += a.x * b.y;
#if defined(LUMA_FP64_HIGH_BITS_OVERFLOW_WORKAROUND)
  prod = split2(prod);
#endif
  prod = quickTwoSum(prod.x, prod.y);
  prod.y += a.y * b.x;
#if defined(LUMA_FP64_HIGH_BITS_OVERFLOW_WORKAROUND)
  prod = split2(prod);
#endif
  prod = quickTwoSum(prod.x, prod.y);
  return prod;
}

vec2 div_fp64(vec2 a, vec2 b) {
  float xn = 1.0 / b.x;
#if defined(LUMA_FP64_HIGH_BITS_OVERFLOW_WORKAROUND)
  vec2 yn = mul_fp64(a, vec2(xn, 0));
#else
  vec2 yn = a * xn;
#endif
  float diff = (sub_fp64(a, mul_fp64(b, yn))).x;
  vec2 prod = twoProd(xn, diff);
  return sum_fp64(yn, prod);
}

vec2 sqrt_fp64(vec2 a) {
  if (a.x == 0.0 && a.y == 0.0) return vec2(0.0, 0.0);
  if (a.x < 0.0) return vec2(0.0 / 0.0, 0.0 / 0.0);

  float x = 1.0 / sqrt(a.x);
  float yn = a.x * x;
#if defined(LUMA_FP64_CODE_ELIMINATION_WORKAROUND)
  vec2 yn_sqr = twoSqr(yn) * fp64.ONE;
#else
  vec2 yn_sqr = twoSqr(yn);
#endif
  float diff = sub_fp64(a, yn_sqr).x;
  vec2 prod = twoProd(x * 0.5, diff);
#if defined(LUMA_FP64_HIGH_BITS_OVERFLOW_WORKAROUND)
  return sum_fp64(split(yn), prod);
#else
  return sum_fp64(vec2(yn, 0.0), prod);
#endif
}
`});var Zx,Xx=_(()=>{Zx=`struct Fp64F32Bits {
  sign: u32,
  baseExponent: i32,
  significand: u32,
  isZero: bool,
  isInf: bool,
  isNan: bool,
};

// Decode an f32 as (-1)^sign * significand * 2^baseExponent.
fn fp64_decode_f32_bits(bits: u32) -> Fp64F32Bits {
  let sign = bits >> 31u;
  let exponentBits = (bits >> 23u) & 0xffu;
  let fraction = bits & 0x7fffffu;

  if (exponentBits == 0xffu) {
    return Fp64F32Bits(sign, 0, 0u, false, fraction == 0u, fraction != 0u);
  }
  if (exponentBits == 0u) {
    return Fp64F32Bits(sign, -149, fraction, fraction == 0u, false, false);
  }
  return Fp64F32Bits(sign, i32(exponentBits) - 150, 0x800000u | fraction, false, false, false);
}

fn fp64_f32_magnitude_compare(aBits: u32, bBits: u32) -> i32 {
  let aMagnitude = aBits & 0x7fffffffu;
  let bMagnitude = bBits & 0x7fffffffu;
  if (aMagnitude == bMagnitude) {
    return 0;
  }
  return select(-1, 1, aMagnitude > bMagnitude);
}

fn fp64_make_residual_f32_bits(
  exactSign: u32,
  exactMagnitude: vec2u,
  exactBaseExponent: i32,
  highBits: u32
) -> u32 {
  if (fp64_u64_is_zero(exactMagnitude)) {
    return 0u;
  }

  let high = fp64_decode_f32_bits(highBits);
  if (high.isInf || high.isNan) {
    return exactSign << 31u;
  }
  if (high.isZero) {
    return fp64_make_f32_bits_from_u64(exactSign, exactMagnitude, exactBaseExponent);
  }

  let commonBaseExponent = min(exactBaseExponent, high.baseExponent);
  let exactShift = exactBaseExponent - commonBaseExponent;
  let highShift = high.baseExponent - commonBaseExponent;

  // A normal two-sum/two-product residual never needs a shift this large.
  // This guard gives deterministic underflow behavior outside that contract.
  if (exactShift >= 64 || highShift >= 64) {
    return exactSign << 31u;
  }

  let exactAligned = fp64_u64_shift_left(exactMagnitude, u32(exactShift));
  let highAligned = fp64_u64_shift_left(vec2u(0u, high.significand), u32(highShift));
  let comparison = fp64_u64_compare(exactAligned, highAligned);
  if (comparison == 0) {
    return 0u;
  }

  var residualSign = exactSign;
  var residualMagnitude: vec2u;
  if (comparison > 0) {
    residualMagnitude = fp64_u64_sub(exactAligned, highAligned);
  } else {
    residualSign = exactSign ^ 1u;
    residualMagnitude = fp64_u64_sub(highAligned, exactAligned);
  }
  return fp64_make_f32_bits_from_u64(
    residualSign,
    residualMagnitude,
    commonBaseExponent
  );
}

fn fp64_split_accumulator_bits(
  sign: u32,
  magnitude: vec2u,
  baseExponent: i32
) -> vec2u {
  let highBits = fp64_make_f32_bits_from_u64(sign, magnitude, baseExponent);
  let lowBits = fp64_make_residual_f32_bits(sign, magnitude, baseExponent, highBits);
  return vec2u(highBits, lowBits);
}

fn fp64_two_sum_integer_bits(aBits: u32, bBits: u32) -> vec2u {
  let a = fp64_decode_f32_bits(aBits);
  let b = fp64_decode_f32_bits(bBits);

  if (a.isNan || b.isNan) {
    return vec2u(0x7fc00000u, 0u);
  }
  if (a.isInf || b.isInf) {
    if (a.isInf && b.isInf && a.sign != b.sign) {
      return vec2u(0x7fc00000u, 0u);
    }
    return select(vec2u(bBits, 0u), vec2u(aBits, 0u), a.isInf);
  }
  if (a.isZero && b.isZero) {
    return vec2u((a.sign & b.sign) << 31u, 0u);
  }
  if (a.isZero) {
    return vec2u(bBits, 0u);
  }
  if (b.isZero) {
    return vec2u(aBits, 0u);
  }

  let exponentDifference = select(
    b.baseExponent - a.baseExponent,
    a.baseExponent - b.baseExponent,
    a.baseExponent >= b.baseExponent
  );

  // Beyond half an ulp, rounding cannot change the larger operand. Returning
  // the smaller operand intact also avoids an unbounded integer alignment.
  // At a power-of-two boundary the spacing below the larger operand is half
  // the spacing above it, so an opposite-sign gap-25 operand can still change
  // the rounded high limb. Gap 26 is the first universally safe early-out.
  if (exponentDifference > 25) {
    if (fp64_f32_magnitude_compare(aBits, bBits) >= 0) {
      return vec2u(aBits, bBits);
    }
    return vec2u(bBits, aBits);
  }

  let commonBaseExponent = min(a.baseExponent, b.baseExponent);
  let aMagnitude = fp64_u64_shift_left(
    vec2u(0u, a.significand),
    u32(a.baseExponent - commonBaseExponent)
  );
  let bMagnitude = fp64_u64_shift_left(
    vec2u(0u, b.significand),
    u32(b.baseExponent - commonBaseExponent)
  );

  var resultSign = a.sign;
  var resultMagnitude: vec2u;
  if (a.sign == b.sign) {
    resultMagnitude = fp64_u64_add(aMagnitude, bMagnitude);
  } else {
    let comparison = fp64_u64_compare(aMagnitude, bMagnitude);
    if (comparison == 0) {
      return vec2u(0u, 0u);
    }
    if (comparison > 0) {
      resultMagnitude = fp64_u64_sub(aMagnitude, bMagnitude);
    } else {
      resultSign = b.sign;
      resultMagnitude = fp64_u64_sub(bMagnitude, aMagnitude);
    }
  }

  return fp64_split_accumulator_bits(resultSign, resultMagnitude, commonBaseExponent);
}

fn fp64_two_sum_integer(a: f32, b: f32) -> vec2f {
  let resultBits = fp64_two_sum_integer_bits(bitcast<u32>(a), bitcast<u32>(b));
  return vec2f(bitcast<f32>(resultBits.x), bitcast<f32>(resultBits.y));
}

fn fp64_multiply_significands(a: u32, b: u32) -> vec2u {
  let aLow = a & 0xffffu;
  let aHigh = a >> 16u;
  let bLow = b & 0xffffu;
  let bHigh = b >> 16u;
  let lowProduct = aLow * bLow;
  let crossProduct = aLow * bHigh + aHigh * bLow;
  let highProduct = aHigh * bHigh;

  var result = vec2u(0u, lowProduct);
  result = fp64_u64_add(
    result,
    fp64_u64_shift_left(vec2u(0u, crossProduct), 16u)
  );
  result = fp64_u64_add(result, vec2u(highProduct, 0u));
  return result;
}

fn fp64_two_prod_integer_bits(aBits: u32, bBits: u32) -> vec2u {
  let a = fp64_decode_f32_bits(aBits);
  let b = fp64_decode_f32_bits(bBits);
  let resultSign = a.sign ^ b.sign;

  if (a.isNan || b.isNan || ((a.isZero || b.isZero) && (a.isInf || b.isInf))) {
    return vec2u(0x7fc00000u, 0u);
  }
  if (a.isInf || b.isInf) {
    return vec2u((resultSign << 31u) | 0x7f800000u, resultSign << 31u);
  }
  if (a.isZero || b.isZero) {
    return vec2u(resultSign << 31u, resultSign << 31u);
  }

  let magnitude = fp64_multiply_significands(a.significand, b.significand);
  return fp64_split_accumulator_bits(
    resultSign,
    magnitude,
    a.baseExponent + b.baseExponent
  );
}

fn fp64_two_prod_integer(a: f32, b: f32) -> vec2f {
  let resultBits = fp64_two_prod_integer_bits(bitcast<u32>(a), bitcast<u32>(b));
  return vec2f(bitcast<f32>(resultBits.x), bitcast<f32>(resultBits.y));
}

fn fp64_round_add_integer(a: f32, b: f32) -> f32 {
  return fp64_two_sum_integer(a, b).x;
}

fn fp64_round_mul_integer(a: f32, b: f32) -> f32 {
  return fp64_two_prod_integer(a, b).x;
}

#ifndef LUMA_FP64_PREDICATE_ONLY
fn fp64_f32_finite_exponent(value: Fp64F32Bits) -> i32 {
  let mostSignificantBit = 31u - countLeadingZeros(value.significand);
  return value.baseExponent + i32(mostSignificantBit);
}

fn fp64_scale_f32_integer(value: f32, exponent: i32) -> f32 {
  let decoded = fp64_decode_f32_bits(bitcast<u32>(value));
  if (decoded.isZero || decoded.isInf || decoded.isNan) {
    return value;
  }
  let resultBits = fp64_make_f32_bits_from_u64(
    decoded.sign,
    vec2u(0u, decoded.significand),
    decoded.baseExponent + exponent
  );
  return bitcast<f32>(resultBits);
}

// Divide normalized significands so the hardware operation cannot overflow,
// underflow, or flush a subnormal result. Reapply the exponent with integer
// packing, which also produces subnormal correction limbs without relying on
// floating-point arithmetic to preserve them.
fn fp64_divide_f32_integer(aValue: f32, bValue: f32) -> f32 {
  let a = fp64_decode_f32_bits(bitcast<u32>(aValue));
  let b = fp64_decode_f32_bits(bitcast<u32>(bValue));
  if (a.isZero || b.isZero || a.isInf || b.isInf || a.isNan || b.isNan) {
    return aValue / bValue;
  }

  let aMostSignificantBit = 31u - countLeadingZeros(a.significand);
  let bMostSignificantBit = 31u - countLeadingZeros(b.significand);
  let normalizedABits = fp64_make_f32_bits_from_u64(
    a.sign,
    vec2u(0u, a.significand),
    -i32(aMostSignificantBit)
  );
  let normalizedBBits = fp64_make_f32_bits_from_u64(
    b.sign,
    vec2u(0u, b.significand),
    -i32(bMostSignificantBit)
  );
  let normalizedQuotient = bitcast<f32>(normalizedABits) / bitcast<f32>(normalizedBBits);
  let quotient = fp64_decode_f32_bits(bitcast<u32>(normalizedQuotient));
  let exponentShift =
    a.baseExponent + i32(aMostSignificantBit) -
    b.baseExponent - i32(bMostSignificantBit);
  let quotientBits = fp64_make_f32_bits_from_u64(
    quotient.sign,
    vec2u(0u, quotient.significand),
    quotient.baseExponent + exponentShift
  );
  return bitcast<f32>(quotientBits);
}
#endif

#ifndef LUMA_FP64_PREDICATE_ONLY
fn split(a: f32) -> vec2f {
  let aBits = bitcast<u32>(a);
  let decoded = fp64_decode_f32_bits(aBits);
  if (decoded.isZero || decoded.isInf || decoded.isNan) {
    return vec2f(a, 0.0);
  }

  var roundedHigh = decoded.significand >> 12u;
  let remainder = decoded.significand & 0xfffu;
  if (remainder > 0x800u || (remainder == 0x800u && (roundedHigh & 1u) == 1u)) {
    roundedHigh = roundedHigh + 1u;
  }
  var highMagnitude = vec2u(0u, roundedHigh << 12u);
  var highBits = fp64_make_f32_bits_from_u64(
    decoded.sign,
    highMagnitude,
    decoded.baseExponent
  );
  // Rounding the high limb of a maximum-exponent value can overflow even
  // though the original value is finite. Truncate only in that boundary case
  // so split remains an exact finite decomposition.
  if (fp64_decode_f32_bits(highBits).isInf) {
    roundedHigh = decoded.significand >> 12u;
    highMagnitude = vec2u(0u, roundedHigh << 12u);
    highBits = fp64_make_f32_bits_from_u64(
      decoded.sign,
      highMagnitude,
      decoded.baseExponent
    );
  }
  let lowBits = fp64_make_residual_f32_bits(
    decoded.sign,
    vec2u(0u, decoded.significand),
    decoded.baseExponent,
    highBits
  );
  return vec2f(bitcast<f32>(highBits), bitcast<f32>(lowBits));
}

fn split2(a: vec2f) -> vec2f {
  var result = split(a.x);
  result.y = fp64_round_add_integer(result.y, a.y);
  return result;
}
#endif

#ifndef LUMA_FP64_PREDICATE_ONLY
fn quickTwoSum(a: f32, b: f32) -> vec2f {
  return fp64_two_sum_integer(a, b);
}
#endif

fn twoSum(a: f32, b: f32) -> vec2f {
  return fp64_two_sum_integer(a, b);
}

fn twoSub(a: f32, b: f32) -> vec2f {
  let bBits = bitcast<u32>(b) ^ 0x80000000u;
  let resultBits = fp64_two_sum_integer_bits(bitcast<u32>(a), bBits);
  return vec2f(bitcast<f32>(resultBits.x), bitcast<f32>(resultBits.y));
}

#ifndef LUMA_FP64_PREDICATE_ONLY
fn twoSqr(a: f32) -> vec2f {
  return fp64_two_prod_integer(a, a);
}

fn twoProd(a: f32, b: f32) -> vec2f {
  return fp64_two_prod_integer(a, b);
}
#endif

fn sum_fp64(a: vec2f, b: vec2f) -> vec2f {
  var sum = fp64_two_sum_integer(a.x, b.x);
  let lowSum = fp64_two_sum_integer(a.y, b.y);
  sum.y = fp64_round_add_integer(sum.y, lowSum.x);
  sum = fp64_two_sum_integer(sum.x, sum.y);
  sum.y = fp64_round_add_integer(sum.y, lowSum.y);
  return fp64_two_sum_integer(sum.x, sum.y);
}

fn sub_fp64(a: vec2f, b: vec2f) -> vec2f {
  let negatedB = vec2f(
    bitcast<f32>(bitcast<u32>(b.x) ^ 0x80000000u),
    bitcast<f32>(bitcast<u32>(b.y) ^ 0x80000000u)
  );
  return sum_fp64(a, negatedB);
}

fn mul_fp64(a: vec2f, b: vec2f) -> vec2f {
  var product = fp64_two_prod_integer(a.x, b.x);
  let crossProduct1 = fp64_round_mul_integer(a.x, b.y);
  product.y = fp64_round_add_integer(product.y, crossProduct1);
  product = fp64_two_sum_integer(product.x, product.y);
  let crossProduct2 = fp64_round_mul_integer(a.y, b.x);
  product.y = fp64_round_add_integer(product.y, crossProduct2);
  return fp64_two_sum_integer(product.x, product.y);
}

#ifndef LUMA_FP64_PREDICATE_ONLY
fn fp64_scale_fp64_integer(value: vec2f, exponent: i32) -> vec2f {
  let high = fp64_scale_f32_integer(value.x, exponent);
  let low = fp64_scale_f32_integer(value.y, exponent);
  return sum_fp64(vec2f(high, 0.0), vec2f(low, 0.0));
}

fn fp64_div_fp64_normalized(a: vec2f, b: vec2f) -> vec2f {
  let quotientHigh = fp64_divide_f32_integer(a.x, b.x);
  var quotient = vec2f(quotientHigh, 0.0);

  let remainder = sub_fp64(a, mul_fp64(b, quotient));
  let quotientLow = fp64_divide_f32_integer(remainder.x, b.x);
  quotient = sum_fp64(quotient, vec2f(quotientLow, 0.0));

  let secondRemainder = sub_fp64(a, mul_fp64(b, quotient));
  let correction = fp64_divide_f32_integer(secondRemainder.x, b.x);
  return sum_fp64(quotient, vec2f(correction, 0.0));
}

fn div_fp64(a: vec2f, b: vec2f) -> vec2f {
  let decodedA = fp64_decode_f32_bits(bitcast<u32>(a.x));
  let decodedB = fp64_decode_f32_bits(bitcast<u32>(b.x));
  if (
    decodedA.isZero || decodedB.isZero ||
    decodedA.isInf || decodedB.isInf ||
    decodedA.isNan || decodedB.isNan
  ) {
    return fp64_div_fp64_normalized(a, b);
  }

  let exponentA = fp64_f32_finite_exponent(decodedA);
  let exponentB = fp64_f32_finite_exponent(decodedB);
  // Correct the quotient near unity so b * q and the remainder stay clear of
  // both f32 underflow and overflow. The exponent difference is applied once.
  let normalizedA = fp64_scale_fp64_integer(a, -exponentA);
  let normalizedB = fp64_scale_fp64_integer(b, -exponentB);
  let normalizedQuotient = fp64_div_fp64_normalized(normalizedA, normalizedB);
  return fp64_scale_fp64_integer(normalizedQuotient, exponentA - exponentB);
}

fn fp64_sqrt_fp64_normalized(a: vec2f) -> vec2f {
  let estimate = sqrt(a.x);
  let difference = sub_fp64(a, fp64_two_prod_integer(estimate, estimate)).x;
  let denominator = fp64_round_add_integer(estimate, estimate);
  let correction = fp64_divide_f32_integer(difference, denominator);
  return sum_fp64(vec2f(estimate, 0.0), vec2f(correction, 0.0));
}

fn sqrt_fp64(a: vec2f) -> vec2f {
  let decoded = fp64_decode_f32_bits(bitcast<u32>(a.x));
  let decodedLow = fp64_decode_f32_bits(bitcast<u32>(a.y));
  if (decoded.isZero && decodedLow.isZero) {
    return vec2f(0.0, 0.0);
  }
  if (decoded.sign == 1u) {
    let nanValue = fp64_nan(a.x);
    return vec2f(nanValue, nanValue);
  }

  if (decoded.isInf || decoded.isNan) {
    return fp64_sqrt_fp64_normalized(a);
  }
  let exponent = fp64_f32_finite_exponent(decoded);
  // An even scale lets the final square-root rescale use an integer exponent.
  let evenExponent = exponent - (exponent & 1);
  let normalizedA = fp64_scale_fp64_integer(a, -evenExponent);
  let normalizedRoot = fp64_sqrt_fp64_normalized(normalizedA);
  return fp64_scale_fp64_integer(normalizedRoot, evenExponent / 2);
}
#endif
`});var Kx,Qx=_(()=>{Xx();Kx=`struct Fp64ArithmeticUniforms {
  ONE: f32,
  SPLIT: f32,
};

@group(0) @binding(auto) var<uniform> fp64arithmetic : Fp64ArithmeticUniforms;

#ifndef LUMA_FP64_F32_INPUT_ONLY
struct Fp64Bits {
  sign: u32,
  exponent: i32,
  significand: vec2u,
  isZero: bool,
  isInf: bool,
  isNan: bool,
};
#endif

#ifndef LUMA_FP64_PREDICATE_ONLY
fn fp64_nan(seed: f32) -> f32 {
  let nanBits = 0x7fc00000u | select(0u, 1u, seed < 0.0);
  return bitcast<f32>(nanBits);
}
#endif

fn fp64_u64_is_zero(value: vec2u) -> bool {
  return value.x == 0u && value.y == 0u;
}

fn fp64_u64_compare(a: vec2u, b: vec2u) -> i32 {
  if (a.x != b.x) {
    return select(-1, 1, a.x > b.x);
  }
  if (a.y != b.y) {
    return select(-1, 1, a.y > b.y);
  }
  return 0;
}

fn fp64_u64_add(a: vec2u, b: vec2u) -> vec2u {
  let low = a.y + b.y;
  let carry = select(0u, 1u, low < a.y);
  return vec2u(a.x + b.x + carry, low);
}

fn fp64_u64_sub(a: vec2u, b: vec2u) -> vec2u {
  let borrow = select(0u, 1u, a.y < b.y);
  return vec2u(a.x - b.x - borrow, a.y - b.y);
}

fn fp64_u64_shift_left(value: vec2u, shift: u32) -> vec2u {
  if (shift == 0u) {
    return value;
  }
  if (shift < 32u) {
    return vec2u((value.x << shift) | (value.y >> (32u - shift)), value.y << shift);
  }
  if (shift == 32u) {
    return vec2u(value.y, 0u);
  }
  if (shift < 64u) {
    return vec2u(value.y << (shift - 32u), 0u);
  }
  return vec2u(0u);
}

fn fp64_u64_shift_right(value: vec2u, shift: u32) -> vec2u {
  if (shift == 0u) {
    return value;
  }
  if (shift < 32u) {
    return vec2u(value.x >> shift, (value.y >> shift) | (value.x << (32u - shift)));
  }
  if (shift == 32u) {
    return vec2u(0u, value.x);
  }
  if (shift < 64u) {
    return vec2u(0u, value.x >> (shift - 32u));
  }
  return vec2u(0u);
}

fn fp64_u64_get_bit(value: vec2u, bitIndex: u32) -> bool {
  if (bitIndex >= 64u) {
    return false;
  }
  if (bitIndex >= 32u) {
    return ((value.x >> (bitIndex - 32u)) & 1u) != 0u;
  }
  return ((value.y >> bitIndex) & 1u) != 0u;
}

fn fp64_u64_has_bits_below(value: vec2u, bitCount: u32) -> bool {
  if (bitCount == 0u) {
    return false;
  }
  if (bitCount >= 64u) {
    return !fp64_u64_is_zero(value);
  }
  if (bitCount > 32u) {
    let highBitCount = bitCount - 32u;
    let highMask = (1u << highBitCount) - 1u;
    return value.y != 0u || (value.x & highMask) != 0u;
  }
  if (bitCount == 32u) {
    return value.y != 0u;
  }
  let lowMask = (1u << bitCount) - 1u;
  return (value.y & lowMask) != 0u;
}

#ifndef LUMA_FP64_F32_INPUT_ONLY
fn fp64_u64_shift_right_sticky(value: vec2u, shift: u32) -> vec2u {
  var shifted = fp64_u64_shift_right(value, shift);
  if (fp64_u64_has_bits_below(value, shift)) {
    shifted.y = shifted.y | 1u;
  }
  return shifted;
}
#endif

fn fp64_u64_count_leading_zeros(value: vec2u) -> u32 {
  if (value.x != 0u) {
    return countLeadingZeros(value.x);
  }
  return 32u + countLeadingZeros(value.y);
}

fn fp64_round_shift_right_to_u32(value: vec2u, shift: u32) -> u32 {
  if (shift == 0u) {
    return value.y;
  }

  let truncated = fp64_u64_shift_right(value, shift);
  var rounded = truncated.y;
  let guard = fp64_u64_get_bit(value, shift - 1u);
  let hasTrailingBits = fp64_u64_has_bits_below(value, shift - 1u);
  if (guard && (hasTrailingBits || (rounded & 1u) == 1u)) {
    rounded = rounded + 1u;
  }
  return rounded;
}

#ifndef LUMA_FP64_F32_INPUT_ONLY
fn fp64_round_shift_right(value: vec2u, shift: u32) -> vec2u {
  if (shift == 0u) {
    return value;
  }

  var rounded = fp64_u64_shift_right(value, shift);
  let guard = fp64_u64_get_bit(value, shift - 1u);
  let hasTrailingBits = fp64_u64_has_bits_below(value, shift - 1u);
  if (guard && (hasTrailingBits || (rounded.y & 1u) == 1u)) {
    rounded = fp64_u64_add(rounded, vec2u(0u, 1u));
  }
  return rounded;
}
#endif

fn fp64_make_f32_bits_from_u64(sign: u32, significand: vec2u, baseExponent: i32) -> u32 {
  if (fp64_u64_is_zero(significand)) {
    return sign << 31u;
  }

  let leadingZeros = fp64_u64_count_leading_zeros(significand);
  let mostSignificantBit = 63u - leadingZeros;
  var exponent = baseExponent + i32(mostSignificantBit);

  if (exponent > 127) {
    return (sign << 31u) | 0x7f800000u;
  }

  if (exponent >= -126) {
    let shift = i32(mostSignificantBit) - 23;
    var significand24: u32;
    if (shift > 0) {
      significand24 = fp64_round_shift_right_to_u32(significand, u32(shift));
    } else {
      significand24 = fp64_u64_shift_left(significand, u32(-shift)).y;
    }

    if (significand24 >= 0x1000000u) {
      significand24 = significand24 >> 1u;
      exponent = exponent + 1;
      if (exponent > 127) {
        return (sign << 31u) | 0x7f800000u;
      }
    }

    return (sign << 31u) | (u32(exponent + 127) << 23u) | (significand24 & 0x7fffffu);
  }

  let scaleExponent = baseExponent + 149;
  var mantissa: u32;
  if (scaleExponent >= 0) {
    mantissa = fp64_u64_shift_left(significand, u32(scaleExponent)).y;
  } else {
    mantissa = fp64_round_shift_right_to_u32(significand, u32(-scaleExponent));
  }

  if (mantissa >= 0x800000u) {
    return (sign << 31u) | 0x00800000u;
  }
  return (sign << 31u) | mantissa;
}

#ifndef LUMA_FP64_F32_INPUT_ONLY
fn fp64_decode_bits(bits: vec2u) -> Fp64Bits {
  let sign = bits.x >> 31u;
  let exponentBits = (bits.x >> 20u) & 0x7ffu;
  let fractionHigh = bits.x & 0xfffffu;
  let fractionLow = bits.y;
  let fraction = vec2u(fractionHigh, fractionLow);

  if (exponentBits == 0x7ffu) {
    let isInf = fp64_u64_is_zero(fraction);
    return Fp64Bits(sign, 0, vec2u(0u), false, isInf, !isInf);
  }

  if (exponentBits == 0u) {
    let isZero = fp64_u64_is_zero(fraction);
    return Fp64Bits(sign, -1022, fraction, isZero, false, false);
  }

  return Fp64Bits(sign, i32(exponentBits) - 1023, vec2u((1u << 20u) | fractionHigh, fractionLow), false, false, false);
}

fn fp64_finite_magnitude_compare(a: Fp64Bits, b: Fp64Bits) -> i32 {
  if (a.exponent != b.exponent) {
    return select(-1, 1, a.exponent > b.exponent);
  }
  return fp64_u64_compare(a.significand, b.significand);
}
#endif

#ifndef LUMA_FP64_F32_INPUT_ONLY
struct Fp64RawF32Bits {
  sign: u32,
  baseExponent: i32,
  significand: u32,
  isZero: bool,
  isInf: bool,
  isNan: bool,
};

// Decode an f32 as (-1)^sign * significand * 2^baseExponent. This shared
// integer representation lets normalization remain independent of the
// selected double-single arithmetic implementation.
fn fp64_decode_raw_f32_bits(bits: u32) -> Fp64RawF32Bits {
  let sign = bits >> 31u;
  let exponentBits = (bits >> 23u) & 0xffu;
  let fraction = bits & 0x7fffffu;

  if (exponentBits == 0xffu) {
    return Fp64RawF32Bits(sign, 0, 0u, false, fraction == 0u, fraction != 0u);
  }
  if (exponentBits == 0u) {
    return Fp64RawF32Bits(sign, -149, fraction, fraction == 0u, false, false);
  }
  return Fp64RawF32Bits(
    sign,
    i32(exponentBits) - 150,
    0x800000u | fraction,
    false,
    false,
    false
  );
}

fn fp64_raw_f32_magnitude_compare(aBits: u32, bBits: u32) -> i32 {
  let aMagnitude = aBits & 0x7fffffffu;
  let bMagnitude = bBits & 0x7fffffffu;
  if (aMagnitude == bMagnitude) {
    return 0;
  }
  return select(-1, 1, aMagnitude > bMagnitude);
}

fn fp64_make_raw_residual_f32_bits(
  exactSign: u32,
  exactMagnitude: vec2u,
  exactBaseExponent: i32,
  highBits: u32
) -> u32 {
  if (fp64_u64_is_zero(exactMagnitude)) {
    return 0u;
  }

  let high = fp64_decode_raw_f32_bits(highBits);
  if (high.isInf || high.isNan) {
    return 0u;
  }
  if (high.isZero) {
    return fp64_make_f32_bits_from_u64(exactSign, exactMagnitude, exactBaseExponent);
  }

  let commonBaseExponent = min(exactBaseExponent, high.baseExponent);
  let exactShift = exactBaseExponent - commonBaseExponent;
  let highShift = high.baseExponent - commonBaseExponent;
  if (exactShift >= 64 || highShift >= 64) {
    return 0u;
  }

  let exactAligned = fp64_u64_shift_left(exactMagnitude, u32(exactShift));
  let highAligned = fp64_u64_shift_left(vec2u(0u, high.significand), u32(highShift));
  let comparison = fp64_u64_compare(exactAligned, highAligned);
  if (comparison == 0) {
    return 0u;
  }

  var residualSign = exactSign;
  var residualMagnitude: vec2u;
  if (comparison > 0) {
    residualMagnitude = fp64_u64_sub(exactAligned, highAligned);
  } else {
    residualSign = exactSign ^ 1u;
    residualMagnitude = fp64_u64_sub(highAligned, exactAligned);
  }
  return fp64_make_f32_bits_from_u64(
    residualSign,
    residualMagnitude,
    commonBaseExponent
  );
}

fn fp64_split_raw_accumulator_bits(
  sign: u32,
  magnitude: vec2u,
  baseExponent: i32
) -> vec2u {
  if (fp64_u64_is_zero(magnitude)) {
    return vec2u(0u);
  }
  let highBits = fp64_make_f32_bits_from_u64(sign, magnitude, baseExponent);
  let rawLowBits = fp64_make_raw_residual_f32_bits(sign, magnitude, baseExponent, highBits);
  let lowBits = select(rawLowBits, 0u, (rawLowBits & 0x7fffffffu) == 0u);
  if ((highBits & 0x7fffffffu) == 0u && (lowBits & 0x7fffffffu) == 0u) {
    return vec2u(0u);
  }
  return vec2u(highBits, lowBits);
}
#endif

#ifndef LUMA_FP64_F32_INPUT_ONLY
// Round an arithmetic accumulator to binary64 before splitting it. The
// aligned add/subtract paths retain three guard bits plus a sticky bit, which
// is sufficient for round-to-nearest-even at the binary64 boundary.
fn fp64_split_binary64_accumulator_bits(
  sign: u32,
  magnitude: vec2u,
  baseExponent: i32
) -> vec2u {
  if (fp64_u64_is_zero(magnitude)) {
    return vec2u(0u);
  }

  let mostSignificantBit = 63u - fp64_u64_count_leading_zeros(magnitude);
  let exponent = baseExponent + i32(mostSignificantBit);
  if (exponent > 1023) {
    return vec2u((sign << 31u) | 0x7f800000u, 0u);
  }

  var roundedMagnitude = magnitude;
  var roundedBaseExponent = baseExponent;
  if (exponent >= -1022) {
    if (mostSignificantBit > 52u) {
      let shift = mostSignificantBit - 52u;
      roundedMagnitude = fp64_round_shift_right(magnitude, shift);
      roundedBaseExponent = baseExponent + i32(shift);
    }
  } else {
    let shift = -1074 - baseExponent;
    if (shift > 0) {
      roundedMagnitude = fp64_round_shift_right(magnitude, u32(shift));
      roundedBaseExponent = -1074;
    }
  }

  if (fp64_u64_is_zero(roundedMagnitude)) {
    return vec2u(0u);
  }
  return fp64_split_raw_accumulator_bits(sign, roundedMagnitude, roundedBaseExponent);
}
#endif

#ifndef LUMA_FP64_PREDICATE_ONLY
fn fp64_add_raw_f32_bits(aBits: u32, bBits: u32) -> vec2u {
  let a = fp64_decode_raw_f32_bits(aBits);
  let b = fp64_decode_raw_f32_bits(bBits);

  if (a.isNan || b.isNan) {
    return vec2u(0x7fc00000u, 0u);
  }
  if (a.isInf || b.isInf) {
    if (a.isInf && b.isInf && a.sign != b.sign) {
      return vec2u(0x7fc00000u, 0u);
    }
    return select(vec2u(bBits, 0u), vec2u(aBits, 0u), a.isInf);
  }
  if (a.isZero && b.isZero) {
    return vec2u(0u);
  }
  if (a.isZero) {
    return vec2u(bBits, 0u);
  }
  if (b.isZero) {
    return vec2u(aBits, 0u);
  }

  let exponentDifference = abs(a.baseExponent - b.baseExponent);
  if (exponentDifference > 25) {
    if (fp64_raw_f32_magnitude_compare(aBits, bBits) >= 0) {
      return vec2u(aBits, bBits);
    }
    return vec2u(bBits, aBits);
  }

  let commonBaseExponent = min(a.baseExponent, b.baseExponent);
  let aMagnitude = fp64_u64_shift_left(
    vec2u(0u, a.significand),
    u32(a.baseExponent - commonBaseExponent)
  );
  let bMagnitude = fp64_u64_shift_left(
    vec2u(0u, b.significand),
    u32(b.baseExponent - commonBaseExponent)
  );

  var resultSign = a.sign;
  var resultMagnitude: vec2u;
  if (a.sign == b.sign) {
    resultMagnitude = fp64_u64_add(aMagnitude, bMagnitude);
  } else {
    let comparison = fp64_u64_compare(aMagnitude, bMagnitude);
    if (comparison == 0) {
      return vec2u(0u);
    }
    if (comparison > 0) {
      resultMagnitude = fp64_u64_sub(aMagnitude, bMagnitude);
    } else {
      resultSign = b.sign;
      resultMagnitude = fp64_u64_sub(bMagnitude, aMagnitude);
    }
  }

  return fp64_split_raw_accumulator_bits(
    resultSign,
    resultMagnitude,
    commonBaseExponent
  );
}
#endif

#ifndef LUMA_FP64_F32_INPUT_ONLY
fn fp64_add_aligned_magnitudes_to_fp64_bits(
  sign: u32,
  larger: Fp64Bits,
  smaller: Fp64Bits
) -> vec2u {
  let largeSignificand = fp64_u64_shift_left(larger.significand, 3u);
  let smallSignificand = fp64_u64_shift_right_sticky(
    fp64_u64_shift_left(smaller.significand, 3u),
    u32(larger.exponent - smaller.exponent)
  );
  let resultSignificand = fp64_u64_add(largeSignificand, smallSignificand);
  return fp64_split_binary64_accumulator_bits(
    sign,
    resultSignificand,
    larger.exponent - 55
  );
}

fn fp64_sub_aligned_magnitudes_to_fp64_bits(
  sign: u32,
  larger: Fp64Bits,
  smaller: Fp64Bits
) -> vec2u {
  let largeSignificand = fp64_u64_shift_left(larger.significand, 3u);
  let smallSignificand = fp64_u64_shift_right_sticky(
    fp64_u64_shift_left(smaller.significand, 3u),
    u32(larger.exponent - smaller.exponent)
  );
  let resultSignificand = fp64_u64_sub(largeSignificand, smallSignificand);
  return fp64_split_binary64_accumulator_bits(
    sign,
    resultSignificand,
    larger.exponent - 55
  );
}

fn fp64_add_aligned_magnitudes_to_f32_bits(sign: u32, larger: Fp64Bits, smaller: Fp64Bits) -> u32 {
  let largeSignificand = fp64_u64_shift_left(larger.significand, 3u);
  let smallSignificand = fp64_u64_shift_right_sticky(
    fp64_u64_shift_left(smaller.significand, 3u),
    u32(larger.exponent - smaller.exponent)
  );
  let resultSignificand = fp64_u64_add(largeSignificand, smallSignificand);
  return fp64_make_f32_bits_from_u64(sign, resultSignificand, larger.exponent - 55);
}

fn fp64_sub_aligned_magnitudes_to_f32_bits(sign: u32, larger: Fp64Bits, smaller: Fp64Bits) -> u32 {
  let largeSignificand = fp64_u64_shift_left(larger.significand, 3u);
  let smallSignificand = fp64_u64_shift_right_sticky(
    fp64_u64_shift_left(smaller.significand, 3u),
    u32(larger.exponent - smaller.exponent)
  );
  let resultSignificand = fp64_u64_sub(largeSignificand, smallSignificand);
  return fp64_make_f32_bits_from_u64(sign, resultSignificand, larger.exponent - 55);
}

// Subtract two raw binary64 values and round the exact result once to f32.
// The input words are canonical high/low words: .x contains sign/exponent/high
// fraction bits, and .y contains the low 32 fraction bits.
fn sub_fp64u32_to_f32_bits(aBits: vec2u, bBits: vec2u) -> u32 {
  let a = fp64_decode_bits(aBits);
  let b = fp64_decode_bits(bBits);
  let bSubtractionSign = b.sign ^ 1u;

  if (a.isNan || b.isNan) {
    return 0x7fc00000u;
  }
  if (a.isInf && b.isInf) {
    if (a.sign == bSubtractionSign) {
      return (a.sign << 31u) | 0x7f800000u;
    }
    return 0x7fc00000u;
  }
  if (a.isInf) {
    return (a.sign << 31u) | 0x7f800000u;
  }
  if (b.isInf) {
    return (bSubtractionSign << 31u) | 0x7f800000u;
  }
  if (a.isZero && b.isZero) {
    return select(0u, 0x80000000u, a.sign == 1u && b.sign == 0u);
  }

  let magnitudeComparison = fp64_finite_magnitude_compare(a, b);
  if (a.sign == bSubtractionSign) {
    if (magnitudeComparison >= 0) {
      return fp64_add_aligned_magnitudes_to_f32_bits(a.sign, a, b);
    }
    return fp64_add_aligned_magnitudes_to_f32_bits(a.sign, b, a);
  }

  if (magnitudeComparison == 0) {
    return 0u;
  }
  if (magnitudeComparison > 0) {
    return fp64_sub_aligned_magnitudes_to_f32_bits(a.sign, a, b);
  }
  return fp64_sub_aligned_magnitudes_to_f32_bits(bSubtractionSign, b, a);
}

fn sub_fp64u32_to_f32(aBits: vec2u, bBits: vec2u) -> f32 {
  return bitcast<f32>(sub_fp64u32_to_f32_bits(aBits, bBits));
}

// Subtract two raw binary64 values, round once to binary64, then split the
// result into normalized f32 limbs. Finite results must fit within the f32
// exponent range; larger magnitudes map to infinity and smaller magnitudes
// map to zero. The input words use canonical high/low word order.
fn sub_fp64u32_to_fp64_bits(aBits: vec2u, bBits: vec2u) -> vec2u {
  let a = fp64_decode_bits(aBits);
  let b = fp64_decode_bits(bBits);
  let bSubtractionSign = b.sign ^ 1u;

  if (a.isNan || b.isNan) {
    return vec2u(0x7fc00000u, 0u);
  }
  if (a.isInf && b.isInf) {
    if (a.sign == bSubtractionSign) {
      return vec2u((a.sign << 31u) | 0x7f800000u, 0u);
    }
    return vec2u(0x7fc00000u, 0u);
  }
  if (a.isInf) {
    return vec2u((a.sign << 31u) | 0x7f800000u, 0u);
  }
  if (b.isInf) {
    return vec2u((bSubtractionSign << 31u) | 0x7f800000u, 0u);
  }
  if (a.isZero && b.isZero) {
    return vec2u(0u);
  }

  let magnitudeComparison = fp64_finite_magnitude_compare(a, b);
  if (a.sign == bSubtractionSign) {
    if (magnitudeComparison >= 0) {
      return fp64_add_aligned_magnitudes_to_fp64_bits(a.sign, a, b);
    }
    return fp64_add_aligned_magnitudes_to_fp64_bits(a.sign, b, a);
  }

  if (magnitudeComparison == 0) {
    return vec2u(0u);
  }
  if (magnitudeComparison > 0) {
    return fp64_sub_aligned_magnitudes_to_fp64_bits(a.sign, a, b);
  }
  return fp64_sub_aligned_magnitudes_to_fp64_bits(bSubtractionSign, b, a);
}

fn sub_fp64u32_to_fp64(aBits: vec2u, bBits: vec2u) -> vec2f {
  let resultBits = sub_fp64u32_to_fp64_bits(aBits, bBits);
  return vec2f(bitcast<f32>(resultBits.x), bitcast<f32>(resultBits.y));
}
#endif

#ifndef LUMA_FP64_PREDICATE_ONLY
fn fp64_runtime_zero() -> f32 {
  return fp64arithmetic.ONE * 0.0;
}

fn prevent_fp64_optimization(value: f32) -> f32 {
#ifdef LUMA_FP64_CODE_ELIMINATION_WORKAROUND
  return value + fp64_runtime_zero();
#else
  return value;
#endif
}
#endif

#ifdef LUMA_FP64_INTEGER_ARITHMETIC
${Zx}
#else
fn split(a: f32) -> vec2f {
  let splitValue = prevent_fp64_optimization(fp64arithmetic.SPLIT + fp64_runtime_zero());
  let t = prevent_fp64_optimization(a * splitValue);
  let temp = prevent_fp64_optimization(t - a);
  let aHi = prevent_fp64_optimization(t - temp);
  let aLo = prevent_fp64_optimization(a - aHi);
  return vec2f(aHi, aLo);
}

fn split2(a: vec2f) -> vec2f {
  var b = split(a.x);
  b.y = b.y + a.y;
  return b;
}

fn quickTwoSum(a: f32, b: f32) -> vec2f {
#ifdef LUMA_FP64_CODE_ELIMINATION_WORKAROUND
  let sum = prevent_fp64_optimization((a + b) * fp64arithmetic.ONE);
  let err = prevent_fp64_optimization(b - (sum - a) * fp64arithmetic.ONE);
#else
  let sum = prevent_fp64_optimization(a + b);
  let err = prevent_fp64_optimization(b - (sum - a));
#endif
  return vec2f(sum, err);
}

fn twoSum(a: f32, b: f32) -> vec2f {
  let s = prevent_fp64_optimization(a + b);
#ifdef LUMA_FP64_CODE_ELIMINATION_WORKAROUND
  let v = prevent_fp64_optimization((s * fp64arithmetic.ONE - a) * fp64arithmetic.ONE);
  let err =
    prevent_fp64_optimization((a - (s - v) * fp64arithmetic.ONE) *
      fp64arithmetic.ONE *
      fp64arithmetic.ONE *
      fp64arithmetic.ONE) +
    prevent_fp64_optimization(b - v);
#else
  let v = prevent_fp64_optimization(s - a);
  let err = prevent_fp64_optimization(a - (s - v)) + prevent_fp64_optimization(b - v);
#endif
  return vec2f(s, err);
}

fn twoSub(a: f32, b: f32) -> vec2f {
  let s = prevent_fp64_optimization(a - b);
#ifdef LUMA_FP64_CODE_ELIMINATION_WORKAROUND
  let v = prevent_fp64_optimization((s * fp64arithmetic.ONE - a) * fp64arithmetic.ONE);
  let err =
    prevent_fp64_optimization((a - (s - v) * fp64arithmetic.ONE) *
      fp64arithmetic.ONE *
      fp64arithmetic.ONE *
      fp64arithmetic.ONE) -
    prevent_fp64_optimization(b + v);
#else
  let v = prevent_fp64_optimization(s - a);
  let err = prevent_fp64_optimization(a - (s - v)) - prevent_fp64_optimization(b + v);
#endif
  return vec2f(s, err);
}

fn twoSqr(a: f32) -> vec2f {
  let prod = prevent_fp64_optimization(a * a);
  let aFp64 = split(a);
  let highProduct = prevent_fp64_optimization(aFp64.x * aFp64.x);
  let crossProduct = prevent_fp64_optimization(2.0 * aFp64.x * aFp64.y);
  let lowProduct = prevent_fp64_optimization(aFp64.y * aFp64.y);
#ifdef LUMA_FP64_CODE_ELIMINATION_WORKAROUND
  let err =
    (prevent_fp64_optimization(highProduct - prod) * fp64arithmetic.ONE +
      crossProduct * fp64arithmetic.ONE * fp64arithmetic.ONE) +
    lowProduct * fp64arithmetic.ONE * fp64arithmetic.ONE * fp64arithmetic.ONE;
#else
  let err = ((prevent_fp64_optimization(highProduct - prod) + crossProduct) + lowProduct);
#endif
  return vec2f(prod, err);
}

fn twoProd(a: f32, b: f32) -> vec2f {
  let prod = prevent_fp64_optimization(a * b);
  let aFp64 = split(a);
  let bFp64 = split(b);
  let highProduct = prevent_fp64_optimization(aFp64.x * bFp64.x);
  let crossProduct1 = prevent_fp64_optimization(aFp64.x * bFp64.y);
  let crossProduct2 = prevent_fp64_optimization(aFp64.y * bFp64.x);
  let lowProduct = prevent_fp64_optimization(aFp64.y * bFp64.y);
#ifdef LUMA_FP64_CODE_ELIMINATION_WORKAROUND
  let err1 = (highProduct - prod) * fp64arithmetic.ONE;
  let err2 = crossProduct1 * fp64arithmetic.ONE * fp64arithmetic.ONE;
  let err3 = crossProduct2 * fp64arithmetic.ONE * fp64arithmetic.ONE * fp64arithmetic.ONE;
  let err4 =
    lowProduct *
    fp64arithmetic.ONE *
    fp64arithmetic.ONE *
    fp64arithmetic.ONE *
    fp64arithmetic.ONE;
#else
  let err1 = highProduct - prod;
  let err2 = crossProduct1;
  let err3 = crossProduct2;
  let err4 = lowProduct;
#endif
  let err12InputA = prevent_fp64_optimization(err1);
  let err12InputB = prevent_fp64_optimization(err2);
  let err12 = prevent_fp64_optimization(err12InputA + err12InputB);
  let err123InputA = prevent_fp64_optimization(err12);
  let err123InputB = prevent_fp64_optimization(err3);
  let err123 = prevent_fp64_optimization(err123InputA + err123InputB);
  let err1234InputA = prevent_fp64_optimization(err123);
  let err1234InputB = prevent_fp64_optimization(err4);
  let err = prevent_fp64_optimization(err1234InputA + err1234InputB);
  return vec2f(prod, err);
}

fn sum_fp64(a: vec2f, b: vec2f) -> vec2f {
  var s = twoSum(a.x, b.x);
  let t = twoSum(a.y, b.y);
  s.y = prevent_fp64_optimization(s.y + t.x);
  s = quickTwoSum(s.x, s.y);
  s.y = prevent_fp64_optimization(s.y + t.y);
  s = quickTwoSum(s.x, s.y);
  return s;
}

fn sub_fp64(a: vec2f, b: vec2f) -> vec2f {
  var s = twoSub(a.x, b.x);
  let t = twoSub(a.y, b.y);
  s.y = prevent_fp64_optimization(s.y + t.x);
  s = quickTwoSum(s.x, s.y);
  s.y = prevent_fp64_optimization(s.y + t.y);
  s = quickTwoSum(s.x, s.y);
  return s;
}

fn mul_fp64(a: vec2f, b: vec2f) -> vec2f {
  var prod = twoProd(a.x, b.x);
  let crossProduct1 = prevent_fp64_optimization(a.x * b.y);
  prod.y = prevent_fp64_optimization(prod.y + crossProduct1);
#ifdef LUMA_FP64_HIGH_BITS_OVERFLOW_WORKAROUND
  prod = split2(prod);
#endif
  prod = quickTwoSum(prod.x, prod.y);
  let crossProduct2 = prevent_fp64_optimization(a.y * b.x);
  prod.y = prevent_fp64_optimization(prod.y + crossProduct2);
#ifdef LUMA_FP64_HIGH_BITS_OVERFLOW_WORKAROUND
  prod = split2(prod);
#endif
  prod = quickTwoSum(prod.x, prod.y);
  return prod;
}

#ifndef LUMA_FP64_PREDICATE_ONLY
fn div_fp64(a: vec2f, b: vec2f) -> vec2f {
  let xn = prevent_fp64_optimization(1.0 / b.x);
  let yn = mul_fp64(a, vec2f(xn, fp64_runtime_zero()));
  let diff = prevent_fp64_optimization(sub_fp64(a, mul_fp64(b, yn)).x);
  let prod = twoProd(xn, diff);
  return sum_fp64(yn, prod);
}

fn sqrt_fp64(a: vec2f) -> vec2f {
  if (a.x == 0.0 && a.y == 0.0) {
    return vec2f(0.0, 0.0);
  }
  if (a.x < 0.0) {
    let nanValue = fp64_nan(a.x);
    return vec2f(nanValue, nanValue);
  }

  let x = prevent_fp64_optimization(1.0 / sqrt(a.x));
  let yn = prevent_fp64_optimization(a.x * x);
#ifdef LUMA_FP64_CODE_ELIMINATION_WORKAROUND
  let ynSqr = twoSqr(yn) * fp64arithmetic.ONE;
#else
  let ynSqr = twoSqr(yn);
#endif
  let diff = prevent_fp64_optimization(sub_fp64(a, ynSqr).x);
  let prod = twoProd(prevent_fp64_optimization(x * 0.5), diff);
#ifdef LUMA_FP64_HIGH_BITS_OVERFLOW_WORKAROUND
  return sum_fp64(split(yn), prod);
#else
  return sum_fp64(vec2f(yn, 0.0), prod);
#endif
}
#endif
#endif

#ifndef LUMA_FP64_PREDICATE_ONLY
fn fp64_f32_bits_is_nan(bits: u32) -> bool {
  return (bits & 0x7fffffffu) > 0x7f800000u;
}

fn fp64_f32_bits_is_inf(bits: u32) -> bool {
  return (bits & 0x7fffffffu) == 0x7f800000u;
}

fn fp64_compare_f32_bits(aBits: u32, bBits: u32) -> i32 {
  let aMagnitude = aBits & 0x7fffffffu;
  let bMagnitude = bBits & 0x7fffffffu;
  if (aMagnitude == 0u && bMagnitude == 0u) {
    return 0;
  }
  let aSign = aBits >> 31u;
  let bSign = bBits >> 31u;
  if (aSign != bSign) {
    return select(1, -1, aSign == 1u);
  }
  if (aMagnitude == bMagnitude) {
    return 0;
  }
  let magnitudeComparison = select(-1, 1, aMagnitude > bMagnitude);
  return select(magnitudeComparison, -magnitudeComparison, aSign == 1u);
}

// Normalize an arbitrary pair of finite f32 limbs with integer accumulation.
// This is independent of LUMA_FP64_INTEGER_ARITHMETIC and canonicalizes every
// representation of zero to vec2f(+0.0, +0.0).
fn normalize_fp64(value: vec2f) -> vec2f {
  let resultBits = fp64_add_raw_f32_bits(bitcast<u32>(value.x), bitcast<u32>(value.y));
  return vec2f(bitcast<f32>(resultBits.x), bitcast<f32>(resultBits.y));
}

fn is_nan_fp64(value: vec2f) -> bool {
  let normalized = normalize_fp64(value);
  return fp64_f32_bits_is_nan(bitcast<u32>(normalized.x)) ||
    fp64_f32_bits_is_nan(bitcast<u32>(normalized.y));
}

fn is_finite_fp64(value: vec2f) -> bool {
  let normalized = normalize_fp64(value);
  let highBits = bitcast<u32>(normalized.x);
  let lowBits = bitcast<u32>(normalized.y);
  return !fp64_f32_bits_is_nan(highBits) && !fp64_f32_bits_is_nan(lowBits) &&
    !fp64_f32_bits_is_inf(highBits) && !fp64_f32_bits_is_inf(lowBits);
}

// Returns -1, 0, or 1. NaN is unordered and returns 0; call is_nan_fp64 or
// is_finite_fp64 first when 0 must mean a finite zero.
fn sign_fp64(value: vec2f) -> i32 {
  let normalized = normalize_fp64(value);
  let highBits = bitcast<u32>(normalized.x);
  let lowBits = bitcast<u32>(normalized.y);
  if (fp64_f32_bits_is_nan(highBits) || fp64_f32_bits_is_nan(lowBits)) {
    return 0;
  }
  if ((highBits & 0x7fffffffu) != 0u) {
    return select(1, -1, (highBits >> 31u) == 1u);
  }
  if ((lowBits & 0x7fffffffu) != 0u) {
    return select(1, -1, (lowBits >> 31u) == 1u);
  }
  return 0;
}

// Compares double-single values and returns -1, 0, or 1. NaN is unordered
// and returns 0; callers that require equality semantics must first check
// is_nan_fp64 or is_finite_fp64.
fn compare_fp64(a: vec2f, b: vec2f) -> i32 {
  let normalizedA = normalize_fp64(a);
  let normalizedB = normalize_fp64(b);
  let aHighBits = bitcast<u32>(normalizedA.x);
  let aLowBits = bitcast<u32>(normalizedA.y);
  let bHighBits = bitcast<u32>(normalizedB.x);
  let bLowBits = bitcast<u32>(normalizedB.y);
  if (fp64_f32_bits_is_nan(aHighBits) || fp64_f32_bits_is_nan(aLowBits) ||
      fp64_f32_bits_is_nan(bHighBits) || fp64_f32_bits_is_nan(bLowBits)) {
    return 0;
  }
  let highComparison = fp64_compare_f32_bits(aHighBits, bHighBits);
  if (highComparison != 0) {
    return highComparison;
  }
  return fp64_compare_f32_bits(aLowBits, bLowBits);
}
#endif
`});var xM,Fh,Jx=_(()=>{jx();qx();Qx();xM={ONE:1,SPLIT:4097},Fh={name:"fp64arithmetic",source:Kx,fs:Nh,vs:Nh,defaultUniforms:xM,uniformTypes:{ONE:"f32",SPLIT:"f32"},fp64ify:Bh,fp64LowPart:Vx,fp64ifyMatrix4:Wx}});function t0(r){return`layout(std140) uniform ${r}Uniforms {
  float useByteColors;
} ${r};

vec3 ${r}_normalize(vec3 inputColor) {
  return ${r}.useByteColors > 0.5 ? inputColor / 255.0 : inputColor;
}

vec4 ${r}_normalize(vec4 inputColor) {
  return ${r}.useByteColors > 0.5 ? inputColor / 255.0 : inputColor;
}

vec4 ${r}_premultiplyAlpha(vec4 inputColor) {
  return vec4(inputColor.rgb * inputColor.a, inputColor.a);
}

vec4 ${r}_unpremultiplyAlpha(vec4 inputColor) {
  return inputColor.a > 0.0 ? vec4(inputColor.rgb / inputColor.a, inputColor.a) : vec4(0.0);
}

vec4 ${r}_premultiply_alpha(vec4 inputColor) {
  return ${r}_premultiplyAlpha(inputColor);
}

vec4 ${r}_unpremultiply_alpha(vec4 inputColor) {
  return ${r}_unpremultiplyAlpha(inputColor);
}
`}function r0(r){return`struct ${r}Uniforms {
  useByteColors: f32
};

@group(0) @binding(auto) var<uniform> ${r} : ${r}Uniforms;

fn ${r}_normalize(inputColor: vec3<f32>) -> vec3<f32> {
  return select(inputColor, inputColor / 255.0, ${r}.useByteColors > 0.5);
}

fn ${r}_normalize4(inputColor: vec4<f32>) -> vec4<f32> {
  return select(inputColor, inputColor / 255.0, ${r}.useByteColors > 0.5);
}

fn ${r}_premultiplyAlpha(inputColor: vec4<f32>) -> vec4<f32> {
  return vec4<f32>(inputColor.rgb * inputColor.a, inputColor.a);
}

fn ${r}_unpremultiplyAlpha(inputColor: vec4<f32>) -> vec4<f32> {
  return select(
    vec4<f32>(0.0),
    vec4<f32>(inputColor.rgb / inputColor.a, inputColor.a),
    inputColor.a > 0.0
  );
}

fn ${r}_premultiply_alpha(inputColor: vec4<f32>) -> vec4<f32> {
  return ${r}_premultiplyAlpha(inputColor);
}

fn ${r}_unpremultiply_alpha(inputColor: vec4<f32>) -> vec4<f32> {
  return ${r}_unpremultiplyAlpha(inputColor);
}
`}var Wt,vM,wM,C5,M5,EM,PM,R5,I5,e0,O5,SM,B5,Ic,Uh=_(()=>{Wt={RGBA8UNORM:0,RGBA16FLOAT:1,RGBA32FLOAT:2},vM={rgba8unorm:4,rgba16float:8,rgba32float:16},wM={...vM},C5={rgba8unorm:Wt.RGBA8UNORM,rgba16float:Wt.RGBA16FLOAT,rgba32float:Wt.RGBA32FLOAT},M5={[Wt.RGBA8UNORM]:"rgba8unorm",[Wt.RGBA16FLOAT]:"rgba16float",[Wt.RGBA32FLOAT]:"rgba32float"},EM={useByteColors:"f32"},PM={useByteColors:!0},R5={format:Wt.RGBA8UNORM,wordStride:wM.rgba8unorm/Uint32Array.BYTES_PER_ELEMENT,wordOffset:0,_padding:0},I5=t0("colors"),e0=t0("floatColors"),O5=r0("colors"),SM=r0("floatColors"),B5=`struct storageColorsUniforms {
  format: u32,
  wordStride: u32,
  wordOffset: u32,
  _padding: u32
};

@group(0) @binding(auto) var<uniform> storageColors : storageColorsUniforms;
@group(0) @binding(auto) var<storage, read> storageColorsBuffer : array<u32>;

const STORAGE_COLOR_FORMAT_RGBA8UNORM : u32 = ${Wt.RGBA8UNORM}u;
const STORAGE_COLOR_FORMAT_RGBA16FLOAT : u32 = ${Wt.RGBA16FLOAT}u;

fn storageColors_getWordIndex(rowIndex: u32) -> u32 {
  return storageColors.wordOffset + rowIndex * storageColors.wordStride;
}

fn storageColors_readRgba8UnormColor(wordIndex: u32) -> vec4<f32> {
  return unpack4x8unorm(storageColorsBuffer[wordIndex]);
}

fn storageColors_readRgba16FloatColor(wordIndex: u32) -> vec4<f32> {
  let redGreen = unpack2x16float(storageColorsBuffer[wordIndex]);
  let blueAlpha = unpack2x16float(storageColorsBuffer[wordIndex + 1u]);
  return vec4<f32>(redGreen.x, redGreen.y, blueAlpha.x, blueAlpha.y);
}

fn storageColors_readRgba32FloatColor(wordIndex: u32) -> vec4<f32> {
  return vec4<f32>(
    bitcast<f32>(storageColorsBuffer[wordIndex]),
    bitcast<f32>(storageColorsBuffer[wordIndex + 1u]),
    bitcast<f32>(storageColorsBuffer[wordIndex + 2u]),
    bitcast<f32>(storageColorsBuffer[wordIndex + 3u])
  );
}

fn storageColors_readColor(rowIndex: u32) -> vec4<f32> {
  let wordIndex = storageColors_getWordIndex(rowIndex);
  if (storageColors.format == STORAGE_COLOR_FORMAT_RGBA8UNORM) {
    return storageColors_readRgba8UnormColor(wordIndex);
  }
  if (storageColors.format == STORAGE_COLOR_FORMAT_RGBA16FLOAT) {
    return storageColors_readRgba16FloatColor(wordIndex);
  }
  return storageColors_readRgba32FloatColor(wordIndex);
}
`;Ic={name:"floatColors",props:{},uniforms:{},vs:e0,fs:e0,source:SM,uniformTypes:EM,defaultUniforms:PM}});function CM(r={},e){let t={},n=Rc(r.useByteColors,!0);if(r.highlightedObjectColor!==void 0)if(r.highlightedObjectColor===null)t.isHighlightActive=!1;else{t.isHighlightActive=!0;let i=r.highlightedObjectColor.slice(0,3);t.highlightedObjectColor=i}return r.highlightColor&&(t.highlightColor=Hx(r.highlightColor,n)),r.isActive!==void 0&&(t.isActive=!!r.isActive,t.isAttribute=!!r.isAttribute),r.useByteColors!==void 0&&(t.useByteColors=!!r.useByteColors),t}var TM,LM,AM,gr,n0=_(()=>{kh();TM=[0,1,1,1],LM=`layout(std140) uniform pickingUniforms {
  float isActive;
  float isAttribute;
  float isHighlightActive;
  float useByteColors;
  vec3 highlightedObjectColor;
  vec4 highlightColor;
} picking;

out vec4 picking_vRGBcolor_Avalid;

// Normalize unsigned byte color to 0-1 range
vec3 picking_normalizeColor(vec3 color) {
  return picking.useByteColors > 0.5 ? color / 255.0 : color;
}

// Normalize unsigned byte color to 0-1 range
vec4 picking_normalizeColor(vec4 color) {
  return picking.useByteColors > 0.5 ? color / 255.0 : color;
}

bool picking_isColorZero(vec3 color) {
  return dot(color, vec3(1.0)) < 0.00001;
}

bool picking_isColorValid(vec3 color) {
  return dot(color, vec3(1.0)) > 0.00001;
}

// Check if this vertex is highlighted 
bool isVertexHighlighted(vec3 vertexColor) {
  vec3 highlightedObjectColor = picking_normalizeColor(picking.highlightedObjectColor);
  return
    bool(picking.isHighlightActive) && picking_isColorZero(abs(vertexColor - highlightedObjectColor));
}

// Set the current picking color
void picking_setPickingColor(vec3 pickingColor) {
  pickingColor = picking_normalizeColor(pickingColor);

  if (bool(picking.isActive)) {
    // Use alpha as the validity flag. If pickingColor is [0, 0, 0] fragment is non-pickable
    picking_vRGBcolor_Avalid.a = float(picking_isColorValid(pickingColor));

    if (!bool(picking.isAttribute)) {
      // Stores the picking color so that the fragment shader can render it during picking
      picking_vRGBcolor_Avalid.rgb = pickingColor;
    }
  } else {
    // Do the comparison with selected item color in vertex shader as it should mean fewer compares
    picking_vRGBcolor_Avalid.a = float(isVertexHighlighted(pickingColor));
  }
}

void picking_setPickingAttribute(float value) {
  if (bool(picking.isAttribute)) {
    picking_vRGBcolor_Avalid.r = value;
  }
}

void picking_setPickingAttribute(vec2 value) {
  if (bool(picking.isAttribute)) {
    picking_vRGBcolor_Avalid.rg = value;
  }
}

void picking_setPickingAttribute(vec3 value) {
  if (bool(picking.isAttribute)) {
    picking_vRGBcolor_Avalid.rgb = value;
  }
}
`,AM=`layout(std140) uniform pickingUniforms {
  float isActive;
  float isAttribute;
  float isHighlightActive;
  float useByteColors;
  vec3 highlightedObjectColor;
  vec4 highlightColor;
} picking;

in vec4 picking_vRGBcolor_Avalid;

/*
 * Returns highlight color if this item is selected.
 */
vec4 picking_filterHighlightColor(vec4 color) {
  // If we are still picking, we don't highlight
  if (picking.isActive > 0.5) {
    return color;
  }

  bool selected = bool(picking_vRGBcolor_Avalid.a);

  if (selected) {
    // Blend in highlight color based on its alpha value
    float highLightAlpha = picking.highlightColor.a;
    float blendedAlpha = highLightAlpha + color.a * (1.0 - highLightAlpha);
    float highLightRatio = highLightAlpha / blendedAlpha;

    vec3 blendedRGB = mix(color.rgb, picking.highlightColor.rgb, highLightRatio);
    return vec4(blendedRGB, blendedAlpha);
  } else {
    return color;
  }
}

/*
 * Returns picking color if picking enabled else unmodified argument.
 */
vec4 picking_filterPickingColor(vec4 color) {
  if (bool(picking.isActive)) {
    if (picking_vRGBcolor_Avalid.a == 0.0) {
      discard;
    }
    return picking_vRGBcolor_Avalid;
  }
  return color;
}

/*
 * Returns picking color if picking is enabled if not
 * highlight color if this item is selected, otherwise unmodified argument.
 */
vec4 picking_filterColor(vec4 color) {
  vec4 highlightColor = picking_filterHighlightColor(color);
  return picking_filterPickingColor(highlightColor);
}
`,gr={props:{},uniforms:{},name:"picking",uniformTypes:{isActive:"f32",isAttribute:"f32",isHighlightActive:"f32",useByteColors:"f32",highlightedObjectColor:"vec3<f32>",highlightColor:"vec4<f32>"},defaultUniforms:{isActive:!1,isAttribute:!1,isHighlightActive:!1,useByteColors:!0,highlightedObjectColor:[0,0,0],highlightColor:TM},vs:LM,fs:AM,getUniforms:CM}});var Gh,i0=_(()=>{Gh=`precision highp int;

// #if (defined(SHADER_TYPE_FRAGMENT) && defined(LIGHTING_FRAGMENT)) || (defined(SHADER_TYPE_VERTEX) && defined(LIGHTING_VERTEX))
struct AmbientLight {
  vec3 color;
};

struct PointLight {
  vec3 color;
  vec3 position;
  vec3 attenuation; // 2nd order x:Constant-y:Linear-z:Exponential
};

struct SpotLight {
  vec3 color;
  vec3 position;
  vec3 direction;
  vec3 attenuation;
  vec2 coneCos;
};

struct DirectionalLight {
  vec3 color;
  vec3 direction;
};

struct UniformLight {
  vec3 color;
  vec3 position;
  vec3 direction;
  vec3 attenuation;
  vec2 coneCos;
};

layout(std140) uniform lightingUniforms {
  int enabled;
  int directionalLightCount;
  int pointLightCount;
  int spotLightCount;
  vec3 ambientColor;
  UniformLight lights[5];
} lighting;

PointLight lighting_getPointLight(int index) {
  UniformLight light = lighting.lights[index];
  return PointLight(light.color, light.position, light.attenuation);
}

SpotLight lighting_getSpotLight(int index) {
  UniformLight light = lighting.lights[lighting.pointLightCount + index];
  return SpotLight(light.color, light.position, light.direction, light.attenuation, light.coneCos);
}

DirectionalLight lighting_getDirectionalLight(int index) {
  UniformLight light =
    lighting.lights[lighting.pointLightCount + lighting.spotLightCount + index];
  return DirectionalLight(light.color, light.direction);
}

float getPointLightAttenuation(PointLight pointLight, float distance) {
  return pointLight.attenuation.x
       + pointLight.attenuation.y * distance
       + pointLight.attenuation.z * distance * distance;
}

float getSpotLightAttenuation(SpotLight spotLight, vec3 positionWorldspace) {
  vec3 light_direction = normalize(positionWorldspace - spotLight.position);
  float coneFactor = smoothstep(
    spotLight.coneCos.y,
    spotLight.coneCos.x,
    dot(normalize(spotLight.direction), light_direction)
  );
  float distanceAttenuation = getPointLightAttenuation(
    PointLight(spotLight.color, spotLight.position, spotLight.attenuation),
    distance(spotLight.position, positionWorldspace)
  );
  return distanceAttenuation / max(coneFactor, 0.0001);
}

// #endif
`});var o0,s0=_(()=>{o0=`// #if (defined(SHADER_TYPE_FRAGMENT) && defined(LIGHTING_FRAGMENT)) || (defined(SHADER_TYPE_VERTEX) && defined(LIGHTING_VERTEX))
const MAX_LIGHTS: i32 = 5;

struct AmbientLight {
  color: vec3<f32>,
};

struct PointLight {
  color: vec3<f32>,
  position: vec3<f32>,
  attenuation: vec3<f32>, // 2nd order x:Constant-y:Linear-z:Exponential
};

struct SpotLight {
  color: vec3<f32>,
  position: vec3<f32>,
  direction: vec3<f32>,
  attenuation: vec3<f32>,
  coneCos: vec2<f32>,
};

struct DirectionalLight {
  color: vec3<f32>,
  direction: vec3<f32>,
};

struct UniformLight {
  color: vec3<f32>,
  position: vec3<f32>,
  direction: vec3<f32>,
  attenuation: vec3<f32>,
  coneCos: vec2<f32>,
};

struct lightingUniforms {
  enabled: i32,
  directionalLightCount: i32,
  pointLightCount: i32,
  spotLightCount: i32,
  ambientColor: vec3<f32>,
  lights: array<UniformLight, 5>,
};

@group(2) @binding(auto) var<uniform> lighting : lightingUniforms;

fn lighting_getPointLight(index: i32) -> PointLight {
  let light = lighting.lights[index];
  return PointLight(light.color, light.position, light.attenuation);
}

fn lighting_getSpotLight(index: i32) -> SpotLight {
  let light = lighting.lights[lighting.pointLightCount + index];
  return SpotLight(light.color, light.position, light.direction, light.attenuation, light.coneCos);
}

fn lighting_getDirectionalLight(index: i32) -> DirectionalLight {
  let light = lighting.lights[lighting.pointLightCount + lighting.spotLightCount + index];
  return DirectionalLight(light.color, light.direction);
}

fn getPointLightAttenuation(pointLight: PointLight, distance: f32) -> f32 {
  return pointLight.attenuation.x
       + pointLight.attenuation.y * distance
       + pointLight.attenuation.z * distance * distance;
}

fn getSpotLightAttenuation(spotLight: SpotLight, positionWorldspace: vec3<f32>) -> f32 {
  let lightDirection = normalize(positionWorldspace - spotLight.position);
  let coneFactor = smoothstep(
    spotLight.coneCos.y,
    spotLight.coneCos.x,
    dot(normalize(spotLight.direction), lightDirection)
  );
  let distanceAttenuation = getPointLightAttenuation(
    PointLight(spotLight.color, spotLight.position, spotLight.attenuation),
    distance(spotLight.position, positionWorldspace)
  );
  return distanceAttenuation / max(coneFactor, 0.0001);
}
`});function RM(r,e={}){if(r=r&&{...r},!r)return Bc();r.lights&&(r={...r,...OM(r.lights),lights:void 0});let{useByteColors:t,ambientLight:n,pointLights:i,spotLights:o,directionalLights:s}=r||{};if(!(n||i&&i.length>0||o&&o.length>0||s&&s.length>0))return{...Bc(),enabled:0};let c={...Bc(),...IM({useByteColors:t,ambientLight:n,pointLights:i,spotLights:o,directionalLights:s})};return r.enabled!==void 0&&(c.enabled=r.enabled?1:0),c}function IM({useByteColors:r,ambientLight:e,pointLights:t=[],spotLights:n=[],directionalLights:i=[]}){let o=a0(),s=0,a=0,c=0,l=0;for(let u of t){if(s>=sn)break;o[s]={...o[s],color:Oc(u,r),position:u.position,attenuation:u.attenuation||[1,0,0]},s++,a++}for(let u of n){if(s>=sn)break;o[s]={...o[s],color:Oc(u,r),position:u.position,direction:u.direction,attenuation:u.attenuation||[1,0,0],coneCos:DM(u)},s++,c++}for(let u of i){if(s>=sn)break;o[s]={...o[s],color:Oc(u,r),direction:u.direction},s++,l++}return t.length+n.length+i.length>sn&&P.warn(`MAX_LIGHTS exceeded, truncating to ${sn}`)(),{ambientColor:Oc(e,r),directionalLightCount:l,pointLightCount:a,spotLightCount:c,lights:o}}function OM(r){let e={pointLights:[],spotLights:[],directionalLights:[]};for(let t of r||[])switch(t.type){case"ambient":e.ambientLight=t;break;case"directional":e.directionalLights?.push(t);break;case"point":e.pointLights?.push(t);break;case"spot":e.spotLights?.push(t);break;default:}return e}function Oc(r={},e){let{color:t=[0,0,0],intensity:n=1}=r;return Dh(t,Rc(e,!0)).map(o=>o*n)}function Bc(){return{enabled:1,directionalLightCount:0,pointLightCount:0,spotLightCount:0,ambientColor:[.1,.1,.1],lights:a0()}}function a0(){return Array.from({length:sn},()=>BM())}function BM(){return{color:[1,1,1],position:[1,1,2],direction:[1,1,1],attenuation:[1,0,0],coneCos:[1,0]}}function DM(r){let e=r.innerConeAngle??0,t=r.outerConeAngle??Math.PI/4;return[Math.cos(e),Math.cos(t)]}var sn,MM,Dc,zh=_(()=>{I();i0();s0();kh();sn=5,MM={color:"vec3<f32>",position:"vec3<f32>",direction:"vec3<f32>",attenuation:"vec3<f32>",coneCos:"vec2<f32>"},Dc={props:{},uniforms:{},name:"lighting",defines:{},uniformTypes:{enabled:"i32",directionalLightCount:"i32",pointLightCount:"i32",spotLightCount:"i32",ambientColor:"vec3<f32>",lights:[MM,sn]},defaultUniforms:Bc(),bindingLayout:[{name:"lighting",group:2}],firstBindingSlot:0,source:o0,vs:Gh,fs:Gh,getUniforms:RM}});var kc,Nc,$h=_(()=>{kc=`layout(std140) uniform phongMaterialUniforms {
  uniform bool unlit;
  uniform float ambient;
  uniform float diffuse;
  uniform float shininess;
  uniform vec3  specularColor;
} material;
`,Nc=`layout(std140) uniform phongMaterialUniforms {
  uniform bool unlit;
  uniform float ambient;
  uniform float diffuse;
  uniform float shininess;
  uniform vec3  specularColor;
} material;

vec3 lighting_getLightColor(vec3 surfaceColor, vec3 light_direction, vec3 view_direction, vec3 normal_worldspace, vec3 color) {
  vec3 halfway_direction = normalize(light_direction + view_direction);
  float lambertian = dot(light_direction, normal_worldspace);
  float specular = 0.0;
  if (lambertian > 0.0) {
    float specular_angle = max(dot(normal_worldspace, halfway_direction), 0.0);
    specular = pow(specular_angle, material.shininess);
  }
  lambertian = max(lambertian, 0.0);
  return (lambertian * material.diffuse * surfaceColor + specular * floatColors_normalize(material.specularColor)) * color;
}

vec3 lighting_getLightColor(vec3 surfaceColor, vec3 cameraPosition, vec3 position_worldspace, vec3 normal_worldspace) {
  vec3 lightColor = surfaceColor;

  if (material.unlit) {
    return surfaceColor;
  }

  if (lighting.enabled == 0) {
    return lightColor;
  }

  vec3 view_direction = normalize(cameraPosition - position_worldspace);
  lightColor = material.ambient * surfaceColor * lighting.ambientColor;

  for (int i = 0; i < lighting.pointLightCount; i++) {
    PointLight pointLight = lighting_getPointLight(i);
    vec3 light_position_worldspace = pointLight.position;
    vec3 light_direction = normalize(light_position_worldspace - position_worldspace);
    float light_attenuation = getPointLightAttenuation(pointLight, distance(light_position_worldspace, position_worldspace));
    lightColor += lighting_getLightColor(surfaceColor, light_direction, view_direction, normal_worldspace, pointLight.color / light_attenuation);
  }

  for (int i = 0; i < lighting.spotLightCount; i++) {
    SpotLight spotLight = lighting_getSpotLight(i);
    vec3 light_position_worldspace = spotLight.position;
    vec3 light_direction = normalize(light_position_worldspace - position_worldspace);
    float light_attenuation = getSpotLightAttenuation(spotLight, position_worldspace);
    lightColor += lighting_getLightColor(surfaceColor, light_direction, view_direction, normal_worldspace, spotLight.color / light_attenuation);
  }

  for (int i = 0; i < lighting.directionalLightCount; i++) {
    DirectionalLight directionalLight = lighting_getDirectionalLight(i);
    lightColor += lighting_getLightColor(surfaceColor, -directionalLight.direction, view_direction, normal_worldspace, directionalLight.color);
  }
  
  return lightColor;
}
`});var Fc,Vh=_(()=>{Fc=`struct phongMaterialUniforms {
  unlit: u32,
  ambient: f32,
  diffuse: f32,
  shininess: f32,
  specularColor: vec3<f32>,
};

@group(3) @binding(auto) var<uniform> phongMaterial : phongMaterialUniforms;

fn lighting_getLightColor(surfaceColor: vec3<f32>, light_direction: vec3<f32>, view_direction: vec3<f32>, normal_worldspace: vec3<f32>, color: vec3<f32>) -> vec3<f32> {
  let halfway_direction: vec3<f32> = normalize(light_direction + view_direction);
  var lambertian: f32 = dot(light_direction, normal_worldspace);
  var specular: f32 = 0.0;
  if (lambertian > 0.0) {
    let specular_angle = max(dot(normal_worldspace, halfway_direction), 0.0);
    specular = pow(specular_angle, phongMaterial.shininess);
  }
  lambertian = max(lambertian, 0.0);
  return (
    lambertian * phongMaterial.diffuse * surfaceColor +
    specular * floatColors_normalize(phongMaterial.specularColor)
  ) * color;
}

fn lighting_getLightColor2(surfaceColor: vec3<f32>, cameraPosition: vec3<f32>, position_worldspace: vec3<f32>, normal_worldspace: vec3<f32>) -> vec3<f32> {
  var lightColor: vec3<f32> = surfaceColor;

  if (phongMaterial.unlit != 0u) {
    return surfaceColor;
  }

  if (lighting.enabled == 0) {
    return lightColor;
  }

  let view_direction: vec3<f32> = normalize(cameraPosition - position_worldspace);
  lightColor = phongMaterial.ambient * surfaceColor * lighting.ambientColor;

  for (var i: i32 = 0; i < lighting.pointLightCount; i++) {
    let pointLight: PointLight = lighting_getPointLight(i);
    let light_position_worldspace: vec3<f32> = pointLight.position;
    let light_direction: vec3<f32> = normalize(light_position_worldspace - position_worldspace);
    let light_attenuation = getPointLightAttenuation(
      pointLight,
      distance(light_position_worldspace, position_worldspace)
    );
    lightColor += lighting_getLightColor(
      surfaceColor,
      light_direction,
      view_direction,
      normal_worldspace,
      pointLight.color / light_attenuation
    );
  }

  for (var i: i32 = 0; i < lighting.spotLightCount; i++) {
    let spotLight: SpotLight = lighting_getSpotLight(i);
    let light_position_worldspace: vec3<f32> = spotLight.position;
    let light_direction: vec3<f32> = normalize(light_position_worldspace - position_worldspace);
    let light_attenuation = getSpotLightAttenuation(spotLight, position_worldspace);
    lightColor += lighting_getLightColor(
      surfaceColor,
      light_direction,
      view_direction,
      normal_worldspace,
      spotLight.color / light_attenuation
    );
  }

  for (var i: i32 = 0; i < lighting.directionalLightCount; i++) {
    let directionalLight: DirectionalLight = lighting_getDirectionalLight(i);
    lightColor += lighting_getLightColor(surfaceColor, -directionalLight.direction, view_direction, normal_worldspace, directionalLight.color);
  }  
  
  return lightColor;
}

fn lighting_getSpecularLightColor(cameraPosition: vec3<f32>, position_worldspace: vec3<f32>, normal_worldspace: vec3<f32>) -> vec3<f32>{
  var lightColor = vec3<f32>(0, 0, 0);
  let surfaceColor = vec3<f32>(0, 0, 0);

  if (lighting.enabled != 0) {
    let view_direction = normalize(cameraPosition - position_worldspace);

    for (var i: i32 = 0; i < lighting.pointLightCount; i++) {
      let pointLight: PointLight = lighting_getPointLight(i);
      let light_position_worldspace: vec3<f32> = pointLight.position;
      let light_direction: vec3<f32> = normalize(light_position_worldspace - position_worldspace);
      let light_attenuation = getPointLightAttenuation(
        pointLight,
        distance(light_position_worldspace, position_worldspace)
      );
      lightColor += lighting_getLightColor(
        surfaceColor,
        light_direction,
        view_direction,
        normal_worldspace,
        pointLight.color / light_attenuation
      );
    }

    for (var i: i32 = 0; i < lighting.spotLightCount; i++) {
      let spotLight: SpotLight = lighting_getSpotLight(i);
      let light_position_worldspace: vec3<f32> = spotLight.position;
      let light_direction: vec3<f32> = normalize(light_position_worldspace - position_worldspace);
      let light_attenuation = getSpotLightAttenuation(spotLight, position_worldspace);
      lightColor += lighting_getLightColor(
        surfaceColor,
        light_direction,
        view_direction,
        normal_worldspace,
        spotLight.color / light_attenuation
      );
    }

    for (var i: i32 = 0; i < lighting.directionalLightCount; i++) {
        let directionalLight: DirectionalLight = lighting_getDirectionalLight(i);
        lightColor += lighting_getLightColor(surfaceColor, -directionalLight.direction, view_direction, normal_worldspace, directionalLight.color);
    }
  }
  return lightColor;
}
`});var kM,ei,c0=_(()=>{Uh();zh();$h();Vh();kM=[38.25,38.25,38.25],ei={props:{},name:"gouraudMaterial",bindingLayout:[{name:"gouraudMaterial",group:3}],vs:Nc.replace("phongMaterial","gouraudMaterial"),fs:kc.replace("phongMaterial","gouraudMaterial"),source:Fc.replaceAll("phongMaterial","gouraudMaterial"),defines:{LIGHTING_VERTEX:!0},dependencies:[Dc,Ic],uniformTypes:{unlit:"i32",ambient:"f32",diffuse:"f32",shininess:"f32",specularColor:"vec3<f32>"},defaultUniforms:{unlit:!1,ambient:.35,diffuse:.6,shininess:32,specularColor:kM},getUniforms(r){return{...ei.defaultUniforms,...r}}}});var NM,ti,l0=_(()=>{Uh();zh();Vh();$h();NM=[38.25,38.25,38.25],ti={name:"phongMaterial",firstBindingSlot:0,bindingLayout:[{name:"phongMaterial",group:3}],dependencies:[Dc,Ic],source:Fc,vs:kc,fs:Nc,defines:{LIGHTING_FRAGMENT:!0},uniformTypes:{unlit:"i32",ambient:"f32",diffuse:"f32",shininess:"f32",specularColor:"vec3<f32>"},defaultUniforms:{unlit:!1,ambient:.35,diffuse:.6,shininess:32,specularColor:NM},getUniforms(r){return{...ti.defaultUniforms,...r}}}});var Me=_(()=>{qf();Qy();Od();Ib();Bb();Yx();Jx();n0();c0();l0()});function Lt(r="id"){fp[r]=fp[r]||1;let e=fp[r]++;return`${r}-${e}`}var fp,gi=_(()=>{fp={}});function pn(r){switch(r){case"POSITION":return"positions";case"NORMAL":return"normals";case"TEXCOORD_0":return"texCoords";case"TEXCOORD_1":return"texCoords1";case"COLOR_0":return"colors";default:return r}}function II(r){let e=[];for(let[t,n]of Object.entries(r)){if(!n)continue;let{value:i,size:o,normalized:s}=n;if(o===void 0)throw new Error(`Attribute ${t} is missing a size`);e.push({name:pn(t),format:Z.getVertexFormatFromAttribute(i,o,s)})}return e}var Oe,sl=_(()=>{I();gi();Oe=class{id;topology;vertexCount;indices;attributes;bufferLayout;userData={};constructor(e){let{attributes:t={},indices:n=null,vertexCount:i=null}=e;this.id=e.id||Lt("geometry"),this.topology=e.topology,n&&(this.indices=ArrayBuffer.isView(n)?{value:n,size:1}:n),this.attributes={};for(let[o,s]of Object.entries(t)){let a=ArrayBuffer.isView(s)?{value:s}:s;if(!ArrayBuffer.isView(a.value))throw new Error(`${this._print(o)}: must be typed array or object with value as typed array`);if((o==="POSITION"||o==="positions")&&!a.size&&(a.size=3),o==="indices"){if(this.indices)throw new Error("Multiple indices detected");this.indices=a}else{let c=pn(o),l=Object.keys(this.attributes).find(u=>pn(u)===c);l&&delete this.attributes[l],this.attributes[o]=a}}this.indices&&this.indices.isIndexed!==void 0&&(this.indices=Object.assign({},this.indices),delete this.indices.isIndexed),this.vertexCount=i||this._calculateVertexCount(this.attributes,this.indices),this.bufferLayout=e.bufferLayout||II(this.attributes)}getVertexCount(){return this.vertexCount}getAttributes(){return this.indices?{indices:this.indices,...this.attributes}:this.attributes}_print(e){return`Geometry ${this.id} attribute ${e}`}_setAttributes(e,t){return this}_calculateVertexCount(e,t){if(t)return t.value.length;let n=1/0;for(let i of Object.values(e)){if(!i)continue;let{value:o,size:s,constant:a}=i;!a&&o&&s!==void 0&&s>=1&&(n=Math.min(n,o.length/s))}return n}}});function mn(r,e={}){let t=e.bufferName||"geometry";if(OI(r,t))return r;let n=e.minAttributeAlignment||4,i=BI(r,e.attributes),o=[],s=0,a=1/0;for(let[u,f]of i){if(!f)continue;if(f.constant)throw new Error(`Attribute ${u} is constant`);let{value:d,size:h,normalized:p}=f;if(!ArrayBuffer.isView(d))throw new Error(`Attribute ${u} is missing typed array data`);if(h===void 0)throw new Error(`Attribute ${u} is missing a size`);let m=Z.getVertexFormatFromAttribute(d,h,p),g=Z.getVertexFormatInfo(m);s=nv(s,n),o.push({sourceName:u,attributeName:pn(u),value:d,size:h,format:m,byteOffset:s,byteLength:g.byteLength}),s+=g.byteLength;let b=d.length/h;if(!Number.isInteger(b))throw new Error(`Attribute ${u} length is not divisible by size`);a=Math.min(a,b)}if(o.length===0||!Number.isFinite(a))throw new Error(`Geometry ${r.id} has no interleavable attributes`);let c=nv(s,n),l=new ArrayBuffer(a*c);for(let u of o)DI(l,a,c,u);return new Oe({id:r.id,topology:r.topology||"triangle-list",vertexCount:r.vertexCount,indices:r.indices,attributes:{[t]:{value:new Uint8Array(l),size:c,byteStride:c}},bufferLayout:[{name:t,stepMode:"vertex",byteStride:c,attributes:o.map(u=>({attribute:u.attributeName,format:u.format,byteOffset:u.byteOffset}))}]})}function OI(r,e){if(r.bufferLayout.length!==1)return!1;let t=r.bufferLayout[0];return t.name===e&&!!t.attributes?.length&&!!r.attributes[e]}function BI(r,e){return e?e.map(t=>[t,r.attributes[t]]):Object.entries(r.attributes)}function DI(r,e,t,n){let i=n.value.constructor,o=i.BYTES_PER_ELEMENT;if(n.byteOffset%o!==0||t%o!==0)throw new Error(`Attribute ${n.sourceName} is not aligned to its component type`);let s=new i(r),a=n.value,c=n.byteOffset/o,l=t/o;for(let u=0;u<e;u++){let f=u*n.size,d=u*l+c;for(let h=0;h<n.size;h++)s[d+h]=a[f+h]}}function nv(r,e){return Math.ceil(r/e)*e}var dp=_(()=>{I();sl()});var kI,NI,gn,iv=_(()=>{kI=1,NI=1,gn=class{time=0;channels=new Map;animations=new Map;playing=!1;lastEngineTime=-1;constructor(){}addChannel(e){let{delay:t=0,duration:n=Number.POSITIVE_INFINITY,rate:i=1,repeat:o=1}=e,s=kI++,a={time:0,delay:t,duration:n,rate:i,repeat:o};return this._setChannelTime(a,this.time),this.channels.set(s,a),s}removeChannel(e){this.channels.delete(e);for(let[t,n]of this.animations)n.channel===e&&this.detachAnimation(t)}isFinished(e){let t=this.channels.get(e);return t===void 0?!1:this.time>=t.delay+t.duration*t.repeat}getTime(e){if(e===void 0)return this.time;let t=this.channels.get(e);return t===void 0?-1:t.time}setTime(e){this.time=Math.max(0,e);let t=this.channels.values();for(let i of t)this._setChannelTime(i,this.time);let n=this.animations.values();for(let i of n){let{animation:o,channel:s}=i;o.setTime(this.getTime(s))}}play(){this.playing=!0}pause(){this.playing=!1,this.lastEngineTime=-1}reset(){this.setTime(0)}attachAnimation(e,t){let n=NI++;return this.animations.set(n,{animation:e,channel:t}),e.setTime(this.getTime(t)),n}detachAnimation(e){this.animations.delete(e)}update(e){this.playing&&(this.lastEngineTime===-1&&(this.lastEngineTime=e),this.setTime(this.time+(e-this.lastEngineTime)),this.lastEngineTime=e)}_setChannelTime(e,t){let n=t-e.delay,i=e.duration*e.repeat;n>=i?e.time=e.duration*e.rate:(e.time=Math.max(0,n)%e.duration,e.time*=e.rate)}}});function ov(r){let e=typeof window<"u"?window.requestAnimationFrame||window.webkitRequestAnimationFrame||window.mozRequestAnimationFrame:null;return e?e.call(window,r):setTimeout(()=>r(typeof performance<"u"?performance.now():Date.now()),1e3/60)}function sv(r){let e=typeof window<"u"?window.cancelAnimationFrame||window.webkitCancelAnimationFrame||window.mozCancelAnimationFrame:null;if(e){e.call(window,r);return}clearTimeout(r)}var av=_(()=>{});var FI,UI,cv,as,lv=_(()=>{I();av();eo();FI=0,UI="Animation Loop",cv={requestAnimationFrame:r=>ov(r),cancelAnimationFrame:r=>sv(r)},as=class r{static defaultAnimationLoopProps={device:null,onAddHTML:()=>"",onInitialize:async()=>null,onRender:()=>{},onFinalize:()=>{},onError:e=>{console.error(e)},stats:void 0,autoResizeViewport:!1,animationFrameProvider:cv};device=null;canvas=null;props;animationProps=null;timeline=null;stats;sharedStats;cpuTime;gpuTime;frameRate;display;_needsRedraw="initialized";_initialized=!1;_running=!1;_animationFrameId=null;_nextFramePromise=null;_resolveNextFrame=null;_cpuStartTime=0;_error=null;_lastFrameTime=0;constructor(e){if(this.props={...r.defaultAnimationLoopProps,...e},e=this.props,!e.device)throw new Error("No device provided");this.stats=e.stats||new Ye({id:`animation-loop-${FI++}`}),this.sharedStats=$n.stats.get(UI),this.frameRate=this.stats.get("Frame Rate"),this.frameRate.setSampleSize(1),this.cpuTime=this.stats.get("CPU Time"),this.gpuTime=this.stats.get("GPU Time"),this.setProps({autoResizeViewport:e.autoResizeViewport,animationFrameProvider:e.animationFrameProvider}),this.start=this.start.bind(this),this.stop=this.stop.bind(this),this._onMousemove=this._onMousemove.bind(this),this._onMouseleave=this._onMouseleave.bind(this)}destroy(){this.stop(),this._setDisplay(null),this.device?._disableDebugGPUTime()}delete(){this.destroy()}reportError(e){this.props.onError(e),this._error=e}setNeedsRedraw(e){return this._needsRedraw=this._needsRedraw||e,this}needsRedraw(){let e=this._needsRedraw;return this._needsRedraw=!1,e}setProps(e){if("autoResizeViewport"in e&&(this.props.autoResizeViewport=e.autoResizeViewport||!1),"animationFrameProvider"in e){let t=e.animationFrameProvider||cv;if(t!==this.props.animationFrameProvider){let n=this._animationFrameId!==null;n&&this._cancelAnimationFrame(),this.props.animationFrameProvider=t,n&&this._requestAnimationFrame()}}return this}async start(){if(this._running)return this;this._running=!0;try{let e;if(!this._initialized){if(this._initialized=!0,await this._initDevice(),this._initialize(),!this._running)return null;await this.props.onInitialize(this._getAnimationProps())}return this._running?(e!==!1&&(this._cancelAnimationFrame(),this._requestAnimationFrame()),this):null}catch(e){let t=e instanceof Error?e:new Error("Unknown error");throw this.props.onError(t),t}}stop(){return this._running&&(this.animationProps&&!this._error&&this.props.onFinalize(this.animationProps),this._cancelAnimationFrame(),this._nextFramePromise=null,this._resolveNextFrame=null,this._running=!1,this._lastFrameTime=0),this}redraw(e,t=null){return this.device?.isLost||this._error?this:(this._beginFrameTimers(e),this._setupFrame(),this.animationProps&&(this.animationProps.animationFrame=t),this._updateAnimationProps(),this._renderFrame(this._getAnimationProps()),this._clearNeedsRedraw(),this._resolveNextFrame&&(this._resolveNextFrame(this),this._nextFramePromise=null,this._resolveNextFrame=null),this._endFrameTimers(),this)}attachTimeline(e){return this.timeline=e,this.timeline}detachTimeline(){this.timeline=null}waitForRender(){return this.setNeedsRedraw("waitForRender"),this._nextFramePromise||(this._nextFramePromise=new Promise(e=>{this._resolveNextFrame=e})),this._nextFramePromise}async toDataURL(){if(this.setNeedsRedraw("toDataURL"),await this.waitForRender(),this.canvas instanceof HTMLCanvasElement)return this.canvas.toDataURL();throw new Error("OffscreenCanvas")}_initialize(){this._startEventHandling(),this._initializeAnimationProps(),this._updateAnimationProps(),this._resizeViewport(),this.device?._enableDebugGPUTime()}_setDisplay(e){this.display&&(this.display.destroy(),this.display.animationLoop=null),e&&(e.animationLoop=this),this.display=e}_requestAnimationFrame(){this._running&&(this._animationFrameId=this.props.animationFrameProvider.requestAnimationFrame(this._animationFrame.bind(this)))}_cancelAnimationFrame(){this._animationFrameId!==null&&(this.props.animationFrameProvider.cancelAnimationFrame(this._animationFrameId),this._animationFrameId=null)}_animationFrame(e,t){this._running&&(this.redraw(e,t??null),this._requestAnimationFrame())}_renderFrame(e){if(this.display){this.display._renderFrame(e);return}let t=this.props.onRender(this._getAnimationProps());this.device&&t!==!1&&this.device.submit()}_clearNeedsRedraw(){this._needsRedraw=!1}_setupFrame(){this._resizeViewport()}_initializeAnimationProps(){let e=this.device?.getDefaultCanvasContext();if(!this.device||!e)throw new Error("loop");let t=e?.canvas,n=e.props.useDevicePixels;this.animationProps={animationLoop:this,device:this.device,canvasContext:e,canvas:t,useDevicePixels:n,timeline:this.timeline,needsRedraw:!1,width:1,height:1,aspect:1,time:0,startTime:Date.now(),engineTime:0,tick:0,tock:0,animationFrame:null,_mousePosition:null}}_getAnimationProps(){if(!this.animationProps)throw new Error("animationProps");return this.animationProps}_updateAnimationProps(){if(!this.animationProps)return;let{width:e,height:t,aspect:n}=this._getSizeAndAspect();(e!==this.animationProps.width||t!==this.animationProps.height)&&this.setNeedsRedraw("drawing buffer resized"),n!==this.animationProps.aspect&&this.setNeedsRedraw("drawing buffer aspect changed"),this.animationProps.width=e,this.animationProps.height=t,this.animationProps.aspect=n,this.animationProps.needsRedraw=this._needsRedraw,this.animationProps.engineTime=Date.now()-this.animationProps.startTime,this.timeline&&this.timeline.update(this.animationProps.engineTime),this.animationProps.tick=Math.floor(this.animationProps.time/1e3*60),this.animationProps.tock++,this.animationProps.time=this.timeline?this.timeline.getTime():this.animationProps.engineTime}async _initDevice(){if(this.device=await this.props.device,!this.device)throw new Error("No device provided");this.canvas=this.device.getDefaultCanvasContext().canvas||null}_createInfoDiv(){if(this.canvas&&this.props.onAddHTML){let e=document.createElement("div");document.body.appendChild(e),e.style.position="relative";let t=document.createElement("div");t.style.position="absolute",t.style.left="10px",t.style.bottom="10px",t.style.width="300px",t.style.background="white",this.canvas instanceof HTMLCanvasElement&&e.appendChild(this.canvas),e.appendChild(t);let n=this.props.onAddHTML(t);n&&(t.innerHTML=n)}}_getSizeAndAspect(){if(!this.device)return{width:1,height:1,aspect:1};let[e,t]=this.device.getDefaultCanvasContext().getDrawingBufferSize(),n=e>0&&t>0?e/t:1;return{width:e,height:t,aspect:n}}_resizeViewport(){this.props.autoResizeViewport&&this.device.gl&&this.device.gl.viewport(0,0,this.device.gl.drawingBufferWidth,this.device.gl.drawingBufferHeight)}_beginFrameTimers(e){let t=e??(typeof performance<"u"?performance.now():Date.now());if(this._lastFrameTime){let n=t-this._lastFrameTime;n>0&&this.frameRate.addTime(n)}this._lastFrameTime=t,this.device?._isDebugGPUTimeEnabled()&&this._consumeEncodedGpuTime(),this.cpuTime.timeStart()}_endFrameTimers(){this.device?._isDebugGPUTimeEnabled()&&this._consumeEncodedGpuTime(),this.cpuTime.timeEnd(),this._updateSharedStats()}_consumeEncodedGpuTime(){if(!this.device)return;let e=this.device.commandEncoder._gpuTimeMs;e!==void 0&&(this.gpuTime.addTime(e),this.device.commandEncoder._gpuTimeMs=void 0)}_updateSharedStats(){if(this.stats!==this.sharedStats){for(let e of Object.keys(this.sharedStats.stats))this.stats.stats[e]||delete this.sharedStats.stats[e];this.stats.forEach(e=>{let t=this.sharedStats.get(e.name,e.type);t.sampleSize=e.sampleSize,t.time=e.time,t.count=e.count,t.samples=e.samples,t.lastTiming=e.lastTiming,t.lastSampleTime=e.lastSampleTime,t.lastSampleCount=e.lastSampleCount,t._count=e._count,t._time=e._time,t._samples=e._samples,t._startTime=e._startTime,t._timerPending=e._timerPending})}}_startEventHandling(){this.canvas&&(this.canvas.addEventListener("mousemove",this._onMousemove.bind(this)),this.canvas.addEventListener("mouseleave",this._onMouseleave.bind(this)))}_onMousemove(e){e instanceof MouseEvent&&(this._getAnimationProps()._mousePosition=[e.offsetX,e.offsetY])}_onMouseleave(e){this._getAnimationProps()._mousePosition=null}}});function uv(r,e){if(e instanceof al)return e;let t=mn(e),n=GI(r,t),{attributes:i,bufferLayout:o}=zI(r,t);return new al({topology:t.topology||"triangle-list",bufferLayout:o,vertexCount:t.vertexCount,indices:n,attributes:i})}function GI(r,e){if(!e.indices)return;let t=e.indices.value;return r.createBuffer({usage:D.INDEX,data:t})}function zI(r,e){let t={};for(let[n,i]of Object.entries(e.attributes)){let o=e.bufferLayout.find(s=>s.name===n)?.name||pn(n);i&&(t[o]=r.createBuffer({data:i.value,id:`${n}-buffer`}))}return{attributes:t,bufferLayout:e.bufferLayout,vertexCount:e.vertexCount}}var al,fv=_(()=>{I();sl();dp();gi();al=class{id;userData={};topology;bufferLayout=[];vertexCount;indices;attributes;constructor(e){if(this.id=e.id||Lt("geometry"),this.topology=e.topology,this.indices=e.indices||null,this.attributes=e.attributes,this.vertexCount=e.vertexCount,this.bufferLayout=e.bufferLayout||[],this.indices&&!(this.indices.usage&D.INDEX))throw new Error("Index buffer must have INDEX usage")}destroy(){this.indices?.destroy();for(let e of Object.values(this.attributes))e.destroy()}getVertexCount(){return this.vertexCount}getAttributes(){return this.attributes}getIndexes(){return this.indices||null}_calculateVertexCount(e){return e.byteLength/12}}});function dv(r,e){let t={},n="Values";if(r.attributes.length===0&&!r.varyings?.length)return{"No attributes or varyings":{[n]:"N/A"}};for(let i of r.attributes)if(i){let o=`${i.location} ${i.name}: ${i.type}`;t[`in ${o}`]={[n]:i.stepMode||"vertex"}}for(let i of r.varyings||[]){let o=`${i.location} ${i.name}`;t[`out ${o}`]={[n]:JSON.stringify(i)}}return t}var hv=_(()=>{});function gv(r,e,t){if(r.device.type!=="webgl")return;let n=WI(r.device);if(!n.flushing){if(HI(r)){$I(r,t,n);return}e&&jI(e)&&e.handle!==null&&(n.queuedFramebuffers.includes(e)||n.queuedFramebuffers.push(e))}}function $I(r,e,t){if(t.queuedFramebuffers.length===0)return;let n=r.device,{gl:i}=n,o=i.getParameter(36010),s=i.getParameter(36006),[a,c]=r.device.getDefaultCanvasContext().getDrawingBufferSize(),l=mv(e.top,8),u=mv(e.left,8);t.flushing=!0;try{for(let f of t.queuedFramebuffers){let[d,h,p,m,g]=VI({framebuffer:f,targetWidth:a,targetHeight:c,topPx:l,leftPx:u,minimap:e.minimap});i.bindFramebuffer(36008,f.handle),i.bindFramebuffer(36009,null),i.blitFramebuffer(0,0,f.width,f.height,d,h,p,m,16384,9728),l+=g+8}}finally{i.bindFramebuffer(36008,o),i.bindFramebuffer(36009,s),t.flushing=!1}}function VI(r){let{framebuffer:e,targetWidth:t,targetHeight:n,topPx:i,leftPx:o,minimap:s}=r,a=s?Math.max(Math.floor(t/4),1):t,c=s?Math.max(Math.floor(n/4),1):n,l=Math.min(a/e.width,c/e.height),u=Math.max(Math.floor(e.width*l),1),f=Math.max(Math.floor(e.height*l),1),d=o,h=Math.max(n-i-f,0),p=d+u,m=h+f;return[d,h,p,m,f]}function WI(r){return r.userData[pv]||={flushing:!1,queuedFramebuffers:[]},r.userData[pv]}function jI(r){return"colorAttachments"in r}function HI(r){let e=r.props.framebuffer;return!e||e.handle===null}function mv(r,e){if(!r)return e;let t=Number.parseInt(r,10);return Number.isFinite(t)?t:e}var pv,_v=_(()=>{pv="__debugFramebufferState"});function _i(r,e,t){if(r===e)return!0;if(!t||!r||!e)return!1;if(Array.isArray(r)){if(!Array.isArray(e)||r.length!==e.length)return!1;for(let n=0;n<r.length;n++)if(!_i(r[n],e[n],t-1))return!1;return!0}if(Array.isArray(e))return!1;if(typeof r=="object"&&typeof e=="object"){let n=Object.keys(r),i=Object.keys(e);if(n.length!==i.length)return!1;for(let o of n)if(!e.hasOwnProperty(o)||!_i(r[o],e[o],t-1))return!1;return!0}return!1}var yv=_(()=>{});var yi,bv=_(()=>{I();yi=class{bufferLayouts;constructor(e){this.bufferLayouts=e}getBufferLayout(e){return this.bufferLayouts.find(t=>t.name===e)||null}getAttributeNamesForBuffer(e){return Yn(e)}mergeBufferLayouts(e,t){let n=[...e];for(let i of t){let o=n.findIndex(s=>s.name===i.name);o<0?n.push(i):n[o]=i}return n}}});function xv(r,e){let t=Ad(r),n=e.slice();return n.sort((i,o)=>{let s=uc(Yn(i).map(c=>t[c])),a=uc(Yn(o).map(c=>t[c]));return s-a}),n}var vv=_(()=>{I()});function bi(r,e){if(!r||!e.some(n=>n.bindingLayout?.length))return r;let t={...r,bindings:r.bindings.map(n=>({...n}))};"attributes"in(r||{})&&(t.attributes=r?.attributes||[]);for(let n of e)for(let i of n.bindingLayout||[])for(let o of YI(i.name)){let s=t.bindings.find(a=>a.name===o);s?.group===0&&(s.group=i.group),s&&i.visibility!==void 0&&(s.visibility=i.visibility)}return t}function wv(r,e,t=[]){return r?e?{...r,attributes:r.attributes.length?XI(r.attributes,e.attributes.filter(n=>t.includes(n.name))):e.attributes,bindings:ZI(r.bindings,e.bindings)}:r:e}function cs(r){return!!(r.uniformTypes&&!qI(r.uniformTypes))}function Ev(r){let e=[];for(let t of r){let n=ko(t),i=new Set([t.vs,t.fs].flatMap(s=>s?No(s).filter(a=>a.isStd140).map(a=>a.blockName):[])),o=i.has(n)?n:i.size===1?i.values().next().value:void 0;cs(t)&&o&&e.push({name:o,uniformTypes:t.uniformTypes})}return e}function cl(r,e){let t=[],n=new Set;for(let i of[...r||[],...e||[]])n.has(i.name)||(n.add(i.name),t.push(i));return t}function YI(r){let e=new Set([r,`${r}Uniforms`]);return r.endsWith("Uniforms")||e.add(`${r}Sampler`),[...e]}function qI(r){for(let e in r)return!1;return!0}function ZI(r,e){let t=r.map(o=>({...o})),n=new Set(r.map(o=>o.name)),i=new Set(r.map(o=>`${o.group}:${o.location}`));for(let o of e){let s=`${o.group}:${o.location}`;!n.has(o.name)&&!i.has(s)&&t.push({...o})}return t}function XI(r,e){let t=r.map(o=>({...o})),n=new Map(r.map(o=>[o.name,o])),i=new Map(r.map(o=>[o.location,o]));for(let o of e){let s=n.get(o.name);if(s){if(s.type!==o.type||s.location!==o.location)throw new Error(`Shader attribute "${o.name}" conflicts with its inferred type or location`);continue}let a=i.get(o.location);if(a)throw new Error(`Shader attributes "${a.name}" and "${o.name}" both use location ${o.location}`);t.push({...o})}return t}var hp=_(()=>{Me()});function KI(r){return ao(r)||typeof r=="number"||typeof r=="boolean"}function Pv(r,e={}){let t={bindings:{},uniforms:{}};return Object.keys(r).forEach(n=>{let i=r[n];Object.prototype.hasOwnProperty.call(e,n)||KI(i)?t.uniforms[n]=i:t.bindings[n]=i}),t}var Sv=_(()=>{Cf()});function Tv(r={},e={},t={}){let n={...r};for(let[i,o]of Object.entries(e))o!==void 0&&(n[i]=pp(r[i],o,t[i]));return n}function pp(r,e,t){if(!t||typeof t=="string")return ls(e);if(Array.isArray(t)){if(mp(e)||!Array.isArray(e))return ls(e);let s=Array.isArray(r)&&!mp(r)?[...r]:[],a=s.slice();for(let c=0;c<e.length;c++){let l=e[c];l!==void 0&&(a[c]=pp(s[c],l,t[0]))}return a}if(!gp(e))return ls(e);let n=t,i=gp(r)?r:{},o={...i};for(let[s,a]of Object.entries(e))a!==void 0&&(o[s]=pp(i[s],a,n[s]));return o}function ls(r){return ArrayBuffer.isView(r)?Array.prototype.slice.call(r):Array.isArray(r)?mp(r)?r.slice():r.map(t=>t===void 0?void 0:ls(t)):gp(r)?Object.fromEntries(Object.entries(r).map(([e,t])=>[e,t===void 0?void 0:ls(t)])):r}function mp(r){return ArrayBuffer.isView(r)||Array.isArray(r)&&(r.length===0||typeof r[0]=="number")}function gp(r){return!!r&&typeof r=="object"&&!Array.isArray(r)&&!ArrayBuffer.isView(r)}function QI(r){return!!r?.dependencies}var xi,_p=_(()=>{I();Me();Sv();xi=class{options={disableWarnings:!1};modules;moduleUniforms;moduleBindings;directBindings={};constructor(e,t){Object.assign(this.options,t);let n=Nr(Object.values(e).filter(QI));for(let i of n)e[i.name]=i;P.log(1,"Creating ShaderInputs with modules",Object.keys(e))(),this.modules=e,this.moduleUniforms={},this.moduleBindings={};for(let[i,o]of Object.entries(e))o&&(this._addModule(o),o.name&&i!==o.name&&!this.options.disableWarnings&&P.warn(`Module name: ${i} vs ${o.name}`)())}destroy(){}setProps(e){e.bindings&&Object.assign(this.directBindings,e.bindings);for(let t of Object.keys(e)){if(t==="bindings")continue;let n=t,i=e[n]||{},o=this.modules[n];if(!o)this.options.disableWarnings||P.warn(`Module ${t} not found`)();else{let s=this.moduleUniforms[n],a=this.moduleBindings[n],c=o.getUniforms?.(i,s)||i,{uniforms:l,bindings:u}=Pv(c,o.uniformTypes);this.moduleUniforms[n]=Tv(s,l,o.uniformTypes),this.moduleBindings[n]={...a,...u}}}}getModules(){return Object.values(this.modules)}addModules(e){let t=Nr(e);for(let n of t){let i=n.name;this.modules[i]||(this.modules[i]=n,this._addModule(n))}}getUniformValues(){return this.moduleUniforms}getBindingValues(){let e={};for(let t of Object.values(this.moduleBindings))Object.assign(e,t);return Object.assign(e,this.directBindings),e}getModuleBindingValues(e){let t=this.moduleBindings[e];return t?{...t}:{}}getDebugTable(){let e={};for(let[t,n]of Object.entries(this.moduleUniforms))for(let[i,o]of Object.entries(n))e[`${t}.${i}`]={type:this.modules[t].uniformTypes?.[i],value:String(o)};return e}_addModule(e){let t=e.name;this.moduleUniforms[t]=Tv({},e.defaultUniforms||{},e.uniformTypes),this.moduleBindings[t]={}}}});function yp(r){return r!==null&&typeof r=="object"&&"buffer"in r}function eO(r){return r instanceof me?r.buffer:r}function Lv(r){return{buffer:eO(r.buffer),offset:r.offset,size:r.size}}var JI,me,bp=_(()=>{I();gi();JI=D.DEBUG_DATA_MAX_LENGTH,me=class{device;id;ready;usage;props;isReady=!0;destroyed=!1;generation=0;updateTimestamp;debugData=new ArrayBuffer(0);_debugDataEnabled;_maxDebugDataByteLength;_ownsBuffer;_buffer;get buffer(){return this._buffer}get byteLength(){return this._buffer.byteLength}get[Symbol.toStringTag](){return"DynamicBuffer"}toString(){return`DynamicBuffer:"${this.id}":${this.byteLength}B`}toJSON(){return this.toString()}constructor(e,t){let{debugData:n=!1,buffer:i,ownsBuffer:o=!0,...s}=t;if(i&&i.device!==e)throw new Error("DynamicBuffer adopted buffers must belong to the supplied device");if(i&&(s.byteLength!==void 0||s.data!==void 0))throw new Error("DynamicBuffer cannot combine an adopted buffer with byteLength or data");let a=t.id||i?.id||Lt("dynamic-buffer"),c={...s,id:a,usage:s.usage??i?.usage,indexType:s.indexType??i?.indexType};(c.usage||0)&D.INDEX&&!c.indexType&&(s.data instanceof Uint32Array?c.indexType="uint32":s.data instanceof Uint16Array?c.indexType="uint16":s.data instanceof Uint8Array&&(c.indexType="uint8")),delete c.data,delete c.byteOffset,this.device=e,this.id=a,this.props=c,this.usage=c.usage||0,this._debugDataEnabled=!!n,this._maxDebugDataByteLength=typeof n=="object"&&n.maxByteLength!==void 0?n.maxByteLength:JI,this._ownsBuffer=o,this._buffer=i??this.device.createBuffer({...s,id:a}),this.ready=Promise.resolve(this._buffer),this.updateTimestamp=this._buffer.updateTimestamp,this._resetDebugData(this._buffer.byteLength),s.data&&this._writeDebugData(s.data,s.byteOffset||0)}write(e,t=0){this._buffer.write(e,t),this._touch(),this._writeDebugData(e,t)}async mapAndWriteAsync(e,t=0,n=this.byteLength-t){let i=null;await this._buffer.mapAndWriteAsync(async(o,s)=>{await e(o,s),i=new Uint8Array(o.slice(0,n))},t,n),this._touch(),i&&this._writeDebugData(i,t)}async readAsync(e=0,t=this.byteLength-e){let n=await this._buffer.readAsync(e,t);return this._writeDebugData(n,e)&&this._touch(),n}async mapAndReadAsync(e,t=0,n=this.byteLength-t){let i=null,o=await this._buffer.mapAndReadAsync(async(s,a)=>(i=new Uint8Array(s.slice(0)),await e(s,a)),t,n);return i&&this._writeDebugData(i,t)&&this._touch(),o}resize(e){let{byteLength:t,preserveData:n=!1}=e;if(t===this.byteLength)return!1;let i=Math.min(e.copyByteLength??Math.min(this.byteLength,t),this.byteLength,t),o=this._buffer,s=this.debugData.slice(0),{data:a,byteOffset:c,...l}=this.props,u=this.device.createBuffer({...l,byteLength:t});return n&&i>0&&this._copyBufferContents(o,u,i),this._buffer=u,this._resetDebugData(t),n&&s.byteLength>0&&this._writeDebugData(s,0),this._ownsBuffer&&o.destroy(),this._ownsBuffer=!0,this.generation++,this._touch(),!0}ensureSize(e,t){return e<=this.byteLength?!1:this.resize({byteLength:e,preserveData:t?.preserveData})}getBinding(e){return e?.offset===void 0&&e?.size===void 0?this._buffer:{buffer:this._buffer,offset:e?.offset,size:e?.size}}destroy(){this.destroyed||(this._ownsBuffer&&this._buffer.destroy(),this.destroyed=!0,this.debugData=new ArrayBuffer(0))}_copyBufferContents(e,t,n){let i=this.device.type==="webgpu"?Math.ceil(n/4)*4:n,o=this.device.createCommandEncoder();o.copyBufferToBuffer({sourceBuffer:e,destinationBuffer:t,size:i}),this.device.submit(o.finish())}_touch(){this.updateTimestamp=this.device.incrementTimestamp()}_resetDebugData(e){if(!this._debugDataEnabled){this.debugData=new ArrayBuffer(0);return}this.debugData=new ArrayBuffer(Math.min(e,this._maxDebugDataByteLength))}_writeDebugData(e,t){if(!this._debugDataEnabled||this.debugData.byteLength===0||t>=this.debugData.byteLength)return!1;let n=ArrayBuffer.isView(e)?new Uint8Array(e.buffer,e.byteOffset,e.byteLength):new Uint8Array(e),i=new Uint8Array(this.debugData),o=Math.min(n.byteLength,i.byteLength-t);return i.set(n.subarray(0,o),t),o>0}}});function us(r){return r!==null&&typeof r=="object"&&"resolveTextureBinding"in r&&typeof r.resolveTextureBinding=="function"}function tO(r){return r?.type==="texture"||r?.type==="external-texture"}function Av(r,e,t){let n=ic(r,e,{ignoreWarnings:!0});return tO(n)?n:r.bindings.length===0&&t?.fallbackGroup!==void 0?{type:"texture",name:e,group:t.fallbackGroup,location:0}:null}var Cv=_(()=>{I()});function vp(r,e){return r.shaderLanguage!==void 0&&r.shaderLanguage!==e?!1:e==="glsl"?"assembleGLSLShaderPair"in r&&typeof r.assembleGLSLShaderPair=="function":"assembleWGSLShader"in r&&typeof r.assembleWGSLShader=="function"}function iO(r,e){return!r||Object.keys(e).length===0?r:{...r,attributes:r.attributes.map(t=>{let n=t.name.startsWith("_luma_")?t.name.slice(6):null;return n&&e[n]?{...t,name:n}:t})}}function oO(r,e,t){if(us(e)){let n=Av(t,r,{fallbackGroup:0});return n?e.resolveTextureBinding(n):null}return e instanceof me?e.buffer:yp(e)?Lv(e):e}function sO(r){return r&&!Mv(r)?r:null}function aO(r){return r&&Mv(r)?r:void 0}function Mv(r){return nO.includes(r)}function cO(r){return{type:r.type,shaderLanguage:r.info.shadingLanguage,shaderLanguageVersion:r.info.shadingLanguageVersion,gpu:r.info.gpu,limits:r.limits,features:r.features}}var At,rO,xp,nO,ge,wp=_(()=>{I();Me();fv();hv();_v();yv();bv();vv();hp();gi();_p();bp();Cv();At=2,rO=1e4,xp="render pipeline initialization failed",nO=["stencil8","depth16unorm","depth24plus","depth24plus-stencil8","depth32float","depth32float-stencil8"],ge=class r{static defaultProps={...Ze.defaultProps,source:void 0,vs:null,fs:null,id:"unnamed",handle:void 0,userData:{},defines:{},modules:[],plugins:[],geometry:null,indexBuffer:null,indexCount:void 0,firstVertex:0,firstIndex:0,attributes:{},constantAttributes:{},bindings:{},uniforms:{},varyings:[],isInstanced:void 0,instanceCount:0,vertexCount:0,shaderInputs:void 0,material:void 0,pipelineFactory:void 0,shaderFactory:void 0,transformFeedback:void 0,shaderAssembler:Xe.getDefaultShaderAssembler("glsl"),debugShaders:void 0,disableWarnings:void 0};device;id;source;vs;fs;pipelineFactory;shaderFactory;userData={};parameters;topology;bufferLayout;isInstanced=void 0;instanceCount=0;vertexCount;indexCount;firstVertex;firstIndex;indexBuffer=null;bufferAttributes={};constantAttributes={};bindings={};vertexArray;transformFeedback=null;pipeline;shaderInputs;material=null;_uniformStore;_attributeInfos={};_gpuGeometry=null;props;_dynamicIndexBufferSource=null;_dynamicAttributeBufferSources={};_colorAttachmentFormats;_depthStencilAttachmentFormat;_pipelineNeedsUpdate="newly created";_needsRedraw="initializing";_drawBlockedReason=!1;_destroyed=!1;_lastDrawTimestamp=-1;_bindingTable=[];get[Symbol.toStringTag](){return"Model"}toString(){return`Model(${this.id})`}constructor(e,t){let n=r.defaultProps.shaderAssembler;this.props={...r.defaultProps,...t,shaderAssembler:t.shaderAssembler??(vp(n,e.info.shadingLanguage)?n:Xe.getDefaultShaderAssembler(e.info.shadingLanguage))},t=this.props,this.id=t.id||Lt("model"),this.device=e,Object.assign(this.userData,t.userData),this.material=t.material||null;let i=cO(e),o=Bo(this.props.plugins,i.shaderLanguage),s=Do(this.props.modules,o.modules),a=Object.fromEntries(s.map(d=>[d.name,d])),c=t.shaderInputs||new xi(a,{disableWarnings:this.props.disableWarnings});t.shaderInputs&&o.modules.length>0&&c.addModules(o.modules),this.setShaderInputs(c);let l=cl(this.props.modules,c.getModules()),u={...o.defines,...this.props.defines};if(this.device.type==="webgl"&&(this.props._uniformBlockLayouts=Ev(l)),this.props.shaderLayout=bi(this.props.shaderLayout,l)||null,this.device.type==="webgpu"&&this.props.source){let d=this.props.shaderAssembler;lr(vp(d,"wgsl"));let{source:h,getUniforms:p,bindingTable:m,shaderLayout:g}=d.assembleWGSLShader({platformInfo:i,...this.props,modules:l,defines:u,pluginInjections:o.injections,pluginVertexInputs:o.vertexInputs,pluginVaryings:o.varyings});this.source=h,this._getModuleUniforms=p,this._bindingTable=m;let b=g??e.getShaderLayout?.(this.source),y=iO(b,o.vertexInputs),x=wv(this.props.shaderLayout,y,Object.keys(o.vertexInputs));this.props.shaderLayout=bi(x||null,l)||null}else{let d=this.props.shaderAssembler;lr(vp(d,"glsl"));let{vs:h,fs:p,getUniforms:m}=d.assembleGLSLShaderPair({platformInfo:i,...this.props,modules:l,defines:u,pluginInjections:o.injections,pluginVertexInputs:o.vertexInputs,pluginVaryings:o.varyings});this.vs=h,this.fs=p,this._getModuleUniforms=m,this._bindingTable=[]}this.vertexCount=this.props.vertexCount,this.indexCount=this.props.indexCount,this.firstVertex=this.props.firstVertex,this.firstIndex=this.props.firstIndex,this.instanceCount=this.props.instanceCount,this.topology=this.props.topology,this.bufferLayout=this.props.bufferLayout,this.parameters=this.props.parameters,this._colorAttachmentFormats=this.props.colorAttachmentFormats,this._depthStencilAttachmentFormat=this.props.depthStencilAttachmentFormat,t.geometry&&this.setGeometry(t.geometry),this.pipelineFactory=t.pipelineFactory||Wr.getDefaultPipelineFactory(this.device),this.shaderFactory=t.shaderFactory||jr.getDefaultShaderFactory(this.device),this.pipeline=this._updatePipeline(),this.vertexArray=e.createVertexArray({shaderLayout:this.pipeline.shaderLayout,bufferLayout:this.pipeline.bufferLayout}),this._gpuGeometry&&this._setGeometryAttributes(this._gpuGeometry),"isInstanced"in t&&(this.isInstanced=t.isInstanced),t.instanceCount&&this.setInstanceCount(t.instanceCount),t.vertexCount&&this.setVertexCount(t.vertexCount),t.indexBuffer&&this.setIndexBuffer(t.indexBuffer),t.attributes&&this.setAttributes(t.attributes),t.constantAttributes&&this.setConstantAttributes(t.constantAttributes),t.bindings&&this.setBindings(t.bindings),t.transformFeedback&&(this.transformFeedback=t.transformFeedback)}destroy(){this._destroyed||(this.pipelineFactory.release(this.pipeline),this.shaderFactory.release(this.pipeline.vs),this.pipeline.fs&&this.pipeline.fs!==this.pipeline.vs&&this.shaderFactory.release(this.pipeline.fs),this._uniformStore.destroy(),this._gpuGeometry?.destroy(),this._destroyed=!0)}needsRedraw(){this._getBindingsUpdateTimestamp()>this._lastDrawTimestamp&&this.setNeedsRedraw("contents of bound textures or buffers updated");let e=this._needsRedraw;return this._needsRedraw=!1,e}setNeedsRedraw(e){this._needsRedraw||=e}getBindingDebugTable(){return this._bindingTable}predraw(e){this._syncDynamicBuffers(),this.updateShaderInputs(e),this.material?.updateShaderInputs(e),this.pipeline=this._updatePipeline()}draw(e){if(this._drawBlockedReason&&!this._pipelineNeedsUpdate)return P.info(At,`>>> DRAWING ABORTED ${this.id}: ${this._drawBlockedReason}`)(),!1;let t=this._areBindingsLoading();if(t)return P.info(At,`>>> DRAWING ABORTED ${this.id}: ${t} not loaded`)(),!1;this._syncAttachmentFormats(e);try{e.pushDebugGroup(`${this}.predraw(${e})`),this.device.type==="webgpu"?(this.updateShaderInputs(),this.material?.updateShaderInputs(),this._syncDynamicBuffers(),this.pipeline=this._updatePipeline()):this.predraw(this.device.commandEncoder)}finally{e.popDebugGroup()}let n,i=this.pipeline.isErrored;try{if(e.pushDebugGroup(`${this}.draw(${e})`),this._logDrawCallStart(),this.pipeline=this._updatePipeline(),i=this.pipeline.isErrored,i)P.info(At,`>>> DRAWING ABORTED ${this.id}: ${xp}`)(),n=!1;else{let o=this.vertexArray.getDrawValidationError();if(o)P.info(At,`>>> DRAWING ABORTED ${this.id}: ${o}`)(),this._drawBlockedReason=o,n=!1;else{let s=this._getCurrentShaderLayout(),a=this._getBindings(s),c=this._getBindGroups(s,a),{indexBuffer:l}=this.vertexArray,u=l?this.indexCount??l.byteLength/(l.indexType==="uint32"?4:2):void 0;e.setPipeline(this.pipeline),e.setBindings(c,{_bindGroupCacheKeys:this._getBindGroupCacheKeys()}),e.setVertexArray(this.vertexArray),n=this.isInstanced===!0&&this.instanceCount===0?!0:e.draw({isInstanced:this.isInstanced,vertexCount:this.vertexCount,instanceCount:this.isInstanced?this.instanceCount:void 0,indexCount:u,firstVertex:this.firstVertex,firstIndex:this.firstIndex,transformFeedback:this.transformFeedback||void 0,uniforms:this.props.uniforms,parameters:this.parameters,topology:this.topology})}}}finally{e.popDebugGroup(),this._logDrawCallEnd()}return this._logFramebuffer(e),n?(this._lastDrawTimestamp=this.device.timestamp,this._needsRedraw=!1):i?(this._needsRedraw=xp,this._drawBlockedReason=xp):this._drawBlockedReason?this._needsRedraw=this._drawBlockedReason:this._needsRedraw="waiting for resource initialization",n}setGeometry(e){this._gpuGeometry?.destroy();let t=e&&uv(this.device,e);if(t){this.setTopology(t.topology||"triangle-list");let n=new yi(this.bufferLayout);this.bufferLayout=n.mergeBufferLayouts(t.bufferLayout,this.bufferLayout),this.vertexArray&&this._setGeometryAttributes(t)}this._gpuGeometry=t}setTopology(e){e!==this.topology&&(this.topology=e,this._setPipelineNeedsUpdate("topology"))}setBufferLayout(e){let t=new yi(this.bufferLayout),n=this._gpuGeometry?t.mergeBufferLayouts(e,this._gpuGeometry.bufferLayout):e;_i(n,this.bufferLayout,-1)||(this.bufferLayout=n,this._setPipelineNeedsUpdate("bufferLayout"),this.pipeline=this._updatePipeline(),this.vertexArray=this.device.createVertexArray({shaderLayout:this.pipeline.shaderLayout,bufferLayout:this.pipeline.bufferLayout}),this._gpuGeometry&&this._setGeometryAttributes(this._gpuGeometry))}setParameters(e){_i(e,this.parameters,2)||(this.parameters=e,this._setPipelineNeedsUpdate("parameters"))}setInstanceCount(e){this.instanceCount=e,this.isInstanced===void 0&&e>0&&(this.isInstanced=!0),this.setNeedsRedraw("instanceCount")}setVertexCount(e){this.vertexCount=e,this.setNeedsRedraw("vertexCount")}setIndexCount(e){this.indexCount=e,this.setNeedsRedraw("indexCount")}setDrawOffsets({firstVertex:e,firstIndex:t}){this.firstVertex=e,this.firstIndex=t,this.setNeedsRedraw("drawOffsets")}setShaderInputs(e){this.shaderInputs=e,this._uniformStore=new qr(this.device,this.shaderInputs.modules);for(let[t,n]of Object.entries(this.shaderInputs.modules))if(cs(n)&&!this.material?.ownsModule(t)){let i=this._uniformStore.getManagedUniformBuffer(t);this.bindings[`${t}Uniforms`]=i}this.setNeedsRedraw("shaderInputs")}setMaterial(e){this.material=e,this.setNeedsRedraw("material")}updateShaderInputs(e){this._uniformStore.setUniforms(this.shaderInputs.getUniformValues(),e),this.setBindings(this._getNonMaterialBindings(this.shaderInputs.getBindingValues())),this.setNeedsRedraw("shaderInputs")}setBindings(e){Object.assign(this.bindings,e),this.setNeedsRedraw("bindings")}setTransformFeedback(e){this.transformFeedback=e,this.setNeedsRedraw("transformFeedback")}setIndexBuffer(e){let t=e instanceof me?e.buffer:e;this.indexBuffer=t,this._dynamicIndexBufferSource=e instanceof me?{source:e,generation:e.generation}:null,this.vertexArray.setIndexBuffer(t),this.setNeedsRedraw("indexBuffer")}setAttributes(e,t){this._drawBlockedReason=!1;let n=t?.disableWarnings??this.props.disableWarnings;e.indices&&P.warn(`Model:${this.id} setAttributes() - indexBuffer should be set using setIndexBuffer()`)(),this.bufferLayout=xv(this.pipeline.shaderLayout,this.bufferLayout);let i=new yi(this.bufferLayout);for(let[o,s]of Object.entries(e)){let a=s instanceof me?s.buffer:s,c=i.getBufferLayout(o);if(!c){n||P.warn(`Model(${this.id}): Missing layout for buffer "${o}".`)();continue}let l=i.getAttributeNamesForBuffer(c),u=!1;for(let f of l){let d=this._attributeInfos[f];if(d){let h=this.device.type==="webgpu"?this.vertexArray.getBufferSlot(d.bufferName):d.location;if(h===null){n||P.warn(`Model(${this.id}): Missing vertex array slot for buffer "${d.bufferName}".`)();continue}this.vertexArray.setBuffer(h,a),s instanceof me?this._dynamicAttributeBufferSources[h]={source:s,generation:s.generation}:delete this._dynamicAttributeBufferSources[h],u=!0}}!u&&!n&&P.warn(`Model(${this.id}): Ignoring buffer "${a.id}" for unknown attribute "${o}"`)()}this.setNeedsRedraw("attributes")}setConstantAttributes(e,t){for(let[n,i]of Object.entries(e)){let o=this._attributeInfos[n];o?this.vertexArray.setConstantWebGL(o.location,i):(t?.disableWarnings??this.props.disableWarnings)||P.warn(`Model "${this.id}: Ignoring constant supplied for unknown attribute "${n}"`)()}this.setNeedsRedraw("constants")}_areBindingsLoading(){for(let e of Object.values(this.bindings))if(us(e)&&!e.isReady)return e.id;for(let e of Object.values(this.material?.bindings||{}))if(us(e)&&!e.isReady)return e.id;return!1}_getBindings(e=this._getCurrentShaderLayout()){let t={};for(let[n,i]of Object.entries(this.bindings)){let o=oO(n,i,e);o&&(t[n]=o)}return t}_getBindGroups(e=this._getCurrentShaderLayout(),t=this._getBindings(e)){let n=e.bindings.length?Hr(e,t):{0:t};if(!this.material)return n;for(let[i,o]of Object.entries(this.material.getBindingsByGroup(e))){let s=Number(i);n[s]={...n[s]||{},...o}}return n}_getBindGroupCacheKeys(){let e=this.material?.getBindGroupCacheKey(3);return e?{3:e}:{}}_getBindingsUpdateTimestamp(){let e=0;this._dynamicIndexBufferSource&&(e=Math.max(e,this._dynamicIndexBufferSource.source.updateTimestamp));for(let t of Object.values(this._dynamicAttributeBufferSources))e=Math.max(e,t.source.updateTimestamp);for(let t of Object.values(this.bindings))t instanceof zr?e=Math.max(e,t.texture.updateTimestamp):t instanceof D||t instanceof z||t instanceof wo||t instanceof me?e=Math.max(e,t.updateTimestamp):us(t)?e=t.isReady?Math.max(e,t.updateTimestamp):1/0:yp(t)&&(e=Math.max(e,(t.buffer instanceof me,t.buffer.updateTimestamp)));return Math.max(e,this.material?.getBindingsUpdateTimestamp()||0)}_setGeometryAttributes(e){let t={...e.attributes};for(let[n]of Object.entries(t))!this.pipeline.shaderLayout.attributes.find(i=>i.name===n)&&n!=="positions"&&delete t[n];this.vertexCount=e.vertexCount,this.setIndexBuffer(e.indices||null),this.setAttributes(e.attributes,{disableWarnings:!0}),this.setAttributes(t,{disableWarnings:this.props.disableWarnings}),this.setNeedsRedraw("geometry attributes")}_setPipelineNeedsUpdate(e){this._pipelineNeedsUpdate||=e,this._drawBlockedReason=!1,this.setNeedsRedraw(e)}_updatePipeline(){if(this._pipelineNeedsUpdate){let e=null,t=null;this.pipeline&&(P.log(1,`Model ${this.id}: Recreating pipeline because "${this._pipelineNeedsUpdate}".`)(),e=this.pipeline.vs,t=this.pipeline.fs),this._pipelineNeedsUpdate=!1;let n=this.shaderFactory.createShader({id:`${this.id}-vertex`,stage:"vertex",source:this.source||this.vs,debugShaders:this.props.debugShaders}),i=null;this.source?i=n:this.fs&&(i=this.shaderFactory.createShader({id:`${this.id}-fragment`,stage:"fragment",source:this.source||this.fs,debugShaders:this.props.debugShaders})),this.pipeline=this.pipelineFactory.createRenderPipeline({...this.props,bindings:void 0,bufferLayout:this.bufferLayout,colorAttachmentFormats:this._colorAttachmentFormats,depthStencilAttachmentFormat:this._depthStencilAttachmentFormat,topology:this.topology,parameters:this.parameters,bindGroups:void 0,vs:n,fs:i}),this._attributeInfos=Oo(this.pipeline.shaderLayout,this.bufferLayout),e&&this.shaderFactory.release(e),t&&t!==e&&this.shaderFactory.release(t)}return this.pipeline}_lastLogTime=0;_logOpen=!1;_logDrawCallStart(){let e=P.level>3?0:rO;P.level<2||Date.now()-this._lastLogTime<e||(this._lastLogTime=Date.now(),this._logOpen=!0,P.group(At,`>>> DRAWING MODEL ${this.id}`,{collapsed:P.level<=2})())}_logDrawCallEnd(){if(this._logOpen){let e=dv(this.pipeline.shaderLayout,this.id);P.table(At,e)();let t=this.shaderInputs.getDebugTable();P.table(At,t)();let n=this._getAttributeDebugTable();P.table(At,this._attributeInfos)(),P.table(At,n)(),P.groupEnd(At)(),this._logOpen=!1}}_drawCount=0;_logFramebuffer(e){let t=this.device.props.debugFramebuffers;if(this._drawCount++,!t)return;let n=e.props.framebuffer;gv(e,n,{id:n?.id||`${this.id}-framebuffer`,minimap:!0})}_getAttributeDebugTable(){let e={};for(let[t,n]of Object.entries(this._attributeInfos)){let i=this.vertexArray.attributes[n.location];e[n.location]={name:t,type:n.shaderType,values:i?this._getBufferOrConstantValues(i,n.bufferDataType):"null"}}if(this.vertexArray.indexBuffer){let{indexBuffer:t}=this.vertexArray,n=t.indexType==="uint32"?new Uint32Array(t.debugData):new Uint16Array(t.debugData);e.indices={name:"indices",type:t.indexType,values:n.toString()}}return e}_getBufferOrConstantValues(e,t){let n=de.getTypedArrayConstructor(t);return(e instanceof D?new n(e.debugData):e).toString()}_getNonMaterialBindings(e){if(!this.material)return e;let t={};for(let[n,i]of Object.entries(e))this.material.ownsBinding(n)||(t[n]=i);return t}_getCurrentShaderLayout(){return this.pipeline?.shaderLayout||this.props.shaderLayout||{bindings:[]}}_syncDynamicBuffers(){if(this._dynamicIndexBufferSource&&this._dynamicIndexBufferSource.generation!==this._dynamicIndexBufferSource.source.generation){let e=this._dynamicIndexBufferSource.source.buffer;this.indexBuffer=e,this.vertexArray.setIndexBuffer(e),this._dynamicIndexBufferSource.generation=this._dynamicIndexBufferSource.source.generation,this.setNeedsRedraw("dynamic index buffer")}for(let[e,t]of Object.entries(this._dynamicAttributeBufferSources))t.generation!==t.source.generation&&(this.vertexArray.setBuffer(Number(e),t.source.buffer),t.generation=t.source.generation,this.setNeedsRedraw("dynamic attribute buffer"))}_syncAttachmentFormats(e){if(this.device.type!=="webgpu")return;let t=e.framebuffer||e.props.framebuffer,n=e.props,i=n.colorAttachmentFormats??t?.colorAttachments?.map(s=>sO(s?.texture?.format)),o=n.depthStencilAttachmentFormat===!1?void 0:n.depthStencilAttachmentFormat??aO(t?.depthStencilAttachment?.texture?.format);(!_i(this._colorAttachmentFormats,i,1)||this._depthStencilAttachmentFormat!==o)&&(this._colorAttachmentFormats=i,this._depthStencilAttachmentFormat=o,this._setPipelineNeedsUpdate("attachment formats"))}}});var lO,uO,_e,Rv=_(()=>{I();Me();wp();lO=35980,uO=35981,_e=class r{device;model;transformFeedback;static defaultProps={...ge.defaultProps,feedbackBufferMode:"separate",outputs:void 0,feedbackBuffers:void 0};static isSupported(e){return e?.info?.type==="webgl"}constructor(e,t=r.defaultProps){if(!r.isSupported(e))throw new Error("BufferTransform not yet implemented on WebGPU");this.device=e,this.model=new ge(this.device,{id:t.id||"buffer-transform-model",fs:t.fs||Wd(),topology:t.topology||"point-list",varyings:t.outputs||t.varyings,...t,bufferMode:t.bufferMode||(t.feedbackBufferMode==="interleaved"?lO:uO)}),this.transformFeedback=this.device.createTransformFeedback({layout:this.model.pipeline.shaderLayout,buffers:t.feedbackBuffers}),this.model.setTransformFeedback(this.transformFeedback)}destroy(){this.model&&this.model.destroy()}delete(){this.destroy()}run(e){e?.inputBuffers&&this.model.setAttributes(e.inputBuffers),e?.outputBuffers&&this.transformFeedback.setBuffers(e.outputBuffers);let t=this.device.beginRenderPass({discard:!0,...e});this.model.draw(t),t.end()}getBuffer(e){return this.transformFeedback.getBuffer(e)}readAsync(e){let t=this.getBuffer(e);if(!t)throw new Error("BufferTransform#getBuffer");if(t instanceof D)return t.readAsync();let{buffer:n,byteOffset:i=0,byteLength:o=n.byteLength}=t;return n.readAsync(i,o)}}});function dO(r){return{type:r.type,shaderLanguage:r.info.shadingLanguage,shaderLanguageVersion:r.info.shadingLanguageVersion,gpu:r.info.gpu,limits:r.limits,features:r.features}}var Ep,fO,$e,Iv=_(()=>{I();Me();Cf();_p();hp();gi();Ep=2,fO=1e4,$e=class r{static defaultProps={...dr.defaultProps,id:"unnamed",handle:void 0,userData:{},source:"",modules:[],defines:{},plugins:[],bindings:void 0,shaderInputs:void 0,pipelineFactory:void 0,shaderFactory:void 0,shaderAssembler:Xe.getDefaultShaderAssembler("wgsl"),debugShaders:void 0};device;id;pipelineFactory;shaderFactory;userData={};bindings={};pipeline;source;shader;shaderInputs;_uniformStore;_pipelineNeedsUpdate="newly created";_getModuleUniforms;props;_destroyed=!1;constructor(e,t){if(e.type!=="webgpu")throw new Error("Computation is only supported in WebGPU");this.props={...r.defaultProps,...t},t=this.props,this.id=t.id||Lt("model"),this.device=e,Object.assign(this.userData,t.userData);let n=dO(e),i=Bo(this.props.plugins,n.shaderLanguage);if(Object.keys(i.vertexInputs).length>0||Object.keys(i.varyings).length>0)throw new Error("Computation does not support ShaderPlugin vertex inputs or varyings");let o=Do(this.props.modules,i.modules),s=Object.fromEntries(o.map(p=>[p.name,p]));this.shaderInputs=t.shaderInputs||new xi(s),t.shaderInputs&&i.modules.length>0&&this.shaderInputs.addModules(i.modules),this.setShaderInputs(this.shaderInputs);let a=cl(this.props.modules,this.shaderInputs?.getModules()),c={...i.defines,...this.props.defines};this.props.shaderLayout=bi(this.props.shaderLayout,a)||null,this.pipelineFactory=t.pipelineFactory||Wr.getDefaultPipelineFactory(this.device),this.shaderFactory=t.shaderFactory||jr.getDefaultShaderFactory(this.device);let l=this.props.shaderAssembler;lr(l instanceof pr);let{source:u,getUniforms:f,shaderLayout:d}=l.assembleWGSLShader({platformInfo:n,...this.props,modules:a,defines:c,scanVertexAttributes:!1,pluginInjections:i.injections});this.source=u,this._getModuleUniforms=f;let h=d??e.getShaderLayout?.(this.source,{scanVertexAttributes:!1});this.props.shaderLayout=bi(this.props.shaderLayout||h||null,a)||null,this.pipeline=this._updatePipeline(),t.bindings&&this.setBindings(t.bindings)}destroy(){this._destroyed||(this.pipelineFactory.release(this.pipeline),this.shaderFactory.release(this.shader),this._uniformStore.destroy(),this._destroyed=!0)}predraw(e){this.updateShaderInputs(e)}dispatch(e,t,n,i){try{this._logDrawCallStart(),this._setPipeline(e),e.dispatch(t,n,i)}finally{this._logDrawCallEnd()}}dispatchIndirect(e,t,n=0){try{this._logDrawCallStart(),this._setPipeline(e),e.dispatchIndirect(t,n)}finally{this._logDrawCallEnd()}}_setPipeline(e){this.pipeline=this._updatePipeline(),this.pipeline.setBindings(this.bindings),e.setPipeline(this.pipeline),e.setBindings({})}setVertexCount(e){}setInstanceCount(e){}setShaderInputs(e){this.shaderInputs=e,this._uniformStore=new qr(this.device,this.shaderInputs.modules);for(let[t,n]of Object.entries(this.shaderInputs.modules))if(cs(n)){let i=this._uniformStore.getManagedUniformBuffer(t);this.bindings[`${t}Uniforms`]=i}}setShaderModuleProps(e){let t=this._getModuleUniforms(e),n=Object.keys(t).filter(o=>{let s=t[o];return!ao(s)&&typeof s!="number"&&typeof s!="boolean"}),i={};for(let o of n)i[o]=t[o],delete t[o]}updateShaderInputs(e){this._uniformStore.setUniforms(this.shaderInputs.getUniformValues(),e)}setBindings(e){Object.assign(this.bindings,e)}_setPipelineNeedsUpdate(e){this._pipelineNeedsUpdate=this._pipelineNeedsUpdate||e}_updatePipeline(){if(this._pipelineNeedsUpdate){let e=null;this.pipeline&&(P.log(1,`Model ${this.id}: Recreating pipeline because "${this._pipelineNeedsUpdate}".`)(),e=this.shader),this._pipelineNeedsUpdate=!1,this.shader=this.shaderFactory.createShader({id:`${this.id}-fragment`,stage:"compute",source:this.source,debugShaders:this.props.debugShaders}),this.pipeline=this.pipelineFactory.createComputePipeline({...this.props,shader:this.shader}),e&&this.shaderFactory.release(e)}return this.pipeline}_lastLogTime=0;_logOpen=!1;_logDrawCallStart(){let e=P.level>3?0:fO;P.level<2||Date.now()-this._lastLogTime<e||(this._lastLogTime=Date.now(),this._logOpen=!0,P.group(Ep,`>>> DRAWING MODEL ${this.id}`,{collapsed:P.level<=2})())}_logDrawCallEnd(){if(this._logOpen){let e=this.shaderInputs.getDebugTable();P.table(Ep,e)(),P.groupEnd(Ep)(),this._logOpen=!1}}_drawCount=0;_getBufferOrConstantValues(e,t){let n=de.getTypedArrayConstructor(t);return(e instanceof D?new n(e.debugData):e).toString()}}});var K=_(()=>{iv();lv();wp();Rv();sl();dp();bp();Iv()});function jv(r=!0){let e=HTMLCanvasElement.prototype;if(!r&&e.originalGetContext){e.getContext=e.originalGetContext,e.originalGetContext=void 0;return}e.originalGetContext=e.getContext,e.getContext=function(t,n){if(t==="webgl"||t==="experimental-webgl"){let i=this.originalGetContext("webgl2",n);return i instanceof HTMLElement&&VO(i),i}return this.originalGetContext(t,n)}}function VO(r){r.getExtension("EXT_color_buffer_float");let e={...UO,WEBGL_disjoint_timer_query:r.getExtension("EXT_disjoint_timer_query_webgl2"),WEBGL_draw_buffers:GO(r),OES_vertex_array_object:zO(r),ANGLE_instanced_arrays:$O(r)},t=r.getExtension.bind(r);r.getExtension=function(i){let o=t(i);return o||(i in e?e[i]:null)};let n=r.getSupportedExtensions;r.getSupportedExtensions=function(){return(n.apply(r)||[])?.concat(Object.keys(e))}}var UO,GO,zO,$O,Hv=_(()=>{UO={WEBGL_depth_texture:{UNSIGNED_INT_24_8_WEBGL:34042},OES_element_index_uint:{},OES_texture_float:{},OES_texture_half_float:{HALF_FLOAT_OES:5131},EXT_color_buffer_float:{},OES_standard_derivatives:{FRAGMENT_SHADER_DERIVATIVE_HINT_OES:35723},EXT_frag_depth:{},EXT_blend_minmax:{MIN_EXT:32775,MAX_EXT:32776},EXT_shader_texture_lod:{}},GO=r=>({drawBuffersWEBGL(e){return r.drawBuffers(e)},COLOR_ATTACHMENT0_WEBGL:36064,COLOR_ATTACHMENT1_WEBGL:36065,COLOR_ATTACHMENT2_WEBGL:36066,COLOR_ATTACHMENT3_WEBGL:36067}),zO=r=>({VERTEX_ARRAY_BINDING_OES:34229,createVertexArrayOES(){return r.createVertexArray()},deleteVertexArrayOES(e){return r.deleteVertexArray(e)},isVertexArrayOES(e){return r.isVertexArray(e)},bindVertexArrayOES(e){return r.bindVertexArray(e)}}),$O=r=>({VERTEX_ATTRIB_ARRAY_DIVISOR_ANGLE:35070,drawArraysInstancedANGLE(...e){return r.drawArraysInstanced(...e)},drawElementsInstancedANGLE(...e){return r.drawElementsInstanced(...e)},vertexAttribDivisorANGLE(...e){return r.vertexAttribDivisor(...e)}})});async function qv(){if(!gl){Bp();return}await gl.load()}function Zv(r,e){return gl?gl.makeDebugContext(r,e):(Bp(),r)}async function Xv(r){if(!Op){Bp();return}await Op.load(r)}function Kv(r){return Op?.initialize(r)||null}function Bp(){Yv||(Yv=!0,P.warn("Import @luma.gl/webgl/debug before enabling WebGL debugging.")())}var gl,Op,Yv,Dp=_(()=>{I();gl=null,Op=null,Yv=!1});function kp(r){return Array.isArray(r)||ArrayBuffer.isView(r)&&!(r instanceof DataView)}function ee(r,e,t){return e[r]!==void 0?e[r]:t[r]}var As,se,Qv,Ve,Jv,Ls,ew,tw,Np,Ot,Fp,rw,Up=_(()=>{As={3042:!1,32773:new Float32Array([0,0,0,0]),32777:32774,34877:32774,32969:1,32968:0,32971:1,32970:0,3106:new Float32Array([0,0,0,0]),3107:[!0,!0,!0,!0],2884:!1,2885:1029,2929:!1,2931:1,2932:513,2928:new Float32Array([0,1]),2930:!0,3024:!0,35725:null,36006:null,36007:null,34229:null,34964:null,2886:2305,33170:4352,2849:1,32823:!1,32824:0,10752:0,32926:!1,32928:!1,32938:1,32939:!1,3089:!1,3088:new Int32Array([0,0,1024,1024]),2960:!1,2961:0,2968:4294967295,36005:4294967295,2962:519,2967:0,2963:4294967295,34816:519,36003:0,36004:4294967295,2964:7680,2965:7680,2966:7680,34817:7680,34818:7680,34819:7680,2978:[0,0,1024,1024],36389:null,36662:null,36663:null,35053:null,35055:null,35723:4352,36010:null,35977:!1,3333:4,3317:4,37440:!1,37441:!1,37443:37444,3330:0,3332:0,3331:0,3314:0,32878:0,3316:0,3315:0,32877:0},se=(r,e,t)=>e?r.enable(t):r.disable(t),Qv=(r,e,t)=>r.hint(t,e),Ve=(r,e,t)=>r.pixelStorei(t,e),Jv=(r,e,t)=>{let n=t===36006?36009:36008;return r.bindFramebuffer(n,e)},Ls=(r,e,t)=>{let i={34964:34962,36662:36662,36663:36663,35053:35051,35055:35052}[t];r.bindBuffer(i,e)};ew={3042:se,32773:(r,e)=>r.blendColor(...e),32777:"blendEquation",34877:"blendEquation",32969:"blendFunc",32968:"blendFunc",32971:"blendFunc",32970:"blendFunc",3106:(r,e)=>r.clearColor(...e),3107:(r,e)=>r.colorMask(...e),2884:se,2885:(r,e)=>r.cullFace(e),2929:se,2931:(r,e)=>r.clearDepth(e),2932:(r,e)=>r.depthFunc(e),2928:(r,e)=>r.depthRange(...e),2930:(r,e)=>r.depthMask(e),3024:se,35723:Qv,35725:(r,e)=>r.useProgram(e),36007:(r,e)=>r.bindRenderbuffer(36161,e),36389:(r,e)=>r.bindTransformFeedback?.(36386,e),34229:(r,e)=>r.bindVertexArray(e),36006:Jv,36010:Jv,34964:Ls,36662:Ls,36663:Ls,35053:Ls,35055:Ls,2886:(r,e)=>r.frontFace(e),33170:Qv,2849:(r,e)=>r.lineWidth(e),32823:se,32824:"polygonOffset",10752:"polygonOffset",35977:se,32926:se,32928:se,32938:"sampleCoverage",32939:"sampleCoverage",3089:se,3088:(r,e)=>r.scissor(...e),2960:se,2961:(r,e)=>r.clearStencil(e),2968:(r,e)=>r.stencilMaskSeparate(1028,e),36005:(r,e)=>r.stencilMaskSeparate(1029,e),2962:"stencilFuncFront",2967:"stencilFuncFront",2963:"stencilFuncFront",34816:"stencilFuncBack",36003:"stencilFuncBack",36004:"stencilFuncBack",2964:"stencilOpFront",2965:"stencilOpFront",2966:"stencilOpFront",34817:"stencilOpBack",34818:"stencilOpBack",34819:"stencilOpBack",2978:(r,e)=>r.viewport(...e),34383:se,10754:se,12288:se,12289:se,12290:se,12291:se,12292:se,12293:se,12294:se,12295:se,3333:Ve,3317:Ve,37440:Ve,37441:Ve,37443:Ve,3330:Ve,3332:Ve,3331:Ve,3314:Ve,32878:Ve,3316:Ve,3315:Ve,32877:Ve,framebuffer:(r,e)=>{let t=e&&"handle"in e?e.handle:e;return r.bindFramebuffer(36160,t)},blend:(r,e)=>e?r.enable(3042):r.disable(3042),blendColor:(r,e)=>r.blendColor(...e),blendEquation:(r,e)=>{let t=typeof e=="number"?[e,e]:e;r.blendEquationSeparate(...t)},blendFunc:(r,e)=>{let t=e?.length===2?[...e,...e]:e;r.blendFuncSeparate(...t)},clearColor:(r,e)=>r.clearColor(...e),clearDepth:(r,e)=>r.clearDepth(e),clearStencil:(r,e)=>r.clearStencil(e),colorMask:(r,e)=>r.colorMask(...e),cull:(r,e)=>e?r.enable(2884):r.disable(2884),cullFace:(r,e)=>r.cullFace(e),depthTest:(r,e)=>e?r.enable(2929):r.disable(2929),depthFunc:(r,e)=>r.depthFunc(e),depthMask:(r,e)=>r.depthMask(e),depthRange:(r,e)=>r.depthRange(...e),dither:(r,e)=>e?r.enable(3024):r.disable(3024),derivativeHint:(r,e)=>{r.hint(35723,e)},frontFace:(r,e)=>r.frontFace(e),mipmapHint:(r,e)=>r.hint(33170,e),lineWidth:(r,e)=>r.lineWidth(e),polygonOffsetFill:(r,e)=>e?r.enable(32823):r.disable(32823),polygonOffset:(r,e)=>r.polygonOffset(...e),sampleCoverage:(r,e)=>r.sampleCoverage(e[0],e[1]||!1),scissorTest:(r,e)=>e?r.enable(3089):r.disable(3089),scissor:(r,e)=>r.scissor(...e),stencilTest:(r,e)=>e?r.enable(2960):r.disable(2960),stencilMask:(r,e)=>{e=kp(e)?e:[e,e];let[t,n]=e;r.stencilMaskSeparate(1028,t),r.stencilMaskSeparate(1029,n)},stencilFunc:(r,e)=>{e=kp(e)&&e.length===3?[...e,...e]:e;let[t,n,i,o,s,a]=e;r.stencilFuncSeparate(1028,t,n,i),r.stencilFuncSeparate(1029,o,s,a)},stencilOp:(r,e)=>{e=kp(e)&&e.length===3?[...e,...e]:e;let[t,n,i,o,s,a]=e;r.stencilOpSeparate(1028,t,n,i),r.stencilOpSeparate(1029,o,s,a)},viewport:(r,e)=>r.viewport(...e)};tw={blendEquation:(r,e,t)=>r.blendEquationSeparate(ee(32777,e,t),ee(34877,e,t)),blendFunc:(r,e,t)=>r.blendFuncSeparate(ee(32969,e,t),ee(32968,e,t),ee(32971,e,t),ee(32970,e,t)),polygonOffset:(r,e,t)=>r.polygonOffset(ee(32824,e,t),ee(10752,e,t)),sampleCoverage:(r,e,t)=>r.sampleCoverage(ee(32938,e,t),ee(32939,e,t)),stencilFuncFront:(r,e,t)=>r.stencilFuncSeparate(1028,ee(2962,e,t),ee(2967,e,t),ee(2963,e,t)),stencilFuncBack:(r,e,t)=>r.stencilFuncSeparate(1029,ee(34816,e,t),ee(36003,e,t),ee(36004,e,t)),stencilOpFront:(r,e,t)=>r.stencilOpSeparate(1028,ee(2964,e,t),ee(2965,e,t),ee(2966,e,t)),stencilOpBack:(r,e,t)=>r.stencilOpSeparate(1029,ee(34817,e,t),ee(34818,e,t),ee(34819,e,t))},Np={enable:(r,e)=>r({[e]:!0}),disable:(r,e)=>r({[e]:!1}),pixelStorei:(r,e,t)=>r({[e]:t}),hint:(r,e,t)=>r({[e]:t}),useProgram:(r,e)=>r({35725:e}),bindRenderbuffer:(r,e,t)=>r({36007:t}),bindTransformFeedback:(r,e,t)=>r({36389:t}),bindVertexArray:(r,e)=>r({34229:e}),bindFramebuffer:(r,e,t)=>{switch(e){case 36160:return r({36006:t,36010:t});case 36009:return r({36006:t});case 36008:return r({36010:t});default:return null}},bindBuffer:(r,e,t)=>{let n={34962:[34964],36662:[36662],36663:[36663],35051:[35053],35052:[35055]}[e];return n?r({[n]:t}):{valueChanged:!0}},blendColor:(r,e,t,n,i)=>r({32773:new Float32Array([e,t,n,i])}),blendEquation:(r,e)=>r({32777:e,34877:e}),blendEquationSeparate:(r,e,t)=>r({32777:e,34877:t}),blendFunc:(r,e,t)=>r({32969:e,32968:t,32971:e,32970:t}),blendFuncSeparate:(r,e,t,n,i)=>r({32969:e,32968:t,32971:n,32970:i}),clearColor:(r,e,t,n,i)=>r({3106:new Float32Array([e,t,n,i])}),clearDepth:(r,e)=>r({2931:e}),clearStencil:(r,e)=>r({2961:e}),colorMask:(r,e,t,n,i)=>r({3107:[e,t,n,i]}),cullFace:(r,e)=>r({2885:e}),depthFunc:(r,e)=>r({2932:e}),depthRange:(r,e,t)=>r({2928:new Float32Array([e,t])}),depthMask:(r,e)=>r({2930:e}),frontFace:(r,e)=>r({2886:e}),lineWidth:(r,e)=>r({2849:e}),polygonOffset:(r,e,t)=>r({32824:e,10752:t}),sampleCoverage:(r,e,t)=>r({32938:e,32939:t}),scissor:(r,e,t,n,i)=>r({3088:new Int32Array([e,t,n,i])}),stencilMask:(r,e)=>r({2968:e,36005:e}),stencilMaskSeparate:(r,e,t)=>r({[e===1028?2968:36005]:t}),stencilFunc:(r,e,t,n)=>r({2962:e,2967:t,2963:n,34816:e,36003:t,36004:n}),stencilFuncSeparate:(r,e,t,n,i)=>r({[e===1028?2962:34816]:t,[e===1028?2967:36003]:n,[e===1028?2963:36004]:i}),stencilOp:(r,e,t,n)=>r({2964:e,2965:t,2966:n,34817:e,34818:t,34819:n}),stencilOpSeparate:(r,e,t,n,i)=>r({[e===1028?2964:34817]:t,[e===1028?2965:34818]:n,[e===1028?2966:34819]:i}),viewport:(r,e,t,n,i)=>r({2978:[e,t,n,i]})},Ot=(r,e)=>r.isEnabled(e),Fp={3042:Ot,2884:Ot,2929:Ot,3024:Ot,32823:Ot,32926:Ot,32928:Ot,3089:Ot,2960:Ot,35977:Ot},rw=new Set([34016,36388,36387,35983,35368,34965,35739,35738,3074,34853,34854,34855,34856,34857,34858,34859,34860,34861,34862,34863,34864,34865,34866,34867,34868,35097,32873,35869,32874,34068])});function lt(r,e){if(WO(e))return;let t={};for(let i in e){let o=Number(i),s=ew[i];s&&(typeof s=="string"?t[s]=!0:s(r,e[i],o))}let n=r.lumaState?.cache;if(n)for(let i in t){let o=tw[i];o(r,e,n)}}function _l(r,e=As){if(typeof e=="number"){let i=e,o=Fp[i];return o?o(r,i):r.getParameter(i)}let t=Array.isArray(e)?e:Object.keys(e),n={};for(let i of t){let o=Fp[i];n[i]=o?o(r,Number(i)):r.getParameter(Number(i))}return n}function nw(r){lt(r,As)}function WO(r){for(let e in r)return!1;return!0}var Pi=_(()=>{Up()});function ow(r,e){if(r===e)return!0;if(iw(r)&&iw(e)&&r.length===e.length){for(let t=0;t<r.length;++t)if(r[t]!==e[t])return!1;return!0}return!1}function iw(r){return Array.isArray(r)||ArrayBuffer.isView(r)}var sw=_(()=>{});function aw(r,e){let t=r[e].bind(r);r[e]=function(i){if(i===void 0||rw.has(i))return t(i);let o=ut.get(r);return i in o.cache||(o.cache[i]=t(i)),o.enable?o.cache[i]:t(i)},Object.defineProperty(r[e],"name",{value:`${e}-from-cache`,configurable:!1})}function jO(r,e,t){if(!r[e])return;let n=r[e].bind(r);r[e]=function(...o){let s=ut.get(r),{valueChanged:a,oldValue:c}=t(s._updateCache,...o);return a&&n(...o),c},Object.defineProperty(r[e],"name",{value:`${e}-to-cache`,configurable:!1})}function HO(r){let e=r.useProgram.bind(r);r.useProgram=function(n){let i=ut.get(r);i.program!==n&&(e(n),i.program=n)}}var ut,Gp=_(()=>{Pi();sw();Up();ut=class{static get(e){return e.lumaState}gl;program=null;stateStack=[];enable=!0;cache=null;log;initialized=!1;constructor(e,t){this.gl=e,this.log=t?.log||(()=>{}),this._updateCache=this._updateCache.bind(this),Object.seal(this)}push(e={}){this.stateStack.push({})}pop(){let e=this.stateStack[this.stateStack.length-1];lt(this.gl,e),this.stateStack.pop()}trackState(e,t){if(this.cache=t?.copyState?_l(e):Object.assign({},As),this.initialized)throw new Error("WebGLStateTracker");this.initialized=!0,this.gl.lumaState=this,HO(e);for(let n in Np){let i=Np[n];jO(e,n,i)}aw(e,"getParameter"),aw(e,"isEnabled")}_updateCache(e){let t=!1,n,i=this.stateStack.length>0?this.stateStack[this.stateStack.length-1]:null;for(let o in e){let s=e[o],a=this.cache[o];ow(s,a)||(t=!0,n=a,i&&!(o in i)&&(i[o]=a),this.cache[o]=s)}return{valueChanged:t,oldValue:n}}}});function Cs(r){let e=r.luma||{_polyfilled:!1,extensions:{},softwareRenderer:!1};return e._polyfilled??=!1,e.extensions||={},r.luma=e,e}var zp=_(()=>{});function cw(r,e,t){let n="",i=c=>{let l=c.statusMessage;l&&(n||=l)};r.addEventListener("webglcontextcreationerror",i,!1);let o=t.failIfMajorPerformanceCaveat!==!0,s={preserveDrawingBuffer:!0,...t,failIfMajorPerformanceCaveat:!0},a=null;try{a||=r.getContext("webgl2",s),!a&&s.failIfMajorPerformanceCaveat&&(n||="Only software GPU is available. Set `failIfMajorPerformanceCaveat: false` to allow.");let c=!1;if(!a&&o&&(s.failIfMajorPerformanceCaveat=!1,a=r.getContext("webgl2",s),c=!0),a||(a=r.getContext("webgl",{}),a&&(a=null,n||="Your browser only supports WebGL1")),!a)throw n||="Your browser does not support WebGL",new Error(`Failed to create WebGL context: ${n}`);let l=Cs(a);l.softwareRenderer=c;let{onContextLost:u,onContextRestored:f}=e;return r.addEventListener("webglcontextlost",d=>u(d),!1),r.addEventListener("webglcontextrestored",d=>f(d),!1),a}finally{r.removeEventListener("webglcontextcreationerror",i,!1)}}var lw=_(()=>{zp()});function ft(r,e,t){return t[e]===void 0&&(t[e]=r.getExtension(e)||null),t[e]}var Ms=_(()=>{});function uw(r,e){let t=r.getParameter(7936),n=r.getParameter(7937);ft(r,"WEBGL_debug_renderer_info",e);let i=e.WEBGL_debug_renderer_info,o=r.getParameter(i?i.UNMASKED_VENDOR_WEBGL:7936),s=r.getParameter(i?i.UNMASKED_RENDERER_WEBGL:7937),a=o||t,c=s||n,l=r.getParameter(7938),u=fw(a,c),f=YO(a,c),d=qO(a,c);return{type:"webgl",gpu:u,gpuType:d,gpuBackend:f,vendor:a,renderer:c,version:l,shadingLanguage:"glsl",shadingLanguageVersion:300}}function fw(r,e){return/NVIDIA/i.exec(r)||/NVIDIA/i.exec(e)?"nvidia":/INTEL/i.exec(r)||/INTEL/i.exec(e)?"intel":/Apple/i.exec(r)||/Apple/i.exec(e)?"apple":/AMD/i.exec(r)||/AMD/i.exec(e)||/ATI/i.exec(r)||/ATI/i.exec(e)?"amd":/SwiftShader/i.exec(r)||/SwiftShader/i.exec(e)?"software":"unknown"}function YO(r,e){return/Metal/i.exec(r)||/Metal/i.exec(e)?"metal":/ANGLE/i.exec(r)||/ANGLE/i.exec(e)?"opengl":"unknown"}function qO(r,e){if(/SwiftShader/i.exec(r)||/SwiftShader/i.exec(e))return"cpu";switch(fw(r,e)){case"apple":return ZO(r,e)?"integrated":"unknown";case"intel":return"integrated";case"software":return"cpu";case"unknown":return"unknown";default:return"discrete"}}function ZO(r,e){return/Apple (M\d|A\d|GPU)/i.test(`${r} ${e}`)}var dw=_(()=>{Ms()});function yl(r){switch(r){case"uint8":return 5121;case"sint8":return 5120;case"unorm8":return 5121;case"snorm8":return 5120;case"uint16":return 5123;case"sint16":return 5122;case"unorm16":return 5123;case"snorm16":return 5122;case"uint32":return 5125;case"sint32":return 5124;case"float16":return 5131;case"float32":return 5126}throw new Error(String(r))}var $p=_(()=>{});function mw(r){return r in xl}function Yp(r,e,t){return gw(r,e,t,new Set)}function gw(r,e,t,n){let i=xl[e];if(!i||n.has(e))return!1;n.add(e);let o=(i.features||[]).every(s=>gw(r,s,t,n));return n.delete(e),o?(i.extensions||[]).every(s=>!!ft(r,s,t)):!1}function _w(r,e,t){let n=e.create,i=vl[e.format];i?.gl===void 0&&(n=!1),i?.x&&(n=n&&!!ft(r,i.x,t)),e.format==="stencil8"&&(n=!1);let o=i?.r===!1?!1:i?.r===void 0||Yp(r,i.r,t),s=n&&e.render&&o&&nB(r,e.format,t);return{format:e.format,create:n&&e.create,render:s,filter:n&&e.filter,blend:n&&e.blend,store:n&&e.store}}function nB(r,e,t){let n=vl[e],i=n?.gl;if(i===void 0||n?.x&&!ft(r,n.x,t))return!1;let o=r.getParameter(32873),s=r.getParameter(36006),a=r.createTexture(),c=r.createFramebuffer();if(!a||!c)return!1;let l=0,u=Number(r.getError());for(;u!==l;)u=r.getError();let f=!1;try{if(r.bindTexture(3553,a),r.texStorage2D(3553,1,i,1,1),Number(r.getError())!==l)return!1;r.bindFramebuffer(36160,c),r.framebufferTexture2D(36160,36064,3553,a,0),f=Number(r.checkFramebufferStatus(36160))===36053&&Number(r.getError())===l}finally{r.bindFramebuffer(36160,s),r.deleteFramebuffer(c),r.bindTexture(3553,o),r.deleteTexture(a)}return f}function wl(r){let e=vl[r],t=oB(r),n=Se.getInfo(r);return n.compressed&&(e.dataFormat=t),{internalFormat:t,format:e?.dataFormat||iB(n.channels,n.integer,n.normalized,t),type:n.dataType?yl(n.dataType):e?.types?.[0]||5121,compressed:n.compressed||!1}}function yw(r){switch(Se.getInfo(r).attachment){case"depth":return 36096;case"stencil":return 36128;case"depth-stencil":return 33306;default:throw new Error(`Not a depth stencil format: ${r}`)}}function iB(r,e,t,n){if(n===6408||n===6407)return n;switch(r){case"r":return e&&!t?36244:6403;case"rg":return e&&!t?33320:33319;case"rgb":return e&&!t?36248:6407;case"rgba":return e&&!t?36249:6408;case"bgra":throw new Error("bgra pixels not supported by WebGL");default:return 6408}}function oB(r){let t=vl[r]?.gl;if(t===void 0)throw new Error(`Unsupported texture format ${r}`);return t}var Rs,Is,Si,Ti,XO,KO,QO,JO,eB,tB,hw,pw,Vp,Wp,jp,Hp,bl,rB,xl,vl,Li=_(()=>{I();Ms();$p();Rs="WEBGL_compressed_texture_s3tc",Is="WEBGL_compressed_texture_s3tc_srgb",Si="EXT_texture_compression_rgtc",Ti="EXT_texture_compression_bptc",XO="WEBGL_compressed_texture_etc",KO="WEBGL_compressed_texture_astc",QO="WEBGL_compressed_texture_etc1",JO="WEBGL_compressed_texture_pvrtc",eB="WEBGL_compressed_texture_atc",tB="EXT_texture_norm16",hw="EXT_render_snorm",pw="EXT_color_buffer_float",Vp="snorm8-renderable-webgl",Wp="norm16-renderable-webgl",jp="snorm16-renderable-webgl",Hp="float16-renderable-webgl",bl="float32-renderable-webgl",rB="rgb9e5ufloat-renderable-webgl",xl={"float32-renderable-webgl":{extensions:[pw]},"float16-renderable-webgl":{extensions:["EXT_color_buffer_half_float"]},"rgb9e5ufloat-renderable-webgl":{extensions:["WEBGL_render_shared_exponent"]},"snorm8-renderable-webgl":{extensions:[hw]},"norm16-webgl":{extensions:[tB]},"norm16-renderable-webgl":{features:["norm16-webgl"]},"snorm16-renderable-webgl":{features:["norm16-webgl"],extensions:[hw]},"float32-filterable":{extensions:["OES_texture_float_linear"]},"float16-filterable-webgl":{extensions:["OES_texture_half_float_linear"]},"texture-filterable-anisotropic-webgl":{extensions:["EXT_texture_filter_anisotropic"]},"texture-blend-float-webgl":{extensions:["EXT_float_blend"]},"texture-compression-bc":{extensions:[Rs,Is,Si,Ti]},"texture-compression-bc5-webgl":{extensions:[Si]},"texture-compression-bc7-webgl":{extensions:[Ti]},"texture-compression-etc2":{extensions:[XO]},"texture-compression-astc":{extensions:[KO]},"texture-compression-etc1-webgl":{extensions:[QO]},"texture-compression-pvrtc-webgl":{extensions:[JO]},"texture-compression-atc-webgl":{extensions:[eB]}};vl={r8unorm:{gl:33321,rb:!0},r8snorm:{gl:36756,r:Vp},r8uint:{gl:33330,rb:!0},r8sint:{gl:33329,rb:!0},rg8unorm:{gl:33323,rb:!0},rg8snorm:{gl:36757,r:Vp},rg8uint:{gl:33336,rb:!0},rg8sint:{gl:33335,rb:!0},r16uint:{gl:33332,rb:!0},r16sint:{gl:33331,rb:!0},r16float:{gl:33325,rb:!0,r:Hp},r16unorm:{gl:33322,rb:!0,r:Wp},r16snorm:{gl:36760,r:jp},"rgba4unorm-webgl":{gl:32854,rb:!0},"rgb565unorm-webgl":{gl:36194,rb:!0},"rgb5a1unorm-webgl":{gl:32855,rb:!0},"rgb8unorm-webgl":{gl:32849},"rgb8snorm-webgl":{gl:36758},rgba8unorm:{gl:32856},"rgba8unorm-srgb":{gl:35907},rgba8snorm:{gl:36759,r:Vp},rgba8uint:{gl:36220},rgba8sint:{gl:36238},bgra8unorm:{},"bgra8unorm-srgb":{},rg16uint:{gl:33338},rg16sint:{gl:33337},rg16float:{gl:33327,rb:!0,r:Hp},rg16unorm:{gl:33324,r:Wp},rg16snorm:{gl:36761,r:jp},r32uint:{gl:33334,rb:!0},r32sint:{gl:33333,rb:!0},r32float:{gl:33326,r:bl},rgb9e5ufloat:{gl:35901,r:rB},rg11b10ufloat:{gl:35898,rb:!0},rgb10a2unorm:{gl:32857,rb:!0},rgb10a2uint:{gl:36975,rb:!0},"rgb16unorm-webgl":{gl:32852,r:!1},"rgb16snorm-webgl":{gl:36762,r:!1},rg32uint:{gl:33340,rb:!0},rg32sint:{gl:33339,rb:!0},rg32float:{gl:33328,rb:!0,r:bl},rgba16uint:{gl:36214,rb:!0},rgba16sint:{gl:36232,rb:!0},rgba16float:{gl:34842,r:Hp},rgba16unorm:{gl:32859,rb:!0,r:Wp},rgba16snorm:{gl:36763,r:jp},"rgb32float-webgl":{gl:34837,x:pw,r:bl,dataFormat:6407,types:[5126]},rgba32uint:{gl:36208,rb:!0},rgba32sint:{gl:36226,rb:!0},rgba32float:{gl:34836,rb:!0,r:bl},stencil8:{gl:36168,rb:!0},depth16unorm:{gl:33189,dataFormat:6402,types:[5123],rb:!0},depth24plus:{gl:33190,dataFormat:6402,types:[5125]},depth32float:{gl:36012,dataFormat:6402,types:[5126],rb:!0},"depth24plus-stencil8":{gl:35056,rb:!0,depthTexture:!0,dataFormat:34041,types:[34042]},"depth32float-stencil8":{gl:36013,dataFormat:34041,types:[36269],rb:!0},"bc1-rgb-unorm-webgl":{gl:33776,x:Rs},"bc1-rgb-unorm-srgb-webgl":{gl:35916,x:Is},"bc1-rgba-unorm":{gl:33777,x:Rs},"bc1-rgba-unorm-srgb":{gl:35916,x:Is},"bc2-rgba-unorm":{gl:33778,x:Rs},"bc2-rgba-unorm-srgb":{gl:35918,x:Is},"bc3-rgba-unorm":{gl:33779,x:Rs},"bc3-rgba-unorm-srgb":{gl:35919,x:Is},"bc4-r-unorm":{gl:36283,x:Si},"bc4-r-snorm":{gl:36284,x:Si},"bc5-rg-unorm":{gl:36285,x:Si},"bc5-rg-snorm":{gl:36286,x:Si},"bc6h-rgb-ufloat":{gl:36495,x:Ti},"bc6h-rgb-float":{gl:36494,x:Ti},"bc7-rgba-unorm":{gl:36492,x:Ti},"bc7-rgba-unorm-srgb":{gl:36493,x:Ti},"etc2-rgb8unorm":{gl:37492},"etc2-rgb8unorm-srgb":{gl:37494},"etc2-rgb8a1unorm":{gl:37496},"etc2-rgb8a1unorm-srgb":{gl:37497},"etc2-rgba8unorm":{gl:37493},"etc2-rgba8unorm-srgb":{gl:37495},"eac-r11unorm":{gl:37488},"eac-r11snorm":{gl:37489},"eac-rg11unorm":{gl:37490},"eac-rg11snorm":{gl:37491},"astc-4x4-unorm":{gl:37808},"astc-4x4-unorm-srgb":{gl:37840},"astc-5x4-unorm":{gl:37809},"astc-5x4-unorm-srgb":{gl:37841},"astc-5x5-unorm":{gl:37810},"astc-5x5-unorm-srgb":{gl:37842},"astc-6x5-unorm":{gl:37811},"astc-6x5-unorm-srgb":{gl:37843},"astc-6x6-unorm":{gl:37812},"astc-6x6-unorm-srgb":{gl:37844},"astc-8x5-unorm":{gl:37813},"astc-8x5-unorm-srgb":{gl:37845},"astc-8x6-unorm":{gl:37814},"astc-8x6-unorm-srgb":{gl:37846},"astc-8x8-unorm":{gl:37815},"astc-8x8-unorm-srgb":{gl:37847},"astc-10x5-unorm":{gl:37816},"astc-10x5-unorm-srgb":{gl:37848},"astc-10x6-unorm":{gl:37817},"astc-10x6-unorm-srgb":{gl:37849},"astc-10x8-unorm":{gl:37818},"astc-10x8-unorm-srgb":{gl:37850},"astc-10x10-unorm":{gl:37819},"astc-10x10-unorm-srgb":{gl:37851},"astc-12x10-unorm":{gl:37820},"astc-12x10-unorm-srgb":{gl:37852},"astc-12x12-unorm":{gl:37821},"astc-12x12-unorm-srgb":{gl:37853},"pvrtc-rgb4unorm-webgl":{gl:35840},"pvrtc-rgba4unorm-webgl":{gl:35842},"pvrtc-rgb2unorm-webgl":{gl:35841},"pvrtc-rgba2unorm-webgl":{gl:35843},"etc1-rbg-unorm-webgl":{gl:36196},"atc-rgb-unorm-webgl":{gl:35986},"atc-rgba-unorm-webgl":{gl:35986},"atc-rgbai-unorm-webgl":{gl:34798}}});var bw,El,xw=_(()=>{I();Ms();Li();bw={"depth-clip-control":"EXT_depth_clamp","timestamp-query":"EXT_disjoint_timer_query_webgl2","compilation-status-async-webgl":"KHR_parallel_shader_compile","html-in-canvas":r=>dd()&&typeof r.texElementImage2D=="function","polygon-mode-webgl":"WEBGL_polygon_mode","provoking-vertex-webgl":"WEBGL_provoking_vertex","shader-clip-cull-distance-webgl":"WEBGL_clip_cull_distance","shader-noperspective-interpolation-webgl":"NV_shader_noperspective_interpolation","shader-conservative-depth-webgl":"EXT_conservative_depth"},El=class extends bo{gl;extensions;testedFeatures=new Set;constructor(e,t,n){super([],n),this.gl=e,this.extensions=t,ft(e,"EXT_color_buffer_float",t)}*[Symbol.iterator](){let e=this.getFeatures();for(let t of e)this.has(t)&&(yield t);return[]}has(e){return this.disabledFeatures?.[e]?!1:(this.testedFeatures.has(e)||(this.testedFeatures.add(e),mw(e)&&Yp(this.gl,e,this.extensions)&&this.features.add(e),this.getWebGLFeature(e)&&this.features.add(e)),this.features.has(e))}initializeFeatures(){let e=this.getFeatures().filter(t=>t!=="polygon-mode-webgl");for(let t of e)this.has(t)}getFeatures(){return[...Object.keys(bw),...Object.keys(xl)]}getWebGLFeature(e){let t=bw[e];return typeof t=="string"?!!ft(this.gl,t,this.extensions):typeof t=="function"?t(this.gl):!!t}}});var Pl,vw=_(()=>{I();Pl=class extends yo{get maxTextureDimension1D(){return 0}get maxTextureDimension2D(){return this.getParameter(3379)}get maxTextureDimension3D(){return this.getParameter(32883)}get maxTextureArrayLayers(){return this.getParameter(35071)}get maxBindGroups(){return 0}get maxBindGroupsPlusVertexBuffers(){return 0}get maxBindingsPerBindGroup(){return 0}get maxDynamicUniformBuffersPerPipelineLayout(){return 0}get maxDynamicStorageBuffersPerPipelineLayout(){return 0}get maxSampledTexturesPerShaderStage(){return this.getParameter(35660)}get maxSamplersPerShaderStage(){return this.getParameter(35661)}get maxStorageBuffersPerShaderStage(){return 0}get maxStorageBuffersInVertexStage(){return 0}get maxStorageBuffersInFragmentStage(){return 0}get maxStorageTexturesPerShaderStage(){return 0}get maxStorageTexturesInVertexStage(){return 0}get maxStorageTexturesInFragmentStage(){return 0}get maxUniformBuffersPerShaderStage(){return this.getParameter(35375)}get maxUniformBufferBindingSize(){return this.getParameter(35376)}get maxStorageBufferBindingSize(){return 0}get maxBufferSize(){return Number.MAX_SAFE_INTEGER}get minUniformBufferOffsetAlignment(){return this.getParameter(35380)}get minStorageBufferOffsetAlignment(){return 0}get maxVertexBuffers(){return 16}get maxVertexAttributes(){return this.getParameter(34921)}get maxVertexBufferArrayStride(){return 2048}get maxInterStageShaderVariables(){return this.getParameter(35659)}get maxColorAttachments(){return this.getParameter(36063)}get maxColorAttachmentBytesPerSample(){return 0}get maxComputeWorkgroupStorageSize(){return 0}get maxComputeInvocationsPerWorkgroup(){return 0}get maxComputeWorkgroupSizeX(){return 0}get maxComputeWorkgroupSizeY(){return 0}get maxComputeWorkgroupSizeZ(){return 0}get maxComputeWorkgroupsPerDimension(){return 0}gl;limits={};constructor(e){super(),this.gl=e}getParameter(e){return this.limits[e]===void 0&&(this.limits[e]=this.gl.getParameter(e)),this.limits[e]||0}}});function sB(r){return r<34069?r+34069:r}function aB(r){switch(r){case 36053:return"success";case 36054:return"Mismatched attachments";case 36055:return"No attachments";case 36057:return"Height/width mismatch";case 36061:return"Unsupported or split attachments";case 36182:return"Samples mismatch";default:return`${r}`}}var Bt,Sl=_(()=>{I();Li();Bt=class extends Vr{device;gl;handle;colorAttachments=[];depthStencilAttachment=null;constructor(e,t){super(e,t);let n=t.handle,i=n===null;this.device=e,this.gl=e.gl,this.handle=n||i?n:this.gl.createFramebuffer(),i||(e._setWebGLDebugMetadata(this.handle,this,{spector:this.props}),t.handle||(this.autoCreateAttachmentTextures(),this.updateAttachments()))}destroy(){super.destroy(),!this.destroyed&&this.handle!==null&&!this.props.handle&&this.gl.deleteFramebuffer(this.handle)}updateAttachments(){let e=this.gl.bindFramebuffer(36160,this.handle);for(let t=0;t<this.colorAttachments.length;++t){let n=this.colorAttachments[t];if(n){let i=36064+t;this._attachTextureView(i,n)}}if(this.depthStencilAttachment){let t=yw(this.depthStencilAttachment.props.format);this._attachTextureView(t,this.depthStencilAttachment)}if(this.device.props.debug){let t=this.gl.checkFramebufferStatus(36160);if(t!==36053)throw new Error(`Framebuffer ${aB(t)}`)}this.gl.bindFramebuffer(36160,e)}_attachTextureView(e,t){let{gl:n}=this.device,{texture:i}=t,o=t.props.baseMipLevel,s=t.props.baseArrayLayer;switch(n.bindTexture(i.glTarget,i.handle),i.glTarget){case 35866:case 32879:n.framebufferTextureLayer(36160,e,i.handle,o,s);break;case 34067:let a=sB(s);n.framebufferTexture2D(36160,e,a,i.handle,o);break;case 3553:n.framebufferTexture2D(36160,e,3553,i.handle,o);break;default:throw new Error("Illegal texture type")}n.bindTexture(i.glTarget,null)}resizeAttachments(e,t){if(this.handle===null){this.width=e,this.height=t;return}super.resizeAttachments(e,t)}}});var Tl,ww=_(()=>{I();Sl();Tl=class extends xo{device;handle=null;_framebuffer=null;get[Symbol.toStringTag](){return"WebGLCanvasContext"}constructor(e,t){super(t),this.device=e,this._setAutoCreatedCanvasId(`${this.device.id}-canvas`),this._configureDevice()}_configureDevice(){(this.drawingBufferWidth!==this._framebuffer?.width||this.drawingBufferHeight!==this._framebuffer?.height)&&this._framebuffer?.resize([this.drawingBufferWidth,this.drawingBufferHeight])}_getCurrentFramebuffer(){return this._framebuffer||=new Bt(this.device,{id:"canvas-context-framebuffer",handle:null,width:this.drawingBufferWidth,height:this.drawingBufferHeight}),this._framebuffer}}});var Ll,Ew=_(()=>{I();Ll=class extends vo{device;handle=null;context2d;get[Symbol.toStringTag](){return"WebGLPresentationContext"}constructor(e,t={}){super(t),this.device=e;let n=`${this[Symbol.toStringTag]}(${this.id})`;if(!this.device.getDefaultCanvasContext().offscreenCanvas)throw new Error(`${n}: WebGL PresentationContext requires the default CanvasContext canvas to be an OffscreenCanvas`);let o=this.canvas.getContext("2d");if(!o)throw new Error(`${n}: Failed to create 2d presentation context`);this.context2d=o,this._setAutoCreatedCanvasId(`${this.device.id}-presentation-canvas`),this._configureDevice(),this._startObservers()}present(){this._resizeDrawingBufferIfNeeded(),this.device.submit();let e=this.device.getDefaultCanvasContext(),[t,n]=e.getDrawingBufferSize();if(!(this.drawingBufferWidth===0||this.drawingBufferHeight===0||t===0||n===0||e.canvas.width===0||e.canvas.height===0)){if(t!==this.drawingBufferWidth||n!==this.drawingBufferHeight||e.canvas.width!==this.drawingBufferWidth||e.canvas.height!==this.drawingBufferHeight)throw new Error(`${this[Symbol.toStringTag]}(${this.id}): Default canvas context size ${t}x${n} does not match presentation size ${this.drawingBufferWidth}x${this.drawingBufferHeight}`);this.context2d.clearRect(0,0,this.drawingBufferWidth,this.drawingBufferHeight),this.context2d.drawImage(e.canvas,0,0)}}_configureDevice(){}_getCurrentFramebuffer(e){let t=this.device.getDefaultCanvasContext();return t.setDrawingBufferSize(this.drawingBufferWidth,this.drawingBufferHeight),t.getCurrentFramebuffer(e)}}});function Pw(r="id"){qp[r]=qp[r]||1;let e=qp[r]++;return`${r}-${e}`}var qp,Sw=_(()=>{qp={}});function cB(r){return r&D.INDEX?34963:r&D.VERTEX?34962:r&D.UNIFORM?35345:34962}function lB(r){return r&D.INDEX||r&D.VERTEX?35044:r&D.UNIFORM?35048:35044}var dt,Al=_(()=>{I();dt=class extends D{device;gl;handle;glTarget;glUsage;glIndexType=5123;byteLength=0;bytesUsed=0;constructor(e,t={}){super(e,t),this.device=e,this.gl=this.device.gl;let n=typeof t=="object"?t.handle:void 0;this.handle=n||this.gl.createBuffer(),e._setWebGLDebugMetadata(this.handle,this,{spector:{...this.props,data:typeof this.props.data}}),this.glTarget=cB(this.props.usage),this.glUsage=lB(this.props.usage),this.glIndexType=this.props.indexType==="uint32"?5125:5123,t.data?this._initWithData(t.data,t.byteOffset,t.byteLength):this._initWithByteLength(t.byteLength||0)}destroy(){!this.destroyed&&this.handle&&(this.removeStats(),this.props.handle?this.trackDeallocatedReferencedMemory("Buffer"):(this.trackDeallocatedMemory(),this.gl.deleteBuffer(this.handle)),this.destroyed=!0,this.handle=null)}_initWithData(e,t=0,n=e.byteLength+t){let i=this.glTarget;this.gl.bindBuffer(i,this.handle),this.gl.bufferData(i,n,this.glUsage),this.gl.bufferSubData(i,t,e),this.gl.bindBuffer(i,null),this.bytesUsed=n,this.byteLength=n,this._setDebugData(e,t,n),this.props.handle?this.trackReferencedMemory(n,"Buffer"):this.trackAllocatedMemory(n)}_initWithByteLength(e){let t=e;e===0&&(t=new Float32Array(0));let n=this.glTarget;return this.gl.bindBuffer(n,this.handle),this.gl.bufferData(n,t,this.glUsage),this.gl.bindBuffer(n,null),this.bytesUsed=e,this.byteLength=e,this._setDebugData(null,0,e),this.props.handle?this.trackReferencedMemory(e,"Buffer"):this.trackAllocatedMemory(e),this}write(e,t=0){let n=ArrayBuffer.isView(e)?e:new Uint8Array(e),i=0,o=void 0,s=36663;this.gl.bindBuffer(s,this.handle),i!==0||o!==void 0?this.gl.bufferSubData(s,t,n,i,o):this.gl.bufferSubData(s,t,n),this.gl.bindBuffer(s,null),this._setDebugData(e,t,e.byteLength)}async mapAndWriteAsync(e,t=0,n=this.byteLength-t){let i=new ArrayBuffer(n);await e(i,"copied"),this.write(i,t)}async readAsync(e=0,t){return this.readSyncWebGL(e,t)}async mapAndReadAsync(e,t=0,n){let i=await this.readAsync(t,n);return await e(i.buffer,"copied")}readSyncWebGL(e=0,t){t=t??this.byteLength-e;let n=new Uint8Array(t),i=0;return this.gl.bindBuffer(36662,this.handle),this.gl.getBufferSubData(36662,e,n,i,t),this.gl.bindBuffer(36662,null),this._setDebugData(n,e,t),n}}});function Tw(r){let e=r.split(/\r?\n/),t=[];for(let n of e){if(n.length<=1)continue;let i=n.trim(),o=n.split(":"),s=o[0]?.trim();if(o.length===2){let[h,p]=o;if(!h||!p){t.push({message:i,type:Cl(s||"info"),lineNum:0,linePos:0});continue}t.push({message:p.trim(),type:Cl(h),lineNum:0,linePos:0});continue}let[a,c,l,...u]=o;if(!a||!c||!l){t.push({message:o.slice(1).join(":").trim()||i,type:Cl(s||"info"),lineNum:0,linePos:0});continue}let f=parseInt(l,10);Number.isNaN(f)&&(f=0);let d=parseInt(c,10);Number.isNaN(d)&&(d=0),t.push({message:u.join(":").trim(),type:Cl(a),lineNum:f,linePos:d})}return t}function Cl(r){let e=["warning","error","info"],t=r.toLowerCase();return e.includes(t)?t:"info"}var Lw=_(()=>{});function uB(r){return r.split(/\r?\n/).find(e=>e.trim())?.trim()}var Ml,Aw=_(()=>{I();Lw();Ml=class extends $r{device;handle;_compilationInfoLog="";constructor(e,t){super(e,t),this.device=e;let n=this.props.handle;switch(this.props.stage){case"vertex":this.handle=n||this.device.gl.createShader(35633);break;case"fragment":this.handle=n||this.device.gl.createShader(35632);break;default:throw new Error(this.props.stage)}e._setWebGLDebugMetadata(this.handle,this,{spector:this.props});let i=this._compile(this.source);i&&typeof i.catch=="function"&&i.catch(()=>{this.compilationStatus="error"})}destroy(){this.handle&&(this.removeStats(),this.device.gl.deleteShader(this.handle),this.destroyed=!0,this.handle.destroyed=!0)}get asyncCompilationStatus(){return this._waitForCompilationComplete().then(()=>(this._getCompilationStatus(),this.compilationStatus))}async getCompilationInfo(){return await this._waitForCompilationComplete(),this.getCompilationInfoSync()}getCompilationInfoSync(){let e=this._getCompilationInfoLog();return e?Tw(e):[]}getTranslatedSource(){return this.device.getExtension("WEBGL_debug_shaders").WEBGL_debug_shaders?.getTranslatedShaderSource(this.handle)||null}_compile(e){e=e.startsWith("#version ")?e:`#version 300 es
${e}`;let{gl:t}=this.device;if(t.shaderSource(this.handle,e),t.compileShader(this.handle),!this.device.props.debug){this.compilationStatus="pending";return}if(!this.device.features.has("compilation-status-async-webgl")){if(this._getCompilationStatus(),this.debugShader(),this.compilationStatus==="error")throw new Error(this._getCompilationErrorMessage(e));return}return P.once(1,"Shader compilation is asynchronous")(),this._waitForCompilationComplete().then(()=>{P.info(2,`Shader ${this.id} - async compilation complete: ${this.compilationStatus}`)(),this._getCompilationStatus(),this.debugShader()})}async _waitForCompilationComplete(){let e=async i=>await new Promise(o=>setTimeout(o,i));if(!this.device.features.has("compilation-status-async-webgl")){await e(10);return}let{gl:n}=this.device;for(;;){if(n.getShaderParameter(this.handle,37297))return;await e(10)}}_getCompilationStatus(){this.compilationStatus=this.device.gl.getShaderParameter(this.handle,35713)?"success":"error",this.compilationStatus==="error"&&this._getCompilationInfoLog()}_getCompilationErrorMessage(e){let t=`${this.props.stage} shader ${this.props.id}`,n=uB(this._getCompilationInfoLog()),i=this.getCompilationInfoSync(),o=i.find(u=>u.type==="error"&&u.message.trim())||i.find(u=>u.message.trim())||i.find(u=>u.type==="error")||i[0];if(!o)return n?`GLSL compilation errors in ${t}: ${n}`:`GLSL compilation errors in ${t}: WebGL did not provide a shader compiler log`;let s=o.lineNum?e.split(/\r?\n/)[o.lineNum-1]?.trim():void 0,a=o.lineNum?` line ${o.lineNum}`:"",c=s?`
Source: ${s}`:"",l=o.message.trim()||n||"WebGL did not provide a shader compiler log";return`GLSL compilation errors in ${t}:${a}: ${l}${c}`}_getCompilationInfoLog(){let e=this.device.gl.getShaderInfoLog(this.handle)?.trim();return e&&(this._compilationInfoLog=e),this._compilationInfoLog}}});function Mw(r,e,t,n){if(pB(e))return n(r);let i=r;i.pushState();try{return fB(r,e),lt(i.gl,t),n(r)}finally{i.popState()}}function fB(r,e){let t=r,{gl:n}=t;if(e.cullMode)switch(e.cullMode){case"none":n.disable(2884);break;case"front":n.enable(2884),n.cullFace(1028);break;case"back":n.enable(2884),n.cullFace(1029);break}if(e.frontFace&&n.frontFace(En("frontFace",e.frontFace,{ccw:2305,cw:2304})),e.unclippedDepth&&r.features.has("depth-clip-control")&&n.enable(34383),e.depthBias!==void 0&&(n.enable(32823),n.polygonOffset(e.depthBias,e.depthBiasSlopeScale||0)),e.provokingVertex&&r.features.has("provoking-vertex-webgl")){let o=t.getExtension("WEBGL_provoking_vertex").WEBGL_provoking_vertex,s=En("provokingVertex",e.provokingVertex,{first:36429,last:36430});o?.provokingVertexWEBGL(s)}if((e.polygonMode||e.polygonOffsetLine)&&r.features.has("polygon-mode-webgl")){if(e.polygonMode){let o=t.getExtension("WEBGL_polygon_mode").WEBGL_polygon_mode,s=En("polygonMode",e.polygonMode,{fill:6914,line:6913});o?.polygonModeWEBGL(1028,s),o?.polygonModeWEBGL(1029,s)}e.polygonOffsetLine&&n.enable(10754)}if(r.features.has("shader-clip-cull-distance-webgl")&&(e.clipDistance0&&n.enable(12288),e.clipDistance1&&n.enable(12289),e.clipDistance2&&n.enable(12290),e.clipDistance3&&n.enable(12291),e.clipDistance4&&n.enable(12292),e.clipDistance5&&n.enable(12293),e.clipDistance6&&n.enable(12294),e.clipDistance7&&n.enable(12295)),e.depthWriteEnabled!==void 0&&n.depthMask(hB("depthWriteEnabled",e.depthWriteEnabled)),e.depthCompare&&(e.depthCompare!=="always"?n.enable(2929):n.disable(2929),n.depthFunc(Il("depthCompare",e.depthCompare))),e.clearDepth!==void 0&&n.clearDepth(e.clearDepth),e.stencilWriteMask){let i=e.stencilWriteMask;n.stencilMaskSeparate(1028,i),n.stencilMaskSeparate(1029,i)}if(e.stencilReadMask&&P.warn("stencilReadMask not supported under WebGL"),e.stencilCompare){let i=e.stencilReadMask||4294967295,o=Il("depthCompare",e.stencilCompare);e.stencilCompare!=="always"?n.enable(2960):n.disable(2960),n.stencilFuncSeparate(1028,o,0,i),n.stencilFuncSeparate(1029,o,0,i)}if(e.stencilPassOperation&&e.stencilFailOperation&&e.stencilDepthFailOperation){let i=Zp("stencilPassOperation",e.stencilPassOperation),o=Zp("stencilFailOperation",e.stencilFailOperation),s=Zp("stencilDepthFailOperation",e.stencilDepthFailOperation);n.stencilOpSeparate(1028,o,s,i),n.stencilOpSeparate(1029,o,s,i)}switch(e.blend){case!0:n.enable(3042);break;case!1:n.disable(3042);break;default:}if(e.blendColorOperation||e.blendAlphaOperation){let i=Cw("blendColorOperation",e.blendColorOperation||"add"),o=Cw("blendAlphaOperation",e.blendAlphaOperation||"add");n.blendEquationSeparate(i,o);let s=Rl("blendColorSrcFactor",e.blendColorSrcFactor||"one"),a=Rl("blendColorDstFactor",e.blendColorDstFactor||"zero"),c=Rl("blendAlphaSrcFactor",e.blendAlphaSrcFactor||"one"),l=Rl("blendAlphaDstFactor",e.blendAlphaDstFactor||"zero");n.blendFuncSeparate(s,a,c,l)}}function Il(r,e){return En(r,e,{never:512,less:513,equal:514,"less-equal":515,greater:516,"not-equal":517,"greater-equal":518,always:519})}function Zp(r,e){return En(r,e,{keep:7680,zero:0,replace:7681,invert:5386,"increment-clamp":7682,"decrement-clamp":7683,"increment-wrap":34055,"decrement-wrap":34056})}function Cw(r,e){return En(r,e,{add:32774,subtract:32778,"reverse-subtract":32779,min:32775,max:32776})}function Rl(r,e,t="color"){return En(r,e,{one:1,zero:0,src:768,"one-minus-src":769,dst:774,"one-minus-dst":775,"src-alpha":770,"one-minus-src-alpha":771,"dst-alpha":772,"one-minus-dst-alpha":773,"src-alpha-saturated":776,constant:t==="color"?32769:32771,"one-minus-constant":t==="color"?32770:32772,src1:768,"one-minus-src1":769,"src1-alpha":770,"one-minus-src1-alpha":771})}function dB(r,e){return`Illegal parameter ${e} for ${r}`}function En(r,e,t){if(!(e in t))throw new Error(dB(r,e));return t[e]}function hB(r,e){return e}function pB(r){let e=!0;for(let t in r){e=!1;break}return e}var Xp=_(()=>{I();Pi()});function Ol(r){let e={};return r.addressModeU&&(e[10242]=Kp(r.addressModeU)),r.addressModeV&&(e[10243]=Kp(r.addressModeV)),r.addressModeW&&(e[32882]=Kp(r.addressModeW)),r.magFilter&&(e[10240]=Qp(r.magFilter)),(r.minFilter||r.mipmapFilter)&&(e[10241]=mB(r.minFilter||"linear",r.mipmapFilter)),r.lodMinClamp!==void 0&&(e[33082]=r.lodMinClamp),r.lodMaxClamp!==void 0&&(e[33083]=r.lodMaxClamp),r.type==="comparison-sampler"&&(e[34892]=34894),r.compare&&(e[34893]=Il("compare",r.compare)),r.maxAnisotropy&&(e[34046]=r.maxAnisotropy),e}function Kp(r){switch(r){case"clamp-to-edge":return 33071;case"repeat":return 10497;case"mirror-repeat":return 33648}}function Qp(r){switch(r){case"nearest":return 9728;case"linear":return 9729}}function mB(r,e="none"){if(!e)return Qp(r);switch(e){case"none":return Qp(r);case"nearest":switch(r){case"nearest":return 9984;case"linear":return 9985}break;case"linear":switch(r){case"nearest":return 9986;case"linear":return 9987}}}var Jp=_(()=>{Xp()});var Bl,Rw=_(()=>{I();Jp();Bl=class extends Gr{device;handle;parameters;constructor(e,t){super(e,t),this.device=e,this.parameters=Ol(t),this.handle=t.handle||this.device.gl.createSampler(),this._setSamplerParameters(this.parameters)}destroy(){this.handle&&(this.device.gl.deleteSampler(this.handle),this.handle=void 0)}toString(){return`Sampler(${this.id},${JSON.stringify(this.props)})`}_setSamplerParameters(e){for(let[t,n]of Object.entries(e)){let i=Number(t);switch(i){case 33082:case 33083:this.device.gl.samplerParameterf(this.handle,i,n);break;default:this.device.gl.samplerParameteri(this.handle,i,n);break}}}}});function ht(r,e,t){if(gB(e))return t(r);let{nocatch:n=!0}=e,i=ut.get(r);i.push(),lt(r,e);let o;if(n)o=t(r),i.pop();else try{o=t(r)}finally{i.pop()}return o}function gB(r){for(let e in r)return!1;return!0}var Dl=_(()=>{Pi();Gp()});var Dt,em=_(()=>{I();Dt=class extends zr{device;gl;handle;texture;constructor(e,t){super(e,{...z.defaultProps,...t}),this.device=e,this.gl=this.device.gl,this.handle=null,this.texture=t.texture}}});function kl(r){return _B[r]}var _B,tm=_(()=>{_B={5124:"sint32",5125:"uint32",5122:"sint16",5123:"uint16",5120:"sint8",5121:"uint8",5126:"float32",5131:"float16",33635:"uint16",32819:"uint16",32820:"uint16",33640:"uint32",35899:"uint32",35902:"uint32",34042:"uint32",36269:"uint32"}});function yB(r,e=0){return e?new r.constructor(r.buffer,r.byteOffset+e,(r.byteLength-e)/r.BYTES_PER_ELEMENT):r}function bB(r,e){if(e%r.BYTES_PER_ELEMENT!==0)throw new Error(`Texture byteOffset ${e} must align to typed array element size ${r.BYTES_PER_ELEMENT}`);return e/r.BYTES_PER_ELEMENT}function xB(r){switch(r){case"1d":break;case"2d":return 3553;case"3d":return 32879;case"cube":return 34067;case"2d-array":return 35866;case"cube-array":break}throw new Error(r)}function Os(r,e,t){return e==="cube"?34069+t:r}var kt,Nl=_(()=>{I();Li();Jp();Dl();em();tm();kt=class extends z{device;gl;handle;sampler=void 0;view;glTarget;glFormat;glType;glInternalFormat;compressed;_textureUnit=0;_framebuffer=null;_framebufferAttachmentKey=null;constructor(e,t){super(e,t,{byteAlignment:1}),this.device=e,this.gl=this.device.gl;let n=wl(this.props.format);if(this.glTarget=xB(this.props.dimension),this.glInternalFormat=n.internalFormat,this.glFormat=n.format,this.glType=n.type,this.compressed=n.compressed,this.isHandleBorrowed&&this.props.handle===void 0)throw new Error("Borrowed WebGL textures require a texture handle");if(this.handle=this.props.handle||this.gl.createTexture(),this.device._setWebGLDebugMetadata(this.handle,this,{spector:this.props}),!this.isHandleBorrowed){this.gl.bindTexture(this.glTarget,this.handle);let{dimension:i,width:o,height:s,depth:a,mipLevels:c,glTarget:l,glInternalFormat:u}=this;if(!this.compressed)switch(i){case"2d":case"cube":this.gl.texStorage2D(l,c,u,o,s);break;case"2d-array":case"3d":this.gl.texStorage3D(l,c,u,o,s,a);break;default:throw new Error(i)}this.gl.bindTexture(this.glTarget,null),this._initializeData(t.data)}this.ownsHandle?this.trackAllocatedMemory(this.getAllocatedByteLength(),"Texture"):this.trackReferencedMemory(this.getAllocatedByteLength(),"Texture"),this.isHandleBorrowed||this.setSampler(this.props.sampler),this.view=new Dt(this.device,{...this.props,texture:this}),Object.seal(this)}destroy(){this.handle&&(this._framebuffer?.destroy(),this._framebuffer=null,this._framebufferAttachmentKey=null,this.removeStats(),this.ownsHandle?(this.gl.deleteTexture(this.handle),this.trackDeallocatedMemory("Texture")):this.trackDeallocatedReferencedMemory("Texture"),this.destroyed=!0)}createView(e){return new Dt(this.device,{...e,texture:this})}clone(e){if(this.isHandleBorrowed&&e&&(e.width!==this.width||e.height!==this.height))throw new Error(`Cannot resize borrowed read-only ${this}`);return super.clone(e)}setSampler(e={}){this._assertWritable("set sampler parameters on"),super.setSampler(e);let t=Ol(this.sampler.props);this._setSamplerParameters(t)}copyExternalImage(e){this._assertWritable("copy external image data into");let t=this._normalizeCopyExternalImageOptions(e);if(t.sourceX||t.sourceY)throw new Error("WebGL does not support sourceX/sourceY)");let{glFormat:n,glType:i}=this,{image:o,depth:s,mipLevel:a,x:c,y:l,z:u,width:f,height:d}=t,h=Os(this.glTarget,this.dimension,u),p=t.flipY?{37440:!0}:{};return this.gl.bindTexture(this.glTarget,this.handle),ht(this.gl,p,()=>{switch(this.dimension){case"2d":case"cube":this.gl.texSubImage2D(h,a,c,l,f,d,n,i,o);break;case"2d-array":case"3d":this.gl.texSubImage3D(h,a,c,l,u,f,d,s,n,i,o);break;default:}}),this.gl.bindTexture(this.glTarget,null),{width:t.width,height:t.height}}copyElementImage(e){this._assertWritable("copy element image data into");let t=this._normalizeCopyElementImageOptions(e),{glFormat:n}=this,{element:i,depth:o,mipLevel:s,sourceX:a,sourceY:c,sourceWidth:l,sourceHeight:u,x:f,y:d,z:h,width:p,height:m}=t,g=Os(this.glTarget,this.dimension,h),b=t.flipY?{37440:!0}:{},y=this.gl;if(o!==1||this.dimension!=="2d"&&this.dimension!=="cube")throw new Error(`${this} copyElementImage only supports 2d and cube textures on WebGL`);if(s!==0||f!==0||d!==0)throw new Error(`${this} copyElementImage only supports full base-level uploads on WebGL`);if(typeof y.texElementImage2D!="function")throw new Error(`${this} copyElementImage is not supported by this WebGL implementation`);return this.gl.bindTexture(this.glTarget,this.handle),ht(this.gl,b,()=>{y.texElementImage2D?.(g,n,i,{sx:a,sy:c,swidth:l??p,sheight:u??m,width:p,height:m})}),this.gl.bindTexture(this.glTarget,null),{width:t.width,height:t.height}}copyImageData(e){super.copyImageData(e)}readBuffer(e={},t){if(!t)throw new Error(`${this} readBuffer requires a destination buffer`);let n=this._getSupportedColorReadOptions(e),i=e.byteOffset??0,o=this.computeMemoryLayout(n);if(t.byteLength<i+o.byteLength)throw new Error(`${this} readBuffer target is too small (${t.byteLength} < ${i+o.byteLength})`);let s=t;this.gl.bindBuffer(35051,s.handle);try{this._readColorTextureLayers(n,o,a=>{this.gl.readPixels(n.x,n.y,n.width,n.height,this.glFormat,this.glType,i+a)})}finally{this.gl.bindBuffer(35051,null)}return t}async readDataAsync(e={}){throw new Error(`${this} readDataAsync is deprecated; use readBuffer() with an explicit destination buffer or DynamicTexture.readAsync()`)}writeBuffer(e,t={}){this._assertWritable("write buffer data into");let n=this._normalizeTextureWriteOptions(t),{width:i,height:o,depthOrArrayLayers:s,mipLevel:a,byteOffset:c,x:l,y:u,z:f}=n,{glFormat:d,glType:h,compressed:p}=this,m=Os(this.glTarget,this.dimension,f);if(p)throw new Error("writeBuffer for compressed textures is not implemented in WebGL");let{bytesPerPixel:g}=this.device.getTextureFormatInfo(this.format),b=g?n.bytesPerRow/g:void 0,y={3317:this.byteAlignment,...b!==void 0?{3314:b}:{},32878:n.rowsPerImage};this.gl.bindTexture(this.glTarget,this.handle),this.gl.bindBuffer(35052,e.handle),ht(this.gl,y,()=>{switch(this.dimension){case"2d":case"cube":this.gl.texSubImage2D(m,a,l,u,i,o,d,h,c);break;case"2d-array":case"3d":this.gl.texSubImage3D(m,a,l,u,f,i,o,s,d,h,c);break;default:}}),this.gl.bindBuffer(35052,null),this.gl.bindTexture(this.glTarget,null)}writeData(e,t={}){this._assertWritable("write data into");let n=this._normalizeTextureWriteOptions(t),i=ArrayBuffer.isView(e)?e:new Uint8Array(e),{width:o,height:s,depthOrArrayLayers:a,mipLevel:c,x:l,y:u,z:f,byteOffset:d}=n,{glFormat:h,glType:p,compressed:m}=this,g=Os(this.glTarget,this.dimension,f),b;if(!m){let{bytesPerPixel:T}=this.device.getTextureFormatInfo(this.format);T&&(b=n.bytesPerRow/T)}let y=this.compressed?{}:{3317:this.byteAlignment,...b!==void 0?{3314:b}:{},32878:n.rowsPerImage},x=bB(i,d),v=m?yB(i,d):i,w=this._getMipLevelSize(c),E=l===0&&u===0&&f===0&&o===w.width&&s===w.height&&a===w.depthOrArrayLayers;this.gl.bindTexture(this.glTarget,this.handle),this.gl.bindBuffer(35052,null),ht(this.gl,y,()=>{switch(this.dimension){case"2d":case"cube":m?E?this.gl.compressedTexImage2D(g,c,h,o,s,0,v):this.gl.compressedTexSubImage2D(g,c,l,u,o,s,h,v):this.gl.texSubImage2D(g,c,l,u,o,s,h,p,i,x);break;case"2d-array":case"3d":m?E?this.gl.compressedTexImage3D(g,c,h,o,s,a,0,v):this.gl.compressedTexSubImage3D(g,c,l,u,f,o,s,a,h,v):this.gl.texSubImage3D(g,c,l,u,f,o,s,a,h,p,i,x);break;default:}}),this.gl.bindTexture(this.glTarget,null)}_getRowByteAlignment(e,t){return 1}_getFramebuffer(){return this._framebuffer||=this.device.createFramebuffer({id:`framebuffer-for-${this.id}`,width:this.width,height:this.height,colorAttachments:[this]}),this._framebuffer}readDataSyncWebGL(e={}){let t=this._getSupportedColorReadOptions(e),n=this.computeMemoryLayout(t),i=kl(this.glType),o=Ur(i),s=new o(n.byteLength/o.BYTES_PER_ELEMENT);return this._readColorTextureLayers(t,n,a=>{let c=new o(s.buffer,s.byteOffset+a,n.bytesPerImage/o.BYTES_PER_ELEMENT);this.gl.readPixels(t.x,t.y,t.width,t.height,this.glFormat,this.glType,c)}),s.buffer}_readColorTextureLayers(e,t,n){let i=this._getFramebuffer(),o=t.bytesPerRow/t.bytesPerPixel,s={3333:this.byteAlignment,...o!==e.width?{3330:o}:{}},a=this.gl.getParameter(3074),c=this.gl.bindFramebuffer(36160,i.handle);try{this.gl.readBuffer(36064),ht(this.gl,s,()=>{for(let l=0;l<e.depthOrArrayLayers;l++)this._attachReadSubresource(i,e.mipLevel,e.z+l),n(l*t.bytesPerImage)})}finally{this.gl.bindFramebuffer(36160,c||null),this.gl.readBuffer(a)}}_attachReadSubresource(e,t,n){let i=`${t}:${n}`;if(this._framebufferAttachmentKey!==i){switch(this.dimension){case"2d":this.gl.framebufferTexture2D(36160,36064,3553,this.handle,t);break;case"cube":this.gl.framebufferTexture2D(36160,36064,Os(this.glTarget,this.dimension,n),this.handle,t);break;case"2d-array":case"3d":this.gl.framebufferTextureLayer(36160,36064,this.handle,t,n);break;default:throw new Error(`${this} color readback does not support ${this.dimension} textures`)}if(this.device.props.debug){let o=Number(this.gl.checkFramebufferStatus(36160));if(o!==36053)throw new Error(`${e} incomplete for ${this} readback (${o})`)}this._framebufferAttachmentKey=i}}generateMipmapsWebGL(e){if(this._assertWritable("generate mipmaps for"),!(!(this.device.isTextureFormatRenderable(this.props.format)&&this.device.isTextureFormatFilterable(this.props.format))&&(P.warn(`${this} is not renderable or filterable, may not be able to generate mipmaps`)(),!e?.force)))try{this.gl.bindTexture(this.glTarget,this.handle),this.gl.generateMipmap(this.glTarget)}catch(n){P.warn(`Error generating mipmap for ${this}: ${n.message}`)()}finally{this.gl.bindTexture(this.glTarget,null)}}_setSamplerParameters(e){P.log(2,`${this.id} sampler parameters`,this.device.getGLKeys(e))(),this.gl.bindTexture(this.glTarget,this.handle);for(let[t,n]of Object.entries(e)){let i=Number(t),o=n;switch(i){case 33082:case 33083:this.gl.texParameterf(this.glTarget,i,o);break;case 10240:case 10241:this.gl.texParameteri(this.glTarget,i,o);break;case 10242:case 10243:case 32882:this.gl.texParameteri(this.glTarget,i,o);break;case 34046:this.device.features.has("texture-filterable-anisotropic-webgl")&&this.gl.texParameteri(this.glTarget,i,o);break;case 34892:case 34893:this.gl.texParameteri(this.glTarget,i,o);break}}this.gl.bindTexture(this.glTarget,null)}_getActiveUnit(){return this.gl.getParameter(34016)-33984}_bind(e){let{gl:t}=this;return e!==void 0&&(this._textureUnit=e,t.activeTexture(33984+e)),t.bindTexture(this.glTarget,this.handle),e}_unbind(e){let{gl:t}=this;return e!==void 0&&(this._textureUnit=e,t.activeTexture(33984+e)),t.bindTexture(this.glTarget,null),e}_assertWritable(e){if(this.isHandleBorrowed)throw new Error(`Cannot ${e} borrowed read-only ${this}`)}}});function Iw(r,e,t,n){let i=r,o=n;o===!0&&(o=1),o===!1&&(o=0);let s=typeof o=="number"?[o]:o;switch(t){case 35678:case 35680:case 35679:case 35682:case 36289:case 36292:case 36293:case 36298:case 36299:case 36300:case 36303:case 36306:case 36307:case 36308:case 36311:if(typeof n!="number")throw new Error("samplers must be set to integers");return r.uniform1i(e,n);case 5126:return r.uniform1fv(e,s);case 35664:return r.uniform2fv(e,s);case 35665:return r.uniform3fv(e,s);case 35666:return r.uniform4fv(e,s);case 5124:return r.uniform1iv(e,s);case 35667:return r.uniform2iv(e,s);case 35668:return r.uniform3iv(e,s);case 35669:return r.uniform4iv(e,s);case 35670:return r.uniform1iv(e,s);case 35671:return r.uniform2iv(e,s);case 35672:return r.uniform3iv(e,s);case 35673:return r.uniform4iv(e,s);case 5125:return i.uniform1uiv(e,s,1);case 36294:return i.uniform2uiv(e,s,2);case 36295:return i.uniform3uiv(e,s,3);case 36296:return i.uniform4uiv(e,s,4);case 35674:return r.uniformMatrix2fv(e,!1,s);case 35675:return r.uniformMatrix3fv(e,!1,s);case 35676:return r.uniformMatrix4fv(e,!1,s);case 35685:return i.uniformMatrix2x3fv(e,!1,s);case 35686:return i.uniformMatrix2x4fv(e,!1,s);case 35687:return i.uniformMatrix3x2fv(e,!1,s);case 35688:return i.uniformMatrix3x4fv(e,!1,s);case 35689:return i.uniformMatrix4x2fv(e,!1,s);case 35690:return i.uniformMatrix4x3fv(e,!1,s)}throw new Error("Illegal uniform")}var Ow=_(()=>{});function Bw(r){return wB[r]}function Fl(r){return vB[r]}function Ul(r){return!!kw[r]}function Dw(r){return kw[r]}var vB,kw,wB,Gl=_(()=>{vB={5126:"f32",35664:"vec2<f32>",35665:"vec3<f32>",35666:"vec4<f32>",5124:"i32",35667:"vec2<i32>",35668:"vec3<i32>",35669:"vec4<i32>",5125:"u32",36294:"vec2<u32>",36295:"vec3<u32>",36296:"vec4<u32>",35670:"f32",35671:"vec2<f32>",35672:"vec3<f32>",35673:"vec4<f32>",35674:"mat2x2<f32>",35685:"mat2x3<f32>",35686:"mat2x4<f32>",35687:"mat3x2<f32>",35675:"mat3x3<f32>",35688:"mat3x4<f32>",35689:"mat4x2<f32>",35690:"mat4x3<f32>",35676:"mat4x4<f32>"},kw={35678:{viewDimension:"2d",sampleType:"float"},35680:{viewDimension:"cube",sampleType:"float"},35679:{viewDimension:"3d",sampleType:"float"},35682:{viewDimension:"3d",sampleType:"depth"},36289:{viewDimension:"2d-array",sampleType:"float"},36292:{viewDimension:"2d-array",sampleType:"depth"},36293:{viewDimension:"cube",sampleType:"float"},36298:{viewDimension:"2d",sampleType:"sint"},36299:{viewDimension:"3d",sampleType:"sint"},36300:{viewDimension:"cube",sampleType:"sint"},36303:{viewDimension:"2d-array",sampleType:"uint"},36306:{viewDimension:"2d",sampleType:"uint"},36307:{viewDimension:"3d",sampleType:"uint"},36308:{viewDimension:"cube",sampleType:"uint"},36311:{viewDimension:"2d-array",sampleType:"uint"}},wB={uint8:5121,sint8:5120,unorm8:5121,snorm8:5120,uint16:5123,sint16:5122,unorm16:5123,snorm16:5122,uint32:5125,sint32:5124,float16:5131,float32:5126}});function Fw(r,e,t={}){let n={attributes:[],bindings:[]};n.attributes=EB(r,e);let i=TB(r,e,t);for(let c of i){let l=c.uniforms.map(u=>({name:u.name,format:u.format,byteOffset:u.byteOffset,byteStride:u.byteStride,arrayLength:u.arrayLength}));n.bindings.push({type:"uniform",name:c.name,group:0,location:c.location,visibility:(c.vertex?1:0)|(c.fragment?2:0),minBindingSize:c.byteLength,uniforms:l})}let o=SB(r,e),s=0;for(let c of o)if(Ul(c.type)){let{viewDimension:l,sampleType:u}=Dw(c.type);n.bindings.push({type:"texture",name:c.name,group:0,location:s,viewDimension:l,sampleType:u}),c.textureUnit=s,s+=1}o.length&&(n.uniforms=o);let a=PB(r,e);return a?.length&&(n.varyings=a),n}function EB(r,e){let t=[],n=r.getProgramParameter(e,35721);for(let i=0;i<n;i++){let o=r.getActiveAttrib(e,i);if(!o)throw new Error("activeInfo");let{name:s,type:a}=o,c=r.getAttribLocation(e,s);if(c>=0){let l=Fl(a),u=/instance/i.test(s)?"instance":"vertex";t.push({name:s,location:c,stepMode:u,type:l})}}return t.sort((i,o)=>i.location-o.location),t}function PB(r,e){let t=[],n=r.getProgramParameter(e,35971);for(let i=0;i<n;i++){let o=r.getTransformFeedbackVarying(e,i);if(!o)throw new Error("activeInfo");let{name:s,type:a,size:c}=o,l=Fl(a),{type:u,components:f}=jn(l);t.push({location:i,name:s,type:u,size:c*f})}return t.sort((i,o)=>i.location-o.location),t}function SB(r,e){let t=[],n=r.getProgramParameter(e,35718);for(let i=0;i<n;i++){let o=r.getActiveUniform(e,i);if(!o)throw new Error("activeInfo");let{name:s,size:a,type:c}=o,{name:l,isArray:u}=OB(s),f=r.getUniformLocation(e,l),d={location:f,name:l,size:a,type:c,isArray:u};if(t.push(d),d.size>1)for(let h=0;h<d.size;h++){let p=`${l}[${h}]`;f=r.getUniformLocation(e,p);let m={...d,name:p,location:f};t.push(m)}}return t}function TB(r,e,t){let n=[],i=AB(r,e,t);for(let[s,a]of i){n.push(a);try{let c=Nw(r,e,s,a.name);LB(c,a)}catch(c){let l=c instanceof Error?c.message:String(c);P.once(0,`WebGL uniform block reflection failed for "${a.name}"; using supplied std140 metadata. ${l}`)()}}let o=r.getProgramParameter(e,35382);if(!Number.isInteger(o)||o<0)throw new Error(`Failed to reflect WebGL uniform blocks: ACTIVE_UNIFORM_BLOCKS returned ${String(o)}`);for(let s=0;s<o;s++)i.has(s)||n.push(Nw(r,e,s));return n.sort((s,a)=>s.location-a.location),n}function LB(r,e){for(let t of r.uniforms){let n=e.uniforms.find(i=>t.name===i.name||t.name.endsWith(`.${i.name}`));if(!n)throw new Error(`Failed to validate WebGL uniform block "${e.name}": reflected unexpected member "${t.name}"`);if(t.format!==n.format||t.arrayLength!==n.arrayLength||t.byteOffset!==n.byteOffset||t.byteStride!==n.byteStride)throw new Error(`Failed to validate WebGL uniform block "${e.name}": reflected layout for "${t.name}" does not match supplied std140 metadata`)}}function AB(r,e,t){let n=new Map;for(let o of t.uniformBlockLayouts||[])n.set(o.name,MB(o));for(let o of t.shaderLayout?.bindings||[])IB(o)&&n.set(o.name,o);let i=new Map;for(let o of n.values()){let s=CB(r,e,o.name);if(!s)continue;let{blockIndex:a,blockName:c}=s;if(i.has(a))throw new Error(`Multiple supplied uniform block layouts resolve to active WebGL block "${c}"`);i.set(a,{name:c,location:a,byteLength:o.minBindingSize,vertex:!!(o.visibility&&o.visibility&1),fragment:!!(o.visibility&&o.visibility&2),uniformCount:o.uniforms.length,uniforms:o.uniforms.map(l=>({...l}))})}return i}function CB(r,e,t){let n=t.endsWith("Uniforms")?[t,t.slice(0,-8)]:[t,`${t}Uniforms`];for(let i of n){let o=r.getUniformBlockIndex(e,i);if(o!==4294967295){if(!Number.isInteger(o)||o<0)throw new Error(`Failed to resolve WebGL uniform block "${i}": getUniformBlockIndex returned ${String(o)}`);return{blockIndex:o,blockName:i}}}return null}function Nw(r,e,t,n){let i=n||r.getActiveUniformBlockName(e,t);if(!i)throw new Error(`Failed to reflect WebGL uniform block at index ${t}: missing block name`);let o=(x,v)=>{let w=r.getActiveUniformBlockParameter(e,t,x);if(w==null)throw new Error(`Failed to reflect WebGL uniform block "${i}": ${v} returned null`);return w},s=Pn(o(35391,"UNIFORM_BLOCK_BINDING"),i,"UNIFORM_BLOCK_BINDING",0),a=Pn(o(35392,"UNIFORM_BLOCK_DATA_SIZE"),i,"UNIFORM_BLOCK_DATA_SIZE",0),c=Pn(o(35394,"UNIFORM_BLOCK_ACTIVE_UNIFORMS"),i,"UNIFORM_BLOCK_ACTIVE_UNIFORMS",0),l=Uw(o(35395,"UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES"),i,"UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES",c),u=Bs(r,e,l,35383,"UNIFORM_TYPE",i,c),f=Bs(r,e,l,35384,"UNIFORM_SIZE",i,c),d=Bs(r,e,l,35386,"UNIFORM_BLOCK_INDEX",i,c),h=Bs(r,e,l,35387,"UNIFORM_OFFSET",i,c),p=Bs(r,e,l,35388,"UNIFORM_ARRAY_STRIDE",i,c),m=[];for(let x=0;x<c;x++){if(d[x]!==t)throw new Error(`Failed to reflect WebGL uniform block "${i}": active uniform index ${l[x]} belongs to block ${d[x]}, expected ${t}`);let v=l[x],w=r.getActiveUniform(e,v);if(!w)throw new Error(`Failed to reflect WebGL uniform block "${i}": getActiveUniform(${v}) returned null`);let E=Pn(u[x],i,`UNIFORM_TYPE[${x}]`,1),T=Pn(f[x],i,`UNIFORM_SIZE[${x}]`,1),L=Pn(h[x],i,`UNIFORM_OFFSET[${x}]`,0),C=Pn(p[x],i,`UNIFORM_ARRAY_STRIDE[${x}]`,0);if(w.type!==E||w.size!==T)throw new Error(`Failed to reflect WebGL uniform block "${i}": getActiveUniform(${v}) disagrees with getActiveUniforms`);m.push({name:w.name,format:Fl(E),arrayLength:T,byteOffset:L,byteStride:C})}let g={name:i,location:s,byteLength:a,vertex:!!o(35396,"UNIFORM_BLOCK_REFERENCED_BY_VERTEX_SHADER"),fragment:!!o(35398,"UNIFORM_BLOCK_REFERENCED_BY_FRAGMENT_SHADER"),uniformCount:c,uniforms:m},b=new Set(g.uniforms.map(x=>x.name.split(".")[0]).filter(x=>!!x)),y=g.name.replace(/Uniforms$/,"");if(b.size===1&&!b.has(g.name)&&!b.has(y)){let[x]=b;P.warn(`Uniform block "${g.name}" uses GLSL instance "${x}". luma.gl binds uniform buffers by block name ("${g.name}") and alias ("${y}"). Prefer matching the instance name to one of those to avoid confusing silent mismatches.`)()}return g}function Bs(r,e,t,n,i,o,s){let a=r.getActiveUniforms(e,t,n);if(a===null)throw new Error(`Failed to reflect WebGL uniform block "${o}": ${i} returned null`);return Uw(a,o,i,s)}function Uw(r,e,t,n){if(!Array.isArray(r)&&!ArrayBuffer.isView(r))throw new Error(`Failed to reflect WebGL uniform block "${e}": ${t} returned a non-array value`);let i=Array.from(r);if(i.length!==n||i.some(o=>!Number.isInteger(o)))throw new Error(`Failed to reflect WebGL uniform block "${e}": ${t} returned ${i.length} invalid values, expected ${n}`);return i}function Pn(r,e,t,n){if(!Number.isInteger(r)||r<n)throw new Error(`Failed to reflect WebGL uniform block "${e}": ${t} returned ${String(r)}`);return r}function MB(r){let e=Yr(r.uniformTypes,{layout:"std140"}),t=RB(r.uniformTypes,e.fields);return{type:"uniform",name:r.name,group:0,location:0,minBindingSize:e.byteLength,uniforms:t}}function RB(r,e){let t=[],n=(o,s)=>{if(typeof s=="string"){let a=e[o];if(!a)throw new Error(`Missing std140 layout field ${o}`);t.push({name:o,format:a.shaderType,arrayLength:1,byteOffset:a.offset*4,byteStride:0});return}if(Array.isArray(s)){i(o,s[0],s[1]);return}for(let[a,c]of Object.entries(s))n(`${o}.${a}`,c)},i=(o,s,a)=>{if(typeof s=="string"){let c=e[`${o}[0]`],l=a>1?e[`${o}[1]`]:void 0;if(!c)throw new Error(`Missing std140 array layout field ${o}[0]`);t.push({name:`${o}[0]`,format:c.shaderType,arrayLength:a,byteOffset:c.offset*4,byteStride:l?(l.offset-c.offset)*4:0});return}if(Array.isArray(s))throw new Error(`Nested uniform arrays are not supported for ${o}`);for(let[c,l]of Object.entries(s)){if(typeof l!="string")throw new Error(`Composite uniform array members are not supported for ${o}`);let u=`${o}[0].${c}`,f=`${o}[1].${c}`,d=e[u],h=a>1?e[f]:void 0;if(!d)throw new Error(`Missing std140 array layout field ${u}`);t.push({name:u,format:d.shaderType,arrayLength:a,byteOffset:d.offset*4,byteStride:h?(h.offset-d.offset)*4:0})}};for(let[o,s]of Object.entries(r))n(o,s);return t}function IB(r){return r.type==="uniform"&&Number.isInteger(r.minBindingSize)&&r.minBindingSize>=0&&Array.isArray(r.uniforms)&&r.uniforms.every(e=>typeof e.name=="string"&&typeof e.format=="string"&&Number.isInteger(e.arrayLength)&&e.arrayLength>0&&Number.isInteger(e.byteOffset)&&e.byteOffset>=0&&Number.isInteger(e.byteStride)&&e.byteStride>=0)}function OB(r){if(r[r.length-1]!=="]")return{name:r,length:1,isArray:!1};let t=/([^[]*)(\[[0-9]+\])?/.exec(r);return{name:ur(t?.[1],`Failed to parse GLSL uniform name ${r}`),length:t?.[2]?1:0,isArray:!!t?.[2]}}var Gw=_(()=>{I();Gl()});function BB(r,e){let t={...r,attributes:r.attributes.map(n=>({...n})),bindings:r.bindings.map(n=>({...n}))};for(let n of e?.attributes||[]){let i=t.attributes.find(o=>o.name===n.name);i?(i.type=n.type||i.type,i.stepMode=n.stepMode||i.stepMode):P.warn(`shader layout attribute ${n.name} not present in shader`)}for(let n of e?.bindings||[]){let i=$w(t,n.name);if(!i){P.warn(`shader layout binding ${n.name} not present in shader`);continue}Object.assign(i,n)}return t}function $w(r,e){return r.bindings.find(t=>t.name===e||t.name===`${e}Uniforms`||`${t.name}Uniforms`===e)}function zw(r,e){return r[e]||r[`${e}Uniforms`]||r[e.replace(/Uniforms$/,"")]}var zl,Vw=_(()=>{I();Ow();Al();Sl();Nl();em();Gw();zl=class extends Ze{device;handle;vs;fs;introspectedLayout;bindings={};uniforms={};varyings=null;_uniformCount=0;_uniformSetters={};get[Symbol.toStringTag](){return"WEBGLRenderPipeline"}constructor(e,t){super(e,t),this.device=e;let n=this.sharedRenderPipeline||this.device._createSharedRenderPipelineWebGL(t);this.sharedRenderPipeline=n,this.handle=n.handle,this.vs=n.vs,this.fs=n.fs,this.linkStatus=n.linkStatus,this.introspectedLayout=Fw(this.device.gl,this.handle,{uniformBlockLayouts:t._uniformBlockLayouts,shaderLayout:t.shaderLayout}),this.device._setWebGLDebugMetadata(this.handle,this,{spector:{id:this.props.id}}),this.shaderLayout=t.shaderLayout?BB(this.introspectedLayout,t.shaderLayout):this.introspectedLayout}destroy(){this.destroyed||(this.sharedRenderPipeline&&!this.props._sharedRenderPipeline&&this.sharedRenderPipeline.destroy(),this.destroyResource())}setBindings(e,t){let n=Wn(Hr(this.shaderLayout,e));for(let[i,o]of Object.entries(n)){let s=$w(this.shaderLayout,i);if(s){switch(o||P.warn(`Unsetting binding "${i}" in render pipeline "${this.id}"`)(),s.type){case"uniform":if(!(o instanceof dt)&&!(o.buffer instanceof dt))throw new Error("buffer value");break;case"texture":if(!(o instanceof Dt||o instanceof kt||o instanceof Bt))throw new Error(`${this} Bad texture binding for ${i}`);break;case"sampler":P.warn(`Ignoring sampler ${i}`)();break;default:throw new Error(s.type)}this.bindings[i]=o}else{let a=this.shaderLayout.bindings.map(c=>`"${c.name}"`).join(", ");t?.disableWarnings||P.warn(`No binding "${i}" in render pipeline "${this.id}", expected one of ${a}`,o)()}}}draw(e){let t=e.renderPass,n=e.bindGroups?Wn(e.bindGroups):e.bindings||this.bindings;return t.setPipeline(this),t.setBindings(n),t.setVertexArray(e.vertexArray),t.draw({parameters:e.parameters,topology:e.topology,isInstanced:e.isInstanced,vertexCount:e.vertexCount,indexCount:e.indexCount,instanceCount:e.instanceCount,firstVertex:e.firstVertex,firstIndex:e.firstIndex,firstInstance:e.firstInstance,baseVertex:e.baseVertex,transformFeedback:e.transformFeedback,uniforms:e.uniforms})}_areTexturesRenderable(e){let t=!0;for(let n of this.shaderLayout.bindings)zw(e,n.name)||(P.warn(`Binding ${n.name} not found in ${this.id}`)(),t=!1);return t}_applyBindings(e,t){if(this._syncLinkStatus(),this.linkStatus!=="success")return;let{gl:n}=this.device;n.useProgram(this.handle);let i=0,o=0;for(let s of this.shaderLayout.bindings){let a=zw(e,s.name);if(!a)throw new Error(`No value for binding ${s.name} in ${this.id}`);switch(s.type){case"uniform":let{name:c}=s,l=n.getUniformBlockIndex(this.handle,c);if(l===4294967295)throw new Error(`Invalid uniform block name ${c}`);if(n.uniformBlockBinding(this.handle,l,o),a instanceof dt)n.bindBufferBase(35345,o,a.handle);else{let f=a;n.bindBufferRange(35345,o,f.buffer.handle,f.offset||0,f.size||f.buffer.byteLength-(f.offset||0))}o+=1;break;case"texture":if(!(a instanceof Dt||a instanceof kt||a instanceof Bt))throw new Error("texture");let u;if(a instanceof Dt)u=a.texture;else if(a instanceof kt)u=a;else if(a instanceof Bt&&a.colorAttachments[0]instanceof Dt)P.warn("Passing framebuffer in texture binding may be deprecated. Use fbo.colorAttachments[0] instead")(),u=a.colorAttachments[0].texture;else throw new Error("No texture");n.activeTexture(33984+i),n.bindTexture(u.glTarget,u.handle),i+=1;break;case"sampler":break;case"storage":case"read-only-storage":throw new Error(`binding type '${s.type}' not supported in WebGL`)}}}_applyUniforms(e){for(let t of this.shaderLayout.uniforms||[]){let{name:n,location:i,type:o,textureUnit:s}=t,a=e[n]??s;a!==void 0&&Iw(this.device.gl,i,o,a)}}_syncLinkStatus(){this.linkStatus=this.sharedRenderPipeline.linkStatus}}});var Ww,$l,jw=_(()=>{I();Gl();Ww=4,$l=class extends Eo{device;handle;vs;fs;linkStatus="pending";constructor(e,t){super(e,t),this.device=e,this.handle=t.handle||this.device.gl.createProgram(),this.vs=t.vs,this.fs=t.fs,t.varyings&&t.varyings.length>0&&this.device.gl.transformFeedbackVaryings(this.handle,t.varyings,t.bufferMode||35981),this._linkShaders()}destroy(){this.destroyed||(this.device.gl.useProgram(null),this.device.gl.deleteProgram(this.handle),this.handle.destroyed=!0,this.destroyResource())}async _linkShaders(){let{gl:e}=this.device;if(e.attachShader(this.handle,this.vs.handle),e.attachShader(this.handle,this.fs.handle),P.time(Ww,`linkProgram for ${this.id}`)(),e.linkProgram(this.handle),P.timeEnd(Ww,`linkProgram for ${this.id}`)(),!this.device.features.has("compilation-status-async-webgl")){let n=this._getLinkStatus();this._reportLinkStatus(n);return}P.once(1,"RenderPipeline linking is asynchronous")(),await this._waitForLinkComplete(),P.info(2,`RenderPipeline ${this.id} - async linking complete: ${this.linkStatus}`)();let t=this._getLinkStatus();this._reportLinkStatus(t)}async _reportLinkStatus(e){switch(e){case"success":return;default:let t=e==="link-error"?"Link error":"Validation error";switch(this.vs.compilationStatus){case"error":throw this.vs.debugShader(),new Error(`${this} ${t} during compilation of ${this.vs}`);case"pending":await this.vs.asyncCompilationStatus,this.vs.debugShader();break;case"success":break}switch(this.fs?.compilationStatus){case"error":throw this.fs.debugShader(),new Error(`${this} ${t} during compilation of ${this.fs}`);case"pending":await this.fs.asyncCompilationStatus,this.fs.debugShader();break;case"success":break}let n=this.device.gl.getProgramInfoLog(this.handle);this.device.reportError(new Error(`${t} during ${e}: ${n}`),this)(),this.device.debug()}}_getLinkStatus(){let{gl:e}=this.device;return e.getProgramParameter(this.handle,35714)?(this._initializeSamplerUniforms(),e.validateProgram(this.handle),e.getProgramParameter(this.handle,35715)?(this.linkStatus="success","success"):(this.linkStatus="error","validation-error")):(this.linkStatus="error","link-error")}_initializeSamplerUniforms(){let{gl:e}=this.device;e.useProgram(this.handle);let t=0,n=e.getProgramParameter(this.handle,35718);for(let i=0;i<n;i++){let o=e.getActiveUniform(this.handle,i);if(o&&Ul(o.type)){let s=o.name.endsWith("[0]"),a=s?o.name.slice(0,-3):o.name,c=e.getUniformLocation(this.handle,a);c!==null&&(t=this._assignSamplerUniform(c,o,s,t))}}}_assignSamplerUniform(e,t,n,i){let{gl:o}=this.device;if(n&&t.size>1){let s=Int32Array.from({length:t.size},(a,c)=>i+c);return o.uniform1iv(e,s),i+t.size}return o.uniform1i(e,i),i+1}async _waitForLinkComplete(){let e=async i=>await new Promise(o=>setTimeout(o,i));if(!this.device.features.has("compilation-status-async-webgl")){await e(10);return}let{gl:n}=this.device;for(;;){if(n.getProgramParameter(this.handle,37297))return;await e(10)}}}});function DB(r,e){let t=e.sourceBuffer,n=e.destinationBuffer;r.gl.bindBuffer(36662,t.handle),r.gl.bindBuffer(36663,n.handle),r.gl.copyBufferSubData(36662,36663,e.sourceOffset??0,e.destinationOffset??0,e.size),r.gl.bindBuffer(36662,null),r.gl.bindBuffer(36663,null)}function kB(r,e){let{sourceBuffer:t,byteOffset:n=0,destinationTexture:i,mipLevel:o=0,origin:s=[0,0,0],aspect:a="all",bytesPerRow:c,rowsPerImage:l,size:u}=e;if(a!=="all")throw new Error("copyBufferToTexture aspect is not supported in WebGL");i.writeBuffer(t,{byteOffset:n,bytesPerRow:c,rowsPerImage:l,mipLevel:o,x:s[0]??0,y:s[1]??0,z:s[2]??0,width:u[0],height:u[1],depthOrArrayLayers:u[2]})}function NB(r,e){let{sourceTexture:t,mipLevel:n=0,aspect:i="all",width:o=e.sourceTexture.width,height:s=e.sourceTexture.height,depthOrArrayLayers:a,origin:c=[0,0,0],destinationBuffer:l,byteOffset:u=0,bytesPerRow:f,rowsPerImage:d}=e;if(t instanceof z){t.readBuffer({x:c[0]??0,y:c[1]??0,z:c[2]??0,width:o,height:s,depthOrArrayLayers:a,mipLevel:n,aspect:i,byteOffset:u},l);return}if(i!=="all")throw new Error("aspect not supported in WebGL");if(n!==0||a!==void 0||f||d)throw new Error("not implemented");let{framebuffer:h,destroyFramebuffer:p}=Hw(t),m;try{let g=l,b=o||h.width,y=s||h.height,x=ur(h.colorAttachments[0]),v=wl(x.texture.props.format),w=v.format,E=v.type;r.gl.bindBuffer(35051,g.handle),m=r.gl.bindFramebuffer(36160,h.handle),r.gl.readPixels(c[0],c[1],b,y,w,E,u)}finally{r.gl.bindBuffer(35051,null),m!==void 0&&r.gl.bindFramebuffer(36160,m),p&&h.destroy()}}function FB(r,e){let{sourceTexture:t,destinationMipLevel:n=0,origin:i=[0,0],destinationOrigin:o=[0,0,0],destinationTexture:s}=e,{width:a=e.destinationTexture.width,height:c=e.destinationTexture.height}=e,{framebuffer:l,destroyFramebuffer:u}=Hw(t),[f=0,d=0]=i,[h,p,m]=o,g=r.gl.bindFramebuffer(36160,l.handle),b,y;if(s instanceof kt)b=s,a=Number.isFinite(a)?a:b.width,c=Number.isFinite(c)?c:b.height,b._bind(0),y=b.glTarget;else throw new Error("invalid destination");switch(y){case 3553:case 34067:r.gl.copyTexSubImage2D(y,n,h,p,f,d,a,c);break;case 35866:case 32879:r.gl.copyTexSubImage3D(y,n,h,p,m,f,d,a,c);break;default:}b&&b._unbind(),r.gl.bindFramebuffer(36160,g),u&&l.destroy()}function Hw(r){if(r instanceof z){let{width:e,height:t,id:n}=r;return{framebuffer:r.device.createFramebuffer({id:`framebuffer-for-${n}`,width:e,height:t,colorAttachments:[r]}),destroyFramebuffer:!0}}return{framebuffer:r,destroyFramebuffer:!1}}var Vl,Yw=_(()=>{I();Li();Nl();Vl=class extends To{device;handle=null;commands=[];constructor(e,t={}){super(e,t),this.device=e}_executeCommands(e=this.commands){for(let t of e)switch(t.name){case"copy-buffer-to-buffer":DB(this.device,t.options);break;case"copy-buffer-to-texture":kB(this.device,t.options);break;case"copy-texture-to-buffer":NB(this.device,t.options);break;case"copy-texture-to-texture":FB(this.device,t.options);break;default:throw new Error(t.name)}}}});function qw(r){switch(r){case"point-list":return 0;case"line-list":return 1;case"line-strip":return 3;case"triangle-list":return 4;case"triangle-strip":return 5;default:throw new Error(r)}}function Zw(r){switch(r){case"point-list":return 0;case"line-list":return 1;case"line-strip":return 1;case"triangle-list":return 4;case"triangle-strip":return 4;default:throw new Error(r)}}var rm=_(()=>{});var UB,Wl,Xw=_(()=>{I();Dl();Pi();rm();Xp();UB=[1,2,4,8],Wl=class extends Po{device;handle=null;glParameters={};pipeline=null;bindings={};bindingsPipeline=null;vertexArray=null;constructor(e,t){super(e,t),this.device=e;let n=this.props.framebuffer,i=!n||n.handle===null;i&&e.getDefaultCanvasContext()._resizeDrawingBufferIfNeeded();let o;if(!t?.parameters?.viewport)if(!i&&n){let{width:s,height:a}=n;o=[0,0,s,a]}else{let[s,a]=e.getDefaultCanvasContext().getDrawingBufferSize();o=[0,0,s,a]}if(this.device.pushState(),this.setParameters({viewport:o,...this.props.parameters}),!i&&n?.colorAttachments.length){let s=n.colorAttachments.map((a,c)=>36064+c);this.device.gl.drawBuffers(s)}else i&&this.device.gl.drawBuffers([1029]);this.clear(),this.props.timestampQuerySet&&this.props.beginTimestampIndex!==void 0&&this.props.timestampQuerySet.writeTimestamp(this.props.beginTimestampIndex)}end(){this.destroyed||(this.props.timestampQuerySet&&this.props.endTimestampIndex!==void 0&&this.props.timestampQuerySet.writeTimestamp(this.props.endTimestampIndex),this.device.popState(),this.destroy())}pushDebugGroup(e){}popDebugGroup(){}insertDebugMarker(e){}executeBundles(e){throw new Error("Render bundles are only supported in WebGPU")}setParameters(e={}){let t={...this.glParameters};t.framebuffer=this.props.framebuffer||null,this.props.depthReadOnly&&(t.depthMask=!this.props.depthReadOnly),t.stencilMask=this.props.stencilReadOnly?0:1,t[35977]=this.props.discard,e.viewport&&(e.viewport.length>=6?(t.viewport=e.viewport.slice(0,4),t.depthRange=[e.viewport[4],e.viewport[5]]):t.viewport=e.viewport),e.scissorRect&&(t.scissorTest=!0,t.scissor=e.scissorRect),e.blendConstant&&(t.blendColor=e.blendConstant),e.stencilReference!==void 0&&(t[2967]=e.stencilReference,t[36003]=e.stencilReference),"colorMask"in e&&(t.colorMask=UB.map(n=>!!(n&e.colorMask))),this.glParameters=t,lt(this.device.gl,t)}setPipeline(e){this.pipeline=e}setBindings(e,t){if(!this.pipeline)throw new Error("RenderPass.setPipeline() must be called before setBindings()");this.bindings=Wn(Hr(this.pipeline.shaderLayout,e)),this.bindingsPipeline=this.pipeline}setVertexArray(e){this.vertexArray=e}draw(e){let t=this.pipeline,n=this.vertexArray;if(!t)throw new Error("RenderPass.setPipeline() must be called before draw()");if(!n)throw new Error("RenderPass.setVertexArray() must be called before draw()");if(t.shaderLayout.bindings.length>0&&this.bindingsPipeline!==t)throw new Error("RenderPass.setBindings() must be called after setPipeline() before draw()");t._syncLinkStatus();let{parameters:i=t.props.parameters,topology:o=t.props.topology,vertexCount:s,indexCount:a,instanceCount:c,isInstanced:l=!1,firstVertex:u=0,transformFeedback:f,uniforms:d=t.uniforms}=e,h=qw(o),p=!!n.indexBuffer,m=n.indexBuffer?.glIndexType,g=a??s??0;if(t.linkStatus!=="success")return P.info(2,`RenderPipeline:${t.id}.draw() aborted - waiting for shader linking`)(),!1;if(!t._areTexturesRenderable(this.bindings))return P.info(2,`RenderPipeline:${t.id}.draw() aborted - textures not yet loaded`)(),!1;this.device.gl.useProgram(t.handle),n.bindBeforeRender(this);let b=f;return b&&b.begin(t.props.topology),t._applyBindings(this.bindings,{disableWarnings:t.props.disableWarnings}),t._applyUniforms(d),Mw(this.device,i,this.glParameters,()=>{p&&l?this.device.gl.drawElementsInstanced(h,g,m,u,c||0):p?this.device.gl.drawElements(h,g,m,u):l?this.device.gl.drawArraysInstanced(h,u,s||0,c||0):this.device.gl.drawArrays(h,u,s||0),b&&b.end()}),n.unbindAfterRender(this),!0}drawIndirect(e,t=0){throw new Error("Indirect drawing is only supported in WebGPU")}drawIndexedIndirect(e,t=0){throw new Error("Indirect drawing is only supported in WebGPU")}beginOcclusionQuery(e){this.props.occlusionQuerySet?.beginOcclusionQuery()}endOcclusionQuery(){this.props.occlusionQuerySet?.endOcclusionQuery()}clear(){let e={...this.glParameters},t=0;this.props.clearColors&&this.props.clearColors.forEach((n,i)=>{n&&this.clearColorBuffer(i,n)}),this.props.clearColor!==!1&&this.props.clearColors===void 0&&(t|=16384,e.clearColor=this.props.clearColor),this.props.clearDepth!==!1&&(t|=256,e.clearDepth=this.props.clearDepth),this.props.clearStencil!==!1&&(t|=1024,e.clearStencil=this.props.clearStencil),t!==0&&ht(this.device.gl,e,()=>{this.device.gl.clear(t)})}clearColorBuffer(e=0,t=[0,0,0,0]){ht(this.device.gl,{framebuffer:this.props.framebuffer},()=>{switch(t.constructor){case Int8Array:case Int16Array:case Int32Array:this.device.gl.clearBufferiv(6144,e,t);break;case Uint8Array:case Uint8ClampedArray:case Uint16Array:case Uint32Array:this.device.gl.clearBufferuiv(6144,e,t);break;case Float32Array:this.device.gl.clearBufferfv(6144,e,t);break;default:throw new Error("clearColorBuffer: color must be typed array")}})}}});var Ds,Kw=_(()=>{I();Yw();Xw();Ds=class extends So{device;handle=null;commandBuffer;constructor(e,t){super(e,t),this.device=e,this.commandBuffer=new Vl(e,{id:this.id,userData:this.userData})}destroy(){this.destroyResource()}finish(){return this.destroy(),this.commandBuffer}beginRenderPass(e={}){return new Wl(this.device,this._applyTimeProfilingToPassProps(e))}beginComputePass(e={}){throw new Error("ComputePass not supported in WebGL")}copyBufferToBuffer(e){this.commandBuffer.commands.push({name:"copy-buffer-to-buffer",options:e})}copyBufferToTexture(e){this.commandBuffer.commands.push({name:"copy-buffer-to-texture",options:e})}copyTextureToBuffer(e){this.commandBuffer.commands.push({name:"copy-texture-to-buffer",options:e})}copyTextureToTexture(e){this.commandBuffer.commands.push({name:"copy-texture-to-texture",options:e})}pushDebugGroup(e){}popDebugGroup(){}insertDebugMarker(e){}resolveQuerySet(e,t,n){throw new Error("resolveQuerySet is not supported in WebGL")}writeTimestamp(e,t){e.writeTimestamp(t)}}});function Qw(r){let{target:e,source:t,start:n=0,count:i=1}=r,o=t.length,s=i*o,a=0;for(let c=n;a<o;a++)e[c++]=t[a]??0;for(;a<s;)a<s-a?(e.copyWithin(n+a,n,n+a),a*=2):(e.copyWithin(n+a,n,n+s-a),a=s);return r.target}var Jw=_(()=>{});function GB(r){return Array.isArray(r)?new Float32Array(r):r}function zB(r,e){if(!r||!e||r.length!==e.length||r.constructor!==e.constructor)return!1;for(let t=0;t<r.length;++t)if(r[t]!==e[t])return!1;return!0}var jl,eE=_(()=>{I();Rr();$p();Jw();jl=class r extends Lo{get[Symbol.toStringTag](){return"VertexArray"}device;handle;attributeInfosByLocation;buffer=null;bufferValue=null;static isConstantAttributeZeroSupported(e){return Wu()==="Chrome"}constructor(e,t){super(e,t),this.device=e,this.handle=this.device.gl.createVertexArray(),this.attributeInfosByLocation=new Array(this.maxVertexAttributes).fill(null);for(let n of Object.values(Oo(t.shaderLayout,t.bufferLayout)))this.attributeInfosByLocation[n.location]=n}destroy(){super.destroy(),this.buffer&&this.buffer?.destroy(),this.handle&&(this.device.gl.deleteVertexArray(this.handle),this.handle=void 0)}setIndexBuffer(e){let t=e;if(t&&t.glTarget!==34963)throw new Error("Use .setBuffer()");this.device.gl.bindVertexArray(this.handle),this.device.gl.bindBuffer(34963,t?t.handle:null),this.indexBuffer=t,this.device.gl.bindVertexArray(null)}setBuffer(e,t){let n=t;if(n.glTarget===34963)throw new Error("Use .setIndexBuffer()");let{size:i,type:o,stride:s,offset:a,normalized:c,integer:l,divisor:u}=this._getAccessor(e);this.device.gl.bindVertexArray(this.handle),this.device.gl.bindBuffer(34962,n.handle),l?this.device.gl.vertexAttribIPointer(e,i,o,s,a):this.device.gl.vertexAttribPointer(e,i,o,c,s,a),this.device.gl.bindBuffer(34962,null),this.device.gl.enableVertexAttribArray(e),this.device.gl.vertexAttribDivisor(e,u||0),this.attributes[e]=n,this.device.gl.bindVertexArray(null)}setConstantWebGL(e,t){this._enable(e,!1),this.attributes[e]=t}bindBeforeRender(){this.device.gl.bindVertexArray(this.handle),this._applyConstantAttributes()}unbindAfterRender(){this.device.gl.bindVertexArray(null)}_applyConstantAttributes(){for(let e=0;e<this.maxVertexAttributes;++e){let t=this.attributes[e];ArrayBuffer.isView(t)&&this.device.setConstantAttributeWebGL(e,t)}}_getAccessor(e){let t=this.attributeInfosByLocation[e];if(!t)throw new Error(`Unknown attribute location ${e}`);let n=yl(t.bufferDataType);return{size:t.bufferComponents,type:n,stride:t.byteStride,offset:t.byteOffset,normalized:t.normalized,integer:t.integer,divisor:t.stepMode==="instance"?1:0}}_enable(e,t=!0){let i=r.isConstantAttributeZeroSupported(this.device)||e!==0;(t||i)&&(e=Number(e),this.device.gl.bindVertexArray(this.handle),t?this.device.gl.enableVertexAttribArray(e):this.device.gl.disableVertexAttribArray(e),this.device.gl.bindVertexArray(null))}getConstantBuffer(e,t){let n=GB(t),i=n.byteLength*e,o=n.length*e;if(this.buffer&&i!==this.buffer.byteLength)throw new Error(`Buffer size is immutable, byte length ${i} !== ${this.buffer.byteLength}.`);let s=!this.buffer;if(this.buffer=this.buffer||this.device.createBuffer({byteLength:i}),s||=!zB(n,this.bufferValue),s){let a=Sd(t.constructor,o);Qw({target:a,source:n,start:0,count:o}),this.buffer.write(a),this.bufferValue=t}return this.buffer}}});function tE(r){return typeof r=="number"?Number.isInteger(r):/^\d+$/.test(r)}var Hl,rE=_(()=>{I();Yl();rm();Hl=class extends Ao{device;gl;handle;layout;buffers={};unusedBuffers={};bindOnUse=!0;_bound=!1;constructor(e,t){super(e,t),this.device=e,this.gl=e.gl,this.handle=this.props.handle||this.gl.createTransformFeedback(),this.layout=this.props.layout,t.buffers&&this.setBuffers(t.buffers),Object.seal(this)}destroy(){this.gl.deleteTransformFeedback(this.handle),super.destroy()}begin(e="point-list"){this.gl.bindTransformFeedback(36386,this.handle),this.bindOnUse&&this._bindBuffers(),this.gl.beginTransformFeedback(Zw(e))}end(){this.gl.endTransformFeedback(),this.bindOnUse&&this._unbindBuffers(),this.gl.bindTransformFeedback(36386,null)}setBuffers(e){this.buffers={},this.unusedBuffers={},this.bind(()=>{for(let[t,n]of Object.entries(e))this.setBuffer(t,n)})}setBuffer(e,t){let n=this._getVaryingIndex(e),{buffer:i,byteLength:o,byteOffset:s}=this._getBufferRange(t);if(n<0){this.unusedBuffers[e]=i,P.warn(`${this.id} unusedBuffers varying buffer ${e}`)();return}this.buffers[n]={buffer:i,byteLength:o,byteOffset:s},this.bindOnUse||this._bindBuffer(n,i,s,o)}getBuffer(e){if(tE(e))return this.buffers[e]||null;let t=this._getVaryingIndex(e);return this.buffers[t]??null}bind(e=this.handle){if(typeof e!="function")return this.gl.bindTransformFeedback(36386,e),this;let t;return this._bound?t=e():(this.gl.bindTransformFeedback(36386,this.handle),this._bound=!0,t=e(),this._bound=!1,this.gl.bindTransformFeedback(36386,null)),t}unbind(){this.bind(null)}_getBufferRange(e){if(e instanceof dt)return{buffer:e,byteOffset:0,byteLength:e.byteLength};let{buffer:t,byteOffset:n=0,byteLength:i=e.buffer.byteLength}=e;return{buffer:t,byteOffset:n,byteLength:i}}_getVaryingIndex(e){if(tE(e))return Number(e);for(let t of this.layout.varyings||[])if(e===t.name)return t.location;return-1}_bindBuffers(){for(let[e,t]of Object.entries(this.buffers)){let{buffer:n,byteLength:i,byteOffset:o}=this._getBufferRange(t);this._bindBuffer(Number(e),n,o,i)}}_unbindBuffers(){for(let e in this.buffers)this.gl.bindBufferBase(35982,Number(e),null)}_bindBuffer(e,t,n=0,i){let o=t&&t.handle;!o||i===void 0?this.gl.bindBufferBase(35982,e,o):this.gl.bindBufferRange(35982,e,o,n,i)}}});var ql,nE=_(()=>{I();ql=class extends Co{device;handle;_timestampPairs=[];_pendingReads=new Set;_occlusionQuery=null;_occlusionActive=!1;get[Symbol.toStringTag](){return"QuerySet"}constructor(e,t){if(super(e,t),this.device=e,t.type==="timestamp"){if(t.count<2)throw new Error("Timestamp QuerySet requires at least two query slots");this._timestampPairs=new Array(Math.ceil(t.count/2)).fill(null).map(()=>({activeQuery:null,completedQueries:[]})),this.handle=null}else{if(t.count>1)throw new Error("WebGL occlusion QuerySet can only have one value");let n=this.device.gl.createQuery();if(!n)throw new Error("WebGL query not supported");this.handle=n}Object.seal(this)}destroy(){if(!this.destroyed){this.handle&&this.device.gl.deleteQuery(this.handle);for(let e of this._timestampPairs){e.activeQuery&&(this._cancelPendingQuery(e.activeQuery),this.device.gl.deleteQuery(e.activeQuery.handle));for(let t of e.completedQueries)this._cancelPendingQuery(t),this.device.gl.deleteQuery(t.handle)}this._occlusionQuery&&(this._cancelPendingQuery(this._occlusionQuery),this.device.gl.deleteQuery(this._occlusionQuery.handle));for(let e of Array.from(this._pendingReads))this._cancelPendingQuery(e);this.destroyResource()}}isResultAvailable(e){return this.props.type==="timestamp"?e===void 0?this._timestampPairs.some((t,n)=>this._isTimestampPairAvailable(n)):this._isTimestampPairAvailable(this._getTimestampPairIndex(e)):this._occlusionQuery?this._pollQueryAvailability(this._occlusionQuery):!1}async readResults(e){let t=e?.firstQuery||0,n=e?.queryCount||this.props.count-t;if(this._validateRange(t,n),this.props.type==="timestamp"){let i=new Array(n).fill(0n),o=Math.floor(t/2),s=Math.floor((t+n-1)/2);for(let a=o;a<=s;a++){let c=await this._consumeTimestampPairResult(a),l=a*2,u=l+1;l>=t&&l<t+n&&(i[l-t]=0n),u>=t&&u<t+n&&(i[u-t]=c)}return i}if(!this._occlusionQuery)throw new Error("Occlusion query has not been started");return[await this._consumeQueryResult(this._occlusionQuery)]}async readTimestampDuration(e,t){if(this.props.type!=="timestamp")throw new Error("Timestamp durations require a timestamp QuerySet");if(e<0||t>=this.props.count||t<=e)throw new Error("Timestamp duration range is out of bounds");if(e%2!==0||t!==e+1)throw new Error("WebGL timestamp durations require adjacent even/odd query indices");let n=await this._consumeTimestampPairResult(this._getTimestampPairIndex(e));return Number(n)/1e6}beginOcclusionQuery(){if(this.props.type!=="occlusion")throw new Error("Occlusion queries require an occlusion QuerySet");if(!this.handle)throw new Error("WebGL occlusion query is not available");if(this._occlusionActive)throw new Error("Occlusion query is already active");this.device.gl.beginQuery(35887,this.handle),this._occlusionQuery={handle:this.handle,promise:null,result:null,disjoint:!1,cancelled:!1,pollRequestId:null,resolve:null,reject:null},this._occlusionActive=!0}endOcclusionQuery(){if(!this._occlusionActive)throw new Error("Occlusion query is not active");this.device.gl.endQuery(35887),this._occlusionActive=!1}writeTimestamp(e){if(this.props.type!=="timestamp")throw new Error("Timestamp writes require a timestamp QuerySet");let t=this._getTimestampPairIndex(e),n=this._timestampPairs[t];if(e%2===0){if(n.activeQuery)throw new Error("Timestamp query pair is already active");let i=this.device.gl.createQuery();if(!i)throw new Error("WebGL query not supported");let o={handle:i,promise:null,result:null,disjoint:!1,cancelled:!1,pollRequestId:null,resolve:null,reject:null};this.device.gl.beginQuery(35007,i),n.activeQuery=o;return}if(!n.activeQuery)throw new Error("Timestamp query pair was ended before it was started");this.device.gl.endQuery(35007),n.completedQueries.push(n.activeQuery),n.activeQuery=null}_validateRange(e,t){if(e<0||t<0||e+t>this.props.count)throw new Error("Query read range is out of bounds")}_getTimestampPairIndex(e){if(e<0||e>=this.props.count)throw new Error("Query index is out of bounds");return Math.floor(e/2)}_isTimestampPairAvailable(e){let t=this._timestampPairs[e];return!t||t.completedQueries.length===0?!1:this._pollQueryAvailability(t.completedQueries[0])}_pollQueryAvailability(e){if(e.cancelled||this.destroyed)return e.result=0n,!0;if(e.result!==null||e.disjoint)return!0;if(!this.device.gl.getQueryParameter(e.handle,34919))return!1;let n=!!this.device.gl.getParameter(36795);return e.disjoint=n,e.result=n?0n:BigInt(this.device.gl.getQueryParameter(e.handle,34918)),!0}async _consumeTimestampPairResult(e){let t=this._timestampPairs[e];if(!t||t.completedQueries.length===0)throw new Error("Timestamp query pair has no completed result");let n=t.completedQueries.shift();try{return await this._consumeQueryResult(n)}finally{this.device.gl.deleteQuery(n.handle)}}_consumeQueryResult(e){return e.promise||(this._pendingReads.add(e),e.promise=new Promise((t,n)=>{e.resolve=t,e.reject=n;let i=()=>{if(e.pollRequestId=null,e.cancelled||this.destroyed){this._pendingReads.delete(e),e.promise=null,e.resolve=null,e.reject=null,t(0n);return}if(!this._pollQueryAvailability(e)){e.pollRequestId=this._requestAnimationFrame(i);return}this._pendingReads.delete(e),e.promise=null,e.resolve=null,e.reject=null,e.disjoint?n(new Error("GPU timestamp query was invalidated by a disjoint event")):t(e.result||0n)};i()})),e.promise}_cancelPendingQuery(e){if(this._pendingReads.delete(e),e.cancelled=!0,e.pollRequestId!==null&&(this._cancelAnimationFrame(e.pollRequestId),e.pollRequestId=null),e.resolve){let t=e.resolve;e.promise=null,e.resolve=null,e.reject=null,t(0n)}}_requestAnimationFrame(e){return requestAnimationFrame(e)}_cancelAnimationFrame(e){cancelAnimationFrame(e)}}});var Zl,iE=_(()=>{I();Zl=class extends Mo{device;gl;handle;signaled;_signaled=!1;constructor(e,t={}){super(e,{}),this.device=e,this.gl=e.gl;let n=this.props.handle||this.gl.fenceSync(this.gl.SYNC_GPU_COMMANDS_COMPLETE,0);if(!n)throw new Error("Failed to create WebGL fence");this.handle=n,this.signaled=new Promise(i=>{let o=()=>{let s=this.gl.clientWaitSync(this.handle,0,0);s===this.gl.ALREADY_SIGNALED||s===this.gl.CONDITION_SATISFIED?(this._signaled=!0,i()):setTimeout(o,1)};o()})}isSignaled(){if(this._signaled)return!0;let e=this.gl.getSyncParameter(this.handle,this.gl.SYNC_STATUS);return this._signaled=e===this.gl.SIGNALED,this._signaled}destroy(){this.destroyed||this.gl.deleteSync(this.handle)}}});function nm(r){switch(r){case 6406:case 33326:case 6403:case 36244:return 1;case 33339:case 33340:case 33328:case 33320:case 33319:return 2;case 6407:case 36248:case 34837:return 3;case 6408:case 36249:case 34836:return 4;default:return 0}}function oE(r){switch(r){case 5121:return 1;case 33635:case 32819:case 32820:return 2;case 5126:return 4;default:return 0}}var sE=_(()=>{});function aE(r,e){let{sourceX:t=0,sourceY:n=0,sourceAttachment:i=0}=e||{},{target:o=null,sourceWidth:s,sourceHeight:a,sourceDepth:c,sourceFormat:l,sourceType:u}=e||{},{framebuffer:f,deleteFramebuffer:d}=lE(r),{gl:h,handle:p}=f;s||=f.width,a||=f.height;let m=f.colorAttachments[i]?.texture;if(!m)throw new Error(`Invalid framebuffer attachment ${i}`);c=m?.depth||1,l||=m?.glFormat||6408,u||=m?.glType||5121,o=VB(o,u,l,s,a,c);let g=de.getDataType(o);u=u||Bw(g);let b=h.bindFramebuffer(36160,p);return h.readBuffer(36064+i),h.readPixels(t,n,s,a,l,u,o),h.readBuffer(36064),h.bindFramebuffer(36160,b||null),d&&f.destroy(),o}function cE(r,e){let{target:t,sourceX:n=0,sourceY:i=0,sourceFormat:o=6408,targetByteOffset:s=0}=e||{},{sourceWidth:a,sourceHeight:c,sourceType:l}=e||{},{framebuffer:u,deleteFramebuffer:f}=lE(r);a=a||u.width,c=c||u.height;let d=u;l=l||5121;let h=t;if(!h){let m=nm(o),g=oE(l),b=s+a*c*m*g;h=d.device.createBuffer({byteLength:b})}let p=r.device.createCommandEncoder();return p.copyTextureToBuffer({sourceTexture:r,width:a,height:c,origin:[n,i],destinationBuffer:h,byteOffset:s}),p.destroy(),f&&u.destroy(),h}function lE(r){return r instanceof Vr?{framebuffer:r,deleteFramebuffer:!1}:{framebuffer:$B(r),deleteFramebuffer:!0}}function $B(r,e){let{device:t,width:n,height:i,id:o}=r;return t.createFramebuffer({...e,id:`framebuffer-for-${o}`,width:n,height:i,colorAttachments:[r]})}function VB(r,e,t,n,i,o){if(r)return r;e||=5121;let s=kl(e),a=de.getTypedArrayConstructor(s),c=nm(t);return new a(n*i*c)}var uE=_(()=>{I();Gl();sE();tm()});var im={};Ut(im,{WebGLDevice:()=>Tr});function WB(r,e,t){switch(t.length){case 1:r.gl.vertexAttrib1fv(e,t);break;case 2:r.gl.vertexAttrib2fv(e,t);break;case 3:r.gl.vertexAttrib3fv(e,t);break;case 4:r.gl.vertexAttrib4fv(e,t);break;default:}}function jB(r,e,t){r.gl.vertexAttribI4iv(e,t)}function HB(r,e,t){r.gl.vertexAttribI4uiv(e,t)}function YB(r,e){if(!r||!e||r.length!==e.length||r.constructor!==e.constructor)return!1;for(let t=0;t<r.length;++t)if(r[t]!==e[t])return!1;return!0}var Tr,Xl=_(()=>{I();Gp();lw();zp();dw();xw();vw();ww();Ew();Dp();Li();Sw();Al();Aw();Rw();Nl();Sl();Vw();jw();Kw();eE();rE();nE();iE();uE();Pi();Dl();Ms();Tr=class r extends Vt{static getDeviceFromContext(e){return e?e.luma?.device??null:null}type="webgl";handle;features;limits;info;canvasContext;preferredColorFormat="rgba8unorm";preferredDepthFormat="depth24plus";commandEncoder;lost;_resolveContextLost;_isLost=!1;gl;_constants;extensions;_polyfilled=!1;spectorJS;get[Symbol.toStringTag](){return"WebGLDevice"}toString(){return`${this[Symbol.toStringTag]}(${this.id})`}isVertexFormatSupported(e){switch(e){case"unorm8x4-bgra":return!1;default:return!0}}constructor(e){super({...e,id:e.id||Pw("webgl-device")});let t=Vt._getCanvasContextProps(e);if(!t)throw new Error("WebGLDevice requires props.createCanvasContext to be set");let n=t.canvas?.gl??null,i=r.getDeviceFromContext(n);if(i)throw new Error(`WebGL context already attached to device ${i.id}`);this.canvasContext=new Tl(this,t),this.lost=new Promise(u=>{this._resolveContextLost=u});let o={...e.webgl};t.alphaMode==="premultiplied"&&(o.premultipliedAlpha=!0),e.powerPreference!==void 0&&(o.powerPreference=e.powerPreference),e.failIfMajorPerformanceCaveat!==void 0&&(o.failIfMajorPerformanceCaveat=e.failIfMajorPerformanceCaveat);let a=this.props._handle||cw(this.canvasContext.canvas,{onContextLost:u=>this._resolveContextLost?.({reason:"destroyed",message:"Entered sleep mode, or too many apps or browser tabs are using the GPU."}),onContextRestored:u=>{console.log("WebGL context restored")}},o);if(!a)throw new Error("WebGL context creation failed");if(i=r.getDeviceFromContext(a),i){if(e._reuseDevices)return P.log(1,`Not creating a new Device, instead returning a reference to Device ${i.id} already attached to WebGL context`,i)(),this.canvasContext.destroy(),i._reused=!0,i;throw new Error(`WebGL context already attached to device ${i.id}`)}this.handle=a,this.gl=a,this.spectorJS=Kv({...this.props,gl:this.handle});let c=Cs(this.handle);c.device=this,c.extensions||(c.extensions={}),this.extensions=c.extensions,this.info=uw(this.gl,this.extensions),this.limits=new Pl(this.gl),this.features=new El(this.gl,this.extensions,this.props._disabledFeatures),this.props._initializeFeatures&&this.features.initializeFeatures(),new ut(this.gl,{log:(...u)=>P.log(1,...u)()}).trackState(this.gl,{copyState:!1}),(e.debug||e.debugWebGL)&&(this.gl=Zv(this.gl,{debugWebGL:!0,traceWebGL:e.debugWebGL}),P.warn("WebGL debug mode activated. Performance reduced.")()),e.debugWebGL&&(P.level=Math.max(P.level,1)),this.commandEncoder=new Ds(this,{id:`${this}-command-encoder`}),this.canvasContext._startObservers()}destroy(){if(!this.props._reuseDevices&&!this._reused){this._isLost=!0,this.commandEncoder?.destroy();let e=Cs(this.handle);e.device=null}}get isLost(){return this._isLost||this.gl.isContextLost()}createCanvasContext(e){throw new Error("WebGL only supports a single canvas")}createPresentationContext(e){return new Ll(this,e||{})}createBuffer(e){let t=this._normalizeBufferProps(e);return new dt(this,t)}createTexture(e){return new kt(this,e)}createExternalTexture(e){throw new Error("ExternalTexture is not available on WebGL")}createSampler(e){return new Bl(this,e)}createShader(e){return new Ml(this,e)}createFramebuffer(e){return new Bt(this,e)}createVertexArray(e){return new jl(this,e)}createTransformFeedback(e){return new Hl(this,e)}createQuerySet(e){return new ql(this,e)}createFence(){return new Zl(this)}createRenderPipeline(e){return new zl(this,e)}_createSharedRenderPipelineWebGL(e){return new $l(this,e)}createComputePipeline(e){throw new Error("ComputePipeline not supported in WebGL")}createRenderBundleEncoder(e){throw new Error("Render bundles are only supported in WebGPU")}createCommandEncoder(e={}){return new Ds(this,e)}submit(e){let t=null;e||({submittedCommandEncoder:t,commandBuffer:e}=this._finalizeDefaultCommandEncoderForSubmit());try{e._executeCommands(),t&&t.resolveTimeProfilingQuerySet().then(()=>{this.commandEncoder._gpuTimeMs=t._gpuTimeMs}).catch(()=>{})}finally{e.destroy()}}writeBufferViaCommandEncoder(e,t,n,i=0){t.write(n,i)}_finalizeDefaultCommandEncoderForSubmit(){let e=this.commandEncoder,t=e.finish();return this.commandEncoder.destroy(),this.commandEncoder=this.createCommandEncoder({id:e.props.id,timeProfilingQuerySet:e.getTimeProfilingQuerySet()}),{submittedCommandEncoder:e,commandBuffer:t}}readPixelsToArrayWebGL(e,t){return aE(e,t)}readPixelsToBufferWebGL(e,t){return cE(e,t)}setParametersWebGL(e){lt(this.gl,e)}getParametersWebGL(e){return _l(this.gl,e)}withParametersWebGL(e,t){return ht(this.gl,e,t)}resetWebGL(){P.warn("WebGLDevice.resetWebGL is deprecated, use only for debugging")(),nw(this.gl)}_getDeviceSpecificTextureFormatCapabilities(e){return _w(this.gl,e,this.extensions)}loseDevice(){let e=!1,n=this.getExtension("WEBGL_lose_context").WEBGL_lose_context;return n&&(e=!0,n.loseContext()),this._resolveContextLost?.({reason:"destroyed",message:"Application triggered context loss"}),e}pushState(){ut.get(this.gl).push()}popState(){ut.get(this.gl).pop()}getGLKey(e,t){let n=Number(e);for(let i in this.gl)if(this.gl[i]===n)return`GL.${i}`;return t?.emptyIfUnknown?"":String(e)}getGLKeys(e){let t={emptyIfUnknown:!0};return Object.entries(e).reduce((n,[i,o])=>(n[`${i}:${this.getGLKey(i,t)}`]=`${o}:${this.getGLKey(o,t)}`,n),{})}setConstantAttributeWebGL(e,t){let n=this.limits.maxVertexAttributes;this._constants=this._constants||new Array(n).fill(null);let i=this._constants[e];switch(i&&YB(i,t)&&P.info(1,`setConstantAttributeWebGL(${e}) could have been skipped, value unchanged`)(),this._constants[e]=t,t.constructor){case Float32Array:WB(this,e,t);break;case Int32Array:jB(this,e,t);break;case Uint32Array:HB(this,e,t);break;default:throw new Error("constant")}}getExtension(e){return ft(this.gl,e,this.extensions),this.extensions}_setWebGLDebugMetadata(e,t,n){e.luma=t;let i={props:n.spector,id:n.spector.id};e.__SPECTOR_Metadata=i}}});function qB(r){return typeof WebGL2RenderingContext<"u"&&r instanceof WebGL2RenderingContext?!0:!!(r&&typeof r.createVertexArray=="function")}function fE(r){return{...r,debug:r.debug??Vt.defaultProps.debug,debugWebGL:r.debugWebGL??Vt.defaultProps.debugWebGL,debugSpectorJS:r.debugSpectorJS??!!P.get("debug-spectorjs")}}async function dE(r){let e=[];(r.debugWebGL||r.debug)&&e.push(qv()),r.debugSpectorJS&&e.push(Xv(r));let t=await Promise.allSettled(e);for(let n of t)n.status==="rejected"&&P.error(`Failed to initialize debug libraries ${n.reason}`)()}var ks,om,Ns,hE=_(()=>{I();Hv();Dp();ks=1,om=class extends mo{type="webgl";enforceWebGL2(e){jv(e)}isSupported(){return typeof WebGL2RenderingContext<"u"}isDeviceHandle(e){return typeof WebGL2RenderingContext<"u"&&e instanceof WebGL2RenderingContext?!0:(typeof WebGLRenderingContext<"u"&&e instanceof WebGLRenderingContext&&P.warn("WebGL1 is not supported",e)(),!1)}async attach(e,t={}){let{WebGLDevice:n}=await Promise.resolve().then(()=>(Xl(),im));if(e instanceof n)return e;let i=n.getDeviceFromContext(e);if(i)return i;if(!qB(e))throw new Error("Invalid WebGL2RenderingContext");t=fE(t),await dE(t);let o=t.createCanvasContext===!0?{}:t.createCanvasContext;return new n({...t,_handle:e,createCanvasContext:{canvas:e.canvas,autoResize:!1,...o}})}async create(e={}){let{WebGLDevice:t}=await Promise.resolve().then(()=>(Xl(),im));e=fE(e),await dE(e);try{let n=new t(e);P.groupCollapsed(ks,`WebGLDevice ${n.id} created`)();let i=`${n._reused?"Reusing":"Created"} device with WebGL2 ${n.props.debug?"debug ":""}context: ${n.info.vendor}, ${n.info.renderer} for canvas: ${n.canvasContext.id}`;return P.probe(ks,i)(),P.table(ks,n.info)(),n}finally{P.groupEnd(ks)(),P.info(ks,"%cWebGL call tracing: luma.log.set('debug-webgl') ","color: white; background: blue; padding: 2px 6px; border-radius: 3px;")()}}};Ns=new om});var Yl=_(()=>{hE();Xl();Al()});function tu(r){return wE.test(r)}function ru(r){return EE.test(r)}function PE(r){let e=wE.exec(r),t=EE.exec(r),n=e?.[1]??t?.[1]??r;try{Z.getVertexFormatInfo(n)}catch{throw new Error(`Unsupported GPUVector format ${r}`)}return n}function er(r){let e=PE(r),t=tu(r),n=ru(r),i=Z.getVertexFormatInfo(e),o=i.type,s=i.normalized,a=JB(o,s);return{format:r,elementFormat:e,vertexList:t,valueList:n,type:o,signedDataType:eD(e,o),primitiveType:a,components:i.components,byteLength:i.byteLength,integer:i.integer,signed:i.signed,normalized:s,...i.webglOnly?{webglOnly:!0}:{}}}function JB(r,e){if(e)return"f32";switch(r){case"float32":return"f32";case"float16":return"f16";case"uint8":case"uint16":case"uint32":return"u32";case"sint8":case"sint16":case"sint32":return"i32";default:throw new Error(`Unsupported GPUVector component type ${r}`)}}function eD(r,e){if(r==="unorm10-10-10-2")return"uint32";switch(e){case"unorm8":return"uint8";case"snorm8":return"sint8";case"unorm16":return"uint16";case"snorm16":return"sint16";default:return e}}var wE,EE,nu=_(()=>{I();wE=/^vertex-list<([^<>]+)>$/,EE=/^value-list<([^<>]+)>$/});function am(r,e){if(!Number.isSafeInteger(r)||r<0)throw new Error(`${e} must be a non-negative safe integer`)}var tr,cm=_(()=>{I();tr=class{buffer;format;length;byteOffset;byteStride;constructor(e){let t=Z.getVertexFormatInfo(e.format).byteLength,n=e.byteOffset??0,i=e.byteStride??t;if(am(e.length,"GPUDataView length"),am(n,"GPUDataView byteOffset"),am(i,"GPUDataView byteStride"),i<t)throw new Error(`GPUDataView byteStride ${i} is smaller than ${e.format} byte length ${t}`);let o=e.length===0?0:(e.length-1)*i+t,s=n+o;if(!Number.isSafeInteger(o)||!Number.isSafeInteger(s))throw new Error("GPUDataView byte range must use safe integers");if(s>e.buffer.byteLength)throw new Error("GPUDataView exceeds its backing buffer byte length");this.buffer=e.buffer,this.format=e.format,this.length=e.length,this.byteOffset=n,this.byteStride=i}get elementByteLength(){return Z.getVertexFormatInfo(this.format).byteLength}get byteLength(){return this.length===0?0:(this.length-1)*this.byteStride+this.elementByteLength}}});function ou(r){return!!(r&&typeof r=="object"&&r.type==="struct")}function TE(r,e){let t=Object.entries(r);if(t.length===0)throw new Error("GPUData struct format must declare at least one field");return e==="packed"?tD(t):rD(t)}function tD(r){let e=[],t=0,n=0;for(let[i,o]of r){let s=Z.getVertexFormatInfo(o);if(s.webglOnly)throw new Error(`Packed GPUData struct field "${i}" uses WebGL-only format ${o}`);t=SE(t,Math.min(4,s.byteLength)),e.push([i,Object.freeze({format:o,byteOffset:t,byteLength:s.byteLength})]),t+=s.byteLength,n+=s.components}return Object.freeze({type:"struct",layout:"packed",fields:Object.freeze(Object.fromEntries(e)),components:n,byteStride:SE(t,4),rowByteLength:t})}function rD(r){let e=Object.fromEntries(r.map(([s,a])=>[s,nD(a)])),t=Yr(e,{layout:"wgsl-storage"}),n=[],i=0,o=0;for(let[s,a]of r){let c=Z.getVertexFormatInfo(a),l=t.fields[s].offset*4;n.push([s,Object.freeze({format:a,byteOffset:l,byteLength:c.byteLength})]),i=Math.max(i,l+c.byteLength),o+=c.components}return Object.freeze({type:"struct",layout:"wgsl-storage",fields:Object.freeze(Object.fromEntries(n)),components:o,byteStride:t.byteLength,rowByteLength:i})}function nD(r){let e=Z.getVertexFormatInfo(r);switch(e.type){case"float32":return iu("f32",e.components);case"sint32":return iu("i32",e.components);case"uint32":return iu("u32",e.components);default:{let t=Math.ceil(e.byteLength/4);return iu("u32",t)}}}function iu(r,e){return e===1?r:`vec${e}<${r}>`}function SE(r,e){return Math.ceil(r/e)*e}var LE=_(()=>{I()});var lm,um,Ai,fm=_(()=>{cm();LE();nu();lm=class{buffer;ownsDataBuffer;constructor(e,t){this.buffer=e,this.ownsDataBuffer=t}get ownsBuffer(){return this.ownsDataBuffer}transferBufferOwnership(e){if(e.buffer!==this.buffer)throw new Error("GPUData ownership can only be transferred to the same buffer");e.ownsDataBuffer=this.ownsDataBuffer,this.ownsDataBuffer=!1}destroy(){this.ownsDataBuffer&&(this.buffer.destroy(),this.ownsDataBuffer=!1)}},um=class extends lm{dataType;format;length;valueLength;stride;byteOffset;byteStride;rowByteLength;readbackMetadata;valueOffsets;nullBitmap;valueByteLength;constructor(e){let{buffer:t,format:n,length:i,valueLength:o,stride:s,byteOffset:a=0,byteStride:c,rowByteLength:l,ownsBuffer:u=!1,readbackMetadata:f,valueOffsets:d,nullBitmap:h,valueByteLength:p,dataType:m}=e;super(t,u);let g;n?typeof n=="string"?g=n:g=TE(n,e.layout??"wgsl-storage"):g=void 0;let b=ou(g)?g:void 0,y=typeof g=="string"?er(g):void 0;if(this.dataType=m,this.format=g,this.length=i,this.valueLength=o??i,this.stride=s??y?.components??b?.components??c??l??1,this.byteOffset=a,this.rowByteLength=l??b?.rowByteLength??y?.byteLength??c??this.stride,this.byteStride=c??b?.byteStride??this.rowByteLength,b){if(this.rowByteLength<b.rowByteLength)throw new Error(`GPUData rowByteLength ${this.rowByteLength} is smaller than struct format row byte length ${b.rowByteLength}`);if(this.byteStride<Math.max(b.byteStride,this.rowByteLength))throw new Error(`GPUData byteStride ${this.byteStride} is smaller than its struct row layout`)}this.readbackMetadata=f,this.valueOffsets=d,this.nullBitmap=h,this.valueByteLength=p}getChild(e){if(!ou(this.format))return null;let t=this.format.fields[e];return t?new tr({buffer:this.buffer,format:t.format,length:this.length,byteOffset:this.byteOffset+t.byteOffset,byteStride:this.byteStride}):null}getChildAt(e){if(!ou(this.format))return null;let t=Object.values(this.format.fields)[e];return t?new tr({buffer:this.buffer,format:t.format,length:this.length,byteOffset:this.byteOffset+t.byteOffset,byteStride:this.byteStride}):null}},Ai=um});function AE(r){let e=r.format?er(r.format):void 0,t=r.rowByteLength??r.byteStride??e?.byteLength;if(t===void 0)throw new Error("GPUVector requires format or explicit rowByteLength");return{stride:r.stride??e?.components??1,byteStride:r.byteStride??t,rowByteLength:t}}function iD(r){return r[0]?.format}function oD(r,e){if(r.find(n=>n.format!==e))throw new Error("GPUVector data chunks must share the declared format")}var Nt,CE=_(()=>{fm();nu();Nt=class{name;dataType;format;length;valueLength;stride;byteOffset;byteStride;rowByteLength;bufferLayout;data=[];device;bufferProps;isAppendable=!1;ownsDataChunks=!0;ownedVectors=[];appendableByteLength=0;constructor(e){switch(e.type){case"buffer":{let{name:t,buffer:n,format:i,length:o,valueLength:s=o,byteOffset:a=0,ownsBuffer:c=!1}=e,{stride:l,byteStride:u,rowByteLength:f}=AE(e);this.name=t,this.dataType=e.dataType,this.format=i,this.length=o,this.valueLength=s,this.stride=l,this.byteOffset=a,this.byteStride=u,this.rowByteLength=f,this.data.push(new Ai({buffer:n,format:i,length:o,valueLength:s,stride:l,byteOffset:a,byteStride:u,rowByteLength:f,ownsBuffer:c,dataType:e.dataType}));return}case"interleaved":{let{name:t,buffer:n,format:i,length:o,valueLength:s=o,byteOffset:a=0,byteStride:c,attributes:l,ownsBuffer:u=!1}=e;this.name=t,this.dataType=e.dataType,this.format=i,this.length=o,this.valueLength=s,this.stride=c,this.byteOffset=a,this.byteStride=c,this.rowByteLength=c,this.bufferLayout={name:t,byteStride:c,attributes:l},this.data.push(new Ai({buffer:n,format:i,length:o,valueLength:s,stride:c,byteOffset:a,byteStride:c,rowByteLength:c,ownsBuffer:u,dataType:e.dataType}));return}case"data":{let t=e.format??iD(e.data),n=t?er(t):void 0,{name:i,data:o,stride:s=o[0]?.stride??n?.components??1,valueLength:a=o.reduce((d,h)=>d+h.valueLength,0),byteStride:c=o[0]?.byteStride??n?.byteLength,rowByteLength:l=o[0]?.rowByteLength??n?.byteLength,bufferLayout:u,ownsData:f=!1}=e;if(c===void 0||l===void 0)throw new Error("GPUVector requires format or explicit byte layout metadata");t&&oD(o,t),this.name=i,this.dataType=e.dataType,this.format=t,this.length=o.reduce((d,h)=>d+h.length,0),this.valueLength=a,this.stride=s,this.byteOffset=o.length===1?o[0].byteOffset:0,this.byteStride=c,this.rowByteLength=l,this.bufferLayout=u,this.ownsDataChunks=f,this.data.push(...o);return}case"appendable":{let{name:t,device:n,format:i,valueLength:o=0,bufferProps:s}=e,{stride:a,byteStride:c,rowByteLength:l}=AE(e);this.name=t,this.dataType=e.dataType,this.format=i,this.length=0,this.valueLength=o,this.stride=a,this.byteOffset=0,this.byteStride=c,this.rowByteLength=l,this.device=n,this.bufferProps=s,this.isAppendable=!0;return}}}get ownsBuffer(){return this.ownsDataChunks&&this.data.some(e=>e.ownsBuffer)||this.ownedVectors.some(e=>e.ownsBuffer)}get capacityRows(){return this.isAppendable?this.length:void 0}get appendedByteLength(){return this.appendableByteLength}addData(e){if(this.format&&e.format!==this.format)throw new Error("GPUVector.addData() requires matching formats");if(e.byteStride!==this.byteStride)throw new Error("GPUVector.addData() requires matching byteStride");if(e.rowByteLength!==this.rowByteLength)throw new Error("GPUVector.addData() requires matching rowByteLength");return this.data.push(e),this.length+=e.length,this.valueLength+=e.valueLength,this}appendDataChunk(e,t=this.appendableByteLength+e.buffer.byteLength){if(!this.isAppendable)throw new Error("GPUVector.appendDataChunk() requires appendable vector storage");if(this.format&&e.format!==this.format)throw new Error("GPUVector.appendDataChunk() requires matching formats");if(e.byteStride!==this.byteStride||e.rowByteLength!==this.rowByteLength)throw new Error("GPUVector.appendDataChunk() requires matching byte layout metadata");return this.data.push(e),this.length+=e.length,this.valueLength+=e.valueLength,this.appendableByteLength=t,this}resetLastBatch(){if(!this.isAppendable)throw new Error("GPUVector.resetLastBatch() requires appendable vector storage");for(let e of this.data.splice(0))e.destroy();return this.length=0,this.valueLength=0,this.appendableByteLength=0,this}retainOwnedVectors(e){return this.ownedVectors.push(...e),this}transferBufferOwnership(e){let t=this.data[0],n=e.data[0];if(!t||!n||t.buffer!==n.buffer)throw new Error("GPUVector ownership can only be transferred to the same buffer");t.transferBufferOwnership(n)}destroy(){if(this.ownsDataChunks)for(let e of this.data)e.destroy();for(let e of this.ownedVectors.splice(0))e.destroy()}}});var dm=_(()=>{fm();cm();CE();nu()});var hm,Le,$s=_(()=>{I();hm=class{poolSize=20;bufferPools;constructor(){this.bufferPools=new Map}createOrReuse(e,t){if(t>e.limits.maxBufferSize)throw new Error(`Buffer pool cannot allocate ${t} bytes: device.limits.maxBufferSize is ${e.limits.maxBufferSize}`);let n=this.bufferPools.get(e),i=n?n.findIndex(s=>s.byteLength>=t):-1;if(i<0)return e.createBuffer({usage:D.VERTEX|D.STORAGE|D.COPY_DST|D.COPY_SRC,byteLength:t});let[o]=n.splice(i,1);return o}recycle(e){let t=e.device;this.bufferPools.has(t)||this.bufferPools.set(t,[]);let n=this.bufferPools.get(t),i=n.findIndex(o=>o.byteLength>e.byteLength);i<0?n.push(e):n.splice(i,0,e),this.purge()}purge(){for(let[e,t]of this.bufferPools){let n=e.isLost?0:this.poolSize;for(;t.length>n;)t.shift().destroy();t.length===0&&this.bufferPools.delete(e)}}},Le=new hm});function sD(r,e,t,n){let{ValueType:i,size:o,offset:s,stride:a}=r,c=a/i.BYTES_PER_ELEMENT,l=s/i.BYTES_PER_ELEMENT,u=n-t;if(c===o){let d=l+t*c;return e.subarray(d,d+u*o)}let f=new i(u*o);for(let d=0;d<u;d++){let h=l+(t+d)*c;f.set(e.subarray(h,h+o),d*o)}return f}function au(r){if(r instanceof j)return r;if(typeof r=="number"||Array.isArray(r))return j.fromConstant(r);if(r instanceof Ai)return j.fromGPUData(r);if(r instanceof tr)return j.fromGPUDataView(r);throw new Error("getGPUDataEvaluator() requires GPUDataEvaluator, GPUData, GPUDataView, number, or number[]")}function aD(r){if(!r.format)throw new Error("GPUDataEvaluator.fromGPUData() requires GPUData format metadata");if(tu(r.format)||ru(r.format))throw new Error("GPUDataEvaluator.fromGPUData() does not support variable-length input");let t=er(r.format).byteLength;if(r.rowByteLength!==t)throw new Error(`GPUDataEvaluator.fromGPUData() requires rowByteLength ${t} for GPUData`)}function ME(r){let e=er(r.format),t=Fr(e.signedDataType),n=t.BYTES_PER_ELEMENT*e.components;if(e.byteLength!==n)throw new Error(`GPUDataEvaluator does not support packed vertex format ${r.format}: ${e.byteLength} physical bytes cannot expose ${e.components} ${e.signedDataType} components`);if(r.byteOffset%t.BYTES_PER_ELEMENT!==0||r.byteStride%t.BYTES_PER_ELEMENT!==0)throw new Error(`GPUDataEvaluator requires ${r.format} offset and stride aligned to ${t.BYTES_PER_ELEMENT} bytes`);return{type:e.signedDataType,size:e.components,offset:r.byteOffset,stride:r.byteStride,normalized:e.normalized,length:r.length,format:r.format}}function su(r){let e=cD(r).buffer;return e instanceof me?e.buffer:e}function cD(r){let[e,...t]=r.data;if(!e||t.length>0)throw new Error(`GPUDataEvaluator requires exactly one GPUData chunk for "${r.name}"`);return e}function lD(r){let e=[];return RE(r,e,{byteOffset:0}),e}function RE(r,e,t){let n=r.source;if(n&&!(n instanceof j)&&n.name==="interleave"){for(let i of Object.values(n.inputs))i instanceof j&&RE(i,e,t);return}e.push({attribute:r.id??r.toString(),format:IE(r.type,r.size,r.normalized),byteOffset:t.byteOffset}),t.byteOffset+=r.ValueType.BYTES_PER_ELEMENT*r.size}function IE(r,e,t=!1){if(e<1||e>4)throw new Error(`Cannot synthesize a GPUVector vertex format with ${e} components`);let n=r;if(t)switch(r){case"uint8":n="unorm8";break;case"sint8":n="snorm8";break;case"uint16":n="unorm16";break;case"sint16":n="snorm16";break;case"float32":n="float32";break;default:throw new Error(`Unsupported normalized vertex format for ${r}`)}return(n==="uint8"||n==="sint8"||n==="uint16"||n==="sint16"||n==="unorm8"||n==="snorm8"||n==="unorm16"||n==="snorm16")&&e===3?`${n}x3-webgl`:`${n}${e===1?"":`x${e}`}`}function uD(r,e,t=!1){return e>=1&&e<=4?IE(r,e,t):void 0}var j,rr=_(()=>{I();K();dm();$s();j=class r{static get bufferPoolSize(){return Le.poolSize}static set bufferPoolSize(e){if(!Number.isSafeInteger(e)||e<0)throw new Error("GPUDataEvaluator.bufferPoolSize must be a non-negative safe integer");Le.poolSize=e,Le.purge()}type;size;get offset(){return this._offset}get stride(){return this._stride}normalized;isConstant;length;get byteLength(){return this._byteLength}ValueType;source=null;format;_id;_destroyed=!1;_value;_offset;_stride;_byteLength;_gpuVector;_bufferOwnership="owned";_targetBuffer;static fromArray(e,{type:t,size:n=1,offset:i=0,stride:o=0,normalized:s=!1}){let a=t,c;if(Array.isArray(e)){a=a||"float32";let u=Fr(a);c=new u(e)}else e instanceof Float64Array?(a="uint32",n*=2,i*=2,o*=2,c=new Uint32Array(e.buffer,e.byteOffset,e.byteLength/4)):(a=a||Za(e),c=e);let l=`<${a} * ${n}>`;return new r({id:l,type:a,size:n,offset:i,stride:o,normalized:s,value:c})}static fromConstant(e,t="float32"){let n=Fr(t),i;return Array.isArray(e)?i=`[${e.join(",")}]`:(i=String(e),e=[e]),new r({id:i,isConstant:!0,type:t,size:e.length,value:new n(e)})}static fromGPUData(e,t={}){aD(e);let n=new tr({buffer:e.buffer,format:e.format,length:e.length,byteOffset:e.byteOffset,byteStride:e.byteStride});return new r({...ME(n),id:t.id,gpuData:e})}static fromGPUDataView(e,t={}){return new r({...ME(e),id:t.id,buffer:e.buffer})}constructor(e){let{id:t,value:n,buffer:i,gpuData:o,format:s,source:a=null,isConstant:c=!1}=e;if(!a&&!n&&!i&&!o)throw new Error("GPUDataEvaluator must have a value source");let{type:l,size:u,offset:f,stride:d,normalized:h,length:p}=e;if(a instanceof r?(l=l??a.type,u=u??a.size,f=f??a.offset,d=d??a.stride,h=h??a.normalized,p=p??a.length):(u=u??1,f=f??0,h=h??!1,p=c?1:p),!l)throw new Error("GPUDataEvaluator: type not defined");if(this._id=t,this.type=l,this.size=u,this.ValueType=Fr(this.type),this._offset=f,this._stride=d||this.ValueType.BYTES_PER_ELEMENT*u,this.normalized=h,this.source=a,this.format=s,p===void 0)if(c)p=1;else{if(!n)throw new Error("GPUDataEvaluator: length not defined");p=Math.ceil(n.byteLength/this.stride)}this.isConstant=c,this.length=p;let m=this.ValueType.BYTES_PER_ELEMENT*this.size;this._byteLength=p===0?0:(p-1)*this.stride+m,this._value=n,this._bufferOwnership=a instanceof r||i||o?"borrowed":"owned",o?this._gpuVector=new Nt({type:"data",name:this._id??"data",format:o.format,data:[o],stride:o.stride,byteStride:o.byteStride,rowByteLength:o.rowByteLength}):i&&(this._gpuVector=this.createGPUVectorView({buffer:i,name:this._id,format:this.format}))}get value(){return this._value||(this.source instanceof r?this.source.value:void 0)}get evaluated(){return!!this._gpuVector}get id(){return this._id}get gpuVector(){if(!this._gpuVector)throw new Error(`${this} not evaluated`);return this._gpuVector}get buffer(){return su(this.gpuVector)}setTargetBuffer({buffer:e,byteOffset:t=0,byteStride:n=this.stride}){if(this._destroyed)throw new Error(`GPUDataEvaluator ${this} already destroyed`);if(this._gpuVector)throw new Error(`GPUDataEvaluator ${this} already evaluated`);if(!this.source||this.source instanceof r)throw new Error("GPUDataEvaluator target buffers require a deferred operation source");this._targetBuffer={buffer:e,byteOffset:t,byteStride:n}}async evaluate(e,t={}){if(this._destroyed)throw new Error(`GPUDataEvaluator ${this} already destroyed`);if(this._gpuVector)return this._gpuVector;let n;if(this.source instanceof r){let i=await this.source.evaluate(e);return this._gpuVector=this.createGPUVectorView({...t,buffer:su(i)}),this._gpuVector}if(n=this._getEvaluationBuffer(e),this._value)n.write(this._value);else{let i=await this.source.execute(e,n);if(!i.success)throw i.error||new Error(`${this.source} evaluation failed`);i.value&&(this._value=i.value)}return this._gpuVector=this.createGPUVectorView({...t,buffer:n}),this._gpuVector}evaluateSync(e,t={}){if(this._destroyed)throw new Error(`GPUDataEvaluator ${this} already destroyed`);if(this._gpuVector)return this._gpuVector;let n;if(this.source instanceof r){let i=this.source.evaluateSync(e);return this._gpuVector=this.createGPUVectorView({...t,buffer:su(i)}),this._gpuVector}if(n=this._getEvaluationBuffer(e),this._value)n.write(this._value);else{let i=this.source.executeSync(e,n);if(!i.success)throw i.error||new Error(`${this.source} evaluation failed`);i.value&&(this._value=i.value)}return this._gpuVector=this.createGPUVectorView({...t,buffer:n}),this._gpuVector}createGPUVectorView(e){let t=e.name??this._id??"vector",n=e.format??this.format??uD(this.type,this.size,this.normalized);if(e.interleaved){let i=typeof e.interleaved=="object"&&e.interleaved.attributes?e.interleaved.attributes:lD(this);return new Nt({type:"interleaved",name:t,buffer:e.buffer,format:e.format??this.format,length:this.length,byteOffset:this.offset,byteStride:this.stride,attributes:i,ownsBuffer:!1})}return new Nt({type:"buffer",name:t,buffer:e.buffer,format:n,length:this.length,stride:this.size,byteOffset:this.offset,byteStride:this.stride,rowByteLength:this.ValueType.BYTES_PER_ELEMENT*this.size,ownsBuffer:!1})}_getEvaluationBuffer(e){let t=this._targetBuffer;if(!t)return Le.createOrReuse(e,this.byteLength);if(t.buffer.device!==e)throw new Error("GPUDataEvaluator target buffer belongs to a different device");let n=this.ValueType.BYTES_PER_ELEMENT*this.size,i=this.length===0?0:(this.length-1)*t.byteStride+n;if(t.byteOffset+i>t.buffer.byteLength)throw new Error("GPUDataEvaluator target buffer is too small for the output layout");return this._offset=t.byteOffset,this._stride=t.byteStride,this._byteLength=i,this._bufferOwnership="borrowed",this._targetBuffer=void 0,t.buffer}async readValue(e=0,t){let{ValueType:n}=this,{size:i,offset:o,stride:s,length:a}=this,c=n.BYTES_PER_ELEMENT*i;if(t=t??a,e=Math.max(0,Math.min(a,e)),t=Math.max(e,Math.min(a,t)),this._value)return sD(this,this._value,e,t);let l=t-e;if(l===0)return new n(0);let u=o+e*s,f=s===c?l*c:(l-1)*s+c,d=await this.buffer.readAsync(u,f),h=new n(d.buffer,d.byteOffset,d.byteLength/n.BYTES_PER_ELEMENT);if(s===c)return h;let p=new Uint8Array(c*l);for(let m=0;m<l;m++){let g=m*s;p.set(d.subarray(g,g+c),m*c)}return new n(p.buffer)}async ensureCPUValue(){let e=this.value;if(e)return e;let t=await this.buffer.readAsync(0,this.offset+this.byteLength);if(t.byteLength%this.ValueType.BYTES_PER_ELEMENT!==0)throw new Error(`${this} backing buffer byte length is not aligned to its scalar type`);let n=t.slice();return this._value=new this.ValueType(n.buffer,n.byteOffset,n.byteLength/this.ValueType.BYTES_PER_ELEMENT),this._value}ensureCPUValueSync(){let e=this.value;if(e)return e;throw new Error(`${this} CPU value is not available for synchronous evaluation`)}toString(){return this._id??this.source?.toString()??this.constructor.name}destroy(){this._gpuVector&&(this._bufferOwnership==="owned"&&Le.recycle(su(this._gpuVector)),this._gpuVector=void 0),this._targetBuffer=void 0,this._destroyed=!0}}});var Ci,cu=_(()=>{Ci={add:{arity:2,symbol:"arithmetic_add"},subtract:{arity:2,symbol:"arithmetic_subtract"},multiply:{arity:2,symbol:"arithmetic_multiply"},divide:{arity:2,symbol:"arithmetic_divide"},pow:{arity:2,symbol:"pow"},sqrt:{arity:1,symbol:"sqrt"},abs:{arity:1,symbol:"abs"},sin:{arity:1,symbol:"sin"},cos:{arity:1,symbol:"cos"},tan:{arity:1,symbol:"arithmetic_tan"},exp:{arity:1,symbol:"exp"},log:{arity:1,symbol:"log"}}});function YE(r,{operations:e,inputs:t}){switch(r.kind){case"input":if(!(r.name in t))throw new Error(`Unknown expression input '${r.name}'`);return;case"literal":if(Array.isArray(r.value)){for(let n of r.value)if(!Number.isFinite(n))throw new Error(`Expression literal array must contain only finite values, got ${n}`)}else if(!Number.isFinite(r.value))throw new Error(`Expression literal must be finite, got ${r.value}`);return;case"call":{let n=e[r.op];if(!n)throw new Error(`Unknown expression op '${r.op}'`);if(r.args.length!==n.arity)throw new Error(`Expression op '${r.op}' expects ${n.arity} args, got ${r.args.length}`);for(let i of r.args)YE(i,{operations:e,inputs:t});return}default:{let n=r;throw new Error(`Unsupported expression node ${n.kind}`)}}}function lu(r,e){return YE(r,e),qE(r,e)}function qE(r,e){switch(r.kind){case"input":{let t=e.inputs[r.name];return e.laneIndex<t.size?e.formatInput(r.name):e.formatOutOfBoundsInput(r.name)}case"literal":return e.formatLiteral(r.value);case"call":{let t=e.operations[r.op],n=r.args.map(i=>qE(i,e));return e.formatCall(t.symbol,n)}default:{let t=r;throw new Error(`Unsupported expression node ${t.kind}`)}}}var _m=_(()=>{});function ye(r,e,t=!1){if(t)return e===1?"float":`vec${e}`;switch(r){case"uint8":case"uint16":case"uint32":return e===1?"uint":`uvec${e}`;case"sint8":case"sint16":case"sint32":return e===1?"int":`ivec${e}`;default:return e===1?"float":`vec${e}`}}function uu(r,e,t=!1){let n;if(t)switch(r){case"uint8":n="unorm8";break;case"sint8":n="snorm8";break;case"uint16":n="unorm16";break;case"sint16":n="snorm16";break;case"float32":n="float32";break;default:throw new Error(`Unsupported normalized vertex format for ${r}`)}else n=r;return e===1?n:e===3&&!n.startsWith("float32")&&!n.endsWith("32")?`${n}x3-webgl`:`${n}x${e}`}function Lr(r){switch(r[0]){case"u":return"0u";case"s":return"0";default:return"0."}}function ZE(r,e){switch(r){case"uint8":case"uint16":case"uint32":return`${Math.trunc(e)}u`;case"sint8":case"sint16":case"sint32":return`${Math.trunc(e)}`;default:return Number.isInteger(e)?`${e}.0`:`${e}`}}function XE(r){switch(r){case"uint8":return"r8uint";case"sint8":return"r8sint";case"uint16":return"r16uint";case"sint16":return"r16sint";case"uint32":return"r32uint";case"sint32":return"r32sint";case"float32":return"r32float";default:throw new Error(`Unsupported WebGL gather texture format for ${r}`)}}function KE(r){switch(r){case"uint32":return"usampler2D";case"sint32":return"isampler2D";case"float32":return"sampler2D";default:throw new Error(`Unsupported WebGL gather sampler type for ${r}`)}}var Ri=_(()=>{});function be({module:r,elementWise:e=!1,expression:t,inputs:n,output:i,operationType:o=i.type,outputBuffer:s}){let a=s.device,c=Ln("result",i.type,i.size,i.normalized),l=[r,c],u=[],f={},d=ye(i.type,1,i.normalized),h=ye(o,1,i.normalized),p="",m=null,g={TYPE:h,RESULT_LEN:i.size.toString()},b=bD(n);for(let[w,E]of b)l.push(ym(w,E.type,E.size,E.normalized,o)),u.push(bm(w,E)),E instanceof j?f[w]=E.buffer:(m=m||Le.createOrReuse(a,s.byteLength),f[w]=m),p+=`TYPE ${w}[${E.size}]; get_${w}(${w});
`,g[`${w.toUpperCase()}_LEN`]=E.size.toString();let y="";if(t)for(let w=0;w<i.size;w++)y+=`result[${w}]=${t(w)};
`;else if(e)for(let w=0;w<i.size;w++){let E=Lr(h),T=b.map(([L,C])=>w<C.size?`${L}[${w}]`:E);y+=`result[${w}]=${r.name}(${T.join(", ")});
`}else y=`${r.name}(${b.map(([w])=>w).join(", ")}, result);`;let x=`#version 300 es

void main() {
${p}
${d} result[${i.size}];
${y}
set_result(result);
}
  `,v=new _e(a,{vs:x,shaderAssembler:yD,defines:g,modules:l,bufferLayout:u,vertexCount:1,instanceCount:i.length,attributes:f,feedbackBufferMode:"interleaved",outputs:c.varyings});a.statsManager.getStats(gD).get(_D).incrementCount(),v.run({inputBuffers:f,outputBuffers:{[c.varyings[0]]:i.offset===0?s:{buffer:s,byteOffset:i.offset,byteLength:i.byteLength}}}),m&&Le.recycle(m)}function bD(r){return Array.isArray(r)?r.map((e,t)=>[`x${t}`,e]):Object.entries(r)}function ym(r,e,t,n=!1,i=e){let o="",s="";for(let c=0;c<t;c+=4){let l=Math.min(t-c,4),u=ye(e,l,n);o+=`in ${u} a${r}_${c};
`;for(let f=0;f<l;f++){let d=`a${r}_${c}`;l>1&&(d=`${d}[${f}]`),(n||e!==i)&&(d=`TYPE(${d})`),s+=`v[${c+f}]=${d};
`}}let a=`
${o}
void get_${r}(out TYPE v[${t}]) {
  ${s}
}
`;return{name:r,vs:a}}function bm(r,e){let t={name:r,stepMode:e.isConstant?"vertex":"instance",byteStride:e.stride,attributes:[]};for(let n=0;n<e.size;n+=4){let i=Math.min(e.size-n,4);t.attributes.push({attribute:`a${r}_${n}`,format:uu(e.type,i,e.normalized),byteOffset:e.offset+e.ValueType.BYTES_PER_ELEMENT*n})}return t}function Ln(r,e,t,n=!1){let i=[],o=ye(e,1,n),s="",a="";for(let c=0;c<t;c+=4){let l=Math.min(t-c,4),u=ye(e,l,n);i.push(`${r}_${c}`),s+=`flat out ${u} ${r}_${c};
`;let f=Array.from({length:l},(d,h)=>c+h);a+=`${r}_${c} = ${u}(${f.map(d=>`v[${d}]`).join(",")});
`}return{name:r,varyings:i,vs:`
${s}
void set_${r}(in ${o} v[${t}]) {
  ${a}
}
`}}var gD,_D,yD,We=_(()=>{K();Me();rr();$s();Ri();gD="GPGPU Operation Counts",_D="Transform Runs",yD=new Zn});var xD,fu,xm=_(()=>{Me();_m();cu();We();Ri();xD=`TYPE arithmetic_add(TYPE x, TYPE y) {
  return x + y;
}

TYPE arithmetic_subtract(TYPE x, TYPE y) {
  return x - y;
}

TYPE arithmetic_multiply(TYPE x, TYPE y) {
  return x * y;
}

TYPE arithmetic_divide(TYPE x, TYPE y) {
  return x / y;
}

float arithmetic_tan(float x) {
  return tan_fp32(x);
}
`,fu=({inputs:r,output:e,target:t})=>{let n=e.type,i=ye(n,1,e.normalized),o=Lr(i),s=r.namedInputs;return be({module:{name:"arithmetic",dependencies:[on],vs:xD},inputs:s,output:e,operationType:n,outputBuffer:t,expression:a=>lu(r.expression,{operations:Ci,inputs:s,laneIndex:a,formatInput:c=>`${c}[${a}]`,formatOutOfBoundsInput:c=>s[c].size===1?`${c}[0]`:o,formatLiteral:c=>{let l=Array.isArray(c)?c[a]??0:c;return`${i}(${ZE(n,l)})`},formatCall:(c,l)=>`${c}(${l.join(", ")})`})}),{success:!0}}});var vD,wD,JE,QE,e2=_(()=>{I();K();rr();$s();xm();We();vD="GPGPU Operation Counts",wD="Transform Runs",JE=({inputs:r,output:e,target:t})=>{let{sourceValues:n}=r,i=t.device;if(n.length===0){let f=new e.ValueType(e.length*e.size);return t.write(f),{success:!0,value:f}}if(n.isConstant){let f=n.value,d=new e.ValueType(e.length*e.size);for(let h=0;h<e.length;h++){let p=f[h];d[h*2]=p,d[h*2+1]=p}return t.write(d),{success:!0,value:d}}let o=i.createTexture({width:1,height:e.length,format:"rg32float",usage:z.RENDER|z.COPY_SRC|z.COPY_DST}),s=i.createFramebuffer({colorAttachments:[o]}),a=`#version 300 es

flat out float extent_value;

void main() {
  float sourceValues[SOURCE_VALUES_LEN];
  get_sourceValues(sourceValues);
  extent_value = sourceValues[gl_VertexID];

  float y = (float(gl_VertexID) + 0.5) / float(CHANNEL_COUNT) * 2.0 - 1.0;
  gl_Position = vec4(0.0, y, 0.0, 1.0);
  gl_PointSize = 1.0;
}
  `,c=`#version 300 es

precision highp float;

flat in float extent_value;
out vec2 fragColor;

void main() {
  fragColor = vec2(-extent_value, extent_value);
}
  `,l=new ge(i,{vs:a,fs:c,topology:"point-list",parameters:{depthCompare:"always",blend:!0,blendColorSrcFactor:"one",blendColorDstFactor:"one",blendColorOperation:"max",blendAlphaSrcFactor:"one",blendAlphaDstFactor:"one",blendAlphaOperation:"max"},modules:[ym("sourceValues",n.type,n.size,n.normalized)],defines:{TYPE:"float",SOURCE_VALUES_LEN:n.size.toString(),CHANNEL_COUNT:e.length.toString()},attributes:{sourceValues:n.buffer},bufferLayout:[bm("sourceValues",n)],instanceCount:n.length,vertexCount:e.length,disableWarnings:!0}),u=Le.createOrReuse(i,e.byteLength);try{let f=i.beginRenderPass({framebuffer:s,parameters:{viewport:[0,0,1,e.length]},clearColor:[-QE,-QE,0,0],clearDepth:!1,clearStencil:!1});i.statsManager.getStats(vD).get(wD).incrementCount(),l.draw(f),f.end();let d=i.createCommandEncoder();return d.copyTextureToBuffer({sourceTexture:o,width:1,height:e.length,destinationBuffer:u,byteOffset:0,bytesPerRow:8}),i.submit(d.finish()),fu({device:i,inputs:{expression:{kind:"call",op:"multiply",args:[{kind:"input",name:"x"},{kind:"literal",value:[-1,1]}]},namedInputs:{x:new j({buffer:u,size:2,type:"float32",length:e.length})}},output:e,target:t})}finally{l.destroy(),Le.recycle(u),s.destroy(),o.destroy()}},QE=3e38});function ED(r,e){let t=e.reduce((n,[,i])=>n+Math.ceil(i.size/4),0);if(t>r)throw new Error(`interleave() requires ${t} vertex attributes, exceeding device limit ${r}`)}function PD(r,e){if(e.size>r)throw new Error(`interleave() output size ${e.size} exceeds device inter-stage component limit ${r}`)}var t2,r2=_(()=>{We();t2=({inputs:r,output:e,target:t})=>{let n=r.map((c,l)=>[`x${l}`,c]);ED(t.device.limits.maxVertexAttributes,n),PD(t.device.limits.maxInterStageShaderVariables,e);let i=n.map(([c,l])=>`in TYPE ${c}[${l.size}]`).join(", "),o=0,s=n.map(([c,l])=>{let u=Array.from({length:l.size},(f,d)=>`  result[${o+d}] = ${c}[${d}];`).join(`
`);return o+=l.size,u}).join(`
`),a=`void interleave(${i}, out TYPE result[RESULT_LEN]) {
${s}
}
`;return be({module:{name:"interleave",vs:a},inputs:r,output:e,outputBuffer:t}),{success:!0}}});function SD(){let r=new Uint16Array([255]);return new Uint8Array(r.buffer)[0]>0}var TD,n2,i2=_(()=>{We();TD=`#define LE ${SD()?1:0}
const uint F32_NAN = 0xffffffffu;
const uint F32_INF = 0x7f800000u;

// Find first set bit using binary search
// https://en.wikipedia.org/wiki/Find_first_set#CLZ
int countLeadingZeros(uint a) {
  if (a == 0u) return 32;
  int n = 0;
  if ((a & 0xffff0000u) == 0u) { n += 16; a = a << 16; }
  if ((a & 0xff000000u) == 0u) { n += 8;  a = a << 8;  }
  if ((a & 0xf0000000u) == 0u) { n += 4;  a = a << 4;  }
  if ((a & 0xc0000000u) == 0u) { n += 2;  a = a << 2;  }
  if ((a & 0x80000000u) == 0u) return n + 1;
  return n;
}

uint roundShiftRight(uint value, int shift) {
  if (shift <= 0) {
    return value << (-shift);
  }

  if (shift >= 32) {
    if (shift == 32 && value > 0x80000000u) {
      return 1u;
    }
    return 0u;
  }

  uint truncated = value >> shift;
  uint halfShift = 1u << (shift - 1);
  uint remainder = value & ((1u << shift) - 1u);
  if (remainder > halfShift || (remainder == halfShift && (truncated & 1u) == 1u)) {
    return truncated + 1u;
  }
  return truncated;
}

uint makeFloat_(uint sign, int exponent, uint mantissa) {
  return (sign << 31) | (uint(exponent + 127) << 23) | (mantissa & 0x7fffffu);
}

/**
 * Assemble a float32 in bit representation according to IEEE 754
 * https://en.wikipedia.org/wiki/Single-precision_floating-point_format
 */
uint makeFloat(uint sign, int exponent, uint significand) {
  if (significand == 0u) {
    return sign << 31;
  }

  // Remove any extra leading zeros for better precision
  int lead_zeros = countLeadingZeros(significand);
  // Significand is encoded as 1.fraction
  int normalizedExponent = exponent + 31 - lead_zeros;

  if (normalizedExponent > 127) {
    return (sign << 31) | F32_INF;
  }

  uint mantissa;
  if (normalizedExponent >= -126) {
    mantissa = roundShiftRight(significand, 8 - lead_zeros);
    if (mantissa >= 0x1000000u) {
      mantissa >>= 1;
      normalizedExponent++;
      if (normalizedExponent > 127) {
        return (sign << 31) | F32_INF;
      }
    }
    return makeFloat_(sign, normalizedExponent, mantissa);
  }

  int subnormalShift = -149 - exponent;
  mantissa = roundShiftRight(significand, subnormalShift);
  if (mantissa >= 0x800000u) {
    return (sign << 31) | (1u << 23);
  }
  return (sign << 31) | mantissa;
}

/**
 * Parse 8-byte memory as a float64 number according to IEEE 754
 * https://en.wikipedia.org/wiki/Double-precision_floating-point_format
 * Returns 8-byte memory as 2 float32 numbers, consisting of
 * high part: fround(d)
 * low part: d - fround(d)
 */
uvec2 parseAsDouble(uvec2 d) {
  #if LE
  d = d.yx; // to big endian
  #endif

  uint sign = (d[0] >> 31) & 1u; // first bit
  uint exponentBits = (d[0] >> 20) & 0x7ffu;
  int exponent = int(exponentBits) - 1023; // next 11 bits
  uint fractionHigh = d[0] & 0xfffffu;
  uint fractionLow = d[1];

  if (exponentBits == 0x7ffu) {
    if (fractionHigh == 0u && fractionLow == 0u) {
      return uvec2((sign << 31) | F32_INF, F32_NAN);
    }
    return uvec2(F32_NAN);
  }
  
  if (exponentBits == 0u) {
    // All float64 subnormals are too small to survive a float32 split.
    return uvec2(sign << 31);
  }

  if (exponent > 127) {
    return uvec2((sign << 31) | F32_INF, ((1u - sign) << 31) | F32_INF);
  }

  uint hi_part;
  uint low_part;

  // float64 significand has 52 bits
  // float32 significand has 23 bits
  // The significand of the high part is the significand of the double, trimmed
  uint f_hi = 0x800000u | (fractionHigh << 3) | (fractionLow >> 29);
  uint f_low = fractionLow & 0x1fffffffu;

  if (exponent < -126) {
    // For tiny normals, the top 24 significand bits still contribute to the float32
    // high part, but they land in the float32 subnormal range.
    hi_part = makeFloat(sign, exponent - 23, f_hi);

    // The residual keeps the remaining 29 significand bits at the original double scale.
    low_part = makeFloat(sign, exponent - 52, f_low);
    return uvec2(hi_part, low_part);
  }

  bool roundUp = f_low > 0x10000000u || (f_low == 0x10000000u && (f_hi & 1u) == 1u);

  uint f_rounded = f_hi + (roundUp ? 1u : 0u);
  int exponent_hi = exponent;
  if (f_rounded == 0x1000000u) {
    f_rounded = 0x800000u;
    exponent_hi++;
  }

  if (exponent_hi > 127) {
    // Overflows float32 limit
    hi_part = (sign << 31) | F32_INF;
    low_part = ((1u - sign) << 31) | F32_INF;
    return uvec2(hi_part, low_part);
  }
  
  hi_part = makeFloat_(sign, exponent_hi, f_rounded);

  int remainder = int(f_low);
  uint sign_low = sign;
  if (roundUp) {
    remainder -= 0x20000000;
  }
  if (remainder < 0) {
    sign_low = 1u - sign;
    remainder = -remainder;
  }
  low_part = makeFloat(sign_low, exponent - 52, uint(remainder));

  return uvec2(hi_part, low_part);
}

void fround(in uint x[X_LEN], out float result[X_LEN]) {
  int n = X_LEN / 2;
  for (int i = 0; i < n; i++) {
    uvec2 f = parseAsDouble(uvec2(x[i * 2], x[i * 2 + 1]));
    result[i] = uintBitsToFloat(f.x);
    result[i + n] = uintBitsToFloat(f.y);
  }
}
`,n2=({inputs:r,output:e,target:t})=>(be({module:{name:"fround",vs:TD},inputs:r,output:e,operationType:"uint32",outputBuffer:t}),{success:!0})});function du(r,e,t){let n=KE(t),i=ye(e,1),o=Array.from({length:r.size},(s,a)=>`  v[${a}] = ${i}(texelFetch(source_values_texture, ivec2(${a}, rowIndex), 0).r);`).join(`
`);return{name:"source_values_texture",vs:`
uniform highp ${n} source_values_texture;
void read_source_values(int rowIndex, out TYPE v[${r.size}]) {
${o}
}
`}}function hu(r,e,t){let n=t.createTexture({width:Math.max(r.size,1),height:r.length,format:XE(e),usage:z.SAMPLE|z.COPY_DST});if(r.length===0)return n;let i=t.createCommandEncoder();return i.copyBufferToTexture({sourceBuffer:r.buffer,destinationTexture:n,byteOffset:r.offset,bytesPerRow:r.stride,rowsPerImage:r.length,size:[r.size,r.length,1]}),t.submit(i.finish()),n}var vm=_(()=>{I();Ri()});function LD(r,e){let t=ye(r.type,1),n="aids_0";return r.type!==MD(e)&&(n=`${e}(${n})`),{name:"ids",vs:`
in ${t} aids_0;
void get_ids(out INDEX_TYPE v[1]) {
  v[0] = ${n};
}
`}}function AD(r){return{name:"ids",stepMode:r.isConstant?"vertex":"instance",byteStride:r.stride,attributes:[{attribute:"aids_0",format:uu(r.type,1,r.normalized),byteOffset:r.offset}]}}function CD(r){return{name:"gather",vs:`
void zero_result(out TYPE result[RESULT_LEN]) {
  for (int i = 0; i < RESULT_LEN; i++) {
    result[i] = ${Lr(r)};
  }
}

void gather(in INDEX_TYPE ids[1], out TYPE result[RESULT_LEN]) {
  int sourceIndex = int(ids[0]);
  if (sourceIndex < 0 || sourceIndex >= SOURCE_VALUES_ROWS) {
    zero_result(result);
    return;
  }
  read_source_values(sourceIndex, result);
}
`}}function MD(r){switch(r){case"uint":return"uint32";case"int":return"sint32";default:return"float32"}}var o2,s2=_(()=>{K();Ri();We();vm();o2=async({inputs:r,output:e,target:t})=>{let{ids:n,sourceValues:i}=r,o=t.device,s=Ln("result",e.type,e.size),a=ye(n.type,1),c=ye(e.type,1),l=e.type,u=hu(i,l,o),f=`#version 300 es

void main() {
  INDEX_TYPE ids[1];
  get_ids(ids);
  TYPE result[${e.size}];
  gather(ids, result);
  set_result(result);
}
  `,d=new _e(o,{vs:f,defines:{INDEX_TYPE:a,TYPE:c,RESULT_LEN:e.size.toString(),SOURCE_VALUES_ROWS:i.length.toString()},modules:[LD(n,a),du(i,e.type,l),CD(e.type),s],bindings:{source_values_texture:u},bufferLayout:[AD(n)],vertexCount:1,instanceCount:e.length,feedbackBufferMode:"interleaved",outputs:s.varyings});try{return d.run({inputBuffers:{ids:n.buffer},outputBuffers:{[s.varyings[0]]:t}}),{success:!0}}finally{d.destroy(),u.destroy()}}});var RD,a2,c2=_(()=>{We();RD=`void row_dot(in TYPE x[X_LEN], in TYPE y[Y_LEN], out float result[1]) {
  float sum = 0.0;
  for (int i = 0; i < X_LEN; i++) {
    sum += float(x[i]) * float(y[i]);
  }
  result[0] = sum;
}
`,a2=({inputs:r,output:e,target:t})=>(be({module:{name:"row_dot",vs:RD},inputs:r,output:e,operationType:"float32",outputBuffer:t}),{success:!0})});var ID,l2,u2=_(()=>{We();ID=`void equalAll(in TYPE x[X_LEN], in TYPE y[Y_LEN], out uint result[1]) {
  uint allEqual = uint(1);
  for (int i = 0; i < X_LEN; i++) {
    if (x[i] != y[i]) {
      allEqual = uint(0);
      break;
    }
  }
  result[0] = allEqual;
}
`,l2=({inputs:r,output:e,target:t})=>(be({module:{name:"equalAll",vs:ID},inputs:r,output:e,operationType:e.type==="uint32"?r.x.type:e.type,outputBuffer:t}),{success:!0})});var OD,f2,d2=_(()=>{We();OD=`void row_length(in TYPE x[X_LEN], out float result[1]) {
  float sum = 0.0;
  for (int i = 0; i < X_LEN; i++) {
    sum += float(x[i]) * float(x[i]);
  }
  result[0] = sqrt(sum);
}
`,f2=({inputs:r,output:e,target:t})=>(be({module:{name:"row_length",vs:OD},inputs:r,output:e,operationType:"float32",outputBuffer:t}),{success:!0})});function BD(){return{name:"segmentedMap",vs:`
uint read_segment_start(int segmentIndex) {
  TYPE value[1];
  read_source_values(segmentIndex, value);
  return uint(value[0]);
}

void segmentedMap(out TYPE result[RESULT_LEN]) {
  uint vertexIndex = uint(gl_InstanceID);
  int low = 0;
  int high = SEGMENTS_LENGTH;

  while (low < high) {
    int mid = low + (high - low) / 2;
    uint midStart = read_segment_start(mid);
    if (midStart <= vertexIndex) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  uint segmentIndex = uint(max(low - 1, 0));
  uint segmentStart = read_segment_start(int(segmentIndex));
  result[0] = segmentIndex;
  result[1] = vertexIndex - segmentStart;
}
`}}var h2,p2=_(()=>{K();vm();We();h2=async({inputs:r,output:e,target:t})=>{let{segments:n}=r,i=t.device,o=Ln("result",e.type,e.size),s=n.type,a=hu(n,s,i),c=new _e(i,{vs:`#version 300 es

void main() {
  TYPE result[RESULT_LEN];
  segmentedMap(result);
  set_result(result);
}
`,defines:{TYPE:"uint",RESULT_LEN:e.size.toString(),SEGMENTS_LENGTH:n.length.toString()},modules:[du(n,e.type,s),BD(),o],bindings:{source_values_texture:a},vertexCount:1,instanceCount:e.length,feedbackBufferMode:"interleaved",outputs:o.varyings});try{return c.run({outputBuffers:{[o.varyings[0]]:t}}),{success:!0}}finally{c.destroy(),a.destroy()}}});function wm(r,e,t,n){return t<e.size?`${r}[${t}]`:e.size===1?`${r}[0]`:n}var m2,g2=_(()=>{We();Ri();m2=async({inputs:r,output:e,target:t})=>{let n=ye(e.type,1,e.normalized),i=Lr(n);return be({module:{name:"select",vs:""},inputs:r,output:e,operationType:e.type,outputBuffer:t,expression:o=>{let s=wm("condition",r.condition,o,i),a=wm("whenTrue",r.whenTrue,o,i),c=wm("whenFalse",r.whenFalse,o,i);return`(${s} != ${i} ? ${a} : ${c})`}}),{success:!0}}});var _2,y2=_(()=>{K();We();_2=({inputs:r,output:e,target:t})=>{let n=Ln("result",e.type,e.size),i=new _e(t.device,{vs:`#version 300 es

void main() {
  int result[1];
  result[0] = START + gl_InstanceID * STEP;
  set_result(result);
}
`,defines:{START:r.start.toString(),STEP:r.step.toString()},modules:[n],vertexCount:1,instanceCount:e.length,feedbackBufferMode:"interleaved",outputs:n.varyings});try{return i.run({outputBuffers:{[n.varyings[0]]:t}}),{success:!0}}finally{i.destroy()}}});var b2,x2=_(()=>{We();b2=({inputs:r,output:e,target:t})=>{let{columns:n}=r;return be({module:{name:"swizzle",vs:"// swizzle expression handled inline"},expression:i=>`x[${n[i]}]`,inputs:{x:r.x},output:e,outputBuffer:t}),{success:!0}}});var v2={};Ut(v2,{arithmetic:()=>fu,dot:()=>a2,equalAll:()=>l2,extent:()=>JE,fround:()=>n2,gather:()=>o2,interleave:()=>t2,length:()=>f2,segmentedMap:()=>h2,select:()=>m2,sequence:()=>_2,swizzle:()=>b2});var w2=_(()=>{xm();e2();r2();i2();s2();c2();u2();d2();p2();g2();y2();x2()});function Ft(r,e){let t=DD(e),n=Math.max(1,Math.ceil(r)),i=Math.min(n,t),o=Math.min(Math.ceil(n/i),t),s=Math.ceil(n/i/o);if(s>t)throw new Error(`WebGPU dispatch requires ${n} workgroups, exceeding the 3D dispatch limit of ${t} per dimension`);return{x:i,y:o,z:s}}function Em(r,e="workgroupId"){return`((${e}.z * ${r.y}u + ${e}.y) * ${r.x}u + ${e}.x)`}function Ar(r,e,t="workgroupId",n="localId"){return`(${Em(r,t)} * ${e}u + ${n}.x)`}function DD(r){return Number.isFinite(r)&&r>0?Math.floor(r):65535}var Ii=_(()=>{});function Cr(r,e){switch(r){case"u32":return`${e}u`;case"f32":return Number.isInteger(e)?`${e}.0`:`${e}`;default:return`${e}`}}function E2(r,e){switch(r){case"uint32":return Cr("u32",Math.trunc(e));case"sint32":return`${Math.trunc(e)}`;case"float32":return Cr("f32",e);default:throw new Error(`WebGPU operations only support 32-bit output types, got ${r}`)}}function Mr(r){switch(r){case"uint32":return"0u";case"sint32":return"0";case"float32":return"0.0";default:throw new Error(`WebGPU operations only support 32-bit output types, got ${r}`)}}function q(r){switch(r){case"uint32":return"u32";case"sint32":return"i32";case"float32":return"f32";default:throw new Error(`WebGPU operations only support 32-bit storage types, got ${r}`)}}var An=_(()=>{});function xe({module:r,elementWise:e=!1,expression:t,inputs:n,output:i,operationType:o=i.type,outputBuffer:s}){if(!r.source)throw new Error(`WebGPU computation ${r.name} requires WGSL source`);let a=WD(n),c=a.map(([y,x])=>({name:y,input:x})),l=c.filter(({input:y})=>!y.isConstant).map((y,x)=>({...y,index:x})),u=q(o),f=q(i.type),d={TYPE:u,RESULT_LEN:i.size.toString()},h=Ft(Math.ceil(i.length/Pm),s.device.limits.maxComputeWorkgroupsPerDimension);for(let[y,x]of a)d[`${y.toUpperCase()}_LEN`]=x.size.toString();let p=`
${HD(r.source,d)}
${l.map(({name:y,input:x,index:v})=>UD(y,x,v)).join(`
`)}
${c.map(({name:y,input:x})=>GD(y,x,o)).join(`
`)}
${zD(i,l.length)}
${$D(i)}

@compute @workgroup_size(${Pm}) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_id) localId: vec3<u32>
) {
  let rowIndex = ${Ar(h,Pm)};
  if (rowIndex >= ${i.length}u) {
    return;
  }

${c.map(({name:y})=>`  let ${y} = read_${y}(rowIndex);`).join(`
`)}
  var result: array<${f}, ${i.size}>;
${VD(r.name,a,i,e,t)}
  write_result(rowIndex, result);
}
`,m=new $e(s.device,{source:p,modules:r.dependencies,shaderAssembler:FD,shaderLayout:{bindings:[...l.map(({name:y},x)=>({name:y,type:"storage",group:0,location:x})),{name:"result",type:"storage",group:0,location:l.length}]}}),g=Object.fromEntries(l.map(({name:y,input:x})=>[y,x.buffer]));g.result=s,m.setBindings(g);let b=s.device.beginComputePass({});s.device.statsManager.getStats(kD).get(ND).incrementCount(),m.dispatch(b,h.x,h.y,h.z),b.end(),s.device.submit(),m.destroy()}function UD(r,e,t){if(e.isConstant)return"";let n=q(e.type);return`@group(0) @binding(${t}) var<storage, read> ${r}: array<${n}>;`}function GD(r,e,t){let n=q(t),i=e.type===t?"":n,o=e.stride/e.ValueType.BYTES_PER_ELEMENT,s=e.offset/e.ValueType.BYTES_PER_ELEMENT;return e.isConstant?`fn read_${r}(_rowIndex: u32) -> array<${n}, ${e.size}> {
  return array<${n}, ${e.size}>(${jD(e,i)});
}`:`fn read_${r}(rowIndex: u32) -> array<${n}, ${e.size}> {
  var value: array<${n}, ${e.size}>;
  let rowOffset = ${s}u + rowIndex * ${o}u;
${Array.from({length:e.size},(a,c)=>i?`  value[${c}] = ${i}(${r}[rowOffset + ${c}u]);`:`  value[${c}] = ${r}[rowOffset + ${c}u];`).join(`
`)}
  return value;
}`}function zD(r,e){let t=q(r.type);return`@group(0) @binding(${e}) var<storage, read_write> result: array<${t}>;`}function $D(r){let e=r.stride/r.ValueType.BYTES_PER_ELEMENT,t=r.offset/r.ValueType.BYTES_PER_ELEMENT;return`fn write_result(rowIndex: u32, value: array<${q(r.type)}, ${r.size}>) {
  let rowOffset = ${t}u + rowIndex * ${e}u;
${Array.from({length:r.size},(i,o)=>`  result[rowOffset + ${o}u] = value[${o}];`).join(`
`)}
}`}function VD(r,e,t,n,i){let o="";if(i)for(let s=0;s<t.size;s++)o+=`  result[${s}] = ${i(s)};
`;else if(n){let s=Mr(t.type),a=q(t.type);for(let c=0;c<t.size;c++){let l=e.map(([u,f])=>c<f.size?q(f.type)===a?`${u}[${c}]`:`${a}(${u}[${c}])`:s);o+=`  result[${c}] = ${r}(${l.join(", ")});
`}}else o+=`result = ${r}(${e.map(([s])=>s).join(", ")});`;return o.trimEnd()}function WD(r){return Array.isArray(r)?r.map((e,t)=>[`x${t}`,e]):Object.entries(r)}function jD(r,e){let t=r.value;if(!t)throw new Error(`Constant input ${r} is missing CPU values`);return Array.from({length:r.size},(n,i)=>Cr(e,t[i]??0)).join(", ")}function HD(r,e){for(let t in e)r=r.replaceAll(`{${t}}`,e[t]);return r}var Pm,kD,ND,FD,nr=_(()=>{K();Me();Ii();An();Pm=64,kD="GPGPU Operation Counts",ND="Computation Runs",FD=new pr});var YD,P2,S2=_(()=>{Me();_m();cu();nr();An();YD=`fn arithmetic_add(x: {TYPE}, y: {TYPE}) -> {TYPE} {
  return x + y;
}

fn arithmetic_subtract(x: {TYPE}, y: {TYPE}) -> {TYPE} {
  return x - y;
}

fn arithmetic_multiply(x: {TYPE}, y: {TYPE}) -> {TYPE} {
  return x * y;
}

fn arithmetic_divide(x: {TYPE}, y: {TYPE}) -> {TYPE} {
  return x / y;
}

fn arithmetic_tan(x: f32) -> f32 {
  return tan_fp32(x);
}
`,P2=({inputs:r,output:e,target:t})=>{let n=e.type,i=q(n),o=Mr(n),s=r.namedInputs;return xe({module:{name:"arithmetic",source:YD,dependencies:[on]},inputs:s,output:e,operationType:n,outputBuffer:t,expression:a=>lu(r.expression,{operations:Ci,inputs:s,laneIndex:a,formatInput:c=>`${c}[${a}]`,formatOutOfBoundsInput:c=>s[c].size===1?`${c}[0]`:o,formatLiteral:c=>{let l=Array.isArray(c)?c[a]??0:c;return`${i}(${E2(n,l)})`},formatCall:(c,l)=>`${c}(${l.join(", ")})`})}),{success:!0}}});var qD,T2,L2=_(()=>{nr();qD=`fn row_dot(x: array<{TYPE}, {X_LEN}>, y: array<{TYPE}, {Y_LEN}>) -> array<f32, 1> {
  var sum = 0.0;
  for (var i = 0u; i < {X_LEN}u; i = i + 1u) {
    sum += f32(x[i]) * f32(y[i]);
  }
  return array<f32, 1>(sum);
}
`,T2=({inputs:r,output:e,target:t})=>(xe({module:{name:"row_dot",source:qD},inputs:r,output:e,operationType:"float32",outputBuffer:t}),{success:!0})});var ZD,A2,C2=_(()=>{nr();ZD=`fn equalAll(x: array<{TYPE}, {X_LEN}>, y: array<{TYPE}, {Y_LEN}>) -> array<u32, 1> {
  var allEqual = 1u;
  for (var i = 0u; i < {X_LEN}u; i = i + 1u) {
    if (x[i] != y[i]) {
      allEqual = 0u;
      break;
    }
  }
  return array<u32, 1>(allEqual);
}
`,A2=({inputs:r,output:e,target:t})=>(xe({module:{name:"equalAll",source:ZD},inputs:r,output:e,operationType:r.x.type,outputBuffer:t}),{success:!0})});function Oi(r,e,t){let n=q(e.type);return`@group(0) @binding(${t}) var<storage, read> ${r}: array<${n}>;`}function Sm(r,e,t,n=r){let i=q(t);if(e.isConstant){let l=e.value;if(!l)throw new Error(`Constant input ${e} is missing CPU values`);return`fn read_${n}(_sourceIndex: u32) -> array<${i}, ${e.size}> {
  return array<${i}, ${e.size}>(${Array.from({length:e.size},(u,f)=>Cr(i,l[f]??0)).join(", ")});
}`}let o=e.stride/e.ValueType.BYTES_PER_ELEMENT,s=e.offset/e.ValueType.BYTES_PER_ELEMENT,c=q(e.type)===i?"":`${i}`;return`fn read_${n}(sourceIndex: u32) -> array<${i}, ${e.size}> {
  var value: array<${i}, ${e.size}>;
  let rowOffset = ${s}u + sourceIndex * ${o}u;
${Array.from({length:e.size},(l,u)=>c?`  value[${u}] = ${c}(${r}[rowOffset + ${u}u]);`:`  value[${u}] = ${r}[rowOffset + ${u}u];`).join(`
`)}
  return value;
}`}function pu(r,e){return Sm("sourceValues",r,e,"source_values")}function Bi(r,e){let t=q(r.type);return`@group(0) @binding(${e}) var<storage, read_write> result: array<${t}>;`}function Di(r){let e=r.stride/r.ValueType.BYTES_PER_ELEMENT,t=r.offset/r.ValueType.BYTES_PER_ELEMENT;return`fn write_result(rowIndex: u32, value: array<${q(r.type)}, ${r.size}>) {
  let rowOffset = ${t}u + rowIndex * ${e}u;
${Array.from({length:r.size},(i,o)=>`  result[rowOffset + ${o}u] = value[${o}];`).join(`
`)}
}`}function M2(r,e){let t=Mr(r);return`fn zero_result() -> array<${q(r)}, ${e}> {
  var result: array<${q(r)}, ${e}>;
${Array.from({length:e},(n,i)=>`  result[${i}] = ${t};`).join(`
`)}
  return result;
}`}var Ae,mu=_(()=>{An();Ae=64});function XD({input:r,inputMode:e,inputGroupCount:t,channelCount:n,outputType:i,outputBuffer:o,outputLength:s,outputStride:a,outputOffset:c}){let l=q(i),u=Ft(s,o.device.limits.maxComputeWorkgroupsPerDimension),f=new j({buffer:o,type:i,size:2,length:s,stride:a,offset:c}),d=`
${r.isConstant?"":Oi("sourceValues",r,0)}
${pu(r,i)}
${Bi(f,r.isConstant?0:1)}
${Di(f)}
${KD(e,i,n,t)}

var<workgroup> sharedMin: array<${l}, ${Ae}>;
var<workgroup> sharedMax: array<${l}, ${Ae}>;

@compute @workgroup_size(${Ae}) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_id) localId: vec3<u32>
) {
  let outputRowIndex = ${Em(u)};
  if (outputRowIndex >= ${s}u) {
    return;
  }

  let channelIndex = outputRowIndex % ${n}u;
  let outputGroupIndex = outputRowIndex / ${n}u;
  let inputGroupIndex = outputGroupIndex * ${Ae}u + localId.x;

  let result = extent_pass(channelIndex, inputGroupIndex);
  sharedMin[localId.x] = result[0];
  sharedMax[localId.x] = result[1];
  workgroupBarrier();

  var stride = ${Math.floor(Ae/2)}u;
  loop {
    if (stride == 0u) {
      break;
    }
    if (localId.x < stride) {
      let compareIndex = localId.x + stride;
      if (sharedMin[compareIndex] < sharedMin[localId.x]) {
        sharedMin[localId.x] = sharedMin[compareIndex];
      }
      if (sharedMax[compareIndex] > sharedMax[localId.x]) {
        sharedMax[localId.x] = sharedMax[compareIndex];
      }
    }
    workgroupBarrier();
    stride = stride / 2u;
  }

  if (localId.x == 0u) {
    write_result(outputRowIndex, array<${l}, 2>(sharedMin[0], sharedMax[0]));
  }
}
`,h=new $e(o.device,{source:d,shaderLayout:{bindings:[...r.isConstant?[]:[{name:"sourceValues",type:"storage",group:0,location:0}],{name:"result",type:"storage",group:0,location:r.isConstant?0:1}]}}),p={result:o};r.isConstant||(p.sourceValues=r.buffer),h.setBindings(p);let m=o.device.beginComputePass({});h.dispatch(m,u.x,u.y,u.z),m.end(),o.device.submit(),h.destroy()}function KD(r,e,t,n){let i=q(e),[o,s]=QD(e);return r==="raw"?`fn extent_pass(channelIndex: u32, inputGroupIndex: u32) -> array<${i}, 2> {
  var result: array<${i}, 2>;
  result[0] = ${o};
  result[1] = ${s};

  if (inputGroupIndex < ${n}u) {
    let value = read_source_values(inputGroupIndex);
    result[0] = value[channelIndex];
    result[1] = value[channelIndex];
  }

  return result;
}`:`fn extent_pass(channelIndex: u32, inputGroupIndex: u32) -> array<${i}, 2> {
  var result: array<${i}, 2>;
  result[0] = ${o};
  result[1] = ${s};

  if (inputGroupIndex < ${n}u) {
    let rowIndex = inputGroupIndex * ${t}u + channelIndex;
    let value = read_source_values(rowIndex);
    result[0] = value[0];
    result[1] = value[1];
  }

  return result;
}`}function QD(r){switch(r){case"uint32":return["0xffffffffu","0u"];case"sint32":return["2147483647","-2147483648"];case"float32":return["3.402823e38","-3.402823e38"];default:throw new Error(`Unsupported WebGPU extent type for ${r}`)}}var R2,I2=_(()=>{K();rr();$s();Ii();An();mu();R2=({inputs:r,output:e,target:t})=>{let{sourceValues:n}=r;if(n.length===0){let c=new e.ValueType(e.length*e.size);return t.write(c),{success:!0,value:c}}if(n.isConstant){let c=n.value;if(!c)throw new Error(`Constant input ${n} is missing CPU values`);let l=new e.ValueType(e.length*e.size);for(let u=0;u<e.length;u++){let f=c[u];l[u*2]=f,l[u*2+1]=f}return t.write(l),{success:!0,value:l}}let i=[],o=n,s="raw",a=n.length;try{for(;;){let c=Math.ceil(a/Ae),l=e.length*c,u=c===1?t:Le.createOrReuse(t.device,l*e.stride);if(c>1&&i.push(u),XD({input:o,inputMode:s,inputGroupCount:a,channelCount:e.length,outputType:e.type,outputBuffer:u,outputLength:l,outputStride:e.stride,outputOffset:e.offset}),c===1)break;o=new j({buffer:u,type:e.type,size:2,length:l}),s="partial",a=c}return{success:!0}}finally{for(let c of i)Le.recycle(c)}}});function JD(){let r=new Uint16Array([255]);return new Uint8Array(r.buffer)[0]>0}var ek,O2,B2=_(()=>{nr();ek=`const LE: bool = ${JD()?"true":"false"};
const F32_NAN: u32 = 0xffffffffu;
const F32_INF: u32 = 0x7f800000u;

fn roundShiftRight(value: u32, shift: i32) -> u32 {
  if (shift <= 0) {
    return value << u32(-shift);
  }

  if (shift >= 32) {
    if (shift == 32 && value > 0x80000000u) {
      return 1u;
    }
    return 0u;
  }

  let shiftU32 = u32(shift);
  let truncated = value >> shiftU32;
  let halfShift = 1u << u32(shift - 1);
  let remainder = value & ((1u << shiftU32) - 1u);
  if (remainder > halfShift || (remainder == halfShift && (truncated & 1u) == 1u)) {
    return truncated + 1u;
  }
  return truncated;
}

fn makeFloatImmediate(sign: u32, exponent: i32, mantissa: u32) -> u32 {
  return (sign << 31u) | (u32(exponent + 127) << 23u) | (mantissa & 0x7fffffu);
}

fn makeFloat(sign: u32, exponent: i32, significand: u32) -> u32 {
  if (significand == 0u) {
    return sign << 31u;
  }

  let leadingZeros = i32(countLeadingZeros(significand));
  var normalizedExponent = exponent + 31 - leadingZeros;

  if (normalizedExponent > 127) {
    return (sign << 31u) | F32_INF;
  }

  var mantissa: u32;
  if (normalizedExponent >= -126) {
    mantissa = roundShiftRight(significand, 8 - leadingZeros);
    if (mantissa >= 0x1000000u) {
      mantissa = mantissa >> 1u;
      normalizedExponent += 1;
      if (normalizedExponent > 127) {
        return (sign << 31u) | F32_INF;
      }
    }
    return makeFloatImmediate(sign, normalizedExponent, mantissa);
  }

  let subnormalShift = -149 - exponent;
  mantissa = roundShiftRight(significand, subnormalShift);
  if (mantissa >= 0x800000u) {
    return (sign << 31u) | (1u << 23u);
  }
  return (sign << 31u) | mantissa;
}

fn parseAsDouble(words: vec2<u32>) -> vec2<u32> {
  var d = words;
  if (LE) {
    d = d.yx;
  }

  let sign = (d.x >> 31u) & 1u;
  let exponentBits = (d.x >> 20u) & 0x7ffu;
  let exponent = i32(exponentBits) - 1023;
  let fractionHigh = d.x & 0xfffffu;
  let fractionLow = d.y;

  if (exponentBits == 0x7ffu) {
    if (fractionHigh == 0u && fractionLow == 0u) {
      return vec2<u32>((sign << 31u) | F32_INF, F32_NAN);
    }
    return vec2<u32>(F32_NAN);
  }

  if (exponentBits == 0u) {
    return vec2<u32>(sign << 31u);
  }

  if (exponent > 127) {
    return vec2<u32>((sign << 31u) | F32_INF, ((1u - sign) << 31u) | F32_INF);
  }

  let highSignificand = 0x800000u | (fractionHigh << 3u) | (fractionLow >> 29u);
  let lowSignificand = fractionLow & 0x1fffffffu;

  if (exponent < -126) {
    let highPart = makeFloat(sign, exponent - 23, highSignificand);
    let lowPart = makeFloat(sign, exponent - 52, lowSignificand);
    return vec2<u32>(highPart, lowPart);
  }

  let roundUp = lowSignificand > 0x10000000u ||
    (lowSignificand == 0x10000000u && (highSignificand & 1u) == 1u);

  var roundedSignificand = highSignificand + select(0u, 1u, roundUp);
  var highExponent = exponent;
  if (roundedSignificand == 0x1000000u) {
    roundedSignificand = 0x800000u;
    highExponent += 1;
  }

  if (highExponent > 127) {
    return vec2<u32>((sign << 31u) | F32_INF, ((1u - sign) << 31u) | F32_INF);
  }

  let highPart = makeFloatImmediate(sign, highExponent, roundedSignificand);

  var remainder = i32(lowSignificand);
  var lowSign = sign;
  if (roundUp) {
    remainder -= 0x20000000;
  }
  if (remainder < 0) {
    lowSign = 1u - sign;
    remainder = -remainder;
  }

  let lowPart = makeFloat(lowSign, exponent - 52, u32(remainder));
  return vec2<u32>(highPart, lowPart);
}

fn fround(x: array<u32, {X_LEN}>) -> array<f32, {RESULT_LEN}> {
  var result: array<f32, {RESULT_LEN}>;
  let n = {X_LEN}u / 2u;
  for (var i = 0u; i < n; i = i + 1u) {
    let parts = parseAsDouble(vec2<u32>(x[i * 2u], x[i * 2u + 1u]));
    result[i] = bitcast<f32>(parts.x);
    result[i + n] = bitcast<f32>(parts.y);
  }
  return result;
}
`,O2=({inputs:r,output:e,target:t})=>(xe({module:{name:"fround",source:ek},inputs:r,output:e,operationType:"uint32",outputBuffer:t}),{success:!0})});function tk(r,e){if(r.isConstant){let i=r.value;if(!i)throw new Error(`Constant input ${r} is missing CPU values`);return`fn read_ids(_rowIndex: u32) -> ${e} {
  return ${Cr(e,i[0]??0)};
}`}let t=r.stride/r.ValueType.BYTES_PER_ELEMENT,n=r.offset/r.ValueType.BYTES_PER_ELEMENT;return`fn read_ids(rowIndex: u32) -> ${e} {
  let rowOffset = ${n}u + rowIndex * ${t}u;
  return ids[rowOffset];
}`}function rk(r,e,t,n){let i=q(r),o=q(e);return`fn gather(idsValue: ${i}) -> array<${o}, ${t}> {
  let sourceIndex = ${i==="u32"?"i32(idsValue)":i==="i32"?"idsValue":"i32(idsValue)"};
  if (sourceIndex < 0 || sourceIndex >= ${n}) {
    return zero_result();
  }
  return read_source_values(u32(sourceIndex));
}`}var D2,k2=_(()=>{K();Ii();An();mu();D2=async({inputs:r,output:e,target:t})=>{let{ids:n,sourceValues:i}=r,o=q(n.type),s=[];n.isConstant||s.push({name:"ids",input:n,index:s.length}),i.isConstant||s.push({name:"sourceValues",input:i,index:s.length});let a=Ft(Math.ceil(e.length/Ae),t.device.limits.maxComputeWorkgroupsPerDimension),c=`
${s.map(({name:d,input:h,index:p})=>Oi(d,h,p)).join(`
`)}
${tk(n,o)}
${pu(i,e.type)}
${Bi(e,s.length)}
${Di(e)}
${M2(e.type,e.size)}
${rk(n.type,e.type,e.size,i.length)}

@compute @workgroup_size(${Ae}) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_id) localId: vec3<u32>
) {
  let rowIndex = ${Ar(a,Ae)};
  if (rowIndex >= ${e.length}u) {
    return;
  }

  let idsValue = read_ids(rowIndex);
  let result = gather(idsValue);
  write_result(rowIndex, result);
}
`,l=new $e(t.device,{source:c,shaderLayout:{bindings:[...s.map(({name:d,index:h})=>({name:d,type:"storage",group:0,location:h})),{name:"result",type:"storage",group:0,location:s.length}]}}),u={};n.isConstant||(u.ids=n.buffer),i.isConstant||(u.sourceValues=i.buffer),u.result=t,l.setBindings(u);let f=t.device.beginComputePass({});return l.dispatch(f,a.x,a.y,a.z),f.end(),t.device.submit(),l.destroy(),{success:!0}}});function nk(r){return`fn segmented_map(vertexIndex: u32) -> array<u32, 2> {
  var low = 0i;
  var high = ${r}i;
  while (low < high) {
    let mid = low + (high - low) / 2i;
    let midStart = read_segments(u32(mid))[0];
    if (midStart <= vertexIndex) {
      low = mid + 1i;
    } else {
      high = mid;
    }
  }

  let segmentIndex = u32(max(low - 1i, 0i));
  let segmentStart = read_segments(segmentIndex)[0];
  return array<u32, 2>(segmentIndex, vertexIndex - segmentStart);
}`}var N2,F2=_(()=>{K();Ii();mu();N2=async({inputs:r,output:e,target:t})=>{let{segments:n}=r,i=n.isConstant?[]:[{name:"segments",input:n,index:0}],o=Ft(Math.ceil(e.length/Ae),t.device.limits.maxComputeWorkgroupsPerDimension),s=`
${i.map(({name:u,input:f,index:d})=>Oi(u,f,d)).join(`
`)}
${Sm("segments",n,"uint32")}
${Bi(e,i.length)}
${Di(e)}
${nk(n.length)}

@compute @workgroup_size(${Ae}) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_id) localId: vec3<u32>
) {
  let rowIndex = ${Ar(o,Ae)};
  if (rowIndex >= ${e.length}u) {
    return;
  }

  let result = segmented_map(rowIndex);
  write_result(rowIndex, result);
}
`,a=new $e(t.device,{source:s,shaderLayout:{bindings:[...i.map(({name:u,index:f})=>({name:u,type:"storage",group:0,location:f})),{name:"result",type:"storage",group:0,location:i.length}]}}),c=Object.fromEntries(i.map(({name:u,input:f})=>[u,f.buffer]));c.result=t,a.setBindings(c);let l=t.device.beginComputePass({});return a.dispatch(l,o.x,o.y,o.z),l.end(),t.device.submit(),a.destroy(),{success:!0}}});function ik(r,e){let n=e.filter(([,i])=>!i.isConstant).length+1;if(n>r.maxStorageBuffersPerShaderStage)throw new Error(`interleave() requires ${n} storage buffers, exceeding device limit ${r.maxStorageBuffersPerShaderStage}`);if(n>r.maxBindingsPerBindGroup)throw new Error(`interleave() requires ${n} bindings, exceeding bind group limit ${r.maxBindingsPerBindGroup}`)}var gu,U2=_(()=>{nr();gu=({inputs:r,output:e,target:t})=>{let n=r.map((c,l)=>[`x${l}`,c]);ik(t.device.limits,n);let i=n.map(([c,l])=>`${c}: array<{TYPE}, ${l.size}>`).join(", "),o=0,s=n.map(([c,l])=>{let u=Array.from({length:l.size},(f,d)=>`  out[${o+d}] = ${c}[${d}];`).join(`
`);return o+=l.size,u}).join(`
`),a=`fn interleave(${i}) -> array<{TYPE}, {RESULT_LEN}> {
  var out: array<{TYPE}, {RESULT_LEN}>;
${s}
  return out;
}
`;return xe({module:{name:"interleave",source:a},inputs:r,output:e,outputBuffer:t}),{success:!0}}});var ok,G2,z2=_(()=>{nr();ok=`fn row_length(x: array<{TYPE}, {X_LEN}>) -> array<f32, 1> {
  var sum = 0.0;
  for (var i = 0u; i < {X_LEN}u; i = i + 1u) {
    sum += f32(x[i]) * f32(x[i]);
  }
  return array<f32, 1>(sqrt(sum));
}
`,G2=({inputs:r,output:e,target:t})=>(xe({module:{name:"row_length",source:ok},inputs:r,output:e,operationType:"float32",outputBuffer:t}),{success:!0})});function Tm(r,e,t,n){return t<e.size?`${r}[${t}]`:e.size===1?`${r}[0]`:n}var $2,V2=_(()=>{nr();An();$2=async({inputs:r,output:e,target:t})=>{let n=Mr(e.type);return xe({module:{name:"select",source:`// inline expression select
`},inputs:r,output:e,operationType:e.type,outputBuffer:t,expression:i=>{let o=Tm("condition",r.condition,i,n),s=Tm("whenTrue",r.whenTrue,i,n);return`select(${Tm("whenFalse",r.whenFalse,i,n)}, ${s}, ${o} != ${n})`}}),{success:!0}}});var Lm,W2,j2=_(()=>{K();Ii();Lm=64,W2=({inputs:r,output:e,target:t})=>{let n=Ft(Math.ceil(e.length/Lm),t.device.limits.maxComputeWorkgroupsPerDimension),i=`@group(0) @binding(0) var<storage, read_write> result: array<i32>;

@compute @workgroup_size(${Lm}) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_id) localId: vec3<u32>
) {
  let rowIndex = ${Ar(n,Lm)};
  if (rowIndex >= ${e.length}u) {
    return;
  }

  let rowOffset = ${e.offset/e.ValueType.BYTES_PER_ELEMENT}u + rowIndex * ${e.stride/e.ValueType.BYTES_PER_ELEMENT}u;
  result[rowOffset] = ${r.start} + i32(rowIndex) * ${r.step};
}
`,o=new $e(t.device,{source:i,shaderLayout:{bindings:[{name:"result",type:"storage",group:0,location:0}]}});o.setBindings({result:t});let s=t.device.beginComputePass({});return o.dispatch(s,n.x,n.y,n.z),s.end(),t.device.submit(),o.destroy(),{success:!0}}});var H2,Y2=_(()=>{nr();H2=({inputs:r,output:e,target:t})=>{let{columns:n}=r;return xe({module:{name:"swizzle",source:"// swizzle expression handled inline"},expression:i=>`x[${n[i]}]`,inputs:{x:r.x},output:e,outputBuffer:t}),{success:!0}}});var q2={};Ut(q2,{arithmetic:()=>P2,dot:()=>T2,equalAll:()=>A2,extent:()=>R2,fround:()=>O2,gather:()=>D2,interleave:()=>gu,length:()=>G2,segmentedMap:()=>N2,select:()=>$2,sequence:()=>W2,swizzle:()=>H2});var Am=_(()=>{S2();L2();C2();I2();B2();k2();F2();U2();z2();V2();j2();Y2()});function _a(r,e){if(!r)throw new Error(e||"loader assertion failed.")}var pt={self:typeof self<"u"&&self,window:typeof window<"u"&&window,global:typeof global<"u"&&global,document:typeof document<"u"&&document},uS=pt.self||pt.window||pt.global||{},fS=pt.window||pt.self||pt.global||{},dS=pt.global||pt.self||pt.window||{},hS=pt.document||{};var Yi=!!(typeof process!="object"||String(process)!=="[object process]"||process.browser);var ng=typeof process<"u"&&process.version&&/v([0-9]*)/.exec(process.version),pS=ng&&parseFloat(ng[1])||0;Zi();var Ku="4.4.5",wS=Ku[0]>="0"&&Ku[0]<="9"?`v${Ku}`:"";function ES(){let r=new we({id:"loaders.gl"});return globalThis.loaders||={},globalThis.loaders.log=r,globalThis.loaders.version=wS,globalThis.probe||={},globalThis.probe.loaders=r,r}var Qu=ES();var PS=r=>typeof r=="boolean",gt=r=>typeof r=="function",_t=r=>r!==null&&typeof r=="object",Pa=r=>_t(r)&&r.constructor==={}.constructor;var Ju=r=>typeof SharedArrayBuffer<"u"&&r instanceof SharedArrayBuffer,Bn=r=>_t(r)&&typeof r.byteLength=="number"&&typeof r.slice=="function";var ef=r=>!!r&&gt(r[Symbol.iterator]),tf=r=>!!r&&gt(r[Symbol.asyncIterator]);var Ne=r=>typeof Response<"u"&&r instanceof Response||_t(r)&&gt(r.arrayBuffer)&&gt(r.text)&&gt(r.json);var Fe=r=>typeof Blob<"u"&&r instanceof Blob;var bg=r=>typeof ReadableStream<"u"&&r instanceof ReadableStream||_t(r)&&gt(r.tee)&&gt(r.cancel)&&gt(r.getReader);var xg=r=>_t(r)&&gt(r.read)&&gt(r.pipe)&&PS(r.readable),Xi=r=>bg(r)||xg(r);function rf(r,e){return vg(r||{},e)}function vg(r,e,t=0){if(t>3)return e;let n={...r};for(let[i,o]of Object.entries(e))o&&typeof o=="object"&&!Array.isArray(o)?n[i]=vg(n[i]||{},e[i],t+1):n[i]=e[i];return n}var wg="latest";function SS(){return globalThis._loadersgl_?.version||(globalThis._loadersgl_=globalThis._loadersgl_||{},globalThis._loadersgl_.version="4.4.5"),globalThis._loadersgl_.version}var Eg=SS();function Ee(r,e){if(!r)throw new Error(e||"loaders.gl assertion failed.")}var yt={self:typeof self<"u"&&self,window:typeof window<"u"&&window,global:typeof global<"u"&&global,document:typeof document<"u"&&document},qN=yt.self||yt.window||yt.global||{},ZN=yt.window||yt.self||yt.global||{},XN=yt.global||yt.self||yt.window||{},KN=yt.document||{};var He=typeof process!="object"||String(process)!=="[object process]"||process.browser;var Sg=typeof window<"u"&&typeof window.orientation<"u",Pg=typeof process<"u"&&process.version&&/v([0-9]*)/.exec(process.version),QN=Pg&&parseFloat(Pg[1])||0;var Ki=class{name;workerThread;isRunning=!0;result;_resolve=()=>{};_reject=()=>{};constructor(e,t){this.name=e,this.workerThread=t,this.result=new Promise((n,i)=>{this._resolve=n,this._reject=i})}postMessage(e,t){this.workerThread.postMessage({source:"loaders.gl",type:e,payload:t})}done(e){Ee(this.isRunning),this.isRunning=!1,this._resolve(e)}error(e){Ee(this.isRunning),this.isRunning=!1,this._reject(e)}};var Dn=class{terminate(){}};var nf=new Map;function Tg(r){Ee(r.source&&!r.url||!r.source&&r.url);let e=nf.get(r.source||r.url);return e||(r.url&&(e=TS(r.url),nf.set(r.url,e)),r.source&&(e=Lg(r.source),nf.set(r.source,e))),Ee(e),e}function TS(r){if(!r.startsWith("http"))return r;let e=LS(r);return Lg(e)}function Lg(r){let e=new Blob([r],{type:"application/javascript"});return URL.createObjectURL(e)}function LS(r){return`try {
  importScripts('${r}');
} catch (error) {
  console.error(error);
  throw error;
}`}function of(r,e=!0,t){let n=t||new Set;if(r){if(Ag(r))n.add(r);else if(Ag(r.buffer))n.add(r.buffer);else if(!ArrayBuffer.isView(r)){if(e&&typeof r=="object")for(let i in r)of(r[i],e,n)}}return t===void 0?Array.from(n):[]}function Ag(r){return r?r instanceof ArrayBuffer||typeof MessagePort<"u"&&r instanceof MessagePort||typeof ImageBitmap<"u"&&r instanceof ImageBitmap||typeof OffscreenCanvas<"u"&&r instanceof OffscreenCanvas:!1}var sf=()=>{},or=class{name;source;url;terminated=!1;worker;onMessage;onError;_loadableURL="";static isSupported(){return typeof Worker<"u"&&He||typeof Dn<"u"&&!He}constructor(e){let{name:t,source:n,url:i}=e;Ee(n||i),this.name=t,this.source=n,this.url=i,this.onMessage=sf,this.onError=o=>console.log(o),this.worker=He?this._createBrowserWorker():this._createNodeWorker()}destroy(){this.onMessage=sf,this.onError=sf,this.worker.terminate(),this.terminated=!0}get isRunning(){return!!this.onMessage}postMessage(e,t){t=t||of(e),this.worker.postMessage(e,t)}_getErrorFromErrorEvent(e){let t="Failed to load ";return t+=`worker ${this.name} from ${this.url}. `,e.message&&(t+=`${e.message} in `),e.lineno&&(t+=`:${e.lineno}:${e.colno}`),new Error(t)}_createBrowserWorker(){this._loadableURL=Tg({source:this.source,url:this.url});let e=new Worker(this._loadableURL,{name:this.name});return e.onmessage=t=>{t.data?this.onMessage(t.data):this.onError(new Error("No data received"))},e.onerror=t=>{this.onError(this._getErrorFromErrorEvent(t)),this.terminated=!0},e.onmessageerror=t=>console.error(t),e}_createNodeWorker(){let e;if(this.url){let n=this.url.includes(":/")||this.url.startsWith("/")?this.url:`./${this.url}`,i=this.url.endsWith(".ts")||this.url.endsWith(".mjs")?"module":"commonjs";e=new Dn(n,{eval:!1,type:i})}else if(this.source)e=new Dn(this.source,{eval:!0});else throw new Error("no worker");return e.on("message",t=>{this.onMessage(t)}),e.on("error",t=>{this.onError(t)}),e.on("exit",t=>{}),e}};var Qi=class{name="unnamed";source;url;maxConcurrency=1;maxMobileConcurrency=1;onDebug=()=>{};reuseWorkers=!0;props={};jobQueue=[];idleQueue=[];count=0;isDestroyed=!1;static isSupported(){return or.isSupported()}constructor(e){this.source=e.source,this.url=e.url,this.setProps(e)}destroy(){this.idleQueue.forEach(e=>e.destroy()),this.isDestroyed=!0}setProps(e){this.props={...this.props,...e},e.name!==void 0&&(this.name=e.name),e.maxConcurrency!==void 0&&(this.maxConcurrency=e.maxConcurrency),e.maxMobileConcurrency!==void 0&&(this.maxMobileConcurrency=e.maxMobileConcurrency),e.reuseWorkers!==void 0&&(this.reuseWorkers=e.reuseWorkers),e.onDebug!==void 0&&(this.onDebug=e.onDebug)}async startJob(e,t=(i,o,s)=>i.done(s),n=(i,o)=>i.error(o)){let i=new Promise(o=>(this.jobQueue.push({name:e,onMessage:t,onError:n,onStart:o}),this));return this._startQueuedJob(),await i}async _startQueuedJob(){if(!this.jobQueue.length)return;let e=this._getAvailableWorker();if(!e)return;let t=this.jobQueue.shift();if(t){this.onDebug({message:"Starting job",name:t.name,workerThread:e,backlog:this.jobQueue.length});let n=new Ki(t.name,e);e.onMessage=i=>t.onMessage(n,i.type,i.payload),e.onError=i=>t.onError(n,i),t.onStart(n);try{await n.result}catch(i){console.error(`Worker exception: ${i}`)}finally{this.returnWorkerToQueue(e)}}}returnWorkerToQueue(e){!He||this.isDestroyed||!this.reuseWorkers||this.count>this._getMaxConcurrency()?(e.destroy(),this.count--):this.idleQueue.push(e),this.isDestroyed||this._startQueuedJob()}_getAvailableWorker(){if(this.idleQueue.length>0)return this.idleQueue.shift()||null;if(this.count<this._getMaxConcurrency()){this.count++;let e=`${this.name.toLowerCase()} (#${this.count} of ${this.maxConcurrency})`;return new or({name:e,source:this.source,url:this.url})}return null}_getMaxConcurrency(){return Sg?this.maxMobileConcurrency:this.maxConcurrency}};var AS={maxConcurrency:3,maxMobileConcurrency:1,reuseWorkers:!0,onDebug:()=>{}},Or=class r{props;workerPools=new Map;static _workerFarm;static isSupported(){return or.isSupported()}static getWorkerFarm(e={}){return r._workerFarm=r._workerFarm||new r({}),r._workerFarm.setProps(e),r._workerFarm}constructor(e){this.props={...AS},this.setProps(e),this.workerPools=new Map}destroy(){for(let e of this.workerPools.values())e.destroy();this.workerPools=new Map}setProps(e){this.props={...this.props,...e};for(let t of this.workerPools.values())t.setProps(this._getWorkerPoolProps())}getWorkerPool(e){let{name:t,source:n,url:i}=e,o=this.workerPools.get(t);return o||(o=new Qi({name:t,source:n,url:i}),o.setProps(this._getWorkerPoolProps()),this.workerPools.set(t,o)),o}_getWorkerPoolProps(){return{maxConcurrency:this.props.maxConcurrency,maxMobileConcurrency:this.props.maxMobileConcurrency,reuseWorkers:this.props.reuseWorkers,onDebug:this.props.onDebug}}};function af(r,e={}){let t=e[r.id]||{},n=He?`${r.id}-worker.js`:`${r.id}-worker-node.js`,i=t.workerUrl;if(!i&&r.id==="compression"&&(i=e.workerUrl),(e._workerType||e?.core?._workerType)==="test"&&(He?i=`modules/${r.module}/dist/${n}`:i=`modules/${r.module}/src/workers/${r.id}-worker-node.ts`),!i){let s=r.version;s==="latest"&&(s=wg);let a=s?`@${s}`:"";i=`https://unpkg.com/@loaders.gl/${r.module}${a}/dist/${n}`}return Ee(i),i}function cf(r,e=Eg){Ee(r,"no worker provided");let t=r.version;return!(!e||!t)}function lf(r,e){if(!Or.isSupported())return!1;let t=e?._nodeWorkers??e?.core?._nodeWorkers;if(!He&&!t)return!1;let n=e?.worker??e?.core?.worker;return!!(r.worker&&n)}async function uf(r,e,t,n,i){let o=r.id,s=af(r,t),c=Or.getWorkerFarm(t?.core).getWorkerPool({name:o,url:s});t=JSON.parse(JSON.stringify(t)),n=JSON.parse(JSON.stringify(n||{}));let l=await c.startJob("process-on-worker",CS.bind(null,i));return l.postMessage("process",{input:e,options:t,context:n}),await(await l.result).result}async function CS(r,e,t,n){switch(t){case"done":e.done(n);break;case"error":e.error(new Error(n.error));break;case"process":let{id:i,input:o,options:s}=n;try{let a=await r(o,s);e.postMessage("done",{id:i,result:a})}catch(a){let c=a instanceof Error?a.message:"unknown error";e.postMessage("error",{id:i,error:c})}break;default:console.warn(`parse-with-worker unknown message ${t}`)}}function ff(r,e,t){if(t=t||r.byteLength,r.byteLength<t||e.byteLength<t)return!1;let n=new Uint8Array(r),i=new Uint8Array(e);for(let o=0;o<n.length;++o)if(n[o]!==i[o])return!1;return!0}function df(...r){return Cg(r)}function Cg(r){let e=r.map(o=>o instanceof ArrayBuffer?new Uint8Array(o):o),t=e.reduce((o,s)=>o+s.byteLength,0),n=new Uint8Array(t),i=0;for(let o of e)n.set(o,i),i+=o.byteLength;return n.buffer}async function hf(r){let e=[];for await(let t of r)e.push(MS(t));return df(...e)}function MS(r){if(r instanceof ArrayBuffer)return r;if(ArrayBuffer.isView(r)){let{buffer:e,byteOffset:t,byteLength:n}=r;return Mg(e,t,n)}return Mg(r)}function Mg(r,e=0,t=r.byteLength-e){let n=new Uint8Array(r,e,t),i=new Uint8Array(n.length);return i.set(n),i.buffer}var RS="",Ig={};function gf(r){for(let e in Ig)if(r.startsWith(e)){let t=Ig[e];r=r.replace(e,t)}return!r.startsWith("http://")&&!r.startsWith("https://")&&(r=`${RS}${r}`),r}function Ta(r){return r&&typeof r=="object"&&r.isBuffer}function kn(r){if(Ta(r))return r;if(r instanceof ArrayBuffer)return r;if(Ju(r))return Sa(r);if(ArrayBuffer.isView(r)){let e=r.buffer;return r.byteOffset===0&&r.byteLength===r.buffer.byteLength?e:e.slice(r.byteOffset,r.byteOffset+r.byteLength)}if(typeof r=="string"){let e=r;return new TextEncoder().encode(e).buffer}if(r&&typeof r=="object"&&r._toArrayBuffer)return r._toArrayBuffer();throw new Error("toArrayBuffer")}function to(r){if(r instanceof ArrayBuffer)return r;if(Ju(r))return Sa(r);let{buffer:e,byteOffset:t,byteLength:n}=r;return e instanceof ArrayBuffer&&t===0&&n===e.byteLength?e:Sa(e,t,n)}function Sa(r,e=0,t=r.byteLength-e){let n=new Uint8Array(r,e,t),i=new Uint8Array(n.length);return i.set(n),i.buffer}function _f(r){return ArrayBuffer.isView(r)?r:new Uint8Array(r)}var Gt={};Ut(Gt,{dirname:()=>OS,filename:()=>IS,join:()=>BS,resolve:()=>DS});function Og(){if(typeof process<"u"&&typeof process.cwd<"u")return process.cwd();let r=window.location?.pathname;return r?.slice(0,r.lastIndexOf("/")+1)||""}function IS(r){let e=r?r.lastIndexOf("/"):-1;return e>=0?r.substr(e+1):r}function OS(r){let e=r?r.lastIndexOf("/"):-1;return e>=0?r.substr(0,e):""}function BS(...r){return r=r.map((t,n)=>(n&&(t=t.replace(new RegExp("^/"),"")),n!==r.length-1&&(t=t.replace(new RegExp("/$"),"")),t)),r.join("/")}function DS(...r){let e=[];for(let o=0;o<r.length;o++)e[o]=r[o];let t="",n=!1,i;for(let o=e.length-1;o>=-1&&!n;o--){let s;o>=0?s=e[o]:(i===void 0&&(i=Og()),s=i),s.length!==0&&(t=`${s}/${t}`,n=s.charCodeAt(0)===ro)}return t=kS(t,!n),n?`/${t}`:t.length>0?t:"."}var ro=47,yf=46;function kS(r,e){let t="",n=-1,i=0,o,s=!1;for(let a=0;a<=r.length;++a){if(a<r.length)o=r.charCodeAt(a);else{if(o===ro)break;o=ro}if(o===ro){if(!(n===a-1||i===1))if(n!==a-1&&i===2){if(t.length<2||!s||t.charCodeAt(t.length-1)!==yf||t.charCodeAt(t.length-2)!==yf){if(t.length>2){let c=t.length-1,l=c;for(;l>=0&&t.charCodeAt(l)!==ro;--l);if(l!==c){t=l===-1?"":t.slice(0,l),n=a,i=0,s=!1;continue}}else if(t.length===2||t.length===1){t="",n=a,i=0,s=!1;continue}}e&&(t.length>0?t+="/..":t="..",s=!0)}else{let c=r.slice(n+1,a);t.length>0?t+=`/${c}`:t=c,s=!1}n=a,i=0}else o===yf&&i!==-1?++i:i=-1}return t}var La=class extends Error{constructor(e,t){super(e),this.reason=t.reason,this.url=t.url,this.response=t.response}reason;url;response};var US=/^data:([-\w.]+\/[-\w.+]+)(;|,)/,GS=/^([-\w.]+\/[-\w.+]+)/;function bf(r,e){return r.toLowerCase()===e.toLowerCase()}function Bg(r){let e=GS.exec(r);return e?e[1]:r}function xf(r){let e=US.exec(r);return e?e[1]:""}var Dg=/\?.*/;function kg(r){let e=r.match(Dg);return e&&e[0]}function sr(r){return r.replace(Dg,"")}function Ng(r){if(r.length<50)return r;let e=r.slice(r.length-15);return`${r.substr(0,32)}...${e}`}function Dr(r){return Ne(r)?r.url:Fe(r)?("name"in r?r.name:"")||"":typeof r=="string"?r:""}function Nn(r){if(Ne(r)){let e=r.headers.get("content-type")||"",t=sr(r.url);return Bg(e)||xf(t)}return Fe(r)?r.type||"":typeof r=="string"?xf(r):""}function Fg(r){return Ne(r)?r.headers["content-length"]||-1:Fe(r)?r.size:typeof r=="string"?r.length:r instanceof ArrayBuffer||ArrayBuffer.isView(r)?r.byteLength:-1}async function Aa(r){if(Ne(r))return r;let e={},t=Fg(r);t>=0&&(e["content-length"]=String(t));let n=Dr(r),i=Nn(r);i&&(e["content-type"]=i);let o=await $S(r);o&&(e["x-first-bytes"]=o),typeof r=="string"&&(r=new TextEncoder().encode(r));let s=new Response(r,{headers:e});return Object.defineProperty(s,"url",{value:n}),s}async function Ug(r){if(!r.ok)throw await zS(r)}async function zS(r){let e=Ng(r.url),t=`Failed to fetch resource (${r.status}) ${r.statusText}: ${e}`;t=t.length>100?`${t.slice(0,100)}...`:t;let n={reason:r.statusText,url:r.url,response:r};try{let i=r.headers.get("Content-Type");n.reason=!r.bodyUsed&&i?.includes("application/json")?await r.json():await r.text()}catch{}return new La(t,n)}async function $S(r){if(typeof r=="string")return`data:,${r.slice(0,5)}`;if(r instanceof Blob){let t=r.slice(0,5);return await new Promise(n=>{let i=new FileReader;i.onload=o=>n(o?.target?.result),i.readAsDataURL(t)})}if(r instanceof ArrayBuffer){let t=r.slice(0,5);return`data:base64,${VS(t)}`}return null}function VS(r){let e="",t=new Uint8Array(r);for(let n=0;n<t.byteLength;n++)e+=String.fromCharCode(t[n]);return btoa(e)}function WS(r){return!jS(r)&&!HS(r)}function jS(r){return r.startsWith("http:")||r.startsWith("https:")}function HS(r){return r.startsWith("data:")}async function vf(r,e){if(typeof r=="string"){let t=gf(r);return WS(t)&&globalThis.loaders?.fetchNode?globalThis.loaders?.fetchNode(t,e):await fetch(t,e)}return await Aa(r)}Zi();var no=new we({id:"loaders.gl"}),Ca=class{log(){return()=>{}}info(){return()=>{}}warn(){return()=>{}}error(){return()=>{}}},Ma=class{console;constructor(){this.console=console}log(...e){return this.console.log.bind(this.console,...e)}info(...e){return this.console.info.bind(this.console,...e)}warn(...e){return this.console.warn.bind(this.console,...e)}error(...e){return this.console.error.bind(this.console,...e)}};var Ra={core:{baseUrl:void 0,fetch:null,mimeType:void 0,fallbackMimeType:void 0,ignoreRegisteredLoaders:void 0,nothrow:!1,log:new Ma,useLocalLibraries:!1,CDN:"https://unpkg.com/@loaders.gl",worker:!0,maxConcurrency:3,maxMobileConcurrency:1,reuseWorkers:Yi,_nodeWorkers:!1,_workerType:"",limit:0,_limitMB:0,batchSize:"auto",batchDebounceMs:0,metadata:!1,transforms:[]}},Gg={baseUri:"core.baseUrl",fetch:"core.fetch",mimeType:"core.mimeType",fallbackMimeType:"core.fallbackMimeType",ignoreRegisteredLoaders:"core.ignoreRegisteredLoaders",nothrow:"core.nothrow",log:"core.log",useLocalLibraries:"core.useLocalLibraries",CDN:"core.CDN",worker:"core.worker",maxConcurrency:"core.maxConcurrency",maxMobileConcurrency:"core.maxMobileConcurrency",reuseWorkers:"core.reuseWorkers",_nodeWorkers:"core.nodeWorkers",_workerType:"core._workerType",_worker:"core._workerType",limit:"core.limit",_limitMB:"core._limitMB",batchSize:"core.batchSize",batchDebounceMs:"core.batchDebounceMs",metadata:"core.metadata",transforms:"core.transforms",throws:"nothrow",dataType:"(no longer used)",uri:"core.baseUrl",method:"core.fetch.method",headers:"core.fetch.headers",body:"core.fetch.body",mode:"core.fetch.mode",credentials:"core.fetch.credentials",cache:"core.fetch.cache",redirect:"core.fetch.redirect",referrer:"core.fetch.referrer",referrerPolicy:"core.fetch.referrerPolicy",integrity:"core.fetch.integrity",keepalive:"core.fetch.keepalive",signal:"core.fetch.signal"};var wf=["baseUrl","fetch","mimeType","fallbackMimeType","ignoreRegisteredLoaders","nothrow","log","useLocalLibraries","CDN","worker","maxConcurrency","maxMobileConcurrency","reuseWorkers","_nodeWorkers","_workerType","limit","_limitMB","batchSize","batchDebounceMs","metadata","transforms"];function Ef(){globalThis.loaders=globalThis.loaders||{};let{loaders:r}=globalThis;return r._state||(r._state={}),r._state}function Pf(){let r=Ef();return r.globalOptions=r.globalOptions||{...Ra,core:{...Ra.core}},zt(r.globalOptions)}function Vg(r,e,t,n){return t=t||[],t=Array.isArray(t)?t:[t],YS(r,t),zt(ZS(e,r,n))}function zt(r){let e=KS(r);Wg(e);for(let t of wf)e.core&&e.core[t]!==void 0&&delete e[t];return e.core&&e.core._workerType!==void 0&&delete e._worker,e}function YS(r,e){zg(r,null,Ra,Gg,e);for(let t of e){let n=r&&r[t.id]||{},i=t.options&&t.options[t.id]||{},o=t.deprecatedOptions&&t.deprecatedOptions[t.id]||{};zg(n,t.id,i,o,e)}}function zg(r,e,t,n,i){let o=e||"Top level",s=e?`${e}.`:"";for(let a in r){let c=!e&&_t(r[a]),l=a==="baseUri"&&!e,u=a==="workerUrl"&&e;if(!(a in t)&&!l&&!u){if(a in n)no.level>0&&no.warn(`${o} loader option '${s}${a}' no longer supported, use '${n[a]}'`)();else if(!c&&no.level>0){let f=qS(a,i);no.warn(`${o} loader option '${s}${a}' not recognized. ${f}`)()}}}}function qS(r,e){let t=r.toLowerCase(),n="";for(let i of e)for(let o in i.options){if(r===o)return`Did you mean '${i.id}.${o}'?`;let s=o.toLowerCase();(t.startsWith(s)||s.startsWith(t))&&(n=n||`Did you mean '${i.id}.${o}'?`)}return n}function ZS(r,e,t){let n=r.options||{},i={...n};n.core&&(i.core={...n.core}),Wg(i),i.core?.log===null&&(i.core={...i.core,log:new Ca}),$g(i,zt(Pf()));let o=zt(e);return $g(i,o),XS(i,t),QS(i),i}function $g(r,e){for(let t in e)if(t in e){let n=e[t];Pa(n)&&Pa(r[t])?r[t]={...r[t],...e[t]}:r[t]=e[t]}}function XS(r,e){if(!e)return;r.core?.baseUrl!==void 0||(r.core||={},r.core.baseUrl=Gt.dirname(sr(e)))}function KS(r){let e={...r};return r.core&&(e.core={...r.core}),e}function Wg(r){r.baseUri!==void 0&&(r.core||={},r.core.baseUrl===void 0&&(r.core.baseUrl=r.baseUri));for(let t of wf)if(r[t]!==void 0){let i=r.core=r.core||{};i[t]===void 0&&(i[t]=r[t])}let e=r._worker;e!==void 0&&(r.core||={},r.core._workerType===void 0&&(r.core._workerType=e))}function QS(r){let e=r.core;if(e)for(let t of wf)e[t]!==void 0&&(r[t]=e[t])}function io(r){return r?(Array.isArray(r)&&(r=r[0]),Array.isArray(r?.extensions)):!1}function oo(r){_a(r,"null loader"),_a(io(r),"invalid loader");let e;return Array.isArray(r)&&(e=r[1],r=r[0],r={...r,options:{...r.options,...e}}),(r?.parseTextSync||r?.parseText)&&(r.text=!0),r.text||(r.binary=!0),r}var jg=()=>{let r=Ef();return r.loaderRegistry=r.loaderRegistry||[],r.loaderRegistry};function Sf(r){let e=jg();r=Array.isArray(r)?r:[r];for(let t of r){let n=oo(t);e.find(i=>n===i)||e.unshift(n)}}function Hg(){return jg()}var JS=/\.([^.]+)$/;async function Zg(r,e=[],t,n){if(!Xg(r))return null;let i=zt(t||{});if(i.core||={},r instanceof Response&&Yg(r)){let s=await r.clone().text(),a=Ia(s,e,{...i,core:{...i.core,nothrow:!0}},n);if(a)return a}let o=Ia(r,e,{...i,core:{...i.core,nothrow:!0}},n);if(o)return o;if(Fe(r)&&(r=await r.slice(0,10).arrayBuffer(),o=Ia(r,e,i,n)),!o&&r instanceof Response&&Yg(r)){let s=await r.clone().text();o=Ia(s,e,i,n)}if(!o&&!i.core.nothrow)throw new Error(Kg(r));return o}function Yg(r){let e=Nn(r);return!!(e&&(e.startsWith("text/")||e==="application/json"||e.endsWith("+json")))}function Ia(r,e=[],t,n){if(!Xg(r))return null;let i=zt(t||{});if(i.core||={},e&&!Array.isArray(e))return oo(e);let o=[];e&&(o=o.concat(e)),i.core.ignoreRegisteredLoaders||o.push(...Hg()),t1(o);let s=e1(r,o,i,n);if(!s&&!i.core.nothrow)throw new Error(Kg(r));return s}function e1(r,e,t,n){let i=Dr(r),o=Nn(r),s=sr(i)||n?.url,a=null,c="";return t?.core?.mimeType&&(a=Tf(e,t?.core?.mimeType),c=`match forced by supplied MIME type ${t?.core?.mimeType}`),a=a||r1(e,s),c=c||(a?`matched url ${s}`:""),a=a||Tf(e,o),c=c||(a?`matched MIME type ${o}`:""),a=a||i1(e,r),c=c||(a?`matched initial data ${Qg(r)}`:""),t?.core?.fallbackMimeType&&(a=a||Tf(e,t?.core?.fallbackMimeType),c=c||(a?`matched fallback MIME type ${o}`:"")),c&&Qu.log(1,`selectLoader selected ${a?.name}: ${c}.`),a}function Xg(r){return!(r instanceof Response&&r.status===204)}function Kg(r){let e=Dr(r),t=Nn(r),n="No valid loader found (";n+=e?`${Gt.filename(e)}, `:"no url provided, ",n+=`MIME type: ${t?`"${t}"`:"not provided"}, `;let i=r?Qg(r):"";return n+=i?` first bytes: "${i}"`:"first bytes: not available",n+=")",n}function t1(r){for(let e of r)oo(e)}function r1(r,e){let t=e&&JS.exec(e),n=t&&t[1];return n?n1(r,n):null}function n1(r,e){e=e.toLowerCase();for(let t of r)for(let n of t.extensions)if(n.toLowerCase()===e)return t;return null}function Tf(r,e){for(let t of r)if(t.mimeTypes?.some(n=>bf(e,n))||bf(e,`application/x.${t.id}`))return t;return null}function i1(r,e){if(!e)return null;for(let t of r)if(typeof e=="string"){if(o1(e,t))return t}else if(ArrayBuffer.isView(e)){if(qg(e.buffer,e.byteOffset,t))return t}else if(e instanceof ArrayBuffer&&qg(e,0,t))return t;return null}function o1(r,e){return e.testText?e.testText(r):(Array.isArray(e.tests)?e.tests:[e.tests]).some(n=>r.startsWith(n))}function qg(r,e,t){return(Array.isArray(t.tests)?t.tests:[t.tests]).some(i=>s1(r,e,t,i))}function s1(r,e,t,n){if(Bn(n))return ff(n,r,n.byteLength);switch(typeof n){case"function":return n(to(r));case"string":let i=Lf(r,e,n.length);return n===i;default:return!1}}function Qg(r,e=5){return typeof r=="string"?r.slice(0,e):ArrayBuffer.isView(r)?Lf(r.buffer,r.byteOffset,e):r instanceof ArrayBuffer?Lf(r,0,e):""}function Lf(r,e,t){if(r.byteLength<e+t)return"";let n=new DataView(r),i="";for(let o=0;o<t;o++)i+=String.fromCharCode(n.getUint8(e+o));return i}var a1=256*1024;function*Jg(r,e){let t=e?.chunkSize||a1,n=0,i=new TextEncoder;for(;n<r.length;){let o=Math.min(r.length-n,t),s=r.slice(n,n+o);n+=o,yield to(i.encode(s))}}function*e_(r,e={}){let{chunkSize:t=262144}=e,n=0;for(;n<r.byteLength;){let i=Math.min(r.byteLength-n,t),o=new ArrayBuffer(i),s=new Uint8Array(r,n,i);new Uint8Array(o).set(s),n+=i,yield o}}async function*t_(r,e){let t=e?.chunkSize||1048576,n=0;for(;n<r.size;){let i=n+t,o=await r.slice(n,i).arrayBuffer();n=i,yield o}}function Af(r,e){return Yi?c1(r,e):l1(r,e)}async function*c1(r,e){let t=r.getReader(),n;try{for(;;){let i=n||t.read();e?._streamReadAhead&&(n=t.read());let{done:o,value:s}=await i;if(o)return;yield kn(s)}}catch{t.releaseLock()}}async function*l1(r,e){for await(let t of r)yield kn(t)}function r_(r,e){if(typeof r=="string")return Jg(r,e);if(r instanceof ArrayBuffer)return e_(r,e);if(Fe(r))return t_(r,e);if(Xi(r))return Af(r,e);if(Ne(r)){let t=r.body;if(!t)throw new Error("Readable stream not available on Response");return Af(t,e)}throw new Error("makeIterator")}var n_="Cannot convert supplied data type";function u1(r,e,t){if(e.text&&typeof r=="string")return r;if(Ta(r)&&(r=r.buffer),Bn(r)){let n=_f(r);return e.text&&!e.binary?new TextDecoder("utf8").decode(n):kn(n)}throw new Error(n_)}async function i_(r,e,t){if(typeof r=="string"||Bn(r))return u1(r,e,t);if(Fe(r)&&(r=await Aa(r)),Ne(r))return await Ug(r),e.binary?await r.arrayBuffer():await r.text();if(Xi(r)&&(r=r_(r,t)),ef(r)||tf(r))return hf(r);throw new Error(n_)}function Oa(r,e){let t=Pf(),n=r||t,i=n.fetch??n.core?.fetch;return typeof i=="function"?i:_t(i)?o=>vf(o,i):e?.fetch?e?.fetch:vf}function o_(r,e,t){if(t)return t;let n={fetch:Oa(e,r),...r};if(n.url){let i=sr(n.url);n.baseUrl=i,n.queryString=kg(n.url),n.filename=Gt.filename(i),n.baseUrl=Gt.dirname(i)}return Array.isArray(n.loaders)||(n.loaders=null),n}function s_(r,e){if(r&&!Array.isArray(r))return r;let t;if(r&&(t=Array.isArray(r)?r:[r]),e&&e.loaders){let n=Array.isArray(e.loaders)?e.loaders:[e.loaders];t=t?[...t,...n]:n}return t&&t.length?t:void 0}async function so(r,e,t,n){e&&!Array.isArray(e)&&!io(e)&&(n=void 0,t=e,e=void 0),r=await r,t=t||{};let i=Dr(r),s=s_(e,n),a=await Zg(r,s,t);if(!a)return null;let c=Vg(t,a,s,i);return n=o_({url:i,_parse:so,loaders:s},c,n||null),await f1(a,r,c,n)}async function f1(r,e,t,n){if(cf(r),t=rf(r.options,t),Ne(e)){let{ok:o,redirected:s,status:a,statusText:c,type:l,url:u}=e,f=Object.fromEntries(e.headers.entries());n.response={headers:f,ok:o,redirected:s,status:a,statusText:c,type:l,url:u}}e=await i_(e,r,t);let i=r;if(i.parseTextSync&&typeof e=="string")return i.parseTextSync(e,t,n);if(lf(r,t))return await uf(r,e,t,n,so);if(i.parseText&&typeof e=="string")return await i.parseText(e,t,n);if(i.parse)return await i.parse(e,t,n);throw Ee(!i.parseSync),new Error(`${r.id} loader - no parser found and worker is disabled`)}async function Fn(r,e,t,n){let i,o;!Array.isArray(e)&&!io(e)?(i=[],o=e,n=void 0):(i=e,o=t);let s=Oa(o),a=r;return typeof r=="string"&&(a=await s(r)),Fe(r)&&(a=await s(r)),typeof r=="string"&&(zt(o||{}).core?.baseUrl||(o={...o,core:{...o?.core,baseUrl:r}})),Array.isArray(i)?await so(a,i,o):await so(a,i,o)}var u_="4.5.1";function co(r,e){if(!r)throw new Error(e||"loader assertion failed.")}var bt={self:typeof self<"u"&&self,window:typeof window<"u"&&window,global:typeof global<"u"&&global,document:typeof document<"u"&&document},d1=bt.self||bt.window||bt.global||{},h1=bt.window||bt.self||bt.global||{},p1=bt.global||bt.self||bt.window||{},m1=bt.document||{};var Mf=!!(typeof process!="object"||String(process)!=="[object process]"||process.browser);var f_=typeof process<"u"&&process.version&&/v([0-9]*)/.exec(process.version),g1=f_&&parseFloat(f_[1])||0;var _1=globalThis.loaders?.parseImageNode,Rf=typeof Image<"u",If=typeof ImageBitmap<"u",y1=!!_1,Of=Mf?!0:y1;function d_(r){switch(r){case"auto":return If||Rf||Of;case"imagebitmap":return If;case"image":return Rf;case"data":return Of;default:throw new Error(`@loaders.gl/images: image ${r} not supported in this environment`)}}function h_(){if(If)return"imagebitmap";if(Rf)return"image";if(Of)return"data";throw new Error("Install '@loaders.gl/polyfills' to parse images under Node.js")}function b1(r){let e=x1(r);if(!e)throw new Error("Not an image");return e}function p_(r){switch(b1(r)){case"data":return r;case"image":case"imagebitmap":let e=document.createElement("canvas"),t=e.getContext("2d");if(!t)throw new Error("getImageData");return e.width=r.width,e.height=r.height,t.drawImage(r,0,0),t.getImageData(0,0,r.width,r.height);default:throw new Error("getImageData")}}function x1(r){return typeof ImageBitmap<"u"&&r instanceof ImageBitmap?"imagebitmap":typeof Image<"u"&&r instanceof Image?"image":r&&typeof r=="object"&&r.data&&r.width&&r.height?"data":null}var v1=/^data:image\/svg\+xml/,w1=/\.svg((\?|#).*)?$/;function Ba(r){return r&&(v1.test(r)||w1.test(r))}function m_(r,e){if(Ba(e)){let n=new TextDecoder().decode(r);try{typeof unescape=="function"&&typeof encodeURIComponent=="function"&&(n=unescape(encodeURIComponent(n)))}catch(o){throw new Error(o.message)}return`data:image/svg+xml;base64,${btoa(n)}`}return Bf(r,e)}function Bf(r,e){if(Ba(e))throw new Error("SVG cannot be parsed directly to imagebitmap");return new Blob([new Uint8Array(r)])}async function Da(r,e,t){let n=m_(r,t),i=self.URL||self.webkitURL,o=typeof n!="string"&&i.createObjectURL(n);try{return await E1(o||n,e)}finally{o&&i.revokeObjectURL(o)}}async function E1(r,e){let t=new Image;return t.src=r,e.image&&e.image.decode&&t.decode?(await t.decode(),t):await new Promise((n,i)=>{try{t.onload=()=>n(t),t.onerror=o=>{let s=o instanceof Error?o.message:"error";i(new Error(s))}}catch(o){i(o)}})}var g_=!0;async function __(r,e,t){let n;Ba(t)?n=await Da(r,e,t):n=Bf(r,t);let i=e&&e.imagebitmap;return await P1(n,i)}async function P1(r,e=null){if((S1(e)||!g_)&&(e=null),e)try{return await createImageBitmap(r,e)}catch(t){console.warn(t),g_=!1}return await createImageBitmap(r)}function S1(r){if(!r)return!0;for(let e in r)if(Object.prototype.hasOwnProperty.call(r,e))return!1;return!0}function y_(r){return!C1(r,"ftyp",4)||(r[8]&96)===0?null:T1(r)}function T1(r){switch(L1(r,8,12).replace("\0"," ").trim()){case"avif":case"avis":return{extension:"avif",mimeType:"image/avif"};default:return null}}function L1(r,e,t){return String.fromCharCode(...r.slice(e,t))}function A1(r){return[...r].map(e=>e.charCodeAt(0))}function C1(r,e,t=0){let n=A1(e);for(let i=0;i<n.length;++i)if(n[i]!==r[i+t])return!1;return!0}var xt=!1,lo=!0;function ka(r){let e=uo(r);return R1(e)||B1(e)||I1(e)||O1(e)||M1(e)}function M1(r){let e=new Uint8Array(r instanceof DataView?r.buffer:r),t=y_(e);return t?{mimeType:t.mimeType,width:0,height:0}:null}function R1(r){let e=uo(r);return e.byteLength>=24&&e.getUint32(0,xt)===2303741511?{mimeType:"image/png",width:e.getUint32(16,xt),height:e.getUint32(20,xt)}:null}function I1(r){let e=uo(r);return e.byteLength>=10&&e.getUint32(0,xt)===1195984440?{mimeType:"image/gif",width:e.getUint16(6,lo),height:e.getUint16(8,lo)}:null}function O1(r){let e=uo(r);return e.byteLength>=14&&e.getUint16(0,xt)===16973&&e.getUint32(2,lo)===e.byteLength?{mimeType:"image/bmp",width:e.getUint32(18,lo),height:e.getUint32(22,lo)}:null}function B1(r){let e=uo(r);if(!(e.byteLength>=3&&e.getUint16(0,xt)===65496&&e.getUint8(2)===255))return null;let{tableMarkers:n,sofMarkers:i}=D1(),o=2;for(;o+9<e.byteLength;){let s=e.getUint16(o,xt);if(i.has(s))return{mimeType:"image/jpeg",height:e.getUint16(o+5,xt),width:e.getUint16(o+7,xt)};if(!n.has(s))return null;o+=2,o+=e.getUint16(o,xt)}return null}function D1(){let r=new Set([65499,65476,65484,65501,65534]);for(let t=65504;t<65520;++t)r.add(t);return{tableMarkers:r,sofMarkers:new Set([65472,65473,65474,65475,65477,65478,65479,65481,65482,65483,65485,65486,65487,65502])}}function uo(r){if(r instanceof DataView)return r;if(ArrayBuffer.isView(r))return new DataView(r.buffer);if(r instanceof ArrayBuffer)return new DataView(r);throw new Error("toDataView")}async function b_(r,e){let{mimeType:t}=ka(r)||{},n=globalThis.loaders?.parseImageNode;return co(n),await n(r,t)}async function x_(r,e,t){e=e||{};let i=(e.image||{}).type||"auto",{url:o}=t||{},s=k1(i),a;switch(s){case"imagebitmap":a=await __(r,e,o);break;case"image":a=await Da(r,e,o);break;case"data":a=await b_(r,e);break;default:co(!1)}return i==="data"&&(a=p_(a)),a}function k1(r){switch(r){case"auto":case"data":return h_();default:return d_(r),r}}var N1=["png","jpg","jpeg","gif","webp","bmp","ico","svg","avif"],F1=["image/png","image/jpeg","image/gif","image/webp","image/avif","image/bmp","image/vnd.microsoft.icon","image/svg+xml"],U1={image:{type:"auto",decode:!0}},Df={dataType:null,batchType:null,id:"image",module:"images",name:"Images",version:u_,mimeTypes:F1,extensions:N1,parse:x_,tests:[r=>!!ka(new DataView(r))],options:U1};Zi();var G1=new we({id:"deck"}),F=G1;var kf={};function v_(r){kf=r}function ie(r,e,t,n){F.level>0&&kf[r]&&kf[r].call(null,e,t,n)}function z1(r){let e=r[0],t=r[r.length-1];return e==="{"&&t==="}"||e==="["&&t==="]"}var w_={dataType:null,batchType:null,id:"JSON",name:"JSON",module:"",version:"",options:{},extensions:["json","geojson"],mimeTypes:["application/json","application/geo+json"],testText:z1,parseTextSync:JSON.parse};function $1(){let r="9.4.0",e=globalThis.deck&&globalThis.deck.VERSION;if(e&&e!==r)throw new Error(`deck.gl - multiple versions detected: ${e} vs ${r}`);return e||(F.log(1,`deck.gl ${r}`)(),globalThis.deck={...globalThis.deck,VERSION:r,version:r,log:F,_registerLoggers:v_},Sf([w_,[Df,{imagebitmap:{premultiplyAlpha:"none"}}]])),r}var E_=$1();Me();var FM=`struct LayerUniforms {
  opacity: f32,
};

@group(0) @binding(auto)
var<uniform> layer: LayerUniforms;
`,u0=`layout(std140) uniform layerUniforms {
  uniform float opacity;
} layer;
`,Wh={name:"layer",source:FM,vs:u0,fs:u0,getUniforms:r=>({opacity:Math.pow(r.opacity,.45454545454545453)}),uniformTypes:{opacity:"f32"}};var UM=`

@must_use
fn deckgl_premultiplied_alpha(fragColor: vec4<f32>) -> vec4<f32> {
    return vec4(fragColor.rgb * fragColor.a, fragColor.a); 
};
`,_r={name:"color",dependencies:[],source:UM,getUniforms:r=>({})};var GM=`const SMOOTH_EDGE_RADIUS: f32 = 0.5;

struct VertexGeometry {
  position: vec4<f32>,
  worldPosition: vec3<f32>,
  worldPositionAlt: vec3<f32>,
  normal: vec3<f32>,
  uv: vec2<f32>,
  pickingColor: vec3<f32>,
};

var<private> geometry_: VertexGeometry = VertexGeometry(
  vec4<f32>(0.0, 0.0, 1.0, 0.0),
  vec3<f32>(0.0, 0.0, 0.0),
  vec3<f32>(0.0, 0.0, 0.0),
  vec3<f32>(0.0, 0.0, 0.0),
  vec2<f32>(0.0, 0.0),
  vec3<f32>(0.0, 0.0, 0.0)
);

struct FragmentGeometry {
  uv: vec2<f32>,
};

var<private> fragmentGeometry: FragmentGeometry;

fn smoothedge(edge: f32, x: f32) -> f32 {
  return smoothstep(edge - SMOOTH_EDGE_RADIUS, edge + SMOOTH_EDGE_RADIUS, x);
}
`,f0="#define SMOOTH_EDGE_RADIUS 0.5",zM=`${f0}

struct VertexGeometry {
  vec4 position;
  vec3 worldPosition;
  vec3 worldPositionAlt;
  vec3 normal;
  vec2 uv;
  vec3 pickingColor;
} geometry = VertexGeometry(
  vec4(0.0, 0.0, 1.0, 0.0),
  vec3(0.0),
  vec3(0.0),
  vec3(0.0),
  vec2(0.0),
  vec3(0.0)
);
`,$M=`${f0}

struct FragmentGeometry {
  vec2 uv;
};
FragmentGeometry geometry;

float smoothedge(float edge, float x) {
  return smoothstep(edge - SMOOTH_EDGE_RADIUS, edge + SMOOTH_EDGE_RADIUS, x);
}
`,Uc={name:"geometry",source:GM,vs:zM,fs:$M};Me();le();var B;(function(r){r[r.Start=1]="Start",r[r.Move=2]="Move",r[r.End=4]="End",r[r.Cancel=8]="Cancel"})(B||(B={}));var X;(function(r){r[r.None=0]="None",r[r.Left=1]="Left",r[r.Right=2]="Right",r[r.Up=4]="Up",r[r.Down=8]="Down",r[r.Horizontal=3]="Horizontal",r[r.Vertical=12]="Vertical",r[r.All=15]="All"})(X||(X={}));var A;(function(r){r[r.Possible=1]="Possible",r[r.Began=2]="Began",r[r.Changed=4]="Changed",r[r.Ended=8]="Ended",r[r.Recognized=8]="Recognized",r[r.Cancelled=16]="Cancelled",r[r.Failed=32]="Failed"})(A||(A={}));var d0="compute",jh="auto",an="manipulation",cn="none",jo="pan-x",Ho="pan-y";function Hh(r){if(r.includes(cn))return cn;let e=r.includes(jo),t=r.includes(Ho);return e&&t?cn:e||t?e?jo:Ho:r.includes(an)?an:jh}var Yo=class{constructor(e,t){this.actions="",this.manager=e,this.set(t)}set(e){e===d0&&(e=this.compute()),this.manager.element&&(this.manager.element.style.touchAction=e,this.actions=e)}update(){this.set(this.manager.options.touchAction)}compute(){let e=[];for(let t of this.manager.recognizers)t.options.enable&&(e=e.concat(t.getTouchAction()));return Hh(e.join(" "))}};function ri(r){return r.trim().split(/\s+/g)}function Gc(r,e,t){if(r)for(let n of ri(e))r.addEventListener(n,t,!1)}function zc(r,e,t){if(r)for(let n of ri(e))r.removeEventListener(n,t,!1)}function Yh(r){return(r.ownerDocument||r).defaultView}function qh(r,e){let t=r;for(;t;){if(t===e)return!0;t=t.parentNode}return!1}function $c(r){let e=r.length;if(e===1)return{x:Math.round(r[0].clientX),y:Math.round(r[0].clientY)};let t=0,n=0,i=0;for(;i<e;)t+=r[i].clientX,n+=r[i].clientY,i++;return{x:Math.round(t/e),y:Math.round(n/e)}}function Zh(r){let e=[],t=0;for(;t<r.pointers.length;)e[t]={clientX:Math.round(r.pointers[t].clientX),clientY:Math.round(r.pointers[t].clientY)},t++;return{timeStamp:Date.now(),pointers:e,center:$c(e),deltaX:r.deltaX,deltaY:r.deltaY}}function ni(r,e){let t=e.x-r.x,n=e.y-r.y;return Math.sqrt(t*t+n*n)}function qo(r,e){let t=e.clientX-r.clientX,n=e.clientY-r.clientY;return Math.sqrt(t*t+n*n)}function h0(r,e){let t=e.x-r.x,n=e.y-r.y;return Math.atan2(n,t)*180/Math.PI}function Xh(r,e){let t=e.clientX-r.clientX,n=e.clientY-r.clientY;return Math.atan2(n,t)*180/Math.PI}function ii(r,e){return r===e?X.None:Math.abs(r)>=Math.abs(e)?r<0?X.Left:X.Right:e<0?X.Up:X.Down}function p0(r,e){let t=e.center,n=r.offsetDelta,i=r.prevDelta,o=r.prevInput;return(e.eventType===B.Start||o?.eventType===B.End)&&(i=r.prevDelta={x:o?.deltaX||0,y:o?.deltaY||0},n=r.offsetDelta={x:t.x,y:t.y}),{deltaX:i.x+(t.x-n.x),deltaY:i.y+(t.y-n.y)}}function Vc(r,e,t){return{x:e/r||0,y:t/r||0}}function m0(r,e){return qo(e[0],e[1])/qo(r[0],r[1])}function g0(r,e){return Xh(e[1],e[0])-Xh(r[1],r[0])}function _0(r,e){let t=r.lastInterval||e,n=e.timeStamp-t.timeStamp,i,o,s,a;if(e.eventType!==B.Cancel&&(n>25||t.velocity===void 0)){let c=e.deltaX-t.deltaX,l=e.deltaY-t.deltaY,u=Vc(n,c,l);o=u.x,s=u.y,i=Math.abs(u.x)>Math.abs(u.y)?u.x:u.y,a=ii(c,l),r.lastInterval=e}else i=t.velocity,o=t.velocityX,s=t.velocityY,a=t.direction;e.velocity=i,e.velocityX=o,e.velocityY=s,e.direction=a}function Kh(r,e){return"pointerId"in r?r.pointerId:e}function y0(r,e){r.movementOrigin=new Map(e.map((t,n)=>[Kh(t,n),{clientX:t.clientX,clientY:t.clientY}])),r.firstMovementTime=void 0}function WM(r,e){let t=e.pointers.map(Kh);if(r.movementOrigin?.size===t.length&&t.every(i=>r.movementOrigin.has(i))||y0(r,e.pointers),e.distancePerPointer=e.pointers.map((i,o)=>qo(r.movementOrigin.get(t[o]),i)),e.eventType&B.Move&&e.distancePerPointer.some(i=>i>0)&&(r.firstMovementTime??(r.firstMovementTime=e.timeStamp)),e.movementDeltaTime=r.firstMovementTime===void 0?0:e.timeStamp-r.firstMovementTime,e.eventType&(B.End|B.Cancel)){let i=e.changedPointers.map(o=>Kh(o,e.pointers.indexOf(o)));y0(r,e.pointers.filter((o,s)=>!i.includes(t[s])))}}function b0(r,e){let{session:t}=r,{pointers:n}=e,{length:i}=n;t.firstInput||(t.firstInput=Zh(e)),i>1&&!t.firstMultiple?t.firstMultiple=Zh(e):i===1&&(t.firstMultiple=!1);let{firstInput:o,firstMultiple:s}=t,a=s?s.center:o.center,c=e.center=$c(n);e.timeStamp=Date.now(),e.deltaTime=e.timeStamp-o.timeStamp,WM(t,e),e.angle=h0(a,c),e.distance=ni(a,c);let{deltaX:l,deltaY:u}=p0(t,e);e.deltaX=l,e.deltaY=u,e.offsetDirection=ii(e.deltaX,e.deltaY);let f=Vc(e.deltaTime,e.deltaX,e.deltaY);e.overallVelocityX=f.x,e.overallVelocityY=f.y,e.overallVelocity=Math.abs(f.x)>Math.abs(f.y)?f.x:f.y,e.scale=s?m0(s.pointers,n):1,e.rotation=s?g0(s.pointers,n):0,e.maxPointers=t.prevInput?e.pointers.length>t.prevInput.maxPointers?e.pointers.length:t.prevInput.maxPointers:e.pointers.length;let d=r.element;return qh(e.srcEvent.target,d)&&(d=e.srcEvent.target),e.target=d,_0(t,e),e}function x0(r,e,t){let n=t.pointers.length,i=t.changedPointers.length,o=e&B.Start&&n-i===0,s=e&(B.End|B.Cancel)&&n-i===0;t.isFirst=!!o,t.isFinal=!!s,o&&(r.session={}),t.eventType=e;let a=b0(r,t);r.emit("hammer.input",a),r.recognize(a),r.session.prevInput=a}var Zo=class{constructor(e){this.evEl="",this.evWin="",this.evTarget="",this.domHandler=t=>{this.manager.options.enable&&this.handler(t)},this.manager=e,this.element=e.element,this.target=e.options.inputTarget||e.element}callback(e,t){x0(this.manager,e,t)}init(){Gc(this.element,this.evEl,this.domHandler),Gc(this.target,this.evTarget,this.domHandler),Gc(Yh(this.element),this.evWin,this.domHandler)}destroy(){zc(this.element,this.evEl,this.domHandler),zc(this.target,this.evTarget,this.domHandler),zc(Yh(this.element),this.evWin,this.domHandler)}};var jM={pointerdown:B.Start,pointermove:B.Move,pointerup:B.End,pointercancel:B.Cancel,pointerout:B.Cancel},HM="pointerdown",YM="pointermove pointerup pointercancel",Xo=class extends Zo{constructor(e){super(e),this.evEl=HM,this.evWin=YM,this.store=this.manager.session.pointerEvents=[],this.init()}handler(e){let{store:t}=this,n=!1,i=jM[e.type],o=e.pointerType,s=o==="touch",a=t.findIndex(c=>c.pointerId===e.pointerId);i&B.Start&&(e.buttons||s)?a<0&&(t.push(e),a=t.length-1):i&(B.End|B.Cancel)&&(n=!0),!(a<0)&&(t[a]=e,this.callback(i,{pointers:t,changedPointers:[e],eventType:i,pointerType:o,srcEvent:e}),n&&t.splice(a,1))}};var qM=["","webkit","Moz","MS","ms","o"];function v0(r,e){let t=e[0].toUpperCase()+e.slice(1);for(let n of qM){let i=n?n+t:e;if(i in r)return i}}var ZM=1,w0=2,E0={touchAction:"compute",enable:!0,inputTarget:null,cssProps:{userSelect:"none",userDrag:"none",touchCallout:"none",tapHighlightColor:"rgba(0,0,0,0)"}},Ko=class{constructor(e,t){this.options={...E0,...t,cssProps:{...E0.cssProps,...t.cssProps},inputTarget:t.inputTarget||e},this.handlers={},this.session={},this.recognizers=[],this.oldCssProps={},this.element=e,this.input=new Xo(this),this.touchAction=new Yo(this,this.options.touchAction),this.toggleCssProps(!0)}set(e){return Object.assign(this.options,e),e.touchAction&&this.touchAction.update(),e.inputTarget&&(this.input.destroy(),this.input.target=e.inputTarget,this.input.init()),this}stop(e){this.session.stopped=e?w0:ZM}recognize(e){let{session:t}=this;if(t.stopped)return;this.session.prevented&&e.srcEvent.preventDefault();let n,{recognizers:i}=this,{curRecognizer:o}=t;(!o||o&&o.state&A.Recognized)&&(o=t.curRecognizer=null);let s=0;for(;s<i.length;)n=i[s],t.stopped!==w0&&(!o||n===o||n.canRecognizeWith(o))?n.recognize(e):n.reset(),!o&&n.state&(A.Began|A.Changed|A.Ended)&&(o=t.curRecognizer=n),s++}get(e){let{recognizers:t}=this;for(let n=0;n<t.length;n++)if(t[n].options.event===e)return t[n];return null}add(e){if(Array.isArray(e)){for(let n of e)this.add(n);return this}let t=this.get(e.options.event);return t&&this.remove(t),this.recognizers.push(e),e.manager=this,this.touchAction.update(),e}remove(e){if(Array.isArray(e)){for(let n of e)this.remove(n);return this}let t=typeof e=="string"?this.get(e):e;if(t){let{recognizers:n}=this,i=n.indexOf(t);i!==-1&&(n.splice(i,1),this.touchAction.update())}return this}on(e,t){if(!e||!t)return;let{handlers:n}=this;for(let i of ri(e))n[i]=n[i]||[],n[i].push(t)}off(e,t){if(!e)return;let{handlers:n}=this;for(let i of ri(e))t?n[i]&&n[i].splice(n[i].indexOf(t),1):delete n[i]}emit(e,t){let n=this.handlers[e]&&this.handlers[e].slice();if(!n||!n.length)return;let i=t;i.type=e,i.preventDefault=function(){t.srcEvent.preventDefault()};let o=0;for(;o<n.length;)n[o](i),o++}destroy(){this.toggleCssProps(!1),this.handlers={},this.session={},this.input.destroy(),this.element=null}toggleCssProps(e){let{element:t}=this;if(t){for(let[n,i]of Object.entries(this.options.cssProps)){let o=v0(t.style,n);e?(this.oldCssProps[o]=t.style[o],t.style[o]=i):t.style[o]=this.oldCssProps[o]||""}e||(this.oldCssProps={})}}};var XM=1;function P0(){return XM++}function Qh(r){return r&A.Cancelled?"cancel":r&A.Ended?"end":r&A.Changed?"move":r&A.Began?"start":""}var nt=class{constructor(e){this.options=e,this.id=P0(),this.state=A.Possible,this.simultaneous={},this.requireFail=[]}set(e){return Object.assign(this.options,e),this.manager.touchAction.update(),this}recognizeWith(e){if(Array.isArray(e)){for(let i of e)this.recognizeWith(i);return this}let t;if(typeof e=="string"){if(t=this.manager.get(e),!t)throw new Error(`Cannot find recognizer ${e}`)}else t=e;let{simultaneous:n}=this;return n[t.id]||(n[t.id]=t,t.recognizeWith(this)),this}dropRecognizeWith(e){if(Array.isArray(e)){for(let n of e)this.dropRecognizeWith(n);return this}let t;return typeof e=="string"?t=this.manager.get(e):t=e,t&&delete this.simultaneous[t.id],this}requireFailure(e){if(Array.isArray(e)){for(let i of e)this.requireFailure(i);return this}let t;if(typeof e=="string"){if(t=this.manager.get(e),!t)throw new Error(`Cannot find recognizer ${e}`)}else t=e;let{requireFail:n}=this;return n.indexOf(t)===-1&&(n.push(t),t.requireFailure(this)),this}dropRequireFailure(e){if(Array.isArray(e)){for(let n of e)this.dropRequireFailure(n);return this}let t;if(typeof e=="string"?t=this.manager.get(e):t=e,t){let n=this.requireFail.indexOf(t);n>-1&&this.requireFail.splice(n,1)}return this}hasRequireFailures(){return!!this.requireFail.find(e=>e.options.enable)}canRecognizeWith(e){return!!this.simultaneous[e.id]}emit(e){if(!e)return;let{state:t}=this;t<A.Ended&&this.manager.emit(this.options.event+Qh(t),e),this.manager.emit(this.options.event,e),e.additionalEvent&&this.manager.emit(e.additionalEvent,e),t>=A.Ended&&this.manager.emit(this.options.event+Qh(t),e)}tryEmit(e){this.canEmit()?this.emit(e):this.state=A.Failed}canEmit(){let e=0;for(;e<this.requireFail.length;){if(!(this.requireFail[e].state&(A.Failed|A.Possible)))return!1;e++}return!0}recognize(e){let t={...e};if(!this.options.enable){this.reset(),this.state=A.Failed;return}this.state&(A.Recognized|A.Cancelled|A.Failed)&&(this.state=A.Possible),this.state=this.process(t),this.state&(A.Began|A.Changed|A.Ended|A.Cancelled)&&this.tryEmit(t)}getEventNames(){return[this.options.event]}reset(){}};function KM(r){return Math.abs(((r+180)%360+360)%360-180)}function QM(r,e){return(e.distance===void 0||r.distance>=e.distance)&&(e.distancePerPointer===void 0||r.distancePerPointer.length>0&&r.distancePerPointer.every(t=>t>=e.distancePerPointer))&&(e.movementDeltaTime===void 0||r.movementDeltaTime>=e.movementDeltaTime)&&(e.rotation===void 0||KM(r.rotation)>=e.rotation)&&(e.scale===void 0||Math.abs(r.scale-1)>=e.scale)}var ln=class extends nt{attrTest(e){let t=this.options.pointers;return t===0||e.pointers.length===t}coherentTest(e){let t=this.options.coherent;return!t?.length||t.some(n=>QM(e,n))}process(e){let{state:t}=this,{eventType:n}=e,i=t&(A.Began|A.Changed),o=this.attrTest(e);return i&&(n&B.Cancel||!o)?t|A.Cancelled:i||o?n&B.End?t|A.Ended:t&A.Began?t|A.Changed:A.Began:A.Failed}};var JM=["","start","move","end","cancel"],oi=class extends nt{constructor(e={}){super({enable:!0,event:"doubleclickdrag",pointers:1,interval:500,time:350,threshold:28,dragThreshold:1,pixelsPerScale:120,...e}),this._tapStart=null,this._lastTap=null,this._drag=null,this._emittedStart=!1}getTouchAction(){return[an]}getEventNames(){return JM.map(e=>this.options.event+e)}process(e){let{options:t}=this;return e.pointers.length===t.pointers?e.eventType&B.Start?this._handleStart(e):e.eventType&B.Move?this._handleMove(e):e.eventType&B.Cancel?this._handleEnd(e,!0):e.eventType&B.End?this._handleEnd(e,!1):A.Failed:(this.reset(),A.Failed)}reset(){this._tapStart=null,this._lastTap=null,this._drag=null,this._emittedStart=!1}emit(e){if(e){if(this.state===A.Began){if(!this._drag?.active||this._emittedStart)return;this._emittedStart=!0,this.manager.emit(`${this.options.event}start`,e),this.manager.emit(this.options.event,e);return}if(this.state===A.Changed){if(!this._emittedStart)return;this.manager.emit(`${this.options.event}move`,e),this.manager.emit(this.options.event,e);return}if(this.state===A.Ended){if(!this._emittedStart)return;this.manager.emit(this.options.event,e),this.manager.emit(`${this.options.event}end`,e),this._emittedStart=!1;return}if(this.state===A.Cancelled){if(!this._emittedStart)return;this.manager.emit(this.options.event,e),this.manager.emit(`${this.options.event}cancel`,e),this._emittedStart=!1}}}_handleStart(e){let t=this._getPointerId(e);return this._lastTap&&this._isTapMatch(e,this._lastTap)?(this._tapStart=null,this._lastTap=null,this._drag={startCenter:e.center,pointerId:t,active:!1},this._emittedStart=!1,A.Began):(this._tapStart={center:e.center,timeStamp:e.timeStamp,pointerId:t},this._lastTap=null,this._drag=null,this._emittedStart=!1,A.Failed)}_handleMove(e){if(!this._drag||!this._isSamePointer(e,this._drag.pointerId))return A.Failed;let t=this._drag.startCenter.y-e.center.y;return!this._drag.active&&Math.abs(t)<this.options.dragThreshold?A.Began:(this._drag.active=!0,e.scale=Math.pow(2,t/this.options.pixelsPerScale),this._emittedStart?A.Changed:A.Began)}_handleEnd(e,t){if(this._drag&&this._isSamePointer(e,this._drag.pointerId)){let{active:n,startCenter:i}=this._drag;if(this._drag=null,this._tapStart=null,this._lastTap=null,!n)return this._emittedStart=!1,A.Failed;let o=i.y-e.center.y;return e.scale=Math.pow(2,o/this.options.pixelsPerScale),t?A.Cancelled:A.Ended}return!this._tapStart||!this._isSamePointer(e,this._tapStart.pointerId)?(t&&this.reset(),A.Failed):(this._isValidTap(e)?this._lastTap={center:e.center,timeStamp:e.timeStamp,pointerId:this._tapStart.pointerId}:this._lastTap=null,this._tapStart=null,A.Failed)}_isTapMatch(e,t){return e.timeStamp-t.timeStamp<=this.options.interval&&ni(e.center,t.center)<=this.options.threshold}_isValidTap(e){return e.deltaTime<=this.options.time&&e.distance<=this.options.threshold}_getPointerId(e){return"pointerId"in e.srcEvent?e.srcEvent.pointerId:null}_isSamePointer(e,t){return t===null||this._getPointerId(e)===t}};var un=class extends nt{constructor(e={}){super({enable:!0,event:"tap",pointers:1,taps:1,interval:300,time:250,threshold:9,posThreshold:10,...e}),this.pTime=null,this.pCenter=null,this._timer=null,this._input=null,this.count=0}getTouchAction(){return[an]}process(e){let{options:t}=this,n=e.pointers.length===t.pointers,i=e.distance<t.threshold,o=e.deltaTime<t.time;if(this.reset(),e.eventType&B.Start&&this.count===0)return this.failTimeout();if(i&&o&&n){if(e.eventType!==B.End)return this.failTimeout();let s=this.pTime?e.timeStamp-this.pTime<t.interval:!0,a=!this.pCenter||ni(this.pCenter,e.center)<t.posThreshold;if(this.pTime=e.timeStamp,this.pCenter=e.center,!a||!s?this.count=1:this.count+=1,this._input=e,this.count%t.taps===0)return this.hasRequireFailures()?(this._timer=setTimeout(()=>{this.state=A.Recognized,this.tryEmit(this._input)},t.interval),A.Began):A.Recognized}return A.Failed}failTimeout(){return this._timer=setTimeout(()=>{this.state=A.Failed},this.options.interval),A.Failed}reset(){clearTimeout(this._timer)}emit(e){this.state===A.Recognized&&(e.tapCount=this.count,this.manager.emit(this.options.event,e))}};var si=class extends ln{constructor(){super(...arguments),this.wheelSession=null,this.wheelSessionUnsubscribe=null,this.handleWheelSessionEvent=e=>{e.device==="trackpad"&&this.handleTrackpadEvent(e)}}set(e){let{wheelSession:t,...n}=e;return t&&t!==this.wheelSession&&(this.wheelSessionUnsubscribe?.(),this.wheelSessionUnsubscribe=null,this.wheelSession=t),super.set(n),this.updateWheelSessionSubscription(),this}getTrackpadInput(e,t={}){let{srcEvent:n}=e,i=t.deltaX??e.deltaX,o=t.deltaY??e.deltaY,s=ii(i,o),a=Math.sqrt(e.deltaX*e.deltaX+e.deltaY*e.deltaY),c=n;return{pointers:[c,c],changedPointers:[c,c],pointerType:"trackpad",srcEvent:c,eventType:e.eventType,timeStamp:e.timeStamp,deltaTime:e.deltaTime,center:e.center,deltaX:i,deltaY:o,angle:Math.atan2(o,i)*180/Math.PI,distance:Math.sqrt(i*i+o*o),distancePerPointer:[a,a],movementDeltaTime:e.deltaTime,scale:1,rotation:0,direction:s,offsetDirection:s,velocity:e.velocity,velocityX:e.velocityX,velocityY:e.velocityY,overallVelocity:e.overallVelocity,overallVelocityX:e.overallVelocityX,overallVelocityY:e.overallVelocityY,maxPointers:2,target:n.target||this.manager.element,additionalEvent:"",...t}}updateWheelSessionSubscription(){let e=!!(this.wheelSession&&this.options.enable&&this.options.trackpad&&this.options.pointers===2);e&&!this.wheelSessionUnsubscribe?this.wheelSessionUnsubscribe=this.wheelSession.on(this.handleWheelSessionEvent):!e&&this.wheelSessionUnsubscribe&&(this.wheelSessionUnsubscribe(),this.wheelSessionUnsubscribe=null)}};var eR=["","start","move","end","cancel","up","down","left","right"],yr=class extends si{constructor(e={}){super({enable:!0,pointers:1,event:"pan",threshold:10,direction:X.All,trackpad:!1,coherent:[],...e}),this.trackpadGesture=!1,this.pX=null,this.pY=null}getTouchAction(){let{options:{direction:e}}=this,t=[];return e&X.Horizontal&&t.push(Ho),e&X.Vertical&&t.push(jo),t}getEventNames(){return eR.map(e=>this.options.event+e)}directionTest(e){let{options:t}=this,n=!0,{distance:i}=e,{direction:o}=e,s=e.deltaX,a=e.deltaY;return o&t.direction||(t.direction&X.Horizontal?(o=s===0?X.None:s<0?X.Left:X.Right,n=s!==this.pX,i=Math.abs(e.deltaX)):(o=a===0?X.None:a<0?X.Up:X.Down,n=a!==this.pY,i=Math.abs(e.deltaY))),e.direction=o,n&&i>t.threshold&&!!(o&t.direction)}attrTest(e){let t=!!(this.state&A.Began),n=!(this.options.coherent?.length&&e.eventType&(B.End|B.Cancel));return super.attrTest(e)&&(t||n&&this.coherentTest(e)&&this.directionTest(e))}emit(e){this.pX=e.deltaX,this.pY=e.deltaY;let t=X[e.direction].toLowerCase();t&&(e.additionalEvent=this.options.event+t),super.emit(e)}handleTrackpadEvent(e){e.isFirst&&(this.trackpadGesture=!e.srcEvent.ctrlKey,!this.trackpadGesture&&this.state&(A.Recognized|A.Cancelled|A.Failed)&&(this.state=A.Possible)),this.trackpadGesture&&(this.recognize(this.getTrackpadInput(e,{deltaX:-e.deltaX,deltaY:-e.deltaY,velocity:-e.velocity,velocityX:-e.velocityX,velocityY:-e.velocityY,overallVelocity:-e.overallVelocity,overallVelocityX:-e.overallVelocityX,overallVelocityY:-e.overallVelocityY})),e.isFinal&&(this.trackpadGesture=!1))}};var tR=["","start","move","end","cancel","in","out"],ai=class extends si{constructor(e={}){super({enable:!0,event:"pinch",threshold:0,pointers:2,trackpad:!1,coherent:[],...e}),this.trackpadGesture=!1}getTouchAction(){return[cn]}getEventNames(){return tR.map(e=>this.options.event+e)}attrTest(e){let t=!!this.options.coherent?.length,n=!!(this.state&A.Began),i=!(t&&e.eventType&(B.End|B.Cancel));return super.attrTest(e)&&(n||i&&(t?this.coherentTest(e):Math.abs(e.scale-1)>this.options.threshold))}emit(e){if(e.scale!==1){let t=e.scale<1?"in":"out";e.additionalEvent=this.options.event+t}super.emit(e)}handleTrackpadEvent(e){e.isFirst&&(this.trackpadGesture=e.srcEvent.ctrlKey,!this.trackpadGesture&&this.state&(A.Recognized|A.Cancelled|A.Failed)&&(this.state=A.Possible)),this.trackpadGesture&&(this.recognize(this.getTrackpadInput(e,{deltaX:0,deltaY:0,velocity:0,velocityX:0,velocityY:0,overallVelocity:0,overallVelocityX:0,overallVelocityY:0,scale:Math.exp(-e.deltaY/100)})),e.isFinal&&(this.trackpadGesture=!1))}};var St=class{constructor(e,t,n){this.element=e,this.callback=t,this.options=n}listen(e,t){t?this.element.addEventListener(e,this.handleEvent,{passive:!1}):this.element.removeEventListener(e,this.handleEvent)}};var S0=typeof navigator<"u"&&navigator.userAgent?navigator.userAgent.toLowerCase():"";var oR=S0.indexOf("firefox")!==-1,sR=40,aR=.25,Wc=class extends St{constructor(e,t,n){n.enable=n.enable??!1,super(e,t,n),this.handleEvent=i=>{if(!this.options.enable)return;let o=i.deltaY;globalThis.WheelEvent&&(oR&&i.deltaMode===globalThis.WheelEvent.DOM_DELTA_PIXEL&&(o/=globalThis.devicePixelRatio),i.deltaMode===globalThis.WheelEvent.DOM_DELTA_LINE&&(o*=sR)),i.shiftKey&&o&&(o=o*aR),this.callback({type:"wheel",center:{x:i.clientX,y:i.clientY},delta:-o,device:this.options.wheelSession?.device??"unknown",srcEvent:i,pointerType:"mouse",target:i.target})},n.enable&&(this.wheelSessionUnsubscribe=this.options.wheelSession?.on(()=>{}),this.listen("wheel",!0))}destroy(){this.listen("wheel",!1),this.wheelSessionUnsubscribe?.(),this.wheelSessionUnsubscribe=void 0}enableEventType(e,t){e==="wheel"&&this.options.enable!==t&&(this.options.enable=t,t&&!this.wheelSessionUnsubscribe&&(this.wheelSessionUnsubscribe=this.options.wheelSession?.on(()=>{})),this.listen("wheel",t),t||(this.wheelSessionUnsubscribe?.(),this.wheelSessionUnsubscribe=void 0))}};var cR=4.000244140625,T0=40,lR=0,uR=1,fR=40,L0=40,dR=120,hR={classificationDelay:32,endDelay:80},jc=class{constructor(e,t={}){this.subscriptions=new Map,this.session=null,this.classificationTimer=null,this.endTimer=null,this.pressedControlKeys=new Set,this.listeningForControlKeys=!1,this.handleEvent=n=>{if(!this.hasSubscribers)return"unknown";let i=mR(n,this.pressedControlKeys.size>0),o=this.session;if(o&&i.timeStamp-o.lastTimeStamp>=this.options.endDelay){if(this.end(),!this.hasSubscribers)return"unknown";o=null}o?(this.scheduleEnd(),this.addSample(o,i)):(o=this.startPendingSession(i),this.scheduleEnd());let{device:s}=o;return s==="unknown"&&(s=Jh(o.samples,!1),s!=="unknown"&&this.begin(o,s)),s},this.finishClassification=()=>{if(this.classificationTimer=null,!this.session||this.session.device!=="unknown")return;let n=this.session,i=Jh(n.samples,!0);this.begin(n,i==="unknown"?"mouse":i)},this.end=()=>{if(!this.session)return;if(this.session.device==="unknown"){let i=this.session,o=Jh(i.samples,!0);this.begin(i,o==="unknown"?"mouse":o)}if(!this.session)return;let n=this.session;this.emit(B.End,n.lastEvent),this.reset()},this.handleKeyDown=n=>{n.key==="Control"&&this.pressedControlKeys.add(n.code||n.key)},this.handleKeyUp=n=>{n.key==="Control"&&(n.code?this.pressedControlKeys.delete(n.code):this.pressedControlKeys.clear())},this.handleWindowBlur=()=>{this.pressedControlKeys.clear()},this.element=e,this.options={...hR,...t},this.element?.addEventListener("wheel",this.handleEvent,{passive:!0})}get hasSubscribers(){return this.subscriptions.size>0}get device(){return this.session?.device??"unknown"}on(e){let t={listener:e};return this.subscriptions.set(e,t),this.updateControlKeyEventListeners(),()=>{this.subscriptions.get(e)===t&&this.off(e)}}off(e){this.subscriptions.delete(e),this.updateControlKeyEventListeners(),this.hasSubscribers||this.reset()}cancel(){let e=this.session;e&&e.device!=="unknown"&&this.emit(B.Cancel,e.lastEvent),this.reset()}destroy(){this.cancel(),this.subscriptions.clear(),this.updateControlKeyEventListeners(),this.element?.removeEventListener("wheel",this.handleEvent)}startPendingSession(e){let t={samples:[e],device:"unknown",firstTimeStamp:e.timeStamp,lastTimeStamp:e.timeStamp,totalDeltaX:e.deltaX,totalDeltaY:e.deltaY,velocityX:0,velocityY:0,lastEvent:e.event};return this.session=t,this.classificationTimer=globalThis.setTimeout(this.finishClassification,this.options.classificationDelay),t}addSample(e,t){if(e.samples.push(t),e.lastTimeStamp=t.timeStamp,e.lastEvent=t.event,e.totalDeltaX+=t.deltaX,e.totalDeltaY+=t.deltaY,e.device!=="unknown"){let n=e.samples[e.samples.length-2],i=t.timeStamp-n.timeStamp;e.velocityX=i>0?t.deltaX/i:0,e.velocityY=i>0?t.deltaY/i:0,this.emit(B.Move,t.event,{velocityX:e.velocityX,velocityY:e.velocityY})}}begin(e,t){e.device=t,this.clearClassificationTimer(),this.emit(B.Start,e.samples[0].event);let n=e.lastTimeStamp-e.firstTimeStamp;e.velocityX=n>0?e.totalDeltaX/n:0,e.velocityY=n>0?e.totalDeltaY/n:0,this.emit(B.Move,e.lastEvent,{velocityX:e.velocityX,velocityY:e.velocityY})}scheduleEnd(){this.clearEndTimer(),this.endTimer=globalThis.setTimeout(this.end,this.options.endDelay)}emit(e,t,n){let i=this.session;if(!i||i.device==="unknown")return;let o=e===B.Start,s=e===B.End||e===B.Cancel,a=o?i.firstTimeStamp:i.lastTimeStamp,c=o?0:Math.max(0,a-i.firstTimeStamp),l=o?0:i.totalDeltaX,u=o?0:i.totalDeltaY,f=c>0?l/c:0,d=c>0?u/c:0,h=o?0:n?.velocityX??i.velocityX,p=o?0:n?.velocityY??i.velocityY,m={eventType:e,device:i.device,srcEvent:t,timeStamp:a,center:{x:t.clientX,y:t.clientY},deltaX:l,deltaY:u,deltaTime:c,velocity:Math.abs(h)>Math.abs(p)?h:p,velocityX:h,velocityY:p,overallVelocity:Math.abs(f)>Math.abs(d)?f:d,overallVelocityX:f,overallVelocityY:d,isFirst:o,isFinal:s};for(let{listener:g}of[...this.subscriptions.values()])g(m)}reset(){this.clearClassificationTimer(),this.clearEndTimer(),this.session=null}clearClassificationTimer(){this.classificationTimer!==null&&(globalThis.clearTimeout(this.classificationTimer),this.classificationTimer=null)}clearEndTimer(){this.endTimer!==null&&(globalThis.clearTimeout(this.endTimer),this.endTimer=null)}updateControlKeyEventListeners(){let e=this.hasSubscribers,t=pR();!t||e===this.listeningForControlKeys||(this.listeningForControlKeys=e,e?(t.addEventListener("keydown",this.handleKeyDown,!0),t.addEventListener("keyup",this.handleKeyUp,!0),t.addEventListener("blur",this.handleWindowBlur)):(t.removeEventListener("keydown",this.handleKeyDown,!0),t.removeEventListener("keyup",this.handleKeyUp,!0),t.removeEventListener("blur",this.handleWindowBlur),this.pressedControlKeys.clear()))}};function pR(){return typeof window<"u"?window:globalThis.document?.defaultView}function mR(r,e){let t=r.deltaX,n=r.deltaY;return r.deltaMode===uR&&(t*=T0,n*=T0),{event:r,timeStamp:r.timeStamp,deltaX:t,deltaY:n,isControlKeyDown:e}}function Jh(r,e){return r.some(({event:t,isControlKeyDown:n})=>t.ctrlKey&&!n)?"trackpad":r.some(({event:t})=>t.deltaMode!==lR)||r.some(gR)||r.every(({event:t})=>{let n=t.wheelDelta;return n!==void 0&&Math.abs(n)%40===0})?"mouse":r.some(({deltaX:t})=>t!==0)||r.length>1&&_R(r)?"trackpad":e?"mouse":"unknown"}function gR({event:r,deltaX:e,deltaY:t}){if(e!==0||t===0)return!1;let n=Math.abs(t/cR);if(Number.isInteger(n))return!0;let i=r.wheelDelta;return typeof i=="number"&&i!==0&&i%dR===0}function _R(r){for(let e=0;e<r.length;e++){let t=r[e];if(Math.abs(t.deltaX)>L0||Math.abs(t.deltaY)>L0||e>0&&t.timeStamp-r[e-1].timeStamp>fR)return!1}return!0}var A0=["mousedown","mousemove","mouseup","mouseover","mouseout","mouseenter","mouseleave"],Hc=class extends St{constructor(e,t,n){super(e,t,{enable:!0,...n}),this.handleEvent=o=>{this.handleOverEvent(o),this.handleOutEvent(o),this.handleEnterEvent(o),this.handleLeaveEvent(o),this.handleMoveEvent(o)},this.pressed=!1;let{enable:i=!1}=this.options;this.enableMoveEvent=i,this.enableLeaveEvent=i,this.enableEnterEvent=i,this.enableOutEvent=i,this.enableOverEvent=i,i&&A0.forEach(o=>this.listen(o,!0))}destroy(){A0.forEach(e=>this.listen(e,!1))}enableEventType(e,t){switch(e){case"pointermove":this.enableMoveEvent!==t&&(this.enableMoveEvent=t,this.listen("mousedown",t),this.listen("mousemove",t),this.listen("mouseup",t));break;case"pointerover":this.enableOverEvent!==t&&(this.enableOverEvent=t,this.listen("mouseover",t));break;case"pointerout":this.enableOutEvent!==t&&(this.enableOutEvent=t,this.listen("mouseout",t));break;case"pointerenter":this.enableEnterEvent!==t&&(this.enableEnterEvent=t,this.listen("mouseenter",t));break;case"pointerleave":this.enableLeaveEvent!==t&&(this.enableLeaveEvent=t,this.listen("mouseleave",t));break;default:}}handleOverEvent(e){this.enableOverEvent&&e.type==="mouseover"&&this._emit("pointerover",e)}handleOutEvent(e){this.enableOutEvent&&e.type==="mouseout"&&this._emit("pointerout",e)}handleEnterEvent(e){this.enableEnterEvent&&e.type==="mouseenter"&&this._emit("pointerenter",e)}handleLeaveEvent(e){this.enableLeaveEvent&&e.type==="mouseleave"&&this._emit("pointerleave",e)}handleMoveEvent(e){if(this.enableMoveEvent)switch(e.type){case"mousedown":e.button>=0&&(this.pressed=!0);break;case"mousemove":e.buttons===0&&(this.pressed=!1),this.pressed||this._emit("pointermove",e);break;case"mouseup":this.pressed=!1;break;default:}}_emit(e,t){this.callback({type:e,center:{x:t.clientX,y:t.clientY},srcEvent:t,pointerType:"mouse",target:t.target})}};var C0=["keydown","keyup"],Yc=class extends St{constructor(e,t,n){super(e,t,{enable:!0,tabIndex:0,...n}),this.handleEvent=o=>{let s=o.target||o.srcElement;s.tagName==="INPUT"&&s.type==="text"||s.tagName==="TEXTAREA"||(this.enableDownEvent&&o.type==="keydown"&&this.callback({type:"keydown",srcEvent:o,key:o.key,target:o.target}),this.enableUpEvent&&o.type==="keyup"&&this.callback({type:"keyup",srcEvent:o,key:o.key,target:o.target}))};let{enable:i=!1}=this.options;this.enableDownEvent=i,this.enableUpEvent=i,e.tabIndex=this.options.tabIndex,e.style.outline="none",i&&C0.forEach(o=>this.listen(o,!0))}destroy(){C0.forEach(e=>this.listen(e,!1))}enableEventType(e,t){e==="keydown"&&this.enableDownEvent!==t&&(this.enableDownEvent=t,this.listen(e,t)),e==="keyup"&&this.enableUpEvent!==t&&(this.enableUpEvent=t,this.listen(e,t))}};var qc=class extends St{constructor(e,t,n){n.enable=n.enable??!1,super(e,t,n),this.handleEvent=i=>{this.options.enable&&this.callback({type:"contextmenu",center:{x:i.clientX,y:i.clientY},srcEvent:i,pointerType:"mouse",target:i.target})},n.enable&&this.listen("contextmenu",!0)}destroy(){this.listen("contextmenu",!1)}enableEventType(e,t){e==="contextmenu"&&this.options.enable!==t&&(this.options.enable=t,this.listen("contextmenu",t))}};var yR={pointerdown:1,pointermove:2,pointerup:4,mousedown:1,mousemove:2,mouseup:4},bR=0,xR=1,vR=2,wR=1,ER=2,PR=4;function M0(r){let e=yR[r.srcEvent.type];if(!e)return null;let{buttons:t,button:n}=r.srcEvent,i=!1,o=!1,s=!1;return e===2?(i=!!(t&wR),o=!!(t&PR),s=!!(t&ER)):(i=n===bR,o=n===xR,s=n===vR),{leftButton:i,middleButton:o,rightButton:s}}function R0(r,e){let t=r.center;if(!t)return null;let n=e.getBoundingClientRect(),i=n.width/e.offsetWidth||1,o=n.height/e.offsetHeight||1,s={x:(t.x-n.left-e.clientLeft)/i,y:(t.y-n.top-e.clientTop)/o};return{center:t,offsetCenter:s}}var SR={srcElement:"root",priority:0},Zc=class{constructor(e,t){this.handleEvent=n=>{if(this.isEmpty())return;let i=this._normalizeEvent(n),o=n.srcEvent.target;for(;o&&o!==i.rootElement;){if(this._emit(i,o),i.handled)return;o=o.parentNode}this._emit(i,"root")},this.eventManager=e,this.recognizerName=t,this.handlers=[],this.handlersByElement=new Map,this._active=!1}isEmpty(){return!this._active}add(e,t,n,i=!1,o=!1){let{handlers:s,handlersByElement:a}=this,c={...SR,...n},l=a.get(c.srcElement);l||(l=[],a.set(c.srcElement,l));let u={type:e,handler:t,srcElement:c.srcElement,priority:c.priority};i&&(u.once=!0),o&&(u.passive=!0),s.push(u),this._active=this._active||!u.passive;let f=l.length-1;for(;f>=0&&!(l[f].priority>=u.priority);)f--;l.splice(f+1,0,u)}remove(e,t){let{handlers:n,handlersByElement:i}=this;for(let o=n.length-1;o>=0;o--){let s=n[o];if(s.type===e&&s.handler===t){n.splice(o,1);let a=i.get(s.srcElement);a.splice(a.indexOf(s),1),a.length===0&&i.delete(s.srcElement)}}this._active=n.some(o=>!o.passive)}_emit(e,t){let n=this.handlersByElement.get(t);if(n){let i=!1,o=()=>{e.handled=!0},s=()=>{e.handled=!0,i=!0},a=[];for(let c=0;c<n.length;c++){let{type:l,handler:u,once:f}=n[c];if(u({...e,type:l,stopPropagation:o,stopImmediatePropagation:s}),f&&a.push(n[c]),i)break}for(let c=0;c<a.length;c++){let{type:l,handler:u}=a[c];this.remove(l,u)}}}_normalizeEvent(e){let t=this.eventManager.getElement();return{...e,...M0(e),...R0(e,t),preventDefault:()=>{e.srcEvent.preventDefault()},stopImmediatePropagation:null,stopPropagation:null,handled:!1,rootElement:t}}};function TR(r){if("recognizer"in r)return r;let e,t=Array.isArray(r)?[...r]:[r];if(typeof t[0]=="function"){let n=t.shift(),i=t.shift()||{};e=new n(i)}else e=t.shift();return{recognizer:e,recognizeWith:typeof t[0]=="string"?[t[0]]:t[0],requireFailure:typeof t[1]=="string"?[t[1]]:t[1]}}var Qo=class{constructor(e=null,t={}){if(this._onBasicInput=n=>{this.manager.emit(n.srcEvent.type,n)},this._onOtherEvent=n=>{this.manager.emit(n.type,n)},this.options={recognizers:[],events:{},touchAction:"compute",tabIndex:0,cssProps:{},...t},this.events=new Map,this.element=e,this.wheelSession=new jc(e),!!e){this.manager=new Ko(e,this.options);for(let n of this.options.recognizers){let{recognizer:i,recognizeWith:o,requireFailure:s}=TR(n);this.manager.add(i),o&&i.recognizeWith(o),s&&i.requireFailure(s)}this.manager.on("hammer.input",this._onBasicInput),this.wheelInput=new Wc(e,this._onOtherEvent,{enable:!1,wheelSession:this.wheelSession}),this.moveInput=new Hc(e,this._onOtherEvent,{enable:!1}),this.keyInput=new Yc(e,this._onOtherEvent,{enable:!1,tabIndex:t.tabIndex}),this.contextmenuInput=new qc(e,this._onOtherEvent,{enable:!1}),this.on(this.options.events)}}getElement(){return this.element}destroy(){if(!this.element){this.wheelSession.destroy();return}this.wheelInput.destroy(),this.wheelSession.destroy(),this.moveInput.destroy(),this.keyInput.destroy(),this.contextmenuInput.destroy(),this.manager.destroy()}on(e,t,n){this._addEventHandler(e,t,n,!1)}once(e,t,n){this._addEventHandler(e,t,n,!0)}watch(e,t,n){this._addEventHandler(e,t,n,!1,!0)}off(e,t){this._removeEventHandler(e,t)}emit(e){this.manager?.emit(e.type,e)}_toggleRecognizer(e,t){let{manager:n}=this;if(!n)return;let i=n.get(e);i&&(i.set({enable:t,wheelSession:this.wheelSession}),n.touchAction.update()),this.wheelInput?.enableEventType(e,t),this.moveInput?.enableEventType(e,t),this.keyInput?.enableEventType(e,t),this.contextmenuInput?.enableEventType(e,t)}_addEventHandler(e,t,n,i,o){if(typeof e!="string"){n=t;for(let[l,u]of Object.entries(e))this._addEventHandler(l,u,n,i,o);return}let{manager:s,events:a}=this;if(!s)return;let c=a.get(e);if(!c){let l=this._getRecognizerName(e)||e;c=new Zc(this,l),a.set(e,c),s&&s.on(e,c.handleEvent)}c.add(e,t,n,i,o),c.isEmpty()||this._toggleRecognizer(c.recognizerName,!0)}_removeEventHandler(e,t){if(typeof e!="string"){for(let[o,s]of Object.entries(e))this._removeEventHandler(o,s);return}let{events:n}=this,i=n.get(e);if(i&&(i.remove(e,t),i.isEmpty())){let{recognizerName:o}=i,s=!1;for(let a of n.values())if(a.recognizerName===o&&!a.isEmpty()){s=!0;break}s||this._toggleRecognizer(o,!1)}}_getRecognizerName(e){return this.manager.recognizers.find(t=>t.getEventNames().includes(e))?.options.event}};var ep={DEFAULT:"default",LNGLAT:"lnglat",METER_OFFSETS:"meter-offsets",LNGLAT_OFFSETS:"lnglat-offsets",CARTESIAN:"cartesian"};Object.defineProperty(ep,"IDENTITY",{get:()=>(F.deprecated("COORDINATE_SYSTEM.IDENTITY","COORDINATE_SYSTEM.CARTESIAN")(),ep.CARTESIAN)});var oe={WEB_MERCATOR:1,GLOBE:2,WEB_MERCATOR_AUTO_OFFSET:4,IDENTITY:0},Te={common:0,meters:1,pixels:2},ci={click:"onClick",dblclick:"onClick",panstart:"onDragStart",panmove:"onDrag",panend:"onDragEnd"},tp={multipan:[yr,{threshold:10,pointers:2,trackpad:!0}],pinch:[ai,{trackpad:!0},null,["multipan"]],pan:[yr,{threshold:1},["pinch"],["multipan"]],dblclick:[un,{event:"dblclick",taps:2,enable:!1}],dblclickdrag:[oi,{event:"dblclickdrag",enable:!1},["dblclick"],null],click:[un,{event:"click"},["dblclickdrag"],["dblclick","dblclickdrag"]]};function LR(r,e){if(r===e)return!0;if(Array.isArray(r)){let t=r.length;if(!e||e.length!==t)return!1;for(let n=0;n<t;n++)if(r[n]!==e[n])return!1;return!0}return!1}function Tt(r){let e={},t;return n=>{for(let i in n)if(!LR(n[i],e[i])){t=r(n),e=n;break}return t}}var I0=[0,0,0,0],AR=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0],O0=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],CR=[0,0,0],B0=[0,0,0],MR={default:-1,cartesian:0,lnglat:1,"meter-offsets":2,"lnglat-offsets":3};function fn(r){let e=MR[r];if(e===void 0)throw new Error(`Invalid coordinateSystem: ${r}`);return e}var RR=Tt(OR);function rp(r,e,t=B0){t.length<3&&(t=[t[0],t[1],0]);let n=t,i,o=!0;switch(e==="lnglat-offsets"||e==="meter-offsets"?i=t:i=r.isGeospatial?[Math.fround(r.longitude),Math.fround(r.latitude),0]:null,r.projectionMode){case oe.WEB_MERCATOR:(e==="lnglat"||e==="cartesian")&&(i=[0,0,0],o=!1);break;case oe.WEB_MERCATOR_AUTO_OFFSET:e==="lnglat"?n=i:e==="cartesian"&&(n=[Math.fround(r.center[0]),Math.fround(r.center[1]),0],i=r.unprojectPosition(n),n[0]-=t[0],n[1]-=t[1],n[2]-=t[2]);break;case oe.IDENTITY:n=r.position.map(Math.fround),n[2]=n[2]||0;break;case oe.GLOBE:o=!1,i=null;break;default:o=!1}return{geospatialOrigin:i,shaderCoordinateOrigin:n,offsetMode:o}}function IR(r,e,t){let{viewMatrixUncentered:n,projectionMatrix:i}=r,{viewMatrix:o,viewProjectionMatrix:s}=r,a=I0,c=I0,l=r.cameraPosition,{geospatialOrigin:u,shaderCoordinateOrigin:f,offsetMode:d}=rp(r,e,t);return d&&(c=r.projectPosition(u||f),l=[l[0]-c[0],l[1]-c[1],l[2]-c[2]],c[3]=1,a=Ce.transformMat4([],c,s),o=n||o,s=ae.multiply([],i,o),s=ae.multiply([],s,AR)),{viewMatrix:o,viewProjectionMatrix:s,projectionCenter:a,originCommon:c,cameraPosCommon:l,shaderCoordinateOrigin:f,geospatialOrigin:u}}function D0({viewport:r,devicePixelRatio:e=1,modelMatrix:t=null,coordinateSystem:n="default",coordinateOrigin:i=B0,autoWrapLongitude:o=!1}){n==="default"&&(n=r.isGeospatial?"lnglat":"cartesian");let s=RR({viewport:r,devicePixelRatio:e,coordinateSystem:n,coordinateOrigin:i});return s.wrapLongitude=o,s.modelMatrix=t||O0,s}function OR({viewport:r,devicePixelRatio:e,coordinateSystem:t,coordinateOrigin:n}){let{projectionCenter:i,viewProjectionMatrix:o,originCommon:s,cameraPosCommon:a,shaderCoordinateOrigin:c,geospatialOrigin:l}=IR(r,t,n),u=r.getDistanceScales(),f=[r.width*e,r.height*e],d=Ce.transformMat4([],[0,0,-r.focalDistance,1],r.projectionMatrix)[3]||1,h={coordinateSystem:fn(t),projectionMode:r.projectionMode,coordinateOrigin:c,commonOrigin:s.slice(0,3),center:i,pseudoMeters:!!r._pseudoMeters,viewportSize:f,devicePixelRatio:e,focalDistance:d,commonUnitsPerMeter:u.unitsPerMeter,commonUnitsPerWorldUnit:u.unitsPerMeter,commonUnitsPerWorldUnit2:CR,scale:r.scale,wrapLongitude:!1,viewProjectionMatrix:o,modelMatrix:O0,cameraPosition:a};if(l){let p=r.getDistanceScales(l);switch(t){case"meter-offsets":h.commonUnitsPerWorldUnit=p.unitsPerMeter,h.commonUnitsPerWorldUnit2=p.unitsPerMeter2;break;case"lnglat":case"lnglat-offsets":r._pseudoMeters||(h.commonUnitsPerMeter=p.unitsPerMeter),h.commonUnitsPerWorldUnit=p.unitsPerDegree,h.commonUnitsPerWorldUnit2=p.unitsPerDegree2;break;case"cartesian":h.commonUnitsPerWorldUnit=[1,1,p.unitsPerMeter[2]],h.commonUnitsPerWorldUnit2=[0,0,p.unitsPerMeter2[2]];break;default:break}}if(r.projectionMode===oe.GLOBE&&t==="meter-offsets"){let g=n[0]*Math.PI/180,b=n[1]*Math.PI/180,y=Math.cos(b),x=((n[2]||0)/6370972+1)*256;h.commonOrigin=[Math.sin(g)*y*x,-Math.cos(g)*y*x,Math.sin(b)*x]}return h}var BR=["default","lnglat","meter-offsets","lnglat-offsets","cartesian"],DR=BR.map(r=>`const COORDINATE_SYSTEM_${r.toUpperCase().replaceAll("-","_")}: i32 = ${fn(r)};`).join(""),kR=Object.keys(oe).map(r=>`const PROJECTION_MODE_${r}: i32 = ${oe[r]};`).join(""),NR=Object.keys(Te).map(r=>`const UNIT_${r.toUpperCase()}: i32 = ${Te[r]};`).join(""),FR=`${DR}
${kR}
${NR}

const TILE_SIZE: f32 = 512.0;
const PI: f32 = 3.1415926536;
const WORLD_SCALE: f32 = TILE_SIZE / (PI * 2.0);
const ZERO_64_LOW: vec3<f32> = vec3<f32>(0.0, 0.0, 0.0);
const EARTH_RADIUS: f32 = 6370972.0; // meters
const GLOBE_RADIUS: f32 = 256.0;

// -----------------------------------------------------------------------------
// Uniform block (converted from GLSL uniform block)
// -----------------------------------------------------------------------------
struct ProjectUniforms {
  wrapLongitude: i32,
  coordinateSystem: i32,
  commonUnitsPerMeter: vec3<f32>,
  projectionMode: i32,
  scale: f32,
  commonUnitsPerWorldUnit: vec3<f32>,
  commonUnitsPerWorldUnit2: vec3<f32>,
  center: vec4<f32>,
  modelMatrix: mat4x4<f32>,
  viewProjectionMatrix: mat4x4<f32>,
  viewportSize: vec2<f32>,
  devicePixelRatio: f32,
  focalDistance: f32,
  cameraPosition: vec3<f32>,
  coordinateOrigin: vec3<f32>,
  commonOrigin: vec3<f32>,
  pseudoMeters: i32,
};

@group(0) @binding(auto)
var<uniform> project: ProjectUniforms;

// -----------------------------------------------------------------------------
// Geometry data shared across the project helpers.
// The active layer shader is responsible for populating this private module
// state before calling the project functions below.
// -----------------------------------------------------------------------------

// Structure to carry additional geometry data used by deck.gl filters.
struct Geometry {
  worldPosition: vec3<f32>,
  worldPositionAlt: vec3<f32>,
  position: vec4<f32>,
  normal: vec3<f32>,
  uv: vec2<f32>,
  pickingColor: vec3<f32>,
};

var<private> geometry: Geometry;
`,k0=`${FR}

// -----------------------------------------------------------------------------
// Functions
// -----------------------------------------------------------------------------

// Returns an adjustment factor for commonUnitsPerMeter
fn _project_size_at_latitude(lat: f32) -> f32 {
  let y = clamp(lat, -89.9, 89.9);
  return 1.0 / cos(radians(y));
}

// Overloaded version: scales a value in meters at a given latitude.
fn _project_size_at_latitude_m(meters: f32, lat: f32) -> f32 {
  return meters * project.commonUnitsPerMeter.z * _project_size_at_latitude(lat);
}

// Computes a non-linear scale factor based on geometry.
// (Note: This function relies on "geometry" being provided.)
fn project_size() -> f32 {
  if (project.projectionMode == PROJECTION_MODE_WEB_MERCATOR &&
      project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT &&
      project.pseudoMeters == 0) {
    if (geometry.position.w == 0.0) {
      return _project_size_at_latitude(geometry.worldPosition.y);
    }
    let y: f32 = geometry.position.y / TILE_SIZE * 2.0 - 1.0;
    let y2 = y * y;
    let y4 = y2 * y2;
    let y6 = y4 * y2;
    return 1.0 + 4.9348 * y2 + 4.0587 * y4 + 1.5642 * y6;
  }
  return 1.0;
}

// Overloads to scale offsets (meters to world units)
fn project_size_float(meters: f32) -> f32 {
  return meters * project.commonUnitsPerMeter.z * project_size();
}

fn project_size_vec2(meters: vec2<f32>) -> vec2<f32> {
  return meters * project.commonUnitsPerMeter.xy * project_size();
}

fn project_size_vec3(meters: vec3<f32>) -> vec3<f32> {
  return meters * project.commonUnitsPerMeter * project_size();
}

fn project_size_vec4(meters: vec4<f32>) -> vec4<f32> {
  return vec4<f32>(meters.xyz * project.commonUnitsPerMeter, meters.w);
}

// Returns a rotation matrix aligning the z\u2011axis with the given up vector.
fn project_get_orientation_matrix(up: vec3<f32>) -> mat3x3<f32> {
  let uz = normalize(up);
  let ux = select(
    vec3<f32>(1.0, 0.0, 0.0),
    normalize(vec3<f32>(uz.y, -uz.x, 0.0)),
    abs(uz.z) == 1.0
  );
  let uy = cross(uz, ux);
  return mat3x3<f32>(ux, uy, uz);
}

// Since WGSL does not support "out" parameters, we return a struct.
struct RotationResult {
  needsRotation: bool,
  transform: mat3x3<f32>,
};

fn project_needs_rotation(commonPosition: vec3<f32>) -> RotationResult {
  if (project.projectionMode == PROJECTION_MODE_GLOBE) {
    return RotationResult(true, project_get_orientation_matrix(commonPosition));
  } else {
    return RotationResult(false, mat3x3<f32>());  // identity alternative if needed
  };
}

// Projects a normal vector from the current coordinate system to world space.
fn project_normal(vector: vec3<f32>) -> vec3<f32> {
  let normal_modelspace = project.modelMatrix * vec4<f32>(vector, 0.0);
  var n = normalize(normal_modelspace.xyz * project.commonUnitsPerMeter);
  let rotResult = project_needs_rotation(geometry.position.xyz);
  if (rotResult.needsRotation) {
    n = rotResult.transform * n;
  }
  return n;
}

// Applies a scale offset based on y-offset (dy)
fn project_offset_(offset: vec4<f32>) -> vec4<f32> {
  let dy: f32 = offset.y;
  let commonUnitsPerWorldUnit = project.commonUnitsPerWorldUnit + project.commonUnitsPerWorldUnit2 * dy;
  return vec4<f32>(offset.xyz * commonUnitsPerWorldUnit, offset.w);
}

// Projects lng/lat coordinates to a unit tile [0,1]
fn project_mercator_(lnglat: vec2<f32>) -> vec2<f32> {
  var x = lnglat.x;
  if (project.wrapLongitude != 0) {
    x = ((x + 180.0) % 360.0) - 180.0;
  }
  let y = clamp(lnglat.y, -89.9, 89.9);
  return vec2<f32>(
    radians(x) + PI,
    PI + log(tan_fp32(PI * 0.25 + radians(y) * 0.5))
  ) * WORLD_SCALE;
}

// Projects lng/lat/z coordinates for a globe projection.
fn project_globe_(lnglatz: vec3<f32>) -> vec3<f32> {
  let lambda = radians(lnglatz.x);
  let phi = radians(lnglatz.y);
  let cosPhi = cos(phi);
  let D = (lnglatz.z / EARTH_RADIUS + 1.0) * GLOBE_RADIUS;
  return vec3<f32>(
    sin(lambda) * cosPhi,
    -cos(lambda) * cosPhi,
    sin(phi)
  ) * D;
}

// Projects positions (with an optional 64-bit low part) from the input
// coordinate system to the common space.
fn project_position_vec4_f64(position: vec4<f32>, position64Low: vec3<f32>) -> vec4<f32> {
  var position_world = project.modelMatrix * position;

  // Work around for a Mac+NVIDIA bug:
  if (project.projectionMode == PROJECTION_MODE_WEB_MERCATOR) {
    if (project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT) {
      return vec4<f32>(
        project_mercator_(position_world.xy),
        _project_size_at_latitude_m(position_world.z, position_world.y),
        position_world.w
      );
    }
    if (project.coordinateSystem == COORDINATE_SYSTEM_CARTESIAN) {
      position_world = vec4f(position_world.xyz + project.coordinateOrigin, position_world.w);
    }
  }
  if (project.projectionMode == PROJECTION_MODE_GLOBE) {
    if (project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT) {
      return vec4<f32>(
        project_globe_(position_world.xyz),
        position_world.w
      );
    }
    if (project.coordinateSystem == COORDINATE_SYSTEM_METER_OFFSETS) {
      let enuMatrix = project_get_orientation_matrix(project.commonOrigin);
      let metersToCommon = GLOBE_RADIUS / EARTH_RADIUS;
      let offsetCommon = (enuMatrix * vec3<f32>(-position_world.x, -position_world.y, position_world.z)) * metersToCommon;
      return vec4<f32>(project.commonOrigin + offsetCommon, position_world.w);
    }
  }
  if (project.projectionMode == PROJECTION_MODE_WEB_MERCATOR_AUTO_OFFSET) {
    if (project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT) {
      if (abs(position_world.y - project.coordinateOrigin.y) > 0.25) {
        return vec4<f32>(
          project_mercator_(position_world.xy) - project.commonOrigin.xy,
          project_size_float(position_world.z),
          position_world.w
        );
      }
    }
  }
  if (project.projectionMode == PROJECTION_MODE_IDENTITY ||
      (project.projectionMode == PROJECTION_MODE_WEB_MERCATOR_AUTO_OFFSET &&
       (project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT ||
        project.coordinateSystem == COORDINATE_SYSTEM_CARTESIAN))) {
    position_world = vec4f(position_world.xyz - project.coordinateOrigin, position_world.w);
  }

  return project_offset_(position_world) +
         project_offset_(project.modelMatrix * vec4<f32>(position64Low, 0.0));
}

// Overloaded versions for different input types.
fn project_position_vec4_f32(position: vec4<f32>) -> vec4<f32> {
  return project_position_vec4_f64(position, ZERO_64_LOW);
}

fn project_position_vec3_f64(position: vec3<f32>, position64Low: vec3<f32>) -> vec3<f32> {
  let projected_position = project_position_vec4_f64(vec4<f32>(position, 1.0), position64Low);
  return projected_position.xyz;
}

fn project_position_vec3_f32(position: vec3<f32>) -> vec3<f32> {
  let projected_position = project_position_vec4_f64(vec4<f32>(position, 1.0), ZERO_64_LOW);
  return projected_position.xyz;
}

fn project_position_vec2_f32(position: vec2<f32>) -> vec2<f32> {
  let projected_position = project_position_vec4_f64(vec4<f32>(position, 0.0, 1.0), ZERO_64_LOW);
  return projected_position.xy;
}

// Transforms a common space position to clip space.
fn project_common_position_to_clipspace_with_projection(position: vec4<f32>, viewProjectionMatrix: mat4x4<f32>, center: vec4<f32>) -> vec4<f32> {
  var clipPosition = viewProjectionMatrix * position + center;
  // deck.gl projection matrices use WebGL's [-w, w] depth range; WebGPU clips z to [0, w].
  clipPosition.z = (clipPosition.z + clipPosition.w) * 0.5;
  return clipPosition;
}

// Uses the project viewProjectionMatrix and center.
fn project_common_position_to_clipspace(position: vec4<f32>) -> vec4<f32> {
  return project_common_position_to_clipspace_with_projection(position, project.viewProjectionMatrix, project.center);
}

// Returns a clip space offset corresponding to a given number of screen pixels.
fn project_pixel_size_to_clipspace(pixels: vec2<f32>) -> vec2<f32> {
  let offset = pixels / project.viewportSize * project.devicePixelRatio * 2.0;
  return offset * project.focalDistance;
}

fn project_meter_size_to_pixel(meters: f32) -> f32 {
  return project_size_float(meters) * project.scale;
}

fn project_unit_size_to_pixel(size: f32, unit: i32) -> f32 {
  if (unit == UNIT_METERS) {
    return project_meter_size_to_pixel(size);
  } else if (unit == UNIT_COMMON) {
    return size * project.scale;
  }
  // UNIT_PIXELS: no scaling applied.
  return size;
}

fn project_pixel_size_float(pixels: f32) -> f32 {
  return pixels / project.scale;
}

fn project_pixel_size_vec2(pixels: vec2<f32>) -> vec2<f32> {
  return pixels / project.scale;
}
`;var UR=["default","lnglat","meter-offsets","lnglat-offsets","cartesian"],GR=UR.map(r=>`const int COORDINATE_SYSTEM_${r.toUpperCase().replaceAll("-","_")} = ${fn(r)};`).join(""),zR=Object.keys(oe).map(r=>`const int PROJECTION_MODE_${r} = ${oe[r]};`).join(""),$R=Object.keys(Te).map(r=>`const int UNIT_${r.toUpperCase()} = ${Te[r]};`).join(""),N0=`${GR}
${zR}
${$R}
layout(std140) uniform projectUniforms {
bool wrapLongitude;
int coordinateSystem;
vec3 commonUnitsPerMeter;
int projectionMode;
float scale;
vec3 commonUnitsPerWorldUnit;
vec3 commonUnitsPerWorldUnit2;
vec4 center;
mat4 modelMatrix;
mat4 viewProjectionMatrix;
vec2 viewportSize;
float devicePixelRatio;
float focalDistance;
vec3 cameraPosition;
vec3 coordinateOrigin;
vec3 commonOrigin;
bool pseudoMeters;
} project;
const float TILE_SIZE = 512.0;
const float PI = 3.1415926536;
const float WORLD_SCALE = TILE_SIZE / (PI * 2.0);
const vec3 ZERO_64_LOW = vec3(0.0);
const float EARTH_RADIUS = 6370972.0;
const float GLOBE_RADIUS = 256.0;
float project_size_at_latitude(float lat) {
float y = clamp(lat, -89.9, 89.9);
return 1.0 / cos(radians(y));
}
float project_size() {
if (project.projectionMode == PROJECTION_MODE_WEB_MERCATOR &&
project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT &&
project.pseudoMeters == false) {
if (geometry.position.w == 0.0) {
return project_size_at_latitude(geometry.worldPosition.y);
}
float y = geometry.position.y / TILE_SIZE * 2.0 - 1.0;
float y2 = y * y;
float y4 = y2 * y2;
float y6 = y4 * y2;
return 1.0 + 4.9348 * y2 + 4.0587 * y4 + 1.5642 * y6;
}
return 1.0;
}
float project_size_at_latitude(float meters, float lat) {
return meters * project.commonUnitsPerMeter.z * project_size_at_latitude(lat);
}
float project_size(float meters) {
return meters * project.commonUnitsPerMeter.z * project_size();
}
vec2 project_size(vec2 meters) {
return meters * project.commonUnitsPerMeter.xy * project_size();
}
vec3 project_size(vec3 meters) {
return meters * project.commonUnitsPerMeter * project_size();
}
vec4 project_size(vec4 meters) {
return vec4(meters.xyz * project.commonUnitsPerMeter, meters.w);
}
mat3 project_get_orientation_matrix(vec3 up) {
vec3 uz = normalize(up);
vec3 ux = abs(uz.z) == 1.0 ? vec3(1.0, 0.0, 0.0) : normalize(vec3(uz.y, -uz.x, 0));
vec3 uy = cross(uz, ux);
return mat3(ux, uy, uz);
}
bool project_needs_rotation(vec3 commonPosition, out mat3 transform) {
if (project.projectionMode == PROJECTION_MODE_GLOBE) {
transform = project_get_orientation_matrix(commonPosition);
return true;
}
return false;
}
vec3 project_normal(vec3 vector) {
vec4 normal_modelspace = project.modelMatrix * vec4(vector, 0.0);
vec3 n = normalize(normal_modelspace.xyz * project.commonUnitsPerMeter);
mat3 rotation;
if (project_needs_rotation(geometry.position.xyz, rotation)) {
n = rotation * n;
}
return n;
}
vec4 project_offset_(vec4 offset) {
float dy = offset.y;
vec3 commonUnitsPerWorldUnit = project.commonUnitsPerWorldUnit + project.commonUnitsPerWorldUnit2 * dy;
return vec4(offset.xyz * commonUnitsPerWorldUnit, offset.w);
}
vec2 project_mercator_(vec2 lnglat) {
float x = lnglat.x;
if (project.wrapLongitude) {
x = mod(x + 180., 360.0) - 180.;
}
float y = clamp(lnglat.y, -89.9, 89.9);
return vec2(
radians(x) + PI,
PI + log(tan_fp32(PI * 0.25 + radians(y) * 0.5))
) * WORLD_SCALE;
}
vec3 project_globe_(vec3 lnglatz) {
float lambda = radians(lnglatz.x);
float phi = radians(lnglatz.y);
float cosPhi = cos(phi);
float D = (lnglatz.z / EARTH_RADIUS + 1.0) * GLOBE_RADIUS;
return vec3(
sin(lambda) * cosPhi,
-cos(lambda) * cosPhi,
sin(phi)
) * D;
}
vec4 project_position(vec4 position, vec3 position64Low) {
vec4 position_world = project.modelMatrix * position;
if (project.projectionMode == PROJECTION_MODE_WEB_MERCATOR) {
if (project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT) {
return vec4(
project_mercator_(position_world.xy),
project_size_at_latitude(position_world.z, position_world.y),
position_world.w
);
}
if (project.coordinateSystem == COORDINATE_SYSTEM_CARTESIAN) {
position_world.xyz += project.coordinateOrigin;
}
}
if (project.projectionMode == PROJECTION_MODE_GLOBE) {
if (project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT) {
return vec4(
project_globe_(position_world.xyz),
position_world.w
);
}
if (project.coordinateSystem == COORDINATE_SYSTEM_METER_OFFSETS) {
mat3 enuMatrix = project_get_orientation_matrix(project.commonOrigin);
float metersToCommon = GLOBE_RADIUS / EARTH_RADIUS;
vec3 offsetCommon = (enuMatrix * vec3(-position_world.xy, position_world.z)) * metersToCommon;
return vec4(project.commonOrigin + offsetCommon, position_world.w);
}
}
if (project.projectionMode == PROJECTION_MODE_WEB_MERCATOR_AUTO_OFFSET) {
if (project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT) {
if (abs(position_world.y - project.coordinateOrigin.y) > 0.25) {
return vec4(
project_mercator_(position_world.xy) - project.commonOrigin.xy,
project_size(position_world.z),
position_world.w
);
}
}
}
if (project.projectionMode == PROJECTION_MODE_IDENTITY ||
(project.projectionMode == PROJECTION_MODE_WEB_MERCATOR_AUTO_OFFSET &&
(project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT ||
project.coordinateSystem == COORDINATE_SYSTEM_CARTESIAN))) {
position_world.xyz -= project.coordinateOrigin;
}
return project_offset_(position_world) + project_offset_(project.modelMatrix * vec4(position64Low, 0.0));
}
vec4 project_position(vec4 position) {
return project_position(position, ZERO_64_LOW);
}
vec3 project_position(vec3 position, vec3 position64Low) {
vec4 projected_position = project_position(vec4(position, 1.0), position64Low);
return projected_position.xyz;
}
vec3 project_position(vec3 position) {
vec4 projected_position = project_position(vec4(position, 1.0), ZERO_64_LOW);
return projected_position.xyz;
}
vec2 project_position(vec2 position) {
vec4 projected_position = project_position(vec4(position, 0.0, 1.0), ZERO_64_LOW);
return projected_position.xy;
}
vec4 project_common_position_to_clipspace(vec4 position, mat4 viewProjectionMatrix, vec4 center) {
return viewProjectionMatrix * position + center;
}
vec4 project_common_position_to_clipspace(vec4 position) {
return project_common_position_to_clipspace(position, project.viewProjectionMatrix, project.center);
}
vec2 project_pixel_size_to_clipspace(vec2 pixels) {
vec2 offset = pixels / project.viewportSize * project.devicePixelRatio * 2.0;
return offset * project.focalDistance;
}
float project_size_to_pixel(float meters) {
return project_size(meters) * project.scale;
}
vec2 project_size_to_pixel(vec2 meters) {
return project_size(meters) * project.scale;
}
float project_size_to_pixel(float size, int unit) {
if (unit == UNIT_METERS) return project_size_to_pixel(size);
if (unit == UNIT_COMMON) return size * project.scale;
return size;
}
float project_pixel_size(float pixels) {
return pixels / project.scale;
}
vec2 project_pixel_size(vec2 pixels) {
return pixels / project.scale;
}
`;var VR={};function WR(r=VR){return"viewport"in r?D0(r):{}}var jt={name:"project",dependencies:[on,Uc],source:k0,vs:N0,getUniforms:WR,uniformTypes:{wrapLongitude:"f32",coordinateSystem:"i32",commonUnitsPerMeter:"vec3<f32>",projectionMode:"i32",scale:"f32",commonUnitsPerWorldUnit:"vec3<f32>",commonUnitsPerWorldUnit2:"vec3<f32>",center:"vec4<f32>",modelMatrix:"mat4x4<f32>",viewProjectionMatrix:"mat4x4<f32>",viewportSize:"vec2<f32>",devicePixelRatio:"f32",focalDistance:"f32",cameraPosition:"vec3<f32>",coordinateOrigin:"vec3<f32>",commonOrigin:"vec3<f32>",pseudoMeters:"f32"}};var jR=`// Define a structure to hold both the clip-space position and the common position.
struct ProjectResult {
  clipPosition: vec4<f32>,
  commonPosition: vec4<f32>,
};

// This function mimics the GLSL version with the 'out' parameter by returning both values.
fn project_position_to_clipspace_and_commonspace(
    position: vec3<f32>,
    position64Low: vec3<f32>,
    offset: vec3<f32>
) -> ProjectResult {
  // Compute the projected position.
  let projectedPosition: vec3<f32> = project_position_vec3_f64(position, position64Low);

  // Start with the provided offset.
  var finalOffset: vec3<f32> = offset;

  // Get whether a rotation is needed and the rotation matrix.
  let rotationResult = project_needs_rotation(projectedPosition);

  // If rotation is needed, update the offset.
  if (rotationResult.needsRotation) {
    finalOffset = rotationResult.transform * offset;
  }

  // Compute the common position.
  let commonPosition: vec4<f32> = vec4<f32>(projectedPosition + finalOffset, 1.0);

  // Convert to clip-space.
  let clipPosition: vec4<f32> = project_common_position_to_clipspace(commonPosition);

  return ProjectResult(clipPosition, commonPosition);
}

// A convenience overload that returns only the clip-space position.
fn project_position_to_clipspace(
    position: vec3<f32>,
    position64Low: vec3<f32>,
    offset: vec3<f32>
) -> vec4<f32> {
  return project_position_to_clipspace_and_commonspace(position, position64Low, offset).clipPosition;
}
`,HR=`vec4 project_position_to_clipspace(
  vec3 position, vec3 position64Low, vec3 offset, out vec4 commonPosition
) {
  vec3 projectedPosition = project_position(position, position64Low);
  mat3 rotation;
  if (project_needs_rotation(projectedPosition, rotation)) {
    // offset is specified as ENU
    // when in globe projection, rotate offset so that the ground alighs with the surface of the globe
    offset = rotation * offset;
  }
  commonPosition = vec4(projectedPosition + offset, 1.0);
  return project_common_position_to_clipspace(commonPosition);
}

vec4 project_position_to_clipspace(
  vec3 position, vec3 position64Low, vec3 offset
) {
  vec4 commonPosition;
  return project_position_to_clipspace(position, position64Low, offset, commonPosition);
}
`,br={name:"project32",dependencies:[jt],source:jR,vs:HR};le();le();function np(){return[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]}function xr(r,e){let t=Ce.transformMat4([],e,r);return Ce.scale(t,t,1/t[3]),t}function Jo(r,e,t){return r<e?e:r>t?t:r}function YR(r){return Math.log(r)*Math.LOG2E}var es=Math.log2||YR;le();function it(r,e){if(!r)throw new Error(e||"@math.gl/web-mercator: assertion failed.")}var ot=Math.PI,F0=ot/4,Qe=ot/180,ip=180/ot,li=512,Xc=4003e4,Re=85.051129,U0=1.5;function op(r){return es(r)}function Ie(r){let[e,t]=r;it(Number.isFinite(e)),it(Number.isFinite(t)&&t>=-90&&t<=90,"invalid latitude");let n=e*Qe,i=t*Qe,o=li*(n+ot)/(2*ot),s=li*(ot+Math.log(Math.tan(F0+i*.5)))/(2*ot);return[o,s]}function ze(r){let[e,t]=r,n=e/li*(2*ot)-ot,i=2*(Math.atan(Math.exp(t/li*(2*ot)-ot))-F0);return[n*ip,i*ip]}function sp(r){let{latitude:e}=r;it(Number.isFinite(e));let t=Math.cos(e*Qe);return op(Xc*t)-9}function dn(r){let e=Math.cos(r*Qe);return li/Xc/e}function ui(r){let{latitude:e,longitude:t,highPrecision:n=!1}=r;it(Number.isFinite(e)&&Number.isFinite(t));let i=li,o=Math.cos(e*Qe),s=i/360,a=s/o,c=i/Xc/o,l={unitsPerMeter:[c,c,c],metersPerUnit:[1/c,1/c,1/c],unitsPerDegree:[s,a,c],degreesPerUnit:[1/s,1/a,1/c]};if(n){let u=Qe*Math.tan(e*Qe)/o,f=s*u/2,d=i/Xc*u,h=d/a*c;l.unitsPerDegree2=[0,f,d],l.unitsPerMeter2=[h,0,h]}return l}function ts(r,e){let[t,n,i]=r,[o,s,a]=e,{unitsPerMeter:c,unitsPerMeter2:l}=ui({longitude:t,latitude:n,highPrecision:!0}),u=Ie(r);u[0]+=o*(c[0]+l[0]*s),u[1]+=s*(c[1]+l[1]*s);let f=ze(u),d=(i||0)+(a||0);return Number.isFinite(i)||Number.isFinite(a)?[f[0],f[1],d]:f}function Kc(r){let{height:e,pitch:t,bearing:n,altitude:i,scale:o,center:s}=r,a=np();ae.translate(a,a,[0,0,-i]),ae.rotateX(a,a,-t*Qe),ae.rotateZ(a,a,n*Qe);let c=o/e;return ae.scale(a,a,[c,c,c]),s&&ae.translate(a,a,W.negate([],s)),a}function ap(r){let{width:e,height:t,altitude:n,pitch:i=0,offset:o,center:s,scale:a,nearZMultiplier:c=1,farZMultiplier:l=1}=r,{fovy:u=Ht(U0)}=r;n!==void 0&&(u=Ht(n));let f=u*Qe,d=i*Qe,h=hn(u),p=h;s&&(p+=s[2]*a/Math.cos(d)/t);let m=f*(.5+(o?o[1]:0)/t),g=Math.sin(m)*p/Math.sin(Jo(Math.PI/2-d-m,.01,Math.PI-.01)),b=Math.sin(d)*g+p,y=p*10,x=Math.min(b*l,y);return{fov:f,aspect:e/t,focalDistance:h,near:c,far:x}}function Ht(r){return 2*Math.atan(.5/r)*ip}function hn(r){return .5/Math.tan(.5*r*Qe)}function vr(r,e){let[t,n,i=0]=r;return it(Number.isFinite(t)&&Number.isFinite(n)&&Number.isFinite(i)),xr(e,[t,n,i,1])}function wr(r,e,t=0){let[n,i,o]=r;if(it(Number.isFinite(n)&&Number.isFinite(i),"invalid pixel coordinate"),Number.isFinite(o))return xr(e,[n,i,o,1]);let s=xr(e,[n,i,0,1]),a=xr(e,[n,i,1,1]),c=s[2],l=a[2],u=c===l?0:((t||0)-c)/(l-c);return rt.lerp([],s,a,u)}function Qc(r){let{width:e,height:t,bounds:n,minExtent:i=0,maxZoom:o=24,offset:s=[0,0]}=r,[[a,c],[l,u]]=n,f=qR(r.padding),d=Ie([a,Jo(u,-Re,Re)]),h=Ie([l,Jo(c,-Re,Re)]),p=[Math.max(Math.abs(h[0]-d[0]),i),Math.max(Math.abs(h[1]-d[1]),i)],m=[e-f.left-f.right-Math.abs(s[0])*2,t-f.top-f.bottom-Math.abs(s[1])*2];it(m[0]>0&&m[1]>0);let g=m[0]/p[0],b=m[1]/p[1],y=(f.right-f.left)/2/g,x=(f.top-f.bottom)/2/b,v=[(h[0]+d[0])/2+y,(h[1]+d[1])/2+x],w=ze(v),E=Math.min(o,es(Math.abs(Math.min(g,b))));return it(Number.isFinite(E)),{longitude:w[0],latitude:w[1],zoom:E}}function qR(r=0){return typeof r=="number"?{top:r,bottom:r,left:r,right:r}:(it(Number.isFinite(r.top)&&Number.isFinite(r.bottom)&&Number.isFinite(r.left)&&Number.isFinite(r.right)),r)}le();var G0=Math.PI/180;function Jc(r,e=0){let{width:t,height:n,unproject:i}=r,o={targetZ:e},s=i([0,n],o),a=i([t,n],o),c,l,u=r.fovy?.5*r.fovy*G0:Math.atan(.5/r.altitude),f=(90-r.pitch)*G0;return u>f-.01?(c=z0(r,0,e),l=z0(r,t,e)):(c=i([0,0],o),l=i([t,0],o)),[s,a,l,c]}function z0(r,e,t){let{pixelUnprojectionMatrix:n}=r,i=xr(n,[e,0,1,1]),o=xr(n,[e,r.height,1,1]),a=(t*r.distanceScales.unitsPerMeter[2]-i[2])/(o[2]-i[2]),c=rt.lerp([],i,o,a),l=ze(c);return l.push(t),l}var V0=`
layout(std140) uniform shadowUniforms {
  bool drawShadowMap;
  bool useShadowMap;
  vec4 color;
  highp int lightId;
  float lightCount;
  mat4 viewProjectionMatrix0;
  mat4 viewProjectionMatrix1;
  vec4 projectCenter0;
  vec4 projectCenter1;
} shadow;
`,KR=`
const int max_lights = 2;

out vec3 shadow_vPosition[max_lights];

vec4 shadow_setVertexPosition(vec4 position_commonspace) {
  mat4 viewProjectionMatrices[max_lights];
  viewProjectionMatrices[0] = shadow.viewProjectionMatrix0;
  viewProjectionMatrices[1] = shadow.viewProjectionMatrix1;
  vec4 projectCenters[max_lights];
  projectCenters[0] = shadow.projectCenter0;
  projectCenters[1] = shadow.projectCenter1;

  if (shadow.drawShadowMap) {
    return project_common_position_to_clipspace(position_commonspace, viewProjectionMatrices[shadow.lightId], projectCenters[shadow.lightId]);
  }
  if (shadow.useShadowMap) {
    for (int i = 0; i < max_lights; i++) {
      if(i < int(shadow.lightCount)) {
        vec4 shadowMap_position = project_common_position_to_clipspace(position_commonspace, viewProjectionMatrices[i], projectCenters[i]);
        shadow_vPosition[i] = (shadowMap_position.xyz / shadowMap_position.w + 1.0) / 2.0;
      }
    }
  }
  return gl_Position;
}
`,QR=`
${V0}
${KR}
`,JR=`
const int max_lights = 2;
uniform sampler2D shadow_uShadowMap0;
uniform sampler2D shadow_uShadowMap1;

in vec3 shadow_vPosition[max_lights];

const vec4 bitPackShift = vec4(1.0, 255.0, 65025.0, 16581375.0);
const vec4 bitUnpackShift = 1.0 / bitPackShift;
const vec4 bitMask = vec4(1.0 / 255.0, 1.0 / 255.0, 1.0 / 255.0,  0.0);

float shadow_getShadowWeight(vec3 position, sampler2D shadowMap) {
  vec4 rgbaDepth = texture(shadowMap, position.xy);

  float z = dot(rgbaDepth, bitUnpackShift);
  return smoothstep(0.001, 0.01, position.z - z);
}

vec4 shadow_filterShadowColor(vec4 color) {
  if (shadow.drawShadowMap) {
    vec4 rgbaDepth = fract(gl_FragCoord.z * bitPackShift);
    rgbaDepth -= rgbaDepth.gbaa * bitMask;
    return rgbaDepth;
  }
  if (shadow.useShadowMap) {
    float shadowAlpha = 0.0;
    shadowAlpha += shadow_getShadowWeight(shadow_vPosition[0], shadow_uShadowMap0);
    if(shadow.lightCount > 1.0) {
      shadowAlpha += shadow_getShadowWeight(shadow_vPosition[1], shadow_uShadowMap1);
    }
    shadowAlpha *= shadow.color.a / shadow.lightCount;
    float blendedAlpha = shadowAlpha + color.a * (1.0 - shadowAlpha);

    return vec4(
      mix(color.rgb, shadow.color.rgb, shadowAlpha / blendedAlpha),
      blendedAlpha
    );
  }
  return color;
}
`,eI=`
${V0}
${JR}
`,tI=Tt(sI),rI=Tt(aI),nI=[0,0,0,1],iI=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0];function oI(r,e){let[t,n,i]=r,o=wr([t,n,i],e);return Number.isFinite(i)?o:[o[0],o[1],0]}function sI({viewport:r,center:e}){return new ce(r.viewProjectionMatrix).invert().transform(e)}function aI({viewport:r,shadowMatrices:e}){let t=[],n=r.pixelUnprojectionMatrix,i=r.isGeospatial?void 0:1,o=[[0,0,i],[r.width,0,i],[0,r.height,i],[r.width,r.height,i],[0,0,-1],[r.width,0,-1],[0,r.height,-1],[r.width,r.height,-1]].map(s=>oI(s,n));for(let s of e){let a=s.clone().translate(new pe(r.center).negate()),c=o.map(u=>a.transform(u)),l=new ce().ortho({left:Math.min(...c.map(u=>u[0])),right:Math.max(...c.map(u=>u[0])),bottom:Math.min(...c.map(u=>u[1])),top:Math.max(...c.map(u=>u[1])),near:Math.min(...c.map(u=>-u[2])),far:Math.max(...c.map(u=>-u[2]))});t.push(l.multiplyRight(s))}return t}function cI(r){let{shadowEnabled:e=!0,project:t}=r;if(!e||!t||!r.shadowMatrices||!r.shadowMatrices.length)return{drawShadowMap:!1,useShadowMap:!1,shadow_uShadowMap0:r.dummyShadowMap,shadow_uShadowMap1:r.dummyShadowMap};let n=jt.getUniforms(t),i=tI({viewport:t.viewport,center:n.center}),o=[],s=rI({shadowMatrices:r.shadowMatrices,viewport:t.viewport}).slice();for(let c=0;c<r.shadowMatrices.length;c++){let l=s[c],u=l.clone().translate(new pe(t.viewport.center).negate());n.coordinateSystem===fn("lnglat")&&n.projectionMode===oe.WEB_MERCATOR?(s[c]=u,o[c]=i):(s[c]=l.clone().multiplyRight(iI),o[c]=u.transform(i))}let a={drawShadowMap:!!r.drawToShadowMap,useShadowMap:r.shadowMaps?r.shadowMaps.length>0:!1,color:r.shadowColor||nI,lightId:r.shadowLightId||0,lightCount:r.shadowMatrices.length,shadow_uShadowMap0:r.dummyShadowMap,shadow_uShadowMap1:r.dummyShadowMap};for(let c=0;c<s.length;c++)a[`viewProjectionMatrix${c}`]=s[c],a[`projectCenter${c}`]=o[c];for(let c=0;c<2;c++)a[`shadow_uShadowMap${c}`]=r.shadowMaps&&r.shadowMaps[c]||r.dummyShadowMap;return a}var el={name:"shadow",dependencies:[jt],vs:QR,fs:eI,inject:{"vs:DECKGL_FILTER_GL_POSITION":`
    position = shadow_setVertexPosition(geometry.position);
    `,"fs:DECKGL_FILTER_COLOR":`
    color = shadow_filterShadowColor(color);
    `},getUniforms:cI,uniformTypes:{drawShadowMap:"f32",useShadowMap:"f32",color:"vec4<f32>",lightId:"i32",lightCount:"f32",viewProjectionMatrix0:"mat4x4<f32>",viewProjectionMatrix1:"mat4x4<f32>",projectCenter0:"vec4<f32>",projectCenter1:"vec4<f32>"}};Me();var tl=10,rs=16777215;function j0(r,e){r.length===tl?F.warn(`pickMultipleObjects can only exclude ${tl} previously picked objects for layers without picking buffers`)():r.push(e)}var lI=`  float disabledPickingIndexCount;
  vec4 disabledPickingIndices0;
  vec4 disabledPickingIndices1;
  vec4 disabledPickingIndices2;
`;function W0(r){return r.replace(`  vec4 highlightColor;
} picking;`,`  vec4 highlightColor;
${lI}} picking;`)}function cp(r,e){return[r[e]||0,r[e+1]||0,r[e+2]||0,r[e+3]||0]}var uI=`vec3 picking_getPickingColorFromIndex(float objectIndex) {
  if (objectIndex < 0.0 || objectIndex >= ${rs}.0) {
    return vec3(0.0);
  }

  for (int i = 0; i < ${tl}; i++) {
    if (float(i) >= picking.disabledPickingIndexCount) {
      break;
    }
    vec4 disabledIndices = i < 4
      ? picking.disabledPickingIndices0
      : (i < 8 ? picking.disabledPickingIndices1 : picking.disabledPickingIndices2);
    float disabledIndex = disabledIndices[i - (i / 4) * 4];
    if (disabledIndex == objectIndex) {
      return vec3(0.0);
    }
  }

  float encodedIndex = objectIndex + 1.0;
  return vec3(
    mod(encodedIndex, 256.0),
    mod(floor(encodedIndex / 256.0), 256.0),
    mod(floor(encodedIndex / 65536.0), 256.0)
  );
}

vec3 picking_getPickingColorFromIndex(uint objectIndex) {
  return picking_getPickingColorFromIndex(float(objectIndex));
}

vec3 picking_getPickingColorFromInstanceID() {
  return picking_getPickingColorFromIndex(float(gl_InstanceID));
}

void picking_setPickingColorFromInstanceID() {
  picking_setPickingColor(picking_getPickingColorFromInstanceID());
}
`,fI=`struct pickingUniforms {
  isActive: f32,
  isAttribute: f32,
  isHighlightActive: f32,
  useByteColors: f32,
  highlightedObjectColor: vec3<f32>,
  highlightColor: vec4<f32>,
  disabledPickingIndexCount: f32,
  disabledPickingIndices0: vec4<f32>,
  disabledPickingIndices1: vec4<f32>,
  disabledPickingIndices2: vec4<f32>,
};

@group(0) @binding(auto) var<uniform> picking: pickingUniforms;

fn picking_normalizeColor(color: vec3<f32>) -> vec3<f32> {
  return select(color, color / 255.0, picking.useByteColors > 0.5);
}

fn picking_normalizeColor4(color: vec4<f32>) -> vec4<f32> {
  return select(color, color / 255.0, picking.useByteColors > 0.5);
}

fn picking_isColorZero(color: vec3<f32>) -> bool {
  return dot(color, vec3<f32>(1.0)) < 0.00001;
}

fn picking_isColorValid(color: vec3<f32>) -> bool {
  return dot(color, vec3<f32>(1.0)) > 0.00001;
}

fn picking_getPickingColorFromIndex(objectIndex: u32) -> vec3<f32> {
  if (objectIndex >= ${rs}u) {
    return vec3<f32>(0.0);
  }

  for (var i = 0; i < ${tl}; i = i + 1) {
    if (f32(i) >= picking.disabledPickingIndexCount) {
      break;
    }
    let disabledIndices = select(
      picking.disabledPickingIndices2,
      select(picking.disabledPickingIndices1, picking.disabledPickingIndices0, i < 4),
      i < 8
    );
    let disabledIndex = disabledIndices[i % 4];
    if (disabledIndex == f32(objectIndex)) {
      return vec3<f32>(0.0);
    }
  }

  let encodedIndex = objectIndex + 1u;
  return vec3<f32>(
    f32(encodedIndex % 256u),
    f32((encodedIndex / 256u) % 256u),
    f32((encodedIndex / 65536u) % 256u)
  ) / 255.0;
}
`,Er={...gr,vs:`${W0(gr.vs)}
${uI}`,fs:W0(gr.fs),source:fI,uniformTypes:{...gr.uniformTypes,disabledPickingIndexCount:"f32",disabledPickingIndices0:"vec4<f32>",disabledPickingIndices1:"vec4<f32>",disabledPickingIndices2:"vec4<f32>"},defaultUniforms:{...gr.defaultUniforms,useByteColors:!0,disabledPickingIndexCount:0,disabledPickingIndices0:[0,0,0,0],disabledPickingIndices1:[0,0,0,0],disabledPickingIndices2:[0,0,0,0]},getUniforms(r,e){let t=gr.getUniforms(r,e),n=r.disabledPickingIndices||[];return t.disabledPickingIndexCount=n.length,t.disabledPickingIndices0=cp(n,0),t.disabledPickingIndices1=cp(n,4),t.disabledPickingIndices2=cp(n,8),t},inject:{"vs:DECKGL_FILTER_GL_POSITION":`
    // for picking depth values
    picking_setPickingAttribute(position.z / position.w);
  `,"vs:DECKGL_FILTER_COLOR":`
  picking_setPickingColor(geometry.pickingColor);
  `,"fs:DECKGL_FILTER_COLOR":{order:99,injection:`
  // use highlight color if this fragment belongs to the selected object.
  color = picking_filterHighlightColor(color);

  // use picking color if rendering to picking FBO.
  color = picking_filterPickingColor(color);
    `}}};var dI=[Uc],hI=["vs:DECKGL_FILTER_SIZE(inout vec3 size, VertexGeometry geometry)","vs:DECKGL_FILTER_GL_POSITION(inout vec4 position, VertexGeometry geometry)","vs:DECKGL_FILTER_COLOR(inout vec4 color, VertexGeometry geometry)","fs:DECKGL_FILTER_COLOR(inout vec4 color, FragmentGeometry geometry)"],pI=[];function H0(r){let e=Xe.getDefaultShaderAssembler(r);for(let n of dI)e.addDefaultModule(n);e._hookFunctions.length=0;let t=r==="glsl"?hI:pI;for(let n of t)e.addShaderHook(n);return e}var mI=[255,255,255],gI=1,_I=0,rl=class{constructor(e={}){this.type="ambient";let{color:t=mI}=e,{intensity:n=gI}=e;this.id=e.id||`ambient-${_I++}`,this.color=t,this.intensity=n}};le();var yI=[255,255,255],bI=1,xI=[0,0,-1],vI=0,ns=class{constructor(e={}){this.type="directional";let{color:t=yI}=e,{intensity:n=bI}=e,{direction:i=xI}=e,{_shadow:o=!1}=e;this.id=e.id||`directional-${vI++}`,this.color=t,this.intensity=n,this.type="directional",this.direction=new pe(i).normalize().toArray(),this.shadow=o}getProjectedLight(e){return this}};le();var is=class{constructor(e,t={id:"pass"}){let{id:n}=t;this.id=n,this.device=e,this.props={...t}}setProps(e){Object.assign(this.props,e)}render(e){}cleanup(){}};var wI={depthWriteEnabled:!0,depthCompare:"less-equal",blendColorOperation:"add",blendColorSrcFactor:"one",blendColorDstFactor:"one-minus-src-alpha",blendAlphaOperation:"add",blendAlphaSrcFactor:"one",blendAlphaDstFactor:"one-minus-src-alpha"},Yt=class extends is{constructor(){super(...arguments),this._lastRenderIndex=-1}render(e){this._render(e)}_render(e){let{canvasContext:t=this.device.canvasContext}=e,n=e.target??t.getCurrentFramebuffer(),[i,o]=t.getDrawingBufferSize(),s=e.clearCanvas??!0,a=e.clearColor??(s?[0,0,0,0]:!1),c=s?1:!1,l=s?0:!1,u=e.colorMask??15,f={viewport:[0,0,i,o]};e.colorMask&&(f.colorMask=u),e.scissorRect&&(f.scissorRect=e.scissorRect);let{shaderModuleProps:d,viewports:h,views:p,onViewportActive:m,clearStack:g=!0}=e,b=e.pass||"unknown",y=this.device.type==="webgpu";g&&(this._lastRenderIndex=-1);let x=[];if(!h.length)return this.device.beginRenderPass({framebuffer:n,parameters:f,clearColor:a,clearDepth:c,clearStencil:l}).end(),this.device.submit(),x;try{for(let v of h){m?.(v);let w=this._getDrawLayerParams(v,e),E=p&&p[v.id],T=v.subViewports||[v],L=y?T.map(C=>[C]):[T];for(let C of L){let S=this.device.beginRenderPass({framebuffer:n,parameters:f,clearColor:a,clearDepth:c,clearStencil:l});try{for(let k of C){let R=this._drawLayersInViewport(S,{target:n,canvasContext:t,shaderModuleProps:d,viewport:k,view:E,pass:b,layers:e.layers,isPicking:e.isPicking},w);x.push(R)}}finally{S.end(),y&&this.device.submit()}a=!1,c=!1,l=!1}}return x}finally{y||this.device.submit()}}_getDrawLayerParams(e,{layers:t,pass:n,isPicking:i=!1,layerFilter:o,cullRect:s,views:a,effects:c,canvasContext:l=this.device.canvasContext,shaderModuleProps:u},f=!1){let d=[],h=q0(this._lastRenderIndex+1),p={layer:t[0],viewport:e,isPicking:i,renderPass:n,cullRect:s},m={};for(let g=0;g<t.length;g++){let b=t[g],y=this._shouldDrawLayer(b,p,o,m),x={shouldDrawLayer:y};if(y&&!f){x.shouldDrawLayer=!0,x.layerRenderIndex=h(b,y),x.shaderModuleProps=this._getShaderModuleProps(b,c,n,l,u);let v=b.context.device.type==="webgpu"?wI:null;x.layerParameters={...v,...b.context.deck?.props.parameters,...a?.[e.id]?.props.parameters,...this.getLayerParameters(b,g,e)}}d[g]=x}return d}_drawLayersInViewport(e,{layers:t,shaderModuleProps:n,pass:i,target:o,canvasContext:s,viewport:a,view:c,isPicking:l},u){let f=EI(this.device,{canvasContext:s,shaderModuleProps:n,target:o,viewport:a});if(c){let{clear:h,clearColor:p,clearDepth:m,clearStencil:g}=c.props;if(h){let b=[0,0,0,0],y=1,x=0;Array.isArray(p)&&!l?b=[...p.slice(0,3),p[3]||255].map(w=>w/255):p===!1&&(b=!1),m!==void 0&&(y=m),g!==void 0&&(x=g),this.device.beginRenderPass({framebuffer:o,parameters:{viewport:f,scissorRect:f},clearColor:b,clearDepth:y,clearStencil:x}).end()}}let d={totalCount:t.length,visibleCount:0,compositeCount:0,pickableCount:0};e.setParameters({viewport:f});for(let h=0;h<t.length;h++){let p=t[h],m=u[h],{shouldDrawLayer:g}=m;if(g&&p.props.pickable&&d.pickableCount++,p.isComposite&&d.compositeCount++,p.isDrawable&&m.shouldDrawLayer){let{layerRenderIndex:b,shaderModuleProps:y,layerParameters:x}=m;d.visibleCount++,this._lastRenderIndex=Math.max(this._lastRenderIndex,b),y.project&&(y.project.viewport=a),p.context.renderPass=e;try{p._drawLayer({renderPass:e,shaderModuleProps:y,uniforms:{layerIndex:b},parameters:x})}catch(v){p.raiseError(v,`drawing ${p} to ${i}`)}}}return d}shouldDrawLayer(e){return!0}getShaderModuleProps(e,t,n){return null}getLayerParameters(e,t,n){return e.props.parameters}_shouldDrawLayer(e,t,n,i){if(!(e.props.visible&&this.shouldDrawLayer(e)))return!1;t.layer=e;let s=e.parent;for(;s;){if(!s.props.visible||!s.filterSubLayer(t))return!1;t.layer=s,s=s.parent}if(n){let a=t.layer.id;if(a in i||(i[a]=n(t)),!i[a])return!1}return e.activateViewport(t.viewport),!0}_getShaderModuleProps(e,t,n,i,o){let s=i.cssToDeviceRatio(),a=e.internalState?.propsInTransition||e.props,c={layer:a,picking:{isActive:!1},project:{viewport:e.context.viewport,devicePixelRatio:s,modelMatrix:a.modelMatrix,coordinateSystem:a.coordinateSystem,coordinateOrigin:a.coordinateOrigin,autoWrapLongitude:e.wrapLongitude}};if(t)for(let l of t)Y0(c,l.getShaderModuleProps?.(e,c));for(let l of e.context.defaultShaderModules)l.name in c||(c[l.name]={});return Y0(c,this.getShaderModuleProps(e,t,c),o)}};function q0(r=0,e={}){let t={},n=(i,o)=>{let s=i.props._offset,a=i.id,c=i.parent&&i.parent.id,l;if(c&&!(c in e)&&n(i.parent,!1),c in t){let u=t[c]=t[c]||q0(e[c],e);l=u(i,o),t[a]=u}else Number.isFinite(s)?(l=s+(e[c]||0),t[a]=null):l=r;return o&&l>=r&&(r=l+1),e[a]=l,l};return n}function EI(r,{canvasContext:e=r.canvasContext,shaderModuleProps:t,target:n,viewport:i}){let o=t?.project?.devicePixelRatio??e.cssToDeviceRatio(),[,s]=e.getDrawingBufferSize(),a=n?n.height:s,c=i;return[c.x*o,a-(c.y+c.height)*o,c.width*o,c.height*o]}function Y0(r,...e){for(let t of e)if(t)for(let n in t)r[n]?Object.assign(r[n],t[n]):r[n]=t[n];return r}var os=class extends Yt{constructor(e,t){super(e,t);let n=e.createTexture({format:"rgba8unorm",width:1,height:1,sampler:{minFilter:"linear",magFilter:"linear",addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge"}}),i=e.createTexture({format:"depth16unorm",width:1,height:1});this.fbo=e.createFramebuffer({id:"shadowmap",width:1,height:1,colorAttachments:[n],depthStencilAttachment:i})}delete(){this.fbo&&(this.fbo.destroy(),this.fbo=null)}getShadowMap(){return this.fbo.colorAttachments[0].texture}render(e){let t=this.fbo,n=this.device.canvasContext.cssToDeviceRatio(),i=e.viewports[0],o=i.width*n,s=i.height*n,a=[1,1,1,1];(o!==t.width||s!==t.height)&&t.resize({width:o,height:s}),super.render({...e,clearColor:a,target:t,pass:"shadow"})}getLayerParameters(e,t,n){return{...e.props.parameters,blend:!1,depthWriteEnabled:!0,depthCompare:"less-equal"}}shouldDrawLayer(e){return e.props.shadowEnabled!==!1}getShaderModuleProps(e,t,n){return{shadow:{project:n.project,drawToShadowMap:!0}}}};var PI={color:[255,255,255],intensity:1},Z0=[{color:[255,255,255],intensity:1,direction:[-1,3,-1]},{color:[255,255,255],intensity:.9,direction:[1,-8,-2.5]}],SI=[0,0,0,200/255],fi=class{constructor(e={}){this.id="lighting-effect",this.shadowColor=SI,this.shadow=!1,this.directionalLights=[],this.pointLights=[],this.shadowPasses=[],this.dummyShadowMap=null,this.setProps(e)}setup(e){this.context=e;let{device:t,deck:n}=e;this.shadow&&!this.dummyShadowMap&&(this._createShadowPasses(t),n._addDefaultShaderModule(el),this.dummyShadowMap=t.createTexture({width:1,height:1}))}setProps(e){this.ambientLight=void 0,this.directionalLights=[],this.pointLights=[];for(let t in e){let n=e[t];switch(n.type){case"ambient":this.ambientLight=n;break;case"directional":this.directionalLights.push(n);break;case"point":this.pointLights.push(n);break;default:}}this._applyDefaultLights(),this.shadow=this.directionalLights.some(t=>t.shadow),this.context&&this.setup(this.context),this.props=e}preRender({layers:e,layerFilter:t,viewports:n,onViewportActive:i,views:o}){if(this.shadow){this.shadowMatrices=this._calculateMatrices();for(let s=0;s<this.shadowPasses.length;s++)this.shadowPasses[s].render({layers:e,layerFilter:t,viewports:n,onViewportActive:i,views:o,shaderModuleProps:{shadow:{shadowLightId:s,dummyShadowMap:this.dummyShadowMap,shadowMatrices:this.shadowMatrices}}})}}getShaderModuleProps(e,t){let n=this.shadow?{project:t.project,shadowMaps:this.shadowPasses.map(s=>s.getShadowMap()),dummyShadowMap:this.dummyShadowMap,shadowColor:this.shadowColor,shadowMatrices:this.shadowMatrices}:{},i={enabled:!0,lights:this._getLights(e)},o=e.props.material;return{shadow:n,lighting:i,phongMaterial:o,gouraudMaterial:o}}cleanup(e){for(let t of this.shadowPasses)t.delete();this.shadowPasses.length=0,this.dummyShadowMap&&(this.dummyShadowMap.destroy(),this.dummyShadowMap=null,e.deck._removeDefaultShaderModule(el))}_calculateMatrices(){let e=[];for(let t of this.directionalLights){let n=new ce().lookAt({eye:new pe(t.direction).negate()});e.push(n)}return e}_createShadowPasses(e){for(let t=0;t<this.directionalLights.length;t++){let n=new os(e);this.shadowPasses[t]=n}}_applyDefaultLights(){let{ambientLight:e,pointLights:t,directionalLights:n}=this;!e&&t.length===0&&n.length===0&&(this.ambientLight=new rl(PI),this.directionalLights.push(new ns(Z0[0]),new ns(Z0[1])))}_getLights(e){let t=[];this.ambientLight&&t.push(this.ambientLight);for(let n of this.pointLights)t.push(n.getProjectedLight({layer:e}));for(let n of this.directionalLights)t.push(n.getProjectedLight({layer:e}));return t}};var lp=class{constructor(e={}){this._pool=[],this.opts={overAlloc:2,poolSize:100},this.setOptions(e)}setOptions(e){Object.assign(this.opts,e)}allocate(e,t,{size:n=1,type:i,padding:o=0,copy:s=!1,initialize:a=!1,maxCount:c}){let l=i||e&&e.constructor||Float32Array,u=t*n+o;if(ArrayBuffer.isView(e)){if(u<=e.length)return e;if(u*e.BYTES_PER_ELEMENT<=e.buffer.byteLength)return new l(e.buffer,0,u)}let f=1/0;c&&(f=c*n+o);let d=this._allocate(l,u,a,f);return e&&s?d.set(e):a||d.fill(0,0,4),this._release(e),d}release(e){this._release(e)}_allocate(e,t,n,i){let o=Math.max(Math.ceil(t*this.opts.overAlloc),1);o>i&&(o=i);let s=this._pool,a=e.BYTES_PER_ELEMENT*o,c=s.findIndex(l=>l.byteLength>=a);if(c>=0){let l=new e(s.splice(c,1)[0],0,o);return n&&l.fill(0),l}return new e(o)}_release(e){if(!ArrayBuffer.isView(e))return;let t=this._pool,{buffer:n}=e,{byteLength:i}=n,o=t.findIndex(s=>s.byteLength>=i);o<0?t.push(n):(o>0||t.length<this.opts.poolSize)&&t.splice(o,0,n),t.length>this.opts.poolSize&&t.shift()}},st=new lp;le();function hi(){return[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]}function qt(r,e){let t=r%e;return t<0?e+t:t}function K0(r){return[r[12],r[13],r[14]]}function Q0(r){return{left:di(r[3]+r[0],r[7]+r[4],r[11]+r[8],r[15]+r[12]),right:di(r[3]-r[0],r[7]-r[4],r[11]-r[8],r[15]-r[12]),bottom:di(r[3]+r[1],r[7]+r[5],r[11]+r[9],r[15]+r[13]),top:di(r[3]-r[1],r[7]-r[5],r[11]-r[9],r[15]-r[13]),near:di(r[3]+r[2],r[7]+r[6],r[11]+r[10],r[15]+r[14]),far:di(r[3]-r[2],r[7]-r[6],r[11]-r[10],r[15]-r[14])}}var X0=new pe;function di(r,e,t,n){X0.set(r,e,t);let i=X0.len();return{distance:n/i,normal:new pe(-r/i,-e/i,-t/i)}}function TI(r){return r-Math.fround(r)}var ss;function pi(r,e){let{size:t=1,startIndex:n=0}=e,i=e.endIndex!==void 0?e.endIndex:r.length,o=(i-n)/t;ss=st.allocate(ss,o,{type:Float32Array,size:t*2});let s=n,a=0;for(;s<i;){for(let c=0;c<t;c++){let l=r[s++];ss[a+c]=l,ss[a+c+t]=TI(l)}a+=t*2}return ss.subarray(0,o*t*2)}function J0(r){let e=null,t=!1;for(let n of r)n&&(e?(t||(e=[[e[0][0],e[0][1]],[e[1][0],e[1][1]]],t=!0),e[0][0]=Math.min(e[0][0],n[0][0]),e[0][1]=Math.min(e[0][1],n[0][1]),e[1][0]=Math.max(e[1][0],n[1][0]),e[1][1]=Math.max(e[1][1],n[1][1])):e=n);return e}le();var LI=Math.PI/180,AI=hi(),ev=[0,0,0],CI={unitsPerMeter:[1,1,1],metersPerUnit:[1,1,1]};function MI({width:r,height:e,orthographic:t,fovyRadians:n,focalDistance:i,padding:o,near:s,far:a}){let c=r/e,l=t?new ce().orthographic({fovy:n,aspect:c,focalDistance:i,near:s,far:a}):new ce().perspective({fovy:n,aspect:c,near:s,far:a});if(o){let{left:u=0,right:f=0,top:d=0,bottom:h=0}=o,p=V((u+r-f)/2,0,r)-r/2,m=V((d+e-h)/2,0,e)-e/2;l[8]-=p*2/r,l[9]+=m*2/e}return l}var nl=class r{constructor(e={}){this._frustumPlanes={},this.id=e.id||this.constructor.displayName||"viewport",this.x=e.x||0,this.y=e.y||0,this.width=e.width||1,this.height=e.height||1,this.zoom=e.zoom||0,this.padding=e.padding,this.distanceScales=e.distanceScales||CI,this.focalDistance=e.focalDistance||1,this.position=e.position||ev,this.modelMatrix=e.modelMatrix||null;let{longitude:t,latitude:n}=e;this.isGeospatial=Number.isFinite(n)&&Number.isFinite(t),this._initProps(e),this._initMatrices(e),this.equals=this.equals.bind(this),this.project=this.project.bind(this),this.unproject=this.unproject.bind(this),this.projectPosition=this.projectPosition.bind(this),this.unprojectPosition=this.unprojectPosition.bind(this),this.projectFlat=this.projectFlat.bind(this),this.unprojectFlat=this.unprojectFlat.bind(this)}get subViewports(){return null}get metersPerPixel(){return this.distanceScales.metersPerUnit[2]/this.scale}get projectionMode(){return this.isGeospatial?this.zoom<12?oe.WEB_MERCATOR:oe.WEB_MERCATOR_AUTO_OFFSET:oe.IDENTITY}equals(e){return e instanceof r?this===e?!0:e.width===this.width&&e.height===this.height&&e.scale===this.scale&&e.projectionMode===this.projectionMode&&e.resolution===this.resolution&&Et(e.distanceScales.unitsPerMeter,this.distanceScales.unitsPerMeter)&&Et(e.projectionMatrix,this.projectionMatrix)&&Et(e.viewMatrix,this.viewMatrix):!1}project(e,{topLeft:t=!0}={}){let n=this.projectPosition(e),i=vr(n,this.pixelProjectionMatrix),[o,s]=i,a=t?s:this.height-s;return e.length===2?[o,a]:[o,a,i[2]]}unproject(e,{topLeft:t=!0,targetZ:n}={}){let[i,o,s]=e,a=t?o:this.height-o,c=n&&n*this.distanceScales.unitsPerMeter[2],l=wr([i,a,s],this.pixelUnprojectionMatrix,c),[u,f,d]=this.unprojectPosition(l);return Number.isFinite(s)?[u,f,d]:Number.isFinite(n)?[u,f,n]:[u,f]}projectPosition(e){let[t,n]=this.projectFlat(e),i=(e[2]||0)*this.distanceScales.unitsPerMeter[2];return[t,n,i]}unprojectPosition(e){let[t,n]=this.unprojectFlat(e),i=(e[2]||0)*this.distanceScales.metersPerUnit[2];return[t,n,i]}projectFlat(e){if(this.isGeospatial){let t=Ie(e);return t[1]=V(t[1],-318,830),t}return e}unprojectFlat(e){return this.isGeospatial?ze(e):e}getBounds(e={}){let t={targetZ:e.z||0},n=this.unproject([0,0],t),i=this.unproject([this.width,0],t),o=this.unproject([0,this.height],t),s=this.unproject([this.width,this.height],t);return[Math.min(n[0],i[0],o[0],s[0]),Math.min(n[1],i[1],o[1],s[1]),Math.max(n[0],i[0],o[0],s[0]),Math.max(n[1],i[1],o[1],s[1])]}getDistanceScales(e){return e&&this.isGeospatial?ui({longitude:e[0],latitude:e[1],highPrecision:!0}):this.distanceScales}containsPixel({x:e,y:t,width:n=1,height:i=1}){return e<this.x+this.width&&this.x<e+n&&t<this.y+this.height&&this.y<t+i}getFrustumPlanes(){return this._frustumPlanes.near?this._frustumPlanes:(Object.assign(this._frustumPlanes,Q0(this.viewProjectionMatrix)),this._frustumPlanes)}panByPosition(e,t,n){return null}_initProps(e){let t=e.longitude,n=e.latitude;this.isGeospatial&&(Number.isFinite(e.zoom)||(this.zoom=sp({latitude:n})+Math.log2(this.focalDistance)),this.distanceScales=e.distanceScales||ui({latitude:n,longitude:t}));let i=Math.pow(2,this.zoom);this.scale=i;let{position:o,modelMatrix:s}=e,a=ev;if(o&&(a=s?new ce(s).transformAsVector(o,[]):o),this.isGeospatial){let c=this.projectPosition([t,n,0]);this.center=new pe(a).scale(this.distanceScales.unitsPerMeter).add(c)}else this.center=this.projectPosition(a)}_initMatrices(e){let{viewMatrix:t=AI,projectionMatrix:n=null,orthographic:i=!1,fovyRadians:o,fovy:s=75,near:a=.1,far:c=1e3,padding:l=null,focalDistance:u=1}=e;this.viewMatrixUncentered=t,this.viewMatrix=new ce().multiplyRight(t).translate(new pe(this.center).negate()),this.projectionMatrix=n||MI({width:this.width,height:this.height,orthographic:i,fovyRadians:o||s*LI,focalDistance:u,padding:l,near:a,far:c});let f=hi();ae.multiply(f,f,this.projectionMatrix),ae.multiply(f,f,this.viewMatrix),this.viewProjectionMatrix=f,this.viewMatrixInverse=ae.invert([],this.viewMatrix)||this.viewMatrix,this.cameraPosition=K0(this.viewMatrixInverse);let d=hi(),h=hi();ae.scale(d,d,[this.width/2,-this.height/2,1]),ae.translate(d,d,[1,-1,0]),ae.multiply(h,d,this.viewProjectionMatrix),this.pixelProjectionMatrix=h,this.pixelUnprojectionMatrix=ae.invert(hi(),this.pixelProjectionMatrix),this.pixelUnprojectionMatrix||F.warn("Pixel project matrix not invertible")()}};nl.displayName="Viewport";var mi=nl;le();var il=class r extends mi{constructor(e={}){let{latitude:t=0,longitude:n=0,zoom:i=0,pitch:o=0,bearing:s=0,nearZMultiplier:a=.1,farZMultiplier:c=1.01,nearZ:l,farZ:u,orthographic:f=!1,projectionMatrix:d,repeat:h=!1,worldOffset:p=0,position:m,padding:g,legacyMeterSizes:b=!1}=e,{width:y,height:x,altitude:v=1.5}=e,w=Math.pow(2,i);y=y||1,x=x||1;let E,T=null;if(d)v=d[5]/2,E=Ht(v);else{e.fovy?(E=e.fovy,v=hn(E)):E=Ht(v);let C;if(g){let{top:S=0,bottom:k=0}=g;C=[0,V((S+x-k)/2,0,x)-x/2]}T=ap({width:y,height:x,scale:w,center:m&&[0,0,m[2]*dn(t)],offset:C,pitch:o,fovy:E,nearZMultiplier:a,farZMultiplier:c}),Number.isFinite(l)&&(T.near=l),Number.isFinite(u)&&(T.far=u)}let L=Kc({height:x,pitch:o,bearing:s,scale:w,altitude:v});p&&(L=new ce().translate([512*p,0,0]).multiplyLeft(L)),super({...e,width:y,height:x,viewMatrix:L,longitude:n,latitude:t,zoom:i,...T,fovy:E,focalDistance:v}),this.latitude=t,this.longitude=n,this.zoom=i,this.pitch=o,this.bearing=s,this.altitude=v,this.fovy=E,this.orthographic=f,this._subViewports=h?[]:null,this._pseudoMeters=b,Object.freeze(this)}get subViewports(){if(this._subViewports&&!this._subViewports.length){let e=this.getBounds(),t=Math.floor((e[0]+180)/360),n=Math.ceil((e[2]-180)/360);for(let i=t;i<=n;i++){let o=i?new r({...this,worldOffset:i}):this;this._subViewports.push(o)}}return this._subViewports}equals(e){return e instanceof r&&e._pseudoMeters===this._pseudoMeters&&super.equals(e)}projectPosition(e){if(this._pseudoMeters)return super.projectPosition(e);let[t,n]=this.projectFlat(e),i=(e[2]||0)*dn(e[1]);return[t,n,i]}unprojectPosition(e){if(this._pseudoMeters)return super.unprojectPosition(e);let[t,n]=this.unprojectFlat(e),i=(e[2]||0)/dn(n);return[t,n,i]}addMetersToLngLat(e,t){return ts(e,t)}panByPosition(e,t,n){let i=wr(t,this.pixelUnprojectionMatrix),o=this.projectFlat(e),s=rt.add([],o,rt.negate([],i)),a=rt.add([],this.center,s),[c,l]=this.unprojectFlat(a);return{longitude:c,latitude:l}}panByPosition3D(e,t){let n=e[2]||0,i=rt.sub([],e,this.unproject(t,{targetZ:n}));return{longitude:this.longitude+i[0],latitude:this.latitude+i[1]}}getBounds(e={}){let t=Jc(this,e.z||0);return[Math.min(t[0][0],t[1][0],t[2][0],t[3][0]),Math.min(t[0][1],t[1][1],t[2][1],t[3][1]),Math.max(t[0][0],t[1][0],t[2][0],t[3][0]),Math.max(t[0][1],t[1][1],t[2][1],t[3][1])]}fitBounds(e,t={}){let{width:n,height:i}=this,{longitude:o,latitude:s,zoom:a}=Qc({width:n,height:i,bounds:e,...t});return new r({width:n,height:i,longitude:o,latitude:s,zoom:a})}};il.displayName="WebMercatorViewport";var Zt=il;le();var tv=[0,0,0];function up(r,e,t=!1){let n=e.projectPosition(r);if(t&&e instanceof Zt){let[i,o,s=0]=r,a=e.getDistanceScales([i,o]);n[2]=s*a.unitsPerMeter[2]}return n}function RI(r){let{viewport:e,modelMatrix:t,coordinateOrigin:n}=r,{coordinateSystem:i,fromCoordinateSystem:o,fromCoordinateOrigin:s}=r;return i==="default"&&(i=e.isGeospatial?"lnglat":"cartesian"),o===void 0?o=i:o==="default"&&(o=e.isGeospatial?"lnglat":"cartesian"),s===void 0&&(s=n),{viewport:e,coordinateSystem:i,coordinateOrigin:n,modelMatrix:t,fromCoordinateSystem:o,fromCoordinateOrigin:s}}function ol(r,{viewport:e,modelMatrix:t,coordinateSystem:n,coordinateOrigin:i,offsetMode:o}){let[s,a,c=0]=r;switch(t&&([s,a,c]=Ce.transformMat4([],[s,a,c,1],t)),n){case"default":return ol(r,{viewport:e,modelMatrix:t,coordinateSystem:e.isGeospatial?"lnglat":"cartesian",coordinateOrigin:i,offsetMode:o});case"lnglat":return up([s,a,c],e,o);case"lnglat-offsets":return up([s+i[0],a+i[1],c+(i[2]||0)],e,o);case"meter-offsets":return up(ts(i,[s,a,c]),e,o);case"cartesian":return e.isGeospatial?[s+i[0],a+i[1],c+i[2]]:e.projectPosition([s,a,c]);default:throw new Error(`Invalid coordinateSystem: ${n}`)}}function rv(r,e){let{viewport:t,coordinateSystem:n,coordinateOrigin:i,modelMatrix:o,fromCoordinateSystem:s,fromCoordinateOrigin:a}=RI(e),{autoOffset:c=!0}=e,{geospatialOrigin:l=tv,shaderCoordinateOrigin:u=tv,offsetMode:f=!1}=c?rp(t,n,i):{},d=ol(r,{viewport:t,modelMatrix:o,coordinateSystem:s,coordinateOrigin:a,offsetMode:f});if(f){let h=t.projectPosition(l||u);W.sub(d,d,h)}return d}var hO={blendColorOperation:"add",blendColorSrcFactor:"one",blendColorDstFactor:"zero",blendAlphaOperation:"add",blendAlphaSrcFactor:"constant",blendAlphaDstFactor:"zero"},_n=class extends Yt{constructor(){super(...arguments),this._colorEncoderState=null}render(e){return"pickingFBO"in e?this._drawPickingBuffer(e):{decodePickingColor:null,stats:super._render(e)}}_drawPickingBuffer({layers:e,layerFilter:t,views:n,viewports:i,onViewportActive:o,pickingFBO:s,deviceRect:{x:a,y:c,width:l,height:u},cullRect:f,effects:d,pass:h="picking",pickZ:p,canvasContext:m,shaderModuleProps:g,clearColor:b}){this.pickZ=p;let y=this._resetColorEncoder(p),x=[a,c,l,u],v=super._render({target:s,layers:e,layerFilter:t,views:n,viewports:i,onViewportActive:o,cullRect:f,effects:d?.filter(E=>E.useInPicking),pass:h,canvasContext:m,isPicking:!0,shaderModuleProps:g,clearColor:b??[0,0,0,0],colorMask:15,scissorRect:x});return this._colorEncoderState=null,{decodePickingColor:y&&pO.bind(null,y),stats:v}}shouldDrawLayer(e){let{pickable:t,operation:n}=e.props;return t&&n.includes("draw")||n.includes("terrain")||n.includes("mask")}getShaderModuleProps(e,t,n){return{picking:{isActive:1,isAttribute:this.pickZ,disabledPickingIndices:e.internalState?.disabledPickingIndices},lighting:{enabled:!1}}}getLayerParameters(e,t,n){let i={...e.props.parameters},{pickable:o,operation:s}=e.props;return this._colorEncoderState?o&&s.includes("draw")?(Object.assign(i,hO),i.blend=!0,this.device.type==="webgpu"?i.blendConstant=Ov(this._colorEncoderState,e,n):i.blendColor=Ov(this._colorEncoderState,e,n),s.includes("terrain")&&e.state?._hasPickingCover&&(i.blendAlphaSrcFactor="one")):s.includes("terrain")&&(i.blend=!1):i.blend=!1,i}_resetColorEncoder(e){return this._colorEncoderState=e?null:{byLayer:new Map,byAlpha:[]},this._colorEncoderState}};function Ov(r,e,t){let{byLayer:n,byAlpha:i}=r,o,s=n.get(e);return s?(s.viewports.push(t),o=s.a):(o=n.size+1,o<=255?(s={a:o,layer:e,viewports:[t]},n.set(e,s),i[o]=s):(F.warn("Too many pickable layers, only picking the first 255")(),o=0)),[0,0,0,o/255]}function pO(r,e){let t=r.byAlpha[e[3]];return t&&{pickedLayer:t.layer,pickedViewports:t.viewports,pickedObjectIndex:t.layer.decodePickingColor(e)}}K();var Pr={NO_STATE:"Awaiting state",MATCHED:"Matched. State transferred from previous layer",INITIALIZED:"Initialized",AWAITING_GC:"Discarded. Awaiting garbage collection",AWAITING_FINALIZATION:"No longer matched. Awaiting garbage collection",FINALIZED:"Finalized! Awaiting garbage collection"},vi=Symbol.for("component"),Ct=Symbol.for("propTypes"),ll=Symbol.for("deprecatedProps"),Xt=Symbol.for("asyncPropDefaults"),Mt=Symbol.for("asyncPropOriginal"),at=Symbol.for("asyncPropResolved");function Rt(r,e=()=>!0){return Array.isArray(r)?Bv(r,e,[]):e(r)?[r]:[]}function Bv(r,e,t){let n=-1;for(;++n<r.length;){let i=r[n];Array.isArray(i)?Bv(i,e,t):e(i)&&t.push(i)}return t}function Pp({target:r,source:e,start:t=0,count:n=1}){let i=e.length,o=n*i,s=0;for(let a=t;s<i;s++)r[a++]=e[s];for(;s<o;)s<o-s?(r.copyWithin(t+s,t,t+s),s*=2):(r.copyWithin(t+s,t,t+o-s),s=o);return r}eo();var fs=class{constructor(e,t,n){this._loadCount=0,this._subscribers=new Set,this.id=e,this.context=n,this.setData(t)}subscribe(e){this._subscribers.add(e)}unsubscribe(e){this._subscribers.delete(e)}inUse(){return this._subscribers.size>0}delete(){}getData(){return this.isLoaded?this._error?Promise.reject(this._error):this._content:this._loader.then(()=>this.getData())}setData(e,t){if(e===this._data&&!t)return;this._data=e;let n=++this._loadCount,i=e;typeof e=="string"&&(i=Fn(e)),i instanceof Promise?(this.isLoaded=!1,this._loader=i.then(o=>{this._loadCount===n&&(this.isLoaded=!0,this._error=void 0,this._content=o)}).catch(o=>{this._loadCount===n&&(this.isLoaded=!0,this._error=o||!0)})):(this.isLoaded=!0,this._error=void 0,this._content=e);for(let o of this._subscribers)o.onChange(this.getData())}};var ds=class{constructor(e){this.protocol=e.protocol||"resource://",this._context={device:e.device,gl:e.device?.gl,resourceManager:this},this._resources={},this._consumers={},this._pruneRequest=null}contains(e){return e.startsWith(this.protocol)?!0:e in this._resources}add({resourceId:e,data:t,forceUpdate:n=!1,persistent:i=!0}){let o=this._resources[e];o?o.setData(t,n):(o=new fs(e,t,this._context),this._resources[e]=o),o.persistent=i}remove(e){let t=this._resources[e];t&&(t.delete(),delete this._resources[e])}unsubscribe({consumerId:e}){let t=this._consumers[e];if(t){for(let n in t){let i=t[n],o=this._resources[i.resourceId];o&&o.unsubscribe(i)}delete this._consumers[e],this.prune()}}subscribe({resourceId:e,onChange:t,consumerId:n,requestId:i="default"}){let{_resources:o,protocol:s}=this;e.startsWith(s)&&(e=e.replace(s,""),o[e]||this.add({resourceId:e,data:null,persistent:!1}));let a=o[e];if(this._track(n,i,a,t),a)return a.getData()}prune(){this._pruneRequest||(this._pruneRequest=setTimeout(()=>this._prune(),0))}finalize(){for(let e in this._resources)this._resources[e].delete()}_track(e,t,n,i){let o=this._consumers,s=o[e]=o[e]||{},a=s[t],c=a&&a.resourceId&&this._resources[a.resourceId];c&&(c.unsubscribe(a),this.prune()),n&&(a?(a.onChange=i,a.resourceId=n.id):a={onChange:i,resourceId:n.id},s[t]=a,n.subscribe(a))}_prune(){this._pruneRequest=null;for(let e of Object.keys(this._resources)){let t=this._resources[e];!t.persistent&&!t.inUse()&&(t.delete(),delete this._resources[e])}}};var mO="layerManager.setLayers",gO="layerManager.activateViewport",hs=class{constructor(e,t){this._lastRenderedLayers=[],this._needsRedraw=!1,this._needsUpdate=!1,this._nextLayers=null,this._debug=!1,this._defaultShaderModulesChanged=!1,this.activateViewport=a=>{ie(gO,this,a),a&&(this.context.viewport=a)};let{deck:n,stats:i,viewport:o,timeline:s}=t||{};this.layers=[],this.resourceManager=new ds({device:e,protocol:"deck://"}),this.context={mousePosition:null,userData:{},layerManager:this,device:e,gl:e?.gl,deck:n,shaderAssembler:H0(e?.info?.shadingLanguage||"glsl"),defaultShaderModules:[Wh],renderPass:void 0,stats:i||new Ye({id:"deck.gl"}),viewport:o||new mi({id:"DEFAULT-INITIAL-VIEWPORT"}),timeline:s||new gn,resourceManager:this.resourceManager,onError:void 0},Object.seal(this)}finalize(){this.resourceManager.finalize();for(let e of this.layers)this._finalizeLayer(e)}needsRedraw(e={clearRedrawFlags:!1}){let t=this._needsRedraw;e.clearRedrawFlags&&(this._needsRedraw=!1);for(let n of this.layers){let i=n.getNeedsRedraw(e);t=t||i}return t}needsUpdate(){return this._nextLayers&&this._nextLayers!==this._lastRenderedLayers?"layers changed":this._defaultShaderModulesChanged?"shader modules changed":this._needsUpdate}setNeedsRedraw(e){this._needsRedraw=this._needsRedraw||e}setNeedsUpdate(e){this._needsUpdate=this._needsUpdate||e}getLayers({layerIds:e}={}){return e?this.layers.filter(t=>e.find(n=>t.id.indexOf(n)===0)):this.layers}setProps(e){"debug"in e&&(this._debug=e.debug),"userData"in e&&(this.context.userData=e.userData),"layers"in e&&(this._nextLayers=e.layers),"onError"in e&&(this.context.onError=e.onError)}setLayers(e,t){ie(mO,this,t,e),this._lastRenderedLayers=e;let n=Rt(e,Boolean);for(let i of n)i.context=this.context;this._updateLayers(this.layers,n)}updateLayers(){let e=this.needsUpdate();e&&(this.setNeedsRedraw(`updating layers: ${e}`),this.setLayers(this._nextLayers||this._lastRenderedLayers,e)),this._nextLayers=null}addDefaultShaderModule(e){let{defaultShaderModules:t}=this.context;t.find(n=>n.name===e.name)||(t.push(e),this._defaultShaderModulesChanged=!0)}removeDefaultShaderModule(e){let{defaultShaderModules:t}=this.context,n=t.findIndex(i=>i.name===e.name);n>=0&&(t.splice(n,1),this._defaultShaderModulesChanged=!0)}_handleError(e,t,n){n.raiseError(t,`${e} of ${n}`)}_updateLayers(e,t){let n={};for(let s of e)n[s.id]?F.warn(`Multiple old layers with same id ${s.id}`)():n[s.id]=s;if(this._defaultShaderModulesChanged){for(let s of e)s.setNeedsUpdate(),s.setChangeFlags({extensionsChanged:!0});this._defaultShaderModulesChanged=!1}let i=[];this._updateSublayersRecursively(t,n,i),this._finalizeOldLayers(n);let o=!1;for(let s of i)if(s.hasUniformTransition()){o=`Uniform transition in ${s}`;break}this._needsUpdate=o,this.layers=i}_updateSublayersRecursively(e,t,n){for(let i of e){i.context=this.context;let o=t[i.id];o===null&&F.warn(`Multiple new layers with same id ${i.id}`)(),t[i.id]=null;let s=null;try{this._debug&&o!==i&&i.validateProps(),o?(this._transferLayerState(o,i),this._updateLayer(i)):this._initializeLayer(i),n.push(i),s=i.isComposite?i.getSubLayers():null}catch(a){this._handleError("matching",a,i)}s&&this._updateSublayersRecursively(s,t,n)}}_finalizeOldLayers(e){for(let t in e){let n=e[t];n&&this._finalizeLayer(n)}}_initializeLayer(e){try{e._initialize(),e.lifecycle=Pr.INITIALIZED}catch(t){this._handleError("initialization",t,e)}}_transferLayerState(e,t){t._transferState(e),t.lifecycle=Pr.MATCHED,t!==e&&(e.lifecycle=Pr.AWAITING_GC)}_updateLayer(e){try{e._update()}catch(t){this._handleError("update",t,e)}}_finalizeLayer(e){this._needsRedraw=this._needsRedraw||`finalized ${e}`,e.lifecycle=Pr.AWAITING_FINALIZATION;try{e._finalize(),e.lifecycle=Pr.FINALIZED}catch(t){this._handleError("finalization",t,e)}}};function J(r,e,t){if(r===e)return!0;if(!t||!r||!e)return!1;if(Array.isArray(r)){if(!Array.isArray(e)||r.length!==e.length)return!1;for(let n=0;n<r.length;n++)if(!J(r[n],e[n],t-1))return!1;return!0}if(Array.isArray(e))return!1;if(typeof r=="object"&&typeof e=="object"){let n=Object.keys(r),i=Object.keys(e);if(n.length!==i.length)return!1;for(let o of n)if(!e.hasOwnProperty(o)||!J(r[o],e[o],t-1))return!1;return!0}return!1}var Sr="default-canvas",ps=class{constructor(e){this.views=[],this.width=100,this.height=100,this.viewState={},this.controllers={},this.timeline=e.timeline,this._viewports=[],this._viewportMap={},this._isUpdating=!1,this._needsRedraw="First render",this._needsUpdate="Initialize",this._eventManager=e.eventManager,this._eventManagers=e.eventManagers||{},this._viewEventManagers={},this._eventCallbacks={onViewStateChange:e.onViewStateChange,onInteractionStateChange:e.onInteractionStateChange},this._pickPosition=e.pickPosition,this._getCanvasContext=e.getCanvasContext,Object.seal(this),this.setProps(e)}finalize(){for(let e in this.controllers){let t=this.controllers[e];t&&t.finalize()}this.controllers={}}needsRedraw(e={clearRedrawFlags:!1}){let t=this._needsRedraw;return e.clearRedrawFlags&&(this._needsRedraw=!1),t}setNeedsUpdate(e){this._needsUpdate=this._needsUpdate||e,this._needsRedraw=this._needsRedraw||e}updateViewStates(){for(let e in this.controllers){let t=this.controllers[e];t&&t.updateTransition()}}getViewports(e){return e?this._viewports.filter(t=>{let n=!e.canvasId||this.getCanvasId(t.id)===e.canvasId,i=!("x"in e)||t.containsPixel(e);return n&&i}):this._viewports}getViews(){let e={};return this.views.forEach(t=>{e[t.id]=t}),e}getView(e){return this.views.find(t=>t.id===e)}getViewState(e){let t=typeof e=="string"?this.getView(e):e,n=t&&this.viewState[t.getViewStateId()]||this.viewState;return t?t.filterViewState(n):n}getViewport(e){return this._viewportMap[e]}getCanvasId(e){let t=typeof e=="string"?this.getView(e):e;return t?this._viewEventManagers[t.id]?.canvasId||this._getCanvasIdFromView(t):void 0}unproject(e,t){let n=this.getViewports(),i={x:e[0],y:e[1]};for(let o=n.length-1;o>=0;--o){let s=n[o];if(s.containsPixel(i)){let a=e.slice();return a[0]-=s.x,a[1]-=s.y,s.unproject(a,t)}}return null}setProps(e){e.views&&this._setViews(e.views),e.viewState&&this._setViewState(e.viewState),("width"in e||"height"in e)&&this._setSize(e.width,e.height),"pickPosition"in e&&(this._pickPosition=e.pickPosition),"eventManagers"in e&&this._setEventManagers(e.eventManagers||{}),this._isUpdating||this._update()}_update(){this._isUpdating=!0,this._needsUpdate&&(this._needsUpdate=!1,this._rebuildViewports()),this._needsUpdate&&(this._needsUpdate=!1,this._rebuildViewports()),this._isUpdating=!1}_setSize(e,t){(e!==this.width||t!==this.height)&&(this.width=e,this.height=t,this.setNeedsUpdate("Size changed"))}_setViews(e){e=Rt(e,Boolean),this._diffViews(e,this.views)&&this.setNeedsUpdate("views changed"),this.views=e}_setViewState(e){e?(!J(e,this.viewState,3)&&this.setNeedsUpdate("viewState changed"),this.viewState=e):F.warn("missing `viewState` or `initialViewState`")()}_setEventManagers(e){this._eventManagers!==e&&(this._eventManagers=e,this.setNeedsUpdate("eventManagers changed"))}_getCanvasIdFromView(e){return e.props.canvasId||this._getCanvasContext?.(e.id)?.id||Sr}_getCanvasDimensions(e){let t=this._getCanvasContext?.(e.id),[n,i]=t?.getCSSSize()||[this.width,this.height];return{width:n,height:i}}_getViewEventManager(e){let t=this.getCanvasId(e)||Sr;return{canvasId:t,eventManager:this._eventManagers[t]||this._eventManager}}_startViewportRebuild(){let e=this.controllers,t=this._viewEventManagers;return this._viewports=[],this.controllers={},this._viewEventManagers={},{oldControllers:e,oldViewEventManagers:t}}_getReusableController(e,t,n){return e&&(t?.canvasId!==n.canvasId||t?.eventManager!==n.eventManager)?(e.finalize(),null):e}_createController(e,t){let n=t.type;return new n({timeline:this.timeline,eventManager:this._getViewEventManager(e).eventManager,onViewStateChange:this._eventCallbacks.onViewStateChange,onStateChange:this._eventCallbacks.onInteractionStateChange,makeViewport:o=>this.getView(e.id)?.makeViewport({viewState:o,...this._getCanvasDimensions(e)}),pickPosition:(o,s)=>this._pickPosition?.(o,s,e.id)})}_updateController(e,t,n,i){let o=e.controller;if(o&&n){let s={...t,...o,id:e.id,x:n.x,y:n.y,width:n.width,height:n.height};return(!i||i.constructor!==o.type)&&(i=this._createController(e,s)),i&&i.setProps(s),i}return null}_rebuildViewports(){let{views:e}=this,{oldControllers:t,oldViewEventManagers:n}=this._startViewportRebuild(),i=!1;for(let o=e.length;o--;){let s=e[o],{width:a,height:c}=this._getCanvasDimensions(s),l=this._getViewEventManager(s);this._viewEventManagers[s.id]=l;let u=this.getViewState(s),f=s.makeViewport({viewState:u,width:a,height:c}),d=this._getReusableController(t[s.id],n[s.id],l),h=!!s.controller;h&&!d&&(i=!0),(i||!h)&&d&&(d.finalize(),d=null),this.controllers[s.id]=this._updateController(s,u,f,d),f&&this._viewports.unshift(f)}for(let o in t){let s=t[o];s&&!this.controllers[o]&&s.finalize()}this._buildViewportMap()}_buildViewportMap(){this._viewportMap={},this._viewports.forEach(e=>{e.id&&(this._viewportMap[e.id]=this._viewportMap[e.id]||e)})}_diffViews(e,t){return e.length!==t.length?!0:e.some((n,i)=>!e[i].equals(t[i]))}};var _O=/^(?:\d+\.?\d*|\.\d+)$/;function Be(r){switch(typeof r){case"number":if(!Number.isFinite(r))throw new Error(`Could not parse position string ${r}`);return{type:"literal",value:r};case"string":try{let e=yO(r);return new Tp(e).parseExpression()}catch(e){let t=e instanceof Error?e.message:String(e);throw new Error(`Could not parse position string ${r}: ${t}`)}default:throw new Error(`Could not parse position string ${r}`)}}function Sp(r,e){switch(r.type){case"literal":return r.value;case"percentage":return Math.round(r.value*e);case"binary":let t=Sp(r.left,e),n=Sp(r.right,e);return r.operator==="+"?t+n:t-n;default:throw new Error("Unknown layout expression type")}}function De(r,e){return Sp(r,e)}function yO(r){let e=[],t=0;for(;t<r.length;){let n=r[t];if(/\s/.test(n)){t++;continue}if(n==="+"||n==="-"||n==="("||n===")"||n==="%"){e.push({type:"symbol",value:n}),t++;continue}if(Dv(n)||n==="."){let i=t,o=n===".";for(t++;t<r.length;){let a=r[t];if(Dv(a)){t++;continue}if(a==="."&&!o){o=!0,t++;continue}break}let s=r.slice(i,t);if(!_O.test(s))throw new Error("Invalid number token");e.push({type:"number",value:parseFloat(s)});continue}if(kv(n)){let i=t;for(;t<r.length&&kv(r[t]);)t++;let o=r.slice(i,t).toLowerCase();e.push({type:"word",value:o});continue}throw new Error("Invalid token in position string")}return e}var Tp=class{constructor(e){this.index=0,this.tokens=e}parseExpression(){let e=this.parseBinaryExpression();if(this.index<this.tokens.length)throw new Error("Unexpected token at end of expression");return e}parseBinaryExpression(){let e=this.parseFactor(),t=this.peek();for(;bO(t);){this.index++;let n=this.parseFactor();e={type:"binary",operator:t.value,left:e,right:n},t=this.peek()}return e}parseFactor(){let e=this.peek();if(!e)throw new Error("Unexpected end of expression");if(e.type==="symbol"&&e.value==="+")return this.index++,this.parseFactor();if(e.type==="symbol"&&e.value==="-"){this.index++;let t=this.parseFactor();return{type:"binary",operator:"-",left:{type:"literal",value:0},right:t}}if(e.type==="symbol"&&e.value==="("){this.index++;let t=this.parseBinaryExpression();if(!this.consumeSymbol(")"))throw new Error("Missing closing parenthesis");return t}if(e.type==="word"&&e.value==="calc"){if(this.index++,!this.consumeSymbol("("))throw new Error("Missing opening parenthesis after calc");let t=this.parseBinaryExpression();if(!this.consumeSymbol(")"))throw new Error("Missing closing parenthesis");return t}if(e.type==="number"){this.index++;let t=e.value,n=this.peek();return n&&n.type==="symbol"&&n.value==="%"?(this.index++,{type:"percentage",value:t/100}):n&&n.type==="word"&&n.value==="px"?(this.index++,{type:"literal",value:t}):{type:"literal",value:t}}throw new Error("Unexpected token in expression")}consumeSymbol(e){let t=this.peek();return t&&t.type==="symbol"&&t.value===e?(this.index++,!0):!1}peek(){return this.tokens[this.index]||null}};function Dv(r){return r>="0"&&r<="9"}function kv(r){return r>="a"&&r<="z"||r>="A"&&r<="Z"}function bO(r){return!!(r&&r.type==="symbol"&&(r.value==="+"||r.value==="-"))}function Nv(r,e){let t={...r};for(let n in e)n!=="id"&&(Array.isArray(t[n])&&Array.isArray(e[n])?t[n]=xO(t[n],e[n]):t[n]=e[n]);return t}function xO(r,e){r=r.slice();for(let t=0;t<e.length;t++){let n=e[t];Number.isFinite(n)&&(r[t]=n)}return r}var yn=class{constructor(e){let{id:t,x:n=0,y:i=0,width:o="100%",height:s="100%",padding:a=null}=e;this.id=t||this.constructor.displayName||"view",this.props={...e,id:this.id},this._x=Be(n),this._y=Be(i),this._width=Be(o),this._height=Be(s),this._padding=a&&{left:Be(a.left||0),right:Be(a.right||0),top:Be(a.top||0),bottom:Be(a.bottom||0)},this.equals=this.equals.bind(this),Object.seal(this)}equals(e){return this===e?!0:this.constructor===e.constructor&&J(this.props,e.props,2)}clone(e){let t=this.constructor;return new t({...this.props,...e})}makeViewport({width:e,height:t,viewState:n}){n=this.filterViewState(n);let i=this.getDimensions({width:e,height:t});if(!i.height||!i.width)return null;let o=this.getViewportType(n);return new o({...n,...this.props,...i})}getViewStateId(){let{viewState:e}=this.props;return typeof e=="string"?e:e?.id||this.id}filterViewState(e){return this.props.viewState&&typeof this.props.viewState=="object"?this.props.viewState.id?Nv(e,this.props.viewState):this.props.viewState:e}getDimensions({width:e,height:t}){let n={x:De(this._x,e),y:De(this._y,t),width:De(this._width,e),height:De(this._height,t)};return this._padding&&(n.padding={left:De(this._padding.left,e),top:De(this._padding.top,t),right:De(this._padding.right,e),bottom:De(this._padding.bottom,t)}),n}get controller(){let e=this.props.controller;return e?e===!0?{type:this.ControllerType}:typeof e=="function"?{type:e}:{type:this.ControllerType,...e}:null}};le();var ct=class{constructor(e){this._inProgress=!1,this._handle=null,this.time=0,this.settings={duration:0},this._timeline=e}get inProgress(){return this._inProgress}start(e){this.cancel(),this.settings=e,this._inProgress=!0,this.settings.onStart?.(this)}end(){this._inProgress&&(this._timeline.removeChannel(this._handle),this._handle=null,this._inProgress=!1,this.settings.onEnd?.(this))}cancel(){this._inProgress&&(this.settings.onInterrupt?.(this),this._timeline.removeChannel(this._handle),this._handle=null,this._inProgress=!1)}update(){if(!this._inProgress)return!1;if(this._handle===null){let{_timeline:e,settings:t}=this;this._handle=e.addChannel({delay:e.getTime(),duration:t.duration})}return this.time=this._timeline.getTime(this._handle),this._onUpdate(),this.settings.onUpdate?.(this),this._timeline.isFinished(this._handle)&&this.end(),!0}_onUpdate(){}};var Fv=()=>{},Uv={mode:"preserve"},vO={mode:"hard"},Lp={BREAK:1,SNAP_TO_END:2,IGNORE:3},wO=r=>r,EO=Lp.BREAK,ms=class{constructor(e){this._onTransitionUpdate=t=>{let{time:n,settings:{interpolator:i,startProps:o,endProps:s,duration:a,easing:c}}=t,l=c(n/a),u=i.interpolateProps(o,s,l);this.propsInTransition=this.getControllerState({...this.props,...u},Uv).getViewportProps(),this.onViewStateChange({viewState:this.propsInTransition,oldViewState:this.props})},this.getControllerState=e.getControllerState,this.propsInTransition=null,this.transition=new ct(e.timeline),this.onViewStateChange=e.onViewStateChange||Fv,this.onStateChange=e.onStateChange||Fv}finalize(){this.transition.cancel()}getViewportInTransition(){return this.propsInTransition}processViewStateChange(e){let t=!1,n=this.props;if(this.props=e,!n||this._shouldIgnoreViewportChange(n,e))return!1;if(this._isTransitionEnabled(e)){let i=n;if(this.transition.inProgress){let{interruption:o,endProps:s}=this.transition.settings;i={...n,...o===Lp.SNAP_TO_END?s:this.propsInTransition||n}}this._triggerTransition(i,e),t=!0}else this.transition.cancel();return t}updateTransition(){this.transition.update()}_isTransitionEnabled(e){let{transitionDuration:t,transitionInterpolator:n}=e;return(t>0||t==="auto")&&!!n}_isUpdateDueToCurrentTransition(e){return this.transition.inProgress&&this.propsInTransition?this.transition.settings.interpolator.arePropsEqual(e,this.propsInTransition):!1}_shouldIgnoreViewportChange(e,t){return this.transition.inProgress?this.transition.settings.interruption===Lp.IGNORE||this._isUpdateDueToCurrentTransition(t):this._isTransitionEnabled(t)?t.transitionInterpolator.arePropsEqual(e,t):!0}_triggerTransition(e,t){let n=this.getControllerState(e,Uv),i=this.getControllerState(t,vO).shortestPathFrom(n),o=t.transitionInterpolator,s=o.getDuration?o.getDuration(e,t):t.transitionDuration;if(s===0)return;let a=o.initializeProps(e,i);this.propsInTransition={};let c={duration:s,easing:t.transitionEasing||wO,interpolator:o,interruption:t.transitionInterruption||EO,startProps:a.start,endProps:a.end,onStart:t.onTransitionStart,onUpdate:this._onTransitionUpdate,onInterrupt:this._onTransitionEnd(t.onTransitionInterrupt),onEnd:this._onTransitionEnd(t.onTransitionEnd)};this.transition.start(c),this.onStateChange({inTransition:!0}),this.updateTransition()}_onTransitionEnd(e){return t=>{this.propsInTransition=null,this.onStateChange({inTransition:!1,isZooming:!1,isPanning:!1,isRotating:!1}),e?.(t)}}};le();function U(r,e){if(!r)throw new Error(e||"deck.gl: assertion failed.")}var bn=class{constructor(e){let{compare:t,extract:n,required:i}=e;this._propsToCompare=t,this._propsToExtract=n||t,this._requiredProps=i}arePropsEqual(e,t){for(let n of this._propsToCompare)if(!(n in e)||!(n in t)||!Et(e[n],t[n]))return!1;return!0}initializeProps(e,t){let n={},i={};for(let o of this._propsToExtract)(o in e||o in t)&&(n[o]=e[o],i[o]=t[o]);return this._checkRequiredProps(n),this._checkRequiredProps(i),{start:n,end:i}}getDuration(e,t){return t.transitionDuration}_checkRequiredProps(e){this._requiredProps&&this._requiredProps.forEach(t=>{let n=e[t];U(Number.isFinite(n)||Array.isArray(n),`${t} is required for transition`)})}};le();var PO=["longitude","latitude","zoom","bearing","pitch"],SO=["longitude","latitude","zoom"],Kt=class extends bn{constructor(e={}){let t=Array.isArray(e)?e:e.transitionProps,n=Array.isArray(e)?{}:e;n.transitionProps=Array.isArray(t)?{compare:t,required:t}:t||{compare:PO,required:SO},super(n.transitionProps),this.opts=n}initializeProps(e,t){let n=super.initializeProps(e,t),{makeViewport:i,around:o}=this.opts;if(i&&o){let s=i(e),a=i(t),c=s.unproject(o);n.start.around=o,Object.assign(n.end,{around:a.project(c),aroundPosition:c,width:t.width,height:t.height})}return n}interpolateProps(e,t,n){let i={};for(let o of this._propsToExtract)i[o]=Qr(e[o]||0,t[o]||0,n);if(t.aroundPosition&&this.opts.makeViewport){let o=this.opts.makeViewport({...t,...i});Object.assign(i,o.panByPosition(t.aroundPosition,Qr(e.around,t.around,n)))}return i}};var It={transitionDuration:0},TO=300,LO=300,Ap=r=>1-(1-r)*(1-r),AO=r=>r===1?1:1-Math.pow(2,-10*r),xn={WHEEL:["wheel"],PAN:["panstart","panmove","panend"],PINCH:["pinchstart","pinchmove","pinchend"],MULTI_PAN:["multipanstart","multipanmove","multipanend"],DOUBLE_CLICK:["dblclick"],DOUBLE_CLICK_DRAG:["dblclickdragstart","dblclickdragmove","dblclickdragend","dblclickdragcancel"],KEYBOARD:["keydown"]},vn={},wn=class{constructor(e){this.state={},this._events={},this._interactionState={isDragging:!1},this._customEvents=[],this._eventStartBlocked=null,this._panMove=!1,this._multiPanMode=null,this._multiPanStartCenter=null,this._doubleClickDragAnchor=null,this._suppressDoubleClickUntil=0,this.invertPan=!1,this.dragMode="rotate",this.inertia=0,this.scrollZoom=!0,this.dragPan=!0,this.dragRotate=!0,this.doubleClickZoom=!0,this.doubleClickDragZoom=!0,this.touchZoom=!0,this.touchRotate=!1,this.multiTouchDrag=null,this.trackpadGesture=!1,this.zoomAround="pointer",this.keyboard=!0,this.transitionManager=new ms({...e,getControllerState:(t,n)=>new this.ControllerState({...t,constraintContext:n,makeViewport:e.makeViewport}),onViewStateChange:this._onTransition.bind(this),onStateChange:this._setInteractionState.bind(this)}),this.handleEvent=this.handleEvent.bind(this),this.eventManager=e.eventManager,this.onViewStateChange=e.onViewStateChange||(()=>{}),this.onStateChange=e.onStateChange||(()=>{}),this.makeViewport=e.makeViewport,this.pickPosition=e.pickPosition}set events(e){this.toggleEvents(this._customEvents,!1),this.toggleEvents(e,!0),this._customEvents=e,this.props&&this.setProps(this.props)}finalize(){for(let e in this._events)this._events[e]&&this.eventManager?.off(e,this.handleEvent);this.transitionManager.finalize()}handleEvent(e){this._controllerState=void 0;let t=this._eventStartBlocked;switch(e.type){case"panstart":return t?!1:this._onPanStart(e);case"panmove":return this._onPan(e);case"panend":return this._onPanEnd(e);case"pinchstart":return t||!this._isTrackpadGestureAllowed(e)?!1:this._onPinchStart(e);case"pinchmove":return this._isTrackpadGestureAllowed(e)?this._onPinch(e):!1;case"pinchend":return this._isTrackpadGestureAllowed(e)?this._onPinchEnd(e):!1;case"multipanstart":return t?!1:this._onMultiPanStart(e);case"multipanmove":return this._onMultiPan(e);case"multipanend":return this._onMultiPanEnd(e);case"dblclick":return this._onDoubleClick(e);case"dblclickdragstart":return t?!1:this._onDoubleClickDragStart(e);case"dblclickdragmove":return this._onDoubleClickDrag(e);case"dblclickdragend":case"dblclickdragcancel":return this._onDoubleClickDragEnd(e);case"wheel":return this._onWheel(e);case"keydown":return this._onKeyDown(e);default:return!1}}get controllerState(){return this._controllerState=this._controllerState||new this.ControllerState({makeViewport:this.makeViewport,...this.props,...this.state}),this._controllerState}getCenter(e){let{x:t,y:n}=this.props,{offsetCenter:i}=e;return[i.x-t,i.y-n]}getZoomPosition(e){if(this.zoomAround==="pointer")return e;let t=this.makeViewport(this.controllerState.getViewportProps()),[n,i]=vr(t.center,t.pixelProjectionMatrix);return[n,i]}isPointInBounds(e,t){let{width:n,height:i}=this.props;if(t&&t.handled)return!1;let o=e[0]>=0&&e[0]<=n&&e[1]>=0&&e[1]<=i;return o&&t&&t.stopPropagation(),o}isFunctionKeyPressed(e){let{srcEvent:t}=e;return!!(t.metaKey||t.altKey||t.ctrlKey||t.shiftKey)}isDragging(){return this._interactionState.isDragging||!1}blockEvents(e){let t=setTimeout(()=>{this._eventStartBlocked===t&&(this._eventStartBlocked=null)},e);this._eventStartBlocked=t}setProps(e){e.maxBoundsPadding===void 0&&(e.maxBoundsPadding=null),e.dragMode&&(this.dragMode=e.dragMode);let t=this.props;this.props=e,"transitionInterpolator"in e||(e.transitionInterpolator=this._getTransitionProps().transitionInterpolator),this.transitionManager.processViewStateChange(e);let{inertia:n}=e;this.inertia=Number.isFinite(n)?n:n===!0?TO:0;let{scrollZoom:i=!0,dragPan:o=!0,dragRotate:s=!0,doubleClickZoom:a=!0,doubleClickDragZoom:c=!1,touchZoom:l=!0,touchRotate:u=!1,multiTouchDrag:f=u?"rotate":null,trackpadGesture:d=!1,zoomAround:h="pointer",keyboard:p=!0}=e,m=!!this.onViewStateChange;if(this.toggleEvents(xn.WHEEL,m&&i),this.toggleEvents(xn.PAN,m),this.toggleEvents(xn.PINCH,m&&(l||f==="rotate")),this.toggleEvents(xn.MULTI_PAN,m&&!!f),this.toggleEvents(xn.DOUBLE_CLICK,m&&a),this.toggleEvents(xn.DOUBLE_CLICK_DRAG,m&&c),this.toggleEvents(xn.KEYBOARD,m&&p),this.scrollZoom=i,this.dragPan=o,this.dragRotate=s,this.doubleClickZoom=a,this.doubleClickDragZoom=c,this.touchZoom=l,this.touchRotate=f==="rotate",this.multiTouchDrag=f,this.trackpadGesture=d,this.zoomAround=h,this.keyboard=p,(!t||t.height!==e.height||t.width!==e.width||t.maxBounds!==e.maxBounds||t.maxBoundsPadding!==e.maxBoundsPadding)&&e.maxBounds){let b=new this.ControllerState({...e,makeViewport:this.makeViewport}),y=b.getViewportProps();Object.keys(y).some(v=>!J(y[v],e[v],1))&&this.updateViewport(b)}}updateTransition(){this.transitionManager.updateTransition()}toggleEvents(e,t){this.eventManager&&e.forEach(n=>{this._events[n]!==t&&(this._events[n]=t,t?this.eventManager.on(n,this.handleEvent):this.eventManager.off(n,this.handleEvent))})}updateViewport(e,t=null,n={}){let i={...e.getViewportProps(),...t},o=this.controllerState!==e;if(this.state=e.getState(),this._setInteractionState(n),o){let s=this.controllerState&&this.controllerState.getViewportProps();this.onViewStateChange&&this.onViewStateChange({viewState:i,interactionState:this._interactionState,oldViewState:s,viewId:this.props.id})}}_onTransition(e){this.onViewStateChange({...e,interactionState:this._interactionState,viewId:this.props.id})}_setInteractionState(e){Object.assign(this._interactionState,e),this.onStateChange(this._interactionState)}_getConstraintContext(e,t){return this.props.rubberBand?{mode:t==="update"?"elastic":t==="end"?"rebound":"hard"}:{mode:"hard"}}_getReboundTransition(e,t){if(e.mode!=="rebound")return null;let n=t.getViewportProps();return Object.keys(n).some(o=>!J(this.props[o],n[o],1))?{...this._getTransitionProps(),transitionDuration:LO,transitionEasing:AO}:null}_onPanStart(e){let t=this.getCenter(e);if(!this.isPointInBounds(t,e))return!1;let n=this.isFunctionKeyPressed(e)||e.rightButton||!1;(this.invertPan||this.dragMode==="pan")&&(n=!n);let i=n?"pan":"rotate",o=this._getConstraintContext(i,"start"),s=n?this.controllerState.panStart({pos:t},o):this.controllerState.rotateStart({pos:t},o);return this._panMove=n,this.updateViewport(s,It,{isDragging:!0}),!0}_onPan(e){return this.isDragging()?this._panMove?this._onPanMove(e):this._onPanRotate(e):!1}_onPanEnd(e){return this.isDragging()?this._panMove?this._onPanMoveEnd(e):this._onPanRotateEnd(e):!1}_onPanMove(e){if(!this.dragPan)return!1;let t=this.getCenter(e),n=this.controllerState.pan({pos:t},this._getConstraintContext("pan","update"));return this.updateViewport(n,It,{isDragging:!0,isPanning:!0}),!0}_onPanMoveEnd(e){let{inertia:t}=this;if(this.dragPan&&t&&e.velocity){let n=this.getCenter(e),i=[n[0]+e.velocityX*t/2,n[1]+e.velocityY*t/2],o=this.controllerState.pan({pos:i}).panEnd();this.updateViewport(o,{...this._getTransitionProps(),transitionDuration:t,transitionEasing:Ap},{isDragging:!1,isPanning:!0})}else{let n=this.controllerState,i=this._getConstraintContext("pan","end"),o=n.panEnd(i),s=this._getReboundTransition(i,o);this.updateViewport(o,s,{isDragging:!1,isPanning:!!s})}return!0}_onPanRotate(e){if(!this.dragRotate)return!1;let t=this.getCenter(e),n=this.controllerState.rotate({pos:t},this._getConstraintContext("rotate","update"));return this.updateViewport(n,It,{isDragging:!0,isRotating:!0}),!0}_onPanRotateEnd(e){let{inertia:t}=this;if(this.dragRotate&&t&&e.velocity){let n=this.getCenter(e),i=[n[0]+e.velocityX*t/2,n[1]+e.velocityY*t/2],o=this.controllerState.rotate({pos:i}).rotateEnd();this.updateViewport(o,{...this._getTransitionProps(),transitionDuration:t,transitionEasing:Ap},{isDragging:!1,isRotating:!0})}else{let n=this.controllerState,i=this._getConstraintContext("rotate","end"),o=n.rotateEnd(i),s=this._getReboundTransition(i,o);this.updateViewport(o,s,{isDragging:!1,isRotating:!!s})}return!0}_onWheel(e){if(!this.scrollZoom||this.trackpadGesture&&e.device!=="mouse")return!1;let t=this.getCenter(e);if(!this.isPointInBounds(t,e))return!1;e.srcEvent.preventDefault();let{speed:n=.01,smooth:i=!1}=this.scrollZoom===!0?{}:this.scrollZoom,{delta:o}=e,s=2/(1+Math.exp(-Math.abs(o*n)));o<0&&s!==0&&(s=1/s);let a=this.getZoomPosition(t),c=i?{...this._getTransitionProps({around:a}),transitionDuration:250}:It,l=this.controllerState.zoom({pos:a,scale:s});return this.updateViewport(l,c,{isZooming:!0,isPanning:!0}),i||this._setInteractionState({isZooming:!1,isPanning:!1}),!0}_onMultiPanStart(e){let{multiTouchDrag:t}=this;if(!t||!this._isMultiPanEventAllowed(e,t))return!1;let n=e.offsetCenter;if(!this.isPointInBounds(this.getCenter(e),e))return!1;let i=e.pointerType==="trackpad",o={x:n.x-(i?0:e.deltaX),y:n.y-(i?0:e.deltaY)},s={...e,offsetCenter:o},a=this.getCenter(s),c=t==="pan"?this.controllerState.panStart({pos:a},this._getConstraintContext("pan","start")):this.controllerState.rotateStart({pos:a},this._getConstraintContext("rotate","start"));return this._multiPanMode=t,this._multiPanStartCenter=o,this.updateViewport(c,It,{isDragging:!0}),!0}_onMultiPan(e){let{mode:t,event:n}=this._getMultiPanEvent(e);return!t||!n||!this.isDragging()?!1:t==="pan"?this._onPanMove(n):this._onPanRotate(n)}_onMultiPanEnd(e){let{mode:t,event:n}=this._getMultiPanEvent(e);if(!t||!n||!this.isDragging())return this._resetMultiPan(),!1;let i=t==="pan"?this._onPanMoveEnd(n):this._onPanRotateEnd(n);return this._resetMultiPan(),i}_isTrackpadGestureAllowed(e){return e.pointerType!=="trackpad"||this.trackpadGesture}_isMultiPanEventAllowed(e,t){return e.pointerType==="trackpad"?this.trackpadGesture&&(t==="pan"?this.dragPan:this.dragRotate):e.pointerType==="touch"&&(t==="pan"?this.dragPan:this.dragRotate)}_getMultiPanEvent(e){let t=this._multiPanMode,n=this._multiPanStartCenter;return!t||!n?{mode:null,event:null}:{mode:t,event:{...e,offsetCenter:{x:n.x+e.deltaX,y:n.y+e.deltaY}}}}_resetMultiPan(){this._multiPanMode=null,this._multiPanStartCenter=null}_onPinchStart(e){this._doubleClickDragAnchor=null;let t=this.getCenter(e);if(!this.isPointInBounds(t,e))return!1;let n=this.controllerState.zoomStart({pos:this.getZoomPosition(t)},this._getConstraintContext("zoom","start")).rotateStart({pos:t},this._getConstraintContext("rotate","start"));return vn._startPinchRotation=e.rotation,vn._lastPinchEvent=e,this.updateViewport(n,It,{isDragging:!0}),!0}_onPinch(e){if(!this.touchZoom&&!this.touchRotate||!this.isDragging())return!1;let t=this.controllerState;if(this.touchZoom){let{scale:n}=e,i=this.getCenter(e);t=t.zoom({pos:this.getZoomPosition(i),scale:n},this._getConstraintContext("zoom","update"))}if(this.touchRotate){let{rotation:n}=e;t=t.rotate({deltaAngleX:vn._startPinchRotation-n},this._getConstraintContext("rotate","update"))}return this.updateViewport(t,It,{isDragging:!0,isPanning:this.touchZoom,isZooming:this.touchZoom,isRotating:this.touchRotate}),vn._lastPinchEvent=e,!0}_onPinchEnd(e){if(!this.isDragging())return!1;let{inertia:t}=this,{_lastPinchEvent:n}=vn;if(this.touchZoom&&t&&n&&e.scale!==n.scale){let i=this.getCenter(e),o=this.getZoomPosition(i),s=this.controllerState.rotateEnd(),a=Math.log2(e.scale),c=(a-Math.log2(n.scale))/(e.deltaTime-n.deltaTime),l=Math.pow(2,a+c*t/2);s=s.zoom({pos:o,scale:l}).zoomEnd(),this.updateViewport(s,{...this._getTransitionProps({around:o}),transitionDuration:t,transitionEasing:Ap},{isDragging:!1,isPanning:this.touchZoom,isZooming:this.touchZoom,isRotating:!1}),this.blockEvents(t)}else{let i=this.controllerState,o=this._getConstraintContext("zoom","end"),s=this._getConstraintContext("rotate","end"),a=i.zoomEnd(o).rotateEnd(s),c=this._getReboundTransition(this.touchZoom?o:s,a);this.updateViewport(a,c,{isDragging:!1,isPanning:!!c&&this.touchZoom,isZooming:!!c&&this.touchZoom,isRotating:!!c&&this.touchRotate})}return vn._startPinchRotation=null,vn._lastPinchEvent=null,!0}_onDoubleClick(e){if(!this.doubleClickZoom||Date.now()<this._suppressDoubleClickUntil)return!1;let t=this.getCenter(e);if(!this.isPointInBounds(t,e))return!1;let n=this.isFunctionKeyPressed(e),i=this.getZoomPosition(t),o=this.controllerState.zoom({pos:i,scale:n?.5:2});return this.updateViewport(o,this._getTransitionProps({around:i}),{isZooming:!0,isPanning:!0}),this.blockEvents(100),!0}_onDoubleClickDragStart(e){if(!this.doubleClickDragZoom)return this._doubleClickDragAnchor=null,!1;let t=this.getCenter(e);if(!this.isPointInBounds(t,e))return this._doubleClickDragAnchor=null,!1;this._doubleClickDragAnchor=this.getZoomPosition(t);let n=this.controllerState.zoomStart({pos:this._doubleClickDragAnchor},this._getConstraintContext("zoom","start"));return e.scale!==1&&(n=n.zoom({pos:this._doubleClickDragAnchor,scale:e.scale},this._getConstraintContext("zoom","update"))),this.updateViewport(n,It,{isDragging:!0,isPanning:!0,isZooming:!0}),!0}_onDoubleClickDrag(e){let t=this._doubleClickDragAnchor;if(!t)return!1;let n=this.controllerState.zoom({pos:t,scale:e.scale},this._getConstraintContext("zoom","update"));return this.updateViewport(n,It,{isDragging:!0,isPanning:!0,isZooming:!0}),!0}_onDoubleClickDragEnd(e){if(!this._doubleClickDragAnchor)return!1;this._doubleClickDragAnchor=null;let n=this.controllerState,i=this._getConstraintContext("zoom","end"),o=n.zoomEnd(i),s=this._getReboundTransition(i,o);return this.updateViewport(o,s,{isDragging:!1,isPanning:!!s,isZooming:!!s}),this._suppressDoubleClickUntil=Date.now()+100,this.blockEvents(100),!0}_onKeyDown(e){if(!this.keyboard)return!1;let t=this.isFunctionKeyPressed(e),{zoomSpeed:n,moveSpeed:i,rotateSpeedX:o,rotateSpeedY:s}=this.keyboard===!0?{}:this.keyboard,{controllerState:a}=this,c,l={};switch(e.srcEvent.code){case"Minus":c=t?a.zoomOut(n).zoomOut(n):a.zoomOut(n),l.isZooming=!0;break;case"Equal":c=t?a.zoomIn(n).zoomIn(n):a.zoomIn(n),l.isZooming=!0;break;case"ArrowLeft":t?(c=a.rotateLeft(o),l.isRotating=!0):(c=a.moveLeft(i),l.isPanning=!0);break;case"ArrowRight":t?(c=a.rotateRight(o),l.isRotating=!0):(c=a.moveRight(i),l.isPanning=!0);break;case"ArrowUp":t?(c=a.rotateUp(s),l.isRotating=!0):(c=a.moveUp(i),l.isPanning=!0);break;case"ArrowDown":t?(c=a.rotateDown(s),l.isRotating=!0):(c=a.moveDown(i),l.isPanning=!0);break;default:return!1}return this.updateViewport(c,this._getTransitionProps(),l),!0}_getTransitionProps(e){let{transition:t}=this;return!t||!t.transitionInterpolator?It:e?{...t,transitionInterpolator:new Kt({...e,...t.transitionInterpolator.opts,makeViewport:this.controllerState.makeViewport})}:t}};var Qt=Symbol("constraintAround"),gs=class{constructor(e,t,n,i){this.makeViewport=n,this._viewportProps=this.applyConstraints(e,i),this._state=t}getViewportProps(){return this._viewportProps}getState(){return this._state}};function ul(r,e,t){let n=r-e;return n&&Number.isFinite(n)?e+n*t/(t+Math.abs(n)):e}function wi(r,e,t){let n=De(Be(t?.left??0),r),i=De(Be(t?.right??0),r),o=De(Be(t?.top??0),e),s=De(Be(t?.bottom??0),e);return{x:n,y:o,width:r-n-i,height:e-o-s}}function fl(r,e,t){let[n,i]=r.project(e);return n=Number.isFinite(n)?n:r.width/2,i=Number.isFinite(i)?i:r.height/2,{left:n-t.x,right:t.x+t.width-n,top:i-t.y,bottom:t.y+t.height-i}}var Gv=5,CO=1.2,zv=512,$v=[[-1/0,-90],[1/0,90]],MO=1;function _s([r,e]){if(Math.abs(e)>90&&(e=Math.sign(e)*90),Number.isFinite(r)){let[n,i]=Ie([r,e]);return[n,V(i,0,zv)]}let[,t]=Ie([0,e]);return[r,V(t,0,zv)]}var ys=class extends gs{constructor(e){let{width:t,height:n,latitude:i,longitude:o,zoom:s,bearing:a=0,pitch:c=0,altitude:l=1.5,position:u=[0,0,0],maxZoom:f=20,minZoom:d=0,maxPitch:h=60,minPitch:p=0,startPanLngLat:m,startZoomLngLat:g,startRotatePos:b,startRotateLngLat:y,startBearing:x,startPitch:v,startZoom:w,normalize:E=!0,rubberBand:T=!1}=e,{[Qt]:L}=e;U(Number.isFinite(o)),U(Number.isFinite(i)),U(Number.isFinite(s));let C=e.maxBounds||(E?$v:null),S=e.maxBoundsPadding||null;super({width:t,height:n,latitude:i,longitude:o,zoom:s,bearing:a,pitch:c,altitude:l,maxZoom:f,minZoom:d,maxPitch:h,minPitch:p,normalize:E,position:u,maxBounds:C,maxBoundsPadding:S,rubberBand:T,[Qt]:L},{startPanLngLat:m,startZoomLngLat:g,startRotatePos:b,startRotateLngLat:y,startBearing:x,startPitch:v,startZoom:w},e.makeViewport,e.constraintContext),this.getAltitude=e.getAltitude}panStart({pos:e},t){return this._getUpdatedState({startPanLngLat:this._unproject(e)},t)}pan({pos:e,startPos:t},n){let i=this.getState().startPanLngLat||this._unproject(t);if(!i)return this;let s=this.makeViewport(this.getViewportProps()).panByPosition(i,e);return this._getUpdatedState(s,n)}panEnd(e){return this._getUpdatedState({startPanLngLat:null},e)}rotateStart({pos:e}){let t=this.getAltitude?.(e);return this._getUpdatedState({startRotatePos:e,startRotateLngLat:t!==void 0?this._unproject3D(e,t):void 0,startBearing:this.getViewportProps().bearing,startPitch:this.getViewportProps().pitch})}rotate({pos:e,deltaAngleX:t=0,deltaAngleY:n=0}){let{startRotatePos:i,startRotateLngLat:o,startBearing:s,startPitch:a}=this.getState();if(!i||s===void 0||a===void 0)return this;let c;if(e?c=this._getNewRotation(e,i,a,s):c={bearing:s+t,pitch:a+n},o){let l=this.makeViewport({...this.getViewportProps(),...c}),u="panByPosition3D"in l?"panByPosition3D":"panByPosition";return this._getUpdatedState({...c,...l[u](o,i)})}return this._getUpdatedState(c)}rotateEnd(){return this._getUpdatedState({startRotatePos:null,startRotateLngLat:null,startBearing:null,startPitch:null})}zoomStart({pos:e},t){return this._getUpdatedState({startZoomLngLat:this._unproject(e),startZoom:this.getViewportProps().zoom},t)}zoom({pos:e,startPos:t,scale:n},i){let{startZoom:o,startZoomLngLat:s}=this.getState();return s||(o=this.getViewportProps().zoom,s=this._unproject(t)||this._unproject(e)),s?this._getUpdatedState({zoom:o+Math.log2(n),[Qt]:{position:s,screenPosition:e}},i):this}zoomEnd(e){return this._getUpdatedState({startZoomLngLat:null,startZoom:null},e)}zoomIn(e=2,t){return this._zoomFromCenter(e,t)}zoomOut(e=2,t){return this._zoomFromCenter(1/e,t)}moveLeft(e=100,t){return this._panFromCenter([e,0],t)}moveRight(e=100,t){return this._panFromCenter([-e,0],t)}moveUp(e=100,t){return this._panFromCenter([0,e],t)}moveDown(e=100,t){return this._panFromCenter([0,-e],t)}rotateLeft(e=15){return this._getUpdatedState({bearing:this.getViewportProps().bearing-e})}rotateRight(e=15){return this._getUpdatedState({bearing:this.getViewportProps().bearing+e})}rotateUp(e=10){return this._getUpdatedState({pitch:this.getViewportProps().pitch+e})}rotateDown(e=10){return this._getUpdatedState({pitch:this.getViewportProps().pitch-e})}shortestPathFrom(e){let t=e.getViewportProps(),n={...this.getViewportProps()},{bearing:i,longitude:o}=n;return Math.abs(i-t.bearing)>180&&(n.bearing=i<0?i+360:i-360),Math.abs(o-t.longitude)>180&&(n.longitude=o<0?o+360:o-360),n}applyConstraints(e,t){let n=e,i=n[Qt];delete n[Qt];let{maxPitch:o,minPitch:s,pitch:a,bearing:c,normalize:l,maxBounds:u,rubberBand:f}=e;l&&(c<-180||c>180)&&(e.bearing=qt(c+180,360)-180),e.pitch=V(a,s,o);let d=this._constrainZoom(e.zoom,e),h=f&&t?.mode==="elastic";if(e.zoom=t?.mode==="preserve"?e.zoom:h?ul(e.zoom,d,MO):d,i){let p=this.makeViewport(e);Object.assign(e,p.panByPosition(i.position,i.screenPosition))}if(l&&(e.longitude<-180||e.longitude>180)&&(e.longitude=qt(e.longitude+180,360)-180),u){let p=wi(e.width,e.height,e.maxBoundsPadding),m=this.makeViewport({...e,bearing:0,pitch:0}),g=fl(m,[e.longitude,e.latitude],p),b=_s(u[0]),y=_s(u[1]),x=2**e.zoom,v=[b[0]+g.left/x,b[1]+g.bottom/x],w=[y[0]-g.right/x,y[1]-g.top/x],E=_s([e.longitude,e.latitude]),T=[V(E[0],v[0],w[0]),V(E[1],v[1],w[1])],L=E.slice();if(p.width>=0&&(L[0]=t?.mode==="preserve"?E[0]:h?ul(E[0],T[0],p.width/2/x):T[0]),p.height>=0&&(L[1]=t?.mode==="preserve"?E[1]:h?ul(E[1],T[1],p.height/2/x):T[1]),L[0]!==E[0]||L[1]!==E[1]){let[C,S]=ze(L);L[0]!==E[0]&&(e.longitude=C),L[1]!==E[1]&&(e.latitude=S)}}return e}_constrainZoom(e,t){t||(t=this.getViewportProps());let{maxZoom:n,maxBounds:i}=t,o=i!==null&&t.width>0&&t.height>0,{minZoom:s}=t;if(o){let a=wi(t.width,t.height,t.maxBoundsPadding),c=_s(i[0]),l=_s(i[1]),u=l[0]-c[0],f=l[1]-c[1];a.width>0&&Number.isFinite(u)&&u>0&&(s=Math.max(s,Math.log2(a.width/u))),a.height>0&&Number.isFinite(f)&&f>0&&(s=Math.max(s,Math.log2(a.height/f))),s>n&&(s=n)}return V(e,s,n)}_zoomFromCenter(e,t){let{width:n,height:i}=this.getViewportProps();return this.zoom({pos:[n/2,i/2],scale:e},t)}_panFromCenter(e,t){let{width:n,height:i}=this.getViewportProps();return this.pan({startPos:[n/2,i/2],pos:[n/2+e[0],i/2+e[1]]},t)}_getUpdatedState(e,t){return new this.constructor({makeViewport:this.makeViewport,...this.getViewportProps(),...this.getState(),...e,constraintContext:t})}_unproject(e){let t=this.makeViewport(this.getViewportProps());return e&&t.unproject(e)}_unproject3D(e,t){return this.makeViewport(this.getViewportProps()).unproject(e,{targetZ:t})}_getNewRotation(e,t,n,i){let o=e[0]-t[0],s=e[1]-t[1],a=e[1],c=t[1],{width:l,height:u}=this.getViewportProps(),f=o/l,d=0;s>0?Math.abs(u-c)>Gv&&(d=s/(c-u)*CO):s<0&&c>Gv&&(d=1-a/c),d=V(d,-1,1);let{minPitch:h,maxPitch:p}=this.getViewportProps(),m=i+180*f,g=n;return d>0?g=n+d*(p-n):d<0&&(g=n-d*(h-n)),{pitch:g,bearing:m}}},bs=class extends wn{constructor(){super(...arguments),this.ControllerState=ys,this.transition={transitionDuration:300,transitionInterpolator:new Kt({transitionProps:{compare:["longitude","latitude","zoom","bearing","pitch","position"],required:["longitude","latitude","zoom"]}})},this.dragMode="pan",this.rotationPivot="center",this._getAltitude=e=>{if(this.rotationPivot==="2d")return 0;if(this.rotationPivot==="3d"&&this.pickPosition){let{x:t,y:n}=this.props,i=this.pickPosition(t+e[0],n+e[1]);if(i&&i.coordinate&&i.coordinate.length>=3)return i.coordinate[2]}}}setProps(e){"rotationPivot"in e&&(this.rotationPivot=e.rotationPivot||"center"),e.getAltitude=this._getAltitude,e.position=e.position||[0,0,0],e.maxBounds=e.maxBounds||(e.normalize===!1?null:$v),super.setProps(e)}updateViewport(e,t=null,n={}){let i=e.getState();n.isDragging&&i.startRotateLngLat?n={...n,rotationPivotPosition:i.startRotateLngLat}:n.isDragging===!1&&(n={...n,rotationPivotPosition:void 0}),super.updateViewport(e,t,n)}};var dl=class extends yn{constructor(e={}){super(e)}getViewportType(){return Zt}get ControllerType(){return bs}};dl.displayName="MapView";var xs=dl;var RO=new fi;function IO(r,e){let t=r.order??1/0,n=e.order??1/0;return t-n}var vs=class{constructor(e){this._resolvedEffects=[],this._defaultEffects=[],this.effects=[],this._context=e,this._needsRedraw="Initial render",this._setEffects([])}addDefaultEffect(e){let t=this._defaultEffects;if(!t.find(n=>n.id===e.id)){let n=t.findIndex(i=>IO(i,e)>0);n<0?t.push(e):t.splice(n,0,e),e.setup(this._context),this._setEffects(this.effects)}}setProps(e){"effects"in e&&(J(e.effects,this.effects,1)||this._setEffects(e.effects))}needsRedraw(e={clearRedrawFlags:!1}){let t=this._needsRedraw;return e.clearRedrawFlags&&(this._needsRedraw=!1),t}getEffects(){return this._resolvedEffects}_setEffects(e){let t={};for(let i of this.effects)t[i.id]=i;let n=[];for(let i of e){let o=t[i.id],s=i;o&&o!==i?o.setProps?(o.setProps(i.props),s=o):o.cleanup(this._context):o||i.setup(this._context),n.push(s),delete t[i.id]}for(let i in t)t[i].cleanup(this._context);this.effects=n,this._resolvedEffects=n.concat(this._defaultEffects),e.some(i=>i instanceof fi)||this._resolvedEffects.push(RO),this._needsRedraw="effects changed"}finalize(){for(let e of this._resolvedEffects)e.cleanup(this._context);this.effects.length=0,this._resolvedEffects.length=0,this._defaultEffects.length=0}};var ws=class extends Yt{shouldDrawLayer(e){let{operation:t}=e.props;return t.includes("draw")||t.includes("terrain")}render(e){return this._render(e)}};var OO="deckRenderer.renderLayers",Es=class{constructor(e,t={}){this.device=e,this.stats=t.stats,this.layerFilter=null,this.drawPickingColors=!1,this.drawLayersPass=new ws(e),this.pickLayersPass=new _n(e),this.renderCount=0,this._needsRedraw="Initial render",this.renderBuffers=[],this.lastPostProcessEffect=null}setProps(e){this.layerFilter!==e.layerFilter&&(this.layerFilter=e.layerFilter,this._needsRedraw="layerFilter changed"),this.drawPickingColors!==e.drawPickingColors&&(this.drawPickingColors=e.drawPickingColors,this._needsRedraw="drawPickingColors changed")}renderLayers(e){let t=this.drawPickingColors?this.pickLayersPass:this.drawLayersPass,n={layerFilter:this.layerFilter,isPicking:this.drawPickingColors,...e};if(!e.viewports.length){let a=t.render(n),c="stats"in a?a.stats:a;this._updateStats(c);return}n.effects&&this._preRender(n.effects,n);let i=this.lastPostProcessEffect?this.renderBuffers[0]:n.target;this.lastPostProcessEffect&&(n.clearColor=[0,0,0,0],n.clearCanvas=!0);let o=t.render({...n,target:i}),s="stats"in o?o.stats:o;n.effects&&(this.lastPostProcessEffect&&(n.clearCanvas=e.clearCanvas===void 0?!0:e.clearCanvas),this._postRender(n.effects,n)),this.renderCount++,ie(OO,this,s,e),this._updateStats(s)}needsRedraw(e={clearRedrawFlags:!1}){let t=this._needsRedraw;return e.clearRedrawFlags&&(this._needsRedraw=!1),t}finalize(){let{renderBuffers:e}=this;for(let t of e)t.delete();e.length=0}_updateStats(e){if(!this.stats)return;let t=0;for(let{visibleCount:n}of e)t+=n;this.stats.get("Layers rendered").addCount(t)}_preRender(e,t){this.lastPostProcessEffect=null,t.preRenderStats=t.preRenderStats||{};for(let n of e)t.preRenderStats[n.id]=n.preRender(t),n.postRender&&(this.lastPostProcessEffect=n.id);this.lastPostProcessEffect&&this._resizeRenderBuffers(t.canvasContext)}_resizeRenderBuffers(e=this.device.canvasContext){let{renderBuffers:t}=this,n=e.getDrawingBufferSize(),[i,o]=n;t.length===0&&[0,1].map(s=>{let a=this.device.createTexture({sampler:{minFilter:"linear",magFilter:"linear"},width:i,height:o});t.push(this.device.createFramebuffer({id:`deck-renderbuffer-${s}`,colorAttachments:[a]}))});for(let s of t)s.resize(n)}_postRender(e,t){let{renderBuffers:n}=this,i=t.target??t.canvasContext?.getCurrentFramebuffer()??t.target,o={...t,inputBuffer:n[0],swapBuffer:n[1]};for(let s of e)if(s.postRender){o.target=s.id===this.lastPostProcessEffect?i:void 0;let a=s.postRender(o);o.inputBuffer=a,o.swapBuffer=a===n[0]?n[1]:n[0]}}};I();var BO={pickedColor:null,pickedObjectIndex:-1};function Cp({pickedColors:r,decodePickingColor:e,deviceX:t,deviceY:n,deviceRadius:i,deviceRect:o}){let{x:s,y:a,width:c,height:l}=o,u=i*i,f=-1,d=0;for(let h=0;h<l;h++){let p=h+a-n,m=p*p;if(m>u)d+=4*c;else for(let g=0;g<c;g++){if(r[d+3]-1>=0){let y=g+s-t,x=y*y+m;x<=u&&(u=x,f=d)}d+=4}}if(f>=0){let h=r.slice(f,f+4),p=e(h);if(p){let m=Math.floor(f/4/c),g=f/4-m*c;return{...p,pickedColor:h,pickedX:s+g,pickedY:a+m}}F.error("Picked non-existent layer. Is picking buffer corrupt?")()}return BO}function Mp({pickedColors:r,decodePickingColor:e}){let t=new Map;if(r){for(let n=0;n<r.length;n+=4)if(r[n+3]-1>=0){let o=r.slice(n,n+4),s=o.join(",");if(!t.has(s)){let a=e(o);a?t.set(s,{...a,color:o}):F.error("Picked non-existent layer. Is picking buffer corrupt?")()}}}return Array.from(t.values())}function hl({pickInfo:r,viewports:e,pixelRatio:t,x:n,y:i,z:o}){let s=e[0];e.length>1&&(s=DO(r?.pickedViewports||e,{x:n,y:i}));let a;if(s){let c=[n-s.x,i-s.y];o!==void 0&&(c[2]=o),a=s.unproject(c)}return{color:null,layer:null,viewport:s,index:-1,picked:!1,x:n,y:i,pixel:[n,i],coordinate:a,devicePixel:r&&"pickedX"in r?[r.pickedX,r.pickedY]:void 0,pixelRatio:t}}function Rp(r){let{pickInfo:e,lastPickedInfo:t,mode:n,layers:i}=r,{pickedColor:o,pickedLayer:s,pickedObjectIndex:a}=e,c=s?[s]:[];if(n==="hover"){let f=t.index,d=t.layerId,h=s?s.props.id:null;if(h!==d||a!==f){if(h!==d){let p=i.find(m=>m.props.id===d);p&&c.unshift(p)}t.layerId=h,t.index=a,t.info=null}}let l=hl(r),u=new Map;return u.set(null,l),c.forEach(f=>{let d={...l};f===s&&(d.color=o,d.index=a,d.picked=!0),d=pl({layer:f,info:d,mode:n});let h=d.layer;f===s&&n==="hover"&&(t.info=d),u.set(h.id,d),n==="hover"&&h.updateAutoHighlight(d)}),u}function pl({layer:r,info:e,mode:t}){for(;r&&e;){let n=e.layer||null;e.sourceLayer=n,e.layer=r,e=r.getPickingInfo({info:e,mode:t,sourceLayer:n}),r=r.parent}return e}function DO(r,e){for(let t=r.length-1;t>=0;t--){let n=r[t];if(n.containsPixel(e))return n}return r[0]}var Ps=class{constructor(e,t={}){this._pickable=!0,this.device=e,this.stats=t.stats,this.pickLayersPass=new _n(e),this.lastPickedInfo={index:-1,layerId:null,info:null}}setProps(e){"layerFilter"in e&&(this.layerFilter=e.layerFilter),"_pickable"in e&&(this._pickable=e._pickable)}finalize(){this.pickingFBO&&this.pickingFBO.destroy(),this.depthFBO&&this.depthFBO.destroy()}pickObjectAsync(e){return this._pickClosestObjectAsync(e)}pickObjectsAsync(e){return this._pickVisibleObjectsAsync(e)}pickObject(e){return this._pickClosestObject(e)}pickObjects(e){return this._pickVisibleObjects(e)}getLastPickedObject({x:e,y:t,layers:n,viewports:i},o=this.lastPickedInfo.info){let s=o&&o.layer&&o.layer.id,a=o&&o.viewport&&o.viewport.id,c=s?n.find(d=>d.id===s):null,l=a&&i.find(d=>d.id===a)||i[0],u=l&&l.unproject([e-l.x,t-l.y]);return{...o,...{x:e,y:t,viewport:l,coordinate:u,layer:c}}}_resizeBuffer(e=this.device.getDefaultCanvasContext()){if(!this.pickingFBO){let i=this.device.createTexture({format:"rgba8unorm",width:1,height:1,usage:z.RENDER_ATTACHMENT|z.COPY_SRC});if(this.pickingFBO=this.device.createFramebuffer({colorAttachments:[i],depthStencilAttachment:"depth16unorm"}),this.device.isTextureFormatRenderable("rgba32float")){let o=this.device.createTexture({format:"rgba32float",width:1,height:1,usage:z.RENDER_ATTACHMENT|z.COPY_SRC}),s=this.device.createFramebuffer({colorAttachments:[o],depthStencilAttachment:"depth16unorm"});this.depthFBO=s}}let[t,n]=e.getDrawingBufferSize();this.pickingFBO?.resize({width:t,height:n}),this.depthFBO?.resize({width:t,height:n})}_getPickable(e){if(this._pickable===!1)return null;let t=e.filter(n=>this.pickLayersPass.shouldDrawLayer(n)&&!n.isComposite);return t.length?t:null}async _pickClosestObjectAsync({layers:e,views:t,viewports:n,x:i,y:o,radius:s=0,depth:a=1,mode:c="query",unproject3D:l,canvasContext:u=this.device.getDefaultCanvasContext(),onViewportActive:f,effects:d}){let h=u.cssToDeviceRatio(),p=this._getPickable(e);if(!p||n.length===0)return{result:[],emptyInfo:hl({viewports:n,x:i,y:o,pixelRatio:h})};this._resizeBuffer(u);let m=u.cssToDevicePixels([i,o],!0),g=[m.x+Math.floor(m.width/2),m.y+Math.floor(m.height/2)],b=Math.round(s*h),{width:y,height:x}=this.pickingFBO,v=this._getPickingRect({deviceX:g[0],deviceY:g[1],deviceRadius:b,deviceWidth:y,deviceHeight:x}),w={x:i-s,y:o-s,width:s*2+1,height:s*2+1},E,T=[],L=new Set;for(let C=0;C<a;C++){let S;if(v){let M=await this._drawAndSampleAsync({layers:p,views:t,viewports:n,onViewportActive:f,deviceRect:v,cullRect:w,effects:d,pass:`picking:${c}`,canvasContext:u});S=Cp({...M,deviceX:g[0],deviceY:g[1],deviceRadius:b,deviceRect:v})}else S={pickedColor:null,pickedObjectIndex:-1};let k,R=this._getDepthLayers(S,p,l);if(R.length>0){let{pickedColors:M}=await this._drawAndSampleAsync({layers:R,views:t,viewports:n,onViewportActive:f,deviceRect:{x:S.pickedX??g[0],y:S.pickedY??g[1],width:1,height:1},cullRect:w,effects:d,pass:`picking:${c}:z`,canvasContext:u},!0);M[3]&&(k=M[0])}S.pickedLayer&&C+1<a&&(L.add(S.pickedLayer),S.pickedLayer.disablePickingIndex(S.pickedObjectIndex)),E=Rp({pickInfo:S,lastPickedInfo:this.lastPickedInfo,mode:c,layers:p,viewports:n,x:i,y:o,z:k,pixelRatio:h});for(let M of E.values())M.layer&&T.push(M);if(!S.pickedColor)break}for(let C of L)C.restorePickingColors();return{result:T,emptyInfo:E.get(null)}}_pickClosestObject({layers:e,views:t,viewports:n,x:i,y:o,radius:s=0,depth:a=1,mode:c="query",unproject3D:l,canvasContext:u=this.device.getDefaultCanvasContext(),onViewportActive:f,effects:d}){let h=u.cssToDeviceRatio(),p=this._getPickable(e);if(!p||n.length===0)return{result:[],emptyInfo:hl({viewports:n,x:i,y:o,pixelRatio:h})};this._resizeBuffer(u);let m=u.cssToDevicePixels([i,o],!0),g=[m.x+Math.floor(m.width/2),m.y+Math.floor(m.height/2)],b=Math.round(s*h),{width:y,height:x}=this.pickingFBO,v=this._getPickingRect({deviceX:g[0],deviceY:g[1],deviceRadius:b,deviceWidth:y,deviceHeight:x}),w={x:i-s,y:o-s,width:s*2+1,height:s*2+1},E,T=[],L=new Set;for(let C=0;C<a;C++){let S;if(v){let M=this._drawAndSample({layers:p,views:t,viewports:n,onViewportActive:f,deviceRect:v,cullRect:w,effects:d,pass:`picking:${c}`,canvasContext:u});S=Cp({...M,deviceX:g[0],deviceY:g[1],deviceRadius:b,deviceRect:v})}else S={pickedColor:null,pickedObjectIndex:-1};let k,R=this._getDepthLayers(S,p,l);if(R.length>0){let{pickedColors:M}=this._drawAndSample({layers:R,views:t,viewports:n,onViewportActive:f,deviceRect:{x:S.pickedX??g[0],y:S.pickedY??g[1],width:1,height:1},cullRect:w,effects:d,pass:`picking:${c}:z`,canvasContext:u},!0);M[3]&&(k=M[0])}S.pickedLayer&&C+1<a&&(L.add(S.pickedLayer),S.pickedLayer.disablePickingIndex(S.pickedObjectIndex)),E=Rp({pickInfo:S,lastPickedInfo:this.lastPickedInfo,mode:c,layers:p,viewports:n,x:i,y:o,z:k,pixelRatio:h});for(let M of E.values())M.layer&&T.push(M);if(!S.pickedColor)break}for(let C of L)C.restorePickingColors();return{result:T,emptyInfo:E.get(null)}}async _pickVisibleObjectsAsync({layers:e,views:t,viewports:n,x:i,y:o,width:s=1,height:a=1,mode:c="query",maxObjects:l=null,canvasContext:u=this.device.getDefaultCanvasContext(),onViewportActive:f,effects:d}){let h=this._getPickable(e);if(!h||n.length===0)return[];this._resizeBuffer(u);let p=u.cssToDeviceRatio(),m=u.cssToDevicePixels([i,o],!0),g=m.x,b=m.y+m.height,y=u.cssToDevicePixels([i+s,o+a],!0),x=y.x+y.width,v=y.y,w={x:g,y:v,width:x-g,height:b-v},E=await this._drawAndSampleAsync({layers:h,views:t,viewports:n,onViewportActive:f,deviceRect:w,cullRect:{x:i,y:o,width:s,height:a},effects:d,pass:`picking:${c}`,canvasContext:u}),T=Mp(E),L=new Map,C=[],S=Number.isFinite(l);for(let k=0;k<T.length&&!(S&&C.length>=l);k++){let R=T[k],M={color:R.pickedColor,layer:null,index:R.pickedObjectIndex,picked:!0,x:i,y:o,pixelRatio:p};M=pl({layer:R.pickedLayer,info:M,mode:c});let N=M.layer.id;L.has(N)||L.set(N,new Set);let Q=L.get(N),te=M.object??M.index;Q.has(te)||(Q.add(te),C.push(M))}return C}_pickVisibleObjects({layers:e,views:t,viewports:n,x:i,y:o,width:s=1,height:a=1,mode:c="query",maxObjects:l=null,canvasContext:u=this.device.getDefaultCanvasContext(),onViewportActive:f,effects:d}){let h=this._getPickable(e);if(!h||n.length===0)return[];this._resizeBuffer(u);let p=u.cssToDeviceRatio(),m=u.cssToDevicePixels([i,o],!0),g=m.x,b=m.y+m.height,y=u.cssToDevicePixels([i+s,o+a],!0),x=y.x+y.width,v=y.y,w={x:g,y:v,width:x-g,height:b-v},E=this._drawAndSample({layers:h,views:t,viewports:n,onViewportActive:f,deviceRect:w,cullRect:{x:i,y:o,width:s,height:a},effects:d,pass:`picking:${c}`,canvasContext:u}),T=Mp(E),L=new Map,C=[],S=Number.isFinite(l);for(let k=0;k<T.length&&!(S&&C.length>=l);k++){let R=T[k],M={color:R.pickedColor,layer:null,index:R.pickedObjectIndex,picked:!0,x:i,y:o,pixelRatio:p};M=pl({layer:R.pickedLayer,info:M,mode:c});let N=M.layer.id;L.has(N)||L.set(N,new Set);let Q=L.get(N),te=M.object??M.index;Q.has(te)||(Q.add(te),C.push(M))}return C}async _drawAndSampleAsync({layers:e,views:t,viewports:n,onViewportActive:i,deviceRect:o,cullRect:s,effects:a,pass:c,canvasContext:l},u=!1){let f=u?this.depthFBO:this.pickingFBO,d={layers:e,layerFilter:this.layerFilter,views:t,viewports:n,onViewportActive:i,pickingFBO:f,deviceRect:o,cullRect:s,effects:a,pass:c,canvasContext:l,pickZ:u,preRenderStats:{},isPicking:!0};for(let w of a)w.useInPicking&&(d.preRenderStats[w.id]=w.preRender(d));let{decodePickingColor:h,stats:p}=this.pickLayersPass.render(d);this._updateStats(p);let{x:m,y:g,width:b,height:y}=o,x=f.colorAttachments[0]?.texture;if(!x)throw new Error("Picking framebuffer color attachment is missing");let v=await this._readTextureDataAsync(x,{x:m,y:g,width:b,height:y},u?Float32Array:Uint8Array);if(!u){let w=!1;for(let E=3;E<v.length;E+=4)if(v[E]!==0){w=!0;break}!w&&v.length>0&&F.warn("Async pick readback returned only zero alpha values",{deviceRect:o,bytes:Array.from(v.subarray(0,Math.min(v.length,16)))})()}return{pickedColors:v,decodePickingColor:h}}async _readTextureDataAsync(e,t,n){let{width:i,height:o}=t,s=e.computeMemoryLayout(t),a=this.device.createBuffer({byteLength:s.byteLength,usage:D.COPY_DST|D.MAP_READ});try{e.readBuffer(t,a);let c=await a.readAsync(0,s.byteLength),l=n.BYTES_PER_ELEMENT;if(s.bytesPerRow%l!==0)throw new Error(`Texture readback row stride ${s.bytesPerRow} is not aligned to ${l}-byte elements.`);let u=new n(c.buffer,c.byteOffset,s.byteLength/l),f=i*4,d=s.bytesPerRow/l;if(d<f)throw new Error(`Texture readback row stride ${d} is smaller than packed row length ${f}.`);let h=new n(i*o*4);for(let p=0;p<o;p++){let m=p*d;h.set(u.subarray(m,m+f),p*f)}return h}finally{a.destroy()}}_drawAndSample({layers:e,views:t,viewports:n,onViewportActive:i,deviceRect:o,cullRect:s,effects:a,pass:c,canvasContext:l},u=!1){let f=u?this.depthFBO:this.pickingFBO,d={layers:e,layerFilter:this.layerFilter,views:t,viewports:n,onViewportActive:i,pickingFBO:f,deviceRect:o,cullRect:s,effects:a,pass:c,canvasContext:l,pickZ:u,preRenderStats:{},isPicking:!0};for(let v of a)v.useInPicking&&(d.preRenderStats[v.id]=v.preRender(d));let{decodePickingColor:h,stats:p}=this.pickLayersPass.render(d);this._updateStats(p);let{x:m,y:g,width:b,height:y}=o,x=new(u?Float32Array:Uint8Array)(b*y*4);return this.device.readPixelsToArrayWebGL(f,{sourceX:m,sourceY:g,sourceWidth:b,sourceHeight:y,target:x}),{pickedColors:x,decodePickingColor:h}}_updateStats(e){if(!this.stats)return;let t=0;for(let{visibleCount:n}of e)t+=n;this.stats.get("Layers picked").addCount(t)}_getDepthLayers(e,t,n){if(!n||!this.depthFBO)return[];let{pickedLayer:i}=e,o=i?.state?.terrainDrawMode==="drape";return i&&!o?[i]:t.filter(s=>s.props.operation.includes("terrain"))}_getPickingRect({deviceX:e,deviceY:t,deviceRadius:n,deviceWidth:i,deviceHeight:o}){let s=Math.max(0,e-n),a=Math.max(0,t-n),c=Math.min(i,e+n+1)-s,l=Math.min(o,t+n+1)-a;return c<=0||l<=0?null:{x:s,y:a,width:c,height:l}}};var kO={"top-left":{top:0,left:0},"top-right":{top:0,right:0},"bottom-left":{bottom:0,left:0},"bottom-right":{bottom:0,right:0},fill:{top:0,left:0,bottom:0,right:0}},NO="top-left",Vv="root",ml=class{constructor({deck:e,parentElement:t}){this.defaultWidgets=[],this.widgets=[],this.resolvedWidgets=[],this.containers={},this.lastViewports={},this.deck=e,t?.classList.add("deck-widget-container"),this.parentElement=t}getWidgets(){return this.resolvedWidgets}setProps(e){if(e.widgets&&!J(e.widgets,this.widgets,1)){let t=e.widgets.filter(Boolean);this._setWidgets(t)}}finalize(){for(let e of this.getWidgets())this._removeWidget(e);this.defaultWidgets.length=0,this.resolvedWidgets.length=0;for(let e in this.containers)this.containers[e].remove()}addDefault(e){this.defaultWidgets.find(t=>t.id===e.id)||(this._addWidget(e),this.defaultWidgets.push(e),this._setWidgets(this.widgets))}onRedraw({viewports:e,layers:t}){let n=e.reduce((i,o)=>(i[o.id]=o,i),{});for(let i of this.getWidgets()){let{viewId:o}=i;if(o){let s=n[o];s&&(i.onViewportChange&&i.onViewportChange(s),i.onRedraw?.({viewports:[s],layers:t}))}else{if(i.onViewportChange)for(let s of e)i.onViewportChange(s);i.onRedraw?.({viewports:e,layers:t})}}this.lastViewports=n,this._updateContainers()}onHover(e,t){for(let n of this.getWidgets()){let{viewId:i}=n;(!i||i===e.viewport?.id)&&n.onHover?.(e,t)}}getCanvasBounds(e){let n=this.deck?.getCanvas?.()?.getBoundingClientRect(),i=this.parentElement?.getBoundingClientRect(),o=this.deck?.getCanvasContext?.(e?.id);if(o&&i){o.updatePosition();let[s,a]=o.getPosition(),[c,l]=o.getCSSSize();return{x:s-i.left,y:a-i.top,width:c,height:l}}return{x:n&&i?n.left-i.left:0,y:n&&i?n.top-i.top:0,width:n?.width||this.deck?.width||0,height:n?.height||this.deck?.height||0}}onEvent(e,t){let n=ci[t.type];if(n)for(let i of this.getWidgets()){let{viewId:o}=i;(!o||o===e.viewport?.id)&&i[n]?.(e,t)}}_setWidgets(e){let t={};for(let n of this.resolvedWidgets)t[n.id]=n;this.resolvedWidgets.length=0;for(let n of this.defaultWidgets)t[n.id]=null,this.resolvedWidgets.push(n);for(let n of e){let i=t[n.id];i?i.viewId!==n.viewId||i.placement!==n.placement?(this._removeWidget(i),this._addWidget(n)):n!==i&&(i.setProps(n.props),n=i):this._addWidget(n),t[n.id]=null,this.resolvedWidgets.push(n)}for(let n in t){let i=t[n];i&&this._removeWidget(i)}this.widgets=e}_addWidget(e){let{viewId:t=null,placement:n=NO}=e,i=e.props._container??t;e.widgetManager=this,e.deck=this.deck,e.rootElement=e._onAdd({deck:this.deck,viewId:t}),e.rootElement&&this._getContainer(i,n).append(e.rootElement),e.updateHTML()}_removeWidget(e){e.onRemove?.(),e.rootElement&&e.rootElement.remove(),e.rootElement=void 0,e.deck=void 0,e.widgetManager=void 0}_getContainer(e,t){if(e&&typeof e!="string")return e;let n=e||Vv,i=this.containers[n];i||(i=document.createElement("div"),i.style.pointerEvents="none",i.style.position="absolute",i.style.overflow="hidden",this.parentElement?.append(i),this.containers[n]=i);let o=i.querySelector(`.${t}`);return o||(o=globalThis.document.createElement("div"),o.className=t,o.style.position="absolute",o.style.zIndex="2",Object.assign(o.style,kO[t]),i.append(o)),o}_updateContainers(){for(let e in this.containers){let t=this.lastViewports[e]||null,n=e===Vv||t,i=this.containers[e];if(n){let o=this._getContainerBounds(t);i.style.display="block",i.style.left=`${o.x}px`,i.style.top=`${o.y}px`,i.style.width=`${o.width}px`,i.style.height=`${o.height}px`}else i.style.display="none"}}_getContainerBounds(e){if(!e)return{x:0,y:0,width:this.parentElement?.clientWidth||this.deck.width,height:this.parentElement?.clientHeight||this.deck.height};let t=this.getCanvasBounds(e);return{x:t.x+e.x,y:t.y+e.y,width:e.width,height:e.height}}};function Ip(r,e){e&&Object.entries(e).map(([t,n])=>{t.startsWith("--")?r.style.setProperty(t,n):r.style[t]=n})}function Wv(r,e){e&&Object.keys(e).map(t=>{t.startsWith("--")?r.style.removeProperty(t):r.style[t]=""})}var Ei=class{constructor(e){this.viewId=null,this.props={...this.constructor.defaultProps,...e},this.id=this.props.id}setProps(e){let t=this.props,n=this.rootElement;n&&t.className!==e.className&&(t.className&&n.classList.remove(t.className),e.className&&n.classList.add(e.className)),n&&!J(t.style,e.style,1)&&(Wv(n,t.style),Ip(n,e.style)),Object.assign(this.props,e),this.updateHTML()}updateHTML(){this.rootElement&&this.onRenderHTML(this.rootElement)}get viewIds(){return this.viewId?[this.viewId]:this.deck?.getViews().map(e=>e.id)??[]}getViewState(e){return this.deck?.viewManager?.getViewState(e)||{}}setViewState(e,t){this.deck?._onViewStateChange({viewId:e,viewState:t,interactionState:{}})}onCreateRootElement(){let e=["deck-widget",this.className,this.props.className],t=document.createElement("div");return e.filter(n=>typeof n=="string"&&n.length>0).forEach(n=>t.classList.add(n)),Ip(t,this.props.style),t}_onAdd(e){return this.onAdd(e)??this.onCreateRootElement()}onAdd(e){}onRemove(){}onViewportChange(e){}onRedraw(e){}onHover(e,t){}onClick(e,t){}onDrag(e,t){}onDragStart(e,t){}onDragEnd(e,t){}};Ei.defaultProps={id:"widget",style:{},_container:null,className:""};var FO={zIndex:"1",position:"absolute",pointerEvents:"none",color:"#a0a7b4",backgroundColor:"#29323c",padding:"10px",top:"0",left:"0",display:"none"},Ss=class extends Ei{constructor(e={}){super(e),this.id="default-tooltip",this.placement="fill",this.className="deck-tooltip",this.isVisible=!1,this.setProps(e)}onCreateRootElement(){let e=document.createElement("div");return e.className=this.className,Object.assign(e.style,FO),e}onRenderHTML(e){}onViewportChange(e){this.isVisible&&e.id===this.lastViewport?.id&&!e.equals(this.lastViewport)&&this.setTooltip(null),this.lastViewport=e}onHover(e){let{deck:t}=this,n=t&&t.props.getTooltip;if(!n)return;let i=n(e),o=this.widgetManager?.getCanvasBounds(e.viewport),s=e.x+(o?.x||0),a=e.y+(o?.y||0);this.setTooltip(i,s,a)}setTooltip(e,t,n){let i=this.rootElement;if(i){if(typeof e=="string")i.innerText=e;else if(e)e.text&&(i.innerText=e.text),e.html&&(i.innerHTML=e.html),e.className&&(i.className=e.className);else{this.isVisible=!1,i.style.display="none";return}this.isVisible=!0,i.style.display="block",i.style.transform=`translate(${t}px, ${n}px)`,e&&typeof e=="object"&&"style"in e&&Object.assign(i.style,e.style)}}};Ss.defaultProps={...Ei.defaultProps};var Ts=class{constructor(e){this.targets={},this.order=[],this.eventManagers={},this._eventRootToCanvasId=new WeakMap,this._createEventManager=e.createEventManager,this._getEventRoot=e.getEventRoot}finalize(){for(let e of Object.values(this.targets))e.eventManager.destroy(),e.presentationContext.destroy();this.targets={},this.order=[],this.eventManagers={},this._eventRootToCanvasId=new WeakMap}syncCanvasEntries(e){let t=this._normalizeCanvasList(e.canvases),n={},i=[],o=new Map;for(let{canvas:a}of t){let c=this._getEventRoot(a);o.set(c,(o.get(c)||0)+1)}for(let{id:a,canvas:c}of t){let l=this._getEventRoot(c),u=o.get(l)===1?l:c,f=this.targets[a];if(!f||f.device!==e.device||f.canvas!==c||f.eventRoot!==u){f?.eventManager.destroy(),f?.presentationContext.destroy();let d=e.device.createPresentationContext({id:a,canvas:c,useDevicePixels:e.useDevicePixels,autoResize:!0});f={id:a,device:e.device,canvas:c,eventRoot:u,presentationContext:d,eventManager:this._createEventManager(u)}}this._eventRootToCanvasId.set(u,a),this._eventRootToCanvasId.set(c,a),n[a]=f,i.push(a)}for(let[a,c]of Object.entries(this.targets))n[a]||(c.eventManager.destroy(),c.presentationContext.destroy());this.targets=n,this.order=i;let s=Object.fromEntries(Object.entries(n).map(([a,c])=>[a,c.eventManager]));this._haveSameEventManagers(s)||(this.eventManagers=s)}getCanvasIdFromEvent(e){return e?this._eventRootToCanvasId.get(e):void 0}getTarget(e){return this.targets[e||this.order[0]||Sr]||null}_normalizeCanvasList(e=[]){let t=new Set;return e.map((n,i)=>{let o,s;return typeof n=="string"?(o=document.getElementById(n),U(o,`Canvas with id ${n} not found`),s=n):(o=n,s=o.id||`deckgl-canvas-${i}`),U(!t.has(s),`Duplicate canvas id ${s}`),t.add(s),{id:s,canvas:o}})}_haveSameEventManagers(e){let t=Object.keys(e),n=Object.keys(this.eventManagers);return t.length===n.length&&t.every(i=>e[i]===this.eventManagers[i])}};I();Yl();K();K();eo();function Jt(){}var ZB=({isDragging:r})=>r?"grabbing":"grab",pE={id:"",width:"100%",height:"100%",style:null,viewState:null,initialViewState:null,pickingRadius:0,pickAsync:"auto",layerFilter:null,parameters:{},parent:null,device:null,deviceProps:{},gl:null,canvas:null,_canvases:null,layers:[],effects:[],views:null,controller:null,useDevicePixels:!0,touchAction:"none",eventRecognizerOptions:{},_framebuffer:null,_animate:!1,_pickable:!0,_typedArrayManagerProps:{},_customRender:null,widgets:[],onDeviceInitialized:Jt,onWebGLInitialized:Jt,onResize:Jt,onViewStateChange:Jt,onInteractionStateChange:Jt,onBeforeRender:Jt,onAfterRender:Jt,onLoad:Jt,onError:r=>F.error(r.message,r.cause)(),onHover:null,onClick:null,onDragStart:null,onDrag:null,onDragEnd:null,_onMetrics:null,getCursor:ZB,getTooltip:null,debug:!1,drawPickingColors:!1},Fs=class{constructor(e){this.width=0,this.height=0,this.userData={},this.device=null,this.canvas=null,this.viewManager=null,this.layerManager=null,this.effectManager=null,this.deckRenderer=null,this.deckPicker=null,this.eventManager=null,this.eventManagers={},this.widgetManager=null,this.tooltip=null,this.animationLoop=null,this._canvasContext=null,this._deviceResizeHandler=null,this.cursorState={isHovering:!1,isDragging:!1},this.stats=new Ye({id:"deck.gl"}),this.metrics={fps:0,setPropsTime:0,layersCount:0,drawLayersCount:0,updateLayersCount:0,updateAttributesCount:0,updateAttributesTime:0,framesRedrawn:0,pickTime:0,pickCount:0,pickLayersCount:0,gpuTime:0,gpuTimePerFrame:0,cpuTime:0,cpuTimePerFrame:0,bufferMemory:0,textureMemory:0,renderbufferMemory:0,gpuMemory:0},this._metricsCounter=0,this._hoverPickSequence=0,this._pointerDownPickSequence=0,this._needsRedraw="Initial render",this._canvasManager=new Ts({createEventManager:i=>this._createEventManager(i),getEventRoot:i=>this._getEventRoot(i)}),this._ownedCanvas=null,this._pickRequest={mode:"hover",x:-1,y:-1,radius:0,canvasId:void 0,event:null,unproject3D:!1},this._lastPointerDownInfo=null,this._lastPointerDownInfoPromise=null,this._onPointerMove=i=>{let{_pickRequest:o}=this,s=this._getCanvasIdFromEvent(i);if(i.type==="pointerleave")o.x=-1,o.y=-1,o.radius=0,o.canvasId=s;else{if(i.leftButton||i.rightButton)return;{let a=i.offsetCenter;if(!a)return;o.x=a.x,o.y=a.y,o.radius=this.props.pickingRadius,o.canvasId=s}}this.layerManager&&(this.layerManager.context.mousePosition={x:o.x,y:o.y}),o.event=i},this._onEvent=i=>{let o=ci[i.type],s=i.offsetCenter,a=this._getCanvasIdFromEvent(i);if(!o||!s||!this.layerManager)return;let c=this.layerManager.getLayers(),l=this._getInternalPickingMode();if(!l)return;if(l==="sync"){let f=i.type==="click"&&this._shouldUnproject3D(c)?this._getFirstPickedInfo(this._pickPointSync(this._getPointPickOptions(s.x,s.y,{unproject3D:!0,canvasId:a},c))):this._getLastPointerDownPickingInfo(s.x,s.y,a,c);this._dispatchPickingEvent(f,i);return}(this._lastPointerDownInfoPromise||Promise.resolve(this._getLastPointerDownPickingInfo(s.x,s.y,a,c))).then(f=>{this._dispatchPickingEvent(f,i)}).catch(f=>this.props.onError?.(f))},this._onPointerDown=i=>{let o=i.offsetCenter,s=this._getCanvasIdFromEvent(i);if(!o)return;let a=this._getInternalPickingMode();if(!a)return;let c=this.layerManager?.getLayers()||[],l=++this._pointerDownPickSequence;if(a==="sync"){let f=this._pickPointSync({x:o.x,y:o.y,canvasId:s,radius:this.props.pickingRadius}),d=this._getFirstPickedInfo(f);this._lastPointerDownInfo=d,this._lastPointerDownInfoPromise=Promise.resolve(d);return}let u=this._pickPointAsync(this._getPointPickOptions(o.x,o.y,{canvasId:s},c)).then(f=>this._getFirstPickedInfo(f)).then(f=>(l===this._pointerDownPickSequence&&(this._lastPointerDownInfo=f),f)).catch(f=>{this.props.onError?.(f);let d=this.deckPicker&&this.viewManager?this._getLastPointerDownPickingInfo(o.x,o.y,s,c):{};return l===this._pointerDownPickSequence&&(this._lastPointerDownInfo=d),d});this._lastPointerDownInfo=null,this._lastPointerDownInfoPromise=u};let t=e;this.props={...pE,...e},e=this.props,this._validateCanvasConfiguration(e),e.viewState&&e.initialViewState&&F.warn("View state tracking is disabled. Use either `initialViewState` for auto update or `viewState` for manual update.")(),this.viewState=this.props.initialViewState,e.device&&(this.device=e.device,this._setDeviceCanvasContext(e.device));let n=this.device;!n&&e.gl&&(e.gl instanceof WebGLRenderingContext&&F.error("WebGL1 context not supported.")(),n=Ns.attach(e.gl,{_cacheShaders:!0,_cachePipelines:!0,...this.props.deviceProps})),n||(n=this._createDevice(e)),this.animationLoop=this._createAnimationLoop(n,e),this.setProps(t),e._typedArrayManagerProps&&st.setOptions(e._typedArrayManagerProps),this.animationLoop.start()}finalize(){this._restoreDeviceResizeHandler(),this.animationLoop?.stop(),this.animationLoop?.destroy(),this.animationLoop=null,this._hoverPickSequence++,this._pointerDownPickSequence++,this._lastPointerDownInfo=null,this._lastPointerDownInfoPromise=null,this.layerManager?.finalize(),this.layerManager=null,this.viewManager?.finalize(),this.viewManager=null,this.effectManager?.finalize(),this.effectManager=null,this.deckRenderer?.finalize(),this.deckRenderer=null,this.deckPicker?.finalize(),this.deckPicker=null,Object.keys(this._canvasManager.targets).length||this.eventManager?.destroy(),this.eventManager=null,this.eventManagers={},this.widgetManager?.finalize(),this.widgetManager=null,this._canvasManager.finalize(),this._isMultiCanvasMode()?this.canvas=null:this.canvas&&this.canvas===this._ownedCanvas&&(this.canvas.parentElement?.removeChild(this.canvas),this.canvas=null,this._ownedCanvas=null),this._canvasContext=null}setProps(e){this.stats.get("setProps Time").timeStart(),"onLayerHover"in e&&F.removed("onLayerHover","onHover")(),"onLayerClick"in e&&F.removed("onLayerClick","onClick")(),e.initialViewState&&!J(this.props.initialViewState,e.initialViewState,3)&&(this.viewState=e.initialViewState),U(!("_canvases"in e)||Array.isArray(e._canvases)===this._isMultiCanvasMode()),Object.assign(this.props,e),this._validateCanvasConfiguration(this.props),this._validateInternalPickingMode(),this.device&&this._isMultiCanvasMode()&&this._syncCanvasTargets(),this._setCanvasSize(this.props);let t=Object.create(this.props);if(Object.assign(t,{views:this._getViews(),width:this.width,height:this.height,viewState:this._getViewState(),eventManagers:this.eventManagers}),e.device&&e.device.id!==this.device?.id){let n=e.device.getDefaultCanvasContext();this.animationLoop?.stop(),!this._isMultiCanvasMode()&&this.canvas!==n.canvas&&(this.canvas?.remove(),this.eventManager?.destroy(),this.canvas=null),this._setDeviceCanvasContext(e.device),F.log(`recreating animation loop for new device! id=${e.device.id}`)(),this.animationLoop=this._createAnimationLoop(e.device,e),this.animationLoop.start()}if(this.animationLoop?.setProps(t),e.useDevicePixels!==void 0&&this._canvasContext?.setProps){this._canvasContext.setProps({useDevicePixels:e.useDevicePixels});for(let n of Object.values(this._canvasManager.targets))n.presentationContext.setProps({useDevicePixels:e.useDevicePixels})}this.layerManager&&(this.viewManager.setProps(t),this.layerManager.activateViewport(this.getViewports()[0]),this.layerManager.setProps(t),this.effectManager.setProps(t),this.deckRenderer.setProps(t),this.deckPicker.setProps(t),this.widgetManager.setProps(t)),this.stats.get("setProps Time").timeEnd()}needsRedraw(e={clearRedrawFlags:!1}){if(!this.layerManager)return!1;if(this.props._animate)return"Deck._animate";let t=this._needsRedraw;e.clearRedrawFlags&&(this._needsRedraw=!1);let n=this.viewManager.needsRedraw(e),i=this.layerManager.needsRedraw(e),o=this.effectManager.needsRedraw(e),s=this.deckRenderer.needsRedraw(e);return t=t||n||i||o||s,t}redraw(e){if(!this.layerManager)return;let t=this.needsRedraw({clearRedrawFlags:!0});t=e||t,t&&(this.stats.get("Redraw Count").incrementCount(),this.props._customRender?this.props._customRender(t):this._drawLayers(t))}get isInitialized(){return this.viewManager!==null}getViews(){return U(this.viewManager),this.viewManager.views}getView(e){return U(this.viewManager),this.viewManager.getView(e)}getViewports(e){return U(this.viewManager),this.viewManager.getViewports(e)}getCanvas(){return this.canvas}getCanvasContext(e){let t=e?this.viewManager?.getView(e)?.props.canvasId:void 0;return this._getCanvasContext(t)}getEventManager(e){if(!e||!this.viewManager)return this.eventManager;let t=this.viewManager.getCanvasId(e)||Sr;return this.eventManagers[t]||this.eventManager}async pickObjectAsync(e){let t=(await this._pickAsync("pickObjectAsync","pickObject Time",e)).result;return t.length?t[0]:null}async pickObjectsAsync(e){return await this._pickAsync("pickObjectsAsync","pickObjects Time",e)}pickObject(e){let t=this._pick("pickObject","pickObject Time",e).result;return t.length?t[0]:null}pickMultipleObjects(e){return e.depth=e.depth||10,this._pick("pickObject","pickMultipleObjects Time",e).result}pickObjects(e){return this._pick("pickObjects","pickObjects Time",e)}_pickPositionForController(e,t,n){return this._getInternalPickingMode()!=="sync"?null:this.pickObject({x:e,y:t,radius:0,unproject3D:!0,canvasId:n?this.viewManager?.getCanvasId(n):void 0})}_addResources(e,t=!1){for(let n in e)this.layerManager.resourceManager.add({resourceId:n,data:e[n],forceUpdate:t})}_removeResources(e){for(let t of e)this.layerManager.resourceManager.remove(t)}_addDefaultEffect(e){this.effectManager.addDefaultEffect(e)}_addDefaultShaderModule(e){this.layerManager.addDefaultShaderModule(e)}_removeDefaultShaderModule(e){this.layerManager?.removeDefaultShaderModule(e)}_resolveInternalPickingMode(){let{pickAsync:e}=this.props,t=this.device?.type||this.props.deviceProps?.type;if(e==="auto")return t==="webgpu"?"async":"sync";if(e==="sync"&&t==="webgpu")throw new Error('`pickAsync: "sync"` is not supported when Deck is using a WebGPU device.');return e}_getInternalPickingMode(){try{return this._resolveInternalPickingMode()}catch(e){return this.props.onError?.(e),null}}_validateInternalPickingMode(){this._getInternalPickingMode()}_getFirstPickedInfo({result:e,emptyInfo:t}){return e[0]||t}_shouldUnproject3D(e=this.layerManager?.getLayers()||[]){return e.some(t=>t.props.pickable==="3d")}_getPointPickOptions(e,t,n={},i=this.layerManager?.getLayers()||[]){return{x:e,y:t,canvasId:n.canvasId,radius:this.props.pickingRadius,unproject3D:this._shouldUnproject3D(i),...n}}_pickPointSync(e){return this._pick("pickObject","pickObject Time",e)}_pickPointAsync(e){return this._pickAsync("pickObjectAsync","pickObject Time",e)}_getLastPointerDownPickingInfo(e,t,n,i=this.layerManager?.getLayers()||[]){return this.deckPicker.getLastPickedObject({x:e,y:t,layers:i,viewports:this.getViewports({x:e,y:t,canvasId:n})},this._lastPointerDownInfo)}_applyHoverCallbacks({result:e,emptyInfo:t},n){if(!this.widgetManager)return;this.cursorState.isHovering=e.length>0;let i=t,o=!1;for(let s of e)i=s,o=s.layer?.onHover(s,n)||o;o||(this.props.onHover?.(i,n),this.widgetManager.onHover(i,n))}_dispatchPickingEvent(e,t){if(!this.layerManager||!this.widgetManager)return;let n=ci[t.type];if(!n)return;let{layer:i}=e,o=i&&(i[n]||i.props[n]),s=this.props[n],a=!1;o&&(a=o.call(i,e,t)),a||(s?.(e,t),this.widgetManager.onEvent(e,t))}_pickAsync(e,t,n){U(this.deckPicker);let{stats:i}=this,o=this._isMultiCanvasMode()?n.canvasId||this._getDefaultCanvasId():n.canvasId,s=this._getCanvasContext(o)||void 0;i.get("Pick Count").incrementCount(),i.get(t).timeStart(),this._resizeForCanvasTarget(o);let a=this.deckPicker[e]({layers:this.layerManager.getLayers(n),views:this.viewManager.getViews(),viewports:this.getViewports({...n,canvasId:o}),onViewportActive:this.layerManager.activateViewport,effects:this.effectManager.getEffects(),...n,canvasId:o,canvasContext:s});return i.get(t).timeEnd(),a}_pick(e,t,n){U(this.deckPicker);let{stats:i}=this,o=this._isMultiCanvasMode()?n.canvasId||this._getDefaultCanvasId():n.canvasId,s=this._getCanvasContext(o)||void 0;i.get("Pick Count").incrementCount(),i.get(t).timeStart(),this._resizeForCanvasTarget(o);let a=this.deckPicker[e]({layers:this.layerManager.getLayers(n),views:this.viewManager.getViews(),viewports:this.getViewports({...n,canvasId:o}),onViewportActive:this.layerManager.activateViewport,effects:this.effectManager.getEffects(),...n,canvasId:o,canvasContext:s});return i.get(t).timeEnd(),a}_createCanvas(e){let t=e.canvas;return typeof t=="string"&&(t=document.getElementById(t),U(t)),t?this._ownedCanvas=null:(t=document.createElement("canvas"),t.id=e.id||"deckgl-overlay",e.width&&typeof e.width=="number"&&(t.width=e.width),e.height&&typeof e.height=="number"&&(t.height=e.height),(e.parent||document.body).appendChild(t),this._ownedCanvas=t),Object.assign(t.style,e.style),t}_isMultiCanvasMode(){return Array.isArray(this.props._canvases)}_getDefaultCanvasId(){return this._canvasManager.order[0]||Sr}_validateCanvasConfiguration(e){Array.isArray(e._canvases)&&(U(!e.canvas),U(!e.gl),U(!e.device?.canvasContext||e.device.getDefaultCanvasContext().offscreenCanvas))}_createEventManager(e){let t=new Qo(e,{touchAction:this.props.touchAction,recognizers:Object.keys(tp).map(n=>{let[i,o,s,a]=tp[n],c=this.props.eventRecognizerOptions?.[n],l={...o,...c,event:n};return{recognizer:new i(l),recognizeWith:s,requireFailure:a}}),events:{pointerdown:this._onPointerDown,pointermove:this._onPointerMove,pointerleave:this._onPointerMove}});for(let n in ci)n==="dblclick"?t.watch(n,this._onEvent):t.on(n,this._onEvent);return t}_getEventRoot(e){return e.closest(".deck-events-root")||this.props.parent?.querySelector(".deck-events-root")||e}_syncCanvasTargets(){if(!this.device||!this._isMultiCanvasMode())return;this._canvasManager.syncCanvasEntries({device:this.device,canvases:this.props._canvases||[],useDevicePixels:this.props.useDevicePixels}),this.eventManagers=this._canvasManager.eventManagers;let e=this._getDefaultCanvasId();this.eventManager=this.eventManagers[e]||null,this.canvas=this._canvasManager.targets[e]?.canvas||null}_setCanvasContext(e){this._canvasContext=e,"style"in e.canvas&&(this.canvas=e.canvas)}_setDeviceCanvasContext(e,t={}){let n=e.getDefaultCanvasContext();this._setCanvasContext(n),this._setDeviceResizeHandler(e,t)}_setDeviceResizeHandler(e,t={}){let n=!!t.syncDrawingBuffer;if(this._deviceResizeHandler?.device===e){this._deviceResizeHandler.syncDrawingBuffer=n;return}this._restoreDeviceResizeHandler();let i=o=>{this._isMultiCanvasMode()?this._updateMultiCanvasDimensions():o===this._canvasContext&&this._canvasContext&&this._onCanvasContextResize(this._canvasContext,{syncDrawingBuffer:this._deviceResizeHandler?.syncDrawingBuffer})};e.props.onResize=i,this._deviceResizeHandler={device:e,onResize:i,syncDrawingBuffer:n}}_restoreDeviceResizeHandler(){let e=this._deviceResizeHandler;e&&e.device.props?.onResize===e.onResize&&(e.device.props.onResize=Jt),this._deviceResizeHandler=null}_setCanvasSize(e){if(this._isMultiCanvasMode()||!this.canvas)return;let{width:t,height:n}=e;if(t||t===0){let i=Number.isFinite(t)?`${t}px`:t;this.canvas.style.width=i}if(n||n===0){let i=Number.isFinite(n)?`${n}px`:n;this.canvas.style.position=e.style?.position||"absolute",this.canvas.style.height=i}}_getCanvasIdFromEvent(e){return this._canvasManager.getCanvasIdFromEvent(e?.rootElement)}_getCanvasContext(e){return this._canvasManager.getTarget(e)?.presentationContext||this._canvasContext}_resizeForCanvasTarget(e){let t=this._canvasManager.getTarget(e);if(!t||!this.device?.canvasContext)return;let[n,i]=t.presentationContext.getDrawingBufferSize();this.device.canvasContext.setDrawingBufferSize(n,i)}_createDeviceCanvas(e){if(this._isMultiCanvasMode()){let t=globalThis.OffscreenCanvas;if(!t)throw new Error("`_canvases` requires OffscreenCanvas support.");let n=typeof e.width=="number"&&Number.isFinite(e.width)?e.width:1,i=typeof e.height=="number"&&Number.isFinite(e.height)?e.height:1;return new t(n,i)}return this._createCanvas(e)}_updateCanvasSize(e=this._canvasContext){if(this._isMultiCanvasMode()){this._updateMultiCanvasDimensions();return}let{canvas:t}=this,[n,i]=e?e.getCSSSize():[t?.clientWidth??t?.width??0,t?.clientHeight??t?.height??0];(n!==this.width||i!==this.height)&&(this.width=n,this.height=i,this.viewManager?.setProps({width:n,height:i}),this.layerManager?.activateViewport(this.getViewports()[0]),this.props.onResize({width:n,height:i},e||void 0))}_onCanvasContextResize(e,t={}){if(t.syncDrawingBuffer){let{width:n,height:i}=e.canvas;e.setDrawingBufferSize(n,i)}this._needsRedraw="Canvas resized",this._updateCanvasSize(e)}_updateMultiCanvasDimensions(){let[e,t]=this._getCanvasContext()?.getCSSSize()||[0,0];(e!==this.width||t!==this.height)&&(this.width=e,this.height=t,this.props.onResize({width:e,height:t})),this._needsRedraw="Canvas resized",this.viewManager?.setNeedsUpdate("Canvas resized"),this.viewManager?.setProps({width:this.width,height:this.height})}_createAnimationLoop(e,t){let{gl:n,onError:i}=t;return new as({device:e,autoResizeDrawingBuffer:!n&&!Array.isArray(t._canvases),autoResizeViewport:!1,onInitialize:o=>this._setDevice(o.device),onRender:this._onRenderFrame.bind(this),onError:i})}_createDevice(e){let t=this.props.deviceProps?.createCanvasContext,n=typeof t=="object"?t:void 0,i={adapters:[],_cacheShaders:!0,_cachePipelines:!0,...e.deviceProps};i.adapters.includes(Ns)||i.adapters.push(Ns);let o={alphaMode:this.props.deviceProps?.type==="webgpu"?"premultiplied":void 0};return $n.createDevice({_reuseDevices:!0,type:"webgl",...i,createCanvasContext:{...o,...n,canvas:this._createDeviceCanvas(e),useDevicePixels:this.props.useDevicePixels,autoResize:!0}})}_getViewState(){return this.props.viewState||this.viewState}_getViews(){let{views:e}=this.props,t=Array.isArray(e)?e:e?[e]:[new xs({id:"default-view"})];return t.length&&this.props.controller&&(t[0]=t[0].clone({controller:this.props.controller})),t}_onContextLost(){let{onError:e}=this.props;this.animationLoop&&e&&e(new Error("WebGL context is lost"))}_pickAndCallback(){let{_pickRequest:e}=this;if(e.event){let t=e.event,n=this.layerManager?.getLayers()||[],i=this._getPointPickOptions(e.x,e.y,{canvasId:e.canvasId,radius:e.radius,mode:e.mode},n),o=this._getInternalPickingMode(),s=++this._hoverPickSequence;if(e.event=null,e.canvasId=void 0,!o)return;if(o==="sync"){this._applyHoverCallbacks(this._pickPointSync(i),t);return}this._pickPointAsync(i).then(({result:a,emptyInfo:c})=>{s===this._hoverPickSequence&&this._applyHoverCallbacks({result:a,emptyInfo:c},t)}).catch(a=>this.props.onError?.(a))}}_updateCursor(){let e=this.props.getCursor(this.cursorState);if(this._isMultiCanvasMode()){for(let n of Object.values(this._canvasManager.targets))n.canvas.style.cursor=e;return}let t=this.props.parent||this.canvas;t&&(t.style.cursor=e)}_setDevice(e){if(this.device=e,this._validateInternalPickingMode(),!this.animationLoop)return;this._setDeviceCanvasContext(e,{syncDrawingBuffer:!!(this.props.gl&&this.props.device!==e)}),this._isMultiCanvasMode()?this._syncCanvasTargets():this.canvas&&!this.canvas.isConnected&&this.props.parent&&this.props.parent.insertBefore(this.canvas,this.props.parent.firstChild),this.device.type==="webgl"&&this.device.setParametersWebGL({blend:!0,blendFunc:[770,771,1,771],polygonOffsetFill:!0,depthTest:!0,depthFunc:515}),this.props.onDeviceInitialized(this.device),this.device.type==="webgl"&&this.props.onWebGLInitialized(this.device.gl);let t=new gn;if(t.play(),this.animationLoop.attachTimeline(t),!this._isMultiCanvasMode()){let o=this.canvas&&this._getEventRoot(this.canvas);U(o),this.eventManager=this._createEventManager(o),this.eventManagers={[Sr]:this.eventManager}}this.viewManager=new ps({timeline:t,eventManager:this.eventManager,eventManagers:this.eventManagers,getCanvasContext:this._isMultiCanvasMode()?this.getCanvasContext.bind(this):void 0,onViewStateChange:this._onViewStateChange.bind(this),onInteractionStateChange:this._onInteractionStateChange.bind(this),pickPosition:this._pickPositionForController.bind(this),views:this._getViews(),viewState:this._getViewState(),width:this.width,height:this.height});let n=this.viewManager.getViewports()[0];this.layerManager=new hs(this.device,{deck:this,stats:this.stats,viewport:n,timeline:t}),this.effectManager=new vs({deck:this,device:this.device}),this.deckRenderer=new Es(this.device,{stats:this.stats}),this.deckPicker=new Ps(this.device,{stats:this.stats});let i=this.props.parent?.querySelector(".deck-widgets-root")||(this._isMultiCanvasMode()?this.props.parent||this.canvas?.parentElement:null)||this.canvas?.parentElement;this.widgetManager=new ml({deck:this,parentElement:i}),this.widgetManager.addDefault(new Ss),this.setProps({}),this._updateCanvasSize(this._canvasContext),this.props.onLoad()}_drawLayers(e,t){let{device:n,gl:i}=this.layerManager.context;this.props.onBeforeRender({device:n,gl:i});let o={target:this.props._framebuffer,layers:this.layerManager.getLayers(),viewports:this.viewManager.getViewports(),onViewportActive:this.layerManager.activateViewport,views:this.viewManager.getViews(),pass:"screen",effects:this.effectManager.getEffects(),...t};if(this._isMultiCanvasMode()&&o.pass==="screen"&&!o.target&&this._canvasManager.order.length)for(let s of this._canvasManager.order){let a=o.viewports.filter(u=>this.viewManager.getCanvasId(u.id)===s);if(!a.length){let u=this._canvasManager.targets[s];this._resizeForCanvasTarget(s),this.deckRenderer?.renderLayers({...o,canvasContext:u.presentationContext,target:u.presentationContext.getCurrentFramebuffer(),viewports:[],clearCanvas:!0}),u.presentationContext.present();continue}let c=this._canvasManager.targets[s];this._resizeForCanvasTarget(s);let l=c.presentationContext.getCurrentFramebuffer();this.deckRenderer?.renderLayers({...o,canvasContext:c.presentationContext,target:l,viewports:a}),c.presentationContext.present()}else this.deckRenderer?.renderLayers(o);o.pass==="screen"&&this.widgetManager.onRedraw({viewports:o.viewports,layers:o.layers}),this.props.onAfterRender({device:n,gl:i})}_onRenderFrame(){this._getFrameStats(),this._metricsCounter++%60===0&&(this._getMetrics(),this.stats.reset(),F.table(4,this.metrics)(),this.props._onMetrics&&this.props._onMetrics(this.metrics)),this._updateCursor(),this.layerManager.updateLayers(),this._pickAndCallback(),this.redraw(),this.viewManager&&this.viewManager.updateViewStates()}_onViewStateChange(e){let t=this.props.onViewStateChange(e)||e.viewState;this.viewState&&(this.viewState={...this.viewState,[e.viewId]:t},this.props.viewState||this.viewManager&&this.viewManager.setProps({viewState:this.viewState}))}_onInteractionStateChange(e){this.cursorState.isDragging=e.isDragging||!1,this.props.onInteractionStateChange(e)}_getFrameStats(){let{stats:e}=this;e.get("frameRate").timeEnd(),e.get("frameRate").timeStart();let t=this.animationLoop.stats;e.get("GPU Time").addTime(t.get("GPU Time").lastTiming),e.get("CPU Time").addTime(t.get("CPU Time").lastTiming)}_getMetrics(){let{metrics:e,stats:t}=this;e.fps=t.get("frameRate").getHz(),e.setPropsTime=t.get("setProps Time").time,e.updateAttributesTime=t.get("Update Attributes").time,e.framesRedrawn=t.get("Redraw Count").count,e.pickTime=t.get("pickObject Time").time+t.get("pickMultipleObjects Time").time+t.get("pickObjects Time").time,e.pickCount=t.get("Pick Count").count,e.layersCount=this.layerManager?.layers.length??0,e.drawLayersCount=t.get("Layers rendered").lastSampleCount,e.pickLayersCount=t.get("Layers picked").lastSampleCount,e.updateLayersCount=t.get("Layer updates").count,e.updateAttributesCount=t.get("Attributes updated").count,e.gpuTime=t.get("GPU Time").time,e.cpuTime=t.get("CPU Time").time,e.gpuTimePerFrame=t.get("GPU Time").getAverageTime(),e.cpuTimePerFrame=t.get("CPU Time").getAverageTime();let n=$n.stats.get("GPU Time and Memory");e.bufferMemory=n.get("Buffer Memory").count,e.textureMemory=n.get("Texture Memory").count,e.renderbufferMemory=n.get("Renderbuffer Memory").count,e.gpuMemory=n.get("GPU Memory").count}};Fs.defaultProps=pE;Fs.VERSION=E_;var Kl=Fs;I();I();function mE(r){switch(r){case"float64":return Float64Array;case"uint8":case"unorm8":return Uint8ClampedArray;default:return Ur(r)}}var gE=de.getDataType.bind(de);function Us(r,e,t){if(e.size>4)return null;let n=t==="webgpu"&&e.type==="uint8"?"unorm8":e.type,i=e.size,o=!!(t!=="webgpu"&&i===3&&n&&["uint8","sint8","unorm8","snorm8","uint16","sint16","unorm16","snorm16"].includes(n));return{attribute:r,format:i>1?`${n}x${i}${o?"-webgl":""}`:e.type,byteOffset:e.offset||0}}function Je(r){return r.stride||r.size*r.bytesPerElement}function _E(r,e){return r.type===e.type&&r.size===e.size&&Je(r)===Je(e)&&(r.offset||0)===(e.offset||0)}function sm(r,e){e.offset&&F.removed("shaderAttribute.offset","vertexOffset, elementOffset")();let t=Je(r),n=e.vertexOffset!==void 0?e.vertexOffset:r.vertexOffset||0,i=e.elementOffset||0,o=n*t+i*r.bytesPerElement+(r.offset||0);return{...e,offset:o,stride:t}}function XB(r,e){let t=sm(r,e);return{high:t,low:{...t,offset:t.offset+r.size*4}}}var Gs=class{constructor(e,t,n){this._buffer=null,this.device=e,this.id=t.id||"",this.size=t.size||1;let i=t.logicalType||t.type,o=i==="float64",{defaultValue:s}=t;s=Number.isFinite(s)?[s]:s||new Array(this.size).fill(0);let a;o?a="float32":!i&&t.isIndexed?a="uint32":a=i||"float32";let c=mE(i||a);this.doublePrecision=o,o&&t.fp64===!1&&(c=Float32Array),this.value=null,this.settings={...t,defaultType:c,defaultValue:s,logicalType:i,type:a,normalized:a.includes("norm"),size:this.size,bytesPerElement:c.BYTES_PER_ELEMENT},this.state={...n,externalBuffer:null,bufferAccessor:this.settings,allocatedValue:null,numInstances:0,bounds:null,constant:!1}}get isConstant(){return this.state.constant}get buffer(){return this._buffer}get byteOffset(){let e=this.getAccessor();return e.vertexOffset?e.vertexOffset*Je(e):0}get numInstances(){return this.state.numInstances}set numInstances(e){this.state.numInstances=e}get isDoublePrecisionBuffer(){return this._shouldSplitDoublePrecisionValue(this.value)}delete(){this._buffer&&(this._buffer.delete(),this._buffer=null),st.release(this.state.allocatedValue),this.state.allocatedValue=null}getBuffer(){return this.state.constant&&this.device.type!=="webgpu"?null:this.state.externalBuffer||this._buffer}getValue(e=this.id,t=null){let n={};if(this.state.constant){let i=this.value;if(this.device.type==="webgpu"&&this._buffer)n[e]=this._buffer;else if(t){let o=sm(this.getAccessor(),t),s=o.offset/i.BYTES_PER_ELEMENT,a=o.size||this.size;n[e]=i.subarray(s,s+a)}else n[e]=i}else n[e]=this.getBuffer();return this.doublePrecision&&(this.isDoublePrecisionBuffer?n[`${e}64Low`]=n[e]:n[`${e}64Low`]=new Float32Array(this.size)),n}_getBufferLayout(e=this.id,t=null){let n=this.getAccessor(),i=[],o={name:this.id,byteStride:this.device.type==="webgpu"&&this.state.constant?0:Je(n)};if(this.doublePrecision){let s=XB(n,t||{});i.push(Us(e,{...n,...s.high},this.device.type),Us(`${e}64Low`,{...n,...s.low},this.device.type))}else if(t){let s=sm(n,t);i.push(Us(e,{...n,...s},this.device.type))}else i.push(Us(e,n,this.device.type));return o.attributes=i.filter(Boolean),o}setAccessor(e){this.state.bufferAccessor=e}getAccessor(){return this.state.bufferAccessor}getBounds(){if(this.state.bounds)return this.state.bounds;let e=null;if(this.state.constant&&this.value){let t=Array.from(this.value);e=[t,t]}else{let{value:t,numInstances:n,size:i}=this,o=n*i;if(t&&o&&t.length>=o){let s=new Array(i).fill(1/0),a=new Array(i).fill(-1/0);for(let c=0;c<o;)for(let l=0;l<i;l++){let u=t[c++];u<s[l]&&(s[l]=u),u>a[l]&&(a[l]=u)}e=[s,a]}}return this.state.bounds=e,e}setData(e){let{state:t}=this,n;ArrayBuffer.isView(e)?n={value:e}:e instanceof D?n={buffer:e}:n=e;let i={...this.settings,...n};if(ArrayBuffer.isView(n.value)){if(!n.type)if(this.doublePrecision&&n.value instanceof Float64Array)i.type="float32";else{let s=gE(n.value);i.type=i.normalized?s.replace("int","norm"):s}i.bytesPerElement=n.value.BYTES_PER_ELEMENT,i.stride=Je(i)}if(t.bounds=null,n.constant){let o=n.value;if(o=this._normalizeValue(o,[],0),this.settings.normalized&&(o=this.normalizeConstant(o)),!(!t.constant||!this._areValuesEqual(o,this.value)))return!1;t.externalBuffer=null,t.constant=!0,this.value=ArrayBuffer.isView(o)?o:new Float32Array(o)}else if(n.buffer){let o=n.buffer;t.externalBuffer=o,t.constant=!1,this.value=n.value||null}else if(n.value){this._checkExternalBuffer(n);let o=n.value,s=o;t.externalBuffer=null,t.constant=!1,this.value=o,this._shouldSplitDoublePrecisionValue(s)&&(s=pi(s,i),o instanceof Float32Array&&(i.stride=i.size*2*Float32Array.BYTES_PER_ELEMENT));let{buffer:a}=this,c=Je(i),l=(i.vertexOffset||0)*c;if(this.settings.isIndexed){let f=this.settings.defaultType;s.constructor!==f&&(s=new f(s))}let u=s.byteLength+l+c*2;(!a||a.byteLength<u)&&(a=this._createBuffer(u)),a.write(s,l)}return this.setAccessor(i),!0}updateSubBuffer(e={}){this.state.bounds=null;let t=this.value,{startOffset:n=0,endOffset:i}=e,o=this._shouldSplitDoublePrecisionValue(t);this.buffer.write(o?pi(t,{size:this.size,startIndex:n,endIndex:i}):t.subarray(n,i),n*(o?8:t.BYTES_PER_ELEMENT)+this.byteOffset)}allocate(e,t=!1){let{state:n}=this,i=n.allocatedValue,o=st.allocate(i,e+1,{size:this.size,type:this.settings.defaultType,copy:t});this.value=o;let s=this._shouldSplitDoublePrecisionValue(o),a=s&&o instanceof Float32Array?{...this.settings,stride:this.size*2*Float32Array.BYTES_PER_ELEMENT}:this.settings;this.setAccessor(a);let{byteOffset:c}=this,{buffer:l}=this,u=o.byteLength*(s&&o instanceof Float32Array?2:1);return(!l||l.byteLength<u+c)&&(l=this._createBuffer(u+c),t&&i&&l.write(this._shouldSplitDoublePrecisionValue(i)?pi(i,this):i,c)),n.allocatedValue=o,n.constant=!1,n.externalBuffer=null,!0}_shouldSplitDoublePrecisionValue(e){return!!(this.doublePrecision&&(e instanceof Float64Array||this.device.type==="webgpu"&&e instanceof Float32Array))}_checkExternalBuffer(e){let{value:t}=e;if(!ArrayBuffer.isView(t))throw new Error(`Attribute ${this.id} value is not TypedArray`);let n=this.settings.defaultType,i=!1;if(this.doublePrecision&&(i=t.BYTES_PER_ELEMENT<4),i)throw new Error(`Attribute ${this.id} does not support ${t.constructor.name}`);!(t instanceof n)&&this.settings.normalized&&!("normalized"in e)&&F.warn(`Attribute ${this.id} is normalized`)()}normalizeConstant(e){switch(this.settings.type){case"snorm8":return new Float32Array(e).map(t=>(t+128)/255*2-1);case"snorm16":return new Float32Array(e).map(t=>(t+32768)/65535*2-1);case"unorm8":return new Float32Array(e).map(t=>t/255);case"unorm16":return new Float32Array(e).map(t=>t/65535);default:return e}}_normalizeValue(e,t,n){let{defaultValue:i,size:o}=this.settings;if(Number.isFinite(e))return t[n]=e,t;if(!e){let s=o;for(;--s>=0;)t[n+s]=i[s];return t}switch(o){case 4:t[n+3]=Number.isFinite(e[3])?e[3]:i[3];case 3:t[n+2]=Number.isFinite(e[2])?e[2]:i[2];case 2:t[n+1]=Number.isFinite(e[1])?e[1]:i[1];case 1:t[n+0]=Number.isFinite(e[0])?e[0]:i[0];break;default:let s=o;for(;--s>=0;)t[n+s]=Number.isFinite(e[s])?e[s]:i[s]}return t}_areValuesEqual(e,t){if(!e||!t)return!1;let{size:n}=this;for(let i=0;i<n;i++)if(e[i]!==t[i])return!1;return!0}_createBuffer(e){this._buffer&&this._buffer.destroy();let{isIndexed:t,type:n}=this.settings,i=this.device.type==="webgpu"&&!t?D.VERTEX|D.STORAGE|D.COPY_DST|D.COPY_SRC:(t?D.INDEX:D.VERTEX)|D.COPY_DST;return this._buffer=this.device.createBuffer({...this._buffer?.props,id:this.id,usage:i,indexType:t?n:void 0,byteLength:e}),this._buffer}};var yE=[],bE=[];function Sn(r,e=0,t=1/0){let n=yE,i={index:-1,data:r,target:[]};return r?typeof r[Symbol.iterator]=="function"?n=r:r.length>0&&(bE.length=r.length,n=bE):n=yE,(e>0||Number.isFinite(t))&&(n=(Array.isArray(n)?n:Array.from(n)).slice(e,t),i.index=e-1),{iterable:n,objectInfo:i}}function Ql(r){return r&&r[Symbol.asyncIterator]}function Jl(r,e){let{size:t,stride:n,offset:i,startIndices:o,nested:s}=e,a=r.BYTES_PER_ELEMENT,c=n?n/a:t,l=i?i/a:0,u=Math.floor((r.length-l)/c);return(f,{index:d,target:h})=>{if(!o){let b=d*c+l;for(let y=0;y<t;y++)h[y]=r[b+y];return h}let p=o[d],m=o[d+1]||u,g;if(s){g=new Array(m-p);for(let b=p;b<m;b++){let y=b*c+l;h=new Array(t);for(let x=0;x<t;x++)h[x]=r[y+x];g[b-p]=h}}else if(c===t)g=r.subarray(p*t+l,m*t+l);else{g=new r.constructor((m-p)*t);let b=0;for(let y=p;y<m;y++){let x=y*c+l;for(let v=0;v<t;v++)g[b++]=r[x+v]}}return g}}var xE=[],zs=[[0,1/0]];function vE(r,e){if(r===zs||(e[0]<0&&(e[0]=0),e[0]>=e[1]))return r;let t=[],n=r.length,i=0;for(let o=0;o<n;o++){let s=r[o];s[1]<e[0]?(t.push(s),i=o+1):s[0]>e[1]?t.push(s):e=[Math.min(s[0],e[0]),Math.max(s[1],e[1])]}return t.splice(i,0,e),t}var QB={interpolation:{duration:0,easing:r=>r},spring:{stiffness:.05,damping:.5}};function eu(r,e){if(!r)return null;Number.isFinite(r)&&(r={type:"interpolation",duration:r});let t=r.type||"interpolation";return{...QB[t],...e,...r,type:t}}var Tn=class extends Gs{constructor(e,t){super(e,t,{startIndices:null,constantValue:null,lastExternalBuffer:null,binaryValue:null,binaryAccessor:null,needsUpdate:!0,needsRedraw:!1,layoutChanged:!1,updateRanges:zs}),this.constant=!1,this.settings.update=t.update||(t.accessor?this._autoUpdater:void 0),Object.seal(this.settings),Object.seal(this.state),this._validateAttributeUpdaters()}get startIndices(){return this.state.startIndices}set startIndices(e){this.state.startIndices=e}needsUpdate(){return this.state.needsUpdate}needsRedraw({clearChangedFlags:e=!1}={}){let t=this.state.needsRedraw;return this.state.needsRedraw=t&&!e,t}layoutChanged(){return this.state.layoutChanged}setAccessor(e){var t;(t=this.state).layoutChanged||(t.layoutChanged=!_E(e,this.getAccessor())),super.setAccessor(e)}getUpdateTriggers(){let{accessor:e}=this.settings;return[this.id].concat(typeof e!="function"&&e||[])}supportsTransition(){return!!this.settings.transition}getTransitionSetting(e){if(!e||!this.supportsTransition())return null;let{accessor:t}=this.settings,n=this.settings.transition,i=Array.isArray(t)?e[t.find(o=>e[o])]:e[t];return eu(i,n)}setNeedsUpdate(e=this.id,t){if(this.state.needsUpdate=this.state.needsUpdate||e,this.setNeedsRedraw(e),t){let{startRow:n=0,endRow:i=1/0}=t;this.state.updateRanges=vE(this.state.updateRanges,[n,i])}else this.state.updateRanges=zs}clearNeedsUpdate(){this.state.needsUpdate=!1,this.state.updateRanges=xE}setNeedsRedraw(e=this.id){this.state.needsRedraw=this.state.needsRedraw||e}allocate(e){let{state:t,settings:n}=this;if(n.noAlloc)return!1;if(n.update){let i=this.isConstant;return super.allocate(e,t.updateRanges!==zs),t.layoutChanged||(t.layoutChanged=i&&this.device.type==="webgpu"),!0}return!1}updateBuffer({numInstances:e,data:t,props:n,context:i}){if(!this.needsUpdate())return!1;let{state:{updateRanges:o},settings:{update:s,noAlloc:a}}=this,c=!0;if(s){for(let[l,u]of o)s.call(i,this,{data:t,startRow:l,endRow:u,props:n,numInstances:e});if(this.value)if(this.constant||!this.buffer||this.buffer.byteLength<this.value.byteLength+this.byteOffset){if(this.constant){let l=this.value;this.value=null,this.setConstantValue(i,l)}else this.setData({value:this.value,constant:this.constant});this.constant=!1}else for(let[l,u]of o){let f=Number.isFinite(l)?this.getVertexOffset(l):0,d=Number.isFinite(u)?this.getVertexOffset(u):a||!Number.isFinite(e)?this.value.length:e*this.size;super.updateSubBuffer({startOffset:f,endOffset:d})}this._checkAttributeArray()}else c=!1;return this.clearNeedsUpdate(),this.setNeedsRedraw(),c}setConstantValue(e,t){var n;if(t===void 0||typeof t=="function")return!1;let i=this.isConstant,o=this.settings.transform&&e?this.settings.transform.call(e,t):t,s=this.settings.defaultType;this.state.constantValue=this._normalizeValue(o,new s(this.size),0);let a=this.setData({constant:!0,value:o});if(this.device.type==="webgpu"){let c=this.state.constantValue;this.doublePrecision&&(c instanceof Float32Array||c instanceof Float64Array)&&(c=pi(c,{size:this.size}),this.setAccessor({...this.getAccessor(),stride:this.size*2*Float32Array.BYTES_PER_ELEMENT}));let l=this._buffer;(!l||l.byteLength<c.byteLength)&&(l=this._createBuffer(c.byteLength)),l.write(c),(n=this.state).layoutChanged||(n.layoutChanged=!i),this.constant=!1}return a&&this.setNeedsRedraw(),this.clearNeedsUpdate(),!0}getConstantValue(){return this.isConstant?this.state.constantValue:null}setExternalBuffer(e){let{state:t}=this;return e?(this.clearNeedsUpdate(),t.lastExternalBuffer===e||(t.lastExternalBuffer=e,this.setNeedsRedraw(),this.setData(e)),!0):(t.lastExternalBuffer=null,!1)}setBinaryValue(e,t=null){let{state:n,settings:i}=this;if(!e)return n.binaryValue=null,n.binaryAccessor=null,!1;if(i.noAlloc)return!1;if(n.binaryValue===e)return this.clearNeedsUpdate(),!0;if(n.binaryValue=e,this.setNeedsRedraw(),i.transform||t!==this.startIndices){ArrayBuffer.isView(e)&&(e={value:e});let s=e;U(ArrayBuffer.isView(s.value),`invalid ${i.accessor}`);let a=!!s.size&&s.size!==this.size;return n.binaryAccessor=Jl(s.value,{size:s.size||this.size,stride:s.stride,offset:s.offset,startIndices:t,nested:a}),!1}return this.clearNeedsUpdate(),this.setData(e),!0}getVertexOffset(e){let{startIndices:t}=this;return(t?e<t.length?t[e]:this.numInstances:e)*this.size}getValue(){let e=this.settings.shaderAttributes,t=super.getValue();if(!e)return t;for(let n in e)Object.assign(t,super.getValue(n,e[n]));return t}getBufferLayout(e){this.state.layoutChanged=!1;let t=this.settings.shaderAttributes,n=super._getBufferLayout(),{stepMode:i}=this.settings;if(i==="dynamic"?n.stepMode=e?e.isInstanced?"instance":"vertex":"instance":n.stepMode=i??"vertex",!t)return n;for(let o in t){let s=super._getBufferLayout(o,t[o]);n.attributes.push(...s.attributes)}return n}_autoUpdater(e,{data:t,startRow:n,endRow:i,props:o,numInstances:s}){let{settings:a,state:c,value:l,size:u,startIndices:f}=e,{accessor:d,transform:h}=a,p=c.binaryAccessor||(typeof d=="function"?d:o[d]);U(typeof p=="function",`accessor "${d}" is not a function`);let m=e.getVertexOffset(n),{iterable:g,objectInfo:b}=Sn(t,n,i);for(let y of g){b.index++;let x=p(y,b);if(h&&(x=h.call(this,x)),f){let v=(b.index<f.length-1?f[b.index+1]:s)-f[b.index];if(x&&Array.isArray(x[0])){let w=m;for(let E of x)e._normalizeValue(E,l,w),w+=u}else x&&x.length>u?l.set(x,m):(e._normalizeValue(x,b.target,0),Pp({target:l,source:b.target,start:m,count:v}));m+=v*u}else e._normalizeValue(x,l,m),m+=u}}_validateAttributeUpdaters(){let{settings:e}=this;if(!(e.noAlloc||typeof e.update=="function"))throw new Error(`Attribute ${this.id} missing update or accessor`)}_checkAttributeArray(){let{value:e}=this,t=Math.min(4,this.size);if(e&&e.length>=t){let n=!0;switch(t){case 4:n=n&&Number.isFinite(e[3]);case 3:n=n&&Number.isFinite(e[2]);case 2:n=n&&Number.isFinite(e[1]);case 1:n=n&&Number.isFinite(e[0]);break;default:n=!1}if(!n)throw new Error(`Illegal attribute generated for ${this.id}`)}}};rr();dm();rr();var Vs=class r{gpuDataEvaluators;format;length;id;_gpuVector;_ownsGPUDataEvaluators;_destroyed=!1;static fromGPUVector(e){if(e.bufferLayout)throw new Error(`GPUVectorEvaluator.fromGPUVector() does not accept interleaved vector "${e.name}"`);if(e.data.length===0)throw new Error(`GPUVectorEvaluator.fromGPUVector() requires GPUData for "${e.name}"`);return new r({id:e.name,gpuDataEvaluators:e.data.map(t=>j.fromGPUData(t,{id:e.name})),gpuVector:e,format:e.format})}static fromGPUDataEvaluators(e,t={}){return new r({id:t.id,gpuDataEvaluators:e,format:t.format})}constructor({id:e,gpuDataEvaluators:t,gpuVector:n,format:i}){if(t.length===0)throw new Error("GPUVectorEvaluator requires at least one GPUData evaluator");fD(t),this.id=e,this.gpuDataEvaluators=t,this.format=i??t[0].format,this.length=t.reduce((o,s)=>o+s.length,0),this._gpuVector=n,this._ownsGPUDataEvaluators=!n}get evaluated(){return!!this._gpuVector}get gpuVector(){if(!this._gpuVector)throw new Error(`${this} not evaluated`);return this._gpuVector}mapGPUData(e){return r.fromGPUDataEvaluators(this.gpuDataEvaluators.map((t,n)=>e(t,n)),{id:this.id})}async evaluate(e,t={}){if(this._destroyed)throw new Error(`GPUVectorEvaluator ${this} already destroyed`);if(this._gpuVector)return this._gpuVector;let n=await Promise.all(this.gpuDataEvaluators.map(a=>a.evaluate(e,t))),i=n[0],o=n.map(OE),s=t.format??this.format??i.format;return this._gpuVector=new Nt({type:"data",name:t.name??this.id??"vector",format:s,data:o,stride:i.stride,byteStride:i.byteStride,rowByteLength:i.rowByteLength,bufferLayout:i.bufferLayout}),this._gpuVector}evaluateSync(e,t={}){if(this._destroyed)throw new Error(`GPUVectorEvaluator ${this} already destroyed`);if(this._gpuVector)return this._gpuVector;let n=this.gpuDataEvaluators.map(a=>a.evaluateSync(e,t)),i=n[0],o=n.map(OE),s=t.format??this.format??i.format;return this._gpuVector=new Nt({type:"data",name:t.name??this.id??"vector",format:s,data:o,stride:i.stride,byteStride:i.byteStride,rowByteLength:i.rowByteLength,bufferLayout:i.bufferLayout}),this._gpuVector}destroy(){if(this._ownsGPUDataEvaluators)for(let e of this.gpuDataEvaluators)e.destroy();this._gpuVector=void 0,this._destroyed=!0}toString(){return this.id??this.constructor.name}};function fD(r){let e=r[0];for(let t of r.slice(1))if(t.type!==e.type||t.size!==e.size||t.normalized!==e.normalized||t.format!==e.format)throw new Error("GPUVectorEvaluator requires matching GPUData evaluator layouts")}function OE(r){let[e,...t]=r.data;if(!e||t.length>0)throw new Error(`GPUVectorEvaluator requires one GPUData chunk for "${r.name}"`);return e}rr();I();var gm={};Ut(gm,{arithmetic:()=>BE,dot:()=>GE,equalAll:()=>zE,extent:()=>kE,fround:()=>NE,gather:()=>FE,interleave:()=>UE,length:()=>$E,segmentedMap:()=>VE,select:()=>WE,sequence:()=>jE,swizzle:()=>HE});cu();function Mi({elementWise:r,func:e,inputs:t,output:n,outputBuffer:i}){let o=Array.isArray(t)?t:Object.values(t);for(let p of o)if(!p.value)throw new Error(`${p} does not have CPU value`);let s=n.length,a=n.size,c=new n.ValueType(s*a);for(let p=0;p<s;p++){let m=o.map(g=>ne(g,p));if(r)for(let g=0;g<a;g++)c[p*a+g]=e.apply(null,m.map(b=>b[g]));else e.call(null,c.subarray(p*a,p*a+a),...m)}let l=n.ValueType.BYTES_PER_ELEMENT,u=n.offset/l,f=n.stride/l,d=a,h=c;if(u!==0||f!==d){h=new n.ValueType(u+n.byteLength/l);for(let p=0;p<s;p++){let m=p*d,g=u+p*f,b=c.subarray(m,m+a);h.set(b,g),i.write(b,g*l)}}else i.write(c);return{success:!0,value:h}}function ne(r,e){let t=r.value,n=r.size,i=r.offset/r.ValueType.BYTES_PER_ELEMENT,o=r.stride/r.ValueType.BYTES_PER_ELEMENT,s=r.isConstant?0:e,a=i+s*o,c=t.slice(a,a+n);if(!r.normalized)return c;let l=new Float32Array(n);for(let u=0;u<n;u++)l[u]=dD(c[u],r.type);return l}function dD(r,e){switch(e){case"uint8":return r/255;case"uint16":return r/65535;case"uint32":return r/4294967295;case"sint8":return Math.max(r/127,-1);case"sint16":return Math.max(r/32767,-1);case"sint32":return Math.max(r/2147483647,-1);case"float32":return r;default:throw new Error(`Unsupported normalized source type ${e}`)}}var BE=({inputs:r,output:e,target:t})=>{for(let i of Object.values(r.namedInputs))if(!i.value)throw new Error(`${i} does not have CPU value`);let n=new e.ValueType(e.length*e.size);for(let i=0;i<e.length;i++){let o=Object.fromEntries(Object.entries(r.namedInputs).map(([s,a])=>[s,ne(a,i)]));for(let s=0;s<e.size;s++)n[i*e.size+s]=DE(r.expression,o,s)}return t.write(n),{success:!0,value:n}};function DE(r,e,t){switch(r.kind){case"input":{let n=e[r.name];return t<n.length?n[t]:n.length===1?n[0]:0}case"literal":return Array.isArray(r.value)?r.value[t]??0:r.value;case"call":{hD(r.op,r.args.length);let n=r.args.map(i=>DE(i,e,t));switch(r.op){case"add":return n[0]+n[1];case"subtract":return n[0]-n[1];case"multiply":return n[0]*n[1];case"divide":return n[0]/n[1];case"pow":return Math.pow(n[0],n[1]);case"sqrt":return Math.sqrt(n[0]);case"abs":return Math.abs(n[0]);case"sin":return Math.sin(n[0]);case"cos":return Math.cos(n[0]);case"tan":return Math.tan(n[0]);case"exp":return Math.exp(n[0]);case"log":return Math.log(n[0]);default:{let i=r.op;throw new Error(`Unsupported arithmetic op ${i}`)}}}default:{let n=r;throw new Error(`Unsupported expression node ${n.kind}`)}}}function hD(r,e){let t=Ci[r].arity;if(e!==t)throw new Error(`Arithmetic op '${r}' expects ${t} args, got ${e}`)}var kE=({inputs:r,output:e,target:t})=>{let{sourceValues:n}=r;if(!n.value)throw new Error(`${n} does not have CPU value`);let o=new e.ValueType(e.length*e.size);if(n.length===0)return{success:!1,error:new Error(`${n} is empty`)};for(let s=0;s<n.size;s++){let a=ne(n,0)[s],c=s*e.size,l=c+1;o[c]=a,o[l]=a;for(let u=1;u<n.length;u++){let f=ne(n,u)[s];f<o[c]&&(o[c]=f),f>o[l]&&(o[l]=f)}}return t.write(o),{success:!0,value:o}};var NE=({inputs:r,output:e,target:t})=>Mi({func:(n,i)=>{let o=n.length/2,s=new Float64Array(i.buffer);for(let a=0;a<o;a++){let c=s[a];n[a]=Math.fround(c),n[a+o]=c-n[a]}return n},inputs:r,output:e,outputBuffer:t});var FE=async({inputs:r,output:e,target:t})=>{let{ids:n,sourceValues:i}=r,o=n.value,s=i.value;if(!o)throw new Error(`${n} does not have CPU value`);if(!s)throw new Error(`${i} does not have CPU value`);let a=new e.ValueType(e.length*e.size),c=new Array(e.size).fill(0);for(let l=0;l<e.length;l++){let u=ne(n,l),f=Number(u[0]),d=pD(f,i.length)?ne(i,f):c;a.set(d,l*e.size)}return t.write(a),{success:!0,value:a}};function pD(r,e){return Number.isInteger(r)&&r>=0&&r<e}var UE=({inputs:r,output:e,target:t})=>Mi({func:(n,...i)=>{let o=0;for(let s of i)n.set(s,o),o+=s.length},inputs:r,output:e,outputBuffer:t});var GE=({inputs:r,output:e,target:t})=>{let{x:n,y:i}=r,o=new e.ValueType(e.length);for(let s=0;s<e.length;s++){let a=ne(n,s),c=ne(i,s),l=0;for(let u=0;u<n.size;u++)l+=a[u]*c[u];o[s]=l}return t.write(o),{success:!0,value:o}};var zE=({inputs:r,output:e,target:t})=>{let{x:n,y:i}=r,o=new e.ValueType(e.length);for(let s=0;s<e.length;s++){let a=ne(n,s),c=ne(i,s),l=1;for(let u=0;u<n.size;u++)if(a[u]!==c[u]){l=0;break}o[s]=l}return t.write(o),{success:!0,value:o}};var $E=({inputs:r,output:e,target:t})=>{let{x:n}=r,i=new e.ValueType(e.length);for(let o=0;o<e.length;o++){let s=ne(n,o),a=0;for(let c=0;c<n.size;c++)a+=s[c]*s[c];i[o]=Math.sqrt(a)}return t.write(i),{success:!0,value:i}};var VE=async({inputs:r,output:e,target:t})=>{let{segments:n,vertexCount:i}=r,o=n.value;if(!o)throw new Error(`${n} does not have CPU value`);mD(o,n,i);let s=new e.ValueType(e.length*e.size),a=0;for(let c=0;c<i;c++){for(;a+1<n.length&&o[pm(n,a+1)]<=c;)a++;let l=o[pm(n,a)],u=c*e.size;s[u]=a,s[u+1]=c-l}return t.write(s),{success:!0,value:s}};function mD(r,e,t){if(e.length<1)throw new Error("segmentedMap segments must contain at least one segment start");let n=0;for(let i=0;i<e.length;i++){let o=r[pm(e,i)];if(i===0&&o!==0)throw new Error(`segmentedMap segments must start at 0, got ${o}`);if(i>0&&o<n)throw new Error(`segmentedMap segments must be non-decreasing, got ${o} after ${n}`);n=o}if(n>t)throw new Error(`segmentedMap last segment start must be <= vertexCount, got ${n} > ${t}`)}function pm(r,e){return r.offset/r.ValueType.BYTES_PER_ELEMENT+e*(r.stride/r.ValueType.BYTES_PER_ELEMENT)}var WE=async({inputs:r,output:e,target:t})=>{let{condition:n,whenTrue:i,whenFalse:o}=r,s=new e.ValueType(e.length*e.size);for(let a=0;a<e.length;a++){let c=ne(n,a),l=ne(i,a),u=ne(o,a);for(let f=0;f<e.size;f++){let d=mm(c,n.size,f);s[a*e.size+f]=d!==0?mm(l,i.size,f):mm(u,o.size,f)}}return t.write(s),{success:!0,value:s}};function mm(r,e,t){return t<e?r[t]:e===1?r[0]:0}var jE=({inputs:r,output:e,target:t})=>{let n=new e.ValueType(e.length);for(let i=0;i<e.length;i++)n[i]=r.start+i*r.step;return t.write(n),{success:!0,value:n}};var HE=({inputs:r,output:e,target:t})=>{let{columns:n}=r;return Mi({func:(i,o)=>{for(let s=0;s<n.length;s++)i[s]=o[n[s]]},inputs:{x:r.x},output:e,outputBuffer:t})};var Cm=class{_modules={cpu:gm};add(e,t){let n=this._modules[e];if(typeof t.then=="function"){let o=Promise.all([Promise.resolve(n||{}),t]).then(([s,a])=>({...s,...a}));return this._modules[e]=o,o.then(s=>{this._modules[e]=s}).catch(s=>{P.error(`Failed to register ${e} backend: ${s}`)()}),o}if(n&&typeof n.then=="function"){let o=Promise.resolve(n).then(s=>({...s,...t})).then(s=>(this._modules[e]=s,s)).catch(s=>{throw P.error(`Failed to register ${e} backend: ${s}`)(),s});return this._modules[e]=o,o}let i={...n||{},...t};return this._modules[e]=i,Promise.resolve(i)}async get(e,t){let n=this._modules[e];if(!n)if(e==="webgl")n=this.add("webgl",Promise.resolve().then(()=>(w2(),v2)));else if(e==="webgpu")n=this.add("webgpu",Promise.resolve().then(()=>(Am(),q2)));else throw new Error(`${e} backend not registered`);let o=(await n)[t];if(typeof o!="function")throw new Error(`${e} backend does not implement ${t}`);return o}getSync(e,t){let n=this._modules[e];if(!n)throw new Error(`${e} backend not registered`);if(typeof n.then=="function")throw new Error(`${e} backend is not loaded yet`);let o=n[t];if(typeof o!="function")throw new Error(`${e} backend does not implement ${t}`);return o}clear(){this._modules={}}},ki=new Cm;var _u=class{inputs;dependencies;constructor(e){this.inputs=e,this.dependencies=Array.from(e instanceof Array?e:Object.values(e)).filter(t=>t instanceof j)}async execute(e,t){return await this._resolveDependencies(e),await this._executeWithHandler(await ki.get(this._getHandlerRegistry(e),this.name),t)}executeSync(e,t){this._resolveDependenciesSync(e);let n=this._executeWithHandler(ki.getSync(this._getHandlerRegistry(e),this.name),t);if(sk(n))throw new Error(`${this.name} returned a Promise in executeSync()`);return n}shouldExecuteOnCPU(){return this.output.length<=1&&Array.from(this.dependencies).every(e=>!!e.value)}_getHandlerRegistry(e){return this.shouldExecuteOnCPU()?"cpu":e.type}async _resolveDependencies(e){for(let n of this.dependencies)await n.evaluate(e);if(this._getHandlerRegistry(e)==="cpu"||e.type==="null")for(let n of this.dependencies)await n.ensureCPUValue()}_resolveDependenciesSync(e){for(let n of this.dependencies)n.evaluateSync(e);if(this._getHandlerRegistry(e)==="cpu"||e.type==="null")for(let n of this.dependencies)n.ensureCPUValueSync()}_executeWithHandler(e,t){return e({device:t.device,inputs:this.inputs,output:this.output,target:t})}};function sk(r){return typeof r?.then=="function"}function Z2(...r){let e=ak(r.map(t=>t.type));return e[0]!=="f"&&r.some(t=>t.normalized)&&(e="float32"),{isConstant:r.every(t=>t.isConstant),type:e,size:r.reduce((t,n)=>Math.max(t,n.size),0),length:r.reduce((t,n)=>Math.max(t,n.length),0)}}function ak(r){let e=0,t=0;for(let n of r){if(n[0]==="f")return"float32";let i=n.endsWith("8")?8:n.endsWith("6")?16:32;n[0]==="u"?e=Math.max(e,i):t=Math.max(t,i)}return e&&!t?`uint${e}`:t&&e<32?`sint${Math.max(t,e*2)}`:"float32"}rr();var Mm=class extends _u{name="interleave";output;constructor(e){super(e);let{isConstant:t,type:n,length:i}=Z2(...e);this.output=new j({isConstant:t,type:n,size:e.reduce((o,s)=>o+s.size,0),length:i,source:this})}toString(){return`_${this.inputs.join("_")}_`}};function Rm(...r){if(r.length===0)throw new Error("interleave() requires at least one input");return r.length===1?au(r[0]):new Mm(r.map(au)).output}K();rr();function Om(r,e){let t=lk(e);for(let n of t)n.evaluateSync(r);return ck(t),e}function ck(r){let e=new Set(r.flatMap(fk)),t=new Set;for(let n of r)yu(n,t);for(let n of t)n.evaluated&&!e.has(n.buffer)&&n.destroy()}function lk(r){let e=new Set;return Im(r,e,new Set),Array.from(e)}function Im(r,e,t){if(dk(r)){e.add(r);return}if(!(!r||typeof r!="object"||t.has(r))){if(t.add(r),Array.isArray(r)){for(let n of r)Im(n,e,t);return}if(uk(r))for(let n of Object.values(r))Im(n,e,t)}}function uk(r){let e=Object.getPrototypeOf(r);return e===Object.prototype||e===null}function yu(r,e){if(r instanceof Vs){for(let n of r.gpuDataEvaluators)yu(n,e);return}let t=r.source;if(t){if(t instanceof j){e.has(t)||(e.add(t),yu(t,e));return}for(let n of t.dependencies)e.has(n)||(e.add(n),yu(n,e))}}function fk(r){return r instanceof j?[r.buffer]:r.gpuVector.data.map(e=>e.buffer instanceof me?e.buffer.buffer:e.buffer)}function dk(r){return r instanceof j||r instanceof Vs}Am();var js=class{constructor(e,{id:t,isTransitionAttribute:n}){this.packedBuffers={},this.device=e,this.id=t,this.isTransitionAttribute=n,this.device.type==="webgpu"&&ki.add("webgpu",{interleave:gu})}hasGroups(e){return this.device.type==="webgpu"&&Object.values(e).some(t=>!!t.settings.bufferGroup)}finalize(){for(let e of Object.values(this.packedBuffers))e.packed.destroy();this.packedBuffers={}}getBufferLayouts(e,t){let n=this._getPackedGroups(e,t,{requireValues:!1,excludeAttributes:{}});return this._getBufferLayouts(e,n,t)}getBindings(e,t,n,i){let o=this._getPackedGroups(e,n,{requireValues:!0,excludeAttributes:i}),s={},a=new Set;for(let c of o.values()){let l=!this.packedBuffers[c.id]||c.attributes.some(u=>!!t[u.id]);s[c.id]=this._getPackedBuffer(c,l);for(let u of c.attributes)a.add(u.id)}return{bufferLayouts:this._getBufferLayouts(e,o,n).filter(c=>!i[c.name]&&!e[c.name]?.settings.isIndexed),buffers:s,groupedAttributeIds:a}}_getPackedGroups(e,t,{requireValues:n,excludeAttributes:i}){let o=new Map;for(let a of Object.values(e)){let c=a.settings.bufferGroup;if(!c)continue;let l=o.get(c)||[];l.push(a),o.set(c,l)}let s=new Map;for(let[a,c]of o){let l=this._getPackedGroup(a,c,t,n,i);l&&s.set(a,l)}return s}_getPackedGroup(e,t,n,i,o){if(t.length<2)return null;let s=t.map(h=>h.getBufferLayout(n)),a=s[0].stepMode,c=Math.max(1,t[0].numInstances),l=i&&t.every(h=>h.isConstant);for(let h=0;h<t.length;h++){let p=t[h],m=p.getAccessor(),g=m.size*m.bytesPerElement;if(o[p.id]||p.settings.isIndexed||p.settings.noAlloc||p.doublePrecision||this.isTransitionAttribute(p.id)||s[h].stepMode!==a||p.numInstances!==t[0].numInstances||(m.offset||0)!==0||(m.vertexOffset||0)!==0||Je(m)!==g||i&&(p.isConstant?!p.getConstantValue()||p.getConstantValue().byteLength<g:!ArrayBuffer.isView(p.value)||p.value.byteLength<c*g))return null}let u={},f=[],d=0;for(let h=0;h<t.length;h++){let p=t[h];d=X2(d),u[p.id]=d;for(let m of s[h].attributes||[])f.push({...m,byteOffset:d+(m.byteOffset||0)});d+=Je(p.getAccessor())}return d=X2(d),{id:e,attributes:t,byteStride:d,byteOffsets:u,rowCount:c,layout:{name:e,byteStride:l?0:d,stepMode:a,attributes:f}}}_getBufferLayouts(e,t,n){let i=[],o=new Set,s=new Set;for(let a of t.values())for(let c of a.attributes)s.add(c.id);for(let a of Object.values(e)){let c=a.settings.bufferGroup,l=c&&t.get(c);l&&s.has(a.id)?o.has(l.id)||(i.push(l.layout),o.add(l.id)):i.push(a.getBufferLayout(n))}return i}_getPackedBuffer(e,t){let n=JSON.stringify({byteStride:e.layout.byteStride,attributes:e.layout.attributes}),i=this.packedBuffers[e.id];if((!i||i.layoutKey!==n)&&(t=!0),t){i&&(i.packed.destroy(),delete this.packedBuffers[e.id]);let o=this._interleavePackedGroup(e);return this.packedBuffers[e.id]={packed:o,layoutKey:n},o.buffer}if(!i)throw new Error(`Attribute buffer group ${e.id} has no packed buffer`);return i.packed.buffer}_interleavePackedGroup(e){let t=e.attributes.map(i=>this._getInterleaveInput(e,i)),n=Rm(...t);return Om(this.device,n),n}_getInterleaveInput(e,t){let n=Je(t.getAccessor()),i=e.byteOffsets[t.id];if(Ws(`${e.id}.${t.id} rowByteLength`,n),Ws(`${e.id}.${t.id} groupByteOffset`,i),t.isConstant){let c=t.getConstantValue();if(!c)throw new Error(`Attribute group ${e.id} is missing constant value ${t.id}`);return Ws(`${e.id}.${t.id} constant byteOffset`,c.byteOffset),new j({id:t.id,type:"uint32",size:n/4,isConstant:!0,value:new Uint32Array(c.buffer,c.byteOffset,n/Uint32Array.BYTES_PER_ELEMENT)})}let o=t.getBuffer(),s=t.byteOffset,a=t.getAccessor().stride||n;if(Ws(`${e.id}.${t.id} byteOffset`,s),Ws(`${e.id}.${t.id} stride`,a),!o)throw new Error(`Attribute group ${e.id} cannot interleave missing buffer ${t.id}`);return new j({id:t.id,type:"uint32",size:n/4,offset:s,stride:a,length:e.rowCount,buffer:o})}};function X2(r){return Math.ceil(r/4)*4}function Ws(r,e){if(e%4!==0)throw new Error(`Attribute buffer groups require 32-bit alignment: ${r}=${e}`)}K();Me();function Bm(r){let{source:e,target:t,start:n=0,size:i,getData:o}=r,s=r.end||t.length,a=e.length,c=s-n;if(a>c){t.set(e.subarray(0,c),n);return}if(t.set(e,n),!o)return;let l=a;for(;l<c;){let u=o(l,e);for(let f=0;f<i;f++)t[n+l]=u[f]||0,l++}}function K2({source:r,target:e,size:t,getData:n,sourceStartIndices:i,targetStartIndices:o}){if(!i||!o)return Bm({source:r,target:e,size:t,getData:n}),e;let s=0,a=0,c=n&&((u,f)=>n(u+a,f)),l=Math.min(i.length,o.length);for(let u=1;u<l;u++){let f=i[u]*t,d=o[u]*t;Bm({source:r.subarray(s,f),target:e,start:a,end:d,size:t,getData:c}),s=f,a=d}return a<e.length&&Bm({source:[],target:e,start:a,size:t,getData:c}),e}function Q2(r){let{device:e,settings:t,value:n}=r,i=new Tn(e,t);return i.setData({value:n instanceof Float64Array?new Float64Array(0):new Float32Array(0),normalized:t.normalized}),i}function bu(r){switch(r){case 1:return"float";case 2:return"vec2";case 3:return"vec3";case 4:return"vec4";default:throw new Error(`No defined attribute type for size "${r}"`)}}function xu(r){switch(r){case 1:return"float32";case 2:return"float32x2";case 3:return"float32x3";case 4:return"float32x4";default:throw new Error("invalid type size")}}function vu(r){r.push(r.shift())}function J2(r,e){let{settings:t,value:n,size:i}=r,o=r.isDoublePrecisionBuffer?2:1,s=0,{shaderAttributes:a}=r.settings;if(a)for(let c of Object.values(a))s=Math.max(s,c.vertexOffset??0);return(t.noAlloc?n.length:(e+s)*i)*o}function wu({device:r,source:e,target:t}){return(!t||t.byteLength<e.byteLength)&&(t?.destroy(),t=r.createBuffer({byteLength:e.byteLength,usage:e.usage})),t}function Eu({device:r,buffer:e,attribute:t,fromLength:n,toLength:i,fromStartIndices:o,getData:s=a=>a}){let a=t.isDoublePrecisionBuffer?2:1,c=t.size*a,l=t.byteOffset,u=t.settings.bytesPerElement<4?l/t.settings.bytesPerElement*4:l,f=t.startIndices,d=o&&f,h=t.isConstant;if(!d&&e&&n>=i)return e;let p=t.value instanceof Float64Array?Float32Array:t.value.constructor,m=h?t.value:new p(t.getBuffer().readSyncWebGL(l,i*p.BYTES_PER_ELEMENT).buffer);if(t.settings.normalized&&!h){let x=s;s=(v,w)=>t.normalizeConstant(x(v,w))}let g=h?(x,v)=>s(m,v):(x,v)=>s(m.subarray(x+l,x+l+c),v),b=e?new Float32Array(e.readSyncWebGL(u,n*4).buffer):new Float32Array(0),y=new Float32Array(i);return K2({source:b,target:y,sourceStartIndices:o,targetStartIndices:f,size:c,getData:g}),(!e||e.byteLength<y.byteLength+u)&&(e?.destroy(),e=r.createBuffer({byteLength:y.byteLength+u,usage:35050})),e.write(y,u),e}var Ni=class{constructor({device:e,attribute:t,timeline:n}){this.buffers=[],this.currentLength=0,this.device=e,this.transition=new ct(n),this.attribute=t,this.attributeInTransition=Q2(t),this.currentStartIndices=t.startIndices}get inProgress(){return this.transition.inProgress}start(e,t,n=1/0){this.settings=e,this.currentStartIndices=this.attribute.startIndices,this.currentLength=J2(this.attribute,t),this.transition.start({...e,duration:n})}update(){let e=this.transition.update();return e&&this.onUpdate(),e}setBuffer(e){let{stride:t}=this.attributeInTransition.getAccessor();this.attributeInTransition.setData({buffer:e,normalized:this.attribute.settings.normalized,value:this.attributeInTransition.value,stride:t})}cancel(){this.transition.cancel()}delete(){this.cancel();for(let e of this.buffers)e.destroy();this.buffers.length=0}};var Hs=class extends Ni{constructor({device:e,attribute:t,timeline:n}){super({device:e,attribute:t,timeline:n}),this.type="interpolation",this.transform=gk(e,t)}start(e,t){let n=this.currentLength,i=this.currentStartIndices;if(super.start(e,t,e.duration),e.duration<=0){this.transition.cancel();return}let{buffers:o,attribute:s}=this;vu(o),o[0]=Eu({device:this.device,buffer:o[0],attribute:s,fromLength:n,toLength:this.currentLength,fromStartIndices:i,getData:e.enter}),o[1]=wu({device:this.device,source:o[0],target:o[1]}),this.setBuffer(o[1]);let{transform:a}=this,c=a.model,l=Math.floor(this.currentLength/s.size);tP(s)&&(l/=2),c.setVertexCount(l),s.isConstant?(c.setAttributes({aFrom:o[0]}),c.setConstantAttributes({aTo:s.value})):c.setAttributes({aFrom:o[0],aTo:s.getBuffer()}),a.transformFeedback.setBuffers({vCurrent:o[1]})}onUpdate(){let{duration:e,easing:t}=this.settings,{time:n}=this.transition,i=n/e;t&&(i=t(i));let{model:o}=this.transform,s={time:i};o.shaderInputs.setProps({interpolation:s}),this.transform.run({discard:!0})}delete(){super.delete(),this.transform.destroy()}},hk=`layout(std140) uniform interpolationUniforms {
  float time;
} interpolation;
`,eP={name:"interpolation",vs:hk,uniformTypes:{time:"f32"}},pk=`#version 300 es
#define SHADER_NAME interpolation-transition-vertex-shader

in ATTRIBUTE_TYPE aFrom;
in ATTRIBUTE_TYPE aTo;
out ATTRIBUTE_TYPE vCurrent;

void main(void) {
  vCurrent = mix(aFrom, aTo, interpolation.time);
  gl_Position = vec4(0.0);
}
`,mk=`#version 300 es
#define SHADER_NAME interpolation-transition-vertex-shader

in ATTRIBUTE_TYPE aFrom;
in ATTRIBUTE_TYPE aFrom64Low;
in ATTRIBUTE_TYPE aTo;
in ATTRIBUTE_TYPE aTo64Low;
out ATTRIBUTE_TYPE vCurrent;
out ATTRIBUTE_TYPE vCurrent64Low;

vec2 mix_fp64(vec2 a, vec2 b, float x) {
  vec2 range = sub_fp64(b, a);
  return sum_fp64(a, mul_fp64(range, vec2(x, 0.0)));
}

void main(void) {
  for (int i=0; i<ATTRIBUTE_SIZE; i++) {
    vec2 value = mix_fp64(vec2(aFrom[i], aFrom64Low[i]), vec2(aTo[i], aTo64Low[i]), interpolation.time);
    vCurrent[i] = value.x;
    vCurrent64Low[i] = value.y;
  }
  gl_Position = vec4(0.0);
}
`;function tP(r){return r.isDoublePrecisionBuffer}function gk(r,e){let t=e.size,n=bu(t),i=xu(t),o=e.getBufferLayout();return tP(e)?new _e(r,{vs:mk,bufferLayout:[{name:"aFrom",byteStride:8*t,attributes:[{attribute:"aFrom",format:i,byteOffset:0},{attribute:"aFrom64Low",format:i,byteOffset:4*t}]},{name:"aTo",byteStride:8*t,attributes:[{attribute:"aTo",format:i,byteOffset:0},{attribute:"aTo64Low",format:i,byteOffset:4*t}]}],modules:[Fh,eP],defines:{ATTRIBUTE_TYPE:n,ATTRIBUTE_SIZE:t},moduleSettings:{},varyings:["vCurrent","vCurrent64Low"],bufferMode:35980,disableWarnings:!0}):new _e(r,{vs:pk,bufferLayout:[{name:"aFrom",format:i},{name:"aTo",format:o.attributes[0].format}],modules:[eP],defines:{ATTRIBUTE_TYPE:n},varyings:["vCurrent"],disableWarnings:!0})}K();var Ys=class extends Ni{constructor({device:e,attribute:t,timeline:n}){super({device:e,attribute:t,timeline:n}),this.type="spring",this.texture=wk(e),this.framebuffer=Ek(e,this.texture),this.transform=vk(e,t)}start(e,t){let n=this.currentLength,i=this.currentStartIndices;super.start(e,t);let{buffers:o,attribute:s}=this;for(let c=0;c<2;c++)o[c]=Eu({device:this.device,buffer:o[c],attribute:s,fromLength:n,toLength:this.currentLength,fromStartIndices:i,getData:e.enter});o[2]=wu({device:this.device,source:o[0],target:o[2]}),this.setBuffer(o[1]);let{model:a}=this.transform;a.setVertexCount(Math.floor(this.currentLength/s.size)),s.isConstant?a.setConstantAttributes({aTo:s.value}):a.setAttributes({aTo:s.getBuffer()})}onUpdate(){let{buffers:e,transform:t,framebuffer:n,transition:i}=this,o=this.settings;t.model.setAttributes({aPrev:e[0],aCur:e[1]}),t.transformFeedback.setBuffers({vNext:e[2]});let s={stiffness:o.stiffness,damping:o.damping};t.model.shaderInputs.setProps({spring:s}),t.run({framebuffer:n,discard:!1,parameters:{viewport:[0,0,1,1]},clearColor:[0,0,0,0]}),vu(e),this.setBuffer(e[1]),this.device.readPixelsToArrayWebGL(n)[0]>0||i.end()}delete(){super.delete(),this.transform.destroy(),this.texture.destroy(),this.framebuffer.destroy()}},_k=`layout(std140) uniform springUniforms {
  float damping;
  float stiffness;
} spring;
`,yk={name:"spring",vs:_k,uniformTypes:{damping:"f32",stiffness:"f32"}},bk=`#version 300 es
#define SHADER_NAME spring-transition-vertex-shader

#define EPSILON 0.00001

in ATTRIBUTE_TYPE aPrev;
in ATTRIBUTE_TYPE aCur;
in ATTRIBUTE_TYPE aTo;
out ATTRIBUTE_TYPE vNext;
out float vIsTransitioningFlag;

ATTRIBUTE_TYPE getNextValue(ATTRIBUTE_TYPE cur, ATTRIBUTE_TYPE prev, ATTRIBUTE_TYPE dest) {
  ATTRIBUTE_TYPE velocity = cur - prev;
  ATTRIBUTE_TYPE delta = dest - cur;
  ATTRIBUTE_TYPE force = delta * spring.stiffness;
  ATTRIBUTE_TYPE resistance = velocity * spring.damping;
  return force - resistance + velocity + cur;
}

void main(void) {
  bool isTransitioning = length(aCur - aPrev) > EPSILON || length(aTo - aCur) > EPSILON;
  vIsTransitioningFlag = isTransitioning ? 1.0 : 0.0;

  vNext = getNextValue(aCur, aPrev, aTo);
  gl_Position = vec4(0, 0, 0, 1);
  gl_PointSize = 100.0;
}
`,xk=`#version 300 es
#define SHADER_NAME spring-transition-is-transitioning-fragment-shader

in float vIsTransitioningFlag;

out vec4 fragColor;

void main(void) {
  if (vIsTransitioningFlag == 0.0) {
    discard;
  }
  fragColor = vec4(1.0);
}`;function vk(r,e){let t=bu(e.size),n=xu(e.size);return new _e(r,{vs:bk,fs:xk,bufferLayout:[{name:"aPrev",format:n},{name:"aCur",format:n},{name:"aTo",format:e.getBufferLayout().attributes[0].format}],varyings:["vNext"],modules:[yk],defines:{ATTRIBUTE_TYPE:t},parameters:{depthCompare:"always",blendColorOperation:"max",blendColorSrcFactor:"one",blendColorDstFactor:"one",blendAlphaOperation:"max",blendAlphaSrcFactor:"one",blendAlphaDstFactor:"one"}})}function wk(r){return r.createTexture({data:new Uint8Array(4),format:"rgba8unorm",width:1,height:1})}function Ek(r,e){return r.createFramebuffer({id:"spring-transition-is-transitioning-framebuffer",width:1,height:1,colorAttachments:[e]})}var Pk={interpolation:Hs,spring:Ys},qs=class{constructor(e,{id:t,timeline:n}){if(!e)throw new Error("AttributeTransitionManager is constructed without device");this.id=t,this.device=e,this.timeline=n,this.transitions={},this.needsRedraw=!1,this.numInstances=1}finalize(){for(let e in this.transitions)this._removeTransition(e)}update({attributes:e,transitions:t,numInstances:n}){this.numInstances=n||1;for(let i in e){let o=e[i],s=o.getTransitionSetting(t);s&&this._updateAttribute(i,o,s)}for(let i in this.transitions){let o=e[i];(!o||!o.getTransitionSetting(t))&&this._removeTransition(i)}}hasAttribute(e){let t=this.transitions[e];return t&&t.inProgress}getAttributes(){let e={};for(let t in this.transitions){let n=this.transitions[t];n.inProgress&&(e[t]=n.attributeInTransition)}return e}run(){if(this.numInstances===0)return!1;for(let t in this.transitions)this.transitions[t].update()&&(this.needsRedraw=!0);let e=this.needsRedraw;return this.needsRedraw=!1,e}_removeTransition(e){this.transitions[e].delete(),delete this.transitions[e]}_updateAttribute(e,t,n){let i=this.transitions[e],o=!i||i.type!==n.type;if(o){i&&this._removeTransition(e);let s=Pk[n.type];s?this.transitions[e]=new s({attribute:t,timeline:this.timeline,device:this.device}):(F.error(`unsupported transition type '${n.type}'`)(),o=!1)}(o||t.needsRedraw())&&(this.needsRedraw=!0,this.transitions[e].start(n,this.numInstances))}};var rP="attributeManager.invalidate",Sk="attributeManager.updateStart",Tk="attributeManager.updateEnd",Lk="attribute.updateStart",Ak="attribute.allocate",Ck="attribute.updateEnd",Zs=class{constructor(e,{id:t="attribute-manager",stats:n,timeline:i}={}){this.mergeBoundsMemoized=Tt(J0),this.id=t,this.device=e,this.attributes={},this.updateTriggers={},this.needsRedraw=!0,this.userData={},this.stats=n,this.attributeTransitionManager=new qs(e,{id:`${t}-transitions`,timeline:i}),this.attributeBufferGroups=e.type==="webgpu"?new js(e,{id:t,isTransitionAttribute:o=>this.attributeTransitionManager.hasAttribute(o)}):null,Object.seal(this)}finalize(){this.attributeBufferGroups?.finalize();for(let e in this.attributes)this.attributes[e].delete();this.attributeTransitionManager.finalize()}getNeedsRedraw(e={clearRedrawFlags:!1}){let t=this.needsRedraw;return this.needsRedraw=this.needsRedraw&&!e.clearRedrawFlags,t&&this.id}setNeedsRedraw(){this.needsRedraw=!0}add(e){this._add(e)}addInstanced(e){this._add(e,{stepMode:"instance"})}remove(e){for(let t of e)this.attributes[t]!==void 0&&(this.attributes[t].delete(),delete this.attributes[t])}invalidate(e,t){let n=this._invalidateTrigger(e,t);ie(rP,this,e,n)}invalidateAll(e){for(let t in this.attributes)this.attributes[t].setNeedsUpdate(t,e);ie(rP,this,"all")}update({data:e,numInstances:t,startIndices:n=null,transitions:i,props:o={},buffers:s={},context:a={}}){let c=!1;ie(Sk,this),this.stats&&this.stats.get("Update Attributes").timeStart();for(let l in this.attributes){let u=this.attributes[l],f=u.settings.accessor;u.startIndices=n,u.numInstances=t,o[l]&&F.removed(`props.${l}`,`data.attributes.${l}`)(),u.setExternalBuffer(s[l])||u.setBinaryValue(typeof f=="string"?s[f]:void 0,e.startIndices)||typeof f=="string"&&!s[f]&&u.setConstantValue(a,o[f])||u.needsUpdate()&&(c=!0,this._updateAttribute({attribute:u,numInstances:t,data:e,props:o,context:a})),this.needsRedraw=this.needsRedraw||u.needsRedraw()}c&&ie(Tk,this,t),this.stats&&(this.stats.get("Update Attributes").timeEnd(),c&&this.stats.get("Attributes updated").incrementCount()),this.attributeTransitionManager.update({attributes:this.attributes,numInstances:t,transitions:i})}updateTransition(){let{attributeTransitionManager:e}=this,t=e.run();return this.needsRedraw=this.needsRedraw||t,t}getAttributes(){return{...this.attributes,...this.attributeTransitionManager.getAttributes()}}getBounds(e){let t=e.map(n=>this.attributes[n]?.getBounds());return this.mergeBoundsMemoized(t)}getChangedAttributes(e={clearChangedFlags:!1}){let{attributes:t,attributeTransitionManager:n}=this,i={...n.getAttributes()};for(let o in t){let s=t[o];s.needsRedraw(e)&&!n.hasAttribute(o)&&(i[o]=s)}return i}getBufferLayouts(e){return this.hasBufferGroups()?this.attributeBufferGroups.getBufferLayouts(this.getAttributes(),e):Object.values(this.getAttributes()).map(t=>t.getBufferLayout(e))}hasBufferGroups(){return!!this.attributeBufferGroups?.hasGroups(this.attributes)}getBufferGroupBindings(e,t,n={}){return this.attributeBufferGroups?this.attributeBufferGroups.getBindings(this.getAttributes(),e,t,n):{bufferLayouts:this.getBufferLayouts(t),buffers:{},groupedAttributeIds:new Set}}_add(e,t){for(let n in e){let i=e[n],o={...i,id:n,size:i.isIndexed&&1||i.size||1,...t};this.attributes[n]=new Tn(this.device,o)}this._mapUpdateTriggersToAttributes()}_mapUpdateTriggersToAttributes(){let e={};for(let t in this.attributes)this.attributes[t].getUpdateTriggers().forEach(i=>{e[i]||(e[i]=[]),e[i].push(t)});this.updateTriggers=e}_invalidateTrigger(e,t){let{attributes:n,updateTriggers:i}=this,o=i[e];return o&&o.forEach(s=>{let a=n[s];a&&a.setNeedsUpdate(a.id,t)}),o}_updateAttribute(e){let{attribute:t,numInstances:n}=e;if(ie(Lk,t),t.constant){t.setConstantValue(e.context,t.value);return}t.allocate(n)&&ie(Ak,t,n),t.updateBuffer(e)&&(this.needsRedraw=!0,ie(Ck,t,n))}};I();Yl();le();var Xs=class extends ct{get value(){return this._value}_onUpdate(){let{time:e,settings:{fromValue:t,toValue:n,duration:i,easing:o}}=this,s=o(e/i);this._value=Qr(t,n,s)}};var nP=1e-5;function iP(r,e,t,n,i){let o=e-r,a=(t-e)*i,c=-o*n;return a+c+o+e}function Mk(r,e,t,n,i){if(Array.isArray(t)){let o=[];for(let s=0;s<t.length;s++)o[s]=iP(r[s],e[s],t[s],n,i);return o}return iP(r,e,t,n,i)}function oP(r,e){if(Array.isArray(r)){let t=0;for(let n=0;n<r.length;n++){let i=r[n]-e[n];t+=i*i}return Math.sqrt(t)}return Math.abs(r-e)}var Ks=class extends ct{get value(){return this._currValue}_onUpdate(){let{fromValue:e,toValue:t,damping:n,stiffness:i}=this.settings,{_prevValue:o=e,_currValue:s=e}=this,a=Mk(o,s,t,n,i),c=oP(a,t),l=oP(a,s);c<nP&&l<nP&&(a=t,this.end()),this._prevValue=s,this._currValue=a}};var Rk={interpolation:Xs,spring:Ks},Qs=class{constructor(e){this.transitions=new Map,this.timeline=e}get active(){return this.transitions.size>0}add(e,t,n,i){let{transitions:o}=this;if(o.has(e)){let c=o.get(e),{value:l=c.settings.fromValue}=c;t=l,this.remove(e)}if(i=eu(i),!i)return;let s=Rk[i.type];if(!s){F.error(`unsupported transition type '${i.type}'`)();return}let a=new s(this.timeline);a.start({...i,fromValue:t,toValue:n}),o.set(e,a)}remove(e){let{transitions:t}=this;t.has(e)&&(t.get(e).cancel(),t.delete(e))}update(){let e={};for(let[t,n]of this.transitions)n.update(),e[t]=n.value,n.inProgress||this.remove(t);return e}clear(){for(let e of this.transitions.keys())this.remove(e)}};function aP(r){let e=r[Ct];for(let t in e){let n=e[t],{validate:i}=n;if(i&&!i(r[t],n))throw new Error(`Invalid prop ${t}: ${r[t]}`)}}function cP(r,e){let t=lP({newProps:r,oldProps:e,propTypes:r[Ct],ignoreProps:{data:null,updateTriggers:null,extensions:null,transitions:null}}),n=Ok(r,e),i=!1;return n||(i=Bk(r,e)),{dataChanged:n,propsChanged:t,updateTriggersChanged:i,extensionsChanged:Dk(r,e),transitionsChanged:Ik(r,e)}}function Ik(r,e){if(!r.transitions)return!1;let t={},n=r[Ct],i=!1;for(let o in r.transitions){let s=n[o],a=s&&s.type;(a==="number"||a==="color"||a==="array")&&Dm(r[o],e[o],s)&&(t[o]=!0,i=!0)}return i?t:!1}function lP({newProps:r,oldProps:e,ignoreProps:t={},propTypes:n={},triggerName:i="props"}){if(e===r)return!1;if(typeof r!="object"||r===null)return`${i} changed shallowly`;if(typeof e!="object"||e===null)return`${i} changed shallowly`;for(let o of Object.keys(r))if(!(o in t)){if(!(o in e))return`${i}.${o} added`;let s=Dm(r[o],e[o],n[o]);if(s)return`${i}.${o} ${s}`}for(let o of Object.keys(e))if(!(o in t)){if(!(o in r))return`${i}.${o} dropped`;if(!Object.hasOwnProperty.call(r,o)){let s=Dm(r[o],e[o],n[o]);if(s)return`${i}.${o} ${s}`}}return!1}function Dm(r,e,t){let n=t&&t.equal;return n&&!n(r,e,t)||!n&&(n=r&&e&&r.equals,n&&!n.call(r,e))?"changed deeply":!n&&e!==r?"changed shallowly":null}function Ok(r,e){if(e===null)return"oldProps is null, initial diff";let t=!1,{dataComparator:n,_dataDiff:i}=r;return n?n(r.data,e.data)||(t="Data comparator detected a change"):r.data!==e.data&&(t="A new data container was supplied"),t&&i&&(t=i(r.data,e.data)||t),t}function Bk(r,e){if(e===null)return{all:!0};if("all"in r.updateTriggers&&sP(r,e,"all"))return{all:!0};let t={},n=!1;for(let i in r.updateTriggers)i!=="all"&&sP(r,e,i)&&(t[i]=!0,n=!0);return n?t:!1}function Dk(r,e){if(e===null)return!0;let t=e.extensions,{extensions:n}=r;if(n===t)return!1;if(!t||!n||n.length!==t.length)return!0;for(let i=0;i<n.length;i++)if(!n[i].equals(t[i]))return!0;return!1}function sP(r,e,t){let n=r.updateTriggers[t];n=n??{};let i=e.updateTriggers[t];return i=i??{},lP({oldProps:i,newProps:n,triggerName:t})}var kk="count(): argument not an object",Nk="count(): argument not a container";function uP(r){if(!Uk(r))throw new Error(kk);if(typeof r.count=="function")return r.count();if(Number.isFinite(r.size))return r.size;if(Number.isFinite(r.length))return r.length;if(Fk(r))return Object.keys(r).length;throw new Error(Nk)}function Fk(r){return r!==null&&typeof r=="object"&&r.constructor===Object}function Uk(r){return r!==null&&typeof r=="object"}function km(r,e){if(!e)return r;let t={...r,...e};if("defines"in e&&(t.defines={...r.defines,...e.defines}),"modules"in e&&(t.modules=(r.modules||[]).concat(e.modules),e.modules.some(n=>n.name==="project64"))){let n=t.modules.findIndex(i=>i.name==="project32");n>=0&&t.modules.splice(n,1)}if("inject"in e)if(!r.inject)t.inject=e.inject;else{let n={...r.inject};for(let i in e.inject)n[i]=(n[i]||"")+e.inject[i];t.inject=n}return t}I();var Gk={minFilter:"linear",mipmapFilter:"linear",magFilter:"linear",addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge"},Nm={};function fP(r,e,t,n){if(t instanceof z)return t;t.constructor&&t.constructor.name!=="Object"&&(t={data:t});let i=null;t.compressed&&(i={minFilter:"linear",mipmapFilter:t.data.length>1?"nearest":"linear"});let{width:o,height:s}=t.data,a=e.createTexture({...t,sampler:{...Gk,...i,...n},mipLevels:e.getMipLevelCount(o,s)});return e.type==="webgl"?a.generateMipmapsWebGL():e.type==="webgpu"&&e.generateMipmapsWebGPU(a),Nm[a.id]=r,a}function dP(r,e){!e||!(e instanceof z)||Nm[e.id]===r&&(e.delete(),delete Nm[e.id])}var zk={boolean:{validate(r,e){return!0},equal(r,e,t){return!!r==!!e}},number:{validate(r,e){return Number.isFinite(r)&&(!("max"in e)||r<=e.max)&&(!("min"in e)||r>=e.min)}},color:{validate(r,e){return e.optional&&!r||Fm(r)&&(r.length===3||r.length===4)},equal(r,e,t){return J(r,e,1)}},accessor:{validate(r,e){let t=Pu(r);return t==="function"||t===Pu(e.value)},equal(r,e,t){return typeof e=="function"?!0:J(r,e,1)}},array:{validate(r,e){return e.optional&&!r||Fm(r)},equal(r,e,t){let{compare:n}=t,i=Number.isInteger(n)?n:n?1:0;return n?J(r,e,i):r===e}},object:{equal(r,e,t){if(t.ignore)return!0;let{compare:n}=t,i=Number.isInteger(n)?n:n?1:0;return n?J(r,e,i):r===e}},function:{validate(r,e){return e.optional&&!r||typeof r=="function"},equal(r,e,t){return!t.compare&&t.ignore!==!1||r===e}},data:{transform:(r,e,t)=>{if(!r)return r;let{dataTransform:n}=t.props;return n?n(r):typeof r.shape=="string"&&r.shape.endsWith("-table")&&Array.isArray(r.data)?r.data:r}},image:{transform:(r,e,t)=>{let n=t.context;return!n||!n.device?null:fP(t.id,n.device,r,{...e.parameters,...t.props.textureParameters})},release:(r,e,t)=>{dP(t.id,r)}}};function hP(r){let e={},t={},n={};for(let[i,o]of Object.entries(r)){let s=o?.deprecatedFor;if(s)n[i]=Array.isArray(s)?s:[s];else{let a=$k(i,o);e[i]=a,t[i]=a.value}}return{propTypes:e,defaultProps:t,deprecatedProps:n}}function $k(r,e){switch(Pu(e)){case"object":return Js(r,e);case"array":return Js(r,{type:"array",value:e,compare:!1});case"boolean":return Js(r,{type:"boolean",value:e});case"number":return Js(r,{type:"number",value:e});case"function":return Js(r,{type:"function",value:e,compare:!0});default:return{name:r,type:"unknown",value:e}}}function Js(r,e){return"type"in e?{name:r,...zk[e.type],...e}:"value"in e?{name:r,type:Pu(e.value),...e}:{name:r,type:"object",value:e}}function Fm(r){return Array.isArray(r)||ArrayBuffer.isView(r)}function Pu(r){return Fm(r)?"array":r===null?"null":typeof r}function pP(r,e){let t;for(let o=e.length-1;o>=0;o--){let s=e[o];"extensions"in s&&(t=s.extensions)}let n=Um(r.constructor,t),i=Object.create(n);i[vi]=r,i[Mt]={},i[at]={};for(let o=0;o<e.length;++o){let s=e[o];for(let a in s)i[a]=s[a]}return Object.freeze(i),i}var Vk="_mergedDefaultProps";function Um(r,e){if(!(r instanceof Su.constructor))return{};let t=Vk;if(e)for(let i of e){let o=i.constructor;o&&(t+=`:${o.extensionName||o.name}`)}let n=mP(r,t);return n||(r[t]=Wk(r,e||[]))}function Wk(r,e){if(!r.prototype)return null;let n=Object.getPrototypeOf(r),i=Um(n),o=mP(r,"defaultProps")||{},s=hP(o),a=Object.assign(Object.create(null),i,s.defaultProps),c=Object.assign(Object.create(null),i?.[Ct],s.propTypes),l=Object.assign(Object.create(null),i?.[ll],s.deprecatedProps);for(let u of e){let f=Um(u.constructor);f&&(Object.assign(a,f),Object.assign(c,f[Ct]),Object.assign(l,f[ll]))}return jk(a,r),Yk(a,c),Hk(a,l),a[Ct]=c,a[ll]=l,e.length===0&&!Gm(r,"_propTypes")&&(r._propTypes=c),a}function jk(r,e){let t=Zk(e);Object.defineProperties(r,{id:{writable:!0,value:t}})}function Hk(r,e){for(let t in e)Object.defineProperty(r,t,{enumerable:!1,set(n){let i=`${this.id}: ${t}`;for(let o of e[t])Gm(this,o)||(this[o]=n);F.deprecated(i,e[t].join("/"))()}})}function Yk(r,e){let t={},n={};for(let i in e){let o=e[i],{name:s,value:a}=o;o.async&&(t[s]=a,n[s]=qk(s))}r[Xt]=t,r[Mt]={},Object.defineProperties(r,n)}function qk(r){return{enumerable:!0,set(e){typeof e=="string"||e instanceof Promise||Ql(e)?this[Mt][r]=e:this[at][r]=e},get(){if(this[at]){if(r in this[at])return this[at][r]||this[Xt][r];if(r in this[Mt]){let e=this[vi]&&this[vi].internalState;if(e&&e.hasAsyncProp(r))return e.getAsyncProp(r)||this[Xt][r]}}return this[Xt][r]}}}function Gm(r,e){return Object.prototype.hasOwnProperty.call(r,e)}function mP(r,e){return Gm(r,e)&&r[e]}function Zk(r){let e=r.componentName;return e||F.warn(`${r.name}.componentName not specified`)(),e||r.name}var Xk=0,ea=class{constructor(...e){this.props=pP(this,e),this.id=this.props.id,this.count=Xk++}clone(e){let{props:t}=this,n={};for(let i in t[Xt])i in t[at]?n[i]=t[at][i]:i in t[Mt]&&(n[i]=t[Mt][i]);return new this.constructor({...t,...n,...e})}};ea.componentName="Component";ea.defaultProps={};var Su=ea;var Kk=Object.freeze({}),ta=class{constructor(e){this.component=e,this.asyncProps={},this.onAsyncPropUpdated=()=>{},this.oldProps=null,this.oldAsyncProps=null}finalize(){for(let e in this.asyncProps){let t=this.asyncProps[e];t&&t.type&&t.type.release&&t.type.release(t.resolvedValue,t.type,this.component)}this.asyncProps={},this.component=null,this.resetOldProps()}getOldProps(){return this.oldAsyncProps||this.oldProps||Kk}resetOldProps(){this.oldAsyncProps=null,this.oldProps=this.component?this.component.props:null}hasAsyncProp(e){return e in this.asyncProps}getAsyncProp(e){let t=this.asyncProps[e];return t&&t.resolvedValue}isAsyncPropLoading(e){if(e){let t=this.asyncProps[e];return!!(t&&t.pendingLoadCount>0&&t.pendingLoadCount!==t.resolvedLoadCount)}for(let t in this.asyncProps)if(this.isAsyncPropLoading(t))return!0;return!1}reloadAsyncProp(e,t){this._watchPromise(e,Promise.resolve(t))}setAsyncProps(e){this.component=e[vi]||this.component;let t=e[at]||{},n=e[Mt]||e,i=e[Xt]||{};for(let o in t){let s=t[o];this._createAsyncPropData(o,i[o]),this._updateAsyncProp(o,s),t[o]=this.getAsyncProp(o)}for(let o in n){let s=n[o];this._createAsyncPropData(o,i[o]),this._updateAsyncProp(o,s)}}_fetch(e,t){return null}_onResolve(e,t){}_onError(e,t){}_updateAsyncProp(e,t){if(this._didAsyncInputValueChange(e,t)){if(typeof t=="string"&&(t=this._fetch(e,t)),t instanceof Promise){this._watchPromise(e,t);return}if(Ql(t)){this._resolveAsyncIterable(e,t);return}this._setPropValue(e,t)}}_freezeAsyncOldProps(){if(!this.oldAsyncProps&&this.oldProps){this.oldAsyncProps=Object.create(this.oldProps);for(let e in this.asyncProps)Object.defineProperty(this.oldAsyncProps,e,{enumerable:!0,value:this.oldProps[e]})}}_didAsyncInputValueChange(e,t){let n=this.asyncProps[e];return t===n.resolvedValue||t===n.lastValue?!1:(n.lastValue=t,!0)}_setPropValue(e,t){this._freezeAsyncOldProps();let n=this.asyncProps[e];n&&(t=this._postProcessValue(n,t),n.resolvedValue=t,n.pendingLoadCount++,n.resolvedLoadCount=n.pendingLoadCount)}_setAsyncPropValue(e,t,n){let i=this.asyncProps[e];i&&n>=i.resolvedLoadCount&&t!==void 0&&(this._freezeAsyncOldProps(),i.resolvedValue=t,i.resolvedLoadCount=n,this.onAsyncPropUpdated(e,t))}_watchPromise(e,t){let n=this.asyncProps[e];if(n){n.pendingLoadCount++;let i=n.pendingLoadCount;t.then(o=>{this.component&&(o=this._postProcessValue(n,o),this._setAsyncPropValue(e,o,i),this._onResolve(e,o))}).catch(o=>{this._onError(e,o)})}}async _resolveAsyncIterable(e,t){if(e!=="data"){this._setPropValue(e,t);return}let n=this.asyncProps[e];if(!n)return;n.pendingLoadCount++;let i=n.pendingLoadCount,o=[],s=0;for await(let a of t){if(!this.component)return;let{dataTransform:c}=this.component.props;c?o=c(a,o):o=o.concat(a),Object.defineProperty(o,"__diff",{enumerable:!1,value:[{startRow:s,endRow:o.length}]}),s=o.length,this._setAsyncPropValue(e,o,i)}this._onResolve(e,o)}_postProcessValue(e,t){let n=e.type;return n&&this.component&&(n.release&&n.release(e.resolvedValue,n,this.component),n.transform)?n.transform(t,n,this.component):t}_createAsyncPropData(e,t){if(!this.asyncProps[e]){let i=this.component&&this.component.props[Ct];this.asyncProps[e]={type:i&&i[e],lastValue:null,resolvedValue:t,pendingLoadCount:0,resolvedLoadCount:0}}}};var ra=class extends ta{constructor({attributeManager:e,layer:t}){super(t),this.attributeManager=e,this.needsRedraw=!0,this.needsUpdate=!0,this.subLayers=null,this.usesPickingColorCache=!1,this.disabledPickingIndices=[]}get layer(){return this.component}_fetch(e,t){let n=this.layer,i=n?.props.fetch;return i?i(t,{propName:e,layer:n}):super._fetch(e,t)}_onResolve(e,t){let n=this.layer;if(n){let i=n.props.onDataLoad;e==="data"&&i&&i(t,{propName:e,layer:n})}}_onError(e,t){let n=this.layer;n&&n.raiseError(t,`loading ${e} of ${this.layer}`)}};var Qk="layer.changeFlag",Jk="layer.initialize",e4="layer.update",t4="layer.finalize",r4="layer.matched",gP=2**24-1,n4=Object.freeze([]),i4=Tt(({oldViewport:r,viewport:e})=>r.equals(e)),et=new Uint8ClampedArray(0);function _P(r){return r.rowIndexes||r.pickingColors||r.instancePickingColors}function zm(r){return r.rowIndexes}function $m(r){return r.pickingColors||r.instancePickingColors}var o4={data:{type:"data",value:n4,async:!0},dataComparator:{type:"function",value:null,optional:!0},_dataDiff:{type:"function",value:r=>r&&r.__diff,optional:!0},dataTransform:{type:"function",value:null,optional:!0},onDataLoad:{type:"function",value:null,optional:!0},onError:{type:"function",value:null,optional:!0},fetch:{type:"function",value:(r,{propName:e,layer:t,loaders:n,loadOptions:i,signal:o})=>{let{resourceManager:s}=t.context;i=i||t.getLoadOptions(),n=n||t.props.loaders,o&&(i={...i,core:{...i?.core,fetch:{...i?.core?.fetch,signal:o}}});let a=s.contains(r);return!a&&!i&&(s.add({resourceId:r,data:Fn(r,n),persistent:!1}),a=!0),a?s.subscribe({resourceId:r,onChange:c=>t.internalState?.reloadAsyncProp(e,c),consumerId:t.id,requestId:e}):Fn(r,n,i)}},updateTriggers:{},visible:!0,pickable:!1,opacity:{type:"number",min:0,max:1,value:1},operation:"draw",onHover:{type:"function",value:null,optional:!0},onClick:{type:"function",value:null,optional:!0},onDragStart:{type:"function",value:null,optional:!0},onDrag:{type:"function",value:null,optional:!0},onDragEnd:{type:"function",value:null,optional:!0},coordinateSystem:"default",coordinateOrigin:{type:"array",value:[0,0,0],compare:!0},modelMatrix:{type:"array",value:null,compare:!0,optional:!0},wrapLongitude:!1,positionFormat:"XYZ",colorFormat:"RGBA",parameters:{type:"object",value:{},optional:!0,compare:2},loadOptions:{type:"object",value:null,optional:!0,ignore:!0},transitions:null,extensions:[],loaders:{type:"array",value:[],optional:!0,ignore:!0},getPolygonOffset:{type:"function",value:({layerIndex:r})=>[0,-r*100]},highlightedObjectIndex:null,autoHighlight:!1,highlightColor:{type:"accessor",value:[0,0,128,128]}},na=class extends Su{constructor(){super(...arguments),this.internalState=null,this.lifecycle=Pr.NO_STATE,this.parent=null}static get componentName(){return Object.prototype.hasOwnProperty.call(this,"layerName")?this.layerName:""}get root(){let e=this;for(;e.parent;)e=e.parent;return e}toString(){return`${this.constructor.layerName||this.constructor.name}({id: '${this.props.id}'})`}project(e){U(this.internalState);let t=this.internalState.viewport||this.context.viewport,n=ol(e,{viewport:t,modelMatrix:this.props.modelMatrix,coordinateOrigin:this.props.coordinateOrigin,coordinateSystem:this.props.coordinateSystem}),[i,o,s]=vr(n,t.pixelProjectionMatrix);return e.length===2?[i,o]:[i,o,s]}unproject(e){return U(this.internalState),(this.internalState.viewport||this.context.viewport).unproject(e)}projectPosition(e,t){U(this.internalState);let n=this.internalState.viewport||this.context.viewport;return rv(e,{viewport:n,modelMatrix:this.props.modelMatrix,coordinateOrigin:this.props.coordinateOrigin,coordinateSystem:this.props.coordinateSystem,...t})}get isComposite(){return!1}get isDrawable(){return!0}setState(e){this.setChangeFlags({stateChanged:!0}),Object.assign(this.state,e),this.setNeedsRedraw()}setNeedsRedraw(){this.internalState&&(this.internalState.needsRedraw=!0)}setNeedsUpdate(){this.internalState&&(this.context.layerManager.setNeedsUpdate(String(this)),this.internalState.needsUpdate=!0)}get isLoaded(){return this.internalState?!this.internalState.isAsyncPropLoading():!1}get wrapLongitude(){return this.props.wrapLongitude}isPickable(){return this.props.pickable&&this.props.visible}getModels(){let e=this.state;return e&&(e.models||e.model&&[e.model])||[]}setShaderModuleProps(...e){for(let t of this.getModels())t.shaderInputs.setProps(...e)}getAttributeManager(){return this.internalState&&this.internalState.attributeManager}getCurrentLayer(){return this.internalState&&this.internalState.layer}getLoadOptions(){return this.props.loadOptions}use64bitPositions(){let{coordinateSystem:e}=this.props;return e==="default"||e==="lnglat"||e==="cartesian"}onHover(e,t){return this.props.onHover&&this.props.onHover(e,t)||!1}onClick(e,t){return this.props.onClick&&this.props.onClick(e,t)||!1}nullPickingColor(){return[0,0,0]}encodePickingColor(e,t=[]){return t[0]=e+1&255,t[1]=e+1>>8&255,t[2]=e+1>>8>>8&255,t}decodePickingColor(e){U(e instanceof Uint8Array);let[t,n,i]=e;return t+n*256+i*65536-1}getNumInstances(){return Number.isFinite(this.props.numInstances)?this.props.numInstances:this.state&&this.state.numInstances!==void 0?this.state.numInstances:uP(this.props.data)}getStartIndices(){return this.props.startIndices?this.props.startIndices:this.state&&this.state.startIndices?this.state.startIndices:null}getBounds(){return this.getAttributeManager()?.getBounds(["positions","instancePositions"])}getShaders(e){e=km(e,{disableWarnings:!0,modules:this.context.defaultShaderModules});for(let t of this.props.extensions)e=km(e,t.getShaders.call(this,t));return e}shouldUpdateState(e){return e.changeFlags.propsOrDataChanged}updateState(e){let t=this.getAttributeManager(),{dataChanged:n}=e.changeFlags;if(n&&t)if(Array.isArray(n))for(let i of n)t.invalidateAll(i);else t.invalidateAll();if(t){let{props:i}=e,o=this.internalState.hasPickingBuffer,s=Number.isInteger(i.highlightedObjectIndex)||!!i.pickable||i.extensions.some(a=>a.getNeedsPickingBuffer.call(this,a));if(o!==s){this.internalState.hasPickingBuffer=s;let a=_P(t.attributes);a&&(s&&a.constant&&(a.constant=!1,t.invalidate(a.id)),!a.value&&!s&&(a.constant=!0,a.value=zm(t.attributes)?[rs]:[0,0,0]))}}}finalizeState(e){for(let n of this.getModels())n.destroy();let t=this.getAttributeManager();t&&t.finalize(),this.context&&this.context.resourceManager.unsubscribe({consumerId:this.id}),this.internalState&&(this.internalState.uniformTransitions.clear(),this.internalState.finalize())}draw(e){for(let t of this.getModels())t.draw(e.renderPass)}getPickingInfo({info:e,mode:t,sourceLayer:n}){let{index:i}=e;return i>=0&&Array.isArray(this.props.data)&&(e.object=this.props.data[i]),e}raiseError(e,t){t&&(e=new Error(`${t}: ${e.message}`,{cause:e})),this.props.onError?.(e)||this.context?.onError?.(e,this)}getNeedsRedraw(e={clearRedrawFlags:!1}){return this._getNeedsRedraw(e)}needsUpdate(){return this.internalState?this.internalState.needsUpdate||this.hasUniformTransition()||this.shouldUpdateState(this._getUpdateParams()):!1}hasUniformTransition(){return this.internalState?.uniformTransitions.active||!1}activateViewport(e){if(!this.internalState)return;let t=this.internalState.viewport;this.internalState.viewport=e,(!t||!i4({oldViewport:t,viewport:e}))&&(this.setChangeFlags({viewportChanged:!0}),this.isComposite?this.needsUpdate()&&this.setNeedsUpdate():this._update())}invalidateAttribute(e="all"){let t=this.getAttributeManager();t&&(e==="all"?t.invalidateAll():t.invalidate(e))}updateAttributes(e){let t=!1;for(let n in e)e[n].layoutChanged()&&(t=!0);for(let n of this.getModels())this._setModelAttributes(n,e,t)}_updateAttributes(){let e=this.getAttributeManager();if(!e)return;let t=this.props,n=this.getNumInstances(),i=this.getStartIndices();e.update({data:t.data,numInstances:n,startIndices:i,props:t,transitions:t.transitions,buffers:t.data.attributes,context:this});let o=e.getChangedAttributes({clearChangedFlags:!0});this.updateAttributes(o)}_updateAttributeTransition(){let e=this.getAttributeManager();e&&e.updateTransition()}_updateUniformTransition(){let{uniformTransitions:e}=this.internalState;if(e.active){let t=e.update(),n=Object.create(this.props);for(let i in t)Object.defineProperty(n,i,{value:t[i]});return n}return this.props}calculateInstancePickingColors(e,{numInstances:t}){if(e.constant)return;let n=Math.floor(et.length/4);this.internalState.usesPickingColorCache=!0;let i=t>0&&et[0]===0;if(n<t||i){t>gP&&F.warn("Layer has too many data objects. Picking might not be able to distinguish all objects.")(),et=st.allocate(et,t,{size:4,copy:!0,maxCount:Math.max(t,gP)});let o=Math.floor(et.length/4),s=[0,0,0],a=i?0:n;for(let c=a;c<o;c++)this.encodePickingColor(c,s),et[c*4+0]=s[0],et[c*4+1]=s[1],et[c*4+2]=s[2],et[c*4+3]=0}e.value=et.subarray(0,t*4)}_setModelAttributes(e,t,n=!1){if(!Object.keys(t).length)return;let i=this.getAttributeManager();if(i?.hasBufferGroups()){this._setGroupedModelAttributes(e,i,t);return}if(n){let c=this.getAttributeManager();e.setBufferLayout(c.getBufferLayouts(e)),t=c.getAttributes()}let o=e.userData?.excludeAttributes||{},s={},a={};for(let c in t){if(o[c])continue;let l=t[c].getValue();for(let u in l){let f=l[u];f instanceof D?t[c].settings.isIndexed?e.setIndexBuffer(f):s[u]=f:f&&(a[u]=f)}}e.setAttributes(s),e.setConstantAttributes(a)}_setGroupedModelAttributes(e,t,n){let i=e.userData?.excludeAttributes||{},o=t.getBufferGroupBindings(n,e,i);e.setBufferLayout(o.bufferLayouts);let s={...o.buffers},a={},c=t.getAttributes();for(let l in c){if(i[l]||o.groupedAttributeIds.has(l))continue;let u=c[l],f=u.getValue();for(let d in f){let h=f[d];h instanceof D?u.settings.isIndexed?e.setIndexBuffer(h):s[d]=h:h&&(a[d]=h)}}e.setAttributes(s),e.setConstantAttributes(a)}disablePickingIndex(e){let t=this.props.data;if(!("attributes"in t)){this._disablePickingIndex(e);return}let n=this.getAttributeManager().attributes,i=zm(n),o=$m(n),s=i&&t.attributes&&t.attributes[i.id];if(s&&s.value){let c=s.value;for(let l=0;l<t.length;l++){let u=i.getVertexOffset(l);c[u]===e&&this._disablePickingIndex(l)}return}let a=o&&t.attributes&&t.attributes[o.id];if(a&&a.value){let c=a.value,l=this.encodePickingColor(e);for(let u=0;u<t.length;u++){let f=o.getVertexOffset(u);c[f]===l[0]&&c[f+1]===l[1]&&c[f+2]===l[2]&&this._disablePickingIndex(u)}}else this._disablePickingIndex(e)}_disablePickingIndex(e){let t=this.getAttributeManager().attributes,n=zm(t);if(n){let a=n.getVertexOffset(e),c=n.getVertexOffset(e+1),l=new Uint32Array(c-a);l.fill(rs),n.buffer.write(l,a*l.BYTES_PER_ELEMENT);return}let i=$m(t);if(!i){this.internalState&&j0(this.internalState.disabledPickingIndices,e);return}let o=i.getVertexOffset(e),s=i.getVertexOffset(e+1);i.buffer.write(new Uint8Array(s-o),o)}restorePickingColors(){let e=this.getAttributeManager().attributes,t=_P(e);if(!t){this.internalState&&(this.internalState.disabledPickingIndices.length=0);return}let n=$m(e);this.internalState.usesPickingColorCache&&n&&n.value.buffer!==et.buffer&&(n.value=et.subarray(0,n.value.length)),t.updateSubBuffer({startOffset:0})}_initialize(){U(!this.internalState),ie(Jk,this);let e=this._getAttributeManager();this.internalState=new ra({attributeManager:e,layer:this}),this._clearChangeFlags(),this.state={},Object.defineProperty(this.state,"attributeManager",{get:()=>(F.deprecated("layer.state.attributeManager","layer.getAttributeManager()")(),e)}),this.internalState.uniformTransitions=new Qs(this.context.timeline),this.internalState.onAsyncPropUpdated=this._onAsyncPropUpdated.bind(this),this.internalState.setAsyncProps(this.props),this.initializeState(this.context);for(let t of this.props.extensions)t.initializeState.call(this,this.context,t);this.setChangeFlags({dataChanged:"init",propsChanged:"init",viewportChanged:!0,extensionsChanged:!0}),this._update()}_transferState(e){ie(r4,this,this===e);let{state:t,internalState:n}=e;this!==e&&(this.internalState=n,this.state=t,this.internalState.setAsyncProps(this.props),this._diffProps(this.props,this.internalState.getOldProps()))}_update(){let e=this.needsUpdate();if(ie(e4,this,e),!e)return;this.context.stats.get("Layer updates").incrementCount();let t=this.props,n=this.context,i=this.internalState,o=n.viewport,s=this._updateUniformTransition();i.propsInTransition=s,n.viewport=i.viewport||o,this.props=s;try{let a=this._getUpdateParams(),c=this.getModels();if(n.device)this.updateState(a);else try{this.updateState(a)}catch{}for(let u of this.props.extensions)u.updateState.call(this,a,u);this.setNeedsRedraw(),this._updateAttributes();let l=this.getModels()[0]!==c[0];this._postUpdate(a,l)}finally{n.viewport=o,this.props=t,this._clearChangeFlags(),i.needsUpdate=!1,i.resetOldProps()}}_finalize(){ie(t4,this),this.finalizeState(this.context);for(let e of this.props.extensions)e.finalizeState.call(this,this.context,e)}_drawLayer({renderPass:e,shaderModuleProps:t=null,uniforms:n={},parameters:i={}}){this._updateAttributeTransition();let o=this.props,s=this.context;this.props=this.internalState.propsInTransition||o;try{t&&this.setShaderModuleProps(t);let{getPolygonOffset:a}=this.props,c=a&&a(n)||[0,0];s.device instanceof Tr&&s.device.setParametersWebGL({polygonOffset:c});let l=s.device instanceof Tr?null:s4(i);if(a4(this.getModels(),e,i,l),s.device instanceof Tr)s.device.withParametersWebGL(i,()=>{let u={renderPass:e,shaderModuleProps:t,uniforms:n,parameters:i,context:s};for(let f of this.props.extensions)f.draw.call(this,u,f);this.draw(u)});else{l?.renderPassParameters&&e.setParameters(l.renderPassParameters);let u={renderPass:e,shaderModuleProps:t,uniforms:n,parameters:i,context:s};for(let f of this.props.extensions)f.draw.call(this,u,f);this.draw(u)}}finally{this.props=o}}getChangeFlags(){return this.internalState?.changeFlags}setChangeFlags(e){if(!this.internalState)return;let{changeFlags:t}=this.internalState;for(let i in e)if(e[i]){let o=!1;switch(i){case"dataChanged":let s=e[i],a=t[i];s&&Array.isArray(a)&&(t.dataChanged=Array.isArray(s)?a.concat(s):s,o=!0);default:t[i]||(t[i]=e[i],o=!0)}o&&ie(Qk,this,i,e)}let n=!!(t.dataChanged||t.updateTriggersChanged||t.propsChanged||t.extensionsChanged);t.propsOrDataChanged=n,t.somethingChanged=n||t.viewportChanged||t.stateChanged}_clearChangeFlags(){this.internalState.changeFlags={dataChanged:!1,propsChanged:!1,updateTriggersChanged:!1,viewportChanged:!1,stateChanged:!1,extensionsChanged:!1,propsOrDataChanged:!1,somethingChanged:!1}}_diffProps(e,t){let n=cP(e,t);if(n.updateTriggersChanged)for(let i in n.updateTriggersChanged)n.updateTriggersChanged[i]&&this.invalidateAttribute(i);if(n.transitionsChanged)for(let i in n.transitionsChanged)this.internalState.uniformTransitions.add(i,t[i],e[i],e.transitions?.[i]);return this.setChangeFlags(n)}validateProps(){aP(this.props)}updateAutoHighlight(e){this.props.autoHighlight&&!Number.isInteger(this.props.highlightedObjectIndex)&&this._updateAutoHighlight(e)}_updateAutoHighlight(e){let t={highlightedObjectColor:e.picked?e.color:null},{highlightColor:n}=this.props;e.picked&&typeof n=="function"&&(t.highlightColor=n(e)),this.setShaderModuleProps({picking:t}),this.setNeedsRedraw()}_getAttributeManager(){let e=this.context;return new Zs(e.device,{id:this.props.id,stats:e.stats,timeline:e.timeline})}_postUpdate(e,t){let{props:n,oldProps:i}=e,o=this.state.model;o?.isInstanced&&o.setInstanceCount(this.getNumInstances());let{autoHighlight:s,highlightedObjectIndex:a,highlightColor:c}=n;if(t||i.autoHighlight!==s||i.highlightedObjectIndex!==a||i.highlightColor!==c){let l={};Array.isArray(c)&&(l.highlightColor=c),(t||i.autoHighlight!==s||a!==i.highlightedObjectIndex)&&(l.highlightedObjectColor=Number.isFinite(a)&&a>=0?this.encodePickingColor(a):null),this.setShaderModuleProps({picking:l})}}_getUpdateParams(){return{props:this.props,oldProps:this.internalState.getOldProps(),context:this.context,changeFlags:this.internalState.changeFlags}}_getNeedsRedraw(e){if(!this.internalState)return!1;let t=!1;t=t||this.internalState.needsRedraw&&this.id;let n=this.getAttributeManager(),i=n?n.getNeedsRedraw(e):!1;if(t=t||i,t)for(let o of this.props.extensions)o.onNeedsRedraw.call(this,o);return this.internalState.needsRedraw=this.internalState.needsRedraw&&!e.clearRedrawFlags,t}_onAsyncPropUpdated(){this._diffProps(this.props,this.internalState.getOldProps()),this.setNeedsUpdate()}};na.defaultProps=o4;na.layerName="Layer";var Cn=na;function s4(r){let{blendConstant:e,...t}=r;return e?{pipelineParameters:t,renderPassParameters:{blendConstant:e}}:{pipelineParameters:t}}function a4(r,e,t,n){for(let i of r)i.device.type==="webgpu"?(c4(i,e),i.setParameters({...i.parameters,...n?.pipelineParameters})):i.setParameters(t)}function c4(r,e){let t=e.props.framebuffer||(e.framebuffer??null);if(!t)return;let n=t.colorAttachments.map(s=>s?.texture?.format??null),i=t.depthStencilAttachment?.texture?.format,o=r;(!l4(o.props.colorAttachmentFormats,n)||o.props.depthStencilAttachmentFormat!==i)&&(o.props.colorAttachmentFormats=n,o.props.depthStencilAttachmentFormat=i,o._setPipelineNeedsUpdate("attachment formats"))}function l4(r,e){if(r===e)return!0;if(!r||!e||r.length!==e.length)return!1;for(let t=0;t<r.length;t++)if(r[t]!==e[t])return!1;return!0}le();var Fi=Math.PI/180,yP=180/Math.PI,u4=1,Tu=6370972,ir=256,bP=.75,xP=1.15;function vP(r){let e=qt(r+180,360)-180;return Math.abs(e)<u4}function f4(){let r=ir/Tu,e=Math.PI/180*ir;return{unitsPerMeter:[r,r,r],unitsPerMeter2:[0,0,0],metersPerUnit:[1/r,1/r,1/r],unitsPerDegree:[e,e,r],unitsPerDegree2:[0,0,0],degreesPerUnit:[1/e,1/e,1/r]}}var Lu=class extends mi{constructor(e={}){let{longitude:t=0,bearing:n=0,pitch:i=0,zoom:o=0,nearZMultiplier:s=.5,farZMultiplier:a=1,resolution:c=10}=e,{latitude:l=0,height:u,altitude:f=1.5,fovy:d}=e;l=Math.max(Math.min(l,90),-90),u=u||1,d?f=hn(d):d=Ht(f);let h=Math.max(Math.min(l,Re),-Re),p=Math.pow(2,o-ue(h)),m=i*Fi,g=e.nearZ??s,b=e.farZ??(f+ir*2*p/u/Math.max(Math.cos(m),.1))*a,y=new ce().lookAt({eye:[0,-f,0],up:[0,0,1]}).rotateX(-m).rotateY(-n*Fi).rotateX(l*Fi).rotateZ(-t*Fi).scale(p/u);super({...e,height:u,viewMatrix:y,longitude:t,latitude:l,zoom:o,distanceScales:f4(),fovy:d,focalDistance:f,near:g,far:b}),this.scale=p,this.latitude=l,this.longitude=t,this.bearing=n,this.pitch=i,this.fovy=d,this.resolution=c}get projectionMode(){return oe.GLOBE}getDistanceScales(){return this.distanceScales}getBounds(e={}){let t={targetZ:e.z||0},n=this.unproject([0,this.height/2],t),i=this.unproject([this.width/2,0],t),o=this.unproject([this.width,this.height/2],t),s=this.unproject([this.width/2,this.height],t);return o[0]<this.longitude&&(o[0]+=360),n[0]>this.longitude&&(n[0]-=360),[Math.min(n[0],o[0],i[0],s[0]),Math.min(n[1],o[1],i[1],s[1]),Math.max(n[0],o[0],i[0],s[0]),Math.max(n[1],o[1],i[1],s[1])]}_getRayToGlobe(e,{topLeft:t=!0,targetZ:n}={}){let[i,o]=e,s=t?o:this.height-o,{pixelUnprojectionMatrix:a}=this,c=Vm(a,[i,s,-1,1]),l=Vm(a,[i,s,1,1]),u=((n||0)/Tu+1)*ir,f=W.sqrLen(W.sub([],c,l)),d=W.sqrLen(c),h=W.sqrLen(l),m=4*((4*d*h-(f-d-h)**2)/16)/f;return{rayStartPosition:c,rayEndPosition:l,radius:u,rayLengthSquared:f,rayStartDistanceSquared:d,distanceToCenterSquared:m}}_getRayDistanceToGlobeCenterRatio(e,t){let{distanceToCenterSquared:n,radius:i}=this._getRayToGlobe(e,t);return Math.sqrt(Math.max(0,n))/i}getZoomAnchorStrength(e){let t=this._getRayDistanceToGlobeCenterRatio(e);if(t>=xP)return 0;let n=Math.max(0,Math.min(1,(t-bP)/(xP-bP)));return 1-n*n*(3-2*n)}unproject(e,{topLeft:t=!0,targetZ:n}={}){let[i,o,s]=e,a=t?o:this.height-o,{pixelUnprojectionMatrix:c}=this,l;if(Number.isFinite(s))l=Vm(c,[i,a,s,1]);else{let{rayStartPosition:h,rayEndPosition:p,radius:m,rayLengthSquared:g,rayStartDistanceSquared:b,distanceToCenterSquared:y}=this._getRayToGlobe(e,{topLeft:t,targetZ:n}),x=Math.sqrt(b-y),v=Math.sqrt(Math.max(0,m*m-y)),w=(x-v)/Math.sqrt(g);l=W.lerp([],h,p,w)}let[u,f,d]=this.unprojectPosition(l);return Number.isFinite(s)?[u,f,d]:Number.isFinite(n)?[u,f,n]:[u,f]}projectPosition(e){let[t,n,i=0]=e,o=t*Fi,s=n*Fi,a=Math.cos(s),c=(i/Tu+1)*ir;return[Math.sin(o)*a*c,-Math.cos(o)*a*c,Math.sin(s)*c]}unprojectPosition(e){let[t,n,i]=e,o=W.len(e),s=Math.asin(i/o),c=Math.atan2(t,-n)*yP,l=s*yP,u=(o/ir-1)*Tu;return[c,l,u]}projectFlat(e){return e}unprojectFlat(e){return e}panByPosition(e,t,n){if(!n){let d=this.getZoomAnchorStrength(t);if(d===0)return{longitude:this.longitude,latitude:this.latitude};let h=this.unproject(t),p=qt(e[0]-h[0]+180,360)-180,m=e[1]-h[1],g=Math.abs(h[1])>Re||Math.abs(p)>90;if(vP(this.bearing)&&g)return{longitude:this.longitude,latitude:this.latitude};if(vP(this.bearing)&&m!==0){let v=((m>0?Re:-Re)-this.latitude)/m;d=Math.min(d,Math.max(0,v))}let b=this.longitude+p*d,y=Math.max(Math.min(this.latitude+m*d,90),-90);return{longitude:b,latitude:y}}let[i,o,s]=e,c=.25/Math.pow(2,this.zoom-ue(this.latitude)),l=i+c*(n[0]-t[0]),u=o-c*(n[1]-t[1]);u=Math.max(Math.min(u,90),-90);let f={longitude:l,latitude:u,zoom:s-ue(o)};return f.zoom+=ue(f.latitude),f}};Lu.displayName="GlobeViewport";var wP=Lu;function ue(r,e){e&&(r=Math.max(Math.min(r,Re),-Re));let t=Math.PI*Math.cos(r*Math.PI/180);return Math.log2(t)}function Vm(r,e){let t=Ce.transformMat4([],e,r);return Ce.scale(t,t,1/t[3]),t}le();le();var Ui=Math.PI/180,Wm=180/Math.PI,je=class r{static toPosition(e,t){let n=t*Ui,i=e*Ui,o=Math.cos(n);return[o*Math.cos(i),o*Math.sin(i),Math.sin(n)]}static toLngLat(e){return[Math.atan2(e[1],e[0])*Wm,Math.asin(V(e[2],-1,1))*Wm]}static tangentBasis(e,t){let n=t*Ui,i=e*Ui,o=Math.sin(n),s=Math.cos(n),a=Math.sin(i),c=Math.cos(i);return{N:[-o*c,-o*a,s],E:[-a,c,0]}}static upVector(e,t,n){let{N:i,E:o}=r.tangentBasis(e,t),s=n*Ui,a=Math.cos(s),c=Math.sin(s);return[i[0]*a+o[0]*c,i[1]*a+o[1]*c,i[2]*a+o[2]*c]}static bearing(e,t,n){let{N:i,E:o}=r.tangentBasis(t,n);return Math.atan2(W.dot(e,o),W.dot(e,i))*Wm}static cameraFrame(e,t,n){let i=r.toPosition(e,t),o=r.upVector(e,t,n),{N:s,E:a}=r.tangentBasis(e,t),c=n*Ui,l=Math.cos(c),u=Math.sin(c),f=[a[0]*l-s[0]*u,a[1]*l-s[1]*u,a[2]*l-s[2]*u];return{position:i,up:o,axisHorizontal:W.cross([],i,f),axisVertical:W.cross([],i,o),longitude:e,latitude:t,bearing:n}}static angularDistance(e,t){let n=r.toPosition(e.longitude,e.latitude),i=r.toPosition(t.longitude,t.latitude);return Math.acos(V(W.dot(n,i),-1,1))}static greatCircleAxis(e,t){let n=r.toPosition(e.longitude,e.latitude),i=r.toPosition(t.longitude,t.latitude);return W.normalize([],W.cross([],n,i))}static rotate(e,t,n){let i=new Wo().fromAxisRotation(t,n);return W.transformQuat([],e,i)}static rotateFrame(e,t,n,i){let o=r.rotate(e.position,e.axisHorizontal,t);o=r.rotate(o,e.axisVertical,n);let s=r.rotate(e.up,e.axisHorizontal,t);s=r.rotate(s,e.axisVertical,n);let[a,c]=r.toLngLat(o),l=i?0:r.bearing(s,a,c);return{...e,position:o,up:s,longitude:a,latitude:c,bearing:l}}static rotateFrameToMatch(e,t,n,i=1){let o=r.toPosition(...t),s=r.toPosition(...n),a=W.cross([],o,s),c=W.len(a),l=V(W.dot(o,s),-1,1);if(c<1e-12){if(l>0)return e;a=W.cross([],o,e.up),W.len(a)<1e-12&&(a=W.cross([],o,e.axisVertical))}W.normalize(a,a);let u=Math.atan2(c,l)*V(i,0,1),f=r.rotate(e.position,a,u),d=r.rotate(e.up,a,u),[h,p]=r.toLngLat(f);return{...e,position:f,up:d,longitude:h,latitude:p,bearing:r.bearing(d,h,p)}}},EP=5,d4=1/(1-Math.exp(-EP)),PP=r=>(1-Math.exp(-EP*r))*d4,Au=class extends bn{constructor(e){let t="axis"in e;super({compare:["longitude","latitude"],extract:t?["longitude","latitude","zoom","bearing"]:["longitude","latitude","zoom"],required:["longitude","latitude"]}),t?(this._mode="rotation",this._axis=e.axis,this._totalAngle=e.totalAngle):(this._mode="linear",this._targetLongitude=e.targetLongitude)}initializeProps(e,t){let n=super.initializeProps(e,t);return this._startZoom=e.zoom,this._mode==="rotation"?this._startFrame={...je.cameraFrame(e.longitude,e.latitude,e.bearing||0),axisHorizontal:this._axis}:n.end.longitude=this._targetLongitude,n}interpolateProps(e,t,n){if(this._mode==="rotation"){let{longitude:a,latitude:c,bearing:l}=je.rotateFrame(this._startFrame,this._totalAngle*n,0),u=this._startZoom+ue(c,!0)-ue(this._startFrame.latitude,!0);return{bearing:l,longitude:a,latitude:c,zoom:u}}let i=e.longitude+(t.longitude-e.longitude)*n,o=e.latitude+(t.latitude-e.latitude)*n,s=this._startZoom+ue(o,!0)-ue(e.latitude,!0);return{longitude:i,latitude:o,zoom:s}}};var zi=Math.PI/180,h4=180/Math.PI;function SP(r,e=0){let t=Math.min(180,r)*zi;return ir*2*Math.sin(t/2)*Math.pow(2,e)}function Gi(r,e=0){let t=r/Math.pow(2,e);return Math.asin(Math.min(1,t/ir/2))*2*h4}var jm=class extends ys{constructor(e){let{startPanPos:t,startPanCameraFrame:n,startPanAngularRate:i,...o}=e;o.normalize=!1,super(o);let s=this._state;t!==void 0&&(s.startPanPos=t),n!==void 0&&(s.startPanCameraFrame=n),i!==void 0&&(s.startPanAngularRate=i)}panStart({pos:e}){let{latitude:t,longitude:n,zoom:i,bearing:o=0}=this.getViewportProps(),s=je.cameraFrame(n,t,o),c=.25/Math.pow(2,i-ue(t,!0))*zi;return this._getUpdatedState({startPanPos:e,startPanCameraFrame:s,startPanAngularRate:c,startZoom:i})}pan({pos:e,startPos:t}){let n=this.getState(),i=n.startPanPos||t;if(!i)return this;let o=n.startPanCameraFrame,s=n.startPanAngularRate,a=n.startZoom??this.getViewportProps().zoom;if(!o||!s)return this;let c=i[0]-e[0],l=i[1]-e[1],u=c*s,f=-l*s,d=je.rotateFrame(o,u,f),h=a+ue(d.latitude,!0)-ue(o.latitude,!0);return this._getUpdatedState({longitude:d.longitude,latitude:d.latitude,bearing:d.bearing,zoom:h})}panEnd(){return this._getUpdatedState({startPanPos:null,startPanCameraFrame:null,startPanAngularRate:null,startZoom:null})}_panFromCenter(e){let{width:t,height:n}=this.getViewportProps(),i=[t/2,n/2];return this.panStart({pos:i}).pan({pos:[i[0]+e[0],i[1]+e[1]]}).panEnd()}applyConstraints(e){let t=e,n=t[Qt];delete t[Qt];let{latitude:i,maxBounds:o}=e;if(e.zoom=this._constrainZoom(e.zoom,e),n){let a=this.makeViewport(e),c=a.getZoomAnchorStrength(n.screenPosition);if(c>0){let l=a.unproject(n.screenPosition),u=je.cameraFrame(e.longitude,e.latitude,e.bearing||0),f=je.rotateFrameToMatch(u,[l[0],l[1]],[n.position[0],n.position[1]],c);e.longitude=f.longitude,e.latitude=f.latitude,e.bearing=f.bearing}}(e.longitude<-180||e.longitude>180)&&(e.longitude=qt(e.longitude+180,360)-180),(e.bearing<-180||e.bearing>180)&&(e.bearing=qt(e.bearing+180,360)-180),e.latitude=V(e.latitude,-90,90),e.pitch=V(e.pitch,e.minPitch,e.maxPitch);let s=o?wi(e.width,e.height,e.maxBoundsPadding):null;if(o&&s&&(s.width>=0&&(e.longitude=V(e.longitude,o[0][0],o[1][0])),s.height>=0&&(e.latitude=V(e.latitude,o[0][1],o[1][1]))),o&&s){let a=this.makeViewport({...e,bearing:0,pitch:0}),c=fl(a,[e.longitude,e.latitude],s),l=e.zoom-ue(i),u=o[1][0]-o[0][0],f=o[1][1]-o[0][1];if(s.height>=0&&f>0&&f<180){let d=Math.min(Gi(s.height,l),f),h=s.height?d*c.bottom/s.height:Gi(c.bottom,l),p=s.height?d*c.top/s.height:Gi(c.top,l);e.latitude=V(e.latitude,o[0][1]+h,o[1][1]-p)}if(s.width>=0&&u>0&&u<360){let d=Math.min(Gi(s.width/Math.cos(e.latitude*zi),l),u),h=s.width?d*c.left/s.width:Gi(c.left/Math.cos(e.latitude*zi),l),p=s.width?d*c.right/s.width:Gi(c.right/Math.cos(e.latitude*zi),l);e.longitude=V(e.longitude,o[0][0]+h,o[1][0]-p)}}return e.latitude=V(e.latitude,-90,90),e.latitude!==i&&(e.zoom+=ue(e.latitude,!0)-ue(i,!0)),e}_constrainZoom(e,t){t||(t=this.getViewportProps());let{maxZoom:n,maxBounds:i}=t,{minZoom:o}=t;if(i!==null&&t.width>0&&t.height>0){let c=wi(t.width,t.height,t.maxBoundsPadding),l=i[0][1],u=i[1][1],f=Math.sign(l)===Math.sign(u)?Math.min(Math.abs(l),Math.abs(u)):0,d=ue(0),h=SP(i[1][0]-i[0][0])*Math.cos(f*zi),p=SP(i[1][1]-i[0][1]);c.width>0&&h>0&&(o=Math.max(o,Math.log2(c.width/h)+d)),c.height>0&&p>0&&(o=Math.max(o,Math.log2(c.height/p)+d)),o>n&&(o=n)}let a=ue(t.latitude,!0)-ue(0,!0);return V(e,o+a,n+a)}},ia=class extends wn{constructor(){super(...arguments),this.ControllerState=jm,this.transition={transitionDuration:300,transitionInterpolator:new Kt({transitionProps:{compare:["longitude","latitude","zoom","bearing","pitch"],required:["longitude","latitude","zoom"]}})},this.dragMode="pan",this._panHistory=[]}_onPanStart(e){return this._panHistory=[],super._onPanStart(e)}_onMultiPanStart(e){return this._panHistory=[],super._onMultiPanStart(e)}_onPanMove(e){if(!this.dragPan)return!1;let t=this.getCenter(e),n=this.controllerState.pan({pos:t});this.updateViewport(n,{transitionDuration:0},{isDragging:!0,isPanning:!0});let{longitude:i,latitude:o}=n.getViewportProps();return this._panHistory.push({longitude:i,latitude:o,timestamp:Date.now()}),this._panHistory.length>5&&this._panHistory.shift(),!0}_onPanMoveEnd(e){let{inertia:t}=this;if(this.dragPan&&t&&this._panHistory.length>=2){let i=this._panHistory[0],o=this._panHistory[this._panHistory.length-1],s=o.timestamp-i.timestamp;if(s>0){let a=this.controllerState.getViewportProps(),l=je.angularDistance(i,o)/s;if(l>1e-6){let u=l*t/2,f=je.greatCircleAxis(i,o),d=je.cameraFrame(a.longitude,a.latitude,a.bearing||0),h=je.rotateFrame({...d,axisHorizontal:f},u,0),p=h.longitude,m=V(h.latitude,-90,90),g=new Au({axis:f,totalAngle:u}),b=this.controllerState.panEnd();return this.updateViewport(b,{transitionInterpolator:g,transitionDuration:t,transitionEasing:PP,longitude:p,latitude:m},{isDragging:!1,isPanning:!0}),this._panHistory=[],!0}}}this._panHistory=[];let n=this.controllerState.panEnd();return this.updateViewport(n,null,{isDragging:!1,isPanning:!1}),!0}};var p4={cullMode:"back"},Cu=class extends yn{constructor(e={}){super({...e,parameters:{...p4,...e.parameters}})}getViewportType(e){return e.zoom>12?Zt:wP}get ControllerType(){return ia}};Cu.displayName="GlobeView";var Hm=Cu;I();var $i=class{constructor(e){this.indexStarts=[0],this.vertexStarts=[0],this.vertexCount=0,this.instanceCount=0;let{attributes:t={}}=e;this.typedArrayManager=st,this.attributes={},this._attributeDefs=t,this.opts=e,this.updateGeometry(e)}updateGeometry(e){Object.assign(this.opts,e);let{data:t,buffers:n={},getGeometry:i,geometryBuffer:o,positionFormat:s,dataChanged:a,normalize:c=!0}=this.opts;if(this.data=t,this.getGeometry=i,this.positionSize=o&&o.size||(s==="XY"?2:3),this.buffers=n,this.normalize=c,o&&(U(t.startIndices),this.getGeometry=this.getGeometryFromBuffer(o),c||(n.vertexPositions=o)),this.geometryBuffer=n.vertexPositions,Array.isArray(a))for(let l of a)this._rebuildGeometry(l);else this._rebuildGeometry()}updatePartialGeometry({startRow:e,endRow:t}){this._rebuildGeometry({startRow:e,endRow:t})}getGeometryFromBuffer(e){let t=e.value||e;return ArrayBuffer.isView(t)?Jl(t,{size:this.positionSize,offset:e.offset,stride:e.stride,startIndices:this.data.startIndices}):null}_allocate(e,t){let{attributes:n,buffers:i,_attributeDefs:o,typedArrayManager:s}=this;for(let a in o)if(a in i)s.release(n[a]),n[a]=null;else{let c=o[a];c.copy=t,n[a]=s.allocate(n[a],e,c)}}_forEachGeometry(e,t,n){let{data:i,getGeometry:o}=this,{iterable:s,objectInfo:a}=Sn(i,t,n);for(let c of s){a.index++;let l=o?o(c,a):null;e(l,a.index)}}_rebuildGeometry(e){if(!this.data)return;let{indexStarts:t,vertexStarts:n,instanceCount:i}=this,{data:o,geometryBuffer:s}=this,{startRow:a=0,endRow:c=1/0}=e||{},l={};if(e||(t=[0],n=[0]),this.normalize||!s)this._forEachGeometry((f,d)=>{let h=f&&this.normalizeGeometry(f);l[d]=h,n[d+1]=n[d]+(h?this.getGeometrySize(h):0)},a,c),i=n[n.length-1];else if(n=o.startIndices,i=n[o.length]||0,ArrayBuffer.isView(s))i=i||s.length/this.positionSize;else if(s instanceof D){let f=this.positionSize*4;i=i||s.byteLength/f}else if(s.buffer){let f=s.stride||this.positionSize*4;i=i||s.buffer.byteLength/f}else if(s.value){let f=s.value,d=s.stride/f.BYTES_PER_ELEMENT||this.positionSize;i=i||f.length/d}this._allocate(i,!!e),this.indexStarts=t,this.vertexStarts=n,this.instanceCount=i;let u={};this._forEachGeometry((f,d)=>{let h=l[d]||f;u.vertexStart=n[d],u.indexStart=t[d];let p=d<n.length-1?n[d+1]:i;u.geometrySize=p-n[d],u.geometryIndex=d,this.updateGeometryAttributes(h,u)},a,c),this.vertexCount=t[t.length-1]}};var oa=class{constructor(e){U(e.id,"id is required"),this.id=e.id,this.type="custom",this.renderingMode=e.renderingMode||"3d",this.slot=e.slot,this.beforeId=e.beforeId,this.map=null}onAdd(e,t){this.map=e}render(e,t){this.map&&TP(this.map.__deck,this.map,this,t)}};var Ym="__UNDEFINED__";function Vi(r){return r.props.beforeId?`deck-layer-group-before:${r.props.beforeId}`:r.props.slot?`deck-layer-group-slot:${r.props.slot}`:"deck-layer-group-last"}function LP(r,e,t){if(!r||!r.style||!r.style._loaded)return;let n=Rt(t,Boolean);if(e!==t){let s=Rt(e,Boolean),a=new Set(s.map(l=>Vi(l))),c=new Set(n.map(l=>Vi(l)));for(let l of a)c.has(l)||r.getLayer(l)&&r.removeLayer(l)}let i={};for(let s of n){let a=Vi(s),c=r.getLayer(a);if(c){let l=c.implementation||c;i[a]=l}else{let l=new oa({id:a,slot:s.props.slot,beforeId:s.props.beforeId});i[a]=l,r.addLayer(l,s.props.beforeId)}}let o=r.style._order;for(let[s,a]of Object.entries(i)){let c=a.beforeId||Ym,l=c===Ym?o.length:o.indexOf(c);if(l===-1)continue;if(o.indexOf(s)!==l-1){let f=c===Ym?void 0:c;r.moveLayer(s,f)}}}var Mn="mapbox",qm=512,m4=Math.PI/180;function CP({map:r,deck:e}){if(r.__deck)return r.__deck;let t=e.props._customRender,n=e.props.onLoad,i={...e.props,_customRender:()=>{r.triggerRepaint(),t?.("")}};return i.views||(i.views=sa(r)),Object.assign(i,{width:null,height:null,touchAction:"unset",viewState:Wi(r)}),e.isInitialized?AP(e,r):i.onLoad=()=>{n?.(),AP(e,r)},e.setProps(i),r.__deck=e,r.on("render",()=>{e.isInitialized&&_4(e,r)}),e}function AP(r,e){let t=()=>{r.isInitialized?y4(r,e):e.off("move",t)};e.on("move",t)}function MP(r){r.__deck?.finalize(),r.__deck=null}function Mu(r,e){return e?{depthWriteEnabled:!0,depthCompare:"less-equal",depthBias:0,blend:!0,blendColorSrcFactor:"src-alpha",blendColorDstFactor:"one-minus-src-alpha",blendAlphaSrcFactor:"one",blendAlphaDstFactor:"one-minus-src-alpha",blendColorOperation:"add",blendAlphaOperation:"add"}:{}}function TP(r,e,t,n){if(!r.isInitialized)return;let{currentViewport:i}=r.userData,o=!1;i||(i=RP(r,e,n),r.userData.currentViewport=i,o=!0),i&&r._drawLayers("mapbox-repaint",{viewports:[i],layerFilter:s=>{if(r.props.layerFilter&&!r.props.layerFilter(s))return!1;let a=s.layer;return a.props.beforeId===t.beforeId&&a.props.slot===t.slot},clearStack:o,clearCanvas:!1})}function Zm(r){let e=r.getProjection?.(),t=e?.type||e?.name;if(t==="globe")return"globe";if(t&&t!=="mercator")throw new Error("Unsupported projection");return"mercator"}function sa(r){return Zm(r)==="globe"?new Hm({id:Mn}):new xs({id:Mn})}function Wi(r){let{lng:e,lat:t}=r.getCenter(),n={longitude:(e+540)%360-180,latitude:t,zoom:r.getZoom(),bearing:r.getBearing(),pitch:r.getPitch(),padding:r.getPadding(),repeat:r.getRenderWorldCopies()};return r.getTerrain?.()&&g4(r,n),n}function g4(r,e){if(r.getFreeCameraOptions){let{position:t}=r.getFreeCameraOptions();if(!t||t.z===void 0)return;let n=r.transform.height,{longitude:i,latitude:o,pitch:s}=e,a=t.x*qm,c=(1-t.y)*qm,l=t.z*qm,u=Ie([i,o]),f=a-u[0],d=c-u[1],h=Math.sqrt(f*f+d*d),p=s*m4,m=1.5*n,g=p<.001?m*Math.cos(p)/l:m*Math.sin(p)/h;e.zoom=Math.log2(g);let b=m*Math.cos(p)/g,y=l-b;e.position=[0,0,y/dn(o)]}else typeof r.transform.elevation=="number"&&(e.position=[0,0,r.transform.elevation])}function RP(r,e,t){let n=Wi(e),i=r.getView(Mn)||sa(e);t&&(i.props.nearZMultiplier=.2);let o=t?.nearZ??e.transform._nearZ,s=t?.farZ??e.transform._farZ;return Number.isFinite(o)&&(n.nearZ=o/e.transform.height,n.farZ=s/e.transform.height),i.makeViewport({width:r.width,height:r.height,viewState:n})}function _4(r,e){let n=Rt(r.props.layers,Boolean).some(a=>a&&!e.getLayer(Vi(a))),i=r.getViewports(),o=i.findIndex(a=>a.id===Mn),s=i.length>1||o<0;if(n||s){if(o>=0){i=i.slice();let a=RP(r,e);a?i[o]=a:i.splice(o,1)}r._drawLayers("mapbox-repaint",{viewports:i,layerFilter:a=>(!r.props.layerFilter||r.props.layerFilter(a))&&(a.viewport.id!==Mn||!e.getLayer(Vi(a.layer))),clearCanvas:!1})}else{let a=r.device,c=a?.gl;r.props.onBeforeRender?.({device:a,gl:c}),r.props.onAfterRender?.({device:a,gl:c})}r.userData.currentViewport=null}function y4(r,e){r.setProps({viewState:Wi(e)}),r.needsRedraw({clearRedrawFlags:!0})}var ji=class{constructor(e){this._handleStyleChange=()=>{if(this._resolveLayers(this._map,this._deck,this._props.layers,this._props.layers),!this._map)return;Zm(this._map)&&this._deck?.setProps({views:this._getViews(this._map)})},this._updateContainerSize=()=>{if(this._map&&this._container){let{clientWidth:n,clientHeight:i}=this._map.getContainer();Object.assign(this._container.style,{width:`${n}px`,height:`${i}px`})}},this._updateViewState=()=>{let n=this._deck,i=this._map;n&&i&&(n.setProps({views:this._getViews(i),viewState:Wi(i)}),n.isInitialized&&n.redraw())},this._handleMouseEvent=n=>{let i=this._deck;if(!i||!i.isInitialized)return;let o={type:n.type,offsetCenter:n.point,srcEvent:n},s=this._lastMouseDownPoint;switch(!n.point&&s&&(o.deltaX=n.originalEvent.clientX-s.clientX,o.deltaY=n.originalEvent.clientY-s.clientY,o.offsetCenter={x:s.x+o.deltaX,y:s.y+o.deltaY}),o.type){case"mousedown":i._onPointerDown(o),this._lastMouseDownPoint={...n.point,clientX:n.originalEvent.clientX,clientY:n.originalEvent.clientY};break;case"dragstart":o.type="panstart",i._onEvent(o);break;case"drag":o.type="panmove",i._onEvent(o);break;case"dragend":o.type="panend",i._onEvent(o);break;case"click":o.tapCount=1,i._onEvent(o);break;case"dblclick":o.type="click",o.tapCount=2,i._onEvent(o);break;case"mousemove":o.type="pointermove",i._onPointerMove(o);break;case"mouseout":o.type="pointerleave",i._onPointerMove(o);break;default:return}};let{interleaved:t=!1}=e;this._interleaved=t,this._props=this.filterProps(e)}filterProps(e){let{interleaved:t,useDevicePixels:n,...i}=e;return!this._interleaved&&n!==void 0&&(i.useDevicePixels=n),i}setProps(e){this._interleaved&&e.layers&&this._resolveLayers(this._map,this._deck,this._props.layers,e.layers),Object.assign(this._props,this.filterProps(e)),this._deck&&this._map&&this._deck.setProps({...this._props,views:this._getViews(this._map),parameters:{...Mu(this._map,this._interleaved),...this._props.parameters}})}onAdd(e){return this._map=e,this._interleaved?this._onAddInterleaved(e):this._onAddOverlaid(e)}_onAddOverlaid(e){let t=document.createElement("div");return Object.assign(t.style,{position:"absolute",left:0,top:0,textAlign:"initial",pointerEvents:"none"}),this._container=t,this._deck=new Kl({...this._props,parent:t,deviceProps:{...this._props.deviceProps,createCanvasContext:{...typeof this._props.deviceProps?.createCanvasContext=="object"?this._props.deviceProps.createCanvasContext:void 0,pixelSizeSource:"css-dpr"}},parameters:{...Mu(e,!1),...this._props.parameters},views:this._getViews(e),viewState:Wi(e)}),e.on("resize",this._updateContainerSize),e.on("render",this._updateViewState),e.on("mousedown",this._handleMouseEvent),e.on("dragstart",this._handleMouseEvent),e.on("drag",this._handleMouseEvent),e.on("dragend",this._handleMouseEvent),e.on("mousemove",this._handleMouseEvent),e.on("mouseout",this._handleMouseEvent),e.on("click",this._handleMouseEvent),e.on("dblclick",this._handleMouseEvent),this._updateContainerSize(),t}_onAddInterleaved(e){let t=e.painter.context.gl;return t instanceof WebGLRenderingContext&&F.warn("Incompatible basemap library. See: https://deck.gl/docs/api-reference/mapbox/overview#compatibility")(),this._deck=CP({map:e,deck:new Kl({...this._props,views:this._getViews(e),gl:t,parameters:{...Mu(e,!0),...this._props.parameters}})}),e.on("styledata",this._handleStyleChange),this._resolveLayers(e,this._deck,[],this._props.layers),document.createElement("div")}_resolveLayers(e,t,n,i){LP(e,n,i)}onRemove(){let e=this._map;e&&(this._interleaved?this._onRemoveInterleaved(e):this._onRemoveOverlaid(e)),this._deck=void 0,this._map=void 0,this._container=void 0}_onRemoveOverlaid(e){e.off("resize",this._updateContainerSize),e.off("render",this._updateViewState),e.off("mousedown",this._handleMouseEvent),e.off("dragstart",this._handleMouseEvent),e.off("drag",this._handleMouseEvent),e.off("dragend",this._handleMouseEvent),e.off("mousemove",this._handleMouseEvent),e.off("mouseout",this._handleMouseEvent),e.off("click",this._handleMouseEvent),e.off("dblclick",this._handleMouseEvent),this._deck?.finalize()}_onRemoveInterleaved(e){e.off("styledata",this._handleStyleChange),this._resolveLayers(e,this._deck,this._props.layers,[]),MP(e)}getDefaultPosition(){return"top-left"}pickObject(e){return U(this._deck),this._deck.pickObject(e)}pickMultipleObjects(e){return U(this._deck),this._deck.pickMultipleObjects(e)}pickObjects(e){return U(this._deck),this._deck.pickObjects(e)}finalize(){this._map&&this._map.removeControl(this)}getCanvas(){return this._map?this._interleaved?this._map.getCanvas():this._deck.getCanvas():null}_getViews(e){if(!this._props.views)return sa(e);let t=Array.isArray(this._props.views)?this._props.views:[this._props.views];return t.some(i=>i.id===Mn)?this._props.views:[sa(e),...t]}};K();var IP=`layout(std140) uniform scatterplotUniforms {
  float radiusScale;
  float radiusMinPixels;
  float radiusMaxPixels;
  float lineWidthScale;
  float lineWidthMinPixels;
  float lineWidthMaxPixels;
  float stroked;
  float filled;
  bool antialiasing;
  bool billboard;
  highp int radiusUnits;
  highp int lineWidthUnits;
} scatterplot;
`,OP={name:"scatterplot",vs:IP,fs:IP,source:"",uniformTypes:{radiusScale:"f32",radiusMinPixels:"f32",radiusMaxPixels:"f32",lineWidthScale:"f32",lineWidthMinPixels:"f32",lineWidthMaxPixels:"f32",stroked:"f32",filled:"f32",antialiasing:"f32",billboard:"f32",radiusUnits:"i32",lineWidthUnits:"i32"}};var BP=`#version 300 es
#define SHADER_NAME scatterplot-layer-vertex-shader
in vec3 positions;
in vec3 instancePositions;
in vec3 instancePositions64Low;
in float instanceRadius;
in float instanceLineWidths;
in vec4 instanceFillColors;
in vec4 instanceLineColors;
#ifdef USE_ROW_INDEXES
in float rowIndexes;
#endif
in vec2 instancePixelOffset;
out vec4 vFillColor;
out vec4 vLineColor;
out vec2 unitPosition;
out float innerUnitRadius;
out float outerRadiusPixels;
void main(void) {
geometry.worldPosition = instancePositions;
outerRadiusPixels = clamp(
project_size_to_pixel(scatterplot.radiusScale * instanceRadius, scatterplot.radiusUnits),
scatterplot.radiusMinPixels, scatterplot.radiusMaxPixels
);
float lineWidthPixels = clamp(
project_size_to_pixel(scatterplot.lineWidthScale * instanceLineWidths, scatterplot.lineWidthUnits),
scatterplot.lineWidthMinPixels, scatterplot.lineWidthMaxPixels
);
outerRadiusPixels += scatterplot.stroked * lineWidthPixels / 2.0;
float edgePadding = scatterplot.antialiasing ? (outerRadiusPixels + SMOOTH_EDGE_RADIUS) / outerRadiusPixels : 1.0;
unitPosition = edgePadding * positions.xy;
geometry.uv = unitPosition;
#ifdef USE_ROW_INDEXES
geometry.pickingColor = picking_getPickingColorFromIndex(rowIndexes);
#else
geometry.pickingColor = picking_getPickingColorFromInstanceID();
#endif
innerUnitRadius = 1.0 - scatterplot.stroked * lineWidthPixels / outerRadiusPixels;
if (scatterplot.billboard) {
gl_Position = project_position_to_clipspace(instancePositions, instancePositions64Low, vec3(0.0), geometry.position);
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
vec3 offset = edgePadding * positions * outerRadiusPixels;
offset.xy += instancePixelOffset;
DECKGL_FILTER_SIZE(offset, geometry);
gl_Position.xy += project_pixel_size_to_clipspace(offset.xy);
} else {
vec3 offset = edgePadding * positions * project_pixel_size(outerRadiusPixels);
offset.xy += project_pixel_size(instancePixelOffset);
DECKGL_FILTER_SIZE(offset, geometry);
gl_Position = project_position_to_clipspace(instancePositions, instancePositions64Low, offset, geometry.position);
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
}
vFillColor = vec4(instanceFillColors.rgb, instanceFillColors.a * layer.opacity);
DECKGL_FILTER_COLOR(vFillColor, geometry);
vLineColor = vec4(instanceLineColors.rgb, instanceLineColors.a * layer.opacity);
DECKGL_FILTER_COLOR(vLineColor, geometry);
}
`;var DP=`#version 300 es
#define SHADER_NAME scatterplot-layer-fragment-shader
precision highp float;
in vec4 vFillColor;
in vec4 vLineColor;
in vec2 unitPosition;
in float innerUnitRadius;
in float outerRadiusPixels;
out vec4 fragColor;
void main(void) {
geometry.uv = unitPosition;
float distToCenter = length(unitPosition) * outerRadiusPixels;
float inCircle = scatterplot.antialiasing ?
smoothedge(distToCenter, outerRadiusPixels) :
step(distToCenter, outerRadiusPixels);
if (inCircle == 0.0) {
discard;
}
if (scatterplot.stroked > 0.5) {
float isLine = scatterplot.antialiasing ?
smoothedge(innerUnitRadius * outerRadiusPixels, distToCenter) :
step(innerUnitRadius * outerRadiusPixels, distToCenter);
if (scatterplot.filled > 0.5) {
fragColor = mix(vFillColor, vLineColor, isLine);
} else {
if (isLine == 0.0) {
discard;
}
fragColor = vec4(vLineColor.rgb, vLineColor.a * isLine);
}
} else if (scatterplot.filled < 0.5) {
discard;
} else {
fragColor = vFillColor;
}
fragColor.a *= inCircle;
DECKGL_FILTER_COLOR(fragColor, geometry);
}
`;var b4=`// Main shaders

struct ScatterplotUniforms {
  radiusScale: f32,
  radiusMinPixels: f32,
  radiusMaxPixels: f32,
  lineWidthScale: f32,
  lineWidthMinPixels: f32,
  lineWidthMaxPixels: f32,
  stroked: f32,
  filled: i32,
  antialiasing: i32,
  billboard: i32,
  radiusUnits: i32,
  lineWidthUnits: i32,
};

@group(0) @binding(0) var<uniform> scatterplot: ScatterplotUniforms;

struct Attributes {
  @builtin(instance_index) instanceIndex : u32,
  @builtin(vertex_index) vertexIndex : u32,
  @location(0) positions: vec3<f32>,
  @location(1) instancePositions: vec3<f32>,
  @location(2) instancePositions64Low: vec3<f32>,
  @location(3) instanceRadius: f32,
  @location(4) instanceLineWidths: f32,
  @location(5) instanceFillColors: vec4<f32>,
  @location(6) instanceLineColors: vec4<f32>,
  @location(7) instancePixelOffset: vec2<f32>,
  PICKING_COLOR_ATTRIBUTE
};

struct Varyings {
  @builtin(position) position: vec4<f32>,
  @location(0) vFillColor: vec4<f32>,
  @location(1) vLineColor: vec4<f32>,
  @location(2) unitPosition: vec2<f32>,
  @location(3) innerUnitRadius: f32,
  @location(4) outerRadiusPixels: f32,
  @location(5) pickingColor: vec3<f32>,
  @location(6) clipCoordinates: vec2<f32>,
};

@vertex
fn vertexMain(attributes: Attributes) -> Varyings {
  var varyings: Varyings;

  // Draw an inline geometry constant array clip space triangle to verify that rendering works.
  // var positions = array<vec2<f32>, 3>(vec2(0.0, 0.5), vec2(-0.5, -0.5), vec2(0.5, -0.5));
  // if (attributes.instanceIndex == 0) {
  //   varyings.position = vec4<f32>(positions[attributes.vertexIndex], 0.0, 1.0);
  //   return varyings;
  // }

  geometry.worldPosition = attributes.instancePositions;

  // Multiply out radius and clamp to limits
  varyings.outerRadiusPixels = clamp(
    project_unit_size_to_pixel(scatterplot.radiusScale * attributes.instanceRadius, scatterplot.radiusUnits),
    scatterplot.radiusMinPixels, scatterplot.radiusMaxPixels
  );

  // Multiply out line width and clamp to limits
  let lineWidthPixels = clamp(
    project_unit_size_to_pixel(scatterplot.lineWidthScale * attributes.instanceLineWidths, scatterplot.lineWidthUnits),
    scatterplot.lineWidthMinPixels, scatterplot.lineWidthMaxPixels
  );

  // outer radius needs to offset by half stroke width
  varyings.outerRadiusPixels += scatterplot.stroked * lineWidthPixels / 2.0;
  // Expand geometry to accommodate edge smoothing
  // WGSL selects the second value when the condition is true, so keep the antialiased path second.
  let edgePadding = select(
    1.0,
    (varyings.outerRadiusPixels + SMOOTH_EDGE_RADIUS) / varyings.outerRadiusPixels,
    scatterplot.antialiasing != 0
  );

  // position on the containing square in [-1, 1] space
  varyings.unitPosition = edgePadding * attributes.positions.xy;
  geometry.uv = varyings.unitPosition;
  geometry.pickingColor = PICKING_COLOR_VALUE;

  varyings.innerUnitRadius = 1.0 - scatterplot.stroked * lineWidthPixels / varyings.outerRadiusPixels;

  if (scatterplot.billboard != 0) {
    let projectedPosition = project_position_to_clipspace_and_commonspace(
      attributes.instancePositions,
      attributes.instancePositions64Low,
      vec3<f32>(0.0)
    );
    geometry.position = projectedPosition.commonPosition;
    varyings.position = projectedPosition.clipPosition;
    // DECKGL_FILTER_GL_POSITION(varyings.position, geometry);
    var offset = edgePadding * attributes.positions * varyings.outerRadiusPixels;
    offset = vec3<f32>(offset.xy + attributes.instancePixelOffset, offset.z);
    // DECKGL_FILTER_SIZE(offset, geometry);
    let clipPixels = project_pixel_size_to_clipspace(offset.xy);
    varyings.position = vec4<f32>(varyings.position.x + clipPixels.x, varyings.position.y + clipPixels.y, varyings.position.z, varyings.position.w);
    geometry.position = vec4<f32>(
      geometry.position.xy + project_pixel_size_vec2(offset.xy),
      geometry.position.zw
    );
  } else {
    var offset = edgePadding * attributes.positions * project_pixel_size_float(varyings.outerRadiusPixels);
    offset = vec3<f32>(offset.xy + project_pixel_size_vec2(attributes.instancePixelOffset), offset.z);
    // DECKGL_FILTER_SIZE(offset, geometry);
    let projectedPosition = project_position_to_clipspace_and_commonspace(
      attributes.instancePositions,
      attributes.instancePositions64Low,
      offset
    );
    geometry.position = projectedPosition.commonPosition;
    varyings.position = projectedPosition.clipPosition;
    // DECKGL_FILTER_GL_POSITION(varyings.position, geometry);
  }

  varyings.clipCoordinates = geometry.position.xy;
  clip_filterPosition(&varyings.position, geometry.worldPosition.xy);

  // Apply opacity to instance color, or return instance picking color
  varyings.vFillColor = vec4<f32>(attributes.instanceFillColors.rgb, attributes.instanceFillColors.a * layer.opacity);
  // DECKGL_FILTER_COLOR(varyings.vFillColor, geometry);
  varyings.vLineColor = vec4<f32>(attributes.instanceLineColors.rgb, attributes.instanceLineColors.a * layer.opacity);
  // DECKGL_FILTER_COLOR(varyings.vLineColor, geometry);
  varyings.pickingColor = geometry.pickingColor;

  return varyings;
}

@fragment
fn fragmentMain(varyings: Varyings) -> @location(0) vec4<f32> {
  // var geometry: Geometry;
  // geometry.uv = unitPosition;

  let distToCenter = length(varyings.unitPosition) * varyings.outerRadiusPixels;
  let inCircle = select(
    step(distToCenter, varyings.outerRadiusPixels),
    smoothedge(distToCenter, varyings.outerRadiusPixels),
    scatterplot.antialiasing != 0
  );

  if (inCircle == 0.0) {
    discard;
  }

  var fragColor: vec4<f32>;

  if (scatterplot.stroked != 0) {
    let isLine = select(
      step(varyings.innerUnitRadius * varyings.outerRadiusPixels, distToCenter),
      smoothedge(varyings.innerUnitRadius * varyings.outerRadiusPixels, distToCenter),
      scatterplot.antialiasing != 0
    );

    if (scatterplot.filled != 0) {
      fragColor = mix(varyings.vFillColor, varyings.vLineColor, isLine);
    } else {
      if (isLine == 0.0) {
        discard;
      }
      fragColor = vec4<f32>(varyings.vLineColor.rgb, varyings.vLineColor.a * isLine);
    }
  } else if (scatterplot.filled == 0) {
    discard;
  } else {
    fragColor = varyings.vFillColor;
  }

  fragColor.a *= inCircle;

  clip_filterColor(varyings.clipCoordinates);

  if (picking.isActive > 0.5) {
    if (!picking_isColorValid(varyings.pickingColor)) {
      discard;
    }
    return vec4<f32>(varyings.pickingColor, 1.0);
  }

  if (picking.isHighlightActive > 0.5) {
    let highlightedObjectColor = picking_normalizeColor(picking.highlightedObjectColor);
    if (picking_isColorZero(abs(varyings.pickingColor - highlightedObjectColor))) {
      let highLightAlpha = picking.highlightColor.a;
      let blendedAlpha = highLightAlpha + fragColor.a * (1.0 - highLightAlpha);
      if (blendedAlpha > 0.0) {
        let highLightRatio = highLightAlpha / blendedAlpha;
        fragColor = vec4<f32>(
          mix(fragColor.rgb, picking.highlightColor.rgb, highLightRatio),
          blendedAlpha
        );
      } else {
        fragColor = vec4<f32>(fragColor.rgb, 0.0);
      }
    }
  }

  // Apply premultiplied alpha as required by transparent canvas
  fragColor = deckgl_premultiplied_alpha(fragColor);

  return fragColor;
  // return vec4<f32>(0, 0, 1, 1);
}
`;function kP(r){return b4.replace("PICKING_COLOR_ATTRIBUTE",r?"@location(8) rowIndexes: u32,":"").replace("PICKING_COLOR_VALUE",r?"picking_getPickingColorFromIndex(attributes.rowIndexes)":"picking_getPickingColorFromIndex(attributes.instanceIndex)")}var x4=`struct ClipUniforms {
  enabled: i32,
  mode: i32,
  bounds: vec4<f32>,
};

@group(2) @binding(auto) var<uniform> clipUniforms: ClipUniforms;

fn clip_isInBounds(coordinates: vec2<f32>) -> bool {
  return coordinates.x >= clipUniforms.bounds.x &&
    coordinates.y >= clipUniforms.bounds.y &&
    coordinates.x < clipUniforms.bounds.z &&
    coordinates.y < clipUniforms.bounds.w;
}

fn clip_filterPosition(position: ptr<function, vec4<f32>>, instanceCoordinates: vec2<f32>) {
  if (
    clipUniforms.enabled != 0 &&
    clipUniforms.mode == 1 &&
    !clip_isInBounds(instanceCoordinates)
  ) {
    *position = vec4<f32>(2.0, 2.0, 2.0, 1.0);
  }
}

fn clip_filterColor(geometryCoordinates: vec2<f32>) {
  if (
    clipUniforms.enabled != 0 &&
    clipUniforms.mode == 0 &&
    !clip_isInBounds(geometryCoordinates)
  ) {
    discard;
  }
}
`,v4={name:"clip",source:x4,props:{},uniforms:{},bindingLayout:[{name:"clip",group:2}],uniformTypes:{enabled:"i32",mode:"i32",bounds:"vec4<f32>"},defaultUniforms:{enabled:0,mode:0,bounds:[0,0,1,1]},getUniforms(r={}){let e={};return r.enabled!==void 0&&(e.enabled=r.enabled?1:0),r.mode!==void 0&&(e.mode=r.mode==="instance"?1:0),r.bounds!==void 0&&(e.bounds=r.bounds),e}},Ru=v4;var NP=[0,0,0,255],w4={radiusUnits:"meters",radiusScale:{type:"number",min:0,value:1},radiusMinPixels:{type:"number",min:0,value:0},radiusMaxPixels:{type:"number",min:0,value:Number.MAX_SAFE_INTEGER},lineWidthUnits:"meters",lineWidthScale:{type:"number",min:0,value:1},lineWidthMinPixels:{type:"number",min:0,value:0},lineWidthMaxPixels:{type:"number",min:0,value:Number.MAX_SAFE_INTEGER},stroked:!1,filled:!0,billboard:!1,antialiasing:!0,getPosition:{type:"accessor",value:r=>r.position},getRadius:{type:"accessor",value:1},getFillColor:{type:"accessor",value:NP},getLineColor:{type:"accessor",value:NP},getLineWidth:{type:"accessor",value:1},getPixelOffset:{type:"accessor",value:[0,0]},strokeWidth:{deprecatedFor:"getLineWidth"},outline:{deprecatedFor:"stroked"},getColor:{deprecatedFor:["getFillColor","getLineColor"]}},aa=class extends Cn{getShaders(){let e=!!this.props.data?.attributes?.rowIndexes;return super.getShaders({vs:BP,fs:DP,source:kP(e),defines:e?{USE_ROW_INDEXES:!0}:{},modules:[br,_r,Er,OP,...this.context.device.type==="webgpu"?[Ru]:[]]})}initializeState(){let e=this.props.data?.attributes?.rowIndexes?{rowIndexes:{size:1,type:"uint32",noAlloc:!0}}:{};this.getAttributeManager().addInstanced({instancePositions:{size:3,type:"float64",fp64:this.use64bitPositions(),transition:!0,accessor:"getPosition"},instanceRadius:{size:1,transition:!0,accessor:"getRadius",defaultValue:1,bufferGroup:"scatterplot-instance-data"},instanceFillColors:{size:this.props.colorFormat.length,transition:!0,type:"unorm8",accessor:"getFillColor",defaultValue:[0,0,0,255],bufferGroup:"scatterplot-instance-data"},instanceLineColors:{size:this.props.colorFormat.length,transition:!0,type:"unorm8",accessor:"getLineColor",defaultValue:[0,0,0,255],bufferGroup:"scatterplot-instance-data"},instanceLineWidths:{size:1,transition:!0,accessor:"getLineWidth",defaultValue:1,bufferGroup:"scatterplot-instance-data"},instancePixelOffset:{size:2,transition:!0,accessor:"getPixelOffset",bufferGroup:"scatterplot-instance-data"},...e})}updateState(e){super.updateState(e),e.changeFlags.extensionsChanged&&(this.state.model?.destroy(),this.state.model=this._getModel(),this.getAttributeManager().invalidateAll())}draw({uniforms:e}){let{radiusUnits:t,radiusScale:n,radiusMinPixels:i,radiusMaxPixels:o,stroked:s,filled:a,billboard:c,antialiasing:l,lineWidthUnits:u,lineWidthScale:f,lineWidthMinPixels:d,lineWidthMaxPixels:h}=this.props,p={stroked:s,filled:a,billboard:c,antialiasing:l,radiusUnits:Te[t],radiusScale:n,radiusMinPixels:i,radiusMaxPixels:o,lineWidthUnits:Te[u],lineWidthScale:f,lineWidthMinPixels:d,lineWidthMaxPixels:h},m=this.state.model;m.shaderInputs.setProps({scatterplot:p}),m.draw(this.context.renderPass)}_getModel(){let e=[-1,-1,0,1,-1,0,-1,1,0,1,1,0];return new ge(this.context.device,{...this.getShaders(),id:this.props.id,bufferLayout:this.getAttributeManager().getBufferLayouts(),geometry:new Oe({topology:"triangle-strip",attributes:{positions:{size:3,value:new Float32Array(e)}}}),isInstanced:!0})}};aa.defaultProps=w4;aa.layerName="ScatterplotLayer";var Iu=aa;K();K();var Km={CLOCKWISE:1,COUNTER_CLOCKWISE:-1};function Ou(r,e,t={}){return FP(r,t)!==e?(E4(r,t),!0):!1}function FP(r,e={}){return Math.sign(Bu(r,e))}var Xm={x:0,y:1,z:2};function Bu(r,e={}){let{start:t=0,end:n=r.length,plane:i="xy"}=e,o=e.size||2,s=0,a=Xm[i[0]],c=Xm[i[1]];for(let l=t,u=n-o;l<n;l+=o)s+=(r[l+a]-r[u+a])*(r[l+c]+r[u+c]),u=l;return s/2}function E4(r,e){let{start:t=0,end:n=r.length,size:i=2}=e,o=(n-t)/i,s=Math.floor(o/2);for(let a=0;a<s;++a){let c=t+a*i,l=t+(o-1-a)*i;for(let u=0;u<i;++u){let f=r[c+u];r[c+u]=r[l+u],r[l+u]=f}}}function Rn(r,e){let t=e.length,n=r.length;if(n>0){let i=!0;for(let o=0;o<t;o++)if(r[n-t+o]!==e[o]){i=!1;break}if(i)return!1}for(let i=0;i<t;i++)r[n+i]=e[i];return!0}function Du(r,e){let t=e.length;for(let n=0;n<t;n++)r[n]=e[n]}function ca(r,e,t,n,i=[]){let o=n+e*t;for(let s=0;s<t;s++)i[s]=r[o+s];return i}function Qm(r,e,t,n,i=[]){let o,s;if(t&8)o=(n[3]-r[1])/(e[1]-r[1]),s=3;else if(t&4)o=(n[1]-r[1])/(e[1]-r[1]),s=1;else if(t&2)o=(n[2]-r[0])/(e[0]-r[0]),s=2;else if(t&1)o=(n[0]-r[0])/(e[0]-r[0]),s=0;else return null;for(let a=0;a<r.length;a++)i[a]=(s&1)===a?n[s]:o*(e[a]-r[a])+r[a];return i}function ku(r,e){let t=0;return r[0]<e[0]?t|=1:r[0]>e[2]&&(t|=2),r[1]<e[1]?t|=4:r[1]>e[3]&&(t|=8),t}function la(r,e){let{size:t=2,broken:n=!1,gridResolution:i=10,gridOffset:o=[0,0],startIndex:s=0,endIndex:a=r.length}=e||{},c=(a-s)/t,l=[],u=[l],f=ca(r,0,t,s),d,h,p=S4(f,i,o,[]),m=[];Rn(l,f);for(let g=1;g<c;g++){for(d=ca(r,g,t,s,d),h=ku(d,p);h;){Qm(f,d,h,p,m);let b=ku(m,p);b&&(Qm(f,m,b,p,m),h=b),Rn(l,m),Du(f,m),T4(p,i,h),n&&l.length>t&&(l=[],u.push(l),Rn(l,f)),h=ku(d,p)}Rn(l,d),Du(f,d)}return n?u:u[0]}function S4(r,e,t,n){let i=Math.floor((r[0]-t[0])/e)*e+t[0],o=Math.floor((r[1]-t[1])/e)*e+t[1];return n[0]=i,n[1]=o,n[2]=i+e,n[3]=o+e,n}function T4(r,e,t){t&8?(r[1]+=e,r[3]+=e):t&4?(r[1]-=e,r[3]-=e):t&2?(r[0]+=e,r[2]+=e):t&1&&(r[0]-=e,r[2]-=e)}function Jm(r,e){let{size:t=2,startIndex:n=0,endIndex:i=r.length,normalize:o=!0}=e||{},s=r.slice(n,i);A4(s,t,0,i-n);let a=la(s,{size:t,broken:!0,gridResolution:360,gridOffset:[-180,-180]});if(o)for(let c of a)C4(c,t);return a}function A4(r,e,t,n){let i=r[0],o;for(let s=t;s<n;s+=e){o=r[s];let a=o-i;(a>180||a<-180)&&(o-=Math.round(a/360)*360),r[s]=i=o}}function C4(r,e){let t,n=r.length/e;for(let o=0;o<n&&(t=r[o*e],(t+180)%360===0);o++);let i=-Math.round(t/360)*360;if(i!==0)for(let o=0;o<n;o++)r[o*e]+=i}var ua=class extends Oe{constructor(e){let{indices:t,attributes:n}=R4(e);super({...e,topology:"line-list",indices:t,attributes:n})}};function R4(r){let{radius:e,height:t=1,nradial:n=10}=r,{vertices:i}=r;i&&(F.assert(i.length>=n),i=i.flatMap(h=>[h[0],h[1]]),Ou(i,Km.COUNTER_CLOCKWISE));let o=t>0,s=n+1,a=o?s*3+1:n,c=Math.PI*2/n,l=new Uint16Array(o?n*3*2:0),u=new Float32Array(a*3),f=new Float32Array(a*3),d=0;if(o){for(let h=0;h<s;h++){let p=h*c,m=h%n,g=Math.sin(p),b=Math.cos(p);for(let y=0;y<2;y++)u[d+0]=i?i[m*2]:b*e,u[d+1]=i?i[m*2+1]:g*e,u[d+2]=(1/2-y)*t,f[d+0]=i?i[m*2]:b,f[d+1]=i?i[m*2+1]:g,d+=3}u[d+0]=u[d-3],u[d+1]=u[d-2],u[d+2]=u[d-1],d+=3}for(let h=o?0:1;h<s;h++){let p=Math.floor(h/2)*Math.sign(.5-h%2),m=p*c,g=(p+n)%n,b=Math.sin(m),y=Math.cos(m);u[d+0]=i?i[g*2]:y*e,u[d+1]=i?i[g*2+1]:b*e,u[d+2]=t/2,f[d+2]=1,d+=3}if(o){let h=0;for(let p=0;p<n;p++)l[h++]=p*2+0,l[h++]=p*2+2,l[h++]=p*2+0,l[h++]=p*2+1,l[h++]=p*2+1,l[h++]=p*2+3}return{indices:l,attributes:{POSITION:{size:3,value:u},NORMAL:{size:3,value:f}}}}var I4=`struct ColumnUniforms {
  radius: f32,
  angle: f32,
  offset: vec2<f32>,
  extruded: f32,
  stroked: f32,
  isStroke: f32,
  coverage: f32,
  elevationScale: f32,
  edgeDistance: f32,
  widthScale: f32,
  widthMinPixels: f32,
  widthMaxPixels: f32,
  radiusUnits: i32,
  widthUnits: i32,
};

@group(0) @binding(auto) var<uniform> column: ColumnUniforms;
`,UP=`layout(std140) uniform columnUniforms {
  float radius;
  float angle;
  vec2 offset;
  bool extruded;
  bool stroked;
  bool isStroke;
  float coverage;
  float elevationScale;
  float edgeDistance;
  float widthScale;
  float widthMinPixels;
  float widthMaxPixels;
  highp int radiusUnits;
  highp int widthUnits;
} column;
`,GP={name:"column",source:I4,vs:UP,fs:UP,uniformTypes:{radius:"f32",angle:"f32",offset:"vec2<f32>",extruded:"f32",stroked:"f32",isStroke:"f32",coverage:"f32",elevationScale:"f32",edgeDistance:"f32",widthScale:"f32",widthMinPixels:"f32",widthMaxPixels:"f32",radiusUnits:"i32",widthUnits:"i32"}};var zP=`struct Attributes {
  @builtin(instance_index) instanceIndex: u32,
  @location(0) positions: vec3<f32>,
  @location(1) normals: vec3<f32>,
  @location(2) instancePositions: vec3<f32>,
  @location(3) instancePositions64Low: vec3<f32>,
  @location(4) instanceElevations: f32,
  @location(5) instanceFillColors: vec4<f32>,
  @location(6) instanceLineColors: vec4<f32>,
  @location(7) instanceStrokeWidths: f32
};

fn getRotationMatrix(angle: f32) -> mat2x2<f32> {
  let s = sin(angle);
  let c = cos(angle);
  return mat2x2<f32>(
    vec2<f32>(c, s),
    vec2<f32>(-s, c)
  );
}

fn getOffset(
  positions: vec3<f32>,
  strokeOffsetRatio: f32,
  dotRadius: f32,
  rotationMatrix: mat2x2<f32>
) -> vec3<f32> {
  var offset = (rotationMatrix * positions.xy * strokeOffsetRatio + column.offset) * dotRadius;
  if (column.radiusUnits == UNIT_METERS) {
    offset = project_size_vec2(offset);
  } else if (column.radiusUnits == UNIT_PIXELS) {
    offset = project_pixel_size_vec2(offset);
  }
  return vec3<f32>(offset, 0.0);
}
`,O4=`${zP}

struct Varyings {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec4<f32>
};

@vertex
fn vertexMain(attributes: Attributes) -> Varyings {
  var varyings: Varyings;

  geometry.worldPosition = attributes.instancePositions;
  geometry.pickingColor = picking_getPickingColorFromIndex(attributes.instanceIndex);

  let isStroke = column.isStroke > 0.5;
  let baseColor = select(attributes.instanceFillColors, attributes.instanceLineColors, isStroke);
  let rotationMatrix = getRotationMatrix(column.angle);

  var elevation = 0.0;
  var strokeOffsetRatio = 1.0;

  if (column.extruded > 0.5) {
    elevation =
      attributes.instanceElevations * (attributes.positions.z + 1.0) / 2.0 * column.elevationScale;
  } else if (column.stroked > 0.5) {
    let widthPixels = clamp(
      project_unit_size_to_pixel(attributes.instanceStrokeWidths * column.widthScale, column.widthUnits),
      column.widthMinPixels,
      column.widthMaxPixels
    ) / 2.0;
    let halfOffset =
      project_pixel_size_float(widthPixels) /
      project_size_float(column.edgeDistance * column.coverage * column.radius);
    if (isStroke) {
      strokeOffsetRatio -= sign(attributes.positions.z) * halfOffset;
    } else {
      strokeOffsetRatio -= halfOffset;
    }
  }

  let shouldRender = select(0.0, 1.0, baseColor.a > 0.0 && attributes.instanceElevations >= 0.0);
  let dotRadius = column.radius * column.coverage * shouldRender;
  let centroidPosition =
    vec3<f32>(
      attributes.instancePositions.xy,
      attributes.instancePositions.z + elevation
    );
  let offset = getOffset(attributes.positions, strokeOffsetRatio, dotRadius, rotationMatrix);
  let projected = project_position_to_clipspace_and_commonspace(
    centroidPosition,
    attributes.instancePositions64Low,
    offset
  );

  geometry.position = projected.commonPosition;
  geometry.normal = project_normal(vec3<f32>(rotationMatrix * attributes.normals.xy, attributes.normals.z));

  let lightColor = lighting_getLightColor2(
    baseColor.rgb,
    project.cameraPosition,
    geometry.position.xyz,
    geometry.normal
  );

  varyings.position = projected.clipPosition;
  varyings.color = vec4<f32>(
    select(baseColor.rgb, lightColor, column.extruded > 0.5 && !isStroke),
    baseColor.a * layer.opacity
  );

  return varyings;
}

@fragment
fn fragmentMain(varyings: Varyings) -> @location(0) vec4<f32> {
  geometry.uv = vec2<f32>(0.0);
  return deckgl_premultiplied_alpha(varyings.color);
}
`,B4=`${zP}

struct Varyings {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec4<f32>,
  @location(1) cameraPosition: vec3<f32>,
  @location(2) positionCommonspace: vec4<f32>
};

@vertex
fn vertexMain(attributes: Attributes) -> Varyings {
  var varyings: Varyings;

  geometry.worldPosition = attributes.instancePositions;
  geometry.pickingColor = picking_getPickingColorFromIndex(attributes.instanceIndex);

  let isStroke = column.isStroke > 0.5;
  let baseColor = select(attributes.instanceFillColors, attributes.instanceLineColors, isStroke);
  let rotationMatrix = getRotationMatrix(column.angle);

  var elevation = 0.0;
  var strokeOffsetRatio = 1.0;

  if (column.extruded > 0.5) {
    elevation =
      attributes.instanceElevations * (attributes.positions.z + 1.0) / 2.0 * column.elevationScale;
  } else if (column.stroked > 0.5) {
    let widthPixels = clamp(
      project_unit_size_to_pixel(attributes.instanceStrokeWidths * column.widthScale, column.widthUnits),
      column.widthMinPixels,
      column.widthMaxPixels
    ) / 2.0;
    let halfOffset =
      project_pixel_size_float(widthPixels) /
      project_size_float(column.edgeDistance * column.coverage * column.radius);
    if (isStroke) {
      strokeOffsetRatio -= sign(attributes.positions.z) * halfOffset;
    } else {
      strokeOffsetRatio -= halfOffset;
    }
  }

  let shouldRender = select(0.0, 1.0, baseColor.a > 0.0 && attributes.instanceElevations >= 0.0);
  let dotRadius = column.radius * column.coverage * shouldRender;
  let centroidPosition =
    vec3<f32>(
      attributes.instancePositions.xy,
      attributes.instancePositions.z + elevation
    );
  let offset = getOffset(attributes.positions, strokeOffsetRatio, dotRadius, rotationMatrix);
  let projected = project_position_to_clipspace_and_commonspace(
    centroidPosition,
    attributes.instancePositions64Low,
    offset
  );

  geometry.position = projected.commonPosition;
  geometry.normal = project_normal(vec3<f32>(rotationMatrix * attributes.normals.xy, attributes.normals.z));

  varyings.position = projected.clipPosition;
  varyings.color = vec4<f32>(baseColor.rgb, baseColor.a * layer.opacity);
  varyings.cameraPosition = project.cameraPosition;
  varyings.positionCommonspace = projected.commonPosition;

  return varyings;
}

@fragment
fn fragmentMain(varyings: Varyings) -> @location(0) vec4<f32> {
  geometry.uv = vec2<f32>(0.0);

  var fragColor = varyings.color;
  if (column.extruded > 0.5 && column.isStroke < 0.5) {
    // WebGPU's screen-space Y axis reverses the derivative orientation used by GLSL flat shading.
    let normal = normalize(cross(dpdy(varyings.positionCommonspace.xyz), dpdx(varyings.positionCommonspace.xyz)));
    fragColor = vec4<f32>(
      lighting_getLightColor2(
        varyings.color.rgb,
        varyings.cameraPosition,
        varyings.positionCommonspace.xyz,
        normal
      ),
      varyings.color.a
    );
  }

  return deckgl_premultiplied_alpha(fragColor);
}
`;function $P(r){return r?B4:O4}var VP=`#version 300 es
#define SHADER_NAME column-layer-vertex-shader
in vec3 positions;
in vec3 normals;
in vec3 instancePositions;
in float instanceElevations;
in vec3 instancePositions64Low;
in vec4 instanceFillColors;
in vec4 instanceLineColors;
in float instanceStrokeWidths;
out vec4 vColor;
#ifdef FLAT_SHADING
out vec3 cameraPosition;
out vec4 position_commonspace;
#endif
void main(void) {
geometry.worldPosition = instancePositions;
vec4 color = column.isStroke ? instanceLineColors : instanceFillColors;
mat2 rotationMatrix = mat2(cos(column.angle), sin(column.angle), -sin(column.angle), cos(column.angle));
float elevation = 0.0;
float strokeOffsetRatio = 1.0;
if (column.extruded) {
elevation = instanceElevations * (positions.z + 1.0) / 2.0 * column.elevationScale;
} else if (column.stroked) {
float widthPixels = clamp(
project_size_to_pixel(instanceStrokeWidths * column.widthScale, column.widthUnits),
column.widthMinPixels, column.widthMaxPixels) / 2.0;
float halfOffset = project_pixel_size(widthPixels) / project_size(column.edgeDistance * column.coverage * column.radius);
if (column.isStroke) {
strokeOffsetRatio -= sign(positions.z) * halfOffset;
} else {
strokeOffsetRatio -= halfOffset;
}
}
float shouldRender = float(color.a > 0.0 && instanceElevations >= 0.0);
float dotRadius = column.radius * column.coverage * shouldRender;
geometry.pickingColor = picking_getPickingColorFromInstanceID();
vec3 centroidPosition = vec3(instancePositions.xy, instancePositions.z + elevation);
vec3 centroidPosition64Low = instancePositions64Low;
vec2 offset = (rotationMatrix * positions.xy * strokeOffsetRatio + column.offset) * dotRadius;
if (column.radiusUnits == UNIT_METERS) {
offset = project_size(offset);
} else if (column.radiusUnits == UNIT_PIXELS) {
offset = project_pixel_size(offset);
}
vec3 pos = vec3(offset, 0.);
DECKGL_FILTER_SIZE(pos, geometry);
gl_Position = project_position_to_clipspace(centroidPosition, centroidPosition64Low, pos, geometry.position);
geometry.normal = project_normal(vec3(rotationMatrix * normals.xy, normals.z));
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
if (column.extruded && !column.isStroke) {
#ifdef FLAT_SHADING
cameraPosition = project.cameraPosition;
position_commonspace = geometry.position;
vColor = vec4(color.rgb, color.a * layer.opacity);
#else
vec3 lightColor = lighting_getLightColor(color.rgb, project.cameraPosition, geometry.position.xyz, geometry.normal);
vColor = vec4(lightColor, color.a * layer.opacity);
#endif
} else {
vColor = vec4(color.rgb, color.a * layer.opacity);
}
DECKGL_FILTER_COLOR(vColor, geometry);
}
`;var WP=`#version 300 es
#define SHADER_NAME column-layer-fragment-shader
precision highp float;
out vec4 fragColor;
in vec4 vColor;
#ifdef FLAT_SHADING
in vec3 cameraPosition;
in vec4 position_commonspace;
#endif
void main(void) {
fragColor = vColor;
geometry.uv = vec2(0.);
#ifdef FLAT_SHADING
if (column.extruded && !column.isStroke && !bool(picking.isActive)) {
vec3 normal = normalize(cross(dFdx(position_commonspace.xyz), dFdy(position_commonspace.xyz)));
fragColor.rgb = lighting_getLightColor(vColor.rgb, cameraPosition, position_commonspace.xyz, normal);
}
#endif
DECKGL_FILTER_COLOR(fragColor, geometry);
}
`;var Nu=[0,0,0,255],D4={name:"geometry",stepMode:"vertex",byteStride:24,attributes:[{attribute:"positions",format:"float32x3",byteOffset:0},{attribute:"normals",format:"float32x3",byteOffset:12}]},k4={diskResolution:{type:"number",min:4,value:20},vertices:null,radius:{type:"number",min:0,value:1e3},angle:{type:"number",value:0},offset:{type:"array",value:[0,0]},coverage:{type:"number",min:0,max:1,value:1},elevationScale:{type:"number",min:0,value:1},radiusUnits:"meters",lineWidthUnits:"meters",lineWidthScale:1,lineWidthMinPixels:0,lineWidthMaxPixels:Number.MAX_SAFE_INTEGER,extruded:!0,wireframe:!1,filled:!0,stroked:!1,flatShading:!1,getPosition:{type:"accessor",value:r=>r.position},getFillColor:{type:"accessor",value:Nu},getLineColor:{type:"accessor",value:Nu},getLineWidth:{type:"accessor",value:1},getElevation:{type:"accessor",value:1e3},material:!0,getColor:{deprecatedFor:["getFillColor","getLineColor"]}},fa=class extends Cn{getShaders(){let e={},{flatShading:t}=this.props;return t&&(e.FLAT_SHADING=1),super.getShaders({vs:VP,fs:WP,source:$P(t),defines:e,modules:[br,_r,t?ti:ei,Er,GP]})}initializeState(){this.getAttributeManager().addInstanced({instancePositions:{size:3,type:"float64",fp64:this.use64bitPositions(),transition:!0,accessor:"getPosition"},instanceElevations:{size:1,transition:!0,accessor:"getElevation"},instanceFillColors:{size:this.props.colorFormat.length,type:"unorm8",transition:!0,accessor:"getFillColor",defaultValue:Nu},instanceLineColors:{size:this.props.colorFormat.length,type:"unorm8",transition:!0,accessor:"getLineColor",defaultValue:Nu},instanceStrokeWidths:{size:1,accessor:"getLineWidth",transition:!0}})}updateState(e){super.updateState(e);let{props:t,oldProps:n,changeFlags:i}=e,o=i.extensionsChanged||t.flatShading!==n.flatShading;o&&(this.state.models?.forEach(a=>a.destroy()),this.setState(this._getModels()),this.getAttributeManager().invalidateAll());let s=this.getNumInstances();this.state.fillModel.setInstanceCount(s),this.state.strokeModel.setInstanceCount(s),this.state.wireframeModel.setInstanceCount(s),(o||t.diskResolution!==n.diskResolution||t.vertices!==n.vertices||t.extruded!==n.extruded||t.stroked!==n.stroked)&&this._updateGeometry(t)}getGeometry(e,t,n){let i=new ua({radius:1,height:n?2:0,vertices:t,nradial:e}),o=0;if(t)for(let s=0;s<e;s++){let a=t[s],c=Math.sqrt(a[0]*a[0]+a[1]*a[1]);o+=c/e}else o=1;return this.setState({edgeDistance:Math.cos(Math.PI/e)*o}),i}_getModels(){let e=this.getShaders(),t=[...this.getAttributeManager().getBufferLayouts(),D4],n=new ge(this.context.device,{...e,id:`${this.props.id}-fill`,bufferLayout:t,isInstanced:!0}),i=new ge(this.context.device,{...e,id:`${this.props.id}-stroke`,bufferLayout:t,isInstanced:!0}),o=new ge(this.context.device,{...e,id:`${this.props.id}-wireframe`,bufferLayout:t,isInstanced:!0});return{fillModel:n,strokeModel:i,wireframeModel:o,models:[o,n,i]}}_updateGeometry({diskResolution:e,vertices:t,extruded:n,stroked:i}){let o=this.getGeometry(e,t,n||i),s=o.attributes.POSITION,a=o.attributes.NORMAL;if(this._setFillGeometry(new Oe({topology:"triangle-strip",attributes:{POSITION:s,NORMAL:a}})),!n&&i){let c=s.value.length/3;this._setStrokeGeometry(new Oe({topology:"triangle-strip",vertexCount:c-e-1,attributes:{POSITION:s,NORMAL:a}}))}n&&this._setWireframeGeometry(o)}_setFillGeometry(e){let t=mn(e,{attributes:["POSITION","NORMAL"]});this.state.fillModel.setGeometry(t)}_setStrokeGeometry(e){let t=mn(e,{attributes:["POSITION","NORMAL"]});this.state.strokeModel.setGeometry(t)}_setWireframeGeometry(e){let t=mn(e,{attributes:["POSITION","NORMAL"]}),n=this.state.wireframeModel;n.setGeometry(t),n.setTopology("line-list")}draw({uniforms:e}){let{lineWidthUnits:t,lineWidthScale:n,lineWidthMinPixels:i,lineWidthMaxPixels:o,radiusUnits:s,elevationScale:a,extruded:c,filled:l,stroked:u,wireframe:f,offset:d,coverage:h,radius:p,angle:m}=this.props,g=this.state.fillModel,b=this.state.strokeModel,y=this.state.wireframeModel,{edgeDistance:x}=this.state,v={radius:p,angle:m/180*Math.PI,offset:d,extruded:c,stroked:u,coverage:h,elevationScale:a,edgeDistance:x,radiusUnits:Te[s],widthUnits:Te[t],widthScale:n,widthMinPixels:i,widthMaxPixels:o};c&&f&&(y.shaderInputs.setProps({column:{...v,isStroke:!0}}),y.draw(this.context.renderPass)),l&&(g.shaderInputs.setProps({column:{...v,isStroke:!1}}),g.draw(this.context.renderPass)),!c&&u&&(b.shaderInputs.setProps({column:{...v,isStroke:!0}}),b.draw(this.context.renderPass))}};fa.layerName="ColumnLayer";fa.defaultProps=k4;var eg=fa;K();K();function jP(r,e,t,n){let i;if(Array.isArray(r[0])){let o=r.length*e;i=new Array(o);for(let s=0;s<r.length;s++)for(let a=0;a<e;a++)i[s*e+a]=r[s][a]||0}else i=r;return t?la(i,{size:e,gridResolution:t}):n?Jm(i,{size:e}):i}var N4=1,F4=2,da=4,ha=class extends $i{constructor(e){super({...e,attributes:{positions:{size:3,padding:18,initialize:!0,type:e.fp64?Float64Array:Float32Array},segmentTypes:{size:1,type:e.isWebGPU?Float32Array:Uint8ClampedArray}}})}get(e){return this.attributes[e]}getPathSegmentIndices(e){let t=this.attributes.segmentTypes,n=this.vertexStarts[e],i=Math.min(this.vertexStarts[e+1]??this.instanceCount,this.instanceCount),o=[];for(let s=n;s<i-1;s++)(t[s]&da)===0&&o.push(s);return o.length&&(t[n]&da)!==0&&o.unshift(o.pop()),o}getGeometryFromBuffer(e){return this.normalize||this.opts.isWebGPU?super.getGeometryFromBuffer(e):null}normalizeGeometry(e){return this.normalize?jP(e,this.positionSize,this.opts.resolution,this.opts.wrapLongitude):e}getGeometrySize(e){if(HP(e)){let n=0;for(let i of e)n+=this.getGeometrySize(i);return n}let t=this.getPathLength(e);return t<2?0:this.isClosed(e)?t<3?0:t+2:t}updateGeometryAttributes(e,t){if(t.geometrySize!==0)if(e&&HP(e))for(let n of e){let i=this.getGeometrySize(n);t.geometrySize=i,this.updateGeometryAttributes(n,t),t.vertexStart+=i}else this._updateSegmentTypes(e,t),this._updatePositions(e,t)}_updateSegmentTypes(e,t){let n=this.attributes.segmentTypes,i=e?this.isClosed(e):!1,{vertexStart:o,geometrySize:s}=t;n.fill(0,o,o+s),i?(n[o]=da,n[o+s-2]=da):(n[o]+=N4,n[o+s-2]+=F4),n[o+s-1]=da}_updatePositions(e,t){let{positions:n}=this.attributes;if(!n||!e)return;let{vertexStart:i,geometrySize:o}=t,s=new Array(3);for(let a=i,c=0;c<o;a++,c++)this.getPointOnPath(e,c,s),n[a*3]=s[0],n[a*3+1]=s[1],n[a*3+2]=s[2]}getPathLength(e){return e.length/this.positionSize}getPointOnPath(e,t,n=[]){let{positionSize:i}=this;t*i>=e.length&&(t+=1-e.length/i);let o=t*i;return n[0]=e[o],n[1]=e[o+1],n[2]=i===3&&e[o+2]||0,n}isClosed(e){if(!this.normalize)return!!this.opts.loop;let{positionSize:t}=this,n=e.length-t;return e[0]===e[n]&&e[1]===e[n+1]&&(t===2||e[2]===e[n+2])}};function HP(r){return Array.isArray(r[0])}var U4=`struct PathUniforms {
  widthScale: f32,
  widthMinPixels: f32,
  widthMaxPixels: f32,
  jointType: f32,
  capType: f32,
  miterLimit: f32,
  billboard: f32,
  widthUnits: i32,
};

@group(0) @binding(auto)
var<uniform> path: PathUniforms;
`,YP=`layout(std140) uniform pathUniforms {
  float widthScale;
  float widthMinPixels;
  float widthMaxPixels;
  float jointType;
  float capType;
  float miterLimit;
  bool billboard;
  highp int widthUnits;
} path;
`,qP={name:"path",source:U4,vs:YP,fs:YP,uniformTypes:{widthScale:"f32",widthMinPixels:"f32",widthMaxPixels:"f32",jointType:"f32",capType:"f32",miterLimit:"f32",billboard:"f32",widthUnits:"i32"}};var ZP=`const EPSILON: f32 = 0.001;
const ZERO_OFFSET: vec3<f32> = vec3<f32>(0.0, 0.0, 0.0);

struct JoinResult {
  offset: vec3<f32>,
  cornerOffset: vec2<f32>,
  miterLength: f32,
  pathPosition: vec2<f32>,
  pathLength: f32,
  jointType: f32,
};

struct Attributes {
  @location(0) positions: vec2<f32>,
  @location(1) instanceTypes: f32,
  @location(2) instanceLeftPositions: vec3<f32>,
  @location(3) instanceStartPositions: vec3<f32>,
  @location(4) instanceEndPositions: vec3<f32>,
  @location(5) instanceRightPositions: vec3<f32>,
  @location(6) instanceLeftPositions64Low: vec3<f32>,
  @location(7) instanceStartPositions64Low: vec3<f32>,
  @location(8) instanceEndPositions64Low: vec3<f32>,
  @location(9) instanceRightPositions64Low: vec3<f32>,
  @location(10) instanceStrokeWidths: f32,
  @location(11) instanceColors: vec4<f32>,
  @location(12) rowIndexes: u32,
};

struct Varyings {
  @builtin(position) position: vec4<f32>,
  @location(0) vColor: vec4<f32>,
  @location(1) vCornerOffset: vec2<f32>,
  @location(2) vMiterLength: f32,
  @location(3) vPathPosition: vec2<f32>,
  @location(4) vPathLength: f32,
  @location(5) vJointType: f32,
  // Location 6 is reserved for TripsLayer's injected vTime varying.
  @location(7) clipCoordinates: vec2<f32>,
#ifdef DASH_ENABLED
  @location(8) vPathBounds: vec2<f32>,
#endif
};

fn flipIfTrue(flag: bool) -> f32 {
  return select(1.0, -1.0, flag);
}

fn clipLine(position: vec4<f32>, refPosition: vec4<f32>) -> vec4<f32> {
  if (position.w < EPSILON) {
    let r = (EPSILON - refPosition.w) / (position.w - refPosition.w);
    return refPosition + (position - refPosition) * r;
  }
  return position;
}

#ifdef DASH_ENABLED
// Return the visible interval of the original segment before clipLine moves either endpoint.
fn getClippedPathRange(startW: f32, endW: f32) -> vec2<f32> {
  let startClipped = startW < EPSILON;
  let endClipped = endW < EPSILON;
  if (startClipped && endClipped) {
    return vec2<f32>(0.0, 0.0);
  }
  if (startClipped || endClipped) {
    let intersection = clamp((EPSILON - startW) / (endW - startW), 0.0, 1.0);
    if (startClipped) {
      return vec2<f32>(intersection, 1.0);
    }
    return vec2<f32>(0.0, intersection);
  }
  return vec2<f32>(0.0, 1.0);
}
#endif

fn getLineJoinOffset(
  prevPoint: vec3<f32>,
  currPoint: vec3<f32>,
  nextPoint: vec3<f32>,
  width: vec2<f32>,
#ifdef DASH_ENABLED
  sourcePathLength: f32,
  sourcePathRange: vec2<f32>,
#endif
#ifdef ANTIALIASING
  coverageScale: f32,
#endif
  positions: vec2<f32>,
  instanceTypes: f32
) -> JoinResult {
  let isEnd = positions.x > 0.0;
  let sideOfPath = positions.y;
  let isJoint = select(0.0, 1.0, sideOfPath == 0.0);

  var deltaA3 = currPoint - prevPoint;
  var deltaB3 = nextPoint - currPoint;

  let rotationResult = project_needs_rotation(currPoint);
  if (path.billboard == 0.0 && rotationResult.needsRotation) {
    deltaA3 = rotationResult.transform * deltaA3;
    deltaB3 = rotationResult.transform * deltaB3;
  }

  let deltaA = deltaA3.xy / width;
  let deltaB = deltaB3.xy / width;

  let lenA = length(deltaA);
  let lenB = length(deltaB);

  let dirA = select(vec2<f32>(0.0, 0.0), normalize(deltaA), lenA > 0.0);
  let dirB = select(vec2<f32>(0.0, 0.0), normalize(deltaB), lenB > 0.0);

  let perpA = vec2<f32>(-dirA.y, dirA.x);
  let perpB = vec2<f32>(-dirB.y, dirB.x);

  var tangent = dirA + dirB;
  tangent = select(perpA, normalize(tangent), length(tangent) > 0.0);
  let miterVec = vec2<f32>(-tangent.y, tangent.x);
  let dir = select(dirB, dirA, isEnd);
  let perp = select(perpB, perpA, isEnd);
#ifdef DASH_ENABLED
  let segmentLength2D = select(lenB, lenA, isEnd);

  // Extrusion happens in the XY plane, so segmentLength2D is a 2D length and pathPosition.y
  // below measures 2D distance along the segment. For a path that also moves in Z the true
  // arc length is longer by this ratio. Scaling pathLength and pathPosition.y by it makes
  // the coordinate measure real 3D distance while leaving the joint tests unchanged, since
  // they compare the two against each other and both are scaled alike. Billboard mode
  // extrudes in clip space, where the perspective divide has already reduced the segment to
  // its screen projection, so its complete common-space length is supplied by the caller.
  // Mirrors path-layer-vertex.glsl.ts.
  let currDelta3 = select(deltaB3, deltaA3, isEnd);
  let currLength2D = length(currDelta3.xy);
  // Do not clamp a valid denominator to EPSILON: high-zoom Web Mercator deltas are often
  // smaller than that in common space, and changing their scale corrupts even flat paths.
  let safeLength2D = select(1.0, currLength2D, currLength2D > 0.0);
  var arcLengthRatio = 1.0;
  var pathPositionOffset = 0.0;
  var pathLength = segmentLength2D;
  if (path.billboard != 0.0) {
    // clipLine may shorten the visible screen-space segment. Preserve the corresponding interval
    // of the complete common-space arclength instead of compressing the full dash period into the
    // visible span. Keep pathLength complete so justification is stable as the camera clips it.
    let visiblePathLength = sourcePathLength * (sourcePathRange.y - sourcePathRange.x);
    arcLengthRatio = 0.0;
    if (segmentLength2D > 0.0) {
      arcLengthRatio = visiblePathLength / segmentLength2D;
    }
    pathPositionOffset = sourcePathLength * sourcePathRange.x;
    pathLength = sourcePathLength;
  } else if (currLength2D > 0.0) {
    arcLengthRatio = length(currDelta3) / safeLength2D;
    pathLength = segmentLength2D * arcLengthRatio;
  }
#else
  let pathLength = select(lenB, lenA, isEnd);
#endif

  let sinHalfA = abs(dot(miterVec, perp));
  let cosHalfA = abs(dot(dirA, miterVec));
  let turnDirection = flipIfTrue(dirA.x * dirB.y >= dirA.y * dirB.x);
  let cornerPosition = sideOfPath * turnDirection;

  var miterSize = 1.0 / max(sinHalfA, EPSILON);
  miterSize = mix(
    min(miterSize, max(lenA, lenB) / max(cosHalfA, EPSILON)),
    miterSize,
    step(0.0, cornerPosition)
  );

  var offsetVec =
    mix(miterVec * miterSize, perp, step(0.5, cornerPosition)) *
    (sideOfPath + isJoint * turnDirection);

  let isStartCap = lenA == 0.0 || (!isEnd && (instanceTypes == 1.0 || instanceTypes == 3.0));
  let isEndCap = lenB == 0.0 || (isEnd && (instanceTypes == 2.0 || instanceTypes == 3.0));
  let isCap = isStartCap || isEndCap;

  var jointType = path.jointType;
  if (isCap) {
    offsetVec = mix(
      perp * sideOfPath,
      dir * path.capType * 4.0 * flipIfTrue(isStartCap),
      isJoint
    );
    jointType = path.capType;
  }

#ifdef ANTIALIASING
  let coverageOffsetVec = offsetVec * coverageScale;
  var miterLength = dot(coverageOffsetVec, miterVec * turnDirection);
#else
  var miterLength = dot(offsetVec, miterVec * turnDirection);
#endif
  miterLength = select(miterLength, isJoint, isCap);

#ifdef ANTIALIASING
  let offsetFromStartOfPath = coverageOffsetVec + deltaA * select(0.0, 1.0, isEnd);
#else
  let offsetFromStartOfPath = offsetVec + deltaA * select(0.0, 1.0, isEnd);
#endif
  let pathPosition = vec2<f32>(
    dot(offsetFromStartOfPath, perp),
#ifdef DASH_ENABLED
    pathPositionOffset + dot(offsetFromStartOfPath, dir) * arcLengthRatio
#else
    dot(offsetFromStartOfPath, dir)
#endif
  );
  let isValid = step(f32(instanceTypes), 3.5);
#ifdef ANTIALIASING
  var offset = vec3<f32>(coverageOffsetVec * width * isValid, 0.0);
#else
  var offset = vec3<f32>(offsetVec * width * isValid, 0.0);
#endif

  if (path.billboard == 0.0 && rotationResult.needsRotation) {
    offset = rotationResult.transform * offset;
  }

#ifdef ANTIALIASING
  return JoinResult(
    offset, coverageOffsetVec, miterLength, pathPosition, pathLength, jointType
  );
#else
  return JoinResult(offset, offsetVec, miterLength, pathPosition, pathLength, jointType);
#endif
}

@vertex
fn vertexMain(attributes: Attributes) -> Varyings {
  var varyings: Varyings;

  geometry.pickingColor = picking_getPickingColorFromIndex(attributes.rowIndexes);

  let isEnd = attributes.positions.x;

  let prevPosition = mix(attributes.instanceLeftPositions, attributes.instanceStartPositions, isEnd);
  let prevPosition64Low = mix(
    attributes.instanceLeftPositions64Low,
    attributes.instanceStartPositions64Low,
    isEnd
  );
  let currPosition = mix(attributes.instanceStartPositions, attributes.instanceEndPositions, isEnd);
  let currPosition64Low = mix(
    attributes.instanceStartPositions64Low,
    attributes.instanceEndPositions64Low,
    isEnd
  );
  let nextPosition = mix(attributes.instanceEndPositions, attributes.instanceRightPositions, isEnd);
  let nextPosition64Low = mix(
    attributes.instanceEndPositions64Low,
    attributes.instanceRightPositions64Low,
    isEnd
  );

  geometry.worldPosition = currPosition;

  let widthPixels =
    clamp(
      project_unit_size_to_pixel(attributes.instanceStrokeWidths * path.widthScale, path.widthUnits),
      path.widthMinPixels,
      path.widthMaxPixels
    ) / 2.0;

  if (path.billboard != 0.0) {
#ifdef DASH_ENABLED
    let prevProjection = project_position_to_clipspace_and_commonspace(
      prevPosition, prevPosition64Low, ZERO_OFFSET
    );
    let nextProjection = project_position_to_clipspace_and_commonspace(
      nextPosition, nextPosition64Low, ZERO_OFFSET
    );
    let prevPositionCommon = prevProjection.commonPosition.xyz;
    let nextPositionCommon = nextProjection.commonPosition.xyz;
    var prevPositionScreen = prevProjection.clipPosition;
    var nextPositionScreen = nextProjection.clipPosition;
#else
    var prevPositionScreen = project_position_to_clipspace(
      prevPosition, prevPosition64Low, ZERO_OFFSET
    );
    var nextPositionScreen = project_position_to_clipspace(
      nextPosition, nextPosition64Low, ZERO_OFFSET
    );
#endif
    let currProjection = project_position_to_clipspace_and_commonspace(
      currPosition, currPosition64Low, ZERO_OFFSET
    );
    geometry.position = currProjection.commonPosition;
    var currPositionScreen = currProjection.clipPosition;
#ifdef DASH_ENABLED
    let currPositionCommon = currProjection.commonPosition.xyz;
    let sourcePathStartScreen = mix(currPositionScreen, prevPositionScreen, isEnd);
    let sourcePathEndScreen = mix(nextPositionScreen, currPositionScreen, isEnd);
    let billboardPathRange = getClippedPathRange(
      sourcePathStartScreen.w, sourcePathEndScreen.w
    );
#endif

    prevPositionScreen = clipLine(prevPositionScreen, currPositionScreen);
    nextPositionScreen = clipLine(nextPositionScreen, currPositionScreen);
    currPositionScreen = clipLine(currPositionScreen, mix(nextPositionScreen, prevPositionScreen, isEnd));

#ifdef ANTIALIASING
    let coverageScale = select(
      1.0,
      (widthPixels + 0.5 / project.devicePixelRatio) / max(widthPixels, 1e-6),
      widthPixels > 0.0
    );
#endif
#ifdef DASH_ENABLED
    let currentDeltaCommon = select(
      nextPositionCommon - currPositionCommon,
      currPositionCommon - prevPositionCommon,
      isEnd > 0.0
    );
    let billboardPathLength = select(
      0.0,
      length(currentDeltaCommon) * project.scale / (widthPixels * project.focalDistance),
      widthPixels > 0.0
    );
#endif
    let join = getLineJoinOffset(
      prevPositionScreen.xyz / prevPositionScreen.w,
      currPositionScreen.xyz / currPositionScreen.w,
      nextPositionScreen.xyz / nextPositionScreen.w,
      project_pixel_size_to_clipspace(vec2<f32>(widthPixels, widthPixels)),
#ifdef DASH_ENABLED
      billboardPathLength,
      billboardPathRange,
#endif
#ifdef ANTIALIASING
      coverageScale,
#endif
      attributes.positions,
      attributes.instanceTypes
    );
#ifdef DASH_ENABLED
    // Phase and justification use the complete source segment, while cap and joint coverage
    // must still recognize the endpoints moved by clipLine.
    varyings.vPathBounds = billboardPathLength * billboardPathRange;
#endif

    geometry.uv = join.pathPosition;
    varyings.position = vec4<f32>(
      currPositionScreen.xyz + join.offset * currPositionScreen.w,
      currPositionScreen.w
    );
    varyings.vCornerOffset = join.cornerOffset;
    varyings.vMiterLength = join.miterLength;
    varyings.vPathPosition = join.pathPosition;
    varyings.vPathLength = join.pathLength;
    varyings.vJointType = join.jointType;
  } else {
    let prevPositionCommon = project_position_vec3_f64(prevPosition, prevPosition64Low);
    let currPositionCommon = project_position_vec3_f64(currPosition, currPosition64Low);
    let nextPositionCommon = project_position_vec3_f64(nextPosition, nextPosition64Low);

    let width = vec2<f32>(
      project_pixel_size_float(widthPixels),
      project_pixel_size_float(widthPixels)
    );
#ifdef ANTIALIASING
    let coverageScale = select(
      1.0,
      (widthPixels + 0.5 / project.devicePixelRatio) / max(widthPixels, 1e-6),
      widthPixels > 0.0
    );
#endif
    let join = getLineJoinOffset(
      prevPositionCommon,
      currPositionCommon,
      nextPositionCommon,
      width,
#ifdef DASH_ENABLED
      1.0,
      vec2<f32>(0.0, 1.0),
#endif
#ifdef ANTIALIASING
      coverageScale,
#endif
      attributes.positions,
      attributes.instanceTypes
    );
#ifdef DASH_ENABLED
    varyings.vPathBounds = vec2<f32>(0.0, join.pathLength);
#endif

    geometry.position = vec4<f32>(currPositionCommon + join.offset, 1.0);
    geometry.uv = join.pathPosition;
    varyings.position = project_common_position_to_clipspace(geometry.position);
    varyings.vCornerOffset = join.cornerOffset;
    varyings.vMiterLength = join.miterLength;
    varyings.vPathPosition = join.pathPosition;
    varyings.vPathLength = join.pathLength;
    varyings.vJointType = join.jointType;
  }

  varyings.clipCoordinates = geometry.position.xy;
  clip_filterPosition(&varyings.position, geometry.worldPosition.xy);

  varyings.vColor = vec4<f32>(
    attributes.instanceColors.rgb,
    attributes.instanceColors.a * layer.opacity
  );
  return varyings;
}

@fragment
fn fragmentMain(varyings: Varyings) -> @location(0) vec4<f32> {
  geometry.uv = varyings.vPathPosition;

#ifdef ANTIALIASING
  // Coordinates of the outer silhouette, in units of half-width: rounded joints and caps are
  // bounded by the corner offset, everywhere else by the edge of the stroke. Dividing by the
  // screen-space derivative converts the distance to the boundary into device pixels, which stays
  // correct under perspective foreshortening and under extensions that rescale the stroke.
#ifdef DASH_ENABLED
  let isCorner =
    varyings.vPathPosition.y < varyings.vPathBounds.x ||
    varyings.vPathPosition.y > varyings.vPathBounds.y;
#else
  let isCorner = varyings.vPathPosition.y < 0.0 || varyings.vPathPosition.y > varyings.vPathLength;
#endif
  let isRound = varyings.vJointType > 0.5;

  // Distance to the silhouette in device pixels, from the derivative of the coordinate that
  // bounds it. Computed before the discards below: derivatives need uniform control flow and are
  // undefined after a discard in the quad. See dev-docs/RFCs/v9.4/analytic-antialiasing-rfc.md
  let bodyCoord = abs(varyings.vPathPosition.x);
  let cornerCoord = length(varyings.vCornerOffset);
  // Both evaluated so each derivative stays on one field across the corner/body boundary
  let bodyPixels = (1.0 - bodyCoord) / max(fwidth(bodyCoord), 1e-6);
  let cornerPixels = (1.0 - cornerCoord) / max(fwidth(cornerCoord), 1e-6);
#ifdef PATH_STYLE_OFFSET
  // Rounded corners still intersect the stroke-width envelope. Extensions may remap
  // vPathPosition.x independently of vCornerOffset, as PathStyleExtension does for offsets.
  let edgePixels = select(bodyPixels, min(cornerPixels, bodyPixels), isRound && isCorner);
#else
  let edgePixels = select(bodyPixels, cornerPixels, isRound && isCorner);
#endif

  // Fragments outside the coverage ramp must not write depth or picking colors.
  if (edgePixels <= -SMOOTH_EDGE_RADIUS) {
    discard;
  }

  if (isCorner) {
    if (!isRound && varyings.vMiterLength > path.miterLimit + 1.0) {
      discard;
    }
  }

  var color = varyings.vColor;

  // Feather one device pixel across the width only, before premultiplication. edgePixels is a
  // signed device-pixel distance and SMOOTH_EDGE_RADIUS is 0.5, so this ramps across one pixel.
  color.a *= smoothedge(0.0, edgePixels);
#else
#ifdef DASH_ENABLED
  if (
    varyings.vPathPosition.y < varyings.vPathBounds.x ||
    varyings.vPathPosition.y > varyings.vPathBounds.y
  ) {
#else
  if (
    varyings.vPathPosition.y < 0.0 ||
    varyings.vPathPosition.y > varyings.vPathLength
  ) {
#endif
    if (varyings.vJointType > 0.5 && length(varyings.vCornerOffset) > 1.0) {
      discard;
    }
    if (
      varyings.vJointType < 0.5 &&
      varyings.vMiterLength > path.miterLimit + 1.0
    ) {
      discard;
    }
  }
#endif

  // Fragment-layer injections that discard pixels must run after analytic coverage derivatives.
  // See TripsLayer, which rejects fragments outside of the active time window at this anchor.
  // DECKGL_FILTER_COLOR
  clip_filterColor(varyings.clipCoordinates);
#ifdef ANTIALIASING
  return deckgl_premultiplied_alpha(color);
#else
  return deckgl_premultiplied_alpha(varyings.vColor);
#endif
}
`;var XP=`#version 300 es
#define SHADER_NAME path-layer-vertex-shader
in vec2 positions;
in float instanceTypes;
in vec3 instanceStartPositions;
in vec3 instanceEndPositions;
in vec3 instanceLeftPositions;
in vec3 instanceRightPositions;
in vec3 instanceLeftPositions64Low;
in vec3 instanceStartPositions64Low;
in vec3 instanceEndPositions64Low;
in vec3 instanceRightPositions64Low;
in float instanceStrokeWidths;
in vec4 instanceColors;
in float rowIndexes;
uniform float opacity;
out vec4 vColor;
out vec2 vCornerOffset;
out float vMiterLength;
out vec2 vPathPosition;
out float vPathLength;
out float vJointType;
#ifdef DASH_ENABLED
out vec2 vPathBounds;
#endif
const float EPSILON = 0.001;
const vec3 ZERO_OFFSET = vec3(0.0);
float flipIfTrue(bool flag) {
return -(float(flag) * 2. - 1.);
}
vec3 getLineJoinOffset(
vec3 prevPoint, vec3 currPoint, vec3 nextPoint,
vec2 width
#ifdef DASH_ENABLED
, float sourcePathLength, vec2 sourcePathRange
#endif
#ifdef ANTIALIASING
, float coverageScale
#endif
) {
bool isEnd = positions.x > 0.0;
float sideOfPath = positions.y;
float isJoint = float(sideOfPath == 0.0);
vec3 deltaA3 = (currPoint - prevPoint);
vec3 deltaB3 = (nextPoint - currPoint);
mat3 rotationMatrix;
bool needsRotation = !path.billboard && project_needs_rotation(currPoint, rotationMatrix);
if (needsRotation) {
deltaA3 = deltaA3 * rotationMatrix;
deltaB3 = deltaB3 * rotationMatrix;
}
vec2 deltaA = deltaA3.xy / width;
vec2 deltaB = deltaB3.xy / width;
float lenA = length(deltaA);
float lenB = length(deltaB);
vec2 dirA = lenA > 0. ? normalize(deltaA) : vec2(0.0, 0.0);
vec2 dirB = lenB > 0. ? normalize(deltaB) : vec2(0.0, 0.0);
vec2 perpA = vec2(-dirA.y, dirA.x);
vec2 perpB = vec2(-dirB.y, dirB.x);
vec2 tangent = dirA + dirB;
tangent = length(tangent) > 0. ? normalize(tangent) : perpA;
vec2 miterVec = vec2(-tangent.y, tangent.x);
vec2 dir = isEnd ? dirA : dirB;
vec2 perp = isEnd ? perpA : perpB;
float L = isEnd ? lenA : lenB;
#ifdef DASH_ENABLED
vec3 currDelta3 = isEnd ? deltaA3 : deltaB3;
float currLength2D = length(currDelta3.xy);
float arcLengthRatio = 1.0;
float pathPositionOffset = 0.0;
float pathLength = L;
if (path.billboard) {
float visiblePathLength = sourcePathLength * (sourcePathRange.y - sourcePathRange.x);
arcLengthRatio = L > 0.0 ? visiblePathLength / L : 0.0;
pathPositionOffset = sourcePathLength * sourcePathRange.x;
pathLength = sourcePathLength;
} else if (currLength2D > 0.0) {
arcLengthRatio = length(currDelta3) / currLength2D;
pathLength = L * arcLengthRatio;
}
#endif
float sinHalfA = abs(dot(miterVec, perp));
float cosHalfA = abs(dot(dirA, miterVec));
float turnDirection = flipIfTrue(dirA.x * dirB.y >= dirA.y * dirB.x);
float cornerPosition = sideOfPath * turnDirection;
float miterSize = 1.0 / max(sinHalfA, EPSILON);
miterSize = mix(
min(miterSize, max(lenA, lenB) / max(cosHalfA, EPSILON)),
miterSize,
step(0.0, cornerPosition)
);
vec2 offsetVec = mix(miterVec * miterSize, perp, step(0.5, cornerPosition))
* (sideOfPath + isJoint * turnDirection);
bool isStartCap = lenA == 0.0 || (!isEnd && (instanceTypes == 1.0 || instanceTypes == 3.0));
bool isEndCap = lenB == 0.0 || (isEnd && (instanceTypes == 2.0 || instanceTypes == 3.0));
bool isCap = isStartCap || isEndCap;
if (isCap) {
offsetVec = mix(perp * sideOfPath, dir * path.capType * 4.0 * flipIfTrue(isStartCap), isJoint);
vJointType = path.capType;
} else {
vJointType = path.jointType;
}
#ifdef ANTIALIASING
vec2 coverageOffsetVec = offsetVec * coverageScale;
#ifdef DASH_ENABLED
vPathLength = pathLength;
#else
vPathLength = L;
#endif
vCornerOffset = coverageOffsetVec;
vMiterLength = dot(vCornerOffset, miterVec * turnDirection);
vMiterLength = isCap ? isJoint : vMiterLength;
vec2 offsetFromStartOfPath = coverageOffsetVec + deltaA * float(isEnd);
vPathPosition = vec2(
dot(offsetFromStartOfPath, perp),
#ifdef DASH_ENABLED
pathPositionOffset + dot(offsetFromStartOfPath, dir) * arcLengthRatio
#else
dot(offsetFromStartOfPath, dir)
#endif
);
geometry.uv = vPathPosition;
float isValid = step(instanceTypes, 3.5);
vec3 offset = vec3(coverageOffsetVec * width * isValid, 0.0);
#else
#ifdef DASH_ENABLED
vPathLength = pathLength;
#else
vPathLength = L;
#endif
vCornerOffset = offsetVec;
vMiterLength = dot(vCornerOffset, miterVec * turnDirection);
vMiterLength = isCap ? isJoint : vMiterLength;
vec2 offsetFromStartOfPath = vCornerOffset + deltaA * float(isEnd);
vPathPosition = vec2(
dot(offsetFromStartOfPath, perp),
#ifdef DASH_ENABLED
pathPositionOffset + dot(offsetFromStartOfPath, dir) * arcLengthRatio
#else
dot(offsetFromStartOfPath, dir)
#endif
);
geometry.uv = vPathPosition;
float isValid = step(instanceTypes, 3.5);
vec3 offset = vec3(offsetVec * width * isValid, 0.0);
#endif
if (needsRotation) {
offset = rotationMatrix * offset;
}
return offset;
}
void clipLine(inout vec4 position, vec4 refPosition) {
if (position.w < EPSILON) {
float r = (EPSILON - refPosition.w) / (position.w - refPosition.w);
position = refPosition + (position - refPosition) * r;
}
}
#ifdef DASH_ENABLED
vec2 getClippedPathRange(float startW, float endW) {
bool startClipped = startW < EPSILON;
bool endClipped = endW < EPSILON;
if (startClipped && endClipped) {
return vec2(0.0);
}
if (startClipped || endClipped) {
float intersection = clamp((EPSILON - startW) / (endW - startW), 0.0, 1.0);
return startClipped ? vec2(intersection, 1.0) : vec2(0.0, intersection);
}
return vec2(0.0, 1.0);
}
#endif
void main() {
geometry.pickingColor = picking_getPickingColorFromIndex(rowIndexes);
vColor = vec4(instanceColors.rgb, instanceColors.a * layer.opacity);
float isEnd = positions.x;
vec3 prevPosition = mix(instanceLeftPositions, instanceStartPositions, isEnd);
vec3 prevPosition64Low = mix(instanceLeftPositions64Low, instanceStartPositions64Low, isEnd);
vec3 currPosition = mix(instanceStartPositions, instanceEndPositions, isEnd);
vec3 currPosition64Low = mix(instanceStartPositions64Low, instanceEndPositions64Low, isEnd);
vec3 nextPosition = mix(instanceEndPositions, instanceRightPositions, isEnd);
vec3 nextPosition64Low = mix(instanceEndPositions64Low, instanceRightPositions64Low, isEnd);
geometry.worldPosition = currPosition;
vec2 widthPixels = vec2(clamp(
project_size_to_pixel(instanceStrokeWidths * path.widthScale, path.widthUnits),
path.widthMinPixels, path.widthMaxPixels) / 2.0);
vec3 width;
if (path.billboard) {
#ifdef DASH_ENABLED
vec4 prevPositionCommon;
vec4 nextPositionCommon;
vec4 prevPositionScreen = project_position_to_clipspace(
prevPosition, prevPosition64Low, ZERO_OFFSET, prevPositionCommon
);
#else
vec4 prevPositionScreen = project_position_to_clipspace(
prevPosition, prevPosition64Low, ZERO_OFFSET
);
#endif
vec4 currPositionScreen = project_position_to_clipspace(currPosition, currPosition64Low, ZERO_OFFSET, geometry.position);
#ifdef DASH_ENABLED
vec4 nextPositionScreen = project_position_to_clipspace(
nextPosition, nextPosition64Low, ZERO_OFFSET, nextPositionCommon
);
#else
vec4 nextPositionScreen = project_position_to_clipspace(
nextPosition, nextPosition64Low, ZERO_OFFSET
);
#endif
#ifdef DASH_ENABLED
vec4 sourcePathStartScreen = mix(currPositionScreen, prevPositionScreen, isEnd);
vec4 sourcePathEndScreen = mix(nextPositionScreen, currPositionScreen, isEnd);
vec2 billboardPathRange = getClippedPathRange(
sourcePathStartScreen.w, sourcePathEndScreen.w
);
#endif
clipLine(prevPositionScreen, currPositionScreen);
clipLine(nextPositionScreen, currPositionScreen);
clipLine(currPositionScreen, mix(nextPositionScreen, prevPositionScreen, isEnd));
width = vec3(widthPixels, 0.0);
DECKGL_FILTER_SIZE(width, geometry);
#ifdef ANTIALIASING
vec2 coveragePadding = vec2(0.5 / project.devicePixelRatio);
float coverageScale = length(width.xy) > 0.0
? length(width.xy + coveragePadding) / length(width.xy)
: 1.0;
#endif
#ifdef DASH_ENABLED
vec3 currentDeltaCommon = isEnd > 0.0
? geometry.position.xyz - prevPositionCommon.xyz
: nextPositionCommon.xyz - geometry.position.xyz;
float billboardPathLength = width.x > 0.0
? length(currentDeltaCommon) * project.scale / (width.x * project.focalDistance)
: 0.0;
#endif
vec3 offset = getLineJoinOffset(
prevPositionScreen.xyz / prevPositionScreen.w,
currPositionScreen.xyz / currPositionScreen.w,
nextPositionScreen.xyz / nextPositionScreen.w,
project_pixel_size_to_clipspace(width.xy)
#ifdef DASH_ENABLED
,
billboardPathLength, billboardPathRange
#endif
#ifdef ANTIALIASING
,
coverageScale
#endif
);
#ifdef DASH_ENABLED
vPathBounds = billboardPathLength * billboardPathRange;
#endif
DECKGL_FILTER_GL_POSITION(currPositionScreen, geometry);
gl_Position = vec4(currPositionScreen.xyz + offset * currPositionScreen.w, currPositionScreen.w);
} else {
prevPosition = project_position(prevPosition, prevPosition64Low);
currPosition = project_position(currPosition, currPosition64Low);
nextPosition = project_position(nextPosition, nextPosition64Low);
width = vec3(project_pixel_size(widthPixels), 0.0);
DECKGL_FILTER_SIZE(width, geometry);
#ifdef ANTIALIASING
vec2 coveragePadding = project_pixel_size(vec2(0.5 / project.devicePixelRatio));
float coverageScale = length(width.xy) > 0.0
? length(width.xy + coveragePadding) / length(width.xy)
: 1.0;
#endif
vec3 offset = getLineJoinOffset(
prevPosition, currPosition, nextPosition, width.xy
#ifdef DASH_ENABLED
, 1.0, vec2(0.0, 1.0)
#endif
#ifdef ANTIALIASING
, coverageScale
#endif
);
#ifdef DASH_ENABLED
vPathBounds = vec2(0.0, vPathLength);
#endif
geometry.position = vec4(currPosition + offset, 1.0);
gl_Position = project_common_position_to_clipspace(geometry.position);
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
}
DECKGL_FILTER_COLOR(vColor, geometry);
}
`;var KP=`#version 300 es
#define SHADER_NAME path-layer-fragment-shader
precision highp float;
in vec4 vColor;
in vec2 vCornerOffset;
in float vMiterLength;
in vec2 vPathPosition;
in float vPathLength;
in float vJointType;
#ifdef DASH_ENABLED
in vec2 vPathBounds;
#endif
out vec4 fragColor;
void main(void) {
geometry.uv = vPathPosition;
#ifdef ANTIALIASING
#ifdef DASH_ENABLED
bool isCorner = vPathPosition.y < vPathBounds.x || vPathPosition.y > vPathBounds.y;
#else
bool isCorner = vPathPosition.y < 0.0 || vPathPosition.y > vPathLength;
#endif
bool isRound = vJointType > 0.5;
float bodyCoord = abs(vPathPosition.x);
float cornerCoord = length(vCornerOffset);
float bodyPixels = (1.0 - bodyCoord) / max(fwidth(bodyCoord), 1e-6);
float cornerPixels = (1.0 - cornerCoord) / max(fwidth(cornerCoord), 1e-6);
#ifdef PATH_STYLE_OFFSET
float edgePixels = isRound && isCorner ? min(cornerPixels, bodyPixels) : bodyPixels;
#else
float edgePixels = isRound && isCorner ? cornerPixels : bodyPixels;
#endif
if (edgePixels <= -SMOOTH_EDGE_RADIUS) {
discard;
}
if (isCorner) {
if (!isRound && vMiterLength > path.miterLimit + 1.0) {
discard;
}
}
fragColor = vColor;
fragColor.a *= smoothedge(0.0, edgePixels);
#else
#ifdef DASH_ENABLED
if (vPathPosition.y < vPathBounds.x || vPathPosition.y > vPathBounds.y) {
#else
if (vPathPosition.y < 0.0 || vPathPosition.y > vPathLength) {
#endif
if (vJointType > 0.5 && length(vCornerOffset) > 1.0) {
discard;
}
if (vJointType < 0.5 && vMiterLength > path.miterLimit + 1.0) {
discard;
}
}
fragColor = vColor;
#endif
DECKGL_FILTER_COLOR(fragColor, geometry);
}
`;var JP=[0,0,0,255],G4={widthUnits:"meters",widthScale:{type:"number",min:0,value:1},widthMinPixels:{type:"number",min:0,value:0},widthMaxPixels:{type:"number",min:0,value:Number.MAX_SAFE_INTEGER},jointRounded:!1,capRounded:!1,miterLimit:{type:"number",min:0,value:4},antialiasing:!1,billboard:!1,_pathType:null,getPath:{type:"accessor",value:r=>r.path},getColor:{type:"accessor",value:JP},getWidth:{type:"accessor",value:1},rounded:{deprecatedFor:["jointRounded","capRounded"]}},tg={enter:(r,e)=>e.length?e.subarray(e.length-r.length):r};function z4(r){if(r.isGeospatial)return null;let{unitsPerMeter:e}=r.distanceScales;return[e[0],e[1],e[2]]}function QP(r,e){return r===e||!!(r&&e&&r.length===e.length&&r.every((t,n)=>t===e[n]))}var pa=class extends Cn{getShaders(){let{antialiasing:e}=this.props;return super.getShaders({vs:XP,fs:KP,source:ZP,defines:e?{ANTIALIASING:1}:{},modules:[br,_r,Er,qP,...this.context.device.type==="webgpu"?[Ru]:[]]})}get wrapLongitude(){return!1}getBounds(){return this.context.device.type==="webgpu"?null:this.getAttributeManager()?.getBounds(["vertexPositions"])}getPathProjectionScale(e){let t=this.props.coordinateSystem;if(!!!this.getAttributeManager()?.getAttributes().instanceDashOffsets)return null;if(e instanceof Zt&&e.zoom>=12&&(t==="default"||t==="lnglat"||t==="cartesian")){let s=jt.getUniforms({viewport:e,coordinateSystem:t,coordinateOrigin:this.props.coordinateOrigin,autoWrapLongitude:this.wrapLongitude});return[e.projectionMode,s.coordinateOrigin[1],s.commonOrigin[1],...s.commonUnitsPerWorldUnit,...s.commonUnitsPerWorldUnit2,s.commonUnitsPerMeter[2]]}let o=z4(e);return o?[e.projectionMode,...o]:[e.projectionMode]}shouldUpdateState(e){let{viewport:t}=this.context;return super.shouldUpdateState(e)||this.state?.tessellationResolution!==t.resolution||!QP(this.state?.pathProjectionScale,this.getPathProjectionScale(t))}initializeState(){let t=this.context.device.type==="webgpu";this.getAttributeManager().addInstanced({...t?{pathPositions:{size:24,type:"float32",transition:!1,accessor:"getPath",update:this.calculateWebGPUPositions,shaderAttributes:{instanceLeftPositions:{size:3,elementOffset:0},instanceStartPositions:{size:3,elementOffset:3},instanceEndPositions:{size:3,elementOffset:6},instanceRightPositions:{size:3,elementOffset:9},instanceLeftPositions64Low:{size:3,elementOffset:12},instanceStartPositions64Low:{size:3,elementOffset:15},instanceEndPositions64Low:{size:3,elementOffset:18},instanceRightPositions64Low:{size:3,elementOffset:21}},noAlloc:!0}}:{vertexPositions:{size:3,vertexOffset:1,type:"float64",fp64:this.use64bitPositions(),transition:tg,accessor:"getPath",update:this.calculatePositions,noAlloc:!0,shaderAttributes:{instanceLeftPositions:{vertexOffset:0},instanceStartPositions:{vertexOffset:1},instanceEndPositions:{vertexOffset:2},instanceRightPositions:{vertexOffset:3}}}},instanceTypes:{size:1,type:t?"float32":"uint8",update:this.calculateSegmentTypes,noAlloc:!0},instanceStrokeWidths:{size:1,accessor:"getWidth",transition:t?!1:tg,defaultValue:1,bufferGroup:"path-instance-data"},instanceColors:{size:this.props.colorFormat.length,type:"unorm8",accessor:"getColor",transition:t?!1:tg,defaultValue:JP,bufferGroup:"path-instance-data"},rowIndexes:{size:1,type:"uint32",accessor:(i,{index:o})=>i&&i.__source?i.__source.index:o,bufferGroup:"path-instance-data"}}),this.setState({pathTesselator:new ha({fp64:this.use64bitPositions(),isWebGPU:t}),tessellationResolution:this.context.viewport.resolution,pathProjectionScale:this.getPathProjectionScale(this.context.viewport)})}updateState(e){super.updateState(e);let{props:t,oldProps:n,changeFlags:i}=e,o=this.getAttributeManager(),{viewport:s}=this.context,a=this.state.tessellationResolution!==s.resolution,c=this.getPathProjectionScale(s),l=!QP(this.state.pathProjectionScale,c),f=i.updateTriggersChanged&&(i.updateTriggersChanged.all||i.updateTriggersChanged.getPath)||t._pathType!==n._pathType||t.positionFormat!==n.positionFormat||t.wrapLongitude!==n.wrapLongitude||a;if(i.dataChanged||f){let{pathTesselator:h}=this.state,p=t.data.attributes||{};h.updateGeometry({data:t.data,geometryBuffer:p.getPath,buffers:p,normalize:!t._pathType,loop:t._pathType==="loop",getGeometry:t.getPath,positionFormat:t.positionFormat,wrapLongitude:t.wrapLongitude,resolution:s.resolution,dataChanged:f?void 0:i.dataChanged}),this.setState({numInstances:h.instanceCount,startIndices:h.vertexStarts,tessellationResolution:s.resolution,pathProjectionScale:c}),!i.dataChanged||f?o.invalidateAll():l&&o.invalidate("instanceDashOffsets")}else l&&(this.setState({pathProjectionScale:c}),o.invalidate("instanceDashOffsets"));(i.extensionsChanged||t.antialiasing!==n.antialiasing)&&(this.state.model?.destroy(),this.state.model=this._getModel(),o.invalidateAll())}getPickingInfo(e){let t=super.getPickingInfo(e),{index:n}=t,i=this.props.data;return i[0]&&i[0].__source&&(t.object=i.find(o=>o.__source.index===n)),t}disablePickingIndex(e){let t=this.props.data;if(t[0]&&t[0].__source)for(let n=0;n<t.length;n++)t[n].__source.index===e&&this._disablePickingIndex(n);else super.disablePickingIndex(e)}draw({uniforms:e}){let{jointRounded:t,capRounded:n,billboard:i,miterLimit:o,widthUnits:s,widthScale:a,widthMinPixels:c,widthMaxPixels:l}=this.props,u=this.state.model,f={jointType:Number(t),capType:Number(n),billboard:i,widthUnits:Te[s],widthScale:a,miterLimit:o,widthMinPixels:c,widthMaxPixels:l};u.shaderInputs.setProps({path:f}),u.draw(this.context.renderPass)}_getModel(){let e=[0,1,2,1,4,2,1,3,4,3,5,4],t=[0,0,0,-1,0,1,1,-1,1,1,1,0];return new ge(this.context.device,{...this.getShaders(),id:this.props.id,bufferLayout:this.getAttributeManager().getBufferLayouts(),geometry:new Oe({topology:"triangle-list",attributes:{indices:new Uint16Array(e),positions:{value:new Float32Array(t),size:2}}}),isInstanced:!0})}calculatePositions(e){let{pathTesselator:t}=this.state;e.startIndices=t.vertexStarts,e.value=t.get("positions")}calculateSegmentTypes(e){let{pathTesselator:t}=this.state;e.startIndices=t.vertexStarts,e.value=t.get("segmentTypes")}calculateWebGPUPositions(e){let{pathTesselator:t}=this.state,n=t.get("positions");if(!n){e.value=null;return}let i=t.instanceCount,o=new Float32Array(i*24),s=[-1,0,1,2];for(let a=0;a<i;a++){let c=a*24;for(let l=0;l<4;l++){let u=a+s[l],f=c+l*3;for(let d=0;d<3;d++){let h=u>=0&&u<i?n[u*3+d]:0,p=Math.fround(h);o[f+d]=p,o[f+d+12]=h-p}}}e.startIndices=t.vertexStarts,e.value=o}};pa.defaultProps=G4;pa.layerName="PathLayer";var ma=pa;var $4=`struct TripsUniforms {
  fadeTrail: f32,
  trailLength: f32,
  currentTime: f32,
};

@group(0) @binding(auto)
var<uniform> trips: TripsUniforms;
`,eS=`layout(std140) uniform tripsUniforms {
  bool fadeTrail;
  float trailLength;
  float currentTime;
} trips;
`,tS={name:"trips",source:$4,vs:eS,fs:eS,uniformTypes:{fadeTrail:"f32",trailLength:"f32",currentTime:"f32"}};function rS(r,e=r.length,t=!1){let n=new Float32Array(e*2);if(r.length===0)return n;let i=e>r.length,o=t?r.length:Math.max(r.length-1,1);for(let s=0;s<e;s++){let a=i?s%o:Math.min(s,r.length-1),c=i?(a+1)%o:Math.min(a+1,r.length-1);n[s*2]=r[a],n[s*2+1]=r[c]}return n}var nS={"  @location(12) rowIndexes: u32,":`
  @location(13) instanceTimestamps: vec2<f32>,`,"  @location(5) vJointType: f32,":`
  @location(6) vTime: f32,`,"    attributes.instanceColors.a * layer.opacity\n  );":`

  varyings.vTime = mix(
    attributes.instanceTimestamps.x,
    attributes.instanceTimestamps.y,
    varyings.vPathPosition.y / varyings.vPathLength
  );

  if (trips.fadeTrail > 0.5) {
    varyings.vColor.a *=
      1.0 - (trips.currentTime - varyings.vTime) / trips.trailLength;
  }`,"  // DECKGL_FILTER_COLOR":`
  if (
    varyings.vTime > trips.currentTime ||
    (trips.fadeTrail > 0.5 && varyings.vTime < trips.currentTime - trips.trailLength)
  ) {
    discard;
  }`};var V4={fadeTrail:!0,trailLength:{type:"number",value:120,min:0},currentTime:{type:"number",value:0,min:0},getTimestamps:{type:"accessor",value:r=>r.timestamps}},W4={"vs:#decl":`in float instanceTimestamps;
in float instanceNextTimestamps;
out float vTime;
`,"vs:#main-end":`vTime = instanceTimestamps + (instanceNextTimestamps - instanceTimestamps) * vPathPosition.y / vPathLength;
`,"fs:#decl":`in float vTime;
`,"fs:DECKGL_FILTER_COLOR":`if(vTime > trips.currentTime || (trips.fadeTrail && (vTime < trips.currentTime - trips.trailLength))) {
  discard;
}
if(trips.fadeTrail) {
  color.a *= 1.0 - (trips.currentTime - vTime) / trips.trailLength;
}
`},ga=class extends ma{getShaders(){let e=super.getShaders();return e.inject=this.context.device.type==="webgpu"?nS:W4,e.modules=[...e.modules,tS],e}initializeState(){super.initializeState(),this.getAttributeManager().addInstanced({...this.context.device.type==="webgpu"?{instanceTimestamps:{size:2,accessor:"getTimestamps",update:this.calculateWebGPUTimestamps,bufferGroup:"path-instance-data"}}:{timestamps:{size:1,accessor:"getTimestamps",shaderAttributes:{instanceTimestamps:{vertexOffset:0},instanceNextTimestamps:{vertexOffset:1}}}}})}calculateWebGPUTimestamps(e,{data:t,props:n}){let{pathTesselator:i}=this.state,{instanceCount:o,vertexStarts:s}=i,a=new Float32Array(o*2),{iterable:c,objectInfo:l}=Sn(t);for(let u of c){l.index++;let f=s[l.index],d=s[l.index+1]??o;if(d<=f)continue;let h=n.getTimestamps?.(u,l)??[];a.set(rS(h,d-f,n._pathType==="loop"),f*2)}e.startIndices=s,e.value=a}draw(e){let{fadeTrail:t,trailLength:n,currentTime:i}=this.props,o={fadeTrail:t,trailLength:n,currentTime:i};this.state.model.shaderInputs.setProps({trips:o}),super.draw(e)}};ga.layerName="TripsLayer";ga.defaultProps=V4;var rg=ga;var iS=[-122.676,45.523],oS=[[25,227,255],[255,0,204],[255,102,0],[204,255,0],[136,0,255]],cS=[["tonight","Tonight","Events happening today"],["routes","Night routes","Rainbow route following Portland roads"],["weather","Live weather","Portland conditions as atmosphere"],["architecture","Venue architecture","Extrude activity at venues"]],Fu=(r,e=220)=>{let t=/^#[0-9a-f]{6}$/i.test(r||"")?r:"#19e3ff";return[parseInt(t.slice(1,3),16),parseInt(t.slice(3,5),16),parseInt(t.slice(5,7),16),e]},j4=()=>new Intl.DateTimeFormat("en-CA",{timeZone:"America/Los_Angeles"}).format(new Date),sS=r=>r.filter(e=>e?.geometry?.coordinates?.every(Number.isFinite)),aS=r=>r.filter(e=>e.properties.kind==="event").sort((e,t)=>Date.parse(e.properties.startsAt)-Date.parse(t.properties.startsAt)),H4=r=>r.map(e=>e.map(t=>t.toFixed(5)).join(",")).join(";");function Y4(r,e=500){return r.length<=e?r:Array.from({length:e},(t,n)=>r[Math.round(n*(r.length-1)/(e-1))])}function q4(r){let e=Y4(r);return e.slice(1).map((t,n)=>({path:[e[n],t],timestamps:[n*8,(n+1)*8],color:oS[n%oS.length]}))}function Z4(r){let e=r==="rain"?180:r==="snow"?130:70;return Array.from({length:e},(t,n)=>{let i=n*2.399963,o=.006+.055*Math.sqrt(n*47%e/e);return{position:[iS[0]+Math.cos(i)*o,iS[1]+Math.sin(i)*o*.7],size:r==="rain"?18:r==="snow"?32:55}})}function X4(r){return r>=71&&r<=77?"snow":r>=51?"rain":r<=1?"clear":"cloud"}function K4(r){let e=document.createElement("section");e.className="deck-lab",e.setAttribute("aria-label","Optional deck.gl layers"),e.innerHTML='<button class="deck-lab__trigger" type="button" aria-expanded="false"><span>\u2726</span> Deck layers</button><div class="deck-lab__panel" hidden><div class="deck-lab__head"><div><small>ADDITIVE DEMO</small><strong>Your map + deck.gl</strong></div><button class="deck-lab__close" type="button" aria-label="Close">\xD7</button></div><p>The original 3D map and holograms stay untouched. Switch on only the added layers you want to inspect.</p><div class="deck-lab__layers"></div><div class="deck-lab__status" role="status"></div></div>';let t=e.querySelector(".deck-lab__trigger"),n=e.querySelector(".deck-lab__panel"),i=e.querySelector(".deck-lab__layers"),o=e.querySelector(".deck-lab__status");for(let[s,a,c]of cS){let l=document.createElement("button");l.type="button",l.className="deck-lab__layer",l.dataset.layer=s,l.setAttribute("aria-pressed","false"),l.innerHTML=`<span><strong>${a}</strong><small>${c}</small></span><i></i>`,l.onclick=()=>r(s),i.append(l)}return t.onclick=()=>{let s=n.hidden;n.hidden=!s,t.setAttribute("aria-expanded",String(s))},e.querySelector(".deck-lab__close").onclick=()=>{n.hidden=!0,t.setAttribute("aria-expanded","false")},document.body.append(e),{set(s,a){i.querySelector(`[data-layer="${s}"]`)?.setAttribute("aria-pressed",String(a))},status(s){o.textContent=s},weather(s){let a=i.querySelector('[data-layer="weather"] small');a&&(a.textContent=s)},destroy(){e.remove()}}}function dle(r){let e={features:[],on:Object.fromEntries(cS.map(([f])=>[f,!1])),weather:null,weatherData:[],routePath:[],routeKey:"",routeLoading:!1,clock:0,dead:!1},t=new ji({interleaved:!0,layers:[]});r.addControl(t);let n=0,i=0;function o(){let f=sS(e.features),d=aS(f).slice(0,10),h=d.filter(y=>y.properties.eventDay===j4()),p=[];e.on.tonight&&p.push(new Iu({id:"tonight",data:h,getPosition:y=>y.geometry.coordinates,getRadius:95,radiusUnits:"meters",stroked:!0,filled:!0,getFillColor:y=>Fu(y.properties.color,35),getLineColor:y=>Fu(y.properties.color),lineWidthMinPixels:2}));let m=d.map(y=>y.geometry.coordinates),g=e.routePath.length>1?e.routePath:m,b=e.on.routes&&g.length>1?q4(g):[];b.length&&(p.push(new ma({id:"route-rainbow-base",data:b,getPath:y=>y.path,getColor:y=>[...y.color,185],getWidth:3,widthMinPixels:3,capRounded:!0,jointRounded:!0})),p.push(new rg({id:"route-rainbow-motion",data:b,getPath:y=>y.path,getTimestamps:y=>y.timestamps,getColor:y=>y.color,widthMinPixels:6,trailLength:96,currentTime:e.clock%(b.length*8),fadeTrail:!0,capRounded:!0,jointRounded:!0,opacity:1}))),e.on.weather&&e.weatherData.length&&p.push(new Iu({id:"weather",data:e.weatherData,getPosition:y=>y.position,getRadius:y=>y.size,radiusUnits:"meters",getFillColor:e.weather==="clear"?[255,193,74,38]:e.weather==="snow"?[225,245,255,110]:[142,217,255,70]})),e.on.architecture&&p.push(new eg({id:"architecture",data:f,getPosition:y=>y.geometry.coordinates,diskResolution:8,radius:32,extruded:!0,getElevation:y=>y.properties.kind==="event"?150:85,getFillColor:y=>Fu(y.properties.color,110),getLineColor:y=>Fu(y.properties.color),stroked:!0,lineWidthMinPixels:1})),t.setProps({layers:p})}function s(f){n=0,!e.dead&&(f-i>45&&(i=f,e.clock+=7,o()),e.on.routes&&(n=requestAnimationFrame(s)))}async function a(){try{let d=await(await fetch("https://api.open-meteo.com/v1/forecast?latitude=45.523&longitude=-122.676&current=temperature_2m,weather_code&temperature_unit=fahrenheit&timezone=America%2FLos_Angeles")).json(),h=X4(Number(d.current?.weather_code)||0),p=Math.round(Number(d.current?.temperature_2m));e.weather=h,e.weatherData=Z4(h),u.weather(`${p}\xB0F in Portland \xB7 ${h}`),o()}catch{u.weather("Portland weather unavailable")}}async function c(){let f=aS(sS(e.features)).slice(0,10).map(h=>h.geometry.coordinates),d=H4(f);if(!(f.length<2||e.routeLoading||d===e.routeKey)){e.routeLoading=!0,u.status("Snapping the night route to Portland roads\u2026");try{let h=f.map(b=>b.join(",")).join(";"),p=await fetch(`https://router.project-osrm.org/route/v1/driving/${h}?overview=full&geometries=geojson&steps=false`);if(!p.ok)throw new Error("Road routing failed");let m=await p.json(),g=m.routes?.[0]?.geometry?.coordinates;if(!Array.isArray(g)||g.length<2)throw new Error("Road route missing");e.routePath=g,e.routeKey=d,u.status("Rainbow route is following Portland roads.")}catch{e.routePath=f,e.routeKey=d,u.status("Road routing is unavailable. Showing the event route.")}finally{e.routeLoading=!1,o()}}}function l(f){e.on[f]=!e.on[f],u.set(f,e.on[f]),o(),f==="routes"&&e.on[f]&&(c(),n||(n=requestAnimationFrame(s))),f==="weather"&&e.on[f]&&!e.weather&&a()}let u=K4(l);return{setListings(f){e.features=f||[],e.on.routes&&c(),o()},dispose(){e.dead=!0,cancelAnimationFrame(n),u.destroy();try{r.removeControl(t)}catch{}}}}export{dle as attachDeckMobileDemo};
