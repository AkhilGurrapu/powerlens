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
    // !!! --- THIS IS WHERE THE MAIN DECISION LOGIC WILL GO --- !!!
    // Based on the architecture: Check embedding, user counts, features, model size etc.

    // Placeholder result
    let result = {
        recommendationText: "Calculation Pending...",
        breakdown: [],
        explanation: ["Please complete all steps."],
        keyFeatures: [],
        alternatives: "",
        disclaimer: "This calculator provides guidance based on common scenarios. Licensing terms and pricing can change. Always consult official Microsoft documentation and pricing pages for definitive information."
    };

    // --- Example Logic Snippet (Illustrative - Needs Full Implementation) ---
    // let publisherCost = input.numPublishers * PRO_COST;
    // let viewerCost = 0;
    // let capacityCost = 0;
    // let recommendedCapacity = null;

    // if (input.numViewers > CAPACITY_USER_THRESHOLD || input.premiumFeatures.includes('unlimitedSharing') || input.premiumFeatures.includes('reportServer')) {
    //     recommendedCapacity = "Fabric F64+"; // Need logic to pick specific F SKU
    //     capacityCost = F64_RESERVED_COST_APPROX;
    //     viewerCost = 0; // Viewers covered by capacity
    //     result.recommendationText = `${recommendedCapacity} + Power BI Pro`;
    //     result.explanation.push("Fabric capacity recommended due to high viewer count or specific premium features.");
    // } else if (input.premiumFeatures.length > 0 || input.maxModelSize === '10GB-100GB' || input.maxModelSize === '>100GB') {
    //     // Check PPU viability
    //     let totalUsers = input.numViewers + input.numPublishers;
    //     let ppuTotalCost = totalUsers * (input.hasE5 === 'yes' ? PPU_E5_COST : PPU_COST);
    //     // Compare ppuTotalCost with potential F sku cost if applicable
    //     // This needs more sophisticated comparison
    //     result.recommendationText = "Power BI Premium Per User (PPU)";
    //     result.explanation.push("PPU recommended for premium features with moderate user counts.");

    // } else {
    //     // Default to Pro if no capacity or PPU needs identified
    //     result.recommendationText = "Power BI Pro";
    //      viewerCost = input.numViewers * PRO_COST;
    //      result.explanation.push("Pro licenses suitable for basic sharing and collaboration under ~350 users.");
    // }

    // // Always add Pro licenses for publishers unless PPU is the overall recommendation
    // if (!result.recommendationText.includes("PPU")) {
    //     result.breakdown.push(`${input.numPublishers} x Power BI Pro (~$${PRO_COST}/user/month) for publishers.`);
    // }
    // if (recommendedCapacity) {
    //     result.breakdown.push(`1 x ${recommendedCapacity} (Reservation recommended, approx. $${capacityCost}/month)`);
    //      result.breakdown.push("Viewers: Covered by Fabric Capacity (Free license sufficient)");
    // } else if (result.recommendationText.includes("PPU")){
    //      result.breakdown.push(`${input.numViewers + input.numPublishers} x PPU (~$${input.hasE5 === 'yes' ? PPU_E5_COST : PPU_COST}/user/month)`);
    // } else {
    //      result.breakdown.push(`${input.numViewers} x Power BI Pro (~$${PRO_COST}/user/month) for viewers.`);
    // }

    // --- End Example --- 

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