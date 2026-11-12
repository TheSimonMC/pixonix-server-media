"use strict";
const $ = id => document.getElementById(id);
const make = (tag,text) => Object.assign(document.createElement(tag),{textContent:text??""});
const art = new Map(), drafts = new Map(), denied = new Set();
const kinds = {icon:"Server icon", background:"Server list background", banner:"Player list banner"};
const filenames = ["icon.png","background.png","banner.png","icon@2x.png","background@2x.png"];
const encoder = new TextEncoder();
let modules;
let currentView = "Server list";
function selectView(view) {
  currentView = view;
  for (const button of $("views").children) {
    button.setAttribute("aria-pressed", String(button.dataset.view === view));
  }
  clientPreview.resetPage();
  schedulePreview();
}
for (const button of $("views").children) button.onclick = () => selectView(button.dataset.view);
const report = msg => $("status").textContent=msg;
function selectPanel(id){
  report("");
  for(const panel of document.querySelectorAll(".panel"))panel.hidden=panel.id!==id;
  for(const b of $("sections").children)b.setAttribute("aria-pressed",String(b.dataset.panel===id));
}
for(const b of $("sections").children)b.onclick=()=>selectPanel(b.dataset.panel);
function asset(kind){return art.get(kind+"@2x.png")??art.get(kind+".png");}
function reveal(input) {
  const panel = input.closest(".panel");
  if (panel) selectPanel(panel.id);
  const details = input.closest("details");
  if (details) details.open = true;
  input.focus();
}

function missingFields() {
  const missing = [];
  for (const marker of document.querySelectorAll("[data-needed]")) {
    const group = marker.closest("label, fieldset");
    const input = group.querySelector("input");
    let filled;
    if (group.tagName === "FIELDSET") filled = Boolean(group.querySelector(":checked"));
    else if (marker.dataset.art) filled = Boolean(asset(marker.dataset.art));
    else if (input.type === "checkbox") filled = input.checked;
    else filled = Boolean(input.value.trim());
    marker.classList.toggle("needs-value", !filled);
    if (!filled) missing.push({name:marker.dataset.needed, input});
  }
  const names = [...new Set(missing.map(field => field.name))];
  const message = names.length ? "Still needed: " + names.join(", ") + "." : "";
  if ($("missing").textContent !== message) $("missing").textContent = message;
  return missing;
}

function addAddress() {
  const list = $("aliases"), row = make("div"), label = make("label");
  const title = make("span", "Alternate address"), input = make("input"), remove = make("button", "Remove");
  title.dataset.needed = "Alternate address";
  input.required = true;
  input.placeholder = "join.example.net";
  input.spellcheck = false;
  remove.setAttribute("aria-label", "Remove alternate address");
  remove.onclick = () => {
    row.remove();
    $("add-address").disabled = false;
    $("add-address").focus();
    missingFields();
  };
  row.className = "alias";
  label.append(title, input);
  row.append(label, remove);
  list.append(row);
  $("add-address").disabled = list.childElementCount >= 63;
  input.focus();
  missingFields();
}
$("add-address").onclick = addAddress;

