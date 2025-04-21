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

// Map F-SKU to Reservation Cost for easy lookup
const F_SKU_COSTS = {
    'F2': F2_RESERVED_COST,
    'F4': F4_RESERVED_COST,
    'F8': F8_RESERVED_COST,
    'F16': F16_RESERVED_COST,
    'F32': F32_RESERVED_COST,
    'F64': F64_RESERVED_COST,
    'F128': F128_RESERVED_COST,
    'F256': F256_RESERVED_COST,
    'F512': F512_RESERVED_COST,
    'F1024': F1024_RESERVED_COST,
    'F2048': F2048_RESERVED_COST,
};

// Map F-SKU to model size limit (rough guide based on documentation)
const F_SKU_MODEL_LIMITS_GB = {
    'F2': 1,   // Assumption based on Pro similarity
    'F4': 3,   // Interpolated guess
    'F8': 5,   // Interpolated guess
    'F16': 10,  // Interpolated guess
    'F32': 20,  // Interpolated guess
    'F64': 25,
    'F128': 50,
    'F256': 100,
    'F512': 200,
    'F1024': 400, // Max listed
    'F2048': 400, // Max listed
};

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

    let result = {
        recommendationType: null, // 'per-user', 'capacity', 'hybrid', 'free'
        primaryLicense: null,     // 'Pro', 'PPU', 'F SKU', 'A SKU'
        secondaryLicense: null,   // e.g., 'Pro' for publishers when F SKU is primary
        capacitySKU: null,        // e.g., 'F64', 'F2+'
        totalUserLicenseCost: 0,
        totalCapacityCost: 0,
        totalEstimatedMonthlyCost: 0,
        explanation: [],
        breakdown: [],
        keyFeatures: [],
        alternatives: "",
        disclaimer: "This calculator provides guidance based on common scenarios & estimated reserved pricing (Central US, ~41% savings vs PAYG). Licensing terms and pricing can change. Always consult official Microsoft documentation and pricing pages for definitive information."
    };

    // Helper function to map feature keys to readable names
    const getFeatureName = (key) => {
        const names = {
            'ai': 'AI-powered insights (Requires F64+)',
            'highRefresh': 'Data refreshes > 8 times/day (PPU/Capacity)',
            'xmla': 'External tools connectivity (XMLA) (PPU/Capacity)',
            'pipelines': 'Deployment Pipelines (PPU/Capacity)',
            'reportServer': 'On-Premises Hosting (Report Server) (Requires F64+)',
            'unlimitedSharing': 'Unlimited Sharing (>350 viewers) (Requires F64+)'
        };
        return names[key] || key;
    };

     // Helper function to find the minimum F SKU needed based on model size
     const getMinFskuForModel = (sizeCategory) => {
         let requiredSizeGB;
         switch(sizeCategory) {
             case '1GB-10GB': requiredSizeGB = 10; break;
             case '10GB-100GB': requiredSizeGB = 100; break;
             case '>100GB': requiredSizeGB = 101; break; // Needs > 100GB
             default: requiredSizeGB = 1; // '<1GB' or null
         }

         // Find the smallest F SKU that meets the requirement
         for (const sku in F_SKU_MODEL_LIMITS_GB) {
            if (F_SKU_MODEL_LIMITS_GB[sku] >= requiredSizeGB) {
                 // Special case: >100GB needs at least F256, even if F128 could theoretically hold 100GB
                 if (requiredSizeGB > 100 && sku === 'F128') continue;
                 return sku;
             }
         }
         return 'F2048'; // Default to largest if somehow missed (e.g., >400GB needed)
     };

      // Helper function to get cost string
    const getCostString = (sku) => {
        return F_SKU_COSTS[sku] ? `~$${F_SKU_COSTS[sku].toFixed(2)}/month (Reserved)` : 'Pricing Varies';
    };


    // --- Determine necessary flags based on input ---
    const totalUsers = (input.numViewers || 0) + (input.numPublishers || 0);
    const needsAnyPremium = input.premiumFeatures.length > 0;
    const needsLargeModel = input.maxModelSize === '10GB-100GB';
    const needsHugeModel = input.maxModelSize === '>100GB';
    const needsF64OnlyFeatures = input.premiumFeatures.some(f => ['ai', 'unlimitedSharing', 'reportServer'].includes(f));
    const modelExceedsProLimit = input.maxModelSize === '1GB-10GB' || needsLargeModel || needsHugeModel;

    // --- Determine Primary Licensing Path: Per-User vs. Capacity ---

    let requiresCapacity = false;
    let capacityReason = [];
    let requiredMinCapacitySKU = null;

    // 1. Embedding for External Users mandates Capacity (A or F SKU)
    if (input.embedding === true && (input.embedTarget === 'external' || input.embedTarget === 'mix')) {
        requiresCapacity = true;
        capacityReason.push(`Embedding for external customers ('${input.embedTarget}') requires capacity (A or F SKU).`);
        requiredMinCapacitySKU = 'F2'; // Assume F2 is minimum viable, A SKU is alternative
        result.primaryLicense = "Fabric F SKU / Power BI Embedded A SKU";
    }

    // 2. Embedding for Internal Users WITHOUT portal access mandates Capacity (F SKU)
    else if (input.embedding === true && input.embedTarget === 'internal' && input.internalNeedsPortal === 'false') {
        requiresCapacity = true;
        capacityReason.push("Embedding for internal users *without* portal access requires Fabric F SKU capacity.");
        requiredMinCapacitySKU = 'F2'; // Can start low if no other drivers
        result.primaryLicense = "Fabric F SKU";
    }

    // 3. Specific F64+ Features mandate Capacity
    else if (needsF64OnlyFeatures) {
        requiresCapacity = true;
        const f64Features = input.premiumFeatures.filter(f => ['ai', 'unlimitedSharing', 'reportServer'].includes(f)).map(getFeatureName);
        capacityReason.push(`Selected features require F64+ capacity: ${f64Features.join(', ')}.`);
        requiredMinCapacitySKU = 'F64';
        result.primaryLicense = "Fabric F64+ Capacity";
    }

    // 4. Huge Model Size (>100GB) mandates Capacity (F256+)
    else if (needsHugeModel) {
        requiresCapacity = true;
        capacityReason.push(`Maximum model size '${input.maxModelSize}' requires Fabric F SKU capacity (at least F256).`);
        requiredMinCapacitySKU = 'F256';
        result.primaryLicense = "Fabric F256+ Capacity";
    }

    // 5. Large User Count often makes F64+ Capacity more economical (Guideline)
    else if (!(input.embedding && (input.embedTarget === 'external' || input.embedTarget === 'mix' || (input.embedTarget === 'internal' && input.internalNeedsPortal === 'false'))) && totalUsers > CAPACITY_USER_THRESHOLD && !requiresCapacity) {
         requiresCapacity = true;
         capacityReason.push(`High user count (${totalUsers}) often makes Fabric F64+ capacity more cost-effective than per-user licenses and enables 'Unlimited Sharing'.`);
         requiredMinCapacitySKU = 'F64'; // Driven by unlimited sharing benefit at this scale
         result.primaryLicense = "Fabric F64+ Capacity";
    }


    // --- Calculate Recommendation based on Path ---

    if (requiresCapacity) {
        result.recommendationType = 'capacity'; // Or 'hybrid' if publishers need Pro

        // Determine the final minimum required SKU based on model size AND features
        let modelMinSKU = getMinFskuForModel(input.maxModelSize);
        let finalMinSKU = requiredMinCapacitySKU;

        // Function to compare SKU levels (higher is better)
        const compareSkus = (sku1, sku2) => {
            const skuOrder = Object.keys(F_SKU_COSTS);
            return skuOrder.indexOf(sku1) - skuOrder.indexOf(sku2);
        };

        if (!finalMinSKU || compareSkus(modelMinSKU, finalMinSKU) > 0) {
            finalMinSKU = modelMinSKU;
            capacityReason.push(`Model size '${input.maxModelSize || '<1GB'}' requires at least ${finalMinSKU} capacity.`);
            // Update primaryLicense text if model size dictated a higher SKU than initial reason
             if (finalMinSKU === 'F64' && !result.primaryLicense?.includes('F64+')) result.primaryLicense = "Fabric F64+ Capacity";
             else if (finalMinSKU === 'F256' && !result.primaryLicense?.includes('F256+')) result.primaryLicense = "Fabric F256+ Capacity";
             else if (compareSkus(finalMinSKU, 'F64') < 0 && result.primaryLicense?.includes('F64+')) {
                 // Handles edge case: F64 feature selected, but model size only needs F32. User still needs F64.
                  finalMinSKU = 'F64'; // Keep F64 as the minimum driver.
             } else if (!result.primaryLicense?.includes('SKU')) {
                 result.primaryLicense = `Fabric ${finalMinSKU}+ Capacity`;
             }
        }
         result.capacitySKU = `${finalMinSKU}+`; // Indicate this is the minimum needed

        // Determine Publisher Licensing (Always Pro with Fabric, unless external embedding only)
        if (input.numPublishers > 0 && !(input.embedding && input.embedTarget === 'external')) {
             result.secondaryLicense = 'Pro';
             result.breakdown.push(`${input.numPublishers} x Power BI Pro (~$${PRO_COST}/user/month) - Required for publishers.`);
             result.totalUserLicenseCost += input.numPublishers * PRO_COST;
             result.recommendationType = 'hybrid'; // Capacity + Per-User Pro
        } else if (input.numPublishers > 0 && input.embedding && input.embedTarget === 'external') {
             result.secondaryLicense = 'Pro'; // Still needed technically
             result.breakdown.push(`${input.numPublishers} x Power BI Pro (~$${PRO_COST}/user/month) - Required for publishers (to create/manage content).`);
             result.totalUserLicenseCost += input.numPublishers * PRO_COST;
             result.recommendationType = 'hybrid';
        }


        // Add Capacity Cost to Breakdown
        result.breakdown.push(`1 x Fabric Capacity (Min. ${finalMinSKU}) - Starting at ${getCostString(finalMinSKU)}. Select final SKU based on performance needs.`);
        if (F_SKU_COSTS[finalMinSKU]) {
             result.totalCapacityCost = F_SKU_COSTS[finalMinSKU];
        }

        // Add Viewer Licensing Info
        if (result.primaryLicense === "Fabric F SKU / Power BI Embedded A SKU" && input.embedTarget === 'external') {
             result.breakdown.push("Viewers (External): No individual Power BI licenses needed.");
             result.keyFeatures.push("Embed for external users without per-user licenses");
             result.alternatives = "Choose A SKU for pure external embedding with PAYG/pause. Choose F SKU for mixed scenarios or future internal portal use.";
        } else if (result.primaryLicense === "Fabric F SKU" && input.embedTarget === 'internal' && input.internalNeedsPortal === 'false') {
            result.breakdown.push("Viewers (Internal, Embedded Only): No individual Power BI licenses needed.");
            result.keyFeatures.push("Embed for internal users without per-user licenses");
            result.alternatives = "If users ever need portal access (powerbi.com), they will require Pro/PPU licenses or an upgrade to F64+ capacity.";
        } else if (compareSkus(finalMinSKU, 'F64') >= 0) { // F64 or higher
            result.breakdown.push("Viewers (Internal): Free license sufficient for portal access (via F64+ Capacity).");
            result.keyFeatures.push("Unlimited Sharing (Free license for viewers)");
            if (input.numViewers > 0) result.recommendationType = 'hybrid'; // Capacity + Free/Pro
        } else { // Lower F-SKU (F2-F32) used for embedding/models, but viewers need Pro/PPU for portal
             if (input.numViewers > 0 && input.internalNeedsPortal !== 'false' ) { // Check if portal access is needed or implied
                 result.breakdown.push(`${input.numViewers} x Power BI Pro (~$${PRO_COST}/user/month) - Required for viewers to access portal with F2-F32 capacity.`);
                 result.totalUserLicenseCost += input.numViewers * PRO_COST;
                 result.keyFeatures.push("Supports specific premium features or model sizes on Capacity");
                 result.alternatives = "If user count grows or F64+ features are needed, upgrade Capacity to F64+ to enable free viewer access.";
                 result.recommendationType = 'hybrid'; // Capacity + Pro
             } else if (input.numViewers > 0 && input.internalNeedsPortal === 'false') {
                 // Covered by "Embedded Only" case above.
             }
        }

        // Consolidate explanations and add key features
        result.explanation.push(...capacityReason);
        if (compareSkus(finalMinSKU, 'F64') >= 0) {
            result.keyFeatures.push("Supports large/huge datasets", "All Premium Features (incl. AI, Report Server)", "48 Refreshes/day");
        } else if (compareSkus(finalMinSKU, 'F2') >= 0) { // F2-F32
             result.keyFeatures.push("Supports larger models than Pro", "Some Premium Features (e.g., high refresh, XMLA, pipelines)");
        }

        // Final Recommendation Text
         result.recommendationText = result.primaryLicense;
         if(result.secondaryLicense) {
             result.recommendationText += ` + Power BI ${result.secondaryLicense}`;
         }


    } else {
        // --- Per-User Licensing Path ---
        result.recommendationType = 'per-user';

        // Check for Free license viability first (very limited)
        if (input.numPublishers === 1 && input.numViewers === 0 && !modelExceedsProLimit && !needsAnyPremium && !input.embedding) {
            result.recommendationType = 'free';
            result.primaryLicense = 'Free';
            result.recommendationText = "Power BI Free";
            result.explanation.push("Suitable for single-user analysis using 'My Workspace'. No sharing features.");
            result.keyFeatures.push("Individual use", "Publish to 'My Workspace'", `Model size limit ${PRO_MODEL_LIMIT_GB}GB`);
            result.breakdown.push("1 x Power BI Free License.");
        }
        // Check if PPU is needed
        else if (needsAnyPremium || modelExceedsProLimit) {
            result.primaryLicense = 'PPU';
            result.recommendationText = "Power BI Premium Per User (PPU)";
            let currentPpuCost = input.hasE5 === 'yes' ? PPU_E5_COST : PPU_COST;
            let ppuReason = [];
            if (modelExceedsProLimit) ppuReason.push(`Model size ('${input.maxModelSize}') exceeds ${PRO_MODEL_LIMIT_GB}GB Pro limit.`);
            if (needsAnyPremium) ppuReason.push(`Selected premium features require PPU or Capacity: ${input.premiumFeatures.filter(f => !needsF64OnlyFeatures).map(getFeatureName).join(', ')}.`); // List only non-F64 features
            result.explanation.push(`PPU recommended because premium features or larger models needed, and user count (${totalUsers}) or scenario doesn't mandate Fabric Capacity.`);
            result.explanation.push(...ppuReason);
            result.keyFeatures.push(`Supports large datasets (up to ${PPU_MODEL_LIMIT_GB}GB)`, "Most Premium Features (Pipelines, XMLA, High Refresh)", "48 Refreshes/day");
            result.breakdown.push(`${totalUsers} x Power BI PPU (~$${currentPpuCost}/user/month - ${input.hasE5 === 'yes' ? 'E5 add-on cost' : 'standard cost'}).`);
            result.alternatives = `If user count grows significantly (> ${PPU_CAPACITY_THRESHOLD}-${CAPACITY_USER_THRESHOLD}), or F64+ features are needed, evaluate moving to Fabric F64+ Capacity.`;
            result.totalUserLicenseCost = totalUsers * currentPpuCost;
        }
        // Default to Pro if not Free or PPU
        else {
            result.primaryLicense = 'Pro';
            result.recommendationText = "Power BI Pro";
             let proReason = [];
             if (input.numPublishers > 0 || input.numViewers > 0) proReason.push("Sharing and collaboration required.");
             if (input.embedding === true && input.embedTarget === 'internal' && input.internalNeedsPortal === 'true') proReason.push("Embedding for internal users *with* portal access requires users to have Pro licenses.");
             if (!modelExceedsProLimit) proReason.push(`Standard model size ('${input.maxModelSize || '<1GB'}').`);
             if (!needsAnyPremium) proReason.push("Standard features sufficient.");

            result.explanation.push(`Pro licenses recommended for collaboration and standard features.`);
            result.explanation.push(...proReason);
            result.keyFeatures.push("Sharing & Collaboration", "Publish to Shared Workspaces", "Build Power BI Apps", `Model size limit ${PRO_MODEL_LIMIT_GB}GB`);
            result.breakdown.push(`${totalUsers} x Power BI Pro (~$${PRO_COST}/user/month).`);
            result.totalUserLicenseCost = totalUsers * PRO_COST;
        }
    }

     // Calculate Total Estimated Cost
     result.totalEstimatedMonthlyCost = result.totalUserLicenseCost + result.totalCapacityCost;

     // --- Final Cleanup ---
     // Remove duplicate explanations if any (simple check)
     result.explanation = [...new Set(result.explanation)];

     // Remove potentially empty "Why?" or "Features" sections in display if arrays are empty
     // (Handled in showResults function)

    // If no recommendation could be made (e.g., conflicting inputs?), provide a default message.
    if (!result.recommendationText) {
        result.recommendationText = "Unable to determine recommendation";
        result.explanation = ["Please review your selections. Some combinations might be conflicting or not directly addressed by standard licensing paths."];
        result.breakdown = [];
        result.keyFeatures = [];
        result.alternatives = "";
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

        <hr>
        <p><strong>Estimated Monthly Cost:</strong></p>
        <p style="font-size: 1.2em; font-weight: bold; color: #333;">
            ~$${recommendation.totalEstimatedMonthlyCost.toFixed(2)} / month
        </p>
        <p class="disclaimer">
            <strong>Note:</strong> This is an estimate based on your selections and assumes reserved pricing (Central US) for Fabric Capacity. It excludes variable costs like OneLake storage (typically ~$0.023/GB/month), potential future networking fees, and any A SKU usage if applicable.
        </p>

        <p class="disclaimer">${recommendation.disclaimer}</p>

        <hr>
        <p><strong>Reference Links:</strong></p>
        <ul>
            <li><a href="https://www.microsoft.com/en-us/power-platform/products/power-bi/pricing" target="_blank" rel="noopener noreferrer">Power BI Pricing</a></li>
            <li><a href="https://learn.microsoft.com/en-us/power-bi/consumer/end-user-license" target="_blank" rel="noopener noreferrer">Power BI License Types for Consumers</a></li>
            <li><a href="https://learn.microsoft.com/en-us/fabric/enterprise/licenses" target="_blank" rel="noopener noreferrer">Microsoft Fabric Licenses</a></li>
            <li><a href="https://azure.microsoft.com/en-us/pricing/details/microsoft-fabric/#overview" target="_blank" rel="noopener noreferrer">Microsoft Fabric Pricing Overview</a></li>
        </ul>
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

    // --- Info Modal & Accordion Setup ---
    const infoBtn = document.getElementById('info-btn');
    const infoModal = document.getElementById('info-modal');
    const infoClose = document.getElementById('info-close');

    if (infoBtn && infoModal && infoClose) {
        // Open modal
        infoBtn.addEventListener('click', () => {
            infoModal.style.display = 'block';
        });
        // Close modal when X clicked
        infoClose.addEventListener('click', () => {
            infoModal.style.display = 'none';
        });
        // Close modal when clicking outside content
        window.addEventListener('click', (event) => {
            if (event.target === infoModal) {
                infoModal.style.display = 'none';
            }
        });
    }

    // Accordion behaviour inside modal
    document.querySelectorAll('.accordion-header').forEach(header => {
        header.addEventListener('click', () => {
            header.classList.toggle('active');
            const body = header.nextElementSibling;
            if (body) {
                body.style.display = body.style.display === 'block' ? 'none' : 'block';
            }
        });
    });
}); 