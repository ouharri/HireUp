import { LightningElement } from 'lwc';
import flowbitejs from '@salesforce/resourceUrl/flowbitejs';
import flowbitecss from '@salesforce/resourceUrl/flowbitecss';
import { loadStyle, loadScript } from 'lightning/platformResourceLoader';

export default class Loader extends LightningElement {
    renderedCallback() {
        Promise.all([
            loadStyle(this, flowbitecss),
            loadScript(this, flowbitejs),
        ])
            .then(() => {
                // Code à exécuter après le chargement des ressources
            })
            .catch(error => {
                console.error('Erreur lors du chargement des ressources :', error);
            });
    }
}