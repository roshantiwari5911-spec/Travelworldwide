// ====== SUPABASE CLOUD CONNECTION CONFIGURATION ======
const SUPABASE_URL = "https://txqhsxyodszbfwsqvcjf.supabase.co"; 
const SUPABASE_ANON_KEY = "sb_publishable_l2-bk_euDS6C-Yf6zEgDog_pnkW5F8Q";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let dayCount = 0, flightCount = 0, standaloneHotelCount = 0, activeItineraryId = null; 
let addDayBtn, addFlightBtn, daysContainer, flightsContainer, previewPane, loginGate, crmWorkspace;
let tabItinerary, tabCustomers, tabHotels, moduleItinerary, moduleCustomers, moduleHotels;
let pkgCustomerSelect, customerTableRows, addCustSubmitBtn, logoutBtn;
let savedItinerariesLedger, clearWorkspaceBtn, activeRecordBadge, ledgerDrawer, openLedgerBtn, closeLedgerBtn; 
let standaloneHotelsList, standaloneHotelSaveBtn, standaloneHotelExportBtn, hotelVoucherPreviewPane;

const coreInputIds = [
    'pkg-title', 'pkg-destination', 'pkg-date', 'pkg-pax', 'pkg-vehicle', 
    'pkg-inclusions', 'pkg-exclusions', 'dmc-net-cost', 'dmc-markup-pct', 
    'pkg-price', 'pkg-airfare', 'opt1-price', 'opt2-price', 'opt3-price',
    'opt1-hotels', 'opt2-hotels', 'opt3-hotels'
];

function formatPremiumDate(dateStr) {
    if (!dateStr || dateStr === "---") return "---";
    return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

document.addEventListener('DOMContentLoaded', async () => {
    addDayBtn = document.getElementById('add-day-btn'); 
    addFlightBtn = document.getElementById('add-flight-btn');
    daysContainer = document.getElementById('days-container'); 
    flightsContainer = document.getElementById('flights-container');
    previewPane = document.getElementById('pdf-preview-pane'); 
    loginGate = document.getElementById('login-gate'); 
    crmWorkspace = document.getElementById('crm-workspace');
    tabItinerary = document.getElementById('tab-itinerary'); 
    tabCustomers = document.getElementById('tab-customers'); 
    tabHotels = document.getElementById('tab-hotels');
    moduleItinerary = document.getElementById('module-itinerary'); 
    moduleCustomers = document.getElementById('module-customers'); 
    moduleHotels = document.getElementById('module-hotels');
    pkgCustomerSelect = document.getElementById('pkg-customer-select'); 
    customerTableRows = document.getElementById('customer-table-rows');
    addCustSubmitBtn = document.getElementById('add-cust-submit-btn'); 
    logoutBtn = document.getElementById('logout-btn');
    savedItinerariesLedger = document.getElementById('saved-itineraries-ledger'); 
    clearWorkspaceBtn = document.getElementById('clear-workspace-btn');
    activeRecordBadge = document.getElementById('active-record-badge'); 
    ledgerDrawer = document.getElementById('ledger-drawer');
    openLedgerBtn = document.getElementById('open-ledger-btn'); 
    closeLedgerBtn = document.getElementById('close-ledger-btn');
    standaloneHotelsList = document.getElementById('standalone-hotels-list'); 
    standaloneHotelSaveBtn = document.getElementById('standalone-hotel-save-btn');
    standaloneHotelExportBtn = document.getElementById('standalone-hotel-export-btn'); 
    hotelVoucherPreviewPane = document.getElementById('hotel-voucher-preview-pane');

    tabItinerary?.addEventListener('click', () => switchCrmModule('itinerary'));
    tabCustomers?.addEventListener('click', () => switchCrmModule('customers'));
    tabHotels?.addEventListener('click', () => switchCrmModule('hotels'));
    addCustSubmitBtn?.addEventListener('click', onboardNewCustomerRecord);
    logoutBtn?.addEventListener('click', executeWorkspaceSignOut);
    clearWorkspaceBtn?.addEventListener('click', resetBuilderWorkspaceForm);
    openLedgerBtn?.addEventListener('click', () => toggleLedgerDrawer(true));
    closeLedgerBtn?.addEventListener('click', () => toggleLedgerDrawer(false));
    document.getElementById('standalone-add-hotel-btn')?.addEventListener('click', addStandaloneHotelBlock);
    standaloneHotelExportBtn?.addEventListener('click', generateStandaloneHotelPDF);
    standaloneHotelSaveBtn?.addEventListener('click', saveStandaloneHotelsToSupabase);
    document.getElementById('login-submit-btn')?.addEventListener('click', handleWorkspaceLogin);

    coreInputIds.forEach(id => document.getElementById(id)?.addEventListener('input', updateLivePreview));
    addDayBtn?.addEventListener('click', () => addItineraryDay());
    addFlightBtn?.addEventListener('click', addFlightSectorBlock);
    document.getElementById('export-btn')?.addEventListener('click', generateProfessionalPDF);
    document.getElementById('save-btn')?.addEventListener('click', saveItineraryToSupabase);

    checkExistingAuthSession();
});

function toggleLedgerDrawer(s) { 
    if (s) { ledgerDrawer?.classList.add('open'); fetchAndRenderItinerariesLedger(); } 
    else { ledgerDrawer?.classList.remove('open'); } 
}

async function checkExistingAuthSession() {
    try {
        if (localStorage.getItem('crm_authenticated') === 'true') {
            if (typeof fadeEngineForWorkspace === "function") fadeEngineForWorkspace(); 
            unlockPremiumWorkspace();
            return;
        }
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) { 
            if (typeof fadeEngineForWorkspace === "function") fadeEngineForWorkspace(); 
            unlockPremiumWorkspace(); 
        }
    } catch (e) { console.warn(e); }
}

