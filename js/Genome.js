/* =========================================================
   MIDLIFE PROGRAMMER
   Evolve Mona Lisa
   Genome.js

   Represents one candidate image.

   A Genome contains an ORDERED collection of:

   - TriangleGene
   - CircleGene
   - DotGene

   IMPORTANT:

   Normal mutation NEVER changes the number of triangles,
   circles or dots.

   Shape counts remain fixed throughout evolution.

   Mutation may:

   - mutate existing geometry
   - mutate existing colour / alpha
   - replace a shape with a NEW shape OF THE SAME TYPE
   - change layer order

   Structural add/remove methods remain available for setup,
   import and explicit editing, but are never used by
   mutate().
   ========================================================= */


class Genome {


    /* =====================================================
       CONSTRUCTOR
       ===================================================== */

    constructor(
        triangleCount = 100,
        circleCount = 40,
        dotCount = 25,
        width = 480,
        height = 715
    ) {

        /*
         * Object form:
         *
         * new Genome({
         *     triangleCount: 100,
         *     circleCount: 40,
         *     dotCount: 25,
         *     width: 480,
         *     height: 715
         * });
         */

        if (
            triangleCount &&
            typeof triangleCount === "object"
        ) {

            const options =
                triangleCount;


            triangleCount =
                options.triangleCount ??
                100;


            circleCount =
                options.circleCount ??
                40;


            dotCount =
                options.dotCount ??
                25;


            width =
                options.width ??
                480;


            height =
                options.height ??
                715;
        }


        this.width =
            Math.max(
                1,
                Math.floor(
                    Number(width) || 480
                )
            );


        this.height =
            Math.max(
                1,
                Math.floor(
                    Number(height) || 715
                )
            );


        /* =================================================
           ORDERED SHAPE STACK
           ================================================= */

        this.shapes = [];


        /* =================================================
           BACKGROUND
           ================================================= */

        this.backgroundColour = {

            r: 32,
            g: 32,
            b: 32

        };


        /* =================================================
           FITNESS
           ================================================= */

        this.fitness =
            undefined;


        this.similarity =
            undefined;


        this.error =
            undefined;


        /*
         * Progressive-resolution fitness metadata.
         */

        this.fitnessStage =
            undefined;


        this.fitnessWidth =
            undefined;


        this.fitnessHeight =
            undefined;


        /* =================================================
           CREATE INITIAL SHAPES
           ================================================= */

        this.createRandomShapes(
            triangleCount,
            circleCount,
            dotCount
        );
    }



    /* =====================================================
       CREATE INITIAL RANDOM SHAPES
       ===================================================== */

    createRandomShapes(
        triangleCount,
        circleCount,
        dotCount
    ) {

        triangleCount =
            this.normaliseCount(
                triangleCount
            );


        circleCount =
            this.normaliseCount(
                circleCount
            );


        dotCount =
            this.normaliseCount(
                dotCount
            );


        const created = [];


        for (
            let i = 0;
            i < triangleCount;
            i++
        ) {

            created.push(
                this.createRandomTriangle()
            );
        }


        for (
            let i = 0;
            i < circleCount;
            i++
        ) {

            created.push(
                this.createRandomCircle()
            );
        }


        for (
            let i = 0;
            i < dotCount;
            i++
        ) {

            created.push(
                this.createRandomDot()
            );
        }


        /*
         * Layer order is part of the genome.
         *
         * Mixing the initial types prevents all triangles,
         * circles and dots appearing as three separate
         * rendering blocks.
         */

        this.shuffleArray(
            created
        );


        this.shapes.push(
            ...created
        );


        this.invalidateFitness();


        return this;
    }



    /* =====================================================
       CREATE RANDOM TRIANGLES
       ===================================================== */

    createRandomTriangles(count) {

        count =
            this.normaliseCount(
                count
            );


        for (
            let i = 0;
            i < count;
            i++
        ) {

            this.shapes.push(
                this.createRandomTriangle()
            );
        }


        this.invalidateFitness();


        return this;
    }



    /* =====================================================
       CREATE RANDOM CIRCLES
       ===================================================== */

    createRandomCircles(count) {

        count =
            this.normaliseCount(
                count
            );


        for (
            let i = 0;
            i < count;
            i++
        ) {

            this.shapes.push(
                this.createRandomCircle()
            );
        }


        this.invalidateFitness();


        return this;
    }



    /* =====================================================
       CREATE RANDOM DOTS
       ===================================================== */

    createRandomDots(count) {

        count =
            this.normaliseCount(
                count
            );


        for (
            let i = 0;
            i < count;
            i++
        ) {

            this.shapes.push(
                this.createRandomDot()
            );
        }


        this.invalidateFitness();


        return this;
    }



    /* =====================================================
       CREATE RANDOM TRIANGLE
       ===================================================== */

    createRandomTriangle() {

        if (
            typeof TriangleGene ===
            "undefined"
        ) {

            throw new Error(
                "TriangleGene.js must be loaded before Genome.js."
            );
        }


        try {

            return new TriangleGene(
                this.width,
                this.height
            );

        } catch (error) {

            return new TriangleGene({

                width:
                    this.width,

                height:
                    this.height

            });
        }
    }



