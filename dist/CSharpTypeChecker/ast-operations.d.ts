import * as Immutable from 'immutable';
import { CallingContext, Type, Stmt } from './types';
import { ParserRes } from './grammar';
export declare let global_calling_context: CallingContext;
export declare let extract_tuple_args: (n: ParserRes) => ParserRes[];
export declare let ast_to_type_checker: (substitutions: Immutable.Map<string, Type>) => (n: ParserRes) => (context: CallingContext) => Stmt;
