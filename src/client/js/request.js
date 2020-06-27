if (!window.utils) window.utils = {};

window.utils.postData = function postData(url, form) {
  return window.fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(window.utils.serializeForm(form)),
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