    /* =====================================================
       CREATE RANDOM CIRCLE
       ===================================================== */

    createRandomCircle() {

        if (
            typeof CircleGene ===
            "undefined"
        ) {

            throw new Error(
                "CircleGene.js must be loaded before Genome.js."
            );
        }


        try {

            return new CircleGene(
                this.width,
                this.height
            );

        } catch (error) {

            return new CircleGene({

                width:
                    this.width,

                height:
                    this.height

            });
        }
    }



    /* =====================================================
       CREATE RANDOM DOT
       ===================================================== */

    createRandomDot() {

        if (
            typeof DotGene ===
            "undefined"
        ) {

            throw new Error(
                "DotGene.js must be loaded before Genome.js."
            );
        }


        try {

            return new DotGene(
                this.width,
                this.height
            );

        } catch (error) {

            return new DotGene({

                width:
                    this.width,

                height:
                    this.height

            });
        }
    }



    /* =====================================================
       CREATE SHAPE OF TYPE
       ===================================================== */

    createShapeOfType(type) {

        type =
            String(
                type ?? ""
            ).toLowerCase();


        switch (type) {

            case "triangle":

                return this.createRandomTriangle();


            case "circle":

                return this.createRandomCircle();


            case "dot":

                return this.createRandomDot();


            default:

                /*
                 * Unknown types should not silently change
                 * the genetic composition.
                 */

                return null;
        }
    }



    /* =====================================================
       CREATE RANDOM GENE

       Utility only.

       Normal mutation does NOT use this because it could
       change the configured type counts.
       ===================================================== */

    createRandomGene() {

        const roll =
            Math.random();


        if (
            roll < 0.50
        ) {

            return this.createRandomTriangle();
        }


        if (
            roll < 0.80
        ) {

            return this.createRandomCircle();
        }


        return this.createRandomDot();
    }



    /* =====================================================
       GET SHAPES
       ===================================================== */

    getShapes() {

        return this.shapes;
    }



    /* =====================================================
       GET GENES
       ===================================================== */

    getGenes() {

        return this.shapes;
    }



    /* =====================================================
       GET TRIANGLES
       ===================================================== */

    getTriangles() {

        return this.shapes.filter(
            shape =>
                this.getShapeType(shape) ===
                "triangle"
        );
    }



    /* =====================================================
       GET CIRCLES
       ===================================================== */

    getCircles() {

        return this.shapes.filter(
            shape =>
                this.getShapeType(shape) ===
                "circle"
        );
    }



    /* =====================================================
       GET DOTS
       ===================================================== */

    getDots() {

        return this.shapes.filter(
            shape =>
                this.getShapeType(shape) ===
                "dot"
        );
    }



    /* =====================================================
       COUNTS
       ===================================================== */

    getShapeCount() {

        return this.shapes.length;
    }


    getTriangleCount() {

        return this.countShapeType(
            "triangle"
        );
    }


    getCircleCount() {

        return this.countShapeType(
            "circle"
        );
    }


    getDotCount() {

        return this.countShapeType(
            "dot"
        );
    }



    getShapeCounts() {

        return {

            triangleCount:
                this.getTriangleCount(),

            circleCount:
                this.getCircleCount(),

            dotCount:
                this.getDotCount(),

            total:
                this.getShapeCount()

        };
    }



    /* =====================================================
       COUNT SHAPE TYPE
       ===================================================== */

    countShapeType(type) {

        let count = 0;


        for (
            const shape of
            this.shapes
        ) {

            if (
                this.getShapeType(shape) ===
                type
            ) {

                count++;
            }
        }


        return count;
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


        return "unknown";
    }



    /* =====================================================
       ADD SHAPE

       Explicit structural editing operation.

       This is intentionally NOT used by mutate().
       ===================================================== */

    addShape(shape) {

        if (!shape) {

            return null;
        }


        this.shapes.push(
            shape
        );


        this.invalidateFitness();


        return shape;
    }



    /* =====================================================
       INSERT SHAPE
       ===================================================== */

    insertShape(
        shape,
        index
    ) {

        if (!shape) {

            return null;
        }


        index =
            Math.floor(
                Number(index)
            );


        if (
            !Number.isFinite(index)
        ) {

            index =
                this.shapes.length;
        }


        index =
            this.clamp(
                index,
                0,
                this.shapes.length
            );


        this.shapes.splice(
            index,
            0,
            shape
        );


        this.invalidateFitness();


        return shape;
    }



    /* =====================================================
       ADD TYPE HELPERS
       ===================================================== */

    addTriangle() {

        const triangle =
            this.createRandomTriangle();


        this.addShape(
            triangle
        );


        return triangle;
    }



    addCircle() {

        const circle =
            this.createRandomCircle();


        this.addShape(
            circle
        );


        return circle;
    }



    addDot() {

        const dot =
            this.createRandomDot();


        this.addShape(
            dot
        );


        return dot;
    }



    addExistingTriangle(triangle) {

        return this.addShape(
            triangle
        );
    }



    addExistingCircle(circle) {

        return this.addShape(
            circle
        );
    }



    addExistingDot(dot) {

        return this.addShape(
            dot
        );
    }



