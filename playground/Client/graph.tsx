import * as latex from 'katex'
import * as React from "react"
import * as html2canvas from "html2canvas"
import * as ReactDOM from "react-dom"
import { Mode } from "monadic_react"

export type GraphNode = {
    id: number,
    x: number,
    y: number,
    color: string,
    highlighting: "none" | string,
    content: string
}

export type GraphLink = {
    source_id: number,
    target_id: number,
    type: "line" | "arrow",
    weight: number,
    color: string
}

export type Graph = {
    Nodes: GraphNode[]
    Links: GraphLink[]
}

interface GraphComponentProps { content:string, set_content:(_:string) => void, mode:Mode }

interface GraphComponentState {
    validating: boolean
    correct: boolean
    errors: string[]
}

export class GraphComponent extends React.Component<GraphComponentProps, GraphComponentState> {
    // Parent of the <canvas> element
    public canvasContainer: HTMLDivElement

    // The <canvas> element
    public canvas: HTMLCanvasElement

    // Drawing context of the canvas
    public canvasContext: CanvasRenderingContext2D


    constructor(props: GraphComponentProps, context?: any) {
      super(props, context)

      this.state = { validating: false, correct: false, errors: []}
      this.validateGraphData = this.validateGraphData.bind(this)
      this.validateNode = this.validateNode.bind(this)
      this.drawNode = this.drawNode.bind(this)
    }

    componentDidMount() {
      let ctx = this.canvas.getContext('2d')
      if (ctx != null) this.canvasContext = ctx

      try {
        this.drawGraph(JSON.parse(this.props.content))
      } catch (error) {

      }
    }

    shouldComponentUpdate(new_props: GraphComponentProps) {
      return new_props.content != this.props.content
    }

    componentWillReceiveProps(new_props: GraphComponentProps) {
      if (new_props.content != this.props.content) {
        try {
          this.drawGraph(JSON.parse(new_props.content))
        } catch (error) {
        }
      }
      // this.state.validating == false ?
      //     this.setState({...this.state, validating: true}, () => this.validateGraphData(props.content))
      // : null
    }

    isArray(variable) {
      return typeof variable == 'undefined' ? false : Array.isArray(variable)
    }

    validateNode(node: GraphNode): string {
      if (typeof node.id != 'number' || typeof node.x != 'number' || typeof node.y != 'number') {
          return "The properties id, x and y of a node must be numbers"
      }

      return ""
    }

    validateLink(link: GraphLink) : string {
      if (typeof link.source_id != 'number' || typeof link.target_id != 'number') {
          return "The properties source_id and target_id of a link must be both numbers"
      }

      if (link.type != "line" && link.type != "arrow" && link.type != "dotted line") {
          return `The property 'type' of a link can only be 'line', 'arrow' or 'dotted line'`
      }

      return ""
    }

    validateGraphData(graphData) {
        try {
            let errors = Array<string>()
            let parsedGraph = JSON.parse(graphData) as Graph

            // Check if the Nodes and Links does exists
            if (this.isArray(parsedGraph.Nodes) == false) {
                errors.push("The 'Nodes' property does not exists or is not an array")
            }

            if (this.isArray(parsedGraph.Links) == false) {
                errors.push("The 'Links' property does not exists or is not an array")
            }

            // If 'nodes' and 'link' are both arrays, check the content
            if (errors.length == 0)
            {
                parsedGraph.Nodes.forEach((node) => {
                    let validationOutput = this.validateNode(node)

                    validationOutput != null ? errors.push(validationOutput + `, check the following node:\n${JSON.stringify(node)}`) : null
                })

                parsedGraph.Links.forEach((link) => {
                    let validationOutput = this.validateLink(link)

                    validationOutput != null ? errors.push(validationOutput + `, check the following node:\n${JSON.stringify(link)}`) : null
                })
            }

            // If the content of 'nodes' and 'links' are correct check the relations
            if (errors.length == 0) {
                parsedGraph.Links.forEach((link) => {
                    let foundNodes = parsedGraph.Nodes.filter((node) => (node.id == link.source_id || node.id == link.target_id)).length

                    foundNodes == 2 ? null : errors.push(`The target_id and source_id of a link must refer to a existing node, check the following link:\n${JSON.stringify(link)}`)
                })
            }

            this.setState({validating: false, errors: errors, correct: errors.length == 0}, () => {
                this.state.errors.length == 0 ? this.drawGraph(parsedGraph) : null
            })
        } catch(e) {
            this.setState({validating: false, correct: false, errors: [e.toString()]})
        }
    }

    drawNode(node: GraphNode) {
        this.canvasContext.beginPath()
        this.canvasContext.arc(node.x, node.y, 30, 0, 2 * Math.PI, false)
        this.canvasContext.fillStyle = node.color === undefined ? "#00a3ff" : node.color
        this.canvasContext.fill()

        this.canvasContext.strokeStyle = node.highlighting === undefined ? '#000000' : node.highlighting
        this.canvasContext.stroke()
    }

