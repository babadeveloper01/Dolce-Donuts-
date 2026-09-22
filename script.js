// Dolce Donuts POS v5.0 - localStorage Only, Thermal Print Fixed
// ============================================================

let credentials = { adminUser: "Admin", adminPass: "112233", staff: [] };
let products = [], cart = [], salesHistory = [], cakeOrders = [];
let storeCategories = { "Donuts": [], "Beverages": [], "Cakes": [] };
let dangerUnlocked = false;
let currentUser = { name: "", isAdmin: false };
let taxEnabled = true;
const TAX_RATE = 0.16;
const DANGER_PASS = "babadev786";
const NTN = "J797098";
const DEV_NAME = "Baba-Developer";
const DEV_PHONE = "03477437517";

// ====== LOCALSTORAGE ======
function saveData() {
    try {
        localStorage.setItem("dd_credentials", JSON.stringify(credentials));
        localStorage.setItem("dd_products", JSON.stringify(products));
        localStorage.setItem("dd_salesHistory", JSON.stringify(salesHistory));
        localStorage.setItem("dd_cakeOrders", JSON.stringify(cakeOrders));
        localStorage.setItem("dd_categories", JSON.stringify(storeCategories));
        localStorage.setItem("dd_taxEnabled", taxEnabled ? "1" : "0");
    } catch(e) { console.warn("Save error:", e); }
}
function loadData() {
    try {
        let cr=localStorage.getItem("dd_credentials"),pr=localStorage.getItem("dd_products"),
            sh=localStorage.getItem("dd_salesHistory"),co=localStorage.getItem("dd_cakeOrders"),
            ca=localStorage.getItem("dd_categories"),tx=localStorage.getItem("dd_taxEnabled");
        if(cr) credentials=JSON.parse(cr);
        if(pr) products=JSON.parse(pr);
        if(sh){ salesHistory=JSON.parse(sh); salesHistory.forEach(s=>{s.dateObj=new Date(s.dateObj);}); }
        if(co) cakeOrders=JSON.parse(co);
        if(ca) storeCategories=JSON.parse(ca);
        if(tx!==null) taxEnabled=(tx==="1");
    } catch(e) { console.warn("Load error:", e); }
}

// ====== LOGIN ======
function handleLogin() {
    let u=document.getElementById("login-user").value.trim();
    let p=document.getElementById("login-pass").value;
    loadData();
    let isAdmin=(u===credentials.adminUser && p===credentials.adminPass);
    let isStaff=credentials.staff.some(s=>s.user===u && s.pass===p);
    if(isAdmin||isStaff) {
        currentUser={name:u,isAdmin:isAdmin};
        document.getElementById("login-screen").style.display="none";
        document.getElementById("main-app").style.display="flex";
        document.getElementById("logged-user-name").innerText=u+(isAdmin?"":" (Staff)");
        let av=document.getElementById("user-avatar-letter");
        if(av) av.innerText=u.charAt(0).toUpperCase();
        setupRoleAccess();
        initApp();
    } else { alert("Invalid Username or Password!\nDefault: Admin / 112233"); }
}
function setupRoleAccess() {
    document.querySelectorAll(".nav-links li").forEach(li=>{
        if(!currentUser.isAdmin && (li.innerText.includes("Inventory")||li.innerText.includes("Settings")))
            li.style.display="none";
        else li.style.display="";
    });
}
function logout() {
    dangerUnlocked=false; currentUser={name:"",isAdmin:false};
    document.getElementById("main-app").style.display="none";
    document.getElementById("login-screen").style.display="flex";
    document.getElementById("login-user").value="";
    document.getElementById("login-pass").value="";
}
function initApp() {
    renderCategoryButtons(); renderProducts(products); updateClock();
    renderCakeOrders(); renderInventoryCategoryDropdowns(); renderInventory();
    renderSettingsCategoriesList(); renderStaffList(); updateDashboard();
    renderReportsTable(); renderProductDailyReport(); renderMonthlyReport();
    updateTaxToggleUI();
    setInterval(updateClock,1000);
    document.addEventListener("keydown",handleKeyboard);
}
function handleKeyboard(e) {
    if(e.key==="F1"){e.preventDefault();document.getElementById("product-search").focus();}
    if(e.key==="F2"){e.preventDefault();processCheckout("Print");}
    if(e.key==="F3"){e.preventDefault();processCheckout("WhatsApp");}
    if(e.key==="F8"){e.preventDefault();document.getElementById("cash-given-input").focus();}
}
function updateClock(){let el=document.getElementById("live-clock");if(el)el.innerText=new Date().toLocaleTimeString("en-PK",{hour12:true});}

// ====== TAX TOGGLE ======
function toggleTaxSetting() {
    taxEnabled=document.getElementById("tax-toggle-input").checked;
    updateTaxToggleUI(); saveData();
    alert(taxEnabled?"GST 16% ON - prices par tax add hoga.":"GST 16% OFF - prices as-is save hongi.");
}
function updateTaxToggleUI() {
    let tog=document.getElementById("tax-toggle-input");
    let lbl=document.getElementById("tax-toggle-label");
    if(tog) tog.checked=taxEnabled;
    if(lbl){lbl.innerText=taxEnabled?"GST ON":"GST OFF";lbl.style.color=taxEnabled?"#22c55e":"#ef4444";}
}

