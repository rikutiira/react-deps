import React from 'react'
import ReactDOM from 'react-dom'
import ReactDOMServer from 'react-dom/server'

const isClient = typeof window !== 'undefined' && window.document

const flatten = (arr = []) => !arr.length ? arr : arr.reduce((flattenedArr, item) => flattenedArr.concat(item))
const zipObj = (keys = [], values = []) => Object.assign({}, ...keys.map((key, idx) => ({ [key]: values[idx] })))
const pick = (arr = [], key) => arr.map((it) => it[key])

const Container = React.createClass({
    childContextTypes: {
        __reactDeps: React.PropTypes.object
    },

    getInitialState() {
        return {
            initialRender: true
        }
    },

    getChildContext() {
        return {
            __reactDeps: {
                usedDependencies: this.props.usedDependencies,
                initialRender: this.state.initialRender
            }
        }
    },

    render() {
        return this.props.children
    }
})

const renderUntilReady = (element, usedDependencies) => {
    const html = ReactDOMServer.renderToStaticMarkup(<Container usedDependencies={usedDependencies} initialRender>{element}</Container>)

    return Promise.all(
        Array.from(usedDependencies.keys()).map((key) => {
            const { deps, depKeys, resolvedDeps } = usedDependencies.get(key)

            return (resolvedDeps)
                ? Promise.resolve(html)
                : Promise.all(deps).then((resolved) => {
                    usedDependencies.set(key, Object.assign({}, usedDependencies.get(key), {
                        resolvedDeps: zipObj(depKeys, resolved)
                    }))

                    return renderUntilReady(element, usedDependencies)
                })
        })
    ).then((htmlArr) => htmlArr[htmlArr.length-1])
}

export const load = (dependencies = {}, waitForAll) => (Component) => React.createClass({
    contextTypes: {
        __reactDeps: React.PropTypes.object
    },

    componentWillMount() {
        const { usedDependencies, initialRender } = this.context.__reactDeps
        const usedDeps = usedDependencies.has(dependencies)
        const depKeys = Object.keys(dependencies)

        if (usedDependencies.has(dependencies) && initialRender) {
            this.setState(usedDependencies.get(dependencies).resolvedDeps)
        } else {
            const deps = depKeys.map((key) => Promise.resolve(dependencies[key](this.props, initialRender)))
            usedDependencies.set(dependencies, { deps, depKeys })

            if (initialRender || waitForAll) {
                Promise.all(deps).then((resolvedDeps) => {
                    if (isClient) {
                        this.setState(zipObj(depKeys, resolvedDeps))
                    }
                })
            } else {
                deps.forEach((dep, idx) => {
                    dep.then((resolvedDep) => {
                        if (isClient) {
                            this.setState({ [depKeys[idx]]: resolvedDep })
                        }
                    })
                })
            }
        }
    },

    render() {
        return <Component {...this.props} {...this.state} />
    }
})

export const render = (element, node) => {
    let usedDependencies = new Map()
    let disableInitialRender = {}
    let container

    ReactDOM.render(<Container usedDependencies={usedDependencies} ref={(ref) => container = ref}>{element}</Container>, node)

    Promise.all(flatten(pick(Array.from(usedDependencies.values()), 'deps'))).then(() => {
        container.setState({ initialRender: false })
    })
}

export const renderToString = (element) => {
    let usedDependencies = new Map()

    return renderUntilReady(element, usedDependencies).then((html) => html)
}
