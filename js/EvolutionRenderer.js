/* =========================================================
   MIDLIFE PROGRAMMER
   Evolve Mona Lisa
   EvolutionRenderer.js

   Renders a Genome onto an HTML5 canvas.

   A Genome now contains an ORDERED stack of:

   - TriangleGene
   - CircleGene
   - DotGene

   Shape order is preserved because translucent shapes
   produce different results depending on drawing order.

   The renderer supports:

   - Visible rendering
   - Off-screen fitness rendering
   - Triangle / circle / dot genes
   - Legacy triangle-only genomes
   - Rendering partial shape stacks
   - Rendering individual shapes
   - PNG export support
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


        this.canvas =
            canvas;


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



        /* =================================================
           OFF-SCREEN FITNESS CANVAS
           ================================================= */

        this.bufferCanvas =
            document.createElement(
                "canvas"
            );


        this.bufferCanvas.width =
            this.width;


        this.bufferCanvas.height =
            this.height;


        this.bufferContext =
            this.bufferCanvas.getContext(
                "2d",
                {
                    alpha: false,
                    willReadFrequently: true
                }
            );


        if (!this.bufferContext) {

            throw new Error(
                "Unable to create off-screen rendering context."
            );
        }


        this.clear();
        this.clearBuffer();
    }



    /* =====================================================
       RESIZE
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
        this.clearBuffer();


        return this;
    }



    /* =====================================================
       CLEAR VISIBLE CANVAS
       ===================================================== */

    clear() {

        this.clearContext(
            this.ctx
        );
    }



    /* =====================================================
       CLEAR BUFFER
       ===================================================== */

    clearBuffer() {

        this.clearContext(
            this.bufferContext
        );
    }



    /* =====================================================
       CLEAR CONTEXT
       ===================================================== */

    clearContext(context) {

        if (!context) {
            return;
        }


        context.save();


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


        context.fillStyle =
            "#000000";


        context.fillRect(
            0,
            0,
            this.width,
            this.height
        );


        context.restore();
    }



    /* =====================================================
       RENDER GENOME TO VISIBLE CANVAS
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
       RENDER GENOME TO FITNESS BUFFER
       ===================================================== */

    renderToBuffer(genome) {

        if (!genome) {

            this.clearBuffer();

            return this.bufferCanvas;
        }


        this.renderToContext(
            genome,
            this.bufferContext
        );


        return this.bufferCanvas;
    }



    /* =====================================================
       CORE GENOME RENDERING
       ===================================================== */

    renderToContext(
        genome,
        context
    ) {

        if (
            !genome ||
            !context
        ) {

            return;
        }


        context.save();


        this.resetContext(
            context
        );



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
           ORDERED SHAPE STACK
           =============================================== */

        const shapes =
            this.getShapes(
                genome
            );


        for (
            let i = 0;
            i < shapes.length;
            i++
        ) {

            this.drawShape(
                context,
                shapes[i]
            );
        }


        context.restore();
    }



    /* =====================================================
       RENDER ONLY FIRST N SHAPES

       This is useful later for animated GIF export.

       Frame 1  = background + first shapes
       Frame 2  = more shapes
       ...
       Final    = complete genome
       ===================================================== */

    renderPartial(
        genome,
        shapeCount,
        context = this.ctx
    ) {

        if (
            !genome ||
            !context
        ) {

            return;
        }


        const shapes =
            this.getShapes(
                genome
            );


        shapeCount =
            Math.max(
                0,
                Math.min(
                    shapes.length,
                    Math.floor(
                        shapeCount
                    )
                )
            );


        context.save();


        this.resetContext(
            context
        );


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


        for (
            let i = 0;
            i < shapeCount;
            i++
        ) {

            this.drawShape(
                context,
                shapes[i]
            );
        }


        context.restore();
    }



    /* =====================================================
       RENDER PARTIAL TO BUFFER
       ===================================================== */

    renderPartialToBuffer(
        genome,
        shapeCount
    ) {

        this.renderPartial(
            genome,
            shapeCount,
            this.bufferContext
        );


        return this.bufferCanvas;
    }



    /* =====================================================
       GET SHAPES

       Preferred representation:

           genome.shapes

       Older formats are retained for compatibility.
       ===================================================== */

    getShapes(genome) {

        if (!genome) {
            return [];
        }


        /* ===============================================
           NEW MIXED-SHAPE FORMAT
           =============================================== */

        if (
            Array.isArray(
                genome.shapes
            )
        ) {

            return genome.shapes;
        }


        if (
            typeof genome.getShapes ===
            "function"
        ) {

            const result =
                genome.getShapes();


            if (
                Array.isArray(result)
            ) {

                return result;
            }
        }



        /* ===============================================
           GENERIC GENES FORMAT
           =============================================== */

        if (
            Array.isArray(
                genome.genes
            )
        ) {

            return genome.genes;
        }


        if (
            typeof genome.getGenes ===
            "function"
        ) {

            const result =
                genome.getGenes();


            if (
                Array.isArray(result)
            ) {

                return result;
            }
        }



        /* ===============================================
           LEGACY TRIANGLE FORMAT
           =============================================== */

        if (
            Array.isArray(
                genome.triangles
            )
        ) {

            return genome.triangles;
        }


        if (
            typeof genome.getTriangles ===
            "function"
        ) {

            const result =
                genome.getTriangles();


            if (
                Array.isArray(result)
            ) {

                return result;
            }
        }


        return [];
    }



    /* =====================================================
       LEGACY GET TRIANGLES
       ===================================================== */

    getTriangles(genome) {

        return this.getShapes(
            genome
        ).filter(
            shape =>
                this.getShapeType(
                    shape
                ) ===
                "triangle"
        );
    }



    /* =====================================================
       GET CIRCLES
       ===================================================== */

    getCircles(genome) {

        return this.getShapes(
            genome
        ).filter(
            shape =>
                this.getShapeType(
                    shape
                ) ===
                "circle"
        );
    }



    /* =====================================================
       GET DOTS
       ===================================================== */

    getDots(genome) {

        return this.getShapes(
            genome
        ).filter(
            shape =>
                this.getShapeType(
                    shape
                ) ===
                "dot"
        );
    }



    /* =====================================================
       DRAW GENERIC SHAPE
       ===================================================== */

    drawShape(
        context,
        shape
    ) {

        if (
            !context ||
            !shape
        ) {

            return;
        }


        const type =
            this.getShapeType(
                shape
            );


        switch (type) {

            case "triangle":

                this.drawTriangle(
                    context,
                    shape
                );

                break;


            case "circle":

                this.drawCircle(
                    context,
                    shape
                );

                break;


            case "dot":

                this.drawDot(
                    context,
                    shape
                );

                break;


            default:

                /*
                 * Attempt to infer unknown legacy shapes.
                 */

                if (
                    this.looksLikeTriangle(
                        shape
                    )
                ) {

                    this.drawTriangle(
                        context,
                        shape
                    );

                } else if (
                    this.looksLikeCircle(
                        shape
                    )
                ) {

                    this.drawCircle(
                        context,
                        shape
                    );
                }

                break;
        }
    }



    /* =====================================================
       GET SHAPE TYPE
       ===================================================== */

    getShapeType(shape) {

        if (!shape) {
            return "unknown";
        }


        if (
            typeof shape.type ===
            "string"
        ) {

            return shape.type.toLowerCase();
        }


        if (
            typeof TriangleGene !==
                "undefined" &&
            shape instanceof
                TriangleGene
        ) {

            return "triangle";
        }


        if (
            typeof CircleGene !==
                "undefined" &&
            shape instanceof
                CircleGene
        ) {

            return "circle";
        }


        if (
            typeof DotGene !==
                "undefined" &&
            shape instanceof
                DotGene
        ) {

            return "dot";
        }


        if (
            this.looksLikeTriangle(
                shape
            )
        ) {

            return "triangle";
        }


        if (
            this.looksLikeCircle(
                shape
            )
        ) {

            return "circle";
        }


        return "unknown";
    }



    /* =====================================================
       LOOKS LIKE TRIANGLE
       ===================================================== */

    looksLikeTriangle(shape) {

        if (!shape) {
            return false;
        }


        if (
            Array.isArray(
                shape.points
            ) &&
            shape.points.length >= 3
        ) {

            return true;
        }


        if (
            Array.isArray(
                shape.vertices
            ) &&
            shape.vertices.length >= 3
        ) {

            return true;
        }


        if (
            Number.isFinite(shape.x1) &&
            Number.isFinite(shape.y1) &&
            Number.isFinite(shape.x2) &&
            Number.isFinite(shape.y2) &&
            Number.isFinite(shape.x3) &&
            Number.isFinite(shape.y3)
        ) {

            return true;
        }


        return Boolean(
            shape.p1 &&
            shape.p2 &&
            shape.p3
        );
    }



    /* =====================================================
       LOOKS LIKE CIRCLE
       ===================================================== */

    looksLikeCircle(shape) {

        return Boolean(
            shape &&
            Number.isFinite(shape.x) &&
            Number.isFinite(shape.y) &&
            Number.isFinite(shape.radius)
        );
    }



    /* =====================================================
       DRAW TRIANGLE
       ===================================================== */

    drawTriangle(
        context,
        triangle
    ) {

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
            this.getShapeColour(
                triangle,
                0.25
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
            this.colourToCSS(
                colour
            );


        context.fill();
    }



    /* =====================================================
       DRAW CIRCLE
       ===================================================== */

    drawCircle(
        context,
        circle
    ) {

        if (!circle) {
            return;
        }


        const x =
            this.toCanvasX(
                Number(circle.x)
            );


        const y =
            this.toCanvasY(
                Number(circle.y)
            );


        const radius =
            this.getCanvasRadius(
                circle.radius
            );


        if (
            radius <= 0
        ) {

            return;
        }


        const colour =
            this.getShapeColour(
                circle,
                0.25
            );


        context.beginPath();


        context.arc(
            x,
            y,
            radius,
            0,
            Math.PI * 2
        );


        context.closePath();


        context.fillStyle =
            this.colourToCSS(
                colour
            );


        context.fill();
    }



    /* =====================================================
       DRAW DOT

       DotGene is technically circular, but is kept as a
       separate method so we can optimise or alter its
       rendering later without changing CircleGene.
       ===================================================== */

    drawDot(
        context,
        dot
    ) {

        if (!dot) {
            return;
        }


        const x =
            this.toCanvasX(
                Number(dot.x)
            );


        const y =
            this.toCanvasY(
                Number(dot.y)
            );


        const radius =
            Math.max(
                0.35,
                this.getCanvasRadius(
                    dot.radius
                )
            );


        const colour =
            this.getShapeColour(
                dot,
                0.5
            );


        context.beginPath();


        context.arc(
            x,
            y,
            radius,
            0,
            Math.PI * 2
        );


        context.closePath();


        context.fillStyle =
            this.colourToCSS(
                colour
            );


        context.fill();
    }



    /* =====================================================
       TRIANGLE POINTS
       ===================================================== */

    getTrianglePoints(triangle) {

        if (
            Array.isArray(
                triangle.points
            ) &&
            triangle.points.length >= 3
        ) {

            return triangle.points;
        }


        if (
            Array.isArray(
                triangle.vertices
            ) &&
            triangle.vertices.length >= 3
        ) {

            return triangle.vertices;
        }


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
       GENERIC SHAPE COLOUR

       Works for triangles, circles and dots.
       ===================================================== */

    getShapeColour(
        shape,
        defaultAlpha = 0.25
    ) {

        let r = 255;
        let g = 255;
        let b = 255;
        let a = defaultAlpha;



        /* ===============================================
           BRITISH SPELLING
           =============================================== */

        if (
            shape.colour
        ) {

            r =
                shape.colour.r ??
                r;


            g =
                shape.colour.g ??
                g;


            b =
                shape.colour.b ??
                b;


            a =
                shape.colour.a ??
                shape.colour.alpha ??
                a;
        }



        /* ===============================================
           AMERICAN SPELLING
           =============================================== */

        if (
            shape.color
        ) {

            r =
                shape.color.r ??
                r;


            g =
                shape.color.g ??
                g;


            b =
                shape.color.b ??
                b;


            a =
                shape.color.a ??
                shape.color.alpha ??
                a;
        }



        /* ===============================================
           DIRECT PROPERTIES
           =============================================== */

        r =
            shape.r ??
            shape.red ??
            r;


        g =
            shape.g ??
            shape.green ??
            g;


        b =
            shape.b ??
            shape.blue ??
            b;


        a =
            shape.a ??
            shape.alpha ??
            shape.opacity ??
            a;



        /* ===============================================
           SUPPORT 0 - 255 ALPHA
           =============================================== */

        if (
            Number(a) > 1
        ) {

            a =
                Number(a) /
                255;
        }


        return {

            r:
                this.clamp(
                    Math.round(
                        Number(r) || 0
                    ),
                    0,
                    255
                ),

            g:
                this.clamp(
                    Math.round(
                        Number(g) || 0
                    ),
                    0,
                    255
                ),

            b:
                this.clamp(
                    Math.round(
                        Number(b) || 0
                    ),
                    0,
                    255
                ),

            a:
                this.clamp(
                    Number(a),
                    0,
                    1
                )

        };
    }



    /* =====================================================
       LEGACY TRIANGLE COLOUR
       ===================================================== */

    getTriangleColour(triangle) {

        return this.getShapeColour(
            triangle,
            0.25
        );
    }



    /* =====================================================
       COLOUR TO CSS
       ===================================================== */

    colourToCSS(colour) {

        return (
            "rgba(" +
            colour.r +
            ", " +
            colour.g +
            ", " +
            colour.b +
            ", " +
            colour.a +
            ")"
        );
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


        if (
            typeof background ===
            "string"
        ) {

            return background;
        }


        if (
            typeof background ===
            "object"
        ) {

            const r =
                this.clamp(
                    Math.round(
                        Number(
                            background.r
                        ) || 0
                    ),
                    0,
                    255
                );


            const g =
                this.clamp(
                    Math.round(
                        Number(
                            background.g
                        ) || 0
                    ),
                    0,
                    255
                );


            const b =
                this.clamp(
                    Math.round(
                        Number(
                            background.b
                        ) || 0
                    ),
                    0,
                    255
                );


            return (
                "rgb(" +
                r +
                ", " +
                g +
                ", " +
                b +
                ")"
            );
        }


        return "#000000";
    }



    /* =====================================================
       COORDINATE CONVERSION

       Legacy TriangleGene may use normalised coordinates
       between 0 and 1.

       CircleGene and DotGene use pixel coordinates.

       For mixed genes, their type tells us which convention
       is expected.
       ===================================================== */

    toCanvasX(value) {

        if (
            !Number.isFinite(value)
        ) {

            return 0;
        }


        /*
         * Preserve compatibility with our original
         * normalised TriangleGene.
         */

        if (
            value >= 0 &&
            value <= 1
        ) {

            return (
                value *
                this.width
            );
        }


        return value;
    }



    toCanvasY(value) {

        if (
            !Number.isFinite(value)
        ) {

            return 0;
        }


        if (
            value >= 0 &&
            value <= 1
        ) {

            return (
                value *
                this.height
            );
        }


        return value;
    }



    /* =====================================================
       CIRCLE / DOT POSITION

       CircleGene and DotGene are explicitly pixel-based.

       These helpers avoid the old 0..1 normalisation
       ambiguity for their centres.
       ===================================================== */

    circleCanvasX(value) {

        if (
            !Number.isFinite(value)
        ) {

            return 0;
        }


        return value;
    }



    circleCanvasY(value) {

        if (
            !Number.isFinite(value)
        ) {

            return 0;
        }


        return value;
    }



    /* =====================================================
       RADIUS CONVERSION

       Current CircleGene and DotGene use pixels.

       A fractional radius below 1 is still allowed for
       extremely fine dots.
       ===================================================== */

    getCanvasRadius(radius) {

        radius =
            Number(radius);


        if (
            !Number.isFinite(radius)
        ) {

            return 0;
        }


        return Math.max(
            0,
            radius
        );
    }



    /* =====================================================
       DRAW CIRCLE WITH PIXEL-SAFE POSITION

       CircleGene stores its centre in pixel coordinates.
       ===================================================== */

    drawCircle(
        context,
        circle
    ) {

        if (!circle) {
            return;
        }


        const x =
            this.circleCanvasX(
                Number(circle.x)
            );


        const y =
            this.circleCanvasY(
                Number(circle.y)
            );


        const radius =
            this.getCanvasRadius(
                circle.radius
            );


        if (
            radius <= 0
        ) {

            return;
        }


        const colour =
            this.getShapeColour(
                circle,
                0.25
            );


        context.beginPath();


        context.arc(
            x,
            y,
            radius,
            0,
            Math.PI * 2
        );


        context.fillStyle =
            this.colourToCSS(
                colour
            );


        context.fill();
    }



    /* =====================================================
       DRAW DOT WITH PIXEL-SAFE POSITION
       ===================================================== */

    drawDot(
        context,
        dot
    ) {

        if (!dot) {
            return;
        }


        const x =
            this.circleCanvasX(
                Number(dot.x)
            );


        const y =
            this.circleCanvasY(
                Number(dot.y)
            );


        const radius =
            Math.max(
                0.35,
                this.getCanvasRadius(
                    dot.radius
                )
            );


        const colour =
            this.getShapeColour(
                dot,
                0.5
            );


        context.beginPath();


        context.arc(
            x,
            y,
            radius,
            0,
            Math.PI * 2
        );


        context.fillStyle =
            this.colourToCSS(
                colour
            );


        context.fill();
    }



    /* =====================================================
       RESET CONTEXT
       ===================================================== */

    resetContext(context) {

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


        context.imageSmoothingEnabled =
            true;
    }



    /* =====================================================
       COPY BUFFER TO VISIBLE CANVAS
       ===================================================== */

    displayBuffer() {

        this.ctx.save();


        this.resetContext(
            this.ctx
        );


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
       CANVASES
       ===================================================== */

    getCanvas() {

        return this.canvas;
    }



    getBufferCanvas() {

        return this.bufferCanvas;
    }



    getContext() {

        return this.ctx;
    }



    getBufferContext() {

        return this.bufferContext;
    }



    /* =====================================================
       DIMENSIONS
       ===================================================== */

    getWidth() {

        return this.width;
    }



    getHeight() {

        return this.height;
    }



    /* =====================================================
       EXPORT DATA URL
       ===================================================== */

    toDataURL(
        type = "image/png",
        quality = 1
    ) {

        return this.canvas.toDataURL(
            type,
            quality
        );
    }



    /* =====================================================
       BUFFER DATA URL

       Useful for ExportManager.
       ===================================================== */

    bufferToDataURL(
        type = "image/png",
        quality = 1
    ) {

        return this.bufferCanvas.toDataURL(
            type,
            quality
        );
    }



    /* =====================================================
       RENDER GENOME TO DATA URL
       ===================================================== */

    genomeToDataURL(
        genome,
        type = "image/png",
        quality = 1
    ) {

        this.renderToBuffer(
            genome
        );


        return this.bufferCanvas.toDataURL(
            type,
            quality
        );
    }



    /* =====================================================
       RENDER GENOME TO BLOB

       Better than a data URL for larger downloads.
       ===================================================== */

    genomeToBlob(
        genome,
        type = "image/png",
        quality = 1
    ) {

        this.renderToBuffer(
            genome
        );


        return new Promise(
            (resolve, reject) => {

                this.bufferCanvas.toBlob(
                    blob => {

                        if (blob) {

                            resolve(
                                blob
                            );

                        } else {

                            reject(
                                new Error(
                                    "Unable to create image blob."
                                )
                            );
                        }
                    },
                    type,
                    quality
                );
            }
        );
    }



    /* =====================================================
       DOWNLOAD PNG

       Retained for compatibility.

       ExportManager will eventually own the main download
       controls.
       ===================================================== */

    downloadPNG(
        filename =
            "evolved-image.png"
    ) {

        const link =
            document.createElement(
                "a"
            );


        link.download =
            filename;


        link.href =
            this.toDataURL(
                "image/png"
            );


        document.body.appendChild(
            link
        );


        link.click();


        document.body.removeChild(
            link
        );
    }



    /* =====================================================
       SHAPE COUNT
       ===================================================== */

    getShapeCount(genome) {

        return this.getShapes(
            genome
        ).length;
    }



    /* =====================================================
       UTILITY
       ===================================================== */

    clamp(
        value,
        minimum,
        maximum
    ) {

        value =
            Number(value);


        if (
            !Number.isFinite(value)
        ) {

            return minimum;
        }


        return Math.max(
            minimum,
            Math.min(
                maximum,
                value
            )
        );
    }

}