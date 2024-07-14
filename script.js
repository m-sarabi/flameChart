class candle {
    constructor(index, open, high, low, close, range, x, y) {
        this.index = index;
        this.open = open;
        this.high = high;
        this.low = low;
        this.close = close;
        this.range = range;
        this.x = x;
        this.y = y;

        this.scale = this.range.containerHeight / (this.range.highestHigh - this.range.lowestLow);

        this.candleGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    }

    // body of the candle as a rectangle svg element
    body() {

        const sizes = {
            bodySize: Math.abs(this.open - this.close),
            candle_size: this.high - this.low,
            upperShadowSize: this.open > this.close ? this.high - this.open : this.high - this.close,
            lowerShadowSize: this.open > this.close ? this.close - this.low : this.open - this.low,
        };

        // temp properties
        let rawWidth = this.range.containerWidth / this.range.length;
        let width = rawWidth * 0.75;
        let x = this.index * rawWidth + (rawWidth - width) / 2;
        let y = (this.range.highestHigh - this.high) * this.scale;

        for (let s in sizes) {
            sizes[s] = sizes[s] * this.scale;
        }

        // body of the candle as a rectangle svg element
        this.bodyElement = document.createElementNS('http://www.w3.org/2000/svg', 'rect');

        this.bodyElement.setAttributeNS(null, 'x', x.toString());
        this.bodyElement.setAttributeNS(null, 'y', (y + sizes.upperShadowSize).toString());
        this.bodyElement.setAttributeNS(null, 'width', width.toString());
        this.bodyElement.setAttributeNS(null, 'height', sizes.bodySize.toString());

        // add class to the body
        if (this.open < this.close) {
            this.bodyElement.classList.add('bull');
        } else {
            this.bodyElement.classList.add('bear');
        }
        this.candleGroup.classList.add('candle');

        // upper shadow of the candle as a line svg element
        this.upperShadowElement = document.createElementNS('http://www.w3.org/2000/svg', 'line');

        this.upperShadowElement.setAttributeNS(null, 'x1', (x + width / 2).toString());
        this.upperShadowElement.setAttributeNS(null, 'y1', y.toString());
        this.upperShadowElement.setAttributeNS(null, 'x2', (x + width / 2).toString());
        this.upperShadowElement.setAttributeNS(null, 'y2', (y + sizes.upperShadowSize).toString());
        this.upperShadowElement.setAttributeNS(null, 'stroke', 'black');


        // lower shadow of the candle as a line svg element
        this.lowerShadowElement = document.createElementNS('http://www.w3.org/2000/svg', 'line');

        this.lowerShadowElement.setAttributeNS(null, 'x1', (x + width / 2).toString());
        this.lowerShadowElement.setAttributeNS(null, 'y1', (y + sizes.upperShadowSize + sizes.bodySize).toString());
        this.lowerShadowElement.setAttributeNS(null, 'x2', (x + width / 2).toString());
        this.lowerShadowElement.setAttributeNS(null, 'y2', (y + sizes.bodySize + sizes.lowerShadowSize + sizes.upperShadowSize).toString());
        this.lowerShadowElement.setAttributeNS(null, 'stroke', 'black');

        // add event listener
        this.candleGroup.addEventListener('click', this.onClick.bind(this));

        // Set transform-origin dynamically
        this.candleGroup.style.transformOrigin = `${width / 2 + x}px ${y + sizes.upperShadowSize + sizes.bodySize / 2}px`;

        this.candleGroup.appendChild(this.bodyElement);
        this.candleGroup.appendChild(this.upperShadowElement);
        this.candleGroup.appendChild(this.lowerShadowElement);
        return this.candleGroup;
    }

    onClick() {
        console.log('clicked');
        this.candleGroup.classList.toggle('scale-up');
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const ohlcData = {
        'date': [1, 2, 3, 4, 5, 6],
        'open': [2.7, 2, 3.5, 6.2, 5, 4],
        'high': [3.2, 4.9, 7, 6.5, 5.6, 5.3],
        'low': [1, 2, 2.8, 3.6, 3.4, 3.9],
        'close': [1.6, 4, 6, 4.9, 3.5, 4.2]
    };

    let lowestLow = Math.min(...ohlcData.low);
    let highestHigh = Math.max(...ohlcData.high);

    let range = {
        highestHigh: highestHigh,
        lowestLow: lowestLow,
        length: ohlcData.date.length,
    };

    let container = document.getElementById('test');
    let containerStyle = window.getComputedStyle(container);

    range['containerHeight'] = parseInt(containerStyle.height);
    range['containerWidth'] = parseInt(containerStyle.width);
    console.log(range.containerHeight, range.containerWidth);

    let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

    // set the width and height of the svg element
    svg.setAttributeNS(null, 'width', '100%');
    svg.setAttributeNS(null, 'height', '100%');

    // draw the first candle
    for (let i = 0; i < ohlcData.date.length; i++) {
        let candle1 = new candle(i, ohlcData.open[i], ohlcData.high[i], ohlcData.low[i], ohlcData.close[i], range);
        svg.appendChild(candle1.body());
    }
    // let candle1 = new candle(ohlcData.date[0], ohlcData.open[0], ohlcData.high[0], ohlcData.low[0], ohlcData.close[0], range);
    // svg.appendChild(candle1.body());
    container.appendChild(svg);
});
