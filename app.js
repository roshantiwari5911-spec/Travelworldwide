// ====== SUPABASE CLOUD CONNECTION CONFIGURATION ======
const SUPABASE_URL = "https://txqhsxyodszbfwsqvcjf.supabase.co"; 
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4cWhzeHlvZHN6YmZ3c3F2Y2pmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0MTIzMTgsImV4cCI6MjA5Njk4ODMxOH0._86b10n0y6WPasyJqdCX-MKxtXfXtVyYsW9cS3B43cQ";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// =====================================================

let dayCount = 0;
let hotelCount = 0;
let flightCount = 0;
let standaloneHotelCount = 0; 
let activeItineraryId = null; 

let addDayBtn, addHotelBtn, addFlightBtn, daysContainer, hotelsContainer, flightsContainer, previewPane, loginGate, crmWorkspace;
let tabItinerary, tabCustomers, tabHotels, moduleItinerary, moduleCustomers, moduleHotels;
let pkgCustomerSelect, customerTableRows, addCustSubmitBtn, logoutBtn;
let savedItinerariesLedger, clearWorkspaceBtn, activeRecordBadge;
let ledgerDrawer, openLedgerBtn, closeLedgerBtn; 
let standaloneHotelsList, standaloneHotelSaveBtn, standaloneHotelExportBtn, hotelVoucherPreviewPane;

const inputs = ['pkg-title', 'pkg-destination', 'pkg-date', 'pkg-pax', 'pkg-vehicle', 'pkg-inclusions', 'pkg-exclusions'];

document.addEventListener('DOMContentLoaded', async () => {
    addDayBtn = document.getElementById('add-day-btn');
    addHotelBtn = document.getElementById('add-hotel-btn');
    addFlightBtn = document.getElementById('add-flight-btn');
    daysContainer = document.getElementById('days-container');
    hotelsContainer = document.getElementById('hotels-container');
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

    const submitBtn = document.getElementById('login-submit-btn');
    submitBtn?.addEventListener('click', handleWorkspaceLogin);

    inputs.forEach(id => {
        document.getElementById(id)?.addEventListener('input', updateLivePreview);
    });

    addDayBtn?.addEventListener('click', addItineraryDay);
    addHotelBtn?.addEventListener('click', addHotelStayBlock);
    addFlightBtn?.addEventListener('click', addFlightSectorBlock);
    
    document.getElementById('export-btn')?.addEventListener('click', generateProfessionalPDF);
    document.getElementById('save-btn')?.addEventListener('click', saveItineraryToSupabase);

    checkExistingAuthSession();
});

function toggleLedgerDrawer(shouldOpen) {
    if (shouldOpen) {
        ledgerDrawer?.classList.add('open');
        fetchAndRenderItinerariesLedger(); 
    } else {
        ledgerDrawer?.classList.remove('open');
    }
}

async function checkExistingAuthSession() {
    try {
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        if (error) throw error;
        if (session) {
            if (typeof fadeEngineForWorkspace === "function") fadeEngineForWorkspace();
            unlockPremiumWorkspace();
        }
    } catch (err) {
        console.warn("Session verified safely.");
    }
}

async function executeWorkspaceSignOut() {
    try {
        const { error } = await supabaseClient.auth.signOut();
        if (error) throw error;
        crmWorkspace.style.opacity = "0";
        setTimeout(() => { window.location.reload(); }, 500);
    } catch (err) {
        alert(`Sign Out Fault: ${err.message}`);
    }
}

function switchCrmModule(activeModule) {
    const unselectedTabClass = "text-[11px] bg-white/5 text-gray-300 hover:bg-white/10 font-semibold px-3 py-1.5 rounded-lg transition";
    const selectedTabClass = "text-[11px] bg-white text-black font-semibold px-3 py-1.5 rounded-lg shadow transition";

    tabItinerary.className = unselectedTabClass;
    tabCustomers.className = unselectedTabClass;
    tabHotels.className = unselectedTabClass + " border border-dashed border-indigo-500/30";
    
    moduleItinerary.classList.add('hidden');
    moduleCustomers.classList.add('hidden');
    moduleHotels.classList.add('hidden');

    if (activeModule === 'itinerary') {
        tabItinerary.className = selectedTabClass;
        moduleItinerary.classList.remove('hidden');
        if (openLedgerBtn) openLedgerBtn.style.display = 'flex';
    } else if (activeModule === 'customers') {
        tabCustomers.className = selectedTabClass;
        moduleCustomers.classList.remove('hidden');
        if (openLedgerBtn) openLedgerBtn.style.display = 'none';
        toggleLedgerDrawer(false); 
        fetchAndRenderCustomerBase(); 
    } else if (activeModule === 'hotels') {
        tabHotels.className = selectedTabClass + " border border-indigo-500/50";
        moduleHotels.classList.remove('hidden');
        if (openLedgerBtn) openLedgerBtn.style.display = 'none';
        toggleLedgerDrawer(false);
        if (standaloneHotelsList && standaloneHotelsList.children.length === 0) {
            addStandaloneHotelBlock();
        }
    }
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
            resetBuilderWorkspaceForm();
        }, 50);
    }, 500);
}

