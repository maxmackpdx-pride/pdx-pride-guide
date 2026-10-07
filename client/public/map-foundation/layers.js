const sourceData=new WeakMap(),images=new WeakMap();

export function setGeoJSON(map,id,data,options={}){
 let cache=sourceData.get(map);if(!cache){cache=new Map();sourceData.set(map,cache);}
 const source=map.getSource(id);
 if(!source){map.addSource(id,{type:'geojson',...options,data});cache.set(id,data);}
 else if(cache.get(id)!==data){source.setData(data);cache.set(id,data);}
 return map.getSource(id);
}

export function addLayers(map,layers,before){
 for(const layer of layers)if(!map.getLayer(layer.id))map.addLayer(layer,before);
}

export function registerImage(map,id,load,options){
 let pending=images.get(map);if(!pending){pending=new Map();images.set(map,pending);}
 if(map.hasImage(id))return Promise.resolve(id);
 if(!pending.has(id))pending.set(id,Promise.resolve().then(load).catch(error=>{pending.delete(id);throw error;}));
 return pending.get(id).then(image=>{
  if(!map.hasImage(id))map.addImage(id,image,options);
  return id;
 });
}

export function createFeatureInteraction(map,source){
 const active={selected:null,hover:null};
 return (kind,id)=>{
  if(active[kind]===id)return;
  if(active[kind]!=null&&map.getSource(source))map.setFeatureState({source,id:active[kind]},{[kind]:false});
  active[kind]=id;
  if(id!=null&&map.getSource(source))map.setFeatureState({source,id},{[kind]:true});
 };
}
