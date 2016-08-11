import React from 'react'
import { load } from '../src/index.js'
import { getFoo, getBar, getFoobar, getMock } from './store'

const Foo = React.createClass({
    displayName: 'Foo',

    render() {
        return <h1>{ this.props.foobar || 'waiting for data' }</h1>
    }
})

const Bar = React.createClass({
    displayName: 'Bar',

    render() {
        return <h2>Hello {this.props.barClient} {this.props.barClient2}</h2>
    }
})

const App = React.createClass({
    displayName: 'App',

    getInitialState() {
        return { clientOnly: false }
    },

    componentDidMount() {
        setTimeout(() => {
            this.setState({
                clientOnly: 'yippee'
            })
        }, 2000)
    },

    render() {
        return (
            <div>
                <pre>{JSON.stringify(Object.assign({}, this.props, this.state), undefined, 4)}</pre>
                { this.props.foo && <FooWithDeps /> }
                { this.state.clientOnly && <BarWithDeps hello="world" /> }
            </div>
        )
    }
})

const FooWithDeps = load({
    foobar: (props) => getFoobar()
})(Foo)

const BarWithDeps = load({
    barClient: (props) => new Promise((resolve) => setTimeout(() => resolve(props.hello.toUpperCase()), 1000)),
    barClient2: () => new Promise((resolve) => setTimeout(() => resolve('CUP 2018'), 2500))
})(Bar)

const AppWithDeps = load({
    foo: (props) => getFoo(),
    bar: (props) => getBar(),
    mock: () => getMock()
})(App)

export default AppWithDeps