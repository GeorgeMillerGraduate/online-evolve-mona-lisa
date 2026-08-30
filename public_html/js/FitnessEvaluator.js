/* =========================================================
   MIDLIFE PROGRAMMER
   Evolve Mona Lisa
   FitnessEvaluator.js

   Evaluates how closely a rendered Genome matches the
   target image.

   Features:

   - RGB mean squared error fitness
   - Similarity percentage
   - Progressive fitness resolution
   - Cached target resolution stages
   - Full-resolution candidate downsampling
   - Stage-aware genome fitness
   - Error-map generation
   - Weighted high-error pixel selection
   - Target-colour lookup
   - Sampled evaluation compatibility
   - Evaluation statistics

   Default progressive stages for a 480 x 715 target:

       60  x 89
       120 x 179
       240 x 358
       480 x 715
   ========================================================= */


class FitnessEvaluator {


    /* =====================================================
       CONSTRUCTOR
       ===================================================== */

    constructor(
        targetImageData = null,
        options = {}
    ) {

        /*
         * Also support:
         *
         * new FitnessEvaluator({
         *     targetImageData: imageData,
         *     progressive: true
         * });
         */

        if (
            targetImageData &&
            !targetImageData.data &&
            typeof targetImageData ===
            "object"
        ) {

            options =
                targetImageData;


            targetImageData =
                options.targetImageData ??
                null;
        }


        options =
            options ??
            {};


        /* =================================================
           FULL TARGET
           ================================================= */

        this.targetImageData =
            null;


        this.targetPixels =
            null;


        this.width =
            0;


        this.height =
            0;


        this.pixelCount =
            0;



        /* =================================================
           PROGRESSIVE RESOLUTION
           ================================================= */

        this.progressiveEnabled =
            options.progressive ??
            options.progressiveEnabled ??
            true;


        /*
         * Widths are converted to heights using the target
         * image's actual aspect ratio.
         */

        this.progressiveWidths =
            Array.isArray(
                options.progressiveWidths
            )
                ? options.progressiveWidths
                    .slice()
                : [
                    60,
                    120,
                    240,
                    480
                ];


        this.targetStages =
            [];


        this.currentStageIndex =
            0;



        /* =================================================
           CANDIDATE DOWNSAMPLING
           ================================================= */

        this.candidateCanvas =
            document.createElement(
                "canvas"
            );


        this.candidateContext =
            this.candidateCanvas.getContext(
                "2d",
                {
                    willReadFrequently:
                        true
                }
            );


        if (!this.candidateContext) {

            throw new Error(
                "FitnessEvaluator could not create candidate canvas."
            );
        }



        /* =================================================
           TARGET STAGE CANVAS
           ================================================= */

        this.targetStageCanvas =
            document.createElement(
                "canvas"
            );


        this.targetStageContext =
            this.targetStageCanvas.getContext(
                "2d",
                {
                    willReadFrequently:
                        true
                }
            );


        if (!this.targetStageContext) {

            throw new Error(
                "FitnessEvaluator could not create target canvas."
            );
        }



        /* =================================================
           ERROR MAP
           ================================================= */

        this.errorMap =
            null;


        this.errorMapWidth =
            0;


        this.errorMapHeight =
            0;


        this.errorMapTotal =
            0;



        /* =================================================
           STATISTICS
           ================================================= */

        this.evaluationCount =
            0;


        this.bestFitness =
            0;


        this.bestSimilarity =
            0;


        this.bestError =
            Infinity;



        /* =================================================
           INITIAL TARGET
           ================================================= */

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

        if (
            !imageData ||
            !imageData.data
        ) {

            throw new Error(
                "FitnessEvaluator requires target ImageData."
            );
        }


        if (
            !Number.isFinite(
                Number(
                    imageData.width
                )
            ) ||
            !Number.isFinite(
                Number(
                    imageData.height
                )
            )
        ) {

            throw new Error(
                "Target ImageData has invalid dimensions."
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


        /*
         * Build every progressive target once.
         */

        this.buildTargetStages();


        /*
         * New target always begins at the first stage when
         * progressive evaluation is enabled.
         */

        this.currentStageIndex =
            this.progressiveEnabled
                ? 0
                : Math.max(
                    0,
                    this.targetStages.length -
                    1
                );


        this.clearErrorMap();


        this.resetStatistics();


        return this;
    }



    /* =====================================================
       SET TARGET CANVAS
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
                    willReadFrequently:
                        true
                }
            );


        if (!context) {

            throw new Error(
                "Unable to read target canvas."
            );
        }


        const imageData =
            context.getImageData(
                0,
                0,
                canvas.width,
                canvas.height
            );


        return this.setTargetImageData(
            imageData
        );
    }



    /* =====================================================
       BUILD TARGET STAGES
       ===================================================== */

    buildTargetStages() {

        this.targetStages =
            [];


        if (
            !this.targetImageData
        ) {

            return this.targetStages;
        }


        /*
         * First create a canvas containing the full target.
         */

        const sourceCanvas =
            document.createElement(
                "canvas"
            );


        sourceCanvas.width =
            this.width;


        sourceCanvas.height =
            this.height;


        const sourceContext =
            sourceCanvas.getContext(
                "2d"
            );


        if (!sourceContext) {

            throw new Error(
                "Unable to create target source canvas."
            );
        }


        sourceContext.putImageData(
            this.targetImageData,
            0,
            0
        );


        /*
         * Normalise requested widths.
         */

        let widths =
            this.progressiveWidths
                .map(
                    value =>
                        Math.floor(
                            Number(value)
                        )
                )
                .filter(
                    value =>
                        Number.isFinite(value) &&
                        value > 0
                );


        /*
         * Never create a progressive stage wider than the
         * actual target.
         */

        widths =
            widths.map(
                value =>
                    Math.min(
                        value,
                        this.width
                    )
            );


        /*
         * Full resolution must always be the final stage.
         */

        widths.push(
            this.width
        );


        /*
         * Remove duplicates and sort ascending.
         */

        widths =
            [
                ...new Set(
                    widths
                )
            ].sort(
                (
                    a,
                    b
                ) =>
                    a - b
            );


        for (
            const stageWidth of
            widths
        ) {

            const stageHeight =
                stageWidth ===
                    this.width
                    ? this.height
                    : Math.max(
                        1,
                        Math.round(
                            this.height *
                            (
                                stageWidth /
                                this.width
                            )
                        )
                    );


            const stageCanvas =
                document.createElement(
                    "canvas"
                );


            stageCanvas.width =
                stageWidth;


            stageCanvas.height =
                stageHeight;


            const stageContext =
                stageCanvas.getContext(
                    "2d",
                    {
                        willReadFrequently:
                            true
                    }
                );


            if (!stageContext) {

                throw new Error(
                    "Unable to create progressive target stage."
                );
            }


            /*
             * Smooth downsampling gives a sensible low
             * resolution representation of the target.
             */

            stageContext.imageSmoothingEnabled =
                true;


            stageContext.clearRect(
                0,
                0,
                stageWidth,
                stageHeight
            );


            stageContext.drawImage(
                sourceCanvas,
                0,
                0,
                this.width,
                this.height,
                0,
                0,
                stageWidth,
                stageHeight
            );


            const imageData =
                stageContext.getImageData(
                    0,
                    0,
                    stageWidth,
                    stageHeight
                );


            this.targetStages.push({

                index:
                    this.targetStages.length,

                width:
                    stageWidth,

                height:
                    stageHeight,

                pixelCount:
                    stageWidth *
                    stageHeight,

                imageData:
                    imageData,

                pixels:
                    imageData.data

            });
        }


        return this.targetStages;
    }



    /* =====================================================
       PROGRESSIVE ENABLED
       ===================================================== */

    setProgressiveEnabled(enabled) {

        const newValue =
            Boolean(
                enabled
            );


        if (
            newValue ===
            this.progressiveEnabled
        ) {

            return this;
        }


        this.progressiveEnabled =
            newValue;


        if (
            this.targetStages.length >
            0
        ) {

            this.currentStageIndex =
                newValue
                    ? 0
                    : this.targetStages.length -
                    1;
        }


        this.clearErrorMap();


        this.resetBestStatistics();


        return this;
    }



    isProgressiveEnabled() {

        return this.progressiveEnabled;
    }



    /* =====================================================
       CURRENT TARGET STAGE
       ===================================================== */

    getCurrentTargetStage() {

        if (
            this.targetStages.length ===
            0
        ) {

            return null;
        }


        if (
            !this.progressiveEnabled
        ) {

            return this.targetStages[
                this.targetStages.length -
                1
            ];
        }


        return this.targetStages[
            this.currentStageIndex
        ] ??
        this.targetStages[
            this.targetStages.length -
            1
        ];
    }



    /* =====================================================
       CURRENT RESOLUTION
       ===================================================== */

    getCurrentResolution() {

        const stage =
            this.getCurrentTargetStage();


        if (!stage) {

            return {

                width:
                    this.width,

                height:
                    this.height

            };
        }


        return {

            width:
                stage.width,

            height:
                stage.height

        };
    }



    /* =====================================================
       RESOLUTION LABEL
       ===================================================== */

    getResolutionLabel() {

        const resolution =
            this.getCurrentResolution();


        return (
            resolution.width +
            "×" +
            resolution.height
        );
    }



    /* =====================================================
       STAGE INFORMATION
       ===================================================== */

    getStageIndex() {

        if (
            !this.progressiveEnabled
        ) {

            return Math.max(
                0,
                this.targetStages.length -
                1
            );
        }


        return this.currentStageIndex;
    }



    getStageNumber() {

        return (
            this.getStageIndex() +
            1
        );
    }



    getStageCount() {

        return this.targetStages.length;
    }



    isFinalStage() {

        if (
            this.targetStages.length ===
            0
        ) {

            return true;
        }


        return (
            this.getStageIndex() >=
            this.targetStages.length - 1
        );
    }



    /* =====================================================
       ADVANCE STAGE
       ===================================================== */

    advanceStage() {

        if (
            !this.progressiveEnabled ||
            this.targetStages.length ===
                0 ||
            this.isFinalStage()
        ) {

            return false;
        }


        this.currentStageIndex++;


        this.clearErrorMap();


        this.resetBestStatistics();


        return true;
    }



    /* =====================================================
       PREVIOUS STAGE
       ===================================================== */

    previousStage() {

        if (
            !this.progressiveEnabled ||
            this.currentStageIndex <=
                0
        ) {

            return false;
        }


        this.currentStageIndex--;


        this.clearErrorMap();


        this.resetBestStatistics();


        return true;
    }



    /* =====================================================
       SET STAGE
       ===================================================== */

    setStage(index) {

        if (
            this.targetStages.length ===
            0
        ) {

            return false;
        }


        index =
            Math.floor(
                Number(index)
            );


        if (
            !Number.isFinite(index)
        ) {

            return false;
        }


        index =
            this.clamp(
                index,
                0,
                this.targetStages.length -
                    1
            );


        if (
            index ===
            this.currentStageIndex
        ) {

            return false;
        }


        this.currentStageIndex =
            index;


        this.clearErrorMap();


        this.resetBestStatistics();


        return true;
    }



    /* =====================================================
       SET FINAL STAGE
       ===================================================== */

    setFinalStage() {

        if (
            this.targetStages.length ===
            0
        ) {

            return false;
        }


        return this.setStage(
            this.targetStages.length -
            1
        );
    }



    /* =====================================================
       PREPARE CANDIDATE IMAGE DATA

       The renderer produces the canonical full-resolution
       image.

       Fitness evaluation downsamples that render to the
       currently active target stage.
       ===================================================== */

    prepareCandidateImageData(
        candidate
    ) {

        const stage =
            this.getCurrentTargetStage();


        if (!stage) {

            throw new Error(
                "FitnessEvaluator has no target stage."
            );
        }


        /*
         * Candidate may be:
         *
         * - HTMLCanvasElement
         * - OffscreenCanvas
         * - ImageData
         */

        if (
            candidate &&
            candidate.data &&
            Number.isFinite(
                candidate.width
            ) &&
            Number.isFinite(
                candidate.height
            )
        ) {

            if (
                candidate.width ===
                    stage.width &&
                candidate.height ===
                    stage.height
            ) {

                return candidate;
            }


            return this.resizeImageData(
                candidate,
                stage.width,
                stage.height
            );
        }


        if (
            candidate &&
            Number.isFinite(
                candidate.width
            ) &&
            Number.isFinite(
                candidate.height
            )
        ) {

            return this.resizeCanvas(
                candidate,
                stage.width,
                stage.height
            );
        }


        throw new Error(
            "Candidate must be a Canvas or ImageData."
        );
    }



    /* =====================================================
       RESIZE CANVAS
       ===================================================== */

    resizeCanvas(
        sourceCanvas,
        width,
        height
    ) {

        this.ensureCandidateCanvasSize(
            width,
            height
        );


        this.candidateContext
            .setTransform(
                1,
                0,
                0,
                1,
                0,
                0
            );


        this.candidateContext
            .clearRect(
                0,
                0,
                width,
                height
            );


        this.candidateContext
            .imageSmoothingEnabled =
            true;


        this.candidateContext
            .drawImage(
                sourceCanvas,
                0,
                0,
                sourceCanvas.width,
                sourceCanvas.height,
                0,
                0,
                width,
                height
            );


        return this.candidateContext
            .getImageData(
                0,
                0,
                width,
                height
            );
    }



    /* =====================================================
       RESIZE IMAGE DATA
       ===================================================== */

    resizeImageData(
        imageData,
        width,
        height
    ) {

        const sourceCanvas =
            document.createElement(
                "canvas"
            );


        sourceCanvas.width =
            imageData.width;


        sourceCanvas.height =
            imageData.height;


        const sourceContext =
            sourceCanvas.getContext(
                "2d"
            );


        if (!sourceContext) {

            throw new Error(
                "Unable to resize candidate ImageData."
            );
        }


        sourceContext.putImageData(
            imageData,
            0,
            0
        );


        return this.resizeCanvas(
            sourceCanvas,
            width,
            height
        );
    }



    /* =====================================================
       ENSURE CANDIDATE CANVAS SIZE
       ===================================================== */

    ensureCandidateCanvasSize(
        width,
        height
    ) {

        if (
            this.candidateCanvas.width !==
                width
        ) {

            this.candidateCanvas.width =
                width;
        }


        if (
            this.candidateCanvas.height !==
                height
        ) {

            this.candidateCanvas.height =
                height;
        }
    }



    /* =====================================================
       EVALUATE

       Evaluates ImageData against the CURRENT target stage.
       ===================================================== */

    evaluate(
        candidateImageData,
        createErrorMap = false
    ) {

        if (!this.hasTarget()) {

            throw new Error(
                "FitnessEvaluator has no target image."
            );
        }


        const stage =
            this.getCurrentTargetStage();


        const candidate =
            this.prepareCandidateImageData(
                candidateImageData
            );


        return this.evaluatePrepared(
            candidate,
            stage,
            1,
            createErrorMap
        );
    }



    /* =====================================================
       EVALUATE FITNESS
       ===================================================== */

    evaluateFitness(
        candidateImageData
    ) {

        return this.evaluate(
            candidateImageData
        ).fitness;
    }



    /* =====================================================
       EVALUATE SIMILARITY
       ===================================================== */

    evaluateSimilarity(
        candidateImageData
    ) {

        return this.evaluate(
            candidateImageData
        ).similarity;
    }



    /* =====================================================
       EVALUATE ERROR
       ===================================================== */

    evaluateError(
        candidateImageData
    ) {

        return this.evaluate(
            candidateImageData
        ).error;
    }



    /* =====================================================
       SAMPLED EVALUATION
       ===================================================== */

    evaluateSampled(
        candidateImageData,
        sampleStep = 2,
        createErrorMap = false
    ) {

        if (!this.hasTarget()) {

            throw new Error(
                "FitnessEvaluator has no target image."
            );
        }


        sampleStep =
            Math.max(
                1,
                Math.floor(
                    Number(sampleStep) ||
                    1
                )
            );


        const stage =
            this.getCurrentTargetStage();


        const candidate =
            this.prepareCandidateImageData(
                candidateImageData
            );


        return this.evaluatePrepared(
            candidate,
            stage,
            sampleStep,
            createErrorMap
        );
    }



    /* =====================================================
       EVALUATE PREPARED IMAGE

       Both candidate and target are already at the current
       stage resolution.
       ===================================================== */

    evaluatePrepared(
        candidateImageData,
        stage,
        sampleStep = 1,
        createErrorMap = false
    ) {

        if (
            !candidateImageData ||
            !candidateImageData.data
        ) {

            throw new Error(
                "Candidate ImageData is required."
            );
        }


        if (!stage) {

            throw new Error(
                "Target stage is required."
            );
        }


        if (
            candidateImageData.width !==
                stage.width ||
            candidateImageData.height !==
                stage.height
        ) {

            throw new Error(
                "Prepared candidate dimensions do not match target stage."
            );
        }


        const candidatePixels =
            candidateImageData.data;


        const targetPixels =
            stage.pixels;


        const width =
            stage.width;


        const height =
            stage.height;


        let squaredError =
            0;


        let samples =
            0;


        let errorMap =
            null;


        let errorMapTotal =
            0;


        if (createErrorMap) {

            errorMap =
                new Float32Array(
                    width *
                    height
                );
        }


        for (
            let y = 0;
            y < height;
            y += sampleStep
        ) {

            for (
                let x = 0;
                x < width;
                x += sampleStep
            ) {

                const pixelIndex =
                    y *
                    width +
                    x;


                const index =
                    pixelIndex *
                    4;


                const redDifference =
                    targetPixels[index] -
                    candidatePixels[index];


                const greenDifference =
                    targetPixels[index + 1] -
                    candidatePixels[index + 1];


                const blueDifference =
                    targetPixels[index + 2] -
                    candidatePixels[index + 2];


                const pixelSquaredError =
                    redDifference *
                    redDifference +
                    greenDifference *
                    greenDifference +
                    blueDifference *
                    blueDifference;


                squaredError +=
                    pixelSquaredError;


                samples++;


                if (errorMap) {

                    /*
                     * RMS RGB error gives each pixel a useful
                     * scalar error magnitude.
                     */

                    const pixelError =
                        Math.sqrt(
                            pixelSquaredError /
                            3
                        );


                    errorMap[pixelIndex] =
                        pixelError;


                    errorMapTotal +=
                        pixelError;
                }
            }
        }


        const channelCount =
            Math.max(
                1,
                samples *
                3
            );


        const meanSquaredError =
            squaredError /
            channelCount;


        const normalizedError =
            meanSquaredError /
            65025;


        const fitness =
            this.clamp(
                1 -
                normalizedError,
                0,
                1
            );


        const similarity =
            fitness *
            100;


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


        if (errorMap) {

            this.errorMap =
                errorMap;


            this.errorMapWidth =
                width;


            this.errorMapHeight =
                height;


            this.errorMapTotal =
                errorMapTotal;
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
                samples,

            width:
                width,

            height:
                height,

            stageIndex:
                this.getStageIndex(),

            stageNumber:
                this.getStageNumber(),

            stageCount:
                this.getStageCount(),

            resolution:
                this.getResolutionLabel(),

            errorMap:
                errorMap

        };
    }



    /* =====================================================
       EVALUATE CANVAS
       ===================================================== */

    evaluateCanvas(
        canvas,
        sampleStep = 1,
        createErrorMap = false
    ) {

        if (!canvas) {

            throw new Error(
                "Candidate canvas is required."
            );
        }


        const stage =
            this.getCurrentTargetStage();


        if (!stage) {

            throw new Error(
                "FitnessEvaluator has no target stage."
            );
        }


        const imageData =
            this.resizeCanvas(
                canvas,
                stage.width,
                stage.height
            );


        if (
            sampleStep >
            1
        ) {

            return this.evaluateSampled(
                imageData,
                sampleStep,
                createErrorMap
            );
        }


        return this.evaluate(
            imageData,
            createErrorMap
        );
    }



    /* =====================================================
       EVALUATE GENOME
       ===================================================== */

    evaluateGenome(
        genome,
        renderer,
        sampleStep = 1,
        createErrorMap = false
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
         * The renderer remains responsible for rendering the
         * Genome at canonical/full resolution.
         *
         * We then downsample the completed image to the
         * current fitness stage.
         */

        let rendered =
            null;


        if (
            typeof renderer
                .renderToBuffer ===
            "function"
        ) {

            rendered =
                renderer.renderToBuffer(
                    genome
                );
        }


        /*
         * Some renderer versions return their buffer canvas.
         * Older versions return undefined and expose the
         * ImageData through getBufferImageData().
         */

        let candidate;


        if (
            rendered &&
            Number.isFinite(
                rendered.width
            ) &&
            Number.isFinite(
                rendered.height
            )
        ) {

            candidate =
                rendered;

        } else if (
            typeof renderer
                .getBufferCanvas ===
            "function"
        ) {

            candidate =
                renderer
                    .getBufferCanvas();

        } else if (
            renderer.bufferCanvas
        ) {

            candidate =
                renderer.bufferCanvas;

        } else if (
            typeof renderer
                .getBufferImageData ===
            "function"
        ) {

            candidate =
                renderer
                    .getBufferImageData();

        } else {

            throw new Error(
                "EvolutionRenderer does not expose its rendered buffer."
            );
        }


        let result;


        if (
            sampleStep >
            1
        ) {

            result =
                this.evaluateSampled(
                    candidate,
                    sampleStep,
                    createErrorMap
                );

        } else {

            result =
                this.evaluate(
                    candidate,
                    createErrorMap
                );
        }


        /*
         * Store both score and the stage at which the score
         * was produced.
         */

        genome.fitness =
            result.fitness;


        genome.similarity =
            result.similarity;


        genome.error =
            result.error;


        genome.fitnessStage =
            this.getStageIndex();


        genome.fitnessWidth =
            result.width;


        genome.fitnessHeight =
            result.height;


        return result;
    }



    /* =====================================================
       BUILD ERROR MAP FOR GENOME
       ===================================================== */

    buildErrorMapForGenome(
        genome,
        renderer,
        sampleStep = 1
    ) {

        const result =
            this.evaluateGenome(
                genome,
                renderer,
                sampleStep,
                true
            );


        return result.errorMap;
    }



    /* =====================================================
       GET ERROR MAP
       ===================================================== */

    getErrorMap() {

        return this.errorMap;
    }



    hasErrorMap() {

        return (
            this.errorMap !== null &&
            this.errorMap.length >
                0
        );
    }



    /* =====================================================
       CLEAR ERROR MAP
       ===================================================== */

    clearErrorMap() {

        this.errorMap =
            null;


        this.errorMapWidth =
            0;


        this.errorMapHeight =
            0;


        this.errorMapTotal =
            0;


        return this;
    }



    /* =====================================================
       WEIGHTED ERROR POINT

       Selects a pixel using roulette-wheel selection where
       pixels with larger error are proportionally more
       likely to be selected.

       Returned x/y coordinates are converted back into the
       canonical/full-resolution coordinate system used by
       the genes.
       ===================================================== */

    getWeightedErrorPoint() {

        if (
            !this.hasErrorMap() ||
            this.errorMapTotal <=
                0
        ) {

            return this.getRandomTargetPoint();
        }


        let threshold =
            Math.random() *
            this.errorMapTotal;


        let selectedIndex =
            this.errorMap.length -
            1;


        for (
            let i = 0;
            i < this.errorMap.length;
            i++
        ) {

            threshold -=
                this.errorMap[i];


            if (
                threshold <=
                0
            ) {

                selectedIndex =
                    i;

                break;
            }
        }


        const stageX =
            selectedIndex %
            this.errorMapWidth;


        const stageY =
            Math.floor(
                selectedIndex /
                this.errorMapWidth
            );


        return this.stagePointToCanonical(
            stageX,
            stageY,
            this.errorMapWidth,
            this.errorMapHeight
        );
    }



    /* =====================================================
       RANDOM TARGET POINT
       ===================================================== */

    getRandomTargetPoint() {

        return {

            x:
                Math.random() *
                this.width,

            y:
                Math.random() *
                this.height

        };
    }



    /* =====================================================
       STAGE POINT -> CANONICAL
       ===================================================== */

    stagePointToCanonical(
        x,
        y,
        stageWidth,
        stageHeight
    ) {

        return {

            x:
                this.clamp(
                    (
                        x +
                        0.5
                    ) *
                    (
                        this.width /
                        stageWidth
                    ),
                    0,
                    this.width
                ),

            y:
                this.clamp(
                    (
                        y +
                        0.5
                    ) *
                    (
                        this.height /
                        stageHeight
                    ),
                    0,
                    this.height
                )

        };
    }



    /* =====================================================
       CANONICAL POINT -> STAGE
       ===================================================== */

    canonicalPointToStage(
        x,
        y,
        stage = null
    ) {

        stage =
            stage ??
            this.getCurrentTargetStage();


        if (!stage) {

            return {

                x: 0,
                y: 0

            };
        }


        const stageX =
            Math.floor(
                (
                    Number(x) || 0
                ) /
                this.width *
                stage.width
            );


        const stageY =
            Math.floor(
                (
                    Number(y) || 0
                ) /
                this.height *
                stage.height
            );


        return {

            x:
                this.clamp(
                    stageX,
                    0,
                    stage.width -
                    1
                ),

            y:
                this.clamp(
                    stageY,
                    0,
                    stage.height -
                    1
                )

        };
    }



    /* =====================================================
       TARGET COLOUR AT CANONICAL POSITION
       ===================================================== */

    getTargetColourAt(
        x,
        y
    ) {

        const stage =
            this.getCurrentTargetStage();


        if (!stage) {

            return {

                r: 0,
                g: 0,
                b: 0,
                a: 1

            };
        }


        const point =
            this.canonicalPointToStage(
                x,
                y,
                stage
            );


        const index =
            (
                point.y *
                stage.width +
                point.x
            ) *
            4;


        return {

            r:
                stage.pixels[
                    index
                ],

            g:
                stage.pixels[
                    index +
                    1
                ],

            b:
                stage.pixels[
                    index +
                    2
                ],

            a:
                stage.pixels[
                    index +
                    3
                ] /
                255

        };
    }



    /* =====================================================
       TARGET COLOUR AT STAGE POSITION
       ===================================================== */

    getTargetColourAtStage(
        x,
        y
    ) {

        const stage =
            this.getCurrentTargetStage();


        if (!stage) {

            return {

                r: 0,
                g: 0,
                b: 0,
                a: 1

            };
        }


        x =
            this.clamp(
                Math.floor(
                    Number(x) || 0
                ),
                0,
                stage.width -
                1
            );


        y =
            this.clamp(
                Math.floor(
                    Number(y) || 0
                ),
                0,
                stage.height -
                1
            );


        const index =
            (
                y *
                stage.width +
                x
            ) *
            4;


        return {

            r:
                stage.pixels[index],

            g:
                stage.pixels[
                    index + 1
                ],

            b:
                stage.pixels[
                    index + 2
                ],

            a:
                stage.pixels[
                    index + 3
                ] /
                255

        };
    }



    /* =====================================================
       TARGET COLOUR AT ERROR POINT
       ===================================================== */

    getTargetColourForErrorPoint(
        point
    ) {

        if (!point) {

            return {

                r: 0,
                g: 0,
                b: 0,
                a: 1

            };
        }


        return this.getTargetColourAt(
            point.x,
            point.y
        );
    }



    /* =====================================================
       IS GENOME FITNESS CURRENT?

       An elite evaluated at 60x89 must NOT be reused after
       the evaluator advances to 120x179.
       ===================================================== */

    isGenomeFitnessCurrent(
        genome
    ) {

        if (!genome) {

            return false;
        }


        if (
            !Number.isFinite(
                Number(
                    genome.fitness
                )
            )
        ) {

            return false;
        }


        const stage =
            this.getCurrentTargetStage();


        if (!stage) {

            return false;
        }


        return (
            Number(
                genome.fitnessStage
            ) ===
                this.getStageIndex() &&
            Number(
                genome.fitnessWidth
            ) ===
                stage.width &&
            Number(
                genome.fitnessHeight
            ) ===
                stage.height
        );
    }



    /* =====================================================
       INVALIDATE GENOME
       ===================================================== */

    invalidateGenome(
        genome
    ) {

        if (!genome) {

            return genome;
        }


        genome.fitness =
            undefined;


        genome.similarity =
            undefined;


        genome.error =
            undefined;


        genome.fitnessStage =
            undefined;


        genome.fitnessWidth =
            undefined;


        genome.fitnessHeight =
            undefined;


        return genome;
    }



    /* =====================================================
       COMPARE GENOMES
       ===================================================== */

    compare(
        genomeA,
        genomeB
    ) {

        const fitnessA =
            Number.isFinite(
                Number(
                    genomeA?.fitness
                )
            )
                ? Number(
                    genomeA.fitness
                )
                : -Infinity;


        const fitnessB =
            Number.isFinite(
                Number(
                    genomeB?.fitness
                )
            )
                ? Number(
                    genomeB.fitness
                )
                : -Infinity;


        return fitnessA >=
            fitnessB
            ? genomeA
            : genomeB;
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


        const candidateFitness =
            Number(
                candidate.fitness
            );


        const bestFitness =
            Number(
                currentBest.fitness
            );


        if (
            !Number.isFinite(
                candidateFitness
            )
        ) {

            return false;
        }


        if (
            !Number.isFinite(
                bestFitness
            )
        ) {

            return true;
        }


        return (
            candidateFitness >
            bestFitness
        );
    }



    /* =====================================================
       TARGET INFORMATION
       ===================================================== */

    hasTarget() {

        return (
            this.targetImageData !==
                null &&
            this.targetPixels !==
                null
        );
    }



    getTargetImageData() {

        return this.targetImageData;
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



    getTargetStages() {

        return this.targetStages;
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



    getStatistics() {

        const stage =
            this.getCurrentTargetStage();


        return {

            evaluations:
                this.evaluationCount,

            bestFitness:
                this.bestFitness,

            bestSimilarity:
                this.bestSimilarity,

            bestError:
                this.bestError,

            progressive:
                this.progressiveEnabled,

            stageIndex:
                this.getStageIndex(),

            stageNumber:
                this.getStageNumber(),

            stageCount:
                this.getStageCount(),

            finalStage:
                this.isFinalStage(),

            resolution:
                this.getResolutionLabel(),

            width:
                stage?.width ??
                this.width,

            height:
                stage?.height ??
                this.height,

            errorMapAvailable:
                this.hasErrorMap()

        };
    }



    /* =====================================================
       RESET STATISTICS
       ===================================================== */

    resetStatistics() {

        this.evaluationCount =
            0;


        this.resetBestStatistics();


        return this;
    }



    /* =====================================================
       RESET BEST STATISTICS

       Stage changes reset best values because fitness scores
       from different resolutions should not be directly
       treated as the same search stage.
       ===================================================== */

    resetBestStatistics() {

        this.bestFitness =
            0;


        this.bestSimilarity =
            0;


        this.bestError =
            Infinity;


        return this;
    }



    /* =====================================================
       FORMAT SIMILARITY
       ===================================================== */

    formatSimilarity(
        similarity,
        decimalPlaces = 2
    ) {

        similarity =
            Number(
                similarity
            );


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



    /* =====================================================
       FORMAT FITNESS
       ===================================================== */

    formatFitness(
        fitness,
        decimalPlaces = 6
    ) {

        fitness =
            Number(
                fitness
            );


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
       FORMAT ERROR
       ===================================================== */

    formatError(
        error,
        decimalPlaces = 2
    ) {

        error =
            Number(
                error
            );


        if (
            !Number.isFinite(
                error
            )
        ) {

            return "—";
        }


        return error.toFixed(
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

        value =
            Number(
                value
            );


        if (
            !Number.isFinite(
                value
            )
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