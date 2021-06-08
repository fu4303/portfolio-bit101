function Anim(renderCallback, fps) {
  return {
    startTime: 0,
    fps: fps || 60,
    renderCallback: renderCallback,

    start: function () {
      if (!this.running) {
        this.running = true;
        this.render();
      }
      this.shouldKill = false;
      this.startTime = Date.now();
      return this;
    },

    stop: function () {
      this.shouldKill = true;
      return this;
    },

    toggle: function () {
      if (this.running) {
        this.stop();
      }
      else {
        this.start();
      }
      return this;
    },

    render: function () {
      if (this.shouldKill) {
        this.shouldKill = false;
        this.running = false;
      }
      if (this.running) {
        if (this.renderCallback) {
          this.renderCallback(Date.now() - this.startTime);
        }
        setTimeout(() => {
          requestAnimationFrame(() => {
            this.render();
          });
        }, 1000 / this.fps);
      }
    },
  };
}

const Num = {
  difference: function(a, b) {
    return Math.abs(a - b);
  },

  norm: function (value, min, max) {
    return (value - min) / (max - min);
  },

  lerp: function (min, max, t) {
    return min + (max - min) * t;
  },

  wrap: function(value, min, max) {
    const range = max - min;
    return min + ((((value - min) % range) + range) % range);
  },

  map: function (srcValue, srcMin, srcMax, dstMin, dstMax) {
    const norm = this.norm(srcValue, srcMin, srcMax);
    return this.lerp(dstMin, dstMax, norm);
  },

  clamp: function (value, min, max) {
    return Math.min(Math.max(value, min), max);
  },

  roundTo: function(value, decimal) {
    const mult = Math.pow(10, decimal);
    return Math.round(value * mult) / mult;
  },

  roundToNearest: function(value, mult) {
    return Math.round(value / mult) * mult;
  },

  sinRange: function(angle, min, max) {
    return Num.map(Math.sin(angle), -1, 1, min, max);
  },

  cosRange: function(angle, min, max) {
    return Num.map(Math.cos(angle), -1, 1, min, max);
  },

  lerpSin: function(value, max, min) {
    return Num.sinRange(value * Math.PI * 2, min, max);
  },

  equalish: function(a, b, delta) {
    return Num.difference(a, b) < delta;
  },

  dotProduct: function(x0, y0, x1, y1, x2, y2, x3, y3) {
    const dx0 = x1 - x0,
      dy0 = y1 - y0,
      dx1 = x3 - x2,
      dy1 = y3 - y2;
    return dx0 * dx1 + dy0 * dy1;
  },

  angleBetween: function(x0, y0, x1, y1, x2, y2, x3, y3) {
    const dp = this.dotProduct(x0, y0, x1, y1, x2, y2, x3, y3),
      mag0 = this.dist(x0, y0, x1, y1),
      mag1 = this.dist(x2, y2, x3, y3);
    return Math.acos(dp / mag0 / mag1);
  },

  polarToPoint: function (angle, radius) {
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    };
  },

  pointToPolar: function(p) {
    return {
      angle: Math.atan2(p.y, p.x),
      radius: this.magnitude(p),
    };
  },

  magnitude: function(p) {
    return this.dist(0, 0, p.x, p.y);
  },

  dist: function (x0, y0, x1, y1) {
    if (arguments.length === 2) {
      return this.dist(x0.x, x0.y, y0.x, y0.y);
    }
    const dx = x1 - x0,
      dy = y1 - y0;
    return Math.sqrt(dx * dx + dy * dy);
  },

  lerpPoint: function(p0, p1, t) {
    return {
      x: this.lerp(p0.x, p1.x, t),
      y: this.lerp(p0.y, p1.y, t),
    };
  },

  bezier: function(p0, p1, p2, p3, t) {
    const oneMinusT = 1 - t,
      m0 = oneMinusT * oneMinusT * oneMinusT,
      m1 = 3 * oneMinusT * oneMinusT * t,
      m2 = 3 * oneMinusT * t * t,
      m3 = t * t * t;
    return {
      x: m0 * p0.x + m1 * p1.x + m2 * p2.x + m3 * p3.x,
      y: m0 * p0.y + m1 * p1.y + m2 * p2.y + m3 * p3.y,
    };
  },

  quadratic: function(p0, p1, p2, t) {
    const oneMinusT = 1 - t,
      m0 = oneMinusT * oneMinusT,
      m1 = 2 * oneMinusT * t,
      m2 = t * t;
    return {
      x: m0 * p0.x + m1 * p1.x + m2 * p2.x,
      y: m0 * p0.y + m1 * p1.y + m2 * p2.y,
    };
  },

  pointInCircle: function(px, py, cx, cy, cr) {
    const dist = this.dist(px, py, cx, cy);
    return dist <= cr;
  },

  pointInRect: function(px, py, rx, ry, rw, rh) {
    return px >= rx &&
      py >= ry &&
      px <= rx + rw &&
      py <= ry + rh;
  },

  segmentIntersect: function(p0, p1, p2, p3) {
    const A1 = p1.y - p0.y,
      B1 = p0.x - p1.x,
      C1 = A1 * p0.x + B1 * p0.y,
      A2 = p3.y - p2.y,
      B2 = p2.x - p3.x,
      C2 = A2 * p2.x + B2 * p2.y,
      denominator = A1 * B2 - A2 * B1;

    if (denominator === 0) {
      return null;
    }

    const intersectX = (B2 * C1 - B1 * C2) / denominator,
      intersectY = (A1 * C2 - A2 * C1) / denominator,
      rx0 = (intersectX - p0.x) / (p1.x - p0.x),
      ry0 = (intersectY - p0.y) / (p1.y - p0.y),
      rx1 = (intersectX - p2.x) / (p3.x - p2.x),
      ry1 = (intersectY - p2.y) / (p3.y - p2.y);

    if (((rx0 >= 0 && rx0 <= 1) || (ry0 >= 0 && ry0 <= 1)) &&
      ((rx1 >= 0 && rx1 <= 1) || (ry1 >= 0 && ry1 <= 1))) {
      return {
        x: intersectX,
        y: intersectY,
      };
    }

    return null;
  },

  tangentPointToCircle: function(x, y, cx, cy, cr, anticlockwise) {
    const dist = Math.dist(x, y, cx, cy),
      dir = anticlockwise ? 1 : -1,
      angle = Math.acos(-cr / dist) * dir,
      baseAngle = Math.atan2(cy - y, cx - x),
      totalAngle = baseAngle + angle;

    return {
      x: cx + Math.cos(totalAngle) * cr,
      y: cy + Math.sin(totalAngle) * cr,
    };
  },

  hexPoint: function(x, y, size, xfirst) {
    const sin60r = Math.sin(Math.PI / 3) * size;
    const xInc = 2 * sin60r;
    const yInc = size * 1.5;
    const offset = y % 2 * sin60r;
    const xx = (x * xInc + offset);
    const yy = (y * yInc);
    if (xfirst) {
      return {x: xx, y: yy};
    }
    return {x: yy, y: xx};
  },

};

