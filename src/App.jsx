//#########################################################
// Imports
//#########################################################

import './App.css'
import {ProtocolIO} from "./protocol.js";

//  Websocket
import { w3cwebsocket as W3CWebSocket } from "websocket";

// React elements
import { useState } from 'react'
//import { useEffect } from 'react'

// Chakra Elements
import {
    HStack,
    Heading,
    Center,
    Accordion, 
    AccordionItem, 
    AccordionButton, 
    AccordionPanel, 
    AccordionIcon, 
    
    Box, 
    Tag, 
    Button,

    Skeleton,
    Spacer,
    useToast
} from '@chakra-ui/react'
         
//import { useBoolean} from '@chakra-ui/react'
//import { useControllableProp, useControllableState } from '@chakra-ui/react'


//#########################################################
// Globals
//#########################################################

//=========================================================
// for the Posts
//=========================================================
let receivedPosts = {}

//=========================================================
//  Websocket
//=========================================================
let client = new W3CWebSocket('ws://127.0.0.1:8000'); //localhost
let aliveId = -1;
let timeoutId = -1;

//=========================================================
// ProtocolIO
//=========================================================
let protocolIO = new ProtocolIO()

//=========================================================
// for accordionChanged function
//=========================================================
let accordionExpandedIndex_last = -1

//=========================================================
// getUniqueId function
//=========================================================
let globalBlogPostId = 0;
function getUniqueId(){
  return globalBlogPostId++;
}

//#########################################################
// TEMPORARIES
//#########################################################
class BlogPost{
  constructor(caption, wordList){
    this.id = getUniqueId();
    this.caption = caption;
    this.dataElement = wordList;
    this.updateCounter = 0;
    this.readed = false;
  }
};

const words1 = [
  {id: getUniqueId(), text: 'csubakka', count: 11},
  {id: getUniqueId(), text: 'bela', count: 3},
  {id: getUniqueId(), text: 'azaize', count: 45},
];

const initialBlogPosts = [
  new BlogPost('This is a blog post', words1),
];


//#########################################################
//  React Components and functions
//#########################################################

//=========================================================
//  details
//=========================================================
function details(){
  console.log('details');
}

//=========================================================
//  renderWords
//=========================================================
function renderWords(wordData){
  return wordData.map( (value) => 
  <Tag key={value[0]} flexShrink="0" spacing='2px'>
    {value[0]} : {value[1]}
  </Tag>
);
  


  return wordData.map( (value) => 
    <HStack key={value[0]} flexShrink="0" spacing='2px'>
      <Button h='24px' border='1px' borderRightRadius='0px' onClick={details}>{value[0]}</Button>
      <Tag h='24px' border='1px' bg='#00000011' borderLeftRadius='0px'>{value[1]}</Tag>
    </HStack>
  );
}

//=========================================================
//  renderNotLoadedPost
//=========================================================
function renderNotLoadedPost(blogPost){
  console.log('renderNotLoadedPost ', blogPost.id);
  //<Skeleton border='1px' borderRadius='6px' w={100 + (Math.floor(Math.random() * 100.00))} h='25px' />
  return (
    <AccordionItem key={blogPost.id} isDisabled>
      <h2>
        <AccordionButton>
          <Skeleton border='1px' borderRadius='6px' w='160px' h='25px' />
          <Spacer/>
          <AccordionIcon />
        </AccordionButton>
      </h2>
    </AccordionItem>
  )
}

//=========================================================
//  renderLoadedPost
//=========================================================
function renderLoadedPost(blogPost){
  console.log('renderLoadedPost ', blogPost.id);
  const color = blogPost.is_updated ? '#F7FFF7' : '#F7F7F7';

  return ( 
    <AccordionItem key={blogPost.id} bgColor={color}>
      <h2>
        <AccordionButton color='black' >
          <Box as="span" flex='1' textAlign='left'>
            {blogPost.title}
          </Box>
          <AccordionIcon />
        </AccordionButton>
      </h2>
      <AccordionPanel pb={4}>
      <HStack spacing='10px' overflowX="auto" pb='15px'>
          {renderWords(blogPost.words)}
      </HStack>
      </AccordionPanel>
    </AccordionItem>
  )
}

/*

Examples:

{"ack": "post", 
    "obj": {"id": 15423, 
            "title": "Weniger Stress im Alltag? 6 Tipps vom Experten", 
            "date": "2023-07-01T16:09:09", 
            "modify_date": "2023-07-14T14:29:46", 
            "words": {"ab": 1, "aber": 7, "abhilfe": 1, "ablaufen": 1, "absolut": 1, "absolvieren": 1, "abstrakt": 2, "achten": 2, "achtest": 1, "achtsam": 1, "achtsamkeit": 4, "adrenalin": 1, "aktiv": 3, "aktivit\u00e4t": 1, ...
*/

