/* =====================================================
   WPROCESSING WITH BODH
   CAMERA + IMAGE UPLOAD + WASTE ANALYSIS + REWARDS
===================================================== */

let cameraStream = null;
let mobilenetModel = null;
let currentImageSource = null;
let analysisInProgress = false;

/* =====================================================
   MODAL FUNCTIONS
===================================================== */

function openLogin() {
    document.getElementById("loginModal").style.display = "flex";
}

function openScanner() {
    document.getElementById("scannerModal").style.display = "flex";
    startCamera();
    loadWasteModel();
}

function openImpact() {
    document.getElementById("impactModal").style.display = "flex";
}

function openVideo() {
    document.getElementById("videoModal").style.display = "flex";
}

function showHubMessage() {
    document.getElementById("hubModal").style.display = "flex";
}

/* =====================================================
   CLOSE MODALS
===================================================== */

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = "none";
}

function closeCamera() {
    stopCamera();
    closeModal("scannerModal");
}

/* =====================================================
   MODEL LOADING
===================================================== */

async function loadWasteModel() {
    const result = document.getElementById("scannerResult");

    if (mobilenetModel) return mobilenetModel;

    if (typeof mobilenet === "undefined") {
        console.warn("MobileNet library was not loaded.");
        return null;
    }

    try {
        result.innerHTML = `
            <h3>🤖 Loading AI model...</h3>
            <p class="analysis-status">
                Preparing image recognition. This happens once in the browser.
            </p>
        `;

        mobilenetModel = await mobilenet.load({
            version: 2,
            alpha: 1.0
        });

        result.innerHTML = `
            <h3>✅ AI Ready</h3>
            <p class="analysis-status">
                Capture or upload a waste item to start analysis.
            </p>
        `;

        return mobilenetModel;

    } catch (error) {
        console.error("Model loading error:", error);

        result.innerHTML = `
            <h3>⚠️ AI model could not load</h3>
            <p class="analysis-status">
                Check your internet connection and reload the page.
            </p>
        `;

        return null;
    }
}

/* =====================================================
   LIVE CAMERA
===================================================== */

async function startCamera() {

    const video = document.getElementById("cameraVideo");
    const result = document.getElementById("scannerResult");
    const canvas = document.getElementById("capturedCanvas");
    const retakeButton = document.getElementById("retakeButton");

    if (!video || !result || !canvas || !retakeButton) {
        console.error("Scanner HTML elements are missing.");
        return;
    }

    try {

        stopCamera();

        if (
            !navigator.mediaDevices ||
            !navigator.mediaDevices.getUserMedia
        ) {
            throw new Error("Camera API is not supported.");
        }

        cameraStream =
            await navigator.mediaDevices.getUserMedia({

                video: {
                    facingMode: {
                        ideal: "environment"
                    },

                    width: {
                        ideal: 1280
                    },

                    height: {
                        ideal: 720
                    }
                },

                audio: false
            });

        video.srcObject = cameraStream;

        video.style.display = "block";
        canvas.style.display = "none";
        retakeButton.style.display = "none";

        result.innerHTML = `
            <h3>📷 Camera Ready</h3>

            <p class="analysis-status">
                Position one waste item inside the frame
                and click <strong>Capture Waste</strong>.
            </p>
        `;

        loadWasteModel();

    } catch (error) {

        console.error(error);

        result.innerHTML = `
            <h3>⚠️ Camera Access Problem</h3>

            <p class="analysis-status">
                Camera could not be opened.
                You can still use
                <strong>Choose Waste Image</strong>.
            </p>

            <p class="analysis-warning">
                Allow camera permission if you want live scanning.
            </p>
        `;
    }
}

/* =====================================================
   STOP CAMERA
===================================================== */

function stopCamera() {

    if (cameraStream) {

        cameraStream
            .getTracks()
            .forEach(function(track) {

                track.stop();

            });

        cameraStream = null;
    }

    const video =
        document.getElementById("cameraVideo");

    if (video) {
        video.srcObject = null;
    }
}

