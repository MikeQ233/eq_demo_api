class RateLimiter {
    constructor(interval, set_num) {
        this.interval = interval;
        this.set_num = set_num-1;
        this.map = new Map();
    }

    check_limit(id, timestamp) {
        const item = this.map.get(id);
        if (item) {
            if (timestamp > item.timestamp) {
                item.timestamp = timestamp + this.interval;
                item.num = this.set_num;
                this.map.set(id, item);
                return true;
            } else if (item.num > 0) {
                item.num -= 1;
                return true;
            } else {
                return false;
            }
        } else {
            this.map.set(id, {
                timestamp: timestamp+this.interval, 
                num: this.set_num
            })
            // console.log({
            //     timestamp: timestamp+this.interval, 
            //     num: this.set_num+1
            // })
            return true;
        }
    }

    clean_cache(timestamp) {
        this.map.forEach((value, key) => {
            if (timestamp > value.timestamp) {
                this.map.delete(key);
            }
        })
    }
}

module.exports = {
    RateLimiter: RateLimiter,
    second: 1000,
    minute: 60*1000,
    hour: 60*60*1000
}