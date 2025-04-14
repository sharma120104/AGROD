// Simulation related variables
let canvas = document.getElementById('simulationCanvas');
let ctx = canvas.getContext('2d');
let simulationActive = false;
let fieldGrid = [];
let gridSize = 10; // 10x10 grid
let cellSize = canvas.width / gridSize;
let hotspots = [];
let dronePosition = { x: Math.floor(gridSize / 2), y: Math.floor(gridSize / 2) };
let sprayAnimation = false;
let sprayRadius = 0;
let sprayFrames = 0;
let spraying = false;
let pesticide = '';

// DOM elements for control buttons
const moveUpBtn = document.getElementById('moveUp');
const moveDownBtn = document.getElementById('moveDown');
const moveLeftBtn = document.getElementById('moveLeft');
const moveRightBtn = document.getElementById('moveRight');
const sprayBtn = document.getElementById('spray');

// Event listeners for drone controls
document.addEventListener('DOMContentLoaded', function() {
    moveUpBtn.addEventListener('click', () => moveDrone(0, -1));
    moveDownBtn.addEventListener('click', () => moveDrone(0, 1));
    moveLeftBtn.addEventListener('click', () => moveDrone(-1, 0));
    moveRightBtn.addEventListener('click', () => moveDrone(1, 0));
    sprayBtn.addEventListener('click', sprayPesticide);
    
    // Keyboard controls
    document.addEventListener('keydown', handleKeyboardControls);
    
    // Initialize canvas
    drawField();
});

// Initialize field with data from disease detection
function initializeField(data) {
    if (!data) return;
    
    fieldGrid = data.grid;
    hotspots = data.hotspots;
    
    // Reset drone to center
    dronePosition = { x: Math.floor(gridSize / 2), y: Math.floor(gridSize / 2) };
    
    // Draw the initial field
    drawField();
}

// Start simulation
function startSimulation() {
    simulationActive = true;
    animate();
}

// Stop simulation
function stopSimulation() {
    simulationActive = false;
}

// Animation loop
function animate() {
    if (!simulationActive) return;
    
    drawField();
    
    // If spraying animation is active, continue animation
    if (sprayAnimation) {
        animateSpray();
    }
    
    requestAnimationFrame(animate);
}

// Draw the field
function drawField() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            // Alternating green checkerboard pattern
            if ((x + y) % 2 === 0) {
                ctx.fillStyle = '#4CAF50'; // Darker green
            } else {
                ctx.fillStyle = '#8BC34A'; // Lighter green
            }
            
            ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
            
            // Draw grid lines
            ctx.strokeStyle = '#2E7D32';
            ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
    }
    
    // Draw hotspots (disease areas)
    hotspots.forEach(hotspot => {
        // Yellow circle indicating disease
        ctx.beginPath();
        ctx.arc(
            hotspot.x * cellSize + cellSize / 2,
            hotspot.y * cellSize + cellSize / 2,
            cellSize / 3,
            0,
            Math.PI * 2
        );
        ctx.fillStyle = 'rgba(255, 255, 0, 0.7)';
        ctx.fill();
        ctx.strokeStyle = '#FFA000';
        ctx.lineWidth = 2;
        ctx.stroke();
    });
    
    // Draw drone
    drawDrone(dronePosition.x, dronePosition.y);
}

// Draw the drone
function drawDrone(x, y) {
    const centerX = x * cellSize + cellSize / 2;
    const centerY = y * cellSize + cellSize / 2;
    const droneSize = cellSize * 0.7;
    
    // Drone body (circle)
    ctx.beginPath();
    ctx.arc(centerX, centerY, droneSize / 3, 0, Math.PI * 2);
    ctx.fillStyle = '#303F9F';
    ctx.fill();
    ctx.strokeStyle = '#1A237E';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Drone arms
    const armLength = droneSize / 2;
    
    // Draw arms in four directions
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 2) {
        const armEndX = centerX + Math.cos(angle) * armLength;
        const armEndY = centerY + Math.sin(angle) * armLength;
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(armEndX, armEndY);
        ctx.strokeStyle = '#90A4AE';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Drone propellers
        ctx.beginPath();
        ctx.arc(armEndX, armEndY, droneSize / 8, 0, Math.PI * 2);
        ctx.fillStyle = '#CFD8DC';
        ctx.fill();
        ctx.strokeStyle = '#607D8B';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
}

// Move the drone
function moveDrone(dx, dy) {
    if (!simulationActive) return;
    
    const newX = dronePosition.x + dx;
    const newY = dronePosition.y + dy;
    
    // Check boundaries
    if (newX >= 0 && newX < gridSize && newY >= 0 && newY < gridSize) {
        dronePosition.x = newX;
        dronePosition.y = newY;
    }
}

// Spray pesticide
function sprayPesticide() {
    if (!simulationActive) return;
    
    // Get selected pesticide
    pesticide = document.getElementById('pesticideSelect').value;
    
    if (!pesticide) {
        showAlert('Please select a pesticide first', 'warning');
        return;
    }
    
    // Start spray animation
    sprayAnimation = true;
    sprayRadius = 0;
    sprayFrames = 0;
    spraying = true;
    
    // Check if drone is over a hotspot
    const hotspot = hotspots.find(h => h.x === dronePosition.x && h.y === dronePosition.y);
    if (hotspot) {
        // Remove hotspot (treat the disease)
        hotspots = hotspots.filter(h => h.x !== dronePosition.x || h.y !== dronePosition.y);
        showAlert(`Successfully sprayed ${formatPesticideName(pesticide)} on diseased area!`, 'success');
    }
}

// Animate spray effect
function animateSpray() {
    if (!sprayAnimation) return;
    
    const centerX = dronePosition.x * cellSize + cellSize / 2;
    const centerY = dronePosition.y * cellSize + cellSize / 2;
    
    // Draw spray circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, sprayRadius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 200, 200, 0.3)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 150, 150, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Increase radius
    sprayRadius += 2;
    sprayFrames++;
    
    // End animation after certain frames
    if (sprayFrames > 20) {
        sprayAnimation = false;
        spraying = false;
    }
}

// Handle keyboard controls
function handleKeyboardControls(e) {
    if (!simulationActive) return;
    
    switch (e.key) {
        case 'ArrowUp':
            moveDrone(0, -1);
            e.preventDefault();
            break;
        case 'ArrowDown':
            moveDrone(0, 1);
            e.preventDefault();
            break;
        case 'ArrowLeft':
            moveDrone(-1, 0);
            e.preventDefault();
            break;
        case 'ArrowRight':
            moveDrone(1, 0);
            e.preventDefault();
            break;
        case ' ': // Space bar
            sprayPesticide();
            e.preventDefault();
            break;
    }
}

// Format pesticide name for display
function formatPesticideName(code) {
    if (!code) return 'Unknown Pesticide';
    
    // Convert snake_case to Title Case
    return code
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}
