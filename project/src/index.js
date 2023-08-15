import p5 from 'p5';

// General options
let start;
let width;
let height;
let buffer;
let buffer_width;
let buffer_height;
let fullscreen_ratio;
let palette;
let palettes;
let point_count;
let early_stop;

// Star options
let star;
let star_repeat;
let star_ray_len;
let star_point_count;
let star_size_px;
let star_size_px_min;
let star_size_px_max;
let max_star_iter;

// Beam options
let arc_count;
let arc_point_count;
let start_off;
let end_x_off;
let end_y_off;
let max_arch_iter;
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
      'Summer in space': [45, 45],
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

    // Parse URL params
    const sp = new URLSearchParams(window.location.search);
    const requested_width = sp.get("w");
    if (requested_width) console.log('Requested rendering width is', requested_width, 'px');
    // Determine buffer dimentions early, to use that for point count calculations
    buffer_width = 2560;
    if (requested_width) buffer_width = requested_width;
    fullscreen_ratio = 9/16;
    buffer_height = Math.floor(buffer_width*fullscreen_ratio);

    // Determine beam features
    let arc_counts = [4, 4, 8, 16, 24, 32, 32, 48, 64, 64, 128, 128];
    arc_count = arc_counts[Math.floor(fxrand() * arc_counts.length)];
    let arc_point_count_min = 4000 * (buffer_width/1000);
    let arc_point_count_max = 16000 * (buffer_width/1000);
    arc_point_count = Math.floor(p5.map(fxrand(), 0, 1, arc_point_count_min, arc_point_count_max));
    max_point_amplitude = buffer_width / 60;

    // Determine star features
    star = fxrand() < 0.8 ? true : false;
    let star_repeat_opts = [256, 512, 1024];
    star_repeat = star_repeat_opts[Math.floor(fxrand() * star_repeat_opts.length)];
    let star_ray_len_opts = [0, 0.05, 0.1, 0.15, 0.2, 0.25];
    star_ray_len = star_ray_len_opts[Math.floor(fxrand() * star_ray_len_opts.length)];
    star_point_count = p5.map(star_ray_len, 0, 0.25, 1280, 10240);

    // Determine star size
    let star_size = 'Small';
    if ((star_repeat === 1024 && star_ray_len >= 0.2) ||
      (star_repeat === 512 && star_ray_len === 0.25)) {
      star_size = 'Massive';
    } else if ((star_repeat === 1024 && star_ray_len >= 0.1) ||
      (star_repeat === 512 && star_ray_len >= 0.15)) {
      star_size = 'Big';
    } else if ((star_repeat === 1024) ||
      (star_repeat === 512 && star_ray_len >= 0.1) ||
      (star_repeat === 256 && star_ray_len >= 0.15)) {
      star_size = 'Medium';
    }

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
      'Beam density': arc_point_count/arc_point_count_max <= 0.3 ? 'Light' : arc_point_count/arc_point_count_max <= 0.6 ? 'Medium' : 'Dense',
    }
    $fx.features(features);

    // Reduce the size a tiny bit to avoid scrollbars
    width = window.innerWidth * 0.99;
    height = window.innerHeight * 0.99;
    p5.createCanvas(width, height);
    console.log('Rendering at', width, 'x', height);
    p5.pixelDensity(1);

    // Create a buffer to draw everything to
    buffer = p5.createGraphics(buffer_width, buffer_height, p5.WEBGL);
    console.log('Created buffer at', buffer.width, 'x', buffer.height);
    buffer.pixelDensity(1);

    buffer.colorMode(p5.HSB, 360, 100, 100, 1.0);
    buffer.setAttributes('antialias', true);
    p5.frameRate(60);
    // This helps with rotation logic
    buffer.angleMode(p5.DEGREES);

    // Iteration details to console
    for (const key in features) {
      if (features.hasOwnProperty(key)) {
        console.log(key, ': ', features[key]);
      }
    }
    show_progress(1);
    draw_bg(buffer);
    show_progress(5);
    draw_star_body(buffer);
    show_progress(10);
  }

  // Draw dark twinkling star background
  function draw_bg(b) {
    b.background('black');

    b.push();
    // Translate to upper left corner to use regular x,y coordinates
    b.translate(-b.width / 2, -b.height / 2);

    // Dark but not black, and slightly transparent
    b.noStroke()
    b.fill(240, 80, 10, 0.8);
    b.rect(0, 0, b.width, b.height);

    // Compute number of background stars
    let bg_point_count = Math.floor(b.width * b.height * 0.0025);

    // Draw each background star
    for (let i = 0; i < bg_point_count; i++) {
      let x = fxrand() * b.width;
      let y = fxrand() * b.height;
      if (i < bg_point_count * 0.9) b.stroke(0, 0, p5.map(fxrand(), 0, 1, 35, 70), 0.9);
      else b.stroke(240, 90, p5.map(fxrand(), 0, 1, 50, 100), 0.9);
      b.strokeWeight(2);
      b.point(x, y);
      point_count++;
    }
    b.pop();
  }

  function draw_arcs(b, iter) {
    b.noFill();
    b.strokeWeight(2);

    let hue = palettes[palette][1];

    let batch_size = arc_point_count / max_arch_iter;

    // Draw a portion of the arcs, determined by 'iter' argument
    let start_t = ((iter - 1) * batch_size) / arc_point_count;
    let end_t = iter * batch_size / arc_point_count;

    b.push();
    let len = b.width * 0.5;
    for (let i = 0; i < arc_count; i++) {
      for (let t = start_t; t < end_t; t += 1 / arc_point_count) {
        let x = b.bezierPoint(-len * start_off, len, len, len * end_x_off, t);
        let y = b.bezierPoint(-len * start_off, 0, len, len * end_y_off, t);

        if (x < b.width && y < b.height) {
          // Fade colors based on distance to center
          let fade = 1.2 * Math.floor(b.dist(x, y, 0, 0), 0, b.width * 1.1, 1, 0);
          b.stroke(hue, 80, 100 * fade, 0.9);

          // Perturb the location a bit, based on distance to center
          let amplitude = p5.map(b.dist(x, y, 0, 0), 0, b.width * 1.2, 1, max_point_amplitude);
          let off = amplitude * p5.map(fxrand(), 0, 1, -1, 1);
          b.point(x + off, y - off);
          point_count++;
        } else {
          early_stop = true;
          break;
        }
      }

      b.rotate(360 / arc_count)
      if (early_stop) break;
    }
    b.pop();
  }

  function draw_star(b, iter) {
    if (iter > max_star_iter) return;

    b.noFill();
    b.strokeWeight(2);

    let hue = palettes[palette][0];

    b.push();
    let start_t;
    let end_t;

    for (let i = 0; i < star_repeat; i++) {
      // Make length vary a bit
      let len = b.width * 0.2 + p5.map(fxrand(), 0, 1, -b.width * 0.05, b.width * star_ray_len);

      // Draw a portion determined by 'iter' argument
      end_t = p5.map(iter, 0, max_star_iter, 0, 1);
      start_t = Math.max(0, end_t - 1/max_star_iter);

      for (let t = start_t; t < end_t; t += 1 / star_point_count) {
        let x = b.bezierPoint(start_off, 0, 0, len, t);
        let y = b.bezierPoint(start_off, 0, 0, len, t);

        // Fade colors based on distance to center
        let fade = p5.map(b.dist(0, 0, x, y), 0, b.width / 2, 1, 0.4);
        b.stroke(hue, 90, 90 * fade, 0.6);

        // Perturb the location a bit, based on distance to center
        let amplitude = 1.2 * p5.map(p5.dist(0, 0, x, y), 0, b.width * 1.1, 2, 8);
        let off = amplitude * p5.map(fxrand(), 0, 1, -1, 1);
        b.point(x + off, y + off);
        point_count++;
      }
      b.rotate(360 / star_repeat);
    }
    b.pop();
  }

  function draw_star_body(b) {
    // Draw solid star body in same color as star light rays
    star_size_px_min = Math.floor(b.width/20);
    star_size_px_max = Math.floor(b.width/4);
    star_size_px = p5.map(start_off, 0.03, 0.4, star_size_px_min, star_size_px_max);

    if (star) {
      b.push();
      b.noStroke();
      b.fill(palettes[palette][0], 90, 90, 0.8);
      b.circle(0, 0, star_size_px);
      b.pop();
    }
  }

  p5.draw = function () {
    let progress = Math.round(p5.map(p5.frameCount, 1, max_star_iter, 10, 100));
    show_progress(progress);

    if (star) draw_star(buffer, p5.frameCount);
    if (p5.frameCount > max_star_iter) {
      draw_arcs(buffer, p5.frameCount - max_star_iter);
      show_buffer(buffer);
    }

    if (p5.frameCount >= (max_arch_iter+max_star_iter) || early_stop) {
      // end animation and call fxpreview
      show_buffer(buffer);
      p5.noLoop();
      fxpreview();

      const execution_time = Date.now() - start;
      console.log(`Total execution time: ${execution_time / 1000} seconds`);
    }
  }

  // Show the buffer on screen
  function show_buffer(b) {
    p5.push();
    p5.background('black');
    // Center the image on screen
    let x = 0;
    let y = (height - width*fullscreen_ratio)/2;
    p5.image(b, x, y, width, width*fullscreen_ratio);
    p5.pop();
  }

  function show_progress(amount) {
    p5.background('black');
    p5.textFont('Verdana');
    p5.textAlign(p5.CENTER);
    p5.textSize(Math.floor(48*window.innerHeight/1000));
    p5.fill('white');
    p5.stroke('white');
    p5.text('Stargazing by Ethspresso', innerWidth/2, innerHeight/2);
    p5.textSize(Math.floor(32*window.innerHeight/1000));
    p5.text(amount + '%', innerWidth/2, innerHeight/2 + Math.floor(64*window.innerHeight/1000))
  }

  // function to save an output with the unique hash as the filename,
  // when the user presses 's' (upper or lower-case)
  p5.keyTyped = function (e) {
    const keyS = 83;
    const keys = 115;
    if (e.keyCode === keyS || e.keyCode === keys) {
      p5.saveCanvas(buffer, fxhash + '_' + buffer.width + 'x' + buffer.height, 'jpg')
    }
    return false; // prevent any unwanted default browser behaviour
  }

  p5.windowResized = function () {
    width = Math.floor(window.innerWidth);
    height = Math.floor(window.innerHeight);
    p5.resizeCanvas(width, height);
    console.log('Resized to', width, 'x', height);
    show_buffer(buffer);
  }
}

new p5(sketch, window.document.body);
