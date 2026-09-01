// ====== SUPABASE CLOUD CONNECTION CONFIGURATION ======
const SUPABASE_URL = "https://txqhsxyodszbfwsqvcjf.supabase.co"; 
const SUPABASE_ANON_KEY = "sb_publishable_l2-bk_euDS6C-Yf6zEgDog_pnkW5F8Q";

// Free Groq Cloud Key for Fast DMC AI Extraction
const GROQ_API_KEY = "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";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// =====================================================

let dayCount = 0;
let hotelCount = 0;
let flightCount = 0;
let standaloneHotelCount = 0; 
let activeItineraryId = null; 

let addDayBtn, addHotelBtn, addFlightBtn, daysContainer, hotelsContainer, flightsContainer, previewPane, loginGate, crmWorkspace;
let tabItinerary, tabCustomers, tabHotels, tabAiBuild;
let moduleItinerary, moduleCustomers, moduleHotels, moduleAiBuild;
let pkgCustomerSelect, customerTableRows, addCustSubmitBtn, logoutBtn;
let savedItinerariesLedger, clearWorkspaceBtn, activeRecordBadge, ledgerDrawer, openLedgerBtn, closeLedgerBtn; 
let standaloneHotelsList, standaloneHotelSaveBtn, standaloneHotelExportBtn, hotelVoucherPreviewPane;

// AI Freestyle Build Elements
let aiFreeRawText, aiFreeGenerateBtn, aiPricingNet, aiPricingMarkupVal, aiMarkupLabel;
let markupModePctBtn, markupModeFlatBtn, aiPricingMarginDisplay, aiPricingGrandTotal;
let aiRefinePromptInput, aiRefineSubmitBtn, aiSaveCloudBtn, aiExportPdfBtn, aiQuotePreviewPane, aiCanvasStatus;

// Per-Person & Kids & Multi-Option Elements
let aiPaxAdults, aiNetPerAdult, aiPaxKids, aiNetPerKid, aiPerAdultQuoted, aiPerKidQuoted, aiKidsSummaryRow;
let aiAirfarePerPax, aiAirfareTotal, flightPasteDropzone, flightPasteStatus, aiOptionsPricingList;

let currentAiMarkupType = 'pct'; // 'pct' | 'flat'
let currentAiNetCost = 0;
let currentAiMarkupVal = 15;
let currentAiData = null;
let activeSelectedOptionIndex = 0;

const coreInputIds = [
    'pkg-title', 'pkg-destination', 'pkg-date', 'pkg-pax', 'pkg-vehicle', 
    'pkg-inclusions', 'pkg-exclusions', 'dmc-net-cost', 'dmc-markup-pct', 
    'pkg-price', 'pkg-airfare'
];

function formatPremiumDate(dateStr) {
    if (!dateStr || dateStr === "---" || dateStr === "") return "---";
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
        return dateStr;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    // Core Elements
    addDayBtn = document.getElementById('add-day-btn');
    addHotelBtn = document.getElementById('add-hotel-btn');
    addFlightBtn = document.getElementById('add-flight-btn');
    daysContainer = document.getElementById('days-container');
    hotelsContainer = document.getElementById('hotels-container');
    flightsContainer = document.getElementById('flights-container');
    previewPane = document.getElementById('pdf-preview-pane');
    loginGate = document.getElementById('login-gate');
    crmWorkspace = document.getElementById('crm-workspace');
    
    // Tabs & Modules
    tabItinerary = document.getElementById('tab-itinerary');
    tabCustomers = document.getElementById('tab-customers');
    tabHotels = document.getElementById('tab-hotels'); 
    tabAiBuild = document.getElementById('tab-ai-build');

    moduleItinerary = document.getElementById('module-itinerary');
    moduleCustomers = document.getElementById('module-customers');
    moduleHotels = document.getElementById('module-hotels'); 
    moduleAiBuild = document.getElementById('module-ai-build');
    
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

    // AI Freestyle Builder UI
    aiFreeRawText = document.getElementById('ai-free-raw-text');
    aiFreeGenerateBtn = document.getElementById('ai-free-generate-btn');
    aiPricingNet = document.getElementById('ai-pricing-net');
    aiPricingMarkupVal = document.getElementById('ai-pricing-markup-val');
    aiMarkupLabel = document.getElementById('ai-markup-label');
    markupModePctBtn = document.getElementById('markup-mode-pct-btn');
    markupModeFlatBtn = document.getElementById('markup-mode-flat-btn');
    aiPricingMarginDisplay = document.getElementById('ai-pricing-margin-display');
    aiPricingGrandTotal = document.getElementById('ai-pricing-grand-total');
    aiRefinePromptInput = document.getElementById('ai-refine-prompt-input');
    aiRefineSubmitBtn = document.getElementById('ai-refine-submit-btn');
    aiSaveCloudBtn = document.getElementById('ai-save-cloud-btn');
    aiExportPdfBtn = document.getElementById('ai-export-pdf-btn');
    aiQuotePreviewPane = document.getElementById('ai-quote-preview-pane');
    aiCanvasStatus = document.getElementById('ai-canvas-status');

    // Per Person & Kids & Flights UI
    aiPaxAdults = document.getElementById('ai-pax-adults');
    aiNetPerAdult = document.getElementById('ai-net-per-adult');
    aiPaxKids = document.getElementById('ai-pax-kids');
    aiNetPerKid = document.getElementById('ai-net-per-kid');
    aiPerAdultQuoted = document.getElementById('ai-per-adult-quoted');
    aiPerKidQuoted = document.getElementById('ai-per-kid-quoted');
    aiKidsSummaryRow = document.getElementById('ai-kids-summary-row');
    aiAirfarePerPax = document.getElementById('ai-airfare-per-pax');
    aiAirfareTotal = document.getElementById('ai-airfare-total');
    flightPasteDropzone = document.getElementById('flight-paste-dropzone');
    flightPasteStatus = document.getElementById('flight-paste-status');
    aiOptionsPricingList = document.getElementById('ai-options-pricing-list');

    // Tab Listeners
    tabItinerary?.addEventListener('click', () => switchCrmModule('itinerary'));
    tabCustomers?.addEventListener('click', () => switchCrmModule('customers'));
    tabHotels?.addEventListener('click', () => switchCrmModule('hotels'));
    tabAiBuild?.addEventListener('click', () => switchCrmModule('ai-build'));
    
    addCustSubmitBtn?.addEventListener('click', onboardNewCustomerRecord);
    logoutBtn?.addEventListener('click', executeWorkspaceSignOut);
    clearWorkspaceBtn?.addEventListener('click', resetBuilderWorkspaceForm);

    openLedgerBtn?.addEventListener('click', () => toggleLedgerDrawer(true));
    closeLedgerBtn?.addEventListener('click', () => toggleLedgerDrawer(false));

    document.getElementById('standalone-add-hotel-btn')?.addEventListener('click', addStandaloneHotelBlock);
    standaloneHotelExportBtn?.addEventListener('click', generateStandaloneHotelPDF);
    standaloneHotelSaveBtn?.addEventListener('click', saveStandaloneHotelsToSupabase);

    document.getElementById('login-submit-btn')?.addEventListener('click', handleWorkspaceLogin);

    // AI Build Tab Event Listeners
    aiFreeGenerateBtn?.addEventListener('click', handleAutonomousAiBuild);
    aiRefineSubmitBtn?.addEventListener('click', handleAiRefinePrompt);
    aiExportPdfBtn?.addEventListener('click', exportAiBuiltProposalPDF);
    aiSaveCloudBtn?.addEventListener('click', saveAiBuiltProposalToSupabase);
    
    markupModePctBtn?.addEventListener('click', () => setAiMarkupMode('pct'));
    markupModeFlatBtn?.addEventListener('click', () => setAiMarkupMode('flat'));
    
    // Pricing Auto-Calculation Bindings
    aiPaxAdults?.addEventListener('input', () => { syncAllOptionsCalculations(); });
    aiPaxKids?.addEventListener('input', () => { syncAllOptionsCalculations(); });
    aiPricingMarkupVal?.addEventListener('input', () => { syncAllOptionsCalculations(); });
    aiNetPerAdult?.addEventListener('input', () => { syncAllOptionsCalculations(); });
    aiNetPerKid?.addEventListener('input', () => { syncAllOptionsCalculations(); });
    
    aiAirfarePerPax?.addEventListener('input', () => {
        const adults = parseInt(aiPaxAdults?.value) || 0;
        const kids = parseInt(aiPaxKids?.value) || 0;
        const totalPax = Math.max(1, adults + kids);
        const perPax = parseFloat(aiAirfarePerPax?.value) || 0;
        if (aiAirfareTotal) aiAirfareTotal.value = Math.round(perPax * totalPax);
        syncAllOptionsCalculations();
    });

    aiAirfareTotal?.addEventListener('input', () => {
        syncAllOptionsCalculations();
    });

    // Vision OCR Paste Handler
    flightPasteDropzone?.addEventListener('paste', handleFlightScreenshotPaste);
    window.addEventListener('paste', (e) => {
        if (!moduleAiBuild?.classList.contains('hidden') && e.clipboardData?.files?.length > 0) {
            handleFlightScreenshotPaste(e);
        }
    });

    aiRefinePromptInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleAiRefinePrompt();
    });

    coreInputIds.forEach(id => {
        document.getElementById(id)?.addEventListener('input', updateLivePreview);
    });

    addDayBtn?.addEventListener('click', () => addItineraryDay());
    addHotelBtn?.addEventListener('click', () => addHotelStayBlock());
    addFlightBtn?.addEventListener('click', () => addFlightSectorBlock());
    
    document.getElementById('export-btn')?.addEventListener('click', generateProfessionalPDF);
    document.getElementById('save-btn')?.addEventListener('click', saveItineraryToSupabase);

    checkExistingAuthSession();
});

