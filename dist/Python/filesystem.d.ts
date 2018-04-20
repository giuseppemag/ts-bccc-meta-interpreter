import * as Immutable from 'immutable';
import { Sum, Unit } from 'ts-bccc';
import { ExprRt, SourceRange, Val } from '../main';
export interface File {
    content: string;
}
export declare type FileSystem = Immutable.Map<string, File>;
export declare const get_fs: ExprRt<FileSystem>;
export declare const set_fs: (fs: Immutable.Map<string, File>) => ExprRt<Unit>;
export declare const attr_map: (attr0: Immutable.List<ExprRt<Sum<Val, Val>>>) => ExprRt<Immutable.Map<string, string>>;
export declare let set_file: (r: SourceRange, path: ExprRt<Sum<Val, Val>>, content: ExprRt<Sum<Val, Val>>) => ExprRt<Sum<Val, Val>>;
export declare let set_file_from_block: (r: SourceRange, path: ExprRt<Sum<Val, Val>>, attr: Immutable.List<ExprRt<Sum<Val, Val>>>) => ExprRt<Sum<Val, Val>>;
export declare let get_file: (r: SourceRange, path: ExprRt<Sum<Val, Val>>) => ExprRt<Sum<Val, Val>>;
export declare let exists: (path: ExprRt<Sum<Val, Val>>) => ExprRt<Sum<Val, Val>>;
export declare let copy_file: (r: SourceRange, path_from: ExprRt<Sum<Val, Val>>, path_to: ExprRt<Sum<Val, Val>>, overwrite: ExprRt<Sum<Val, Val>>) => ExprRt<Sum<Val, Val>>;
export declare let move_file: (r: SourceRange, path_from: ExprRt<Sum<Val, Val>>, path_to: ExprRt<Sum<Val, Val>>) => ExprRt<Sum<Val, Val>>;
export declare const init_fs: (files: Immutable.List<ExprRt<Sum<Val, Val>>>) => ExprRt<Sum<Val, Val>>;
export declare let delete_file: (r: SourceRange, path: ExprRt<Sum<Val, Val>>) => ExprRt<Sum<Val, Val>>;
export declare const fs_and_prg: (fs: ExprRt<Sum<Val, Val>>, prg: ExprRt<Sum<Val, Val>>) => ExprRt<Sum<Val, Val>>;
