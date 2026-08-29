/* =========================================================
   MIDLIFE PROGRAMMER
   Evolve Mona Lisa
   FitnessEvaluator.js

   Compares a rendered candidate image against the target.

   The evaluator calculates pixel error using RGB colour
   differences and converts that error into:

       fitness    = 0.0 -> 1.0
       similarity = 0.0 -> 100.0

   Higher values are better.
   ========================================================= */


class FitnessEvaluator {


    /* =====================================================
       CONSTRUCTOR
       ===================================================== */

    constructor(targetImageData = null) {

        this.targetImageData = null;

        this.targetPixels = null;

        this.width = 0;

        this.height = 0;

        this.pixelCount = 0;


        /*
         * Number of candidate images evaluated.
         */

        this.evaluationCount = 0;


        /*
         * Best values observed.
         */

        this.bestFitness = 0;

        this.bestSimilarity = 0;

        this.bestError = Infinity;


        if (targetImageData) {

            this.setTargetImageData(
                targetImageData
            );
        }
    }



    /* =====================================================
       SET TARGET IMAGE DATA
       ===================================================== */

    setTargetImageData(imageData) {

        if (!imageData) {

            throw new Error(
                "FitnessEvaluator requires target ImageData."
            );
        }


        if (!imageData.data) {

            throw new Error(
                "Target ImageData contains no pixel data."
            );
        }


        this.targetImageData =
            imageData;


        this.targetPixels =
            imageData.data;


        this.width =
            imageData.width;


        this.height =
            imageData.height;


        this.pixelCount =
            this.width *
            this.height;


        this.resetStatistics();
    }



    /* =====================================================
       SET TARGET FROM CANVAS
       ===================================================== */

    setTargetCanvas(canvas) {

        if (!canvas) {

            throw new Error(
                "Target canvas is required."
            );
        }


        const context =
            canvas.getContext(
                "2d",
                {
                    willReadFrequently: true
                }
            );


        const imageData =
            context.getImageData(
                0,
                0,
                canvas.width,
                canvas.height
            );


        this.setTargetImageData(
            imageData
        );
    }



    /* =====================================================
       EVALUATE IMAGE DATA
       ===================================================== */

    evaluate(candidateImageData) {

        if (!this.targetPixels) {

            throw new Error(
                "FitnessEvaluator has no target image."
            );
        }


        if (
            !candidateImageData ||
            !candidateImageData.data
        ) {

            throw new Error(
                "Candidate ImageData is required."
            );
        }


        if (
            candidateImageData.width !==
            this.width ||
            candidateImageData.height !==
            this.height
        ) {

            throw new Error(
                "Candidate dimensions do not match target dimensions."
            );
        }


        const candidatePixels =
            candidateImageData.data;


        const targetPixels =
            this.targetPixels;


        let squaredError = 0;


        /*
         * RGBA pixels contain four values.
         *
         * Alpha is deliberately ignored here because both
         * images are ultimately rendered against an opaque
         * background.
         */

        for (
            let i = 0;
            i < targetPixels.length;
            i += 4
        ) {

            const redDifference =
                targetPixels[i] -
                candidatePixels[i];


            const greenDifference =
                targetPixels[i + 1] -
                candidatePixels[i + 1];


            const blueDifference =
                targetPixels[i + 2] -
                candidatePixels[i + 2];


            squaredError +=
                redDifference *
                redDifference;


            squaredError +=
                greenDifference *
                greenDifference;


            squaredError +=
                blueDifference *
                blueDifference;
        }


        /*
         * Mean squared error across all RGB channels.
         */

        const channelCount =
            this.pixelCount * 3;


        const meanSquaredError =
            squaredError /
            channelCount;


        /*
         * Maximum possible squared error for one channel:
         *
         * 255² = 65025
         *
         * Dividing by this gives a normalised error from
         * approximately 0 to 1.
         */

        const maximumSquaredError =
            255 * 255;


        const normalizedError =
            meanSquaredError /
            maximumSquaredError;


        /*
         * Convert error into fitness.
         *
         * Perfect match:
         *
         * error   = 0
         * fitness = 1
         *
         * Maximum possible error:
         *
         * error   = 1
         * fitness = 0
         */

        const fitness =
            this.clamp(
                1 - normalizedError,
                0,
                1
            );


        const similarity =
            fitness * 100;


        this.evaluationCount++;


        if (
            fitness >
            this.bestFitness
        ) {

            this.bestFitness =
                fitness;


            this.bestSimilarity =
                similarity;


            this.bestError =
                meanSquaredError;
        }


        return {

            fitness:
                fitness,

            similarity:
                similarity,

            error:
                meanSquaredError,

            normalizedError:
                normalizedError,

            evaluation:
                this.evaluationCount

        };
    }



