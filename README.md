# Pengwyn Router

[![NPM](https://img.shields.io/npm/v/pengwyn-router.svg)](https://www.npmjs.com/package/pengwyn-router)

A 1KB router that uses a routes object to determine the components to display instead of JSX. This router also automatically hooks up to redux if the dispatch function is available to it.

---

### Example

```js
import Router from 'pengwyn-router';
import Home from './Home';
import Post from './Post';
import NotFound from './NotFound';

const path = location.pathname;

const routes = [{
  route: '/',
  component: Home
}, {
  route: '/post/:id',
  component: Post
}, {
  route: '*',
  component: NotFound
}];

const App = ({props}) => (
  <AppWrapper>
    <Router {...{path, routes, passedProps: props}} />
  </AppWrapper>
);

export default App;
```

### Redux Integration

If you use redux in your app ensure that the Router has the dispatch function within its `passedProps` and it will automatically start firing actions on route changes.

### Route Matching

When the Router is going through the routes to find a match, it does so in order of first to last. If you have the same route in two places, the first in the routes array will be the match.

Static route - `/about-us`
Dynamic segment - `/post/:id`
Match anything - `*`
Match any segment - `/author/*/comments`
Optional segment - `/tag/(:tag)`

**Note** If you wish to use an optional segment, it must be at the end of a route.