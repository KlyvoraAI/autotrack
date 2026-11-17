const KEY='autotrack_v1';
const blank=()=>({vehicles:[],active:null,maintenance:[],mileage:[],expenses:[],reminders:[]});
let state=load(),modalKind=null;
function load(){try{return {...blank(),...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{return blank()}}
function save(){localStorage.setItem(KEY,JSON.stringify(state));render()}
function id(){return crypto.randomUUID?crypto.randomUUID():String(Date.now()+Math.random())}
function active(){return state.vehicles.find(v=>v.id===state.active)||null}
function vehicleRecords(key){return state[key].filter(x=>x.vehicleId===state.active)}
function money(n){return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(n)||0)}
function date(s){if(!s)return '—';return new Date(s+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function toast(s){const t=document.querySelector('#toast');t.textContent=s;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2300)}
function showPage(name){document.querySelectorAll('.page').forEach(x=>x.classList.toggle('active',x.id===name));document.querySelectorAll('.nav-item').forEach(x=>x.classList.toggle('active',x.dataset.page===name));document.querySelector('#page-title').textContent=({dashboard:'Overview',maintenance:'Maintenance',mileage:'Mileage log',expenses:'Expenses',reminders:'Reminders'})[name];}
function empty(msg){return '<div class="empty-state">'+msg+'</div>'}
function row(icon,title,sub,right,actions=''){return '<div class="record-row"><div class="record-main"><div class="record-icon">'+icon+'</div><div><strong>'+esc(title)+'</strong><small>'+esc(sub)+'</small></div></div><div class="record-meta">'+right+actions+'</div></div>'}
function actions(type,idv){return '<div class="record-actions"><button class="mini-btn" data-edit="'+type+':'+idv+'">Edit</button><button class="mini-btn danger" data-delete="'+type+':'+idv+'">Delete</button></div>'}
function dueStatus(r){let parts=[];if(r.dueDate){const days=Math.ceil((new Date(r.dueDate+'T23:59:59')-new Date())/86400000);parts.push(days<0?'Overdue':days===0?'Due today':'Due '+date(r.dueDate));}if(r.dueMileage){const diff=Number(r.dueMileage)-(active()?.mileage||0);parts.push(diff<=0?'Mileage due':diff.toLocaleString()+' mi to go')}return parts.join(' · ')||'No due date set'}
function render(){
 const v=active(),m=vehicleRecords('maintenance'),e=vehicleRecords('expenses'),ml=vehicleRecords('mileage'),rr=vehicleRecords('reminders');
 document.querySelector('#vehicle-switcher').innerHTML=state.vehicles.length?'<select class="vehicle-select" id="vehicle-select">'+state.vehicles.map(x=>'<option value="'+x.id+'" '+(x.id===state.active?'selected':'')+'>'+esc(x.year+' '+x.make+' '+x.model)+'</option>').join('')+'</select>': '<button class="vehicle-select" id="empty-add">＋ Add your first vehicle</button>';
 document.querySelector('#vehicle-heading').textContent=v?v.year+' '+v.make+' '+v.model:'Your garage';
 document.querySelector('#vehicle-subheading').textContent=v?[v.nickname,v.plate].filter(Boolean).join(' · ')||'Your vehicle overview':'Add a vehicle to start tracking maintenance and expenses.';
 document.querySelector('#stat-mileage').textContent=v?(Number(v.mileage)||0).toLocaleString()+' mi':'—';
 document.querySelector('#stat-maintenance').textContent=m.length;
 const now=new Date(),month=now.getMonth(),year=now.getFullYear(),monthly=e.filter(x=>{let d=new Date(x.date+'T12:00:00');return d.getMonth()===month&&d.getFullYear()===year}).reduce((s,x)=>s+Number(x.amount||0),0);
 document.querySelector('#stat-month').textContent=money(monthly);
 const due=rr.filter(r=>(r.dueDate&&new Date(r.dueDate+'T23:59:59')<=new Date(Date.now()+30*86400000))||(r.dueMileage&&Number(r.dueMileage)<=(v?.mileage||0)+500));
 document.querySelector('#stat-reminders').textContent=due.length;document.querySelector('#reminder-count').textContent=due.length||'';
 document.querySelector('#dashboard-maintenance').innerHTML=m.length?m.slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,4).map(x=>row('⚙',x.type,date(x.date)+' · '+Number(x.mileage||0).toLocaleString()+' mi',money(x.cost))).join(''):empty('No maintenance records yet. Add your first service to start your history.');
 document.querySelector('#dashboard-expenses').innerHTML=e.length?e.slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,4).map(x=>row(x.category==='Fuel'?'⛽':'$',x.description||x.category,date(x.date),money(x.amount))).join(''):empty('No expenses recorded yet.');
 document.querySelector('#dashboard-reminders').innerHTML=rr.length?rr.slice().sort((a,b)=>(a.dueDate||'9999').localeCompare(b.dueDate||'9999')).slice(0,3).map(x=>row('◷',x.title,dueStatus(x),x.dueMileage?Number(x.dueMileage).toLocaleString()+' mi':'' )).join(''):empty('You are all caught up. Add a maintenance reminder to stay ahead.');
 const filter=document.querySelector('#maintenance-filter')?.value||'all',filtered=m.filter(x=>filter==='all'||x.type===filter);
 document.querySelector('#maintenance-list').innerHTML=filtered.length?filtered.slice().sort((a,b)=>b.date.localeCompare(a.date)).map(x=>row('⚙',x.type,date(x.date)+' · '+Number(x.mileage||0).toLocaleString()+' mi'+(x.notes?' · '+x.notes:''),money(x.cost),actions('maintenance',x.id))).join(''):empty('No service records found. Add a service to build your maintenance history.');
 document.querySelector('#mileage-current').textContent=v?(Number(v.mileage)||0).toLocaleString()+' mi':'—';document.querySelector('#mileage-entries').textContent=ml.length;
 document.querySelector('#mileage-list').innerHTML=ml.length?ml.slice().sort((a,b)=>b.date.localeCompare(a.date)).map(x=>row('↗',Number(x.value).toLocaleString()+' miles',date(x.date)+(x.note?' · '+x.note:''),'Odometer',actions('mileage',x.id))).join(''):empty('No mileage entries yet. Record your odometer reading.');
 document.querySelector('#expense-total').textContent=money(e.reduce((s,x)=>s+Number(x.amount||0),0));document.querySelector('#expense-fuel').textContent=money(e.filter(x=>x.category==='Fuel').reduce((s,x)=>s+Number(x.amount||0),0));
 document.querySelector('#expense-list').innerHTML=e.length?e.slice().sort((a,b)=>b.date.localeCompare(a.date)).map(x=>row(x.category==='Fuel'?'⛽':'$',x.description||x.category,x.category+' · '+date(x.date),money(x.amount),actions('expenses',x.id))).join(''):empty('No expenses recorded. Add fuel, repair, maintenance or other costs.');
 document.querySelector('#reminder-list').innerHTML=rr.length?rr.slice().sort((a,b)=>(a.dueDate||'9999').localeCompare(b.dueDate||'9999')).map(x=>row('◷',x.title,dueStatus(x),x.dueMileage?Number(x.dueMileage).toLocaleString()+' mi':'',actions('reminders',x.id))).join(''):empty('No reminders set. Create one for your next oil change, tire rotation or inspection.');
}
const today=()=>new Date().toISOString().slice(0,10);
function field(label,name,type='text',value='',extra=''){return '<div class="field"><label for="f-'+name+'">'+label+'</label><input id="f-'+name+'" name="'+name+'" type="'+type+'" value="'+esc(value)+'" '+extra+'></div>'}
function selectField(label,name,opts,value){return '<div class="field"><label>'+label+'</label><select name="'+name+'">'+opts.map(o=>'<option '+(o===value?'selected':'')+'>'+o+'</option>').join('')+'</select></div>'}
function openModal(kind,record=null){
 if(kind!=='vehicle'&&!active()){toast('Add a vehicle first.');return}
 modalKind=kind;document.querySelector('#modal-title').textContent=({vehicle:'Add a vehicle',maintenance:record?'Edit service':'Log maintenance',mileage:record?'Edit mileage':'Record mileage',expenses:record?'Edit expense':'Add an expense',reminders:record?'Edit reminder':'Create reminder'})[kind];
 let html='';
 if(kind==='vehicle')html=field('Make','make','text',record?.make||'')+field('Model','model','text',record?.model||'')+'<div class="field-grid">'+field('Year','year','number',record?.year||new Date().getFullYear(),'min="1900" max="2100"')+field('Current mileage','mileage','number',record?.mileage||'','min="0"')+'</div>'+field('Nickname (optional)','nickname','text',record?.nickname||'')+field('License plate (optional)','plate','text',record?.plate||'');
 if(kind==='maintenance')html=selectField('Service type','type',['Oil change','Tire rotation','Brakes','Inspection','Battery','Transmission','Coolant','Other'],record?.type||'Oil change')+'<div class="field-grid">'+field('Service date','date','date',record?.date||today())+field('Odometer (miles)','mileage','number',record?.mileage??active().mileage,'min="0"')+'</div>'+field('Cost ($)','cost','number',record?.cost||'','min="0" step="0.01"')+field('Notes','notes','text',record?.notes||'');
 if(kind==='mileage')html=field('Odometer reading (miles)','value','number',record?.value??active().mileage,'min="0"')+field('Date','date','date',record?.date||today())+field('Note (optional)','note','text',record?.note||'');
 if(kind==='expenses')html=selectField('Expense category','category',['Fuel','Repair','Maintenance','Insurance','Registration','Parking','Other'],record?.category||'Fuel')+field('Description','description','text',record?.description||'')+'<div class="field-grid">'+field('Amount ($)','amount','number',record?.amount||'','min="0" step="0.01"')+field('Date','date','date',record?.date||today())+'</div>'+field('Odometer (optional)','mileage','number',record?.mileage||'','min="0"');
 if(kind==='reminders')html=field('Reminder title','title','text',record?.title||'Oil change')+'<div class="field-grid">'+field('Due date (optional)','dueDate','date',record?.dueDate||'')+field('Due at mileage (optional)','dueMileage','number',record?.dueMileage||'','min="0"')+'</div>'+field('Notes (optional)','notes','text',record?.notes||'');
 document.querySelector('#modal-fields').innerHTML=html;document.querySelector('#modal-form').dataset.edit=record?.id||'';document.querySelector('#modal').classList.add('open');
}
function closeModal(){document.querySelector('#modal').classList.remove('open');modalKind=null}
document.querySelector('#modal-form').addEventListener('submit',ev=>{ev.preventDefault();const f=Object.fromEntries(new FormData(ev.target));const edit=ev.target.dataset.edit;const item={...f,id:edit||id(),vehicleId:state.active};
 if(modalKind==='vehicle'){item.id=edit||id();item.year=Number(item.year);item.mileage=Number(item.mileage||0);state.vehicles.push(item);state.active=item.id}
 else if(modalKind==='maintenance'){item.cost=Number(item.cost||0);item.mileage=Number(item.mileage||0);upsert('maintenance',item);if(item.mileage>active().mileage)active().mileage=item.mileage}
 else if(modalKind==='mileage'){item.value=Number(item.value);if(item.value<active().mileage&&!edit){toast('That reading is lower than your current odometer.');return}upsert('mileage',item);if(item.value>active().mileage)active().mileage=item.value}
 else if(modalKind==='expenses'){item.amount=Number(item.amount||0);item.mileage=Number(item.mileage||0);upsert('expenses',item)}
 else if(modalKind==='reminders'){item.dueMileage=Number(item.dueMileage||0);upsert('reminders',item)}
 closeModal();save();toast('Saved to your garage.');
});
function upsert(key,item){const i=state[key].findIndex(x=>x.id===item.id);if(i>=0)state[key][i]=item;else state[key].push(item)}
document.addEventListener('click',ev=>{
 const nav=ev.target.closest('[data-page]');if(nav)showPage(nav.dataset.page);
 const go=ev.target.closest('[data-goto]');if(go)showPage(go.dataset.goto);
 const edit=ev.target.closest('[data-edit]');if(edit){const [type,rid]=edit.dataset.edit.split(':');const rec=state[type].find(x=>x.id===rid);if(rec)openModal(type,rec)}
 const del=ev.target.closest('[data-delete]');if(del){const [type,rid]=del.dataset.delete.split(':');if(confirm('Delete this record?')){state[type]=state[type].filter(x=>x.id!==rid);save();toast('Record deleted.')}}
});
document.querySelector('#add-vehicle').onclick=()=>openModal('vehicle');document.querySelector('#empty-add').onclick=()=>openModal('vehicle');
document.querySelector('#add-maintenance').onclick=()=>openModal('maintenance');document.querySelector('#add-mileage').onclick=()=>openModal('mileage');document.querySelector('#add-expense').onclick=()=>openModal('expenses');document.querySelector('#quick-log').onclick=()=>openModal('expenses');document.querySelector('#add-reminder').onclick=()=>openModal('reminders');
document.querySelector('#modal-close').onclick=closeModal;document.querySelector('#modal-cancel').onclick=closeModal;document.querySelector('#maintenance-filter').onchange=render;
document.addEventListener('change',ev=>{if(ev.target.id==='vehicle-select'){state.active=ev.target.value;save()}});
document.querySelector('#today-label').textContent=new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'}).toUpperCase();
render();
