import {drawVines,vineMesh} from './ponies-globe-vines';

export type VinePose = {radius:number;elapsed:number;still:boolean;yaw:number;pixelRatio:number};
export type VineWorkerRequest = {type:'init';image:ImageBitmap} | {type:'frame';pose:VinePose};
export type VineWorkerResponse = {type:'ready'} | {type:'error'}
  | {type:'frame';pose:VinePose;size:number;front:ImageBitmap;back:ImageBitmap};

let image: ImageBitmap | undefined;
const front = new OffscreenCanvas(1,1), back = new OffscreenCanvas(1,1);
const frontInk = front.getContext('2d'), backInk = back.getContext('2d');
self.onmessage = (event: MessageEvent<VineWorkerRequest>) => {
  try {
    if (!frontInk || !backInk) throw new Error('Offscreen drawing unavailable');
    const request = event.data;
    if (request.type === 'init') {
      image=request.image;
      self.postMessage({type:'ready'} satisfies VineWorkerResponse);
      return;
    }
    if (!image) return;
    const {radius,elapsed,still,yaw,pixelRatio} = request.pose;
    const size = Math.ceil(radius*2.16), ratio = Math.min(pixelRatio,2), pixels = Math.ceil(size*ratio);
    if (front.width !== pixels) {
      front.width=front.height=back.width=back.height=pixels;
    }
    frontInk.setTransform(ratio,0,0,ratio,0,0);backInk.setTransform(ratio,0,0,ratio,0,0);
    frontInk.clearRect(0,0,size,size);backInk.clearRect(0,0,size,size);
    const mesh = vineMesh(size/2,size/2,radius,elapsed,still,yaw);
    drawVines(backInk,image,mesh.filter(p=>p.z<0));
    drawVines(frontInk,image,mesh.filter(p=>p.z>=0));
    const frontBitmap=front.transferToImageBitmap(),backBitmap=back.transferToImageBitmap();
    self.postMessage({type:'frame',pose:request.pose,size,front:frontBitmap,back:backBitmap} satisfies VineWorkerResponse,
      {transfer:[frontBitmap,backBitmap]});
  } catch {
    self.postMessage({type:'error'} satisfies VineWorkerResponse);
  }
};
