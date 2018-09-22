(function(){

    const CREATE = "CREATE"
    const REMOVE = "REMOVE"
    const REPLACE = "REPLACE"
    const UPDATE = "UPDATE"
    const REMOVE_PROP = "REMOVE_PROP"
    const SET_PROP = "SET_PROP"

    class vDOMInstance {
        constructor(params) {
            this.state = params.state || {}
            this.el = document.querySelector(params.el)

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
            
            this.view = params.render.bind(this)
            this.tree = this.view(this.h, this.state)
            this.render(this.el, this.tree)
        }

        setState(newState) {
            this.state = Object.assign({}, this.state, newState)
            this.update()
        }

        changed(node1, node2) {
            return typeof node1 !== typeof node2 ||
                typeof node1 === 'string' && node1 !== node2 ||
                node1.type !== node2.type ||
                node1.props && node2.props && node1.props.key !== node2.props.key
        }

        patchProps(parent, patches) {
            for(let i =0; i < patches.length; i++) {
                const propPatch = patches[i]
                const { type, name, newVal: value } = propPatch
                if(type === SET_PROP) {
                    this.setProp(parent, name, value)
                }
                if(type === REMOVE_PROP)
                    this.removeProp(parent, name)
            }
        }

        patch(parent, patches, index = 0) {
            if (!patches) return;
            const el = parent.childNodes[index]
            switch (patches.type) {
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
                    if(el._vdom_ref) delete this.refs[el._vdom_ref]
                    return parent.replaceChild(newEl, el);
                }

                case UPDATE: {
                    const { children, props } = patches
                    this.patchProps(el, props)
                    for(let i = children.length; i >= 0; i--) {
                        this.patch(el, children[i], i)
                    }
                }
            }
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
                } else if(typeof newVal === 'function' && typeof  oldVal === 'function') {
                    continue;
                } else if(!oldVal || newVal !== oldVal) {
                    patches.push({ type: SET_PROP, name, newVal })
                }
            }

            return patches
        }

        diff(newNode, oldNode) {
            if(!oldNode)
                return { type: CREATE, newNode }

            if(!newNode)
                return { type: REMOVE }

            if(this.changed(newNode, oldNode))
                return { type: REPLACE, newNode }

            if(newNode.type) 
                return { 
                    type: UPDATE, 
                    children: this.diffChildren(newNode, oldNode),
                    props: this.diffProps(newNode, oldNode)
                }
        }

        setProp(target, name, value) {
            if(name.slice(0,1) === "@") {
                if(typeof value === "string") {
                    value = this.methods[value]
                    if(!value) return;
                }
                return target.addEventListener(name.slice(1), value.bind(this))
            }
            if(name === "key") return;
            if(name === 'className') 
                return target.setAttribute("class", value)
            if(name === "ref") {
                target._vdom_ref = value
                return this.refs[value] = target
            }
            target.setAttribute(name, value)
        }

        removeProp(target, name) {
            target.removeAttribute(name)
        }

        setProps(target, props) {
            for(const name of Object.keys(props)) {
                this.setProp(target, name, props[name])
            }
        }

        createElement (node) {
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
                children: Array.prototype.concat.apply([], children).filter(ch => ch !== null)
            }
        }
        render (el, dom) {
            if(typeof dom !== "object") throw new Error("Create view first")
            el.appendChild(this.createElement(dom))
        }
        update() {
            let newTree = this.view(this.h, this.state)
            const patches = this.diff(newTree, this.tree)
            this.tree = newTree
            this.patch(this.el, patches)
        }
    }

    window.vDOMbasic = {
        h: vDOMInstance.prototype.h,
        createElement: vDOMInstance.prototype.createElement,
        render: vDOMInstance.prototype.render,
        vDOMInstance
    }
})()