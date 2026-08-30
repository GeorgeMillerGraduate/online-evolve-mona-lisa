/* =========================================================
   MIDLIFE PROGRAMMER
   Evolve Mona Lisa
   TriangleGene.js

   Represents one translucent triangle in a Genome.

   Coordinates are stored in canonical canvas pixels.

   Provides a common interface with CircleGene and DotGene
   for:

   - mutation
   - cloning
   - error-guided movement
   - target-colour assignment
   - dimension scaling
   - JSON import/export
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


        this.type =
            "triangle";


        this.width =
            Math.max(
                1,
                Math.floor(
                    Number(width) || 480
                )
            );


        this.height =
            Math.max(
                1,
                Math.floor(
                    Number(height) || 715
                )
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
         * Semi-transparent geometry allows many shapes to
         * blend into intermediate colours.
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
            Math.random() *
            256
        );
    }



    /* =====================================================
       RANDOM ALPHA
       ===================================================== */

    randomAlpha() {

        return (
            0.05 +
            Math.random() *
            0.45
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
                Number(strength) || 0.15,
                0.001,
                1
            );


        const mutationType =
            Math.floor(
                Math.random() *
                8
            );


        switch (
            mutationType
        ) {

            /* =============================================
               MOVE ONE VERTEX
               ============================================= */

            case 0:

                this.mutatePoint(
                    strength
                );

                break;


            /* =============================================
               X COORDINATE
               ============================================= */

            case 1:

                this.mutateCoordinate(
                    "x",
                    strength
                );

                break;


            /* =============================================
               Y COORDINATE
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


        const deltaX =
            this.randomSigned() *
            this.width *
            strength;


        const deltaY =
            this.randomSigned() *
            this.height *
            strength;


        point.x =
            this.clamp(
                point.x +
                deltaX,
                0,
                this.width
            );


        point.y =
            this.clamp(
                point.y +
                deltaY,
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
            axis ===
            "x"
        ) {

            point.x =
                this.clamp(
                    point.x +
                    this.randomSigned() *
                    this.width *
                    strength,
                    0,
                    this.width
                );

        } else {

            point.y =
                this.clamp(
                    point.y +
                    this.randomSigned() *
                    this.height *
                    strength,
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


        return this.clamp(
            value +
            this.randomSigned() *
            maximumChange,
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

        this.a =
            this.clamp(
                this.a +
                this.randomSigned() *
                strength,
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
            this.randomSigned() *
            this.width *
            strength;


        const deltaY =
            this.randomSigned() *
            this.height *
            strength;


        return this.translateBy(
            deltaX,
            deltaY
        );
    }



    /* =====================================================
       TRANSLATE BY PIXELS

       Moves all three vertices while keeping the entire
       triangle inside the canvas.
       ===================================================== */

    translateBy(
        deltaX,
        deltaY
    ) {

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
       MOVE CENTRE TO POSITION
       ===================================================== */

    moveTo(
        x,
        y
    ) {

        const centre =
            this.getCentre();


        return this.translateBy(
            x -
            centre.x,
            y -
            centre.y
        );
    }



    /* =====================================================
       MOVE NEAR POSITION

       Common interface shared with CircleGene and DotGene.

       spread is expressed as a fraction of canvas size.
       ===================================================== */

    moveNear(
        x,
        y,
        spread = 0.10
    ) {

        spread =
            this.clamp(
                Number(spread) || 0,
                0,
                1
            );


        const targetX =
            Number(x) +
            this.randomSigned() *
            this.width *
            spread;


        const targetY =
            Number(y) +
            this.randomSigned() *
            this.height *
            spread;


        return this.moveTo(
            this.clamp(
                targetX,
                0,
                this.width
            ),
            this.clamp(
                targetY,
                0,
                this.height
            )
        );
    }



    /* =====================================================
       MOVE TOWARD POSITION

       Useful for guided evolution when we want to retain
       some of the triangle's existing placement.
       ===================================================== */

    moveToward(
        x,
        y,
        amount = 0.5
    ) {

        amount =
            this.clamp(
                Number(amount) || 0,
                0,
                1
            );


        const centre =
            this.getCentre();


        const targetX =
            centre.x +
            (
                Number(x) -
                centre.x
            ) *
            amount;


        const targetY =
            centre.y +
            (
                Number(y) -
                centre.y
            ) *
            amount;


        return this.moveTo(
            targetX,
            targetY
        );
    }



    /* =====================================================
       SET TARGET COLOUR

       Used by error-guided evolution.

       variation introduces a small random offset so guided
       mutations do not all produce identical colours.
       ===================================================== */

    setTargetColour(
        colour,
        variation = 20
    ) {

        if (!colour) {

            return this;
        }


        variation =
            Math.max(
                0,
                Number(variation) || 0
            );


        const vary =
            value =>
                this.clamp(
                    Number(value) +
                    this.randomSigned() *
                    variation,
                    0,
                    255
                );


        this.r =
            vary(
                colour.r ?? this.r
            );


        this.g =
            vary(
                colour.g ?? this.g
            );


        this.b =
            vary(
                colour.b ?? this.b
            );


        return this;
    }



    /* =====================================================
       BLEND TOWARD TARGET COLOUR
       ===================================================== */

    blendTowardColour(
        colour,
        amount = 0.5
    ) {

        if (!colour) {

            return this;
        }


        amount =
            this.clamp(
                Number(amount) || 0,
                0,
                1
            );


        this.r =
            this.mixChannel(
                this.r,
                colour.r ?? this.r,
                amount
            );


        this.g =
            this.mixChannel(
                this.g,
                colour.g ?? this.g,
                amount
            );


        this.b =
            this.mixChannel(
                this.b,
                colour.b ?? this.b,
                amount
            );


        return this;
    }



    /* =====================================================
       MIX CHANNEL
       ===================================================== */

    mixChannel(
        current,
        target,
        amount
    ) {

        return this.clamp(
            current +
            (
                target -
                current
            ) *
            amount,
            0,
            255
        );
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
       RANDOMISE POSITION

       Moves the existing triangle to a random centre while
       retaining its shape where canvas boundaries permit.
       ===================================================== */

    randomisePosition() {

        return this.moveTo(
            Math.random() *
            this.width,
            Math.random() *
            this.height
        );
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


        this.randomiseColour();


        this.randomiseAlpha();


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
       GET POSITION

       For compatibility with CircleGene/DotGene, triangle
       position means its centre.
       ===================================================== */

    getPosition() {

        return this.getCentre();
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

        /*
         * Also support:
         *
         * setColour({
         *     r: ...,
         *     g: ...,
         *     b: ...,
         *     a: ...
         * });
         */

        if (
            typeof r ===
            "object"
        ) {

            const colour =
                r;


            r =
                colour.r ??
                this.r;


            g =
                colour.g ??
                this.g;


            b =
                colour.b ??
                this.b;


            a =
                colour.a ??
                this.a;
        }


        this.r =
            this.clamp(
                Number(r) || 0,
                0,
                255
            );


        this.g =
            this.clamp(
                Number(g) || 0,
                0,
                255
            );


        this.b =
            this.clamp(
                Number(b) || 0,
                0,
                255
            );


        this.a =
            this.clamp(
                Number(a),
                0.01,
                1
            );


        return this;
    }



    /* =====================================================
       AMERICAN SPELLING ALIAS
       ===================================================== */

    setColor(
        ...argumentsList
    ) {

        return this.setColour(
            ...argumentsList
        );
    }



    /* =====================================================
       SET POINT
       ===================================================== */

    setPoint(
        index,
        x,
        y
    ) {

        index =
            Math.floor(
                Number(index)
            );


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
                    Number(x) || 0,
                    0,
                    this.width
                ),

            y:
                this.clamp(
                    Number(y) || 0,
                    0,
                    this.height
                )

        };


        return true;
    }



    /* =====================================================
       SET POINTS
       ===================================================== */

    setPoints(points) {

        if (
            !Array.isArray(points) ||
            points.length <
            3
        ) {

            return false;
        }


        for (
            let i = 0;
            i < 3;
            i++
        ) {

            this.setPoint(
                i,
                points[i].x,
                points[i].y
            );
        }


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
       BOUNDING BOX
       ===================================================== */

    getBounds() {

        const xs =
            this.points.map(
                point =>
                    point.x
            );


        const ys =
            this.points.map(
                point =>
                    point.y
            );


        const minimumX =
            Math.min(
                ...xs
            );


        const maximumX =
            Math.max(
                ...xs
            );


        const minimumY =
            Math.min(
                ...ys
            );


        const maximumY =
            Math.max(
                ...ys
            );


        return {

            x:
                minimumX,

            y:
                minimumY,

            width:
                maximumX -
                minimumX,

            height:
                maximumY -
                minimumY,

            minX:
                minimumX,

            maxX:
                maximumX,

            minY:
                minimumY,

            maxY:
                maximumY

        };
    }



    /* =====================================================
       CLONE
       ===================================================== */

    clone() {

        const clone =
            Object.create(
                TriangleGene.prototype
            );


        clone.type =
            "triangle";


        clone.width =
            this.width;


        clone.height =
            this.height;


        clone.points =
            this.points.map(
                point => ({

                    x:
                        point.x,

                    y:
                        point.y

                })
            );


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
                Math.floor(
                    Number(width) || 1
                )
            );


        height =
            Math.max(
                1,
                Math.floor(
                    Number(height) || 1
                )
            );


        if (
            scalePoints &&
            this.width > 0 &&
            this.height > 0
        ) {

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
       CSS COLOUR
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
       JSON EXPORT

       Shape order is handled by Genome. This object only
       serialises this triangle's own state.
       ===================================================== */

    toJSON() {

        return {

            type:
                "triangle",

            points:
                this.points.map(
                    point => ({

                        x:
                            point.x,

                        y:
                            point.y

                    })
                ),

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
       JSON IMPORT
       ===================================================== */

    static fromJSON(
        data,
        width = 480,
        height = 715
    ) {

        if (!data) {

            throw new Error(
                "TriangleGene.fromJSON requires triangle data."
            );
        }


        /*
         * Allow dimensions to be stored in the data as
         * well as supplied by Genome.
         */

        width =
            Number(
                data.width ??
                width
            ) ||
            480;


        height =
            Number(
                data.height ??
                height
            ) ||
            715;


        const triangle =
            new TriangleGene({

                width:
                    width,

                height:
                    height

            });


        triangle.type =
            "triangle";


        const sourcePoints =
            data.points ??
            data.vertices;


        if (
            Array.isArray(
                sourcePoints
            ) &&
            sourcePoints.length >=
            3
        ) {

            triangle.points =
                sourcePoints
                    .slice(
                        0,
                        3
                    )
                    .map(
                        point => ({

                            x:
                                triangle.clamp(
                                    Number(
                                        point.x
                                    ) || 0,
                                    0,
                                    triangle.width
                                ),

                            y:
                                triangle.clamp(
                                    Number(
                                        point.y
                                    ) || 0,
                                    0,
                                    triangle.height
                                )

                        })
                    );
        }


        triangle.r =
            triangle.clamp(
                Number(
                    data.r
                ) || 0,
                0,
                255
            );


        triangle.g =
            triangle.clamp(
                Number(
                    data.g
                ) || 0,
                0,
                255
            );


        triangle.b =
            triangle.clamp(
                Number(
                    data.b
                ) || 0,
                0,
                255
            );


        /*
         * Do not use:
         *
         * Number(data.a) || default
         *
         * because an explicit zero should be handled
         * deliberately rather than treated as missing.
         */

        const alpha =
            Number(
                data.a
            );


        triangle.a =
            triangle.clamp(
                Number.isFinite(
                    alpha
                )
                    ? alpha
                    : 0.1,
                0.01,
                1
            );


        triangle.constrainToCanvas();


        return triangle;
    }



    /* =====================================================
       RANDOM SIGNED NUMBER
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