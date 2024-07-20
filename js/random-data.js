class RandomData {
    constructor(magnitude, length, initialPrice) {
        this.magnitude = magnitude;
        this.length = length;
        this.initialPrice = initialPrice;
        this.date = [];
        this.open = [];
        this.high = [];
        this.low = [];
        this.close = [];
    }

    generate() {
        let price = this.initialPrice;
        for (let i = 0; i < this.length; i++) {
            this.date.push(i);
            this.open.push(price);
            this.close.push(price + gaussianRandom(0, this.magnitude));
            this.high.push(Math.max(price, this.close[i],
                Math.max(price, this.close[i]) + gaussianRandom(this.magnitude / 4, this.magnitude / 4)));
            this.low.push(Math.min(price, this.close[i],
                Math.min(price, this.close[i]) - gaussianRandom(this.magnitude / 4, this.magnitude / 4)));
            price = this.close[i] + gaussianRandom(0, this.magnitude / 100);
        }

        return {date: this.date, open: this.open, high: this.high, low: this.low, close: this.close};
    }
}

function gaussianRandom(mean = 0, stdev = 1) {
    const u = 1 - Math.random(); // Converting [0,1) to (0,1]
    const v = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    // Transform to the desired mean and standard deviation:
    return z * stdev + mean;
}