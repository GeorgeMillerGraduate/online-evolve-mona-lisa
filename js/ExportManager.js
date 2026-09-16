/* =========================================================
   MIDLIFE PROGRAMMER
   Evolve Mona Lisa
   ExportManager.js

   Handles exporting and importing evolutionary artwork.

   Features:

   - Full-resolution PNG export
   - Genome JSON export
   - Genome JSON import
   - Exact mixed-shape layer order preservation
   - Build-animation GIF export
   - Evolution-history GIF export
   - Evolution history snapshots
   - Configurable GIF frame delay
   - Configurable shapes per frame
   - Progress callbacks
   - Browser Blob downloads

   GIF export requires gif.js to be loaded globally:

       GIF

   If GIF.js is unavailable, PNG and JSON export still work.
   ========================================================= */


class ExportManager {


    /* =====================================================
       CONSTRUCTOR
       ===================================================== */

    constructor(options = {}) {

        this.renderer =
            options.renderer ??
            null;


        this.width =
            this.normaliseDimension(
                options.width ??
                this.renderer?.width ??
                480
            );


        this.height =
            this.normaliseDimension(
                options.height ??
                this.renderer?.height ??
                715
            );


        /* =================================================
           FILENAMES
           ================================================= */

        this.baseFilename =
            options.baseFilename ??
            "evolved-mona-lisa";


        /* =================================================
           GIF OPTIONS
           ================================================= */

        this.gifFrameDelay =
            this.normaliseInteger(
                options.gifFrameDelay ?? 40,
                10
            );


        this.shapesPerFrame =
            this.normaliseInteger(
                options.shapesPerFrame ?? 2,
                1
            );


        this.gifQuality =
            this.normaliseInteger(
                options.gifQuality ?? 10,
                1
            );


        this.gifWorkers =
            this.normaliseInteger(
                options.gifWorkers ?? 2,
                1
            );


        /*
         * Path used by gif.js for its worker script.
         *
         * If your project eventually stores gif.worker.js
         * elsewhere, change this through setGIFWorkerScript.
         */

        this.gifWorkerScript =
            options.gifWorkerScript ??
            "js/gif.worker.js";


        /* =================================================
           EVOLUTION HISTORY
           ================================================= */

        this.history =
            [];


        this.maxHistoryEntries =
            this.normaliseInteger(
                options.maxHistoryEntries ?? 200,
                1
            );


        /* =================================================
           STATUS CALLBACK
           ================================================= */

        this.statusCallback =
            typeof options.statusCallback ===
                "function"
                ? options.statusCallback
                : null;


        this.progressCallback =
            typeof options.progressCallback ===
                "function"
                ? options.progressCallback
                : null;


        /* =================================================
           TEMPORARY CANVAS
           ================================================= */

        this.exportCanvas =
            document.createElement(
                "canvas"
            );


        this.exportCanvas.width =
            this.width;


        this.exportCanvas.height =
            this.height;


        this.exportContext =
            this.exportCanvas.getContext(
                "2d",
                {
                    alpha: false
                }
            );


        if (!this.exportContext) {

            throw new Error(
                "Unable to create ExportManager canvas."
            );
        }
    }



    /* =====================================================
       SET RENDERER
       ===================================================== */

    setRenderer(renderer) {

        this.renderer =
            renderer;


        if (renderer) {

            const width =
                renderer.width ??
                renderer.getWidth?.();


            const height =
                renderer.height ??
                renderer.getHeight?.();


            if (
                Number.isFinite(width) &&
                Number.isFinite(height)
            ) {

                this.setDimensions(
                    width,
                    height
                );
            }
        }


        return this;
    }



    /* =====================================================
       SET DIMENSIONS
       ===================================================== */

    setDimensions(
        width,
        height
    ) {

        this.width =
            this.normaliseDimension(
                width
            );


        this.height =
            this.normaliseDimension(
                height
            );


        this.exportCanvas.width =
            this.width;


        this.exportCanvas.height =
            this.height;


        return this;
    }



    /* =====================================================
       SET BASE FILENAME
       ===================================================== */

    setBaseFilename(name) {

        if (
            typeof name ===
                "string" &&
            name.trim()
        ) {

            this.baseFilename =
                this.sanitiseFilename(
                    name.trim()
                );
        }


        return this;
    }



    /* =====================================================
       SET GIF FRAME DELAY
       ===================================================== */

    setGIFFrameDelay(value) {

        this.gifFrameDelay =
            this.normaliseInteger(
                value,
                10
            );


        return this;
    }



    /* =====================================================
       SET SHAPES PER FRAME
       ===================================================== */

    setShapesPerFrame(value) {

        this.shapesPerFrame =
            this.normaliseInteger(
                value,
                1
            );


        return this;
    }



    /* =====================================================
       SET GIF WORKER
       ===================================================== */

    setGIFWorkerScript(path) {

        if (
            typeof path ===
                "string" &&
            path.trim()
        ) {

            this.gifWorkerScript =
                path.trim();
        }


        return this;
    }



    /* =====================================================
       STATUS CALLBACK
       ===================================================== */

    setStatusCallback(callback) {

        this.statusCallback =
            typeof callback ===
                "function"
                ? callback
                : null;


        return this;
    }



    /* =====================================================
       PROGRESS CALLBACK
       ===================================================== */

    setProgressCallback(callback) {

        this.progressCallback =
            typeof callback ===
                "function"
                ? callback
                : null;


        return this;
    }



    /* =====================================================
       REPORT STATUS
       ===================================================== */

