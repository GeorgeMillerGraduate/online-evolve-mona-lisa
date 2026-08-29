/* =========================================================
   MIDLIFE PROGRAMMER
   Evolve Mona Lisa
   EvolutionRenderer.js

   Responsible for rendering a Genome onto a HTML5 canvas.

   A Genome is represented by a background colour followed by
   a collection of translucent triangle genes.
   ========================================================= */


class EvolutionRenderer {


    /* =====================================================
       CONSTRUCTOR
       ===================================================== */

    constructor(canvas) {

        if (!canvas) {
            throw new Error(
                "EvolutionRenderer requires a canvas element."
            );
        }

        this.canvas = canvas;

        this.ctx =
            this.canvas.getContext(
                "2d",
                {
                    alpha: false
                }
            );

        if (!this.ctx) {
            throw new Error(
                "Unable to obtain 2D canvas context."
            );
        }


        this.width =
            this.canvas.width;

        this.height =
            this.canvas.height;


        /*
         * Temporary off-screen canvas.
         *
         * Fitness evaluation may use this later without
         * interfering with the canvas visible to the user.
         */

        this.bufferCanvas =
            document.createElement("canvas");

        this.bufferCanvas.width =
            this.width;

        this.bufferCanvas.height =
            this.height;

        this.bufferContext =
            this.bufferCanvas.getContext(
                "2d",
                {
                    willReadFrequently: true
                }
            );


        this.clear();

    }



    /* =====================================================
       SIZE
       ===================================================== */

    resize(width, height) {

        width =
            Math.max(
                1,
                Math.floor(width)
            );

        height =
            Math.max(
                1,
                Math.floor(height)
            );


        this.width =
            width;

        this.height =
            height;


        this.canvas.width =
            width;

        this.canvas.height =
            height;


        this.bufferCanvas.width =
            width;

        this.bufferCanvas.height =
            height;


        this.clear();
    }



    /* =====================================================
       CLEAR
       ===================================================== */

    clear() {

        this.ctx.save();

        this.ctx.globalAlpha = 1;

        this.ctx.globalCompositeOperation =
            "source-over";

        this.ctx.fillStyle =
            "#000000";

        this.ctx.fillRect(
            0,
            0,
            this.width,
            this.height
        );

        this.ctx.restore();
    }



    /* =====================================================
       RENDER GENOME
       ===================================================== */

    render(genome) {

        if (!genome) {

            this.clear();

            return;
        }


        this.renderToContext(
            genome,
            this.ctx
        );
    }



    /* =====================================================
       RENDER TO BUFFER
       ===================================================== */

    renderToBuffer(genome) {

        if (!genome) {
            return this.bufferCanvas;
        }


        this.renderToContext(
            genome,
            this.bufferContext
        );


        return this.bufferCanvas;
    }



    /* =====================================================
       CORE RENDERING
       ===================================================== */

    renderToContext(genome, context) {

        if (!context) {
            return;
        }


        context.save();


        /*
         * Reset anything a previous render may have changed.
         */

        context.setTransform(
            1,
            0,
            0,
            1,
            0,
            0
        );

        context.globalAlpha =
            1;

        context.globalCompositeOperation =
            "source-over";


        /* ===============================================
           BACKGROUND
           =============================================== */

        context.fillStyle =
            this.getBackgroundColour(
                genome
            );

        context.fillRect(
            0,
            0,
            this.width,
            this.height
        );


        /* ===============================================
           TRIANGLES
           =============================================== */

        const triangles =
            this.getTriangles(
                genome
            );


        for (
            let i = 0;
            i < triangles.length;
            i++
        ) {

            this.drawTriangle(
                context,
                triangles[i]
            );
        }


        context.restore();
    }



    /* =====================================================
       GET TRIANGLE ARRAY
       ===================================================== */

