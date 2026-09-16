/* =========================================================
   MIDLIFE PROGRAMMER
   Evolve Mona Lisa
   GeneticAlgorithm.js

   Controls the evolutionary search.

   Features:

   - Mixed Triangle / Circle / Dot genomes
   - Fixed shape counts during evolution
   - Tournament selection
   - Elitism
   - Adaptive mutation strength
   - Weighted small / medium / large mutations
   - Error-guided mutation
   - Target-colour guided mutation
   - Progressive fitness resolution
   - Automatic resolution promotion
   - Stagnation detection
   - Avoids re-evaluating unchanged elites
   - Tracks best genome and statistics
   ========================================================= */


class GeneticAlgorithm {


    /* =====================================================
       CONSTRUCTOR
       ===================================================== */

    constructor(options = {}) {

        /* ===============================================
           POPULATION
           =============================================== */

        this.populationSize =
            this.normaliseInteger(
                options.populationSize ?? 30,
                2
            );


        this.triangleCount =
            this.normaliseShapeCount(
                options.triangleCount ?? 100
            );


        this.circleCount =
            this.normaliseShapeCount(
                options.circleCount ?? 40
            );


        this.dotCount =
            this.normaliseShapeCount(
                options.dotCount ?? 25
            );


        /* ===============================================
           MUTATION
           =============================================== */

        this.mutationsPerChild =
            this.normaliseInteger(
                options.mutationsPerChild ?? 2,
                1
            );


        this.mutationStrength =
            this.clamp(
                Number(
                    options.mutationStrength ?? 0.15
                ),
                0.001,
                1
            );


        this.adaptiveMutation =
            options.adaptiveMutation ??
            true;


        this.errorGuidedMutation =
            options.errorGuidedMutation ??
            true;


        /*
         * Probability that a mutation operation uses
         * information from the error map.
         */

        this.errorGuidedChance =
            this.clamp(
                Number(
                    options.errorGuidedChance ?? 0.45
                ),
                0,
                1
            );


        /* ===============================================
           SELECTION
           =============================================== */

        this.eliteCount =
            this.normaliseInteger(
                options.eliteCount ?? 2,
                1
            );


        this.tournamentSize =
            this.normaliseInteger(
                options.tournamentSize ?? 3,
                1
            );


        /* ===============================================
           FITNESS
           =============================================== */

        this.sampleStep =
            this.normaliseInteger(
                options.sampleStep ?? 1,
                1
            );


        this.progressiveResolution =
            options.progressiveResolution ??
            true;


        /*
         * Promotion is primarily driven by stagnation.
         *
         * At low resolution we don't want to spend forever
         * polishing details which the current resolution
         * cannot even represent.
         */

        this.stageMinimumGenerations =
            this.normaliseInteger(
                options.stageMinimumGenerations ?? 40,
                1
            );


        this.stageStagnationLimit =
            this.normaliseInteger(
                options.stageStagnationLimit ?? 80,
                1
            );


        this.stageMaximumGenerations =
            this.normaliseInteger(
                options.stageMaximumGenerations ?? 350,
                1
            );


        /* ===============================================
           EXTERNAL COMPONENTS
           =============================================== */

        this.renderer =
            options.renderer ??
            null;


        this.fitnessEvaluator =
            options.fitnessEvaluator ??
            null;


        /* ===============================================
           POPULATION
           =============================================== */

        this.population =
            null;


        /* ===============================================
           GLOBAL STATISTICS
           =============================================== */

        this.generation =
            0;


        this.attempts =
            0;


        this.improvements =
            0;


        /* ===============================================
           CURRENT GENERATION
           =============================================== */

        this.generationBest =
            null;


        /* ===============================================
           CURRENT-STAGE BEST
           =============================================== */

        this.bestGenome =
            null;


        this.bestFitness =
            -Infinity;


        this.bestSimilarity =
            0;


        this.bestError =
            Infinity;


        /* ===============================================
           PROGRESSIVE STAGE TRACKING
           =============================================== */

        this.stageStartGeneration =
            0;


        this.stageBestFitness =
            -Infinity;


        this.stageLastImprovementGeneration =
            0;


        this.stageImprovements =
            0;


        /* ===============================================
           MUTATION STATISTICS
           =============================================== */

        this.guidedMutations =
            0;


        this.randomMutations =
            0;


        this.smallMutations =
            0;


        this.mediumMutations =
            0;


        this.largeMutations =
            0;


        /* ===============================================
           STATE
           =============================================== */

        this.initialised =
            false;
    }



    /* =====================================================
       CONFIGURATION
       ===================================================== */

    setRenderer(renderer) {

        this.renderer =
            renderer;


        return this;
    }



    setFitnessEvaluator(
        fitnessEvaluator
    ) {

        this.fitnessEvaluator =
            fitnessEvaluator;


        return this;
    }



    setPopulationSize(value) {

        this.populationSize =
            this.normaliseInteger(
                value,
                2
            );


        return this;
    }



    setTriangleCount(value) {

        this.triangleCount =
            this.normaliseShapeCount(
                value
            );


        return this;
    }



    setCircleCount(value) {

        this.circleCount =
            this.normaliseShapeCount(
                value
            );


        return this;
    }



    setDotCount(value) {

        this.dotCount =
            this.normaliseShapeCount(
                value
            );


        return this;
    }



    setShapeCounts(
        triangles,
        circles,
        dots
    ) {

        this.setTriangleCount(
            triangles
        );


        this.setCircleCount(
            circles
        );


        this.setDotCount(
            dots
        );


        return this;
    }



    setMutationsPerChild(value) {

        this.mutationsPerChild =
            this.normaliseInteger(
                value,
                1
            );


        return this;
    }



    setMutationStrength(value) {

        this.mutationStrength =
            this.clamp(
                Number(value),
                0.001,
                1
            );


        return this;
    }



    setAdaptiveMutation(enabled) {

        this.adaptiveMutation =
            Boolean(enabled);


        return this;
    }



    setErrorGuidedMutation(enabled) {

        this.errorGuidedMutation =
            Boolean(enabled);


        return this;
    }



    setProgressiveResolution(enabled) {

        this.progressiveResolution =
            Boolean(enabled);


        if (
            this.fitnessEvaluator &&
            typeof this.fitnessEvaluator
                .setProgressiveEnabled ===
                "function"
        ) {

            this.fitnessEvaluator
                .setProgressiveEnabled(
                    this.progressiveResolution
                );
        }


        return this;
    }



