export interface SourcePosition {
    row: number;
    column: number;
}
export interface SourceRange {
    start: SourcePosition;
    end: SourcePosition;
}
export declare let mk_range: (sr: number, sc: number, er: number, ec: number) => {
    start: {
        row: number;
        column: number;
    };
    end: {
        row: number;
        column: number;
    };
};