    reportStatus(
        message,
        type = "info"
    ) {

        if (
            this.statusCallback
        ) {

            this.statusCallback(
                message,
                type
            );
        }


        return {

            message:
                message,

            type:
                type

        };
    }



    /* =====================================================
       REPORT PROGRESS
       ===================================================== */

    reportProgress(value) {

        value =
            this.clamp(
                Number(value) || 0,
                0,
                1
            );


        if (
            this.progressCallback
        ) {

            this.progressCallback(
                value
            );
        }


        return value;
    }



    /* =====================================================
       VALIDATE GENOME
       ===================================================== */

    validateGenome(genome) {

        if (!genome) {

            throw new Error(
                "No genome is available for export."
            );
        }


        const shapes =
            this.getShapes(
                genome
            );


        if (
            !Array.isArray(shapes)
        ) {

            throw new Error(
                "Genome does not contain a valid shape array."
            );
        }


        return true;
    }



    /* =====================================================
       RENDER FULL RESOLUTION

       Always renders at the genome's canonical/full
       resolution for export, regardless of the current
       progressive fitness stage.
       ===================================================== */

    renderFullResolution(genome) {

        this.validateGenome(
            genome
        );


        if (!this.renderer) {

            throw new Error(
                "ExportManager requires an EvolutionRenderer."
            );
        }


        const width =
            this.normaliseDimension(
                genome.width ??
                this.renderer.width ??
                this.width
            );


        const height =
            this.normaliseDimension(
                genome.height ??
                this.renderer.height ??
                this.height
            );


        if (
            this.exportCanvas.width !==
                width ||
            this.exportCanvas.height !==
                height
        ) {

            this.exportCanvas.width =
                width;


            this.exportCanvas.height =
                height;


            this.width =
                width;


            this.height =
                height;
        }


        /*
         * Preferred route.
         */

        if (
            typeof this.renderer
                .renderToContext ===
            "function"
        ) {

            this.renderer
                .renderToContext(
                    genome,
                    this.exportContext
                );


            return this.exportCanvas;
        }


        /*
         * Compatibility route.
         */

        if (
            typeof this.renderer
                .renderToBuffer ===
            "function"
        ) {

            const source =
                this.renderer
                    .renderToBuffer(
                        genome
                    );


            this.exportContext
                .setTransform(
                    1,
                    0,
                    0,
                    1,
                    0,
                    0
                );


            this.exportContext
                .clearRect(
                    0,
                    0,
                    width,
                    height
                );


            this.exportContext
                .drawImage(
                    source,
                    0,
                    0,
                    width,
                    height
                );


            return this.exportCanvas;
        }


        throw new Error(
            "EvolutionRenderer cannot render an export canvas."
        );
    }



    /* =====================================================
       EXPORT PNG
       ===================================================== */

    async exportPNG(
        genome,
        filename = null
    ) {

        try {

            this.reportStatus(
                "Rendering PNG..."
            );


            const canvas =
                this.renderFullResolution(
                    genome
                );


            const blob =
                await this.canvasToBlob(
                    canvas,
                    "image/png"
                );


            if (!blob) {

                throw new Error(
                    "PNG encoding failed."
                );
            }


            const finalFilename =
                filename ??
                this.createFilename(
                    "png"
                );


            this.downloadBlob(
                blob,
                finalFilename
            );


            this.reportStatus(
                "PNG exported.",
                "success"
            );


            return blob;

        } catch (error) {

            this.reportStatus(
                "PNG export failed.",
                "error"
            );


            throw error;
        }
    }



    /* =====================================================
       DOWNLOAD PNG ALIAS
       ===================================================== */

    downloadPNG(
        genome,
        filename = null
    ) {

        return this.exportPNG(
            genome,
            filename
        );
    }



    /* =====================================================
       CREATE JSON DATA

       IMPORTANT:

       shapes are exported in EXACT drawing order.

       We do not separate triangles, circles and dots into
       independent arrays because doing so would destroy
       alpha-blending layer order.
       ===================================================== */

    createGenomeData(
        genome,
        metadata = {}
    ) {

        this.validateGenome(
            genome
        );


        const shapes =
            this.getShapes(
                genome
            );


        const width =
            this.normaliseDimension(
                genome.width ??
                this.width
            );


        const height =
            this.normaliseDimension(
                genome.height ??
                this.height
            );


        const background =
            this.serialiseBackground(
                genome.background
            );


        return {

            format:
                "midlife-programmer-evolution-genome",

            version:
                1,

            application:
                "Evolve Mona Lisa",

            created:
                new Date()
                    .toISOString(),

            width:
                width,

            height:
                height,

            background:
                background,

            fitness:
                this.serialiseNumber(
                    genome.fitness
                ),

            similarity:
                this.serialiseNumber(
                    genome.similarity
                ),

            error:
                this.serialiseNumber(
                    genome.error
                ),

            generation:
                this.serialiseNumber(
                    metadata.generation ??
                    genome.generation
                ),

            evaluations:
                this.serialiseNumber(
                    metadata.evaluations
                ),

            shapeCount:
                shapes.length,

            shapeCounts:
                this.countShapeTypes(
                    shapes
                ),

            shapes:
                shapes.map(
                    shape =>
                        this.serialiseShape(
                            shape
                        )
                )

        };
    }



    /* =====================================================
       EXPORT JSON
       ===================================================== */