// ==============================================================
// DYNAMIC GROQ MODEL SELECTOR
// ==============================================================
async function getLiveWorkingGroqModel() {
    try {
        const res = await fetch("https://api.groq.com/openai/v1/models", {
            headers: { "Authorization": `Bearer ${GROQ_API_KEY}` }
        });
        if (res.ok) {
            const data = await res.json();
            const valid = data.data
                .map(m => m.id)
                .filter(id => !id.includes("whisper") && !id.includes("guard") && !id.includes("tts") && !id.includes("vision") && !id.includes("orpheus") && !id.includes("canopylabs"));
            
            if (valid.length > 0) {
                const preferred = valid.find(id => id.includes("llama-3.1-8b") || id.includes("llama3-8b") || id.includes("mixtral"));
                return preferred || valid[0];
            }
        }
    } catch (e) {
        console.warn("Live text model query failed:", e);
    }
    return "llama-3.1-8b-instant";
}

// ==============================================================
// MODULE TAB SWITCHING
// ==============================================================
function switchCrmModule(m) {
    const unselected = "text-[11px] bg-white/5 text-gray-300 hover:bg-white/10 font-semibold px-3 py-1.5 rounded-lg transition";
    const selected = "text-[11px] bg-white text-black font-semibold px-3 py-1.5 rounded-lg shadow transition";
    const aiUnselected = "text-[11px] bg-gradient-to-r from-purple-600/30 to-indigo-600/30 text-purple-200 border border-purple-500/40 hover:bg-purple-600/40 font-semibold px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5";
    const aiSelected = "text-[11px] bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold px-3.5 py-1.5 rounded-lg shadow-lg shadow-purple-500/25 transition flex items-center gap-1.5";

    tabItinerary.className = unselected; 
    tabCustomers.className = unselected; 
    tabHotels.className = unselected + " border border-dashed border-indigo-500/30";
    tabAiBuild.className = aiUnselected;
    
    moduleItinerary.classList.add('hidden'); 
    moduleCustomers.classList.add('hidden'); 
    moduleHotels.classList.add('hidden');
    moduleAiBuild.classList.add('hidden');
    
    if (m === 'itinerary') { 
        tabItinerary.className = selected; 
        moduleItinerary.classList.remove('hidden'); 
        if (openLedgerBtn) openLedgerBtn.style.display = 'flex'; 
        updateLivePreview(); 
    } else if (m === 'customers') { 
        tabCustomers.className = selected; 
        moduleCustomers.classList.remove('hidden'); 
        if (openLedgerBtn) openLedgerBtn.style.display = 'none'; 
        toggleLedgerDrawer(false); 
        fetchAndRenderCustomerBase(); 
    } else if (m === 'hotels') { 
        tabHotels.className = selected + " border border-indigo-500/50"; 
        moduleHotels.classList.remove('hidden'); 
        if (openLedgerBtn) openLedgerBtn.style.display = 'none'; 
        toggleLedgerDrawer(false); 
        if (standaloneHotelsList?.children.length === 0) addStandaloneHotelBlock(); else updateHotelVoucherLivePreview(); 
    } else if (m === 'ai-build') {
        tabAiBuild.className = aiSelected;
        moduleAiBuild.classList.remove('hidden');
        if (openLedgerBtn) openLedgerBtn.style.display = 'none';
        toggleLedgerDrawer(false);
    }
    if (typeof lucide !== "undefined") lucide.createIcons();
}

// ==============================================================
// MULTI-OPTION PRICING ARCHITECTURE
// ==============================================================
function setAiMarkupMode(mode) {
    currentAiMarkupType = mode;
    if (mode === 'pct') {
        markupModePctBtn.className = "px-2.5 py-1 bg-indigo-600 text-white rounded-md transition";
        markupModeFlatBtn.className = "px-2.5 py-1 text-slate-400 hover:text-white rounded-md transition";
        aiMarkupLabel.innerText = "Global Markup (%)";
        if (!aiPricingMarkupVal.value || aiPricingMarkupVal.value > 100) aiPricingMarkupVal.value = 15;
    } else {
        markupModeFlatBtn.className = "px-2.5 py-1 bg-indigo-600 text-white rounded-md transition";
        markupModePctBtn.className = "px-2.5 py-1 text-slate-400 hover:text-white rounded-md transition";
        aiMarkupLabel.innerText = "Flat Markup (₹ INR)";
        if (!aiPricingMarkupVal.value || aiPricingMarkupVal.value <= 100) aiPricingMarkupVal.value = 15000;
    }
    syncAllOptionsCalculations();
}

