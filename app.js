// ====== SUPABASE CLOUD CONNECTION CONFIGURATION ======
const SUPABASE_URL = "https://txqhsxyodszbfwsqvcjf.supabase.co"; 
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4cWhzeHlvZHN6YmZ3c3F2Y2pmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0MTIzMTgsImV4cCI6MjA5Njk4ODMxOH0._86b10n0y6WPasyJqdCX-MKxtXfXtVyYsW9cS3B43cQ";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// =====================================================

let dayCount = 0;
let hotelCount = 0;
let addDayBtn, addHotelBtn, daysContainer, hotelsContainer, previewPane, loginGate, crmWorkspace;

const inputs = ['pkg-title', 'pkg-destination', 'pkg-date', 'pkg-pax', 'pkg-vehicle', 'pkg-price', 'pkg-inclusions', 'pkg-exclusions'];

document.addEventListener('DOMContentLoaded', () => {
    addDayBtn = document.getElementById('add-day-btn');
    addHotelBtn = document.getElementById('add-hotel-btn');
    daysContainer = document.getElementById('days-container');
    hotelsContainer = document.getElementById('hotels-container');
    previewPane = document.getElementById('pdf-preview-pane');
    loginGate = document.getElementById('login-gate');
    crmWorkspace = document.getElementById('crm-workspace');

    const submitBtn = document.getElementById('login-submit-btn');
    submitBtn?.addEventListener('click', handleWorkspaceLogin);

    inputs.forEach(id => {
        document.getElementById(id)?.addEventListener('input', updateLivePreview);
    });

    addDayBtn?.addEventListener('click', addItineraryDay);
    addHotelBtn?.addEventListener('click', addHotelStayBlock);
    
    document.getElementById('export-btn')?.addEventListener('click', generateProfessionalPDF);
    document.getElementById('save-btn')?.addEventListener('click', saveItineraryToSupabase);
});

function unlockPremiumWorkspace() {
    loginGate.style.opacity = "0";
    setTimeout(() => {
        loginGate.style.display = "none";
        crmWorkspace.classList.remove('hidden-workspace');
        setTimeout(() => {
            crmWorkspace.style.opacity = "1";
            addHotelStayBlock(); // Pre-populate 1st Hotel slot automatically
            addItineraryDay();    // Pre-populate Day 1 block automatically
        }, 50);
    }, 500);
}

async function handleWorkspaceLogin(e) {
    if (e) e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const submitBtn = document.getElementById('login-submit-btn');

    if (!email || !password) {
        alert("Please fill out both the email and password fields.");
        return;
    }

    submitBtn.innerText = "Verifying Credentials...";
    submitBtn.disabled = true;

    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) throw error;

        submitBtn.innerText = "Access Granted";
        submitBtn.style.backgroundColor = "#10B981";
        submitBtn.style.color = "#FFFFFF";

        setTimeout(() => { unlockPremiumWorkspace(); }, 600);
    } catch (err) {
        alert(`Authentication Failed: ${err.message || err}`);
        submitBtn.innerText = "Sign In to Workspace";
        submitBtn.disabled = false;
    }
}

// Dynamic Hotel Component Insertion Generator
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
            <input type="text" placeholder="Hotel Name (e.g., Bangkok Luxury Resort & Spa)" class="hotel-name w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-white/30 text-white" oninput="updateLivePreview()">
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

// Formats ugly system inputs into premium clean UI strings (e.g., "2026-06-14" -> "14 Jun, 2026")
function formatPremiumDate(dateStr) {
    if (!dateStr) return "---";
    const opts = { day: 'numeric', month: 'short', year: 'numeric' };
    return new Date(dateStr).toLocaleDateString('en-US', opts);
}

