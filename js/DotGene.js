/* =========================================================
   MIDLIFE PROGRAMMER
   Evolve Mona Lisa
   DotGene.js

   Represents one small translucent detail dot in a Genome.

   Dot properties:

   - Centre X
   - Centre Y
   - Radius
   - Red
   - Green
   - Blue
   - Alpha

   Dots provide fine local corrections that would be
   inefficient to reproduce using large triangles or circles.
   ========================================================= */


class DotGene {


    /* =====================================================
       CONSTRUCTOR
       ===================================================== */

    constructor(
        width = 480,
        height = 715
    ) {

        /*
         * Also support:
         *
         * new DotGene({
         *     width: 480,
         *     height: 715
         * });
         */

        if (
            typeof width ===
            "object"
        ) {

            const options =
                width;


            width =
                options.width ??
                480;


            height =
                options.height ??
                715;
        }


        this.type =
            "dot";


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



        /* =================================================
           POSITION
           ================================================= */

        this.x =
            Math.random() *
            this.width;


        this.y =
            Math.random() *
            this.height;



        /* =================================================
           SIZE
           ================================================= */

        this.radius =
            this.randomRadius();



        /* =================================================
           COLOUR
           ================================================= */

        this.r =
            this.randomChannel();


        this.g =
            this.randomChannel();


        this.b =
            this.randomChannel();



        /* =================================================
           ALPHA

           Dots can be slightly stronger than large shapes
           because they cover a very small region.
           ================================================= */

        this.a =
            this.randomAlpha();
    }



    /* =====================================================
       RANDOM RADIUS
       ===================================================== */

    randomRadius() {

        /*
         * At 480 x 715 this produces approximately
         * 1.5px - 8px dots.
         *
         * Scaling from the shorter image dimension means
         * dots remain sensible if another resolution is
         * used later.
         */

        const scale =
            Math.min(
                this.width,
                this.height
            ) /
            480;


        const minimum =
            Math.max(
                0.75,
                1.5 * scale
            );


        const maximum =
            Math.max(
                minimum + 0.5,
                8 * scale
            );


        /*
         * Squaring the random value biases creation toward
         * smaller dots.
         *
         * We want many fine corrections and relatively few
         * large dots.
         */

        const random =
            Math.random();


        return (
            minimum +
            (
                maximum -
                minimum
            ) *
            random *
            random
        );
    }



    /* =====================================================
       MAXIMUM RADIUS
       ===================================================== */

    getMaximumRadius() {

        return Math.max(
            2,
            Math.min(
                this.width,
                this.height
            ) *
            0.035
        );
    }



    /* =====================================================
       RANDOM COLOUR CHANNEL
       ===================================================== */

    randomChannel() {

        return Math.floor(
            Math.random() *
            256
        );
    }



    /* =====================================================
       RANDOM ALPHA
       ===================================================== */

    randomAlpha() {

        return (
            0.15 +
            Math.random() *
            0.60
        );
    }



    /* =====================================================
       MUTATE
       ===================================================== */

    mutate(
        strength = 0.15
    ) {

        strength =
            this.clamp(
                strength,
                0.001,
                1
            );


        /*
         * Dot mutation is deliberately weighted toward
         * position and colour.
         *
         * Dots are detail genes, so completely reshaping
         * them is less useful than nudging an existing
         * useful correction.
         */

        const roll =
            Math.random();


        if (
            roll <
            0.25
        ) {

            this.mutatePosition(
                strength
            );

        } else if (
            roll <
            0.37
        ) {

            this.mutateX(
                strength
            );

        } else if (
            roll <
            0.49
        ) {

            this.mutateY(
                strength
            );

        } else if (
            roll <
            0.60
        ) {

            this.mutateRadius(
                strength
            );

        } else if (
            roll <
            0.70
        ) {

            this.r =
                this.mutateColourChannel(
                    this.r,
                    strength
                );

        } else if (
            roll <
            0.80
        ) {

            this.g =
                this.mutateColourChannel(
                    this.g,
                    strength
                );

        } else if (
            roll <
            0.90
        ) {

            this.b =
                this.mutateColourChannel(
                    this.b,
                    strength
                );

        } else if (
            roll <
            0.96
        ) {

            this.mutateColour(
                strength
            );

        } else {

            this.mutateAlpha(
                strength
            );
        }


        return this;
    }



    /* =====================================================
       MUTATE POSITION
       ===================================================== */

    mutatePosition(
        strength = 0.15
    ) {

        /*
         * Dots move over a much smaller range than circles
         * or triangle vertices.
         */

        const movementScale =
            0.35;


        const deltaX =
            (
                Math.random() *
                2 -
                1
            ) *
            this.width *
            strength *
            movementScale;


        const deltaY =
            (
                Math.random() *
                2 -
                1
            ) *
            this.height *
            strength *
            movementScale;


        this.x =
            this.clamp(
                this.x +
                deltaX,
                0,
                this.width
            );


        this.y =
            this.clamp(
                this.y +
                deltaY,
                0,
                this.height
            );


        return this;
    }



