import { match } from '../src';

describe('RouteHandler match function', function() {

  it('matches a static route with one section', function() {
    expect(match([{route: '/home'}], '/home').route).toEqual('/home');
  });

  it('matches to the last route when 2 routes don\'t match', function() {
    const routes = [{
      route: '/admin'
    }, {
      route: '/admin/post'
    }, {
      route: '*'
    }];

    expect(match(routes, '/admin/pos').route).toEqual('*');
  });

  it('matches the second route of three', function() {
    const routes = [{
      route: '/admin'
    }, {
      route: '/admin/post'
    }, {
      route: '*'
    }];
    expect(match(routes, '/admin/post').route).toEqual('/admin/post');
  });

  it('matches the second route of three when it\'s dynamic', function() {
    const routes = [{
      route: '/admin'
    }, {
      route: '/admin/:username'
    }, {
      route: '*'
    }];
    const result = match(routes, '/admin/silverlight513');
    expect(result.route).toEqual('/admin/:username');
    expect(result.params.username).toEqual('silverlight513');
  });

  it('matches the first route of three when it\'s dynamic', function() {
    const routes = [{
      route: '/admin/(:page)'
    }, {
      route: '/admin'
    }, {
      route: '*'
    }];
    const result = match(routes, '/admin/post');
    expect(result.route).toEqual('/admin/(:page)');
    expect(result.params.page).toEqual('post');
  });

  it('matches the first route that could match out of two', function() {
    const routes = [{
      route: '/admin/:id'
    }, {
      route: '/admin/post'
    }];
    const result = match(routes, '/admin/123');
    expect(result.route).toEqual('/admin/:id');
    expect(result.params.id).toEqual('123');
  });

  it('matches a route with hyphens in a section', function() {
    expect(match([{route: '/create-post'}], '/create-post').route).toEqual('/create-post');
  });

  it('matches a route with numbers in a section', function() {
    expect(match([{route: '/9-fish-fingers'}], '/9-fish-fingers').route).toEqual('/9-fish-fingers');
  });

  it('matches a route with escaped characters', function() {
    expect(match([{route: '/£5'}], '%C2%A35').route).toEqual('/£5');
  });

  it('matches a path when a query string is on the end', function() {
    expect(match([{route: '/post'}], '/post?id=123').route).toEqual('/post');
  });

  it('can get the query values back from a matched route', function() {
    const result = match([{route: '/post'}], '/post?id=123&type=html');
    expect(result.query.id).toEqual('123');
    expect(result.query.type).toEqual('html');
  });

  it('can get the query values when the last one is broken', function() {
    const result = match([{route: '/post'}], '/post?id=123&type&');
    expect(result.query.id).toEqual('123');
    expect(result.query.type).toEqual(undefined);
  });

  it('can get the query values when they\'re blank', function() {
    const result = match([{route: '/post'}], '/post?id=&type=');
    expect(result.query.id).toEqual('');
    expect(result.query.type).toEqual('');
  });

  it('matches a route with one dynamic param', function() {
    const result = match([{route: '/:id'}], '/page');
    expect(result.route).toEqual('/:id');
    expect(result.params.id).toEqual('page');
  });

  it('matches a route with one dynamic param and gives the correct param value', function() {
    const result = match([{route: '/:id'}], '/page');
    expect(result.route).toEqual('/:id');
    expect(result.params.id).toEqual('page');
  });

  it('matches a route with an optional param', function() {
    expect(match([{route: '/post/(new)'}], '/post').route).toEqual('/post/(new)');
    expect(match([{route: '/post/(new)'}], '/post/new').route).toEqual('/post/(new)');
  });

  it('doesn\'t match a route where the optional param doesn\'t match', function() {
    expect(match([{route: '/post/(new)'}], '/post/other').route).not.toEqual('/post/(new)');
  });

  it('matches a route with a dynamic section in the middle', function() {
    const result = match([{route: '/post/:id/edit'}], '/post/123/edit');
    expect(result.route).toEqual('/post/:id/edit');
    expect(result.params.id).toEqual('123');
  });

  it('matches an optional dynamic section', function() {
    expect(match([{route: '/post/(:id)'}], '/post/').route).toEqual('/post/(:id)');
    expect(match([{route: '/post/(:id)'}], '/post/123').params.id).toEqual('123');
    expect(match([{route: '/post/(:id)'}], '/post/123').route).toEqual('/post/(:id)');
  });

  it('matches a route that can match anything', function() {
    expect(match([{route: '*'}], '/post/new').route).toEqual('*');
  });

  it('matches a route that ends in match anything', function() {
    expect(match([{route: '/post/*'}], '/post/123').route).toEqual('/post/*');
  });

  it('matches a long route that ends in match anything', function() {
    expect(match([{route: '/post/edit/settings/*'}], '/post/edit/settings/reset-to-default').route).toEqual('/post/edit/settings/*');
  });

  it('matches a route that has an optional match anything at the end', function() {
    expect(match([{route: '/post/(*)'}], '/post').route).toEqual('/post/(*)');
    expect(match([{route: '/post/(*)'}], '/post/new').route).toEqual('/post/(*)');
  });

});