    setSampleStep(value) {

        this.sampleStep =
            this.normaliseInteger(
                value,
                1
            );


        return this;
    }



    /* =====================================================
       INITIALISE
       ===================================================== */

    initialise() {

        this.validateDependencies();


        this.resetRunStatistics();


        /*
         * Configure progressive resolution before any
         * candidate receives a fitness score.
         */

        if (
            typeof this.fitnessEvaluator
                .setProgressiveEnabled ===
            "function"
        ) {

            this.fitnessEvaluator
                .setProgressiveEnabled(
                    this.progressiveResolution
                );
        }


        if (
            typeof this.fitnessEvaluator
                .resetStatistics ===
            "function"
        ) {

            this.fitnessEvaluator
                .resetStatistics();
        }


        this.population =
            this.createPopulation();


        /*
         * Initial random population must all be scored.
         */

        this.evaluatePopulation(
            true
        );


        this.sortPopulation();


        this.generationBest =
            this.getPopulationGenomes()[0] ??
            null;


        this.resetStageTracking();


        this.updateBest(
            this.generationBest
        );


        /*
         * Build one error map for the best candidate.
         *
         * We deliberately do NOT build one for every
         * genome because that would waste a lot of CPU.
         */

        this.refreshErrorMap();


        this.initialised =
            true;


        return this.bestGenome;
    }



    /* =====================================================
       CREATE POPULATION
       ===================================================== */

    createPopulation() {

        const width =
            this.getRendererWidth();


        const height =
            this.getRendererHeight();


        if (
            typeof Population !==
            "undefined"
        ) {

            return new Population({

                populationSize:
                    this.populationSize,

                triangleCount:
                    this.triangleCount,

                circleCount:
                    this.circleCount,

                dotCount:
                    this.dotCount,

                width:
                    width,

                height:
                    height

            });
        }


        /*
         * Fallback if Population.js is unavailable.
         */

        const genomes =
            [];


        for (
            let i = 0;
            i < this.populationSize;
            i++
        ) {

            genomes.push(
                this.createGenome()
            );
        }


        return genomes;
    }



    /* =====================================================
       CREATE GENOME
       ===================================================== */

    createGenome() {

        if (
            typeof Genome ===
            "undefined"
        ) {

            throw new Error(
                "Genome class has not been loaded."
            );
        }


        return new Genome({

            triangleCount:
                this.triangleCount,

            circleCount:
                this.circleCount,

            dotCount:
                this.dotCount,

            width:
                this.getRendererWidth(),

            height:
                this.getRendererHeight()

        });
    }



    /* =====================================================
       GET POPULATION GENOMES
       ===================================================== */

    getPopulationGenomes() {

        if (!this.population) {

            return [];
        }


        if (
            Array.isArray(
                this.population
            )
        ) {

            return this.population;
        }


        if (
            typeof this.population
                .getGenomes ===
            "function"
        ) {

            return (
                this.population
                    .getGenomes() ??
                []
            );
        }


        if (
            Array.isArray(
                this.population.genomes
            )
        ) {

            return this.population.genomes;
        }


        return [];
    }



    /* =====================================================
       SET POPULATION GENOMES
       ===================================================== */

    setPopulationGenomes(genomes) {

        if (
            Array.isArray(
                this.population
            )
        ) {

            this.population =
                genomes;


            return;
        }


        if (
            typeof this.population
                ?.replaceGeneration ===
            "function"
        ) {

            this.population
                .replaceGeneration(
                    genomes
                );


            return;
        }


        if (
            typeof this.population
                ?.setGenomes ===
            "function"
        ) {

            this.population
                .setGenomes(
                    genomes
                );


            return;
        }


        if (this.population) {

            this.population.genomes =
                genomes;


            return;
        }


        this.population =
            genomes;
    }



    /* =====================================================
       EVALUATE POPULATION

       force = false:
           genomes already scored at the current resolution
           are skipped.

       force = true:
           every candidate is evaluated.

       The latter is required after changing progressive
       resolution because old scores are no longer directly
       comparable.
       ===================================================== */

    evaluatePopulation(
        force = false
    ) {

        const genomes =
            this.getPopulationGenomes();


        for (
            const genome of
            genomes
        ) {

            if (
                !force &&
                this.isFitnessCurrent(
                    genome
                )
            ) {

                continue;
            }


            this.evaluateGenome(
                genome
            );
        }


        return genomes;
    }



    /* =====================================================
       EVALUATE GENOME
       ===================================================== */

    evaluateGenome(genome) {

        if (!genome) {

            return null;
        }


        const result =
            this.fitnessEvaluator
                .evaluateGenome(
                    genome,
                    this.renderer,
                    this.sampleStep,
                    false
                );


        this.attempts++;


        genome.fitness =
            result.fitness;


        genome.similarity =
            result.similarity;


        genome.error =
            result.error;


        return result;
    }



    /* =====================================================
       FITNESS CURRENT?
       ===================================================== */

    isFitnessCurrent(genome) {

        if (!genome) {

            return false;
        }


        if (
            typeof this.fitnessEvaluator
                .isGenomeFitnessCurrent ===
            "function"
        ) {

            return this.fitnessEvaluator
                .isGenomeFitnessCurrent(
                    genome
                );
        }


        return Number.isFinite(
            genome.fitness
        );
    }



    /* =====================================================
       INVALIDATE GENOME FITNESS
       ===================================================== */

    invalidateGenome(genome) {

        if (!genome) {
            return;
        }


        if (
            typeof this.fitnessEvaluator
                .invalidateGenome ===
            "function"
        ) {

            this.fitnessEvaluator
                .invalidateGenome(
                    genome
                );


            return;
        }


        if (
            typeof genome
                .invalidateFitness ===
            "function"
        ) {

            genome.invalidateFitness();

        } else {

            genome.fitness =
                undefined;


            genome.similarity =
                undefined;


            genome.error =
                undefined;
        }
    }



    /* =====================================================
       SORT POPULATION
       ===================================================== */

    sortPopulation() {

        if (
            typeof this.population
                ?.sortByFitness ===
            "function"
        ) {

            this.population
                .sortByFitness();


            return;
        }


        const genomes =
            this.getPopulationGenomes();


        genomes.sort(
            (a, b) =>
                this.getFitness(b) -
                this.getFitness(a)
        );
    }



