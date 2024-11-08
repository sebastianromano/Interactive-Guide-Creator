// Drawing utilities
export const drawingUtils = {
    drawPoints(ctx, points, currentPointIndex, offsetX, offsetY, scaledWidth, scaledHeight) {
        points.forEach((p, index) => {
            ctx.beginPath();
            ctx.arc(
                offsetX + (p.x / 100) * scaledWidth,
                offsetY + (p.y / 100) * scaledHeight,
                15,
                0,
                2 * Math.PI
            );
            ctx.fillStyle = index === currentPointIndex ? 'rgba(255,0,0,0.5)' : 'rgba(200,200,200,0.5)';
            ctx.fill();
            ctx.lineWidth = 3;
            ctx.strokeStyle = 'red';
            ctx.stroke();
        });
    },

    drawDescription(ctx, text, canvasWidth, canvasHeight) {
        const fontSize = Math.floor(canvasHeight / 30);
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(0, canvasHeight - fontSize * 3, canvasWidth, fontSize * 3);
        ctx.fillStyle = 'white';
        ctx.font = `${fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const maxWidth = canvasWidth * 0.8;
        const words = text.split(' ');
        let line = '';
        let y = canvasHeight - fontSize * 1.5;

        words.forEach(word => {
            const testLine = line + word + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth) {
                ctx.fillText(line, canvasWidth / 2, y);
                line = word + ' ';
                y += fontSize;
            } else {
                line = testLine;
            }
        });
        ctx.fillText(line, canvasWidth / 2, y);
    }
};

// File handling utilities
export const fileUtils = {
    async readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = e => reject(e);
            reader.readAsDataURL(file);
        });
    },

    generateFilename(settings) {
        const resolution = `${settings.width}x${settings.height}`;
        const quality = settings.quality;
        const fps = settings.fps;
        return `presentation_${resolution}_${quality}_${fps}fps.webm`;
    }
};

// Animation utilities
export const animationUtils = {
    typeWriter(text, element, speed, callback) {
        let i = 0;
        element.textContent = '';

        const type = () => {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                setTimeout(type, speed);
            } else if (callback) {
                callback();
            }
        };

        type();
    }
};