function renderLeftOptionsPricingControls() {
    if (!aiOptionsPricingList) return;

    if (currentAiData && Array.isArray(currentAiData.hotel_options) && currentAiData.hotel_options.length > 0) {
        aiOptionsPricingList.innerHTML = currentAiData.hotel_options.map((opt, idx) => {
            const isActive = idx === activeSelectedOptionIndex;
            return `
                <div class="p-3.5 rounded-xl border transition cursor-pointer ${isActive ? 'bg-indigo-950/40 border-indigo-500 shadow-lg shadow-indigo-500/10' : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'}" onclick="selectActiveOptionTier(${idx})">
                    <div class="flex justify-between items-center mb-2">
                        <span class="font-bold text-xs ${isActive ? 'text-indigo-300' : 'text-slate-300'}">${opt.option_name || `Option ${idx + 1}`}</span>
                        <span class="text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${isActive ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}">
                            ${isActive ? 'Active Tier' : 'Select'}
                        </span>
                    </div>
                    <div class="grid grid-cols-2 gap-2" onclick="event.stopPropagation()">
                        <div>
                            <span class="text-[9px] text-slate-400 block mb-0.5">Adult Net (₹ / Pax)</span>
                            <input type="number" value="${Math.round(opt.per_person_inr || 0)}" class="opt-adult-net-input w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none" oninput="updateOptionCustomPrice(${idx}, 'adult', this.value)">
                        </div>
                        <div>
                            <span class="text-[9px] text-slate-400 block mb-0.5">Kid Net (₹ / Kid)</span>
                            <input type="number" value="${Math.round(opt.kid_net_inr || 0)}" class="opt-kid-net-input w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none" oninput="updateOptionCustomPrice(${idx}, 'kid', this.value)">
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } else {
        aiOptionsPricingList.innerHTML = `
            <div class="p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-xs space-y-2">
                <div class="flex justify-between items-center">
                    <span class="font-bold text-white">Default Package Rate</span>
                    <span class="text-[10px] text-slate-500 font-mono">Option 1</span>
                </div>
                <div class="grid grid-cols-2 gap-2">
                    <div>
                        <span class="text-[9px] text-slate-400 block mb-0.5">Adult Net (₹ / Pax)</span>
                        <input type="number" id="ai-net-per-adult" value="${Math.round(currentAiData?.adult_net_cost_per_person || 0)}" placeholder="0" class="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none" oninput="if(currentAiData){currentAiData.adult_net_cost_per_person = parseFloat(this.value)||0;} syncAllOptionsCalculations();">
                    </div>
                    <div>
                        <span class="text-[9px] text-slate-400 block mb-0.5">Kid Net (₹ / Kid)</span>
                        <input type="number" id="ai-net-per-kid" value="${Math.round(currentAiData?.kid_net_cost_per_person || 0)}" placeholder="0" class="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none" oninput="if(currentAiData){currentAiData.kid_net_cost_per_person = parseFloat(this.value)||0;} syncAllOptionsCalculations();">
                    </div>
                </div>
            </div>
        `;
    }
}

function selectActiveOptionTier(index) {
    activeSelectedOptionIndex = index;
    renderLeftOptionsPricingControls();
    syncAllOptionsCalculations();
}

function updateOptionCustomPrice(optIdx, type, value) {
    if (currentAiData?.hotel_options?.[optIdx]) {
        if (type === 'adult') {
            currentAiData.hotel_options[optIdx].per_person_inr = parseFloat(value) || 0;
        } else {
            currentAiData.hotel_options[optIdx].kid_net_inr = parseFloat(value) || 0;
        }
    }
    syncAllOptionsCalculations();
}

function syncAllOptionsCalculations() {
    const adults = parseInt(aiPaxAdults?.value) || 2;
    const kids = parseInt(aiPaxKids?.value) || 0;
    const totalPax = Math.max(1, adults + kids);
    const markup = parseFloat(aiPricingMarkupVal?.value) || 0;
    const airfare = parseFloat(aiAirfareTotal?.value) || 0;

    currentAiMarkupVal = markup;

    if (currentAiData?.hotel_options && currentAiData.hotel_options.length > 0) {
        currentAiData.hotel_options.forEach((opt) => {
            const adultNet = parseFloat(opt.per_person_inr) || 0;
            const kidNet = parseFloat(opt.kid_net_inr) || 0;
            const totalNet = (adults * adultNet) + (kids * kidNet);

            let margin = 0;
            let landQuoted = totalNet;

            if (currentAiMarkupType === 'pct') {
                margin = Math.round(totalNet * (markup / 100));
                landQuoted = Math.round(totalNet + margin);
                opt.calculated_per_adult_quoted = Math.round((adultNet + (adultNet * (markup / 100))) + (airfare / totalPax));
                opt.calculated_per_kid_quoted = Math.round((kidNet + (kidNet * (markup / 100))) + (airfare / totalPax));
            } else {
                margin = Math.round(markup);
                landQuoted = Math.round(totalNet + margin);
                const flatPerPaxMargin = margin / totalPax;
                opt.calculated_per_adult_quoted = Math.round(adultNet + flatPerPaxMargin + (airfare / totalPax));
                opt.calculated_per_kid_quoted = Math.round(kidNet + flatPerPaxMargin + (airfare / totalPax));
            }

            opt.calculated_margin = margin;
            opt.calculated_grand_total = landQuoted + airfare;
        });

        const activeOpt = currentAiData.hotel_options[activeSelectedOptionIndex] || currentAiData.hotel_options[0];
        if (aiPerAdultQuoted) aiPerAdultQuoted.innerText = `₹${(activeOpt.calculated_per_adult_quoted || 0).toLocaleString('en-IN')}`;
        if (aiPerKidQuoted) aiPerKidQuoted.innerText = `₹${(activeOpt.calculated_per_kid_quoted || 0).toLocaleString('en-IN')}`;
        if (aiPricingMarginDisplay) aiPricingMarginDisplay.innerText = `₹${(activeOpt.calculated_margin || 0).toLocaleString('en-IN')}`;
        if (aiPricingGrandTotal) aiPricingGrandTotal.innerText = `₹${(activeOpt.calculated_grand_total || 0).toLocaleString('en-IN')}/-`;
        
        currentAiNetCost = activeOpt.calculated_grand_total - activeOpt.calculated_margin;
    } else {
        const adultNet = parseFloat(currentAiData?.adult_net_cost_per_person || aiNetPerAdult?.value) || 0;
        const kidNet = parseFloat(currentAiData?.kid_net_cost_per_person || aiNetPerKid?.value) || 0;
        const totalNet = (adults * adultNet) + (kids * kidNet);

        let margin = 0;
        let landQuoted = totalNet;
        let perAdultQuoted = 0;
        let perKidQuoted = 0;

        if (currentAiMarkupType === 'pct') {
            margin = Math.round(totalNet * (markup / 100));
            landQuoted = Math.round(totalNet + margin);
            perAdultQuoted = Math.round((adultNet + (adultNet * (markup / 100))) + (airfare / totalPax));
            perKidQuoted = Math.round((kidNet + (kidNet * (markup / 100))) + (airfare / totalPax));
        } else {
            margin = Math.round(markup);
            landQuoted = Math.round(totalNet + margin);
            const flatPerPaxMargin = margin / totalPax;
            perAdultQuoted = Math.round(adultNet + flatPerPaxMargin + (airfare / totalPax));
            perKidQuoted = Math.round(kidNet + flatPerPaxMargin + (airfare / totalPax));
        }

        const grandTotal = landQuoted + airfare;

        if (aiPerAdultQuoted) aiPerAdultQuoted.innerText = `₹${perAdultQuoted.toLocaleString('en-IN')}`;
        if (aiPerKidQuoted) aiPerKidQuoted.innerText = `₹${perKidQuoted.toLocaleString('en-IN')}`;
        if (aiPricingMarginDisplay) aiPricingMarginDisplay.innerText = `₹${margin.toLocaleString('en-IN')}`;
        if (aiPricingGrandTotal) aiPricingGrandTotal.innerText = `₹${grandTotal.toLocaleString('en-IN')}/-`;

        currentAiNetCost = totalNet;
    }

    if (kids > 0 && aiKidsSummaryRow) {
        aiKidsSummaryRow.classList.remove('hidden');
    } else if (aiKidsSummaryRow) {
        aiKidsSummaryRow.classList.add('hidden');
    }

    if (aiQuotePreviewPane && currentAiData) {
        aiQuotePreviewPane.innerHTML = renderAiProposalDocument(currentAiData);
    }
}

// ==============================================================
// IN-BROWSER TESSERACT OCR FOR FLIGHT SCHEDULES
// ==============================================================
async function handleFlightScreenshotPaste(e) {
    const items = (e.clipboardData || e.originalEvent?.clipboardData)?.items;
    if (!items) return;

    let imageFile = null;
    for (const item of items) {
        if (item.type.indexOf('image') !== -1) {
            imageFile = item.getAsFile();
            break;
        }
    }

    if (!imageFile) return;

    e.preventDefault();
    if (flightPasteStatus) {
        flightPasteStatus.innerHTML = `<span class="text-cyan-400 animate-pulse">↻ Scanning flight schedule with OCR...</span>`;
    }

    try {
        const ocrResult = await Tesseract.recognize(imageFile, 'eng', {
            logger: m => {
                if (m.status === 'recognizing text' && flightPasteStatus) {
                    flightPasteStatus.innerText = `OCR Reading: ${Math.round(m.progress * 100)}%`;
                }
            }
        });

        const rawOcrText = ocrResult.data.text.trim();
        if (!rawOcrText) {
            if (flightPasteStatus) flightPasteStatus.innerText = "No readable text detected in screenshot.";
            return;
        }

        if (flightPasteStatus) {
            flightPasteStatus.innerHTML = `<span class="text-indigo-400 animate-pulse">↻ Formatting route segments...</span>`;
        }

        const prompt = `You are a flight schedule parser. Extract flight routing from this OCR text into valid JSON.

OCR Text from booking screenshot:
"""
${rawOcrText}
"""

SCHEMA:
{
  "flights": [
    {
      "flight_number": "e.g. 6E-5184",
      "route": "e.g. Mumbai (BOM) → Bengaluru (BLR)",
      "dep_date": "e.g. Sat, Oct 17th 2026",
      "dep_time": "12:30",
      "arr_date": "e.g. Sat, Oct 17th 2026",
      "arr_time": "14:25",
      "duration": "1h 55m",
      "terminal_info": "e.g. Mumbai Terminal 1 → Bengaluru Terminal 1"
    }
  ]
}

Return ONLY valid JSON.`;

        const liveModel = await getLiveWorkingGroqModel();
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: liveModel,
                messages: [
                    { role: "system", content: "You output JSON strictly without commentary." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.1
            })
        });

        if (!response.ok) throw new Error("Could not parse OCR flight text");

        const data = await response.json();
        const parsed = extractJsonRobustly(data.choices[0].message.content);

        if (Array.isArray(parsed.flights) && parsed.flights.length > 0) {
            if (!currentAiData) {
                currentAiData = {
                    title: "Custom Flight & Land Proposal",
                    destination: parsed.flights[0].route || "Custom Destination",
                    travel_date: parsed.flights[0].dep_date || "",
                    pax_adults: parseInt(aiPaxAdults?.value) || 2,
                    pax_kids: parseInt(aiPaxKids?.value) || 0,
                    vehicle_standard: "Private Dedicated Fleet",
                    inclusions: ["All flight routing as mentioned", "Airport assistance"],
                    exclusions: ["Excess baggage charges", "Personal expenses"],
                    hotels: [],
                    hotel_options: [],
                    itinerary_days: [],
                    flights: parsed.flights
                };
            } else {
                currentAiData.flights = parsed.flights;
            }

            if (flightPasteStatus) {
                flightPasteStatus.innerHTML = `<span class="text-emerald-400 font-bold">✓ Added: ${parsed.flights.map(f => f.flight_number + ' ' + f.route).join(', ')}</span>`;
            }

            syncAllOptionsCalculations();
        } else {
            if (flightPasteStatus) flightPasteStatus.innerText = "No flight segments found in screenshot.";
        }

    } catch (err) {
        console.error(err);
        if (flightPasteStatus) {
            flightPasteStatus.innerHTML = `<span class="text-red-400">Failed to parse: ${err.message}</span>`;
        }
    }
}

// ==============================================================
// PROPOSAL RENDERER (WITH REQUESTED TITLES & CLEAN TABLE LAYOUT)
// ==============================================================
function renderAiProposalDocument(data) {
    if (!data) return '';

    const title = data.title || "Custom Luxury Experience";
    const dest = data.destination || "Custom Itinerary";
    const travelDate = data.travel_date || "Flexible Dates";
    const adults = parseInt(aiPaxAdults?.value) || 2;
    const kids = parseInt(aiPaxKids?.value) || 0;
    const pax = adults + kids;
    const vehicle = data.vehicle_standard || "Private Dedicated Fleet";

    // 1. Flight Schedule
    let flHtml = '';
    if (Array.isArray(data.flights) && data.flights.length > 0) {
        let fList = data.flights.map(fl => `
            <div style="border-left: 3px solid #0284c7; background: #f0f9ff; padding: 10px 14px; border-radius: 6px; margin-bottom: 10px; font-size: 11.5px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <strong>✈ ${fl.route || 'Flight Sector'}</strong>
                    <span style="background:#0284c7; color:#fff; font-size:10px; font-weight:700; padding:2px 6px; border-radius:4px;">${fl.flight_number || 'Confirmed'}</span>
                </div>
                <div style="color: #475569; margin-top: 4px;">
                    Departs: <strong>${fl.dep_time || ''}</strong> (${fl.dep_date || ''}) &bull; Arrives: <strong>${fl.arr_time || ''}</strong> (${fl.arr_date || ''}) ${fl.duration ? `&bull; Duration: ${fl.duration}` : ''}
                </div>
                ${fl.terminal_info ? `<div style="font-size:10.5px; color:#64748b; margin-top:2px;">📍 ${fl.terminal_info}</div>` : ''}
            </div>
        `).join('');
        flHtml = `<div style="margin-bottom: 20px;"><h3 style="font-size: 11px; text-transform: uppercase; border-bottom: 1.5px solid #0f172a; padding-bottom: 4px; margin-bottom: 10px; font-weight: 800; color: #0284c7;">Flight Schedule</h3>${fList}</div>`;
    }

    // 2. Accommodation Details
    let htHtml = '';
    let pricingSummaryTableHtml = '';

    if (Array.isArray(data.hotel_options) && data.hotel_options.length > 0) {
        let optionsCards = data.hotel_options.map((opt, idx) => {
            let rows = (opt.hotels || []).map(h => `
                <tr style="border-bottom: 1px solid #f1f5f9; font-size: 11px;">
                    <td style="padding: 7px 8px;"><strong>${h.city || h.location || ''}</strong></td>
                    <td style="padding: 7px 8px;">🏢 <strong>${h.hotel_name || ''}</strong> <span style="color:#6366f1; font-size:10px; font-weight:700;">${h.star_rating || ''}</span></td>
                    <td style="padding: 7px 8px; color:#64748b;">${h.room_type || h.room_category || 'Standard'}</td>
                    <td style="padding: 7px 8px; text-align:center;">${h.meal_plan || 'BB'}</td>
                    <td style="padding: 7px 8px; text-align:center; font-weight:700; color:#4f46e5;">${h.nights || 1} N</td>
                </tr>
            `).join('');

            const quotedAdultRate = opt.calculated_per_adult_quoted || Math.round((opt.per_person_inr || 0) * 1.15);

            return `
                <div style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 12px; margin-bottom: 12px; page-break-inside: avoid;">
                    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 8px;">
                        <strong style="color: #0f172a; font-size: 11.5px;">${opt.option_name || `OPTION 0${idx + 1}`} ${opt.tier_category ? `&bull; <span style="color:#4f46e5;">${opt.tier_category}</span>` : ''}</strong>
                        <span style="font-size:11.5px; font-weight:800; color:#059669; font-family:monospace;">₹${quotedAdultRate.toLocaleString('en-IN')} / Adult</span>
                    </div>
                    <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                        <thead>
                            <tr style="background: #f8fafc; color: #475569; font-size: 10px; text-transform: uppercase;">
                                <th style="padding: 5px 8px; text-align: left;">City</th>
                                <th style="padding: 5px 8px; text-align: left;">Hotel Name</th>
                                <th style="padding: 5px 8px; text-align: left;">Room Type</th>
                                <th style="padding: 5px 8px; text-align: center;">Meal Plan</th>
                                <th style="padding: 5px 8px; text-align: center;">Duration</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
            `;
        }).join('');

        htHtml = `<div style="margin-bottom: 20px;"><h3 style="font-size: 11px; text-transform: uppercase; border-bottom: 1.5px solid #0f172a; padding-bottom: 4px; margin-bottom: 10px; font-weight: 800; color: #0f172a;">Accommodation Details</h3>${optionsCards}</div>`;

        // Total package pricing summary table
        let pricingRows = data.hotel_options.map(opt => `
            <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
                <td style="padding: 9px 8px; font-weight: 700; color: #0f172a;">${opt.option_name || 'Option Tier'}</td>
                <td style="padding: 9px 8px; text-align: center; color: #4f46e5; font-weight: 800; font-family: monospace;">₹${(opt.calculated_per_adult_quoted || 0).toLocaleString('en-IN')}</td>
                ${kids > 0 ? `<td style="padding: 9px 8px; text-align: center; color: #d97706; font-weight: 800; font-family: monospace;">₹${(opt.calculated_per_kid_quoted || 0).toLocaleString('en-IN')}</td>` : ''}
                <td style="padding: 9px 8px; text-align: right; color: #059669; font-weight: 900; font-family: monospace;">₹${(opt.calculated_grand_total || 0).toLocaleString('en-IN')}/-</td>
            </tr>
        `).join('');

        pricingSummaryTableHtml = `
            <div style="margin-bottom: 20px; page-break-inside: avoid;">
                <h3 style="font-size: 11px; text-transform: uppercase; border-bottom: 1.5px solid #0f172a; padding-bottom: 4px; margin-bottom: 10px; font-weight: 800; color: #0f172a;">Total package pricing summary</h3>
                <table style="width: 100%; border-collapse: collapse; background: #fafafa; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <thead>
                        <tr style="background: #0f172a; color: #ffffff; font-size: 10px; text-transform: uppercase;">
                            <th style="padding: 7px 8px; text-align: left;">SELECTED PACKAGE OPTION</th>
                            <th style="padding: 7px 8px; text-align: center;">price per person</th>
                            ${kids > 0 ? `<th style="padding: 7px 8px; text-align: center;">KIDS PRICE</th>` : ''}
                            <th style="padding: 7px 8px; text-align: right;">Total Amount</th>
                        </tr>
                    </thead>
                    <tbody>${pricingRows}</tbody>
                </table>
            </div>
        `;

    } else if (Array.isArray(data.hotels) && data.hotels.length > 0) {
        let hRows = data.hotels.map(h => `
            <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11.5px;">
                <td style="padding: 9px 8px;">🏢 <strong>${h.hotel_name || 'Hotel Property'}</strong> ${h.room_category ? `<span style="color:#64748b;">(${h.room_category})</span>` : ''}</td>
                <td style="text-align: center; padding: 9px 8px;">${h.location || h.city || 'Included'}</td>
                <td style="text-align: center; padding: 9px 8px;">${h.meal_plan || 'BB Basis'}</td>
                <td style="text-align: center; color: #4f46e5; font-weight: 700; padding: 9px 8px;">${h.nights || 1} N</td>
            </tr>
        `).join('');
        htHtml = `<div style="margin-bottom: 20px;"><h3 style="font-size: 11px; text-transform: uppercase; border-bottom: 1.5px solid #0f172a; padding-bottom: 4px; margin-bottom: 10px; font-weight: 800; color: #0f172a;">Accommodation Details</h3><table style="width: 100%; border-collapse: collapse; font-size: 11px;"><thead><tr style="background: #f8fafc; color: #475569;"><th style="padding: 6px 8px; text-align: left;">Resort Property</th><th style="padding: 6px 8px; text-align: center;">Location</th><th style="padding: 6px 8px; text-align: center;">Meal Plan</th><th style="padding: 6px 8px; text-align: center;">Duration</th></tr></thead><tbody>${hRows}</tbody></table></div>`;
    }

    // 3. Day-Wise Itinerary
    let dyHtml = '';
    if (Array.isArray(data.itinerary_days) && data.itinerary_days.length > 0) {
        let dList = data.itinerary_days.map((d, i) => `
            <div style="margin-bottom: 14px; background: #fafafa; padding: 14px; border-radius: 10px; border: 1px solid #f1f5f9; page-break-inside: avoid;">
                <h4 style="margin: 0 0 4px 0; font-size: 12px; color: #0f172a; font-weight: 800;">DAY 0${i + 1} &bull; ${d.title || 'Sightseeing & Transfers'}</h4>
                <p style="margin: 0; font-size: 11px; color: #475569; line-height: 1.6;">${d.description || ''}</p>
            </div>
        `).join('');
        dyHtml = `<div style="margin-bottom: 20px;"><h3 style="font-size: 11px; text-transform: uppercase; border-bottom: 1.5px solid #0f172a; padding-bottom: 4px; margin-bottom: 10px; font-weight: 800; color: #0f172a;">Day-Wise Itinerary</h3>${dList}</div>`;
    }

    const incList = Array.isArray(data.inclusions) ? data.inclusions.map(t => `<li style="list-style-type: none; padding-left: 14px; position: relative; margin-bottom: 4px;"><span style="position: absolute; left: 0; color: #10b981; font-weight: bold;">✓</span>${t}</li>`).join('') : '';
    const excList = Array.isArray(data.exclusions) ? data.exclusions.map(t => `<li style="list-style-type: none; padding-left: 14px; position: relative; margin-bottom: 4px;"><span style="position: absolute; left: 0; color: #ef4444; font-weight: bold;">✕</span>${t}</li>`).join('') : '';

    return `
        <div id="ai-compiled-proposal-inner" style="padding: 26px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #ffffff; color: #1e293b; line-height: 1.5;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 14px; margin-bottom: 18px;">
                <div>
                    <h2 style="font-size: 22px; font-weight: 900; margin: 0; letter-spacing: -0.5px; color: #0f172a;">TRAVEL WORLD WIDE</h2>
                    <p style="font-size: 10px; color: #64748b; margin: 2px 0 0 0; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700;">Bridging Gaps</p>
                </div>
                <div style="text-align: right; font-size: 11px; color: #475569; line-height: 1.45;">
                    <p style="margin: 0; font-weight: 700; color: #0f172a;">salestravelworldwide@gmail.com</p>
                    <p style="margin: 0; font-weight: 500;">+91 88926 89595</p>
                </div>
            </div>

            <div style="background: #f8fafc; border-radius: 12px; padding: 14px; margin-bottom: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 11.5px; border: 1px solid #e2e8f0;">
                <div><strong>Experience:</strong> ${title}</div>
                <div><strong>Destination:</strong> 📍 ${dest}</div>
                <div><strong>Dates:</strong> 📅 ${travelDate}</div>
                <div><strong>Guests:</strong> 👥 ${pax} Travelers (${adults} Adults${kids > 0 ? `, ${kids} Children` : ''})</div>
                <div style="grid-column: span 2;"><strong>Ground Fleet:</strong> 🚘 ${vehicle}</div>
            </div>

            ${flHtml}
            ${htHtml}
            ${dyHtml}

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; border-top: 1px solid #e2e8f0; padding-top: 14px; margin-bottom: 20px; page-break-inside: avoid;">
                <div>
                    <h4 style="font-size: 10px; color: #10b981; margin: 0 0 6px 0; text-transform: uppercase; font-weight: 800;">✓ Inclusions</h4>
                    <ul style="font-size: 10.5px; color: #475569; padding: 0; margin: 0;">${incList || '<li>Full accommodations and transfers included.</li>'}</ul>
                </div>
                <div>
                    <h4 style="font-size: 10px; color: #ef4444; margin: 0 0 6px 0; text-transform: uppercase; font-weight: 800;">✕ Exclusions</h4>
                    <ul style="font-size: 10.5px; color: #475569; padding: 0; margin: 0;">${excList || '<li>Personal expenses, camera fees, items not listed.</li>'}</ul>
                </div>
            </div>

            ${pricingSummaryTableHtml}
        </div>
    `;
}

function extractJsonRobustly(text) {
    if (!text) return {};
    let cleaned = text.trim();
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
    
    const startIdx = cleaned.indexOf('{');
    const endIdx = cleaned.lastIndexOf('}');
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        cleaned = cleaned.substring(startIdx, endIdx + 1);
    }
    
    return JSON.parse(cleaned);
}

async function handleAutonomousAiBuild() {
    const rawText = aiFreeRawText?.value?.trim();
    if (!rawText) {
        alert("Please paste the vendor quotation or email text first.");
        return;
    }

    aiFreeGenerateBtn.disabled = true;
    aiFreeGenerateBtn.innerHTML = `<span class="animate-spin mr-2">↻</span> Building Proposal...`;
    if (aiCanvasStatus) aiCanvasStatus.innerText = "Extracting multi-option hotels & itinerary...";

    const prompt = `You are a travel quotation parser. Extract ALL trip details, hotel options, and itineraries from this supplier quote into valid JSON.

CRITICAL EXTRACTION RULES:
1. "title": Clean vacation title (e.g. "Bali Tropical Escape (Kuta & Ubud)").
2. "destination": Destination name (e.g. Bali, Indonesia).
3. "travel_date": Date string or "03 June, 2026".
4. "pax_adults": Number of adults (e.g. 2).
5. "pax_kids": Number of children if present (else 0).
6. "vehicle_standard": Fleet used (e.g. "Private AC Suzuki APV / Toyota Avanza").
7. "hotel_options": Array of ALL hotel tier options mentioned (Option 1, Option 2, Option 3, etc.).
   Each option must have:
   - "option_name": Clean descriptive title (e.g. "Option 1 (3 Star Standard)", "Option 2 (4 Star Premium)", "Option 3 (4 Star Pool Villa)")
   - "per_person_usd": Numeric USD price per person if specified (e.g. 309, 314, 355)
   - "per_person_inr": USD price multiplied by 87 (e.g. 26883, 27318, 30885)
   - "kid_net_inr": Child rate in INR (if mentioned, else 0)
   - "hotels": Array of hotels in that option [{ "city": "Kuta", "hotel_name": "Zia Hotel Kuta", "star_rating": "3 Star", "room_type": "Superior Room", "meal_plan": "Bed and Breakfast", "nights": 3 }]
8. "itinerary_days": Array of all day descriptions with "title" and "description".
9. "inclusions": Array of explicit inclusions.
10. "exclusions": Array of explicit exclusions.

Vendor Text:
"""
${rawText}
"""

Return ONLY a valid JSON object. Do not wrap in markdown fences.`;

    try {
        const liveModel = await getLiveWorkingGroqModel();
        if (aiCanvasStatus) aiCanvasStatus.innerText = `Parsing with ${liveModel}...`;

        const response = await fetch("[https://api.groq.com/openai/v1/chat/completions](https://api.groq.com/openai/v1/chat/completions)", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: liveModel,
                messages: [
                    { role: "system", content: "You output valid JSON directly without markdown fences or additional commentary." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.1
            })
        });

        if (!response.ok) {
            const errBody = await response.text();
            throw new Error(`AI generation failed (${response.status}): ${errBody}`);
        }

        const data = await response.json();
        currentAiData = extractJsonRobustly(data.choices[0].message.content);

        // Populate Adult & Kid counts
        if (currentAiData.pax_adults) aiPaxAdults.value = currentAiData.pax_adults;
        if (currentAiData.pax_kids !== undefined) aiPaxKids.value = currentAiData.pax_kids;

        activeSelectedOptionIndex = 0;
        renderLeftOptionsPricingControls();
        syncAllOptionsCalculations();

        if (aiCanvasStatus) aiCanvasStatus.innerText = "Proposal Generated";

    } catch (err) {
        console.error(err);
        alert("Failed to build AI quotation: " + err.message);
        if (aiCanvasStatus) aiCanvasStatus.innerText = "Error";
    } finally {
        aiFreeGenerateBtn.disabled = false;
        aiFreeGenerateBtn.innerHTML = `<i data-lucide="wand-2" class="h-4 w-4"></i><span>Generate AI Quotation</span>`;
        if (typeof lucide !== "undefined") lucide.createIcons();
    }
}

async function handleAiRefinePrompt() {
    const refineQuery = aiRefinePromptInput?.value?.trim();
    if (!refineQuery) {
        alert("Please enter what changes or additions you'd like made.");
        return;
    }
    if (!currentAiData) {
        alert("Please generate a proposal first before refining.");
        return;
    }

    aiRefineSubmitBtn.disabled = true;
    aiRefineSubmitBtn.innerHTML = `<span class="animate-spin">↻</span>`;
    if (aiCanvasStatus) aiCanvasStatus.innerText = "Refining with AI...";

    const prompt = `Modify the current travel proposal JSON according to the user request.

USER REQUEST:
"${refineQuery}"

CURRENT JSON:
${JSON.stringify(currentAiData)}

Return ONLY the updated valid JSON adhering to the exact same schema.`;

    try {
        const liveModel = await getLiveWorkingGroqModel();
        const response = await fetch("[https://api.groq.com/openai/v1/chat/completions](https://api.groq.com/openai/v1/chat/completions)", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: liveModel,
                messages: [
                    { role: "system", content: "You output JSON directly without markdown fences." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.1
            })
        });

        if (!response.ok) throw new Error("Refinement failed: " + response.status);

        const data = await response.json();
        currentAiData = extractJsonRobustly(data.choices[0].message.content);

        renderLeftOptionsPricingControls();
        syncAllOptionsCalculations();

        aiRefinePromptInput.value = '';
        if (aiCanvasStatus) aiCanvasStatus.innerText = "Refinements applied";

    } catch (err) {
        console.error(err);
        alert("Could not refine proposal: " + err.message);
        if (aiCanvasStatus) aiCanvasStatus.innerText = "Ready";
    } finally {
        aiRefineSubmitBtn.disabled = false;
        aiRefineSubmitBtn.innerHTML = `<i data-lucide="send" class="h-3.5 w-3.5"></i><span>Refine</span>`;
        if (typeof lucide !== "undefined") lucide.createIcons();
    }
}

function exportAiBuiltProposalPDF() {
    if (!aiQuotePreviewPane || !currentAiData) {
        alert("No generated proposal to export.");
        return;
    }
    const cleanFileName = (currentAiData.title || "Travel_Proposal").replace(/[^a-zA-Z0-9_-]/g, '_');
    html2pdf().set({
        margin: [10, 10, 14, 10],
        filename: `${cleanFileName}_Proposal.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).from(aiQuotePreviewPane).save();
}

async function saveAiBuiltProposalToSupabase() {
    if (!currentAiData) {
        alert("Generate a proposal before saving.");
        return;
    }
    aiSaveCloudBtn.disabled = true;
    aiSaveCloudBtn.innerText = "Syncing Cloud...";

    const grandTotal = parseFloat(aiPricingGrandTotal?.innerText.replace(/[^0-9.]/g, '')) || 0;

    try {
        const { error } = await supabaseClient.from('itineraries').insert([{
            title: currentAiData.title || "Custom AI Proposal",
            destination: currentAiData.destination || "Custom Itinerary",
            total_price: grandTotal,
            dmc_net_cost: currentAiNetCost,
            dmc_markup_pct: currentAiMarkupType === 'pct' ? currentAiMarkupVal : 0,
            inclusions: currentAiData.inclusions || [],
            exclusions: currentAiData.exclusions || [],
            hotel_details: currentAiData.hotel_options || currentAiData.hotels || [],
            flight_details: currentAiData.flights || []
        }]);

        if (error) throw error;
        aiSaveCloudBtn.innerText = "✓ Saved to Cloud";
        aiSaveCloudBtn.style.backgroundColor = "#059669";
        setTimeout(() => {
            aiSaveCloudBtn.innerText = "Save to Cloud";
            aiSaveCloudBtn.style.backgroundColor = "";
            aiSaveCloudBtn.disabled = false;
        }, 2500);
    } catch (err) {
        alert("Cloud sync failed: " + err.message);
        aiSaveCloudBtn.innerText = "Save to Cloud";
        aiSaveCloudBtn.disabled = false;
    }
}

// ==============================================================
// AUTH & WORKSPACE INITIALIZATION
// ==============================================================
async function checkExistingAuthSession() {
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) { 
            unlockPremiumWorkspace(); 
        }
    } catch (e) { console.warn(e); }
}

