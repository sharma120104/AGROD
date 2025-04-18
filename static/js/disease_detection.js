// Global variables
let uploadedImage = null;
let detectedDiseases = [];
let fieldData = null;

// DOM Elements
const cropTypeSelect = document.getElementById('cropType');
const imageUploadInput = document.getElementById('imageUpload');
const previewImage = document.getElementById('previewImage');
const analyzeBtn = document.getElementById('analyzeBtn');
const loadingIndicator = document.getElementById('loadingIndicator');
const diseaseInfo = document.getElementById('diseaseInfo');
const noDetectionInfo = document.getElementById('noDetectionInfo');
const diseaseName = document.getElementById('diseaseName');
const diseaseDescription = document.getElementById('diseaseDescription');
const pesticideList = document.getElementById('pesticideList');
const simulationToggle = document.getElementById('simulationToggle');
const droneControls = document.getElementById('droneControls');
const noSimulationInfo = document.getElementById('noSimulationInfo');
const pesticideSelect = document.getElementById('pesticideSelect');
const hintButton = document.getElementById('hintButton');

// Hint system
const hints = {
    upload: "Try uploading a photo of your crop. Photos with good lighting will provide better results.",
    cropType: "Make sure to select the right crop type before analysis.",
    analysis: "After analysis, you'll see potential diseases with confidence scores.",
    coconutMaturity: "For coconut trees, the system will analyze maturity level, count coconuts, and indicate harvest readiness.",
    simulation: "Activate the AGROD simulation to practice applying pesticides or inspect coconut trees.",
    droneControls: "Use arrow keys or buttons to move the AGROD over the field.",
    pesticide: "Select an appropriate pesticide before spraying.",
    spray: "Position the AGROD over a yellow disease spot and click spray.",
    inspectionTool: "Select an inspection tool to analyze coconut tree maturity and harvest readiness.",
    coconutInspection: "Move the AGROD to each coconut tree and press the inspection button to check its maturity level.",
    maturityLevels: "Tree maturity is shown with colors: blue (immature), orange (mature), green (ready for harvest).",
    coconutCount: "The analysis provides the estimated number of coconuts on each tree."
};

// Track user progress
let userProgress = {
    uploadedImage: false,
    ranAnalysis: false,
    activatedSimulation: false,
    selectedPesticide: false,
    movedDrone: false,
    sprayedPesticide: false
};

// Current hint index
let currentHintIndex = 0;

// Alert function used by both disease_detection.js and simulation.js
function showAlert(message, type = 'info') {
    // Create alert element
    const alertElement = document.createElement('div');
    alertElement.className = `alert alert-${type} alert-dismissible fade show`;
    alertElement.setAttribute('role', 'alert');
    
    // Alert content
    alertElement.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Find alert container
    const alertContainer = document.getElementById('alertContainer');
    if (!alertContainer) {
        // Create container if it doesn't exist
        const container = document.createElement('div');
        container.id = 'alertContainer';
        container.className = 'position-fixed bottom-0 end-0 p-3';
        container.style.zIndex = '5';
        document.body.appendChild(container);
        container.appendChild(alertElement);
    } else {
        // Add to existing container
        alertContainer.appendChild(alertElement);
    }
    
    // Auto dismiss after 3 seconds
    setTimeout(() => {
        alertElement.classList.remove('show');
        setTimeout(() => {
            alertElement.remove();
        }, 150);
    }, 3000);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Image Upload Preview
    imageUploadInput.addEventListener('change', handleImageUpload);
    
    // Analyze Button
    analyzeBtn.addEventListener('click', analyzeImage);
    
    // Simulation Toggle
    simulationToggle.addEventListener('change', toggleSimulation);
    
    // Hint Button
    if (hintButton) {
        hintButton.addEventListener('click', showNextHint);
        
        // Initialize tooltips
        const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        tooltips.forEach(tooltip => {
            new bootstrap.Tooltip(tooltip);
        });
    }
});

// Handle image upload and preview
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        uploadedImage = e.target.result;
        previewImage.src = uploadedImage;
        previewImage.classList.remove('d-none');
        
        // Reset detection state
        resetDetectionState();
    };
    reader.readAsDataURL(file);
}

