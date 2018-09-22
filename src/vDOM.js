// Don't change events
// Inside components refs can get lost if changed
// props patching doesn't change `this` while traveling though vTree
// components doesn't have any props validation, lmao who needs that

(function(){

    const CREATE = "CREATE"
    const REMOVE = "REMOVE"
    const REPLACE = "REPLACE"
    const UPDATE = "UPDATE"
    const REMOVE_PROP = "REMOVE_PROP"
    const SET_PROP = "SET_PROP"
    const COMPONENT = "COMPONENT"

    class Component {
        constructor(params) {
            this.state = params.state || {}
            this.name = params.name || "UNNAMED"
            this.instance = params.instance

            this.props = {}
            this.children = []

            this.components = {}
            this.methods = {}
            this.computed = {}
            this.refs = {}
            if(params.methods) { 
                for(const name of Object.keys(params.methods)) {
                    this.methods[name] = params.methods[name].bind(this)
                }
            }
            if(params.computed) {
                for(const name of Object.keys(params.computed)) {
                    Object.defineProperty(this.computed, name, {
                        get: params.computed[name].bind(this)
                    })
                }
            }
            if(params.components) {
                for(const name of Object.keys(params.components)) {
                    const target = params.components[name]
                    target.instance = this.instance

                    // So every component is new instace?
                    // Nope you idiot, state gets reset etc...
                    // Object.defineProperty(this.components, name, {
                    //     get: () => {
                    //         let comp = new Component(target)
                    //         return comp
                    //     }
                    // })

                    let comp = new Component(target)
                    this.components[name] = comp
                }
            }
            
            this.view = params.render.bind(this, this.h)
        }

        setState (newState) {
            this.instance.setState(this, newState)
            console.error("Unregistered state change!")
        }

        passParentData(props, children) {
            this.props = Object.assign({}, props)
            this.children = [ ...children ] // immutable
        }

        changed(node1, node2) {
            return typeof node1 !== typeof node2 ||
                typeof node1 === 'string' && node1 !== node2 ||
                node1.type !== node2.type ||
                node1.props && node2.props && node1.props.key !== node2.props.key
        }

        diffChildren(newNode, oldNode) {
            const patches = []

            const patchesLength = Math.max(
                newNode.children.length,
                oldNode.children.length
            )

            for(let i =0; i < patchesLength; i++) {
                patches[i] = this.diff(
                    newNode.children[i],
                    oldNode.children[i]
                )
            }

            return patches
        }

        diffProps(newNode, oldNode) {
            const patches = []
            const props = Object.assign({}, newNode.props, oldNode.props)
            for(const name of Object.keys(props)) {
                const newVal = newNode.props[name]
                const oldVal = oldNode.props[name]
                if(!newVal) {
                    patches.push({ type: REMOVE_PROP, name, value: oldVal })
                } else if(typeof newVal === 'function' && typeof oldVal === 'function') {
                    continue;
                } else if(!oldVal || newVal !== oldVal) {
                    patches.push({ type: SET_PROP, name, newVal, oldVal })
                }
            }

            return patches
        }

        diff(newNode, oldNode) {
            if(!oldNode && newNode) {
                return { type: CREATE, newNode }
            }

            if(!newNode && oldNode) {
                return { type: REMOVE }
            }

            if(this.changed(newNode, oldNode))
                return { type: REPLACE, newNode }

            if(newNode.type instanceof Component) {
                newNode.type.passParentData(newNode.props, newNode.children)
                return { 
                    type: COMPONENT, 
                    component: newNode.type,
                    patches: newNode.type.patches
                }
            }

            if(newNode.type) 
                return { 
                    type: UPDATE, 
                    children: this.diffChildren(newNode, oldNode),
                    props: this.diffProps(newNode, oldNode)
                }
        }

        get patches() {
            let newDOM = this.view(this.state)
            let patches = this.diff(newDOM, this.activeDOM)
            this.activeDOM = newDOM
            return patches
        }

        isEventProp(name) {
            return name.slice(0,1) === "@"
        }

        isCustomProp(name) {
            return ['key', 'ref', 'classname'].includes(name) ||
                this.isEventProp(name)
        }

        setCustomProp(target, name, value, oldVal) {
            if(this.isEventProp(name)) {
                if(oldVal) {
                    if(typeof oldVal !== "function" && this.methods && this.methods[oldVal]) {
                        oldVal = this.methods[oldVal]
                    }
                    target.removeEventListener(name.slice(1), oldVal.bind(this))
                }
                if(typeof value !== "function") value = this.methods[value]
                    return target.addEventListener(name.slice(1), value.bind(this))
                
            } else if(name === "ref") {
                if(!this.refs) return console.error("Refs are only avaialbe in instance")
                if(oldVal && this.refs[oldVal]) delete this.refs[oldVal]
                target._vdom_ref = value
                // `this` is app component, ref get's "lost" if it was in other component
                return this.refs[value] = target 
            } else if(name === "classname") {
                target.setAttribute("class", value)
            }
        }

        setProp(target, name, value, oldVal) {
            name = name.toLowerCase()
            if(this.isCustomProp(name))
                return this.setCustomProp(target, name, value, oldVal)
            target.setAttribute(name, value)
        }

        removeCustomProp(target, name, oldVal) {
            if(name === "ref") {
                delete this.refs[oldVal]
            } else if(this.isEventProp(name)) {
                // binding also gets lost... fuck
                target.removeEventListener(name.slice(1), oldVal.bind(this)) 
            }
        }

        removeProp(target, name, oldVal) {
            if(this.isCustomProp(name)) 
                return this.removeCustomProp(target, name, oldVal)
            target.removeAttribute(name)
        }

        setProps(target, props) {
            for(const name of Object.keys(props)) {
                this.setProp(target, name, props[name])
            }
        }
        
        patchProps(parent, patches) {
            for(let i =0; i < patches.length; i++) {
                const propPatch = patches[i]
                const { type, name, newVal: value, oldVal } = propPatch
                if(type === SET_PROP) {
                    this.setProp(parent, name, value, oldVal)
                }
                if(type === REMOVE_PROP)
                    this.removeProp(parent, name, oldVal)
            }
        }

        patch(parent, patches, index = 0) {
            console.log(patches)
            if (!parent || !patches) return;
            const el = parent.childNodes[index]
            switch (patches.type) {
                case COMPONENT: {
                    const { component, patches: componentPatches } = patches
                    component.patch(parent, componentPatches)
                    break;
                }
                
                case CREATE: {
                    let newEl = this.createElement(patches.newNode)
                    return parent.appendChild(newEl);
                }

                case REMOVE: {
                    if(el._vdom_ref) delete this.refs[el._vdom_ref]
                    return parent.removeChild(el);
                }
                
                case REPLACE: {
                    let newEl = this.createElement(patches.newNode)
                    if(el._vdom_ref) {
                        this.refs[el._vdom_ref] = newEl
                        newEl._vdom_ref = el._vdom_ref
                    }
                    return parent.replaceChild(newEl, el);
                }

                case UPDATE: {
                    const { children, props } = patches
                    this.patchProps(el, props)
                    for(let i = children.length; i >= 0; i--) {
                        this.patch(el, children[i], i)
                    }
                    break;
                }
            }
        }

        createElement (node) {
            if(node instanceof Component) {
                node = {
                    type: node,
                    props: {},
                    children: []
                }
            }
            if(node.type instanceof Component) {
                const instance = node.type
                instance.passParentData(node.props, node.children)
                let newDOM = instance.view(instance.state)
                instance.activeDOM = newDOM
                return instance.createElement(newDOM)
            }
            if(typeof node !== 'object')
                return document.createTextNode(node)

            let el = document.createElement(node.type)
            this.setProps(el, node.props)
            node.children
                .map(this.createElement.bind(this))
                .forEach(el.appendChild.bind(el))
            return el
        }

        h (type, props, ...children) {
            return {
                type, 
                props: props || {}, 
                children: Array.prototype.concat.apply([], children)
                    .filter(ch => ch !== null)
            }
        }
    }

    class vDOMInstance {
        constructor(params) {
            this.el = document.querySelector(params.el)
            delete params.el
            params.name = "ENTRY_APP"
            params.instance = this
            this.app = new Component(params)

            this.render(this.el)
        }

        setState(component, newState) {
            component.state = Object.assign({}, component.state, newState)
            this.update(this.el)
        }

        render (el, dom) {
            if(!dom) 
                dom = this.app.view(this.app.state)

            this.app.activeDOM = dom
            el.appendChild(this.app.createElement(dom))
        }

        update(el) {
            let p = this.app.patches
            console.log(p)
            this.app.patch(el, p)
        }
    }

    function simpleRender(el, dom) {
        if(!dom) throw new Error("Dom must be defined if not in instance")
        el.appendChild(Component.prototype.createElement(dom))
    }

    window.vDOM = {
        // stateless
        h: Component.prototype.h,
        createElement: Component.prototype.createElement.bind(Component.prototype),
        render: simpleRender,
        // with state ans stuff
        Component,
        vDOMInstance
    }
})()
