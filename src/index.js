import React from 'react'
import ReactDOM from 'react-dom'
import ReactDOMServer from 'react-dom/server'
import { Promise } from 'bluebird'

let usedDependencies = new Map()
let initialRender = false
let isClient = false

const flatten = (arr = []) => !arr.length ? arr : arr.reduce((flattenedArr, item) => flattenedArr.concat(item))

const zipObj = (keys = [], values = []) => Object.assign({}, ...keys.map((key, idx) => ({ [key]: values[idx] })))

const pick = (arr = [], key) => arr.map((it) => it[key])

const promiseUtils = {
    all: (p) => new Promise((resolve) => {
        const promises = [].concat(p)

        if (promises.length) {
            let resolved = new Array(promises.length)
            let count = 0

            promises.forEach((promise, idx) => {
                Promise.resolve(promise).then((data) => {
                    resolved[idx] = data
                    count = count + 1

                    if (count === promises.length) {
                        resolve(resolved)
                    }
                })
            })
        } else {
            resolve([])
        }
    })
}

const renderUntilReady = (element) => {
    isClient = false

    const html = ReactDOMServer.renderToString(element)

    return promiseUtils.all(
        Array.from(usedDependencies.keys()).map((key) => {
            const { deps, depKeys, resolvedDeps } = usedDependencies.get(key)

            return (resolvedDeps)
                ? Promise.resolve(html)
                : promiseUtils.all(deps).then((resolved) => {
                    usedDependencies.set(key, Object.assign({}, usedDependencies.get(key), {
                        resolvedDeps: zipObj(depKeys, resolved)
                    }))

                    return renderUntilReady(element)
                })
        })
    ).then((htmlArr) => htmlArr[htmlArr.length-1])
}

export const dependencies = (dependencies = {}, waitForAll) => (Component) => {
    return React.createClass({
        componentWillMount() {
            waitForAll = initialRender ? true : waitForAll

            const usedDeps = usedDependencies.has(dependencies)
            const depKeys = Object.keys(dependencies)

            if (usedDependencies.has(dependencies) && initialRender) {
                this.setState(usedDependencies.get(dependencies).resolvedDeps)
            } else {
                const deps = depKeys.map((key) => Promise.resolve(dependencies[key](this.props, initialRender)))
                usedDependencies.set(dependencies, { deps, depKeys })

                if (waitForAll) {
                    promiseUtils.all(deps).then((resolvedDeps) => {
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
}

export const render = (element, node) => {
    usedDependencies = new Map()
    initialRender = true

    renderUntilReady(element).then(() => {
        isClient = true
        ReactDOM.render(element, node)

        promiseUtils.all(flatten(pick(Array.from(usedDependencies.values()), 'deps'))).then(() => {
            initialRender = false
        })
    })
}

export const renderToString = (element) => {
    usedDependencies = new Map()
    initialRender = true

    return renderUntilReady(element).then((html) => {
        initialRender = false

        return html
    })
}
