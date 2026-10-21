/* Whole-page interactions. All conversations are local illustrative presets. */
(() => {
'use strict';
const root=document.documentElement, reduced=matchMedia('(prefers-reduced-motion: reduce)'), mobile=matchMedia('(max-width:680px)');
let heroSwipe=null, storySwipe=null, featureSwipe=null, mobileHeroCards=[];
let storyIndex=0;
root.classList.add('js-ready');
const roles=[["林知意","female-1.jpg","温柔 · 知性","设计师","把你随口提起的小事，认真放在心上。安静，却总能给你刚刚好的回应。","你来啦。我等了你一会儿。"],["苏念念","female-2.jpeg","元气 · 直率","学生","从好玩的新鲜事，到偶尔的小烦恼。和她说话，日常也会变得热热闹闹。","今天也是想你的一天呀。"],["顾晚","female-3.jpg","文艺 · 细腻","自由撰稿人","分享一本书、一首歌，或是今天的晚霞。在细碎的日常里，找到彼此的共鸣。","今天的风，好像很适合散步。"],["陆辰","male-1.jpg","可靠 · 坦率","建筑师","认真听你讲，也会直接说出自己的想法。不用刻意找话题，相处就很自在。","别一个人扛着，跟我说说。"],["沈墨","male-2.jpeg","沉静 · 成熟","程序员","话不多，但每一句都认真。你想说，他就听；你想安静，他也愿意陪着。","别熬太晚。我在。"]];
const scripts=[
[['ta','忙完了吗？想来陪你待一会儿。'],['me','刚下班，今天有点累。'],['ta','记得你说，累的时候喜欢安静地待着。那我就陪着你。'],['me','这样待着，好像也挺好的。'],['ta','不急，你想说的时候，我就在。']],
[['ta','出现！今天想听你说件小事。'],['me','今天没什么特别的呀。'],['ta','普通的一天，也想听你讲。'],['me','那就从午饭开始说吧。'],['ta','好呀，我准备好认真听啦。']],
[['ta','今天的晚霞，像你说的那幅画。'],['me','想停下来多看一会儿。'],['ta','那就慢一点，把今天留给路边的风。'],['me','散步会轻松很多。'],['ta','等你想分享的时候，我就在。']],
[['ta','忙完了吗？记得按时吃晚饭。'],['me','差点又忙忘了。'],['ta','先吃点东西，再慢慢跟我说。'],['me','有件事，想问问你的想法。'],['ta','好，我听着。我们一起想。']],
[['ta','还没睡？'],['me','有一点睡不着，想找你聊聊。'],['ta','我在。不着急说，慢慢来。'],['me','这样待着也挺好的。'],['ta','嗯。你想说的时候，我就在。']]
];
const memories=['累的时候，喜欢被安静地陪着','心情不好时，喜欢听一点新鲜事','喜欢在傍晚散步，看看路边的花','忙起来容易忘记吃饭','喜欢安静的夜晚，不喜欢被催促'];
let role=0, manualPaused=false, visible=false, touchReading=false, timer=null, cursor=0, scene=scripts[0];
const body=document.getElementById('hpChatBody'),phone=document.getElementById('heroPhone'),toggle=document.getElementById('chatToggle'),stage=document.getElementById('heroStage');
let playbackChat=body, playbackStatus=document.getElementById('hpStatus'), playbackStage=stage;
const animations=new Set();
function fade(node,duration=380){if(reduced.matches||document.hidden||!node.animate)return;const a=node.animate([{opacity:.45},{opacity:1}],{duration,easing:'ease-out'});animations.add(a);a.finished.then(()=>animations.delete(a),()=>animations.delete(a));}
function addMessage([from,text],index,animate=false,target=playbackChat){
  const el=document.createElement('div');el.className='hp-msg hp-msg-'+from;
  el.append(document.createTextNode(text));
  const time=document.createElement('small');time.textContent=index===0?'23:47':index<3?'23:48':'23:49';
  if(from==='me')time.textContent+=' · 已读';
  el.append(time);target.append(el);if(animate)fade(el,280);
}
function conversationFor(index){return scripts[index];}
function completeConversationStatus(messages){return '完整对话 · '+messages.length+' 条消息';}
function resetConversationPlayback(){
  if(timer)clearTimeout(timer);timer=null;
  document.querySelectorAll('.hp-typing').forEach(el=>el.remove());
  body.style.removeProperty('min-height');
  body.replaceChildren();scene.forEach((message,index)=>addMessage(message,index,false,body));
  document.getElementById('hpStatus').textContent=completeConversationStatus(scene);
  // Restore an interrupted mobile card before another role becomes active.
  mobileHeroCards.forEach((card,index)=>{
    const messages=conversationFor(index),chat=mobileField(card,'hpChatBody');
    chat.style.removeProperty('min-height');
    chat.replaceChildren();messages.forEach((message,i)=>addMessage(message,i,false,chat));
    mobileField(card,'hpStatus').textContent=completeConversationStatus(messages);
  });
  playbackStage=mobile.matches&&mobileHeroCards[role]?mobileHeroCards[role]:stage;
  playbackChat=playbackStage.querySelector('.hp-chat-body');
  playbackStatus=playbackStage.querySelector('.hp-chat-head>div>span');
  cursor=scene.length;
  playbackStatus.textContent=completeConversationStatus(scene);
  manualPaused=false;
  if(!reduced.matches)startConversationPlayback();
}
function startConversationPlayback(){
  // Reserve the complete conversation's space so incoming messages never move the page.
  playbackChat.style.minHeight=playbackChat.getBoundingClientRect().height+'px';
  playbackChat.replaceChildren();cursor=0;manualPaused=false;
}
function showTyping(){
  playbackStatus.textContent='正在输入…';
  if(playbackChat.querySelector('.hp-typing'))return;
  const bubble=document.createElement('div');bubble.className='hp-msg hp-msg-ta hp-typing';
  bubble.setAttribute('aria-hidden','true');
  for(let i=0;i<3;i++)bubble.append(document.createElement('i'));
  playbackChat.append(bubble);
}
function renderConversation(){if(timer)clearTimeout(timer);timer=null;scene=conversationFor(role);document.getElementById('hpMemoryText').textContent=memories[role];document.getElementById('hpName').textContent=roles[role][0];document.getElementById('hpStatus').textContent=completeConversationStatus(scene);animations.forEach(a=>a.cancel());animations.clear();const head=phone.querySelector('.hp-chat-head>img');head.src='./assets/avatars/'+roles[role][1];const portrait=document.getElementById('heroPortraitImage');portrait.src=head.src;portrait.alt=roles[role][0]+'的角色示例形象';stage.querySelector('.portrait-name').textContent=roles[role][0];stage.querySelector('.portrait-traits').textContent=roles[role][2];document.getElementById('heroPersonaStatus').textContent='角色示例 · '+roles[role][0];document.querySelectorAll('[data-hero-role]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.heroRole===role)));resetConversationPlayback();syncPlayback();}
function syncPlayback(){
  const done=cursor>=scene.length;
  const play=!done&&!manualPaused&&!touchReading&&visible&&!document.hidden&&!reduced.matches;
  [stage,...mobileHeroCards].forEach(card=>card.dataset.demoPaused=String(card!==playbackStage||!play));
  [toggle,...mobileHeroCards.map(card=>mobileField(card,'chatToggle'))].forEach(button=>{
    button.hidden=reduced.matches;
    button.setAttribute('aria-pressed',String(!done&&manualPaused));
    button.querySelector('span').textContent=done?'重新播放':manualPaused?'继续播放':'暂停播放';
    button.querySelector('path').setAttribute('d',done||manualPaused?'m9 5 11 7-11 7V5Z':'M9 5v14M15 5v14');
  });
  if(!play){if(timer)clearTimeout(timer);timer=null;if(!done&&manualPaused)playbackStatus.textContent='演示已暂停 · '+cursor+' / '+scene.length;return;}
  if(timer)return;
  const message=scene[cursor];
  if(message[0]==='ta')showTyping();else playbackStatus.textContent='此刻，想陪着你';
  const delay=message[0]==='ta'?Math.min(1400,850+message[1].length*10):1700;
  timer=setTimeout(()=>{
    timer=null;playbackChat.querySelector('.hp-typing')?.remove();
    addMessage(message,cursor,true);cursor++;
    playbackStatus.textContent=cursor>=scene.length?completeConversationStatus(scene):'对话演示 · '+cursor+' / '+scene.length;syncPlayback();
  },delay);
}
// Play once by default, keep every message, and let readers pause or replay.
function toggleConversationPlayback(){
  if(reduced.matches)return;
  if(cursor>=scene.length)startConversationPlayback();
  else manualPaused=!manualPaused;
  syncPlayback();
}
toggle.addEventListener('click',toggleConversationPlayback);
document.querySelectorAll('[data-hero-role]').forEach(b=>b.addEventListener('click',()=>{role=+b.dataset.heroRole;renderConversation();heroSwipe?.go(role,'auto');fade(document.getElementById('heroPortraitImage'));}));
// Desktop story selection and the mobile swipe deck share one selected role.
function showStory(index,animate=true){
  storyIndex=index;const r=roles[index];
  document.querySelectorAll('[data-role-choice]').forEach(n=>n.setAttribute('aria-pressed',String(+n.dataset.roleChoice===index)));
  const image=document.getElementById('salonImage');image.src='./assets/avatars/'+r[1];
  for(const [id,value] of Object.entries({salonName:r[0],salonJob:r[3],salonTraits:r[2],salonQuote:'“'+r[5]+'”',salonDescription:r[4]}))document.getElementById(id).textContent=value;
  document.getElementById('salonPreview').dataset.heroPreview=index;
  if(animate)fade(image);
}
function previewRole(index){role=index;renderConversation();heroSwipe?.go(index,'auto');}
document.querySelectorAll('[data-role-choice]').forEach(b=>b.addEventListener('click',()=>{showStory(+b.dataset.roleChoice);storySwipe?.go(storyIndex,'auto');}));
document.getElementById('salonPreview').addEventListener('click',e=>previewRole(+e.currentTarget.dataset.heroPreview));
// Desktop keeps its keyboard tabs; mobile exposes all four panels in a swipe track.
const tabs=Array.from(document.querySelectorAll('[data-feature-tab]')),panels=tabs.map(t=>document.getElementById(t.getAttribute('aria-controls'))),tablist=document.querySelector('[role=tablist]');let active=0;
function selectFeature(index,animate=true,fromSwipe=false){
  active=index;
  tabs.forEach((tab,i)=>{
    tab.setAttribute('aria-selected',String(i===index));tab.tabIndex=i===index?0:-1;
    const panel=panels[i];panel.hidden=!mobile.matches&&i!==index;
    panel.inert=!mobile.matches&&i!==index;panel.setAttribute('role',mobile.matches?'group':'tabpanel');
    if(mobile.matches){panel.setAttribute('aria-roledescription','幻灯片');panel.setAttribute('aria-hidden',String(i!==index));}
    else{panel.removeAttribute('aria-roledescription');panel.removeAttribute('aria-hidden');}
    panel.tabIndex=mobile.matches?-1:0;panel.classList.toggle('is-active',i===index);
  });
  if(!fromSwipe)featureSwipe?.go(index,'auto');
  if(animate&&!mobile.matches)fade(panels[index]);
}

tabs.forEach((tab,i)=>{tab.addEventListener('click',()=>selectFeature(i));tab.addEventListener('keydown',e=>{let next=i;if(['ArrowRight','ArrowDown'].includes(e.key))next=(i+1)%tabs.length;else if(['ArrowLeft','ArrowUp'].includes(e.key))next=(i+tabs.length-1)%tabs.length;else if(e.key==='Home')next=0;else if(e.key==='End')next=tabs.length-1;else return;e.preventDefault();selectFeature(next);tabs[next].focus();});});selectFeature(0,false);
const tabMedia=matchMedia('(max-width:900px)');const orient=()=>tablist.setAttribute('aria-orientation',tabMedia.matches?'horizontal':'vertical');tabMedia.addEventListener('change',orient);orient();
const menu=document.getElementById('menuBtn'),nav=document.getElementById('siteNav');function closeMenu(focus=false){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','打开导航菜单');if(focus)menu.focus();}menu.addEventListener('click',()=>{const open=!nav.classList.contains('open');nav.classList.toggle('open',open);menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'关闭导航菜单':'打开导航菜单');if(open)nav.querySelector('a').focus();});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav.classList.contains('open'))closeMenu(true);});document.addEventListener('click',e=>{if(!e.target.closest('.site-nav'))closeMenu();});nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>closeMenu()));matchMedia('(min-width:681px)').addEventListener('change',e=>{if(e.matches)closeMenu();});
function motion(){root.dataset.motion=reduced.matches?'off':'on';if(reduced.matches){animations.forEach(a=>a.cancel());animations.clear();}syncPlayback();}reduced.addEventListener('change',()=>{renderConversation();motion();});document.addEventListener('visibilitychange',()=>{root.classList.toggle('page-hidden',document.hidden);if(document.hidden){touchReading=false;animations.forEach(a=>a.cancel());animations.clear();}syncPlayback();});
if('IntersectionObserver'in window){new IntersectionObserver(es=>{visible=es[0].isIntersecting;syncPlayback();},{threshold:.15}).observe(document.querySelector('.hero-scene-wrap'));new IntersectionObserver(es=>{panels.forEach(p=>p.classList.toggle('scene-visible',es[0].isIntersecting));},{threshold:.2}).observe(document.querySelector('.feature-studio'));}else visible=true;
// One scroll frame updates the fixed navigation, reading line and mobile action.
const readingNav=document.querySelector('.site-nav'),readingLine=document.getElementById('readingProgress');
const readingSections=['characters','preview','custom','download','faq'].map(id=>document.getElementById(id));
const readingLinks=Array.from(document.querySelectorAll('.nav-link,.nav-download'));
let readingSection='';
function updateReadingState(){
  const position=scrollY,range=document.documentElement.scrollHeight-innerHeight;
  const progress=range>0?Math.min(1,Math.max(0,position/range)):0;
  const boundary=Math.min(240,innerHeight*.28);
  let current='';
  readingSections.forEach(section=>{if(section.getBoundingClientRect().top<=boundary)current=section.id;});
  if(range>0&&position>=range-3)current='faq';
  readingLine.style.transform='scaleX('+progress.toFixed(4)+')';
  const scrolled=position>24;
  if(readingNav.dataset.scrolled!==String(scrolled))readingNav.dataset.scrolled=String(scrolled);
  if(current!==readingSection){
    readingSection=current;
    readingLinks.forEach(link=>{if(link.hash==='#'+current)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});
  }
}
const bar=document.querySelector('.mobile-action-bar');let scheduled=false;function updateBar(){scheduled=false;updateReadingState();const hide=innerWidth>680||[document.getElementById('heroDownload'),document.getElementById('apkDownload')].some(e=>{const r=e.getBoundingClientRect();return r.top<innerHeight-80&&r.bottom>0;});bar.dataset.hidden=String(hide);bar.inert=hide;}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(updateBar);}addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule,{passive:true});new ResizeObserver(schedule).observe(document.querySelector('main'));addEventListener('pageshow',schedule);document.fonts?.ready.then(schedule);document.querySelectorAll('details').forEach(d=>d.addEventListener('toggle',()=>{schedule();if(d.open)fade(d.querySelector('.faq-body,.disclosure-content'),250);}));
/* Mobile uses native scrolling: touch, momentum and vertical page scrolling stay with the browser. */
function nativeSwipe(track,{names,label,onChange=()=>{},initial=0,retainDesktopState=false}){
  const slides=Array.from(track.children);let current=initial,frame=0,lastWidth=0,scrolling=false,touching=false,settleTimer=null;
  track.classList.add('swipe-track');track.dataset.swipe=label;
  track.setAttribute('aria-label',names.length+' 张'+label+'卡片，左右滑动切换');
  const meta=document.createElement('div');meta.className='swipe-meta';
  const hint=document.createElement('span');hint.className='swipe-instruction';hint.textContent='↔ 左右滑动切换';
  const status=document.createElement('span');status.className='swipe-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.setAttribute('aria-atomic','true');
  const dots=document.createElement('span');dots.className='swipe-dots';dots.setAttribute('aria-hidden','true');
  slides.forEach(()=>dots.append(document.createElement('i')));meta.append(hint,status,dots);track.after(meta);
  function paint(){
    status.textContent=names[current]+' · '+(current+1)+' / '+slides.length;
    slides.forEach((slide,i)=>{
      slide.classList.toggle('is-current',i===current);dots.children[i].classList.toggle('is-current',i===current);
      if(mobile.matches){slide.inert=!scrolling&&i!==current;slide.setAttribute('aria-hidden',String(i!==current));}
      else if(!retainDesktopState){slide.inert=false;slide.removeAttribute('aria-hidden');}
    });
    track.tabIndex=mobile.matches?0:-1;
    track.setAttribute('aria-label',names.length+' 张'+label+(mobile.matches?'卡片，左右滑动切换':'展示'));
    if(mobile.matches){track.setAttribute('role','group');track.setAttribute('aria-roledescription','轮播');}
    else{track.removeAttribute('role');track.removeAttribute('aria-roledescription');}
  }
  function offset(index){return slides[index].offsetLeft-slides[0].offsetLeft;}
  function activate(index){if(index===current)return;current=index;paint();onChange(index);}
  function releaseSlides(){scrolling=true;slides.forEach(slide=>{slide.inert=false;});}
  function scheduleSettle(){clearTimeout(settleTimer);settleTimer=setTimeout(settle,170);}
  function settle(){
    if(touching||!mobile.matches||!track.clientWidth)return;
    readScroll();
    // Native snapping normally handles this; settle explicitly on browsers that omit it after touchend.
    if(Math.abs(track.scrollLeft-offset(current))>1){
      track.scrollTo({left:offset(current),behavior:reduced.matches?'auto':'smooth'});scheduleSettle();return;
    }
    scrolling=false;paint();
  }
  function go(index,behavior='auto'){
    index=Math.max(0,Math.min(slides.length-1,index));
    if(mobile.matches&&track.clientWidth)releaseSlides();activate(index);
    if(mobile.matches&&track.clientWidth){track.scrollTo({left:offset(index),behavior:reduced.matches?'auto':behavior});scheduleSettle();}
  }
  function readScroll(){
    frame=0;if(!mobile.matches||!track.clientWidth)return;
    let best=0,distance=Infinity;
    slides.forEach((_,i)=>{const d=Math.abs(offset(i)-track.scrollLeft);if(d<distance){best=i;distance=d;}});activate(best);
  }
  track.addEventListener('scroll',()=>{if(!scrolling)releaseSlides();if(!frame)frame=requestAnimationFrame(readScroll);scheduleSettle();},{passive:true});
  track.addEventListener('touchstart',()=>{touching=true;clearTimeout(settleTimer);releaseSlides();},{passive:true});
  for(const type of['touchend','touchcancel'])track.addEventListener(type,()=>{touching=false;scheduleSettle();},{passive:true});
  track.addEventListener('scrollend',()=>{readScroll();scheduleSettle();});
  track.addEventListener('keydown',e=>{
    if(!mobile.matches||e.target!==track)return;
    let next=current;
    if(e.key==='ArrowRight')next++;else if(e.key==='ArrowLeft')next--;else if(e.key==='Home')next=0;else if(e.key==='End')next=slides.length-1;else return;
    e.preventDefault();go(next,'smooth');
  });
  function sync(){scrolling=false;touching=false;clearTimeout(settleTimer);paint();if(mobile.matches&&track.clientWidth)track.scrollTo({left:offset(current),behavior:'auto'});}
  new ResizeObserver(()=>{const width=track.clientWidth;if(width===lastWidth)return;lastWidth=width;sync();}).observe(track);
  paint();requestAnimationFrame(sync);return {go,sync};
}
function cloneForSwipe(original){
  const clone=original.cloneNode(true);
  [clone,...clone.querySelectorAll('*')].forEach(el=>{
    if(el.id){el.dataset.mobileField=el.id;el.removeAttribute('id');}
    el.removeAttribute('aria-controls');el.removeAttribute('aria-labelledby');el.removeAttribute('aria-describedby');
  });
  clone.classList.add('swipe-card');return clone;
}
function mobileField(card,name){return card.querySelector('[data-mobile-field="'+name+'"]');}
function setupMobileSwipes(){
  const heroDeck=document.createElement('div');heroDeck.className='mobile-only-deck mobile-hero-deck';
  const heroTrack=document.createElement('div');heroTrack.id='mobileHeroTrack';heroDeck.append(heroTrack);stage.after(heroDeck);
  heroTrack.addEventListener('pointerdown',()=>{touchReading=true;syncPlayback();},{passive:true});
  for(const type of ['pointerup','pointercancel'])addEventListener(type,()=>{if(touchReading){touchReading=false;syncPlayback();}},{passive:true});
  mobileHeroCards=roles.map((r,index)=>{
    const card=cloneForSwipe(stage);card.setAttribute('aria-label',r[0]+'，第 '+(index+1)+' 张，共 '+roles.length+' 张');card.setAttribute('aria-roledescription','幻灯片');
    const image=mobileField(card,'heroPortraitImage');image.src='./assets/avatars/'+r[1];image.alt=r[0]+'的角色示例形象';image.removeAttribute('fetchpriority');image.loading='lazy';
    card.querySelector('.portrait-name').textContent=r[0];card.querySelector('.portrait-traits').textContent=r[2];
    mobileField(card,'hpMemoryText').textContent=memories[index];
    card.querySelector('.hp-chat-head>img').src=image.src;mobileField(card,'hpName').textContent=r[0];mobileField(card,'hpStatus').textContent='此刻，想陪着你';
    mobileField(card,'heroPhone').removeAttribute('tabindex');
    mobileField(card,'chatToggle').addEventListener('click',toggleConversationPlayback);
    heroTrack.append(card);return card;
  });
  heroSwipe=nativeSwipe(heroTrack,{names:roles.map(r=>r[0]),label:'角色对话',initial:role,onChange:index=>{role=index;renderConversation();}});
  const storyDeck=document.createElement('div');storyDeck.className='mobile-only-deck mobile-story-deck';
  const storyTrack=document.createElement('div');storyTrack.id='mobileStoryTrack';storyDeck.append(storyTrack);document.querySelector('.character-salon').append(storyDeck);
  roles.forEach((r,index)=>{
    const card=cloneForSwipe(document.getElementById('roleStory'));card.setAttribute('role','group');card.setAttribute('aria-roledescription','幻灯片');card.setAttribute('aria-label',r[0]+'，第 '+(index+1)+' 张，共 '+roles.length+' 张');
    const image=mobileField(card,'salonImage');image.src='./assets/avatars/'+r[1];image.alt=r[0]+'的角色示例形象';
    for(const [name,value]of Object.entries({salonName:r[0],salonJob:r[3],salonTraits:r[2],salonQuote:'“'+r[5]+'”',salonDescription:r[4]}))mobileField(card,name).textContent=value;
    const link=mobileField(card,'salonPreview');link.dataset.heroPreview=index;link.addEventListener('click',()=>previewRole(index));
    storyTrack.append(card);
  });
  storySwipe=nativeSwipe(storyTrack,{names:roles.map(r=>r[0]),label:'角色介绍',initial:storyIndex,onChange:index=>showStory(index,false)});
  featureSwipe=nativeSwipe(document.querySelector('.feature-panels'),{names:tabs.map(t=>t.querySelector('b').textContent),label:'陪伴功能',initial:active,retainDesktopState:true,onChange:index=>selectFeature(index,false,true)});
  const gallerySwipe=nativeSwipe(document.querySelector('.app-screens'),{names:['聊天列表','聊天详情','发现页','个人中心'],label:'界面图片'});
  mobile.addEventListener('change',()=>{
    selectFeature(active,false);renderConversation();
    requestAnimationFrame(()=>[heroSwipe,storySwipe,featureSwipe,gallerySwipe].forEach(deck=>deck.sync()));
  });
  selectFeature(active,false);
}
/* Pointer light is limited to screenshot glass; captions and reading surfaces stay still. */
function setupPhoneGallery(){
  const pointer=matchMedia('(hover:hover) and (pointer:fine) and (min-width:681px)');
  const resets=[];
  document.querySelectorAll('.screenshot-card').forEach(card=>{
    const shell=card.querySelector('.phone-shell');let frame=0,bounds=null,x=0,y=0;
    function reset(){
      if(!bounds&&!frame)return;
      cancelAnimationFrame(frame);frame=0;bounds=null;card.classList.remove('is-phone-active');
      for(const prop of['--phone-rx','--phone-ry','--shine-x','--shine-y'])shell.style.removeProperty(prop);
    }
    function paint(){
      frame=0;if(!bounds)return;
      shell.style.setProperty('--phone-rx',((.5-y)*5).toFixed(2)+'deg');
      shell.style.setProperty('--phone-ry',((x-.5)*7).toFixed(2)+'deg');
      shell.style.setProperty('--shine-x',(x*100).toFixed(1)+'%');
      shell.style.setProperty('--shine-y',(y*100).toFixed(1)+'%');
    }
    function move(event){
      if(!pointer.matches||reduced.matches||event.pointerType==='touch')return;
      if(!bounds){
        // Measure the untransformed figure, not the moving phone, to avoid cursor jitter.
        const rect=card.getBoundingClientRect();
        bounds={left:rect.left,top:rect.top,width:card.clientWidth,height:shell.offsetHeight};
        card.classList.add('is-phone-active');
      }
      if(event.clientY>bounds.top+bounds.height){reset();return;}
      x=Math.max(0,Math.min(1,(event.clientX-bounds.left)/bounds.width));
      y=Math.max(0,Math.min(1,(event.clientY-bounds.top)/bounds.height));
      if(!frame)frame=requestAnimationFrame(paint);
    }
    card.addEventListener('pointerenter',move);
    card.addEventListener('pointermove',move);
    card.addEventListener('pointerleave',reset);
    card.addEventListener('pointercancel',reset);
    resets.push(reset);
  });
  function resetAll(){resets.forEach(reset=>reset());}
  pointer.addEventListener('change',resetAll);reduced.addEventListener('change',resetAll);
  addEventListener('scroll',resetAll,{passive:true});addEventListener('resize',resetAll,{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)resetAll();});
}
/* A single entrance as each section arrives; never animate individual swipe slides. */
function setupScrollReveals(){
  if(reduced.matches||!('IntersectionObserver'in window)||!Element.prototype.animate)return;
  const targets=[...document.querySelectorAll([
    '#characters .section-heading','.character-salon',
    '#preview .section-heading','.feature-studio','.extras-heading',
    '.extras-grid .extra-item','.screens-gallery',
    '.creation-copy','.creation-workshop','.download-pass','.faq-intro','.faq-list','.footer-top'
  ].join(','))];
  const pending=new Set(),playing=new Map();let observer;
  function finish(node){
    pending.delete(node);observer?.unobserve(node);node.classList.remove('is-reveal-pending');
    playing.get(node)?.cancel();playing.delete(node);
  }
  function finishAll(){targets.forEach(finish);observer?.disconnect();}
  function enter(node){
    if(!pending.has(node))return;
    finish(node);
    if(reduced.matches||document.hidden)return;
    const heading=node.matches('.section-heading,.extras-heading,.faq-intro');
    const siblings=node.matches('.extra-item')?[...node.parentElement.children]:[];
    const delay=siblings.length?(siblings.indexOf(node)%(mobile.matches?1:3))*65:0;
    try{
      const animation=node.animate([
        {opacity:0,transform:`translateY(${heading?12:22}px)`},
        {opacity:1,transform:'translateY(0)'}
      ],{duration:heading?640:820,delay,easing:'cubic-bezier(.22,1,.36,1)',fill:'backwards'});
      playing.set(node,animation);
      animation.finished.then(()=>{if(playing.get(node)===animation)playing.delete(node);},()=>{});
    }catch{finish(node);}
  }
  function showDestination(hash){
    if(!hash||hash==='#')return;
    let destination;try{destination=document.getElementById(decodeURIComponent(hash.slice(1)));}catch{return;}
    if(!destination)return;
    targets.forEach(node=>{if(node.contains(destination)||destination.contains(node))finish(node);});
  }
  try{
    observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{if(entry.isIntersecting)enter(entry.target);});
    },{rootMargin:'0px 0px -40px 0px',threshold:0});
    targets.forEach(node=>{
      // Initial viewport and restored scroll positions are readable immediately.
      if(node.getBoundingClientRect().top<innerHeight||node.contains(document.activeElement))return;
      observer.observe(node);pending.add(node);node.classList.add('is-reveal-pending');
    });
    showDestination(location.hash);
    document.addEventListener('focusin',event=>{
      targets.forEach(node=>{if(node.contains(event.target))finish(node);});
    });
    document.addEventListener('click',event=>{
      const link=event.target.closest('a[href]');if(!link)return;
      const url=new URL(link.href,location.href);
      if(url.origin===location.origin&&url.pathname===location.pathname&&url.search===location.search)showDestination(url.hash);
    });
    addEventListener('hashchange',()=>showDestination(location.hash));
    addEventListener('pageshow',event=>{if(event.persisted)finishAll();});
    addEventListener('beforeprint',finishAll);
    reduced.addEventListener('change',()=>{if(reduced.matches)finishAll();});
    document.addEventListener('visibilitychange',()=>{if(document.hidden)[...playing.keys()].forEach(finish);});
  }catch{finishAll();}
}
/* Keep secondary explanations available without stretching the mobile landing page. */
function setupMobileDisclosures(){
  function disclosure(panel,id,closedLabel,openLabel){
    if(!panel)return;
    panel.id=id;
    const button=document.createElement('button');
    button.type='button';button.className='mobile-disclosure-toggle';
    button.setAttribute('aria-controls',id);
    panel.before(button);
    let expanded=false;
    function sync(){
      const collapsed=mobile.matches&&!expanded;
      button.hidden=!mobile.matches;
      if(collapsed&&panel.contains(document.activeElement))button.focus();
      panel.hidden=collapsed;
      button.setAttribute('aria-expanded',String(!collapsed));
      button.textContent=collapsed?closedLabel:openLabel;
    }
    button.addEventListener('click',()=>{expanded=!expanded;sync();});
    mobile.addEventListener('change',sync);sync();
  }
  const extras=document.querySelector('.extras-grid');
  if(extras){
    const details=document.createElement('div');details.className='daily-extras-details';
    const nodes=[extras,document.querySelector('.availability-note')].filter(Boolean);
    extras.before(details);details.append(...nodes);
    disclosure(details,'mobileDailyExtras','查看日程、朋友圈等玩法','收起更多日常玩法');
  }
  const workshop=document.querySelector('.creation-workshop');
  if(workshop){
    const details=document.createElement('div');details.className='workshop-details';
    const fields=workshop.querySelector('.workshop-fields');
    if(fields){fields.before(details);details.append(fields,workshop.querySelector('.workshop-bottom'));
      disclosure(details,'mobileWorkshopDetails','展开角色设定示例','收起设定示例');}
  }
  disclosure(document.querySelector('.install-steps'),'mobileInstallSteps','查看安装步骤','收起安装步骤');
  const faq=document.querySelector('.faq-list');
  if(faq){
    const rest=[...faq.children].filter(node=>node.matches('details')).slice(4);
    if(rest.length){
      const more=document.createElement('div');more.className='faq-more';
      rest[0].before(more);more.append(...rest);
      disclosure(more,'mobileMoreFaq',`更多问题（${rest.length}）`,'收起其他问题');
    }
  }
}
setupMobileSwipes();
setupMobileDisclosures();

renderConversation();motion();updateBar();if(!reduced.matches){fade(document.querySelector('.hero-intro'),700);fade(stage,1000);}
setupScrollReveals();
setupPhoneGallery();
})();