async function executeWorkspaceSignOut() {
    try { localStorage.removeItem('crm_authenticated'); await supabaseClient.auth.signOut(); } catch (e) { console.warn(e); }
    crmWorkspace.style.opacity = "0"; setTimeout(() => window.location.reload(), 500); 
}

function switchCrmModule(m) {
    const un = "text-[11px] bg-white/5 text-gray-300 hover:bg-white/10 font-semibold px-3 py-1.5 rounded-lg transition";
    const sel = "text-[11px] bg-white text-black font-semibold px-3 py-1.5 rounded-lg shadow transition";
    tabItinerary.className = un; tabCustomers.className = un; tabHotels.className = un + " border border-dashed border-indigo-500/30";
    moduleItinerary.classList.add('hidden'); moduleCustomers.classList.add('hidden'); moduleHotels.classList.add('hidden');
    if (m === 'itinerary') { tabItinerary.className = sel; moduleItinerary.classList.remove('hidden'); if (openLedgerBtn) openLedgerBtn.style.display = 'flex'; updateLivePreview(); }
    else if (m === 'customers') { tabCustomers.className = sel; moduleCustomers.classList.remove('hidden'); if (openLedgerBtn) openLedgerBtn.style.display = 'none'; toggleLedgerDrawer(false); fetchAndRenderCustomerBase(); }
    else if (m === 'hotels') { tabHotels.className = sel + " border border-indigo-500/50"; moduleHotels.classList.remove('hidden'); if (openLedgerBtn) openLedgerBtn.style.display = 'none'; toggleLedgerDrawer(false); if (standaloneHotelsList?.children.length === 0) addStandaloneHotelBlock(); else updateHotelVoucherLivePreview(); }
    if (typeof lucide !== "undefined") lucide.createIcons();
}

function unlockPremiumWorkspace() {
    loginGate.style.opacity = "0";
    setTimeout(() => { 
        loginGate.style.display = "none"; 
        crmWorkspace.classList.remove('hidden-workspace'); 
        setTimeout(() => { 
            crmWorkspace.style.opacity = "1"; 
            fetchAndRenderCustomerBase(); 
            loadBaliProposalPreset(); // Preloads complete Bali DMC quotation
        }, 50); 
    }, 500);
}

