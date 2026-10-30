// OPTIONAL MONETIZATION SETTINGS — paste your own provider URLs after setting up the accounts.
// Keep these blank until you have verified the provider, fees, and account ownership.
const BLACKOUT_CONFIG = {
  donationUrl: '',       // Example: your approved Ko-fi / Buy Me a Coffee / donation page URL
  premiumUrl: '',        // Leave blank until a real paid product exists
  contactEmail: ''       // Your public project email; do not use a personal/private email
};

const $ = (id) => document.getElementById(id);
const STORAGE_KEY = 'blackout-aopg-v4';
const initial = {
  cards: [
    {id:1,title:'Farm materials for next upgrade',desc:'Track the drops needed for the next build upgrade.',status:'todo',tag:'Grind'},
    {id:2,title:'Check fruit trade values',desc:'Compare offers and write down recent trade notes.',status:'todo',tag:'Trading'},
    {id:3,title:'Practice boss patterns',desc:'Review attack timing before another attempt.',status:'doing',tag:'Boss'},
    {id:4,title:'Test a new build',desc:'Record fruit, weapon, fighting style, and stat setup.',status:'doing',tag:'Build'},
    {id:5,title:'Organize my goals',desc:'Set up this workspace for the next session.',status:'done',tag:'General'},
    {id:6,title:'Make a party checklist',desc:'Write down roles and team requirements.',status:'todo',tag:'General'}
  ],
  fruits: [
    {id:101,name:'Flame',type:'Logia',tier:'A',note:'Sample placement'},
    {id:102,name:'Ice',type:'Logia',tier:'A',note:'Sample placement'},
    {id:103,name:'Light',type:'Logia',tier:'S',note:'Sample placement'},
    {id:104,name:'Dark',type:'Logia',tier:'B',note:'Sample placement'},
    {id:105,name:'Rubber',type:'Paramecia',tier:'B',note:'Sample placement'},
    {id:106,name:'Magma',type:'Logia',tier:'S',note:'Sample placement'},
    {id:107,name:'Bomb',type:'Paramecia',tier:'C',note:'Sample placement'},
    {id:108,name:'Smoke',type:'Logia',tier:'C',note:'Sample placement'},
    {id:109,name:'Quake',type:'Paramecia',tier:'A',note:'Sample placement'},
    {id:110,name:'String',type:'Paramecia',tier:'B',note:'Sample placement'},
    {id:111,name:'Phoenix',type:'Zoan',tier:'S',note:'Sample placement'},
    {id:112,name:'Leopard',type:'Zoan',tier:'A',note:'Sample placement'}
  ],
  codes: [
    {id:201,code:'ADD_OFFICIAL_CODE_HERE',status:'Unverified',note:'Replace with a code from an official announcement.'},
    {id:202,code:'COMMUNITY_CODE_EXAMPLE',status:'Unverified',note:'Example entry — not a confirmed redeem code.'},
    {id:203,code:'EXPIRED_CODE_EXAMPLE',status:'Expired',note:'Example expired entry for the tracker.'}
  ],
  saved: []
};
let data;
try { data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || structuredClone(initial); }
catch { data = structuredClone(initial); }
let modalMode = 'card';
let dragId = null;
function persist(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); renderAll(); }
function toast(message){ const t=$('toast'); t.textContent=message; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),1800); }
function safe(text){ return String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function renderBoard(){
  const map={todo:'todoCards',doing:'doingCards',done:'doneCards'};
  Object.entries(map).forEach(([status,id])=>{
    const cards=data.cards.filter(c=>c.status===status);
    $(id).innerHTML=cards.length?cards.map(c=>`<article class="board-card" draggable="true" data-id="${c.id}">
      <span class="card-tag">${safe(c.tag)}</span><h3>${safe(c.title)}</h3><p>${safe(c.desc||'No notes added.')}</p>
      <div class="card-footer"><span>BLACKOUT CARD</span><span class="card-actions"><button data-edit-card="${c.id}" title="Edit">✎</button><button data-delete-card="${c.id}" title="Delete">×</button></span></div>
    </article>`).join(''):'<div class="empty-column">Drop a card here or add a new one.</div>';
    const col=$(id).closest('.board-column');
    col.querySelector('.column-count').textContent=cards.length;
  });
  $('taskCount').textContent=String(data.cards.length).padStart(2,'0');
  $('boardCount').textContent=data.cards.length;
  $('doneCount').textContent=data.cards.filter(c=>c.status==='done').length;
  document.querySelectorAll('.board-card').forEach(card=>{
    card.addEventListener('dragstart',e=>{dragId=Number(card.dataset.id);card.classList.add('dragging');e.dataTransfer.effectAllowed='move';});
    card.addEventListener('dragend',()=>{card.classList.remove('dragging');document.querySelectorAll('.board-column').forEach(c=>c.classList.remove('drop-target'));});
  });
}
document.querySelectorAll('.board-column').forEach(col=>{
  col.addEventListener('dragover',e=>{e.preventDefault();col.classList.add('drop-target');});
  col.addEventListener('dragleave',e=>{if(!col.contains(e.relatedTarget))col.classList.remove('drop-target');});
  col.addEventListener('drop',e=>{e.preventDefault();col.classList.remove('drop-target');const card=data.cards.find(c=>c.id===dragId);if(card){card.status=col.dataset.status;persist();toast('Card moved');}});
});
function renderFruits(){
  const term=$('fruitSearch').value.toLowerCase();
  const type=$('fruitType').value;
  const sort=$('fruitSort').value;
  const fruits=data.fruits.filter(f=>f.name.toLowerCase().includes(term)&&(type==='all'||f.type===type));
  if(sort==='name')fruits.sort((a,b)=>a.name.localeCompare(b.name));
  else fruits.sort((a,b)=>'SABC'.indexOf(a.tier)-'SABC'.indexOf(b.tier));
  const ids={S:'tierS',A:'tierA',B:'tierB',C:'tierC'};
  Object.values(ids).forEach(id=>$(id).innerHTML='');
  fruits.forEach(f=>{
    const chip=document.createElement('div');chip.className='fruit-chip';chip.innerHTML=`<span class="fruit-glyph">${safe(f.name.slice(0,1).toUpperCase())}</span><span>${safe(f.name)} <small>${safe(f.type)}</small></span><span class="save" title="Save item">☆</span>`;
    chip.title=f.note||'';
    chip.querySelector('.save').addEventListener('click',e=>{e.stopPropagation();toggleSave('fruit',f.id);});
    chip.addEventListener('click',()=>{openModal('fruit',f);});
    $(ids[f.tier]||'tierC').appendChild(chip);
  });
  $('fruitCount').textContent=data.fruits.length;
}
function renderCodes(){
  $('codeList').innerHTML=data.codes.map(c=>`<div class="code-entry"><div class="code-symbol">⌘</div><div class="code-info"><b>${safe(c.code)}</b><small>${safe(c.note||'No notes')}</small></div><span class="code-status ${c.status.toLowerCase()}">${safe(c.status.toUpperCase())}</span><div class="code-actions"><button data-copy-code="${c.id}" title="Copy code">▢</button><button data-save-code="${c.id}" title="Save">☆</button><button data-edit-code="${c.id}" title="Edit">✎</button><button data-delete-code="${c.id}" title="Delete">×</button></div></div>`).join('') || '<div class="empty-state">No codes added yet. Add one from an official announcement.</div>';
  $('codeCount').textContent=data.codes.length;
  $('activeCodes').textContent=data.codes.filter(c=>c.status!=='Expired').length;
}
function renderSaved(){
  const items=data.saved.map(s=>{
    const item=s.kind==='fruit'?data.fruits.find(x=>x.id===s.id):data.codes.find(x=>x.id===s.id);
    return item?{...item,kind:s.kind}:null;
  }).filter(Boolean);
  $('savedCount').textContent=String(items.length).padStart(2,'0');
  $('savedList').innerHTML=items.length?items.map(x=>`<div class="saved-entry"><span>${x.kind==='fruit'?'✦':'⌘'}</span><b>${safe(x.name||x.code)}</b><small>${safe(x.kind==='fruit'?`${x.tier} TIER · ${x.type}`:x.status)}</small><button data-unsave="${x.id}" data-kind="${x.kind}" class="column-add">×</button></div>`).join(''):'<div class="empty-state">Nothing saved yet. Use the ☆ on a fruit or code to keep it here.</div>';
}
function renderAll(){renderBoard();renderFruits();renderCodes();renderSaved();}
function toggleSave(kind,id){
  const i=data.saved.findIndex(s=>s.kind===kind&&s.id===id);
  if(i>=0)data.saved.splice(i,1);else data.saved.push({kind,id});
  persist();toast(i>=0?'Removed from saved':'Saved for later');
}
function openModal(mode,item=null,status='todo'){
  modalMode=mode;$('itemForm').reset();$('formExtra').classList.toggle('hidden',mode!=='card');$('fruitExtra').classList.toggle('hidden',mode!=='fruit');$('codeExtra').classList.toggle('hidden',mode!=='code');
  $('modalTitle').textContent=(item?'EDIT ':'ADD ')+(mode==='card'?'BOARD CARD':mode==='fruit'?'FRUIT':'GAME CODE');
  $('titleLabel').textContent=mode==='fruit'?'FRUIT NAME':mode==='code'?'CODE NOTES':'TITLE';
  $('itemTitle').placeholder=mode==='fruit'?'Fruit name':mode==='code'?'Short description':'What do you want to track?';
  $('itemTitle').value=mode==='fruit'?item?.name||'':mode==='code'?item?.note||'':item?.title||'';
  $('itemDescription').value=mode==='card'?item?.desc||'':mode==='fruit'?item?.note||'':item?.note||'';
  $('itemStatus').value=item?.status||status;$('itemTag').value=item?.tag||'Grind';
  $('itemTier').value=item?.tier||'A';$('itemType').value=item?.type||'Paramecia';
  $('itemCodeStatus').value=item?.status||'Unverified';$('itemCodeValue').value=item?.code||'';
  $('itemForm').dataset.editId=item?.id||'';
  $('modalBackdrop').classList.add('open');$('itemTitle').focus();
}
function closeModal(){$('modalBackdrop').classList.remove('open');}
$('addCardBtn').addEventListener('click',()=>openModal('card'));
$('addFruitBtn').addEventListener('click',()=>openModal('fruit'));
$('addCodeBtn').addEventListener('click',()=>openModal('code'));
document.querySelectorAll('[data-add]').forEach(b=>b.addEventListener('click',()=>openModal('card',null,b.dataset.add)));
$('modalClose').addEventListener('click',closeModal);$('cancelModal').addEventListener('click',closeModal);
$('modalBackdrop').addEventListener('click',e=>{if(e.target===$('modalBackdrop'))closeModal();});
$('itemForm').addEventListener('submit',e=>{
  e.preventDefault();const id=Number(e.currentTarget.dataset.editId)||Date.now();
  const title=$('itemTitle').value.trim();const desc=$('itemDescription').value.trim();
  if(!title)return;
  if(modalMode==='card'){
    const obj={id,title,desc,status:$('itemStatus').value,tag:$('itemTag').value};
    const i=data.cards.findIndex(x=>x.id===id);if(i>=0)data.cards[i]=obj;else data.cards.push(obj);
  }else if(modalMode==='fruit'){
    const obj={id,name:title,type:$('itemType').value,tier:$('itemTier').value,note:desc};
    const i=data.fruits.findIndex(x=>x.id===id);if(i>=0)data.fruits[i]=obj;else data.fruits.push(obj);
  }else{
    const obj={id,code:$('itemCodeValue').value.trim()||title,status:$('itemCodeStatus').value,note:desc||title};
    const i=data.codes.findIndex(x=>x.id===id);if(i>=0)data.codes[i]=obj;else data.codes.push(obj);
  }
  closeModal();persist();toast('Workspace updated');
});
document.addEventListener('click',async e=>{
  const t=e.target;
  if(t.dataset.editCard){openModal('card',data.cards.find(x=>x.id==t.dataset.editCard));}
  if(t.dataset.deleteCard){data.cards=data.cards.filter(x=>x.id!=t.dataset.deleteCard);persist();toast('Card deleted');}
  if(t.dataset.editCode){openModal('code',data.codes.find(x=>x.id==t.dataset.editCode));}
  if(t.dataset.deleteCode){data.codes=data.codes.filter(x=>x.id!=t.dataset.deleteCode);data.saved=data.saved.filter(s=>!(s.kind==='code'&&s.id==t.dataset.deleteCode));persist();toast('Code removed');}
  if(t.dataset.copyCode){const c=data.codes.find(x=>x.id==t.dataset.copyCode);if(c){try{await navigator.clipboard.writeText(c.code);toast('Code copied');}catch{toast('Clipboard unavailable');}}}
  if(t.dataset.saveCode){toggleSave('code',Number(t.dataset.saveCode));}
  if(t.dataset.unsave){toggleSave(t.dataset.kind,Number(t.dataset.unsave));}
});
$('fruitSearch').addEventListener('input',renderFruits);$('fruitType').addEventListener('change',renderFruits);$('fruitSort').addEventListener('change',renderFruits);
document.querySelectorAll('.nav-item').forEach(a=>a.addEventListener('click',()=>{document.querySelectorAll('.nav-item').forEach(x=>x.classList.remove('active'));a.classList.add('active');$('currentSection').textContent=a.dataset.section;}));

renderAll();
// Support actions: intentionally inactive until real links/contact details are configured.
function validExternalUrl(value){
  try { const u=new URL(value); return u.protocol==='https:'; } catch { return false; }
}
$('donateBtn').addEventListener('click',()=>{
  if(validExternalUrl(BLACKOUT_CONFIG.donationUrl)){ window.open(BLACKOUT_CONFIG.donationUrl,'_blank','noopener,noreferrer'); }
  else toast('Support page is not connected yet.');
});

$('partnerBtn').addEventListener('click',async()=>{
  const contact=BLACKOUT_CONFIG.contactEmail || '[add your public project email]';
  const message=`Subject: BLACKOUT community partnership\n\nHi BLACKOUT team,\n\nI'd like to discuss a possible AOPG community collaboration.\n\nName / channel: \nIdea: \n\nThanks!\n\nContact: ${contact}`;
  try{await navigator.clipboard.writeText(message);toast('Partnership message copied');}
  catch{toast('Clipboard unavailable — contact details are in script.js');}
});

// Small quality-of-life tools.
const mobileMenuButton = $('mobileMenu');
if(mobileMenuButton){
  mobileMenuButton.addEventListener('click',()=>{
    document.querySelectorAll('.navigation').forEach(nav=>nav.classList.toggle('expanded'));
  });
}
document.querySelectorAll('.nav-item').forEach(link=>{
  link.addEventListener('click',()=>{
    document.querySelectorAll('.navigation').forEach(nav=>nav.classList.remove('expanded'));
  });
});


// Community submissions are routed to the public project issue tracker for review.
const communityForm = $('communityForm');
if (communityForm) {
  communityForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const kind = $('communityType').value.trim();
    const name = $('communityName').value.trim() || 'Anonymous player';
    const title = $('communityTitle').value.trim();
    const details = $('communityDetails').value.trim();
    if (!title || !details) { toast('Add a title and details first'); return; }
    const issueTitle = `[Community ${kind}] ${title}`;
    const issueBody = `**Submission type:** ${kind}\n\n**Submitted by:** ${name}\n\n**Details:**\n${details}\n\n---\nPlease review before adding this information to BLACKOUT. This submission is community-provided and may be unverified.`;
    const issueUrl = new URL('https://github.com/brownlowronald01-star/BLACKOUT/issues/new');
    issueUrl.searchParams.set('title', issueTitle);
    issueUrl.searchParams.set('body', issueBody);
    window.open(issueUrl.toString(), '_blank', 'noopener,noreferrer');
    toast('Submission draft opened for review');
  });
}
