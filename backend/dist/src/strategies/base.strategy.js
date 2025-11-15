export class BaseStrategy {
    config;
    constructor(config) {
        this.config = config;
    }
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }
    getConfig() {
        return this.config;
    }
}
//# sourceMappingURL=base.strategy.js.map