    /* =====================================================
       ADVANCE ONE GENERATION
       ===================================================== */

    step() {

        if (!this.initialised) {

            this.initialise();


            return this.bestGenome;
        }


        let current =
            this.getPopulationGenomes();


        if (
            current.length ===
            0
        ) {

            throw new Error(
                "Population contains no genomes."
            );
        }


        this.sortPopulation();


        current =
            this.getPopulationGenomes();


        /*
         * Error guidance is based on the best image from
         * the current generation.
         */

        this.refreshErrorMap();


        const nextGeneration =
            [];


        /* ===============================================
           ELITISM
           =============================================== */

        const elites =
            Math.min(
                this.eliteCount,
                current.length,
                this.populationSize
            );


        for (
            let i = 0;
            i < elites;
            i++
        ) {

            /*
             * The clone retains its fitness because its
             * genome has not changed.
             */

            nextGeneration.push(
                this.cloneGenome(
                    current[i]
                )
            );
        }



        /* ===============================================
           OFFSPRING
           =============================================== */

        while (
            nextGeneration.length <
            this.populationSize
        ) {

            const parent =
                this.selectParent(
                    current
                );


            const child =
                this.cloneGenome(
                    parent
                );


            this.mutateGenome(
                child
            );


            this.invalidateGenome(
                child
            );


            nextGeneration.push(
                child
            );
        }



        /* ===============================================
           REPLACE POPULATION
           =============================================== */

        this.setPopulationGenomes(
            nextGeneration
        );



        /* ===============================================
           EVALUATE

           Unchanged elites retain their current-stage
           scores and are therefore skipped.
           =============================================== */

        this.evaluatePopulation(
            false
        );


        this.sortPopulation();


        this.generation++;


        this.generationBest =
            this.getPopulationGenomes()[0] ??
            null;



        /* ===============================================
           UPDATE STAGE BEST
           =============================================== */

        const improved =
            this.updateBest(
                this.generationBest
            );


        if (improved) {

            this.stageLastImprovementGeneration =
                this.generation;


            this.stageImprovements++;
        }



        /* ===============================================
           PROGRESSIVE RESOLUTION
           =============================================== */

        if (
            this.shouldAdvanceResolution()
        ) {

            this.advanceResolutionStage();
        }


        return this.bestGenome;
    }



    /* =====================================================
       RUN MULTIPLE GENERATIONS
       ===================================================== */

    runGenerations(count = 1) {

        count =
            this.normaliseInteger(
                count,
                1
            );


        let best =
            this.bestGenome;


        for (
            let i = 0;
            i < count;
            i++
        ) {

            best =
                this.step();
        }


        return best;
    }



    /* =====================================================
       PARENT SELECTION
       ===================================================== */

    selectParent(genomes) {

        if (
            !genomes ||
            genomes.length ===
            0
        ) {

            return null;
        }


        /*
         * Use Population's implementation where available.
         */

        if (
            typeof this.population
                ?.tournamentSelect ===
            "function"
        ) {

            return this.population
                .tournamentSelect(
                    this.tournamentSize
                );
        }


        let winner =
            null;


        let winnerFitness =
            -Infinity;


        for (
            let i = 0;
            i < this.tournamentSize;
            i++
        ) {

            const candidate =
                genomes[
                    Math.floor(
                        Math.random() *
                        genomes.length
                    )
                ];


            const fitness =
                this.getFitness(
                    candidate
                );


            if (
                winner === null ||
                fitness >
                winnerFitness
            ) {

                winner =
                    candidate;


                winnerFitness =
                    fitness;
            }
        }


        return winner ??
            genomes[0];
    }



    /* =====================================================
       CLONE GENOME
       ===================================================== */

    cloneGenome(genome) {

        if (!genome) {

            throw new Error(
                "Cannot clone an empty genome."
            );
        }


        if (
            typeof genome.clone ===
            "function"
        ) {

            return genome.clone();
        }


        if (
            typeof genome.copy ===
            "function"
        ) {

            return genome.copy();
        }


        const clone =
            Object.create(
                Object.getPrototypeOf(
                    genome
                )
            );


        for (
            const key of
            Object.keys(genome)
        ) {

            clone[key] =
                this.deepCloneValue(
                    genome[key]
                );
        }


        return clone;
    }



    /* =====================================================
       DEEP CLONE
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


        const clone =
            Object.create(
                Object.getPrototypeOf(
                    value
                )
            );


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
       MUTATE GENOME

       IMPORTANT:

       Normal evolution deliberately preserves the number
       of triangles, circles and dots.

       We mutate existing shapes or change their layer
       order. We do NOT add/remove shapes here.
       ===================================================== */

    mutateGenome(genome) {

        if (!genome) {
            return;
        }


        const shapes =
            this.getGenomeShapes(
                genome
            );


        if (
            shapes.length ===
            0
        ) {

            return;
        }


        for (
            let i = 0;
            i < this.mutationsPerChild;
            i++
        ) {

            const strength =
                this.chooseMutationStrength();


            const guided =
                this.errorGuidedMutation &&
                this.hasErrorMap() &&
                Math.random() <
                    this.errorGuidedChance;


            if (guided) {

                const success =
                    this.performGuidedMutation(
                        genome,
                        strength
                    );


                if (success) {

                    this.guidedMutations++;

                    continue;
                }
            }


            this.performRandomMutation(
                genome,
                strength
            );


            this.randomMutations++;
        }
    }



    /* =====================================================
       CHOOSE MUTATION STRENGTH

       Mutation scale distribution:

           70% small
           20% medium
           10% large

       Adaptive mutation also reduces the underlying
       mutation magnitude as evolution progresses.
       ===================================================== */

    chooseMutationStrength() {

        const base =
            this.getAdaptiveMutationStrength();


        const random =
            Math.random();


        let multiplier;


        if (
            random <
            0.70
        ) {

            /*
             * Small local adjustment.
             */

            multiplier =
                0.35 +
                Math.random() *
                0.45;


            this.smallMutations++;

        } else if (
            random <
            0.90
        ) {

            /*
             * Medium adjustment.
             */

            multiplier =
                0.9 +
                Math.random() *
                0.7;


            this.mediumMutations++;

        } else {

            /*
             * Occasional large jump to escape a local
             * optimum.
             */

            multiplier =
                1.8 +
                Math.random() *
                1.8;


            this.largeMutations++;
        }


        return this.clamp(
            base *
            multiplier,
            0.001,
            1
        );
    }



