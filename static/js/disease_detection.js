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

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Image Upload Preview
    imageUploadInput.addEventListener('change', handleImageUpload);
    
    // Analyze Button
    analyzeBtn.addEventListener('click', analyzeImage);
    
    // Simulation Toggle
    simulationToggle.addEventListener('change', toggleSimulation);
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
    diseaseInfo.classList.add('d-none');
    noDetectionInfo.classList.remove('d-none');
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
        // Hide loading indicator
        loadingIndicator.classList.add('d-none');
        analyzeBtn.disabled = false;
        
        // Process results
        processDetectionResults(data);
    })
    .catch(error => {
        console.error('Error:', error);
        loadingIndicator.classList.add('d-none');
        analyzeBtn.disabled = false;
        showAlert('Error analyzing image: ' + error.message, 'danger');
    });
}

// Process detection results
function processDetectionResults(data) {
    detectedDiseases = data.diseases;
    fieldData = data.field_data;
    
    // Update disease information
    diseaseInfo.classList.remove('d-none');
    noDetectionInfo.classList.add('d-none');
    
    // Check if any disease was detected
    if (detectedDiseases.includes('healthy')) {
        diseaseName.textContent = 'No Disease Detected';
        diseaseDescription.textContent = 'Your crop appears to be healthy.';
        pesticideList.innerHTML = '<li class="list-group-item">No pesticides needed at this time.</li>';
    } else if (detectedDiseases.includes('error')) {
        diseaseName.textContent = 'Detection Error';
        diseaseDescription.textContent = 'There was an error processing your image. Please try again with a clearer image.';
        pesticideList.innerHTML = '<li class="list-group-item">Unable to provide recommendations.</li>';
    } else {
        // Display disease information
        const diseaseInfo = data.disease_info[0]; // For simplicity, just show the first disease
        diseaseName.textContent = diseaseInfo.name;
        diseaseDescription.textContent = diseaseInfo.description;
        
        // Update pesticide list
        pesticideList.innerHTML = '';
        if (diseaseInfo.recommended_pesticides && diseaseInfo.recommended_pesticides.length > 0) {
            diseaseInfo.recommended_pesticides.forEach(pesticide => {
                const item = document.createElement('li');
                item.className = 'list-group-item';
                item.innerHTML = `<strong>${pesticide.name}</strong>: ${pesticide.description}`;
                pesticideList.appendChild(item);
            });
            
            // Update pesticide dropdown for simulation
            updatePesticideDropdown(diseaseInfo.recommended_pesticides);
        } else {
            pesticideList.innerHTML = '<li class="list-group-item">No specific pesticides recommended.</li>';
        }
    }
    
    // Enable simulation if diseases were detected
    if (!detectedDiseases.includes('healthy') && !detectedDiseases.includes('error')) {
        simulationToggle.disabled = false;
    } else {
        simulationToggle.disabled = true;
    }
    
    // Initialize field for simulation
    if (typeof initializeField === 'function') {
        initializeField(fieldData);
    }
}

// Update pesticide dropdown
function updatePesticideDropdown(pesticides) {
    pesticideSelect.innerHTML = '<option value="">Select pesticide...</option>';
    
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
