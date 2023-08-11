//#########################################################
// Imports
//#########################################################

//=========================================================
// Own Elements - import
//=========================================================
import WebsocketIO from "../scripts/websocket.js";
import {useChannel} from "../scripts/channels.js";

//=========================================================
// React Elements - import
//=========================================================
import { useEffect } from 'react'

//=========================================================
// Chakra Elements - import
//=========================================================
import {
  useToast,
} from '@chakra-ui/react'


//#########################################################
// Components and helper functions
//#########################################################

//=========================================================
// CommunicationStatus ( websocket I/O status - component )
//=========================================================
function CommunicationStatus(){
  const toast = useToast();
  // Channel definition
  const message = useChannel('WebsocketIO', 'Status', true);

  let status = undefined;
  let component = false;

  useEffect(() => {
    // Message handler (in useEffect to avoid warnings by render)
    status = message.get();
    //console.log('CommunicationStatus: NEW MESSAGE RECEIVED: ', status);

    // show the status messages
    switch(status){
      case WebsocketIO.CONNECTION_OPENED:
        toast.closeAll();
        component = (<> {toast({id: 100, title: 'Connected to the server!', status: 'success', duration: 5000, isClosable: true })} </>);
      break;

      case WebsocketIO.CONNECTION_ERROR:
        if (!toast.isActive(400)){
          component = (<> {toast({id: 400, title: 'Connection error!', status: 'error', duration: null, isClosable: true })} </>);
        }
      break;
      case WebsocketIO.CONNECTION_PERMANENT_ERROR:
        if (!toast.isActive(500)){
          toast.closeAll();
          component = (<> {toast({id: 500, title: 'Failed to connect - Connection will be established if server is available...', status: 'warning', duration: null, isClosable: true })} </>);
        }
      break;
    }

  },[message]);

  return component;
}

export default CommunicationStatus;
