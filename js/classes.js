class Candle {
    constructor(index, ohlc, range, labels = true) {
        this.index = index;
        this.ohlc = ohlc;
        this.date = ohlc.date;
        this.open = ohlc.open;
        this.high = ohlc.high;
        this.low = ohlc.low;
        this.close = ohlc.close;
        this.range = range;
        this.labels = labels;
        this.greenCandle = this.open < this.close;

        this.scale = (this.range.containerHeight - (this.labels ? DATE_WIDTH : 0)) / (this.range.highestHigh - this.range.lowestLow);

        this.candleGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.candleGroup.classList.add('candle');
    }

    calculateSizes() {
        let rawWidth = (this.range.containerWidth - (this.labels ? PRICE_WIDTH : 0)) / this.range.length;
        return {
            bodySize: Math.abs(this.open - this.close) * this.scale,
            candleSize: (this.high - this.low) * this.scale,
            upperShadowSize: (this.open > this.close ? this.high - this.open : this.high - this.close) * this.scale,
            lowerShadowSize: (this.open > this.close ? this.close - this.low : this.open - this.low) * this.scale,
            rawWidth: rawWidth,
            width: rawWidth * WIDTH_SCALE,
            x: rawWidth * (this.index + (1 - WIDTH_SCALE) / 2) + (this.labels ? PRICE_WIDTH : 0),
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

        const fragment = document.createDocumentFragment();
        fragment.appendChild(this.bodyElement);
        fragment.appendChild(this.upperShadowElement);
        fragment.appendChild(this.lowerShadowElement);
        this.candleGroup.appendChild(fragment);

        return this.candleGroup;
    }

    createTooltip(parent) {
        let x = this.sizes.x + this.sizes.width + 5;
        let y = this.sizes.y + this.sizes.upperShadowSize + this.sizes.bodySize / 2;
        this.tooltip = new Tooltip(x, y, this.ohlc, this.range);

        this.tooltip.createTooltip();

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
    }

    onClick() {
        this.candleGroup.classList.toggle('scale-up');
        this.tooltip.tooltipGroup.classList.add('show');
    }
}

class Tooltip {
    constructor(x, y, ohlc, range) {
        this.x = x;
        this.y = y;
        this.ohlc = ohlc;
        this.range = range;
        this.tooltipGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.tooltipGroup.classList.add('tooltip');
        this.tooltipGroup.style.pointerEvents = 'none';
        this.rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        this.tooltipGroup.appendChild(this.rect);
    }

    createTooltip() {
        let offset = {
            x: 5,
            y: 5,
        };
        const fragment = document.createDocumentFragment();
        for (let i in this.ohlc) {
            fragment.appendChild(this.createText(`${i}: ${this.ohlc[i]}`, offset));
            offset.y += 18;
        }
        this.tooltipGroup.appendChild(fragment);

        requestAnimationFrame(() => {
            this.fixTooltipPosition();
            this.fillRect();
        });
    }

    createText(text, offset) {
        const textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        textElement.setAttributeNS(null, 'x', this.x + offset.x);
        textElement.setAttributeNS(null, 'y', this.y + offset.y);
        textElement.setAttributeNS(null, 'dominant-baseline', 'hanging');
        textElement.textContent = text;
        return textElement;
    }

    fixTooltipPosition() {
        let x = Math.min(this.x, this.range.containerWidth - this.tooltipGroup.getBBox().width - 10);
        let y = Math.min(this.y, this.range.containerHeight - this.tooltipGroup.getBBox().height - 10);
        let offset = {
            x: 5,
            y: 5,
        };
        this.tooltipGroup.querySelectorAll('text').forEach(text => {
            text.setAttributeNS(null, 'x', (x + offset.x).toString());
            text.setAttributeNS(null, 'y', (y + offset.y).toString());
            offset.y += 18;
        });
    }

    fillRect() {
        let bbox = this.tooltipGroup.getBBox();
        this.rect.setAttributeNS(null, 'x', (bbox.x - 5).toString());
        this.rect.setAttributeNS(null, 'y', (bbox.y - 5).toString());
        this.rect.setAttributeNS(null, 'width', (bbox.width + 10).toString());
        this.rect.setAttributeNS(null, 'height', (bbox.height + 10).toString());
        this.rect.setAttributeNS(null, 'fill', '#ccc');
        this.rect.setAttributeNS(null, 'opacity', '0.8');
        this.rect.setAttributeNS(null, 'rx', '10');
        this.rect.setAttributeNS(null, 'stroke', 'black');
    }
}

class VerticalLines {
    constructor(range, ohlc, minSpacing = MIN_SPACING, labels = true) {
        this.range = range;
        this.ohlc = ohlc;
        this.minSpacing = minSpacing;
        this.labels = labels;
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
        let rawWidth = (this.range.containerWidth - (this.labels ? PRICE_WIDTH : 0)) / this.range.length;
        while (rawWidth * spacing < this.minSpacing) {
            spacing++;
        }
        let x = rawWidth / 2 + (this.labels ? PRICE_WIDTH : 0);
        const x0 = x;
        let y = this.range.containerHeight - (this.labels ? DATE_WIDTH : 0);
        while (x < this.range.containerWidth) {
            let line = this.createLine(x, y);
            this.verticalGroup.appendChild(line);
            if (this.labels && x + rawWidth * spacing < this.range.containerWidth) {
                let label = this.createLabels(x, y + 20, this.ohlc['date'][Math.round((x - x0) / (rawWidth))]);
                this.verticalGroup.appendChild(label);
            }
            x += rawWidth * spacing;
        }

        return this.verticalGroup;
    }

    createLabels(x, y, text) {
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttributeNS(null, 'x', x);
        label.setAttributeNS(null, 'y', y);
        label.setAttributeNS(null, "font-size", "14px");
        label.setAttributeNS(null, "fill", "black");
        // label.setAttributeNS(null, "text-anchor", "start");
        label.setAttributeNS(null, 'text-anchor', 'middle');
        label.textContent = text;
        // rotate the label 45 degrees
        label.setAttributeNS(null, 'transform', 'translate(15 15) rotate(45 ' + x + ' ' + y + ')');

        return label;
    }
}

class HorizontalLines {
    constructor(range, minSpacing = MIN_SPACING, labels = true) {
        this.range = range;
        this.minSpacing = minSpacing;
        this.labels = labels;
        this.horizontalGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.prices = [];
    }

    createLine(x, y) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttributeNS(null, 'x1', (this.labels ? PRICE_WIDTH : 0).toString());
        line.setAttributeNS(null, 'y1', y);
        line.setAttributeNS(null, 'x2', x);
        line.setAttributeNS(null, 'y2', y);
        line.setAttributeNS(null, 'stroke', 'black');
        line.setAttributeNS(null, 'opacity', '0.3');

        return line;
    }

    calculateSpacing() {
        let count = (this.range.containerHeight - (this.labels ? DATE_WIDTH : 0)) / this.minSpacing;
        let priceDiff = (this.range.highestHigh - this.range.lowestLow) / count;
        let divisor = Math.floor(Math.log10(priceDiff));
        priceDiff = priceDiff / Math.pow(10, divisor);
        priceDiff = priceDiff < 1 ? 1 : priceDiff < 2 ? 2 : priceDiff < 5 ? 5 : 10;
        priceDiff = Math.pow(10, divisor) * priceDiff;
        this.prices.push(Math.ceil(this.range.lowestLow / priceDiff) * priceDiff);

        while (true) {
            const price = this.prices[this.prices.length - 1] + priceDiff;
            if (price > this.range.highestHigh) {
                break;
            }
            this.prices.push(this.prices[this.prices.length - 1] + priceDiff);
        }
        this.prices = this.prices.map((price) => Math.round(price * (10 ** (-divisor))) / (10 ** (-divisor)));
        return this.prices.map((price) => {
            const height = this.range.containerHeight - (this.labels ? DATE_WIDTH : 0);
            return Math.round(height
                - height
                * (price - this.range.lowestLow)
                / (this.range.highestHigh - this.range.lowestLow));
        });
    }

    lines() {
        const yArr = this.calculateSpacing();
        for (let i = 0; i < yArr.length; i++) {
            let line = this.createLine(this.range.containerWidth, yArr[i]);
            this.horizontalGroup.appendChild(line);
            if (this.labels) {
                const label = this.createLabel(PRICE_WIDTH - 5, yArr[i] + 5, this.prices[i].toString());
                this.horizontalGroup.appendChild(label);
            }
        }

        return this.horizontalGroup;
    }

    createLabel(x, y, text) {
        const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
        label.setAttributeNS(null, "x", x);
        label.setAttributeNS(null, "y", y);
        label.setAttributeNS(null, "font-size", "14px");
        label.setAttributeNS(null, "fill", "black");
        label.setAttributeNS(null, "text-anchor", "end");
        label.innerHTML = text;

        return label;
    }
}