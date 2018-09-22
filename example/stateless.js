const { h, render, refs } = vDOMstateless
const vTree = h('div', { class: "some" },
  h('div', { className: "vtree"},
    h('div', { ref: "change" }, "Testing")
  )
)
render("#stateless", vTree)

setTimeout(() => refs["change"].innerText = "Hello World!",5000)