// script.js — Q-learning gridworld demo (client-side)
// Simple, instructive, and small: adjust hyperparams, train, and visualize.

const canvas = document.getElementById('gridCanvas');
const ctx = canvas.getContext('2d');
const gridSize = 6; // 6x6 grid
const cell = canvas.width / gridSize;

let agentPos = [0, gridSize-1];
let goalPos = [gridSize-1, 0];
let walls = new Set();
// add a few walls for complexity
walls.add(key(2,2)); walls.add(key(2,3)); walls.add(key(3,2));

let Q = {}; // state-action table, key-> [4 actions]
const actions = [[0,-1],[0,1],[-1,0],[1,0]]; // up,down,left,right

function key(x,y){return x+','+y}
function initQ(){
  Q = {};
  for(let x=0;x<gridSize;x++) for(let y=0;y<gridSize;y++){
    if(walls.has(key(x,y))) continue;
    Q[key(x,y)] = [0,0,0,0];
  }
}

initQ();

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  // cells
  for(let x=0;x<gridSize;x++){
    for(let y=0;y<gridSize;y++){
      const k = key(x,y);
      if(walls.has(k)){
        ctx.fillStyle = '#253241';
        ctx.fillRect(x*cell,y*cell,cell,cell);
        continue;
      }
      // base cell
      ctx.fillStyle = '#06111b';
      ctx.fillRect(x*cell,y*cell,cell,cell);
      ctx.strokeStyle = 'rgba(255,255,255,0.02)';
      ctx.strokeRect(x*cell,y*cell,cell,cell);
    }
  }
  // goal
  ctx.fillStyle = 'linear-gradient(90deg,#6ee7b7,#60a5fa)';
  ctx.fillStyle = '#0ea5a4';
  ctx.fillRect(goalPos[0]*cell+4,goalPos[1]*cell+4,cell-8,cell-8);
  // agent
  ctx.fillStyle = '#7c3aed';
  ctx.beginPath();
  ctx.arc(agentPos[0]*cell+cell/2,agentPos[1]*cell+cell/2,cell/4,0,Math.PI*2);
  ctx.fill();

  // draw arrows for Q
  for(let x=0;x<gridSize;x++) for(let y=0;y<gridSize;y++){
    const k = key(x,y);
    if(!Q[k]) continue;
    const qs = Q[k];
    const maxv = Math.max(...qs.map(v=>Math.abs(v))) || 1;
    for(let a=0;a<4;a++){
      const v = qs[a];
      const norm = Math.abs(v)/maxv;
      const alpha = 0.1 + 0.9*norm;
      const col = v>=0 ? `rgba(110,231,183,${alpha})` : `rgba(250,204,21,${alpha})`;
      ctx.strokeStyle = col;
      ctx.fillStyle = col;
      const cx = x*cell+cell/2, cy = y*cell+cell/2;
      const ax = actions[a][0]*cell*0.28, ay = actions[a][1]*cell*0.28;
      // arrow line
      ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+ax,cy+ay); ctx.stroke();
      // head
      ctx.beginPath(); ctx.arc(cx+ax,cy+ay,Math.max(2,4*norm),0,Math.PI*2); ctx.fill();
    }
  }
}

function stepState(pos, a){
  const nx = Math.max(0,Math.min(gridSize-1,pos[0]+actions[a][0]));
  const ny = Math.max(0,Math.min(gridSize-1,pos[1]+actions[a][1]));
  if(walls.has(key(nx,ny))) return pos.slice();
  return [nx,ny];
}

function reward(pos){
  if(pos[0]===goalPos[0] && pos[1]===goalPos[1]) return 1;
  return -0.01; // small step penalty
}

function chooseAction(state, epsilon){
  if(Math.random() < epsilon) return Math.floor(Math.random()*4);
  const qs = Q[key(state[0],state[1])];
  let maxv = -Infinity, best=0;
  for(let i=0;i<4;i++){ if(qs[i]>maxv){maxv=qs[i]; best=i}};
  return best;
}

function train(episodes, alpha, gamma, epsilon, onProgress){
  let ep=0;
  function runOneEpisode(){
    let state = [0, gridSize-1];
    let steps=0;
    while(true){
      const a = chooseAction(state, epsilon);
      const next = stepState(state,a);
      const r = reward(next);
      const sKey = key(state[0],state[1]);
      const nKey = key(next[0],next[1]);
      if(!Q[nKey]) Q[nKey] = [0,0,0,0];
      const maxNext = Math.max(...Q[nKey]);
      // Q-learning update
      Q[sKey][a] = Q[sKey][a] + alpha*(r + gamma*maxNext - Q[sKey][a]);
      state = next;
      steps++;
      if(r>0 || steps>200) break; // reached goal or too long
    }
    ep++;
    if(onProgress) onProgress(ep);
    if(ep<episodes) setTimeout(runOneEpisode,0);
    else if(onProgress) onProgress('done');
  }
  runOneEpisode();
}

// controls
const episodesSlider = document.getElementById('episodes');
const alphaSlider = document.getElementById('alpha');
const gammaSlider = document.getElementById('gamma');
const epsilonSlider = document.getElementById('epsilon');
const trainBtn = document.getElementById('trainBtn');
const resetBtn = document.getElementById('resetBtn');
const stepBtn = document.getElementById('stepBtn');

trainBtn.addEventListener('click',()=>{
  trainBtn.disabled = true; resetBtn.disabled = true;
  const episodes = parseInt(episodesSlider.value,10);
  const alpha = parseFloat(alphaSlider.value);
  const gamma = parseFloat(gammaSlider.value);
  const epsilon = parseFloat(epsilonSlider.value);
  const start = Date.now();
  train(episodes,alpha,gamma,epsilon,(progress)=>{
    if(progress==='done'){
      trainBtn.disabled = false; resetBtn.disabled = false;
      draw();
      console.log('training done in',Date.now()-start,'ms');
    } else {
      if(progress%Math.max(1,Math.floor(episodes/5))===0) draw();
    }
  });
});

resetBtn.addEventListener('click',()=>{ initQ(); draw(); });

stepBtn.addEventListener('click',()=>{
  // perform one action from start with greedy policy and move agent for demo
  const start = [0,gridSize-1];
  let s = start.slice();
  let steps=0;
  function one(){
    const a = chooseAction(s,0); // greedy
    s = stepState(s,a);
    agentPos = s.slice();
    draw();
    steps++;
    if(s[0]===goalPos[0] && s[1]===goalPos[1]){ agentPos = start.slice(); return; }
    if(steps<30) setTimeout(one,120);
    else agentPos = start.slice();
  }
  one();
});

// initial draw
draw();