    getTriangles(genome) {

        if (
            Array.isArray(
                genome.triangles
            )
        ) {

            return genome.triangles;
        }


        if (
            Array.isArray(
                genome.genes
            )
        ) {

            return genome.genes;
        }


        if (
            typeof genome.getTriangles ===
            "function"
        ) {

            const result =
                genome.getTriangles();

            return Array.isArray(result)
                ? result
                : [];
        }


        if (
            typeof genome.getGenes ===
            "function"
        ) {

            const result =
                genome.getGenes();

            return Array.isArray(result)
                ? result
                : [];
        }


        return [];
    }



    /* =====================================================
       DRAW TRIANGLE
       ===================================================== */

    drawTriangle(context, triangle) {

        if (!triangle) {
            return;
        }


        const points =
            this.getTrianglePoints(
                triangle
            );


        if (
            !points ||
            points.length < 3
        ) {

            return;
        }


        const colour =
            this.getTriangleColour(
                triangle
            );


        context.beginPath();


        context.moveTo(
            this.toCanvasX(
                points[0].x
            ),
            this.toCanvasY(
                points[0].y
            )
        );


        context.lineTo(
            this.toCanvasX(
                points[1].x
            ),
            this.toCanvasY(
                points[1].y
            )
        );


        context.lineTo(
            this.toCanvasX(
                points[2].x
            ),
            this.toCanvasY(
                points[2].y
            )
        );


        context.closePath();


        context.fillStyle =
            `rgba(
                ${colour.r},
                ${colour.g},
                ${colour.b},
                ${colour.a}
            )`;


        context.fill();
    }



    /* =====================================================
       TRIANGLE POINTS
       ===================================================== */

    getTrianglePoints(triangle) {

        /*
         * Preferred representation:
         *
         * triangle.points = [
         *     { x, y },
         *     { x, y },
         *     { x, y }
         * ];
         */

        if (
            Array.isArray(
                triangle.points
            ) &&
            triangle.points.length >= 3
        ) {

            return triangle.points;
        }


        /*
         * Alternative:
         *
         * triangle.vertices
         */

        if (
            Array.isArray(
                triangle.vertices
            ) &&
            triangle.vertices.length >= 3
        ) {

            return triangle.vertices;
        }


        /*
         * Explicit coordinates:
         *
         * x1, y1
         * x2, y2
         * x3, y3
         */

        if (
            Number.isFinite(triangle.x1) &&
            Number.isFinite(triangle.y1) &&
            Number.isFinite(triangle.x2) &&
            Number.isFinite(triangle.y2) &&
            Number.isFinite(triangle.x3) &&
            Number.isFinite(triangle.y3)
        ) {

            return [

                {
                    x: triangle.x1,
                    y: triangle.y1
                },

                {
                    x: triangle.x2,
                    y: triangle.y2
                },

                {
                    x: triangle.x3,
                    y: triangle.y3
                }

            ];
        }


        /*
         * Named point objects.
         */

        if (
            triangle.p1 &&
            triangle.p2 &&
            triangle.p3
        ) {

            return [
                triangle.p1,
                triangle.p2,
                triangle.p3
            ];
        }


        return null;
    }



    /* =====================================================
       TRIANGLE COLOUR
       ===================================================== */