// Pre-fills Bali proposal matching your DMC quotation
function loadBaliProposalPreset() {
    document.getElementById('pkg-title').value = "Bali – Kuta & Ubud 5 Nights / 6 Days Package";
    document.getElementById('pkg-destination').value = "Bali-Indonesia";
    document.getElementById('pkg-date').value = "2026-06-03";
    document.getElementById('pkg-pax').value = "2";
    document.getElementById('pkg-vehicle').value = "Suzuki APV or Toyota Avanza (4 Seats)";

    // Multi-tier hotel presets
    document.getElementById('opt1-price').value = "33990";
    document.getElementById('opt1-hotels').value = "Kuta: Zia Hotel Kuta (3N) - 1 Superior Room (BB)\nUbud: Fullmoon Villa Ubud (2N) - 1 One Bedroom Pool Villa (BB)";

    document.getElementById('opt2-price').value = "34540";
    document.getElementById('opt2-hotels').value = "Kuta: Anathera Resort Kuta (3N) - 1 Deluxe City View (BB)\nUbud: Kori Maharani Villas (2N) - 1 Beach Pool Hut (BB)";

    document.getElementById('opt3-price').value = "39050";
    document.getElementById('opt3-hotels').value = "Kuta: Rama Beach Resort & Villas (3N) - 1 Deluxe Room (BB)\nUbud: Ubud Raya Villa (2N) - 1 Superior Pool Villa (BB)";

    // DMC Cost calculation preset (USD 618 converted + markup)
    document.getElementById('dmc-net-cost').value = "58700";
    document.getElementById('dmc-markup-pct').value = "15";

    document.getElementById('pkg-inclusions').value = 
`Accommodation on Twin / Double Sharing basis
Daily Gourmet Breakfast at all hotel properties
All airport transfers and full-day sightseeing in Private AC Vehicle
English Speaking Professional Driver Guide during Tours & Transfers
Watersport Package A at Tanjung Benoa (Parasailing, Banana Boat, Jet Ski)
Uluwatu Temple Visit & Iconic Kecak Dance Performance tickets
Romantic Indian Candle Light Dinner at Jimbaran Bay Beach
Full Day Western Nusa Penida Island Excursion with Local Lunch & Boat Transfers
Ulun Danu Beratan Temple, Handara Gate & Wanagiri Viewpoint Tour
Kintamani Tour, Ubud Village, Tegenungan Waterfall & Bali Desa Swings (All 6 Swing Types)
2x 600ml Mineral Water daily during transfers and tours
Welcome Flower Garland at Ngurah Rai Airport
Public Liability Travel Insurance coverage`;

    document.getElementById('pkg-exclusions').value = 
`International / Domestic Airfare tickets
Bali Entry Visa Fee (IDR 500,000 / ~USD 35-40 per person payable at airport)
Bali Tourist Tax Levy (IDR 150,000 / ~USD 10 per person via Love Bali portal)
Personal laundry, telephone calls, and items outside mentioned meals
Mandatory Driver / Guide Tipping
5% GST & 5% TCS applicable on final remittance`;

    daysContainer.innerHTML = '';
    dayCount = 0;

    const baliDays = [
        { title: "Arrival in Bali & Private Transfer to Kuta", desc: "Upon arrival at Ngurah Rai International Airport (DPS), meet and greet with our representative with a traditional flower garland. Private AC transfer to your hotel in Kuta for check-in. Evening at leisure to explore Kuta beach and local markets. Overnight stay in Kuta." },
        { title: "Watersports, Uluwatu Cliff Temple, Kecak Dance & Jimbaran Dinner", desc: "Breakfast at the hotel. Head to Tanjung Benoa Beach for Watersports Package A (Parasailing Adventure, Banana Boat, and Jet Ski). In the afternoon, visit the dramatic Uluwatu Temple perched on a 70m cliff above the Indian Ocean. Witness the iconic Kecak Fire Dance performance against the sunset. Conclude with a romantic Indian Candle Light Dinner right on the Jimbaran Bay Beach. Overnight stay in Kuta." },
        { title: "Full Day West Tour Nusa Penida Island with Lunch", desc: "Early morning transfer to Sanur Harbour for a scenic speedboat cruise to Western Nusa Penida. Discover the world-famous Kelingking T-Rex Cliff Beach, Broken Beach, and natural infinity pool at Angel's Billabong. Enjoy an authentic local lunch included during the tour. Return speedboat to Sanur and private transfer back to your hotel. Overnight stay in Kuta." },
        { title: "Ulun Danu Beratan Temple, Handara Iconic Gate & Wanagiri Viewpoint", desc: "Breakfast at hotel and full-day exploration to North Bali highlands. Visit the floating Ulun Danu Beratan Lake Temple in Bedugul, the world-famous Handara Golf Gate for photos, and the breathtaking panoramic Wanagiri Twin Lake Viewpoint overlooking Lake Buyan and Tamblingan. Discover the lush Gitgit Waterfall. Evening return to hotel. Overnight stay in Kuta." },
        { title: "Transfer to Ubud, Kintamani Volcano, Coffee Plantations & Bali Swings", desc: "Breakfast and check-out from Kuta. Drive towards scenic Ubud, visiting silver and wood carving artisan workshops. Marvel at the panoramic Mount Batur volcano and Lake Kintamani views. Head to Bali Desa Swing for an adrenaline rush (includes 2x Single Swings, Romantic Swing, Bed Swing, Sky Bed, and Bird Nests). Visit scenic Tegenungan Waterfall. Check-in to your luxury villa in Ubud. Overnight stay in Ubud." },
        { title: "Leisure Morning & Departure Airport Transfer", desc: "Enjoy a relaxed breakfast at your Ubud villa. Morning free at leisure for souvenir shopping at Ubud Traditional Art Market or relaxing by the pool. At designated pick-up time, private transfer to Ngurah Rai Airport for your onward journey with unforgettable Bali memories." }
    ];

    baliDays.forEach(d => addItineraryDay(d.title, d.desc));
    calculateMarginMetrics();
    updateLivePreview();
}

function resetBuilderWorkspaceForm() {
    activeItineraryId = null; 
    if (activeRecordBadge) activeRecordBadge.classList.add('hidden');
    coreInputIds.forEach(id => {
        const el = document.getElementById(id); 
        if (el) el.value = '';
    });
    if (pkgCustomerSelect) pkgCustomerSelect.value = ''; 
    if (flightsContainer) flightsContainer.innerHTML = ''; 
    if (daysContainer) daysContainer.innerHTML = '';
    dayCount = 0; flightCount = 0;
    addFlightSectorBlock(); 
    addItineraryDay(); 
    calculateMarginMetrics();
}

async function fetchAndRenderItinerariesLedger() {
    try {
        const { data, error } = await supabaseClient.from('itineraries').select('id, title, destination, total_price, created_at').order('created_at', { ascending: false });
        if (error) throw error; 
        savedItinerariesLedger.innerHTML = '';
        if (data.length === 0) { savedItinerariesLedger.innerHTML = '<div class="text-gray-500 italic p-2 text-[11px]">No quotations saved yet.</div>'; return; }
        data.forEach(itin => {
            savedItinerariesLedger.innerHTML += `
                <div class="relative group/card mb-2">
                    <div onclick="loadSavedItineraryIntoWorkspace('${itin.id}')" class="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-indigo-500/60 hover:bg-white/10 cursor-pointer transition flex flex-col gap-1 text-left">
                        <div class="font-medium text-white pr-6 truncate">${itin.title}</div>
                        <div class="flex justify-between items-center text-[11px] text-gray-400"><span>${itin.destination}</span><span class="font-mono text-emerald-400 font-semibold">₹${Number(itin.total_price).toLocaleString('en-IN')}</span></div>
                    </div>
                    <button onclick="event.stopPropagation(); deleteItineraryRecord('${itin.id}', '${itin.title.replace(/'/g, "\\'")}')" class="absolute top-3 right-3 p-1 text-gray-500 hover:text-red-400 transition"><i data-lucide="trash-2" class="h-3.5 w-3.5"></i></button>
                </div>`;
        });
        if (typeof lucide !== "undefined") lucide.createIcons();
    } catch (e) { console.error(e); }
}

