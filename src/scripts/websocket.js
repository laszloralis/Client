//#########################################################
// Imports
//#########################################################

import { w3cwebsocket as W3CWebSocket } from "websocket";

//=========================================================
// Own Elements - import
//=========================================================
import {Channel} from "../scripts/channels.js";


//#########################################################
// JS Classes and functions
//#########################################################

//=========================================================
// WebsocketIO class
//=========================================================
class WebsocketIO{
    static CHANNEL_NAME = 'WebsocketIO';
    static CONNECTION_PERMANENT_ERROR = -2;
    static CONNECTION_ERROR = -1;
    static CONNECTION_CLOSED = 0;
    static CONNECTION_OPENED = 1;

    static address = 'ws://127.0.0.1:8000';
    static timeout = 10000; //ms

    #client = undefined;
    #timeoutId = undefined;
    #timeOutCounter = 0;
    #errorCounter = 0;

    #protocolCallbackFn = undefined;



    constructor(protocolCallbackFn){
        console.log('WebsocketIO.constructor, cb: ', protocolCallbackFn);

        this.#client = new W3CWebSocket(WebsocketIO.address);
        this.#protocolCallbackFn = protocolCallbackFn;
        //initialize the websocket callback functions
        this.#websocketCallbacks();
    }


    send(message){
        console.log('WebsocketIO.SEND: ', message)
        this.#client.send(message);
    }


    #websocketCallbacks(){
        const self = this;

        // onopen
        this.#client.onopen = () => {
            console.log('WebsocketIO.ONOPEN');
            // notify the GUI about the success
            Channel.notify(WebsocketIO.CHANNEL_NAME, 'Status', WebsocketIO.CONNECTION_OPENED);
            // call the protocol function
            self.#protocolCallbackFn();
            // clear timeout
            this.#clearTimeout();
            // clear error counter
            this.#errorCounter = 0;
        }

        // onmessage
        this.#client.onmessage = (message) => {
            console.log('WebsocketIO.ONMESSAGE');
            // call the protocol function
            self.#protocolCallbackFn(message.data);
        }

        // onerror
        this.#client.onerror = () => {
            console.log('WebsocketIO.ONERROR');
                        
            // set a timeout
            this.#clearTimeout();
            // increment error counter
            ++this.#errorCounter;
            this.#timeoutId = setInterval( () => { self.#restartClient(); }, WebsocketIO.timeout);
            // notify the GUI about the error
            if (this.#errorCounter < 2)
                Channel.notify(WebsocketIO.CHANNEL_NAME, 'Status', WebsocketIO.CONNECTION_ERROR);
            else
                Channel.notify(WebsocketIO.CHANNEL_NAME, 'Status', WebsocketIO.CONNECTION_PERMANENT_ERROR);
        }
    }


    #restartClient(){
        console.log('WebsocketIO.restartClient : client timeout');
        if ( (this.#client.readyState === this.#client.CLOSED) || (this.#timeOutCounter > 5) ){
            // set a timeout
            this.#clearTimeout();
            //this.#timeOutCounter = 0;
            // restarting communication...
            console.log('WebsocketIO.restartClient: client is closed, restarting communication...');
            this.#client.close();
            this.#client = new W3CWebSocket(WebsocketIO.address);
            //initialize the websocket callback functions
            this.#websocketCallbacks();
        } else {
            ++this.#timeOutCounter;
        }
    }

    
    #clearTimeout(){
        if (this.#timeoutId !== undefined){
            clearInterval(this.#timeoutId);
            this.#timeoutId = undefined;
            this.#timeOutCounter = 0;
        }
    }

}


export default WebsocketIO; //TestClass;
