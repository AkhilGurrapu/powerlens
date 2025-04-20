// --- Constants (Approximate values, clearly label as estimates) ---
const PRO_COST = 14; // $14.00 user/month (paid yearly)
const PPU_COST = 24; // $24.00 user/month (paid yearly)
const PPU_E5_COST = 14; // $14.00 user/month add-on for Pro/M365 E5 users

// Fabric Capacity Reservation Costs (Central US, USD/Month, ~41% savings vs PAYG)
const F2_RESERVED_COST = 156.33;
const F4_RESERVED_COST = 312.67;
const F8_RESERVED_COST = 625.33;
const F16_RESERVED_COST = 1250.67;
const F32_RESERVED_COST = 2501.33;
const F64_RESERVED_COST = 5002.67; // Updated based on provided table
const F128_RESERVED_COST = 10005.33;
const F256_RESERVED_COST = 20010.67;
const F512_RESERVED_COST = 40021.33;
const F1024_RESERVED_COST = 80042.67;
const F2048_RESERVED_COST = 160085.33;

// Keep the F64 approx cost for general comparison text if needed, but use specific value for calculations
const F64_RESERVED_COST_APPROX = 5000;

const CAPACITY_USER_THRESHOLD = 350; // Guideline: ~350+ viewers often justifies F64+ cost-wise vs Pro
// PPU vs F64 threshold is complex due to E5 pricing, evaluate case-by-case in logic
const PPU_CAPACITY_THRESHOLD = 210; // Rough guideline: ~210 users * $24 PPU > $5002 F64

const PRO_MODEL_LIMIT_GB = 1;
const PPU_MODEL_LIMIT_GB = 100;
// Fabric capacity model limits vary by SKU (F64=25GB, F128=50GB, F256=100GB, F512=200GB etc)

// --- User Input Data Store ---
let userInput = {
    numViewers: 0,
    numPublishers: 0,
    embedding: null, // true | false
    embedTarget: null, // 'internal' | 'external' | 'mix'
    internalNeedsPortal: null, // true | false
    maxModelSize: null, // '<1GB' | '1GB-10GB' | '10GB-100GB' | '>100GB'
    premiumFeatures: [], // ['ai', 'highRefresh', 'xmla', ...]
    hasE5: null // 'yes' | 'no' | 'unknown'
};

// --- DOM Elements ---
const wizardSteps = document.querySelectorAll('.wizard-step');
const resultsDiv = document.getElementById('results');
const recommendationOutput = document.getElementById('recommendation-output');
const wizardStepsContainer = document.getElementById('wizard-steps');

// --- Navigation Functions ---
function showStep(stepNumber) {
    wizardSteps.forEach(step => step.classList.remove('active'));
    const nextStepElement = document.getElementById(`step-${stepNumber}`);
    if (nextStepElement) {
        nextStepElement.classList.add('active');
    }
}

function nextStep(currentStep) {
    // Basic validation/data capture before proceeding (can be enhanced)
    if (currentStep === 1) {
        userInput.numViewers = parseInt(document.getElementById('num-viewers').value) || 0;
        userInput.numPublishers = parseInt(document.getElementById('num-publishers').value) || 0;
    }
    // Add data capture for other steps as needed
    showStep(currentStep + 1);
}

function prevStep(currentStep) {
    showStep(currentStep - 1);
}

// --- Input Handling Functions ---
function setEmbedding(value) {
    userInput.embedding = value;
    const embeddingDetails = document.getElementById('embedding-details');
    const internalAccessQ = document.getElementById('internal-access-question');
    const embedTargetButtons = document.querySelectorAll('#embed-target button');
    const internalPortalButtons = document.querySelectorAll('#internal-needs-portal button');

    // Update button styles for embedding choice
    const yesButton = document.querySelector('#step-2 .options button:first-child');
    const noButton = document.querySelector('#step-2 .options button:last-child');
    yesButton.classList.toggle('selected', value === true);
    noButton.classList.toggle('selected', value === false);

    if (value) {
        embeddingDetails.style.display = 'block';
        // Reset sub-options if embedding is re-enabled
        userInput.embedTarget = null;
        userInput.internalNeedsPortal = null;
        embedTargetButtons.forEach(btn => btn.classList.remove('selected'));
        internalPortalButtons.forEach(btn => btn.classList.remove('selected'));
        internalAccessQ.style.display = 'none';

    } else {
        embeddingDetails.style.display = 'none';
        internalAccessQ.style.display = 'none';
        // Clear embedding-specific data if embedding is set to No
        userInput.embedTarget = null;
        userInput.internalNeedsPortal = null;
    }
}

