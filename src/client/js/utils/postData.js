(() => {
  function postWithFetch(url, body) {
    return window.fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    })
      .then((resp) => {
        return new Promise((res, rej) => {
          const contentType = resp.headers.get('content-type');
          const data = ( contentType && contentType.includes('application/json') )
            ? resp.json()
            : resp.text();
          
          data.then((d) => {
            if (!resp.ok) return rej(d);
            res(d);
          });
        });
      });
  }
  
  function postWithXHR(url, body, opts) {
    return new Promise((resolve, reject) => {
      const { onProgress } = opts;
      const xhr = new XMLHttpRequest();
      
      xhr.addEventListener('progress', () => { onProgress(xhr.response); });
      xhr.addEventListener('load', () => { resolve(xhr.response); });
      xhr.addEventListener('error', () => { reject(xhr.response); });
      xhr.responseType = 'text';
      xhr.open('POST', url);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(body);
    });
  }
  
  function postData(url, obj, opts = {}) {
    const body = JSON.stringify((obj instanceof HTMLElement) ? window.utils.serializeForm(obj) : obj);
    return (opts.onProgress) ? postWithXHR(url, body, opts) : postWithFetch(url, body);
  }
  
  if (!window.utils) window.utils = {};
  window.utils.postData = postData;
})();
