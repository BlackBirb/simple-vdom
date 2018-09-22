(function(window){
  const refs = {}

  function setCustomProp(target, name, value) {
    if(name === 'ref')
      refs[value] = target

    else if(name === 'className')
      target.setAttribute("class", value)

    else if(name.startsWith("@"))
      target.addEventListener(name.slice(1), value)
  }

  function isCustomProp(name) {
    return ['ref', 'className'].includes(name) ||
      name.startsWith("@")
  }

  function setProps(target, props) {
    for(const name of Object.keys(props)) {
      const value = props[name] // Object.entries breaks on some browsers...
      if(isCustomProp(name)) 
        setCustomProp(target, name, value)
      else
        target.setAttribute(name, value)
    }
  }

  function h(type, props, ...children) {
    return {
      type, 
      props: props || {}, 
      children: Array.prototype.concat.apply([], children)
        .filter(ch => ch !== null)
    }
  }

  function createElement(node) {
    if(typeof node !== 'object')
      return document.createTextNode(node)

    let el = document.createElement(node.type)
    setProps(el, node.props)
    node.children
      .map(createElement.bind(this))
      .forEach(el.appendChild.bind(el))
    return el
  }

  function render(el, vTree) {
    if(typeof el === "string") el = document.querySelector(el)
    if(!vTree)
      vTree = h("div", null, "Someone tried to render vTree without vTree >.-.<")
    el.appendChild(createElement(vTree))
  }

  window.vDOMstateless = {
    h,
    createElement,
    render,
    refs
  }
})(window)