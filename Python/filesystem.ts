import * as Immutable from 'immutable';
import { apply, co_get_state, co_set_state, co_unit, inl, Sum, Unit, co_error } from 'ts-bccc';

import { comm_list_coroutine } from '../ccc_aux';
import { ErrVal, ExprRt, MemRt, mk_string_val, mk_unit_val, runtime_error, SourceRange, Val, mk_bool_val } from '../main';

export interface File { content: string }
export type FileSystem = Immutable.Map<string, File>

export const get_fs: ExprRt<FileSystem> =
  co_get_state<MemRt, ErrVal>().then(st => co_unit(st.fs))

export const set_fs = (fs: FileSystem): ExprRt<Unit> =>
  co_get_state<MemRt, ErrVal>().then(st =>
  co_set_state({ ...st, fs: fs }))

export const attr_map = (attr0: Immutable.List<ExprRt<Sum<Val,Val>>>): ExprRt<Immutable.Map<string, string>> =>
  comm_list_coroutine(attr0).then(attr1 => {
    let attr2 = attr1.toArray().map(a => {
      const t = (a.value.v as Array<Val>)
      const kv: [string, string] = [t[0].v as string, t[1].v as string]
      return kv
    })
    return co_unit(Immutable.Map(attr2))
  })

export let set_file = (r: SourceRange, path: ExprRt<Sum<Val,Val>>, content: ExprRt<Sum<Val,Val>>): ExprRt<Sum<Val,Val>> =>
  get_fs.then(fs =>
  path.then(p_v =>
  content.then(c_v => 
  p_v.value.k !== "s"
    ? runtime_error(r, "Path is not of type 'string'") : 
  c_v.value.k !== "s"
    ? runtime_error(r, "Content is not of type 'string'") : 
  set_fs(fs.set(p_v.value.v, { content: c_v.value.v })).then(_ =>
  co_unit(apply(inl(), mk_unit_val)))))) 

export let set_file_from_block = (r: SourceRange, path: ExprRt<Sum<Val,Val>>, attr: Immutable.List<ExprRt<Sum<Val,Val>>>): ExprRt<Sum<Val,Val>> =>
  attr_map(attr).then(attr_v =>
    attr_v.has("content") 
      ? set_file(r, path, co_unit(apply(inl(), mk_string_val(attr_v.get("content")))))
      : co_error<MemRt, ErrVal, Sum<Val,Val>>({ range: r, message: "Every file must specify a property 'content'" }))

export let get_file = (r: SourceRange, path: ExprRt<Sum<Val,Val>>): ExprRt<Sum<Val,Val>> =>
  get_fs.then(fs =>
  path.then(p_v => 
  fs.has(p_v.value.v as string)
    ? co_unit(
      apply<Val, Sum<Val,Val>>(
        inl<Val, Val>(), 
        mk_string_val(fs.get(p_v.value.v as string).content)))
    : runtime_error(r, `There is no file at path: '${p_v.value.v}'`)))

export let exists = (path: ExprRt<Sum<Val, Val>>): ExprRt<Sum<Val, Val>> =>
  path.then(p_v => 
  get_fs.then(fs =>
  co_unit(apply(inl(), mk_bool_val(fs.has(p_v.value.v as string))))))

export let copy_file = (r: SourceRange, path_from: ExprRt<Sum<Val,Val>>, path_to: ExprRt<Sum<Val,Val>>): ExprRt<Sum<Val, Val>> =>
  path_from.then(pf_v => path_to.then(pt_v => 
    get_file(r, co_unit(pf_v)).then(f_v =>
    set_file(r, co_unit(pt_v), co_unit(f_v)))))

export let move_file = (r: SourceRange, path_from: ExprRt<Sum<Val,Val>>, path_to: ExprRt<Sum<Val,Val>>): ExprRt<Sum<Val, Val>> =>
  copy_file(r, path_from, path_to).then(_ => delete_file(r, path_from))

export const init_fs = (files: Immutable.List<ExprRt<Sum<Val, Val>>>): ExprRt<Sum<Val,Val>> =>
  comm_list_coroutine(files).then(_ =>
  co_unit(apply(inl(), mk_unit_val)))

export let delete_file = (r: SourceRange, path: ExprRt<Sum<Val,Val>>): ExprRt<Sum<Val,Val>> =>
  path.then(p_v =>
  get_fs.then(fs =>
  set_fs(fs.delete(p_v.value.v as string)).then(_ =>
  co_unit(apply(inl(), mk_unit_val)))))
  
export const fs_and_prg = (fs: ExprRt<Sum<Val, Val>>, prg: ExprRt<Sum<Val, Val>>): ExprRt<Sum<Val, Val>> =>
  fs.then(_ => 
  prg.then(_ => 
  co_unit(apply(inl(), mk_unit_val))))