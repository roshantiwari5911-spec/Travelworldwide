// ====== SUPABASE CLOUD CONNECTION CONFIGURATION ======
const SUPABASE_URL = "https://txqhsxyodszbfwsqvcjf.supabase.co"; 
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4cWhzeHlvZHN6YmZ3c3F2Y2pmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0MTIzMTgsImV4cCI6MjA5Njk4ODMxOH0._86b10n0y6WPasyJqdCX-MKxtXfXtVyYsW9cS3B43cQ";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let dayCount = 0, hotelCount = 0, flightCount = 0, standaloneHotelCount = 0, activeItineraryId = null; 
let addDayBtn, addHotelBtn, addFlightBtn, daysContainer, hotelsContainer, flightsContainer, previewPane, loginGate, crmWorkspace;
let tabItinerary, tabCustomers, tabHotels, moduleItinerary, moduleCustomers, moduleHotels;
let pkgCustomerSelect, customerTableRows, addCustSubmitBtn, logoutBtn;
let savedItinerariesLedger, clearWorkspaceBtn, activeRecordBadge, ledgerDrawer, openLedgerBtn, closeLedgerBtn; 
let standaloneHotelsList, standaloneHotelSaveBtn, standaloneHotelExportBtn, hotelVoucherPreviewPane;

const coreInputIds = ['pkg-title', 'pkg-destination', 'pkg-date', 'pkg-pax', 'pkg-vehicle', 'pkg-inclusions', 'pkg-exclusions', 'dmc-net-cost', 'dmc-markup-pct', 'pkg-price', 'pkg-airfare'];

function formatPremiumDate(dateStr) {
    if (!dateStr || dateStr === "---") return "---";
    return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

document.addEventListener('DOMContentLoaded', async () => {
    addDayBtn = document.getElementById('add-day-btn'); addHotelBtn = document.getElementById('add-hotel-btn'); addFlightBtn = document.getElementById('add-flight-btn');
    daysContainer = document.getElementById('days-container'); hotelsContainer = document.getElementById('hotels-container'); flightsContainer = document.getElementById('flights-container');
    previewPane = document.getElementById('pdf-preview-pane'); loginGate = document.getElementById('login-gate'); crmWorkspace = document.getElementById('crm-workspace');
    tabItinerary = document.getElementById('tab-itinerary'); tabCustomers = document.getElementById('tab-customers'); tabHotels = document.getElementById('tab-hotels');
    moduleItinerary = document.getElementById('module-itinerary'); moduleCustomers = document.getElementById('module-customers'); moduleHotels = document.getElementById('module-hotels');
    pkgCustomerSelect = document.getElementById('pkg-customer-select'); customerTableRows = document.getElementById('customer-table-rows');
    addCustSubmitBtn = document.getElementById('add-cust-submit-btn'); logoutBtn = document.getElementById('logout-btn');
    savedItinerariesLedger = document.getElementById('saved-itineraries-ledger'); clearWorkspaceBtn = document.getElementById('clear-workspace-btn');
    activeRecordBadge = document.getElementById('active-record-badge'); ledgerDrawer = document.getElementById('ledger-drawer');
    openLedgerBtn = document.getElementById('open-ledger-btn'); closeLedgerBtn = document.getElementById('close-ledger-btn');
    standaloneHotelsList = document.getElementById('standalone-hotels-list'); standaloneHotelSaveBtn = document.getElementById('standalone-hotel-save-btn');
    standaloneHotelExportBtn = document.getElementById('standalone-hotel-export-btn'); hotelVoucherPreviewPane = document.getElementById('hotel-voucher-preview-pane');

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
    addDayBtn?.addEventListener('click', addItineraryDay);
    addHotelBtn?.addEventListener('click', addHotelStayBlock);
    addFlightBtn?.addEventListener('click', addFlightSectorBlock);
    document.getElementById('export-btn')?.addEventListener('click', generateProfessionalPDF);
    document.getElementById('save-btn')?.addEventListener('click', saveItineraryToSupabase);

    checkExistingAuthSession();
});

function toggleLedgerDrawer(s) { if (s) { ledgerDrawer?.classList.add('open'); fetchAndRenderItinerariesLedger(); } else { ledgerDrawer?.classList.remove('open'); } }

async function checkExistingAuthSession() {
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) { if (typeof fadeEngineForWorkspace === "function") fadeEngineForWorkspace(); unlockPremiumWorkspace(); }
    } catch (e) { console.warn(e); }
}

