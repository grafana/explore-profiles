const JSDOMEnvironment = require('jest-environment-jsdom').default;

/** jsdom 26+ window.location is non-configurable; use dom.reconfigure() instead. */
function resolveWindowLocationUrl(dom, value) {
  if (value instanceof URL) {
    return value.href;
  }

  if (value.href != null) {
    return value.href;
  }

  if ('host' in value && (value.host == null || value.host === '')) {
    return 'about:blank';
  }

  if (value.host != null && value.host !== '' && value.search == null && value.pathname == null) {
    return `http://${value.host}/`;
  }

  const current = new URL(dom.window.location.href);

  if (value.host != null && value.host !== '') {
    current.host = value.host;
  }
  if (value.search != null) {
    current.search = value.search;
  }
  if (value.pathname != null) {
    current.pathname = value.pathname;
  }

  return current.href;
}

class ProfilesDrilldownJsdomEnvironment extends JSDOMEnvironment {
  async setup() {
    await super.setup();
    const dom = this.dom;
    this.global.setWindowLocation = (value) => {
      dom.reconfigure({ url: resolveWindowLocationUrl(dom, value) });
    };
  }
}

module.exports = ProfilesDrilldownJsdomEnvironment;