// Reset detection state
function resetDetectionState() {
    // Get the panel body
    const panelBody = document.querySelector('.middle-panel .panel-body');
    if (panelBody) {
        // Clear any disease info and show the "no detection" message
        panelBody.innerHTML = `
            <div id="noDetectionInfo" class="text-center py-5">
                <i class="fas fa-seedling text-success fa-4x mb-3"></i>
                <h5>No Analysis Yet</h5>
                <p class="text-muted">Upload and analyze a field image to get disease information.</p>
            </div>
        `;
    }
    
    // Make sure loading indicator and text are hidden
    loadingIndicator.classList.add('d-none');
    document.getElementById('loadingText').classList.add('d-none');
    
    // Reset simulation state
    simulationToggle.checked = false;
    simulationToggle.disabled = true;
    droneControls.classList.add('d-none');
    noSimulationInfo.classList.remove('d-none');
    detectedDiseases = [];
    fieldData = null;
}

// Analyze the uploaded image
function analyzeImage() {
    if (!uploadedImage) {
        showAlert('Please upload an image first', 'warning');
        return;
    }
    
    // Show loading indicator
    loadingIndicator.classList.remove('d-none');
    // Show the loading text only when actually analyzing
    document.getElementById('loadingText').classList.remove('d-none');
    analyzeBtn.disabled = true;
    
    // Prepare data
    const cropType = cropTypeSelect.value;
    const data = {
        image: uploadedImage,
        cropType: cropType
    };
    
    // Send request to backend
    fetch('/detect', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        // Hide loading indicator and text
        loadingIndicator.classList.add('d-none');
        document.getElementById('loadingText').classList.add('d-none');
        analyzeBtn.disabled = false;
        
        // Process results
        processDetectionResults(data);
    })
    .catch(error => {
        console.error('Error:', error);
        // Hide loading indicator and text
        loadingIndicator.classList.add('d-none');
        document.getElementById('loadingText').classList.add('d-none');
        analyzeBtn.disabled = false;
        showAlert('Error analyzing image: ' + error.message, 'danger');
    });
}