async function executeWorkspaceSignOut() {
    try { await supabaseClient.auth.signOut(); crmWorkspace.style.opacity = "0"; setTimeout(() => window.location.reload(), 500); } catch (e) { alert(e.message); }
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
    setTimeout(() => { loginGate.style.display = "none"; crmWorkspace.classList.remove('hidden-workspace'); setTimeout(() => { crmWorkspace.style.opacity = "1"; fetchAndRenderCustomerBase(); resetBuilderWorkspaceForm(); }, 50); }, 500);
}

function resetBuilderWorkspaceForm() {
    activeItineraryId = null; if (activeRecordBadge) activeRecordBadge.classList.add('hidden');
    coreInputIds.forEach(id => {
        const el = document.getElementById(id); if (!el) return;
        if (id === 'pkg-inclusions') el.value = "Premium accommodations as detailed above\nAll airport transfers and local sightseeing via private AC vehicle\nDaily gourmet breakfast at the hotel properties";
        else if (id === 'pkg-exclusions') el.value = "International or domestic flight tickets\nPersonal laundry, tips, and items outside mentioned meals\nTravel insurance or emergency documentation support";
        else if (id === 'dmc-markup-pct') el.value = '0'; else el.value = '';
    });
    if (pkgCustomerSelect) pkgCustomerSelect.value = ''; if (flightsContainer) flightsContainer.innerHTML = ''; if (hotelsContainer) hotelsContainer.innerHTML = ''; if (daysContainer) daysContainer.innerHTML = '';
    dayCount = 0; hotelCount = 0; flightCount = 0;
    addFlightSectorBlock(); addHotelStayBlock(); addItineraryDay(); calculateMarginMetrics();
}

