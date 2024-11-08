import { elements } from './domElements.js';
import { videoSettings, presentationSettings } from './settings.js';
import { drawingUtils, fileUtils, animationUtils } from './utils.js';

export class VideoRecorder {
    constructor(parentElement) {
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.isRecording = false;
        this.currentPointIndex = 0;
        this.parentElement = parentElement;
        this.settings = { ...videoSettings };
        this.settingsPanel = this.createSettingsPanel();
        this.currentText = '';
        this.targetText = '';
        this.textProgress = 0;
        this.lastFrameTime = 0;

        this.initializeUI();
        this.setupRecordButton();
    }

    setupRecordButton() {
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
        this.currentPointIndex = 0;
        this.startRecordingSequence();
    }

    async startRecordingSequence() {
        const img = elements.getUploadedImage();
        const points = window.pointManager.getPoints();
        if (!img || points.length === 0) return;

        const frameInterval = 1000 / this.settings.fps;
        let lastFrameTime = performance.now();
        let currentRotation = 0;

        for (let i = 0; i < points.length; i++) {
            // Initial pause with no rotation
            await this.smoothAnimation(async (progress) => {
                await this.drawFrameWithZoom(img, points, i, 1, '', 1, 0);
            }, 500);

            // Start typewriter effect before zoom
            this.targetText = points[i].description;
            this.currentText = '';
            this.textProgress = 0;

            // Smooth zoom in with easing and typewriter
            await this.smoothAnimation(async (progress) => {
                const easedProgress = this.easeInOutCubic(progress);
                const scale = 1 + (presentationSettings.zoomScale - 1) * easedProgress;

                // Update typewriter text
                this.textProgress = Math.min(progress * 1.5, 1); // Slightly faster than zoom
                this.currentText = this.targetText.slice(0, Math.floor(this.textProgress * this.targetText.length));

                await this.drawFrameWithZoom(img, points, i, scale, this.currentText, 1, easedProgress);
            }, presentationSettings.zoomDuration);

            // Hold at zoomed state
            await this.smoothAnimation(async (progress) => {
                await this.drawFrameWithZoom(img, points, i, presentationSettings.zoomScale, this.targetText, 1, 1);
            }, presentationSettings.pointDisplayTime);

            // Smooth zoom out with easing - now includes rotation reset
            await this.smoothAnimation(async (progress) => {
                const easedProgress = this.easeInOutCubic(progress);
                const scale = presentationSettings.zoomScale - (presentationSettings.zoomScale - 1) * easedProgress;

                // Fade out text
                const textOpacity = 1 - easedProgress;
                // Gradually reduce rotation to 0 as we zoom out
                const rotationStrength = 1 - easedProgress;

                await this.drawFrameWithZoom(img, points, i, scale, this.targetText, textOpacity, rotationStrength);
            }, presentationSettings.zoomDuration);

            // Pause between points with no rotation
            if (i < points.length - 1) {
                await this.smoothAnimation(async (progress) => {
                    await this.drawFrameWithZoom(img, points, i, 1, '', 1, 0);
                }, presentationSettings.transitionDelay);
            }
        }

        // Add final hold on the complete image
        await this.smoothAnimation(async (progress) => {
            await this.drawFrameWithZoom(img, points, points.length - 1, 1, '', 1, 0);
        }, 2000); // Hold for 2 seconds, adjust time as needed

        this.stopRecording();
    }

