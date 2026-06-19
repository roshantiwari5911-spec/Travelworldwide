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

const coreInputIds = [
    'pkg-title', 'pkg-destination', 'pkg-date', 'pkg-pax', 'pkg-vehicle', 
    'pkg-inclusions', 'pkg-exclusions', 'dmc-net-cost', 'dmc-markup-pct', 
    'pkg-price', 'pkg-airfare'
];

// Helper Function: Date Formatter defined at the top scale to avoid referencing faults
function formatPremiumDate(dateStr) {
    if (!dateStr || dateStr === "---") return "---";
    const opts = { day: 'numeric', month: 'short', year: 'numeric' };
    return new Date(dateStr).toLocaleDateString('en-US', opts);
}

// Master Margin Analytics Engine
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

    const netLabel = document.getElementById('meta-net-cost');
    const profitLabel = document.getElementById('meta-profit-cost');
    const grossLabel = document.getElementById('meta-gross-cost');

    if (netLabel) netLabel.innerText = `₹${Math.round(totalAgencyNetCost).toLocaleString('en-IN')}`;
    if (profitLabel) profitLabel.innerText = `₹${Math.round(netAgencyProfitTake).toLocaleString('en-IN')}`;
    if (grossLabel) grossLabel.innerText = `₹${Math.round(combinedClientGrossQuote).toLocaleString('en-IN')}`;
}

