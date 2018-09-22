# Simple Virtual DOM

This is my attempt at creating very simple virtual dom. 
I wanted to use it on my websites where vdom would be really useful but using Vue.js or React.js is overkill.
And yes it kinda looks like vue when you use it. Just a bit but yes I know it looks similar. Only difference is that Vue acually works.

## Like all vDOM's
This one also can create virtual tree and render it to acual DOM. 
Then when user changes its state it renders a new tree and then diffs them to find patches which get applied to real DOM.
The basics are there and they work like they should.

## It's more than just that
It has some things to make everything easier.

Components! They work... kinda, there are very simple, eg. you cant use the same component twice in one render function or they will share state, props etc.

You can set events for nodes using `@eventname` and pass a string that is a name of a method, so eg. `@click: "sendForm"`.

Refs mostly work, adding prop `ref: "somename"` will add real node to `this.refs`. There were problems that refs were assigned to "main" component instead to nested component that the ref was created inside but I think it has been fixed.

## Known problems
- it doesn't work, I tried to make example for this and everything broke... Idc

- Changeing event listener on node breaks at least everything.
- Refs can get assigned to parent component instead one that they were created in.
- Can't use the same component inside one render function.
- vDOM might crash if component tries to use it's props too soon.

## Unknown problems
There are probably more of them than working things.

###### Coded by BlackBird#9999 @ Discord