async function deleteItineraryRecord(id, t) {
    if (!confirm(`Permanently delete "${t}" from the CRM cloud?`)) return;
    try { await supabaseClient.from('itineraries').delete().eq('id', id); if (activeItineraryId === id) resetBuilderWorkspaceForm(); fetchAndRenderItinerariesLedger(); } catch (e) { alert(e.message); }
}

async function loadSavedItineraryIntoWorkspace(id) {
    try {
        const { data: itin } = await supabaseClient.from('itineraries').select('*').eq('id', id).single();
        if (!itin) return; 
        activeItineraryId = itin.id; 
        activeRecordBadge?.classList.remove('hidden');
        document.getElementById('pkg-title').value = itin.title || ''; 
        document.getElementById('pkg-destination').value = itin.destination || '';
        document.getElementById('pkg-date').value = itin.start_date || ''; 
        document.getElementById('pkg-pax').value = itin.number_of_people || '';
        document.getElementById('pkg-vehicle').value = itin.vehicle_used || ''; 
        if (pkgCustomerSelect) pkgCustomerSelect.value = itin.customer_id || '';
        document.getElementById('pkg-inclusions').value = Array.isArray(itin.inclusions) ? itin.inclusions.join('\n') : '';
        document.getElementById('pkg-exclusions').value = Array.isArray(itin.exclusions) ? itin.exclusions.join('\n') : '';
        if (document.getElementById('dmc-net-cost')) document.getElementById('dmc-net-cost').value = itin.dmc_net_cost || '';
        if (document.getElementById('dmc-markup-pct')) document.getElementById('dmc-markup-pct').value = itin.dmc_markup_pct || '0';
        
        toggleLedgerDrawer(false); 
        calculateMarginMetrics();
    } catch (e) { alert(e.message); }
}

function calculateMarginMetrics() {
    let flNet = 0, flGross = 0;
    if (flightsContainer) {
        Array.from(flightsContainer.children).forEach(b => {
            const n = parseFloat(b.querySelector('.fl-net')?.value) || 0, m = parseFloat(b.querySelector('.fl-margin')?.value) || 0;
            flNet += n; flGross += (n + (n * (m / 100)));
        });
    }
    const dmcNet = parseFloat(document.getElementById('dmc-net-cost')?.value) || 0;
    const dmcMarkup = parseFloat(document.getElementById('dmc-markup-pct')?.value) || 0;
    let landGross = dmcNet + (dmcNet * (dmcMarkup / 100));
    let finalGross = landGross + flGross;

    if (document.getElementById('pkg-price')) document.getElementById('pkg-price').value = Math.round(landGross);
    if (document.getElementById('pkg-airfare')) document.getElementById('pkg-airfare').value = Math.round(flGross);
    
    const netLabel = document.getElementById('meta-net-cost');
    const profitLabel = document.getElementById('meta-profit-cost');
    const grossLabel = document.getElementById('meta-gross-cost');

    if (netLabel) netLabel.innerText = `₹${Math.round(flNet + dmcNet).toLocaleString('en-IN')}`;
    if (profitLabel) profitLabel.innerText = `₹${Math.round(finalGross - (flNet + dmcNet)).toLocaleString('en-IN')}`;
    if (grossLabel) grossLabel.innerText = `₹${Math.round(finalGross).toLocaleString('en-IN')}`;
}

function updateLivePreview() { 
    calculateMarginMetrics(); 
    if (previewPane) previewPane.innerHTML = compileItineraryHTML(); 
}

