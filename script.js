const WIDTH_SCALE = 0.75;
const MIN_SPACING = 24;
const colors = {
    bullBody: 'lightgreen',
    bearBody: 'lightcoral',
    bullBorder: 'darkgreen',
    bearBorder: 'darkred',
    bullShadow: 'darkgreen',
    bearShadow: 'darkred'
};

class Candle {
    constructor(index, ohlc, range) {
        this.index = index;
        this.open = ohlc.open;
        this.high = ohlc.high;
        this.low = ohlc.low;
        this.close = ohlc.close;
        this.range = range;
        this.greenCandle = this.open > this.close;

        this.scale = this.range.containerHeight / (this.range.highestHigh - this.range.lowestLow);

        this.candleGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.candleGroup.classList.add('candle');
    }

    calculateSizes() {
        let rawWidth = this.range.containerWidth / this.range.length;
        return {
            bodySize: Math.abs(this.open - this.close) * this.scale,
            candle_size: (this.high - this.low) * this.scale,
            upperShadowSize: (this.open > this.close ? this.high - this.open : this.high - this.close) * this.scale,
            lowerShadowSize: (this.open > this.close ? this.close - this.low : this.open - this.low) * this.scale,
            rawWidth: rawWidth,
            width: rawWidth * WIDTH_SCALE
        };
    }

    createRect(x, y, width, height, className) {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttributeNS(null, 'x', x);
        rect.setAttributeNS(null, 'y', y);
        rect.setAttributeNS(null, 'width', width);
        rect.setAttributeNS(null, 'height', height);
        rect.setAttributeNS(null, 'fill', this.greenCandle ? colors.bullBody : colors.bearBody);
        rect.setAttributeNS(null, 'stroke', this.greenCandle ? colors.bullBorder : colors.bearBorder);
        rect.classList.add(className);

        return rect;
    }

    createLine(x1, y1, x2, y2) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttributeNS(null, 'x1', x1);
        line.setAttributeNS(null, 'y1', y1);
        line.setAttributeNS(null, 'x2', x2);
        line.setAttributeNS(null, 'y2', y2);
        line.setAttributeNS(null, 'stroke', this.greenCandle ? colors.bullShadow : colors.bearShadow);
        line.setAttributeNS(null, 'stroke-width', '2');

        return line;
    }

    // body of the candle as a rectangle svg element
    createCandle() {
        const sizes = this.calculateSizes();
        let x = this.index * sizes.rawWidth + (sizes.rawWidth - sizes.width) / 2;
        let y = (this.range.highestHigh - this.high) * this.scale;

        // body of the candle as a rectangle svg element
        this.bodyElement = this.createRect(x, y + sizes.upperShadowSize, sizes.width, sizes.bodySize, this.greenCandle ? 'bull' : 'bear');

        // upper shadow of the candle as a line svg element
        this.upperShadowElement = this.createLine(x + sizes.width / 2, y, x + sizes.width / 2, y + sizes.upperShadowSize);
        this.upperShadowElement.classList.add('shadow', this.greenCandle ? 'bull' : 'bear');


        // lower shadow of the candle as a line svg element
        this.lowerShadowElement = this.createLine(x + sizes.width / 2, y + sizes.bodySize + sizes.upperShadowSize, x + sizes.width / 2, y + sizes.bodySize + sizes.lowerShadowSize + sizes.upperShadowSize);
        this.lowerShadowElement.classList.add('shadow', this.greenCandle ? 'bull' : 'bear');

        // add event listener
        this.candleGroup.addEventListener('click', this.onClick.bind(this));

        // Set transform-origin dynamically
        // find a better solution so that candles don't go off-screen
        this.candleGroup.style.transformOrigin = `${sizes.width / 2 + x}px ${y + sizes.upperShadowSize + sizes.bodySize / 2}px`;

        this.candleGroup.appendChild(this.bodyElement);
        this.candleGroup.appendChild(this.upperShadowElement);
        this.candleGroup.appendChild(this.lowerShadowElement);
        return this.candleGroup;
    }

    onClick() {
        console.log('Candle clicked');
        this.candleGroup.classList.toggle('scale-up');
    }
}

class VerticalLines {
    constructor(range, minSpacing = MIN_SPACING) {
        this.range = range;
        this.minSpacing = minSpacing;
        this.verticalGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    }

    createLine(x, y) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttributeNS(null, 'x1', x);
        line.setAttributeNS(null, 'y1', '0');
        line.setAttributeNS(null, 'x2', x);
        line.setAttributeNS(null, 'y2', y);
        line.setAttributeNS(null, 'stroke', 'black');
        line.setAttributeNS(null, 'opacity', '0.3');

