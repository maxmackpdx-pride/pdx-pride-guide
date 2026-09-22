// Solve the baseline between grounded network ends. Interior deck nodes are
// never draped onto the valley/river below. Conductance is inverse road length,
// so a straight unbranched span has a linear baseline regardless of tessellation.
export function bridgeElevations(nodes, edges, elevation) {
  const visited = new Set();
  for (let root = 0; root < nodes.length; root++) {
    if (visited.has(root)) continue;
    const component = [], queue = [root]; visited.add(root);
    for (let i = 0; i < queue.length; i++) {
      const id = queue[i]; component.push(id);
      for (const edge of nodes[id].edges) {
        const next = edge.a === id ? edge.b : edge.a;
        if (!visited.has(next)) { visited.add(next); queue.push(next); }
      }
    }
    const anchors = component.filter(id => nodes[id].edges.length <= 1);
    // Closed networks have no ground approaches. Keep one stable datum instead
    // of bending the deck over every DEM bump inside the loop.
    if (!anchors.length) anchors.push(root);
    const fixed = new Set(anchors);
    for (const id of anchors) nodes[id].baseline = elevation(nodes[id].coordinate) ?? 0;
    const mean = anchors.reduce((sum,id) => sum + nodes[id].baseline, 0) / anchors.length;
    const free = component.filter(id => !fixed.has(id)), index = new Map(free.map((id,i) => [id,i]));
    const count = free.length;
    const x = new Float64Array(count).fill(mean), b = new Float64Array(count);
    const diagonal = new Float64Array(count), links = free.map(() => []);
    for (let i = 0; i < count; i++) for (const edge of nodes[free[i]].edges) {
      const other = edge.a === free[i] ? edge.b : edge.a, weight = 1 / edge.length;
      diagonal[i] += weight;
      if (fixed.has(other)) b[i] += weight * nodes[other].baseline;
      else links[i].push([index.get(other),weight]);
    }
    const multiply = v => Float64Array.from(v, (value,i) => diagonal[i]*value-links[i].reduce((s,[j,w])=>s+w*v[j],0));
    const dot = (a,b) => a.reduce((sum,value,i)=>sum+value*b[i],0);
    const ax = multiply(x), r = Float64Array.from(b,(value,i)=>value-ax[i]), p = r.slice();
    let residual = dot(r,r);
    for(let step=0;step<count*2&&residual>1e-16;step++) {
      const ap=multiply(p),denominator=dot(p,ap);
      if(denominator<=0)break;
      const alpha=residual/denominator;
      for(let i=0;i<count;i++){x[i]+=alpha*p[i];r[i]-=alpha*ap[i];}
      const next=dot(r,r),beta=next/residual;
      for(let i=0;i<count;i++)p[i]=r[i]+beta*p[i];
      residual=next;
    }
    for(let i=0;i<count;i++)nodes[free[i]].baseline=x[i];
  }
  return nodes;
}
