# React Deps
React Deps lets you to declare dependencies on component level in composable, unintrusive and unopinionated way. And it's isomorphic to boot!

## How it looks

```js
import { load } from 'react-deps';
import { getWorld } from './myActions';

const Component = (props, initialRender) => <h1>Hello {props.world}!</h1>;

export default load({
  world: getWorld() //returns value or promise
})(Component);
```

## How it works

Actually, the above is pretty much it. The library is a simple HOC (higher order component) called `load`. It takes a single argument, an object which keys will be props passed to your component and the values are functions which can return either plain values or promises which will be passed down to your component once resolved.

React Deps has no internal dependencies (aside from React) and is very lightweight. Since it's nothing more than a simple HOC, it's library-agnostic and can be used with any solution.

## Isomorphism

React is capable of isomorphic applications but it wasn't likely built with all the complexities that come with it. One issue which comes up quite often in the React community is how to properly handle populating data on the server. The issue is that `renderToString` is a synchronous operation while data fetching is generally asynchronous. This means that you need to have some mechanism in place to populate your stores/models before rendering and hydrating your data for client to use. Some solutions include:

* Fetching and populating data on routing level, taking advantage static component methods
* Populating generic data on the server and having client fetch more dynamic and specific data
* Calling `renderToString` multiple times

The first two solutions are not ideal. It's ideal to let components declare what data they need to function and have the same declarations work both on client and server. With the first two solutions, you are very potentially declaring data for components out of their own scope, which may lead in tightly coupled, implicit code. You also possibly have to maintain data dependencies in multiple places which is not optimal.

With React Deps, you simply call its `render` and `renderToString` methods instead of ReactDOM and ReactDOMServer methods respectively:

```js
import { render, renderToString } from 'react-deps'
import App from './App'

//server
renderToString(<App />).then((html) => {
  //return html to client
})

//client:
render(<App />, document.querySelector('#app'))
```

And that's all! Notice how `renderToString` returns a promise instead of string: this is because React Deps turns it into an asynchronous operation. React Deps will call `renderToString` multiple times until your whole component tree is rendered server-side. It caches all the dependencies so they are only called once, and is very fast for it. You get to load all the data on the server with no hassle. The only thing you need to do is declare your dependencies with `load`.

Since React Deps is not dependent of any library implementation, it's important to understand that it doesn't hydrate data from server to client for you. You hydrate the data, and make sure that the promises used in `load` (in most cases, actions) return hydrated data from store instead of re-fetching it from the server, otherwise you'd lose many of the isomorphic performance gains. Every dependency function gets two arguments, `props` and `initialRender`, which can be used for optimizing your actions if needed.
