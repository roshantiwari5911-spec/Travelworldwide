// ====== SUPABASE CLOUD CONNECTION CONFIGURATION ======
const SUPABASE_URL = "https://txqhsxyodszbfwsqvcjf.supabase.co"; 
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4cWhzeHlvZHN6YmZ3c3F2Y2pmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0MTIzMTgsImV4cCI6MjA5Njk4ODMxOH0._86b10n0y6WPasyJqdCX-MKxtXfXtVyYsW9cS3B43cQ";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// =====================================================

let dayCount = 0;
let hotelCount = 0;
let flightCount = 0;
let activeItineraryId = null; // FIXED: Tracks if an existing record is loaded for editing

let addDayBtn, addHotelBtn, addFlightBtn, daysContainer, hotelsContainer, flightsContainer, previewPane, loginGate, crmWorkspace;
let tabItinerary, tabCustomers, moduleItinerary, moduleCustomers, pkgCustomerSelect, customerTableRows, addCustSubmitBtn, logoutBtn;
let savedItinerariesLedger, clearWorkspaceBtn, activeRecordBadge;

const inputs = ['pkg-title', 'pkg-destination', 'pkg-date', 'pkg-pax', 'pkg-vehicle', 'pkg-price', 'pkg-airfare', 'pkg-inclusions', 'pkg-exclusions'];

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

    tabItinerary?.addEventListener('click', () => switchCrmModule('itinerary'));
    tabCustomers?.addEventListener('click', () => switchCrmModule('customers'));
    addCustSubmitBtn?.addEventListener('click', onboardNewCustomerRecord);
    logoutBtn?.addEventListener('click', executeWorkspaceSignOut);
    clearWorkspaceBtn?.addEventListener('click', resetBuilderWorkspaceForm);

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

async function checkExistingAuthSession() {
    try {
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        if (error) throw error;

        if (session) {
            if (typeof fadeEngineForWorkspace === "function") fadeEngineForWorkspace();
            unlockPremiumWorkspace();
        }
    } catch (err) {
        console.warn("Session auto-check status:", err.open);
    }
}

async function executeWorkspaceSignOut() {
    try {
        const { error } = await supabaseClient.auth.signOut();
        if (error) throw error;
        crmWorkspace.style.opacity = "0";
        setTimeout(() => {
            window.location.reload();
        }, 500);
    } catch (err) {
        alert(`Sign Out Fault: ${err.message}`);
    }
}

function switchCrmModule(activeModule) {
    if(activeModule === 'itinerary') {
        tabItinerary.className = "text-xs bg-white text-black font-semibold px-4 py-2 rounded-xl shadow transition";
        tabCustomers.className = "text-xs bg-white/5 text-gray-300 hover:bg-white/10 font-semibold px-4 py-2 rounded-xl transition";
        moduleItinerary.classList.remove('hidden');
        moduleCustomers.classList.add('hidden');
        fetchAndRenderItinerariesLedger(); // Refresh index anytime user opens builder tab
    } else {
        tabCustomers.className = "text-xs bg-white text-black font-semibold px-4 py-2 rounded-xl shadow transition";
        tabItinerary.className = "text-xs bg-white/5 text-gray-300 hover:bg-white/10 font-semibold px-4 py-2 rounded-xl transition";
        moduleCustomers.classList.remove('hidden');
        moduleItinerary.classList.add('hidden');
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
            fetchAndRenderItinerariesLedger(); // Render sidebar ledger listings immediately
            resetBuilderWorkspaceForm();
        }, 50);
    }, 500);
}

// FIXED: Resets workspace completely to initialize a completely brand new layout form
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
    
    dayCount = 0;
    hotelCount = 0;
    flightCount = 0;

    addFlightSectorBlock();
    addHotelStayBlock(); 
    addItineraryDay();    
    updateLivePreview();
}

