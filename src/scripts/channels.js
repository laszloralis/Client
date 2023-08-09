
// React elements
import { useState, useRef, useEffect, useLayoutEffect } from 'react'


//=========================================================
// Channel class
//=========================================================
class Channel {
    static #cnt = 0;
    static #channels = {};
    
    #clients = {};

    static openChannel(channelName){
        console.log('Channel.openChannel: ', channelName);
        const channelObj = new Channel(channelName);
        Channel.#channels[channelName] = channelObj;
        return channelObj;
    }

    static closeChannel(channelName){
        console.log('Channel.closeChannel: ', channelName);
        delete Channel.#channels[channelName];
    }

    static getChannel(channelName, autoCreate=false){
        let channel = Channel.#channels[channelName];

        if ((channel === undefined) && (autoCreate === true))
            channel = Channel.openChannel(channelName);

        return Channel.#channels[channelName];
    }

    static notify(channelName, id, message, supressErrors=false){
        if (message === undefined)
            message = `#${String(Channel.#cnt++)}`;

        const channel = Channel.#channels[channelName];
        //channel should be defined...
        if (channel !== undefined){
            const setter = channel.#clients[id];
            //setter should be defined too...
            if (setter !== undefined){
                console.log('Channel.notify: ', channelName, id, message);        
                setter(message);    
            } else {
                if (!supressErrors)
                    console.error(`useChannel Error: subscriber id: '${id}' not exists!`);
            }    
        } else {
            if (!supressErrors)
                console.error(`useChannel Error: channel: '${channelName}' not available!`);
        }
    }

    static logChannels(){
        console.log('Channels.logChannels: ', Channel.#channels);
    }
   

    constructor(){}
  
    register(id, setter){
        this.#clients[id] = setter;
    }

    unregister(id){
        delete this.#clients[id];
    }
}

//=========================================================
// ChannelRef class
//=========================================================
class ChannelRef{
    #name = '';

    constructor(name){ this.#name = name; }

    notify(id, message=undefined){
        Channel.notify(this.#name, id, message);
    }
}

//=========================================================
// Message class
//=========================================================
class Message{
    #stateObj = undefined;
    #refObj = undefined;

    constructor(state, ref){
        this.#stateObj = state;
        this.#refObj = ref;
    }

    isPending(){
        return (this.#stateObj !== this.#refObj.current)
    }

    get(){
        this.#refObj.current = this.#stateObj;
        return this.#stateObj;
    } 
}



//const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay))


//=========================================================
// createChannel
//=========================================================
function createChannel(channelName){
    let channelRef = new ChannelRef(channelName);

    //on register
    useLayoutEffect( () => {
        console.log(`Channels.createChannel '${channelName}' - useEffect`);
        // Always create a new channel (to avoid issues in React.StrictMode)
        Channel.openChannel(channelName);        
        Channel.logChannels();
        //on unregister
        return ( () => Channel.closeChannel(channelName) );
        },[]
    )
    
    return channelRef;
}


function createChannel1(channelName){
    //let channelObj = channels[chanelName];
    //const channelObj = useRef(channels[chanelName]);
    const [channelObj, setChannelObj] = useState(undefined);

    //on register
    useEffect( () => {
        console.log('Channels.createChannel - useEffect');
        // Always create a new channel (to avoid issues in React.StrictMode)
        const channel = Channel.openChannel(channelName)
        setChannelObj(channel);
        Channel.logChannels();
        //on unregister
        return ( () => Channel.closeChannel(channelName) );
        },[]
    )

    return channelObj;
}

//=========================================================
// getChannel
//=========================================================
function getChannel(chanelName){
    return Channel.getChannel(chanelName);
}

//=========================================================
// useChannel
//=========================================================
function useChannel(channelName, subscriberId, autoCreate=false){

    const [messageState, setMessageState] = useState('');
    const lastMessage = useRef('');
    const message = new Message(messageState, lastMessage);

    //on register
    useEffect( () => {
            const channel = Channel.getChannel(channelName, autoCreate);

            console.log(`Channels.useChannel '${channelName}' <-- '${subscriberId}' - useEffect`);

            if (channel !== undefined){        
                //channel[subscriberId] = setMessage;
                channel.register(subscriberId, setMessageState);
            } else {
                console.error(`useChannel Error: channelName '${channelName}' not exists! ( subscriber id: '${subscriberId}' )`);
            }
            //on unregister
            return ( () => {
                const channel = Channel.getChannel(channelName);
                if (channel !== undefined)
                    delete channel[subscriberId];
                }
            );
        }, []
    );

    return message;
}

export {Channel, createChannel, getChannel, useChannel};