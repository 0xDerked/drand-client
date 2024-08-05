import {Chain, ChainClient, ChainOptions, defaultChainOptions, RandomnessBeacon} from './index';
import { defaultHttpOptions, HttpOptions, jsonOrError } from './util';

class HttpChainClient implements ChainClient {

    constructor(
        private someChain: Chain,
        public options: ChainOptions = defaultChainOptions,
        public httpOptions: HttpOptions = defaultHttpOptions) {    
    }

    async get(roundNumber: number): Promise<RandomnessBeacon> {
        const url = withCachingParams(`${this.someChain.baseUrl}/public/${roundNumber}`, this.options)
        return await jsonOrError(url, this.httpOptions)
    }

    async latest(): Promise<RandomnessBeacon> {
        const url = withCachingParams(`${this.someChain.baseUrl}/public/latest`, this.options)
        return await jsonOrError(url, this.httpOptions)
    }

    chain(): Chain {
        return this.someChain;
    }
}

class HttpCachingChainClient implements ChainClient {
    
    private beaconCache: Map<number, RandomnessBeacon> = new Map()

    constructor(
        private someChain: Chain,
        public options: ChainOptions = defaultChainOptions,
        public httpOptions: HttpOptions = defaultHttpOptions) {
    }

    async get(roundNumber: number): Promise<RandomnessBeacon> {
        const cachedBeacon = this.beaconCache.get(roundNumber)
        if (cachedBeacon) {
            return cachedBeacon
        }

        const url = withCachingParams(`${this.someChain.baseUrl}/public/${roundNumber}`,this.options)
        const beacon = await jsonOrError(url, this.httpOptions)

        this.beaconCache.set(roundNumber, beacon)

        return beacon
    }

    async latest(): Promise<RandomnessBeacon> {
        const url = withCachingParams(`${this.someChain.baseUrl}/public/latest`,this.options)
        const beacon = await jsonOrError(url, this.httpOptions)

        this.beaconCache.set(beacon.round, beacon)

        return beacon
    }

    chain(): Chain {
        return this.someChain
    }

    clearBeaconCache(): void {
        this.beaconCache.clear()
    }
}

function withCachingParams(url: string, config: ChainOptions): string {
    if (config.noCache) {
        return `${url}?${Date.now()}`
    }
    return url
}

export {HttpCachingChainClient}
export default HttpChainClient
