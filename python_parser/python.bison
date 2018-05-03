%lex

%%
\s+                   /* skip */
^[^\d\W]\w*           return 'IDENTIFIER';
[0-9]+("."[0-9]+)?\b  return 'NUMBER';
"-"                   return "-";
"+"                   return "+";
"/"                   return "/";
"*"                   return "*";
"^"                   return "^";
"("                   return "(";
")"                   return ")";
"["                   return "[";
"]"                   return "]";
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

e : e[left] "+" e[right]      { $$ = { kind: 'add', l: $left, r: $right }; }
  | e[left] "-" e[right]      { $$ = { kind: 'sub', l: $left, r: $right }; }
  | e[left] "*" e[right]      { $$ = { kind: 'mul', l: $left, r: $right }; }
  | e[left] "/" e[right]      { $$ = { kind: 'div', l: $left, r: $right }; }
  | e[left] "^" e[right]      { $$ = { kind: 'pow', l: $left, r: $right }; }
  | '(' e[exp] ')'            { $$ = $exp; }
  | IDENTIFIER "=" e[exp]     { $$ = { kind: 'assignment', id: $1, expression: $exp } }
  | NUMBER                    { $$ = Number(yytext); };