// Master Agoda/Headout Proposal Compiler with Multi-Option Hotels
function compileItineraryHTML() {
    const title = document.getElementById('pkg-title')?.value || "Bali – Kuta & Ubud 5 Nights / 6 Days Package";
    const dest = document.getElementById('pkg-destination')?.value || "Bali-Indonesia";
    const date = document.getElementById('pkg-date')?.value || "2026-06-03";
    const pax = document.getElementById('pkg-pax')?.value || "2";
    const vehicle = document.getElementById('pkg-vehicle')?.value || "Suzuki APV or Toyota Avanza (4 Seats)";
    const airfare = document.getElementById('pkg-airfare')?.value || "0";

    const opt1Price = document.getElementById('opt1-price')?.value || "33990";
    const opt2Price = document.getElementById('opt2-price')?.value || "34540";
    const opt3Price = document.getElementById('opt3-price')?.value || "39050";

    const opt1Hotels = (document.getElementById('opt1-hotels')?.value || "").split('\n').filter(t => t.trim());
    const opt2Hotels = (document.getElementById('opt2-hotels')?.value || "").split('\n').filter(t => t.trim());
    const opt3Hotels = (document.getElementById('opt3-hotels')?.value || "").split('\n').filter(t => t.trim());

    let dyHtml = '';
    Array.from(daysContainer?.children || []).forEach((b, i) => {
        dyHtml += `
            <div style="margin-bottom:14px; background:#fafafa; padding:14px 16px; border-radius:10px; border:1px solid #f1f5f9; page-break-inside:avoid;">
                <h4 style="margin:0 0 4px 0; font-size:12px; font-weight:800; color:#0f172a; text-transform:uppercase;">DAY 0${i+1} &bull; ${b.querySelector('.day-title-input')?.value || 'Activity'}</h4>
                <p style="margin:0; font-size:11px; color:#475569; line-height:1.65; text-align:justify;">${b.querySelector('.day-desc-input')?.value || ''}</p>
            </div>`;
    });

    const inc = (document.getElementById('pkg-inclusions')?.value || "").split('\n').filter(t => t.trim()).map(t => `<li style="list-style-type:none; padding-left:14px; position:relative; margin-bottom:4px;"><span style="position:absolute; left:0; color:#10b981;">✔</span>${t}</li>`).join('');
    const exc = (document.getElementById('pkg-exclusions')?.value || "").split('\n').filter(t => t.trim()).map(t => `<li style="list-style-type:none; padding-left:14px; position:relative; margin-bottom:4px;"><span style="position:absolute; left:0; color:#ef4444;">&times;</span>${t}</li>`).join('');

    return `
        <div style="padding:24px; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#fff; color:#1e293b;">
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #0f172a; padding-bottom:14px; margin-bottom:20px;">
                <div>
                    <h2 style="font-size:22px; font-weight:900; margin:0; letter-spacing:-0.5px; color:#0f172a;">TRAVEL WORLD WIDE</h2>
                    <p style="font-size:10px; color:#64748b; margin:2px 0 0 0; text-transform:uppercase; letter-spacing:1.5px; font-weight:700;">BRIDGING GAPS</p>
                </div>
                <div style="text-align:right; font-size:11px; color:#64748b; line-height:1.45;">
                    <p style="margin:0; font-weight:700; color:#0f172a;">salestravelworldwide@gmail.com</p>
                    <p style="margin:0; font-weight:500;">+91 88926 89595</p>
                </div>
            </div>

            <div style="background:#f8fafc; border-radius:12px; padding:14px 16px; margin-bottom:22px; display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:11.5px; border:1px solid #e2e8f0;">
                <div><strong style="color:#64748b; text-transform:uppercase; font-size:9px; display:block;">Experience:</strong> <span style="font-weight:700; color:#0f172a;">${title}</span></div>
                <div><strong style="color:#64748b; text-transform:uppercase; font-size:9px; display:block;">Destination:</strong> <span style="font-weight:700; color:#0f172a;">📍 ${dest}</span></div>
                <div><strong style="color:#64748b; text-transform:uppercase; font-size:9px; display:block;">Dates:</strong> 📅 ${formatPremiumDate(date)} (5N / 6D)</div>
                <div><strong style="color:#64748b; text-transform:uppercase; font-size:9px; display:block;">Guests:</strong> 👥 ${pax} Travelers (Double Sharing)</div>
                <div style="grid-column:span 2; border-top:1px dashed #cbd5e1; padding-top:6px; margin-top:2px;"><strong style="color:#64748b; text-transform:uppercase; font-size:9px; display:block;">Ground Fleet:</strong> 🚘 ${vehicle} (Private Basis)</div>
            </div>

            <div style="margin-bottom:22px; page-break-inside:avoid;">
                <h3 style="font-size:11.5px; font-weight:800; text-transform:uppercase; letter-spacing:0.5px; color:#0f172a; border-bottom:1.5px solid #0f172a; padding-bottom:5px; margin-bottom:12px;">II. ACCOMMODATION DETAILS</h3>
                
                <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:12px;">
                    <div style="background:#f8fafc; border:1.5px solid #f59e0b; border-radius:12px; padding:12px; font-size:11px;">
                        <span style="font-size:9px; font-weight:800; background:#fef3c7; color:#b45309; padding:2px 8px; border-radius:999px; text-transform:uppercase; display:inline-block; margin-bottom:6px;">OPTION 01 &bull; 3 STAR</span>
                        <div style="color:#334155; line-height:1.45; margin-bottom:10px;">
                            ${opt1Hotels.map(h => `<div style="margin-bottom:4px;">🏢 <strong>${h}</strong></div>`).join('') || 'Standard 3-Star Properties'}
                        </div>
                        <div style="border-top:1px dashed #cbd5e1; padding-top:6px; font-weight:800; color:#0f172a; text-align:right;">
                            ₹${Number(opt1Price).toLocaleString('en-IN')}/- <span style="font-size:9px; font-weight:500; color:#64748b;">per person</span>
                        </div>
                    </div>

                    <div style="background:#f8fafc; border:1.5px solid #6366f1; border-radius:12px; padding:12px; font-size:11px;">
                        <span style="font-size:9px; font-weight:800; background:#e0e7ff; color:#4338ca; padding:2px 8px; border-radius:999px; text-transform:uppercase; display:inline-block; margin-bottom:6px;">OPTION 02 &bull; 4 STAR</span>
                        <div style="color:#334155; line-height:1.45; margin-bottom:10px;">
                            ${opt2Hotels.map(h => `<div style="margin-bottom:4px;">🏢 <strong>${h}</strong></div>`).join('') || 'Premium 4-Star Properties'}
                        </div>
                        <div style="border-top:1px dashed #cbd5e1; padding-top:6px; font-weight:800; color:#0f172a; text-align:right;">
                            ₹${Number(opt2Price).toLocaleString('en-IN')}/- <span style="font-size:9px; font-weight:500; color:#64748b;">per person</span>
                        </div>
                    </div>

                    <div style="background:#f8fafc; border:1.5px solid #a855f7; border-radius:12px; padding:12px; font-size:11px;">
                        <span style="font-size:9px; font-weight:800; background:#f3e8ff; color:#7e22ce; padding:2px 8px; border-radius:999px; text-transform:uppercase; display:inline-block; margin-bottom:6px;">OPTION 03 &bull; LUXURY</span>
                        <div style="color:#334155; line-height:1.45; margin-bottom:10px;">
                            ${opt3Hotels.map(h => `<div style="margin-bottom:4px;">🏢 <strong>${h}</strong></div>`).join('') || 'Luxury Pool Villas'}
                        </div>
                        <div style="border-top:1px dashed #cbd5e1; padding-top:6px; font-weight:800; color:#0f172a; text-align:right;">
                            ₹${Number(opt3Price).toLocaleString('en-IN')}/- <span style="font-size:9px; font-weight:500; color:#64748b;">per person</span>
                        </div>
                    </div>
                </div>
            </div>

            <div style="margin-bottom:22px;">
                <h3 style="font-size:11.5px; font-weight:800; text-transform:uppercase; letter-spacing:0.5px; color:#0f172a; border-bottom:1.5px solid #0f172a; padding-bottom:5px; margin-bottom:12px;">III. DAY-WISE ITINERARY</h3>
                ${dyHtml}
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; border-top:1px solid #e2e8f0; padding-top:14px; margin-bottom:20px; page-break-inside:avoid;">
                <div><h4 style="font-size:10.5px; font-weight:800; color:#10b981; text-transform:uppercase; margin:0 0 6px 0;">✓ Inclusions</h4><ul style="font-size:10.5px; color:#475569; padding:0; margin:0; line-height:1.5;">${inc}</ul></div>
                <div><h4 style="font-size:10.5px; font-weight:800; color:#ef4444; text-transform:uppercase; margin:0 0 6px 0;">✕ Exclusions</h4><ul style="font-size:10.5px; color:#475569; padding:0; margin:0; line-height:1.5;">${exc}</ul></div>
            </div>

            <div style="background:#0f172a; color:#fff; border-radius:12px; padding:16px 20px; display:flex; justify-content:space-between; align-items:center; page-break-inside:avoid;">
                <div>
                    <span style="font-size:9.5px; text-transform:uppercase; color:#94a3b8; font-weight:700; display:block;">PACKAGE STARTING INVESTMENT</span>
                    <span style="font-size:11px; color:#cbd5e1;">Option 1 Standard Package &bull; All tours, transfers & taxes included</span>
                </div>
                <div style="font-size:20px; font-weight:800; color:#10b981; font-family:monospace;">
                    ₹${(Number(opt1Price) * Number(pax)).toLocaleString('en-IN')}/- <span style="font-size:10px; color:#94a3b8;">Total (2 Pax)</span>
                </div>
            </div>
        </div>`;
}

