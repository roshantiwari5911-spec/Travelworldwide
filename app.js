// Dynamic Day Counter Tracking
let dayCount = 0;

// Grab key UI elements from the DOM
let addDayBtn, daysContainer, previewPane;

// Core Package Inputs for real-time tracking
const inputs = ['pkg-title', 'pkg-destination', 'pkg-date', 'pkg-pax', 'pkg-vehicle', 'pkg-price'];

// Initialize Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    addDayBtn = document.getElementById('add-day-btn');
    daysContainer = document.getElementById('days-container');
    previewPane = document.getElementById('pdf-preview-pane');

    // Attach live listeners to form fields for premium live-preview updating
    inputs.forEach(id => {
        document.getElementById(id)?.addEventListener('input', updateLivePreview);
    });

    // Add day action button
    addDayBtn?.addEventListener('click', addItineraryDay);
    
    // Export PDF action button
    document.getElementById('export-btn')?.addEventListener('click', generateProfessionalPDF);

    // Bootstrap first sample day on load
    addItineraryDay();
});

// Function to dynamically append a new Day Block to your form builder
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

// Function to safely remove a day block
function removeItineraryDay(id) {
    const element = document.getElementById(`day-block-${id}`);
    if (element) {
        element.remove();
        reindexDays();
        updateLivePreview();
    }
}

// Helper to clean up numbering if an earlier day is deleted
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

// The Live Preview Engine: Renders an Apple-minimalist preview document on your right pane
function updateLivePreview() {
    const title = document.getElementById('pkg-title').value || "Untitled Premium Package";
    const dest = document.getElementById('pkg-destination').value || "---";
    const date = document.getElementById('pkg-date').value || "---";
    const pax = document.getElementById('pkg-pax').value || "0";
    const vehicle = document.getElementById('pkg-vehicle').value || "---";
    const price = document.getElementById('pkg-price').value || "0";

    let daysHtml = '';
    const dayBlocks = daysContainer.children;
    
    Array.from(dayBlocks).forEach((block, index) => {
        const dTitle = block.querySelector('.day-title-input').value || `Day ${index + 1} Activity`;
        const dDesc = block.querySelector('.day-desc-input').value || 'Excursion details to be finalized.';
        
        daysHtml += `
            <div style="margin-bottom: 24px; page-break-inside: avoid;">
                <h4 style="font-size: 14px; font-weight: 700; color: #1e1b4b; margin: 0 0 4px 0;">Day ${index + 1}: ${dTitle}</h4>
                <p style="font-size: 12px; color: #475569; margin: 0; line-height: 1.6; text-align: justify;">${dDesc}</p>
            </div>
        `;
    });

    previewPane.innerHTML = `
        <div id="printable-pdf-area" style="padding: 10px; font-family: -apple-system, sans-serif; color: #1e293b;">
            <!-- Luxury Branding Header -->
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

            <!-- Meta Details Overview Grid -->
            <div style="background: #f8fafc; border-radius: 12px; padding: 16px; margin-bottom: 25px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; font-size: 12px; border: 1px solid #e2e8f0;">
                <div><strong style="color: #475569;">Package Title:</strong> <span style="color: #0f172a; font-weight: 500;">${title}</span></div>
                <div><strong style="color: #475569;">Destination:</strong> <span style="color: #0f172a; font-weight: 500;">${dest}</span></div>
                <div><strong style="color: #475569;">Departure Date:</strong> <span style="color: #0f172a; font-weight: 500;">${date}</span></div>
                <div><strong style="color: #475569;">Total Travelers:</strong> <span style="color: #0f172a; font-weight: 500;">${pax} Adults</span></div>
                <div style="grid-column: span 2;"><strong style="color: #475569;">Private Ground Transport:</strong> <span style="color: #0f172a; font-weight: 500;">${vehicle}</span></div>
            </div>

            <!-- Itinerary Section -->
            <div style="margin-bottom: 25px;">
                <h3 style="font-size: 13px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 16px;">Day-Wise Details</h3>
                ${daysHtml || '<p style="color:#94a3b8; font-style:italic; font-size:12px;">No days added yet.</p>'}
            </div>

            <!-- Inclusions / Exclusions Layout Block -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; border-top: 1px solid #e2e8f0; padding-top: 20px; margin-bottom: 30px; page-break-inside: avoid;">
                <div>
                    <h4 style="font-size: 11px; font-weight: 800; color: #16a34a; text-transform: uppercase; margin: 0 0 8px 0;">✓ Standard Inclusions</h4>
                    <ul style="font-size: 11px; color: #475569; margin: 0; padding-left: 14px; line-height: 1.5;">
                        <li>Premium accommodations as detailed above</li>
                        <li>All airport transfers and local sightseeing via private AC vehicle</li>
                        <li>Daily gourmet breakfast at the hotel properties</li>
                    </ul>
                </div>
                <div>
                    <h4 style="font-size: 11px; font-weight: 800; color: #dc2626; text-transform: uppercase; margin: 0 0 8px 0;">✕ Exclusions</h4>
                    <ul style="font-size: 11px; color: #475569; margin: 0; padding-left: 14px; line-height: 1.5;">
                        <li>International or domestic flight tickets</li>
                        <li>Personal laundry, tips, and items outside mentioned meals</li>
                        <li>Travel insurance or emergency documentation support</li>
                    </ul>
                </div>
            </div>

            <!-- Pricing Block -->
            <div style="background: #0f172a; color: white; border-radius: 12px; padding: 16px; display: flex; justify-content: space-between; align-items: center; page-break-inside: avoid;">
                <div>
                    <span style="font-size: 10px; text-transform: uppercase; tracking: 0.5px; color: #94a3b8; display:block;">Total Net Investment</span>
                    <span style="font-size: 11px; color: #cbd5e1;">All inclusive of local government levies</span>
                </div>
                <div style="font-size: 20px; font-weight: 700; color: #34d399;">
                    ₹${Number(price).toLocaleString('en-IN')}/-
                </div>
            </div>
        </div>
    `;
}

// Magazine-Grade Professional PDF Generator Engine
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