async function executeWorkspaceSignOut() {
    try { 
        await supabaseClient.auth.signOut(); 
    } catch (e) { console.warn(e); }
    crmWorkspace.style.opacity = "0"; 
    setTimeout(() => window.location.reload(), 500); 
}

function unlockPremiumWorkspace() {
    loginGate.style.opacity = "0";
    setTimeout(() => { 
        loginGate.style.display = "none"; 
        crmWorkspace.classList.remove('hidden-workspace'); 
        setTimeout(() => { 
            crmWorkspace.style.opacity = "1"; 
            fetchAndRenderCustomerBase(); 
            resetBuilderWorkspaceForm(); 
        }, 50); 
    }, 500);
}

async function handleWorkspaceLogin(e) {
    if (e) e.preventDefault(); 
    const em = document.getElementById('login-email').value;
    const pw = document.getElementById('login-password').value;
    const btn = document.getElementById('login-submit-btn'); 
    btn.innerText = "Verifying..."; 
    btn.disabled = true;
    try {
        const { error } = await supabaseClient.auth.signInWithPassword({ email: em, password: pw });
        if (error) throw error; 
        btn.innerText = "Access Granted"; 
        btn.style.backgroundColor = "#10B981";
        setTimeout(() => unlockPremiumWorkspace(), 500);
    } catch (err) { 
        alert(err.message); 
        btn.innerText = "Initialize Workspace"; 
        btn.disabled = false; 
    }
}

