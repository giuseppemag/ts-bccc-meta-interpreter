export interface SourcePosition {
    row: number;
    column: number;
    to_string: () => string;
}
export interface SourceRange {
    start: SourcePosition;
    end: SourcePosition;
    to_string: () => string;
}
export declare let mk_range: (sr: number, sc: number, er: number, ec: number) => SourceRange;
export declare let join_source_ranges: (r1: SourceRange, r2: SourceRange) => SourceRange;
export declare let max_source_range: (r1: SourceRange, r2: SourceRange) => SourceRange;
export declare let zero_range: SourceRange;