    /* =====================================================
       ADD RANDOM SHAPE

       Explicit structural editing helper only.
       ===================================================== */

    addRandomShape() {

        const shape =
            this.createRandomGene();


        return this.addShape(
            shape
        );
    }



    /* =====================================================
       REMOVE SHAPE

       Explicit structural editing helper only.
       ===================================================== */

    removeShape(index = null) {

        if (
            this.shapes.length ===
            0
        ) {

            return null;
        }


        if (
            index === null ||
            index === undefined
        ) {

            index =
                this.getRandomShapeIndex();
        }


        index =
            Math.floor(
                Number(index)
            );


        if (
            !Number.isFinite(index) ||
            index < 0 ||
            index >=
                this.shapes.length
        ) {

            return null;
        }


        const removed =
            this.shapes.splice(
                index,
                1
            )[0];


        this.invalidateFitness();


        return removed;
    }



    /* =====================================================
       REMOVE TYPE HELPERS
       ===================================================== */

    removeTriangle(index = null) {

        return this.removeShapeType(
            "triangle",
            index
        );
    }



    removeCircle(index = null) {

        return this.removeShapeType(
            "circle",
            index
        );
    }



    removeDot(index = null) {

        return this.removeShapeType(
            "dot",
            index
        );
    }



    /* =====================================================
       REMOVE SHAPE OF TYPE
       ===================================================== */

    removeShapeType(
        type,
        typeIndex = null
    ) {

        const indices = [];


        for (
            let i = 0;
            i < this.shapes.length;
            i++
        ) {

            if (
                this.getShapeType(
                    this.shapes[i]
                ) ===
                type
            ) {

                indices.push(i);
            }
        }


        if (
            indices.length ===
            0
        ) {

            return null;
        }


        let actualIndex;


        if (
            typeIndex === null ||
            typeIndex === undefined
        ) {

            actualIndex =
                indices[
                    Math.floor(
                        Math.random() *
                        indices.length
                    )
                ];

        } else {

            typeIndex =
                Math.floor(
                    Number(typeIndex)
                );


            if (
                !Number.isFinite(typeIndex) ||
                typeIndex < 0 ||
                typeIndex >=
                    indices.length
            ) {

                return null;
            }


            actualIndex =
                indices[
                    typeIndex
                ];
        }


        return this.removeShape(
            actualIndex
        );
    }



    /* =====================================================
       REPLACE SHAPE

       Explicit editing/import helper.

       This method itself permits a type change because it is
       useful outside normal evolution.

       Normal mutation instead uses replaceRandomShape(),
       which ALWAYS preserves the original type.
       ===================================================== */

    replaceShape(
        index,
        shape
    ) {

        if (!shape) {

            return false;
        }


        index =
            Math.floor(
                Number(index)
            );


        if (
            !Number.isFinite(index) ||
            index < 0 ||
            index >=
                this.shapes.length
        ) {

            return false;
        }


        this.shapes[index] =
            shape;


        this.invalidateFitness();


        return true;
    }



    /* =====================================================
       RANDOM SHAPE
       ===================================================== */

    getRandomShape() {

        if (
            this.shapes.length ===
            0
        ) {

            return null;
        }


        return this.shapes[
            this.getRandomShapeIndex()
        ];
    }



    /* =====================================================
       RANDOM SHAPE INDEX
       ===================================================== */

    getRandomShapeIndex() {

        if (
            this.shapes.length ===
            0
        ) {

            return -1;
        }


        return Math.floor(
            Math.random() *
            this.shapes.length
        );
    }



    /* =====================================================
       RANDOM TYPE HELPERS
       ===================================================== */

    getRandomTriangle() {

        return this.getRandomShapeOfType(
            "triangle"
        );
    }



    getRandomCircle() {

        return this.getRandomShapeOfType(
            "circle"
        );
    }



    getRandomDot() {

        return this.getRandomShapeOfType(
            "dot"
        );
    }



    /* =====================================================
       RANDOM SHAPE OF TYPE
       ===================================================== */

    getRandomShapeOfType(type) {

        const matching =
            this.shapes.filter(
                shape =>
                    this.getShapeType(shape) ===
                    type
            );


        if (
            matching.length ===
            0
        ) {

            return null;
        }


        return matching[
            Math.floor(
                Math.random() *
                matching.length
            )
        ];
    }



    /* =====================================================
       MUTATE

       CRITICAL INVARIANT:

       Mutation preserves:

       - total shape count
       - triangle count
       - circle count
       - dot count
       ===================================================== */

    mutate(
        mutationCount = 1,
        strength = 0.15
    ) {

        if (
            this.shapes.length ===
            0
        ) {

            return this;
        }


        mutationCount =
            Math.max(
                1,
                Math.floor(
                    Number(
                        mutationCount
                    ) || 1
                )
            );


        strength =
            this.clamp(
                Number(strength) ||
                    0.15,
                0.001,
                1
            );


        /*
         * Capture the invariant before mutation.
         *
         * This also makes accidental future count drift much
         * easier to detect while developing the project.
         */

        const beforeCounts =
            this.getShapeCounts();


        for (
            let i = 0;
            i < mutationCount;
            i++
        ) {

            this.performMutation(
                strength
            );
        }


        const afterCounts =
            this.getShapeCounts();


        if (
            beforeCounts.triangleCount !==
                afterCounts.triangleCount ||
            beforeCounts.circleCount !==
                afterCounts.circleCount ||
            beforeCounts.dotCount !==
                afterCounts.dotCount ||
            beforeCounts.total !==
                afterCounts.total
        ) {

            throw new Error(
                "Genome mutation violated fixed shape counts."
            );
        }


        this.invalidateFitness();


        return this;
    }



