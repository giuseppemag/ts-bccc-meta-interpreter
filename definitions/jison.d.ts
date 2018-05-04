declare module Jison
{
    export class Parser {
        constructor(grammar:any);
        generate():string;
        parse(program:string):any;
    }
}

declare module "jison"
{
    export = Jison;
}