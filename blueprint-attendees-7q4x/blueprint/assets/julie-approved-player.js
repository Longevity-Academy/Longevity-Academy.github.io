(function () {
  'use strict';
  var video = document.getElementById('julie-approved-film');
  if (!video) return;
  var source = 'assets/julie-approved-4k/master.m3u8';
  function play() {
    var promise = video.play();
    if (promise && promise.catch) promise.catch(function () {});
  }
  if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = source;
    video.addEventListener('loadedmetadata', play, {once: true});
  } else if (window.Hls && window.Hls.isSupported()) {
    var hls = new window.Hls({
      enableWorker: true,
      maxBufferLength: 8,
      maxMaxBufferLength: 16,
      backBufferLength: 4,
      startLevel: 0
    });
    hls.loadSource(source);
    hls.attachMedia(video);
    hls.on(window.Hls.Events.MANIFEST_PARSED, play);
    hls.on(window.Hls.Events.ERROR, function (_, data) {
      if (!data.fatal) return;
      if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
      else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
    });
    video._julieHls = hls;
  }
})();
