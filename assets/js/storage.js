// One atomic record keeps imports from partially overwriting an existing collection.
export const CATEGORIES = ['正餐', '早午餐', '甜點', '飲料'];
export const STATUSES = ['想吃', '吃過'];
const DB = 'food-pocket-v1';
let connection;
export function safeUrl(value) {
  if (!value) return '';
  try { const u = new URL(value); return ['http:', 'https:'].includes(u.protocol) ? u.href : ''; } catch { return ''; }
}
export function validImage(value) {
  return typeof value === 'string' && (value === '' || (/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(value) && value.length < 12000000));
}
export function validateRestaurant(r) {
  if (!r || typeof r !== 'object') throw Error('店家格式不正確');
  for (const key of ['id','name','city','district','status','address','budget','link','photo','menuUrl','menuSource','menuChecked']) {
    if (typeof r[key] !== 'string') throw Error('店家欄位缺少或格式不正確：' + key);
  }
  if (!/^[a-z0-9-]{1,100}$/.test(r.id) || !r.name.trim() || !r.city.trim() || !r.district.trim()) throw Error('店家編號或必填欄位不正確');
  if ([r.name,r.city,r.district,r.address,r.budget,r.link,r.menuUrl,r.menuSource].some(v=>v.length>2000)) throw Error('文字欄位過長');
  if (!STATUSES.includes(r.status) || !Array.isArray(r.categories) || !r.categories.length || r.categories.some(c=>!CATEGORIES.includes(c)) || new Set(r.categories).size!==r.categories.length) throw Error('分類或收藏狀態不正確');
  if ((r.link && !safeUrl(r.link)) || (r.menuUrl && !safeUrl(r.menuUrl))) throw Error('連結必須是完整的 http 或 https 網址');
  if (!validImage(r.photo) || !Array.isArray(r.menus) || r.menus.length>10 || r.menus.some(m=>!m || !validImage(m.src) || !m.src || typeof m.name!=='string' || m.name.length>200)) throw Error('照片或菜單格式不正確');
  if (!Array.isArray(r.items) || r.items.length>100 || r.items.some(i=>!i || typeof i.name!=='string' || !i.name.trim() || i.name.length>300 || typeof i.price!=='string' || i.price.length>80 || typeof i.recommended!=='boolean')) throw Error('餐點格式不正確');
  if (r.menuChecked && !/^\d{4}-\d{2}-\d{2}$/.test(r.menuChecked)) throw Error('查詢日期格式不正確');
  return r;
}
export function validateState(s) {
  if (!s || !Array.isArray(s.overrides) || !Array.isArray(s.hidden) || s.overrides.length>1000 || s.hidden.length>1000) throw Error('備份資料結構不正確');
  s.overrides.forEach(validateRestaurant);
  if (new Set(s.overrides.map(r=>r.id)).size!==s.overrides.length || s.hidden.some(id=>typeof id!=='string' || !/^[a-z0-9-]{1,100}$/.test(id)) || new Set(s.hidden).size!==s.hidden.length) throw Error('備份有重複或無效的店家編號');
  if (s.overrides.some(r=>s.hidden.includes(r.id))) throw Error('同一店家不可同時顯示及隱藏');
  return s;
}
async function db() {
  if (!connection) connection = new Promise((resolve,reject)=>{
    const request=indexedDB.open(DB,1);
    request.onupgradeneeded=()=>request.result.createObjectStore('collection');
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>{connection=null;reject(Error('無法開啟瀏覽器儲存空間，請確認瀏覽器設定。'));};
    request.onblocked=()=>{connection=null;reject(Error('儲存空間被其他分頁占用，請關閉其他分頁後重試。'));};
  });
  return connection;
}
export async function readState() {
  const d=await db();
  return new Promise((resolve,reject)=>{
    const req=d.transaction('collection').objectStore('collection').get('state');
    req.onsuccess=()=>{try {resolve(validateState(req.result||{overrides:[],hidden:[]}));}catch(e){reject(e);}};
    req.onerror=()=>reject(Error('無法讀取收藏資料'));
  });
}
export async function writeState(state) {
  validateState(state); const d=await db();
  return new Promise((resolve,reject)=>{
    const tx=d.transaction('collection','readwrite');
    tx.objectStore('collection').put(state,'state');
    tx.oncomplete=resolve;
    tx.onerror=()=>reject(Error('儲存失敗，可能空間不足。原有資料未變更，請先匯出備份。'));
    tx.onabort=()=>reject(Error('儲存未完成，原有資料未變更。'));
  });
}
export function mergeVisible(base,state) {
  const map=new Map(base.map(r=>[r.id,r]));
  state.overrides.forEach(r=>map.set(r.id,r));
  state.hidden.forEach(id=>map.delete(id));
  return [...map.values()];
}
export function validateBackup(b) {
  if (!b || b.app!=='food-pocket' || b.version!==1 || !Array.isArray(b.restaurants) || b.restaurants.length>1000) throw Error('不是支援的美食口袋備份（版本 1）');
  b.restaurants.forEach(validateRestaurant);
  if (new Set(b.restaurants.map(r=>r.id)).size!==b.restaurants.length) throw Error('備份店家編號重複');
  validateState(b.local);
  const map=new Map(b.restaurants.map(r=>[r.id,r]));
  if (b.local.hidden.some(id=>map.has(id)) || b.local.overrides.some(r=>!map.has(r.id)||JSON.stringify(map.get(r.id))!==JSON.stringify(r))) throw Error('備份的公開與本機資料不一致');
  return b;
}
export function mergeBackup(current,backup,overwrite,base=[]) {
  validateState(current); validateBackup(backup);
  const map=new Map(current.overrides.map(r=>[r.id,r]));
  const hidden=new Set(current.hidden);
  const publicIds=new Set(base.map(r=>r.id));
  for (const r of backup.restaurants) {
    if (overwrite || (!map.has(r.id)&&!hidden.has(r.id)&&!publicIds.has(r.id))) {map.set(r.id,r);hidden.delete(r.id);}
  }
  for (const id of backup.local.hidden) {
    if (overwrite || (!map.has(id)&&!hidden.has(id)&&!publicIds.has(id))) {map.delete(id);hidden.add(id);}
  }
  return validateState({overrides:[...map.values()],hidden:[...hidden]});
}
