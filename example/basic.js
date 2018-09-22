
(function(){
    const { vDOMInstance } = vDOMbasic

    new vDOMInstance({
        el: "div#basic",
        state: {
            msg: "Hello ",
            name: "none"
        },
        computed: {
            getName () {
                return this.refs["name"].value
            }
        },
        methods: {
            change () {
                this.setState({ name: this.computed.getName })
            }
        },
        render(h) {
            return h('div', { class: "basic" },
                h('div', null, this.state.msg, this.state.name),
                h('input', { ref: 'name', placeholder: "I'm not creative", "@input": "change" })
            )
        }
    })
})()
