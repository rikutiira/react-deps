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

export const getMock = () => store.comments || fetch('http://jsonplaceholder.typicode.com/posts/1/comments')
    .then((response) => response.json())
    .then((data) => {
        store.comments = data
        return data
    })