function setupOptionButtons(containerId, inputKey, callback) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.addEventListener('click', (event) => {
        if (event.target.tagName === 'BUTTON') {
            const value = event.target.dataset.value;
            userInput[inputKey] = value;

            // Update button styles
            container.querySelectorAll('button').forEach(btn => {
                btn.classList.remove('selected');
            });
            event.target.classList.add('selected');

            // Execute callback if provided
            if (callback) {
                callback(value);
            }
        }
    });
}

function setupCheckboxes(containerId, inputKey) {
     const container = document.getElementById(containerId);
     if (!container) return;
     container.addEventListener('change', (event) => {
         if (event.target.type === 'checkbox') {
            const value = event.target.value;
            if (event.target.checked) {
                if (!userInput[inputKey].includes(value)) {
                    userInput[inputKey].push(value);
                }
            } else {
                 userInput[inputKey] = userInput[inputKey].filter(item => item !== value);
            }
         }
     });
}


// --- Core Calculation Logic ---
function calculateRecommendation(input) {
    console.log("Calculating with input:", input);

    // --- Initialize Result Object ---
    let result = {
        recommendationText: "",
        breakdown: [],
        explanation: [],
        keyFeatures: [],
        alternatives: "",
        disclaimer: "This calculator provides guidance based on common scenarios. Licensing terms and pricing can change. Always consult official Microsoft documentation and pricing pages for definitive information."
    };

    // Helper function to map feature keys to readable names
    const getFeatureName = (key) => {
        const names = {
            'ai': 'AI-powered insights',
            'highRefresh': 'Data refreshes > 8 times/day',
            'xmla': 'External tools connectivity (XMLA)',
            'pipelines': 'Deployment Pipelines',
            'reportServer': 'On-Premises Hosting (Report Server)',
            'unlimitedSharing': 'Unlimited Sharing (>350 viewers)'
        };
        return names[key] || key;
    };

    // --- Determine necessary flags based on input ---
    const totalUsers = (input.numViewers || 0) + (input.numPublishers || 0);
    const needsPremiumFeatures = input.premiumFeatures.length > 0;
    const needsLargeModel = input.maxModelSize === '10GB-100GB' || input.maxModelSize === '>100GB';
    const needsHugeModel = input.maxModelSize === '>100GB'; // Requires F256+
    const needsF64Features = input.premiumFeatures.includes('ai') || input.premiumFeatures.includes('unlimitedSharing') || input.premiumFeatures.includes('reportServer');
    const modelExceedsProLimit = input.maxModelSize === '1GB-10GB' || needsLargeModel || needsHugeModel;

    // --- Decision Tree Logic ---

    // Publishers always need at least Pro, unless PPU is the final recommendation for all
    let publisherLicense = "Pro";
    let publisherLicenseCost = PRO_COST;

    // Main Decision Path (Following the Tree in Fig 2.3 & text)
    if (input.embedding === true) {
        result.explanation.push("You indicated you need to embed reports.");
        // --- Embedding Scenarios ---
        if (input.embedTarget === 'external' || input.embedTarget === 'mix') {
            // Embedding for Customers (or Mix involving Customers) - A SKU or F SKU preferred
            result.recommendationText = "Fabric F SKU / Power BI Embedded A SKU";
            result.explanation.push(`Embedding for external customers ('${input.embedTarget}' selected) requires a capacity-based license like Fabric F SKU or Embedded A SKU.`);
            result.explanation.push("F SKUs offer more flexibility if internal users might also need portal access in the future.");
            result.explanation.push("A SKUs offer pay-as-you-go pricing, suitable if pausing capacity is beneficial.");
            result.keyFeatures.push("Embedding for external users", "Capacity-based scaling");
            result.alternatives = "Choose A SKU for pure external embedding with pause capability. Choose F SKU for mixed scenarios or potential future internal portal access.";
            result.breakdown.push(`${input.numPublishers} x Power BI Pro (~$${PRO_COST}/user/month) for publishers.`);
            result.breakdown.push("1 x Fabric F SKU (e.g., F8+) or Embedded A SKU (e.g., A1+) - Pricing varies by SKU and usage (PAYG/Reservation).");
            result.breakdown.push("End users (external) do not require individual Power BI licenses.");
        }
        else if (input.embedTarget === 'internal') {
             result.explanation.push(`Embedding is for internal users ('${input.embedTarget}' selected).`);
            // Embedding for Internal Organization
            if (input.internalNeedsPortal === 'true') {
                 result.explanation.push("Internal users require portal access (powerbi.com) alongside embedding.");
                if (totalUsers > CAPACITY_USER_THRESHOLD || needsF64Features || needsHugeModel) {
                    result.recommendationText = "Fabric F64+ Capacity + Power BI Pro";
                     if (totalUsers > CAPACITY_USER_THRESHOLD) result.explanation.push(`Fabric F64+ capacity recommended because the total user count (${totalUsers}) exceeds the typical threshold (${CAPACITY_USER_THRESHOLD}) for cost-effectiveness.`);
                     if (needsF64Features) result.explanation.push(`Fabric F64+ capacity is needed because you selected F64-specific premium features: ${input.premiumFeatures.filter(f => ['ai', 'unlimitedSharing', 'reportServer'].includes(f)).map(getFeatureName).join(', ')}.`);
                     if (needsHugeModel) result.explanation.push(`Fabric F64+ capacity (likely F256+) needed due to the very large maximum model size selected ('${input.maxModelSize}').`);
                    result.keyFeatures.push("Unlimited Sharing (Free license for viewers via portal)", "Supports large datasets", "Advanced AI features (if selected)", "48 Refreshes/day");
                    result.breakdown.push(`${input.numPublishers} x Power BI Pro (~$${PRO_COST}/user/month) for publishers.`);
                    result.breakdown.push(`1 x Fabric F64+ SKU (Reservation recommended, ~$${F64_RESERVED_COST_APPROX}/month starting price).`);
                    result.breakdown.push(`Viewers: Free license sufficient via Fabric Capacity for portal access.`);
                    result.alternatives = "Lower F SKUs (e.g., F32) might be possible if only large models (10-100GB) or basic premium features are needed, but viewers would need Pro licenses for portal access.";
                } else if (needsPremiumFeatures || modelExceedsProLimit) {
                    result.recommendationText = "Power BI Premium Per User (PPU)";
                    let currentPpuCost = input.hasE5 === 'yes' ? PPU_E5_COST : PPU_COST;
                    result.explanation.push(`PPU recommended because premium features or larger models are needed with moderate user counts (<${CAPACITY_USER_THRESHOLD}), and users require portal access.`);
                     if (modelExceedsProLimit) result.explanation.push(`Specifically, the model size ('${input.maxModelSize}') exceeds the ${PRO_MODEL_LIMIT_GB}GB Pro limit.`);
                     if (needsPremiumFeatures) result.explanation.push(`The following selected premium features require PPU or Capacity: ${input.premiumFeatures.map(getFeatureName).join(', ')}.`);
                    result.keyFeatures.push("Supports large datasets (up to 100GB)", "Most Premium Features (Advanced Dataflows, Pipelines, XMLA)", "48 Refreshes/day");
                    result.breakdown.push(`${totalUsers} x Power BI PPU (~$${currentPpuCost}/user/month - cost is lower if users have M365 E5: You selected '${input.hasE5 || 'unknown'}').`);
                    publisherLicense = "PPU"; // Override publisher license
                } else {
                    result.recommendationText = "Power BI Pro";
                    result.explanation.push(`Pro licenses recommended because standard features are sufficient (no premium features selected, model size '${input.maxModelSize || '<1GB'}'), and internal users need portal access.`);
                    result.keyFeatures.push("Basic Collaboration & Sharing", "Embed for Internal Users (with Pro license)");
                    result.breakdown.push(`${totalUsers} x Power BI Pro (~$${PRO_COST}/user/month).`);
                }
            } else {
                // Internal users DO NOT need portal access - Fabric F SKU (or deprecated EM)
                result.recommendationText = "Fabric F SKU";
                result.explanation.push(`Embedding is for internal users who do not need direct portal access ('${input.internalNeedsPortal === 'false' ? 'No' : 'Not specified'}' selected for portal access).`);
                result.explanation.push("Fabric F SKUs allow embedding without requiring individual licenses for users accessing *only* the embedded content.");
                result.keyFeatures.push("Embedding for internal users without requiring user licenses", "Capacity-based scaling");
                result.breakdown.push(`${input.numPublishers} x Power BI Pro (~$${PRO_COST}/user/month) for publishers.`);
                result.breakdown.push("1 x Fabric F SKU (e.g., F2+) - Pricing varies by SKU and usage (PAYG/Reservation). Select SKU based on model size/compute needs.");
                result.alternatives = "The deprecated EM SKUs were previously used here, but F SKUs are recommended. If users ever need portal access later, they would need Pro/PPU licenses or an upgrade to F64+.";
            }
        }
    } else {
        // --- Non-Embedding Scenarios ---
         result.explanation.push("You indicated embedding is not required.");
        if (totalUsers > CAPACITY_USER_THRESHOLD || needsF64Features || needsHugeModel) {
            result.recommendationText = "Fabric F64+ Capacity + Power BI Pro";
            if (totalUsers > CAPACITY_USER_THRESHOLD) result.explanation.push(`Fabric F64+ capacity recommended because the total user count (${totalUsers}) exceeds the typical threshold (${CAPACITY_USER_THRESHOLD}) for cost-effectiveness and enables 'Unlimited Sharing' (viewers need only Free license).`);
            if (needsF64Features) result.explanation.push(`Fabric F64+ capacity is needed because you selected F64-specific premium features: ${input.premiumFeatures.filter(f => ['ai', 'unlimitedSharing', 'reportServer'].includes(f)).map(getFeatureName).join(', ')}.`);
            if (needsHugeModel) result.explanation.push(`Fabric F64+ capacity (likely F256+) needed due to the very large maximum model size selected ('${input.maxModelSize}').`);
            result.keyFeatures.push("Unlimited Sharing (Free license for viewers)", "Supports large datasets", "Advanced AI features", "48 Refreshes/day", "Report Server License (optional)");
            result.breakdown.push(`${input.numPublishers} x Power BI Pro (~$${PRO_COST}/user/month) for publishers.`);
            result.breakdown.push(`1 x Fabric F64+ SKU (Reservation recommended, ~$${F64_RESERVED_COST_APPROX}/month starting price). Select specific SKU based on exact model size/compute needs.`);
            result.breakdown.push("Viewers: Free license sufficient via Fabric Capacity.");
            result.alternatives = "If cost is paramount and F64+ features aren't strictly needed immediately, PPU could be considered for up to ~250-350 users, but lacks unlimited sharing.";
        }
        else if (needsPremiumFeatures || modelExceedsProLimit) {
            result.recommendationText = "Power BI Premium Per User (PPU)";
            let currentPpuCost = input.hasE5 === 'yes' ? PPU_E5_COST : PPU_COST;
            result.explanation.push(`PPU recommended because premium features or larger models are needed, but user count (${totalUsers}) is below the threshold where F64+ capacity is typically required.`);
             if (modelExceedsProLimit) result.explanation.push(`Specifically, the model size ('${input.maxModelSize}') exceeds the ${PRO_MODEL_LIMIT_GB}GB Pro license limit.`);
             if (needsPremiumFeatures) result.explanation.push(`The following selected premium features require PPU or Capacity: ${input.premiumFeatures.map(getFeatureName).join(', ')}.`);
            result.keyFeatures.push("Supports large datasets (up to 100GB)", "Most Premium Features (Advanced Dataflows, Pipelines, XMLA, high refresh)", "48 Refreshes/day");
            result.breakdown.push(`${totalUsers} x Power BI PPU (~$${currentPpuCost}/user/month - cost is lower if users have M365 E5: You selected '${input.hasE5 || 'unknown'}').`);
            publisherLicense = "PPU"; // Publishers are covered by the PPU recommendation
            result.alternatives = `If user count grows significantly (> ${PPU_CAPACITY_THRESHOLD}-${CAPACITY_USER_THRESHOLD}), evaluate moving to Fabric F64+ capacity for potential cost savings and unlimited sharing.`;
        }
        else {
            // Check for Free license viability (very limited use case)
            if (input.numPublishers === 1 && input.numViewers === 0 && !modelExceedsProLimit && !needsPremiumFeatures && !input.embedding) {
                 result.recommendationText = "Power BI Free";
                 result.explanation.push(`A Free license is suitable because input indicates only 1 user (${input.numPublishers} publisher, ${input.numViewers} viewers), no embedding, standard features, and model size ('${input.maxModelSize || '<1GB'}').`);
                 result.explanation.push("This is for individual use (publishing to 'My Workspace') only. No sharing or collaboration is possible.");
                 result.keyFeatures.push("Create reports in Desktop", "Publish to personal 'My Workspace'", "Model size limit 1GB");
                 result.breakdown.push("1 x Power BI Free License (for the single user).");
                 publisherLicense = "Free";
            } else {
                result.recommendationText = "Power BI Pro";
                result.explanation.push(`Power BI Pro licenses recommended as standard features are sufficient (no premium features selected, model size '${input.maxModelSize || '<1GB'}'), user count (${totalUsers}) is moderate, and sharing is needed.`);
                result.keyFeatures.push("Sharing & Collaboration", "Publish to Shared Workspaces", "Build Power BI Apps");
                result.breakdown.push(`${totalUsers} x Power BI Pro (~$${PRO_COST}/user/month).`);
                // Publisher license is already Pro
            }
        }
    }

    // --- Final Adjustments & Refinements ---

    // Ensure publisher breakdown is accurate and consistently placed
    if (result.recommendationText && input.numPublishers > 0) {
        let publisherLine = "";
        if (publisherLicense === "Pro" && !result.recommendationText.toLowerCase().includes("ppu") && !result.recommendationText.toLowerCase().includes("free")) {
            publisherLine = `${input.numPublishers} x Power BI Pro (~$${publisherLicenseCost}/user/month) for publishers.`;
        }
        // PPU/Free cases usually have total user cost, publishers included implicitly or explicitly handled.

        if (publisherLine) {
             // Check if a similar line already exists to avoid duplicates
             let alreadyAdded = result.breakdown.some(line => line.includes("Pro") && line.includes("publisher"));
             if (!alreadyAdded) {
                 // Add it consistently, e.g., at the beginning of the breakdown
                 result.breakdown.unshift(publisherLine);
             }
        }
    }

    // If no recommendation could be made (e.g., conflicting inputs?), provide a default message.
    if (!result.recommendationText) {
        result.recommendationText = "Unable to determine recommendation";
        result.explanation = ["Please review your selections. Some combinations might be conflicting or not directly addressed by standard licensing paths."];
        result.breakdown = [];
        result.keyFeatures = [];
    }


    // Return the structured result object
    return result;
}

