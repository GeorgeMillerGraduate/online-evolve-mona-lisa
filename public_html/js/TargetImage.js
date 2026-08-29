/* =========================================================
   MIDLIFE PROGRAMMER
   Evolve Mona Lisa
   TargetImage.js

   Handles the target/reference image used by the
   evolutionary algorithm.

   Responsibilities:

   - Load the default Mona Lisa image
   - Load user-selected images
   - Scale images to the evolution resolution
   - Extract ImageData for fitness evaluation
   - Calculate average target colour
   - Update HTML preview images
   ========================================================= */


class TargetImage {


    /* =====================================================
       CONSTRUCTOR
       ===================================================== */

    constructor(
        width = 480,
        height = 715
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


        /*
         * Internal image object.
         */

        this.image =
            new Image();


        /*
         * Hidden canvas containing the target image at
         * exactly the same resolution used by evolution.
         */

        this.canvas =
            document.createElement(
                "canvas"
            );


        this.canvas.width =
            this.width;


        this.canvas.height =
            this.height;


        this.context =
            this.canvas.getContext(
                "2d",
                {
                    willReadFrequently: true
                }
            );


        if (!this.context) {

            throw new Error(
                "TargetImage could not create a 2D canvas context."
            );
        }


        this.imageData =
            null;


        this.averageColour = {

            r: 0,
            g: 0,
            b: 0

        };


        this.loaded =
            false;


        this.source =
            null;


        this.fileName =
            null;
    }



    /* =====================================================
       LOAD IMAGE FROM URL
       ===================================================== */

    load(source) {

        return new Promise(
            (resolve, reject) => {


                if (!source) {

                    reject(
                        new Error(
                            "No target image source supplied."
                        )
                    );

                    return;
                }


                this.loaded =
                    false;


                const image =
                    new Image();


                /*
                 * Useful if the project later loads images
                 * from a server supporting CORS.
                 *
                 * Do not set crossOrigin for local blob/data
                 * URLs because it isn't required.
                 */

                if (
                    typeof source === "string" &&
                    !source.startsWith("blob:") &&
                    !source.startsWith("data:")
                ) {

                    image.crossOrigin =
                        "anonymous";
                }


                image.onload =
                    () => {

                        try {

                            this.image =
                                image;


                            this.source =
                                source;


                            this.processImage();


                            this.loaded =
                                true;


                            resolve(this);

                        } catch (error) {

                            reject(error);
                        }
                    };


                image.onerror =
                    () => {

                        reject(
                            new Error(
                                "Unable to load target image: " +
                                source
                            )
                        );
                    };


                image.src =
                    source;
            }
        );
    }



    /* =====================================================
       LOAD DEFAULT MONA LISA
       ===================================================== */

    loadDefault() {

        return this.load(
            "images/mona_lisa_web_480px.jpg"
        );
    }



    /* =====================================================
       LOAD FILE
       ===================================================== */

    loadFile(file) {

        return new Promise(
            (resolve, reject) => {


                if (!file) {

                    reject(
                        new Error(
                            "No image file selected."
                        )
                    );

                    return;
                }


                /*
                 * Only allow browser-supported image files.
                 */

                if (
                    file.type &&
                    !file.type.startsWith("image/")
                ) {

                    reject(
                        new Error(
                            "Selected file is not an image."
                        )
                    );

                    return;
                }


                this.fileName =
                    file.name ?? null;


                const objectURL =
                    URL.createObjectURL(
                        file
                    );


                this.load(
                    objectURL
                )
                    .then(
                        () => {

                            /*
                             * The image has already been
                             * decoded and copied into our
                             * canvas, so the temporary blob
                             * URL is no longer required.
                             */

                            URL.revokeObjectURL(
                                objectURL
                            );


                            resolve(this);
                        }
                    )
                    .catch(
                        error => {

                            URL.revokeObjectURL(
                                objectURL
                            );


                            reject(error);
                        }
                    );
            }
        );
    }



    /* =====================================================
       PROCESS IMAGE
       ===================================================== */

