// videoRecorder.js
export class VideoRecorder {
    constructor(parentElement) {
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.isRecording = false;
        this.parentElement = parentElement;

        // Default settings
        this.settings = {
            width: 1920,
            height: 1080,
            fps: 60,
            quality: 'high',
            bitrate: 8000000
        };

        // Create and add settings panel
        this.settingsPanel = this.createSettingsPanel();
        this.recordButton = this.createRecordButton();

        // Initialize UI
        this.initializeUI();
    }

    initializeUI() {
        // Add settings panel to parent
        this.parentElement.appendChild(this.settingsPanel);
        document.getElementById('controls').appendChild(this.recordButton);
    }

    createSettingsPanel() {
        const panel = document.createElement('div');
        panel.className = 'settings-panel';
        panel.innerHTML = `
            <div class="settings-group">
                <label>Resolution:</label>
                <select id="videoResolution" class="settings-select">
                    <option value="1920x1080">1080p (1920x1080)</option>
                    <option value="2560x1440">1440p (2560x1440)</option>
                    <option value="3840x2160">4K (3840x2160)</option>
                    <option value="custom">Custom</option>
                </select>
                <div id="customResolution" style="display: none;">
                    <input type="number" id="customWidth" placeholder="Width" value="1920" min="1280" max="7680"/>
                    <input type="number" id="customHeight" placeholder="Height" value="1080" min="720" max="4320"/>
                </div>
            </div>
            <div class="settings-group">
                <label>Quality:</label>
                <select id="videoQuality" class="settings-select">
                    <option value="high">High (8 Mbps)</option>
                    <option value="medium">Medium (4 Mbps)</option>
                    <option value="low">Low (2 Mbps)</option>
                </select>
            </div>
            <div class="settings-group">
                <label>FPS:</label>
                <select id="videoFps" class="settings-select">
                    <option value="60">60 FPS</option>
                    <option value="30">30 FPS</option>
                    <option value="24">24 FPS</option>
                </select>
            </div>
        `;

        this.addSettingsStyles();
        this.setupSettingsListeners(panel);

        return panel;
    }

    addSettingsStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .settings-panel {
                background: white;
                padding: 15px;
                margin-top: 15px;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .settings-group {
                margin-bottom: 10px;
            }
            .settings-group label {
                display: block;
                margin-bottom: 5px;
                font-weight: bold;
            }
            .settings-select, .settings-group input {
                width: 100%;
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                margin-bottom: 5px;
            }
            #customResolution {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px;
                margin-top: 5px;
            }
        `;
        document.head.appendChild(style);
    }

    setupSettingsListeners(panel) {
        panel.querySelector('#videoResolution').addEventListener('change', (e) => {
            const customResolution = panel.querySelector('#customResolution');
            if (e.target.value === 'custom') {
                customResolution.style.display = 'grid';
            } else {
                customResolution.style.display = 'none';
                const [width, height] = e.target.value.split('x').map(Number);
                this.settings.width = width;
                this.settings.height = height;
            }
        });

        panel.querySelector('#videoQuality').addEventListener('change', (e) => {
            switch (e.target.value) {
                case 'high': this.settings.bitrate = 8000000; break;
                case 'medium': this.settings.bitrate = 4000000; break;
                case 'low': this.settings.bitrate = 2000000; break;
            }
        });

        panel.querySelector('#videoFps').addEventListener('change', (e) => {
            this.settings.fps = parseInt(e.target.value);
        });

        const customWidth = panel.querySelector('#customWidth');
        const customHeight = panel.querySelector('#customHeight');

        customWidth.addEventListener('change', (e) => {
            this.settings.width = Math.min(Math.max(parseInt(e.target.value), 1280), 7680);
            e.target.value = this.settings.width;
        });

        customHeight.addEventListener('change', (e) => {
            this.settings.height = Math.min(Math.max(parseInt(e.target.value), 720), 4320);
            e.target.value = this.settings.height;
        });
    }

    createRecordButton() {
        const button = document.createElement('button');
        button.className = 'control-btn';
        button.textContent = 'Record Video';
        button.onclick = () => this.toggleRecording();
        return button;
    }

    setupRecording() {
        this.canvas.width = this.settings.width;
        this.canvas.height = this.settings.height;

        const stream = this.canvas.captureStream(this.settings.fps);
        this.mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'video/webm;codecs=vp9',
            videoBitsPerSecond: this.settings.bitrate
        });

        this.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                this.recordedChunks.push(event.data);
            }
        };

        this.mediaRecorder.onstop = () => this.handleStop();
    }

    toggleRecording() {
        if (!this.isRecording) {
            this.startRecording();
        } else {
            this.stopRecording();
        }
    }

    startRecording() {
        if (!this.mediaRecorder) {
            this.setupRecording();
        }
        this.recordedChunks = [];
        this.mediaRecorder.start();
        this.isRecording = true;
        this.recordButton.textContent = 'Stop Recording';

        // Start presentation and drawing
        window.startPresentation();
    }

    stopRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
            this.isRecording = false;
            this.recordButton.textContent = 'Record Video';
            window.stopPresentation();
        }
    }

    handleStop() {
        const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
        this.recordedChunks = [];

        const resolution = `${this.settings.width}x${this.settings.height}`;
        const quality = document.querySelector('#videoQuality').value;
        const fps = this.settings.fps;
        const filename = `presentation_${resolution}_${quality}_${fps}fps.webm`;

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        document.body.appendChild(a);
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        a.click();

        setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 100);
    }

    drawFrame(imageElement, points, currentPointIndex) {
        if (!this.isRecording) return;

        const point = points[currentPointIndex];

        // Setup high-quality rendering
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Calculate scaling and positioning
        const scale = Math.min(
            this.canvas.width / imageElement.naturalWidth,
            this.canvas.height / imageElement.naturalHeight
        );
        const scaledWidth = imageElement.naturalWidth * scale;
        const scaledHeight = imageElement.naturalHeight * scale;
        const offsetX = (this.canvas.width - scaledWidth) / 2;
        const offsetY = (this.canvas.height - scaledHeight) / 2;

        // Draw image
        this.ctx.drawImage(imageElement, offsetX, offsetY, scaledWidth, scaledHeight);

        // Draw points
        this.drawPoints(points, currentPointIndex, offsetX, offsetY, scaledWidth, scaledHeight);

        // Draw description
        if (point.description) {
            this.drawDescription(point.description);
        }

        requestAnimationFrame(() => this.drawFrame(imageElement, points, currentPointIndex));
    }

    drawPoints(points, currentPointIndex, offsetX, offsetY, scaledWidth, scaledHeight) {
        points.forEach((p, index) => {
            this.ctx.beginPath();
            this.ctx.arc(
                offsetX + (p.x / 100) * scaledWidth,
                offsetY + (p.y / 100) * scaledHeight,
                15,
                0,
                2 * Math.PI
            );
            this.ctx.fillStyle = index === currentPointIndex ? 'rgba(255,0,0,0.5)' : 'rgba(200,200,200,0.5)';
            this.ctx.fill();
            this.ctx.lineWidth = 3;
            this.ctx.strokeStyle = 'red';
            this.ctx.stroke();
        });
    }

    drawDescription(text) {
        const fontSize = Math.floor(this.canvas.height / 30);
        this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
        this.ctx.fillRect(0, this.canvas.height - fontSize * 3, this.canvas.width, fontSize * 3);
        this.ctx.fillStyle = 'white';
        this.ctx.font = `${fontSize}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        const maxWidth = this.canvas.width * 0.8;
        const words = text.split(' ');
        let line = '';
        let y = this.canvas.height - fontSize * 1.5;

        words.forEach(word => {
            const testLine = line + word + ' ';
            const metrics = this.ctx.measureText(testLine);
            if (metrics.width > maxWidth) {
                this.ctx.fillText(line, this.canvas.width / 2, y);
                line = word + ' ';
                y += fontSize;
            } else {
                line = testLine;
            }
        });
        this.ctx.fillText(line, this.canvas.width / 2, y);
    }
}
