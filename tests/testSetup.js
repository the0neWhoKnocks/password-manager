window.alert = jest.fn();
window.testCtx = {
  /**
   * Allows for setting `window.location` props within tests
   * @param {Object} options - The prop: val that is to override
   */
  location: options => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: Object.assign({
        assign: jest.fn(),
        hash: '',
        host: 'http://local',
        href: 'http://local',
        match: jest.fn(),
        origin: 'local',
        pathname: '/',
        port: '3000',
        protocol: 'http:',
        reload: jest.fn(),
        search: '',
      }, options)
    })
  },
  /**
   * Allows for setting `window.navigator` props within tests
   * @param {String} prop - The `navigator` prop you want to set.
   * @param {String} val - The value of the prop.
   */
  navigator: function(prop, val){
    Object.defineProperty(window.navigator, prop, {
      writable: true,
      value: val
    });
  },
};
window.requestAnimationFrame = (callback) => {
  setTimeout(callback, 0);
};

global.console.debug = jest.fn();
global.console.error = jest.fn();
global.console.warn = jest.fn();

// TODO - newer Browsers have this, but it's either missing in JSDom or Node
if (!Object.fromEntries) {
  Object.fromEntries = arr => Object.assign({}, ...Array.from(arr, ([k, v]) => ({[k]: v}) ));
}

process.on('unhandledRejection', require('./reporters/UnhandledRejectionReporter').rejectionHandler);
