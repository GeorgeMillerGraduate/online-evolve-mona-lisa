/* =========================================================
   MIDLIFE PROGRAMMER
   Evolve Mona Lisa
   TriangleGene.js

   Represents one translucent triangle in a Genome.

   Each triangle contains:

   - Three vertices
   - Red, green and blue colour channels
   - Alpha / opacity

   Evolution mutates these properties over time.
   ========================================================= */


class TriangleGene {


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
         * new TriangleGene({
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
           VERTICES
           ================================================= */

        this.points = [

            this.randomPoint(),

            this.randomPoint(),

            this.randomPoint()

        ];


        /* =================================================
           COLOUR
           ================================================= */

        this.r =
            this.randomChannel();


        this.g =
            this.randomChannel();


        this.b =
            this.randomChannel();


        /*
         * Semi-transparent triangles work considerably
         * better for image approximation than fully opaque
         * shapes because colours can blend together.
         */

        this.a =
            this.randomAlpha();
    }



    /* =====================================================
       RANDOM POINT
       ===================================================== */

    randomPoint() {

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
       RANDOM COLOUR CHANNEL
       ===================================================== */

    randomChannel() {

        return Math.floor(
            Math.random() * 256
        );
    }



    /* =====================================================
       RANDOM ALPHA
       ===================================================== */

    randomAlpha() {

        /*
         * Avoid starting with completely transparent or
         * completely opaque triangles.
         */

        return (
            0.05 +
            Math.random() * 0.45
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
         * Pick one mutation category.
         */

        const mutationType =
            Math.floor(
                Math.random() * 8
            );


        switch (mutationType) {


            /* =============================================
               MOVE ONE VERTEX
               ============================================= */

            case 0:

                this.mutatePoint(
                    strength
                );

                break;



            /* =============================================
               MOVE X ONLY
               ============================================= */

            case 1:

                this.mutateCoordinate(
                    "x",
                    strength
                );

                break;



            /* =============================================
               MOVE Y ONLY
               ============================================= */

            case 2:

                this.mutateCoordinate(
                    "y",
                    strength
                );

                break;



            /* =============================================
               RED
               ============================================= */

            case 3:

                this.r =
                    this.mutateColourChannel(
                        this.r,
                        strength
                    );

                break;



            /* =============================================
               GREEN
               ============================================= */

            case 4:

                this.g =
                    this.mutateColourChannel(
                        this.g,
                        strength
                    );

                break;



            /* =============================================
               BLUE
               ============================================= */

            case 5:

                this.b =
                    this.mutateColourChannel(
                        this.b,
                        strength
                    );

                break;



            /* =============================================
               ALPHA
               ============================================= */

            case 6:

                this.mutateAlpha(
                    strength
                );

                break;



            /* =============================================
               MOVE ENTIRE TRIANGLE
               ============================================= */

            case 7:

                this.translate(
                    strength
                );

                break;
        }


        return this;
    }



    /* =====================================================
       MUTATE ONE POINT
       ===================================================== */

    mutatePoint(
        strength = 0.15
    ) {

        const index =
            this.randomPointIndex();


        const point =
            this.points[index];


        /*
         * Mutation range scales with canvas dimensions.
         */

        const deltaX =
            (
                Math.random() * 2 -
                1
            ) *
            this.width *
            strength;


        const deltaY =
            (
                Math.random() * 2 -
                1
            ) *
            this.height *
            strength;


        point.x =
            this.clamp(
                point.x + deltaX,
                0,
                this.width
            );


        point.y =
            this.clamp(
                point.y + deltaY,
                0,
                this.height
            );


        return this;
    }



    /* =====================================================
       MUTATE ONE COORDINATE
       ===================================================== */

    mutateCoordinate(
        axis,
        strength = 0.15
    ) {

        const index =
            this.randomPointIndex();


        const point =
            this.points[index];


        if (
            axis === "x"
        ) {

            const delta =
                (
                    Math.random() * 2 -
                    1
                ) *
                this.width *
                strength;


            point.x =
                this.clamp(
                    point.x + delta,
                    0,
                    this.width
                );

        } else {


            const delta =
                (
                    Math.random() * 2 -
                    1
                ) *
                this.height *
                strength;


            point.y =
                this.clamp(
                    point.y + delta,
                    0,
                    this.height
                );
        }


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
                Math.random() * 2 -
                1
            ) *
            maximumChange;


        return this.clamp(
            value + change,
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
                Math.random() * 2 -
                1
            ) *
            strength;


        this.a =
            this.clamp(
                this.a + change,

                /*
                 * Keeping a tiny minimum opacity prevents
                 * useless completely invisible genes.
                 */

                0.01,

                1
            );


        return this;
    }



    /* =====================================================
       TRANSLATE TRIANGLE
       ===================================================== */

    translate(
        strength = 0.15
    ) {

        const deltaX =
            (
                Math.random() * 2 -
                1
            ) *
            this.width *
            strength;


        const deltaY =
            (
                Math.random() * 2 -
                1
            ) *
            this.height *
            strength;


        /*
         * Work out how far the entire triangle may move
         * without any vertex leaving the canvas.
         */

        let minimumX =
            Infinity;


        let maximumX =
            -Infinity;


        let minimumY =
            Infinity;


        let maximumY =
            -Infinity;


        for (
            const point of
            this.points
        ) {

            minimumX =
                Math.min(
                    minimumX,
                    point.x
                );


            maximumX =
                Math.max(
                    maximumX,
                    point.x
                );


            minimumY =
                Math.min(
                    minimumY,
                    point.y
                );


            maximumY =
                Math.max(
                    maximumY,
                    point.y
                );
        }


        const allowedDeltaX =
            this.clamp(
                deltaX,
                -minimumX,
                this.width -
                maximumX
            );


        const allowedDeltaY =
            this.clamp(
                deltaY,
                -minimumY,
                this.height -
                maximumY
            );


        for (
            const point of
            this.points
        ) {

            point.x +=
                allowedDeltaX;


            point.y +=
                allowedDeltaY;
        }


        return this;
    }



    /* =====================================================
       RANDOMISE ONE POINT
       ===================================================== */

    randomisePoint() {

        const index =
            this.randomPointIndex();


        this.points[index] =
            this.randomPoint();


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

        this.points = [

            this.randomPoint(),

            this.randomPoint(),

            this.randomPoint()

        ];


        this.r =
            this.randomChannel();


        this.g =
            this.randomChannel();


        this.b =
            this.randomChannel();


        this.a =
            this.randomAlpha();


        return this;
    }



    /* =====================================================
       RANDOM POINT INDEX
       ===================================================== */

    randomPointIndex() {

        return Math.floor(
            Math.random() *
            this.points.length
        );
    }



    /* =====================================================
       GET POINTS
       ===================================================== */

    getPoints() {

        return this.points;
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
       SET POINT
       ===================================================== */

    setPoint(
        index,
        x,
        y
    ) {

        if (
            index < 0 ||
            index >=
            this.points.length
        ) {

            return false;
        }


        this.points[index] = {

            x:
                this.clamp(
                    x,
                    0,
                    this.width
                ),

            y:
                this.clamp(
                    y,
                    0,
                    this.height
                )

        };


        return true;
    }



    /* =====================================================
       TRIANGLE AREA
       ===================================================== */

    getArea() {

        const p1 =
            this.points[0];


        const p2 =
            this.points[1];


        const p3 =
            this.points[2];


        /*
         * Shoelace formula.
         */

        return Math.abs(

            (
                p1.x *
                (
                    p2.y -
                    p3.y
                )
            ) +

            (
                p2.x *
                (
                    p3.y -
                    p1.y
                )
            ) +

            (
                p3.x *
                (
                    p1.y -
                    p2.y
                )
            )

        ) / 2;
    }



    /* =====================================================
       CENTRE
       ===================================================== */

    getCentre() {

        return {

            x:
                (
                    this.points[0].x +
                    this.points[1].x +
                    this.points[2].x
                ) / 3,

            y:
                (
                    this.points[0].y +
                    this.points[1].y +
                    this.points[2].y
                ) / 3

        };
    }



    /* =====================================================
       CLONE
       ===================================================== */

    clone() {

        /*
         * Don't call the constructor here because doing so
         * would generate random data that we immediately
         * overwrite.
         */

        const clone =
            Object.create(
                TriangleGene.prototype
            );


        clone.width =
            this.width;


        clone.height =
            this.height;


        clone.points = [

            {
                x:
                    this.points[0].x,

                y:
                    this.points[0].y
            },

            {
                x:
                    this.points[1].x,

                y:
                    this.points[1].y
            },

            {
                x:
                    this.points[2].x,

                y:
                    this.points[2].y
            }

        ];


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
        scalePoints = true
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


        if (scalePoints) {

            const scaleX =
                width /
                this.width;


            const scaleY =
                height /
                this.height;


            for (
                const point of
                this.points
            ) {

                point.x *=
                    scaleX;


                point.y *=
                    scaleY;
            }
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

        for (
            const point of
            this.points
        ) {

            point.x =
                this.clamp(
                    point.x,
                    0,
                    this.width
                );


            point.y =
                this.clamp(
                    point.y,
                    0,
                    this.height
                );
        }


        return this;
    }



    /* =====================================================
       GET WIDTH
       ===================================================== */

    getWidth() {

        return this.width;
    }



    /* =====================================================
       GET HEIGHT
       ===================================================== */

    getHeight() {

        return this.height;
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