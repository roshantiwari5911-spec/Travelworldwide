// ====== SUPABASE CLOUD CONNECTION CONFIGURATION ======
const SUPABASE_URL = "https://txqhsxyodszbfwsqvcjf.supabase.co"; 
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4cWhzeHlvZHN6YmZ3c3F2Y2pmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0MTIzMTgsImV4cCI6MjA5Njk4ODMxOH0._86b10n0y6WPasyJqdCX-MKxtXfXtVyYsW9cS3B43cQ";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// =====================================================

let dayCount = 0;
let addDayBtn, daysContainer, previewPane, loginGate, crmWorkspace, loginForm;

// Updated core tracking arrays to include our new inclusions and exclusions inputs
const inputs = ['pkg-title', 'pkg-destination', 'pkg-date', 'pkg-pax', 'pkg-vehicle', 'pkg-price', 'pkg-inclusions', 'pkg-exclusions'];

document.addEventListener('DOMContentLoaded', () => {
    addDayBtn = document.getElementById('add-day-btn');
    daysContainer = document.getElementById('days-container');
    previewPane = document.getElementById('pdf-preview-pane');
    loginGate = document.getElementById('login-gate');
    crmWorkspace = document.getElementById('crm-workspace');
    loginForm = document.getElementById('login-form');

    // Wire up the authentication submission gate
    loginForm?.addEventListener('submit', handleWorkspaceLogin);

    inputs.forEach(id => {
        document.getElementById(id)?.addEventListener('input', updateLivePreview);
    });

    addDayBtn?.addEventListener('click', addItineraryDay);
    document.getElementById('export-btn')?.addEventListener('click', generateProfessionalPDF);
    document.getElementById('save-btn')?.addEventListener('click', saveItineraryToSupabase);
});

// Smooth fade out of login card and elegant expansion of the workspace
function unlockPremiumWorkspace() {
    loginGate.style.opacity = "0";
    setTimeout(() => {
        loginGate.style.display = "none";
        crmWorkspace.classList.remove('hidden-workspace');
        setTimeout(() => {
            crmWorkspace.style.opacity = "1";
            addItineraryDay(); // Instantly initialize Day 1 field automatically
        }, 50);
    }, 500);
}

// Processing pipeline for secure workspace access
async function handleWorkspaceLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const submitBtn = document.getElementById('login-submit-btn');

    submitBtn.innerText = "Verifying Credentials...";
    submitBtn.disabled = true;

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
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

function updateLivePreview() {
    const title = document.getElementById('pkg-title').value || "Untitled Premium Package";
    const dest = document.getElementById('pkg-destination').value || "---";
    const date = document.getElementById('pkg-date').value || "---";
    const pax = document.getElementById('pkg-pax').value || "0";
    const vehicle = document.getElementById('pkg-vehicle').value || "---";
    const price = document.getElementById('pkg-price').value || "0";

    // Split textareas by lines to map dynamic bullet lists cleanly into the PDF layout
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
        const dDesc = block.querySelector('.day
