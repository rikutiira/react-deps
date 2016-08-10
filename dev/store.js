global.store = {}

export const resetStore = () => global.store = {}

export const getFoo = () => store.foo ||
    new Promise((resolve) => setTimeout(() => {
        store.foo = true
        resolve(true)
    }, 1000))

export const getBar = () => {
    store.bar = false
    return false
}

export const getFoobar = () => store.foobar ||
    new Promise((resolve) => setTimeout(() => {
        store.foobar = 'foobar'
        resolve('foobar')
    }, 700))