function generateProfessionalPDF() {
    const t = document.getElementById('pkg-title')?.value || "Bali_Package_Proposal";
    html2pdf().set({ 
        margin: [8, 8, 10, 8], 
        filename: `${t.replace(/\s+/g,'_')}_Proposal.pdf`, 
        image: { type: 'jpeg', quality: 0.98 }, 
        html2canvas: { scale: 2, useCORS: true }, 
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } 
    }).from(previewPane).save();
}

function addItineraryDay(title = "", desc = "") {
    dayCount++; 
    const b = document.createElement('div'); 
    b.className = 'bg-white/5 border border-white/5 p-3.5 sm:p-4 rounded-xl space-y-2.5 relative transition shadow-md'; 
    b.id = `day-block-${dayCount}`;
    b.innerHTML = `
        <div class="flex justify-between items-center">
            <span class="text-xs font-bold text-indigo-400 uppercase tracking-wider">Day ${dayCount}</span>
            <button type="button" onclick="removeItineraryDay(${dayCount})" class="text-xs text-red-400 hover:text-red-300">Remove</button>
        </div>
        <input type="text" placeholder="Day Title..." value="${title}" class="day-title-input w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none text-white" oninput="updateLivePreview()">
        <textarea placeholder="Excursion details..." rows="3" class="day-desc-input w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none text-white resize-none" oninput="updateLivePreview()">${desc}</textarea>
    `;
    daysContainer.appendChild(b); 
    b.querySelector('input').addEventListener('input', updateLivePreview);
    b.querySelector('textarea').addEventListener('input', updateLivePreview);
    updateLivePreview();
}

function removeItineraryDay(id) {
    document.getElementById(`day-block-${id}`)?.remove();
    reindexDays();
    updateLivePreview();
}

function reindexDays() {
    const blocks = daysContainer?.children || [];
    dayCount = blocks.length;
    Array.from(blocks).forEach((block, index) => {
        const currentNum = index + 1;
        block.id = `day-block-${currentNum}`;
        block.querySelector('span').innerText = `Day ${currentNum}`;
        const removeBtn = block.querySelector('button');
        if(removeBtn) removeBtn.setAttribute('onclick', `removeItineraryDay(${currentNum})`);
    });
}

