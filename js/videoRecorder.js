import { elements } from './domElements.js';
import { videoSettings } from './settings.js';
import { drawingUtils, fileUtils } from './utils.js';

export class VideoRecorder {
    constructor(parentElement) {
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.isRecording = false;
        this.parentElement = parentElement;

        // Initialize with default settings
        this.settings = { ...videoSettings };

        // Create and add settings panel
        this.settingsPanel = this.createSettingsPanel();

        // Initialize UI and setup record button
        this.initializeUI();
        this.setupRecordButton();
    }

    setupRecordButton() {
        // Make sure recordButton exists before adding listener
        if (elements.recordButton) {
            elements.recordButton.addEventListener('click', () => this.toggleRecording());
        }
    }

    initializeUI() {
        if (this.parentElement) {
            this.parentElement.appendChild(this.settingsPanel);
        }
    }

    createSettingsPanel() {
        const panel = document.createElement('div');
        panel.className = 'settings-panel';
        panel.innerHTML = this.createSettingsPanelHTML();
        this.setupSettingsListeners(panel);
        return panel;
    }

    createSettingsPanelHTML() {
        return `
            <div class="settings-group">
                <label>Resolution:</label>
                <select id="videoResolution" class="settings-select">
                    ${videoSettings.resolutionOptions.map(option =>
            `<option value="${option.value}">${option.label}</option>`
        ).join('')}
                    <option value="custom">Custom</option>
                </select>
                <div id="customResolution" style="display: none;">
                    <input type="number" id="customWidth" placeholder="Width" value="${videoSettings.width}" min="1280" max="7680"/>
                    <input type="number" id="customHeight" placeholder="Height" value="${videoSettings.height}" min="720" max="4320"/>
                </div>
            </div>
            <div class="settings-group">
                <label>Quality:</label>
                <select id="videoQuality" class="settings-select">
                    ${videoSettings.qualityOptions.map(option =>
            `<option value="${option.value}">${option.label}</option>`
        ).join('')}
                </select>
            </div>
            <div class="settings-group">
                <label>FPS:</label>
                <select id="videoFps" class="settings-select">
                    ${videoSettings.fpsOptions.map(option =>
            `<option value="${option.value}">${option.label}</option>`
        ).join('')}
                </select>
            </div>
        `;
    }

    setupSettingsListeners(panel) {
        const videoResolution = panel.querySelector('#videoResolution');
        const customResolution = panel.querySelector('#customResolution');
        const videoQuality = panel.querySelector('#videoQuality');
        const videoFps = panel.querySelector('#videoFps');
        const customWidth = panel.querySelector('#customWidth');
        const customHeight = panel.querySelector('#customHeight');

        if (videoResolution) {
            videoResolution.addEventListener('change', (e) => {
                if (e.target.value === 'custom') {
                    customResolution.style.display = 'grid';
                } else {
                    customResolution.style.display = 'none';
                    const [width, height] = e.target.value.split('x').map(Number);
                    this.settings.width = width;
                    this.settings.height = height;
                }
            });
        }

        if (videoQuality) {
            videoQuality.addEventListener('change', (e) => {
                const quality = videoSettings.qualityOptions.find(q => q.value === e.target.value);
                if (quality) {
                    this.settings.bitrate = quality.bitrate;
                }
            });
        }

        if (videoFps) {
            videoFps.addEventListener('change', (e) => {
                this.settings.fps = parseInt(e.target.value);
            });
        }

        if (customWidth) {
            customWidth.addEventListener('change', (e) => {
                this.settings.width = Math.min(Math.max(parseInt(e.target.value), 1280), 7680);
                e.target.value = this.settings.width;
            });
        }

        if (customHeight) {
            customHeight.addEventListener('change', (e) => {
                this.settings.height = Math.min(Math.max(parseInt(e.target.value), 720), 4320);
                e.target.value = this.settings.height;
            });
        }
    }

    toggleRecording() {
        if (!this.isRecording) {
            this.startRecording();
            if (elements.recordButton) {
                elements.recordButton.classList.add('recording');
                elements.recordButton.setAttribute('aria-label', 'Stop Recording');
            }
        } else {
            this.stopRecording();
            if (elements.recordButton) {
                elements.recordButton.classList.remove('recording');
                elements.recordButton.setAttribute('aria-label', 'Record Video');
            }
        }
    }

    startRecording() {
        if (!this.mediaRecorder) {
            this.setupRecording();
        }
        this.recordedChunks = [];
        this.mediaRecorder.start();
        this.isRecording = true;

        // Start presentation and drawing
        window.startPresentation();
    }

    stopRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
            this.isRecording = false;
            window.stopPresentation();
        }
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

    handleStop() {
        const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
        this.recordedChunks = [];

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        document.body.appendChild(a);
        a.style.display = 'none';
        a.href = url;
        a.download = fileUtils.generateFilename(this.settings);
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

        // Draw points and description using utility functions
        drawingUtils.drawPoints(this.ctx, points, currentPointIndex, offsetX, offsetY, scaledWidth, scaledHeight);

        if (point.description) {
            drawingUtils.drawDescription(this.ctx, point.description, this.canvas.width, this.canvas.height);
        }

        requestAnimationFrame(() => this.drawFrame(imageElement, points, currentPointIndex));
    }
}