const Random = {
  _seed: Date.now(),
  _a: 1664525,
  _c: 1013904223,
  _m: Math.pow(2, 32),

  seed: function(seed) {
    // prevent early sequences of sequential seeds from being too similar.
    // this is a hack - the first int() you get after seed(0) will be 1777110879.
    // but if 0 comes up in the sequence, the following int() will be 1013904223.
    // likewise for any other seed. these should be the same.
    // not a big deal for my use cases.
    Random._seed = Math.pow(seed + Random._a, 3) % Random._m;
  },

  _int: function() {
    // range [0, 2^32)
    Random._seed = (Random._seed * Random._a + Random._c) % Random._m;
    return Random._seed;
  },

  _float: function() {
    // range [0, 1)
    return Random._int() / Random._m;
  },

  bool: function(percent) {
    // percent is chance of getting true
    if (percent === null || percent === undefined) {
      percent = 0.5;
    }
    return Random._float() < percent;
  },

  float: function(min, max) {
    // range [min, max)
    if (arguments.length === 1) {
      return Random._float() * min;
    }
    if (arguments.length === 2) {
      return min + Random._float() * (max - min);
    }
    // zero args
    return Random._float();
  },

  int: function(min, max) {
    // range [min, max)
    if (arguments.length === 1) {
      return Math.floor(Random._float() * min);
    }
    if (arguments.length === 2) {
      return Math.floor(Random.float(min, max));
    }
    // zero args
    return Random._int();
  },

  intArray(count, min, max) {
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push(Random.int(min, max));
    }
    return arr;
  },

  floatArray(count, min, max) {
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push(Random.float(min, max));
    }
    return arr;
  },

  boolArray(count, percent) {
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push(Random.bool(percent));
    }
    return arr;
  },

  pointArray(count, x, y, w, h) {
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push(Random.point(x, y, w, h));
    }
    return arr;
  },

  point: function(x, y, w, h) {
    const xx = Random.float(x, x + w);
    const yy = Random.float(y, y + h);
    return { x: xx, y: yy };
  },

  circle: function(x, y, w, h, rMin, rMax) {
    const xx = Random.float(x, x + w);
    const yy = Random.float(y, y + h);
    const r = Random.float(rMin, rMax);
    return { x: xx, y: yy, r: r };
  },

  power: function(min, max, power) {
    if (arguments.length === 2) {
      power = max;
      max = min;
      min = 0;
    }
    return min + Math.pow(Random.float(1), power) * (max - min);
  },

  powerInt: function(min, max, power) {
    return Math.floor(Random.power(min, max, power));
  },

  gauss: function(min, max, g) {
    if (arguments.length === 2) {
      g = max;
      max = min;
      min = 0;
    }
    let total = 0;
    for (let i = 0; i < g; i++) {
      total += Random.float(min, max);
    }
    return total / g;
  },

  chooser: function() {
    return {
      choices: [],
      total: 0,

      addChoice: function (choice, weight) {
        if (weight === null) weight = 1;

        this.choices.push({
          weight: weight,
          choice: choice,
        });
        this.total += weight;
        return this;
      },

      getChoice: function () {
        let rand = Random.float(0, this.total);
        for (let i = 0; i < this.choices.length; i++) {
          const choice = this.choices[i];
          if (rand < choice.weight) {
            return choice.choice;
          }
          rand -= choice.weight;
        }
      },
    };
  },
};

/**
 * @namespace Color
 */
