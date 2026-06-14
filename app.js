// ====== SUPABASE CLOUD CONNECTION CONFIGURATION ======
const SUPABASE_URL = "https://txqhsxyodszbfwsqvcjf.supabase.co"; 
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4cWhzeHlvZHN6YmZ3c3F2Y2pmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0MTIzMTgsImV4cCI6MjA5Njk4ODMxOH0._86b10n0y6WPasyJqdCX-MKxtXfXtVyYsW9cS3B43cQ";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// =====================================================

let dayCount = 0;
let hotelCount = 0;
let flightCount = 0;
let addDayBtn, addHotelBtn, addFlightBtn, daysContainer, hotelsContainer, flightsContainer, previewPane, loginGate, crmWorkspace;
let tabItinerary, tabCustomers, moduleItinerary, moduleCustomers, pkgCustomerSelect, customerTableRows, addCustSubmitBtn;

const inputs = ['pkg-title', 'pkg-destination', 'pkg-date', 'pkg-pax', 'pkg-vehicle', 'pkg-price', 'pkg-airfare', 'pkg-inclusions', 'pkg-exclusions'];

document.addEventListener('DOMContentLoaded', () => {
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

    tabItinerary?.addEventListener('click', () => switchCrmModule('itinerary'));
    tabCustomers?.addEventListener('click', () => switchCrmModule('customers'));
    addCustSubmitBtn?.addEventListener('click', onboardNewCustomerRecord);

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
});

function switchCrmModule(activeModule) {
    if(activeModule === 'itinerary') {
        tabItinerary.className = "text-xs bg-white text-black font-semibold px-4 py-2 rounded-xl shadow transition";
        tabCustomers.className = "text-xs bg-white/5 text-gray-300 hover:bg-white/10 font-semibold px-4 py-2 rounded-xl transition";
        moduleItinerary.classList.remove('hidden');
        moduleCustomers.classList.add('hidden');
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
            addFlightSectorBlock(); // Auto-populate 1 Flight form container segment
            addHotelStayBlock(); 
            addItineraryDay();    
        }, 50);
    }, 500);
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

// NEW: Dynamic Flight Block Generator with optional second leg toggle
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
                    <input type="text" placeholder="Time (e.g., 23:45)" class="fl-dep-time w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none" oninput="updateLivePreview()">
                </div>
                <div class="bg-white/[0.02] p-2 rounded-lg border border-white/5 space-y-2">
                    <span class="text-[10px] font-bold text-gray-400 uppercase">Arrival</span>
                    <input type="date" class="fl-arr-date w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none" oninput="updateLivePreview()">
                    <input type="text" placeholder="Time (e.g., 04:30 +1)" class="fl-arr-time w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none" oninput="updateLivePreview()">
                </div>
            </div>

            <!-- Leg 2 Connection Interface Option Toggle -->
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
            <input type="text" placeholder="Hotel Name" class="hotel-name w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-white/30 text-white" oninput="updateLivePreview()">
            <div class="grid grid-cols-3 gap-2">
                <div>
                    <label class="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">Check-In</label>
                    <input type="date" class="hotel-in w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[11px] focus:outline-none focus:border-white/30 text-white" oninput="updateLivePreview()">
                </div>
                <div>
                    <label class="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">Check-Out</label>
                    <input type="date" class="hotel-out w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[11px] focus:outline-none focus:border-white/30 text-white" oninput="updateLivePreview()">
                </div>
                <div>
                    <label class="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">Total Nights</label>
                    <input type="number" placeholder="2" class="hotel-nights w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[11px] focus:outline-none focus:border-white/30 text-white" oninput="updateLivePreview()">
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
        <input type="text" placeholder="Day Title: e.g., Arrival & Beachside Sunset Dinner" class="day-title-input w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-white/30 text-white" oninput="updateLivePreview()">
        <textarea placeholder="Excursion or tour details below this day..." rows="3" class="day-desc-input w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-white/30 text-white resize-none" oninput="updateLivePreview()"></textarea>
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

function formatPremiumDate(dateStr) {
    if (!dateStr || dateStr === "---") return "---";
    const opts = { day: 'numeric', month: 'short', year: 'numeric' };
    return new Date(dateStr).toLocaleDateString('en-US', opts);
}

