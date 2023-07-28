//#########################################################
// Imports
//#########################################################

import './App.css'
import './protocol.js'

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
//  for websocket
//=========================================================
let client = new W3CWebSocket('ws://127.0.0.1:8000'); //localhost
let aliveId = -1;
let timeoutId = -1;


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

const words2 = [
  {id: getUniqueId(), text: 'lacikacska', count: 11},
  {id: getUniqueId(), text: 'fifkecske', count: 3},
  {id: getUniqueId(), text: 'zuzmoteacska', count: 45},
  {id: getUniqueId(), text: 'zuzmoteacska', count: 45},
  {id: getUniqueId(), text: 'zuzmoteacska', count: 45},
  {id: getUniqueId(), text: 'zuzmoteacska', count: 45},
  {id: getUniqueId(), text: 'zuzmoteacska', count: 45},
  {id: getUniqueId(), text: 'zuzmoteacska', count: 45},
  {id: getUniqueId(), text: 'zuzmoteacska', count: 45},
  {id: getUniqueId(), text: 'zuzmoteacska', count: 45},
  {id: getUniqueId(), text: 'zuzmoteacska', count: 45},
  {id: getUniqueId(), text: 'zuzmoteacska', count: 45},
  {id: getUniqueId(), text: 'zuzmoteacska', count: 45},
  {id: getUniqueId(), text: 'zuzmoteacska', count: 45},
  {id: getUniqueId(), text: 'zuzmoteacska', count: 45},
  {id: getUniqueId(), text: 'zuzmoteacska', count: 45},
  {id: getUniqueId(), text: 'zuzmoteacska', count: 45},
  {id: getUniqueId(), text: 'zuzmoteacska', count: 45},
  {id: getUniqueId(), text: 'zuzmoteacska', count: 45},
  {id: getUniqueId(), text: 'zuzmoteacska', count: 45},
  {id: getUniqueId(), text: 'zuzmoteacska', count: 45},
];

const initialBlogPosts = [
  new BlogPost('This is a blog post', words1),
  new BlogPost('This is another blog post', words2),
  new BlogPost('Not loaded blog post0', undefined),
  new BlogPost('Not loaded blog post1', undefined),
  new BlogPost('Not loaded blog post2', undefined),
  new BlogPost('Not loaded blog post3', undefined),
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
    <HStack key={value.id} flexShrink="0" spacing='2px'>
      <Button h='24px' border='1px' borderRightRadius='0px' onClick={details}>{value.text}</Button>
      <Tag h='24px' border='1px' bg='#00000011' borderLeftRadius='0px'>{value.count}</Tag>
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
  const color = !blogPost.readed ? '#F7FFF7' : '#F7F7F7';

  return ( 
    <AccordionItem key={blogPost.id} bgColor={color}>
      <h2>
        <AccordionButton color='black' >
          <Box as="span" flex='1' textAlign='left'>
            {blogPost.caption}
          </Box>
          <AccordionIcon />
        </AccordionButton>
      </h2>
      <AccordionPanel pb={4}>
      <HStack spacing='10px' overflowX="auto" pb='15px'>
          {renderWords(blogPost.dataElement)}
      </HStack>
      </AccordionPanel>
    </AccordionItem>
  )
}

//=========================================================
//  renderBlogPosts
//=========================================================
function renderBlogPosts(blogPosts){
  return blogPosts.map( (blogPost) => 
      blogPost.dataElement !== undefined ? renderLoadedPost(blogPost) : renderNotLoadedPost(blogPost)
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

  /*if (keepAlive > 0){
    console.log('keepAlive is', keepAlive);
  } else {
    //clearInterval(aliveId);
    //aliveId = -1;
    console.log('keepAlive is expired');
    //client.send('CLIENT: received!');
  }
*/

  client.onopen = () => {
    console.log('onopen')


    //let request = JSON.stringify({req: 'id_list'})
    let request = JSON.stringify({req: 'post', id:'15423'})
    client.send(request)
    


    toast.closeAll();
    setAlarm(0); clearInterval(timeoutId);
    return <>{toast({id: 100, title: 'Connected to the server!', status: 'success', duration: 5000, isClosable: true })}</>;
  };

  
  client.onmessage = (message) => {
    console.log('onmessage: ', message.data)
    
    let obj = JSON.parse(message.data)
    if (obj['ack'] === undefined){
      //broadcast
    } else {
      //ack
      switch(obj['ack']){
        case 'id_list': console.log('ID_LIST'); break;
        case 'post': console.log('POST'); break;
      }
    }

    let answerOrBroadcast = JSON.parse(message.data)
    console.log(answerOrBroadcast['new_posts'])

    
    let answer = JSON.stringify({req: 'ack'})
    client.send(answer);
  };
  
  client.onerror = function() {
    console.log('onerror')
    
    clearInterval(timeoutId);
    timeoutId = setTimeout( () => setAlarm((currentNumber) => currentNumber + 1), 10000);

    if ((alarm < 2) && (!toast.isActive(400)))
      return <>{toast({id: 400, title: 'Connection error!', status: 'error', duration: null, isClosable: true })} </>;
    else if (!toast.isActive(500)){
      toast.closeAll();
      return <>{toast({id: 500, title: 'Failed to connect - Connection will be established if server is available...', status: 'warning', duration: null, isClosable: true })} </>;
    }
  };
};


//#########################################################
// App
//#########################################################
function App() {
  const [blogPosts, setBlogPosts] = useState(initialBlogPosts);

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
          updatedItem.readed = true;
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