    processImage() {

        if (
            !this.image ||
            !this.image.complete
        ) {

            throw new Error(
                "Target image has not finished loading."
            );
        }


        /*
         * Clear old target.
         */

        this.context.clearRect(
            0,
            0,
            this.width,
            this.height
        );


        /*
         * Fill the complete canvas first.
         *
         * This avoids transparent areas if a source image
         * has an unusual aspect ratio.
         */

        this.context.fillStyle =
            "#000000";


        this.context.fillRect(
            0,
            0,
            this.width,
            this.height
        );


        /*
         * Draw using "cover" behaviour.
         *
         * The image fills the entire evolutionary canvas
         * while preserving its original aspect ratio.
         *
         * If the uploaded image has a different aspect
         * ratio, excess material is cropped from the edges.
         */

        this.drawImageCover(
            this.image,
            this.context,
            this.width,
            this.height
        );


        /*
         * Cache the pixel data.
         */

        this.imageData =
            this.context.getImageData(
                0,
                0,
                this.width,
                this.height
            );


        /*
         * Calculate a useful starting background colour.
         */

        this.averageColour =
            this.calculateAverageColour(
                this.imageData
            );
    }



    /* =====================================================
       DRAW IMAGE USING COVER
       ===================================================== */

    drawImageCover(
        image,
        context,
        targetWidth,
        targetHeight
    ) {

        const sourceWidth =
            image.naturalWidth ||
            image.width;


        const sourceHeight =
            image.naturalHeight ||
            image.height;


        if (
            sourceWidth <= 0 ||
            sourceHeight <= 0
        ) {

            throw new Error(
                "Target image has invalid dimensions."
            );
        }


        const sourceRatio =
            sourceWidth /
            sourceHeight;


        const targetRatio =
            targetWidth /
            targetHeight;


        let sourceX =
            0;


        let sourceY =
            0;


        let cropWidth =
            sourceWidth;


        let cropHeight =
            sourceHeight;


        /*
         * Source is wider than target.
         *
         * Crop left/right.
         */

        if (
            sourceRatio >
            targetRatio
        ) {

            cropWidth =
                sourceHeight *
                targetRatio;


            sourceX =
                (
                    sourceWidth -
                    cropWidth
                ) / 2;

        } else {


            /*
             * Source is taller than target.
             *
             * Crop top/bottom.
             */

            cropHeight =
                sourceWidth /
                targetRatio;


            sourceY =
                (
                    sourceHeight -
                    cropHeight
                ) / 2;
        }


        context.drawImage(
            image,

            sourceX,
            sourceY,
            cropWidth,
            cropHeight,

            0,
            0,
            targetWidth,
            targetHeight
        );
    }



    /* =====================================================
       CALCULATE AVERAGE COLOUR
       ===================================================== */

    calculateAverageColour(
        imageData = this.imageData
    ) {

        if (
            !imageData ||
            !imageData.data
        ) {

            return {

                r: 0,
                g: 0,
                b: 0

            };
        }


        const pixels =
            imageData.data;


        let totalRed =
            0;


        let totalGreen =
            0;


        let totalBlue =
            0;


        let count =
            0;


        /*
         * Sampling every fourth pixel is more than
         * sufficient for estimating an average colour and
         * avoids unnecessary work.
         *
         * Each pixel occupies four array entries:
         *
         * R G B A
         *
         * Jumping by 16 therefore examines one out of
         * every four pixels.
         */

        for (
            let i = 0;
            i < pixels.length;
            i += 16
        ) {

            totalRed +=
                pixels[i];


            totalGreen +=
                pixels[i + 1];


            totalBlue +=
                pixels[i + 2];


            count++;
        }


        if (
            count ===
            0
        ) {

            return {

                r: 0,
                g: 0,
                b: 0

            };
        }


        return {

            r:
                Math.round(
                    totalRed /
                    count
                ),

            g:
                Math.round(
                    totalGreen /
                    count
                ),

            b:
                Math.round(
                    totalBlue /
                    count
                )

        };
    }



    /* =====================================================
       GET IMAGE DATA
       ===================================================== */

    getImageData() {

        if (!this.imageData) {

            throw new Error(
                "Target image has not been loaded."
            );
        }


        return this.imageData;
    }



    /* =====================================================
       GET PIXELS
       ===================================================== */

    getPixels() {

        if (!this.imageData) {

            return null;
        }


        return this.imageData.data;
    }



    /* =====================================================
       GET CANVAS
       ===================================================== */

