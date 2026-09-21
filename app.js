const MOVIES=[
{id:"his-girl-friday",title:"His Girl Friday",year:1940,genre:"Comedy",poster:"https://upload.wikimedia.org/wikipedia/commons/0/0f/His_Girl_Friday_%281940%29_poster.jpg",video:"https://archive.org/download/HisGirlFriday1940/HisGirlFriday1940_512kb.mp4",description:"A fast-paced newspaper comedy about an editor trying to keep his star reporter from leaving the newsroom.",rights:"Prototype entry — verify the exact file's redistribution/download rights before public release."},
{id:"night-living-dead",title:"Night of the Living Dead",year:1968,genre:"Horror",poster:"https://upload.wikimedia.org/wikipedia/commons/9/9c/Night_of_the_Living_Dead_%281968%29.jpg",video:"https://archive.org/download/night_of_the_living_dead/night_of_the_living_dead_512kb.mp4",description:"A group of people barricade themselves inside a farmhouse while the dead begin to rise.",rights:"Prototype entry — verify the exact file's redistribution/download rights before public release."},
{id:"detour",title:"Detour",year:1945,genre:"Crime",poster:"https://upload.wikimedia.org/wikipedia/commons/2/2d/Detour_%281945_film%29_poster.jpg",video:"https://archive.org/download/Detour_1945/Detour_1945_512kb.mp4",description:"A hitchhiker's journey spirals into a dark film-noir nightmare.",rights:"Prototype entry — verify the exact file's redistribution/download rights before public release."},
{id:"carnival-souls",title:"Carnival of Souls",year:1962,genre:"Horror",poster:"https://upload.wikimedia.org/wikipedia/commons/3/3a/Carnival_of_Souls_%281962%29.jpg",video:"https://archive.org/download/CarnivalOfSouls/CarnivalOfSouls_512kb.mp4",description:"A woman survives a mysterious accident and becomes haunted by a strange carnival.",rights:"Prototype entry — verify the exact file's redistribution/download rights before public release."},
{id:"plan9",title:"Plan 9 from Outer Space",year:1957,genre:"Sci-Fi",poster:"https://upload.wikimedia.org/wikipedia/commons/0/0f/Plan_9_from_Outer_Space_%281959%29.jpg",video:"https://archive.org/download/Plan9FromOuterSpace/Plan9FromOuterSpace_512kb.mp4",description:"Aliens attempt to stop humanity from creating a weapon capable of destroying the universe.",rights:"Prototype entry — verify the exact file's redistribution/download rights before public release."},
{id:"white-zombie",title:"White Zombie",year:1932,genre:"Horror",poster:"https://upload.wikimedia.org/wikipedia/commons/9/9b/White_Zombie_%281932%29_poster.jpg",video:"https://archive.org/download/WhiteZombie1932/WhiteZombie1932_512kb.mp4",description:"A sinister island setting and a mysterious zombie master threaten a young couple.",rights:"Prototype entry — verify the exact file's redistribution/download rights before public release."}
];

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
let selected=null, activeGenre="All";
const DB="FreeFlixDownloadsV6", STORE="movies";
let dbPromise;