    /* =====================================================
       ADAPTIVE MUTATION STRENGTH

       Early evolution:
           large changes

       Middle evolution:
           moderate changes

       Late evolution:
           fine changes

       The user's mutation-strength slider remains the
       baseline and is multiplied by these factors.
       ===================================================== */

    getAdaptiveMutationStrength() {

        if (
            !this.adaptiveMutation
        ) {

            return this.mutationStrength;
        }


        let multiplier;


        const stageProgress =
            this.getResolutionProgress();


        if (
            stageProgress <
            0.25
        ) {

            multiplier =
                1.35;

        } else if (
            stageProgress <
            0.65
        ) {

            multiplier =
                0.75;

        } else {

            multiplier =
                0.30;
        }


        /*
         * If the search has stagnated, temporarily become
         * more adventurous.
         */

        const stagnant =
            this.getStagnationGenerations();


        if (
            stagnant >
            this.stageStagnationLimit *
            0.5
        ) {

            multiplier *=
                1.35;
        }


        return this.clamp(
            this.mutationStrength *
            multiplier,
            0.002,
            0.5
        );
    }



    /* =====================================================
       RANDOM MUTATION
       ===================================================== */

    performRandomMutation(
        genome,
        strength
    ) {

        const shapes =
            this.getGenomeShapes(
                genome
            );


        if (
            shapes.length ===
            0
        ) {

            return false;
        }


        /*
         * Small probability of mutating layer order.
         *
         * This is useful because alpha blending makes the
         * ordering itself part of the solution.
         */

        if (
            shapes.length > 1 &&
            Math.random() <
            0.04
        ) {

            return this.swapRandomLayers(
                shapes
            );
        }


        const shape =
            shapes[
                Math.floor(
                    Math.random() *
                    shapes.length
                )
            ];


        if (
            typeof shape.mutate ===
            "function"
        ) {

            shape.mutate(
                strength
            );


            return true;
        }


        return this.basicShapeMutation(
            shape,
            strength
        );
    }



    /* =====================================================
       ERROR-GUIDED MUTATION
       ===================================================== */

    performGuidedMutation(
        genome,
        strength
    ) {

        if (
            !this.fitnessEvaluator ||
            typeof this.fitnessEvaluator
                .getWeightedErrorPoint !==
                "function"
        ) {

            return false;
        }


        const point =
            this.fitnessEvaluator
                .getWeightedErrorPoint();


        if (!point) {

            return false;
        }


        const targetColour =
            this.getTargetColourNear(
                point.x,
                point.y
            );


        const shapes =
            this.getGenomeShapes(
                genome
            );


        if (
            shapes.length ===
            0
        ) {

            return false;
        }


        /*
         * Prefer a shape that is already reasonably close
         * to the bad region. This makes guided mutation
         * less destructive than selecting any shape from
         * the entire canvas.
         */

        const shape =
            this.selectShapeNearPoint(
                shapes,
                point.x,
                point.y
            );


        if (!shape) {

            return false;
        }


        const type =
            this.getShapeType(
                shape
            );


        /*
         * Different shape families have different jobs:
         *
         * dots:
         *     fine local detail
         *
         * circles:
         *     medium smooth colour regions
         *
         * triangles:
         *     broader structure
         */

        switch (type) {

            case "dot":

                this.guideDot(
                    shape,
                    point,
                    targetColour,
                    strength
                );

                return true;


            case "circle":

                this.guideCircle(
                    shape,
                    point,
                    targetColour,
                    strength
                );

                return true;


            case "triangle":

                this.guideTriangle(
                    shape,
                    point,
                    targetColour,
                    strength
                );

                return true;


            default:

                if (
                    typeof shape.mutate ===
                    "function"
                ) {

                    shape.mutate(
                        strength
                    );


                    return true;
                }

                break;
        }


        return false;
    }



    /* =====================================================
       GUIDE DOT
       ===================================================== */

    guideDot(
        dot,
        point,
        colour,
        strength
    ) {

        /*
         * Usually move a dot very close to the bad pixel.
         */

        if (
            typeof dot.moveNear ===
            "function"
        ) {

            dot.moveNear(
                point.x,
                point.y,
                Math.max(
                    0.005,
                    strength *
                    0.10
                )
            );

        } else {

            this.moveShapeToward(
                dot,
                point.x,
                point.y,
                strength
            );
        }


        this.blendShapeTowardColour(
            dot,
            colour,
            Math.max(
                0.35,
                1 - strength
            )
        );


        /*
         * Occasionally mutate radius/alpha afterwards.
         */

        if (
            Math.random() <
            0.35 &&
            typeof dot.mutateRadius ===
            "function"
        ) {

            dot.mutateRadius(
                strength
            );
        }


        if (
            Math.random() <
            0.20 &&
            typeof dot.mutateAlpha ===
            "function"
        ) {

            dot.mutateAlpha(
                strength
            );
        }
    }



    /* =====================================================
       GUIDE CIRCLE
       ===================================================== */

    guideCircle(
        circle,
        point,
        colour,
        strength
    ) {

        if (
            typeof circle.moveNear ===
            "function"
        ) {

            circle.moveNear(
                point.x,
                point.y,
                Math.max(
                    0.015,
                    strength *
                    0.20
                )
            );

        } else {

            this.moveShapeToward(
                circle,
                point.x,
                point.y,
                strength
            );
        }


        this.blendShapeTowardColour(
            circle,
            colour,
            0.45
        );


        if (
            Math.random() <
            0.45 &&
            typeof circle.mutateRadius ===
            "function"
        ) {

            circle.mutateRadius(
                strength
            );
        }


        if (
            Math.random() <
            0.20 &&
            typeof circle.mutateAlpha ===
            "function"
        ) {

            circle.mutateAlpha(
                strength
            );
        }
    }



    /* =====================================================
       GUIDE TRIANGLE
       ===================================================== */

