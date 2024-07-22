const WIDTH_SCALE = 0.75;
const MIN_SPACING = 24;
const PRICE_WIDTH = 60;
const DATE_WIDTH = 40;
const colors = {
    bullBody: 'lightgreen',
    bearBody: 'lightcoral',
    bullBorder: 'darkgreen',
    bearBorder: 'darkred',
    bullShadow: 'darkgreen',
    bearShadow: 'darkred'
};

let container;

function drawCandles(container, ohlcData, labels = true) {
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
        containerWidth: container.clientWidth - paddings.left - paddings.right,
    };

    if (range.containerWidth === 0 || range.containerHeight === 0) {
        throw new Error("Can't draw the chart in the container with zero width or height, silly!");
    }

    container.innerHTML = '';

    let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    // set the width and height of the svg element
    svg.setAttributeNS(null, 'width', range.containerWidth.toString());
    svg.setAttributeNS(null, 'height', range.containerHeight.toString());
    // svg.setAttributeNS(null, 'viewBox', '0 0 ' + range.containerWidth + ' ' + range.containerHeight);
    svg.style.verticalAlign = 'top';

    // drawing the vertical grid lines
    let verticalLines = new VerticalLines(range, ohlcData, MIN_SPACING, labels);
    svg.appendChild(verticalLines.lines());

    // drawing the horizontal grid lines
    let horizontalLines = new HorizontalLines(range, MIN_SPACING, labels);
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
        let candle = new Candle(i, ohlc, range, labels);
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
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.border = '1px solid black';
    container.style.boxSizing = 'border-box';
    container.style.padding = '10px';
    container.style.position = 'relative';
    mainContainer.appendChild(container);

    const randomData = new RandomData(5, 100, 100);
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
    document.addEventListener('change', function (event) {
        if (event.target.id === 'candle-count') {
            randomData.length = parseInt(event.target.value);
        } else if (event.target.id === 'magnitude') {
            randomData.magnitude = parseInt(event.target.value);
        } else if (event.target.id === 'initial-price') {
            randomData.initialPrice = parseInt(event.target.value);
        }
        if (randomData.length > 1 && randomData.magnitude > 0 && randomData.initialPrice > 0) {
            ohlcData = randomData.generate();
            drawCandles(container, ohlcData);
        }

    });
});
