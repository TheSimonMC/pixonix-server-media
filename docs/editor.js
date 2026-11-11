"use strict";
const $ = id => document.getElementById(id);
const make = (tag,text) => Object.assign(document.createElement(tag),{textContent:text??""});
const art = new Map(), drafts = new Map(), denied = new Set();
const kinds = {"icon":"Server list icon","background":"Server list background","banner":"Player list banner","logo":"Server logo"};
const filenames = ["icon.png","background.png","banner.png","logo.png","icon@2x.png","background@2x.png","logo@2x.png"];
const encoder = new TextEncoder();
let modules;
const report = msg => $("status").textContent=msg;
function selectPanel(id){
  report("");
  for(const panel of document.querySelectorAll(".panel"))panel.hidden=panel.id!==id;
  for(const b of $("sections").children)b.setAttribute("aria-pressed",String(b.dataset.panel===id));
}
for(const b of $("sections").children)b.onclick=()=>selectPanel(b.dataset.panel);
function asset(kind){return art.get(kind+"@2x.png")??art.get(kind+".png");}
let pendingPreview = 0;
function schedulePreview() {
  if (!pendingPreview) pendingPreview = requestAnimationFrame(preview);
}
function preview(){
  cancelAnimationFrame(pendingPreview);
  pendingPreview = 0;
  const example = $("source").value === "example";
  const images = {};
  for (const kind of Object.keys(kinds)) {
    const file = kind === "banner" ? "banner.png" : kind + "@2x.png";
    images[kind] = example ? clientPreview.image("minecraft_servers/pitschonix/" + file) : asset(kind)?.img;
  }
  clientPreview.render({
    name: example ? "Pitschonix.eu" : $("name").value.trim() || "Your network",
    address: example ? "pitschonix.eu" : $("address").value.trim() || "play.example.net",
    id: example ? "pitschonix" : $("slug").value.trim(),
    bannerWidth: example ? 128 : Number($("width").value),
    joins: example ? ["XAttack", "Lobby", "FFA", "Duels Legacy", "Duels Modern", "SkyWars Legacy", "SkyWars Modern", "BedWars"] : [...$("joins").children].map(row => row.querySelector("input").value.trim() || "New mode"),
    view: $("view").value, art: images
  });
  $("folder").textContent="minecraft_servers/"+($("slug").value.trim()||"…");
  $("fileCount").textContent=(art.size+1)+" file"+(art.size?"s":"");
  $("widthValue").textContent=$("width").value+" px";
}
function validFile(img){
  if(!img.naturalWidth || Math.max(img.naturalWidth,img.naturalHeight)>4096 || img.naturalWidth*img.naturalHeight>8388608)throw Error("Choose an image with no more than 8,388,608 pixels and no side longer than 4,096 pixels.");
}
for(const filename of filenames){
  const row=make("div"),label=make("label",kinds[filename.split(/[@.]/)[0]]+(filename.includes("@")?" (2×)":"")), input=make("input"),clear=make("button","Clear");
  const picker=make("span"), action=make("span","Choose PNG"), name=make("span","No file selected");
  picker.className="picker"; name.className="filename";
  input.type="file";input.accept="image/png";input.setAttribute("aria-label","Choose PNG for "+label.textContent);
  const feedback=make("small");feedback.id="error-"+filename;feedback.className="file-error";
  feedback.setAttribute("role","status");input.setAttribute("aria-describedby",feedback.id);
  picker.append(input,action,name);label.append(picker,feedback);row.className="file";row.append(label,clear);$(filename.includes("@") ? "hires" : "assets").append(row);clear.hidden=true;
  const reset=()=>{feedback.textContent="";drafts.delete(filename);if(art.has(filename))URL.revokeObjectURL(art.get(filename).url);art.delete(filename);input.value="";name.textContent="No file selected";clear.hidden=true;preview();};
  clear.onclick=reset;
  input.onchange=async()=>{
    const file=input.files[0];if(!file)return;
    feedback.textContent="";
    const token=Symbol();drafts.set(filename,token);let url;
    try{
      if(file.size>16777216)throw Error("Choose a PNG no larger than 16 MiB.");
      const data=new Uint8Array(await file.arrayBuffer().catch(()=>{throw Error("This file could not be read. Choose it again.");}));
      if([137,80,78,71,13,10,26,10].some((v,i)=>data[i]!==v))throw Error("Select a PNG file.");
      const bytes=new DataView(data.buffer);
      for(let pos=8;pos+12<=data.length;){
        const n=bytes.getUint32(pos);if(n>data.length-pos-12)throw Error("This PNG is incomplete. Choose another file.");
        if(bytes.getUint32(pos+4)===0x6163544c)throw Error("Choose a still PNG. This file is animated.");
        pos+=12+n;
      }
      url=URL.createObjectURL(file);const img=new Image();img.src=url;await img.decode().catch(()=>{throw Error("This PNG could not be opened. Choose another file.");});validFile(img);
      if(drafts.get(filename)!==token)return;
      if(art.has(filename))URL.revokeObjectURL(art.get(filename).url);
      art.set(filename,{file,url,data,img});name.textContent=file.name;url=null;clear.hidden=false;report("");
      $("source").value="draft";
      $("view").value=filename.startsWith("banner")?"TAB list":filename.startsWith("logo")?"Server logo":"Server list";
    }catch(e){if(drafts.get(filename)===token){input.value="";feedback.textContent=e.message;}}
    finally{if(url)URL.revokeObjectURL(url);if(drafts.get(filename)===token)drafts.delete(filename);preview();}
  };
}
$("add").onclick=()=>{
  if($("joins").children.length>=12)return;
  const row=make("div");row.className="mode";
  for(const [title,placeholder] of [["Mode","FFA"],["Destination","ffa.example.net"]]){
    const label=make("label",title), input=make("input");input.placeholder=placeholder;input.maxLength=title==="Mode"?32:260;label.append(input);row.append(label);
  }
  const remove=make("button","Remove");remove.onclick=()=>{row.remove();$("add").disabled=false;preview();};row.append(remove);$("joins").append(row);
  $("add").disabled=$("joins").children.length===12;$("source").value="draft";$("view").value="Quick Joins";row.querySelector("input").focus();preview();
};
function ruleControl(mod) {
  if (mod.id === "fullbright") {
    const mode = make("select");
    mode.setAttribute("aria-label", "Fullbright rule");
    for (const [value, label] of [["allow", "Player's choice"], ["night", "Night Vision only"], ["off", "Disable Fullbright"]]) {
      const option = make("option", label);
      option.value = value;
      mode.append(option);
    }
    mode.value = denied.has("fullbright") ? "off" : denied.has("fullbright.gamma") ? "night" : "allow";
    mode.onchange = () => {
      denied.delete("fullbright");
      denied.delete("fullbright.gamma");
      if (mode.value === "off") denied.add("fullbright");
      if (mode.value === "night") denied.add("fullbright.gamma");
    };
    return mode;
  }
  const toggle = make("input");
  toggle.type = "checkbox";
  toggle.checked = denied.has(mod.id);
  toggle.setAttribute("aria-label", "Disable " + mod.name);
  toggle.onchange = () => toggle.checked ? denied.add(mod.id) : denied.delete(mod.id);
  return toggle;
}
function policies(){
  const query=$("filter").value.trim().toLowerCase(), list=$("policy");list.replaceChildren();
  for(const m of modules??[]){
    if (![m.name,m.id,m.category,m.description].some(text=>text.toLowerCase().includes(query))) continue;
    let section = list.querySelector('[data-category="' + m.category + '"]');
    if (!section) {
      section = make("section");
      section.dataset.category = m.category;
      section.append(make("h3",m.category));
      list.append(section);
    }
    const card = make("article"), head = make("label"), info = make("span"), icon = make("img");
    card.className = "rule"; head.className = "rulehead";
    icon.src = "assets/" + m.id + ".png"; icon.alt = "";
    info.append(make("strong", m.name),make("small",m.description));
    head.append(icon,info,ruleControl(m));
    card.append(head);
    section.append(card);
  }
  if(modules&&!list.childElementCount)list.append(make("p","No matching mods."));
}
fetch("modules.json").then(r=>{if(!r.ok)throw Error();return r.json();}).then(data=>{modules=data.sort((a,b)=>a.name.localeCompare(b.name));policies();}).catch(()=>report("The mod list could not be loaded. Download your draft before reloading the editor."));
$("filter").oninput=policies;
$("source").onchange = $("view").onchange = () => { clientPreview.resetPage(); preview(); };
let customSlug = false;
$("slug").addEventListener("input", () => { customSlug = Boolean($("slug").value); });
$("name").addEventListener("input", () => {
  if (!customSlug) $("slug").value = $("name").value.toLowerCase().normalize("NFKD")
    .replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"_").replace(/^_+|_+$/g,"").slice(0,64);
});
document.addEventListener("input",event=>{
  report("");
  if (!event.target.closest("#identity, #modes, #art") || event.target.type === "file") return;
  $("source").value="draft";
  schedulePreview();
});
function addr(raw){
  const label="[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?",s=raw.trim().toLowerCase();
  const m=s.match(new RegExp("^("+label+"(?:\\."+label+")+)(?::([1-9][0-9]{0,4}))?$"));
  if(!m||m[1].length>253||Number(m[2]||25565)>65535)throw Error("Enter a valid Java server address"+(s ? ". Check "+s+"." : ", such as play.example.net."));
  return m[1]+(m[2]&&m[2]!=="25565"?":"+m[2]:"");
}
function title(text,max){
  const s=text.trim();
  if(!s||[...s].length>max||/[\p{C}\p{Zl}\p{Zp}]/u.test(s))throw Error("Enter a name between 1 and "+max+" characters long using printable characters.");
  return s;
}
function readField(input, parse) {
  try {
    return parse(input.value);
  } catch (error) {
    selectPanel(input.closest(".panel").id);
    const details = input.closest("details");
    if (details) details.open = true;
    input.focus();
    input.setCustomValidity(error.message);
    input.reportValidity();
    input.setCustomValidity("");
    throw error;
  }
}
function manifest(){
  const name = readField($("name"), value => title(value, 64));
  const direct = readField($("address"), addr);
  const id = readField($("slug"), value => {
    value = value.trim();
    if (!/^[a-z0-9][a-z0-9_-]{0,63}$/.test(value)) throw Error("Start the folder ID with a lowercase letter or number. Use up to 64 lowercase letters, numbers, hyphens or underscores.");
    return value;
  });
  const aliases = readField($("aliases"), value => {
    const extra = value.split(/\r?\n/).map(s => s.trim()).filter(Boolean).map(addr);
    const all = [direct, ...extra];
    if (all.length > 64 || new Set(all).size !== all.length) throw Error("List each address once, with up to 64 addresses in total.");
    return extra;
  });
  const hosts = [direct, ...aliases].map(s => s.split(":")[0]);
  const result = {server_name:id, nice_name:name, direct_ip:direct, tab_width:Number($("width").value)};
  if (aliases.length) result.aliases = aliases;
  const modes = [];
  for (const row of $("joins").children) {
    const [label, destination] = row.querySelectorAll("input");
    const name = readField(label, value => {
      const text = title(value, 32);
      if (modes.some(m => m.name.toLowerCase() === text.toLowerCase())) throw Error("Give each Quick Join a different name.");
      return text;
    });
    if (destination.value.trim().startsWith("/")) {
      const server = readField(destination, value => {
        const match = /^\/server ([a-z0-9][a-z0-9_-]{0,63})$/.exec(value.trim());
        if (!match) throw Error("Use /server followed by the proxy server ID.");
        if (modes.some(mode => mode.server === match[1])) throw Error("This proxy server already has a Quick Join.");
        return match[1];
      });
      modes.push({name, server});
      continue;
    }
    const address = readField(destination, value => {
      const dest = addr(value), host = dest.split(":")[0];
      if (!hosts.some(h => host === h || host.endsWith("." + h))) throw Error("Use a listed hostname or one of its subdomains.");
      if (modes.some(m => m.address === dest)) throw Error("Give each Quick Join a different address.");
      return dest;
    });
    modes.push({name,address});
  }
  if(modes.length)result.quick_joins=modes;
  if(denied.size){
    result.policy={version:1,modules:{},options:{}};
    for(const key of [...denied].sort())result.policy[key.includes(".")?"options":"modules"][key]=false;
  }
  return result;
}
// ZIP store is lossless. PNGs are already compressed.
const crcTable=Uint32Array.from({length:256},(_,i)=>{for(let j=0;j<8;j++)i=i&1?0xedb88320^(i>>>1):i>>>1;return i>>>0;});
function zip(files){
  const parts=[],central=[];let offset=0,centralSize=0;
  function header(length){const data=new Uint8Array(length),d=new DataView(data.buffer);return {data,u16:(i,v)=>d.setUint16(i,v,true),u32:(i,v)=>d.setUint32(i,v,true)};}
  for(const [path,data] of files){
    const name=encoder.encode(path);let crc=0xffffffff;
    for(const b of data)crc=crcTable[(crc^b)&255]^(crc>>>8);crc=(crc^0xffffffff)>>>0;
    const local=header(30),cd=header(46);local.u32(0,0x04034b50);local.u16(4,20);local.u16(12,33);local.u32(14,crc);local.u32(18,data.length);local.u32(22,data.length);local.u16(26,name.length);
    cd.u32(0,0x02014b50);cd.u16(4,20);cd.u16(6,20);cd.u16(14,33);cd.u32(16,crc);cd.u32(20,data.length);cd.u32(24,data.length);cd.u16(28,name.length);cd.u32(42,offset);
    parts.push(local.data,name,data);central.push(cd.data,name);offset+=30+name.length+data.length;centralSize+=46+name.length;
  }
  const end=header(22);end.u32(0,0x06054b50);end.u16(8,files.length);end.u16(10,files.length);end.u32(12,centralSize);end.u32(16,offset);
  return new Blob([...parts,...central,end.data],{type:"application/zip"});
}
$("export").onclick=()=>{
  try{
    if(drafts.size)throw Error("Wait for the artwork preview to finish loading.");
    const data=manifest(),base="minecraft_servers/"+data.server_name+"/";
    if (!$("consent").checked) {
      $("consent").focus();
      $("consent").reportValidity();
      return;
    }
    const files=[[base+"manifest.json",encoder.encode(JSON.stringify(data,null,2)+"\n")]];
    for(const [name,a] of art)files.push([base+name,a.data]);
    const url=URL.createObjectURL(zip(files)),a=make("a");a.href=url;a.download=data.server_name+".zip";a.click();
    setTimeout(()=>URL.revokeObjectURL(url),30000);report("Your ZIP is ready. Extract it into your fork, then open a pull request.");
  }catch(e){report(e.message);}
};
preview();