    drawLink(link: GraphLink, source: GraphNode, target: GraphNode) {
        this.canvasContext.beginPath()
        this.canvasContext.moveTo(source.x, source.y)
        this.canvasContext.lineTo(target.x, target.y)
        this.canvasContext.strokeStyle = link.color === undefined ? '#000000' : link.color
        this.canvasContext.stroke()

        if (link.type == "arrow") {
            this.canvasContext.fillStyle = link.color === undefined ? '#000000' : link.color
            this.drawArrowHead(source, target)
        }

        if (link.weight !== undefined) {
            // Calculate middle of the line
            let x = Math.abs((target.x + source.x) / 2)
            let y = Math.abs((target.y + source.y) / 2)

            this.canvasContext.beginPath()
            this.canvasContext.rect(x - 15, y - 10, 30, 20)
            this.canvasContext.fillStyle = '#fff'
            this.canvasContext.fill()

            this.canvasContext.beginPath()
            this.canvasContext.font = "18px Arial"
            this.canvasContext.textBaseline = "middle"
            this.canvasContext.textAlign="center"
            this.canvasContext.fillStyle = '#000'
            this.canvasContext.fillText(link.weight.toString(), x, y);
        }
    }

    drawArrowHead(source: GraphNode, target: GraphNode){
        // Calculate arrow position
        let distance = Math.sqrt(Math.pow((source.y - target.y), 2) + Math.pow((source.x - target.x), 2))
        let angle = Math.atan2((target.y - source.y), (source.x - target.x))

        let arrowX = target.x + (30 * Math.cos(angle))
        let arrowY = target.y - (30 * Math.sin(angle))

        this.canvasContext.beginPath()

        //Move to postion
        this.canvasContext.translate(arrowX, arrowY)

        // Rotate
        this.canvasContext.rotate(- (angle + (Math.PI / 2)))

        // Draw arrow
        this.canvasContext.moveTo(0, 0)
        this.canvasContext.lineTo(-7.5, 10)
        this.canvasContext.lineTo(7.5, 10)
        this.canvasContext.fill()

        // Rotate and translate back
        this.canvasContext.rotate(angle + (Math.PI / 2))
        this.canvasContext.translate(-arrowX, - arrowY)
    }

    drawContent(node: GraphNode) {
      this.canvasContext.font = "30px Arial"
      this.canvasContext.textBaseline = "middle"
      this.canvasContext.textAlign="center"
      this.canvasContext.fillStyle = "#000"
      this.canvasContext.fillText(node.content, node.x, node.y);
      // let tmp_element = document.createElement("div")
      // tmp_element.style.background='rgba(0,0,0,0)'
      // document.body.appendChild(tmp_element)
      // latex.render(node.content, tmp_element)
      // html2canvas(tmp_element).then(tex_canvas => {
      //   this.canvasContext.drawImage(tex_canvas, 0, 0, 50, 50, node.x + 20, node.y + 20, 30, 30)
      //   document.body.removeChild(tmp_element)
      // })
}

    drawGraph(graph: Graph) {
        let width = 0
        let height = 0

        // Find edge nodes
        graph.Nodes.forEach((node) => {
            node.x > width ? width = node.x : null
            node.y > height ? height = node.y : null
        })

        this.canvas.width = width + 66
        this.canvas.height = height + 120

        // Clear the canvas before drawing
        this.canvasContext.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Change the draw origin to create offset on the left and top corner
        this.canvasContext.translate(32, 32);

        // Translate the canvas to create a offset
        this.canvasContext.lineWidth = 2

        graph.Links.forEach((link) => {
            let source = graph.Nodes.filter((n) => n.id == link.source_id)[0]
            let target = graph.Nodes.filter((n) => n.id ==  link.target_id)[0]

            this.drawLink(link, source, target)
        })

        graph.Nodes.forEach((node) => {
            this.drawNode(node)

            if (node.content !== undefined)
            {
                this.drawContent(node)
            }
        })

        this.canvasContext.translate(-32, -32);
    }

    render() {
        return (<div>
            {
              this.props.mode == "edit" ?
                <textarea value={this.props.content} onChange={e => {
                  this.props.set_content(e.target.value)
                }
                } />
              : null
            }
            <div className="canvas-container" ref={(el) => { if (el) this.canvasContainer = el } }>
                {this.state.correct == false ?
                    this.state.errors.map((e, i) => <div className="canvas__error"><p key={i}>{e}</p></div>)
                    : null}

                <canvas ref={(el) => { if (el) this.canvas = el } }></canvas>
            </div>
          </div>
        )
    }
}