    getCanvas() {

        return this.canvas;
    }



    /* =====================================================
       GET IMAGE
       ===================================================== */

    getImage() {

        return this.image;
    }



    /* =====================================================
       GET AVERAGE COLOUR
       ===================================================== */

    getAverageColour() {

        return {

            r:
                this.averageColour.r,

            g:
                this.averageColour.g,

            b:
                this.averageColour.b

        };
    }



    /* =====================================================
       COPY TARGET TO ANOTHER CANVAS
       ===================================================== */

    drawToCanvas(canvas) {

        if (!canvas) {

            throw new Error(
                "Destination canvas is required."
            );
        }


        const context =
            canvas.getContext(
                "2d"
            );


        if (!context) {

            throw new Error(
                "Destination canvas has no 2D context."
            );
        }


        context.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );


        context.drawImage(
            this.canvas,
            0,
            0,
            canvas.width,
            canvas.height
        );
    }



    /* =====================================================
       UPDATE PREVIEW IMAGE
       ===================================================== */

    updatePreview(
        imageElement
    ) {

        if (!imageElement) {
            return;
        }


        /*
         * Convert the already processed target canvas to a
         * data URL.
         *
         * This means the preview shows exactly the image
         * being scored by FitnessEvaluator, including any
         * cropping performed for uploaded images.
         */

        imageElement.src =
            this.canvas.toDataURL(
                "image/jpeg",
                0.92
            );
    }



    /* =====================================================
       UPDATE ALL PAGE PREVIEWS
       ===================================================== */

    updatePagePreviews() {

        const thumbnail =
            document.getElementById(
                "targetThumbnail"
            );


        const mainPreview =
            document.getElementById(
                "targetImage"
            );


        if (thumbnail) {

            this.updatePreview(
                thumbnail
            );
        }


        if (mainPreview) {

            this.updatePreview(
                mainPreview
            );
        }
    }



    /* =====================================================
       CONNECT FILE INPUT
       ===================================================== */

    connectFileInput(
        inputElement,
        callback = null
    ) {

        if (!inputElement) {

            throw new Error(
                "Image upload input is required."
            );
        }


        inputElement.addEventListener(
            "change",
            async event => {

                const file =
                    event.target
                        .files?.[0];


                if (!file) {
                    return;
                }


                try {

                    await this.loadFile(
                        file
                    );


                    this.updatePagePreviews();


                    if (
                        typeof callback ===
                        "function"
                    ) {

                        callback(
                            this
                        );
                    }

                } catch (error) {

                    console.error(
                        "Unable to load target image:",
                        error
                    );
                }
            }
        );
    }



    /* =====================================================
       RESIZE
       ===================================================== */

    resize(
        width,
        height
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
            width === this.width &&
            height === this.height
        ) {

            return;
        }


        this.width =
            width;


        this.height =
            height;


        this.canvas.width =
            width;


        this.canvas.height =
            height;


        /*
         * If an image is already loaded, redraw it at the
         * new resolution.
         */

        if (
            this.image &&
            this.image.complete &&
            this.image.naturalWidth > 0
        ) {

            this.processImage();
        }
    }



    /* =====================================================
       TARGET -> FITNESS EVALUATOR
       ===================================================== */

    applyToFitnessEvaluator(
        evaluator
    ) {

        if (!evaluator) {

            throw new Error(
                "FitnessEvaluator is required."
            );
        }


        if (!this.imageData) {

            throw new Error(
                "Target image must be loaded first."
            );
        }


        evaluator.setTargetImageData(
            this.imageData
        );


        return evaluator;
    }



    /* =====================================================
       TARGET -> GENOME BACKGROUND
       ===================================================== */

    applyAverageColourToGenome(
        genome
    ) {

        if (!genome) {
            return;
        }


        const colour =
            this.getAverageColour();


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
       STATUS
       ===================================================== */

    isLoaded() {

        return this.loaded;
    }



    /* =====================================================
       DIMENSIONS
       ===================================================== */

    getWidth() {

        return this.width;
    }



    getHeight() {

        return this.height;
    }



    /* =====================================================
       FILE INFORMATION
       ===================================================== */

    getFileName() {

        return this.fileName;
    }



    getSource() {

        return this.source;
    }

}