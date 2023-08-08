//  Websocket
import { w3cwebsocket as W3CWebSocket } from "websocket";


class TestClass{
    #callbackFn = undefined;
    #counter = 0;

    constructor(callbackFn){
        this.#callbackFn = callbackFn;

        const self = this;
        setInterval(() => self.testFn() , 2500);
    }

    testFn(){
        this.#callbackFn(this.#counter++);
    }
}

class WebsocketIO{
    static CONNECTION_ERROR = -1;
    static CONNECTION_CLOSED = 0;
    static CONNECTION_OPENED = 1;

    static address = 'ws://127.0.0.1:8000';
    static timeout = 10000; //ms

    #client = undefined;
    #timeoutId = undefined;
    #statusCallbackFn = undefined;
    #protocolCallbackFn = undefined;

    constructor(protocolCallbackFn, statusCallbackFn){
        console.log('WebsocketIO.constructor');

        this.#client = new W3CWebSocket(WebsocketIO.address);
        this.#protocolCallbackFn = protocolCallbackFn;
        this.#statusCallbackFn = statusCallbackFn;
        //initialize the websocket callback functions
        this.#websocketCallbacks();
    }

    send(message){
        console.log('client: ', this.#client)
        this.#client.send(message);
    }

    #websocketCallbacks(){
        const self = this;

        // onopen
        this.#client.onopen = () => {
            console.log('ONOPEN');
            //notify the GUI about the success
            self.#statusCallbackFn(WebsocketIO.CONNECTION_OPENED);
            //call the protocol function
            self.#protocolCallbackFn();
        }

        // onmessage
        this.#client.onmessage = (message) => {
            console.log('ONMESSAGE');
            //call the protocol function
            self.#protocolCallbackFn(message.data);
        }

        // onerror
        this.#client.onerror = () => {
            console.log('ONERROR');
            //notify the GUI about the error
            self.#statusCallbackFn(WebsocketIO.CONNECTION_ERROR);
            //set a timeout
            if (this.#timeoutId !== undefined)
                clearInterval(this.#timeoutId);

            this.#timeoutId = setTimeout( () => self.#restartClient(), WebsocketIO.timeout);    
        }

    }

    #restartClient(){
        console.log('ws: timeout...');
        if (this.#client.readyState === this.#client.CLOSED){
            // restarting communication...
            console.log('ws: restarting communication...');
            this.#client = new W3CWebSocket(WebsocketIO.address);
        }
    }

}


export default WebsocketIO; //TestClass;