async function loadServerFields() {
  const response = await fetch("server-fields.json");
  if (!response.ok) throw Error();
  const fields = await response.json();
  $("categories").replaceChildren();
  $("socials").replaceChildren();
  for (const [id, name] of Object.entries(fields.categories)) {
    const label = make("label"), input = make("input");
    input.type = "checkbox";
    input.value = id;
    label.append(input, make("span", name));
    $("categories").append(label);
  }
  for (const [id, [name, example]] of Object.entries(fields.socials)) {
    const label = make("label", name), input = make("input");
    input.type = "url";
    input.dataset.platform = id;
    input.maxLength = 2048;
    input.placeholder = example;
    input.spellcheck = false;
    label.append(input);
    $("socials").append(label);
  }
}
function refreshFields() {
  loadServerFields().catch(() => {
    const retry = make("button", "Retry");
    retry.onclick = refreshFields;
    $("categories").replaceChildren(make("span", "Categories could not be loaded."), retry);
  });
}
refreshFields();
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
  images.logo = example ? clientPreview.image("minecraft_servers/pitschonix/logo@2x.png") : images.icon;
  clientPreview.render({
    name: example ? "Pitschonix.eu" : $("name").value.trim() || "Your network",
    address: example ? "pitschonix.eu" : $("address").value.trim() || "play.example.net",
    example,
    bannerWidth: example ? 128 : Number($("width").value),
    joins: example ? ["XAttack", "Lobby", "FFA", "Duels Legacy", "Duels Modern", "SkyWars Legacy", "SkyWars Modern", "BedWars"] : ["address","server"].flatMap(type =>
      [...$("joins").children].filter(row => row.querySelector("select").value === type)
        .map(row => row.querySelector("input").value.trim() || "New mode")),
    view: currentView, art: images
  });
  $("folder").textContent="minecraft_servers/"+($("slug").value.trim()||"…");
  $("fileCount").textContent=(art.size+1)+" file"+(art.size?"s":"");
  $("widthValue").textContent=$("width").value+" px";
}
function validFile(img){
  if(!img.naturalWidth || Math.max(img.naturalWidth,img.naturalHeight)>4096 || img.naturalWidth*img.naturalHeight>8388608)throw Error("Choose an image with no more than 8,388,608 pixels and no side longer than 4,096 pixels.");
}
for(const filename of filenames){
  const kind = filename.split(/[@.]/)[0], hires = filename.includes("@");
  const row=make("div"),label=make("label"), title=make("span",kinds[kind]+(hires?" (2×)":"")), input=make("input"),clear=make("button","Clear");
  if (!hires && kind !== "banner") {
    title.dataset.art = kind;
    title.dataset.needed = kinds[kind];
  }
  label.append(title);
  if (filename === "icon.png") label.append(make("small","Also used as the server logo."));
  const picker=make("span"), action=make("span","Choose PNG"), name=make("span","or drop it here");
  picker.className="picker"; name.className="filename";
  input.type="file";input.accept="image/png";input.setAttribute("aria-label","Choose PNG for "+title.textContent);
  const feedback=make("small");feedback.id="error-"+filename;feedback.className="file-error";
  feedback.setAttribute("role","status");input.setAttribute("aria-describedby",feedback.id);
  picker.append(input,action,name);label.append(picker,feedback);row.className="file";row.append(label,clear);$(hires ? "hires" : kind === "banner" ? "banner-art" : "assets").append(row);clear.hidden=true;
  const reset=()=>{feedback.textContent="";drafts.delete(filename);if(art.has(filename))URL.revokeObjectURL(art.get(filename).url);art.delete(filename);input.value="";name.textContent="or drop it here";clear.hidden=true;missingFields();preview();};
  clear.onclick=reset;
  async function loadFile(file) {
    if(!file)return;
    feedback.textContent="";
    const token=Symbol();drafts.set(filename,token);let url;
    try{
      if(file.size>16777216)throw Error("Choose a PNG no larger than 16 MiB.");
      const data=new Uint8Array(await file.arrayBuffer().catch(()=>{throw Error("This file could not be read. Choose it again.");}));
      if([137,80,78,71,13,10,26,10].some((v,i)=>data[i]!==v))throw Error("Select a PNG file.");
      const bytes=new DataView(data.buffer);
      if (data.length < 33) throw Error("This PNG is incomplete. Choose another file.");
      const width = bytes.getUint32(16), height = bytes.getUint32(20);
      if (!width || !height || Math.max(width, height) > 4096 || width * height > 8388608)
        throw Error("Choose an image with no more than 8,388,608 pixels and no side longer than 4,096 pixels.");
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
      selectView(kind==="banner"?"TAB list":"Server list");
    }catch(e){if(drafts.get(filename)===token){input.value="";feedback.textContent=e.message;}}
    finally{if(url)URL.revokeObjectURL(url);if(drafts.get(filename)===token)drafts.delete(filename);missingFields();preview();}
  }
  input.onchange = () => loadFile(input.files[0]);
  picker.ondragover = event => {
    if (!event.dataTransfer.types.includes("Files")) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    picker.classList.add("dragging");
  };
  picker.ondragleave = event => {
    if (!picker.contains(event.relatedTarget)) picker.classList.remove("dragging");
  };
  picker.ondrop = event => {
    event.preventDefault();
    picker.classList.remove("dragging");
    const files = event.dataTransfer.files;
    if (files.length === 1) loadFile(files[0]);
    else feedback.textContent = "Drop one PNG at a time.";
  };
}
for (const type of ["dragover","drop"]) {
  document.addEventListener(type, event => {
    if (event.dataTransfer.types.includes("Files")) event.preventDefault();
  });
}
$("add").onclick=()=>{
  if($("joins").children.length>=12)return;
  const row=make("div");row.className="mode";
  const nameLabel = make("label"), nameTitle = make("span","Mode"), name = make("input");
  nameTitle.dataset.needed = "Quick Join name";
  name.required = true; name.maxLength = 32; name.placeholder = "FFA";
  nameLabel.append(nameTitle,name);
  const typeLabel = make("label","Connection"), type = make("select");
  type.append(new Option("Server address","address"), new Option("Proxy command (/server)","server"));
  typeLabel.append(type);
  const targetLabel = make("label"), targetTitle = make("span"), target = make("input");
  targetTitle.dataset.needed = "Quick Join destination";
  target.required = true; target.maxLength = 260; target.spellcheck = false;
  targetLabel.append(targetTitle,target);
  const values = {address:"",server:""};
  function updateType() {
    const proxy = type.value === "server";
    targetTitle.textContent = proxy ? "Proxy server ID" : "Server address";
    target.placeholder = proxy ? "ffa-01" : "ffa.example.net";
    target.value = values[type.value];
    missingFields(); schedulePreview();
  }
  target.oninput = () => { values[type.value] = target.value; };
  type.onchange = updateType;
  row.append(nameLabel,typeLabel,targetLabel);
  updateType();
  const remove=make("button","Remove");remove.onclick=()=>{row.remove();$("add").disabled=false;$("add").focus();missingFields();preview();};row.append(remove);$("joins").append(row);missingFields();
  $("add").disabled=$("joins").children.length===12;$("source").value="draft";selectView("Server list");name.focus();preview();
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
$("source").onchange = () => { clientPreview.resetPage(); preview(); };
let customSlug = false;
$("slug").addEventListener("input", () => { customSlug = Boolean($("slug").value); });
$("name").addEventListener("input", () => {
  if (!customSlug) $("slug").value = $("name").value.toLowerCase().normalize("NFKD")
    .replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"_").replace(/^_+|_+$/g,"").slice(0,64);
});
document.addEventListener("input",event=>{
  report("");
  missingFields();
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
function socialLink(platform, value) {
  const allowed = platform === "teamspeak" ? ["https:", "http:", "ts3:"] : ["https:", "http:"];
  let url;
  try { url = new URL(value); } catch { /* Report the expected format below. */ }
  if (!url || !allowed.includes(url.protocol) || !url.hostname || url.username || url.password ||
      !/^[a-z][a-z\d+.-]*:\/\/[^/?#@]+(?:[/?#]|$)/i.test(value) ||
      /[\s\\\p{C}]/u.test(value) || url.href.length > 2048 || url.port === "0") {
    throw Error(platform === "teamspeak" ? "Enter a full TeamSpeak link, such as ts3://ts.example.net." : "Enter a full link starting with https:// or http://.");
  }
  return url.href;
}
function readField(input, parse) {
  try {
    return parse(input.value);
  } catch (error) {
    reveal(input);
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
  const addresses = new Set([direct]);
  const aliases = [...$("aliases").querySelectorAll("input")].map(input => readField(input, value => {
    const alias = addr(value);
    if (addresses.has(alias)) throw Error("This address is already listed.");
    addresses.add(alias);
    return alias;
  }));
  const hosts = [direct, ...aliases].map(s => s.split(":")[0]);
  const result = {server_name:id, nice_name:name, direct_ip:direct, tab_width:Number($("width").value)};
  if (aliases.length) result.aliases = aliases;
  result.categories = [...$("categories").querySelectorAll(":checked")].map(input => input.value);
  const socials = {};
  for (const input of $("socials").querySelectorAll("input")) {
    if (!input.value.trim()) continue;
    const platform = input.dataset.platform;
    socials[platform] = readField(input, value => socialLink(platform, value.trim()));
  }
  if (Object.keys(socials).length) result.socials = socials;
  const modes = [];
  for (const row of $("joins").children) {
    const [label, destination] = row.querySelectorAll("input");
    const name = readField(label, value => {
      const text = title(value, 32);
      if (modes.some(m => m.name.toLowerCase() === text.toLowerCase())) throw Error("Give each Quick Join a different name.");
      return text;
    });
    if (row.querySelector("select").value === "server") {
      const server = readField(destination, value => {
        const match = /^(?:\/server +)?([a-z0-9][a-z0-9_-]{0,63})$/.exec(value.trim());
        if (!match) throw Error("Enter a proxy server ID such as lobby-01.");
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
    const [first] = missingFields();
    if (first) {
      if (first.input) reveal(first.input);
      throw Error("Complete the required field: " + first.name + ".");
    }
    const data=manifest(),base="minecraft_servers/"+data.server_name+"/";
    const files=[[base+"manifest.json",encoder.encode(JSON.stringify(data,null,2)+"\n")]];
    for(const [name,a] of art)files.push([base+name,a.data]);
    const url=URL.createObjectURL(zip(files)),a=make("a");a.href=url;a.download=data.server_name+".zip";a.click();
    setTimeout(()=>URL.revokeObjectURL(url),30000);report("Your ZIP is ready. Extract it into your fork, then open a pull request.");
  }catch(e){report(e.message);}
};
missingFields();
preview();
