import App from '../lib/App';
import ApiService from '../lib/api/ApiService';
import AuthService from '../lib/api/AuthService';
import Router from '../lib/core/Router';
import routes from '../routes';
//import container from '../assets/images/ships/container/container_large_dirLeft.png';

const gasCarrierUrl = require('file-loader!../assets/images/ships/gascarrier/gascarrier_prismatanks_dirLeft.png');
const containerUrl = require('file-loader!../assets/images/ships/container/container_large_dirLeft.png');
const bulkCarrierUrl = require('file-loader!../assets/images/ships/bulkcarrier/bulkcarrier_dirLeft.png');
const roroUrl = require('file-loader!../assets/images/ships/roro/roro_dirLeft.png');
const oiltanker_largeUrl = require('file-loader!../assets/images/ships/tanker/oiltanker_small_dirLeft.png');
const oiltanker_smallUrl = require('file-loader!../assets/images/ships/tanker/oiltanker_large_dirLeft.png');
const listTemplate = require('../templates/list.hbs');
const homeTemplate = require('../templates/home.hbs');

export default () => {
    const title = 'Home page';
    App.render(homeTemplate({title}));

    // Authentication

    const authService = new AuthService();
    authService.verifyUserFromLocalStorage();
    
    if (JSON.parse(localStorage.getItem('authUser')) === null) {
        App.router.navigate('/login');
    } else {
        console.log('logged in')
    };
    
    // Logout

    const logoutBtn = document.getElementById('logout-btn-nav');
    logoutBtn.addEventListener('click', (e) => {
        authService.logout();
        localStorage.setItem('authUser', null);
        App.router.navigate('/login');
    });


    let documentContainer = document.getElementById('container-home');

    function getShipImage (imgName) {
        if (imgName === 'bulkcarrier') {
            return bulkCarrierUrl.default;
        } else if (imgName === 'container') {
            return containerUrl.default;
        } else if (imgName === 'gascarrier') {
            return gasCarrierUrl.default;
        } else if (imgName === 'roro') {
            return roroUrl.default;
        } else if (imgName === 'oiltanker_large') {
            return oiltanker_largeUrl.default;
        } else if (imgName === 'oiltanker_small') {
            return oiltanker_smallUrl.default;
        }
    };

    const showMetaData = (metaData) => {
        metaData.forEach(data => {
    
            let container = document.createElement('div');
            let image = document.createElement('img');
            let title = document.createElement('h3');
            let date = document.createElement('p');

            container.setAttribute('class', 'card');
            
            documentContainer.appendChild(container);
            container.appendChild(image);
            container.appendChild(title);
            container.appendChild(date);

            title.innerHTML = data.title;
            
            const d = new Date(data.date);
            const dateParsed = d.getDate()+ '/' + (d.getMonth()+1) + '/' + d.getFullYear();

            date.innerHTML = dateParsed;
            image.src = getShipImage(data.picture);
            
            documentContainer.appendChild(container);
            container.addEventListener('click', (e) => {
                loadSimulation(data.id);
            })
        })
    };

    const loadSimulation = (id) => {
        App.router.navigate(`/simulation/${id}`);
        localStorage.setItem('id', null);
    };


    const apiService = new ApiService;
    const data = apiService.findAllMetaData();
    data.then(
        metaData => showMetaData(metaData)
    );

    const newSim = document.getElementById('upload-simulation');
    newSim.addEventListener('click', () => {
        localStorage.setItem('id', null);
    });

    


};