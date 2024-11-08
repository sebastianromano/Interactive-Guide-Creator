// Existing imports
import { VideoRecorder } from './videoRecorder.js';

// Existing global variables
let currentMode = 'edit';
let points = [];
let isPlaying = false;
let currentPointIndex = 0;
let animationFrame;
let videoRecorder;

// DOM elements
const imageContainer = document.getElementById('imageContainer');
const uploadPrompt = document.getElementById('uploadPrompt');
const fileInput = document.getElementById('fileInput');
const pointList = document.getElementById('pointList');
const description = document.getElementById('description');
const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');

// Initialize everything after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize video recorder
    const rightPanel = document.querySelector('.right-panel');
    videoRecorder = new VideoRecorder(rightPanel);

    // Mode selection
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentMode = btn.dataset.mode;
            if (currentMode === 'view') {
                startButton.disabled = false;
            } else {
                stopPresentation();
                startButton.disabled = true;
            }
        });
    });

    // File upload handling
    uploadPrompt.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);

    imageContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadPrompt.style.borderColor = '#4CAF50';
    });

    imageContainer.addEventListener('dragleave', () => {
        uploadPrompt.style.borderColor = '#ccc';
    });

    imageContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadPrompt.style.borderColor = '#ccc';
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            handleFile(file);
        }
    });

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        handleFile(file);
    }
}

function handleFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        uploadPrompt.style.display = 'none';
        const img = new Image();
        img.src = e.target.result;
        img.id = 'uploadedImage';
        imageContainer.appendChild(img);

        // Enable click handling for points
        imageContainer.addEventListener('click', handleImageClick);
    };
    reader.readAsDataURL(file);
}

function handleImageClick(e) {
    if (currentMode !== 'edit') return;

    const rect = imageContainer.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / imageContainer.offsetWidth) * 100;
    const y = ((e.clientY - rect.top) / imageContainer.offsetHeight) * 100;

    // Create point marker
    const point = document.createElement('div');
    point.className = 'point';
    point.style.left = x + '%';
    point.style.top = y + '%';
    imageContainer.appendChild(point);

    // Create point entry in list
    const pointEntry = {
        x,
        y,
        element: point,
        description: ''
    };
    points.push(pointEntry);

    updatePointList();
}

function updatePointList() {
    pointList.innerHTML = '';
    points.forEach((point, index) => {
        const item = document.createElement('div');
        item.className = 'point-item';

        const textarea = document.createElement('textarea');
        textarea.value = point.description;
        textarea.placeholder = `Description for point ${index + 1}`;
        textarea.rows = 3;
        textarea.addEventListener('input', (e) => {
            point.description = e.target.value;
        });

        item.appendChild(textarea);
        pointList.appendChild(item);
    });
}

    startButton.addEventListener('click', startPresentation);
    stopButton.addEventListener('click', stopPresentation);
});

// Modified startPresentation function
function startPresentation() {
    if (points.length === 0) return;

    isPlaying = true;
    startButton.disabled = true;
    stopButton.disabled = false;
    currentPointIndex = 0;

    // If recording is active, use the video recorder's draw frame
    if (videoRecorder && videoRecorder.isRecording) {
        const img = document.getElementById('uploadedImage');
        videoRecorder.drawFrame(img, points, currentPointIndex);
    }

    animateToNextPoint();
}

function stopPresentation() {
    isPlaying = false;
    startButton.disabled = false;
    stopButton.disabled = true;
    description.style.opacity = '0';

    // Reset zoom
    const img = document.getElementById('uploadedImage');
    img.style.transform = 'scale(1)';
    img.style.transformOrigin = 'center';

    cancelAnimationFrame(animationFrame);
}

function animateToNextPoint() {
    if (!isPlaying) return;

    const point = points[currentPointIndex];
    const img = document.getElementById('uploadedImage');

    // Show description with typewriter effect
    description.style.opacity = '1';
    typeWriter(point.description, description);

    // Animate zoom
    img.style.transform = 'scale(2)';
    img.style.transformOrigin = `${point.x}% ${point.y}%`;
    img.style.transition = 'transform 1s ease-in-out';

    // Wait and zoom out
    setTimeout(() => {
        if (!isPlaying) return;

        img.style.transform = 'scale(1)';

        // Move to next point
        setTimeout(() => {
            if (!isPlaying) return;

            currentPointIndex = (currentPointIndex + 1) % points.length;
            if (currentPointIndex === 0) {
                // Optional pause at the end of the cycle
                setTimeout(() => {
                    if (isPlaying) animateToNextPoint();
                }, 1000);
            } else {
                animateToNextPoint();
            }
        }, 3000); // Wait before zooming out
    }, 4000); // Time to show zoomed point
}

function typeWriter(text, element) {
    let i = 0;
    element.textContent = '';

    function type() {
        if (i < text.length && isPlaying) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(type, 50);
        }
    }

    type();
}
