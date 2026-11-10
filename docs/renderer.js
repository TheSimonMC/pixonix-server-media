"use strict";
// Coordinates are Minecraft GUI pixels. A higher resolution backing store preserves the bitmap font.
const clientPreview = (() => {
  const canvas = document.getElementById("scene");
  const ctx = canvas.getContext("2d");
  const width = 368, height = 212, center = width / 2;
  canvas.width = width * 3;
  canvas.height = height * 3;
  ctx.scale(3, 3);
  ctx.imageSmoothingEnabled = false;
  const cache = new Map();
  let last, page = 0;
  function image(path) {
    if (!cache.has(path)) {
      const img = new Image();
      cache.set(path, img);
      img.onload = () => last && preview();
      img.src = path;
    }
    const img = cache.get(path);
    return img.complete && img.naturalWidth ? img : null;
  }
  document.fonts.load("8px Monocraft").then(() => last && render(last));
  function rect(x,y,w,h,color) {
    ctx.fillStyle = color;
    ctx.fillRect(x,y,w,h);
  }
  function measure(text) {
    ctx.font = "8px Monocraft, monospace";
    return Math.ceil(ctx.measureText(text).width);
  }
  function line(text,x,y,color = "#f6f3fc",align = "left",max = Infinity) {
    let output = text;
    while (output && measure(output)>max) output = Array.from(output).slice(0,-1).join("");
    const length = measure(output);
    if (align === "center") x -= Math.floor(length/2);
    if (align === "right") x -= length;
    ctx.textBaseline = "top";
    ctx.fillStyle = "#17131a";
    ctx.fillText(output,x+1,y+1);
    ctx.fillStyle = color;
    ctx.fillText(output,x,y);
  }
  function box(x,y,w,h,fill,edge = "#463c52") {
    rect(x,y,w,h,"#100d15");rect(x+1,y+1,w-2,h-2,edge);rect(x+2,y+2,w-4,h-4,fill);
  }
  function button(x,y,w,title,active = false,enabled = true) {
    box(x,y,w,20,active ? "#7600cc" : "#322b3f",active ? "#b47aec" : undefined);
    line(title,x+Math.floor(w/2),y+6,enabled ? "#faf6ff" : "#a39dab","center",w-6);
  }
  // ServerMediaLayout.crop: row backgrounds start one quarter down; banners are centred.
  function cover(img,x,y,w,h,list = false) {
    if (!img) return;
    const scale = Math.max(w/img.naturalWidth,h/img.naturalHeight);
    const sw = Math.max(1,Math.min(img.naturalWidth,Math.round(w/scale)));
    const sh = Math.max(1,Math.min(img.naturalHeight,Math.round(h/scale)));
    const top = list ? Math.min(img.naturalHeight*.25,img.naturalHeight-sh) : (img.naturalHeight-sh)/2;
    ctx.drawImage(img,(img.naturalWidth-sw)/2,top,sw,sh,x,y,w,h);
  }
  function fit(img,x,y,w,h) {
    if (!img) return;
    const scale = Math.min(w/img.naturalWidth,h/img.naturalHeight);
    const iw = Math.max(1,Math.round(img.naturalWidth*scale)), ih = Math.max(1,Math.round(img.naturalHeight*scale));
    ctx.drawImage(img,x+Math.floor((w-iw)/2),y+Math.floor((h-ih)/2),iw,ih);
  }
  function terrain() {
    rect(0,0,width,height,"#30233e");
    cover(image("assets/world.webp"),0,0,width,height);
    rect(0,0,width,height,"rgba(26,14,36,.43)");
  }
  function servers(data) {
    terrain();
    box(width-138,6,132,20,"#322b3f"); fit(image("assets/person.png"),width-135,8,16,16);
    line("Player",width-115,12); line("▾",width-16,12);
    box(width-162,6,20,20,"#322b3f"); fit(image("assets/controller.png"),width-160,8,16,16);
    button(center-122,44,120,"My servers"); button(center+2,44,120,"Discover",true);
    const panel = Math.max(100,Math.min(320,width-24)), left = (width-panel)/2;
    const x = left+6, y = 76, w = panel-24;
    box(left,72,panel,height-64-72,"#221d2c");
    box(x,y,w,48,"#221d2c");
    const cavern = data.id === "pitschonix";
    const bg = cavern ? image("assets/cavern.webp") : data.art.background;
    cover(bg || image("assets/fallback.webp"),x+2,y+2,w-4,44,!!bg && !cavern);
    rect(x+2,y+2,w-4,44,bg ? "rgba(0,0,0,.314)" : "rgba(0,0,0,.22)");
    if (data.art.icon) fit(data.art.icon,x,y+2,32,32);
    else fit(image("assets/globe.png"),x+8,y+9,18,18);
    const count = "24 / 100";
    line(data.name,x+35,y+3,"#ffffff","left",w-47-measure(count));
    line(count,x+w-5,y+3,"#beb5c9","right");
    line("Welcome to " + data.name,x+35,y+14,"#dfc7ff","left",w-39);
    line(data.address,x+35,y+23,"#d6d0dc","left",w-39);
    button(center-154,height-52,96,"Join Server");button(center-54,height-52,96,"Quick Join",false,data.joins.length>0);
    button(center+46,height-52,108,"Add to my servers");button(center-154,height-28,152,"Refresh");button(center+2,height-28,152,"Back");
    box(center-178,height-28,20,20,"#322b3f");fit(image("assets/friends.png"),center-176,height-26,16,16);
    return "Discover layout with a sample online count and message of the day.";
  }
  function tab(data) {
    terrain();
    const names = ["Alex","Birch","Charlie","Juniper","Robin","Steve"];
    const w = Math.min(data.bannerWidth,width-40);
    const h = Math.min(Math.floor(w/5),height-Math.min(names.length,20)*9-36);
    const banner = data.art.banner && h>=16;
    if (banner) cover(data.art.banner,Math.floor((width-w)/2),8,w,h);
    const y = 10+(banner ? h+6 : 0);
    rect(center-46,y-1,92,9*names.length+2,"rgba(0,0,0,.55)");
    names.forEach((name,i) => {
      const row = y+9*i;
      rect(center-44,row,88,8,"rgba(120,120,120,.3)");
      line(name,center-40,row);
      for (let j=0;j<4;j++) rect(center+33+j*2,row+6-j,1,j+1,"#73bf61");
    });
    return "Six sample players. The banner is cropped to the width set under Artwork.";
  }
  function quick(data) {
    terrain();line("Quick Join Ã‚Â· "+data.name,center,18,"#ffffff","center",width-12);
    const count = Math.max(1,Math.floor((height-100)/24));
    const lastPage = Math.max(0,Math.ceil(data.joins.length/count)-1);
    page = Math.min(page,lastPage);
    data.joins.slice(page*count,(page+1)*count).forEach((name,i) => button(center-102,40+i*24,204,name));
    if (lastPage) {
      button(center-102,height-50,100,"Previous",false,page>0);button(center+2,height-50,100,"Next",false,page<lastPage);
      document.getElementById("pages").hidden = false;
      document.getElementById("prev").disabled = !page;
      document.getElementById("next").disabled = page === lastPage;
    }
    button(center-102,height-26,204,"Back");
    return data.joins.length ? "Quick Join destinations appear in the order entered." : "Add a mode under Quick Joins to enable this menu in the client.";
  }
  function render(data) {
    last = data;
    document.getElementById("pages").hidden = true;
    let caption;
    if (data.view === "Server list") caption = servers(data);
    else if (data.view === "TAB list") caption = tab(data);
    else if (data.view === "Quick Joins") caption = quick(data);
    else {
      rect(0,0,width,height,"#19151e");
      if (data.art.logo) fit(data.art.logo,24,20,width-48,height-40);
      else line("No logo selected",center,height/2-4,"#c8bed1","center");
      caption = "Original logo proportions on a dark surface.";
    }
    document.getElementById("caption").textContent = caption;
    canvas.setAttribute("aria-label",data.view+" preview for "+data.name+". "+caption);
  }
  document.getElementById("prev").onclick = () => {page=Math.max(0,page-1);render(last);};
  document.getElementById("next").onclick = () => {page++;render(last);};
  return {render,image,resetPage(){page=0;}};
})();
