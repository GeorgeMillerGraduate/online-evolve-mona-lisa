/* =========================================================
   MIDLIFE PROGRAMMER
   Evolve Mona Lisa
   Population.js

   Represents a collection of candidate Genome objects.

   Each Genome contains a configurable mixture of:

   - TriangleGene
   - CircleGene
   - DotGene

   Responsibilities:

   - Create the initial population
   - Store genomes
   - Sort genomes by fitness
   - Retrieve best / worst genomes
   - Tournament selection
   - Replace generations
   - Resize / reset population
   - Calculate population statistics
   ========================================================= */


class Population {


    /* =====================================================
       CONSTRUCTOR
       ===================================================== */

    constructor(
        populationSize = 30,
        triangleCount = 100,
        circleCount = 40,
        dotCount = 25,
        width = 480,
        height = 715
    ) {

        /*
         * Preferred form:
         *
         * new Population({
         *     populationSize: 30,
         *     triangleCount: 100,
         *     circleCount: 40,
         *     dotCount: 25,
         *     width: 480,
         *     height: 715
         * });
         */

        if (
            typeof populationSize ===
            "object"
        ) {

            const options =
                populationSize;


            populationSize =
                options.populationSize ??
                options.size ??
                30;


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


        this.populationSize =
            this.normalisePopulationSize(
                populationSize
            );


        this.triangleCount =
            this.normaliseShapeCount(
                triangleCount
            );


        this.circleCount =
            this.normaliseShapeCount(
                circleCount
            );


        this.dotCount =
            this.normaliseShapeCount(
                dotCount
            );


        this.width =
            this.normaliseDimension(
                width
            );


        this.height =
            this.normaliseDimension(
                height
            );


        /*
         * Main collection.
         */

        this.genomes = [];


        this.createInitialPopulation();
    }



    /* =====================================================
       CREATE INITIAL POPULATION
       ===================================================== */

    createInitialPopulation() {

        this.genomes = [];


        for (
            let i = 0;
            i < this.populationSize;
            i++
        ) {

            this.genomes.push(
                this.createGenome()
            );
        }


        return this.genomes;
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
                "Genome.js must be loaded before Population.js."
            );
        }


        /*
         * Use the options-object form.
         *
         * This avoids ambiguity now that Genome has several
         * different shape counts.
         */

