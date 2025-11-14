import { OHLCVData } from '../strategies/base.strategy.js';
export declare class SimpleMLPredictor {
    private model;
    constructor();
    predict(data: OHLCVData[]): number;
    train(data: OHLCVData[]): void;
}
//# sourceMappingURL=predictor.d.ts.map