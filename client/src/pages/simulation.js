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
        addDataToHawsersTimeline(data, controls);
        addDataToFendersTimeline(data, controls);

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

    // on upload change label
    xlsxInput.addEventListener("change", (e) => {
        const el = document.getElementById("metadata-input-label");
        const bg = document.getElementById("metadata-input-bg");
        if (e.target.files[0]) {
            el.innerHTML = e.target.files[0].name;
            el.parentElement.classList.add("custom-button--uploaded");
            bg.style.width = "100%";
        } else {
            el.parentElement.classList.remove("custom-button--uploaded");
            el.innerHTML = "Bestand kiezen";
            bg.style.width = "0";
        }
    });
    forcesInput.addEventListener("change", (e) => {
        const el = document.getElementById("forces-input-label");
        const bg = document.getElementById("forces-input-bg");
        if (e.target.files[0]) {
            el.innerHTML = e.target.files[0].name;
            el.parentElement.classList.add("custom-button--uploaded");
            bg.style.width = "100%";
        } else {
            el.parentElement.classList.remove("custom-button--uploaded");
            el.innerHTML = "Bestand kiezen";
            bg.style.width = "0";
        }
    });
    coordsInput.addEventListener("change", (e) => {
        const el = document.getElementById("coords-input-label");
        const bg = document.getElementById("coords-input-bg");
        if (e.target.files[0]) {
            el.innerHTML = e.target.files[0].name;
            el.parentElement.classList.add("custom-button--uploaded");
            bg.style.width = "100%";
        } else {
            el.parentElement.classList.remove("custom-button--uploaded");
            el.innerHTML = "Bestand kiezen";
            bg.style.width = "0";
        }
    });

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
        } catch {
            alert(
                "Er ging iets fout bij het inladen van de bestanden. Probeer het opnieuw."
            );
        }
    });

    upload.addEventListener("click", () => {
        // Handle data
        console.log(serverData);
    });

    const hawsersTimeline = document.getElementById("hawser-breakpoints");
    const addHawserTimelines = document.getElementById(
        "sub-timeline-container-content-hawsers"
    );
    const titleDivHawsers = document.getElementById(
        "sub-timeline-titles-hawsers"
    );

    const addDataToHawsersTimeline = async (data, controls) => {
        const hawserDangerData = data.get().events.hawsers;
        const filteredHawserDangerData = hawserDangerData.filter((dataItem) => {
            return dataItem.limit === 0.5;
        });

        const hawserBreaksData = data.get().events.hawserBreaks;
        const sortedHawserBreaksData = hawserBreaksData.sort(
            (a, b) => a.id - b.id
        );

        let hawsersHTML = "";
        for (let i = 0; i < sortedHawserBreaksData.length; i++) {
            if (i % 2 === 0) {
                hawsersHTML += `
                <a href="#simulation-canvas" class="hawserbreak-btn">
                    <div style="left:${
                        sortedHawserBreaksData[i].timePointInPercentage * 100
                    }%" class="point top">
                        <div class="line"></div>
                    </div>
                </a>
                `;
            } else {
                hawsersHTML += `
                <a href="#simulation-canvas" class="hawserbreak-btn">
                    <div style="left:${
                        sortedHawserBreaksData[i].timePointInPercentage * 100
                    }%" class="point bottom">
                        <div class="line"></div>
                    </div>
                </a>
                `;
            }
        }
        hawsersTimeline.innerHTML = hawsersHTML;

        let subtimelinesHTML = "";
        if (sortedHawserBreaksData.length > 0) {
            sortedHawserBreaksData.map((dataItem) => {
                subtimelinesHTML += `
                <div class="sub-timeline-container-content" id="timeline-container">
                    <div id="timeline" class="timeline" data-type="hawser" data-id="${dataItem.id}"></div>
                </div>
                `;
            });
        } else {
            subtimelinesHTML += "<p>Er is geen data.</p>";
        }
        if (hawsersHTML !== null) {
            addHawserTimelines.innerHTML = subtimelinesHTML;
        }

        const breakEventButtons = document.querySelectorAll(".hawserbreak-btn");
        for (let i = 0; i < breakEventButtons.length; i++) {
            breakEventButtons[i].addEventListener("click", () => {
                controls.setAnimationProgress(
                    sortedHawserBreaksData[i].timePointIndex
                );
                controls.setPause();
            });
        }

        addTitles(sortedHawserBreaksData, titleDivHawsers);
        addDangerZonesToSubtimelines(
            filteredHawserDangerData,
            "hawser",
            controls
        );
        addBreakpointsToSubtimelines(
            sortedHawserBreaksData,
            "hawser",
            controls
        );
    };

    let hawserButton = document.getElementById("open-hawsers");
    hawserButton.addEventListener("click", () => {
        addHawserTimelines.classList.toggle("visible");
        titleDivHawsers.classList.toggle("visible");
    });

    const fendersTimeline = document.getElementById("fender-breakpoints");
    const addFenderTimelines = document.getElementById(
        "sub-timeline-container-content-fenders"
    );
    const titleDivFenders = document.getElementById(
        "sub-timeline-titles-fenders"
    );

    const addDataToFendersTimeline = async (data, controls) => {
        const fenderDangerData = data.get().events.fender;
        const filteredFenderDangerData = fenderDangerData.filter((dataItem) => {
            return dataItem.limit === 0.5;
        });

        const fenderBreaksData = data.get().events.fenderBreaks;
        const sortedFenderBreaksData = fenderBreaksData.sort(
            (a, b) => a.id - b.id
        );

        let fendersHTML = "";
        for (let i = 0; i < sortedFenderBreaksData.length; i++) {
            if (i % 2 === 0) {
                fendersHTML += `
                <a href="#simulation-canvas" class="fenderbreak-btn">
                    <div style="left:${
                        sortedFenderBreaksData[i].timePointInPercentage * 100
                    }%" class="point top">
                        <div class="line"></div>
                    </div>
                </a>
                `;
            } else {
                fendersHTML += `
                <a href="#simulation-canvas" class="fenderbreak-btn">
                    <div style="left:${
                        sortedFenderBreaksData[i].timePointInPercentage * 100
                    }%" class="point bottom">
                        <div class="line"></div>
                    </div>
                </a>
                `;
            }
        }
        if (fendersHTML !== null) {
            fendersTimeline.innerHTML = fendersHTML;
        }

        let subtimelinesHTML = "";
        if (sortedFenderBreaksData.length > 0) {
            sortedFenderBreaksData.map((dataItem) => {
                subtimelinesHTML += `
                <div class="sub-timeline-container-content" id="timeline-container">
                    <div id="timeline" class="timeline" data-type="fender" data-id="${dataItem.id}"></div>
                </div>
                `;
            });
        } else {
            subtimelinesHTML += "<p>Er is geen data.</p>";
        }
        addFenderTimelines.innerHTML = subtimelinesHTML;

        const breakEventButtons = document.querySelectorAll(".fenderbreak-btn");
        for (let i = 0; i < breakEventButtons.length; i++) {
            breakEventButtons[i].addEventListener("click", () => {
                controls.setAnimationProgress(
                    sortedFenderBreaksData[i].timePointIndex
                );
                controls.setPause();
            });
        }

        addTitles(sortedFenderBreaksData, titleDivFenders);
        addDangerZonesToSubtimelines(
            filteredFenderDangerData,
            "fender",
            controls
        );
        addBreakpointsToSubtimelines(
            sortedFenderBreaksData,
            "fender",
            controls
        );
    };

    let fenderButton = document.getElementById("open-fenders");
    fenderButton.addEventListener("click", () => {
        addFenderTimelines.classList.toggle("visible");
        titleDivFenders.classList.toggle("visible");
    });

    const addTitles = (data, container) => {
        let subtimelinesTitles = "";
        data.map((dataItem) => {
            subtimelinesTitles += `
            <div class="sub-timeline-title">
                <p>ID: ${dataItem.id}</p>
            </div>
            `;
        });
        container.innerHTML += subtimelinesTitles;
    };

    const addBreakpointsToSubtimelines = (data, type, controls) => {
        let allTimelines = document.querySelectorAll(".timeline");
        allTimelines = [...allTimelines];
        let currentTimeline = null;
        data.map((dataItem) => {
            currentTimeline = allTimelines.find((timeline) => {
                return (
                    timeline.dataset.type === type &&
                    timeline.dataset.id === dataItem.id.toString()
                );
            });

            let subtimelineHTML = `
            <a href="#simulation-canvas" class="${type}break-btn">
                <div style="left:${
                    dataItem.timePointInPercentage * 100
                }%" class="point"></div>
            </a>
            `;

            currentTimeline.innerHTML += subtimelineHTML;
        });

        const breakEventButtons = document.querySelectorAll(
            `.${type}break-btn`
        );
        for (let i = 0; i < breakEventButtons.length; i++) {
            breakEventButtons[i].addEventListener("click", () => {
                controls.setAnimationProgress(
                    data[i < data.length ? i : i - data.length].timePointIndex
                );
                controls.setPause();
            });
        }
    };

    const addDangerZonesToSubtimelines = (data, type, controls) => {
        let allTimelines = document.querySelectorAll(".timeline");
        allTimelines = [...allTimelines];
        let currentTimeline = null;
        data.map((dataItem) => {
            currentTimeline = allTimelines.find((timeline) => {
                return (
                    timeline.dataset.type === type &&
                    timeline.dataset.id === dataItem.id.toString()
                );
            });

            let subtimelineHTML = `
            <a href="#simulation-canvas">
                <div class="point-danger" data-timestamp="${
                    dataItem.timePointIndex
                }" style="left:${dataItem.timePointInPercentage * 100}%"></div>
            </a>
            `;

            currentTimeline.innerHTML += subtimelineHTML;
        });

        const dangerZoneButton = document.querySelectorAll(`.point-danger`);
        for (let i = 0; i < dangerZoneButton.length; i++) {
            dangerZoneButton[i].addEventListener("click", () => {
                controls.setAnimationProgress(
                    dangerZoneButton[i].dataset.timestamp
                );
                controls.setPause();
            });
        }
    };
};