// ====== CATEGORIES ======
function renderCategoryButtons(){
    const c=document.getElementById("category-container");if(!c)return;
    let html=`<button class="cat-btn active" onclick="selectMainCategory('All',event)">All Items</button>`;
    Object.keys(storeCategories).forEach(cat=>{html+=`<button class="cat-btn" onclick="selectMainCategory('${cat}',event)">${cat}</button>`;});
    c.innerHTML=html;
}
function selectMainCategory(cat,event){
    document.querySelectorAll(".cat-btn").forEach(b=>b.classList.remove("active"));
    if(event)event.currentTarget.classList.add("active");
    renderProducts(cat==="All"?products:products.filter(p=>p.category===cat));
}
function filterProducts(){
    let q=document.getElementById("product-search").value.toLowerCase().trim();
    if(!q){renderProducts(products);return;}
    renderProducts(products.filter(p=>
        p.name.toLowerCase().includes(q)||(p.code&&p.code.toLowerCase().includes(q))||
        (p.category&&p.category.toLowerCase().includes(q))||(p.modelColor&&p.modelColor.toLowerCase().includes(q))
    ));
}
function renderProducts(items){
    const g=document.getElementById("product-grid");if(!g)return;g.innerHTML="";
    if(!items.length){g.innerHTML=`<div style="grid-column:1/-1;text-align:center;color:#64748b;padding:22px;font-size:13px;">No products found.</div>`;return;}
    items.forEach(item=>{
        g.innerHTML+=`<div class="product-card" onclick="addToCart(${item.id})">
            <span style="font-size:9px;background:rgba(245,166,35,.15);color:#f5a623;border:1px solid rgba(245,166,35,.25);padding:1px 5px;border-radius:4px;float:right;font-weight:700;">${item.code||"N/A"}</span>
            <div style="clear:both;padding-top:4px;">
                <div style="font-size:12.5px;font-weight:700;color:#f1f5f9;margin-bottom:3px;">${item.name}</div>
                <div style="font-size:10.5px;color:#64748b;margin-bottom:6px;">${item.modelColor||"Standard"}</div>
                <div style="display:inline-block;background:rgba(34,197,94,.15);color:#22c55e;border:1px solid rgba(34,197,94,.25);border-radius:5px;padding:2px 8px;font-size:12px;font-weight:800;">Rs. ${item.price}</div>
            </div></div>`;
    });
}

// ====== CART ======
function addToCart(productId){
    let product=products.find(p=>p.id===productId);if(!product)return;
    let existing=cart.find(i=>i.id===productId);
    if(existing)existing.qty+=1; else cart.push({...product,qty:1});
    updateCartUI();
}
function updateCartUI(){
    const tb=document.getElementById("cart-items-table"),cc=document.getElementById("cart-count");
    if(!tb)return;tb.innerHTML="";
    let totalQty=cart.reduce((s,i)=>s+i.qty,0);
    if(cc)cc.innerText=totalQty;
    if(!cart.length){
        tb.innerHTML=`<tr><td colspan="6" style="text-align:center;color:#64748b;padding:28px;font-size:13px;">Cart khali hai. Product select karein.</td></tr>`;
        ["cart-gross","cart-net","cash-baqaya"].forEach(id=>{let el=document.getElementById(id);if(el)el.innerText="Rs. 0";});
        return;
    }
    let gross=0;
    cart.forEach((item,idx)=>{
        let t=item.price*item.qty;gross+=t;
        tb.innerHTML+=`<tr style="border-bottom:1px solid rgba(255,255,255,.06);">
            <td style="padding:10px 12px;font-weight:700;color:#f1f5f9;">${item.name}</td>
            <td style="padding:10px 12px;color:#64748b;font-size:11.5px;">${item.modelColor||"Standard"}</td>
            <td style="padding:10px 12px;">
                <div style="display:inline-flex;align-items:center;gap:4px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:9px;padding:3px 5px;">
                    <button onclick="changeQty(${idx},-1)" style="width:24px;height:24px;cursor:pointer;background:rgba(239,68,68,.15);border:1px solid rgba(239,68,68,.3);border-radius:5px;color:#ef4444;font-weight:900;font-size:16px;line-height:1;">&#8722;</button>
                    <span style="min-width:26px;text-align:center;font-weight:800;color:#f5a623;font-size:14px;">${item.qty}</span>
                    <button onclick="changeQty(${idx},1)" style="width:24px;height:24px;cursor:pointer;background:rgba(34,197,94,.15);border:1px solid rgba(34,197,94,.3);border-radius:5px;color:#22c55e;font-weight:900;font-size:16px;line-height:1;">+</button>
                </div>
            </td>
            <td style="padding:10px 12px;color:#94a3b8;font-size:12.5px;">Rs. ${item.price}</td>
            <td style="padding:10px 12px;font-weight:800;color:#22c55e;font-size:14px;">Rs. ${t}</td>
            <td style="padding:10px 12px;"><button onclick="removeFromCart(${idx})" style="background:rgba(239,68,68,.12);color:#ef4444;border:1px solid rgba(239,68,68,.25);padding:5px 10px;border-radius:6px;cursor:pointer;font-size:12px;"><i class="fa-solid fa-trash"></i></button></td>
        </tr>`;
    });
    let disc=parseFloat(document.getElementById("cart-discount").value)||0;
    let net=gross-disc;
    document.getElementById("cart-gross").innerText=`Rs. ${gross}`;
    document.getElementById("cart-net").innerText=`Rs. ${net}`;
    calculateBaqaya();
}
function changeQty(i,c){cart[i].qty+=c;if(cart[i].qty<=0)cart.splice(i,1);updateCartUI();}
function removeFromCart(i){cart.splice(i,1);updateCartUI();}
function calculateCart(){updateCartUI();}
function calculateBaqaya(){
    let gross=cart.reduce((s,i)=>s+(i.price*i.qty),0);
    let disc=parseFloat(document.getElementById("cart-discount").value)||0;
    let net=gross-disc;
    let cash=parseFloat(document.getElementById("cash-given-input").value)||0;
    let el=document.getElementById("cash-baqaya");if(el)el.innerText=`Rs. ${Math.max(0,cash-net)}`;
}
function setCashExact(){
    let g=cart.reduce((s,i)=>s+(i.price*i.qty),0);
    let d=parseFloat(document.getElementById("cart-discount").value)||0;
    document.getElementById("cash-given-input").value=g-d;calculateBaqaya();
}
function addCashAmount(a){
    let c=parseFloat(document.getElementById("cash-given-input").value)||0;
    document.getElementById("cash-given-input").value=c+a;calculateBaqaya();
}