function resetBuilderWorkspaceForm() {
    activeItineraryId = null;
    if (activeRecordBadge) activeRecordBadge.classList.add('hidden');
    
    inputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            if (id === 'pkg-inclusions') {
                element.value = "Premium accommodations as detailed above\nAll airport transfers and local sightseeing via private AC vehicle\nDaily gourmet breakfast at the hotel properties";
            } else if (id === 'pkg-exclusions') {
                element.value = "International or domestic flight tickets\nPersonal laundry, tips, and items outside mentioned meals\nTravel insurance or emergency documentation support";
            } else {
                element.value = '';
            }
        }
    });

    if (pkgCustomerSelect) pkgCustomerSelect.value = '';
    if (flightsContainer) flightsContainer.innerHTML = '';
    if (hotelsContainer) hotelsContainer.innerHTML = '';
    if (daysContainer) daysContainer.innerHTML = '';
    
    if (document.getElementById('dmc-net-cost')) document.getElementById('dmc-net-cost').value = '';
    if (document.getElementById('dmc-markup-pct')) document.getElementById('dmc-markup-pct').value = '0';

    dayCount = 0;
    hotelCount = 0;
    flightCount = 0;

    addFlightSectorBlock();
    addHotelStayBlock(); 
    addItineraryDay();    
    calculateMarginMetrics();
}