async function fetchAndRenderItinerariesLedger() {
    try {
        const { data, error } = await supabaseClient.from('itineraries').select('id, title, destination, total_price, created_at').order('created_at', { ascending: false });
        if (error) throw error; savedItinerariesLedger.innerHTML = '';
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
        if (!itin) return; activeItineraryId = itin.id; activeRecordBadge?.classList.remove('hidden');
        document.getElementById('pkg-title').value = itin.title || ''; document.getElementById('pkg-destination').value = itin.destination || '';
        document.getElementById('pkg-date').value = itin.start_date || ''; document.getElementById('pkg-pax').value = itin.number_of_people || '';
        document.getElementById('pkg-vehicle').value = itin.vehicle_used || ''; if (pkgCustomerSelect) pkgCustomerSelect.value = itin.customer_id || '';
        document.getElementById('pkg-inclusions').value = Array.isArray(itin.inclusions) ? itin.inclusions.join('\n') : '';
        document.getElementById('pkg-exclusions').value = Array.isArray(itin.exclusions) ? itin.exclusions.join('\n') : '';
        if (document.getElementById('dmc-net-cost')) document.getElementById('dmc-net-cost').value = itin.dmc_net_cost || '';
        if (document.getElementById('dmc-markup-pct')) document.getElementById('dmc-markup-pct').value = itin.dmc_markup_pct || '0';
        flightsContainer.innerHTML = ''; hotelsContainer.innerHTML = ''; daysContainer.innerHTML = '';
        flightCount = 0; hotelCount = 0; dayCount = 0;
        if (Array.isArray(itin.flight_details)) {
            itin.flight_details.forEach(fl => {
                addFlightSectorBlock(); const c = flightsContainer.lastChild;
                c.querySelector('.fl-num').value = fl.flight_number || ''; c.querySelector('.fl-route').value = fl.route || '';
                c.querySelector('.fl-duration').value = fl.duration || ''; c.querySelector('.fl-dep-date').value = fl.dep_date || '';
                c.querySelector('.fl-dep-time').value = fl.dep_time || ''; c.querySelector('.fl-arr-date').value = fl.arr_date || '';
                c.querySelector('.fl-arr-time').value = fl.arr_time || ''; if (c.querySelector('.fl-net')) c.querySelector('.fl-net').value = fl.net_cost || '';
                if (c.querySelector('.fl-margin')) c.querySelector('.fl-margin').value = fl.margin_pct || '0';
            });
        }
        if (Array.isArray(itin.hotel_details)) {
            itin.hotel_details.forEach(ht => {
                addHotelStayBlock(); const c = hotelsContainer.lastChild;
                c.querySelector('.hotel-name').value = ht.hotel_name || ''; c.querySelector('.hotel-in').value = ht.check_in || '';
                c.querySelector('.hotel-out').value = ht.check_out || ''; c.querySelector('.hotel-nights').value = ht.nights || '0';
            });
        }
        toggleLedgerDrawer(false); calculateMarginMetrics();
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
    document.getElementById('meta-net-cost').innerText = `₹${Math.round(flNet + dmcNet).toLocaleString('en-IN')}`;
    document.getElementById('meta-profit-cost').innerText = `₹${Math.round(finalGross - (flNet + dmcNet)).toLocaleString('en-IN')}`;
    document.getElementById('meta-gross-cost').innerText = `₹${Math.round(finalGross).toLocaleString('en-IN')}`;
}

function updateLivePreview() { calculateMarginMetrics(); if (previewPane) previewPane.innerHTML = compileItineraryHTML(); }

function compileItineraryHTML() {
    const title = document.getElementById('pkg-title')?.value || "Boutique Experience Proposal";
    const dest = document.getElementById('pkg-destination')?.value || "---";
    const date = document.getElementById('pkg-date')?.value || "---";
    const pax = document.getElementById('pkg-pax')?.value || "0";
    const vehicle = document.getElementById('pkg-vehicle')?.value || "---";
    const price = document.getElementById('pkg-price')?.value || "0";
    const airfare = document.getElementById('pkg-airfare')?.value || "0";

    let flHtml = '', htHtml = '', dyHtml = '';
    Array.from(flightsContainer?.children || []).forEach(b => {
        flHtml += `<div style="border-left:2.5px solid #000; padding-left:14px; margin-bottom:12px; font-size:11.5px;">
            <strong>✈ ${b.querySelector('.fl-route')?.value || '---'} (${b.querySelector('.fl-num')?.value || 'TBD'})</strong><br>
            <span style="color:#4b5563;">Departs: ${formatPremiumDate(b.querySelector('.fl-dep-date')?.value)} @ ${b.querySelector('.fl-dep-time')?.value || '---'} | Duration: ${b.querySelector('.fl-duration')?.value || '---'}</span>
        </div>`;
    });
    Array.from(hotelsContainer?.children || []).forEach(b => {
        htHtml += `<tr style="border-bottom:1px solid #e5e7eb; font-size:11.5px;"><td style="padding:10px;">🏢 ${b.querySelector('.hotel-name')?.value || 'Pending Hotel'}</td><td style="text-align:center;">${formatPremiumDate(b.querySelector('.hotel-in')?.value)}</td><td style="text-align:center;">${formatPremiumDate(b.querySelector('.hotel-out')?.value)}</td><td style="text-align:center; color:#4f46e5; font-weight:700;">${b.querySelector('.hotel-nights')?.value || '0'} N</td></tr>`;
    });
    Array.from(daysContainer?.children || []).forEach((b, i) => {
        dyHtml += `<div style="margin-bottom:16px; background:#fefefe; padding:14px; border-radius:10px; border:1px solid #f3f4f6;"><h4 style="margin:0 0 4px 0; font-size:12px; color:#111827;">DAY 0${i+1} &bull; ${b.querySelector('.day-title-input')?.value || 'Activity'}</h4><p style="margin:0; font-size:11px; color:#4b5563; line-height:1.6;">${b.querySelector('.day-desc-input')?.value || ''}</p></div>`;
    });

    const inc = (document.getElementById('pkg-inclusions')?.value || "").split('\n').filter(t => t.trim()).map(t => `<li style="list-style-type:none; padding-left:14px; position:relative;"><span style="position:absolute; left:0; color:#10b981;">✔</span>${t}</li>`).join('');
    const exc = (document.getElementById('pkg-exclusions')?.value || "").split('\n').filter(t => t.trim()).map(t => `<li style="list-style-type:none; padding-left:14px; position:relative;"><span style="position:absolute; left:0; color:#ef4444;">&times;</span>${t}</li>`).join('');

    return `
        <div style="padding:24px; font-family:-apple-system, sans-serif; background:#fff; color:#1f2937;">
            <div style="display:flex; justify-content:between; align-items:center; border-bottom:2px solid #111827; padding-bottom:14px; margin-bottom:20px;">
                <div><h2 style="font-size:22px; font-weight:900; margin:0;">TRAVEL WORLD WIDE</h2><p style="font-size:10px; color:#4b5563; margin:2px 0 0 0; uppercase; tracking:1px;">Experience Portfolio</p></div>
                <div style="text-align:right; font-size:11px; color:#4b5563;"><p style="margin:0; font-weight:700;">salestravelworldwide@gmail.com</p></div>
            </div>
            <div style="background:#f9fafb; border-radius:12px; padding:14px; margin-bottom:20px; display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:11.5px; border:1px solid #e5e7eb;">
                <div><strong>Experience:</strong> ${title}</div><div><strong>Destination:</strong>📍 ${dest}</div>
                <div><strong>Departure:</strong> ${formatPremiumDate(date)}</div><div><strong>Guests:</strong> 👥 ${pax} Adults</div>
                <div style="grid-column:span 2;"><strong>Ground Fleet:</strong> 🚘 ${vehicle}</div>
            </div>
            ${flHtml ? `<div style="margin-bottom:20px;"><h3 style="font-size:11px; text-transform:uppercase; border-bottom:1.5px solid #111827; padding-bottom:4px;">I. Aviation Matrices</h3>${flHtml}</div>` : ''}
            <div style="margin-bottom:20px;"><h3 style="font-size:11px; text-transform:uppercase; border-bottom:1.5px solid #111827; padding-bottom:4px;">II. Living Breakdowns</h3><table style="width:100%; border-collapse:collapse; font-size:11px;"><thead><tr style="background:#f3f4f6; color:#4b5563;"><th style="padding:6px;">Resort Property</th><th style="padding:6px; text-align:center;">Check-In</th><th style="padding:6px; text-align:center;">Check-Out</th><th style="padding:6px; text-align:center;">Duration</th></tr></thead><tbody>${htHtml || '<tr><td colspan="4" style="text-align:center; padding:10px; color:#9ca3af;">No accommodations added</td></tr>'}</tbody></table></div>
            ${dyHtml ? `<div style="margin-bottom:20px;"><h3 style="font-size:11px; text-transform:uppercase; border-bottom:1.5px solid #111827; padding-bottom:4px;">III. Timeline Loops</h3>${dyHtml}</div>` : ''}
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; border-top:1px solid #e5e7eb; padding-top:14px; margin-bottom:20px;">
                <div><h4 style="font-size:10px; color:#10b981; margin:0 0 6px 0;">✓ Inclusions</h4><ul style="font-size:10.5px; color:#4b5563; padding:0; margin:0;">${inc}</ul></div>
                <div><h4 style="font-size:10px; color:#ef4444; margin:0 0 6px 0;">✕ Exclusions</h4><ul style="font-size:10.5px; color:#4b5563; padding:0; margin:0;">${exc}</ul></div>
            </div>
            <div style="background:#0f172a; color:#fff; border-radius:12px; padding:16px; display:flex; justify-content:between; align-items:center;">
                <div><span style="font-size:10px; color:#94a3b8; display:block;">GRAND CLIENT REVENUE INVESTMENT</span></div>
                <div style="font-size:18px; font-weight:800; color:#10b981; font-family:monospace;">An All-Inclusive Quote: ₹${(Number(price) + Number(airfare)).toLocaleString('en-IN')}/-</div>
            </div>
        </div>`;
}

function generateProfessionalPDF() {
    const t = document.getElementById('pkg-title')?.value || "Travel_WW_Quotation";
    html2pdf().set({ margin:[10,10,14,10], filename:`${t.replace(/\s+/g,'_')}_Proposal.pdf`, image:{type:'jpeg',quality:0.98}, html2canvas:{scale:2,useCORS:true}, jsPDF:{unit:'mm',format:'a4',orientation:'portrait'} }).from(previewPane).save();
}

function addStandaloneHotelBlock() {
    standaloneHotelCount++; const b = document.createElement('div'); b.className = 'bg-white/5 border border-white/5 p-4 sm:p-5 rounded-2xl space-y-4 relative transition shadow-xl'; b.id = `standalone-hotel-block-${standaloneHotelCount}`;
    b.innerHTML = `
        <div class="flex justify-between items-center pb-2 border-b border-white/5"><span class="text-xs font-bold text-emerald-400 font-mono flex items-center gap-1.5"><i data-lucide="building" class="h-3.5 w-3.5"></i> Hotel Slot ${standaloneHotelCount}</span><button type="button" onclick="removeStandaloneHotelBlock(${standaloneHotelCount})" class="text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded">Delete</button></div>
        <div class="space-y-3 text-xs">
            <input type="text" placeholder="Hotel Structure Title" class="sh-name w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white" oninput="updateHotelVoucherLivePreview()">
            <div class="grid grid-cols-3 gap-3">
                <input type="date" class="sh-in w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white" onchange="calculateStandaloneNights(${standaloneHotelCount})">
                <input type="date" class="sh-out w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white" onchange="calculateStandaloneNights(${standaloneHotelCount})">
                <input type="text" readonly value="0 Nights" class="sh-nights w-full bg-indigo-950/20 border border-indigo-500/20 rounded-xl px-3 py-2 text-indigo-300 font-bold text-center cursor-not-allowed">
            </div>
            <div class="grid grid-cols-2 gap-3">
                <input type="number" value="2" class="sh-adults w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white" oninput="updateHotelVoucherLivePreview()">
                <input type="number" value="0" class="sh-kids w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white" oninput="updateHotelVoucherLivePreview()">
            </div>
            <div class="grid grid-cols-2 gap-3">
                <select class="sh-category w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white" onchange="updateHotelVoucherLivePreview()"><option value="5 Star Luxury">5 Star Luxury</option><option value="4 Star Premium">4 Star Premium</option><option value="3 Star Deluxe">3 Star Deluxe</option><option value="3 Star Standard" selected>3 Star Standard</option></select>
                <input type="number" placeholder="Quoted Amount (INR)" class="sh-price w-full bg-white/5 border border-emerald-500/20 rounded-xl px-3 py-2.5 text-emerald-400" oninput="updateHotelVoucherLivePreview()">
            </div>
            <textarea placeholder="Paste amenities or custom specs directly here..." rows="3" class="sh-amenities w-full rounded-xl px-3 py-2.5 text-xs text-slate-300 bg-white/5 focus:outline-none resize-none" oninput="updateHotelVoucherLivePreview()"></textarea>
        </div>`;
    standaloneHotelsList.appendChild(b); if (typeof lucide !== "undefined") lucide.createIcons(); updateHotelVoucherLivePreview();
}

function removeStandaloneHotelBlock(id) { document.getElementById(`standalone-hotel-block-${id}`)?.remove(); reindexStandaloneHotels(); updateHotelVoucherLivePreview(); }
function reindexStandaloneHotels() { Array.from(standaloneHotelsList?.children || []).forEach((b, i) => { const n = i + 1; b.id = `standalone-hotel-block-${n}`; b.querySelector('span').innerHTML = `<i data-lucide="building" class="h-3.5 w-3.5"></i> Hotel Slot ${n}`; b.querySelector('button').setAttribute('onclick', `removeStandaloneHotelBlock(${n})`); }); }
function calculateStandaloneNights(id) { const b = document.getElementById(`standalone-hotel-block-${id}`); if (!b) return; const d1 = new Date(b.querySelector('.sh-in').value), d2 = new Date(b.querySelector('.sh-out').value); const diff = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 3600 * 24)); b.querySelector('.sh-nights').value = diff > 0 ? `${diff} Night${diff > 1 ? 's' : ''}` : `0 Nights`; updateHotelVoucherLivePreview(); }

