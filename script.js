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

let lastScannedWasteInfo = null;
let totalScansCount = parseInt(localStorage.getItem('bodh_scans') || '12', 10);

function showWasteResult(
    wasteInfo,
    predictions
) {

    const result =
        document.getElementById(
            "scannerResult"
        );

    if (!result) return;

    lastScannedWasteInfo = wasteInfo;
    totalScansCount++;
    localStorage.setItem('bodh_scans', totalScansCount);

    const topPrediction =
        predictions &&
        predictions[0];

    const confidenceValue =
        topPrediction ? Math.round(topPrediction.probability * 100) : 0;

    const confidence =
        topPrediction ? confidenceValue + "%" : "—";

    const isLowConfidence = confidenceValue < 45;

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

            AI prediction confidence:
            ${confidence}

            <br>

            ${isLowConfidence ? '⚠️ AI confidence is low. Please verify material before disposal.' : 'Note: AI prediction provides assistance. Verify material before final disposal.'}

        </p>


        <div class="scanner-action-bar">
            <button
                type="button"
                class="primary-btn"
                onclick="showImpactMirror(lastScannedWasteInfo)">
                🌍 View Impact Mirror
            </button>

            <button
                type="button"
                class="outline-btn"
                onclick="openReportModal('${escapeHtml(wasteInfo.material)}')">
                🚨 Report Waste Hotspot
            </button>
        </div>


        <div class="reward-earned">

            🏆 +5 BODH Points Earned!

        </div>
    `;

    addPoints(5);
    renderDashboardReports();

    // PHASE 1 REQUIREMENT: Impact Mirror automatically opens after AI result
    setTimeout(function() {
        showImpactMirror(wasteInfo);
    }, 850);
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

/* =====================================================
   IMPACT MIRROR
===================================================== */

function showImpactMirror(wasteInfo) {

    const modal =
        document.getElementById(
            "impactMirrorModal"
        );

    const wasteName =
        document.getElementById(
            "impactWasteName"
        );

    const actionTitle =
        document.getElementById(
            "impactActionTitle"
        );

    const actionText =
        document.getElementById(
            "impactActionText"
        );

    const route =
        document.getElementById(
            "impactRouteText"
        );

    if (!modal) {
        return;
    }


    /* ---------------------------------------------
       WASTE NAME
    --------------------------------------------- */

    if (wasteName) {

        wasteName.innerText =
            wasteInfo.material ||
            "Waste item";
    }


    /* ---------------------------------------------
       PROCESSING ROUTE
    --------------------------------------------- */

    if (route) {

        route.innerText =
            wasteInfo.route ||
            "Manual verification";
    }


    /* ---------------------------------------------
       ACTION
    --------------------------------------------- */

    if (actionTitle) {

        actionTitle.innerText =
            getImpactActionTitle(
                wasteInfo
            );
    }


    if (actionText) {

        actionText.innerText =
            getImpactActionText(
                wasteInfo
            );
    }


    /* ---------------------------------------------
       OPEN MODAL
    --------------------------------------------- */

    modal.style.display =
        "flex";
}


/* =====================================================
   IMPACT ACTION TITLE
===================================================== */

function getImpactActionTitle(
    wasteInfo
) {

    const category =
        String(
            wasteInfo.category || ""
        ).toLowerCase();


    if (
        category.includes(
            "recycl"
        )
    ) {

        return (
            "Don't mix it with wet waste."
        );
    }


    if (
        category.includes(
            "compost"
        ) ||
        String(
            wasteInfo.segregation || ""
        )
        .toLowerCase()
        .includes(
            "wet"
        )
    ) {

        return (
            "Keep it in the wet-waste stream."
        );
    }


    if (
        String(
            wasteInfo.material || ""
        )
        .toLowerCase()
        .includes(
            "battery"
        )
    ) {

        return (
            "Keep batteries separate from household waste."
        );
    }


    if (
        category.includes(
            "reusable"
        )
    ) {

        return (
            "Reuse before you dispose."
        );
    }


    return (
        "Verify the material before disposal."
    );
}


/* =====================================================
   IMPACT ACTION TEXT
===================================================== */

function getImpactActionText(
    wasteInfo
) {

    const material =
        String(
            wasteInfo.material || ""
        ).toLowerCase();


    if (
        material.includes(
            "battery"
        )
    ) {

        return (
            "Do not place batteries in regular household waste. Keep them separate and use an appropriate collection or take-back option."
        );
    }


    if (
        String(
            wasteInfo.segregation || ""
        )
        .toLowerCase()
        .includes(
            "wet"
        )
    ) {

        return (
            "Keep organic material separate from dry recyclables and use the appropriate wet-waste or composting route."
        );
    }


    if (
        String(
            wasteInfo.category || ""
        )
        .toLowerCase()
        .includes(
            "recycl"
        )
    ) {

        return (
            "Keep the material clean and dry and send it through the appropriate recycling or dry-waste collection channel."
        );
    }


    if (
        String(
            wasteInfo.reusable || ""
        )
        .toLowerCase()
        .includes(
            "yes"
        )
    ) {

        return (
            "If the item is still usable, prefer reuse, repair or donation before sending it for recycling."
        );
    }


    return (
        "The AI result needs material verification. Check the item before deciding its final disposal route."
    );
}

/* =====================================================
   STATE MANAGEMENT & LOCAL STORAGE
===================================================== */

let userReports = null;

try {
    userReports = JSON.parse(localStorage.getItem('bodh_reports') || 'null');
} catch (e) {
    userReports = null;
}

if (!userReports || !Array.isArray(userReports) || userReports.length === 0) {
    userReports = [
        {
            id: 'R-101',
            category: 'Floating Solid Waste',
            isFloating: true,
            location: 'Yamuna Riverbank / Sector 15 Bridge',
            severity: 'High',
            description: 'Visible floating plastic bottles and packaging accumulating near riverbank drainage.',
            image: 'PIB.jpeg',
            timestamp: '10:30 AM, Today',
            status: 'Assigned',
            assignedVehicle: 'River Skimmer Unit #02 (Water Debris Route)',
            beforeImage: 'PIB.jpeg',
            afterImage: 'tech.jpeg'
        },
        {
            id: 'R-102',
            category: 'Plastic Waste',
            isFloating: false,
            location: 'Sector 12 Commercial Market',
            severity: 'Medium',
            description: 'Overflowing dry recycling bin with unsegregated plastic containers.',
            image: 'SWATCH BHARAT.jpeg',
            timestamp: 'Yesterday',
            status: 'Resolved',
            assignedVehicle: 'Dry Recyclables Route Truck #04',
            beforeImage: 'SWATCH BHARAT.jpeg',
            afterImage: 'tech.jpeg'
        }
    ];
    saveReports();
}

function saveReports() {
    try {
        localStorage.setItem('bodh_reports', JSON.stringify(userReports));
    } catch (e) {
        console.warn("LocalStorage save failed:", e);
    }
}

/* =====================================================
   HOTSPOT REPORTING (PHASE 4 & 5)
===================================================== */

let currentAttachedPhoto = null;

function openReportModal(prefillCategory) {
    const modal = document.getElementById("reportModal");
    if (!modal) return;

    if (prefillCategory) {
        const categorySelect = document.getElementById("reportCategory");
        if (categorySelect) {
            const catLower = prefillCategory.toLowerCase();
            if (catLower.includes("plastic") || catLower.includes("bottle")) {
                categorySelect.value = "Plastic Waste";
            } else if (catLower.includes("food") || catLower.includes("organic") || catLower.includes("banana") || catLower.includes("fruit")) {
                categorySelect.value = "Organic / Wet Waste";
            } else if (catLower.includes("battery") || catLower.includes("e-waste")) {
                categorySelect.value = "E-Waste / Batteries";
            } else {
                categorySelect.value = "Mixed Dumped Waste";
            }
        }
    }

    // Attach current captured canvas if present
    const canvas = document.getElementById("capturedCanvas");
    const previewContainer = document.getElementById("reportImagePreviewContainer");
    if (canvas && canvas.style.display !== "none" && previewContainer) {
        try {
            currentAttachedPhoto = canvas.toDataURL("image/jpeg", 0.8);
            previewContainer.innerHTML = `<img src="${currentAttachedPhoto}" alt="Scanned waste" class="report-preview-img">`;
        } catch (err) {
            console.log("Canvas photo capture fallback:", err);
        }
    }

    modal.style.display = "flex";
}

function useCurrentLocation() {
    const locInput = document.getElementById("reportLocation");
    if (!locInput) return;

    locInput.value = "Getting GPS location...";

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function (position) {
                const lat = position.coords.latitude.toFixed(4);
                const lng = position.coords.longitude.toFixed(4);
                locInput.value = `GPS: ${lat}, ${lng} (Near Current Location)`;
            },
            function (error) {
                console.warn("Geolocation failed:", error);
                locInput.value = "Sector 12 Main Road / Riverbank Bridge";
                alert("Geolocation permission unavailable. A sample location was auto-filled.");
            },
            { timeout: 8000 }
        );
    } else {
        locInput.value = "Sector 12 Main Road / Riverbank Bridge";
    }
}

function previewReportImage(event) {
    const file = event.target.files && event.target.files[0];
    const previewContainer = document.getElementById("reportImagePreviewContainer");

    if (!file || !previewContainer) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        currentAttachedPhoto = e.target.result;
        previewContainer.innerHTML = `<img src="${currentAttachedPhoto}" alt="Uploaded photo" class="report-preview-img">`;
    };
    reader.readAsDataURL(file);
}

function handleReportSubmit(event) {
    event.preventDefault();

    const category = document.getElementById("reportCategory").value;
    const isFloating = document.getElementById("isFloatingWaste").checked;
    const location = document.getElementById("reportLocation").value;
    const severity = document.getElementById("reportSeverity").value;
    const description = document.getElementById("reportDescription").value || "Misplaced waste hotspot reported by citizen.";

    const reportId = "R-" + Math.floor(100 + Math.random() * 900);

    const newReport = {
        id: reportId,
        category: isFloating ? "Floating Solid Waste" : category,
        isFloating: isFloating,
        location: location,
        severity: severity,
        description: description,
        image: currentAttachedPhoto || (isFloating ? "PIB.jpeg" : "SWATCH BHARAT.jpeg"),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ", Today",
        status: "Reported",
        assignedVehicle: null,
        beforeImage: currentAttachedPhoto || (isFloating ? "PIB.jpeg" : "SWATCH BHARAT.jpeg"),
        afterImage: null
    };

    userReports.unshift(newReport);
    saveReports();

    addPoints(15);
    renderDashboardReports();

    closeModal("reportModal");

    // Launch Smart Response Opportunity Routing Demonstration
    setTimeout(function () {
        openRoutingModal(newReport);
    }, 400);
}

/* =====================================================
   SMART RESPONSE / ROUTE OPPORTUNITY (PHASE 6)
===================================================== */

function openRoutingModal(report) {
    const modal = document.getElementById("routingModal");
    const container = document.getElementById("routingMatchContainer");

    if (!modal || !container) return;

    // Simulate opportunity routing matching
    let vehicleName = "";
    let distance = "";
    let capacity = "";

    if (report.isFloating) {
        vehicleName = "River Skimmer Unit #02 (Water Debris Team)";
        distance = "450m along waterway";
        capacity = "60% capacity available";
    } else if (report.category.toLowerCase().includes("organic")) {
        vehicleName = "Compost Collection Truck #07";
        distance = "250m on Green Route";
        capacity = "50% capacity available";
    } else {
        vehicleName = "Dry Recyclables Route Truck #04";
        distance = "320m away on Sector 12 Route";
        capacity = "40% capacity available";
    }

    report.status = "Assigned";
    report.assignedVehicle = vehicleName;
    saveReports();
    renderDashboardReports();

    container.innerHTML = `
        <div class="routing-card">
            <div class="routing-card-header">
                <strong>📍 Hotspot #${escapeHtml(report.id)} Verified</strong>
                <span class="status-badge assigned">Assigned</span>
            </div>

            <p class="routing-location"><strong>Location:</strong> ${escapeHtml(report.location)}</p>
            <p class="routing-type"><strong>Waste Stream:</strong> ${escapeHtml(report.category)} ${report.isFloating ? '🌊 (Water Debris)' : ''}</p>

            <div class="opportunity-match-box">
                <div class="match-icon">🚚</div>
                <div>
                    <span class="match-title">ROUTE OPPORTUNITY MATCHED</span>
                    <strong>${escapeHtml(vehicleName)}</strong>
                    <p class="match-details">Proximity: ${distance} • ${capacity}</p>
                </div>
            </div>

            <p class="routing-note">
                Instead of dispatching a new vehicle, BODH identified an existing collection vehicle travelling nearby with matching capacity and compatible waste stream.
            </p>
        </div>
    `;

    modal.style.display = "flex";
}

/* =====================================================
   STATUS TRACKER & BEFORE/AFTER VERIFICATION (PHASE 7 & 8)
===================================================== */

function openTrackerModal() {
    const modal = document.getElementById("trackerModal");
    const container = document.getElementById("trackerContent");

    if (!modal || !container) return;

    renderTrackerContent();
    modal.style.display = "flex";
}

function renderTrackerContent() {
    const container = document.getElementById("trackerContent");
    if (!container) return;

    if (!userReports || userReports.length === 0) {
        container.innerHTML = `<p style="text-align:center; padding: 20px; color:#666;">No reports submitted yet. Click <strong>Report Hotspot</strong> to test!</p>`;
        return;
    }

    const statuses = ["Reported", "Verified", "Assigned", "In Progress", "Collected", "Resolved"];

    let html = "";

    userReports.forEach(function (rep) {
        const currentIdx = statuses.indexOf(rep.status);

        let stepperHtml = '<div class="stepper-bar">';
        statuses.forEach(function (st, idx) {
            const isActive = idx <= currentIdx;
            const isCurrent = idx === currentIdx;
            stepperHtml += `
                <div class="step-item ${isActive ? 'active' : ''} ${isCurrent ? 'current' : ''}">
                    <div class="step-dot">${idx + 1}</div>
                    <small class="step-name">${st}</small>
                </div>
            `;
        });
        stepperHtml += '</div>';

        let beforeAfterHtml = '';
        if (rep.status === 'Resolved' || rep.status === 'Collected') {
            beforeAfterHtml = `
                <div class="before-after-container">
                    <h4>📷 Cleanup Visual Verification</h4>
                    <div class="before-after-grid">
                        <div class="ba-card">
                            <span>BEFORE (Reported)</span>
                            <img src="${escapeHtml(rep.beforeImage || rep.image || 'PIB.jpeg')}" alt="Before cleanup">
                        </div>
                        <div class="ba-card">
                            <span>AFTER (Cleaned Site)</span>
                            <img src="${escapeHtml(rep.afterImage || 'tech.jpeg')}" alt="After cleanup">
                        </div>
                    </div>
                    <div class="verification-badge">
                        ✓ Visual Cleanup Verified
                    </div>
                </div>
            `;
        }

        html += `
            <div class="tracker-item-card">
                <div class="tracker-card-header">
                    <div>
                        <strong>#${escapeHtml(rep.id)} — ${escapeHtml(rep.category)}</strong>
                        ${rep.isFloating ? '<span class="floating-pill">🌊 Water Debris</span>' : ''}
                        <br>
                        <small class="tracker-loc">📍 ${escapeHtml(rep.location)} • ${escapeHtml(rep.timestamp)}</small>
                    </div>
                    <span class="status-badge ${rep.status.toLowerCase().replace(/\s+/g, '-')}">${escapeHtml(rep.status)}</span>
                </div>

                <p class="tracker-desc">${escapeHtml(rep.description)}</p>

                ${rep.assignedVehicle ? `<div class="assigned-vehicle-info">🚚 <strong>Assigned Response:</strong> ${escapeHtml(rep.assignedVehicle)}</div>` : ''}

                ${stepperHtml}

                ${beforeAfterHtml}

                <div class="tracker-actions">
                    <button type="button" class="outline-btn btn-sm" onclick="advanceReportStatus('${rep.id}')">
                        ⏩ Advance Status (Simulate for Demo)
                    </button>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function advanceReportStatus(reportId) {
    const statuses = ["Reported", "Verified", "Assigned", "In Progress", "Collected", "Resolved"];
    const rep = userReports.find(r => r.id === reportId);

    if (!rep) return;

    let currentIdx = statuses.indexOf(rep.status);
    if (currentIdx < statuses.length - 1) {
        rep.status = statuses[currentIdx + 1];
    } else {
        rep.status = statuses[0]; // loop back for continuous testing
    }

    if (rep.status === 'Resolved') {
        rep.afterImage = 'tech.jpeg';
        addPoints(25);
        alert(`🎉 Hotspot #${rep.id} verified as RESOLVED! You earned +25 BODH Points!`);
    }

    saveReports();
    renderTrackerContent();
    renderDashboardReports();
}

/* =====================================================
   DASHBOARD RENDERER (PHASE 9)
===================================================== */

function renderDashboardReports() {
    const scansEl = document.getElementById("dashScans");
    const reportsEl = document.getElementById("dashReports");
    const resolvedEl = document.getElementById("dashResolved");
    const listContainer = document.getElementById("dashReportsList");

    if (scansEl) scansEl.innerText = totalScansCount;

    if (userReports && Array.isArray(userReports)) {
        if (reportsEl) reportsEl.innerText = userReports.length;

        const resolvedCount = userReports.filter(r => r.status === "Resolved").length;
        if (resolvedEl) resolvedEl.innerText = resolvedCount;

        if (listContainer) {
            if (userReports.length === 0) {
                listContainer.innerHTML = `<p class="empty-dash">No reports submitted yet.</p>`;
            } else {
                let html = "";
                userReports.slice(0, 3).forEach(function (rep) {
                    html += `
                        <div class="dash-report-row">
                            <div class="dash-report-left">
                                <strong>#${escapeHtml(rep.id)} — ${escapeHtml(rep.category)}</strong>
                                <small>📍 ${escapeHtml(rep.location)} • ${escapeHtml(rep.timestamp)}</small>
                            </div>
                            <div class="dash-report-right">
                                <span class="status-badge ${rep.status.toLowerCase().replace(/\s+/g, '-')}">${escapeHtml(rep.status)}</span>
                                <button type="button" class="text-link-btn" onclick="openTrackerModal()">Track →</button>
                            </div>
                        </div>
                    `;
                });
                listContainer.innerHTML = html;
            }
        }
    }
}

/* =====================================================
   INTERACTIVE DEMO MODE (PHASE 17)
===================================================== */

function openDemoMode() {
    const modal = document.getElementById("demoModal");
    if (modal) modal.style.display = "flex";
}

function startDemoWalkthrough() {
    closeModal("demoModal");

    alert("⚡ Starting 3-Minute Interactive Demo Walkthrough!\n\nStep 1: AI Scanning Sample Plastic Bottle...");

    // Step 1: Simulated Scan
    openScanner();

    setTimeout(function () {
        const sampleWaste = {
            material: "Plastic Bottle (PET)",
            category: "Recyclable",
            reusable: "Condition dependent",
            segregation: "Dry waste bin",
            route: "Plastic recycling facility",
            advice: "Rinse and crush the bottle before dropping in dry recyclables."
        };

        const samplePredictions = [
            { className: "water bottle", probability: 0.94 }
        ];

        showWasteResult(sampleWaste, samplePredictions);

    }, 1200);
}

/* Initialize Dashboard on Load */
document.addEventListener("DOMContentLoaded", function () {
    renderDashboardReports();
});