        return new Genome({

            triangleCount:
                this.triangleCount,

            circleCount:
                this.circleCount,

            dotCount:
                this.dotCount,

            width:
                this.width,

            height:
                this.height

        });
    }



    /* =====================================================
       GET GENOMES
       ===================================================== */

    getGenomes() {

        return this.genomes;
    }



    /* =====================================================
       SET GENOMES
       ===================================================== */

    setGenomes(genomes) {

        if (
            !Array.isArray(genomes)
        ) {

            throw new Error(
                "Population.setGenomes() requires an array."
            );
        }


        this.genomes =
            genomes;


        this.populationSize =
            genomes.length;


        /*
         * If possible, update our configured shape counts
         * from the first Genome.
         */

        if (
            genomes.length > 0
        ) {

            this.updateCountsFromGenome(
                genomes[0]
            );
        }


        return this;
    }



    /* =====================================================
       UPDATE CONFIGURATION FROM GENOME
       ===================================================== */

    updateCountsFromGenome(genome) {

        if (!genome) {
            return this;
        }


        if (
            typeof genome.getTriangleCount ===
            "function"
        ) {

            this.triangleCount =
                genome.getTriangleCount();
        }


        if (
            typeof genome.getCircleCount ===
            "function"
        ) {

            this.circleCount =
                genome.getCircleCount();
        }


        if (
            typeof genome.getDotCount ===
            "function"
        ) {

            this.dotCount =
                genome.getDotCount();
        }


        return this;
    }



    /* =====================================================
       GET SIZE
       ===================================================== */

    getSize() {

        return this.genomes.length;
    }



    /* =====================================================
       IS EMPTY
       ===================================================== */

    isEmpty() {

        return (
            this.genomes.length ===
            0
        );
    }



    /* =====================================================
       GET GENOME
       ===================================================== */

    getGenome(index) {

        index =
            Math.floor(
                Number(index)
            );


        if (
            !Number.isFinite(index) ||
            index < 0 ||
            index >=
                this.genomes.length
        ) {

            return null;
        }


        return this.genomes[index];
    }



    /* =====================================================
       ADD GENOME
       ===================================================== */

    addGenome(genome) {

        if (!genome) {

            return false;
        }


        this.genomes.push(
            genome
        );


        this.populationSize =
            this.genomes.length;


        return true;
    }



    /* =====================================================
       REMOVE GENOME
       ===================================================== */

    removeGenome(index) {

        index =
            Math.floor(
                Number(index)
            );


        if (
            !Number.isFinite(index) ||
            index < 0 ||
            index >=
                this.genomes.length
        ) {

            return null;
        }


        const removed =
            this.genomes.splice(
                index,
                1
            )[0];


        this.populationSize =
            this.genomes.length;


        return removed;
    }



    /* =====================================================
       CLEAR
       ===================================================== */

    clear() {

        this.genomes = [];


        this.populationSize =
            0;


        return this;
    }



    /* =====================================================
       SORT BY FITNESS
       ===================================================== */

    sortByFitness() {

        this.genomes.sort(
            (a, b) => {

                return (
                    this.getGenomeFitness(b) -
                    this.getGenomeFitness(a)
                );
            }
        );


        return this.genomes;
    }



    /* =====================================================
       FITNESS VALUE
       ===================================================== */

    getGenomeFitness(genome) {

        if (!genome) {

            return -Infinity;
        }


        if (
            Number.isFinite(
                genome.fitness
            )
        ) {

            return genome.fitness;
        }


        if (
            typeof genome.getFitness ===
            "function"
        ) {

            const fitness =
                genome.getFitness();


            if (
                Number.isFinite(fitness)
            ) {

                return fitness;
            }
        }


        return -Infinity;
    }



    /* =====================================================
       SIMILARITY VALUE
       ===================================================== */

    getGenomeSimilarity(genome) {

        if (!genome) {
            return undefined;
        }


        if (
            Number.isFinite(
                genome.similarity
            )
        ) {

            return genome.similarity;
        }


        if (
            typeof genome.getSimilarity ===
            "function"
        ) {

            const similarity =
                genome.getSimilarity();


            if (
                Number.isFinite(similarity)
            ) {

                return similarity;
            }
        }


        return undefined;
    }



    /* =====================================================
       ERROR VALUE
       ===================================================== */

    getGenomeError(genome) {

        if (!genome) {
            return undefined;
        }


        if (
            Number.isFinite(
                genome.error
            )
        ) {

            return genome.error;
        }


        if (
            typeof genome.getError ===
            "function"
        ) {

            const error =
                genome.getError();


            if (
                Number.isFinite(error)
            ) {

                return error;
            }
        }


        return undefined;
    }



    /* =====================================================
       BEST GENOME
       ===================================================== */

    getBestGenome() {

        if (
            this.genomes.length ===
            0
        ) {

            return null;
        }


        let best =
            null;


        let bestFitness =
            -Infinity;


        for (
            const genome of
            this.genomes
        ) {

            const fitness =
                this.getGenomeFitness(
                    genome
                );


            if (
                best === null ||
                fitness >
                bestFitness
            ) {

                best =
                    genome;


                bestFitness =
                    fitness;
            }
        }


        return best;
    }



    /* =====================================================
       WORST GENOME
       ===================================================== */

    getWorstGenome() {

        if (
            this.genomes.length ===
            0
        ) {

            return null;
        }


        let worst =
            null;


        let worstFitness =
            Infinity;


        for (
            const genome of
            this.genomes
        ) {

            const fitness =
                this.getGenomeFitness(
                    genome
                );


            if (
                worst === null ||
                fitness <
                worstFitness
            ) {

                worst =
                    genome;


                worstFitness =
                    fitness;
            }
        }


        return worst;
    }



    /* =====================================================
       RANDOM GENOME
       ===================================================== */

    getRandomGenome() {

        if (
            this.genomes.length ===
            0
        ) {

            return null;
        }


        return this.genomes[
            Math.floor(
                Math.random() *
                this.genomes.length
            )
        ];
    }



    /* =====================================================
       TOP GENOMES
       ===================================================== */

    getTopGenomes(count) {

        count =
            Math.max(
                0,
                Math.floor(
                    Number(count) || 0
                )
            );


        const sorted =
            [...this.genomes];


        sorted.sort(
            (a, b) => {

                return (
                    this.getGenomeFitness(b) -
                    this.getGenomeFitness(a)
                );
            }
        );


        return sorted.slice(
            0,
            count
        );
    }



    /* =====================================================
       TOURNAMENT SELECTION
       ===================================================== */

    tournamentSelect(
        tournamentSize = 3
    ) {

        if (
            this.genomes.length ===
            0
        ) {

            return null;
        }


        tournamentSize =
            Math.max(
                1,
                Math.floor(
                    Number(
                        tournamentSize
                    ) || 1
                )
            );


        let winner =
            null;


        let winnerFitness =
            -Infinity;


        for (
            let i = 0;
            i < tournamentSize;
            i++
        ) {

            const candidate =
                this.getRandomGenome();


            const fitness =
                this.getGenomeFitness(
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


        return winner;
    }



    /* =====================================================
       AVERAGE FITNESS
       ===================================================== */

    getAverageFitness() {

        if (
            this.genomes.length ===
            0
        ) {

            return 0;
        }


        let total =
            0;


        let evaluated =
            0;


        for (
            const genome of
            this.genomes
        ) {

            const fitness =
                this.getGenomeFitness(
                    genome
                );


            if (
                Number.isFinite(fitness)
            ) {

                total +=
                    fitness;


                evaluated++;
            }
        }


        if (
            evaluated ===
            0
        ) {

            return 0;
        }


        return (
            total /
            evaluated
        );
    }



    /* =====================================================
       AVERAGE SIMILARITY
       ===================================================== */

    getAverageSimilarity() {

        if (
            this.genomes.length ===
            0
        ) {

            return 0;
        }


        let total =
            0;


        let evaluated =
            0;


        for (
            const genome of
            this.genomes
        ) {

            const similarity =
                this.getGenomeSimilarity(
                    genome
                );


            if (
                Number.isFinite(
                    similarity
                )
            ) {

                total +=
                    similarity;


                evaluated++;
            }
        }


        if (
            evaluated ===
            0
        ) {

            return 0;
        }


        return (
            total /
            evaluated
        );
    }



    /* =====================================================
       AVERAGE ERROR
       ===================================================== */

    getAverageError() {

        if (
            this.genomes.length ===
            0
        ) {

            return Infinity;
        }


        let total =
            0;


        let evaluated =
            0;


        for (
            const genome of
            this.genomes
        ) {

            const error =
                this.getGenomeError(
                    genome
                );


            if (
                Number.isFinite(
                    error
                )
            ) {

                total +=
                    error;


                evaluated++;
            }
        }


        if (
            evaluated ===
            0
        ) {

            return Infinity;
        }


        return (
            total /
            evaluated
        );
    }



    /* =====================================================
       FITNESS RANGE
       ===================================================== */

    getFitnessRange() {

        let minimum =
            Infinity;


        let maximum =
            -Infinity;


        let found =
            false;


        for (
            const genome of
            this.genomes
        ) {

            const fitness =
                this.getGenomeFitness(
                    genome
                );


            if (
                !Number.isFinite(
                    fitness
                )
            ) {

                continue;
            }


            found =
                true;


            minimum =
                Math.min(
                    minimum,
                    fitness
                );


            maximum =
                Math.max(
                    maximum,
                    fitness
                );
        }


        if (!found) {

            return {

                minimum: 0,

                maximum: 0,

                range: 0

            };
        }


        return {

            minimum:
                minimum,

            maximum:
                maximum,

            range:
                maximum -
                minimum

        };
    }



    /* =====================================================
       EVALUATED COUNT
       ===================================================== */

    getEvaluatedCount() {

        let count =
            0;


        for (
            const genome of
            this.genomes
        ) {

            if (
                Number.isFinite(
                    this.getGenomeFitness(
                        genome
                    )
                )
            ) {

                count++;
            }
        }


        return count;
    }



    /* =====================================================
       INVALIDATE FITNESS
       ===================================================== */

    invalidateFitness() {

        for (
            const genome of
            this.genomes
        ) {

            if (
                typeof genome
                    ?.invalidateFitness ===
                "function"
            ) {

                genome
                    .invalidateFitness();

            } else if (genome) {

                genome.fitness =
                    undefined;


                genome.similarity =
                    undefined;


                genome.error =
                    undefined;
            }
        }


        return this;
    }



    /* =====================================================
       CLONE POPULATION
       ===================================================== */

    clone() {

        /*
         * Do not invoke the normal constructor.
         *
         * That would unnecessarily generate a completely
         * new random population before replacing it.
         */

        const clone =
            Object.create(
                Population.prototype
            );


        clone.populationSize =
            this.populationSize;


        clone.triangleCount =
            this.triangleCount;


        clone.circleCount =
            this.circleCount;


        clone.dotCount =
            this.dotCount;


        clone.width =
            this.width;


        clone.height =
            this.height;


        clone.genomes =
            this.genomes.map(
                genome => {

                    if (
                        typeof genome?.clone ===
                        "function"
                    ) {

                        return genome.clone();
                    }


                    return genome;
                }
            );


        return clone;
    }



    /* =====================================================
       RESET

       All four configuration values can be changed while
       retaining the current values as defaults.
       ===================================================== */

    reset(
        populationSize =
            this.populationSize,

        triangleCount =
            this.triangleCount,

        circleCount =
            this.circleCount,

        dotCount =
            this.dotCount
    ) {

        this.populationSize =
            this.normalisePopulationSize(
                populationSize
            );


        this.triangleCount =
            this.normaliseShapeCount(
                triangleCount
            );


        this.circleCount =
            this.normaliseShapeCount(
                circleCount
            );


        this.dotCount =
            this.normaliseShapeCount(
                dotCount
            );


        this.createInitialPopulation();


        return this;
    }



    /* =====================================================
       SET SHAPE COUNTS

       Changes the configuration used when NEW genomes are
       generated.

       Existing genomes are deliberately not altered.
       ===================================================== */

    setShapeCounts(
        triangleCount,
        circleCount,
        dotCount
    ) {

        this.triangleCount =
            this.normaliseShapeCount(
                triangleCount
            );


        this.circleCount =
            this.normaliseShapeCount(
                circleCount
            );


        this.dotCount =
            this.normaliseShapeCount(
                dotCount
            );


        return this;
    }



    /* =====================================================
       GET SHAPE COUNTS
       ===================================================== */

    getShapeCounts() {

        return {

            triangles:
                this.triangleCount,

            circles:
                this.circleCount,

            dots:
                this.dotCount,

            total:
                this.triangleCount +
                this.circleCount +
                this.dotCount

        };
    }



    /* =====================================================
       RESIZE POPULATION
       ===================================================== */

    resize(newSize) {

        newSize =
            this.normalisePopulationSize(
                newSize
            );


        /*
         * Add random mixed-shape genomes.
         */

        while (
            this.genomes.length <
            newSize
        ) {

            this.genomes.push(
                this.createGenome()
            );
        }


        /*
         * When shrinking, preserve the strongest candidates.
         */

        if (
            this.genomes.length >
            newSize
        ) {

            this.sortByFitness();


            this.genomes =
                this.genomes.slice(
                    0,
                    newSize
                );
        }


        this.populationSize =
            newSize;


        return this;
    }



    /* =====================================================
       SET DIMENSIONS
       ===================================================== */

    setDimensions(
        width,
        height,
        scaleShapes = true
    ) {

        this.width =
            this.normaliseDimension(
                width
            );


        this.height =
            this.normaliseDimension(
                height
            );


        for (
            const genome of
            this.genomes
        ) {

            if (
                typeof genome
                    ?.setDimensions ===
                "function"
            ) {

                genome.setDimensions(
                    this.width,
                    this.height,
                    scaleShapes
                );
            }
        }


        return this;
    }



    /* =====================================================
       REPLACE GENERATION

       GeneticAlgorithm can use this when producing the
       next generation.
       ===================================================== */

    replaceGeneration(
        genomes
    ) {

        if (
            !Array.isArray(
                genomes
            )
        ) {

            throw new Error(
                "Population.replaceGeneration() requires an array."
            );
        }


        this.genomes =
            genomes;


        this.populationSize =
            genomes.length;


        return this;
    }



    /* =====================================================
       SHUFFLE POPULATION
       ===================================================== */

    shuffle() {

        for (
            let i =
                this.genomes.length - 1;
            i > 0;
            i--
        ) {

            const j =
                Math.floor(
                    Math.random() *
                    (i + 1)
                );


            const temporary =
                this.genomes[i];


            this.genomes[i] =
                this.genomes[j];


            this.genomes[j] =
                temporary;
        }


        return this;
    }



    /* =====================================================
       STATISTICS
       ===================================================== */

    getStatistics() {

        const best =
            this.getBestGenome();


        const worst =
            this.getWorstGenome();


        const fitnessRange =
            this.getFitnessRange();


        const shapeCounts =
            this.getShapeCounts();


        return {

            size:
                this.genomes.length,

            evaluated:
                this.getEvaluatedCount(),


            /* ===========================================
               SHAPE CONFIGURATION
               =========================================== */

            triangleCount:
                shapeCounts.triangles,

            circleCount:
                shapeCounts.circles,

            dotCount:
                shapeCounts.dots,

            shapeCount:
                shapeCounts.total,


            /* ===========================================
               AVERAGES
               =========================================== */

            averageFitness:
                this.getAverageFitness(),

            averageSimilarity:
                this.getAverageSimilarity(),

            averageError:
                this.getAverageError(),


            /* ===========================================
               BEST
               =========================================== */

            bestFitness:
                Number.isFinite(
                    this.getGenomeFitness(
                        best
                    )
                )
                    ? this.getGenomeFitness(
                        best
                    )
                    : 0,

            bestSimilarity:
                Number.isFinite(
                    this.getGenomeSimilarity(
                        best
                    )
                )
                    ? this.getGenomeSimilarity(
                        best
                    )
                    : 0,


            /* ===========================================
               WORST
               =========================================== */

            worstFitness:
                Number.isFinite(
                    this.getGenomeFitness(
                        worst
                    )
                )
                    ? this.getGenomeFitness(
                        worst
                    )
                    : 0,


            /* ===========================================
               RANGE
               =========================================== */

            minimumFitness:
                fitnessRange.minimum,

            maximumFitness:
                fitnessRange.maximum,

            fitnessRange:
                fitnessRange.range

        };
    }



    /* =====================================================
       NORMALISE POPULATION SIZE
       ===================================================== */

    normalisePopulationSize(value) {

        value =
            Number(value);


        if (
            !Number.isFinite(value)
        ) {

            value =
                30;
        }


        return Math.max(
            2,
            Math.floor(value)
        );
    }



    /* =====================================================
       NORMALISE SHAPE COUNT

       Zero is valid.

       This lets the UI run experiments such as:

       100 triangles
       0 circles
       0 dots
       ===================================================== */

    normaliseShapeCount(value) {

        value =
            Number(value);


        if (
            !Number.isFinite(value)
        ) {

            return 0;
        }


        return Math.max(
            0,
            Math.floor(value)
        );
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

            return 1;
        }


        return Math.max(
            1,
            Math.floor(value)
        );
    }

}