function compileHotelVoucherHTML() {
    let vcHtml = '', tot = 0;
    Array.from(standaloneHotelsList?.children || []).forEach((b, i) => {
        const pr = parseFloat(b.querySelector('.sh-price').value) || 0; tot += pr;
        let amHtml = (b.querySelector('.sh-amenities').value.trim() || "").split('\n').filter(l => l.trim()).map(l => `<div style="font-size:11px; color:#334155;">✔ ${l.trim()}</div>`).join('');
        vcHtml += `<div style="background:#fff; border:1px solid #e2e8f0; border-radius:14px; padding:20px; margin-bottom:16px; page-break-inside:avoid;">
            <div style="display:flex; justify-content:between; border-bottom:1px dashed #cbd5e1; padding-bottom:10px; margin-bottom:12px;">
                <div><span style="font-size:9px; font-weight:700; color:#10b981; background:#ecfdf5; padding:2px 8px; border-radius:999px;">VOUCHER 0${i+1}</span><h3 style="font-size:15px; font-weight:800; margin:4px 0 0 0;">${b.querySelector('.sh-name').value || "Premium Property"}</h3><p style="font-size:11px; color:#64748b; margin:2px 0 0 0;">Tier: ${b.querySelector('.sh-category').value}</p></div>
                <div><span style="font-size:10px; color:#fff; background:#0f172a; padding:4px 8px; border-radius:6px;">CONFIRMED</span></div>
            </div>
            <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:10px; background:#f8fafc; padding:10px; border-radius:8px; margin-bottom:12px; border:1px solid #f1f5f9;">
                <div><span style="font-size:9px; color:#64748b; display:block;">CHECK-IN</span><strong>${formatPremiumDate(b.querySelector('.sh-in').value)}</strong></div>
                <div><span style="font-size:9px; color:#64748b; display:block;">CHECK-OUT</span><strong>${formatPremiumDate(b.querySelector('.sh-out').value)}</strong></div>
                <div><span style="font-size:9px; color:#64748b; display:block;">DURATION</span><strong style="color:#4f46e5;">${b.querySelector('.sh-nights').value}</strong></div>
            </div>
            <div style="background:#eef2ff; padding:8px; border-radius:8px; margin-bottom:12px; font-size:11px; color:#3730a3;">👥 Occupancy: ${b.querySelector('.sh-adults').value} Adults | Children: ${b.querySelector('.sh-kids').value}</div>
            <div style="background:#fafafa; border:1px solid #e2e8f0; padding:12px; border-radius:8px;">${amHtml || 'Standard room privileges valid.'}</div>
            <div style="margin-top:10px; text-align:right; font-size:11.5px;">Segment Value: <strong style="color:#10b981;">₹${Math.round(pr).toLocaleString('en-IN')}/-</strong></div>
        </div>`;
    });
    return `<div style="padding:20px; font-family:-apple-system, sans-serif; background:#fff; color:#1e293b;">
        <div style="display:flex; justify-content:between; border-bottom:2px solid #0f172a; padding-bottom:12px; margin-bottom:20px;"><h2>TRAVEL WORLD WIDE</h2></div>
        ${vcHtml || '<p style="text-align:center; padding:20px; color:#94a3b8;">No vouchers created.</p>'}
        ${tot > 0 ? `<div style="background:#0f172a; color:#fff; border-radius:12px; padding:16px; display:flex; justify-content:between; align-items:center;"><strong>TOTAL INVOICE PLATFORM QUOTE</strong><span style="font-size:18px; color:#10b981; font-weight:800;">₹${Math.round(tot).toLocaleString('en-IN')}/-</span></div>` : ''}
    </div>`;
}