const Color = {
  /**
   * @function rgb
   * @memberof Color
   * @description Creates a color using red, green and blue values in the range of 0 to 255.
   * @param {number} r - The red value of the color.
   * @param {number} g - The green value of the color.
   * @param {number} b - The blue value of the color.
   * @returns {object} A new Color object.
   */
  rgb: function(r, g, b) {
    return Color.rgba(r, g, b, 1);
  },

  /**
   * @function rgba
   * @memberof Color
   * @description Creates a color using red, green and blue values in the range of 0 to 255, and an alpha value in the range of 0.0 to 1.0.
   * @param {number} r - The red value of the color.
   * @param {number} g - The green value of the color.
   * @param {number} b - The blue value of the color.
   * @param {number} a - The alpha value of the color.
   * @returns {object} A new Color object.
   */
  rgba: function(r, g, b, a) {
    return {
      red: Math.floor(r),
      green: Math.floor(g),
      blue: Math.floor(b),
      alpha: Math.floor(a),
      isColorObject: true,
      toString: function() {
        return `rgba(${this.red}, ${this.green}, ${this.blue}, ${this.alpha})`;
      },
    };
  },

  /**
   * @function rgbf
   * @memberof Color
   * @description Creates a color using red, green and blue values in the range of 0.0 to 1.0.
   * @param {number} r - The red value of the color.
   * @param {number} g - The green value of the color.
   * @param {number} b - The blue value of the color.
   * @param {number} a - The alpha value of the color.
   * @returns {object} A new Color object.
   */
  rgbf: function(r, g, b) {
    return Color.rgbaf(r, g, b, 1);
  },

  /**
   * @function rgbaf
   * @memberof Color
   * @description Creates a color using red, green, blue and alpha values in the range of 0.0 to 1.0.
   * @param {number} r - The red value of the color.
   * @param {number} g - The green value of the color.
   * @param {number} b - The blue value of the color.
   * @param {number} a - The alpha value of the color.
   * @returns {object} A new Color object.
   */
  rgbaf: function(r, g, b, a) {
    return Color.rgb(r * 255, g * 255, b * 255, a);
  },

  /**
   * @function number
   * @memberof Color
   * @description Creates a color from a 24-bit integer in the range of 0 to 16,777,215 (0x000000 to 0xffffff).
   * @param {number} num - The color value.
   * @returns {object} A new Color object.
   */
  number: function(num) {
    return Color.rgb(num >> 16, num >> 8 & 0xff, num & 0xff);
  },

  /**
   * @function randomRGB
   * @memberof Color
   * @description Creates a random color.
   * @returns {object} A new Color object.
   */
  randomRGB: function() {
    return Color.number(Math.floor(Random.int(0xffffff)));
  },

  /**
   * @function gray
   * @memberof Color
   * @description Creates a color which is a shade of gray.
   * @param {number} shade - The shade of gray (0 to 255).
   * @returns {object} A new Color object.
   */
  gray: function(shade) {
    return Color.rgb(shade, shade, shade);
  },

  /**
   * @function randomGray
   * @memberof Color
   * @description Creates a random shade of gray.
   * @returns {object} A new Color object.
   */
  randomGray: function() {
    return Color.gray(Random.int(255));
  },

  /**
   * @function hsv
   * @memberof Color
   * @description Creates a color using hue, saturation and value.
   * @param {number} h - The hue of the color (0 to 360).
   * @param {number} s - The saturation of the color (0.0 to 1.0).
   * @param {number} v - The value of the color (0.0 to 1.0).
   * @returns {object} A new Color object.
   */
  hsv: function(h, s, v) {
    h /= 360;
    let r, g, b;
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);
    switch (i % 6) {
    case 0: r = v, g = t, b = p; break;
    case 1: r = q, g = v, b = p; break;
    case 2: r = p, g = v, b = t; break;
    case 3: r = p, g = q, b = v; break;
    case 4: r = t, g = p, b = v; break;
    case 5: r = v, g = p, b = q; break;
    }
    return Color.rgb(r * 255, g * 255, b * 255);
  },

  /**
   * @function lerp
   * @memberof Color
   * @description Linearly interpolates between two colors. Each color can be in the form of a string supported by `Color.string()`, a number suppoted by `Color.number()`, or a Color object.
   * @param {number} t - The interpolation value from 0.0 to 1.0.
   * @param colorA - The first color value. Can be a string or number.
   * @param colorB - The second color value. Can be a string or number.
   * @returns {object} A new Color object.
   */
  lerp: function(t, colorA, colorB) {
    let ca, cb;
    if (typeof colorA === "string") {
      ca = Color.string(colorA);
    }
    else if (typeof colorA === "number") {
      ca = Color.number(colorA);
    }
    else if (colorA.isColorObject) {
      ca = colorA;
    }
    if (typeof colorB === "string") {
      cb = Color.string(colorB);
    }
    else if (typeof colorB === "number") {
      cb = Color.number(colorB);
    }
    else if (colorB.isColorObject) {
      cb = colorB;
    }
    const r = Num.lerp(ca.red, cb.red, t),
      g = Num.lerp(ca.green, cb.green, t),
      b = Num.lerp(ca.blue, cb.blue, t),
      a = Num.lerp(ca.alpha, cb.alpha, t);
    return Color.rgba(r, g, b, a);
  },

  /**
   * @function string
   * @memberof Color
   * @description Creates a color parsed from various string formats. Includes:
   * `#fc0`, `#ffcc00`, `rgb(255, 128, 0)`, or `rgba(255, 128, 0, 255)`, or any standard CSS color name.
   * @param {string} str - The string to parse.
   * @returns {object} A new Color object.
   */
  string: function(str) {
    if (str.charAt(0) === "#" && str.length === 7) {
      str = "0x" + str.substr(1);
      const num = parseInt(str, 16);
      return Color.number(num);
    }
    else if (str.charAt(0) === "#" && str.length === 4) {
      const r = str.charAt(1),
        g = str.charAt(2),
        b = str.charAt(3);
      str = "0x" + r + r + g + g + b + b;
      const num = parseInt(str, 16);
      return Color.number(num);
    }
    else if (str.indexOf("rgba(") === 0) {
      const vals = str.substring(5, str.length - 1).split(",");
      return Color.rgba(
        parseInt(vals[0], 10),
        parseInt(vals[1], 10),
        parseInt(vals[2], 10),
        parseFloat(vals[3])
      );
    }
    else if (str.indexOf("rgb(") === 0) {
      const vals = str.substring(4, str.length - 1).split(",");
      return Color.rgba(
        parseInt(vals[0], 10),
        parseInt(vals[1], 10),
        parseInt(vals[2], 10),
        1
      );
    }
    else if (Color._colorMap[str]) {
      return Color.rgba(
        Color._colorMap[str][0],
        Color._colorMap[str][1],
        Color._colorMap[str][2],
        1
      );
    }

    return Color.rgba(0, 0, 0, 1);
  },

  _colorMap: {
    blueviolet: [138, 43, 226],
    brown: [165, 42, 42],
    aliceblue: [240, 248, 255],
    antiquewhite: [250, 235, 215],
    aqua: [0, 255, 255],
    aquamarine: [127, 255, 212],
    azure: [240, 255, 255],
    beige: [245, 245, 220],
    bisque: [255, 228, 196],
    black: [0, 0, 0],
    blanchedalmond: [255, 235, 205],
    blue: [0, 0, 255],
    burlywood: [222, 184, 135],
    cadetblue: [95, 158, 160],
    chartreuse: [127, 255, 0],
    chocolate: [210, 105, 30],
    coral: [255, 127, 80],
    cornflowerblue: [100, 149, 237],
    cornsilk: [255, 248, 220],
    crimson: [220, 20, 60],
    cyan: [0, 255, 255],
    darkblue: [0, 0, 139],
    darkcyan: [0, 139, 139],
    darkgoldenrod: [184, 134, 11],
    darkgray: [169, 169, 169],
    darkgreen: [0, 100, 0],
    darkgrey: [169, 169, 169],
    darkkhaki: [189, 183, 107],
    darkmagenta: [139, 0, 139],
    darkolivegreen: [85, 107, 47],
    darkorange: [255, 140, 0],
    darkorchid: [153, 50, 204],
    darkred: [139, 0, 0],
    darksalmon: [233, 150, 122],
    darkseagreen: [143, 188, 143],
    darkslateblue: [72, 61, 139],
    darkslategray: [47, 79, 79],
    darkslategrey: [47, 79, 79],
    darkturquoise: [0, 206, 209],
    darkviolet: [148, 0, 211],
    deeppink: [255, 20, 147],
    deepskyblue: [0, 191, 255],
    dimgray: [105, 105, 105],
    dimgrey: [105, 105, 105],
    dodgerblue: [30, 144, 255],
    firebrick: [178, 34, 34],
    floralwhite: [255, 250, 240],
    forestgreen: [34, 139, 34],
    fuchsia: [255, 0, 255],
    gainsboro: [220, 220, 220],
    ghostwhite: [248, 248, 255],
    gold: [255, 215, 0],
    goldenrod: [218, 165, 32],
    gray: [128, 128, 128],
    green: [0, 128, 0],
    greenyellow: [173, 255, 47],
    grey: [128, 128, 128],
    honeydew: [240, 255, 240],
    hotpink: [255, 105, 180],
    indianred: [205, 92, 92],
    indigo: [75, 0, 130],
    ivory: [255, 255, 240],
    khaki: [240, 230, 140],
    lavender: [230, 230, 250],
    lavenderblush: [255, 240, 245],
    lawngreen: [124, 252, 0],
    lemonchiffon: [255, 250, 205],
    lightblue: [173, 216, 230],
    lightcoral: [240, 128, 128],
    lightcyan: [224, 255, 255],
    lightgoldenrodyellow: [250, 250, 210],
    lightgray: [211, 211, 211],
    lightgreen: [144, 238, 144],
    lightgrey: [211, 211, 211],
    lightpink: [255, 182, 193],
    lightsalmon: [255, 160, 122],
    lightseagreen: [32, 178, 170],
    lightskyblue: [135, 206, 250],
    lightslategray: [119, 136, 153],
    lightslategrey: [119, 136, 153],
    lightsteelblue: [176, 196, 222],
    lightyellow: [255, 255, 224],
    lime: [0, 255, 0],
    limegreen: [50, 205, 50],
    linen: [250, 240, 230],
    magenta: [255, 0, 255],
    maroon: [128, 0, 0],
    mediumaquamarine: [102, 205, 170],
    mediumblue: [0, 0, 205],
    mediumorchid: [186, 85, 211],
    mediumpurple: [147, 112, 219],
    mediumseagreen: [60, 179, 113],
    mediumslateblue: [123, 104, 238],
    mediumspringgreen: [0, 250, 154],
    mediumturquoise: [72, 209, 204],
    mediumvioletred: [199, 21, 133],
    midnightblue: [25, 25, 112],
    mintcream: [245, 255, 250],
    mistyrose: [255, 228, 225],
    moccasin: [255, 228, 181],
    navajowhite: [255, 222, 173],
    navy: [0, 0, 128],
    oldlace: [253, 245, 230],
    olive: [128, 128, 0],
    olivedrab: [107, 142, 35],
    orange: [255, 165, 0],
    orangered: [255, 69, 0],
    orchid: [218, 112, 214],
    palegoldenrod: [238, 232, 170],
    palegreen: [152, 251, 152],
    paleturquoise: [175, 238, 238],
    palevioletred: [219, 112, 147],
    papayawhip: [255, 239, 213],
    peachpuff: [255, 218, 185],
    peru: [205, 133, 63],
    pink: [255, 192, 203],
    plum: [221, 160, 221],
    powderblue: [176, 224, 230],
    purple: [128, 0, 128],
    rebeccapurple: [102, 51, 153],
    red: [255, 0, 0],
    rosybrown: [188, 143, 143],
    royalblue: [65, 105, 225],
    saddlebrown: [139, 69, 19],
    salmon: [250, 128, 114],
    sandybrown: [244, 164, 96],
    seagreen: [46, 139, 87],
    seashell: [255, 245, 238],
    sienna: [160, 82, 45],
    silver: [192, 192, 192],
    skyblue: [135, 206, 235],
    slateblue: [106, 90, 205],
    slategray: [112, 128, 144],
    slategrey: [112, 128, 144],
    snow: [255, 250, 250],
    springgreen: [0, 255, 127],
    steelblue: [70, 130, 180],
    tan: [210, 180, 140],
    teal: [0, 128, 128],
    thistle: [216, 191, 216],
    tomato: [255, 99, 71],
    turquoise: [64, 224, 208],
    violet: [238, 130, 238],
    wheat: [245, 222, 179],
    white: [255, 255, 255],
    whitesmoke: [245, 245, 245],
    yellow: [255, 255, 0],
    yellowgreen: [154, 205, 50],
  },
};