/* =====================================================
   CAPTURE WASTE PHOTO
===================================================== */

async function captureWaste() {

    const video =
        document.getElementById("cameraVideo");

    const canvas =
        document.getElementById("capturedCanvas");

    const result =
        document.getElementById("scannerResult");

    const retakeButton =
        document.getElementById("retakeButton");

    if (!video || !canvas || !result || !retakeButton) {
        return;
    }

    if (!video.videoWidth || !video.videoHeight) {

        result.innerHTML = `
            <h3>⚠️ Camera Not Ready</h3>

            <p class="analysis-status">
                Please wait a moment for the camera to start.
            </p>
        `;

        return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context =
        canvas.getContext("2d");

    context.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height
    );

    canvas.style.display = "block";
    video.style.display = "none";

    retakeButton.style.display = "block";

    currentImageSource = canvas;

    stopCamera();

    await analyseWasteImage(canvas);
}

/* =====================================================
   RETAKE PHOTO
===================================================== */

function retakeWaste() {

    const video =
        document.getElementById("cameraVideo");

    const canvas =
        document.getElementById("capturedCanvas");

    const retakeButton =
        document.getElementById("retakeButton");

    if (canvas) {
        canvas.style.display = "none";
    }

    if (video) {
        video.style.display = "block";
    }

    if (retakeButton) {
        retakeButton.style.display = "none";
    }

    currentImageSource = null;

    startCamera();
}

/* =====================================================
   IMAGE UPLOAD
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const input =
            document.getElementById("wasteImage");

        if (!input) return;

        input.addEventListener(
            "change",
            function (event) {

                const file =
                    event.target.files &&
                    event.target.files[0];

                if (!file) return;

                if (!file.type.startsWith("image/")) {

                    alert(
                        "Please choose an image file."
                    );

                    input.value = "";

                    return;
                }

                const image =
                    new Image();

                const objectUrl =
                    URL.createObjectURL(file);

                image.onload =
                    async function () {

                        URL.revokeObjectURL(
                            objectUrl
                        );

                        currentImageSource =
                            image;

                        stopCamera();

                        const video =
                            document.getElementById(
                                "cameraVideo"
                            );

                        const canvas =
                            document.getElementById(
                                "capturedCanvas"
                            );

                        const retakeButton =
                            document.getElementById(
                                "retakeButton"
                            );

                        if (video) {
                            video.style.display =
                                "none";
                        }

                        if (canvas) {
                            canvas.style.display =
                                "none";
                        }

                        if (retakeButton) {
                            retakeButton.style.display =
                                "none";
                        }

                        await analyseWasteImage(
                            image
                        );
                    };

                image.onerror =
                    function () {

                        URL.revokeObjectURL(
                            objectUrl
                        );

                        document.getElementById(
                            "scannerResult"
                        ).innerHTML = `

                            <h3>⚠️ Image Error</h3>

                            <p class="analysis-status">
                                This image could not be opened.
                                Please try another image.
                            </p>
                        `;
                    };

                image.src = objectUrl;
            }
        );
    }
);

/* =====================================================
   WASTE ANALYSIS
===================================================== */

async function analyseWasteImage(imageElement) {

    const result =
        document.getElementById(
            "scannerResult"
        );

    if (!result || !imageElement) {
        return;
    }

    if (analysisInProgress) {
        return;
    }

    analysisInProgress = true;

    try {

        result.innerHTML = `

            <h3>🤖 Analysing Waste...</h3>

            <p class="analysis-status">
                AI is examining the image and preparing
                segregation guidance.
            </p>

            <div class="loading-bar"></div>
        `;

        const model =
            await loadWasteModel();

        if (!model) {

            showFallbackResult(
                "AI model unavailable"
            );

            return;
        }

        const predictions =
            await model.classify(
                imageElement,
                5
            );

        const wasteInfo =
            inferWasteInfo(
                predictions
            );

        showWasteResult(
            wasteInfo,
            predictions
        );

    } catch (error) {

        console.error(
            "Waste analysis failed:",
            error
        );

        showFallbackResult(
            "Image could not be analysed"
        );

    } finally {

        analysisInProgress = false;
    }
}

