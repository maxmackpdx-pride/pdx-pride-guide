import {roadColor,roadLineWidth,bridgeFilter} from './bridge-roads.js';
export const vectorStyle={version:8,light:{anchor:'map',color:'#c7d9ed',intensity:.42,position:[1.15,210,38]},sources:{terrain:{type:'vector',url:'https://tiles.openfreemap.org/planet'}},layers:[
    {id:'water',type:'fill',source:'terrain','source-layer':'water',paint:{'fill-color':'#193645','fill-opacity':.35}},
    {id:'banks',type:'line',source:'terrain','source-layer':'water',paint:{'line-color':'#6d98ab','line-opacity':.5,'line-width':.8}},
    {id:'streams',type:'line',source:'terrain','source-layer':'waterway',paint:{'line-color':'#6291a4','line-opacity':.48,'line-width':.8}},
    {id:'streets',type:'line',source:'terrain','source-layer':'transportation',filter:['!',bridgeFilter],layout:{'line-cap':'butt','line-join':'round'},paint:{'line-color':roadColor,'line-opacity':1,'line-width':roadLineWidth}},
    {id:'skyline',type:'fill-extrusion',source:'terrain','source-layer':'building',minzoom:12,paint:{'fill-extrusion-color':'#203447','fill-extrusion-height':['coalesce',['get','render_height'],['get','height'],9],'fill-extrusion-base':['coalesce',['get','render_min_height'],0],'fill-extrusion-opacity':1,'fill-extrusion-vertical-gradient':true}},
    {id:'buildings',type:'line',source:'terrain','source-layer':'building',minzoom:12,paint:{'line-color':'#708da3','line-opacity':.21,'line-width':.5}}
  ]};