    async smoothAnimation(drawFrame, duration) {
        const startTime = performance.now();
        const frameInterval = 1000 / this.settings.fps;

        return new Promise(async (resolve) => {
            const animate = async () => {
                if (!this.isRecording) {
                    resolve(); // Make sure we resolve if recording is stopped
                    return;
                }

                const currentTime = performance.now();
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);

                await drawFrame(progress);

                if (progress < 1) {
                    const frameTime = performance.now();
                    const timeToNextFrame = Math.max(0, frameInterval - (frameTime - this.lastFrameTime));
                    this.lastFrameTime = frameTime;
                    setTimeout(animate, timeToNextFrame);
                } else {
                    resolve();
                }
            };

            animate();
        });
    }

    easeInOutCubic(x) {
        return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    }

    async drawFrameWithZoom(imageElement, points, pointIndex, scale, text, textOpacity = 1, rotationStrength = 1) {
        const point = points[pointIndex];

        // Clear the canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Calculate base scaling to fit image in canvas
        const baseScale = Math.min(
            this.canvas.width / imageElement.naturalWidth,
            this.canvas.height / imageElement.naturalHeight
        );
        const scaledWidth = imageElement.naturalWidth * baseScale;
        const scaledHeight = imageElement.naturalHeight * baseScale;

        // Add slight randomization to zoom center for more natural feel
        const randomOffset = scale > 1 ? Math.sin(performance.now() / 1000) * 0.2 * rotationStrength : 0;
        const centerX = (point.x / 100) * scaledWidth + randomOffset;
        const centerY = (point.y / 100) * scaledHeight + randomOffset;

        const baseOffsetX = (this.canvas.width - scaledWidth) / 2;
        const baseOffsetY = (this.canvas.height - scaledHeight) / 2;

        this.ctx.save();

        // Add rotation that smoothly reduces to 0 when zooming out
        if (scale > 1 || rotationStrength > 0) {
            const baseRotation = Math.sin(performance.now() / 2000) * 0.015;
            const currentRotation = baseRotation * rotationStrength;
            this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.rotate(currentRotation);
            this.ctx.translate(-this.canvas.width / 2, -this.canvas.height / 2);
        }

        // Move to zoom center point
        this.ctx.translate(
            baseOffsetX + centerX,
            baseOffsetY + centerY
        );

        // Apply zoom scale
        this.ctx.scale(scale, scale);

        // Move back
        this.ctx.translate(
            -(baseOffsetX + centerX),
            -(baseOffsetY + centerY)
        );

        // Draw image with slight motion blur when zooming
        if (scale !== 1) {
            this.ctx.filter = 'blur(0.5px)';
        }

        this.ctx.drawImage(
            imageElement,
            baseOffsetX,
            baseOffsetY,
            scaledWidth,
            scaledHeight
        );

        this.ctx.filter = 'none';

        // Draw points with subtle animation
        this.drawAnimatedPoints(points, pointIndex, baseOffsetX, baseOffsetY, scaledWidth, scaledHeight);

        this.ctx.restore();

        // Draw description with dynamic opacity
        if (text) {
            this.drawEnhancedDescription(text, textOpacity);
        }
    }

    drawAnimatedPoints(points, currentIndex, offsetX, offsetY, scaledWidth, scaledHeight) {
        const time = performance.now();

        points.forEach((point, index) => {
            const x = offsetX + (point.x / 100) * scaledWidth;
            const y = offsetY + (point.y / 100) * scaledHeight;

            // Pulse animation for current point
            let radius = 15;
            if (index === currentIndex) {
                radius += Math.sin(time / 200) * 2;
            }

            // Draw point with subtle gradient
            const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, radius);
            if (index === currentIndex) {
                gradient.addColorStop(0, 'rgba(255, 50, 50, 0.8)');
                gradient.addColorStop(1, 'rgba(255, 50, 50, 0)');
            } else {
                gradient.addColorStop(0, 'rgba(200, 200, 200, 0.5)');
                gradient.addColorStop(1, 'rgba(200, 200, 200, 0)');
            }

            this.ctx.beginPath();
            this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
        });
    }

    drawEnhancedDescription(text, opacity = 1) {
        const fontSize = Math.floor(this.canvas.height / 30);
        const padding = fontSize;
        const maxWidth = this.canvas.width * 0.8;

        this.ctx.save();

        // Create gradient background
        const gradient = this.ctx.createLinearGradient(
            0, this.canvas.height - fontSize * 4,
            0, this.canvas.height
        );
        gradient.addColorStop(0, `rgba(0, 0, 0, 0)`);
        gradient.addColorStop(0.2, `rgba(0, 0, 0, ${0.8 * opacity})`);
        gradient.addColorStop(1, `rgba(0, 0, 0, ${0.8 * opacity})`);

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, this.canvas.height - fontSize * 4, this.canvas.width, fontSize * 4);

        // Draw text with shadow
        this.ctx.font = `${fontSize}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 4;

        // Draw text with opacity
        this.ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;

        // Word wrap
        const words = text.split(' ');
        let line = '';
        let y = this.canvas.height - fontSize * 2;

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

        this.ctx.restore();
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
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

    stopRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
            this.isRecording = false;
        }
    }
}