/* =====================================================
   WASTE CLASSIFICATION RULES
===================================================== */

function inferWasteInfo(predictions) {

    const labels =
        predictions.map(function (p) {

            return p.className.toLowerCase();

        });

    const joined =
        labels.join(" ");

    const rules = [

        {
            keys: [
                "water bottle",
                "pop bottle",
                "plastic bottle",
                "pill bottle",
                "milk can"
            ],

            material:
                "Plastic bottle",

            category:
                "Recyclable",

            reusable:
                "Condition dependent",

            segregation:
                "Dry waste",

            route:
                "Plastic recycling stream",

            advice:
                "Empty, rinse and dry the bottle. Reuse it only when it is clean and suitable for reuse."
        },

        {
            keys: [
                "can",
                "tin",
                "beer bottle",
                "wine bottle",
                "bottle"
            ],

            material:
                joined.includes("bottle")
                    ? "Bottle / container"
                    : "Metal can",

            category:
                "Recyclable",

            reusable:
                "Usually yes, after cleaning",

            segregation:
                "Dry waste",

            route:
                "Metal / glass recycling stream",

            advice:
                "Keep the item empty and clean; separate glass and metal from wet waste."
        },

        {
            keys: [
                "carton",
                "paper towel",
                "toilet tissue",
                "notebook",
                "book jacket",
                "envelope"
            ],

            material:
                "Paper / cardboard",

            category:
                "Recyclable when clean",

            reusable:
                "Sometimes",

            segregation:
                "Dry waste",

            route:
                "Paper recycling stream",

            advice:
                "Keep paper dry. Food-soiled or heavily contaminated paper may not be recyclable."
        },

        {
            keys: [
                "banana",
                "apple",
                "orange",
                "lemon",
                "pineapple",
                "granny smith"
            ],

            material:
                "Food / organic waste",

            category:
                "Not recyclable",

            reusable:
                "No",

            segregation:
                "Wet waste",

            route:
                "Composting / organic processing",

            advice:
                "Put food and fruit waste into the wet-waste or composting stream."
        },

        {
            keys: [
                "cup",
                "coffee mug",
                "plate",
                "mixing bowl",
                "pot",
                "spatula"
            ],

            material:
                "Reusable household item",

            category:
                "Potentially reusable",

            reusable:
                "Yes, if intact and clean",

            segregation:
                "Check local dry-waste rules",

            route:
                "Reuse first; otherwise appropriate material stream",

            advice:
                "Prefer reuse or donation before recycling. Recyclability depends on the actual material."
        }
    ];

    for (
        const rule of rules
    ) {

        if (
            rule.keys.some(
                function (key) {

                    return joined.includes(
                        key
                    );

                }
            )
        ) {

            return rule;
        }
    }

    return {

        material:
            predictions[0]
                ? predictions[0].className
                : "Unknown item",

        category:
            "Needs verification",

        reusable:
            "Check condition",

        segregation:
            "Check local rules",

        route:
            "Manual sorting required",

        advice:
            "The image model recognised the object, but its material is uncertain. Verify the material before disposal."
    };
}

/* =====================================================
   SHOW RESULT
===================================================== */