    /* =====================================================
       PERFORM ONE MUTATION

       No add/remove operations exist here.

       Distribution:

       95% mutate an existing shape
        3% replace a shape with SAME TYPE
        2% change layer order
       ===================================================== */

    performMutation(strength) {

        if (
            this.shapes.length ===
            0
        ) {

            return false;
        }


        const roll =
            Math.random();


        /*
         * 95%:
         *
         * Fine/local mutation.
         */

        if (
            roll < 0.95
        ) {

            this.mutateRandomShape(
                strength
            );


            return true;
        }


        /*
         * 3%:
         *
         * Larger structural reset, but the replacement is
         * ALWAYS the same gene family.
         */

        if (
            roll < 0.98
        ) {

            this.replaceRandomShape();


            return true;
        }


        /*
         * 2%:
         *
         * Layer-order mutation.
         */

        return this.swapRandomShapes();
    }



    /* =====================================================
       MUTATE RANDOM SHAPE
       ===================================================== */

    mutateRandomShape(strength) {

        const shape =
            this.getRandomShape();


        if (!shape) {

            return null;
        }


        if (
            typeof shape.mutate ===
            "function"
        ) {

            shape.mutate(
                strength
            );

        } else {

            this.basicShapeMutation(
                shape,
                strength
            );
        }


        this.invalidateFitness();


        return shape;
    }



    /* =====================================================
       MUTATE RANDOM TRIANGLE
       ===================================================== */

    mutateRandomTriangle(strength) {

        const triangle =
            this.getRandomTriangle();


        if (!triangle) {

            return null;
        }


        if (
            typeof triangle.mutate ===
            "function"
        ) {

            triangle.mutate(
                strength
            );

        } else {

            this.basicShapeMutation(
                triangle,
                strength
            );
        }


        this.invalidateFitness();


        return triangle;
    }



    /* =====================================================
       MUTATE RANDOM CIRCLE
       ===================================================== */

    mutateRandomCircle(strength) {

        const circle =
            this.getRandomCircle();


        if (!circle) {

            return null;
        }


        if (
            typeof circle.mutate ===
            "function"
        ) {

            circle.mutate(
                strength
            );

        } else {

            this.basicShapeMutation(
                circle,
                strength
            );
        }


        this.invalidateFitness();


        return circle;
    }



    /* =====================================================
       MUTATE RANDOM DOT
       ===================================================== */

    mutateRandomDot(strength) {

        const dot =
            this.getRandomDot();


        if (!dot) {

            return null;
        }


        if (
            typeof dot.mutate ===
            "function"
        ) {

            dot.mutate(
                strength
            );

        } else {

            this.basicShapeMutation(
                dot,
                strength
            );
        }


        this.invalidateFitness();


        return dot;
    }



    /* =====================================================
       BASIC MUTATION FALLBACK
       ===================================================== */

    basicShapeMutation(
        shape,
        strength
    ) {

        if (!shape) {

            return;
        }


        const points =
            shape.points ??
            shape.vertices;


        /*
         * Triangle-style geometry.
         */

        if (
            Array.isArray(points) &&
            points.length > 0
        ) {

            const point =
                points[
                    Math.floor(
                        Math.random() *
                        points.length
                    )
                ];


            if (
                Number.isFinite(
                    Number(point.x)
                )
            ) {

                point.x =
                    this.clamp(

                        Number(point.x) +
                        this.randomSigned() *
                        this.width *
                        strength,

                        0,
                        this.width
                    );
            }


            if (
                Number.isFinite(
                    Number(point.y)
                )
            ) {

                point.y =
                    this.clamp(

                        Number(point.y) +
                        this.randomSigned() *
                        this.height *
                        strength,

                        0,
                        this.height
                    );
            }


            return;
        }


        /*
         * Circle/dot-style geometry.
         */

        if (
            Number.isFinite(
                Number(shape.x)
            ) &&
            Number.isFinite(
                Number(shape.y)
            )
        ) {

            shape.x =
                this.clamp(

                    Number(shape.x) +
                    this.randomSigned() *
                    this.width *
                    strength,

                    0,
                    this.width
                );


            shape.y =
                this.clamp(

                    Number(shape.y) +
                    this.randomSigned() *
                    this.height *
                    strength,

                    0,
                    this.height
                );
        }
    }



    /* =====================================================
       REPLACE RANDOM SHAPE

       FIXED-COUNT VERSION.

       The replacement is ALWAYS the same type as the
       original gene.
       ===================================================== */

