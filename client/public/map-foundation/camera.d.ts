export type MapCamera = {center: [number, number]; zoom: number; pitch: number; bearing: number};
export type CameraMap = {getCenter(): {lng:number;lat:number};getZoom():number;getPitch():number;getBearing():number};
export function captureCamera(map:CameraMap): MapCamera;
export function readCameraParams(params:URLSearchParams): MapCamera | null;
export function cameraHref(href:string,camera:MapCamera):string;
export function readSavedCamera(storage?:Storage,key?:string):MapCamera|null;
export function saveMapCamera(map:CameraMap,storage?:Storage,key?:string):void;