    exportJSON(
        genome,
        metadata = {},
        filename = null
    ) {

        try {

            this.reportStatus(
                "Creating genome JSON..."
            );


            const data =
                this.createGenomeData(
                    genome,
                    metadata
                );


            const json =
                JSON.stringify(
                    data,
                    null,
                    2
                );


            const blob =
                new Blob(
                    [json],
                    {
                        type:
                            "application/json;charset=utf-8"
                    }
                );


            const finalFilename =
                filename ??
                this.createFilename(
                    "json"
                );


            this.downloadBlob(
                blob,
                finalFilename
            );


            this.reportStatus(
                "Genome JSON exported.",
                "success"
            );


            return data;

        } catch (error) {

            this.reportStatus(
                "JSON export failed.",
                "error"
            );


            throw error;
        }
    }



    /* =====================================================
       DOWNLOAD JSON ALIAS
       ===================================================== */

    downloadJSON(
        genome,
        metadata = {},
        filename = null
    ) {

        return this.exportJSON(
            genome,
            metadata,
            filename
        );
    }



    /* =====================================================
       SERIALISE SHAPE
       ===================================================== */

    serialiseShape(shape) {

        if (!shape) {

            throw new Error(
                "Cannot serialise an empty shape."
            );
        }


        if (
            typeof shape.toJSON ===
            "function"
        ) {

            const data =
                shape.toJSON();


            /*
             * Guarantee explicit type even if an older
             * gene implementation omitted it.
             */

            if (!data.type) {

                data.type =
                    this.getShapeType(
                        shape
                    );
            }


            return data;
        }


        const type =
            this.getShapeType(
                shape
            );


        switch (type) {

            case "triangle":

                return {

                    type:
                        "triangle",

                    points:
                        this.getTrianglePoints(
                            shape
                        ).map(
                            point => ({

                                x:
                                    Number(point.x) || 0,

                                y:
                                    Number(point.y) || 0

                            })
                        ),

                    r:
                        Number(shape.r) || 0,

                    g:
                        Number(shape.g) || 0,

                    b:
                        Number(shape.b) || 0,

                    a:
                        this.getAlpha(
                            shape
                        )

                };


            case "circle":

            case "dot":

                return {

                    type:
                        type,

                    x:
                        Number(shape.x) || 0,

                    y:
                        Number(shape.y) || 0,

                    radius:
                        Number(
                            shape.radius
                        ) || 1,

                    r:
                        Number(shape.r) || 0,

                    g:
                        Number(shape.g) || 0,

                    b:
                        Number(shape.b) || 0,

                    a:
                        this.getAlpha(
                            shape
                        )

                };


            default:

                throw new Error(
                    "Unsupported shape type during JSON export."
                );
        }
    }



    /* =====================================================
       IMPORT JSON FILE
       ===================================================== */

    async importJSONFile(file) {

        if (!file) {

            throw new Error(
                "No JSON file was selected."
            );
        }


        this.reportStatus(
            "Loading genome JSON..."
        );


        const text =
            await file.text();


        return this.importJSON(
            text
        );
    }



    /* =====================================================
       IMPORT JSON
       ===================================================== */

    importJSON(json) {

        try {

            let data;


            if (
                typeof json ===
                "string"
            ) {

                data =
                    JSON.parse(
                        json
                    );

            } else {

                data =
                    json;
            }


            this.validateGenomeData(
                data
            );


            const genome =
                this.createGenomeFromData(
                    data
                );


            this.reportStatus(
                "Genome imported.",
                "success"
            );


            return genome;

        } catch (error) {

            this.reportStatus(
                "Genome import failed.",
                "error"
            );


            throw error;
        }
    }



    /* =====================================================
       VALIDATE JSON DATA
       ===================================================== */

    validateGenomeData(data) {

        if (
            !data ||
            typeof data !==
                "object"
        ) {

            throw new Error(
                "Invalid genome JSON."
            );
        }


        if (
            !Array.isArray(
                data.shapes
            )
        ) {

            throw new Error(
                "Genome JSON does not contain a shapes array."
            );
        }


        if (
            !Number.isFinite(
                Number(data.width)
            ) ||
            !Number.isFinite(
                Number(data.height)
            )
        ) {

            throw new Error(
                "Genome JSON contains invalid dimensions."
            );
        }


        return true;
    }



    /* =====================================================
       CREATE GENOME FROM DATA
       ===================================================== */

    createGenomeFromData(data) {

        if (
            typeof Genome ===
            "undefined"
        ) {

            throw new Error(
                "Genome.js must be loaded before importing JSON."
            );
        }


        /*
         * Prefer Genome's own deserialiser because it knows
         * the canonical internal representation.
         */

        if (
            typeof Genome.fromJSON ===
            "function"
        ) {

            const genome =
                Genome.fromJSON(
                    data
                );


            this.restoreGenomeMetadata(
                genome,
                data
            );


            return genome;
        }


        /*
         * Fallback path.
         */

        const width =
            this.normaliseDimension(
                data.width
            );


        const height =
            this.normaliseDimension(
                data.height
            );


        const genome =
            new Genome({

                triangleCount:
                    0,

                circleCount:
                    0,

                dotCount:
                    0,

                width:
                    width,

                height:
                    height

            });


        genome.shapes =
            data.shapes.map(
                shapeData =>
                    this.createShapeFromData(
                        shapeData,
                        width,
                        height
                    )
            );


        this.restoreGenomeMetadata(
            genome,
            data
        );


        return genome;
    }



    /* =====================================================
       CREATE SHAPE FROM DATA
       ===================================================== */