function updateLivePreview() {
    const title = document.getElementById('pkg-title').value || "Untitled Premium Package";
    const dest = document.getElementById('pkg-destination').value || "---";
    const date = document.getElementById('pkg-date').value || "---";
    const pax = document.getElementById('pkg-pax').value || "0";
    const vehicle = document.getElementById('pkg-vehicle').value || "---";
    const price = document.getElementById('pkg-price').value || "0";

    // Build Hotel Stay Document Rows dynamically
    let hotelsHtml = '';
    const hotelBlocks = hotelsContainer.children;
    Array.from(hotelBlocks).forEach((block) => {
        const hName = block.querySelector('.hotel-name').value || "Accommodation Pending Confirmation";
        const hIn = formatPremiumDate(block.querySelector('.hotel-in').value);
        const hOut = formatPremiumDate(block.querySelector('.hotel-out').value);
        const hNights = block.querySelector('.hotel-nights').value || "0";

        hotelsHtml += `
            <tr style="border-bottom: 1px solid #f1f5f9; font-size: 11.5px; color: #334155;">
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

    let incHtml = inclusionsArray.map(item => `<li>${item}</li>`).join('');
    let excHtml = exclusionsArray.map(item => `<li>${item}</li>`).join('');

    let daysHtml = '';
    const dayBlocks = daysContainer.children;
    Array.from(dayBlocks).forEach((block, index) => {
        const dTitle = block.querySelector('.day-title-input').value || `Day ${index + 1} Activity`;
        const dDesc = block.querySelector('.day-desc-input').value || 'Excursion details to follow.';
        daysHtml += `
            <div style="margin-bottom: 20px; page-break-inside: avoid;">
                <h4 style="font-size: 13.5px; font-weight: 700; color: #1e1b4b; margin: 0 0 4px 0;">Day ${index + 1}: ${dTitle}</h4>
                <p style="font-size: 11.5px; color: #475569; margin: 0; line-height: 1.6; text-align: justify;">${dDesc}</p>
            </div>
        `;
    });

    previewPane.innerHTML = `
        <div id="printable-pdf-area" style="padding: 10px; font-family: -apple-system, sans-serif; color: #1e293b;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 25px;">
                <div>
                    <h2 style="font-size: 22px; font-weight: 800; tracking: -0.5px; color: #0f172a; margin: 0;">TRAVEL WORLD WIDE</h2>
                    <p style="font-size: 11px; color: #64748b; margin: 2px 0 0 0; text-transform: uppercase; tracking: 1px;">Boutique Curated Quotation</p>
                </div>
                <div style="text-align: right; font-size: 11px; color: #64748b; line-height: 1.4;">
                    <p style="margin:0; font-weight: 600; color: #334155;">salestravelworldwide@gmail.com</p>
                    <p style="margin:0;">+91 88926 89595</p>
                </div>
            </div>

            <div style="background: #f8fafc; border-radius: 12px; padding: 16px; margin-bottom: 25px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; font-size: 12px; border: 1px solid #e2e8f0;">
                <div><strong style="color: #475569;">Package Title:</strong> <span style="color: #0f172a; font-weight: 500;">${title}</span></div>
                <div><strong style="color: #475569;">Destination:</strong> <span style="color: #0f172a; font-weight: 500;">${dest}</span></div>
                <div><strong style="color: #475569;">Departure Date:</strong> <span style="color: #0f172a; font-weight: 500;">${formatPremiumDate(date)}</span></div>
                <div><strong style="color: #475569;">Total Travelers:</strong> <span style="color: #0f172a; font-weight: 500;">${pax} Adults</span></div>
                <div style="grid-column: span 2;"><strong style="color: #475569;">Private Ground Transport:</strong> <span style="color: #0f172a; font-weight: 500;">${vehicle}</span></div>
            </div>

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
                        ${hotelsHtml || '<tr><td colspan="4" style="color:#94a3b8; font-style:italic; padding:10px; font-size:11px;">No properties selected for this route layout.</td></tr>'}
                    </tbody>
                </table>
            </div>

            <div style="margin-bottom: 25px;">
                <h3 style="font-size: 12px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 14px;">Day-Wise Details</h3>
                ${daysHtml || '<p style="color:#94a3b8; font-style:italic; font-size:11px;">No itinerary days cataloged yet.</p>'}
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; border-top: 1px solid #e2e8f0; padding-top: 20px; margin-bottom: 30px; page-break-inside: avoid;">
                <div>
                    <h4 style="font-size: 11px; font-weight: 800; color: #16a34a; text-transform: uppercase; margin: 0 0 8px 0;">✓ Custom Inclusions</h4>
                    <ul style="font-size: 11px; color: #475569; margin: 0; padding-left: 14px; line-height: 1.5;">
                        ${incHtml}
                    </ul>
                </div>
                <div>
                    <h4 style="font-size: 11px; font-weight: 800; color: #dc2626; text-transform: uppercase; margin: 0 0 8px 0;">✕ Exclusions</h4>
                    <ul style="font-size: 11px; color: #475569; margin: 0; padding-left: 14px; line-height: 1.5;">
                        ${excHtml}
                    </ul>
                </div>
            </div>

            <div style="background: #0f172a; color: white; border-radius: 12px; padding: 16px; display: flex; justify-content: space-between; align-items: center; page-break-inside: avoid;">
                <div>
                    <span style="font-size: 10px; text-transform: uppercase; tracking: 0.5px; color: #94a3b8; display:block;">Total Net Investment</span>
                    <span style="font-size: 11px; color: #cbd5e1;">All inclusive of boutique coordination levies</span>
                </div>
                <div style="font-size: 20px; font-weight: 700; color: #34d399;">
                    ₹${Number(price).toLocaleString('en-IN')}/-
                </div>
            </div>
        </div>
    `;
}

function generateProfessionalPDF() {
    const element = document.getElementById('printable-pdf-area');
    const title = document.getElementById('pkg-title').value || "Quotation";
    const options = {
        margin:       [15, 15, 15, 15],
        filename:     `${title.replace(/\s+/g, '_')}_TravelWorldwide.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(options).from(element).save();
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

    const inclusionsText = document.getElementById('pkg-inclusions')?.value || "";
    const exclusionsText = document.getElementById('pkg-exclusions')?.value || "";
    const inclusions = inclusionsText.split('\n').filter(item => item.trim() !== "");
    const exclusions = exclusionsText.split('\n').filter(item => item.trim() !== "");

    // Extract dynamic accommodations payload array
    const hotelBlocks = hotelsContainer.children;
    const hotelsPayload = Array.from(hotelBlocks).map(block => {
        return {
            hotel_name: block.querySelector('.hotel-name').value || "TBD",
            check_in: block.querySelector('.hotel-in').value || null,
            check_out: block.querySelector('.hotel-out').value || null,
            nights: parseInt(block.querySelector('.hotel-nights').value) || 0
        };
    });

    if (!title || !destination) {
        alert("Please provide at least a Title and Destination to save this quotation.");
        saveBtn.innerText = originalText;
        saveBtn.style.opacity = "1";
        return;
    }

    try {
        // Appends the master package along with hotel summary layouts into your JSON column fields
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
                hotel_details: hotelsPayload // Saves all hotels as an array natively
            }])
            .select();

        if (itinError) throw itinError;
        
        const newItineraryId = itineraryData[0].id;
        const dayBlocks = daysContainer.children;
        const daysPayload = Array.from(dayBlocks).map((block, index) => {
            return {
                itinerary_id: newItineraryId,
                day_number: index + 1,
                day_title: block.querySelector('.day-title-input').value || `Day ${index + 1} Activity`,
                description: block.querySelector('.day-desc-input').value || 'Details to follow.'
            };
        });

        if (daysPayload.length > 0) {
            const { error: daysError } = await supabaseClient
                .from('itinerary_days')
                .insert(daysPayload);
            if (daysError) throw daysError;
        }

        saveBtn.innerText = "✓ Saved Successfully";
        saveBtn.style.backgroundColor = "#059669"; 
        setTimeout(() => {
            saveBtn.innerText = originalText;
            saveBtn.style.backgroundColor = ""; 
            saveBtn.style.opacity = "1";
        }, 2500);

    } catch (err) {
        console.error("Database operation failed:", err);
        alert(`Could not sync to cloud: ${err.message || err}`);
        saveBtn.innerText = originalText;
        saveBtn.style.opacity = "1";
    }
}
