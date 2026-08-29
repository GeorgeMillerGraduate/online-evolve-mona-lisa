/* =========================================================
   MIDLIFE PROGRAMMER
   Evolve Mona Lisa
   GeneticAlgorithm.js

   Controls the evolutionary search.

   Responsibilities:

   - Initialise the population
   - Evaluate candidate genomes
   - Rank candidates by fitness
   - Preserve elite genomes
   - Select parents
   - Clone and mutate offspring
   - Advance generations
   - Track the best genome found
   - Track generations and attempts
   ========================================================= */


class GeneticAlgorithm {


    /* =====================================================
       CONSTRUCTOR
       ===================================================== */

    constructor(options = {}) {

        this.populationSize =
            options.populationSize ?? 30;

        this.triangleCount =
            options.triangleCount ?? 100;

        this.mutationsPerChild =
            options.mutationsPerChild ?? 2;

        this.mutationStrength =
            options.mutationStrength ?? 0.15;

        this.eliteCount =
            options.eliteCount ?? 2;

        this.tournamentSize =
            options.tournamentSize ?? 3;

        this.sampleStep =
            options.sampleStep ?? 2;


        /*
         * External components.
         */

        this.renderer =
            options.renderer ?? null;

        this.fitnessEvaluator =
            options.fitnessEvaluator ?? null;


        /*
         * Population container.
         */

        this.population =
            null;


        /*
         * Evolution statistics.
         */

        this.generation =
            0;

        this.attempts =
            0;

        this.improvements =
            0;


        /*
         * Best candidate in current generation.
         */

        this.generationBest =
            null;


        /*
         * Best candidate discovered during the entire run.
         */

        this.bestGenome =
            null;

        this.bestFitness =
            -Infinity;

        this.bestSimilarity =
            0;

        this.bestError =
            Infinity;


        /*
         * State.
         */

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
            Math.max(
                2,
                Math.floor(value)
            );
    }



    setTriangleCount(value) {

        this.triangleCount =
            Math.max(
                1,
                Math.floor(value)
            );
    }



    setMutationsPerChild(value) {

        this.mutationsPerChild =
            Math.max(
                1,
                Math.floor(value)
            );
    }



    setMutationStrength(value) {

        this.mutationStrength =
            this.clamp(
                value,
                0.001,
                1
            );
    }



    setSampleStep(value) {

        this.sampleStep =
            Math.max(
                1,
                Math.floor(value)
            );
    }



    /* =====================================================
       INITIALISE
       ===================================================== */

    initialise() {

        this.validateDependencies();


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


        /*
         * FitnessEvaluator also keeps its own statistics.
         */

        if (
            typeof this.fitnessEvaluator
                .resetStatistics ===
            "function"
        ) {

            this.fitnessEvaluator
                .resetStatistics();
        }


        /*
         * Build initial population.
         */

        this.population =
            this.createPopulation();


        /*
         * Score every random candidate.
         */

        this.evaluatePopulation();


        /*
         * Sort strongest first.
         */

        this.sortPopulation();


        this.generationBest =
            this.getPopulationGenomes()[0] ??
            null;


        this.updateBest(
            this.generationBest
        );


        this.initialised =
            true;


        return this.bestGenome;
    }



    /* =====================================================
       CREATE POPULATION
       ===================================================== */

    createPopulation() {

        /*
         * Prefer the Population class if it supports
         * the expected constructor.
         */

        if (
            typeof Population !==
            "undefined"
        ) {

            try {

                return new Population(
                    this.populationSize,
                    this.triangleCount,
                    this.renderer.width,
                    this.renderer.height
                );

            } catch (error) {

                /*
                 * Population may use a different constructor.
                 * Try an options object.
                 */

                try {

                    return new Population({

                        size:
                            this.populationSize,

                        populationSize:
                            this.populationSize,

                        triangleCount:
                            this.triangleCount,

                        width:
                            this.renderer.width,

                        height:
                            this.renderer.height

                    });

                } catch (ignored) {

                    /*
                     * Fall through to basic array population.
                     */

                }
            }
        }


        /*
         * Fallback population representation.
         */

        const genomes = [];


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


        /*
         * First try positional constructor.
         */

        try {

            return new Genome(
                this.triangleCount,
                this.renderer.width,
                this.renderer.height
            );

        } catch (error) {

            /*
             * Then try options object.
             */

            return new Genome({

                triangleCount:
                    this.triangleCount,

                width:
                    this.renderer.width,

                height:
                    this.renderer.height

            });
        }
    }



    /* =====================================================
       GET POPULATION GENOMES
       ===================================================== */