function showWasteResult(
    wasteInfo,
    predictions
) {

    const result =
        document.getElementById(
            "scannerResult"
        );

    if (!result) return;

    const topPrediction =
        predictions &&
        predictions[0];

    const confidence =
        topPrediction

            ? Math.round(
                topPrediction.probability * 100
            ) + "%"

            : "—";

    result.innerHTML = `

        <h3>🤖 Waste Analysis Result</h3>

        <div class="analysis-grid">

            <div class="analysis-item">

                <small>
                    Detected item
                </small>

                <strong>
                    ${escapeHtml(
                        wasteInfo.material
                    )}
                </strong>

            </div>


            <div class="analysis-item">

                <small>
                    Recyclable?
                </small>

                <strong>
                    ${escapeHtml(
                        wasteInfo.category
                    )}
                </strong>

            </div>


            <div class="analysis-item">

                <small>
                    Reusable?
                </small>

                <strong>
                    ${escapeHtml(
                        wasteInfo.reusable
                    )}
                </strong>

            </div>


            <div class="analysis-item">

                <small>
                    Segregation
                </small>

                <strong>
                    ${escapeHtml(
                        wasteInfo.segregation
                    )}
                </strong>

            </div>

        </div>


        <div class="analysis-recommendation">

            <strong>
                📍 Recommended route:
            </strong>

            <br>

            ${escapeHtml(
                wasteInfo.route
            )}

            <br><br>

            <strong>
                💡 What to do:
            </strong>

            <br>

            ${escapeHtml(
                wasteInfo.advice
            )}

        </div>


        <p class="analysis-warning">

            Prototype confidence:
            ${confidence}

            <br>

            Material-specific recycling rules
            can vary by local facility.

        </p>


        <div class="reward-earned">

            🏆 +5 BODH Points Earned!

        </div>
    `;

    addPoints(5);
}

/* =====================================================
   FALLBACK RESULT
===================================================== */

function showFallbackResult(reason) {

    const result =
        document.getElementById(
            "scannerResult"
        );

    if (!result) return;

    result.innerHTML = `

        <h3>
            🔍 Manual Verification Needed
        </h3>

        <div class="analysis-grid">

            <div class="analysis-item">

                <small>
                    Recyclable?
                </small>

                <strong>
                    Cannot confirm
                </strong>

            </div>


            <div class="analysis-item">

                <small>
                    Reusable?
                </small>

                <strong>
                    Check condition
                </strong>

            </div>


            <div class="analysis-item">

                <small>
                    Segregation
                </small>

                <strong>
                    Keep dry and separate
                </strong>

            </div>


            <div class="analysis-item">

                <small>
                    Status
                </small>

                <strong>
                    ${escapeHtml(reason)}
                </strong>

            </div>

        </div>


        <div class="analysis-recommendation">

            Check the item's material label
            and follow your local waste collection rules.

        </div>
    `;
}

/* =====================================================
   SECURITY HELPER
===================================================== */

function escapeHtml(value) {

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );
}

/* =====================================================
   REWARD SYSTEM
===================================================== */

function addPoints(amount) {

    const pointsElement =
        document.getElementById(
            "points"
        );

    if (!pointsElement) {
        return;
    }

    let currentPoints =
        parseInt(
            pointsElement.innerText,
            10
        ) || 0;

    currentPoints += amount;

    pointsElement.innerText =
        currentPoints;
}

/* =====================================================
   LOGIN
===================================================== */

function loginUser() {

    const username =
        document.getElementById(
            "username"
        ).value.trim();

    const password =
        document.getElementById(
            "password"
        ).value.trim();

    if (
        username === "" ||
        password === ""
    ) {

        alert(
            "Please enter username and password."
        );

        return;
    }

    alert(
        "Welcome " +
        username +
        "! Your BODH dashboard is ready."
    );

    closeModal(
        "loginModal"
    );
}

/* =====================================================
   CLICK OUTSIDE MODAL
===================================================== */

window.addEventListener(
    "click",
    function (event) {

        const modals =
            document.querySelectorAll(
                ".modal"
            );

        modals.forEach(
            function (modal) {

                if (
                    event.target === modal
                ) {

                    if (
                        modal.id ===
                        "scannerModal"
                    ) {

                        closeCamera();

                    } else {

                        modal.style.display =
                            "none";
                    }
                }
            }
        );
    }
);

/* =====================================================
   ESCAPE KEY
===================================================== */

document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Escape"
        ) {

            document
                .querySelectorAll(
                    ".modal"
                )
                .forEach(
                    function (modal) {

                        modal.style.display =
                            "none";

                    }
                );

            stopCamera();
        }
    }
);