const Context = {
  extendContext: function(context) {
    for (const method in Context) {
      context[method] = Context[method];
    }
  },

  setShadow: function(color, offsetX, offsetY, blur) {
    this.shadowColor = color;

    this.shadowOffsetX = offsetX;
    this.shadowOffsetY = offsetY;
    this.shadowBlur = blur;
  },

  plot: function(x, y) {
    this.save();
    this.translate(x, y);
    this.fillRect(x - 0.5, y - 0.5, 1, 1);
    this.restore();
  },

  line: function(x0, y0, x1, y1) {
    this.beginPath();
    this.moveTo(x0, y0);
    this.lineTo(x1, y1);
    this.stroke();
  },

  lineThrough: function(x0, y0, x1, y1, overlap) {
    this.save();
    this.translate(x0, y0);
    this.rotate(Math.atan2(y1 - y0, x1 - x0));
    const dx = x1 - x0;
    const dy = y1 - y0;
    const p2 = Math.sqrt(dx * dx + dy * dy);
    this.beginPath();
    this.moveTo(-overlap, 0);
    this.lineTo(p2 + overlap, 0);
    this.stroke();
    this.restore();
  },

  ray: function(x, y, angle, offset, length) {
    this.save();
    this.translate(x, y);
    this.rotate(angle);
    this.beginPath();
    this.moveTo(offset, 0);
    this.lineTo(offset + length, 0);
    this.stroke();
    this.restore();
  },

  roundRect: function(x, y, w, h, r) {
    this.moveTo(x + r, y);
    this.lineTo(x + w - r, y);
    this.arc(x + w - r, y + r, r, -Math.PI / 2, 0);
    this.lineTo(x + w, y + h - r);
    this.arc(x + w - r, y + h - r, r, 0, Math.PI / 2);
    this.lineTo(x + r, y + h);
    this.arc(x + r, y + h - r, r, Math.PI / 2, Math.PI);
    this.lineTo(x, y + r);
    this.arc(x + r, y + r, r, Math.PI, -Math.PI / 2);
  },

  fillRoundRect: function(x, y, w, h, r) {
    this.beginPath();
    this.round(x, y, w, h, r);
    this.fill();
  },

  strokeRoundRect: function(x, y, w, h, r) {
    this.beginPath();
    this.roundRect(x, y, w, h, r);
    this.stroke();
  },

  circle: function(x, y, r) {
    this.arc(x, y, r, 0, Math.PI * 2);
  },

  strokeCircle: function(x, y, r) {
    this.beginPath();
    this.circle(x, y, r);
    this.stroke();
  },

  fillCircle: function(x, y, r) {
    this.beginPath();
    this.circle(x, y, r);
    this.fill();
  },

  ellipse: function(x, y, xr, yr) {
    if (xr === 0 || yr === 0) {
      return;
    }
    this.save();
    this.translate(x, y);
    this.scale(xr, yr);
    this.circle(0, 0, 1);
    this.restore();
  },

  fillEllipse: function(x, y, xr, yr) {
    this.beginPath();
    this.ellipse(x, y, xr, yr);
    this.fill();
  },

  strokeEllipse: function(x, y, xr, yr) {
    this.beginPath();
    this.ellipse(x, y, xr, yr);
    this.stroke();
  },

  path: function(points, close) {
    points.forEach(p => {
      this.lineTo(p.x, p.y);
    });
    if (close) {
      this.closePath();
    }
  },

  fillPath: function(points, close) {
    this.beginPath();
    this.path(points, close);
    this.fill();
  },

  strokePath: function(points, close) {
    this.beginPath();
    this.path(points, close);
    this.stroke();
  },

  polygon: function(x, y, r, sides, rotation) {
    this.save();
    this.translate(x, y);
    this.rotate(rotation);
    this.moveTo(r, 0.0);
    for (let i = 0; i < sides; i++) {
      const angle = Math.PI * 2 / sides * i;
      this.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
    }
    this.lineTo(r, 0.0);
    this.restore();
  },

  strokePolygon: function(x, y, r, sides, rotation) {
    this.beginPath();
    this.polygon(x, y, r, sides, rotation);
    this.stroke();
  },

  fillPolygon: function(x, y, r, sides, rotation) {
    this.beginPath();
    this.polygon(x, y, r, sides, rotation);
    this.fill();
  },

  star: function(x, y, r0, r1, points, rotation) {
    this.save();
    this.translate(x, y);
    this.rotate(rotation);
    for (let i = 0; i < points * 2; i++) {
      let r = r1;
      if (i % 2 === 0) {
        r = r0;
      }
      const angle = Math.PI / points * i;
      this.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
    }
    this.closePath();
    this.restore();
  },

  strokeStar: function(x, y, r0, r1, points, rotation) {
    this.beginPath();
    this.star(x, y, r0, r1, points, rotation);
    this.stroke();
  },

  fillStar: function(x, y, r0, r1, points, rotation) {
    this.beginPath();
    this.star(x, y, r0, r1, points, rotation);
    this.fill();
  },

  fractalLine: function(x0, y0, x1, y1, roughness, iterations) {
    const dx = x1 - x0;
    const dy = y1 - y0;
    let offset = Math.sqrt(dx * dx + dy * dy) * 0.15;
    let path = [
      { x: x0, y: y0 },
      { x: x1, y: y1 },
    ];

    for (let i = 0; i < iterations; i++) {
      const newPath = [];
      path.forEach(( point, index) => {
        newPath.push(point);
        if (index < path.length - 1) {
          const x = (point.x + path[index + 1].x) / 2 + Math.random() * offset * 2 - offset;
          const y = (point.y + path[index + 1].y) / 2 + Math.random() * offset * 2 - offset;
          newPath.push({ x: x, y: y});
        }
      });
      offset *= roughness;
      path = newPath;
    }
    this.path(path);
  },

  strokeFractalLine: function(x0, y0, x1, y1, roughness, iterations) {
    this.beginPath();
    this.fractalLine(x0, y0, x1, y1, roughness, iterations);
    this.stroke();
  },

  heart: function(x, y, w, h, rotation) {
    const path = [];
    const res = Math.sqrt(w * h);

    this.save();
    this.translate(x, y);
    this.rotate(rotation);
    for (let i = 0; i < res; i++) {
      const a = Math.PI * 2 * i / res;
      const xx = w * Math.pow(Math.sin(a), 3);
      const yy = -h * (0.8125 * Math.cos(a) - 0.3125 * Math.cos(2 * a) - 0.125 * Math.cos(3 * a) - 0.0625 * Math.cos(4 * a));
      path.push({ x: xx, y: yy });
    }
    this.path(path);
    this.restore();
  },

  strokeHeart: function(x, y, w, h, rotation) {
    this.beginPath();
    this.heart(x, y, w, h, rotation);
    this.stroke();
  },

  fillHeart: function(x, y, w, h, rotation) {
    this.beginPath();
    this.heart(x, y, w, h, rotation);
    this.fill();
  },

  points: function(points, radius) {
    points.forEach(p => {
      this.fillCircle(p.x, p.y, radius);
    });
  },

  multiCurve: function(points) {
    this.moveTo(points[0].x, points[0].y);
    this.lineTo(
      (points[0].x + points[1].x) / 2,
      (points[0].y + points[1].y) / 2
    );
    for (let i = 1; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const midx = (p0.x + p1.x) / 2;
      const midy = (p0.y + p1.y) / 2;
      this.quadraticCurveTo(p0.x, p0.y, midx, midy);
    }
    const p = points[points.length - 1];
    this.lineTo(p.x, p.y);
  },

  strokeMultiCurve: function(points) {
    this.beginPath();
    this.multiCurve(points);
    this.stroke();
  },

  multiLoop: function(points) {
    const pA = points[0];
    const pZ = points[points.length - 1];
    const mid1x = (pZ.x + pA.x) / 2;
    const mid1y = (pZ.y + pA.y) / 2;
    this.moveTo(mid1x, mid1y);
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const midx = (p0.x + p1.x) / 2;
      const midy = (p0.y + p1.y) / 2;
      this.quadraticCurveTo(p0.x, p0.y, midx, midy);
    }
    this.quadraticCurveTo(pZ.x, pZ.y, mid1x, mid1y);
  },

  strokeMultiLoop: function(points) {
    this.beginPath();
    this.multiLoop(points);
    this.stroke();
  },

  fillMultiLoop: function(points) {
    this.beginPath();
    this.multiLoop(points);
    this.fill();
  },

  grid: function(x, y, w, h, xres, yres) {
    this.beginPath();
    for (let xx = x; xx < x + w; xx += xres) {
      this.moveTo(xx, y);
      this.lineTo(xx, y + h);
    }
    for (let yy = y; yy < y + h; yy += yres) {
      this.moveTo(x, yy);
      this.lineTo(x + w, yy);
    }
    this.stroke();
  },

  hexGrid: function(x, y, w, h, res0, res1) {
    const sin60r = Math.sin(Math.PI / 3) * res0;
    const xInc = 2 * sin60r;
    const yInc = res0 * 1.5;
    let offset = 0;

    for (let yy = y; yy < y + h + yInc; yy += yInc) {
      for (let xx = x; xx < x + w + xInc; xx += xInc) {
        this.polygon(xx + offset, yy, res1, 6, Math.PI / 2);
      }
      if (offset === 0) {
        offset = sin60r;
      } else {
        offset = 0;
      }
    }
  },

  strokeHexGrid: function(x, y, w, h, res0, res1) {
    this.save();
    this.rect(x, y, w, h);
    this.clip();
    this.beginPath();
    this.hexGrid(x, y, w, h, res0, res1);
    this.stroke();
    this.restore();
  },

  fillHexGrid: function(x, y, w, h, res0, res1) {
    this.save();
    this.rect(x, y, w, h);
    this.clip();
    this.beginPath();
    this.hexGrid(x, y, w, h, res0, res1);
    this.fill();
    this.restore();
  },

  clearRGB: function(r, g, b) {
    this.save();
    this.setTransform(1, 0, 0, 1, 0, 0);
    this.fillStyle = `rgb(${r}, ${g}, ${b})`;
    this.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.restore();
  },

  clearWhite: function() {
    this.clearRGB(255, 255, 255);
  },

  clearBlack: function() {
    this.clearRGB(0, 0, 0);
  },

  clearGrey: function(g) {
    this.clearRGB(g, g, g);
  },

  clearColor(color) {
    this.save();
    this.setTransform(1, 0, 0, 1, 0, 0);
    this.fillStyle = color.toString();
    this.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.restore();
  },

  setFillRGB: function(r, g, b) {
    this.fillStyle = Color.rgb(r, g, b).toString();
  },

  setFillHSV: function(h, s, v) {
    this.fillStyle = Color.hsv(h, s, v).toString();
  },

  setStrokeRGB: function(r, g, b) {
    this.strokeStyle = Color.rgb(r, g, b).toString();
  },

  setStrokeHSV: function(h, s, v) {
    this.strokeStyle = Color.hsv(h, s, v).toString();
  },

  getPixel: function(x, y) {
    const data = this.getImageData(x, y, 1, 1);
    return `rgba(${data.data[0]}, ${data.data[1]}, ${data.data[2]}, ${data.data[3]}`;
  },

  getAspectRatio: function() {
    return this.canvas.width / this.canvas.height;
  },

};