    getPopulationGenomes() {

        if (!this.population) {

            return [];
        }


        /*
         * Population itself may simply be an array.
         */

        if (
            Array.isArray(
                this.population
            )
        ) {

            return this.population;
        }


        /*
         * Common Population representations.
         */

        if (
            Array.isArray(
                this.population.genomes
            )
        ) {

            return this.population.genomes;
        }


        if (
            Array.isArray(
                this.population.individuals
            )
        ) {

            return this.population.individuals;
        }


        if (
            Array.isArray(
                this.population.members
            )
        ) {

            return this.population.members;
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
            Array.isArray(
                this.population.genomes
            )
        ) {

            this.population.genomes =
                genomes;

            return;
        }


        if (
            Array.isArray(
                this.population.individuals
            )
        ) {

            this.population.individuals =
                genomes;

            return;
        }


        if (
            Array.isArray(
                this.population.members
            )
        ) {

            this.population.members =
                genomes;

            return;
        }


        if (
            typeof this.population
                .setGenomes ===
            "function"
        ) {

            this.population
                .setGenomes(
                    genomes
                );

            return;
        }


        /*
         * Last-resort representation.
         */

        this.population = genomes;
    }



    /* =====================================================
       EVALUATE POPULATION
       ===================================================== */

    evaluatePopulation() {

        const genomes =
            this.getPopulationGenomes();


        for (
            let i = 0;
            i < genomes.length;
            i++
        ) {

            this.evaluateGenome(
                genomes[i]
            );
        }
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
                    this.sampleStep
                );


        this.attempts++;


        /*
         * FitnessEvaluator already writes these values,
         * but explicitly setting them here keeps the
         * contract clear.
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
       SORT POPULATION
       ===================================================== */

