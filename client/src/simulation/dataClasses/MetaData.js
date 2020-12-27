const XLSX = require('xlsx');

export default class MetaData {
    constructor(file) {
        this.file = file;
        this.sheet = file.Sheets[file.SheetNames[0]];

        this.caseShip = {};
        this.passingShip = {};
        this.wind = {};
        this.hawserLimits = {};
        this.fenderLimits = {};
        this.bolderData = [];
        this.fenderMeta = [];

        // this.fileTitles: titles in sheet
        this.fileTitles = {
            paramsCaseShip: 'Algemene parameters afgemeerd schip',
            paramsPassingShip: 'Parameters scheepspassage',
            windCoeff: 'Windcoefficienten Vlugmoor',
            paramsHawser: 'Troskarakteristieken',
            paramsFender: 'Fenderkarakteristieken',
            paramsHydro: 'Hydrodynamische parameters',
            paramsWind: 'Parameters windevent',
        }

        // this.fileTitleLocations: wordt gevuld met de locaties van elke titel in sheet
        this.fileTitleLocations = {} 

        this.load();
    }
 
    getCellData(cellLetter, cellNr) {
        const cellAdress = `${cellLetter.toUpperCase()}${cellNr}`;

        const cell = this.sheet[cellAdress];

        return (cell ? cell.v : '');
    }

    get() {
        return {
            timePointInterval: this.timePointInterval,
            caseShip: this.caseShip,
            passingShip: this.passingShip,
            wind: this.wind,
            hawserLimits: this.hawserLimits,
            fenderLimits: this.fenderLimits,
            bolderData: this.bolderData,
            fenderData: this.fenderMeta,
        }
    }

    load() {
        this.interpretFile();
        this.createGeneral();
        this.caseShip = this.createCaseShip();
        this.passingShip = this.createPassingShip();
        this.wind = this.createWindParams();

        this.hawserLimits = this.createhawserLimits();
        this.fenderLimits = this.createfenderLimits();

        this.bolderData = this.createBolderData();
        this.fenderMeta = this.createFenderMeta();
    }

    interpretFile() {
        // bepaal de locatie van de titels van de sheet door over kolom A te loopen
        let value = '';
        let record = 1;

        do {
            value = this.getCellData('a',record);
            value = (typeof value === 'string') ? value.trim() : value;

            // maak een array met alle titel keys
            const titleKeys = Object.keys(this.fileTitles);

            // loop over de keys en kijk of de value overeenkomt met een titel
            titleKeys.forEach((titleKey) => {
                if (value === this.fileTitles[titleKey]) {
                    // assign locatie aan titel
                    this.fileTitleLocations[titleKey] = record;
                }
            }); 

            record++;
        } while(value !== '');
    }

    createGeneral() {
        this.timePointInterval = this.getCellData('e',3);
    }

    createCaseShip() {
        return {
            type: this.getCellData('b',2),
            length: this.getCellData('b',3),
            width: this.getCellData('b',5),
            distanceFromKaai: this.getCellData('b',14),
            startContourTimePoint: this.getCellData('e',4),
        }
    }

    createPassingShip() {
        return {
            present: (this.getCellData('b',17) === 'YES' ) ? true : false,
            type: this.getCellData('b',18),
            length: this.getCellData('b',19),
            width: this.getCellData('b',20),
            deltaYShips: this.getCellData('b',21),
            speedInKnots: this.getCellData('b',22),
            speedInMPerS: this.getCellData('b',23),
            direction: this.getCellData('b',23) / Math.abs(this.getCellData('b',23)),
            startXCoord: this.getCellData('e',17),
            startYCoord: this.getCellData('e',18)
        }
    }

    createWindParams() {
        if (!this.fileTitleLocations.paramsWind) {
            console.log('Wind parameters not available.');
            return({});
        }

        const firstValueRecord = this.fileTitleLocations.paramsWind + 1;
        return {
            present: (this.getCellData('b', firstValueRecord) === 'YES' ) ? true : false,
            directionInDegrees: this.getCellData('b',firstValueRecord + 1),
            speedInMPerS: this.getCellData('b',firstValueRecord + 2),
        }
    }

    createhawserLimits() {
        const record = this.fileTitleLocations.paramsHawser + 1;
        return {
            first: this.getCellData('d',record)/100,
            second: this.getCellData('f',record)/100,
        }
    }

    createBolderData() {
        if (!this.fileTitleLocations.paramsHawser) {
            console.log('Bolder data not available.');
            return([]);
        }

        const firstValueRecord = this.fileTitleLocations.paramsHawser + 2;
        const amountOfBolders = this.getCellData('b', this.fileTitleLocations.paramsHawser + 1)
        const hawserArray = [];

        // create object per hawser
        for (let record = firstValueRecord; record < firstValueRecord+amountOfBolders; record ++) {
            hawserArray.push({
                posX: this.getCellData('b',record),
                posY: this.getCellData('c',record),
                forceMax: this.getCellData('i',record),
            });
        }

        return hawserArray;
    }

    createfenderLimits() {
        const record = this.fileTitleLocations.paramsFender + 1;
        return {
            first: this.getCellData('d',record)/100,
            second: this.getCellData('f',record)/100,
            thicknessInM: this.getCellData('h',record),
            widthInM: this.getCellData('j',record),
        }
    }

    createFenderMeta() {
        if (!this.fileTitleLocations.paramsFender) {
            console.log('Fender data not available.');
            return([]);
        }

        const firstValueRecord = this.fileTitleLocations.paramsFender + 2;
        const amountOfHawsers = this.getCellData('b', this.fileTitleLocations.paramsFender + 1)
        const fenderArray = [];

        // create object per hawser
        for (let record = firstValueRecord; record < firstValueRecord+amountOfHawsers; record ++) {
            fenderArray.push({
                posX: this.getCellData('a',record),
                posY: this.getCellData('b',record),
                forceMax: this.getCellData('f',record),
            });
        }

        return fenderArray;
    }

}