        return line;
    }

    lines() {
        let spacing = 1;
        let rawWidth = this.range.containerWidth / this.range.length;
        while (rawWidth * spacing < this.minSpacing) {
            spacing++;
        }
        let x = rawWidth / 2;
        let y = this.range.containerHeight;
        while (x < this.range.containerWidth) {
            let line = this.createLine(x, y);
            this.verticalGroup.appendChild(line);
            x += rawWidth * spacing;
        }

        return this.verticalGroup;
    }
}

function drawCandles(container, ohlcData) {
    let lowestLow = Math.min(...ohlcData.low);
    let highestHigh = Math.max(...ohlcData.high);
    const bullColorInput = document.getElementById('bull-color-body');
    const bearColorInput = document.getElementById('bear-color-body');
    const bullBorderColorInput = document.getElementById('bull-color-border');
    const bearBorderColorInput = document.getElementById('bear-color-border');
    const bullShadowColorInput = document.getElementById('bull-color-shadow');
    const bearShadowColorInput = document.getElementById('bear-color-shadow');
    colors.bullBody = bullColorInput.value;
    colors.bearBody = bearColorInput.value;
    colors.bullBorder = bullBorderColorInput.value;
    colors.bearBorder = bearBorderColorInput.value;
    colors.bullShadow = bullShadowColorInput.value;
    colors.bearShadow = bearShadowColorInput.value;

    let range = {
        highestHigh: highestHigh,
        lowestLow: lowestLow,
        length: ohlcData.date.length,
        containerHeight: parseInt(window.getComputedStyle(container).height),
        containerWidth: parseInt(window.getComputedStyle(container).width)
    };

    if (range.containerWidth === 0 || range.containerHeight === 0) {
        throw new Error("Can't draw the chart in the container with zero width or height, silly!");
    }

    container.innerHTML = '';

    let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    // set the width and height of the svg element
    svg.setAttributeNS(null, 'width', '100%');
    svg.setAttributeNS(null, 'height', '100%');

    // drawing the vertical grid lines
    let verticalLines = new VerticalLines(range);
    svg.appendChild(verticalLines.lines());

    for (let i = 0; i < ohlcData['date'].length; i++) {
        const ohlc = {
            'open': ohlcData['open'][i],
            'high': ohlcData['high'][i],
            'low': ohlcData['low'][i],
            'close': ohlcData['close'][i]
        };
        let candle = new Candle(i, ohlc, range);
        svg.appendChild(candle.createCandle());
    }

    bullColorInput.addEventListener('input', () => {
        const bullCandles = document.querySelectorAll('rect.bull');
        colors.bullBody = bullColorInput.value;
        bullCandles.forEach(candle => {
            candle.style.fill = colors.bullBody;
        });
    });
    bearColorInput.addEventListener('input', () => {
        const bearCandles = document.querySelectorAll('rect.bear');
        colors.bearBody = bearColorInput.value;
        bearCandles.forEach(candle => {
            candle.style.fill = colors.bearBody;
        });
    });

    bullBorderColorInput.addEventListener('input', () => {
        const bullCandles = document.querySelectorAll('rect.bull');
        colors.bullBorder = bullBorderColorInput.value;
        bullCandles.forEach(candle => {
            candle.style.stroke = colors.bullBorder;
        });
    });
    bearBorderColorInput.addEventListener('input', () => {
        const bearCandles = document.querySelectorAll('rect.bear');
        colors.bearBorder = bearBorderColorInput.value;
        bearCandles.forEach(candle => {
            candle.style.stroke = colors.bearBorder;
        });
    });

    bullShadowColorInput.addEventListener('input', () => {
        const shadows = document.querySelectorAll('.shadow.bull');
        colors.bullShadow = bullShadowColorInput.value;
        shadows.forEach(shadow => {
            shadow.style.stroke = colors.bullShadow;
        });
    });
    bearShadowColorInput.addEventListener('input', () => {
        const shadows = document.querySelectorAll('.shadow.bear');
        colors.bearShadow = bearShadowColorInput.value;
        shadows.forEach(shadow => {
            shadow.style.stroke = colors.bearShadow;
        });
    });

    container.appendChild(svg);
}

async function fetchData() {
    try {
        const response = await fetch('data.json');
        if (!response.ok) {
            console.error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Failed to fetch data:", error);
        throw error;
    }
}

document.addEventListener('DOMContentLoaded', async function () {
    const container = document.getElementById('chart');
    const title = document.getElementById('chart-title');

    try {
        const ohlcData = await fetchData();

        title.textContent = ohlcData.title;

        drawCandles(container, ohlcData);

        window.addEventListener('resize', function () {
            drawCandles(container, ohlcData);
        });

        new ResizeObserver(() => {
            drawCandles(container, ohlcData);
        }).observe(container);
    } catch (error) {
        console.error("Failed to draw the chart:", error);
    }
});