/**
 * Creates a new Canvas HTML element with an extended context.
 */
class Canvas {
  /**
   * Constructor
   * @param {object} parent - The HTML element to add this canvas to.
   * @param {number} width - The width of the canvas.
   * @param {number} height - The height of the canvas.
   */
  constructor(parent, width, height) {
    this.width = width || window.innerWidth;
    this.height = height || window.innerHeight;
    this.canvas = document.createElement("canvas");
    this.canvas.style.display = "block";
    parent && parent.appendChild(this.canvas);
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.context = this.canvas.getContext("2d");
    Context.extendContext(this.context);
  }

  /**
   * Sets the size of the canvas.
   * @param {number} width - The width of the canvas.
   * @param {number} height - The height of the canvas.
   */
  setSize(width, height) {
    this.canvas.width = this.width = width;
    this.canvas.height = this.height = height;
  }
}

class DragPoint {
  constructor(x, y, context2d, moveHandler) {
    this.x = x;
    this.y = y;
    this.context = context2d;
    this.canvas = this.context.canvas;
    this.moveHandler = moveHandler;
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.canvas.addEventListener("mousedown", this.onMouseDown);
    this.snap = false;
    this.gridSize = 10;
  }

  render() {
    this.context.save();
    this.context.translate(this.x, this.y);
    this.context.fillStyle = "rgba(0, 0, 0, 0.1)";
    this.context.strokeStyle = "#999";
    this.context.lineWidth = 0.5;
    this.context.fillCircle(0, 0, 10);
    this.context.strokeCircle(0, 0, 10);
    this.context.strokeCircle(0, 0, 1);
    this.context.restore();
  }

