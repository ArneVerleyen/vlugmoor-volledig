import App from '../lib/App';
import { Data, MetaData } from '../simulation/dataClasses';
import { Simulation } from '../simulation/simulationClasses';
import Controls from '../simulation/simulationClasses/Controls';
import ApiService from '../lib/api/ApiService';

const XLSX = require('xlsx');

const simulationTemplate = require('../templates/simulation.hbs');

// FUNCTIONS

export default () => {
    // render page
    const title = 'Simulation page';
    App.render(simulationTemplate({title}));
    let serverData;
    const appInit = async (simulation, files) => {
        // create Controls object
        const controls = new Controls(simulation);
        controls.registerBasicNav();
        controls.registerOutlineSwitch('switch-outline');
        controls.registerTimeLine('...');
        controls.registerScreenshotBttn('screenshot');
        controls.registerOutlineReset('reset-outline');

        // get shipTranslation data
        const shipTranslations = files.forces.map((timePoint) => {
            return timePoint.filter((column, index) => {
                if (index >= files.metaData.bolderData.length && index < files.metaData.bolderData.length + 3) {
                    return true;
                }
                return false;
            });
        });
        
        // create data object
        const data = new Data(files.metaData);
        data.addTimePoints(files.coords, files.forces, shipTranslations)
            .catch(() => {
                alert("De opgegeven data kon niet correct worden verwerkt. Probeer het opnieuw")
            });
        console.log(data.get())
        serverData = data.get();
        
        // SIMULATION
        simulation.addData(data);
        await simulation.init();
        // simulation.registerController();
        await simulation.addShip(files.metaData.caseShip, true);
        await simulation.addShip(files.metaData.passingShip);
        await simulation.addHawsers(files.metaData.bolderData, files.metaData.hawserLimits, data.events.getHawserBreaks());
        simulation.addFenders(files.metaData.fenderData, files.metaData.fenderLimits, data.events.getFenderBreaks());
        simulation.drawShips();
        simulation.play();
    }
    
    const filesHaveLoaded = (simulation, files) => {
        const keys = Object.keys(files);
        if (keys.includes('metaData') && keys.includes('forces') && keys.includes('coords')){
            appInit(simulation, files);
        }
    }

    const getParsedCSVData = (data) => {
        const parsedData = [];

        const newLinebrk = data.split("\n");
        for(let i = 0; i < newLinebrk.length; i++) {
            parsedData.push(newLinebrk[i].split(","))
        }

        return parsedData;
    }

    // BEGIN SCRIPT

    // give canvas dimensions and a color 
    const canvas = document.getElementById('simulation-canvas');
    const factor =  (window.innerWidth / canvas.width)*0.5 || (document.body.clientWidth / canvas.width)*0.5
    canvas.setAttribute('width', (canvas.width * factor > 800) ? canvas.width * factor : 1000);
    canvas.setAttribute('height', (canvas.height * factor > 500) ? canvas.height * factor : 600);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#c1e6fb";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // get inputfields
    const xlsxInput = document.getElementById('metadata-input');
    const forcesInput = document.getElementById('forces-input');
    const coordsInput = document.getElementById('coords-input');
    const submit = document.getElementById('submit');

    // on upload change label
    xlsxInput.addEventListener('change', (e) => {
        const el = document.getElementById('metadata-input-label');
        const bg = document.getElementById('metadata-input-bg');
        if (e.target.files[0]) {
            el.innerHTML = e.target.files[0].name;
            el.parentElement.classList.add('custom-button--uploaded');
            bg.style.width = "100%";
        } else {
            el.parentElement.classList.remove('custom-button--uploaded');
            el.innerHTML = "Bestand kiezen";
            bg.style.width = "0";
        }
    }); 
    forcesInput.addEventListener('change', (e) => {
        const el = document.getElementById('forces-input-label');
        const bg = document.getElementById('forces-input-bg');
        if (e.target.files[0]) {
            el.innerHTML = e.target.files[0].name;
            el.parentElement.classList.add('custom-button--uploaded');
            bg.style.width = "100%";
        } else {
            el.parentElement.classList.remove('custom-button--uploaded');
            el.innerHTML = "Bestand kiezen";
            bg.style.width = "0";
        }
    }); 
    coordsInput.addEventListener('change', (e) => {
        const el = document.getElementById('coords-input-label');
        const bg = document.getElementById('coords-input-bg');
        if (e.target.files[0]) {
            el.innerHTML = e.target.files[0].name;
            el.parentElement.classList.add('custom-button--uploaded');
            bg.style.width = "100%";
        } else {
            el.parentElement.classList.remove('custom-button--uploaded');
            el.innerHTML = "Bestand kiezen";
            bg.style.width = "0";
        }
    }); 

    // when files are submitted
    submit.addEventListener('click', (e) => {
        // create simulation object 
        const canvasId = 'simulation-canvas';
        const simulation = new Simulation(canvasId);

        // close popup
        const loadPopup = document.getElementById('load-popup');
        loadPopup.style.display = 'none';

        // load files
        const files = {};

        // read files
        const readerXSLX = new FileReader();
        readerXSLX.onload = (e) => {
            try {
                const data = e.target.result;

                const file = XLSX.read(data, {type: 'binary'});

                // parse xlsx to formatted MetaData object
                const metaData = new MetaData(file).get();

                // add to files object
                files.metaData = metaData;
    
                // check if all filess have been loaded
                filesHaveLoaded(simulation, files)
            } catch {
                alert("Er trad een fout op bij het inlezen van de metadata.")
            }
        }
        const readerForces = new FileReader();
        readerForces.onload = (e) => {
            const data = e.target.result;
        
            // make file readable
            const forces = getParsedCSVData(data);

            // add to files object
            files.forces = forces;

            // check if all filess have been loaded
            filesHaveLoaded(simulation, files)
        }
        const readerCoords = new FileReader();
        readerCoords.onload = (e) => {
            const data = e.target.result;

            // make file readable
            const coords = getParsedCSVData(data);

            // add to files object
            files.coords = coords;

            // check if all filess have been loaded
            filesHaveLoaded(simulation, files)

        }

        try {
            readerXSLX.readAsBinaryString(xlsxInput.files[0])
            readerForces.readAsBinaryString(forcesInput.files[0])
            readerCoords.readAsBinaryString(coordsInput.files[0])
        } catch {
            alert('Er ging iets fout bij het inladen van de bestanden. Probeer het opnieuw.');
        }
    });


    // button handlers
    const upload = document.getElementById('upload');
    const openLoad = document.getElementById('open-load');
    const closeLoad = document.getElementById('close-load');
    const openUpload = document.getElementById('open-upload');
    const closeUpload = document.getElementById('close-upload');

    upload.addEventListener('click', () => {
        let apiService = new ApiService();
        let data = {data: serverData};



        if (serverData) {
            let title = document.getElementById('title-field').value;
            let description = document.getElementById('description-field').value;
            let date = document.getElementById('date-field').value;
            let picture = serverData.caseMetaData.caseShip.type;
    
            apiService.storeData(data)
            .then((response) => apiService.storeMetaData(title, description, date, picture, toString(response.id)));
        } else {
            alert('Gelieve eerst een simulatie op te laden.')
        }
    });

    openLoad.addEventListener('click', (e) => {
        console.log('dd')
        const loadPopup = document.getElementById('load-popup');
        loadPopup.style.display = 'flex';
    });

    closeLoad.addEventListener('click', (e) => {
        const loadPopup = document.getElementById('load-popup');
        loadPopup.style.display = 'none';
    });


    openUpload.addEventListener('click', (e) => {
        const loadPopup = document.getElementById('upload-popup');
        loadPopup.style.display = 'flex';
    });


    closeUpload.addEventListener('click', (e) => {
        const loadPopup = document.getElementById('upload-popup');
        loadPopup.style.display = 'none';
    });

};
