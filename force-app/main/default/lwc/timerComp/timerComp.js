import { LightningElement, track, api } from 'lwc';


export default class Timer extends LightningElement {
    @api formattedtime = '00:30';
    @api dasharray = 283;
    @api remainingpathcolor = 'base-timer__path-remaining green';
}