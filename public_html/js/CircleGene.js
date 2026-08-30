/* =========================================================
   MIDLIFE PROGRAMMER
   Evolve Mona Lisa
   CircleGene.js

   Represents one translucent circle in a Genome.

   Circle properties:

   - Centre X
   - Centre Y
   - Radius
   - Red
   - Green
   - Blue
   - Alpha

   Circles are useful for softer local colour regions where
   large angular triangles are less effective.
   ========================================================= */


class CircleGene {


    /* =====================================================
       CONSTRUCTOR
       ===================================================== */

    constructor(
        width = 480,
        height = 715
    ) {

        /*
         * Also allow:
         *
         * new CircleGene({
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
            "circle";


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
           RADIUS
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
           ================================================= */

        this.a =
            this.randomAlpha();
    }



    /* =====================================================
       RANDOM RADIUS
       ===================================================== */

    randomRadius() {

        /*
         * Circles are intended primarily as medium/local
         * corrections rather than enormous background
         * shapes.
         *
         * Maximum radius is approximately 15% of the
         * shorter canvas dimension.
         */

        const maximum =
            Math.min(
                this.width,
                this.height
            ) * 0.15;


        const minimum =
            Math.max(
                2,
                Math.min(
                    this.width,
                    this.height
                ) * 0.01
            );


        return (
            minimum +
            Math.random() *
            (
                maximum -
                minimum
            )
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

        /*
         * Low opacity allows many circles to blend rather
         * than simply covering earlier genes.
         */

        return (
            0.05 +
            Math.random() *
            0.40
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
         * Select one property group.
         */

        const mutationType =
            Math.floor(
                Math.random() *
                8
            );


        switch (
            mutationType
        ) {


            /* =============================================
               MOVE CENTRE
               ============================================= */

            case 0:

                this.mutatePosition(
                    strength
                );

                break;



            /* =============================================
               X POSITION
               ============================================= */

            case 1:

                this.mutateX(
                    strength
                );

                break;



            /* =============================================
               Y POSITION
               ============================================= */

            case 2:

                this.mutateY(
                    strength
                );

                break;



            /* =============================================
               RADIUS
               ============================================= */

            case 3:

                this.mutateRadius(
                    strength
                );

                break;



            /* =============================================
               RED
               ============================================= */

            case 4:

                this.r =
                    this.mutateColourChannel(
                        this.r,
                        strength
                    );

                break;



            /* =============================================
               GREEN / BLUE
               ============================================= */

            case 5:

                if (
                    Math.random() <
                    0.5
                ) {

                    this.g =
                        this.mutateColourChannel(
                            this.g,
                            strength
                        );

                } else {

                    this.b =
                        this.mutateColourChannel(
                            this.b,
                            strength
                        );
                }

                break;



            /* =============================================
               ENTIRE COLOUR
               ============================================= */

            case 6:

                this.mutateColour(
                    strength
                );

                break;



            /* =============================================
               ALPHA
               ============================================= */

            case 7:

                this.mutateAlpha(
                    strength
                );

                break;
        }


        return this;
    }



    /* =====================================================
       MUTATE POSITION
       ===================================================== */

    mutatePosition(
        strength = 0.15
    ) {

        const deltaX =
            (
                Math.random() *
                2 -
                1
            ) *
            this.width *
            strength;


        const deltaY =
            (
                Math.random() *
                2 -
                1
            ) *
            this.height *
            strength;


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
            strength;


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
            strength;


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

        const maximumRadius =
            Math.min(
                this.width,
                this.height
            ) * 0.40;


        const change =
            (
                Math.random() *
                2 -
                1
            ) *
            Math.min(
                this.width,
                this.height
            ) *
            strength *
            0.25;


        this.radius =
            this.clamp(
                this.radius +
                change,
                1,
                maximumRadius
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

        const maximumChange =
            255 *
            strength;


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
            strength;


        this.a =
            this.clamp(
                this.a +
                change,
                0.01,
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

        const maximum =
            Math.min(
                this.width,
                this.height
            ) *
            0.40;


        this.radius =
            this.clamp(
                radius,
                1,
                maximum
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
                0.01,
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
                CircleGene.prototype
            );


        clone.type =
            "circle";


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
       RESIZE COORDINATE SPACE
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


            /*
             * Position follows each axis independently.
             */

            this.x *=
                scaleX;


            this.y *=
                scaleY;


            /*
             * Radius uses the average scale so the circle
             * remains a circle rather than becoming an
             * ellipse.
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
       CONSTRAIN
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
                1,
                Math.min(
                    this.width,
                    this.height
                ) *
                0.40
            );


        return this;
    }



    /* =====================================================
       CREATE NEAR A SPECIFIC LOCATION

       This becomes particularly useful for our later
       error-guided mutation system.

       FitnessEvaluator can identify a badly approximated
       region and GeneticAlgorithm can create a circle near
       that location.
       ===================================================== */

    moveNear(
        x,
        y,
        spread = 0.10
    ) {

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
       INITIALISE FROM TARGET COLOUR

       Error-guided evolution will be able to ask
       TargetImage for the colour around a bad pixel and
       seed the circle with approximately that colour.
       ===================================================== */

    setTargetColour(
        colour,
        variation = 20
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

       Used later by ExportManager.js.
       ===================================================== */

    toJSON() {

        return {

            type:
                "circle",

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

       Allows a saved genome to be imported.
       ===================================================== */

    static fromJSON(
        data,
        width = 480,
        height = 715
    ) {

        const circle =
            new CircleGene(
                width,
                height
            );


        circle.x =
            circle.clamp(
                Number(data.x) || 0,
                0,
                width
            );


        circle.y =
            circle.clamp(
                Number(data.y) || 0,
                0,
                height
            );


        circle.radius =
            circle.clamp(
                Number(data.radius) || 1,
                1,
                Math.min(
                    width,
                    height
                ) *
                0.40
            );


        circle.r =
            circle.clamp(
                Number(data.r) || 0,
                0,
                255
            );


        circle.g =
            circle.clamp(
                Number(data.g) || 0,
                0,
                255
            );


        circle.b =
            circle.clamp(
                Number(data.b) || 0,
                0,
                255
            );


        circle.a =
            circle.clamp(
                Number(data.a) || 0.1,
                0.01,
                1
            );


        return circle;
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