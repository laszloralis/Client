
import WebsocketIO from "../scripts/websocket.js";
import PostStorage from "./storage.js";


class ProtocolIO{
    //websocket object
    #websocketIO = undefined;
    // sets to store the ids of new and modified posts
    #pending_ids = new Set();

    // loop counter for post requests
    #loopCounter = 0;
    // copies for iterating
    #pending_ids_tmp = undefined;
    #received_ids = new Set();

    constructor(){
        console.log('ProtocolIO.constructor');
        // create the Websocket object and store the callback functions
        const bindedProtocolCallback = this.processMessage.bind(this);
        this.#websocketIO = new WebsocketIO(bindedProtocolCallback);
    }

    get isIdle(){
        return (this.#loopCounter === 0) && ((this.#pending_ids_tmp === undefined) || (this.#pending_ids_tmp.size === 0));
    }


    // CLIENT --> {'req': 'id_list'}
    #requestIdList(){
        const msgObj = {req: 'id_list'};
        const message = JSON.stringify(msgObj);
        this.#websocketIO.send(message);
    }

    // CLIENT --> {'req': 'post', 'id': 14333}
    #requestPost(postId){
        const msgObj = {req: 'post', id: postId};
        const message = JSON.stringify(msgObj);
        this.#websocketIO.send(message);
    }

    #broadcastResponse(){
        const msgObj = {req: 'ack'};
        const message = JSON.stringify(msgObj);
        this.#websocketIO.send(message);
    }

    #addPosts(newPosts){
        if (newPosts.length > 0){
            //store the new placeholders and prepare pending_ids for receive
            newPosts.forEach(post_id =>   {
                // received id-s should be requested from the server
                this.#pending_ids.add(post_id);
                // store the posts without words --> they will be shown as skeletons
                const placeholderPost = {id: parseInt(post_id), words: undefined}
                PostStorage.storePost(placeholderPost, false);
            });
            PostStorage.closeTransaction();
        }
    }

    #deletePosts(deletedPosts){
        if (deletedPosts.length > 0){
            //delete posts
            deletedPosts.forEach(post_id =>   {
                // delete current id
                PostStorage.deletePost(parseInt(post_id), false);
            });
            PostStorage.closeTransaction();
        }
    }

    processMessage(message=undefined){
        console.log('ProtocolIO.processMessage: ', message);
        // if channel was used before, message should be defined
        if (message !== undefined){
            const obj = JSON.parse(message);
            let receivedId = undefined;

            // test if answer or a broadcast message
            if (obj['ack'] === undefined){
                // Broadcast
                // update the corresponding lists (add or remove elements)
                if (obj['new_posts'] !== undefined){
                    // new posts...
                    this.#addPosts(obj['new_posts']);
                }
                if (obj['deleted_posts'] !== undefined){
                    // deleted posts...
                    this.#deletePosts(obj['deleted_posts']);
                }
                if (obj['changed_posts'] !== undefined){
                    // modified posts...
                    obj['changed_posts'].forEach(element => { this.#pending_ids.add(element) });
                }

                console.log('ProtocolIO.processMessage: BROADCAST');
            } else {
                // Ack
                switch(obj['ack']){

                    /*
                    # =========================================================================
                    # SERVER --> {'ack': 'id_list', 'obj': [12345, 4321, ...]}
                    # (Returns the available id-s)
                    # ========================================================================= */
                    case 'id_list':  {                  
                        if (obj['obj'] !== undefined){
                            // new posts...
                            this.#addPosts(obj['obj']);
                        }

                        console.log('ProtocolIO.processMessage: ID_LIST');
                    }
                    break;

                    /*
                    # =========================================================================
                    # SERVER --> {'ack': 'post', 'obj': {'id': 17444, title: 'This is a title', status: ***, words: {...}}
                    # (Returns the requested post or 'None'/null if the post not exists)
                    # ========================================================================= */    
                    case 'post': {
                        if (obj['obj'] !== undefined){
                            const post = obj['obj'];
                            receivedId = post['id'];

                            if (receivedId != undefined){
                                //update (add or modify) the post
                                PostStorage.storePost(post);
                            }                         
                        }

                        console.log('ProtocolIO.processMessage: POST:', obj['obj']);
                    }
                    break;
                }
            }

            // - if pending_ids is not empty request the next post
            // - otherwise send broadcast response
            this.#updateNextPost(receivedId);

        // if message is not defined, then the channel was just opened
        // thus, the id list should be requested from the server
        } else {
            this.#requestIdList();
        }
    }


    #updateNextPost(removeId){
        //  If new and modified set is not empty we iterate throught them and 
        //  request the next post from the server.
        //  request pending (new and modified) posts
        //  - we create a temporary set (pending_ids_tmp) from the pending_ids set.
        //  - we request in every loop the first id in pending_ids_tmp from the server
        //    - the received id will be removed from pending_ids_tmp in the next loop
        //      (receivedPosts will be updated automatically in 'processMessage')
        //    - if pending_ids_tmp is empty, we finished the loop...
        if (this.#pending_ids.size > 0){
            //if there is the first loop we should create a work-copy from pending_ids
            //(pending_ids can be updated, meanwhile the loop still running)
            if (this.#loopCounter === 0){
                //create a union from the two sets
                this.#pending_ids_tmp = new Set([...this.#pending_ids]);
            }

            console.log('ProtocolIO.updateNextPost; pending: ',this.#pending_ids_tmp)


            // last received id can be removed from the set (if valid)
            if (removeId !== undefined){
                const id = String(removeId);
                //delete id from pending_ids_tmp
                let r = this.#pending_ids_tmp.delete(id);
                //and add it to received_ids
                this.#received_ids.add(id)
            }

            //has pending_ids_tmp any ids?
            if (this.#pending_ids_tmp.size > 0){
                //get the next id from the set
                const [next_id] = this.#pending_ids_tmp;
                //increment the loop counter
                this.#loopCounter++;
                //request it from the server
                this.#requestPost(next_id);
            } else {
                // all posts are received, we can filter our pending_ids and finish the loop
                let tmp = [...this.#pending_ids].filter((id) => !this.#received_ids.has(id))
                this.#pending_ids = new Set(tmp)
                //reinitalize the loop
                this.#loopCounter = 0;
            }
        } else {       
            //we can answer with a response or with undefined...
            this.#broadcastResponse();
        }
    }

}

export default ProtocolIO;
