import {createVineLayer,vineMesh} from './ponies-globe-vines';
import type {VinePose,VineWorkerRequest,VineWorkerResponse} from './ponies-globe-vines.worker';

type VineFrame = {front:CanvasImageSource;back:CanvasImageSource;size:number;mesh:ReturnType<typeof vineMesh>};

// One worker job at a time: slow devices never build a queue of old rotations.
// Only completed bitmaps cross back to the globe's animation thread.
export function createVineRenderer(image: HTMLImageElement, onReady: () => void) {
  let worker: Worker | undefined, ready=false, busy=false, disposed=false;
  let fallback: ReturnType<typeof createVineLayer> | undefined;
  let previousPose: VinePose | undefined, frame: VineFrame | undefined;
  let bitmaps: ImageBitmap[] = [];
  const useFallback = () => {
    worker?.terminate();worker=undefined;ready=false;busy=false;
    for (const bitmap of bitmaps) bitmap.close();
    bitmaps=[];frame=undefined;
    if (!disposed) { fallback ??= createVineLayer(image);onReady(); }
  };
  try {
    if (typeof Worker === 'undefined' || typeof createImageBitmap === 'undefined'
      || typeof OffscreenCanvas === 'undefined' || !OffscreenCanvas.prototype.transferToImageBitmap) {
      fallback=createVineLayer(image);
    } else {
      worker=new Worker(new URL('./ponies-globe-vines.worker.ts',import.meta.url),{type:'module'});
      worker.onerror=useFallback;
      worker.onmessage=(event:MessageEvent<VineWorkerResponse>)=>{
        const response=event.data;
        if (response.type==='error') { useFallback();return; }
        if (response.type==='ready') { ready=true;onReady();return; }
        if (disposed) { response.front.close();response.back.close();return; }
        busy=false;
        for (const bitmap of bitmaps) bitmap.close();
        bitmaps=[response.front,response.back];
        // Hit-test geometry is needed only on a tap, not on each animation frame.
        let mesh: ReturnType<typeof vineMesh> | undefined;
        const {radius,elapsed,still,yaw}=response.pose;
        frame={front:response.front,back:response.back,size:response.size,
          get mesh(){return mesh ??= vineMesh(response.size/2,response.size/2,radius,elapsed,still,yaw);}};
        onReady();
      };
      createImageBitmap(image).then(bitmap=>{
        if (disposed || !worker) { bitmap.close();return; }
        worker.postMessage({type:'init',image:bitmap} satisfies VineWorkerRequest,[bitmap]);
      }).catch(useFallback);
    }
  } catch { useFallback(); }
  return {
    frame(radius:number,elapsed:number,still:boolean,yaw:number,pixelRatio:number): VineFrame | undefined {
      if (disposed) return;
      if (fallback) return fallback(radius,elapsed,still,yaw,pixelRatio);
      if (ready && !busy && (!previousPose || radius!==previousPose.radius || pixelRatio!==previousPose.pixelRatio
        || still!==previousPose.still || Math.abs(yaw-previousPose.yaw)>.002
        || (!still && (elapsed-previousPose.elapsed>=50 || elapsed<previousPose.elapsed)))) {
        previousPose={radius,elapsed,still,yaw,pixelRatio};busy=true;
        worker!.postMessage({type:'frame',pose:previousPose} satisfies VineWorkerRequest);
      }
      // A resize must not display or hit-test an image from the old globe size.
      return frame && frame.size===Math.ceil(radius*2.16) ? frame : undefined;
    },
    dispose() {
      disposed=true;worker?.terminate();
      for (const bitmap of bitmaps) bitmap.close();
      bitmaps=[];frame=undefined;fallback=undefined;
    }
  };
}