    replaceRandomShape() {

        if (
            this.shapes.length ===
            0
        ) {

            return null;
        }


        const index =
            this.getRandomShapeIndex();


        const oldShape =
            this.shapes[index];


        const oldType =
            this.getShapeType(
                oldShape
            );


        const replacement =
            this.createShapeOfType(
                oldType
            );


        /*
         * Unknown type: do not risk changing the genome.
         */

        if (!replacement) {

            return null;
        }


        this.shapes[index] =
            replacement;


        this.invalidateFitness();


        return replacement;
    }



    /* =====================================================
       SWAP RANDOM SHAPES

       Layer order matters because translucent alpha
       blending is order dependent.
       ===================================================== */

    swapRandomShapes() {

        if (
            this.shapes.length < 2
        ) {

            return false;
        }


        const indexA =
            this.getRandomShapeIndex();


        let indexB =
            this.getRandomShapeIndex();


        while (
            indexB === indexA
        ) {

            indexB =
                this.getRandomShapeIndex();
        }


        const temporary =
            this.shapes[indexA];


        this.shapes[indexA] =
            this.shapes[indexB];


        this.shapes[indexB] =
            temporary;


        this.invalidateFitness();


        return true;
    }



    /* =====================================================
       MOVE SHAPE TO LAYER
       ===================================================== */

    moveShapeToIndex(
        oldIndex,
        newIndex
    ) {

        oldIndex =
            Math.floor(
                Number(oldIndex)
            );


        newIndex =
            Math.floor(
                Number(newIndex)
            );


        if (
            !Number.isFinite(oldIndex) ||
            !Number.isFinite(newIndex) ||
            oldIndex < 0 ||
            oldIndex >=
                this.shapes.length
        ) {

            return false;
        }


        newIndex =
            this.clamp(
                newIndex,
                0,
                this.shapes.length - 1
            );


        if (
            oldIndex === newIndex
        ) {

            return false;
        }


        const shape =
            this.shapes.splice(
                oldIndex,
                1
            )[0];


        this.shapes.splice(
            newIndex,
            0,
            shape
        );


        this.invalidateFitness();


        return true;
    }



    /* =====================================================
       MUTATE BACKGROUND

       Kept as an explicit operation.

       Normal Genome.mutate() does not alter the background
       because the UI controls the background mode.
       ===================================================== */

    mutateBackground(
        strength = 0.1
    ) {

        strength =
            this.clamp(
                Number(strength) ||
                    0.1,
                0.001,
                1
            );


        const channels = [
            "r",
            "g",
            "b"
        ];


        const channel =
            channels[
                Math.floor(
                    Math.random() *
                    channels.length
                )
            ];


        const delta =
            this.randomSigned() *
            255 *
            strength;


        this.backgroundColour[channel] =
            this.clamp(

                this.backgroundColour[channel] +
                delta,

                0,
                255
            );


        this.invalidateFitness();


        return this;
    }



    /* =====================================================
       SET BACKGROUND COLOUR
       ===================================================== */

    setBackgroundColour(
        r,
        g,
        b
    ) {

        if (
            r &&
            typeof r ===
            "object"
        ) {

            const colour =
                r;


            r =
                colour.r ??
                0;


            g =
                colour.g ??
                0;


            b =
                colour.b ??
                0;
        }


        this.backgroundColour = {

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
                )

        };


        this.invalidateFitness();