    /* =====================================================
       FAST FITNESS
       ===================================================== */

    evaluateFitness(candidateImageData) {

        return this.evaluate(
            candidateImageData
        ).fitness;
    }



    /* =====================================================
       SIMILARITY
       ===================================================== */

    evaluateSimilarity(candidateImageData) {

        return this.evaluate(
            candidateImageData
        ).similarity;
    }



    /* =====================================================
       RAW ERROR
       ===================================================== */

    evaluateError(candidateImageData) {

        return this.evaluate(
            candidateImageData
        ).error;
    }



    /* =====================================================
       SAMPLE-BASED EVALUATION
       ===================================================== */

    evaluateSampled(
        candidateImageData,
        sampleStep = 2
    ) {

        if (!this.targetPixels) {

            throw new Error(
                "FitnessEvaluator has no target image."
            );
        }


        if (
            !candidateImageData ||
            !candidateImageData.data
        ) {

            throw new Error(
                "Candidate ImageData is required."
            );
        }


        if (
            candidateImageData.width !==
            this.width ||
            candidateImageData.height !==
            this.height
        ) {

            throw new Error(
                "Candidate dimensions do not match target dimensions."
            );
        }


        sampleStep =
            Math.max(
                1,
                Math.floor(
                    sampleStep
                )
            );


        const candidatePixels =
            candidateImageData.data;


        const targetPixels =
            this.targetPixels;


        let squaredError = 0;

        let samples = 0;


        /*
         * Sampling can dramatically increase evolution
         * speed for large populations.
         *
         * sampleStep = 1
         * checks every pixel.
         *
         * sampleStep = 2
         * checks every second pixel horizontally and
         * vertically.
         *
         * sampleStep = 4
         * checks one pixel from each 4x4 region.
         */

        for (
            let y = 0;
            y < this.height;
            y += sampleStep
        ) {

            for (
                let x = 0;
                x < this.width;
                x += sampleStep
            ) {

                const index =
                    (
                        y *
                        this.width +
                        x
                    ) * 4;


                const redDifference =
                    targetPixels[index] -
                    candidatePixels[index];


                const greenDifference =
                    targetPixels[index + 1] -
                    candidatePixels[index + 1];


                const blueDifference =
                    targetPixels[index + 2] -
                    candidatePixels[index + 2];


                squaredError +=
                    redDifference *
                    redDifference;


                squaredError +=
                    greenDifference *
                    greenDifference;


                squaredError +=
                    blueDifference *
                    blueDifference;


                samples++;
            }
        }


        const channelCount =
            samples * 3;


        const meanSquaredError =
            squaredError /
            channelCount;


        const normalizedError =
            meanSquaredError /
            65025;


        const fitness =
            this.clamp(
                1 - normalizedError,
                0,
                1
            );


        const similarity =
            fitness * 100;


        this.evaluationCount++;


        if (
            fitness >
            this.bestFitness
        ) {

            this.bestFitness =
                fitness;


            this.bestSimilarity =
                similarity;


            this.bestError =
                meanSquaredError;
        }


        return {

            fitness:
                fitness,

            similarity:
                similarity,

            error:
                meanSquaredError,

            normalizedError:
                normalizedError,

            evaluation:
                this.evaluationCount,

            samples:
                samples

        };
    }



