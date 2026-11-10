const KEY='beepocketbudget_transactions_v2';
const $=s=>document.querySelector(s), money=n=>Number(n||0).toLocaleString('th-TH',{maximumFractionDigits:2});
const pad=n=>String(n).padStart(2,'0'), today=()=>{let d=new Date();return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`};
const monthKey=d=>String(d||'').slice(0,7), sum=(a,t)=>a.filter(x=>!t||x.type===t).reduce((s,x)=>s+Number(x.amount||0),0);
const monthName=m=>{let [y,mm]=m.split('-').map(Number);return new Date(y,mm-1,1).toLocaleDateString('th-TH',{month:'long',year:'numeric'})};
let items=[],screen='home',type='income',filter='all',period='month',year=String(new Date().getFullYear()),month=pad(new Date().getMonth()+1),editing=null;
try{let v=JSON.parse(localStorage.getItem(KEY)||'[]');if(Array.isArray(v))items=v}catch(e){}
const saveData=()=>{try{localStorage.setItem(KEY,JSON.stringify(items))}catch(e){alert('บันทึกไม่สำเร็จ: พื้นที่จัดเก็บอาจไม่เพียงพอ')}};
const btn=(label,fn,cls='')=>`<button class="btn ${cls}" onclick="${fn}">${label}</button>`;
const cats=()=>type==='income'?['น้ำผึ้ง','ไขผึ้ง','พันธุ์ผึ้ง','อื่นๆ']:['อาหาร','ค่าแรง','อุปกรณ์','อื่นๆ'];
function go(s){screen=s;document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x.dataset.screen===s));render()}
document.querySelectorAll('.tab').forEach(x=>x.addEventListener('click',()=>{if(x.dataset.screen==='add')newItem();else go(x.dataset.screen)}));
function sorted(){return [...items].sort((a,b)=>b.date.localeCompare(a.date)||(b.createdAt||0)-(a.createdAt||0))}
function tx(x){let inc=x.type==='income';return `<div class="tx"><div class="txicon" style="background:${inc?'#e7f3e9':'#fbe9e5'}">${inc?'↙':'↗'}</div><div class="txbody"><div class="txtitle">${esc(x.category)}</div><div class="txsub">${esc(x.note|| (inc?'รายรับ':'รายจ่าย'))} · ${esc(x.date)}</div><div style="margin-top:6px"><span class="link" onclick="editItem('${x.id}')">แก้ไข</span>　<span class="link" style="color:#c65343" onclick="delItem('${x.id}')">ลบ</span></div></div><div class="txamount" style="color:${inc?'#39845a':'#c65343'}">${inc?'+':'−'}฿${money(x.amount)}</div></div>`}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
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
let vals=cats().map(c=>`<button class="chip ${formCat===c?'selected':''}" onclick="formCat='${c}';render()">${c}</button>`).join('');
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
let max=Math.max(1,...chart.flatMap(x=>[x.income,x.expense]));
let totals={income:sum(pi,'income'),expense:sum(pi,'expense')};
let catsum={};pi.filter(x=>x.type==='expense').forEach(x=>catsum[x.category]=(catsum[x.category]||0)+Number(x.amount));
app.innerHTML=`<div class="eyebrow">รายงานและการวิเคราะห์</div><h1>สรุปการเงิน</h1><div class="switch"><button class="${period==='month'?'selected':''}" onclick="period='month';render()">รายเดือน</button><button class="${period==='year'?'selected':''}" onclick="period='year';render()">รายปี</button></div>
${period==='year'?`<label>เลือกปี</label><div class="chips">${years.map(y=>`<button class="chip ${year===y?'selected':''}" onclick="year='${y}';render()">${Number(y)+543}</button>`).join('')}</div><div class="card"><b>รายรับ–รายจ่าย 12 เดือน (${Number(year)+543})</b><div class="chart">${chart.map(x=>`<div style="flex:1"><div class="barcol"><div class="bar" style="height:${Math.max(2,x.income/max*110)}px;background:#39845a"></div><div class="bar" style="height:${Math.max(2,x.expense/max*110)}px;background:#c65343"></div></div><div class="barlabel">${x.label}</div></div>`).join('')}</div><div class="smallmuted">● รายรับ　<span style="color:#c65343">● รายจ่าย</span></div></div>`:`<label>เลือกเดือน</label><div class="chips">${Array.from({length:12},(_,i)=>pad(i+1)).map(m=>`<button class="chip ${month===m?'selected':''}" onclick="month='${m}';render()">${m}</button>`).join('')}</div><label>เลือกปี</label><div class="chips">${years.map(y=>`<button class="chip ${year===y?'selected':''}" onclick="year='${y}';render()">${Number(y)+543}</button>`).join('')}</div>`}
<div class="grid"><div class="card"><div class="klabel">รายรับ</div><div class="kvalue" style="color:#39845a">฿${money(totals.income)}</div></div><div class="card"><div class="klabel">รายจ่าย</div><div class="kvalue" style="color:#c65343">฿${money(totals.expense)}</div></div><div class="card"><div class="klabel">สุทธิ</div><div class="kvalue">฿${money(totals.income-totals.expense)}</div></div><div class="card"><div class="klabel">จำนวนรายการ</div><div class="kvalue">${pi.length}</div></div></div>
<div class="card"><h2>สัดส่วนค่าใช้จ่าย</h2>${Object.entries(catsum).sort((a,b)=>b[1]-a[1]).map(([c,v])=>`<p class="smallmuted">${esc(c)}　฿${money(v)} (${totals.expense?(v/totals.expense*100).toFixed(1):0}%)</p>`).join('')||'<span class="smallmuted">ยังไม่มีข้อมูลค่าใช้จ่ายในช่วงเวลานี้</span>'}</div>${btn('พิมพ์ / บันทึกเป็น PDF','printReport()')}`;
}
if(screen==='more'){
app.innerHTML=`<div class="eyebrow">จัดการข้อมูล</div><h1>สำรองและกู้คืนข้อมูล</h1><div class="card"><h2>ข้อมูลของคุณอยู่ในอุปกรณ์นี้</h2><p class="smallmuted">ไม่มีบัญชีผู้ใช้และไม่มีการส่งข้อมูลขึ้นคลาวด์ ควรสำรองไฟล์เป็นประจำเพื่อป้องกันข้อมูลสูญหาย</p><b>จำนวนรายการทั้งหมด: ${items.length} รายการ</b>${btn('ส่งออกไฟล์สำรอง JSON','backup()')}${btn('นำเข้าไฟล์สำรอง JSON','document.getElementById("restoreFile").click()','soft')}<input id="restoreFile" type="file" accept=".json,application/json" hidden onchange="restore(event)"></div><div class="card"><h2>เกี่ยวกับแอป</h2><p class="smallmuted">BeePocketBudget PWA · Version 2.1.0</p><p class="smallmuted">จัดเก็บข้อมูลในอุปกรณ์นี้ ไม่ต้องมีบัญชีผู้ใช้หรือ Cloud Server</p></div>`;
}
}
let formCat='น้ำผึ้ง',formAmount='',formDate=today(),formNote='';
window.setEntryType=function(nextType){if(nextType!=='income'&&nextType!=='expense')return;type=nextType;formCat=nextType==='income'?'น้ำผึ้ง':'อาหาร';render()};
function newItem(){editing=null;type='income';formCat='น้ำผึ้ง';formAmount='';formDate=today();formNote='';go('add')}
function editItem(id){let x=items.find(y=>y.id===id);if(!x)return;editing=id;type=x.type;formCat=x.category;formAmount=String(x.amount);formDate=x.date;formNote=x.note||'';go('add')}
function saveItem(){let n=Number(String(formAmount).replace(/,/g,''));if(!Number.isFinite(n)||n<=0){alert('กรุณากรอกจำนวนเงินมากกว่า 0');return}if(!/^\d{4}-\d{2}-\d{2}$/.test(formDate)){alert('กรุณาใช้รูปแบบวันที่ YYYY-MM-DD');return}
if(editing)items=items.map(x=>x.id===editing?{...x,type,amount:n,category:formCat,date:formDate,note:formNote}:x);else items.unshift({id:String(Date.now()),createdAt:Date.now(),type,amount:n,category:formCat,date:formDate,note:formNote});
saveData();go('history')}
function delItem(id){let x=items.find(y=>y.id===id);if(x&&confirm(`ลบ ${x.category} จำนวน ${money(x.amount)} บาทหรือไม่?`)){items=items.filter(y=>y.id!==id);saveData();render()}}
function backup(){let blob=new Blob([JSON.stringify({app:'BeePocketBudget',version:2,exportedAt:new Date().toISOString(),transactions:items},null,2)],{type:'application/json'});let a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`BeePocketBudget-backup-${today()}.json`;a.click();URL.revokeObjectURL(a.href)}
function restore(e){let f=e.target.files[0];if(!f)return;let r=new FileReader();r.onload=()=>{try{let obj=JSON.parse(r.result),data=Array.isArray(obj)?obj:obj.transactions;if(!Array.isArray(data)||data.some(x=>!x.type||!x.date||!Number.isFinite(Number(x.amount))))throw Error('รูปแบบไฟล์ไม่ถูกต้อง');if(confirm(`พบ ${data.length} รายการ ข้อมูลปัจจุบันจะถูกแทนที่ ต้องการดำเนินการหรือไม่?`)){items=data;saveData();render();alert('นำเข้าข้อมูลสำเร็จ')}}catch(err){alert('นำเข้าไม่สำเร็จ: '+err.message)}e.target.value=''};r.readAsText(f)}
function printReport(){let pi=items.filter(x=>period==='month'?monthKey(x.date)===`${year}-${month}`:x.date.startsWith(year));let html=`<h2>BeePocketBudget</h2><h3>รายงาน${period==='month'?'ประจำเดือน '+monthName(`${year}-${month}`):'ประจำปี '+(Number(year)+543)}</h3><p>รายรับ ${money(sum(pi,'income'))} บาท | รายจ่าย ${money(sum(pi,'expense'))} บาท | สุทธิ ${money(sum(pi,'income')-sum(pi,'expense'))} บาท</p><table border="1" cellspacing="0" cellpadding="7" width="100%"><tr><th>วันที่</th><th>ประเภท</th><th>หมวดหมู่</th><th>รายละเอียด</th><th>จำนวนเงิน</th></tr>${pi.map(x=>`<tr><td>${esc(x.date)}</td><td>${x.type==='income'?'รายรับ':'รายจ่าย'}</td><td>${esc(x.category)}</td><td>${esc(x.note||'')}</td><td align="right">${money(x.amount)}</td></tr>`).join('')}</table>`;let w=window.open('','_blank');if(!w){alert('กรุณาอนุญาตให้เปิดหน้าต่างสำหรับพิมพ์รายงาน');return}w.document.write(`<meta charset="utf-8"><title>BeePocketBudget Report</title><body style="font-family:Arial,sans-serif;padding:24px">${html}</body>`);w.document.close();w.print()}
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
render();