// NEW: Fetches saved records list and appends it cleanly to the ledger sidebar container
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
                <div onclick="loadSavedItineraryIntoWorkspace('${itin.id}')" class="p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-indigo-500/40 hover:bg-white/[0.05] cursor-pointer transition flex flex-col gap-1 text-left group">
                    <div class="font-medium text-white group-hover:text-indigo-300 transition truncate">${itin.title}</div>
                    <div class="flex justify-between items-center text-[11px] text-gray-400">
                        <span>${itin.destination}</span>
                        <span class="font-mono text-emerald-400 font-semibold">${priceFormatted}</span>
                    </div>
                    <div class="text-[9px] text-gray-600 font-mono text-right mt-1">Saved: ${dateStamp}</div>
                </div>
            `;
        });
    } catch (err) {
        console.error("Ledger acquisition failed:", err);
    }
}

// NEW: Loads a clicked saved itinerary back into the active editing fields dynamically
async function loadSavedItineraryIntoWorkspace(id) {
    try {
        const { data: itin, error } = await supabaseClient
            .from('itineraries')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        if (!itin) return;

        // Establish operational global parameters mode switches
        activeItineraryId = itin.id;
        if (activeRecordBadge) activeRecordBadge.classList.remove('hidden');

        // Inject high level primitive parameters field keys
        document.getElementById('pkg-title').value = itin.title || '';
        document.getElementById('pkg-destination').value = itin.destination || '';
        document.getElementById('pkg-date').value = itin.start_date || '';
        document.getElementById('pkg-pax').value = itin.number_of_people || '';
        document.getElementById('pkg-vehicle').value = itin.vehicle_used || '';
        document.getElementById('pkg-price').value = itin.total_price || '0';
        document.getElementById('pkg-airfare').value = itin.airfare_price || '';
        
        if (pkgCustomerSelect) pkgCustomerSelect.value = itin.customer_id || '';

        // Flatten text arrays back into standard multiline strings strings
        document.getElementById('pkg-inclusions').value = Array.isArray(itin.inclusions) ? itin.inclusions.join('\n') : '';
        document.getElementById('pkg-exclusions').value = Array.isArray(itin.exclusions) ? itin.exclusions.join('\n') : '';

        // Clear layout container fields to prevent cross contamination loops
        if (flightsContainer) flightsContainer.innerHTML = '';
        if (hotelsContainer) hotelsContainer.innerHTML = '';
        if (daysContainer) daysContainer.innerHTML = '';
        
        flightCount = 0;
        hotelCount = 0;
        dayCount = 0;

        // Reconstruct Saved Flights Blocks Framework Arrays
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
                
                if (fl.has_leg2 && fl.leg2) {
                    currentBlock.querySelector('.fl-has-leg2').checked = true;
                    const leg2Container = document.getElementById(`flight-leg2-container-${flightCount}`);
                    leg2Container.classList.remove('hidden');
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

        // Reconstruct Saved Stays Hotel Blocks Framework Arrays
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

        // Reconstruct Day-wise layout textual sequences
        // Note: If you choose to expand days structured mapping later, we pull directly from your itineraries columns setup 
        // For fallback safety, if you have multiple day entries, let's auto initialize the standard day content stack.
        if (daysContainer && daysContainer.children.length === 0) {
            addItineraryDay();
        }

        updateLivePreview();
        // Soft focus view snap to top input section field smoothly
        document.getElementById('pkg-title').scrollIntoView({ behavior: 'smooth' });

    } catch (err) {
        alert(`Could not load itinerary data payload: ${err.message}`);
    }
}

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
    flightBlock.className = 'bg-white/5 border border-white/5 p-4 rounded-xl space-y-3 relative transition-all duration-300';
    flightBlock.id = `flight-block-${flightCount}`;
    
    flightBlock.innerHTML = `
        <div class="flex justify-between items-center">
            <span class="text-xs font-bold text-cyan-400 uppercase tracking-wider">Flight Sector Route ${flightCount}</span>
            <button type="button" onclick="removeFlightSectorBlock(${flightCount})" class="text-xs text-red-400 hover:text-red-300 opacity-60 hover:opacity-100 transition">Remove</button>
        </div>
        <div class="space-y-3 text-xs">
            <div class="grid grid-cols-3 gap-2">
                <div>
                    <label class="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">Flight Number</label>
                    <input type="text" placeholder="e.g., TG-318" class="fl-num w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white focus:outline-none" oninput="updateLivePreview()">
                </div>
                <div>
                    <label class="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">Route String</label>
                    <input type="text" placeholder="e.g., MAA - BKK" class="fl-route w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white focus:outline-none" oninput="updateLivePreview()">
                </div>
                <div>
                    <label class="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">Duration</label>
                    <input type="text" placeholder="e.g., 3h 45m" class="fl-duration w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white focus:outline-none" oninput="updateLivePreview()">
                </div>
            </div>
            
            <div class="grid grid-cols-2 gap-3">
                <div class="bg-white/[0.02] p-2 rounded-lg border border-white/5 space-y-2">
                    <span class="text-[10px] font-bold text-gray-400 uppercase">Departure</span>
                    <input type="date" class="fl-dep-date w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none" oninput="updateLivePreview()">
                    <input type="text" placeholder="Time" class="fl-dep-time w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none" oninput="updateLivePreview()">
                </div>
                <div class="bg-white/[0.02] p-2 rounded-lg border border-white/5 space-y-2">
                    <span class="text-[10px] font-bold text-gray-400 uppercase">Arrival</span>
                    <input type="date" class="fl-arr-date w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none" oninput="updateLivePreview()">
                    <input type="text" placeholder="Time" class="fl-arr-time w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none" oninput="updateLivePreview()">
                </div>
            </div>

            <div class="pt-2 border-t border-white/5">
                <label class="inline-flex items-center text-[11px] text-cyan-300 cursor-pointer">
                    <input type="checkbox" class="fl-has-leg2 mr-2 accent-cyan-600" onchange="toggleFlightLeg2(${flightCount})">
                    Include Connection / 2nd Leg Configuration
                </label>
            </div>

            <div id="flight-leg2-container-${flightCount}" class="hidden pt-3 border-t border-white/10 space-y-3 bg-cyan-950/10 p-3 rounded-xl border border-cyan-500/10">
                <span class="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">Connecting Leg 2 Specifications</span>
                <div class="grid grid-cols-3 gap-2">
                    <div>
                        <label class="block text-[9px] text-gray-400 uppercase mb-1">Flight Number (Leg 2)</label>
                        <input type="text" placeholder="e.g., TG-123" class="fl-num2 w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white focus:outline-none" oninput="updateLivePreview()">
                    </div>
                    <div>
                        <label class="block text-[9px] text-gray-400 uppercase mb-1">Route (Leg 2)</label>
                        <input type="text" placeholder="e.g., BKK - HKT" class="fl-route2 w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white focus:outline-none" oninput="updateLivePreview()">
                    </div>
                    <div>
                        <label class="block text-[9px] text-gray-400 uppercase mb-1">Duration (Leg 2)</label>
                        <input type="text" placeholder="e.g., 1h 20m" class="fl-duration2 w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white focus:outline-none" oninput="updateLivePreview()">
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-2">
                    <div class="space-y-1">
                        <label class="block text-[9px] text-gray-400 uppercase">Departure (Leg 2)</label>
                        <input type="date" class="fl-dep-date2 w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none" oninput="updateLivePreview()">
                        <input type="text" placeholder="Time" class="fl-dep-time2 w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none" oninput="updateLivePreview()">
                    </div>
                    <div class="space-y-1">
                        <label class="block text-[9px] text-gray-400 uppercase">Arrival (Leg 2)</label>
                        <input type="date" class="fl-arr-date2 w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none" oninput="updateLivePreview()">
                        <input type="text" placeholder="Time" class="fl-arr-time2 w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none" oninput="updateLivePreview()">
                    </div>
                </div>
            </div>
        </div>
    `;
    flightsContainer.appendChild(flightBlock);
    updateLivePreview();
}

function removeFlightSectorBlock(id) {
    document.getElementById(`flight-block-${id}`)?.remove();
    updateLivePreview();
}

// Fixed connecting leg interface mappings reference hook parameters
window.toggleFlightLeg2 = toggleFlightLeg2;
window.removeFlightSectorBlock = removeFlightSectorBlock;
window.removeHotelStayBlock = removeHotelStayBlock;
window.removeItineraryDay = removeItineraryDay;
window.loadSavedItineraryIntoWorkspace = loadSavedItineraryIntoWorkspace;

function toggleFlightLeg2(id) {
    const block = document.getElementById(`flight-block-${id}`);
    const leg2Container = document.getElementById(`flight-leg2-container-${id}`);
    const checkbox = block.querySelector('.fl-has-leg2');
    
    if (checkbox.checked) {
        leg2Container.classList.remove('hidden');
    } else {
        leg2Container.classList.add('hidden');
    }
    updateLivePreview();
}

function addHotelStayBlock() {
    hotelCount++;
    const hotelBlock = document.createElement('div');
    hotelBlock.className = 'bg-white/5 border border-white/5 p-4 rounded-xl space-y-3 relative transition-all duration-300';
    hotelBlock.id = `hotel-block-${hotelCount}`;
    
    hotelBlock.innerHTML = `
        <div class="flex justify-between items-center">
            <span class="text-xs font-bold text-indigo-400 uppercase tracking-wider">Property Location Slot ${hotelCount}</span>
            <button type="button" onclick="removeHotelStayBlock(${hotelCount})" class="text-xs text-red-400 hover:text-red-300 opacity-60 hover:opacity-100 transition">Remove</button>
        </div>
        <div class="space-y-3">
            <input type="text" placeholder="Hotel Name" class="hotel-name w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none text-white" oninput="updateLivePreview()">
            <div class="grid grid-cols-3 gap-2">
                <div>
                    <label class="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">Check-In</label>
                    <input type="date" class="hotel-in w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[11px] focus:outline-none text-white" oninput="updateLivePreview()">
                </div>
                <div>
                    <label class="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">Check-Out</label>
                    <input type="date" class="hotel-out w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[11px] focus:outline-none text-white" oninput="updateLivePreview()">
                </div>
                <div>
                    <label class="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">Total Nights</label>
                    <input type="number" placeholder="2" class="hotel-nights w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[11px] focus:outline-none text-white" oninput="updateLivePreview()">
                </div>
            </div>
        </div>
    `;
    hotelsContainer.appendChild(hotelBlock);
    updateLivePreview();
}

function removeHotelStayBlock(id) {
    document.getElementById(`hotel-block-${id}`)?.remove();
    updateLivePreview();
}

function addItineraryDay() {
    dayCount++;
    const dayBlock = document.createElement('div');
    dayBlock.className = 'bg-white/5 border border-white/5 p-4 rounded-xl space-y-3 relative transition-all duration-300';
    dayBlock.id = `day-block-${dayCount}`;
    
    dayBlock.innerHTML = `
        <div class="flex justify-between items-center">
            <span class="text-xs font-bold text-indigo-400 uppercase tracking-wider">Day ${dayCount}</span>
            <button type="button" onclick="removeItineraryDay(${dayCount})" class="text-xs text-red-400 hover:text-red-300 opacity-60 hover:opacity-100 transition">Remove</button>
        </div>
        <input type="text" placeholder="Day Title: e.g., Arrival & Beachside Sunset Dinner" class="day-title-input w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none text-white" oninput="updateLivePreview()">
        <textarea placeholder="Excursion or tour details below this day..." rows="3" class="day-desc-input w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none text-white resize-none" oninput="updateLivePreview()"></textarea>
    `;
    daysContainer.appendChild(dayBlock);
    updateLivePreview();
}

function removeItineraryDay(id) {
    const element = document.getElementById(`day-block-${id}`);
    if (element) {
        element.remove();
        reindexDays();
        updateLivePreview();
    }
}

function reindexDays() {
    const blocks = daysContainer.children;
    dayCount = blocks.length;
    Array.from(blocks).forEach((block, index) => {
        const currentNum = index + 1;
        block.id = `day-block-${currentNum}`;
        block.querySelector('span').innerText = `Day ${currentNum}`;
        const removeBtn = block.querySelector('button');
        if(removeBtn) removeBtn.setAttribute('onclick', `removeItineraryDay(${currentNum})`);
    });
}
</script>
<script src="app.js"></script>
</body>
</html>