    createShapeFromData(
        data,
        width,
        height
    ) {

        if (!data) {

            throw new Error(
                "Invalid shape data."
            );
        }


        const type =
            String(
                data.type ??
                ""
            ).toLowerCase();


        switch (type) {

            case "triangle":

                if (
                    typeof TriangleGene !==
                        "undefined" &&
                    typeof TriangleGene
                        .fromJSON ===
                        "function"
                ) {

                    return TriangleGene
                        .fromJSON(
                            data,
                            width,
                            height
                        );
                }


                return this.createTriangleFallback(
                    data,
                    width,
                    height
                );


            case "circle":

                if (
                    typeof CircleGene !==
                        "undefined" &&
                    typeof CircleGene
                        .fromJSON ===
                        "function"
                ) {

                    return CircleGene
                        .fromJSON(
                            data,
                            width,
                            height
                        );
                }


                return this.createRoundFallback(
                    data,
                    width,
                    height,
                    "circle"
                );


            case "dot":

                if (
                    typeof DotGene !==
                        "undefined" &&
                    typeof DotGene
                        .fromJSON ===
                        "function"
                ) {

                    return DotGene
                        .fromJSON(
                            data,
                            width,
                            height
                        );
                }


                return this.createRoundFallback(
                    data,
                    width,
                    height,
                    "dot"
                );


            default:

                throw new Error(
                    "Unknown shape type in genome JSON: " +
                    type
                );
        }
    }



    /* =====================================================
       TRIANGLE IMPORT FALLBACK
       ===================================================== */

    createTriangleFallback(
        data,
        width,
        height
    ) {

        if (
            typeof TriangleGene ===
            "undefined"
        ) {

            throw new Error(
                "TriangleGene.js is required to import triangles."
            );
        }


        const triangle =
            new TriangleGene(
                width,
                height
            );


        triangle.type =
            "triangle";


        const points =
            data.points ??
            data.vertices;


        if (
            Array.isArray(points) &&
            points.length >= 3
        ) {

            triangle.points =
                points
                    .slice(
                        0,
                        3
                    )
                    .map(
                        point => ({

                            x:
                                this.clamp(
                                    Number(
                                        point.x
                                    ) || 0,
                                    0,
                                    width
                                ),

                            y:
                                this.clamp(
                                    Number(
                                        point.y
                                    ) || 0,
                                    0,
                                    height
                                )

                        })
                    );
        }


        this.restoreShapeColour(
            triangle,
            data
        );


        return triangle;
    }



    /* =====================================================
       CIRCLE / DOT IMPORT FALLBACK
       ===================================================== */

    createRoundFallback(
        data,
        width,
        height,
        type
    ) {

        const Constructor =
            type === "dot"
                ? (
                    typeof DotGene !==
                        "undefined"
                        ? DotGene
                        : null
                )
                : (
                    typeof CircleGene !==
                        "undefined"
                        ? CircleGene
                        : null
                );


        if (!Constructor) {

            throw new Error(
                type +
                " gene class is not loaded."
            );
        }


        const shape =
            new Constructor(
                width,
                height
            );


        shape.type =
            type;


        shape.x =
            this.clamp(
                Number(data.x) || 0,
                0,
                width
            );


        shape.y =
            this.clamp(
                Number(data.y) || 0,
                0,
                height
            );


        shape.radius =
            Math.max(
                0.1,
                Number(
                    data.radius
                ) || 1
            );


        this.restoreShapeColour(
            shape,
            data
        );


        return shape;
    }



    /* =====================================================
       RESTORE SHAPE COLOUR
       ===================================================== */

    restoreShapeColour(
        shape,
        data
    ) {

        shape.r =
            this.clamp(
                Number(data.r) || 0,
                0,
                255
            );


        shape.g =
            this.clamp(
                Number(data.g) || 0,
                0,
                255
            );


        shape.b =
            this.clamp(
                Number(data.b) || 0,
                0,
                255
            );


        const alpha =
            Number(
                data.a
            );


        shape.a =
            this.clamp(
                Number.isFinite(alpha)
                    ? alpha
                    : 0.1,
                0.01,
                1
            );
    }



    /* =====================================================
       RESTORE GENOME METADATA
       ===================================================== */

    restoreGenomeMetadata(
        genome,
        data
    ) {

        if (!genome) {
            return;
        }


        genome.width =
            this.normaliseDimension(
                data.width ??
                genome.width ??
                this.width
            );


        genome.height =
            this.normaliseDimension(
                data.height ??
                genome.height ??
                this.height
            );


        if (
            data.background !==
            undefined
        ) {

            genome.background =
                this.deserialiseBackground(
                    data.background
                );
        }


        const fitness =
            Number(
                data.fitness
            );


        const similarity =
            Number(
                data.similarity
            );


        const error =
            Number(
                data.error
            );


        if (
            Number.isFinite(fitness)
        ) {

            genome.fitness =
                fitness;
        }


        if (
            Number.isFinite(similarity)
        ) {

            genome.similarity =
                similarity;
        }


        if (
            Number.isFinite(error)
        ) {

            genome.error =
                error;
        }


        const generation =
            Number(
                data.generation
            );


        if (
            Number.isFinite(generation)
        ) {

            genome.generation =
                generation;
        }


        /*
         * Imported fitness must be considered stale when
         * inserted into a running GA because we do not know
         * which progressive resolution generated it.
         */

        genome.fitnessStage =
            undefined;


        genome.fitnessWidth =
            undefined;


        genome.fitnessHeight =
            undefined;
    }