// Process detection results
function processDetectionResults(data) {
    detectedDiseases = data.diseases || [];
    fieldData = data.field_data || null;
    
    // Create a new disease info container
    const newDiseaseInfo = document.createElement('div');
    newDiseaseInfo.id = 'diseaseInfo';
    
    // Hide the "no detection" message
    noDetectionInfo.classList.add('d-none');
    
    // Create the detection results header
    const detectionHeader = document.createElement('div');
    detectionHeader.className = 'detection-results-header';
    detectionHeader.innerHTML = '<h6>Disease Detection Results</h6>';
    newDiseaseInfo.appendChild(detectionHeader);

    // Check if any disease was detected
    if (detectedDiseases.includes('healthy')) {
        const healthySection = document.createElement('div');
        healthySection.className = 'disease-section';
        healthySection.innerHTML = `
            <div class="disease-header">
                <h6>No Disease Detected</h6>
                <span class="match-badge">100% Match</span>
            </div>
            <p>Your crop appears to be healthy.</p>
            <div class="my-2">
                <span>Severity:</span> <span class="severity-badge">None</span>
            </div>
        `;
        newDiseaseInfo.appendChild(healthySection);
        
        const treatmentHeader = document.createElement('h6');
        treatmentHeader.textContent = 'Recommended Treatments:';
        newDiseaseInfo.appendChild(treatmentHeader);
        
        const treatmentList = document.createElement('div');
        treatmentList.id = 'pesticideList';
        treatmentList.innerHTML = '<div class="treatment-card"><h6>No Treatment Needed</h6><p>Your plants appear healthy. Continue regular monitoring.</p></div>';
        newDiseaseInfo.appendChild(treatmentList);
    } else if (detectedDiseases.includes('error')) {
        const errorSection = document.createElement('div');
        errorSection.className = 'disease-section';
        errorSection.innerHTML = `
            <div class="disease-header">
                <h6>Detection Error</h6>
            </div>
            <p>There was an error processing your image. Please try again with a clearer image.</p>
        `;
        newDiseaseInfo.appendChild(errorSection);
        
        const treatmentHeader = document.createElement('h6');
        treatmentHeader.textContent = 'Recommended Treatments:';
        newDiseaseInfo.appendChild(treatmentHeader);
        
        const treatmentList = document.createElement('div');
        treatmentList.id = 'pesticideList';
        treatmentList.innerHTML = '<div class="treatment-card"><h6>Unable to provide recommendations</h6><p>Please try again with a different image.</p></div>';
        newDiseaseInfo.appendChild(treatmentList);
    } else {
        // Create a div to hold disease information
        const diseaseResultsContainer = document.createElement('div');
        
        // Sort disease info by confidence (highest first)
        const sortedDiseaseInfo = [...data.disease_info].sort((a, b) => b.confidence - a.confidence);
        
        // Display multiple disease information
        sortedDiseaseInfo.forEach((diseaseData, index) => {
            const diseaseCard = document.createElement('div');
            diseaseCard.className = index > 0 ? 'mt-4 pt-3 border-top' : '';
            
            // Create disease header with confidence score
            const header = document.createElement('div');
            header.className = 'd-flex justify-content-between align-items-center mb-2';
            
            const nameElement = document.createElement('h5');
            nameElement.className = 'mb-0';
            nameElement.textContent = diseaseData.name;
            
            const confidenceBadge = document.createElement('span');
            confidenceBadge.className = 'badge bg-primary';
            confidenceBadge.textContent = `${Math.round(diseaseData.confidence)}% Match`;
            
            header.appendChild(nameElement);
            header.appendChild(confidenceBadge);
            diseaseCard.appendChild(header);
            
            // Description
            const description = document.createElement('p');
            description.className = 'mb-3';
            description.textContent = diseaseData.description;
            diseaseCard.appendChild(description);
            
            // Check if this is coconut maturity analysis
            if (diseaseData.maturity_data) {
                const maturityData = diseaseData.maturity_data;
                
                // Create maturity info box
                const maturityBox = document.createElement('div');
                maturityBox.className = 'card bg-dark mb-3';
                
                // Create card header
                const maturityHeader = document.createElement('div');
                maturityHeader.className = 'card-header py-2';
                maturityHeader.innerHTML = '<strong>Maturity Analysis</strong>';
                maturityBox.appendChild(maturityHeader);
                
                // Create card body
                const maturityBody = document.createElement('div');
                maturityBody.className = 'card-body';
                
                // Format maturity level with appropriate badge
                let maturityBadgeClass = 'bg-secondary';
                if (maturityData.maturity_level === 'immature') {
                    maturityBadgeClass = 'bg-info';
                } else if (maturityData.maturity_level === 'mature') {
                    maturityBadgeClass = 'bg-warning';
                } else if (maturityData.maturity_level === 'ready_for_harvest') {
                    maturityBadgeClass = 'bg-success';
                }
                
                // Create maturity info
                const maturityInfo = document.createElement('div');
                maturityInfo.className = 'mb-2';
                maturityInfo.innerHTML = `
                    <p class="mb-2"><strong>Maturity Level:</strong> 
                    <span class="badge ${maturityBadgeClass}">${maturityData.maturity_level.replace(/_/g, ' ').toUpperCase()}</span></p>
                    <p class="mb-2"><strong>Coconut Count:</strong> ${maturityData.coconut_count}</p>
                    <p class="mb-0"><strong>Harvest Status:</strong> 
                    ${maturityData.harvest_ready 
                        ? '<span class="badge bg-success">READY FOR HARVEST</span>' 
                        : '<span class="badge bg-warning">NOT READY</span>'}
                    </p>
                `;
                maturityBody.appendChild(maturityInfo);
                maturityBox.appendChild(maturityBody);
                
                // Add maturity box to disease card
                diseaseCard.appendChild(maturityBox);
            }
            
            // Severity if available
            if (diseaseData.severity) {
                const severity = document.createElement('p');
                severity.className = 'mb-2';
                severity.innerHTML = `<strong>Severity:</strong> ${diseaseData.severity.charAt(0).toUpperCase() + diseaseData.severity.slice(1)}`;
                diseaseCard.appendChild(severity);
            }
            
            // Add pesticide recommendations
            const pesticidesHeader = document.createElement('h6');
            pesticidesHeader.className = 'mt-3 mb-2';
            pesticidesHeader.textContent = 'Recommended Treatments:';
            diseaseCard.appendChild(pesticidesHeader);
            
            const pesticidesContainer = document.createElement('ul');
            pesticidesContainer.className = 'list-group mb-0';
            
            if (diseaseData.recommended_pesticides && diseaseData.recommended_pesticides.length > 0) {
                diseaseData.recommended_pesticides.forEach(pesticide => {
                    const item = document.createElement('li');
                    item.className = 'list-group-item';
                    
                    let pesticideDetails = `<strong>${pesticide.name}</strong>: ${pesticide.description}`;
                    
                    // Add application rate if available
                    if (pesticide.application_rate) {
                        pesticideDetails += `<br><small class="text-muted">Application Rate: ${pesticide.application_rate}</small>`;
                    }
                    
                    // Add eco-friendly indicator if available
                    if (pesticide.eco_friendly !== undefined) {
                        const ecoIcon = pesticide.eco_friendly 
                            ? '<span class="badge bg-success ms-2"><i class="fas fa-leaf"></i> Eco-friendly</span>'
                            : '<span class="badge bg-warning ms-2"><i class="fas fa-exclamation-triangle"></i> Conventional</span>';
                        pesticideDetails += ecoIcon;
                    }
                    
                    item.innerHTML = pesticideDetails;
                    pesticidesContainer.appendChild(item);
                });
            } else {
                const item = document.createElement('li');
                item.className = 'list-group-item';
                item.textContent = 'No specific treatments recommended.';
                pesticidesContainer.appendChild(item);
            }
            
            diseaseCard.appendChild(pesticidesContainer);
            diseaseResultsContainer.appendChild(diseaseCard);
        });
        
        // Update the header text
        detectionHeader.innerHTML = '<h6>Disease Detection Results</h6><p>' + 
            (data.multiple_detections 
                ? 'Multiple potential diseases detected. Ordered by match confidence.' 
                : 'Single disease detected.') + '</p>';
        
        // Add the disease container to the new disease info
        newDiseaseInfo.appendChild(diseaseResultsContainer);
        
        // Update pesticide dropdown for simulation
        // Combine all pesticides from all detected diseases
        const allPesticides = [];
        data.disease_info.forEach(diseaseData => {
            if (diseaseData.recommended_pesticides && diseaseData.recommended_pesticides.length > 0) {
                allPesticides.push(...diseaseData.recommended_pesticides);
            }
        });
        
        // Update the dropdown with unique pesticides
        updatePesticideDropdown(allPesticides);
    }
    
    // Enable simulation if diseases were detected or if maturity analysis is available
    const hasMaturityAnalysis = detectedDiseases.includes('coconut_maturity_analysis');
    const hasDisease = !detectedDiseases.includes('healthy') && !detectedDiseases.includes('error');
    
    if (hasDisease || hasMaturityAnalysis) {
        simulationToggle.disabled = false;
        
        // Update the simulation description based on the type of analysis
        if (hasMaturityAnalysis) {
            document.getElementById('simulationDescription').textContent = 
                'Activate drone simulation to inspect coconut trees and view their maturity levels';
            document.getElementById('simulationTitle').textContent = 'Coconut Tree Analysis';
        } else {
            document.getElementById('simulationDescription').textContent = 
                'Activate drone simulation to practice applying pesticides to diseased areas';
            document.getElementById('simulationTitle').textContent = 'Disease Treatment Simulation';
        }
    } else {
        simulationToggle.disabled = true;
    }
    
    // Initialize field for simulation
    if (typeof initializeField === 'function') {
        initializeField(fieldData);
    }
    
    // Show hint button
    const hintButton = document.getElementById('hintButton');
    if (hintButton) {
        hintButton.classList.remove('d-none');
    }
    
    // Get the panel body
    const panelBody = document.querySelector('.middle-panel .panel-body');
    if (panelBody) {
        // Clear old content
        panelBody.innerHTML = '';
        // Add the new content
        panelBody.appendChild(newDiseaseInfo);
    }
}

