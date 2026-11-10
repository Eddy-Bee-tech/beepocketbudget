const KEY='beepocketbudget_transactions_v2';
const $=s=>document.querySelector(s), money=n=>Number(n||0).toLocaleString('th-TH',{maximumFractionDigits:2});
const pad=n=>String(n).padStart(2,'0'), today=()=>{let d=new Date();return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`};
const monthKey=d=>String(d||'').slice(0,7), sum=(a,t)=>a.filter(x=>!t||x.type===t).reduce((s,x)=>s+Number(x.amount||0),0);
const monthName=m=>{let [y,mm]=m.split('-').map(Number);return new Date(y,mm-1,1).toLocaleDateString('th-TH',{month:'long',year:'numeric'})};
let items=[],screen='home',type='income',filter='all',period='month',year=String(new Date().getFullYear()),month=pad(new Date().getMonth()+1),editing=null;
try{let v=JSON.parse(localStorage.getItem(KEY)||'[]');if(Array.isArray(v))items=v}catch(e){}
const saveData=()=>{try{localStorage.setItem(KEY,JSON.stringify(items))}catch(e){alert('บันทึกไม่สำเร็จ: พื้นที่จัดเก็บอาจไม่เพียงพอ')}};
const btn=(label,fn,cls='')=>`<button class="btn ${cls}" onclick="${fn}">${label}</button>`;
const cats=()=>type==='income'?['น้ำผึ้ง','ไขผึ้ง','พันธุ์ผึ้ง/นางพญา','บริการผสมเกสร','ผลิตภัณฑ์แปรรูป','อื่นๆ']:['อาหารผึ้ง/อาหารเสริม','น้ำตาลและวัตถุดิบ','ยาและสุขภาพผึ้ง','อุปกรณ์และรังผึ้ง','แผ่นรวงผึ้ง','ค่าแรง','ค่าเดินทาง/ขนส่ง','ค่าเช่าพื้นที่','อื่นๆ'];
function go(s){screen=s;document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x.dataset.screen===s));render()}
document.querySelectorAll('.tab').forEach(x=>x.addEventListener('click',()=>{if(x.dataset.screen==='add')newItem();else go(x.dataset.screen)}));
function sorted(){return [...items].sort((a,b)=>b.date.localeCompare(a.date)||(b.createdAt||0)-(a.createdAt||0))}
function tx(x){let inc=x.type==='income';return `<div class="tx"><div class="txicon" style="background:${inc?'#e7f3e9':'#fbe9e5'}">${inc?'↙':'↗'}</div><div class="txbody"><div class="txtitle">${esc(x.category)}</div><div class="txsub">${esc(x.note|| (inc?'รายรับ':'รายจ่าย'))} · ${esc(x.date)}</div><div style="margin-top:6px"><span class="link" onclick="editItem('${x.id}')">แก้ไข</span>　<span class="link" style="color:#c65343" onclick="delItem('${x.id}')">ลบ</span></div></div><div class="txamount" style="color:${inc?'#39845a':'#c65343'}">${inc?'+':'−'}฿${money(x.amount)}</div></div>`}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function breakdownHTML(list,kind,title,color){
 let totals={};list.filter(x=>x.type===kind).forEach(x=>{let k=x.category||'ไม่ระบุหมวดหมู่';totals[k]=(totals[k]||0)+Number(x.amount||0)});
 let rows=Object.entries(totals).sort((a,b)=>b[1]-a[1]),grand=rows.reduce((s,x)=>s+x[1],0),max=Math.max(1,...rows.map(x=>x[1]));
 return `<div class="card"><h2>${title}</h2>${rows.length?rows.map(([name,value])=>`<div class="hrow"><div class="hmeta"><span>${esc(name)}</span><b>฿${money(value)} <small>(${grand?(value/grand*100).toFixed(1):'0.0'}%)</small></b></div><div class="htrack"><div class="hfill" style="width:${value/max*100}%;background:${color}"></div></div></div>`).join(''):`<div class="smallmuted">ยังไม่มีข้อมูลในช่วงเวลานี้</div>`}<div class="smallmuted" style="margin-top:8px">รวม ฿${money(grand)} · ${rows.length} หมวดหมู่</div></div>`;
}
function makeMonthlyChart(data){let max=Math.max(1,...data.flatMap(x=>[x.income,x.expense]));return `<div class="chart">${data.map(x=>`<div style="flex:1;min-width:0"><div class="barcol"><div class="bar" title="รายรับ ฿${money(x.income)}" style="height:${Math.max(2,x.income/max*110)}px;background:#39845a"></div><div class="bar" title="รายจ่าย ฿${money(x.expense)}" style="height:${Math.max(2,x.expense/max*110)}px;background:#c65343"></div></div><div class="barlabel">${x.label}</div></div>`).join('')}</div>`}
function render(){
let app=$('#app'), sortedItems=sorted(), thisMonth=monthKey(today()), monthly=items.filter(x=>monthKey(x.date)===thisMonth), inc=sum(monthly,'income'),exp=sum(monthly,'expense'),balance=sum(items,'income')-sum(items,'expense');
let years=[...new Set([String(new Date().getFullYear()),...items.map(x=>x.date.slice(0,4))])].sort((a,b)=>b.localeCompare(a));
let chosen=`${year}-${month}`, pi=items.filter(x=>period==='month'?monthKey(x.date)===chosen:x.date.startsWith(year));
if(screen==='home'){
app.innerHTML=`<div class="eyebrow">ภาพรวมการเงิน</div><div class="hero"><small>ยอดเงินคงเหลือสะสม</small><strong>฿${money(balance)}</strong><em>รายรับสะสม − รายจ่ายสะสม</em></div>
<div class="grid"><div class="card"><div class="klabel">รายรับเดือนนี้</div><div class="kvalue" style="color:#39845a">฿${money(inc)}</div></div><div class="card"><div class="klabel">รายจ่ายเดือนนี้</div><div class="kvalue" style="color:#c65343">฿${money(exp)}</div></div><div class="card"><div class="klabel">สุทธิเดือนนี้</div><div class="kvalue" style="color:${inc-exp>=0?'#39845a':'#c65343'}">฿${money(inc-exp)}</div></div><div class="card"><div class="klabel">อัตราคงเหลือ</div><div class="kvalue">${inc?((inc-exp)/inc*100).toFixed(1):'0.0'}%</div></div></div>
<div class="rowhead"><h2>รายการล่าสุด</h2><span class="link" onclick="go('history')">ดูทั้งหมด →</span></div>${sortedItems.slice(0,4).map(tx).join('')||'<div class="empty">🍯<br>ยังไม่มีรายการบันทึก<br>เริ่มต้นบันทึกรายรับหรือรายจ่ายของฟาร์ม</div>'}${btn('＋ เพิ่มรายการใหม่',"newItem()")}`;
}
if(screen==='add'){
let categoryOptions=[...cats(),...(cats().includes(formCat)?[]:[formCat])];let vals=categoryOptions.map(c=>`<button class="chip ${formCat===c?'selected':''}" onclick="formCat='${c}';render()">${c}</button>`).join('');
app.innerHTML=`<div class="eyebrow">${editing?'แก้ไขรายการ':'บันทึกรายการใหม่'}</div><h1>${editing?'แก้ไขข้อมูล':'วันนี้ฟาร์มมีรายการอะไร?'}</h1>
<div class="switch"><button type="button" class="${type==='income'?'selected':''}" onclick="window.setEntryType('income')">＋ รายรับ</button><button type="button" class="${type==='expense'?'selected':''}" onclick="window.setEntryType('expense')">− รายจ่าย</button></div>
<label>จำนวนเงิน (บาท) *</label><input id="amount" class="amount" inputmode="decimal" placeholder="0.00" value="${esc(formAmount)}" oninput="formAmount=this.value">
<label>หมวดหมู่</label><div class="chips">${vals}</div><label>วันที่ (YYYY-MM-DD)</label><input id="date" value="${esc(formDate)}" oninput="formDate=this.value"><label>รายละเอียดเพิ่มเติม</label><input id="note" placeholder="เช่น ขายน้ำผึ้ง 5 กิโลกรัม" value="${esc(formNote)}" oninput="formNote=this.value">
${btn(editing?'บันทึกการแก้ไข':'บันทึกรายการ','saveItem()')}${btn('ยกเลิก',"editing=null;newItem()",'soft')}`;
}
if(screen==='history'){
let list=sortedItems.filter(x=>filter==='all'||x.type===filter);
app.innerHTML=`<div class="eyebrow">สมุดบัญชีฟาร์ม</div><h1>ประวัติรายการ</h1><div class="chips">${[['all','ทั้งหมด'],['income','รายรับ'],['expense','รายจ่าย']].map(([v,l])=>`<button class="chip ${filter===v?'selected':''}" onclick="filter='${v}';render()">${l}</button>`).join('')}</div><div class="smallmuted">ทั้งหมด ${list.length} รายการ</div>${list.map(tx).join('')||'<div class="empty">ยังไม่มีข้อมูล</div>'}${btn('＋ เพิ่มรายการใหม่','newItem()')}`;
}
if(screen==='reports'){
let chart=Array.from({length:12},(_,i)=>{let m=`${year}-${pad(i+1)}`,a=items.filter(x=>monthKey(x.date)===m);return {label:['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'][i],income:sum(a,'income'),expense:sum(a,'expense')}});
let totals={income:sum(pi,'income'),expense:sum(pi,'expense')},net=totals.income-totals.expense;
let periodTitle=period==='month'?monthName(chosen):`ปี ${Number(year)+543}`;
app.innerHTML=`<div class="eyebrow">รายงานและการวิเคราะห์</div><h1>วิเคราะห์รายได้และต้นทุนฟาร์มผึ้ง</h1><div class="switch"><button class="${period==='month'?'selected':''}" onclick="period='month';render()">รายเดือน</button><button class="${period==='year'?'selected':''}" onclick="period='year';render()">รายปี</button></div>
${period==='year'?`<label>เลือกปี</label><div class="chips">${years.map(y=>`<button class="chip ${year===y?'selected':''}" onclick="year='${y}';render()">${Number(y)+543}</button>`).join('')}</div><div class="card"><h2>แนวโน้มรายรับ–รายจ่าย 12 เดือน (${Number(year)+543})</h2>${makeMonthlyChart(chart)}<div class="smallmuted"><span style="color:#39845a">● รายรับ</span>　<span style="color:#c65343">● รายจ่าย</span></div></div>`:`<label>เลือกเดือน</label><div class="chips">${Array.from({length:12},(_,i)=>pad(i+1)).map(m=>`<button class="chip ${month===m?'selected':''}" onclick="month='${m}';render()">${m}</button>`).join('')}</div><label>เลือกปี</label><div class="chips">${years.map(y=>`<button class="chip ${year===y?'selected':''}" onclick="year='${y}';render()">${Number(y)+543}</button>`).join('')}</div>`}
<div class="grid"><div class="card"><div class="klabel">รายได้รวม</div><div class="kvalue" style="color:#39845a">฿${money(totals.income)}</div></div><div class="card"><div class="klabel">ต้นทุน/รายจ่ายรวม</div><div class="kvalue" style="color:#c65343">฿${money(totals.expense)}</div></div><div class="card"><div class="klabel">กำไร/ขาดทุนสุทธิ</div><div class="kvalue" style="color:${net>=0?'#39845a':'#c65343'}">฿${money(net)}</div></div><div class="card"><div class="klabel">จำนวนรายการ</div><div class="kvalue">${pi.length}</div></div></div>
${breakdownHTML(pi,'income','โครงสร้างรายได้จากการเลี้ยงผึ้ง','#39845a')}
${breakdownHTML(pi,'expense','วิเคราะห์ต้นทุนและค่าใช้จ่ายการเลี้ยงผึ้ง','#c65343')}
<div class="card"><h2>ตัวชี้วัดทางการเงิน</h2><div class="hmeta"><span>อัตรากำไรสุทธิต่อรายได้</span><b>${totals.income?(net/totals.income*100).toFixed(1):'0.0'}%</b></div><div class="hmeta"><span>ต้นทุนต่อรายได้</span><b>${totals.income?(totals.expense/totals.income*100).toFixed(1):'0.0'}%</b></div><div class="hmeta"><span>รายได้ต่อค่าใช้จ่าย 1 บาท</span><b>${totals.expense?(totals.income/totals.expense).toFixed(2):'—'} บาท</b></div><p class="smallmuted">คำนวณจากรายการที่บันทึกในช่วง ${esc(periodTitle)} เท่านั้น ตัวเลขนี้เป็นผลต่างรายรับและรายจ่าย ไม่ใช่กำไรทางบัญชีที่ผ่านการปรับรายการคงค้าง</p></div>${btn('พิมพ์ / บันทึกเป็น PDF','printReport()')}`;
}
if(screen==='more'){
app.innerHTML=`<div class="eyebrow">จัดการข้อมูล</div><h1>สำรองและกู้คืนข้อมูล</h1><div class="card"><h2>ข้อมูลของคุณอยู่ในอุปกรณ์นี้</h2><p class="smallmuted">ข้อมูลเก็บอยู่ในอุปกรณ์นี้ ไม่ได้ส่งขึ้นคลาวด์ ควรดาวน์โหลดไฟล์สำรองเก็บไว้นอกโทรศัพท์เป็นประจำ</p><div class="grid"><div><div class="klabel">รายการทั้งหมด</div><div class="kvalue">${items.length} รายการ</div></div><div><div class="klabel">รายรับสะสม</div><div class="kvalue" style="color:#39845a">฿${money(sum(items,'income'))}</div></div><div><div class="klabel">รายจ่ายสะสม</div><div class="kvalue" style="color:#c65343">฿${money(sum(items,'expense'))}</div></div><div><div class="klabel">ยอดสุทธิ</div><div class="kvalue">฿${money(sum(items,'income')-sum(items,'expense'))}</div></div></div>${btn('⬇ ดาวน์โหลดไฟล์สำรอง JSON','backup()')}<label class="btn soft" for="restoreFile" style="display:block;position:relative;text-align:center;cursor:pointer;overflow:hidden">⬆ เลือกไฟล์ JSON เพื่อกู้คืน<input id="restoreFile" type="file" accept=".json,application/json,text/json" style="position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer" onchange="restore(event)"></label><p class="smallmuted">ไฟล์สำรองประกอบด้วยรายการรายรับ–รายจ่าย หมวดหมู่ วันที่ และรายละเอียด สามารถนำกลับมาใช้ในแอปนี้ได้</p></div><div class="card"><h2>แนวทางป้องกันข้อมูลสูญหาย</h2><ul class="smallmuted"><li>สำรองข้อมูลหลังบันทึกบัญชีเป็นประจำ</li><li>เก็บไฟล์ JSON ไว้ใน Files, iCloud Drive หรือคอมพิวเตอร์</li><li>ก่อนกู้คืน ระบบจะให้เลือกรวมรายการหรือแทนที่ข้อมูลเดิม</li><li>ควรทดลองกู้คืนจากไฟล์สำรองเป็นระยะ</li></ul></div><div class="card"><h2>เกี่ยวกับแอป</h2><p class="smallmuted">BeePocketBudget PWA · Version 2.2.2</p><p class="smallmuted">ระบบทำงานแบบออฟไลน์ได้หลังโหลดแอปครั้งแรก ข้อมูลไม่ซิงก์ข้ามอุปกรณ์โดยอัตโนมัติ</p></div>`;
}
}
let formCat='น้ำผึ้ง',formAmount='',formDate=today(),formNote='';
window.setEntryType=function(nextType){if(nextType!=='income'&&nextType!=='expense')return;type=nextType;formCat=nextType==='income'?'น้ำผึ้ง':'อาหารผึ้ง/อาหารเสริม';render()};
function newItem(){editing=null;type='income';formCat='น้ำผึ้ง';formAmount='';formDate=today();formNote='';go('add')}
function editItem(id){let x=items.find(y=>y.id===id);if(!x)return;editing=id;type=x.type;formCat=x.category;formAmount=String(x.amount);formDate=x.date;formNote=x.note||'';go('add')}
function saveItem(){let n=Number(String(formAmount).replace(/,/g,''));if(!Number.isFinite(n)||n<=0){alert('กรุณากรอกจำนวนเงินมากกว่า 0');return}if(!/^\d{4}-\d{2}-\d{2}$/.test(formDate)){alert('กรุณาใช้รูปแบบวันที่ YYYY-MM-DD');return}
if(editing)items=items.map(x=>x.id===editing?{...x,type,amount:n,category:formCat,date:formDate,note:formNote}:x);else items.unshift({id:String(Date.now()),createdAt:Date.now(),type,amount:n,category:formCat,date:formDate,note:formNote});
saveData();go('history')}
function delItem(id){let x=items.find(y=>y.id===id);if(x&&confirm(`ลบ ${x.category} จำนวน ${money(x.amount)} บาทหรือไม่?`)){items=items.filter(y=>y.id!==id);saveData();render()}}
async function backup(){
 const payload={app:'BeePocketBudget',schemaVersion:1,appVersion:'2.2.2',exportedAt:new Date().toISOString(),transactionCount:items.length,transactions:items};
 const filename=`BeePocketBudget-backup-${today()}.json`;
 const json=JSON.stringify(payload,null,2);
 try{
  const file=new File([json],filename,{type:'application/json'});
  // iOS Safari/PWA: use the native share sheet so the user can save the JSON to Files.
  if(navigator.share && navigator.canShare && navigator.canShare({files:[file]})){
   await navigator.share({files:[file],title:'BeePocketBudget backup',text:`ไฟล์สำรองข้อมูล ${items.length} รายการ`});
   return;
  }
  // Desktop and browsers supporting the download attribute.
  const blob=new Blob([json],{type:'application/json;charset=utf-8'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=filename;a.style.display='none';document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),10000);
  alert(`เตรียมไฟล์สำรอง ${items.length} รายการแล้ว หากไม่พบไฟล์ในโฟลเดอร์ดาวน์โหลด ให้ลองเปิดแอปผ่าน Safari แล้วกดสำรองอีกครั้ง`);
 }catch(err){
  if(err && err.name==='AbortError')return;
  // Last-resort iOS fallback: open the JSON in a new tab, where Safari can share/save it.
  try{
   const blob=new Blob([json],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob);
   const opened=window.open(url,'_blank');
   if(opened){setTimeout(()=>URL.revokeObjectURL(url),60000);alert('เปิดไฟล์ JSON แล้ว กรุณากดปุ่มแชร์ใน Safari แล้วเลือก บันทึกไปยัง Files');}
   else {URL.revokeObjectURL(url);throw err;}
  }catch(fallbackError){alert('ยังไม่สามารถส่งออกไฟล์ได้ กรุณาเปิด BeePocketBudget ผ่าน Safari โดยตรง แล้วลองใหม่อีกครั้ง');}
 }
}
function restore(e){
 const input=e.target;
 let f=input.files&&input.files[0];if(!f)return;
 if(f.size>20*1024*1024){alert('ไฟล์มีขนาดใหญ่เกิน 20 MB');input.value='';return}
 let r=new FileReader();r.onload=()=>{try{
  let obj=JSON.parse(String(r.result||'')),data=Array.isArray(obj)?obj:(obj.transactions||obj.items||obj.data);
  if(!Array.isArray(data))throw Error('ไม่พบรายการ transactions ในไฟล์ JSON');
  if(data.length>50000)throw Error('ไฟล์มีรายการมากเกินกว่าที่รองรับ');
  let clean=data.map((x,i)=>{let amount=Number(x.amount),date=String(x.date||'');if(!['income','expense'].includes(x.type))throw Error(`รายการที่ ${i+1}: ประเภทต้องเป็น income หรือ expense`);if(!Number.isFinite(amount)||amount<=0)throw Error(`รายการที่ ${i+1}: จำนวนเงินไม่ถูกต้อง`);if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw Error(`รายการที่ ${i+1}: วันที่ไม่ถูกต้อง`);return {...x,id:String(x.id||`restored-${Date.now()}-${i}`),createdAt:Number(x.createdAt||Date.now()),amount,category:String(x.category||'อื่นๆ'),note:String(x.note||''),date}});
  let mode=confirm(`ตรวจพบไฟล์ ${clean.length} รายการ\n\nกด “ตกลง” เพื่อรวมกับข้อมูลปัจจุบัน (รายการ ID ซ้ำจะไม่เพิ่ม)\nกด “ยกเลิก” เพื่อแทนที่ข้อมูลปัจจุบันทั้งหมด`)?'merge':'replace';
  if(mode==='replace'&&!confirm('ยืนยันแทนที่ข้อมูลปัจจุบันหรือไม่? แนะนำให้ดาวน์โหลดไฟล์สำรองปัจจุบันก่อน')){e.target.value='';return}
  if(mode==='merge'){let ids=new Set(items.map(x=>String(x.id)));let additions=clean.filter(x=>!ids.has(String(x.id)));items=[...items,...additions];alert(`รวมข้อมูลสำเร็จ เพิ่ม ${additions.length} รายการ (ข้ามรายการ ID ซ้ำ ${clean.length-additions.length} รายการ)`)}else{items=clean;alert(`กู้คืนข้อมูลสำเร็จ ${items.length} รายการ`)}
  saveData();render();
 }catch(err){alert('กู้คืนไม่สำเร็จ: '+err.message)}finally{input.value=''}};r.onerror=()=>{alert('อ่านไฟล์ไม่สำเร็จ กรุณาลองเลือกไฟล์จากแอป Files อีกครั้ง');input.value=''};r.readAsText(f,'UTF-8')
}
function printReport(){let pi=items.filter(x=>period==='month'?monthKey(x.date)===`${year}-${month}`:x.date.startsWith(year));let html=`<h2>BeePocketBudget</h2><h3>รายงาน${period==='month'?'ประจำเดือน '+monthName(`${year}-${month}`):'ประจำปี '+(Number(year)+543)}</h3><p>รายรับ ${money(sum(pi,'income'))} บาท | รายจ่าย ${money(sum(pi,'expense'))} บาท | สุทธิ ${money(sum(pi,'income')-sum(pi,'expense'))} บาท</p><table border="1" cellspacing="0" cellpadding="7" width="100%"><tr><th>วันที่</th><th>ประเภท</th><th>หมวดหมู่</th><th>รายละเอียด</th><th>จำนวนเงิน</th></tr>${pi.map(x=>`<tr><td>${esc(x.date)}</td><td>${x.type==='income'?'รายรับ':'รายจ่าย'}</td><td>${esc(x.category)}</td><td>${esc(x.note||'')}</td><td align="right">${money(x.amount)}</td></tr>`).join('')}</table>`;let w=window.open('','_blank');if(!w){alert('กรุณาอนุญาตให้เปิดหน้าต่างสำหรับพิมพ์รายงาน');return}w.document.write(`<meta charset="utf-8"><title>BeePocketBudget Report</title><body style="font-family:Arial,sans-serif;padding:24px">${html}</body>`);w.document.close();w.print()}
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
render();