    /* =====================================================
       RECORD EVOLUTION HISTORY

       Stores genome snapshots rather than canvas bitmaps.

       This keeps the history reusable for GIF generation
       at different output sizes.
       ===================================================== */

    recordHistory(
        genome,
        metadata = {}
    ) {

        if (!genome) {

            return false;
        }


        const snapshot = {

            generation:
                Number(
                    metadata.generation ??
                    genome.generation ??
                    0
                ) || 0,

            similarity:
                Number(
                    metadata.similarity ??
                    genome.similarity ??
                    0
                ) || 0,

            fitness:
                Number(
                    metadata.fitness ??
                    genome.fitness ??
                    0
                ) || 0,

            genome:
                this.cloneGenome(
                    genome
                )

        };


        this.history.push(
            snapshot
        );


        /*
         * Bound memory usage.
         */

        if (
            this.history.length >
            this.maxHistoryEntries
        ) {

            this.history.shift();
        }


        return true;
    }



    /* =====================================================
       CLEAR HISTORY
       ===================================================== */

    clearHistory() {

        this.history.length =
            0;


        return this;
    }



    /* =====================================================
       GET HISTORY
       ===================================================== */

    getHistory() {

        return this.history;
    }



    /* =====================================================
       HISTORY SIZE
       ===================================================== */

    getHistorySize() {

        return this.history.length;
    }



    /* =====================================================
       EXPORT GIF

       mode:

           "build"
               background -> progressively add final shapes

           "history"
               replay recorded evolutionary checkpoints
       ===================================================== */

    async exportGIF(
        genome,
        options = {}
    ) {

        const mode =
            String(
                options.mode ??
                "build"
            ).toLowerCase();


        if (
            mode ===
            "history"
        ) {

            return this.exportHistoryGIF(
                options
            );
        }


        return this.exportBuildGIF(
            genome,
            options
        );
    }



    /* =====================================================
       EXPORT BUILD GIF

       The final genome is drawn progressively in exact
       shape-array order.

       Because layer order affects alpha blending, this is
       the correct way to visualise how the final image is
       constructed.
       ===================================================== */

    exportBuildGIF(
        genome,
        options = {}
    ) {

        return new Promise(
            (
                resolve,
                reject
            ) => {

                try {

                    this.validateGenome(
                        genome
                    );


                    const GIFConstructor =
                        this.getGIFConstructor();


                    if (!GIFConstructor) {

                        throw new Error(
                            "GIF.js is not loaded. PNG and JSON export are available, but GIF export requires gif.js."
                        );
                    }


                    const shapes =
                        this.getShapes(
                            genome
                        );


                    const width =
                        this.normaliseDimension(
                            options.width ??
                            genome.width ??
                            this.width
                        );


                    const height =
                        this.normaliseDimension(
                            options.height ??
                            genome.height ??
                            this.height
                        );


                    const frameDelay =
                        this.normaliseInteger(
                            options.frameDelay ??
                            this.gifFrameDelay,
                            10
                        );


                    const shapesPerFrame =
                        this.normaliseInteger(
                            options.shapesPerFrame ??
                            this.shapesPerFrame,
                            1
                        );


                    const gif =
                        this.createGIFEncoder(
                            GIFConstructor,
                            width,
                            height,
                            options
                        );


                    const canvas =
                        document.createElement(
                            "canvas"
                        );


                    canvas.width =
                        width;


                    canvas.height =
                        height;


                    const context =
                        canvas.getContext(
                            "2d",
                            {
                                alpha: false
                            }
                        );


                    if (!context) {

                        throw new Error(
                            "Unable to create GIF build canvas."
                        );
                    }


                    this.reportStatus(
                        "Building GIF frames..."
                    );


                    /*
                     * Frame zero: background only.
                     */

                    this.renderPartialGenome(
                        genome,
                        0,
                        context
                    );


                    gif.addFrame(
                        context,
                        {
                            copy: true,
                            delay:
                                frameDelay
                        }
                    );


                    for (
                        let count =
                            shapesPerFrame;
                        count <
                            shapes.length;
                        count +=
                            shapesPerFrame
                    ) {

                        this.renderPartialGenome(
                            genome,
                            count,
                            context
                        );


                        gif.addFrame(
                            context,
                            {
                                copy: true,
                                delay:
                                    frameDelay
                            }
                        );


                        this.reportProgress(
                            count /
                            shapes.length
                        );
                    }


                    /*
                     * Always include exact final image.
                     */

                    this.renderPartialGenome(
                        genome,
                        shapes.length,
                        context
                    );


                    gif.addFrame(
                        context,
                        {
                            copy: true,
                            delay:
                                Math.max(
                                    frameDelay,
                                    750
                                )
                        }
                    );


                    gif.on(
                        "progress",
                        progress => {

                            this.reportProgress(
                                progress
                            );
                        }
                    );


                    gif.on(
                        "finished",
                        blob => {

                            const filename =
                                options.filename ??
                                this.createFilename(
                                    "gif"
                                );


                            this.downloadBlob(
                                blob,
                                filename
                            );


                            this.reportProgress(
                                1
                            );


                            this.reportStatus(
                                "GIF exported.",
                                "success"
                            );


                            resolve(
                                blob
                            );
                        }
                    );


                    gif.on(
                        "abort",
                        () => {

                            const error =
                                new Error(
                                    "GIF export was aborted."
                                );


                            this.reportStatus(
                                error.message,
                                "error"
                            );


                            reject(
                                error
                            );
                        }
                    );


                    this.reportStatus(
                        "Encoding GIF..."
                    );


                    gif.render();

                } catch (error) {

                    this.reportStatus(
                        "GIF export failed.",
                        "error"
                    );


                    reject(
                        error
                    );
                }
            }
        );
    }



