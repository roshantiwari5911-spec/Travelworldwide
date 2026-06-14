// ====== SUPABASE CLOUD CONNECTION CONFIGURATION ======
const SUPABASE_URL = "https://txqhsxyodszbfwsqvcjf.supabase.co"; 
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4cWhzeHlvZHN6YmZ3c3F2Y2pmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0MTIzMTgsImV4cCI6MjA5Njk4ODMxOH0._86b10n0y6WPasyJqdCX-MKxtXfXtVyYsW9cS3B43cQ";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// =====================================================

let dayCount = 0;
let hotelCount = 0;
let flightCount = 0;
let activeItineraryId = null; 

let addDayBtn, addHotelBtn, addFlightBtn, daysContainer, hotelsContainer, flightsContainer, previewPane, loginGate, crmWorkspace;
let tabItinerary, tabCustomers, moduleItinerary, moduleCustomers, pkgCustomerSelect, customerTableRows, addCustSubmitBtn, logoutBtn;
let savedItinerariesLedger, clearWorkspaceBtn, activeRecordBadge;
let ledgerDrawer, openLedgerBtn, closeLedgerBtn; 

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
    moduleItinerary = document.getElementById('module-itinerary');
    moduleCustomers = document.getElementById('module-customers');
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

    tabItinerary?.addEventListener('click', () => switchCrmModule('itinerary'));
    tabCustomers?.addEventListener('click', () => switchCrmModule('customers'));
    addCustSubmitBtn?.addEventListener('click', onboardNewCustomerRecord);
    logoutBtn?.addEventListener('click', executeWorkspaceSignOut);
    clearWorkspaceBtn?.addEventListener('click', resetBuilderWorkspaceForm);

    openLedgerBtn?.addEventListener('click', () => toggleLedgerDrawer(true));
    closeLedgerBtn?.addEventListener('click', () => toggleLedgerDrawer(false));

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
        console.warn("Session auto-check completed.");
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
    if(activeModule === 'itinerary') {
        tabItinerary.className = "text-[11px] bg-white text-black font-semibold px-3 py-1.5 rounded-lg shadow transition";
        tabCustomers.className = "text-[11px] bg-white/5 text-gray-300 hover:bg-white/10 font-semibold px-3 py-1.5 rounded-lg transition";
        moduleItinerary.classList.remove('hidden');
        moduleCustomers.classList.add('hidden');
        if(openLedgerBtn) openLedgerBtn.style.display = 'flex';
    } else {
        tabCustomers.className = "text-[11px] bg-white text-black font-semibold px-3 py-1.5 rounded-lg shadow transition";
        tabItinerary.className = "text-[11px] bg-white/5 text-gray-300 hover:bg-white/10 font-semibold px-3 py-1.5 rounded-lg transition";
        moduleCustomers.classList.remove('hidden');
        moduleItinerary.classList.add('hidden');
        if(openLedgerBtn) openLedgerBtn.style.display = 'none';
        toggleLedgerDrawer(false); 
        fetchAndRenderCustomerBase(); 
    }
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
    
    // Clear out DMC Outsourcing Form Sheets
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
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            `;
        });
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

        // RESTORE CONSOLIDATED GLOBAL DMC LOGISTICS VALUES FROM DATABASE
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

// UPGRADED: REVENUE ENGINE CALCULATES DMCs WHOLE LAND PACKAGE OUTSOURCE COST CONSOLIDATIONS
function calculateMarginMetrics() {
    let flightNetTotal = 0;
    let grossAirfareTotal = 0;

    // 1. Calculate isolated internal airfare margins
    if (flightsContainer) {
        Array.from(flightsContainer.children).forEach(block => {
            const net = parseFloat(block.querySelector('.fl-net')?.value) || 0;
            const margin = parseFloat(block.querySelector('.fl-margin')?.value) || 0;
            const gross = net + (net * (margin / 100));
            
            flightNetTotal += net;
            grossAirfareTotal += gross;
        });
    }

    // 2. Parse Centralized Consolidated Whole Package DMC Sizing Inputs
    const dmcNetInput = parseFloat(document.getElementById('dmc-net-cost')?.value) || 0;
    const dmcMarkupInput = parseFloat(document.getElementById('dmc-markup-pct')?.value) || 0;
    
    let grossLandPackageTotal = dmcNetInput + (dmcNetInput * (dmcMarkupInput / 100));

    // 3. Formulate total multi-component analytics metrics
    let totalAgencyNetCost = flightNetTotal + dmcNetInput;
    let combinedClientGrossQuote = grossLandPackageTotal + grossAirfareTotal;
    let netAgencyProfitTake = combinedClientGrossQuote - totalAgencyNetCost;

    // Direct calculated math elements back into input display fields
    const priceField = document.getElementById('pkg-price');
    const airfareField = document.getElementById('pkg-airfare');
    
    if (priceField) priceField.value = Math.round(grossLandPackageTotal);
    if (airfareField) airfareField.value = Math.round(grossAirfareTotal);

    // Push calculation metrics downstream to internal desk overview ledger board
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

// FIXED: Cleaned hotel generator inputs to completely purge old scattered individual card net metrics
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

// FIXED: Save function binds new single high-level columns onto the payload dictionary
async function saveItineraryToSupabase() {
    const saveBtn = document.getElementById('save-btn');
    const originalText = saveBtn.innerText;
    saveBtn.innerText = "Saving to Cloud...";
    saveBtn.style.opacity = "0.6";

    const title = document.getElementById('pkg-title').value;
    const destination = document.getElementById('pkg-destination').value;
    const startDate = document.getElementById('pkg-date').value || null;
    const numberOfPeople = parseInt(document.getElementById('pkg-pax').value) || 1;
    const vehicleUsed = document.getElementById('pkg-vehicle').value;
    const totalPrice = parseFloat(document.getElementById('pkg-price').value) || 0;
    const customerId = document.getElementById('pkg-customer-select').value || null;
    const airfarePrice = parseFloat(document.getElementById('pkg-airfare').value) || 0;

    // CAPTURE CENTRALIZED WHOLE CONTAINER METRICS KEYS
    const dmcNetCost = parseFloat(document.getElementById('dmc-net-cost').value) || 0;
    const dmcMarkupPct = parseFloat(document.getElementById('dmc-markup-pct').value) || 0;

    const inclusionsText = document.getElementById('pkg-inclusions')?.value || "";
    const exclusionsText = document.getElementById('pkg-exclusions')?.value || "";
    const inclusions = inclusionsText.split('\n').filter(item => item.trim() !== "");
    const exclusions = exclusionsText.split('\n').filter(item => item.trim() !== "");

    const hotelBlocks = hotelsContainer ? hotelsContainer.children : [];
    const hotelsPayload = Array.from(hotelBlocks).map(block => {
        return {
            hotel_name: block.querySelector('.hotel-name').value || "TBD",
            check_in: block.querySelector('.hotel-in').value || null,
            check_out: block.querySelector('.hotel-out').value || null,
            nights: parseInt(block.querySelector('.hotel-nights').value) || 0
        };
    });

    const flightBlocks = flightsContainer ? flightsContainer.children : [];
    const flightsPayload = Array.from(flightBlocks).map(block => {
        return {
            flight_number: block.querySelector('.fl-num').value || "TBD",
            route: block.querySelector('.fl-route').value || "---",
            duration: block.querySelector('.fl-duration').value || "---",
            dep_date: block.querySelector('.fl-dep-date').value || null,
            dep_time: block.querySelector('.fl-dep-time').value || "---",
            arr_date: block.querySelector('.fl-arr-date').value || null,
            arr_time: block.querySelector('.fl-arr-time').value || "---",
            net_cost: parseFloat(block.querySelector('.fl-net')?.value) || 0,
            margin_pct: parseFloat(block.querySelector('.fl-margin')?.value) || 0,
            has_leg2: block.querySelector('.fl-has-leg2').checked,
            leg2: block.querySelector('.fl-has-leg2').checked ? {
                flight_number: block.querySelector('.fl-num2').value || "TBD",
                route: block.querySelector('.fl-route2').value || "---",
                duration: block.querySelector('.fl-duration2').value || "---",
                dep_date: block.querySelector('.fl-dep-date2').value || null,
                dep_time: block.querySelector('.fl-dep-time2').value || "---",
                arr_date: block.querySelector('.fl-arr-date2').value || null,
                arr_time: block.querySelector('.fl-arr-time2').value || "---"
            } : null
        };
    });

    if (!title || !destination) {
        alert("Please provide at least a Title and Destination to save this quotation.");
        saveBtn.innerText = originalText;
        saveBtn.style.opacity = "1";
        return;
    }

    const payload = {
        title,
        destination,
        start_date: startDate,
        number_of_people: numberOfPeople,
        vehicle_used: vehicleUsed,
        total_price: totalPrice,
        inclusions,
        exclusions,
        hotel_details: hotelsPayload,
        customer_id: customerId,
        flight_details: flightsPayload, 
        airfare_price: airfarePrice,
        dmc_net_cost: dmcNetCost,      // Maps globally to Supabase table column cache
        dmc_markup_pct: dmcMarkupPct   // Maps globally to Supabase table column cache
    };

    try {
        let dbResult;
        if (activeItineraryId) {
            dbResult = await supabaseClient.from('itineraries').update(payload).eq('id', activeItineraryId);
        } else {
            dbResult = await supabaseClient.from('itineraries').insert([payload]);
        }

        if (dbResult.error) throw dbResult.error;

        saveBtn.innerText = "✓ Synced to CRM";
        saveBtn.style.backgroundColor = "#059669"; 
        await fetchAndRenderItinerariesLedger(); 
        setTimeout(() => {
            saveBtn.innerText = originalText;
            saveBtn.style.backgroundColor = ""; 
            saveBtn.style.opacity = "1";
        }, 2500);
    } catch (err) {
        console.error("Database operation failure:", err);
        alert(`Could not sync to cloud: ${err.message}`);
        saveBtn.innerText = originalText;
        saveBtn.style.opacity = "1";
    }
}
window.deleteItineraryRecord = deleteItineraryRecord;
window.toggleFlightLeg2 = toggleFlightLeg2;
</script>
