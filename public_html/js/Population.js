/* =========================================================
   MIDLIFE PROGRAMMER
   Evolve Mona Lisa
   Population.js

   Represents a collection of candidate Genome objects.

   Responsibilities:

   - Create the initial population
   - Store genomes
   - Sort genomes by fitness
   - Retrieve the best/worst genomes
   - Replace generations
   - Calculate population statistics
   ========================================================= */


class Population {


    /* =====================================================
       CONSTRUCTOR
       ===================================================== */

    constructor(
        populationSize = 30,
        triangleCount = 100,
        width = 480,
        height = 715
    ) {

        /*
         * Also support:
         *
         * new Population({
         *     populationSize: 30,
         *     triangleCount: 100,
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


            width =
                options.width ??
                480;


            height =
                options.height ??
                715;
        }


        this.populationSize =
            Math.max(
                2,
                Math.floor(populationSize)
            );


        this.triangleCount =
            Math.max(
                1,
                Math.floor(triangleCount)
            );


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


        /*
         * Main collection.
         *
         * GeneticAlgorithm.getPopulationGenomes()
         * specifically supports this property.
         */

        this.genomes = [];


        /*
         * Create the first random generation.
         */

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


        return new Genome(
            this.triangleCount,
            this.width,
            this.height
        );
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

        if (
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

        if (
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

        this.populationSize = 0;
    }



    /* =====================================================
       SORT BY FITNESS
       ===================================================== */

    sortByFitness() {

        this.genomes.sort(
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


                /*
                 * Highest fitness first.
                 */

                return (
                    fitnessB -
                    fitnessA
                );
            }
        );


        return this.genomes;
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
            let i = 0;
            i < this.genomes.length;
            i++
        ) {

            const genome =
                this.genomes[i];


            const fitness =
                Number.isFinite(
                    genome?.fitness
                )
                    ? genome.fitness
                    : -Infinity;


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
            let i = 0;
            i < this.genomes.length;
            i++
        ) {

            const genome =
                this.genomes[i];


            const fitness =
                Number.isFinite(
                    genome?.fitness
                )
                    ? genome.fitness
                    : -Infinity;


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


        const index =
            Math.floor(
                Math.random() *
                this.genomes.length
            );


        return this.genomes[index];
    }



    /* =====================================================
       TOP GENOMES
       ===================================================== */

    getTopGenomes(count) {

        count =
            Math.max(
                0,
                Math.floor(count)
            );


        const sorted =
            [...this.genomes];


        sorted.sort(
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
                    tournamentSize
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
                Number.isFinite(
                    candidate?.fitness
                )
                    ? candidate.fitness
                    : -Infinity;


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

            if (
                Number.isFinite(
                    genome.fitness
                )
            ) {

                total +=
                    genome.fitness;


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

            if (
                Number.isFinite(
                    genome.similarity
                )
            ) {

                total +=
                    genome.similarity;


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

            if (
                Number.isFinite(
                    genome.error
                )
            ) {

                total +=
                    genome.error;


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

            if (
                !Number.isFinite(
                    genome.fitness
                )
            ) {

                continue;
            }


            found =
                true;


            minimum =
                Math.min(
                    minimum,
                    genome.fitness
                );


            maximum =
                Math.max(
                    maximum,
                    genome.fitness
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
                    genome.fitness
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
                    .invalidateFitness ===
                "function"
            ) {

                genome
                    .invalidateFitness();

            } else {

                genome.fitness =
                    undefined;


                genome.similarity =
                    undefined;


                genome.error =
                    undefined;
            }
        }
    }



    /* =====================================================
       CLONE POPULATION
       ===================================================== */

    clone() {

        /*
         * Don't invoke the normal constructor because that
         * would unnecessarily generate a new random
         * population.
         */

        const clone =
            Object.create(
                Population.prototype
            );


        clone.populationSize =
            this.populationSize;


        clone.triangleCount =
            this.triangleCount;


        clone.width =
            this.width;


        clone.height =
            this.height;


        clone.genomes =
            this.genomes.map(
                genome => {

                    if (
                        typeof genome.clone ===
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
       ===================================================== */

    reset(
        populationSize =
            this.populationSize,

        triangleCount =
            this.triangleCount
    ) {

        this.populationSize =
            Math.max(
                2,
                Math.floor(
                    populationSize
                )
            );


        this.triangleCount =
            Math.max(
                1,
                Math.floor(
                    triangleCount
                )
            );


        this.createInitialPopulation();


        return this;
    }



    /* =====================================================
       RESIZE POPULATION
       ===================================================== */

    resize(newSize) {

        newSize =
            Math.max(
                2,
                Math.floor(
                    newSize
                )
            );


        /*
         * Add new random genomes.
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
         * If shrinking, retain the strongest genomes
         * whenever fitness information is available.
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
       DIMENSIONS
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


        for (
            const genome of
            this.genomes
        ) {

            if (
                typeof genome
                    .setDimensions ===
                "function"
            ) {

                genome.setDimensions(
                    this.width,
                    this.height
                );
            }
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


        return {

            size:
                this.genomes.length,

            evaluated:
                this.getEvaluatedCount(),

            averageFitness:
                this.getAverageFitness(),

            averageSimilarity:
                this.getAverageSimilarity(),

            averageError:
                this.getAverageError(),

            bestFitness:
                Number.isFinite(
                    best?.fitness
                )
                    ? best.fitness
                    : 0,

            bestSimilarity:
                Number.isFinite(
                    best?.similarity
                )
                    ? best.similarity
                    : 0,

            worstFitness:
                Number.isFinite(
                    worst?.fitness
                )
                    ? worst.fitness
                    : 0,

            minimumFitness:
                fitnessRange.minimum,

            maximumFitness:
                fitnessRange.maximum,

            fitnessRange:
                fitnessRange.range

        };
    }

}