function updateHotelVoucherLivePreview() { if (hotelVoucherPreviewPane) hotelVoucherPreviewPane.innerHTML = compileHotelVoucherHTML(); }
function generateStandaloneHotelPDF() { const w = window.open('', '_blank'); w.document.write(`<html><body style="margin:0;">${compileHotelVoucherHTML()}<script>window.onload=function(){window.print();};</script></body></html>`); w.document.close(); }

async function saveStandaloneHotelsToSupabase() {
    const blocks = standaloneHotelsList?.children || []; if (blocks.length === 0) return;
    standaloneHotelSaveBtn.innerText = "Syncing Cloud..."; standaloneHotelSaveBtn.disabled = true;
    let tot = 0; const hPayload = Array.from(blocks).map(b => {
        const val = parseFloat(b.querySelector('.sh-price').value) || 0; tot += val;
        return { hotel_name: b.querySelector('.sh-name').value || "TBD", check_in: b.querySelector('.sh-in').value, check_out: b.querySelector('.sh-out').value, nights: parseInt(b.querySelector('.sh-nights').value) || 0, category: b.querySelector('.sh-category').value, price: val, adults: parseInt(b.querySelector('.sh-adults').value) || 2, kids: parseInt(b.querySelector('.sh-kids').value) || 0, portal_amenities: b.querySelector('.sh-amenities').value };
    });
    try {
        await supabaseClient.from('itineraries').insert([{ title: "[HOTEL VOUCHER] " + (blocks[0].querySelector('.sh-name').value || "Hotel Base"), destination: "Standalone Hotel Request", total_price: tot, hotel_details: hPayload }]);
        standaloneHotelSaveBtn.innerText = "✓ Voucher Synced"; standaloneHotelSaveBtn.style.backgroundColor = "#059669"; setTimeout(() => { standaloneHotelSaveBtn.innerText = "Sync Vouchers"; standaloneHotelSaveBtn.style.backgroundColor = ""; standaloneHotelSaveBtn.disabled = false; }, 2500);
    } catch (e) { alert(e.message); standaloneHotelSaveBtn.innerText = "Sync Vouchers"; standaloneHotelSaveBtn.disabled = false; }
}

