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

    // drawing the horizontal grid lines
    let horizontalLines = new HorizontalLines(range);
    svg.appendChild(horizontalLines.lines());

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
    const randomData = new RandomData(0.5, 100, 100);
    let ohlcData = randomData.generate();
    try {
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

    document.getElementById("random-data").addEventListener("click", function () {
        // const randomData = new RandomData(0.5, 100, 100);
        ohlcData = randomData.generate();
        drawCandles(container, ohlcData);
    });
});
