
import WebsocketIO from "../scripts/websocket.js";


/*

Examples:

{"ack": "post", 
    "obj": {"id": 15423, 
            "title": "Weniger Stress im Alltag? 6 Tipps vom Experten", 
            "date": "2023-07-01T16:09:09", 
            "modify_date": "2023-07-14T14:29:46", 
            "words": {"ab": 1, "aber": 7, "abhilfe": 1, "ablaufen": 1, "absolut": 1, "absolvieren": 1, "abstrakt": 2, "achten": 2, "achtest": 1, "achtsam": 1, "achtsamkeit": 4, "adrenalin": 1, "aktiv": 3, "aktivit\u00e4t": 1, ...
*/

class ProtocolIO{
    //websocket object
    #websocketIO = undefined;
    #eventCallback = undefined;

    // the received posts (array)
    #receivedPosts = undefined;
    // sets to store the ids of new and modified posts
    #pending_ids = new Set();

    // loop counter for post requests
    #loopCounter = 0;
    // copies for iterating
    #pending_ids_tmp = undefined;
    #received_ids = new Set();

    bindedProcessMessage = undefined;

    constructor(result, statusCallbackFn, eventCallbackFn){
        // create the Websocket object and store the callback functions
        let bindedProcessMessage = this.processMessage.bind(this);
        this.#websocketIO = new WebsocketIO(bindedProcessMessage, statusCallbackFn);

        //this.#websocketIO = new WebsocketIO(this.processMessage, statusCallbackFn);
        this.#receivedPosts = result;
        this.#eventCallback = eventCallbackFn;
    }

    get isIdle(){
        return (this.#loopCounter === 0) && ((this.#pending_ids_tmp === undefined) || (this.#pending_ids_tmp.size === 0));
    }


    // CLIENT --> {'req': 'id_list'}
    #requestIdList(){
        console.log('before0');
        const msgObj = {req: 'id_list'};
        const message = JSON.stringify(msgObj);
        console.log('before');
        this.#websocketIO.send(message);
        console.log('after');
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

    processMessage(message=undefined){
        console.log('processMessage: ', message);
        // if channel was used before, message should be defined
        if (message !== undefined){
            const obj = JSON.parse(message);
            let receivedId = undefined;

            // test if answer or a broadcast message
            if (obj['ack'] === undefined){
                // Broadcast
                // update the corresponding lists (add or remove elements)
                if (obj['new_posts'] !== undefined){
                    obj['new_posts'].forEach(element => { this.#pending_ids.add(element) });
                }
                if (obj['deleted_posts'] !== undefined){
                    let deleted_ids = new Set();
                    obj['deleted_posts'].forEach(element => { deleted_ids.add(element) });
                    // create a new dictionary where the listed elements are removed
                    const newReceivedPosts = this.#receivedPosts.filter((item) => !deleted_ids.has(item.id))
                    // update the UI
                    this.#receivedPosts = newReceivedPosts;

                    //call event handler...
                    this.#eventCallback();

                }
                if (obj['modified_posts'] !== undefined){
                    obj['modified_posts'].forEach(element => { this.#pending_ids.add(element) });
                }

                console.log('BROADCAST ', this.#pending_ids);
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
                            obj['obj'].forEach(post_id =>   {
                                                                // received id-s should be requested from the server
                                                                this.#pending_ids.add(post_id);
                                                                // store the posts without words --> they can be shown as skeletons
                                                                let tmpPost = {id: parseInt(post_id), words: undefined}
                                                                this.#receivedPosts.push(tmpPost);
                                                            });
                        }

                        console.log('ID_LIST', this.#pending_ids);
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
                                let idx = this.#receivedPosts.findIndex(item => item.id === receivedId);
                                if (idx > -1)
                                    this.#receivedPosts[idx] = post;
                                    //delete this.#receivedPosts[idx];
                                else
                                    this.#receivedPosts.push(post);
                            }                         
                        }

                        console.log('POST: ', obj['obj']);
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
            console.log('requestIdList0');
            this.#requestIdList();
            console.log('requestIdList1');
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
            // last received id can be removed from the set (if valid)
            if (removeId !== undefined){
                const id = String(removeId);
                
                //call event handler with the event id
                this.#eventCallback(id);

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
