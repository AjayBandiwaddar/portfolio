// assets/script.js — small neural-ish background + local playground simulator
(function(){
  // Canvas background: neural nodes + connecting lines
  const canvas = document.getElementById('bgcanvas');
  const ctx = canvas.getContext('2d');
  let w=canvas.width=innerWidth; let h=canvas.height=innerHeight; 
  const nodes=[];
  function rand(a,b){return a+Math.random()*(b-a)}
  function setup(){nodes.length=0; const count=Math.floor((w*h)/90000)+40; for(let i=0;i<count;i++){nodes.push({x:rand(0,w),y:rand(0,h),r:rand(0.4,1.8),vx:rand(-0.2,0.2),vy:rand(-0.2,0.2)})}}
  function resize(){w=canvas.width=innerWidth;h=canvas.height=innerHeight; setup()}
  addEventListener('resize',resize)
  function step(){ctx.clearRect(0,0,w,h);
    // subtle gradient
    const g=ctx.createLinearGradient(0,0,w,h); g.addColorStop(0,'rgba(10,6,20,0.6)'); g.addColorStop(1,'rgba(2,4,12,0.6)'); ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
    // draw nodes
    for(let i=0;i<nodes.length;i++){const n=nodes[i]; n.x+=n.vx; n.y+=n.vy; if(n.x<0||n.x>w)n.vx*=-1; if(n.y<0||n.y>h)n.vy*=-1;}
    // draw connections
    for(let i=0;i<nodes.length;i++){for(let j=i+1;j<i+4 && j<nodes.length;j++){const a=nodes[i], b=nodes[j]; const dx=a.x-b.x, dy=a.y-b.y; const d=Math.hypot(dx,dy); if(d<140){ctx.beginPath(); ctx.strokeStyle='rgba(122,252,255,'+((140-d)/200*0.12)+')'; ctx.lineWidth=1; ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke()}}}
    // draw nodes
    for(const n of nodes){ctx.beginPath(); ctx.fillStyle='rgba(122,252,255,0.06)'; ctx.arc(n.x,n.y,n.r+1,0,Math.PI*2); ctx.fill();}
    requestAnimationFrame(step);
  }
  setup(); step();

  // Playground: a small simulate function that transforms prompt into structured plan
  const runBtn = document.getElementById('run');
  const promptEl = document.getElementById('prompt');
  const respEl = document.getElementById('response');

  function simulate(prompt){
    // Create a concise "engineer's design" style output from prompt
    const lines = [];
    lines.push('Design brief — condensed (auto-generated sample):');
    lines.push('1) Goal: '+prompt.split('\n')[0].slice(0,140));
    lines.push('2) Core components: Ingestion -> Indexing (chunking + embeddings) -> Vector DB -> Prompt template -> LLM inference');
    lines.push('3) Latency & cost levers: embedding prefetch, cached top-K, async composition, quantized models for hot paths');
    lines.push('4) Observability: synthetic queries, output scoring, drift monitors, request tracing');
    lines.push('5) Safety & guardrails: answer grounding, hallucination score, human escalation');
    lines.push('\nImplementation sketch (3–6 week MVP):');
    lines.push('- Week 1: data contract, chunker, embedding pipeline + small vector store');
    lines.push('- Week 2: LLM selection & prompt iteration, local eval harness');
    lines.push('- Week 3: deploy inference as autoscaling microservice, attach monitoring');
    lines.push('- Week 4: A/B rollout, latency tuning, cost-optimisations');
    lines.push('\nMetrics to track: P95 latency, cost / 1k queries, grounding fidelity, error rate');
    return lines.join('\n');
  }

  runBtn.addEventListener('click', ()=>{
    respEl.textContent = 'Thinking...';
    setTimeout(()=>{respEl.textContent = simulate(promptEl.value)},300);
  });

})();
