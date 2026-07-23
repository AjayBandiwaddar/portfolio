// rl-demo.js - Q-Learning Gridworld visualization
(() => {
  const canvas = document.getElementById('gridCanvas');
  const ctx = canvas.getContext('2d');
  const size = 5; // 5x5 grid
  const cell = canvas.width / size;
  const actions = [[0,-1],[1,0],[0,1],[-1,0]]; // up,right,down,left

  // Q-table: size*size x 4
  let Q = new Float32Array(size*size*4);
  let alpha = parseFloat(document.getElementById('alpha').value);
  let gamma = parseFloat(document.getElementById('gamma').value);
  let epsilon = parseFloat(document.getElementById('epsilon').value);
  let episodes = parseInt(document.getElementById('episodes').value,10);

  const goal = {x:size-1,y:size-1};
  const start = {x:0,y:0};

  function stateIndex(x,y){ return (y*size + x); }
  function qIndex(s,a){ return s*4 + a; }

  function resetQ(){ Q.fill(0); draw(); }

  function stepEnv(x,y,action){
    const [dx,dy] = actions[action];
    let nx = Math.max(0, Math.min(size-1, x+dx));
    let ny = Math.max(0, Math.min(size-1, y+dy));
    let reward = -0.02; // small step cost
    let done = false;
    if(nx===goal.x && ny===goal.y){ reward = 1; done = true; }
    return {nx,ny,reward,done};
  }

  function chooseAction(s, eps){
    if(Math.random() < eps) return Math.floor(Math.random()*4);
    // greedy
    let best = 0, bi=0;
    for(let a=0;a<4;a++){ const val = Q[qIndex(s,a)]; if(a===0 || val>best){ best=val; bi=a; } }
    return bi;
  }

  function trainOneEpisode(){
    let x = start.x, y = start.y;
    let s = stateIndex(x,y);
    let steps = 0;
    while(steps < 200){
      const a = chooseAction(s, epsilon);
      const {nx,ny,reward,done} = stepEnv(x,y,a);
      const ns = stateIndex(nx,ny);
      // Q update
      let qsa = Q[qIndex(s,a)];
      // max next Q
      let maxn = Q[qIndex(ns,0)];
      for(let k=1;k<4;k++){ const v = Q[qIndex(ns,k)]; if(v>maxn) maxn=v; }
      Q[qIndex(s,a)] = qsa + alpha*(reward + gamma*maxn - qsa);
      x=nx; y=ny; s=ns;
      steps++;
      if(done) break;
    }
    return steps;
  }

  function train(n, onProgress){
    for(let e=0;e<n;e++){
      trainOneEpisode();
      if(e%10===0 && onProgress) onProgress(e);
    }
  }

  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    // grid
    ctx.strokeStyle = '#14323e';
    for(let i=0;i<=size;i++){
      ctx.beginPath(); ctx.moveTo(i*cell,0); ctx.lineTo(i*cell,canvas.height); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0,i*cell); ctx.lineTo(canvas.width,i*cell); ctx.stroke();
    }
    // Q arrows and values
    ctx.font = '12px monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
    for(let y=0;y<size;y++) for(let x=0;x<size;x++){
      const s = stateIndex(x,y);
      const cx = x*cell + cell/2; const cy = y*cell + cell/2;
      // draw policy arrow (argmax)
      let best = 0, bi=0;
      for(let a=0;a<4;a++){ const v=Q[qIndex(s,a)]; if(a===0||v>best){best=v;bi=a;} }
      // draw small arrow
      ctx.fillStyle = '#8de3ff';
      const len = 12;
      const [ax,ay] = actions[bi];
      ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+ax*len,cy+ay*len); ctx.strokeStyle='rgba(141,227,255,0.9)'; ctx.stroke();
      // draw Q-values
      for(let a=0;a<4;a++){
        const v = Q[qIndex(s,a)];
        let tx = cx + (actions[a][0]*cell/3);
        let ty = cy + (actions[a][1]*cell/3);
        ctx.fillStyle = 'rgba(200,220,230,0.9)';
        ctx.fillText(v.toFixed(2), tx, ty);
      }
    }
    // draw goal
    ctx.fillStyle = '#34d399'; ctx.fillRect(goal.x*cell+4, goal.y*cell+4, cell-8, cell-8);
    // draw start
    ctx.fillStyle = '#7dd3fc'; ctx.fillRect(start.x*cell+6, start.y*cell+6, cell-12, cell-12);
  }

  // UI wiring
  const alphaEl = document.getElementById('alpha');
  const gammaEl = document.getElementById('gamma');
  const epsilonEl = document.getElementById('epsilon');
  const episodesEl = document.getElementById('episodes');
  const trainBtn = document.getElementById('trainBtn');
  const stepBtn = document.getElementById('stepBtn');
  const resetBtn = document.getElementById('resetBtn');

  alphaEl.addEventListener('input', ()=>{ alpha = parseFloat(alphaEl.value); });
  gammaEl.addEventListener('input', ()=>{ gamma = parseFloat(gammaEl.value); });
  epsilonEl.addEventListener('input', ()=>{ epsilon = parseFloat(epsilonEl.value); });
  episodesEl.addEventListener('input', ()=>{ episodes = parseInt(episodesEl.value,10); });

  trainBtn.addEventListener('click', ()=>{
    trainBtn.disabled = true; trainBtn.textContent = 'Training…';
    setTimeout(()=>{
      train(episodes, (e)=>{ if(e%100===0) draw(); });
      draw();
      trainBtn.disabled = false; trainBtn.textContent = 'Train';
    }, 20);
  });

  stepBtn.addEventListener('click', ()=>{
    // run one greedy episode and animate agent
    let x = start.x, y=start.y; let steps=0;
    function stepAnim(){
      const s = stateIndex(x,y);
      // greedy action
      let best=Q[qIndex(s,0)],bi=0; for(let a=1;a<4;a++){ const v=Q[qIndex(s,a)]; if(v>best){best=v;bi=a;} }
      const {nx,ny,done} = stepEnv(x,y,bi);
      // draw agent
      draw();
      ctx.fillStyle='rgba(255,200,80,0.95)'; ctx.beginPath(); ctx.arc(x*cell+cell/2, y*cell+cell/2, cell/6,0,Math.PI*2); ctx.fill();
      x=nx; y=ny; steps++;
      if(!done && steps<200) requestAnimationFrame(stepAnim);
    }
    stepAnim();
  });

  resetBtn.addEventListener('click', ()=>{ resetQ(); });

  // initial draw
  resetQ();
})();
