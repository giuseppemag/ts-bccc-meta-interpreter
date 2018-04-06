export interface SourcePosition { row:number, column:number, to_string:() => string }
let pos_to_string = function(this:SourcePosition) { return `(${this.row},${this.column})` }
export interface SourceRange { start:SourcePosition, end:SourcePosition, to_string:() => string }
export let mk_range = (sr:number, sc:number, er:number, ec:number) : SourceRange =>
  ({ start:{row:sr, column:sc, to_string:pos_to_string}, end:{row:er, column:ec, to_string:pos_to_string}, to_string:function(this:SourceRange) { return `${this.start.to_string()} - ${this.end.to_string()}` } })
let lt = (r1:SourcePosition, r2:SourcePosition) => r1.row < r2.row || (r1.row == r2.row && r1.column < r2.column)
export let print_range = (r:SourceRange) => `<starting row/column [${r.start.row},${r.start.column}]. Ending row/column [${r.end.row},${r.end.column}]>`
export let join_source_ranges = (r1:SourceRange, r2:SourceRange) => {
  let s = lt(r1.start, r2.start) ? r1.start : r2.start
  let e = lt(r1.end, r2.end)     ? r2.end   : r1.end
  return mk_range(s.row, s.column, e.row, e.column)
}
export let max_source_range = (r1:SourceRange, r2:SourceRange) => {
  if (lt(r1.start, r2.start)) return r2
  else return r1
}

export let zero_range : SourceRange = mk_range(0,0,0,0)
export let minus_two_range : SourceRange = mk_range(-2,-2,-2,-2)