// agoda/Headout Aesthetic Preview Document Builder
function compileItineraryHTML() {
    const title = document.getElementById('pkg-title')?.value || "Boutique Experience Proposal";
    const dest = document.getElementById('pkg-destination')?.value || "---";
    const date = document.getElementById('pkg-date')?.value || "---";
    const pax = document.getElementById('pkg-pax')?.value || "0";
    const vehicle = document.getElementById('pkg-vehicle')?.value || "---";
    const price = document.getElementById('pkg-price')?.value || "0";
    const airfare = document.getElementById('pkg-airfare')?.value || "0";

    let flightsHtml = '';
    const flightBlocks = flightsContainer ? flightsContainer.children : [];
    Array.from(flightBlocks).forEach((block) => {
        const fNum = block.querySelector('.fl-num')?.value || "TBD";
        const fRoute = block.querySelector('.fl-route')?.value || "---";
        const fDur = block.querySelector('.fl-duration')?.value || "---";
        const fDepD = formatPremiumDate(block.querySelector('.fl-dep-date')?.value);
        const fDepT = block.querySelector('.fl-dep-time')?.value || "---";
        const fArrD = formatPremiumDate(block.querySelector('.fl-arr-date')?.value);
        const fArrT = block.querySelector('.fl-arr-time')?.value || "---";
        const hasLeg2 = block.querySelector('.fl-has-leg2')?.checked;

        flightsHtml += `
            <div style="border-left: 2.5px solid #000000; padding-left: 14px; margin-bottom: 16px; font-size: 11.5px;">
                <div style="font-weight: 700; color: #111827; font-size: 12.5px; margin-bottom: 3px;">✈ Flight Transit Segment: ${fRoute} (${fNum})</div>
                <div style="color: #4b5563; line-height: 1.5;">
                    <strong>Departs:</strong> ${fDepD} @ ${fDepT} &nbsp;&bull;&nbsp; 
                    <strong>Arrives:</strong> ${fArrD} @ ${fArrT} &nbsp;&bull;&nbsp; 
                    <strong>Duration:</strong> <span style="background:#f3f4f6; padding:1px 5px; border-radius:4px; font-weight:600;">${fDur}</span>
                </div>
            </div>
        `;

        if (hasLeg2) {
            const fNum2 = block.querySelector('.fl-num2')?.value || "TBD";
            const fRoute2 = block.querySelector('.fl-route2')?.value || "---";
            const fDur2 = block.querySelector('.fl-duration2')?.value || "---";
            const fDepD2 = formatPremiumDate(block.querySelector('.fl-dep-date2')?.value);
            const fDepT2 = block.querySelector('.fl-dep-time2')?.value || "---";
            const fArrD2 = formatPremiumDate(block.querySelector('.fl-arr-date2')?.value);
            const fArrT2 = block.querySelector('.fl-arr-time2')?.value || "---";

            flightsHtml += `
                <div style="border-left: 2.5px dashed #9ca3af; padding-left: 14px; margin-left: 15px; margin-bottom: 16px; font-size: 11px; background: #fafafa; padding-top: 6px; padding-bottom: 6px; border-radius:6px;">
                    <div style="font-weight: 700; color: #4b5563; margin-bottom: 3px;">↳ Connecting Transit Leg 2: ${fRoute2} (${fNum2})</div>
                    <div style="color: #6b7280;">
                        <strong>Departs:</strong> ${fDepD2} @ ${fDepT2} &nbsp;&bull;&nbsp; 
                        <strong>Arrives:</strong> ${fArrD2} @ ${fArrT2} &nbsp;&bull;&nbsp; 
                        <strong>Duration:</strong> ${fDur2}
                    </div>
                </div>
            `;
        }
    });

    let hotelsHtml = '';
    const hotelBlocks = hotelsContainer ? hotelsContainer.children : [];
    Array.from(hotelBlocks).forEach((block) => {
        const hName = block.querySelector('.hotel-name')?.value || "Accommodation Properties Pending";
        const hIn = formatPremiumDate(block.querySelector('.hotel-in')?.value);
        const hOut = formatPremiumDate(block.querySelector('.hotel-out')?.value);
        const hNights = block.querySelector('.hotel-nights')?.value || "0";

        hotelsHtml += `
            <tr style="border-bottom: 1px solid #e5e7eb; font-size: 11.5px; color: #374151;">
                <td style="padding: 12px 10px; font-weight: 600; color: #111827;">🏢 ${hName}</td>
                <td style="padding: 12px 10px; text-align: center;">${hIn}</td>
                <td style="padding: 12px 10px; text-align: center;">${hOut}</td>
                <td style="padding: 12px 10px; text-align: center; font-weight: 700; color: #4f46e5;"><span style="background:#e0e7ff; padding:3px 8px; border-radius:6px;">${hNights} N</span></td>
            </tr>
        `;
    });

    const inclusionsText = document.getElementById('pkg-inclusions')?.value || "";
    const exclusionsText = document.getElementById('pkg-exclusions')?.value || "";
    const inclusionsArray = inclusionsText.split('\n').filter(item => item.trim() !== "");
    const exclusionsArray = exclusionsText.split('\n').filter(item => item.trim() !== "");

    let incHtml = inclusionsArray.map(item => `<li style="margin-bottom:5px; list-style-type:none; padding-left:14px; position:relative;"><span style="position:absolute; left:0; color:#10b981;">✔</span>${item}</li>`).join('');
    let excHtml = exclusionsArray.map(item => `<li style="margin-bottom:5px; list-style-type:none; padding-left:14px; position:relative;"><span style="position:absolute; left:0; color:#ef4444;">&times;</span>${item}</li>`).join('');

    let daysHtml = '';
    const dayBlocks = daysContainer ? daysContainer.children : [];
    Array.from(dayBlocks).forEach((block, index) => {
        const dTitle = block.querySelector('.day-title-input')?.value || `Day ${index + 1} Itinerary Loop`;
        const dDesc = block.querySelector('.day-desc-input')?.value || 'Logistics details to follow.';
        daysHtml += `
            <div style="margin-bottom: 22px; page-break-inside: avoid; background:#fefefe; padding:16px; border-radius:12px; border:1px solid #f3f4f6;">
                <h4 style="font-size: 13px; font-weight: 800; color: #111827; margin: 0 0 6px 0; text-transform:uppercase;">DAY 0${index + 1} &bull; ${dTitle}</h4>
                <p style="font-size: 11.5px; color: #4b5563; margin: 0; line-height: 1.65;">${dDesc}</p>
            </div>
        `;
    });

    let financialsBlockHtml = '';
    if (Number(price) > 0 || Number(airfare) > 0) {
        financialsBlockHtml = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 25px; page-break-inside: avoid;">
                <div style="background: #fafafa; border: 1px solid #e5e7eb; border-radius: 14px; padding: 16px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <span style="font-size: 9px; text-transform: uppercase; tracking: 0.5px; color: #4b5563; font-weight:700; display:block;">Land Operations Package</span>
                    </div>
                    <div style="font-size: 14px; font-weight: 700; color: #111827; font-family:monospace;">₹${Number(price).toLocaleString('en-IN')}</div>
                </div>
                <div style="background: #fafafa; border: 1px solid #e5e7eb; border-radius: 14px; padding: 16px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <span style="font-size: 9px; text-transform: uppercase; tracking: 0.5px; color: #4b5563; font-weight:700; display:block;">Airfare Quote Component</span>
                    </div>
                    <div style="font-size: 14px; font-weight: 700; color: #111827; font-family:monospace;">₹${Number(airfare).toLocaleString('en-IN')}</div>
                </div>
            </div>
            <div style="background: #0f172a; color: white; border-radius: 14px; padding: 20px; margin-top: 14px; display: flex; justify-content: space-between; align-items: center; page-break-inside: avoid;">
                <div>
                    <span style="font-size: 10px; text-transform: uppercase; tracking: 1px; color: #94a3b8; font-weight:700; display:block;">TOTAL CONSOLIDATED EXPEDITION INVESTMENT</span>
                </div>
                <div style="font-size: 20px; font-weight: 800; color: #10b981; font-family:monospace;">
                    ₹${(Number(price) + Number(airfare)).toLocaleString('en-IN')}/-
                </div>
            </div>
        `;
    }

    return `
        <div style="padding: 24px; font-family: -apple-system, BlinkMacSystemFont, sans-serif; color: #1f2937; background: #ffffff;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #111827; padding-bottom: 18px; margin-bottom: 25px;">
                <div>
                    <h2 style="font-size: 23px; font-weight: 900; tracking: -0.5px; color: #111827; margin: 0;">TRAVEL WORLD WIDE</h2>
                    <p style="font-size: 10px; color: #4b5563; margin: 3px 0 0 0; text-transform: uppercase; tracking: 1.5px; font-weight: 700;">Curated Experience Portfolio</p>
                </div>
                <div style="text-align: right; font-size: 11px; color: #4b5563; line-height: 1.4;">
                    <p style="margin:0; font-weight: 700; color: #111827;">salestravelworldwide@gmail.com</p>
                    <p style="margin:0;">+91 88926 89595</p>
                </div>
            </div>

            <div style="background: #f9fafb; border-radius: 14px; padding: 18px; margin-bottom: 25px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; font-size: 12px; border: 1px solid #e5e7eb;">
                <div><strong style="color: #4b5563; text-transform:uppercase; font-size:9.5px; display:block; margin-bottom:2px;">Experience Package</strong> <span style="color: #111827; font-weight: 700; font-size:12.5px;">${title}</span></div>
                <div><strong style="color: #4b5563; text-transform:uppercase; font-size:9.5px; display:block; margin-bottom:2px;">Target Destination</strong> <span style="color: #111827; font-weight: 700; font-size:12.5px;">📍 ${dest}</span></div>
                <div><strong style="color: #4b5563; text-transform:uppercase; font-size:9.5px; display:block; margin-bottom:2px;">Departure Date</strong> <span style="color: #111827; font-weight: 600;">${formatPremiumDate(date)}</span></div>
                <div><strong style="color: #4b5563; text-transform:uppercase; font-size:9.5px; display:block; margin-bottom:2px;">Accompanying Roster</strong> <span style="color: #111827; font-weight: 600;">👥 ${pax} Guests Allotted</span></div>
                <div style="grid-column: span 2; border-top:1px dashed #e5e7eb; padding-top:10px; margin-top:4px;"><strong style="color: #4b5563; text-transform:uppercase; font-size:9.5px; display:block; margin-bottom:2px;">Ground Logistics Fleet</strong> <span style="color: #111827; font-weight: 600;">🚘 ${vehicle}</span></div>
            </div>

            ${flightBlocks.length > 0 ? `
            <div style="margin-bottom: 25px; page-break-inside: avoid;">
                <h3 style="font-size: 11px; font-weight: 800; color: #111827; text-transform: uppercase; letter-spacing: 0.8px; border-bottom: 1.5px solid #111827; padding-bottom: 5px; margin-bottom: 14px;">I. Flight Routing & Aviation Matrices</h3>
                ${flightsHtml}
            </div>
            ` : ''}

            <div style="margin-bottom: 25px; page-break-inside: avoid;">
                <h3 style="font-size: 11px; font-weight: 800; color: #111827; text-transform: uppercase; letter-spacing: 0.8px; border-bottom: 1.5px solid #111827; padding-bottom: 5px; margin-bottom: 14px;">II. Premium Resort Stays & Living Breakdowns</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 11.5px; text-align: left;">
                    <thead>
                        <tr style="background: #f3f4f6; color: #4b5563; font-weight: 700; border-bottom: 1px solid #e5e7eb;">
                            <th style="padding: 10px;">Resort Property Specification</th>
                            <th style="padding: 10px; text-align: center;">Check-In</th>
                            <th style="padding: 10px; text-align: center;">Check-Out</th>
                            <th style="padding: 10px; text-align: center;">Stay Duration</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${hotelsHtml || '<tr><td colspan="4" style="color:#9ca3af; font-style:italic; padding:14px; text-align:center;">No accommodations indexed in current routing.</td></tr>'}
                    </tbody>
                </table>
            </div>

            <div style="margin-bottom: 25px;">
                <h3 style="font-size: 11px; font-weight: 800; color: #111827; text-transform: uppercase; letter-spacing: 0.8px; border-bottom: 1.5px solid #111827; padding-bottom: 5px; margin-bottom: 14px;">III. Curated Experience Day-Wise Timeline Loops</h3>
                ${daysHtml || '<p style="color:#9ca3af; font-style:italic; font-size:11px; text-align:center;">No timeline slots mapped yet.</p>'}
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; border-top: 1px solid #e5e7eb; padding-top: 18px; margin-bottom: 10px; page-break-inside: avoid;">
                <div>
                    <h4 style="font-size: 11px; font-weight: 800; color: #10b981; text-transform: uppercase; tracking:0.5px; margin: 0 0 10px 0;">✓ Verified Package Inclusions</h4>
                    <ul style="font-size: 11px; color: #4b5563; margin: 0; padding-left: 0; line-height: 1.65;">
                        ${incHtml || '<li>Baseline operational inclusions map valid.</li>'}
                    </ul>
                </div>
                <div>
                    <h4 style="font-size: 11px; font-weight: 800; color: #ef4444; text-transform: uppercase; tracking:0.5px; margin: 0 0 10px 0;">✕ Disclaimed Exclusions</h4>
                    <ul style="font-size: 11px; color: #4b5563; margin: 0; padding-left: 0; line-height: 1.65;">
                        ${excHtml || '<li>Standard logistical exclusions apply.</li>'}
                    </ul>
                </div>
            </div>

            ${financialsBlockHtml}
        </div>
    `;
}

function updateLivePreview() {
    calculateMarginMetrics(); 
    if(previewPane) {
        previewPane.innerHTML = compileItineraryHTML();
    }
}

// ====== SUPABASE BACKEND SYNCHRONIZATION PIPELINES ======
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
        dmc_net_cost: dmcNetCost,
        dmc_markup_pct: dmcMarkupPct
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

function generateProfessionalPDF() {
    const title = document.getElementById('pkg-title')?.value || "Travel_WW_Quotation";
    const element = previewPane;
    const opt = {
        margin: [10, 10, 14, 10],
        filename: `${title.replace(/\s+/g, '_')}_Proposal.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };
    html2pdf().set(opt).from(element).save();
}

