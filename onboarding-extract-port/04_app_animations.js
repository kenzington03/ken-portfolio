// Lenis
const lenis = new Lenis({duration:1.2,easing:t=>Math.min(1,1.001-Math.pow(2,-10*t)),smoothWheel:true});
(function raf(t){lenis.raf(t);requestAnimationFrame(raf);})(0);

// Nav shadow on scroll
window.addEventListener('scroll',()=>document.getElementById('nav').classList.toggle('solid',window.scrollY>10),{passive:true});

// GSAP
gsap.registerPlugin(ScrollTrigger);

function heroIn(){
  const tl = gsap.timeline({defaults:{ease:'power4.out'}});
  tl.to('#hero-eyebrow',  {opacity:1,duration:0.7,delay:0.15})
    .to('.hero-h1-word',  {y:'0%',duration:1,stagger:0.13},'-=0.4')
    .to('.hero-body',     {opacity:1,y:0,duration:0.7},'-=0.5')
    .to('.btn-primary',   {opacity:1,y:0,duration:0.6},'-=0.45')
    .from('#hero-cluster',{opacity:0,y:30,scale:0.97,duration:0.9},'-=0.7');
}

function initScrollAnims(){
  // Dept section label + headline
  gsap.from('.depts-label,.depts-h2,.depts-sub',{
    scrollTrigger:{trigger:'.depts-header',start:'top 82%'},
    opacity:0,y:28,duration:0.65,stagger:0.1,ease:'power3.out'
  });
  // Dept cards
  gsap.from('.dept-card',{
    scrollTrigger:{trigger:'.dept-grid',start:'top 80%'},
    opacity:0,y:40,duration:0.7,stagger:0.08,ease:'power3.out'
  });
  gsap.from('.dc-cta-card',{
    scrollTrigger:{trigger:'.dept-grid',start:'top 80%'},
    opacity:0,y:40,duration:0.7,delay:0.45,ease:'power3.out'
  });
  // Expect
  gsap.from('.exp-h2,.exp-label,.exp-note',{
    scrollTrigger:{trigger:'.expect-section',start:'top 80%'},
    opacity:0,y:24,duration:0.65,stagger:0.1,ease:'power3.out'
  });
  gsap.from('.exp-card',{
    scrollTrigger:{trigger:'.exp-grid',start:'top 82%'},
    opacity:0,y:32,duration:0.65,stagger:0.09,ease:'power3.out'
  });
  // Timeline
  ScrollTrigger.create({
    trigger:'.tl-track',start:'top 72%',
    onEnter(){
      document.querySelectorAll('[data-tl]').forEach((d,i)=>setTimeout(()=>d.classList.add('show'),i*170));
      setTimeout(()=>document.getElementById('tl-fill').style.width='22%',350);
    }
  });
  gsap.from('.tl-item',{
    scrollTrigger:{trigger:'.tl-track',start:'top 76%'},
    opacity:0,y:18,duration:0.55,stagger:0.1,ease:'power2.out'
  });
}

function initTilt(){
  VanillaTilt.init(document.querySelectorAll('[data-tilt]'),{
    max:5,speed:500,glare:true,'max-glare':0.05,scale:1.02,perspective:1000
  });
}

// Navigate
function navigate(target){
  const home=document.getElementById('page-home');
  const dept=document.getElementById('page-dept');
  const nL=document.getElementById('nav-landing');
  const nD=document.getElementById('nav-dept');

  if(target==='home'){
    dept.classList.remove('active');
    home.classList.add('active');
    nL.style.display='flex'; nD.style.display='none';
    window.scrollTo(0,0);
    setTimeout(initTilt,60);
    return;
  }
  const d=DEPT_DATA[target]; if(!d) return;
  document.getElementById('dh-label').textContent = d.num+' / 05 — '+d.name;
  document.getElementById('dh-h1').innerHTML = d.name+'<br><em>30-day roadmap</em>';
  document.getElementById('dh-tag').textContent = d.tagline;
  document.getElementById('dh-miles').textContent = d.milestones;
  document.getElementById('rm-grid').innerHTML = d.weeksHtml;
  document.getElementById('dept-footer-label').textContent = 'Day 2 Onboarding — '+d.name;
  home.classList.remove('active'); dept.classList.add('active');
  nL.style.display='none'; nD.style.display='block';
  window.scrollTo(0,0);
  gsap.from('.wk-card',{opacity:0,y:28,duration:0.6,stagger:0.09,ease:'power3.out',delay:0.2});
  gsap.from('.dh-stat',{opacity:0,x:20,duration:0.55,stagger:0.1,ease:'power3.out',delay:0.3});
  gsap.from('.dh-h1,.dh-tag,.dh-label',{opacity:0,y:24,duration:0.6,stagger:0.07,ease:'power3.out',delay:0.1});
}

window.addEventListener('DOMContentLoaded',()=>{
  heroIn(); initScrollAnims(); initTilt();
});
