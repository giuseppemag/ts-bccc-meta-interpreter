"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var pos_to_string = function () { return "(" + this.row + "," + this.column + ")"; };
exports.mk_range = function (sr, sc, er, ec) {
    return ({ start: { row: sr, column: sc, to_string: pos_to_string }, end: { row: er, column: ec, to_string: pos_to_string }, to_string: function () { return this.start.to_string() + " - " + this.end.to_string(); } });
};
var lt = function (r1, r2) { return r1.row < r2.row || (r1.row == r2.row && r1.column < r2.column); };
exports.join_source_ranges = function (r1, r2) {
    var s = lt(r1.start, r2.start) ? r1.start : r2.start;
    var e = lt(r1.end, r2.end) ? r2.end : r1.end;
    return exports.mk_range(s.row, s.column, e.row, e.column);
};
exports.max_source_range = function (r1, r2) {
    if (lt(r1.start, r2.start))
        return r2;
    else
        return r1;
};
exports.zero_range = exports.mk_range(0, 0, 0, 0);
