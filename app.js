// Global state
let currentMode = 'edit';
let points = [];
let isPlaying = false;
let currentPointIndex = 0;
let animationFrame;

// DOM elements
const imageContainer = document.getElementById('imageContainer');
const uploadPrompt = document.getElementById('uploadPrompt');
const fileInput = document.getElementById('fileInput');
const pointList = document.getElementById('pointList');
const description = document.getElementById('description');
const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');

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

function startPresentation() {
    if (points.length === 0) return;

    isPlaying = true;
    startButton.disabled = true;
    stopButton.disabled = false;
    currentPointIndex = 0;

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

// Video recording functionality
let mediaRecorder;
let recordedChunks = [];
let currentScale = 1;
let currentOriginX = 50;
let currentOriginY = 50;

// Create a canvas element for recording
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

// Quality settings panel
const qualityPanel = document.createElement('div');
qualityPanel.className = 'quality-settings';
qualityPanel.innerHTML = `
    <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
        <h3 style="margin-bottom: 10px;">Video Quality Settings</h3>
        <select id="qualitySelect" class="quality-select" style="width: 100%; padding: 8px; margin-bottom: 10px; border-radius: 4px; border: 1px solid #ddd;">
            <option value="1080">1080p (1920x1080)</option>
            <option value="1440">1440p (2560x1440)</option>
            <option value="2160">4K (3840x2160)</option>
        </select>
        <div style="font-size: 12px; color: #666;">Higher quality will result in larger file sizes</div>
    </div>
`;

// Add quality settings to right panel
document.querySelector('.right-panel').insertBefore(qualityPanel, document.querySelector('#pointList'));

function getQualitySettings() {
    const quality = document.getElementById('qualitySelect').value;
    switch (quality) {
        case '2160':
            return { width: 3840, height: 2160 };
        case '1440':
            return { width: 2560, height: 1440 };
        default:
            return { width: 1920, height: 1080 };
    }
}

function setupRecording() {
    const quality = getQualitySettings();
    canvas.width = quality.width;
    canvas.height = quality.height;

    // Setup MediaRecorder with high bitrate for better quality
    const stream = canvas.captureStream(60); // Increased to 60 FPS
    mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 8000000 // 8 Mbps for better quality
    });

    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.onstop = handleStop;
}

function handleDataAvailable(event) {
    if (event.data.size > 0) {
        recordedChunks.push(event.data);
    }
}

function handleStop() {
    const blob = new Blob(recordedChunks, {
        type: 'video/webm'
    });
    recordedChunks = [];

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    document.body.appendChild(a);
    a.style.display = 'none';
    a.href = url;
    a.download = 'presentation.webm';
    a.click();

    setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 100);
}

// Animation timing function
function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

// Animate zoom for recording
async function animateZoom(startScale, endScale, startX, endX, startY, endY, duration) {
    const startTime = Date.now();

    return new Promise(resolve => {
        function update() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = easeInOutQuad(progress);

            currentScale = startScale + (endScale - startScale) * easeProgress;
            currentOriginX = startX + (endX - startX) * easeProgress;
            currentOriginY = startY + (endY - startY) * easeProgress;

            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                resolve();
            }
        }

        update();
    });
}

// Modified drawing function with zoom support
function drawFrame() {
    if (!isPlaying) return;

    const point = points[currentPointIndex];
    const img = document.getElementById('uploadedImage');
    const quality = getQualitySettings();

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Save the current context state
    ctx.save();

    // Calculate scaled dimensions and positions
    const scaledWidth = canvas.width * currentScale;
    const scaledHeight = canvas.height * currentScale;
    const translateX = canvas.width * (currentOriginX / 100) - (scaledWidth * (currentOriginX / 100));
    const translateY = canvas.height * (currentOriginY / 100) - (scaledHeight * (currentOriginY / 100));

    // Apply transforms
    ctx.translate(translateX, translateY);
    ctx.scale(currentScale, currentScale);

    // Draw image
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Draw points
    points.forEach((p, index) => {
        const pointX = (p.x / 100) * canvas.width;
        const pointY = (p.y / 100) * canvas.height;

        ctx.beginPath();
        ctx.arc(pointX, pointY, 10, 0, 2 * Math.PI);
        ctx.fillStyle = index === currentPointIndex ? 'rgba(255,0,0,0.5)' : 'rgba(200,200,200,0.5)';
        ctx.fill();
        ctx.strokeStyle = 'red';
        ctx.stroke();
    });

    // Restore the context state
    ctx.restore();

    // Draw description
    if (point.description) {
        const fontSize = Math.floor(quality.height / 40);
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(0, canvas.height - fontSize * 4, canvas.width, fontSize * 4);
        ctx.fillStyle = 'white';
        ctx.font = `${fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(point.description, canvas.width / 2, canvas.height - fontSize * 2);
    }

    requestAnimationFrame(drawFrame);
}

// Modified animation sequence
async function animateToNextPoint() {
    if (!isPlaying) return;

    const point = points[currentPointIndex];

    // Show description with typewriter effect
    description.style.opacity = '1';
    typeWriter(point.description, description);

    // Zoom in
    await animateZoom(1, 2, 50, point.x, 50, point.y, 1000);

    // Wait at zoomed state
    await new Promise(resolve => setTimeout(resolve, 4000));

    // Zoom out
    if (isPlaying) {
        await animateZoom(2, 1, point.x, 50, point.y, 50, 1000);

        // Move to next point
        if (isPlaying) {
            currentPointIndex = (currentPointIndex + 1) % points.length;
            if (currentPointIndex === 0) {
                // Optional pause at the end of the cycle
                setTimeout(() => {
                    if (isPlaying) animateToNextPoint();
                }, 1000);
            } else {
                animateToNextPoint();
            }
        }
    }
}

// Add record button to controls
const recordButton = document.createElement('button');
recordButton.className = 'control-btn';
recordButton.textContent = 'Record Video';
recordButton.onclick = () => {
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        recordButton.textContent = 'Stop Recording';
        startRecording();
        startPresentation();
    } else {
        recordButton.textContent = 'Record Video';
        stopRecording();
        stopPresentation();
    }
};

document.getElementById('controls').appendChild(recordButton);

function startRecording() {
    if (!mediaRecorder) {
        setupRecording();
    }
    recordedChunks = [];
    mediaRecorder.start();
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }
}

// Modify existing startPresentation function
const originalStartPresentation = startPresentation;
startPresentation = function() {
    currentScale = 1;
    currentOriginX = 50;
    currentOriginY = 50;
    originalStartPresentation();
    drawFrame();
};
