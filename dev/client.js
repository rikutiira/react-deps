import 'isomorphic-fetch'
import React from 'react'
import App from './App'
import { dependencies, render } from '../src/'

store = window.__INITIAL_STATE__ || {}

render(<App />, document.querySelector('#app'))