// ====== STANDALONE HOTEL VOUCHER HANDLERS ======
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
                <input type="text" placeholder="e.g., Centara Grand Mirage Beach Resort" class="sh-name w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none" oninput="updateHotelVoucherLivePreview()">
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
                    <label class="block text-[10px] text-gray-400 uppercase tracking-wider mb-1 pl-0.5">Duration</label>
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
        const daysDiff = Math.ceil((date2.getTime() - date1.getTime()) / (1000 * 3600 * 24));
        nightsInput.value = daysDiff > 0 ? `${daysDiff} Night${daysDiff > 1 ? 's' : ''}` : `0 Nights`;
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
            portalAmenitiesHtml = rawAmenities.split('\n').filter(line => line.trim() !== "").map(line => `
                <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px; font-size: 11px; color: #334155;">
                    <span style="color: #10b981; font-weight: bold;">✔</span> ${line.trim()}
                </div>
            `).join('');
        } else {
            portalAmenitiesHtml = `<div style="color: #94a3b8; font-style: italic; font-size: 11px;">No custom portal specifications input listed.</div>`;
        }

        vouchersContentHtml += `
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; margin-bottom: 24px; position: relative; box-shadow: 0 4px 20px rgba(0,0,0,0.02); page-break-inside: avoid;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px dashed #cbd5e1; padding-bottom: 16px; margin-bottom: 18px;">
                    <div>
                        <span style="font-size: 10px; font-weight: 700; color: #10b981; background: #ecfdf5; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase;">Voucher Segment 0${index + 1}</span>
                        <h3 style="font-size: 16px; font-weight: 800; color: #0f172a; margin: 0; line-height: 1.3;">${hName}</h3>
                        <p style="font-size: 11px; color: #64748b; margin: 4px 0 0 0;">Classification: <span style="color: #4f46e5; font-weight: 700;">${hCategory}</span></p>
                    </div>
                    <div style="text-align: right;"><span style="font-size: 11px; font-weight: 700; color: #ffffff; background: #0f172a; padding: 6px 12px; border-radius: 8px; display: inline-block;">CONFIRMED</span></div>
                </div>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; background: #f8fafc; padding: 14px; border-radius: 12px; margin-bottom: 18px; border: 1px solid #f1f5f9;">
                    <div><span style="font-size: 9px; font-weight: 700; color: #64748b; display: block; margin-bottom: 2px;">CHECK-IN</span><strong style="font-size: 12.5px; color: #0f172a; display: block;">${hIn}</strong></div>
                    <div style="border-left: 1px solid #e2e8f0; padding-left: 14px;"><span style="font-size: 9px; font-weight: 700; color: #64748b; display: block; margin-bottom: 2px;">CHECK-OUT</span><strong style="font-size: 12.5px; color: #0f172a; display: block;">${hOut}</strong></div>
                    <div style="border-left: 1px solid #e2e8f0; padding-left: 14px;"><span style="font-size: 9px; font-weight: 700; color: #64748b; display: block; margin-bottom: 2px;">STAY LENGTH</span><strong style="font-size: 13.5px; color: #4f46e5; font-weight: 800;">${hNights}</strong></div>
                </div>
                <div style="display: flex; gap: 20px; align-items: center; background: #eef2ff; padding: 10px 14px; border-radius: 10px; margin-bottom: 18px; font-size: 12px; color: #3730a3; font-weight: 600; border: 1px solid #e0e7ff;">
                    <div>👥 <strong>Occupancy Allotted:</strong></div>
                    <div>👤 ${hAdults} Adult${hAdults > 1 ? 's' : ''}</div>
                    ${hKids > 0 ? `<div style="border-left: 1px solid #c7d2fe; padding-left: 16px;">👶 ${hKids} Child${hKids > 1 ? 'ren' : ''}</div>` : ''}
                </div>
                <div style="background: #fafafa; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px;">
                    <div style="font-size: 10.5px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-bottom: 10px;">Property Amenities & Room Specifications</div>
                    <div style="display: grid; grid-template-columns: 1fr sm:grid-template-columns: 1fr 1fr; gap: 4px 16px;">${portalAmenitiesHtml}</div>
                </div>
                <div style="margin-top: 16px; text-align: right; font-size: 12px; color: #475569;">Room Segment Value: <strong style="color: #10b981; font-size: 14.5px; font-family: monospace;">₹${Math.round(hPrice).toLocaleString('en-IN')}/-</strong></div>
            </div>
        `;
    });

    return `
        <div style="padding: 30px; font-family: -apple-system, BlinkMacSystemFont, sans-serif; color: #1e293b; background: #ffffff;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 25px;">
                <div>
                    <h2 style="font-size: 22px; font-weight: 900; color: #0f172a; margin: 0;">TRAVEL WORLD WIDE</h2>
                    <p style="font-size: 10px; color: #64748b; margin: 2px 0 0 0; text-transform: uppercase; tracking: 1.5px; font-weight: 600;">Luxury Hotel Confirmation Voucher</p>
                </div>
                <div style="text-align: right; font-size: 11px; color: #64748b; line-height: 1.4;">
                    <p style="margin:0; font-weight: 700; color: #0f172a;">salestravelworldwide@gmail.com</p>
                    <p style="margin:0;">Desk Line: +91 88926 89595</p>
                </div>
            </div>
            ${vouchersContentHtml || '<p style="color:#94a3b8; font-style:italic; font-size:12px; text-align:center; padding:40px 0;">No active properties allocated inside the voucher workspace desk ledger yet.</p>'}
            ${blocks.length > 0 ? `
            <div style="margin-top: 30px; background: #0f172a; color: #ffffff; border-radius: 14px; padding: 20px; display: flex; justify-content: space-between; align-items: center;">
                <div><span style="font-size: 10px; text-transform: uppercase; color: #94a3b8; font-weight: 700; display: block; margin-bottom: 2px;">TOTAL CONSOLIDATED ACCOMMODATION INVESTMENT</span></div>
                <div style="font-size: 22px; font-weight: 800; color: #10b981; font-family: monospace;">₹${Math.round(totalGrossQuotationAggregate).toLocaleString('en-IN')}/-</div>
            </div>
            ` : ''}
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
    printWindow.document.write(`<html><head><title>${title}_Proposal</title></head><body style="margin:0;">${htmlContent}<script>window.onload=function(){window.print();};</script></body></html>`);
    printWindow.document.close();
}

async function saveStandaloneHotelsToSupabase() {
    const blocks = standaloneHotelsList ? standaloneHotelsList.children : [];
    if (blocks.length === 0) return;
    standaloneHotelSaveBtn.innerText = "Syncing Cloud...";
    standaloneHotelSaveBtn.disabled = true;

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

    try {
        const dbResult = await supabaseClient.from('itineraries').insert([{
            title: "[HOTEL VOUCHER] " + (blocks[0].querySelector('.sh-name').value || "Hotel Request"),
            destination: "Standalone Hotel Request",
            total_price: totalAggregateValue,
            hotel_details: payloadHotels
        }]);
        if (dbResult.error) throw dbResult.error;
        standaloneHotelSaveBtn.innerText = "✓ Voucher Synced";
        standaloneHotelSaveBtn.style.backgroundColor = "#059669";
        setTimeout(() => {
            standaloneHotelSaveBtn.innerText = "Sync Vouchers";
            standaloneHotelSaveBtn.style.backgroundColor = "";
            standaloneHotelSaveBtn.disabled = false;
        }, 2500);
    } catch (err) {
        alert(`Cloud sync fault: ${err.message}`);
        standaloneHotelSaveBtn.innerText = "Sync Vouchers";
        standaloneHotelSaveBtn.disabled = false;
    }
}

// ====== BUSINESS CORE CRM METHODS ======
async function handleWorkspaceLogin(e) {
    if (e) e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const submitBtn = document.getElementById('login-submit-btn');

    if (!email || !password) return;
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
        const { data: customerData, error } = await supabaseClient.from('customers').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        if(pkgCustomerSelect) {
            pkgCustomerSelect.innerHTML = '<option value="">-- Link Client Profile --</option>';
            customerData.forEach(cust => { pkgCustomerSelect.innerHTML += `<option value="${cust.id}">${cust.full_name}</option>`; });
        }
        if(customerTableRows) {
            customerTableRows.innerHTML = '';
            customerData.forEach(cust => {
                customerTableRows.innerHTML += `<tr class="hover:bg-white/[0.02] transition"><td class="py-3 font-medium text-white">${cust.full_name}</td><td class="py-3 text-gray-400">${cust.email || '---'}</td><td class="py-3 text-indigo-300 font-mono">${cust.phone || '---'}</td><td class="py-3 text-right text-gray-500 font-mono">${new Date(cust.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td></tr>`;
            });
        }
    } catch(err) { console.error(err); }
}

async function onboardNewCustomerRecord() {
    const fullName = document.getElementById('cust-name').value;
    const email = document.getElementById('cust-email').value;
    const mobile = document.getElementById('cust-mobile').value;
    if(!fullName) return;
    addCustSubmitBtn.innerText = "Syncing Profile...";
    addCustSubmitBtn.disabled = true;
    try {
        const { error } = await supabaseClient.from('customers').insert([{ full_name: fullName, email: email, phone: mobile }]);
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
    } catch(err) { alert(err.message); addCustSubmitBtn.innerText = "Commit Profile to Database"; addCustSubmitBtn.disabled = false; }
}

function addFlightSectorBlock() {
    flightCount++;
    const flightBlock = document.createElement('div');
    flightBlock.className = 'bg-white/5 border border-white/5 p-3 sm:p-4 rounded-xl space-y-3 relative transition-all duration-300';
    flightBlock.id = `flight-block-${flightCount}`;
    
    flightBlock.innerHTML = `
        <div class="flex justify-between items-center"><span class="text-xs font-bold text-cyan-400 uppercase tracking-wider">Flight Sector Route ${flightCount}</span><button type="button" onclick="removeFlightSectorBlock(${flightCount})" class="text-xs text-red-400 hover:text-red-300 opacity-60 transition">Remove</button></div>
        <div class="grid grid-cols-2 gap-2 bg-cyan-950/20 p-2 rounded-lg border border-cyan-500/10">
            <div><label class="block text-[9px] text-cyan-400 uppercase tracking-wider mb-1">Net Airfare Buying Cost (INR)</label><input type="number" placeholder="e.g., 12000" class="fl-net w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none" oninput="updateLivePreview()"></div>
            <div><label class="block text-[9px] text-cyan-400 uppercase tracking-wider mb-1">Airfare Markup (%)</label><input type="number" value="0" class="fl-margin w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none" oninput="updateLivePreview()"></div>
        </div>
        <div class="space-y-3 text-xs">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div><label class="block text-[10px] text-gray-400 uppercase mb-1">Flight Number</label><input type="text" placeholder="e.g., TG-318" class="fl-num w-full bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-white focus:outline-none" oninput="updateLivePreview()"></div>
                <div><label class="block text-[10px] text-gray-400 uppercase mb-1">Route String</label><input type="text" placeholder="e.g., MAA - BKK" class="fl-route w-full bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-white focus:outline-none" oninput="updateLivePreview()"></div>
                <div><label class="block text-[10px] text-gray-400 uppercase mb-1">Duration</label><input type="text" placeholder="e.g., 3h 45m" class="fl-duration w-full bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-white focus:outline-none" oninput="updateLivePreview()"></div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div class="bg-white/[0.02] p-2 rounded-lg border border-white/5 space-y-2"><span class="text-[10px] font-bold text-gray-400 uppercase">Departure</span><input type="date" class="fl-dep-date w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white focus:outline-none" oninput="updateLivePreview()"><input type="text" placeholder="Time" class="fl-dep-time w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white focus:outline-none" oninput="updateLivePreview()"></div>
                <div class="bg-white/[0.02] p-2 rounded-lg border border-white/5 space-y-2"><span class="text-[10px] font-bold text-gray-400 uppercase">Arrival</span><input type="date" class="fl-arr-date w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white focus:outline-none" oninput="updateLivePreview()"><input type="text" placeholder="Time" class="fl-arr-time w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white focus:outline-none" oninput="updateLivePreview()"></div>
            </div>
            <div class="pt-2 border-t border-white/5"><label class="inline-flex items-center text-[11px] text-cyan-300 cursor-pointer"><input type="checkbox" class="fl-has-leg2 mr-2 accent-cyan-600" onchange="toggleFlightLeg2(${flightCount})">Include Connection / 2nd Leg</label></div>
            <div id="flight-leg2-container-${flightCount}" class="hidden pt-3 border-t border-white/10 space-y-3 bg-cyan-950/10 p-3 rounded-xl border border-cyan-500/10">
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div><label class="block text-[9px] text-gray-400 mb-1">Flight Number (Leg 2)</label><input type="text" placeholder="e.g., TG-123" class="fl-num2 w-full bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-white focus:outline-none" oninput="updateLivePreview()"></div>
                    <div><label class="block text-[9px] text-gray-400 mb-1">Route (Leg 2)</label><input type="text" placeholder="e.g., BKK - HKT" class="fl-route2 w-full bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-white focus:outline-none" oninput="updateLivePreview()"></div>
                    <div><label class="block text-[9px] text-gray-400 mb-1">Duration (Leg 2)</label><input type="text" placeholder="e.g., 1h 20m" class="fl-duration2 w-full bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-white focus:outline-none" oninput="updateLivePreview()"></div>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div class="space-y-1"><input type="date" class="fl-dep-date2 w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white focus:outline-none" oninput="updateLivePreview()"><input type="text" placeholder="Time" class="fl-dep-time2 w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white focus:outline-none" oninput="updateLivePreview()"></div>
                    <div class="space-y-1"><input type="date" class="fl-arr-date2 w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white focus:outline-none" oninput="updateLivePreview()"><input type="text" placeholder="Time" class="fl-arr-time2 w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white focus:outline-none" oninput="updateLivePreview()"></div>
                </div>
            </div>
        </div>
    `;
    if(flightsContainer) flightsContainer.appendChild(flightBlock);
    flightBlock.querySelectorAll('input').forEach(elem => elem.addEventListener('input', updateLivePreview));
    updateLivePreview();
}