    guideTriangle(
        triangle,
        point,
        colour,
        strength
    ) {

        const points =
            triangle.points ??
            triangle.vertices;


        if (
            Array.isArray(points) &&
            points.length >= 3
        ) {

            /*
             * Move the triangle's centre toward the error
             * location without collapsing all three points
             * onto the same coordinate.
             */

            let centreX =
                0;


            let centreY =
                0;


            for (
                const vertex of
                points
            ) {

                centreX +=
                    Number(vertex.x) || 0;


                centreY +=
                    Number(vertex.y) || 0;
            }


            centreX /=
                points.length;


            centreY /=
                points.length;


            /*
             * TriangleGene currently uses pixel coordinates.
             */

            const deltaX =
                (
                    point.x -
                    centreX
                ) *
                this.clamp(
                    strength *
                    1.5,
                    0.05,
                    0.65
                );


            const deltaY =
                (
                    point.y -
                    centreY
                ) *
                this.clamp(
                    strength *
                    1.5,
                    0.05,
                    0.65
                );


            for (
                const vertex of
                points
            ) {

                vertex.x =
                    this.clamp(
                        vertex.x +
                        deltaX,
                        0,
                        this.getRendererWidth()
                    );


                vertex.y =
                    this.clamp(
                        vertex.y +
                        deltaY,
                        0,
                        this.getRendererHeight()
                    );
            }
        }


        this.blendShapeTowardColour(
            triangle,
            colour,
            0.35
        );


        /*
         * Give one point a small additional mutation so
         * guided triangles can change shape as well as
         * position.
         */

        if (
            Math.random() <
            0.35 &&
            typeof triangle.mutate ===
            "function"
        ) {

            triangle.mutate(
                strength *
                0.35
            );
        }
    }



    /* =====================================================
       SELECT SHAPE NEAR ERROR POINT
       ===================================================== */

    selectShapeNearPoint(
        shapes,
        x,
        y
    ) {

        if (
            !shapes ||
            shapes.length ===
            0
        ) {

            return null;
        }


        /*
         * Sample several shapes rather than scanning all
         * 165 every mutation.
         */

        const sampleCount =
            Math.min(
                12,
                shapes.length
            );


        let best =
            null;


        let bestDistance =
            Infinity;


        for (
            let i = 0;
            i < sampleCount;
            i++
        ) {

            const shape =
                shapes[
                    Math.floor(
                        Math.random() *
                        shapes.length
                    )
                ];


            const centre =
                this.getShapeCentre(
                    shape
                );


            if (!centre) {
                continue;
            }


            const dx =
                centre.x -
                x;


            const dy =
                centre.y -
                y;


            const distance =
                dx * dx +
                dy * dy;


            if (
                distance <
                bestDistance
            ) {

                best =
                    shape;


                bestDistance =
                    distance;
            }
        }


        return best ??
            shapes[
                Math.floor(
                    Math.random() *
                    shapes.length
                )
            ];
    }



    /* =====================================================
       GET SHAPE CENTRE
       ===================================================== */

    getShapeCentre(shape) {

        if (!shape) {

            return null;
        }


        const type =
            this.getShapeType(
                shape
            );


        if (
            type === "circle" ||
            type === "dot"
        ) {

            return {

                x:
                    Number(shape.x) || 0,

                y:
                    Number(shape.y) || 0

            };
        }


        const points =
            shape.points ??
            shape.vertices;


        if (
            Array.isArray(points) &&
            points.length > 0
        ) {

            let x =
                0;


            let y =
                0;


            for (
                const point of
                points
            ) {

                x +=
                    Number(point.x) || 0;


                y +=
                    Number(point.y) || 0;
            }


            return {

                x:
                    x /
                    points.length,

                y:
                    y /
                    points.length

            };
        }


        return null;
    }



    /* =====================================================
       MOVE SHAPE TOWARD POINT
       ===================================================== */

    moveShapeToward(
        shape,
        x,
        y,
        strength
    ) {

        if (
            !Number.isFinite(shape.x) ||
            !Number.isFinite(shape.y)
        ) {

            return;
        }


        const amount =
            this.clamp(
                strength *
                2,
                0.05,
                0.8
            );


        shape.x +=
            (
                x -
                shape.x
            ) *
            amount;


        shape.y +=
            (
                y -
                shape.y
            ) *
            amount;


        shape.x =
            this.clamp(
                shape.x,
                0,
                this.getRendererWidth()
            );


        shape.y =
            this.clamp(
                shape.y,
                0,
                this.getRendererHeight()
            );
    }



    /* =====================================================
       TARGET COLOUR NEAR POINT
       ===================================================== */

    getTargetColourNear(
        x,
        y
    ) {

        if (
            typeof this.fitnessEvaluator
                .getAverageTargetColourAt ===
            "function"
        ) {

            return this.fitnessEvaluator
                .getAverageTargetColourAt(
                    x,
                    y,
                    2
                );
        }


        if (
            typeof this.fitnessEvaluator
                .getTargetColourAt ===
            "function"
        ) {

            return this.fitnessEvaluator
                .getTargetColourAt(
                    x,
                    y
                );
        }


        return {

            r: 128,
            g: 128,
            b: 128,
            a: 1

        };
    }



    /* =====================================================
       BLEND SHAPE TOWARD TARGET COLOUR
       ===================================================== */

    blendShapeTowardColour(
        shape,
        target,
        amount = 0.5
    ) {

        if (
            !shape ||
            !target
        ) {

            return;
        }


        amount =
            this.clamp(
                amount,
                0,
                1
            );


        /*
         * Direct r/g/b representation used by our current
         * gene classes.
         */

        if (
            Number.isFinite(shape.r) &&
            Number.isFinite(shape.g) &&
            Number.isFinite(shape.b)
        ) {

            shape.r =
                this.mixChannel(
                    shape.r,
                    target.r,
                    amount
                );


            shape.g =
                this.mixChannel(
                    shape.g,
                    target.g,
                    amount
                );


            shape.b =
                this.mixChannel(
                    shape.b,
                    target.b,
                    amount
                );


            return;
        }


        const colour =
            shape.colour ??
            shape.color;


        if (colour) {

            colour.r =
                this.mixChannel(
                    colour.r ?? 0,
                    target.r,
                    amount
                );


            colour.g =
                this.mixChannel(
                    colour.g ?? 0,
                    target.g,
                    amount
                );


            colour.b =
                this.mixChannel(
                    colour.b ?? 0,
                    target.b,
                    amount
                );
        }
    }



