declare module "@salesforce/apex/TokenManager.getIdsFromToken" {
  export default function getIdsFromToken(param: {encryptedToken: any}): Promise<any>;
}
declare module "@salesforce/apex/TokenManager.validateToken" {
  export default function validateToken(param: {encryptedToken: any}): Promise<any>;
}
