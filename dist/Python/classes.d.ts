import { Unit, Sum } from "ts-bccc";
import { Expr, Interface, Val, Lambda, HeapRef } from "./memory";
export declare let declare_class: (C_name: string, int: Interface) => Expr<Unit>;
export declare let field_get: (F_name: string, this_addr: HeapRef) => Expr<Val>;
export declare let field_set: (F_name: string, new_val_expr: Expr<Val>, this_addr: HeapRef) => Expr<Unit>;
export declare let resolve_method: (M_name: string, C_def: Interface) => Sum<Lambda, Unit>;
export declare let call_method: (M_name: string, this_addr: Val, args: Expr<Val>[]) => Expr<Val>;
export declare let call_cons: (C_name: string, args: Expr<Val>[]) => Expr<Val>;
