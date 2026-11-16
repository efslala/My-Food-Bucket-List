import {CATEGORIES,STATUSES,safeUrl,validateRestaurant,readState,writeState,mergeVisible,validateBackup,mergeBackup} from './storage.js';
export {CATEGORIES,STATUSES};
export const $=(s,root=document)=>root.querySelector(s);
export function el(tag,className,text) {const n=document.createElement(tag);if(className)n.className=className;if(text!==undefined)n.textContent=text;return n;}
export function toast(message,error=false) {const n=$('#notice');n.textContent=message;n.className=error?'visible error':'visible';clearTimeout(toast.timer);toast.timer=setTimeout(()=>n.className='',6500);}
export let base=[], state={overrides:[],hidden:[]}, restaurants=[];
let writable=false;
export async function load() {
  const response=await fetch('data/restaurants.json');
  if(!response.ok)throw Error('無法讀取店家資料，請透過網站網址開啟，勿直接雙擊 HTML。');
  base=await response.json();base.forEach(validateRestaurant);
  try {state=await readState();writable=true;}catch(e){toast(e.message+' 目前僅能瀏覽公開店家。',true);}
  restaurants=mergeVisible(base,state);
}
export function illustration(category='正餐') {
  const drawings={
    '正餐':'<path d="M84 102q-10-16 0-28m35 24q-10-16 0-28m35 32q-10-16 0-28" fill="none"/><path d="M64 127q56-48 112 0" fill="#fffaf0"/><path d="M51 130h138q-7 60-69 60t-69-60" fill="#e8a168"/><path d="M97 190h46m-80-45h114" fill="none"/>',
    '早午餐':'<path d="M71 81q-8-31 47-31t47 31v95H71Z" fill="#e6b77f"/><path d="M83 85q-7-22 35-22t35 22v78H83Z" fill="#fff1cc"/><ellipse cx="128" cy="171" rx="81" ry="25" fill="#faf2e4"/><path d="M104 138c-20-21-47 1-38 19-28 14 1 40 23 29 21 19 70 2 56-19 18-20-15-42-41-29Z" fill="#fffdf6"/><circle cx="104" cy="164" r="16" fill="#edbd59"/>',
    '甜點':'<path d="m59 119 89-48 39 88-85 42Z" fill="#fff2dd"/><path d="m59 119 43 31 85-37-39-42Z" fill="#f8e8cb"/><path d="m59 119 43 31v51l-43-31Z" fill="#efac83"/><path d="m102 150 85-37v46l-85 42Z" fill="#fff3de"/><path d="m103 172 83-36" stroke="#e8a281" stroke-width="8"/><path d="M116 92c-17-24 18-38 24-10 1 10-15 18-15 18Z" fill="#ce755d"/><path d="m126 77 6-13m-6 13-10-9" fill="none"/>',
    '飲料':'<path d="m136 72 17-31h23" fill="none"/><path d="m76 88 13 105h65l14-105Z" fill="#e6b77f"/><path d="m83 126 9 64h60l8-64Z" fill="#efc695"/><ellipse cx="122" cy="88" rx="47" ry="10" fill="#fcf7e9"/><path d="m97 116 9 52m30-59-8 59" stroke="#fff0d8" stroke-width="9"/><circle cx="105" cy="180" r="4" fill="#785345"/><circle cx="120" cy="178" r="4" fill="#785345"/><circle cx="137" cy="181" r="4" fill="#785345"/>'
  };
  const holder=el('div','drawing');
  // All SVG markup is a fixed application asset; user input never enters innerHTML.
  holder.innerHTML='<svg viewBox="0 0 240 240" aria-hidden="true" fill="none" stroke="#775543" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="120" cy="204" rx="75" ry="8" fill="#c9ad8f" opacity=".18" stroke="none"/>'+drawings[category]+'</svg>';
  return holder;
}
export function visual(r,large=false) {
  const n=el('div','visual '+(large?'large-visual ':'')+'visual-'+CATEGORIES.indexOf(r.categories[0]));
  if(r.photo){const img=el('img');img.src=r.photo;img.alt=r.name+'的照片';img.loading='lazy';img.onerror=()=>{img.remove();n.append(illustration(r.categories[0]));};n.append(img);}else n.append(illustration(r.categories[0]));
  return n;
}
export function tags(r) {const n=el('div','tags');r.categories.forEach(c=>n.append(el('span','tag',c)));n.append(el('span','status '+(r.status==='想吃'?'wish':'visited'),(r.status==='想吃'?'♡ ':'✓ ')+r.status));return n;}
export function external(url,label) {const a=el('a','external',label);a.href=safeUrl(url);a.target='_blank';a.rel='noopener noreferrer';return a;}
function dialog(title) {
  const d=el('dialog','modal');const top=el('div','modal-top');const h=el('h2','',title);h.id='dialog-'+crypto.randomUUID();d.setAttribute('aria-labelledby',h.id);const close=el('button','icon-button','×');close.type='button';close.setAttribute('aria-label','關閉');close.onclick=()=>d.close();top.append(h,close);d.append(top);document.body.append(d);d.addEventListener('close',()=>d.remove());d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}});return d;
}
async function mutate(next,message) {if(!writable)throw Error('瀏覽器儲存不可用，無法儲存。');await writeState(next);state=next;restaurants=mergeVisible(base,state);window.dispatchEvent(new Event('collectionchange'));toast(message);}
export async function toggleStatus(r) {try {const next=structuredClone(state),updated={...r,status:r.status==='想吃'?'吃過':'想吃'};next.overrides=next.overrides.filter(x=>x.id!==r.id);next.overrides.push(updated);await mutate(next,'收藏狀態已更新');}catch(e){toast(e.message,true);}}
export function deleteRestaurant(r) {
  const d=dialog('刪除這家店？');d.append(el('p','',`確定從這個瀏覽器的收藏中移除「${r.name}」嗎？其他訪客的資料不受影響。`));const bar=el('div','form-actions');const cancel=el('button','quiet','先保留');cancel.onclick=()=>d.close();const yes=el('button','danger','確認刪除');yes.onclick=async()=>{yes.disabled=true;try{const next=structuredClone(state);next.overrides=next.overrides.filter(x=>x.id!==r.id);next.hidden=[...new Set([...next.hidden,r.id])];await mutate(next,'店家已刪除');d.close();}catch(e){toast(e.message,true);yes.disabled=false;}};bar.append(cancel,yes);d.append(bar);d.showModal();
}
function field(form,label,name,value='',type='text',required=false) {const wrap=el('label','field');wrap.append(el('span','',label+(required?' *':'')));const input=el('input');input.name=name;input.type=type;input.value=value;input.required=required;input.maxLength=type==='url'?2000:500;wrap.append(input);form.append(wrap);return input;}
async function readImage(file,menu=false) {
  if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('請使用 JPG、PNG 或 WebP 圖片。');
  if(file.size>8*1024*1024)throw Error('每張圖片上限為 8 MB，請先縮小圖片。');
  const data=await new Promise((resolve,reject)=>{const f=new FileReader();f.onload=()=>resolve(f.result);f.onerror=()=>reject(Error('圖片讀取失敗'));f.readAsDataURL(file);});
  const image=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(Error('圖片無法解讀'));i.src=data;});
  if(image.width*image.height>60000000)throw Error('圖片尺寸過大，請先縮小。');
  const limit=menu?2400:1400,scale=Math.min(1,limit/Math.max(image.width,image.height));
  const c=document.createElement('canvas');c.width=Math.round(image.width*scale);c.height=Math.round(image.height*scale);const ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(image,0,0,c.width,c.height);return c.toDataURL('image/jpeg',menu?.92:.85);
}
export function openEditor(original=null) {
  const r=structuredClone(original||{id:'local-'+crypto.randomUUID(),name:'',city:'臺北市',district:'',categories:[],status:'想吃',address:'',budget:'',items:[],link:'',photo:'',menus:[],menuUrl:'',menuSource:'',menuChecked:''});
  const d=dialog(original?'編輯這份收藏':'收藏一家新店');d.append(el('p','muted','＊為必填。資料只保存在此瀏覽器，其他欄位可之後再補。'));
  const f=el('form','editor');f.id='restaurant-form';const top=el('div','form-grid');f.append(top);
  field(top,'店名／分店','name',r.name,'text',true);field(top,'縣市','city',r.city,'text',true);field(top,'行政區','district',r.district,'text',true);
  const sw=el('label','field');sw.append(el('span','','收藏狀態 *'));const select=el('select');select.name='status';STATUSES.forEach(s=>{const o=el('option','',s);o.value=s;select.append(o);});select.value=r.status;sw.append(select);top.append(sw);
  const cats=el('fieldset','category-field');cats.append(el('legend','','料理分類 *（可複選）'));CATEGORIES.forEach(c=>{const l=el('label','check');const input=el('input');input.type='checkbox';input.name='category';input.value=c;input.checked=r.categories.includes(c);l.append(input,document.createTextNode(c));cats.append(l);});f.append(cats);
  field(f,'完整地址','address',r.address);field(f,'每人預算（NT$，例如 100～200）','budget',r.budget);field(f,'店家連結（完整 https 網址）','link',r.link,'url');
  f.append(el('h3','','餐點與推薦商品'));f.append(el('p','muted','勾選「推薦」即加入推薦商品；價格可留白。'));
  const itemList=el('div','item-list');f.append(itemList);
  function itemRow(item={name:'',price:'',recommended:false}){const row=el('div','item-row');const n=el('input');n.placeholder='餐點名稱';n.setAttribute('aria-label','餐點名稱');n.maxLength=300;n.value=item.name;const p=el('input');p.placeholder='價格 NT$';p.setAttribute('aria-label','餐點價格');p.maxLength=80;p.value=item.price;const l=el('label','check');const c=el('input');c.type='checkbox';c.checked=item.recommended;l.append(c,document.createTextNode('推薦'));const del=el('button','icon-button','×');del.type='button';del.setAttribute('aria-label','移除餐點');del.onclick=()=>row.remove();row.append(n,p,l,del);itemList.append(row);}
  r.items.forEach(itemRow);const add=el('button','quiet','＋ 新增餐點');add.type='button';add.onclick=()=>itemRow();f.append(add);
  f.append(el('h3','','店家照片與菜單'));f.append(el('p','muted','圖片支援 JPG、PNG、WebP，每張最多 8 MB；菜單最多 10 張。'));
  let photo=r.photo,menus=r.menus;const photoPreview=el('div','upload-preview');const photoInput=field(f,'店家照片（選填）','photoFile','','file');photoInput.accept='image/jpeg,image/png,image/webp';f.append(photoPreview);
  function showPhoto(){photoPreview.replaceChildren();if(photo){const img=el('img');img.src=photo;img.alt='店家照片預覽';const remove=el('button','quiet','移除照片，改用插畫');remove.type='button';remove.onclick=()=>{photo='';photoInput.value='';showPhoto();};photoPreview.append(img,remove);}else photoPreview.append(el('small','muted','目前使用分類插畫'));}showPhoto();
  const menuInput=field(f,'上傳菜單圖片（可多選）','menuFiles','','file');menuInput.accept='image/jpeg,image/png,image/webp';menuInput.multiple=true;const menuPreview=el('div','menu-previews');f.append(menuPreview);
  function showMenus(){menuPreview.replaceChildren();menus.forEach((m,i)=>{const box=el('div','menu-preview');const img=el('img');img.src=m.src;img.alt='菜單預覽 '+(i+1);const remove=el('button','quiet','移除第 '+(i+1)+' 張');remove.type='button';remove.onclick=()=>{menus.splice(i,1);showMenus();};box.append(img,remove);menuPreview.append(box);});}showMenus();
  const message=el('p','form-error');message.setAttribute('role','alert');let pending=0;
  async function uploading(input,action){pending++;save.disabled=true;message.textContent='正在處理圖片……';try{await action();message.textContent='';}catch(e){message.textContent=e.message;}finally{input.value='';pending--;save.disabled=pending>0;}}
  photoInput.onchange=()=>{const file=photoInput.files[0];if(file)uploading(photoInput,async()=>{photo=await readImage(file);showPhoto();});};
  menuInput.onchange=()=>{const files=[...menuInput.files];if(files.length)uploading(menuInput,async()=>{if(menus.length+files.length>10)throw Error('菜單圖片最多 10 張');const added=[];for(const file of files)added.push({name:file.name.slice(0,200),src:await readImage(file,true)});menus.push(...added);showMenus();});};
  field(f,'官方菜單連結（選填）','menuUrl',r.menuUrl,'url');field(f,'菜單來源說明（選填）','menuSource',r.menuSource);field(f,'菜單查詢日期（選填）','menuChecked',r.menuChecked,'date');
  f.append(message);const actions=el('div','form-actions');const cancel=el('button','quiet','取消');cancel.type='button';cancel.onclick=()=>d.close();const save=el('button','primary','儲存收藏');save.type='submit';actions.append(cancel,save);f.append(actions);d.append(f);
  f.onsubmit=async e=>{e.preventDefault();if(pending)return;message.textContent='';const data=new FormData(f);const categories=data.getAll('category');if(!categories.length){message.textContent='請至少選擇一項料理分類。';cats.querySelector('input').focus();return;}save.disabled=true;try{const updated={...r,photo,menus,categories,items:[]};for(const key of ['name','city','district','status','address','budget','link','menuUrl','menuSource','menuChecked'])updated[key]=String(data.get(key)||'').trim();for(const row of itemList.children){const inputs=row.querySelectorAll('input');const name=inputs[0].value.trim(),price=inputs[1].value.trim();if(!name && (price||inputs[2].checked))throw Error('有價格或推薦標記的餐點，必須填寫餐點名稱。');if(name)updated.items.push({name,price,recommended:inputs[2].checked});}validateRestaurant(updated);const next=structuredClone(state);next.overrides=next.overrides.filter(x=>x.id!==updated.id);next.overrides.push(updated);next.hidden=next.hidden.filter(id=>id!==updated.id);await mutate(next,'收藏已儲存');d.close();}catch(err){message.textContent=err.message;save.disabled=false;}};
  d.showModal();
}
export function zoomImage(src,title) {const d=dialog(title);d.classList.add('image-modal');const img=el('img','zoom-image');img.src=src;img.alt=title;d.append(img);d.showModal();}
export function exportBackup() {
  const b={app:'food-pocket',version:1,exportedAt:new Date().toISOString(),restaurants,local:state};
  const blob=new Blob([JSON.stringify(b,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=el('a');a.href=url;a.download='food-pocket-backup-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('備份已開始下載，包含本機照片與菜單圖片');
}
function openBackup() {
  const d=dialog('備份我的口袋');d.append(el('p','','換裝置前，先將收藏匯出。備份包含店家、推薦商品、照片、菜單及本機刪除狀態。'));const exportButton=el('button','primary','↓ 匯出完整備份');exportButton.onclick=()=>{if(writable)exportBackup();else toast('本機儲存無法讀取，為避免遺漏資料，暫不匯出。',true);};d.append(exportButton,el('hr'),el('h3','','匯入備份'));d.append(el('p','muted','選取本站匯出的 JSON。匯入會依店家 ID 合併，不會清空其他收藏。單檔上限 50 MB。'));
  const input=field(d,'選取備份檔案','backup','','file');input.accept='.json,application/json';const actions=el('div','import-actions');const result=el('p','form-error');result.setAttribute('role','alert');d.append(actions,result);
  input.onchange=async()=>{actions.replaceChildren();result.textContent='';const file=input.files[0];if(!file)return;try{if(file.size>50*1024*1024)throw Error('備份超過 50 MB');const backup=validateBackup(JSON.parse(await file.text()));result.textContent='找到 '+backup.restaurants.length+' 家店。遇到相同 ID 時，請選擇處理方式。';for(const [overwrite,label] of [[false,'保留目前版本'],[true,'使用備份版本']]){const b=el('button',overwrite?'primary':'quiet',label);b.onclick=async()=>{[...actions.children].forEach(x=>x.disabled=true);try{const next=mergeBackup(state,backup,overwrite,base);await mutate(next,'備份已匯入');d.close();}catch(e){result.textContent=e.message;[...actions.children].forEach(x=>x.disabled=false);}};actions.append(b);}}catch(e){result.textContent='無法匯入：'+e.message;}};
  d.showModal();
}
export function setupCommon() {
  $('#add-open').onclick=()=>openEditor();$('#backup-open').onclick=openBackup;
  if($('#hero-add'))$('#hero-add').onclick=()=>openEditor();if($('#note-backup'))$('#note-backup').onclick=()=>{if(writable)exportBackup();else toast('本機資料無法讀取，暫不匯出。',true);};
}
