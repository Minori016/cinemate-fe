import {
  require_jsx_runtime
} from "./chunk-TGFRTKTZ.js";
import {
  require_react
} from "./chunk-7JZAKNLV.js";
import {
  __toESM
} from "./chunk-2TUXWMP5.js";

// node_modules/react-lite-youtube-embed/dist/index.es.js
var import_jsx_runtime = __toESM(require_jsx_runtime());
var l = __toESM(require_react());
var import_react = __toESM(require_react());
var q = {
  default: 120,
  mqdefault: 320,
  hqdefault: 480,
  sddefault: 640,
  maxresdefault: 1280
};
var K = (e, t, u, s = "maxresdefault") => {
  const [a, r] = (0, import_react.useState)("");
  return (0, import_react.useEffect)(() => {
    const o = `https://img.youtube.com/${t}/${e}/${s}.${u}`, y = `https://img.youtube.com/${t}/${e}/hqdefault.${u}`, c = q[s], d = new Image();
    d.onload = () => {
      d.width < c ? r(y) : r(o);
    }, d.onerror = () => r(y), d.src = o;
  }, [e, t, u, s]), a;
};
var X = ((e) => (e[e.UNSTARTED = -1] = "UNSTARTED", e[e.ENDED = 0] = "ENDED", e[e.PLAYING = 1] = "PLAYING", e[e.PAUSED = 2] = "PAUSED", e[e.BUFFERING = 3] = "BUFFERING", e[e.CUED = 5] = "CUED", e))(X || {});
var Z = ((e) => (e[e.INVALID_PARAM = 2] = "INVALID_PARAM", e[e.HTML5_ERROR = 5] = "HTML5_ERROR", e[e.VIDEO_NOT_FOUND = 100] = "VIDEO_NOT_FOUND", e[e.NOT_EMBEDDABLE = 101] = "NOT_EMBEDDABLE", e[e.NOT_EMBEDDABLE_DISGUISED = 150] = "NOT_EMBEDDABLE_DISGUISED", e))(Z || {});
function p(e, t, u, s, a) {
  const r = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: (a == null ? void 0 : a.name) || t,
    thumbnailUrl: [(a == null ? void 0 : a.thumbnailUrl) || u],
    embedUrl: (a == null ? void 0 : a.embedUrl) || `${s}/embed/${e}`,
    contentUrl: (a == null ? void 0 : a.contentUrl) || `https://www.youtube.com/watch?v=${e}`,
    ...(a == null ? void 0 : a.description) && { description: a.description },
    ...(a == null ? void 0 : a.uploadDate) && { uploadDate: a.uploadDate },
    ...(a == null ? void 0 : a.duration) && { duration: a.duration }
  };
  return JSON.stringify(r);
}
function ee(e, t) {
  const [u, s] = l.useState(false), [a, r] = l.useState(
    e.alwaysLoadIframe || e.autoplay || false
  ), o = encodeURIComponent(e.id), y = typeof e.playlistCoverId == "string" ? encodeURIComponent(e.playlistCoverId) : null, c = e.title, d = e.poster || "hqdefault", $ = e.announce || "Watch", U = e.alwaysLoadIframe || e.autoplay ? e.autoplay && e.muted : true, v = l.useMemo(() => {
    const E = new URLSearchParams({
      ...e.muted ? { mute: "1" } : {},
      ...U ? { autoplay: "1" } : {},
      ...e.enableJsApi ? { enablejsapi: "1" } : {},
      ...e.enableJsApi && typeof window < "u" ? { origin: window.location.origin } : {},
      ...e.playlist ? { list: o } : {}
    });
    return e.params && (typeof e.params == "string" ? new URLSearchParams(
      e.params.startsWith("&") ? e.params.slice(1) : e.params
    ).forEach((h, C) => {
      E.append(C, h);
    }) : Object.entries(e.params).forEach(([g, h]) => {
      E.append(g, String(h));
    })), E;
  }, [
    e.muted,
    U,
    e.enableJsApi,
    e.playlist,
    o,
    e.params
  ]), b = l.useMemo(
    () => e.cookie ? "https://www.youtube.com" : "https://www.youtube-nocookie.com",
    [e.cookie]
  ), M = l.useMemo(
    () => e.playlist ? `${b}/embed/videoseries?${v.toString()}` : `${b}/embed/${o}?${v.toString()}`,
    [e.playlist, b, o, v]
  ), _ = !e.thumbnail && !e.playlist && d === "maxresdefault", I = e.webp ? "webp" : "jpg", R = e.webp ? "vi_webp" : "vi", A = _ ? K(e.id, R, I, d) : null, k = l.useMemo(
    () => e.thumbnail || A || `https://i.ytimg.com/${R}/${e.playlist ? y : o}/${d}.${I}`,
    [
      e.thumbnail,
      A,
      R,
      e.playlist,
      y,
      o,
      d,
      I
    ]
  ), B = e.activatedClass || "lyt-activated", P = e.adNetwork || false, W = e.aspectHeight || 9, j = e.aspectWidth || 16, x = e.iframeClass || "", F = e.playerClass || "lty-playbtn", Q = e.wrapperClass || "yt-lite", O = l.useCallback(
    e.onIframeAdded || function() {
    },
    [e.onIframeAdded]
  ), V = e.rel ? "prefetch" : "preload", Y = e.containerElement || "article", H = e.noscriptFallback !== false, J = () => {
    u || s(true);
  }, S = () => {
    a || r(true);
  };
  return l.useEffect(() => {
    a && (O(), e.focusOnLoad && typeof t == "object" && (t == null ? void 0 : t.current) && t.current.focus());
  }, [a, O, e.focusOnLoad, t]), l.useEffect(() => {
    var _a;
    if (!a || !e.enableJsApi || !(e.onReady || e.onStateChange || e.onError || e.onPlay || e.onPause || e.onEnd || e.onBuffering || e.onPlaybackRateChange || e.onPlaybackQualityChange))
      return;
    let g = false, h = false;
    const C = (m) => {
      var _a2, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t;
      if (m.origin !== "https://www.youtube.com" && m.origin !== "https://www.youtube-nocookie.com")
        return;
      let n;
      try {
        n = typeof m.data == "string" ? JSON.parse(m.data) : m.data;
      } catch {
        return;
      }
      switch (n.event) {
        case "onReady":
          g || (g = true, e.onReady && e.onReady({
            videoId: e.id,
            title: c
          }));
          break;
        case "infoDelivery":
          if (((_a2 = n.info) == null ? void 0 : _a2.playerState) !== void 0) {
            const f = n.info.playerState;
            switch (e.onStateChange && e.onStateChange({
              state: f,
              currentTime: n.info.currentTime,
              duration: n.info.duration
            }), f) {
              case 1:
                (_b = e.onPlay) == null ? void 0 : _b.call(e);
                break;
              case 2:
                (_c = e.onPause) == null ? void 0 : _c.call(e);
                break;
              case 0:
                (_d = e.onEnd) == null ? void 0 : _d.call(e), e.stopOnEnd && typeof t == "object" && ((_e = t == null ? void 0 : t.current) == null ? void 0 : _e.contentWindow) && t.current.contentWindow.postMessage(
                  '{"event":"command","func":"stopVideo","args":""}',
                  "*"
                );
                break;
              case 3:
                (_f = e.onBuffering) == null ? void 0 : _f.call(e);
                break;
            }
          }
          ((_g = n.info) == null ? void 0 : _g.playbackRate) !== void 0 && ((_h = e.onPlaybackRateChange) == null ? void 0 : _h.call(e, n.info.playbackRate)), ((_i = n.info) == null ? void 0 : _i.playbackQuality) !== void 0 && ((_j = e.onPlaybackQualityChange) == null ? void 0 : _j.call(e, n.info.playbackQuality));
          break;
        case "onStateChange":
          if (((_k = n.info) == null ? void 0 : _k.playerState) !== void 0) {
            const f = n.info.playerState;
            switch (e.onStateChange && e.onStateChange({
              state: f,
              currentTime: n.info.currentTime,
              duration: n.info.duration
            }), f) {
              case 1:
                (_l = e.onPlay) == null ? void 0 : _l.call(e);
                break;
              case 2:
                (_m = e.onPause) == null ? void 0 : _m.call(e);
                break;
              case 0:
                (_n = e.onEnd) == null ? void 0 : _n.call(e), e.stopOnEnd && typeof t == "object" && ((_o = t == null ? void 0 : t.current) == null ? void 0 : _o.contentWindow) && t.current.contentWindow.postMessage(
                  '{"event":"command","func":"stopVideo","args":""}',
                  "*"
                );
                break;
              case 3:
                (_p = e.onBuffering) == null ? void 0 : _p.call(e);
                break;
            }
          }
          break;
        case "onError":
          if (n.info && "errorCode" in n.info) {
            const f = n.info.errorCode;
            e.onError && e.onError(f);
          }
          break;
        case "onPlaybackRateChange":
          ((_q = n.info) == null ? void 0 : _q.playbackRate) !== void 0 && ((_r = e.onPlaybackRateChange) == null ? void 0 : _r.call(e, n.info.playbackRate));
          break;
        case "onPlaybackQualityChange":
          ((_s = n.info) == null ? void 0 : _s.playbackQuality) !== void 0 && ((_t = e.onPlaybackQualityChange) == null ? void 0 : _t.call(e, n.info.playbackQuality));
          break;
      }
    };
    window.addEventListener("message", C);
    const L = [], N = () => {
      var _a2;
      typeof t == "object" && ((_a2 = t == null ? void 0 : t.current) == null ? void 0 : _a2.contentWindow) && t.current.contentWindow.postMessage(
        '{"event":"listening","id":"' + o + '"}',
        "*"
      );
    }, T = () => {
      if (h)
        return;
      h = true, N(), [100, 300, 600, 1200, 2400].forEach((n) => {
        L.push(setTimeout(N, n));
      });
    };
    return typeof t == "object" && (t == null ? void 0 : t.current) ? (t.current.addEventListener("load", T), ((_a = t.current.contentDocument) == null ? void 0 : _a.readyState) === "complete" && T()) : [200, 500, 1e3, 2e3, 3e3].forEach((n) => {
      L.push(setTimeout(N, n));
    }), () => {
      window.removeEventListener("message", C), L.forEach(clearTimeout), typeof t == "object" && (t == null ? void 0 : t.current) && t.current.removeEventListener("load", T);
    };
  }, [
    a,
    e.enableJsApi,
    e.onReady,
    e.onStateChange,
    e.onError,
    e.onPlay,
    e.onPause,
    e.onEnd,
    e.onBuffering,
    e.onPlaybackRateChange,
    e.onPlaybackQualityChange,
    e.stopOnEnd,
    e.id,
    o,
    c,
    t
  ]), (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    !e.lazyLoad && (0, import_jsx_runtime.jsx)("link", { rel: V, href: k, as: "image" }),
    (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: u && (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
      (0, import_jsx_runtime.jsx)("link", { rel: "preconnect", href: b }),
      (0, import_jsx_runtime.jsx)("link", { rel: "preconnect", href: "https://www.google.com" }),
      P && (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
        (0, import_jsx_runtime.jsx)("link", { rel: "preconnect", href: "https://static.doubleclick.net" }),
        (0, import_jsx_runtime.jsx)(
          "link",
          {
            rel: "preconnect",
            href: "https://googleads.g.doubleclick.net"
          }
        )
      ] })
    ] }) }),
    e.seo && !e.playlist && (0, import_jsx_runtime.jsx)(
      "script",
      {
        type: "application/ld+json",
        dangerouslySetInnerHTML: {
          __html: p(
            e.id,
            c,
            k,
            b,
            e.seo
          )
        }
      }
    ),
    H && !e.playlist && (0, import_jsx_runtime.jsx)("noscript", { children: (0, import_jsx_runtime.jsxs)(
      "a",
      {
        href: `https://www.youtube.com/watch?v=${e.id}`,
        "aria-label": `Watch ${c} on YouTube`,
        children: [
          'Watch "',
          c,
          '" on YouTube'
        ]
      }
    ) }),
    (0, import_jsx_runtime.jsxs)(
      Y,
      {
        onPointerOver: J,
        onClick: S,
        className: `${Q} ${a ? B : ""}`,
        "data-title": c,
        role: !a && !e.lazyLoad ? "img" : void 0,
        "aria-label": a ? void 0 : `${c} - YouTube video preview`,
        style: {
          ...!e.lazyLoad && { backgroundImage: `url(${k})` },
          "--aspect-ratio": `${W / j * 100}%`,
          ...e.style || {}
        },
        children: [
          e.lazyLoad && !a && (0, import_jsx_runtime.jsx)(
            "img",
            {
              src: k,
              alt: `${c} - YouTube thumbnail`,
              className: "lty-thumbnail",
              loading: "lazy"
            }
          ),
          e.playlist && !a && (0, import_jsx_runtime.jsx)("div", { className: "lty-playlist-icon", "aria-hidden": "true" }),
          !(e.hideButtonOnActivate && a) && (0, import_jsx_runtime.jsx)(
            "button",
            {
              type: "button",
              className: F,
              "aria-label": `${$} ${c}`,
              "aria-hidden": a || void 0,
              tabIndex: a ? -1 : 0,
              onClick: S,
              children: (0, import_jsx_runtime.jsx)("span", { className: "lty-visually-hidden", children: $ })
            }
          ),
          a && (0, import_jsx_runtime.jsx)(
            "iframe",
            {
              ref: t,
              className: x,
              title: c,
              width: "560",
              height: "315",
              allow: "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture",
              allowFullScreen: true,
              src: M,
              referrerPolicy: e.referrerPolicy || "strict-origin-when-cross-origin"
            }
          )
        ]
      }
    )
  ] });
}
var ne = l.forwardRef(
  ee
);
export {
  Z as PlayerError,
  X as PlayerState,
  ne as default
};
//# sourceMappingURL=react-lite-youtube-embed.js.map
