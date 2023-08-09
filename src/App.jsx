//#########################################################
// Imports
//#########################################################

import './App.css'

import CommunicationStatus from "./components/CommunicationStatus.jsx"
import ProtocolIO from "./scripts/protocol.js";
import PostStorage from './scripts/storage.js';
import {Channel, createChannel, useChannel} from "./scripts/channels.js";

// React elements
import { useState, useRef, useEffect, useTransition } from 'react'

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
    Text,
    Card, CardHeader, CardBody, Wrap, WrapItem,

    Skeleton,
    Spacer,
    Spinner,
} from '@chakra-ui/react'

//we must use 'useDimensions' although it is marked as deprecated because 'useSize' is not awailable yet
import { useConst, useDimensions } from '@chakra-ui/react'



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
function PostSkeleton({id}){
  console.log('PostSkeleton ', id);
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
//  Post
//=========================================================
function Post({post}){
  console.log('PostReady ', post.id);

  const newColor = '#F7FFF7';
  const newBorderColor = '#E7EFE7';

  const oldColor = '#E0E0E0';
  const oldBorderColor = '#C0C0C0';

  const oldPost = useRef(undefined);

  const [wordComponent, setWordComponent] = useState(undefined);
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
      if (  (wordComponent === undefined) || 
            (post.words !== oldPost.current.words) || 
            (post.title !== oldPost.current.title)
          )
      {
        let data = null;
        startTransition(() => { data = (<Words words = {post.words} />); setWordComponent(data); } );
        oldPost.current = post;
      }
  };

  const color = (post.status !== 'old') ? newColor : oldColor;
  const borderColor = (post.status !== 'old') ? newBorderColor : oldBorderColor;

  return (  <AccordionItem bgColor={color} ml='8px' mr='8px' mt='2px' mb='2px' border='0' borderColor={borderColor}>
              <h2>
                <AccordionButton visibility color='black' border='1px' borderColor={borderColor} onClick={handleClick} >
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
//  PostSelector
//=========================================================
function PostSelector({id}){
  console.log('PostSelector, key: ', id);

  const message = useChannel(PostStorage.CHANNEL_NAME, id, true);
  const post = useRef(undefined);

  if (message.isPending()){
    post.current = message.get();
    console.log(post.current.id, ': NEW MESSAGE RECEIVED: ', post.current);
  }

  return ((post.current !== undefined) ? <Post post={post.current} /> : <PostSkeleton id={id} />);
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
function BlogPosts(){
  const lastIdx = useRef(-1);
  const message = useChannel(PostStorage.CHANNEL_NAME, PostStorage.ID_LIST_NAME, true);

  let posts = undefined;

  if (message.isPending()){
    posts = message.get();
    console.log('idList: NEW MESSAGE RECEIVED: ', posts);
  }

  const handleChg = (idx) => {
    //console.log('idx, last idx: ', idx, lastIdx.current);
    if (lastIdx.current !== -1){
      const id = posts[lastIdx.current];
      console.log('post id ', id);
      // set status to 'old'
      if (PostStorage.getPost(id).status !== 'old'){
        const newPost = { ... PostStorage.getPost(id), status: 'old'};
        PostStorage.storePost(newPost);  
      }
    }
    lastIdx.current = idx;
  }

  const components = (posts !== undefined) ? posts.map( (postId) => <PostSelector key = {postId} id={postId} />) : [];

  return(
    <Accordion w='95vw' h='90%' allowToggle /*allowMultiple*/ overflowX="auto" onChange={handleChg} >
      {components}
    </Accordion>
  );
}

function TestComponent({name}){
  console.log('Testcomponent ', name, ' rendered!');
  return (<Text>{name}</Text>);
}

//#########################################################
// App
//#########################################################
function App() {
  console.log('App: ');

  //let protocolIO = undefined;

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
