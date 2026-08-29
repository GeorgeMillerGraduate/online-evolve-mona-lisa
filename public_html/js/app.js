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
   TriangleGene
        ↓
   EvolutionRenderer

   Also connects all HTML controls and statistics.
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


        /* TARGET IMAGE */

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


        /* PARAMETERS */

        triangleCount:
            document.getElementById(
                "triangleCount"
            ),

        triangleCountValue:
            document.getElementById(
                "triangleCountValue"
            ),


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


        backgroundMode:
            document.getElementById(
                "backgroundMode"
            ),


        /* BUTTONS */

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

        downloadButton:
            document.getElementById(
                "downloadButton"
            ),


        /* MAIN STATISTICS */

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

        triangleStat:
            document.getElementById(
                "triangleStat"
            ),


        /* LARGE STATISTICS */

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

        similarityBar:
            document.getElementById(
                "similarityBar"
            ),


        /* CANVAS MESSAGE */

        canvasMessage:
            document.getElementById(
                "canvasMessage"
            )

    };



    /* =====================================================
       CONSTANTS
       ===================================================== */

    const WIDTH =
        canvas.width || 480;


    const HEIGHT =
        canvas.height || 715;



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


    const fitnessEvaluator =
        new FitnessEvaluator();



    /*
     * GeneticAlgorithm is created after the target image
     * has loaded.
     */

    let geneticAlgorithm =
        null;



    /* =====================================================
       APPLICATION STATE
       ===================================================== */

    let running =
        false;


    let animationFrameId =
        null;


    let lastDisplayedGenome =
        null;


    let lastFrameTime =
        0;


    /*
     * Prevent the browser from becoming completely occupied
     * by evolution.
     *
     * Evolution is computationally expensive because every
     * candidate requires rendering and pixel comparison.
     */

    const FRAME_BUDGET_MS =
        24;



    /* =====================================================
       SHOW CANVAS MESSAGE
       ===================================================== */

    function showCanvasMessage(
        message
    ) {

        if (!elements.canvasMessage) {
            return;
        }


        elements.canvasMessage.textContent =
            message;


        elements.canvasMessage.style.display =
            "block";
    }



    /* =====================================================
       HIDE CANVAS MESSAGE
       ===================================================== */

    function hideCanvasMessage() {

        if (!elements.canvasMessage) {
            return;
        }


        elements.canvasMessage.style.display =
            "none";
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
       CURRENT SETTINGS
       ===================================================== */

    function getSettings() {

        return {

            triangleCount:
                Math.max(
                    1,
                    Math.floor(
                        readNumber(
                            elements.triangleCount,
                            100
                        )
                    )
                ),


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
             * HTML uses 1-100.
             *
             * GeneticAlgorithm expects 0-1.
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
                )

        };
    }



    /* =====================================================
       UPDATE CONTROL LABELS
       ===================================================== */

    function updateControlLabels() {

        const settings =
            getSettings();


        if (
            elements.triangleCountValue
        ) {

            elements.triangleCountValue.textContent =
                settings.triangleCount;
        }


        if (
            elements.populationSizeValue
        ) {

            elements.populationSizeValue.textContent =
                settings.populationSize;
        }


        if (
            elements.mutationsPerChildValue
        ) {

            elements.mutationsPerChildValue.textContent =
                settings.mutationsPerChild;
        }


        if (
            elements.mutationStrengthValue
        ) {

            elements.mutationStrengthValue.textContent =
                Math.round(
                    settings.mutationStrength *
                    100
                ) +
                "%";
        }


        if (
            elements.evolutionSpeedValue
        ) {

            elements.evolutionSpeedValue.textContent =
                settings.generationsPerFrame;
        }
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

                return targetImage
                    .getAverageColour();
        }
    }



    /* =====================================================
       APPLY BACKGROUND TO GENOME
       ===================================================== */

    function applyBackgroundToGenome(
        genome
    ) {

        if (!genome) {
            return;
        }


        const colour =
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

        } else {

            genome.backgroundColour = {

                r:
                    colour.r,

                g:
                    colour.g,

                b:
                    colour.b

            };
        }
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
            geneticAlgorithm
                .getPopulationGenomes();


        /*
         * For random mode each genome receives its own
         * background.
         *
         * For all other modes they receive the same colour.
         */

        for (
            const genome of genomes
        ) {

            applyBackgroundToGenome(
                genome
            );
        }
    }



    /* =====================================================
       CREATE GENETIC ALGORITHM
       ===================================================== */

    function createGeneticAlgorithm() {

        const settings =
            getSettings();


        geneticAlgorithm =
            new GeneticAlgorithm({

                populationSize:
                    settings.populationSize,

                triangleCount:
                    settings.triangleCount,

                mutationsPerChild:
                    settings.mutationsPerChild,

                mutationStrength:
                    settings.mutationStrength,

                /*
                 * A small elite set works well for this
                 * type of evolutionary search.
                 */

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
                 * Sample every second pixel during
                 * evolution.
                 *
                 * This substantially reduces CPU cost.
                 */

                sampleStep:
                    2,

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


        createGeneticAlgorithm();


        /*
         * GeneticAlgorithm.initialise() creates the
         * population itself.
         */

        geneticAlgorithm.initialise();


        /*
         * Apply chosen backgrounds after population
         * creation.
         */

        applyBackgroundToPopulation();


        /*
         * Background changes alter every genome, so the
         * population must be evaluated again.
         */

        geneticAlgorithm
            .evaluatePopulation();


        geneticAlgorithm
            .sortPopulation();


        const genomes =
            geneticAlgorithm
                .getPopulationGenomes();


        geneticAlgorithm.generationBest =
            genomes[0] ?? null;


        /*
         * Reset the all-time best because the population
         * was changed after initialise().
         */

        geneticAlgorithm.bestGenome =
            null;


        geneticAlgorithm.bestFitness =
            -Infinity;


        geneticAlgorithm.bestSimilarity =
            0;


        geneticAlgorithm.bestError =
            Infinity;


        geneticAlgorithm.updateBest(
            geneticAlgorithm
                .generationBest
        );


        lastDisplayedGenome =
            geneticAlgorithm
                .getBestGenome();


        if (lastDisplayedGenome) {

            renderer.render(
                lastDisplayedGenome
            );


            hideCanvasMessage();
        }


        updateStatistics();


        return lastDisplayedGenome;
    }



    /* =====================================================
       START EVOLUTION
       ===================================================== */

    function startEvolution() {

        if (!targetImage.isLoaded()) {

            showCanvasMessage(
                "Target image is still loading."
            );

            return;
        }


        /*
         * First start creates a new population.
         */

        if (
            !geneticAlgorithm ||
            !geneticAlgorithm.isInitialised()
        ) {

            initialiseEvolution();
        }


        if (running) {
            return;
        }


        running =
            true;


        lastFrameTime =
            performance.now();


        updateButtonState();


        hideCanvasMessage();


        animationFrameId =
            requestAnimationFrame(
                evolutionLoop
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
       EVOLUTION LOOP
       ===================================================== */

    function evolutionLoop(
        timestamp
    ) {

        if (!running) {
            return;
        }


        const settings =
            getSettings();


        /*
         * Runtime controls can change without restarting.
         */

        geneticAlgorithm
            .setMutationsPerChild(
                settings.mutationsPerChild
            );


        geneticAlgorithm
            .setMutationStrength(
                settings.mutationStrength
            );


        const frameStart =
            performance.now();


        let generationsCompleted =
            0;


        /*
         * Attempt the requested number of generations but
         * respect a CPU-time budget.
         *
         * This keeps the browser responsive even if the
         * user sets Generations / Frame to 50.
         */

        while (
            generationsCompleted <
            settings.generationsPerFrame
        ) {

            geneticAlgorithm.step();


            generationsCompleted++;


            const elapsed =
                performance.now() -
                frameStart;


            if (
                elapsed >=
                FRAME_BUDGET_MS
            ) {

                break;
            }
        }


        const bestGenome =
            geneticAlgorithm
                .getBestGenome();


        if (bestGenome) {

            renderer.render(
                bestGenome
            );


            lastDisplayedGenome =
                bestGenome;
        }


        updateStatistics();


        lastFrameTime =
            timestamp;


        animationFrameId =
            requestAnimationFrame(
                evolutionLoop
            );
    }



    /* =====================================================
       SINGLE STEP
       ===================================================== */

    function stepEvolution() {

        if (!targetImage.isLoaded()) {
            return;
        }


        stopEvolution();


        if (
            !geneticAlgorithm ||
            !geneticAlgorithm.isInitialised()
        ) {

            initialiseEvolution();

            return;
        }


        geneticAlgorithm.step();


        const bestGenome =
            geneticAlgorithm
                .getBestGenome();


        if (bestGenome) {

            renderer.render(
                bestGenome
            );


            lastDisplayedGenome =
                bestGenome;
        }


        hideCanvasMessage();


        updateStatistics();
    }



    /* =====================================================
       RESET
       ===================================================== */

    function resetEvolution() {

        stopEvolution();


        if (geneticAlgorithm) {

            geneticAlgorithm.reset();
        }


        geneticAlgorithm =
            null;


        lastDisplayedGenome =
            null;


        renderer.clear();


        resetStatisticsDisplay();


        showCanvasMessage(
            "Press Start Evolution to begin."
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
            geneticAlgorithm
                .getStatistics();


        const similarity =
            Number.isFinite(
                stats.bestSimilarity
            )
                ? stats.bestSimilarity
                : 0;


        const fitness =
            Number.isFinite(
                stats.bestFitness
            ) &&
            stats.bestFitness !==
                -Infinity
                ? stats.bestFitness
                : 0;


        const generation =
            Number.isFinite(
                stats.generation
            )
                ? stats.generation
                : 0;


        const attempts =
            Number.isFinite(
                stats.attempts
            )
                ? stats.attempts
                : 0;


        const evaluations =
            Number.isFinite(
                stats.evaluations
            )
                ? stats.evaluations
                : attempts;


        const triangles =
            Number.isFinite(
                stats.triangleCount
            )
                ? stats.triangleCount
                : 0;



        /* ===============================================
           HEADER STATS
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
                triangles
            )
        );



        /* ===============================================
           LARGE STATS
           =============================================== */

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



        /* ===============================================
           PROGRESS BAR
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
       RESET STATISTICS DISPLAY
       ===================================================== */

    function resetStatisticsDisplay() {

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
            getSettings()
                .triangleCount
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


        if (
            elements.similarityBar
        ) {

            elements.similarityBar
                .style.width =
                "0%";
        }
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

    function formatSimilarity(
        value
    ) {

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

    function formatInteger(
        value
    ) {

        if (
            !Number.isFinite(value)
        ) {

            return "0";
        }


        return Math.floor(value)
            .toLocaleString();
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
                    : "Start Evolution";
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
    }



    /* =====================================================
       DOWNLOAD IMAGE
       ===================================================== */

    function downloadImage() {

        if (!lastDisplayedGenome) {

            showCanvasMessage(
                "Start the evolution before saving an image."
            );

            return;
        }


        /*
         * Make absolutely sure the all-time best genome is
         * what gets exported.
         */

        renderer.render(
            lastDisplayedGenome
        );


        renderer.downloadPNG(
            "evolved-mona-lisa.png"
        );
    }



    /* =====================================================
       TARGET IMAGE CHANGED
       ===================================================== */

    async function targetFileChanged(
        event
    ) {

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


            /*
             * Update both target previews.
             */

            targetImage
                .updatePagePreviews();


            /*
             * Give FitnessEvaluator the new target pixels.
             */

            targetImage
                .applyToFitnessEvaluator(
                    fitnessEvaluator
                );


            /*
             * A genome scored against Mona Lisa cannot be
             * compared with a genome scored against a new
             * uploaded image.
             *
             * Therefore target replacement always starts a
             * completely new evolutionary search.
             */

            geneticAlgorithm =
                null;


            lastDisplayedGenome =
                null;


            renderer.clear();


            resetStatisticsDisplay();


            showCanvasMessage(
                "New target loaded. Press Start Evolution."
            );


        } catch (error) {

            console.error(
                "Unable to load target image:",
                error
            );


            showCanvasMessage(
                "Unable to load that image."
            );
        }
    }



    /* =====================================================
       STRUCTURAL PARAMETER CHANGED
       ===================================================== */

    function structuralParameterChanged() {

        updateControlLabels();


        /*
         * Triangle count and population size determine the
         * structure of the current population.
         *
         * They take effect when evolution is restarted.
         *
         * Resetting immediately makes the UI behaviour
         * unambiguous.
         */

        if (
            geneticAlgorithm &&
            geneticAlgorithm.isInitialised()
        ) {

            resetEvolution();
        }
    }



    /* =====================================================
       LIVE PARAMETER CHANGED
       ===================================================== */

    function liveParameterChanged() {

        updateControlLabels();


        if (!geneticAlgorithm) {
            return;
        }


        const settings =
            getSettings();


        geneticAlgorithm
            .setMutationsPerChild(
                settings.mutationsPerChild
            );


        geneticAlgorithm
            .setMutationStrength(
                settings.mutationStrength
            );
    }



    /* =====================================================
       BACKGROUND MODE CHANGED
       ===================================================== */

    function backgroundChanged() {

        /*
         * Background is part of every genome's rendered
         * phenotype, so changing it invalidates all fitness
         * scores.
         */

        if (
            geneticAlgorithm &&
            geneticAlgorithm.isInitialised()
        ) {

            resetEvolution();
        }
    }



    /* =====================================================
       CONNECT CONTROLS
       ===================================================== */

    function connectControls() {


        /* ===============================================
           START
           =============================================== */

        if (
            elements.startButton
        ) {

            elements.startButton
                .addEventListener(
                    "click",
                    startEvolution
                );
        }


        if (
            elements.resumeButton
        ) {

            elements.resumeButton
                .addEventListener(
                    "click",
                    startEvolution
                );
        }



        /* ===============================================
           PAUSE
           =============================================== */

        if (
            elements.pauseButton
        ) {

            elements.pauseButton
                .addEventListener(
                    "click",
                    stopEvolution
                );
        }



        /* ===============================================
           STEP
           =============================================== */

        if (
            elements.stepButton
        ) {

            elements.stepButton
                .addEventListener(
                    "click",
                    stepEvolution
                );
        }



        /* ===============================================
           RESET
           =============================================== */

        if (
            elements.resetButton
        ) {

            elements.resetButton
                .addEventListener(
                    "click",
                    resetEvolution
                );
        }



        /* ===============================================
           DOWNLOAD
           =============================================== */

        if (
            elements.downloadButton
        ) {

            elements.downloadButton
                .addEventListener(
                    "click",
                    downloadImage
                );
        }



        /* ===============================================
           IMAGE UPLOAD
           =============================================== */

        if (
            elements.imageUpload
        ) {

            elements.imageUpload
                .addEventListener(
                    "change",
                    targetFileChanged
                );
        }



        /* ===============================================
           STRUCTURAL CONTROLS
           =============================================== */

        if (
            elements.triangleCount
        ) {

            elements.triangleCount
                .addEventListener(
                    "input",
                    structuralParameterChanged
                );
        }


        if (
            elements.populationSize
        ) {

            elements.populationSize
                .addEventListener(
                    "input",
                    structuralParameterChanged
                );
        }



        /* ===============================================
           LIVE CONTROLS
           =============================================== */

        if (
            elements.mutationsPerChild
        ) {

            elements.mutationsPerChild
                .addEventListener(
                    "input",
                    liveParameterChanged
                );
        }


        if (
            elements.mutationStrength
        ) {

            elements.mutationStrength
                .addEventListener(
                    "input",
                    liveParameterChanged
                );
        }


        if (
            elements.evolutionSpeed
        ) {

            elements.evolutionSpeed
                .addEventListener(
                    "input",
                    updateControlLabels
                );
        }



        /* ===============================================
           BACKGROUND
           =============================================== */

        if (
            elements.backgroundMode
        ) {

            elements.backgroundMode
                .addEventListener(
                    "change",
                    backgroundChanged
                );
        }
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
             * The TargetImage canvas is the authoritative
             * version used by FitnessEvaluator.
             */

            targetImage
                .applyToFitnessEvaluator(
                    fitnessEvaluator
                );


            /*
             * Update both HTML preview images so they show
             * exactly the processed target.
             */

            targetImage
                .updatePagePreviews();


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


    await loadDefaultTarget();



    /*
     * Expose a small debugging API in the browser console.
     *
     * This is useful while developing the project.
     *
     * Example:
     *
     * MonaEvolution.algorithm()
     * MonaEvolution.target
     * MonaEvolution.renderer
     */

    window.MonaEvolution = {

        target:
            targetImage,

        renderer:
            renderer,

        fitnessEvaluator:
            fitnessEvaluator,

        algorithm:
            () =>
                geneticAlgorithm,

        start:
            startEvolution,

        pause:
            stopEvolution,

        step:
            stepEvolution,

        reset:
            resetEvolution

    };


    console.log(
        "Evolve Mona Lisa initialised."
    );

}