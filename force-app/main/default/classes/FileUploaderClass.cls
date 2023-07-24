public with sharing class FileUploaderClass {
    /*
     * @method uploadFile() 
     * @desc Crée une version de contenu à partir d'une base64 et d'un nom de fichier donnés
     * 
     * @param {String} base64 - chaîne base64 qui représente le fichier
     * @param {String} filename - nom complet du fichier avec extension, par exemple 'products.csv'
     * @param {String} recordId - ID de l'enregistrement auquel vous souhaitez attacher ce fichier
     * 
     * @return {String} - retourne l'ID du ContentDocumentLink créé si le téléchargement a réussi, sinon retourne null
     */
    @AuraEnabled
    public static String uploadFile(String base64, String filename, String recordId) {
        ContentVersion cv = createContentVersion(base64, filename);
        ContentDocumentLink cdl = createContentLink(cv.Id, recordId);
        if (cv == null || cdl == null) { return null; }
        return cdl.Id;
    }
    
    /*
     * @method createContentVersion() [private]
     * @desc Crée une version de contenu à partir d'une base64 et d'un nom de fichier donnés
     * 
     * @param {String} base64 - chaîne base64 qui représente le fichier
     * @param {String} filename - nom complet du fichier avec extension, par exemple 'products.csv'
     * 
     * @return {ContentVersion} - retourne la nouvelle ContentVersion créée, ou null s'il y a eu une erreur lors de l'insertion de l'enregistrement
     */
    private static ContentVersion createContentVersion(String base64, String filename) {
        ContentVersion cv = new ContentVersion();
        cv.VersionData = EncodingUtil.base64Decode(base64);
        cv.Title = filename;
        cv.PathOnClient = filename;
        try {
            insert cv;
            return cv;
        } catch(DMLException e) {
            System.debug(e);
            return null;
        }
    }

    /*
     * @method createContentLink() [private]
     * @desc Crée un lien de contenu pour une ContentVersion donnée et un enregistrement donné
     * 
     * @param {String} contentVersionId - ID de la ContentVersion du fichier
     * @param {String} recordId - ID de l'enregistrement auquel vous souhaitez attacher ce fichier
     * 
     * @return {ContentDocumentLink} - retourne le nouveau ContentDocumentLink créé, ou null s'il y a eu une erreur lors de l'insertion de l'enregistrement
     */
    private static ContentDocumentLink createContentLink(String contentVersionId, String recordId) {
        if (contentVersionId == null || recordId == null) { return null; }
        ContentDocumentLink cdl = new ContentDocumentLink();
        cdl.ContentDocumentId = [
            SELECT ContentDocumentId 
            FROM ContentVersion 
            WHERE Id =: contentVersionId
        ].ContentDocumentId;
        cdl.LinkedEntityId = recordId;
        // ShareType est soit 'V', 'C' ou 'I'
        // V = Viewer, C = Collaborator, I = Inferred
        cdl.ShareType = 'V';
        try {
            insert cdl;
            return cdl;
        } catch(DMLException e) {
            System.debug(e);
            return null;
        }
    }
}