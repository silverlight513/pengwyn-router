import { h, Component } from 'preact';

let hasEventListener = false;

// Constants
const EMPTY = {};
const ROUTERS = [];

// Regex's
const isDynamicRoute = new RegExp(/:|\*|(\([A-z:*]+\))/);
const optionalSectionRegex = new RegExp(/^\([A-z:*]+\)$/);
const removeOptionalRegex = new RegExp(/(^\()|(\)$)/g);
const paramRegex = new RegExp(/^:/);

function routeTo(route) {
  // Loop over the router instances
  for (let i = ROUTERS.length - 1; i >= 0; i--) {
    // Get the current router instance
    const router = ROUTERS[i];
    // Get the matched values
    const values = match(router.props.routes, route);
    // Route all routers
    router.routeTo(route, values);
  }
}

function goBack() {
  // Loop over the router instances
  for (let i = ROUTERS.length - 1; i >= 0; i--) {
    // Route all routes
    ROUTERS[i].goBack();
  }
}

// Create the Link component
function Link(props) {

  // Handle clicks of the link
  const onClick = e => {
    e.preventDefault();
    routeTo(path);
  };

  // If link is for a new tab
  if(props.openIn === 'new') {
    return (
      <a href={props.to} target="_blank" rel="noopener noreferrer">
        {props.children}
      </a>
    );
  }

  return (
    <a href={props.to} onClick={onClick}>
      {props.children}
    </a>
  );
}

/**
 * Function to get the query object from a given path
 */
function getQuery(path = '') {

  const query = {};

  // Check if the path even has a query first
  if(!path.includes('?')) {
    return query;
  }

  const queryString = path.split('?')[1];

  // Check if the query string has any values
  if(!queryString.includes('=')) {
    return query;
  }

  const values = queryString.split('&');

  // Loop over the query string values and add to the query object
  for (let i = values.length - 1; i >= 0; i--) {

    // Check that the current query string section has a value
    if(!values[i].includes('=')) {
      continue;
    }

    // Get the key and value to add to the query object
    const [ key, value ] = values[i].split('=');
    query[key] = value;
  }

  return query;
}

/**
 * Function that normalizes a path string
 */
function normalizePath(path = '') {

  // Remove the trailing slash if one has been given
  if(path.length > 1 && path.endsWith('/')) {
    path = path.slice(0, -1);
  }

  // Remove the first slash
  if(path.startsWith('/')) {
    path = path.slice(1);
  }

  // Remove the query if it exists
  if(path.includes('?')) {
    path = path.split('?')[0];
  }

  // Decode the url
  path = decodeURIComponent(path);

  return path;
}

/**
 * Function to determine what route matches the current path
 */
function match(routes, path) {

  // Get the query object before it gets stripped by the normalizer
  const query = getQuery(path);
  const pathname = path;

  // Normalize the path
  path = normalizePath(path);

  // Loop over each route to find the match
  for (let i = 0; i < routes.length; i++) {

    // Normalize the current route
    const currentRoute = normalizePath(routes[i].route);

    // Create the params object
    const params = {};

    // Check if it's a straight match first
    if(currentRoute === path) {
      return Object.assign({}, routes[i], {params, query, pathname, path});
    }

    // If there are no dynamic/optional/match-all parts then this route cannot match
    if(!isDynamicRoute.test(routes[i].route)) {
      continue;
    }

    // Split up the route by it's slashes so that we may match by section
    const routeSections = currentRoute.split('/');
    const pathSections = path.split('/');

    // Loop over each section looking for a full match
    for (let j = routeSections.length - 1; j >= 0; j--) {

      // If the route is to match everything, then return
      if(j === 0 && routeSections[j] === '*') {
        return Object.assign({}, routes[i], {params, query, pathname, path});
      }

      // If this section is optional
      if(optionalSectionRegex.test(routeSections[j])) {

        const currentSection = routeSections[j].replace(removeOptionalRegex, '');

        // If it's a param, add it to the params
        if(paramRegex.test(currentSection)) {
          params[currentSection.replace(paramRegex, '')] = pathSections[j];
          continue;
        }

        // If it's a star then skip to next
        if(currentSection === '*') {
          continue;
        }

        // If the optional section can possible be missing skip to next section
        if(routeSections.length === pathSections.length + 1) {
          continue;
        }

        // If the path and route sections have same number of sections and this does match, skip to next
        if(routeSections.length === pathSections.length && currentSection === pathSections[j]) {
          continue;
        }

        // Reject this route as the possible match to the path
        break;
      }

      // If it's a param, add it to the params
      if(paramRegex.test(routeSections[j])) {
        params[routeSections[j].replace(paramRegex, '')] = pathSections[j];

        if(j === 0) {
          return Object.assign({}, routes[i], {params, query, pathname, path});
        }

        continue;
      }

      // If it's a star then skip to next
      if(routeSections[j] === '*') {
        continue;
      }

      // If this doesn't match then go to next route
      if(routeSections[j] !== pathSections[j]) {
        break;
      }

      // If the last item matches strictly then return that match
      if(j === 0 && routeSections[j] === pathSections[j]) {
        return Object.assign({}, routes[i], {params, query, pathname, path});
      }
    }
  }

  // No match found
  return {path: '', params: {}, query};
}

function getCurrentPath() {

  const currentLocation = typeof location !== 'undefined' ? location : EMPTY;

  return currentLocation.pathname || '';
}

// Initializes the listener for page changes
function initListener() {

  if(hasEventListener) {
    return;
  }

  // Check that the browser supports event listening
  if(typeof window !== 'undefined') {
    onpopstate = () => {
      routeTo(getCurrentPath());
    };

    // Update module scoped var to say listener has started
    hasEventListener = true;
  }
}

// Create the handler
class Router extends Component {

  constructor(props) {
    super(props);

    if(typeof props.passedProps.dispatch === 'function') {
      this.dispatch = props.passedProps.dispatch;
    }

    initListener();
  }

  componentWillMount() {
    // Add this component to the array of router components
    ROUTERS.push(this);
  }

  routeTo(route, data) {
    // Update the URL
    window.history.pushState({}, '', route);
    // Send an action for the routeHandler if redux is being used
    if(this.dispatch) {
      this.dispatch({
        type: 'LOCATION_CHANGE',
        data
      });
    }
    // Re-render the component
    this.forceUpdate();
  }

  goBack() {
    // Update history object and allow popstate function to handle the location change
    window.history.go(-1);
  }

  render({routes, passedProps = {}, path = ''}) {

    // If the event listener hasn't been set up then set it up
    if(!hasEventListener) {
      initListener();
    }

    // Get a matching route
    const matchedRoute = match(routes, getCurrentPath() || path);

    // Select which component to use
    const CurrentComponent = matchedRoute.component;

    // Return the current route
    return <CurrentComponent {...passedProps} />;
  }
}

Router.Link = Link;
Router.goBack = goBack;
Router.routeTo = routeTo;
Router.match = match;

// Export items
export default Router;
export {
  Link,
  goBack,
  routeTo,
  match,
  Router
};