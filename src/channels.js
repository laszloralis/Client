
// React elements
import { useState, useEffect } from 'react'


//=========================================================
// global channels dictionary
//=========================================================
let channels = {};

//=========================================================
// Channel class
//=========================================================
export class Channel {
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


//=========================================================
// createChannel
//=========================================================
export function createChannel(chanelName){
    let channelObj = channels[chanelName];

    //on register
    useEffect( () => {
        if (channelObj === undefined){
            channelObj = new Channel(chanelName);
            channels[chanelName] = channelObj;
        }
        
        console.log('createChannel - useEffect');
        console.log(channels);
        //on unregister
        return ( () => delete channels[chanelName] );
        },[]
    )

    return channelObj;
}
  
//=========================================================
// useChannel
//=========================================================
export function useChannel(chanelName, subscriberId){
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