//=========================================================
//  renderBlogPosts
//=========================================================
function renderBlogPosts(blogPosts){
  return blogPosts.map( (blogPost) => 
      blogPost.id !== undefined ? renderLoadedPost(blogPost) : renderNotLoadedPost(blogPost)
  )
}

//=========================================================
//  Websocket Handler with ToastContainer
//=========================================================
let WebSocketHandler = () => {
  const toast = useToast()

  const [alarm, setAlarm] = useState(0);
  //const [keepAlive, setKeepAlive] = useState(1);

  if (alarm > 0){
    console.log('alarm...:', alarm)
    if (client.readyState === client.CLOSED){
      console.log('new client started...')
      client = new W3CWebSocket('ws://127.0.0.1:8000'); //localhost
      //setKeepAlive(1);
    }
  }

  //---------------------------------------------------------
  client.onopen = () => {
    console.log('onopen')

    // TODO!!! - clear receivedPosts

    //request the id-list from server
    const request = protocolIO.requestIdList();
    console.log('onopen REQ: ', request);
    client.send(request);

    toast.closeAll();
    setAlarm(0); clearInterval(timeoutId);
    return <>{toast({id: 100, title: 'Connected to the server!', status: 'success', duration: 5000, isClosable: true })}</>;
  };
  //---------------------------------------------------------
  client.onmessage = (message) => {
    console.log('onmessage: ', message.data)

    const response = protocolIO.processMessage(message.data);
    if (response !== undefined){
      console.log('onmessage RESP: ', response);
      client.send(response);
      return undefined;
    }
  };
  //---------------------------------------------------------
  client.onerror = function() {
    console.log('onerror')
    
    clearInterval(timeoutId);
    timeoutId = setTimeout( () => setAlarm((currentNumber) => currentNumber + 1), 1000);

    if ((alarm < 2) && (!toast.isActive(400)))
      return <>{toast({id: 400, title: 'Connection error!', status: 'error', duration: null, isClosable: true })} </>;
    else if (!toast.isActive(500)){
      toast.closeAll();
      return <>{toast({id: 500, title: 'Failed to connect - Connection will be established if server is available...', status: 'warning', duration: null, isClosable: true })} </>;
    }
  };
  //---------------------------------------------------------
};


//#########################################################
// App
//#########################################################
function App() {
  const [blogPosts, setBlogPosts] = useState([]);

  //---------------------------------------------------------
  // initialization of protocolIO
  //---------------------------------------------------------
  protocolIO.setPostDictionary(blogPosts, setBlogPosts)


  //---------------------------------------------------------
  // TEMPORARIES
  //---------------------------------------------------------
  function fn1(){
    console.log('fn1-1')
    let post = new BlogPost('Kutykurutty', [{id: getUniqueId(), text: 'lilaliba', count: 1}, {id: getUniqueId(), text: 'lalaluli', count: 2},]);
    const newBlogPosts = blogPosts.concat(post);
    console.log(newBlogPosts)
    setBlogPosts(newBlogPosts);
  }
  //---------------------------------------------------------
  function fn2(){    
    let newBlogPosts = blogPosts.map((item) => {
      if (item.id === 25) {
        let updatedItem = item;
        updatedItem.readed = false;
        return updatedItem;
      }
      return item;
    });
    setBlogPosts(newBlogPosts);
  }
  //---------------------------------------------------------
  function fn3(){
    const newBlogPosts = blogPosts.filter((item) => item.id !== blogPosts[blogPosts.length-1].id)
    setBlogPosts(newBlogPosts);
  }
  //---------------------------------------------------------

  //=========================================================
  // accordionChanged(index)
  // - to check and mark read elements
  //=========================================================
  function accordionChanged(index){
    if (accordionExpandedIndex_last >= 0){
      let id = blogPosts[accordionExpandedIndex_last].id
      let newBlogPosts = blogPosts.map((item) => {
        if (item.id === id) {
          //const updatedItem = {
          //  ...item,
          //  readed: true,
          //};
          let updatedItem = item;
          updatedItem.is_updated = true;
          return updatedItem;
        }
        return item;
      });
      setBlogPosts(newBlogPosts);
    }
    accordionExpandedIndex_last = index;
  }
  //=========================================================
 
  return (
    <div>
      <Center w='80vw' h='50px'  color='#DDDDDD' border='1px' borderRadius='8px' mb='25px'>
        <Heading size='md' color='black' >Word counter for target www.thekey.academy wordpress blogposts</Heading>        
      </Center>
      <Accordion onChange={(index) => accordionChanged(index) } w='80vw' allowToggle>
        {renderBlogPosts(blogPosts)}
      </Accordion>
      <Button onClick={fn1}>fn1</Button>
      <Button onClick={fn2}>fn2</Button>
      <Button onClick={fn3}>fn3</Button>
      <WebSocketHandler/>
    </div>
  );
}

export default App
