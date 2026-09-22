// Dolce Donuts POS - Full System v3.0
// Features: localStorage, Role-Based Access, 16% Tax, Enhanced Reports

let credentials = { adminUser: "Admin", adminPass: "112233", staff: [] };
let products = [], cart = [], salesHistory = [], cakeOrders = [];
let storeCategories = { "Donuts": [], "Beverages": [], "Cakes": [] };
let dangerUnlocked = false;
let currentUser = { name: "", isAdmin: false };
const TAX_RATE = 0.16;
const DANGER_PASS = "babadev786";

// ====== LOCALSTORAGE ======
function saveData() {
    try {
        localStorage.setItem("dd_credentials", JSON.stringify(credentials));
        localStorage.setItem("dd_products", JSON.stringify(products));
        localStorage.setItem("dd_salesHistory", JSON.stringify(salesHistory));
        localStorage.setItem("dd_cakeOrders", JSON.stringify(cakeOrders));
        localStorage.setItem("dd_categories", JSON.stringify(storeCategories));
    } catch(e) {}
}
function loadData() {
    try {
        let cr=localStorage.getItem("dd_credentials"), pr=localStorage.getItem("dd_products"),
            sh=localStorage.getItem("dd_salesHistory"), co=localStorage.getItem("dd_cakeOrders"),
            ca=localStorage.getItem("dd_categories");
        if(cr) credentials=JSON.parse(cr);
        if(pr) products=JSON.parse(pr);
        if(sh){ salesHistory=JSON.parse(sh); salesHistory.forEach(s=>{s.dateObj=new Date(s.dateObj);}); }
        if(co) cakeOrders=JSON.parse(co);
        if(ca) storeCategories=JSON.parse(ca);
    } catch(e) {}
}

// ====== LOGIN ======
function handleLogin() {
    let u=document.getElementById("login-user").value.trim();
    let p=document.getElementById("login-pass").value;
    loadData();
    let isAdmin = (u===credentials.adminUser && p===credentials.adminPass);
    let isStaff = credentials.staff.some(s=>s.user===u && s.pass===p);
    if(isAdmin || isStaff) {
        currentUser = { name: u, isAdmin: isAdmin };
        document.getElementById("login-screen").style.display="none";
        document.getElementById("main-app").style.display="flex";
        document.getElementById("logged-user-name").innerText=u;
        let av=document.getElementById("user-avatar-letter");
        if(av) av.innerText=u.charAt(0).toUpperCase();
        setupRoleAccess();
        initApp();
    } else { alert("Invalid Username or Password!\nDefault: Admin / 112233"); }
}

function setupRoleAccess() {
    // Staff can only see POS, Dashboard, Cake Orders, Reports
    // Admin sees everything
    let navItems = document.querySelectorAll(".nav-links li");
    navItems.forEach(li => {
        let text = li.innerText.trim();
        if(!currentUser.isAdmin) {
            if(text.includes("Inventory") || text.includes("Settings")) {
                li.style.display = "none";
            }
        } else {
            li.style.display = "";
        }
    });
    // Show role badge
    let nm=document.getElementById("logged-user-name");
    if(nm) nm.innerText = currentUser.name + (currentUser.isAdmin ? "" : " (Staff)");
}

function logout() {
    dangerUnlocked=false;
    currentUser={name:"",isAdmin:false};
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
    setInterval(updateClock, 1000);
    document.addEventListener("keydown", handleKeyboard);
}
function handleKeyboard(e) {
    if(e.key==="F1"){e.preventDefault();document.getElementById("product-search").focus();}
    if(e.key==="F2"){e.preventDefault();processCheckout("Print");}
    if(e.key==="F3"){e.preventDefault();processCheckout("WhatsApp");}
    if(e.key==="F8"){e.preventDefault();document.getElementById("cash-given-input").focus();}
    if(e.key==="Enter"&&document.activeElement===document.getElementById("product-search")){
        let q=document.getElementById("product-search").value.trim().toLowerCase();
        let found=products.find(p=>p.code&&p.code.toLowerCase()===q);
        if(found){addToCart(found.id);document.getElementById("product-search").value="";renderProducts(products);}
    }
}
function updateClock(){
    let el=document.getElementById("live-clock");
    if(el) el.innerText=new Date().toLocaleTimeString("en-PK",{hour12:true});
}