    sortPopulation() {

        const genomes =
            this.getPopulationGenomes();


        genomes.sort(
            (a, b) => {

                const fitnessA =
                    Number.isFinite(
                        a?.fitness
                    )
                        ? a.fitness
                        : -Infinity;


                const fitnessB =
                    Number.isFinite(
                        b?.fitness
                    )
                        ? b.fitness
                        : -Infinity;


                return (
                    fitnessB -
                    fitnessA
                );
            }
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


        const current =
            this.getPopulationGenomes();


        if (
            current.length === 0
        ) {

            throw new Error(
                "Population contains no genomes."
            );
        }


        this.sortPopulation();


        const nextGeneration =
            [];


        /* ===============================================
           ELITISM

           Keep a small number of the strongest genomes
           unchanged.
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


            /*
             * Fitness inherited from the parent is no
             * longer valid after mutation.
             */

            child.fitness =
                undefined;

            child.similarity =
                undefined;

            child.error =
                undefined;


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
           =============================================== */

        this.evaluatePopulation();


        this.sortPopulation();


        this.generation++;


        this.generationBest =
            this.getPopulationGenomes()[0] ??
            null;


        this.updateBest(
            this.generationBest
        );


        return this.bestGenome;
    }



    /* =====================================================
       RUN MULTIPLE GENERATIONS
       ===================================================== */

    runGenerations(count = 1) {

        count =
            Math.max(
                1,
                Math.floor(count)
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

        /*
         * Tournament selection.
         *
         * Randomly choose several candidates and return
         * the strongest one.
         */

        let winner =
            null;


        for (
            let i = 0;
            i < this.tournamentSize;
            i++
        ) {

            const index =
                Math.floor(
                    Math.random() *
                    genomes.length
                );


            const candidate =
                genomes[index];


            if (
                !winner ||
                (
                    candidate.fitness ??
                    -Infinity
                ) >
                (
                    winner.fitness ??
                    -Infinity
                )
            ) {

                winner =
                    candidate;
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


        /*
         * Preferred implementation.
         */

        if (
            typeof genome.clone ===
            "function"
        ) {

            return genome.clone();
        }


        /*
         * Alternative naming.
         */

        if (
            typeof genome.copy ===
            "function"
        ) {

            return genome.copy();
        }


        /*
         * Generic deep clone preserving the Genome
         * prototype where possible.
         */

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
       ===================================================== */

    mutateGenome(genome) {

        /*
         * Preferred Genome API:
         *
         * genome.mutate(count, strength)
         */

        if (
            typeof genome.mutate ===
            "function"
        ) {

            genome.mutate(
                this.mutationsPerChild,
                this.mutationStrength
            );

            return;
        }


        /*
         * Otherwise mutate individual genes.
         */

        const genes =
            this.getGenomeGenes(
                genome
            );


        if (
            genes.length === 0
        ) {

            return;
        }


        for (
            let i = 0;
            i < this.mutationsPerChild;
            i++
        ) {

            const index =
                Math.floor(
                    Math.random() *
                    genes.length
                );


            const gene =
                genes[index];


            if (
                typeof gene.mutate ===
                "function"
            ) {

                gene.mutate(
                    this.mutationStrength
                );

            } else {

                this.basicTriangleMutation(
                    gene
                );
            }
        }
    }



    /* =====================================================
       GET GENOME GENES
       ===================================================== */

    getGenomeGenes(genome) {

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
            typeof genome.getGenes ===
            "function"
        ) {

            return (
                genome.getGenes() ??
                []
            );
        }


        if (
            typeof genome.getTriangles ===
            "function"
        ) {

            return (
                genome.getTriangles() ??
                []
            );
        }


        return [];
    }



    /* =====================================================
       BASIC TRIANGLE MUTATION FALLBACK
       ===================================================== */

    basicTriangleMutation(gene) {

        if (!gene) {
            return;
        }


        /*
         * This is only a fallback for TriangleGene
         * implementations without their own mutate()
         * method.
         */

        const mutationType =
            Math.floor(
                Math.random() * 5
            );


        switch (mutationType) {


            /* ===========================================
               X COORDINATE
               =========================================== */

            case 0:

                this.mutatePointCoordinate(
                    gene,
                    "x"
                );

                break;



            /* ===========================================
               Y COORDINATE
               =========================================== */

            case 1:

                this.mutatePointCoordinate(
                    gene,
                    "y"
                );

                break;



            /* ===========================================
               RGB
               =========================================== */

            case 2:

                this.mutateColour(
                    gene
                );

                break;



            /* ===========================================
               ALPHA
               =========================================== */

            case 3:

                this.mutateAlpha(
                    gene
                );

                break;



            /* ===========================================
               ENTIRE POINT
               =========================================== */

            default:

                this.mutatePoint(
                    gene
                );

                break;
        }
    }



    /* =====================================================
       MUTATE POINT COORDINATE
       ===================================================== */

    mutatePointCoordinate(
        gene,
        axis
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


        const normalised =
            point[axis] >= 0 &&
            point[axis] <= 1;


        const scale =
            normalised
                ? 1
                : (
                    axis === "x"
                        ? this.renderer.width
                        : this.renderer.height
                );


        const change =
            (
                Math.random() * 2 -
                1
            ) *
            this.mutationStrength *
            scale;


        point[axis] +=
            change;


        point[axis] =
            this.clamp(
                point[axis],
                0,
                scale
            );
    }



    /* =====================================================
       MUTATE WHOLE POINT
       ===================================================== */

    mutatePoint(gene) {

        this.mutatePointCoordinate(
            gene,
            "x"
        );


        this.mutatePointCoordinate(
            gene,
            "y"
        );
    }



    /* =====================================================
       MUTATE COLOUR
       ===================================================== */

    mutateColour(gene) {

        const amount =
            255 *
            this.mutationStrength;


        const channel =
            Math.floor(
                Math.random() * 3
            );


        const delta =
            (
                Math.random() * 2 -
                1
            ) *
            amount;


        const properties = [
            "r",
            "g",
            "b"
        ];


        const property =
            properties[channel];


        /*
         * Direct r/g/b representation.
         */

        if (
            Number.isFinite(
                gene[property]
            )
        ) {

            gene[property] =
                this.clamp(
                    gene[property] +
                    delta,
                    0,
                    255
                );

            return;
        }


        /*
         * colour object.
         */

        const colour =
            gene.colour ??
            gene.color;


        if (
            colour &&
            Number.isFinite(
                colour[property]
            )
        ) {

            colour[property] =
                this.clamp(
                    colour[property] +
                    delta,
                    0,
                    255
                );
        }
    }



    /* =====================================================
       MUTATE ALPHA
       ===================================================== */

    mutateAlpha(gene) {

        let property =
            null;


        if (
            Number.isFinite(
                gene.a
            )
        ) {

            property = "a";

        } else if (
            Number.isFinite(
                gene.alpha
            )
        ) {

            property = "alpha";

        } else if (
            Number.isFinite(
                gene.opacity
            )
        ) {

            property = "opacity";
        }


        if (property) {

            const current =
                gene[property];


            const maximum =
                current > 1
                    ? 255
                    : 1;


            gene[property] =
                this.clamp(
                    current +
                    (
                        Math.random() * 2 -
                        1
                    ) *
                    this.mutationStrength *
                    maximum,
                    0,
                    maximum
                );


            return;
        }


        /*
         * Alpha inside colour object.
         */

        const colour =
            gene.colour ??
            gene.color;


        if (
            colour &&
            Number.isFinite(
                colour.a
            )
        ) {

            const maximum =
                colour.a > 1
                    ? 255
                    : 1;


            colour.a =
                this.clamp(
                    colour.a +
                    (
                        Math.random() * 2 -
                        1
                    ) *
                    this.mutationStrength *
                    maximum,
                    0,
                    maximum
                );
        }
    }



    /* =====================================================
       UPDATE ALL-TIME BEST
       ===================================================== */

    updateBest(candidate) {

        if (!candidate) {
            return false;
        }


        const fitness =
            candidate.fitness ??
            -Infinity;


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
            candidate.similarity ??
            0;


        this.bestError =
            candidate.error ??
            Infinity;


        this.improvements++;


        return true;
    }



    /* =====================================================
       RESET
       ===================================================== */

    reset() {

        this.population =
            null;


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
    }



    /* =====================================================
       STATISTICS
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



    /* =====================================================
       STATUS
       ===================================================== */

    isInitialised() {

        return this.initialised;
    }



    getStatistics() {

        return {

            generation:
                this.generation,

            attempts:
                this.attempts,

            evaluations:
                this.getEvaluationCount(),

            improvements:
                this.improvements,

            bestFitness:
                this.bestFitness,

            bestSimilarity:
                this.bestSimilarity,

            bestError:
                this.bestError,

            triangleCount:
                this.bestGenome
                    ? this.getGenomeGenes(
                        this.bestGenome
                    ).length
                    : this.triangleCount

        };
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