/* =====================================================================
   BRIX FACTORY — Écran d'accueil (avant-partie)
   Aucune dépendance. Expose un seul objet global : window.EcranAccueil

   Utilisation :
     EcranAccueil.ouvrir({
       partie: { enCaisse: 1234, totalGagne: 56789, lignes: 3, lignesMax: 11 }, // ou null = nouvelle partie
       gainsAbsence: 0,                     // argent gagné hors-ligne (0 = rien à afficher)
       score: 56789,                        // score envoyé au classement (argent gagné au total)
       musique: true, sons: true,           // état des deux boutons
       onMusique: on => {}, onSons: on => {},
       onJouer: () => { lancer le jeu },    // appelé APRÈS la popup paysage/portrait
       classement: { fetch: async () => null, submit: async (pseudo, score) => {} },
       popupOrientation: 'tactile',         // 'tactile' (téléphone/tablette), 'toujours' ou 'jamais'
       chemin: ''                           // dossier des images, ex. 'modes/brix/'
     });
     EcranAccueil.fermer();                 // ferme sans lancer
   ===================================================================== */
(function(){
  const SUF=['','K','M','B','T','Qa','Qi','Sx','Sp','Oc','No','Dc'];
  function fmt(n,d=2){
    if(!isFinite(n))return'∞';if(n<0)return'−'+fmt(-n,d);
    if(n<1000){if(n<10&&n%1)return n.toFixed(n<1?2:1);if(n<100&&n%1)return n.toFixed(1);return Math.floor(n)+''}
    let e=Math.floor(Math.log10(n)/3),v=n/Math.pow(1000,e);if(v>=999.995){v/=1000;e++}
    if(e<SUF.length)return v.toFixed(v>=100?1:d)+' '+SUF[e];
    return n.toExponential(2).replace('+','');
  }
  const esc=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
  const EX=['Usine Alpha','MétalCorp','Forge du Nord','RouageMax','Atelier 42','IronBoss','Les Lingots','TurboPresse','Silicia','Mégaboulon'];
  const COL=['#ef4444','#f59e0b','#22c55e','#3b82f6','#8b5cf6','#ec4899','#14b8a6','#f97316','#6366f1','#84cc16','#06b6d4','#a855f7'];
  const col=n=>COL[[...n].reduce((a,c)=>a+c.charCodeAt(0),0)%COL.length];
  const exemples=()=>EX.map((name,i)=>({name,score:Math.round(6e8*Math.pow(.55,i)*(1+((i*37)%10)/40))}));
  const CLE_PSEUDO='brix_pseudo';

  let el=null,o={},pseudo='',tPseudo=0;

  function html(){
    const p=o.partie,c=o.chemin||'';
    return `<div class="ba-fond"></div><div class="ba-vignette"></div>
<div class="ba-wrap">
 <div class="ba-main">
  <div class="ba-logo"><img src="${c}logo-foreuse.png" alt=""><h1>BRIX<span>FACTORY</span></h1><div class="ba-tag">${esc(o.sousTitre||'Idle Tycoon')}</div></div>
  <div class="ba-card ba-carte-jeu">
   ${p?`<div class="ba-partie"><div class="ba-kv"><b>${fmt(p.enCaisse||0)} $</b><span>en caisse</span></div><div class="ba-kv"><b>${fmt(p.totalGagne||0)} $</b><span>gagnés au total</span></div><div class="ba-kv"><b>${p.lignes||0}/${p.lignesMax||11}</b><span>lignes</span></div></div>
   ${o.gainsAbsence>=1?`<div class="ba-absence">💤 Ton usine a gagné <b>+${fmt(o.gainsAbsence)} $</b> pendant ton absence</div>`:''}`
   :`<div class="ba-intro">Construis ton usine, améliore tes machines et deviens le plus grand industriel du classement !</div>`}
   <button class="ba-btn ba-jouer" data-ba="jouer">▶ ${p?'CONTINUER':'JOUER'}</button>
   <div class="ba-ligne">
    <button class="ba-btn orange" data-ba="board">🏆︎ Classement</button>
    <button class="ba-btn gris ic" data-ba="musique" title="Musique">♫</button>
    <button class="ba-btn gris ic" data-ba="sons" title="Sons">🔊︎</button>
   </div>
  </div>
  <div class="ba-card ba-top" data-r="top"></div>
  <div class="ba-ver">Mode de jeu BRIX FACTORY · ${esc(o.version||'v1.0')}</div>
 </div>
 <div class="ba-board ba-card">
  <div class="hd"><div class="gi">🏆︎</div><div><b>Classement mondial</b><small>Argent gagné au total</small></div><button class="x" data-ba="fermer-board">✕</button></div>
  <div data-r="soon"></div>
  <div class="lb-list" data-r="list"></div>
  <div class="lb-name"><label for="baPseudo">Ton pseudo</label><input id="baPseudo" maxlength="16" placeholder="Ton pseudo" autocomplete="off"></div>
 </div>
</div>`;
  }
  const $=r=>el.querySelector(`[data-r="${r}"]`);

  function icones(){
    const m=el.querySelector('[data-ba=musique]'),s=el.querySelector('[data-ba=sons]');
    m.classList.toggle('off',!o.musique);s.classList.toggle('off',!o.sons);s.textContent=o.sons?'🔊︎':'🔇︎';
  }

  async function classement(){
    if(!el)return;
    let rows=null;try{rows=o.classement&&o.classement.fetch?await o.classement.fetch():null}catch(e){rows=null}
    if(!el)return;
    const ex=!Array.isArray(rows);if(ex)rows=exemples();
    const moi={name:pseudo||'Toi',score:Math.floor(o.score||0),me:1};
    const all=rows.filter(r=>!r.me).concat([moi]).sort((a,b)=>b.score-a.score);
    $('soon').innerHTML=ex?`<div class="lb-soon"><span style="font-size:18px">🌐︎</span><span>Le classement en ligne arrive bientôt. Pour l'instant, ces joueurs sont des <b>exemples</b>.</span></div>`:'';
    $('list').innerHTML=all.map((r,i)=>`<div class="lb${i<3?' g'+(i+1):''}${r.me?' me':ex?' ex':''}"><span class="rk${i<3?' md':''}">${i<3?['🥇','🥈','🥉'][i]:i+1}</span><span class="av" style="background:${r.me?'#22c55e':col(r.name)}">${r.me?'★':esc(r.name[0]||'?')}</span><span class="nm">${esc(r.name)}${r.me&&pseudo?' <small style="color:#16a34a">(toi)</small>':''}</span><span class="sc">${fmt(r.score)} $</span></div>`).join('');
    $('list').scrollTop=0;
    const rang=all.findIndex(r=>r.me)+1;
    $('top').innerHTML=`<div class="tp-h"><span>🏆︎ Top 3 mondial</span><button data-ba="board">Voir tout ›</button></div><div class="tp-l">${all.slice(0,3).map((r,i)=>`<div class="tp${r.me?' me':''}"><span class="md">${['🥇','🥈','🥉'][i]}</span><span class="av" style="background:${r.me?'#22c55e':col(r.name)}">${r.me?'★':esc(r.name[0]||'?')}</span><b>${esc(r.me?(pseudo||'Toi'):r.name)}</b><small>${fmt(r.score)} $</small></div>`).join('')}</div><div class="tp-me">Toi : <b>${rang}<sup>${rang===1?'er':'e'}</sup></b> · ${fmt(Math.floor(o.score||0))} $${ex?' · <i>joueurs d\'exemple</i>':''}</div>`;
  }

  // la popup paysage / portrait, à chaque appui sur Jouer
  function popupOrientation(suite){
    const mode=o.popupOrientation||'tactile';
    const montrer=mode==='toujours'||(mode==='tactile'&&matchMedia('(pointer:coarse)').matches);
    if(!montrer){suite();return}
    const d=document.createElement('div');d.className='ba-pop';
    d.innerHTML=`<div><div class="ic">📱↻</div><h2>Paysage ou portrait ?</h2><p>Le jeu marche dans les deux sens, mais il est <b>plus agréable en paysage</b>.</p><button class="ba-btn" data-ba="ok">C'est parti !</button></div>`;
    el.appendChild(d);
    d.addEventListener('click',e=>{if(e.target===d||e.target.closest('[data-ba=ok]')){e.stopPropagation();d.remove();suite()}});
  }

  function jouer(){
    const nm=el.querySelector('#baPseudo').value.trim().slice(0,16);
    if(nm!==pseudo){pseudo=nm;localStorage.setItem(CLE_PSEUDO,nm)}
    if(o.classement&&o.classement.submit)Promise.resolve(o.classement.submit(pseudo||'Joueur',Math.floor(o.score||0))).catch(()=>{});
    popupOrientation(()=>{const f=o.onJouer;fermer(true);f&&f()});
  }

  function clic(e){
    const b=e.target.closest('[data-ba]');if(!b)return;const a=b.dataset.ba;
    if(a==='jouer')jouer();
    else if(a==='board'){el.classList.add('board');classement()}
    else if(a==='fermer-board')el.classList.remove('board');
    else if(a==='musique'){o.musique=!o.musique;icones();o.onMusique&&o.onMusique(o.musique)}
    else if(a==='sons'){o.sons=!o.sons;icones();o.onSons&&o.onSons(o.sons)}
  }

  function ouvrir(opts){
    if(el)fermer();
    o=Object.assign({musique:true,sons:true,popupOrientation:'tactile'},opts||{});
    pseudo=localStorage.getItem(CLE_PSEUDO)||'';
    el=document.createElement('div');el.id='brix-accueil';el.innerHTML=html();
    document.body.appendChild(el);
    el.addEventListener('click',clic);
    const inp=el.querySelector('#baPseudo');inp.value=pseudo;
    inp.addEventListener('input',()=>{pseudo=inp.value.trim().slice(0,16);localStorage.setItem(CLE_PSEUDO,pseudo);clearTimeout(tPseudo);tPseudo=setTimeout(classement,400)});
    inp.addEventListener('keydown',e=>{if(e.key==='Enter')inp.blur()});
    icones();classement();
  }

  function fermer(anime){
    if(!el)return;const x=el;el=null;
    if(anime){x.classList.add('ba-sortie');setTimeout(()=>x.remove(),450)}else x.remove();
  }

  window.EcranAccueil={ouvrir,fermer,
    get pseudo(){return localStorage.getItem(CLE_PSEUDO)||''},
    rafraichirClassement:classement};
})();