// ====== CATEGORIES ======
function renderCategoryButtons(){
    const c=document.getElementById("category-container"); if(!c) return;
    let html=`<button class="cat-btn active" onclick="selectMainCategory('All',event)">All Items</button>`;
    Object.keys(storeCategories).forEach(cat=>{html+=`<button class="cat-btn" onclick="selectMainCategory('${cat}',event)">${cat}</button>`;});
    c.innerHTML=html;
}
function selectMainCategory(cat,event){
    document.querySelectorAll(".cat-btn").forEach(b=>b.classList.remove("active"));
    if(event) event.currentTarget.classList.add("active");
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
    const g=document.getElementById("product-grid"); if(!g) return; g.innerHTML="";
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
    let product=products.find(p=>p.id===productId);
    let existing=cart.find(i=>i.id===productId);
    if(existing) existing.qty+=1; else cart.push({...product,qty:1});
    updateCartUI();
}
function updateCartUI(){
    const tb=document.getElementById("cart-items-table"),cc=document.getElementById("cart-count");
    if(!tb) return; tb.innerHTML="";
    let totalQty=cart.reduce((s,i)=>s+i.qty,0);
    if(cc) cc.innerText=totalQty;
    if(!cart.length){
        tb.innerHTML=`<tr><td colspan="6" style="text-align:center;color:#64748b;padding:28px;font-size:13px;">Cart khali hai. Product select karein.</td></tr>`;
        ["cart-gross","cart-net","cash-baqaya"].forEach(id=>document.getElementById(id).innerText="Rs. 0");
        return;
    }
    let gross=0;
    cart.forEach((item,idx)=>{
        let t=item.price*item.qty; gross+=t;
        tb.innerHTML+=`<tr style="border-bottom:1px solid rgba(255,255,255,.06);" onmouseover="this.style.background='rgba(245,166,35,.04)'" onmouseout="this.style.background='transparent'">
            <td style="padding:10px 12px;font-weight:700;color:#f1f5f9;">${item.name}</td>
            <td style="padding:10px 12px;color:#64748b;font-size:11.5px;">${item.modelColor||"Standard"}</td>
            <td style="padding:10px 12px;">
                <div style="display:inline-flex;align-items:center;gap:4px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:9px;padding:3px 5px;">
                    <button onclick="changeQty(${idx},-1)" style="width:24px;height:24px;cursor:pointer;background:rgba(239,68,68,.15);border:1px solid rgba(239,68,68,.3);border-radius:5px;color:#ef4444;font-weight:900;font-size:16px;line-height:1;" onmouseover="this.style.background='rgba(239,68,68,.3)'" onmouseout="this.style.background='rgba(239,68,68,.15)'">&#8722;</button>
                    <span style="min-width:26px;text-align:center;font-weight:800;color:#f5a623;font-size:14px;">${item.qty}</span>
                    <button onclick="changeQty(${idx},1)" style="width:24px;height:24px;cursor:pointer;background:rgba(34,197,94,.15);border:1px solid rgba(34,197,94,.3);border-radius:5px;color:#22c55e;font-weight:900;font-size:16px;line-height:1;" onmouseover="this.style.background='rgba(34,197,94,.3)'" onmouseout="this.style.background='rgba(34,197,94,.15)'">+</button>
                </div>
            </td>
            <td style="padding:10px 12px;color:#94a3b8;font-size:12.5px;">Rs. ${item.price}</td>
            <td style="padding:10px 12px;font-weight:800;color:#22c55e;font-size:14px;">Rs. ${t}</td>
            <td style="padding:10px 12px;"><button onclick="removeFromCart(${idx})" style="background:rgba(239,68,68,.12);color:#ef4444;border:1px solid rgba(239,68,68,.25);padding:5px 10px;border-radius:6px;cursor:pointer;font-size:12px;" onmouseover="this.style.background='rgba(239,68,68,.28)'" onmouseout="this.style.background='rgba(239,68,68,.12)'"><i class="fa-solid fa-trash"></i></button></td>
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
    document.getElementById("cash-baqaya").innerText=`Rs. ${Math.max(0,cash-net)}`;
}
function setCashExact(){
    let g=cart.reduce((s,i)=>s+(i.price*i.qty),0);
    let d=parseFloat(document.getElementById("cart-discount").value)||0;
    document.getElementById("cash-given-input").value=g-d; calculateBaqaya();
}
function addCashAmount(a){
    let c=parseFloat(document.getElementById("cash-given-input").value)||0;
    document.getElementById("cash-given-input").value=c+a; calculateBaqaya();
}

// ====== CHECKOUT & PRINT ======
function processCheckout(actionType){
    if(!cart.length){alert("Cart is empty!");return;}
    let customer=document.getElementById("customer-name").value||"Walk-in Customer";
    let mobile=document.getElementById("customer-mobile").value||"N/A";
    let method=document.getElementById("payment-method-select").value;
    let gross=cart.reduce((s,i)=>s+(i.price*i.qty),0);
    let discount=parseFloat(document.getElementById("cart-discount").value)||0;
    let net=gross-discount;
    let cashGiven=parseFloat(document.getElementById("cash-given-input").value)||0;
    let baqaya=Math.max(0,cashGiven-net);
    let orderDate=new Date();
    let invoiceId="SLIP-"+Math.floor(1000+Math.random()*9000);
    salesHistory.push({id:invoiceId,customer:`${customer} (${mobile})`,mobile,net,method,
        dateObj:orderDate,dateStr:orderDate.toISOString().split("T")[0],
        monthStr:orderDate.toISOString().slice(0,7),items:[...cart]});
    saveData();
    if(actionType==="Print"){
        showPrintSlip({invoiceId,customer,mobile,method,gross,discount,net,cashGiven,baqaya,orderDate,items:[...cart]});
    } else {
        let txt=`*Dolce Donuts - Mall Of Sargodha*\n*Invoice: ${invoiceId}*\n${orderDate.toLocaleString()}\n*Customer:* ${customer}\n*Mobile:* ${mobile}\n\n`;
        cart.forEach(i=>{txt+=`- ${i.name} x${i.qty} = Rs. ${i.price*i.qty}\n`;});
        txt+=`\n*Gross: Rs. ${gross}*\n*Discount: Rs. ${discount}*\n*NET TOTAL: Rs. ${net}*\n*Payment: ${method}*\n\n_Shukriya! Dolce Donuts. 🍩_`;
        window.open(`https://wa.me/${mobile.replace(/[^0-9]/g,"")}?text=${encodeURIComponent(txt)}`,"_blank");
    }
    cart=[];
    ["customer-name","customer-mobile"].forEach(id=>document.getElementById(id).value="");
    document.getElementById("cart-discount").value=0;
    document.getElementById("cash-given-input").value=0;
    updateCartUI(); updateDashboard(); renderReportsTable(); renderProductDailyReport(); renderMonthlyReport();
}
function showPrintSlip(d){
    // Bill only shows total price (no tax breakdown)
    let iHtml=d.items.map(i=>`<tr><td style="padding:5px 8px;">${i.name}<br><small style="color:#888;">${i.modelColor||""}</small></td><td style="padding:5px 8px;text-align:center;">${i.qty}</td><td style="padding:5px 8px;text-align:right;">Rs.${i.price}</td><td style="padding:5px 8px;text-align:right;font-weight:700;">Rs.${i.price*i.qty}</td></tr>`).join("");
    let icons={Cash:"💵",Card:"💳",Digital:"📱",Credit:"📖"};
    let modal=`<div class="print-modal-overlay" id="slip-modal" onclick="if(event.target===this)closePrintSlip()">
    <div class="print-modal" id="slip-content">
        <div class="print-modal-header">
            <div style="font-size:36px;margin-bottom:6px;">🍩</div>
            <h2>Dolce Donuts</h2><p>Mall Of Sargodha | +92 322 7704444</p>
            <p style="margin-top:4px;font-size:10px;opacity:.5;letter-spacing:1px;">SALES RECEIPT</p>
        </div>
        <div class="print-modal-body">
            <div class="slip-row"><span style="color:#888;">Invoice</span><strong style="color:#002D62;">${d.invoiceId}</strong></div>
            <div class="slip-row"><span style="color:#888;">Date</span><span>${d.orderDate.toLocaleString()}</span></div>
            <div class="slip-row"><span style="color:#888;">Customer</span><span>${d.customer}</span></div>
            <div class="slip-row"><span style="color:#888;">Mobile</span><span>${d.mobile}</span></div>
            <div class="slip-row"><span style="color:#888;">Payment</span><span>${icons[d.method]||""} ${d.method}</span></div>
            <div style="margin:12px 0;border-top:2px dashed #e0e0e0;border-bottom:2px dashed #e0e0e0;padding:8px 0;">
                <table class="slip-items-table"><thead><tr><th>Item</th><th style="text-align:center">Qty</th><th style="text-align:right">Price</th><th style="text-align:right">Total</th></tr></thead>
                <tbody>${iHtml}</tbody></table>
            </div>
            <div class="slip-row"><span style="color:#888;">Gross</span><span>Rs. ${d.gross}</span></div>
            ${d.discount>0?`<div class="slip-row"><span style="color:#888;">Discount</span><span style="color:#dc3545;">- Rs. ${d.discount}</span></div>`:""}
            <div class="slip-row total"><span>NET TOTAL</span><span>Rs. ${d.net}</span></div>
            ${d.cashGiven>0?`<div class="slip-row"><span style="color:#888;">Cash Given</span><span>Rs. ${d.cashGiven}</span></div><div class="slip-row"><span style="color:#888;">Change</span><span style="color:#16a34a;font-weight:700;">Rs. ${d.baqaya}</span></div>`:""}
        </div>
        <div class="slip-footer"><p>🍩 Thank you! Dolce Donuts mein dobara tashreef layen!</p><p style="font-size:10px;color:#aaa;margin-top:3px;">Mall Of Sargodha | +92 322 7704444</p><div style="border-top:1px dashed #ddd;margin-top:10px;padding-top:8px;"><p style="font-size:9px;color:#bbb;margin:2px 0;">Software Developed By <strong style="color:#888;">Baba-Developer</strong></p><p style="font-size:9px;color:#bbb;margin:2px 0;">📞 03477437517</p></div></div>
        <div class="slip-actions">
            <button class="slip-print-btn" onclick="doPrint()"><i class="fa-solid fa-print"></i> Print Receipt</button>
            <button class="slip-close-btn" onclick="closePrintSlip()">Close</button>
        </div>
    </div></div>`;
    document.body.insertAdjacentHTML("beforeend",modal);
}
function doPrint(){
    let content=document.getElementById("slip-content").innerHTML;
    let w=window.open("","_blank","width=420,height=700");
    w.document.write(`<!DOCTYPE html><html><head><title>Receipt</title>
    <style>body{font-family:Arial,sans-serif;margin:0;padding:0;background:#fff;color:#111;}
    .print-modal-header{background:linear-gradient(135deg,#002D62,#0a4a9e);color:#fff;padding:20px;text-align:center;}
    .print-modal-header h2{margin:6px 0 2px;font-size:18px;}.print-modal-header p{font-size:11px;opacity:.8;margin:2px 0;}
    .print-modal-body{padding:16px 20px;}.slip-row{display:flex;justify-content:space-between;font-size:12.5px;padding:5px 0;border-bottom:1px dashed #eee;}
    .slip-row.total{font-size:15px;font-weight:800;color:#002D62;border-top:2px solid #002D62;margin-top:6px;padding-top:8px;border-bottom:none;}
    .slip-items-table{width:100%;border-collapse:collapse;font-size:12px;}
    .slip-items-table th{background:#f4f7fc;padding:6px 8px;text-align:left;font-weight:700;font-size:11px;color:#555;}
    .slip-items-table td{padding:6px 8px;border-bottom:1px solid #f0f0f0;}
    .slip-footer{text-align:center;padding:14px;background:#f8f9fa;}.slip-footer p{font-size:12px;color:#666;margin:3px 0;}.slip-footer .dev-credit{font-size:10px;color:#aaa;margin-top:8px;padding-top:8px;border-top:1px dashed #ddd;}
    .slip-actions{display:none;}</style></head><body>${content}</body></html>`);
    w.document.close();w.focus();setTimeout(()=>w.print(),500);
}
function closePrintSlip(){let m=document.getElementById("slip-modal");if(m)m.remove();}

// ====== CAKE ORDERS ======
function saveCakeOrder(){
    let c=document.getElementById("cake-customer").value.trim(),d=document.getElementById("cake-details").value.trim(),
        w=document.getElementById("cake-weight").value.trim(),dt=document.getElementById("cake-date").value,
        adv=parseFloat(document.getElementById("cake-advance").value)||0,tp=parseFloat(document.getElementById("cake-total-price").value)||0;
    if(!c||!d||!w||!dt){alert("Tamam fields bharein.");return;}
    cakeOrders.push({id:"CAKE-"+Math.floor(100+Math.random()*900),customer:c,details:d,weight:w,date:dt,advance:adv,totalPrice:tp,status:"Pending"});
    ["cake-customer","cake-details","cake-weight","cake-date","cake-advance","cake-total-price"].forEach(id=>document.getElementById(id).value="");
    saveData();renderCakeOrders();alert("Cake order save ho gaya!");
}
function renderCakeOrders(){
    const tb=document.getElementById("cake-orders-list");if(!tb)return;tb.innerHTML="";
    if(!cakeOrders.length){tb.innerHTML=`<tr><td colspan="8" style="text-align:center;color:#64748b;padding:24px;">No cake orders yet</td></tr>`;return;}
    let ss={Pending:"background:rgba(245,166,35,.15);color:#f5a623;border:1px solid rgba(245,166,35,.3);",
            Preparing:"background:rgba(59,130,246,.15);color:#3b82f6;border:1px solid rgba(59,130,246,.3);",
            Ready:"background:rgba(34,197,94,.15);color:#22c55e;border:1px solid rgba(34,197,94,.3);",
            Delivered:"background:rgba(100,116,139,.15);color:#94a3b8;border:1px solid rgba(100,116,139,.3);"};
    cakeOrders.forEach((o,i)=>{
        let s=ss[o.status]||ss.Pending;
        tb.innerHTML+=`<tr style="border-bottom:1px solid rgba(255,255,255,.06);" onmouseover="this.style.background='rgba(245,166,35,.03)'" onmouseout="this.style.background='transparent'">
            <td><span style="background:rgba(245,166,35,.15);color:#f5a623;border:1px solid rgba(245,166,35,.25);border-radius:5px;padding:2px 8px;font-size:11.5px;font-weight:700;">${o.id}</span></td>
            <td style="color:#f1f5f9;font-weight:600;">${o.customer}</td>
            <td style="color:#94a3b8;font-size:12.5px;">${o.details}</td>
            <td style="color:#f1f5f9;">${o.weight}</td>
            <td style="color:#94a3b8;">${o.date}</td>
            <td><span style="color:#94a3b8;">Rs.${o.advance}</span> / <strong style="color:#22c55e;">Rs.${o.totalPrice}</strong></td>
            <td><span style="${s}border-radius:99px;padding:3px 12px;font-size:11.5px;font-weight:700;">${o.status}</span></td>
            <td><button onclick="advanceCakeStatus(${i})" style="background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);color:#f1f5f9;padding:5px 12px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;font-family:inherit;" onmouseover="this.style.background='rgba(245,166,35,.15)';this.style.color='#f5a623'" onmouseout="this.style.background='rgba(255,255,255,.07)';this.style.color='#f1f5f9'">Update</button></td>
        </tr>`;
    });
}
function advanceCakeStatus(i){
    let st=["Pending","Preparing","Ready","Delivered"];
    cakeOrders[i].status=st[(st.indexOf(cakeOrders[i].status)+1)%st.length];
    saveData();renderCakeOrders();
}

// ====== INVENTORY (with 16% TAX) ======
// Tax preview: real-time when user types sell price
function updateTaxPreview(){
    let baseEl=document.getElementById("inv-sell-price");
    let previewEl=document.getElementById("tax-preview");
    if(!baseEl||!previewEl) return;
    let base=parseFloat(baseEl.value)||0;
    if(base<=0){previewEl.innerHTML="";return;}
    let tax=Math.round(base*TAX_RATE);
    let final=base+tax;
    previewEl.innerHTML=`<div style="display:flex;gap:8px;margin-top:6px;flex-wrap:wrap;">
        <span style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:6px;padding:4px 10px;font-size:12px;color:#94a3b8;">Base: <strong style="color:#f1f5f9;">Rs.${base}</strong></span>
        <span style="background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.2);border-radius:6px;padding:4px 10px;font-size:12px;color:#ef4444;">Tax 16%: <strong>+Rs.${tax}</strong></span>
        <span style="background:rgba(34,197,94,.12);border:1px solid rgba(34,197,94,.25);border-radius:6px;padding:4px 10px;font-size:12px;color:#22c55e;">Final: <strong>Rs.${final}</strong></span>
    </div>`;
}

function renderInventoryCategoryDropdowns(){
    let s=document.getElementById("inv-category-select");if(!s)return;
    s.innerHTML=`<option value="">-- Select Category --</option>`;
    Object.keys(storeCategories).forEach(c=>{s.innerHTML+=`<option value="${c}">${c}</option>`;});
}

function saveInventoryProduct(){
    // Staff cannot access inventory
    if(!currentUser.isAdmin){alert("Inventory sirf Admin manage kar sakta hai.");return;}
    let code=document.getElementById("inv-item-code").value.trim(),
        name=document.getElementById("inv-product-name").value.trim(),
        cat=document.getElementById("inv-category-select").value,
        mc=document.getElementById("inv-model-color").value.trim(),
        cp=parseFloat(document.getElementById("inv-cost-price").value),
        basePrice=parseFloat(document.getElementById("inv-sell-price").value),
        ei=parseInt(document.getElementById("edit-product-index").value);
    if(!code||!name||!cat||isNaN(cp)||isNaN(basePrice)){alert("Tamam fields bharein.");return;}
    // Auto-calculate 16% tax
    let taxAmount=Math.round(basePrice*TAX_RATE);
    let finalPrice=basePrice+taxAmount;
    let productData={id:ei===-1?Date.now():products[ei].id,code,name,category:cat,modelColor:mc,
        costPrice:cp,basePrice:basePrice,tax:taxAmount,price:finalPrice};
    if(ei===-1){products.push(productData);alert(`Product add ho gaya!\nBase: Rs.${basePrice} + Tax: Rs.${taxAmount} = Final: Rs.${finalPrice}`);}
    else{products[ei]=productData;alert("Product update ho gaya!");resetInventoryForm();}
    saveData();renderInventory();renderProducts(products);renderCategoryButtons();clearInventoryInputs();
    document.getElementById("tax-preview").innerHTML="";
}

function clearInventoryInputs(){
    ["inv-item-code","inv-product-name","inv-model-color","inv-cost-price","inv-sell-price"].forEach(id=>document.getElementById(id).value="");
    document.getElementById("inv-category-select").value="";
}

function renderInventory(){
    const il=document.getElementById("inventory-list");if(!il)return;il.innerHTML="";
    if(!products.length){il.innerHTML=`<tr><td colspan="9" style="text-align:center;color:#64748b;padding:24px;">No products yet.</td></tr>`;return;}
    products.forEach((p,i)=>{
        let m=p.costPrice>0?Math.round(((p.price-p.costPrice)/p.price)*100):0;
        let ms=m>=30?"background:rgba(34,197,94,.15);color:#22c55e;border:1px solid rgba(34,197,94,.25);":m>=10?"background:rgba(245,166,35,.15);color:#f5a623;border:1px solid rgba(245,166,35,.25);":"background:rgba(239,68,68,.15);color:#ef4444;border:1px solid rgba(239,68,68,.25);";
        let base=p.basePrice||p.price;let tax=p.tax||0;
        il.innerHTML+=`<tr style="border-bottom:1px solid rgba(255,255,255,.06);" onmouseover="this.style.background='rgba(245,166,35,.03)'" onmouseout="this.style.background='transparent'">
            <td><span style="background:rgba(245,166,35,.15);color:#f5a623;border:1px solid rgba(245,166,35,.25);border-radius:5px;padding:2px 8px;font-size:11px;font-weight:700;">${p.code||"N/A"}</span></td>
            <td style="font-weight:700;color:#f1f5f9;">${p.name}</td>
            <td><span style="background:rgba(59,130,246,.12);color:#3b82f6;border:1px solid rgba(59,130,246,.25);border-radius:99px;padding:2px 10px;font-size:11.5px;font-weight:600;">${p.category}</span></td>
            <td style="color:#64748b;font-size:12.5px;">${p.modelColor||"Standard"}</td>
            <td style="color:#94a3b8;font-size:12px;">Rs. ${p.costPrice}</td>
            <td style="font-size:12px;">
                <div style="color:#94a3b8;font-size:11px;">Base: Rs.${base}</div>
                <div style="color:#ef4444;font-size:11px;">Tax(16%): +Rs.${tax}</div>
                <div style="font-weight:800;color:#22c55e;font-size:13px;">Final: Rs.${p.price}</div>
            </td>
            <td><span style="${ms}border-radius:99px;padding:2px 9px;font-size:11.5px;font-weight:700;">${m}%</span></td>
            <td style="padding:10px 12px;">
                <button onclick="editProduct(${i})" style="background:rgba(59,130,246,.12);border:1px solid rgba(59,130,246,.25);color:#3b82f6;padding:5px 10px;border-radius:5px;cursor:pointer;font-size:12px;font-family:inherit;margin-right:4px;" onmouseover="this.style.background='rgba(59,130,246,.28)'" onmouseout="this.style.background='rgba(59,130,246,.12)'"><i class="fa-solid fa-pen"></i></button>
                <button onclick="deleteProduct(${i})" style="background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.25);color:#ef4444;padding:5px 10px;border-radius:5px;cursor:pointer;font-size:12px;font-family:inherit;" onmouseover="this.style.background='rgba(239,68,68,.28)'" onmouseout="this.style.background='rgba(239,68,68,.12)'"><i class="fa-solid fa-trash"></i></button>
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
    document.getElementById("tab-inventory").scrollTop=0;
}
function resetInventoryForm(){
    document.getElementById("edit-product-index").value=-1;clearInventoryInputs();
    document.getElementById("save-product-btn").innerHTML='<i class="fa-solid fa-plus"></i> Add To Inventory';
    document.getElementById("cancel-edit-btn").style.display="none";
    document.getElementById("tax-preview").innerHTML="";
}
function deleteProduct(i){
    if(!currentUser.isAdmin){alert("Sirf Admin delete kar sakta hai.");return;}
    if(confirm("Is product ko delete karna chahte hain?")){products.splice(i,1);saveData();renderInventory();renderProducts(products);}
}

// ====== REPORTS - SALES HISTORY ======
function renderReportsTable(){
    const tb=document.getElementById("reports-list");if(!tb)return;tb.innerHTML="";
    let fd=document.getElementById("filter-report-date").value;
    let list=fd?salesHistory.filter(s=>s.dateStr===fd):salesHistory;
    if(!list.length){tb.innerHTML=`<tr><td colspan="6" style="text-align:center;color:#64748b;padding:24px;">No records found</td></tr>`;return;}
    let mc={Cash:"background:rgba(34,197,94,.15);color:#22c55e;border:1px solid rgba(34,197,94,.25);",
            Card:"background:rgba(59,130,246,.15);color:#3b82f6;border:1px solid rgba(59,130,246,.25);",
            Digital:"background:rgba(168,85,247,.15);color:#a855f7;border:1px solid rgba(168,85,247,.25);",
            Credit:"background:rgba(249,115,22,.15);color:#f97316;border:1px solid rgba(249,115,22,.25);"};
    list.forEach(s=>{
        let ms=mc[s.method]||mc.Cash;
        tb.innerHTML+=`<tr style="border-bottom:1px solid rgba(255,255,255,.06);" onmouseover="this.style.background='rgba(245,166,35,.03)'" onmouseout="this.style.background='transparent'">
            <td><span style="background:rgba(245,166,35,.15);color:#f5a623;border:1px solid rgba(245,166,35,.25);border-radius:5px;padding:2px 8px;font-size:11.5px;font-weight:700;">${s.id}</span></td>
            <td style="color:#94a3b8;font-size:12.5px;">${s.dateObj.toLocaleString()}</td>
            <td style="font-weight:600;color:#f1f5f9;">${s.customer}</td>
            <td style="color:#94a3b8;">${s.mobile}</td>
            <td><span style="${ms}border-radius:99px;padding:2px 10px;font-size:11.5px;font-weight:700;">${s.method}</span></td>
            <td style="font-weight:800;color:#22c55e;font-size:14px;">Rs. ${s.net}</td>
        </tr>`;
    });
}

// ====== REPORTS - PRODUCT-WISE DAILY REPORT ======
function renderProductDailyReport(){
    const tb=document.getElementById("product-daily-list");if(!tb)return;
    let fd=document.getElementById("filter-daily-date").value;
    let totalEl=document.getElementById("daily-total-box");

    let list=fd?salesHistory.filter(s=>s.dateStr===fd):salesHistory;

    let summary={};
    list.forEach(sale=>{
        sale.items.forEach(item=>{
            if(!summary[item.name]) summary[item.name]={qty:0,revenue:0,category:item.category||""};
            summary[item.name].qty+=item.qty;
            summary[item.name].revenue+=item.price*item.qty;
        });
    });

    let grandTotal=list.reduce((s,x)=>s+x.net,0);
    let billCount=list.length;

    if(totalEl){
        totalEl.innerHTML=fd?
        `<div style="display:flex;gap:14px;flex-wrap:wrap;margin-bottom:12px;">
            <div style="background:rgba(34,197,94,.12);border:1px solid rgba(34,197,94,.25);border-radius:10px;padding:10px 18px;">
                <div style="font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase;">Total Sales</div>
                <div style="font-size:20px;font-weight:800;color:#22c55e;">Rs. ${grandTotal}</div>
            </div>
            <div style="background:rgba(59,130,246,.12);border:1px solid rgba(59,130,246,.25);border-radius:10px;padding:10px 18px;">
                <div style="font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase;">Total Bills</div>
                <div style="font-size:20px;font-weight:800;color:#3b82f6;">${billCount}</div>
            </div>
            <div style="background:rgba(245,166,35,.12);border:1px solid rgba(245,166,35,.25);border-radius:10px;padding:10px 18px;">
                <div style="font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase;">Products Sold</div>
                <div style="font-size:20px;font-weight:800;color:#f5a623;">${Object.keys(summary).length}</div>
            </div>
        </div>`:"";
    }

    tb.innerHTML="";
    let keys=Object.keys(summary);
    if(!keys.length){tb.innerHTML=`<tr><td colspan="4" style="text-align:center;color:#64748b;padding:24px;">${fd?"Is date mein koi sale nahi.":"Date select karein."}</td></tr>`;return;}
    keys.sort((a,b)=>summary[b].revenue-summary[a].revenue);
    keys.forEach((k,i)=>{
        let d=summary[k];
        tb.innerHTML+=`<tr style="border-bottom:1px solid rgba(255,255,255,.06);" onmouseover="this.style.background='rgba(245,166,35,.03)'" onmouseout="this.style.background='transparent'">
            <td style="color:#64748b;font-weight:700;padding:10px 15px;">#${i+1}</td>
            <td style="font-weight:700;color:#f1f5f9;padding:10px 15px;">${k}</td>
            <td style="color:#3b82f6;font-weight:700;padding:10px 15px;">${d.qty} pcs</td>
            <td style="color:#22c55e;font-weight:800;padding:10px 15px;font-size:14px;">Rs. ${d.revenue}</td>
        </tr>`;
    });
}

// ====== REPORTS - MONTHLY SUMMARY ======
function renderMonthlyReport(){
    const tb=document.getElementById("monthly-list");if(!tb)return;tb.innerHTML="";
    let monthly={};
    salesHistory.forEach(s=>{
        if(!monthly[s.monthStr]) monthly[s.monthStr]={total:0,bills:0,products:{}};
        monthly[s.monthStr].total+=s.net;
        monthly[s.monthStr].bills+=1;
        s.items.forEach(item=>{
            if(!monthly[s.monthStr].products[item.name]) monthly[s.monthStr].products[item.name]=0;
            monthly[s.monthStr].products[item.name]+=item.qty;
        });
    });
    let keys=Object.keys(monthly).sort((a,b)=>b.localeCompare(a));
    if(!keys.length){tb.innerHTML=`<tr><td colspan="4" style="text-align:center;color:#64748b;padding:24px;">No data yet</td></tr>`;return;}
    keys.forEach(mon=>{
        let d=monthly[mon];
        let topProduct=Object.keys(d.products).sort((a,b)=>d.products[b]-d.products[a])[0]||"-";
        let [yr,mo]=mon.split("-");
        let monthNames=["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        let displayMon=`${monthNames[parseInt(mo)]} ${yr}`;
        tb.innerHTML+=`<tr style="border-bottom:1px solid rgba(255,255,255,.06);" onmouseover="this.style.background='rgba(245,166,35,.03)'" onmouseout="this.style.background='transparent'">
            <td style="font-weight:700;color:#f5a623;padding:12px 15px;font-size:14px;">${displayMon}</td>
            <td style="font-weight:800;color:#22c55e;padding:12px 15px;font-size:15px;">Rs. ${d.total}</td>
            <td style="color:#3b82f6;font-weight:700;padding:12px 15px;">${d.bills} bills</td>
            <td style="color:#94a3b8;padding:12px 15px;font-size:12.5px;">${topProduct}</td>
        </tr>`;
    });
}

// ====== EXPORT DAILY PRODUCT REPORT ======
function exportProductDailyCSV(){
    let fd=document.getElementById("filter-daily-date").value;
    let list=fd?salesHistory.filter(s=>s.dateStr===fd):salesHistory;
    if(!list.length){alert("Koi data nahi!");return;}
    let summary={};
    list.forEach(sale=>{sale.items.forEach(item=>{
        if(!summary[item.name])summary[item.name]={qty:0,revenue:0};
        summary[item.name].qty+=item.qty;summary[item.name].revenue+=item.price*item.qty;
    });});
    let csv=`Date: ${fd||"All Dates"},,,\nProduct Name,Qty Sold,Total Revenue\n`;
    Object.keys(summary).sort((a,b)=>summary[b].revenue-summary[a].revenue).forEach(k=>{
        csv+=`${k},${summary[k].qty},${summary[k].revenue}\n`;
    });
    let total=list.reduce((s,x)=>s+x.net,0);
    csv+=`\nGrand Total,,Rs. ${total}`;
    let a=document.createElement("a");a.href="data:text/csv;charset=utf-8,"+encodeURI(csv);
    a.download=`dolce_daily_${fd||"all"}.csv`;document.body.appendChild(a);a.click();a.remove();
}

// ====== EXPORT MONTHLY REPORT ======
function exportMonthlyCSV(){
    if(!salesHistory.length){alert("Koi data nahi!");return;}
    let monthly={};
    salesHistory.forEach(s=>{
        if(!monthly[s.monthStr])monthly[s.monthStr]={total:0,bills:0};
        monthly[s.monthStr].total+=s.net;monthly[s.monthStr].bills+=1;
    });
    let csv="Month,Total Sales,Total Bills\n";
    Object.keys(monthly).sort((a,b)=>b.localeCompare(a)).forEach(m=>{
        csv+=`${m},${monthly[m].total},${monthly[m].bills}\n`;
    });
    let a=document.createElement("a");a.href="data:text/csv;charset=utf-8,"+encodeURI(csv);
    a.download="dolce_monthly_report.csv";document.body.appendChild(a);a.click();a.remove();
}

// ====== ORIGINAL EXPORT ======
function exportReportsToExcel(){
    if(!salesHistory.length){alert("Koi data nahi!");return;}
    let csv="Invoice,Date,Customer,Mobile,Payment,Amount\n";
    salesHistory.forEach(s=>{csv+=`${s.id},"${s.dateObj.toLocaleString()}","${s.customer}",${s.mobile},${s.method},${s.net}\n`;});
    let a=document.createElement("a");a.href="data:text/csv;charset=utf-8,"+encodeURI(csv);
    a.download="dolce_donuts_report.csv";document.body.appendChild(a);a.click();a.remove();
}

// ====== SETTINGS ======
function addNewCategoryFromSettings(){
    if(!currentUser.isAdmin){alert("Sirf Admin categories manage kar sakta hai.");return;}
    let n=document.getElementById("new-cat-input").value.trim();
    if(!n){alert("Naam likhein.");return;}
    if(storeCategories[n]){alert("Pehle se mojood hai!");return;}
    storeCategories[n]=[];document.getElementById("new-cat-input").value="";
    saveData();renderCategoryButtons();renderInventoryCategoryDropdowns();renderSettingsCategoriesList();
    alert(`'${n}' category add ho gayi!`);
}
function deleteCategoryFromSettings(n){
    if(!currentUser.isAdmin){alert("Sirf Admin delete kar sakta hai.");return;}
    if(confirm(`'${n}' delete karna chahte hain?`)){
        delete storeCategories[n];
        saveData();renderCategoryButtons();renderInventoryCategoryDropdowns();renderSettingsCategoriesList();
    }
}
function renderSettingsCategoriesList(){
    const d=document.getElementById("existing-categories-list");if(!d)return;
    let keys=Object.keys(storeCategories);
    if(!keys.length){d.innerHTML=`<p style="color:#64748b;font-size:13px;">Koi category nahi.</p>`;return;}
    d.innerHTML=keys.map(c=>`<span style="display:inline-flex;align-items:center;gap:6px;background:rgba(245,166,35,.12);color:#f5a623;border:1px solid rgba(245,166,35,.22);border-radius:99px;padding:5px 14px;font-size:13px;font-weight:600;">${c}<button onclick="deleteCategoryFromSettings('${c}')" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:15px;line-height:1;padding:0;font-weight:900;">&times;</button></span>`).join("");
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
    if(newPass.length<4){alert("Password min 4 characters ka hona chahiye.");return;}
    credentials.adminUser=newUser;credentials.adminPass=newPass;
    saveData();
    ["new-admin-user","old-admin-pass","new-admin-pass","confirm-admin-pass"].forEach(id=>document.getElementById(id).value="");
    document.getElementById("logged-user-name").innerText=newUser;
    currentUser.name=newUser;
    alert("Credentials update ho gaye!\nNew Username: "+newUser);
}
function addStaffAccount(){
    if(!currentUser.isAdmin){alert("Sirf Admin staff manage kar sakta hai.");return;}
    let user=document.getElementById("staff-user").value.trim(),
        pass=document.getElementById("staff-pass").value,
        role=document.getElementById("staff-role").value.trim()||"Staff";
    if(!user||!pass){alert("Username aur password dono zaroor likhein.");return;}
    if(user===credentials.adminUser){alert("Admin naam use nahi kar sakte.");return;}
    if(credentials.staff.some(s=>s.user===user)){alert("Username pehle se mojood hai!");return;}
    if(pass.length<4){alert("Password min 4 characters ka hona chahiye.");return;}
    credentials.staff.push({user,pass,role});
    saveData();
    document.getElementById("staff-user").value="";
    document.getElementById("staff-pass").value="";
    document.getElementById("staff-role").value="";
    renderStaffList();alert(`'${user}' (${role}) add ho gaya!`);
}
function deleteStaff(index){
    if(!currentUser.isAdmin){alert("Sirf Admin delete kar sakta hai.");return;}
    if(confirm(`'${credentials.staff[index].user}' delete karna chahte hain?`)){
        credentials.staff.splice(index,1);saveData();renderStaffList();
    }
}
function renderStaffList(){
    const el=document.getElementById("staff-list");if(!el)return;
    if(!credentials.staff.length){el.innerHTML=`<p style="color:#64748b;font-size:13px;margin-top:10px;">Koi staff account nahi hai.</p>`;return;}
    el.innerHTML=`<div style="margin-top:12px;display:flex;flex-direction:column;gap:8px;">` +
    credentials.staff.map((s,i)=>`
        <div style="display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:9px;padding:10px 14px;">
            <div style="display:flex;align-items:center;gap:10px;">
                <div style="width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#1d4ed8);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:14px;">${s.user.charAt(0).toUpperCase()}</div>
                <div><div style="font-weight:700;color:#f1f5f9;">${s.user}</div><div style="font-size:11px;color:#64748b;">${s.role}</div></div>
            </div>
            <button onclick="deleteStaff(${i})" style="background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.25);color:#ef4444;padding:5px 12px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;font-family:inherit;" onmouseover="this.style.background='rgba(239,68,68,.28)'" onmouseout="this.style.background='rgba(239,68,68,.12)'"><i class="fa-solid fa-trash"></i> Remove</button>
        </div>`).join("") + `</div>`;
}
function unlockDangerZone(){
    if(!currentUser.isAdmin){alert("Sirf Admin Danger Zone access kar sakta hai.");return;}
    let pass=prompt("Developer password darj karein:");
    if(pass===null)return;
    if(pass===DANGER_PASS){dangerUnlocked=true;document.getElementById("danger-lock-screen").style.display="none";document.getElementById("danger-actions").style.display="block";alert("Danger Zone unlock ho gaya!");}
    else alert("Galat password!");
}
function lockDangerZone(){dangerUnlocked=false;document.getElementById("danger-lock-screen").style.display="flex";document.getElementById("danger-actions").style.display="none";}
function backupDataJSON(){
    let a=document.createElement("a");
    a.href="data:text/json;charset=utf-8,"+encodeURIComponent(JSON.stringify({products,salesHistory,cakeOrders,storeCategories,credentials},null,2));
    a.download="dolce_donuts_backup.json";document.body.appendChild(a);a.click();a.remove();
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
            saveData();initApp();alert("Data restore ho gaya!");}
        catch(err){alert("Invalid file!");}
    };r.readAsText(file);
}
function clearAllSystemData(){
    if(!currentUser.isAdmin){alert("Sirf Admin data clear kar sakta hai.");return;}
    if(!dangerUnlocked){alert("Pehle Danger Zone unlock karein.");return;}
    let pass2=prompt("LAST WARNING!\nConfirm karne ke liye developer password likhein:");
    if(pass2!==DANGER_PASS){alert("Galat password. Operation cancel.");return;}
    products=[];salesHistory=[];cakeOrders=[];storeCategories={};cart=[];
    saveData();initApp();lockDangerZone();alert("Saara data clear kar diya gaya.");
}

// ====== DASHBOARD ======
function updateDashboard(){
    let tot=salesHistory.reduce((s,x)=>s+x.net,0);
    let today=new Date().toISOString().split("T")[0];
    let day=salesHistory.filter(s=>s.dateStr===today).reduce((s,x)=>s+x.net,0);
    let mon=new Date().toISOString().slice(0,7);
    let month=salesHistory.filter(s=>s.monthStr===mon).reduce((s,x)=>s+x.net,0);
    if(document.getElementById("dash-total-sales")){
        document.getElementById("dash-total-sales").innerText=`Rs. ${tot}`;
        document.getElementById("dash-day-sales").innerText=`Rs. ${day}`;
        document.getElementById("dash-month-sales").innerText=`Rs. ${month}`;
    }
    if(document.getElementById("dash-total-transactions")) document.getElementById("dash-total-transactions").innerText=salesHistory.length;
    let ps={};
    salesHistory.forEach(sale=>sale.items.forEach(item=>{
        if(!ps[item.name])ps[item.name]={qty:0,revenue:0};
        ps[item.name].qty+=item.qty;ps[item.name].revenue+=item.price*item.qty;
    }));
    let el=document.getElementById("product-sales-summary");if(!el)return;el.innerHTML="";
    let keys=Object.keys(ps);
    if(!keys.length){el.innerHTML=`<tr><td colspan="4" style="text-align:center;color:#64748b;padding:20px;">No sales yet</td></tr>`;return;}
    keys.sort((a,b)=>ps[b].revenue-ps[a].revenue);
    keys.forEach((k,i)=>{el.innerHTML+=`<tr style="border-bottom:1px solid rgba(255,255,255,.06);" onmouseover="this.style.background='rgba(245,166,35,.03)'" onmouseout="this.style.background='transparent'">
        <td style="color:#64748b;font-weight:700;padding:10px 15px;">#${i+1}</td>
        <td style="font-weight:600;color:#f1f5f9;padding:10px 15px;">${k}</td>
        <td style="color:#3b82f6;font-weight:600;padding:10px 15px;">${ps[k].qty}</td>
        <td style="color:#22c55e;font-weight:700;padding:10px 15px;">Rs. ${ps[k].revenue}</td>
    </tr>`;});
}
function switchTab(tabId,event){
    document.querySelectorAll(".tab-pane").forEach(p=>p.classList.remove("active-tab"));
    document.querySelectorAll(".nav-links li").forEach(li=>li.classList.remove("active"));
    document.getElementById("tab-"+tabId).classList.add("active-tab");
    if(event) event.currentTarget.classList.add("active");
    if(tabId==="dashboard") updateDashboard();
    if(tabId==="reports"){renderReportsTable();renderProductDailyReport();renderMonthlyReport();}
    if(tabId==="settings"){renderStaffList();renderSettingsCategoriesList();}
}
function toggleShift(){alert("Shift active hai.\nDolce Donuts - Mall Of Sargodha");}