    getTriangleColour(triangle) {

        let r = 255;
        let g = 255;
        let b = 255;
        let a = 0.25;


        /* ===============================================
           colour object
           =============================================== */

        if (triangle.colour) {

            r =
                triangle.colour.r ??
                r;

            g =
                triangle.colour.g ??
                g;

            b =
                triangle.colour.b ??
                b;

            a =
                triangle.colour.a ??
                a;
        }


        /* ===============================================
           American spelling
           =============================================== */

        if (triangle.color) {

            r =
                triangle.color.r ??
                r;

            g =
                triangle.color.g ??
                g;

            b =
                triangle.color.b ??
                b;

            a =
                triangle.color.a ??
                a;
        }


        /* ===============================================
           Direct properties
           =============================================== */

        r =
            triangle.r ??
            triangle.red ??
            r;

        g =
            triangle.g ??
            triangle.green ??
            g;

        b =
            triangle.b ??
            triangle.blue ??
            b;


        a =
            triangle.a ??
            triangle.alpha ??
            triangle.opacity ??
            a;


        /*
         * Some implementations store alpha as 0-255
         * instead of 0-1.
         */

        if (a > 1) {

            a =
                a / 255;
        }


        return {

            r:
                this.clamp(
                    Math.round(r),
                    0,
                    255
                ),

            g:
                this.clamp(
                    Math.round(g),
                    0,
                    255
                ),

            b:
                this.clamp(
                    Math.round(b),
                    0,
                    255
                ),

            a:
                this.clamp(
                    a,
                    0,
                    1
                )

        };
    }



    /* =====================================================
       BACKGROUND COLOUR
       ===================================================== */

    getBackgroundColour(genome) {

        const background =
            genome.backgroundColour ??
            genome.backgroundColor ??
            genome.background;


        if (!background) {

            return "#000000";
        }


        /*
         * Already a CSS colour.
         */

        if (
            typeof background ===
            "string"
        ) {

            return background;
        }


        /*
         * RGB object.
         */

        if (
            typeof background ===
            "object"
        ) {

            const r =
                this.clamp(
                    Math.round(
                        background.r ?? 0
                    ),
                    0,
                    255
                );


            const g =
                this.clamp(
                    Math.round(
                        background.g ?? 0
                    ),
                    0,
                    255
                );


            const b =
                this.clamp(
                    Math.round(
                        background.b ?? 0
                    ),
                    0,
                    255
                );


            return `rgb(${r}, ${g}, ${b})`;
        }


        return "#000000";
    }



    /* =====================================================
       COORDINATE CONVERSION
       ===================================================== */

    toCanvasX(value) {

        if (!Number.isFinite(value)) {
            return 0;
        }


        /*
         * TriangleGene may store coordinates as normalised
         * values between 0 and 1.
         *
         * Values outside that range are assumed to already
         * be pixel coordinates.
         */

        if (
            value >= 0 &&
            value <= 1
        ) {

            return value * this.width;
        }


        return value;
    }



    toCanvasY(value) {

        if (!Number.isFinite(value)) {
            return 0;
        }


        if (
            value >= 0 &&
            value <= 1
        ) {

            return value * this.height;
        }


        return value;
    }



    /* =====================================================
       COPY BUFFER TO VISIBLE CANVAS
       ===================================================== */

    displayBuffer() {

        this.ctx.save();


        this.ctx.globalAlpha =
            1;

        this.ctx.globalCompositeOperation =
            "source-over";


        this.ctx.clearRect(
            0,
            0,
            this.width,
            this.height
        );


        this.ctx.drawImage(
            this.bufferCanvas,
            0,
            0
        );


        this.ctx.restore();
    }



    /* =====================================================
       IMAGE DATA
       ===================================================== */

    getImageData() {

        return this.ctx.getImageData(
            0,
            0,
            this.width,
            this.height
        );
    }



    getBufferImageData() {

        return this.bufferContext.getImageData(
            0,
            0,
            this.width,
            this.height
        );
    }



    /* =====================================================
       EXPORT PNG
       ===================================================== */

    toDataURL() {

        return this.canvas.toDataURL(
            "image/png"
        );
    }



    downloadPNG(
        filename = "evolved-image.png"
    ) {

        const link =
            document.createElement("a");


        link.download =
            filename;


        link.href =
            this.toDataURL();


        document.body.appendChild(
            link
        );


        link.click();


        document.body.removeChild(
            link
        );
    }



    /* =====================================================
       UTILITY
       ===================================================== */

    clamp(
        value,
        minimum,
        maximum
    ) {

        return Math.max(
            minimum,
            Math.min(
                maximum,
                value
            )
        );
    }

}