// ====== CHECKOUT ======
function processCheckout(actionType) {
    if(!cart.length){alert("Cart is empty!");return;}
    let customer=document.getElementById("customer-name").value||"Walk-in Customer";
    let mobile=document.getElementById("customer-mobile").value||"N/A";
    let method=document.getElementById("payment-method-select").value;
    let gross=cart.reduce((s,i)=>s+(i.price*i.qty),0);
    let discount=parseFloat(document.getElementById("cart-discount").value)||0;
    let discPct=gross>0?((discount/gross)*100).toFixed(2):"0.00";
    let net=gross-discount;
    let cashGiven=parseFloat(document.getElementById("cash-given-input").value)||0;
    let baqaya=Math.max(0,cashGiven-net);
    let orderDate=new Date();
    let invoiceId="D"+String(Date.now()).slice(-8);
    let saleRecord={id:invoiceId,customer:`${customer} (${mobile})`,mobile,net,method,
        dateObj:orderDate,dateStr:orderDate.toISOString().split("T")[0],
        monthStr:orderDate.toISOString().slice(0,7),items:[...cart]};
    salesHistory.unshift(saleRecord);
    saveData();
    let slipData={invoiceId,customer,mobile,method,gross,discount,discPct,net,cashGiven,baqaya,orderDate,items:[...cart]};
    if(actionType==="Print") {
        showSlipModal(slipData);
    } else {
        let txt=`*Dolce Donuts - Mall Of Sargodha*\n*Invoice: ${invoiceId}*\n${orderDate.toLocaleString()}\n*Customer:* ${customer}\n*Mobile:* ${mobile}\n\n`;
        cart.forEach(i=>{txt+=`- ${i.name} x${i.qty} = Rs. ${i.price*i.qty}\n`;});
        txt+=`\n*Gross: Rs. ${gross}*\n*Discount: Rs. ${discount}*\n*NET TOTAL: Rs. ${net}*\n*Payment: ${method}*\n\n_Shukriya! Dolce Donuts._`;
        window.open(`https://wa.me/${mobile.replace(/[^0-9]/g,"")}?text=${encodeURIComponent(txt)}`,"_blank");
    }
    cart=[];
    ["customer-name","customer-mobile"].forEach(id=>{let el=document.getElementById(id);if(el)el.value="";});
    document.getElementById("cart-discount").value=0;
    document.getElementById("cash-given-input").value=0;
    updateCartUI();updateDashboard();renderReportsTable();renderProductDailyReport();renderMonthlyReport();
}

// ====== THERMAL SLIP - FIXED PRINT (New Window method) ======
function buildSlipHTML(d) {
    let now=d.orderDate;
    let dateStr=String(now.getDate()).padStart(2,"0")+"/"+String(now.getMonth()+1).padStart(2,"0")+"/"+now.getFullYear();
    let timeStr=now.toLocaleTimeString("en-PK",{hour12:true,hour:"2-digit",minute:"2-digit"});
    let methodMap={Cash:"CASH",Card:"CARD",Digital:"DIGITAL PAY",Credit:"UDHAAR"};
    let sNo=1;
    let rows=d.items.map(item=>`
        <tr>
            <td>${sNo++}</td>
            <td>${item.name}${item.modelColor&&item.modelColor!=="Standard"?" ("+item.modelColor+")":""}</td>
            <td style="text-align:center">${item.qty}.00</td>
            <td style="text-align:right">${item.price}.00</td>
            <td style="text-align:right;font-weight:bold">${item.price*item.qty}</td>
        </tr>`).join("");

    return `
    <div style="text-align:center;margin-bottom:8px;">
        <div style="font-size:22px;font-weight:900;letter-spacing:1px;">Dolce Donuts</div>
        <div style="font-size:12px;">Mall Of Sargodha</div>
        <div style="font-size:12px;">+92 322 7704444</div>
    </div>
    <div style="border-top:1px dashed #000;margin:6px 0;"></div>
    <div style="text-align:center;margin:6px 0;">
        <span style="border:2px solid #000;padding:4px 16px;font-size:14px;font-weight:900;letter-spacing:2px;">SALE INVOICE</span>
    </div>
    <div style="border-top:1px dashed #000;margin:6px 0;"></div>
    <div style="display:flex;justify-content:space-between;margin:4px 0;"><span style="font-weight:bold;">Payment Mode:</span><span style="font-weight:bold;">${methodMap[d.method]||d.method}</span></div>
    <div style="border-top:1px solid #000;margin:5px 0;"></div>
    <div style="display:flex;justify-content:space-between;margin:4px 0;"><span style="font-weight:bold;">SALE INVOICE NO.</span><span>${d.invoiceId}</span></div>
    <div style="display:flex;justify-content:space-between;margin:4px 0;"><span style="font-weight:bold;">DATE: ${dateStr}</span><span>TIME: ${timeStr}</span></div>
    <div style="display:flex;justify-content:space-between;margin:4px 0;"><span>Customer:</span><span>${d.customer}</span></div>
    <div style="display:flex;justify-content:space-between;margin:4px 0;"><span>Order Taker:</span><span>${currentUser.name}</span></div>
    <div style="border-top:1px solid #000;margin:5px 0;"></div>
    <table style="width:100%;border-collapse:collapse;font-size:11px;">
        <thead>
            <tr>
                <th style="border-top:1px solid #000;border-bottom:1px solid #000;padding:3px 2px;text-align:left;">S#</th>
                <th style="border-top:1px solid #000;border-bottom:1px solid #000;padding:3px 2px;text-align:left;">ITEMS</th>
                <th style="border-top:1px solid #000;border-bottom:1px solid #000;padding:3px 2px;text-align:center;">QTY</th>
                <th style="border-top:1px solid #000;border-bottom:1px solid #000;padding:3px 2px;text-align:right;">RATE</th>
                <th style="border-top:1px solid #000;border-bottom:1px solid #000;padding:3px 2px;text-align:right;">AMT</th>
            </tr>
        </thead>
        <tbody>${rows}</tbody>
    </table>
    <div style="border-top:1px solid #000;margin:5px 0;"></div>
    <div style="display:flex;justify-content:space-between;margin:4px 0;font-weight:bold;"><span>SUBTOTAL (Rs.):</span><span>${d.gross}</span></div>
    <div style="display:flex;justify-content:space-between;margin:4px 0;"><span>DISCOUNT @ ${d.discPct}%</span><span>${d.discount}</span></div>
    <div style="border-top:2px solid #000;margin:5px 0;"></div>
    <div style="border:2px solid #000;padding:7px 10px;display:flex;justify-content:space-between;font-size:15px;font-weight:900;margin:4px 0;">
        <span>PAYABLE (Rs.):</span><span>Rs. ${d.net}</span>
    </div>
    <div style="border-top:2px solid #000;margin:5px 0;"></div>
    <div style="display:flex;justify-content:space-between;margin:4px 0;"><span>CUSTOMER PAID:</span><span>${d.cashGiven>0?d.cashGiven:d.net}</span></div>
    <div style="display:flex;justify-content:space-between;margin:4px 0;"><span>RETURN AMOUNT:</span><span>${d.cashGiven>0?d.baqaya:0}</span></div>
    <div style="border-top:1px dashed #000;margin:6px 0;"></div>
    <div style="text-align:center;font-weight:bold;margin:5px 0;">Thank you for your visit!</div>
    <div style="border-top:1px dashed #000;margin:6px 0;"></div>
    <div style="text-align:center;font-size:10px;margin:3px 0;">Inclusive of GST. @ 16%</div>
    <div style="text-align:center;font-size:10px;margin:3px 0;">NTN: ${NTN}</div>
    <div style="border-top:1px dashed #000;margin:6px 0;"></div>
    <div style="text-align:center;font-size:10px;color:#333;margin:2px 0;">Software Developed By <strong>${DEV_NAME}</strong></div>
    <div style="text-align:center;font-size:10px;color:#333;margin:2px 0;">&#128222; ${DEV_PHONE}</div>`;
}

