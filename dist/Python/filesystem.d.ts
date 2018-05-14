import * as Immutable from 'immutable';
import { Sum, Unit } from 'ts-bccc';
import { ErrVal, ExprRt, MemRt, SourceRange, Val } from '../main';
import { Coroutine } from "../fast_coroutine";
export interface File {
    content: string;
}
export declare type FileSystem = Immutable.Map<string, File>;
export declare const get_fs: ExprRt<FileSystem>;
export declare const set_fs: (fs: Immutable.Map<string, File>) => Coroutine<MemRt, ErrVal, Unit>;
export declare const attr_map: (attr0: Immutable.List<Coroutine<MemRt, ErrVal, Sum<Val, Val>>>) => Coroutine<MemRt, ErrVal, Immutable.Map<string, string>>;
export declare let set_file: (r: SourceRange, path: Coroutine<MemRt, ErrVal, Sum<Val, Val>>, content: Coroutine<MemRt, ErrVal, Sum<Val, Val>>) => Coroutine<MemRt, ErrVal, Sum<Val, Val>>;
export declare let set_file_from_block: (r: SourceRange, path: Coroutine<MemRt, ErrVal, Sum<Val, Val>>, attr: Immutable.List<Coroutine<MemRt, ErrVal, Sum<Val, Val>>>) => Coroutine<MemRt, ErrVal, Sum<Val, Val>>;
export declare let get_file: (r: SourceRange, path: Coroutine<MemRt, ErrVal, Sum<Val, Val>>) => Coroutine<MemRt, ErrVal, Sum<Val, Val>>;
export declare let exists: (path: Coroutine<MemRt, ErrVal, Sum<Val, Val>>) => Coroutine<MemRt, ErrVal, Sum<Val, Val>>;
export declare let copy_file: (r: SourceRange, path_from: Coroutine<MemRt, ErrVal, Sum<Val, Val>>, path_to: Coroutine<MemRt, ErrVal, Sum<Val, Val>>) => Coroutine<MemRt, ErrVal, Sum<Val, Val>>;
export declare let move_file: (r: SourceRange, path_from: Coroutine<MemRt, ErrVal, Sum<Val, Val>>, path_to: Coroutine<MemRt, ErrVal, Sum<Val, Val>>) => Coroutine<MemRt, ErrVal, Sum<Val, Val>>;
export declare const init_fs: (files: Immutable.List<Coroutine<MemRt, ErrVal, Sum<Val, Val>>>) => Coroutine<MemRt, ErrVal, Sum<Val, Val>>;
export declare let delete_file: (r: SourceRange, path: Coroutine<MemRt, ErrVal, Sum<Val, Val>>) => Coroutine<MemRt, ErrVal, Sum<Val, Val>>;
export declare const fs_and_prg: (fs: Coroutine<MemRt, ErrVal, Sum<Val, Val>>, prg: Coroutine<MemRt, ErrVal, Sum<Val, Val>>) => Coroutine<MemRt, ErrVal, Sum<Val, Val>>;
