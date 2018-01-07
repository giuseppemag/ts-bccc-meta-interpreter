//import asciimath2latex from 'asciimath-to-latex'
import * as katex from 'katex'

const mathBlock = (code) => {
  let tex = ''
  code.split(/(?:\n\s*){2,}/).forEach((line) => { // consecutive new lines means a new formula
    try {
      tex += katex.renderToString(line.trim(), { displayMode: true })
    } catch (err) {
      tex += `<pre>${err}</pre>`
    }
  })
  return `<div>${tex}</div>`
}
const variable = function (state) {
  var variableStart = state.src.indexOf("$", state.pos);
  var variableEnd = state.src.indexOf("$", variableStart + 1);

  if (variableStart !== -1 && variableEnd !== -1) {
    const content = state.src.slice(variableStart, variableEnd + 1);

    if (!content.match(/\r\n|\r|\n/g)) {
      var token = state.push("markdown-it-variable", "span", 0);
      token.attrs = [
        ["class", "test-variable test-variable-with-tooltip"],
        ["title", "This represents a test variable and will be replaced during testing if configured"]];
      token.content = content;
      token.markup = content;
    } else {
      state.pending += state.src.slice(state.pos, variableEnd + 1);
    }
    state.pos = variableEnd + 1;
    return true;
  }

  state.pending += state.src.slice(state.pos, state.maxPos);
  state.pos = state.maxPos;
  return true;
};


const LatexPlugin = (md) => {
  md.inline.ruler.push("markdown-it-variable", variable, { alt: [] });

  md.renderer.rules["markdown-it-variable"] = function (tokens, idx, _opts, _env, self) {
      const token = tokens[idx];
      let code = tokens[idx].content


      if (code.startsWith('$') && code.endsWith('$')) { // inline math
        code = code.substr(1, code.length - 2)
        try {
          return katex.renderToString(code)
        } catch (err) {

          return `<code>${err}</code>`
        }
      }
      return temp1(tokens, idx, _opts, _env, self)
      // return '<span' + self.renderAttrs(token) + '>' + tokens[idx].content + '</span>';
  };

  // inline math
  const temp1 = md.renderer.rules.code_inline.bind(md.renderer.rules)
  md.renderer.rules.code_inline = (tokens, idx, options, env, slf) => {
    let code = tokens[idx].content


    if (code.startsWith('$') && code.endsWith('$')) { // inline math
      code = code.substr(1, code.length - 2)
      try {
        return katex.renderToString(code)
      } catch (err) {
        return `<code>${err}</code>`
      }
    }
    return temp1(tokens, idx, options, env, slf)
  }

  // fenced math block
  const temp2 = md.renderer.rules.fence.bind(md.renderer.rules)
  md.renderer.rules.fence = (tokens, idx, options, env, slf) => {
    let token = tokens[idx]
    let code = token.content.trim()
    if (token.info === 'math' || token.info === 'katex') { // math
      return mathBlock(code)
    }
    // if (/^ascii-?math/i.test(token.info)) {
    //   code = code.split(/(?:\n\s*){2,}/).map((item) => { return asciimath2latex(item) }).join('\n\n')
    //   return mathBlock(code)
    // }
    return temp2(tokens, idx, options, env, slf)
  }
}

export default LatexPlugin
