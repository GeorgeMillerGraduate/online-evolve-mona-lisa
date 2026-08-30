/* =========================================================
   MIDLIFE PROGRAMMER
   Evolve Mona Lisa
   app.js

   Main application controller.

   Connects:

       TargetImage
            ↓
       FitnessEvaluator
            ↓
       GeneticAlgorithm
            ↓
       Population
            ↓
       Genome
            ↓
       TriangleGene / CircleGene / DotGene
            ↓
       EvolutionRenderer
            ↓
       ExportManager

   Handles:

   - Target image loading
   - Mixed shape counts
   - Progressive resolution
   - Adaptive mutation
   - Error-guided mutation
   - Evolution playback
   - Statistics
   - PNG export
   - JSON export/import
   - GIF export
   ========================================================= */


document.addEventListener(
    "DOMContentLoaded",
    () => {

        initialiseApplication();

    }
);



/* =========================================================
   APPLICATION
   ========================================================= */

async function initialiseApplication() {


    /* =====================================================
       CANVAS
       ===================================================== */

    const canvas =
        document.getElementById(
            "evolutionCanvas"
        );


    if (!canvas) {

        console.error(
            "Evolution canvas was not found."
        );

        return;
    }



    /* =====================================================
       HTML ELEMENTS
       ===================================================== */

    const elements = {


        /* =================================================
           TARGET IMAGE
           ================================================= */

        imageUpload:
            document.getElementById(
                "imageUpload"
            ),

        targetThumbnail:
            document.getElementById(
                "targetThumbnail"
            ),

        targetImage:
            document.getElementById(
                "targetImage"
            ),



        /* =================================================
           SHAPE COUNTS
           ================================================= */

        triangleCount:
            document.getElementById(
                "triangleCount"
            ),

        triangleCountValue:
            document.getElementById(
                "triangleCountValue"
            ),


        circleCount:
            document.getElementById(
                "circleCount"
            ),

        circleCountValue:
            document.getElementById(
                "circleCountValue"
            ),


        dotCount:
            document.getElementById(
                "dotCount"
            ),

        dotCountValue:
            document.getElementById(
                "dotCountValue"
            ),


        totalShapeValue:
            document.getElementById(
                "totalShapeValue"
            ),



        /* =================================================
           GENETIC ALGORITHM PARAMETERS
           ================================================= */

        populationSize:
            document.getElementById(
                "populationSize"
            ),

        populationSizeValue:
            document.getElementById(
                "populationSizeValue"
            ),


        mutationsPerChild:
            document.getElementById(
                "mutationsPerChild"
            ),

        mutationsPerChildValue:
            document.getElementById(
                "mutationsPerChildValue"
            ),


        mutationStrength:
            document.getElementById(
                "mutationStrength"
            ),

        mutationStrengthValue:
            document.getElementById(
                "mutationStrengthValue"
            ),


        evolutionSpeed:
            document.getElementById(
                "evolutionSpeed"
            ),

        evolutionSpeedValue:
            document.getElementById(
                "evolutionSpeedValue"
            ),



        /* =================================================
           ADVANCED EVOLUTION
           ================================================= */

        progressiveResolution:
            document.getElementById(
                "progressiveResolution"
            ),

        adaptiveMutation:
            document.getElementById(
                "adaptiveMutation"
            ),

        errorGuidedMutation:
            document.getElementById(
                "errorGuidedMutation"
            ),



        /* =================================================
           BACKGROUND
           ================================================= */

        backgroundMode:
            document.getElementById(
                "backgroundMode"
            ),



        /* =================================================
           PLAYBACK BUTTONS
           ================================================= */

        startButton:
            document.getElementById(
                "startButton"
            ),

        resumeButton:
            document.getElementById(
                "resumeButton"
            ),

        pauseButton:
            document.getElementById(
                "pauseButton"
            ),

        stepButton:
            document.getElementById(
                "stepButton"
            ),

        resetButton:
            document.getElementById(
                "resetButton"
            ),



        /* =================================================
           EXPORT
           ================================================= */

        downloadButton:
            document.getElementById(
                "downloadButton"
            ),

        downloadJsonButton:
            document.getElementById(
                "downloadJsonButton"
            ),

        downloadGifButton:
            document.getElementById(
                "downloadGifButton"
            ),

        genomeUpload:
            document.getElementById(
                "genomeUpload"
            ),

        gifMode:
            document.getElementById(
                "gifMode"
            ),

        gifFrameDelay:
            document.getElementById(
                "gifFrameDelay"
            ),

        shapesPerFrame:
            document.getElementById(
                "shapesPerFrame"
            ),

        exportStatus:
            document.getElementById(
                "exportStatus"
            ),



        /* =================================================
           HEADER STATISTICS
           ================================================= */

        similarityStat:
            document.getElementById(
                "similarityStat"
            ),

        generationStat:
            document.getElementById(
                "generationStat"
            ),

        attemptStat:
            document.getElementById(
                "attemptStat"
            ),

        /*
         * Legacy HTML ID.
         *
         * The visible label is now SHAPES rather than
         * TRIANGLES.
         */

        triangleStat:
            document.getElementById(
                "triangleStat"
            ),

        resolutionStat:
            document.getElementById(
                "resolutionStat"
            ),



        /* =================================================
           LARGE STATISTICS
           ================================================= */

        similarityLarge:
            document.getElementById(
                "similarityLarge"
            ),

        fitnessStat:
            document.getElementById(
                "fitnessStat"
            ),

        generationLarge:
            document.getElementById(
                "generationLarge"
            ),

        evaluationStat:
            document.getElementById(
                "evaluationStat"
            ),

        resolutionLarge:
            document.getElementById(
                "resolutionLarge"
            ),

        improvementStat:
            document.getElementById(
                "improvementStat"
            ),

        similarityBar:
            document.getElementById(
                "similarityBar"
            ),



        /* =================================================
           CANVAS MESSAGE
           ================================================= */

        canvasMessage:
            document.getElementById(
                "canvasMessage"
            )

    };



    /* =====================================================
       DIMENSIONS
       ===================================================== */

    const WIDTH =
        canvas.width ||
        480;


    const HEIGHT =
        canvas.height ||
        715;



    /* =====================================================
       CORE COMPONENTS
       ===================================================== */

    const renderer =
        new EvolutionRenderer(
            canvas
        );


    const targetImage =
        new TargetImage(
            WIDTH,
            HEIGHT
        );


    /*
     * The evaluator receives its target after TargetImage
     * has finished loading.
     */

    const fitnessEvaluator =
        new FitnessEvaluator(
            null,
            {
                progressive:
                    true,

                progressiveWidths:
                    [
                        60,
                        120,
                        240,
                        WIDTH
                    ]
            }
        );


    /*
     * GA is created when a search begins because structural
     * controls such as shape count and population size may
     * have changed.
     */

    let geneticAlgorithm =
        null;



    /* =====================================================
       EXPORT MANAGER
       ===================================================== */

    const exportManager =
        typeof ExportManager !==
        "undefined"
            ? new ExportManager({

                renderer:
                    renderer,

                width:
                    WIDTH,

                height:
                    HEIGHT,

                baseFilename:
                    "evolved-mona-lisa",

                statusCallback:
                    updateExportStatus

            })
            : null;



    /* =====================================================
       APPLICATION STATE
       ===================================================== */

    let running =
        false;


    let animationFrameId =
        null;


    let lastDisplayedGenome =
        null;


    /*
     * Used for the improvement-per-generation display.
     */

    let previousDisplayedSimilarity =
        0;


    let previousDisplayedGeneration =
        0;


    /*
     * Periodically save evolutionary checkpoints for the
     * optional history GIF.
     */

    let lastHistoryGeneration =
        -1;


    const HISTORY_INTERVAL =
        25;


    /*
     * Evolution can consume the entire browser thread if we
     * blindly execute the requested number of generations.
     *
     * A time budget keeps controls and painting responsive.
     */

    const FRAME_BUDGET_MS =
        24;



    /* =====================================================
       CANVAS MESSAGE
       ===================================================== */

    function showCanvasMessage(message) {

        if (!elements.canvasMessage) {
            return;
        }


        elements.canvasMessage.textContent =
            message;


        elements.canvasMessage.style.display =
            "block";
    }



    function hideCanvasMessage() {

        if (!elements.canvasMessage) {
            return;
        }


        elements.canvasMessage.style.display =
            "none";
    }



    /* =====================================================
       EXPORT STATUS
       ===================================================== */

    function updateExportStatus(
        message,
        type = "info"
    ) {

        if (!elements.exportStatus) {
            return;
        }


        elements.exportStatus.textContent =
            message;


        elements.exportStatus.dataset.status =
            type;
    }



    /* =====================================================
       READ NUMBER
       ===================================================== */

    function readNumber(
        element,
        fallback
    ) {

        if (!element) {
            return fallback;
        }


        const value =
            Number(
                element.value
            );


        return Number.isFinite(value)
            ? value
            : fallback;
    }



    /* =====================================================
       READ CHECKBOX
       ===================================================== */

    function readCheckbox(
        element,
        fallback = false
    ) {

        if (!element) {
            return fallback;
        }


        return Boolean(
            element.checked
        );
    }



    /* =====================================================
       CURRENT SETTINGS
       ===================================================== */

    function getSettings() {

        const triangleCount =
            Math.max(
                0,
                Math.floor(
                    readNumber(
                        elements.triangleCount,
                        100
                    )
                )
            );


        const circleCount =
            Math.max(
                0,
                Math.floor(
                    readNumber(
                        elements.circleCount,
                        40
                    )
                )
            );


        const dotCount =
            Math.max(
                0,
                Math.floor(
                    readNumber(
                        elements.dotCount,
                        25
                    )
                )
            );


        return {

            triangleCount:
                triangleCount,

            circleCount:
                circleCount,

            dotCount:
                dotCount,

            totalShapeCount:
                triangleCount +
                circleCount +
                dotCount,


            populationSize:
                Math.max(
                    2,
                    Math.floor(
                        readNumber(
                            elements.populationSize,
                            30
                        )
                    )
                ),


            mutationsPerChild:
                Math.max(
                    1,
                    Math.floor(
                        readNumber(
                            elements.mutationsPerChild,
                            2
                        )
                    )
                ),


            /*
             * HTML slider uses percentage values.
             */

            mutationStrength:
                Math.max(
                    0.001,
                    Math.min(
                        1,
                        readNumber(
                            elements.mutationStrength,
                            15
                        ) / 100
                    )
                ),


            generationsPerFrame:
                Math.max(
                    1,
                    Math.floor(
                        readNumber(
                            elements.evolutionSpeed,
                            1
                        )
                    )
                ),


            progressiveResolution:
                readCheckbox(
                    elements.progressiveResolution,
                    true
                ),


            adaptiveMutation:
                readCheckbox(
                    elements.adaptiveMutation,
                    true
                ),


            errorGuidedMutation:
                readCheckbox(
                    elements.errorGuidedMutation,
                    true
                ),


            gifMode:
                elements.gifMode
                    ? elements.gifMode.value
                    : "build",


            gifFrameDelay:
                Math.max(
                    10,
                    Math.floor(
                        readNumber(
                            elements.gifFrameDelay,
                            40
                        )
                    )
                ),


            shapesPerFrame:
                Math.max(
                    1,
                    Math.floor(
                        readNumber(
                            elements.shapesPerFrame,
                            2
                        )
                    )
                )

        };
    }



    /* =====================================================
       UPDATE CONTROL LABELS
       ===================================================== */

    function updateControlLabels() {

        const settings =
            getSettings();


        setText(
            elements.triangleCountValue,
            settings.triangleCount
        );


        setText(
            elements.circleCountValue,
            settings.circleCount
        );


        setText(
            elements.dotCountValue,
            settings.dotCount
        );


        setText(
            elements.totalShapeValue,
            settings.totalShapeCount
        );


        setText(
            elements.populationSizeValue,
            settings.populationSize
        );


        setText(
            elements.mutationsPerChildValue,
            settings.mutationsPerChild
        );


        setText(
            elements.mutationStrengthValue,
            Math.round(
                settings.mutationStrength *
                100
            ) +
            "%"
        );


        setText(
            elements.evolutionSpeedValue,
            settings.generationsPerFrame
        );
    }



    /* =====================================================
       BACKGROUND COLOUR
       ===================================================== */

    function getBackgroundColour() {

        const mode =
            elements.backgroundMode
                ? elements.backgroundMode.value
                : "average";


        switch (mode) {

            case "black":

                return {

                    r: 0,
                    g: 0,
                    b: 0

                };


            case "white":

                return {

                    r: 255,
                    g: 255,
                    b: 255

                };


            case "random":

                return {

                    r:
                        Math.floor(
                            Math.random() *
                            256
                        ),

                    g:
                        Math.floor(
                            Math.random() *
                            256
                        ),

                    b:
                        Math.floor(
                            Math.random() *
                            256
                        )

                };


            case "average":
            default:

                if (
                    typeof targetImage
                        .getAverageColour ===
                    "function"
                ) {

                    return targetImage
                        .getAverageColour();
                }


                return {

                    r: 0,
                    g: 0,
                    b: 0

                };
        }
    }



    /* =====================================================
       APPLY BACKGROUND TO GENOME
       ===================================================== */

    function applyBackgroundToGenome(
        genome,
        fixedColour = null
    ) {

        if (!genome) {
            return;
        }


        const colour =
            fixedColour ??
            getBackgroundColour();


        if (
            typeof genome
                .setBackgroundColour ===
            "function"
        ) {

            genome.setBackgroundColour(
                colour.r,
                colour.g,
                colour.b
            );

            return;
        }


        if (
            typeof genome
                .setBackground ===
            "function"
        ) {

            genome.setBackground(
                colour
            );

            return;
        }


        /*
         * Keep both names for compatibility with the older
         * renderer and the newer genome/export classes.
         */

        genome.background = {

            r:
                colour.r,

            g:
                colour.g,

            b:
                colour.b

        };


        genome.backgroundColour =
            genome.background;
    }



    /* =====================================================
       APPLY BACKGROUND TO POPULATION
       ===================================================== */

    function applyBackgroundToPopulation() {

        if (
            !geneticAlgorithm ||
            !geneticAlgorithm.population
        ) {

            return;
        }


        const genomes =
            getPopulationGenomes();


        const mode =
            elements.backgroundMode
                ? elements.backgroundMode.value
                : "average";


        /*
         * Random mode intentionally generates a different
         * background for each genome.
         */

        const fixedColour =
            mode === "random"
                ? null
                : getBackgroundColour();


        for (
            const genome of
            genomes
        ) {

            applyBackgroundToGenome(
                genome,
                fixedColour
            );
        }
    }



    /* =====================================================
       GET POPULATION GENOMES
       ===================================================== */

    function getPopulationGenomes() {

        if (!geneticAlgorithm) {
            return [];
        }


        if (
            typeof geneticAlgorithm
                .getPopulationGenomes ===
            "function"
        ) {

            return geneticAlgorithm
                .getPopulationGenomes();
        }


        if (
            geneticAlgorithm.population &&
            typeof geneticAlgorithm.population
                .getGenomes ===
            "function"
        ) {

            return geneticAlgorithm.population
                .getGenomes();
        }


        if (
            Array.isArray(
                geneticAlgorithm.population
                    ?.genomes
            )
        ) {

            return geneticAlgorithm
                .population
                .genomes;
        }


        return [];
    }



    /* =====================================================
       CREATE GENETIC ALGORITHM
       ===================================================== */

    function createGeneticAlgorithm() {

        const settings =
            getSettings();


        /*
         * Progressive resolution belongs to the evaluator.
         */

        if (
            typeof fitnessEvaluator
                .setProgressiveEnabled ===
            "function"
        ) {

            fitnessEvaluator
                .setProgressiveEnabled(
                    settings.progressiveResolution
                );
        }


        geneticAlgorithm =
            new GeneticAlgorithm({

                populationSize:
                    settings.populationSize,

                triangleCount:
                    settings.triangleCount,

                circleCount:
                    settings.circleCount,

                dotCount:
                    settings.dotCount,

                mutationsPerChild:
                    settings.mutationsPerChild,

                mutationStrength:
                    settings.mutationStrength,

                eliteCount:
                    Math.max(
                        1,
                        Math.min(
                            3,
                            Math.floor(
                                settings.populationSize *
                                0.1
                            )
                        )
                    ),

                tournamentSize:
                    3,

                /*
                 * Progressive resolution now provides the
                 * primary scoring optimisation, so sampleStep
                 * can remain 1.
                 */

                sampleStep:
                    1,

                progressiveResolution:
                    settings.progressiveResolution,

                adaptiveMutation:
                    settings.adaptiveMutation,

                errorGuidedMutation:
                    settings.errorGuidedMutation,

                renderer:
                    renderer,

                fitnessEvaluator:
                    fitnessEvaluator

            });


        return geneticAlgorithm;
    }



    /* =====================================================
       INITIALISE EVOLUTION
       ===================================================== */

    function initialiseEvolution() {

        stopEvolution();


        const settings =
            getSettings();


        if (
            settings.totalShapeCount <=
            0
        ) {

            showCanvasMessage(
                "Add at least one shape before starting evolution."
            );

            return null;
        }


        createGeneticAlgorithm();


        if (
            exportManager
        ) {

            exportManager
                .clearHistory();
        }


        lastHistoryGeneration =
            -1;


        previousDisplayedSimilarity =
            0;


        previousDisplayedGeneration =
            0;


        /*
         * GeneticAlgorithm owns population creation.
         */

        geneticAlgorithm
            .initialise();


        /*
         * The selected background is part of the rendered
         * phenotype. Apply it before accepting the initial
         * population scores.
         */

        applyBackgroundToPopulation();


        /*
         * The population was modified after initialise(), so
         * invalidate and evaluate it again.
         */

        invalidatePopulationFitness();


        if (
            typeof geneticAlgorithm
                .evaluatePopulation ===
            "function"
        ) {

            geneticAlgorithm
                .evaluatePopulation();
        }


        if (
            typeof geneticAlgorithm
                .sortPopulation ===
            "function"
        ) {

            geneticAlgorithm
                .sortPopulation();
        }


        /*
         * Ask the GA to refresh its best records if its
         * public API provides a helper.
         */

        refreshAlgorithmBest();


        lastDisplayedGenome =
            getBestGenome();


        if (
            lastDisplayedGenome
        ) {

            renderer.render(
                lastDisplayedGenome
            );


            recordEvolutionHistory(
                true
            );


            hideCanvasMessage();
        }


        updateStatistics();


        return lastDisplayedGenome;
    }



    /* =====================================================
       INVALIDATE POPULATION FITNESS
       ===================================================== */

    function invalidatePopulationFitness() {

        const genomes =
            getPopulationGenomes();


        for (
            const genome of
            genomes
        ) {

            if (
                typeof fitnessEvaluator
                    .invalidateGenome ===
                "function"
            ) {

                fitnessEvaluator
                    .invalidateGenome(
                        genome
                    );

            } else {

                genome.fitness =
                    -Infinity;

                genome.similarity =
                    0;

                genome.error =
                    Infinity;
            }
        }
    }



    /* =====================================================
       REFRESH ALGORITHM BEST
       ===================================================== */

    function refreshAlgorithmBest() {

        if (!geneticAlgorithm) {
            return;
        }


        const genomes =
            getPopulationGenomes();


        const generationBest =
            genomes[0] ??
            null;


        if (
            "generationBest" in
            geneticAlgorithm
        ) {

            geneticAlgorithm.generationBest =
                generationBest;
        }


        geneticAlgorithm.bestGenome =
            null;


        geneticAlgorithm.bestFitness =
            -Infinity;


        geneticAlgorithm.bestSimilarity =
            0;


        geneticAlgorithm.bestError =
            Infinity;


        if (
            typeof geneticAlgorithm
                .updateBest ===
            "function"
        ) {

            geneticAlgorithm
                .updateBest(
                    generationBest
                );

        } else if (
            generationBest
        ) {

            geneticAlgorithm.bestGenome =
                typeof generationBest.clone ===
                    "function"
                    ? generationBest.clone()
                    : generationBest;


            geneticAlgorithm.bestFitness =
                Number(
                    generationBest.fitness
                ) || 0;


            geneticAlgorithm.bestSimilarity =
                Number(
                    generationBest.similarity
                ) || 0;


            geneticAlgorithm.bestError =
                Number(
                    generationBest.error
                );
        }
    }



    /* =====================================================
       GET BEST GENOME
       ===================================================== */

    function getBestGenome() {

        if (!geneticAlgorithm) {
            return null;
        }


        if (
            typeof geneticAlgorithm
                .getBestGenome ===
            "function"
        ) {

            return geneticAlgorithm
                .getBestGenome();
        }


        return (
            geneticAlgorithm.bestGenome ??
            getPopulationGenomes()[0] ??
            null
        );
    }



    /* =====================================================
       START / RESUME EVOLUTION
       ===================================================== */

    function startEvolution() {

        if (
            !targetImage.isLoaded()
        ) {

            showCanvasMessage(
                "Target image is still loading."
            );

            return;
        }


        if (
            !geneticAlgorithm ||
            !isAlgorithmInitialised()
        ) {

            const genome =
                initialiseEvolution();


            if (!genome) {
                return;
            }
        }


        if (running) {
            return;
        }


        running =
            true;


        updateButtonState();


        hideCanvasMessage();


        animationFrameId =
            requestAnimationFrame(
                evolutionLoop
            );
    }



    /* =====================================================
       ALGORITHM INITIALISED?
       ===================================================== */

    function isAlgorithmInitialised() {

        if (!geneticAlgorithm) {
            return false;
        }


        if (
            typeof geneticAlgorithm
                .isInitialised ===
            "function"
        ) {

            return geneticAlgorithm
                .isInitialised();
        }


        return (
            getPopulationGenomes()
                .length >
            0
        );
    }



    /* =====================================================
       PAUSE / STOP
       ===================================================== */

    function stopEvolution() {

        running =
            false;


        if (
            animationFrameId !==
            null
        ) {

            cancelAnimationFrame(
                animationFrameId
            );


            animationFrameId =
                null;
        }


        updateButtonState();
    }



    /* =====================================================
       APPLY LIVE ALGORITHM SETTINGS
       ===================================================== */

    function applyLiveAlgorithmSettings() {

        if (!geneticAlgorithm) {
            return;
        }


        const settings =
            getSettings();


        if (
            typeof geneticAlgorithm
                .setMutationsPerChild ===
            "function"
        ) {

            geneticAlgorithm
                .setMutationsPerChild(
                    settings.mutationsPerChild
                );
        }


        if (
            typeof geneticAlgorithm
                .setMutationStrength ===
            "function"
        ) {

            geneticAlgorithm
                .setMutationStrength(
                    settings.mutationStrength
                );
        }


        /*
         * Support either explicit setters or public option
         * properties depending on the GA implementation.
         */

        if (
            typeof geneticAlgorithm
                .setAdaptiveMutation ===
            "function"
        ) {

            geneticAlgorithm
                .setAdaptiveMutation(
                    settings.adaptiveMutation
                );

        } else {

            geneticAlgorithm.adaptiveMutation =
                settings.adaptiveMutation;
        }


        if (
            typeof geneticAlgorithm
                .setErrorGuidedMutation ===
            "function"
        ) {

            geneticAlgorithm
                .setErrorGuidedMutation(
                    settings.errorGuidedMutation
                );

        } else {

            geneticAlgorithm.errorGuidedMutation =
                settings.errorGuidedMutation;
        }
    }



    /* =====================================================
       EVOLUTION LOOP
       ===================================================== */

    function evolutionLoop() {

        if (!running) {
            return;
        }


        applyLiveAlgorithmSettings();


        const settings =
            getSettings();


        const frameStart =
            performance.now();


        let generationsCompleted =
            0;


        while (
            generationsCompleted <
            settings.generationsPerFrame
        ) {

            geneticAlgorithm.step();


            generationsCompleted++;


            /*
             * Don't allow an aggressive Generations / Frame
             * setting to freeze the UI.
             */

            if (
                performance.now() -
                frameStart >=
                FRAME_BUDGET_MS
            ) {

                break;
            }
        }


        const bestGenome =
            getBestGenome();


        if (
            bestGenome
        ) {

            renderer.render(
                bestGenome
            );


            lastDisplayedGenome =
                bestGenome;


            recordEvolutionHistory();
        }


        updateStatistics();


        animationFrameId =
            requestAnimationFrame(
                evolutionLoop
            );
    }



    /* =====================================================
       SINGLE STEP
       ===================================================== */

    function stepEvolution() {

        if (
            !targetImage.isLoaded()
        ) {

            return;
        }


        stopEvolution();


        if (
            !geneticAlgorithm ||
            !isAlgorithmInitialised()
        ) {

            initialiseEvolution();

            return;
        }


        applyLiveAlgorithmSettings();


        geneticAlgorithm.step();


        const bestGenome =
            getBestGenome();


        if (
            bestGenome
        ) {

            renderer.render(
                bestGenome
            );


            lastDisplayedGenome =
                bestGenome;


            recordEvolutionHistory();
        }


        hideCanvasMessage();


        updateStatistics();
    }



    /* =====================================================
       RECORD EVOLUTION HISTORY
       ===================================================== */

    function recordEvolutionHistory(
        force = false
    ) {

        if (
            !exportManager ||
            !lastDisplayedGenome ||
            !geneticAlgorithm
        ) {

            return;
        }


        const stats =
            getAlgorithmStatistics();


        const generation =
            Number(
                stats.generation
            ) || 0;


        if (
            !force &&
            generation -
                lastHistoryGeneration <
                HISTORY_INTERVAL
        ) {

            return;
        }


        exportManager
            .recordHistory(
                lastDisplayedGenome,
                {
                    generation:
                        generation,

                    similarity:
                        stats.bestSimilarity,

                    fitness:
                        stats.bestFitness
                }
            );


        lastHistoryGeneration =
            generation;
    }



    /* =====================================================
       RESET
       ===================================================== */

    function resetEvolution() {

        stopEvolution();


        if (
            geneticAlgorithm &&
            typeof geneticAlgorithm
                .reset ===
            "function"
        ) {

            geneticAlgorithm
                .reset();
        }


        geneticAlgorithm =
            null;


        lastDisplayedGenome =
            null;


        previousDisplayedSimilarity =
            0;


        previousDisplayedGeneration =
            0;


        lastHistoryGeneration =
            -1;


        if (
            exportManager
        ) {

            exportManager
                .clearHistory();


            updateExportStatus(
                "Nothing exported yet."
            );
        }


        renderer.clear();


        resetStatisticsDisplay();


        showCanvasMessage(
            "Press Start Evolution to begin."
        );
    }



    /* =====================================================
       GET ALGORITHM STATISTICS
       ===================================================== */

    function getAlgorithmStatistics() {

        if (!geneticAlgorithm) {

            return {};
        }


        if (
            typeof geneticAlgorithm
                .getStatistics ===
            "function"
        ) {

            return geneticAlgorithm
                .getStatistics();
        }


        return {

            generation:
                geneticAlgorithm.generation,

            attempts:
                geneticAlgorithm.attempts,

            evaluations:
                fitnessEvaluator
                    ?.getEvaluationCount?.(),

            bestFitness:
                geneticAlgorithm.bestFitness,

            bestSimilarity:
                geneticAlgorithm.bestSimilarity,

            bestError:
                geneticAlgorithm.bestError

        };
    }



    /* =====================================================
       CURRENT RESOLUTION LABEL
       ===================================================== */

    function getResolutionLabel() {

        if (
            typeof fitnessEvaluator
                .getResolutionLabel ===
            "function"
        ) {

            return fitnessEvaluator
                .getResolutionLabel();
        }


        if (
            typeof fitnessEvaluator
                .getCurrentResolution ===
            "function"
        ) {

            const resolution =
                fitnessEvaluator
                    .getCurrentResolution();


            if (
                resolution &&
                resolution.width &&
                resolution.height
            ) {

                return (
                    resolution.width +
                    "×" +
                    resolution.height
                );
            }
        }


        return (
            WIDTH +
            "×" +
            HEIGHT
        );
    }



    /* =====================================================
       UPDATE STATISTICS
       ===================================================== */

    function updateStatistics() {

        if (!geneticAlgorithm) {

            resetStatisticsDisplay();

            return;
        }


        const stats =
            getAlgorithmStatistics();


        const similarity =
            finiteOr(
                stats.bestSimilarity,
                lastDisplayedGenome
                    ?.similarity,
                0
            );


        const fitness =
            finiteOr(
                stats.bestFitness,
                lastDisplayedGenome
                    ?.fitness,
                0
            );


        const generation =
            finiteOr(
                stats.generation,
                geneticAlgorithm
                    ?.generation,
                0
            );


        const attempts =
            finiteOr(
                stats.attempts,
                stats.evaluations,
                0
            );


        const evaluations =
            finiteOr(
                stats.evaluations,
                fitnessEvaluator
                    ?.getEvaluationCount?.(),
                attempts
            );


        const settings =
            getSettings();


        const totalShapes =
            finiteOr(
                stats.totalShapeCount,
                stats.shapeCount,
                settings.totalShapeCount
            );


        const resolution =
            stats.resolution ??
            stats.resolutionLabel ??
            getResolutionLabel();


        /*
         * Improvement since the previous UI refresh.
         */

        let improvement =
            0;


        if (
            generation >
            previousDisplayedGeneration
        ) {

            improvement =
                similarity -
                previousDisplayedSimilarity;
        }


        previousDisplayedSimilarity =
            similarity;


        previousDisplayedGeneration =
            generation;



        /* ===============================================
           HEADER
           =============================================== */

        setText(
            elements.similarityStat,
            formatSimilarity(
                similarity
            )
        );


        setText(
            elements.generationStat,
            formatInteger(
                generation
            )
        );


        setText(
            elements.attemptStat,
            formatInteger(
                attempts
            )
        );


        setText(
            elements.triangleStat,
            formatInteger(
                totalShapes
            )
        );


        setText(
            elements.resolutionStat,
            resolution
        );



        /* ===============================================
           LARGE STATISTICS
           =============================================== */

        setText(
            elements.similarityLarge,
            formatSimilarity(
                similarity
            )
        );


        setText(
            elements.fitnessStat,
            Number.isFinite(fitness)
                ? fitness.toFixed(6)
                : "—"
        );


        setText(
            elements.generationLarge,
            formatInteger(
                generation
            )
        );


        setText(
            elements.evaluationStat,
            formatInteger(
                evaluations
            )
        );


        setText(
            elements.resolutionLarge,
            resolution
        );


        setText(
            elements.improvementStat,
            formatImprovement(
                improvement
            )
        );



        /* ===============================================
           SIMILARITY BAR
           =============================================== */

        if (
            elements.similarityBar
        ) {

            const percentage =
                Math.max(
                    0,
                    Math.min(
                        100,
                        similarity
                    )
                );


            elements.similarityBar
                .style.width =
                percentage +
                "%";
        }
    }



    /* =====================================================
       RESET STATISTICS
       ===================================================== */

    function resetStatisticsDisplay() {

        const settings =
            getSettings();


        setText(
            elements.similarityStat,
            "0.00%"
        );


        setText(
            elements.generationStat,
            "0"
        );


        setText(
            elements.attemptStat,
            "0"
        );


        setText(
            elements.triangleStat,
            formatInteger(
                settings.totalShapeCount
            )
        );


        setText(
            elements.resolutionStat,
            getResolutionLabel()
        );


        setText(
            elements.similarityLarge,
            "0.00%"
        );


        setText(
            elements.fitnessStat,
            "—"
        );


        setText(
            elements.generationLarge,
            "0"
        );


        setText(
            elements.evaluationStat,
            "0"
        );


        setText(
            elements.resolutionLarge,
            getResolutionLabel()
        );


        setText(
            elements.improvementStat,
            "—"
        );


        if (
            elements.similarityBar
        ) {

            elements.similarityBar
                .style.width =
                "0%";
        }
    }



    /* =====================================================
       UTILITY: FIRST FINITE NUMBER
       ===================================================== */

    function finiteOr(
        ...values
    ) {

        for (
            const value of
            values
        ) {

            const number =
                Number(
                    value
                );


            if (
                Number.isFinite(
                    number
                )
            ) {

                return number;
            }
        }


        return 0;
    }



    /* =====================================================
       SET TEXT
       ===================================================== */

    function setText(
        element,
        value
    ) {

        if (!element) {
            return;
        }


        element.textContent =
            value;
    }



    /* =====================================================
       FORMAT SIMILARITY
       ===================================================== */

    function formatSimilarity(value) {

        value =
            Number(value);


        if (
            !Number.isFinite(value)
        ) {

            return "0.00%";
        }


        return (
            value.toFixed(2) +
            "%"
        );
    }



    /* =====================================================
       FORMAT INTEGER
       ===================================================== */

    function formatInteger(value) {

        value =
            Number(value);


        if (
            !Number.isFinite(value)
        ) {

            return "0";
        }


        return Math.floor(value)
            .toLocaleString();
    }



    /* =====================================================
       FORMAT IMPROVEMENT
       ===================================================== */

    function formatImprovement(value) {

        value =
            Number(value);


        if (
            !Number.isFinite(value)
        ) {

            return "—";
        }


        if (
            Math.abs(value) <
            0.000001
        ) {

            return "0.0000%";
        }


        return (
            (
                value >
                0
                    ? "+"
                    : ""
            ) +
            value.toFixed(4) +
            "%"
        );
    }



    /* =====================================================
       UPDATE BUTTON STATE
       ===================================================== */

    function updateButtonState() {

        if (
            elements.startButton
        ) {

            elements.startButton.disabled =
                running;


            elements.startButton.textContent =
                running
                    ? "Evolution Running"
                    : (
                        geneticAlgorithm
                            ? "Resume Evolution"
                            : "Start Evolution"
                    );
        }


        if (
            elements.resumeButton
        ) {

            elements.resumeButton.disabled =
                running;


            elements.resumeButton.textContent =
                running
                    ? "Running"
                    : "Start";
        }


        if (
            elements.pauseButton
        ) {

            elements.pauseButton.disabled =
                !running;
        }


        if (
            elements.stepButton
        ) {

            elements.stepButton.disabled =
                running;
        }


        const hasGenome =
            Boolean(
                lastDisplayedGenome
            );


        if (
            elements.downloadButton
        ) {

            elements.downloadButton.disabled =
                !hasGenome;
        }


        if (
            elements.downloadJsonButton
        ) {

            elements.downloadJsonButton.disabled =
                !hasGenome;
        }


        if (
            elements.downloadGifButton
        ) {

            elements.downloadGifButton.disabled =
                !hasGenome;
        }
    }



    /* =====================================================
       PNG EXPORT
       ===================================================== */

    async function downloadPNG() {

        if (
            !lastDisplayedGenome
        ) {

            showCanvasMessage(
                "Start the evolution before saving an image."
            );

            return;
        }


        try {

            if (
                exportManager
            ) {

                await exportManager
                    .exportPNG(
                        lastDisplayedGenome,
                        "evolved-mona-lisa.png"
                    );

            } else {

                /*
                 * Compatibility fallback.
                 */

                renderer.render(
                    lastDisplayedGenome
                );


                if (
                    typeof renderer
                        .downloadPNG ===
                    "function"
                ) {

                    renderer.downloadPNG(
                        "evolved-mona-lisa.png"
                    );
                }
            }

        } catch (error) {

            console.error(
                "PNG export failed:",
                error
            );


            updateExportStatus(
                "PNG export failed.",
                "error"
            );
        }
    }



    /* =====================================================
       JSON EXPORT
       ===================================================== */

    function downloadJSON() {

        if (
            !lastDisplayedGenome
        ) {

            showCanvasMessage(
                "Start evolution before exporting a genome."
            );

            return;
        }


        if (
            !exportManager
        ) {

            updateExportStatus(
                "ExportManager.js is not loaded.",
                "error"
            );

            return;
        }


        try {

            const stats =
                getAlgorithmStatistics();


            exportManager
                .exportJSON(
                    lastDisplayedGenome,
                    {
                        generation:
                            stats.generation,

                        evaluations:
                            stats.evaluations
                    },
                    "evolved-mona-lisa.json"
                );

        } catch (error) {

            console.error(
                "JSON export failed:",
                error
            );
        }
    }



    /* =====================================================
       GIF EXPORT
       ===================================================== */

    async function downloadGIF() {

        if (
            !lastDisplayedGenome
        ) {

            showCanvasMessage(
                "Start evolution before exporting a GIF."
            );

            return;
        }


        if (
            !exportManager
        ) {

            updateExportStatus(
                "ExportManager.js is not loaded.",
                "error"
            );

            return;
        }


        const settings =
            getSettings();


        try {

            elements.downloadGifButton &&
                (
                    elements.downloadGifButton.disabled =
                        true
                );


            await exportManager
                .exportGIF(
                    lastDisplayedGenome,
                    {
                        mode:
                            settings.gifMode,

                        frameDelay:
                            settings.gifFrameDelay,

                        shapesPerFrame:
                            settings.shapesPerFrame,

                        filename:
                            settings.gifMode ===
                                "history"
                                ? "mona-lisa-evolution.gif"
                                : "mona-lisa-build.gif"
                    }
                );

        } catch (error) {

            console.error(
                "GIF export failed:",
                error
            );


            updateExportStatus(
                error.message ??
                "GIF export failed.",
                "error"
            );

        } finally {

            updateButtonState();
        }
    }



    /* =====================================================
       IMPORT GENOME JSON
       ===================================================== */

    async function genomeFileChanged(event) {

        const file =
            event.target
                .files?.[0];


        if (!file) {
            return;
        }


        if (
            !exportManager
        ) {

            updateExportStatus(
                "ExportManager.js is not loaded.",
                "error"
            );

            return;
        }


        stopEvolution();


        try {

            const genome =
                await exportManager
                    .importJSONFile(
                        file
                    );


            /*
             * Imported fitness is deliberately considered
             * stale. Evaluate it against the currently loaded
             * target before displaying a score.
             */

            if (
                typeof fitnessEvaluator
                    .evaluateGenome ===
                "function"
            ) {

                fitnessEvaluator
                    .evaluateGenome(
                        genome,
                        renderer,
                        1,
                        false
                    );
            }


            lastDisplayedGenome =
                genome;


            renderer.render(
                genome
            );


            /*
             * The imported genome can be viewed/exported
             * immediately. Evolution itself starts a new GA
             * unless the algorithm provides an explicit
             * import/resume API.
             */

            geneticAlgorithm =
                null;


            if (
                exportManager
            ) {

                exportManager
                    .clearHistory();


                exportManager
                    .recordHistory(
                        genome,
                        {
                            generation:
                                genome.generation ??
                                0,

                            similarity:
                                genome.similarity,

                            fitness:
                                genome.fitness
                        }
                    );
            }


            hideCanvasMessage();


            displayStandaloneGenomeStats(
                genome
            );


            updateButtonState();


            /*
             * Allow selecting the same file again later.
             */

            event.target.value =
                "";

        } catch (error) {

            console.error(
                "Unable to import genome:",
                error
            );


            showCanvasMessage(
                "Unable to import that genome JSON."
            );


            event.target.value =
                "";
        }
    }



    /* =====================================================
       DISPLAY IMPORTED GENOME STATS
       ===================================================== */

    function displayStandaloneGenomeStats(
        genome
    ) {

        const similarity =
            finiteOr(
                genome.similarity,
                0
            );


        const fitness =
            finiteOr(
                genome.fitness,
                0
            );


        const generation =
            finiteOr(
                genome.generation,
                0
            );


        let shapeCount =
            0;


        if (
            typeof genome.getShapes ===
            "function"
        ) {

            shapeCount =
                genome.getShapes()
                    .length;

        } else if (
            Array.isArray(
                genome.shapes
            )
        ) {

            shapeCount =
                genome.shapes.length;
        }


        setText(
            elements.similarityStat,
            formatSimilarity(
                similarity
            )
        );


        setText(
            elements.similarityLarge,
            formatSimilarity(
                similarity
            )
        );


        setText(
            elements.fitnessStat,
            fitness.toFixed(6)
        );


        setText(
            elements.generationStat,
            formatInteger(
                generation
            )
        );


        setText(
            elements.generationLarge,
            formatInteger(
                generation
            )
        );


        setText(
            elements.triangleStat,
            formatInteger(
                shapeCount
            )
        );


        setText(
            elements.resolutionStat,
            getResolutionLabel()
        );


        setText(
            elements.resolutionLarge,
            getResolutionLabel()
        );


        if (
            elements.similarityBar
        ) {

            elements.similarityBar
                .style.width =
                Math.max(
                    0,
                    Math.min(
                        100,
                        similarity
                    )
                ) +
                "%";
        }
    }



    /* =====================================================
       TARGET IMAGE CHANGED
       ===================================================== */

    async function targetFileChanged(event) {

        const file =
            event.target
                .files?.[0];


        if (!file) {
            return;
        }


        stopEvolution();


        showCanvasMessage(
            "Loading target image..."
        );


        try {

            await targetImage
                .loadFile(
                    file
                );


            targetImage
                .updatePagePreviews();


            targetImage
                .applyToFitnessEvaluator(
                    fitnessEvaluator
                );


            /*
             * Fitness scores from the previous target have no
             * meaning against the new target.
             */

            geneticAlgorithm =
                null;


            lastDisplayedGenome =
                null;


            previousDisplayedSimilarity =
                0;


            previousDisplayedGeneration =
                0;


            lastHistoryGeneration =
                -1;


            if (
                exportManager
            ) {

                exportManager
                    .clearHistory();
            }


            renderer.clear();


            resetStatisticsDisplay();


            updateButtonState();


            showCanvasMessage(
                "New target loaded. Press Start Evolution."
            );


            event.target.value =
                "";

        } catch (error) {

            console.error(
                "Unable to load target image:",
                error
            );


            showCanvasMessage(
                "Unable to load that image."
            );


            event.target.value =
                "";
        }
    }



    /* =====================================================
       STRUCTURAL PARAMETER CHANGED

       Shape counts and population size alter the actual
       structure of the search, so an existing population
       cannot simply continue.
       ===================================================== */

    function structuralParameterChanged() {

        updateControlLabels();


        if (
            geneticAlgorithm &&
            isAlgorithmInitialised()
        ) {

            resetEvolution();
        }
    }



    /* =====================================================
       LIVE PARAMETER CHANGED
       ===================================================== */

    function liveParameterChanged() {

        updateControlLabels();


        applyLiveAlgorithmSettings();
    }



    /* =====================================================
       ADVANCED OPTION CHANGED
       ===================================================== */

    function advancedOptionChanged() {

        const settings =
            getSettings();


        /*
         * Progressive-resolution changes alter the meaning
         * of every fitness score, so restart the search.
         */

        if (
            typeof fitnessEvaluator
                .setProgressiveEnabled ===
            "function"
        ) {

            fitnessEvaluator
                .setProgressiveEnabled(
                    settings.progressiveResolution
                );
        }


        if (
            geneticAlgorithm &&
            isAlgorithmInitialised()
        ) {

            resetEvolution();
        }
    }



    /* =====================================================
       BACKGROUND CHANGED
       ===================================================== */

    function backgroundChanged() {

        /*
         * Background colour contributes to every scored
         * pixel. Existing fitness values therefore become
         * invalid.
         */

        if (
            geneticAlgorithm &&
            isAlgorithmInitialised()
        ) {

            resetEvolution();
        }
    }



    /* =====================================================
       CONNECT CONTROLS
       ===================================================== */

    function connectControls() {


        /* =================================================
           PLAYBACK
           ================================================= */

        elements.startButton
            ?.addEventListener(
                "click",
                startEvolution
            );


        elements.resumeButton
            ?.addEventListener(
                "click",
                startEvolution
            );


        elements.pauseButton
            ?.addEventListener(
                "click",
                stopEvolution
            );


        elements.stepButton
            ?.addEventListener(
                "click",
                stepEvolution
            );


        elements.resetButton
            ?.addEventListener(
                "click",
                resetEvolution
            );



        /* =================================================
           TARGET
           ================================================= */

        elements.imageUpload
            ?.addEventListener(
                "change",
                targetFileChanged
            );



        /* =================================================
           STRUCTURAL CONTROLS
           ================================================= */

        elements.triangleCount
            ?.addEventListener(
                "input",
                structuralParameterChanged
            );


        elements.circleCount
            ?.addEventListener(
                "input",
                structuralParameterChanged
            );


        elements.dotCount
            ?.addEventListener(
                "input",
                structuralParameterChanged
            );


        elements.populationSize
            ?.addEventListener(
                "input",
                structuralParameterChanged
            );



        /* =================================================
           LIVE CONTROLS
           ================================================= */

        elements.mutationsPerChild
            ?.addEventListener(
                "input",
                liveParameterChanged
            );


        elements.mutationStrength
            ?.addEventListener(
                "input",
                liveParameterChanged
            );


        elements.evolutionSpeed
            ?.addEventListener(
                "input",
                updateControlLabels
            );



        /* =================================================
           ADVANCED EVOLUTION
           ================================================= */

        elements.progressiveResolution
            ?.addEventListener(
                "change",
                advancedOptionChanged
            );


        elements.adaptiveMutation
            ?.addEventListener(
                "change",
                liveParameterChanged
            );


        elements.errorGuidedMutation
            ?.addEventListener(
                "change",
                liveParameterChanged
            );



        /* =================================================
           BACKGROUND
           ================================================= */

        elements.backgroundMode
            ?.addEventListener(
                "change",
                backgroundChanged
            );



        /* =================================================
           EXPORT
           ================================================= */

        elements.downloadButton
            ?.addEventListener(
                "click",
                downloadPNG
            );


        elements.downloadJsonButton
            ?.addEventListener(
                "click",
                downloadJSON
            );


        elements.downloadGifButton
            ?.addEventListener(
                "click",
                downloadGIF
            );


        elements.genomeUpload
            ?.addEventListener(
                "change",
                genomeFileChanged
            );


        elements.gifFrameDelay
            ?.addEventListener(
                "input",
                () => {

                    if (
                        exportManager
                    ) {

                        exportManager
                            .setGIFFrameDelay(
                                getSettings()
                                    .gifFrameDelay
                            );
                    }
                }
            );


        elements.shapesPerFrame
            ?.addEventListener(
                "input",
                () => {

                    if (
                        exportManager
                    ) {

                        exportManager
                            .setShapesPerFrame(
                                getSettings()
                                    .shapesPerFrame
                            );
                    }
                }
            );
    }



    /* =====================================================
       LOAD DEFAULT TARGET
       ===================================================== */

    async function loadDefaultTarget() {

        showCanvasMessage(
            "Loading Mona Lisa..."
        );


        try {

            await targetImage
                .loadDefault();


            /*
             * TargetImage supplies the canonical full
             * resolution pixels. FitnessEvaluator creates its
             * own progressive-resolution versions from these.
             */

            targetImage
                .applyToFitnessEvaluator(
                    fitnessEvaluator
                );


            targetImage
                .updatePagePreviews();


            resetStatisticsDisplay();


            showCanvasMessage(
                "Press Start Evolution to begin."
            );

        } catch (error) {

            console.error(
                "Failed to load default target:",
                error
            );


            showCanvasMessage(
                "Could not load the Mona Lisa target image."
            );
        }
    }



    /* =====================================================
       STARTUP
       ===================================================== */

    updateControlLabels();


    resetStatisticsDisplay();


    updateButtonState();


    connectControls();


    updateExportStatus(
        "Nothing exported yet."
    );


    await loadDefaultTarget();



    /* =====================================================
       DEBUGGING / DEVELOPMENT API
       ===================================================== */

    window.MonaEvolution = {

        target:
            targetImage,

        renderer:
            renderer,

        fitnessEvaluator:
            fitnessEvaluator,

        exporter:
            exportManager,

        algorithm:
            () =>
                geneticAlgorithm,

        bestGenome:
            () =>
                lastDisplayedGenome,

        settings:
            getSettings,

        start:
            startEvolution,

        pause:
            stopEvolution,

        step:
            stepEvolution,

        reset:
            resetEvolution,

        exportPNG:
            downloadPNG,

        exportJSON:
            downloadJSON,

        exportGIF:
            downloadGIF

    };


    console.log(
        "Evolve Mona Lisa initialised."
    );

}