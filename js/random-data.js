class RandomData {
    constructor(magnitude, length, initialPrice) {
        this.magnitude = magnitude;
        this.length = length;
        this.initialPrice = initialPrice;
    }

    generate() {
        this.date = [];
        this.open = [];
        this.high = [];
        this.low = [];
        this.close = [];
        let price = this.initialPrice;
        let digits = -Math.floor(Math.log10(this.magnitude)) + 2;
        digits = digits < 0 ? 0 : digits;
        for (let i = 0; i < this.length; i++) {
            this.date.push(i);
            this.open.push(price);
            this.close.push(Math.round((price + gaussianRandom(0, this.magnitude)) * (10 ** digits)) / (10 ** digits));
            this.high.push(Math.round(Math.max(
                    price, this.close[i], Math.max(price, this.close[i]) + gaussianRandom(this.magnitude / 4, this.magnitude / 4))
                * (10 ** digits)) / (10 ** digits));
            this.low.push(Math.round(Math.min(
                    price, this.close[i], Math.min(price, this.close[i]) + gaussianRandom(this.magnitude / 4, this.magnitude / 4))
                * (10 ** digits)) / (10 ** digits));
            price = Math.round((this.close[i] + gaussianRandom(0, this.magnitude / 100)) * (10 ** digits)) / (10 ** digits);
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