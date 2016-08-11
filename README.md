# React Deps
React Deps lets you to declare dependencies on component level in composable, unintrusive and unopinionated way. And it's isomorphic to boot!

## How it looks

```js
import { load } from 'react-deps';
import store from './store';

//asynchronous action
const getPosts = () => {
    return store.posts
        ? store.posts
        : fetch('http://jsonplaceholder.typicode.com/posts/')
            .then((response) => response.json())
            .then((data) => {
                store.dispatch('GET_POSTS', data);
                return data;
            });
};

const Component = (props) => <h1>Hello {props.world}!</h1>;

export default load({
  world: (props, isInitialRender) => getWorld() //returns value or promise, isInitialRender flag can be used for optimization
})(Component);
```

## How it works

Actually, the above is pretty much it. The library is a simple HOC (higher order component) called `load`. It takes a single argument, an object which keys will be props passed to your component and the values are functions which can return either plain values or promises which will be passed down to your component once resolved.

React Deps has no internal dependencies (aside from React) and is very lightweight. Since it's nothing more than a simple HOC, it's library-agnostic and can be used with any solution.

## Isomorphism

```
/**
 * server
 */

import express from 'express';
import { renderToString } from 'react-deps';
import { App } from './App';
import { store } from './store';

const app = express();

app.get('/', function(req, res) {
  renderToString(<App />).then((html) => {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>React Deps</title>
          <script>
            window.__INITIAL_STATE__ = ${JSON.stringify(store.getState())}
          </script>
        </head>
        <body>
          <div id="app">${html}</div>
          <script type="application/javascript" src="app.js"></script>
        </body>
      </html>
    `);
  });
});

app.listen(9000, function() {
  console.log('*** This is an isomorphic react server ***');
});
```

```
/**
 * client
 */

import { render } from 'react-deps'
import { App } from './App'
import { store } from './store'

store = window.__INITIAL_STATE__ || {} //simple assignment for clarity's sake, normally store state is set through its own API

render(<App />, document.querySelector('#app')) //use React Deps render instead of ReactDOM.render
```

The above is all you need to have a fully working isomorphic application with React Deps. The only thing you need to do is to use `load` to load your component dependencies and make sure that when on the client, your dependencies will get data from your store instead of fetching it from the server again. Also notice that React Deps is not dependent of any library implementation and therefore it's up to you to hydrate your data from server to client. This allows React Deps to be very composable and pluggable for almost any architecture you may use.

If you take a look at the first example on the page, it demonstrates how your action is doing a server request only if your store doesn't have the data yet. Your dependencies also get a second argument `isInitialRender` which can be used for optimizing your asynchronous code. `isInitialRender` is set to `true` when rendering on the server and when rendering on the client for the first time, otherwise it's `false`:

```
import { load } from 'react-deps';
import { store } from './store';

const getPost = (postId, alwaysFetchNewValue) => {
    return !alwaysFetchNewValue && store.posts && store.posts[postId]
        ? store.posts[postId]
        : fetch(`http://jsonplaceholder.typicode.com/posts/${postId}`)
            .then((response) => response.json())
            .then((data) => {
                store.dispatch('GET_POST', data);
                return data;
            });
};

load({
    post: (props, isInitialRender) => {
        const alwaysFetchNewValue = !isInitialRender
        return getPost(props.postId, alwaysFetchNewValue)
    }
})

```

### What makes React Deps good for isomorphic applications?

React is capable of isomorphic applications but it wasn't likely built with all the complexities in mind. One issue which comes up quite often in the React community is how to properly handle populating data on the server. The issue is that `renderToString` is a synchronous operation while data fetching is generally asynchronous. This means that you need to have some mechanism in place to populate your stores/models before rendering and hydrating your data for client to use. Some solutions include:

* Fetching and populating data on routing level, taking advantage of static component methods
* Populating generic data on the server and having client fetch more dynamic and specific data
* Calling `renderToString` multiple times

The first two solutions are not ideal. It's ideal to let components declare what data they need to function and have the same declarations work both on client and server. With the first two solutions, you are very likely declaring data for components out of their own scope, which may lead to tightly coupled, implicit code. You also possibly have to maintain data dependencies in multiple places which is not optimal.

React Deps utilizes the third approach. Each `renderToString` call on the server will cause React to render the component tree and React Deps will keep track of all the declared dependencies. Once the dependencies have been loaded, React Deps will call `renderToString` again as new dependencies can cause React to render more components. This is repeated until two subsequent `renderToString` calls return the same dependencies. It's also notable that React Deps caches all the dependencies so they are only called once no matter how many `renderToString` calls are made, keeping it very fast even with deep component trees.