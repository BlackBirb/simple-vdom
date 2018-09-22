const myComponent = {
    state: {
        msg: "World!"
    },
    methods: {
        pressed () {
            this.setState({ msg: this.state.msg += "!" })
        }
    },
    computed: {
        amountOfExclamationMarks () {
            return this.state.msg.length - this.state.msg.replace(/!+/g, "").length
        }
    },
    components: {
        // you can nest components too
    },
    render (h, state) {// state is passed but you can use this.state too
        return h('div', { className: "component", "@click": "pressed" },
            h('span', null, state.msg),
            h('span', null, `There is ${this.computed.amountOfExclamationMarks} exclamation marks`),
            h('span', null, "My name is ", this.props["name"]),
            ...this.children
        )
    }
}

const { vDOMInstance } = vDOM

const instance = new vDOMInstance({
    el: "div#main",
    state: { name: "None" },
    methods: {
        changeName () { 
            this.setState({
                name: this.refs["name"].value
            })
        }
    },
    components: {
        myComponent
    },
    render(h) {
        return h('div', { class: "main vDOM" },
            h('input', { type: 'text', ref: 'name', placeholder: 'type your name', '@input': 'changeName' }),
            h(this.components.myComponent, { name:  this.state.name }, 
                "Hi ", this.state.name, "!"
            )
        )
    }
})