  onMouseDown(event) {
    this.canvas.style.cursor = "pointer";
    const bounds = this.canvas.getBoundingClientRect();
    this.mouseX = event.clientX - bounds.left;
    this.mouseY = event.clientY - bounds.top;
    const dist = Num.dist(this.mouseX, this.mouseY, this.x, this.y);
    if (dist < 10) {
      this.offsetX = this.mouseX - this.x;
      this.offsetY = this.mouseY - this.y;
      document.addEventListener("mousemove", this.onMouseMove);
      document.addEventListener("mouseup", this.onMouseUp);
    }
  }

  onMouseMove(event) {
    const bounds = this.canvas.getBoundingClientRect();
    this.mouseX = event.clientX - bounds.left;
    this.mouseY = event.clientY - bounds.top;
    let x = this.mouseX - this.offsetX;
    let y = this.mouseY - this.offsetY;
    x = Math.min(x, this.canvas.width);
    x = Math.max(x, 0);
    y = Math.min(y, this.canvas.height);
    y = Math.max(y, 0);
    if (this.snap) {
      x = Math.round(x / this.gridSize) * this.gridSize;
      y = Math.round(y / this.gridSize) * this.gridSize;
    }
    this.x = x;
    this.y = y;
    this.moveHandler();
  }

  onMouseUp() {
    this.canvas.style.cursor = "default";
    document.removeEventListener("mousemove", this.onMouseMove);
    document.removeEventListener("mouseup", this.onMouseUp);
  }
}