    /* =====================================================
       EXPORT HISTORY GIF
       ===================================================== */

    exportHistoryGIF(
        options = {}
    ) {

        return new Promise(
            (
                resolve,
                reject
            ) => {

                try {

                    if (
                        this.history.length ===
                        0
                    ) {

                        throw new Error(
                            "No evolution history has been recorded."
                        );
                    }


                    const GIFConstructor =
                        this.getGIFConstructor();


                    if (!GIFConstructor) {

                        throw new Error(
                            "GIF.js is not loaded."
                        );
                    }


                    const first =
                        this.history[0]
                            .genome;


                    const width =
                        this.normaliseDimension(
                            options.width ??
                            first.width ??
                            this.width
                        );


                    const height =
                        this.normaliseDimension(
                            options.height ??
                            first.height ??
                            this.height
                        );


                    const frameDelay =
                        this.normaliseInteger(
                            options.frameDelay ??
                            this.gifFrameDelay,
                            10
                        );


                    const gif =
                        this.createGIFEncoder(
                            GIFConstructor,
                            width,
                            height,
                            options
                        );


                    const canvas =
                        document.createElement(
                            "canvas"
                        );


                    canvas.width =
                        width;


                    canvas.height =
                        height;


                    const context =
                        canvas.getContext(
                            "2d",
                            {
                                alpha: false
                            }
                        );


                    if (!context) {

                        throw new Error(
                            "Unable to create GIF history canvas."
                        );
                    }


                    this.reportStatus(
                        "Building evolution history GIF..."
                    );


                    for (
                        let i = 0;
                        i < this.history.length;
                        i++
                    ) {

                        const snapshot =
                            this.history[i];


                        this.renderGenomeToContext(
                            snapshot.genome,
                            context
                        );


                        const finalFrame =
                            i ===
                            this.history.length - 1;


                        gif.addFrame(
                            context,
                            {
                                copy: true,

                                delay:
                                    finalFrame
                                        ? Math.max(
                                            frameDelay,
                                            750
                                        )
                                        : frameDelay
                            }
                        );


                        this.reportProgress(
                            (
                                i + 1
                            ) /
                            this.history.length
                        );
                    }


                    gif.on(
                        "progress",
                        progress => {

                            this.reportProgress(
                                progress
                            );
                        }
                    );


                    gif.on(
                        "finished",
                        blob => {

                            const filename =
                                options.filename ??
                                this.createFilename(
                                    "gif"
                                );


                            this.downloadBlob(
                                blob,
                                filename
                            );


                            this.reportProgress(
                                1
                            );


                            this.reportStatus(
                                "History GIF exported.",
                                "success"
                            );


                            resolve(
                                blob
                            );
                        }
                    );


                    gif.on(
                        "abort",
                        () => {

                            reject(
                                new Error(
                                    "GIF export was aborted."
                                )
                            );
                        }
                    );


                    gif.render();

                } catch (error) {

                    this.reportStatus(
                        "History GIF export failed.",
                        "error"
                    );


                    reject(
                        error
                    );
                }
            }
        );
    }



    /* =====================================================
       CREATE GIF ENCODER
       ===================================================== */

    createGIFEncoder(
        GIFConstructor,
        width,
        height,
        options = {}
    ) {

        return new GIFConstructor({

            workers:
                this.normaliseInteger(
                    options.workers ??
                    this.gifWorkers,
                    1
                ),

            quality:
                this.normaliseInteger(
                    options.quality ??
                    this.gifQuality,
                    1
                ),

            width:
                width,

            height:
                height,

            workerScript:
                options.workerScript ??
                this.gifWorkerScript

        });
    }



    /* =====================================================
       GET GIF CONSTRUCTOR
       ===================================================== */

    getGIFConstructor() {

        if (
            typeof GIF !==
            "undefined"
        ) {

            return GIF;
        }


        if (
            typeof window !==
                "undefined" &&
            typeof window.GIF !==
                "undefined"
        ) {

            return window.GIF;
        }


        return null;
    }



    /* =====================================================
       RENDER PARTIAL GENOME
       ===================================================== */

    renderPartialGenome(
        genome,
        shapeCount,
        context
    ) {

        if (
            this.renderer &&
            typeof this.renderer
                .renderPartial ===
            "function"
        ) {

            this.renderer
                .renderPartial(
                    genome,
                    shapeCount,
                    context
                );


            return context.canvas;
        }


        /*
         * Fallback implementation.
         */

        const shapes =
            this.getShapes(
                genome
            );


        shapeCount =
            this.clamp(
                Math.floor(
                    Number(shapeCount) || 0
                ),
                0,
                shapes.length
            );


        this.clearAndDrawBackground(
            genome,
            context
        );


        const sourceWidth =
            genome.width ??
            this.width;


        const sourceHeight =
            genome.height ??
            this.height;


        const scaleX =
            context.canvas.width /
            sourceWidth;


        const scaleY =
            context.canvas.height /
            sourceHeight;


        context.save();


        context.scale(
            scaleX,
            scaleY
        );


        for (
            let i = 0;
            i < shapeCount;
            i++
        ) {

            this.drawShapeFallback(
                shapes[i],
                context
            );
        }


        context.restore();


        return context.canvas;
    }



