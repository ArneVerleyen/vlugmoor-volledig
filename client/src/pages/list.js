import App from '../lib/App';
import ApiService from '../lib/api/ApiService';
import AuthService from '../lib/api/AuthService';
import { olive } from 'color-name';

const gasCarrierUrl = require('file-loader!../assets/images/ships/gascarrier/gascarrier_prismatanks_dirLeft.png');
const containerUrl = require('file-loader!../assets/images/ships/container/container_large_dirLeft.png');
const bulkCarrierUrl = require('file-loader!../assets/images/ships/bulkcarrier/bulkcarrier_dirLeft.png');
const roroUrl = require('file-loader!../assets/images/ships/roro/roro_dirLeft.png');
const oiltanker_largeUrl = require('file-loader!../assets/images/ships/tanker/oiltanker_small_dirLeft.png');
const oiltanker_smallUrl = require('file-loader!../assets/images/ships/tanker/oiltanker_large_dirLeft.png');
const listTemplate = require('../templates/list.hbs');
/*
 *
 * @TODO: Fix Dates 
 * @TODO: link to the right page when clicking on LI
 * @TODO: fix image
 */

export default () => {
    const title = 'Simulation list page';
    App.render(listTemplate({title}));

    // Authentication
    console.log(containerUrl);
    const authService = new AuthService();
    authService.verifyUserFromLocalStorage();
    
    if (JSON.parse(localStorage.getItem('authUser')) === null) {
        App.router.navigate('/login');
    } else {
    };

    // Logout

    const logoutBtn = document.getElementById('logout-btn-nav');
    logoutBtn.addEventListener('click', (e) => {
        authService.logout();
        App.router.navigate('/login');
    });


    let documentContainer = document.getElementById('list-content');

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
            let date = document.createElement('p');
            let divider1 = document.createElement('p');
            let divider2 = document.createElement('p');
            let link = document.createElement('a');
            let title = document.createElement('h3');
            let description = document.createElement('p');

            container.setAttribute('class', 'list-item');
            
            documentContainer.appendChild(container);
            
            container.appendChild(date);
            container.appendChild(divider1);
            container.appendChild(title);
            container.appendChild(divider2);
            container.appendChild(description);
            container.appendChild(image);
            container.appendChild(link);
            


            const d = new Date(data.date);
            const dateParsed = d.getDate()+ '/' + (d.getMonth()+1) + '/' + d.getFullYear();
            
            date.innerHTML = dateParsed;
            date.className = 'list-date',
            title.innerHTML = data.title;
            //description.innerHTML = data.description;
            divider1.innerHTML = '|';
            divider2.innerHTML = '|';

            image.src = getShipImage(data.picture);
            link.href = '#';


            
            documentContainer.appendChild(container);
            container.addEventListener('click', (e) => {
                loadSimulation(data.id);
            });
        })
    }

    const loadSimulation = (id) => {
        App.router.navigate(`/simulation/${id}`);
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