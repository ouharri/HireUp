import { LightningElement, api } from 'lwc';
// import axios from '@salesforce/resourceUrl/axios';
import flowbitejs from '@salesforce/resourceUrl/flowbitejs';
import flowbitecss from '@salesforce/resourceUrl/flowbitecss';
import { loadStyle, loadScript } from 'lightning/platformResourceLoader';
import quizePatternImage from '@salesforce/resourceUrl/quizePatternImage';


const url = 'https://online-code-compiler.p.rapidapi.com/v1/';
const options = {
    method: 'GET',
    headers: {
        'X-RapidAPI-Key': '50c8283de5msh9a363fa31f44eb7p1a0ad7jsn55c4b7c0c636',
        'X-RapidAPI-Host': 'online-code-compiler.p.rapidapi.com'
    }
};

export default class ProblemeSolvingComp extends LightningElement {
    @api language;
    imageBgLink;
    questions = ['', '', '', '', '', '', '', '', '', ''];

    renderedCallback() {
        Promise.all([
            // loadScript(this, axios),
            loadScript(this, flowbitejs),
            loadStyle(this, flowbitecss),
        ])
            .then(() => {
                // Code à exécuter après le chargement des ressources
            })
            .catch(error => {
                console.error('Erreur lors du chargement des ressources :', error);
            });
    }

    connectedCallback() {
        // this.getLanguage();
        this.imageBgLink = `background-image: linear-gradient(
            to left top,
            rgb(255, 255, 255, 0.7),
            rgb(252, 252, 252, 0.7)
        ),url('${quizePatternImage}')`;
    }


    async getLanguage() {
        try {
            const response = await fetch(url + 'languages/', options);
            const result = await response.text();
            console.log(result);
        } catch (error) {
            console.error(error);
        }
    }

   
}