function openDB(){return dbPromise||(dbPromise=new Promise((res,rej)=>{let r=indexedDB.open(DB,1);r.onupgradeneeded=()=>r.result.createObjectStore(STORE,{keyPath:"id"});r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)}))}
async function getDownloads(){let db=await openDB();return new Promise((res,rej)=>{let t=db.transaction(STORE,"readonly"),s=t.objectStore(STORE),r=s.getAll();r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
async function putDownload(x){let db=await openDB();return new Promise((res,rej)=>{let t=db.transaction(STORE,"readwrite");t.objectStore(STORE).put(x);t.oncomplete=res;t.onerror=()=>rej(t.error)})}
async function delDownload(id){let db=await openDB();return new Promise((res,rej)=>{let t=db.transaction(STORE,"readwrite");t.objectStore(STORE).delete(id);t.oncomplete=res;t.onerror=()=>rej(t.error)})}
async function clearDownloads(){let db=await openDB();return new Promise((res,rej)=>{let t=db.transaction(STORE,"readwrite");t.objectStore(STORE).clear();t.oncomplete=res;t.onerror=()=>rej(t.error)})}

function genres(){return ["All",...new Set(MOVIES.map(m=>m.genre))]}
function renderHero(){let m=MOVIES[0];$("#hero").innerHTML=`<div class="hero"><img src="${m.poster}" alt=""><div class="heroText"><span class="pill">${m.genre}</span><h1>${m.title}</h1><p>${m.year} • Legal-catalog prototype</p><button class="primaryBtn" onclick="openDetails('${m.id}')">▶ View movie</button></div></div>`}
function renderGenres(){let gs=genres();$("#genreChips").innerHTML=gs.map(g=>`<button class="chip ${g===activeGenre?"active":""}" onclick="setGenre('${g}')">${g}</button>`).join("")}
function card(m){return `<article class="card" onclick="openDetails('${m.id}')"><img src="${m.poster}" alt="${m.title}" loading="lazy"><div class="cardBody"><h3>${m.title}</h3><p>${m.year} • ${m.genre}</p></div></article>`}
function renderGrid(){let list=activeGenre==="All"?MOVIES:MOVIES.filter(m=>m.genre===activeGenre);$("#movieGrid").innerHTML=list.map(card).join("")}
function setGenre(g){activeGenre=g;renderGenres();renderGrid();window.scrollTo({top:0,behavior:"smooth"})}

function openDetails(id){selected=MOVIES.find(m=>m.id===id);$("#detailPoster").src=selected.poster;$("#detailTitle").textContent=selected.title;$("#detailGenre").textContent=selected.genre;$("#detailMeta").textContent=`${selected.year} • ${selected.genre}`;$("#detailDescription").textContent=selected.description;$("#rightsNote").textContent=selected.rights;$("#downloadStatus").innerHTML="";$("#detailModal").classList.remove("hidden");}
$("#closeDetail").onclick=()=>$("#detailModal").classList.add("hidden");

async function playMovie(m){let ds=await getDownloads(),d=ds.find(x=>x.id===m.id);$("#playerTitle").textContent=m.title;$("#videoPlayer").src=d?URL.createObjectURL(d.blob):m.video;$("#playerModal").classList.remove("hidden");$("#videoPlayer").play().catch(()=>{});}
$("#watchBtn").onclick=()=>playMovie(selected);
$("#closePlayer").onclick=()=>{let v=$("#videoPlayer");v.pause();v.removeAttribute("src");v.load();$("#playerModal").classList.add("hidden")};

async function downloadMovie(m){
  $("#downloadStatus").innerHTML=`<div class="progress"><i id="detailProgress"></i></div><p class="muted">Downloading… <span id="detailPct">0%</span></p>`;
  try{
    let res=await fetch(m.video), total=+res.headers.get("Content-Length")||0, reader=res.body.getReader(), chunks=[], received=0;
    while(true){let {done,value}=await reader.read();if(done)break;chunks.push(value);received+=value.length;if(total){let p=Math.round(received/total*100);$("#detailProgress").style.width=p+"%";$("#detailPct").textContent=p+"%";}}
    let blob=new Blob(chunks,{type:"video/mp4"}); await putDownload({id:m.id,title:m.title,year:m.year,genre:m.genre,poster:m.poster,blob,size:blob.size,created:Date.now()});
    $("#downloadStatus").innerHTML=`<p class="muted">✓ Downloaded for offline playback</p>`; renderDownloads();
  }catch(e){$("#downloadStatus").innerHTML=`<p class="muted">Download failed. Check your connection or the source.</p>`}
}
$("#downloadBtn").onclick=()=>downloadMovie(selected);

async function renderDownloads(){
 let ds=await getDownloads(), total=ds.reduce((a,x)=>a+x.size,0);
 $("#storageText").textContent=fmt(total);$("#storageText2").textContent=fmt(total);$("#downloadCount").textContent=ds.length;
 $("#downloadsList").innerHTML=ds.length?ds.map(d=>`<div class="downloadRow"><img src="${d.poster}" alt=""><div class="downloadInfo"><h3>${d.title}</h3><div class="muted">${d.year} • ${d.genre} • ${fmt(d.size)}</div><div class="progress"><i style="width:100%"></i></div><button onclick="playDownloaded('${d.id}')">▶ Play offline</button> <button onclick="removeDownloaded('${d.id}')">Delete</button></div></div>`).join(""):`<div class="empty">No downloads yet.<br>Download a movie and it will appear here.</div>`;
}
async function playDownloaded(id){let ds=await getDownloads(),d=ds.find(x=>x.id===id);if(d)playMovie(d)}
async function removeDownloaded(id){await delDownload(id);renderDownloads()}
$("#clearDownloads").onclick=async()=>{if(confirm("Delete all downloaded movies?")){await clearDownloads();renderDownloads()}};
function fmt(n){if(!n)return"0 MB";let u=["B","KB","MB","GB"],i=Math.floor(Math.log(n)/Math.log(1024));return `${(n/Math.pow(1024,i)).toFixed(i?1:0)} ${u[i]}`}

function showView(id){$$(".view").forEach(v=>v.classList.toggle("active",v.id===id));$$(".tab").forEach(b=>b.classList.toggle("active",b.dataset.view===id));if(id==="downloadsView")renderDownloads();if(id==="searchView")$("#searchInput").focus()}
$$(".tab").forEach(b=>b.onclick=()=>showView(b.dataset.view));
$("#searchBtn").onclick=()=>showView("searchView");
$("#allGenresBtn").onclick=()=>showView("homeView");
$("#searchInput").oninput=e=>{let q=e.target.value.trim().toLowerCase();$("#searchResults").innerHTML=(q?MOVIES.filter(m=>(m.title+" "+m.genre+" "+m.year).toLowerCase().includes(q)):MOVIES).map(card).join("")};
$("#clearSearch").onclick=()=>{$("#searchInput").value="";$("#searchResults").innerHTML=""};

renderHero();renderGenres();renderGrid();renderDownloads();