// Update pesticide dropdown
function updatePesticideDropdown(pesticides) {
    // Check if this is a coconut maturity analysis
    const hasMaturityAnalysis = detectedDiseases.includes('coconut_maturity_analysis');
    
    if (hasMaturityAnalysis) {
        // For coconut maturity analysis, the dropdown is for analysis tools instead of pesticides
        pesticideSelect.innerHTML = '<option value="">Select inspection tool...</option>';
        
        // Add inspection tools
        const inspectionTools = [
            { value: 'visual_scanner', name: 'Visual Maturity Scanner' },
            { value: 'coconut_counter', name: 'Coconut Counter Tool' },
            { value: 'harvest_analyzer', name: 'Harvest Readiness Analyzer' }
        ];
        
        inspectionTools.forEach(tool => {
            const option = document.createElement('option');
            option.value = tool.value;
            option.textContent = tool.name;
            pesticideSelect.appendChild(option);
        });
        
        // Update label for the dropdown
        document.querySelector('label[for="pesticideSelect"]').textContent = 'Inspection Tool:';
        
        // Update spray button to show "Inspect" instead when in coconut analysis mode
        const sprayButton = document.getElementById('spray');
        if (sprayButton) {
            sprayButton.innerHTML = '<i class="fas fa-search me-1"></i> Inspect';
            sprayButton.classList.remove('btn-danger');
            sprayButton.classList.add('btn-info');
        }
    } else {
        // Regular pesticide dropdown for disease treatment
        pesticideSelect.innerHTML = '<option value="">Select pesticide...</option>';
        
        // Update label for the dropdown
        document.querySelector('label[for="pesticideSelect"]').textContent = 'Pesticide:';
        
        if (pesticides && pesticides.length > 0) {
            pesticides.forEach((pesticide, index) => {
                const option = document.createElement('option');
                option.value = pesticide.name.toLowerCase().replace(/\s+/g, '_');
                option.textContent = pesticide.name;
                pesticideSelect.appendChild(option);
            });
        } else {
            const option = document.createElement('option');
            option.value = 'generic';
            option.textContent = 'Generic Pesticide';
            pesticideSelect.appendChild(option);
        }
    }
}

