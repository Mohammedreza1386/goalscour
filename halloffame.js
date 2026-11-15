
(() => {
"use strict";

const URL="https://zusbebjskchgehdjvpsm.supabase.co";
const KEY="sb_publishable_WGMEA7-K8FAResrVCL8GJQ_6KCxrvmK";

const db = window.supabase?.createClient
  ? window.supabase.createClient(URL, KEY)
  : null;
const main=document.querySelector("main");
const nav=main?.querySelector("nav");

if(!main||!nav||document.getElementById("gcHallOfFame"))return;

const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({
"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;',"\'":"&#39;"
}[c]));

const num=v=>{
const n=Number(v??0);
return Number.isFinite(n)&&n>0?n:0;
};

const tab=document.createElement("button");
tab.type="button";
tab.dataset.tab="gcHallOfFame";
tab.textContent="تالار افتخارات";
nav.appendChild(tab);

const section=document.createElement("section");
section.id="gcHallOfFame";
section.className="section";

section.innerHTML=`
<style>
#gcHallOfFame{direction:rtl}
#gcHallOfFame .hf-wrap{display:grid;gap:15px}
#gcHallOfFame .hf-hero,
#gcHallOfFame .hf-panel{
padding:17px;
border:1px solid #273329;
border-radius:17px;
background:#111812;
}
#gcHallOfFame .hf-hero{
background:linear-gradient(135deg,#253522,#111812);
}
#gcHallOfFame h2,#gcHallOfFame h3{
color:#b9f27c;
}
#gcHallOfFame .hf-grid{
display:grid;
gap:13px;
}
#gcHallOfFame .hf-list{
display:grid;
gap:9px;
}
#gcHallOfFame .hf-player{
display:flex;
align-items:center;
gap:10px;
padding:10px;
border:1px solid #273329;
border-radius:13px;
background:#0c130d;
}
#gcHallOfFame .hf-player:first-child{
border-color:#b9f27c;
}
#gcHallOfFame .hf-rank{
color:#b9f27c;
font-weight:bold;
}
#gcHallOfFame .hf-photo{
width:43px;
height:43px;
border-radius:50%;
object-fit:cover;
}
#gcHallOfFame .hf-info{
flex:1;
min-width:0;
}
#gcHallOfFame .hf-name{
font-weight:bold;
font-size:13px;
}
#gcHallOfFame .hf-gap{
font-size:11px;
color:#89958a;
margin-top:4px;
}
#gcHallOfFame .hf-value{
font-size:18px;
font-weight:bold;
color:#b9f27c;
}
#gcHallOfFame .hf-empty{
color:#89958a;
padding:12px;
}
@media(min-width:700px){
#gcHallOfFame .hf-grid{
grid-template-columns:repeat(2,minmax(0,1fr));
}
}
</style>

<div class="hf-wrap">

<div class="hf-hero">
<h2>🏆 تالار افتخارات Goalscour</h2>
<p>برترین بازیکنان تاریخ Goalscour</p>
<span>رتبه‌بندی زنده · سه نفر برتر هر بخش</span>
</div>

<div class="hf-grid" id="hfCategories">
در حال دریافت اطلاعات...
</div>

<div id="hfStatus" class="hf-gap"></div>

</div>
`;

main.appendChild(section);

function openTab(){

document.querySelectorAll(".section")
.forEach(e=>e.classList.toggle(
"active",e.id==="gcHallOfFame"
));

document.querySelectorAll("nav button[data-tab]")
.forEach(e=>e.classList.toggle(
"active",e===tab
));

load();
}

tab.addEventListener("click",openTab);

function matchKey(date,opponent){
return String(date||"").slice(0,10)+"|"+
String(opponent||"").trim().toLowerCase();
}

function render(stats){

const cats=[
["آقای گل کل","goals","گل"],
["بهترین گلزن رسمی","officialGoals","گل"],
["بهترین گلزن غیررسمی","unofficialGoals","گل"],
["بهترین گلزن بدون پنالتی","nonPenaltyGoals","گل"],
["بهترین پنالتی‌زن","penalties","پنالتی"],
["بهترین پاسور کل","assists","پاس گل"],
["بهترین پاسور رسمی","officialAssists","پاس گل"],
["بهترین پاسور غیررسمی","unofficialAssists","پاس گل"],
["بیشترین مشارکت گل (G+A)","contributions","مشارکت"],
["بهترین هت‌تریک‌زن","hatTricks","هت‌تریک"],
["بهترین دبل‌زن","braces","دبل"],
["بهترین دریبل‌زن","successfulDribbles","دریبل موفق"]
];

const box=document.getElementById("hfCategories");

if(!stats.length){
box.innerHTML='<div class="hf-panel hf-empty">هنوز بازیکنی ثبت نشده است.</div>';
return;
}

box.innerHTML=cats.map(cat=>{

const ranked=stats
.filter(p=>num(p[cat[1]])>0)
.sort((a,b)=>num(b[cat[1]])-num(a[cat[1]]))
.slice(0,3);

const rows=ranked.length
?ranked.map((p,i)=>{

const gap=i===0
?"صدرنشین این بخش"
:(num(ranked[0][cat[1]])-num(p[cat[1]]))+
" "+cat[2]+" فاصله تا نفر اول";

const photo=p.photo
?'<img class="hf-photo" src="'+esc(p.photo)+'" alt="'+esc(p.name)+'">'
:'<div class="hf-photo">⚽</div>';

return `
<div class="hf-player">
<div class="hf-rank">${["🥇","🥈","🥉"][i]}</div>
${photo}
<div class="hf-info">
<div class="hf-name">${esc(p.name)}</div>
<div class="hf-gap">${gap}</div>
</div>
<div class="hf-value">${num(p[cat[1]])}</div>
</div>
`;

}).join("")
:'<div class="hf-empty">هنوز آماری ثبت نشده است.</div>';

return `
<div class="hf-panel">
<h3>${cat[0]}</h3>
<div class="hf-list">${rows}</div>
</div>
`;

}).join("");

}

async function load(){

const box=document.getElementById("hfCategories");
const status=document.getElementById("hfStatus");

if(!box||!status)return;

box.innerHTML="در حال دریافت آمار واقعی...";

try{

const results=await Promise.all([

db.from("goalscour_players").select("id,name,photo"),
db.from("goalscour_matches").select("*"),
db.from("goalscour_unofficial").select("*"),
db.from("goalscour_dribbles").select("*"),
db.from("goalscour_match_events").select("id,opponent,match_date"),
db.from("goalscour_match_performances").select("match_id,player_id,goals,assists,penalties")

]);

const failed=results.find(r=>r.error);
if(failed)throw failed.error;

const players=results[0].data||[];
const matches=results[1].data||[];
const un=results[2].data||[];
const dribbles=results[3].data||[];
const events=results[4].data||[];
const performances=results[5].data||[];

const ratedKeys=new Set(
events.map(e=>matchKey(e.match_date,e.opponent))
);

const oldMatches=matches.filter(
m=>!ratedKeys.has(matchKey(m.match_date,m.opponent))
);

const stats=players.map(p=>{

const id=String(p.id);

const scored=oldMatches.filter(
m=>String(m.scorer_id)===id
);

const assisted=oldMatches.filter(
m=>String(m.assister_id)===id
);

const rated=performances.filter(
r=>String(r.player_id)===id
);

const unRows=un.filter(
r=>String(r.player_id)===id
);

const d=dribbles.find(
r=>String(r.player_id)===id
)||{};

const officialGoals=
scored.reduce((s,m)=>s+num(m.goals),0)+
rated.reduce((s,r)=>s+num(r.goals),0);

const unofficialGoals=
unRows.reduce((s,r)=>s+num(r.goals),0);

const goals=officialGoals+unofficialGoals;

const officialAssists=
assisted.reduce((s,m)=>s+num(m.assists),0)+
rated.reduce((s,r)=>s+num(r.assists),0);

const unofficialAssists=
unRows.reduce((s,r)=>s+num(r.assists),0);

const assists=officialAssists+unofficialAssists;

const penalties=
scored.reduce((s,m)=>s+num(m.penalties??m.penaltyGoals),0)+
rated.reduce((s,r)=>s+num(r.penalties),0)+
unRows.reduce((s,r)=>s+num(r.penalties??r.penalty_goals),0);

return {
...p,
officialGoals,
unofficialGoals,
goals,
penalties,
nonPenaltyGoals:Math.max(0,goals-penalties),
officialAssists,
unofficialAssists,
assists,
contributions:goals+assists,
hatTricks:
scored.filter(m=>num(m.goals)>=3).length+
rated.filter(r=>num(r.goals)>=3).length,
braces:
scored.filter(m=>num(m.goals)===2).length+
rated.filter(r=>num(r.goals)===2).length,
successfulDribbles:num(d.successful)
};

});

render(stats);

status.textContent=
"آمار "+players.length+
" بازیکن از Supabase دریافت شد.";

}catch(error){

box.innerHTML=
'<div class="hf-panel hf-empty">خطا در دریافت اطلاعات.</div>';

status.textContent=error.message||"خطای نامشخص";

}

}

window.gcRefreshHallOfFame=load;

window.addEventListener("focus",load);

document.addEventListener("visibilitychange",()=>{
if(!document.hidden)load();
});

window.setInterval(()=>{
if(!document.hidden)load();
},30000);

const original=window.renderAll;

if(typeof original==="function"){

window.renderAll=function(){

const result=original.apply(this,arguments);

window.setTimeout(load,1200);

return result;

};

}

load();

})();
  
