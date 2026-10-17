"""Offline photo-aware SVG artwork; no segmentation/model/runtime work ships to browsers.

Requires numpy, opencv-python, Pillow and onnxruntime in the local authoring environment.
Download Xenova/segformer-b0-finetuned-ade-512-512's ONNX model to
.local/segmentation/model.onnx. Weights are never deployed. SVGs are self-contained.
Decorative image contours follow visible terrain texture, not surveyed elevations.
"""
import argparse, hashlib, json, math, random
from pathlib import Path
import cv2
import numpy as np
from PIL import Image
import onnxruntime as ort

ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/'client/public/outzide-map'
DEST=BASE/'assets/photos/overlays'
CACHE=ROOT/'.local/segmentation/masks'
DEST.mkdir(parents=True,exist_ok=True);CACHE.mkdir(parents=True,exist_ok=True)
GLOW_NAMES={Path(p['photo']['src']).stem for p in json.loads((BASE/'places.json').read_text())['places'] if p.get('photo',{}).get('overlayGlowSrc')}
TREE=(4,9,17,29,66,72)
LAND=(13,16,34,46,52,68,91,94)
WATER=(21,26,60,109,128)

def maskpath(mask):
    contours,_=cv2.findContours(mask,cv2.RETR_LIST,cv2.CHAIN_APPROX_SIMPLE)
    out=[]
    for c in contours:
        if abs(cv2.contourArea(c))<5:continue
        p=cv2.approxPolyDP(c,.6,True).reshape(-1,2)
        if len(p)>2:out.append('M'+'L'.join(f'{x},{y}' for x,y in p)+'Z')
    return ''.join(out)

def linepath(points):
    return 'M'+'L'.join(f'{x:.1f},{y:.1f}' for x,y in points)

