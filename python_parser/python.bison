%lex

%%
\s+                   /* skip */
^[^\d\W]\w*           return 'IDENTIFIER';
[0-9]+("."[0-9]+)?\b  return 'NUMBER';
"-"                   return "-";
"+"                   return "+";
"/"                   return "/";
"*"                   return "*";
"("                   return "(";
")"                   return ")";
"="                   return "=";
"TOKEN_INDENT"        return "INDENT";
"TOKEN_DEDENT"        return "DEDENT";
<<EOF>>               return "EOF";

/lex

/* Operator Precedence */

%left '='
%left '+' '-'
%left '/' '*'
%left '^'

%start expressions

%%

expressions 
  : e EOF { return $1; };

e : e[l] "+" e[r]
    { $$ = { ast: { kind: '+', l: $l, r: $r }, range: { start: {row: @l.first_line, column: @l.first_column}, end: {row: @r.last_line, column: @r.last_column} } } }
  | e[l] "-" e[r] 
    { $$ = { ast: { kind: '-', l: $l, r: $r }, range: { start: {row: @l.first_line, column: @l.first_column}, end: {row: @r.last_line, column: @r.last_column} } } }
  | e[l] "*" e[r]
    { $$ = { ast: { kind: '*', l: $l, r: $r }, range: { start: {row: @l.first_line, column: @l.first_column}, end: {row: @r.last_line, column: @r.last_column} } } }
  | e[l] "/" e[r] 
    { $$ = { ast: { kind: '/', l: $l, r: $r }, range: { start: {row: @l.first_line, column: @l.first_column}, end: {row: @r.last_line, column: @r.last_column} } } }
  | e[l] "=" e[r]
    { $$ = { ast: { kind: '=', l: $l, r: $r }, range: { start: {row: @l.first_line, column: @l.first_column}, end: {row: @r.last_line, column: @r.last_column} } } }
  | '(' e[exp] ')'
    { $$ = $exp; }
  | IDENTIFIER
    { $$ = {ast: { kind: 'id', value: yytext }, range: { start: {row: @0.first_line, column: @0.first_column}, end: {row: @0.last_line, column: @0.last_column} } } }
  | NUMBER
    { $$ = {ast: { kind: 'float', value: Number(yytext) }, range: { start: {row: @0.first_line, column: @0.first_column}, end: {row: @0.last_line, column: @0.last_column} } } };