// ==============================================================
// MANUAL BUILDER & CUSTOMER DIRECTORY LOGIC
// ==============================================================
function resetBuilderWorkspaceForm() {
    activeItineraryId = null; 
    if (activeRecordBadge) activeRecordBadge.classList.add('hidden');
    coreInputIds.forEach(id => {
        const el = document.getElementById(id); if (!el) return;
        if (id === 'pkg-inclusions') el.value = "Premium accommodations as detailed above\nAll airport transfers and local sightseeing via private AC vehicle\nDaily gourmet breakfast at the hotel properties";
        else if (id === 'pkg-exclusions') el.value = "International or domestic flight tickets\nPersonal laundry, tips, and items outside mentioned meals\nTravel insurance or emergency documentation support";
        else if (id === 'dmc-markup-pct') el.value = '0'; 
        else el.value = '';
    });
    if (pkgCustomerSelect) pkgCustomerSelect.value = ''; 
    if (flightsContainer) flightsContainer.innerHTML = ''; 
    if (hotelsContainer) hotelsContainer.innerHTML = ''; 
    if (daysContainer) daysContainer.innerHTML = '';
    
    dayCount = 0; hotelCount = 0; flightCount = 0;
    addFlightSectorBlock(); addHotelStayBlock(); addItineraryDay(); calculateMarginMetrics();
}

