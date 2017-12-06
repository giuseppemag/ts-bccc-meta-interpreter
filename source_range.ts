export interface SourcePosition { row:number, column:number }
export interface SourceRange { start:SourcePosition, end:SourcePosition }
export let mk_range = (sr:number, sc:number, er:number, ec:number) => ({ start:{row:sr, column:sc}, end:{row:er, column:ec} })