// --- Display Results ---
function showResults() {
    // Capture final step data
    // (E5 license status is already captured by setupOptionButtons)

    // Hide wizard, show results
    wizardStepsContainer.style.display = 'none';
    resultsDiv.style.display = 'block';

    // Perform calculation
    const recommendation = calculateRecommendation(userInput);

    // Populate results display
    recommendationOutput.innerHTML = `
        <p><strong>Recommended License(s):</strong> ${recommendation.recommendationText}</p>
        <p><strong>License Breakdown:</strong></p>
        <ul>
            ${recommendation.breakdown.map(item => `<li>${item}</li>`).join('')}
        </ul>
        <p><strong>Why?</strong></p>
        <ul>
            ${recommendation.explanation.map(item => `<li>${item}</li>`).join('')}
        </ul>
        <p><strong>Key Features Enabled:</strong></p>
        <ul>
            ${recommendation.keyFeatures.map(item => `<li>${item}</li>`).join('')}
        </ul>
        ${recommendation.alternatives ? `<p><strong>Alternatives & Considerations:</strong> ${recommendation.alternatives}</p>` : ''}
        <p class="disclaimer">${recommendation.disclaimer}</p>
    `;
}

// --- Reset Function ---
function resetCalculator() {
    // Reset user input object
    userInput = {
        numViewers: 0,
        numPublishers: 0,
        embedding: null,
        embedTarget: null,
        internalNeedsPortal: null,
        maxModelSize: null,
        premiumFeatures: [],
        hasE5: null
    };

    // Reset form elements
    document.getElementById('num-viewers').value = 0;
    document.getElementById('num-publishers').value = 0;
    document.querySelectorAll('.options button.selected').forEach(btn => btn.classList.remove('selected'));
    document.querySelectorAll('input[type="checkbox"]').forEach(chk => chk.checked = false);
    document.getElementById('embedding-details').style.display = 'none';
    document.getElementById('internal-access-question').style.display = 'none';
    const yesButton = document.querySelector('#step-2 .options button:first-child');
    const noButton = document.querySelector('#step-2 .options button:last-child');
    yesButton.classList.remove('selected');
    noButton.classList.remove('selected');


    // Hide results, show first step
    resultsDiv.style.display = 'none';
    wizardStepsContainer.style.display = 'block';
    showStep(1);
}

// --- Initial Setup ---
document.addEventListener('DOMContentLoaded', () => {
    showStep(1); // Show the first step initially

    // Setup button group handlers
    setupOptionButtons('embed-target', 'embedTarget', (value) => {
         // Show/hide internal portal question based on embed target
        const internalAccessQ = document.getElementById('internal-access-question');
        if (value === 'internal' || value === 'mix') {
            internalAccessQ.style.display = 'block';
             // Reset internal portal choice if target changes
             userInput.internalNeedsPortal = null;
             document.querySelectorAll('#internal-needs-portal button').forEach(btn => btn.classList.remove('selected'));
        } else {
            internalAccessQ.style.display = 'none';
            userInput.internalNeedsPortal = null; // Clear if external only
        }
    });
    setupOptionButtons('internal-needs-portal', 'internalNeedsPortal');
    setupOptionButtons('model-size', 'maxModelSize');
    setupOptionButtons('e5-licenses', 'hasE5');

    // Setup checkbox group handler
    setupCheckboxes('premium-features', 'premiumFeatures');
}); 