def cluster_network(mask,count,rng,color,span):
    h,w=mask.shape; coords=np.argwhere(mask>0)
    if len(coords)<100:return '',[],''
    points=[]
    for _ in range(count*70):
        if len(points)>=count:break
        y,x=coords[rng.randrange(len(coords))]
        if min(x,y,w-1-x,h-1-y)<3:continue
        if all(math.hypot(x-a,y-b)>span*.45 for a,b in points):points.append((float(x),float(y)))
    edges=[]
    for i,(x,y) in enumerate(points):
        nearest=sorted([(math.hypot(x-a,y-b),j,a,b) for j,(a,b) in enumerate(points) if j!=i])[:3]
        for d,j,a,b in nearest:
            if i>=j or d>span:continue
            samples=[(int(y+(b-y)*t),int(x+(a-x)*t)) for t in np.linspace(0,1,14)]
            if all(mask[yy,xx] for yy,xx in samples):edges.append(f'<path d="M{x:.1f},{y:.1f}L{a:.1f},{b:.1f}"/>')
    radius=.65 if color=='#70d63e' else .85
    dots=''.join(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{radius}"/>' for x,y in points)
    geometry=f'<g stroke="{color}" stroke-width=".34" stroke-opacity=".42" fill="none">'+''.join(edges)+'</g>'+f'<g fill="{color}" fill-opacity=".78">{dots}</g>'
    # Only small node halos belong to the optional opacity animation plane.
    halos=''.join(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="2" fill="{color}" opacity=".16"/><circle cx="{x:.1f}" cy="{y:.1f}" r=".9" fill="{color}" opacity=".6"/>' for x,y in points[::3])
    return geometry,points,halos

def build(path,session):
    path=path.resolve()
    raw=Image.open(path).convert('RGB');ow,oh=raw.size
    width=640;height=max(100,round(width*oh/ow))
    small=np.asarray(raw.resize((width,height),Image.Resampling.LANCZOS))
    digest=hashlib.sha256(path.read_bytes()).hexdigest()
    cached=CACHE/(digest+'-v2.npz')
    if cached.exists():
        saved=np.load(cached);labels=saved['labels'];vegetation_probability=saved['vegetation_probability']
    else:
        a=np.asarray(raw.resize((512,512),Image.Resampling.BILINEAR)).astype(np.float32)/255
        a=(a-np.array([.485,.456,.406],np.float32))/np.array([.229,.224,.225],np.float32)
        logits=session.run(None,{'pixel_values':a.transpose(2,0,1)[None]})[0][0]
        labels=cv2.resize(np.argmax(logits,axis=0).astype(np.uint8),(width,height),interpolation=cv2.INTER_NEAREST)
        weights=np.exp(logits-logits.max(axis=0,keepdims=True));weights/=weights.sum(axis=0,keepdims=True)
        vegetation_probability=cv2.resize(weights[list(TREE)].sum(axis=0),(width,height),interpolation=cv2.INTER_LINEAR)
        np.savez_compressed(cached,labels=labels,vegetation_probability=vegetation_probability)
    erode=lambda m:cv2.erode(m.astype(np.uint8)*255,np.ones((3,3),np.uint8))
    trees=np.isin(labels,TREE)|((vegetation_probability>.16)&np.isin(labels,(16,68)))
    # Conservatively protect foliage that the semantic model calls a distant hill.
    hsv=cv2.cvtColor(small,cv2.COLOR_RGB2HSV)
    foliage=(hsv[:,:,0]>27)&(hsv[:,:,0]<93)&(hsv[:,:,1]>50)&(small[:,:,1]>small[:,:,0]*1.04)
    trees=trees|foliage
    land=erode(np.isin(labels,LAND)&~trees)
    # Conservative manual review exclusions protect ambiguous distant wooded ridges.
    regions_file=ROOT/'script/data/outzide-photos/regions.json'
    regions=json.loads(regions_file.read_text()) if regions_file.exists() else {}
    for polygon in regions.get(path.stem,{}).get('terrainInclude',[]):
        pts=np.array([(round(x*width),round(y*height)) for x,y in polygon],np.int32)
        cv2.fillPoly(land,[pts],255)
    land[trees|np.isin(labels,(2,*WATER))]=0
    for polygon in regions.get(path.stem,{}).get('terrainExclude',[]):
        pts=np.array([(round(x*width),round(y*height)) for x,y in polygon],np.int32)
        cv2.fillPoly(land,[pts],0)
    sky=erode(labels==2)
    water=erode(np.isin(labels,WATER))
    vegetation=erode(trees & ~np.isin(labels,(2,21,26,60,128,113)))
    rng=random.Random(int(digest[:12],16))
    skyart,skypoints,skyglow=cluster_network(sky,38,rng,'#ff8a32',width*.27)
    treeart,treepoints,treeglow=cluster_network(vegetation,11,rng,'#70d63e',width*.14)
    # Smooth local luminance isolines follow real exposed ground; clip strictly to land.
    gray=cv2.cvtColor(small,cv2.COLOR_RGB2GRAY)
    gray=cv2.GaussianBlur(gray,(0,0),5)
    contours=[]
    for level in range(35,230,13):
        cc,_=cv2.findContours((gray>=level).astype(np.uint8)*255,cv2.RETR_LIST,cv2.CHAIN_APPROX_SIMPLE)
        for c in cc:
            if cv2.arcLength(c,False)<22:continue
            pts=cv2.approxPolyDP(c,.7,False).reshape(-1,2)
            if len(pts)<4:continue
            if not any(land[min(height-1,int(y)),min(width-1,int(x))] for x,y in pts):continue
            # Omit selected patches for breathing room instead of filling every rock.
            if rng.random()<.16:continue
            contours.append(linepath(pts))
    contourpaths=''.join(f'<path d="{d}"/>' for d in contours)
    # One narrow RGB gradient per image, legible but without blur/filter rasterization.
    stops=''.join(f'<stop offset="{o}%" stop-color="{c}"/>' for o,c in [(0,'#ff493c'),(16,'#ff9c24'),(32,'#e5e94b'),(48,'#45dc62'),(64,'#28dce9'),(80,'#5274ff'),(100,'#d353ed')])
    defs=f'<defs><linearGradient id="rgb" x1="0" x2="1">{stops}</linearGradient>'
    for name,m in [('land',land),('sky',sky),('water',water),('trees',vegetation)]:defs+=f'<clipPath id="{name}"><path d="{maskpath(m)}" fill-rule="evenodd"/></clipPath>'
    defs+=f'<pattern id="ripple" patternUnits="userSpaceOnUse" width="{width}" height="4"><rect width="{width}" height="1.5" fill="white"/></pattern><mask id="ripple-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="{width}" height="{height}"><rect width="{width}" height="{height}" fill="url(#ripple)"/></mask></defs>'
    topo=f'<g clip-path="url(#land)" fill="none" stroke="url(#rgb)" stroke-width=".52" stroke-opacity=".78" stroke-linecap="round" stroke-linejoin="round">{contourpaths}</g>'
    # Ripple-distorted, clipped echoes of orange sky nodes and nearby shoreline strokes.
    reflection=[]
    waterrows=np.where(np.any(water,axis=1))[0]
    if len(waterrows):
        horizon=float(np.quantile(waterrows,.05))
        reflection.append(f'<g mask="url(#ripple-mask)" opacity=".22"><g transform="translate(0 {2*horizon:.1f}) scale(1 -1)">{topo}</g></g>')
        for x,y in skypoints[::3]:
            ry=2*horizon-y
            if ry<0 or ry>=height:continue
            for offset in range(-8,20,4):
                yy=ry+offset
                if not 0<=yy<height:continue
                spread=1.5+abs(offset)*.09
                xx=x+math.sin(yy*.42)*1.6
                reflection.append(f'<path d="M{xx-spread:.1f},{yy:.1f}h{spread*2:.1f}" stroke="#ff943d" stroke-width=".45" opacity=".28"/>')
        # Small rainbow fragments at water/land boundaries, never a full rainbow water wash.
        edge=cv2.dilate(land,np.ones((9,9),np.uint8)) & water
        for y,x in np.argwhere(edge>0)[::max(1,int(np.count_nonzero(edge)/45))]:
            reflection.append(f'<path d="M{x-2},{y}h5" stroke="url(#rgb)" stroke-width=".55" opacity=".36"/>')
    reflected='<g clip-path="url(#water)">'+''.join(reflection)+'</g>'
    # Sky positions and tree positions are independently clipped, preserving semantics.
    artwork=f'<g clip-path="url(#sky)">{skyart}</g><g clip-path="url(#trees)">{treeart}</g>'+topo+reflected
    head=f'<svg xmlns="http://www.w3.org/2000/svg" width="{ow}" height="{oh}" viewBox="0 0 {width} {height}" aria-hidden="true">'
    name=path.stem
    (DEST/(name+'.svg')).write_text(head+defs+artwork+'</svg>')
    if name in GLOW_NAMES:
        (DEST/(name+'-nodes.svg')).write_text(head+defs+f'<g clip-path="url(#sky)">{skyglow}</g><g clip-path="url(#trees)">{treeglow}</g></svg>')
    else:
        (DEST/(name+'-nodes.svg')).unlink(missing_ok=True)
    return {'file':str(path.relative_to(BASE)), 'sha256':digest,'width':ow,'height':oh,'overlaySrc':f'assets/photos/overlays/{name}.svg','overlayGlowSrc':f'assets/photos/overlays/{name}-nodes.svg' if name in GLOW_NAMES else None,'segmentationCoverage':{'sky':round(np.mean(sky>0),4),'trees':round(np.mean(vegetation>0),4),'exposedLand':round(np.mean(land>0),4),'water':round(np.mean(water>0),4)},'contourPaths':len(contours),'skyNodes':len(skypoints),'treeNodes':len(treepoints),'maskModel':'segformer-b0-finetuned-ade-512-512','review':'Automatic semantic masks; visual review is recorded separately.'}

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('files',nargs='*');args=parser.parse_args()
    options=ort.SessionOptions();options.intra_op_num_threads=2
    session=ort.InferenceSession(str(ROOT/'.local/segmentation/model.onnx'),options,providers=['CPUExecutionProvider'])
    files=[Path(x) for x in args.files] if args.files else sorted({BASE/p['photo']['src'] for p in json.loads((BASE/'places.json').read_text())['places'] if p.get('photo')})
    indexfile=ROOT/'script/data/outzide-photos/overlays.json'
    prior=json.loads(indexfile.read_text()) if indexfile.exists() else []
    index={r['file']:r for r in prior}
    for p in files:
        r=build(p,session);index[r['file']]=r
        indexfile.write_text(json.dumps(list(index.values()),indent=2)+'\n')
        print(p.stem,r['segmentationCoverage'],r['contourPaths'],flush=True)