async function fetchAndRenderItinerariesLedger() {
    if (!savedItinerariesLedger) return;
    try {
        const { data: itineraries, error } = await supabaseClient
            .from('itineraries')
            .select('id, title, destination, total_price, created_at')
            .order('created_at', { ascending: false });

        if (error) throw error;

        savedItinerariesLedger.innerHTML = '';
        if (itineraries.length === 0) {
            savedItinerariesLedger.innerHTML = '<div class="text-gray-500 italic p-2 text-[11px]">No quotations saved on the CRM yet.</div>';
            return;
        }

        itineraries.forEach(itin => {
            const dateStamp = new Date(itin.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
            const priceFormatted = itin.total_price ? `₹${Number(itin.total_price).toLocaleString('en-IN')}` : '₹0';
            
            savedItinerariesLedger.innerHTML += `
                <div class="relative group/card mb-2">
                    <div onclick="loadSavedItineraryIntoWorkspace('${itin.id}')" class="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-indigo-500/60 hover:bg-white/10 cursor-pointer transition flex flex-col gap-1 text-left group">
                        <div class="font-medium text-white group-hover:text-indigo-300 transition pr-6 truncate">${itin.title}</div>
                        <div class="flex justify-between items-center text-[11px] text-gray-400">
                            <span>${itin.destination}</span>
                            <span class="font-mono text-emerald-400 font-semibold">${priceFormatted}</span>
                        </div>
                        <div class="text-[9px] text-gray-600 font-mono text-right mt-1">Saved: ${dateStamp}</div>
                    </div>
                    <button onclick="deleteItineraryRecord('${itin.id}', '${itin.title.replace(/'/g, "\\'")}')" class="absolute top-3 right-3 p-1 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 opacity-80 sm:opacity-0 group-hover/card:opacity-100 transition duration-200" title="Delete Quote">
                        <i data-lucide="trash-2" class="h-3.5 w-3.5"></i>
                    </button>
                </div>
            `;
        });
        if (typeof lucide !== "undefined") lucide.createIcons();
    } catch (err) {
        console.error("Ledger rendering failure:", err);
    }
}

async function deleteItineraryRecord(id, title) {
    const hasConfirmed = confirm(`Are you completely sure you want to permanently delete "${title}" from the CRM cloud?`);
    if (!hasConfirmed) return;
    try {
        const { error } = await supabaseClient.from('itineraries').delete().eq('id', id);
        if (error) throw error;
        if (activeItineraryId === id) resetBuilderWorkspaceForm();
        await fetchAndRenderItinerariesLedger();
    } catch (err) {
        alert(`Could not remove record: ${err.message}`);
    }
}

async function loadSavedItineraryIntoWorkspace(id) {
    try {
        const { data: itin, error } = await supabaseClient.from('itineraries').select('*').eq('id', id).single();
        if (error) throw error;
        if (!itin) return;

        activeItineraryId = itin.id;
        if (activeRecordBadge) activeRecordBadge.classList.remove('hidden');

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

        if (flightsContainer) flightsContainer.innerHTML = '';
        if (hotelsContainer) hotelsContainer.innerHTML = '';
        if (daysContainer) daysContainer.innerHTML = '';
        
        flightCount = 0;
        hotelCount = 0;
        dayCount = 0;

        if (Array.isArray(itin.flight_details) && itin.flight_details.length > 0) {
            itin.flight_details.forEach(fl => {
                addFlightSectorBlock();
                const currentBlock = flightsContainer.lastChild;
                currentBlock.querySelector('.fl-num').value = fl.flight_number || '';
                currentBlock.querySelector('.fl-route').value = fl.route || '';
                currentBlock.querySelector('.fl-duration').value = fl.duration || '';
                currentBlock.querySelector('.fl-dep-date').value = fl.dep_date || '';
                currentBlock.querySelector('.fl-dep-time').value = fl.dep_time || '';
                currentBlock.querySelector('.fl-arr-date').value = fl.arr_date || '';
                currentBlock.querySelector('.fl-arr-time').value = fl.arr_time || '';
                
                if (currentBlock.querySelector('.fl-net')) currentBlock.querySelector('.fl-net').value = fl.net_cost || '';
                if (currentBlock.querySelector('.fl-margin')) currentBlock.querySelector('.fl-margin').value = fl.margin_pct || '0';

                if (fl.has_leg2 && fl.leg2) {
                    currentBlock.querySelector('.fl-has-leg2').checked = true;
                    const leg2Container = document.getElementById(`flight-leg2-container-${flightCount}`);
                    if(leg2Container) leg2Container.classList.remove('hidden');
                    currentBlock.querySelector('.fl-num2').value = fl.leg2.flight_number || '';
                    currentBlock.querySelector('.fl-route2').value = fl.leg2.route || '';
                    currentBlock.querySelector('.fl-duration2').value = fl.leg2.duration || '';
                    currentBlock.querySelector('.fl-dep-date2').value = fl.leg2.dep_date || '';
                    currentBlock.querySelector('.fl-dep-time2').value = fl.leg2.dep_time || '';
                    currentBlock.querySelector('.fl-arr-date2').value = fl.leg2.arr_date || '';
                    currentBlock.querySelector('.fl-arr-time2').value = fl.leg2.arr_time || '';
                }
            });
        }

        if (Array.isArray(itin.hotel_details) && itin.hotel_details.length > 0) {
            itin.hotel_details.forEach(ht => {
                addHotelStayBlock();
                const currentBlock = hotelsContainer.lastChild;
                currentBlock.querySelector('.hotel-name').value = ht.hotel_name || '';
                currentBlock.querySelector('.hotel-in').value = ht.check_in || '';
                currentBlock.querySelector('.hotel-out').value = ht.check_out || '';
                currentBlock.querySelector('.hotel-nights').value = ht.nights || '0';
            });
        }

        if (daysContainer && daysContainer.children.length === 0) {
            addItineraryDay();
        }

        toggleLedgerDrawer(false); 
        calculateMarginMetrics();

    } catch (err) {
        alert(`Could not load itinerary data: ${err.message}`);
    }
}

function calculateMarginMetrics() {
    let flightNetTotal = 0;
    let grossAirfareTotal = 0;

    if (flightsContainer) {
        Array.from(flightsContainer.children).forEach(block => {
            const net = parseFloat(block.querySelector('.fl-net')?.value) || 0;
            const margin = parseFloat(block.querySelector('.fl-margin')?.value) || 0;
            const gross = net + (net * (margin / 100));
            
            flightNetTotal += net;
            grossAirfareTotal += gross;
        });
    }

    const dmcNetInput = parseFloat(document.getElementById('dmc-net-cost')?.value) || 0;
    const dmcMarkupInput = parseFloat(document.getElementById('dmc-markup-pct')?.value) || 0;
    let grossLandPackageTotal = dmcNetInput + (dmcNetInput * (dmcMarkupInput / 100));

    let totalAgencyNetCost = flightNetTotal + dmcNetInput;
    let combinedClientGrossQuote = grossLandPackageTotal + grossAirfareTotal;
    let netAgencyProfitTake = combinedClientGrossQuote - totalAgencyNetCost;

    const priceField = document.getElementById('pkg-price');
    const airfareField = document.getElementById('pkg-airfare');
    
    if (priceField) priceField.value = Math.round(grossLandPackageTotal);
    if (airfareField) airfareField.value = Math.round(grossAirfareTotal);

    document.getElementById('meta-net-cost').innerText = `₹${Math.round(totalAgencyNetCost).toLocaleString('en-IN')}`;
    document.getElementById('meta-profit-cost').innerText = `₹${Math.round(netAgencyProfitTake).toLocaleString('en-IN')}`;
    document.getElementById('meta-gross-cost').innerText = `₹${Math.round(combinedClientGrossQuote).toLocaleString('en-IN')}`;
}

function updateLivePreview() {
    calculateMarginMetrics(); 
    if(previewPane) {
        previewPane.innerHTML = compileItineraryHTML();
    }
}

// ====== STANDALONE HOTEL QUOTATION GENERATOR DESK FUNCTIONALITIES ======
function addStandaloneHotelBlock() {
    standaloneHotelCount++;
    const hotelBlock = document.createElement('div');
    hotelBlock.className = 'bg-white/5 border border-white/5 p-4 sm:p-5 rounded-2xl space-y-4 relative transition-all duration-300 shadow-xl';
    hotelBlock.id = `standalone-hotel-block-${standaloneHotelCount}`;
    
    hotelBlock.innerHTML = `
        <div class="flex justify-between items-center pb-2 border-b border-white/5">
            <span class="text-xs font-bold text-emerald-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                <i data-lucide="building" class="h-3.5 w-3.5"></i> Hotel Property Slot ${standaloneHotelCount}
            </span>
            <button type="button" onclick="removeStandaloneHotelBlock(${standaloneHotelCount})" class="text-xs text-red-400 hover:text-red-300 font-medium px-2 py-1 rounded bg-red-500/10 hover:bg-red-500/20 transition flex items-center gap-1">
                <i data-lucide="trash" class="h-3 w-3"></i> Delete
            </button>
        </div>

        <div class="space-y-3 text-xs">
            <div>
                <label class="block text-[10px] text-gray-400 uppercase tracking-wider mb-1 pl-0.5">Hotel Structure Title</label>
                <input type="text" placeholder="e.g., Centara Grand Mirage Beach Resort Pattaya" class="sh-name w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none" oninput="updateHotelVoucherLivePreview()">
            </div>
            
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                    <label class="block text-[10px] text-gray-400 uppercase tracking-wider mb-1 pl-0.5">Check-In Date</label>
                    <input type="date" class="sh-in w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none" onchange="calculateStandaloneNights(${standaloneHotelCount})">
                </div>
                <div>
                    <label class="block text-[10px] text-gray-400 uppercase tracking-wider mb-1 pl-0.5">Check-Out Date</label>
                    <input type="date" class="sh-out w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none" onchange="calculateStandaloneNights(${standaloneHotelCount})">
                </div>
                <div>
                    <label class="block text-[10px] text-gray-400 uppercase tracking-wider mb-1 pl-0.5">Duration (Night/s)</label>
                    <input type="text" readonly value="0 Nights" class="sh-nights w-full bg-indigo-950/20 border border-indigo-500/20 rounded-xl px-3 py-2 text-indigo-300 font-bold font-mono text-center focus:outline-none cursor-not-allowed">
                </div>
            </div>

            <div class="grid grid-cols-2 gap-3 bg-white/[0.01] border border-white/5 p-2 rounded-xl">
                <div>
                    <label class="block text-[10px] text-gray-400 uppercase tracking-wider mb-1 pl-0.5">Number of Adults</label>
                    <input type="number" value="2" min="1" class="sh-adults w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:outline-none" oninput="updateHotelVoucherLivePreview()">
                </div>
                <div>
                    <label class="block text-[10px] text-gray-400 uppercase tracking-wider mb-1 pl-0.5">Number of Kids</label>
                    <input type="number" value="0" min="0" class="sh-kids w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:outline-none" oninput="updateHotelVoucherLivePreview()">
                </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                    <label class="block text-[10px] text-gray-400 uppercase tracking-wider mb-1 pl-0.5">Star Rating Classification</label>
                    <select class="sh-category w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none" onchange="updateHotelVoucherLivePreview()">
                        <option value="5 Star Luxury">5 Star Luxury Property</option>
                        <option value="4 Star Premium">4 Star Premium Property</option>
                        <option value="3 Star Deluxe">3 Star Deluxe Property</option>
                        <option value="3 Star Standard" selected>3 Star Standard Property</option>
                    </select>
                </div>
                <div>
                    <label class="block text-[10px] text-emerald-400 uppercase tracking-wider mb-1 pl-0.5">Custom Quoted Amount (INR)</label>
                    <input type="number" placeholder="e.g., 24500" class="sh-price w-full bg-white/5 border border-emerald-500/20 rounded-xl px-3 py-2.5 text-emerald-400 text-sm font-semibold font-mono focus:outline-none" oninput="updateHotelVoucherLivePreview()">
                </div>
            </div>

            <div>
                <label class="block text-[10px] text-indigo-300 uppercase tracking-wider mb-1 pl-0.5 flex items-center gap-1">
                    <i data-lucide="clipboard-paste" class="h-3 w-3"></i> Hotel Amenities / Details (Paste from B2B Portal)
                </label>
                <textarea placeholder="Paste amenities or custom specs directly here..." rows="3" class="sh-amenities w-full rounded-xl px-3 py-2.5 text-xs text-slate-300 bg-white/5 focus:outline-none resize-none" oninput="updateHotelVoucherLivePreview()"></textarea>
            </div>
        </div>
    `;
    if(standaloneHotelsList) standaloneHotelsList.appendChild(hotelBlock);
    if (typeof lucide !== "undefined") lucide.createIcons();
    updateHotelVoucherLivePreview();
}

function removeStandaloneHotelBlock(id) {
    document.getElementById(`standalone-hotel-block-${id}`)?.remove();
    reindexStandaloneHotels();
    updateHotelVoucherLivePreview();
}

function reindexStandaloneHotels() {
    const blocks = standaloneHotelsList ? standaloneHotelsList.children : [];
    standaloneHotelCount = blocks.length;
    Array.from(blocks).forEach((block, index) => {
        const currentNum = index + 1;
        block.id = `standalone-hotel-block-${currentNum}`;
        block.querySelector('span').innerHTML = `<i data-lucide="building" class="h-3.5 w-3.5"></i> Hotel Property Slot ${currentNum}`;
        const removeBtn = block.querySelector('button');
        if(removeBtn) removeBtn.setAttribute('onclick', `removeStandaloneHotelBlock(${currentNum})`);
    });
    if (typeof lucide !== "undefined") lucide.createIcons();
}

function calculateStandaloneNights(id) {
    const block = document.getElementById(`standalone-hotel-block-${id}`);
    if (!block) return;
    
    const checkInStr = block.querySelector('.sh-in').value;
    const checkOutStr = block.querySelector('.sh-out').value;
    const nightsInput = block.querySelector('.sh-nights');
    
    if (checkInStr && checkOutStr) {
        const date1 = new Date(checkInStr);
        const date2 = new Date(checkOutStr);
        const timeDiff = date2.getTime() - date1.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
        
        if (daysDiff > 0) {
            nightsInput.value = `${daysDiff} Night${daysDiff > 1 ? 's' : ''}`;
        } else {
            nightsInput.value = `0 Nights`;
        }
    } else {
        nightsInput.value = `0 Nights`;
    }
    updateHotelVoucherLivePreview();
}

function compileHotelVoucherHTML() {
    const blocks = standaloneHotelsList ? standaloneHotelsList.children : [];
    let vouchersContentHtml = '';
    let totalGrossQuotationAggregate = 0;

    Array.from(blocks).forEach((block, index) => {
        const hName = block.querySelector('.sh-name').value || "Premium Property Selection";
        const hIn = block.querySelector('.sh-in').value ? formatPremiumDate(block.querySelector('.sh-in').value) : '---';
        const hOut = block.querySelector('.sh-out').value ? formatPremiumDate(block.querySelector('.sh-out').value) : '---';
        const hNights = block.querySelector('.sh-nights').value || '0 Nights';
        const hCategory = block.querySelector('.sh-category').value;
        const hPrice = parseFloat(block.querySelector('.sh-price').value) || 0;
        const hAdults = parseInt(block.querySelector('.sh-adults').value) || 2;
        const hKids = parseInt(block.querySelector('.sh-kids').value) || 0;
        const rawAmenities = block.querySelector('.sh-amenities').value.trim();

        totalGrossQuotationAggregate += hPrice;

        let portalAmenitiesHtml = '';
        if (rawAmenities) {
            const lines = rawAmenities.split('\n').filter(line => line.trim() !== "");
            portalAmenitiesHtml = lines.map(line => `
                <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px; font-size: 11px; color: #334155;">
                    <span style="color: #10b981; font-weight: bold;">✔</span> ${line.trim()}
                </div>
            `).join('');
        } else {
            portalAmenitiesHtml = `
                <div style="color: #94a3b8; font-style: italic; font-size: 11px;">No custom portal specifications input listed.</div>
            `;
        }

        vouchersContentHtml += `
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; margin-bottom: 24px; position: relative; box-shadow: 0 4px 20px rgba(0,0,0,0.02); page-break-inside: avoid;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px dashed #cbd5e1; padding-bottom: 16px; margin-bottom: 18px;">
                    <div>
                        <span style="font-size: 10px; font-weight: 700; color: #10b981; background: #ecfdf5; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; tracking: 0.5px; display: inline-block; margin-bottom: 8px;">Voucher Segment 0${index + 1}</span>
                        <h3 style="font-size: 16px; font-weight: 800; color: #0f172a; margin: 0; line-height: 1.3;">${hName}</h3>
                        <p style="font-size: 11px; color: #64748b; margin: 4px 0 0 0; font-weight: 500;">Classification: <span style="color: #4f46e5; font-weight: 700;">${hCategory}</span></p>
                    </div>
                    <div style="text-align: right;">
                        <span style="font-size: 11px; font-weight: 700; color: #ffffff; background: #0f172a; padding: 6px 12px; border-radius: 8px; display: inline-block; text-transform: uppercase; tracking: 0.5px;">CONFIRMED</span>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; background: #f8fafc; padding: 14px; border-radius: 12px; margin-bottom: 18px; border: 1px solid #f1f5f9;">
                    <div>
                        <span style="font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; display: block; margin-bottom: 2px;">CHECK-IN</span>
                        <strong style="font-size: 12.5px; color: #0f172a; display: block;">${hIn}</strong>
                        <span style="font-size: 10px; color: #94a3b8;">From 14:00 hrs</span>
                    </div>
                    <div style="border-left: 1px solid #e2e8f0; padding-left: 14px;">
                        <span style="font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; display: block; margin-bottom: 2px;">CHECK-OUT</span>
                        <strong style="font-size: 12.5px; color: #0f172a; display: block;">${hOut}</strong>
                        <span style="font-size: 10px; color: #94a3b8;">Until 12:00 hrs</span>
                    </div>
                    <div style="border-left: 1px solid #e2e8f0; padding-left: 14px;">
                        <span style="font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; display: block; margin-bottom: 2px;">STAY LENGTH</span>
                        <strong style="font-size: 13.5px; color: #4f46e5; font-weight: 800;">${hNights}</strong>
                    </div>
                </div>

                <div style="display: flex; gap: 20px; align-items: center; background: #eef2ff; padding: 10px 14px; border-radius: 10px; margin-bottom: 18px; font-size: 12px; color: #3730a3; font-weight: 600; border: 1px solid #e0e7ff;">
                    <div style="display: flex; align-items: center; gap: 4px;">👥 <strong>Occupancy Allotted:</strong></div>
                    <div>👤 ${hAdults} Adult${hAdults > 1 ? 's' : ''}</div>
                    ${hKids > 0 ? `<div style="border-left: 1px solid #c7d2fe; padding-left: 16px;">👶 ${hKids} Child${hKids > 1 ? 'ren' : ''}</div>` : ''}
                </div>

                <div style="background: #fafafa; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px;">
                    <div style="font-size: 10.5px; font-weight: 800; color: #0f172a; text-transform: uppercase; tracking: 0.5px; margin-bottom: 10px; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px;">Property Amenities & Room Specifications</div>
                    <div style="display: grid; grid-template-columns: 1fr; sm:grid-template-columns: 1fr 1fr; gap: 4px 16px;">
                        ${portalAmenitiesHtml}
                    </div>
                </div>

                <div style="margin-top: 16px; text-align: right; font-size: 12px; color: #475569;">
                    Room Segment Value: <strong style="color: #10b981; font-size: 14.5px; font-family: monospace; font-weight: 700;">₹${Math.round(hPrice).toLocaleString('en-IN')}/-</strong>
                </div>
            </div>
        `;
    });

    return `
        <div style="padding: 30px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; background: #ffffff;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 25px;">
                <div>
                    <h2 style="font-size: 22px; font-weight: 900; tracking: -0.5px; color: #0f172a; margin: 0;">TRAVEL WORLD WIDE</h2>
                    <p style="font-size: 10px; color: #64748b; margin: 2px 0 0 0; text-transform: uppercase; tracking: 1.5px; font-weight: 600;">Luxury Hotel Confirmation Voucher</p>
                </div>
                <div style="text-align: right; font-size: 11px; color: #64748b; line-height: 1.4;">
                    <p style="margin:0; font-weight: 700; color: #0f172a;">salestravelworldwide@gmail.com</p>
                    <p style="margin:0; font-weight: 500;">Desk Line: +91 88926 89595</p>
                </div>
            </div>

            ${vouchersContentHtml || '<p style="color:#94a3b8; font-style:italic; font-size:12px; text-align:center; padding:40px 0;">No active properties allocated inside the voucher workspace desk ledger yet.</p>'}

            ${blocks.length > 0 ? `
            <div style="margin-top: 30px; background: #0f172a; color: #ffffff; border-radius: 14px; padding: 20px; display: flex; justify-content: space-between; align-items: center; border: 1px solid rgba(0,0,0,0.05); page-break-inside: avoid;">
                <div>
                    <span style="font-size: 10px; text-transform: uppercase; tracking: 1px; color: #94a3b8; font-weight: 700; display: block; margin-bottom: 2px;">TOTAL CONSOLIDATED ACCOMMODATION INVESTMENT</span>
                    <span style="font-size: 11px; color: #cbd5e1;">All-inclusive of corporate agency coordination levies & resort taxes</span>
                </div>
                <div style="font-size: 22px; font-weight: 800; color: #10b981; font-family: monospace;">
                    ₹${Math.round(totalGrossQuotationAggregate).toLocaleString('en-IN')}/-
                </div>
            </div>
            ` : ''}

            <div style="margin-top: 25px; border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 10px; color: #94a3b8; line-height: 1.5; page-break-inside: avoid;">
                <strong>Important Voucher Guidelines:</strong> This document represents an official boutique booking summary quote curated by Travel World Wide. Room confirmations remain subject to live hotel block inventory availability indices upon direct payment routing sequences. Individual passport identification maps must be provided during properties check-in protocols.
            </div>
        </div>
    `;
}

function updateHotelVoucherLivePreview() {
    if (hotelVoucherPreviewPane) {
        hotelVoucherPreviewPane.innerHTML = compileHotelVoucherHTML();
    }
}

function generateStandaloneHotelPDF() {
    const title = "Hotel_Voucher_Quotation";
    const htmlContent = compileHotelVoucherHTML();
    const printWindow = window.open('', '_blank', 'width=950,height=850');
    
    printWindow.document.write(`
        <html>
        <head>
            <title>${title}_Proposal</title>
            <style>
                body { margin: 0; background: #ffffff; }
                @media print {
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
            </style>
        </head>
        <body>
            ${htmlContent}
            <script>
                window.onload = function() {
                    window.print();
                };
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

async function saveStandaloneHotelsToSupabase() {
    const blocks = standaloneHotelsList ? standaloneHotelsList.children : [];
    if (blocks.length === 0) {
        alert("Please map at least one hotel property slot to trigger saving loops.");
        return;
    }

    standaloneHotelSaveBtn.innerText = "Syncing Cloud Grid...";
    standaloneHotelSaveBtn.disabled = true;

    const firstHotelTitle = blocks[0].querySelector('.sh-name').value || "Standalone Voucher Group";
    let totalAggregateValue = 0;

    const payloadHotels = Array.from(blocks).map(block => {
        const val = parseFloat(block.querySelector('.sh-price').value) || 0;
        totalAggregateValue += val;
        return {
            hotel_name: block.querySelector('.sh-name').value || "TBD",
            check_in: block.querySelector('.sh-in').value || null,
            check_out: block.querySelector('.sh-out').value || null,
            nights: parseInt(block.querySelector('.sh-nights').value) || 0,
            category: block.querySelector('.sh-category').value,
            price: val,
            adults: parseInt(block.querySelector('.sh-adults').value) || 2,
            kids: parseInt(block.querySelector('.sh-kids').value) || 0,
            portal_amenities: block.querySelector('.sh-amenities').value
        };
    });

    const payload = {
        title: "[HOTEL VOUCHER] " + firstHotelTitle,
        destination: "Standalone Hotel Request",
        total_price: totalAggregateValue,
        hotel_details: payloadHotels,
        inclusions: ["Consolidated Room Bookings Summary Only"],
        exclusions: ["Flights or ground itinerary services excluded outside specific vouchers listings"]
    };

    try {
        const dbResult = await supabaseClient.from('itineraries').insert([payload]);
        if (dbResult.error) throw dbResult.error;

        standaloneHotelSaveBtn.innerText = "✓ Voucher Synced";
        standaloneHotelSaveBtn.style.backgroundColor = "#059669";
        setTimeout(() => {
            standaloneHotelSaveBtn.innerText = "Sync Vouchers";
            standaloneHotelSaveBtn.style.backgroundColor = "";
            standaloneHotelSaveBtn.disabled = false;
        }, 2500);
    } catch (err) {
        alert(`Cloud sync fault triggered: ${err.message}`);
        standaloneHotelSaveBtn.innerText = "Sync Vouchers";
        standaloneHotelSaveBtn.disabled = false;
    }
}

// ====== PRE-EXISTING CRM METHODS AND MODULE CORES ======
async function handleWorkspaceLogin(e) {
    if (e) e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const submitBtn = document.getElementById('login-submit-btn');

    if (!email || !password) {
        alert("Please fill out both fields.");
        return;
    }
    submitBtn.innerText = "Verifying Credentials...";
    submitBtn.disabled = true;

    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) throw error;
        submitBtn.innerText = "Access Granted";
        submitBtn.style.backgroundColor = "#10B981";
        if (typeof fadeEngineForWorkspace === "function") fadeEngineForWorkspace();
        setTimeout(() => { unlockPremiumWorkspace(); }, 600);
    } catch (err) {
        alert(`Authentication Failed: ${err.message}`);
        submitBtn.innerText = "Sign In to Workspace";
        submitBtn.disabled = false;
    }
}

async function fetchAndRenderCustomerBase() {
    try {
        const { data: customerData, error } = await supabaseClient
            .from('customers')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if(pkgCustomerSelect) {
            pkgCustomerSelect.innerHTML = '<option value="">-- Link Client Profile --</option>';
            customerData.forEach(cust => {
                pkgCustomerSelect.innerHTML += `<option value="${cust.id}">${cust.full_name}</option>`;
            });
        }

        if(customerTableRows) {
            customerTableRows.innerHTML = '';
            if(customerData.length === 0) {
                customerTableRows.innerHTML = '<tr><td colspan="4" class="py-4 text-center text-gray-500 italic">No business contact profiles recorded yet.</td></tr>';
                return;
            }
            customerData.forEach(cust => {
                const createdStamp = new Date(cust.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                customerTableRows.innerHTML += `
                    <tr class="hover:bg-white/[0.02] transition">
                        <td class="py-3 font-medium text-white">${cust.full_name}</td>
                        <td class="py-3 text-gray-400">${cust.email || '---'}</td>
                        <td class="py-3 text-indigo-300 font-mono">${cust.phone || '---'}</td>
                        <td class="py-3 text-right text-gray-500 font-mono">${createdStamp}</td>
                    </tr>
                `;
            });
        }
    } catch(err) {
        console.error("Profile pull fault triggered:", err);
    }
}

async function onboardNewCustomerRecord() {
    const fullName = document.getElementById('cust-name').value;
    const email = document.getElementById('cust-email').value;
    const mobile = document.getElementById('cust-mobile').value;

    if(!fullName) {
        alert("Please enter a Full Name to save a profile.");
        return;
    }
    addCustSubmitBtn.innerText = "Syncing Profile...";
    addCustSubmitBtn.disabled = true;

    try {
        const { error } = await supabaseClient
            .from('customers')
            .insert([{ full_name: fullName, email: email, phone: mobile }]);

        if (error) throw error;

        document.getElementById('cust-name').value = '';
        document.getElementById('cust-email').value = '';
        document.getElementById('cust-mobile').value = '';

        addCustSubmitBtn.innerText = "✓ Record Saved!";
        addCustSubmitBtn.style.backgroundColor = "#059669";
        await fetchAndRenderCustomerBase();
        setTimeout(() => {
            addCustSubmitBtn.innerText = "Commit Profile to Database";
            addCustSubmitBtn.style.backgroundColor = "";
            addCustSubmitBtn.disabled = false;
        }, 2000);
    } catch(err) {
        alert(`Contact pipeline failed: ${err.message}`);
        addCustSubmitBtn.innerText = "Commit Profile to Database";
        addCustSubmitBtn.disabled = false;
    }
}

function addFlightSectorBlock() {
    flightCount++;
    const flightBlock = document.createElement('div');
    flightBlock.className = 'bg-white/5 border border-white/5 p-3 sm:p-4 rounded-xl space-y-3 relative transition-all duration-300';
    flightBlock.id = `flight-block-${flightCount}`;
    
    flightBlock.innerHTML = `
        <div class="flex justify-between items-center">
            <span class="text-xs font-bold text-cyan-400 uppercase tracking-wider">Flight Sector Route ${flightCount}</span>
            <button type="button" onclick="removeFlightSectorBlock(${flightCount})" class="text-xs text-red-400 hover:text-red-300 opacity-60 hover:opacity-100 transition">Remove</button>
        </div>
        <div class="grid grid-cols-2 gap-2 bg-cyan-950/20 p-2 rounded-lg border border-cyan-500/10">
            <div>
                <label class="block text-[9px] text-cyan-400 uppercase tracking-wider mb-1">Net Airfare Buying Cost (INR)</label>
                <input type="number" placeholder="e.g., 12000" class="fl-net w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none" oninput="updateLivePreview()">
            </div>
            <div>
                <label class="block text-[9px] text-cyan-400 uppercase tracking-wider mb-1">Airfare Markup (%)</label>
                <input type="number" value="0" class="fl-margin w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none" oninput="updateLivePreview()">
            </div>
        </div>
        <div class="space-y-3 text-xs">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                    <label class="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">Flight Number</label>
                    <input type="text" placeholder="e.g., TG-318" class="fl-num w-full bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-white focus:outline-none" oninput="updateLivePreview()">
                </div>
                <div>
                    <label class="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">Route String</label>
                    <input type="text" placeholder="e.g., MAA - BKK" class="fl-route w-full bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-white focus:outline-none" oninput="updateLivePreview()">
                </div>
                <div>
                    <label class="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">Duration</label>
                    <input type="text" placeholder="e.g., 3h 45m" class="fl-duration w-full bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-white focus:outline-none" oninput="updateLivePreview()">
                </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div class="bg-white/[0.02] p-2 rounded-lg border border-white/5 space-y-2">
                    <span class="text-[10px] font-bold text-gray-400 uppercase">Departure</span>
                    <input type="date" class="fl-dep-date w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[11px] text-white focus:outline-none" oninput="updateLivePreview()">
                    <input type="text" placeholder="Time" class="fl-dep-time w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[11px] text-white focus:outline-none" oninput="updateLivePreview()">
                </div>
                <div class="bg-white/[0.02] p-2 rounded-lg border border-white/5 space-y-2">
                    <span class="text-[10px] font-bold text-gray-400 uppercase">Arrival</span>
                    <input type="date" class="fl-arr-date w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[11px] text-white focus:outline-none" oninput="updateLivePreview()">
                    <input type="text" placeholder="Time" class="fl-arr-time w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[11px] text-white focus:outline-none" oninput="updateLivePreview()">
                </div>
            </div>
            <div class="pt-2 border-t border-white/5">
                <label class="inline-flex items-center text-[11px] text-cyan-300 cursor-pointer">
                    <input type="checkbox" class="fl-has-leg2 mr-2 accent-cyan-600" onchange="toggleFlightLeg2(${flightCount})">
                    Include Connection / 2nd Leg
                </label>
            </div>
            <div id="flight-leg2-container-${flightCount}" class="hidden pt-3 border-t border-white/10 space-y-3 bg-cyan-950/10 p-3 rounded-xl border border-cyan-500/10">
                <span class="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">Connecting Leg 2 Specifications</span>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                        <label class="block text-[9px] text-gray-400 uppercase mb-1">Flight Number (Leg 2)</label>
                        <input type="text" placeholder="e.g., TG-123" class="fl-num2 w-full bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-white focus:outline-none" oninput="updateLivePreview()">
                    </div>
                    <div>
                        <label class="block text-[9px] text-gray-400 uppercase mb-1">Route (Leg 2)</label>
                        <input type="text" placeholder="e.g., BKK - HKT" class="fl-route2 w-full bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-white focus:outline-none" oninput="updateLivePreview()">
                    </div>
                    <div>
                        <label class="block text-[9px] text-gray-400 uppercase mb-1">Duration (Leg 2)</label>
                        <input type="text" placeholder="e.g., 1h 20m" class="fl-duration2 w-full bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-white focus:outline-none" oninput="updateLivePreview()">
                    </div>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div class="space-y-1">
                        <label class="block text-[9px] text-gray-400 uppercase">Departure (Leg 2)</label>
                        <input type="date" class="fl-dep-date2 w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[11px] text-white focus:outline-none" oninput="updateLivePreview()">
                        <input type="text" placeholder="Time" class="fl-dep-time2 w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[11px] text-white focus:outline-none" oninput="updateLivePreview()">
                    </div>
                    <div class="space-y-1">
                        <label class="block text-[9px] text-gray-400 uppercase">Arrival (Leg 2)</label>
                        <input type="date" class="fl-arr-date2 w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[11px] text-white focus:outline-none" oninput="updateLivePreview()">
                        <input type="text" placeholder="Time" class="fl-arr-time2 w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[11px] text-white focus:outline-none" oninput="updateLivePreview()">
                    </div>
                </div>
            </div>
        </div>
    `;
    if(flightsContainer) flightsContainer.appendChild(flightBlock);
    updateLivePreview();
}

function removeFlightSectorBlock(id) {
    document.getElementById(`flight-block-${id}`)?.remove();
    updateLivePreview();
}

function addHotelStayBlock() {
    hotelCount++;
    const hotelBlock = document.createElement('div');
    hotelBlock.className = 'bg-white/5 border border-white/5 p-3 sm:p-4 rounded-xl space-y-3 relative transition-all duration-300';
    hotelBlock.id = `hotel-block-${hotelCount}`;
    
    hotelBlock.innerHTML = `
        <div class="flex justify-between items-center">
            <span class="text-xs font-bold text-indigo-400 uppercase tracking-wider">Property Location Slot ${hotelCount}</span>
            <button type="button" onclick="removeHotelStayBlock(${hotelCount})" class="text-xs text-red-400 hover:text-red-300 opacity-60 hover:opacity-100 transition">Remove</button>
        </div>
        <div class="space-y-3">
            <input type="text" placeholder="Hotel Name" class="hotel-name w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none text-white" oninput="updateLivePreview()">
            <div class="grid grid-cols-3 gap-1.5">
                <div>
                    <label class="block text-[9px] text-gray-400 uppercase tracking-wider mb-1">Check-In</label>
                    <input type="date" class="hotel-in w-full bg-white/5 border border-white/10 rounded-lg px-1.5 py-1.5 text-[10px] focus:outline-none text-white" oninput="updateLivePreview()">
                </div>
                <div>
                    <label class="block text-[9px] text-gray-400 uppercase tracking-wider mb-1">Check-Out</label>
                    <input type="date" class="hotel-out w-full bg-white/5 border border-white/10 rounded-lg px-1.5 py-1.5 text-[10px] focus:outline-none text-white" oninput="updateLivePreview()">
                </div>
                <div>
                    <label class="block text-[9px] text-gray-400 uppercase tracking-wider mb-1">Nights</label>
                    <input type="number" placeholder="2" class="hotel-nights w-full bg-white/5 border border-white/10 rounded-lg px-1.5 py-1.5 text-[10px] focus:outline-none text-white" oninput="updateLivePreview()">
                </div>
            </div>
        </div>
    `;
    if(hotelsContainer) hotelsContainer.appendChild(hotelBlock);
    updateLivePreview();
}

function removeHotelStayBlock(id) {
    document.getElementById(`hotel-block-${id}`)?.remove();
    updateLivePreview();
}

function addItineraryDay() {
    dayCount++;
    const dayBlock = document.createElement('div');
    dayBlock.className = 'bg-white/5 border border-white/5 p-3 sm:p-4 rounded-xl space-y-3 relative transition-all duration-300';
    dayBlock.id = `day-block-${dayCount}`;
    
    dayBlock.innerHTML = `
        <div class="flex justify-between items-center">
            <span class="text-xs font-bold text-indigo-400 uppercase tracking-wider">Day ${dayCount}</span>
            <button type="button" onclick="removeItineraryDay(${dayCount})" class="text-xs text-red-400 hover:text-red-300 opacity-60 hover:opacity-100 transition">Remove</button>
        </div>
        <input type="text" placeholder="Day Title: e.g., Arrival & Beachside Sunset Dinner" class="day-title-input w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none text-white" oninput="updateLivePreview()">
        <textarea placeholder="Excursion or tour details below this day..." rows="3" class="day-desc-input w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none text-white resize-none" oninput="updateLivePreview()"></textarea>
    `;
    if(daysContainer) daysContainer.appendChild(dayBlock);
    updateLivePreview();
}

function removeItineraryDay(id) {
    const element = document.getElementById('day-block-' + id);
    if (element) {
        element.remove();
        reindexDays();
        updateLivePreview();
    }
}

function reindexDays() {
    const blocks = daysContainer ? daysContainer.children : [];
    dayCount = blocks.length;
    Array.from(blocks).forEach((block, index) => {
        const currentNum = index + 1;
        block.id = `day-block-${currentNum}`;
        block.querySelector('span').innerText = `Day ${currentNum}`;
        const removeBtn = block.querySelector('button');
        if(removeBtn) removeBtn.setAttribute('onclick', `removeItineraryDay(${currentNum})`);
    });
}