    /* =====================================================
       EVALUATE CANVAS
       ===================================================== */

    evaluateCanvas(canvas) {

        if (!canvas) {

            throw new Error(
                "Candidate canvas is required."
            );
        }


        const context =
            canvas.getContext(
                "2d",
                {
                    willReadFrequently: true
                }
            );


        const imageData =
            context.getImageData(
                0,
                0,
                canvas.width,
                canvas.height
            );


        return this.evaluate(
            imageData
        );
    }



    /* =====================================================
       EVALUATE GENOME
       ===================================================== */

    evaluateGenome(
        genome,
        renderer,
        sampleStep = 1
    ) {

        if (!genome) {

            throw new Error(
                "Genome is required."
            );
        }


        if (!renderer) {

            throw new Error(
                "EvolutionRenderer is required."
            );
        }


        /*
         * Render the genome to the renderer's hidden
         * off-screen canvas.
         */

        renderer.renderToBuffer(
            genome
        );


        const imageData =
            renderer.getBufferImageData();


        let result;


        if (sampleStep > 1) {

            result =
                this.evaluateSampled(
                    imageData,
                    sampleStep
                );

        } else {

            result =
                this.evaluate(
                    imageData
                );
        }


        /*
         * Store fitness directly on the genome.
         *
         * This makes Population sorting considerably easier.
         */

        genome.fitness =
            result.fitness;


        genome.similarity =
            result.similarity;


        genome.error =
            result.error;


        return result;
    }



    /* =====================================================
       COMPARE TWO GENOMES
       ===================================================== */

    compare(
        genomeA,
        genomeB
    ) {

        const fitnessA =
            genomeA?.fitness ??
            -Infinity;


        const fitnessB =
            genomeB?.fitness ??
            -Infinity;


        if (
            fitnessA >
            fitnessB
        ) {

            return genomeA;
        }


        if (
            fitnessB >
            fitnessA
        ) {

            return genomeB;
        }


        return genomeA;
    }



    /* =====================================================
       IS BETTER
       ===================================================== */

    isBetter(
        candidate,
        currentBest
    ) {

        if (!candidate) {
            return false;
        }


        if (!currentBest) {
            return true;
        }


        return (
            candidate.fitness >
            currentBest.fitness
        );
    }



    /* =====================================================
       TARGET INFORMATION
       ===================================================== */

    hasTarget() {

        return (
            this.targetPixels !== null
        );
    }



    getWidth() {

        return this.width;
    }



    getHeight() {

        return this.height;
    }



    getPixelCount() {

        return this.pixelCount;
    }



    /* =====================================================
       STATISTICS
       ===================================================== */

    getEvaluationCount() {

        return this.evaluationCount;
    }



    getBestFitness() {

        return this.bestFitness;
    }



    getBestSimilarity() {

        return this.bestSimilarity;
    }



    getBestError() {

        return this.bestError;
    }



    resetStatistics() {

        this.evaluationCount =
            0;


        this.bestFitness =
            0;


        this.bestSimilarity =
            0;


        this.bestError =
            Infinity;
    }



    /* =====================================================
       FORMATTERS
       ===================================================== */

    formatSimilarity(
        similarity,
        decimalPlaces = 2
    ) {

        if (
            !Number.isFinite(
                similarity
            )
        ) {

            return "0.00%";
        }


        return (
            similarity.toFixed(
                decimalPlaces
            ) +
            "%"
        );
    }



    formatFitness(
        fitness,
        decimalPlaces = 6
    ) {

        if (
            !Number.isFinite(
                fitness
            )
        ) {

            return "0";
        }


        return fitness.toFixed(
            decimalPlaces
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

        return Math.max(
            minimum,
            Math.min(
                maximum,
                value
            )
        );
    }

}