function compileItineraryHTML() {
    const title = document.getElementById('pkg-title').value || "Untitled Premium Package";
    const dest = document.getElementById('pkg-destination').value || "---";
    const date = document.getElementById('pkg-date').value || "---";
    const pax = document.getElementById('pkg-pax').value || "0";
    const vehicle = document.getElementById('pkg-vehicle').value || "---";
    const price = document.getElementById('pkg-price').value || "0";
    const airfare = document.getElementById('pkg-airfare').value || "";

    // Build Flight Blocks Layout HTML rows dynamically
    let flightsHtml = '';
    const flightBlocks = flightsContainer.children;
    Array.from(flightBlocks).forEach((block) => {
        const fNum = block.querySelector('.fl-num').value || "TBD";
        const fRoute = block.querySelector('.fl-route').value || "---";
        const fDur = block.querySelector('.fl-duration').value || "---";
        const fDepD = formatPremiumDate(block.querySelector('.fl-dep-date').value);
        const fDepT = block.querySelector('.fl-dep-time').value || "---";
        const fArrD = formatPremiumDate(block.querySelector('.fl-arr-date').value);
        const fArrT = block.querySelector('.fl-arr-time').value || "---";
        const hasLeg2 = block.querySelector('.fl-has-leg2').checked;

        flightsHtml += `
            <div style="border-left: 3px solid #06b6d4; padding-left: 12px; margin-bottom: 14px; font-size: 11.5px;">
                <div style="font-weight: 700; color: #0f172a; margin-bottom: 2px;">Sector Segment: ${fRoute} (${fNum})</div>
                <div style="color: #475569;">
                    <strong>Departure:</strong> ${fDepD} @ ${fDepT} &nbsp;|&nbsp; 
                    <strong>Arrival:</strong> ${fArrD} @ ${fArrT} &nbsp;|&nbsp; 
                    <strong>Duration:</strong> ${fDur}
                </div>
            </div>
        `;

        if (hasLeg2) {
            const fNum2 = block.querySelector('.fl-num2').value || "TBD";
            const fRoute2 = block.querySelector('.fl-route2').value || "---";
            const fDur2 = block.querySelector('.fl-duration2').value || "---";
            const fDepD2 = formatPremiumDate(block.querySelector('.fl-dep-date2').value);
            const fDepT2 = block.querySelector('.fl-dep-time2').value || "---";
            const fArrD2 = formatPremiumDate(block.querySelector('.fl-arr-date2').value);
            const fArrT2 = block.querySelector('.fl-arr-time2').value || "---";

            flightsHtml += `
                <div style="border-left: 3px dashed #a5f3fc; padding-left: 12px; margin-left: 15px; margin-bottom: 14px; font-size: 11px; background: #f8fafc; padding-top: 4px; padding-bottom: 4px;">
                    <div style="font-weight: 700; color: #0369a1; margin-bottom: 2px;">Connecting Leg 2: ${fRoute2} (${fNum2})</div>
                    <div style="color: #475569;">
                        <strong>Departure:</strong> ${fDepD2} @ ${fDepT2} &nbsp;|&nbsp; 
                        <strong>Arrival:</strong> ${fArrD2} @ ${fArrT2} &nbsp;|&nbsp; 
                        <strong>Duration:</strong> ${fDur2}
                    </div>
                </div>
            `;
        }
    });

    let hotelsHtml = '';
    const hotelBlocks = hotelsContainer.children;
    Array.from(hotelBlocks).forEach((block) => {
        const hName = block.querySelector('.hotel-name').value || "Accommodation Pending Confirmation";
        const hIn = formatPremiumDate(block.querySelector('.hotel-in').value);
        const hOut = formatPremiumDate(block.querySelector('.hotel-out').value);
        const hNights = block.querySelector('.hotel-nights').value || "0";

        hotelsHtml += `
            <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11.5px; color: #334155;">
                <td style="padding: 10px 8px; font-weight: 600; color: #0f172a;">${hName}</td>
                <td style="padding: 10px 8px; text-align: center;">${hIn}</td>
                <td style="padding: 10px 8px; text-align: center;">${hOut}</td>
                <td style="padding: 10px 8px; text-align: center; font-weight: 700; color: #4f46e5;">${hNights} N</td>
            </tr>
        `;
    });

    const inclusionsText = document.getElementById('pkg-inclusions')?.value || "";
    const exclusionsText = document.getElementById('pkg-exclusions')?.value || "";
    const inclusionsArray = inclusionsText.split('\n').filter(item => item.trim() !== "");
    const exclusionsArray = exclusionsText.split('\n').filter(item => item.trim() !== "");

    let incHtml = inclusionsArray.map(item => `<li style="margin-bottom:4px;">${item}</li>`).join('');
    let excHtml = exclusionsArray.map(item => `<li style="margin-bottom:4px;">${item}</li>`).join('');

    let daysHtml = '';
    const dayBlocks = daysContainer.children;
    Array.from(dayBlocks).forEach((block, index) => {
        const dTitle = block.querySelector('.day-title-input').value || `Day ${index + 1} Activity`;
        const dDesc = block.querySelector('.day-desc-input').value || 'Excursion details to follow.';
        daysHtml += `
            <div style="margin-bottom: 20px; page-break-inside: avoid;">
                <h4 style="font-size: 13.5px; font-weight: 700; color: #1e1b4b; margin: 0 0 6px 0;">Day ${index + 1}: ${dTitle}</h4>
                <p style="font-size: 11.5px; color: #475569; margin: 0; line-height: 1.6; text-align: justify;">${dDesc}</p>
            </div>
        `;
    });

    // Build Airfare Quote Display Section block conditionally
    let airfareBlockHtml = '';
    if (airfare && Number(airfare) > 0) {
        airfareBlockHtml = `
            <div style="background: #f0fdfa; border: 1px solid #ccfbf1; border-radius: 12px; padding: 14px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center; page-break-inside: avoid;">
                <div>
                    <span style="font-size: 10px; text-transform: uppercase; tracking: 0.5px; color: #0f766e; font-weight:700; display:block;">Estimated Flight Fare Pricing</span>
                    <span style="font-size: 11px; color: #115e59;">Subject to direct live airline availability indices upon booking</span>
                </div>
                <div style="font-size: 16px; font-weight: 700; color: #0d9488;">
                    ₹${Number(airfare).toLocaleString('en-IN')}/-
                </div>
            </div>
        `;
    }

    return `
        <div style="padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; background: #ffffff;">
            <!-- Branding Header -->
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 25px;">
                <div>
                    <h2 style="font-size: 24px; font-weight: 800; tracking: -0.5px; color: #0f172a; margin: 0;">TRAVEL WORLD WIDE</h2>
                    <p style="font-size: 11px; color: #64748b; margin: 2px 0 0 0; text-transform: uppercase; tracking: 1px;">Boutique Curated Quotation</p>
                </div>
                <div style="text-align: right; font-size: 11px; color: #64748b; line-height: 1.4;">
                    <p style="margin:0; font-weight: 600; color: #334155;">salestravelworldwide@gmail.com</p>
                    <p style="margin:0;">+91 88926 89595</p>
                </div>
            </div>

            <!-- Profile Summary Overview -->
            <div style="background: #f8fafc; border-radius: 12px; padding: 16px; margin-bottom: 25px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; font-size: 12px; border: 1px solid #e2e8f0;">
                <div><strong style="color: #475569;">Package Title:</strong> <span style="color: #0f172a; font-weight: 500;">${title}</span></div>
                <div><strong style="color: #475569;">Destination:</strong> <span style="color: #0f172a; font-weight: 500;">${dest}</span></div>
                <div><strong style="color: #475569;">Departure Date:</strong> <span style="color: #0f172a; font-weight: 500;">${formatPremiumDate(date)}</span></div>
                <div><strong style="color: #475569;">Total Travelers:</strong> <span style="color: #0f172a; font-weight: 500;">${pax} Adults</span></div>
                <div style="grid-column: span 2;"><strong style="color: #475569;">Private Ground Transport:</strong> <span style="color: #0f172a; font-weight: 500;">${vehicle}</span></div>
            </div>

            <!-- Dynamic Flight Sectors Section -->
            ${flightBlocks.length > 0 ? `
            <div style="margin-bottom: 25px; page-break-inside: avoid;">
                <h3 style="font-size: 12px; font-weight: 800; color: #0891b2; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 14px;">Flight Routing & Logistics</h3>
                ${flightsHtml}
            </div>
            ` : ''}

            <!-- Separate Airfare Visual Frame Segment -->
            ${airfareBlockHtml}

            <!-- Stays Breakdown Table -->
            <div style="margin-bottom: 25px; page-break-inside: avoid;">
                <h3 style="font-size: 12px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 12px;">Premium Stays & Accommodations</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                    <thead>
                        <tr style="background: #f8fafc; text-align: left; color: #475569; font-weight: 700; border-bottom: 1px solid #e2e8f0;">
                            <th style="padding: 8px;">Hotel Property Name</th>
                            <th style="padding: 8px; text-align: center;">Check-In</th>
                            <th style="padding: 8px; text-align: center;">Check-Out</th>
                            <th style="padding: 8px; text-align: center;">Duration</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${hotelsHtml || '<tr><td colspan="4" style="color:#94a3b8; font-style:italic; padding:10px; font-size:11px;">No properties selected.</td></tr>'}
                    </tbody>
                </table>
            </div>

            <!-- Day Wise Details -->
            <div style="margin-bottom: 25px;">
                <h3 style="font-size: 12px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 14px;">Day-Wise Details</h3>
                ${daysHtml || '<p style="color:#94a3b8; font-style:italic; font-size:11px;">No itinerary days added yet.</p>'}
            </div>

            <!-- Inclusions / Exclusions Tracker Block -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; border-top: 1px solid #e2e8f0; padding-top: 20px; margin-bottom: 30px; page-break-inside: avoid;">
                <div>
                    <h4 style="font-size: 11px; font-weight: 800; color: #16a34a; text-transform: uppercase; margin: 0 0 8px 0;">✓ Custom Inclusions</h4>
                    <ul style="font-size: 11px; color: #475569; margin: 0; padding-left: 14px; line-height: 1.6;">
                        ${incHtml || '<li>Standard inclusions applied</li>'}
                    </ul>
                </div>
                <div>
                    <h4 style="font-size: 11px; font-weight: 800; color: #dc2626; text-transform: uppercase; margin: 0 0 8px 0;">✕ Exclusions</h4>
                    <ul style="font-size: 11px; color: #475569; margin: 0; padding-left: 14px; line-height: 1.6;">
                        ${excHtml || '<li>Standard exclusions applied</li>'}
                    </ul>
                </div>
            </div>

            <!-- Main Land Package Price Block -->
            <div style="background: #0f172a; color: white; border-radius: 12px; padding: 16px; display: flex; justify-content: space-between; align-items: center; page-break-inside: avoid;">
                <div>
                    <span style="font-size: 10px; text-transform: uppercase; tracking: 0.5px; color: #94a3b8; display:block;">Main Land Package Investment</span>
                    <span style="font-size: 11px; color: #cbd5e1;">All inclusive of boutique coordination levies</span>
                </div>
                <div style="font-size: 20px; font-weight: 700; color: #34d399;">
                    ₹${Number(price).toLocaleString('en-IN')}/-
                </div>
            </div>
        </div>
    `;
}