    /* =====================================================
       RENDER GENOME TO CONTEXT
       ===================================================== */

    renderGenomeToContext(
        genome,
        context
    ) {

        if (
            this.renderer &&
            typeof this.renderer
                .renderToContext ===
            "function"
        ) {

            this.renderer
                .renderToContext(
                    genome,
                    context
                );


            return context.canvas;
        }


        return this.renderPartialGenome(
            genome,
            this.getShapes(
                genome
            ).length,
            context
        );
    }



    /* =====================================================
       CLEAR AND DRAW BACKGROUND
       ===================================================== */

    clearAndDrawBackground(
        genome,
        context
    ) {

        const width =
            context.canvas.width;


        const height =
            context.canvas.height;


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


        context.clearRect(
            0,
            0,
            width,
            height
        );


        context.fillStyle =
            this.getBackgroundCSS(
                genome
            );


        context.fillRect(
            0,
            0,
            width,
            height
        );


        context.restore();
    }



    /* =====================================================
       DRAW SHAPE FALLBACK
       ===================================================== */

    drawShapeFallback(
        shape,
        context
    ) {

        const type =
            this.getShapeType(
                shape
            );


        context.save();


        context.fillStyle =
            this.getShapeCSS(
                shape
            );


        context.globalAlpha =
            1;


        switch (type) {

            case "triangle": {

                const points =
                    this.getTrianglePoints(
                        shape
                    );


                if (
                    points.length <
                    3
                ) {

                    break;
                }


                context.beginPath();


                context.moveTo(
                    points[0].x,
                    points[0].y
                );


                context.lineTo(
                    points[1].x,
                    points[1].y
                );


                context.lineTo(
                    points[2].x,
                    points[2].y
                );


                context.closePath();


                context.fill();


                break;
            }


            case "circle":

            case "dot":

                context.beginPath();


                context.arc(
                    Number(shape.x) || 0,
                    Number(shape.y) || 0,
                    Math.max(
                        0.1,
                        Number(
                            shape.radius
                        ) || 1
                    ),
                    0,
                    Math.PI *
                    2
                );


                context.fill();


                break;
        }


        context.restore();
    }



    /* =====================================================
       GET BACKGROUND CSS
       ===================================================== */

    getBackgroundCSS(genome) {

        const background =
            genome?.background;


        if (
            typeof background ===
            "string"
        ) {

            return background;
        }


        if (
            background &&
            typeof background ===
                "object"
        ) {

            const r =
                this.clamp(
                    Number(background.r) || 0,
                    0,
                    255
                );


            const g =
                this.clamp(
                    Number(background.g) || 0,
                    0,
                    255
                );


            const b =
                this.clamp(
                    Number(background.b) || 0,
                    0,
                    255
                );


            return (
                "rgb(" +
                Math.round(r) +
                "," +
                Math.round(g) +
                "," +
                Math.round(b) +
                ")"
            );
        }


        return "#000000";
    }



    /* =====================================================
       GET SHAPE CSS
       ===================================================== */

    getShapeCSS(shape) {

        if (
            typeof shape
                ?.toCSSColour ===
            "function"
        ) {

            return shape
                .toCSSColour();
        }


        const r =
            this.clamp(
                Number(shape?.r) || 0,
                0,
                255
            );


        const g =
            this.clamp(
                Number(shape?.g) || 0,
                0,
                255
            );


        const b =
            this.clamp(
                Number(shape?.b) || 0,
                0,
                255
            );


        const a =
            this.getAlpha(
                shape
            );


        return (
            "rgba(" +
            Math.round(r) +
            "," +
            Math.round(g) +
            "," +
            Math.round(b) +
            "," +
            a +
            ")"
        );
    }



    /* =====================================================
       GET ALPHA
       ===================================================== */

    getAlpha(shape) {

        const alpha =
            Number(
                shape?.a ??
                shape?.alpha ??
                shape?.opacity ??
                1
            );


        return this.clamp(
            Number.isFinite(alpha)
                ? alpha
                : 1,
            0,
            1
        );
    }



    /* =====================================================
       GET TRIANGLE POINTS
       ===================================================== */

    getTrianglePoints(shape) {

        const points =
            shape?.points ??
            shape?.vertices;


        return Array.isArray(points)
            ? points
            : [];
    }



    /* =====================================================
       GET SHAPES
       ===================================================== */

    getShapes(genome) {

        if (!genome) {

            return [];
        }


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

            const shapes =
                genome.getShapes();


            if (
                Array.isArray(shapes)
            ) {

                return shapes;
            }
        }


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

            const genes =
                genome.getGenes();