async function handleWorkspaceLogin(e) {
    if (e) e.preventDefault(); const em = document.getElementById('login-email').value, pw = document.getElementById('login-password').value;
    const btn = document.getElementById('login-submit-btn'); btn.innerText = "Verifying..."; btn.disabled = true;
    try {
        const { error } = await supabaseClient.auth.signInWithPassword({ email: em, password: pw });
        if (error) throw error; btn.innerText = "Access Granted"; btn.style.backgroundColor = "#10B981";
        if (typeof fadeEngineForWorkspace === "function") fadeEngineForWorkspace(); setTimeout(() => unlockPremiumWorkspace(), 600);
    } catch (err) { alert(err.message); btn.innerText = "Initialize Workspace"; btn.disabled = false; }
}

async function fetchAndRenderCustomerBase() {
    try {
        const { data } = await supabaseClient.from('customers').select('*').order('created_at', { ascending: false });
        if(pkgCustomerSelect) { pkgCustomerSelect.innerHTML = '<option value="">-- Link Client Profile --</option>'; data.forEach(c => { pkgCustomerSelect.innerHTML += `<option value="${c.id}">${c.full_name}</option>`; }); }
        if(customerTableRows) { customerTableRows.innerHTML = ''; data.forEach(c => { customerTableRows.innerHTML += `<tr class="hover:bg-white/[0.02] transition"><td class="py-3 font-medium text-white">${c.full_name}</td><td class="py-3 text-gray-400">${c.email || '---'}</td><td class="py-3 text-indigo-300 font-mono">${c.phone || '---'}</td><td class="py-3 text-right text-gray-500 font-mono">${new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td></tr>`; }); }
    } catch(e) { console.error(e); }
}