    /* =====================================================
       MIX COLOUR CHANNEL
       ===================================================== */

    mixChannel(
        current,
        target,
        amount
    ) {

        return this.clamp(
            Math.round(
                current +
                (
                    target -
                    current
                ) *
                amount
            ),
            0,
            255
        );
    }



    /* =====================================================
       SWAP RANDOM LAYERS
       ===================================================== */

    swapRandomLayers(shapes) {

        if (
            shapes.length <
            2
        ) {

            return false;
        }


        const first =
            Math.floor(
                Math.random() *
                shapes.length
            );


        let second =
            Math.floor(
                Math.random() *
                shapes.length
            );


        if (
            first ===
            second
        ) {

            second =
                (
                    second + 1
                ) %
                shapes.length;
        }


        const temporary =
            shapes[first];


        shapes[first] =
            shapes[second];


        shapes[second] =
            temporary;


        return true;
    }



    /* =====================================================
       BASIC SHAPE MUTATION FALLBACK
       ===================================================== */

    basicShapeMutation(
        shape,
        strength
    ) {

        if (!shape) {

            return false;
        }


        const type =
            this.getShapeType(
                shape
            );


        if (
            type === "triangle"
        ) {

            return this.basicTriangleMutation(
                shape,
                strength
            );
        }


        if (
            type === "circle" ||
            type === "dot"
        ) {

            const mode =
                Math.floor(
                    Math.random() *
                    5
                );


            switch (mode) {

                case 0:

                    shape.x =
                        this.clamp(
                            (
                                Number(shape.x) ||
                                0
                            ) +
                            this.randomSigned() *
                            this.getRendererWidth() *
                            strength,
                            0,
                            this.getRendererWidth()
                        );

                    break;


                case 1:

                    shape.y =
                        this.clamp(
                            (
                                Number(shape.y) ||
                                0
                            ) +
                            this.randomSigned() *
                            this.getRendererHeight() *
                            strength,
                            0,
                            this.getRendererHeight()
                        );

                    break;


                case 2:

                    shape.radius =
                        Math.max(
                            0.25,
                            (
                                Number(
                                    shape.radius
                                ) ||
                                1
                            ) *
                            (
                                1 +
                                this.randomSigned() *
                                strength
                            )
                        );

                    break;


                case 3:

                    this.mutateColour(
                        shape,
                        strength
                    );

                    break;


                default:

                    this.mutateAlpha(
                        shape,
                        strength
                    );

                    break;
            }


            return true;
        }


        return false;
    }



    /* =====================================================
       BASIC TRIANGLE MUTATION
       ===================================================== */

    basicTriangleMutation(
        gene,
        strength
    ) {

        if (!gene) {

            return false;
        }


        const mutationType =
            Math.floor(
                Math.random() *
                5
            );


        switch (
            mutationType
        ) {

            case 0:

                this.mutatePointCoordinate(
                    gene,
                    "x",
                    strength
                );

                break;


            case 1:

                this.mutatePointCoordinate(
                    gene,
                    "y",
                    strength
                );

                break;


            case 2:

                this.mutateColour(
                    gene,
                    strength
                );

                break;


            case 3:

                this.mutateAlpha(
                    gene,
                    strength
                );

                break;


            default:

                this.mutatePointCoordinate(
                    gene,
                    "x",
                    strength
                );


                this.mutatePointCoordinate(
                    gene,
                    "y",
                    strength
                );

                break;
        }


        return true;
    }



    /* =====================================================
       MUTATE POINT COORDINATE
       ===================================================== */

    mutatePointCoordinate(
        gene,
        axis,
        strength
    ) {

        const points =
            gene.points ??
            gene.vertices;


        if (
            !Array.isArray(points) ||
            points.length === 0
        ) {

            return;
        }


        const point =
            points[
                Math.floor(
                    Math.random() *
                    points.length
                )
            ];


        if (
            !Number.isFinite(
                point[axis]
            )
        ) {

            return;
        }


        const scale =
            axis === "x"
                ? this.getRendererWidth()
                : this.getRendererHeight();


        point[axis] =
            this.clamp(
                point[axis] +
                this.randomSigned() *
                strength *
                scale,
                0,
                scale
            );
    }



    /* =====================================================
       MUTATE COLOUR
       ===================================================== */

    mutateColour(
        gene,
        strength
    ) {

        const channel =
            [
                "r",
                "g",
                "b"
            ][
                Math.floor(
                    Math.random() *
                    3
                )
            ];


        const delta =
            this.randomSigned() *
            255 *
            strength;


        if (
            Number.isFinite(
                gene[channel]
            )
        ) {

            gene[channel] =
                this.clamp(
                    gene[channel] +
                    delta,
                    0,
                    255
                );


            return;
        }


        const colour =
            gene.colour ??
            gene.color;


        if (
            colour &&
            Number.isFinite(
                colour[channel]
            )
        ) {

            colour[channel] =
                this.clamp(
                    colour[channel] +
                    delta,
                    0,
                    255
                );
        }
    }



    /* =====================================================
       MUTATE ALPHA
       ===================================================== */

    mutateAlpha(
        gene,
        strength
    ) {

        let container =
            gene;


        let property =
            null;


        if (
            Number.isFinite(
                gene.a
            )
        ) {

            property =
                "a";

        } else if (
            Number.isFinite(
                gene.alpha
            )
        ) {

            property =
                "alpha";

        } else if (
            Number.isFinite(
                gene.opacity
            )
        ) {

            property =
                "opacity";

        } else {

            const colour =
                gene.colour ??
                gene.color;


            if (
                colour &&
                Number.isFinite(
                    colour.a
                )
            ) {

                container =
                    colour;


                property =
                    "a";
            }
        }


        if (!property) {

            return;
        }


        const maximum =
            container[property] >
            1
                ? 255
                : 1;


        container[property] =
            this.clamp(
                container[property] +
                this.randomSigned() *
                strength *
                maximum,
                0,
                maximum
            );
    }



    /* =====================================================
       GET GENOME SHAPES
       ===================================================== */

    getGenomeShapes(genome) {

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

            return (
                genome.getGenes() ??
                []
            );
        }


        /*
         * Legacy triangle-only genome.
         */

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
       LEGACY NAME
       ===================================================== */

