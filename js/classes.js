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
        this.tooltip = new Tooltip(x, y);

        const offset = {
            x: 5,
            y: 5,
        };
        for (let i of ['date', 'open', 'high', 'low', 'close']) {
            this.tooltip.createText(`${i}: ${this[i]}`, offset);
            offset.y += 18;
        }

        parent.appendChild(this.tooltip.tooltipGroup);

        this.candleGroup.addEventListener('mouseover', () => {
            this.tooltip.tooltipGroup.classList.add('show');
        });
        this.candleGroup.addEventListener('mouseout', () => {
            if (this.candleGroup.classList.contains('scale-up')) return;
            this.tooltip.tooltipGroup.classList.remove('show');
        });

        // set the transform-origin
        this.tooltip.tooltipGroup.style.transformOrigin = `${x}px ${y}px`;

        this.tooltip.fillRect();
    }

    onClick() {
        this.candleGroup.classList.toggle('scale-up');
        this.tooltip.tooltipGroup.classList.add('show');
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

class HorizontalLines {
    constructor(range, minSpacing = MIN_SPACING) {
        this.range = range;
        this.minSpacing = minSpacing;
        this.horizontalGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    }

    createLine(x, y) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttributeNS(null, 'x1', '0');
        line.setAttributeNS(null, 'y1', y);
        line.setAttributeNS(null, 'x2', x);
        line.setAttributeNS(null, 'y2', y);
        line.setAttributeNS(null, 'stroke', 'black');
        line.setAttributeNS(null, 'opacity', '0.3');

        return line;
    }

    calculateSpacing() {
        let count = this.range.containerHeight / this.minSpacing;
        let priceDiff = (this.range.highestHigh - this.range.lowestLow) / count;
        console.log(priceDiff);
        let divisor = Math.floor(Math.log10(priceDiff));
        priceDiff = priceDiff / Math.pow(10, divisor);
        priceDiff = priceDiff < 1 ? 1 : priceDiff < 2 ? 2 : priceDiff < 5 ? 5 : 10;
        priceDiff = Math.pow(10, divisor) * priceDiff;
        console.log(priceDiff);
        const prices = [Math.ceil(this.range.lowestLow / priceDiff) * priceDiff];

        while (true) {
            const price = prices[prices.length - 1] + priceDiff;
            if (price > this.range.highestHigh) {
                break;
            }
            prices.push(prices[prices.length - 1] + priceDiff);
        }
        console.log(prices);
        return prices.map((price) => {
            return Math.round(this.range.containerHeight
                - this.range.containerHeight
                * (price - this.range.lowestLow)
                / (this.range.highestHigh - this.range.lowestLow));
        });
    }

    lines() {
        const yArr = this.calculateSpacing();
        for (let i = 0; i < yArr.length; i++) {
            let line = this.createLine(this.range.containerWidth, yArr[i]);
            this.horizontalGroup.appendChild(line);
        }

        return this.horizontalGroup;
    }
}