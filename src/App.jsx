//#########################################################
// Imports
//#########################################################

import './App.css'

//=========================================================
// Own Elements - import
//=========================================================
import CommunicationStatus from "./components/CommunicationStatus.jsx"
import ProtocolIO from "./scripts/protocol.js";
import BlogPosts from "./components/BlogPosts.jsx";

//=========================================================
// React Elements - import
//=========================================================
import { useEffect } from 'react'

//=========================================================
// Chakra Elements - import
//=========================================================
import {
    Heading, Center, Box, 
} from '@chakra-ui/react'


//#########################################################
// App
//#########################################################
function App() {
  console.log('App: ');

  useEffect( () => {
    console.log('App.useEffect; Create ProtocolIO');
    // create the protocolIO object with the callback functions
    const protocolIO = new ProtocolIO();
    }, []
  );

  return (
    <Box h='90vh'>
      <Center  minH='10%'  color='#DDDDDD' border='1px' borderRadius='8px' mb='25px'>
        <Heading color='black' >Word counter for target www.thekey.academy wordpress blogposts</Heading>        
      </Center>
      <BlogPosts />
      <CommunicationStatus />
    </Box>
  );
}

export default App
