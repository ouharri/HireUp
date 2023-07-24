import { LightningElement, wire, track } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import flowbitejs from '@salesforce/resourceUrl/flowbitejs';
import flowbitecss from '@salesforce/resourceUrl/flowbitecss';
import validateToken from '@salesforce/apex/TokenManager.validateToken'; // Importez la méthode Apex

export default class QuizeLwc extends LightningElement {

    @track isQuizStarted = false;
    @wire(CurrentPageReference)
    getStateParameters(currentPageReference) {
        if (currentPageReference) {
            const token = currentPageReference.state?.token;
            this.validateToken(token);
        }
    };

    renderedCallback() {
        Promise.all([
            loadStyle(this, flowbitecss),
            loadScript(this, flowbitejs),
            loadScript(this, sweetalert),
        ])
            .then(() => {
            })
    }

    async validateToken(token) {
        if (token) {
            await validateToken({ encryptedToken: token })
                .then(result => {
                    if (result) {
                        this.handleValidToken();
                    } else {
                        this.handleInvalidToken();
                    }
                })
                .catch(error => {
                    console.error('Erreur lors de la validation du token :', error);
                });
        } else {
            this.handleNoToken();
        }
    }

    startQuiz() {
        this.isQuizStarted = true;
    }

    handleValidToken() {
        console.log('Token valide !');
    }

    handleInvalidToken() {
        console.error('Token invalide ou incomplet !');
    }

    handleNoToken() {
        console.error('Token non trouvé dans l\'URL !');
    }


}
