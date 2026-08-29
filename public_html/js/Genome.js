/* =========================================================
   MIDLIFE PROGRAMMER
   Evolve Mona Lisa
   Genome.js

   Represents one candidate solution.

   A genome consists of:

   - A collection of TriangleGene objects
   - A background colour
   - Fitness / similarity information

   The genetic algorithm clones and mutates genomes while
   the fitness evaluator determines how closely each genome
   resembles the target image.
   ========================================================= */


class Genome {


    /* =====================================================
       CONSTRUCTOR
       ===================================================== */

    constructor(
        triangleCount = 100,
        width = 480,
        height = 715
    ) {

        /*
         * Also support:
         *
         * new Genome({
         *     triangleCount: 100,
         *     width: 480,
         *     height: 715
         * });
         */

        if (
            typeof triangleCount ===
            "object"
        ) {

            const options =
                triangleCount;


            triangleCount =
                options.triangleCount ??
                100;


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
                Math.floor(width)
            );


        this.height =
            Math.max(
                1,
                Math.floor(height)
            );


        this.triangles = [];


        /*
         * Start with a neutral dark background.
         *
         * app.js / TargetImage can replace this with the
         * average target colour before evolution begins.
         */

        this.backgroundColour = {

            r: 32,

            g: 32,

            b: 32

        };


        /*
         * Evaluation data.
         */

        this.fitness =
            undefined;


        this.similarity =
            undefined;


        this.error =
            undefined;


        /*
         * Create initial random triangle genes.
         */

        this.createRandomTriangles(
            triangleCount
        );
    }



    /* =====================================================
       CREATE RANDOM TRIANGLES
       ===================================================== */

    createRandomTriangles(count) {

        count =
            Math.max(
                0,
                Math.floor(count)
            );


        for (
            let i = 0;
            i < count;
            i++
        ) {

            this.triangles.push(
                this.createRandomTriangle()
            );
        }
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


        /*
         * Our preferred TriangleGene constructor will be:
         *
         * new TriangleGene(width, height)
         */

        try {

            return new TriangleGene(
                this.width,
                this.height
            );

        } catch (error) {

            /*
             * Support an options-object implementation too.
             */

            return new TriangleGene({

                width:
                    this.width,

                height:
                    this.height

            });
        }
    }



    /* =====================================================
       GET TRIANGLES
       ===================================================== */

    getTriangles() {

        return this.triangles;
    }



    /* =====================================================
       GET GENES
       ===================================================== */

    getGenes() {

        return this.triangles;
    }



    /* =====================================================
       TRIANGLE COUNT
       ===================================================== */

    getTriangleCount() {

        return this.triangles.length;
    }



    /* =====================================================
       ADD RANDOM TRIANGLE
       ===================================================== */

    addTriangle() {

        const triangle =
            this.createRandomTriangle();


        this.triangles.push(
            triangle
        );


        this.invalidateFitness();


        return triangle;
    }



    /* =====================================================
       ADD EXISTING TRIANGLE
       ===================================================== */

    addExistingTriangle(
        triangle
    ) {

        if (!triangle) {
            return null;
        }


        this.triangles.push(
            triangle
        );


        this.invalidateFitness();


        return triangle;
    }



    /* =====================================================
       REMOVE TRIANGLE
       ===================================================== */

    removeTriangle(index = null) {

        if (
            this.triangles.length ===
            0
        ) {

            return null;
        }


        if (
            index === null ||
            index === undefined
        ) {

            index =
                Math.floor(
                    Math.random() *
                    this.triangles.length
                );
        }


        index =
            Math.floor(index);


        if (
            index < 0 ||
            index >=
            this.triangles.length
        ) {

            return null;
        }


        const removed =
            this.triangles.splice(
                index,
                1
            )[0];


        this.invalidateFitness();


        return removed;
    }



    /* =====================================================
       REPLACE TRIANGLE
       ===================================================== */

    replaceTriangle(
        index,
        triangle
    ) {

        if (!triangle) {
            return false;
        }


        if (
            index < 0 ||
            index >=
            this.triangles.length
        ) {

            return false;
        }


        this.triangles[index] =
            triangle;


        this.invalidateFitness();


        return true;
    }



    /* =====================================================
       RANDOM TRIANGLE
       ===================================================== */

    getRandomTriangle() {

        if (
            this.triangles.length ===
            0
        ) {

            return null;
        }


        const index =
            Math.floor(
                Math.random() *
                this.triangles.length
            );


        return this.triangles[index];
    }



    /* =====================================================
       RANDOM TRIANGLE INDEX
       ===================================================== */

    getRandomTriangleIndex() {

        if (
            this.triangles.length ===
            0
        ) {

            return -1;
        }


        return Math.floor(
            Math.random() *
            this.triangles.length
        );
    }



    /* =====================================================
       MUTATE
       ===================================================== */

    mutate(
        mutationCount = 1,
        strength = 0.15
    ) {

        mutationCount =
            Math.max(
                1,
                Math.floor(
                    mutationCount
                )
            );


        strength =
            this.clamp(
                strength,
                0.001,
                1
            );


        for (
            let i = 0;
            i < mutationCount;
            i++
        ) {

            this.performMutation(
                strength
            );
        }


        this.invalidateFitness();


        return this;
    }



    /* =====================================================
       PERFORM ONE MUTATION
       ===================================================== */