    getGenomeGenes(genome) {

        return this.getGenomeShapes(
            genome
        );
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
       ERROR MAP
       ===================================================== */

    refreshErrorMap() {

        if (
            !this.errorGuidedMutation ||
            !this.generationBest
        ) {

            return;
        }


        if (
            typeof this.fitnessEvaluator
                .buildErrorMapForGenome !==
            "function"
        ) {

            return;
        }


        /*
         * This performs one additional evaluation of the
         * current best genome, but gives all offspring in
         * the next generation useful spatial guidance.
         */

        this.fitnessEvaluator
            .buildErrorMapForGenome(
                this.generationBest,
                this.renderer
            );


        this.attempts++;
    }



    hasErrorMap() {

        return Boolean(
            this.fitnessEvaluator &&
            typeof this.fitnessEvaluator
                .hasErrorMap ===
                "function" &&
            this.fitnessEvaluator
                .hasErrorMap()
        );
    }



    /* =====================================================
       PROGRESSIVE RESOLUTION PROMOTION
       ===================================================== */

    shouldAdvanceResolution() {

        if (
            !this.progressiveResolution
        ) {

            return false;
        }


        if (
            !this.fitnessEvaluator ||
            typeof this.fitnessEvaluator
                .advanceStage !==
                "function"
        ) {

            return false;
        }


        if (
            typeof this.fitnessEvaluator
                .isFinalStage ===
                "function" &&
            this.fitnessEvaluator
                .isFinalStage()
        ) {

            return false;
        }


        const generationsAtStage =
            this.generation -
            this.stageStartGeneration;


        if (
            generationsAtStage <
            this.stageMinimumGenerations
        ) {

            return false;
        }


        const stagnant =
            this.getStagnationGenerations();


        if (
            stagnant >=
            this.stageStagnationLimit
        ) {

            return true;
        }


        if (
            generationsAtStage >=
            this.stageMaximumGenerations
        ) {

            return true;
        }


        return false;
    }



    /* =====================================================
       ADVANCE RESOLUTION
       ===================================================== */

    advanceResolutionStage() {

        const advanced =
            this.fitnessEvaluator
                .advanceStage();


        if (!advanced) {

            return false;
        }


        /*
         * Fitness from the previous resolution cannot be
         * compared directly with fitness at the new stage.

         * Therefore EVERY genome, including elites, must
         * be evaluated once at the new resolution.
         */

        const genomes =
            this.getPopulationGenomes();


        for (
            const genome of
            genomes
        ) {

            this.invalidateGenome(
                genome
            );
        }


        this.evaluatePopulation(
            true
        );


        this.sortPopulation();


        this.generationBest =
            this.getPopulationGenomes()[0] ??
            null;


        /*
         * Reset "all-time best" for this new scoring scale.
         *
         * The actual genome from the previous stage remains
         * in the population through elitism, so it gets a
         * fair score at the new resolution.
         */

        this.bestGenome =
            null;


        this.bestFitness =
            -Infinity;


        this.bestSimilarity =
            0;


        this.bestError =
            Infinity;


        this.resetStageTracking();


        this.updateBest(
            this.generationBest
        );


        this.refreshErrorMap();


        return true;
    }



    /* =====================================================
       RESET STAGE TRACKING
       ===================================================== */

    resetStageTracking() {

        this.stageStartGeneration =
            this.generation;


        this.stageLastImprovementGeneration =
            this.generation;


        this.stageImprovements =
            0;


        this.stageBestFitness =
            -Infinity;
    }



    /* =====================================================
       STAGNATION
       ===================================================== */

    getStagnationGenerations() {

        return Math.max(
            0,
            this.generation -
            this.stageLastImprovementGeneration
        );
    }



    /* =====================================================
       RESOLUTION PROGRESS

       Returns approximately 0 -> 1.

       Used by adaptive mutation.
       ===================================================== */

    getResolutionProgress() {

        if (
            !this.fitnessEvaluator
        ) {

            return 0;
        }


        const count =
            typeof this.fitnessEvaluator
                .getStageCount ===
                "function"
                ? this.fitnessEvaluator
                    .getStageCount()
                : 1;


        const index =
            typeof this.fitnessEvaluator
                .getStageIndex ===
                "function"
                ? this.fitnessEvaluator
                    .getStageIndex()
                : 0;


        if (
            count <= 1
        ) {

            /*
             * If progressive mode is disabled, use
             * generation count as a rough refinement
             * measure.
             */

            return this.clamp(
                this.generation /
                1000,
                0,
                1
            );
        }


        return this.clamp(
            index /
            (
                count - 1
            ),
            0,
            1
        );
    }



    /* =====================================================
       UPDATE BEST
       ===================================================== */

    updateBest(candidate) {

        if (!candidate) {

            return false;
        }


        const fitness =
            this.getFitness(
                candidate
            );


        if (
            fitness <=
            this.bestFitness
        ) {

            return false;
        }


        this.bestGenome =
            this.cloneGenome(
                candidate
            );


        this.bestFitness =
            fitness;


        this.bestSimilarity =
            Number.isFinite(
                candidate.similarity
            )
                ? candidate.similarity
                : 0;


        this.bestError =
            Number.isFinite(
                candidate.error
            )
                ? candidate.error
                : Infinity;


        this.stageBestFitness =
            fitness;


        this.improvements++;


        return true;
    }



    /* =====================================================
       RESET
       ===================================================== */

    reset() {

        this.population =
            null;


        this.resetRunStatistics();


        this.initialised =
            false;


        if (
            this.fitnessEvaluator &&
            typeof this.fitnessEvaluator
                .resetStatistics ===
                "function"
        ) {

            this.fitnessEvaluator
                .resetStatistics();
        }


        return this;
    }



    /* =====================================================
       RESET RUN STATISTICS
       ===================================================== */

    resetRunStatistics() {

        this.generation =
            0;


        this.attempts =
            0;


        this.improvements =
            0;


        this.generationBest =
            null;


        this.bestGenome =
            null;


        this.bestFitness =
            -Infinity;


        this.bestSimilarity =
            0;


        this.bestError =
            Infinity;


        this.stageStartGeneration =
            0;


        this.stageBestFitness =
            -Infinity;


        this.stageLastImprovementGeneration =
            0;


        this.stageImprovements =
            0;


        this.guidedMutations =
            0;


        this.randomMutations =
            0;


        this.smallMutations =
            0;


        this.mediumMutations =
            0;


        this.largeMutations =
            0;
    }



    /* =====================================================
       GETTERS
       ===================================================== */

    getGeneration() {

        return this.generation;
    }



    getAttempts() {

        return this.attempts;
    }



    getEvaluationCount() {

        if (
            this.fitnessEvaluator &&
            typeof this.fitnessEvaluator
                .getEvaluationCount ===
                "function"
        ) {

            return this.fitnessEvaluator
                .getEvaluationCount();
        }


        return this.attempts;
    }



    getImprovements() {

        return this.improvements;
    }



    getBestGenome() {

        return this.bestGenome;
    }



    getGenerationBest() {

        return this.generationBest;
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



    getCurrentMutationStrength() {

        return this.getAdaptiveMutationStrength();
    }



    /* =====================================================
       STATUS
       ===================================================== */

    isInitialised() {

        return this.initialised;
    }



    /* =====================================================
       STATISTICS
       ===================================================== */

    getStatistics() {

        const shapes =
            this.bestGenome
                ? this.getGenomeShapes(
                    this.bestGenome
                )
                : [];


        const counts =
            this.countShapeTypes(
                shapes
            );


        const resolution =
            this.fitnessEvaluator &&
            typeof this.fitnessEvaluator
                .getCurrentResolution ===
                "function"
                ? this.fitnessEvaluator
                    .getCurrentResolution()
                : {
                    width:
                        this.getRendererWidth(),

                    height:
                        this.getRendererHeight()
                };


        return {

            generation:
                this.generation,

            attempts:
                this.attempts,

            evaluations:
                this.getEvaluationCount(),

            improvements:
                this.improvements,


            /* ===========================================
               FITNESS
               =========================================== */

            bestFitness:
                this.bestFitness,

            bestSimilarity:
                this.bestSimilarity,

            bestError:
                this.bestError,


            /* ===========================================
               SHAPES
               =========================================== */

            triangleCount:
                this.bestGenome
                    ? counts.triangles
                    : this.triangleCount,

            circleCount:
                this.bestGenome
                    ? counts.circles
                    : this.circleCount,

            dotCount:
                this.bestGenome
                    ? counts.dots
                    : this.dotCount,

            shapeCount:
                this.bestGenome
                    ? shapes.length
                    :
                    this.triangleCount +
                    this.circleCount +
                    this.dotCount,


            /* ===========================================
               MUTATION
               =========================================== */

            mutationStrength:
                this.getAdaptiveMutationStrength(),

            adaptiveMutation:
                this.adaptiveMutation,

            errorGuidedMutation:
                this.errorGuidedMutation,

            guidedMutations:
                this.guidedMutations,

            randomMutations:
                this.randomMutations,

            smallMutations:
                this.smallMutations,

            mediumMutations:
                this.mediumMutations,

            largeMutations:
                this.largeMutations,


            /* ===========================================
               PROGRESSIVE RESOLUTION
               =========================================== */

            progressiveResolution:
                this.progressiveResolution,

            resolutionWidth:
                resolution.width,

            resolutionHeight:
                resolution.height,

            resolution:
                (
                    resolution.width +
                    " × " +
                    resolution.height
                ),

            stage:
                this.fitnessEvaluator &&
                typeof this.fitnessEvaluator
                    .getStageIndex ===
                    "function"
                    ? this.fitnessEvaluator
                        .getStageIndex()
                    : 0,

            stageNumber:
                this.fitnessEvaluator &&
                typeof this.fitnessEvaluator
                    .getStageNumber ===
                    "function"
                    ? this.fitnessEvaluator
                        .getStageNumber()
                    : 1,

            stageCount:
                this.fitnessEvaluator &&
                typeof this.fitnessEvaluator
                    .getStageCount ===
                    "function"
                    ? this.fitnessEvaluator
                        .getStageCount()
                    : 1,

            stagnation:
                this.getStagnationGenerations()

        };
    }



    /* =====================================================
       COUNT SHAPE TYPES
       ===================================================== */

    countShapeTypes(shapes) {

        const result = {

            triangles: 0,
            circles: 0,
            dots: 0

        };


        for (
            const shape of
            shapes
        ) {

            switch (
                this.getShapeType(
                    shape
                )
            ) {

                case "triangle":

                    result.triangles++;

                    break;


                case "circle":

                    result.circles++;

                    break;


                case "dot":

                    result.dots++;

                    break;
            }
        }


        return result;
    }



    /* =====================================================
       GET FITNESS
       ===================================================== */

    getFitness(genome) {

        if (
            genome &&
            Number.isFinite(
                genome.fitness
            )
        ) {

            return genome.fitness;
        }


        return -Infinity;
    }



    /* =====================================================
       RENDERER DIMENSIONS
       ===================================================== */

    getRendererWidth() {

        if (
            Number.isFinite(
                this.renderer?.width
            )
        ) {

            return this.renderer.width;
        }


        if (
            typeof this.renderer
                ?.getWidth ===
            "function"
        ) {

            return this.renderer
                .getWidth();
        }


        return 480;
    }



    getRendererHeight() {

        if (
            Number.isFinite(
                this.renderer?.height
            )
        ) {

            return this.renderer.height;
        }


        if (
            typeof this.renderer
                ?.getHeight ===
            "function"
        ) {

            return this.renderer
                .getHeight();
        }


        return 715;
    }



    /* =====================================================
       VALIDATE DEPENDENCIES
       ===================================================== */

    validateDependencies() {

        if (!this.renderer) {

            throw new Error(
                "GeneticAlgorithm requires an EvolutionRenderer."
            );
        }


        if (!this.fitnessEvaluator) {

            throw new Error(
                "GeneticAlgorithm requires a FitnessEvaluator."
            );
        }


        if (
            typeof Genome ===
            "undefined"
        ) {

            throw new Error(
                "Genome.js must be loaded before GeneticAlgorithm.js."
            );
        }


        if (
            !this.fitnessEvaluator
                .hasTarget?.()
        ) {

            throw new Error(
                "FitnessEvaluator has no target image."
            );
        }
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
            Math.floor(value)
        );
    }



    /* =====================================================
       NORMALISE SHAPE COUNT

       Zero is intentionally allowed.
       ===================================================== */

    normaliseShapeCount(value) {

        return this.normaliseInteger(
            value,
            0
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