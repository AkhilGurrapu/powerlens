// --- Constants (Approximate values, clearly label as estimates) ---
const PRO_COST = 10;
const PPU_COST = 20;
const PPU_E5_COST = 10; // PPU cost if user has M365 E5
const F64_RESERVED_COST_APPROX = 5000; // Very rough estimate for comparison

const CAPACITY_USER_THRESHOLD = 350; // Guideline: ~350+ viewers often justifies F64+
const PPU_CAPACITY_THRESHOLD = 250; // Guideline: PPU might be cheaper than F64 below this user count

const PRO_MODEL_LIMIT_GB = 1;
const PPU_MODEL_LIMIT_GB = 100; // Varies slightly, but good general limit
// Fabric capacity model limits vary significantly by SKU (F2=0.5GB, F64=25GB, F2048=400GB), needs nuanced handling

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
        // --- Embedding Scenarios ---
        if (input.embedTarget === 'external' || input.embedTarget === 'mix') {
            // Embedding for Customers (or Mix involving Customers) - A SKU or F SKU preferred
            // A SKUs are pay-as-you-go, good for external only. F SKUs more versatile if internal access might be needed.
            result.recommendationText = "Fabric F SKU / Power BI Embedded A SKU";
            result.explanation.push("Embedding for external customers requires a capacity-based license like Fabric F SKU or Embedded A SKU.");
            result.explanation.push("F SKUs offer more flexibility if internal users might also need portal access in the future.");
            result.explanation.push("A SKUs offer pay-as-you-go pricing, suitable if pausing capacity is beneficial.");
            result.keyFeatures.push("Embedding for external users", "Capacity-based scaling");
            result.alternatives = "Choose A SKU for pure external embedding with pause capability. Choose F SKU for mixed scenarios or potential future internal portal access.";
            // Publishers still need Pro
            result.breakdown.push(`${input.numPublishers} x Power BI Pro (~$${PRO_COST}/user/month) for publishers.`);
            result.breakdown.push("1 x Fabric F SKU (e.g., F8+) or Embedded A SKU (e.g., A1+) - Pricing varies by SKU and usage (PAYG/Reservation).");
            result.breakdown.push("End users (external) do not require individual Power BI licenses.");
        }
        else if (input.embedTarget === 'internal') {
            // Embedding for Internal Organization
            if (input.internalNeedsPortal === 'true') {
                 // Internal users NEED portal access - Treat similarly to non-embedded scenarios based on scale/features
                 result.explanation.push("Internal users require portal access alongside embedding.");
                if (totalUsers > CAPACITY_USER_THRESHOLD || needsF64Features || needsHugeModel) {
                    result.recommendationText = "Fabric F64+ Capacity + Power BI Pro";
                    result.explanation.push("Fabric F64+ capacity recommended due to high user count (>350), F64+ specific features (AI, Unlimited Sharing, Report Server), or very large models (>100GB).");
                    result.keyFeatures.push("Unlimited Sharing (Free license for viewers via portal)", "Supports large datasets", "Advanced AI features (if selected)", "48 Refreshes/day");
                    result.breakdown.push(`${input.numPublishers} x Power BI Pro (~$${PRO_COST}/user/month) for publishers.`);
                    result.breakdown.push(`1 x Fabric F64+ SKU (Reservation recommended, ~$${F64_RESERVED_COST_APPROX}/month starting price).`);
                    result.breakdown.push(`Viewers: Free license sufficient via Fabric Capacity for portal access.`);
                     result.alternatives = "Lower F SKUs (e.g., F32) might be possible if only large models (10-100GB) or basic premium features are needed, but users would need Pro licenses.";
                } else if (needsPremiumFeatures || modelExceedsProLimit) {
                    result.recommendationText = "Power BI Premium Per User (PPU)";
                    let currentPpuCost = input.hasE5 === 'yes' ? PPU_E5_COST : PPU_COST;
                    result.explanation.push("PPU recommended for premium features (incl. models >1GB) or advanced embedding needs with moderate user counts (<350) requiring portal access.");
                    result.keyFeatures.push("Supports large datasets (up to 100GB)", "Most Premium Features (Advanced Dataflows, Pipelines, XMLA)", "48 Refreshes/day");
                    result.breakdown.push(`${totalUsers} x Power BI PPU (~$${currentPpuCost}/user/month - price depends on M365 E5 status).`);
                    publisherLicense = "PPU"; // Override publisher license
                } else {
                    result.recommendationText = "Power BI Pro";
                    result.explanation.push("Pro licenses required for all users (publishers and viewers) accessing embedded content and needing portal access, with standard features and models <= 1GB.");
                    result.keyFeatures.push("Basic Collaboration & Sharing", "Embed for Internal Users (with Pro license)");
                    result.breakdown.push(`${totalUsers} x Power BI Pro (~$${PRO_COST}/user/month).`);
                }
            } else {
                // Internal users DO NOT need portal access - Fabric F SKU (or deprecated EM)
                result.recommendationText = "Fabric F SKU";
                result.explanation.push("Embedding for internal users who do not need direct portal access can be achieved cost-effectively with Fabric F SKUs.");
                result.explanation.push("Users accessing only the embedded report do not need individual licenses with this setup.");
                result.keyFeatures.push("Embedding for internal users without requiring user licenses", "Capacity-based scaling");
                result.breakdown.push(`${input.numPublishers} x Power BI Pro (~$${PRO_COST}/user/month) for publishers.`);
                result.breakdown.push("1 x Fabric F SKU (e.g., F2+) - Pricing varies by SKU and usage (PAYG/Reservation).");
                result.alternatives = "The deprecated EM SKUs were previously used here, but F SKUs are recommended. If users ever need portal access later, they would need Pro/PPU licenses or an upgrade to F64+.";
            }
        }
    } else {
        // --- Non-Embedding Scenarios ---
         result.explanation.push("Scenario does not involve embedding reports in external applications.");
        if (totalUsers > CAPACITY_USER_THRESHOLD || needsF64Features || needsHugeModel) {
            result.recommendationText = "Fabric F64+ Capacity + Power BI Pro";
            result.explanation.push(`Fabric F64+ capacity recommended due to high user count (> ${CAPACITY_USER_THRESHOLD}), need for F64+ features (AI, Unlimited Sharing, Report Server), or very large models (>100GB).`);
            if (totalUsers > CAPACITY_USER_THRESHOLD) result.explanation.push(`Enables 'Unlimited Sharing' where viewers only need a Free license.`);
            if (needsF64Features) result.explanation.push(`Required for features like: ${input.premiumFeatures.filter(f => ['ai', 'unlimitedSharing', 'reportServer'].includes(f)).join(', ')}.`);
            if (needsHugeModel) result.explanation.push("Required for models expected to exceed 100GB.");
            result.keyFeatures.push("Unlimited Sharing (Free license for viewers)", "Supports large datasets", "Advanced AI features", "48 Refreshes/day", "Report Server License (optional)");
            result.breakdown.push(`${input.numPublishers} x Power BI Pro (~$${PRO_COST}/user/month) for publishers.`);
            result.breakdown.push(`1 x Fabric F64+ SKU (Reservation recommended, ~$${F64_RESERVED_COST_APPROX}/month starting price). Select specific SKU based on exact model size/compute needs.`);
            result.breakdown.push("Viewers: Free license sufficient via Fabric Capacity.");
            result.alternatives = "If cost is paramount and F64+ features aren't strictly needed immediately, PPU could be considered for up to ~250-350 users, but lacks unlimited sharing.";
        }
        else if (needsPremiumFeatures || modelExceedsProLimit) {
            result.recommendationText = "Power BI Premium Per User (PPU)";
            let currentPpuCost = input.hasE5 === 'yes' ? PPU_E5_COST : PPU_COST;
            result.explanation.push("PPU recommended for accessing premium features or models larger than 1GB with moderate user counts.");
             if (modelExceedsProLimit) result.explanation.push(`Required for model sizes between ${PRO_MODEL_LIMIT_GB}GB and ${PPU_MODEL_LIMIT_GB}GB.`);
             if (needsPremiumFeatures) result.explanation.push(`Enables premium features like: ${input.premiumFeatures.join(', ')} without needing a full capacity.`);
            result.keyFeatures.push("Supports large datasets (up to 100GB)", "Most Premium Features (Advanced Dataflows, Pipelines, XMLA, high refresh)", "48 Refreshes/day");
            result.breakdown.push(`${totalUsers} x Power BI PPU (~$${currentPpuCost}/user/month - price depends on M365 E5 status).`);
            publisherLicense = "PPU"; // Publishers are covered by the PPU recommendation
            result.alternatives = `If user count grows significantly (> ${PPU_CAPACITY_THRESHOLD}-${CAPACITY_USER_THRESHOLD}), evaluate moving to Fabric F64+ capacity for potential cost savings and unlimited sharing.`;
        }
        else {
            // Check for Free license viability (very limited use case)
            if (input.numPublishers === 1 && input.numViewers === 0 && !modelExceedsProLimit && !needsPremiumFeatures && !input.embedding) {
                 result.recommendationText = "Power BI Free";
                 result.explanation.push("A Free license is suitable only for individual use (publishing to 'My Workspace').");
                 result.explanation.push("No sharing or collaboration is possible with a Free license.");
                 result.keyFeatures.push("Create reports in Desktop", "Publish to personal 'My Workspace'", "Model size limit 1GB");
                 result.breakdown.push("1 x Power BI Free License (for the single user).");
                 publisherLicense = "Free";
            } else {
                result.recommendationText = "Power BI Pro";
                result.explanation.push("Power BI Pro licenses recommended for standard collaboration and sharing when premium features or large models are not required, and user count is moderate.");
                result.keyFeatures.push("Sharing & Collaboration", "Publish to Shared Workspaces", "Build Power BI Apps");
                result.breakdown.push(`${totalUsers} x Power BI Pro (~$${PRO_COST}/user/month).`);
                // Publisher license is already Pro
            }
        }
    }

    // --- Final Adjustments & Refinements ---

    // Clear placeholder explanation if logic ran
    if (result.recommendationText) {
        // Remove the initial placeholder explanation if others were added
        if (result.explanation.length > 1 && result.explanation[0] === "Please complete all steps.") {
             result.explanation.shift();
        }
         // Ensure publisher license details are correct if not PPU/Free main recommendation
        if (publisherLicense === "Pro" && input.numPublishers > 0 && !result.recommendationText.toLowerCase().includes("ppu") && !result.recommendationText.toLowerCase().includes("free")) {
             // Check if Pro publisher breakdown already added by specific paths
             let alreadyAdded = result.breakdown.some(line => line.includes("Pro") && line.includes("publisher"));
             if (!alreadyAdded) {
                 result.breakdown.unshift(`${input.numPublishers} x Power BI Pro (~$${publisherLicenseCost}/user/month) for publishers.`);
             }
        } else if (publisherLicense === "Pro" && input.numPublishers > 0 && result.recommendationText.includes("Fabric F64+")) {
            // Ensure it's added for F64 case too
             let alreadyAdded = result.breakdown.some(line => line.includes("Pro") && line.includes("publisher"));
             if (!alreadyAdded) {
                  result.breakdown.unshift(`${input.numPublishers} x Power BI Pro (~$${publisherLicenseCost}/user/month) for publishers.`);
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