    /* =====================================================
       MUTATE X
       ===================================================== */

    mutateX(
        strength = 0.15
    ) {

        const delta =
            (
                Math.random() *
                2 -
                1
            ) *
            this.width *
            strength *
            0.35;


        this.x =
            this.clamp(
                this.x +
                delta,
                0,
                this.width
            );


        return this;
    }



    /* =====================================================
       MUTATE Y
       ===================================================== */

    mutateY(
        strength = 0.15
    ) {

        const delta =
            (
                Math.random() *
                2 -
                1
            ) *
            this.height *
            strength *
            0.35;


        this.y =
            this.clamp(
                this.y +
                delta,
                0,
                this.height
            );


        return this;
    }



    /* =====================================================
       MUTATE RADIUS
       ===================================================== */

    mutateRadius(
        strength = 0.15
    ) {

        const maximum =
            this.getMaximumRadius();


        const change =
            (
                Math.random() *
                2 -
                1
            ) *
            maximum *
            strength *
            0.75;


        this.radius =
            this.clamp(
                this.radius +
                change,
                0.5,
                maximum
            );


        return this;
    }



    /* =====================================================
       MUTATE COLOUR CHANNEL
       ===================================================== */

    mutateColourChannel(
        value,
        strength = 0.15
    ) {

        /*
         * Colour mutations can be somewhat more precise
         * than those used by the larger genes.
         */

        const maximumChange =
            255 *
            strength *
            0.75;


        const change =
            (
                Math.random() *
                2 -
                1
            ) *
            maximumChange;


        return this.clamp(
            value +
                change,
            0,
            255
        );
    }



    /* =====================================================
       MUTATE ENTIRE COLOUR
       ===================================================== */

    mutateColour(
        strength = 0.15
    ) {

        this.r =
            this.mutateColourChannel(
                this.r,
                strength
            );


        this.g =
            this.mutateColourChannel(
                this.g,
                strength
            );


        this.b =
            this.mutateColourChannel(
                this.b,
                strength
            );


        return this;
    }



    /* =====================================================
       MUTATE ALPHA
       ===================================================== */

    mutateAlpha(
        strength = 0.15
    ) {

        const change =
            (
                Math.random() *
                2 -
                1
            ) *
            strength *
            0.75;


        this.a =
            this.clamp(
                this.a +
                change,
                0.02,
                1
            );


        return this;
    }



    /* =====================================================
       SET POSITION
       ===================================================== */

    setPosition(
        x,
        y
    ) {

        this.x =
            this.clamp(
                x,
                0,
                this.width
            );


        this.y =
            this.clamp(
                y,
                0,
                this.height
            );


        return this;
    }



    /* =====================================================
       SET RADIUS
       ===================================================== */

    setRadius(
        radius
    ) {

        this.radius =
            this.clamp(
                radius,
                0.5,
                this.getMaximumRadius()
            );


        return this;
    }



    /* =====================================================
       SET COLOUR
       ===================================================== */

    setColour(
        r,
        g,
        b,
        a = this.a
    ) {

        this.r =
            this.clamp(
                r,
                0,
                255
            );


        this.g =
            this.clamp(
                g,
                0,
                255
            );


        this.b =
            this.clamp(
                b,
                0,
                255
            );


        this.a =
            this.clamp(
                a,
                0.02,
                1
            );


        return this;
    }



    /* =====================================================
       GET POSITION
       ===================================================== */

    getPosition() {

        return {

            x:
                this.x,

            y:
                this.y

        };
    }



    /* =====================================================
       GET COLOUR
       ===================================================== */

    getColour() {

        return {

            r:
                this.r,

            g:
                this.g,

            b:
                this.b,

            a:
                this.a

        };
    }



    /* =====================================================
       GET AREA
       ===================================================== */

    getArea() {

        return (
            Math.PI *
            this.radius *
            this.radius
        );
    }



    /* =====================================================
       MOVE NEAR ERROR POINT

       GeneticAlgorithm will use this with the error map.
       ===================================================== */

    moveNear(
        x,
        y,
        spread = 0.025
    ) {

        /*
         * Dots should be placed much closer to the
         * requested error location than circles.
         */

        const spreadX =
            this.width *
            spread;


        const spreadY =
            this.height *
            spread;


        this.x =
            this.clamp(

                x +

                (
                    Math.random() *
                    2 -
                    1
                ) *
                spreadX,

                0,
                this.width
            );


        this.y =
            this.clamp(

                y +

                (
                    Math.random() *
                    2 -
                    1
                ) *
                spreadY,

                0,
                this.height
            );


        return this;
    }



    /* =====================================================
       PLACE EXACTLY
       ===================================================== */

    moveTo(
        x,
        y
    ) {

        return this.setPosition(
            x,
            y
        );
    }



    /* =====================================================
       SET TARGET COLOUR

       Gives error-guided dots an approximate colour from
       the target image rather than a completely random one.
       ===================================================== */