// Show slip in page modal
function showSlipModal(d) {
    let content = buildSlipHTML(d);
    document.getElementById("thermal-slip-content").innerHTML = content;
    document.getElementById("thermal-slip-overlay").style.display = "flex";
    // Store slip data for print button
    window._currentSlipData = d;
}

// PRINT: Opens new window with ONLY the receipt content
function printThermalSlip() {
    let d = window._currentSlipData;
    if(!d){ window.print(); return; }
    let slipBody = buildSlipHTML(d);
    let fullPage = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Receipt - ${d.invoiceId}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    font-family: 'Courier New', Courier, monospace;
    font-size: 12px;
    color: #000;
    background: #fff;
    width: 302px;
    padding: 8px 10px;
  }
  @media print {
    @page { margin: 2mm; size: 80mm auto; }
    body { width: auto; padding: 4px 6px; }
  }
</style>
</head>
<body>${slipBody}</body>
</html>`;
    let w = window.open("", "_blank", "width=370,height=700,toolbar=0,scrollbars=1");
    if(!w){ alert("Popup blocked! Browser settings mein popup allow karein."); return; }
    w.document.open();
    w.document.write(fullPage);
    w.document.close();
    w.focus();
    setTimeout(function(){ w.print(); }, 800);
}

function closeThermalSlip() {
    document.getElementById("thermal-slip-overlay").style.display = "none";
}

// ====== CAKE ORDERS ======
function saveCakeOrder(){
    let c=document.getElementById("cake-customer").value.trim(),d=document.getElementById("cake-details").value.trim(),
        w=document.getElementById("cake-weight").value.trim(),dt=document.getElementById("cake-date").value,
        adv=parseFloat(document.getElementById("cake-advance").value)||0,
        tp=parseFloat(document.getElementById("cake-total-price").value)||0;
    if(!c||!d||!w||!dt){alert("Tamam fields bharein.");return;}
    cakeOrders.push({id:"CAKE-"+Math.floor(100+Math.random()*900),customer:c,details:d,weight:w,date:dt,advance:adv,totalPrice:tp,status:"Pending"});
    ["cake-customer","cake-details","cake-weight","cake-date","cake-advance","cake-total-price"].forEach(id=>{let el=document.getElementById(id);if(el)el.value="";});
    saveData();renderCakeOrders();alert("Cake order save ho gaya!");
}
function renderCakeOrders(){
    const tb=document.getElementById("cake-orders-list");if(!tb)return;tb.innerHTML="";
    if(!cakeOrders.length){tb.innerHTML=`<tr><td colspan="8" style="text-align:center;color:#64748b;padding:24px;">No cake orders yet</td></tr>`;return;}
    let ss={Pending:"background:rgba(245,166,35,.15);color:#f5a623;",Preparing:"background:rgba(59,130,246,.15);color:#3b82f6;",Ready:"background:rgba(34,197,94,.15);color:#22c55e;",Delivered:"background:rgba(100,116,139,.15);color:#94a3b8;"};
    cakeOrders.forEach((o,i)=>{
        let s=ss[o.status]||ss.Pending;
        tb.innerHTML+=`<tr style="border-bottom:1px solid rgba(255,255,255,.06);">
            <td><span style="background:rgba(245,166,35,.15);color:#f5a623;border-radius:5px;padding:2px 8px;font-size:11.5px;font-weight:700;">${o.id}</span></td>
            <td style="color:#f1f5f9;font-weight:600;">${o.customer}</td>
            <td style="color:#94a3b8;font-size:12.5px;">${o.details}</td>
            <td style="color:#f1f5f9;">${o.weight}</td>
            <td style="color:#94a3b8;">${o.date}</td>
            <td><span style="color:#94a3b8;">Rs.${o.advance}</span> / <strong style="color:#22c55e;">Rs.${o.totalPrice}</strong></td>
            <td><span style="${s}border-radius:99px;padding:3px 12px;font-size:11.5px;font-weight:700;">${o.status}</span></td>
            <td><button onclick="advanceCakeStatus(${i})" style="background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);color:#f1f5f9;padding:5px 12px;border-radius:6px;cursor:pointer;font-size:12px;font-family:inherit;">Update</button></td>
        </tr>`;
    });
}
function advanceCakeStatus(i){
    let st=["Pending","Preparing","Ready","Delivered"];
    cakeOrders[i].status=st[(st.indexOf(cakeOrders[i].status)+1)%st.length];
    saveData();renderCakeOrders();
}

// ====== INVENTORY ======
function updateTaxPreview(){
    let baseEl=document.getElementById("inv-sell-price"),previewEl=document.getElementById("tax-preview");
    if(!baseEl||!previewEl)return;
    let base=parseFloat(baseEl.value)||0;
    if(base<=0){previewEl.innerHTML="";return;}
    if(taxEnabled){
        let tax=Math.round(base*TAX_RATE),final=base+tax;
        previewEl.innerHTML=`<div style="display:flex;gap:8px;margin-top:6px;flex-wrap:wrap;">
            <span style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:6px;padding:4px 10px;font-size:12px;color:#94a3b8;">Base: <strong style="color:#f1f5f9;">Rs.${base}</strong></span>
            <span style="background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.2);border-radius:6px;padding:4px 10px;font-size:12px;color:#ef4444;">GST 16%: +Rs.${tax}</span>
            <span style="background:rgba(34,197,94,.12);border:1px solid rgba(34,197,94,.25);border-radius:6px;padding:4px 10px;font-size:12px;color:#22c55e;">Final: <strong>Rs.${final}</strong></span>
        </div>`;
    } else {
        previewEl.innerHTML=`<div style="margin-top:6px;"><span style="background:rgba(34,197,94,.12);border:1px solid rgba(34,197,94,.25);border-radius:6px;padding:4px 10px;font-size:12px;color:#22c55e;">Price: Rs.${base} (No GST)</span></div>`;
    }
}
function renderInventoryCategoryDropdowns(){
    let s=document.getElementById("inv-category-select");if(!s)return;
    s.innerHTML=`<option value="">-- Select Category --</option>`;
    Object.keys(storeCategories).forEach(c=>{s.innerHTML+=`<option value="${c}">${c}</option>`;});
}
function saveInventoryProduct(){
    if(!currentUser.isAdmin){alert("Inventory sirf Admin manage kar sakta hai.");return;}
    let code=document.getElementById("inv-item-code").value.trim(),
        name=document.getElementById("inv-product-name").value.trim(),
        cat=document.getElementById("inv-category-select").value,
        mc=document.getElementById("inv-model-color").value.trim(),
        cp=parseFloat(document.getElementById("inv-cost-price").value),
        basePrice=parseFloat(document.getElementById("inv-sell-price").value),
        ei=parseInt(document.getElementById("edit-product-index").value);
    if(!code||!name||!cat||isNaN(cp)||isNaN(basePrice)){alert("Tamam fields bharein.");return;}
    let taxAmount=taxEnabled?Math.round(basePrice*TAX_RATE):0;
    let finalPrice=basePrice+taxAmount;
    let productData={id:ei===-1?Date.now():products[ei].id,code,name,category:cat,modelColor:mc,costPrice:cp,basePrice,tax:taxAmount,price:finalPrice};
    if(ei===-1){products.push(productData);alert(`Product add!\nBase:Rs.${basePrice}${taxEnabled?" + Tax:Rs."+taxAmount+" = Final:Rs."+finalPrice:""}`);}
    else{products[ei]=productData;alert("Product update!");resetInventoryForm();}
    saveData();renderInventory();renderProducts(products);renderCategoryButtons();clearInventoryInputs();
    let tp=document.getElementById("tax-preview");if(tp)tp.innerHTML="";
}
function clearInventoryInputs(){
    ["inv-item-code","inv-product-name","inv-model-color","inv-cost-price","inv-sell-price"].forEach(id=>{let el=document.getElementById(id);if(el)el.value="";});
    let s=document.getElementById("inv-category-select");if(s)s.value="";
}
function renderInventory(){
    const il=document.getElementById("inventory-list");if(!il)return;il.innerHTML="";
    if(!products.length){il.innerHTML=`<tr><td colspan="8" style="text-align:center;color:#64748b;padding:24px;">No products yet.</td></tr>`;return;}
    products.forEach((p,i)=>{
        let m=p.costPrice>0?Math.round(((p.price-p.costPrice)/p.price)*100):0;
        let ms=m>=30?"color:#22c55e;":m>=10?"color:#f5a623;":"color:#ef4444;";
        let base=p.basePrice||p.price,tax=p.tax||0;
        il.innerHTML+=`<tr style="border-bottom:1px solid rgba(255,255,255,.06);">
            <td><span style="background:rgba(245,166,35,.15);color:#f5a623;border-radius:5px;padding:2px 8px;font-size:11px;font-weight:700;">${p.code||"N/A"}</span></td>
            <td style="font-weight:700;color:#f1f5f9;">${p.name}</td>
            <td><span style="background:rgba(59,130,246,.12);color:#3b82f6;border-radius:99px;padding:2px 10px;font-size:11.5px;">${p.category}</span></td>
            <td style="color:#64748b;font-size:12.5px;">${p.modelColor||"-"}</td>
            <td style="color:#94a3b8;font-size:12px;">Rs.${p.costPrice}</td>
            <td style="font-size:11.5px;"><div style="color:#94a3b8;">Base:Rs.${base}</div>${tax>0?`<div style="color:#ef4444;">+GST:Rs.${tax}</div>`:""}<div style="font-weight:800;color:#22c55e;">Final:Rs.${p.price}</div></td>
            <td><span style="${ms}font-weight:700;">${m}%</span></td>
            <td>
                <button onclick="editProduct(${i})" style="background:rgba(59,130,246,.12);border:1px solid rgba(59,130,246,.25);color:#3b82f6;padding:5px 10px;border-radius:5px;cursor:pointer;font-size:12px;margin-right:4px;"><i class="fa-solid fa-pen"></i></button>
                <button onclick="deleteProduct(${i})" style="background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.25);color:#ef4444;padding:5px 10px;border-radius:5px;cursor:pointer;font-size:12px;"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>`;
    });
}
function editProduct(i){
    if(!currentUser.isAdmin){alert("Sirf Admin edit kar sakta hai.");return;}
    let p=products[i];
    document.getElementById("edit-product-index").value=i;
    document.getElementById("inv-item-code").value=p.code||"";
    document.getElementById("inv-product-name").value=p.name;
    document.getElementById("inv-category-select").value=p.category;
    document.getElementById("inv-model-color").value=p.modelColor||"";
    document.getElementById("inv-cost-price").value=p.costPrice;
    document.getElementById("inv-sell-price").value=p.basePrice||p.price;
    updateTaxPreview();
    document.getElementById("save-product-btn").innerHTML='<i class="fa-solid fa-floppy-disk"></i> Update Product';
    document.getElementById("cancel-edit-btn").style.display="block";
}
function resetInventoryForm(){
    document.getElementById("edit-product-index").value=-1;clearInventoryInputs();
    document.getElementById("save-product-btn").innerHTML='<i class="fa-solid fa-plus"></i> Add To Inventory';
    document.getElementById("cancel-edit-btn").style.display="none";
    let tp=document.getElementById("tax-preview");if(tp)tp.innerHTML="";
}
function deleteProduct(i){
    if(!currentUser.isAdmin){alert("Sirf Admin delete kar sakta hai.");return;}
    if(confirm("Is product ko delete karna chahte hain?")){products.splice(i,1);saveData();renderInventory();renderProducts(products);}
}

// ====== REPORTS ======
function renderReportsTable(){
    const tb=document.getElementById("reports-list");if(!tb)return;tb.innerHTML="";
    let fd=document.getElementById("filter-report-date").value;
    let list=fd?salesHistory.filter(s=>s.dateStr===fd):salesHistory;
    if(!list.length){tb.innerHTML=`<tr><td colspan="6" style="text-align:center;color:#64748b;padding:24px;">No records found</td></tr>`;return;}
    let mc={Cash:"color:#22c55e;",Card:"color:#3b82f6;",Digital:"color:#a855f7;",Credit:"color:#f97316;"};
    list.forEach(s=>{tb.innerHTML+=`<tr style="border-bottom:1px solid rgba(255,255,255,.06);">
        <td><span style="background:rgba(245,166,35,.15);color:#f5a623;border-radius:5px;padding:2px 8px;font-size:11.5px;font-weight:700;">${s.id}</span></td>
        <td style="color:#94a3b8;font-size:12.5px;">${s.dateObj.toLocaleString()}</td>
        <td style="font-weight:600;color:#f1f5f9;">${s.customer}</td>
        <td style="color:#94a3b8;">${s.mobile}</td>
        <td><span style="${mc[s.method]||mc.Cash}font-weight:700;">${s.method}</span></td>
        <td style="font-weight:800;color:#22c55e;font-size:14px;">Rs. ${s.net}</td>
    </tr>`;});
}
function renderProductDailyReport(){
    const tb=document.getElementById("product-daily-list");if(!tb)return;
    let fd=document.getElementById("filter-daily-date").value;
    let totalEl=document.getElementById("daily-total-box");
    let list=fd?salesHistory.filter(s=>s.dateStr===fd):salesHistory;
    let summary={};
    list.forEach(sale=>{sale.items.forEach(item=>{if(!summary[item.name])summary[item.name]={qty:0,revenue:0};summary[item.name].qty+=item.qty;summary[item.name].revenue+=item.price*item.qty;});});
    let grandTotal=list.reduce((s,x)=>s+x.net,0),billCount=list.length;
    if(totalEl)totalEl.innerHTML=fd?`<div style="display:flex;gap:14px;flex-wrap:wrap;margin-bottom:12px;">
        <div style="background:rgba(34,197,94,.12);border:1px solid rgba(34,197,94,.25);border-radius:10px;padding:10px 18px;"><div style="font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase;">Total Sales</div><div style="font-size:20px;font-weight:800;color:#22c55e;">Rs.${grandTotal}</div></div>
        <div style="background:rgba(59,130,246,.12);border:1px solid rgba(59,130,246,.25);border-radius:10px;padding:10px 18px;"><div style="font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase;">Total Bills</div><div style="font-size:20px;font-weight:800;color:#3b82f6;">${billCount}</div></div>
        <div style="background:rgba(245,166,35,.12);border:1px solid rgba(245,166,35,.25);border-radius:10px;padding:10px 18px;"><div style="font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase;">Products Sold</div><div style="font-size:20px;font-weight:800;color:#f5a623;">${Object.keys(summary).length}</div></div>
    </div>`:"";
    tb.innerHTML="";
    let keys=Object.keys(summary);
    if(!keys.length){tb.innerHTML=`<tr><td colspan="4" style="text-align:center;color:#64748b;padding:24px;">${fd?"Is date mein koi sale nahi.":"Date select karein."}</td></tr>`;return;}
    keys.sort((a,b)=>summary[b].revenue-summary[a].revenue);
    keys.forEach((k,i)=>{tb.innerHTML+=`<tr style="border-bottom:1px solid rgba(255,255,255,.06);">
        <td style="color:#64748b;font-weight:700;padding:10px 15px;">#${i+1}</td>
        <td style="font-weight:700;color:#f1f5f9;padding:10px 15px;">${k}</td>
        <td style="color:#3b82f6;font-weight:700;padding:10px 15px;">${summary[k].qty} pcs</td>
        <td style="color:#22c55e;font-weight:800;padding:10px 15px;font-size:14px;">Rs.${summary[k].revenue}</td>
    </tr>`;});
}
function renderMonthlyReport(){
    const tb=document.getElementById("monthly-list");if(!tb)return;tb.innerHTML="";
    let monthly={};
    salesHistory.forEach(s=>{if(!monthly[s.monthStr])monthly[s.monthStr]={total:0,bills:0,products:{}};monthly[s.monthStr].total+=s.net;monthly[s.monthStr].bills+=1;s.items.forEach(item=>{if(!monthly[s.monthStr].products[item.name])monthly[s.monthStr].products[item.name]=0;monthly[s.monthStr].products[item.name]+=item.qty;});});
    let keys=Object.keys(monthly).sort((a,b)=>b.localeCompare(a));
    if(!keys.length){tb.innerHTML=`<tr><td colspan="4" style="text-align:center;color:#64748b;padding:24px;">No data yet</td></tr>`;return;}
    let mn=["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    keys.forEach(mon=>{
        let d=monthly[mon];let top=Object.keys(d.products).sort((a,b)=>d.products[b]-d.products[a])[0]||"-";
        let[yr,mo]=mon.split("-");
        tb.innerHTML+=`<tr style="border-bottom:1px solid rgba(255,255,255,.06);">
            <td style="font-weight:700;color:#f5a623;padding:12px 15px;">${mn[parseInt(mo)]} ${yr}</td>
            <td style="font-weight:800;color:#22c55e;padding:12px 15px;font-size:15px;">Rs.${d.total}</td>
            <td style="color:#3b82f6;font-weight:700;padding:12px 15px;">${d.bills} bills</td>
            <td style="color:#94a3b8;padding:12px 15px;font-size:12.5px;">${top}</td>
        </tr>`;
    });
}
function exportProductDailyCSV(){
    let fd=document.getElementById("filter-daily-date").value;
    let list=fd?salesHistory.filter(s=>s.dateStr===fd):salesHistory;
    if(!list.length){alert("Koi data nahi!");return;}
    let summary={};list.forEach(sale=>{sale.items.forEach(item=>{if(!summary[item.name])summary[item.name]={qty:0,revenue:0};summary[item.name].qty+=item.qty;summary[item.name].revenue+=item.price*item.qty;});});
    let csv=`Date: ${fd||"All Dates"},,,\nProduct Name,Qty Sold,Total Revenue\n`;
    Object.keys(summary).sort((a,b)=>summary[b].revenue-summary[a].revenue).forEach(k=>{csv+=`${k},${summary[k].qty},${summary[k].revenue}\n`;});
    csv+=`\nGrand Total,,Rs.${list.reduce((s,x)=>s+x.net,0)}`;
    let a=document.createElement("a");a.href="data:text/csv;charset=utf-8,"+encodeURI(csv);a.download=`dolce_daily_${fd||"all"}.csv`;document.body.appendChild(a);a.click();a.remove();
}
function exportMonthlyCSV(){
    if(!salesHistory.length){alert("Koi data nahi!");return;}
    let monthly={};salesHistory.forEach(s=>{if(!monthly[s.monthStr])monthly[s.monthStr]={total:0,bills:0};monthly[s.monthStr].total+=s.net;monthly[s.monthStr].bills+=1;});
    let csv="Month,Total Sales,Total Bills\n";
    Object.keys(monthly).sort((a,b)=>b.localeCompare(a)).forEach(m=>{csv+=`${m},${monthly[m].total},${monthly[m].bills}\n`;});
    let a=document.createElement("a");a.href="data:text/csv;charset=utf-8,"+encodeURI(csv);a.download="dolce_monthly.csv";document.body.appendChild(a);a.click();a.remove();
}
function exportReportsToExcel(){
    if(!salesHistory.length){alert("Koi data nahi!");return;}
    let csv="Invoice,Date,Customer,Mobile,Payment,Amount\n";
    salesHistory.forEach(s=>{csv+=`${s.id},"${s.dateObj.toLocaleString()}","${s.customer}",${s.mobile},${s.method},${s.net}\n`;});
    let a=document.createElement("a");a.href="data:text/csv;charset=utf-8,"+encodeURI(csv);a.download="dolce_report.csv";document.body.appendChild(a);a.click();a.remove();
}

// ====== DASHBOARD ======
function updateDashboard(){
    let tot=salesHistory.reduce((s,x)=>s+x.net,0);
    let today=new Date().toISOString().split("T")[0];
    let day=salesHistory.filter(s=>s.dateStr===today).reduce((s,x)=>s+x.net,0);
    let mon=new Date().toISOString().slice(0,7);
    let month=salesHistory.filter(s=>s.monthStr===mon).reduce((s,x)=>s+x.net,0);
    let el=id=>document.getElementById(id);
    if(el("dash-total-sales")) el("dash-total-sales").innerText=`Rs.${tot}`;
    if(el("dash-day-sales")) el("dash-day-sales").innerText=`Rs.${day}`;
    if(el("dash-month-sales")) el("dash-month-sales").innerText=`Rs.${month}`;
    if(el("dash-total-transactions")) el("dash-total-transactions").innerText=salesHistory.length;
    let ps={};salesHistory.forEach(sale=>sale.items.forEach(item=>{if(!ps[item.name])ps[item.name]={qty:0,revenue:0};ps[item.name].qty+=item.qty;ps[item.name].revenue+=item.price*item.qty;}));
    let psel=el("product-sales-summary");if(!psel)return;psel.innerHTML="";
    let keys=Object.keys(ps);
    if(!keys.length){psel.innerHTML=`<tr><td colspan="4" style="text-align:center;color:#64748b;padding:20px;">No sales yet</td></tr>`;return;}
    keys.sort((a,b)=>ps[b].revenue-ps[a].revenue);
    keys.forEach((k,i)=>{psel.innerHTML+=`<tr style="border-bottom:1px solid rgba(255,255,255,.06);">
        <td style="color:#64748b;font-weight:700;padding:10px 15px;">#${i+1}</td>
        <td style="font-weight:600;color:#f1f5f9;padding:10px 15px;">${k}</td>
        <td style="color:#3b82f6;font-weight:600;padding:10px 15px;">${ps[k].qty}</td>
        <td style="color:#22c55e;font-weight:700;padding:10px 15px;">Rs.${ps[k].revenue}</td>
    </tr>`;});
}

// ====== SETTINGS ======
function addNewCategoryFromSettings(){
    if(!currentUser.isAdmin){alert("Sirf Admin categories manage kar sakta hai.");return;}
    let n=document.getElementById("new-cat-input").value.trim();
    if(!n){alert("Naam likhein.");return;}
    if(storeCategories[n]){alert("Pehle se mojood hai!");return;}
    storeCategories[n]=[];document.getElementById("new-cat-input").value="";
    saveData();renderCategoryButtons();renderInventoryCategoryDropdowns();renderSettingsCategoriesList();
}
function deleteCategoryFromSettings(n){
    if(!currentUser.isAdmin){alert("Sirf Admin delete kar sakta hai.");return;}
    if(confirm(`'${n}' delete karna chahte hain?`)){delete storeCategories[n];saveData();renderCategoryButtons();renderInventoryCategoryDropdowns();renderSettingsCategoriesList();}
}
function renderSettingsCategoriesList(){
    const d=document.getElementById("existing-categories-list");if(!d)return;
    let keys=Object.keys(storeCategories);
    if(!keys.length){d.innerHTML=`<p style="color:#64748b;font-size:13px;">Koi category nahi.</p>`;return;}
    d.innerHTML=keys.map(c=>`<span style="display:inline-flex;align-items:center;gap:6px;background:rgba(245,166,35,.12);color:#f5a623;border:1px solid rgba(245,166,35,.22);border-radius:99px;padding:5px 14px;font-size:13px;font-weight:600;">${c}<button onclick="deleteCategoryFromSettings('${c}')" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:15px;font-weight:900;">&times;</button></span>`).join("");
}
function changeAdminCredentials(){
    if(!currentUser.isAdmin){alert("Sirf Admin credentials change kar sakta hai.");return;}
    let newUser=document.getElementById("new-admin-user").value.trim(),
        oldPass=document.getElementById("old-admin-pass").value,
        newPass=document.getElementById("new-admin-pass").value,
        confirmPass=document.getElementById("confirm-admin-pass").value;
    if(!newUser||!oldPass||!newPass){alert("Tamam fields bharein.");return;}
    if(oldPass!==credentials.adminPass){alert("Purana password galat hai!");return;}
    if(newPass!==confirmPass){alert("Naya password confirm nahi hua!");return;}
    if(newPass.length<4){alert("Min 4 characters ka password zaroor likhein.");return;}
    credentials.adminUser=newUser;credentials.adminPass=newPass;saveData();
    ["new-admin-user","old-admin-pass","new-admin-pass","confirm-admin-pass"].forEach(id=>{let el=document.getElementById(id);if(el)el.value="";});
    document.getElementById("logged-user-name").innerText=newUser;currentUser.name=newUser;
    alert("Credentials update ho gaye! New Username: "+newUser);
}
function addStaffAccount(){
    if(!currentUser.isAdmin){alert("Sirf Admin staff manage kar sakta hai.");return;}
    let user=document.getElementById("staff-user").value.trim(),pass=document.getElementById("staff-pass").value,role=document.getElementById("staff-role").value.trim()||"Staff";
    if(!user||!pass){alert("Username aur password dono zaroor likhein.");return;}
    if(user===credentials.adminUser){alert("Admin naam use nahi kar sakte.");return;}
    if(credentials.staff.some(s=>s.user===user)){alert("Username pehle se mojood hai!");return;}
    if(pass.length<4){alert("Min 4 characters ka password.");return;}
    credentials.staff.push({user,pass,role});saveData();
    ["staff-user","staff-pass","staff-role"].forEach(id=>{let el=document.getElementById(id);if(el)el.value="";});
    renderStaffList();alert(`'${user}' (${role}) add ho gaya!`);
}
function deleteStaff(i){
    if(!currentUser.isAdmin){alert("Sirf Admin delete kar sakta hai.");return;}
    if(confirm(`'${credentials.staff[i].user}' delete karna chahte hain?`)){credentials.staff.splice(i,1);saveData();renderStaffList();}
}
function renderStaffList(){
    const el=document.getElementById("staff-list");if(!el)return;
    if(!credentials.staff.length){el.innerHTML=`<p style="color:#64748b;font-size:13px;margin-top:10px;">Koi staff account nahi hai.</p>`;return;}
    el.innerHTML=`<div style="margin-top:12px;display:flex;flex-direction:column;gap:8px;">`+
    credentials.staff.map((s,i)=>`<div style="display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:9px;padding:10px 14px;">
        <div style="display:flex;align-items:center;gap:10px;"><div style="width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#1d4ed8);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:14px;">${s.user.charAt(0).toUpperCase()}</div>
        <div><div style="font-weight:700;color:#f1f5f9;">${s.user}</div><div style="font-size:11px;color:#64748b;">${s.role}</div></div></div>
        <button onclick="deleteStaff(${i})" style="background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.25);color:#ef4444;padding:5px 12px;border-radius:6px;cursor:pointer;font-size:12px;font-family:inherit;"><i class="fa-solid fa-trash"></i> Remove</button>
    </div>`).join("")+`</div>`;
}
function unlockDangerZone(){
    if(!currentUser.isAdmin){alert("Sirf Admin Danger Zone access kar sakta hai.");return;}
    let pass=prompt("Developer password darj karein:");if(pass===null)return;
    if(pass===DANGER_PASS){dangerUnlocked=true;document.getElementById("danger-lock-screen").style.display="none";document.getElementById("danger-actions").style.display="block";}
    else alert("Galat password!");
}
function lockDangerZone(){dangerUnlocked=false;document.getElementById("danger-lock-screen").style.display="flex";document.getElementById("danger-actions").style.display="none";}
function backupDataJSON(){
    let a=document.createElement("a");
    a.href="data:text/json;charset=utf-8,"+encodeURIComponent(JSON.stringify({products,salesHistory,cakeOrders,storeCategories,credentials,taxEnabled},null,2));
    a.download="dolce_backup.json";document.body.appendChild(a);a.click();a.remove();
}
function restoreDataJSON(event){
    let file=event.target.files[0];if(!file)return;
    let r=new FileReader();
    r.onload=function(e){
        try{let data=JSON.parse(e.target.result);
            products=data.products||[];
            salesHistory=(data.salesHistory||[]).map(s=>({...s,dateObj:new Date(s.dateObj)}));
            cakeOrders=data.cakeOrders||[];storeCategories=data.storeCategories||{};
            if(data.credentials)credentials=data.credentials;
            if(data.taxEnabled!==undefined)taxEnabled=data.taxEnabled;
            saveData();initApp();alert("Data restore ho gaya!");}
        catch(err){alert("Invalid backup file!");}
    };r.readAsText(file);
}
function clearAllSystemData(){
    if(!currentUser.isAdmin){alert("Sirf Admin data clear kar sakta hai.");return;}
    if(!dangerUnlocked){alert("Pehle Danger Zone unlock karein.");return;}
    let pass2=prompt("LAST WARNING!\nDeveloper password dobara likhein:");
    if(pass2!==DANGER_PASS){alert("Galat password. Cancel.");return;}
    products=[];salesHistory=[];cakeOrders=[];storeCategories={};cart=[];
    saveData();initApp();lockDangerZone();alert("Saara data clear kar diya gaya.");
}
function switchTab(tabId,event){
    document.querySelectorAll(".tab-pane").forEach(p=>p.classList.remove("active-tab"));
    document.querySelectorAll(".nav-links li").forEach(li=>li.classList.remove("active"));
    document.getElementById("tab-"+tabId).classList.add("active-tab");
    if(event)event.currentTarget.classList.add("active");
    if(tabId==="dashboard")updateDashboard();
    if(tabId==="reports"){renderReportsTable();renderProductDailyReport();renderMonthlyReport();}
    if(tabId==="settings"){renderStaffList();renderSettingsCategoriesList();updateTaxToggleUI();}
}
function toggleShift(){alert("Shift active hai.\nDolce Donuts - Mall Of Sargodha");}
