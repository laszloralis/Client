//#########################################################
// Imports
//#########################################################

import './App.css'
import {ProtocolIO} from "./protocol.js";

import {Channel, createChannel, useChannel} from "./channels.js";

//  Websocket
import { w3cwebsocket as W3CWebSocket } from "websocket";

// React elements
import { useState, useRef, useEffect, useLayoutEffect, useTransition } from 'react'


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
    Text,
    Card, CardHeader, CardBody, Wrap, WrapItem,

    Skeleton,
    Spacer,
    Spinner,
    useToast,
    Flex, 
} from '@chakra-ui/react'

//we must use 'useDimensions' although it is marked as deprecated because 'useSize' is not awailable yet
import { useConst, useDimensions } from '@chakra-ui/react'

//#########################################################
// Globals
//#########################################################

//=========================================================
//  Websocket
//=========================================================
let client = new W3CWebSocket('ws://127.0.0.1:8000'); //localhost
let timeoutId = -1;

//=========================================================
// ProtocolIO
//=========================================================
let protocolIO = new ProtocolIO()

//=========================================================
// for accordionChanged function
//=========================================================
let accordionExpandedIndex_last = -1



//#########################################################
//  React Components and functions
//#########################################################

//=========================================================
//  Websocket Handler with ToastContainer
//=========================================================
let StateMessages = () => {
  const toast = useToast()

  const [alarm, setAlarm] = useState(0);
  //const [keepAlive, setKeepAlive] = useState(1);

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


//=========================================================
//  details
//=========================================================
function details(){
  console.log('details');
}

//=========================================================
// getWordCountColor(count)
//=========================================================
function getWordCountColor(count){
  //creating a static-like function variable
  if (getWordCountColor.colors === undefined)
    getWordCountColor.colors = {}
  const colors = getWordCountColor.colors;

  //key from count
  const color_key = String(count);
  //function to create random intensity in r,g,b channel
  function randomIntensity(){
    const minIntensity = 80; //0 .. 255
    const quantum = 10;
    //discreet values in range ~0..255 with quantum
    return ( Math.floor(minIntensity/quantum + Math.random() * ( (255 - minIntensity)/quantum ) ) * quantum ).toString(16);
  }
  //if we have a color to the count
  //  - use it!
  //  - otherwise create it!
  let color = colors[color_key];
  if (color === undefined){
    color = `#${randomIntensity()}${randomIntensity()}${randomIntensity()}`;
    colors[color_key] = color;
  }

  return color;
}

//=========================================================
//  Words
//=========================================================
function Word({word, count}){
  const color = getWordCountColor(count);

  return (
    <WrapItem>
      <HStack spacing='0px'>
        <Tag h='24px' border='1px' borderRightRadius='0px' >{word}</Tag>
        <Tag h='24px' borderTop='1px' borderRight='1px' borderBottom='1px' bg={color} borderLeftRadius='0px'>{count}</Tag>
      </HStack>
    </WrapItem>
  );
}
/*
      <Box borderRadius = '10px' border = '1px' spacing='2px' bg={color} pl='8px' pr='8px'>
        {word} : {count}
      </Box> 
*/

//=========================================================
// WordCard
//=========================================================
function WordCard({title, words}){
  const maxWidth = 150;   // only estimation, we don't need an exact value
  const padding = 10;
  const wordsPerRow = 10; // only estimation, we don't need an exact value

  return(
    <Card border='1px' minW='auto' >
      <CardHeader>
        <Heading> {title} </Heading>
      </CardHeader>
      <CardBody>
        <Wrap minW='min-content' w= {padding + words.length * maxWidth / Math.min(words.length, wordsPerRow) } direction='row' spacing='10px' justify='center'>
          {words.map((item) => <Word key={item[0]} word={item[0]} count={item[1]} /> )}
        </Wrap>
      </CardBody>
    </Card>
  );
}

//=========================================================
//  WordGroups
//=========================================================
function Words({words}){
  console.log('WordGroups')

  let components = [];

  let n = 0;
  while(n < words.length){
    const last = words[n][0];
    // split words to groups
    const group = words.filter( (item) => { const [word, count] = item; return (last[0] === word[0]); } );

    components.push(
      <WordCard key={last[0]} title={last[0]} words={group}/>
    );

    n += group.length;
  }

  return components;
}

//=========================================================
//  renderNotLoadedPost
//=========================================================
function PostSkeleton({post}){
  console.log('PostSkeleton ', post.id);
  const randomWidth = useConst( 150 + (Math.floor(Math.random() * 100.00)) );

  return (
    <AccordionItem isDisabled>
      <h2>
        <AccordionButton>
          <Skeleton border='1px' borderRadius='6px' w={randomWidth} h='25px'/>
          <Spacer/>
          <AccordionIcon />
        </AccordionButton>
      </h2>
    </AccordionItem>
  )
}

//=========================================================
//  LoadedPost
//=========================================================
function PostReady({post}){
  console.log('PostReady ', post.id);

  const newColor = '#F7FFF7';
  const oldColor = '#E0E0E0';

  const [isPending, startTransition] = useTransition();
  const [wordComponent, setWordComponent] = useState(undefined);

  const message = useChannel('blogPosts', post.id);
  const lastMessage = useRef(message);

  if (message !== lastMessage.current){
    console.log(post.id, ': NEW MESSAGE RECEIVED: ', message);
  }

  const handleClick = () => {
      if ( (wordComponent === undefined) && (post.words !== undefined) ){
        let data = null;
        startTransition(() => { data = <Words words = {post.words} /> } );
        setWordComponent(data);
      }
  };

  const color = (post.status !== 'old') ? newColor : oldColor;
  return (  <AccordionItem bgColor={color}>
              <h2>
                <AccordionButton visibility color='black' onClick={handleClick}>
                  <Box as="span" flex='1' textAlign='left'>
                    {post.title}
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
              </h2>
              <AccordionPanel pb={4} >
              
                <HStack spacing='10px' overflowX="auto" pb='15px' align='top'>
                  {isPending === false ? wordComponent : <Spinner key='spinner' />}
                </HStack>
              </AccordionPanel>
            </AccordionItem>
          );
}

//=========================================================
//  Post
//=========================================================
function Post({post}){
  return ((post.words !== undefined) ? <PostReady post={post} /> : <PostSkeleton post={post} />);
}


//=========================================================
//=========================================================
//=========================================================
//=========================================================


//=========================================================
//=========================================================
//=========================================================
//=========================================================

//=========================================================
//  BlogPosts
//=========================================================
function BlogPosts({posts}){
  const lastIdx = useRef(-1);
  
  const bpChannel = createChannel('blogPosts');

  const handleChg = (idx) => {
    console.log('idx: ', idx);
    console.log('last idx: ', lastIdx.current);

    if (lastIdx.current !== -1){
      console.log('post id ', posts[lastIdx.current].id);

      bpChannel.notify(posts[lastIdx.current].id);

      posts[lastIdx.current].status = 'old';
    }
    lastIdx.current = idx;
  }

  const components = posts.map( (blogPost) => <Post key = {blogPost.id} post = {blogPost} />);

  return(
    <Accordion w='95vw' h='90%'  allowToggle overflowX="auto" onChange={handleChg}>
      {components}
    </Accordion>
  );
}









let myList = [
  {id: '1', title:'csubi', words:[]},
  {id: '2', title:'subi', words:[]},
  {id: '3', title:'dubi', words:[]},
  {id: '4', title:'lala', words:[]},
  {id: '5', title:'lulu', words:[]},
  {id: '6', title:'lele', words:[]},
];

function BP({children}){

console.log(children);

  return <>{children}</>;

}

function TestComponent({name}){
  console.log('Testcomponent ', name, ' rendered!');
  return (<Text>{name}</Text>);
}


//#########################################################
// App
//#########################################################
function App() {
  //const [blogPosts, setBlogPosts] = useState([]);
  const [refresh, setRefresh] = useState(0);
  const [alarm, setAlarm] = useState(0);

  if (alarm > 0){
    console.log('alarm...:', alarm)
    if (client.readyState === client.CLOSED){
      console.log('new client started...')
      client = new W3CWebSocket('ws://127.0.0.1:8000'); //localhost
    }
  }

  useLayoutEffect(
    () => {
      //---------------------------------------------------------
      // initialization of protocolIO
      //---------------------------------------------------------
      //protocolIO.setPostDictionary(blogPosts, setBlogPosts)

      //---------------------------------------------------------
      //const [keepAlive, setKeepAlive] = useState(1);

      //---------------------------------------------------------
      client.onopen = () => {
        console.log('onopen')

        clearInterval(timeoutId);

        //clear posts
        //let posts = new Array();
        //setBlogPosts(posts)

        //request the id-list from server
        const request = protocolIO.requestIdList();
        //console.log('onopen REQ: ', request);
        client.send(request);
      };

      //---------------------------------------------------------
      client.onmessage = (message) => {
        //console.log('onmessage: ', message.data)

        if (protocolIO.isIdle)
          setRefresh( value => value + 1 );


        const response = protocolIO.processMessage(message.data);
        if (response !== undefined){
          //console.log('onmessage RESP: ', response);
          client.send(response);
        }

        clearInterval(timeoutId);

        //if (protocolIO.isIdle)
          setRefresh( value => value + 1 );

        //console.log('refresh :', refresh)

        //let posts = new Array(...protocolIO.receivedPosts);
        //setBlogPosts(posts)
      };

      //---------------------------------------------------------
      client.onerror = () => {
        console.log('onerror')
        
        clearInterval(timeoutId);
        timeoutId = setInterval( () => setAlarm((currentNumber) => currentNumber + 1), 10000);
      };
        
      //---------------------------------------------------------
    }, []
  )

  
//size='md'

//w='80vw'
//50px
  return (
    <Box h='90vh'>
      <Center  minH='10%'  color='#DDDDDD' border='1px' borderRadius='8px' mb='25px'>
        <Heading color='black' >Word counter for target www.thekey.academy wordpress blogposts</Heading>        
      </Center>

      <BlogPosts posts = {protocolIO.receivedPosts} />

    </Box>
  );
  //<WebSocketHandler messenger='sender1' />
}

/*
        <BP>
          { myList.map( (item) => <TestComponent key = {item.id} name = {item.title} />) }
          { myList.map( (item) => <TestComponent key = {item.id} name = {item.title} />) }
          { myList.map( (item) => <TestComponent key = {item.id} name = {item.title} />) }
          { myList.map( (item) => <TestComponent key = {item.id} name = {item.title} />) }
        </BP>
*/


export default App