        return this;
    }



    /* =====================================================
       GET BACKGROUND COLOUR
       ===================================================== */

    getBackgroundColour() {

        return {

            r:
                this.backgroundColour.r,

            g:
                this.backgroundColour.g,

            b:
                this.backgroundColour.b

        };
    }



    /* =====================================================
       CLONE
       ===================================================== */

    clone() {

        const clone =
            Object.create(
                Genome.prototype
            );


        clone.width =
            this.width;


        clone.height =
            this.height;


        clone.backgroundColour = {

            r:
                this.backgroundColour.r,

            g:
                this.backgroundColour.g,

            b:
                this.backgroundColour.b

        };


        /*
         * Deep clone every gene.
         *
         * Parent and child must never share mutable shape
         * objects.
         */

        clone.shapes =
            this.shapes.map(
                shape =>
                    this.cloneShape(
                        shape
                    )
            );


        clone.fitness =
            this.fitness;


        clone.similarity =
            this.similarity;


        clone.error =
            this.error;


        /*
         * Preserve progressive fitness metadata.
         */

        clone.fitnessStage =
            this.fitnessStage;


        clone.fitnessWidth =
            this.fitnessWidth;


        clone.fitnessHeight =
            this.fitnessHeight;


        return clone;
    }



    /* =====================================================
       COPY ALIAS
       ===================================================== */

    copy() {

        return this.clone();
    }



    /* =====================================================
       CLONE SHAPE
       ===================================================== */

    cloneShape(shape) {

        if (!shape) {

            return shape;
        }


        if (
            typeof shape.clone ===
            "function"
        ) {

            return shape.clone();
        }


        if (
            typeof shape.copy ===
            "function"
        ) {

            return shape.copy();
        }


        const clone =
            Object.create(
                Object.getPrototypeOf(
                    shape
                )
            );


        for (
            const key of
            Object.keys(shape)
        ) {

            clone[key] =
                this.deepCloneValue(
                    shape[key]
                );
        }


        return clone;
    }



    /* =====================================================
       CLONE TRIANGLE
       ===================================================== */

    cloneTriangle(triangle) {

        return this.cloneShape(
            triangle
        );
    }



    /* =====================================================
       DEEP CLONE VALUE
       ===================================================== */

    deepCloneValue(value) {

        if (
            value === null ||
            value === undefined
        ) {

            return value;
        }


        if (
            typeof value !==
            "object"
        ) {

            return value;
        }


        if (
            typeof value.clone ===
            "function"
        ) {

            return value.clone();
        }


        if (
            Array.isArray(value)
        ) {

            return value.map(
                item =>
                    this.deepCloneValue(
                        item
                    )
            );
        }


        const clone = {};


        for (
            const key of
            Object.keys(value)
        ) {

            clone[key] =
                this.deepCloneValue(
                    value[key]
                );
        }


        return clone;
    }



    /* =====================================================
       SET DIMENSIONS
       ===================================================== */

    setDimensions(
        width,
        height,
        scaleShapes = true
    ) {

        width =
            Math.max(
                1,
                Math.floor(
                    Number(width) ||
                    this.width
                )
            );


        height =
            Math.max(
                1,
                Math.floor(
                    Number(height) ||
                    this.height
                )
            );


        const oldWidth =
            this.width;


        const oldHeight =
            this.height;


        this.width =
            width;


        this.height =
            height;


        for (
            const shape of
            this.shapes
        ) {

            if (
                typeof shape.setDimensions ===
                "function"
            ) {

                shape.setDimensions(
                    width,
                    height,
                    scaleShapes
                );


                continue;
            }


            if (scaleShapes) {

                this.scaleShapeCoordinates(
                    shape,
                    oldWidth,
                    oldHeight,
                    width,
                    height
                );
            }


            if (
                "width" in shape
            ) {

                shape.width =
                    width;
            }


            if (
                "height" in shape
            ) {

                shape.height =
                    height;
            }
        }


        this.invalidateFitness();


        return this;
    }



    /* =====================================================
       SCALE SHAPE COORDINATES
       ===================================================== */

    scaleShapeCoordinates(
        shape,
        oldWidth,
        oldHeight,
        newWidth,
        newHeight
    ) {

        if (
            !shape ||
            oldWidth <= 0 ||
            oldHeight <= 0
        ) {

            return;
        }


        const scaleX =
            newWidth /
            oldWidth;


        const scaleY =
            newHeight /
            oldHeight;


        const points =
            shape.points ??
            shape.vertices;


        if (
            Array.isArray(points)
        ) {

            for (
                const point of
                points
            ) {

                if (
                    Number.isFinite(
                        Number(point.x)
                    )
                ) {

                    point.x *=
                        scaleX;
                }


                if (
                    Number.isFinite(
                        Number(point.y)
                    )
                ) {

                    point.y *=
                        scaleY;
                }
            }
        }


        if (
            Number.isFinite(
                Number(shape.x)
            )
        ) {

            shape.x *=
                scaleX;
        }


        if (
            Number.isFinite(
                Number(shape.y)
            )
        ) {

            shape.y *=
                scaleY;
        }


        if (
            Number.isFinite(
                Number(shape.radius)
            )
        ) {

            shape.radius *=
                (
                    scaleX +
                    scaleY
                ) /
                2;
        }
    }



    /* =====================================================
       RANDOMISE

       Explicitly reconstructs the Genome while preserving
       the requested/configured counts.
       ===================================================== */

    randomise(
        triangleCount =
            this.getTriangleCount(),

        circleCount =
            this.getCircleCount(),

        dotCount =
            this.getDotCount()
    ) {

        this.shapes = [];


        this.createRandomShapes(
            triangleCount,
            circleCount,
            dotCount
        );


        this.invalidateFitness();


        return this;
    }



    /* =====================================================
       CREATE SHAPE NEAR ERROR POINT
       ===================================================== */

    createShapeNear(
        type,
        x,
        y,
        targetColour = null
    ) {

        const shape =
            this.createShapeOfType(
                type
            );


        if (!shape) {

            return null;
        }


        if (
            typeof shape.moveNear ===
            "function"
        ) {

            shape.moveNear(
                x,
                y
            );

        } else {

            this.moveTriangleNear(
                shape,
                x,
                y
            );
        }


        if (
            targetColour &&
            typeof shape.setTargetColour ===
                "function"
        ) {

            shape.setTargetColour(
                targetColour
            );
        }


        return shape;
    }



    /* =====================================================
       MOVE TRIANGLE NEAR POINT
       ===================================================== */

    moveTriangleNear(
        triangle,
        x,
        y,
        spread = 0.15
    ) {

        if (!triangle) {

            return triangle;
        }


        /*
         * New TriangleGene has moveNear().
         */

        if (
            typeof triangle.moveNear ===
            "function"
        ) {

            triangle.moveNear(
                x,
                y,
                spread
            );


            return triangle;
        }


        const points =
            triangle.points ??
            triangle.vertices;


        if (
            !Array.isArray(points)
        ) {

            return triangle;
        }


        for (
            const point of
            points
        ) {

            point.x =
                this.clamp(

                    Number(x) +
                    this.randomSigned() *
                    this.width *
                    spread,

                    0,
                    this.width
                );


            point.y =
                this.clamp(

                    Number(y) +
                    this.randomSigned() *
                    this.height *
                    spread,

                    0,
                    this.height
                );
        }


        return triangle;
    }



    /* =====================================================
       REPLACE SHAPE NEAR ERROR POINT

       By default this preserves the existing shape's type.

       Passing a different type remains possible for explicit
       editing, but the GA does not use this to alter counts.
       ===================================================== */

    replaceShapeNear(
        index,
        type = null,
        x,
        y,
        targetColour = null
    ) {

        index =
            Math.floor(
                Number(index)
            );


        if (
            !Number.isFinite(index) ||
            index < 0 ||
            index >=
                this.shapes.length
        ) {

            return null;
        }


        const existingType =
            this.getShapeType(
                this.shapes[index]
            );


        const requestedType =
            type ??
            existingType;


        const shape =
            this.createShapeNear(
                requestedType,
                x,
                y,
                targetColour
            );


        if (!shape) {

            return null;
        }


        this.shapes[index] =
            shape;


        this.invalidateFitness();


        return shape;
    }



    /* =====================================================
       SERIALISE
       ===================================================== */

    toJSON() {

        return {

            version:
                2,

            width:
                this.width,

            height:
                this.height,

            backgroundColour: {

                r:
                    this.backgroundColour.r,

                g:
                    this.backgroundColour.g,

                b:
                    this.backgroundColour.b

            },

            fitness:
                this.fitness,

            similarity:
                this.similarity,

            error:
                this.error,

            fitnessStage:
                this.fitnessStage,

            fitnessWidth:
                this.fitnessWidth,

            fitnessHeight:
                this.fitnessHeight,

            shapeCounts:
                this.getShapeCounts(),

            shapes:
                this.shapes.map(
                    shape => {

                        if (
                            typeof shape.toJSON ===
                            "function"
                        ) {

                            return shape.toJSON();
                        }


                        return this.serialiseGenericShape(
                            shape
                        );
                    }
                )

        };
    }



    /* =====================================================
       SERIALISE GENERIC SHAPE
       ===================================================== */

    serialiseGenericShape(shape) {

        const result = {};


        for (
            const key of
            Object.keys(shape)
        ) {

            const value =
                shape[key];


            if (
                typeof value !==
                "function"
            ) {

                result[key] =
                    this.deepCloneValue(
                        value
                    );
            }
        }


        if (!result.type) {

            result.type =
                this.getShapeType(
                    shape
                );
        }


        return result;
    }



    /* =====================================================
       RESTORE GENOME FROM JSON
       ===================================================== */

    static fromJSON(data) {

        if (!data) {

            throw new Error(
                "Cannot create Genome from empty data."
            );
        }


        /*
         * ExportManager may pass either the raw Genome JSON
         * or a wrapper containing a genome property.
         */

        if (
            data.genome &&
            typeof data.genome ===
            "object"
        ) {

            data =
                data.genome;
        }


        const width =
            Math.max(
                1,
                Math.floor(
                    Number(data.width) ||
                    480
                )
            );


        const height =
            Math.max(
                1,
                Math.floor(
                    Number(data.height) ||
                    715
                )
            );


        const genome =
            new Genome(
                0,
                0,
                0,
                width,
                height
            );


        if (
            data.backgroundColour
        ) {

            genome.setBackgroundColour(
                data.backgroundColour
            );

        } else if (
            data.background
        ) {

            genome.setBackgroundColour(
                data.background
            );
        }


        genome.shapes = [];


        const shapes =
            Array.isArray(
                data.shapes
            )
                ? data.shapes
                : [];


        for (
            const shapeData of
            shapes
        ) {

            const shape =
                Genome.shapeFromJSON(
                    shapeData,
                    width,
                    height
                );


            if (shape) {

                genome.shapes.push(
                    shape
                );
            }
        }


        genome.fitness =
            Number.isFinite(
                Number(data.fitness)
            )
                ? Number(data.fitness)
                : undefined;


        genome.similarity =
            Number.isFinite(
                Number(data.similarity)
            )
                ? Number(data.similarity)
                : undefined;


        genome.error =
            Number.isFinite(
                Number(data.error)
            )
                ? Number(data.error)
                : undefined;


        genome.fitnessStage =
            Number.isFinite(
                Number(data.fitnessStage)
            )
                ? Number(
                    data.fitnessStage
                )
                : undefined;


        genome.fitnessWidth =
            Number.isFinite(
                Number(data.fitnessWidth)
            )
                ? Number(
                    data.fitnessWidth
                )
                : undefined;


        genome.fitnessHeight =
            Number.isFinite(
                Number(data.fitnessHeight)
            )
                ? Number(
                    data.fitnessHeight
                )
                : undefined;


        return genome;
    }



    /* =====================================================
       RESTORE ONE SHAPE
       ===================================================== */

    static shapeFromJSON(
        data,
        width,
        height
    ) {

        if (!data) {

            return null;
        }


        const type =
            String(
                data.type ??
                ""
            ).toLowerCase();


        switch (type) {

            case "circle":

                if (
                    typeof CircleGene ===
                    "undefined"
                ) {

                    throw new Error(
                        "CircleGene.js must be loaded before importing circle genes."
                    );
                }


                if (
                    typeof CircleGene.fromJSON ===
                    "function"
                ) {

                    return CircleGene.fromJSON(
                        data,
                        width,
                        height
                    );
                }


                return Genome.genericGeneFromJSON(
                    CircleGene,
                    data,
                    width,
                    height,
                    "circle"
                );


            case "dot":

                if (
                    typeof DotGene ===
                    "undefined"
                ) {

                    throw new Error(
                        "DotGene.js must be loaded before importing dot genes."
                    );
                }


                if (
                    typeof DotGene.fromJSON ===
                    "function"
                ) {

                    return DotGene.fromJSON(
                        data,
                        width,
                        height
                    );
                }


                return Genome.genericGeneFromJSON(
                    DotGene,
                    data,
                    width,
                    height,
                    "dot"
                );


            case "triangle":

                return Genome.triangleFromJSON(
                    data,
                    width,
                    height
                );


            default:

                return null;
        }
    }



    /* =====================================================
       GENERIC GENE RESTORE
       ===================================================== */

    static genericGeneFromJSON(
        GeneClass,
        data,
        width,
        height,
        type
    ) {

        let gene;


        try {

            gene =
                new GeneClass(
                    width,
                    height
                );

        } catch (error) {

            gene =
                new GeneClass({

                    width:
                        width,

                    height:
                        height

                });
        }


        for (
            const key of
            Object.keys(data)
        ) {

            if (
                key === "type"
            ) {

                continue;
            }


            gene[key] =
                Genome.cloneJSONValue(
                    data[key]
                );
        }


        gene.type =
            type;


        return gene;
    }



    /* =====================================================
       RESTORE TRIANGLE
       ===================================================== */

    static triangleFromJSON(
        data,
        width,
        height
    ) {

        if (
            typeof TriangleGene ===
            "undefined"
        ) {

            throw new Error(
                "TriangleGene.js must be loaded before importing triangle genes."
            );
        }


        if (
            typeof TriangleGene.fromJSON ===
            "function"
        ) {

            return TriangleGene.fromJSON(
                data,
                width,
                height
            );
        }


        return Genome.genericGeneFromJSON(
            TriangleGene,
            data,
            width,
            height,
            "triangle"
        );
    }



    /* =====================================================
       JSON VALUE CLONE
       ===================================================== */

    static cloneJSONValue(value) {

        if (
            value === null ||
            typeof value !==
                "object"
        ) {

            return value;
        }


        if (
            Array.isArray(value)
        ) {

            return value.map(
                item =>
                    Genome.cloneJSONValue(
                        item
                    )
            );
        }


        const result = {};


        for (
            const key of
            Object.keys(value)
        ) {

            result[key] =
                Genome.cloneJSONValue(
                    value[key]
                );
        }


        return result;
    }



    /* =====================================================
       INVALIDATE FITNESS

       Also invalidate progressive-resolution metadata.
       ===================================================== */

    invalidateFitness() {

        this.fitness =
            undefined;


        this.similarity =
            undefined;


        this.error =
            undefined;


        this.fitnessStage =
            undefined;


        this.fitnessWidth =
            undefined;


        this.fitnessHeight =
            undefined;


        return this;
    }



    /* =====================================================
       HAS FITNESS
       ===================================================== */

    hasFitness() {

        return Number.isFinite(
            Number(
                this.fitness
            )
        );
    }



    /* =====================================================
       SET FITNESS
       ===================================================== */

    setFitness(
        fitness,
        similarity = undefined,
        error = undefined
    ) {

        this.fitness =
            fitness;


        this.similarity =
            similarity;


        this.error =
            error;


        return this;
    }



    /* =====================================================
       GET FITNESS
       ===================================================== */

    getFitness() {

        return this.fitness;
    }



    /* =====================================================
       GET SIMILARITY
       ===================================================== */

    getSimilarity() {

        return this.similarity;
    }



    /* =====================================================
       GET ERROR
       ===================================================== */

    getError() {

        return this.error;
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
       SHUFFLE LAYERS
       ===================================================== */

    shuffleShapes() {

        this.shuffleArray(
            this.shapes
        );


        this.invalidateFitness();


        return this;
    }



    /* =====================================================
       SHUFFLE ARRAY
       ===================================================== */

    shuffleArray(array) {

        for (
            let i =
                array.length - 1;
            i > 0;
            i--
        ) {

            const j =
                Math.floor(
                    Math.random() *
                    (i + 1)
                );


            const temporary =
                array[i];


            array[i] =
                array[j];


            array[j] =
                temporary;
        }


        return array;
    }



    /* =====================================================
       NORMALISE COUNT
       ===================================================== */

    normaliseCount(count) {

        count =
            Number(count);


        if (
            !Number.isFinite(count)
        ) {

            return 0;
        }


        return Math.max(
            0,
            Math.floor(count)
        );
    }



    /* =====================================================
       RANDOM SIGNED VALUE
       ===================================================== */

    randomSigned() {

        return (
            Math.random() *
            2 -
            1
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