    performMutation(strength) {

        /*
         * Most mutations alter an existing triangle.
         *
         * Occasionally we can make a structural mutation
         * by adding/removing/replacing a triangle.
         */

        const roll =
            Math.random();


        /*
         * 90%:
         *
         * Mutate an existing TriangleGene.
         */

        if (
            roll < 0.90
        ) {

            this.mutateRandomTriangle(
                strength
            );

            return;
        }


        /*
         * 4%:
         *
         * Replace a triangle completely.
         */

        if (
            roll < 0.94
        ) {

            this.replaceRandomTriangle();

            return;
        }


        /*
         * 3%:
         *
         * Add a triangle.
         */

        if (
            roll < 0.97
        ) {

            this.addTriangle();

            return;
        }


        /*
         * 3%:
         *
         * Remove a triangle.
         *
         * Always retain at least one triangle.
         */

        if (
            this.triangles.length >
            1
        ) {

            this.removeTriangle();

        } else {

            this.mutateRandomTriangle(
                strength
            );
        }
    }



    /* =====================================================
       MUTATE RANDOM TRIANGLE
       ===================================================== */

    mutateRandomTriangle(strength) {

        const triangle =
            this.getRandomTriangle();


        if (!triangle) {

            this.addTriangle();

            return;
        }


        if (
            typeof triangle.mutate ===
            "function"
        ) {

            triangle.mutate(
                strength
            );

            return;
        }


        /*
         * TriangleGene should normally provide mutate().
         * This fallback makes the Genome a little more
         * tolerant while classes are being developed.
         */

        this.basicTriangleMutation(
            triangle,
            strength
        );
    }



    /* =====================================================
       BASIC TRIANGLE MUTATION FALLBACK
       ===================================================== */

    basicTriangleMutation(
        triangle,
        strength
    ) {

        if (!triangle) {
            return;
        }


        const points =
            triangle.points ??
            triangle.vertices;


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
                    point.x
                )
            ) {

                point.x +=
                    (
                        Math.random() * 2 -
                        1
                    ) *
                    this.width *
                    strength;


                point.x =
                    this.clamp(
                        point.x,
                        0,
                        this.width
                    );
            }


            if (
                Number.isFinite(
                    point.y
                )
            ) {

                point.y +=
                    (
                        Math.random() * 2 -
                        1
                    ) *
                    this.height *
                    strength;


                point.y =
                    this.clamp(
                        point.y,
                        0,
                        this.height
                    );
            }
        }
    }



    /* =====================================================
       REPLACE RANDOM TRIANGLE
       ===================================================== */

    replaceRandomTriangle() {

        if (
            this.triangles.length ===
            0
        ) {

            this.addTriangle();

            return;
        }


        const index =
            this.getRandomTriangleIndex();


        this.triangles[index] =
            this.createRandomTriangle();


        this.invalidateFitness();
    }



    /* =====================================================
       MUTATE BACKGROUND
       ===================================================== */

    mutateBackground(
        strength = 0.1
    ) {

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
            (
                Math.random() * 2 -
                1
            ) *
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
    }



    /* =====================================================
       SET BACKGROUND
       ===================================================== */

    setBackgroundColour(
        r,
        g,
        b
    ) {

        /*
         * Allow:
         *
         * setBackgroundColour({ r, g, b })
         */

        if (
            typeof r ===
            "object"
        ) {

            const colour =
                r;


            r =
                colour.r ?? 0;

            g =
                colour.g ?? 0;

            b =
                colour.b ?? 0;
        }


        this.backgroundColour = {

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
                )

        };


        this.invalidateFitness();
    }



    /* =====================================================
       GET BACKGROUND
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

        /*
         * Create object without running constructor.
         *
         * Calling the constructor here would generate a
         * completely new random set of triangles first,
         * which is unnecessary.
         */

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
         * Deep-copy every TriangleGene.
         *
         * This is critical.
         *
         * If child genomes shared TriangleGene references
         * with their parents, mutating a child would also
         * mutate its parent.
         */

        clone.triangles =
            this.triangles.map(
                triangle =>
                    this.cloneTriangle(
                        triangle
                    )
            );


        clone.fitness =
            this.fitness;


        clone.similarity =
            this.similarity;


        clone.error =
            this.error;


        return clone;
    }



    /* =====================================================
       COPY ALIAS
       ===================================================== */

    copy() {

        return this.clone();
    }



    /* =====================================================
       CLONE TRIANGLE
       ===================================================== */

    cloneTriangle(triangle) {

        if (!triangle) {
            return triangle;
        }


        if (
            typeof triangle.clone ===
            "function"
        ) {

            return triangle.clone();
        }


        if (
            typeof triangle.copy ===
            "function"
        ) {

            return triangle.copy();
        }


        /*
         * Generic fallback preserving prototype.
         */

        const clone =
            Object.create(
                Object.getPrototypeOf(
                    triangle
                )
            );


        for (
            const key of
            Object.keys(triangle)
        ) {

            clone[key] =
                this.deepCloneValue(
                    triangle[key]
                );
        }


        return clone;
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
       INVALIDATE FITNESS
       ===================================================== */

    invalidateFitness() {

        this.fitness =
            undefined;


        this.similarity =
            undefined;


        this.error =
            undefined;
    }



    /* =====================================================
       HAS FITNESS
       ===================================================== */

    hasFitness() {

        return Number.isFinite(
            this.fitness
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
       SET DIMENSIONS
       ===================================================== */

    setDimensions(
        width,
        height
    ) {

        this.width =
            Math.max(
                1,
                Math.floor(width)
            );


        this.height =
            Math.max(
                1,
                Math.floor(height)
            );


        this.invalidateFitness();
    }



    /* =====================================================
       RANDOMISE
       ===================================================== */

    randomise(
        triangleCount =
            this.triangles.length
    ) {

        this.triangles = [];


        this.createRandomTriangles(
            triangleCount
        );


        this.invalidateFitness();


        return this;
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