            if (
                Array.isArray(genes)
            ) {

                return genes;
            }
        }


        if (
            Array.isArray(
                genome.triangles
            )
        ) {

            return genome.triangles;
        }


        return [];
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

            return shape.type
                .toLowerCase();
        }


        if (
            typeof DotGene !==
                "undefined" &&
            shape instanceof DotGene
        ) {

            return "dot";
        }


        if (
            typeof CircleGene !==
                "undefined" &&
            shape instanceof CircleGene
        ) {

            return "circle";
        }


        if (
            typeof TriangleGene !==
                "undefined" &&
            shape instanceof TriangleGene
        ) {

            return "triangle";
        }


        if (
            Array.isArray(
                shape.points
            ) ||
            Array.isArray(
                shape.vertices
            )
        ) {

            return "triangle";
        }


        if (
            Number.isFinite(
                shape.radius
            )
        ) {

            return "circle";
        }


        return "unknown";
    }



    /* =====================================================
       COUNT SHAPE TYPES
       ===================================================== */

    countShapeTypes(shapes) {

        const result = {

            triangle:
                0,

            circle:
                0,

            dot:
                0

        };


        for (
            const shape of
            shapes
        ) {

            const type =
                this.getShapeType(
                    shape
                );


            if (
                Object.prototype
                    .hasOwnProperty.call(
                        result,
                        type
                    )
            ) {

                result[type]++;
            }
        }


        return result;
    }



    /* =====================================================
       CLONE GENOME
       ===================================================== */

    cloneGenome(genome) {

        if (
            typeof genome
                ?.clone ===
            "function"
        ) {

            return genome.clone();
        }


        if (
            typeof genome
                ?.copy ===
            "function"
        ) {

            return genome.copy();
        }


        /*
         * JSON round-trip fallback.
         */

        const data =
            this.createGenomeData(
                genome
            );


        return this.createGenomeFromData(
            data
        );
    }



    /* =====================================================
       SERIALISE BACKGROUND
       ===================================================== */

    serialiseBackground(
        background
    ) {

        if (
            background ===
            undefined ||
            background ===
            null
        ) {

            return null;
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

            return {

                r:
                    Number(
                        background.r
                    ) || 0,

                g:
                    Number(
                        background.g
                    ) || 0,

                b:
                    Number(
                        background.b
                    ) || 0

            };
        }


        return background;
    }



    /* =====================================================
       DESERIALISE BACKGROUND
       ===================================================== */

    deserialiseBackground(
        background
    ) {

        if (
            background &&
            typeof background ===
                "object"
        ) {

            return {

                r:
                    this.clamp(
                        Number(
                            background.r
                        ) || 0,
                        0,
                        255
                    ),

                g:
                    this.clamp(
                        Number(
                            background.g
                        ) || 0,
                        0,
                        255
                    ),

                b:
                    this.clamp(
                        Number(
                            background.b
                        ) || 0,
                        0,
                        255
                    )

            };
        }


        return background;
    }



    /* =====================================================
       SERIALISE NUMBER

       JSON does not support Infinity or NaN.
       ===================================================== */

    serialiseNumber(value) {

        const number =
            Number(value);


        return Number.isFinite(
            number
        )
            ? number
            : null;
    }



    /* =====================================================
       CANVAS TO BLOB
       ===================================================== */

    canvasToBlob(
        canvas,
        type = "image/png",
        quality = undefined
    ) {

        return new Promise(
            (
                resolve,
                reject
            ) => {

                try {

                    canvas.toBlob(
                        blob => {

                            if (!blob) {

                                reject(
                                    new Error(
                                        "Canvas could not be encoded."
                                    )
                                );


                                return;
                            }


                            resolve(
                                blob
                            );
                        },
                        type,
                        quality
                    );

                } catch (error) {

                    reject(
                        error
                    );
                }
            }
        );
    }



    /* =====================================================
       DOWNLOAD BLOB
       ===================================================== */

    downloadBlob(
        blob,
        filename
    ) {

        if (!blob) {

            throw new Error(
                "Cannot download an empty Blob."
            );
        }


        const url =
            URL.createObjectURL(
                blob
            );


        const anchor =
            document.createElement(
                "a"
            );


        anchor.href =
            url;


        anchor.download =
            this.sanitiseFilename(
                filename
            );


        anchor.style.display =
            "none";


        document.body
            .appendChild(
                anchor
            );


        anchor.click();


        anchor.remove();


        /*
         * Delay revocation because some browsers do not
         * begin reading the Blob immediately.
         */

        setTimeout(
            () => {

                URL.revokeObjectURL(
                    url
                );

            },
            1000
        );


        return true;
    }



    /* =====================================================
       CREATE FILENAME
       ===================================================== */

    createFilename(extension) {

        extension =
            String(
                extension ??
                ""
            )
                .replace(
                    /^\./,
                    ""
                )
                .toLowerCase();


        const timestamp =
            new Date()
                .toISOString()
                .replace(
                    /[:.]/g,
                    "-"
                );


        return (
            this.sanitiseFilename(
                this.baseFilename
            ) +
            "-" +
            timestamp +
            "." +
            extension
        );
    }



    /* =====================================================
       SANITISE FILENAME
       ===================================================== */

    sanitiseFilename(filename) {

        return String(
            filename ??
            "export"
        )
            .replace(
                /[<>:"/\\|?*\x00-\x1F]/g,
                "-"
            )
            .replace(
                /\s+/g,
                "-"
            )
            .replace(
                /-+/g,
                "-"
            )
            .replace(
                /^-+|-+$/g,
                ""
            ) ||
            "export";
    }



    /* =====================================================
       NORMALISE DIMENSION
       ===================================================== */

    normaliseDimension(value) {

        value =
            Number(value);


        if (
            !Number.isFinite(value)
        ) {

            value =
                1;
        }


        return Math.max(
            1,
            Math.floor(
                value
            )
        );
    }



    /* =====================================================
       NORMALISE INTEGER
       ===================================================== */

    normaliseInteger(
        value,
        minimum = 0
    ) {

        value =
            Number(value);


        if (
            !Number.isFinite(value)
        ) {

            value =
                minimum;
        }


        return Math.max(
            minimum,
            Math.floor(
                value
            )
        );
    }



    /* =====================================================
       CLAMP
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