    setTargetColour(
        colour,
        variation = 10
    ) {

        if (!colour) {
            return this;
        }


        const randomVariation =
            () => {

                return (
                    Math.random() *
                    2 -
                    1
                ) *
                variation;
            };


        this.r =
            this.clamp(
                colour.r +
                    randomVariation(),
                0,
                255
            );


        this.g =
            this.clamp(
                colour.g +
                    randomVariation(),
                0,
                255
            );


        this.b =
            this.clamp(
                colour.b +
                    randomVariation(),
                0,
                255
            );


        return this;
    }



    /* =====================================================
       RANDOMISE POSITION
       ===================================================== */

    randomisePosition() {

        this.x =
            Math.random() *
            this.width;


        this.y =
            Math.random() *
            this.height;


        return this;
    }



    /* =====================================================
       RANDOMISE RADIUS
       ===================================================== */

    randomiseRadius() {

        this.radius =
            this.randomRadius();


        return this;
    }



    /* =====================================================
       RANDOMISE COLOUR
       ===================================================== */

    randomiseColour() {

        this.r =
            this.randomChannel();


        this.g =
            this.randomChannel();


        this.b =
            this.randomChannel();


        return this;
    }



    /* =====================================================
       RANDOMISE ALPHA
       ===================================================== */

    randomiseAlpha() {

        this.a =
            this.randomAlpha();


        return this;
    }



    /* =====================================================
       RANDOMISE EVERYTHING
       ===================================================== */

    randomise() {

        this.randomisePosition();

        this.randomiseRadius();

        this.randomiseColour();

        this.randomiseAlpha();


        return this;
    }



    /* =====================================================
       CLONE
       ===================================================== */

    clone() {

        const clone =
            Object.create(
                DotGene.prototype
            );


        clone.type =
            "dot";


        clone.width =
            this.width;


        clone.height =
            this.height;


        clone.x =
            this.x;


        clone.y =
            this.y;


        clone.radius =
            this.radius;


        clone.r =
            this.r;


        clone.g =
            this.g;


        clone.b =
            this.b;


        clone.a =
            this.a;


        return clone;
    }



    /* =====================================================
       COPY ALIAS
       ===================================================== */

    copy() {

        return this.clone();
    }



    /* =====================================================
       SET DIMENSIONS
       ===================================================== */

    setDimensions(
        width,
        height,
        scaleShape = true
    ) {

        width =
            Math.max(
                1,
                Math.floor(width)
            );


        height =
            Math.max(
                1,
                Math.floor(height)
            );


        if (
            scaleShape
        ) {

            const scaleX =
                width /
                this.width;


            const scaleY =
                height /
                this.height;


            this.x *=
                scaleX;


            this.y *=
                scaleY;


            /*
             * Average scale preserves a circular dot.
             */

            const radiusScale =
                (
                    scaleX +
                    scaleY
                ) /
                2;


            this.radius *=
                radiusScale;
        }


        this.width =
            width;


        this.height =
            height;


        this.constrainToCanvas();


        return this;
    }



    /* =====================================================
       CONSTRAIN TO CANVAS
       ===================================================== */

    constrainToCanvas() {

        this.x =
            this.clamp(
                this.x,
                0,
                this.width
            );


        this.y =
            this.clamp(
                this.y,
                0,
                this.height
            );


        this.radius =
            this.clamp(
                this.radius,
                0.5,
                this.getMaximumRadius()
            );


        return this;
    }



    /* =====================================================
       TO CSS COLOUR
       ===================================================== */

    toCSSColour() {

        return (
            "rgba(" +
            Math.round(this.r) +
            ", " +
            Math.round(this.g) +
            ", " +
            Math.round(this.b) +
            ", " +
            this.a +
            ")"
        );
    }



    /* =====================================================
       SERIALISE

       ExportManager will use this to save the genome.
       ===================================================== */

    toJSON() {

        return {

            type:
                "dot",

            x:
                this.x,

            y:
                this.y,

            radius:
                this.radius,

            r:
                this.r,

            g:
                this.g,

            b:
                this.b,

            a:
                this.a

        };
    }



    /* =====================================================
       RESTORE FROM JSON
       ===================================================== */

    static fromJSON(
        data,
        width = 480,
        height = 715
    ) {

        const dot =
            new DotGene(
                width,
                height
            );


        dot.x =
            dot.clamp(
                Number(data.x) || 0,
                0,
                width
            );


        dot.y =
            dot.clamp(
                Number(data.y) || 0,
                0,
                height
            );


        dot.radius =
            dot.clamp(
                Number(data.radius) || 1,
                0.5,
                dot.getMaximumRadius()
            );


        dot.r =
            dot.clamp(
                Number(data.r) || 0,
                0,
                255
            );


        dot.g =
            dot.clamp(
                Number(data.g) || 0,
                0,
                255
            );


        dot.b =
            dot.clamp(
                Number(data.b) || 0,
                0,
                255
            );


        dot.a =
            dot.clamp(
                Number(data.a) || 0.25,
                0.02,
                1
            );


        return dot;
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