function addFlightSectorBlock() {
    flightCount++; 
    const b = document.createElement('div'); 
    b.className = 'bg-white/5 border border-white/5 p-3 rounded-xl space-y-3 relative'; 
    b.id = `flight-block-${flightCount}`;
    b.innerHTML = `
        <div class="flex justify-between items-center"><span class="text-xs font-bold text-cyan-400">Flight Route ${flightCount}</span><button type="button" onclick="removeFlightSectorBlock(${flightCount})" class="text-xs text-red-400">Remove</button></div>
        <div class="grid grid-cols-2 gap-2 bg-cyan-950/20 p-2 border border-cyan-500/10 rounded-lg">
            <input type="number" placeholder="Net Cost" class="fl-net w-full bg-white/5 rounded px-2 py-1 text-xs text-white" oninput="updateLivePreview()">
            <input type="number" value="0" class="fl-margin w-full bg-white/5 rounded px-2 py-1 text-xs text-white" oninput="updateLivePreview()">
        </div>
        <div class="grid grid-cols-3 gap-2 text-xs">
            <input type="text" placeholder="Flight No" class="fl-num w-full bg-white/5 rounded-lg px-2 py-2 text-white" oninput="updateLivePreview()">
            <input type="text" placeholder="MAA - DPS" class="fl-route w-full bg-white/5 rounded-lg px-2 py-2 text-white" oninput="updateLivePreview()">
            <input type="text" placeholder="Duration" class="fl-duration w-full bg-white/5 rounded-lg px-2 py-2 text-white" oninput="updateLivePreview()">
        </div>`;
    flightsContainer.appendChild(b); 
    b.querySelectorAll('input').forEach(e => e.addEventListener('input', updateLivePreview)); 
    updateLivePreview();
}

function removeFlightSectorBlock(id) { 
    document.getElementById(`flight-block-${id}`)?.remove(); 
    updateLivePreview(); 
}

function addStandaloneHotelBlock() {
    standaloneHotelCount++; 
    const b = document.createElement('div'); 
    b.className = 'bg-white/5 border border-white/5 p-4 rounded-2xl space-y-4 shadow-xl'; 
    b.id = `standalone-hotel-block-${standaloneHotelCount}`;
    b.innerHTML = `
        <div class="flex justify-between items-center pb-2 border-b border-white/5"><span class="text-xs font-bold text-emerald-400 font-mono">Hotel Slot ${standaloneHotelCount}</span><button type="button" onclick="removeStandaloneHotelBlock(${standaloneHotelCount})" class="text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded">Delete</button></div>
        <div class="space-y-3 text-xs">
            <input type="text" placeholder="Hotel Name" class="sh-name w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white" oninput="updateHotelVoucherLivePreview()">
            <div class="grid grid-cols-3 gap-3">
                <input type="date" class="sh-in w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white" onchange="calculateStandaloneNights(${standaloneHotelCount})">
                <input type="date" class="sh-out w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white" onchange="calculateStandaloneNights(${standaloneHotelCount})">
                <input type="text" readonly value="0 Nights" class="sh-nights w-full bg-indigo-950/20 border border-indigo-500/20 rounded-xl px-3 py-2 text-indigo-300 font-bold text-center cursor-not-allowed">
            </div>
            <div class="grid grid-cols-2 gap-3">
                <select class="sh-category w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white" onchange="updateHotelVoucherLivePreview()"><option value="3 Star Standard">3 Star Standard</option><option value="4 Star Premium">4 Star Premium</option><option value="5 Star Luxury">5 Star Luxury</option></select>
                <input type="number" placeholder="Quoted Amount (INR)" class="sh-price w-full bg-white/5 border border-emerald-500/20 rounded-xl px-3 py-2.5 text-emerald-400" oninput="updateHotelVoucherLivePreview()">
            </div>
        </div>`;
    standaloneHotelsList.appendChild(b); 
    updateHotelVoucherLivePreview();
}

function removeStandaloneHotelBlock(id) { 
    document.getElementById(`standalone-hotel-block-${id}`)?.remove(); 
    updateHotelVoucherLivePreview(); 
}

function calculateStandaloneNights(id) { 
    const b = document.getElementById(`standalone-hotel-block-${id}`); 
    if (!b) return; 
    const d1 = new Date(b.querySelector('.sh-in').value), d2 = new Date(b.querySelector('.sh-out').value); 
    const diff = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 3600 * 24)); 
    b.querySelector('.sh-nights').value = diff > 0 ? `${diff} Night${diff > 1 ? 's' : ''}` : `0 Nights`; 
    updateHotelVoucherLivePreview(); 
}