class FPS {
  constructor(parent, x, y) {
    this._createElement(parent, x, y);
    this._frames = 0;
    this._fps = "...";
    this._sampleTimeSeconds = 1;
  }

  _createElement(parent, x, y) {
    this._el = document.createElement("div");
    this._el.style.font = "10px sans-serif";
    this._el.style.color = "#333";
    this._el.style.position = "absolute";
    this._el.style.left = x + "px";
    this._el.style.top = y + "px";
    parent.appendChild(this._el);
  }

  start() {
    if (this._started) {
      return;
    }
    this._started = true;
    this._frames = 0;
    this._interval = setInterval(() => {
      this._fps = this._frames / this._sampleTimeSeconds;
      this._frames = 0;
    }, this._sampleTimeSeconds * 1000);
  }

  stop() {
    if (!this._started) {
      return;
    }
    clearInterval(this._interval);
  }

  logFrame() {
    this._frames++;
    this._el.textContent = "FPS: " + this._fps;
  }
}

const Noise = {
  perlin1(x) {
    return Noise.perlin(x, 0, 0);
  },

  // Perlin2 is 2d perlin noise
  perlin2(x, y) {
    return Noise.perlin(x, y, 0);
  },

  // Perlin is 3d perlin noise
  perlin(x, y, z) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);
    const u = Noise.fade(x);
    const v = Noise.fade(y);
    const w = Noise.fade(z);
    const A = Noise.p[X] + Y;
    const AA = Noise.p[A] + Z;
    const AB = Noise.p[A + 1] + Z;
    const B = Noise.p[X + 1] + Y;
    const BA = Noise.p[B] + Z;
    const BB = Noise.p[B + 1] + Z;
    return Noise.lerp(w, Noise.lerp(v, Noise.lerp(u, Noise.grad(Noise.p[AA], x, y, z),
      Noise.grad(Noise.p[BA], x - 1, y, z)),
    Noise.lerp(u, Noise.grad(Noise.p[AB], x, y - 1, z),
      Noise.grad(Noise.p[BB], x - 1, y - 1, z))),
    Noise.lerp(v, Noise.lerp(u, Noise.grad(Noise.p[AA + 1], x, y, z - 1),
      Noise.grad(Noise.p[BA + 1], x - 1, y, z - 1)),
    Noise.lerp(u, Noise.grad(Noise.p[AB + 1], x, y - 1, z - 1),
      Noise.grad(Noise.p[BB + 1], x - 1, y - 1, z - 1))));
  },

  fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  },

  lerp(t, a, b) {
    return a + t * (b - a);
  },

  grad(hash, x, y, z) {
    switch (hash & 15) {
    case 12:
      return x + y;
    case 14:
      return y - x;
    case 2:
      return x - y;
    case 3:
      return -x - y;
    case 4:
      return x + z;
    case 5:
      return z - x;
    case 6:
      return x - z;
    case 7:
      return -x - z;
    case 8:
      return y + z;
    case 13:
      return z - y;
    case 10:
      return y - z;
    }
    // case 11, 16:
    return -y - z;
  },

  p: [
    151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225,
    140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148,
    247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32,
    57, 177, 33, 88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175,
    74, 165, 71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122,
    60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54,
    65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169,
    200, 196, 135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64,
    52, 217, 226, 250, 124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212,
    207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170, 213,
    119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9,
    129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104,
    218, 246, 97, 228, 251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241,
    81, 51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31, 181, 199, 106, 157,
    184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254, 138, 236, 205, 93,
    222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180,
    151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225,
    140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148,
    247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32,
    57, 177, 33, 88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175,
    74, 165, 71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122,
    60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54,
    65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169,
    200, 196, 135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64,
    52, 217, 226, 250, 124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212,
    207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170, 213,
    119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9,
    129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104,
    218, 246, 97, 228, 251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241,
    81, 51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31, 181, 199, 106, 157,
    184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254, 138, 236, 205, 93,
    222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180,
  ],

  // PerlinOct creates Perlin noise with given number of octaves.
  // persistence does well at 0.5 to start with.
  perlinOct(x, y, z, octaves, persistence) {
    let total = 0.0;
    let frequency = 1.0;
    let amplitude = 1.0;
    let maxValue = 0.0; // Used for normalizing result to -1.0 - 1.0
    for (let i = 0; i < octaves; i++) {
      total += Noise.perlin(x * frequency, y * frequency, z * frequency) * amplitude;

      maxValue += amplitude;

      amplitude *= persistence;
      frequency *= 2;
    }

    return total / maxValue;
  },
};

const Utils = {
  fillArray: function(count, func, ...args) {
    const result = [];
    for (let i = 0; i < count; i++) {
      result.push(func(...args));
    }
    return result;
  },

};

const version = "1.1.0";

export { Anim, Canvas, Color, Context, DragPoint, FPS, Noise, Num, Random, Utils, version };