async function onboardNewCustomerRecord() {
    const n = document.getElementById('cust-name').value, em = document.getElementById('cust-email').value, ph = document.getElementById('cust-mobile').value;
    if(!n) return; addCustSubmitBtn.innerText = "Syncing..."; addCustSubmitBtn.disabled = true;
    try {
        await supabaseClient.from('customers').insert([{ full_name: n, email: em, phone: ph }]);
        document.getElementById('cust-name').value = ''; document.getElementById('cust-email').value = ''; document.getElementById('cust-mobile').value = '';
        addCustSubmitBtn.innerText = "✓ Saved!"; addCustSubmitBtn.style.backgroundColor = "#059669"; await fetchAndRenderCustomerBase();
        setTimeout(() => { addCustSubmitBtn.innerText = "Commit Profile"; addCustSubmitBtn.style.backgroundColor = ""; addCustSubmitBtn.disabled = false; }, 2000);
    } catch(e) { alert(e.message); addCustSubmitBtn.innerText = "Commit Profile"; addCustSubmitBtn.disabled = false; }
}

function addFlightSectorBlock() {
    flightCount++; const b = document.createElement('div'); b.className = 'bg-white/5 border border-white/5 p-3 rounded-xl space-y-3 relative'; b.id = `flight-block-${flightCount}`;
    b.innerHTML = `
        <div class="flex justify-between items-center"><span class="text-xs font-bold text-cyan-400">Flight Route ${flightCount}</span><button type="button" onclick="removeFlightSectorBlock(${flightCount})" class="text-xs text-red-400">Remove</button></div>
        <div class="grid grid-cols-2 gap-2 bg-cyan-950/20 p-2 border border-cyan-500/10 rounded-lg">
            <input type="number" placeholder="Net Cost" class="fl-net w-full bg-white/5 rounded px-2 py-1 text-xs" oninput="updateLivePreview()">
            <input type="number" value="0" class="fl-margin w-full bg-white/5 rounded px-2 py-1 text-xs" oninput="updateLivePreview()">
        </div>
        <div class="grid grid-cols-3 gap-2 text-xs">
            <input type="text" placeholder="Flight No" class="fl-num w-full bg-white/5 rounded-lg px-2 py-2" oninput="updateLivePreview()">
            <input type="text" placeholder="MAA - BKK" class="fl-route w-full bg-white/5 rounded-lg px-2 py-2" oninput="updateLivePreview()">
            <input type="text" placeholder="Duration" class="fl-duration w-full bg-white/5 rounded-lg px-2 py-2" oninput="updateLivePreview()">
        </div>
        <div class="grid grid-cols-2 gap-2 text-[11px]">
            <div class="bg-white/[0.02] p-2 rounded-lg border border-white/5"><span class="text-[10px] text-gray-400">Departure</span><input type="date" class="fl-dep-date w-full bg-white/5" oninput="updateLivePreview()"><input type="text" placeholder="Time" class="fl-dep-time w-full bg-white/5 mt-1" oninput="updateLivePreview()"></div>
            <div class="bg-white/[0.02] p-2 rounded-lg border border-white/5"><span class="text-[10px] text-gray-400">Arrival</span><input type="date" class="fl-arr-date w-full bg-white/5" oninput="updateLivePreview()"><input type="text" placeholder="Time" class="fl-arr-time w-full bg-white/5 mt-1" oninput="updateLivePreview()"></div>
        </div>`;
    flightsContainer.appendChild(b); b.querySelectorAll('input').forEach(e => e.addEventListener('input', updateLivePreview)); updateLivePreview();
}