function toggleLedgerDrawer(s) { 
    if (s) { 
        ledgerDrawer?.classList.add('open'); 
        fetchAndRenderItinerariesLedger(); 
    } else { 
        ledgerDrawer?.classList.remove('open'); 
    } 
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
                        <div class="font-medium text-white pr-6 truncate text-xs">${itin.title}</div>
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
        switchCrmModule('itinerary');
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
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #111827; padding-bottom:14px; margin-bottom:20px;">
                <div>
                    <h2 style="font-size:22px; font-weight:900; margin:0; tracking:-0.5px;">TRAVEL WORLD WIDE</h2>
                    <p style="font-size:10px; color:#4b5563; margin:2px 0 0 0; text-transform:uppercase; tracking:1.5px; font-weight:700;">Bridging Gaps</p>
                </div>
                <div style="text-align:right; font-size:11px; color:#4b5563; line-height:1.45;">
                    <p style="margin:0; font-weight:700; color:#111827;">salestravelworldwide@gmail.com</p>
                    <p style="margin:0; font-weight:500;">+91 88926 89595</p>
                </div>
            </div>
            <div style="background:#f9fafb; border-radius:12px; padding:14px; margin-bottom:20px; display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:11.5px; border:1px solid #e5e7eb;">
                <div><strong>Experience:</strong> ${title}</div><div><strong>Destination:</strong>📍 ${dest}</div>
                <div><strong>Departure:</strong> ${formatPremiumDate(date)}</div><div><strong>Guests:</strong> 👥 ${pax} Adults</div>
                <div style="grid-column:span 2;"><strong>Ground Fleet:</strong> 🚘 ${vehicle}</div>
            </div>
            ${flHtml ? `<div style="margin-bottom:20px;"><h3 style="font-size:11px; text-transform:uppercase; border-bottom:1.5px solid #111827; padding-bottom:4px;">Flight Schedule</h3>${flHtml}</div>` : ''}
            <div style="margin-bottom:20px;"><h3 style="font-size:11px; text-transform:uppercase; border-bottom:1.5px solid #111827; padding-bottom:4px;">Accommodation Details</h3><table style="width:100%; border-collapse:collapse; font-size:11px;"><thead><tr style="background:#f3f4f6; color:#4b5563;"><th style="padding:6px;">Resort Property</th><th style="padding:6px; text-align:center;">Check-In</th><th style="padding:6px; text-align:center;">Check-Out</th><th style="padding:6px; text-align:center;">Duration</th></tr></thead><tbody>${htHtml || '<tr><td colspan="4" style="text-align:center; padding:10px; color:#9ca3af;">No accommodations added</td></tr>'}</tbody></table></div>
            ${dyHtml ? `<div style="margin-bottom:20px;"><h3 style="font-size:11px; text-transform:uppercase; border-bottom:1.5px solid #111827; padding-bottom:4px;">Day-Wise Itinerary</h3>${dyHtml}</div>` : ''}
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

function addItineraryDay() {
    dayCount++;
    const b = document.createElement('div');
    b.className = 'bg-white/5 border border-white/5 p-4 rounded-xl space-y-3 relative';
    b.id = `day-block-${dayCount}`;
    b.innerHTML = `
        <div class="flex justify-between items-center">
            <span class="text-xs font-bold text-indigo-300 day-label">Day 0${dayCount}</span>
            <button type="button" onclick="removeItineraryDay(${dayCount})" class="text-xs text-red-400 hover:text-red-300 transition">Remove</button>
        </div>
        <input type="text" placeholder="Title / Highlights (e.g. Arrival & Marina Dhow Cruise)" class="day-title-input w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none" oninput="updateLivePreview()">
        <textarea rows="3" placeholder="Day activities and schedule details..." class="day-desc-input w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none resize-none" oninput="updateLivePreview()"></textarea>
    `;
    daysContainer.appendChild(b);
    updateLivePreview();
}

function removeItineraryDay(id) {
    document.getElementById(`day-block-${id}`)?.remove();
    reindexItineraryDays();
    updateLivePreview();
}

function reindexItineraryDays() {
    Array.from(daysContainer?.children || []).forEach((b, i) => {
        const n = i + 1;
        b.id = `day-block-${n}`;
        b.querySelector('.day-label').innerText = `Day 0${n}`;
        b.querySelector('button').setAttribute('onclick', `removeItineraryDay(${n})`);
    });
    dayCount = daysContainer?.children.length || 0;
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

function reindexStandaloneHotels() { 
    Array.from(standaloneHotelsList?.children || []).forEach((b, i) => { 
        const n = i + 1; 
        b.id = `standalone-hotel-block-${n}`; 
        b.querySelector('span').innerHTML = `<i data-lucide="building" class="h-3.5 w-3.5"></i> Hotel Slot ${n}`; 
        b.querySelector('button').setAttribute('onclick', `removeStandaloneHotelBlock(${n})`); 
    }); 
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
        const pr = parseFloat(b.querySelector('.sh-price').value) || 0; tot += pr;
        let amHtml = (b.querySelector('.sh-amenities').value.trim() || "").split('\n').filter(l => l.trim()).map(l => `<div style="font-size:11px; color:#334155;">✔ ${l.trim()}</div>`).join('');
        vcHtml += `<div style="background:#fff; border:1px solid #e2e8f0; border-radius:14px; padding:20px; margin-bottom:16px; page-break-inside:avoid;">
            <div style="display:flex; justify-content:space-between; border-bottom:1px dashed #cbd5e1; padding-bottom:10px; margin-bottom:12px;">
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
        <div style="display:flex; justify-content:space-between; border-bottom:2px solid #0f172a; padding-bottom:12px; margin-bottom:20px;"><h2>TRAVEL WORLD WIDE</h2></div>
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

function removeFlightSectorBlock(id) {
    document.getElementById(`flight-block-${id}`)?.remove();
    updateLivePreview();
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

function removeHotelStayBlock(id) {
    document.getElementById(`hotel-block-${id}`)?.remove();
    updateLivePreview();
}

async function saveItineraryToSupabase() {
    const saveBtn = document.getElementById('save-btn'); if (!saveBtn) return;
    const originalText = saveBtn.innerText; saveBtn.innerText = "Saving to Cloud..."; saveBtn.style.opacity = "0.6";
    const title = document.getElementById('pkg-title').value; const destination = document.getElementById('pkg-destination').value;
    const startDate = document.getElementById('pkg-date').value || null; const numberOfPeople = parseInt(document.getElementById('pkg-pax').value) || 1;
    const vehicleUsed = document.getElementById('pkg-vehicle').value; const totalPrice = parseFloat(document.getElementById('pkg-price').value) || 0;
    const customerId = document.getElementById('pkg-customer-select').value || null; const airfarePrice = parseFloat(document.getElementById('pkg-airfare').value) || 0;
    const dmcNetCost = parseFloat(document.getElementById('dmc-net-cost').value) || 0; const dmcMarkupPct = parseFloat(document.getElementById('dmc-markup-pct').value) || 0;
    const inclusions = (document.getElementById('pkg-inclusions')?.value || "").split('\n').filter(item => item.trim());
    const exclusions = (document.getElementById('pkg-exclusions')?.value || "").split('\n').filter(item => item.trim());

    const hotelsPayload = Array.from(hotelsContainer?.children || []).map(block => ({
        hotel_name: block.querySelector('.hotel-name').value || "TBD",
        check_in: block.querySelector('.hotel-in').value || null,
        check_out: block.querySelector('.hotel-out').value || null,
        nights: parseInt(block.querySelector('.hotel-nights').value) || 0
    }));

    const flightsPayload = Array.from(flightsContainer?.children || []).map(block => ({
        flight_number: block.querySelector('.fl-num').value || "TBD", route: block.querySelector('.fl-route').value || "---",
        duration: block.querySelector('.fl-duration').value || "---", dep_date: block.querySelector('.fl-dep-date').value || null,
        dep_time: block.querySelector('.fl-dep-time').value || "---", arr_date: block.querySelector('.fl-arr-date').value || null,
        arr_time: block.querySelector('.fl-arr-time').value || "---", net_cost: parseFloat(block.querySelector('.fl-net')?.value) || 0, margin_pct: parseFloat(block.querySelector('.fl-margin')?.value) || 0
    }));

    if (!title || !destination) { alert("Please provide at least a Title and Destination."); saveBtn.innerText = originalText; saveBtn.style.opacity = "1"; return; }

    try {
        let res;
        if (activeItineraryId) res = await supabaseClient.from('itineraries').update({ title, destination, start_date: startDate, number_of_people: numberOfPeople, vehicle_used: vehicleUsed, total_price: totalPrice, inclusions, exclusions, hotel_details: hotelsPayload, customer_id: customerId, flight_details: flightsPayload, airfare_price: airfarePrice, dmc_net_cost: dmcNetCost, dmc_markup_pct: dmcMarkupPct }).eq('id', activeItineraryId);
        else res = await supabaseClient.from('itineraries').insert([{ title, destination, start_date: startDate, number_of_people: numberOfPeople, vehicle_used: vehicleUsed, total_price: totalPrice, inclusions, exclusions, hotel_details: hotelsPayload, customer_id: customerId, flight_details: flightsPayload, airfare_price: airfarePrice, dmc_net_cost: dmcNetCost, dmc_markup_pct: dmcMarkupPct }]);
        if (res.error) throw res.error;
        saveBtn.innerText = "✓ Synced to CRM"; saveBtn.style.backgroundColor = "#059669"; await fetchAndRenderItinerariesLedger();
        setTimeout(() => { saveBtn.innerText = originalText; saveBtn.style.backgroundColor = ""; saveBtn.style.opacity = "1"; }, 2500);
    } catch (err) { alert(`Cloud sync failed: ${err.message}`); saveBtn.innerText = originalText; saveBtn.style.opacity = "1"; }
}

window.deleteItineraryRecord = deleteItineraryRecord;
window.removeFlightSectorBlock = removeFlightSectorBlock;
window.removeHotelStayBlock = removeHotelStayBlock;
window.removeItineraryDay = removeItineraryDay;
window.loadSavedItineraryIntoWorkspace = loadSavedItineraryIntoWorkspace;
window.addStandaloneHotelBlock = addStandaloneHotelBlock;
window.removeStandaloneHotelBlock = removeStandaloneHotelBlock;
window.calculateStandaloneNights = calculateStandaloneNights;
window.updateHotelVoucherLivePreview = updateHotelVoucherLivePreview;
window.selectActiveOptionTier = selectActiveOptionTier;
window.updateOptionCustomPrice = updateOptionCustomPrice;
