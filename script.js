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

let container;

class Candle {
    constructor(index, ohlc, range) {
        this.index = index;
        this.date = ohlc.date;
        this.open = ohlc.open;
        this.high = ohlc.high;
        this.low = ohlc.low;
        this.close = ohlc.close;
        this.range = range;
        this.greenCandle = this.open < this.close;

        this.scale = this.range.containerHeight / (this.range.highestHigh - this.range.lowestLow);

        this.candleGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.candleGroup.classList.add('candle');
    }

    calculateSizes() {
        let rawWidth = this.range.containerWidth / this.range.length;
        return {
            bodySize: Math.abs(this.open - this.close) * this.scale,
            candleSize: (this.high - this.low) * this.scale,
            upperShadowSize: (this.open > this.close ? this.high - this.open : this.high - this.close) * this.scale,
            lowerShadowSize: (this.open > this.close ? this.close - this.low : this.open - this.low) * this.scale,
            rawWidth: rawWidth,
            width: rawWidth * WIDTH_SCALE,
            x: rawWidth * (this.index + (1 - WIDTH_SCALE) / 2),
            y: (this.range.highestHigh - this.high) * this.scale,
        };
    }

    createBody(x, y, width, height, className) {
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
        this.sizes = this.calculateSizes();
        const sizes = this.sizes;

        // body of the candle as a rectangle svg element
        this.bodyElement = this.createBody(sizes.x, sizes.y + sizes.upperShadowSize, sizes.width, sizes.bodySize, this.greenCandle ? 'bull' : 'bear');

        // upper shadow of the candle as a line svg element
        this.upperShadowElement = this.createLine(sizes.x + sizes.width / 2, sizes.y, sizes.x + sizes.width / 2, sizes.y + sizes.upperShadowSize);
        this.upperShadowElement.classList.add('shadow', this.greenCandle ? 'bull' : 'bear');


        // lower shadow of the candle as a line svg element
        this.lowerShadowElement = this.createLine(sizes.x + sizes.width / 2, sizes.y + sizes.bodySize + sizes.upperShadowSize, sizes.x + sizes.width / 2, sizes.y + sizes.bodySize + sizes.lowerShadowSize + sizes.upperShadowSize);
        this.lowerShadowElement.classList.add('shadow', this.greenCandle ? 'bull' : 'bear');

        // add event listener
        this.candleGroup.addEventListener('click', this.onClick.bind(this));

        // Set transform-origin dynamically
        // find a better solution so that candles don't go off-screen
        this.candleGroup.style.transformOrigin = `${sizes.width / 2 + sizes.x}px ${sizes.y + sizes.upperShadowSize + sizes.bodySize / 2}px`;

        this.candleGroup.appendChild(this.bodyElement);
        this.candleGroup.appendChild(this.upperShadowElement);
        this.candleGroup.appendChild(this.lowerShadowElement);
        return this.candleGroup;
    }

    createTooltip(parent) {
        let x = this.sizes.x + this.sizes.width + 5;
        let y = this.sizes.y + this.sizes.upperShadowSize + this.sizes.bodySize / 2;
        const tooltip = new Tooltip(x, y);

        const offset = {
            x: 5,
            y: 5,
        };
        for (let i of ['date', 'open', 'high', 'low', 'close']) {
            tooltip.createText(`${i}: ${this[i]}`, offset);
            offset.y += 18;
        }

        parent.appendChild(tooltip.tooltipGroup);

        this.candleGroup.addEventListener('mouseover', function () {
            tooltip.tooltipGroup.classList.add('show');
        });
        this.candleGroup.addEventListener('mouseout', function () {
            tooltip.tooltipGroup.classList.remove('show');
        });

        // set the transform-origin
        tooltip.tooltipGroup.style.transformOrigin = `${x}px ${y}px`;

        tooltip.fillRect();
    }

    onClick() {
        this.candleGroup.classList.toggle('scale-up');
    }
}

class Tooltip {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.tooltipGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.tooltipGroup.classList.add('tooltip');
        this.rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        this.tooltipGroup.appendChild(this.rect);
    }

    createText(text, offset) {
        const textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        textElement.setAttributeNS(null, 'x', this.x + offset.x);
        textElement.setAttributeNS(null, 'y', this.y + offset.y);
        textElement.setAttributeNS(null, 'dominant-baseline', 'hanging');
        textElement.textContent = text;
        this.tooltipGroup.appendChild(textElement);
    }

    fillRect() {
        setTimeout(() => {
            let x = this.tooltipGroup.getBBox().x;
            let y = this.tooltipGroup.getBBox().y;
            let width = this.tooltipGroup.getBBox().width;
            let height = this.tooltipGroup.getBBox().height;
            console.log(x, y, width, height);
            this.rect.setAttributeNS(null, 'x', x - 5);
            this.rect.setAttributeNS(null, 'y', y - 5);
            this.rect.setAttributeNS(null, 'width', width + 10);
            this.rect.setAttributeNS(null, 'height', height + 10);
            this.rect.setAttributeNS(null, 'fill', '#ccc');
            this.rect.setAttributeNS(null, 'opacity', '0.8');
            this.rect.setAttributeNS(null, 'rx', '10');
            this.rect.setAttributeNS(null, 'stroke', 'black');
        }, 50);
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
    const containerStyle = window.getComputedStyle(container);
    const paddings = {
        top: parseInt(containerStyle.paddingTop),
        right: parseInt(containerStyle.paddingRight),
        bottom: parseInt(containerStyle.paddingBottom),
        left: parseInt(containerStyle.paddingLeft)
    };

    let range = {
        highestHigh: highestHigh,
        lowestLow: lowestLow,
        length: ohlcData['date'].length,
        containerHeight: container.clientHeight - paddings.top - paddings.bottom,
        containerWidth: container.clientWidth - paddings.left - paddings.right
    };

    if (range.containerWidth === 0 || range.containerHeight === 0) {
        throw new Error("Can't draw the chart in the container with zero width or height, silly!");
    }

    container.innerHTML = '';

    let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    // set the width and height of the svg element
    svg.setAttributeNS(null, 'width', range.containerWidth);
    svg.setAttributeNS(null, 'height', range.containerHeight);
    // svg.setAttributeNS(null, 'viewBox', '0 0 ' + range.containerWidth + ' ' + range.containerHeight);
    svg.style.verticalAlign = 'top';

    // drawing the vertical grid lines
    let verticalLines = new VerticalLines(range);
    svg.appendChild(verticalLines.lines());

    const candles = [];
    for (let i = 0; i < ohlcData['date'].length; i++) {
        const ohlc = {
            'date': ohlcData['date'][i],
            'open': ohlcData['open'][i],
            'high': ohlcData['high'][i],
            'low': ohlcData['low'][i],
            'close': ohlcData['close'][i]
        };
        let candle = new Candle(i, ohlc, range);
        svg.appendChild(candle.createCandle());
        candles.push(candle);
    }

    for (let candle of candles) {
        candle.createTooltip(svg);
    }

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
    const mainContainer = document.getElementById('flame-chart');
    container = document.createElement('div');
    container.id = 'chart';
    mainContainer.appendChild(container);

    try {
        const ohlcData = await fetchData();

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
