
/*
* simple implementation of the rate limiter using
* local memory. I Token bucket approach. I found it on
* https://blog.logrocket.com/rate-limiting-node-js/
* This blog also explains other types of rate limit algorithms.
*/

class RateLimiter {
    constructor(interval, set_num) {
        this.interval = interval;
        this.set_num = set_num-1;
        this.map = new Map();
    }

    // given id and timestamp check the bucket. If
    // no bucket exists, create one.
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

    // clean cache. It will only clean records that are 
    // irrelevant.
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