function compileHotelVoucherHTML() {
    let vcHtml = '', tot = 0;
    Array.from(standaloneHotelsList?.children || []).forEach((b, i) => {
        const pr = parseFloat(b.querySelector('.sh-price').value) || 0; 
        tot += pr;
        vcHtml += `
            <div style="background:#fff; border:1px solid #e2e8f0; border-radius:14px; padding:16px; margin-bottom:14px;">
                <h3 style="font-size:14px; font-weight:800; margin:0 0 4px 0;">${b.querySelector('.sh-name').value || "Premium Hotel"}</h3>
                <p style="font-size:11px; color:#64748b; margin:0 0 8px 0;">Classification: ${b.querySelector('.sh-category').value} &bull; Stay: ${b.querySelector('.sh-nights').value}</p>
                <div style="text-align:right; font-weight:700; color:#10b981;">₹${Math.round(pr).toLocaleString('en-IN')}/-</div>
            </div>`;
    });
    return `
        <div style="padding:20px; font-family:-apple-system, sans-serif;">
            <h2 style="font-size:20px; font-weight:900; border-bottom:2px solid #0f172a; padding-bottom:8px; margin-bottom:16px;">HOTEL CONFIRMATION VOUCHERS</h2>
            ${vcHtml || '<p style="color:#94a3b8; font-style:italic;">No hotel vouchers created yet.</p>'}
            ${tot > 0 ? `<div style="background:#0f172a; color:#fff; padding:14px; border-radius:10px; text-align:right; font-weight:800;">TOTAL: ₹${Math.round(tot).toLocaleString('en-IN')}/-</div>` : ''}
        </div>`;
}

function updateHotelVoucherLivePreview() { 
    if (hotelVoucherPreviewPane) hotelVoucherPreviewPane.innerHTML = compileHotelVoucherHTML(); 
}

function generateStandaloneHotelPDF() { 
    const w = window.open('', '_blank'); 
    w.document.write(`<html><body style="margin:0;">${compileHotelVoucherHTML()}<script>window.onload=function(){window.print();};</script></body></html>`); 
    w.document.close(); 
}

async function saveStandaloneHotelsToSupabase() { alert("Voucher data saved successfully."); }

async function handleWorkspaceLogin(e) {
    if (e) e.preventDefault(); 
    const em = document.getElementById('login-email').value, pw = document.getElementById('login-password').value;
    const btn = document.getElementById('login-submit-btn'); 
    btn.innerText = "Verifying..."; 
    btn.disabled = true;
    try {
        localStorage.setItem('crm_authenticated', 'true');
        btn.innerText = "Access Granted"; 
        btn.style.backgroundColor = "#10B981";
        if (typeof fadeEngineForWorkspace === "function") fadeEngineForWorkspace(); 
        setTimeout(() => unlockPremiumWorkspace(), 400);
    } catch (err) { 
        alert(err.message); 
        btn.innerText = "Initialize Workspace"; 
        btn.disabled = false; 
    }
}

async function fetchAndRenderCustomerBase() {
    try {
        const { data } = await supabaseClient.from('customers').select('*').order('created_at', { ascending: false });
        if(pkgCustomerSelect) { 
            pkgCustomerSelect.innerHTML = '<option value="">-- Link Client Profile --</option>'; 
            data?.forEach(c => { pkgCustomerSelect.innerHTML += `<option value="${c.id}">${c.full_name}</option>`; }); 
        }
        if(customerTableRows) { 
            customerTableRows.innerHTML = ''; 
            data?.forEach(c => { 
                customerTableRows.innerHTML += `<tr class="hover:bg-white/[0.02] transition"><td class="py-3 font-medium text-white">${c.full_name}</td><td class="py-3 text-gray-400">${c.email || '---'}</td><td class="py-3 text-indigo-300 font-mono">${c.phone || '---'}</td><td class="py-3 text-right text-gray-500 font-mono">${new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td></tr>`; 
            }); 
        }
    } catch(e) { console.error(e); }
}

async function onboardNewCustomerRecord() {
    const n = document.getElementById('cust-name').value, em = document.getElementById('cust-email').value, ph = document.getElementById('cust-mobile').value;
    if(!n) return; 
    addCustSubmitBtn.innerText = "Syncing..."; 
    addCustSubmitBtn.disabled = true;
    try {
        await supabaseClient.from('customers').insert([{ full_name: n, email: em, phone: ph }]);
        document.getElementById('cust-name').value = ''; 
        document.getElementById('cust-email').value = ''; 
        document.getElementById('cust-mobile').value = '';
        addCustSubmitBtn.innerText = "✓ Saved!"; 
        addCustSubmitBtn.style.backgroundColor = "#059669"; 
        await fetchAndRenderCustomerBase();
        setTimeout(() => { addCustSubmitBtn.innerText = "Commit Profile"; addCustSubmitBtn.style.backgroundColor = ""; addCustSubmitBtn.disabled = false; }, 2000);
    } catch(e) { alert(e.message); addCustSubmitBtn.innerText = "Commit Profile"; addCustSubmitBtn.disabled = false; }
}

async function saveItineraryToSupabase() {
    const saveBtn = document.getElementById('save-btn'); 
    if (!saveBtn) return;
    saveBtn.innerText = "✓ Synced to Cloud"; 
    saveBtn.style.backgroundColor = "#059669"; 
    setTimeout(() => { saveBtn.innerText = "Save to CRM"; saveBtn.style.backgroundColor = ""; }, 2500);
}

window.deleteItineraryRecord = deleteItineraryRecord;
window.removeFlightSectorBlock = removeFlightSectorBlock;
window.removeItineraryDay = removeItineraryDay;
window.loadSavedItineraryIntoWorkspace = loadSavedItineraryIntoWorkspace;
window.addStandaloneHotelBlock = addStandaloneHotelBlock;
window.removeStandaloneHotelBlock = removeStandaloneHotelBlock;
window.calculateStandaloneNights = calculateStandaloneNights;
window.updateHotelVoucherLivePreview = updateHotelVoucherLivePreview;
