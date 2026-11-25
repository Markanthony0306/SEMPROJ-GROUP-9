(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __esm = (fn, res, err) => function __init() {
    if (err) throw err[0];
    try {
      return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
    } catch (e) {
      throw err = [e], e;
    }
  };
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // <define:import.meta.env>
  var define_import_meta_env_default;
  var init_define_import_meta_env = __esm({
    "<define:import.meta.env>"() {
      define_import_meta_env_default = { DEV: true, BASE_URL: "/" };
    }
  });

  // node_modules/react/cjs/react.production.min.js
  var require_react_production_min = __commonJS({
    "node_modules/react/cjs/react.production.min.js"(exports2) {
      "use strict";
      init_define_import_meta_env();
      var l = /* @__PURE__ */ Symbol.for("react.element");
      var n = /* @__PURE__ */ Symbol.for("react.portal");
      var p = /* @__PURE__ */ Symbol.for("react.fragment");
      var q = /* @__PURE__ */ Symbol.for("react.strict_mode");
      var r = /* @__PURE__ */ Symbol.for("react.profiler");
      var t = /* @__PURE__ */ Symbol.for("react.provider");
      var u = /* @__PURE__ */ Symbol.for("react.context");
      var v = /* @__PURE__ */ Symbol.for("react.forward_ref");
      var w = /* @__PURE__ */ Symbol.for("react.suspense");
      var x = /* @__PURE__ */ Symbol.for("react.memo");
      var y = /* @__PURE__ */ Symbol.for("react.lazy");
      var z = Symbol.iterator;
      function A(a) {
        if (null === a || "object" !== typeof a) return null;
        a = z && a[z] || a["@@iterator"];
        return "function" === typeof a ? a : null;
      }
      var B = { isMounted: function() {
        return false;
      }, enqueueForceUpdate: function() {
      }, enqueueReplaceState: function() {
      }, enqueueSetState: function() {
      } };
      var C = Object.assign;
      var D = {};
      function E(a, b, e) {
        this.props = a;
        this.context = b;
        this.refs = D;
        this.updater = e || B;
      }
      E.prototype.isReactComponent = {};
      E.prototype.setState = function(a, b) {
        if ("object" !== typeof a && "function" !== typeof a && null != a) throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");
        this.updater.enqueueSetState(this, a, b, "setState");
      };
      E.prototype.forceUpdate = function(a) {
        this.updater.enqueueForceUpdate(this, a, "forceUpdate");
      };
      function F() {
      }
      F.prototype = E.prototype;
      function G(a, b, e) {
        this.props = a;
        this.context = b;
        this.refs = D;
        this.updater = e || B;
      }
      var H = G.prototype = new F();
      H.constructor = G;
      C(H, E.prototype);
      H.isPureReactComponent = true;
      var I = Array.isArray;
      var J = Object.prototype.hasOwnProperty;
      var K = { current: null };
      var L = { key: true, ref: true, __self: true, __source: true };
      function M(a, b, e) {
        var d, c = {}, k = null, h = null;
        if (null != b) for (d in void 0 !== b.ref && (h = b.ref), void 0 !== b.key && (k = "" + b.key), b) J.call(b, d) && !L.hasOwnProperty(d) && (c[d] = b[d]);
        var g = arguments.length - 2;
        if (1 === g) c.children = e;
        else if (1 < g) {
          for (var f = Array(g), m = 0; m < g; m++) f[m] = arguments[m + 2];
          c.children = f;
        }
        if (a && a.defaultProps) for (d in g = a.defaultProps, g) void 0 === c[d] && (c[d] = g[d]);
        return { $$typeof: l, type: a, key: k, ref: h, props: c, _owner: K.current };
      }
      function N(a, b) {
        return { $$typeof: l, type: a.type, key: b, ref: a.ref, props: a.props, _owner: a._owner };
      }
      function O(a) {
        return "object" === typeof a && null !== a && a.$$typeof === l;
      }
      function escape(a) {
        var b = { "=": "=0", ":": "=2" };
        return "$" + a.replace(/[=:]/g, function(a2) {
          return b[a2];
        });
      }
      var P = /\/+/g;
      function Q(a, b) {
        return "object" === typeof a && null !== a && null != a.key ? escape("" + a.key) : b.toString(36);
      }
      function R(a, b, e, d, c) {
        var k = typeof a;
        if ("undefined" === k || "boolean" === k) a = null;
        var h = false;
        if (null === a) h = true;
        else switch (k) {
          case "string":
          case "number":
            h = true;
            break;
          case "object":
            switch (a.$$typeof) {
              case l:
              case n:
                h = true;
            }
        }
        if (h) return h = a, c = c(h), a = "" === d ? "." + Q(h, 0) : d, I(c) ? (e = "", null != a && (e = a.replace(P, "$&/") + "/"), R(c, b, e, "", function(a2) {
          return a2;
        })) : null != c && (O(c) && (c = N(c, e + (!c.key || h && h.key === c.key ? "" : ("" + c.key).replace(P, "$&/") + "/") + a)), b.push(c)), 1;
        h = 0;
        d = "" === d ? "." : d + ":";
        if (I(a)) for (var g = 0; g < a.length; g++) {
          k = a[g];
          var f = d + Q(k, g);
          h += R(k, b, e, f, c);
        }
        else if (f = A(a), "function" === typeof f) for (a = f.call(a), g = 0; !(k = a.next()).done; ) k = k.value, f = d + Q(k, g++), h += R(k, b, e, f, c);
        else if ("object" === k) throw b = String(a), Error("Objects are not valid as a React child (found: " + ("[object Object]" === b ? "object with keys {" + Object.keys(a).join(", ") + "}" : b) + "). If you meant to render a collection of children, use an array instead.");
        return h;
      }
      function S(a, b, e) {
        if (null == a) return a;
        var d = [], c = 0;
        R(a, d, "", "", function(a2) {
          return b.call(e, a2, c++);
        });
        return d;
      }
      function T(a) {
        if (-1 === a._status) {
          var b = a._result;
          b = b();
          b.then(function(b2) {
            if (0 === a._status || -1 === a._status) a._status = 1, a._result = b2;
          }, function(b2) {
            if (0 === a._status || -1 === a._status) a._status = 2, a._result = b2;
          });
          -1 === a._status && (a._status = 0, a._result = b);
        }
        if (1 === a._status) return a._result.default;
        throw a._result;
      }
      var U = { current: null };
      var V = { transition: null };
      var W = { ReactCurrentDispatcher: U, ReactCurrentBatchConfig: V, ReactCurrentOwner: K };
      function X() {
        throw Error("act(...) is not supported in production builds of React.");
      }
      exports2.Children = { map: S, forEach: function(a, b, e) {
        S(a, function() {
          b.apply(this, arguments);
        }, e);
      }, count: function(a) {
        var b = 0;
        S(a, function() {
          b++;
        });
        return b;
      }, toArray: function(a) {
        return S(a, function(a2) {
          return a2;
        }) || [];
      }, only: function(a) {
        if (!O(a)) throw Error("React.Children.only expected to receive a single React element child.");
        return a;
      } };
      exports2.Component = E;
      exports2.Fragment = p;
      exports2.Profiler = r;
      exports2.PureComponent = G;
      exports2.StrictMode = q;
      exports2.Suspense = w;
      exports2.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = W;
      exports2.act = X;
      exports2.cloneElement = function(a, b, e) {
        if (null === a || void 0 === a) throw Error("React.cloneElement(...): The argument must be a React element, but you passed " + a + ".");
        var d = C({}, a.props), c = a.key, k = a.ref, h = a._owner;
        if (null != b) {
          void 0 !== b.ref && (k = b.ref, h = K.current);
          void 0 !== b.key && (c = "" + b.key);
          if (a.type && a.type.defaultProps) var g = a.type.defaultProps;
          for (f in b) J.call(b, f) && !L.hasOwnProperty(f) && (d[f] = void 0 === b[f] && void 0 !== g ? g[f] : b[f]);
        }
        var f = arguments.length - 2;
        if (1 === f) d.children = e;
        else if (1 < f) {
          g = Array(f);
          for (var m = 0; m < f; m++) g[m] = arguments[m + 2];
          d.children = g;
        }
        return { $$typeof: l, type: a.type, key: c, ref: k, props: d, _owner: h };
      };
      exports2.createContext = function(a) {
        a = { $$typeof: u, _currentValue: a, _currentValue2: a, _threadCount: 0, Provider: null, Consumer: null, _defaultValue: null, _globalName: null };
        a.Provider = { $$typeof: t, _context: a };
        return a.Consumer = a;
      };
      exports2.createElement = M;
      exports2.createFactory = function(a) {
        var b = M.bind(null, a);
        b.type = a;
        return b;
      };
      exports2.createRef = function() {
        return { current: null };
      };
      exports2.forwardRef = function(a) {
        return { $$typeof: v, render: a };
      };
      exports2.isValidElement = O;
      exports2.lazy = function(a) {
        return { $$typeof: y, _payload: { _status: -1, _result: a }, _init: T };
      };
      exports2.memo = function(a, b) {
        return { $$typeof: x, type: a, compare: void 0 === b ? null : b };
      };
      exports2.startTransition = function(a) {
        var b = V.transition;
        V.transition = {};
        try {
          a();
        } finally {
          V.transition = b;
        }
      };
      exports2.unstable_act = X;
      exports2.useCallback = function(a, b) {
        return U.current.useCallback(a, b);
      };
      exports2.useContext = function(a) {
        return U.current.useContext(a);
      };
      exports2.useDebugValue = function() {
      };
      exports2.useDeferredValue = function(a) {
        return U.current.useDeferredValue(a);
      };
      exports2.useEffect = function(a, b) {
        return U.current.useEffect(a, b);
      };
      exports2.useId = function() {
        return U.current.useId();
      };
      exports2.useImperativeHandle = function(a, b, e) {
        return U.current.useImperativeHandle(a, b, e);
      };
      exports2.useInsertionEffect = function(a, b) {
        return U.current.useInsertionEffect(a, b);
      };
      exports2.useLayoutEffect = function(a, b) {
        return U.current.useLayoutEffect(a, b);
      };
      exports2.useMemo = function(a, b) {
        return U.current.useMemo(a, b);
      };
      exports2.useReducer = function(a, b, e) {
        return U.current.useReducer(a, b, e);
      };
      exports2.useRef = function(a) {
        return U.current.useRef(a);
      };
      exports2.useState = function(a) {
        return U.current.useState(a);
      };
      exports2.useSyncExternalStore = function(a, b, e) {
        return U.current.useSyncExternalStore(a, b, e);
      };
      exports2.useTransition = function() {
        return U.current.useTransition();
      };
      exports2.version = "18.3.1";
    }
  });

  // node_modules/react/index.js
  var require_react = __commonJS({
    "node_modules/react/index.js"(exports2, module) {
      "use strict";
      init_define_import_meta_env();
      if (true) {
        module.exports = require_react_production_min();
      } else {
        module.exports = null;
      }
    }
  });

  // node_modules/scheduler/cjs/scheduler.production.min.js
  var require_scheduler_production_min = __commonJS({
    "node_modules/scheduler/cjs/scheduler.production.min.js"(exports2) {
      "use strict";
      init_define_import_meta_env();
      function f(a, b) {
        var c = a.length;
        a.push(b);
        a: for (; 0 < c; ) {
          var d = c - 1 >>> 1, e = a[d];
          if (0 < g(e, b)) a[d] = b, a[c] = e, c = d;
          else break a;
        }
      }
      function h(a) {
        return 0 === a.length ? null : a[0];
      }
      function k(a) {
        if (0 === a.length) return null;
        var b = a[0], c = a.pop();
        if (c !== b) {
          a[0] = c;
          a: for (var d = 0, e = a.length, w = e >>> 1; d < w; ) {
            var m = 2 * (d + 1) - 1, C = a[m], n = m + 1, x = a[n];
            if (0 > g(C, c)) n < e && 0 > g(x, C) ? (a[d] = x, a[n] = c, d = n) : (a[d] = C, a[m] = c, d = m);
            else if (n < e && 0 > g(x, c)) a[d] = x, a[n] = c, d = n;
            else break a;
          }
        }
        return b;
      }
      function g(a, b) {
        var c = a.sortIndex - b.sortIndex;
        return 0 !== c ? c : a.id - b.id;
      }
      if ("object" === typeof performance && "function" === typeof performance.now) {
        l = performance;
        exports2.unstable_now = function() {
          return l.now();
        };
      } else {
        p = Date, q = p.now();
        exports2.unstable_now = function() {
          return p.now() - q;
        };
      }
      var l;
      var p;
      var q;
      var r = [];
      var t = [];
      var u = 1;
      var v = null;
      var y = 3;
      var z = false;
      var A = false;
      var B = false;
      var D = "function" === typeof setTimeout ? setTimeout : null;
      var E = "function" === typeof clearTimeout ? clearTimeout : null;
      var F = "undefined" !== typeof setImmediate ? setImmediate : null;
      "undefined" !== typeof navigator && void 0 !== navigator.scheduling && void 0 !== navigator.scheduling.isInputPending && navigator.scheduling.isInputPending.bind(navigator.scheduling);
      function G(a) {
        for (var b = h(t); null !== b; ) {
          if (null === b.callback) k(t);
          else if (b.startTime <= a) k(t), b.sortIndex = b.expirationTime, f(r, b);
          else break;
          b = h(t);
        }
      }
      function H(a) {
        B = false;
        G(a);
        if (!A) if (null !== h(r)) A = true, I(J);
        else {
          var b = h(t);
          null !== b && K(H, b.startTime - a);
        }
      }
      function J(a, b) {
        A = false;
        B && (B = false, E(L), L = -1);
        z = true;
        var c = y;
        try {
          G(b);
          for (v = h(r); null !== v && (!(v.expirationTime > b) || a && !M()); ) {
            var d = v.callback;
            if ("function" === typeof d) {
              v.callback = null;
              y = v.priorityLevel;
              var e = d(v.expirationTime <= b);
              b = exports2.unstable_now();
              "function" === typeof e ? v.callback = e : v === h(r) && k(r);
              G(b);
            } else k(r);
            v = h(r);
          }
          if (null !== v) var w = true;
          else {
            var m = h(t);
            null !== m && K(H, m.startTime - b);
            w = false;
          }
          return w;
        } finally {
          v = null, y = c, z = false;
        }
      }
      var N = false;
      var O = null;
      var L = -1;
      var P = 5;
      var Q = -1;
      function M() {
        return exports2.unstable_now() - Q < P ? false : true;
      }
      function R() {
        if (null !== O) {
          var a = exports2.unstable_now();
          Q = a;
          var b = true;
          try {
            b = O(true, a);
          } finally {
            b ? S() : (N = false, O = null);
          }
        } else N = false;
      }
      var S;
      if ("function" === typeof F) S = function() {
        F(R);
      };
      else if ("undefined" !== typeof MessageChannel) {
        T = new MessageChannel(), U = T.port2;
        T.port1.onmessage = R;
        S = function() {
          U.postMessage(null);
        };
      } else S = function() {
        D(R, 0);
      };
      var T;
      var U;
      function I(a) {
        O = a;
        N || (N = true, S());
      }
      function K(a, b) {
        L = D(function() {
          a(exports2.unstable_now());
        }, b);
      }
      exports2.unstable_IdlePriority = 5;
      exports2.unstable_ImmediatePriority = 1;
      exports2.unstable_LowPriority = 4;
      exports2.unstable_NormalPriority = 3;
      exports2.unstable_Profiling = null;
      exports2.unstable_UserBlockingPriority = 2;
      exports2.unstable_cancelCallback = function(a) {
        a.callback = null;
      };
      exports2.unstable_continueExecution = function() {
        A || z || (A = true, I(J));
      };
      exports2.unstable_forceFrameRate = function(a) {
        0 > a || 125 < a ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported") : P = 0 < a ? Math.floor(1e3 / a) : 5;
      };
      exports2.unstable_getCurrentPriorityLevel = function() {
        return y;
      };
      exports2.unstable_getFirstCallbackNode = function() {
        return h(r);
      };
      exports2.unstable_next = function(a) {
        switch (y) {
          case 1:
          case 2:
          case 3:
            var b = 3;
            break;
          default:
            b = y;
        }
        var c = y;
        y = b;
        try {
          return a();
        } finally {
          y = c;
        }
      };
      exports2.unstable_pauseExecution = function() {
      };
      exports2.unstable_requestPaint = function() {
      };
      exports2.unstable_runWithPriority = function(a, b) {
        switch (a) {
          case 1:
          case 2:
          case 3:
          case 4:
          case 5:
            break;
          default:
            a = 3;
        }
        var c = y;
        y = a;
        try {
          return b();
        } finally {
          y = c;
        }
      };
      exports2.unstable_scheduleCallback = function(a, b, c) {
        var d = exports2.unstable_now();
        "object" === typeof c && null !== c ? (c = c.delay, c = "number" === typeof c && 0 < c ? d + c : d) : c = d;
        switch (a) {
          case 1:
            var e = -1;
            break;
          case 2:
            e = 250;
            break;
          case 5:
            e = 1073741823;
            break;
          case 4:
            e = 1e4;
            break;
          default:
            e = 5e3;
        }
        e = c + e;
        a = { id: u++, callback: b, priorityLevel: a, startTime: c, expirationTime: e, sortIndex: -1 };
        c > d ? (a.sortIndex = c, f(t, a), null === h(r) && a === h(t) && (B ? (E(L), L = -1) : B = true, K(H, c - d))) : (a.sortIndex = e, f(r, a), A || z || (A = true, I(J)));
        return a;
      };
      exports2.unstable_shouldYield = M;
      exports2.unstable_wrapCallback = function(a) {
        var b = y;
        return function() {
          var c = y;
          y = b;
          try {
            return a.apply(this, arguments);
          } finally {
            y = c;
          }
        };
      };
    }
  });

  // node_modules/scheduler/index.js
  var require_scheduler = __commonJS({
    "node_modules/scheduler/index.js"(exports2, module) {
      "use strict";
      init_define_import_meta_env();
      if (true) {
        module.exports = require_scheduler_production_min();
      } else {
        module.exports = null;
      }
    }
  });

  // node_modules/react-dom/cjs/react-dom.production.min.js
  var require_react_dom_production_min = __commonJS({
    "node_modules/react-dom/cjs/react-dom.production.min.js"(exports2) {
      "use strict";
      init_define_import_meta_env();
      var aa = require_react();
      var ca = require_scheduler();
      function p(a) {
        for (var b = "https://reactjs.org/docs/error-decoder.html?invariant=" + a, c = 1; c < arguments.length; c++) b += "&args[]=" + encodeURIComponent(arguments[c]);
        return "Minified React error #" + a + "; visit " + b + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
      }
      var da = /* @__PURE__ */ new Set();
      var ea = {};
      function fa(a, b) {
        ha(a, b);
        ha(a + "Capture", b);
      }
      function ha(a, b) {
        ea[a] = b;
        for (a = 0; a < b.length; a++) da.add(b[a]);
      }
      var ia = !("undefined" === typeof window || "undefined" === typeof window.document || "undefined" === typeof window.document.createElement);
      var ja = Object.prototype.hasOwnProperty;
      var ka = /^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/;
      var la = {};
      var ma = {};
      function oa(a) {
        if (ja.call(ma, a)) return true;
        if (ja.call(la, a)) return false;
        if (ka.test(a)) return ma[a] = true;
        la[a] = true;
        return false;
      }
      function pa(a, b, c, d) {
        if (null !== c && 0 === c.type) return false;
        switch (typeof b) {
          case "function":
          case "symbol":
            return true;
          case "boolean":
            if (d) return false;
            if (null !== c) return !c.acceptsBooleans;
            a = a.toLowerCase().slice(0, 5);
            return "data-" !== a && "aria-" !== a;
          default:
            return false;
        }
      }
      function qa(a, b, c, d) {
        if (null === b || "undefined" === typeof b || pa(a, b, c, d)) return true;
        if (d) return false;
        if (null !== c) switch (c.type) {
          case 3:
            return !b;
          case 4:
            return false === b;
          case 5:
            return isNaN(b);
          case 6:
            return isNaN(b) || 1 > b;
        }
        return false;
      }
      function v(a, b, c, d, e, f, g) {
        this.acceptsBooleans = 2 === b || 3 === b || 4 === b;
        this.attributeName = d;
        this.attributeNamespace = e;
        this.mustUseProperty = c;
        this.propertyName = a;
        this.type = b;
        this.sanitizeURL = f;
        this.removeEmptyString = g;
      }
      var z = {};
      "children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style".split(" ").forEach(function(a) {
        z[a] = new v(a, 0, false, a, null, false, false);
      });
      [["acceptCharset", "accept-charset"], ["className", "class"], ["htmlFor", "for"], ["httpEquiv", "http-equiv"]].forEach(function(a) {
        var b = a[0];
        z[b] = new v(b, 1, false, a[1], null, false, false);
      });
      ["contentEditable", "draggable", "spellCheck", "value"].forEach(function(a) {
        z[a] = new v(a, 2, false, a.toLowerCase(), null, false, false);
      });
      ["autoReverse", "externalResourcesRequired", "focusable", "preserveAlpha"].forEach(function(a) {
        z[a] = new v(a, 2, false, a, null, false, false);
      });
      "allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope".split(" ").forEach(function(a) {
        z[a] = new v(a, 3, false, a.toLowerCase(), null, false, false);
      });
      ["checked", "multiple", "muted", "selected"].forEach(function(a) {
        z[a] = new v(a, 3, true, a, null, false, false);
      });
      ["capture", "download"].forEach(function(a) {
        z[a] = new v(a, 4, false, a, null, false, false);
      });
      ["cols", "rows", "size", "span"].forEach(function(a) {
        z[a] = new v(a, 6, false, a, null, false, false);
      });
      ["rowSpan", "start"].forEach(function(a) {
        z[a] = new v(a, 5, false, a.toLowerCase(), null, false, false);
      });
      var ra = /[\-:]([a-z])/g;
      function sa(a) {
        return a[1].toUpperCase();
      }
      "accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height".split(" ").forEach(function(a) {
        var b = a.replace(
          ra,
          sa
        );
        z[b] = new v(b, 1, false, a, null, false, false);
      });
      "xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach(function(a) {
        var b = a.replace(ra, sa);
        z[b] = new v(b, 1, false, a, "http://www.w3.org/1999/xlink", false, false);
      });
      ["xml:base", "xml:lang", "xml:space"].forEach(function(a) {
        var b = a.replace(ra, sa);
        z[b] = new v(b, 1, false, a, "http://www.w3.org/XML/1998/namespace", false, false);
      });
      ["tabIndex", "crossOrigin"].forEach(function(a) {
        z[a] = new v(a, 1, false, a.toLowerCase(), null, false, false);
      });
      z.xlinkHref = new v("xlinkHref", 1, false, "xlink:href", "http://www.w3.org/1999/xlink", true, false);
      ["src", "href", "action", "formAction"].forEach(function(a) {
        z[a] = new v(a, 1, false, a.toLowerCase(), null, true, true);
      });
      function ta(a, b, c, d) {
        var e = z.hasOwnProperty(b) ? z[b] : null;
        if (null !== e ? 0 !== e.type : d || !(2 < b.length) || "o" !== b[0] && "O" !== b[0] || "n" !== b[1] && "N" !== b[1]) qa(b, c, e, d) && (c = null), d || null === e ? oa(b) && (null === c ? a.removeAttribute(b) : a.setAttribute(b, "" + c)) : e.mustUseProperty ? a[e.propertyName] = null === c ? 3 === e.type ? false : "" : c : (b = e.attributeName, d = e.attributeNamespace, null === c ? a.removeAttribute(b) : (e = e.type, c = 3 === e || 4 === e && true === c ? "" : "" + c, d ? a.setAttributeNS(d, b, c) : a.setAttribute(b, c)));
      }
      var ua = aa.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
      var va = /* @__PURE__ */ Symbol.for("react.element");
      var wa = /* @__PURE__ */ Symbol.for("react.portal");
      var ya = /* @__PURE__ */ Symbol.for("react.fragment");
      var za = /* @__PURE__ */ Symbol.for("react.strict_mode");
      var Aa = /* @__PURE__ */ Symbol.for("react.profiler");
      var Ba = /* @__PURE__ */ Symbol.for("react.provider");
      var Ca = /* @__PURE__ */ Symbol.for("react.context");
      var Da = /* @__PURE__ */ Symbol.for("react.forward_ref");
      var Ea = /* @__PURE__ */ Symbol.for("react.suspense");
      var Fa = /* @__PURE__ */ Symbol.for("react.suspense_list");
      var Ga = /* @__PURE__ */ Symbol.for("react.memo");
      var Ha = /* @__PURE__ */ Symbol.for("react.lazy");
      var Ia = /* @__PURE__ */ Symbol.for("react.offscreen");
      var Ja = Symbol.iterator;
      function Ka(a) {
        if (null === a || "object" !== typeof a) return null;
        a = Ja && a[Ja] || a["@@iterator"];
        return "function" === typeof a ? a : null;
      }
      var A = Object.assign;
      var La;
      function Ma(a) {
        if (void 0 === La) try {
          throw Error();
        } catch (c) {
          var b = c.stack.trim().match(/\n( *(at )?)/);
          La = b && b[1] || "";
        }
        return "\n" + La + a;
      }
      var Na = false;
      function Oa(a, b) {
        if (!a || Na) return "";
        Na = true;
        var c = Error.prepareStackTrace;
        Error.prepareStackTrace = void 0;
        try {
          if (b) if (b = function() {
            throw Error();
          }, Object.defineProperty(b.prototype, "props", { set: function() {
            throw Error();
          } }), "object" === typeof Reflect && Reflect.construct) {
            try {
              Reflect.construct(b, []);
            } catch (l) {
              var d = l;
            }
            Reflect.construct(a, [], b);
          } else {
            try {
              b.call();
            } catch (l) {
              d = l;
            }
            a.call(b.prototype);
          }
          else {
            try {
              throw Error();
            } catch (l) {
              d = l;
            }
            a();
          }
        } catch (l) {
          if (l && d && "string" === typeof l.stack) {
            for (var e = l.stack.split("\n"), f = d.stack.split("\n"), g = e.length - 1, h = f.length - 1; 1 <= g && 0 <= h && e[g] !== f[h]; ) h--;
            for (; 1 <= g && 0 <= h; g--, h--) if (e[g] !== f[h]) {
              if (1 !== g || 1 !== h) {
                do
                  if (g--, h--, 0 > h || e[g] !== f[h]) {
                    var k = "\n" + e[g].replace(" at new ", " at ");
                    a.displayName && k.includes("<anonymous>") && (k = k.replace("<anonymous>", a.displayName));
                    return k;
                  }
                while (1 <= g && 0 <= h);
              }
              break;
            }
          }
        } finally {
          Na = false, Error.prepareStackTrace = c;
        }
        return (a = a ? a.displayName || a.name : "") ? Ma(a) : "";
      }
      function Pa(a) {
        switch (a.tag) {
          case 5:
            return Ma(a.type);
          case 16:
            return Ma("Lazy");
          case 13:
            return Ma("Suspense");
          case 19:
            return Ma("SuspenseList");
          case 0:
          case 2:
          case 15:
            return a = Oa(a.type, false), a;
          case 11:
            return a = Oa(a.type.render, false), a;
          case 1:
            return a = Oa(a.type, true), a;
          default:
            return "";
        }
      }
      function Qa(a) {
        if (null == a) return null;
        if ("function" === typeof a) return a.displayName || a.name || null;
        if ("string" === typeof a) return a;
        switch (a) {
          case ya:
            return "Fragment";
          case wa:
            return "Portal";
          case Aa:
            return "Profiler";
          case za:
            return "StrictMode";
          case Ea:
            return "Suspense";
          case Fa:
            return "SuspenseList";
        }
        if ("object" === typeof a) switch (a.$$typeof) {
          case Ca:
            return (a.displayName || "Context") + ".Consumer";
          case Ba:
            return (a._context.displayName || "Context") + ".Provider";
          case Da:
            var b = a.render;
            a = a.displayName;
            a || (a = b.displayName || b.name || "", a = "" !== a ? "ForwardRef(" + a + ")" : "ForwardRef");
            return a;
          case Ga:
            return b = a.displayName || null, null !== b ? b : Qa(a.type) || "Memo";
          case Ha:
            b = a._payload;
            a = a._init;
            try {
              return Qa(a(b));
            } catch (c) {
            }
        }
        return null;
      }
      function Ra(a) {
        var b = a.type;
        switch (a.tag) {
          case 24:
            return "Cache";
          case 9:
            return (b.displayName || "Context") + ".Consumer";
          case 10:
            return (b._context.displayName || "Context") + ".Provider";
          case 18:
            return "DehydratedFragment";
          case 11:
            return a = b.render, a = a.displayName || a.name || "", b.displayName || ("" !== a ? "ForwardRef(" + a + ")" : "ForwardRef");
          case 7:
            return "Fragment";
          case 5:
            return b;
          case 4:
            return "Portal";
          case 3:
            return "Root";
          case 6:
            return "Text";
          case 16:
            return Qa(b);
          case 8:
            return b === za ? "StrictMode" : "Mode";
          case 22:
            return "Offscreen";
          case 12:
            return "Profiler";
          case 21:
            return "Scope";
          case 13:
            return "Suspense";
          case 19:
            return "SuspenseList";
          case 25:
            return "TracingMarker";
          case 1:
          case 0:
          case 17:
          case 2:
          case 14:
          case 15:
            if ("function" === typeof b) return b.displayName || b.name || null;
            if ("string" === typeof b) return b;
        }
        return null;
      }
      function Sa(a) {
        switch (typeof a) {
          case "boolean":
          case "number":
          case "string":
          case "undefined":
            return a;
          case "object":
            return a;
          default:
            return "";
        }
      }
      function Ta(a) {
        var b = a.type;
        return (a = a.nodeName) && "input" === a.toLowerCase() && ("checkbox" === b || "radio" === b);
      }
      function Ua(a) {
        var b = Ta(a) ? "checked" : "value", c = Object.getOwnPropertyDescriptor(a.constructor.prototype, b), d = "" + a[b];
        if (!a.hasOwnProperty(b) && "undefined" !== typeof c && "function" === typeof c.get && "function" === typeof c.set) {
          var e = c.get, f = c.set;
          Object.defineProperty(a, b, { configurable: true, get: function() {
            return e.call(this);
          }, set: function(a2) {
            d = "" + a2;
            f.call(this, a2);
          } });
          Object.defineProperty(a, b, { enumerable: c.enumerable });
          return { getValue: function() {
            return d;
          }, setValue: function(a2) {
            d = "" + a2;
          }, stopTracking: function() {
            a._valueTracker = null;
            delete a[b];
          } };
        }
      }
      function Va(a) {
        a._valueTracker || (a._valueTracker = Ua(a));
      }
      function Wa(a) {
        if (!a) return false;
        var b = a._valueTracker;
        if (!b) return true;
        var c = b.getValue();
        var d = "";
        a && (d = Ta(a) ? a.checked ? "true" : "false" : a.value);
        a = d;
        return a !== c ? (b.setValue(a), true) : false;
      }
      function Xa(a) {
        a = a || ("undefined" !== typeof document ? document : void 0);
        if ("undefined" === typeof a) return null;
        try {
          return a.activeElement || a.body;
        } catch (b) {
          return a.body;
        }
      }
      function Ya(a, b) {
        var c = b.checked;
        return A({}, b, { defaultChecked: void 0, defaultValue: void 0, value: void 0, checked: null != c ? c : a._wrapperState.initialChecked });
      }
      function Za(a, b) {
        var c = null == b.defaultValue ? "" : b.defaultValue, d = null != b.checked ? b.checked : b.defaultChecked;
        c = Sa(null != b.value ? b.value : c);
        a._wrapperState = { initialChecked: d, initialValue: c, controlled: "checkbox" === b.type || "radio" === b.type ? null != b.checked : null != b.value };
      }
      function ab(a, b) {
        b = b.checked;
        null != b && ta(a, "checked", b, false);
      }
      function bb(a, b) {
        ab(a, b);
        var c = Sa(b.value), d = b.type;
        if (null != c) if ("number" === d) {
          if (0 === c && "" === a.value || a.value != c) a.value = "" + c;
        } else a.value !== "" + c && (a.value = "" + c);
        else if ("submit" === d || "reset" === d) {
          a.removeAttribute("value");
          return;
        }
        b.hasOwnProperty("value") ? cb(a, b.type, c) : b.hasOwnProperty("defaultValue") && cb(a, b.type, Sa(b.defaultValue));
        null == b.checked && null != b.defaultChecked && (a.defaultChecked = !!b.defaultChecked);
      }
      function db(a, b, c) {
        if (b.hasOwnProperty("value") || b.hasOwnProperty("defaultValue")) {
          var d = b.type;
          if (!("submit" !== d && "reset" !== d || void 0 !== b.value && null !== b.value)) return;
          b = "" + a._wrapperState.initialValue;
          c || b === a.value || (a.value = b);
          a.defaultValue = b;
        }
        c = a.name;
        "" !== c && (a.name = "");
        a.defaultChecked = !!a._wrapperState.initialChecked;
        "" !== c && (a.name = c);
      }
      function cb(a, b, c) {
        if ("number" !== b || Xa(a.ownerDocument) !== a) null == c ? a.defaultValue = "" + a._wrapperState.initialValue : a.defaultValue !== "" + c && (a.defaultValue = "" + c);
      }
      var eb = Array.isArray;
      function fb(a, b, c, d) {
        a = a.options;
        if (b) {
          b = {};
          for (var e = 0; e < c.length; e++) b["$" + c[e]] = true;
          for (c = 0; c < a.length; c++) e = b.hasOwnProperty("$" + a[c].value), a[c].selected !== e && (a[c].selected = e), e && d && (a[c].defaultSelected = true);
        } else {
          c = "" + Sa(c);
          b = null;
          for (e = 0; e < a.length; e++) {
            if (a[e].value === c) {
              a[e].selected = true;
              d && (a[e].defaultSelected = true);
              return;
            }
            null !== b || a[e].disabled || (b = a[e]);
          }
          null !== b && (b.selected = true);
        }
      }
      function gb(a, b) {
        if (null != b.dangerouslySetInnerHTML) throw Error(p(91));
        return A({}, b, { value: void 0, defaultValue: void 0, children: "" + a._wrapperState.initialValue });
      }
      function hb(a, b) {
        var c = b.value;
        if (null == c) {
          c = b.children;
          b = b.defaultValue;
          if (null != c) {
            if (null != b) throw Error(p(92));
            if (eb(c)) {
              if (1 < c.length) throw Error(p(93));
              c = c[0];
            }
            b = c;
          }
          null == b && (b = "");
          c = b;
        }
        a._wrapperState = { initialValue: Sa(c) };
      }
      function ib(a, b) {
        var c = Sa(b.value), d = Sa(b.defaultValue);
        null != c && (c = "" + c, c !== a.value && (a.value = c), null == b.defaultValue && a.defaultValue !== c && (a.defaultValue = c));
        null != d && (a.defaultValue = "" + d);
      }
      function jb(a) {
        var b = a.textContent;
        b === a._wrapperState.initialValue && "" !== b && null !== b && (a.value = b);
      }
      function kb(a) {
        switch (a) {
          case "svg":
            return "http://www.w3.org/2000/svg";
          case "math":
            return "http://www.w3.org/1998/Math/MathML";
          default:
            return "http://www.w3.org/1999/xhtml";
        }
      }
      function lb(a, b) {
        return null == a || "http://www.w3.org/1999/xhtml" === a ? kb(b) : "http://www.w3.org/2000/svg" === a && "foreignObject" === b ? "http://www.w3.org/1999/xhtml" : a;
      }
      var mb;
      var nb = (function(a) {
        return "undefined" !== typeof MSApp && MSApp.execUnsafeLocalFunction ? function(b, c, d, e) {
          MSApp.execUnsafeLocalFunction(function() {
            return a(b, c, d, e);
          });
        } : a;
      })(function(a, b) {
        if ("http://www.w3.org/2000/svg" !== a.namespaceURI || "innerHTML" in a) a.innerHTML = b;
        else {
          mb = mb || document.createElement("div");
          mb.innerHTML = "<svg>" + b.valueOf().toString() + "</svg>";
          for (b = mb.firstChild; a.firstChild; ) a.removeChild(a.firstChild);
          for (; b.firstChild; ) a.appendChild(b.firstChild);
        }
      });
      function ob(a, b) {
        if (b) {
          var c = a.firstChild;
          if (c && c === a.lastChild && 3 === c.nodeType) {
            c.nodeValue = b;
            return;
          }
        }
        a.textContent = b;
      }
      var pb = {
        animationIterationCount: true,
        aspectRatio: true,
        borderImageOutset: true,
        borderImageSlice: true,
        borderImageWidth: true,
        boxFlex: true,
        boxFlexGroup: true,
        boxOrdinalGroup: true,
        columnCount: true,
        columns: true,
        flex: true,
        flexGrow: true,
        flexPositive: true,
        flexShrink: true,
        flexNegative: true,
        flexOrder: true,
        gridArea: true,
        gridRow: true,
        gridRowEnd: true,
        gridRowSpan: true,
        gridRowStart: true,
        gridColumn: true,
        gridColumnEnd: true,
        gridColumnSpan: true,
        gridColumnStart: true,
        fontWeight: true,
        lineClamp: true,
        lineHeight: true,
        opacity: true,
        order: true,
        orphans: true,
        tabSize: true,
        widows: true,
        zIndex: true,
        zoom: true,
        fillOpacity: true,
        floodOpacity: true,
        stopOpacity: true,
        strokeDasharray: true,
        strokeDashoffset: true,
        strokeMiterlimit: true,
        strokeOpacity: true,
        strokeWidth: true
      };
      var qb = ["Webkit", "ms", "Moz", "O"];
      Object.keys(pb).forEach(function(a) {
        qb.forEach(function(b) {
          b = b + a.charAt(0).toUpperCase() + a.substring(1);
          pb[b] = pb[a];
        });
      });
      function rb(a, b, c) {
        return null == b || "boolean" === typeof b || "" === b ? "" : c || "number" !== typeof b || 0 === b || pb.hasOwnProperty(a) && pb[a] ? ("" + b).trim() : b + "px";
      }
      function sb(a, b) {
        a = a.style;
        for (var c in b) if (b.hasOwnProperty(c)) {
          var d = 0 === c.indexOf("--"), e = rb(c, b[c], d);
          "float" === c && (c = "cssFloat");
          d ? a.setProperty(c, e) : a[c] = e;
        }
      }
      var tb = A({ menuitem: true }, { area: true, base: true, br: true, col: true, embed: true, hr: true, img: true, input: true, keygen: true, link: true, meta: true, param: true, source: true, track: true, wbr: true });
      function ub(a, b) {
        if (b) {
          if (tb[a] && (null != b.children || null != b.dangerouslySetInnerHTML)) throw Error(p(137, a));
          if (null != b.dangerouslySetInnerHTML) {
            if (null != b.children) throw Error(p(60));
            if ("object" !== typeof b.dangerouslySetInnerHTML || !("__html" in b.dangerouslySetInnerHTML)) throw Error(p(61));
          }
          if (null != b.style && "object" !== typeof b.style) throw Error(p(62));
        }
      }
      function vb(a, b) {
        if (-1 === a.indexOf("-")) return "string" === typeof b.is;
        switch (a) {
          case "annotation-xml":
          case "color-profile":
          case "font-face":
          case "font-face-src":
          case "font-face-uri":
          case "font-face-format":
          case "font-face-name":
          case "missing-glyph":
            return false;
          default:
            return true;
        }
      }
      var wb = null;
      function xb(a) {
        a = a.target || a.srcElement || window;
        a.correspondingUseElement && (a = a.correspondingUseElement);
        return 3 === a.nodeType ? a.parentNode : a;
      }
      var yb = null;
      var zb = null;
      var Ab = null;
      function Bb(a) {
        if (a = Cb(a)) {
          if ("function" !== typeof yb) throw Error(p(280));
          var b = a.stateNode;
          b && (b = Db(b), yb(a.stateNode, a.type, b));
        }
      }
      function Eb(a) {
        zb ? Ab ? Ab.push(a) : Ab = [a] : zb = a;
      }
      function Fb() {
        if (zb) {
          var a = zb, b = Ab;
          Ab = zb = null;
          Bb(a);
          if (b) for (a = 0; a < b.length; a++) Bb(b[a]);
        }
      }
      function Gb(a, b) {
        return a(b);
      }
      function Hb() {
      }
      var Ib = false;
      function Jb(a, b, c) {
        if (Ib) return a(b, c);
        Ib = true;
        try {
          return Gb(a, b, c);
        } finally {
          if (Ib = false, null !== zb || null !== Ab) Hb(), Fb();
        }
      }
      function Kb(a, b) {
        var c = a.stateNode;
        if (null === c) return null;
        var d = Db(c);
        if (null === d) return null;
        c = d[b];
        a: switch (b) {
          case "onClick":
          case "onClickCapture":
          case "onDoubleClick":
          case "onDoubleClickCapture":
          case "onMouseDown":
          case "onMouseDownCapture":
          case "onMouseMove":
          case "onMouseMoveCapture":
          case "onMouseUp":
          case "onMouseUpCapture":
          case "onMouseEnter":
            (d = !d.disabled) || (a = a.type, d = !("button" === a || "input" === a || "select" === a || "textarea" === a));
            a = !d;
            break a;
          default:
            a = false;
        }
        if (a) return null;
        if (c && "function" !== typeof c) throw Error(p(231, b, typeof c));
        return c;
      }
      var Lb = false;
      if (ia) try {
        Mb = {};
        Object.defineProperty(Mb, "passive", { get: function() {
          Lb = true;
        } });
        window.addEventListener("test", Mb, Mb);
        window.removeEventListener("test", Mb, Mb);
      } catch (a) {
        Lb = false;
      }
      var Mb;
      function Nb(a, b, c, d, e, f, g, h, k) {
        var l = Array.prototype.slice.call(arguments, 3);
        try {
          b.apply(c, l);
        } catch (m) {
          this.onError(m);
        }
      }
      var Ob = false;
      var Pb = null;
      var Qb = false;
      var Rb = null;
      var Sb = { onError: function(a) {
        Ob = true;
        Pb = a;
      } };
      function Tb(a, b, c, d, e, f, g, h, k) {
        Ob = false;
        Pb = null;
        Nb.apply(Sb, arguments);
      }
      function Ub(a, b, c, d, e, f, g, h, k) {
        Tb.apply(this, arguments);
        if (Ob) {
          if (Ob) {
            var l = Pb;
            Ob = false;
            Pb = null;
          } else throw Error(p(198));
          Qb || (Qb = true, Rb = l);
        }
      }
      function Vb(a) {
        var b = a, c = a;
        if (a.alternate) for (; b.return; ) b = b.return;
        else {
          a = b;
          do
            b = a, 0 !== (b.flags & 4098) && (c = b.return), a = b.return;
          while (a);
        }
        return 3 === b.tag ? c : null;
      }
      function Wb(a) {
        if (13 === a.tag) {
          var b = a.memoizedState;
          null === b && (a = a.alternate, null !== a && (b = a.memoizedState));
          if (null !== b) return b.dehydrated;
        }
        return null;
      }
      function Xb(a) {
        if (Vb(a) !== a) throw Error(p(188));
      }
      function Yb(a) {
        var b = a.alternate;
        if (!b) {
          b = Vb(a);
          if (null === b) throw Error(p(188));
          return b !== a ? null : a;
        }
        for (var c = a, d = b; ; ) {
          var e = c.return;
          if (null === e) break;
          var f = e.alternate;
          if (null === f) {
            d = e.return;
            if (null !== d) {
              c = d;
              continue;
            }
            break;
          }
          if (e.child === f.child) {
            for (f = e.child; f; ) {
              if (f === c) return Xb(e), a;
              if (f === d) return Xb(e), b;
              f = f.sibling;
            }
            throw Error(p(188));
          }
          if (c.return !== d.return) c = e, d = f;
          else {
            for (var g = false, h = e.child; h; ) {
              if (h === c) {
                g = true;
                c = e;
                d = f;
                break;
              }
              if (h === d) {
                g = true;
                d = e;
                c = f;
                break;
              }
              h = h.sibling;
            }
            if (!g) {
              for (h = f.child; h; ) {
                if (h === c) {
                  g = true;
                  c = f;
                  d = e;
                  break;
                }
                if (h === d) {
                  g = true;
                  d = f;
                  c = e;
                  break;
                }
                h = h.sibling;
              }
              if (!g) throw Error(p(189));
            }
          }
          if (c.alternate !== d) throw Error(p(190));
        }
        if (3 !== c.tag) throw Error(p(188));
        return c.stateNode.current === c ? a : b;
      }
      function Zb(a) {
        a = Yb(a);
        return null !== a ? $b(a) : null;
      }
      function $b(a) {
        if (5 === a.tag || 6 === a.tag) return a;
        for (a = a.child; null !== a; ) {
          var b = $b(a);
          if (null !== b) return b;
          a = a.sibling;
        }
        return null;
      }
      var ac = ca.unstable_scheduleCallback;
      var bc = ca.unstable_cancelCallback;
      var cc = ca.unstable_shouldYield;
      var dc = ca.unstable_requestPaint;
      var B = ca.unstable_now;
      var ec = ca.unstable_getCurrentPriorityLevel;
      var fc = ca.unstable_ImmediatePriority;
      var gc = ca.unstable_UserBlockingPriority;
      var hc = ca.unstable_NormalPriority;
      var ic = ca.unstable_LowPriority;
      var jc = ca.unstable_IdlePriority;
      var kc = null;
      var lc = null;
      function mc(a) {
        if (lc && "function" === typeof lc.onCommitFiberRoot) try {
          lc.onCommitFiberRoot(kc, a, void 0, 128 === (a.current.flags & 128));
        } catch (b) {
        }
      }
      var oc = Math.clz32 ? Math.clz32 : nc;
      var pc = Math.log;
      var qc = Math.LN2;
      function nc(a) {
        a >>>= 0;
        return 0 === a ? 32 : 31 - (pc(a) / qc | 0) | 0;
      }
      var rc = 64;
      var sc = 4194304;
      function tc(a) {
        switch (a & -a) {
          case 1:
            return 1;
          case 2:
            return 2;
          case 4:
            return 4;
          case 8:
            return 8;
          case 16:
            return 16;
          case 32:
            return 32;
          case 64:
          case 128:
          case 256:
          case 512:
          case 1024:
          case 2048:
          case 4096:
          case 8192:
          case 16384:
          case 32768:
          case 65536:
          case 131072:
          case 262144:
          case 524288:
          case 1048576:
          case 2097152:
            return a & 4194240;
          case 4194304:
          case 8388608:
          case 16777216:
          case 33554432:
          case 67108864:
            return a & 130023424;
          case 134217728:
            return 134217728;
          case 268435456:
            return 268435456;
          case 536870912:
            return 536870912;
          case 1073741824:
            return 1073741824;
          default:
            return a;
        }
      }
      function uc(a, b) {
        var c = a.pendingLanes;
        if (0 === c) return 0;
        var d = 0, e = a.suspendedLanes, f = a.pingedLanes, g = c & 268435455;
        if (0 !== g) {
          var h = g & ~e;
          0 !== h ? d = tc(h) : (f &= g, 0 !== f && (d = tc(f)));
        } else g = c & ~e, 0 !== g ? d = tc(g) : 0 !== f && (d = tc(f));
        if (0 === d) return 0;
        if (0 !== b && b !== d && 0 === (b & e) && (e = d & -d, f = b & -b, e >= f || 16 === e && 0 !== (f & 4194240))) return b;
        0 !== (d & 4) && (d |= c & 16);
        b = a.entangledLanes;
        if (0 !== b) for (a = a.entanglements, b &= d; 0 < b; ) c = 31 - oc(b), e = 1 << c, d |= a[c], b &= ~e;
        return d;
      }
      function vc(a, b) {
        switch (a) {
          case 1:
          case 2:
          case 4:
            return b + 250;
          case 8:
          case 16:
          case 32:
          case 64:
          case 128:
          case 256:
          case 512:
          case 1024:
          case 2048:
          case 4096:
          case 8192:
          case 16384:
          case 32768:
          case 65536:
          case 131072:
          case 262144:
          case 524288:
          case 1048576:
          case 2097152:
            return b + 5e3;
          case 4194304:
          case 8388608:
          case 16777216:
          case 33554432:
          case 67108864:
            return -1;
          case 134217728:
          case 268435456:
          case 536870912:
          case 1073741824:
            return -1;
          default:
            return -1;
        }
      }
      function wc(a, b) {
        for (var c = a.suspendedLanes, d = a.pingedLanes, e = a.expirationTimes, f = a.pendingLanes; 0 < f; ) {
          var g = 31 - oc(f), h = 1 << g, k = e[g];
          if (-1 === k) {
            if (0 === (h & c) || 0 !== (h & d)) e[g] = vc(h, b);
          } else k <= b && (a.expiredLanes |= h);
          f &= ~h;
        }
      }
      function xc(a) {
        a = a.pendingLanes & -1073741825;
        return 0 !== a ? a : a & 1073741824 ? 1073741824 : 0;
      }
      function yc() {
        var a = rc;
        rc <<= 1;
        0 === (rc & 4194240) && (rc = 64);
        return a;
      }
      function zc(a) {
        for (var b = [], c = 0; 31 > c; c++) b.push(a);
        return b;
      }
      function Ac(a, b, c) {
        a.pendingLanes |= b;
        536870912 !== b && (a.suspendedLanes = 0, a.pingedLanes = 0);
        a = a.eventTimes;
        b = 31 - oc(b);
        a[b] = c;
      }
      function Bc(a, b) {
        var c = a.pendingLanes & ~b;
        a.pendingLanes = b;
        a.suspendedLanes = 0;
        a.pingedLanes = 0;
        a.expiredLanes &= b;
        a.mutableReadLanes &= b;
        a.entangledLanes &= b;
        b = a.entanglements;
        var d = a.eventTimes;
        for (a = a.expirationTimes; 0 < c; ) {
          var e = 31 - oc(c), f = 1 << e;
          b[e] = 0;
          d[e] = -1;
          a[e] = -1;
          c &= ~f;
        }
      }
      function Cc(a, b) {
        var c = a.entangledLanes |= b;
        for (a = a.entanglements; c; ) {
          var d = 31 - oc(c), e = 1 << d;
          e & b | a[d] & b && (a[d] |= b);
          c &= ~e;
        }
      }
      var C = 0;
      function Dc(a) {
        a &= -a;
        return 1 < a ? 4 < a ? 0 !== (a & 268435455) ? 16 : 536870912 : 4 : 1;
      }
      var Ec;
      var Fc;
      var Gc;
      var Hc;
      var Ic;
      var Jc = false;
      var Kc = [];
      var Lc = null;
      var Mc = null;
      var Nc = null;
      var Oc = /* @__PURE__ */ new Map();
      var Pc = /* @__PURE__ */ new Map();
      var Qc = [];
      var Rc = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit".split(" ");
      function Sc(a, b) {
        switch (a) {
          case "focusin":
          case "focusout":
            Lc = null;
            break;
          case "dragenter":
          case "dragleave":
            Mc = null;
            break;
          case "mouseover":
          case "mouseout":
            Nc = null;
            break;
          case "pointerover":
          case "pointerout":
            Oc.delete(b.pointerId);
            break;
          case "gotpointercapture":
          case "lostpointercapture":
            Pc.delete(b.pointerId);
        }
      }
      function Tc(a, b, c, d, e, f) {
        if (null === a || a.nativeEvent !== f) return a = { blockedOn: b, domEventName: c, eventSystemFlags: d, nativeEvent: f, targetContainers: [e] }, null !== b && (b = Cb(b), null !== b && Fc(b)), a;
        a.eventSystemFlags |= d;
        b = a.targetContainers;
        null !== e && -1 === b.indexOf(e) && b.push(e);
        return a;
      }
      function Uc(a, b, c, d, e) {
        switch (b) {
          case "focusin":
            return Lc = Tc(Lc, a, b, c, d, e), true;
          case "dragenter":
            return Mc = Tc(Mc, a, b, c, d, e), true;
          case "mouseover":
            return Nc = Tc(Nc, a, b, c, d, e), true;
          case "pointerover":
            var f = e.pointerId;
            Oc.set(f, Tc(Oc.get(f) || null, a, b, c, d, e));
            return true;
          case "gotpointercapture":
            return f = e.pointerId, Pc.set(f, Tc(Pc.get(f) || null, a, b, c, d, e)), true;
        }
        return false;
      }
      function Vc(a) {
        var b = Wc(a.target);
        if (null !== b) {
          var c = Vb(b);
          if (null !== c) {
            if (b = c.tag, 13 === b) {
              if (b = Wb(c), null !== b) {
                a.blockedOn = b;
                Ic(a.priority, function() {
                  Gc(c);
                });
                return;
              }
            } else if (3 === b && c.stateNode.current.memoizedState.isDehydrated) {
              a.blockedOn = 3 === c.tag ? c.stateNode.containerInfo : null;
              return;
            }
          }
        }
        a.blockedOn = null;
      }
      function Xc(a) {
        if (null !== a.blockedOn) return false;
        for (var b = a.targetContainers; 0 < b.length; ) {
          var c = Yc(a.domEventName, a.eventSystemFlags, b[0], a.nativeEvent);
          if (null === c) {
            c = a.nativeEvent;
            var d = new c.constructor(c.type, c);
            wb = d;
            c.target.dispatchEvent(d);
            wb = null;
          } else return b = Cb(c), null !== b && Fc(b), a.blockedOn = c, false;
          b.shift();
        }
        return true;
      }
      function Zc(a, b, c) {
        Xc(a) && c.delete(b);
      }
      function $c() {
        Jc = false;
        null !== Lc && Xc(Lc) && (Lc = null);
        null !== Mc && Xc(Mc) && (Mc = null);
        null !== Nc && Xc(Nc) && (Nc = null);
        Oc.forEach(Zc);
        Pc.forEach(Zc);
      }
      function ad(a, b) {
        a.blockedOn === b && (a.blockedOn = null, Jc || (Jc = true, ca.unstable_scheduleCallback(ca.unstable_NormalPriority, $c)));
      }
      function bd(a) {
        function b(b2) {
          return ad(b2, a);
        }
        if (0 < Kc.length) {
          ad(Kc[0], a);
          for (var c = 1; c < Kc.length; c++) {
            var d = Kc[c];
            d.blockedOn === a && (d.blockedOn = null);
          }
        }
        null !== Lc && ad(Lc, a);
        null !== Mc && ad(Mc, a);
        null !== Nc && ad(Nc, a);
        Oc.forEach(b);
        Pc.forEach(b);
        for (c = 0; c < Qc.length; c++) d = Qc[c], d.blockedOn === a && (d.blockedOn = null);
        for (; 0 < Qc.length && (c = Qc[0], null === c.blockedOn); ) Vc(c), null === c.blockedOn && Qc.shift();
      }
      var cd = ua.ReactCurrentBatchConfig;
      var dd = true;
      function ed(a, b, c, d) {
        var e = C, f = cd.transition;
        cd.transition = null;
        try {
          C = 1, fd(a, b, c, d);
        } finally {
          C = e, cd.transition = f;
        }
      }
      function gd(a, b, c, d) {
        var e = C, f = cd.transition;
        cd.transition = null;
        try {
          C = 4, fd(a, b, c, d);
        } finally {
          C = e, cd.transition = f;
        }
      }
      function fd(a, b, c, d) {
        if (dd) {
          var e = Yc(a, b, c, d);
          if (null === e) hd(a, b, d, id, c), Sc(a, d);
          else if (Uc(e, a, b, c, d)) d.stopPropagation();
          else if (Sc(a, d), b & 4 && -1 < Rc.indexOf(a)) {
            for (; null !== e; ) {
              var f = Cb(e);
              null !== f && Ec(f);
              f = Yc(a, b, c, d);
              null === f && hd(a, b, d, id, c);
              if (f === e) break;
              e = f;
            }
            null !== e && d.stopPropagation();
          } else hd(a, b, d, null, c);
        }
      }
      var id = null;
      function Yc(a, b, c, d) {
        id = null;
        a = xb(d);
        a = Wc(a);
        if (null !== a) if (b = Vb(a), null === b) a = null;
        else if (c = b.tag, 13 === c) {
          a = Wb(b);
          if (null !== a) return a;
          a = null;
        } else if (3 === c) {
          if (b.stateNode.current.memoizedState.isDehydrated) return 3 === b.tag ? b.stateNode.containerInfo : null;
          a = null;
        } else b !== a && (a = null);
        id = a;
        return null;
      }
      function jd(a) {
        switch (a) {
          case "cancel":
          case "click":
          case "close":
          case "contextmenu":
          case "copy":
          case "cut":
          case "auxclick":
          case "dblclick":
          case "dragend":
          case "dragstart":
          case "drop":
          case "focusin":
          case "focusout":
          case "input":
          case "invalid":
          case "keydown":
          case "keypress":
          case "keyup":
          case "mousedown":
          case "mouseup":
          case "paste":
          case "pause":
          case "play":
          case "pointercancel":
          case "pointerdown":
          case "pointerup":
          case "ratechange":
          case "reset":
          case "resize":
          case "seeked":
          case "submit":
          case "touchcancel":
          case "touchend":
          case "touchstart":
          case "volumechange":
          case "change":
          case "selectionchange":
          case "textInput":
          case "compositionstart":
          case "compositionend":
          case "compositionupdate":
          case "beforeblur":
          case "afterblur":
          case "beforeinput":
          case "blur":
          case "fullscreenchange":
          case "focus":
          case "hashchange":
          case "popstate":
          case "select":
          case "selectstart":
            return 1;
          case "drag":
          case "dragenter":
          case "dragexit":
          case "dragleave":
          case "dragover":
          case "mousemove":
          case "mouseout":
          case "mouseover":
          case "pointermove":
          case "pointerout":
          case "pointerover":
          case "scroll":
          case "toggle":
          case "touchmove":
          case "wheel":
          case "mouseenter":
          case "mouseleave":
          case "pointerenter":
          case "pointerleave":
            return 4;
          case "message":
            switch (ec()) {
              case fc:
                return 1;
              case gc:
                return 4;
              case hc:
              case ic:
                return 16;
              case jc:
                return 536870912;
              default:
                return 16;
            }
          default:
            return 16;
        }
      }
      var kd = null;
      var ld = null;
      var md = null;
      function nd() {
        if (md) return md;
        var a, b = ld, c = b.length, d, e = "value" in kd ? kd.value : kd.textContent, f = e.length;
        for (a = 0; a < c && b[a] === e[a]; a++) ;
        var g = c - a;
        for (d = 1; d <= g && b[c - d] === e[f - d]; d++) ;
        return md = e.slice(a, 1 < d ? 1 - d : void 0);
      }
      function od(a) {
        var b = a.keyCode;
        "charCode" in a ? (a = a.charCode, 0 === a && 13 === b && (a = 13)) : a = b;
        10 === a && (a = 13);
        return 32 <= a || 13 === a ? a : 0;
      }
      function pd() {
        return true;
      }
      function qd() {
        return false;
      }
      function rd(a) {
        function b(b2, d, e, f, g) {
          this._reactName = b2;
          this._targetInst = e;
          this.type = d;
          this.nativeEvent = f;
          this.target = g;
          this.currentTarget = null;
          for (var c in a) a.hasOwnProperty(c) && (b2 = a[c], this[c] = b2 ? b2(f) : f[c]);
          this.isDefaultPrevented = (null != f.defaultPrevented ? f.defaultPrevented : false === f.returnValue) ? pd : qd;
          this.isPropagationStopped = qd;
          return this;
        }
        A(b.prototype, { preventDefault: function() {
          this.defaultPrevented = true;
          var a2 = this.nativeEvent;
          a2 && (a2.preventDefault ? a2.preventDefault() : "unknown" !== typeof a2.returnValue && (a2.returnValue = false), this.isDefaultPrevented = pd);
        }, stopPropagation: function() {
          var a2 = this.nativeEvent;
          a2 && (a2.stopPropagation ? a2.stopPropagation() : "unknown" !== typeof a2.cancelBubble && (a2.cancelBubble = true), this.isPropagationStopped = pd);
        }, persist: function() {
        }, isPersistent: pd });
        return b;
      }
      var sd = { eventPhase: 0, bubbles: 0, cancelable: 0, timeStamp: function(a) {
        return a.timeStamp || Date.now();
      }, defaultPrevented: 0, isTrusted: 0 };
      var td = rd(sd);
      var ud = A({}, sd, { view: 0, detail: 0 });
      var vd = rd(ud);
      var wd;
      var xd;
      var yd;
      var Ad = A({}, ud, { screenX: 0, screenY: 0, clientX: 0, clientY: 0, pageX: 0, pageY: 0, ctrlKey: 0, shiftKey: 0, altKey: 0, metaKey: 0, getModifierState: zd, button: 0, buttons: 0, relatedTarget: function(a) {
        return void 0 === a.relatedTarget ? a.fromElement === a.srcElement ? a.toElement : a.fromElement : a.relatedTarget;
      }, movementX: function(a) {
        if ("movementX" in a) return a.movementX;
        a !== yd && (yd && "mousemove" === a.type ? (wd = a.screenX - yd.screenX, xd = a.screenY - yd.screenY) : xd = wd = 0, yd = a);
        return wd;
      }, movementY: function(a) {
        return "movementY" in a ? a.movementY : xd;
      } });
      var Bd = rd(Ad);
      var Cd = A({}, Ad, { dataTransfer: 0 });
      var Dd = rd(Cd);
      var Ed = A({}, ud, { relatedTarget: 0 });
      var Fd = rd(Ed);
      var Gd = A({}, sd, { animationName: 0, elapsedTime: 0, pseudoElement: 0 });
      var Hd = rd(Gd);
      var Id = A({}, sd, { clipboardData: function(a) {
        return "clipboardData" in a ? a.clipboardData : window.clipboardData;
      } });
      var Jd = rd(Id);
      var Kd = A({}, sd, { data: 0 });
      var Ld = rd(Kd);
      var Md = {
        Esc: "Escape",
        Spacebar: " ",
        Left: "ArrowLeft",
        Up: "ArrowUp",
        Right: "ArrowRight",
        Down: "ArrowDown",
        Del: "Delete",
        Win: "OS",
        Menu: "ContextMenu",
        Apps: "ContextMenu",
        Scroll: "ScrollLock",
        MozPrintableKey: "Unidentified"
      };
      var Nd = {
        8: "Backspace",
        9: "Tab",
        12: "Clear",
        13: "Enter",
        16: "Shift",
        17: "Control",
        18: "Alt",
        19: "Pause",
        20: "CapsLock",
        27: "Escape",
        32: " ",
        33: "PageUp",
        34: "PageDown",
        35: "End",
        36: "Home",
        37: "ArrowLeft",
        38: "ArrowUp",
        39: "ArrowRight",
        40: "ArrowDown",
        45: "Insert",
        46: "Delete",
        112: "F1",
        113: "F2",
        114: "F3",
        115: "F4",
        116: "F5",
        117: "F6",
        118: "F7",
        119: "F8",
        120: "F9",
        121: "F10",
        122: "F11",
        123: "F12",
        144: "NumLock",
        145: "ScrollLock",
        224: "Meta"
      };
      var Od = { Alt: "altKey", Control: "ctrlKey", Meta: "metaKey", Shift: "shiftKey" };
      function Pd(a) {
        var b = this.nativeEvent;
        return b.getModifierState ? b.getModifierState(a) : (a = Od[a]) ? !!b[a] : false;
      }
      function zd() {
        return Pd;
      }
      var Qd = A({}, ud, { key: function(a) {
        if (a.key) {
          var b = Md[a.key] || a.key;
          if ("Unidentified" !== b) return b;
        }
        return "keypress" === a.type ? (a = od(a), 13 === a ? "Enter" : String.fromCharCode(a)) : "keydown" === a.type || "keyup" === a.type ? Nd[a.keyCode] || "Unidentified" : "";
      }, code: 0, location: 0, ctrlKey: 0, shiftKey: 0, altKey: 0, metaKey: 0, repeat: 0, locale: 0, getModifierState: zd, charCode: function(a) {
        return "keypress" === a.type ? od(a) : 0;
      }, keyCode: function(a) {
        return "keydown" === a.type || "keyup" === a.type ? a.keyCode : 0;
      }, which: function(a) {
        return "keypress" === a.type ? od(a) : "keydown" === a.type || "keyup" === a.type ? a.keyCode : 0;
      } });
      var Rd = rd(Qd);
      var Sd = A({}, Ad, { pointerId: 0, width: 0, height: 0, pressure: 0, tangentialPressure: 0, tiltX: 0, tiltY: 0, twist: 0, pointerType: 0, isPrimary: 0 });
      var Td = rd(Sd);
      var Ud = A({}, ud, { touches: 0, targetTouches: 0, changedTouches: 0, altKey: 0, metaKey: 0, ctrlKey: 0, shiftKey: 0, getModifierState: zd });
      var Vd = rd(Ud);
      var Wd = A({}, sd, { propertyName: 0, elapsedTime: 0, pseudoElement: 0 });
      var Xd = rd(Wd);
      var Yd = A({}, Ad, {
        deltaX: function(a) {
          return "deltaX" in a ? a.deltaX : "wheelDeltaX" in a ? -a.wheelDeltaX : 0;
        },
        deltaY: function(a) {
          return "deltaY" in a ? a.deltaY : "wheelDeltaY" in a ? -a.wheelDeltaY : "wheelDelta" in a ? -a.wheelDelta : 0;
        },
        deltaZ: 0,
        deltaMode: 0
      });
      var Zd = rd(Yd);
      var $d = [9, 13, 27, 32];
      var ae = ia && "CompositionEvent" in window;
      var be = null;
      ia && "documentMode" in document && (be = document.documentMode);
      var ce = ia && "TextEvent" in window && !be;
      var de = ia && (!ae || be && 8 < be && 11 >= be);
      var ee = String.fromCharCode(32);
      var fe = false;
      function ge(a, b) {
        switch (a) {
          case "keyup":
            return -1 !== $d.indexOf(b.keyCode);
          case "keydown":
            return 229 !== b.keyCode;
          case "keypress":
          case "mousedown":
          case "focusout":
            return true;
          default:
            return false;
        }
      }
      function he(a) {
        a = a.detail;
        return "object" === typeof a && "data" in a ? a.data : null;
      }
      var ie = false;
      function je(a, b) {
        switch (a) {
          case "compositionend":
            return he(b);
          case "keypress":
            if (32 !== b.which) return null;
            fe = true;
            return ee;
          case "textInput":
            return a = b.data, a === ee && fe ? null : a;
          default:
            return null;
        }
      }
      function ke(a, b) {
        if (ie) return "compositionend" === a || !ae && ge(a, b) ? (a = nd(), md = ld = kd = null, ie = false, a) : null;
        switch (a) {
          case "paste":
            return null;
          case "keypress":
            if (!(b.ctrlKey || b.altKey || b.metaKey) || b.ctrlKey && b.altKey) {
              if (b.char && 1 < b.char.length) return b.char;
              if (b.which) return String.fromCharCode(b.which);
            }
            return null;
          case "compositionend":
            return de && "ko" !== b.locale ? null : b.data;
          default:
            return null;
        }
      }
      var le = { color: true, date: true, datetime: true, "datetime-local": true, email: true, month: true, number: true, password: true, range: true, search: true, tel: true, text: true, time: true, url: true, week: true };
      function me(a) {
        var b = a && a.nodeName && a.nodeName.toLowerCase();
        return "input" === b ? !!le[a.type] : "textarea" === b ? true : false;
      }
      function ne(a, b, c, d) {
        Eb(d);
        b = oe(b, "onChange");
        0 < b.length && (c = new td("onChange", "change", null, c, d), a.push({ event: c, listeners: b }));
      }
      var pe = null;
      var qe = null;
      function re(a) {
        se(a, 0);
      }
      function te(a) {
        var b = ue(a);
        if (Wa(b)) return a;
      }
      function ve(a, b) {
        if ("change" === a) return b;
      }
      var we = false;
      if (ia) {
        if (ia) {
          ye = "oninput" in document;
          if (!ye) {
            ze = document.createElement("div");
            ze.setAttribute("oninput", "return;");
            ye = "function" === typeof ze.oninput;
          }
          xe = ye;
        } else xe = false;
        we = xe && (!document.documentMode || 9 < document.documentMode);
      }
      var xe;
      var ye;
      var ze;
      function Ae() {
        pe && (pe.detachEvent("onpropertychange", Be), qe = pe = null);
      }
      function Be(a) {
        if ("value" === a.propertyName && te(qe)) {
          var b = [];
          ne(b, qe, a, xb(a));
          Jb(re, b);
        }
      }
      function Ce(a, b, c) {
        "focusin" === a ? (Ae(), pe = b, qe = c, pe.attachEvent("onpropertychange", Be)) : "focusout" === a && Ae();
      }
      function De(a) {
        if ("selectionchange" === a || "keyup" === a || "keydown" === a) return te(qe);
      }
      function Ee(a, b) {
        if ("click" === a) return te(b);
      }
      function Fe(a, b) {
        if ("input" === a || "change" === a) return te(b);
      }
      function Ge(a, b) {
        return a === b && (0 !== a || 1 / a === 1 / b) || a !== a && b !== b;
      }
      var He = "function" === typeof Object.is ? Object.is : Ge;
      function Ie(a, b) {
        if (He(a, b)) return true;
        if ("object" !== typeof a || null === a || "object" !== typeof b || null === b) return false;
        var c = Object.keys(a), d = Object.keys(b);
        if (c.length !== d.length) return false;
        for (d = 0; d < c.length; d++) {
          var e = c[d];
          if (!ja.call(b, e) || !He(a[e], b[e])) return false;
        }
        return true;
      }
      function Je(a) {
        for (; a && a.firstChild; ) a = a.firstChild;
        return a;
      }
      function Ke(a, b) {
        var c = Je(a);
        a = 0;
        for (var d; c; ) {
          if (3 === c.nodeType) {
            d = a + c.textContent.length;
            if (a <= b && d >= b) return { node: c, offset: b - a };
            a = d;
          }
          a: {
            for (; c; ) {
              if (c.nextSibling) {
                c = c.nextSibling;
                break a;
              }
              c = c.parentNode;
            }
            c = void 0;
          }
          c = Je(c);
        }
      }
      function Le(a, b) {
        return a && b ? a === b ? true : a && 3 === a.nodeType ? false : b && 3 === b.nodeType ? Le(a, b.parentNode) : "contains" in a ? a.contains(b) : a.compareDocumentPosition ? !!(a.compareDocumentPosition(b) & 16) : false : false;
      }
      function Me() {
        for (var a = window, b = Xa(); b instanceof a.HTMLIFrameElement; ) {
          try {
            var c = "string" === typeof b.contentWindow.location.href;
          } catch (d) {
            c = false;
          }
          if (c) a = b.contentWindow;
          else break;
          b = Xa(a.document);
        }
        return b;
      }
      function Ne(a) {
        var b = a && a.nodeName && a.nodeName.toLowerCase();
        return b && ("input" === b && ("text" === a.type || "search" === a.type || "tel" === a.type || "url" === a.type || "password" === a.type) || "textarea" === b || "true" === a.contentEditable);
      }
      function Oe(a) {
        var b = Me(), c = a.focusedElem, d = a.selectionRange;
        if (b !== c && c && c.ownerDocument && Le(c.ownerDocument.documentElement, c)) {
          if (null !== d && Ne(c)) {
            if (b = d.start, a = d.end, void 0 === a && (a = b), "selectionStart" in c) c.selectionStart = b, c.selectionEnd = Math.min(a, c.value.length);
            else if (a = (b = c.ownerDocument || document) && b.defaultView || window, a.getSelection) {
              a = a.getSelection();
              var e = c.textContent.length, f = Math.min(d.start, e);
              d = void 0 === d.end ? f : Math.min(d.end, e);
              !a.extend && f > d && (e = d, d = f, f = e);
              e = Ke(c, f);
              var g = Ke(
                c,
                d
              );
              e && g && (1 !== a.rangeCount || a.anchorNode !== e.node || a.anchorOffset !== e.offset || a.focusNode !== g.node || a.focusOffset !== g.offset) && (b = b.createRange(), b.setStart(e.node, e.offset), a.removeAllRanges(), f > d ? (a.addRange(b), a.extend(g.node, g.offset)) : (b.setEnd(g.node, g.offset), a.addRange(b)));
            }
          }
          b = [];
          for (a = c; a = a.parentNode; ) 1 === a.nodeType && b.push({ element: a, left: a.scrollLeft, top: a.scrollTop });
          "function" === typeof c.focus && c.focus();
          for (c = 0; c < b.length; c++) a = b[c], a.element.scrollLeft = a.left, a.element.scrollTop = a.top;
        }
      }
      var Pe = ia && "documentMode" in document && 11 >= document.documentMode;
      var Qe = null;
      var Re = null;
      var Se = null;
      var Te = false;
      function Ue(a, b, c) {
        var d = c.window === c ? c.document : 9 === c.nodeType ? c : c.ownerDocument;
        Te || null == Qe || Qe !== Xa(d) || (d = Qe, "selectionStart" in d && Ne(d) ? d = { start: d.selectionStart, end: d.selectionEnd } : (d = (d.ownerDocument && d.ownerDocument.defaultView || window).getSelection(), d = { anchorNode: d.anchorNode, anchorOffset: d.anchorOffset, focusNode: d.focusNode, focusOffset: d.focusOffset }), Se && Ie(Se, d) || (Se = d, d = oe(Re, "onSelect"), 0 < d.length && (b = new td("onSelect", "select", null, b, c), a.push({ event: b, listeners: d }), b.target = Qe)));
      }
      function Ve(a, b) {
        var c = {};
        c[a.toLowerCase()] = b.toLowerCase();
        c["Webkit" + a] = "webkit" + b;
        c["Moz" + a] = "moz" + b;
        return c;
      }
      var We = { animationend: Ve("Animation", "AnimationEnd"), animationiteration: Ve("Animation", "AnimationIteration"), animationstart: Ve("Animation", "AnimationStart"), transitionend: Ve("Transition", "TransitionEnd") };
      var Xe = {};
      var Ye = {};
      ia && (Ye = document.createElement("div").style, "AnimationEvent" in window || (delete We.animationend.animation, delete We.animationiteration.animation, delete We.animationstart.animation), "TransitionEvent" in window || delete We.transitionend.transition);
      function Ze(a) {
        if (Xe[a]) return Xe[a];
        if (!We[a]) return a;
        var b = We[a], c;
        for (c in b) if (b.hasOwnProperty(c) && c in Ye) return Xe[a] = b[c];
        return a;
      }
      var $e = Ze("animationend");
      var af = Ze("animationiteration");
      var bf = Ze("animationstart");
      var cf = Ze("transitionend");
      var df = /* @__PURE__ */ new Map();
      var ef = "abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
      function ff(a, b) {
        df.set(a, b);
        fa(b, [a]);
      }
      for (gf = 0; gf < ef.length; gf++) {
        hf = ef[gf], jf = hf.toLowerCase(), kf = hf[0].toUpperCase() + hf.slice(1);
        ff(jf, "on" + kf);
      }
      var hf;
      var jf;
      var kf;
      var gf;
      ff($e, "onAnimationEnd");
      ff(af, "onAnimationIteration");
      ff(bf, "onAnimationStart");
      ff("dblclick", "onDoubleClick");
      ff("focusin", "onFocus");
      ff("focusout", "onBlur");
      ff(cf, "onTransitionEnd");
      ha("onMouseEnter", ["mouseout", "mouseover"]);
      ha("onMouseLeave", ["mouseout", "mouseover"]);
      ha("onPointerEnter", ["pointerout", "pointerover"]);
      ha("onPointerLeave", ["pointerout", "pointerover"]);
      fa("onChange", "change click focusin focusout input keydown keyup selectionchange".split(" "));
      fa("onSelect", "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" "));
      fa("onBeforeInput", ["compositionend", "keypress", "textInput", "paste"]);
      fa("onCompositionEnd", "compositionend focusout keydown keypress keyup mousedown".split(" "));
      fa("onCompositionStart", "compositionstart focusout keydown keypress keyup mousedown".split(" "));
      fa("onCompositionUpdate", "compositionupdate focusout keydown keypress keyup mousedown".split(" "));
      var lf = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" ");
      var mf = new Set("cancel close invalid load scroll toggle".split(" ").concat(lf));
      function nf(a, b, c) {
        var d = a.type || "unknown-event";
        a.currentTarget = c;
        Ub(d, b, void 0, a);
        a.currentTarget = null;
      }
      function se(a, b) {
        b = 0 !== (b & 4);
        for (var c = 0; c < a.length; c++) {
          var d = a[c], e = d.event;
          d = d.listeners;
          a: {
            var f = void 0;
            if (b) for (var g = d.length - 1; 0 <= g; g--) {
              var h = d[g], k = h.instance, l = h.currentTarget;
              h = h.listener;
              if (k !== f && e.isPropagationStopped()) break a;
              nf(e, h, l);
              f = k;
            }
            else for (g = 0; g < d.length; g++) {
              h = d[g];
              k = h.instance;
              l = h.currentTarget;
              h = h.listener;
              if (k !== f && e.isPropagationStopped()) break a;
              nf(e, h, l);
              f = k;
            }
          }
        }
        if (Qb) throw a = Rb, Qb = false, Rb = null, a;
      }
      function D(a, b) {
        var c = b[of];
        void 0 === c && (c = b[of] = /* @__PURE__ */ new Set());
        var d = a + "__bubble";
        c.has(d) || (pf(b, a, 2, false), c.add(d));
      }
      function qf(a, b, c) {
        var d = 0;
        b && (d |= 4);
        pf(c, a, d, b);
      }
      var rf = "_reactListening" + Math.random().toString(36).slice(2);
      function sf(a) {
        if (!a[rf]) {
          a[rf] = true;
          da.forEach(function(b2) {
            "selectionchange" !== b2 && (mf.has(b2) || qf(b2, false, a), qf(b2, true, a));
          });
          var b = 9 === a.nodeType ? a : a.ownerDocument;
          null === b || b[rf] || (b[rf] = true, qf("selectionchange", false, b));
        }
      }
      function pf(a, b, c, d) {
        switch (jd(b)) {
          case 1:
            var e = ed;
            break;
          case 4:
            e = gd;
            break;
          default:
            e = fd;
        }
        c = e.bind(null, b, c, a);
        e = void 0;
        !Lb || "touchstart" !== b && "touchmove" !== b && "wheel" !== b || (e = true);
        d ? void 0 !== e ? a.addEventListener(b, c, { capture: true, passive: e }) : a.addEventListener(b, c, true) : void 0 !== e ? a.addEventListener(b, c, { passive: e }) : a.addEventListener(b, c, false);
      }
      function hd(a, b, c, d, e) {
        var f = d;
        if (0 === (b & 1) && 0 === (b & 2) && null !== d) a: for (; ; ) {
          if (null === d) return;
          var g = d.tag;
          if (3 === g || 4 === g) {
            var h = d.stateNode.containerInfo;
            if (h === e || 8 === h.nodeType && h.parentNode === e) break;
            if (4 === g) for (g = d.return; null !== g; ) {
              var k = g.tag;
              if (3 === k || 4 === k) {
                if (k = g.stateNode.containerInfo, k === e || 8 === k.nodeType && k.parentNode === e) return;
              }
              g = g.return;
            }
            for (; null !== h; ) {
              g = Wc(h);
              if (null === g) return;
              k = g.tag;
              if (5 === k || 6 === k) {
                d = f = g;
                continue a;
              }
              h = h.parentNode;
            }
          }
          d = d.return;
        }
        Jb(function() {
          var d2 = f, e2 = xb(c), g2 = [];
          a: {
            var h2 = df.get(a);
            if (void 0 !== h2) {
              var k2 = td, n = a;
              switch (a) {
                case "keypress":
                  if (0 === od(c)) break a;
                case "keydown":
                case "keyup":
                  k2 = Rd;
                  break;
                case "focusin":
                  n = "focus";
                  k2 = Fd;
                  break;
                case "focusout":
                  n = "blur";
                  k2 = Fd;
                  break;
                case "beforeblur":
                case "afterblur":
                  k2 = Fd;
                  break;
                case "click":
                  if (2 === c.button) break a;
                case "auxclick":
                case "dblclick":
                case "mousedown":
                case "mousemove":
                case "mouseup":
                case "mouseout":
                case "mouseover":
                case "contextmenu":
                  k2 = Bd;
                  break;
                case "drag":
                case "dragend":
                case "dragenter":
                case "dragexit":
                case "dragleave":
                case "dragover":
                case "dragstart":
                case "drop":
                  k2 = Dd;
                  break;
                case "touchcancel":
                case "touchend":
                case "touchmove":
                case "touchstart":
                  k2 = Vd;
                  break;
                case $e:
                case af:
                case bf:
                  k2 = Hd;
                  break;
                case cf:
                  k2 = Xd;
                  break;
                case "scroll":
                  k2 = vd;
                  break;
                case "wheel":
                  k2 = Zd;
                  break;
                case "copy":
                case "cut":
                case "paste":
                  k2 = Jd;
                  break;
                case "gotpointercapture":
                case "lostpointercapture":
                case "pointercancel":
                case "pointerdown":
                case "pointermove":
                case "pointerout":
                case "pointerover":
                case "pointerup":
                  k2 = Td;
              }
              var t = 0 !== (b & 4), J = !t && "scroll" === a, x = t ? null !== h2 ? h2 + "Capture" : null : h2;
              t = [];
              for (var w = d2, u; null !== w; ) {
                u = w;
                var F = u.stateNode;
                5 === u.tag && null !== F && (u = F, null !== x && (F = Kb(w, x), null != F && t.push(tf(w, F, u))));
                if (J) break;
                w = w.return;
              }
              0 < t.length && (h2 = new k2(h2, n, null, c, e2), g2.push({ event: h2, listeners: t }));
            }
          }
          if (0 === (b & 7)) {
            a: {
              h2 = "mouseover" === a || "pointerover" === a;
              k2 = "mouseout" === a || "pointerout" === a;
              if (h2 && c !== wb && (n = c.relatedTarget || c.fromElement) && (Wc(n) || n[uf])) break a;
              if (k2 || h2) {
                h2 = e2.window === e2 ? e2 : (h2 = e2.ownerDocument) ? h2.defaultView || h2.parentWindow : window;
                if (k2) {
                  if (n = c.relatedTarget || c.toElement, k2 = d2, n = n ? Wc(n) : null, null !== n && (J = Vb(n), n !== J || 5 !== n.tag && 6 !== n.tag)) n = null;
                } else k2 = null, n = d2;
                if (k2 !== n) {
                  t = Bd;
                  F = "onMouseLeave";
                  x = "onMouseEnter";
                  w = "mouse";
                  if ("pointerout" === a || "pointerover" === a) t = Td, F = "onPointerLeave", x = "onPointerEnter", w = "pointer";
                  J = null == k2 ? h2 : ue(k2);
                  u = null == n ? h2 : ue(n);
                  h2 = new t(F, w + "leave", k2, c, e2);
                  h2.target = J;
                  h2.relatedTarget = u;
                  F = null;
                  Wc(e2) === d2 && (t = new t(x, w + "enter", n, c, e2), t.target = u, t.relatedTarget = J, F = t);
                  J = F;
                  if (k2 && n) b: {
                    t = k2;
                    x = n;
                    w = 0;
                    for (u = t; u; u = vf(u)) w++;
                    u = 0;
                    for (F = x; F; F = vf(F)) u++;
                    for (; 0 < w - u; ) t = vf(t), w--;
                    for (; 0 < u - w; ) x = vf(x), u--;
                    for (; w--; ) {
                      if (t === x || null !== x && t === x.alternate) break b;
                      t = vf(t);
                      x = vf(x);
                    }
                    t = null;
                  }
                  else t = null;
                  null !== k2 && wf(g2, h2, k2, t, false);
                  null !== n && null !== J && wf(g2, J, n, t, true);
                }
              }
            }
            a: {
              h2 = d2 ? ue(d2) : window;
              k2 = h2.nodeName && h2.nodeName.toLowerCase();
              if ("select" === k2 || "input" === k2 && "file" === h2.type) var na = ve;
              else if (me(h2)) if (we) na = Fe;
              else {
                na = De;
                var xa = Ce;
              }
              else (k2 = h2.nodeName) && "input" === k2.toLowerCase() && ("checkbox" === h2.type || "radio" === h2.type) && (na = Ee);
              if (na && (na = na(a, d2))) {
                ne(g2, na, c, e2);
                break a;
              }
              xa && xa(a, h2, d2);
              "focusout" === a && (xa = h2._wrapperState) && xa.controlled && "number" === h2.type && cb(h2, "number", h2.value);
            }
            xa = d2 ? ue(d2) : window;
            switch (a) {
              case "focusin":
                if (me(xa) || "true" === xa.contentEditable) Qe = xa, Re = d2, Se = null;
                break;
              case "focusout":
                Se = Re = Qe = null;
                break;
              case "mousedown":
                Te = true;
                break;
              case "contextmenu":
              case "mouseup":
              case "dragend":
                Te = false;
                Ue(g2, c, e2);
                break;
              case "selectionchange":
                if (Pe) break;
              case "keydown":
              case "keyup":
                Ue(g2, c, e2);
            }
            var $a;
            if (ae) b: {
              switch (a) {
                case "compositionstart":
                  var ba = "onCompositionStart";
                  break b;
                case "compositionend":
                  ba = "onCompositionEnd";
                  break b;
                case "compositionupdate":
                  ba = "onCompositionUpdate";
                  break b;
              }
              ba = void 0;
            }
            else ie ? ge(a, c) && (ba = "onCompositionEnd") : "keydown" === a && 229 === c.keyCode && (ba = "onCompositionStart");
            ba && (de && "ko" !== c.locale && (ie || "onCompositionStart" !== ba ? "onCompositionEnd" === ba && ie && ($a = nd()) : (kd = e2, ld = "value" in kd ? kd.value : kd.textContent, ie = true)), xa = oe(d2, ba), 0 < xa.length && (ba = new Ld(ba, a, null, c, e2), g2.push({ event: ba, listeners: xa }), $a ? ba.data = $a : ($a = he(c), null !== $a && (ba.data = $a))));
            if ($a = ce ? je(a, c) : ke(a, c)) d2 = oe(d2, "onBeforeInput"), 0 < d2.length && (e2 = new Ld("onBeforeInput", "beforeinput", null, c, e2), g2.push({ event: e2, listeners: d2 }), e2.data = $a);
          }
          se(g2, b);
        });
      }
      function tf(a, b, c) {
        return { instance: a, listener: b, currentTarget: c };
      }
      function oe(a, b) {
        for (var c = b + "Capture", d = []; null !== a; ) {
          var e = a, f = e.stateNode;
          5 === e.tag && null !== f && (e = f, f = Kb(a, c), null != f && d.unshift(tf(a, f, e)), f = Kb(a, b), null != f && d.push(tf(a, f, e)));
          a = a.return;
        }
        return d;
      }
      function vf(a) {
        if (null === a) return null;
        do
          a = a.return;
        while (a && 5 !== a.tag);
        return a ? a : null;
      }
      function wf(a, b, c, d, e) {
        for (var f = b._reactName, g = []; null !== c && c !== d; ) {
          var h = c, k = h.alternate, l = h.stateNode;
          if (null !== k && k === d) break;
          5 === h.tag && null !== l && (h = l, e ? (k = Kb(c, f), null != k && g.unshift(tf(c, k, h))) : e || (k = Kb(c, f), null != k && g.push(tf(c, k, h))));
          c = c.return;
        }
        0 !== g.length && a.push({ event: b, listeners: g });
      }
      var xf = /\r\n?/g;
      var yf = /\u0000|\uFFFD/g;
      function zf(a) {
        return ("string" === typeof a ? a : "" + a).replace(xf, "\n").replace(yf, "");
      }
      function Af(a, b, c) {
        b = zf(b);
        if (zf(a) !== b && c) throw Error(p(425));
      }
      function Bf() {
      }
      var Cf = null;
      var Df = null;
      function Ef(a, b) {
        return "textarea" === a || "noscript" === a || "string" === typeof b.children || "number" === typeof b.children || "object" === typeof b.dangerouslySetInnerHTML && null !== b.dangerouslySetInnerHTML && null != b.dangerouslySetInnerHTML.__html;
      }
      var Ff = "function" === typeof setTimeout ? setTimeout : void 0;
      var Gf = "function" === typeof clearTimeout ? clearTimeout : void 0;
      var Hf = "function" === typeof Promise ? Promise : void 0;
      var Jf = "function" === typeof queueMicrotask ? queueMicrotask : "undefined" !== typeof Hf ? function(a) {
        return Hf.resolve(null).then(a).catch(If);
      } : Ff;
      function If(a) {
        setTimeout(function() {
          throw a;
        });
      }
      function Kf(a, b) {
        var c = b, d = 0;
        do {
          var e = c.nextSibling;
          a.removeChild(c);
          if (e && 8 === e.nodeType) if (c = e.data, "/$" === c) {
            if (0 === d) {
              a.removeChild(e);
              bd(b);
              return;
            }
            d--;
          } else "$" !== c && "$?" !== c && "$!" !== c || d++;
          c = e;
        } while (c);
        bd(b);
      }
      function Lf(a) {
        for (; null != a; a = a.nextSibling) {
          var b = a.nodeType;
          if (1 === b || 3 === b) break;
          if (8 === b) {
            b = a.data;
            if ("$" === b || "$!" === b || "$?" === b) break;
            if ("/$" === b) return null;
          }
        }
        return a;
      }
      function Mf(a) {
        a = a.previousSibling;
        for (var b = 0; a; ) {
          if (8 === a.nodeType) {
            var c = a.data;
            if ("$" === c || "$!" === c || "$?" === c) {
              if (0 === b) return a;
              b--;
            } else "/$" === c && b++;
          }
          a = a.previousSibling;
        }
        return null;
      }
      var Nf = Math.random().toString(36).slice(2);
      var Of = "__reactFiber$" + Nf;
      var Pf = "__reactProps$" + Nf;
      var uf = "__reactContainer$" + Nf;
      var of = "__reactEvents$" + Nf;
      var Qf = "__reactListeners$" + Nf;
      var Rf = "__reactHandles$" + Nf;
      function Wc(a) {
        var b = a[Of];
        if (b) return b;
        for (var c = a.parentNode; c; ) {
          if (b = c[uf] || c[Of]) {
            c = b.alternate;
            if (null !== b.child || null !== c && null !== c.child) for (a = Mf(a); null !== a; ) {
              if (c = a[Of]) return c;
              a = Mf(a);
            }
            return b;
          }
          a = c;
          c = a.parentNode;
        }
        return null;
      }
      function Cb(a) {
        a = a[Of] || a[uf];
        return !a || 5 !== a.tag && 6 !== a.tag && 13 !== a.tag && 3 !== a.tag ? null : a;
      }
      function ue(a) {
        if (5 === a.tag || 6 === a.tag) return a.stateNode;
        throw Error(p(33));
      }
      function Db(a) {
        return a[Pf] || null;
      }
      var Sf = [];
      var Tf = -1;
      function Uf(a) {
        return { current: a };
      }
      function E(a) {
        0 > Tf || (a.current = Sf[Tf], Sf[Tf] = null, Tf--);
      }
      function G(a, b) {
        Tf++;
        Sf[Tf] = a.current;
        a.current = b;
      }
      var Vf = {};
      var H = Uf(Vf);
      var Wf = Uf(false);
      var Xf = Vf;
      function Yf(a, b) {
        var c = a.type.contextTypes;
        if (!c) return Vf;
        var d = a.stateNode;
        if (d && d.__reactInternalMemoizedUnmaskedChildContext === b) return d.__reactInternalMemoizedMaskedChildContext;
        var e = {}, f;
        for (f in c) e[f] = b[f];
        d && (a = a.stateNode, a.__reactInternalMemoizedUnmaskedChildContext = b, a.__reactInternalMemoizedMaskedChildContext = e);
        return e;
      }
      function Zf(a) {
        a = a.childContextTypes;
        return null !== a && void 0 !== a;
      }
      function $f() {
        E(Wf);
        E(H);
      }
      function ag(a, b, c) {
        if (H.current !== Vf) throw Error(p(168));
        G(H, b);
        G(Wf, c);
      }
      function bg(a, b, c) {
        var d = a.stateNode;
        b = b.childContextTypes;
        if ("function" !== typeof d.getChildContext) return c;
        d = d.getChildContext();
        for (var e in d) if (!(e in b)) throw Error(p(108, Ra(a) || "Unknown", e));
        return A({}, c, d);
      }
      function cg(a) {
        a = (a = a.stateNode) && a.__reactInternalMemoizedMergedChildContext || Vf;
        Xf = H.current;
        G(H, a);
        G(Wf, Wf.current);
        return true;
      }
      function dg(a, b, c) {
        var d = a.stateNode;
        if (!d) throw Error(p(169));
        c ? (a = bg(a, b, Xf), d.__reactInternalMemoizedMergedChildContext = a, E(Wf), E(H), G(H, a)) : E(Wf);
        G(Wf, c);
      }
      var eg = null;
      var fg = false;
      var gg = false;
      function hg(a) {
        null === eg ? eg = [a] : eg.push(a);
      }
      function ig(a) {
        fg = true;
        hg(a);
      }
      function jg() {
        if (!gg && null !== eg) {
          gg = true;
          var a = 0, b = C;
          try {
            var c = eg;
            for (C = 1; a < c.length; a++) {
              var d = c[a];
              do
                d = d(true);
              while (null !== d);
            }
            eg = null;
            fg = false;
          } catch (e) {
            throw null !== eg && (eg = eg.slice(a + 1)), ac(fc, jg), e;
          } finally {
            C = b, gg = false;
          }
        }
        return null;
      }
      var kg = [];
      var lg = 0;
      var mg = null;
      var ng = 0;
      var og = [];
      var pg = 0;
      var qg = null;
      var rg = 1;
      var sg = "";
      function tg(a, b) {
        kg[lg++] = ng;
        kg[lg++] = mg;
        mg = a;
        ng = b;
      }
      function ug(a, b, c) {
        og[pg++] = rg;
        og[pg++] = sg;
        og[pg++] = qg;
        qg = a;
        var d = rg;
        a = sg;
        var e = 32 - oc(d) - 1;
        d &= ~(1 << e);
        c += 1;
        var f = 32 - oc(b) + e;
        if (30 < f) {
          var g = e - e % 5;
          f = (d & (1 << g) - 1).toString(32);
          d >>= g;
          e -= g;
          rg = 1 << 32 - oc(b) + e | c << e | d;
          sg = f + a;
        } else rg = 1 << f | c << e | d, sg = a;
      }
      function vg(a) {
        null !== a.return && (tg(a, 1), ug(a, 1, 0));
      }
      function wg(a) {
        for (; a === mg; ) mg = kg[--lg], kg[lg] = null, ng = kg[--lg], kg[lg] = null;
        for (; a === qg; ) qg = og[--pg], og[pg] = null, sg = og[--pg], og[pg] = null, rg = og[--pg], og[pg] = null;
      }
      var xg = null;
      var yg = null;
      var I = false;
      var zg = null;
      function Ag(a, b) {
        var c = Bg(5, null, null, 0);
        c.elementType = "DELETED";
        c.stateNode = b;
        c.return = a;
        b = a.deletions;
        null === b ? (a.deletions = [c], a.flags |= 16) : b.push(c);
      }
      function Cg(a, b) {
        switch (a.tag) {
          case 5:
            var c = a.type;
            b = 1 !== b.nodeType || c.toLowerCase() !== b.nodeName.toLowerCase() ? null : b;
            return null !== b ? (a.stateNode = b, xg = a, yg = Lf(b.firstChild), true) : false;
          case 6:
            return b = "" === a.pendingProps || 3 !== b.nodeType ? null : b, null !== b ? (a.stateNode = b, xg = a, yg = null, true) : false;
          case 13:
            return b = 8 !== b.nodeType ? null : b, null !== b ? (c = null !== qg ? { id: rg, overflow: sg } : null, a.memoizedState = { dehydrated: b, treeContext: c, retryLane: 1073741824 }, c = Bg(18, null, null, 0), c.stateNode = b, c.return = a, a.child = c, xg = a, yg = null, true) : false;
          default:
            return false;
        }
      }
      function Dg(a) {
        return 0 !== (a.mode & 1) && 0 === (a.flags & 128);
      }
      function Eg(a) {
        if (I) {
          var b = yg;
          if (b) {
            var c = b;
            if (!Cg(a, b)) {
              if (Dg(a)) throw Error(p(418));
              b = Lf(c.nextSibling);
              var d = xg;
              b && Cg(a, b) ? Ag(d, c) : (a.flags = a.flags & -4097 | 2, I = false, xg = a);
            }
          } else {
            if (Dg(a)) throw Error(p(418));
            a.flags = a.flags & -4097 | 2;
            I = false;
            xg = a;
          }
        }
      }
      function Fg(a) {
        for (a = a.return; null !== a && 5 !== a.tag && 3 !== a.tag && 13 !== a.tag; ) a = a.return;
        xg = a;
      }
      function Gg(a) {
        if (a !== xg) return false;
        if (!I) return Fg(a), I = true, false;
        var b;
        (b = 3 !== a.tag) && !(b = 5 !== a.tag) && (b = a.type, b = "head" !== b && "body" !== b && !Ef(a.type, a.memoizedProps));
        if (b && (b = yg)) {
          if (Dg(a)) throw Hg(), Error(p(418));
          for (; b; ) Ag(a, b), b = Lf(b.nextSibling);
        }
        Fg(a);
        if (13 === a.tag) {
          a = a.memoizedState;
          a = null !== a ? a.dehydrated : null;
          if (!a) throw Error(p(317));
          a: {
            a = a.nextSibling;
            for (b = 0; a; ) {
              if (8 === a.nodeType) {
                var c = a.data;
                if ("/$" === c) {
                  if (0 === b) {
                    yg = Lf(a.nextSibling);
                    break a;
                  }
                  b--;
                } else "$" !== c && "$!" !== c && "$?" !== c || b++;
              }
              a = a.nextSibling;
            }
            yg = null;
          }
        } else yg = xg ? Lf(a.stateNode.nextSibling) : null;
        return true;
      }
      function Hg() {
        for (var a = yg; a; ) a = Lf(a.nextSibling);
      }
      function Ig() {
        yg = xg = null;
        I = false;
      }
      function Jg(a) {
        null === zg ? zg = [a] : zg.push(a);
      }
      var Kg = ua.ReactCurrentBatchConfig;
      function Lg(a, b, c) {
        a = c.ref;
        if (null !== a && "function" !== typeof a && "object" !== typeof a) {
          if (c._owner) {
            c = c._owner;
            if (c) {
              if (1 !== c.tag) throw Error(p(309));
              var d = c.stateNode;
            }
            if (!d) throw Error(p(147, a));
            var e = d, f = "" + a;
            if (null !== b && null !== b.ref && "function" === typeof b.ref && b.ref._stringRef === f) return b.ref;
            b = function(a2) {
              var b2 = e.refs;
              null === a2 ? delete b2[f] : b2[f] = a2;
            };
            b._stringRef = f;
            return b;
          }
          if ("string" !== typeof a) throw Error(p(284));
          if (!c._owner) throw Error(p(290, a));
        }
        return a;
      }
      function Mg(a, b) {
        a = Object.prototype.toString.call(b);
        throw Error(p(31, "[object Object]" === a ? "object with keys {" + Object.keys(b).join(", ") + "}" : a));
      }
      function Ng(a) {
        var b = a._init;
        return b(a._payload);
      }
      function Og(a) {
        function b(b2, c2) {
          if (a) {
            var d2 = b2.deletions;
            null === d2 ? (b2.deletions = [c2], b2.flags |= 16) : d2.push(c2);
          }
        }
        function c(c2, d2) {
          if (!a) return null;
          for (; null !== d2; ) b(c2, d2), d2 = d2.sibling;
          return null;
        }
        function d(a2, b2) {
          for (a2 = /* @__PURE__ */ new Map(); null !== b2; ) null !== b2.key ? a2.set(b2.key, b2) : a2.set(b2.index, b2), b2 = b2.sibling;
          return a2;
        }
        function e(a2, b2) {
          a2 = Pg(a2, b2);
          a2.index = 0;
          a2.sibling = null;
          return a2;
        }
        function f(b2, c2, d2) {
          b2.index = d2;
          if (!a) return b2.flags |= 1048576, c2;
          d2 = b2.alternate;
          if (null !== d2) return d2 = d2.index, d2 < c2 ? (b2.flags |= 2, c2) : d2;
          b2.flags |= 2;
          return c2;
        }
        function g(b2) {
          a && null === b2.alternate && (b2.flags |= 2);
          return b2;
        }
        function h(a2, b2, c2, d2) {
          if (null === b2 || 6 !== b2.tag) return b2 = Qg(c2, a2.mode, d2), b2.return = a2, b2;
          b2 = e(b2, c2);
          b2.return = a2;
          return b2;
        }
        function k(a2, b2, c2, d2) {
          var f2 = c2.type;
          if (f2 === ya) return m(a2, b2, c2.props.children, d2, c2.key);
          if (null !== b2 && (b2.elementType === f2 || "object" === typeof f2 && null !== f2 && f2.$$typeof === Ha && Ng(f2) === b2.type)) return d2 = e(b2, c2.props), d2.ref = Lg(a2, b2, c2), d2.return = a2, d2;
          d2 = Rg(c2.type, c2.key, c2.props, null, a2.mode, d2);
          d2.ref = Lg(a2, b2, c2);
          d2.return = a2;
          return d2;
        }
        function l(a2, b2, c2, d2) {
          if (null === b2 || 4 !== b2.tag || b2.stateNode.containerInfo !== c2.containerInfo || b2.stateNode.implementation !== c2.implementation) return b2 = Sg(c2, a2.mode, d2), b2.return = a2, b2;
          b2 = e(b2, c2.children || []);
          b2.return = a2;
          return b2;
        }
        function m(a2, b2, c2, d2, f2) {
          if (null === b2 || 7 !== b2.tag) return b2 = Tg(c2, a2.mode, d2, f2), b2.return = a2, b2;
          b2 = e(b2, c2);
          b2.return = a2;
          return b2;
        }
        function q(a2, b2, c2) {
          if ("string" === typeof b2 && "" !== b2 || "number" === typeof b2) return b2 = Qg("" + b2, a2.mode, c2), b2.return = a2, b2;
          if ("object" === typeof b2 && null !== b2) {
            switch (b2.$$typeof) {
              case va:
                return c2 = Rg(b2.type, b2.key, b2.props, null, a2.mode, c2), c2.ref = Lg(a2, null, b2), c2.return = a2, c2;
              case wa:
                return b2 = Sg(b2, a2.mode, c2), b2.return = a2, b2;
              case Ha:
                var d2 = b2._init;
                return q(a2, d2(b2._payload), c2);
            }
            if (eb(b2) || Ka(b2)) return b2 = Tg(b2, a2.mode, c2, null), b2.return = a2, b2;
            Mg(a2, b2);
          }
          return null;
        }
        function r(a2, b2, c2, d2) {
          var e2 = null !== b2 ? b2.key : null;
          if ("string" === typeof c2 && "" !== c2 || "number" === typeof c2) return null !== e2 ? null : h(a2, b2, "" + c2, d2);
          if ("object" === typeof c2 && null !== c2) {
            switch (c2.$$typeof) {
              case va:
                return c2.key === e2 ? k(a2, b2, c2, d2) : null;
              case wa:
                return c2.key === e2 ? l(a2, b2, c2, d2) : null;
              case Ha:
                return e2 = c2._init, r(
                  a2,
                  b2,
                  e2(c2._payload),
                  d2
                );
            }
            if (eb(c2) || Ka(c2)) return null !== e2 ? null : m(a2, b2, c2, d2, null);
            Mg(a2, c2);
          }
          return null;
        }
        function y(a2, b2, c2, d2, e2) {
          if ("string" === typeof d2 && "" !== d2 || "number" === typeof d2) return a2 = a2.get(c2) || null, h(b2, a2, "" + d2, e2);
          if ("object" === typeof d2 && null !== d2) {
            switch (d2.$$typeof) {
              case va:
                return a2 = a2.get(null === d2.key ? c2 : d2.key) || null, k(b2, a2, d2, e2);
              case wa:
                return a2 = a2.get(null === d2.key ? c2 : d2.key) || null, l(b2, a2, d2, e2);
              case Ha:
                var f2 = d2._init;
                return y(a2, b2, c2, f2(d2._payload), e2);
            }
            if (eb(d2) || Ka(d2)) return a2 = a2.get(c2) || null, m(b2, a2, d2, e2, null);
            Mg(b2, d2);
          }
          return null;
        }
        function n(e2, g2, h2, k2) {
          for (var l2 = null, m2 = null, u = g2, w = g2 = 0, x = null; null !== u && w < h2.length; w++) {
            u.index > w ? (x = u, u = null) : x = u.sibling;
            var n2 = r(e2, u, h2[w], k2);
            if (null === n2) {
              null === u && (u = x);
              break;
            }
            a && u && null === n2.alternate && b(e2, u);
            g2 = f(n2, g2, w);
            null === m2 ? l2 = n2 : m2.sibling = n2;
            m2 = n2;
            u = x;
          }
          if (w === h2.length) return c(e2, u), I && tg(e2, w), l2;
          if (null === u) {
            for (; w < h2.length; w++) u = q(e2, h2[w], k2), null !== u && (g2 = f(u, g2, w), null === m2 ? l2 = u : m2.sibling = u, m2 = u);
            I && tg(e2, w);
            return l2;
          }
          for (u = d(e2, u); w < h2.length; w++) x = y(u, e2, w, h2[w], k2), null !== x && (a && null !== x.alternate && u.delete(null === x.key ? w : x.key), g2 = f(x, g2, w), null === m2 ? l2 = x : m2.sibling = x, m2 = x);
          a && u.forEach(function(a2) {
            return b(e2, a2);
          });
          I && tg(e2, w);
          return l2;
        }
        function t(e2, g2, h2, k2) {
          var l2 = Ka(h2);
          if ("function" !== typeof l2) throw Error(p(150));
          h2 = l2.call(h2);
          if (null == h2) throw Error(p(151));
          for (var u = l2 = null, m2 = g2, w = g2 = 0, x = null, n2 = h2.next(); null !== m2 && !n2.done; w++, n2 = h2.next()) {
            m2.index > w ? (x = m2, m2 = null) : x = m2.sibling;
            var t2 = r(e2, m2, n2.value, k2);
            if (null === t2) {
              null === m2 && (m2 = x);
              break;
            }
            a && m2 && null === t2.alternate && b(e2, m2);
            g2 = f(t2, g2, w);
            null === u ? l2 = t2 : u.sibling = t2;
            u = t2;
            m2 = x;
          }
          if (n2.done) return c(
            e2,
            m2
          ), I && tg(e2, w), l2;
          if (null === m2) {
            for (; !n2.done; w++, n2 = h2.next()) n2 = q(e2, n2.value, k2), null !== n2 && (g2 = f(n2, g2, w), null === u ? l2 = n2 : u.sibling = n2, u = n2);
            I && tg(e2, w);
            return l2;
          }
          for (m2 = d(e2, m2); !n2.done; w++, n2 = h2.next()) n2 = y(m2, e2, w, n2.value, k2), null !== n2 && (a && null !== n2.alternate && m2.delete(null === n2.key ? w : n2.key), g2 = f(n2, g2, w), null === u ? l2 = n2 : u.sibling = n2, u = n2);
          a && m2.forEach(function(a2) {
            return b(e2, a2);
          });
          I && tg(e2, w);
          return l2;
        }
        function J(a2, d2, f2, h2) {
          "object" === typeof f2 && null !== f2 && f2.type === ya && null === f2.key && (f2 = f2.props.children);
          if ("object" === typeof f2 && null !== f2) {
            switch (f2.$$typeof) {
              case va:
                a: {
                  for (var k2 = f2.key, l2 = d2; null !== l2; ) {
                    if (l2.key === k2) {
                      k2 = f2.type;
                      if (k2 === ya) {
                        if (7 === l2.tag) {
                          c(a2, l2.sibling);
                          d2 = e(l2, f2.props.children);
                          d2.return = a2;
                          a2 = d2;
                          break a;
                        }
                      } else if (l2.elementType === k2 || "object" === typeof k2 && null !== k2 && k2.$$typeof === Ha && Ng(k2) === l2.type) {
                        c(a2, l2.sibling);
                        d2 = e(l2, f2.props);
                        d2.ref = Lg(a2, l2, f2);
                        d2.return = a2;
                        a2 = d2;
                        break a;
                      }
                      c(a2, l2);
                      break;
                    } else b(a2, l2);
                    l2 = l2.sibling;
                  }
                  f2.type === ya ? (d2 = Tg(f2.props.children, a2.mode, h2, f2.key), d2.return = a2, a2 = d2) : (h2 = Rg(f2.type, f2.key, f2.props, null, a2.mode, h2), h2.ref = Lg(a2, d2, f2), h2.return = a2, a2 = h2);
                }
                return g(a2);
              case wa:
                a: {
                  for (l2 = f2.key; null !== d2; ) {
                    if (d2.key === l2) if (4 === d2.tag && d2.stateNode.containerInfo === f2.containerInfo && d2.stateNode.implementation === f2.implementation) {
                      c(a2, d2.sibling);
                      d2 = e(d2, f2.children || []);
                      d2.return = a2;
                      a2 = d2;
                      break a;
                    } else {
                      c(a2, d2);
                      break;
                    }
                    else b(a2, d2);
                    d2 = d2.sibling;
                  }
                  d2 = Sg(f2, a2.mode, h2);
                  d2.return = a2;
                  a2 = d2;
                }
                return g(a2);
              case Ha:
                return l2 = f2._init, J(a2, d2, l2(f2._payload), h2);
            }
            if (eb(f2)) return n(a2, d2, f2, h2);
            if (Ka(f2)) return t(a2, d2, f2, h2);
            Mg(a2, f2);
          }
          return "string" === typeof f2 && "" !== f2 || "number" === typeof f2 ? (f2 = "" + f2, null !== d2 && 6 === d2.tag ? (c(a2, d2.sibling), d2 = e(d2, f2), d2.return = a2, a2 = d2) : (c(a2, d2), d2 = Qg(f2, a2.mode, h2), d2.return = a2, a2 = d2), g(a2)) : c(a2, d2);
        }
        return J;
      }
      var Ug = Og(true);
      var Vg = Og(false);
      var Wg = Uf(null);
      var Xg = null;
      var Yg = null;
      var Zg = null;
      function $g() {
        Zg = Yg = Xg = null;
      }
      function ah(a) {
        var b = Wg.current;
        E(Wg);
        a._currentValue = b;
      }
      function bh(a, b, c) {
        for (; null !== a; ) {
          var d = a.alternate;
          (a.childLanes & b) !== b ? (a.childLanes |= b, null !== d && (d.childLanes |= b)) : null !== d && (d.childLanes & b) !== b && (d.childLanes |= b);
          if (a === c) break;
          a = a.return;
        }
      }
      function ch(a, b) {
        Xg = a;
        Zg = Yg = null;
        a = a.dependencies;
        null !== a && null !== a.firstContext && (0 !== (a.lanes & b) && (dh = true), a.firstContext = null);
      }
      function eh(a) {
        var b = a._currentValue;
        if (Zg !== a) if (a = { context: a, memoizedValue: b, next: null }, null === Yg) {
          if (null === Xg) throw Error(p(308));
          Yg = a;
          Xg.dependencies = { lanes: 0, firstContext: a };
        } else Yg = Yg.next = a;
        return b;
      }
      var fh = null;
      function gh(a) {
        null === fh ? fh = [a] : fh.push(a);
      }
      function hh(a, b, c, d) {
        var e = b.interleaved;
        null === e ? (c.next = c, gh(b)) : (c.next = e.next, e.next = c);
        b.interleaved = c;
        return ih(a, d);
      }
      function ih(a, b) {
        a.lanes |= b;
        var c = a.alternate;
        null !== c && (c.lanes |= b);
        c = a;
        for (a = a.return; null !== a; ) a.childLanes |= b, c = a.alternate, null !== c && (c.childLanes |= b), c = a, a = a.return;
        return 3 === c.tag ? c.stateNode : null;
      }
      var jh = false;
      function kh(a) {
        a.updateQueue = { baseState: a.memoizedState, firstBaseUpdate: null, lastBaseUpdate: null, shared: { pending: null, interleaved: null, lanes: 0 }, effects: null };
      }
      function lh(a, b) {
        a = a.updateQueue;
        b.updateQueue === a && (b.updateQueue = { baseState: a.baseState, firstBaseUpdate: a.firstBaseUpdate, lastBaseUpdate: a.lastBaseUpdate, shared: a.shared, effects: a.effects });
      }
      function mh(a, b) {
        return { eventTime: a, lane: b, tag: 0, payload: null, callback: null, next: null };
      }
      function nh(a, b, c) {
        var d = a.updateQueue;
        if (null === d) return null;
        d = d.shared;
        if (0 !== (K & 2)) {
          var e = d.pending;
          null === e ? b.next = b : (b.next = e.next, e.next = b);
          d.pending = b;
          return ih(a, c);
        }
        e = d.interleaved;
        null === e ? (b.next = b, gh(d)) : (b.next = e.next, e.next = b);
        d.interleaved = b;
        return ih(a, c);
      }
      function oh(a, b, c) {
        b = b.updateQueue;
        if (null !== b && (b = b.shared, 0 !== (c & 4194240))) {
          var d = b.lanes;
          d &= a.pendingLanes;
          c |= d;
          b.lanes = c;
          Cc(a, c);
        }
      }
      function ph(a, b) {
        var c = a.updateQueue, d = a.alternate;
        if (null !== d && (d = d.updateQueue, c === d)) {
          var e = null, f = null;
          c = c.firstBaseUpdate;
          if (null !== c) {
            do {
              var g = { eventTime: c.eventTime, lane: c.lane, tag: c.tag, payload: c.payload, callback: c.callback, next: null };
              null === f ? e = f = g : f = f.next = g;
              c = c.next;
            } while (null !== c);
            null === f ? e = f = b : f = f.next = b;
          } else e = f = b;
          c = { baseState: d.baseState, firstBaseUpdate: e, lastBaseUpdate: f, shared: d.shared, effects: d.effects };
          a.updateQueue = c;
          return;
        }
        a = c.lastBaseUpdate;
        null === a ? c.firstBaseUpdate = b : a.next = b;
        c.lastBaseUpdate = b;
      }
      function qh(a, b, c, d) {
        var e = a.updateQueue;
        jh = false;
        var f = e.firstBaseUpdate, g = e.lastBaseUpdate, h = e.shared.pending;
        if (null !== h) {
          e.shared.pending = null;
          var k = h, l = k.next;
          k.next = null;
          null === g ? f = l : g.next = l;
          g = k;
          var m = a.alternate;
          null !== m && (m = m.updateQueue, h = m.lastBaseUpdate, h !== g && (null === h ? m.firstBaseUpdate = l : h.next = l, m.lastBaseUpdate = k));
        }
        if (null !== f) {
          var q = e.baseState;
          g = 0;
          m = l = k = null;
          h = f;
          do {
            var r = h.lane, y = h.eventTime;
            if ((d & r) === r) {
              null !== m && (m = m.next = {
                eventTime: y,
                lane: 0,
                tag: h.tag,
                payload: h.payload,
                callback: h.callback,
                next: null
              });
              a: {
                var n = a, t = h;
                r = b;
                y = c;
                switch (t.tag) {
                  case 1:
                    n = t.payload;
                    if ("function" === typeof n) {
                      q = n.call(y, q, r);
                      break a;
                    }
                    q = n;
                    break a;
                  case 3:
                    n.flags = n.flags & -65537 | 128;
                  case 0:
                    n = t.payload;
                    r = "function" === typeof n ? n.call(y, q, r) : n;
                    if (null === r || void 0 === r) break a;
                    q = A({}, q, r);
                    break a;
                  case 2:
                    jh = true;
                }
              }
              null !== h.callback && 0 !== h.lane && (a.flags |= 64, r = e.effects, null === r ? e.effects = [h] : r.push(h));
            } else y = { eventTime: y, lane: r, tag: h.tag, payload: h.payload, callback: h.callback, next: null }, null === m ? (l = m = y, k = q) : m = m.next = y, g |= r;
            h = h.next;
            if (null === h) if (h = e.shared.pending, null === h) break;
            else r = h, h = r.next, r.next = null, e.lastBaseUpdate = r, e.shared.pending = null;
          } while (1);
          null === m && (k = q);
          e.baseState = k;
          e.firstBaseUpdate = l;
          e.lastBaseUpdate = m;
          b = e.shared.interleaved;
          if (null !== b) {
            e = b;
            do
              g |= e.lane, e = e.next;
            while (e !== b);
          } else null === f && (e.shared.lanes = 0);
          rh |= g;
          a.lanes = g;
          a.memoizedState = q;
        }
      }
      function sh(a, b, c) {
        a = b.effects;
        b.effects = null;
        if (null !== a) for (b = 0; b < a.length; b++) {
          var d = a[b], e = d.callback;
          if (null !== e) {
            d.callback = null;
            d = c;
            if ("function" !== typeof e) throw Error(p(191, e));
            e.call(d);
          }
        }
      }
      var th = {};
      var uh = Uf(th);
      var vh = Uf(th);
      var wh = Uf(th);
      function xh(a) {
        if (a === th) throw Error(p(174));
        return a;
      }
      function yh(a, b) {
        G(wh, b);
        G(vh, a);
        G(uh, th);
        a = b.nodeType;
        switch (a) {
          case 9:
          case 11:
            b = (b = b.documentElement) ? b.namespaceURI : lb(null, "");
            break;
          default:
            a = 8 === a ? b.parentNode : b, b = a.namespaceURI || null, a = a.tagName, b = lb(b, a);
        }
        E(uh);
        G(uh, b);
      }
      function zh() {
        E(uh);
        E(vh);
        E(wh);
      }
      function Ah(a) {
        xh(wh.current);
        var b = xh(uh.current);
        var c = lb(b, a.type);
        b !== c && (G(vh, a), G(uh, c));
      }
      function Bh(a) {
        vh.current === a && (E(uh), E(vh));
      }
      var L = Uf(0);
      function Ch(a) {
        for (var b = a; null !== b; ) {
          if (13 === b.tag) {
            var c = b.memoizedState;
            if (null !== c && (c = c.dehydrated, null === c || "$?" === c.data || "$!" === c.data)) return b;
          } else if (19 === b.tag && void 0 !== b.memoizedProps.revealOrder) {
            if (0 !== (b.flags & 128)) return b;
          } else if (null !== b.child) {
            b.child.return = b;
            b = b.child;
            continue;
          }
          if (b === a) break;
          for (; null === b.sibling; ) {
            if (null === b.return || b.return === a) return null;
            b = b.return;
          }
          b.sibling.return = b.return;
          b = b.sibling;
        }
        return null;
      }
      var Dh = [];
      function Eh() {
        for (var a = 0; a < Dh.length; a++) Dh[a]._workInProgressVersionPrimary = null;
        Dh.length = 0;
      }
      var Fh = ua.ReactCurrentDispatcher;
      var Gh = ua.ReactCurrentBatchConfig;
      var Hh = 0;
      var M = null;
      var N = null;
      var O = null;
      var Ih = false;
      var Jh = false;
      var Kh = 0;
      var Lh = 0;
      function P() {
        throw Error(p(321));
      }
      function Mh(a, b) {
        if (null === b) return false;
        for (var c = 0; c < b.length && c < a.length; c++) if (!He(a[c], b[c])) return false;
        return true;
      }
      function Nh(a, b, c, d, e, f) {
        Hh = f;
        M = b;
        b.memoizedState = null;
        b.updateQueue = null;
        b.lanes = 0;
        Fh.current = null === a || null === a.memoizedState ? Oh : Ph;
        a = c(d, e);
        if (Jh) {
          f = 0;
          do {
            Jh = false;
            Kh = 0;
            if (25 <= f) throw Error(p(301));
            f += 1;
            O = N = null;
            b.updateQueue = null;
            Fh.current = Qh;
            a = c(d, e);
          } while (Jh);
        }
        Fh.current = Rh;
        b = null !== N && null !== N.next;
        Hh = 0;
        O = N = M = null;
        Ih = false;
        if (b) throw Error(p(300));
        return a;
      }
      function Sh() {
        var a = 0 !== Kh;
        Kh = 0;
        return a;
      }
      function Th() {
        var a = { memoizedState: null, baseState: null, baseQueue: null, queue: null, next: null };
        null === O ? M.memoizedState = O = a : O = O.next = a;
        return O;
      }
      function Uh() {
        if (null === N) {
          var a = M.alternate;
          a = null !== a ? a.memoizedState : null;
        } else a = N.next;
        var b = null === O ? M.memoizedState : O.next;
        if (null !== b) O = b, N = a;
        else {
          if (null === a) throw Error(p(310));
          N = a;
          a = { memoizedState: N.memoizedState, baseState: N.baseState, baseQueue: N.baseQueue, queue: N.queue, next: null };
          null === O ? M.memoizedState = O = a : O = O.next = a;
        }
        return O;
      }
      function Vh(a, b) {
        return "function" === typeof b ? b(a) : b;
      }
      function Wh(a) {
        var b = Uh(), c = b.queue;
        if (null === c) throw Error(p(311));
        c.lastRenderedReducer = a;
        var d = N, e = d.baseQueue, f = c.pending;
        if (null !== f) {
          if (null !== e) {
            var g = e.next;
            e.next = f.next;
            f.next = g;
          }
          d.baseQueue = e = f;
          c.pending = null;
        }
        if (null !== e) {
          f = e.next;
          d = d.baseState;
          var h = g = null, k = null, l = f;
          do {
            var m = l.lane;
            if ((Hh & m) === m) null !== k && (k = k.next = { lane: 0, action: l.action, hasEagerState: l.hasEagerState, eagerState: l.eagerState, next: null }), d = l.hasEagerState ? l.eagerState : a(d, l.action);
            else {
              var q = {
                lane: m,
                action: l.action,
                hasEagerState: l.hasEagerState,
                eagerState: l.eagerState,
                next: null
              };
              null === k ? (h = k = q, g = d) : k = k.next = q;
              M.lanes |= m;
              rh |= m;
            }
            l = l.next;
          } while (null !== l && l !== f);
          null === k ? g = d : k.next = h;
          He(d, b.memoizedState) || (dh = true);
          b.memoizedState = d;
          b.baseState = g;
          b.baseQueue = k;
          c.lastRenderedState = d;
        }
        a = c.interleaved;
        if (null !== a) {
          e = a;
          do
            f = e.lane, M.lanes |= f, rh |= f, e = e.next;
          while (e !== a);
        } else null === e && (c.lanes = 0);
        return [b.memoizedState, c.dispatch];
      }
      function Xh(a) {
        var b = Uh(), c = b.queue;
        if (null === c) throw Error(p(311));
        c.lastRenderedReducer = a;
        var d = c.dispatch, e = c.pending, f = b.memoizedState;
        if (null !== e) {
          c.pending = null;
          var g = e = e.next;
          do
            f = a(f, g.action), g = g.next;
          while (g !== e);
          He(f, b.memoizedState) || (dh = true);
          b.memoizedState = f;
          null === b.baseQueue && (b.baseState = f);
          c.lastRenderedState = f;
        }
        return [f, d];
      }
      function Yh() {
      }
      function Zh(a, b) {
        var c = M, d = Uh(), e = b(), f = !He(d.memoizedState, e);
        f && (d.memoizedState = e, dh = true);
        d = d.queue;
        $h(ai.bind(null, c, d, a), [a]);
        if (d.getSnapshot !== b || f || null !== O && O.memoizedState.tag & 1) {
          c.flags |= 2048;
          bi(9, ci.bind(null, c, d, e, b), void 0, null);
          if (null === Q) throw Error(p(349));
          0 !== (Hh & 30) || di(c, b, e);
        }
        return e;
      }
      function di(a, b, c) {
        a.flags |= 16384;
        a = { getSnapshot: b, value: c };
        b = M.updateQueue;
        null === b ? (b = { lastEffect: null, stores: null }, M.updateQueue = b, b.stores = [a]) : (c = b.stores, null === c ? b.stores = [a] : c.push(a));
      }
      function ci(a, b, c, d) {
        b.value = c;
        b.getSnapshot = d;
        ei(b) && fi(a);
      }
      function ai(a, b, c) {
        return c(function() {
          ei(b) && fi(a);
        });
      }
      function ei(a) {
        var b = a.getSnapshot;
        a = a.value;
        try {
          var c = b();
          return !He(a, c);
        } catch (d) {
          return true;
        }
      }
      function fi(a) {
        var b = ih(a, 1);
        null !== b && gi(b, a, 1, -1);
      }
      function hi(a) {
        var b = Th();
        "function" === typeof a && (a = a());
        b.memoizedState = b.baseState = a;
        a = { pending: null, interleaved: null, lanes: 0, dispatch: null, lastRenderedReducer: Vh, lastRenderedState: a };
        b.queue = a;
        a = a.dispatch = ii.bind(null, M, a);
        return [b.memoizedState, a];
      }
      function bi(a, b, c, d) {
        a = { tag: a, create: b, destroy: c, deps: d, next: null };
        b = M.updateQueue;
        null === b ? (b = { lastEffect: null, stores: null }, M.updateQueue = b, b.lastEffect = a.next = a) : (c = b.lastEffect, null === c ? b.lastEffect = a.next = a : (d = c.next, c.next = a, a.next = d, b.lastEffect = a));
        return a;
      }
      function ji() {
        return Uh().memoizedState;
      }
      function ki(a, b, c, d) {
        var e = Th();
        M.flags |= a;
        e.memoizedState = bi(1 | b, c, void 0, void 0 === d ? null : d);
      }
      function li(a, b, c, d) {
        var e = Uh();
        d = void 0 === d ? null : d;
        var f = void 0;
        if (null !== N) {
          var g = N.memoizedState;
          f = g.destroy;
          if (null !== d && Mh(d, g.deps)) {
            e.memoizedState = bi(b, c, f, d);
            return;
          }
        }
        M.flags |= a;
        e.memoizedState = bi(1 | b, c, f, d);
      }
      function mi(a, b) {
        return ki(8390656, 8, a, b);
      }
      function $h(a, b) {
        return li(2048, 8, a, b);
      }
      function ni(a, b) {
        return li(4, 2, a, b);
      }
      function oi(a, b) {
        return li(4, 4, a, b);
      }
      function pi(a, b) {
        if ("function" === typeof b) return a = a(), b(a), function() {
          b(null);
        };
        if (null !== b && void 0 !== b) return a = a(), b.current = a, function() {
          b.current = null;
        };
      }
      function qi(a, b, c) {
        c = null !== c && void 0 !== c ? c.concat([a]) : null;
        return li(4, 4, pi.bind(null, b, a), c);
      }
      function ri() {
      }
      function si(a, b) {
        var c = Uh();
        b = void 0 === b ? null : b;
        var d = c.memoizedState;
        if (null !== d && null !== b && Mh(b, d[1])) return d[0];
        c.memoizedState = [a, b];
        return a;
      }
      function ti(a, b) {
        var c = Uh();
        b = void 0 === b ? null : b;
        var d = c.memoizedState;
        if (null !== d && null !== b && Mh(b, d[1])) return d[0];
        a = a();
        c.memoizedState = [a, b];
        return a;
      }
      function ui(a, b, c) {
        if (0 === (Hh & 21)) return a.baseState && (a.baseState = false, dh = true), a.memoizedState = c;
        He(c, b) || (c = yc(), M.lanes |= c, rh |= c, a.baseState = true);
        return b;
      }
      function vi(a, b) {
        var c = C;
        C = 0 !== c && 4 > c ? c : 4;
        a(true);
        var d = Gh.transition;
        Gh.transition = {};
        try {
          a(false), b();
        } finally {
          C = c, Gh.transition = d;
        }
      }
      function wi() {
        return Uh().memoizedState;
      }
      function xi(a, b, c) {
        var d = yi(a);
        c = { lane: d, action: c, hasEagerState: false, eagerState: null, next: null };
        if (zi(a)) Ai(b, c);
        else if (c = hh(a, b, c, d), null !== c) {
          var e = R();
          gi(c, a, d, e);
          Bi(c, b, d);
        }
      }
      function ii(a, b, c) {
        var d = yi(a), e = { lane: d, action: c, hasEagerState: false, eagerState: null, next: null };
        if (zi(a)) Ai(b, e);
        else {
          var f = a.alternate;
          if (0 === a.lanes && (null === f || 0 === f.lanes) && (f = b.lastRenderedReducer, null !== f)) try {
            var g = b.lastRenderedState, h = f(g, c);
            e.hasEagerState = true;
            e.eagerState = h;
            if (He(h, g)) {
              var k = b.interleaved;
              null === k ? (e.next = e, gh(b)) : (e.next = k.next, k.next = e);
              b.interleaved = e;
              return;
            }
          } catch (l) {
          } finally {
          }
          c = hh(a, b, e, d);
          null !== c && (e = R(), gi(c, a, d, e), Bi(c, b, d));
        }
      }
      function zi(a) {
        var b = a.alternate;
        return a === M || null !== b && b === M;
      }
      function Ai(a, b) {
        Jh = Ih = true;
        var c = a.pending;
        null === c ? b.next = b : (b.next = c.next, c.next = b);
        a.pending = b;
      }
      function Bi(a, b, c) {
        if (0 !== (c & 4194240)) {
          var d = b.lanes;
          d &= a.pendingLanes;
          c |= d;
          b.lanes = c;
          Cc(a, c);
        }
      }
      var Rh = { readContext: eh, useCallback: P, useContext: P, useEffect: P, useImperativeHandle: P, useInsertionEffect: P, useLayoutEffect: P, useMemo: P, useReducer: P, useRef: P, useState: P, useDebugValue: P, useDeferredValue: P, useTransition: P, useMutableSource: P, useSyncExternalStore: P, useId: P, unstable_isNewReconciler: false };
      var Oh = { readContext: eh, useCallback: function(a, b) {
        Th().memoizedState = [a, void 0 === b ? null : b];
        return a;
      }, useContext: eh, useEffect: mi, useImperativeHandle: function(a, b, c) {
        c = null !== c && void 0 !== c ? c.concat([a]) : null;
        return ki(
          4194308,
          4,
          pi.bind(null, b, a),
          c
        );
      }, useLayoutEffect: function(a, b) {
        return ki(4194308, 4, a, b);
      }, useInsertionEffect: function(a, b) {
        return ki(4, 2, a, b);
      }, useMemo: function(a, b) {
        var c = Th();
        b = void 0 === b ? null : b;
        a = a();
        c.memoizedState = [a, b];
        return a;
      }, useReducer: function(a, b, c) {
        var d = Th();
        b = void 0 !== c ? c(b) : b;
        d.memoizedState = d.baseState = b;
        a = { pending: null, interleaved: null, lanes: 0, dispatch: null, lastRenderedReducer: a, lastRenderedState: b };
        d.queue = a;
        a = a.dispatch = xi.bind(null, M, a);
        return [d.memoizedState, a];
      }, useRef: function(a) {
        var b = Th();
        a = { current: a };
        return b.memoizedState = a;
      }, useState: hi, useDebugValue: ri, useDeferredValue: function(a) {
        return Th().memoizedState = a;
      }, useTransition: function() {
        var a = hi(false), b = a[0];
        a = vi.bind(null, a[1]);
        Th().memoizedState = a;
        return [b, a];
      }, useMutableSource: function() {
      }, useSyncExternalStore: function(a, b, c) {
        var d = M, e = Th();
        if (I) {
          if (void 0 === c) throw Error(p(407));
          c = c();
        } else {
          c = b();
          if (null === Q) throw Error(p(349));
          0 !== (Hh & 30) || di(d, b, c);
        }
        e.memoizedState = c;
        var f = { value: c, getSnapshot: b };
        e.queue = f;
        mi(ai.bind(
          null,
          d,
          f,
          a
        ), [a]);
        d.flags |= 2048;
        bi(9, ci.bind(null, d, f, c, b), void 0, null);
        return c;
      }, useId: function() {
        var a = Th(), b = Q.identifierPrefix;
        if (I) {
          var c = sg;
          var d = rg;
          c = (d & ~(1 << 32 - oc(d) - 1)).toString(32) + c;
          b = ":" + b + "R" + c;
          c = Kh++;
          0 < c && (b += "H" + c.toString(32));
          b += ":";
        } else c = Lh++, b = ":" + b + "r" + c.toString(32) + ":";
        return a.memoizedState = b;
      }, unstable_isNewReconciler: false };
      var Ph = {
        readContext: eh,
        useCallback: si,
        useContext: eh,
        useEffect: $h,
        useImperativeHandle: qi,
        useInsertionEffect: ni,
        useLayoutEffect: oi,
        useMemo: ti,
        useReducer: Wh,
        useRef: ji,
        useState: function() {
          return Wh(Vh);
        },
        useDebugValue: ri,
        useDeferredValue: function(a) {
          var b = Uh();
          return ui(b, N.memoizedState, a);
        },
        useTransition: function() {
          var a = Wh(Vh)[0], b = Uh().memoizedState;
          return [a, b];
        },
        useMutableSource: Yh,
        useSyncExternalStore: Zh,
        useId: wi,
        unstable_isNewReconciler: false
      };
      var Qh = { readContext: eh, useCallback: si, useContext: eh, useEffect: $h, useImperativeHandle: qi, useInsertionEffect: ni, useLayoutEffect: oi, useMemo: ti, useReducer: Xh, useRef: ji, useState: function() {
        return Xh(Vh);
      }, useDebugValue: ri, useDeferredValue: function(a) {
        var b = Uh();
        return null === N ? b.memoizedState = a : ui(b, N.memoizedState, a);
      }, useTransition: function() {
        var a = Xh(Vh)[0], b = Uh().memoizedState;
        return [a, b];
      }, useMutableSource: Yh, useSyncExternalStore: Zh, useId: wi, unstable_isNewReconciler: false };
      function Ci(a, b) {
        if (a && a.defaultProps) {
          b = A({}, b);
          a = a.defaultProps;
          for (var c in a) void 0 === b[c] && (b[c] = a[c]);
          return b;
        }
        return b;
      }
      function Di(a, b, c, d) {
        b = a.memoizedState;
        c = c(d, b);
        c = null === c || void 0 === c ? b : A({}, b, c);
        a.memoizedState = c;
        0 === a.lanes && (a.updateQueue.baseState = c);
      }
      var Ei = { isMounted: function(a) {
        return (a = a._reactInternals) ? Vb(a) === a : false;
      }, enqueueSetState: function(a, b, c) {
        a = a._reactInternals;
        var d = R(), e = yi(a), f = mh(d, e);
        f.payload = b;
        void 0 !== c && null !== c && (f.callback = c);
        b = nh(a, f, e);
        null !== b && (gi(b, a, e, d), oh(b, a, e));
      }, enqueueReplaceState: function(a, b, c) {
        a = a._reactInternals;
        var d = R(), e = yi(a), f = mh(d, e);
        f.tag = 1;
        f.payload = b;
        void 0 !== c && null !== c && (f.callback = c);
        b = nh(a, f, e);
        null !== b && (gi(b, a, e, d), oh(b, a, e));
      }, enqueueForceUpdate: function(a, b) {
        a = a._reactInternals;
        var c = R(), d = yi(a), e = mh(c, d);
        e.tag = 2;
        void 0 !== b && null !== b && (e.callback = b);
        b = nh(a, e, d);
        null !== b && (gi(b, a, d, c), oh(b, a, d));
      } };
      function Fi(a, b, c, d, e, f, g) {
        a = a.stateNode;
        return "function" === typeof a.shouldComponentUpdate ? a.shouldComponentUpdate(d, f, g) : b.prototype && b.prototype.isPureReactComponent ? !Ie(c, d) || !Ie(e, f) : true;
      }
      function Gi(a, b, c) {
        var d = false, e = Vf;
        var f = b.contextType;
        "object" === typeof f && null !== f ? f = eh(f) : (e = Zf(b) ? Xf : H.current, d = b.contextTypes, f = (d = null !== d && void 0 !== d) ? Yf(a, e) : Vf);
        b = new b(c, f);
        a.memoizedState = null !== b.state && void 0 !== b.state ? b.state : null;
        b.updater = Ei;
        a.stateNode = b;
        b._reactInternals = a;
        d && (a = a.stateNode, a.__reactInternalMemoizedUnmaskedChildContext = e, a.__reactInternalMemoizedMaskedChildContext = f);
        return b;
      }
      function Hi(a, b, c, d) {
        a = b.state;
        "function" === typeof b.componentWillReceiveProps && b.componentWillReceiveProps(c, d);
        "function" === typeof b.UNSAFE_componentWillReceiveProps && b.UNSAFE_componentWillReceiveProps(c, d);
        b.state !== a && Ei.enqueueReplaceState(b, b.state, null);
      }
      function Ii(a, b, c, d) {
        var e = a.stateNode;
        e.props = c;
        e.state = a.memoizedState;
        e.refs = {};
        kh(a);
        var f = b.contextType;
        "object" === typeof f && null !== f ? e.context = eh(f) : (f = Zf(b) ? Xf : H.current, e.context = Yf(a, f));
        e.state = a.memoizedState;
        f = b.getDerivedStateFromProps;
        "function" === typeof f && (Di(a, b, f, c), e.state = a.memoizedState);
        "function" === typeof b.getDerivedStateFromProps || "function" === typeof e.getSnapshotBeforeUpdate || "function" !== typeof e.UNSAFE_componentWillMount && "function" !== typeof e.componentWillMount || (b = e.state, "function" === typeof e.componentWillMount && e.componentWillMount(), "function" === typeof e.UNSAFE_componentWillMount && e.UNSAFE_componentWillMount(), b !== e.state && Ei.enqueueReplaceState(e, e.state, null), qh(a, c, e, d), e.state = a.memoizedState);
        "function" === typeof e.componentDidMount && (a.flags |= 4194308);
      }
      function Ji(a, b) {
        try {
          var c = "", d = b;
          do
            c += Pa(d), d = d.return;
          while (d);
          var e = c;
        } catch (f) {
          e = "\nError generating stack: " + f.message + "\n" + f.stack;
        }
        return { value: a, source: b, stack: e, digest: null };
      }
      function Ki(a, b, c) {
        return { value: a, source: null, stack: null != c ? c : null, digest: null != b ? b : null };
      }
      function Li(a, b) {
        try {
          console.error(b.value);
        } catch (c) {
          setTimeout(function() {
            throw c;
          });
        }
      }
      var Mi = "function" === typeof WeakMap ? WeakMap : Map;
      function Ni(a, b, c) {
        c = mh(-1, c);
        c.tag = 3;
        c.payload = { element: null };
        var d = b.value;
        c.callback = function() {
          Oi || (Oi = true, Pi = d);
          Li(a, b);
        };
        return c;
      }
      function Qi(a, b, c) {
        c = mh(-1, c);
        c.tag = 3;
        var d = a.type.getDerivedStateFromError;
        if ("function" === typeof d) {
          var e = b.value;
          c.payload = function() {
            return d(e);
          };
          c.callback = function() {
            Li(a, b);
          };
        }
        var f = a.stateNode;
        null !== f && "function" === typeof f.componentDidCatch && (c.callback = function() {
          Li(a, b);
          "function" !== typeof d && (null === Ri ? Ri = /* @__PURE__ */ new Set([this]) : Ri.add(this));
          var c2 = b.stack;
          this.componentDidCatch(b.value, { componentStack: null !== c2 ? c2 : "" });
        });
        return c;
      }
      function Si(a, b, c) {
        var d = a.pingCache;
        if (null === d) {
          d = a.pingCache = new Mi();
          var e = /* @__PURE__ */ new Set();
          d.set(b, e);
        } else e = d.get(b), void 0 === e && (e = /* @__PURE__ */ new Set(), d.set(b, e));
        e.has(c) || (e.add(c), a = Ti.bind(null, a, b, c), b.then(a, a));
      }
      function Ui(a) {
        do {
          var b;
          if (b = 13 === a.tag) b = a.memoizedState, b = null !== b ? null !== b.dehydrated ? true : false : true;
          if (b) return a;
          a = a.return;
        } while (null !== a);
        return null;
      }
      function Vi(a, b, c, d, e) {
        if (0 === (a.mode & 1)) return a === b ? a.flags |= 65536 : (a.flags |= 128, c.flags |= 131072, c.flags &= -52805, 1 === c.tag && (null === c.alternate ? c.tag = 17 : (b = mh(-1, 1), b.tag = 2, nh(c, b, 1))), c.lanes |= 1), a;
        a.flags |= 65536;
        a.lanes = e;
        return a;
      }
      var Wi = ua.ReactCurrentOwner;
      var dh = false;
      function Xi(a, b, c, d) {
        b.child = null === a ? Vg(b, null, c, d) : Ug(b, a.child, c, d);
      }
      function Yi(a, b, c, d, e) {
        c = c.render;
        var f = b.ref;
        ch(b, e);
        d = Nh(a, b, c, d, f, e);
        c = Sh();
        if (null !== a && !dh) return b.updateQueue = a.updateQueue, b.flags &= -2053, a.lanes &= ~e, Zi(a, b, e);
        I && c && vg(b);
        b.flags |= 1;
        Xi(a, b, d, e);
        return b.child;
      }
      function $i(a, b, c, d, e) {
        if (null === a) {
          var f = c.type;
          if ("function" === typeof f && !aj(f) && void 0 === f.defaultProps && null === c.compare && void 0 === c.defaultProps) return b.tag = 15, b.type = f, bj(a, b, f, d, e);
          a = Rg(c.type, null, d, b, b.mode, e);
          a.ref = b.ref;
          a.return = b;
          return b.child = a;
        }
        f = a.child;
        if (0 === (a.lanes & e)) {
          var g = f.memoizedProps;
          c = c.compare;
          c = null !== c ? c : Ie;
          if (c(g, d) && a.ref === b.ref) return Zi(a, b, e);
        }
        b.flags |= 1;
        a = Pg(f, d);
        a.ref = b.ref;
        a.return = b;
        return b.child = a;
      }
      function bj(a, b, c, d, e) {
        if (null !== a) {
          var f = a.memoizedProps;
          if (Ie(f, d) && a.ref === b.ref) if (dh = false, b.pendingProps = d = f, 0 !== (a.lanes & e)) 0 !== (a.flags & 131072) && (dh = true);
          else return b.lanes = a.lanes, Zi(a, b, e);
        }
        return cj(a, b, c, d, e);
      }
      function dj(a, b, c) {
        var d = b.pendingProps, e = d.children, f = null !== a ? a.memoizedState : null;
        if ("hidden" === d.mode) if (0 === (b.mode & 1)) b.memoizedState = { baseLanes: 0, cachePool: null, transitions: null }, G(ej, fj), fj |= c;
        else {
          if (0 === (c & 1073741824)) return a = null !== f ? f.baseLanes | c : c, b.lanes = b.childLanes = 1073741824, b.memoizedState = { baseLanes: a, cachePool: null, transitions: null }, b.updateQueue = null, G(ej, fj), fj |= a, null;
          b.memoizedState = { baseLanes: 0, cachePool: null, transitions: null };
          d = null !== f ? f.baseLanes : c;
          G(ej, fj);
          fj |= d;
        }
        else null !== f ? (d = f.baseLanes | c, b.memoizedState = null) : d = c, G(ej, fj), fj |= d;
        Xi(a, b, e, c);
        return b.child;
      }
      function gj(a, b) {
        var c = b.ref;
        if (null === a && null !== c || null !== a && a.ref !== c) b.flags |= 512, b.flags |= 2097152;
      }
      function cj(a, b, c, d, e) {
        var f = Zf(c) ? Xf : H.current;
        f = Yf(b, f);
        ch(b, e);
        c = Nh(a, b, c, d, f, e);
        d = Sh();
        if (null !== a && !dh) return b.updateQueue = a.updateQueue, b.flags &= -2053, a.lanes &= ~e, Zi(a, b, e);
        I && d && vg(b);
        b.flags |= 1;
        Xi(a, b, c, e);
        return b.child;
      }
      function hj(a, b, c, d, e) {
        if (Zf(c)) {
          var f = true;
          cg(b);
        } else f = false;
        ch(b, e);
        if (null === b.stateNode) ij(a, b), Gi(b, c, d), Ii(b, c, d, e), d = true;
        else if (null === a) {
          var g = b.stateNode, h = b.memoizedProps;
          g.props = h;
          var k = g.context, l = c.contextType;
          "object" === typeof l && null !== l ? l = eh(l) : (l = Zf(c) ? Xf : H.current, l = Yf(b, l));
          var m = c.getDerivedStateFromProps, q = "function" === typeof m || "function" === typeof g.getSnapshotBeforeUpdate;
          q || "function" !== typeof g.UNSAFE_componentWillReceiveProps && "function" !== typeof g.componentWillReceiveProps || (h !== d || k !== l) && Hi(b, g, d, l);
          jh = false;
          var r = b.memoizedState;
          g.state = r;
          qh(b, d, g, e);
          k = b.memoizedState;
          h !== d || r !== k || Wf.current || jh ? ("function" === typeof m && (Di(b, c, m, d), k = b.memoizedState), (h = jh || Fi(b, c, h, d, r, k, l)) ? (q || "function" !== typeof g.UNSAFE_componentWillMount && "function" !== typeof g.componentWillMount || ("function" === typeof g.componentWillMount && g.componentWillMount(), "function" === typeof g.UNSAFE_componentWillMount && g.UNSAFE_componentWillMount()), "function" === typeof g.componentDidMount && (b.flags |= 4194308)) : ("function" === typeof g.componentDidMount && (b.flags |= 4194308), b.memoizedProps = d, b.memoizedState = k), g.props = d, g.state = k, g.context = l, d = h) : ("function" === typeof g.componentDidMount && (b.flags |= 4194308), d = false);
        } else {
          g = b.stateNode;
          lh(a, b);
          h = b.memoizedProps;
          l = b.type === b.elementType ? h : Ci(b.type, h);
          g.props = l;
          q = b.pendingProps;
          r = g.context;
          k = c.contextType;
          "object" === typeof k && null !== k ? k = eh(k) : (k = Zf(c) ? Xf : H.current, k = Yf(b, k));
          var y = c.getDerivedStateFromProps;
          (m = "function" === typeof y || "function" === typeof g.getSnapshotBeforeUpdate) || "function" !== typeof g.UNSAFE_componentWillReceiveProps && "function" !== typeof g.componentWillReceiveProps || (h !== q || r !== k) && Hi(b, g, d, k);
          jh = false;
          r = b.memoizedState;
          g.state = r;
          qh(b, d, g, e);
          var n = b.memoizedState;
          h !== q || r !== n || Wf.current || jh ? ("function" === typeof y && (Di(b, c, y, d), n = b.memoizedState), (l = jh || Fi(b, c, l, d, r, n, k) || false) ? (m || "function" !== typeof g.UNSAFE_componentWillUpdate && "function" !== typeof g.componentWillUpdate || ("function" === typeof g.componentWillUpdate && g.componentWillUpdate(d, n, k), "function" === typeof g.UNSAFE_componentWillUpdate && g.UNSAFE_componentWillUpdate(d, n, k)), "function" === typeof g.componentDidUpdate && (b.flags |= 4), "function" === typeof g.getSnapshotBeforeUpdate && (b.flags |= 1024)) : ("function" !== typeof g.componentDidUpdate || h === a.memoizedProps && r === a.memoizedState || (b.flags |= 4), "function" !== typeof g.getSnapshotBeforeUpdate || h === a.memoizedProps && r === a.memoizedState || (b.flags |= 1024), b.memoizedProps = d, b.memoizedState = n), g.props = d, g.state = n, g.context = k, d = l) : ("function" !== typeof g.componentDidUpdate || h === a.memoizedProps && r === a.memoizedState || (b.flags |= 4), "function" !== typeof g.getSnapshotBeforeUpdate || h === a.memoizedProps && r === a.memoizedState || (b.flags |= 1024), d = false);
        }
        return jj(a, b, c, d, f, e);
      }
      function jj(a, b, c, d, e, f) {
        gj(a, b);
        var g = 0 !== (b.flags & 128);
        if (!d && !g) return e && dg(b, c, false), Zi(a, b, f);
        d = b.stateNode;
        Wi.current = b;
        var h = g && "function" !== typeof c.getDerivedStateFromError ? null : d.render();
        b.flags |= 1;
        null !== a && g ? (b.child = Ug(b, a.child, null, f), b.child = Ug(b, null, h, f)) : Xi(a, b, h, f);
        b.memoizedState = d.state;
        e && dg(b, c, true);
        return b.child;
      }
      function kj(a) {
        var b = a.stateNode;
        b.pendingContext ? ag(a, b.pendingContext, b.pendingContext !== b.context) : b.context && ag(a, b.context, false);
        yh(a, b.containerInfo);
      }
      function lj(a, b, c, d, e) {
        Ig();
        Jg(e);
        b.flags |= 256;
        Xi(a, b, c, d);
        return b.child;
      }
      var mj = { dehydrated: null, treeContext: null, retryLane: 0 };
      function nj(a) {
        return { baseLanes: a, cachePool: null, transitions: null };
      }
      function oj(a, b, c) {
        var d = b.pendingProps, e = L.current, f = false, g = 0 !== (b.flags & 128), h;
        (h = g) || (h = null !== a && null === a.memoizedState ? false : 0 !== (e & 2));
        if (h) f = true, b.flags &= -129;
        else if (null === a || null !== a.memoizedState) e |= 1;
        G(L, e & 1);
        if (null === a) {
          Eg(b);
          a = b.memoizedState;
          if (null !== a && (a = a.dehydrated, null !== a)) return 0 === (b.mode & 1) ? b.lanes = 1 : "$!" === a.data ? b.lanes = 8 : b.lanes = 1073741824, null;
          g = d.children;
          a = d.fallback;
          return f ? (d = b.mode, f = b.child, g = { mode: "hidden", children: g }, 0 === (d & 1) && null !== f ? (f.childLanes = 0, f.pendingProps = g) : f = pj(g, d, 0, null), a = Tg(a, d, c, null), f.return = b, a.return = b, f.sibling = a, b.child = f, b.child.memoizedState = nj(c), b.memoizedState = mj, a) : qj(b, g);
        }
        e = a.memoizedState;
        if (null !== e && (h = e.dehydrated, null !== h)) return rj(a, b, g, d, h, e, c);
        if (f) {
          f = d.fallback;
          g = b.mode;
          e = a.child;
          h = e.sibling;
          var k = { mode: "hidden", children: d.children };
          0 === (g & 1) && b.child !== e ? (d = b.child, d.childLanes = 0, d.pendingProps = k, b.deletions = null) : (d = Pg(e, k), d.subtreeFlags = e.subtreeFlags & 14680064);
          null !== h ? f = Pg(h, f) : (f = Tg(f, g, c, null), f.flags |= 2);
          f.return = b;
          d.return = b;
          d.sibling = f;
          b.child = d;
          d = f;
          f = b.child;
          g = a.child.memoizedState;
          g = null === g ? nj(c) : { baseLanes: g.baseLanes | c, cachePool: null, transitions: g.transitions };
          f.memoizedState = g;
          f.childLanes = a.childLanes & ~c;
          b.memoizedState = mj;
          return d;
        }
        f = a.child;
        a = f.sibling;
        d = Pg(f, { mode: "visible", children: d.children });
        0 === (b.mode & 1) && (d.lanes = c);
        d.return = b;
        d.sibling = null;
        null !== a && (c = b.deletions, null === c ? (b.deletions = [a], b.flags |= 16) : c.push(a));
        b.child = d;
        b.memoizedState = null;
        return d;
      }
      function qj(a, b) {
        b = pj({ mode: "visible", children: b }, a.mode, 0, null);
        b.return = a;
        return a.child = b;
      }
      function sj(a, b, c, d) {
        null !== d && Jg(d);
        Ug(b, a.child, null, c);
        a = qj(b, b.pendingProps.children);
        a.flags |= 2;
        b.memoizedState = null;
        return a;
      }
      function rj(a, b, c, d, e, f, g) {
        if (c) {
          if (b.flags & 256) return b.flags &= -257, d = Ki(Error(p(422))), sj(a, b, g, d);
          if (null !== b.memoizedState) return b.child = a.child, b.flags |= 128, null;
          f = d.fallback;
          e = b.mode;
          d = pj({ mode: "visible", children: d.children }, e, 0, null);
          f = Tg(f, e, g, null);
          f.flags |= 2;
          d.return = b;
          f.return = b;
          d.sibling = f;
          b.child = d;
          0 !== (b.mode & 1) && Ug(b, a.child, null, g);
          b.child.memoizedState = nj(g);
          b.memoizedState = mj;
          return f;
        }
        if (0 === (b.mode & 1)) return sj(a, b, g, null);
        if ("$!" === e.data) {
          d = e.nextSibling && e.nextSibling.dataset;
          if (d) var h = d.dgst;
          d = h;
          f = Error(p(419));
          d = Ki(f, d, void 0);
          return sj(a, b, g, d);
        }
        h = 0 !== (g & a.childLanes);
        if (dh || h) {
          d = Q;
          if (null !== d) {
            switch (g & -g) {
              case 4:
                e = 2;
                break;
              case 16:
                e = 8;
                break;
              case 64:
              case 128:
              case 256:
              case 512:
              case 1024:
              case 2048:
              case 4096:
              case 8192:
              case 16384:
              case 32768:
              case 65536:
              case 131072:
              case 262144:
              case 524288:
              case 1048576:
              case 2097152:
              case 4194304:
              case 8388608:
              case 16777216:
              case 33554432:
              case 67108864:
                e = 32;
                break;
              case 536870912:
                e = 268435456;
                break;
              default:
                e = 0;
            }
            e = 0 !== (e & (d.suspendedLanes | g)) ? 0 : e;
            0 !== e && e !== f.retryLane && (f.retryLane = e, ih(a, e), gi(d, a, e, -1));
          }
          tj();
          d = Ki(Error(p(421)));
          return sj(a, b, g, d);
        }
        if ("$?" === e.data) return b.flags |= 128, b.child = a.child, b = uj.bind(null, a), e._reactRetry = b, null;
        a = f.treeContext;
        yg = Lf(e.nextSibling);
        xg = b;
        I = true;
        zg = null;
        null !== a && (og[pg++] = rg, og[pg++] = sg, og[pg++] = qg, rg = a.id, sg = a.overflow, qg = b);
        b = qj(b, d.children);
        b.flags |= 4096;
        return b;
      }
      function vj(a, b, c) {
        a.lanes |= b;
        var d = a.alternate;
        null !== d && (d.lanes |= b);
        bh(a.return, b, c);
      }
      function wj(a, b, c, d, e) {
        var f = a.memoizedState;
        null === f ? a.memoizedState = { isBackwards: b, rendering: null, renderingStartTime: 0, last: d, tail: c, tailMode: e } : (f.isBackwards = b, f.rendering = null, f.renderingStartTime = 0, f.last = d, f.tail = c, f.tailMode = e);
      }
      function xj(a, b, c) {
        var d = b.pendingProps, e = d.revealOrder, f = d.tail;
        Xi(a, b, d.children, c);
        d = L.current;
        if (0 !== (d & 2)) d = d & 1 | 2, b.flags |= 128;
        else {
          if (null !== a && 0 !== (a.flags & 128)) a: for (a = b.child; null !== a; ) {
            if (13 === a.tag) null !== a.memoizedState && vj(a, c, b);
            else if (19 === a.tag) vj(a, c, b);
            else if (null !== a.child) {
              a.child.return = a;
              a = a.child;
              continue;
            }
            if (a === b) break a;
            for (; null === a.sibling; ) {
              if (null === a.return || a.return === b) break a;
              a = a.return;
            }
            a.sibling.return = a.return;
            a = a.sibling;
          }
          d &= 1;
        }
        G(L, d);
        if (0 === (b.mode & 1)) b.memoizedState = null;
        else switch (e) {
          case "forwards":
            c = b.child;
            for (e = null; null !== c; ) a = c.alternate, null !== a && null === Ch(a) && (e = c), c = c.sibling;
            c = e;
            null === c ? (e = b.child, b.child = null) : (e = c.sibling, c.sibling = null);
            wj(b, false, e, c, f);
            break;
          case "backwards":
            c = null;
            e = b.child;
            for (b.child = null; null !== e; ) {
              a = e.alternate;
              if (null !== a && null === Ch(a)) {
                b.child = e;
                break;
              }
              a = e.sibling;
              e.sibling = c;
              c = e;
              e = a;
            }
            wj(b, true, c, null, f);
            break;
          case "together":
            wj(b, false, null, null, void 0);
            break;
          default:
            b.memoizedState = null;
        }
        return b.child;
      }
      function ij(a, b) {
        0 === (b.mode & 1) && null !== a && (a.alternate = null, b.alternate = null, b.flags |= 2);
      }
      function Zi(a, b, c) {
        null !== a && (b.dependencies = a.dependencies);
        rh |= b.lanes;
        if (0 === (c & b.childLanes)) return null;
        if (null !== a && b.child !== a.child) throw Error(p(153));
        if (null !== b.child) {
          a = b.child;
          c = Pg(a, a.pendingProps);
          b.child = c;
          for (c.return = b; null !== a.sibling; ) a = a.sibling, c = c.sibling = Pg(a, a.pendingProps), c.return = b;
          c.sibling = null;
        }
        return b.child;
      }
      function yj(a, b, c) {
        switch (b.tag) {
          case 3:
            kj(b);
            Ig();
            break;
          case 5:
            Ah(b);
            break;
          case 1:
            Zf(b.type) && cg(b);
            break;
          case 4:
            yh(b, b.stateNode.containerInfo);
            break;
          case 10:
            var d = b.type._context, e = b.memoizedProps.value;
            G(Wg, d._currentValue);
            d._currentValue = e;
            break;
          case 13:
            d = b.memoizedState;
            if (null !== d) {
              if (null !== d.dehydrated) return G(L, L.current & 1), b.flags |= 128, null;
              if (0 !== (c & b.child.childLanes)) return oj(a, b, c);
              G(L, L.current & 1);
              a = Zi(a, b, c);
              return null !== a ? a.sibling : null;
            }
            G(L, L.current & 1);
            break;
          case 19:
            d = 0 !== (c & b.childLanes);
            if (0 !== (a.flags & 128)) {
              if (d) return xj(a, b, c);
              b.flags |= 128;
            }
            e = b.memoizedState;
            null !== e && (e.rendering = null, e.tail = null, e.lastEffect = null);
            G(L, L.current);
            if (d) break;
            else return null;
          case 22:
          case 23:
            return b.lanes = 0, dj(a, b, c);
        }
        return Zi(a, b, c);
      }
      var zj;
      var Aj;
      var Bj;
      var Cj;
      zj = function(a, b) {
        for (var c = b.child; null !== c; ) {
          if (5 === c.tag || 6 === c.tag) a.appendChild(c.stateNode);
          else if (4 !== c.tag && null !== c.child) {
            c.child.return = c;
            c = c.child;
            continue;
          }
          if (c === b) break;
          for (; null === c.sibling; ) {
            if (null === c.return || c.return === b) return;
            c = c.return;
          }
          c.sibling.return = c.return;
          c = c.sibling;
        }
      };
      Aj = function() {
      };
      Bj = function(a, b, c, d) {
        var e = a.memoizedProps;
        if (e !== d) {
          a = b.stateNode;
          xh(uh.current);
          var f = null;
          switch (c) {
            case "input":
              e = Ya(a, e);
              d = Ya(a, d);
              f = [];
              break;
            case "select":
              e = A({}, e, { value: void 0 });
              d = A({}, d, { value: void 0 });
              f = [];
              break;
            case "textarea":
              e = gb(a, e);
              d = gb(a, d);
              f = [];
              break;
            default:
              "function" !== typeof e.onClick && "function" === typeof d.onClick && (a.onclick = Bf);
          }
          ub(c, d);
          var g;
          c = null;
          for (l in e) if (!d.hasOwnProperty(l) && e.hasOwnProperty(l) && null != e[l]) if ("style" === l) {
            var h = e[l];
            for (g in h) h.hasOwnProperty(g) && (c || (c = {}), c[g] = "");
          } else "dangerouslySetInnerHTML" !== l && "children" !== l && "suppressContentEditableWarning" !== l && "suppressHydrationWarning" !== l && "autoFocus" !== l && (ea.hasOwnProperty(l) ? f || (f = []) : (f = f || []).push(l, null));
          for (l in d) {
            var k = d[l];
            h = null != e ? e[l] : void 0;
            if (d.hasOwnProperty(l) && k !== h && (null != k || null != h)) if ("style" === l) if (h) {
              for (g in h) !h.hasOwnProperty(g) || k && k.hasOwnProperty(g) || (c || (c = {}), c[g] = "");
              for (g in k) k.hasOwnProperty(g) && h[g] !== k[g] && (c || (c = {}), c[g] = k[g]);
            } else c || (f || (f = []), f.push(
              l,
              c
            )), c = k;
            else "dangerouslySetInnerHTML" === l ? (k = k ? k.__html : void 0, h = h ? h.__html : void 0, null != k && h !== k && (f = f || []).push(l, k)) : "children" === l ? "string" !== typeof k && "number" !== typeof k || (f = f || []).push(l, "" + k) : "suppressContentEditableWarning" !== l && "suppressHydrationWarning" !== l && (ea.hasOwnProperty(l) ? (null != k && "onScroll" === l && D("scroll", a), f || h === k || (f = [])) : (f = f || []).push(l, k));
          }
          c && (f = f || []).push("style", c);
          var l = f;
          if (b.updateQueue = l) b.flags |= 4;
        }
      };
      Cj = function(a, b, c, d) {
        c !== d && (b.flags |= 4);
      };
      function Dj(a, b) {
        if (!I) switch (a.tailMode) {
          case "hidden":
            b = a.tail;
            for (var c = null; null !== b; ) null !== b.alternate && (c = b), b = b.sibling;
            null === c ? a.tail = null : c.sibling = null;
            break;
          case "collapsed":
            c = a.tail;
            for (var d = null; null !== c; ) null !== c.alternate && (d = c), c = c.sibling;
            null === d ? b || null === a.tail ? a.tail = null : a.tail.sibling = null : d.sibling = null;
        }
      }
      function S(a) {
        var b = null !== a.alternate && a.alternate.child === a.child, c = 0, d = 0;
        if (b) for (var e = a.child; null !== e; ) c |= e.lanes | e.childLanes, d |= e.subtreeFlags & 14680064, d |= e.flags & 14680064, e.return = a, e = e.sibling;
        else for (e = a.child; null !== e; ) c |= e.lanes | e.childLanes, d |= e.subtreeFlags, d |= e.flags, e.return = a, e = e.sibling;
        a.subtreeFlags |= d;
        a.childLanes = c;
        return b;
      }
      function Ej(a, b, c) {
        var d = b.pendingProps;
        wg(b);
        switch (b.tag) {
          case 2:
          case 16:
          case 15:
          case 0:
          case 11:
          case 7:
          case 8:
          case 12:
          case 9:
          case 14:
            return S(b), null;
          case 1:
            return Zf(b.type) && $f(), S(b), null;
          case 3:
            d = b.stateNode;
            zh();
            E(Wf);
            E(H);
            Eh();
            d.pendingContext && (d.context = d.pendingContext, d.pendingContext = null);
            if (null === a || null === a.child) Gg(b) ? b.flags |= 4 : null === a || a.memoizedState.isDehydrated && 0 === (b.flags & 256) || (b.flags |= 1024, null !== zg && (Fj(zg), zg = null));
            Aj(a, b);
            S(b);
            return null;
          case 5:
            Bh(b);
            var e = xh(wh.current);
            c = b.type;
            if (null !== a && null != b.stateNode) Bj(a, b, c, d, e), a.ref !== b.ref && (b.flags |= 512, b.flags |= 2097152);
            else {
              if (!d) {
                if (null === b.stateNode) throw Error(p(166));
                S(b);
                return null;
              }
              a = xh(uh.current);
              if (Gg(b)) {
                d = b.stateNode;
                c = b.type;
                var f = b.memoizedProps;
                d[Of] = b;
                d[Pf] = f;
                a = 0 !== (b.mode & 1);
                switch (c) {
                  case "dialog":
                    D("cancel", d);
                    D("close", d);
                    break;
                  case "iframe":
                  case "object":
                  case "embed":
                    D("load", d);
                    break;
                  case "video":
                  case "audio":
                    for (e = 0; e < lf.length; e++) D(lf[e], d);
                    break;
                  case "source":
                    D("error", d);
                    break;
                  case "img":
                  case "image":
                  case "link":
                    D(
                      "error",
                      d
                    );
                    D("load", d);
                    break;
                  case "details":
                    D("toggle", d);
                    break;
                  case "input":
                    Za(d, f);
                    D("invalid", d);
                    break;
                  case "select":
                    d._wrapperState = { wasMultiple: !!f.multiple };
                    D("invalid", d);
                    break;
                  case "textarea":
                    hb(d, f), D("invalid", d);
                }
                ub(c, f);
                e = null;
                for (var g in f) if (f.hasOwnProperty(g)) {
                  var h = f[g];
                  "children" === g ? "string" === typeof h ? d.textContent !== h && (true !== f.suppressHydrationWarning && Af(d.textContent, h, a), e = ["children", h]) : "number" === typeof h && d.textContent !== "" + h && (true !== f.suppressHydrationWarning && Af(
                    d.textContent,
                    h,
                    a
                  ), e = ["children", "" + h]) : ea.hasOwnProperty(g) && null != h && "onScroll" === g && D("scroll", d);
                }
                switch (c) {
                  case "input":
                    Va(d);
                    db(d, f, true);
                    break;
                  case "textarea":
                    Va(d);
                    jb(d);
                    break;
                  case "select":
                  case "option":
                    break;
                  default:
                    "function" === typeof f.onClick && (d.onclick = Bf);
                }
                d = e;
                b.updateQueue = d;
                null !== d && (b.flags |= 4);
              } else {
                g = 9 === e.nodeType ? e : e.ownerDocument;
                "http://www.w3.org/1999/xhtml" === a && (a = kb(c));
                "http://www.w3.org/1999/xhtml" === a ? "script" === c ? (a = g.createElement("div"), a.innerHTML = "<script><\/script>", a = a.removeChild(a.firstChild)) : "string" === typeof d.is ? a = g.createElement(c, { is: d.is }) : (a = g.createElement(c), "select" === c && (g = a, d.multiple ? g.multiple = true : d.size && (g.size = d.size))) : a = g.createElementNS(a, c);
                a[Of] = b;
                a[Pf] = d;
                zj(a, b, false, false);
                b.stateNode = a;
                a: {
                  g = vb(c, d);
                  switch (c) {
                    case "dialog":
                      D("cancel", a);
                      D("close", a);
                      e = d;
                      break;
                    case "iframe":
                    case "object":
                    case "embed":
                      D("load", a);
                      e = d;
                      break;
                    case "video":
                    case "audio":
                      for (e = 0; e < lf.length; e++) D(lf[e], a);
                      e = d;
                      break;
                    case "source":
                      D("error", a);
                      e = d;
                      break;
                    case "img":
                    case "image":
                    case "link":
                      D(
                        "error",
                        a
                      );
                      D("load", a);
                      e = d;
                      break;
                    case "details":
                      D("toggle", a);
                      e = d;
                      break;
                    case "input":
                      Za(a, d);
                      e = Ya(a, d);
                      D("invalid", a);
                      break;
                    case "option":
                      e = d;
                      break;
                    case "select":
                      a._wrapperState = { wasMultiple: !!d.multiple };
                      e = A({}, d, { value: void 0 });
                      D("invalid", a);
                      break;
                    case "textarea":
                      hb(a, d);
                      e = gb(a, d);
                      D("invalid", a);
                      break;
                    default:
                      e = d;
                  }
                  ub(c, e);
                  h = e;
                  for (f in h) if (h.hasOwnProperty(f)) {
                    var k = h[f];
                    "style" === f ? sb(a, k) : "dangerouslySetInnerHTML" === f ? (k = k ? k.__html : void 0, null != k && nb(a, k)) : "children" === f ? "string" === typeof k ? ("textarea" !== c || "" !== k) && ob(a, k) : "number" === typeof k && ob(a, "" + k) : "suppressContentEditableWarning" !== f && "suppressHydrationWarning" !== f && "autoFocus" !== f && (ea.hasOwnProperty(f) ? null != k && "onScroll" === f && D("scroll", a) : null != k && ta(a, f, k, g));
                  }
                  switch (c) {
                    case "input":
                      Va(a);
                      db(a, d, false);
                      break;
                    case "textarea":
                      Va(a);
                      jb(a);
                      break;
                    case "option":
                      null != d.value && a.setAttribute("value", "" + Sa(d.value));
                      break;
                    case "select":
                      a.multiple = !!d.multiple;
                      f = d.value;
                      null != f ? fb(a, !!d.multiple, f, false) : null != d.defaultValue && fb(
                        a,
                        !!d.multiple,
                        d.defaultValue,
                        true
                      );
                      break;
                    default:
                      "function" === typeof e.onClick && (a.onclick = Bf);
                  }
                  switch (c) {
                    case "button":
                    case "input":
                    case "select":
                    case "textarea":
                      d = !!d.autoFocus;
                      break a;
                    case "img":
                      d = true;
                      break a;
                    default:
                      d = false;
                  }
                }
                d && (b.flags |= 4);
              }
              null !== b.ref && (b.flags |= 512, b.flags |= 2097152);
            }
            S(b);
            return null;
          case 6:
            if (a && null != b.stateNode) Cj(a, b, a.memoizedProps, d);
            else {
              if ("string" !== typeof d && null === b.stateNode) throw Error(p(166));
              c = xh(wh.current);
              xh(uh.current);
              if (Gg(b)) {
                d = b.stateNode;
                c = b.memoizedProps;
                d[Of] = b;
                if (f = d.nodeValue !== c) {
                  if (a = xg, null !== a) switch (a.tag) {
                    case 3:
                      Af(d.nodeValue, c, 0 !== (a.mode & 1));
                      break;
                    case 5:
                      true !== a.memoizedProps.suppressHydrationWarning && Af(d.nodeValue, c, 0 !== (a.mode & 1));
                  }
                }
                f && (b.flags |= 4);
              } else d = (9 === c.nodeType ? c : c.ownerDocument).createTextNode(d), d[Of] = b, b.stateNode = d;
            }
            S(b);
            return null;
          case 13:
            E(L);
            d = b.memoizedState;
            if (null === a || null !== a.memoizedState && null !== a.memoizedState.dehydrated) {
              if (I && null !== yg && 0 !== (b.mode & 1) && 0 === (b.flags & 128)) Hg(), Ig(), b.flags |= 98560, f = false;
              else if (f = Gg(b), null !== d && null !== d.dehydrated) {
                if (null === a) {
                  if (!f) throw Error(p(318));
                  f = b.memoizedState;
                  f = null !== f ? f.dehydrated : null;
                  if (!f) throw Error(p(317));
                  f[Of] = b;
                } else Ig(), 0 === (b.flags & 128) && (b.memoizedState = null), b.flags |= 4;
                S(b);
                f = false;
              } else null !== zg && (Fj(zg), zg = null), f = true;
              if (!f) return b.flags & 65536 ? b : null;
            }
            if (0 !== (b.flags & 128)) return b.lanes = c, b;
            d = null !== d;
            d !== (null !== a && null !== a.memoizedState) && d && (b.child.flags |= 8192, 0 !== (b.mode & 1) && (null === a || 0 !== (L.current & 1) ? 0 === T && (T = 3) : tj()));
            null !== b.updateQueue && (b.flags |= 4);
            S(b);
            return null;
          case 4:
            return zh(), Aj(a, b), null === a && sf(b.stateNode.containerInfo), S(b), null;
          case 10:
            return ah(b.type._context), S(b), null;
          case 17:
            return Zf(b.type) && $f(), S(b), null;
          case 19:
            E(L);
            f = b.memoizedState;
            if (null === f) return S(b), null;
            d = 0 !== (b.flags & 128);
            g = f.rendering;
            if (null === g) if (d) Dj(f, false);
            else {
              if (0 !== T || null !== a && 0 !== (a.flags & 128)) for (a = b.child; null !== a; ) {
                g = Ch(a);
                if (null !== g) {
                  b.flags |= 128;
                  Dj(f, false);
                  d = g.updateQueue;
                  null !== d && (b.updateQueue = d, b.flags |= 4);
                  b.subtreeFlags = 0;
                  d = c;
                  for (c = b.child; null !== c; ) f = c, a = d, f.flags &= 14680066, g = f.alternate, null === g ? (f.childLanes = 0, f.lanes = a, f.child = null, f.subtreeFlags = 0, f.memoizedProps = null, f.memoizedState = null, f.updateQueue = null, f.dependencies = null, f.stateNode = null) : (f.childLanes = g.childLanes, f.lanes = g.lanes, f.child = g.child, f.subtreeFlags = 0, f.deletions = null, f.memoizedProps = g.memoizedProps, f.memoizedState = g.memoizedState, f.updateQueue = g.updateQueue, f.type = g.type, a = g.dependencies, f.dependencies = null === a ? null : { lanes: a.lanes, firstContext: a.firstContext }), c = c.sibling;
                  G(L, L.current & 1 | 2);
                  return b.child;
                }
                a = a.sibling;
              }
              null !== f.tail && B() > Gj && (b.flags |= 128, d = true, Dj(f, false), b.lanes = 4194304);
            }
            else {
              if (!d) if (a = Ch(g), null !== a) {
                if (b.flags |= 128, d = true, c = a.updateQueue, null !== c && (b.updateQueue = c, b.flags |= 4), Dj(f, true), null === f.tail && "hidden" === f.tailMode && !g.alternate && !I) return S(b), null;
              } else 2 * B() - f.renderingStartTime > Gj && 1073741824 !== c && (b.flags |= 128, d = true, Dj(f, false), b.lanes = 4194304);
              f.isBackwards ? (g.sibling = b.child, b.child = g) : (c = f.last, null !== c ? c.sibling = g : b.child = g, f.last = g);
            }
            if (null !== f.tail) return b = f.tail, f.rendering = b, f.tail = b.sibling, f.renderingStartTime = B(), b.sibling = null, c = L.current, G(L, d ? c & 1 | 2 : c & 1), b;
            S(b);
            return null;
          case 22:
          case 23:
            return Hj(), d = null !== b.memoizedState, null !== a && null !== a.memoizedState !== d && (b.flags |= 8192), d && 0 !== (b.mode & 1) ? 0 !== (fj & 1073741824) && (S(b), b.subtreeFlags & 6 && (b.flags |= 8192)) : S(b), null;
          case 24:
            return null;
          case 25:
            return null;
        }
        throw Error(p(156, b.tag));
      }
      function Ij(a, b) {
        wg(b);
        switch (b.tag) {
          case 1:
            return Zf(b.type) && $f(), a = b.flags, a & 65536 ? (b.flags = a & -65537 | 128, b) : null;
          case 3:
            return zh(), E(Wf), E(H), Eh(), a = b.flags, 0 !== (a & 65536) && 0 === (a & 128) ? (b.flags = a & -65537 | 128, b) : null;
          case 5:
            return Bh(b), null;
          case 13:
            E(L);
            a = b.memoizedState;
            if (null !== a && null !== a.dehydrated) {
              if (null === b.alternate) throw Error(p(340));
              Ig();
            }
            a = b.flags;
            return a & 65536 ? (b.flags = a & -65537 | 128, b) : null;
          case 19:
            return E(L), null;
          case 4:
            return zh(), null;
          case 10:
            return ah(b.type._context), null;
          case 22:
          case 23:
            return Hj(), null;
          case 24:
            return null;
          default:
            return null;
        }
      }
      var Jj = false;
      var U = false;
      var Kj = "function" === typeof WeakSet ? WeakSet : Set;
      var V = null;
      function Lj(a, b) {
        var c = a.ref;
        if (null !== c) if ("function" === typeof c) try {
          c(null);
        } catch (d) {
          W(a, b, d);
        }
        else c.current = null;
      }
      function Mj(a, b, c) {
        try {
          c();
        } catch (d) {
          W(a, b, d);
        }
      }
      var Nj = false;
      function Oj(a, b) {
        Cf = dd;
        a = Me();
        if (Ne(a)) {
          if ("selectionStart" in a) var c = { start: a.selectionStart, end: a.selectionEnd };
          else a: {
            c = (c = a.ownerDocument) && c.defaultView || window;
            var d = c.getSelection && c.getSelection();
            if (d && 0 !== d.rangeCount) {
              c = d.anchorNode;
              var e = d.anchorOffset, f = d.focusNode;
              d = d.focusOffset;
              try {
                c.nodeType, f.nodeType;
              } catch (F) {
                c = null;
                break a;
              }
              var g = 0, h = -1, k = -1, l = 0, m = 0, q = a, r = null;
              b: for (; ; ) {
                for (var y; ; ) {
                  q !== c || 0 !== e && 3 !== q.nodeType || (h = g + e);
                  q !== f || 0 !== d && 3 !== q.nodeType || (k = g + d);
                  3 === q.nodeType && (g += q.nodeValue.length);
                  if (null === (y = q.firstChild)) break;
                  r = q;
                  q = y;
                }
                for (; ; ) {
                  if (q === a) break b;
                  r === c && ++l === e && (h = g);
                  r === f && ++m === d && (k = g);
                  if (null !== (y = q.nextSibling)) break;
                  q = r;
                  r = q.parentNode;
                }
                q = y;
              }
              c = -1 === h || -1 === k ? null : { start: h, end: k };
            } else c = null;
          }
          c = c || { start: 0, end: 0 };
        } else c = null;
        Df = { focusedElem: a, selectionRange: c };
        dd = false;
        for (V = b; null !== V; ) if (b = V, a = b.child, 0 !== (b.subtreeFlags & 1028) && null !== a) a.return = b, V = a;
        else for (; null !== V; ) {
          b = V;
          try {
            var n = b.alternate;
            if (0 !== (b.flags & 1024)) switch (b.tag) {
              case 0:
              case 11:
              case 15:
                break;
              case 1:
                if (null !== n) {
                  var t = n.memoizedProps, J = n.memoizedState, x = b.stateNode, w = x.getSnapshotBeforeUpdate(b.elementType === b.type ? t : Ci(b.type, t), J);
                  x.__reactInternalSnapshotBeforeUpdate = w;
                }
                break;
              case 3:
                var u = b.stateNode.containerInfo;
                1 === u.nodeType ? u.textContent = "" : 9 === u.nodeType && u.documentElement && u.removeChild(u.documentElement);
                break;
              case 5:
              case 6:
              case 4:
              case 17:
                break;
              default:
                throw Error(p(163));
            }
          } catch (F) {
            W(b, b.return, F);
          }
          a = b.sibling;
          if (null !== a) {
            a.return = b.return;
            V = a;
            break;
          }
          V = b.return;
        }
        n = Nj;
        Nj = false;
        return n;
      }
      function Pj(a, b, c) {
        var d = b.updateQueue;
        d = null !== d ? d.lastEffect : null;
        if (null !== d) {
          var e = d = d.next;
          do {
            if ((e.tag & a) === a) {
              var f = e.destroy;
              e.destroy = void 0;
              void 0 !== f && Mj(b, c, f);
            }
            e = e.next;
          } while (e !== d);
        }
      }
      function Qj(a, b) {
        b = b.updateQueue;
        b = null !== b ? b.lastEffect : null;
        if (null !== b) {
          var c = b = b.next;
          do {
            if ((c.tag & a) === a) {
              var d = c.create;
              c.destroy = d();
            }
            c = c.next;
          } while (c !== b);
        }
      }
      function Rj(a) {
        var b = a.ref;
        if (null !== b) {
          var c = a.stateNode;
          switch (a.tag) {
            case 5:
              a = c;
              break;
            default:
              a = c;
          }
          "function" === typeof b ? b(a) : b.current = a;
        }
      }
      function Sj(a) {
        var b = a.alternate;
        null !== b && (a.alternate = null, Sj(b));
        a.child = null;
        a.deletions = null;
        a.sibling = null;
        5 === a.tag && (b = a.stateNode, null !== b && (delete b[Of], delete b[Pf], delete b[of], delete b[Qf], delete b[Rf]));
        a.stateNode = null;
        a.return = null;
        a.dependencies = null;
        a.memoizedProps = null;
        a.memoizedState = null;
        a.pendingProps = null;
        a.stateNode = null;
        a.updateQueue = null;
      }
      function Tj(a) {
        return 5 === a.tag || 3 === a.tag || 4 === a.tag;
      }
      function Uj(a) {
        a: for (; ; ) {
          for (; null === a.sibling; ) {
            if (null === a.return || Tj(a.return)) return null;
            a = a.return;
          }
          a.sibling.return = a.return;
          for (a = a.sibling; 5 !== a.tag && 6 !== a.tag && 18 !== a.tag; ) {
            if (a.flags & 2) continue a;
            if (null === a.child || 4 === a.tag) continue a;
            else a.child.return = a, a = a.child;
          }
          if (!(a.flags & 2)) return a.stateNode;
        }
      }
      function Vj(a, b, c) {
        var d = a.tag;
        if (5 === d || 6 === d) a = a.stateNode, b ? 8 === c.nodeType ? c.parentNode.insertBefore(a, b) : c.insertBefore(a, b) : (8 === c.nodeType ? (b = c.parentNode, b.insertBefore(a, c)) : (b = c, b.appendChild(a)), c = c._reactRootContainer, null !== c && void 0 !== c || null !== b.onclick || (b.onclick = Bf));
        else if (4 !== d && (a = a.child, null !== a)) for (Vj(a, b, c), a = a.sibling; null !== a; ) Vj(a, b, c), a = a.sibling;
      }
      function Wj(a, b, c) {
        var d = a.tag;
        if (5 === d || 6 === d) a = a.stateNode, b ? c.insertBefore(a, b) : c.appendChild(a);
        else if (4 !== d && (a = a.child, null !== a)) for (Wj(a, b, c), a = a.sibling; null !== a; ) Wj(a, b, c), a = a.sibling;
      }
      var X = null;
      var Xj = false;
      function Yj(a, b, c) {
        for (c = c.child; null !== c; ) Zj(a, b, c), c = c.sibling;
      }
      function Zj(a, b, c) {
        if (lc && "function" === typeof lc.onCommitFiberUnmount) try {
          lc.onCommitFiberUnmount(kc, c);
        } catch (h) {
        }
        switch (c.tag) {
          case 5:
            U || Lj(c, b);
          case 6:
            var d = X, e = Xj;
            X = null;
            Yj(a, b, c);
            X = d;
            Xj = e;
            null !== X && (Xj ? (a = X, c = c.stateNode, 8 === a.nodeType ? a.parentNode.removeChild(c) : a.removeChild(c)) : X.removeChild(c.stateNode));
            break;
          case 18:
            null !== X && (Xj ? (a = X, c = c.stateNode, 8 === a.nodeType ? Kf(a.parentNode, c) : 1 === a.nodeType && Kf(a, c), bd(a)) : Kf(X, c.stateNode));
            break;
          case 4:
            d = X;
            e = Xj;
            X = c.stateNode.containerInfo;
            Xj = true;
            Yj(a, b, c);
            X = d;
            Xj = e;
            break;
          case 0:
          case 11:
          case 14:
          case 15:
            if (!U && (d = c.updateQueue, null !== d && (d = d.lastEffect, null !== d))) {
              e = d = d.next;
              do {
                var f = e, g = f.destroy;
                f = f.tag;
                void 0 !== g && (0 !== (f & 2) ? Mj(c, b, g) : 0 !== (f & 4) && Mj(c, b, g));
                e = e.next;
              } while (e !== d);
            }
            Yj(a, b, c);
            break;
          case 1:
            if (!U && (Lj(c, b), d = c.stateNode, "function" === typeof d.componentWillUnmount)) try {
              d.props = c.memoizedProps, d.state = c.memoizedState, d.componentWillUnmount();
            } catch (h) {
              W(c, b, h);
            }
            Yj(a, b, c);
            break;
          case 21:
            Yj(a, b, c);
            break;
          case 22:
            c.mode & 1 ? (U = (d = U) || null !== c.memoizedState, Yj(a, b, c), U = d) : Yj(a, b, c);
            break;
          default:
            Yj(a, b, c);
        }
      }
      function ak(a) {
        var b = a.updateQueue;
        if (null !== b) {
          a.updateQueue = null;
          var c = a.stateNode;
          null === c && (c = a.stateNode = new Kj());
          b.forEach(function(b2) {
            var d = bk.bind(null, a, b2);
            c.has(b2) || (c.add(b2), b2.then(d, d));
          });
        }
      }
      function ck(a, b) {
        var c = b.deletions;
        if (null !== c) for (var d = 0; d < c.length; d++) {
          var e = c[d];
          try {
            var f = a, g = b, h = g;
            a: for (; null !== h; ) {
              switch (h.tag) {
                case 5:
                  X = h.stateNode;
                  Xj = false;
                  break a;
                case 3:
                  X = h.stateNode.containerInfo;
                  Xj = true;
                  break a;
                case 4:
                  X = h.stateNode.containerInfo;
                  Xj = true;
                  break a;
              }
              h = h.return;
            }
            if (null === X) throw Error(p(160));
            Zj(f, g, e);
            X = null;
            Xj = false;
            var k = e.alternate;
            null !== k && (k.return = null);
            e.return = null;
          } catch (l) {
            W(e, b, l);
          }
        }
        if (b.subtreeFlags & 12854) for (b = b.child; null !== b; ) dk(b, a), b = b.sibling;
      }
      function dk(a, b) {
        var c = a.alternate, d = a.flags;
        switch (a.tag) {
          case 0:
          case 11:
          case 14:
          case 15:
            ck(b, a);
            ek(a);
            if (d & 4) {
              try {
                Pj(3, a, a.return), Qj(3, a);
              } catch (t) {
                W(a, a.return, t);
              }
              try {
                Pj(5, a, a.return);
              } catch (t) {
                W(a, a.return, t);
              }
            }
            break;
          case 1:
            ck(b, a);
            ek(a);
            d & 512 && null !== c && Lj(c, c.return);
            break;
          case 5:
            ck(b, a);
            ek(a);
            d & 512 && null !== c && Lj(c, c.return);
            if (a.flags & 32) {
              var e = a.stateNode;
              try {
                ob(e, "");
              } catch (t) {
                W(a, a.return, t);
              }
            }
            if (d & 4 && (e = a.stateNode, null != e)) {
              var f = a.memoizedProps, g = null !== c ? c.memoizedProps : f, h = a.type, k = a.updateQueue;
              a.updateQueue = null;
              if (null !== k) try {
                "input" === h && "radio" === f.type && null != f.name && ab(e, f);
                vb(h, g);
                var l = vb(h, f);
                for (g = 0; g < k.length; g += 2) {
                  var m = k[g], q = k[g + 1];
                  "style" === m ? sb(e, q) : "dangerouslySetInnerHTML" === m ? nb(e, q) : "children" === m ? ob(e, q) : ta(e, m, q, l);
                }
                switch (h) {
                  case "input":
                    bb(e, f);
                    break;
                  case "textarea":
                    ib(e, f);
                    break;
                  case "select":
                    var r = e._wrapperState.wasMultiple;
                    e._wrapperState.wasMultiple = !!f.multiple;
                    var y = f.value;
                    null != y ? fb(e, !!f.multiple, y, false) : r !== !!f.multiple && (null != f.defaultValue ? fb(
                      e,
                      !!f.multiple,
                      f.defaultValue,
                      true
                    ) : fb(e, !!f.multiple, f.multiple ? [] : "", false));
                }
                e[Pf] = f;
              } catch (t) {
                W(a, a.return, t);
              }
            }
            break;
          case 6:
            ck(b, a);
            ek(a);
            if (d & 4) {
              if (null === a.stateNode) throw Error(p(162));
              e = a.stateNode;
              f = a.memoizedProps;
              try {
                e.nodeValue = f;
              } catch (t) {
                W(a, a.return, t);
              }
            }
            break;
          case 3:
            ck(b, a);
            ek(a);
            if (d & 4 && null !== c && c.memoizedState.isDehydrated) try {
              bd(b.containerInfo);
            } catch (t) {
              W(a, a.return, t);
            }
            break;
          case 4:
            ck(b, a);
            ek(a);
            break;
          case 13:
            ck(b, a);
            ek(a);
            e = a.child;
            e.flags & 8192 && (f = null !== e.memoizedState, e.stateNode.isHidden = f, !f || null !== e.alternate && null !== e.alternate.memoizedState || (fk = B()));
            d & 4 && ak(a);
            break;
          case 22:
            m = null !== c && null !== c.memoizedState;
            a.mode & 1 ? (U = (l = U) || m, ck(b, a), U = l) : ck(b, a);
            ek(a);
            if (d & 8192) {
              l = null !== a.memoizedState;
              if ((a.stateNode.isHidden = l) && !m && 0 !== (a.mode & 1)) for (V = a, m = a.child; null !== m; ) {
                for (q = V = m; null !== V; ) {
                  r = V;
                  y = r.child;
                  switch (r.tag) {
                    case 0:
                    case 11:
                    case 14:
                    case 15:
                      Pj(4, r, r.return);
                      break;
                    case 1:
                      Lj(r, r.return);
                      var n = r.stateNode;
                      if ("function" === typeof n.componentWillUnmount) {
                        d = r;
                        c = r.return;
                        try {
                          b = d, n.props = b.memoizedProps, n.state = b.memoizedState, n.componentWillUnmount();
                        } catch (t) {
                          W(d, c, t);
                        }
                      }
                      break;
                    case 5:
                      Lj(r, r.return);
                      break;
                    case 22:
                      if (null !== r.memoizedState) {
                        gk(q);
                        continue;
                      }
                  }
                  null !== y ? (y.return = r, V = y) : gk(q);
                }
                m = m.sibling;
              }
              a: for (m = null, q = a; ; ) {
                if (5 === q.tag) {
                  if (null === m) {
                    m = q;
                    try {
                      e = q.stateNode, l ? (f = e.style, "function" === typeof f.setProperty ? f.setProperty("display", "none", "important") : f.display = "none") : (h = q.stateNode, k = q.memoizedProps.style, g = void 0 !== k && null !== k && k.hasOwnProperty("display") ? k.display : null, h.style.display = rb("display", g));
                    } catch (t) {
                      W(a, a.return, t);
                    }
                  }
                } else if (6 === q.tag) {
                  if (null === m) try {
                    q.stateNode.nodeValue = l ? "" : q.memoizedProps;
                  } catch (t) {
                    W(a, a.return, t);
                  }
                } else if ((22 !== q.tag && 23 !== q.tag || null === q.memoizedState || q === a) && null !== q.child) {
                  q.child.return = q;
                  q = q.child;
                  continue;
                }
                if (q === a) break a;
                for (; null === q.sibling; ) {
                  if (null === q.return || q.return === a) break a;
                  m === q && (m = null);
                  q = q.return;
                }
                m === q && (m = null);
                q.sibling.return = q.return;
                q = q.sibling;
              }
            }
            break;
          case 19:
            ck(b, a);
            ek(a);
            d & 4 && ak(a);
            break;
          case 21:
            break;
          default:
            ck(
              b,
              a
            ), ek(a);
        }
      }
      function ek(a) {
        var b = a.flags;
        if (b & 2) {
          try {
            a: {
              for (var c = a.return; null !== c; ) {
                if (Tj(c)) {
                  var d = c;
                  break a;
                }
                c = c.return;
              }
              throw Error(p(160));
            }
            switch (d.tag) {
              case 5:
                var e = d.stateNode;
                d.flags & 32 && (ob(e, ""), d.flags &= -33);
                var f = Uj(a);
                Wj(a, f, e);
                break;
              case 3:
              case 4:
                var g = d.stateNode.containerInfo, h = Uj(a);
                Vj(a, h, g);
                break;
              default:
                throw Error(p(161));
            }
          } catch (k) {
            W(a, a.return, k);
          }
          a.flags &= -3;
        }
        b & 4096 && (a.flags &= -4097);
      }
      function hk(a, b, c) {
        V = a;
        ik(a, b, c);
      }
      function ik(a, b, c) {
        for (var d = 0 !== (a.mode & 1); null !== V; ) {
          var e = V, f = e.child;
          if (22 === e.tag && d) {
            var g = null !== e.memoizedState || Jj;
            if (!g) {
              var h = e.alternate, k = null !== h && null !== h.memoizedState || U;
              h = Jj;
              var l = U;
              Jj = g;
              if ((U = k) && !l) for (V = e; null !== V; ) g = V, k = g.child, 22 === g.tag && null !== g.memoizedState ? jk(e) : null !== k ? (k.return = g, V = k) : jk(e);
              for (; null !== f; ) V = f, ik(f, b, c), f = f.sibling;
              V = e;
              Jj = h;
              U = l;
            }
            kk(a, b, c);
          } else 0 !== (e.subtreeFlags & 8772) && null !== f ? (f.return = e, V = f) : kk(a, b, c);
        }
      }
      function kk(a) {
        for (; null !== V; ) {
          var b = V;
          if (0 !== (b.flags & 8772)) {
            var c = b.alternate;
            try {
              if (0 !== (b.flags & 8772)) switch (b.tag) {
                case 0:
                case 11:
                case 15:
                  U || Qj(5, b);
                  break;
                case 1:
                  var d = b.stateNode;
                  if (b.flags & 4 && !U) if (null === c) d.componentDidMount();
                  else {
                    var e = b.elementType === b.type ? c.memoizedProps : Ci(b.type, c.memoizedProps);
                    d.componentDidUpdate(e, c.memoizedState, d.__reactInternalSnapshotBeforeUpdate);
                  }
                  var f = b.updateQueue;
                  null !== f && sh(b, f, d);
                  break;
                case 3:
                  var g = b.updateQueue;
                  if (null !== g) {
                    c = null;
                    if (null !== b.child) switch (b.child.tag) {
                      case 5:
                        c = b.child.stateNode;
                        break;
                      case 1:
                        c = b.child.stateNode;
                    }
                    sh(b, g, c);
                  }
                  break;
                case 5:
                  var h = b.stateNode;
                  if (null === c && b.flags & 4) {
                    c = h;
                    var k = b.memoizedProps;
                    switch (b.type) {
                      case "button":
                      case "input":
                      case "select":
                      case "textarea":
                        k.autoFocus && c.focus();
                        break;
                      case "img":
                        k.src && (c.src = k.src);
                    }
                  }
                  break;
                case 6:
                  break;
                case 4:
                  break;
                case 12:
                  break;
                case 13:
                  if (null === b.memoizedState) {
                    var l = b.alternate;
                    if (null !== l) {
                      var m = l.memoizedState;
                      if (null !== m) {
                        var q = m.dehydrated;
                        null !== q && bd(q);
                      }
                    }
                  }
                  break;
                case 19:
                case 17:
                case 21:
                case 22:
                case 23:
                case 25:
                  break;
                default:
                  throw Error(p(163));
              }
              U || b.flags & 512 && Rj(b);
            } catch (r) {
              W(b, b.return, r);
            }
          }
          if (b === a) {
            V = null;
            break;
          }
          c = b.sibling;
          if (null !== c) {
            c.return = b.return;
            V = c;
            break;
          }
          V = b.return;
        }
      }
      function gk(a) {
        for (; null !== V; ) {
          var b = V;
          if (b === a) {
            V = null;
            break;
          }
          var c = b.sibling;
          if (null !== c) {
            c.return = b.return;
            V = c;
            break;
          }
          V = b.return;
        }
      }
      function jk(a) {
        for (; null !== V; ) {
          var b = V;
          try {
            switch (b.tag) {
              case 0:
              case 11:
              case 15:
                var c = b.return;
                try {
                  Qj(4, b);
                } catch (k) {
                  W(b, c, k);
                }
                break;
              case 1:
                var d = b.stateNode;
                if ("function" === typeof d.componentDidMount) {
                  var e = b.return;
                  try {
                    d.componentDidMount();
                  } catch (k) {
                    W(b, e, k);
                  }
                }
                var f = b.return;
                try {
                  Rj(b);
                } catch (k) {
                  W(b, f, k);
                }
                break;
              case 5:
                var g = b.return;
                try {
                  Rj(b);
                } catch (k) {
                  W(b, g, k);
                }
            }
          } catch (k) {
            W(b, b.return, k);
          }
          if (b === a) {
            V = null;
            break;
          }
          var h = b.sibling;
          if (null !== h) {
            h.return = b.return;
            V = h;
            break;
          }
          V = b.return;
        }
      }
      var lk = Math.ceil;
      var mk = ua.ReactCurrentDispatcher;
      var nk = ua.ReactCurrentOwner;
      var ok = ua.ReactCurrentBatchConfig;
      var K = 0;
      var Q = null;
      var Y = null;
      var Z = 0;
      var fj = 0;
      var ej = Uf(0);
      var T = 0;
      var pk = null;
      var rh = 0;
      var qk = 0;
      var rk = 0;
      var sk = null;
      var tk = null;
      var fk = 0;
      var Gj = Infinity;
      var uk = null;
      var Oi = false;
      var Pi = null;
      var Ri = null;
      var vk = false;
      var wk = null;
      var xk = 0;
      var yk = 0;
      var zk = null;
      var Ak = -1;
      var Bk = 0;
      function R() {
        return 0 !== (K & 6) ? B() : -1 !== Ak ? Ak : Ak = B();
      }
      function yi(a) {
        if (0 === (a.mode & 1)) return 1;
        if (0 !== (K & 2) && 0 !== Z) return Z & -Z;
        if (null !== Kg.transition) return 0 === Bk && (Bk = yc()), Bk;
        a = C;
        if (0 !== a) return a;
        a = window.event;
        a = void 0 === a ? 16 : jd(a.type);
        return a;
      }
      function gi(a, b, c, d) {
        if (50 < yk) throw yk = 0, zk = null, Error(p(185));
        Ac(a, c, d);
        if (0 === (K & 2) || a !== Q) a === Q && (0 === (K & 2) && (qk |= c), 4 === T && Ck(a, Z)), Dk(a, d), 1 === c && 0 === K && 0 === (b.mode & 1) && (Gj = B() + 500, fg && jg());
      }
      function Dk(a, b) {
        var c = a.callbackNode;
        wc(a, b);
        var d = uc(a, a === Q ? Z : 0);
        if (0 === d) null !== c && bc(c), a.callbackNode = null, a.callbackPriority = 0;
        else if (b = d & -d, a.callbackPriority !== b) {
          null != c && bc(c);
          if (1 === b) 0 === a.tag ? ig(Ek.bind(null, a)) : hg(Ek.bind(null, a)), Jf(function() {
            0 === (K & 6) && jg();
          }), c = null;
          else {
            switch (Dc(d)) {
              case 1:
                c = fc;
                break;
              case 4:
                c = gc;
                break;
              case 16:
                c = hc;
                break;
              case 536870912:
                c = jc;
                break;
              default:
                c = hc;
            }
            c = Fk(c, Gk.bind(null, a));
          }
          a.callbackPriority = b;
          a.callbackNode = c;
        }
      }
      function Gk(a, b) {
        Ak = -1;
        Bk = 0;
        if (0 !== (K & 6)) throw Error(p(327));
        var c = a.callbackNode;
        if (Hk() && a.callbackNode !== c) return null;
        var d = uc(a, a === Q ? Z : 0);
        if (0 === d) return null;
        if (0 !== (d & 30) || 0 !== (d & a.expiredLanes) || b) b = Ik(a, d);
        else {
          b = d;
          var e = K;
          K |= 2;
          var f = Jk();
          if (Q !== a || Z !== b) uk = null, Gj = B() + 500, Kk(a, b);
          do
            try {
              Lk();
              break;
            } catch (h) {
              Mk(a, h);
            }
          while (1);
          $g();
          mk.current = f;
          K = e;
          null !== Y ? b = 0 : (Q = null, Z = 0, b = T);
        }
        if (0 !== b) {
          2 === b && (e = xc(a), 0 !== e && (d = e, b = Nk(a, e)));
          if (1 === b) throw c = pk, Kk(a, 0), Ck(a, d), Dk(a, B()), c;
          if (6 === b) Ck(a, d);
          else {
            e = a.current.alternate;
            if (0 === (d & 30) && !Ok(e) && (b = Ik(a, d), 2 === b && (f = xc(a), 0 !== f && (d = f, b = Nk(a, f))), 1 === b)) throw c = pk, Kk(a, 0), Ck(a, d), Dk(a, B()), c;
            a.finishedWork = e;
            a.finishedLanes = d;
            switch (b) {
              case 0:
              case 1:
                throw Error(p(345));
              case 2:
                Pk(a, tk, uk);
                break;
              case 3:
                Ck(a, d);
                if ((d & 130023424) === d && (b = fk + 500 - B(), 10 < b)) {
                  if (0 !== uc(a, 0)) break;
                  e = a.suspendedLanes;
                  if ((e & d) !== d) {
                    R();
                    a.pingedLanes |= a.suspendedLanes & e;
                    break;
                  }
                  a.timeoutHandle = Ff(Pk.bind(null, a, tk, uk), b);
                  break;
                }
                Pk(a, tk, uk);
                break;
              case 4:
                Ck(a, d);
                if ((d & 4194240) === d) break;
                b = a.eventTimes;
                for (e = -1; 0 < d; ) {
                  var g = 31 - oc(d);
                  f = 1 << g;
                  g = b[g];
                  g > e && (e = g);
                  d &= ~f;
                }
                d = e;
                d = B() - d;
                d = (120 > d ? 120 : 480 > d ? 480 : 1080 > d ? 1080 : 1920 > d ? 1920 : 3e3 > d ? 3e3 : 4320 > d ? 4320 : 1960 * lk(d / 1960)) - d;
                if (10 < d) {
                  a.timeoutHandle = Ff(Pk.bind(null, a, tk, uk), d);
                  break;
                }
                Pk(a, tk, uk);
                break;
              case 5:
                Pk(a, tk, uk);
                break;
              default:
                throw Error(p(329));
            }
          }
        }
        Dk(a, B());
        return a.callbackNode === c ? Gk.bind(null, a) : null;
      }
      function Nk(a, b) {
        var c = sk;
        a.current.memoizedState.isDehydrated && (Kk(a, b).flags |= 256);
        a = Ik(a, b);
        2 !== a && (b = tk, tk = c, null !== b && Fj(b));
        return a;
      }
      function Fj(a) {
        null === tk ? tk = a : tk.push.apply(tk, a);
      }
      function Ok(a) {
        for (var b = a; ; ) {
          if (b.flags & 16384) {
            var c = b.updateQueue;
            if (null !== c && (c = c.stores, null !== c)) for (var d = 0; d < c.length; d++) {
              var e = c[d], f = e.getSnapshot;
              e = e.value;
              try {
                if (!He(f(), e)) return false;
              } catch (g) {
                return false;
              }
            }
          }
          c = b.child;
          if (b.subtreeFlags & 16384 && null !== c) c.return = b, b = c;
          else {
            if (b === a) break;
            for (; null === b.sibling; ) {
              if (null === b.return || b.return === a) return true;
              b = b.return;
            }
            b.sibling.return = b.return;
            b = b.sibling;
          }
        }
        return true;
      }
      function Ck(a, b) {
        b &= ~rk;
        b &= ~qk;
        a.suspendedLanes |= b;
        a.pingedLanes &= ~b;
        for (a = a.expirationTimes; 0 < b; ) {
          var c = 31 - oc(b), d = 1 << c;
          a[c] = -1;
          b &= ~d;
        }
      }
      function Ek(a) {
        if (0 !== (K & 6)) throw Error(p(327));
        Hk();
        var b = uc(a, 0);
        if (0 === (b & 1)) return Dk(a, B()), null;
        var c = Ik(a, b);
        if (0 !== a.tag && 2 === c) {
          var d = xc(a);
          0 !== d && (b = d, c = Nk(a, d));
        }
        if (1 === c) throw c = pk, Kk(a, 0), Ck(a, b), Dk(a, B()), c;
        if (6 === c) throw Error(p(345));
        a.finishedWork = a.current.alternate;
        a.finishedLanes = b;
        Pk(a, tk, uk);
        Dk(a, B());
        return null;
      }
      function Qk(a, b) {
        var c = K;
        K |= 1;
        try {
          return a(b);
        } finally {
          K = c, 0 === K && (Gj = B() + 500, fg && jg());
        }
      }
      function Rk(a) {
        null !== wk && 0 === wk.tag && 0 === (K & 6) && Hk();
        var b = K;
        K |= 1;
        var c = ok.transition, d = C;
        try {
          if (ok.transition = null, C = 1, a) return a();
        } finally {
          C = d, ok.transition = c, K = b, 0 === (K & 6) && jg();
        }
      }
      function Hj() {
        fj = ej.current;
        E(ej);
      }
      function Kk(a, b) {
        a.finishedWork = null;
        a.finishedLanes = 0;
        var c = a.timeoutHandle;
        -1 !== c && (a.timeoutHandle = -1, Gf(c));
        if (null !== Y) for (c = Y.return; null !== c; ) {
          var d = c;
          wg(d);
          switch (d.tag) {
            case 1:
              d = d.type.childContextTypes;
              null !== d && void 0 !== d && $f();
              break;
            case 3:
              zh();
              E(Wf);
              E(H);
              Eh();
              break;
            case 5:
              Bh(d);
              break;
            case 4:
              zh();
              break;
            case 13:
              E(L);
              break;
            case 19:
              E(L);
              break;
            case 10:
              ah(d.type._context);
              break;
            case 22:
            case 23:
              Hj();
          }
          c = c.return;
        }
        Q = a;
        Y = a = Pg(a.current, null);
        Z = fj = b;
        T = 0;
        pk = null;
        rk = qk = rh = 0;
        tk = sk = null;
        if (null !== fh) {
          for (b = 0; b < fh.length; b++) if (c = fh[b], d = c.interleaved, null !== d) {
            c.interleaved = null;
            var e = d.next, f = c.pending;
            if (null !== f) {
              var g = f.next;
              f.next = e;
              d.next = g;
            }
            c.pending = d;
          }
          fh = null;
        }
        return a;
      }
      function Mk(a, b) {
        do {
          var c = Y;
          try {
            $g();
            Fh.current = Rh;
            if (Ih) {
              for (var d = M.memoizedState; null !== d; ) {
                var e = d.queue;
                null !== e && (e.pending = null);
                d = d.next;
              }
              Ih = false;
            }
            Hh = 0;
            O = N = M = null;
            Jh = false;
            Kh = 0;
            nk.current = null;
            if (null === c || null === c.return) {
              T = 1;
              pk = b;
              Y = null;
              break;
            }
            a: {
              var f = a, g = c.return, h = c, k = b;
              b = Z;
              h.flags |= 32768;
              if (null !== k && "object" === typeof k && "function" === typeof k.then) {
                var l = k, m = h, q = m.tag;
                if (0 === (m.mode & 1) && (0 === q || 11 === q || 15 === q)) {
                  var r = m.alternate;
                  r ? (m.updateQueue = r.updateQueue, m.memoizedState = r.memoizedState, m.lanes = r.lanes) : (m.updateQueue = null, m.memoizedState = null);
                }
                var y = Ui(g);
                if (null !== y) {
                  y.flags &= -257;
                  Vi(y, g, h, f, b);
                  y.mode & 1 && Si(f, l, b);
                  b = y;
                  k = l;
                  var n = b.updateQueue;
                  if (null === n) {
                    var t = /* @__PURE__ */ new Set();
                    t.add(k);
                    b.updateQueue = t;
                  } else n.add(k);
                  break a;
                } else {
                  if (0 === (b & 1)) {
                    Si(f, l, b);
                    tj();
                    break a;
                  }
                  k = Error(p(426));
                }
              } else if (I && h.mode & 1) {
                var J = Ui(g);
                if (null !== J) {
                  0 === (J.flags & 65536) && (J.flags |= 256);
                  Vi(J, g, h, f, b);
                  Jg(Ji(k, h));
                  break a;
                }
              }
              f = k = Ji(k, h);
              4 !== T && (T = 2);
              null === sk ? sk = [f] : sk.push(f);
              f = g;
              do {
                switch (f.tag) {
                  case 3:
                    f.flags |= 65536;
                    b &= -b;
                    f.lanes |= b;
                    var x = Ni(f, k, b);
                    ph(f, x);
                    break a;
                  case 1:
                    h = k;
                    var w = f.type, u = f.stateNode;
                    if (0 === (f.flags & 128) && ("function" === typeof w.getDerivedStateFromError || null !== u && "function" === typeof u.componentDidCatch && (null === Ri || !Ri.has(u)))) {
                      f.flags |= 65536;
                      b &= -b;
                      f.lanes |= b;
                      var F = Qi(f, h, b);
                      ph(f, F);
                      break a;
                    }
                }
                f = f.return;
              } while (null !== f);
            }
            Sk(c);
          } catch (na) {
            b = na;
            Y === c && null !== c && (Y = c = c.return);
            continue;
          }
          break;
        } while (1);
      }
      function Jk() {
        var a = mk.current;
        mk.current = Rh;
        return null === a ? Rh : a;
      }
      function tj() {
        if (0 === T || 3 === T || 2 === T) T = 4;
        null === Q || 0 === (rh & 268435455) && 0 === (qk & 268435455) || Ck(Q, Z);
      }
      function Ik(a, b) {
        var c = K;
        K |= 2;
        var d = Jk();
        if (Q !== a || Z !== b) uk = null, Kk(a, b);
        do
          try {
            Tk();
            break;
          } catch (e) {
            Mk(a, e);
          }
        while (1);
        $g();
        K = c;
        mk.current = d;
        if (null !== Y) throw Error(p(261));
        Q = null;
        Z = 0;
        return T;
      }
      function Tk() {
        for (; null !== Y; ) Uk(Y);
      }
      function Lk() {
        for (; null !== Y && !cc(); ) Uk(Y);
      }
      function Uk(a) {
        var b = Vk(a.alternate, a, fj);
        a.memoizedProps = a.pendingProps;
        null === b ? Sk(a) : Y = b;
        nk.current = null;
      }
      function Sk(a) {
        var b = a;
        do {
          var c = b.alternate;
          a = b.return;
          if (0 === (b.flags & 32768)) {
            if (c = Ej(c, b, fj), null !== c) {
              Y = c;
              return;
            }
          } else {
            c = Ij(c, b);
            if (null !== c) {
              c.flags &= 32767;
              Y = c;
              return;
            }
            if (null !== a) a.flags |= 32768, a.subtreeFlags = 0, a.deletions = null;
            else {
              T = 6;
              Y = null;
              return;
            }
          }
          b = b.sibling;
          if (null !== b) {
            Y = b;
            return;
          }
          Y = b = a;
        } while (null !== b);
        0 === T && (T = 5);
      }
      function Pk(a, b, c) {
        var d = C, e = ok.transition;
        try {
          ok.transition = null, C = 1, Wk(a, b, c, d);
        } finally {
          ok.transition = e, C = d;
        }
        return null;
      }
      function Wk(a, b, c, d) {
        do
          Hk();
        while (null !== wk);
        if (0 !== (K & 6)) throw Error(p(327));
        c = a.finishedWork;
        var e = a.finishedLanes;
        if (null === c) return null;
        a.finishedWork = null;
        a.finishedLanes = 0;
        if (c === a.current) throw Error(p(177));
        a.callbackNode = null;
        a.callbackPriority = 0;
        var f = c.lanes | c.childLanes;
        Bc(a, f);
        a === Q && (Y = Q = null, Z = 0);
        0 === (c.subtreeFlags & 2064) && 0 === (c.flags & 2064) || vk || (vk = true, Fk(hc, function() {
          Hk();
          return null;
        }));
        f = 0 !== (c.flags & 15990);
        if (0 !== (c.subtreeFlags & 15990) || f) {
          f = ok.transition;
          ok.transition = null;
          var g = C;
          C = 1;
          var h = K;
          K |= 4;
          nk.current = null;
          Oj(a, c);
          dk(c, a);
          Oe(Df);
          dd = !!Cf;
          Df = Cf = null;
          a.current = c;
          hk(c, a, e);
          dc();
          K = h;
          C = g;
          ok.transition = f;
        } else a.current = c;
        vk && (vk = false, wk = a, xk = e);
        f = a.pendingLanes;
        0 === f && (Ri = null);
        mc(c.stateNode, d);
        Dk(a, B());
        if (null !== b) for (d = a.onRecoverableError, c = 0; c < b.length; c++) e = b[c], d(e.value, { componentStack: e.stack, digest: e.digest });
        if (Oi) throw Oi = false, a = Pi, Pi = null, a;
        0 !== (xk & 1) && 0 !== a.tag && Hk();
        f = a.pendingLanes;
        0 !== (f & 1) ? a === zk ? yk++ : (yk = 0, zk = a) : yk = 0;
        jg();
        return null;
      }
      function Hk() {
        if (null !== wk) {
          var a = Dc(xk), b = ok.transition, c = C;
          try {
            ok.transition = null;
            C = 16 > a ? 16 : a;
            if (null === wk) var d = false;
            else {
              a = wk;
              wk = null;
              xk = 0;
              if (0 !== (K & 6)) throw Error(p(331));
              var e = K;
              K |= 4;
              for (V = a.current; null !== V; ) {
                var f = V, g = f.child;
                if (0 !== (V.flags & 16)) {
                  var h = f.deletions;
                  if (null !== h) {
                    for (var k = 0; k < h.length; k++) {
                      var l = h[k];
                      for (V = l; null !== V; ) {
                        var m = V;
                        switch (m.tag) {
                          case 0:
                          case 11:
                          case 15:
                            Pj(8, m, f);
                        }
                        var q = m.child;
                        if (null !== q) q.return = m, V = q;
                        else for (; null !== V; ) {
                          m = V;
                          var r = m.sibling, y = m.return;
                          Sj(m);
                          if (m === l) {
                            V = null;
                            break;
                          }
                          if (null !== r) {
                            r.return = y;
                            V = r;
                            break;
                          }
                          V = y;
                        }
                      }
                    }
                    var n = f.alternate;
                    if (null !== n) {
                      var t = n.child;
                      if (null !== t) {
                        n.child = null;
                        do {
                          var J = t.sibling;
                          t.sibling = null;
                          t = J;
                        } while (null !== t);
                      }
                    }
                    V = f;
                  }
                }
                if (0 !== (f.subtreeFlags & 2064) && null !== g) g.return = f, V = g;
                else b: for (; null !== V; ) {
                  f = V;
                  if (0 !== (f.flags & 2048)) switch (f.tag) {
                    case 0:
                    case 11:
                    case 15:
                      Pj(9, f, f.return);
                  }
                  var x = f.sibling;
                  if (null !== x) {
                    x.return = f.return;
                    V = x;
                    break b;
                  }
                  V = f.return;
                }
              }
              var w = a.current;
              for (V = w; null !== V; ) {
                g = V;
                var u = g.child;
                if (0 !== (g.subtreeFlags & 2064) && null !== u) u.return = g, V = u;
                else b: for (g = w; null !== V; ) {
                  h = V;
                  if (0 !== (h.flags & 2048)) try {
                    switch (h.tag) {
                      case 0:
                      case 11:
                      case 15:
                        Qj(9, h);
                    }
                  } catch (na) {
                    W(h, h.return, na);
                  }
                  if (h === g) {
                    V = null;
                    break b;
                  }
                  var F = h.sibling;
                  if (null !== F) {
                    F.return = h.return;
                    V = F;
                    break b;
                  }
                  V = h.return;
                }
              }
              K = e;
              jg();
              if (lc && "function" === typeof lc.onPostCommitFiberRoot) try {
                lc.onPostCommitFiberRoot(kc, a);
              } catch (na) {
              }
              d = true;
            }
            return d;
          } finally {
            C = c, ok.transition = b;
          }
        }
        return false;
      }
      function Xk(a, b, c) {
        b = Ji(c, b);
        b = Ni(a, b, 1);
        a = nh(a, b, 1);
        b = R();
        null !== a && (Ac(a, 1, b), Dk(a, b));
      }
      function W(a, b, c) {
        if (3 === a.tag) Xk(a, a, c);
        else for (; null !== b; ) {
          if (3 === b.tag) {
            Xk(b, a, c);
            break;
          } else if (1 === b.tag) {
            var d = b.stateNode;
            if ("function" === typeof b.type.getDerivedStateFromError || "function" === typeof d.componentDidCatch && (null === Ri || !Ri.has(d))) {
              a = Ji(c, a);
              a = Qi(b, a, 1);
              b = nh(b, a, 1);
              a = R();
              null !== b && (Ac(b, 1, a), Dk(b, a));
              break;
            }
          }
          b = b.return;
        }
      }
      function Ti(a, b, c) {
        var d = a.pingCache;
        null !== d && d.delete(b);
        b = R();
        a.pingedLanes |= a.suspendedLanes & c;
        Q === a && (Z & c) === c && (4 === T || 3 === T && (Z & 130023424) === Z && 500 > B() - fk ? Kk(a, 0) : rk |= c);
        Dk(a, b);
      }
      function Yk(a, b) {
        0 === b && (0 === (a.mode & 1) ? b = 1 : (b = sc, sc <<= 1, 0 === (sc & 130023424) && (sc = 4194304)));
        var c = R();
        a = ih(a, b);
        null !== a && (Ac(a, b, c), Dk(a, c));
      }
      function uj(a) {
        var b = a.memoizedState, c = 0;
        null !== b && (c = b.retryLane);
        Yk(a, c);
      }
      function bk(a, b) {
        var c = 0;
        switch (a.tag) {
          case 13:
            var d = a.stateNode;
            var e = a.memoizedState;
            null !== e && (c = e.retryLane);
            break;
          case 19:
            d = a.stateNode;
            break;
          default:
            throw Error(p(314));
        }
        null !== d && d.delete(b);
        Yk(a, c);
      }
      var Vk;
      Vk = function(a, b, c) {
        if (null !== a) if (a.memoizedProps !== b.pendingProps || Wf.current) dh = true;
        else {
          if (0 === (a.lanes & c) && 0 === (b.flags & 128)) return dh = false, yj(a, b, c);
          dh = 0 !== (a.flags & 131072) ? true : false;
        }
        else dh = false, I && 0 !== (b.flags & 1048576) && ug(b, ng, b.index);
        b.lanes = 0;
        switch (b.tag) {
          case 2:
            var d = b.type;
            ij(a, b);
            a = b.pendingProps;
            var e = Yf(b, H.current);
            ch(b, c);
            e = Nh(null, b, d, a, e, c);
            var f = Sh();
            b.flags |= 1;
            "object" === typeof e && null !== e && "function" === typeof e.render && void 0 === e.$$typeof ? (b.tag = 1, b.memoizedState = null, b.updateQueue = null, Zf(d) ? (f = true, cg(b)) : f = false, b.memoizedState = null !== e.state && void 0 !== e.state ? e.state : null, kh(b), e.updater = Ei, b.stateNode = e, e._reactInternals = b, Ii(b, d, a, c), b = jj(null, b, d, true, f, c)) : (b.tag = 0, I && f && vg(b), Xi(null, b, e, c), b = b.child);
            return b;
          case 16:
            d = b.elementType;
            a: {
              ij(a, b);
              a = b.pendingProps;
              e = d._init;
              d = e(d._payload);
              b.type = d;
              e = b.tag = Zk(d);
              a = Ci(d, a);
              switch (e) {
                case 0:
                  b = cj(null, b, d, a, c);
                  break a;
                case 1:
                  b = hj(null, b, d, a, c);
                  break a;
                case 11:
                  b = Yi(null, b, d, a, c);
                  break a;
                case 14:
                  b = $i(null, b, d, Ci(d.type, a), c);
                  break a;
              }
              throw Error(p(
                306,
                d,
                ""
              ));
            }
            return b;
          case 0:
            return d = b.type, e = b.pendingProps, e = b.elementType === d ? e : Ci(d, e), cj(a, b, d, e, c);
          case 1:
            return d = b.type, e = b.pendingProps, e = b.elementType === d ? e : Ci(d, e), hj(a, b, d, e, c);
          case 3:
            a: {
              kj(b);
              if (null === a) throw Error(p(387));
              d = b.pendingProps;
              f = b.memoizedState;
              e = f.element;
              lh(a, b);
              qh(b, d, null, c);
              var g = b.memoizedState;
              d = g.element;
              if (f.isDehydrated) if (f = { element: d, isDehydrated: false, cache: g.cache, pendingSuspenseBoundaries: g.pendingSuspenseBoundaries, transitions: g.transitions }, b.updateQueue.baseState = f, b.memoizedState = f, b.flags & 256) {
                e = Ji(Error(p(423)), b);
                b = lj(a, b, d, c, e);
                break a;
              } else if (d !== e) {
                e = Ji(Error(p(424)), b);
                b = lj(a, b, d, c, e);
                break a;
              } else for (yg = Lf(b.stateNode.containerInfo.firstChild), xg = b, I = true, zg = null, c = Vg(b, null, d, c), b.child = c; c; ) c.flags = c.flags & -3 | 4096, c = c.sibling;
              else {
                Ig();
                if (d === e) {
                  b = Zi(a, b, c);
                  break a;
                }
                Xi(a, b, d, c);
              }
              b = b.child;
            }
            return b;
          case 5:
            return Ah(b), null === a && Eg(b), d = b.type, e = b.pendingProps, f = null !== a ? a.memoizedProps : null, g = e.children, Ef(d, e) ? g = null : null !== f && Ef(d, f) && (b.flags |= 32), gj(a, b), Xi(a, b, g, c), b.child;
          case 6:
            return null === a && Eg(b), null;
          case 13:
            return oj(a, b, c);
          case 4:
            return yh(b, b.stateNode.containerInfo), d = b.pendingProps, null === a ? b.child = Ug(b, null, d, c) : Xi(a, b, d, c), b.child;
          case 11:
            return d = b.type, e = b.pendingProps, e = b.elementType === d ? e : Ci(d, e), Yi(a, b, d, e, c);
          case 7:
            return Xi(a, b, b.pendingProps, c), b.child;
          case 8:
            return Xi(a, b, b.pendingProps.children, c), b.child;
          case 12:
            return Xi(a, b, b.pendingProps.children, c), b.child;
          case 10:
            a: {
              d = b.type._context;
              e = b.pendingProps;
              f = b.memoizedProps;
              g = e.value;
              G(Wg, d._currentValue);
              d._currentValue = g;
              if (null !== f) if (He(f.value, g)) {
                if (f.children === e.children && !Wf.current) {
                  b = Zi(a, b, c);
                  break a;
                }
              } else for (f = b.child, null !== f && (f.return = b); null !== f; ) {
                var h = f.dependencies;
                if (null !== h) {
                  g = f.child;
                  for (var k = h.firstContext; null !== k; ) {
                    if (k.context === d) {
                      if (1 === f.tag) {
                        k = mh(-1, c & -c);
                        k.tag = 2;
                        var l = f.updateQueue;
                        if (null !== l) {
                          l = l.shared;
                          var m = l.pending;
                          null === m ? k.next = k : (k.next = m.next, m.next = k);
                          l.pending = k;
                        }
                      }
                      f.lanes |= c;
                      k = f.alternate;
                      null !== k && (k.lanes |= c);
                      bh(
                        f.return,
                        c,
                        b
                      );
                      h.lanes |= c;
                      break;
                    }
                    k = k.next;
                  }
                } else if (10 === f.tag) g = f.type === b.type ? null : f.child;
                else if (18 === f.tag) {
                  g = f.return;
                  if (null === g) throw Error(p(341));
                  g.lanes |= c;
                  h = g.alternate;
                  null !== h && (h.lanes |= c);
                  bh(g, c, b);
                  g = f.sibling;
                } else g = f.child;
                if (null !== g) g.return = f;
                else for (g = f; null !== g; ) {
                  if (g === b) {
                    g = null;
                    break;
                  }
                  f = g.sibling;
                  if (null !== f) {
                    f.return = g.return;
                    g = f;
                    break;
                  }
                  g = g.return;
                }
                f = g;
              }
              Xi(a, b, e.children, c);
              b = b.child;
            }
            return b;
          case 9:
            return e = b.type, d = b.pendingProps.children, ch(b, c), e = eh(e), d = d(e), b.flags |= 1, Xi(a, b, d, c), b.child;
          case 14:
            return d = b.type, e = Ci(d, b.pendingProps), e = Ci(d.type, e), $i(a, b, d, e, c);
          case 15:
            return bj(a, b, b.type, b.pendingProps, c);
          case 17:
            return d = b.type, e = b.pendingProps, e = b.elementType === d ? e : Ci(d, e), ij(a, b), b.tag = 1, Zf(d) ? (a = true, cg(b)) : a = false, ch(b, c), Gi(b, d, e), Ii(b, d, e, c), jj(null, b, d, true, a, c);
          case 19:
            return xj(a, b, c);
          case 22:
            return dj(a, b, c);
        }
        throw Error(p(156, b.tag));
      };
      function Fk(a, b) {
        return ac(a, b);
      }
      function $k(a, b, c, d) {
        this.tag = a;
        this.key = c;
        this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null;
        this.index = 0;
        this.ref = null;
        this.pendingProps = b;
        this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null;
        this.mode = d;
        this.subtreeFlags = this.flags = 0;
        this.deletions = null;
        this.childLanes = this.lanes = 0;
        this.alternate = null;
      }
      function Bg(a, b, c, d) {
        return new $k(a, b, c, d);
      }
      function aj(a) {
        a = a.prototype;
        return !(!a || !a.isReactComponent);
      }
      function Zk(a) {
        if ("function" === typeof a) return aj(a) ? 1 : 0;
        if (void 0 !== a && null !== a) {
          a = a.$$typeof;
          if (a === Da) return 11;
          if (a === Ga) return 14;
        }
        return 2;
      }
      function Pg(a, b) {
        var c = a.alternate;
        null === c ? (c = Bg(a.tag, b, a.key, a.mode), c.elementType = a.elementType, c.type = a.type, c.stateNode = a.stateNode, c.alternate = a, a.alternate = c) : (c.pendingProps = b, c.type = a.type, c.flags = 0, c.subtreeFlags = 0, c.deletions = null);
        c.flags = a.flags & 14680064;
        c.childLanes = a.childLanes;
        c.lanes = a.lanes;
        c.child = a.child;
        c.memoizedProps = a.memoizedProps;
        c.memoizedState = a.memoizedState;
        c.updateQueue = a.updateQueue;
        b = a.dependencies;
        c.dependencies = null === b ? null : { lanes: b.lanes, firstContext: b.firstContext };
        c.sibling = a.sibling;
        c.index = a.index;
        c.ref = a.ref;
        return c;
      }
      function Rg(a, b, c, d, e, f) {
        var g = 2;
        d = a;
        if ("function" === typeof a) aj(a) && (g = 1);
        else if ("string" === typeof a) g = 5;
        else a: switch (a) {
          case ya:
            return Tg(c.children, e, f, b);
          case za:
            g = 8;
            e |= 8;
            break;
          case Aa:
            return a = Bg(12, c, b, e | 2), a.elementType = Aa, a.lanes = f, a;
          case Ea:
            return a = Bg(13, c, b, e), a.elementType = Ea, a.lanes = f, a;
          case Fa:
            return a = Bg(19, c, b, e), a.elementType = Fa, a.lanes = f, a;
          case Ia:
            return pj(c, e, f, b);
          default:
            if ("object" === typeof a && null !== a) switch (a.$$typeof) {
              case Ba:
                g = 10;
                break a;
              case Ca:
                g = 9;
                break a;
              case Da:
                g = 11;
                break a;
              case Ga:
                g = 14;
                break a;
              case Ha:
                g = 16;
                d = null;
                break a;
            }
            throw Error(p(130, null == a ? a : typeof a, ""));
        }
        b = Bg(g, c, b, e);
        b.elementType = a;
        b.type = d;
        b.lanes = f;
        return b;
      }
      function Tg(a, b, c, d) {
        a = Bg(7, a, d, b);
        a.lanes = c;
        return a;
      }
      function pj(a, b, c, d) {
        a = Bg(22, a, d, b);
        a.elementType = Ia;
        a.lanes = c;
        a.stateNode = { isHidden: false };
        return a;
      }
      function Qg(a, b, c) {
        a = Bg(6, a, null, b);
        a.lanes = c;
        return a;
      }
      function Sg(a, b, c) {
        b = Bg(4, null !== a.children ? a.children : [], a.key, b);
        b.lanes = c;
        b.stateNode = { containerInfo: a.containerInfo, pendingChildren: null, implementation: a.implementation };
        return b;
      }
      function al(a, b, c, d, e) {
        this.tag = b;
        this.containerInfo = a;
        this.finishedWork = this.pingCache = this.current = this.pendingChildren = null;
        this.timeoutHandle = -1;
        this.callbackNode = this.pendingContext = this.context = null;
        this.callbackPriority = 0;
        this.eventTimes = zc(0);
        this.expirationTimes = zc(-1);
        this.entangledLanes = this.finishedLanes = this.mutableReadLanes = this.expiredLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0;
        this.entanglements = zc(0);
        this.identifierPrefix = d;
        this.onRecoverableError = e;
        this.mutableSourceEagerHydrationData = null;
      }
      function bl(a, b, c, d, e, f, g, h, k) {
        a = new al(a, b, c, h, k);
        1 === b ? (b = 1, true === f && (b |= 8)) : b = 0;
        f = Bg(3, null, null, b);
        a.current = f;
        f.stateNode = a;
        f.memoizedState = { element: d, isDehydrated: c, cache: null, transitions: null, pendingSuspenseBoundaries: null };
        kh(f);
        return a;
      }
      function cl(a, b, c) {
        var d = 3 < arguments.length && void 0 !== arguments[3] ? arguments[3] : null;
        return { $$typeof: wa, key: null == d ? null : "" + d, children: a, containerInfo: b, implementation: c };
      }
      function dl(a) {
        if (!a) return Vf;
        a = a._reactInternals;
        a: {
          if (Vb(a) !== a || 1 !== a.tag) throw Error(p(170));
          var b = a;
          do {
            switch (b.tag) {
              case 3:
                b = b.stateNode.context;
                break a;
              case 1:
                if (Zf(b.type)) {
                  b = b.stateNode.__reactInternalMemoizedMergedChildContext;
                  break a;
                }
            }
            b = b.return;
          } while (null !== b);
          throw Error(p(171));
        }
        if (1 === a.tag) {
          var c = a.type;
          if (Zf(c)) return bg(a, c, b);
        }
        return b;
      }
      function el(a, b, c, d, e, f, g, h, k) {
        a = bl(c, d, true, a, e, f, g, h, k);
        a.context = dl(null);
        c = a.current;
        d = R();
        e = yi(c);
        f = mh(d, e);
        f.callback = void 0 !== b && null !== b ? b : null;
        nh(c, f, e);
        a.current.lanes = e;
        Ac(a, e, d);
        Dk(a, d);
        return a;
      }
      function fl(a, b, c, d) {
        var e = b.current, f = R(), g = yi(e);
        c = dl(c);
        null === b.context ? b.context = c : b.pendingContext = c;
        b = mh(f, g);
        b.payload = { element: a };
        d = void 0 === d ? null : d;
        null !== d && (b.callback = d);
        a = nh(e, b, g);
        null !== a && (gi(a, e, g, f), oh(a, e, g));
        return g;
      }
      function gl(a) {
        a = a.current;
        if (!a.child) return null;
        switch (a.child.tag) {
          case 5:
            return a.child.stateNode;
          default:
            return a.child.stateNode;
        }
      }
      function hl(a, b) {
        a = a.memoizedState;
        if (null !== a && null !== a.dehydrated) {
          var c = a.retryLane;
          a.retryLane = 0 !== c && c < b ? c : b;
        }
      }
      function il(a, b) {
        hl(a, b);
        (a = a.alternate) && hl(a, b);
      }
      function jl() {
        return null;
      }
      var kl = "function" === typeof reportError ? reportError : function(a) {
        console.error(a);
      };
      function ll(a) {
        this._internalRoot = a;
      }
      ml.prototype.render = ll.prototype.render = function(a) {
        var b = this._internalRoot;
        if (null === b) throw Error(p(409));
        fl(a, b, null, null);
      };
      ml.prototype.unmount = ll.prototype.unmount = function() {
        var a = this._internalRoot;
        if (null !== a) {
          this._internalRoot = null;
          var b = a.containerInfo;
          Rk(function() {
            fl(null, a, null, null);
          });
          b[uf] = null;
        }
      };
      function ml(a) {
        this._internalRoot = a;
      }
      ml.prototype.unstable_scheduleHydration = function(a) {
        if (a) {
          var b = Hc();
          a = { blockedOn: null, target: a, priority: b };
          for (var c = 0; c < Qc.length && 0 !== b && b < Qc[c].priority; c++) ;
          Qc.splice(c, 0, a);
          0 === c && Vc(a);
        }
      };
      function nl(a) {
        return !(!a || 1 !== a.nodeType && 9 !== a.nodeType && 11 !== a.nodeType);
      }
      function ol(a) {
        return !(!a || 1 !== a.nodeType && 9 !== a.nodeType && 11 !== a.nodeType && (8 !== a.nodeType || " react-mount-point-unstable " !== a.nodeValue));
      }
      function pl() {
      }
      function ql(a, b, c, d, e) {
        if (e) {
          if ("function" === typeof d) {
            var f = d;
            d = function() {
              var a2 = gl(g);
              f.call(a2);
            };
          }
          var g = el(b, d, a, 0, null, false, false, "", pl);
          a._reactRootContainer = g;
          a[uf] = g.current;
          sf(8 === a.nodeType ? a.parentNode : a);
          Rk();
          return g;
        }
        for (; e = a.lastChild; ) a.removeChild(e);
        if ("function" === typeof d) {
          var h = d;
          d = function() {
            var a2 = gl(k);
            h.call(a2);
          };
        }
        var k = bl(a, 0, false, null, null, false, false, "", pl);
        a._reactRootContainer = k;
        a[uf] = k.current;
        sf(8 === a.nodeType ? a.parentNode : a);
        Rk(function() {
          fl(b, k, c, d);
        });
        return k;
      }
      function rl(a, b, c, d, e) {
        var f = c._reactRootContainer;
        if (f) {
          var g = f;
          if ("function" === typeof e) {
            var h = e;
            e = function() {
              var a2 = gl(g);
              h.call(a2);
            };
          }
          fl(b, g, a, e);
        } else g = ql(c, b, a, e, d);
        return gl(g);
      }
      Ec = function(a) {
        switch (a.tag) {
          case 3:
            var b = a.stateNode;
            if (b.current.memoizedState.isDehydrated) {
              var c = tc(b.pendingLanes);
              0 !== c && (Cc(b, c | 1), Dk(b, B()), 0 === (K & 6) && (Gj = B() + 500, jg()));
            }
            break;
          case 13:
            Rk(function() {
              var b2 = ih(a, 1);
              if (null !== b2) {
                var c2 = R();
                gi(b2, a, 1, c2);
              }
            }), il(a, 1);
        }
      };
      Fc = function(a) {
        if (13 === a.tag) {
          var b = ih(a, 134217728);
          if (null !== b) {
            var c = R();
            gi(b, a, 134217728, c);
          }
          il(a, 134217728);
        }
      };
      Gc = function(a) {
        if (13 === a.tag) {
          var b = yi(a), c = ih(a, b);
          if (null !== c) {
            var d = R();
            gi(c, a, b, d);
          }
          il(a, b);
        }
      };
      Hc = function() {
        return C;
      };
      Ic = function(a, b) {
        var c = C;
        try {
          return C = a, b();
        } finally {
          C = c;
        }
      };
      yb = function(a, b, c) {
        switch (b) {
          case "input":
            bb(a, c);
            b = c.name;
            if ("radio" === c.type && null != b) {
              for (c = a; c.parentNode; ) c = c.parentNode;
              c = c.querySelectorAll("input[name=" + JSON.stringify("" + b) + '][type="radio"]');
              for (b = 0; b < c.length; b++) {
                var d = c[b];
                if (d !== a && d.form === a.form) {
                  var e = Db(d);
                  if (!e) throw Error(p(90));
                  Wa(d);
                  bb(d, e);
                }
              }
            }
            break;
          case "textarea":
            ib(a, c);
            break;
          case "select":
            b = c.value, null != b && fb(a, !!c.multiple, b, false);
        }
      };
      Gb = Qk;
      Hb = Rk;
      var sl = { usingClientEntryPoint: false, Events: [Cb, ue, Db, Eb, Fb, Qk] };
      var tl = { findFiberByHostInstance: Wc, bundleType: 0, version: "18.3.1", rendererPackageName: "react-dom" };
      var ul = { bundleType: tl.bundleType, version: tl.version, rendererPackageName: tl.rendererPackageName, rendererConfig: tl.rendererConfig, overrideHookState: null, overrideHookStateDeletePath: null, overrideHookStateRenamePath: null, overrideProps: null, overridePropsDeletePath: null, overridePropsRenamePath: null, setErrorHandler: null, setSuspenseHandler: null, scheduleUpdate: null, currentDispatcherRef: ua.ReactCurrentDispatcher, findHostInstanceByFiber: function(a) {
        a = Zb(a);
        return null === a ? null : a.stateNode;
      }, findFiberByHostInstance: tl.findFiberByHostInstance || jl, findHostInstancesForRefresh: null, scheduleRefresh: null, scheduleRoot: null, setRefreshHandler: null, getCurrentFiber: null, reconcilerVersion: "18.3.1-next-f1338f8080-20240426" };
      if ("undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__) {
        vl = __REACT_DEVTOOLS_GLOBAL_HOOK__;
        if (!vl.isDisabled && vl.supportsFiber) try {
          kc = vl.inject(ul), lc = vl;
        } catch (a) {
        }
      }
      var vl;
      exports2.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = sl;
      exports2.createPortal = function(a, b) {
        var c = 2 < arguments.length && void 0 !== arguments[2] ? arguments[2] : null;
        if (!nl(b)) throw Error(p(200));
        return cl(a, b, null, c);
      };
      exports2.createRoot = function(a, b) {
        if (!nl(a)) throw Error(p(299));
        var c = false, d = "", e = kl;
        null !== b && void 0 !== b && (true === b.unstable_strictMode && (c = true), void 0 !== b.identifierPrefix && (d = b.identifierPrefix), void 0 !== b.onRecoverableError && (e = b.onRecoverableError));
        b = bl(a, 1, false, null, null, c, false, d, e);
        a[uf] = b.current;
        sf(8 === a.nodeType ? a.parentNode : a);
        return new ll(b);
      };
      exports2.findDOMNode = function(a) {
        if (null == a) return null;
        if (1 === a.nodeType) return a;
        var b = a._reactInternals;
        if (void 0 === b) {
          if ("function" === typeof a.render) throw Error(p(188));
          a = Object.keys(a).join(",");
          throw Error(p(268, a));
        }
        a = Zb(b);
        a = null === a ? null : a.stateNode;
        return a;
      };
      exports2.flushSync = function(a) {
        return Rk(a);
      };
      exports2.hydrate = function(a, b, c) {
        if (!ol(b)) throw Error(p(200));
        return rl(null, a, b, true, c);
      };
      exports2.hydrateRoot = function(a, b, c) {
        if (!nl(a)) throw Error(p(405));
        var d = null != c && c.hydratedSources || null, e = false, f = "", g = kl;
        null !== c && void 0 !== c && (true === c.unstable_strictMode && (e = true), void 0 !== c.identifierPrefix && (f = c.identifierPrefix), void 0 !== c.onRecoverableError && (g = c.onRecoverableError));
        b = el(b, null, a, 1, null != c ? c : null, e, false, f, g);
        a[uf] = b.current;
        sf(a);
        if (d) for (a = 0; a < d.length; a++) c = d[a], e = c._getVersion, e = e(c._source), null == b.mutableSourceEagerHydrationData ? b.mutableSourceEagerHydrationData = [c, e] : b.mutableSourceEagerHydrationData.push(
          c,
          e
        );
        return new ml(b);
      };
      exports2.render = function(a, b, c) {
        if (!ol(b)) throw Error(p(200));
        return rl(null, a, b, false, c);
      };
      exports2.unmountComponentAtNode = function(a) {
        if (!ol(a)) throw Error(p(40));
        return a._reactRootContainer ? (Rk(function() {
          rl(null, null, a, false, function() {
            a._reactRootContainer = null;
            a[uf] = null;
          });
        }), true) : false;
      };
      exports2.unstable_batchedUpdates = Qk;
      exports2.unstable_renderSubtreeIntoContainer = function(a, b, c, d) {
        if (!ol(c)) throw Error(p(200));
        if (null == a || void 0 === a._reactInternals) throw Error(p(38));
        return rl(a, b, c, false, d);
      };
      exports2.version = "18.3.1-next-f1338f8080-20240426";
    }
  });

  // node_modules/react-dom/index.js
  var require_react_dom = __commonJS({
    "node_modules/react-dom/index.js"(exports2, module) {
      "use strict";
      init_define_import_meta_env();
      function checkDCE() {
        if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ === "undefined" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE !== "function") {
          return;
        }
        if (false) {
          throw new Error("^_^");
        }
        try {
          __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(checkDCE);
        } catch (err) {
          console.error(err);
        }
      }
      if (true) {
        checkDCE();
        module.exports = require_react_dom_production_min();
      } else {
        module.exports = null;
      }
    }
  });

  // node_modules/react-dom/client.js
  var require_client = __commonJS({
    "node_modules/react-dom/client.js"(exports2) {
      "use strict";
      init_define_import_meta_env();
      var m = require_react_dom();
      if (true) {
        exports2.createRoot = m.createRoot;
        exports2.hydrateRoot = m.hydrateRoot;
      } else {
        i = m.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
        exports2.createRoot = function(c, o) {
          i.usingClientEntryPoint = true;
          try {
            return m.createRoot(c, o);
          } finally {
            i.usingClientEntryPoint = false;
          }
        };
        exports2.hydrateRoot = function(c, h, o) {
          i.usingClientEntryPoint = true;
          try {
            return m.hydrateRoot(c, h, o);
          } finally {
            i.usingClientEntryPoint = false;
          }
        };
      }
      var i;
    }
  });

  // shared/memberTerms.js
  var MEMBER_TERMS_VERSION;
  var init_memberTerms = __esm({
    "shared/memberTerms.js"() {
      init_define_import_meta_env();
      MEMBER_TERMS_VERSION = "2026-11-24";
    }
  });

  // node_modules/react/cjs/react-jsx-runtime.production.min.js
  var require_react_jsx_runtime_production_min = __commonJS({
    "node_modules/react/cjs/react-jsx-runtime.production.min.js"(exports2) {
      "use strict";
      init_define_import_meta_env();
      var f = require_react();
      var k = /* @__PURE__ */ Symbol.for("react.element");
      var l = /* @__PURE__ */ Symbol.for("react.fragment");
      var m = Object.prototype.hasOwnProperty;
      var n = f.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner;
      var p = { key: true, ref: true, __self: true, __source: true };
      function q(c, a, g) {
        var b, d = {}, e = null, h = null;
        void 0 !== g && (e = "" + g);
        void 0 !== a.key && (e = "" + a.key);
        void 0 !== a.ref && (h = a.ref);
        for (b in a) m.call(a, b) && !p.hasOwnProperty(b) && (d[b] = a[b]);
        if (c && c.defaultProps) for (b in a = c.defaultProps, a) void 0 === d[b] && (d[b] = a[b]);
        return { $$typeof: k, type: c, key: e, ref: h, props: d, _owner: n.current };
      }
      exports2.Fragment = l;
      exports2.jsx = q;
      exports2.jsxs = q;
    }
  });

  // node_modules/react/jsx-runtime.js
  var require_jsx_runtime = __commonJS({
    "node_modules/react/jsx-runtime.js"(exports2, module) {
      "use strict";
      init_define_import_meta_env();
      if (true) {
        module.exports = require_react_jsx_runtime_production_min();
      } else {
        module.exports = null;
      }
    }
  });

  // src/auth/AuthContext.jsx
  function readSession() {
    try {
      const session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
      return session && typeof session === "object" ? session : null;
    } catch {
      return null;
    }
  }
  function AuthProvider({ children }) {
    const [session, setSession] = (0, import_react.useState)(readSession);
    const login = (0, import_react.useCallback)((nextSession) => {
      localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
      setSession(nextSession);
    }, []);
    const logout = (0, import_react.useCallback)(() => {
      localStorage.removeItem(SESSION_KEY);
      setSession(null);
    }, []);
    const value = (0, import_react.useMemo)(
      () => ({
        session,
        user: session?.user || session,
        role: session?.role || session?.user?.role,
        token: session?.token,
        memberLoginComplete: session?.user?.termsVersion === MEMBER_TERMS_VERSION,
        login,
        logout
      }),
      [session, login, logout]
    );
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthContext.Provider, { value, children });
  }
  function useAuth() {
    return (0, import_react.useContext)(AuthContext);
  }
  var import_react, import_jsx_runtime, AuthContext, SESSION_KEY;
  var init_AuthContext = __esm({
    "src/auth/AuthContext.jsx"() {
      init_define_import_meta_env();
      import_react = __toESM(require_react(), 1);
      init_memberTerms();
      import_jsx_runtime = __toESM(require_jsx_runtime(), 1);
      AuthContext = (0, import_react.createContext)(null);
      SESSION_KEY = "fitpulse-session";
    }
  });

  // src/components/brand/useTheme.jsx
  function getInitialDark() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "dark" || saved === "light") return saved === "dark";
    } catch {
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  function ThemeProvider({ children }) {
    const [dark, setDark] = (0, import_react3.useState)(getInitialDark);
    (0, import_react3.useEffect)(() => {
      document.documentElement.dataset.theme = dark ? "dark" : "light";
      try {
        localStorage.setItem(STORAGE_KEY, dark ? "dark" : "light");
      } catch {
      }
    }, [dark]);
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(ThemeContext.Provider, { value: { dark, toggle: () => setDark((value) => !value) }, children });
  }
  var import_react3, import_jsx_runtime2, ThemeContext, STORAGE_KEY, useTheme;
  var init_useTheme = __esm({
    "src/components/brand/useTheme.jsx"() {
      init_define_import_meta_env();
      import_react3 = __toESM(require_react(), 1);
      import_jsx_runtime2 = __toESM(require_jsx_runtime(), 1);
      ThemeContext = (0, import_react3.createContext)(null);
      STORAGE_KEY = "fitpulse-theme";
      useTheme = () => (0, import_react3.useContext)(ThemeContext);
    }
  });

  // src/components/Dialog.jsx
  function flagField(field) {
    if (!field) return;
    field.setAttribute("aria-invalid", "true");
    field.focus();
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      field.animate(
        [{ translate: "0" }, { translate: "-5px" }, { translate: "5px" }, { translate: "0" }],
        { duration: 220 }
      );
  }
  function Dialog({
    title,
    children,
    onClose,
    busy = false,
    className = "",
    alert = false,
    sheet = false,
    focusClose = false,
    dismissOnBackdrop = true,
    dismissOnEscape = true,
    invalidField
  }) {
    const mobileDashboard = (0, import_react4.useContext)(DashboardSheetContext);
    const bottomSheet = mobileDashboard || sheet;
    const titleId = (0, import_react4.useId)();
    const dialogRef = (0, import_react4.useRef)(null);
    (0, import_react4.useEffect)(() => {
      const dialog2 = dialogRef.current;
      dialog2.showModal();
      window.dispatchEvent(new Event("fitpulse:dialog-change"));
      dialog2.querySelector("[data-autofocus]:not(:disabled)")?.focus();
      return () => {
        dialog2.close();
        window.dispatchEvent(new Event("fitpulse:dialog-change"));
      };
    }, [bottomSheet]);
    (0, import_react4.useEffect)(() => {
      if (!bottomSheet || busy || !invalidField) return;
      const fields = Array.from(dialogRef.current.querySelectorAll("input[name], select[name]"));
      flagField(fields.find((field) => field.name === invalidField.name));
    }, [bottomSheet, busy, invalidField]);
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
      "dialog",
      {
        className: `modal experience-modal${bottomSheet ? " fitpulse-bottom-sheet" : ""}`,
        ref: dialogRef,
        role: alert ? "alertdialog" : "dialog",
        "aria-labelledby": titleId,
        "aria-modal": "true",
        "aria-busy": busy,
        onCancel: (event) => {
          event.preventDefault();
          if (!busy && dismissOnEscape) onClose();
        },
        onMouseDown: (event) => !busy && dismissOnBackdrop && event.target === event.currentTarget && onClose(),
        onInvalidCapture: bottomSheet ? (event) => {
          const field = event.target;
          if (field.form?.querySelector("input:invalid, select:invalid, textarea:invalid") === field)
            flagField(field);
        } : void 0,
        onChangeCapture: bottomSheet ? (event) => event.target.removeAttribute("aria-invalid") : void 0,
        children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("section", { className: `clay experience-dialog ${className}`, children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "mh", children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h2", { id: titleId, children: title }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
              "button",
              {
                className: "ib dialog-close",
                type: "button",
                onClick: onClose,
                disabled: busy,
                "data-autofocus": focusClose || void 0,
                "aria-label": bottomSheet ? "Close" : "Close dialog",
                children: "\xD7"
              }
            )
          ] }),
          children
        ] })
      }
    );
  }
  var import_react4, import_jsx_runtime3, DashboardSheetContext;
  var init_Dialog = __esm({
    "src/components/Dialog.jsx"() {
      init_define_import_meta_env();
      import_react4 = __toESM(require_react(), 1);
      import_jsx_runtime3 = __toESM(require_jsx_runtime(), 1);
      DashboardSheetContext = (0, import_react4.createContext)(false);
    }
  });

  // src/components/Spinner.jsx
  function Spinner({ large = false }) {
    return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: large ? "spinner spinner-large" : "spinner", "aria-hidden": "true" });
  }
  var import_jsx_runtime4;
  var init_Spinner = __esm({
    "src/components/Spinner.jsx"() {
      init_define_import_meta_env();
      import_jsx_runtime4 = __toESM(require_jsx_runtime(), 1);
    }
  });

  // src/utils/loaderTiming.js
  function createLoaderTimer(onComplete, { now = () => performance.now(), schedule = setTimeout, cancel = clearTimeout } = {}) {
    let deadline = null;
    let timer = null;
    let completed = false;
    return {
      start() {
        if (completed || timer !== null) return;
        deadline ??= now() + LOADER_DURATION_MS;
        timer = schedule(
          () => {
            timer = null;
            completed = true;
            onComplete();
          },
          Math.max(0, deadline - now())
        );
      },
      stop() {
        if (timer !== null) cancel(timer);
        timer = null;
      }
    };
  }
  var LOADER_DURATION_MS;
  var init_loaderTiming = __esm({
    "src/utils/loaderTiming.js"() {
      init_define_import_meta_env();
      LOADER_DURATION_MS = 1e3;
    }
  });

  // src/components/HeartRateLoader.css
  var init_HeartRateLoader = __esm({
    "src/components/HeartRateLoader.css"() {
    }
  });

  // src/components/HeartRateLoader.jsx
  function HeartRateLoader({ message = "Getting things ready", onComplete }) {
    const timerRef = (0, import_react5.useRef)(null);
    const onCompleteRef = (0, import_react5.useRef)(onComplete);
    (0, import_react5.useEffect)(() => {
      onCompleteRef.current = onComplete;
    }, [onComplete]);
    (0, import_react5.useEffect)(() => {
      timerRef.current ||= createLoaderTimer(() => onCompleteRef.current?.());
      timerRef.current.start();
      return () => timerRef.current.stop();
    }, []);
    return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
      "div",
      {
        className: "loading-overlay",
        role: "status",
        "aria-live": "polite",
        children: /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "clay loading-card", children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "loading-brand", children: [
            "Fit",
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: "Pulse" }),
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("i", { "aria-hidden": "true" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Spinner, { large: true }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("strong", { children: message }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("small", { children: "Your next session starts here." })
        ] })
      }
    );
  }
  var import_react5, import_jsx_runtime5;
  var init_HeartRateLoader2 = __esm({
    "src/components/HeartRateLoader.jsx"() {
      init_define_import_meta_env();
      import_react5 = __toESM(require_react(), 1);
      init_loaderTiming();
      init_Spinner();
      init_HeartRateLoader();
      import_jsx_runtime5 = __toESM(require_jsx_runtime(), 1);
    }
  });

  // src/utils/api.js
  function buildHeaders(options = {}) {
    const headers = { ...options.headers || {} };
    if (!(options.body instanceof FormData)) headers["Content-Type"] ??= "application/json";
    if (options.token) headers.Authorization = `Bearer ${options.token}`;
    return headers;
  }
  async function apiResponse(path, options = {}) {
    const { token, ...requestOptions } = options;
    let response;
    try {
      response = await fetch(apiUrl(path), {
        ...requestOptions,
        headers: buildHeaders(options)
      });
    } catch (cause) {
      const error = new Error("Could not reach the FitPulse server. Is it running?");
      error.kind = "network";
      error.cause = cause;
      throw error;
    }
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      const error = new Error(payload.message || `Request failed (${response.status}).`);
      error.status = response.status;
      error.code = payload.code;
      error.field = payload.field;
      error.remainingAttempts = payload.remainingAttempts;
      error.retryAfterSeconds = payload.retryAfterSeconds;
      error.rejectedAttempts = payload.rejectedAttempts;
      throw error;
    }
    return response;
  }
  async function apiRequest(path, options = {}) {
    const response = await apiResponse(path, options);
    if (response.status === 204) return {};
    try {
      return await response.json();
    } catch (cause) {
      throw new Error("FitPulse received an invalid API response. Check the server address and try again.", { cause });
    }
  }
  var API_URL, apiUrl;
  var init_api = __esm({
    "src/utils/api.js"() {
      init_define_import_meta_env();
      API_URL = define_import_meta_env_default.VITE_API_URL || (define_import_meta_env_default.DEV ? "/api" : "http://localhost:3001/api");
      apiUrl = (path) => `${API_URL.replace(/\/$/, "")}${path}`;
    }
  });

  // shared/gorillaEvents.js
  var gorillaTitles, pesos, gorillaEvents;
  var init_gorillaEvents = __esm({
    "shared/gorillaEvents.js"() {
      init_define_import_meta_env();
      gorillaTitles = {
        memberCreated: "New member created",
        memberDeleted: "Member account deleted",
        expiring: "Membership expiring",
        expired: "Membership expired",
        equipmentAdded: "Equipment added",
        equipmentUpdated: "Equipment updated",
        equipmentBroken: "Equipment out of service",
        payment: "Payment recorded",
        qrCheckIn: "QR check-in recorded",
        loginLocked: "Too many sign-in attempts"
      };
      pesos = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });
      gorillaEvents = {
        memberCreated: (name, memberId) => ({
          type: "success",
          title: gorillaTitles.memberCreated,
          message: `${name} joined FitPulse.`,
          target: { section: "Members", memberId }
        }),
        memberDeleted: () => ({
          type: "success",
          title: gorillaTitles.memberDeleted,
          message: "The member account and its history were removed.",
          target: { section: "Members" }
        }),
        expiring: (name, days) => ({
          type: "warning",
          title: gorillaTitles.expiring,
          message: `${name ? `${name}\u2019s` : "Your"} membership expires in ${days} ${days === 1 ? "day" : "days"}.`,
          target: { section: "Notifications" }
        }),
        expired: (name) => ({
          type: "warning",
          title: gorillaTitles.expired,
          message: `${name ? `${name}\u2019s` : "Your"} membership has expired.`,
          target: { section: "Notifications" }
        }),
        equipmentAdded: (item) => ({
          type: "success",
          title: gorillaTitles.equipmentAdded,
          message: `${item} was added to Equipment.`,
          target: { section: "Equipment" }
        }),
        equipmentUpdated: (item, detail, type = "success") => ({
          type,
          title: gorillaTitles.equipmentUpdated,
          message: `${item}: ${detail}.`,
          target: { section: "Equipment" }
        }),
        equipmentBroken: (item) => ({
          type: "error",
          title: gorillaTitles.equipmentBroken,
          message: `${item} is out of service.`,
          target: { section: "Equipment" }
        }),
        payment: (name, amount, method) => ({
          type: "success",
          title: gorillaTitles.payment,
          message: `${name ? `${name} paid` : "We received"} ${pesos.format(amount)} by ${method}.`,
          target: { section: "Payments" }
        }),
        qrCheckIn: (name) => ({
          type: "success",
          title: gorillaTitles.qrCheckIn,
          message: name ? `${name} checked in at FitPulse.` : "Your FitPulse check-in was recorded.",
          target: { section: "Attendance" }
        }),
        loginLocked: () => ({
          type: "error",
          title: gorillaTitles.loginLocked,
          message: "Wait up to 15 minutes before trying to sign in to this account again."
        })
      };
    }
  });

  // src/pages/Login.css
  var init_Login = __esm({
    "src/pages/Login.css"() {
    }
  });

  // shared/formatDate.js
  function validDate(value) {
    if (value == null || value === "") return null;
    const date4 = new Date(value);
    return Number.isFinite(date4.getTime()) ? date4 : null;
  }
  function formatDate(value, fallback = "\u2014") {
    const date4 = validDate(value);
    if (!date4) return fallback;
    const parts = Object.fromEntries(dateFormatter.formatToParts(date4).map(({ type, value: value2 }) => [type, value2]));
    return `${parts.day}/${parts.month}/${parts.year.padStart(4, "0")}`;
  }
  function manilaDateKey(value) {
    return formatDate(value, "").split("/").reverse().join("-");
  }
  function formatTime(value, { hour12 = true } = {}) {
    const date4 = validDate(value);
    return date4 ? (hour12 ? clock12 : clock24).format(date4) : "";
  }
  function formatDateTime(value, fallback = "\u2014", options) {
    const date4 = validDate(value);
    return date4 ? `${formatDate(date4)}, ${formatTime(date4, options)}` : fallback;
  }
  var MANILA_TIME_ZONE, dateFormatter, timeOptions, clock12, clock24;
  var init_formatDate = __esm({
    "shared/formatDate.js"() {
      init_define_import_meta_env();
      MANILA_TIME_ZONE = "Asia/Manila";
      dateFormatter = new Intl.DateTimeFormat("en-GB", {
        timeZone: MANILA_TIME_ZONE,
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      });
      timeOptions = { timeZone: MANILA_TIME_ZONE, hour: "2-digit", minute: "2-digit" };
      clock12 = new Intl.DateTimeFormat("en-PH", { ...timeOptions, hour12: true });
      clock24 = new Intl.DateTimeFormat("en-GB", { ...timeOptions, hourCycle: "h23" });
    }
  });

  // src/components/MemberTerms.jsx
  var MemberTerms_exports = {};
  __export(MemberTerms_exports, {
    default: () => MemberTerms
  });
  function MemberTerms({ ticket, onAccepted, onCancel }) {
    const [readToEnd, setReadToEnd] = (0, import_react6.useState)(false);
    const [accepted, setAccepted] = (0, import_react6.useState)(false);
    const [busy, setBusy] = (0, import_react6.useState)(false);
    const [error, setError] = (0, import_react6.useState)("");
    const submitting = (0, import_react6.useRef)(false);
    async function continueToVerification(event) {
      event.preventDefault();
      if (!readToEnd || !accepted || submitting.current) return;
      submitting.current = true;
      setBusy(true);
      setError("");
      try {
        const result2 = await apiRequest("/auth/member-terms", {
          method: "POST",
          body: JSON.stringify({ termsTicket: ticket, accepted, version: MEMBER_TERMS_VERSION })
        });
        if (!result2.challenge) throw new Error("Unable to start facial verification. Please sign in again.");
        onAccepted(result2.challenge);
      } catch (cause) {
        setError(cause.code === "INVALID_VERIFICATION" ? "This sign-in step expired. Return to login and enter your credentials again." : cause.message);
      } finally {
        submitting.current = false;
        setBusy(false);
      }
    }
    return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Dialog, { title: "Member Terms and Conditions", onClose: onCancel, busy, children: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("form", { className: "member-terms", onSubmit: continueToVerification, children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("p", { className: "modal-copy", id: "member-terms-instructions", children: [
        "Effective date ",
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("time", { dateTime: MEMBER_TERMS_VERSION, children: formatDate(MEMBER_TERMS_VERSION) }),
        ".",
        " ",
        "Scroll to the end before accepting."
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
        "div",
        {
          className: "member-terms-scroll clay-in",
          role: "region",
          "aria-label": "Terms and Conditions text",
          "aria-describedby": "member-terms-instructions",
          tabIndex: 0,
          "data-autofocus": true,
          onScroll: ({ currentTarget }) => {
            if (currentTarget.scrollHeight - currentTarget.clientHeight - currentTarget.scrollTop <= 2)
              setReadToEnd(true);
          },
          children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("ol", { children: sections.map(([title, text]) => /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("li", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h3", { children: title }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { children: text })
          ] }, title)) })
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("label", { className: "member-terms-accept", children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
          "input",
          {
            type: "checkbox",
            disabled: !readToEnd || busy,
            checked: accepted,
            onChange: (event) => setAccepted(event.target.checked)
          }
        ),
        "I have read and accept the Terms and Conditions."
      ] }),
      error && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: "reset-error", role: "alert", children: error }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "ma", children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { className: "btn ghost cancel-button", type: "button", disabled: busy, onClick: onCancel, children: "Cancel" }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { className: "btn", type: "submit", disabled: !readToEnd || !accepted || busy, children: busy ? "Continuing\u2026" : "Continue to facial verification" })
      ] })
    ] }) });
  }
  var import_react6, import_jsx_runtime6, sections;
  var init_MemberTerms = __esm({
    "src/components/MemberTerms.jsx"() {
      init_define_import_meta_env();
      import_react6 = __toESM(require_react(), 1);
      init_formatDate();
      init_memberTerms();
      init_api();
      init_Dialog();
      import_jsx_runtime6 = __toESM(require_jsx_runtime(), 1);
      sections = [
        ["Acceptance of Terms", "These terms apply to your FitPulse membership and use of the gym. By accepting them, you agree to follow these terms and the rules communicated by gym staff."],
        ["Membership and Account", "Provide accurate account information and keep it current. Your membership, password, and QR pass are for your own use. Contact the front desk if you suspect someone has used your account."],
        ["Payments (Cash and GCash) and Membership Validity", "FitPulse accepts cash and GCash. Keep proof of payment and report any discrepancy to the front desk. Your membership is valid for the start and end dates shown in your account. Renew it to continue using facilities after it expires."],
        ["Facial Recognition and Personal Data (Privacy)", "FitPulse uses facial recognition to verify your identity when you sign in. The sign-in images are processed for verification. FitPulse keeps a facial template for future checks. Contact the front desk to ask how your data is handled or to submit a privacy request."],
        ["Use of Facilities and Equipment", "Follow posted instructions and directions from gym staff. Use equipment safely, return it after use, and report damaged equipment or injuries immediately."],
        ["Code of Conduct", "Treat staff and other members with respect. Harassment, threats, and conduct that endangers others are prohibited. Respect other members\u2019 privacy."],
        ["Suspension and Termination", "FitPulse may suspend or end access for serious or repeated violations of these terms or for conduct that puts people or property at risk. Contact the front desk with questions about a decision or your membership status."],
        ["Changes to the Terms", "FitPulse may update these terms. The updated terms will show a new effective date. Review and accept the current terms when prompted to continue signing in."],
        ["Contact Information", "Contact the FitPulse Gym front desk for membership, payment, account, or privacy questions."]
      ];
    }
  });

  // src/components/IdentityCamera.css
  var init_IdentityCamera = __esm({
    "src/components/IdentityCamera.css"() {
    }
  });

  // src/components/IdentityCamera.jsx
  function photograph(video, width = 640, quality = 0.76) {
    if (!video?.videoWidth || !video?.videoHeight) return null;
    const canvas = document.createElement("canvas");
    canvas.width = Math.min(width, video.videoWidth);
    canvas.height = Math.round(video.videoHeight * canvas.width / video.videoWidth);
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", quality);
  }
  function signature(video) {
    if (!video?.videoWidth) return null;
    const canvas = document.createElement("canvas");
    canvas.width = 48;
    canvas.height = 30;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(video, 0, 0, 48, 30);
    const pixels = ctx.getImageData(0, 0, 48, 30).data;
    const result2 = new Float32Array(48 * 30);
    for (let i = 0; i < result2.length; i++) result2[i] = 0.299 * pixels[i * 4] + 0.587 * pixels[i * 4 + 1] + 0.114 * pixels[i * 4 + 2];
    return result2;
  }
  function changeFromPrevious(current, last) {
    if (!current || !last) return Infinity;
    let change = 0;
    for (let i = 0; i < current.length; i++) change += Math.abs(current[i] - last[i]);
    return change / current.length;
  }
  function IdentityCamera({ instruction, facingMode = "user", onCapture, disabled = false, overlay = "", side = "", captureLabel = "Capture photo", guide = null, autoCapture = false }) {
    const video = (0, import_react7.useRef)(null);
    const stream = (0, import_react7.useRef)(null);
    const motion = (0, import_react7.useRef)({ neutral: null, turned: null, count: 0, yaw: null, lastSignature: null, steady: 0 });
    const captureSent = (0, import_react7.useRef)(false);
    const onCaptureRef = (0, import_react7.useRef)(onCapture);
    onCaptureRef.current = onCapture;
    const autoCaptureRef = (0, import_react7.useRef)(autoCapture);
    autoCaptureRef.current = autoCapture;
    const [error, setError] = (0, import_react7.useState)("");
    const [devices, setDevices] = (0, import_react7.useState)([]);
    const [deviceId, setDeviceId] = (0, import_react7.useState)("");
    const [ready, setReady] = (0, import_react7.useState)(false);
    const [liveReady, setLiveReady] = (0, import_react7.useState)(false);
    const [liveMessage, setLiveMessage] = (0, import_react7.useState)("Starting live image check\u2026");
    (0, import_react7.useEffect)(() => {
      let active = true;
      setReady(false);
      setError("");
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Camera access needs HTTPS or localhost and a supported browser.");
        return;
      }
      const start = async () => {
        try {
          const current = await navigator.mediaDevices.getUserMedia({ audio: false, video: deviceId ? { deviceId: { exact: deviceId } } : { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 720 } } });
          if (!active) {
            current.getTracks().forEach((t) => t.stop());
            return;
          }
          stream.current = current;
          if (video.current) {
            video.current.srcObject = current;
            await video.current.play();
          }
          if (active) {
            setReady(true);
            const cameras = await navigator.mediaDevices.enumerateDevices();
            if (active) setDevices(cameras.filter((d) => d.kind === "videoinput"));
          }
        } catch {
          if (active) setError("Unable to access camera. Check browser permission and camera selection.");
        }
      };
      void start();
      return () => {
        active = false;
        stream.current?.getTracks().forEach((t) => t.stop());
        stream.current = null;
      };
    }, [deviceId, facingMode]);
    const guideType = guide?.type;
    const guideStage = guide?.stage;
    const guideTicket = guide?.ticket;
    const guideChallenge = guide?.challenge;
    const guideToken = guide?.token;
    const oppositeYaw = guide?.oppositeYaw;
    (0, import_react7.useEffect)(() => {
      captureSent.current = false;
    }, [guideType, guideStage, guideTicket, guideChallenge, deviceId]);
    (0, import_react7.useEffect)(() => {
      motion.current = { neutral: null, turned: null, count: 0, yaw: null, lastSignature: null, steady: 0 };
      setLiveReady(!guideType);
      setLiveMessage("Starting live image check\u2026");
      if (!ready || !guideType || disabled) return;
      let active = true;
      let polling = false;
      const endpoint = guideType === "id" ? "/admin/identity/id-guidance" : guideChallenge ? "/auth/face-guidance" : "/admin/identity/face-guidance";
      const captureAutomatically = (evidence = null) => {
        if (!autoCaptureRef.current || captureSent.current || !active || disabled) return;
        const image = photograph(video.current, 1280, 0.87);
        if (!image) return;
        captureSent.current = true;
        setLiveMessage("Captured automatically. Processing\u2026");
        onCaptureRef.current(image, evidence);
      };
      const poll = async () => {
        if (!active || polling || captureSent.current || !video.current?.videoWidth) return;
        polling = true;
        const photo = photograph(video.current, 640, 0.72);
        if (!photo) {
          polling = false;
          return;
        }
        try {
          const result2 = await apiRequest(endpoint, {
            ...guideToken ? { token: guideToken } : {},
            method: "POST",
            body: JSON.stringify({ image: photo, ...guideTicket ? { ticket: guideTicket } : {}, ...guideChallenge ? { challenge: guideChallenge } : {} })
          });
          if (!active) return;
          const state = motion.current;
          if (guideType === "id") {
            const next = signature(video.current);
            const delta = changeFromPrevious(next, state.lastSignature);
            state.lastSignature = next;
            state.steady = result2.ready && delta < 7.5 ? state.steady + 1 : 0;
            const stable = state.steady >= 2;
            setLiveReady(stable);
            setLiveMessage(!result2.ready ? result2.message : stable ? "All checks passed. Capturing automatically\u2026" : "Hold still\u2026 Checking focus and movement.");
            if (stable) captureAutomatically();
          } else if (!result2.found || !Number.isFinite(result2.yaw)) {
            state.count = 0;
            setLiveReady(false);
            setLiveMessage(result2.message || "Move closer so your face is visible.");
          } else {
            const angle = result2.yaw;
            if (guideStage === "front") {
              state.count = Math.abs(angle) < 0.15 ? state.count + 1 : 0;
              setLiveReady(state.count >= 2);
              setLiveMessage(state.count >= 2 ? "Face aligned. Capturing automatically\u2026" : "Look straight into the camera and hold still.");
              if (state.count >= 2) captureAutomatically();
            } else if (!state.neutral) {
              if (Math.abs(angle) < 0.13) {
                state.neutral = photo;
                setLiveMessage(`Face centered. Now turn ${guideStage.toUpperCase()} slowly.`);
              } else setLiveMessage("Look straight at the camera first, then turn your head.");
            } else {
              const turned = Math.abs(angle) > 0.2;
              const opposite = oppositeYaw == null || angle * oppositeYaw < 0;
              if (turned && opposite) {
                state.count++;
                state.turned = photo;
                state.yaw = angle;
                setLiveReady(state.count >= 2);
                setLiveMessage(state.count >= 2 ? "Motion confirmed. Capturing automatically\u2026" : "Turn detected. Hold still\u2026");
                if (state.count >= 2) captureAutomatically({ neutral: state.neutral, turned: state.turned, yaw: state.yaw });
              } else {
                state.count = 0;
                state.turned = null;
                setLiveReady(false);
                setLiveMessage(turned && !opposite ? "Turn the opposite direction from your first scan." : `Turn your head ${guideStage.toUpperCase()} and hold still.`);
              }
            }
          }
        } catch (cause) {
          if (active) {
            setLiveReady(false);
            setLiveMessage(cause?.message || "Live check is unavailable. Please check the backend.");
          }
        } finally {
          polling = false;
        }
      };
      void poll();
      const interval = setInterval(poll, 1150);
      return () => {
        active = false;
        clearInterval(interval);
      };
    }, [ready, disabled, guideType, guideStage, guideTicket, guideChallenge, guideToken, oppositeYaw]);
    const capture = () => {
      if (!ready || disabled || captureSent.current || !video.current || guideType && !liveReady) return;
      const photo = photograph(video.current, 1280, 0.87);
      if (!photo) return;
      const evidence = guideType === "face" && guideStage !== "front" ? { neutral: motion.current.neutral, turned: motion.current.turned, yaw: motion.current.yaw } : null;
      captureSent.current = true;
      onCaptureRef.current(photo, evidence);
    };
    return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: `fitpulse-identity-camera ${overlay ? `fp-camera-${overlay}` : ""}`, children: [
      devices.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("label", { className: "field", children: [
        "Camera",
        /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("select", { className: "clay-in", value: deviceId, onChange: (event) => setDeviceId(event.target.value), disabled, children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("option", { value: "", children: "Default camera" }),
          devices.map((d, i) => /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("option", { value: d.deviceId, children: d.label || `Camera ${i + 1}` }, d.deviceId))
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "fp-camera-preview", children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("video", { ref: video, autoPlay: true, muted: true, playsInline: true, style: { transform: facingMode === "user" ? "scaleX(-1)" : void 0 }, "aria-label": "Live identity camera preview" }),
        overlay && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "fp-camera-guides", "aria-hidden": "true", children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "fp-camera-live", children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: "fp-live-dot" }),
            " LIVE \xB7 ",
            side ? `${side.toUpperCase()} of ID` : "Face motion check"
          ] }),
          overlay === "id" ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "fp-id-frame" }) : /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "fp-face-oval" }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { children: instruction })
        ] })
      ] }),
      guideType && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: `fp-live-feedback ${liveReady ? "is-ready" : ""}`, role: "status", "aria-live": "polite", children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: "fp-live-pulse" }),
        liveMessage
      ] }),
      !overlay && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { className: "form-help", children: instruction }),
      error && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { className: "form-error", role: "alert", children: error }),
      autoCapture ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { className: "fp-auto-capture-status", role: "status", children: captureSent.current ? "Photo captured automatically." : "Auto-capture is on. Follow the live instructions; no button press needed." }) : /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("button", { className: "btn", type: "button", disabled: !ready || disabled || captureSent.current || Boolean(guideType) && !liveReady, onClick: capture, children: !ready ? "Starting camera\u2026" : guideType && !liveReady ? "Checking live view\u2026" : captureLabel })
    ] });
  }
  var import_react7, import_jsx_runtime7;
  var init_IdentityCamera2 = __esm({
    "src/components/IdentityCamera.jsx"() {
      init_define_import_meta_env();
      import_react7 = __toESM(require_react(), 1);
      init_api();
      init_IdentityCamera();
      import_jsx_runtime7 = __toESM(require_jsx_runtime(), 1);
    }
  });

  // src/components/VerificationFlow.css
  var init_VerificationFlow = __esm({
    "src/components/VerificationFlow.css"() {
    }
  });

  // src/components/FacialLoginChallenge.jsx
  var FacialLoginChallenge_exports = {};
  __export(FacialLoginChallenge_exports, {
    default: () => FacialLoginChallenge
  });
  function FacialLoginChallenge({ challenge, onVerified, onCancel }) {
    const [stage, setStage] = (0, import_react8.useState)("right");
    const [frames, setFrames] = (0, import_react8.useState)({});
    const [motion, setMotion] = (0, import_react8.useState)({});
    const [busy, setBusy] = (0, import_react8.useState)(false);
    const [error, setError] = (0, import_react8.useState)("");
    const capture = async (image, evidence) => {
      setError("");
      if (stage === "right" || stage === "left") {
        if (!evidence?.neutral || !evidence?.turned) {
          setError("Complete the live movement before capturing.");
          return;
        }
        setMotion((old) => ({ ...old, [stage]: evidence }));
        setFrames((old) => ({ ...old, [stage]: image }));
        setStage(stage === "right" ? "left" : "front");
        return;
      }
      setBusy(true);
      try {
        const session = await apiRequest("/auth/face-login", {
          method: "POST",
          body: JSON.stringify({ challenge, frames: { ...frames, front: image }, motion })
        });
        if (!session?.token || !session?.user) throw new Error("Facial login did not return a session.");
        onVerified(session);
      } catch (cause) {
        setError(cause.message || "Facial verification failed.");
        setFrames({});
        setMotion({});
        setStage("right");
      } finally {
        setBusy(false);
      }
    };
    const activeIndex = STAGES.findIndex((item) => item.id === stage);
    const instruction = stage === "right" ? "Fit your face inside the oval, turn RIGHT, and hold still for automatic capture." : stage === "left" ? "Keep your face inside the oval, turn LEFT, and hold still for automatic capture." : "Look STRAIGHT at the camera for automatic final face matching.";
    return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(Dialog, { title: "Facial Recognition Login Security", busy, onClose: onCancel, className: "fitpulse-face-login-dialog fp-verification-dialog", children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("p", { className: "fp-verification-subtitle", children: [
        "Face check \xB7 Step ",
        activeIndex + 1,
        " of 3"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "fp-verification-progress", "aria-label": "Facial login steps", children: STAGES.map(({ id, title }, i) => /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: `fp-verification-progress-item ${i === activeIndex ? "is-current" : ""} ${i < activeIndex ? "is-complete" : ""}`, "aria-current": i === activeIndex ? "step" : void 0, children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "fp-verification-track" }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { children: title })
      ] }, id)) }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "fp-verification-content", children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("h3", { children: STAGES[activeIndex].title }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: "fp-verification-hint", children: "Your face must match the registered member's facial template. Complete both head turns and a frontal capture." }),
        error && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: "form-error", role: "alert", children: error }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(IdentityCamera, { autoCapture: true, disabled: busy, overlay: "face", guide: { type: "face", stage, challenge, oppositeYaw: stage === "left" ? motion.right?.yaw : void 0 }, instruction, captureLabel: stage === "front" ? "Verify face and log in" : `Capture ${stage} turn`, onCapture: capture }, stage),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "fp-verification-checks", children: [
          /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: frames.right ? "done" : stage === "right" ? "current" : "", children: [
            frames.right ? "\u2713" : "\u25CB",
            " Right turn"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: frames.left ? "done" : stage === "left" ? "current" : "", children: [
            frames.left ? "\u2713" : "\u25CB",
            " Left turn"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: stage === "front" ? "current" : "", children: "\u25CB Normal view" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "fp-verification-footer", children: [
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { children: "All captures are checked by the server before sign-in." }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("button", { className: "btn ghost", type: "button", disabled: busy, onClick: onCancel, children: "Cancel login" }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("button", { className: "btn ghost", type: "button", disabled: busy, onClick: () => {
            setStage("right");
            setFrames({});
            setMotion({});
            setError("");
          }, children: "Restart scan" })
        ] })
      ] })
    ] });
  }
  var import_react8, import_jsx_runtime8, STAGES;
  var init_FacialLoginChallenge = __esm({
    "src/components/FacialLoginChallenge.jsx"() {
      init_define_import_meta_env();
      import_react8 = __toESM(require_react(), 1);
      init_Dialog();
      init_IdentityCamera2();
      init_api();
      init_VerificationFlow();
      import_jsx_runtime8 = __toESM(require_jsx_runtime(), 1);
      STAGES = [
        { id: "right", title: "Turn right" },
        { id: "left", title: "Turn left" },
        { id: "front", title: "Look forward" }
      ];
    }
  });

  // shared/passwordPolicy.js
  function passwordPolicy(password) {
    return typeof password === "string" && password.length >= MIN_PASSWORD_LENGTH && password.length <= MAX_PASSWORD_LENGTH && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password) && /[\p{P}\p{S}]/u.test(password);
  }
  var MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH, passwordPolicyMessage;
  var init_passwordPolicy = __esm({
    "shared/passwordPolicy.js"() {
      init_define_import_meta_env();
      MIN_PASSWORD_LENGTH = 12;
      MAX_PASSWORD_LENGTH = 16;
      passwordPolicyMessage = "Use 12\u201316 characters with an uppercase letter, a lowercase letter, a number, and a symbol.";
    }
  });

  // src/components/PasswordToggle.css
  var init_PasswordToggle = __esm({
    "src/components/PasswordToggle.css"() {
    }
  });

  // src/components/PasswordToggle.jsx
  function PasswordToggle({
    visible,
    onToggle,
    disabled = false,
    label = "password"
  }) {
    return /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
      "button",
      {
        className: "password-toggle",
        type: "button",
        disabled,
        onClick: onToggle,
        "aria-label": `${visible ? "Hide" : "Show"} ${label}`,
        "aria-pressed": visible,
        children: /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(
          "svg",
          {
            width: "20",
            height: "20",
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: "1.8",
            strokeLinecap: "round",
            strokeLinejoin: "round",
            "aria-hidden": "true",
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("path", { d: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" }),
              /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("circle", { cx: "12", cy: "12", r: "3" }),
              visible && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("path", { d: "m3 3 18 18" })
            ]
          }
        )
      }
    );
  }
  var import_jsx_runtime10;
  var init_PasswordToggle2 = __esm({
    "src/components/PasswordToggle.jsx"() {
      init_define_import_meta_env();
      init_PasswordToggle();
      import_jsx_runtime10 = __toESM(require_jsx_runtime(), 1);
    }
  });

  // src/pages/ResetPassword.jsx
  var ResetPassword_exports = {};
  __export(ResetPassword_exports, {
    default: () => ResetPassword
  });
  function ResetPassword({ navigate }) {
    const [token] = (0, import_react10.useState)(() => new URLSearchParams(window.location.hash.slice(1)).get("token"));
    const [deadline, setDeadline] = (0, import_react10.useState)(null);
    const [seconds, setSeconds] = (0, import_react10.useState)(null);
    const [linkStatus, setLinkStatus] = (0, import_react10.useState)(token ? "checking" : "expired");
    const [password, setPassword] = (0, import_react10.useState)("");
    const [confirmPassword, setConfirmPassword] = (0, import_react10.useState)("");
    const [message, setMessage] = (0, import_react10.useState)("");
    const [error, setError] = (0, import_react10.useState)("");
    const [pending, setPending] = (0, import_react10.useState)(false);
    const [visible, setVisible] = (0, import_react10.useState)({ password: false, confirmPassword: false });
    const expired = linkStatus === "expired" || seconds === 0;
    const disabled = pending || linkStatus !== "ready" || expired || Boolean(message);
    (0, import_react10.useEffect)(() => {
      if (!token) return;
      const controller = new AbortController();
      const requestedAt = performance.now();
      async function checkLink() {
        try {
          const { expiresAt, serverNow } = await apiRequest("/auth/reset-password/session", {
            method: "POST",
            body: JSON.stringify({ token }),
            signal: controller.signal
          });
          if (controller.signal.aborted) return;
          if (!Number.isFinite(expiresAt) || !Number.isFinite(serverNow)) {
            throw new Error("FitPulse could not verify the reset link.");
          }
          const nextDeadline = requestedAt + expiresAt - serverNow;
          const remaining = Math.max(0, Math.ceil((nextDeadline - performance.now()) / 1e3));
          setDeadline(nextDeadline);
          setSeconds(remaining);
          setLinkStatus("ready");
        } catch (cause) {
          if (controller.signal.aborted) return;
          setLinkStatus(cause.status === 410 ? "expired" : "unavailable");
          if (cause.status !== 410) setError(cause.message);
        }
      }
      void checkLink();
      return () => controller.abort();
    }, [token]);
    (0, import_react10.useEffect)(() => {
      if (deadline === null || expired || message) return;
      const tick = () => setSeconds(Math.max(0, Math.ceil((deadline - performance.now()) / 1e3)));
      const timer = window.setInterval(tick, 250);
      document.addEventListener("visibilitychange", tick);
      return () => {
        window.clearInterval(timer);
        document.removeEventListener("visibilitychange", tick);
      };
    }, [deadline, expired, message]);
    const submit = async (event) => {
      event.preventDefault();
      if (disabled) return;
      if (performance.now() >= deadline) {
        setSeconds(0);
        return;
      }
      setError("");
      setMessage("");
      const { password: password2, confirmPassword: confirmPassword2 } = Object.fromEntries(new FormData(event.currentTarget));
      if (!passwordPolicy(password2)) {
        setError(passwordPolicyMessage);
        return;
      }
      if (password2 !== confirmPassword2) {
        setError("The passwords do not match.");
        return;
      }
      setPending(true);
      try {
        const result2 = await apiRequest("/auth/reset-password", {
          method: "POST",
          body: JSON.stringify({ token, password: password2, confirmPassword: confirmPassword2 })
        });
        setPassword("");
        setConfirmPassword("");
        setVisible({ password: false, confirmPassword: false });
        setMessage(result2.message);
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (cause) {
        if (cause.status === 410) setLinkStatus("expired");
        else setError(cause.message || "Unable to reset your password.");
      } finally {
        setPending(false);
      }
    };
    return /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("main", { id: "login", children: /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("section", { className: "lform clay reset-page", children: [
      /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "fhead", children: [
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("h1", { children: "Change password" }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { children: passwordPolicyMessage })
      ] }),
      linkStatus === "checking" && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { role: "status", children: "Checking reset link\u2026" }),
      !message && (seconds !== null || expired) && /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("p", { className: "reset-countdown", role: "timer", children: [
        "Link expires in 00:",
        String(expired ? 0 : seconds).padStart(2, "0")
      ] }),
      !message && expired && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { className: "err show", role: "alert", children: "This link has expired or already been used." }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("form", { onSubmit: submit, "aria-busy": pending, children: [
        /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("label", { className: "auth-field", children: [
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: "input-label", children: "New password" }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("span", { className: "inp", children: [
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
              "input",
              {
                "aria-label": "New password",
                name: "password",
                autoComplete: "new-password",
                type: visible.password ? "text" : "password",
                value: password,
                onChange: (event) => setPassword(event.target.value),
                minLength: MIN_PASSWORD_LENGTH,
                maxLength: MAX_PASSWORD_LENGTH,
                placeholder: "New password",
                required: true,
                disabled
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
              PasswordToggle,
              {
                visible: visible.password,
                label: "new password",
                disabled,
                onToggle: () => setVisible((previous) => ({ ...previous, password: !previous.password }))
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("label", { className: "auth-field", children: [
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: "input-label", children: "Confirm new password" }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("span", { className: "inp", children: [
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
              "input",
              {
                "aria-label": "Confirm new password",
                name: "confirmPassword",
                autoComplete: "new-password",
                type: visible.confirmPassword ? "text" : "password",
                value: confirmPassword,
                onChange: (event) => setConfirmPassword(event.target.value),
                minLength: MIN_PASSWORD_LENGTH,
                maxLength: MAX_PASSWORD_LENGTH,
                placeholder: "Confirm new password",
                required: true,
                disabled
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
              PasswordToggle,
              {
                visible: visible.confirmPassword,
                label: "confirm new password",
                disabled,
                onToggle: () => setVisible((previous) => ({
                  ...previous,
                  confirmPassword: !previous.confirmPassword
                }))
              }
            )
          ] })
        ] }),
        error && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { className: "err show", role: "alert", children: error }),
        message && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { role: "status", children: message }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("button", { className: "btn lbtn", disabled, children: [
          pending && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Spinner, {}),
          pending ? "Updating..." : "Update password"
        ] })
      ] }),
      message && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("button", { className: "btn ghost", type: "button", onClick: () => navigate("login"), children: "Back to login" }),
      !message && (expired || linkStatus === "unavailable" || error) && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("button", { className: "btn ghost", type: "button", onClick: () => navigate("forgot-password"), children: "Request a new link" })
    ] }) });
  }
  var import_react10, import_jsx_runtime11;
  var init_ResetPassword = __esm({
    "src/pages/ResetPassword.jsx"() {
      init_define_import_meta_env();
      import_react10 = __toESM(require_react(), 1);
      init_api();
      init_passwordPolicy();
      init_PasswordToggle2();
      init_Spinner();
      init_Login();
      import_jsx_runtime11 = __toESM(require_jsx_runtime(), 1);
    }
  });

  // src/components/PasswordChangeForm.jsx
  function PasswordChangeForm() {
    const { token, login } = useAuth();
    const helpId = (0, import_react11.useId)();
    const [values, setValues] = (0, import_react11.useState)({ currentPassword: "", password: "", confirmPassword: "" });
    const [visible, setVisible] = (0, import_react11.useState)({});
    const [pending, setPending] = (0, import_react11.useState)(false);
    const [error, setError] = (0, import_react11.useState)("");
    const [message, setMessage] = (0, import_react11.useState)("");
    const submit = async (event) => {
      event.preventDefault();
      if (pending) return;
      setError("");
      setMessage("");
      const { currentPassword, password, confirmPassword } = Object.fromEntries(new FormData(event.currentTarget));
      if (!passwordPolicy(password)) {
        setError(passwordPolicyMessage);
        return;
      }
      if (password !== confirmPassword) {
        setError("The new passwords do not match.");
        return;
      }
      if (password === currentPassword) {
        setError("Choose a password different from your current password.");
        return;
      }
      setPending(true);
      try {
        const result2 = await apiRequest("/profile/change-password", {
          token,
          method: "POST",
          body: JSON.stringify({ currentPassword, password, confirmPassword })
        });
        if (result2.session) login(result2.session);
        setValues({ currentPassword: "", password: "", confirmPassword: "" });
        setVisible({});
        setMessage("Password updated. Use your new password the next time you log in.");
      } catch (cause) {
        setError(cause.message || "Could not update your password.");
      } finally {
        setPending(false);
      }
    };
    return /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("form", { className: "mf password-form", onSubmit: submit, "aria-busy": pending, children: [
      /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("p", { id: helpId, className: "form-help", children: [
        passwordPolicyMessage,
        " Your current password is required."
      ] }),
      [
        ["currentPassword", "Current password"],
        ["password", "New password"],
        ["confirmPassword", "Confirm new password"]
      ].map(([name, label]) => /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("label", { className: "field", children: [
        label,
        /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("span", { className: "password-control", children: [
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
            "input",
            {
              className: "clay-in",
              name,
              type: visible[name] ? "text" : "password",
              autoComplete: name === "currentPassword" ? "current-password" : "new-password",
              required: true,
              minLength: name === "currentPassword" ? void 0 : MIN_PASSWORD_LENGTH,
              maxLength: name === "currentPassword" ? 72 : MAX_PASSWORD_LENGTH,
              "aria-describedby": helpId,
              value: values[name],
              disabled: pending,
              onChange: (event) => {
                setValues((previous) => ({ ...previous, [name]: event.target.value }));
                setError("");
                setMessage("");
              }
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
            PasswordToggle,
            {
              visible: Boolean(visible[name]),
              disabled: pending,
              label: label.toLowerCase(),
              onToggle: () => setVisible((previous) => ({ ...previous, [name]: !previous[name] }))
            }
          )
        ] })
      ] }, name)),
      error && /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("p", { className: "form-error", role: "alert", children: error }),
      message && /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("p", { className: "form-success", role: "status", children: message }),
      /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("button", { className: "btn", type: "submit", disabled: pending, children: [
        pending && /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Spinner, {}),
        pending ? "Updating password..." : "Update password"
      ] })
    ] });
  }
  var import_react11, import_jsx_runtime12;
  var init_PasswordChangeForm = __esm({
    "src/components/PasswordChangeForm.jsx"() {
      init_define_import_meta_env();
      import_react11 = __toESM(require_react(), 1);
      init_AuthContext();
      init_api();
      init_passwordPolicy();
      init_PasswordToggle2();
      init_Spinner();
      import_jsx_runtime12 = __toESM(require_jsx_runtime(), 1);
    }
  });

  // src/styles/dashboard-features.css
  var init_dashboard_features = __esm({
    "src/styles/dashboard-features.css"() {
    }
  });

  // src/pages/ChangePasswordPage.css
  var init_ChangePasswordPage = __esm({
    "src/pages/ChangePasswordPage.css"() {
    }
  });

  // src/pages/ChangePasswordPage.jsx
  var ChangePasswordPage_exports = {};
  __export(ChangePasswordPage_exports, {
    default: () => ChangePasswordPage
  });
  function ChangePasswordPage({ onSignOut }) {
    return /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("main", { className: "app password-gate", children: /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("section", { className: "card clay", children: [
      /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("h1", { children: "Change password" }),
      /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("p", { className: "form-help", children: "Choose your own password before continuing to FitPulse." }),
      /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(PasswordChangeForm, {}),
      /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("button", { className: "btn ghost", type: "button", onClick: onSignOut, children: "Sign out" })
    ] }) });
  }
  var import_jsx_runtime13;
  var init_ChangePasswordPage2 = __esm({
    "src/pages/ChangePasswordPage.jsx"() {
      init_define_import_meta_env();
      init_PasswordChangeForm();
      init_dashboard_features();
      init_ChangePasswordPage();
      import_jsx_runtime13 = __toESM(require_jsx_runtime(), 1);
    }
  });

  // src/components/ProfileAvatar.jsx
  function ProfileAvatar({ user: user2, large = false, memberId }) {
    const { token } = useAuth();
    const [image, setImage] = (0, import_react12.useState)("");
    const [inView, setInView] = (0, import_react12.useState)(!memberId);
    const avatar = (0, import_react12.useRef)(null);
    (0, import_react12.useEffect)(() => {
      if (inView || !user2?.avatarId) return;
      if (typeof IntersectionObserver === "undefined") {
        setInView(true);
        return;
      }
      const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) setInView(true);
      }, { rootMargin: "160px" });
      observer.observe(avatar.current);
      return () => observer.disconnect();
    }, [inView, user2?.avatarId]);
    (0, import_react12.useEffect)(() => {
      setImage("");
      if (!inView || !token || !user2?.avatarId) return;
      const controller = new AbortController();
      let url = "";
      apiResponse(memberId ? `/members/${encodeURIComponent(memberId)}/avatar` : "/profile/avatar", {
        token,
        signal: controller.signal
      }).then((response) => response.blob()).then((blob) => {
        if (controller.signal.aborted) return;
        url = URL.createObjectURL(blob);
        setImage(url);
      }).catch((error) => {
        if (!controller.signal.aborted && error.status !== 404)
          console.warn("Could not load a FitPulse profile photo:", error.message);
      });
      return () => {
        controller.abort();
        if (url) URL.revokeObjectURL(url);
      };
    }, [inView, token, user2?.avatarId, memberId]);
    const initials = (user2?.name || "FitPulse User").trim().split(/\s+/).map((part) => part[0]).join("").slice(0, 2);
    return /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("span", { ref: avatar, className: `av${large ? " profile-avatar" : ""}`, children: image ? /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("img", { src: image, alt: "", width: 256, height: 256, decoding: "async", onError: () => setImage("") }) : initials });
  }
  var import_react12, import_jsx_runtime14;
  var init_ProfileAvatar = __esm({
    "src/components/ProfileAvatar.jsx"() {
      init_define_import_meta_env();
      import_react12 = __toESM(require_react(), 1);
      init_AuthContext();
      init_api();
      import_jsx_runtime14 = __toESM(require_jsx_runtime(), 1);
    }
  });

  // src/assets/db-day-v.webp
  var db_day_v_default;
  var init_db_day_v = __esm({
    "src/assets/db-day-v.webp"() {
      db_day_v_default = "data:image/webp;base64,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";
    }
  });

  // src/assets/db-night-v.webp
  var db_night_v_default;
  var init_db_night_v = __esm({
    "src/assets/db-night-v.webp"() {
      db_night_v_default = "data:image/webp;base64,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";
    }
  });

  // src/components/DashboardShell.css
  var init_DashboardShell = __esm({
    "src/components/DashboardShell.css"() {
    }
  });

  // src/components/gorilla/GorillaArt.jsx
  function GorillaArt({ mood = "wink" }) {
    return /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("svg", { viewBox: "0 0 120 114", "aria-hidden": "true", className: "rocky-art", children: [
      /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
        "path",
        {
          d: "M86 91c24 11 34-5 25-14-4-4-10-1-10 4",
          fill: "none",
          stroke: "#905538",
          strokeWidth: "7",
          strokeLinecap: "round"
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
        "path",
        {
          d: "M40 69q20-13 41 0l10 27q-4 11-31 11t-31-11Z",
          fill: "var(--navy, #003049)",
          stroke: "#567284",
          strokeWidth: "2"
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("path", { d: "M44 72q15 14 31 0", fill: "none", stroke: "#7995a5", strokeWidth: "2.5" }),
      /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
        "path",
        {
          d: "M36 84h5l3-4 3 8 3-4h6",
          fill: "none",
          stroke: "var(--orange, #f77f00)",
          strokeWidth: "2.5",
          strokeLinecap: "round",
          strokeLinejoin: "round"
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("g", { fill: "#a56b45", stroke: "#683923", strokeWidth: "2", children: [
        /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("circle", { cx: "26", cy: "43", r: "13" }),
        /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("circle", { cx: "94", cy: "43", r: "13" }),
        /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("path", { d: "M31 44c0-20 10-33 22-34 4-7 14-8 19-5l-4 5c14 5 21 16 21 34 0 21-12 32-29 32S31 65 31 44Z" }),
        /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("path", { d: "M33 75q-15 3-15 15 1 8 12 9l7-8q-13-4-4-9Z" }),
        /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("path", { d: "M86 74q13 3 14 14 0 10-11 11l-4-9q8-2 1-9Z" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("g", { fill: "#db946c", children: [
        /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("circle", { cx: "27", cy: "43", r: "7" }),
        /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("circle", { cx: "93", cy: "43", r: "7" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
        "path",
        {
          d: "M36 46c0-12 6-18 14-18 5 0 9 3 10 6 3-3 6-6 11-6 8 0 13 6 13 18 0 4-1 8-4 11 2 11-8 17-20 17s-22-6-20-17c-2-3-4-7-4-11Z",
          fill: "#f5c390"
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
        "path",
        {
          d: "M31 24q28 10 57-1l3 11q-30 12-61 1Z",
          fill: "var(--orange, #f77f00)",
          stroke: "#a64c0a",
          strokeWidth: "1.5"
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("path", { d: "M33 27q28 10 54-1", fill: "none", stroke: "#ffd08a", strokeWidth: "2" }),
      /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
        "path",
        {
          d: "M89 28l14-8-1 8 8 4-16 2 8 6-7 2-8-10Z",
          fill: "var(--orange, #f77f00)",
          stroke: "#a64c0a",
          strokeWidth: "1.5",
          strokeLinejoin: "round"
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("path", { d: "M55 52q5-3 10 0l-2 3h-6Z", fill: "#9f583a" }),
      Object.entries(expressions).map(([name, face]) => /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)(
        "g",
        {
          className: "rocky-expression",
          "data-active": mood === name,
          fill: "none",
          stroke: "#512d22",
          strokeWidth: "2.8",
          strokeLinecap: "round",
          strokeLinejoin: "round",
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("path", { d: face.brows }),
            /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("g", { className: "rocky-eyes", children: [
              /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("path", { d: face.eyes }),
              name === "wink" && /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("ellipse", { cx: "48", cy: "47", rx: "3.4", ry: "4.2", fill: "#512d22", stroke: "none" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("path", { d: face.mouth, fill: name === "happy" ? "#512d22" : "none" })
          ]
        },
        name
      )),
      /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("g", { transform: "rotate(9 75 96)", children: [
        /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
          "rect",
          {
            x: "59",
            y: "79",
            width: "34",
            height: "29",
            rx: "4",
            fill: "#fff3d9",
            stroke: "#b67541",
            strokeWidth: "2"
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
          "path",
          {
            d: "M66 88h19m-19 6h16m-16 6h12",
            fill: "none",
            stroke: "#997457",
            strokeWidth: "1.6",
            strokeLinecap: "round"
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("path", { d: "M68 77h8v5h-8Z", fill: "#f1bc60" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
        "path",
        {
          d: "m27 94 20-16 4 4-19 17-7 2Z",
          fill: "#ffcf52",
          stroke: "#83441f",
          strokeWidth: "1.5",
          strokeLinejoin: "round"
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("path", { d: "m46 79 4-3 4 4-4 3Z", fill: "#f38470", stroke: "#83441f", strokeWidth: "1.2" }),
      /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("path", { d: "M23 91q6-4 10 0t-1 7q-6 3-9-1Z", fill: "#a56b45", stroke: "#683923", strokeWidth: "1.8" }),
      /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("path", { d: "M89 88q8-3 10 3t-7 7q-5-1-3-10Z", fill: "#a56b45", stroke: "#683923", strokeWidth: "1.8" })
    ] });
  }
  var import_jsx_runtime15, expressions;
  var init_GorillaArt = __esm({
    "src/components/gorilla/GorillaArt.jsx"() {
      init_define_import_meta_env();
      import_jsx_runtime15 = __toESM(require_jsx_runtime(), 1);
      expressions = {
        wink: {
          brows: "M43 37q5-4 10-1m13 0q5-3 10 1",
          eyes: "M65 47q5-4 10 0",
          mouth: "M52 59q8 8 16-1"
        },
        happy: {
          brows: "M43 36q5-4 10-1m13 0q5-3 10 1",
          eyes: "M43 47q5-7 10 0m13 0q5-7 10 0",
          mouth: "M51 57q9 8 18 0-2 11-9 11t-9-11Z"
        },
        angry: { brows: "m42 36 13 5m10 0 13-5", eyes: "M44 47h8m15 0h8", mouth: "M53 63q7-7 14 0" },
        worried: {
          brows: "M42 40q6-1 11-6m13 0q5 5 11 6",
          eyes: "M48 46v3m23-3v3",
          mouth: "M55 62q5-4 10 0"
        }
      };
    }
  });

  // src/components/gorilla/gorilla.css
  var init_gorilla = __esm({
    "src/components/gorilla/gorilla.css"() {
    }
  });

  // src/components/gorilla/GorillaAssistant.jsx
  var GorillaAssistant_exports = {};
  __export(GorillaAssistant_exports, {
    GorillaProvider: () => GorillaProvider,
    RockyDeleteError: () => RockyDeleteError,
    RockyNotificationButton: () => RockyNotificationButton,
    RockyPreference: () => RockyPreference,
    gorillaEvents: () => gorillaEvents,
    useGorilla: () => useGorilla
  });
  function useGorilla() {
    return (0, import_react13.useContext)(GorillaContext);
  }
  function RockyNotificationButton({ Icon: Icon3 }) {
    const rocky = useGorilla();
    if (!rocky) return null;
    return /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)(
      "button",
      {
        ref: rocky.bell,
        type: "button",
        className: "ib rocky-notification-button",
        "aria-label": rocky.unread ? `Notifications, ${rocky.unread} unread` : "Notifications",
        "aria-expanded": rocky.listOpen,
        "aria-controls": rocky.listOpen ? rocky.bubbleId : void 0,
        onClick: rocky.toggleList,
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(Icon3, { name: "bell" }),
          rocky.unread > 0 && /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { className: "rocky-unread", "aria-hidden": "true", children: rocky.unread > 99 ? "99+" : rocky.unread })
        ]
      }
    );
  }
  function RockyDeleteError({ message }) {
    const rocky = useGorilla();
    return /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { className: "form-error rocky-delete-error", role: "alert", children: [
      rocky?.enabled && /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(GorillaArt, { mood: "angry" }),
      /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { children: message })
    ] });
  }
  function RockyPreference() {
    const rocky = useGorilla();
    if (!rocky) return null;
    return /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("article", { className: "card clay rocky-preference", children: [
      /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("h2", { children: "Notifications" }),
      /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("label", { className: "set rocky-switch", "data-rocky-avoid": true, children: [
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { children: "Rocky" }),
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(
          "input",
          {
            type: "checkbox",
            role: "switch",
            checked: rocky.enabled,
            onChange: (event) => rocky.setEnabled(event.target.checked)
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("p", { children: "Choose Rocky or plain popups for your notifications." })
    ] });
  }
  function readPosition() {
    try {
      const position = JSON.parse(localStorage.getItem(STORAGE_KEY2));
      if (Number.isFinite(position?.x) && Number.isFinite(position?.y)) return position;
    } catch {
    }
    return null;
  }
  function readPreferences(key) {
    try {
      return JSON.parse(localStorage.getItem(key)) || {};
    } catch {
      return {};
    }
  }
  function storePreferences(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
    }
  }
  function viewport() {
    return {
      width: document.documentElement.clientWidth,
      height: window.innerHeight,
      mobile: window.matchMedia("(max-width: 768px)").matches,
      header: document.querySelector(".fitpulse-mobile-header")?.getBoundingClientRect(),
      bar: document.querySelector(".fitpulse-bottom-nav")?.getBoundingClientRect(),
      raised: document.querySelector(".fitpulse-nav-primary-icon")?.getBoundingClientRect()
    };
  }
  function constrain(position, view) {
    const x = clamp(position.x, MARGIN, view.width - SIZE - MARGIN);
    const overlapsCenter = view.raised && x < view.raised.right + MARGIN && x + SIZE > view.raised.left - MARGIN;
    const bottom = overlapsCenter ? view.raised.top : view.bar?.top ?? view.height;
    const lastRow = Math.max(MARGIN, bottom - SIZE - MARGIN);
    const firstRow = Math.min(lastRow, (view.header?.bottom ?? 0) + MARGIN);
    return { x, y: clamp(position.y, firstRow, lastRow) };
  }
  function avoidMobileActions(position, view) {
    const bounded = constrain(position, view);
    if (!view.mobile) return bounded;
    const controls = Array.from(document.querySelectorAll(
      ".fitpulse-mobile-scroll :is(button.btn, a.btn, [data-rocky-avoid])"
    ), (control) => control.getBoundingClientRect()).filter(
      (rect) => rect.width > 0 && rect.height > 0 && rect.bottom > (view.header?.bottom ?? 0) && rect.top < (view.bar?.top ?? view.height)
    );
    const overlaps = ({ x, y }) => controls.some(
      (rect) => x < rect.right && x + SIZE > rect.left && y < rect.bottom && y + SIZE > rect.top
    );
    if (!overlaps(bounded)) return bounded;
    const choices = controls.flatMap((rect) => [
      { x: rect.left - SIZE - MARGIN, y: bounded.y },
      { x: rect.right + MARGIN, y: bounded.y },
      { x: bounded.x, y: rect.top - SIZE - MARGIN },
      { x: bounded.x, y: rect.bottom + MARGIN }
    ]).map((choice) => constrain(choice, view)).filter((choice) => !overlaps(choice));
    const distance = (choice) => Math.hypot(choice.x - bounded.x, choice.y - bounded.y);
    return choices.sort((a, b) => distance(a) - distance(b))[0] || bounded;
  }
  function bubblePosition(position, view) {
    const width = Math.min(340, view.width - 32);
    const x = clamp(
      position.x + SIZE / 2 < view.width / 2 ? position.x : position.x + SIZE - width,
      16,
      view.width - width - 16
    );
    const above = position.y - 16 - GAP;
    const below = (view.bar?.top ?? view.height) - position.y - SIZE - GAP - 8;
    const bottom = below > above;
    const leftSpace = position.x - 16 - GAP;
    const rightSpace = view.width - position.x - SIZE - GAP - 16;
    if (Math.max(above, below) < 155 && Math.max(leftSpace, rightSpace) >= 158) {
      const right = rightSpace >= leftSpace;
      return {
        className: right ? "rocky-beside-right" : "rocky-beside-left",
        style: {
          top: 8 - position.y,
          left: right ? SIZE + GAP : void 0,
          right: right ? void 0 : SIZE + GAP,
          width: Math.min(width, Math.max(leftSpace, rightSpace)),
          maxHeight: (view.bar?.top ?? view.height) - 16,
          "--rocky-origin": `${right ? "left" : "right"} ${position.y - 8 + SIZE / 2}px`
        }
      };
    }
    return {
      className: bottom ? "rocky-below" : "rocky-above",
      style: {
        top: bottom ? SIZE + GAP : void 0,
        bottom: bottom ? void 0 : SIZE + GAP,
        left: x - position.x,
        width,
        maxHeight: Math.max(48, bottom ? below : above),
        "--rocky-origin": `${position.x + SIZE / 2 - x}px ${bottom ? "top" : "bottom"}`
      }
    };
  }
  function useEventStream(eventsUrl, notify, cursor, saveCursor) {
    const { token } = useAuth();
    (0, import_react13.useEffect)(() => {
      if (!token || !eventsUrl) return;
      const controller = new AbortController();
      let retry;
      let source;
      const path = eventsUrl.replace(/^\/api(?=\/)/, "");
      let syncing = false;
      async function syncHistory() {
        if (syncing) return;
        syncing = true;
        try {
          let more;
          let after = cursor.current;
          do {
            const page = await apiRequest(`${path}/history?after=${after}`, {
              token,
              signal: controller.signal
            });
            if (controller.signal.aborted) return;
            for (const alert of page.alerts) notify(alert, alert.id);
            more = page.more && page.next > after;
            after = page.next;
          } while (more);
          saveCursor(after);
        } catch {
        } finally {
          syncing = false;
        }
      }
      const connect = async () => {
        try {
          const { ticket, expiresAt } = await apiRequest(`${path}/ticket`, {
            method: "POST",
            token,
            signal: controller.signal
          });
          if (controller.signal.aborted) return;
          const url = new URL(apiUrl(path), window.location.origin);
          url.searchParams.set("ticket", ticket);
          source = new EventSource(url.href);
          source.onopen = syncHistory;
          source.onmessage = (event) => {
            try {
              notify(JSON.parse(event.data), event.lastEventId);
            } catch {
            }
          };
          source.onerror = () => {
            if (source.readyState !== EventSource.CLOSED && Date.now() < expiresAt) return;
            source.close();
            retry = window.setTimeout(connect, 1200);
          };
        } catch (error) {
          if (!controller.signal.aborted && ![401, 403, 404].includes(error.status))
            retry = window.setTimeout(connect, 5e3);
        }
      };
      if (typeof EventSource !== "undefined") void connect();
      void syncHistory();
      const historyTimer = window.setInterval(syncHistory, 3e4);
      return () => {
        controller.abort();
        window.clearTimeout(retry);
        window.clearInterval(historyTimer);
        source?.close();
      };
    }, [eventsUrl, notify, token, cursor, saveCursor]);
  }
  function GorillaProvider({ side = "right", eventsUrl = "/api/events", children }) {
    const { user: user2 } = useAuth();
    const preferenceKey = `fitpulse-rocky:${user2?.id}`;
    const [inbox, setInbox] = (0, import_react13.useState)(() => readPreferences(preferenceKey));
    const alerts = Array.isArray(inbox.alerts) ? inbox.alerts : [];
    const enabled = inbox.enabled !== false;
    const greetingKey = `${preferenceKey}:greeted`;
    const [greeting, setGreeting] = (0, import_react13.useState)(() => {
      if (!user2?.id || !enabled) return null;
      try {
        if (sessionStorage.getItem(greetingKey)) return null;
      } catch {
      }
      return { id: GREETING_ID, message: `Hi, ${user2.name?.trim().split(/\s+/)[0] || "there"}. Welcome to FitPulse!` };
    });
    const [queue, setQueue] = (0, import_react13.useState)([]);
    const [latestEvent, setLatestEvent] = (0, import_react13.useState)(null);
    const [mode, setMode] = (0, import_react13.useState)("");
    const [sheetOpen, setSheetOpen] = (0, import_react13.useState)(false);
    const [dragging, setDragging] = (0, import_react13.useState)(false);
    const [stored, setStored] = (0, import_react13.useState)(readPosition);
    const [view, setView] = (0, import_react13.useState)(viewport);
    const [clearOfControls, setClearOfControls] = (0, import_react13.useState)(null);
    const root = (0, import_react13.useRef)(null);
    const trigger = (0, import_react13.useRef)(null);
    const bell = (0, import_react13.useRef)(null);
    const drag = (0, import_react13.useRef)(null);
    const ignoreClick = (0, import_react13.useRef)(false);
    const hoverTimer = (0, import_react13.useRef)(null);
    const seen = (0, import_react13.useRef)(/* @__PURE__ */ new Set());
    const delivered = (0, import_react13.useRef)(new Set(Array.isArray(inbox.delivered) ? inbox.delivered : []));
    const read = (0, import_react13.useRef)(new Set(Array.isArray(inbox.read) ? inbox.read : []));
    const cursor = (0, import_react13.useRef)(0);
    const navigate = (0, import_react13.useRef)(null);
    const bubbleId = (0, import_react13.useId)();
    const unread = alerts.filter((alert) => !alert.read).length;
    const activePopup = enabled && greeting || alerts.find((alert) => alert.id === queue[0]);
    const desired = constrain(
      stored ?? {
        x: side === "left" ? 16 : view.width - SIZE - 16,
        y: (view.bar?.top ?? view.height) - SIZE - 16
      },
      view
    );
    const position = !dragging && clearOfControls ? constrain(clearOfControls, view) : desired;
    const registerNavigation = (0, import_react13.useCallback)((handler) => {
      navigate.current = handler;
      return () => {
        if (navigate.current === handler) navigate.current = null;
      };
    }, []);
    const notify = (0, import_react13.useCallback)((alert, eventId) => {
      if (!alert || !Object.hasOwn(TYPES, alert.type) || typeof alert.title !== "string" || typeof alert.message !== "string")
        return;
      const id = typeof eventId === "string" && eventId ? eventId : Array.from(crypto.getRandomValues(new Uint32Array(4))).join("-");
      if (seen.current.has(id)) return;
      seen.current.add(id);
      const receivedAt = Number.isFinite(Date.parse(alert.receivedAt)) ? new Date(alert.receivedAt).toISOString() : (/* @__PURE__ */ new Date()).toISOString();
      const item = { ...alert, id, receivedAt, read: read.current.has(id) };
      setInbox((previous) => ({
        ...previous,
        alerts: [item, ...previous.alerts || []].sort(
          (a, b) => b.receivedAt.localeCompare(a.receivedAt)
        )
      }));
      if (!delivered.current.has(id)) {
        setQueue((previous) => [...previous, id]);
        setLatestEvent(item);
      }
    }, []);
    const saveCursor = (0, import_react13.useCallback)((next) => {
      if (!Number.isSafeInteger(next) || next <= cursor.current) return;
      cursor.current = next;
    }, []);
    useEventStream(eventsUrl, notify, cursor, saveCursor);
    (0, import_react13.useEffect)(() => {
      storePreferences(preferenceKey, {
        enabled,
        delivered: [...delivered.current],
        read: [...read.current]
      });
    }, [preferenceKey, enabled, inbox, queue]);
    (0, import_react13.useEffect)(() => {
      const read2 = () => setView(viewport());
      const observer = new ResizeObserver(read2);
      observer.observe(document.documentElement);
      const bar = document.querySelector(".fitpulse-bottom-nav");
      if (bar) observer.observe(bar);
      const header = document.querySelector(".fitpulse-mobile-header");
      if (header) observer.observe(header);
      const mobile = window.matchMedia("(max-width: 768px)");
      const frame = () => window.requestAnimationFrame(read2);
      const initial = frame();
      mobile.addEventListener("change", frame);
      window.addEventListener("resize", read2);
      return () => {
        window.cancelAnimationFrame(initial);
        mobile.removeEventListener("change", frame);
        window.removeEventListener("resize", read2);
        observer.disconnect();
      };
    }, [view.bar != null]);
    (0, import_react13.useEffect)(() => {
      if (!view.mobile || !enabled || dragging) {
        setClearOfControls(null);
        return;
      }
      const scroller = document.querySelector(".fitpulse-mobile-scroll");
      const content = scroller?.querySelector(".fitpulse-mobile-content");
      if (!content) return;
      let frame;
      const update = () => {
        window.cancelAnimationFrame(frame);
        frame = window.requestAnimationFrame(() => {
          const next = avoidMobileActions({ x: desired.x, y: desired.y }, view);
          setClearOfControls(
            (previous) => previous?.x === next.x && previous?.y === next.y ? previous : next
          );
        });
      };
      const observer = new ResizeObserver(update);
      observer.observe(content);
      scroller.addEventListener("scroll", update, { passive: true });
      update();
      return () => {
        window.cancelAnimationFrame(frame);
        observer.disconnect();
        scroller.removeEventListener("scroll", update);
      };
    }, [desired.x, desired.y, dragging, enabled, view]);
    (0, import_react13.useEffect)(() => {
      const read2 = () => {
        const open = Boolean(document.querySelector("dialog.experience-modal[open]"));
        setSheetOpen(open);
        if (open) setMode("");
      };
      read2();
      window.addEventListener("fitpulse:dialog-change", read2);
      return () => window.removeEventListener("fitpulse:dialog-change", read2);
    }, []);
    const popupId = !mode && !dragging && !sheetOpen ? activePopup?.id : void 0;
    const dismissPopup = (0, import_react13.useCallback)((id) => {
      if (id === GREETING_ID) {
        setGreeting(null);
        return;
      }
      delivered.current.add(id);
      setQueue((previous) => previous.filter((item) => item !== id));
    }, []);
    (0, import_react13.useEffect)(() => {
      if (!popupId) return;
      if (popupId === GREETING_ID) {
        try {
          sessionStorage.setItem(greetingKey, "1");
        } catch {
        }
      }
      const timer = window.setTimeout(() => dismissPopup(popupId), popupId === GREETING_ID ? 3500 : 7e3);
      return () => window.clearTimeout(timer);
    }, [popupId, dismissPopup, greetingKey]);
    (0, import_react13.useEffect)(
      () => () => {
        window.clearTimeout(hoverTimer.current);
      },
      []
    );
    const close2 = (0, import_react13.useCallback)(() => {
      if (mode) setMode("");
      else if (popupId) dismissPopup(popupId);
    }, [mode, popupId, dismissPopup]);
    (0, import_react13.useEffect)(() => {
      if (!mode && !popupId || sheetOpen) return;
      const outside = (event) => {
        if (mode && !root.current?.contains(event.target) && !bell.current?.contains(event.target))
          close2();
      };
      const onKey = (event) => {
        if (event.key === "Escape" && !sheetOpen) {
          if (root.current?.contains(document.activeElement))
            (trigger.current || bell.current)?.focus();
          close2();
        }
      };
      document.addEventListener("pointerdown", outside);
      document.addEventListener("keydown", onKey);
      return () => {
        document.removeEventListener("pointerdown", outside);
        document.removeEventListener("keydown", onKey);
      };
    }, [mode, popupId, close2, sheetOpen]);
    function startDrag(event) {
      if (!event.isPrimary || event.button !== 0) return;
      ignoreClick.current = false;
      drag.current = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        position,
        moved: false
      };
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    function moveDrag(event) {
      const start = drag.current;
      if (!start || start.id !== event.pointerId) return;
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      if (!start.moved && Math.hypot(dx, dy) < 6) return;
      if (!start.moved) {
        start.moved = true;
        setMode("");
        setDragging(true);
      }
      start.last = constrain({ x: start.position.x + dx, y: start.position.y + dy }, view);
      setStored(start.last);
    }
    function endDrag(event) {
      const start = drag.current;
      if (!start || start.id !== event.pointerId) return;
      drag.current = null;
      if (!start.moved) return;
      ignoreClick.current = true;
      const next = avoidMobileActions(start.last, viewport());
      setStored(next);
      setClearOfControls(next);
      setDragging(false);
      try {
        localStorage.setItem(STORAGE_KEY2, JSON.stringify(next));
      } catch {
      }
    }
    function toggle(event) {
      if (ignoreClick.current && event.detail > 0) {
        ignoreClick.current = false;
        return;
      }
      if (mode === "list" || mode === "hover" && event.detail === 0) close2();
      else setMode("list");
    }
    function hover(event) {
      if (event.pointerType !== "mouse" || drag.current?.moved || window.matchMedia("(max-width: 768px)").matches || !window.matchMedia("(hover: hover) and (pointer: fine)").matches)
        return;
      window.clearTimeout(hoverTimer.current);
      setMode((current) => current === "list" ? current : "hover");
    }
    function leave() {
      hoverTimer.current = window.setTimeout(
        () => setMode((current) => current === "hover" ? "" : current),
        250
      );
    }
    const setEnabled = (0, import_react13.useCallback)((value) => {
      setInbox((previous) => ({ ...previous, enabled: value }));
      if (!value) setGreeting(null);
      setMode("");
    }, []);
    const toggleList = (0, import_react13.useCallback)(() => {
      setMode((current) => current === "list" ? "" : "list");
    }, []);
    (0, import_react13.useEffect)(() => {
      if (mode === "list") root.current?.querySelector(".rocky-close")?.focus();
    }, [mode]);
    const title = activePopup?.title;
    const mood = title === gorillaTitles.expired || activePopup?.type === "error" ? "angry" : activePopup?.type === "warning" ? "worried" : activePopup?.type === "success" ? "happy" : "wink";
    const context = (0, import_react13.useMemo)(
      () => ({
        notify,
        latestEvent,
        registerNavigation,
        enabled,
        setEnabled,
        unread,
        bell,
        bubbleId,
        toggleList,
        listOpen: mode === "list"
      }),
      [
        notify,
        latestEvent,
        registerNavigation,
        enabled,
        setEnabled,
        unread,
        bubbleId,
        toggleList,
        mode
      ]
    );
    const docked = !enabled;
    const bubble = bubblePosition(position, view);
    const shown = Boolean((mode || popupId) && !dragging && !sheetOpen);
    const greetingShown = popupId === GREETING_ID;
    const visibleAlerts = mode ? alerts : activePopup && !greetingShown ? [activePopup] : [];
    return /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)(GorillaContext.Provider, { value: context, children: [
      children,
      /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)(
        "div",
        {
          ref: root,
          className: `rocky${docked ? " rocky-docked" : ""}${dragging ? " is-dragging" : ""}`,
          style: docked ? void 0 : { left: position.x, top: position.y },
          hidden: sheetOpen,
          onPointerEnter: docked ? void 0 : () => window.clearTimeout(hoverTimer.current),
          onPointerLeave: docked ? void 0 : leave,
          children: [
            !docked && /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)(
              "button",
              {
                ref: trigger,
                type: "button",
                className: "rocky-trigger",
                "aria-label": "Open Rocky\u2019s notifications",
                "aria-expanded": shown,
                "aria-controls": shown ? bubbleId : void 0,
                onPointerEnter: hover,
                onPointerDown: startDrag,
                onPointerMove: moveDrag,
                onPointerUp: endDrag,
                onPointerCancel: endDrag,
                onLostPointerCapture: endDrag,
                onClick: toggle,
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { className: "rocky-figure", children: /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(GorillaArt, { mood }) }),
                  unread > 0 && /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("span", { className: "rocky-unread", "aria-label": `${unread} unread`, children: [
                    Math.min(unread, 99),
                    unread > 99 ? "+" : ""
                  ] })
                ]
              }
            ),
            shown && /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)(
              "div",
              {
                id: bubbleId,
                className: `rocky-bubble ${docked ? "" : bubble.className}`,
                style: docked ? void 0 : bubble.style,
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { className: "rocky-bubble-header", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("strong", { children: enabled ? "Rocky" : "Notifications" }),
                    mode && /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(
                      "button",
                      {
                        type: "button",
                        className: "rocky-hide",
                        "aria-label": enabled ? "Hide Rocky" : "Show Rocky",
                        title: enabled ? "Hide Rocky" : "Show Rocky",
                        onClick: () => {
                          setEnabled(!enabled);
                          bell.current?.focus();
                        },
                        children: /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(
                          "svg",
                          {
                            width: "20",
                            height: "20",
                            viewBox: "0 0 24 24",
                            fill: "none",
                            stroke: "currentColor",
                            strokeWidth: "1.8",
                            strokeLinecap: "round",
                            strokeLinejoin: "round",
                            "aria-hidden": "true",
                            children: enabled ? /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)(import_jsx_runtime16.Fragment, { children: [
                              /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("path", { d: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" }),
                              /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("circle", { cx: "12", cy: "12", r: "3" })
                            ] }) : /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("path", { d: "m3 3 18 18M10 10a3 3 0 0 0 4 4M9 5.4a11 11 0 0 1 3-.4c6 0 10 7 10 7a16 16 0 0 1-3.2 3.9M6.1 6.1A19 19 0 0 0 2 12s4 7 10 7a10 10 0 0 0 4.2-.9" })
                          }
                        )
                      }
                    ),
                    /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(
                      "button",
                      {
                        type: "button",
                        className: "rocky-close",
                        "aria-label": mode ? "Close notification history" : "Close notification",
                        onClick: () => {
                          if (root.current?.contains(document.activeElement))
                            (trigger.current || bell.current)?.focus();
                          close2();
                        },
                        children: "\xD7"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { className: "rocky-list", "aria-live": mode ? "off" : "polite", children: [
                    greetingShown && /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("p", { className: "rocky-greeting", children: greeting.message }),
                    mode && !alerts.length && /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("p", { children: "No notifications yet." }),
                    visibleAlerts.map((alert) => {
                      const target = ALERT_SECTIONS.has(alert.target?.section) ? alert.target : { section: DESTINATIONS[alert.title] || "Notifications" };
                      const action = alert.onAction || target.section && (() => navigate.current?.(target));
                      return /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("article", { className: "rocky-alert", children: [
                        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { className: `rocky-chip rocky-chip-${alert.type}`, "aria-hidden": "true", children: TYPES[alert.type] }),
                        /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { children: [
                          /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { className: "rocky-alert-heading", children: [
                            /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("strong", { children: alert.title }),
                            !alert.read && /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("span", { className: "rocky-new", children: "Unread" }),
                            /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("time", { dateTime: alert.receivedAt, children: formatDateTime(alert.receivedAt) })
                          ] }),
                          /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("p", { children: alert.message }),
                          action && /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(
                            "button",
                            {
                              type: "button",
                              className: "btn rocky-view",
                              onClick: () => {
                                read.current.add(alert.id);
                                setInbox((previous) => ({
                                  ...previous,
                                  alerts: previous.alerts.map(
                                    (item) => item.id === alert.id ? { ...item, read: true } : item
                                  )
                                }));
                                dismissPopup(alert.id);
                                const control = trigger.current || bell.current;
                                control?.focus();
                                close2();
                                action();
                              },
                              children: alert.actionLabel || "View"
                            }
                          )
                        ] })
                      ] }, alert.id);
                    })
                  ] })
                ]
              }
            )
          ]
        }
      )
    ] });
  }
  var import_react13, import_jsx_runtime16, GorillaContext, SIZE, MARGIN, GAP, STORAGE_KEY2, GREETING_ID, TYPES, DESTINATIONS, ALERT_SECTIONS, clamp;
  var init_GorillaAssistant = __esm({
    "src/components/gorilla/GorillaAssistant.jsx"() {
      init_define_import_meta_env();
      import_react13 = __toESM(require_react(), 1);
      init_gorillaEvents();
      init_formatDate();
      init_api();
      init_AuthContext();
      init_GorillaArt();
      init_gorilla();
      import_jsx_runtime16 = __toESM(require_jsx_runtime(), 1);
      GorillaContext = (0, import_react13.createContext)(null);
      SIZE = 84;
      MARGIN = 8;
      GAP = 10;
      STORAGE_KEY2 = "fitpulse-rocky-position";
      GREETING_ID = "fitpulse-welcome";
      TYPES = { info: "i", success: "\u2713", warning: "!", error: "\xD7" };
      DESTINATIONS = {
        [gorillaTitles.memberCreated]: "Members",
        [gorillaTitles.memberDeleted]: "Members",
        [gorillaTitles.payment]: "Payments",
        [gorillaTitles.qrCheckIn]: "Attendance",
        [gorillaTitles.expiring]: "Notifications",
        [gorillaTitles.expired]: "Notifications",
        [gorillaTitles.equipmentBroken]: "Equipment",
        [gorillaTitles.equipmentAdded]: "Equipment",
        [gorillaTitles.equipmentUpdated]: "Equipment"
      };
      ALERT_SECTIONS = /* @__PURE__ */ new Set([...Object.values(DESTINATIONS), "Membership", "Reports"]);
      clamp = (value, min, max) => Math.max(min, Math.min(value, max));
    }
  });

  // src/components/mobile/BottomNav.jsx
  function BottomNav({ active, select, createMember, showQr, admin: admin2, Icon: Icon3 }) {
    const tabs = [
      ["Dashboard", "Overview", "home"],
      admin2 ? ["Members", "Members", "users"] : ["Membership", "Membership", "card"],
      null,
      ["Activities", "Activities", "chart"],
      ["More", "More", "menu"]
    ];
    return /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("nav", { className: "fitpulse-bottom-nav", "aria-label": "Dashboard navigation", children: tabs.map((tab) => {
      if (!tab) {
        return /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)(
          "button",
          {
            className: "fitpulse-nav-primary",
            type: "button",
            "aria-label": admin2 ? "Create a new member" : "Open my QR",
            onClick: admin2 ? createMember : showQr,
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("span", { className: "fitpulse-nav-primary-icon", children: /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(Icon3, { name: admin2 ? "plus" : "qr", size: 30, strokeWidth: 1.8 }) }),
              /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("span", { children: admin2 ? "New member" : "My QR" })
            ]
          },
          "primary"
        );
      }
      const [destination, label, icon] = tab;
      return /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)(
        "button",
        {
          type: "button",
          "aria-current": active === destination ? "page" : void 0,
          onClick: () => select(destination),
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(Icon3, { name: icon, size: 22, strokeWidth: 1.8 }),
            /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("span", { children: label })
          ]
        },
        destination
      );
    }) });
  }
  var import_jsx_runtime17;
  var init_BottomNav = __esm({
    "src/components/mobile/BottomNav.jsx"() {
      init_define_import_meta_env();
      import_jsx_runtime17 = __toESM(require_jsx_runtime(), 1);
    }
  });

  // src/components/mobile/BottomSheet.jsx
  function BottomSheet(props) {
    return /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(Dialog, { ...props, sheet: true });
  }
  var import_jsx_runtime18;
  var init_BottomSheet = __esm({
    "src/components/mobile/BottomSheet.jsx"() {
      init_define_import_meta_env();
      init_Dialog();
      import_jsx_runtime18 = __toESM(require_jsx_runtime(), 1);
    }
  });

  // src/components/mobile/MoreRow.jsx
  function MoreRow({ icon, label, trailing = "\u203A", onClick, ...attributes }) {
    return /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("button", { type: "button", className: "fitpulse-more-row", onClick, ...attributes, children: [
      /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("span", { className: "fitpulse-icon-chip", children: icon }),
      /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("span", { children: label }),
      /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("span", { className: "fitpulse-more-trailing", "aria-hidden": "true", children: trailing })
    ] });
  }
  var import_jsx_runtime19;
  var init_MoreRow = __esm({
    "src/components/mobile/MoreRow.jsx"() {
      init_define_import_meta_env();
      import_jsx_runtime19 = __toESM(require_jsx_runtime(), 1);
    }
  });

  // src/components/mobile/mobile.css
  var init_mobile = __esm({
    "src/components/mobile/mobile.css"() {
    }
  });

  // src/components/mobile/MobileLayout.jsx
  function MobileLayout({
    activeSection,
    onSectionChange,
    onSignOut,
    onCreateMember,
    role,
    className,
    loading,
    Brand: Brand3,
    Icon: Icon3,
    dark,
    toggle,
    children,
    content,
    dialogs,
    qr
  }) {
    const [sheet, setSheet] = (0, import_react14.useState)("");
    const scroller = (0, import_react14.useRef)(null);
    const admin2 = role === "admin";
    const activityTab = activitySections.includes(activeSection);
    const active = activeSection === "My QR" ? "Membership" : activityTab ? "Activities" : ["Dashboard", "Members", "Membership"].includes(activeSection) ? activeSection : "More";
    const title = activeSection === "Dashboard" ? "Overview" : activeSection;
    const moreLinks = admin2 ? ADMIN_MORE : MEMBER_MORE;
    (0, import_react14.useEffect)(() => {
      scroller.current?.scrollTo(0, 0);
    }, [activeSection]);
    return /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(DashboardSheetContext.Provider, { value: true, children: /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("div", { className: `app ${className} fitpulse-mobile`, children: [
      /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("header", { className: "fitpulse-mobile-header", children: [
        /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("div", { className: "logo brand", children: /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(Brand3, {}) }),
        /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("div", { className: "fitpulse-header-actions", children: [
          /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(RockyNotificationButton, { Icon: Icon3 }),
          /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(
            "button",
            {
              type: "button",
              className: "ib fitpulse-icon-button",
              onClick: toggle,
              "aria-label": dark ? "Use light theme" : "Use dark theme",
              children: /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(Icon3, { name: dark ? "sun" : "moon" })
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("main", { className: "fitpulse-mobile-scroll", ref: scroller, children: /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("div", { className: "fitpulse-mobile-content", "aria-busy": loading, children: [
        (activityTab && activeSection !== "Activities" || active === "More" && activeSection !== "More") && /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)(
          "button",
          {
            type: "button",
            className: "fitpulse-text-button",
            onClick: () => onSectionChange(active),
            children: [
              "\u2190 ",
              active
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("h1", { children: title }),
        children,
        activeSection === "More" ? /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("div", { className: "fitpulse-more-list", children: [
          moreLinks.map(([destination, label, icon]) => /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(
            MoreRow,
            {
              icon: /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(Icon3, { name: icon }),
              label,
              onClick: () => onSectionChange(destination)
            },
            destination
          )),
          /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(
            MoreRow,
            {
              icon: /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(Icon3, { name: "out" }),
              label: "Sign out",
              trailing: "",
              onClick: () => setSheet("sign-out")
            }
          )
        ] }) : content
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(
        BottomNav,
        {
          active,
          select: onSectionChange,
          createMember: onCreateMember,
          showQr: () => setSheet("qr"),
          admin: admin2,
          Icon: Icon3
        }
      ),
      dialogs,
      !admin2 && sheet === "qr" && /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(BottomSheet, { title: "My QR", onClose: () => setSheet(""), children: qr }),
      sheet === "sign-out" && /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)(BottomSheet, { title: "Sign out?", onClose: () => setSheet(""), children: [
        /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("p", { className: "modal-copy", children: "Are you sure you want to sign out of FitPulse?" }),
        /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("div", { className: "ma", children: [
          /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("button", { className: "btn ghost", type: "button", onClick: () => setSheet(""), children: "Cancel" }),
          /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("button", { className: "btn", type: "button", onClick: onSignOut, children: "Sign out" })
        ] })
      ] })
    ] }) });
  }
  var import_react14, import_jsx_runtime20, ADMIN_MORE, MEMBER_MORE, activitySections;
  var init_MobileLayout = __esm({
    "src/components/mobile/MobileLayout.jsx"() {
      init_define_import_meta_env();
      import_react14 = __toESM(require_react(), 1);
      init_Dialog();
      init_GorillaAssistant();
      init_BottomNav();
      init_BottomSheet();
      init_MoreRow();
      init_mobile();
      import_jsx_runtime20 = __toESM(require_jsx_runtime(), 1);
      ADMIN_MORE = [
        ["Equipment", "Equipment monitoring", "dumbbell"],
        ["Reports", "Reports", "chart"],
        ["Notifications", "Email reminders", "mail"],
        ["Settings", "Settings", "sliders"]
      ];
      MEMBER_MORE = [
        ["Notifications", "Notifications", "bell"],
        ["Settings", "Settings", "sliders"]
      ];
      activitySections = ["Activities", "Attendance", "Payments"];
    }
  });

  // src/components/mobile/useIsMobile.js
  function subscribe(onChange) {
    const media = window.matchMedia(query);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }
  function useIsMobile() {
    return (0, import_react15.useSyncExternalStore)(
      subscribe,
      () => window.matchMedia(query).matches,
      () => false
    );
  }
  var import_react15, query;
  var init_useIsMobile = __esm({
    "src/components/mobile/useIsMobile.js"() {
      init_define_import_meta_env();
      import_react15 = __toESM(require_react(), 1);
      query = "(max-width: 768px)";
    }
  });

  // src/components/DashboardShell.jsx
  function Icon2({ name, size = 20, strokeWidth = 2 }) {
    return /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(
      "svg",
      {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        "aria-hidden": "true",
        children: PATHS[name]
      }
    );
  }
  function Brand2() {
    return /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)(import_jsx_runtime21.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(
        "svg",
        {
          width: "46",
          height: "24",
          viewBox: "0 0 88 28",
          fill: "none",
          stroke: "currentColor",
          strokeWidth: "3",
          strokeLinecap: "round",
          strokeLinejoin: "round",
          "aria-hidden": "true",
          children: /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("path", { d: "M4 7v14M4 14h14l5-9 8 18 7-13 4 4h36M84 7v14M84 14h-6" })
        }
      ),
      "Fit",
      /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("span", { children: "Pulse" })
    ] });
  }
  function DashboardShell({
    role,
    user: user2,
    onSignOut,
    activeSection,
    onSectionChange,
    onMemberAlert,
    notificationCount = 0,
    loading = false,
    children,
    content,
    dialogs,
    mobileViews = {},
    mobileQr,
    onCreateMember,
    className = "",
    profileLoading = false
  }) {
    const [sidebarOpen, setSidebarOpen] = (0, import_react16.useState)(false);
    const [modal, setModal] = (0, import_react16.useState)("");
    const { dark, toggle } = useTheme();
    const isMobile = useIsMobile();
    const registerNavigation = useGorilla()?.registerNavigation;
    const isAdmin = role === "admin";
    const navigation = isAdmin ? ADMIN_NAVIGATION : MEMBER_NAVIGATION;
    (0, import_react16.useEffect)(() => registerNavigation?.(({ section, memberId }) => {
      if (!navigation.some(([label]) => label === section)) return;
      setSidebarOpen(false);
      onSectionChange(section);
      if (isAdmin && section === "Members" && typeof memberId === "string")
        onMemberAlert?.(memberId);
    }), [isAdmin, navigation, onMemberAlert, onSectionChange, registerNavigation]);
    (0, import_react16.useEffect)(() => {
      if (!isMobile && Object.hasOwn({ More: true, Membership: true, Activities: true }, activeSection)) {
        onSectionChange(activeSection === "Activities" ? "Attendance" : activeSection === "More" ? "Settings" : "Dashboard");
      }
    }, [activeSection, isMobile, onSectionChange]);
    const select = (section) => {
      setSidebarOpen(false);
      onSectionChange(section);
    };
    const selectMobile = (section) => {
      if (section === "More" || Object.hasOwn(mobileViews, section) || navigation.some(([label]) => label === section)) select(section);
    };
    if (isMobile) {
      return /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(
        MobileLayout,
        {
          activeSection,
          onSectionChange: selectMobile,
          onSignOut,
          onCreateMember,
          role,
          className,
          loading,
          Brand: Brand2,
          Icon: Icon2,
          dark,
          toggle,
          content: mobileViews[activeSection] ?? content,
          dialogs,
          qr: mobileQr,
          children
        }
      );
    }
    return /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("div", { className: `app ${className}`, style: bannerStyles, children: [
      /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("aside", { className: `clay${sidebarOpen ? " open" : ""}`, children: [
        /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("div", { className: "logo brand", children: /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(Brand2, {}) }),
        /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("div", { id: "nav", children: navigation.map(([label, icon]) => /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)(
          "button",
          {
            className: `nav${activeSection === label ? " on" : ""}`,
            type: "button",
            "aria-current": activeSection === label ? "page" : void 0,
            onClick: () => select(label),
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(Icon2, { name: icon }),
              /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("span", { children: label }),
              label === "Notifications" && notificationCount > 0 && /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(
                "span",
                {
                  className: "nav-notification-count",
                  "aria-label": `${notificationCount} notifications`,
                  children: notificationCount > 99 ? "99+" : notificationCount
                }
              )
            ]
          },
          label
        )) }),
        /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("div", { className: "spacer" }),
        /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("button", { className: "nav", type: "button", onClick: () => setModal("logout"), children: [
          /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(Icon2, { name: "out" }),
          /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("span", { children: "Sign out" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("div", { className: `ov${sidebarOpen ? " show" : ""}`, onClick: () => setSidebarOpen(false) }),
      /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("main", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("header", { className: "clay", children: [
          /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(
            "button",
            {
              className: "ib",
              id: "menuBtn",
              type: "button",
              onClick: () => setSidebarOpen(true),
              "aria-label": "Open navigation",
              children: /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(Icon2, { name: "menu" })
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("h1", { children: activeSection }),
          /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(
            "button",
            {
              className: "ib",
              type: "button",
              onClick: toggle,
              title: "Toggle theme",
              "aria-label": "Toggle theme",
              children: /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(Icon2, { name: dark ? "sun" : "moon" })
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(RockyNotificationButton, { Icon: Icon2 }),
          /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)(
            "button",
            {
              className: "chip",
              type: "button",
              onClick: () => setModal("profile"),
              disabled: profileLoading,
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("div", { children: [
                  /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("b", { children: profileLoading ? "Loading profile..." : user2?.name || "FitPulse User" }),
                  /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("small", { children: isAdmin ? "Administrator" : "FitPulse member" })
                ] }),
                profileLoading ? /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(
                  "span",
                  {
                    "aria-hidden": "true",
                    style: {
                      display: "inline-block",
                      width: 42,
                      height: 42,
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.12)"
                    }
                  }
                ) : /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(ProfileAvatar, { user: user2 })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("div", { className: "dashboard-stage", children: /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)(
          "section",
          {
            id: "view",
            className: "grid dashboard-content is-ready",
            "aria-busy": loading,
            children: [
              children,
              content,
              dialogs
            ]
          },
          activeSection
        ) })
      ] }),
      modal && /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(
        Dialog,
        {
          title: modal === "logout" ? "Sign out?" : "Profile Details",
          onClose: () => setModal(""),
          children: modal === "logout" ? /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)(import_jsx_runtime21.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("p", { className: "modal-copy", children: "Are you sure you want to sign out of FitPulse?" }),
            /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("div", { className: "ma", children: [
              /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("button", { className: "btn ghost cancel-button", type: "button", onClick: () => setModal(""), children: "Cancel" }),
              /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("button", { className: "btn", type: "button", onClick: onSignOut, children: [
                /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(Icon2, { name: "out", size: 16 }),
                "Sign out"
              ] })
            ] })
          ] }) : /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)(import_jsx_runtime21.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("div", { className: "center", children: [
              /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(ProfileAvatar, { user: user2, large: true }),
              /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("b", { className: "profile-name", children: user2?.name || "FitPulse User" }),
              /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("span", { className: `pill ${isAdmin ? "p-warn" : "p-ok"}`, children: isAdmin ? "Administrator" : "Member" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("div", { className: "info", children: [
              /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("span", { children: "Email" }),
              user2?.email || "Not available",
              !isAdmin && /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)(import_jsx_runtime21.Fragment, { children: [
                /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("span", { children: "Member ID" }),
                user2?.memberCode || user2?.id || "Not available",
                /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("span", { children: "Plan" }),
                user2?.plan || "Not available"
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("div", { className: "ma", children: [
              /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("button", { className: "btn ghost cancel-button", type: "button", onClick: () => setModal(""), children: "Cancel" }),
              /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)(
                "button",
                {
                  className: "btn",
                  type: "button",
                  onClick: () => {
                    setModal("");
                    select("Settings");
                  },
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(Icon2, { name: "sliders", size: 16 }),
                    "Settings"
                  ]
                }
              )
            ] })
          ] })
        }
      )
    ] });
  }
  var import_react16, import_jsx_runtime21, bannerStyles, ADMIN_NAVIGATION, MEMBER_NAVIGATION, PATHS;
  var init_DashboardShell2 = __esm({
    "src/components/DashboardShell.jsx"() {
      init_define_import_meta_env();
      import_react16 = __toESM(require_react(), 1);
      init_useTheme();
      init_ProfileAvatar();
      init_Dialog();
      init_db_day_v();
      init_db_night_v();
      init_dashboard_features();
      init_DashboardShell();
      init_MobileLayout();
      init_useIsMobile();
      init_GorillaAssistant();
      import_jsx_runtime21 = __toESM(require_jsx_runtime(), 1);
      bannerStyles = {
        "--dashboard-day-image": `url("${db_day_v_default}")`,
        "--dashboard-night-image": `url("${db_night_v_default}")`
      };
      ADMIN_NAVIGATION = [
        ["Dashboard", "home"],
        ["Members", "users"],
        ["Equipment", "dumbbell"],
        ["Attendance", "qr"],
        ["Payments", "wallet"],
        ["Notifications", "bell"],
        ["Reports", "chart"],
        ["Settings", "sliders"]
      ];
      MEMBER_NAVIGATION = [
        ["Dashboard", "home"],
        ["My QR", "qr"],
        ["Attendance", "file"],
        ["Payments", "wallet"],
        ["Notifications", "bell"],
        ["Settings", "sliders"]
      ];
      PATHS = {
        mail: /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)(import_jsx_runtime21.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("rect", { x: "3", y: "5", width: "18", height: "14", rx: "2" }),
          /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("path", { d: "m3 6 9 7 9-7" })
        ] }),
        eye: /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)(import_jsx_runtime21.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("path", { d: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" }),
          /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("circle", { cx: "12", cy: "12", r: "3" })
        ] }),
        camera: /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)(import_jsx_runtime21.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("path", { d: "M3 6h4l2-3h6l2 3h4v14H3z" }),
          /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("circle", { cx: "12", cy: "13", r: "3" })
        ] }),
        edit: /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)(import_jsx_runtime21.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("path", { d: "m16 3 5 5-12 12-6 1 1-6L16 3Z" }),
          /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("path", { d: "m14 5 5 5" })
        ] }),
        trash: /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(import_jsx_runtime21.Fragment, { children: /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("path", { d: "M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7" }) }),
        "delete-data": /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)(import_jsx_runtime21.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("path", { d: "M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15" }),
          /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("path", { d: "m10 11 4 5m0-5-4 5", strokeWidth: "1.7" })
        ] }),
        "clear-data": /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)(import_jsx_runtime21.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("path", { d: "M10 20H3V3h18v8M3 6h18M8 10h9M8 13h5M8 16h3", strokeWidth: "1.5" }),
          /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("path", { d: "M3 3h18v3H3z", fill: "currentColor", stroke: "none" }),
          /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("path", { d: "M5.5 10h.1m-.1 3h.1m-.1 3h.1" }),
          /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(
            "path",
            {
              d: "M23.5 18a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0Z M16 15l2 2 2-2 1 1-2 2 2 2-1 1-2-2-2 2-1-1 2-2-2-2Z",
              fill: "currentColor",
              fillRule: "evenodd",
              stroke: "none"
            }
          )
        ] }),
        file: /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(import_jsx_runtime21.Fragment, { children: /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("path", { d: "M4 3h11l5 5v13H4zM14 3v6h6M8 13h8M8 17h5" }) }),
        home: /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("path", { d: "M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" }),
        users: /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)(import_jsx_runtime21.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("circle", { cx: "9", cy: "8", r: "4" }),
          /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("path", { d: "M2 21c0-4 3-6 7-6s7 2 7 6M16 4a4 4 0 0 1 0 8M22 21c0-3-2-5-4-5.5" })
        ] }),
        card: /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)(import_jsx_runtime21.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("rect", { x: "2", y: "5", width: "20", height: "14", rx: "3" }),
          /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("path", { d: "M2 10h20M6 15h4" })
        ] }),
        dumbbell: /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("path", { d: "M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12" }),
        qr: /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)(import_jsx_runtime21.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("rect", { x: "3", y: "3", width: "7", height: "7", rx: "1" }),
          /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("rect", { x: "14", y: "3", width: "7", height: "7", rx: "1" }),
          /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("rect", { x: "3", y: "14", width: "7", height: "7", rx: "1" }),
          /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("path", { d: "M14 14h3v3h-3zM20 14v7h-3" })
        ] }),
        wallet: /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)(import_jsx_runtime21.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("rect", { x: "2", y: "6", width: "20", height: "14", rx: "3" }),
          /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("path", { d: "M2 10h20" }),
          /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("circle", { cx: "17", cy: "15", r: "1.4" })
        ] }),
        bell: /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("path", { d: "M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21a2 2 0 0 0 4 0" }),
        chart: /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("path", { d: "M3 3v18h18M7 15l4-4 3 3 6-7" }),
        sliders: /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)(import_jsx_runtime21.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("path", { d: "M4 6h8M18 6h2M4 12h2M12 12h8M4 18h10M20 18h0" }),
          /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("circle", { cx: "15", cy: "6", r: "2" }),
          /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("circle", { cx: "9", cy: "12", r: "2" }),
          /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("circle", { cx: "17", cy: "18", r: "2" })
        ] }),
        out: /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("path", { d: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" }),
        sun: /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)(import_jsx_runtime21.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("circle", { cx: "12", cy: "12", r: "4" }),
          /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("path", { d: "M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5" })
        ] }),
        moon: /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("path", { d: "M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z" }),
        menu: /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("path", { d: "M3 6h18M3 12h18M3 18h18" }),
        plus: /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("path", { d: "M12 5v14M5 12h14" }),
        search: /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("path", { d: "m21 21-5-5m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" }),
        x: /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("path", { d: "M6 6l12 12M18 6 6 18" })
      };
    }
  });

  // src/utils/activityChart.js
  function calendarDate(value) {
    const key = manilaDateKey(value);
    return key ? /* @__PURE__ */ new Date(`${key}T00:00:00Z`) : null;
  }
  function activityBuckets(records, range = "week", metric = "attendance", now = /* @__PURE__ */ new Date()) {
    const today = calendarDate(now);
    const monthly = range === "months";
    const count = monthly ? 6 : 7;
    const key = (date4) => monthly ? date4.toISOString().slice(0, 7) : date4.toISOString().slice(0, 10);
    const buckets = Array.from({ length: count }, (_, index) => {
      const date4 = new Date(today);
      if (monthly) {
        date4.setUTCDate(1);
        date4.setUTCMonth(date4.getUTCMonth() - (count - 1 - index));
      } else date4.setUTCDate(date4.getUTCDate() - (count - 1 - index));
      return {
        key: key(date4),
        value: 0,
        label: date4.toLocaleDateString("en-PH", {
          timeZone: "UTC",
          [monthly ? "month" : "weekday"]: "short"
        }),
        description: `${monthly ? "Month starting " : ""}${formatDate(date4)}`
      };
    });
    const byKey = new Map(buckets.map((bucket) => [bucket.key, bucket]));
    for (const record of records) {
      const date4 = calendarDate(record.date);
      if (!date4 || new Date(record.date) > new Date(now)) continue;
      const bucket = byKey.get(key(date4));
      const value = metric === "revenue" ? Number(record.amount) : 1;
      if (bucket && Number.isFinite(value) && value > 0) bucket.value += value;
    }
    return buckets;
  }
  var init_activityChart = __esm({
    "src/utils/activityChart.js"() {
      init_define_import_meta_env();
      init_formatDate();
    }
  });

  // src/components/ActivityChart.css
  var init_ActivityChart = __esm({
    "src/components/ActivityChart.css"() {
    }
  });

  // src/components/ActivityChart.jsx
  function ActivityChart({
    attendance: attendance2 = [],
    payments: payments2 = [],
    admin: admin2 = false,
    loading = false
  }) {
    const headingId = (0, import_react17.useId)();
    const [range, setRange] = (0, import_react17.useState)("week");
    const [metric, setMetric] = (0, import_react17.useState)("attendance");
    const [selected, setSelected] = (0, import_react17.useState)(null);
    const buckets = (0, import_react17.useMemo)(
      () => activityBuckets(metric === "revenue" ? payments2 : attendance2, range, metric),
      [attendance2, payments2, range, metric]
    );
    const maximum = Math.max(1, ...buckets.map(({ value }) => value));
    const total = buckets.reduce((sum, bucket) => sum + bucket.value, 0);
    const active = buckets.find((bucket) => bucket.key === selected);
    const format = (value) => metric === "revenue" ? new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      maximumFractionDigits: 0
    }).format(value) : `${value} ${value === 1 ? "check-in" : "check-ins"}`;
    return /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("article", { className: "card clay activity-chart", "aria-labelledby": headingId, "aria-busy": loading, children: [
      /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: "activity-heading", children: [
        /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("h2", { id: headingId, children: admin2 ? "Gym activity" : "Your activity" }),
          !admin2 && /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("p", { children: "Every visit is a step forward. Keep showing up." })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("span", { className: "activity-icon", children: /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(Icon2, { name: "chart", size: 24 }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: "activity-controls", children: [
        admin2 && /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("div", { className: "clay-segment", role: "group", "aria-label": "Chart metric", children: [
          ["attendance", "Check-ins"],
          ["revenue", "Revenue"]
        ].map(([value, label]) => /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(
          "button",
          {
            type: "button",
            "aria-pressed": metric === value,
            onClick: () => {
              setMetric(value);
              setSelected(null);
            },
            children: label
          },
          value
        )) }),
        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("div", { className: "clay-segment", role: "group", "aria-label": "Chart period", children: [
          ["week", "7 days"],
          ["months", "6 months"]
        ].map(([value, label]) => /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(
          "button",
          {
            type: "button",
            "aria-pressed": range === value,
            onClick: () => {
              setRange(value);
              setSelected(null);
            },
            children: label
          },
          value
        )) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: "activity-summary", "aria-live": "polite", children: [
        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("strong", { children: loading ? "Loading\u2026" : format(active ? active.value : total) }),
        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("span", { children: active ? active.description : range === "week" ? "in the last 7 days" : "in the last 6 months" }),
        active && /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("button", { type: "button", onClick: () => setSelected(null), children: "Show total" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)(
        "div",
        {
          className: "activity-plot",
          "aria-label": `${metric === "revenue" ? "Revenue" : "Check-ins"} by ${range === "week" ? "day" : "month"}`,
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: "activity-grid", "aria-hidden": "true", children: [
              /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("i", {}),
              /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("i", {}),
              /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("i", {}),
              /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("i", {})
            ] }),
            buckets.map((bucket) => /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)(
              "button",
              {
                className: `activity-column${selected === bucket.key ? " is-selected" : ""}`,
                type: "button",
                disabled: loading,
                "aria-pressed": selected === bucket.key,
                "aria-label": `${bucket.description}: ${format(bucket.value)}`,
                onClick: () => setSelected(selected === bucket.key ? null : bucket.key),
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("span", { className: "activity-bar-space", children: /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(
                    "span",
                    {
                      className: "activity-bar",
                      style: {
                        "--bar-height": `${bucket.value ? Math.max(5, bucket.value / maximum * 100) : 2}%`
                      },
                      children: /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("span", { className: "activity-tooltip", children: format(bucket.value) })
                    }
                  ) }),
                  /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("span", { className: "activity-day", children: bucket.label })
                ]
              },
              bucket.key
            ))
          ]
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: "activity-footer", children: [
        /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("span", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("i", {}),
          metric === "revenue" ? "Recorded payments" : "Recorded visits"
        ] }),
        !loading && total === 0 && /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("small", { children: "No activity in this period yet." })
      ] })
    ] });
  }
  var import_react17, import_jsx_runtime22;
  var init_ActivityChart2 = __esm({
    "src/components/ActivityChart.jsx"() {
      init_define_import_meta_env();
      import_react17 = __toESM(require_react(), 1);
      init_activityChart();
      init_DashboardShell2();
      init_ActivityChart();
      import_jsx_runtime22 = __toESM(require_jsx_runtime(), 1);
    }
  });

  // src/components/admin/analytics/ChartCard.jsx
  function ChartCard({ title, subtitle, loading, error, empty, onRetry, children }) {
    const titleId = (0, import_react18.useId)();
    return /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)(
      "article",
      {
        className: "card clay analytics-chart-card",
        "aria-labelledby": titleId,
        "aria-busy": loading,
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { className: "analytics-chart-heading", children: [
            /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("h2", { id: titleId, children: title }),
            /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("p", { children: subtitle })
          ] }),
          loading ? /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { className: "analytics-chart-state", role: "status", children: [
            /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("span", { className: "analytics-sr-only", children: [
              "Loading ",
              title
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("div", { className: "analytics-skeleton analytics-chart-skeleton", "aria-hidden": "true" })
          ] }) : error ? /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("div", { className: "analytics-chart-state", role: "alert", children: [
            /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("p", { children: error }),
            onRetry && /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("button", { className: "btn ghost", type: "button", onClick: onRetry, children: "Retry analytics" })
          ] }) : empty ? /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("div", { className: "analytics-chart-state", role: "status", children: /* @__PURE__ */ (0, import_jsx_runtime23.jsx)("p", { children: "No data yet" }) }) : children
        ]
      }
    );
  }
  var import_react18, import_jsx_runtime23;
  var init_ChartCard = __esm({
    "src/components/admin/analytics/ChartCard.jsx"() {
      init_define_import_meta_env();
      import_react18 = __toESM(require_react(), 1);
      import_jsx_runtime23 = __toESM(require_jsx_runtime(), 1);
    }
  });

  // src/components/admin/analytics/useAnalyticsChart.js
  function loadChartLibrary() {
    chartLibrary ??= new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js";
      script.crossOrigin = "anonymous";
      script.async = true;
      const failed = () => {
        script.remove();
        chartLibrary = void 0;
        reject(new Error("Chart.js is unavailable."));
      };
      script.onload = () => window.Chart ? resolve(window.Chart) : failed();
      script.onerror = failed;
      document.head.append(script);
    });
    return chartLibrary;
  }
  function chartColors(canvas) {
    const style = getComputedStyle(canvas);
    const read = (name) => style.getPropertyValue(name).trim();
    return {
      navy: read("--analytics-navy"),
      mutedNavy: read("--analytics-muted-navy"),
      orange: read("--orange"),
      gold: read("--gold"),
      red: read("--red"),
      fill: read("--analytics-fill"),
      grid: read("--analytics-grid"),
      text: read("--text"),
      muted: read("--muted"),
      surface: read("--card"),
      font: style.fontFamily
    };
  }
  function chartOptions(colors, { doughnut = false, currency = false } = {}) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      locale: "en-PH",
      animation: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? false : { duration: 350 },
      plugins: {
        legend: {
          display: doughnut,
          position: "bottom",
          labels: {
            color: colors.text,
            usePointStyle: true,
            boxWidth: 9,
            padding: 16,
            font: { family: colors.font, size: 12 }
          }
        },
        tooltip: {
          backgroundColor: colors.surface,
          titleColor: colors.text,
          bodyColor: colors.text,
          borderColor: colors.grid,
          borderWidth: 1,
          padding: 12,
          cornerRadius: 12
        }
      },
      ...doughnut ? { cutout: "68%" } : {
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: { color: colors.muted, font: { family: colors.font, size: 12 } }
          },
          y: {
            beginAtZero: true,
            border: { display: false },
            grid: { color: colors.grid },
            ticks: {
              color: colors.muted,
              maxTicksLimit: 5,
              font: { family: colors.font, size: 12 },
              ...currency ? { callback: (value) => pesos2(value) } : { precision: 0 }
            }
          }
        }
      }
    };
  }
  function useAnalyticsChart(createConfig, enabled) {
    const canvasRef = (0, import_react19.useRef)(null);
    const { dark } = useTheme();
    const [chartError, setChartError] = (0, import_react19.useState)("");
    (0, import_react19.useEffect)(() => {
      if (!enabled) return;
      let chart;
      let active = true;
      setChartError("");
      const frame = window.requestAnimationFrame(async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        try {
          const Chart = await loadChartLibrary();
          if (!active) return;
          chart = new Chart(canvas, createConfig(chartColors(canvas)));
        } catch (error) {
          if (!active) return;
          window.Chart?.getChart(canvas)?.destroy();
          console.error("Unable to render the analytics chart:", error.message);
          setChartError("Charts could not load. Check your connection and reload the page.");
        }
      });
      return () => {
        active = false;
        window.cancelAnimationFrame(frame);
        chart?.destroy();
      };
    }, [createConfig, enabled, dark]);
    return { canvasRef, chartError };
  }
  var import_react19, chartLibrary, pesos2;
  var init_useAnalyticsChart = __esm({
    "src/components/admin/analytics/useAnalyticsChart.js"() {
      init_define_import_meta_env();
      import_react19 = __toESM(require_react(), 1);
      init_useTheme();
      pesos2 = (value) => new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        maximumFractionDigits: 2
      }).format(value);
    }
  });

  // src/components/admin/analytics/AttendanceChart.jsx
  function AttendanceChart({ data, loading, error, onRetry }) {
    const createConfig = (0, import_react20.useCallback)(
      (colors) => {
        const counts = data.days.map((day) => day.count);
        const highest = Math.max(...counts);
        const options = chartOptions(colors);
        options.plugins.tooltip.callbacks = {
          title: ([point]) => formatDate(data.days[point?.dataIndex]?.date)
        };
        return {
          type: "bar",
          data: {
            labels: data.days.map((day) => day.label),
            datasets: [
              {
                label: "QR check-ins",
                data: counts,
                borderRadius: 8,
                borderSkipped: false,
                maxBarThickness: 42,
                backgroundColor: counts.map(
                  (count) => count === highest ? colors.orange : colors.mutedNavy
                )
              }
            ]
          },
          options
        };
      },
      [data]
    );
    const enabled = !loading && !error && data?.total > 0;
    const { canvasRef, chartError } = useAnalyticsChart(createConfig, enabled);
    return /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)(
      ChartCard,
      {
        title: "QR Attendance",
        subtitle: "Current week \xB7 Monday\u2013Sunday \xB7 Asia/Manila",
        loading,
        error,
        empty: !data?.total,
        onRetry,
        children: [
          chartError && /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("p", { className: "analytics-chart-error", role: "alert", children: chartError }),
          /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("div", { className: "analytics-canvas", hidden: Boolean(chartError), children: /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(
            "canvas",
            {
              ref: canvasRef,
              role: "img",
              "aria-label": `QR check-ins this week: ${data?.days.map((day) => `${formatDate(day.date)} ${day.count}`).join(", ")}`
            }
          ) })
        ]
      }
    );
  }
  var import_react20, import_jsx_runtime24;
  var init_AttendanceChart = __esm({
    "src/components/admin/analytics/AttendanceChart.jsx"() {
      init_define_import_meta_env();
      import_react20 = __toESM(require_react(), 1);
      init_formatDate();
      init_ChartCard();
      init_useAnalyticsChart();
      import_jsx_runtime24 = __toESM(require_jsx_runtime(), 1);
    }
  });

  // src/components/admin/analytics/MembershipStatusChart.jsx
  function MembershipStatusChart({ data, loading, error, onRetry }) {
    const total = (data?.active || 0) + (data?.expiringSoon || 0) + (data?.expired || 0);
    const createConfig = (0, import_react21.useCallback)(
      (colors) => ({
        // The three buckets are exclusive; expiring members are excluded from Active.
        type: "doughnut",
        data: {
          labels: ["Active", "Expiring soon", "Expired"],
          datasets: [
            {
              data: [data.active, data.expiringSoon, data.expired],
              backgroundColor: [colors.navy, colors.gold, colors.red],
              borderColor: colors.surface,
              borderWidth: 4,
              hoverOffset: 5
            }
          ]
        },
        options: chartOptions(colors, { doughnut: true })
      }),
      [data]
    );
    const { canvasRef, chartError } = useAnalyticsChart(createConfig, !loading && !error && total > 0);
    const excluded = data?.unclassified ? ` \xB7 ${data.unclassified} without a current classification` : "";
    return /* @__PURE__ */ (0, import_jsx_runtime25.jsxs)(
      ChartCard,
      {
        title: "Membership Status",
        subtitle: `Expiring within ${data?.expiringDays || 7} Manila calendar days${excluded}`,
        loading,
        error,
        empty: !total,
        onRetry,
        children: [
          chartError && /* @__PURE__ */ (0, import_jsx_runtime25.jsx)("p", { className: "analytics-chart-error", role: "alert", children: chartError }),
          /* @__PURE__ */ (0, import_jsx_runtime25.jsx)("div", { className: "analytics-canvas", hidden: Boolean(chartError), children: /* @__PURE__ */ (0, import_jsx_runtime25.jsx)(
            "canvas",
            {
              ref: canvasRef,
              role: "img",
              "aria-label": `Memberships: Active ${data?.active}, Expiring soon ${data?.expiringSoon}, Expired ${data?.expired}`
            }
          ) })
        ]
      }
    );
  }
  var import_react21, import_jsx_runtime25;
  var init_MembershipStatusChart = __esm({
    "src/components/admin/analytics/MembershipStatusChart.jsx"() {
      init_define_import_meta_env();
      import_react21 = __toESM(require_react(), 1);
      init_ChartCard();
      init_useAnalyticsChart();
      import_jsx_runtime25 = __toESM(require_jsx_runtime(), 1);
    }
  });

  // src/components/admin/analytics/RevenueChart.jsx
  function RevenueChart({ data, loading, error, onRetry }) {
    const createConfig = (0, import_react22.useCallback)(
      (colors) => {
        const options = chartOptions(colors, { currency: true });
        options.plugins.tooltip.callbacks = {
          title: ([point]) => `Month starting ${point?.label || "\u2014"}`,
          label: (context) => `Revenue: ${pesos2(context.parsed.y)}`
        };
        return {
          type: "line",
          data: {
            labels: data.months.map((month) => monthStart(month.month)),
            datasets: [
              {
                label: "Revenue",
                data: data.months.map((month) => month.amount),
                borderColor: colors.orange,
                backgroundColor: colors.fill,
                pointBackgroundColor: colors.orange,
                pointBorderColor: colors.surface,
                pointRadius: 4,
                pointHoverRadius: 6,
                borderWidth: 3,
                tension: 0.3,
                fill: true
              }
            ]
          },
          options
        };
      },
      [data]
    );
    const { canvasRef, chartError } = useAnalyticsChart(
      createConfig,
      !loading && !error && data?.paymentCount > 0
    );
    return /* @__PURE__ */ (0, import_jsx_runtime26.jsxs)(
      ChartCard,
      {
        title: "Revenue",
        subtitle: "Last 6 months \xB7 Successful payments \xB7 PHP",
        loading,
        error,
        empty: !data?.paymentCount,
        onRetry,
        children: [
          chartError && /* @__PURE__ */ (0, import_jsx_runtime26.jsx)("p", { className: "analytics-chart-error", role: "alert", children: chartError }),
          /* @__PURE__ */ (0, import_jsx_runtime26.jsx)("div", { className: "analytics-canvas", hidden: Boolean(chartError), children: /* @__PURE__ */ (0, import_jsx_runtime26.jsx)(
            "canvas",
            {
              ref: canvasRef,
              role: "img",
              "aria-label": `Monthly revenue by start date: ${data?.months.map((month) => `${monthStart(month.month)} ${pesos2(month.amount)}`).join(", ")}`
            }
          ) })
        ]
      }
    );
  }
  var import_react22, import_jsx_runtime26, monthStart;
  var init_RevenueChart = __esm({
    "src/components/admin/analytics/RevenueChart.jsx"() {
      init_define_import_meta_env();
      import_react22 = __toESM(require_react(), 1);
      init_formatDate();
      init_ChartCard();
      init_useAnalyticsChart();
      import_jsx_runtime26 = __toESM(require_jsx_runtime(), 1);
      monthStart = (month) => formatDate(`${month}-01`);
    }
  });

  // src/components/admin/analytics/PaymentMethodsChart.jsx
  function PaymentMethodsChart({ data, loading, error, onRetry }) {
    const createConfig = (0, import_react23.useCallback)(
      (colors) => {
        const options = chartOptions(colors, { doughnut: true });
        options.plugins.tooltip.callbacks = {
          label: (context) => {
            const method = data.methods[context.dataIndex];
            return `${method.label}: ${method.percent}% (${method.count} payments)`;
          }
        };
        const labels = data.methods.map((method) => `${method.label} ${method.percent}%`);
        return {
          type: "doughnut",
          data: {
            labels,
            datasets: [
              {
                data: data.methods.map((method) => method.count),
                backgroundColor: [colors.navy, colors.orange],
                borderColor: colors.surface,
                borderWidth: 4,
                hoverOffset: 5
              }
            ]
          },
          options
        };
      },
      [data]
    );
    const { canvasRef, chartError } = useAnalyticsChart(
      createConfig,
      !loading && !error && data?.total > 0
    );
    return /* @__PURE__ */ (0, import_jsx_runtime27.jsxs)(
      ChartCard,
      {
        title: "Payment Methods",
        subtitle: "Cash and GCash \xB7 Successful payment count \xB7 All time",
        loading,
        error,
        empty: !data?.total,
        onRetry,
        children: [
          chartError && /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("p", { className: "analytics-chart-error", role: "alert", children: chartError }),
          /* @__PURE__ */ (0, import_jsx_runtime27.jsx)("div", { className: "analytics-canvas", hidden: Boolean(chartError), children: /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(
            "canvas",
            {
              ref: canvasRef,
              role: "img",
              "aria-label": `Payment share: ${data?.methods.map((method) => `${method.label} ${method.percent}%`).join(", ")}`
            }
          ) })
        ]
      }
    );
  }
  var import_react23, import_jsx_runtime27;
  var init_PaymentMethodsChart = __esm({
    "src/components/admin/analytics/PaymentMethodsChart.jsx"() {
      init_define_import_meta_env();
      import_react23 = __toESM(require_react(), 1);
      init_ChartCard();
      init_useAnalyticsChart();
      import_jsx_runtime27 = __toESM(require_jsx_runtime(), 1);
    }
  });

  // src/components/admin/analytics/analytics.css
  var init_analytics = __esm({
    "src/components/admin/analytics/analytics.css"() {
    }
  });

  // src/components/admin/analytics/AdminAnalytics.jsx
  function useAnalyticsResource(path, token, refreshKey) {
    const [state, setState] = (0, import_react24.useState)({ data: null, loading: true, error: "" });
    const [attempt, setAttempt] = (0, import_react24.useState)(0);
    (0, import_react24.useEffect)(() => {
      const controller = new AbortController();
      setState({ data: null, loading: true, error: "" });
      apiRequest(`/analytics/${path}`, { token, signal: controller.signal }).then((data) => {
        if (!validPayload[path](data))
          throw new Error("The analytics response was incomplete. Please try again.");
        if (!controller.signal.aborted) setState({ data, loading: false, error: "" });
      }).catch((cause) => {
        if (!controller.signal.aborted)
          setState({ data: null, loading: false, error: cause.message });
      });
      return () => controller.abort();
    }, [path, token, refreshKey, attempt]);
    return { ...state, onRetry: () => setAttempt((value) => value + 1) };
  }
  function AdminAnalytics({ refreshKey }) {
    const { token } = useAuth();
    const attendance2 = useAnalyticsResource("attendance", token, refreshKey);
    const membership = useAnalyticsResource("membership-status", token, refreshKey);
    const revenue = useAnalyticsResource("revenue", token, refreshKey);
    const payments2 = useAnalyticsResource("payments", token, refreshKey);
    const stats = [
      {
        label: "Total members",
        value: membership.data?.totalMembers,
        resource: membership,
        icon: "users"
      },
      {
        label: "Check-ins this week",
        value: attendance2.data?.total,
        resource: attendance2,
        icon: "qr"
      },
      {
        label: "Expiring soon",
        value: membership.data?.expiringSoon,
        resource: membership,
        icon: "bell",
        danger: true
      },
      {
        label: "Revenue this month",
        value: revenue.data ? pesos2(revenue.data.revenueThisMonth) : null,
        resource: revenue,
        icon: "wallet"
      }
    ];
    return /* @__PURE__ */ (0, import_jsx_runtime28.jsxs)("div", { className: "admin-analytics", children: [
      /* @__PURE__ */ (0, import_jsx_runtime28.jsx)("section", { className: "analytics-stats", "aria-label": "Gym analytics totals", children: stats.map(({ label, value, resource, icon, danger }) => /* @__PURE__ */ (0, import_jsx_runtime28.jsxs)(
        "article",
        {
          className: `clay analytics-stat${danger ? " analytics-stat-danger" : ""}`,
          "aria-busy": resource.loading,
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime28.jsx)("span", { className: "analytics-stat-icon", children: /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(Icon2, { name: icon }) }),
            /* @__PURE__ */ (0, import_jsx_runtime28.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime28.jsx)("h2", { children: label }),
              resource.loading ? /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(
                "span",
                {
                  className: "analytics-skeleton analytics-value-skeleton",
                  "aria-label": `Loading ${label}`
                }
              ) : /* @__PURE__ */ (0, import_jsx_runtime28.jsx)("strong", { title: resource.error || void 0, children: resource.error ? "Unavailable" : value })
            ] })
          ]
        },
        label
      )) }),
      /* @__PURE__ */ (0, import_jsx_runtime28.jsxs)("section", { className: "analytics-grid", "aria-label": "Gym analytics charts", children: [
        /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(AttendanceChart, { ...attendance2 }),
        /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(MembershipStatusChart, { ...membership }),
        /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(RevenueChart, { ...revenue }),
        /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(PaymentMethodsChart, { ...payments2 })
      ] })
    ] });
  }
  var import_react24, import_jsx_runtime28, validPayload;
  var init_AdminAnalytics = __esm({
    "src/components/admin/analytics/AdminAnalytics.jsx"() {
      init_define_import_meta_env();
      import_react24 = __toESM(require_react(), 1);
      init_AuthContext();
      init_api();
      init_DashboardShell2();
      init_AttendanceChart();
      init_MembershipStatusChart();
      init_RevenueChart();
      init_PaymentMethodsChart();
      init_useAnalyticsChart();
      init_analytics();
      import_jsx_runtime28 = __toESM(require_jsx_runtime(), 1);
      validPayload = {
        attendance: (data) => Array.isArray(data.days) && Number.isFinite(data.total),
        "membership-status": (data) => ["totalMembers", "active", "expiringSoon", "expired", "unclassified"].every(
          (key) => Number.isFinite(data[key])
        ),
        revenue: (data) => Array.isArray(data.months) && Number.isFinite(data.paymentCount) && Number.isFinite(data.revenueThisMonth),
        payments: (data) => Array.isArray(data.methods) && Number.isFinite(data.total)
      };
    }
  });

  // src/utils/membership.js
  function filterMemberRecords(members, query2) {
    const term = query2.trim().toLowerCase();
    return members.filter(
      (member2) => `${member2.name} ${member2.memberCode || ""} ${member2.id} ${member2.email} ${member2.phone || ""}`.toLowerCase().includes(term)
    );
  }
  function membershipState(member2, now = Date.now()) {
    const start = Date.parse(member2?.membershipStart || member2?.joined);
    const end = Date.parse(member2?.membershipEnd);
    const status = String(member2?.status || "").toLowerCase();
    if (status === "expired" || Number.isFinite(end) && end <= now)
      return { status: "expired", label: "Expired", daysLeft: 0 };
    if (status && status !== "active")
      return { status, label: status[0].toUpperCase() + status.slice(1), daysLeft: null };
    if (!Number.isFinite(start) || !Number.isFinite(end))
      return { status: "incomplete", label: "Dates missing", daysLeft: null };
    if (start > now)
      return { status: "upcoming", label: "Not started", daysLeft: Math.ceil((end - now) / DAY_MS) };
    if (status !== "active") return { status: "incomplete", label: "Status missing", daysLeft: null };
    return { status: "active", label: "Active", daysLeft: Math.ceil((end - now) / DAY_MS) };
  }
  function reminderMembers(members, reminderDays = 7, now = Date.now()) {
    return members.filter((member2) => {
      const state = membershipState(member2, now);
      return state.status === "expired" || state.status === "active" && state.daysLeft <= reminderDays;
    }).sort((a, b) => Date.parse(a.membershipEnd) - Date.parse(b.membershipEnd));
  }
  function inspectionDue(item, now = Date.now()) {
    const inspected = Date.parse(item.lastInspected);
    return !Number.isFinite(inspected) || now - inspected >= 30 * DAY_MS;
  }
  var DAY_MS;
  var init_membership = __esm({
    "src/utils/membership.js"() {
      init_define_import_meta_env();
      DAY_MS = 864e5;
    }
  });

  // src/components/admin/AdminDashboardSection.jsx
  function AdminDashboardSection({ currentUser, setModal, setSection, members, active, data, today, money: money3, revenue, loading, expiredMembers, renewals, reminderList, date: date4 }) {
    return /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)(import_jsx_runtime29.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("section", { className: "card clay illustrated-heading dashboard-overview", children: /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("span", { className: "dashboard-eyebrow", children: "YOUR GYM, AT A GLANCE" }),
        /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("h2", { children: "Let\u2019s keep the momentum going." }),
        /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("p", { children: [
          "Welcome back, ",
          currentUser?.name?.split(" ")[0] || "coach",
          ". Here\u2019s how your community is moving."
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("div", { className: "dashboard-quick-actions", children: [
          currentUser?.role === "admin" && /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("button", { className: "btn", type: "button", onClick: () => setModal({ kind: "create" }), children: [
            /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(Icon2, { name: "users", size: 16 }),
            "Add a member"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("button", { className: "btn ghost", type: "button", onClick: () => setSection("Reports"), children: [
            /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(Icon2, { name: "chart", size: 16 }),
            "Explore reports"
          ] })
        ] })
      ] }) }),
      currentUser?.role === "admin" ? /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(AdminAnalytics, { refreshKey: data }) : /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)(import_jsx_runtime29.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("section", { className: "grid admin-stats", children: [
          ["Total Members", members.length, "users", "b1"],
          ["Active Memberships", active, "card", "b2"],
          [
            "Today's Check-ins",
            data.attendance.filter((item) => manilaDateKey(item.date) === today).length,
            "qr",
            "b3"
          ],
          ["Payments recorded", money3(revenue), "wallet", "b4"]
        ].map(([label, value, icon, color]) => /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("article", { className: "stat clay", children: [
          /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("span", { className: `bub ${color}`, children: /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(Icon2, { name: icon }) }),
          /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("small", { children: label }),
            /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("b", { children: value })
          ] })
        ] }, label)) }),
        /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(
          ActivityChart,
          {
            attendance: data.attendance,
            payments: data.payments,
            admin: true,
            loading
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("section", { className: "grid g2", children: [
        /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("article", { className: "card clay", children: [
          /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("div", { className: "admin-card-heading", children: [
            /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("h2", { children: "Membership overview" }),
            /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(Icon2, { name: "card" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("div", { className: "admin-summary", children: [
            /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("span", { children: "Active memberships" }),
              /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("strong", { children: active })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("span", { children: "Expired memberships" }),
              /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("strong", { children: expiredMembers.length })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("span", { children: "Records needing review" }),
              /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("strong", { children: members.length - active - expiredMembers.length })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("span", { children: "Renewals recorded" }),
              /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("strong", { children: renewals.length })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("article", { className: "card clay", children: [
          /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("div", { className: "admin-card-heading", children: [
            /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("h2", { children: "Membership reminders" }),
            /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("span", { className: "pill p-warn", children: reminderList.length })
          ] }),
          reminderList.length ? /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("ul", { className: "admin-list", children: reminderList.slice(0, 4).map((member2) => /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("li", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("strong", { children: member2.name }),
              /* @__PURE__ */ (0, import_jsx_runtime29.jsxs)("small", { children: [
                membershipState(member2).status === "expired" ? "Expired" : "Expiring soon",
                " ",
                "\xB7 ",
                date4(member2.membershipEnd)
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(
              "button",
              {
                className: "btn ghost",
                type: "button",
                onClick: () => setModal({ kind: "renew", member: member2 }),
                children: "Renew"
              }
            )
          ] }, member2.id)) }) : /* @__PURE__ */ (0, import_jsx_runtime29.jsx)("p", { className: "admin-empty", children: "No memberships are due for a reminder." }),
          /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(
            "button",
            {
              className: "admin-text-button",
              type: "button",
              onClick: () => setSection("Notifications"),
              children: "View all reminders \u2192"
            }
          )
        ] })
      ] })
    ] });
  }
  var import_jsx_runtime29;
  var init_AdminDashboardSection = __esm({
    "src/components/admin/AdminDashboardSection.jsx"() {
      init_define_import_meta_env();
      init_DashboardShell2();
      init_ActivityChart2();
      init_AdminAnalytics();
      init_membership();
      init_formatDate();
      import_jsx_runtime29 = __toESM(require_jsx_runtime(), 1);
    }
  });

  // src/components/DataTable.jsx
  function textContent(node) {
    if (node === null || node === void 0 || typeof node === "boolean") return "";
    if (typeof node === "string" || typeof node === "number") return String(node);
    if (Array.isArray(node)) return node.map(textContent).join(" ");
    if ((0, import_react25.isValidElement)(node))
      return textContent(node.props.children ?? node.props.status ?? node.props.value);
    return "";
  }
  function DataTable({
    headings,
    children,
    empty,
    caption = "Records",
    searchable = true
  }) {
    const searchId = (0, import_react25.useId)();
    const sortFieldId = (0, import_react25.useId)();
    const sortOrderId = (0, import_react25.useId)();
    const [query2, setQuery] = (0, import_react25.useState)("");
    const [sort, setSort] = (0, import_react25.useState)({ index: null, ascending: true });
    const rows = (0, import_react25.useMemo)(() => {
      const result2 = empty ? [] : import_react25.Children.toArray(children).filter(
        (row) => textContent(row).toLowerCase().includes(query2.trim().toLowerCase())
      );
      if (sort.index !== null)
        result2.sort((a, b) => {
          const aText = textContent(import_react25.Children.toArray(a.props.children)[sort.index]);
          const bText = textContent(import_react25.Children.toArray(b.props.children)[sort.index]);
          let comparison;
          if (/amount/i.test(headings[sort.index]))
            comparison = Number(aText.replace(/[^\d.-]/g, "")) - Number(bText.replace(/[^\d.-]/g, ""));
          else if (/date|joined|expires/i.test(headings[sort.index]) && Number.isFinite(Date.parse(aText)) && Number.isFinite(Date.parse(bText)))
            comparison = Date.parse(aText) - Date.parse(bText);
          else
            comparison = aText.localeCompare(bText, void 0, { numeric: true, sensitivity: "base" });
          return sort.ascending ? comparison : -comparison;
        });
      return result2;
    }, [children, empty, headings, query2, sort]);
    return /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)("div", { className: "data-table", children: [
      /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)("div", { className: "table-toolbar", children: [
        searchable && /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)("label", { htmlFor: searchId, children: [
          "Search records",
          /* @__PURE__ */ (0, import_jsx_runtime30.jsx)(
            "input",
            {
              id: searchId,
              type: "search",
              value: query2,
              placeholder: "Type to filter...",
              onChange: (event) => setQuery(event.target.value)
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)("label", { className: "table-sort table-sort-field", htmlFor: sortFieldId, children: [
          "Records",
          /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)(
            "select",
            {
              id: sortFieldId,
              value: sort.index === null ? "original" : sort.index,
              onChange: (event) => {
                setSort({
                  index: event.target.value === "original" ? null : Number(event.target.value),
                  ascending: sort.ascending
                });
              },
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("option", { value: "original", children: "Original order" }),
                headings.map(
                  (heading, index) => /^actions?$/i.test(heading) ? null : /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("option", { value: index, children: heading }, index)
                )
              ]
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)("label", { className: "table-sort table-sort-order", htmlFor: sortOrderId, children: [
          "Sort by:",
          /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)(
            "select",
            {
              id: sortOrderId,
              value: sort.ascending ? "ascending" : "descending",
              onChange: (event) => {
                setSort((current) => ({
                  ...current,
                  ascending: event.target.value === "ascending"
                }));
              },
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("option", { value: "ascending", children: "Ascending" }),
                /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("option", { value: "descending", children: "Descending" })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)("span", { className: "table-record-count", role: "status", children: [
          rows.length,
          " record",
          rows.length === 1 ? "" : "s"
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("div", { className: "table-wrap", role: "region", "aria-label": caption, tabIndex: 0, children: /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)(
        "table",
        {
          role: "table",
          style: {
            "--table-min-width": headings.length > 2 ? `${headings.length * 144}px` : "100%"
          },
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("caption", { className: "sr-only", children: caption }),
            /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("tr", { role: "row", children: headings.map((heading, index) => /* @__PURE__ */ (0, import_jsx_runtime30.jsx)(
              "th",
              {
                className: /amount/i.test(heading) ? "table-number" : /^actions?$/i.test(heading) ? "table-actions-heading" : void 0,
                role: "columnheader",
                scope: "col",
                "aria-sort": sort.index === index ? sort.ascending ? "ascending" : "descending" : void 0,
                children: /^actions?$/i.test(heading) ? heading : /* @__PURE__ */ (0, import_jsx_runtime30.jsxs)(
                  "button",
                  {
                    type: "button",
                    onClick: () => {
                      setSort({ index, ascending: sort.index === index ? !sort.ascending : true });
                    },
                    children: [
                      heading,
                      /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("span", { "aria-hidden": "true", children: sort.index === index ? sort.ascending ? " \u2191" : " \u2193" : " \u2195" })
                    ]
                  }
                )
              },
              heading
            )) }) }),
            /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("tbody", { children: rows.length ? rows.map(
              (row) => (0, import_react25.cloneElement)(
                row,
                { role: "row" },
                import_react25.Children.toArray(row.props.children).map(
                  (cell, index) => (0, import_react25.isValidElement)(cell) ? (0, import_react25.cloneElement)(
                    cell,
                    {
                      role: "cell",
                      "data-label": headings[index],
                      className: [
                        cell.props.className,
                        /amount/i.test(headings[index]) ? "table-number" : ""
                      ].filter(Boolean).join(" ")
                    },
                    cell.props.className?.split(" ").includes("acts") ? /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("div", { className: "table-cell-actions", children: cell.props.children }) : cell.props.children
                  ) : cell
                )
              )
            ) : /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("tr", { role: "row", children: /* @__PURE__ */ (0, import_jsx_runtime30.jsx)("td", { role: "cell", colSpan: headings.length, className: "table-empty", children: query2 ? "No matching records. Try another search." : "No records yet." }) }) })
          ]
        }
      ) })
    ] });
  }
  var import_react25, import_jsx_runtime30;
  var init_DataTable = __esm({
    "src/components/DataTable.jsx"() {
      init_define_import_meta_env();
      import_react25 = __toESM(require_react(), 1);
      import_jsx_runtime30 = __toESM(require_jsx_runtime(), 1);
    }
  });

  // src/components/RecordDeleteControls.jsx
  function RecordDeleteButton({ all = false, label, disabled = false, onClick }) {
    return /* @__PURE__ */ (0, import_jsx_runtime31.jsxs)(
      "button",
      {
        className: all ? "btn report-clear-button" : "report-icon-button is-danger record-delete-button",
        type: "button",
        title: label,
        "aria-label": label,
        "aria-haspopup": "dialog",
        disabled,
        onClick,
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime31.jsx)(Icon2, { name: all ? "clear-data" : "delete-data", size: all ? 21 : 19 }),
          all && /* @__PURE__ */ (0, import_jsx_runtime31.jsx)("span", { children: "Clear all data" })
        ]
      }
    );
  }
  function RecordDeleteDialog({ target, onClose, onChanged, onNotice }) {
    const { token } = useAuth();
    const [busy, setBusy] = (0, import_react26.useState)(false);
    const [error, setError] = (0, import_react26.useState)("");
    const [confirmation, setConfirmation] = (0, import_react26.useState)("");
    const confirmationHelpId = (0, import_react26.useId)();
    const actionLock = (0, import_react26.useRef)(false);
    const all = target.all === true;
    const details = CATEGORIES[target.category];
    const remove = async (event) => {
      event.preventDefault();
      if (actionLock.current) return;
      const confirmed = new FormData(event.currentTarget).get("confirmation");
      if (all && confirmed !== "CLEAR") {
        setError("Type CLEAR exactly to enable clearing these records.");
        return;
      }
      actionLock.current = true;
      setBusy(true);
      setError("");
      try {
        const collection = target.category === "renewals" ? "payments" : target.category;
        const base = target.category === "equipment" ? "/admin/equipment" : target.category === "notifications" ? "/admin/notifications" : `/admin/reports/${collection}`;
        const result2 = await apiRequest(`${base}${all ? "" : `/${target.id}`}`, {
          token,
          method: "DELETE",
          ...all ? {
            body: JSON.stringify({
              category: target.category,
              group: target.group,
              confirmation: confirmed
            })
          } : {}
        });
        let refreshed = false;
        try {
          refreshed = await onChanged() !== false;
        } catch {
          refreshed = false;
        }
        const message = all ? `${result2.deleted} record${result2.deleted === 1 ? "" : "s"} cleared.` : "Record deleted.";
        onNotice(
          `${message} ${refreshed ? "Records and totals refreshed." : "Refresh failed. Reload the page to see the latest records."}`
        );
        onClose();
      } catch (cause) {
        setError(cause.message || "Unable to delete records. Please try again.");
      } finally {
        actionLock.current = false;
        setBusy(false);
      }
    };
    return /* @__PURE__ */ (0, import_jsx_runtime31.jsxs)(
      Dialog,
      {
        title: all ? `Clear all ${target.scopeLabel || `${details.title} data`}?` : "Delete this record?",
        busy,
        onClose,
        children: [
          error && /* @__PURE__ */ (0, import_jsx_runtime31.jsx)(RockyDeleteError, { message: error }),
          /* @__PURE__ */ (0, import_jsx_runtime31.jsxs)("form", { className: "mf", onSubmit: remove, children: [
            /* @__PURE__ */ (0, import_jsx_runtime31.jsxs)("p", { className: "modal-copy", children: [
              all ? /* @__PURE__ */ (0, import_jsx_runtime31.jsxs)(import_jsx_runtime31.Fragment, { children: [
                "Clear all ",
                /* @__PURE__ */ (0, import_jsx_runtime31.jsx)("strong", { children: target.scopeLabel || `${details.title} records` }),
                "? Currently loaded: ",
                target.count,
                ". This includes records hidden by search."
              ] }) : /* @__PURE__ */ (0, import_jsx_runtime31.jsxs)(import_jsx_runtime31.Fragment, { children: [
                "Delete the ",
                details.title,
                " record for ",
                /* @__PURE__ */ (0, import_jsx_runtime31.jsx)("strong", { children: target.label }),
                "?"
              ] }),
              " ",
              "This cannot be undone. ",
              details.effect,
              all && target.category !== "notifications" && " You can cancel and export a CSV copy from Reports first."
            ] }),
            all && /* @__PURE__ */ (0, import_jsx_runtime31.jsxs)("label", { className: "field", children: [
              "Type CLEAR to confirm",
              /* @__PURE__ */ (0, import_jsx_runtime31.jsx)(
                "input",
                {
                  className: "clay-in",
                  name: "confirmation",
                  value: confirmation,
                  onChange: (event) => setConfirmation(event.target.value),
                  required: true,
                  pattern: "CLEAR",
                  "aria-describedby": confirmationHelpId,
                  autoComplete: "off",
                  spellCheck: false,
                  disabled: busy,
                  "data-autofocus": true
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime31.jsx)("small", { id: confirmationHelpId, className: "form-help", children: "The clear button is enabled after you type CLEAR in capital letters." })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime31.jsxs)("div", { className: "ma", children: [
              /* @__PURE__ */ (0, import_jsx_runtime31.jsx)("button", { className: "btn ghost cancel-button", type: "button", disabled: busy, onClick: onClose, children: "Cancel" }),
              /* @__PURE__ */ (0, import_jsx_runtime31.jsxs)(
                "button",
                {
                  className: "btn danger",
                  type: "submit",
                  disabled: busy || all && confirmation !== "CLEAR",
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime31.jsx)(Icon2, { name: all ? "clear-data" : "delete-data", size: 19 }),
                    busy ? "Deleting\u2026" : all ? "Clear all data" : "Delete record"
                  ]
                }
              )
            ] })
          ] })
        ]
      }
    );
  }
  var import_react26, import_jsx_runtime31, CATEGORIES;
  var init_RecordDeleteControls = __esm({
    "src/components/RecordDeleteControls.jsx"() {
      init_define_import_meta_env();
      import_react26 = __toESM(require_react(), 1);
      init_AuthContext();
      init_api();
      init_Dialog();
      init_DashboardShell2();
      init_GorillaAssistant();
      import_jsx_runtime31 = __toESM(require_jsx_runtime(), 1);
      CATEGORIES = {
        notifications: {
          title: "notification",
          effect: "Only your current alerts are dismissed. Member and equipment records are preserved."
        },
        attendance: {
          title: "attendance",
          effect: "Attendance totals and charts will update."
        },
        payments: {
          title: "payment",
          effect: "Recorded revenue will decrease. Membership dates stay unchanged."
        },
        renewals: {
          title: "renewal payment",
          effect: "Only renewal payments are included. Membership dates stay unchanged."
        },
        maintenance: {
          title: "maintenance",
          effect: "Equipment and its current condition stay unchanged."
        },
        equipment: {
          title: "equipment",
          effect: "Existing maintenance history is retained."
        }
      };
    }
  });

  // src/components/AccountDeleteDialog.jsx
  function AccountDeleteDialog({ account, onClose, onDeleted }) {
    const { token } = useAuth();
    const [busy, setBusy] = (0, import_react27.useState)(false);
    const [error, setError] = (0, import_react27.useState)("");
    const actionLock = (0, import_react27.useRef)(false);
    const remove = async (event) => {
      event.preventDefault();
      if (actionLock.current) return;
      const values = new FormData(event.currentTarget);
      if (values.get("confirmation") !== "DELETE") {
        setError("Type DELETE to confirm account deletion.");
        return;
      }
      actionLock.current = true;
      setBusy(true);
      setError("");
      try {
        await apiRequest(`/admin/members/${account.id}`, {
          token,
          method: "DELETE",
          body: JSON.stringify({
            confirmation: values.get("confirmation"),
            currentPassword: values.get("currentPassword")
          })
        });
      } catch (cause) {
        setError(
          cause.message || "Unable to delete the account. Please try again."
        );
        actionLock.current = false;
        setBusy(false);
        return;
      }
      onDeleted();
    };
    return /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(
      Dialog,
      {
        title: "Delete member account?",
        busy,
        onClose,
        children: /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("form", { className: "mf", onSubmit: remove, children: [
          /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("p", { className: "modal-copy", children: [
            "Permanently delete ",
            /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("strong", { children: account.name }),
            " (",
            account.email,
            "). Their login, profile, membership, payments, and attendance history will be removed. This cannot be undone."
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("label", { className: "field", children: [
            "Your current password",
            /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(
              "input",
              {
                className: "clay-in",
                name: "currentPassword",
                type: "password",
                autoComplete: "current-password",
                required: true,
                disabled: busy,
                "data-autofocus": true
              }
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("label", { className: "field", children: [
            "Type DELETE to confirm",
            /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(
              "input",
              {
                className: "clay-in",
                name: "confirmation",
                autoComplete: "off",
                spellCheck: false,
                pattern: "DELETE",
                required: true,
                disabled: busy
              }
            )
          ] }),
          error && /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(RockyDeleteError, { message: error }),
          /* @__PURE__ */ (0, import_jsx_runtime32.jsxs)("div", { className: "ma", children: [
            /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(
              "button",
              {
                className: "btn ghost",
                type: "button",
                disabled: busy,
                onClick: onClose,
                children: "Cancel"
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(
              "button",
              {
                className: "btn danger",
                type: "submit",
                disabled: busy,
                children: busy ? "Deleting..." : "Delete account"
              }
            )
          ] })
        ] })
      }
    );
  }
  var import_react27, import_jsx_runtime32;
  var init_AccountDeleteDialog = __esm({
    "src/components/AccountDeleteDialog.jsx"() {
      init_define_import_meta_env();
      import_react27 = __toESM(require_react(), 1);
      init_AuthContext();
      init_api();
      init_Dialog();
      init_GorillaAssistant();
      import_jsx_runtime32 = __toESM(require_jsx_runtime(), 1);
    }
  });

  // src/components/CreatedMemberCredentials.jsx
  function CreatedMemberCredentials({
    member: member2,
    temporaryPassword,
    onDismiss,
    date: date4
  }) {
    const [copyStatus, setCopyStatus] = (0, import_react28.useState)("");
    async function copyPassword() {
      try {
        await navigator.clipboard.writeText(temporaryPassword);
        setCopyStatus("Copied.");
      } catch {
        setCopyStatus("Could not copy. Select the password to copy it manually.");
      }
    }
    return /* @__PURE__ */ (0, import_jsx_runtime33.jsxs)("section", { className: "created-credentials", "aria-label": "New member sign-in details", children: [
      /* @__PURE__ */ (0, import_jsx_runtime33.jsxs)("p", { children: [
        "Give these details to ",
        member2.name,
        ". The temporary password is shown only now and cannot be retrieved after you close this screen."
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime33.jsxs)("dl", { children: [
        member2.memberCode && /* @__PURE__ */ (0, import_jsx_runtime33.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime33.jsx)("dt", { children: "Member code" }),
          /* @__PURE__ */ (0, import_jsx_runtime33.jsx)("dd", { children: member2.memberCode })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime33.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime33.jsx)("dt", { children: "Email" }),
          /* @__PURE__ */ (0, import_jsx_runtime33.jsx)("dd", { children: member2.email })
        ] }),
        date4 && /* @__PURE__ */ (0, import_jsx_runtime33.jsxs)(import_jsx_runtime33.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime33.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime33.jsx)("dt", { children: "Plan" }),
            /* @__PURE__ */ (0, import_jsx_runtime33.jsx)("dd", { children: member2.plan })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime33.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime33.jsx)("dt", { children: "Valid until (Manila)" }),
            /* @__PURE__ */ (0, import_jsx_runtime33.jsx)("dd", { children: date4(member2.membershipEnd) })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime33.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime33.jsx)("dt", { children: "Temporary password" }),
          /* @__PURE__ */ (0, import_jsx_runtime33.jsx)("dd", { children: /* @__PURE__ */ (0, import_jsx_runtime33.jsx)("code", { children: temporaryPassword }) })
        ] })
      ] }),
      date4 && /* @__PURE__ */ (0, import_jsx_runtime33.jsxs)(import_jsx_runtime33.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime33.jsx)("button", { type: "button", className: "btn ghost", onClick: copyPassword, children: "Copy" }),
        copyStatus && /* @__PURE__ */ (0, import_jsx_runtime33.jsx)("p", { role: "status", children: copyStatus })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime33.jsx)("p", { children: "The member must choose a new password before accessing their dashboard." }),
      /* @__PURE__ */ (0, import_jsx_runtime33.jsx)("div", { className: "ma", children: /* @__PURE__ */ (0, import_jsx_runtime33.jsx)("button", { type: "button", className: "btn", onClick: onDismiss, children: "Done" }) })
    ] });
  }
  var import_react28, import_jsx_runtime33;
  var init_CreatedMemberCredentials = __esm({
    "src/components/CreatedMemberCredentials.jsx"() {
      init_define_import_meta_env();
      import_react28 = __toESM(require_react(), 1);
      import_jsx_runtime33 = __toESM(require_jsx_runtime(), 1);
    }
  });

  // src/components/admin/AdminStatus.jsx
  function Pill({ status }) {
    const state = String(status || "").toLowerCase();
    return /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(
      "span",
      {
        className: `pill ${state === "active" || state === "good" ? "p-ok" : state === "expired" || state === "out of service" ? "p-bad" : "p-warn"}`,
        children: status || "Active"
      }
    );
  }
  function memberBadge(member2) {
    const state = membershipState(member2);
    return state.status === "active" && state.daysLeft <= 7 ? "Expiring" : state.label;
  }
  var import_jsx_runtime34;
  var init_AdminStatus = __esm({
    "src/components/admin/AdminStatus.jsx"() {
      init_define_import_meta_env();
      init_membership();
      import_jsx_runtime34 = __toESM(require_jsx_runtime(), 1);
    }
  });

  // src/components/admin/AdminDialogParts.jsx
  function Modal({
    title,
    children,
    onClose,
    busy,
    error,
    className,
    invalidField,
    dismissOnBackdrop,
    dismissOnEscape
  }) {
    return /* @__PURE__ */ (0, import_jsx_runtime35.jsxs)(
      Dialog,
      {
        title,
        onClose,
        busy,
        className,
        invalidField,
        dismissOnBackdrop,
        dismissOnEscape,
        children: [
          error && /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("p", { className: "form-error", role: "alert", children: error }),
          busy && /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("p", { className: "form-help", role: "status", children: "Saving..." }),
          /* @__PURE__ */ (0, import_jsx_runtime35.jsx)("fieldset", { className: "modal-fields", disabled: busy, children })
        ]
      }
    );
  }
  var import_jsx_runtime35;
  var init_AdminDialogParts = __esm({
    "src/components/admin/AdminDialogParts.jsx"() {
      init_define_import_meta_env();
      init_Dialog();
      import_jsx_runtime35 = __toESM(require_jsx_runtime(), 1);
    }
  });

  // src/components/admin/AdminMemberDialogs.jsx
  function AdminMemberDialogs({ modal, setModal, pending, error, renewals, money: money3, date: date4, updateMember, data, planOptionLabel: planOptionLabel2, recordPayment, members, currentUser, act }) {
    const mobile = (0, import_react29.useContext)(DashboardSheetContext);
    return /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)(import_jsx_runtime36.Fragment, { children: [
      modal?.kind === "view" && /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)(
        Modal,
        {
          busy: pending,
          error,
          title: "Member profile",
          className: "member-profile-dialog",
          onClose: () => setModal(null),
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)("div", { className: "member-profile-summary", children: [
              /* @__PURE__ */ (0, import_jsx_runtime36.jsx)(ProfileAvatar, { user: modal.member, memberId: modal.member.id, large: true }),
              /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)("div", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("strong", { className: "profile-name", children: modal.member.name }),
                /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("span", { className: "member-profile-code", children: modal.member.memberCode || modal.member.id }),
                /* @__PURE__ */ (0, import_jsx_runtime36.jsx)(Pill, { status: memberBadge(modal.member) })
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)("section", { className: "member-profile-section", "aria-label": "Contact details", children: [
              /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("h3", { children: "Contact details" }),
              /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("dl", { className: "member-record", children: [
                ["Email", modal.member.email],
                ["Phone", modal.member.phone || "Not added"]
              ].map(([label, value]) => /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)("div", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("dt", { children: label }),
                /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("dd", { children: value })
              ] }, label)) })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)("section", { className: "member-profile-section", "aria-label": "Membership details", children: [
              /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("h3", { children: "Membership" }),
              /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("dl", { className: "member-record", children: [
                ["Plan", modal.member.plan || "Not set"],
                ["Status", membershipState(modal.member).label],
                ["Starts", date4(modal.member.membershipStart || modal.member.joined)],
                ["Expires", date4(modal.member.membershipEnd)]
              ].map(([label, value]) => /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)("div", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("dt", { children: label }),
                /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("dd", { children: value })
              ] }, label)) })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)("div", { className: "ma", children: [
              mobile && /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("button", { className: "btn ghost", type: "button", onClick: () => setModal({ kind: "edit", member: modal.member }), children: "Edit member" }),
              mobile && currentUser?.role === "admin" && /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("button", { className: "btn danger", type: "button", onClick: () => setModal({ kind: "delete-account", member: modal.member }), children: "Delete account" }),
              /* @__PURE__ */ (0, import_jsx_runtime36.jsx)(
                "button",
                {
                  className: "btn",
                  type: "button",
                  onClick: () => setModal({ kind: "renew", member: modal.member }),
                  children: "Renew membership"
                }
              )
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)("section", { className: "member-profile-section", "aria-label": "Renewal history", children: [
              /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("h3", { children: "Renewal history" }),
              /* @__PURE__ */ (0, import_jsx_runtime36.jsx)(
                DataTable,
                {
                  headings: ["Plan", "Amount", "Method", "Date"],
                  caption: "Member renewal history",
                  searchable: false,
                  children: renewals.filter((payment) => payment.memberId === modal.member.id).map((payment) => /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)("tr", { children: [
                    /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("td", { children: payment.plan }),
                    /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("td", { children: money3(payment.amount) }),
                    /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("td", { children: payment.method }),
                    /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("td", { children: date4(payment.date) })
                  ] }, payment.id))
                }
              )
            ] })
          ]
        }
      ),
      modal?.kind === "edit" && /* @__PURE__ */ (0, import_jsx_runtime36.jsx)(Modal, { busy: pending, error, title: "Edit Member", onClose: () => setModal(null), children: /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)("form", { onSubmit: updateMember, className: "mf", children: [
        /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)("label", { className: "field", children: [
          "Full name",
          /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("input", { className: "clay-in", name: "name", defaultValue: modal.member.name, required: true })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)("label", { className: "field", children: [
          "Contact",
          /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("input", { className: "clay-in", name: "phone", defaultValue: modal.member.phone })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)("label", { className: "field", children: [
          "Email",
          /* @__PURE__ */ (0, import_jsx_runtime36.jsx)(
            "input",
            {
              className: "clay-in",
              name: "email",
              type: "email",
              defaultValue: modal.member.email,
              required: true
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("div", { className: "ma", children: /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("button", { className: "btn", children: "Save changes" }) })
      ] }) }),
      modal?.kind === "credentials" && /* @__PURE__ */ (0, import_jsx_runtime36.jsx)(Modal, { title: mobile ? "Successful creation of a new member" : "Member sign-in details", onClose: () => setModal(null), children: /* @__PURE__ */ (0, import_jsx_runtime36.jsx)(
        CreatedMemberCredentials,
        {
          member: modal.member,
          temporaryPassword: modal.temporaryPassword,
          date: mobile ? date4 : void 0,
          onDismiss: () => setModal(null)
        }
      ) }),
      modal?.kind === "renew" && /* @__PURE__ */ (0, import_jsx_runtime36.jsx)(Modal, { busy: pending, error, title: "Renew Membership", onClose: () => setModal(null), children: /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)(
        "form",
        {
          onSubmit: (event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            act(
              `/admin/members/${modal.member.id}/renew`,
              { method: "POST", body: JSON.stringify(Object.fromEntries(form)) },
              "Membership renewed."
            );
          },
          className: "mf",
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)("p", { children: [
              modal.member.name,
              " \xB7 ",
              modal.member.plan
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)("label", { className: "field", children: [
              "Plan",
              /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)(
                "select",
                {
                  className: "clay-in",
                  name: "plan",
                  defaultValue: data.membershipPlans.some((plan) => plan.plan_name === modal.member.plan) ? modal.member.plan : "",
                  required: true,
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("option", { value: "", disabled: true, children: "Select a membership plan" }),
                    data.membershipPlans.map((plan) => /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("option", { value: plan.plan_name, children: planOptionLabel2(plan) }, plan.plan_id))
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)("label", { className: "field", children: [
              "Payment method",
              /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)("select", { className: "clay-in", name: "method", children: [
                /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("option", { children: "Cash" }),
                /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("option", { children: "GCash" })
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("div", { className: "ma", children: /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("button", { className: "btn", children: "Renew" }) })
          ]
        }
      ) }),
      modal?.kind === "payment" && /* @__PURE__ */ (0, import_jsx_runtime36.jsx)(Modal, { busy: pending, error, title: "Record Payment", onClose: () => setModal(null), children: /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)("form", { onSubmit: recordPayment, className: "mf", children: [
        /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("p", { className: "form-help", children: "Record a Cash or GCash payment already received at the gym." }),
        /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)("label", { className: "field", children: [
          "Member",
          /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("select", { className: "clay-in", name: "memberId", children: members.map((member2) => /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("option", { value: member2.id, children: member2.name }, member2.id)) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)("label", { className: "field", children: [
          "Amount",
          /* @__PURE__ */ (0, import_jsx_runtime36.jsx)(
            "input",
            {
              className: "clay-in",
              name: "amount",
              type: "number",
              min: "0.01",
              step: "0.01",
              required: true
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)("label", { className: "field", children: [
          "Method",
          /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)("select", { className: "clay-in", name: "method", children: [
            /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("option", { children: "Cash" }),
            /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("option", { children: "GCash" })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("div", { className: "ma", children: /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("button", { className: "btn", children: "Save payment" }) })
      ] }) })
    ] });
  }
  var import_react29, import_jsx_runtime36;
  var init_AdminMemberDialogs = __esm({
    "src/components/admin/AdminMemberDialogs.jsx"() {
      init_define_import_meta_env();
      import_react29 = __toESM(require_react(), 1);
      init_DataTable();
      init_ProfileAvatar();
      init_CreatedMemberCredentials();
      init_membership();
      init_AdminStatus();
      init_AdminDialogParts();
      init_Dialog();
      import_jsx_runtime36 = __toESM(require_jsx_runtime(), 1);
    }
  });

  // shared/equipmentCategories.js
  var EQUIPMENT_CATEGORIES;
  var init_equipmentCategories = __esm({
    "shared/equipmentCategories.js"() {
      init_define_import_meta_env();
      EQUIPMENT_CATEGORIES = [
        "Cardio Zone",
        "Selectorized Strength Area",
        "Free Weights Section",
        "Plate-Loaded Power Zone",
        "Functional Training Area",
        "Group Exercise Studios",
        "Stretching & Mobility Zone",
        "Calisthenics Area"
      ];
    }
  });

  // src/components/EquipmentCategorySelect.jsx
  function EquipmentCategorySelect({ value, defaultValue = "", ...props }) {
    const currentCategory = value ?? defaultValue;
    const previousCategory = currentCategory && !EQUIPMENT_CATEGORIES.includes(currentCategory);
    return /* @__PURE__ */ (0, import_jsx_runtime37.jsxs)(
      "select",
      {
        className: "clay-in",
        name: "category",
        required: true,
        ...value === void 0 ? { defaultValue } : { value },
        ...props,
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("option", { value: "", disabled: true, children: "Choose category" }),
          previousCategory && /* @__PURE__ */ (0, import_jsx_runtime37.jsxs)("option", { value: currentCategory, disabled: true, children: [
            currentCategory,
            " (current category)"
          ] }),
          EQUIPMENT_CATEGORIES.map((category) => /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("option", { value: category, children: category }, category))
        ]
      }
    );
  }
  var import_jsx_runtime37;
  var init_EquipmentCategorySelect = __esm({
    "src/components/EquipmentCategorySelect.jsx"() {
      init_define_import_meta_env();
      init_equipmentCategories();
      import_jsx_runtime37 = __toESM(require_jsx_runtime(), 1);
    }
  });

  // src/components/admin/AdminOperationsDialogs.jsx
  function AdminOperationsDialogs({ modal, setModal, pending, error, act }) {
    return /* @__PURE__ */ (0, import_jsx_runtime38.jsxs)(import_jsx_runtime38.Fragment, { children: [
      modal?.kind === "maintenance" && /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(
        Modal,
        {
          busy: pending,
          error,
          title: "Log maintenance or repair",
          onClose: () => setModal(null),
          children: /* @__PURE__ */ (0, import_jsx_runtime38.jsxs)(
            "form",
            {
              className: "mf",
              onSubmit: (event) => {
                event.preventDefault();
                const values = Object.fromEntries(new FormData(event.currentTarget));
                act(
                  `/admin/equipment/${modal.item.id}`,
                  { method: "PATCH", body: JSON.stringify(values) },
                  "Maintenance recorded."
                );
              },
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime38.jsx)("p", { className: "form-help", children: modal.item.name }),
                /* @__PURE__ */ (0, import_jsx_runtime38.jsxs)("label", { className: "field", children: [
                  "Work completed",
                  /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(
                    "textarea",
                    {
                      className: "clay-in",
                      name: "maintenanceNote",
                      rows: "4",
                      maxLength: "500",
                      placeholder: "Describe the inspection, maintenance, or repair.",
                      required: true
                    }
                  )
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime38.jsxs)("label", { className: "field", children: [
                  "Condition after work",
                  /* @__PURE__ */ (0, import_jsx_runtime38.jsxs)("select", { className: "clay-in", name: "condition", defaultValue: modal.item.condition, children: [
                    /* @__PURE__ */ (0, import_jsx_runtime38.jsx)("option", { children: "Good" }),
                    /* @__PURE__ */ (0, import_jsx_runtime38.jsx)("option", { children: "Needs Maintenance" }),
                    /* @__PURE__ */ (0, import_jsx_runtime38.jsx)("option", { children: "Out of Service" })
                  ] })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime38.jsx)("div", { className: "ma", children: /* @__PURE__ */ (0, import_jsx_runtime38.jsx)("button", { className: "btn", type: "submit", children: "Save maintenance" }) })
              ]
            }
          )
        }
      ),
      modal?.kind === "equipment" && /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(Modal, { busy: pending, error, title: "Add Equipment", onClose: () => setModal(null), children: /* @__PURE__ */ (0, import_jsx_runtime38.jsxs)(
        "form",
        {
          onSubmit: (event) => {
            event.preventDefault();
            act(
              "/admin/equipment",
              {
                method: "POST",
                body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget)))
              },
              "Equipment added."
            );
          },
          className: "mf",
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime38.jsxs)("label", { className: "field", children: [
              "Equipment name",
              /* @__PURE__ */ (0, import_jsx_runtime38.jsx)("input", { className: "clay-in", name: "name", required: true })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime38.jsxs)("label", { className: "field", children: [
              "Category",
              /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(EquipmentCategorySelect, {})
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime38.jsx)("div", { className: "ma", children: /* @__PURE__ */ (0, import_jsx_runtime38.jsx)("button", { className: "btn", children: "Add" }) })
          ]
        }
      ) })
    ] });
  }
  var import_jsx_runtime38;
  var init_AdminOperationsDialogs = __esm({
    "src/components/admin/AdminOperationsDialogs.jsx"() {
      init_define_import_meta_env();
      init_EquipmentCategorySelect();
      init_AdminDialogParts();
      import_jsx_runtime38 = __toESM(require_jsx_runtime(), 1);
    }
  });

  // src/components/mobile/CreateMemberSheet.jsx
  var CreateMemberSheet_exports = {};
  __export(CreateMemberSheet_exports, {
    default: () => CreateMemberSheet
  });
  function Progress({ current }) {
    const active = PROGRESS.findIndex((item) => item.key === current);
    return /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("nav", { className: "fp-verification-progress", "aria-label": "Create member steps", children: PROGRESS.map(({ key, label }, index) => /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("div", { className: `fp-verification-progress-item ${index === active ? "is-current" : ""} ${index < active ? "is-complete" : ""}`, "aria-current": index === active ? "step" : void 0, children: [
      /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("div", { className: "fp-verification-track" }),
      /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("span", { children: label })
    ] }, key)) });
  }
  function readIdentityFile(file, format) {
    if (!file) return Promise.resolve(null);
    if (file.size > MAX_UPLOAD_BYTES) return Promise.reject(new Error("Choose a file smaller than 4 MB."));
    const pdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
    if (format === "pdf" ? !pdf : pdf || !["image/jpeg", "image/png", "image/webp"].includes(file.type))
      return Promise.reject(new Error(format === "pdf" ? "Upload a PDF document." : "Upload a JPEG, PNG, or WebP photo."));
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(format === "pdf" ? String(reader.result).replace(/^data:[^,]*,/, "data:application/pdf;base64,") : reader.result);
      reader.onerror = () => reject(new Error("Unable to read the selected file."));
      reader.readAsDataURL(file);
    });
  }
  function CreateMemberSheet({ plans: plans2, planOptionLabel: planOptionLabel2, pending, error, fieldError, onClose, onCreate, token }) {
    const [step, setStep] = (0, import_react30.useState)("details");
    const [details, setDetails] = (0, import_react30.useState)(EMPTY_DETAILS);
    const [method, setMethod] = (0, import_react30.useState)("Cash");
    const [idType, setIdType] = (0, import_react30.useState)("");
    const [consent, setConsent] = (0, import_react30.useState)(false);
    const [idSide, setIdSide] = (0, import_react30.useState)("front");
    const [idInputMode, setIdInputMode] = (0, import_react30.useState)("camera");
    const [idPdf, setIdPdf] = (0, import_react30.useState)(null);
    const [idPdfName, setIdPdfName] = (0, import_react30.useState)("");
    const [idFront, setIdFront] = (0, import_react30.useState)(null);
    const [idBack, setIdBack] = (0, import_react30.useState)(null);
    const [idTicket, setIdTicket] = (0, import_react30.useState)("");
    const [faceTurn, setFaceTurn] = (0, import_react30.useState)("right");
    const [faceFrames, setFaceFrames] = (0, import_react30.useState)({});
    const [faceMotion, setFaceMotion] = (0, import_react30.useState)({});
    const [localPending, setLocalPending] = (0, import_react30.useState)(false);
    const [localError, setLocalError] = (0, import_react30.useState)("");
    const busy = pending || localPending;
    const requiresBackSide = idType && idType !== "passport";
    const uploadReady = Boolean(idPdf || idFront && (!requiresBackSide || idBack));
    function moveTo(next) {
      setLocalError("");
      setStep(next);
    }
    function resetIdScan() {
      setIdFront(null);
      setIdBack(null);
      setIdPdf(null);
      setIdPdfName("");
      setIdTicket("");
      setIdSide("front");
      setFaceFrames({});
      setFaceMotion({});
      setFaceTurn("right");
      moveTo("id");
    }
    function goBack() {
      if (busy || step === "details") return;
      if (step === "id") return moveTo("details");
      if (step === "face") return resetIdScan();
      if (step === "closeup") {
        setFaceFrames({});
        setFaceMotion({});
        setFaceTurn("right");
        return moveTo("face");
      }
      return resetIdScan();
    }
    function submitDetails(event) {
      event.preventDefault();
      if (!consent || !idType || !method) {
        setLocalError("Select a payment method and ID type, and obtain member consent.");
        return;
      }
      setDetails((current) => ({ ...current, name: current.name.trim(), email: current.email.trim().toLowerCase(), phone: current.phone.trim() }));
      resetIdScan();
    }
    function captureFront(image) {
      setIdPdf(null);
      setIdFront(image);
      setIdBack(null);
      setIdSide("done");
      setLocalError("");
    }
    function captureBack(image) {
      setIdBack(image);
      setIdSide("done");
      setLocalError("");
    }
    function changeIdMode(mode) {
      if (busy || mode === idInputMode) return;
      setIdInputMode(mode);
      setIdFront(null);
      setIdBack(null);
      setIdPdf(null);
      setIdPdfName("");
      setIdSide(mode === "camera" ? "front" : "done");
      setLocalError("");
    }
    async function uploadIdFile(event, kind) {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file || busy) return;
      setLocalError("");
      try {
        const value = await readIdentityFile(file, kind);
        if (!value) return;
        if (kind === "pdf") {
          setIdPdf(value);
          setIdPdfName(file.name);
          setIdFront(null);
          setIdBack(null);
        } else if (kind === "front") {
          setIdPdf(null);
          setIdPdfName("");
          setIdFront(value);
          setIdBack(null);
        } else {
          setIdBack(value);
        }
        setIdSide("done");
      } catch (cause) {
        setLocalError(cause.message || "Unable to read this ID file.");
      }
    }
    function validateIdInputs() {
      if (idPdf) return true;
      if (!idFront) {
        setLocalError(idInputMode === "upload" ? "Upload the front of the ID before continuing." : "Capture the front of the ID before continuing.");
        return false;
      }
      if (requiresBackSide && !idBack) {
        setLocalError(idInputMode === "upload" ? "Upload the back of the ID before continuing." : "Capture the back of the ID before continuing.");
        return false;
      }
      return true;
    }
    async function verifyId(frontImage, backImage, pdfDocument = null) {
      setLocalPending(true);
      setLocalError("");
      try {
        const result2 = await apiRequest("/admin/identity/verify-id", {
          token,
          method: "POST",
          body: JSON.stringify({
            name: details.name,
            email: details.email,
            idType,
            consent,
            ...pdfDocument ? { document: pdfDocument } : { image: frontImage, ...backImage ? { backImage } : {} }
          })
        });
        setIdTicket(result2.ticket);
        setIdFront(null);
        setIdBack(null);
        setIdPdf(null);
        setIdPdfName("");
        setFaceFrames({});
        setFaceMotion({});
        setFaceTurn("right");
        moveTo("face");
      } catch (cause) {
        setLocalError(cause.message || "The ID could not be verified. Retake the image.");
      } finally {
        setLocalPending(false);
      }
    }
    function captureTurn(image, evidence) {
      if (!evidence?.neutral || !evidence?.turned) {
        setLocalError("Look forward and complete the live head turn before capturing.");
        return;
      }
      setFaceMotion((old) => ({ ...old, [faceTurn]: evidence }));
      if (faceTurn === "right") {
        setFaceFrames({ right: image });
        setFaceTurn("left");
      } else {
        setFaceFrames((old) => ({ ...old, left: image }));
        moveTo("closeup");
      }
    }
    async function captureCloseup(image) {
      setLocalPending(true);
      setLocalError("");
      try {
        const result2 = await apiRequest("/admin/identity/verify-face", {
          token,
          method: "POST",
          body: JSON.stringify({ ticket: idTicket, frames: { ...faceFrames, front: image }, motion: faceMotion })
        });
        moveTo("creating");
        await onCreate({ ...details, method, recordPayment: true, enrollmentProof: result2.enrollmentProof });
      } catch (cause) {
        setLocalError(cause.message || "Face verification could not be completed.");
      } finally {
        setLocalPending(false);
      }
    }
    const active = step === "creating" ? "closeup" : step;
    const stepNumber = PROGRESS.findIndex((item) => item.key === active) + 1;
    const subtitle = {
      details: "Member details",
      id: "Scan ID front and back",
      face: "Face check \xB7 head turns",
      closeup: "Face check \xB7 normal view",
      creating: "Confirming member account"
    }[step];
    return /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)(
      Modal,
      {
        title: "Create member account",
        className: "fitpulse-onboarding-dialog fp-verification-dialog",
        busy,
        error: localError || error,
        invalidField: fieldError,
        onClose,
        dismissOnBackdrop: false,
        dismissOnEscape: false,
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("p", { className: "fp-verification-subtitle", children: [
            "Step ",
            stepNumber,
            " of 4 \xB7 ",
            subtitle
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(Progress, { current: active }),
          step === "details" && /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("form", { className: "fp-verification-content", onSubmit: submitDetails, children: [
            /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("h3", { children: "Member details" }),
            /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("div", { className: "fp-verification-form-grid", children: [
              /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("label", { className: "field", children: [
                /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("span", { className: "fp-field-label", children: [
                  "Full name ",
                  /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("span", { className: "fp-required", children: "*" })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("input", { className: "clay-in", name: "name", value: details.name, onChange: (e) => setDetails((d) => ({ ...d, name: e.target.value })), maxLength: 100, required: true, placeholder: "Juan Dela Cruz" })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("label", { className: "field", children: [
                /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("span", { className: "fp-field-label", children: [
                  "Contact number ",
                  /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("span", { className: "fp-optional", children: "(optional)" })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("input", { className: "clay-in", name: "phone", type: "tel", value: details.phone, onChange: (e) => setDetails((d) => ({ ...d, phone: e.target.value })), placeholder: "09XX XXX XXXX" })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("label", { className: "field", children: [
                /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("span", { className: "fp-field-label", children: [
                  "Email ",
                  /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("span", { className: "fp-required", children: "*" })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("input", { className: "clay-in", name: "email", type: "email", value: details.email, onChange: (e) => setDetails((d) => ({ ...d, email: e.target.value })), required: true, placeholder: "juan123@gmail.com" })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("label", { className: "field", children: [
                /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("span", { className: "fp-field-label", children: [
                  "Plan ",
                  /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("span", { className: "fp-required", children: "*" })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("select", { className: "clay-in", name: "plan", value: details.plan, onChange: (e) => setDetails((d) => ({ ...d, plan: e.target.value })), required: true, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("option", { value: "", disabled: true, children: "Select a plan" }),
                  plans2.map((plan) => /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("option", { value: plan.plan_name, children: planOptionLabel2(plan) }, plan.plan_id))
                ] })
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("p", { className: "fp-verification-hint", children: "Student plans require a valid school ID before selection." }),
            /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("h3", { children: "Payment" }),
            /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("div", { className: "fp-payment-switch", role: "group", "aria-label": "Payment method", children: ["Cash", "GCash"].map((value) => /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("button", { type: "button", className: method === value ? "selected" : "", "aria-pressed": method === value, onClick: () => setMethod(value), children: value }, value)) }),
            /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("p", { className: "fp-verification-hint", children: "The selected payment method will be recorded during account creation." }),
            /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("h3", { children: "Identity check" }),
            /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("label", { className: "field", children: [
              /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("span", { className: "fp-field-label", children: [
                "ID type ",
                /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("span", { className: "fp-required", children: "*" })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("select", { className: "clay-in", value: idType, onChange: (e) => setIdType(e.target.value), required: true, children: [
                /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("option", { value: "", disabled: true, children: "Select an ID type" }),
                ID_TYPES.map(([value, label]) => /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("option", { value, children: label }, value))
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("label", { className: "fp-consent-row", children: [
              /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("input", { type: "checkbox", checked: consent, onChange: (e) => setConsent(e.target.checked), required: true }),
              /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("span", { children: "The member agrees to an ID and face check, and to storing a facial template for sign-in." })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("details", { className: "fp-privacy-details", children: [
              /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("summary", { children: "Privacy notice" }),
              "The ID and webcam images are processed for verification and are not saved by the verification worker. A facial template is stored with the member account for sign-in."
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("div", { className: "fp-verification-footer", children: [
              /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("p", { children: "Fill all required fields and accept consent to continue." }),
              /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("button", { className: "btn ghost", type: "button", onClick: onClose, children: "Cancel" }),
              /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("button", { className: "btn", type: "submit", disabled: !consent || !idType || !details.name.trim() || !details.email.trim() || !details.plan, children: "Continue" })
            ] })
          ] }),
          step === "id" && /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("div", { className: "fp-verification-content", children: [
            /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("h3", { children: "Verify the member's ID" }),
            /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("div", { className: "fp-payment-switch fp-id-mode-switch", role: "group", "aria-label": "ID verification source", children: [
              /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("button", { type: "button", className: idInputMode === "camera" ? "selected" : "", "aria-pressed": idInputMode === "camera", disabled: busy, onClick: () => changeIdMode("camera"), children: "Live camera" }),
              /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("button", { type: "button", className: idInputMode === "upload" ? "selected" : "", "aria-pressed": idInputMode === "upload", disabled: busy, onClick: () => changeIdMode("upload"), children: "Upload ID" })
            ] }),
            idInputMode === "upload" && /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("div", { className: "fp-id-pdf-option", children: [
              /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("label", { className: "field", children: [
                /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("span", { className: "fp-field-label", children: "Upload one PDF (front and back pages can be in the same file)" }),
                /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("input", { className: "clay-in fp-id-file", type: "file", accept: ".pdf,application/pdf", disabled: busy, onChange: (event) => uploadIdFile(event, "pdf") })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("p", { className: "fp-verification-hint", children: "One PDF is sufficient. For images, upload the front and back separately. Maximum 4 MB per file." })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("div", { className: "fp-id-side-by-side", "aria-label": "Front and back ID capture status", children: [
              /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("div", { className: `fp-id-side-card ${idInputMode === "camera" && idSide === "front" ? "is-active" : ""}`, children: [
                /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("div", { className: "fp-id-card-heading", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("strong", { children: "Front of ID" }),
                  /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("span", { children: idPdf ? "\u2713 PDF uploaded" : idFront ? "\u2713 Captured" : idSide === "front" && idInputMode === "camera" ? "\u25CF Live" : "Not captured" })
                ] }),
                idPdf ? /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("div", { className: "fp-id-card-empty fp-id-pdf-preview", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("strong", { children: "PDF document" }),
                  /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("span", { title: idPdfName, children: idPdfName })
                ] }) : idFront ? /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("img", { src: idFront, alt: "Front of ID" }) : /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("div", { className: "fp-id-card-empty", children: "Front \xB7 name and portrait" }),
                idInputMode === "upload" && /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("label", { className: "fp-id-upload-label", children: [
                  idFront ? "Replace front image" : "Upload front image",
                  /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("input", { type: "file", accept: "image/jpeg,image/png,image/webp", disabled: busy, onChange: (event) => uploadIdFile(event, "front") })
                ] }),
                idInputMode === "camera" && idFront && /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("button", { type: "button", className: "fp-id-inline-action", disabled: busy, onClick: () => {
                  setIdFront(null);
                  setIdBack(null);
                  setIdSide("front");
                }, children: "Retake front" })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("div", { className: `fp-id-side-card ${idInputMode === "camera" && idSide === "back" ? "is-active" : ""}`, children: [
                /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("div", { className: "fp-id-card-heading", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("strong", { children: idType === "passport" ? "Photo/details page" : "Back of ID" }),
                  /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("span", { children: idPdf ? "Included in PDF" : idType === "passport" ? "Not required" : idBack ? "\u2713 Captured" : idSide === "back" && idInputMode === "camera" ? "\u25CF Live" : "Not captured" })
                ] }),
                idPdf ? /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("div", { className: "fp-id-card-empty", children: "PDF is checked as a single document" }) : idType === "passport" ? /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("div", { className: "fp-id-card-empty", children: "No back scan required" }) : idBack ? /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("img", { src: idBack, alt: "Back of ID" }) : /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("div", { className: "fp-id-card-empty", children: "Back \xB7 reverse side" }),
                idInputMode === "upload" && idType !== "passport" && !idPdf && /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("label", { className: "fp-id-upload-label", children: [
                  idBack ? "Replace back image" : "Upload back image",
                  /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("input", { type: "file", accept: "image/jpeg,image/png,image/webp", disabled: busy, onChange: (event) => uploadIdFile(event, "back") })
                ] }),
                idInputMode === "camera" && idBack && /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("button", { type: "button", className: "fp-id-inline-action", disabled: busy, onClick: () => {
                  setIdBack(null);
                  setIdSide("back");
                }, children: "Retake back" }),
                idInputMode === "camera" && idType !== "passport" && idFront && !idBack && idSide !== "back" && /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("button", { type: "button", className: "fp-id-inline-action", disabled: busy, onClick: () => setIdSide("back"), children: "Scan back of ID" })
              ] })
            ] }),
            idInputMode === "camera" && (idSide === "front" || idSide === "back") && /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(
              IdentityCamera,
              {
                autoCapture: true,
                facingMode: "environment",
                overlay: "id",
                side: idSide,
                disabled: busy,
                guide: { type: "id", token },
                instruction: idSide === "front" ? "Show the FRONT of your ID and hold still; the camera captures it automatically." : "Show the BACK of your ID and hold still for automatic capture.",
                onCapture: idSide === "front" ? captureFront : captureBack
              },
              `id-${idSide}`
            ),
            idInputMode === "camera" && idSide === "done" && /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("p", { className: "fp-verification-hint", role: "status", children: [
              idFront ? "Front captured. " : "",
              requiresBackSide && !idBack ? "Choose Scan back of ID when ready; the camera will not open automatically." : "Both required sides are ready. Select Verify ID and continue."
            ] }),
            idInputMode === "upload" && /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("p", { className: "fp-verification-hint", role: "status", children: "Uploaded IDs undergo the same name, ID-type, and portrait verification. Uploading an ID does not bypass the live face check, and the step will not continue until you select Verify ID and continue." }),
            /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("div", { className: "fp-verification-footer", children: [
              /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("p", { children: idInputMode === "camera" ? "Auto-capture begins when the live quality and hold-still checks pass. Starting the back scan remains manual." : uploadReady ? "Required upload(s) are present. Select Verify ID and continue to validate the document before moving to the next step." : requiresBackSide ? "Upload the front and back images, or upload one PDF, before continuing." : "Upload the ID image, or upload one PDF, before continuing." }),
              /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("button", { className: "btn ghost", type: "button", disabled: busy, onClick: goBack, children: "Back" }),
              /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("button", { className: "btn", type: "button", disabled: busy, onClick: () => {
                if (validateIdInputs()) verifyId(idFront, idBack, idPdf);
              }, children: busy ? "Checking ID\u2026" : "Verify ID and continue" })
            ] })
          ] }),
          step === "face" && /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("div", { className: "fp-verification-content", children: [
            /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("h3", { children: [
              "Face check \xB7 ",
              faceTurn === "right" ? "turn right" : "turn left"
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(
              IdentityCamera,
              {
                autoCapture: true,
                overlay: "face",
                guide: { type: "face", stage: faceTurn, token, ticket: idTicket, oppositeYaw: faceTurn === "left" ? faceMotion.right?.yaw : void 0 },
                disabled: busy,
                instruction: faceTurn === "right" ? "Look forward, then TURN RIGHT and hold still for automatic capture." : "Look forward, then TURN LEFT and hold still for automatic capture.",
                captureLabel: faceTurn === "right" ? "Capture right turn" : "Capture left turn",
                onCapture: captureTurn
              },
              faceTurn
            ),
            /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("div", { className: "fp-verification-checks", children: [
              /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("div", { className: faceFrames.right ? "done" : "current", children: [
                faceFrames.right ? "\u2713" : "\u25CB",
                " Turn right"
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("div", { className: faceFrames.left ? "done" : faceTurn === "left" ? "current" : "", children: [
                faceFrames.left ? "\u2713" : "\u25CB",
                " Turn left"
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("div", { children: "\u25CB Normal-view close-up next" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("div", { className: "fp-verification-footer", children: [
              /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("p", { children: "One person only. Use natural lighting and keep your face visible." }),
              /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("button", { className: "btn ghost", type: "button", disabled: busy, onClick: goBack, children: "Back" }),
              faceTurn === "left" && /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("button", { className: "btn ghost", type: "button", disabled: busy, onClick: () => {
                setFaceFrames({});
                setFaceMotion({});
                setFaceTurn("right");
              }, children: "Restart turns" })
            ] })
          ] }),
          step === "closeup" && /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("div", { className: "fp-verification-content", children: [
            /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("h3", { children: "Face check \xB7 normal view" }),
            /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(
              IdentityCamera,
              {
                autoCapture: true,
                overlay: "face",
                guide: { type: "face", stage: "front", token, ticket: idTicket },
                disabled: busy,
                instruction: "Look straight ahead and fit your face in the oval. The camera automatically captures a clear frontal image and checks it against the ID portrait.",
                captureLabel: busy ? "Verifying\u2026" : "Capture close-up and verify",
                onCapture: captureCloseup
              },
              "face-closeup"
            ),
            /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("div", { className: "fp-verification-checks", children: [
              /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("div", { className: "done", children: "\u2713 Right turn captured" }),
              /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("div", { className: "done", children: "\u2713 Left turn captured" }),
              /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("div", { className: "current", children: "\u25CB Match live face with ID portrait" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("div", { className: "fp-verification-footer", children: [
              /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("p", { children: "The temporary password will be displayed once the member account is created." }),
              /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("button", { type: "button", className: "btn ghost", disabled: busy, onClick: goBack, children: "Back" })
            ] })
          ] }),
          step === "creating" && /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)("div", { className: "fp-verification-content", children: [
            /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("h3", { children: "Confirming account" }),
            /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("p", { role: "status", children: busy ? "Saving member details, payment, and face enrollment\u2026" : "Account creation was not confirmed. Check the Auth account and member profile before retrying." }),
            !busy && /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("button", { className: "btn ghost", type: "button", onClick: goBack, children: "Restart identity verification" })
          ] })
        ]
      }
    );
  }
  var import_react30, import_jsx_runtime39, ID_TYPES, PROGRESS, EMPTY_DETAILS, MAX_UPLOAD_BYTES;
  var init_CreateMemberSheet = __esm({
    "src/components/mobile/CreateMemberSheet.jsx"() {
      init_define_import_meta_env();
      import_react30 = __toESM(require_react(), 1);
      init_AdminDialogParts();
      init_IdentityCamera2();
      init_api();
      init_VerificationFlow();
      import_jsx_runtime39 = __toESM(require_jsx_runtime(), 1);
      ID_TYPES = [
        ["philid", "Philippine National ID (PhilID)"],
        ["ephilid", "ePhilID / Digital National ID"],
        ["drivers_license", "Driver's License"],
        ["passport", "Philippine Passport"],
        ["umid", "UMID"]
      ];
      PROGRESS = [
        { key: "details", label: "Details" },
        { key: "id", label: "ID scan" },
        { key: "face", label: "Face" },
        { key: "closeup", label: "Close-up" }
      ];
      EMPTY_DETAILS = { name: "", email: "", phone: "", plan: "" };
      MAX_UPLOAD_BYTES = 4e6;
    }
  });

  // src/components/admin/AdminStaffDialogs.jsx
  function AdminStaffDialogs({
    modal,
    setModal,
    currentUser,
    pending,
    error,
    fieldError,
    deletion,
    setDeletion,
    load,
    setNotice,
    renewals,
    money: money3,
    date: date4,
    members,
    data,
    planOptionLabel: planOptionLabel2,
    act,
    createMember,
    token,
    updateMember,
    recordPayment
  }) {
    return /* @__PURE__ */ (0, import_jsx_runtime40.jsxs)(import_jsx_runtime40.Fragment, { children: [
      modal?.kind === "delete-account" && currentUser?.role === "admin" && /* @__PURE__ */ (0, import_jsx_runtime40.jsx)(
        AccountDeleteDialog,
        {
          account: modal.member,
          onClose: () => setModal(null),
          onDeleted: async () => {
            setModal(null);
            const refreshed = await load();
            setNotice(
              `Member account deleted. ${refreshed === false ? "Refresh failed. Reload to see the latest records." : "Records refreshed."}`
            );
          }
        }
      ),
      deletion && /* @__PURE__ */ (0, import_jsx_runtime40.jsx)(
        RecordDeleteDialog,
        {
          target: deletion,
          onClose: () => setDeletion(null),
          onChanged: load,
          onNotice: setNotice
        }
      ),
      modal?.kind === "create" && currentUser?.role === "admin" && /* @__PURE__ */ (0, import_jsx_runtime40.jsx)(import_react31.Suspense, { fallback: /* @__PURE__ */ (0, import_jsx_runtime40.jsx)(HeartRateLoader, { message: "Opening member registration" }), children: /* @__PURE__ */ (0, import_jsx_runtime40.jsx)(
        CreateMemberSheet2,
        {
          plans: data.membershipPlans,
          planOptionLabel: planOptionLabel2,
          pending,
          error,
          fieldError,
          onClose: () => setModal(null),
          onCreate: createMember,
          token
        }
      ) }),
      /* @__PURE__ */ (0, import_jsx_runtime40.jsx)(
        AdminMemberDialogs,
        {
          modal,
          setModal,
          pending,
          error,
          renewals,
          money: money3,
          date: date4,
          updateMember,
          data,
          planOptionLabel: planOptionLabel2,
          recordPayment,
          members,
          currentUser,
          act
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime40.jsx)(
        AdminOperationsDialogs,
        {
          modal,
          setModal,
          pending,
          error,
          act
        }
      )
    ] });
  }
  var import_react31, import_jsx_runtime40, CreateMemberSheet2;
  var init_AdminStaffDialogs = __esm({
    "src/components/admin/AdminStaffDialogs.jsx"() {
      init_define_import_meta_env();
      import_react31 = __toESM(require_react(), 1);
      init_RecordDeleteControls();
      init_AccountDeleteDialog();
      init_HeartRateLoader2();
      init_AdminMemberDialogs();
      init_AdminOperationsDialogs();
      init_AdminStatus();
      import_jsx_runtime40 = __toESM(require_jsx_runtime(), 1);
      CreateMemberSheet2 = (0, import_react31.lazy)(() => Promise.resolve().then(() => (init_CreateMemberSheet(), CreateMemberSheet_exports)));
    }
  });

  // src/components/admin/AdminMembersSection.jsx
  function AdminMembersSection({ query: query2, setQuery, currentUser, setModal, members, pending, date: date4 }) {
    return /* @__PURE__ */ (0, import_jsx_runtime41.jsxs)("article", { className: "card clay", children: [
      /* @__PURE__ */ (0, import_jsx_runtime41.jsx)("h2", { children: "Member Records" }),
      /* @__PURE__ */ (0, import_jsx_runtime41.jsxs)("div", { className: "bar", children: [
        /* @__PURE__ */ (0, import_jsx_runtime41.jsxs)("label", { className: "sbox clay-in", children: [
          "Search",
          " ",
          /* @__PURE__ */ (0, import_jsx_runtime41.jsx)(
            "input",
            {
              value: query2,
              placeholder: "Name, member ID, email, or phone",
              onChange: (event) => setQuery(event.target.value)
            }
          )
        ] }),
        currentUser?.role === "admin" && /* @__PURE__ */ (0, import_jsx_runtime41.jsx)("button", { className: "btn", onClick: () => setModal({ kind: "create" }), children: "Create Account" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime41.jsx)(
        DataTable,
        {
          searchable: false,
          headings: ["ID", "Name", "Contact", "Plan", "Expires", "Status", "Actions"],
          children: filterMemberRecords(members, query2).map((member2) => {
            const membershipStatus = memberBadge(member2);
            const showAccountStatus = member2.status && member2.status !== "active" && member2.status !== membershipStatus.toLowerCase();
            return /* @__PURE__ */ (0, import_jsx_runtime41.jsxs)("tr", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime41.jsx)("td", { className: "record-id", children: member2.memberCode || member2.id }),
              /* @__PURE__ */ (0, import_jsx_runtime41.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime41.jsxs)("div", { className: "member-table-person", children: [
                /* @__PURE__ */ (0, import_jsx_runtime41.jsx)(ProfileAvatar, { user: member2, memberId: member2.id }),
                /* @__PURE__ */ (0, import_jsx_runtime41.jsx)("span", { children: member2.name })
              ] }) }),
              /* @__PURE__ */ (0, import_jsx_runtime41.jsxs)("td", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime41.jsx)("span", { children: member2.email }),
                /* @__PURE__ */ (0, import_jsx_runtime41.jsx)("small", { className: "table-secondary", children: member2.phone || "No phone added" })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime41.jsx)("td", { children: member2.plan }),
              /* @__PURE__ */ (0, import_jsx_runtime41.jsx)("td", { children: date4(member2.membershipEnd) }),
              /* @__PURE__ */ (0, import_jsx_runtime41.jsxs)("td", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime41.jsx)(Pill, { status: membershipStatus }),
                showAccountStatus && /* @__PURE__ */ (0, import_jsx_runtime41.jsxs)("small", { className: "table-secondary", children: [
                  "Account ",
                  member2.status
                ] })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime41.jsxs)("td", { className: "acts member-record-actions", children: [
                /* @__PURE__ */ (0, import_jsx_runtime41.jsx)(
                  "button",
                  {
                    className: "report-icon-button",
                    type: "button",
                    "aria-label": `View ${member2.name}`,
                    onClick: () => setModal({ kind: "view", member: member2 }),
                    children: /* @__PURE__ */ (0, import_jsx_runtime41.jsx)(Icon2, { name: "eye", size: 18 })
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime41.jsx)(
                  "button",
                  {
                    className: "report-icon-button",
                    type: "button",
                    "aria-label": `Edit ${member2.name}`,
                    onClick: () => setModal({ kind: "edit", member: member2 }),
                    children: /* @__PURE__ */ (0, import_jsx_runtime41.jsx)(Icon2, { name: "edit", size: 18 })
                  }
                ),
                currentUser?.role === "admin" && /* @__PURE__ */ (0, import_jsx_runtime41.jsx)(
                  RecordDeleteButton,
                  {
                    label: `Delete account for ${member2.name}`,
                    disabled: pending,
                    onClick: () => setModal({ kind: "delete-account", member: member2 })
                  }
                )
              ] })
            ] }, member2.id);
          })
        }
      )
    ] });
  }
  var import_jsx_runtime41;
  var init_AdminMembersSection = __esm({
    "src/components/admin/AdminMembersSection.jsx"() {
      init_define_import_meta_env();
      init_DataTable();
      init_ProfileAvatar();
      init_RecordDeleteControls();
      init_DashboardShell2();
      init_AdminStaffDialogs();
      init_membership();
      import_jsx_runtime41 = __toESM(require_jsx_runtime(), 1);
    }
  });

  // src/components/admin/AdminEquipmentSection.jsx
  function AdminEquipmentSection({ data, loading, pending, act, setModal, canDeleteHistory, setDeletion, date: date4 }) {
    return /* @__PURE__ */ (0, import_jsx_runtime42.jsxs)(import_jsx_runtime42.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime42.jsxs)("article", { className: "card clay", children: [
        /* @__PURE__ */ (0, import_jsx_runtime42.jsxs)("div", { className: "record-section-heading", children: [
          /* @__PURE__ */ (0, import_jsx_runtime42.jsx)("h2", { children: "Equipment Monitoring" }),
          /* @__PURE__ */ (0, import_jsx_runtime42.jsx)("button", { className: "btn", onClick: () => setModal({ kind: "equipment" }), children: "Add Equipment" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime42.jsx)(DataTable, { headings: ["Name", "Category", "Condition", "Last inspection", "Actions"], children: data.equipment.map((item) => /* @__PURE__ */ (0, import_jsx_runtime42.jsxs)("tr", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime42.jsx)("td", { children: item.name }),
          /* @__PURE__ */ (0, import_jsx_runtime42.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime42.jsx)(
            EquipmentCategorySelect,
            {
              value: item.category || "",
              "aria-label": `Category for ${item.name}`,
              disabled: loading || pending,
              onChange: (event) => act(
                `/admin/equipment/${item.id}`,
                {
                  method: "PATCH",
                  body: JSON.stringify({ category: event.target.value })
                },
                "Category updated."
              )
            }
          ) }),
          /* @__PURE__ */ (0, import_jsx_runtime42.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime42.jsxs)(
            "select",
            {
              className: "clay-in",
              value: item.condition,
              onChange: (event) => act(
                `/admin/equipment/${item.id}`,
                {
                  method: "PATCH",
                  body: JSON.stringify({ condition: event.target.value })
                },
                "Condition updated."
              ),
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime42.jsx)("option", { children: "Good" }),
                /* @__PURE__ */ (0, import_jsx_runtime42.jsx)("option", { children: "Needs Maintenance" }),
                /* @__PURE__ */ (0, import_jsx_runtime42.jsx)("option", { children: "Out of Service" })
              ]
            }
          ) }),
          /* @__PURE__ */ (0, import_jsx_runtime42.jsxs)("td", { children: [
            date4(item.lastInspected),
            inspectionDue(item) && /* @__PURE__ */ (0, import_jsx_runtime42.jsx)("small", { className: "table-secondary", children: "Inspection due" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime42.jsxs)("td", { className: "acts", children: [
            /* @__PURE__ */ (0, import_jsx_runtime42.jsx)(
              "button",
              {
                className: "btn sm",
                type: "button",
                disabled: loading || pending,
                onClick: () => act(
                  `/admin/equipment/${item.id}`,
                  { method: "PATCH", body: JSON.stringify({ inspected: true }) },
                  "Inspection logged."
                ),
                children: "Inspected"
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime42.jsx)(
              "button",
              {
                className: "btn sm ghost",
                type: "button",
                disabled: loading || pending,
                onClick: () => setModal({ kind: "maintenance", item }),
                children: "Log repair"
              }
            ),
            canDeleteHistory && /* @__PURE__ */ (0, import_jsx_runtime42.jsx)(
              RecordDeleteButton,
              {
                label: `Delete equipment ${item.name}`,
                disabled: loading || pending,
                onClick: () => setDeletion({ category: "equipment", id: item.id, label: item.name })
              }
            )
          ] })
        ] }, item.id)) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime42.jsxs)("article", { className: "card clay maintenance-log", children: [
        /* @__PURE__ */ (0, import_jsx_runtime42.jsxs)("div", { className: "record-section-heading", children: [
          /* @__PURE__ */ (0, import_jsx_runtime42.jsx)("h2", { children: "Maintenance & Repair Log" }),
          canDeleteHistory && /* @__PURE__ */ (0, import_jsx_runtime42.jsx)(
            RecordDeleteButton,
            {
              all: true,
              label: "Clear all maintenance records",
              disabled: loading || pending || !data.maintenance.length,
              onClick: () => setDeletion({
                all: true,
                category: "maintenance",
                count: data.maintenance.length
              })
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime42.jsx)(
          DataTable,
          {
            headings: ["Equipment", "Note", "Date", ...canDeleteHistory ? ["Actions"] : []],
            children: data.maintenance.map((item) => /* @__PURE__ */ (0, import_jsx_runtime42.jsxs)("tr", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime42.jsx)("td", { children: item.item }),
              /* @__PURE__ */ (0, import_jsx_runtime42.jsx)("td", { children: item.note }),
              /* @__PURE__ */ (0, import_jsx_runtime42.jsx)("td", { children: date4(item.date) }),
              canDeleteHistory && /* @__PURE__ */ (0, import_jsx_runtime42.jsx)("td", { className: "acts", children: /* @__PURE__ */ (0, import_jsx_runtime42.jsx)(
                RecordDeleteButton,
                {
                  label: `Delete maintenance record for ${item.item}`,
                  disabled: loading || pending,
                  onClick: () => setDeletion({ category: "maintenance", id: item.id, label: item.item })
                }
              ) })
            ] }, item.id))
          }
        )
      ] })
    ] });
  }
  var import_jsx_runtime42;
  var init_AdminEquipmentSection = __esm({
    "src/components/admin/AdminEquipmentSection.jsx"() {
      init_define_import_meta_env();
      init_DataTable();
      init_RecordDeleteControls();
      init_EquipmentCategorySelect();
      init_membership();
      import_jsx_runtime42 = __toESM(require_jsx_runtime(), 1);
    }
  });

  // src/components/WebcamQrScanner.jsx
  function WebcamQrScanner({ onScan }) {
    const videoRef = (0, import_react32.useRef)(null);
    const [scanning, setScanning] = (0, import_react32.useState)(false);
    const [error, setError] = (0, import_react32.useState)("");
    (0, import_react32.useEffect)(() => {
      if (!scanning) return void 0;
      let stopped = false;
      let stream;
      let timer;
      const stop = () => {
        stopped = true;
        clearTimeout(timer);
        stream?.getTracks().forEach((track) => track.stop());
      };
      const fail = (cause) => {
        if (stopped) return;
        stop();
        setError(cause.name === "NotAllowedError" ? "Allow camera access, then try again." : cause.message);
        setScanning(false);
      };
      const start = async () => {
        if (!navigator.mediaDevices?.getUserMedia)
          throw new Error("Camera access requires HTTPS or localhost.");
        const Detector = globalThis.BarcodeDetector;
        if (!Detector || !(await Detector.getSupportedFormats()).includes("qr_code"))
          throw new Error("This browser cannot decode QR codes with a webcam. Use the entrance scanner or a browser with QR camera support.");
        if (stopped) return;
        const detector = new Detector({ formats: ["qr_code"] });
        const camera = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: "environment" } }
        });
        if (stopped) {
          camera.getTracks().forEach((track) => track.stop());
          return;
        }
        stream = camera;
        const video = videoRef.current;
        video.srcObject = stream;
        await video.play();
        const scan = async () => {
          if (stopped) return;
          const codes = video.readyState >= 2 ? await detector.detect(video) : [];
          if (stopped) return;
          if (codes.length === 1 && codes[0].rawValue) {
            stop();
            setScanning(false);
            onScan(codes[0].rawValue);
            return;
          }
          timer = setTimeout(() => void scan().catch(fail), 180);
        };
        await scan();
      };
      void start().catch(fail);
      return stop;
    }, [scanning, onScan]);
    return /* @__PURE__ */ (0, import_jsx_runtime43.jsxs)("section", { className: "webcam-qr", "aria-label": "Webcam QR scanner", children: [
      /* @__PURE__ */ (0, import_jsx_runtime43.jsx)(
        "button",
        {
          className: "btn ghost",
          type: "button",
          onClick: () => {
            setError("");
            setScanning(!scanning);
          },
          children: scanning ? "Stop camera" : "Scan QR with webcam"
        }
      ),
      scanning && /* @__PURE__ */ (0, import_jsx_runtime43.jsxs)(import_jsx_runtime43.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime43.jsx)("video", { ref: videoRef, muted: true, playsInline: true, "aria-label": "QR camera preview" }),
        /* @__PURE__ */ (0, import_jsx_runtime43.jsx)("p", { role: "status", children: "Show one member QR code to the camera." })
      ] }),
      error && /* @__PURE__ */ (0, import_jsx_runtime43.jsx)("p", { className: "form-error", role: "alert", children: error })
    ] });
  }
  var import_react32, import_jsx_runtime43;
  var init_WebcamQrScanner = __esm({
    "src/components/WebcamQrScanner.jsx"() {
      init_define_import_meta_env();
      import_react32 = __toESM(require_react(), 1);
      import_jsx_runtime43 = __toESM(require_jsx_runtime(), 1);
    }
  });

  // src/components/PhysicalQrScanner.jsx
  function isFitPulseToken(value) {
    return /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(value);
  }
  function PhysicalQrScanner({ onScan }) {
    const bufferRef = (0, import_react33.useRef)("");
    const timerRef = (0, import_react33.useRef)(null);
    const lastKeyTimeRef = (0, import_react33.useRef)(0);
    const processingRef = (0, import_react33.useRef)(false);
    const onScanRef = (0, import_react33.useRef)(onScan);
    const [feedback, setFeedback] = (0, import_react33.useState)({
      status: "ready",
      message: "Scan a FitPulse membership QR code."
    });
    (0, import_react33.useEffect)(() => {
      onScanRef.current = onScan;
    }, [onScan]);
    const processScan = (0, import_react33.useCallback)(async (rawToken) => {
      if (processingRef.current) return;
      const qrToken = rawToken.trim();
      if (qrToken.length < MIN_TOKEN_LENGTH) return;
      if (!isFitPulseToken(qrToken)) {
        setFeedback({
          status: "error",
          message: "Invalid QR code. Please scan a FitPulse membership QR."
        });
        return;
      }
      processingRef.current = true;
      setFeedback({
        status: "processing",
        message: "Verifying member and recording attendance..."
      });
      try {
        const result2 = await onScanRef.current(qrToken);
        if (result2?.allowed !== true) {
          throw new Error(
            result2?.message || "Attendance was not confirmed by the server."
          );
        }
        const message2 = result2.code === "ALREADY_RECORDED" ? "This QR check-in was already recorded." : `Attendance recorded successfully${result2.memberName ? ` for ${result2.memberName}` : ""}.`;
        setFeedback({
          status: "success",
          message: message2
        });
      } catch (error) {
        setFeedback({
          status: "error",
          message: error?.message || "Unable to process attendance. Please try again."
        });
      } finally {
        processingRef.current = false;
      }
    }, []);
    (0, import_react33.useEffect)(() => {
      function finishScan() {
        clearTimeout(timerRef.current);
        const token = bufferRef.current;
        bufferRef.current = "";
        lastKeyTimeRef.current = 0;
        if (token.length >= MIN_TOKEN_LENGTH) {
          void processScan(token);
        }
      }
      function handleKeyDown(event) {
        if (processingRef.current) return;
        if (event.ctrlKey || event.altKey || event.metaKey) return;
        const target = event.target;
        if (target instanceof Element && target.closest(
          'input, textarea, select, [contenteditable="true"], [role="textbox"]'
        )) {
          return;
        }
        if (event.key === "Enter" || event.key === "Tab") {
          if (bufferRef.current.length >= MIN_TOKEN_LENGTH) {
            event.preventDefault();
            finishScan();
          }
          return;
        }
        if (event.key.length !== 1 || !/^[A-Za-z0-9._-]$/.test(event.key)) {
          return;
        }
        const now = Date.now();
        if (now - lastKeyTimeRef.current > RESET_GAP_MS) {
          bufferRef.current = "";
        }
        lastKeyTimeRef.current = now;
        bufferRef.current += event.key;
        if (bufferRef.current.length > MAX_TOKEN_LENGTH) {
          bufferRef.current = "";
          clearTimeout(timerRef.current);
          setFeedback({
            status: "error",
            message: "QR code is too long. Please scan again."
          });
          return;
        }
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(
          finishScan,
          SCAN_PAUSE_MS
        );
      }
      window.addEventListener("keydown", handleKeyDown, true);
      return () => {
        window.removeEventListener(
          "keydown",
          handleKeyDown,
          true
        );
        clearTimeout(timerRef.current);
      };
    }, [processScan]);
    const { status, message } = feedback;
    return /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)(
      "section",
      {
        className: "physical-qr-scanner",
        "aria-label": "Physical QR scanner",
        style: {
          border: "1px solid rgba(148, 163, 184, 0.3)",
          borderRadius: 12,
          padding: 20,
          marginBottom: 16
        },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("p", { children: "Keep this Attendance page active and place a member's FitPulse QR code in front of the scanner." }),
          /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)(
            "div",
            {
              role: "status",
              "aria-live": "polite",
              style: {
                padding: "14px 16px",
                borderRadius: 10,
                background: status === "success" ? "rgba(22, 163, 74, 0.12)" : status === "error" ? "rgba(220, 38, 38, 0.12)" : "rgba(148, 163, 184, 0.12)",
                border: status === "success" ? "1px solid #22c55e" : status === "error" ? "1px solid #ef4444" : "1px solid rgba(148, 163, 184, 0.3)"
              },
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime44.jsxs)("strong", { children: [
                  status === "ready" && "Scanner Ready",
                  status === "processing" && "Processing Scan...",
                  status === "success" && "Scan Successful",
                  status === "error" && "Scan Failed"
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("p", { style: { margin: "8px 0 0" }, children: message })
              ]
            }
          )
        ]
      }
    );
  }
  var import_react33, import_jsx_runtime44, SCAN_PAUSE_MS, RESET_GAP_MS, MIN_TOKEN_LENGTH, MAX_TOKEN_LENGTH;
  var init_PhysicalQrScanner = __esm({
    "src/components/PhysicalQrScanner.jsx"() {
      init_define_import_meta_env();
      import_react33 = __toESM(require_react(), 1);
      import_jsx_runtime44 = __toESM(require_jsx_runtime(), 1);
      SCAN_PAUSE_MS = 650;
      RESET_GAP_MS = 1200;
      MIN_TOKEN_LENGTH = 40;
      MAX_TOKEN_LENGTH = 2048;
    }
  });

  // src/components/admin/AdminAttendanceSection.jsx
  function AdminAttendanceSection({ data, members, loading, pending, canDeleteHistory, setDeletion, scanQr, section, dateTime }) {
    return /* @__PURE__ */ (0, import_jsx_runtime45.jsxs)("article", { className: "card clay", children: [
      /* @__PURE__ */ (0, import_jsx_runtime45.jsxs)("div", { className: "record-section-heading", children: [
        /* @__PURE__ */ (0, import_jsx_runtime45.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime45.jsx)("h2", { children: "Entrance check-ins" }) }),
        canDeleteHistory && /* @__PURE__ */ (0, import_jsx_runtime45.jsx)(
          RecordDeleteButton,
          {
            all: true,
            label: "Clear all attendance records",
            disabled: loading || pending || !data.attendance.length,
            onClick: () => setDeletion({ all: true, category: "attendance", count: data.attendance.length })
          }
        )
      ] }),
      section === "Attendance" && /* @__PURE__ */ (0, import_jsx_runtime45.jsxs)(import_jsx_runtime45.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime45.jsx)(PhysicalQrScanner, { onScan: scanQr }),
        /* @__PURE__ */ (0, import_jsx_runtime45.jsx)(WebcamQrScanner, { onScan: scanQr })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime45.jsx)(
        DataTable,
        {
          headings: [
            "Member",
            "Date & Time",
            "Recorded by",
            ...canDeleteHistory ? ["Actions"] : []
          ],
          children: data.attendance.map((item) => /* @__PURE__ */ (0, import_jsx_runtime45.jsxs)("tr", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime45.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime45.jsxs)("div", { className: "member-table-person", children: [
              /* @__PURE__ */ (0, import_jsx_runtime45.jsx)(
                ProfileAvatar,
                {
                  user: members.find((member2) => member2.id === item.memberId),
                  memberId: item.memberId
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime45.jsx)("span", { children: item.memberName })
            ] }) }),
            /* @__PURE__ */ (0, import_jsx_runtime45.jsx)("td", { children: dateTime(item.date) }),
            /* @__PURE__ */ (0, import_jsx_runtime45.jsx)("td", { children: item.source || "Staff" }),
            canDeleteHistory && /* @__PURE__ */ (0, import_jsx_runtime45.jsx)("td", { className: "acts", children: /* @__PURE__ */ (0, import_jsx_runtime45.jsx)(
              RecordDeleteButton,
              {
                label: `Delete attendance record for ${item.memberName}`,
                disabled: loading || pending,
                onClick: () => setDeletion({ category: "attendance", id: item.id, label: item.memberName })
              }
            ) })
          ] }, item.id))
        }
      )
    ] });
  }
  var import_jsx_runtime45;
  var init_AdminAttendanceSection = __esm({
    "src/components/admin/AdminAttendanceSection.jsx"() {
      init_define_import_meta_env();
      init_DataTable();
      init_ProfileAvatar();
      init_RecordDeleteControls();
      init_WebcamQrScanner();
      init_PhysicalQrScanner();
      import_jsx_runtime45 = __toESM(require_jsx_runtime(), 1);
    }
  });

  // src/utils/paymentExport.js
  function csvCell(value) {
    let text = String(value ?? "");
    if (/^[\s\u0000-\u001f]*[=+@-]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  }
  function paymentsCsv(payments2, { includeMember = false } = {}) {
    const headings = [
      ...includeMember ? ["Member", "Member ID"] : [],
      "Payment ID",
      "Type",
      "Plan",
      "Amount (PHP)",
      "Method",
      "Date (Asia/Manila)"
    ];
    const rows = payments2.map((payment) => [
      ...includeMember ? [payment.memberName, payment.memberId] : [],
      payment.id,
      payment.type || "Membership",
      payment.plan,
      Number(payment.amount || 0).toFixed(2),
      payment.method,
      formatDateTime(payment.date, "", { hour12: false })
    ]);
    return "\uFEFF" + [headings, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
  }
  function downloadPayments(payments2, options = {}) {
    downloadCsv("fitpulse-payments", paymentsCsv(payments2, options));
  }
  function downloadCsvRows(name, headings, rows) {
    const csv = "\uFEFF" + [headings, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
    downloadCsv(name, csv);
  }
  function downloadCsv(name, csv) {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${name}-${manilaDateKey(/* @__PURE__ */ new Date())}.csv`;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1e3);
  }
  var init_paymentExport = __esm({
    "src/utils/paymentExport.js"() {
      init_define_import_meta_env();
      init_formatDate();
    }
  });

  // src/components/admin/AdminPaymentsSection.jsx
  function AdminPaymentsSection({ data, loading, pending, canDeleteHistory, setModal, setDeletion, money: money3, date: date4 }) {
    return /* @__PURE__ */ (0, import_jsx_runtime46.jsxs)("article", { className: "card clay", children: [
      /* @__PURE__ */ (0, import_jsx_runtime46.jsxs)("div", { className: "record-section-heading", children: [
        /* @__PURE__ */ (0, import_jsx_runtime46.jsx)("h2", { children: "Payment History" }),
        /* @__PURE__ */ (0, import_jsx_runtime46.jsxs)("div", { className: "record-section-actions", children: [
          /* @__PURE__ */ (0, import_jsx_runtime46.jsx)(
            "button",
            {
              className: "btn ghost",
              type: "button",
              disabled: !data.payments.length,
              onClick: () => downloadPayments(data.payments, { includeMember: true }),
              children: "Export CSV"
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime46.jsx)("button", { className: "btn", onClick: () => setModal({ kind: "payment" }), children: "Record Payment" }),
          canDeleteHistory && /* @__PURE__ */ (0, import_jsx_runtime46.jsx)(
            RecordDeleteButton,
            {
              all: true,
              label: "Clear all payment records",
              disabled: loading || pending || !data.payments.length,
              onClick: () => setDeletion({ all: true, category: "payments", count: data.payments.length })
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime46.jsx)(
        DataTable,
        {
          headings: [
            "Member",
            "Plan",
            "Payment",
            "Amount",
            "Method",
            "Date",
            ...canDeleteHistory ? ["Actions"] : []
          ],
          children: data.payments.map((item) => /* @__PURE__ */ (0, import_jsx_runtime46.jsxs)("tr", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime46.jsx)("td", { children: item.memberName }),
            /* @__PURE__ */ (0, import_jsx_runtime46.jsx)("td", { children: item.plan || "Not recorded" }),
            /* @__PURE__ */ (0, import_jsx_runtime46.jsx)("td", { children: item.type || "Membership" }),
            /* @__PURE__ */ (0, import_jsx_runtime46.jsx)("td", { children: money3(item.amount) }),
            /* @__PURE__ */ (0, import_jsx_runtime46.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime46.jsx)(Pill, { status: item.method }) }),
            /* @__PURE__ */ (0, import_jsx_runtime46.jsx)("td", { children: date4(item.date) }),
            canDeleteHistory && /* @__PURE__ */ (0, import_jsx_runtime46.jsx)("td", { className: "acts", children: /* @__PURE__ */ (0, import_jsx_runtime46.jsx)(
              RecordDeleteButton,
              {
                label: `Delete payment record for ${item.memberName}`,
                disabled: loading || pending,
                onClick: () => setDeletion({ category: "payments", id: item.id, label: item.memberName })
              }
            ) })
          ] }, item.id))
        }
      )
    ] });
  }
  var import_jsx_runtime46;
  var init_AdminPaymentsSection = __esm({
    "src/components/admin/AdminPaymentsSection.jsx"() {
      init_define_import_meta_env();
      init_DataTable();
      init_RecordDeleteControls();
      init_paymentExport();
      init_AdminStaffDialogs();
      import_jsx_runtime46 = __toESM(require_jsx_runtime(), 1);
    }
  });

  // src/components/ProfilePhoto.jsx
  async function preparePhoto(file) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024)
      throw new Error("Choose a JPG, PNG, or WebP image smaller than 5 MB.");
    const bitmap = await createImageBitmap(file);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 256;
      const context = canvas.getContext("2d");
      context.fillStyle = "#f5f8fd";
      context.fillRect(0, 0, 256, 256);
      const size = Math.min(bitmap.width, bitmap.height);
      context.drawImage(
        bitmap,
        (bitmap.width - size) / 2,
        (bitmap.height - size) / 2,
        size,
        size,
        0,
        0,
        256,
        256
      );
      return await new Promise(
        (resolve, reject) => canvas.toBlob(
          (blob) => blob ? resolve(blob) : reject(new Error("Could not prepare the photo.")),
          "image/jpeg",
          0.85
        )
      );
    } finally {
      bitmap.close();
    }
  }
  function ProfilePhoto({ user: user2, onSaved }) {
    const { token } = useAuth();
    const [pending, setPending] = (0, import_react34.useState)(false);
    const [message, setMessage] = (0, import_react34.useState)("");
    const [error, setError] = (0, import_react34.useState)("");
    const upload = async (event) => {
      const input = event.currentTarget;
      const file = input.files?.[0];
      if (!file || pending) return;
      setPending(true);
      setMessage("");
      setError("");
      try {
        const body = await preparePhoto(file);
        const result2 = await apiRequest("/profile/avatar", {
          token,
          method: "PUT",
          body,
          headers: { "Content-Type": "image/jpeg" }
        });
        onSaved({ ...user2, avatarId: result2.avatarId });
        setMessage("Profile photo saved.");
      } catch (cause) {
        setError(cause.message || "Could not upload the photo.");
      } finally {
        setPending(false);
        input.value = "";
      }
    };
    return /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("div", { className: "profile-photo", children: [
      /* @__PURE__ */ (0, import_jsx_runtime47.jsx)(ProfileAvatar, { user: user2, large: true }),
      /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("label", { className: "photo-picker", children: [
          pending ? "Uploading..." : "Change profile photo",
          /* @__PURE__ */ (0, import_jsx_runtime47.jsx)(
            "input",
            {
              type: "file",
              accept: "image/jpeg,image/png,image/webp",
              disabled: pending,
              onChange: upload
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("p", { children: "JPG, PNG, or WebP \xB7 up to 5 MB" }),
        message && /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("p", { role: "status", children: message }),
        error && /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("p", { className: "photo-error", role: "alert", children: error })
      ] })
    ] });
  }
  var import_react34, import_jsx_runtime47;
  var init_ProfilePhoto = __esm({
    "src/components/ProfilePhoto.jsx"() {
      init_define_import_meta_env();
      import_react34 = __toESM(require_react(), 1);
      init_AuthContext();
      init_api();
      init_ProfileAvatar();
      import_jsx_runtime47 = __toESM(require_jsx_runtime(), 1);
    }
  });

  // src/components/PrivacyPolicy.jsx
  function PrivacyPolicy() {
    const [open, setOpen] = (0, import_react35.useState)(false);
    return /* @__PURE__ */ (0, import_jsx_runtime48.jsxs)("article", { className: "card clay", children: [
      /* @__PURE__ */ (0, import_jsx_runtime48.jsx)("h2", { children: "Privacy Policy" }),
      /* @__PURE__ */ (0, import_jsx_runtime48.jsx)("button", { className: "btn ghost", type: "button", onClick: () => setOpen(true), children: "Read privacy policy" }),
      open && /* @__PURE__ */ (0, import_jsx_runtime48.jsx)(
        Dialog,
        {
          title: "Privacy Policy",
          className: "privacy-policy-dialog",
          onClose: () => setOpen(false),
          focusClose: true,
          children: /* @__PURE__ */ (0, import_jsx_runtime48.jsxs)("div", { className: "privacy-policy-copy", role: "region", "aria-label": "Privacy policy text", tabIndex: 0, children: [
            /* @__PURE__ */ (0, import_jsx_runtime48.jsx)("h3", { children: "Data we collect" }),
            /* @__PURE__ */ (0, import_jsx_runtime48.jsx)("p", { children: "FitPulse records your name, email address, contact number, and profile photo if you provide one. For members, it also records membership details, gym visits and QR check-ins, and payment amounts, dates, and methods." }),
            /* @__PURE__ */ (0, import_jsx_runtime48.jsx)("h3", { children: "How we use it" }),
            /* @__PURE__ */ (0, import_jsx_runtime48.jsx)("p", { children: "We use this information to manage accounts and memberships, verify gym access, record payments, and send account and membership notices." }),
            /* @__PURE__ */ (0, import_jsx_runtime48.jsx)("h3", { children: "Member identity and face checks" }),
            /* @__PURE__ */ (0, import_jsx_runtime48.jsx)("p", { children: "FitPulse processes ID and camera images to verify a member\u2019s identity. The verification service does not keep those images. FitPulse stores a facial template, a set of numbers derived from the member\u2019s face, to verify future sign-ins." }),
            /* @__PURE__ */ (0, import_jsx_runtime48.jsx)("h3", { children: "Storage and access" }),
            /* @__PURE__ */ (0, import_jsx_runtime48.jsx)("p", { children: "Account and gym records are stored in Supabase. Supabase Auth hashes passwords. FitPulse limits access based on account permissions. Members can access their own records, and authorized gym administrators can access records they need to manage the gym." }),
            /* @__PURE__ */ (0, import_jsx_runtime48.jsx)("h3", { children: "Questions and requests" }),
            /* @__PURE__ */ (0, import_jsx_runtime48.jsx)("p", { children: "Contact the gym front desk or your FitPulse administrator for privacy questions or to request access to, correction of, or deletion of your personal information." })
          ] })
        }
      )
    ] });
  }
  var import_react35, import_jsx_runtime48;
  var init_PrivacyPolicy = __esm({
    "src/components/PrivacyPolicy.jsx"() {
      init_define_import_meta_env();
      import_react35 = __toESM(require_react(), 1);
      init_Dialog();
      import_jsx_runtime48 = __toESM(require_jsx_runtime(), 1);
    }
  });

  // src/components/admin/AdminSettingsSection.jsx
  function AdminSettingsSection({ currentUser, setCurrentUser, profile, pending, loading, settings, data }) {
    const mobile = (0, import_react36.useContext)(DashboardSheetContext);
    return /* @__PURE__ */ (0, import_jsx_runtime49.jsxs)("section", { className: "grid g2", children: [
      /* @__PURE__ */ (0, import_jsx_runtime49.jsxs)("article", { className: "card clay", children: [
        /* @__PURE__ */ (0, import_jsx_runtime49.jsx)("h2", { children: "Profile" }),
        /* @__PURE__ */ (0, import_jsx_runtime49.jsx)(ProfilePhoto, { user: currentUser, onSaved: setCurrentUser }),
        /* @__PURE__ */ (0, import_jsx_runtime49.jsxs)("form", { onSubmit: profile, className: "mf", children: [
          /* @__PURE__ */ (0, import_jsx_runtime49.jsxs)("label", { className: "field", children: [
            "Full name",
            /* @__PURE__ */ (0, import_jsx_runtime49.jsx)(
              "input",
              {
                className: "clay-in",
                name: "name",
                defaultValue: currentUser?.name,
                autoComplete: "name",
                required: true
              }
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime49.jsxs)("label", { className: "field", children: [
            "Email",
            /* @__PURE__ */ (0, import_jsx_runtime49.jsx)(
              "input",
              {
                className: "clay-in",
                name: "email",
                defaultValue: currentUser?.email,
                type: "email",
                autoComplete: "email",
                required: true
              }
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime49.jsx)("button", { className: "btn", disabled: pending || loading, children: pending ? "Saving..." : "Save profile" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime49.jsxs)("article", { className: "card clay", children: [
        /* @__PURE__ */ (0, import_jsx_runtime49.jsx)("h2", { children: "Change Password" }),
        /* @__PURE__ */ (0, import_jsx_runtime49.jsx)(PasswordChangeForm, {})
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime49.jsx)(RockyPreference, {}),
      /* @__PURE__ */ (0, import_jsx_runtime49.jsx)(PrivacyPolicy, {}),
      /* @__PURE__ */ (0, import_jsx_runtime49.jsxs)("article", { className: "card clay", children: [
        /* @__PURE__ */ (0, import_jsx_runtime49.jsx)("h2", { children: "Gym Preferences" }),
        /* @__PURE__ */ (0, import_jsx_runtime49.jsxs)("form", { onSubmit: settings, className: "mf", children: [
          /* @__PURE__ */ (0, import_jsx_runtime49.jsxs)("label", { className: "field", children: [
            "Gym name",
            /* @__PURE__ */ (0, import_jsx_runtime49.jsx)("input", { className: "clay-in", name: "gym", defaultValue: data.settings.gym })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime49.jsxs)("label", { className: "field", children: [
            "Expiry reminder",
            /* @__PURE__ */ (0, import_jsx_runtime49.jsxs)("select", { className: "clay-in", name: "remind", defaultValue: data.settings.remind, children: [
              /* @__PURE__ */ (0, import_jsx_runtime49.jsx)("option", { value: "3", children: "3 days" }),
              /* @__PURE__ */ (0, import_jsx_runtime49.jsx)("option", { value: "5", children: "5 days" }),
              /* @__PURE__ */ (0, import_jsx_runtime49.jsx)("option", { value: "7", children: "7 days" })
            ] })
          ] }),
          mobile && /* @__PURE__ */ (0, import_jsx_runtime49.jsxs)("label", { className: "set", children: [
            "Send automatic email reminders",
            /* @__PURE__ */ (0, import_jsx_runtime49.jsx)(
              "input",
              {
                type: "checkbox",
                name: "emailOn",
                defaultChecked: Boolean(data.settings.emailOn)
              },
              String(data.settings.emailOn)
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime49.jsx)("button", { className: "btn", disabled: pending || loading, children: pending ? "Saving..." : "Save preferences" })
        ] })
      ] })
    ] });
  }
  var import_react36, import_jsx_runtime49;
  var init_AdminSettingsSection = __esm({
    "src/components/admin/AdminSettingsSection.jsx"() {
      init_define_import_meta_env();
      init_ProfilePhoto();
      init_PasswordChangeForm();
      init_PrivacyPolicy();
      init_GorillaAssistant();
      import_react36 = __toESM(require_react(), 1);
      init_Dialog();
      import_jsx_runtime49 = __toESM(require_jsx_runtime(), 1);
    }
  });

  // src/components/FitnessSculpture.jsx
  function FitnessSculpture({ variant = "weights" }) {
    const id = (0, import_react37.useId)().replaceAll(":", "");
    return /* @__PURE__ */ (0, import_jsx_runtime50.jsxs)("svg", { className: "fitness-sculpture", viewBox: "0 0 240 180", "aria-hidden": "true", children: [
      /* @__PURE__ */ (0, import_jsx_runtime50.jsxs)("defs", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime50.jsxs)("linearGradient", { id: `${id}-orange`, x1: "0", y1: "0", x2: "1", y2: "1", children: [
          /* @__PURE__ */ (0, import_jsx_runtime50.jsx)("stop", { stopColor: "#ffcc70" }),
          /* @__PURE__ */ (0, import_jsx_runtime50.jsx)("stop", { offset: "0.5", stopColor: "#f77f00" }),
          /* @__PURE__ */ (0, import_jsx_runtime50.jsx)("stop", { offset: "1", stopColor: "#c65313" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime50.jsxs)("linearGradient", { id: `${id}-navy`, x1: "0", y1: "0", x2: "1", y2: "1", children: [
          /* @__PURE__ */ (0, import_jsx_runtime50.jsx)("stop", { stopColor: "#5b829b" }),
          /* @__PURE__ */ (0, import_jsx_runtime50.jsx)("stop", { offset: "0.5", stopColor: "#164761" }),
          /* @__PURE__ */ (0, import_jsx_runtime50.jsx)("stop", { offset: "1", stopColor: "#003049" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime50.jsx)("ellipse", { cx: "125", cy: "154", rx: "82", ry: "12", fill: "var(--text)", opacity: "0.08" }),
      variant === "scanner" ? /* @__PURE__ */ (0, import_jsx_runtime50.jsxs)("g", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime50.jsx)("path", { d: "M60 45 157 23 191 43 92 68Z", fill: "#5b829b" }),
        /* @__PURE__ */ (0, import_jsx_runtime50.jsx)("path", { d: "M60 45 92 68v80l-32-23Z", fill: "#003049" }),
        /* @__PURE__ */ (0, import_jsx_runtime50.jsx)("path", { d: "M92 68 191 43v80l-99 25Z", fill: `url(#${id}-navy)` }),
        /* @__PURE__ */ (0, import_jsx_runtime50.jsx)("path", { d: "m108 78 65-17v46l-65 17Z", fill: "#e7edf7" }),
        /* @__PURE__ */ (0, import_jsx_runtime50.jsxs)("g", { stroke: "#164761", strokeWidth: "5", fill: "none", children: [
          /* @__PURE__ */ (0, import_jsx_runtime50.jsx)("path", { d: "m117 83 16-4v15l-16 4ZM146 76l16-4v15l-16 4ZM117 105l16-4v12l-16 4Z" }),
          /* @__PURE__ */ (0, import_jsx_runtime50.jsx)("path", { d: "m146 99 6-2v14l11-3" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime50.jsx)("path", { d: "m98 92 88-23", stroke: "#f77f00", strokeWidth: "3" }),
        /* @__PURE__ */ (0, import_jsx_runtime50.jsx)("ellipse", { cx: "179", cy: "118", rx: "4", ry: "3", fill: "#fcbf49" })
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime50.jsxs)("g", { transform: "rotate(-18 120 90)", children: [
        /* @__PURE__ */ (0, import_jsx_runtime50.jsx)("rect", { x: "69", y: "80", width: "104", height: "19", rx: "9", fill: `url(#${id}-navy)` }),
        /* @__PURE__ */ (0, import_jsx_runtime50.jsx)("rect", { x: "31", y: "49", width: "30", height: "80", rx: "14", fill: `url(#${id}-orange)` }),
        /* @__PURE__ */ (0, import_jsx_runtime50.jsx)("rect", { x: "58", y: "39", width: "28", height: "100", rx: "13", fill: `url(#${id}-navy)` }),
        /* @__PURE__ */ (0, import_jsx_runtime50.jsx)("rect", { x: "160", y: "39", width: "28", height: "100", rx: "13", fill: `url(#${id}-navy)` }),
        /* @__PURE__ */ (0, import_jsx_runtime50.jsx)("rect", { x: "186", y: "49", width: "30", height: "80", rx: "14", fill: `url(#${id}-orange)` }),
        /* @__PURE__ */ (0, import_jsx_runtime50.jsxs)("g", { fill: "#fff", opacity: "0.28", children: [
          /* @__PURE__ */ (0, import_jsx_runtime50.jsx)("rect", { x: "37", y: "60", width: "5", height: "48", rx: "2" }),
          /* @__PURE__ */ (0, import_jsx_runtime50.jsx)("rect", { x: "64", y: "50", width: "4", height: "66", rx: "2" }),
          /* @__PURE__ */ (0, import_jsx_runtime50.jsx)("rect", { x: "166", y: "50", width: "4", height: "66", rx: "2" }),
          /* @__PURE__ */ (0, import_jsx_runtime50.jsx)("rect", { x: "192", y: "60", width: "5", height: "48", rx: "2" })
        ] })
      ] })
    ] });
  }
  var import_react37, import_jsx_runtime50;
  var init_FitnessSculpture = __esm({
    "src/components/FitnessSculpture.jsx"() {
      init_define_import_meta_env();
      import_react37 = __toESM(require_react(), 1);
      import_jsx_runtime50 = __toESM(require_jsx_runtime(), 1);
    }
  });

  // src/utils/reports.js
  function parseReportDateTime(date4, time2, now = Date.now()) {
    const parts = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(date4);
    if (!parts || !/^\d{2}:\d{2}$/.test(time2))
      throw new Error("Enter a date in dd/mm/yyyy and choose a valid Manila time.");
    const [, day, month, year] = parts;
    const timestamp = Date.parse(`${year}-${month}-${day}T${time2}:00+08:00`);
    if (formatDate(timestamp) !== date4 || formatTime(timestamp, { hour12: false }) !== time2)
      throw new Error("Enter a valid calendar date and time.");
    if (timestamp < Date.UTC(2e3, 0, 1) || timestamp > now)
      throw new Error("Choose a record date and time between January 2000 and now.");
    return new Date(timestamp).toISOString();
  }
  function buildReport(kind, data, now = Date.now()) {
    const members = data.members.filter((member2) => ["user", "member"].includes(member2.role));
    if (kind === "active" || kind === "expired")
      return {
        headings: ["Member", "Member ID", "Plan", "Start date", "Expiry date"],
        records: members.filter((member2) => membershipState(member2, now).status === kind),
        rows: members.filter((member2) => membershipState(member2, now).status === kind).map((member2) => [
          member2.name,
          member2.memberCode || member2.id,
          member2.plan,
          date(member2.membershipStart || member2.joined),
          date(member2.membershipEnd)
        ])
      };
    if (kind === "attendance")
      return {
        headings: ["Member", "Member ID", "Check-in (Asia/Manila)", "Recorded by"],
        records: [...data.attendance].sort((a, b) => Date.parse(b.date) - Date.parse(a.date)),
        rows: [...data.attendance].sort((a, b) => Date.parse(b.date) - Date.parse(a.date)).map((item) => [
          item.memberName,
          item.memberId,
          formatDateTime(item.date, "Not set"),
          item.source || "Staff"
        ])
      };
    if (kind === "maintenance")
      return {
        headings: ["Equipment", "Maintenance note", "Date"],
        records: [...data.maintenance || []].sort(
          (a, b) => Date.parse(b.date) - Date.parse(a.date)
        ),
        rows: [...data.maintenance || []].sort((a, b) => Date.parse(b.date) - Date.parse(a.date)).map((item) => [item.item, item.note, date(item.date)])
      };
    return {
      headings: ["Member", "Plan", "Payment", "Amount (PHP)", "Method", "Date"],
      records: data.payments.filter((item) => kind !== "renewals" || item.type === "Renewal"),
      rows: data.payments.filter((item) => kind !== "renewals" || item.type === "Renewal").map((item) => [
        item.memberName,
        item.plan || "Not recorded",
        item.type || "Membership",
        Number(item.amount || 0).toFixed(2),
        item.method,
        date(item.date)
      ])
    };
  }
  var REPORT_TYPES, date;
  var init_reports = __esm({
    "src/utils/reports.js"() {
      init_define_import_meta_env();
      init_membership();
      init_formatDate();
      REPORT_TYPES = [
        ["active", "Active memberships"],
        ["expired", "Expired memberships"],
        ["attendance", "Attendance"],
        ["payments", "Payments"],
        ["renewals", "Membership renewals"],
        ["maintenance", "Equipment maintenance"]
      ];
      date = (value) => formatDate(value, "Not set");
    }
  });

  // src/components/AdminReports.jsx
  function RecordForm({ kind, record, data, busy, onSubmit, onClose }) {
    const maintenance = kind === "maintenance";
    const payment = kind === "payments";
    const recordedAt2 = record?.date || /* @__PURE__ */ new Date();
    return /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("form", { className: "mf", onSubmit, children: /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)("fieldset", { className: "report-form-fields", disabled: busy, children: [
      maintenance ? /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)(import_jsx_runtime51.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)("label", { className: "field", children: [
          "Equipment",
          /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)(
            "select",
            {
              className: "clay-in",
              name: "equipmentId",
              defaultValue: record?.equipmentId || "",
              required: true,
              "data-autofocus": true,
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("option", { value: "", disabled: true, children: "Choose equipment" }),
                data.equipment.map((item) => /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("option", { value: item.id, children: item.name }, item.id))
              ]
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)("label", { className: "field", children: [
          "Maintenance note",
          /* @__PURE__ */ (0, import_jsx_runtime51.jsx)(
            "textarea",
            {
              className: "clay-in",
              name: "note",
              defaultValue: record?.note || "",
              required: true,
              maxLength: 500,
              rows: 4,
              placeholder: "What was inspected, repaired, or replaced?"
            }
          )
        ] })
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)(import_jsx_runtime51.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)("label", { className: "field", children: [
          "Member",
          /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)(
            "select",
            {
              className: "clay-in",
              name: "memberId",
              defaultValue: record?.memberId || "",
              disabled: Boolean(record),
              required: true,
              "data-autofocus": true,
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("option", { value: "", disabled: true, children: "Choose a member" }),
                data.members.filter((member2) => ["user", "member"].includes(member2.role)).map((member2) => /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)("option", { value: member2.id, children: [
                  member2.name,
                  " \xB7 ",
                  member2.memberCode || member2.id
                ] }, member2.id))
              ]
            }
          )
        ] }),
        payment && /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)("div", { className: "report-form-row", children: [
          /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)("label", { className: "field", children: [
            "Amount (PHP)",
            /* @__PURE__ */ (0, import_jsx_runtime51.jsx)(
              "input",
              {
                className: "clay-in",
                type: "number",
                name: "amount",
                min: "0.01",
                max: "100000000",
                step: "0.01",
                required: true,
                defaultValue: record?.amount || "",
                placeholder: "0.00"
              }
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)("label", { className: "field", children: [
            "Payment method",
            /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)("select", { className: "clay-in", name: "method", defaultValue: record?.method || "Cash", children: [
              /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("option", { children: "Cash" }),
              /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("option", { children: "GCash" })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)("div", { className: "report-form-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)("label", { className: "field", children: [
          "Date (dd/mm/yyyy)",
          /* @__PURE__ */ (0, import_jsx_runtime51.jsx)(
            "input",
            {
              className: "clay-in",
              name: "date",
              placeholder: "dd/mm/yyyy",
              pattern: "[0-9]{2}/[0-9]{2}/[0-9]{4}",
              maxLength: 10,
              required: true,
              defaultValue: formatDate(recordedAt2, "")
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)("label", { className: "field", children: [
          "Time (Asia/Manila)",
          /* @__PURE__ */ (0, import_jsx_runtime51.jsx)(
            "input",
            {
              className: "clay-in",
              type: "time",
              name: "time",
              required: true,
              defaultValue: formatTime(recordedAt2, { hour12: false })
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("p", { className: "form-help", children: payment ? "This records money already received. It does not charge a member or extend their membership." : maintenance ? "This updates the maintenance history. Equipment condition is managed on the Equipment page." : "You are correcting an existing check-in. Scanner details stay attached to the record." }),
      /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)("div", { className: "ma", children: [
        /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("button", { className: "btn ghost cancel-button", type: "button", onClick: onClose, children: "Cancel" }),
        /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("button", { className: "btn", type: "submit", children: busy ? "Saving\u2026" : record ? "Save changes" : "Create record" })
      ] })
    ] }) });
  }
  function AdminReports({ data, onChanged, onMemberAction }) {
    const { token, role } = useAuth();
    const [kind, setKind] = (0, import_react38.useState)("active");
    const [dialog2, setDialog] = (0, import_react38.useState)(null);
    const [deletion, setDeletion] = (0, import_react38.useState)(null);
    const [busy, setBusy] = (0, import_react38.useState)(false);
    const [error, setError] = (0, import_react38.useState)("");
    const [notice, setNotice] = (0, import_react38.useState)("");
    const actionLock = (0, import_react38.useRef)(false);
    const reports = (0, import_react38.useMemo)(
      () => Object.fromEntries(REPORT_TYPES.map(([value]) => [value, buildReport(value, data)])),
      [data]
    );
    const report = reports[kind];
    const title = REPORT_TYPES.find(([value]) => value === kind)[1];
    const membership = ["active", "expired"].includes(kind);
    const collection = kind === "renewals" ? "payments" : kind;
    const total = ["payments", "renewals"].includes(kind) ? report.records.reduce((sum, row) => sum + Number(row.amount || 0), 0) : null;
    const open = (mode, record, index) => {
      setError("");
      setNotice("");
      setDialog({ mode, record, index });
    };
    const save = async (event) => {
      event.preventDefault();
      if (actionLock.current) return;
      actionLock.current = true;
      setBusy(true);
      setError("");
      try {
        const { date: date4, time: time2, ...input } = Object.fromEntries(new FormData(event.currentTarget));
        input.date = parseReportDateTime(date4, time2);
        await apiRequest(
          `/admin/reports/${collection}${dialog2.record ? `/${dialog2.record.id}` : ""}`,
          {
            token,
            method: dialog2.record ? "PATCH" : "POST",
            body: JSON.stringify(input)
          }
        );
        setDialog(null);
        const refreshed = await onChanged();
        setNotice(
          `Record saved. ${refreshed === false ? "The refresh failed. Use Retry above to reload the latest records." : "Reports and dashboard totals have been refreshed."}`
        );
      } catch (cause) {
        setError(cause.message || "Unable to save this record. Please try again.");
      } finally {
        actionLock.current = false;
        setBusy(false);
      }
    };
    return /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)("article", { className: "card clay reports-card", children: [
      /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)("div", { className: "report-heading", children: [
        /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("div", { className: "report-tabs", role: "group", "aria-label": "Report type", children: REPORT_TYPES.map(([value, label]) => /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)(
          "button",
          {
            type: "button",
            title: label,
            "aria-pressed": kind === value,
            onClick: () => {
              setKind(value);
              setNotice("");
            },
            children: [
              {
                active: "Active",
                expired: "Expired",
                attendance: "Attendance",
                payments: "Payment",
                renewals: "Renewal",
                maintenance: "Maintenance"
              }[value],
              /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("span", { children: reports[value].rows.length })
            ]
          },
          value
        )) }),
        /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)("div", { className: "report-heading-actions", children: [
          /* @__PURE__ */ (0, import_jsx_runtime51.jsx)(
            "button",
            {
              className: "btn ghost",
              type: "button",
              disabled: !report.rows.length,
              onClick: () => downloadCsvRows(`fitpulse-${kind}`, report.headings, report.rows),
              children: "Export CSV"
            }
          ),
          !membership && kind !== "attendance" && /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)(
            "button",
            {
              className: "btn",
              type: "button",
              disabled: busy,
              onClick: () => kind === "renewals" ? open("renew") : open("edit"),
              children: [
                "+ ",
                kind === "renewals" ? "Renew membership" : "Add record"
              ]
            }
          ),
          !membership && role === "admin" && /* @__PURE__ */ (0, import_jsx_runtime51.jsx)(
            RecordDeleteButton,
            {
              all: true,
              label: `Clear all ${title.toLowerCase()} records`,
              disabled: busy || !report.records.length,
              onClick: () => setDeletion({ all: true, category: kind, count: report.records.length })
            }
          )
        ] })
      ] }),
      notice && /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("p", { className: "report-notice", role: "status", children: notice }),
      /* @__PURE__ */ (0, import_jsx_runtime51.jsx)(DataTable, { headings: [...report.headings, "Actions"], caption: title, children: report.rows.map((row, index) => /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)("tr", { children: [
        row.map((cell, cellIndex) => /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("td", { children: cellIndex === 0 && collection !== "maintenance" ? /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)("div", { className: "member-table-person", children: [
          /* @__PURE__ */ (0, import_jsx_runtime51.jsx)(ProfileAvatar, { user: { name: cell } }),
          /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("span", { children: cell })
        ] }) : cell }, cellIndex)),
        /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)("td", { className: "acts", children: [
          /* @__PURE__ */ (0, import_jsx_runtime51.jsx)(
            "button",
            {
              className: "report-icon-button",
              type: "button",
              title: "View record",
              "aria-label": `View ${row[0]} record`,
              onClick: () => open("view", report.records[index], index),
              children: /* @__PURE__ */ (0, import_jsx_runtime51.jsx)(Icon2, { name: "eye", size: 18 })
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime51.jsx)(
            "button",
            {
              className: "report-icon-button",
              type: "button",
              title: "Edit record",
              "aria-label": `Edit ${row[0]} record`,
              onClick: () => membership ? onMemberAction("edit", report.records[index]) : open("edit", report.records[index]),
              children: /* @__PURE__ */ (0, import_jsx_runtime51.jsx)(Icon2, { name: "edit", size: 18 })
            }
          ),
          !membership && role === "admin" && /* @__PURE__ */ (0, import_jsx_runtime51.jsx)(
            RecordDeleteButton,
            {
              label: `Delete ${row[0]} record`,
              disabled: busy,
              onClick: () => setDeletion({ category: kind, id: report.records[index].id, label: row[0] })
            }
          ),
          membership && /* @__PURE__ */ (0, import_jsx_runtime51.jsx)(
            "button",
            {
              className: "btn sm",
              type: "button",
              onClick: () => onMemberAction("renew", report.records[index]),
              children: "Renew"
            }
          )
        ] })
      ] }, report.records[index].id)) }, kind),
      /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)("div", { className: "report-total", children: [
        /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("strong", { children: total === null ? `${report.rows.length} ${title.toLowerCase()}` : `Total: ${new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(total)}` }),
        !membership && /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("small", { children: "Changes update the source records, including dashboard totals." })
      ] }),
      deletion && /* @__PURE__ */ (0, import_jsx_runtime51.jsx)(
        RecordDeleteDialog,
        {
          target: deletion,
          onClose: () => setDeletion(null),
          onChanged,
          onNotice: setNotice
        }
      ),
      dialog2 && /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)(
        Dialog,
        {
          title: dialog2.mode === "view" ? title : dialog2.mode === "renew" ? "Renew a membership" : dialog2.record ? "Edit record" : "Add a record",
          busy,
          onClose: () => setDialog(null),
          children: [
            error && /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("p", { className: "form-error", role: "alert", children: error }),
            dialog2.mode === "view" ? /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)(import_jsx_runtime51.Fragment, { children: [
              /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("dl", { className: "report-record-details", children: report.headings.map((heading, index) => /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)("div", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("dt", { children: heading }),
                /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("dd", { children: report.rows[dialog2.index]?.[index] })
              ] }, heading)) }),
              /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("div", { className: "ma", children: /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("button", { className: "btn", type: "button", onClick: () => setDialog(null), children: "Close" }) })
            ] }) : dialog2.mode === "renew" ? /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)(
              "form",
              {
                className: "mf",
                onSubmit: (event) => {
                  event.preventDefault();
                  const member2 = data.members.find(
                    (item) => item.id === new FormData(event.currentTarget).get("memberId")
                  );
                  if (member2) {
                    setDialog(null);
                    onMemberAction("renew", member2);
                  }
                },
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)("label", { className: "field", children: [
                    "Member",
                    /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)("select", { className: "clay-in", name: "memberId", required: true, defaultValue: "", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("option", { value: "", disabled: true, children: "Choose a member" }),
                      data.members.filter((member2) => ["user", "member"].includes(member2.role)).map((member2) => /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("option", { value: member2.id, children: member2.name }, member2.id))
                    ] })
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("div", { className: "ma", children: /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("button", { className: "btn", type: "submit", children: "Continue to renewal" }) })
                ]
              }
            ) : /* @__PURE__ */ (0, import_jsx_runtime51.jsx)(
              RecordForm,
              {
                kind: collection,
                record: dialog2.record,
                data,
                busy,
                onSubmit: save,
                onClose: () => setDialog(null)
              }
            )
          ]
        }
      )
    ] });
  }
  var import_react38, import_jsx_runtime51;
  var init_AdminReports = __esm({
    "src/components/AdminReports.jsx"() {
      init_define_import_meta_env();
      import_react38 = __toESM(require_react(), 1);
      init_DataTable();
      init_Dialog();
      init_ProfileAvatar();
      init_DashboardShell2();
      init_AuthContext();
      init_api();
      init_reports();
      init_formatDate();
      init_paymentExport();
      init_RecordDeleteControls();
      import_jsx_runtime51 = __toESM(require_jsx_runtime(), 1);
    }
  });

  // src/components/AdminNotifications.jsx
  function AdminNotifications({
    state,
    canManage,
    busy,
    onDelete,
    onReview
  }) {
    const membership = state.notifications.filter((item) => item.kind === "membership");
    const equipment2 = state.notifications.filter((item) => item.kind === "equipment");
    const clearButton = (group, items, scopeLabel) => canManage && /* @__PURE__ */ (0, import_jsx_runtime52.jsx)(
      RecordDeleteButton,
      {
        all: true,
        label: `Clear all ${scopeLabel}`,
        disabled: busy || !state.canDismiss || !items.length,
        onClick: () => onDelete({ category: "notifications", all: true, group, count: items.length, scopeLabel })
      }
    );
    const deleteButton = (item) => canManage && /* @__PURE__ */ (0, import_jsx_runtime52.jsx)(
      RecordDeleteButton,
      {
        label: `Delete notification for ${item.name}`,
        disabled: busy || !state.canDismiss,
        onClick: () => onDelete({ category: "notifications", id: item.id, label: item.name })
      }
    );
    return /* @__PURE__ */ (0, import_jsx_runtime52.jsx)(import_jsx_runtime52.Fragment, { children: /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)("section", { className: "grid g2 notification-columns", children: [
      /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)("article", { className: "card clay", children: [
        /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)("div", { className: "record-section-heading", children: [
          /* @__PURE__ */ (0, import_jsx_runtime52.jsx)("h2", { children: "Membership reminders" }),
          clearButton("membership", membership, "membership reminders")
        ] }),
        membership.length ? /* @__PURE__ */ (0, import_jsx_runtime52.jsx)("ul", { className: "admin-list notification-list", children: membership.map((item) => /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)("li", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime52.jsx)("strong", { children: item.name }),
            /* @__PURE__ */ (0, import_jsx_runtime52.jsx)("small", { children: item.email }),
            /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)("small", { children: [
              item.type === "expired" ? "Expired" : "Expiring soon",
              " \xB7",
              " ",
              recordedAt(item.membershipEnd)
            ] })
          ] }),
          deleteButton(item)
        ] }, item.id)) }) : /* @__PURE__ */ (0, import_jsx_runtime52.jsx)("p", { className: "admin-empty", children: "No membership reminders in your notification list." })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)("article", { className: "card clay", children: [
        /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)("div", { className: "record-section-heading", children: [
          /* @__PURE__ */ (0, import_jsx_runtime52.jsx)("h2", { children: "Equipment inspection reminders" }),
          clearButton("equipment", equipment2, "equipment reminders")
        ] }),
        equipment2.length ? /* @__PURE__ */ (0, import_jsx_runtime52.jsx)("ul", { className: "admin-list notification-list", children: equipment2.map((item) => /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)("li", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime52.jsx)("strong", { children: item.name }),
            /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)("small", { children: [
              "Last inspected: ",
              recordedAt(item.lastInspected)
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime52.jsx)("small", { children: item.condition })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)("div", { className: "notification-row-actions", children: [
            /* @__PURE__ */ (0, import_jsx_runtime52.jsx)("button", { className: "btn ghost", type: "button", onClick: onReview, children: "Review" }),
            deleteButton(item)
          ] })
        ] }, item.id)) }) : /* @__PURE__ */ (0, import_jsx_runtime52.jsx)("p", { className: "admin-empty", children: "No equipment reminders in your notification list." })
      ] })
    ] }) });
  }
  var import_jsx_runtime52, recordedAt;
  var init_AdminNotifications = __esm({
    "src/components/AdminNotifications.jsx"() {
      init_define_import_meta_env();
      init_DashboardShell2();
      init_RecordDeleteControls();
      init_formatDate();
      import_jsx_runtime52 = __toESM(require_jsx_runtime(), 1);
      recordedAt = (value) => formatDateTime(value, "Not recorded");
    }
  });

  // src/components/mobile/StatCard.jsx
  function StatCard({ icon, label, value }) {
    return /* @__PURE__ */ (0, import_jsx_runtime53.jsxs)("article", { className: "fitpulse-stat", children: [
      /* @__PURE__ */ (0, import_jsx_runtime53.jsx)("span", { className: "fitpulse-icon-chip", children: icon }),
      /* @__PURE__ */ (0, import_jsx_runtime53.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime53.jsx)("p", { children: label }),
        /* @__PURE__ */ (0, import_jsx_runtime53.jsx)("strong", { children: value })
      ] })
    ] });
  }
  var import_jsx_runtime53;
  var init_StatCard = __esm({
    "src/components/mobile/StatCard.jsx"() {
      init_define_import_meta_env();
      import_jsx_runtime53 = __toESM(require_jsx_runtime(), 1);
    }
  });

  // src/components/mobile/SectionHeader.jsx
  function SectionHeader({ title, onViewAll }) {
    return /* @__PURE__ */ (0, import_jsx_runtime54.jsxs)("div", { className: "fitpulse-section-header", children: [
      /* @__PURE__ */ (0, import_jsx_runtime54.jsx)("h2", { children: title }),
      onViewAll && /* @__PURE__ */ (0, import_jsx_runtime54.jsx)(
        "button",
        {
          className: "fitpulse-text-button",
          type: "button",
          "aria-label": `View all ${title.toLowerCase()}`,
          onClick: onViewAll,
          children: "View All \u2192"
        }
      )
    ] });
  }
  var import_jsx_runtime54;
  var init_SectionHeader = __esm({
    "src/components/mobile/SectionHeader.jsx"() {
      init_define_import_meta_env();
      import_jsx_runtime54 = __toESM(require_jsx_runtime(), 1);
    }
  });

  // src/components/mobile/MemberRow.jsx
  function MemberRow({ member: member2, expiring, date: date4, onSelect }) {
    const state = membershipState(member2);
    const status = expiring ? "expiring" : state.status;
    const initials = member2.name?.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
    const paletteIndex = (member2.id?.charCodeAt(0) || 0) % 4;
    return /* @__PURE__ */ (0, import_jsx_runtime55.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime55.jsxs)("button", { type: "button", className: "fitpulse-member-row", onClick: () => onSelect(member2), children: [
      /* @__PURE__ */ (0, import_jsx_runtime55.jsx)("span", { className: "fitpulse-initials", "data-palette": paletteIndex, "aria-hidden": "true", children: initials || "M" }),
      /* @__PURE__ */ (0, import_jsx_runtime55.jsxs)("span", { className: "fitpulse-row-copy", children: [
        /* @__PURE__ */ (0, import_jsx_runtime55.jsx)("strong", { children: member2.name }),
        /* @__PURE__ */ (0, import_jsx_runtime55.jsxs)("small", { children: [
          member2.plan,
          " \xB7 Until ",
          date4(member2.membershipEnd)
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime55.jsx)("span", { className: `fitpulse-status is-${status}`, children: expiring ? "Expiring" : state.label })
    ] }) });
  }
  var import_jsx_runtime55;
  var init_MemberRow = __esm({
    "src/components/mobile/MemberRow.jsx"() {
      init_define_import_meta_env();
      init_membership();
      import_jsx_runtime55 = __toESM(require_jsx_runtime(), 1);
    }
  });

  // src/components/mobile/ActivityRow.jsx
  function ActivityRow({ row, Icon: Icon3 }) {
    const date4 = new Date(row.date);
    return /* @__PURE__ */ (0, import_jsx_runtime56.jsxs)("li", { className: "fitpulse-activity-row", children: [
      /* @__PURE__ */ (0, import_jsx_runtime56.jsx)("span", { className: "fitpulse-icon-chip", "data-kind": row.icon, children: /* @__PURE__ */ (0, import_jsx_runtime56.jsx)(Icon3, { name: row.icon, size: 18 }) }),
      /* @__PURE__ */ (0, import_jsx_runtime56.jsxs)("span", { className: "fitpulse-row-copy", children: [
        /* @__PURE__ */ (0, import_jsx_runtime56.jsx)("strong", { children: row.title }),
        /* @__PURE__ */ (0, import_jsx_runtime56.jsx)("small", { children: row.detail })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime56.jsxs)("time", { dateTime: row.date, children: [
        /* @__PURE__ */ (0, import_jsx_runtime56.jsx)("span", { children: formatDate(date4) }),
        /* @__PURE__ */ (0, import_jsx_runtime56.jsx)("span", { children: formatTime(date4) })
      ] })
    ] });
  }
  var import_jsx_runtime56;
  var init_ActivityRow = __esm({
    "src/components/mobile/ActivityRow.jsx"() {
      init_define_import_meta_env();
      init_formatDate();
      import_jsx_runtime56 = __toESM(require_jsx_runtime(), 1);
    }
  });

  // src/components/mobile/MobileScreens.jsx
  function MobileOverview({
    stats,
    expiring,
    date: date4,
    onMember,
    onExpiring,
    rows,
    onActivities,
    loading,
    summary
  }) {
    return /* @__PURE__ */ (0, import_jsx_runtime57.jsxs)(import_jsx_runtime57.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime57.jsx)("section", { className: "fitpulse-stat-grid", "aria-label": "Overview totals", children: stats.map(([label, value, icon]) => /* @__PURE__ */ (0, import_jsx_runtime57.jsx)(
        StatCard,
        {
          label,
          value: loading ? "\u2014" : value,
          icon: /* @__PURE__ */ (0, import_jsx_runtime57.jsx)(Icon2, { name: icon, size: 20 })
        },
        label
      )) }),
      summary && /* @__PURE__ */ (0, import_jsx_runtime57.jsx)("div", { className: "mobile-overview-summary", children: summary }),
      expiring && /* @__PURE__ */ (0, import_jsx_runtime57.jsxs)("section", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime57.jsx)(SectionHeader, { title: "Expiring soon", onViewAll: onExpiring }),
        /* @__PURE__ */ (0, import_jsx_runtime57.jsx)("ul", { className: "fitpulse-rows", children: expiring.length ? expiring.slice(0, 3).map((member2) => /* @__PURE__ */ (0, import_jsx_runtime57.jsx)(
          MemberRow,
          {
            member: member2,
            expiring: true,
            date: date4,
            onSelect: onMember
          },
          member2.id
        )) : !loading && /* @__PURE__ */ (0, import_jsx_runtime57.jsx)("li", { className: "fitpulse-empty", children: "No memberships expiring soon." }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime57.jsxs)("section", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime57.jsx)(SectionHeader, { title: "Recent activity", onViewAll: onActivities }),
        /* @__PURE__ */ (0, import_jsx_runtime57.jsx)(ActivityList, { rows: rows.slice(0, 4), loading })
      ] })
    ] });
  }
  function MobileMembers({
    members,
    expiring,
    date: date4,
    query: query2,
    setQuery,
    onMember,
    filter,
    setFilter,
    loading
  }) {
    const expiringIds = new Set(expiring.map((member2) => member2.id));
    const records = filterMemberRecords(filter ? expiring : members, query2);
    return /* @__PURE__ */ (0, import_jsx_runtime57.jsxs)(import_jsx_runtime57.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime57.jsxs)("label", { className: "fitpulse-search", children: [
        /* @__PURE__ */ (0, import_jsx_runtime57.jsx)(Icon2, { name: "search" }),
        /* @__PURE__ */ (0, import_jsx_runtime57.jsx)(
          "input",
          {
            type: "search",
            "aria-label": "Search members",
            placeholder: "Search members",
            value: query2,
            onChange: (event) => setQuery(event.target.value)
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime57.jsxs)("div", { className: "fitpulse-screen-actions", children: [
        /* @__PURE__ */ (0, import_jsx_runtime57.jsx)(
          "button",
          {
            type: "button",
            className: "btn ghost fitpulse-secondary",
            "aria-pressed": !filter,
            onClick: () => setFilter(false),
            children: "All members"
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime57.jsx)(
          "button",
          {
            type: "button",
            className: "btn ghost fitpulse-secondary",
            "aria-pressed": filter,
            onClick: () => setFilter(true),
            children: "Expiring soon"
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime57.jsxs)("ul", { className: "fitpulse-rows", children: [
        records.map((member2) => /* @__PURE__ */ (0, import_jsx_runtime57.jsx)(
          MemberRow,
          {
            member: member2,
            date: date4,
            expiring: expiringIds.has(member2.id),
            onSelect: onMember
          },
          member2.id
        )),
        !loading && !records.length && /* @__PURE__ */ (0, import_jsx_runtime57.jsx)("li", { className: "fitpulse-empty", children: "No matching members." })
      ] })
    ] });
  }
  function ActivityList({ rows, loading }) {
    return /* @__PURE__ */ (0, import_jsx_runtime57.jsxs)("ul", { className: "fitpulse-rows", children: [
      rows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime57.jsx)(ActivityRow, { row, Icon: Icon2 }, row.id)),
      !loading && !rows.length && /* @__PURE__ */ (0, import_jsx_runtime57.jsx)("li", { className: "fitpulse-empty", children: "No activity recorded yet." })
    ] });
  }
  function MobileActivities({ rows, loading, reminderError, select }) {
    return /* @__PURE__ */ (0, import_jsx_runtime57.jsxs)(import_jsx_runtime57.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime57.jsxs)("div", { className: "fitpulse-screen-actions", children: [
        /* @__PURE__ */ (0, import_jsx_runtime57.jsx)("button", { className: "btn ghost fitpulse-secondary", type: "button", onClick: () => select("Attendance"), children: "Attendance" }),
        /* @__PURE__ */ (0, import_jsx_runtime57.jsx)("button", { className: "btn ghost fitpulse-secondary", type: "button", onClick: () => select("Payments"), children: "Payments" })
      ] }),
      reminderError && /* @__PURE__ */ (0, import_jsx_runtime57.jsx)("p", { className: "fitpulse-empty", role: "status", children: reminderError }),
      /* @__PURE__ */ (0, import_jsx_runtime57.jsx)(ActivityList, { rows, loading })
    ] });
  }
  var import_jsx_runtime57;
  var init_MobileScreens = __esm({
    "src/components/mobile/MobileScreens.jsx"() {
      init_define_import_meta_env();
      init_DashboardShell2();
      init_membership();
      init_StatCard();
      init_SectionHeader();
      init_MemberRow();
      init_ActivityRow();
      import_jsx_runtime57 = __toESM(require_jsx_runtime(), 1);
    }
  });

  // src/components/mobile/activity.js
  function useReminderActivity(token, enabled, latestEvent) {
    const [state, setState] = (0, import_react39.useState)({ reminders: [], error: "" });
    const reminderEvent = [gorillaTitles.expiring, gorillaTitles.expired].includes(latestEvent?.title) ? latestEvent.id : null;
    (0, import_react39.useEffect)(() => {
      if (!enabled || !token) return;
      const controller = new AbortController();
      apiRequest("/events/reminders", { token, signal: controller.signal }).then(({ reminders }) => {
        if (!controller.signal.aborted) setState({ reminders, error: "" });
      }).catch(() => {
        if (!controller.signal.aborted)
          setState((previous) => ({ ...previous, error: "Reminder email history is unavailable." }));
      });
      return () => controller.abort();
    }, [enabled, reminderEvent, token]);
    return state;
  }
  function activityRows({
    attendance: attendance2,
    payments: payments2,
    reminders,
    maintenance = [],
    members = [],
    money: money3,
    staff = false
  }) {
    const names = new Map(members.map((member2) => [member2.id, member2.name]));
    return [
      ...attendance2.map((entry) => ({
        id: `attendance-${entry.id}`,
        date: entry.date,
        title: "QR check-in",
        detail: staff ? entry.memberName || "Member" : entry.source || "FitPulse",
        icon: "qr"
      })),
      ...payments2.map((entry) => ({
        id: `payment-${entry.id}`,
        date: entry.date,
        title: `${entry.method || "Membership"} payment`,
        detail: [staff && entry.memberName, money3(entry.amount)].filter(Boolean).join(" \xB7 "),
        icon: "wallet"
      })),
      ...reminders.map((entry) => ({
        id: `reminder-${entry.id}`,
        date: entry.date,
        title: entry.type === "expired" ? "Expiry email sent" : "Reminder email sent",
        detail: staff ? names.get(entry.memberId) || "Member" : "Membership expiry",
        icon: "mail"
      })),
      ...maintenance.map((entry) => ({
        id: `equipment-${entry.id}`,
        date: entry.date,
        title: entry.item || "Equipment",
        detail: entry.note,
        icon: "dumbbell"
      })),
      ...members.map((entry) => ({
        id: `member-${entry.id}`,
        date: entry.createdAt,
        title: "New member",
        detail: entry.name,
        icon: "users"
      }))
    ].filter((row) => Number.isFinite(Date.parse(row.date))).sort((first, second) => Date.parse(second.date) - Date.parse(first.date));
  }
  var import_react39;
  var init_activity = __esm({
    "src/components/mobile/activity.js"() {
      init_define_import_meta_env();
      import_react39 = __toESM(require_react(), 1);
      init_gorillaEvents();
      init_api();
    }
  });

  // src/pages/AdminStaffPage.css
  var init_AdminStaffPage = __esm({
    "src/pages/AdminStaffPage.css"() {
    }
  });

  // src/pages/AdminStaffPage.jsx
  var AdminStaffPage_exports = {};
  __export(AdminStaffPage_exports, {
    default: () => AdminStaffPage
  });
  function AdminStaffPage({ user: user2, onSignOut, startMemberCreation = false }) {
    const { token } = useAuth();
    const { notify, latestEvent } = useGorilla() || {};
    const mobile = useIsMobile();
    const [currentUser, setCurrentUser] = (0, import_react40.useState)(user2);
    const [section, setSection] = (0, import_react40.useState)("Dashboard");
    const [data, setData] = (0, import_react40.useState)({
      members: [],
      membershipPlans: [],
      attendance: [],
      payments: [],
      equipment: [],
      maintenance: [],
      notificationState: { notifications: [], canDismiss: false },
      settings: { gym: "FitPulse Gym", remind: 7 }
    });
    const [error, setError] = (0, import_react40.useState)("");
    const [fieldError, setFieldError] = (0, import_react40.useState)(null);
    const [notice, setNotice] = (0, import_react40.useState)("");
    const [modal, setModal] = (0, import_react40.useState)(() => startMemberCreation ? { kind: "create" } : null);
    const [deletion, setDeletion] = (0, import_react40.useState)(null);
    const [query2, setQuery] = (0, import_react40.useState)("");
    const [onlyExpiring, setOnlyExpiring] = (0, import_react40.useState)(false);
    const [loading, setLoading] = (0, import_react40.useState)(true);
    const [pending, setPending] = (0, import_react40.useState)(false);
    const actionLock = (0, import_react40.useRef)(false);
    const loadVersion = (0, import_react40.useRef)(0);
    const canDeleteHistory = currentUser?.role === "admin";
    const load = (0, import_react40.useCallback)(
      async (signal) => {
        const version = ++loadVersion.current;
        try {
          const [
            members2,
            membershipPlans,
            attendance2,
            payments2,
            equipment2,
            settings2,
            profile2,
            notifications
          ] = await Promise.all([
            apiRequest("/members", { token, signal }),
            apiRequest("/admin/membership-plans", { token, signal }),
            apiRequest("/attendance", { token, signal }),
            apiRequest("/payments", { token, signal }),
            apiRequest("/admin/equipment", { token, signal }),
            apiRequest("/admin/settings", { token, signal }),
            apiRequest("/me", { token, signal }),
            apiRequest("/admin/notifications", { token, signal }).catch((cause) => ({
              notifications: [],
              canDismiss: false,
              issue: cause.message
            }))
          ]);
          if (signal?.aborted || version !== loadVersion.current) return;
          setCurrentUser(profile2.user);
          setData({
            ...members2,
            ...membershipPlans,
            ...attendance2,
            ...payments2,
            ...equipment2,
            ...settings2,
            notificationState: notifications
          });
          setError("");
          return true;
        } catch (cause) {
          if (!signal?.aborted && version === loadVersion.current) setError(cause.message);
          return false;
        } finally {
          if (!signal?.aborted && version === loadVersion.current) setLoading(false);
        }
      },
      [token]
    );
    (0, import_react40.useEffect)(() => {
      const controller = new AbortController();
      load(controller.signal);
      return () => controller.abort();
    }, [load]);
    (0, import_react40.useEffect)(() => {
      if (!latestEvent || actionLock.current) return;
      const controller = new AbortController();
      const timer = window.setTimeout(() => {
        if (!actionLock.current) void load(controller.signal);
      }, 160);
      return () => {
        window.clearTimeout(timer);
        controller.abort();
      };
    }, [latestEvent, load]);
    (0, import_react40.useEffect)(() => {
      if (section !== "Attendance") return;
      const controller = new AbortController();
      const timer = window.setInterval(() => load(controller.signal), 5e3);
      return () => {
        window.clearInterval(timer);
        controller.abort();
      };
    }, [section, load]);
    (0, import_react40.useEffect)(() => {
      if (section !== "Notifications") return;
      const controller = new AbortController();
      const refresh = async () => {
        try {
          const notificationState = await apiRequest("/admin/notifications", {
            token,
            signal: controller.signal
          });
          if (!controller.signal.aborted) setData((previous) => ({ ...previous, notificationState }));
        } catch (cause) {
          if (!controller.signal.aborted) setError(cause.message);
        }
      };
      void refresh();
      const timer = window.setInterval(refresh, 15e3);
      return () => {
        controller.abort();
        window.clearInterval(timer);
      };
    }, [section, token]);
    const act = async (path, options, message, onSuccess) => {
      if (actionLock.current) return false;
      actionLock.current = true;
      setPending(true);
      setError("");
      setFieldError(null);
      setNotice("");
      try {
        const result2 = await apiRequest(path, { token, ...options });
        if (result2.signInRequired) {
          onSignOut();
          return true;
        }
        if (path === "/profile" && result2?.user) {
          setCurrentUser(result2.user);
        }
        setNotice(result2.message || message);
        if (onSuccess) onSuccess(result2);
        else setModal(null);
        await load();
        return true;
      } catch (cause) {
        setError(cause.message);
        setFieldError(cause.field ? { name: cause.field } : null);
        return false;
      } finally {
        actionLock.current = false;
        setPending(false);
      }
    };
    const members = (0, import_react40.useMemo)(
      () => data.members.filter((member2) => ["user", "member"].includes(member2.role)),
      [data.members]
    );
    const active = members.filter((member2) => membershipState(member2).status === "active").length;
    const expiredMembers = members.filter((member2) => membershipState(member2).status === "expired");
    const reminderList = reminderMembers(members, data.settings.remind);
    const expiring = reminderList.filter((member2) => membershipState(member2).status === "active");
    const renewals = data.payments.filter((payment) => payment.type === "Renewal");
    const today = manilaDateKey(/* @__PURE__ */ new Date());
    const revenue = data.payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const reminderActivity = useReminderActivity(token, mobile, latestEvent);
    const activity = mobile ? activityRows({
      ...data,
      members,
      reminders: reminderActivity.reminders,
      money,
      staff: true
    }) : [];
    const onManilaDay = (row) => manilaDateKey(row.date) === today;
    const showMember = (member2) => setModal({ kind: "view", member: member2 });
    const selectSection = (0, import_react40.useCallback)((nextSection) => {
      if (nextSection === "Members") setOnlyExpiring(false);
      setSection(nextSection);
    }, []);
    const showMemberAlert = (0, import_react40.useCallback)(async (memberId) => {
      let member2 = members.find((record) => record.id === memberId);
      try {
        if (!member2) {
          const result2 = await apiRequest("/members", { token });
          member2 = result2.members.find((record) => record.id === memberId && ["user", "member"].includes(record.role));
        }
        if (member2) setModal({ kind: "view", member: member2 });
        else setError("This member is no longer available.");
      } catch (cause) {
        setError(cause.message);
      }
    }, [members, token]);
    const scanQr = (0, import_react40.useCallback)(async (qrToken) => {
      setError("");
      setNotice("");
      try {
        const result2 = await apiRequest("/admin/attendance/scan", {
          token,
          method: "POST",
          body: JSON.stringify({
            qrToken,
            // randomUUID is unavailable on some HTTP gym-network pages.
            requestId: globalThis.crypto.randomUUID?.() || Array.from(
              globalThis.crypto.getRandomValues(new Uint8Array(16)),
              (byte) => byte.toString(16).padStart(2, "0")
            ).join("")
          })
        });
        if (result2?.allowed !== true) {
          throw new Error(
            result2?.message || "Attendance was not confirmed."
          );
        }
        const message = result2.code === "ALREADY_RECORDED" ? "This check-in was already recorded." : `Check-in recorded for ${result2.memberName}.`;
        setNotice(message);
        await load();
        return result2;
      } catch (cause) {
        const message = cause?.message || "Unable to process attendance.";
        setError(message);
        return {
          allowed: false,
          message
        };
      }
    }, [token, load]);
    const createMember = (eventOrDetails) => {
      const isFormEvent = typeof eventOrDetails?.preventDefault === "function";
      if (isFormEvent) eventOrDetails.preventDefault();
      const details = isFormEvent ? (() => {
        const form = new FormData(eventOrDetails.currentTarget);
        return {
          ...Object.fromEntries(form),
          recordPayment: true
        };
      })() : eventOrDetails;
      return act(
        "/admin/members",
        {
          method: "POST",
          body: JSON.stringify(details)
        },
        "Member account created.",
        (result2) => {
          if (!result2.member) return;
          setModal({ kind: "credentials", member: result2.member, temporaryPassword: result2.temporaryPassword });
          if (result2.notificationId)
            notify?.(gorillaEvents.memberCreated(result2.member.name, result2.member.id), result2.notificationId);
        }
      );
    };
    const updateMember = (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      act(
        `/admin/members/${modal.member.id}`,
        { method: "PATCH", body: JSON.stringify(Object.fromEntries(form)) },
        "Member updated."
      );
    };
    const recordPayment = (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      act(
        "/admin/payments",
        { method: "POST", body: JSON.stringify(Object.fromEntries(form)) },
        "Payment recorded."
      );
    };
    const settings = (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      act(
        "/admin/settings",
        {
          method: "PATCH",
          body: JSON.stringify({
            gym: form.get("gym"),
            remind: Number(form.get("remind")),
            ...mobile && { emailOn: form.has("emailOn") }
          })
        },
        "Preferences saved."
      );
    };
    const profile = (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      act(
        "/profile",
        { method: "PATCH", body: JSON.stringify(Object.fromEntries(form)) },
        "Profile saved."
      );
    };
    const content = {
      Dashboard: /* @__PURE__ */ (0, import_jsx_runtime58.jsx)(
        AdminDashboardSection,
        {
          currentUser,
          setModal,
          setSection,
          members,
          active,
          data,
          today,
          money,
          revenue,
          loading,
          expiredMembers,
          renewals,
          reminderList,
          date: formatDate
        }
      ),
      Members: /* @__PURE__ */ (0, import_jsx_runtime58.jsx)(
        AdminMembersSection,
        {
          query: query2,
          setQuery,
          currentUser,
          setModal,
          members,
          pending,
          date: formatDate
        }
      ),
      Equipment: /* @__PURE__ */ (0, import_jsx_runtime58.jsx)(
        AdminEquipmentSection,
        {
          data,
          loading,
          pending,
          act,
          setModal,
          canDeleteHistory,
          setDeletion,
          date: formatDate
        }
      ),
      Attendance: /* @__PURE__ */ (0, import_jsx_runtime58.jsx)(
        AdminAttendanceSection,
        {
          data,
          members,
          loading,
          pending,
          canDeleteHistory,
          setDeletion,
          scanQr,
          section,
          dateTime: formatDateTime
        }
      ),
      Payments: /* @__PURE__ */ (0, import_jsx_runtime58.jsx)(
        AdminPaymentsSection,
        {
          data,
          loading,
          pending,
          canDeleteHistory,
          setModal,
          setDeletion,
          money,
          date: formatDate
        }
      ),
      Notifications: /* @__PURE__ */ (0, import_jsx_runtime58.jsx)(
        AdminNotifications,
        {
          state: data.notificationState,
          canManage: canDeleteHistory,
          busy: pending || loading,
          onDelete: setDeletion,
          onReview: () => setSection("Equipment")
        }
      ),
      Reports: /* @__PURE__ */ (0, import_jsx_runtime58.jsx)(
        AdminReports,
        {
          data,
          onChanged: load,
          onMemberAction: (kind, member2) => setModal({ kind, member: member2 })
        }
      ),
      Settings: /* @__PURE__ */ (0, import_jsx_runtime58.jsx)(
        AdminSettingsSection,
        {
          currentUser,
          setCurrentUser,
          profile,
          pending,
          loading,
          settings,
          data
        }
      )
    }[section];
    const mobileViews = mobile ? {
      Dashboard: /* @__PURE__ */ (0, import_jsx_runtime58.jsx)(
        MobileOverview,
        {
          stats: [
            ["Active members", active, "users"],
            ["Expiring soon", expiring.length, "bell"],
            ["Check-ins today", data.attendance.filter(onManilaDay).length, "qr"],
            ["Revenue today", money(data.payments.filter(onManilaDay).reduce((sum, item) => sum + Number(item.amount || 0), 0)), "wallet"]
          ],
          summary: currentUser?.role === "admin" ? /* @__PURE__ */ (0, import_jsx_runtime58.jsx)(AdminAnalytics, { refreshKey: data }) : null,
          expiring,
          date: formatDate,
          onMember: showMember,
          loading,
          rows: activity,
          onExpiring: () => {
            setOnlyExpiring(true);
            setQuery("");
            setSection("Members");
          },
          onActivities: () => setSection("Activities")
        }
      ),
      Members: /* @__PURE__ */ (0, import_jsx_runtime58.jsx)(
        MobileMembers,
        {
          members,
          expiring,
          date: formatDate,
          query: query2,
          setQuery,
          onMember: showMember,
          filter: onlyExpiring,
          setFilter: setOnlyExpiring,
          loading
        }
      ),
      Activities: /* @__PURE__ */ (0, import_jsx_runtime58.jsx)(MobileActivities, { rows: activity, loading, select: selectSection, reminderError: reminderActivity.error })
    } : {};
    const dialogs = /* @__PURE__ */ (0, import_jsx_runtime58.jsx)(
      AdminStaffDialogs,
      {
        modal,
        setModal,
        currentUser,
        pending,
        error,
        fieldError,
        deletion,
        setDeletion,
        load,
        setNotice,
        renewals,
        money,
        date: formatDate,
        members,
        data,
        planOptionLabel,
        act,
        createMember,
        token,
        updateMember,
        recordPayment
      }
    );
    return /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)(
      DashboardShell,
      {
        className: "admin-app",
        role: currentUser?.role || "admin",
        user: currentUser,
        onSignOut,
        activeSection: section,
        onSectionChange: selectSection,
        onMemberAlert: showMemberAlert,
        onCreateMember: () => {
          setError("");
          setFieldError(null);
          setModal({ kind: "create" });
        },
        content,
        mobileViews,
        dialogs,
        notificationCount: loading ? 0 : data.notificationState.notifications.length,
        loading,
        children: [
          loading && /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("p", { className: "dashboard-feedback", role: "status", children: "Loading gym records..." }),
          error && /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)("p", { className: "dashboard-feedback is-error", role: "alert", children: [
            error,
            /* @__PURE__ */ (0, import_jsx_runtime58.jsx)(
              "button",
              {
                type: "button",
                onClick: () => {
                  setLoading(true);
                  load();
                },
                children: "Retry"
              }
            )
          ] }),
          notice && /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)("div", { className: "dashboard-feedback", role: "status", children: [
            notice,
            /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("button", { type: "button", "aria-label": "Dismiss message", onClick: () => setNotice(""), children: "\xD7" })
          ] })
        ]
      }
    );
  }
  var import_react40, import_jsx_runtime58, money, planOptionLabel;
  var init_AdminStaffPage2 = __esm({
    "src/pages/AdminStaffPage.jsx"() {
      init_define_import_meta_env();
      init_AdminDashboardSection();
      init_AdminAnalytics();
      init_AdminMembersSection();
      init_AdminEquipmentSection();
      init_AdminAttendanceSection();
      init_AdminPaymentsSection();
      init_AdminSettingsSection();
      import_react40 = __toESM(require_react(), 1);
      init_DashboardShell2();
      init_AuthContext();
      init_api();
      init_FitnessSculpture();
      init_AdminReports();
      init_AdminNotifications();
      init_membership();
      init_AdminStaffDialogs();
      init_GorillaAssistant();
      init_MobileScreens();
      init_activity();
      init_useIsMobile();
      init_formatDate();
      init_AdminStaffPage();
      import_jsx_runtime58 = __toESM(require_jsx_runtime(), 1);
      money = (value) => new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(Number(value || 0));
      planOptionLabel = (plan) => {
        const studentRate = /student/i.test(plan.plan_name) && !/non[-\s]?student/i.test(plan.plan_name);
        return `${plan.plan_name} - ${money(plan.price)}${studentRate ? " (student discount)" : ""}`;
      };
    }
  });

  // src/pages/UserPage.css
  var init_UserPage = __esm({
    "src/pages/UserPage.css"() {
    }
  });

  // src/utils/memberQr.js
  function cacheKey(member2) {
    return `fitpulse-member-qr:${member2?.id || ""}`;
  }
  function membershipPeriod(member2) {
    const start = member2?.membershipStart || member2?.joined || "";
    const end = member2?.membershipEnd || "";
    return `${member2?.status || ""}|${start}|${end}`;
  }
  function readCachedMemberQr(member2) {
    if (!member2?.id) return null;
    try {
      const key = cacheKey(member2);
      const cached = JSON.parse(localStorage.getItem(key) || "null");
      if (cached?.period === membershipPeriod(member2) && typeof cached.image === "string" && Number(cached.expiresAt) > Date.now()) {
        return { image: cached.image, expiresAt: Number(cached.expiresAt) };
      }
      if (cached) localStorage.removeItem(key);
    } catch {
    }
    return null;
  }
  function getMemberQr(member2, token) {
    const key = cacheKey(member2);
    const period = membershipPeriod(member2);
    const cached = readCachedMemberQr(member2);
    if (cached) return Promise.resolve(cached);
    const requestKey = `${key}:${period}`;
    if (inFlight.has(requestKey)) return inFlight.get(requestKey);
    const request = apiRequest("/me/qr", { token }).then((result2) => {
      if (result2?.image && Number(result2.expiresAt) > Date.now()) {
        try {
          localStorage.setItem(
            key,
            JSON.stringify({
              period,
              image: result2.image,
              expiresAt: Number(result2.expiresAt)
            })
          );
        } catch {
        }
      }
      return result2;
    }).finally(() => inFlight.delete(requestKey));
    inFlight.set(requestKey, request);
    return request;
  }
  var inFlight;
  var init_memberQr = __esm({
    "src/utils/memberQr.js"() {
      init_define_import_meta_env();
      init_api();
      inFlight = /* @__PURE__ */ new Map();
    }
  });

  // src/components/MemberQr.jsx
  function MemberQr({ member: member2, viewOnly = false }) {
    const { token } = useAuth();
    const [qr, setQr] = (0, import_react41.useState)(() => readCachedMemberQr(member2));
    const [pending, setPending] = (0, import_react41.useState)(false);
    const [error, setError] = (0, import_react41.useState)("");
    const [expiredCode, setExpiredCode] = (0, import_react41.useState)(null);
    const qrImageRef = (0, import_react41.useRef)(null);
    (0, import_react41.useEffect)(() => {
      let active = true;
      const cached = readCachedMemberQr(member2);
      setQr(cached);
      setError("");
      if (cached) {
        setPending(false);
        return () => {
          active = false;
        };
      }
      setPending(true);
      getMemberQr(member2, token).then((result2) => {
        if (active) setQr(result2);
      }).catch((cause) => {
        if (active) setError(cause.message);
      }).finally(() => {
        if (active) setPending(false);
      });
      return () => {
        active = false;
      };
    }, [token, member2?.id, member2?.membershipStart, member2?.membershipEnd, member2?.joined, member2?.status]);
    (0, import_react41.useEffect)(() => {
      if (!qr?.expiresAt) return;
      let timer;
      const expire = () => {
        const remaining = qr.expiresAt - Date.now();
        if (remaining <= 0) setExpiredCode(qr);
        else timer = window.setTimeout(expire, Math.min(remaining, 2147483647));
      };
      expire();
      return () => window.clearTimeout(timer);
    }, [qr]);
    const daysLeft = qr ? Math.max(0, Math.ceil((qr.expiresAt - Date.now()) / 864e5)) : 0;
    const expiryDate = formatDate(qr?.expiresAt, "");
    const downloadQrCard = () => {
      if (!qr) return;
      const canvas = document.createElement("canvas");
      canvas.width = 720;
      canvas.height = 1050;
      const context = canvas.getContext("2d");
      if (!context) return;
      const roundedRect = (x, y, width, height, radius, color) => {
        context.beginPath();
        context.roundRect(x, y, width, height, radius);
        context.fillStyle = color;
        context.fill();
      };
      const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, "#003049");
      gradient.addColorStop(0.67, "#0d2b3e");
      gradient.addColorStop(1, "#f77f00");
      roundedRect(0, 0, canvas.width, canvas.height, 28, gradient);
      context.textAlign = "center";
      context.fillStyle = "#fcbf49";
      context.font = '850 76px "Fredoka", "Baloo 2", Arial, sans-serif';
      context.fillText("FITPULSE", canvas.width / 2, 120);
      context.fillStyle = "rgba(255,255,255,0.9)";
      context.font = "800 20px Arial, sans-serif";
      context.letterSpacing = "4px";
      context.fillText("MEMBER CHECK-IN", canvas.width / 2, 157);
      context.letterSpacing = "0px";
      roundedRect(80, 248, 560, 794, 36, "#ffffff");
      roundedRect(226, 274, 268, 42, 21, "#e7edf7");
      context.fillStyle = "#003049";
      context.font = "800 18px Arial, sans-serif";
      context.fillText("MEMBER CHECK-IN PASS", canvas.width / 2, 301);
      context.fillStyle = "#0d2b3e";
      context.font = "600 26px Arial, sans-serif";
      context.fillText(member2?.name || "FitPulse member", canvas.width / 2, 370, 510);
      const qrImage = qrImageRef.current;
      if (!qrImage?.complete || !qrImage.naturalWidth) {
        setError("Please wait for the QR code to finish loading, then download it.");
        return;
      }
      context.drawImage(qrImage, 160, 436, 400, 400);
      context.fillStyle = "#003049";
      context.font = "500 18px Arial, sans-serif";
      context.fillText(`Expires ${expiryDate} - ${daysLeft} ${daysLeft === 1 ? "day" : "days"} left`, canvas.width / 2, 907);
      context.shadowColor = "rgba(35, 28, 70, 0.24)";
      context.shadowBlur = 12;
      context.shadowOffsetY = 5;
      const buttonGradient = context.createLinearGradient(218, 934, 502, 1010);
      buttonGradient.addColorStop(0, "#f77f00");
      buttonGradient.addColorStop(1, "#d62828");
      roundedRect(218, 934, 284, 76, 38, buttonGradient);
      context.shadowColor = "transparent";
      context.shadowBlur = 0;
      context.shadowOffsetY = 0;
      context.fillStyle = "#ffffff";
      context.font = "700 20px Arial, sans-serif";
      context.fillText("Download QR code", canvas.width / 2, 982);
      const link = document.createElement("a");
      link.download = "fitpulse-membership-qr.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    return /* @__PURE__ */ (0, import_jsx_runtime59.jsxs)("div", { className: "member-qr-content", children: [
      qr && qr !== expiredCode && daysLeft > 0 ? /* @__PURE__ */ (0, import_jsx_runtime59.jsxs)("section", { className: "member-qr-card", "aria-label": "FitPulse member pass", children: [
        /* @__PURE__ */ (0, import_jsx_runtime59.jsxs)("header", { className: "member-qr-card-header", children: [
          /* @__PURE__ */ (0, import_jsx_runtime59.jsx)("strong", { children: "FITPULSE" }),
          /* @__PURE__ */ (0, import_jsx_runtime59.jsx)("span", { children: "MEMBER CHECK-IN" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime59.jsxs)("div", { className: "member-qr-card-panel", children: [
          /* @__PURE__ */ (0, import_jsx_runtime59.jsx)("span", { className: "member-qr-card-tag", children: "MEMBER CHECK-IN PASS" }),
          /* @__PURE__ */ (0, import_jsx_runtime59.jsx)("strong", { className: "member-qr-card-name", children: member2?.name || "FitPulse member" }),
          /* @__PURE__ */ (0, import_jsx_runtime59.jsx)(
            "img",
            {
              ref: qrImageRef,
              className: "member-qr-image",
              src: qr.image,
              alt: "Your FitPulse membership QR code"
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime59.jsxs)("p", { className: "member-qr-card-expiry", children: [
            "Expires ",
            expiryDate,
            " - ",
            daysLeft,
            " ",
            daysLeft === 1 ? "day" : "days",
            " left"
          ] }),
          !viewOnly && /* @__PURE__ */ (0, import_jsx_runtime59.jsx)("button", { className: "btn", type: "button", onClick: downloadQrCard, children: "Download QR code" })
        ] })
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime59.jsx)("p", { children: qr ? "This code expired. Renew your membership to get a new code." : pending ? "Loading your member QR code..." : "Your QR code is unavailable." }),
      error && /* @__PURE__ */ (0, import_jsx_runtime59.jsx)("p", { className: "photo-error", role: "alert", children: error }),
      /* @__PURE__ */ (0, import_jsx_runtime59.jsx)("p", { className: "member-caption", children: "Show this code at check-in during your membership." })
    ] });
  }
  var import_react41, import_jsx_runtime59;
  var init_MemberQr = __esm({
    "src/components/MemberQr.jsx"() {
      init_define_import_meta_env();
      import_react41 = __toESM(require_react(), 1);
      init_AuthContext();
      init_memberQr();
      init_formatDate();
      import_jsx_runtime59 = __toESM(require_jsx_runtime(), 1);
    }
  });

  // src/pages/UserPage.jsx
  var UserPage_exports = {};
  __export(UserPage_exports, {
    default: () => UserPage
  });
  function StatCard2({ label, value, hint, icon }) {
    return /* @__PURE__ */ (0, import_jsx_runtime60.jsxs)("article", { className: "stat clay", children: [
      /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("span", { className: "member-stat-icon", children: /* @__PURE__ */ (0, import_jsx_runtime60.jsx)(Icon2, { name: icon, size: 23 }) }),
      /* @__PURE__ */ (0, import_jsx_runtime60.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("small", { children: label }),
        /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("b", { children: value }),
        hint && /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("p", { children: hint })
      ] })
    ] });
  }
  function UserPage({ user: user2, onSignOut }) {
    const { token } = useAuth();
    const { latestEvent } = useGorilla() || {};
    const mobile = useIsMobile();
    const [section, setSection] = (0, import_react42.useState)("Dashboard");
    const [notificationsRead, setNotificationsRead] = (0, import_react42.useState)(false);
    const [attendance2, setAttendance] = (0, import_react42.useState)([]);
    const [payments2, setPayments] = (0, import_react42.useState)([]);
    const [currentUser, setCurrentUser] = (0, import_react42.useState)(user2);
    const [error, setError] = (0, import_react42.useState)("");
    const [notice, setNotice] = (0, import_react42.useState)("");
    const [loading, setLoading] = (0, import_react42.useState)(true);
    const [actionPending, setActionPending] = (0, import_react42.useState)(false);
    const reminderActivity = useReminderActivity(token, mobile, latestEvent);
    const load = (0, import_react42.useCallback)(
      async (signal) => {
        try {
          const [profile, attendanceResult, paymentResult] = await Promise.all([
            apiRequest("/me", { token, signal }),
            apiRequest("/attendance", { token, signal }),
            apiRequest("/payments", { token, signal })
          ]);
          if (signal?.aborted) return;
          setCurrentUser(profile.user);
          setAttendance(latestFirst(attendanceResult.attendance));
          setPayments(latestFirst(paymentResult.payments));
          setError("");
        } catch (cause) {
          if (!signal?.aborted) setError(cause.message);
        } finally {
          if (!signal?.aborted) setLoading(false);
        }
      },
      [token]
    );
    const refreshAttendance = (0, import_react42.useCallback)(
      async (signal) => {
        try {
          const result2 = await apiRequest("/attendance", { token, signal });
          if (!signal?.aborted) setAttendance(latestFirst(result2.attendance));
        } catch (cause) {
          if (!signal?.aborted) setError(cause.message);
        }
      },
      [token]
    );
    (0, import_react42.useEffect)(() => {
      const controller = new AbortController();
      load(controller.signal);
      return () => controller.abort();
    }, [load, latestEvent]);
    const selectSection = (0, import_react42.useCallback)((nextSection) => {
      if (nextSection === "Notifications") setNotificationsRead(true);
      setSection(nextSection);
    }, []);
    (0, import_react42.useEffect)(() => {
      const controller = new AbortController();
      if (!["Dashboard", "Attendance"].includes(section)) return () => controller.abort();
      const refresh = () => {
        if (document.visibilityState === "visible") refreshAttendance(controller.signal);
      };
      const timer = window.setInterval(refresh, 5e3);
      window.addEventListener("focus", refresh);
      return () => {
        window.clearInterval(timer);
        window.removeEventListener("focus", refresh);
        controller.abort();
      };
    }, [section, refreshAttendance]);
    const action = async (path, options, message) => {
      if (actionPending) return false;
      setActionPending(true);
      setNotice("");
      setError("");
      try {
        const result2 = await apiRequest(path, { token, ...options });
        if (path === "/profile" && result2?.user) {
          setCurrentUser(result2.user);
        }
        setNotice(message);
        await load();
        return true;
      } catch (cause) {
        setError(cause.message);
        return false;
      } finally {
        setActionPending(false);
      }
    };
    const membership = membershipState(currentUser);
    const expiry = membership.daysLeft;
    const expired = membership.status === "expired";
    const status = membership.label;
    const membershipNote = expired ? "Your membership has expired. Visit the front desk to renew." : membership.status !== "active" && membership.status !== "incomplete" ? "Your membership is not currently active. Please contact the front desk." : expiry === null ? "Your expiry date has not been set. Ask the front desk to confirm it." : expiry <= 7 ? `Your membership expires in ${expiry} day(s). Visit the front desk to renew.` : `Your membership is valid until ${date2(currentUser.membershipEnd)}.`;
    const notifications = currentUser ? [{ id: "membership", message: membershipNote }] : [];
    const unreadNotificationCount = notificationsRead ? 0 : notifications.length;
    const settings = /* @__PURE__ */ (0, import_jsx_runtime60.jsxs)("section", { className: "grid g2 settings-cards", children: [
      /* @__PURE__ */ (0, import_jsx_runtime60.jsxs)("article", { className: "card clay", children: [
        /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("h2", { children: "Profile" }),
        /* @__PURE__ */ (0, import_jsx_runtime60.jsx)(ProfilePhoto, { user: currentUser, onSaved: setCurrentUser }),
        /* @__PURE__ */ (0, import_jsx_runtime60.jsxs)(
          "form",
          {
            className: "mf",
            onSubmit: (event) => {
              event.preventDefault();
              action(
                "/profile",
                {
                  method: "PATCH",
                  body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget)))
                },
                "Profile saved."
              );
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime60.jsxs)("label", { className: "field", children: [
                "Full name",
                /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("input", { className: "clay-in", name: "name", defaultValue: currentUser?.name, required: true })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime60.jsxs)("label", { className: "field", children: [
                "Email",
                /* @__PURE__ */ (0, import_jsx_runtime60.jsx)(
                  "input",
                  {
                    className: "clay-in",
                    name: "email",
                    defaultValue: currentUser?.email,
                    type: "email",
                    required: true
                  }
                )
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime60.jsxs)("label", { className: "field", children: [
                "Contact number",
                /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("input", { className: "clay-in", name: "phone", defaultValue: currentUser?.phone || "" })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("button", { className: "btn", disabled: actionPending || loading, children: actionPending ? "Saving..." : "Save profile" })
            ]
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime60.jsxs)("article", { className: "card clay", children: [
        /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("h2", { children: "Change Password" }),
        /* @__PURE__ */ (0, import_jsx_runtime60.jsx)(PasswordChangeForm, {})
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime60.jsx)(RockyPreference, {}),
      /* @__PURE__ */ (0, import_jsx_runtime60.jsx)(PrivacyPolicy, {})
    ] });
    const membershipDetails = /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("section", { className: "grid member-overview", children: /* @__PURE__ */ (0, import_jsx_runtime60.jsxs)("article", { className: "card clay", children: [
      /* @__PURE__ */ (0, import_jsx_runtime60.jsxs)("div", { className: "illustrated-heading", children: [
        /* @__PURE__ */ (0, import_jsx_runtime60.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("h2", { children: "My membership" }),
          /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("p", { children: "Your plan, expiry date, and gym access." }),
          /* @__PURE__ */ (0, import_jsx_runtime60.jsx)(
            "span",
            {
              className: `member-status ${expired ? "is-expired" : status === "Active" ? "is-active" : ""}`,
              children: status
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime60.jsx)(FitnessSculpture, {})
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime60.jsxs)("dl", { className: "member-details", children: [
        /* @__PURE__ */ (0, import_jsx_runtime60.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("dt", { children: "Member ID" }),
          /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("dd", { className: "member-id", children: currentUser?.memberCode || currentUser?.id || "Unavailable" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime60.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("dt", { children: "Plan" }),
          /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("dd", { children: currentUser?.plan || "Not set" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime60.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("dt", { children: "Start date" }),
          /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("dd", { children: date2(currentUser?.membershipStart || currentUser?.joined) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime60.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("dt", { children: "Expiry date" }),
          /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("dd", { children: date2(currentUser?.membershipEnd) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime60.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("dt", { children: "Contact number" }),
          /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("dd", { children: currentUser?.phone || "Not added" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime60.jsxs)("p", { className: "member-note", children: [
        /* @__PURE__ */ (0, import_jsx_runtime60.jsx)(Icon2, { name: "bell", size: 18 }),
        membershipNote
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime60.jsx)(
        "button",
        {
          className: "member-text-button",
          type: "button",
          onClick: () => setSection("Settings"),
          children: "Update profile \u2192"
        }
      )
    ] }) });
    const views = {
      Dashboard: /* @__PURE__ */ (0, import_jsx_runtime60.jsxs)(import_jsx_runtime60.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("section", { className: "card clay dashboard-welcome member-welcome dashboard-overview", children: /* @__PURE__ */ (0, import_jsx_runtime60.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("span", { className: "dashboard-eyebrow", children: "A LITTLE STRONGER, EVERY DAY" }),
          /* @__PURE__ */ (0, import_jsx_runtime60.jsxs)("h2", { children: [
            "Good to see you, ",
            currentUser?.name?.split(" ")[0] || "member",
            "."
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("p", { children: "Your next great session is waiting. Let\u2019s make it count." }),
          /* @__PURE__ */ (0, import_jsx_runtime60.jsxs)("div", { className: "dashboard-quick-actions", children: [
            /* @__PURE__ */ (0, import_jsx_runtime60.jsxs)("button", { className: "btn", type: "button", onClick: () => setSection("My QR"), children: [
              /* @__PURE__ */ (0, import_jsx_runtime60.jsx)(Icon2, { name: "qr", size: 16 }),
              "Open my gym pass"
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("button", { className: "btn ghost", type: "button", onClick: () => setSection("Attendance"), children: "View my visits" })
          ] })
        ] }) }),
        /* @__PURE__ */ (0, import_jsx_runtime60.jsxs)("section", { className: "grid member-stats", "aria-label": "Membership overview", children: [
          /* @__PURE__ */ (0, import_jsx_runtime60.jsx)(
            StatCard2,
            {
              label: "Membership",
              value: currentUser?.plan || "Not set",
              icon: "card"
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime60.jsx)(
            StatCard2,
            {
              label: "Status",
              value: status,
              hint: expired ? "Renew at the front desk" : null,
              icon: "bell"
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime60.jsx)(
            StatCard2,
            {
              label: "Days remaining",
              value: expiry ?? "Not set",
              hint: expiry === null ? "Expiry date not recorded" : `Expires ${date2(currentUser.membershipEnd)}`,
              icon: "chart"
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime60.jsx)(
            StatCard2,
            {
              label: "Total check-ins",
              value: loading ? "Loading..." : attendance2.length,
              icon: "dumbbell"
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime60.jsx)(ActivityChart, { attendance: attendance2, loading }),
        membershipDetails
      ] }),
      "My QR": /* @__PURE__ */ (0, import_jsx_runtime60.jsxs)("article", { className: "card clay member-qr-page", children: [
        /* @__PURE__ */ (0, import_jsx_runtime60.jsxs)("div", { className: "member-card-heading", children: [
          /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("h2", { children: "QR check-in" }),
          /* @__PURE__ */ (0, import_jsx_runtime60.jsx)(Icon2, { name: "qr" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime60.jsx)(MemberQr, { member: currentUser }),
        /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("dl", { className: "member-details", children: /* @__PURE__ */ (0, import_jsx_runtime60.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("dt", { children: "Member ID" }),
          /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("dd", { className: "member-id", children: currentUser?.memberCode || currentUser?.id || "Unavailable" })
        ] }) })
      ] }),
      Attendance: /* @__PURE__ */ (0, import_jsx_runtime60.jsxs)("article", { className: "card clay", children: [
        /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("h2", { children: "My Attendance History" }),
        /* @__PURE__ */ (0, import_jsx_runtime60.jsx)(DataTable, { headings: ["Date & Time", "Recorded by"], empty: !attendance2.length, children: attendance2.map((item) => /* @__PURE__ */ (0, import_jsx_runtime60.jsxs)("tr", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("td", { "data-label": "Date & Time", children: time(item.date) }),
          /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("td", { children: item.source || "Staff" })
        ] }, item.id)) })
      ] }),
      Payments: /* @__PURE__ */ (0, import_jsx_runtime60.jsxs)("article", { className: "card clay", children: [
        /* @__PURE__ */ (0, import_jsx_runtime60.jsxs)("div", { className: "illustrated-heading", children: [
          /* @__PURE__ */ (0, import_jsx_runtime60.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("h2", { children: "My Payment History" }),
            /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("p", { children: "Cash, GCash, and membership renewal records." })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime60.jsx)(FitnessSculpture, {})
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime60.jsxs)("div", { className: "payment-actions", children: [
          /* @__PURE__ */ (0, import_jsx_runtime60.jsx)(
            "button",
            {
              className: "btn",
              type: "button",
              disabled: loading || !payments2.length,
              onClick: () => downloadPayments(payments2),
              children: "Export CSV"
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("small", { children: "Exports all your payment records." })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime60.jsx)(
          DataTable,
          {
            headings: ["Payment", "Plan", "Amount", "Method", "Date"],
            empty: !payments2.length,
            children: payments2.map((item) => /* @__PURE__ */ (0, import_jsx_runtime60.jsxs)("tr", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("td", { "data-label": "Payment", children: item.type || "Membership" }),
              /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("td", { "data-label": "Plan", children: item.plan || "Not recorded" }),
              /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("td", { "data-label": "Amount", children: money2(item.amount) }),
              /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("td", { "data-label": "Method", children: item.method || "Not recorded" }),
              /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("td", { "data-label": "Date", children: date2(item.date) })
            ] }, item.id))
          }
        )
      ] }),
      Notifications: /* @__PURE__ */ (0, import_jsx_runtime60.jsxs)("article", { className: "card clay", children: [
        /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("h2", { children: "Notifications" }),
        notifications.map((notification) => /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("div", { className: "item clay-in", children: notification.message }, notification.id))
      ] }),
      Settings: settings
    };
    const activity = mobile ? activityRows({ attendance: attendance2, payments: payments2, reminders: reminderActivity.reminders, money: money2 }) : [];
    const mobileViews = mobile ? {
      Dashboard: /* @__PURE__ */ (0, import_jsx_runtime60.jsx)(MobileOverview, { stats: [
        ["Membership", currentUser?.plan || "Not set", "card"],
        ["Status", status, "bell"],
        ["Days remaining", expiry ?? "\u2014", "chart"],
        ["Total check-ins", attendance2.length, "qr"]
      ], rows: activity, onActivities: () => selectSection("Activities"), loading }),
      Membership: membershipDetails,
      Activities: /* @__PURE__ */ (0, import_jsx_runtime60.jsx)(MobileActivities, { rows: activity, loading, select: selectSection, reminderError: reminderActivity.error })
    } : {};
    return /* @__PURE__ */ (0, import_jsx_runtime60.jsxs)(
      DashboardShell,
      {
        profileLoading: loading,
        className: "member-app",
        role: currentUser?.role || "user",
        user: currentUser,
        onSignOut,
        activeSection: section,
        onSectionChange: selectSection,
        content: views[section],
        mobileViews,
        mobileQr: /* @__PURE__ */ (0, import_jsx_runtime60.jsx)(MemberQr, { member: currentUser, viewOnly: true }),
        notificationCount: loading ? 0 : unreadNotificationCount,
        loading,
        children: [
          loading && /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("p", { className: "member-feedback", role: "status", children: /* @__PURE__ */ (0, import_jsx_runtime60.jsxs)("span", { className: "loading-inline", children: [
            /* @__PURE__ */ (0, import_jsx_runtime60.jsx)(Spinner, {}),
            " Loading your membership\u2026"
          ] }) }),
          error && /* @__PURE__ */ (0, import_jsx_runtime60.jsxs)("p", { className: "member-feedback is-error", role: "alert", children: [
            error,
            /* @__PURE__ */ (0, import_jsx_runtime60.jsx)(
              "button",
              {
                type: "button",
                onClick: () => {
                  setLoading(true);
                  load();
                },
                children: "Retry"
              }
            )
          ] }),
          notice && /* @__PURE__ */ (0, import_jsx_runtime60.jsxs)("div", { className: "member-feedback", role: "status", children: [
            notice,
            /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("button", { type: "button", "aria-label": "Dismiss message", onClick: () => setNotice(""), children: "\xD7" })
          ] })
        ]
      }
    );
  }
  var import_react42, import_jsx_runtime60, date2, time, money2, latestFirst;
  var init_UserPage2 = __esm({
    "src/pages/UserPage.jsx"() {
      init_define_import_meta_env();
      import_react42 = __toESM(require_react(), 1);
      init_DashboardShell2();
      init_AuthContext();
      init_api();
      init_UserPage();
      init_DataTable();
      init_MemberQr();
      init_ProfilePhoto();
      init_FitnessSculpture();
      init_ActivityChart2();
      init_Spinner();
      init_paymentExport();
      init_PasswordChangeForm();
      init_membership();
      init_GorillaAssistant();
      init_PrivacyPolicy();
      init_MobileScreens();
      init_activity();
      init_useIsMobile();
      init_formatDate();
      import_jsx_runtime60 = __toESM(require_jsx_runtime(), 1);
      date2 = (value) => formatDate(value, "Not set");
      time = (value) => formatDateTime(value, "Date unavailable");
      money2 = (value) => new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(Number(value || 0));
      latestFirst = (items) => [...items].sort((a, b) => new Date(b.date) - new Date(a.date));
    }
  });

  // src/pages/NotFound.jsx
  var NotFound_exports = {};
  __export(NotFound_exports, {
    default: () => NotFound
  });
  function NotFound({ navigate }) {
    return /* @__PURE__ */ (0, import_jsx_runtime61.jsx)("main", { id: "login", children: /* @__PURE__ */ (0, import_jsx_runtime61.jsxs)("section", { className: "clay lform login-not-found", "aria-labelledby": "not-found-title", children: [
      /* @__PURE__ */ (0, import_jsx_runtime61.jsxs)("div", { className: "fhead", children: [
        /* @__PURE__ */ (0, import_jsx_runtime61.jsx)("h1", { id: "not-found-title", children: "Page not found" }),
        /* @__PURE__ */ (0, import_jsx_runtime61.jsx)("p", { children: "Check the address or return to the FitPulse login page." })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime61.jsx)("button", { className: "btn lbtn", type: "button", onClick: () => navigate("login"), children: "Back to login" })
    ] }) });
  }
  var import_jsx_runtime61;
  var init_NotFound = __esm({
    "src/pages/NotFound.jsx"() {
      init_define_import_meta_env();
      init_Login();
      import_jsx_runtime61 = __toESM(require_jsx_runtime(), 1);
    }
  });

  // .taste-skill/fitpulse-review/entry.jsx
  init_define_import_meta_env();
  var import_react44 = __toESM(require_react(), 1);
  var import_client = __toESM(require_client(), 1);
  var import_react_dom = __toESM(require_react_dom(), 1);

  // src/App.jsx
  init_define_import_meta_env();
  var import_react43 = __toESM(require_react(), 1);
  init_AuthContext();

  // src/components/ProtectedRoute.jsx
  init_define_import_meta_env();
  var import_react2 = __toESM(require_react(), 1);
  init_AuthContext();
  function ProtectedRoute({ roles, navigate, children }) {
    const { role, token, memberLoginComplete } = useAuth();
    const allowed = Boolean(token && roles.includes(role) && (role === "admin" || memberLoginComplete));
    (0, import_react2.useEffect)(() => {
      if (!allowed) navigate("login");
    }, [allowed, navigate]);
    return allowed ? children : null;
  }

  // src/pages/Login.jsx
  init_define_import_meta_env();
  var import_react9 = __toESM(require_react(), 1);
  init_useTheme();
  init_Dialog();
  init_Spinner();
  init_HeartRateLoader2();
  init_api();
  init_gorillaEvents();
  init_Login();
  var import_jsx_runtime9 = __toESM(require_jsx_runtime(), 1);
  var MemberTerms2 = (0, import_react9.lazy)(() => Promise.resolve().then(() => (init_MemberTerms(), MemberTerms_exports)));
  var FacialLoginChallenge2 = (0, import_react9.lazy)(() => Promise.resolve().then(() => (init_FacialLoginChallenge(), FacialLoginChallenge_exports)));
  var loginLockAlert = gorillaEvents.loginLocked();
  var ICONS = {
    alert: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(import_jsx_runtime9.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("path", { d: "M12 3 22 21H2L12 3Z" }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("path", { d: "M12 10v5M12 18h.01" })
    ] }),
    eye: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(import_jsx_runtime9.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("path", { d: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("circle", { cx: "12", cy: "12", r: "3" })
    ] }),
    eyeoff: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(import_jsx_runtime9.Fragment, { children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("path", { d: "m3 3 18 18M10.6 6.2A9.7 9.7 0 0 1 12 6c6 0 10 6 10 6a17 17 0 0 1-3.2 3.8M6.3 7.6C3.6 9.3 2 12 2 12s4 6 10 6a9.6 9.6 0 0 0 4-.9M9.9 9.9a3 3 0 0 0 4.2 4.2" }) }),
    fb: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("path", { d: "M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8Z" }),
    ig: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(import_jsx_runtime9.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("rect", { x: "3", y: "3", width: "18", height: "18", rx: "5" }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("circle", { cx: "12", cy: "12", r: "4" }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("path", { d: "M17.5 6.5h.01" })
    ] }),
    lock: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(import_jsx_runtime9.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("rect", { x: "4", y: "11", width: "16", height: "10", rx: "2" }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("path", { d: "M8 11V7a4 4 0 0 1 8 0v4" })
    ] }),
    mail: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(import_jsx_runtime9.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("rect", { x: "2", y: "4", width: "20", height: "16", rx: "3" }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("path", { d: "m2 7 10 7 10-7" })
    ] }),
    qr: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(import_jsx_runtime9.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("rect", { x: "3", y: "3", width: "7", height: "7", rx: "1" }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("rect", { x: "14", y: "3", width: "7", height: "7", rx: "1" }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("rect", { x: "3", y: "14", width: "7", height: "7", rx: "1" }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("path", { d: "M14 14h3v3h-3zM20 14v7h-3" })
    ] }),
    bell: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(import_jsx_runtime9.Fragment, { children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("path", { d: "M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21a2 2 0 0 0 4 0" }) }),
    wallet: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(import_jsx_runtime9.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("rect", { x: "2", y: "6", width: "20", height: "14", rx: "3" }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("path", { d: "M2 10h20" }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("circle", { cx: "17", cy: "15", r: "1.4" })
    ] }),
    moon: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("path", { d: "M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10Z" }),
    sun: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(import_jsx_runtime9.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("circle", { cx: "12", cy: "12", r: "4" }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("path", { d: "M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5" })
    ] })
  };
  function Icon({ name, size = 20 }) {
    return /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
      "svg",
      {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        "aria-hidden": "true",
        children: ICONS[name]
      }
    );
  }
  function Brand() {
    return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(import_jsx_runtime9.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
        "svg",
        {
          width: "46",
          height: "24",
          viewBox: "0 0 88 28",
          fill: "none",
          stroke: "currentColor",
          strokeWidth: "3",
          strokeLinecap: "round",
          strokeLinejoin: "round",
          "aria-hidden": "true",
          children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("path", { d: "M4 7v14M4 14h14l5-9 8 18 7-13 4 4h36M84 7v14M84 14h-6" })
        }
      ),
      "Fit",
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { children: "Pulse" })
    ] });
  }
  function Dumbbell() {
    return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("svg", { className: "dumb", viewBox: "0 0 300 200", "aria-hidden": "true", children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("defs", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("linearGradient", { id: "gO", x1: "0", x2: "1", children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("stop", { offset: "0", stopColor: "#ffb23a" }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("stop", { offset: ".55", stopColor: "#f08a0c" }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("stop", { offset: "1", stopColor: "#d9700a" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("linearGradient", { id: "gR", x1: "0", x2: "1", children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("stop", { offset: "0", stopColor: "#f0525a" }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("stop", { offset: ".55", stopColor: "#d62f37" }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("stop", { offset: "1", stopColor: "#b21f28" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("linearGradient", { id: "gB", x1: "0", x2: "0", y1: "0", y2: "1", children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("stop", { offset: "0", stopColor: "#3c7a9b" }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("stop", { offset: "1", stopColor: "#0a3249" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("filter", { id: "sh", x: "-20%", y: "-20%", width: "150%", height: "170%", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("feDropShadow", { dx: "6", dy: "10", stdDeviation: "7", floodColor: "#0d2b3e", floodOpacity: ".3" }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("g", { filter: "url(#sh)", transform: "rotate(-7 150 100)", children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("rect", { x: "82", y: "93", width: "136", height: "15", rx: "7.5", fill: "url(#gB)" }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("rect", { x: "18", y: "56", width: "30", height: "92", rx: "15", fill: "url(#gO)" }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("rect", { x: "54", y: "46", width: "32", height: "108", rx: "16", fill: "url(#gR)" }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("rect", { x: "214", y: "46", width: "32", height: "108", rx: "16", fill: "url(#gR)" }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("rect", { x: "252", y: "56", width: "30", height: "92", rx: "15", fill: "url(#gO)" }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("g", { fill: "#fff", opacity: ".28", children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("rect", { x: "24", y: "68", width: "5", height: "60", rx: "2.5" }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("rect", { x: "60", y: "58", width: "5", height: "82", rx: "2.5" }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("rect", { x: "220", y: "58", width: "5", height: "82", rx: "2.5" }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("rect", { x: "258", y: "68", width: "5", height: "60", rx: "2.5" })
        ] })
      ] })
    ] });
  }
  function Login({ onLogin, navigate, initialRecoveryOpen = false }) {
    const [email, setEmail] = (0, import_react9.useState)(() => localStorage.getItem("fp_email") || "");
    const [password, setPassword] = (0, import_react9.useState)("");
    const [remember, setRemember] = (0, import_react9.useState)(() => Boolean(localStorage.getItem("fp_email")));
    const [showPassword, setShowPassword] = (0, import_react9.useState)(false);
    const [capsLock, setCapsLock] = (0, import_react9.useState)(false);
    const [pending, setPending] = (0, import_react9.useState)(false);
    const [lockedAccount, setLockedAccount] = (0, import_react9.useState)(null);
    const [showLockAlert, setShowLockAlert] = (0, import_react9.useState)(false);
    const loginLocked = lockedAccount?.email === email.trim().toLowerCase();
    const [shaking, setShaking] = (0, import_react9.useState)(false);
    const [errors, setErrors] = (0, import_react9.useState)({ email: "", password: "", general: "" });
    const [resetOpen, setResetOpen] = (0, import_react9.useState)(initialRecoveryOpen);
    const [resetEmail, setResetEmail] = (0, import_react9.useState)("");
    const [resetPending, setResetPending] = (0, import_react9.useState)(false);
    const [resetError, setResetError] = (0, import_react9.useState)("");
    const [resetMessage, setResetMessage] = (0, import_react9.useState)("");
    const [termsTicket, setTermsTicket] = (0, import_react9.useState)("");
    const [faceChallenge, setFaceChallenge] = (0, import_react9.useState)("");
    const { dark, toggle: toggleTheme } = useTheme();
    const emailRef = (0, import_react9.useRef)(null);
    const passwordRef = (0, import_react9.useRef)(null);
    const submissionLock = (0, import_react9.useRef)(false);
    (0, import_react9.useEffect)(() => {
      if (!lockedAccount) return;
      const timer = window.setTimeout(() => setLockedAccount(null), lockedAccount.retryAfterSeconds * 1e3);
      return () => window.clearTimeout(timer);
    }, [lockedAccount]);
    const clearErrors = () => setErrors({ email: "", password: "", general: "" });
    const finishLogin = (session) => {
      if (remember) localStorage.setItem("fp_email", session.user.email.trim().toLowerCase());
      else localStorage.removeItem("fp_email");
      onLogin(session);
    };
    const submit = async (event) => {
      event.preventDefault();
      if (submissionLock.current || loginLocked) return;
      const form = new FormData(event.currentTarget);
      const normalizedEmail = String(form.get("email") || "").trim().toLowerCase();
      const submittedPassword = String(form.get("password") || "");
      const nextErrors = {
        email: /^\S+@\S+\.\S+$/.test(normalizedEmail) ? "" : "Enter a valid email address",
        password: submittedPassword ? "" : "Enter your password",
        general: ""
      };
      setErrors(nextErrors);
      if (nextErrors.email || nextErrors.password) return;
      setEmail(normalizedEmail);
      setPassword(submittedPassword);
      submissionLock.current = true;
      setPending(true);
      try {
        const session = await apiRequest("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email: normalizedEmail, password: submittedPassword })
        });
        if (session.requiresTerms === true && session.termsTicket) {
          setTermsTicket(session.termsTicket);
        } else if (session.token && session.user) finishLogin(session);
        else throw new Error("Unable to start sign-in. Please try again.");
        setPassword("");
        setShaking(false);
      } catch (error) {
        setShowPassword(false);
        if (error.code === "LOGIN_LOCKED") {
          setLockedAccount({ email: normalizedEmail, retryAfterSeconds: error.retryAfterSeconds || 900 });
          setPassword("");
          setShaking(false);
          setErrors({ email: "", password: "", general: loginLockAlert.message });
          setShowLockAlert(true);
          return;
        }
        setErrors({
          email: "",
          password: "",
          general: error.message || "We could not log you in. Please try again."
        });
        setShaking(true);
        window.requestAnimationFrame(() => passwordRef.current?.focus());
      } finally {
        submissionLock.current = false;
        setPending(false);
      }
    };
    const sendReset = async (event) => {
      event.preventDefault();
      if (resetPending || resetMessage) return;
      if (!/^\S+@\S+\.\S+$/.test(resetEmail.trim())) {
        setResetError("Enter a valid email address");
        return;
      }
      setResetError("");
      setResetPending(true);
      try {
        const result2 = await apiRequest("/auth/forgot-password", {
          method: "POST",
          body: JSON.stringify({ email: resetEmail.trim() })
        });
        setResetMessage(result2.message);
      } catch (error) {
        setResetError(error.message || "We could not send the reset link. Please try again.");
      } finally {
        setResetPending(false);
      }
    };
    const closeReset = () => {
      if (initialRecoveryOpen) navigate("login");
      else setResetOpen(false);
    };
    return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { id: "login", children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
        "button",
        {
          className: "ib theme-fab",
          type: "button",
          onClick: toggleTheme,
          title: "Toggle theme",
          "aria-label": "Toggle theme",
          children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Icon, { name: dark ? "sun" : "moon" })
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "lwrap", children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("section", { className: "hero clay", children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "brandbar", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Brand, {}) }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "hbody", children: [
            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Dumbbell, {}),
            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("h1", { children: "Make every session count." }),
            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { children: "Your membership, check-ins, and progress in one place." }),
            /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "feats", children: [
              /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("span", { className: "feat", children: [
                /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Icon, { name: "qr", size: 16 }),
                "QR check-in"
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("span", { className: "feat", children: [
                /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Icon, { name: "bell", size: 16 }),
                "Expiry reminders"
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("span", { className: "feat", children: [
                /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Icon, { name: "wallet", size: 16 }),
                "Payment records"
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
          "section",
          {
            className: `lform clay${shaking ? " shake" : ""}`,
            onAnimationEnd: () => setShaking(false),
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "fhead", children: [
                /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("h2", { children: "Welcome back" }),
                /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { children: "Login to continue your fitness journey." })
              ] }),
              errors.general && /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "banner show", role: "alert", children: [
                /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Icon, { name: "alert", size: 16 }),
                errors.general
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("form", { onSubmit: submit, noValidate: true, "aria-busy": pending, children: [
                /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "input-label", id: "login-email-label", children: "Email address" }),
                /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("label", { className: `inp${errors.email ? " bad" : ""}`, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Icon, { name: "mail" }),
                  /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                    "input",
                    {
                      ref: emailRef,
                      disabled: pending,
                      "aria-labelledby": "login-email-label",
                      "aria-invalid": Boolean(errors.email),
                      "aria-describedby": errors.email ? "login-email-error" : void 0,
                      name: "email",
                      type: "email",
                      autoComplete: "username",
                      placeholder: "john123@gmail.com",
                      value: email,
                      onChange: (event) => {
                        setEmail(event.target.value);
                        clearErrors();
                      }
                    }
                  )
                ] }),
                errors.email && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { id: "login-email-error", className: "err show", role: "alert", children: errors.email }),
                /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "input-label", id: "login-password-label", children: "Password" }),
                /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("label", { className: `inp${errors.password ? " bad" : ""}`, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Icon, { name: "lock" }),
                  /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                    "input",
                    {
                      ref: passwordRef,
                      disabled: pending || loginLocked,
                      "aria-labelledby": "login-password-label",
                      "aria-invalid": Boolean(errors.password),
                      "aria-describedby": errors.password ? "login-password-error" : void 0,
                      name: "password",
                      onBlur: () => setCapsLock(false),
                      type: showPassword ? "text" : "password",
                      autoComplete: "current-password",
                      placeholder: "Enter your password",
                      value: password,
                      onKeyDown: (event) => setCapsLock(event.getModifierState("CapsLock")),
                      onKeyUp: (event) => setCapsLock(event.getModifierState("CapsLock")),
                      onChange: (event) => {
                        setPassword(event.target.value);
                        clearErrors();
                      }
                    }
                  ),
                  /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                    "button",
                    {
                      className: "eye",
                      type: "button",
                      disabled: pending || loginLocked,
                      onClick: () => setShowPassword((value) => !value),
                      "aria-label": showPassword ? "Hide password" : "Show password",
                      "aria-pressed": showPassword,
                      children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Icon, { name: showPassword ? "eyeoff" : "eye" })
                    }
                  )
                ] }),
                errors.password && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { id: "login-password-error", className: "err show", role: "alert", children: errors.password }),
                /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: `caps${capsLock ? " show" : ""}`, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Icon, { name: "alert", size: 14 }),
                  "Caps Lock is on"
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "opts", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("label", { children: [
                    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                      "input",
                      {
                        type: "checkbox",
                        disabled: pending || loginLocked,
                        checked: remember,
                        onChange: (event) => setRemember(event.target.checked)
                      }
                    ),
                    " ",
                    "Remember me"
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                    "button",
                    {
                      className: "forgot-link",
                      type: "button",
                      disabled: pending,
                      onClick: () => {
                        setResetEmail(email);
                        setResetError("");
                        setResetMessage("");
                        setResetOpen(true);
                      },
                      children: "Forgot password?"
                    }
                  )
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
                  "button",
                  {
                    className: "btn lbtn login-submit",
                    type: "submit",
                    disabled: pending || loginLocked,
                    "aria-busy": pending,
                    children: [
                      pending && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Spinner, {}),
                      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "tx", "aria-live": "polite", children: pending ? "Logging in" : "Log in" })
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "lfoot", children: "Need an account? Ask your gym admin to create one for you." })
            ]
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(import_react9.Suspense, { fallback: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(HeartRateLoader, { message: "Opening the next sign-in step" }), children: [
        termsTicket && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
          MemberTerms2,
          {
            ticket: termsTicket,
            onCancel: () => setTermsTicket(""),
            onAccepted: (challenge) => {
              setTermsTicket("");
              setFaceChallenge(challenge);
            }
          }
        ),
        faceChallenge && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
          FacialLoginChallenge2,
          {
            challenge: faceChallenge,
            onCancel: () => setFaceChallenge(""),
            onVerified: (session) => {
              setFaceChallenge("");
              finishLogin(session);
            }
          }
        )
      ] }),
      showLockAlert && /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(Dialog, { title: loginLockAlert.title, onClose: () => setShowLockAlert(false), alert: true, children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "modal-copy", children: loginLockAlert.message }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "ma", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("button", { className: "btn", type: "button", onClick: () => setShowLockAlert(false), "data-autofocus": true, children: "Close" }) })
      ] }),
      resetOpen && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Dialog, { title: "Reset password", onClose: closeReset, busy: resetPending, children: resetMessage ? /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(import_jsx_runtime9.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "modal-copy", role: "status", children: resetMessage }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "ma", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("button", { className: "btn", type: "button", onClick: closeReset, children: "Done" }) })
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("form", { onSubmit: sendReset, children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: "modal-copy", children: "Enter your account email and we'll send you a reset link." }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("label", { className: "field", children: [
          "Email",
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
            "input",
            {
              className: "clay-in",
              "data-autofocus": true,
              autoComplete: "email",
              required: true,
              disabled: resetPending,
              type: "email",
              placeholder: "you@example.com",
              "aria-invalid": resetError === "Enter a valid email address",
              "aria-describedby": resetError ? "login-reset-error" : void 0,
              value: resetEmail,
              onChange: (event) => setResetEmail(event.target.value)
            }
          )
        ] }),
        resetError && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { id: "login-reset-error", className: "reset-error", role: "alert", children: resetError }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "ma", children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("button", { className: "btn", type: "submit", disabled: resetPending, children: [
            resetPending && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Spinner, {}),
            resetPending ? "Sending..." : "Send email"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("button", { className: "btn ghost cancel-button", type: "button", onClick: closeReset, disabled: resetPending, children: "Cancel" })
        ] })
      ] }) })
    ] });
  }

  // src/App.jsx
  init_api();
  var import_jsx_runtime62 = __toESM(require_jsx_runtime(), 1);
  var ResetPassword2 = (0, import_react43.lazy)(() => Promise.resolve().then(() => (init_ResetPassword(), ResetPassword_exports)));
  var ChangePasswordPage2 = (0, import_react43.lazy)(() => Promise.resolve().then(() => (init_ChangePasswordPage2(), ChangePasswordPage_exports)));
  var AdminStaffPage2 = (0, import_react43.lazy)(() => Promise.resolve().then(() => (init_AdminStaffPage2(), AdminStaffPage_exports)));
  var UserPage2 = (0, import_react43.lazy)(() => Promise.resolve().then(() => (init_UserPage2(), UserPage_exports)));
  var NotFound2 = (0, import_react43.lazy)(() => Promise.resolve().then(() => (init_NotFound(), NotFound_exports)));
  var GorillaProvider2 = (0, import_react43.lazy)(() => Promise.resolve().then(() => (init_GorillaAssistant(), GorillaAssistant_exports)).then(({ GorillaProvider: GorillaProvider3 }) => ({ default: GorillaProvider3 })));
  var HOME_URL = `${(define_import_meta_env_default.BASE_URL || "/").replace(/\/$/, "")}/`;
  var routePaths = /* @__PURE__ */ new Map([
    ["", "login"],
    ["login", "login"],
    ["forgot-password", "forgot-password"],
    ["reset-password", "reset-password"],
    ["register", "register"],
    ["user", "user"],
    ["admin", "admin"]
  ]);
  function readRoute() {
    const pathname = window.location.pathname;
    if (pathname === HOME_URL.slice(0, -1)) return "login";
    if (!pathname.startsWith(HOME_URL)) return "not-found";
    const path = pathname.slice(HOME_URL.length).replace(/\/$/, "");
    if (!path) {
      const saved = sessionStorage.getItem("fitpulse-route");
      if (["admin", "user", "register"].includes(saved)) return saved;
    }
    return routePaths.get(path) || "not-found";
  }
  function App() {
    const { login, logout, user: user2, token, role, memberLoginComplete } = useAuth();
    const [route, setRoute] = (0, import_react43.useState)(readRoute);
    (0, import_react43.useEffect)(() => {
      const onPopState = () => setRoute(readRoute());
      window.addEventListener("popstate", onPopState);
      return () => window.removeEventListener("popstate", onPopState);
    }, []);
    (0, import_react43.useEffect)(() => {
      if (!token) return;
      let cancelled = false;
      apiRequest("/me", { token }).catch((error) => {
        if (!cancelled && [401, 403].includes(error.status)) logout();
      });
      return () => {
        cancelled = true;
      };
    }, [token, logout]);
    const navigate = (0, import_react43.useCallback)((nextRoute) => {
      window.scrollTo(0, 0);
      const target = nextRoute === "login" ? HOME_URL : `${HOME_URL}${nextRoute}`;
      window.history.replaceState({}, "", target);
      sessionStorage.setItem("fitpulse-route", nextRoute);
      setRoute(nextRoute);
    }, []);
    const handleLogin = (session) => {
      const account = session.user;
      const destination = account.role === "admin" ? "admin" : "user";
      login(session);
      navigate(destination);
    };
    const handleLogout = () => {
      logout();
      navigate("login");
    };
    const pages = {
      login: /* @__PURE__ */ (0, import_jsx_runtime62.jsx)(Login, { navigate, onLogin: handleLogin }),
      "forgot-password": /* @__PURE__ */ (0, import_jsx_runtime62.jsx)(Login, { initialRecoveryOpen: true, navigate, onLogin: handleLogin }, "recovery"),
      "reset-password": /* @__PURE__ */ (0, import_jsx_runtime62.jsx)(ResetPassword2, { navigate }),
      register: /* @__PURE__ */ (0, import_jsx_runtime62.jsx)(ProtectedRoute, { navigate, roles: ["admin"], children: /* @__PURE__ */ (0, import_jsx_runtime62.jsx)(AdminStaffPage2, { user: user2, onSignOut: handleLogout, navigate, startMemberCreation: true }) }, "register"),
      user: /* @__PURE__ */ (0, import_jsx_runtime62.jsx)(ProtectedRoute, { navigate, roles: ["user", "member"], children: /* @__PURE__ */ (0, import_jsx_runtime62.jsx)(UserPage2, { user: user2, onSignOut: handleLogout }) }),
      admin: /* @__PURE__ */ (0, import_jsx_runtime62.jsx)(ProtectedRoute, { navigate, roles: ["admin"], children: /* @__PURE__ */ (0, import_jsx_runtime62.jsx)(AdminStaffPage2, { user: user2, onSignOut: handleLogout, navigate }) })
    };
    const dashboard = token && ((route === "admin" || route === "register") && role === "admin" || route === "user" && memberLoginComplete && ["user", "member"].includes(role));
    let page = pages[route] || /* @__PURE__ */ (0, import_jsx_runtime62.jsx)(NotFound2, { navigate });
    if (dashboard) {
      page = user2?.mustChangePassword ? /* @__PURE__ */ (0, import_jsx_runtime62.jsx)(ChangePasswordPage2, { onSignOut: handleLogout }) : /* @__PURE__ */ (0, import_jsx_runtime62.jsx)(GorillaProvider2, { side: "right", children: page }, user2?.id);
    }
    return /* @__PURE__ */ (0, import_jsx_runtime62.jsx)(import_react43.Suspense, { fallback: null, children: page });
  }

  // .taste-skill/fitpulse-review/entry.jsx
  init_AuthContext();
  init_useTheme();
  init_memberTerms();
  var import_jsx_runtime63 = __toESM(require_jsx_runtime(), 1);
  var member = {
    id: "fixture-member",
    name: "Jamie Member",
    role: "user",
    email: "jamie@fixture.test",
    status: "active",
    plan: "Monthly",
    membershipStart: "2025-01-01",
    membershipEnd: "2099-12-01",
    memberCode: "FP-001",
    termsVersion: MEMBER_TERMS_VERSION
  };
  var admin = { id: "fixture-admin", name: "Alex Admin", role: "admin", email: "alex@fixture.test" };
  var date3 = "2026-11-24T09:30:00Z";
  var attendance = [{ id: "visit-1", memberId: member.id, memberName: member.name, date: date3, source: "QR" }];
  var payments = [{ id: "payment-1", memberId: member.id, memberName: member.name, type: "Renewal", plan: "Monthly", amount: 1500, method: "Cash", date: date3 }];
  var equipment = [{ id: "eq-1", name: "Cable station", category: "Free Weights Section", condition: "Good", lastInspected: date3 }];
  var plans = [{ plan_id: 1, plan_name: "Monthly", price: 1500, duration_days: 30 }];
  var pendingAlert = { id: "history-1", title: "Membership reminder", type: "info", message: "A membership needs review.", receivedAt: date3 };
  var previewType = document.body.dataset.preview;
  var paymentMethods = { methods: [], total: 0 };
  var result = document.getElementById("results");
  var observed = [];
  var failures = [];
  var clicks = [];
  var user = admin;
  var sequence = 0;
  var liveSource;
  var resetExpiry;
  var resetUsed;
  var app;
  var checks = 0;
  var exports = 0;
  var freshPassword = "StrongPass#2026";
  var nativeFetch = window.fetch.bind(window);
  window.fetch = async (input, options = {}) => {
    const url = new URL(input, location.href);
    if (!url.pathname.startsWith("/api/")) return nativeFetch(input, options);
    const path = url.pathname.slice(4);
    const method = options.method || "GET";
    const values = typeof options.body === "string" ? JSON.parse(options.body) : {};
    observed.push([method, path, values]);
    const json = (payload, status = 200) => new Response(JSON.stringify(payload), {
      status,
      headers: { "Content-Type": "application/json" }
    });
    if (path === "/me") return json({ user });
    if (path === "/events/ticket") return json({ ticket: "fixture", expiresAt: Date.now() + 6e4 });
    if (path === "/events/history") return json({ alerts: url.searchParams.get("after") === "0" ? [pendingAlert] : [], next: 1 });
    if (path === "/events/reminders") return json({ reminders: [] });
    if (path === "/members") return json({ members: [member] });
    if (path === "/admin/membership-plans") return json({ membershipPlans: plans });
    if (path === "/attendance") return json({ attendance });
    if (path === "/payments" && method === "GET") return json({ payments });
    if (path === "/admin/equipment") return json({ equipment, maintenance: [] });
    if (path === "/admin/settings") return json({ settings: { gym: "FitPulse Gym", remind: 7 } });
    if (path === "/admin/notifications") return json({ canDismiss: true, notifications: [
      { id: "equipment-notice", kind: "equipment", name: "Cable station", condition: "Good", lastInspected: date3 }
    ] });
    if (path === "/analytics/attendance") return json({ days: [], total: 0 });
    if (path === "/analytics/membership-status") return json({ totalMembers: 0, active: 0, expiringSoon: 0, expired: 0, unclassified: 0 });
    if (path === "/analytics/revenue") return json({ months: [], paymentCount: 0, revenueThisMonth: 0 });
    if (path === "/analytics/payments") return json(paymentMethods);
    if (path === "/me/qr") return json({
      image: "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><path d="M0 0h50v50H0zM70 70h50v50H70z"/></svg>'),
      expiresAt: Date.now() + 6e4
    });
    if (path === "/profile/change-password") {
      if (values.currentPassword !== "OldPassword#2") return json({ message: "Current password is incorrect." }, 400);
      return json({ session: { token: "fixture-new-session", user } });
    }
    if (path === "/profile" && method === "PATCH") {
      user = { ...user, ...values };
      return json({ user });
    }
    if (path === "/auth/forgot-password") return json({ message: "If that email exists, a reset link was sent." });
    if (path === "/auth/reset-password/session") {
      const serverNow = Date.now();
      if (resetExpiry <= serverNow || resetUsed) return json({ message: "This link has expired." }, 410);
      return json({ expiresAt: resetExpiry, serverNow });
    }
    if (path === "/auth/reset-password") {
      if (resetUsed || resetExpiry <= Date.now()) return json({ message: "This link has expired." }, 410);
      resetUsed = true;
      return json({ message: "Password reset successfully." });
    }
    failures.push("Unexpected fixture request: " + method + " " + path);
    return json({ message: "Unexpected request" }, 500);
  };
  window.EventSource = class {
    static CLOSED = 2;
    constructor() {
      liveSource = this;
    }
    close() {
      this.readyState = 2;
    }
  };
  var browserError = (event) => failures.push(event.message || String(event.reason));
  window.addEventListener("error", browserError);
  window.addEventListener("unhandledrejection", browserError);
  document.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement && event.target.download) {
      exports++;
      event.preventDefault();
    }
  });
  var pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  function assert(ok, message) {
    if (!ok) throw new Error(message);
    checks++;
  }
  async function waitFor(find2, label) {
    for (let attempt = 0; attempt < 80; attempt++) {
      const item = find2();
      if (item) return item;
      await pause(25);
    }
    throw new Error("Timed out waiting for " + label);
  }
  var find = (selector, container = document) => container.querySelector(selector);
  var contains = (text) => document.body.textContent.includes(text);
  var buttonNamed = (name, within = document) => [...within.querySelectorAll("button")].find((button) => (button.getAttribute("aria-label") === name || button.textContent.trim() === name || button.matches(".nav") && button.querySelector("span")?.textContent === name) && button.getClientRects().length);
  var tap = async (name, within = document) => {
    const button = await waitFor(() => {
      const target = buttonNamed(name, within);
      return target && !target.disabled && target;
    }, name);
    button.click();
    clicks.push(name);
  };
  var dialog = () => find("dialog[open]");
  var close = async () => {
    const opened = await waitFor(dialog, "open dialog");
    find(".dialog-close", opened).click();
    await waitFor(() => !dialog(), "closed dialog");
  };
  var fill = (input, value) => Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, value);
  function submitForm(form, values) {
    for (const [key, value] of Object.entries(values)) fill(form.elements.namedItem(key), value);
    form.requestSubmit();
  }
  async function mount(route, account) {
    user = account;
    if (account) localStorage.setItem("fitpulse-session", JSON.stringify({ token: "fixture-session", user: account }));
    else localStorage.removeItem("fitpulse-session");
    window.history.replaceState({}, "", route);
    (0, import_react_dom.flushSync)(() => app.render(
      /* @__PURE__ */ (0, import_jsx_runtime63.jsx)(import_react44.StrictMode, { children: /* @__PURE__ */ (0, import_jsx_runtime63.jsx)(ThemeProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime63.jsx)(AuthProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime63.jsx)(App, {}) }) }) }, ++sequence)
    ));
  }
  async function run() {
    app = (0, import_client.createRoot)(document.getElementById("root"));
    for (const account of [admin, member]) {
      localStorage.removeItem("fitpulse-rocky:" + account.id);
      sessionStorage.removeItem("fitpulse-rocky:" + account.id + ":greeted");
    }
    const mobile = innerWidth <= 768;
    if (previewType) {
      await mount("/user", member);
      const nav = await waitFor(() => find(mobile ? ".fitpulse-bottom-nav" : "#nav"), "member navigation");
      if (mobile) await tap("More", nav);
      await tap(mobile ? "Settings\u203A" : "Settings", mobile ? document : nav);
      await tap("Read privacy policy");
      const policy = await waitFor(dialog, "privacy dialog");
      const content = find(".privacy-policy-copy", policy);
      const closeButton = find(".dialog-close", policy);
      assert(document.activeElement === closeButton, "The close button receives initial focus");
      const top = closeButton.getBoundingClientRect().top;
      content.scrollTop = content.scrollHeight;
      assert(Math.abs(closeButton.getBoundingClientRect().top - top) < 1, "Close button stays visible while the policy scrolls");
      content.scrollTop = 0;
      result.hidden = true;
      return;
    }
    await mount("/login");
    await waitFor(() => contains("Welcome back"), "login");
    assert(!find(".heart-rate-loader"), "Startup should open login directly");
    await tap("Forgot password?");
    const request = await waitFor(dialog, "forgot-password dialog");
    const email = find("input[type=email]", request);
    fill(email, member.email);
    email.dispatchEvent(new Event("input", { bubbles: true }));
    await tap("Send email", request);
    await waitFor(() => contains("a reset link was sent"), "confirmation inside the dialog");
    assert(Boolean(dialog()), "Email confirmation must stay in the modal");
    await tap("Done", request);
    await waitFor(() => !dialog(), "recovery confirmation closes");
    for (const account of [admin, member]) {
      const isAdmin = account.role === "admin";
      const dashboard = isAdmin ? "/admin" : "/user";
      await mount(dashboard, account);
      await waitFor(() => contains("Welcome to FitPulse!"), account.role + " Rocky greeting");
      assert(!find(".rocky-alert"), "Greeting should precede pending notifications");
      await tap("Close notification");
      await waitFor(() => find(".rocky-alert"), "pending notification");
      assert(contains(pendingAlert.message), "Queued notification should follow greeting");
      await tap("Close notification");
      const nav = find(mobile ? ".fitpulse-bottom-nav" : "#nav");
      assert(Boolean(nav) && !find(".heart-rate-loader"), "Dashboard renders without startup loader");
      if (mobile) {
        assert(Boolean(buttonNamed(isAdmin ? "Create a new member" : "Open my QR", nav)), "Role-appropriate mobile primary action");
        assert(!buttonNamed(isAdmin ? "Membership" : "Members", nav), "Other role does not appear in mobile navigation");
        if (!isAdmin) {
          await tap("Membership", nav);
          await waitFor(() => contains("My membership"), "member membership details");
          assert(!contains("Your activity"), "Membership tab does not duplicate the overview");
          await tap("Open my QR", nav);
          await waitFor(() => find("dialog[open] img"), "member QR image");
          await close();
        }
        await tap("Activities", nav);
        await tap("Attendance");
        await waitFor(() => contains(isAdmin ? "Entrance check-ins" : "My Attendance History"), "attendance");
        await tap("\u2190 Activities");
        await tap("Payments");
        await waitFor(() => contains(isAdmin ? "Payment History" : "My Payment History"), "payments");
      } else {
        await tap("Attendance", nav);
        await waitFor(() => contains(isAdmin ? "Entrance check-ins" : "My Attendance History"), "attendance");
        await tap("Payments", nav);
        await waitFor(() => contains(isAdmin ? "Payment History" : "My Payment History"), "payments");
        if (!isAdmin) {
          await tap("My QR", nav);
          await waitFor(() => find(".member-qr-card img"), "member QR image");
        }
      }
      if (isAdmin) {
        await tap("Record Payment");
        await waitFor(dialog, "record payment modal");
        await close();
        if (mobile) await tap("More", nav);
        await tap(mobile ? "Email reminders\u203A" : "Notifications", mobile ? document : nav);
        await tap("Review");
        await waitFor(() => contains("Equipment Monitoring"), "equipment from reminder");
        if (mobile) await tap("More", nav);
        await tap(mobile ? "Equipment monitoring\u203A" : "Equipment");
        await tap("Add Equipment");
        await waitFor(dialog, "add equipment modal");
        await close();
        await tap("Log repair");
        await waitFor(dialog, "maintenance modal");
        await close();
        if (mobile) await tap("More", nav);
        await tap(mobile ? "Reports\u203A" : "Reports");
        const tabs = await waitFor(() => find(".report-tabs"), "report tabs");
        for (const tab of tabs.querySelectorAll("button")) {
          tab.click();
          await pause(20);
          assert(tab.getAttribute("aria-selected") === "true" || tab.getAttribute("aria-pressed") === "true", "Report tab selects");
        }
        if (mobile) {
          await tap("Create a new member", nav);
        } else {
          await tap("Members", nav);
          await tap("Create Account");
        }
        await waitFor(() => contains("Create member account"), "create member");
        const creation = dialog();
        creation.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
        creation.requestClose();
        await pause(30);
        assert(creation.open, "Existing creation lock remains active");
        await close();
      }
      const theme = document.documentElement.dataset.theme;
      await tap(mobile ? theme === "dark" ? "Use light theme" : "Use dark theme" : "Toggle theme");
      await waitFor(() => document.documentElement.dataset.theme !== theme, "theme toggled");
      if (mobile) {
        await tap("More", nav);
        assert(find(".fitpulse-mobile-header .fitpulse-icon-button") && ![...find(".fitpulse-more-list").querySelectorAll("button")].some((b) => /dark mode|theme/i.test(b.textContent)), "One mobile theme control");
        if (!isAdmin) assert(!/equipment|reports|email reminders/i.test(find(".fitpulse-more-list").textContent), "Member More menu contains member items");
        await tap("Settings\u203A");
      } else {
        await tap("Settings", nav);
      }
      await tap("Read privacy policy");
      const policy = await waitFor(dialog, "privacy dialog");
      await waitFor(() => find(".dialog-close", policy).getBoundingClientRect().width >= 40, "visible privacy close button");
      assert(contains("facial template") && contains("gym front desk"), "Privacy describes data and contact");
      assert(getComputedStyle(policy, "::backdrop").backdropFilter.includes("blur"), "Modal retains blurred backdrop");
      assert(find(".dialog-close", policy).getBoundingClientRect().width >= 40, "Visible privacy close button");
      await close();
      const password = await waitFor(() => find(".password-form"), "password form");
      await tap("Show new password", password);
      assert(password.elements.password.type === "text", "Password visibility toggle works");
      const submitted = observed.length;
      submitForm(password, { currentPassword: "OldPassword#2", password: freshPassword, confirmPassword: "WrongPass#2026" });
      await waitFor(() => contains("The new passwords do not match."), "mismatch");
      assert(!observed.slice(submitted).some(([, path]) => path === "/profile/change-password"), "Client blocks a mismatch");
      submitForm(password, { currentPassword: "WrongPassword#2", password: freshPassword, confirmPassword: freshPassword });
      await waitFor(() => contains("Current password is incorrect."), "wrong current password");
      submitForm(password, { currentPassword: "OldPassword#2", password: freshPassword, confirmPassword: freshPassword });
      await waitFor(() => contains("Password updated."), "password updated");
      await tap("Save profile");
      await waitFor(() => contains("Profile saved."), "profile save");
      if (isAdmin) {
        await tap("Save preferences");
        await waitFor(() => contains("Preferences saved."), "gym preferences save");
      }
      const rockySwitch = find("[role=switch]");
      rockySwitch.click();
      await waitFor(() => !find(".rocky-trigger"), "Rocky hidden");
      liveSource.onmessage({ data: JSON.stringify({ ...pendingAlert, title: "Plain test notice" }), lastEventId: "live-" + account.role });
      await waitFor(() => contains("Plain test notice"), "plain notification");
      assert(Boolean(find(".rocky-docked")) && !find(".rocky-trigger"), "Plain popup has no mascot");
      await mount(dashboard, account);
      await waitFor(() => find(".rocky-docked"), "account-specific preference restored");
      assert(!contains("Welcome to FitPulse!"), "Same browser session does not repeat the greeting");
      const nextNav = await waitFor(() => find(mobile ? ".fitpulse-bottom-nav" : "#nav"), "remounted navigation");
      if (mobile) {
        await tap("Activities", nextNav);
        await tap("Payments");
      } else await tap("Payments", nextNav);
      const exported = exports;
      await tap("Export CSV");
      await waitFor(() => exports === exported + 1, "CSV download");
      if (mobile) await tap("More", nextNav);
      await tap("Sign out", mobile ? document : find(".app aside"));
      await tap("Cancel", await waitFor(dialog, "sign-out dialog"));
      await waitFor(() => !dialog(), "sign-out cancellation keeps dashboard");
      await tap("Sign out", mobile ? document : find(".app aside"));
      await tap("Sign out", await waitFor(dialog, "sign-out confirmation"));
      await waitFor(() => contains("Welcome back"), "signed out");
    }
    resetUsed = false;
    resetExpiry = Date.now() + 2800;
    const resetUrl = "/reset-password#token=browser-fixture";
    await mount(resetUrl);
    await waitFor(() => /Link expires in 00:0[1-5]/.test(document.body.textContent), "server-based timer");
    const first = Number(find("[role=timer]").textContent.slice(-2));
    await pause(1150);
    await mount(resetUrl);
    await waitFor(() => /Link expires in 00:0[1-3]/.test(document.body.textContent), "refresh timer");
    assert(Number(find("[role=timer]").textContent.slice(-2)) < first, "Refreshing uses the original expiry");
    await waitFor(() => contains("00:00"), "expired timer");
    assert([...document.querySelectorAll("form input, form button")].every((control) => control.disabled), "Expired reset fields and buttons are disabled");
    await tap("Request a new link");
    await waitFor(dialog, "forgot modal reopens from reset page");
    await close();
    resetExpiry = Date.now() + 6e4;
    await mount(resetUrl);
    const resetForm = await waitFor(() => find(".reset-page form input:not(:disabled)")?.form, "active reset form");
    submitForm(resetForm, { password: freshPassword, confirmPassword: freshPassword });
    await waitFor(() => contains("Password reset successfully."), "reset success");
    await tap("Back to login");
    await waitFor(() => contains("Welcome back"), "return to login");
    assert(!failures.length, failures.join("\n"));
    (0, import_react_dom.flushSync)(() => app.render(null));
    result.textContent = "PASS | " + checks + " assertions, " + clicks.length + " UI actions (" + (mobile ? "mobile" : "desktop") + ").";
  }
  run().catch((error) => {
    (0, import_react_dom.flushSync)(() => app.render(null));
    result.textContent = "FAIL | " + error.message + "\n" + failures.join("\n") + "\nLast actions: " + clicks.slice(-7).join(", ");
    console.error(error);
  }).finally(() => {
    document.documentElement.dataset.ready = "true";
  });
})();
/*! Bundled license information:

react/cjs/react.production.min.js:
  (**
   * @license React
   * react.production.min.js
   *
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

scheduler/cjs/scheduler.production.min.js:
  (**
   * @license React
   * scheduler.production.min.js
   *
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

react-dom/cjs/react-dom.production.min.js:
  (**
   * @license React
   * react-dom.production.min.js
   *
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

react/cjs/react-jsx-runtime.production.min.js:
  (**
   * @license React
   * react-jsx-runtime.production.min.js
   *
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)
*/
