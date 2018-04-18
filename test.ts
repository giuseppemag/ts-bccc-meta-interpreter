import { co_run, co_unit, Coroutine, Fun, fun, Prod, Sum } from 'ts-bccc';
import * as CCC from 'ts-bccc';
import * as Co from 'ts-bccc';

import * as DebuggerStream from './csharp_debugger_stream';
import * as CSharp from './CSharpTypeChecker/csharp';
import * as Sem from './Python/python';
import { zero_range } from './source_range';

export module ImpLanguageWithSuspend {
  let run_to_end = <S,E,A>(log:(s:string,x:any) => void) : CCC.Fun<Prod<Coroutine<S,E,A>, S>, CCC.Sum<E,CCC.Prod<A,S>>> => {
      let f : CCC.Fun<Prod<Coroutine<S,E,A>, S>, CCC.Sum<E,CCC.Prod<A,S>>> =
          CCC.fun(p => run_to_end<S,E,A>(log).f(p))
      return (co_run<S,E,A>().map_times(fun<S,S>(s => log("Intermediate step:", JSON.stringify(s)) ||
                s))).then(CCC.apply_pair<S, Co.CoPreRes<S,E,A>>()).then(
                CCC.inl<E,CCC.Prod<A,S>>().plus(
                  f.plus(CCC.inr<E,CCC.Prod<A,S>>())))
  }

export let get_stream = DebuggerStream.get_stream

export let test_parser = () => {
    let source = `
class Vector2 {
  double x;
  double y;
  public Vector2(double x, double y){
    this.x = x;
    this.y = y;
  }
  public Vector2 Mul(double c){
    return new Vector2(this.x * c, this.y * c);
  }
  public void Sum(Vector2 v1){
    this.x = this.x + v1.x;
    this.y = this.y + v1.y;
  }
}
public interface MovableObject {
  void Update(double delta_time);
}

class SpaceShip : MovableObject {
  Vector2 position;
  Vector2 velocity;

  public SpaceShip(Vector2 pos, Vector2 vel){
    this.position = pos;
    this.velocity = vel;
  }

  public override void Update(double dt){
    this.position.Sum(this.velocity.Mul(dt));
  }
}

class WarpEngine{
  double current_warp_factor;
  public WarpEngine(){
    this.current_warp_factor = 0.0;
  }
  public void SetWarpFactor(double factor){
    this.current_warp_factor = factor;
  }
  public double GetWarpSpeed(){
    var warp_factor = this.current_warp_factor;
    var speed_light = 1.0;
    return speed_light / Math.pow(warp_factor, 10.0/3.0);
  }
}



public abstract ShipDecorator : MovableObject {
  public MovableObject ship;
  public ShipDecorator(MovableObject ship){
    this.ship = ship;
  }
} 


class EnterpriseNX01 : ShipDecorator {
  private WarpEngine warp_engine;
  public EnterpriseNX01(MovableObject ship):base(ship){
    this.ship = ship;
    this.warp_engine = new WarpEngine();
  }
  public void GoToWarp(double factor){
    this.warp_engine.SetWarpFactor(factor);
  }
  public override void Update(double dt){
    var multiplier = this.warp_engine.GetWarpSpeed();
    this.ship.Update(dt * multiplier);
  }
} 

void main(){
  var p = new Vector2(0.0,0.0);
  var v = new Vector2(10.0,10.0);
  SpaceShip s = new SpaceShip(p, v);
  EnterpriseNX01 nx1 = new EnterpriseNX01(s);
  nx1.GoToWarp(3.0);
  nx1.Update(0.16);
  debugger;
}
main();
typechecker_debugger;
`


    // let hrstart = process.hrtime()

    let output = ""
    let log = function(s:string,x:any) {
      output = output + s + JSON.stringify(x) + "\n\n"
    }

    // let hrdiff = process.hrtime(hrstart)
    // let time_in_ns = hrdiff[0] * 1e9 + hrdiff[1]
    // log(`Timer: ${time_in_ns / 1000000}ms\n Compiler error: `, JSON.stringify(compiler_res.value))

    let stream = get_stream(source)
    while (stream.kind == "step") {
      let show = stream.show()

      //{ highlighting:SourceRange, globals:Scopes, heap:Scope, functions:Immutable.Map<ValueName,Lambda>, classes:Immutable.Map<ValueName, Interface>, stack:Immutable.Map<number, Scopes> }
      log("Step:", show.kind == "bindings" ? show.state : 
                   show.kind == "memory" ? {...show.memory, classes: show.memory.classes.filter(c => c != undefined && !c.is_internal).toMap() } :
                   show)
      stream = stream.next()
    }
    let show = stream.show()
    log("Step:", show.kind == "bindings" ? show.state : 
                 show.kind == "memory" ? {...show.memory, classes: show.memory.classes.filter(c => c != undefined && !c.is_internal).toMap() } :
                 show)

    return output
  }

}

// console.log(ImpLanguageWithSuspend.test_imp())
console.log(ImpLanguageWithSuspend.test_parser())
