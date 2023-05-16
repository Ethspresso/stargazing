import p5 from "p5";

let start;

// General options
let palette;
let palettes;
let arcs;
let star;
let max_iter;
let point_count;
let early_stop;

// Star options
let star_repeat;
let star_ray_len;
let star_points;

// Arc options
let arc_count;
let arc_point_count;
let start_off;
let end_x_off;
let end_y_off;

let width;
let height

console.log('Current hash', fxhash);

const sp = new URLSearchParams(window.location.search);
//console.log(sp);

let sketch = function(p5) {

    p5.setup = function() {
        start = Date.now();
        max_iter = 90;
        point_count = 0;
        early_stop = false;
        
        // You know, the colours
        palettes = {
        "Red dwarf": [0, 45],
        "Orange dwarf": [0, 30],
        "Into the matrix": [15, 45],
        "The core": [15, 30],
        "Burning": [30, 45],
        "A summer day": [45, 45],
        "The vast universe": [215, 45],
        "Expanding": [215, 30],
        "Neptune": [240, 45],
        "Shining bright": [240, 15],
        "Gold": [240, 30],
        "Wild and furious": [300, 45],
        "Nebula": [300, 30],
        "Forever and ever": [330, 45],
        "Is it real": [330, 30],
        }

        // Determine features
        arcs = true;
        star = fxrand() > 0.8 ? true : false;

        // Arc features
        let arc_counts = [4, 4, 8, 16, 24, 32, 32, 48, 64, 64, 128, 128];
        let arc_count_idx = Math.floor(fxrand() * arc_counts.length);
        arc_count = arc_counts[arc_count_idx];

        let paletteNames = Object.keys(palettes);
        palette = paletteNames[Math.floor(fxrand() * paletteNames.length)];

        arc_point_count = fxrand() * 4096;
        // let density_names = { 1024: "Low", 2048: "Medium", 4096: "High" };

        // Star features
        star_repeat = fxrand([128, 256, 512]);
        star_ray_len = fxrand([0, 0.05, 0.1, 0.15, 0.2, 0.25]);
        star_points = Math.floor(star_ray_len, 0, 0.25, 128, 512);
        let star_size = "Small";
        if ((star_repeat === 512 && star_ray_len >= 0.2) ||
            (star_repeat === 256 && star_ray_len === 0.25)) {
            star_size = "Massive";
        } else if ((star_repeat === 512 && star_ray_len >= 0.1) ||
            (star_repeat === 256 && star_ray_len >= 0.15)) {
            star_size = "Big";
        } else if ((star_repeat === 512) ||
            (star_repeat === 256 && star_ray_len >= 0.1) ||
            (star_repeat === 128 && star_ray_len >= 0.15)) {
            star_size = "Medium";
        }

        // Lower values cause more angled lines
        end_x_off = fxrand(-3, 5);
        end_y_off = fxrand(2, 5);

        // Controls the amount of negative space in the middle
        switch (star_size) {
            case 'Small':
                start_off = fxrand(0.03, 0.1);
                break;
            case 'Medium':
                start_off = fxrand(0.1, 0.2);
                break;
            case 'Big':
                start_off = fxrand(0.2, 0.3);
                break;
            case 'Massive':
                start_off = fxrand(0.3, 0.4);
                break;
            default:
                // 'No star' variants can be any size
                start_off = fxrand(0.03, 0.4);
                break;
        }

        // fx(hash) features must be set before drawing a single pixel on the screen
        const features = {
            "Color palette": palette,
            "Has star": star,
            "Has beams": arcs,
            "Star size": star ? star_size : "No star",
            "Beam count": arc_count,
            "Beam density": arc_point_count < 1024 ? "Light" : arc_point_count < 2048 ? "Medium" : "Dense",
        }
        $fx.features(features);

        // define tunable parameters
        $fx.params([
        {
            id: "palette",
            name: "Palette",
            type: "select",
            options: {
            options: paletteNames
            }
        }
    ]);

    width = window.innerWidth;
    height = window.innerHeight;
    console.log('Rendering at', width, 'x', height);
    p5.createCanvas(width, height, p5.WEBGL);

    p5.colorMode(p5.HSB, 360, 100, 100, 1.0);
    p5.setAttributes('antialias', true);
    p5.frameRate(60);
    // This helps with rotation logic
    p5.angleMode(p5.DEGREES);

    // Iteration details to console
    console.log('fxhash:', fxhash);
        for (const key in features) {
            if (features.hasOwnProperty(key)) {
                console.log(key, ': ', features[key]);
            }
        }

    }

    // Draw dark twinkling star background
    function draw_bg() {
        p5.background("black");

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
            let x = fxrand(width);
            let y = fxrand(height);
            if (i < bg_point_count * 0.9) p5.stroke(0, 0, fxrand(10, 70), 0.9);
            else p5.stroke(240, 90, fxrand(25, 70), 0.9);
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

        let batch_size = arc_point_count / max_iter;

        // Draw a portion of the arcs, determined by 'iter' argument
        let start_t = ((iter - 1) * batch_size) / arc_point_count;
        let end_t = iter * batch_size / arc_point_count;

        p5.push();
        let angle = 0;
        let len = width * 0.5;
        for (let i = 0; i < arc_count; i++) {
            for (let t = start_t; t < end_t; t += 1 / arc_point_count) {
                let x = p5.bezierPoint(-len * start_off, len, len, len * end_x_off, t);
                let y = p5.bezierPoint(-len * start_off, 0, len, len * end_y_off, t);

                if (x < width && y < height) {
                    // Fade colors based on distance to center
                    let fade = 1.2 * Math.floor(p5.dist(0, 0, x, y), 0, width * 1.1, 1, 0);
                    p5.stroke(hue, 80, 100 * fade, 0.9);

                    // Perturb the location a bit, based on distance to center
                    let amplitude = 1.2 * Math.floor(p5.dist(0, 0, x, y), 0, width * 1.1, 2, 8);
                    let off = amplitude * fxrand(-1, 1);
                    p5.point(x + off, y + off);
                    point_count++;
                } else {
                    early_stop = true;
                    break;
                }
            }

            angle += 360 / arc_count;
            p5.rotate(angle)

            if (early_stop) break;
        }
        p5.pop();
    }

    function draw_star() {
        p5.noFill();
        p5.strokeWeight(2);

        let hue = palettes[palette][0];

        p5.push();
        let angle = 0;

        for (let i = 0; i < star_repeat; i++) {
            // Make length vary a bit
            let len = width * 0.2 + fxrand(-width * 0.05, width * star_ray_len);
            for (let t = 0; t < 1; t += 1 / star_points) {
                let x = p5.bezierPoint(-len * 0.01, 0, 0, len, t);
                let y = p5.bezierPoint(-len * 0.01, 0, 0, len, t);

                // Fade colors based on distance to center
                let fade = p5.map(p5.dist(0, 0, x, y), 0, width / 2, 1, 0.4);
                p5.stroke(hue, 90, 90 * fade, 0.6);

                // Perturb the location a bit, based on distance to center
                let amplitude = 1.2 * p5.map(p5.dist(0, 0, x, y), 0, width * 1.1, 2, 8);
                let off = amplitude * fxrand(-1, 1);
                p5.point(x + off, y + off);
                point_count++;
            }

            angle += 360 / star_repeat;
            p5.rotate(angle)
        }
        p5.pop();
    }

    p5.draw = function() {

        draw_bg();
        if (star) draw_star();

        if (arcs) draw_arcs(p5.frameCount);


        if ((arcs && p5.frameCount >= max_iter) || (!arcs && p5.frameCount === 1) || early_stop) {
            // end animation and call fxpreview
            p5.noLoop();
            fxpreview();

            const execution_time = Date.now() - start;
            console.log(`Total execution time: ${execution_time/1000} seconds`);
        }
    }

    // function to save an output, with a the unique hash as the filename (so you can always come back to it), 
    // when the user presses 's' (upper or lower-case)
    p5.keyTyped = function(e) {

        const keyS = 83;
        const keys = 115;
        if (e.keyCode === keyS || e.keyCode === keys) {
            p5.saveCanvas(fxhash, 'png');
        }
        return false; // prevent any unwanted default browser behaviour
    }

    p5.windowResized = function() {
        console.log("Resizing canvas to fit window");
        width = window.innerWidth;
        height = window.innerHeight;
        p5.resizeCanvas(width, height);
    }
}

new p5(sketch, window.document.body);