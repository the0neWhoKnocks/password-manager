module.exports = function apiMiddleware({
  // res,
  urlPath,
}) {
  if (urlPath.startsWith('/api')) {
    // const handleLoadError = (err) => {
    //   console.log('[ERROR] Loading Markers', err);
    //   res.statusCode = 500;
    //   res.statusMessage = err;
    //   res.end();
    // };
    // const handleSaveError = (err) => {
    //   console.log('[ERROR] Saving Markers', err);
    //   res.statusCode = 500;
    //   res.statusMessage = err;
    //   res.end();
    // };
    // const contentTypeJSON = ['Content-Type', 'application/json'];
    // 
    // if (urlPath.endsWith('/delete')) {
    //   parseReq(req).then(({ uid }) => {
    //     loadMarkers(USER_MARKERS_PATH)
    //       .then((loadedMarkers) => {
    //         const { marker, ndx } = getMarkerById(loadedMarkers, uid);
    //         loadedMarkers.splice(ndx, 1);
    // 
    //         saveMarkers(loadedMarkers)
    //           .then((savedMarkers) => {
    //             console.log('[DELETED] Marker', marker);
    //             res.setHeader(...contentTypeJSON);
    //             res.end(JSON.stringify([
    //               ...defaultMarkers,
    //               ...loadedMarkers,
    //             ]));
    //           })
    //           .catch(handleSaveError);
    //       })
    //       .catch(handleLoadError);
    //   });
    // }
    // else if (urlPath.endsWith('/load-all')) {
    //   loadMarkers(USER_MARKERS_PATH)
    //     .then((loadedMarkers) => {
    //       res.setHeader(...contentTypeJSON);
    //       res.end(JSON.stringify([
    //         ...defaultMarkers,
    //         ...loadedMarkers,
    //       ]));
    //     })
    //     .catch(handleLoadError);
    // }
    // else if (urlPath.endsWith('/save')) {
    //   parseReq(req).then((marker) => {
    //     loadMarkers(USER_MARKERS_PATH)
    //       .then((loadedMarkers) => {
    //         const markers = loadedMarkers.reduce((arr, m) => {
    //           if (m.data.uid !== marker.data.uid) arr.push(m);
    //           return arr;
    //         }, []);
    //         markers.push(marker);
    // 
    //         saveMarkers(markers)
    //           .then((savedMarkers) => {
    //             console.log('[SAVED] Marker', marker);
    //             res.setHeader(...contentTypeJSON);
    //             res.end(JSON.stringify([
    //               ...defaultMarkers,
    //               ...markers,
    //             ]));
    //           })
    //           .catch(handleSaveError);
    //       })
    //       .catch(handleLoadError);
    //   });
    // }
    // else if (urlPath.endsWith('/update')) {
    //   parseReq(req).then(({ data, uid }) => {
    //     loadMarkers(USER_MARKERS_PATH)
    //       .then((loadedMarkers) => {
    //         const { marker, ndx } = getMarkerById(loadedMarkers, uid);
    //         const updatedMarker = {
    //           ...marker,
    //           ...data,
    //         };
    //         loadedMarkers[ndx] = updatedMarker;
    // 
    //         saveMarkers(loadedMarkers)
    //           .then((savedMarkers) => {
    //             console.log('[UPDATED] Marker', updatedMarker);
    //             res.setHeader(...contentTypeJSON);
    //             res.end(JSON.stringify([
    //               ...defaultMarkers,
    //               ...loadedMarkers,
    //             ]));
    //           })
    //           .catch(handleSaveError);
    //       })
    //       .catch(handleLoadError);
    //   });
    // }
  }
}