// Toggle simulation
function toggleSimulation(event) {
    if (event.target.checked) {
        droneControls.classList.remove('d-none');
        noSimulationInfo.classList.add('d-none');
        
        // Start simulation
        if (typeof startSimulation === 'function') {
            startSimulation();
        }
    } else {
        droneControls.classList.add('d-none');
        noSimulationInfo.classList.remove('d-none');
        
        // Stop simulation
        if (typeof stopSimulation === 'function') {
            stopSimulation();
        }
    }
}

// Show next hint based on user's progress
function showNextHint() {
    let hintMessage = '';
    
    // Update user progress
    userProgress.uploadedImage = previewImage.classList.contains('d-none') === false;
    userProgress.ranAnalysis = diseaseInfo.classList.contains('d-none') === false;
    userProgress.activatedSimulation = simulationToggle.checked;
    userProgress.selectedPesticide = pesticideSelect.value !== '';
    
    // Get current crop type
    const cropType = cropTypeSelect.value;
    
    // Determine appropriate hint based on progress
    if (!userProgress.uploadedImage) {
        hintMessage = hints.upload;
    } else if (!userProgress.ranAnalysis) {
        hintMessage = hints.analysis + ' ' + hints.cropType;
        
        // Add coconut maturity hint if coconut is selected
        if (cropType === 'coconut') {
            hintMessage += ' ' + hints.coconutMaturity;
        }
    } else if (!userProgress.activatedSimulation && (!detectedDiseases.includes('healthy') || detectedDiseases.includes('coconut_maturity_analysis'))) {
        hintMessage = hints.simulation;
    } else if (userProgress.activatedSimulation && !userProgress.selectedPesticide) {
        // Different hints based on analysis type
        if (detectedDiseases.includes('coconut_maturity_analysis')) {
            hintMessage = hints.inspectionTool;
        } else {
            hintMessage = hints.pesticide;
        }
    } else if (userProgress.activatedSimulation && userProgress.selectedPesticide) {
        // Different hints based on analysis type
        if (detectedDiseases.includes('coconut_maturity_analysis')) {
            const randomMaturityHint = Math.random() < 0.5 ? hints.coconutInspection : hints.maturityLevels;
            hintMessage = hints.droneControls + ' ' + randomMaturityHint;
        } else {
            hintMessage = hints.droneControls + ' ' + hints.spray;
        }
    } else {
        // Cycle through general hints
        const hintKeys = Object.keys(hints);
        const randomHint = hintKeys[Math.floor(Math.random() * hintKeys.length)];
        hintMessage = hints[randomHint];
    }
    
    // Show the hint as an alert
    showAlert(hintMessage, 'info');
    
    // Update hint button tooltip
    const hintButton = document.getElementById('hintButton');
    if (hintButton) {
        const tooltip = bootstrap.Tooltip.getInstance(hintButton);
        if (tooltip) {
            tooltip.dispose();
        }
        hintButton.setAttribute('data-bs-original-title', 'Click for another hint');
        new bootstrap.Tooltip(hintButton);
    }
}

// Show alert message
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Insert at top of page
    document.querySelector('.container').prepend(alertDiv);
    
    // Auto dismiss after 5 seconds
    setTimeout(() => {
        alertDiv.classList.remove('show');
        setTimeout(() => alertDiv.remove(), 150);
    }, 5000);
}