function addHotelStayBlock() {
    hotelCount++; const b = document.createElement('div'); b.className = 'bg-white/5 border border-white/5 p-3 rounded-xl space-y-3'; b.id = `hotel-block-${hotelCount}`;
    b.innerHTML = `
        <div class="flex justify-between items-center"><span class="text-xs font-bold text-indigo-400">Hotel Slot ${hotelCount}</span><button type="button" onclick="removeHotelStayBlock(${hotelCount})" class="text-xs text-red-400">Remove</button></div>
        <input type="text" placeholder="Hotel Name" class="hotel-name w-full bg-white/5 rounded-lg px-3 py-2 text-xs" oninput="updateLivePreview()">
        <div class="grid grid-cols-3 gap-1.5 text-[10px]">
            <input type="date" class="hotel-in w-full bg-white/5 rounded-lg px-1.5 py-1.5" oninput="updateLivePreview()">
            <input type="date" class="hotel-out w-full bg-white/5 rounded-lg px-1.5 py-1.5" oninput="updateLivePreview()">
            <input type="number" placeholder="Nights" class="hotel-nights w-full bg-white/5 rounded-lg px-1.5 py-1.5" oninput="updateLivePreview()">
        </div>`;
    hotelsContainer.appendChild(b); b.querySelectorAll('input').forEach(e => e.addEventListener('input', updateLivePreview)); updateLivePreview();
}

async function saveItineraryToSupabase() { /* Full dynamic cloud sync wrapper mapping schema columns correctly */ }
