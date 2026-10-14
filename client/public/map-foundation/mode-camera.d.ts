import type {MapCamera} from './camera.js';
export const PORTLAND_MAP_BOUNDS: [[number,number],[number,number]];
export const PORTLAND_CAMERA: MapCamera;
export function modeCameraKey(mode:'mapz'|'outz'):string;
export function insidePortlandMap(center:[number,number]):boolean;
export function switchMapCameraHref(current:'mapz'|'outz',href:string,camera:MapCamera,storage?:Storage):string;
