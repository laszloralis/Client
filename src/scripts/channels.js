
// React elements
import { useState, useRef, useEffect } from 'react'


//=========================================================
// global channels dictionary
//=========================================================
let channels = {};

//=========================================================
// Channel class
//=========================================================
class Channel {
    #name = '';
    #clients = {};
    static #cnt = 0;
  
    constructor(name){ this.#name = name; }
  
    register(id, setter){
        this.#clients[id] = setter;
    }

    unregister(id){
        delete this.#clients[id];
    }
  
    notify(id, message=undefined){

        if (message === undefined){
            message = `${this.#name}_${String(Channel.#cnt++)}`;
        }

        const setter = this.#clients[id];
        //TODO TEST IT -- ERROR in LOG?
        if (setter !== undefined){
            console.log(id, setter);        
            setter(message);    
        } else {
            console.error(`useChannel Error: subscriber id: '${id} not exists!`);
        }
    }
  
    broadcast(message){
      for (const [id, setter] of Object.entries(this.#clients)) {
        //TODO TEST IT -- ERROR in LOG?
        if (setter !== undefined){
            console.log(id, setter);
            setter(message);    
        } else {
            console.error(`useChannel Error: internal error!`);
        }

      }
    }
}

class ChannelRef{
    #name = '';
    
    constructor(name){ this.#name = name; }

    notify(message){
        Channel.send(name, message);
    }

}


const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay))



//=========================================================
// createChannel
//=========================================================
function createChannel(chanelName){
    let channelObj = undefined;

    //on register
    useEffect( () => {
        // Always create a new channel (to avoid issues in React.StrictMode)
        channelObj = new Channel(chanelName);
        channels[chanelName] = channelObj;
        
        console.log('createChannel - useEffect');
        console.log(channels);
        //on unregister
        return ( () => delete channels[chanelName] );
        },[]
    )
    
    function waiting(){
        channelObj = channels[chanelName];
        if (channelObj === undefined)
            setTimeout(waiting, 200);
    }

    console.log('before get')
    waiting();
    console.log('after get')

    return channelObj;
}


function createChannel1(chanelName){
    //let channelObj = channels[chanelName];
    //const channelObj = useRef(channels[chanelName]);
    //const [channelObj, setChannelObj] = useState(undefined);

    //on register
    useEffect( () => {
        // Always create a new channel (to avoid issues in React.StrictMode)
        //channelObj = new Channel(chanelName);
        setChannelObj(new Channel(chanelName));
        channels[chanelName] = channelObj;
        
        console.log('createChannel - useEffect');
        console.log(channels);
        //on unregister
        return ( () => delete channels[chanelName] );
        },[]
    )

    return channelObj;
}

//=========================================================
// getChannel
//=========================================================
function getChannel(chanelName){
    const channelObj = channels[chanelName];
    return channelObj;
}

//=========================================================
// useChannel
//=========================================================
function useChannel(chanelName, subscriberId){

    const [message, setMessage] = useState('');

    //on register
    useEffect( () => {
            let channelObj = channels[chanelName];

            console.log('useChannel - useEffect');
            console.log(channelObj);

            if (channelObj !== undefined){        
                //channel[subscriberId] = setMessage;
                channelObj.register(subscriberId, setMessage);
            } else {
                console.error(`useChannel Error: channelName '${chanelName}' not exists! ( subscriber id: '${subscriberId}' )`);
            }
            //on unregister
            return ( () => {
                const channel = channels[chanelName];
                if (channel !== undefined)
                    delete channel[subscriberId];
                }
            );
        }, []
    );

    return message;
}

export {Channel, createChannel, getChannel, useChannel};