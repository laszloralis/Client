
import ProtocolIO from "../scripts/protocol.js";
import WebsocketIO from "../scripts/websocket.js";

import { useState, useRef, useEffect } from 'react'

// Chakra Elements
import {
  useToast,
} from '@chakra-ui/react'


function Communication({posts, eventDispatcher}){
  console.log('communication constructor!!!: ', posts);

  //const [status, setStatus] = useState(0);
  const counter = useRef(0);
  const toast = useToast();

  let protocolIO = undefined;
  let component = false;

  // callback function for Websocket-Status
  // used to show the status messages
  function statusCallbackFn(status){
    switch(status){
      case WebsocketIO.CONNECTION_OPENED:
        toast.closeAll();
        counter.current = 0;
        component = (<> {toast({id: 100, title: 'Connected to the server!', status: 'success', duration: 5000, isClosable: true })} </>);
        break;

      case WebsocketIO.CONNECTION_ERROR:
        if ((counter.current < 2) && (!toast.isActive(400)))
          component = (<> {toast({id: 400, title: 'Connection error!', status: 'error', duration: null, isClosable: true })} </>);
        else if (!toast.isActive(500)){
          toast.closeAll();
          component = (<> {toast({id: 500, title: 'Failed to connect - Connection will be established if server is available...', status: 'warning', duration: null, isClosable: true })} </>);
        }
        ++counter.current;
        break;
      }
  }

  useEffect( () => {
    console.log('communication useEffect!!!: ', posts);
    // create the protocolIO object with the callback functions
    protocolIO = new ProtocolIO(posts, statusCallbackFn, eventDispatcher);
    }, []
  );

  return component;
}

export default Communication;


/*
statusCallbackFn: (infos from ws IO)
 - change output regarding the status (trigger an update? ) - TOASTS

eventCallbackFn: (infos from protocol - posts)
 - NOTIFY the affected POST (we cah use the same channel as the 'BlogPosts' component)


 in useEffect ... 

  - create protocolIO obj

    const pr = new ProtocolIO(statusCallbackFn, eventCallbackFn);
                    - create WebsocketIO obj
                        const ws = new WebsocketIO(onConnectedCallbackFn, onReceivedCallbackFn);

deleted postnal blogPost-ot kell frissiteni...
new/update eseten magukat a postokat...

 */
