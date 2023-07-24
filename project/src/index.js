import p5 from 'p5';

// General options
let start;
let width;
let height;
let palette;
let palettes;
let arcs;
let star;
let max_arch_iter;
let max_star_iter;
let point_count;
let early_stop;

// Star options
let star_repeat;
let star_ray_len;
let star_point_count;
let star_size_px;
let star_size_px_min;
let star_size_px_max;

// Beam options
let arc_count;
let arc_point_count;
let start_off;
let end_x_off;
let end_y_off;
let max_point_amplitude;
let twistyness;

let sketch = function (p5) {

  p5.setup = function () {
    start = Date.now();
    max_arch_iter = 90;
    max_star_iter = 60;
    point_count = 0;
    early_stop = false;

    // You know, the colours
    palettes = {
      'Red dwarf': [0, 45],
      'Orange dwarf': [0, 30],
      'Into the matrix': [15, 45],
      'The core': [15, 30],
      'Burning': [30, 45],
      'A summer day': [45, 45],
      'The vast universe': [215, 45],
      'Expanding': [215, 30],
      'Neptune': [240, 45],
      'Shining bright': [240, 15],
      'Gold': [240, 30],
      'Wild and furious': [300, 45],
      'Nebula': [300, 30],
      'Forever and ever': [330, 45],
      'Is it real': [330, 30],
    }
    let paletteNames = Object.keys(palettes);
    palette = paletteNames[Math.floor(fxrand() * paletteNames.length)];

    // Determine features
    arcs = true;
    star = fxrand() < 0.8 ? true : false;

    // Arc features
    let arc_counts = [4, 4, 8, 16, 24, 32, 32, 48, 64, 64, 128, 128];
    arc_count = arc_counts[Math.floor(fxrand() * arc_counts.length)];
    let arc_point_options = [1024, 2048, 3072, 4096];
    arc_point_count = arc_point_options[Math.floor(p5.map(fxrand(), 0, 1, 0, arc_point_options.length))];
    max_point_amplitude = window.innerWidth / 60;

    // Star features
    let star_repeat_opts = [128, 256, 512];
    star_repeat = star_repeat_opts[Math.floor(fxrand() * star_repeat_opts.length)];
    let star_ray_len_opts = [0, 0.05, 0.1, 0.15, 0.2, 0.25];
    star_ray_len = star_ray_len_opts[Math.floor(fxrand() * star_ray_len_opts.length)];
    star_point_count = p5.map(star_ray_len, 0, 0.25, 128, 1024);
    star_point_count *= 10;

    // Determine star size
    let star_size = 'Small';
    if ((star_repeat === 512 && star_ray_len >= 0.2) ||
      (star_repeat === 256 && star_ray_len === 0.25)) {
      star_size = 'Massive';
    } else if ((star_repeat === 512 && star_ray_len >= 0.1) ||
      (star_repeat === 256 && star_ray_len >= 0.15)) {
      star_size = 'Big';
    } else if ((star_repeat === 512) ||
      (star_repeat === 256 && star_ray_len >= 0.1) ||
      (star_repeat === 128 && star_ray_len >= 0.15)) {
      star_size = 'Medium';
    }

    // More jazz
    star_repeat *= 2;

    // Lower value of end_x_off causes more angled lines
    end_x_off = p5.map(fxrand(), 0, 1, -3, 5);
    end_y_off = p5.map(fxrand(), 0, 1, 2, 5);
    // Determine feature value
    if (end_x_off < -1.5) twistyness = "Large";
    else if (end_x_off < 0.5) twistyness = "Medium";
    else if (end_x_off < 4.5) twistyness = "Small";
    else twistyness = "None";

    // Controls the amount of negative space in the middle
    switch (star_size) {
      case 'Small':
        start_off = p5.map(fxrand(), 0, 1, 0.03, 0.1);
        break;
      case 'Medium':
        start_off = p5.map(fxrand(), 0, 1, 0.1, 0.2);
        break;
      case 'Big':
        start_off = p5.map(fxrand(), 0, 1, 0.2, 0.3);
        break;
      case 'Massive':
        start_off = p5.map(fxrand(), 0, 1, 0.3, 0.4);
        break;
      default:
        // 'No star' variants can be any size
        start_off = p5.map(fxrand(), 0, 1, 0.03, 0.4);
        break;
    }

    // fx(hash) features must be set before drawing a single pixel on the screen
    const features = {
      'Color palette': palette,
      'Star size': star ? star_size : 'No star',
      'Pitch angle': twistyness,
      'Beam count': arc_count,
      'Beam density': arc_point_count <= 1024 ? 'Light' : arc_point_count <= 2048 ? 'Medium' : 'Dense',
    }
    $fx.features(features);

    width = window.innerWidth;
    height = window.innerHeight;
    p5.createCanvas(width, height, p5.WEBGL);
    console.log('Rendering at', width, 'x', height);

    p5.colorMode(p5.HSB, 360, 100, 100, 1.0);
    p5.setAttributes('antialias', true);
    p5.frameRate(60);
    // This helps with rotation logic
    p5.angleMode(p5.DEGREES);

    // Iteration details to console
    for (const key in features) {
      if (features.hasOwnProperty(key)) {
        console.log(key, ': ', features[key]);
      }
    }

    draw_bg();
    draw_star_body();
  }

  // Draw dark twinkling star background
  function draw_bg() {
    p5.background('black');

    p5.push();
    // Translate to upper left corner to use regular x,y coordinates
    p5.translate(-width / 2, -height / 2);

    // Dark but not black, and slightly transparent
    p5.noStroke()
    p5.fill(240, 80, 10, 0.8);
    p5.rect(0, 0, width, height);

    // Compute number of background stars
    let bg_point_count = p5.floor(width * height * 0.0025);

    // Draw each background star
    for (let i = 0; i < bg_point_count; i++) {
      let x = fxrand() * width;
      let y = fxrand() * height;
      if (i < bg_point_count * 0.9) p5.stroke(0, 0, p5.map(fxrand(), 0, 1, 35, 70), 0.9);
      else p5.stroke(240, 90, p5.map(fxrand(), 0, 1, 50, 100), 0.9);
      p5.strokeWeight(2);
      p5.point(x, y);
      point_count++;
    }
    p5.pop();
  }

  function draw_arcs(iter) {
    p5.noFill();
    p5.strokeWeight(2);

    let hue = palettes[palette][1];

    let batch_size = arc_point_count / max_arch_iter;

    // Draw a portion of the arcs, determined by 'iter' argument
    let start_t = ((iter - 1) * batch_size) / arc_point_count;
    let end_t = iter * batch_size / arc_point_count;

    p5.push();
    let len = width * 0.5;
    for (let i = 0; i < arc_count; i++) {
      for (let t = start_t; t < end_t; t += 1 / arc_point_count) {
        let x = p5.bezierPoint(-len * start_off, len, len, len * end_x_off, t);
        let y = p5.bezierPoint(-len * start_off, 0, len, len * end_y_off, t);

        if (x < width && y < height) {
          // Fade colors based on distance to center
          let fade = 1.2 * Math.floor(p5.dist(x, y, 0, 0), 0, width * 1.1, 1, 0);
          p5.stroke(hue, 80, 100 * fade, 0.9);

          // Perturb the location a bit, based on distance to center
          let amplitude = p5.map(p5.dist(x, y, 0, 0), 0, width * 1.2, 1, max_point_amplitude);
          let off = amplitude * p5.map(fxrand(), 0, 1, -1, 1);
          p5.point(x + off, y - off);
          point_count++;
        } else {
          early_stop = true;
          break;
        }
      }

      p5.rotate(360 / arc_count)
      if (early_stop) break;
    }
    p5.pop();
  }

  function draw_star(iter) {
    if (iter > max_star_iter) return;

    p5.noFill();
    p5.strokeWeight(2);

    let hue = palettes[palette][0];

    p5.push();
    let start_t;
    let end_t;

    // Skip drawing star light rays inside this circle
    let skip_radius = Math.floor(star_size_px/3);

    for (let i = 0; i < star_repeat; i++) {
      // Make length vary a bit
      let len = width * 0.2 + p5.map(fxrand(), 0, 1, -width * 0.05, width * star_ray_len);

      // Draw a portion determined by 'iter' argument
      end_t = p5.map(iter, 0, max_star_iter, 0, 1);
      start_t = Math.max(0, end_t - 1/max_star_iter);

      for (let t = start_t; t < end_t; t += 1 / star_point_count) {
        let x = p5.bezierPoint(start_off, 0, 0, len, t);
        let y = p5.bezierPoint(start_off, 0, 0, len, t);
        if (x < skip_radius && y < skip_radius) continue;

        // Fade colors based on distance to center
        let fade = p5.map(p5.dist(0, 0, x, y), 0, width / 2, 1, 0.4);
        p5.stroke(hue, 90, 90 * fade, 0.6);

        // Perturb the location a bit, based on distance to center
        let amplitude = 1.2 * p5.map(p5.dist(0, 0, x, y), 0, width * 1.1, 2, 8);
        let off = amplitude * p5.map(fxrand(), 0, 1, -1, 1);
        p5.point(x + off, y + off);
        point_count++;
      }
      p5.rotate(360 / star_repeat)
    }
    p5.pop();
  }

  function draw_star_body() {
    // Draw solid star body in same color as star light rays
    star_size_px_min = Math.floor(width/20);
    star_size_px_max = Math.floor(width/4);
    star_size_px = p5.map(start_off, 0.03, 0.4, star_size_px_min, star_size_px_max);

    if (star) {
      p5.fill(palettes[palette][0], 90, 90, 0.8);
      p5.circle(0, 0, star_size_px);
    }
  }

  p5.draw = function () {
    if (star) draw_star(p5.frameCount);
    if (p5.frameCount > max_star_iter) {
      draw_arcs(p5.frameCount - max_star_iter);
    }

    if (p5.frameCount >= (max_arch_iter+max_star_iter) || early_stop) {
      // end animation and call fxpreview
      p5.noLoop();
      fxpreview();

      const execution_time = Date.now() - start;
      console.log(`Total execution time: ${execution_time / 1000} seconds`);
    }
  }

  // function to save an output with the unique hash as the filename,
  // when the user presses 's' (upper or lower-case)
  p5.keyTyped = function (e) {
    const keyS = 83;
    const keys = 115;
    if (e.keyCode === keyS || e.keyCode === keys) {
      p5.saveCanvas(fxhash, 'png');
    }
    return false; // prevent any unwanted default browser behaviour
  }

  p5.windowResized = function () {
    width = window.innerWidth;
    height = window.innerHeight;
    p5.resizeCanvas(width, height);
    console.log('Resized to', width, 'x', height);

    start = Date.now();
    p5.frameCount = 1;
    early_stop = false;
    draw_bg();
    draw_star_body();
    p5.loop();
    p5.draw();
  }
}

new p5(sketch, window.document.body);
