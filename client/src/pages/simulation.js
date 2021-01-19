import { data } from "jquery";
import App from "../lib/App";
import { Data, MetaData } from "../simulation/dataClasses";
import { Simulation } from "../simulation/simulationClasses";
import Controls from "../simulation/simulationClasses/Controls";

const XLSX = require("xlsx");

const simulationTemplate = require("../templates/simulation.hbs");

// FUNCTIONS

export default () => {
    // render page
    const title = "Simulation page";
    App.render(simulationTemplate({ title }));
    let serverData;
    const appInit = async (simulation, files) => {
        // create Controls object
        const controls = new Controls(simulation);
        controls.registerBasicNav();
        controls.registerOutlineSwitch("switch-outline");
        controls.registerTimeLine("...");
        controls.registerScreenshotBttn("screenshot");

        // get shipTranslation data
        const shipTranslations = files.forces.map((timePoint) => {
            return timePoint.filter((column, index) => {
                if (
                    index >= files.metaData.bolderData.length &&
                    index < files.metaData.bolderData.length + 3
                ) {
                    return true;
                }
                return false;
            });
        });

        // create data object
        const data = new Data(files.metaData);
        data.addTimePoints(files.coords, files.forces, shipTranslations).catch(
            () => {
                alert(
                    "De opgegeven data kon niet correct worden verwerkt. Probeer het opnieuw"
                );
            }
        );
        console.log(data.get());
        serverData = data.get();

        /*
         * begin code van PGM-studenten
         */
        // close popup when data loaded
        if (data) {
            const uploadContainer = document.getElementById("upload-container");
            uploadContainer.classList.add("hidden");

            const uploadBtn = document.getElementById("open-upload-container");
            uploadBtn.classList.add("hidden");

            const serverUpload = document.getElementById("upload");
            serverUpload.classList.remove("hidden");

            const newSimulation = document.getElementById("new-simulation");
            newSimulation.classList.remove("hidden");
        }

        // add data to timelines
        addDataToHawsersTimeline(data, controls);
        addDataToFendersTimeline(data, controls);
        /*
         * einde code van PGM-studenten
         */

        // SIMULATION
        simulation.addData(data);
        await simulation.init();
        // simulation.registerController();
        await simulation.addShip(files.metaData.caseShip, true);
        await simulation.addShip(files.metaData.passingShip);
        await simulation.addHawsers(
            files.metaData.bolderData,
            files.metaData.hawserLimits,
            data.events.getHawserBreaks()
        );
        simulation.addFenders(
            files.metaData.fenderData,
            files.metaData.fenderLimits,
            data.events.getFenderBreaks()
        );
        simulation.drawShips();
        simulation.play();
    };

    const filesHaveLoaded = (simulation, files) => {
        const keys = Object.keys(files);
        if (
            keys.includes("metaData") &&
            keys.includes("forces") &&
            keys.includes("coords")
        ) {
            appInit(simulation, files);
        }
    };

    const getParsedCSVData = (data) => {
        const parsedData = [];

        const newLinebrk = data.split("\n");
        for (let i = 0; i < newLinebrk.length; i++) {
            parsedData.push(newLinebrk[i].split(","));
        }

        return parsedData;
    };

    // BEGIN SCRIPT

    // create simulation
    const canvasId = "simulation-canvas";
    const simulation = new Simulation(canvasId);

    // get inputfields
    const xlsxInput = document.getElementById("metadata-input");
    const forcesInput = document.getElementById("forces-input");
    const coordsInput = document.getElementById("coords-input");
    const submit = document.getElementById("submit");
    const upload = document.getElementById("upload");
    const newSimulation = document.getElementById("new-simulation");

    // on upload change label
    xlsxInput.addEventListener("change", (e) => {
        const el = document.getElementById("metadata-input-label");
        if (e.target.files[0]) {
            el.innerHTML = e.target.files[0].name;
            el.parentElement.classList.add("custom-button--uploaded");
        } else {
            el.parentElement.classList.remove("custom-button--uploaded");
            el.innerHTML = "Bestand kiezen";
        }
    });
    forcesInput.addEventListener("change", (e) => {
        const el = document.getElementById("forces-input-label");
        if (e.target.files[0]) {
            el.innerHTML = e.target.files[0].name;
            el.parentElement.classList.add("custom-button--uploaded");
        } else {
            el.parentElement.classList.remove("custom-button--uploaded");
            el.innerHTML = "Bestand kiezen";
        }
    });
    coordsInput.addEventListener("change", (e) => {
        const el = document.getElementById("coords-input-label");
        if (e.target.files[0]) {
            el.innerHTML = e.target.files[0].name;
            el.parentElement.classList.add("custom-button--uploaded");
        } else {
            el.parentElement.classList.remove("custom-button--uploaded");
            el.innerHTML = "Bestand kiezen";
        }
    });

    /*
     * begin code van PGM-studenten
     */
    // add click events to upload buttons
    const uploadContainer = document.getElementById("upload-container");
    const openUploadBtn = document.getElementById("open-upload-container");
    openUploadBtn.addEventListener("click", () => {
        uploadContainer.classList.remove("hidden");

        const closeUploadBtn = document.getElementById(
            "close-upload-container"
        );
        closeUploadBtn.addEventListener("click", () => {
            uploadContainer.classList.add("hidden");
        });
    });
    /*
     * einde code van PGM-studenten
     */

    // when files are submitted
    submit.addEventListener("click", (e) => {
        const files = {};

        // read files
        const readerXSLX = new FileReader();
        readerXSLX.onload = (e) => {
            try {
                const data = e.target.result;

                const file = XLSX.read(data, { type: "binary" });

                // parse xlsx to formatted MetaData object
                const metaData = new MetaData(file).get();

                // add to files object
                files.metaData = metaData;

                // check if all filess have been loaded
                filesHaveLoaded(simulation, files);
            } catch {
                alert("Er trad een fout op bij het inlezen van de metadata.");
            }
        };
        const readerForces = new FileReader();
        readerForces.onload = (e) => {
            const data = e.target.result;

            // make file readable
            const forces = getParsedCSVData(data);

            // add to files object
            files.forces = forces;

            // check if all filess have been loaded
            filesHaveLoaded(simulation, files);
        };
        const readerCoords = new FileReader();
        readerCoords.onload = (e) => {
            const data = e.target.result;

            // make file readable
            const coords = getParsedCSVData(data);

            // add to files object
            files.coords = coords;

            // check if all filess have been loaded
            filesHaveLoaded(simulation, files);
        };

        try {
            readerXSLX.readAsBinaryString(xlsxInput.files[0]);
            readerForces.readAsBinaryString(forcesInput.files[0]);
            readerCoords.readAsBinaryString(coordsInput.files[0]);

            /*
             * begin code van PGM-studenten
             */
            // change popup text when loading
            uploadContainer.innerHTML = `
            <div class="upload-container-content">
            <h1>Loading...</h1><p>This popup will close automatically.</p>
            </div>
            `;
            /*
             * einde code van PGM-studenten
             */
        } catch {
            alert(
                "Er ging iets fout bij het inladen van de bestanden. Probeer het opnieuw."
            );

            /*
             * begin code van PGM-studenten
             */
            // reload page
            uploadContainer.classList.add("hidden");
            window.location.reload();
            /*
             * einde code van PGM-studenten
             */
        }
    });

    upload.addEventListener("click", () => {
        // Handle data
        console.log(serverData);
    });

    /*
     * begin code van PGM-studenten
     */
    // reload the page when starting a new simulation
    newSimulation.addEventListener("click", () => {
        window.location.reload();
    });

    // get hawser containers
    const hawsersTimeline = document.getElementById("hawser-breakpoints");
    const addHawserTimelines = document.getElementById(
        "sub-timeline-container-content-hawsers"
    );
    const titleDivHawsers = document.getElementById(
        "sub-timeline-titles-hawsers"
    );

    const addDataToHawsersTimeline = async (data, controls) => {
        // get & filter event data
        const hawserDangerData = data.get().events.hawsers;
        const filteredHawserDangerData = hawserDangerData.filter(
            (dataItem, i) => {
                if (i > 0) {
                    // filter out duplicate items
                    if (hawserDangerData[i - 1].limit !== 0.6) {
                        return dataItem;
                    }
                } else {
                    return dataItem;
                }
            }
        );

        // get & sort breakevent data
        const hawserBreaksData = data.get().events.hawserBreaks;
        const sortedHawserBreaksData = hawserBreaksData.sort(
            // sort on ID
            (a, b) => a.id - b.id
        );

        // get all different IDs
        const hawserIDs = [];
        sortedHawserBreaksData.map((dataItem, i) => {
            if (i > 0) {
                // avoid having duplicate IDs
                if (dataItem.id !== sortedHawserBreaksData[i - 1].id) {
                    return hawserIDs.push(dataItem.id);
                }
            } else {
                return hawserIDs.push(dataItem.id);
            }
        });

        // add HTML for breakevents on timeline
        const hawsersHTML = createBreakpointHTML(
            sortedHawserBreaksData,
            "hawser"
        );

        // add points to timeline
        if (hawsersHTML !== "") {
            hawsersTimeline.innerHTML = hawsersHTML;
        }

        // add HTML for subtimelines
        let subtimelinesHTML = "";
        if (hawserIDs.length > 0) {
            hawserIDs.map((id) => {
                subtimelinesHTML += `
                <div class="sub-timeline-container-content" id="timeline-container">
                    <div id="timeline" class="timeline" data-type="hawser" data-id="${id}"></div>
                </div>
                `;
            });
        } else {
            subtimelinesHTML += "<p>Er is geen data.</p>";
        }
        // add subtimelines to subtimeline container
        if (subtimelinesHTML !== "") {
            addHawserTimelines.innerHTML = subtimelinesHTML;
        }

        // add click events to the breakevent points
        const breakEventButtons = document.querySelectorAll(".hawserbreak-btn");
        for (let i = 0; i < breakEventButtons.length; i++) {
            breakEventButtons[i].addEventListener("click", () => {
                // go to breakevent in animation
                controls.setAnimationProgress(
                    sortedHawserBreaksData[i].timePointIndex
                );
                controls.setPause();
                document.getElementById("simulation-canvas").scrollIntoView();
            });
        }

        // add all data to subtimelines
        addTitles(hawserIDs, titleDivHawsers);
        addDangerZonesToSubtimelines(
            filteredHawserDangerData,
            "hawser",
            controls
        );
    };

    // add click event to open/close subtimelines
    let hawserButton = document.getElementById("open-hawsers");
    hawserButton.addEventListener("click", () => {
        addHawserTimelines.classList.toggle("hidden");
        titleDivHawsers.classList.toggle("hidden");
    });

    // get fender containers
    const fendersTimeline = document.getElementById("fender-breakpoints");
    const addFenderTimelines = document.getElementById(
        "sub-timeline-container-content-fenders"
    );
    const titleDivFenders = document.getElementById(
        "sub-timeline-titles-fenders"
    );

    const addDataToFendersTimeline = async (data, controls) => {
        // get & filter event data
        const fenderDangerData = data.get().events.fender;
        const filteredFenderDangerData = fenderDangerData.filter(
            (dataItem, i) => {
                if (i > 0) {
                    // filter out duplicate items
                    if (fenderDangerData[i - 1].limit !== 0.6) {
                        return dataItem;
                    }
                } else {
                    return dataItem;
                }
            }
        );

        // get & sort breakevent data
        const fenderBreaksData = data.get().events.fenderBreaks;
        const sortedFenderBreaksData = fenderBreaksData.sort(
            // sort on ID
            (a, b) => a.id - b.id
        );

        // get all different IDs
        const fenderIDs = [];
        sortedFenderBreaksData.map((dataItem, i) => {
            if (i > 0) {
                // avoid having duplicate IDs
                if (dataItem.id !== sortedFenderBreaksData[i - 1].id) {
                    return fenderIDs.push(dataItem.id);
                }
            } else {
                return fenderIDs.push(dataItem.id);
            }
        });

        // add HTML for breakevents on timeline
        const fendersHTML = createBreakpointHTML(
            sortedFenderBreaksData,
            "fender"
        );

        // add points to timeline
        if (fendersHTML !== "") {
            fendersTimeline.innerHTML = fendersHTML;
        }

        // add HTML for subtimelines
        let subtimelinesHTML = "";
        if (fenderIDs.length > 0) {
            fenderIDs.map((id) => {
                subtimelinesHTML += `
                <div class="sub-timeline-container-content" id="timeline-container">
                    <div id="timeline" class="timeline" data-type="fender" data-id="${id}"></div>
                </div>
                `;
            });
        } else {
            subtimelinesHTML += "<p>Er is geen data.</p>";
        }
        // add subtimelines to subtimeline container
        if (subtimelinesHTML !== "") {
            addFenderTimelines.innerHTML = subtimelinesHTML;
        }

        // add click events to the breakevent points
        const breakEventButtons = document.querySelectorAll(".fenderbreak-btn");
        for (let i = 0; i < breakEventButtons.length; i++) {
            breakEventButtons[i].addEventListener("click", () => {
                // go to breakevent in animation
                controls.setAnimationProgress(
                    sortedFenderBreaksData[i].timePointIndex
                );
                controls.setPause();
                document.getElementById("simulation-canvas").scrollIntoView();
            });
        }

        // add all data to subtimelines
        addTitles(fenderIDs, titleDivFenders);
        addDangerZonesToSubtimelines(
            filteredFenderDangerData,
            "fender",
            controls
        );
    };

    // add click event to open/close subtimelines
    let fenderButton = document.getElementById("open-fenders");
    fenderButton.addEventListener("click", () => {
        addFenderTimelines.classList.toggle("hidden");
        titleDivFenders.classList.toggle("hidden");
    });

    const addTitles = (data, container) => {
        // add a title for every subtimeline
        let subtimelinesTitles = "";
        data.map((dataItem) => {
            subtimelinesTitles += `
            <div class="sub-timeline-title">
                <p>ID: ${dataItem}</p>
            </div>
            `;
        });
        // add titles to title container
        container.innerHTML += subtimelinesTitles;
    };

    const addDangerZonesToSubtimelines = (data, type, controls) => {
        // get all timelines
        let allTimelines = document.querySelectorAll(".timeline");
        allTimelines = [...allTimelines];
        let currentTimeline = null;
        data.map((dataItem) => {
            // find the timeline where the current event belongs
            currentTimeline = allTimelines.find((timeline) => {
                return (
                    timeline.dataset.type === type &&
                    timeline.dataset.id === dataItem.id.toString()
                );
            });

            // create HTML for dangerzone
            let dangerzoneHTML = "";

            // check which limit has been surpassed
            if (dataItem.limit === 0.5) {
                dangerzoneHTML = `
              <div class="dangerzone yellow" data-timestamp="${
                  dataItem.timePointIndex
              }" style="left:${dataItem.timePointInPercentage * 100}%"></div>
              `;
            } else {
                dangerzoneHTML = `
              <div class="dangerzone red" data-timestamp="${
                  dataItem.timePointIndex
              }" style="left:${dataItem.timePointInPercentage * 100}%"></div>
              `;
            }

            // add dangerzone to current subtimeline
            currentTimeline.innerHTML += dangerzoneHTML;
        });

        // add click events to the dangerzone points
        const dangerZoneButton = document.querySelectorAll(`.dangerzone`);
        for (let i = 0; i < dangerZoneButton.length; i++) {
            dangerZoneButton[i].addEventListener("click", () => {
                // go to dangerzone in animation
                controls.setAnimationProgress(
                    parseInt(dangerZoneButton[i].dataset.timestamp)
                );
                controls.setPause();
                document.getElementById("simulation-canvas").scrollIntoView();
            });
        }
    };

    const createBreakpointHTML = (data, type) => {
        let breakpointHTML = "";
        for (let i = 0; i < data.length; i++) {
            // switch point position above or below the timeline
            if (i % 2 === 0) {
                breakpointHTML += `
                <div class="${type}break-btn">
                    <div style="left:${
                        data[i].timePointInPercentage * 100
                    }%" class="point top">
                        <div class="line"></div>
                    </div>
                </div>
                `;
            } else {
                breakpointHTML += `
                <div class="${type}break-btn">
                    <div style="left:${
                        data[i].timePointInPercentage * 100
                    }%" class="point bottom">
                        <div class="line"></div>
                    </div>
                </div>
                `;
            }
        }
        return breakpointHTML;
    };
};