function updateLivePreview() {
    if(previewPane) {
        previewPane.innerHTML = compileItineraryHTML();
    }
}

function generateProfessionalPDF() {
    const title = document.getElementById('pkg-title').value || "Quotation";
    const htmlContent = compileItineraryHTML();
    const printWindow = window.open('', '_blank', 'width=900,height=800');
    
    printWindow.document.write(`
        <html>
        <head>
            <title>${title.replace(/\s+/g, '_')}_Proposal</title>
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

    const inclusionsText = document.getElementById('pkg-inclusions')?.value || "";
    const exclusionsText = document.getElementById('pkg-exclusions')?.value || "";
    const inclusions = inclusionsText.split('\n').filter(item => item.trim() !== "");
    const exclusions = exclusionsText.split('\n').filter(item => item.trim() !== "");

    const hotelBlocks = hotelsContainer.children;
    const hotelsPayload = Array.from(hotelBlocks).map(block => {
        return {
            hotel_name: block.querySelector('.hotel-name').value || "TBD",
            check_in: block.querySelector('.hotel-in').value || null,
            check_out: block.querySelector('.hotel-out').value || null,
            nights: parseInt(block.querySelector('.hotel-nights').value) || 0
        };
    });

    // Extract dynamic flights information map array
    const flightBlocks = flightsContainer.children;
    const flightsPayload = Array.from(flightBlocks).map(block => {
        return {
            flight_number: block.querySelector('.fl-num').value || "TBD",
            route: block.querySelector('.fl-route').value || "---",
            duration: block.querySelector('.fl-duration').value || "---",
            dep_date: block.querySelector('.fl-dep-date').value || null,
            dep_time: block.querySelector('.fl-dep-time').value || "---",
            arr_date: block.querySelector('.fl-arr-date').value || null,
            arr_time: block.querySelector('.fl-arr-time').value || "---",
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

    try {
        const { data: itineraryData, error: itinError } = await supabaseClient
            .from('itineraries')
            .insert([{
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
                flight_details: flightsPayload, // Saved dynamically to your JSON matrix mapping row column
                airfare_price: airfarePrice
            }]);

        if (itinError) throw itinError;

        saveBtn.innerText = "✓ Saved Successfully";
        saveBtn.style.backgroundColor = "#059669"; 
        setTimeout(() => {
            saveBtn.innerText = originalText;
            saveBtn.style.backgroundColor = ""; 
            saveBtn.style.opacity = "1";
        }, 2500);

    } catch (err) {
        console.error("Database operation failed:", err);
        alert(`Could not sync to cloud: ${err.message}`);
        saveBtn.innerText = originalText;
        saveBtn.style.opacity = "1";
    }
}
